import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Defaults - replace or provide via `initSupabase()` or window/global meta tags
export let SUPABASE_URL = 'https://zsyawtkrkjvulrjhgbyn.supabase.co';
export let SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzeWF3dGtya2p2dWxyamhnYnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNjQ3NzEsImV4cCI6MjA5MzY0MDc3MX0.Mns1-UZMIaZwR99KrvZXwKpo7TmjijPWFQYL3DaAcSs';

// Exported client may be re-initialized by calling `initSupabase` at runtime.
export let supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function detectFromMeta() {
  try {
    const mUrl = document.querySelector('meta[name="supabase-url"]')
    const mKey = document.querySelector('meta[name="supabase-anon-key"]')
    if (mUrl?.content) SUPABASE_URL = mUrl.content
    if (mKey?.content) SUPABASE_ANON_KEY = mKey.content
  } catch (e) {
    // ignore (e.g., non-browser environment)
  }
}

function detectFromWindow() {
  try {
    if (window?.__SUPABASE_CONFIG__) {
      const c = window.__SUPABASE_CONFIG__
      if (c.url) SUPABASE_URL = c.url
      if (c.anonKey) SUPABASE_ANON_KEY = c.anonKey
    }
    if (window?.SUPABASE_URL) SUPABASE_URL = window.SUPABASE_URL
    if (window?.SUPABASE_ANON_KEY) SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY
  } catch (e) {}
}

/**
 * Initialize or re-initialize the exported Supabase client.
 * Call this in your pages before using `supabase` if you want to set keys at runtime.
 * Example: `initSupabase({ url: 'https://x', anonKey: 'ey...' })`
 */
export function initSupabase({ url, anonKey } = {}) {
  if (url) SUPABASE_URL = url
  if (anonKey) SUPABASE_ANON_KEY = anonKey
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return supabase
}

// Auto-detect common injection points and re-init the client if found.
detectFromMeta()
detectFromWindow()
supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function getProfile(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) return null
  return data
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}
