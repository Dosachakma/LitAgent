'use client';

import { useState } from 'react';
import {
  X,
  RefreshCw,
  Shield,
  ShieldCheck,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Star,
  Settings,
  Database,
  Globe,
  Twitter,
  MessageCircle,
  FileText,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { BadgePill } from '@/components/shared/badge-pill';
import type { NewsArticleItem, NewsProviderConfig } from '@/services/news/types';

interface NewsAdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  providerStatuses: NewsProviderConfig[];
  articles: NewsArticleItem[];
  onSync: () => Promise<void>;
  onUpdateArticle: (id: string, updates: Partial<NewsArticleItem>) => void;
}

export function NewsAdminDrawer({
  isOpen,
  onClose,
  providerStatuses,
  articles,
  onSync,
  onUpdateArticle,
}: NewsAdminDrawerProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTriggerSync = async () => {
    setSyncing(true);
    setSyncResultMsg(null);
    try {
      await onSync();
      setSyncResultMsg('Sync completed successfully!');
    } catch (err: unknown) {
      setSyncResultMsg(
        `Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setSyncing(false);
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'blog':
        return <Globe className="h-4 w-4 text-purple-400" />;
      case 'x':
        return <Twitter className="h-4 w-4 text-sky-400" />;
      case 'telegram':
        return <MessageCircle className="h-4 w-4 text-sky-500" />;
      case 'discord':
        return <MessageCircle className="h-4 w-4 text-indigo-400" />;
      case 'docs':
        return <FileText className="h-4 w-4 text-emerald-400" />;
      default:
        return <Globe className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl h-full bg-zinc-950 border-l border-white/10 p-6 overflow-y-auto space-y-6">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-white">News Center Admin Controls</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-muted-foreground hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sync Trigger Action */}
        <GlassCard className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" /> Ingestion Engine
              </h3>
              <p className="text-xs text-muted-foreground">
                Fetch new announcements from all provider adapters.
              </p>
            </div>

            <button
              onClick={handleTriggerSync}
              disabled={syncing}
              className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50 hover:scale-105 transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Re-Sync All Sources'}</span>
            </button>
          </div>

          {syncResultMsg && (
            <p className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
              {syncResultMsg}
            </p>
          )}
        </GlassCard>

        {/* Provider Adapter Statuses */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Ingestion Provider Adapters
          </h3>

          <div className="space-y-2">
            {providerStatuses.map((prov) => (
              <GlassCard key={prov.id} className="p-3.5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 mt-0.5">
                    {getSourceIcon(prov.source_type)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{prov.name}</span>
                      {prov.is_official && <BadgePill label="Official" variant="primary" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{prov.official_url}</p>
                    {prov.error_message && (
                      <p className="text-[10px] text-amber-400/90 mt-1">
                        Status note: {prov.error_message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  {prov.status === 'active' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  ) : prov.status === 'pending' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      <AlertCircle className="h-3 w-3" /> Integration Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                      <X className="h-3 w-3" /> Error
                    </span>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Article Moderation List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Manage & Moderate Articles ({articles.length})
          </h3>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {articles.map((art) => (
              <GlassCard key={art.id} className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white line-clamp-1">
                    {art.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {art.source}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        onUpdateArticle(art.id, { is_official: !art.is_official })
                      }
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                        art.is_official
                          ? 'border-primary/50 bg-primary/20 text-primary'
                          : 'border-white/10 text-muted-foreground'
                      }`}
                    >
                      Official: {art.is_official ? 'YES' : 'NO'}
                    </button>

                    <button
                      onClick={() =>
                        onUpdateArticle(art.id, { is_featured: !art.is_featured })
                      }
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all flex items-center gap-1 ${
                        art.is_featured
                          ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                          : 'border-white/10 text-muted-foreground'
                      }`}
                    >
                      <Star className="h-3 w-3" />
                      Featured
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      onUpdateArticle(art.id, {
                        status: art.status === 'published' ? 'hidden' : 'published',
                      })
                    }
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                      art.status === 'published'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-red-500/30 bg-red-500/10 text-red-400'
                    }`}
                  >
                    {art.status === 'published' ? (
                      <>
                        <Eye className="h-3 w-3" /> Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" /> Hidden
                      </>
                    )}
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
