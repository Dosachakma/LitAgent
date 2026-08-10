import { BaseNewsProvider } from './news-provider';
import { NewsArticleItem, NewsProviderConfig } from './types';

export class DiscordNewsProvider extends BaseNewsProvider {
  config: NewsProviderConfig = {
    id: 'litvm-official-discord',
    name: 'Official LitVM Discord',
    source_type: 'discord',
    official_url: 'https://discord.gg/EVR5B3pNv',
    is_official: true,
    status: 'pending',
    last_sync_at: null,
    requires_credentials: true,
    error_message: 'Integration pending (Discord Bot Token & Channel ID required)',
  };

  async fetchArticles(): Promise<{
    articles: Partial<NewsArticleItem>[];
    status: NewsProviderConfig;
  }> {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID;

    if (!botToken || !channelId) {
      this.config.status = 'pending';
      this.config.error_message = 'Integration pending (DISCORD_BOT_TOKEN / DISCORD_ANNOUNCEMENTS_CHANNEL_ID not configured)';
      return {
        articles: [],
        status: { ...this.config },
      };
    }

    try {
      const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=10`, {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Discord API returned HTTP ${response.status}`);
      }

      const messages = await response.json();
      const articles: Partial<NewsArticleItem>[] = [];

      if (Array.isArray(messages)) {
        for (const msg of messages) {
          const content = msg.content || '';
          if (!content) continue;

          articles.push({
            source: '[OFFICIAL LITVM] Discord (#announcements)',
            source_type: 'discord',
            external_id: `discord-${msg.id}`,
            title: content.length > 80 ? content.slice(0, 80) + '...' : content,
            summary: content,
            content: content,
            url: `https://discord.com/channels/@me/${channelId}/${msg.id}`,
            published_at: msg.timestamp || new Date().toISOString(),
            is_official: true,
            is_verified: true,
            verification_status: 'Official',
            category: 'Official',
            tags: ['LitVM', 'Discord', 'Announcement'],
          });
        }
      }

      this.config.status = 'active';
      this.config.last_sync_at = new Date().toISOString();
      this.config.error_message = null;

      return {
        articles,
        status: { ...this.config },
      };
    } catch (err: unknown) {
      this.config.status = 'error';
      this.config.error_message = err instanceof Error ? err.message : 'Discord API error';
      return {
        articles: [],
        status: { ...this.config },
      };
    }
  }
}
