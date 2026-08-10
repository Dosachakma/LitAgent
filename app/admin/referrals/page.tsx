'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Share2,
  CheckCircle2,
  Clock,
  Award,
  AlertTriangle,
  Search,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { AdminHeader } from '@/components/admin/admin-header';
import { BadgePill } from '@/components/shared/badge-pill';
import { ConfirmationDialog } from '@/components/admin/confirmation-dialog';
import { useAuthStore } from '@/store/auth-store';
import { truncateAddress } from '@/lib/format';
import type { AdminReferralsSummary } from '@/lib/admin-service';
import type { ReferralRecord } from '@/lib/types';

export default function AdminReferralsPage() {
  const { user } = useAuthStore();

  const [data, setData] = useState<AdminReferralsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Status Change Dialog State
  const [targetReferral, setTargetReferral] = useState<ReferralRecord | null>(null);
  const [targetNewStatus, setTargetNewStatus] = useState<'qualified' | 'invalid' | 'pending'>('invalid');
  const [processing, setProcessing] = useState(false);

  const loadReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/referrals?userId=${encodeURIComponent(user?.id || '')}`);
      const result = await res.json();
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Error loading admin referrals:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  async function handleStatusChange(reason?: string) {
    if (!targetReferral || !reason) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/referrals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralId: targetReferral.id,
          status: targetNewStatus,
          adminUserId: user?.id,
          reason,
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Status update failed');

      setTargetReferral(null);
      loadReferrals();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setProcessing(false);
    }
  }

  const filteredHistory = (data?.history || []).filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.referral_code.toLowerCase().includes(search.toLowerCase()) ||
      r.referrer_user_id.toLowerCase().includes(search.toLowerCase()) ||
      r.referred_user_id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 space-y-6 p-6">
      <AdminHeader
        title="Referral Management"
        subtitle="Track referral conversion, top referrers, and audit referral qualification claims."
        onRefresh={loadReferrals}
        refreshing={loading}
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Referrals</span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Share2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">{data?.totalReferrals ?? 0}</p>
        </GlassCard>

        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Successful Conversions</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">{data?.successfulReferrals ?? 0}</p>
        </GlassCard>

        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pending Claims</span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">{data?.pendingReferrals ?? 0}</p>
        </GlassCard>

        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Referral XP Distributed</span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-400 font-mono">
            +{(data?.referralXpAwarded ?? 0).toLocaleString()} XP
          </p>
        </GlassCard>
      </div>

      {/* Top Referrers Panel */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-white">Top Community Referrers</h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">Real-time DB aggregate</span>
        </div>

        {(!data?.topReferrers || data.topReferrers.length === 0) ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No referrers logged yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.topReferrers.map((ref, idx) => (
              <div
                key={ref.referrer_user_id}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary font-mono">#{idx + 1} Rank</span>
                  <span className="text-xs font-extrabold text-white font-mono">{ref.count} invites</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate">{ref.username}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    {truncateAddress(ref.wallet, 4)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Referral History Table */}
      <GlassCard className="p-0 overflow-hidden space-y-0">
        <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search referral code, referrer ID or referred ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Qualified">Qualified / Rewarded</option>
            <option value="Pending">Pending</option>
            <option value="Invalid">Invalid / Disqualified</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/5 text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3.5">Referral Code</th>
                <th className="px-4 py-3.5">Referrer</th>
                <th className="px-4 py-3.5">Referred User</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Created Date</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No referral records match your filters.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-primary">
                      {r.referral_code}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-white text-[11px]">
                        {truncateAddress(r.referrer_user_id, 6)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-white text-[11px]">
                        {truncateAddress(r.referred_user_id, 6)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <BadgePill
                        label={r.status.toUpperCase()}
                        variant={
                          r.status === 'qualified' || r.status === 'rewarded'
                            ? 'success'
                            : r.status === 'pending'
                            ? 'warning'
                            : 'secondary'
                        }
                      />
                    </td>
                    <td className="px-4 py-3.5 font-mono text-muted-foreground text-[11px]" suppressHydrationWarning>
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {r.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setTargetReferral(r);
                              setTargetNewStatus('qualified');
                            }}
                            className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          >
                            Mark Qualified
                          </button>
                          <button
                            onClick={() => {
                              setTargetReferral(r);
                              setTargetNewStatus('invalid');
                            }}
                            className="rounded-lg bg-destructive/20 px-2.5 py-1 text-[10px] font-bold text-destructive hover:bg-destructive/30 transition-colors"
                          >
                            Mark Invalid
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground font-mono">Audited</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!targetReferral}
        title={`Update Referral Claim to "${targetNewStatus.toUpperCase()}"`}
        description={`You are changing the referral status for code "${targetReferral?.referral_code}". This action requires an audit reason.`}
        confirmText="Confirm Status Update"
        confirmVariant={targetNewStatus === 'qualified' ? 'primary' : 'danger'}
        requireReason={true}
        onConfirm={handleStatusChange}
        onCancel={() => setTargetReferral(null)}
        loading={processing}
      />
    </div>
  );
}
