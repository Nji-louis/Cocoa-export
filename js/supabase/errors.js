(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});

  function parseContextStatus(error) {
    if (!error || !error.context || typeof error.context.status !== "number") {
      return null;
    }
    return error.context.status;
  }

  function fallbackByStatus(status, fallbackMessage) {
    if (status === 403) {
      return "Request blocked: origin not allowed. Update ALLOWED_ORIGINS in Supabase secrets.";
    }
    if (status === 429) {
      return "Too many requests. Please wait a minute and try again.";
    }
    if (status === 405) {
      return "Method not allowed.";
    }
    if (status === 401) {
      return "Unauthorized request.";
    }
    if (status === 400) {
      return "Invalid request payload.";
    }
    return fallbackMessage || "Unexpected error";
  }

  function isAbortLike(error) {
    if (!error) {
      return false;
    }

    if (typeof error === "string") {
      const text = error.toLowerCase();
      return text.indexOf("abort") >= 0 || text.indexOf("aborted") >= 0;
    }

    if (typeof error !== "object") {
      return false;
    }

    const name = String(error.name || "").toLowerCase();
    const message = String(error.message || "").toLowerCase();
    const nested = String((error.error && error.error.message) || "").toLowerCase();
    return name === "aborterror"
      || message.indexOf("signal is aborted") >= 0
      || message.indexOf("aborted") >= 0
      || nested.indexOf("aborted") >= 0;
  }

  ns.normalizeError = function normalizeError(error, fallbackMessage) {
    if (!error) {
      return fallbackMessage || "Unexpected error";
    }

    if (typeof error === "string") {
      return error;
    }

    if (isAbortLike(error)) {
      return "Request was interrupted. Check your network and Supabase config, then try again.";
    }

    if (error.message) {
      return error.message;
    }

    if (error.error && typeof error.error === "string") {
      return error.error;
    }

    const status = parseContextStatus(error);
    if (status) {
      return fallbackByStatus(status, fallbackMessage);
    }

    return fallbackMessage || "Unexpected error";
  };

  ns.resolveErrorMessage = async function resolveErrorMessage(error, fallbackMessage) {
    if (!error) {
      return fallbackMessage || "Unexpected error";
    }

    if (typeof error === "string") {
      return error;
    }

    const context = error.context;
    if (context && typeof context === "object") {
      if (typeof context.clone === "function" && typeof context.json === "function") {
        try {
          const payload = await context.clone().json();
          if (payload && typeof payload === "object") {
            if (typeof payload.error === "string" && payload.error.trim()) {
              return payload.error.trim();
            }
            if (typeof payload.message === "string" && payload.message.trim()) {
              return payload.message.trim();
            }
          }
        } catch (ignoredJsonError) {
          // Keep fallbacks below.
        }
      }

      if (typeof context.clone === "function" && typeof context.text === "function") {
        try {
          const text = (await context.clone().text()).trim();
          if (text) {
            return text;
          }
        } catch (ignoredTextError) {
          // Keep fallbacks below.
        }
      }
    }

    return ns.normalizeError(error, fallbackMessage);
  };

  ns.notify = function notify(message, isError) {
    if (isError) {
      console.error(message);
      alert(message);
      return;
    }
    console.info(message);
    alert(message);
  };

  if (global && global.addEventListener) {
    global.addEventListener("unhandledrejection", function onUnhandledRejection(event) {
      if (!event || !isAbortLike(event.reason)) {
        return;
      }
      event.preventDefault();
      console.warn("Suppressed non-fatal AbortError from interrupted request.");
    });
  }
})(window);
