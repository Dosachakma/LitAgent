'use client';

import { ShieldCheck, User, LogOut, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { truncateAddress } from '@/lib/format';
import { BadgePill } from '@/components/shared/badge-pill';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function AdminHeader({ title, subtitle, onRefresh, refreshing }: AdminHeaderProps) {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
          <BadgePill label="ADMIN PORTAL" variant="primary" icon={ShieldCheck} />
        </div>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}

        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-xs">
            <User className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-white">
              {user?.username || (user?.walletAddress ? truncateAddress(user.walletAddress, 4) : 'Admin Operator')}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              Role: Authorized Admin
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">User Dashboard</span>
        </Link>
      </div>
    </header>
  );
}
