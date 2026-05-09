(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});

  const ADMIN_USER_ACTION = "admin-manage-users";
  const INQUIRY_STATUSES = new Set([
    "new",
    "triaged",
    "quoted",
    "negotiating",
    "contracted",
    "closed_won",
    "closed_lost",
    "archived",
  ]);

  function getClient() {
    const client = ns.getSupabaseClient && ns.getSupabaseClient();
    if (!client) {
      throw new Error("Supabase client is not configured");
    }
    return client;
  }

  async function getCurrentUserId(client) {
    const { data, error } = await client.auth.getUser();
    if (error) {
      throw error;
    }
    return data?.user?.id || null;
  }

  function normalizeSlug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  async function invokeFunction(name, body) {
    const client = getClient();
    const { data, error } = await client.functions.invoke(name, { body });
    if (error) throw error;
    if (data && data.error) throw new Error(data.error);
    return data;
  }

  async function resolveProductId(client, payload) {
    if (payload.productId) return payload.productId;
    if (payload.productSlug) {
      const { data, error } = await client
        .from("products")
        .select("id")
        .eq("slug", String(payload.productSlug).trim().toLowerCase())
        .maybeSingle();
      if (error) throw error;
      return data?.id || null;
    }
    return null;
  }

  async function uploadStorageFile(client, bucketName, storagePath, file) {
    const { error } = await client.storage.from(bucketName).upload(storagePath, file, {
      upsert: false,
      cacheControl: "3600",
      contentType: file.type || undefined,
    });
    if (error) throw error;

    const urlResponse = client.storage.from(bucketName).getPublicUrl(storagePath);
    return urlResponse?.data?.publicUrl || "";
  }

  async function getCurrentUserIdSafe(client) {
    try {
      return await getCurrentUserId(client);
    } catch (error) {
      return null;
    }
  }

  ns.adminApi = Object.assign(ns.adminApi || {}, {
    async getDashboardSummary() {
      const client = getClient();
      const [
        productsResponse,
        inquiriesResponse,
        adminAccountsResponse,
        mediaResponse,
        inquirySourcesResponse,
        activitiesResponse,
      ] = await Promise.all([
        client.from("products").select("id").is("deleted_at", null),
        client.from("inquiry_requests").select("id, source_channel, created_at"),
        client.from("admin_accounts").select("user_id, status"),
        client.from("media_files").select("id"),
        client.from("inquiry_requests").select("source_channel"),
        client.from("admin_activity_log").select("id, action, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      if (productsResponse.error) throw productsResponse.error;
      if (inquiriesResponse.error) throw inquiriesResponse.error;
      if (adminAccountsResponse.error) throw adminAccountsResponse.error;
      if (mediaResponse.error) throw mediaResponse.error;
      if (inquirySourcesResponse.error) throw inquirySourcesResponse.error;
      if (activitiesResponse.error) throw activitiesResponse.error;

      const sourceBreakdown = {};
      toArray(inquirySourcesResponse.data).forEach(function (row) {
        const key = String(row.source_channel || "unknown");
        sourceBreakdown[key] = (sourceBreakdown[key] || 0) + 1;
      });

      return {
        totals: {
          products: toArray(productsResponse.data).length,
          inquiries: toArray(inquiriesResponse.data).length,
          admins: toArray(adminAccountsResponse.data).length,
          mediaFiles: toArray(mediaResponse.data).length,
        },
        sourceBreakdown,
        activities: toArray(activitiesResponse.data),
      };
    },

    async listProductCategories() {
      const client = getClient();
      const { data, error } = await client
        .from("product_categories")
        .select("id, slug, name, description, display_order, status, created_at, updated_at")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },

    async createProductCategory(payload) {
      const client = getClient();
      const name = String(payload.name || "").trim();
      if (!name) {
        throw new Error("Category name is required");
      }
      const slug = normalizeSlug(payload.slug || name);
      const { data, error } = await client
        .from("product_categories")
        .insert({
          name,
          slug,
          description: String(payload.description || "").trim() || null,
          display_order: Number(payload.displayOrder || 0),
          status: payload.status || "published",
        })
        .select("id, slug, name, status, updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async listProducts(params = {}) {
      const client = getClient();
      const page = Math.max(1, Number(params.page || 1));
      const pageSize = Math.min(100, Math.max(1, Number(params.pageSize || 50)));
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const includeDeleted = Boolean(params.includeDeleted);

      let query = client
        .from("products")
        .select(
          "id, category_id, slug, name, short_description, description, origin_country, flavor_notes, is_featured, is_popular, is_new_arrival, status, published_at, deleted_at, updated_at, product_categories(name, slug)",
          { count: "exact" },
        )
        .order("updated_at", { ascending: false })
        .range(from, to);

      if (!includeDeleted) {
        query = query.is("deleted_at", null);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        items: data || [],
        page,
        pageSize,
        total: count || 0,
      };
    },

    async createProduct(payload) {
      const client = getClient();
      const userId = await getCurrentUserIdSafe(client);
      const name = String(payload.name || "").trim();
      if (!name) throw new Error("Product name is required");
      const slug = normalizeSlug(payload.slug || name);
      const status = payload.status || "published";
      const publishedAt = status === "published" ? new Date().toISOString() : null;
      const { data, error } = await client
        .from("products")
        .insert({
          category_id: payload.categoryId || null,
          slug,
          name,
          short_description: String(payload.shortDescription || "").trim() || null,
          description: String(payload.description || "").trim() || null,
          origin_country: String(payload.originCountry || "Cameroon").trim() || "Cameroon",
          flavor_notes: toArray(payload.flavorNotes),
          is_featured: Boolean(payload.isFeatured),
          is_popular: Boolean(payload.isPopular),
          is_new_arrival: Boolean(payload.isNewArrival),
          status,
          published_at: publishedAt,
          created_by: userId,
        })
        .select("id, slug, name, status, updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async updateProduct(productId, payload) {
      const client = getClient();
      const status = payload.status || "published";
      const publishedAt = status === "published" ? new Date().toISOString() : null;
      const { data, error } = await client
        .from("products")
        .update({
          category_id: payload.categoryId || null,
          slug: normalizeSlug(payload.slug || ""),
          name: String(payload.name || "").trim(),
          short_description: String(payload.shortDescription || "").trim() || null,
          description: String(payload.description || "").trim() || null,
          origin_country: String(payload.originCountry || "Cameroon").trim() || "Cameroon",
          flavor_notes: toArray(payload.flavorNotes),
          is_featured: Boolean(payload.isFeatured),
          is_popular: Boolean(payload.isPopular),
          is_new_arrival: Boolean(payload.isNewArrival),
          status,
          published_at: publishedAt,
        })
        .eq("id", productId)
        .select("id, slug, name, status, updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async deleteProduct(productId) {
      const client = getClient();
      const { data, error } = await client
        .from("products")
        .update({ deleted_at: new Date().toISOString(), status: "archived" })
        .eq("id", productId)
        .is("deleted_at", null)
        .select("id, slug, name, status, deleted_at")
        .single();
      if (error) throw error;
      return data;
    },

    async updateInquiryStatus(id, status, note) {
      if (!id) throw new Error("Inquiry id is required");
      if (!INQUIRY_STATUSES.has(String(status))) {
        throw new Error("Invalid inquiry status");
      }
      return invokeFunction("update-inquiry-status", {
        id,
        status,
        note: note || null,
      });
    },

    async listInquiries(params = {}) {
      const client = getClient();
      let query = client
        .from("inquiry_requests")
        .select(
          "id, request_number, source_channel, inquiry_topic, company_name, contact_name, work_email, phone_whatsapp, country_region, required_volume_mt, destination_port, preferred_incoterm, quality_specs, message, status, priority, created_at, updated_at",
          { count: "exact" },
        )
        .order("created_at", { ascending: false });

      const pageSize = Math.min(100, Math.max(1, Number(params.pageSize || 100)));
      const page = Math.max(1, Number(params.page || 1));
      query = query.range((page - 1) * pageSize, (page - 1) * pageSize + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        items: data || [],
        page,
        pageSize,
        total: count || 0,
      };
    },

    async listWebsiteContent() {
      const client = getClient();
      const { data, error } = await client
        .from("website_content")
        .select("id, page_key, section_key, title, subtitle, body, content, seo_title, seo_description, seo_keywords, contact_email, contact_phone, address_line, is_published, updated_at")
        .order("page_key", { ascending: true })
        .order("section_key", { ascending: true });
      if (error) throw error;
      return data || [];
    },

    async upsertWebsiteContent(payload) {
      const client = getClient();
      const userId = await getCurrentUserIdSafe(client);
      const pageKey = normalizeSlug(payload.pageKey);
      const sectionKey = normalizeSlug(payload.sectionKey);
      if (!pageKey || !sectionKey) {
        throw new Error("Page key and section key are required");
      }
      const { data, error } = await client
        .from("website_content")
        .upsert({
          id: payload.id || undefined,
          page_key: pageKey,
          section_key: sectionKey,
          title: String(payload.title || "").trim() || null,
          subtitle: String(payload.subtitle || "").trim() || null,
          body: String(payload.body || "").trim() || null,
          content: payload.content || {},
          seo_title: String(payload.seoTitle || "").trim() || null,
          seo_description: String(payload.seoDescription || "").trim() || null,
          seo_keywords: toArray(payload.seoKeywords),
          contact_phone: String(payload.contactPhone || "").trim() || null,
          contact_email: String(payload.contactEmail || "").trim() || null,
          address_line: String(payload.addressLine || "").trim() || null,
          is_published: Boolean(payload.isPublished),
          updated_by: userId,
        }, { onConflict: "page_key,section_key" })
        .select("id, page_key, section_key, title, updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async listMediaFiles() {
      const client = getClient();
      const { data, error } = await client
        .from("media_files")
        .select("id, bucket_name, storage_path, file_name, mime_type, file_size_bytes, alt_text, entity_type, entity_id, visibility, uploaded_by, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async uploadMediaFile(options = {}) {
      const client = getClient();
      const file = options.file;
      if (!file) {
        throw new Error("Media file is required");
      }
      const bucketName = String(options.bucket || "product-images").trim() || "product-images";
      const folder = normalizeSlug(options.folder || "uploads") || "uploads";
      const rawName = String(file.name || "file")
        .toLowerCase()
        .replace(/[^a-z0-9.\-_]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const fileName = rawName || `file-${Date.now()}`;
      const storagePath = `${folder}/${Date.now()}-${fileName}`;
      const publicUrl = await uploadStorageFile(client, bucketName, storagePath, file);
      return {
        bucketName,
        storagePath,
        fileName,
        mimeType: file.type || null,
        fileSizeBytes: typeof file.size === "number" ? file.size : null,
        publicUrl,
      };
    },

    async uploadProductImage(options = {}) {
      const client = getClient();
      const file = options.file;
      if (!file) {
        throw new Error("Image file is required");
      }
      const bucketName = String(options.bucket || "product-images").trim() || "product-images";
      const productSlug = normalizeSlug(options.productSlug || "product") || "product";
      const rawName = String(file.name || "image")
        .toLowerCase()
        .replace(/[^a-z0-9.\-_]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const fileName = rawName || `image-${Date.now()}.bin`;
      const storagePath = `products/${productSlug}/${Date.now()}-${fileName}`;
      const publicUrl = await uploadStorageFile(client, bucketName, storagePath, file);
      return {
        bucketName,
        storagePath,
        fileName,
        mimeType: file.type || null,
        fileSizeBytes: typeof file.size === "number" ? file.size : null,
        publicUrl,
      };
    },

    async createMediaFile(payload) {
      const client = getClient();
      const userId = await getCurrentUserIdSafe(client);
      const { data, error } = await client
        .from("media_files")
        .insert({
          bucket_name: payload.bucketName,
          storage_path: payload.storagePath,
          file_name: payload.fileName || payload.storagePath.split("/").pop() || "file",
          mime_type: payload.mimeType || null,
          file_size_bytes: payload.fileSizeBytes || null,
          alt_text: String(payload.altText || "").trim() || null,
          entity_type: payload.entityType || null,
          entity_id: payload.entityId || null,
          visibility: payload.visibility || "public",
          uploaded_by: userId,
        })
        .select("id, bucket_name, storage_path, file_name, visibility, updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async createProductMediaAsset(payload) {
      const client = getClient();
      const { data, error } = await client
        .from("product_media_assets")
        .insert({
          product_id: payload.product_id || payload.productId,
          bucket_name: payload.bucket_name || payload.bucketName || null,
          storage_path: payload.storage_path || payload.storagePath || null,
          external_url: payload.external_url || payload.externalUrl || null,
          alt_text: payload.alt_text || payload.altText || null,
          media_type: payload.media_type || payload.mediaType || "image",
          visibility: payload.visibility || "public",
          is_primary: Boolean(payload.is_primary ?? payload.isPrimary),
          display_order: Number(payload.display_order ?? payload.displayOrder ?? 0),
        })
        .select("id, product_id, bucket_name, storage_path, alt_text, media_type, visibility, is_primary, display_order, updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async deleteMediaFile(mediaFileId, purgeStorageObject) {
      const client = getClient();
      const { data: existing, error: existingError } = await client
        .from("media_files")
        .select("id, bucket_name, storage_path")
        .eq("id", mediaFileId)
        .single();
      if (existingError) throw existingError;
      if (purgeStorageObject && existing?.bucket_name && existing?.storage_path) {
        const { error: removeError } = await client
          .storage
          .from(existing.bucket_name)
          .remove([existing.storage_path]);
        if (removeError) throw removeError;
      }
      const { error } = await client
        .from("media_files")
        .delete()
        .eq("id", mediaFileId);
      if (error) throw error;
      return true;
    },

    async listAdminUsers() {
      return invokeFunction(ADMIN_USER_ACTION, { action: "list" }).then(function (data) {
        return data?.items || [];
      });
    },

    async inviteAdminUser(payload) {
      return invokeFunction(ADMIN_USER_ACTION, {
        action: "invite",
        fullName: payload.fullName || payload.name || null,
        email: payload.email,
        title: payload.title || null,
        role: payload.role || "staff",
        redirectTo: payload.redirectTo || null,
      });
    },

    async updateAdminRole(userId, role) {
      return invokeFunction(ADMIN_USER_ACTION, {
        action: "update_role",
        userId,
        role,
      });
    },

    async suspendAdminUser(userId) {
      return invokeFunction(ADMIN_USER_ACTION, {
        action: "suspend",
        userId,
      });
    },

    async activateAdminUser(userId) {
      return invokeFunction(ADMIN_USER_ACTION, {
        action: "activate",
        userId,
      });
    },

    async deleteAdminUser(userId) {
      return invokeFunction(ADMIN_USER_ACTION, {
        action: "delete",
        userId,
      });
    },

    async upsertListing(payload) {
      const client = getClient();
      const productId = await resolveProductId(client, payload);
      if (!productId) {
        throw new Error("Select a product before saving the listing");
      }
      const userId = await getCurrentUserIdSafe(client);
      const listingCode = String(payload.listingCode || "").trim();
      if (!listingCode) {
        throw new Error("Listing code is required");
      }
      const { data, error } = await client
        .from("inventory_listings")
        .upsert({
          product_id: productId,
          listing_code: listingCode,
          available_quantity_mt: payload.availableQuantityMt === "" || payload.availableQuantityMt == null ? null : Number(payload.availableQuantityMt),
          minimum_order_mt: payload.minimumOrderMt === "" || payload.minimumOrderMt == null ? null : Number(payload.minimumOrderMt),
          price_usd_per_mt: payload.priceUsdPerMt === "" || payload.priceUsdPerMt == null ? null : Number(payload.priceUsdPerMt),
          currency: payload.currency || "USD",
          incoterm: payload.incoterm || null,
          origin_port: payload.originPort || null,
          destination_region: payload.destinationRegion || null,
          harvest_season: payload.harvestSeason || null,
          status: payload.status || "active",
          valid_until: payload.validUntil || null,
          updated_by: userId,
          created_by: userId,
        }, { onConflict: "listing_code" })
        .select("id, listing_code, status, updated_at")
        .single();
      if (error) throw error;
      return data;
    },
  });
})(window);
