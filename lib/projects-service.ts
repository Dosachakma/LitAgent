'use client';

import { supabase } from './supabase';
import type { Project, VerificationStatus } from './types';

export const PROJECT_CATEGORIES = [
  'All',
  'DeFi',
  'DEX',
  'Bridge',
  'Wallet',
  'NFT',
  'AI',
  'Infrastructure',
  'Developer Tools',
  'Oracle',
  'Gaming',
  'Analytics',
  'Other',
] as const;

export const PROJECT_STATUSES = ['All', 'Live', 'Testnet', 'Coming Soon'] as const;

export const VERIFICATION_STATUSES = [
  'All',
  'Official',
  'Verified',
  'Community',
  'Unverified',
] as const;

export interface FetchProjectsParams {
  category?: string;
  status?: string;
  verification?: string;
  search?: string;
  featuredOnly?: boolean;
  limit?: number;
}

export async function fetchProjects(params?: FetchProjectsParams): Promise<Project[]> {
  try {
    let query = supabase.from('projects').select('*').order('created_at', { ascending: false });

    if (params?.category && params.category !== 'All') {
      query = query.eq('category', params.category);
    }

    if (params?.status && params.status !== 'All') {
      query = query.eq('status', params.status);
    }

    if (params?.verification && params.verification !== 'All') {
      if (params.verification === 'Official') {
        query = query.or('is_official.eq.true,verification_status.eq.Official');
      } else if (params.verification === 'Verified') {
        query = query.or('is_verified.eq.true,verification_status.eq.Verified');
      } else {
        query = query.eq('verification_status', params.verification);
      }
    }

    if (params?.featuredOnly) {
      query = query.or('is_featured.eq.true,featured.eq.true');
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    let results = data as Project[];

    // Client-side search filtering if search term provided
    if (params?.search && params.search.trim() !== '') {
      const term = params.search.toLowerCase().trim();
      results = results.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(term);
        const descMatch = p.description.toLowerCase().includes(term);
        const catMatch = p.category.toLowerCase().includes(term);
        const tagsMatch = p.tags?.some((t) => t.toLowerCase().includes(term)) ?? false;
        return nameMatch || descMatch || catMatch || tagsMatch;
      });
    }

    return results;
  } catch {
    return [];
  }
}

export async function getProjectByIdOrSlug(idOrSlug: string): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .single();

    if (error || !data) return null;
    return data as Project;
  } catch {
    return null;
  }
}

/* ====================================================================
 * ADMIN READY ARCHITECTURE
 * These functions allow an Admin Panel to manage ecosystem projects.
 * ==================================================================== */

export async function adminCreateProject(projectData: Omit<Partial<Project>, 'id' | 'created_at'>): Promise<{ success: boolean; data?: Project; error?: string }> {
  try {
    const slug = projectData.slug || projectData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'project';
    const payload = {
      ...projectData,
      slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as Project };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create project';
    return { success: false, error: message };
  }
}

export async function adminUpdateProject(id: string, updates: Partial<Project>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update project';
    return { success: false, error: message };
  }
}

export async function adminDeleteProject(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete project';
    return { success: false, error: message };
  }
}

export async function adminSetFeatured(id: string, isFeatured: boolean): Promise<{ success: boolean; error?: string }> {
  return adminUpdateProject(id, { is_featured: isFeatured, featured: isFeatured });
}

export async function adminSetVerificationStatus(id: string, status: VerificationStatus): Promise<{ success: boolean; error?: string }> {
  const isOfficial = status === 'Official';
  const isVerified = status === 'Official' || status === 'Verified';
  return adminUpdateProject(id, {
    verification_status: status,
    is_official: isOfficial,
    is_verified: isVerified,
  });
}
