'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Twitter,
  MessageCircle,
  FileText,
  Bookmark,
  Share2,
  ExternalLink,
  ShieldCheck,
  Check,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { BadgePill } from '@/components/shared/badge-pill';
import { timeAgo } from '@/lib/format';
import type { NewsArticleItem, NewsSourceType } from '@/services/news/types';

interface NewsCardProps {
  article: NewsArticleItem;
  isBookmarked: boolean;
  onToggleBookmark: (articleId: string) => void;
  onSelectCategory?: (category: string) => void;
}

export function NewsCard({
  article,
  isBookmarked,
  onToggleBookmark,
  onSelectCategory,
}: NewsCardProps) {
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

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/news/${article.slug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleBookmark(article.id);
  };

  return (
    <GlassCard hover className="group relative flex flex-col justify-between p-5 transition-all duration-200">
      <div className="space-y-3">
        {/* Card Header: Source, Badges, Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-sm">
              {getSourceIcon(article.source_type)}
            </div>

            <div className="min-w-0">
              <span className="text-xs font-semibold text-white truncate block">
                {article.source}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {timeAgo(article.published_at)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {article.is_official ? (
              <BadgePill label="Official" variant="primary" />
            ) : article.is_verified ? (
              <BadgePill label="Verified" variant="success" />
            ) : (
              <BadgePill label="Community" variant="default" />
            )}

            <button
              onClick={handleBookmark}
              className={`rounded-lg border p-1.5 transition-all ${
                isBookmarked
                  ? 'border-primary/50 bg-primary/20 text-primary'
                  : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
              }`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark news'}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-primary' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-muted-foreground hover:bg-white/10 hover:text-white transition-all"
              title="Share article link"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Article Title */}
        <Link href={`/news/${article.slug}`} className="block group-hover:text-primary transition-colors">
          <h3 className="text-base font-bold text-white line-clamp-2 leading-snug">
            {article.title}
          </h3>
        </Link>

        {/* Short Summary */}
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
          {article.summary}
        </p>

        {/* Category & Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            onClick={() => onSelectCategory && onSelectCategory(article.category)}
            className="rounded-lg bg-white/5 hover:bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-500/20"
          >
            {article.category}
          </button>

          {article.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground border border-white/5"
            >
              #{tag}
            </span>
          ))}

          {article.ai_summary && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 ml-auto">
              <Sparkles className="h-3 w-3" /> AI Summary Ready
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3 text-xs">
        <Link
          href={`/news/${article.slug}`}
          className="flex items-center gap-1.5 font-medium text-primary hover:text-purple-300 transition-colors"
        >
          <span>Read Details</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>

        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-muted-foreground hover:text-white transition-colors"
        >
          <span>Original Source</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </GlassCard>
  );
}
