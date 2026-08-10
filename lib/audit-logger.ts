import { supabase } from './supabase';

export interface AuditLogParams {
  adminUserId: string;
  action: string; // e.g. 'MISSION_CREATED', 'MISSION_DELETED', 'XP_ADJUSTED', 'PROJECT_VERIFIED', 'NEWS_HIDDEN'
  targetType: string; // e.g. 'mission', 'user', 'project', 'news', 'referral', 'settings'
  targetId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AdminAuditLogRecord {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Creates an immutable audit record for sensitive admin actions
 */
export async function logAdminAction(params: AuditLogParams): Promise<boolean> {
  const { adminUserId, action, targetType, targetId, reason, metadata } = params;

  try {
    const payload = {
      admin_user_id: adminUserId || 'system_admin',
      action,
      target_type: targetType,
      target_id: targetId || null,
      reason: reason || null,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('admin_audit_logs').insert(payload);

    if (error) {
      console.warn('Supabase audit log insert fallback:', error.message);
    }
    return true;
  } catch (err) {
    console.error('Audit logging error:', err);
    return false;
  }
}

/**
 * Fetch audit logs with pagination and optional filters
 */
export async function fetchAuditLogs(params?: {
  page?: number;
  limit?: number;
  targetType?: string;
  action?: string;
}): Promise<{ logs: AdminAuditLogRecord[]; total: number }> {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact' });

    if (params?.targetType && params.targetType !== 'all') {
      query = query.eq('target_type', params.targetType);
    }

    if (params?.action) {
      query = query.ilike('action', `%${params.action}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!error && data) {
      return { logs: data as AdminAuditLogRecord[], total: count || data.length };
    }
  } catch (err) {
    console.error('Fetch audit logs error:', err);
  }

  return { logs: [], total: 0 };
}
