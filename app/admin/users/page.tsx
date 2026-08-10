'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Search,
  Eye,
  Shield,
  Award,
  Target,
  Share2,
  Wallet,
  Calendar,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { AdminHeader } from '@/components/admin/admin-header';
import { BadgePill } from '@/components/shared/badge-pill';
import { ConfirmationDialog } from '@/components/admin/confirmation-dialog';
import { useAuthStore } from '@/store/auth-store';
import { truncateAddress } from '@/lib/format';
import type { AdminUserListItem } from '@/lib/admin-service';

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuthStore();

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // User Detail Drawer / Modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Status Toggle Confirmation
  const [targetUserForStatus, setTargetUserForStatus] = useState<AdminUserListItem | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users?userId=${encodeURIComponent(
          currentAdmin?.id || ''
        )}&search=${encodeURIComponent(search)}&page=${page}&limit=15`
      );
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setTotalUsers(data.total || 0);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentAdmin?.id, search, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function viewUserDetails(userId: string) {
    setSelectedUserId(userId);
    setLoadingDetails(true);
    try {
      const res = await fetch(
        `/api/admin/users/${userId}?adminUserId=${encodeURIComponent(currentAdmin?.id || '')}`
      );
      const data = await res.json();
      if (data.success && data.user) {
        setUserDetails(data.user);
      }
    } catch (err) {
      console.error('Error loading user details:', err);
    } finally {
      setLoadingDetails(false);
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <AdminHeader
        title="User Management"
        subtitle="Search user accounts, review connected wallets, XP profiles, and activity logs."
        onRefresh={loadUsers}
        refreshing={loading}
      />

      {/* Search & Filter Controls */}
      <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users by username, wallet address, email or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          Showing {users.length} of {totalUsers} registered profiles
        </div>
      </GlassCard>

      {/* User Directory Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/5 text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Wallet / Email</th>
                <th className="px-4 py-3.5">Level & Total XP</th>
                <th className="px-4 py-3.5">Missions</th>
                <th className="px-4 py-3.5">Referrals</th>
                <th className="px-4 py-3.5">Joined Date</th>
                <th className="px-4 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No users match your query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white">{u.username}</span>
                        <p className="text-[10px] text-muted-foreground font-mono">ID: {u.id.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-muted-foreground text-[11px]">
                      {u.wallet_address ? truncateAddress(u.wallet_address, 6) : u.email || 'Unlinked'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono font-bold text-primary text-[10px]">
                          Lvl {u.level}
                        </span>
                        <span className="font-bold text-amber-400 font-mono">
                          {u.total_xp.toLocaleString()} XP
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-white font-mono">
                      {u.completed_missions} completed
                    </td>
                    <td className="px-4 py-3.5 font-bold text-white font-mono">
                      {u.referral_count} invites
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground font-mono text-[11px]" suppressHydrationWarning>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => viewUserDetails(u.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/10 transition-colors ml-auto"
                      >
                        <Eye className="h-3.5 w-3.5 text-primary" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* User Details Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <GlassCard className="relative w-full max-w-2xl p-6 space-y-6 border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary font-bold">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {userDetails?.profile?.username || 'User Inspection'}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">User ID: {selectedUserId}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedUserId(null);
                  setUserDetails(null);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-12 text-center text-xs text-muted-foreground font-mono animate-pulse">
                Fetching full user profile & transaction audit logs...
              </div>
            ) : userDetails ? (
              <div className="space-y-6 text-xs">
                {/* Profile Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
                    <span className="text-[10px] text-muted-foreground font-medium">Wallet Address</span>
                    <p className="font-mono font-bold text-white truncate">
                      {userDetails.profile?.wallet_address || 'Not Connected'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
                    <span className="text-[10px] text-muted-foreground font-medium">Level & XP</span>
                    <p className="font-mono font-bold text-amber-400">
                      Level {userDetails.xp?.current_level || 1} • {userDetails.xp?.total_xp || 0} XP
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
                    <span className="text-[10px] text-muted-foreground font-medium">Daily Streak</span>
                    <p className="font-mono font-bold text-white">
                      🔥 {userDetails.xp?.streak_count || 0} Days
                    </p>
                  </div>
                </div>

                {/* Privacy Warning Notice */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Lock className="h-4 w-4 text-primary shrink-0" />
                  <span>Privacy Notice: Passwords and private keys are never stored or exposed.</span>
                </div>

                {/* Recent XP Audit History */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-400" />
                    <span>Recent XP Transactions</span>
                  </h4>
                  {userDetails.xpHistory?.length === 0 ? (
                    <p className="text-muted-foreground text-[11px]">No XP transactions recorded.</p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1.5 border border-white/5 rounded-xl p-2 bg-black/40">
                      {userDetails.xpHistory?.map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between text-[11px] p-2 rounded bg-white/[0.02]">
                          <div>
                            <span className="font-bold text-white">{tx.description}</span>
                            <span className="text-muted-foreground ml-2 font-mono">({tx.source})</span>
                          </div>
                          <span className="font-mono font-bold text-amber-400">
                            +{tx.amount} XP
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Completed Missions History */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-400" />
                    <span>Completed Missions</span>
                  </h4>
                  {userDetails.missionHistory?.length === 0 ? (
                    <p className="text-muted-foreground text-[11px]">No missions completed yet.</p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1.5 border border-white/5 rounded-xl p-2 bg-black/40">
                      {userDetails.missionHistory?.map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between text-[11px] p-2 rounded bg-white/[0.02]">
                          <span className="font-bold text-white">{m.missions?.title || 'Mission'}</span>
                          <BadgePill label={m.status} variant="success" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
