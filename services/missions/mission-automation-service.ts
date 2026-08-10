import { supabase } from '@/lib/supabase';
import type { NewsArticleItem } from '@/services/news/types';
import type { Mission } from '@/lib/types';

export class MissionAutomationService {
  /**
   * Process newly imported official news articles and auto-generate related missions
   */
  static async processNewArticles(articles: NewsArticleItem[]): Promise<Mission[]> {
    const enableAutoMissions =
      process.env.ENABLE_AUTO_MISSIONS === 'true' || process.env.ENABLE_AUTO_MISSIONS === '1';

    if (!enableAutoMissions) {
      console.log('Automated mission creation is currently disabled (ENABLE_AUTO_MISSIONS != true)');
      return [];
    }

    const createdMissions: Mission[] = [];

    const officialArticles = articles.filter((a) => a.is_official);
    if (officialArticles.length === 0) return [];

    const defaultLikeXp = Number(process.env.DEFAULT_LIKE_XP) || 5;
    const defaultRepostXp = Number(process.env.DEFAULT_REPOST_XP) || 10;
    const defaultReplyXp = Number(process.env.DEFAULT_REPLY_XP) || 15;
    const defaultQuoteXp = Number(process.env.DEFAULT_QUOTE_XP) || 20;

    for (const article of officialArticles) {
      try {
        const missionSlug = `mission-news-${article.slug.slice(0, 40)}`;

        // Check duplicate mission in Supabase
        if (supabase) {
          const { data: existing } = await supabase
            .from('missions')
            .select('id')
            .or(`slug.eq.${missionSlug},target_url.eq.${article.url}`)
            .maybeSingle();

          if (existing) {
            continue; // Already has automated mission
          }
        }

        const isXSource = article.source_type === 'x';
        const sourceLabel = article.source.includes('LITAGENT')
          ? '[OFFICIAL LITAGENT]'
          : '[OFFICIAL LITVM]';

        const xpReward = isXSource
          ? defaultRepostXp + defaultLikeXp + defaultReplyXp + defaultQuoteXp
          : 75;

        const newMission: Partial<Mission> = {
          id: `m-auto-${crypto.randomUUID()}`,
          slug: missionSlug,
          title: `${sourceLabel} Support: ${article.title.slice(0, 50)}`,
          description: `Stay informed and support official LitVM announcements: ${article.summary.slice(0, 120)}...`,
          type: isXSource ? 'REPOST_POST' : 'READ_NEWS',
          category: 'Official',
          difficulty: 'Easy',
          xp_reward: xpReward,
          status: 'available',
          verification_type: isXSource ? 'social_api' : 'database',
          requirements: [
            `Read and engage with official source: ${article.url}`,
            isXSource ? 'Automated X API verification required' : 'Database visit verification',
          ],
          is_active: true,
          project_name: 'LitVM Core',
          source: article.source,
          source_url: article.url,
          target_url: article.url,
          start_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        if (supabase) {
          const { data: inserted } = await supabase
            .from('missions')
            .upsert(
              {
                id: newMission.id,
                slug: newMission.slug,
                title: newMission.title,
                description: newMission.description,
                type: newMission.type,
                category: newMission.category,
                difficulty: newMission.difficulty,
                xp_reward: newMission.xp_reward,
                status: 'available',
                verification_type: newMission.verification_type,
                requirements: newMission.requirements,
                is_active: true,
                project_name: newMission.project_name,
                created_at: newMission.created_at,
              },
              { onConflict: 'slug' }
            )
            .select('*')
            .single();

          if (inserted) {
            createdMissions.push(inserted as Mission);
          }
        }
      } catch (err) {
        console.warn('Error auto-creating mission for news article:', err);
      }
    }

    return createdMissions;
  }
}
