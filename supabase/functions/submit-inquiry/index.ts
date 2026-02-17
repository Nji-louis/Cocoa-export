import { handleCors } from "../_shared/cors.ts";
import { fail, json } from "../_shared/http.ts";
import { getOptionalUser } from "../_shared/auth.ts";
import { asEmail, asOptionalPositiveNumber, asOptionalString, asString } from "../_shared/validation.ts";
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

    const companyName = asString(body.companyName, "companyName", 180);
    const workEmail = asEmail(body.workEmail, "workEmail");
    const contactName = asOptionalString(body.contactName, 180);
    const phoneWhatsApp = asOptionalString(body.phoneWhatsApp, 80);
    const countryRegion = asOptionalString(body.countryRegion, 120);
    const destinationPort = asOptionalString(body.destinationPort, 160);
    const preferredIncoterm = asOptionalString(body.preferredIncoterm, 40);
    const qualitySpecs = asOptionalString(body.qualitySpecs, 1000);
    const message = asOptionalString(body.message, 3000);
    const inquiryTopic = asOptionalString(body.inquiryTopic, 120);
    const requiredVolumeMt = asOptionalPositiveNumber(body.requiredVolumeMt, "requiredVolumeMt");
    const sourceChannel = asOptionalString(body.sourceChannel, 80) ?? "unknown";
    const productSlug = asOptionalString(body.productSlug, 120);

    const user = await getOptionalUser(req);
    const admin = createServiceClient();

    let productId: string | null = null;
    if (productSlug) {
      const { data: product, error: productError } = await admin
        .from("products")
        .select("id")
        .eq("slug", productSlug)
        .single();

      if (productError) {
        return fail("Invalid product slug", 400, productError.message);
      }
      productId = product.id;
    }

    const { data: inquiry, error: insertError } = await admin
      .from("inquiry_requests")
      .insert({
        submitted_by: user?.id ?? null,
        product_id: productId,
        source_channel: sourceChannel,
        inquiry_topic: inquiryTopic,
        company_name: companyName,
        contact_name: contactName,
        work_email: workEmail,
        phone_whatsapp: phoneWhatsApp,
        country_region: countryRegion,
        required_volume_mt: requiredVolumeMt,
        destination_port: destinationPort,
        preferred_incoterm: preferredIncoterm,
        quality_specs: qualitySpecs,
        message,
        status: "new",
      })
      .select("id, request_number, status, created_at")
      .single();

    if (insertError) {
      return fail("Failed to create inquiry", 500, insertError.message);
    }

    await admin.from("inquiry_events").insert({
      inquiry_id: inquiry.id,
      actor_user_id: user?.id ?? null,
      event_type: "created",
      to_status: "new",
      note: "Inquiry submitted via edge function",
      metadata: {
        sourceChannel,
      },
    });

    return json({
      inquiryId: inquiry.id,
      requestNumber: inquiry.request_number,
      status: inquiry.status,
      createdAt: inquiry.created_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
});
