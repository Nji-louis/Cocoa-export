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

export function getEnv(name: string): string | undefined {
  const runtime = globalThis as unknown as {
    Deno?: {
      env?: {
        get: (key: string) => string | undefined;
      };
    };
  };
  return runtime.Deno?.env?.get(name);
}

export function getSupabaseAdminEnv() {
  const serviceRoleKey = getEnv("SERVICE_ROLE_KEY") ?? getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) {
    throw new Error("Missing required environment variable: SERVICE_ROLE_KEY");
  }
  return {
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: serviceRoleKey,
  };
}

export function getSupabaseEnv() {
  const serviceRoleKey = getEnv("SERVICE_ROLE_KEY") ?? getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) {
    throw new Error("Missing required environment variable: SERVICE_ROLE_KEY");
  }
  return {
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseAnonKey: requireEnv("SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: serviceRoleKey,
  };
}

// Some Edge Functions only need the service-role client. Keep that path free of
// anon-key requirements so anonymous form submissions do not fail at startup.
