import { handleCors } from "../_shared/cors.ts";
import { fail, json } from "../_shared/http.ts";
import { requireManagerUser, requireUser } from "../_shared/auth.ts";
import { assertAllowedOrigin, readJsonObject } from "../_shared/security.ts";
import { asOptionalString, asString } from "../_shared/validation.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { serveHttp } from "../_shared/runtime.ts";

type Action =
  | "list"
  | "invite"
  | "update_role"
  | "suspend"
  | "activate"
  | "delete"
  | "reset_password";

const ALLOWED_ROLES = ["super_admin", "admin", "editor", "staff"];

function sanitizeRole(value: unknown): string {
  const role = asString(value, "role", 32).toLowerCase();
  if (ALLOWED_ROLES.includes(role) === false) {
    throw new Error("Invalid role");
  }
  return role;
}

async function getPrimaryRole(admin: ReturnType<typeof createServiceClient>, userId: string): Promise<string> {
  const { data, error } = await admin.rpc("get_primary_role", {
    target_user_id: userId,
  });
  if (error) {
    throw new Error(error.message || "Could not resolve primary role");
  }
  return String(data || "buyer").toLowerCase();
}

serveHttp(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return fail("Method not allowed", 405);
  }

  try {
    assertAllowedOrigin(req);
    const user = await requireUser(req);
    await requireManagerUser(user.id);

    const body = await readJsonObject(req);
    const action = asString(body.action, "action", 32).toLowerCase() as Action;
    const admin = createServiceClient();
    const currentRole = await getPrimaryRole(admin, user.id);

    if (action === "list") {
      const { data: assignments, error } = await admin
        .from("user_role_assignments")
        .select("user_id, role, created_at, user_profiles(full_name, company_name, phone_whatsapp, country_region), admin_accounts(status, title, last_login_at, suspended_at)")
        .in("role", ALLOWED_ROLES)
        .order("created_at", { ascending: false });

      if (error) {
        return fail("Failed to load admin users", 500, error.message);
      }

      const items = (assignments || []).map((row: Record<string, unknown>) => ({
        userId: row.user_id,
        role: row.role,
        profile: row.user_profiles,
        account: row.admin_accounts,
      }));

      return json({ items });
    }

    if (action === "invite") {
      const email = asString(body.email, "email", 160).toLowerCase();
      const role = sanitizeRole(body.role);
      const fullName = asOptionalString(body.fullName, 160) ?? null;
      const title = asOptionalString(body.title, 160) ?? null;

      if (currentRole !== "super_admin" && role === "super_admin") {
        return fail("Only a super admin can invite another super admin", 403);
      }

      const inviteRedirectTo = asOptionalString(body.redirectTo, 500) ?? undefined;
      const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: inviteRedirectTo,
        data: {
          full_name: fullName,
          role,
        },
      });

      if (inviteError) {
        return fail("Failed to invite user", 500, inviteError.message);
      }

      const invitedUserId = inviteData.user?.id || null;
      if (invitedUserId == null) {
        return fail("Invite completed without a user id", 500);
      }

      await admin.from("user_profiles").upsert({
        id: invitedUserId,
        full_name: fullName,
        default_role: role,
      });

      await admin.from("user_role_assignments").upsert({
        user_id: invitedUserId,
        role,
        assigned_by: user.id,
      }, { onConflict: "user_id,role" });

      await admin.from("admin_accounts").upsert({
        user_id: invitedUserId,
        status: "invited",
        title,
        invited_by: user.id,
      });

      await admin.from("admin_activity_log").insert({
        actor_user_id: user.id,
        action: "invite_user",
        entity_type: "auth_user",
        entity_id: invitedUserId,
        details: { email, role },
      });

      return json({ userId: invitedUserId, email, role, invited: true });
    }

    const targetUserId = asString(body.userId, "userId", 80);
    const targetRole = await getPrimaryRole(admin, targetUserId);

    if (currentRole !== "super_admin" && targetRole === "super_admin") {
      return fail("Super admin accounts can only be managed by another super admin", 403);
    }

    if (action === "update_role") {
      const role = sanitizeRole(body.role);
      if (currentRole !== "super_admin" && role === "super_admin") {
        return fail("Only a super admin can assign the super admin role", 403);
      }

      const { error: clearError } = await admin
        .from("user_role_assignments")
        .delete()
        .eq("user_id", targetUserId)
        .in("role", ALLOWED_ROLES);
      if (clearError) {
        return fail("Failed to clear existing roles", 500, clearError.message);
      }

      const { error: insertError } = await admin
        .from("user_role_assignments")
        .insert({
          user_id: targetUserId,
          role,
          assigned_by: user.id,
        });
      if (insertError) {
        return fail("Failed to assign role", 500, insertError.message);
      }

      await admin.from("user_profiles").update({ default_role: role }).eq("id", targetUserId);
      await admin.from("admin_accounts").upsert({ user_id: targetUserId, status: "active" });
      await admin.from("admin_activity_log").insert({
        actor_user_id: user.id,
        action: "update_role",
        entity_type: "auth_user",
        entity_id: targetUserId,
        details: { role },
      });

      return json({ userId: targetUserId, role, updated: true });
    }

    if (action === "suspend" || action === "activate") {
      const status = action === "suspend" ? "suspended" : "active";
      const banDuration = action === "suspend" ? "87600h" : "none";
      const { error: authError } = await admin.auth.admin.updateUserById(targetUserId, {
        ban_duration: banDuration,
      });
      if (authError) {
        return fail("Failed to update auth account status", 500, authError.message);
      }

      const { error: accountError } = await admin.from("admin_accounts").upsert({
        user_id: targetUserId,
        status,
        suspended_at: action === "suspend" ? new Date().toISOString() : null,
      });
      if (accountError) {
        return fail("Failed to update admin account status", 500, accountError.message);
      }

      await admin.from("admin_activity_log").insert({
        actor_user_id: user.id,
        action,
        entity_type: "auth_user",
        entity_id: targetUserId,
        details: { status },
      });

      return json({ userId: targetUserId, status });
    }

    if (action === "reset_password") {
      const email = asString(body.email, "email", 160).toLowerCase();
      const redirectTo = asOptionalString(body.redirectTo, 500) ?? undefined;
      const { data: targetProfile } = await admin
        .from("profiles")
        .select("id, role")
        .eq("email", email)
        .maybeSingle();
      const targetUserId = targetProfile?.id ? String(targetProfile.id) : null;
      const targetRole = targetProfile?.role ? String(targetProfile.role).toLowerCase() : null;
      if (targetRole === "super_admin" && currentRole !== "super_admin") {
        return fail("Super admin accounts can only be managed by another super admin", 403);
      }
      const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo,
        },
      });
      if (error) {
        return fail("Failed to generate password reset link", 500, error.message);
      }

      await admin.from("admin_activity_log").insert({
        actor_user_id: user.id,
        action: "reset_password",
        entity_type: "auth_user",
        entity_id: targetUserId ?? email,
        details: { email },
      });

      return json({ userId: targetUserId, action: "reset_password", properties: data.properties || null });
    }

    if (action === "delete") {
      const { error } = await admin.auth.admin.deleteUser(targetUserId);
      if (error) {
        return fail("Failed to delete user", 500, error.message);
      }

      await admin.from("admin_activity_log").insert({
        actor_user_id: user.id,
        action: "delete_user",
        entity_type: "auth_user",
        entity_id: targetUserId,
        details: {},
      });

      return json({ userId: targetUserId, deleted: true });
    }

    return fail("Unsupported action", 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" || message === "Origin is not allowed" ? 403 : 400;
    return fail(message, status);
  }
});
