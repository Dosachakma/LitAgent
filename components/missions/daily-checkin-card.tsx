'use client';

import { useState, useEffect } from 'react';
import { Flame, CheckCircle2, Sparkles, Clock, Calendar } from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { cn } from '@/lib/utils';
import type { CheckinResult } from '@/lib/xp-service';

interface DailyCheckinCardProps {
  userId?: string;
  streakCount: number;
  lastCheckinDate: string | null;
  onCheckinSuccess?: (result: CheckinResult) => void;
}

export function DailyCheckinCard({
  userId,
  streakCount,
  lastCheckinDate,
  onCheckinSuccess,
}: DailyCheckinCardProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  const todayUTC = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (lastCheckinDate === todayUTC) {
      setCheckedInToday(true);
    } else {
      setCheckedInToday(false);
    }
  }, [lastCheckinDate, todayUTC]);

  // Countdown timer to 00:00 UTC
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
      );
      const diffMs = Math.max(0, nextUTC.getTime() - now.getTime());

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeUntilReset(
        `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCheckin = async () => {
    if (!userId) {
      setMessage('Please sign in to complete daily check-in.');
      return;
    }
    if (checkedInToday) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/missions/daily-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data: CheckinResult = await res.json();

      if (data.success) {
        setCheckedInToday(true);
        setMessage(data.message);
        if (onCheckinSuccess) onCheckinSuccess(data);
      } else {
        setMessage(data.message);
        if (data.alreadyCheckedIn) setCheckedInToday(true);
      }
    } catch {
      setMessage('Failed to execute check-in.');
    } finally {
      setLoading(false);
    }
  };

  // 7-day streak track simulation
  const daysTrack = [1, 2, 3, 4, 5, 6, 7];

  return (
    <GlassCard className="p-6 relative overflow-hidden border-primary/30 gradient-card">
      {/* Background glow effect */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Flame className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Daily Ecosystem Streak
            </span>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              <Clock className="h-3 w-3 text-primary" />
              <span suppressHydrationWarning>Reset in: {timeUntilReset || '00h 00m 00s'}</span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Check In Today</span>
            <span suppressHydrationWarning className="text-sm font-normal text-muted-foreground">
              (UTC Day: {todayUTC})
            </span>
          </h2>
          <p className="text-xs text-muted-foreground max-w-md">
            Earn +50 Base XP daily plus scaling streak bonuses. Maintain your streak to maximize seasonal epoch standing!
          </p>
        </div>

        {/* Right: Checkin CTA */}
        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          <button
            onClick={handleCheckin}
            disabled={checkedInToday || loading}
            className={cn(
              'flex h-12 w-full md:w-auto items-center justify-center gap-2 rounded-xl px-6 font-bold text-sm text-white shadow-lg transition-all',
              checkedInToday
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                : 'gradient-primary hover:opacity-90 active:scale-95 glow-primary'
            )}
          >
            {loading ? (
              <span className="animate-pulse">Checking in...</span>
            ) : checkedInToday ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Checked In Today!
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-amber-300" />
                Claim Daily +50 XP
              </>
            )}
          </button>

          {message && (
            <p className="text-xs font-medium text-amber-300 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 max-w-xs text-right">
              {message}
            </p>
          )}
        </div>
      </div>

      {/* 7-Day Streak Progress Bar */}
      <div className="mt-6 pt-5 border-t border-white/8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Streak Progress</span>
            <span className="text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 text-[11px]">
              🔥 {streakCount} Day Streak
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Base +50 XP • Max Bonus +100 XP
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {daysTrack.map((dayNum) => {
            const isCompletedDay = dayNum <= Math.min(streakCount, 7);
            const isCurrentTarget = dayNum === Math.min(streakCount + 1, 7);
            const bonus = (dayNum - 1) * 10;

            return (
              <div
                key={dayNum}
                className={cn(
                  'flex flex-col items-center justify-center py-2.5 rounded-xl border text-center transition-all',
                  isCompletedDay
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : isCurrentTarget
                    ? 'border-primary/50 bg-primary/20 text-white shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                    : 'border-white/5 bg-white/5 text-muted-foreground'
                )}
              >
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Day {dayNum}
                </span>
                <span className="mt-0.5 text-xs font-bold">
                  +{50 + Math.min(bonus, 100)}
                </span>
                {isCompletedDay && (
                  <CheckCircle2 className="mt-1 h-3.5 w-3.5 text-emerald-400" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
