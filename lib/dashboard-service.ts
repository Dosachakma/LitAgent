'use client';

import { supabase } from './supabase';
import type { NewsArticle, Project, Mission, UserActivity, Notification } from './types';

export async function getLatestNews(limit = 3): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as NewsArticle[];
}

export async function getFeaturedProjects(limit = 3): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as Project[];
}

export async function getActiveMissions(limit = 3): Promise<Mission[]> {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as Mission[];
}

export async function getUserActivity(userId: string, limit = 5): Promise<UserActivity[]> {
  const { data, error } = await supabase
    .from('user_activity')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as UserActivity[];
}

export async function getUserNotifications(userId: string, limit = 10): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('user_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as Notification[];
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_notifications')
    .update({ read: true })
    .eq('id', id);
  return !error;
}

export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  return !error;
}

export async function recordUserActivity(
  userId: string,
  type: UserActivity['type'],
  title: string,
  description: string | null = null,
  metadata: Record<string, unknown> | null = null
): Promise<void> {
  await supabase.from('user_activity').insert({
    user_id: userId,
    type,
    title,
    description,
    metadata,
  });
}
