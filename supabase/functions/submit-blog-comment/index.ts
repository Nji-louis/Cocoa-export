import { handleCors } from "../_shared/cors.ts";
import { fail, json } from "../_shared/http.ts";
import { getOptionalUser } from "../_shared/auth.ts";
import { enforceIpRateLimit, enforceRateLimit, RateLimitExceededError } from "../_shared/rate-limit.ts";
import { assertAllowedOrigin, assertHoneypot, readJsonObject } from "../_shared/security.ts";
import { asEmail, asOptionalString, asString } from "../_shared/validation.ts";
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

    const postSlug = asOptionalString(body.postSlug, 120);
    const postId = asOptionalString(body.postId, 64);
    const message = asString(body.message, "message", 5000);
    const sourceChannel = asOptionalString(body.sourceChannel, 80) ?? "blog_detail";

    if (!postSlug && !postId) {
      return fail("Either postSlug or postId is required", 400);
    }

    const user = await getOptionalUser(req);
    const authorName = user
      ? asOptionalString(body.authorName, 180) ?? (user.user_metadata?.full_name as string | undefined) ?? "Authenticated User"
      : asString(body.authorName, "authorName", 180);

    const authorEmail = user
      ? (user.email ?? asEmail(body.authorEmail, "authorEmail"))
      : asEmail(body.authorEmail, "authorEmail");

    let authorAvatarUrl: string | null = null;
    if (user) {
      const metadataAvatar = asOptionalString(
        (user.user_metadata?.avatar_url as string | undefined)
          ?? (user.user_metadata?.picture as string | undefined),
        2000,
      );
      authorAvatarUrl = metadataAvatar ?? null;
    }

    const admin = createServiceClient();
    await enforceIpRateLimit(admin, req, "submit-blog-comment-ip", 20, 3600);
    await enforceRateLimit(admin, {
      functionName: "submit-blog-comment-author",
      identifier: `${authorEmail}|${postSlug ?? postId ?? "unknown"}`,
      maxHits: 8,
      windowSeconds: 3600,
    });

    let resolvedPostId = postId;
    if (!resolvedPostId && postSlug) {
      const { data: post, error: postError } = await admin
        .from("blog_posts")
        .select("id")
        .eq("slug", postSlug)
        .single();

      if (postError) {
        return fail("Invalid post slug", 400, postError.message);
      }
      resolvedPostId = post.id;
    }

    if (user && !authorAvatarUrl) {
      const { data: profile } = await admin
        .from("user_profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      authorAvatarUrl = (profile?.avatar_url as string | null) ?? null;
    }

    const { data, error } = await admin
      .from("blog_comments")
      .insert({
        post_id: resolvedPostId,
        author_user_id: user?.id ?? null,
        author_name: authorName,
        author_email: authorEmail,
        author_avatar_url: authorAvatarUrl,
        message,
        status: "approved",
        approved_by: user?.id ?? null,
        approved_at: new Date().toISOString(),
        source_channel: sourceChannel,
      })
      .select("id, status, created_at, author_avatar_url")
      .single();

    if (error) {
      return fail("Failed to submit comment", 500, error.message);
    }

    return json({
      commentId: data.id,
      status: data.status,
      createdAt: data.created_at,
      authorAvatarUrl: data.author_avatar_url ?? null,
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
