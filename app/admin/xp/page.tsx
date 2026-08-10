'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Award,
  Plus,
  Minus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  X,
  ShieldAlert,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { AdminHeader } from '@/components/admin/admin-header';
import { BadgePill } from '@/components/shared/badge-pill';
import { useAuthStore } from '@/store/auth-store';
import { truncateAddress } from '@/lib/format';
import type { XPTransaction } from '@/lib/types';

export default function AdminXPPage() {
  const { user: currentAdmin } = useAuthStore();

  const [transactions, setTransactions] = useState<XPTransaction[]>([]);
  const [totalTx, setTotalTx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sourceFilter, setSourceFilter] = useState('All');

  // Manual Adjustment Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [amount, setAmount] = useState<number>(100);
  const [reason, setReason] = useState('');
  const [adjustError, setAdjustError] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const src = sourceFilter !== 'All' ? sourceFilter.toLowerCase() : '';
      const res = await fetch(
        `/api/admin/xp?userId=${encodeURIComponent(
          currentAdmin?.id || ''
        )}&page=${page}&limit=20&source=${encodeURIComponent(src)}`
      );
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
        setTotalTx(data.total || 0);
      }
    } catch (err) {
      console.error('Error loading XP transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [currentAdmin?.id, page, sourceFilter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  async function handleAdjustXP(e: React.FormEvent) {
    e.preventDefault();
    setAdjustError('');

    if (!targetUserId.trim()) {
      setAdjustError('Target User ID or Wallet Address is required.');
      return;
    }
    if (!amount || amount === 0) {
      setAdjustError('Adjustment amount must be non-zero.');
      return;
    }
    if (!reason || reason.trim().length < 5) {
      setAdjustError('A clear audit reason (at least 5 characters) is required.');
      return;
    }

    setAdjusting(true);
    try {
      const res = await fetch('/api/admin/xp/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: targetUserId.trim(),
          amount,
          reason: reason.trim(),
          adminUserId: currentAdmin?.id,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'XP adjustment failed');

      setAdjustModalOpen(false);
      setTargetUserId('');
      setAmount(100);
      setReason('');
      loadTransactions();
    } catch (err: unknown) {
      setAdjustError(err instanceof Error ? err.message : 'Adjustment failed');
    } finally {
      setAdjusting(false);
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <AdminHeader
        title="XP Management & Manual Adjustment"
        subtitle="Review XP issuance across missions, daily check-ins, referrals, and perform auditable manual adjustments."
        onRefresh={loadTransactions}
        refreshing={loading}
      />

      {/* Control Bar */}
      <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
          >
            <option value="All">All XP Sources</option>
            <option value="mission">Missions</option>
            <option value="checkin">Daily Check-ins</option>
            <option value="referral">Referrals</option>
            <option value="admin_adjustment">Admin Manual Adjustments</option>
          </select>

          <span className="text-xs text-muted-foreground font-mono">
            Total {totalTx} Transactions
          </span>
        </div>

        <button
          onClick={() => {
            setAdjustError('');
            setAdjustModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 shadow hover:border-amber-500/50 transition-all"
        >
          <Award className="h-4 w-4" />
          <span>Manual XP Adjustment</span>
        </button>
      </GlassCard>

      {/* XP Transactions Audit Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/5 text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Source / Type</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No XP transactions recorded under this filter.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-white">
                      {truncateAddress(tx.user_id, 6)}
                    </td>
                    <td className="px-4 py-3.5">
                      <BadgePill
                        label={tx.source}
                        variant={tx.source === 'admin_adjustment' ? 'warning' : 'primary'}
                      />
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono">
                      <span className={tx.amount >= 0 ? 'text-amber-400' : 'text-destructive'}>
                        {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} XP
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {tx.description}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground font-mono text-[11px]" suppressHydrationWarning>
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Manual XP Adjustment Modal */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <GlassCard className="relative w-full max-w-md p-6 space-y-4 border-amber-500/30 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Manual XP Adjustment</h3>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {adjustError && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{adjustError}</span>
              </div>
            )}

            <form onSubmit={handleAdjustXP} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-white">Target User ID or Wallet Address *</label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="e.g. 0x123... or user UUID"
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white font-mono focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-white">XP Amount (+ to add, - to deduct) *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g. 250 or -100"
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white font-mono focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-white flex items-center justify-between">
                  <span>Mandatory Reason for Audit Log</span>
                  <span className="text-[10px] text-destructive">* Required</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State clear justification (e.g. Community reward for bug bounty submission)..."
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="rounded-lg bg-amber-500 text-black px-5 py-2 text-xs font-bold shadow hover:bg-amber-400 disabled:opacity-50"
                >
                  {adjusting ? 'Processing...' : 'Apply & Log Audit'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
