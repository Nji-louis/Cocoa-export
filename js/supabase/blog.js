(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});

  function isAbortLikeError(error) {
    if (!error) return false;

    if (typeof error === "string") {
      return error.toLowerCase().indexOf("abort") >= 0 || error.toLowerCase().indexOf("aborted") >= 0;
    }

    const name = String(error.name || "").toLowerCase();
    const message = String(error.message || "").toLowerCase();
    return name === "aborterror" || message.indexOf("aborted") >= 0 || message.indexOf("signal is aborted") >= 0;
  }

  async function withAbortRetry(fn) {
    try {
      return await fn();
    } catch (error) {
      if (!isAbortLikeError(error)) {
        throw error;
      }
      return await fn();
    }
  }

  function getConfig() {
    return global.__SUPABASE_CONFIG__ || null;
  }

  function parseCountHeader(contentRange) {
    if (!contentRange) return 0;
    const parts = String(contentRange).split("/");
    if (parts.length !== 2) return 0;
    const total = Number(parts[1]);
    return Number.isFinite(total) ? total : 0;
  }

  async function restSelectBlogPosts(params) {
    const config = getConfig();
    if (!config || !config.url || !config.anonKey) {
      throw new Error("Supabase client is not configured");
    }

    const page = Math.max(1, Number((params && params.page) || 1));
    const pageSize = Math.min(50, Math.max(1, Number((params && params.pageSize) || 12)));
    const offset = (page - 1) * pageSize;

    const query = new URLSearchParams();
    query.set("select", "*");
    query.set("status", "eq.published");
    query.set("order", "published_at.desc.nullslast");
    query.set("offset", String(offset));
    query.set("limit", String(pageSize));

    const response = await fetch(config.url + "/rest/v1/blog_posts?" + query.toString(), {
      headers: {
        apikey: config.anonKey,
        Authorization: "Bearer " + config.anonKey,
        Prefer: "count=exact",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load blog posts (" + response.status + ")");
    }

    const data = await response.json();
    return {
      items: Array.isArray(data) ? data : [],
      page: page,
      pageSize: pageSize,
      total: parseCountHeader(response.headers.get("content-range")),
    };
  }

  async function restSelectPostBySlug(postSlug) {
    const config = getConfig();
    if (!config || !config.url || !config.anonKey) {
      throw new Error("Supabase client is not configured");
    }

    const query = new URLSearchParams();
    query.set("select", "*");
    query.set("status", "eq.published");
    query.set("slug", "eq." + postSlug);
    query.set("limit", "1");

    const response = await fetch(config.url + "/rest/v1/blog_posts?" + query.toString(), {
      headers: {
        apikey: config.anonKey,
        Authorization: "Bearer " + config.anonKey,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load blog post (" + response.status + ")");
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }
    return data[0];
  }

  async function requireClient() {
    const client = ns.getSupabaseClient && ns.getSupabaseClient();
    if (!client) {
      throw new Error("Supabase client is not configured");
    }
    return client;
  }

  ns.blogApi = {
    async listPublishedPosts(params) {
      const client = await requireClient();
      const page = Math.max(1, Number((params && params.page) || 1));
      const pageSize = Math.min(50, Math.max(1, Number((params && params.pageSize) || 12)));
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      try {
        const { data, error, count } = await withAbortRetry(function () {
          return client
            .from("blog_posts")
            .select("*", { count: "exact" })
            .eq("status", "published")
            .order("published_at", { ascending: false, nullsFirst: false })
            .range(from, to);
        });

        if (error) throw error;
        return {
          items: data || [],
          page,
          pageSize,
          total: count || 0,
        };
      } catch (error) {
        if (!isAbortLikeError(error)) {
          throw error;
        }
        return await restSelectBlogPosts(params);
      }
    },

    async getPostBySlug(postSlug) {
      const client = await requireClient();
      try {
        const { data, error } = await withAbortRetry(function () {
          return client
            .from("blog_posts")
            .select("*")
            .eq("status", "published")
            .eq("slug", postSlug)
            .maybeSingle();
        });
        if (error) throw error;
        return data || null;
      } catch (error) {
        if (!isAbortLikeError(error)) {
          throw error;
        }
        return await restSelectPostBySlug(postSlug);
      }
    },

    async submitComment(payload) {
      const client = await requireClient();
      const { data, error } = await client.functions.invoke("submit-blog-comment", {
        body: payload,
      });
      if (error) throw error;
      if (data && data.error) throw new Error(data.error);
      return data;
    },

    async listApprovedComments(postSlug, params) {
      const client = await requireClient();
      const page = Math.max(1, Number((params && params.page) || 1));
      const pageSize = Math.min(50, Math.max(1, Number((params && params.pageSize) || 20)));
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let postId = null;
      if (postSlug) {
        const post = await ns.blogApi.getPostBySlug(postSlug);
        if (!post) {
          return [];
        }
        postId = post.id;
      }

      let query = client
        .from("blog_comments")
        .select("id, author_name, author_avatar_url, author_user_id, message, status, created_at, post_id")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (postId) {
        query = query.eq("post_id", postId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async deleteComment(commentId) {
      const client = await requireClient();
      const { error } = await client
        .from("blog_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
      return true;
    },
  };
})(window);
