'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Target,
  Gift,
  Clock,
  CheckCircle2,
  Lock,
  ExternalLink,
  ShieldCheck,
  Globe,
  AlertCircle,
  Share2,
  Sparkles,
  Flame,
  Info,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { BadgePill } from '@/components/shared/badge-pill';
import { ContentLoader } from '@/components/shared/content-loader';
import { useAuthStore } from '@/store/auth-store';
import type { Mission } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MissionDetailPageProps {
  missionId: string;
}

export function MissionDetailPage({ missionId }: MissionDetailPageProps) {
  const { user } = useAuthStore();
  const userId = user?.id || '';

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadMission() {
      setLoading(true);
      try {
        const res = await fetch(`/api/missions/${missionId}?userId=${userId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setMission(data.data);
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadMission();
  }, [missionId, userId]);

  const handleComplete = async () => {
    if (!mission || completing) return;
    setCompleting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/missions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          missionId: mission.id,
          verificationContext: {
            userHasWallet: Boolean(user?.walletAddress),
            walletAddress: user?.walletAddress,
          },
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage(`🎉 ${data.message}`);
        setMission((prev) => (prev ? { ...prev, status: 'completed' } : prev));
      } else {
        setMessage(`⚠️ ${data.message}`);
      }
    } catch {
      setMessage('⚠️ Failed to verify mission completion.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link
          href="/missions"
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Missions</span>
        </Link>
        <ContentLoader lines={5} />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="space-y-6">
        <Link
          href="/missions"
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Missions</span>
        </Link>
        <GlassCard className="p-8 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Mission Not Found</h2>
          <p className="text-xs text-muted-foreground">
            The mission you requested does not exist or has been removed from the active ecosystem campaigns.
          </p>
        </GlassCard>
      </div>
    );
  }

  const isCompleted = mission.status === 'completed';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Link */}
      <Link
        href="/missions"
        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-white transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Missions Dashboard</span>
      </Link>

      {/* Main Mission Details Card */}
      <GlassCard className="p-8 space-y-6 border-primary/30 gradient-card">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl gradient-primary text-white shadow-xl glow-primary">
              <Target className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {mission.category}
                </span>
                <span className="text-white/20">•</span>
                <span className="text-xs font-medium text-amber-400">
                  {mission.difficulty} Difficulty
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">{mission.title}</h1>
            </div>
          </div>

          {/* XP Badge */}
          <div className="flex items-center gap-2 self-start">
            <div className="flex items-center gap-2 rounded-xl bg-primary/20 px-4 py-2 font-bold text-base text-primary border border-primary/30 shadow-lg glow-primary">
              <Gift className="h-5 w-5" />
              <span>+{mission.xp_reward || 50} XP</span>
            </div>
          </div>
        </div>

        {/* Status Message Toast */}
        {message && (
          <div className="rounded-xl bg-primary/20 border border-primary/40 p-4 text-sm font-medium text-white shadow-md">
            {message}
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Overview
          </h3>
          <p className="text-sm text-white/90 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/8">
            {mission.description}
          </p>
        </div>

        {/* Requirements Checklist */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Requirements
          </h3>
          <div className="space-y-2">
            {Array.isArray(mission.requirements) && mission.requirements.length > 0 ? (
              mission.requirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-white bg-white/5 p-3 rounded-lg border border-white/5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>{String(req)}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2.5 text-xs text-white bg-white/5 p-3 rounded-lg border border-white/5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>Complete the required task and verify server-side.</span>
              </div>
            )}
          </div>
        </div>

        {/* Verification Method Note */}
        <div className="rounded-xl bg-white/5 p-4 border border-white/10 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <ShieldCheck className="h-4 w-4" />
            <span>Verification Method: {mission.verification_type.toUpperCase()}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {mission.verification_type === 'social_api'
              ? 'Social platform verification requires automated API confirmation. XP will only be awarded when legitimately verified.'
              : 'Server-side verification confirms your interaction with the LitVM ecosystem before awarding XP.'}
          </p>
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-muted-foreground" suppressHydrationWarning>
            {mission.end_at ? `Deadline: ${new Date(mission.end_at).toLocaleDateString()}` : 'No Expiration'}
          </div>

          <button
            onClick={handleComplete}
            disabled={isCompleted || completing}
            className={cn(
              'flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-sm text-white shadow-xl transition-all',
              isCompleted
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                : 'gradient-primary hover:opacity-90 active:scale-95 glow-primary'
            )}
          >
            {completing ? (
              <span>Verifying...</span>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Mission Completed
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-amber-300" />
                Verify & Claim +{mission.xp_reward} XP
              </>
            )}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
