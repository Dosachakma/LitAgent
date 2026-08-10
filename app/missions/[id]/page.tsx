'use client';

import { use } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { MissionDetailPage } from '@/components/pages/mission-detail-page';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <DashboardShell>
      <MissionDetailPage missionId={id} />
    </DashboardShell>
  );
}
