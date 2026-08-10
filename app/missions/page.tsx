'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { MissionsPage } from '@/components/pages/missions-page';

export default function Page() {
  return (
    <DashboardShell>
      <MissionsPage />
    </DashboardShell>
  );
}
