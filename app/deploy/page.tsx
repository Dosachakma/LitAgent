'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { DeployPage } from '@/components/pages/deploy-page';

export default function Deploy() {
  return (
    <DashboardShell>
      <DeployPage />
    </DashboardShell>
  );
}
