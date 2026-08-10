import { generateAIResponse } from '@/lib/ai/ai-router';
import { supabase } from '@/lib/supabase';
import { BlogNewsProvider } from './blog-provider';
import { DocsNewsProvider } from './docs-provider';
import { XNewsProvider } from './x-provider';
import { TelegramNewsProvider } from './telegram-provider';
import { DiscordNewsProvider } from './discord-provider';
import { normalizeArticle } from './news-normalizer';
import { NewsDeduplicator } from './news-deduplicator';
import { NewsCache } from './news-cache';
import { MissionAutomationService } from '@/services/missions/mission-automation-service';
import type {
  NewsArticleItem,
  NewsQueryFilters,
  NewsSyncResult,
  AISummaryData,
  NewsProviderConfig,
} from './types';

export class NewsService {
  private static providers = [
    new BlogNewsProvider(),
    new DocsNewsProvider(),
    new XNewsProvider(),
    new TelegramNewsProvider(),
    new DiscordNewsProvider(),
  ];

  /**
   * Synchronize all news sources, deduplicate, generate AI summaries, and save to DB/cache.
   */
  static async syncAllProviders(): Promise<NewsSyncResult> {
    let totalFetched = 0;
    let totalImported = 0;
    let totalDuplicates = 0;
    const providerStatuses: NewsProviderConfig[] = [];
    const newArticlesToNormalize: Partial<NewsArticleItem>[] = [];

    // 1. Run all providers
    for (const provider of this.providers) {
      try {
        const { articles, status } = await provider.fetchArticles();
        providerStatuses.push(status);
        totalFetched += articles.length;
        if (articles.length > 0) {
          newArticlesToNormalize.push(...articles);
        }
      } catch (err) {
        console.error(`Error running news provider ${provider.config.name}:`, err);
      }
    }

    NewsCache.setProviderStatuses(providerStatuses);

    // 2. Fetch existing articles from DB or Cache to perform deduplication
    const existing = await NewsService.fetchAllExistingArticles();

    // 3. Normalize new incoming articles
    const normalizedIncoming = newArticlesToNormalize.map((raw) => normalizeArticle(raw));

    // 4. Deduplicate
    const { unique, duplicatesCount } = NewsDeduplicator.deduplicateArticles(
      normalizedIncoming,
      existing
    );
    totalDuplicates = duplicatesCount;

    // 5. Generate AI Summaries for newly imported articles
    const processedArticles: NewsArticleItem[] = [];
    for (const art of unique) {
      if (!art.ai_summary) {
        art.ai_summary = await NewsService.generateAISummary(art);
      }
      processedArticles.push(art);
    }

    // 6. Persist to DB or Cache & Auto-Generate Missions
    if (processedArticles.length > 0) {
      await NewsService.persistArticles(processedArticles);
      totalImported = processedArticles.length;

      // Auto-generate related missions for newly imported official announcements
      try {
        await MissionAutomationService.processNewArticles(processedArticles);
      } catch (err) {
        console.warn('Auto mission generation skipped:', err);
      }
    }

    return {
      success: true,
      total_fetched: totalFetched,
      total_imported: totalImported,
      total_duplicates: totalDuplicates,
      provider_statuses: providerStatuses,
      synced_at: new Date().toISOString(),
    };
  }

  /**
   * Generate strict grounded AI Summary using Gemini -> AgentRouter AI architecture
   */
  private static async generateAISummary(article: NewsArticleItem): Promise<AISummaryData> {
    const systemPrompt = `You are LitAgent's official AI News Summarizer. Analyze the official announcement strictly based on the text provided.
Do NOT invent facts, fake token sales, fake rewards, fake dates, or unannounced partnerships.
Return ONLY valid JSON formatted as:
{
  "short_summary": "1-2 sentence concise executive summary",
  "key_points": ["Key point 1", "Key point 2", "Key point 3"],
  "why_it_matters": "1 concise sentence on significance for Litecoin & LitVM users",
  "related_areas": ["Area 1", "Area 2"]
}`;

    const userPrompt = `Title: ${article.title}
Source: ${article.source}
Content:
${article.content}`;

    try {
      const result = await generateAIResponse(systemPrompt, userPrompt);
      const text = result.text.trim();

      // Extract JSON if wrapped in markdown block
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const rawJson = jsonMatch ? jsonMatch[0] : text;

      const parsed = JSON.parse(rawJson);
      return {
        short_summary: parsed.short_summary || article.summary,
        key_points: Array.isArray(parsed.key_points) ? parsed.key_points : [article.summary],
        why_it_matters:
          parsed.why_it_matters ||
          'Important update regarding LitVM network specs and developer tooling.',
        related_areas: Array.isArray(parsed.related_areas) ? parsed.related_areas : article.tags,
      };
    } catch (err) {
      console.warn('AI summary generation fallback used:', err);
    }

    return {
      short_summary: article.summary,
      key_points: [
        'Official LitVM ecosystem release.',
        'Verified source documentation and network parameters.',
      ],
      why_it_matters:
        'Ensures developers and users stay informed about LitVM testnet features.',
      related_areas: article.tags || ['LitVM', 'Testnet'],
    };
  }

  /**
   * Fetch all existing articles from DB or Cache
   */
  private static async fetchAllExistingArticles(): Promise<NewsArticleItem[]> {
    const cached = NewsCache.getArticles();
    if (cached.length > 0) return cached;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('news_articles')
          .select('*')
          .order('published_at', { ascending: false });

        if (!error && data && data.length > 0) {
          NewsCache.setArticles(data as NewsArticleItem[]);
          return data as NewsArticleItem[];
        }
      } catch (e) {
        console.warn('Supabase news fetch skipped or empty:', e);
      }
    }

    return cached;
  }

  /**
   * Persist unique articles to Supabase & Cache
   */
  private static async persistArticles(articles: NewsArticleItem[]): Promise<void> {
    NewsCache.addOrUpdateArticles(articles);

    if (supabase) {
      try {
        await supabase.from('news_articles').upsert(
          articles.map((art) => ({
            id: art.id,
            source: art.source,
            source_type: art.source_type,
            external_id: art.external_id,
            title: art.title,
            slug: art.slug,
            summary: art.summary,
            content: art.content,
            url: art.url,
            image_url: art.image_url,
            published_at: art.published_at,
            fetched_at: art.fetched_at,
            is_official: art.is_official,
            is_verified: art.is_verified,
            is_featured: art.is_featured || false,
            verification_status: art.verification_status,
            category: art.category,
            tags: art.tags,
            status: art.status,
            ai_summary: art.ai_summary,
            related_projects: art.related_projects,
            related_docs: art.related_docs,
            created_at: art.created_at,
            updated_at: new Date().toISOString(),
          }))
        );
      } catch (err) {
        console.warn('Supabase news upsert fallback:', err);
      }
    }
  }

  /**
   * Query news with filters, search, sorting, and pagination
   */
  static async getArticles(filters: NewsQueryFilters = {}): Promise<{
    articles: NewsArticleItem[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    let all = await NewsService.fetchAllExistingArticles();

    // If cache & DB are both empty, run initial sync once
    if (all.length === 0) {
      await NewsService.syncAllProviders();
      all = NewsCache.getArticles();
    }

    // Filter published only by default
    let filtered = all.filter((a) => a.status === 'published');

    // Query Search
    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Category Filter
    if (filters.category && filters.category !== 'All') {
      filtered = filtered.filter(
        (a) =>
          a.category.toLowerCase() === filters.category!.toLowerCase() ||
          (filters.category === 'Official' && a.is_official)
      );
    }

    // Source Type Filter
    if (filters.source_type && filters.source_type !== 'all') {
      filtered = filtered.filter((a) => a.source_type === filters.source_type);
    }

    // Official Only Filter
    if (filters.official_only) {
      filtered = filtered.filter((a) => a.is_official);
    }

    // Saved / Bookmarked Only Filter
    if (filters.saved_only && filters.bookmarked_ids) {
      const bSet = new Set(filters.bookmarked_ids);
      filtered = filtered.filter((a) => bSet.has(a.id));
    }

    // Sort
    filtered.sort((a, b) => {
      const timeA = new Date(a.published_at).getTime();
      const timeB = new Date(b.published_at).getTime();
      return filters.sort_by === 'oldest' ? timeA - timeB : timeB - timeA;
    });

    const total = filtered.length;
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const totalPages = Math.ceil(total / limit) || 1;

    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      articles: paginated,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Get single article by slug or id
   */
  static async getArticleBySlug(slug: string): Promise<NewsArticleItem | null> {
    const all = await NewsService.fetchAllExistingArticles();
    const found = all.find((a) => a.slug === slug || a.id === slug);
    if (found) return found;

    if (supabase) {
      try {
        const { data } = await supabase
          .from('news_articles')
          .select('*')
          .or(`slug.eq.${slug},id.eq.${slug}`)
          .single();
        if (data) return data as NewsArticleItem;
      } catch (e) {
        console.warn('Error fetching article by slug:', e);
      }
    }

    return null;
  }

  /**
   * Admin status update
   */
  static async updateArticleStatus(
    id: string,
    updates: Partial<NewsArticleItem>
  ): Promise<boolean> {
    const article = NewsCache.getArticleByIdOrSlug(id);
    if (article) {
      Object.assign(article, updates, { updated_at: new Date().toISOString() });
      NewsCache.addOrUpdateArticles([article]);
    }

    if (supabase) {
      try {
        await supabase
          .from('news_articles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase news update failed:', err);
      }
    }

    return true;
  }
}
