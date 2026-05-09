export function requireEnv(name: string): string {
  const runtime = globalThis as unknown as {
    Deno?: {
      env?: {
        get: (key: string) => string | undefined;
      };
    };
  };
  const value = runtime.Deno?.env?.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseAdminEnv() {
  return {
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function getSupabaseEnv() {
  return {
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseAnonKey: requireEnv("SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

// Some Edge Functions only need the service-role client. Keep that path free of
// anon-key requirements so anonymous form submissions do not fail at startup.
