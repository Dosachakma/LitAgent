'use client';

import { useState, useEffect } from 'react';
import { Gift, Copy, Check, Users, TrendingUp, Coins } from 'lucide-react';
import { SectionTitle } from '@/components/shared/section-title';
import { GlassCard } from '@/components/shared/glass-card';
import { EmptyState } from '@/components/shared/empty-state';
import { StatCard } from '@/components/shared/stat-card';
import { supabase } from '@/lib/supabase';
import type { ReferralStats } from '@/lib/types';

export function ReferralPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('referral_stats')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        setStats(data as ReferralStats);
      }
      setLoading(false);
    }
    load();
  }, []);

  const referralLink = stats
    ? `https://litagent.app/r/${stats.referral_code}`
    : null;

  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Referral"
        subtitle="Invite friends and earn rewards"
        icon={<Gift className="h-5 w-5" />}
      />

      {!stats || loading ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={Users} label="Total Referrals" value="—" />
            <StatCard icon={TrendingUp} label="Active Referrals" value="—" />
            <StatCard icon={Coins} label="Total Rewards" value="—" />
          </div>

          <EmptyState
            icon={Gift}
            title="No referral code yet"
            description="Your unique referral link will appear here once your account is set up. Share it with friends to earn rewards when they join the LitVM ecosystem."
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={Users} label="Total Referrals" value={String(stats.total_referrals)} />
            <StatCard icon={TrendingUp} label="Active Referrals" value={String(stats.active_referrals)} />
            <StatCard icon={Coins} label="Total Rewards" value={String(stats.total_rewards)} />
          </div>

          <GlassCard variant="gradient" className="p-6">
            <h3 className="text-lg font-semibold text-white">Your Referral Link</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Share this link with friends. You&apos;ll earn rewards when they join and participate.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-lg glass-strong p-1.5">
              <input
                type="text"
                readOnly
                value={referralLink ?? ''}
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-md gradient-primary px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
