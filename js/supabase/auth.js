(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});

  async function requireClient() {
    const client = ns.getSupabaseClient && ns.getSupabaseClient();
    if (!client) {
      throw new Error("Supabase client is not configured");
    }
    return client;
  }

  ns.authApi = {
    async signUp(email, password, fullName) {
      const client = await requireClient();
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || null,
          },
        },
      });
      if (error) throw error;
      return data;
    },

    async signIn(email, password) {
      const client = await requireClient();
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },

    async signOut() {
      const client = await requireClient();
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },

    async getSession() {
      const client = await requireClient();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session;
    },

    async getUser() {
      const client = await requireClient();
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      return data.user;
    },

    async onAuthStateChange(callback) {
      const client = await requireClient();
      return client.auth.onAuthStateChange(callback);
    },
  };
})(window);
