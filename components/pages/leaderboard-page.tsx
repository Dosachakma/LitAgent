'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Award,
  Crown,
  Search,
  Sparkles,
  Flame,
  CheckCircle2,
  TrendingUp,
  User,
  Shield,
  Clock,
  Layers,
} from 'lucide-react';
import { SectionTitle } from '@/components/shared/section-title';
import { GlassCard } from '@/components/shared/glass-card';
import { ContentLoader } from '@/components/shared/content-loader';
import { EmptyState } from '@/components/shared/empty-state';
import { BadgePill } from '@/components/shared/badge-pill';
import { useAuthStore } from '@/store/auth-store';
import { calculateLevel } from '@/lib/xp-config';
import { truncateAddress } from '@/lib/format';
import type { LeaderboardEntry } from '@/lib/types';
import { cn } from '@/lib/utils';

type Period = 'all' | 'weekly' | 'monthly';

export function LeaderboardPage() {
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const [period, setPeriod] = useState<Period>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const q = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(`/api/leaderboard?period=${period}${q}`);
      const data = await res.json();
      if (data.success && data.data) {
        setEntries(data.data);
      } else {
        setEntries([]);
      }
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [period, searchQuery]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const top3 = entries.slice(0, 3);
  const restEntries = entries.slice(3);

  // User's own entry if available
  const userEntry = currentUserId ? entries.find((e) => e.user_id === currentUserId) : null;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionTitle
          title="Ecosystem Leaderboard"
          subtitle="Top LitAgent pioneers ranked by validated ecosystem XP and streak performance"
          icon={<Trophy className="h-5 w-5" />}
        />

        {/* Epoch Indicator Badge */}
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3.5 py-1.5 border border-primary/20 text-xs font-semibold text-primary w-fit">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Epoch 1: Genesis Launch</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Period Tabs */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
          {(['all', 'weekly', 'monthly'] as Period[]).map((tab) => {
            const isActive = period === tab;
            return (
              <button
                key={tab}
                onClick={() => setPeriod(tab)}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-xs font-semibold transition-all capitalize',
                  isActive
                    ? 'bg-primary text-white shadow-md glow-primary'
                    : 'text-muted-foreground hover:text-white'
                )}
              >
                {tab === 'all' ? 'All Time' : tab}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search username or wallet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-xs text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Logged in User Spotlight Banner */}
      {userEntry && (
        <GlassCard className="p-4 border-primary/40 gradient-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white font-bold text-sm shadow-md">
              #{userEntry.rank}
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Your Rank Spotlight</p>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{userEntry.display_name}</span>
                <span className="text-[11px] font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  Lvl {userEntry.current_level}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Total XP
              </span>
              <p className="text-sm font-bold text-primary">
                {userEntry.total_xp.toLocaleString()} XP
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Missions
              </span>
              <p className="text-sm font-bold text-emerald-400">
                {userEntry.completed_missions}
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Top 3 Podium (if top3 exists) */}
      {!loading && top3.length > 0 && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* 2nd Place */}
          {top3[1] && (
            <GlassCard className="p-5 border-slate-400/30 text-center flex flex-col items-center justify-between order-2 md:order-1 relative overflow-hidden">
              <div className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-400/20 text-slate-300 font-bold text-xs border border-slate-400/30">
                2
              </div>
              <Crown className="h-8 w-8 text-slate-300 mt-2" />
              <div className="mt-3 space-y-1">
                <h3 className="font-bold text-white">{top3[1].display_name}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {top3[1].wallet_address ? truncateAddress(top3[1].wallet_address) : `@${top3[1].username}`}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 bg-slate-400/10 px-3 py-1 rounded-full border border-slate-400/20">
                <Award className="h-3.5 w-3.5 text-slate-300" />
                <span className="text-xs font-bold text-slate-200">{top3[1].total_xp.toLocaleString()} XP</span>
              </div>
            </GlassCard>
          )}

          {/* 1st Place Gold */}
          {top3[0] && (
            <GlassCard className="p-6 border-amber-500/50 text-center flex flex-col items-center justify-between order-1 md:order-2 relative overflow-hidden gradient-card shadow-xl glow-primary">
              <div className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 font-bold text-sm border border-amber-500/40">
                1
              </div>
              <Crown className="h-10 w-10 text-amber-400 mt-1 animate-pulse" />
              <div className="mt-3 space-y-1">
                <h3 className="text-lg font-extrabold text-white">{top3[0].display_name}</h3>
                <p className="text-xs text-amber-300 font-medium">
                  {top3[0].wallet_address ? truncateAddress(top3[0].wallet_address) : `@${top3[0].username}`}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 bg-amber-500/20 px-4 py-1.5 rounded-full border border-amber-500/40 shadow-md">
                <Trophy className="h-4 w-4 text-amber-300" />
                <span className="text-sm font-extrabold text-amber-200">
                  {top3[0].total_xp.toLocaleString()} XP
                </span>
              </div>
            </GlassCard>
          )}

          {/* 3rd Place Bronze */}
          {top3[2] && (
            <GlassCard className="p-5 border-amber-700/30 text-center flex flex-col items-center justify-between order-3 relative overflow-hidden">
              <div className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-700/20 text-amber-500 font-bold text-xs border border-amber-700/30">
                3
              </div>
              <Crown className="h-8 w-8 text-amber-600 mt-2" />
              <div className="mt-3 space-y-1">
                <h3 className="font-bold text-white">{top3[2].display_name}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {top3[2].wallet_address ? truncateAddress(top3[2].wallet_address) : `@${top3[2].username}`}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 bg-amber-700/10 px-3 py-1 rounded-full border border-amber-700/20">
                <Award className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-bold text-amber-300">{top3[2].total_xp.toLocaleString()} XP</span>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* Full Leaderboard Table */}
      {loading ? (
        <ContentLoader lines={6} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No leaderboard rankings found"
          description="Be the first ecosystem pioneer to complete missions and establish your rank on the global leaderboard!"
        />
      ) : (
        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 uppercase text-muted-foreground text-[10px] font-bold border-b border-white/8">
                <tr>
                  <th className="px-6 py-3.5">Rank</th>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Level</th>
                  <th className="px-6 py-3.5 text-right">Total XP</th>
                  <th className="px-6 py-3.5 text-right">Missions</th>
                  <th className="px-6 py-3.5 text-right">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {entries.map((entry) => {
                  const isSelf = currentUserId === entry.user_id;
                  const levelInfo = calculateLevel(entry.total_xp);

                  return (
                    <tr
                      key={entry.user_id}
                      className={cn(
                        'transition-colors hover:bg-white/5',
                        isSelf && 'bg-primary/10 font-medium'
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-bold">
                          {entry.rank === 1 && <span className="text-amber-400">🥇 #1</span>}
                          {entry.rank === 2 && <span className="text-slate-300">🥈 #2</span>}
                          {entry.rank === 3 && <span className="text-amber-600">🥉 #3</span>}
                          {entry.rank > 3 && <span className="text-muted-foreground">#{entry.rank}</span>}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-primary text-white font-bold text-xs">
                            {entry.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white flex items-center gap-1.5">
                              <span>{entry.display_name}</span>
                              {isSelf && (
                                <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded border border-primary/30 font-bold">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {entry.wallet_address ? truncateAddress(entry.wallet_address) : `@${entry.username}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white border border-white/10">
                          <span>{levelInfo.badge}</span>
                          <span>Level {levelInfo.level}</span>
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-primary text-sm">
                          {entry.total_xp.toLocaleString()} XP
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-emerald-400">
                          {entry.completed_missions}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                          <Flame className="h-3.5 w-3.5" />
                          {entry.streak}d
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
