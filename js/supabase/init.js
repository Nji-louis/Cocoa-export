(function (global) {
  const ns = global.AppBackend || {};
  if (!ns.hasSupabaseConfig || !ns.hasSupabaseConfig()) {
    console.warn("Supabase is not configured. Copy js/supabase/config.example.js to js/supabase/config.js and set project values.");
    return;
  }

  console.info("Supabase frontend integration initialized");
})(window);
