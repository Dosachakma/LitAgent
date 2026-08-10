'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Newspaper,
  Search,
  Filter,
  Bookmark,
  Sparkles,
  RefreshCw,
  Settings,
  ShieldCheck,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import { SectionTitle } from '@/components/shared/section-title';
import { GlassCard } from '@/components/shared/glass-card';
import { EmptyState } from '@/components/shared/empty-state';
import { ContentLoader } from '@/components/shared/content-loader';
import { NewsCard } from '@/components/news/news-card';
import { NewsAdminDrawer } from '@/components/news/news-admin-drawer';
import { useAuthStore } from '@/store/auth-store';
import type {
  NewsArticleItem,
  NewsCategory,
  NewsSourceType,
  NewsProviderConfig,
} from '@/services/news/types';

const CATEGORIES: NewsCategory[] = [
  'All',
  'Official',
  'Announcements',
  'Ecosystem',
  'Developer',
  'Testnet',
  'Updates',
  'Partnerships',
  'Community',
];

export function NewsPage() {
  const { user } = useAuthStore();
  const userId = user?.id || 'guest-local-user';

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('All');
  const [selectedSourceType, setSelectedSourceType] = useState<NewsSourceType | 'all'>('all');
  const [officialOnly, setOfficialOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);

  // Data State
  const [articles, setArticles] = useState<NewsArticleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Bookmarks State (Sync with localStorage and Supabase)
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Admin Drawer State
  const [adminOpen, setAdminOpen] = useState(false);
  const [providerStatuses, setProviderStatuses] = useState<NewsProviderConfig[]>([]);

  // Load Bookmarks from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`litagent_news_bookmarks_${userId}`);
      if (saved) {
        setBookmarkedIds(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load bookmarks from localStorage:', e);
    }
  }, [userId]);

  // Save Bookmarks to LocalStorage
  const persistBookmarks = (ids: string[]) => {
    setBookmarkedIds(ids);
    try {
      localStorage.setItem(`litagent_news_bookmarks_${userId}`, JSON.stringify(ids));
    } catch (e) {
      console.warn('Failed to save bookmarks to localStorage:', e);
    }
  };

  const handleToggleBookmark = (articleId: string) => {
    let updated: string[];
    if (bookmarkedIds.includes(articleId)) {
      updated = bookmarkedIds.filter((id) => id !== articleId);
    } else {
      updated = [...bookmarkedIds, articleId];
    }
    persistBookmarks(updated);

    // Sync to API in background
    fetch('/api/news/bookmarks', {
      method: bookmarkedIds.includes(articleId) ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, news_id: articleId }),
    }).catch((e) => console.warn('Bookmark sync warning:', e));
  };

  // Fetch News Articles from API
  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('query', searchQuery);
      if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedSourceType && selectedSourceType !== 'all') params.set('source_type', selectedSourceType);
      if (officialOnly) params.set('official_only', 'true');
      if (savedOnly) {
        params.set('saved_only', 'true');
        if (bookmarkedIds.length > 0) {
          params.set('bookmarked_ids', bookmarkedIds.join(','));
        }
      }
      params.set('sort_by', sortBy);
      params.set('page', page.toString());
      params.set('limit', '8');

      const res = await fetch(`/api/news?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error loading news:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedSourceType, officialOnly, savedOnly, bookmarkedIds, sortBy, page]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Trigger Provider Re-Sync
  const handleSyncSources = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/news/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.provider_statuses) {
          setProviderStatuses(data.provider_statuses);
        }
        await fetchNews();
      }
    } catch (err) {
      console.error('Failed sync:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Update Article (Admin)
  const handleUpdateArticle = async (id: string, updates: Partial<NewsArticleItem>) => {
    setArticles((prev) =>
      prev.map((art) => (art.id === id ? { ...art, ...updates } : art))
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionTitle
          title="LitVM News Center"
          subtitle="Trusted ecosystem updates, developer releases, and official announcements"
          icon={<Newspaper className="h-5 w-5" />}
        />

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncSources}
            disabled={syncing}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
            title="Fetch latest updates from all providers"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Updates'}</span>
          </button>

          <button
            onClick={() => setAdminOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10 hover:text-white transition-all"
            title="Open Ingestion Admin Panel"
          >
            <Settings className="h-4 w-4 text-primary" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Quick Filters */}
      <GlassCard className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search news, tags, testnet updates..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-xs text-white placeholder-muted-foreground focus:border-primary focus:outline-none transition-all"
            />
          </div>

          {/* Source Dropdown, Official Toggle, Bookmarks Toggle, Sort */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Source Type Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={selectedSourceType}
                onChange={(e) => {
                  setSelectedSourceType(e.target.value as NewsSourceType | 'all');
                  setPage(1);
                }}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-900">All Sources</option>
                <option value="blog" className="bg-zinc-900">Official Blog</option>
                <option value="docs" className="bg-zinc-900">Official Docs</option>
                <option value="x" className="bg-zinc-900">Official X (@LitecoinVM)</option>
                <option value="telegram" className="bg-zinc-900">Telegram</option>
                <option value="discord" className="bg-zinc-900">Discord</option>
              </select>
            </div>

            {/* Official Only Toggle */}
            <button
              onClick={() => {
                setOfficialOnly(!officialOnly);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 font-medium transition-all ${
                officialOnly
                  ? 'border-primary/50 bg-primary/20 text-primary'
                  : 'border-white/10 bg-black/40 text-muted-foreground hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Official Only</span>
            </button>

            {/* Bookmarks Filter Tab */}
            <button
              onClick={() => {
                setSavedOnly(!savedOnly);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 font-medium transition-all ${
                savedOnly
                  ? 'border-primary/50 bg-primary/20 text-primary'
                  : 'border-white/10 bg-black/40 text-muted-foreground hover:bg-white/5'
              }`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${savedOnly ? 'fill-primary' : ''}`} />
              <span>Bookmarked ({bookmarkedIds.length})</span>
            </button>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'newest' | 'oldest');
                  setPage(1);
                }}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-zinc-900">Newest First</option>
                <option value="oldest" className="bg-zinc-900">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Horizontal Scroll Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-white/5 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? 'gradient-primary text-white shadow-md'
                    : 'border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Main Content View */}
      {loading ? (
        <ContentLoader lines={5} />
      ) : articles.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No verified LitVM updates available yet."
          description={
            savedOnly
              ? "You haven't bookmarked any news articles yet."
              : "Try adjusting your search query, source filters, or click 'Sync Updates' above."
          }
          action={{
            label: syncing ? 'Syncing...' : 'Sync News Sources',
            onClick: handleSyncSources,
          }}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                isBookmarked={bookmarkedIds.includes(article.id)}
                onToggleBookmark={handleToggleBookmark}
                onSelectCategory={(c) => setSelectedCategory(c as NewsCategory)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/8 pt-4">
              <span className="text-xs text-muted-foreground">
                Showing page {page} of {totalPages} ({total} articles)
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 hover:bg-white/10"
                >
                  Previous
                </button>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 hover:bg-white/10"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Control Drawer */}
      <NewsAdminDrawer
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        providerStatuses={providerStatuses}
        articles={articles}
        onSync={handleSyncSources}
        onUpdateArticle={handleUpdateArticle}
      />
    </div>
  );
}
