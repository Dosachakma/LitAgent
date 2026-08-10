'use client';

import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';
import { SectionTitle } from '@/components/shared/section-title';
import { EmptyState } from '@/components/shared/empty-state';
import { StatCard } from '@/components/shared/stat-card';
import { useWalletStore } from '@/store/wallet-store';

export function AnalyticsPage() {
  const { address } = useWalletStore();

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Analytics"
        subtitle="Insights into your LitVM activity"
        icon={<BarChart3 className="h-5 w-5" />}
      />

      {!address ? (
        <EmptyState
          icon={BarChart3}
          title="Connect your wallet"
          description="Connect a wallet to view your analytics. We'll show your ecosystem activity, portfolio performance, and engagement metrics."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={TrendingUp} label="Total Volume" value="—" />
            <StatCard icon={Activity} label="Transactions" value="—" />
            <StatCard icon={PieChart} label="Diversification" value="—" />
            <StatCard icon={BarChart3} label="Engagement Score" value="—" />
          </div>

          <EmptyState
            icon={BarChart3}
            title="No analytics data yet"
            description="Your analytics dashboard will populate as you interact with the LitVM ecosystem. Transaction history, portfolio charts, and engagement metrics will appear here."
          />
        </>
      )}
    </div>
  );
}
