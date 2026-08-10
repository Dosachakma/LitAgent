'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { useUIStore } from '@/store/ui-store';
import { DashboardPage } from '@/components/pages/dashboard-page';
import { CopilotPage } from '@/components/pages/copilot-page';
import { WalletPage } from '@/components/pages/wallet-page';
import { DeployPage } from '@/components/pages/deploy-page';
import { PortfolioPage } from '@/components/pages/portfolio-page';
import { ProjectsPage } from '@/components/pages/projects-page';
import { NewsPage } from '@/components/pages/news-page';
import { MissionsPage } from '@/components/pages/missions-page';
import { LeaderboardPage } from '@/components/pages/leaderboard-page';
import { CommunityPage } from '@/components/pages/community-page';
import { ReferralPage } from '@/components/pages/referral-page';
import { AnalyticsPage } from '@/components/pages/analytics-page';
import { SettingsPage } from '@/components/pages/settings-page';
import type { NavKey } from '@/lib/types';

const pageMap: Record<NavKey, React.ComponentType> = {
  dashboard: DashboardPage,
  copilot: CopilotPage,
  wallet: WalletPage,
  deploy: DeployPage,
  portfolio: PortfolioPage,
  projects: ProjectsPage,
  news: NewsPage,
  missions: MissionsPage,
  leaderboard: LeaderboardPage,
  community: CommunityPage,
  referral: ReferralPage,
  analytics: AnalyticsPage,
  settings: SettingsPage,
};

export default function Home() {
  const { activeNav } = useUIStore();
  const Page = pageMap[activeNav];

  return (
    <DashboardShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeNav}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <Page />
        </motion.div>
      </AnimatePresence>
    </DashboardShell>
  );
}
