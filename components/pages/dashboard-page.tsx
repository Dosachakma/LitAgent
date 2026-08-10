'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Sparkles,
  Wallet,
  Briefcase,
  Target,
  Newspaper,
  TrendingUp,
  ArrowUpRight,
  ExternalLink,
  Clock,
  Send,
  CheckCircle2,
  Activity,
  Plus,
  Compass,
} from 'lucide-react';
import { SectionTitle } from '@/components/shared/section-title';
import { GlassCard } from '@/components/shared/glass-card';
import { EmptyState } from '@/components/shared/empty-state';
import { StatCard } from '@/components/shared/stat-card';
import { BadgePill } from '@/components/shared/badge-pill';
import { ContentLoader } from '@/components/shared/content-loader';
import { FeaturedProjectsWidget } from '@/components/dashboard/featured-projects-widget';
import { useWalletStore } from '@/store/wallet-store';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { truncateAddress, timeAgo } from '@/lib/format';
import {
  getLatestNews,
  getFeaturedProjects,
  getUserActivity,
} from '@/lib/dashboard-service';
import type { NewsArticle, Project, UserActivity } from '@/lib/types';

export function DashboardPage() {
  const { address } = useWalletStore();
  const { setActiveNav } = useUIStore();
  const { user } = useAuthStore();

  const [news, setNews] = useState<NewsArticle[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const [quickCopilotInput, setQuickCopilotInput] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [newsData, projectsData, activityData] = await Promise.all([
          getLatestNews(3),
          getFeaturedProjects(3),
          user?.id ? getUserActivity(user.id, 5) : Promise.resolve([]),
        ]);

        setNews(newsData);
        setFeaturedProjects(projectsData);
        setActivities(activityData);
      } catch {
        setNews([]);
        setFeaturedProjects([]);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user?.id]);

  const handleCopilotQuickAsk = (prompt?: string) => {
    const textToAsk = prompt || quickCopilotInput;
    if (!textToAsk.trim()) return;
    setActiveNav('copilot');
  };

  const samplePrompts = [
    'What is LitVM and how does it work?',
    'Top featured projects in LitVM',
    'How do I complete ecosystem missions?',
  ];

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Dashboard"
        subtitle="Your LitVM ecosystem overview"
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <GlassCard variant="gradient" className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium uppercase tracking-wider text-primary">
                Welcome to LitAgent
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              The AI Companion for the{' '}
              <span className="gradient-text">LitVM Ecosystem</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Explore projects, track your portfolio, complete missions, and navigate everything
              from one dashboard. Connect your wallet to get started.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => setActiveNav('copilot')}
                className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-[0_0_24px_-4px_rgba(124,58,237,0.5)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm">
                  <Image
                    src="/askme-logo.png"
                    alt="Ask Me"
                    width={16}
                    height={16}
                    className="h-full w-full object-contain"
                  />
                </div>
                Ask Me
              </button>
              <button
                onClick={() => setActiveNav('projects')}
                className="flex items-center gap-2 rounded-lg glass px-4 py-2.5 text-sm font-medium text-white transition-all hover:border-primary/30"
              >
                Explore Projects
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Quick stats & Wallet Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard hover className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            {address ? (
              <BadgePill label="Connected" variant="success" />
            ) : (
              <BadgePill label="Disconnected" variant="default" />
            )}
          </div>
          <div className="mt-4">
            <p className="text-xl font-semibold text-white">
              {address ? truncateAddress(address, 5) : 'Not Connected'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Wallet Overview</p>
          </div>
        </GlassCard>

        <StatCard
          icon={Briefcase}
          label="Portfolio Value"
          value={address ? '0.00 Lit' : '—'}
        />
        <StatCard
          icon={Target}
          label="Missions Completed"
          value={address ? '0' : '—'}
        />
        <StatCard
          icon={TrendingUp}
          label="Ecosystem Score"
          value={address ? '100' : '—'}
        />
      </div>

      {/* Ask Me Quick Prompt Widget */}
      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-black/50 border border-purple-500/30 shadow-md p-1">
            <Image
              src="/askme-logo.png"
              alt="Ask Me"
              width={36}
              height={36}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <h3 className="font-semibold text-white">Ask Me</h3>
            <p className="text-xs text-muted-foreground">
              Get instant answers about the LitVM ecosystem, tokenomics, and guides.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={quickCopilotInput}
            onChange={(e) => setQuickCopilotInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCopilotQuickAsk()}
            placeholder="Ask anything about LitVM projects, news, or missions..."
            className="flex-1 rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            onClick={() => handleCopilotQuickAsk()}
            className="flex h-10 items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </div>

        {/* Prompt suggestion pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Try asking:</span>
          {samplePrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleCopilotQuickAsk(prompt)}
              className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-white"
            >
              {prompt}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Featured Projects Widget */}
      <div>
        {loading ? (
          <ContentLoader lines={2} />
        ) : (
          <FeaturedProjectsWidget projects={featuredProjects} />
        )}
      </div>

      {/* News & Activity Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Latest LitVM News */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              Latest LitVM News
            </h3>
            <button
              onClick={() => setActiveNav('news')}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              View all news <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loading ? (
            <ContentLoader lines={3} />
          ) : news.length === 0 ? (
            <GlassCard className="p-6">
              <p className="text-sm text-muted-foreground text-center">
                No news articles available yet. Official LitVM ecosystem announcements will appear here.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {news.map((item) => (
                <GlassCard key={item.id} hover className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <BadgePill label={item.source} variant="primary" />
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(item.published_at)}
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-semibold text-white line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {item.summary}
                  </p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Read article <ExternalLink className="h-3 w-3" />
                  </a>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </h3>
          </div>

          {loading ? (
            <ContentLoader lines={3} />
          ) : activities.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity recorded yet"
              description="Connect your wallet or complete missions in the LitVM ecosystem to log your activity history."
            />
          ) : (
            <GlassCard className="p-5">
              <div className="space-y-4">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 border-b border-white/5 pb-3 last:border-none last:pb-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{act.title}</p>
                      {act.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(act.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

