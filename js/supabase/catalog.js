(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});

  async function requireClient() {
    const client = ns.getSupabaseClient && ns.getSupabaseClient();
    if (!client) {
      throw new Error("Supabase client is not configured");
    }
    return client;
  }

  function pagination(page, pageSize) {
    const safePage = Math.max(1, Number(page || 1));
    const safePageSize = Math.min(50, Math.max(1, Number(pageSize || 12)));
    return {
      page: safePage,
      pageSize: safePageSize,
      offset: (safePage - 1) * safePageSize,
    };
  }

  ns.catalogApi = {
    async searchProducts(params) {
      const client = await requireClient();
      const p = pagination(params && params.page, params && params.pageSize);
      const { data, error } = await client.rpc("search_catalog", {
        p_query: (params && params.query) || null,
        p_category_slug: (params && params.categorySlug) || null,
        p_limit: p.pageSize,
        p_offset: p.offset,
      });
      if (error) throw error;
      return {
        items: data || [],
        page: p.page,
        pageSize: p.pageSize,
      };
    },

    async getProductBySlug(slug) {
      const client = await requireClient();
      const { data, error } = await client
        .from("products")
        .select("*, product_specifications(*), product_media_assets(*), inventory_listings(*)")
        .eq("slug", slug)
        .eq("status", "published")
        .is("deleted_at", null)
        .single();
      if (error) throw error;
      return data;
    },

    async listBlogPosts(params) {
      const client = await requireClient();
      const p = pagination(params && params.page, params && params.pageSize);
      let query = client
        .from("blog_posts")
        .select("id, slug, title, excerpt, author_name, published_at, category_id", { count: "exact" })
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .range(p.offset, p.offset + p.pageSize - 1);

      if (params && params.categoryId) {
        query = query.eq("category_id", params.categoryId);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        items: data || [],
        page: p.page,
        pageSize: p.pageSize,
        total: count || 0,
      };
    },

    async listTestimonials(productId) {
      const client = await requireClient();
      let query = client
        .from("buyer_testimonials")
        .select("*")
        .eq("status", "published")
        .order("display_order", { ascending: true });

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  };
})(window);
