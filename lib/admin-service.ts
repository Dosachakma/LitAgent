import { supabase } from './supabase';
import { logAdminAction } from './audit-logger';
import { DEFAULT_ADMIN_SETTINGS, getAdminSettings } from './settings-service';
import type {
  Mission,
  Project,
  NewsArticle,
  ReferralRecord,
  XPTransaction,
  UserXPProfile,
} from './types';

// Overview Statistics Interface
export interface AdminOverviewStats {
  totalUsers: number | string;
  connectedWallets: number | string;
  totalXpAwarded: number | string;
  completedMissions: number | string;
  activeMissions: number | string;
  totalReferrals: number | string;
  ecosystemProjects: number | string;
  publishedNews: number | string;
}

/**
 * Fetch real database overview metrics
 */
export async function fetchAdminOverviewStats(): Promise<AdminOverviewStats> {
  try {
    const [
      usersRes,
      walletsRes,
      xpRes,
      completedMissionsRes,
      activeMissionsRes,
      referralsRes,
      projectsRes,
      newsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_wallets').select('*', { count: 'exact', head: true }),
      supabase.from('user_xp').select('total_xp'),
      supabase.from('user_missions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('missions').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('referrals').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('news_articles').select('*', { count: 'exact', head: true }),
    ]);

    const totalUsersCount = usersRes.count ?? 0;
    const connectedWalletsCount = walletsRes.count ?? 0;

    let totalXpSum = 0;
    if (xpRes.data && xpRes.data.length > 0) {
      totalXpSum = xpRes.data.reduce((acc, curr) => acc + (curr.total_xp || 0), 0);
    }

    return {
      totalUsers: totalUsersCount > 0 ? totalUsersCount : 'N/A',
      connectedWallets: connectedWalletsCount > 0 ? connectedWalletsCount : 'N/A',
      totalXpAwarded: totalXpSum > 0 ? totalXpSum : 'N/A',
      completedMissions: completedMissionsRes.count ?? 'N/A',
      activeMissions: activeMissionsRes.count ?? 'N/A',
      totalReferrals: referralsRes.count ?? 'N/A',
      ecosystemProjects: projectsRes.count ?? 'N/A',
      publishedNews: newsRes.count ?? 'N/A',
    };
  } catch (err) {
    console.error('Error fetching admin overview stats:', err);
    return {
      totalUsers: 'N/A',
      connectedWallets: 'N/A',
      totalXpAwarded: 'N/A',
      completedMissions: 'N/A',
      activeMissions: 'N/A',
      totalReferrals: 'N/A',
      ecosystemProjects: 'N/A',
      publishedNews: 'N/A',
    };
  }
}

// ============================================================================
// MISSION MANAGEMENT
// ============================================================================

export interface MissionInput {
  title: string;
  slug: string;
  description: string;
  type: string;
  category: string;
  xp_reward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  status?: string;
  start_at?: string | null;
  end_at?: string | null;
  requirements?: Array<{ type: string; value?: string; target?: string }> | string[];
  verification_type: string;
  max_completions?: number;
  is_featured?: boolean;
  is_active?: boolean;
  project_id?: string | null;
  project_slug?: string | null;
}

export function validateMissionInput(input: MissionInput): { isValid: boolean; error?: string } {
  if (!input.title || input.title.trim().length < 3) {
    return { isValid: false, error: 'Title must be at least 3 characters long.' };
  }
  if (!input.slug || !/^[a-z0-9-]+$/.test(input.slug)) {
    return { isValid: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens.' };
  }
  if (!input.description || input.description.trim().length < 5) {
    return { isValid: false, error: 'Description must be provided.' };
  }
  if (typeof input.xp_reward !== 'number' || input.xp_reward <= 0) {
    return { isValid: false, error: 'XP Reward must be a positive integer.' };
  }
  if (!['Easy', 'Medium', 'Hard', 'Expert'].includes(input.difficulty)) {
    return { isValid: false, error: 'Invalid difficulty level selected.' };
  }
  if (input.start_at && input.end_at && new Date(input.start_at) >= new Date(input.end_at)) {
    return { isValid: false, error: 'Start date must be before end date.' };
  }
  return { isValid: true };
}

export async function fetchAdminMissions(): Promise<Mission[]> {
  try {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) return data as Mission[];
  } catch (err) {
    console.error('Failed to fetch admin missions:', err);
  }
  return [];
}

export async function createMission(
  input: MissionInput,
  adminUserId: string
): Promise<{ success: boolean; mission?: Mission; error?: string }> {
  const validation = validateMissionInput(input);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  try {
    // Check slug uniqueness
    const { data: existing } = await supabase
      .from('missions')
      .select('id')
      .eq('slug', input.slug)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'A mission with this slug already exists.' };
    }

    const payload = {
      title: input.title.trim(),
      slug: input.slug.trim(),
      description: input.description.trim(),
      type: input.type || 'EXPLORE_PROJECT',
      category: input.category || 'Ecosystem',
      xp_reward: input.xp_reward,
      difficulty: input.difficulty,
      status: input.status || 'active',
      start_at: input.start_at || null,
      end_at: input.end_at || null,
      requirements: input.requirements || [],
      verification_type: input.verification_type || 'database',
      max_completions: input.max_completions || 1,
      is_featured: !!input.is_featured,
      is_active: input.is_active !== undefined ? input.is_active : true,
      project_id: input.project_id || null,
      project_slug: input.project_slug || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('missions')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await logAdminAction({
      adminUserId,
      action: 'MISSION_CREATED',
      targetType: 'mission',
      targetId: data.id,
      reason: `Created mission "${input.title}"`,
      metadata: payload,
    });

    return { success: true, mission: data as Mission };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create mission',
    };
  }
}

export async function updateMission(
  missionId: string,
  input: Partial<MissionInput>,
  adminUserId: string,
  reason?: string
): Promise<{ success: boolean; mission?: Mission; error?: string }> {
  try {
    const payload = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('missions')
      .update(payload)
      .eq('id', missionId)
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await logAdminAction({
      adminUserId,
      action: 'MISSION_UPDATED',
      targetType: 'mission',
      targetId: missionId,
      reason: reason || 'Updated mission details',
      metadata: payload,
    });

    return { success: true, mission: data as Mission };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update mission',
    };
  }
}

export async function deleteMission(
  missionId: string,
  adminUserId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!reason || reason.trim().length < 3) {
    return { success: false, error: 'A valid reason is required to delete a mission.' };
  }

  try {
    const { error } = await supabase.from('missions').delete().eq('id', missionId);

    if (error) return { success: false, error: error.message };

    await logAdminAction({
      adminUserId,
      action: 'MISSION_DELETED',
      targetType: 'mission',
      targetId: missionId,
      reason,
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete mission',
    };
  }
}

// ============================================================================
// REFERRAL MANAGEMENT
// ============================================================================

export interface AdminReferralsSummary {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  referralXpAwarded: number;
  topReferrers: Array<{
    referrer_user_id: string;
    username: string;
    wallet: string;
    count: number;
  }>;
  history: ReferralRecord[];
}

export async function fetchAdminReferralData(): Promise<AdminReferralsSummary> {
  try {
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !referrals) {
      return {
        totalReferrals: 0,
        successfulReferrals: 0,
        pendingReferrals: 0,
        referralXpAwarded: 0,
        topReferrers: [],
        history: [],
      };
    }

    const totalReferrals = referrals.length;
    const successfulReferrals = referrals.filter((r) => r.status === 'qualified' || r.status === 'rewarded').length;
    const pendingReferrals = referrals.filter((r) => r.status === 'pending').length;

    // Fetch referral XP awarded from xp_transactions
    const { data: xpTx } = await supabase
      .from('xp_transactions')
      .select('amount')
      .eq('source', 'referral');

    const referralXpAwarded = xpTx ? xpTx.reduce((sum, tx) => sum + (tx.amount || 0), 0) : 0;

    // Aggregate top referrers
    const countMap: Record<string, number> = {};
    for (const ref of referrals) {
      if (ref.referrer_user_id) {
        countMap[ref.referrer_user_id] = (countMap[ref.referrer_user_id] || 0) + 1;
      }
    }

    const topUserIds = Object.keys(countMap)
      .sort((a, b) => countMap[b] - countMap[a])
      .slice(0, 5);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, wallet_address')
      .in('id', topUserIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]));

    const topReferrers = topUserIds.map((id) => ({
      referrer_user_id: id,
      username: profileMap.get(id)?.username || 'User_' + id.slice(0, 6),
      wallet: profileMap.get(id)?.wallet_address || 'Unlinked',
      count: countMap[id],
    }));

    return {
      totalReferrals,
      successfulReferrals,
      pendingReferrals,
      referralXpAwarded,
      topReferrers,
      history: referrals as ReferralRecord[],
    };
  } catch (err) {
    console.error('Error fetching admin referral data:', err);
    return {
      totalReferrals: 0,
      successfulReferrals: 0,
      pendingReferrals: 0,
      referralXpAwarded: 0,
      topReferrers: [],
      history: [],
    };
  }
}

export async function updateReferralStatus(
  referralId: string,
  newStatus: 'pending' | 'qualified' | 'invalid',
  adminUserId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!reason || reason.trim().length < 3) {
    return { success: false, error: 'A valid reason is required.' };
  }

  try {
    const { error } = await supabase
      .from('referrals')
      .update({
        status: newStatus,
        completed_at: newStatus === 'qualified' ? new Date().toISOString() : null,
      })
      .eq('id', referralId);

    if (error) return { success: false, error: error.message };

    await logAdminAction({
      adminUserId,
      action: 'REFERRAL_STATUS_UPDATED',
      targetType: 'referral',
      targetId: referralId,
      reason,
      metadata: { newStatus },
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Status update failed' };
  }
}

// ============================================================================
// XP MANAGEMENT & AUDIT ADJUSTMENT
// ============================================================================

export async function fetchAdminXPTransactions(params?: {
  page?: number;
  limit?: number;
  userId?: string;
  source?: string;
}): Promise<{ transactions: XPTransaction[]; total: number }> {
  const page = params?.page || 1;
  const limit = params?.limit || 25;
  const offset = (page - 1) * limit;

  try {
    let query = supabase.from('xp_transactions').select('*', { count: 'exact' });

    if (params?.userId) query = query.eq('user_id', params.userId);
    if (params?.source) query = query.eq('source', params.source);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!error && data) {
      return { transactions: data as XPTransaction[], total: count || data.length };
    }
  } catch (err) {
    console.error('Error fetching admin XP transactions:', err);
  }
  return { transactions: [], total: 0 };
}

export async function adjustUserXP(params: {
  userId: string;
  amount: number;
  reason: string;
  adminUserId: string;
}): Promise<{ success: boolean; error?: string; newTotalXP?: number }> {
  const { userId, amount, reason, adminUserId } = params;

  if (!userId) return { success: false, error: 'User ID is required.' };
  if (!amount || amount === 0) return { success: false, error: 'Amount must be non-zero.' };
  if (!reason || reason.trim().length < 5) {
    return { success: false, error: 'A clear reason (at least 5 characters) is required for XP adjustments.' };
  }

  try {
    // Fetch user's current XP
    const { data: currentXpRecord } = await supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const currentTotal = currentXpRecord?.total_xp || 0;
    const newTotal = Math.max(0, currentTotal + amount);
    const newLevel = Math.floor(Math.sqrt(newTotal / 100)) + 1;

    // Update user_xp table
    await supabase.from('user_xp').upsert(
      {
        user_id: userId,
        total_xp: newTotal,
        current_level: newLevel,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    // Record auditable transaction in xp_transactions with source = 'admin_adjustment'
    await supabase.from('xp_transactions').insert({
      user_id: userId,
      amount,
      type: 'manual_adjustment',
      source: 'admin_adjustment',
      description: `Admin XP Adjustment: ${reason}`,
      metadata: { admin_user_id: adminUserId, reason, previous_xp: currentTotal, new_xp: newTotal },
      created_at: new Date().toISOString(),
    });

    // Record immutable admin audit log
    await logAdminAction({
      adminUserId,
      action: 'XP_MANUAL_ADJUSTMENT',
      targetType: 'user_xp',
      targetId: userId,
      reason,
      metadata: { amount, previousXp: currentTotal, newTotalXp: newTotal },
    });

    return { success: true, newTotalXP: newTotal };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to adjust XP',
    };
  }
}

// ============================================================================
// USER MANAGEMENT & DETAILS
// ============================================================================

export interface AdminUserListItem {
  id: string;
  username: string;
  email: string | null;
  wallet_address: string | null;
  total_xp: number;
  level: number;
  completed_missions: number;
  referral_count: number;
  created_at: string;
  status: 'active' | 'suspended';
}

export async function fetchAdminUsers(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ users: AdminUserListItem[]; total: number }> {
  const page = params?.page || 1;
  const limit = params?.limit || 15;
  const offset = (page - 1) * limit;

  try {
    let query = supabase.from('profiles').select('*', { count: 'exact' });

    if (params?.search) {
      const term = params.search.trim();
      query = query.or(`username.ilike.%${term}%,wallet_address.ilike.%${term}%,id.ilike.%${term}%`);
    }

    const { data: profiles, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !profiles) {
      return { users: [], total: 0 };
    }

    const userIds = profiles.map((p) => p.id);

    // Fetch user_xp records for these profiles
    const [xpRes, missionsRes, referralsRes] = await Promise.all([
      supabase.from('user_xp').select('user_id, total_xp, current_level').in('user_id', userIds),
      supabase.from('user_missions').select('user_id').in('user_id', userIds).eq('status', 'completed'),
      supabase.from('referrals').select('referrer_user_id').in('referrer_user_id', userIds),
    ]);

    const xpMap = new Map(xpRes.data?.map((x) => [x.user_id, x]));

    const missionCountMap = new Map<string, number>();
    missionsRes.data?.forEach((m) => {
      missionCountMap.set(m.user_id, (missionCountMap.get(m.user_id) || 0) + 1);
    });

    const referralCountMap = new Map<string, number>();
    referralsRes.data?.forEach((r) => {
      referralCountMap.set(r.referrer_user_id, (referralCountMap.get(r.referrer_user_id) || 0) + 1);
    });

    const users: AdminUserListItem[] = profiles.map((p) => {
      const xp = xpMap.get(p.id);
      return {
        id: p.id,
        username: p.username || 'User_' + p.id.slice(0, 6),
        email: p.email || null,
        wallet_address: p.wallet_address || null,
        total_xp: xp?.total_xp || 0,
        level: xp?.current_level || 1,
        completed_missions: missionCountMap.get(p.id) || 0,
        referral_count: referralCountMap.get(p.id) || 0,
        created_at: p.created_at || new Date().toISOString(),
        status: p.status || 'active',
      };
    });

    return { users, total: count || users.length };
  } catch (err) {
    console.error('Error fetching admin users:', err);
    return { users: [], total: 0 };
  }
}

export async function fetchAdminUserDetails(userId: string) {
  try {
    const [profileRes, xpRes, xpHistoryRes, missionsRes, referralsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_xp').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('xp_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      supabase.from('user_missions').select('*, missions(*)').eq('user_id', userId),
      supabase.from('referrals').select('*').eq('referrer_user_id', userId),
    ]);

    return {
      profile: profileRes.data || { id: userId, username: 'User_' + userId.slice(0, 6) },
      xp: xpRes.data || { total_xp: 0, current_level: 1, streak_count: 0 },
      xpHistory: xpHistoryRes.data || [],
      missionHistory: missionsRes.data || [],
      referralHistory: referralsRes.data || [],
    };
  } catch (err) {
    console.error('Error fetching user details:', err);
    return null;
  }
}

// ============================================================================
// ECOSYSTEM MANAGEMENT
// ============================================================================

export async function fetchAdminProjects(): Promise<Project[]> {
  try {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (!error && data) return data as Project[];
  } catch (err) {
    console.error('Error fetching admin projects:', err);
  }
  return [];
}

export async function saveAdminProject(
  projectData: Partial<Project>,
  adminUserId: string,
  isEdit = false
): Promise<{ success: boolean; project?: Project; error?: string }> {
  if (!projectData.name || !projectData.slug || !projectData.description) {
    return { success: false, error: 'Project name, slug, and description are required.' };
  }

  try {
    const payload = {
      ...projectData,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (isEdit && projectData.id) {
      result = await supabase.from('projects').update(payload).eq('id', projectData.id).select('*').single();
    } else {
      payload.created_at = new Date().toISOString();
      result = await supabase.from('projects').insert(payload).select('*').single();
    }

    if (result.error) return { success: false, error: result.error.message };

    await logAdminAction({
      adminUserId,
      action: isEdit ? 'PROJECT_UPDATED' : 'PROJECT_CREATED',
      targetType: 'project',
      targetId: result.data.id,
      reason: isEdit ? `Updated project "${projectData.name}"` : `Created project "${projectData.name}"`,
      metadata: payload as Record<string, unknown>,
    });

    return { success: true, project: result.data as Project };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Save project failed' };
  }
}

export async function deleteAdminProject(
  projectId: string,
  adminUserId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!reason || reason.trim().length < 3) {
    return { success: false, error: 'A valid reason is required to delete a project.' };
  }

  try {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) return { success: false, error: error.message };

    await logAdminAction({
      adminUserId,
      action: 'PROJECT_DELETED',
      targetType: 'project',
      targetId: projectId,
      reason,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Delete project failed' };
  }
}

// ============================================================================
// NEWS MANAGEMENT
// ============================================================================

export async function fetchAdminNews(): Promise<NewsArticle[]> {
  try {
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false });

    if (!error && data) return data as NewsArticle[];
  } catch (err) {
    console.error('Error fetching admin news:', err);
  }
  return [];
}

export async function updateAdminNewsArticle(
  articleId: string,
  updates: Partial<NewsArticle>,
  adminUserId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('news_articles').update(updates).eq('id', articleId);
    if (error) return { success: false, error: error.message };

    await logAdminAction({
      adminUserId,
      action: 'NEWS_UPDATED',
      targetType: 'news',
      targetId: articleId,
      reason: reason || 'Updated news article',
      metadata: updates as Record<string, unknown>,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'News update failed' };
  }
}

export async function deleteAdminNewsArticle(
  articleId: string,
  adminUserId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!reason || reason.trim().length < 3) {
    return { success: false, error: 'A valid reason is required.' };
  }

  try {
    const { error } = await supabase.from('news_articles').delete().eq('id', articleId);
    if (error) return { success: false, error: error.message };

    await logAdminAction({
      adminUserId,
      action: 'NEWS_DELETED',
      targetType: 'news',
      targetId: articleId,
      reason,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Delete news failed' };
  }
}
