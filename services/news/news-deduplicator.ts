import { NewsArticleItem } from './types';
import { computeContentHash } from './news-normalizer';

export class NewsDeduplicator {
  /**
   * Filter out duplicate articles from a incoming list against existing articles
   */
  static deduplicateArticles(
    incoming: NewsArticleItem[],
    existing: NewsArticleItem[]
  ): { unique: NewsArticleItem[]; duplicatesCount: number } {
    const existingExternalIds = new Set<string>();
    const existingUrls = new Set<string>();
    const existingHashes = new Set<string>();

    existing.forEach((art) => {
      if (art.external_id) existingExternalIds.add(art.external_id.toLowerCase());
      if (art.url) existingUrls.add(art.url.toLowerCase());
      const hash = computeContentHash(`${art.title}_${art.summary.slice(0, 50)}`);
      existingHashes.add(hash);
    });

    const unique: NewsArticleItem[] = [];
    let duplicatesCount = 0;

    const currentBatchKeys = new Set<string>();

    for (const article of incoming) {
      const extId = article.external_id.toLowerCase();
      const urlKey = article.url.toLowerCase();
      const hashKey = computeContentHash(`${article.title}_${article.summary.slice(0, 50)}`);

      const isDuplicate =
        existingExternalIds.has(extId) ||
        existingUrls.has(urlKey) ||
        existingHashes.has(hashKey) ||
        currentBatchKeys.has(extId) ||
        currentBatchKeys.has(hashKey);

      if (isDuplicate) {
        duplicatesCount++;
      } else {
        unique.push(article);
        existingExternalIds.add(extId);
        existingUrls.add(urlKey);
        existingHashes.add(hashKey);
        currentBatchKeys.add(extId);
        currentBatchKeys.add(hashKey);
      }
    }

    return { unique, duplicatesCount };
  }
}
