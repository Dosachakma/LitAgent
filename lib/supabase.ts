import { createClient } from '@supabase/supabase-js';

let envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
let envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

// Clean up if key/url contains key=value strings
if (envUrl.includes('=')) {
  const parts = envUrl.split('=');
  envUrl = parts[parts.length - 1].trim();
}
if (envKey.includes('=')) {
  const parts = envKey.split('=');
  envKey = parts[parts.length - 1].trim();
}

// Auto-detect if URL and Key were swapped in environment
if (!envUrl.startsWith('http') && envKey.startsWith('http')) {
  const temp = envUrl;
  envUrl = envKey;
  envKey = temp;
}

const supabaseUrl = envUrl.startsWith('http') ? envUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = envKey || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

