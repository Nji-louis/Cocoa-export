import type { User } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { createServiceClient, createUserClient } from "./supabase.ts";

const ADMIN_AREA_ROLES = ["staff", "editor", "admin", "super_admin"] as const;
const MANAGER_ROLES = ["admin", "super_admin"] as const;
const STAFF_WORKFLOW_ROLES = ["staff", "admin", "super_admin"] as const;

export async function getOptionalUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.get("Authorization");
  if (authHeader == null) {
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
  if (user == null) {
    throw new Error("Unauthorized");
  }
  return user;
}

async function userHasRole(userId: string, allowedRoles: readonly string[]): Promise<boolean> {
  const admin = createServiceClient();
  const { data: assignmentRows, error: assignmentError } = await admin
    .from("user_role_assignments")
    .select("role")
    .eq("user_id", userId)
    .in("role", [...allowedRoles]);

  if (assignmentError) {
    throw new Error("Forbidden");
  }

  if (Array.isArray(assignmentRows) && assignmentRows.length > 0) {
    return true;
  }

  const { data: profileRow, error: profileError } = await admin
    .from("user_profiles")
    .select("default_role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error("Forbidden");
  }

  return Boolean(profileRow && profileRow.default_role && allowedRoles.includes(profileRow.default_role));
}

export async function requireAdminAreaUser(userId: string): Promise<void> {
  if ((await userHasRole(userId, ADMIN_AREA_ROLES)) === false) {
    throw new Error("Forbidden");
  }
}

export async function requireStaffOrAdmin(userId: string): Promise<void> {
  if ((await userHasRole(userId, STAFF_WORKFLOW_ROLES)) === false) {
    throw new Error("Forbidden");
  }
}

export async function requireManagerUser(userId: string): Promise<void> {
  if ((await userHasRole(userId, MANAGER_ROLES)) === false) {
    throw new Error("Forbidden");
  }
}
