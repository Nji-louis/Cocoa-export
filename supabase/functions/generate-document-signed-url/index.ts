import { handleCors } from "../_shared/cors.ts";
import { fail, json } from "../_shared/http.ts";
import { requireStaffOrAdmin, requireUser } from "../_shared/auth.ts";
import { assertAllowedOrigin, readJsonObject } from "../_shared/security.ts";
import { asString } from "../_shared/validation.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { serveHttp } from "../_shared/runtime.ts";

const ALLOWED_BUCKETS = new Set(["export-documents", "inquiry-attachments"]);

serveHttp(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return fail("Method not allowed", 405);
  }

  try {
    assertAllowedOrigin(req);
    const user = await requireUser(req);
    await requireStaffOrAdmin(user.id);

    const body = await readJsonObject(req);
    const bucket = asString(body.bucket ?? "export-documents", "bucket", 80);
    const path = asString(body.path, "path", 1000);
    const expiresIn = Number(body.expiresIn ?? 300);

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return fail("Bucket is not allowed", 403);
    }

    if (!Number.isInteger(expiresIn) || expiresIn < 60 || expiresIn > 3600) {
      return fail("expiresIn must be an integer between 60 and 3600", 400);
    }

    const admin = createServiceClient();
    const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, expiresIn);

    if (error) {
      return fail("Unable to create signed URL", 500, error.message);
    }

    return json({
      bucket,
      path,
      signedUrl: data.signedUrl,
      expiresIn,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" || message === "Origin is not allowed" ? 403 : 400;
    return fail(message, status);
  }
});
