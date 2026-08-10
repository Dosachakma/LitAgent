import { BaseNewsProvider } from './news-provider';
import { NewsArticleItem, NewsProviderConfig } from './types';

export class TelegramNewsProvider extends BaseNewsProvider {
  config: NewsProviderConfig = {
    id: 'litvm-official-telegram',
    name: 'Official LitVM Telegram',
    source_type: 'telegram',
    official_url: 'https://t.me/litecoinvm',
    is_official: true,
    status: 'pending',
    last_sync_at: null,
    requires_credentials: true,
    error_message: 'Integration pending (Telegram Bot API credentials required)',
  };

  async fetchArticles(): Promise<{
    articles: Partial<NewsArticleItem>[];
    status: NewsProviderConfig;
  }> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHANNEL_ID || '@litecoinvm';

    if (!botToken) {
      this.config.status = 'pending';
      this.config.error_message = 'Integration pending (TELEGRAM_BOT_TOKEN not configured)';
      return {
        articles: [],
        status: { ...this.config },
      };
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=10`);
      if (!response.ok) {
        throw new Error(`Telegram API returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const updates = data.result || [];
      const articles: Partial<NewsArticleItem>[] = [];

      for (const update of updates) {
        const msg = update.channel_post || update.message;
        if (!msg || !msg.text) continue;

        const text = msg.text;
        articles.push({
          source: '[OFFICIAL LITVM] Telegram (@litecoinvm)',
          source_type: 'telegram',
          external_id: `telegram-${msg.message_id}`,
          title: text.length > 80 ? text.slice(0, 80) + '...' : text,
          summary: text,
          content: text,
          url: 'https://t.me/litecoinvm',
          published_at: msg.date ? new Date(msg.date * 1000).toISOString() : new Date().toISOString(),
          is_official: true,
          is_verified: true,
          verification_status: 'Official',
          category: 'Official',
          tags: ['LitVM', 'Telegram', 'Announcement'],
        });
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
      this.config.error_message = err instanceof Error ? err.message : 'Telegram API error';
      return {
        articles: [],
        status: { ...this.config },
      };
    }
  }
}
