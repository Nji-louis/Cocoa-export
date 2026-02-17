(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});

  function getConfig() {
    return global.__SUPABASE_CONFIG__ || null;
  }

  function createClient() {
    const config = getConfig();
    if (!config || !config.url || !config.anonKey || !global.supabase) {
      return null;
    }
    return global.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          "x-client-info": "seller-frontend",
        },
      },
    });
  }

  let client = createClient();

  ns.getSupabaseClient = function getSupabaseClient() {
    if (!client) {
      client = createClient();
    }
    return client;
  };

  ns.hasSupabaseConfig = function hasSupabaseConfig() {
    return Boolean(getConfig() && getConfig().url && getConfig().anonKey && global.supabase);
  };
})(window);
