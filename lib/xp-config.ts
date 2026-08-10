export interface XPLevel {
  level: number;
  title: string;
  xpRequired: number;
  badge: string;
  color: string;
}

export const DEFAULT_XP_LEVELS: XPLevel[] = [
  { level: 1, title: 'Novice Explorer', xpRequired: 0, badge: '🌱', color: 'from-slate-500 to-gray-400' },
  { level: 2, title: 'Testnet Pioneer', xpRequired: 100, badge: '⚡', color: 'from-blue-500 to-indigo-500' },
  { level: 3, title: 'LitVM Specialist', xpRequired: 250, badge: '🔥', color: 'from-purple-500 to-pink-500' },
  { level: 4, title: 'zkLTC Strategist', xpRequired: 500, badge: '🔮', color: 'from-amber-500 to-orange-500' },
  { level: 5, title: 'Ecosystem Master', xpRequired: 1000, badge: '👑', color: 'from-emerald-500 to-teal-500' },
  { level: 6, title: 'LitAgent Titan', xpRequired: 2500, badge: '🌌', color: 'from-violet-600 to-fuchsia-600' },
];

export function calculateLevel(totalXP: number): XPLevel {
  let current = DEFAULT_XP_LEVELS[0];
  for (const lvl of DEFAULT_XP_LEVELS) {
    if (totalXP >= lvl.xpRequired) {
      current = lvl;
    } else {
      break;
    }
  }
  return current;
}

export function getLevelProgress(totalXP: number): {
  currentLevel: XPLevel;
  nextLevel: XPLevel | null;
  currentXP: number;
  nextXP: number;
  progressPercent: number;
  xpToNext: number;
} {
  const currentLevel = calculateLevel(totalXP);
  const currentIndex = DEFAULT_XP_LEVELS.findIndex((l) => l.level === currentLevel.level);
  const nextLevel = DEFAULT_XP_LEVELS[currentIndex + 1] || null;

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      currentXP: totalXP,
      nextXP: currentLevel.xpRequired,
      progressPercent: 100,
      xpToNext: 0,
    };
  }

  const baseXP = currentLevel.xpRequired;
  const neededXP = nextLevel.xpRequired - baseXP;
  const earnedInLevel = Math.max(0, totalXP - baseXP);
  const progressPercent = Math.min(100, Math.round((earnedInLevel / neededXP) * 100));
  const xpToNext = nextLevel.xpRequired - totalXP;

  return {
    currentLevel,
    nextLevel,
    currentXP: totalXP,
    nextXP: nextLevel.xpRequired,
    progressPercent,
    xpToNext,
  };
}

// Initial Curated Ecosystem Missions (Fallback & DB Seeding)
export const DEFAULT_CURATED_MISSIONS = [
  {
    id: 'm-daily-checkin',
    slug: 'daily-check-in',
    title: 'Daily LitVM Ecosystem Check-in',
    description: 'Check in daily to build your streak and earn scaling XP rewards.',
    type: 'DAILY_CHECKIN',
    category: 'Daily',
    difficulty: 'Easy',
    xp_reward: 50,
    status: 'available',
    verification_type: 'database',
    requirements: ['Perform 1 check-in per UTC calendar day', 'Maintain streak for bonus XP'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'm-connect-wallet',
    slug: 'connect-web3-wallet',
    title: 'Connect Web3 Wallet',
    description: 'Connect your EVM or LitVM compatible wallet (MetaMask, Rabby, etc.) to LitAgent.',
    type: 'CONNECT_WALLET',
    category: 'Daily',
    difficulty: 'Easy',
    xp_reward: 100,
    status: 'available',
    verification_type: 'wallet',
    requirements: ['Connect an active wallet address to LitAgent'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'm-read-news',
    slug: 'read-litvm-announcement',
    title: 'Read Ecosystem Announcements',
    description: 'Stay updated with the latest official news and LitVM network releases.',
    type: 'READ_NEWS',
    category: 'Daily',
    difficulty: 'Easy',
    xp_reward: 75,
    status: 'available',
    verification_type: 'database',
    requirements: ['Read at least 1 official news article in the News hub'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'm-explore-litswap',
    slug: 'explore-litswap-dex',
    title: 'Explore LitSwap DEX',
    description: 'Visit the official LitSwap decentralized exchange project in the Ecosystem Explorer.',
    type: 'EXPLORE_PROJECT',
    category: 'Ecosystem',
    difficulty: 'Medium',
    xp_reward: 150,
    project_slug: 'litswap',
    project_name: 'LitSwap DEX',
    status: 'available',
    verification_type: 'database',
    requirements: ['Explore LitSwap DEX listing and review technical details'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'm-explore-bridge',
    slug: 'explore-litbridge-protocol',
    title: 'Explore LitBridge Protocol',
    description: 'Review the cross-chain zkLTC bridging architecture and smart contract specifications.',
    type: 'EXPLORE_PROJECT',
    category: 'Ecosystem',
    difficulty: 'Medium',
    xp_reward: 150,
    project_slug: 'litbridge',
    project_name: 'LitBridge Protocol',
    status: 'available',
    verification_type: 'database',
    requirements: ['Inspect LitBridge protocol links and documentation'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'm-social-follow-x',
    slug: 'follow-litvm-twitter',
    title: 'Follow LitVM on X (Twitter)',
    description: 'Follow the official @LitVM_Ecosystem Twitter handle for real-time updates.',
    type: 'SOCIAL_FOLLOW',
    category: 'Social',
    difficulty: 'Easy',
    xp_reward: 100,
    status: 'available',
    verification_type: 'social_api',
    requirements: ['Follow @LitVM_Ecosystem on X', 'Verification via X API integration'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'm-social-join-telegram',
    slug: 'join-litvm-telegram',
    title: 'Join LitVM Telegram Community',
    description: 'Join the official LitVM Telegram discussion group to interact with core developers.',
    type: 'SOCIAL_FOLLOW',
    category: 'Social',
    difficulty: 'Easy',
    xp_reward: 100,
    status: 'available',
    verification_type: 'social_api',
    requirements: ['Join Telegram group t.me/LitVMOfficial', 'Verification via Telegram Bot API'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'm-referral-invite-friend',
    slug: 'invite-a-friend',
    title: 'Invite a Friend to LitAgent',
    description: 'Share your unique referral link with a friend and earn +100 XP when they join LitAgent.',
    type: 'REFERRAL',
    category: 'Referral',
    difficulty: 'Easy',
    xp_reward: 100,
    status: 'available',
    verification_type: 'database',
    requirements: ['Generate and share your unique referral link', 'Referred user creates an account or connects wallet'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'm-referral-new-user',
    slug: 'refer-a-new-litagent-user',
    title: 'Refer a New LitAgent User',
    description: 'Help expand the LitVM ecosystem by referring new active community members.',
    type: 'REFERRAL',
    category: 'Referral',
    difficulty: 'Medium',
    xp_reward: 150,
    status: 'available',
    verification_type: 'database',
    requirements: ['Referred user completes at least 1 ecosystem mission or check-in'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'm-referral-explore-litvm',
    slug: 'invite-users-explore-litvm',
    title: 'Invite Users to Explore LitVM',
    description: 'Become an ecosystem ambassador by bringing 3 or more verified users to LitVM.',
    type: 'REFERRAL',
    category: 'Referral',
    difficulty: 'Hard',
    xp_reward: 200,
    status: 'available',
    verification_type: 'database',
    requirements: ['Successfully refer 3 or more qualified users to the LitVM platform'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'm-special-epoch-campaign',
    slug: 'genesis-epoch-participant',
    title: 'LitVM Genesis Epoch Participant',
    description: 'Special seasonal campaign rewarding early pioneers during Epoch 1 of LitVM.',
    type: 'SPECIAL_EVENT',
    category: 'Campaign',
    difficulty: 'Hard',
    xp_reward: 500,
    status: 'available',
    verification_type: 'database',
    requirements: ['Complete 3 or more ecosystem tasks during Epoch 1'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
];
