(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});
  const SECTION_MARKERS = ["/admin/", "/buyer-portal/"];
  const DEFAULT_ROUTES = {
    index: "/index.html",
    login: "/login.html",
    buyer: "/buyer-portal/dashboard.html",
    admin: "/admin/dashboard.html",
  };

  function getConfig() {
    return global.__SUPABASE_CONFIG__ || null;
  }

  function trimTrailingSlash(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  function isLocalHostname(hostname) {
    const normalized = String(hostname || "").toLowerCase();
    return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "[::1]";
  }

  function getAppBasePathFromPathname(pathname) {
    const normalized = String(pathname || "/");

    for (let index = 0; index < SECTION_MARKERS.length; index += 1) {
      const marker = SECTION_MARKERS[index];
      const markerIndex = normalized.indexOf(marker);
      if (markerIndex >= 0) {
        return normalized.slice(0, markerIndex);
      }
    }

    if (!normalized || normalized === "/") {
      return "";
    }

    if (normalized.endsWith("/")) {
      return normalized.slice(0, -1);
    }

    const lastSlash = normalized.lastIndexOf("/");
    return lastSlash > 0 ? normalized.slice(0, lastSlash) : "";
  }

  function normalizeUrl(value) {
    if (!value) return null;
    try {
      return new URL(String(value)).toString();
    } catch (error) {
      return null;
    }
  }

  function getConfiguredSiteUrl() {
    const config = getConfig();
    if (!config) return null;

    const candidate = normalizeUrl(config.siteUrl || config.publicSiteUrl || config.appUrl || "");
    return candidate ? trimTrailingSlash(candidate) : null;
  }

  function getCanonicalSiteUrl() {
    if (!global.document || typeof global.document.querySelector !== "function") {
      return null;
    }

    const canonicalNode = global.document.querySelector('link[rel="canonical"]');
    const href = canonicalNode ? canonicalNode.getAttribute("href") : "";
    const canonicalUrl = normalizeUrl(href);
    if (!canonicalUrl) {
      return null;
    }

    try {
      const url = new URL(canonicalUrl);
      const currentPath = global.location && typeof global.location.pathname === "string"
        ? global.location.pathname
        : "";

      let basePath = getAppBasePathFromPathname(url.pathname);
      if (currentPath && url.pathname.endsWith(currentPath)) {
        basePath = url.pathname.slice(0, -currentPath.length);
      }

      return trimTrailingSlash(url.origin + (basePath || ""));
    } catch (error) {
      return null;
    }
  }

  function getRuntimeSiteUrl(options) {
    if (!global.location) return null;

    const protocol = String(global.location.protocol || "").toLowerCase();
    const hostname = String(global.location.hostname || "").toLowerCase();
    const allowLocal = Boolean(options && options.allowLocal);

    if (protocol === "file:") {
      return null;
    }

    if (!allowLocal && isLocalHostname(hostname)) {
      return null;
    }

    const basePath = getAppBasePathFromPathname(global.location.pathname);
    return trimTrailingSlash(global.location.origin + (basePath || ""));
  }

  function resolveSiteUrl(options) {
    const preferRuntime = Boolean(options && options.preferRuntime);
    const allowLocal = Boolean(options && options.allowLocal);
    const configured = getConfiguredSiteUrl();
    const canonical = getCanonicalSiteUrl();
    const runtime = getRuntimeSiteUrl({ allowLocal: allowLocal });

    if (preferRuntime) {
      return runtime || configured || canonical || null;
    }

    return configured || canonical || runtime || null;
  }

  function normalizeAppPath(path) {
    if (!path) return "/";
    if (/^https?:\/\//i.test(String(path))) {
      return String(path);
    }
    return "/" + String(path).replace(/^\/+/, "");
  }

  function resolveAppUrl(path, options) {
    const normalizedPath = normalizeAppPath(path);
    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizeUrl(normalizedPath);
    }

    const siteUrl = resolveSiteUrl({
      preferRuntime: Boolean(options && options.preferRuntime),
      allowLocal: Boolean(options && options.allowLocal),
    }) || getRuntimeSiteUrl({ allowLocal: true });

    if (!siteUrl) {
      return null;
    }

    try {
      return new URL(normalizedPath.replace(/^\//, ""), siteUrl + "/").toString();
    } catch (error) {
      return null;
    }
  }

  function resolveNavigationUrl(path) {
    return resolveAppUrl(path, {
      allowLocal: true,
      preferRuntime: true,
    }) || normalizeAppPath(path);
  }

  function resolveEmailRedirectUrl(path) {
    return resolveAppUrl(path, {
      allowLocal: false,
      preferRuntime: false,
    });
  }

  function toRelativeAppHref(urlValue) {
    if (!urlValue) return null;
    try {
      const url = new URL(String(urlValue), global.location ? global.location.origin : "https://example.com");
      if (global.location && url.origin === global.location.origin) {
        return url.pathname + url.search + url.hash;
      }
      return url.toString();
    } catch (error) {
      return null;
    }
  }

  function sanitizeRedirectTarget(target) {
    if (!target) return null;

    const siteUrl = resolveSiteUrl({
      allowLocal: true,
      preferRuntime: true,
    }) || getRuntimeSiteUrl({ allowLocal: true });

    if (!siteUrl) {
      return null;
    }

    try {
      const site = new URL(siteUrl + "/");
      const rawTarget = String(target).trim();
      let resolved;

      if (/^https?:\/\//i.test(rawTarget)) {
        resolved = new URL(rawTarget);
      } else if (rawTarget.startsWith("/")) {
        const siteBasePath = trimTrailingSlash(site.pathname || "");
        if (siteBasePath && (rawTarget === siteBasePath || rawTarget.indexOf(siteBasePath + "/") === 0)) {
          resolved = new URL(rawTarget, site.origin);
        } else {
          resolved = new URL(rawTarget.replace(/^\/+/, ""), siteUrl + "/");
        }
      } else {
        resolved = new URL(rawTarget, siteUrl + "/");
      }

      const allowedOrigins = new Set();
      allowedOrigins.add(new URL(siteUrl).origin);
      if (global.location && global.location.origin) {
        allowedOrigins.add(global.location.origin);
      }

      if (!allowedOrigins.has(resolved.origin)) {
        return null;
      }

      return resolved.toString();
    } catch (error) {
      return null;
    }
  }

  function getRoleHomeUrl(roles) {
    const normalizedRoles = Array.isArray(roles) ? roles.map(function (role) {
      return String(role).toLowerCase();
    }) : [];

    if (normalizedRoles.indexOf("admin") >= 0 || normalizedRoles.indexOf("staff") >= 0) {
      return resolveNavigationUrl(DEFAULT_ROUTES.admin);
    }

    return resolveNavigationUrl(DEFAULT_ROUTES.buyer);
  }

  function validateSupabaseConfig() {
    const config = getConfig();
    const warnings = [];

    if (!config || !config.url || !config.anonKey) {
      warnings.push("Supabase URL or anon key is missing.");
    }

    if (!getConfiguredSiteUrl()) {
      warnings.push("Supabase public site URL is not configured. Set `siteUrl` in js/supabase/config.min.js for reliable email redirects.");
    }

    if (global.location) {
      const protocol = String(global.location.protocol || "").toLowerCase();
      const hostname = String(global.location.hostname || "").toLowerCase();
      if (protocol === "http:" && !isLocalHostname(hostname)) {
        warnings.push("The app is running over HTTP on a non-local host. Email auth callbacks should use HTTPS in production.");
      }
    }

    return {
      ok: warnings.length === 0,
      warnings: warnings,
    };
  }

  function createClient() {
    if (ns.__supabaseClient) {
      return ns.__supabaseClient;
    }

    const config = getConfig();
    if (!config || !config.url || !config.anonKey || !global.supabase) {
      return null;
    }

    ns.__supabaseClient = global.supabase.createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          "x-client-info": "seller-frontend",
        },
      },
    });

    return ns.__supabaseClient;
  }

  let client = ns.__supabaseClient || createClient();

  ns.getSupabaseConfig = getConfig;
  ns.resolveSiteUrl = resolveSiteUrl;
  ns.resolveAppUrl = resolveAppUrl;
  ns.resolveNavigationUrl = resolveNavigationUrl;
  ns.resolveEmailRedirectUrl = resolveEmailRedirectUrl;
  ns.sanitizeRedirectTarget = sanitizeRedirectTarget;
  ns.toRelativeAppHref = toRelativeAppHref;
  ns.getRoleHomeUrl = getRoleHomeUrl;
  ns.validateSupabaseConfig = validateSupabaseConfig;
  ns.getAppRoute = function getAppRoute(routeName) {
    return resolveNavigationUrl(DEFAULT_ROUTES[routeName] || DEFAULT_ROUTES.index);
  };
  ns.isLocalOrigin = function isLocalOrigin() {
    return Boolean(global.location && isLocalHostname(global.location.hostname));
  };

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
