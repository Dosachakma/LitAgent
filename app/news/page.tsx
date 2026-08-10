'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { NewsPage } from '@/components/pages/news-page';

export default function Page() {
  return (
    <DashboardShell>
      <NewsPage />
    </DashboardShell>
  );
}
