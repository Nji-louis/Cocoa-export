import { handleCors } from "../_shared/cors.ts";
import { fail, json } from "../_shared/http.ts";
import { getOptionalUser } from "../_shared/auth.ts";
import { enforceIpRateLimit, enforceRateLimit, RateLimitExceededError } from "../_shared/rate-limit.ts";
import { assertAllowedOrigin, assertHoneypot, readJsonObject } from "../_shared/security.ts";
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
    assertAllowedOrigin(req);
    const body = await readJsonObject(req);
    assertHoneypot(body);

    const email = asEmail(body.email, "email");
    const fullName = asOptionalString(body.fullName, 180);
    const sourceChannel = asOptionalString(body.sourceChannel, 80) ?? "unknown";
    const user = await getOptionalUser(req);

    const admin = createServiceClient();
    await enforceIpRateLimit(admin, req, "subscribe-buyer-updates-ip", 30, 3600);
    await enforceRateLimit(admin, {
      functionName: "subscribe-buyer-updates-email",
      identifier: email,
      maxHits: 5,
      windowSeconds: 86400,
    });

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
    const status =
      message === "Origin is not allowed"
        ? 403
        : error instanceof RateLimitExceededError
          ? 429
          : 400;
    return fail(
      message,
      status,
      error instanceof RateLimitExceededError
        ? {
            retryAfterSeconds: error.retryAfterSeconds,
          }
        : undefined,
    );
  }
});
