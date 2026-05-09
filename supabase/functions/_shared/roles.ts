import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

export async function getPrimaryRole(admin: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await admin.rpc("get_primary_role", {
    target_user_id: userId,
  });
  if (error) {
    throw new Error(error.message || "Could not resolve primary role");
  }
  return String(data || "buyer").toLowerCase();
}

