'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Newspaper,
  Search,
  Eye,
  EyeOff,
  Star,
  Trash2,
  ExternalLink,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { AdminHeader } from '@/components/admin/admin-header';
import { BadgePill } from '@/components/shared/badge-pill';
import { ConfirmationDialog } from '@/components/admin/confirmation-dialog';
import { useAuthStore } from '@/store/auth-store';
import type { NewsArticle } from '@/lib/types';

export default function AdminNewsPage() {
  const { user: currentAdmin } = useAuthStore();

  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Delete Target
  const [deleteTarget, setDeleteTarget] = useState<NewsArticle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/news?userId=${encodeURIComponent(currentAdmin?.id || '')}`);
      const data = await res.json();
      if (data.success && data.news) {
        setNewsList(data.news);
      }
    } catch (err) {
      console.error('Error loading news:', err);
    } finally {
      setLoading(false);
    }
  }, [currentAdmin?.id]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  async function toggleHidden(article: NewsArticle) {
    try {
      await fetch(`/api/admin/news/${article.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_hidden: !article.is_hidden,
          adminUserId: currentAdmin?.id,
          reason: `Toggled news article visibility`,
        }),
      });
      loadNews();
    } catch (err) {
      console.error('Toggle news visibility error:', err);
    }
  }

  async function handleDelete(reason?: string) {
    if (!deleteTarget || !reason) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/news/${deleteTarget.id}?adminUserId=${encodeURIComponent(
          currentAdmin?.id || ''
        )}&reason=${encodeURIComponent(reason)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Delete failed');

      setDeleteTarget(null);
      loadNews();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  const filteredNews = newsList.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.source.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-6">
      <AdminHeader
        title="News & Content Management"
        subtitle="Manage official LitVM news feeds, toggle article visibility, and feature key announcements."
        onRefresh={loadNews}
        refreshing={loading}
      />

      {/* Control Bar */}
      <GlassCard className="p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search news by title or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {filteredNews.length} Articles
        </div>
      </GlassCard>

      {/* News Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/5 text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3.5">Article Title</th>
                <th className="px-4 py-3.5">Source</th>
                <th className="px-4 py-3.5">Published At</th>
                <th className="px-4 py-3.5">Visibility</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredNews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No articles found matching your query.
                  </td>
                </tr>
              ) : (
                filteredNews.map((n) => (
                  <tr key={n.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5 max-w-md">
                      <div className="space-y-0.5">
                        <a
                          href={n.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-white hover:text-primary flex items-center gap-1.5 transition-colors"
                        >
                          <span className="truncate">{n.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                        </a>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{n.summary}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <BadgePill label={n.source} variant="secondary" />
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground font-mono text-[11px]" suppressHydrationWarning>
                      {new Date(n.published_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => toggleHidden(n)}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                          !n.is_hidden
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-destructive/20 text-destructive border border-destructive/30'
                        }`}
                      >
                        {!n.is_hidden ? (
                          <>
                            <Eye className="h-3 w-3" /> Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" /> Hidden
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setDeleteTarget(n)}
                        className="p-1.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 ml-auto"
                        title="Delete Article"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title={`Delete News Article: "${deleteTarget?.title}"`}
        description="Are you sure you want to permanently delete this news article?"
        confirmText="Delete Article"
        confirmVariant="danger"
        requireReason={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
