import type { User } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { createServiceClient, createUserClient } from "./supabase.ts";

export async function getOptionalUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }

  const userClient = createUserClient(authHeader);
  const { data, error } = await userClient.auth.getUser();
  if (error) {
    return null;
  }
  return data.user;
}

export async function requireUser(req: Request): Promise<User> {
  const user = await getOptionalUser(req);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireStaffOrAdmin(userId: string): Promise<void> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("user_role_assignments")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["staff", "admin"])
    .limit(1);

  if (error || !data || data.length === 0) {
    throw new Error("Forbidden");
  }
}
