'use client';

import { useState, useEffect, use } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { NewsDetailView } from '@/components/news/news-detail-view';
import { ContentLoader } from '@/components/shared/content-loader';
import { EmptyState } from '@/components/shared/empty-state';
import { Newspaper } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import type { NewsArticleItem } from '@/services/news/types';

interface NewsDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function Page({ params }: NewsDetailPageProps) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const { user } = useAuthStore();
  const userId = user?.id || 'guest-local-user';

  const [article, setArticle] = useState<NewsArticleItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Load bookmarks
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`litagent_news_bookmarks_${userId}`);
      if (saved) {
        setBookmarkedIds(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load bookmarks:', e);
    }
  }, [userId]);

  const handleToggleBookmark = (articleId: string) => {
    let updated: string[];
    if (bookmarkedIds.includes(articleId)) {
      updated = bookmarkedIds.filter((id) => id !== articleId);
    } else {
      updated = [...bookmarkedIds, articleId];
    }
    setBookmarkedIds(updated);
    try {
      localStorage.setItem(`litagent_news_bookmarks_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save bookmarks:', e);
    }
  };

  useEffect(() => {
    async function loadArticle() {
      setLoading(true);
      try {
        const res = await fetch(`/api/news/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data);
        } else {
          setArticle(null);
        }
      } catch (err) {
        console.error('Error loading article:', err);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadArticle();
    }
  }, [slug]);

  return (
    <DashboardShell>
      {loading ? (
        <ContentLoader lines={8} />
      ) : !article ? (
        <EmptyState
          icon={Newspaper}
          title="Article Not Found"
          description="The requested news article or announcement could not be found."
        />
      ) : (
        <NewsDetailView
          article={article}
          isBookmarked={bookmarkedIds.includes(article.id)}
          onToggleBookmark={handleToggleBookmark}
        />
      )}
    </DashboardShell>
  );
}
