'use client';

import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { NotificationPanel } from './notification-panel';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background bg-radial-glow">
      <Sidebar />
      <div className="lg:pl-[260px]">
        <Topbar />
        <main className="min-h-[calc(100vh-4rem)] p-4 lg:p-6">
          {children}
        </main>
      </div>
      <NotificationPanel />
    </div>
  );
}
