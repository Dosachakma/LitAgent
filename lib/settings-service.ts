import { supabase } from './supabase';
import { logAdminAction } from './audit-logger';

export interface AdminSettingsMap {
  daily_checkin_xp: number;
  referral_xp: number;
  mission_xp_default: number;
  max_referral_rewards: number;
  leaderboard_display_count: number;
  news_sync_interval_mins: number;
  feature_toggles: {
    enable_referrals: boolean;
    enable_checkin: boolean;
    enable_missions: boolean;
    maintenance_mode: boolean;
  };
}

export const DEFAULT_ADMIN_SETTINGS: AdminSettingsMap = {
  daily_checkin_xp: 50,
  referral_xp: 200,
  mission_xp_default: 100,
  max_referral_rewards: 50,
  leaderboard_display_count: 100,
  news_sync_interval_mins: 30,
  feature_toggles: {
    enable_referrals: true,
    enable_checkin: true,
    enable_missions: true,
    maintenance_mode: false,
  },
};

/**
 * Get all current admin settings merged with defaults
 */
export async function getAdminSettings(): Promise<AdminSettingsMap> {
  try {
    const { data, error } = await supabase.from('admin_settings').select('key, value');

    if (!error && data && data.length > 0) {
      const settings = { ...DEFAULT_ADMIN_SETTINGS };
      for (const row of data) {
        if (row.key in settings) {
          (settings as Record<string, unknown>)[row.key] = row.value;
        }
      }
      return settings;
    }
  } catch (err) {
    console.error('Failed to load admin settings:', err);
  }

  return DEFAULT_ADMIN_SETTINGS;
}

/**
 * Update a specific setting key with audit record
 */
export async function updateAdminSetting(
  key: keyof AdminSettingsMap,
  value: unknown,
  adminUserId: string,
  reason?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('admin_settings')
      .upsert(
        {
          key,
          value,
          updated_by: adminUserId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('Setting update error:', error);
      return false;
    }

    await logAdminAction({
      adminUserId,
      action: 'SETTING_UPDATED',
      targetType: 'settings',
      targetId: key,
      reason: reason || `Updated setting ${key}`,
      metadata: { key, newValue: value },
    });

    return true;
  } catch (err) {
    console.error('Setting update exception:', err);
    return false;
  }
}
