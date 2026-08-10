'use client';

import { GlassCard } from './glass-card';
import { cn } from '@/lib/utils';

interface ContentLoaderProps {
  className?: string;
  lines?: number;
}

export function ContentLoader({ className, lines = 3 }: ContentLoaderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <GlassCard key={i} className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 animate-pulse rounded bg-white/5" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-white/5" />
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
