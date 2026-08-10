import { supabase } from '../supabase';
import type { DeploymentRecord } from './deployment-types';

const STORAGE_KEY = 'litagent_deployments_history';

export async function saveDeploymentRecord(record: DeploymentRecord): Promise<void> {
  // 1. Always save to LocalStorage for instant client fallback
  if (typeof window !== 'undefined') {
    try {
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      const existing: DeploymentRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [record, ...existing.filter((item) => item.id !== record.id)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 100)));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  // 2. Attempt Supabase persistence
  try {
    const { error } = await supabase.from('deployments').insert([
      {
        id: record.id,
        wallet_address: record.wallet_address.toLowerCase(),
        chain_id: record.chain_id,
        network: record.network,
        contract_type: record.contract_type,
        contract_name: record.contract_name,
        contract_symbol: record.contract_symbol,
        contract_address: record.contract_address,
        transaction_hash: record.transaction_hash,
        status: record.status,
        error: record.error || null,
        metadata: record.metadata || {},
      },
    ]);

    if (error) {
      console.warn('Supabase deployment insert notice (using local cache):', error.message);
    }
  } catch (err) {
    console.warn('Supabase connection note:', err);
  }
}

export async function getDeploymentHistory(walletAddress?: string | null): Promise<DeploymentRecord[]> {
  const localRecords: DeploymentRecord[] = [];

  // 1. Load local records first
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: DeploymentRecord[] = JSON.parse(raw);
        if (walletAddress) {
          localRecords.push(
            ...parsed.filter((r) => r.wallet_address.toLowerCase() === walletAddress.toLowerCase())
          );
        } else {
          localRecords.push(...parsed);
        }
      }
    } catch (e) {
      console.warn('LocalStorage parse error:', e);
    }
  }

  // 2. Query Supabase
  try {
    let query = supabase.from('deployments').select('*').order('created_at', { ascending: false }).limit(50);

    if (walletAddress) {
      query = query.eq('wallet_address', walletAddress.toLowerCase());
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      // Merge unique by transaction_hash or id
      const combined = [...data, ...localRecords];
      const uniqueMap = new Map<string, DeploymentRecord>();
      combined.forEach((item) => {
        const key = item.transaction_hash || item.id;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item);
        }
      });
      return Array.from(uniqueMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  } catch (err) {
    console.warn('Supabase query note:', err);
  }

  return localRecords;
}
