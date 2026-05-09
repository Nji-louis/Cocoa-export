// Lightweight Supabase client initializer for browser and Node environments
import { createClient } from '@supabase/supabase-js';

function resolveUrl() {
  if (typeof window !== 'undefined') return window.SUPABASE_URL || window.__SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function resolveKey() {
  if (typeof window !== 'undefined') return window.SUPABASE_ANON_KEY || window.__SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

const SUPABASE_URL = resolveUrl();
const SUPABASE_KEY = resolveKey();

export const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

export default supabase;
