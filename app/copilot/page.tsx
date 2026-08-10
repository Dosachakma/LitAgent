'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { CopilotPage } from '@/components/pages/copilot-page';

export default function CopilotRoutePage() {
  return (
    <DashboardShell>
      <CopilotPage />
    </DashboardShell>
  );
}
