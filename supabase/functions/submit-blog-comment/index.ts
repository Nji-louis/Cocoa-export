import { handleCors } from "../_shared/cors.ts";
import { fail, json } from "../_shared/http.ts";
import { getOptionalUser } from "../_shared/auth.ts";
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
    const body = await req.json();
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

    const admin = createServiceClient();

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

    const { data, error } = await admin
      .from("blog_comments")
      .insert({
        post_id: resolvedPostId,
        author_user_id: user?.id ?? null,
        author_name: authorName,
        author_email: authorEmail,
        message,
        status: "pending",
        source_channel: sourceChannel,
      })
      .select("id, status, created_at")
      .single();

    if (error) {
      return fail("Failed to submit comment", 500, error.message);
    }

    return json({
      commentId: data.id,
      status: data.status,
      createdAt: data.created_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return fail(message, 400);
  }
});
