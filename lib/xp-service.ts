import { supabase } from './supabase';
import { DEFAULT_XP_LEVELS, calculateLevel, DEFAULT_CURATED_MISSIONS } from './xp-config';
import { XVerificationProvider } from '@/services/missions/x-verification-provider';
import type { Mission, UserXPProfile, XPTransaction, LeaderboardEntry } from './types';

export interface AwardXPParams {
  userId: string;
  amount: number;
  type: string;
  source: string;
  referenceId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface AwardXPResult {
  success: boolean;
  xpAwarded: number;
  totalXP: number;
  newLevel: number;
  leveledUp: boolean;
  message?: string;
}

export interface CheckinResult {
  success: boolean;
  streak: number;
  xpAwarded: number;
  totalXP: number;
  message: string;
  alreadyCheckedIn: boolean;
}

/**
 * Get or initialize user's XP profile
 */
export async function getUserXP(userId: string): Promise<UserXPProfile> {
  if (!userId) {
    return {
      user_id: 'guest',
      total_xp: 0,
      current_level: 1,
      streak_count: 0,
      last_checkin_date: null,
      updated_at: new Date().toISOString(),
    };
  }

  try {
    const { data, error } = await supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      return data as UserXPProfile;
    }

    // Initialize profile if none exists
    const initialProfile: UserXPProfile = {
      user_id: userId,
      total_xp: 0,
      current_level: 1,
      streak_count: 0,
      last_checkin_date: null,
      updated_at: new Date().toISOString(),
    };

    await supabase.from('user_xp').upsert(initialProfile);
    return initialProfile;
  } catch {
    return {
      user_id: userId,
      total_xp: 0,
      current_level: 1,
      streak_count: 0,
      last_checkin_date: null,
      updated_at: new Date().toISOString(),
    };
  }
}

/**
 * Award XP to user safely with duplicate transaction prevention and level calculation
 */
export async function awardXP(params: AwardXPParams): Promise<AwardXPResult> {
  const { userId, amount, type, source, referenceId, description, metadata } = params;

  if (!userId || amount <= 0) {
    return {
      success: false,
      xpAwarded: 0,
      totalXP: 0,
      newLevel: 1,
      leveledUp: false,
      message: 'Invalid user or zero XP amount.',
    };
  }

  try {
    // 1. Check for duplicate transaction if referenceId provided
    if (referenceId) {
      const { data: existingTx } = await supabase
        .from('xp_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('source', source)
        .eq('reference_id', referenceId)
        .maybeSingle();

      if (existingTx) {
        const currentProfile = await getUserXP(userId);
        return {
          success: false,
          xpAwarded: 0,
          totalXP: currentProfile.total_xp,
          newLevel: currentProfile.current_level,
          leveledUp: false,
          message: 'XP for this action has already been awarded.',
        };
      }
    }

    // 2. Fetch current user XP profile
    const currentProfile = await getUserXP(userId);
    const oldLevel = currentProfile.current_level;
    const newTotalXP = currentProfile.total_xp + amount;
    const computedLevel = calculateLevel(newTotalXP).level;
    const leveledUp = computedLevel > oldLevel;

    // 3. Insert transaction log
    const txLog = {
      user_id: userId,
      amount,
      type,
      source,
      reference_id: referenceId || null,
      description,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };

    await supabase.from('xp_transactions').insert(txLog);

    // 4. Update user_xp profile
    const updatedProfile = {
      user_id: userId,
      total_xp: newTotalXP,
      current_level: computedLevel,
      updated_at: new Date().toISOString(),
    };

    await supabase.from('user_xp').upsert(updatedProfile);

    return {
      success: true,
      xpAwarded: amount,
      totalXP: newTotalXP,
      newLevel: computedLevel,
      leveledUp,
      message: `Successfully earned +${amount} XP!`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error awarding XP';
    return {
      success: false,
      xpAwarded: 0,
      totalXP: 0,
      newLevel: 1,
      leveledUp: false,
      message: errorMsg,
    };
  }
}

/**
 * Execute UTC Daily Check-in with Streak Calculation
 */
export async function executeDailyCheckin(userId: string): Promise<CheckinResult> {
  if (!userId) {
    return {
      success: false,
      streak: 0,
      xpAwarded: 0,
      totalXP: 0,
      message: 'Authentication required for daily check-in.',
      alreadyCheckedIn: false,
    };
  }

  // Get current UTC date string YYYY-MM-DD
  const now = new Date();
  const todayUTC = now.toISOString().split('T')[0];

  // Calculate yesterday's UTC date string YYYY-MM-DD
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayUTC = yesterday.toISOString().split('T')[0];

  try {
    const profile = await getUserXP(userId);

    // Check duplicate check-in today
    if (profile.last_checkin_date === todayUTC) {
      return {
        success: false,
        streak: profile.streak_count,
        xpAwarded: 0,
        totalXP: profile.total_xp,
        message: 'You have already checked in today! Come back tomorrow (00:00 UTC).',
        alreadyCheckedIn: true,
      };
    }

    // Determine streak
    let newStreak = 1;
    if (profile.last_checkin_date === yesterdayUTC) {
      newStreak = profile.streak_count + 1;
    } else {
      newStreak = 1; // Reset streak if missed day
    }

    // Calculate XP: Base 50 XP + Streak Bonus (10 XP per streak day up to +100 bonus)
    const baseXP = 50;
    const streakBonus = Math.min((newStreak - 1) * 10, 100);
    const totalAwardXP = baseXP + streakBonus;

    // Record checkin entry
    await supabase.from('daily_checkins').insert({
      user_id: userId,
      checkin_date: todayUTC,
      streak: newStreak,
      xp_awarded: totalAwardXP,
      created_at: new Date().toISOString(),
    });

    // Update profile checkin date & streak
    await supabase.from('user_xp').upsert({
      user_id: userId,
      streak_count: newStreak,
      last_checkin_date: todayUTC,
      updated_at: new Date().toISOString(),
    });

    // Award XP
    const xpResult = await awardXP({
      userId,
      amount: totalAwardXP,
      type: 'daily_checkin',
      source: 'checkin',
      referenceId: todayUTC,
      description: `Daily Check-in Day ${newStreak} (+${totalAwardXP} XP)`,
      metadata: { streak: newStreak, checkin_date: todayUTC },
    });

    // Mark daily check-in mission as completed if mission exists
    try {
      const { data: checkinMission } = await supabase
        .from('missions')
        .select('id')
        .eq('slug', 'daily-check-in')
        .maybeSingle();

      if (checkinMission) {
        await supabase.from('user_missions').upsert({
          user_id: userId,
          mission_id: checkinMission.id,
          status: 'completed',
          progress: 1,
          max_progress: 1,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch {
      // Ignore if mission table is not queried
    }

    return {
      success: true,
      streak: newStreak,
      xpAwarded: totalAwardXP,
      totalXP: xpResult.totalXP,
      message: `Day ${newStreak} Check-in successful! Earned +${totalAwardXP} XP (${baseXP} Base + ${streakBonus} Streak Bonus)`,
      alreadyCheckedIn: false,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Check-in failed';
    return {
      success: false,
      streak: 0,
      xpAwarded: 0,
      totalXP: 0,
      message: msg,
      alreadyCheckedIn: false,
    };
  }
}

/**
 * Fetch XP Transactions history for user
 */
export async function getXPHistory(userId: string, limit = 20): Promise<XPTransaction[]> {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as XPTransaction[];
  } catch {
    return [];
  }
}

/**
 * Fetch All Active Missions merged with User's Progress
 */
export async function fetchMissionsWithUserProgress(userId?: string, category?: string): Promise<Mission[]> {
  try {
    // 1. Try to fetch from database
    let query = supabase.from('missions').select('*').eq('is_active', true).order('created_at', { ascending: false });
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data: dbMissions, error } = await query;
    let missionsList: Mission[] = [];

    if (!error && dbMissions && dbMissions.length > 0) {
      missionsList = dbMissions.map((m) => ({
        ...m,
        status: 'available',
        xp_reward: m.xp_reward || 50,
      }));
    } else {
      // Use Curated Default Missions
      missionsList = DEFAULT_CURATED_MISSIONS as unknown as Mission[];
      if (category && category !== 'All') {
        missionsList = missionsList.filter((m) => m.category === category);
      }
    }

    // 2. If userId provided, map completion & status from user_missions
    if (userId) {
      const { data: userMissions } = await supabase
        .from('user_missions')
        .select('*')
        .eq('user_id', userId);

      const completedMap = new Map<string, any>();
      if (userMissions) {
        for (const um of userMissions) {
          completedMap.set(um.mission_id, um);
        }
      }

      // Check daily check-in date
      const todayUTC = new Date().toISOString().split('T')[0];

      missionsList = missionsList.map((m) => {
        const userProgress = completedMap.get(m.id);
        let status: any = m.status || 'available';
        let progress = 0;
        const max_progress = 1;

        if (m.type === 'DAILY_CHECKIN') {
          // Check if checked in today
          if (userProgress?.updated_at?.startsWith(todayUTC) || userProgress?.status === 'completed') {
            status = 'completed';
            progress = 1;
          }
        } else if (userProgress) {
          status = userProgress.status || 'available';
          progress = userProgress.progress || 0;
        }

        return {
          ...m,
          status,
          progress,
          max_progress,
        };
      });
    }

    return missionsList;
  } catch {
    return DEFAULT_CURATED_MISSIONS as unknown as Mission[];
  }
}

/**
 * Validate & Complete Mission with Modular Verification
 */
export async function completeMission(
  userId: string,
  missionIdOrSlug: string,
  verificationContext?: Record<string, unknown>
): Promise<{ success: boolean; message: string; xpAwarded: number; mission?: Mission }> {
  if (!userId) {
    return {
      success: false,
      message: 'Please sign in or connect your wallet to complete missions.',
      xpAwarded: 0,
    };
  }

  try {
    // 1. Get mission definition
    let mission: Mission | null = null;
    const { data: dbMission } = await supabase
      .from('missions')
      .select('*')
      .or(`id.eq.${missionIdOrSlug},slug.eq.${missionIdOrSlug}`)
      .maybeSingle();

    if (dbMission) {
      mission = dbMission as Mission;
    } else {
      const defaultMatch = DEFAULT_CURATED_MISSIONS.find(
        (m) => m.id === missionIdOrSlug || m.slug === missionIdOrSlug
      );
      if (defaultMatch) {
        mission = defaultMatch as unknown as Mission;
      }
    }

    if (!mission) {
      return { success: false, message: 'Mission not found.', xpAwarded: 0 };
    }

    // 2. Check if already completed
    const { data: existingUserMission } = await supabase
      .from('user_missions')
      .select('*')
      .eq('user_id', userId)
      .eq('mission_id', mission.id)
      .maybeSingle();

    if (existingUserMission && existingUserMission.status === 'completed' && mission.type !== 'DAILY_CHECKIN') {
      return {
        success: false,
        message: 'You have already completed this mission.',
        xpAwarded: 0,
        mission,
      };
    }

    // 3. Modular Verification Logic
    let isVerified = false;
    let verificationNote = '';

    switch (mission.type) {
      case 'DAILY_CHECKIN': {
        const checkinRes = await executeDailyCheckin(userId);
        return {
          success: checkinRes.success,
          message: checkinRes.message,
          xpAwarded: checkinRes.xpAwarded,
          mission,
        };
      }

      case 'CONNECT_WALLET': {
        // Verify wallet address in auth / context
        const walletConnected = Boolean(verificationContext?.walletAddress || verificationContext?.userHasWallet);
        if (walletConnected) {
          isVerified = true;
          verificationNote = 'Verified connected Web3 wallet';
        } else {
          return {
            success: false,
            message: 'No connected Web3 wallet found. Please connect your wallet in the Wallet tab.',
            xpAwarded: 0,
            mission,
          };
        }
        break;
      }

      case 'READ_NEWS':
      case 'EXPLORE_PROJECT':
      case 'VISIT_PROJECT':
      case 'COMPLETE_ECOSYSTEM_ACTION':
      case 'SPECIAL_EVENT': {
        // System / Database verified ecosystem actions
        isVerified = true;
        verificationNote = `Verified ecosystem action for ${mission.title}`;
        break;
      }

      case 'LIKE_POST':
      case 'REPOST_POST':
      case 'REPLY_POST':
      case 'QUOTE_POST':
      case 'FOLLOW_ACCOUNT':
      case 'SOCIAL_FOLLOW':
      case 'SOCIAL_LIKE':
      case 'SOCIAL_REPOST':
      case 'SOCIAL_COMMENT': {
        const verifyRes = await XVerificationProvider.verifyAction(
          userId,
          mission.type as any,
          mission.target_url || (Array.isArray(mission.requirements) ? mission.requirements[0] : undefined),
          verificationContext
        );

        if (!verifyRes.verified) {
          return {
            success: false,
            message: verifyRes.message,
            xpAwarded: 0,
            mission,
          };
        }

        isVerified = true;
        verificationNote = verifyRes.message;
        break;
      }

      default:
        isVerified = true;
        break;
    }

    if (!isVerified) {
      return {
        success: false,
        message: 'Verification unavailable for this mission.',
        xpAwarded: 0,
        mission,
      };
    }

    // 4. Award XP
    const xpResult = await awardXP({
      userId,
      amount: mission.xp_reward || 50,
      type: 'mission_completion',
      source: 'mission',
      referenceId: mission.id,
      description: `Completed Mission: ${mission.title}`,
      metadata: { mission_id: mission.id, verification_note: verificationNote },
    });

    if (!xpResult.success) {
      return {
        success: false,
        message: xpResult.message || 'Failed to award XP.',
        xpAwarded: 0,
        mission,
      };
    }

    // 5. Save user_missions record
    await supabase.from('user_missions').upsert({
      user_id: userId,
      mission_id: mission.id,
      status: 'completed',
      progress: 1,
      max_progress: 1,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Mission completed! You earned +${mission.xp_reward} XP!`,
      xpAwarded: mission.xp_reward,
      mission,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to complete mission.';
    return {
      success: false,
      message: errorMsg,
      xpAwarded: 0,
    };
  }
}

/**
 * Server-Side Leaderboard Query
 */
export async function getLeaderboard(params?: {
  period?: 'all' | 'weekly' | 'monthly';
  timeframe?: 'all' | 'weekly' | 'monthly' | 'all_time';
  limit?: number;
  search?: string;
}): Promise<LeaderboardEntry[]> {
  const limit = params?.limit || 50;

  try {
    const { data: xpData, error } = await supabase
      .from('user_xp')
      .select('*')
      .order('total_xp', { ascending: false })
      .limit(limit);

    if (!error && xpData && xpData.length > 0) {
      // Fetch user profile info (usernames/wallets)
      const userIds = xpData.map((x) => x.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      const profileMap = new Map<string, any>();
      if (profiles) {
        profiles.forEach((p) => profileMap.set(p.id, p));
      }

      // Fetch completed missions count
      const { data: completedCounts } = await supabase
        .from('user_missions')
        .select('user_id')
        .eq('status', 'completed');

      const missionCountMap = new Map<string, number>();
      if (completedCounts) {
        completedCounts.forEach((c) => {
          missionCountMap.set(c.user_id, (missionCountMap.get(c.user_id) || 0) + 1);
        });
      }

      let entries: LeaderboardEntry[] = xpData.map((item, index) => {
        const prof = profileMap.get(item.user_id);
        const username = prof?.username || prof?.email?.split('@')[0] || `LitAgent_${item.user_id.slice(0, 6)}`;
        const displayName = prof?.display_name || username;
        const walletAddress = prof?.wallet_address || null;

        return {
          rank: index + 1,
          user_id: item.user_id,
          username,
          display_name: displayName,
          avatar: prof?.avatar || null,
          wallet_address: walletAddress,
          total_xp: item.total_xp,
          current_level: item.current_level || calculateLevel(item.total_xp).level,
          completed_missions: missionCountMap.get(item.user_id) || 0,
          streak: item.streak_count || 0,
        };
      });

      if (params?.search && params.search.trim() !== '') {
        const s = params.search.toLowerCase().trim();
        entries = entries.filter(
          (e) =>
            e.username.toLowerCase().includes(s) ||
            e.display_name.toLowerCase().includes(s) ||
            (e.wallet_address && e.wallet_address.toLowerCase().includes(s))
        );
      }

      return entries;
    }

    // If database has no entries yet, return clean empty list or default verified top entries
    return [];
  } catch {
    return [];
  }
}
