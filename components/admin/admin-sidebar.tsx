'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  Users,
  Trophy,
  Boxes,
  Newspaper,
  Award,
  Settings,
  Share2,
  ArrowLeft,
  Shield,
  Sparkles,
} from 'lucide-react';
import { BadgePill } from '@/components/shared/badge-pill';

export interface AdminNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: '/admin',
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'Real-time database statistics & telemetry',
  },
  {
    href: '/admin/missions',
    label: 'Missions',
    icon: Target,
    description: 'Manage tasks, requirements & XP rewards',
  },
  {
    href: '/admin/referrals',
    label: 'Referrals',
    icon: Share2,
    description: 'Review referral history & verify claims',
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: Users,
    description: 'Directory, profiles, wallets & activity',
  },
  {
    href: '/admin/leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    description: 'Inspect global & epoch rankings',
  },
  {
    href: '/admin/ecosystem',
    label: 'Ecosystem',
    icon: Boxes,
    description: 'Manage dApps, verification & links',
  },
  {
    href: '/admin/news',
    label: 'News',
    icon: Newspaper,
    description: 'Curate, feature & verify news feeds',
  },
  {
    href: '/admin/xp',
    label: 'XP Management',
    icon: Award,
    description: 'XP history & auditable manual adjustments',
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: Settings,
    description: 'Global system parameters & feature flags',
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col justify-between min-h-screen p-4">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary ring-1 ring-primary/30">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-white tracking-tight">LitAgent</h1>
              <BadgePill label="ADMIN" variant="primary" />
            </div>
            <p className="text-[11px] text-muted-foreground">Ecosystem Control Panel</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary/20 text-white font-semibold ring-1 ring-primary/30 shadow-md'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-white'
                  }`}
                />
                <div className="truncate">
                  <p className="truncate">{item.label}</p>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Return Button */}
      <div className="pt-4 border-t border-white/10 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-medium text-muted-foreground transition-all hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 text-primary" />
          <span>Exit to Dashboard</span>
        </Link>
        <div className="px-2 text-[10px] text-muted-foreground/60 font-mono text-center">
          LitVM Admin Engine v1.0 • Secure
        </div>
      </div>
    </aside>
  );
}
