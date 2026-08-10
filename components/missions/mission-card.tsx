'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Target,
  Gift,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Lock,
  ExternalLink,
  Flame,
  Globe,
  Share2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { BadgePill } from '@/components/shared/badge-pill';
import { cn } from '@/lib/utils';
import type { Mission } from '@/lib/types';

interface MissionCardProps {
  mission: Mission;
  userId?: string;
  onComplete?: (missionId: string) => Promise<void>;
  isLoading?: boolean;
}

export function MissionCard({ mission, userId, onComplete, isLoading }: MissionCardProps) {
  const [completing, setCompleting] = useState(false);

  const getCategoryIcon = (category: string, type: string) => {
    if (type === 'DAILY_CHECKIN') return Flame;
    if (type.startsWith('SOCIAL')) return Share2;
    if (category === 'Ecosystem') return Globe;
    if (category === 'Special' || category === 'Campaign') return Sparkles;
    return Target;
  };

  const Icon = getCategoryIcon(mission.category, mission.type);

  const difficultyColors = {
    Easy: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    Medium: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    Hard: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
    Expert: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
  };

  const isCompleted = mission.status === 'completed';
  const isLocked = mission.status === 'locked';
  const isExpired = mission.status === 'expired';

  const handleAction = async () => {
    if (isCompleted || isLocked || isExpired || !onComplete) return;
    setCompleting(true);
    try {
      await onComplete(mission.id);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <GlassCard
      hover
      className={cn(
        'group relative flex flex-col justify-between p-5 transition-all duration-300 border-white/10 hover:border-primary/40',
        isCompleted && 'border-emerald-500/30 bg-emerald-950/10'
      )}
    >
      <div>
        {/* Header: Icon, Category & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 shadow-md',
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'gradient-primary text-white glow-primary'
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {mission.category}
                </span>
                <span className="text-white/20">•</span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                    difficultyColors[mission.difficulty] || difficultyColors.Easy
                  )}
                >
                  {mission.difficulty}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-primary transition-colors">
                {mission.title}
              </h3>
            </div>
          </div>

          {/* Status Badge */}
          {isCompleted ? (
            <BadgePill label="Completed" variant="success" icon={CheckCircle2} />
          ) : isLocked ? (
            <BadgePill label="Locked" variant="default" icon={Lock} />
          ) : isExpired ? (
            <BadgePill label="Expired" variant="error" icon={AlertCircle} />
          ) : (
            <BadgePill label="Active" variant="primary" icon={Sparkles} />
          )}
        </div>

        {/* Description */}
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {mission.description}
        </p>

        {/* Requirements / Info tags */}
        {mission.project_name && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-primary/80 bg-primary/10 px-2.5 py-1 rounded-lg w-fit border border-primary/20">
            <Globe className="h-3.5 w-3.5" />
            <span>Project: {mission.project_name}</span>
          </div>
        )}
      </div>

      {/* Footer: XP Reward & Actions */}
      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
        {/* XP Reward Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary border border-primary/25 glow-primary">
            <Gift className="h-3.5 w-3.5" />
            <span>+{mission.xp_reward || 50} XP</span>
          </div>

          {mission.end_at && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground" title="End Date">
              <Clock className="h-3 w-3 text-amber-400" />
              <span suppressHydrationWarning>{new Date(mission.end_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Action Button & Link to Detail */}
        <div className="flex items-center gap-2">
          <Link
            href={`/missions/${mission.id}`}
            className="rounded-lg p-2 text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
            title="View Mission Details"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>

          {!isCompleted && !isLocked && !isExpired && (
            <button
              onClick={handleAction}
              disabled={completing || isLoading}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-md transition-all gradient-primary hover:opacity-90 active:scale-95 disabled:opacity-50',
                completing && 'animate-pulse'
              )}
            >
              {completing ? (
                <>Verifying...</>
              ) : mission.type === 'DAILY_CHECKIN' ? (
                <>
                  <Flame className="h-3.5 w-3.5 text-amber-300" />
                  Check In
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Claim XP
                </>
              )}
            </button>
          )}

          {isCompleted && (
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Done
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
