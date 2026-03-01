import { handleCors } from "../_shared/cors.ts";
import { fail, json } from "../_shared/http.ts";
import { getOptionalUser } from "../_shared/auth.ts";
import { enforceIpRateLimit, enforceRateLimit, RateLimitExceededError } from "../_shared/rate-limit.ts";
import { assertAllowedOrigin, assertHoneypot, getClientIp, readJsonObject } from "../_shared/security.ts";
import { asOptionalString, asString } from "../_shared/validation.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { serveHttp } from "../_shared/runtime.ts";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

    const testimonialId = asString(body.testimonialId ?? body.id, "testimonialId", 64);
    if (!UUID_REGEX.test(testimonialId)) {
      return fail("testimonialId must be a valid UUID", 400);
    }

    const voteType = asString(body.voteType ?? body.vote, "voteType", 16).toLowerCase();
    if (voteType !== "up" && voteType !== "down") {
      return fail("voteType must be either up or down", 400);
    }

    const sourceChannel = asOptionalString(body.sourceChannel, 80) ?? "product_testimonial";
    const admin = createServiceClient();
    const user = await getOptionalUser(req);

    await enforceIpRateLimit(admin, req, "vote-testimonial-ip", 120, 3600);

    const ip = getClientIp(req) ?? "unknown";
    const voterIdentity = user?.id ? `user:${user.id}` : `ip:${ip}`;
    await enforceRateLimit(admin, {
      functionName: "vote-testimonial-entry",
      identifier: `${voterIdentity}|${testimonialId}`,
      maxHits: 6,
      windowSeconds: 86400,
    });

    const { data, error } = await admin.rpc("record_testimonial_vote", {
      p_testimonial_id: testimonialId,
      p_vote: voteType,
    });

    if (error) {
      if ((error.message || "").toLowerCase().indexOf("not found") >= 0) {
        return fail("Testimonial not found", 404);
      }
      return fail("Failed to register vote", 500, error.message);
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return fail("Vote could not be registered", 500);
    }

    return json({
      testimonialId: row.testimonial_id,
      upVotes: row.up_votes,
      downVotes: row.down_votes,
      voteType,
      sourceChannel,
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
