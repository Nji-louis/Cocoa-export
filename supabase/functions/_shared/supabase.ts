import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { getSupabaseAdminEnv, getSupabaseEnv } from "./env.ts";

export function createServiceClient(): SupabaseClient {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseAdminEnv();
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createUserClient(authHeader: string): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
