import { BaseNewsProvider } from './news-provider';
import { NewsArticleItem, NewsProviderConfig } from './types';

export class XNewsProvider extends BaseNewsProvider {
  config: NewsProviderConfig = {
    id: 'litvm-official-x',
    name: 'Official LitVM & LitAgent X (@LitecoinVM / @litagentvm)',
    source_type: 'x',
    official_url: 'https://x.com/LitecoinVM',
    is_official: true,
    status: 'pending',
    last_sync_at: null,
    requires_credentials: true,
    error_message: 'Integration pending (X / Twitter API Bearer Token required)',
  };

  async fetchArticles(): Promise<{
    articles: Partial<NewsArticleItem>[];
    status: NewsProviderConfig;
  }> {
    const apiKey =
      process.env.X_API_BEARER_TOKEN ||
      process.env.X_BEARER_TOKEN ||
      process.env.TWITTER_BEARER_TOKEN ||
      process.env.X_API_KEY;

    if (!apiKey) {
      this.config.status = 'pending';
      this.config.error_message = 'Integration pending (X API Bearer Token not configured in environment)';
      return {
        articles: [],
        status: { ...this.config },
      };
    }

    const handles = [
      { username: 'LitecoinVM', sourceLabel: '[OFFICIAL LITVM] X (@LitecoinVM)', urlPrefix: 'https://x.com/LitecoinVM' },
      { username: 'litagentvm', sourceLabel: '[OFFICIAL LITAGENT] X (@litagentvm)', urlPrefix: 'https://x.com/litagentvm' },
    ];

    const allArticles: Partial<NewsArticleItem>[] = [];

    try {
      for (const h of handles) {
        try {
          const response = await fetch(
            `https://api.twitter.com/2/users/by/username/${h.username}/tweets?tweet.fields=created_at,text,entities&max_results=5`,
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            }
          );

          if (!response.ok) {
            console.warn(`X API returned HTTP ${response.status} for ${h.username}`);
            continue;
          }

          const data = await response.json();
          const tweets = data.data || [];

          for (const tweet of tweets) {
            const cleanText = tweet.text || '';
            allArticles.push({
              source: h.sourceLabel,
              source_type: 'x',
              external_id: `x-tweet-${tweet.id}`,
              title: cleanText.length > 80 ? cleanText.slice(0, 80) + '...' : cleanText,
              summary: cleanText,
              content: cleanText,
              url: `${h.urlPrefix}/status/${tweet.id}`,
              published_at: tweet.created_at || new Date().toISOString(),
              is_official: true,
              is_verified: true,
              verification_status: 'Official',
              category: 'Official',
              tags: ['LitVM', 'X', 'Announcement', h.username],
            });
          }
        } catch (err) {
          console.warn(`Error fetching X handle ${h.username}:`, err);
        }
      }

      this.config.status = 'active';
      this.config.last_sync_at = new Date().toISOString();
      this.config.error_message = null;

      return {
        articles: allArticles,
        status: { ...this.config },
      };
    } catch (err: unknown) {
      this.config.status = 'error';
      this.config.error_message = err instanceof Error ? err.message : 'X API sync error';
      return {
        articles: allArticles,
        status: { ...this.config },
      };
    }
  }
}
