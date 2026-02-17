(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});

  async function requireClient() {
    const client = ns.getSupabaseClient && ns.getSupabaseClient();
    if (!client) {
      throw new Error("Supabase client is not configured");
    }
    return client;
  }

  ns.subscriptionApi = {
    async subscribe(payload) {
      const client = await requireClient();
      const { data, error } = await client.functions.invoke("subscribe-buyer-updates", {
        body: payload,
      });
      if (error) throw error;
      if (data && data.error) throw new Error(data.error);
      return data;
    },

    async unsubscribe(email) {
      const client = await requireClient();
      const { error } = await client
        .from("newsletter_subscriptions")
        .update({
          status: "unsubscribed",
          unsubscribed_at: new Date().toISOString(),
        })
        .eq("email", email);
      if (error) throw error;
      return true;
    },
  };
})(window);
