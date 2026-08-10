import { NewsArticleItem, NewsProviderConfig } from './types';

export class NewsCache {
  private static articles: Map<string, NewsArticleItem> = new Map();
  private static providerStatuses: Map<string, NewsProviderConfig> = new Map();
  private static lastSyncTime: string | null = null;

  static getArticles(): NewsArticleItem[] {
    return Array.from(this.articles.values()).sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
  }

  static setArticles(items: NewsArticleItem[]): void {
    this.articles.clear();
    items.forEach((item) => {
      this.articles.set(item.id, item);
      if (item.slug) {
        this.articles.set(item.slug, item);
      }
    });
  }

  static addOrUpdateArticles(items: NewsArticleItem[]): void {
    items.forEach((item) => {
      this.articles.set(item.id, item);
      if (item.slug) {
        this.articles.set(item.slug, item);
      }
    });
  }

  static getArticleByIdOrSlug(idOrSlug: string): NewsArticleItem | undefined {
    return this.articles.get(idOrSlug);
  }

  static setProviderStatuses(statuses: NewsProviderConfig[]): void {
    statuses.forEach((s) => this.providerStatuses.set(s.id, s));
    this.lastSyncTime = new Date().toISOString();
  }

  static getProviderStatuses(): NewsProviderConfig[] {
    return Array.from(this.providerStatuses.values());
  }

  static getLastSyncTime(): string | null {
    return this.lastSyncTime;
  }
}
