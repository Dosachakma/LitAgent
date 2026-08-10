'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Wallet,
  Award,
  Target,
  CheckCircle2,
  Share2,
  Boxes,
  Newspaper,
  ShieldAlert,
  ArrowRight,
  Clock,
  Sparkles,
  Plus,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { AdminHeader } from '@/components/admin/admin-header';
import { BadgePill } from '@/components/shared/badge-pill';
import { useAuthStore } from '@/store/auth-store';
import type { AdminOverviewStats } from '@/lib/admin-service';
import type { AdminAuditLogRecord } from '@/lib/audit-logger';

export default function AdminOverviewPage() {
  const { user } = useAuthStore();

  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [statsRes, auditRes] = await Promise.all([
        fetch(`/api/admin/overview?userId=${encodeURIComponent(user?.id || '')}`),
        fetch(`/api/admin/audit-logs?userId=${encodeURIComponent(user?.id || '')}&limit=6`),
      ]);

      const statsData = await statsRes.json();
      const auditData = await auditRes.json();

      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }
      if (auditData.success && auditData.logs) {
        setAuditLogs(auditData.logs);
      }
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statCards = [
    {
      label: 'Total Registered Users',
      value: stats?.totalUsers ?? '...',
      icon: Users,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
      href: '/admin/users',
    },
    {
      label: 'Connected Wallets',
      value: stats?.connectedWallets ?? '...',
      icon: Wallet,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      href: '/admin/users',
    },
    {
      label: 'Total XP Awarded',
      value: typeof stats?.totalXpAwarded === 'number' ? stats.totalXpAwarded.toLocaleString() : (stats?.totalXpAwarded ?? '...'),
      icon: Award,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      href: '/admin/xp',
    },
    {
      label: 'Active Missions',
      value: stats?.activeMissions ?? '...',
      icon: Target,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      href: '/admin/missions',
    },
    {
      label: 'Completed Missions',
      value: stats?.completedMissions ?? '...',
      icon: CheckCircle2,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      href: '/admin/missions',
    },
    {
      label: 'Total Referrals',
      value: stats?.totalReferrals ?? '...',
      icon: Share2,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      href: '/admin/referrals',
    },
    {
      label: 'Ecosystem Projects',
      value: stats?.ecosystemProjects ?? '...',
      icon: Boxes,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10 border-pink-500/20',
      href: '/admin/ecosystem',
    },
    {
      label: 'Published News',
      value: stats?.publishedNews ?? '...',
      icon: Newspaper,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      href: '/admin/news',
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      <AdminHeader
        title="Admin Overview"
        subtitle="Real-time telemetry and management controls for LitAgent."
        onRefresh={loadData}
        refreshing={refreshing}
      />

      {/* Quick Action Navigation Bar */}
      <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-3 border-primary/20">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs font-semibold text-white">Quick Administrative Actions</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/missions"
            className="flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-bold text-white shadow hover:opacity-90 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Mission</span>
          </Link>
          <Link
            href="/admin/xp"
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all"
          >
            <Award className="h-3.5 w-3.5" />
            <span>Adjust XP</span>
          </Link>
          <Link
            href="/admin/ecosystem"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-all"
          >
            <Boxes className="h-3.5 w-3.5" />
            <span>Add Project</span>
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-all"
          >
            <span>Settings</span>
          </Link>
        </div>
      </GlassCard>

      {/* Primary Telemetry Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link key={idx} href={card.href}>
              <GlassCard className="p-4 hover:border-primary/40 transition-all group space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                  <div className={`p-2 rounded-xl border ${card.bg}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-extrabold text-white tracking-tight">{card.value}</p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>

      {/* Audit Logs Feed */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-white">Recent Admin Audit Activity</h2>
          </div>
          <Link href="/admin/settings" className="text-xs text-primary hover:underline font-medium">
            View All Settings & Audit Logs →
          </Link>
        </div>

        {auditLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-muted-foreground">
            No administrative audit logs recorded yet. Action audit logs will appear here in real time.
          </div>
        ) : (
          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-[10px]">
                    AUDIT
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{log.action}</span>
                      <BadgePill label={log.target_type} variant="secondary" />
                    </div>
                    {log.reason && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{log.reason}</p>
                    )}
                  </div>
                </div>

                <div className="text-right font-mono text-[10px] text-muted-foreground" suppressHydrationWarning>
                  <p suppressHydrationWarning>{new Date(log.created_at).toLocaleDateString()}</p>
                  <p suppressHydrationWarning>{new Date(log.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
