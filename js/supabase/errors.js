(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});

  ns.normalizeError = function normalizeError(error, fallbackMessage) {
    if (!error) {
      return fallbackMessage || "Unexpected error";
    }

    if (typeof error === "string") {
      return error;
    }

    if (error.message) {
      return error.message;
    }

    if (error.error && typeof error.error === "string") {
      return error.error;
    }

    return fallbackMessage || "Unexpected error";
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
})(window);
