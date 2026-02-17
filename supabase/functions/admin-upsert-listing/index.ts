import { handleCors } from "../_shared/cors.ts";
import { fail, json } from "../_shared/http.ts";
import { requireStaffOrAdmin, requireUser } from "../_shared/auth.ts";
import { asOptionalPositiveNumber, asOptionalString, asString } from "../_shared/validation.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { serveHttp } from "../_shared/runtime.ts";

serveHttp(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return fail("Method not allowed", 405);
  }

  try {
    const user = await requireUser(req);
    await requireStaffOrAdmin(user.id);

    const body = await req.json();

    const productSlug = asString(body.productSlug, "productSlug", 120);
    const listingCode = asString(body.listingCode, "listingCode", 120);
    const status = asOptionalString(body.status, 20) ?? "active";

    const availableQuantityMt = asOptionalPositiveNumber(body.availableQuantityMt, "availableQuantityMt");
    const minimumOrderMt = asOptionalPositiveNumber(body.minimumOrderMt, "minimumOrderMt");
    const priceUsdPerMt = asOptionalPositiveNumber(body.priceUsdPerMt, "priceUsdPerMt");

    const currency = asOptionalString(body.currency, 3) ?? "USD";
    const incoterm = asOptionalString(body.incoterm, 20);
    const originPort = asOptionalString(body.originPort, 120);
    const destinationRegion = asOptionalString(body.destinationRegion, 120);
    const harvestSeason = asOptionalString(body.harvestSeason, 80);
    const validUntil = asOptionalString(body.validUntil, 40);

    const admin = createServiceClient();

    const { data: product, error: productError } = await admin
      .from("products")
      .select("id")
      .eq("slug", productSlug)
      .single();

    if (productError) {
      return fail("Product not found", 404, productError.message);
    }

    const { data, error } = await admin
      .from("inventory_listings")
      .upsert(
        {
          product_id: product.id,
          listing_code: listingCode,
          available_quantity_mt: availableQuantityMt,
          minimum_order_mt: minimumOrderMt,
          price_usd_per_mt: priceUsdPerMt,
          currency,
          incoterm,
          origin_port: originPort,
          destination_region: destinationRegion,
          harvest_season: harvestSeason,
          status,
          valid_until: validUntil,
          created_by: user.id,
          updated_by: user.id,
        },
        { onConflict: "listing_code" },
      )
      .select("id, listing_code, status, updated_at")
      .single();

    if (error) {
      return fail("Failed to upsert listing", 500, error.message);
    }

    return json({
      listingId: data.id,
      listingCode: data.listing_code,
      status: data.status,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return fail(message, status);
  }
});
