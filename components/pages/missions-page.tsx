'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Target,
  Sparkles,
  Flame,
  CheckCircle2,
  History,
  Search,
  X,
  Trophy,
  Gift,
  Coins,
  Shield,
  Layers,
} from 'lucide-react';
import { SectionTitle } from '@/components/shared/section-title';
import { GlassCard } from '@/components/shared/glass-card';
import { EmptyState } from '@/components/shared/empty-state';
import { ContentLoader } from '@/components/shared/content-loader';
import { MissionCard } from '@/components/missions/mission-card';
import { DailyCheckinCard } from '@/components/missions/daily-checkin-card';
import { ReferralSection } from '@/components/missions/referral-section';
import { LeaderboardPage } from '@/components/pages/leaderboard-page';
import { useAuthStore } from '@/store/auth-store';
import { getLevelProgress } from '@/lib/xp-config';
import type { Mission, UserXPProfile, XPTransaction } from '@/lib/types';
import { cn } from '@/lib/utils';

type FilterTab =
  | 'All'
  | 'Daily'
  | 'Weekly'
  | 'Social'
  | 'Ecosystem'
  | 'Referral'
  | 'Leaderboard'
  | 'XP History'
  | 'Completed';

export function MissionsPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const userId = user?.id || '';

  const initialTabParam = searchParams.get('tab')?.toLowerCase();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>(
    initialTabParam === 'referral'
      ? 'Referral'
      : initialTabParam === 'leaderboard'
      ? 'Leaderboard'
      : 'All'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('newest');

  // XP Profile state
  const [userProfile, setUserProfile] = useState<UserXPProfile | null>(null);
  const [xpHistory, setXpHistory] = useState<XPTransaction[]>([]);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Load User XP and Missions
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Missions
      const missionsRes = await fetch(`/api/missions?userId=${userId}`);
      const missionsData = await missionsRes.json();
      if (missionsData.success && missionsData.data) {
        setMissions(missionsData.data);
      }

      // 2. Fetch User XP Profile
      const xpRes = await fetch(`/api/xp?userId=${userId}`);
      const xpData = await xpRes.json();
      if (xpData.success) {
        setUserProfile(xpData.profile);
        setXpHistory(xpData.history || []);
      }
    } catch {
      // Fallback handled
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Complete mission handler
  const handleCompleteMission = async (missionId: string) => {
    try {
      const res = await fetch('/api/missions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          missionId,
          verificationContext: {
            userHasWallet: Boolean(user?.walletAddress),
            walletAddress: user?.walletAddress,
          },
        }),
      });
      const data = await res.json();

      if (data.success) {
        setNotificationMsg(`🎉 ${data.message}`);
        await loadData();
      } else {
        setNotificationMsg(`⚠️ ${data.message}`);
      }

      setTimeout(() => setNotificationMsg(null), 5000);
    } catch {
      setNotificationMsg('⚠️ Failed to verify mission.');
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  // Filter & sort missions
  const filteredMissions = missions
    .filter((m) => {
      // Category / Tab filter
      if (activeTab === 'Completed' && m.status !== 'completed') return false;
      if (activeTab === 'Daily' && m.category !== 'Daily') return false;
      if (activeTab === 'Weekly' && m.category !== 'Weekly') return false;
      if (activeTab === 'Social' && m.category !== 'Social') return false;
      if (activeTab === 'Ecosystem' && m.category !== 'Ecosystem') return false;
      if (activeTab === 'Referral' && m.category !== 'Referral') return false;

      // Difficulty filter
      if (difficultyFilter !== 'All' && m.difficulty !== difficultyFilter) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchDesc = m.description.toLowerCase().includes(q);
        const matchCat = m.category.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchCat;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'reward_high') return b.xp_reward - a.xp_reward;
      if (sortBy === 'reward_low') return a.xp_reward - b.xp_reward;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const levelProgress = getLevelProgress(userProfile?.total_xp || 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionTitle
          title="Missions & Engagement Hub"
          subtitle="Complete ecosystem activities, track referral rewards, and climb the LitVM leaderboard"
          icon={<Target className="h-5 w-5" />}
        />

        {/* Quick Tab CTAs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('Referral')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold border transition-all',
              activeTab === 'Referral'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-md'
                : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white'
            )}
          >
            <Gift className="h-4 w-4 text-amber-400" />
            <span>Referrals</span>
          </button>

          <button
            onClick={() => setActiveTab('Leaderboard')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold border transition-all',
              activeTab === 'Leaderboard'
                ? 'bg-primary/20 text-primary border-primary/40 shadow-md glow-primary'
                : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white'
            )}
          >
            <Trophy className="h-4 w-4 text-primary" />
            <span>Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Global Notification Toast */}
      {notificationMsg && (
        <div className="rounded-xl bg-primary/20 border border-primary/40 p-4 text-sm font-medium text-white flex items-center justify-between animate-fade-in shadow-lg glow-primary">
          <span>{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="p-1 hover:text-white/70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* User XP Profile & Level Banner */}
      <GlassCard className="p-6 relative overflow-hidden border-primary/20 gradient-card">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Level Badge & XP */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl gradient-primary text-3xl shadow-xl glow-primary">
              {levelProgress.currentLevel.badge}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Current Rank
                </span>
                <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[11px] font-bold text-primary border border-primary/30">
                  Level {levelProgress.currentLevel.level}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">
                {levelProgress.currentLevel.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-bold text-white">
                  {(userProfile?.total_xp || 0).toLocaleString()} XP Total
                </span>
              </p>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-white">
                Progress to Level {levelProgress.nextLevel?.level || levelProgress.currentLevel.level}
              </span>
              <span className="text-muted-foreground">
                {levelProgress.nextLevel
                  ? `${levelProgress.xpToNext} XP needed`
                  : 'Max Level Reached!'}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full rounded-full gradient-primary transition-all duration-500 shadow-sm"
                style={{ width: `${levelProgress.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{levelProgress.currentLevel.title}</span>
              <span>
                {levelProgress.nextLevel ? levelProgress.nextLevel.title : 'Ecosystem Master'}
              </span>
            </div>
          </div>

          {/* Quick Stats: Streak & Completed */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 p-3 border border-white/8 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 text-sm font-bold">
                <Flame className="h-4 w-4" />
                <span>{userProfile?.streak_count || 0} Days</span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                Active Streak
              </span>
            </div>

            <div className="rounded-xl bg-white/5 p-3 border border-white/8 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-400 text-sm font-bold">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {missions.filter((m) => m.status === 'completed').length} / {missions.length}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                Missions Done
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-2 border-b border-white/10">
        {(
          [
            'All',
            'Daily',
            'Weekly',
            'Social',
            'Ecosystem',
            'Referral',
            'Leaderboard',
            'XP History',
            'Completed',
          ] as FilterTab[]
        ).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5',
                isActive
                  ? 'bg-primary text-white shadow-md glow-primary'
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
              )}
            >
              {tab === 'Referral' && <Gift className="h-3.5 w-3.5 text-amber-400" />}
              {tab === 'Leaderboard' && <Trophy className="h-3.5 w-3.5 text-yellow-300" />}
              {tab === 'XP History' && <History className="h-3.5 w-3.5 text-sky-400" />}
              <span>{tab === 'All' ? 'All Missions' : tab}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: REFERRAL */}
      {activeTab === 'Referral' && (
        <ReferralSection userId={userId} onXPUpdate={loadData} />
      )}

      {/* TAB CONTENT: LEADERBOARD */}
      {activeTab === 'Leaderboard' && <LeaderboardPage />}

      {/* TAB CONTENT: XP HISTORY */}
      {activeTab === 'XP History' && (
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="h-5 w-5 text-sky-400" />
              <span>Auditable XP Transaction Ledger</span>
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              {xpHistory.length} Total Records
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            All XP awards are calculated and verified server-side with unique transaction reference IDs.
          </p>

          <div className="space-y-2 pt-2">
            {xpHistory.length === 0 ? (
              <EmptyState
                icon={History}
                title="No XP transactions recorded yet"
                description="Complete daily check-ins or ecosystem missions to generate your first auditable XP log!"
              />
            ) : (
              xpHistory.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs gap-2"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">{tx.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>{new Date(tx.created_at).toLocaleString()}</span>
                      <span>•</span>
                      <span>Source: <strong className="text-white">{tx.source}</strong></span>
                      <span>•</span>
                      <span>Type: <strong className="text-white">{tx.type}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-muted-foreground bg-black/30 px-2 py-0.5 rounded border border-white/10">
                      ID: {tx.id.slice(0, 8)}...
                    </span>
                    <span className="font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 text-xs whitespace-nowrap">
                      +{tx.amount} XP
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      )}

      {/* TAB CONTENT: STANDARD MISSION CATEGORIES */}
      {activeTab !== 'Referral' && activeTab !== 'Leaderboard' && activeTab !== 'XP History' && (
        <div className="space-y-6">
          {/* Daily Check-in Card (Shown on All or Daily tabs) */}
          {(activeTab === 'All' || activeTab === 'Daily') && (
            <DailyCheckinCard
              userId={userId}
              streakCount={userProfile?.streak_count || 0}
              lastCheckinDate={userProfile?.last_checkin_date || null}
              onCheckinSuccess={loadData}
            />
          )}

          {/* Search & Filters Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Difficulty Dropdown */}
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
              >
                <option value="All" className="bg-sidebar text-white">All Difficulties</option>
                <option value="Easy" className="bg-sidebar text-white">Easy</option>
                <option value="Medium" className="bg-sidebar text-white">Medium</option>
                <option value="Hard" className="bg-sidebar text-white">Hard</option>
                <option value="Expert" className="bg-sidebar text-white">Expert</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
              >
                <option value="newest" className="bg-sidebar text-white">Sort: Newest</option>
                <option value="reward_high" className="bg-sidebar text-white">Sort: Highest XP</option>
                <option value="reward_low" className="bg-sidebar text-white">Sort: Lowest XP</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search missions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-xs text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Missions Grid */}
          {loading ? (
            <ContentLoader lines={4} />
          ) : filteredMissions.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No missions found"
              description="No active missions match your selected filter criteria. Try selecting 'All Missions' or adjusting your search filters."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  userId={userId}
                  onComplete={handleCompleteMission}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
