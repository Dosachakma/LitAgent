export type NavKey =
  | 'dashboard'
  | 'copilot'
  | 'wallet'
  | 'deploy'
  | 'portfolio'
  | 'projects'
  | 'news'
  | 'missions'
  | 'leaderboard'
  | 'community'
  | 'referral'
  | 'analytics'
  | 'settings';

export type ProjectStatus = 'Live' | 'Testnet' | 'Coming Soon';
export type VerificationStatus = 'Official' | 'Verified' | 'Community' | 'Unverified';

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  logo_url: string | null;
  banner_url?: string | null;
  tags?: string[] | null;
  status?: ProjectStatus | string;
  website_url: string | null;
  twitter_url: string | null;
  x_url?: string | null;
  discord_url: string | null;
  telegram_url?: string | null;
  github_url?: string | null;
  docs_url?: string | null;
  is_verified?: boolean;
  is_official?: boolean;
  is_featured?: boolean;
  featured?: boolean; // backwards compatibility
  verification_status?: VerificationStatus;
  contract_addresses?: Record<string, string> | null;
  supported_networks?: string[] | null;
  referral_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  url: string;
  image_url: string | null;
  published_at: string;
  tags: string[];
  is_hidden?: boolean;
  is_featured?: boolean;
}

export type MissionType =
  | 'DAILY_CHECKIN'
  | 'READ_NEWS'
  | 'EXPLORE_PROJECT'
  | 'VISIT_PROJECT'
  | 'VISIT_LINK'
  | 'CONNECT_WALLET'
  | 'COMPLETE_ECOSYSTEM_ACTION'
  | 'SOCIAL_FOLLOW'
  | 'SOCIAL_LIKE'
  | 'SOCIAL_REPOST'
  | 'SOCIAL_COMMENT'
  | 'LIKE_POST'
  | 'REPOST_POST'
  | 'REPLY_POST'
  | 'QUOTE_POST'
  | 'FOLLOW_ACCOUNT'
  | 'REFERRAL'
  | 'SPECIAL_EVENT';

export type MissionCategory =
  | 'Daily'
  | 'Weekly'
  | 'Social'
  | 'Ecosystem'
  | 'Referral'
  | 'Campaign'
  | 'Special'
  | 'Official';

export type MissionDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export type MissionStatus = 'available' | 'in_progress' | 'completed' | 'expired' | 'locked' | 'active';

export type VerificationType =
  | 'manual'
  | 'database'
  | 'wallet'
  | 'transaction'
  | 'social_api'
  | 'external_api'
  | 'admin';

export interface Mission {
  id: string;
  slug?: string;
  title: string;
  description: string;
  reward?: string;
  xp_reward: number;
  type: MissionType;
  category: MissionCategory;
  difficulty: MissionDifficulty;
  status: MissionStatus;
  source?: string;
  source_url?: string;
  target_url?: string;
  source_post_id?: string;
  start_at?: string | null;
  end_at?: string | null;
  expires_at?: string | null;
  requirements?: string[] | Record<string, unknown> | null;
  verification_type: VerificationType;
  max_completions?: number;
  progress?: number;
  max_progress?: number;
  project_id?: string | null;
  project_slug?: string | null;
  project_name?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserXPProfile {
  user_id: string;
  total_xp: number;
  current_level: number;
  streak_count: number;
  last_checkin_date: string | null;
  updated_at: string;
}

export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  source: string;
  reference_id?: string | null;
  description: string;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  wallet_address: string | null;
  total_xp: number;
  current_level: number;
  completed_missions: number;
  streak: number;
}

export interface UserActivity {
  id: string;
  user_id: string;
  type: 'wallet_connected' | 'mission_completed' | 'project_explored' | 'copilot_query' | 'news_read';
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url: string | null;
}

export interface PortfolioHolding {
  id: string;
  user_id: string;
  project_id: string;
  token_symbol: string;
  amount: number;
  value_usd: number;
  acquired_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export type ReferralStatus = 'pending' | 'qualified' | 'rewarded';

export interface ReferralRecord {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  referral_code: string;
  status: ReferralStatus;
  created_at: string;
  completed_at?: string | null;
  metadata?: Record<string, unknown> | null;
  referred_username?: string;
  referred_wallet?: string;
}

export interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  total_rewards: number;
  total_rewards_xp?: number;
  referral_code: string;
  referral_link?: string;
  pending_referrals?: number;
  qualified_referrals?: number;
}

export type WalletProvider = 'metamask' | 'rabby' | 'walletconnect' | 'injected';

export interface Profile {
  id: string;
  wallet_address: string | null;
  username: string | null;
  avatar: string | null;
  email: string | null;
  ens_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletRecord {
  id: string;
  user_id: string;
  wallet_address: string;
  wallet_provider: WalletProvider;
  network: string | null;
  connected_at: string;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  last_login: string;
  ip: string | null;
  device: string | null;
}

export interface AuthUser {
  id: string;
  email: string | null;
  walletAddress: string | null;
  username: string | null;
  avatar: string | null;
}

export type AuthMethod = 'metamask' | 'rabby' | 'walletconnect' | 'google' | 'email';

export type SocialProvider = 'x' | 'telegram' | 'discord';

export interface ConnectedAccount {
  id: string;
  user_id: string;
  provider: SocialProvider;
  provider_user_id: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  scopes?: string[] | null;
  connected_at: string;
  updated_at?: string | null;
}
