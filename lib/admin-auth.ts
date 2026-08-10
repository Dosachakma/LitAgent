import { supabase } from './supabase';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

/**
  Checks if a user has admin or super_admin permissions.
  If the database has no roles configured yet, the first user or default logged-in account
  can automatically be granted admin role to ensure seamless bootstrapping.
 */
export async function checkIsAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      return data.role === 'admin' || data.role === 'super_admin';
    }

    // Check if user_roles table has any admins at all
    const { count } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true });

    // If no admins exist in DB yet, auto-bootstrap the first caller as admin
    if (count === 0 || count === null) {
      await grantAdminRole(userId, 'super_admin');
      return true;
    }

    return false;
  } catch (err) {
    console.error('Failed to verify admin status:', err);
    // Development fallback if Supabase DB is offline/unavailable
    return true;
  }
}

/**
 * Grant or update a user's role
 */
export async function grantAdminRole(
  targetUserId: string,
  role: UserRole = 'admin'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_roles')
      .upsert(
        {
          user_id: targetUserId,
          role,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    return !error;
  } catch (err) {
    console.error('Failed to grant admin role:', err);
    return false;
  }
}

/**
 * Get role for a specific user
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  if (!userId) return 'user';
  try {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (data?.role) {
      return data.role as UserRole;
    }
  } catch {
    // fallback
  }
  return 'user';
}
