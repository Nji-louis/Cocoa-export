/**
 * Supabase Edge Function (Deno) - Invite user and set role (admin only)
 *
 * Keeps the legacy `profiles` table in sync for browser auth flows while
 * writing the newer `user_profiles` and `user_role_assignments` records that
 * the admin system uses for authorization.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { getSupabaseAdminEnv } from "../_shared/env.ts";
import { getPrimaryRole } from "../_shared/roles.ts";

const ALLOWED_ROLES = ["buyer", "staff", "editor", "admin", "super_admin"] as const;

function normalizeRole(value: unknown): string {
  const role = String(value || "buyer").trim().toLowerCase();
  if ((ALLOWED_ROLES as readonly string[]).includes(role) === false) {
    throw new Error("Invalid role");
  }
  return role;
}

serve(async (req) => {
  try {
    const { supabaseUrl: SUPABASE_URL, supabaseServiceRoleKey: SERVICE_KEY } = getSupabaseAdminEnv();
    const supabaseAdmin: any = createClient(SUPABASE_URL, SERVICE_KEY);

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return new Response("Missing token", { status: 401 });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    const caller = userData?.user ?? null;
    if (userErr || !caller) return new Response("Invalid token", { status: 401 });

    const callerRole = await getPrimaryRole(supabaseAdmin, caller.id);
    if (callerRole !== "admin" && callerRole !== "super_admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const role = normalizeRole(body.role);
    const fullName = String(body.fullName || body.name || "").trim() || null;
    const redirectTo = typeof body.redirectTo === "string" && body.redirectTo.trim() ? body.redirectTo.trim() : undefined;

    if (!email) return new Response("Missing email", { status: 400 });
    if (role === "super_admin" && callerRole !== "super_admin") {
      return new Response("Only a super admin can invite another super admin", { status: 403 });
    }

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        full_name: fullName,
        role,
      },
    });
    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const invitedUserId = inviteData?.user?.id;
    if (!invitedUserId) {
      return new Response(JSON.stringify({ error: "Invite completed without a user id" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    await supabaseAdmin.from("profiles").upsert({
      id: invitedUserId,
      email,
      role,
      company_name: fullName,
    }, { onConflict: "id" });

    await supabaseAdmin.from("user_profiles").upsert({
      id: invitedUserId,
      full_name: fullName,
      default_role: role,
    }, { onConflict: "id" });

    if (role === "buyer") {
      await supabaseAdmin.from("user_role_assignments").delete().eq("user_id", invitedUserId);
      await supabaseAdmin.from("admin_accounts").delete().eq("user_id", invitedUserId);
    } else {
      await supabaseAdmin.from("user_role_assignments").delete().eq("user_id", invitedUserId).in("role", [...ALLOWED_ROLES]);
      await supabaseAdmin.from("user_role_assignments").upsert({
        user_id: invitedUserId,
        role,
        assigned_by: caller.id,
      }, { onConflict: "user_id,role" });

      await supabaseAdmin.from("admin_accounts").upsert({
        user_id: invitedUserId,
        status: "invited",
        title: null,
        invited_by: caller.id,
      }, { onConflict: "user_id" });
    }

    return new Response(JSON.stringify({
      success: true,
      result: {
        userId: invitedUserId,
        email,
        role,
      },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(message, { status: 500 });
  }
});
