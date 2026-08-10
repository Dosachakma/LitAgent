'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { LeaderboardPage } from '@/components/pages/leaderboard-page';

export default function Page() {
  return (
    <DashboardShell>
      <LeaderboardPage />
    </DashboardShell>
  );
}
