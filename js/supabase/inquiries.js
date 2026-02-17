(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});

  async function requireClient() {
    const client = ns.getSupabaseClient && ns.getSupabaseClient();
    if (!client) {
      throw new Error("Supabase client is not configured");
    }
    return client;
  }

  ns.inquiryApi = {
    async submitInquiry(payload) {
      const client = await requireClient();
      const { data, error } = await client.functions.invoke("submit-inquiry", {
        body: payload,
      });
      if (error) throw error;
      if (data && data.error) throw new Error(data.error);
      return data;
    },

    async listMyInquiries(params) {
      const client = await requireClient();
      const page = Math.max(1, Number((params && params.page) || 1));
      const pageSize = Math.min(50, Math.max(1, Number((params && params.pageSize) || 20)));
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await client
        .from("inquiry_requests")
        .select("id, request_number, status, company_name, work_email, created_at, updated_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return {
        items: data || [],
        page,
        pageSize,
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
  };
})(window);
