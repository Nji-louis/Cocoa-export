(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});

  async function requireClient() {
    const client = ns.getSupabaseClient && ns.getSupabaseClient();
    if (!client) {
      throw new Error("Supabase client is not configured");
    }
    return client;
  }

  function getConfig() {
    return global.__SUPABASE_CONFIG__ || null;
  }

  async function getAccessToken(client) {
    try {
      const sessionResult = await client.auth.getSession();
      if (sessionResult && sessionResult.data && sessionResult.data.session && sessionResult.data.session.access_token) {
        return sessionResult.data.session.access_token;
      }
    } catch (error) {
      // Anonymous subscriptions are allowed; token is optional.
    }
    return "";
  }

  async function invokeSubscribeWithFetch(client, payload) {
    const config = getConfig();
    if (!config || !config.url || !config.anonKey) {
      throw new Error("Supabase client is not configured");
    }

    const token = await getAccessToken(client);
    const headers = {
      "Content-Type": "application/json",
      apikey: config.anonKey,
    };

    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    const controller = new AbortController();
    const timeout = global.setTimeout(function () {
      controller.abort();
    }, 15000);

    let response;
    try {
      response = await fetch(config.url + "/functions/v1/subscribe-buyer-updates", {
        method: "POST",
        headers,
        body: JSON.stringify(payload || {}),
        signal: controller.signal,
      });
    } finally {
      global.clearTimeout(timeout);
    }

    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    if (!response.ok) {
      const message = data && (data.error || data.message)
        ? String(data.error || data.message)
        : "Failed to subscribe (" + response.status + ")";
      throw new Error(message);
    }

    if (data && data.error) {
      throw new Error(String(data.error));
    }

    return data;
  }

  ns.subscriptionApi = {
    async subscribe(payload) {
      const client = await requireClient();
      return invokeSubscribeWithFetch(client, payload);
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
