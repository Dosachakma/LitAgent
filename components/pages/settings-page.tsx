'use client';

import { Settings } from 'lucide-react';
import { SectionTitle } from '@/components/shared/section-title';
import { ConnectedAccountsCard } from '@/components/settings/connected-accounts-card';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <SectionTitle
        title="Settings"
        subtitle="Manage your connected social accounts"
        icon={<Settings className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-4">
        {/* Connected Accounts */}
        <ConnectedAccountsCard />
      </div>
    </div>
  );
}
