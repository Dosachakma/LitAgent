'use client';

import { useEffect, useState, useCallback } from 'react';
import { Trophy, ShieldAlert, Lock, Calendar, Flame, Award } from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { AdminHeader } from '@/components/admin/admin-header';
import { BadgePill } from '@/components/shared/badge-pill';
import { useAuthStore } from '@/store/auth-store';
import { truncateAddress } from '@/lib/format';
import type { LeaderboardEntry } from '@/lib/types';

export default function AdminLeaderboardPage() {
  const { user: currentAdmin } = useAuthStore();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeframe, setTimeframe] = useState<'all_time' | 'weekly' | 'monthly'>('all_time');
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/leaderboard?userId=${encodeURIComponent(
          currentAdmin?.id || ''
        )}&timeframe=${timeframe}`
      );
      const data = await res.json();
      if (data.success && data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.error('Error loading admin leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [currentAdmin?.id, timeframe]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  return (
    <div className="flex-1 space-y-6 p-6">
      <AdminHeader
        title="Leaderboard Inspection"
        subtitle="Audit community rankings calculated dynamically from verified user XP records."
        onRefresh={loadLeaderboard}
        refreshing={loading}
      />

      {/* Security & Integrity Banner */}
      <GlassCard className="p-4 flex items-center justify-between gap-4 border-amber-500/20 bg-amber-500/5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Immutable Ranking Engine</h3>
            <p className="text-[11px] text-muted-foreground">
              Direct rank manipulation is disabled. Leaderboard standings reflect validated database XP totals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['all_time', 'monthly', 'weekly'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                timeframe === tf
                  ? 'gradient-primary text-white shadow'
                  : 'border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
              }`}
            >
              {tf.replace('_', ' ')}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Leaderboard Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/5 text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3.5">Rank</th>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Wallet Address</th>
                <th className="px-4 py-3.5">Level</th>
                <th className="px-4 py-3.5 text-right">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No leaderboard data available.
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry) => (
                  <tr key={entry.user_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs ${
                          entry.rank === 1
                            ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40'
                            : entry.rank === 2
                            ? 'bg-slate-300/20 text-slate-200'
                            : entry.rank === 3
                            ? 'bg-amber-700/20 text-amber-500'
                            : 'text-muted-foreground'
                        }`}
                      >
                        #{entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-white">
                      {entry.username || entry.display_name || 'User_' + entry.user_id.slice(0, 6)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-muted-foreground text-[11px]">
                      {entry.wallet_address ? truncateAddress(entry.wallet_address, 6) : 'Unlinked'}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-primary">
                      Level {Math.floor(Math.sqrt((entry.total_xp || 0) / 100)) + 1}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-amber-400 text-right">
                      {entry.total_xp.toLocaleString()} XP
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
