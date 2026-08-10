import { supabase } from './supabase';
import { awardXP, getUserXP } from './xp-service';
import type { ReferralRecord, ReferralStatus } from './types';

export interface ReferralStatsData {
  referral_code: string;
  referral_link: string;
  total_referrals: number;
  pending_referrals: number;
  qualified_referrals: number;
  total_rewards_xp: number;
}

/**
 * Generate or fetch deterministic unique referral code for user
 */
export async function getUserReferralCode(userId: string): Promise<string> {
  if (!userId) return 'LIT_GUEST';

  // 1. Try to fetch existing user profile or user_xp metadata
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, id')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.username) {
      const cleanUsername = profile.username.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleanUsername.length >= 3) {
        return `LIT_${cleanUsername}`;
      }
    }
  } catch {
    // Ignore profile fetch fallback
  }

  // Fallback code generation
  const cleanId = userId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `REF_${cleanId.slice(0, 8)}`;
}

/**
 * Get comprehensive referral stats for a user
 */
export async function getReferralStats(userId: string, appBaseUrl?: string): Promise<ReferralStatsData> {
  const referralCode = await getUserReferralCode(userId);
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const baseUrl = appBaseUrl || envUrl || originUrl || 'https://litagent.app';
  const referralLink = `${baseUrl}/join?ref=${referralCode}`;

  if (!userId) {
    return {
      referral_code: referralCode,
      referral_link: referralLink,
      total_referrals: 0,
      pending_referrals: 0,
      qualified_referrals: 0,
      total_rewards_xp: 0,
    };
  }

  try {
    // Query referrals where referrer_user_id = userId
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_user_id', userId);

    if (error || !referrals) {
      return {
        referral_code: referralCode,
        referral_link: referralLink,
        total_referrals: 0,
        pending_referrals: 0,
        qualified_referrals: 0,
        total_rewards_xp: 0,
      };
    }

    const totalReferrals = referrals.length;
    const pendingReferrals = referrals.filter((r) => r.status === 'pending').length;
    const qualifiedReferrals = referrals.filter((r) => r.status === 'qualified' || r.status === 'rewarded').length;

    // Fetch total XP earned from referral source in xp_transactions
    const { data: xpTx } = await supabase
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('source', 'referral');

    const totalRewardsXP = xpTx ? xpTx.reduce((sum, item) => sum + item.amount, 0) : qualifiedReferrals * 100;

    return {
      referral_code: referralCode,
      referral_link: referralLink,
      total_referrals: totalReferrals,
      pending_referrals: pendingReferrals,
      qualified_referrals: qualifiedReferrals,
      total_rewards_xp: totalRewardsXP,
    };
  } catch {
    return {
      referral_code: referralCode,
      referral_link: referralLink,
      total_referrals: 0,
      pending_referrals: 0,
      qualified_referrals: 0,
      total_rewards_xp: 0,
    };
  }
}

/**
 * Record a new referral connection
 */
export async function recordReferral(params: {
  referrerCode: string;
  referredUserId: string;
}): Promise<{ success: boolean; message: string; referral?: ReferralRecord }> {
  const { referrerCode, referredUserId } = params;

  if (!referrerCode || !referredUserId) {
    return { success: false, message: 'Invalid referral code or user parameters.' };
  }

  try {
    // 1. Resolve referrer_user_id from code
    let referrerUserId: string | null = null;

    if (referrerCode.startsWith('REF_') || referrerCode.startsWith('LIT_')) {
      const codePart = referrerCode.replace(/^(REF_|LIT_)/, '').toLowerCase();

      // Look up profile by username
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', codePart)
        .maybeSingle();

      if (prof) {
        referrerUserId = prof.id;
      }
    }

    // Fallback resolution
    if (!referrerUserId) {
      const { data: existingRef } = await supabase
        .from('referrals')
        .select('referrer_user_id')
        .eq('referral_code', referrerCode)
        .limit(1)
        .maybeSingle();

      if (existingRef) {
        referrerUserId = existingRef.referrer_user_id;
      }
    }

    if (!referrerUserId) {
      return { success: false, message: 'Invalid or expired referral code.' };
    }

    // Constraint 1: User cannot refer themselves
    if (referrerUserId === referredUserId) {
      return { success: false, message: 'Self-referrals are not allowed.' };
    }

    // Constraint 2: Check if referred user already has a valid referrer
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_user_id', referredUserId)
      .maybeSingle();

    if (existingReferral) {
      return {
        success: false,
        message: 'This user has already been referred by another ecosystem pioneer.',
        referral: existingReferral as ReferralRecord,
      };
    }

    // Insert new pending referral record
    const newRecord = {
      referrer_user_id: referrerUserId,
      referred_user_id: referredUserId,
      referral_code: referrerCode,
      status: 'pending' as ReferralStatus,
      created_at: new Date().toISOString(),
      metadata: { recorded_from: 'join_link' },
    };

    const { data: inserted, error } = await supabase
      .from('referrals')
      .insert(newRecord)
      .select()
      .maybeSingle();

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: 'Referral recorded successfully as pending qualification.',
      referral: (inserted || newRecord) as ReferralRecord,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error recording referral.';
    return { success: false, message: msg };
  }
}

/**
 * Qualify a referral and award XP via centralized service
 */
export async function qualifyReferral(
  referredUserId: string,
  qualificationReason = 'User completed initial ecosystem action'
): Promise<{ qualified: boolean; message: string; xpAwarded: number }> {
  if (!referredUserId) {
    return { qualified: false, message: 'User ID required', xpAwarded: 0 };
  }

  try {
    // 1. Find pending referral record
    const { data: referral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_user_id', referredUserId)
      .eq('status', 'pending')
      .maybeSingle();

    if (!referral) {
      return {
        qualified: false,
        message: 'No pending referral found for this user.',
        xpAwarded: 0,
      };
    }

    const referrerUserId = referral.referrer_user_id;

    // 2. Update referral record status to 'qualified'
    await supabase
      .from('referrals')
      .update({
        status: 'qualified',
        completed_at: new Date().toISOString(),
        metadata: { ...referral.metadata, qualification_reason: qualificationReason },
      })
      .eq('id', referral.id);

    // 3. Award +100 XP to Referrer via Central XP Service
    const referrerXPResult = await awardXP({
      userId: referrerUserId,
      amount: 100,
      type: 'referral_qualified',
      source: 'referral',
      referenceId: referral.id,
      description: `Referral Qualified: User ${referredUserId.slice(0, 6)} joined and completed tasks`,
      metadata: { referred_user_id: referredUserId },
    });

    // 4. Award +50 Welcome XP to Referred User
    await awardXP({
      userId: referredUserId,
      amount: 50,
      type: 'referral_welcome_bonus',
      source: 'referral',
      referenceId: referral.id,
      description: 'Welcome Bonus: Joined via ecosystem referral link (+50 XP)',
      metadata: { referrer_user_id: referrerUserId },
    });

    // 5. Update progress on Referral Missions for Referrer
    try {
      // Fetch total qualified referrals count for referrer
      const { data: qualifiedRefs } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_user_id', referrerUserId)
        .in('status', ['qualified', 'rewarded']);

      const qualifiedCount = qualifiedRefs?.length || 1;

      // Check and update referral missions:
      // a) "Invite a Friend" (1 referral needed)
      const { data: m1 } = await supabase
        .from('missions')
        .select('id')
        .eq('slug', 'invite-a-friend')
        .maybeSingle();

      if (m1 && qualifiedCount >= 1) {
        await supabase.from('user_missions').upsert({
          user_id: referrerUserId,
          mission_id: m1.id,
          status: 'completed',
          progress: 1,
          max_progress: 1,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // b) "Invite Users to Explore LitVM" (3 referrals needed)
      const { data: m3 } = await supabase
        .from('missions')
        .select('id')
        .eq('slug', 'invite-users-explore-litvm')
        .maybeSingle();

      if (m3 && qualifiedCount >= 3) {
        await supabase.from('user_missions').upsert({
          user_id: referrerUserId,
          mission_id: m3.id,
          status: 'completed',
          progress: 3,
          max_progress: 3,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch {
      // Ignore mission tracking errors
    }

    return {
      qualified: true,
      message: `Referral successfully qualified! Awarded +100 XP to referrer.`,
      xpAwarded: referrerXPResult.xpAwarded || 100,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error qualifying referral.';
    return { qualified: false, message: msg, xpAwarded: 0 };
  }
}

/**
 * Get referral history for user
 */
export async function getReferralHistory(userId: string): Promise<ReferralRecord[]> {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as ReferralRecord[];
  } catch {
    return [];
  }
}
