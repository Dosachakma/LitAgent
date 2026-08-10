import { NewsArticleItem, NewsProviderConfig } from './types';

export abstract class BaseNewsProvider {
  abstract config: NewsProviderConfig;

  abstract fetchArticles(): Promise<{
    articles: Partial<NewsArticleItem>[];
    status: NewsProviderConfig;
  }>;

  getConfig(): NewsProviderConfig {
    return this.config;
  }
}
