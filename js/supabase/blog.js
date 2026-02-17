(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});

  async function requireClient() {
    const client = ns.getSupabaseClient && ns.getSupabaseClient();
    if (!client) {
      throw new Error("Supabase client is not configured");
    }
    return client;
  }

  ns.blogApi = {
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

      const { data, error } = await client
        .from("blog_comments")
        .select("id, author_name, message, created_at, post_id")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (!postSlug) {
        return data || [];
      }

      const { data: post, error: postError } = await client
        .from("blog_posts")
        .select("id")
        .eq("slug", postSlug)
        .single();
      if (postError) throw postError;

      return (data || []).filter(function (item) {
        return item.post_id === post.id;
      });
    },
  };
})(window);
