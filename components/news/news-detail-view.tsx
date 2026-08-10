'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Globe,
  Twitter,
  MessageCircle,
  FileText,
  Bookmark,
  Share2,
  ExternalLink,
  Sparkles,
  Check,
  ShieldCheck,
  Boxes,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { BadgePill } from '@/components/shared/badge-pill';
import { timeAgo } from '@/lib/format';
import type { NewsArticleItem, NewsSourceType } from '@/services/news/types';

interface NewsDetailViewProps {
  article: NewsArticleItem;
  isBookmarked: boolean;
  onToggleBookmark: (articleId: string) => void;
}

export function NewsDetailView({
  article,
  isBookmarked,
  onToggleBookmark,
}: NewsDetailViewProps) {
  const [copied, setCopied] = useState(false);

  const getSourceIcon = (sourceType: NewsSourceType) => {
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10 hover:text-white transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to News Center
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleBookmark(article.id)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
              isBookmarked
                ? 'border-primary/50 bg-primary/20 text-primary'
                : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-primary' : ''}`} />
            <span>{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/10 hover:text-white transition-all"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">Copied Link</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Article Title & Metadata Card */}
      <GlassCard className="p-6 sm:p-8 space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-1 text-xs text-white">
              {getSourceIcon(article.source_type)}
              <span className="font-semibold">{article.source}</span>
            </div>

            {article.is_official ? (
              <BadgePill label="Official Source" variant="primary" />
            ) : (
              <BadgePill label="Verified Source" variant="success" />
            )}

            <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto" suppressHydrationWarning>
              <Calendar className="h-3.5 w-3.5" />
              {new Date(article.published_at).toLocaleDateString(undefined, {
                dateStyle: 'medium',
              })}{' '}
              ({timeAgo(article.published_at)})
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap gap-2 pt-1">
            <BadgePill label={article.category} variant="primary" />
            {article.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-muted-foreground border border-white/5"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Gemini AI Summary Box */}
        {article.ai_summary && (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-primary/20 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary glow-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Gemini AI Executive Summary
                </h3>
              </div>
              <BadgePill label="LitVM Grounded AI" variant="primary" />
            </div>

            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-medium">
              {article.ai_summary.short_summary}
            </p>

            {/* Key Points */}
            {article.ai_summary.key_points && article.ai_summary.key_points.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-300">
                  Key Takeaways
                </p>
                <ul className="space-y-1 text-xs text-zinc-300 list-disc list-inside">
                  {article.ai_summary.key_points.map((pt, idx) => (
                    <li key={idx} className="leading-snug">
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Why It Matters */}
            {article.ai_summary.why_it_matters && (
              <div className="rounded-xl bg-black/30 border border-primary/20 p-3 text-xs space-y-1">
                <p className="text-[10px] font-bold uppercase text-primary">Why It Matters</p>
                <p className="text-zinc-200">{article.ai_summary.why_it_matters}</p>
              </div>
            )}
          </div>
        )}

        {/* Original Article Content */}
        <div className="space-y-4 pt-2 border-t border-white/8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Official Announcement Details
          </h2>

          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-4 whitespace-pre-line">
            {article.content}
          </div>
        </div>

        {/* Related Projects */}
        {article.related_projects && article.related_projects.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-white/8">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary" /> Related LitVM Ecosystem Projects
            </p>

            <div className="flex flex-wrap gap-2">
              {article.related_projects.map((proj) => (
                <Link
                  key={proj}
                  href="/projects"
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:border-primary/50 hover:bg-white/10 transition-all"
                >
                  <Boxes className="h-3.5 w-3.5 text-primary" />
                  <span>{proj}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Documentation */}
        {article.related_docs && article.related_docs.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-white/8">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Related Network Documentation
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {article.related_docs.map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-200 hover:border-primary/50 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    <span className="font-medium">{doc.title}</span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* External Source Action CTA */}
        <div className="pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 rounded-b-2xl">
          <div>
            <p className="text-xs font-semibold text-white">
              Read complete raw release on {article.source}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Directly view on the official platform.
            </p>
          </div>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
          >
            <span>Visit Original Source</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </GlassCard>
    </div>
  );
}
