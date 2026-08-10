import {
  LayoutDashboard,
  Sparkles,
  Wallet,
  Rocket,
  Briefcase,
  Boxes,
  Newspaper,
  Target,
  Trophy,
  Users,
  Gift,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { NavKey } from './types';

export interface NavItem {
  key: NavKey;
  label: string;
  icon: LucideIcon;
  description: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview of your LitVM activity',
  },
  {
    key: 'copilot',
    label: 'Ask Me',
    icon: Sparkles,
    description: 'Your Web3 Intelligence',
  },
  {
    key: 'wallet',
    label: 'Wallet',
    icon: Wallet,
    description: 'Connect and manage your wallets',
  },
  {
    key: 'deploy',
    label: '1-Click Deploy',
    icon: Rocket,
    description: 'Deploy smart contracts on LitVM',
  },
  {
    key: 'portfolio',
    label: 'Portfolio',
    icon: Briefcase,
    description: 'Track your LitVM holdings',
  },
  {
    key: 'projects',
    label: 'Projects',
    icon: Boxes,
    description: 'Explore the LitVM ecosystem',
  },
  {
    key: 'news',
    label: 'News',
    icon: Newspaper,
    description: 'Official updates and announcements',
  },
  {
    key: 'missions',
    label: 'Missions & Rewards',
    icon: Target,
    description: 'Complete tasks, earn XP, referral & leaderboard',
  },
  {
    key: 'community',
    label: 'Community',
    icon: Users,
    description: 'Connect with the LitVM community',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Insights into your activity',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'Manage your account preferences',
  },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [NAV_ITEMS[0], NAV_ITEMS[1]],
  },
  {
    label: 'Developer & Assets',
    items: [NAV_ITEMS[3]],
  },
  {
    label: 'Ecosystem',
    items: [NAV_ITEMS[5], NAV_ITEMS[6], NAV_ITEMS[7], NAV_ITEMS[8]],
  },
  {
    label: 'Account',
    items: [NAV_ITEMS[9], NAV_ITEMS[10]],
  },
];
