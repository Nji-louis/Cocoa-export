(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});

  async function requireClient() {
    const client = ns.getSupabaseClient && ns.getSupabaseClient();
    if (client == null) {
      throw new Error("Supabase client is not configured");
    }
    return client;
  }

  function slugify(value, fallbackValue) {
    const normalized = String(value || fallbackValue || "item")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return normalized || String(fallbackValue || "item");
  }

  function paginate(params, defaultPageSize, maxPageSize) {
    const page = Math.max(1, Number((params && params.page) || 1));
    const pageSize = Math.min(maxPageSize || 100, Math.max(1, Number((params && params.pageSize) || defaultPageSize || 20)));
    return {
      page: page,
      pageSize: pageSize,
      from: (page - 1) * pageSize,
      to: (page - 1) * pageSize + pageSize - 1,
    };
  }

  async function invokeFunction(name, payload) {
    const client = await requireClient();
    const { data, error } = await client.functions.invoke(name, {
      body: payload,
    });
    if (error) throw error;
    if (data && data.error) throw new Error(data.error);
    return data;
  }

  async function countRows(client, table, filters) {
    let query = client.from(table).select("id", { count: "exact", head: true });
    (filters || []).forEach(function (filter) {
      if (filter.op === "eq") query = query.eq(filter.column, filter.value);
      if (filter.op === "is") query = query.is(filter.column, filter.value);
      if (filter.op === "in") query = query.in(filter.column, filter.value);
    });
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  ns.adminApi = {
    async upsertListing(payload) {
      return invokeFunction("admin-upsert-listing", payload);
    },

    async createSignedUrl(payload) {
      return invokeFunction("generate-document-signed-url", payload);
    },

    async manageAdminUsers(payload) {
      return invokeFunction("admin-manage-users", payload);
    },

    async listAdminUsers() {
      const data = await invokeFunction("admin-manage-users", { action: "list" });
      return (data && data.items) || [];
    },

    async inviteAdminUser(payload) {
      return invokeFunction("admin-manage-users", {
        action: "invite",
        email: payload.email,
        role: payload.role,
        fullName: payload.fullName,
        title: payload.title,
        redirectTo: payload.redirectTo,
      });
    },

    async updateAdminRole(userId, role) {
      return invokeFunction("admin-manage-users", {
        action: "update_role",
        userId: userId,
        role: role,
      });
    },

    async suspendAdminUser(userId) {
      return invokeFunction("admin-manage-users", {
        action: "suspend",
        userId: userId,
      });
    },

    async activateAdminUser(userId) {
      return invokeFunction("admin-manage-users", {
        action: "activate",
        userId: userId,
      });
    },

    async deleteAdminUser(userId) {
      return invokeFunction("admin-manage-users", {
        action: "delete",
        userId: userId,
      });
    },

    async resetAdminPassword(userId, email, redirectTo) {
      return invokeFunction("admin-manage-users", {
        action: "reset_password",
        userId: userId,
        email: email,
        redirectTo: redirectTo,
      });
    },

    async listProductCategories() {
      const client = await requireClient();
      const { data, error } = await client
        .from("product_categories")
        .select("id, slug, name, description, display_order, status, updated_at")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },

    async createProductCategory(payload) {
      const client = await requireClient();
      const { data, error } = await client
        .from("product_categories")
        .insert({
          slug: slugify(payload.slug || payload.name, "category"),
          name: payload.name,
          description: payload.description || null,
          display_order: Number(payload.displayOrder || 0),
          status: payload.status || "published",
        })
        .select("id, slug, name, description, display_order, status, updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async updateProductCategory(categoryId, payload) {
      const client = await requireClient();
      const updatePayload = {
        name: payload.name,
        description: payload.description || null,
        display_order: Number(payload.displayOrder || 0),
        status: payload.status || "published",
      };
      if (payload.slug) {
        updatePayload.slug = slugify(payload.slug, "category");
      }
      const { data, error } = await client
        .from("product_categories")
        .update(updatePayload)
        .eq("id", categoryId)
        .select("id, slug, name, description, display_order, status, updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async listProducts(params) {
      const client = await requireClient();
      const paging = paginate(params, 50, 100);
      const includeDeleted = Boolean(params && params.includeDeleted);

      let query = client
        .from("products")
        .select("id, category_id, slug, name, short_description, description, origin_country, flavor_notes, is_featured, is_popular, is_new_arrival, status, published_at, deleted_at, updated_at, product_categories(name, slug)", { count: "exact" })
        .order("updated_at", { ascending: false })
        .range(paging.from, paging.to);

      if (includeDeleted === false) {
        query = query.is("deleted_at", null);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        items: data || [],
        page: paging.page,
        pageSize: paging.pageSize,
        total: count || 0,
      };
    },

    async createProduct(payload) {
      const client = await requireClient();
      const { data, error } = await client
        .from("products")
        .insert({
          category_id: payload.categoryId || null,
          slug: slugify(payload.slug || payload.name, "product"),
          name: payload.name,
          short_description: payload.shortDescription || null,
          description: payload.description || null,
          origin_country: payload.originCountry || "Cameroon",
          flavor_notes: Array.isArray(payload.flavorNotes) ? payload.flavorNotes : [],
          is_featured: Boolean(payload.isFeatured),
          is_popular: Boolean(payload.isPopular),
          is_new_arrival: Boolean(payload.isNewArrival),
          status: payload.status || "published",
          published_at: payload.status === "published" ? new Date().toISOString() : null,
        })
        .select("id, slug, name, status, updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async updateProduct(productId, payload) {
      const client = await requireClient();
      const updatePayload = {
        category_id: payload.categoryId || null,
        name: payload.name,
        short_description: payload.shortDescription || null,
        description: payload.description || null,
        origin_country: payload.originCountry || "Cameroon",
        flavor_notes: Array.isArray(payload.flavorNotes) ? payload.flavorNotes : [],
        is_featured: Boolean(payload.isFeatured),
        is_popular: Boolean(payload.isPopular),
        is_new_arrival: Boolean(payload.isNewArrival),
        status: payload.status || "published",
        published_at: payload.status === "published" ? new Date().toISOString() : null,
      };
      if (payload.slug) {
        updatePayload.slug = slugify(payload.slug, "product");
      }
      const { data, error } = await client
        .from("products")
        .update(updatePayload)
        .eq("id", productId)
        .select("id, slug, name, status, updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async deleteProduct(productId) {
      const client = await requireClient();
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

    async listInventoryListings(params) {
      const client = await requireClient();
      const paging = paginate(params, 50, 100);
      let query = client
        .from("inventory_listings")
        .select("id, product_id, listing_code, available_quantity_mt, minimum_order_mt, price_usd_per_mt, currency, incoterm, origin_port, destination_region, harvest_season, status, valid_until, updated_at, products(name, slug)", { count: "exact" })
        .order("updated_at", { ascending: false })
        .range(paging.from, paging.to);
      if (params && params.productId) {
        query = query.eq("product_id", params.productId);
      }
      const { data, error, count } = await query;
      if (error) throw error;
      return {
        items: data || [],
        page: paging.page,
        pageSize: paging.pageSize,
        total: count || 0,
      };
    },

    async listProductSpecifications(productId) {
      const client = await requireClient();
      const { data, error } = await client
        .from("product_specifications")
        .select("id, product_id, spec_key, spec_value, unit, sort_order, updated_at")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true })
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async createProductSpecification(payload) {
      const client = await requireClient();
      const { data, error } = await client
        .from("product_specifications")
        .insert(payload)
        .select("id, product_id, spec_key, spec_value, unit, sort_order, updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async updateProductSpecification(specificationId, payload) {
      const client = await requireClient();
      const { data, error } = await client
        .from("product_specifications")
        .update(payload)
        .eq("id", specificationId)
        .select("id, product_id, spec_key, spec_value, unit, sort_order, updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async deleteProductSpecification(specificationId) {
      const client = await requireClient();
      const { error } = await client.from("product_specifications").delete().eq("id", specificationId);
      if (error) throw error;
      return true;
    },

    async listProductMediaAssets(productId) {
      const client = await requireClient();
      const { data, error } = await client
        .from("product_media_assets")
        .select("id, product_id, bucket_name, storage_path, external_url, alt_text, media_type, visibility, is_primary, display_order, updated_at")
        .eq("product_id", productId)
        .order("is_primary", { ascending: false })
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },

    async uploadProductImage(options) {
      const client = await requireClient();
      const file = options && options.file;
      if (file == null) {
        throw new Error("Image file is required");
      }

      const bucket = String((options && options.bucket) || "product-images").trim();
      const productSlug = slugify(options && options.productSlug, "product");
      const rawName = String(file.name || "image")
        .toLowerCase()
        .replace(/[^a-z0-9.\-_]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const fileName = rawName || ("image-" + Date.now() + ".bin");
      const storagePath = "products/" + productSlug + "/" + Date.now() + "-" + fileName;

      const { error } = await client.storage.from(bucket).upload(storagePath, file, {
        upsert: false,
        cacheControl: "3600",
        contentType: file.type || undefined,
      });
      if (error) throw error;

      const urlResponse = client.storage.from(bucket).getPublicUrl(storagePath);
      return {
        bucketName: bucket,
        storagePath: storagePath,
        publicUrl: (urlResponse && urlResponse.data && urlResponse.data.publicUrl) || "",
      };
    },

    async createProductMediaAsset(payload) {
      const client = await requireClient();
      const { data, error } = await client
        .from("product_media_assets")
        .insert(payload)
        .select("id, product_id, bucket_name, storage_path, external_url, alt_text, media_type, visibility, is_primary, display_order, updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async updateProductMediaAsset(mediaAssetId, payload) {
      const client = await requireClient();
      const { data, error } = await client
        .from("product_media_assets")
        .update(payload)
        .eq("id", mediaAssetId)
        .select("id, product_id, bucket_name, storage_path, external_url, alt_text, media_type, visibility, is_primary, display_order, updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async setPrimaryProductMedia(productId, mediaAssetId) {
      const client = await requireClient();
      const { error: clearError } = await client
        .from("product_media_assets")
        .update({ is_primary: false })
        .eq("product_id", productId)
        .neq("id", mediaAssetId);
      if (clearError) throw clearError;

      const { data, error } = await client
        .from("product_media_assets")
        .update({ is_primary: true })
        .eq("id", mediaAssetId)
        .eq("product_id", productId)
        .select("id, product_id, is_primary")
        .single();
      if (error) throw error;
      return data;
    },

    async deleteProductMediaAsset(mediaAssetId, purgeStorageObject) {
      const client = await requireClient();
      const { data: existing, error: existingError } = await client
        .from("product_media_assets")
        .select("id, bucket_name, storage_path")
        .eq("id", mediaAssetId)
        .single();
      if (existingError) throw existingError;

      if (purgeStorageObject && existing && existing.bucket_name && existing.storage_path) {
        const { error: storageError } = await client.storage.from(existing.bucket_name).remove([existing.storage_path]);
        if (storageError) throw storageError;
      }

      const { error } = await client.from("product_media_assets").delete().eq("id", mediaAssetId);
      if (error) throw error;
      return true;
    },

    async listInquiries(params) {
      const client = await requireClient();
      const paging = paginate(params, 50, 100);
      let query = client
        .from("inquiry_requests")
        .select("id, request_number, source_channel, inquiry_topic, company_name, contact_name, work_email, phone_whatsapp, country_region, required_volume_mt, destination_port, preferred_incoterm, status, priority, message, created_at, updated_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(paging.from, paging.to);
      if (params && params.status) {
        query = query.eq("status", params.status);
      }
      const { data, error, count } = await query;
      if (error) throw error;
      return {
        items: data || [],
        page: paging.page,
        pageSize: paging.pageSize,
        total: count || 0,
      };
    },

    async updateInquiryStatus(inquiryId, toStatus, note) {
      const client = await requireClient();
      const { data, error } = await client.rpc("update_inquiry_status", {
        p_inquiry_id: inquiryId,
        p_to_status: toStatus,
        p_note: note || null,
      });
      if (error) throw error;
      return data;
    },

    async deleteInquiry(inquiryId) {
      const client = await requireClient();
      const { error } = await client.from("inquiry_requests").delete().eq("id", inquiryId);
      if (error) throw error;
      return true;
    },

    async listWebsiteContent() {
      const client = await requireClient();
      const { data, error } = await client
        .from("website_content")
        .select("id, page_key, section_key, title, subtitle, body, content, seo_title, seo_description, seo_keywords, contact_email, contact_phone, address_line, is_published, updated_at")
        .order("page_key", { ascending: true })
        .order("section_key", { ascending: true });
      if (error) throw error;
      return data || [];
    },

    async upsertWebsiteContent(payload) {
      const client = await requireClient();
      const { data, error } = await client
        .from("website_content")
        .upsert({
          id: payload.id || undefined,
          page_key: String(payload.pageKey || "global").toLowerCase(),
          section_key: String(payload.sectionKey || "section").toLowerCase(),
          title: payload.title || null,
          subtitle: payload.subtitle || null,
          body: payload.body || null,
          content: payload.content || {},
          seo_title: payload.seoTitle || null,
          seo_description: payload.seoDescription || null,
          seo_keywords: Array.isArray(payload.seoKeywords) ? payload.seoKeywords : [],
          contact_email: payload.contactEmail || null,
          contact_phone: payload.contactPhone || null,
          address_line: payload.addressLine || null,
          is_published: payload.isPublished !== false,
        }, { onConflict: "page_key,section_key" })
        .select("id, page_key, section_key, title, subtitle, body, content, seo_title, seo_description, seo_keywords, contact_email, contact_phone, address_line, is_published, updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async listMediaFiles() {
      const client = await requireClient();
      const { data, error } = await client
        .from("media_files")
        .select("id, bucket_name, storage_path, file_name, mime_type, file_size_bytes, alt_text, entity_type, entity_id, visibility, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async uploadMediaFile(options) {
      const client = await requireClient();
      const file = options && options.file;
      if (file == null) {
        throw new Error("File is required");
      }
      const bucket = String((options && options.bucket) || "product-images").trim();
      const folder = slugify(options && options.folder, "admin");
      const fileName = Date.now() + "-" + slugify(file.name, "asset");
      const storagePath = folder + "/" + fileName;
      const { error } = await client.storage.from(bucket).upload(storagePath, file, {
        upsert: false,
        cacheControl: "3600",
        contentType: file.type || undefined,
      });
      if (error) throw error;
      const publicUrl = client.storage.from(bucket).getPublicUrl(storagePath);
      return {
        bucketName: bucket,
        storagePath: storagePath,
        publicUrl: (publicUrl && publicUrl.data && publicUrl.data.publicUrl) || "",
        fileName: file.name || fileName,
        mimeType: file.type || null,
        fileSizeBytes: Number(file.size || 0),
      };
    },

    async createMediaFile(payload) {
      const client = await requireClient();
      const { data, error } = await client
        .from("media_files")
        .insert({
          bucket_name: payload.bucketName,
          storage_path: payload.storagePath,
          file_name: payload.fileName,
          mime_type: payload.mimeType || null,
          file_size_bytes: payload.fileSizeBytes || null,
          alt_text: payload.altText || null,
          entity_type: payload.entityType || null,
          entity_id: payload.entityId || null,
          visibility: payload.visibility || "public",
        })
        .select("id, bucket_name, storage_path, file_name, mime_type, file_size_bytes, alt_text, entity_type, entity_id, visibility, created_at, updated_at")
        .single();
      if (error) throw error;
      return data;
    },

    async deleteMediaFile(mediaId, removeStorageObject) {
      const client = await requireClient();
      const { data: existing, error: existingError } = await client
        .from("media_files")
        .select("id, bucket_name, storage_path")
        .eq("id", mediaId)
        .single();
      if (existingError) throw existingError;
      if (removeStorageObject && existing && existing.bucket_name && existing.storage_path) {
        const { error: storageError } = await client.storage.from(existing.bucket_name).remove([existing.storage_path]);
        if (storageError) throw storageError;
      }
      const { error } = await client.from("media_files").delete().eq("id", mediaId);
      if (error) throw error;
      return true;
    },

    async getDashboardSummary() {
      const client = await requireClient();
      const totals = {
        products: await countRows(client, "products", [{ op: "is", column: "deleted_at", value: null }]),
        inquiries: await countRows(client, "inquiry_requests", []),
        contentBlocks: await countRows(client, "website_content", []),
        mediaFiles: await countRows(client, "media_files", []),
      };

      let adminUsers = [];
      try {
        adminUsers = await this.listAdminUsers();
      } catch (error) {
        adminUsers = [];
      }
      totals.admins = adminUsers.length;

      const { data: recentInquiries, error: inquiriesError } = await client
        .from("inquiry_requests")
        .select("id, company_name, source_channel, status, created_at")
        .order("created_at", { ascending: false })
        .limit(6);
      if (inquiriesError) throw inquiriesError;

      const { data: activities, error: activitiesError } = await client
        .from("admin_activity_log")
        .select("id, action, entity_type, entity_id, details, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      if (activitiesError) throw activitiesError;

      const { data: sourceRows, error: sourceError } = await client
        .from("inquiry_requests")
        .select("source_channel");
      if (sourceError) throw sourceError;

      const sourceBreakdown = {};
      (sourceRows || []).forEach(function (row) {
        const key = row && row.source_channel ? row.source_channel : "unknown";
        sourceBreakdown[key] = (sourceBreakdown[key] || 0) + 1;
      });

      return {
        totals: totals,
        recentInquiries: recentInquiries || [],
        activities: activities || [],
        sourceBreakdown: sourceBreakdown,
        adminUsers: adminUsers,
      };
    },
  };
})(window);
