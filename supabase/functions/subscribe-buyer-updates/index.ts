import { handleCors } from "../_shared/cors.ts";
import { fail, json } from "../_shared/http.ts";
import { getOptionalUser } from "../_shared/auth.ts";
import { asEmail, asOptionalString } from "../_shared/validation.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { serveHttp } from "../_shared/runtime.ts";

serveHttp(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return fail("Method not allowed", 405);
  }

  try {
    const body = await req.json();
    const email = asEmail(body.email, "email");
    const fullName = asOptionalString(body.fullName, 180);
    const sourceChannel = asOptionalString(body.sourceChannel, 80) ?? "unknown";
    const user = await getOptionalUser(req);

    const admin = createServiceClient();
    const { data, error } = await admin
      .from("newsletter_subscriptions")
      .upsert(
        {
          email,
          full_name: fullName,
          user_id: user?.id ?? null,
          source_channel: sourceChannel,
          status: "active",
          unsubscribed_at: null,
          subscribed_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      )
      .select("id, email, status, source_channel, updated_at")
      .single();

    if (error) {
      return fail("Failed to save subscription", 500, error.message);
    }

    return json({
      subscriptionId: data.id,
      email: data.email,
      status: data.status,
      sourceChannel: data.source_channel,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return fail(message, 400);
  }
});
