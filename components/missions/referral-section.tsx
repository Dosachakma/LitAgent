'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  TrendingUp,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Send,
  Twitter,
  Coins,
  CheckCircle2,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { StatCard } from '@/components/shared/stat-card';
import { MissionCard } from '@/components/missions/mission-card';
import type { Mission, ReferralRecord, ReferralStats } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ReferralSectionProps {
  userId: string;
  onXPUpdate?: () => void;
}

export function ReferralSection({ userId, onXPUpdate }: ReferralSectionProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [history, setHistory] = useState<ReferralRecord[]>([]);
  const [referralMissions, setReferralMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Load referral stats & history
  const loadReferralData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Referral Stats & History
      const res = await fetch(`/api/referral?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setHistory(data.history || []);
      }

      // 2. Fetch Referral Category Missions
      const mRes = await fetch(`/api/missions?userId=${userId}&category=Referral`);
      const mData = await mRes.json();
      if (mData.success && mData.data) {
        setReferralMissions(mData.data);
      }
    } catch {
      // Fallback handled
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Check stored referral code from URL join link
  useEffect(() => {
    const checkAndProcessStoredReferral = async () => {
      try {
        const storedCode = localStorage.getItem('litagent_referral_code');
        if (storedCode && userId) {
          // Record referral
          const recRes = await fetch('/api/referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'record',
              referrerCode: storedCode,
              referredUserId: userId,
            }),
          });
          const recData = await recRes.json();

          if (recData.success) {
            // Qualify referral
            await fetch('/api/referral', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'qualify',
                referredUserId: userId,
                triggerAction: 'Joined via referral link',
              }),
            });
            setToastMsg('🎉 Referral welcome bonus applied! Earned +50 XP!');
            localStorage.removeItem('litagent_referral_code');
            if (onXPUpdate) onXPUpdate();
          }
        }
      } catch {
        // Ignore storage errors
      }
    };

    checkAndProcessStoredReferral();
    loadReferralData();
  }, [userId, loadReferralData, onXPUpdate]);

  const rawLink = stats?.referral_link || `https://litagent.app/join?ref=${stats?.referral_code || 'LIT_CODE'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(rawLink);
    setCopied(true);
    setToastMsg('Referral link copied to clipboard!');
    setTimeout(() => {
      setCopied(false);
      setToastMsg(null);
    }, 3000);
  };

  const handleShareX = () => {
    const text = encodeURIComponent(
      `Join me on LitAgent — the official Web3 AI Companion for LitVM! Earn XP, explore ecosystem projects, and complete testnet missions:`
    );
    const url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(rawLink)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      `Join me on LitAgent — the Web3 AI Companion for LitVM! Complete missions and earn XP:`
    );
    const url = `https://t.me/share/url?url=${encodeURIComponent(rawLink)}&text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <span>Referral Program & Ambassador Hub</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Invite friends to LitAgent using your unique referral link to earn +100 XP for every qualified pioneer.
          </p>
        </div>

        {/* Unique Referral Code Badge */}
        <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 border border-white/10 text-xs font-bold text-white w-fit">
          <span className="text-muted-foreground font-normal">Your Code:</span>
          <span className="text-amber-400 font-mono tracking-wider">{stats?.referral_code || 'LIT_AGENT'}</span>
        </div>
      </div>

      {/* Global Toast */}
      {toastMsg && (
        <div className="rounded-xl bg-primary/20 border border-primary/40 p-3 text-xs font-semibold text-white flex items-center justify-between shadow-lg glow-primary">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-white/70 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Referral Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Invites</p>
              <h3 className="text-lg font-bold text-white">{stats?.total_referrals || 0}</h3>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Pending Invites</p>
              <h3 className="text-lg font-bold text-white">{stats?.pending_referrals || 0}</h3>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Qualified Referrals</p>
              <h3 className="text-lg font-bold text-white">{stats?.qualified_referrals || 0}</h3>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 border-primary/30 gradient-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white shadow-md">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Referral XP Earned</p>
              <h3 className="text-lg font-bold text-primary">+{stats?.total_rewards_xp || 0} XP</h3>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Referral Link & Social Sharing Bar */}
      <GlassCard className="p-6 space-y-4 border-primary/30 gradient-card">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            <span>Your Personal Referral Link</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Share this link across Web3 communities. Your referral code is automatically attached.
          </p>
        </div>

        {/* Input + Copy */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              readOnly
              value={rawLink}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-xs text-white font-mono focus:outline-none"
            />
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl gradient-primary px-5 py-2.5 font-bold text-xs text-white shadow-lg transition-all hover:opacity-90 active:scale-95 glow-primary"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Social Share CTAs */}
        <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-white/8">
          <span className="text-xs font-semibold text-muted-foreground">Quick Share:</span>

          <button
            onClick={handleShareX}
            className="flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white border border-white/10 transition-colors"
          >
            <Twitter className="h-3.5 w-3.5 text-sky-400" />
            <span>Share to X (Twitter)</span>
          </button>

          <button
            onClick={handleShareTelegram}
            className="flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white border border-white/10 transition-colors"
          >
            <Send className="h-3.5 w-3.5 text-sky-300" />
            <span>Share to Telegram</span>
          </button>
        </div>
      </GlassCard>

      {/* Referral Specific Missions */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Referral Campaign Missions</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Complete milestone referral objectives to unlock bonus ecosystem rewards
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {referralMissions.map((m) => (
            <MissionCard
              key={m.id}
              mission={m}
              userId={userId}
              onComplete={async (mId: string) => {
                await loadReferralData();
                if (onXPUpdate) onXPUpdate();
              }}
            />
          ))}
        </div>
      </div>

      {/* Auditable Referral History Table */}
      <GlassCard className="overflow-hidden p-0 space-y-0">
        <div className="p-4 border-b border-white/8 bg-white/5 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Referral Audit History</span>
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {history.length} Total Records
          </span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-white">No referrals recorded yet</p>
            <p>Share your unique referral link to build your team and earn XP rewards!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 uppercase text-muted-foreground text-[10px] font-bold border-b border-white/8">
                <tr>
                  <th className="px-5 py-3">Referred User ID</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">XP Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-white">
                      {item.referred_user_id.slice(0, 12)}...
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground" suppressHydrationWarning>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      {item.status === 'qualified' || item.status === 'rewarded' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Qualified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                          <Clock className="h-3 w-3" />
                          Pending Tasks
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-primary">
                      {item.status === 'qualified' || item.status === 'rewarded' ? '+100 XP' : '0 XP'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
