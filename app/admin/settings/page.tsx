'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Settings,
  Shield,
  Save,
  Clock,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { AdminHeader } from '@/components/admin/admin-header';
import { BadgePill } from '@/components/shared/badge-pill';
import { useAuthStore } from '@/store/auth-store';
import type { AdminSettingsMap } from '@/lib/settings-service';
import type { AdminAuditLogRecord } from '@/lib/audit-logger';

export default function AdminSettingsPage() {
  const { user: currentAdmin } = useAuthStore();

  const [settings, setSettings] = useState<AdminSettingsMap | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const loadSettingsAndLogs = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, logsRes] = await Promise.all([
        fetch(`/api/admin/settings?userId=${encodeURIComponent(currentAdmin?.id || '')}`),
        fetch(`/api/admin/audit-logs?userId=${encodeURIComponent(currentAdmin?.id || '')}&limit=15`),
      ]);

      const sData = await settingsRes.json();
      const lData = await logsRes.json();

      if (sData.success && sData.settings) {
        setSettings(sData.settings);
      }
      if (lData.success && lData.logs) {
        setAuditLogs(lData.logs);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }, [currentAdmin?.id]);

  useEffect(() => {
    loadSettingsAndLogs();
  }, [loadSettingsAndLogs]);

  async function handleSettingUpdate(
    key: keyof AdminSettingsMap,
    value: unknown,
    description: string
  ) {
    setSavingKey(key);
    setStatusMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          value,
          adminUserId: currentAdmin?.id,
          reason: `Updated system setting: ${description}`,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update setting');

      setStatusMessage(`Setting "${key}" updated and audit logged successfully.`);
      loadSettingsAndLogs();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <AdminHeader
        title="System Settings & Audit Log"
        subtitle="Manage centralized LitAgent runtime parameters, global feature flags, and review audit trails."
        onRefresh={loadSettingsAndLogs}
        refreshing={loading}
      />

      {statusMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Parameters Panel */}
        <GlassCard className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-bold text-white">Centralized System Parameters</h2>
          </div>

          {settings && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <p className="font-bold text-white">Daily Check-in Base XP</p>
                  <p className="text-[10px] text-muted-foreground">Base reward for daily check-in streak</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.daily_checkin_xp}
                    onChange={(e) =>
                      setSettings({ ...settings, daily_checkin_xp: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-20 rounded-lg border border-white/10 bg-white/5 p-2 font-mono text-center text-white focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      handleSettingUpdate('daily_checkin_xp', settings.daily_checkin_xp, 'Updated daily checkin XP')
                    }
                    disabled={savingKey === 'daily_checkin_xp'}
                    className="p-2 rounded-lg gradient-primary text-white hover:opacity-90 disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <p className="font-bold text-white">Referral Qualified XP</p>
                  <p className="text-[10px] text-muted-foreground">XP rewarded to referrer on conversion</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.referral_xp}
                    onChange={(e) =>
                      setSettings({ ...settings, referral_xp: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-20 rounded-lg border border-white/10 bg-white/5 p-2 font-mono text-center text-white focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      handleSettingUpdate('referral_xp', settings.referral_xp, 'Updated referral XP')
                    }
                    disabled={savingKey === 'referral_xp'}
                    className="p-2 rounded-lg gradient-primary text-white hover:opacity-90 disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <p className="font-bold text-white">Default Mission XP</p>
                  <p className="text-[10px] text-muted-foreground">Default reward for newly created tasks</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.mission_xp_default}
                    onChange={(e) =>
                      setSettings({ ...settings, mission_xp_default: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-20 rounded-lg border border-white/10 bg-white/5 p-2 font-mono text-center text-white focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      handleSettingUpdate('mission_xp_default', settings.mission_xp_default, 'Updated default mission XP')
                    }
                    disabled={savingKey === 'mission_xp_default'}
                    className="p-2 rounded-lg gradient-primary text-white hover:opacity-90 disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Global Feature Flags Panel */}
        <GlassCard className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Shield className="h-5 w-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Global Feature Toggles</h2>
          </div>

          {settings && (
            <div className="space-y-4 text-xs">
              {Object.entries(settings.feature_toggles).map(([toggleKey, enabled]) => (
                <div
                  key={toggleKey}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <div>
                    <p className="font-bold text-white capitalize">{toggleKey.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Status: {enabled ? 'Active / Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newToggles = { ...settings.feature_toggles, [toggleKey]: !enabled };
                      setSettings({ ...settings, feature_toggles: newToggles });
                      handleSettingUpdate(
                        'feature_toggles',
                        newToggles,
                        `Toggled feature ${toggleKey} to ${!enabled}`
                      );
                    }}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all ${
                      enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/10 text-muted-foreground border border-white/10'
                    }`}
                  >
                    {enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    <span>{enabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Immutable Audit Trail Section */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-white">System Audit Log History</h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">Immutable Log Table</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/5 text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No audit logs available.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-muted-foreground" suppressHydrationWarning>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-white">{log.admin_user_id.slice(0, 8)}</td>
                    <td className="px-4 py-2.5 text-primary font-bold">{log.action}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{log.target_type}</td>
                    <td className="px-4 py-2.5 text-white">{log.reason || 'N/A'}</td>
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
