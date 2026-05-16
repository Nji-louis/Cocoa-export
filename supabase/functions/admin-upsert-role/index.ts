/**
 * Supabase Edge Function (Deno) - Upsert a user's role (admin only)
 *
 * Keeps both the legacy `profiles` table and the newer
 * `user_profiles`/`user_role_assignments` model in sync.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { getSupabaseAdminEnv } from "../_shared/env.ts";
import { getPrimaryRole } from "../_shared/roles.ts";

const ALLOWED_ROLES = ["buyer", "staff", "editor", "admin", "super_admin"] as const;

function normalizeRole(value: unknown): string {
  const role = String(value || "").trim().toLowerCase();
  if ((ALLOWED_ROLES as readonly string[]).includes(role) === false) {
    throw new Error("Invalid role");
  }
  return role;
}

async function findTargetUserId(admin: any, body: Record<string, unknown>): Promise<string | null> {
  if (typeof body.user_id === "string" && body.user_id.trim()) {
    return body.user_id.trim();
  }

  if (typeof body.email === "string" && body.email.trim()) {
    const email = body.email.trim().toLowerCase();
    const { data: profile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    if (profile?.id) {
      return String(profile.id);
    }

    const { data: usersData } = await admin.auth.admin.listUsers();
    const users = usersData?.users || [];
    const match = users.find((entry: { email?: string | null }) => String(entry.email || "").toLowerCase() === email);
    return match?.id ? String(match.id) : null;
  }

  return null;
}

serve(async (req) => {
  try {
    const { supabaseUrl: SUPABASE_URL, supabaseServiceRoleKey: SERVICE_KEY } = getSupabaseAdminEnv();
    const supabaseAdmin: any = createClient(SUPABASE_URL, SERVICE_KEY);

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return new Response("Missing token", { status: 401 });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    const user = userData?.user ?? null;
    if (userErr || !user) return new Response("Invalid token", { status: 401 });

    const callerRole = await getPrimaryRole(supabaseAdmin, user.id);
    if (callerRole !== "admin" && callerRole !== "super_admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await req.json() as Record<string, unknown>;
    const role = normalizeRole(body.role);
    if (role === "super_admin" && callerRole !== "super_admin") {
      return new Response("Only a super admin can assign the super admin role", { status: 403 });
    }

    const targetId = await findTargetUserId(supabaseAdmin, body);
    if (!targetId) return new Response("target user not found", { status: 400 });

    const { data: legacyProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, company_name")
      .eq("id", targetId)
      .maybeSingle();

    await supabaseAdmin.from("profiles").upsert({
      id: targetId,
      email: typeof body.email === "string" ? body.email.trim().toLowerCase() : legacyProfile?.email ?? null,
      role,
      company_name: legacyProfile?.company_name ?? null,
    }, { onConflict: "id" });

    await supabaseAdmin.from("user_profiles").upsert({
      id: targetId,
      default_role: role,
    }, { onConflict: "id" });

    await supabaseAdmin.from("user_role_assignments").delete().eq("user_id", targetId).in("role", [...ALLOWED_ROLES]);
    if (role !== "buyer") {
      await supabaseAdmin.from("user_role_assignments").upsert({
        user_id: targetId,
        role,
        assigned_by: user.id,
      }, { onConflict: "user_id,role" });
      await supabaseAdmin.from("admin_accounts").upsert({
        user_id: targetId,
        status: "active",
      }, { onConflict: "user_id" });
    } else {
      await supabaseAdmin.from("admin_accounts").delete().eq("user_id", targetId);
    }

    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id, full_name, company_name, phone_whatsapp, country_region, avatar_url, default_role, created_at, updated_at")
      .eq("id", targetId)
      .single();
    if (error) return new Response(JSON.stringify(error), { status: 500, headers: { "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ success: true, profile: data }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(message, { status: 500 });
  }
});
