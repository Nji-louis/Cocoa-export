/**
 * Supabase Edge Function (Deno) - Update inquiry status (admin only)
 *
 * Uses the newer role model for authorization and updates the
 * inquiry_requests table used by the current admin dashboard.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { getSupabaseAdminEnv } from "../_shared/env.ts";
import { getPrimaryRole } from "../_shared/roles.ts";

const ALLOWED = ["new", "triaged", "quoted", "negotiating", "contracted", "closed_won", "closed_lost", "archived"] as const;

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

    const body = await req.json();
    const { id, status, note } = body;
    if (!id || !ALLOWED.includes(status)) return new Response("Invalid payload", { status: 400 });

    const { data: current, error: currentError } = await supabaseAdmin
      .from("inquiry_requests")
      .select("id, status")
      .eq("id", id)
      .single();
    if (currentError) return new Response(JSON.stringify(currentError), { status: 500, headers: { "Content-Type": "application/json" } });

    const closedAt = ["archived", "closed_won", "closed_lost"].includes(status) ? new Date().toISOString() : null;
    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (closedAt) {
      updatePayload.closed_at = closedAt;
    }

    const { data, error } = await supabaseAdmin
      .from("inquiry_requests")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();
    if (error) return new Response(JSON.stringify(error), { status: 500, headers: { "Content-Type": "application/json" } });

    await supabaseAdmin.from("inquiry_events").insert({
      inquiry_id: id,
      actor_user_id: user.id,
      event_type: "status_changed",
      from_status: current?.status ?? null,
      to_status: status,
      note: typeof note === "string" && note.trim() ? note.trim() : null,
      metadata: {},
    });

    return new Response(JSON.stringify({ success: true, inquiry: data }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(message, { status: 500 });
  }
});
