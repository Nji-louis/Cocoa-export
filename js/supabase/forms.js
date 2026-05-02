(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});

  function textFrom(el) {
    return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim();
  }

  function valueByPlaceholder(container, placeholderText) {
    const inputs = container.querySelectorAll("input, textarea");
    for (const field of inputs) {
      if ((field.getAttribute("placeholder") || "").trim().toLowerCase() === placeholderText.toLowerCase()) {
        return (field.value || "").trim();
      }
    }
    return "";
  }

  function findInputAfterLabel(container, labelText) {
    const paragraphs = container.querySelectorAll("p");
    for (const p of paragraphs) {
      if (textFrom(p).toLowerCase() === labelText.toLowerCase()) {
        const wrap = p.parentElement;
        if (!wrap) return "";
        const input = wrap.querySelector("input, textarea, select");
        if (!input) return "";
        return (input.value || "").trim();
      }
    }
    return "";
  }

  function getProductSlugFromPath() {
    const fileName = (location.pathname.split("/").pop() || "").toLowerCase();
    if (!fileName.startsWith("product_")) return null;
    const raw = fileName.replace("product_", "").replace(".html", "");
    if (raw && raw !== "detail") return raw;
    if (!raw || raw !== "detail") return null;

    try {
      const params = new URLSearchParams(location.search);
      const variety = (params.get("variety") || "").toLowerCase().trim();
      const supported = ["amelonado", "bresilien", "cundeamor", "forastero", "criollo", "trinitario"];
      return supported.indexOf(variety) >= 0 ? variety : null;
    } catch (error) {
      return null;
    }
  }

  function getBlogSlugFromContext(root) {
    if (root && root.dataset && root.dataset.postSlug) {
      return root.dataset.postSlug.trim();
    }

    const hiddenField = document.getElementById("blog-detail-post-slug");
    if (hiddenField && hiddenField.value) {
      return hiddenField.value.trim();
    }

    try {
      const params = new URLSearchParams(location.search);
      const querySlug = (params.get("slug") || "").trim();
      if (querySlug) {
        return querySlug;
      }
    } catch (error) {
      // Ignore URL parsing errors and continue with fallback.
    }

    return "cameroon-mid-crop-update";
  }

  function setBusy(button, busy, busyLabel) {
    if (!button) return;
    if (busy) {
      button.dataset.prevLabel = button.innerHTML;
      button.innerHTML = busyLabel || "Submitting...";
      button.style.pointerEvents = "none";
      button.style.opacity = "0.6";
      return;
    }
    if (button.dataset.prevLabel) {
      button.innerHTML = button.dataset.prevLabel;
    }
    button.style.pointerEvents = "";
    button.style.opacity = "";
  }

  function setFormSubmitBusy(form, busy, busyLabel) {
    if (!form) return;
    const submitButton = form.querySelector("button[type='submit'], .mc-submit");
    if (!submitButton) return;

    if (busy) {
      submitButton.dataset.prevLabel = submitButton.innerHTML;
      submitButton.innerHTML = busyLabel || "Submitting...";
      submitButton.disabled = true;
      submitButton.style.pointerEvents = "none";
      submitButton.style.opacity = "0.6";
      return;
    }

    if (submitButton.dataset.prevLabel) {
      submitButton.innerHTML = submitButton.dataset.prevLabel;
    }
    submitButton.disabled = false;
    submitButton.style.pointerEvents = "";
    submitButton.style.opacity = "";
  }

  function setInlineFeedback(node, message, isError) {
    if (!node) return;
    node.textContent = message || "";
    node.classList.toggle("is-error", Boolean(isError));
  }

  function valueBySelector(root, selector) {
    const field = root ? root.querySelector(selector) : null;
    return field && field.value ? field.value.trim() : "";
  }

  function isValidEmailAddress(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function clearFieldValues(fields) {
    (fields || []).forEach(function (field) {
      if (field) field.value = "";
    });
  }

  function parsePositiveNumber(value) {
    const normalized = String(value || "").replace(/,/g, "").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  function hasInquirySupport() {
    return Boolean(
      ns.hasSupabaseConfig &&
      ns.hasSupabaseConfig() &&
      ns.inquiryApi &&
      typeof ns.inquiryApi.submitInquiry === "function"
    );
  }

  async function submitContactInquiry(button) {
    const root = button.closest(".blog_d_page_li3") || button.closest("#contact_page");
    if (!root) return false;

    const companyField = root.querySelector('input[placeholder="Company Name"]');
    const phoneField = root.querySelector('input[placeholder="Phone / WhatsApp"]');
    const emailField = root.querySelector('input[placeholder="Work Email"]');
    const volumeField = root.querySelector('input[placeholder="Required Volume (MT)"]');
    const messageField = root.querySelector('textarea');

    const companyName = companyField && companyField.value ? companyField.value.trim() : "";
    const workEmail = emailField && emailField.value ? emailField.value.trim() : "";
    const quantity = volumeField && volumeField.value ? volumeField.value.trim() : "";
    const message = messageField && messageField.value ? messageField.value.trim() : "";

    if (!companyName || !workEmail || !message) {
      ns.notify("Please complete company name, email, and inquiry details before submitting.", true);
      return true;
    }

    if (!isValidEmailAddress(workEmail)) {
      ns.notify("Please enter a valid email address.", true);
      return true;
    }

    setBusy(button, true, "Submitting...");
    try {
      await ns.inquiryApi.submitInquiry({
        companyName: companyName,
        workEmail: workEmail,
        phoneWhatsApp: phoneField && phoneField.value ? phoneField.value.trim() : "",
        requiredVolumeMt: parsePositiveNumber(quantity),
        message: quantity ? message + "\n\nRequired Volume: " + quantity : message,
        sourceChannel: "contact_export_inquiry_form",
      });
      clearFieldValues([companyField, phoneField, emailField, volumeField, messageField]);
      ns.notify("Export inquiry submitted successfully.");
      return true;
    } catch (error) {
      const message = ns.resolveErrorMessage
        ? await ns.resolveErrorMessage(error, "Failed to submit inquiry")
        : ns.normalizeError(error, "Failed to submit inquiry");
      ns.notify(message, true);
      return true;
    } finally {
      setBusy(button, false);
    }
  }

  async function submitProductInquiry(button) {
    const root = button.closest(".comment_1");
    if (!root) return false;

    const messageField = root.querySelector("#product-inquiry-message");
    const companyField = root.querySelector("#product-inquiry-company");
    const emailField = root.querySelector("#product-inquiry-email");
    const countryField = root.querySelector("#product-inquiry-country");

    const companyName = companyField && companyField.value ? companyField.value.trim() : "";
    const workEmail = emailField && emailField.value ? emailField.value.trim() : "";
    const message = messageField && messageField.value ? messageField.value.trim() : "";
    const country = countryField && countryField.value ? countryField.value.trim() : "";

    if (!companyName || !workEmail || !message) {
      ns.notify("Please complete company name, email, and product requirements before submitting.", true);
      return true;
    }

    if (!isValidEmailAddress(workEmail)) {
      ns.notify("Please enter a valid email address.", true);
      return true;
    }

    setBusy(button, true, "Submitting...");
    try {
      await ns.inquiryApi.submitInquiry({
        companyName: companyName,
        workEmail: workEmail,
        countryRegion: country,
        inquiryTopic: "Product Inquiry",
        productSlug: getProductSlugFromPath() || undefined,
        message: message,
        sourceChannel: "product_inquiry_form",
      });
      clearFieldValues([messageField, companyField, emailField, countryField]);
      ns.notify("Product inquiry submitted successfully.");
      return true;
    } catch (error) {
      const message = ns.resolveErrorMessage
        ? await ns.resolveErrorMessage(error, "Failed to submit product inquiry")
        : ns.normalizeError(error, "Failed to submit product inquiry");
      ns.notify(message, true);
      return true;
    } finally {
      setBusy(button, false);
    }
  }

  async function submitIndexInquiry(target) {
    const root = target && target.closest ? target.closest("#consultation") : null;
    if (!root) return false;

    const form = target && target.tagName === "FORM"
      ? target
      : root.querySelector("#home-export-inquiry-form");
    const feedback = root.querySelector("#export-inquiry-feedback");
    const topic = valueBySelector(root, "#export-inquiry-topic") || findInputAfterLabel(root, "Inquiry Topic");
    const name = valueBySelector(root, "#export-inquiry-name") || findInputAfterLabel(root, "Your Name");
    const email = valueBySelector(root, "#export-inquiry-email") || findInputAfterLabel(root, "Your Email");
    const message = valueBySelector(root, "#export-inquiry-message");
    const resolvedMessage = message || (topic ? "Inquiry Topic: " + topic : "General export inquiry from homepage");

    if (!topic || !name || !email) {
      setInlineFeedback(feedback, "Please select a topic and complete your name and email.", true);
      return true;
    }

    if (!isValidEmailAddress(email)) {
      setInlineFeedback(feedback, "Please enter a valid email address.", true);
      return true;
    }

    if (form) {
      setFormSubmitBusy(form, true, "Submitting...");
    } else {
      setBusy(target, true, "Submitting...");
    }
    setInlineFeedback(feedback, "Submitting your inquiry...", false);

    try {
      await ns.inquiryApi.submitInquiry({
        contactName: name,
        workEmail: email,
        inquiryTopic: topic,
        message: resolvedMessage,
        sourceChannel: "home_export_inquiry_form",
      });
      if (form) {
        form.reset();
      }
      setInlineFeedback(feedback, "Inquiry submitted successfully.", false);
      ns.notify("Inquiry submitted successfully.");
      return true;
    } catch (error) {
      const errorMessage = ns.resolveErrorMessage
        ? await ns.resolveErrorMessage(error, "Failed to submit inquiry")
        : ns.normalizeError(error, "Failed to submit inquiry");
      setInlineFeedback(feedback, errorMessage, true);
      ns.notify(errorMessage, true);
      return true;
    } finally {
      if (form) {
        setFormSubmitBusy(form, false);
      } else {
        setBusy(target, false);
      }
    }
  }

  async function submitBlogComment(button) {
    const root = button.closest(".blog_d_page_li3");
    if (!root) return false;
    if (button.dataset.submitting === "1") return true;

    const authorName = valueByPlaceholder(root, "Name");
    const authorEmail = valueByPlaceholder(root, "Email");
    const message = valueByPlaceholder(root, "Message");

    if (!authorName || !authorEmail || !message) {
      ns.notify("Please complete Name, Email, and Message before submitting.", true);
      return true;
    }

    const payload = {
      sourceChannel: "blog_detail",
      postSlug: getBlogSlugFromContext(root),
      authorName: authorName,
      authorEmail: authorEmail,
      message: message,
    };

    button.dataset.submitting = "1";
    setBusy(button, true, "Sending...");
    try {
      const response = await ns.blogApi.submitComment(payload);

      const nameField = root.querySelector('input[placeholder="Name"]');
      const emailField = root.querySelector('input[placeholder="Email"]');
      const messageField = root.querySelector('textarea[placeholder="Message"]');
      if (nameField) nameField.value = "";
      if (emailField) emailField.value = "";
      if (messageField) messageField.value = "";

      if (response && response.status === "approved" && ns.blogPages && typeof ns.blogPages.refreshDetailComments === "function") {
        await ns.blogPages.refreshDetailComments(payload.postSlug);
        ns.notify("Comment posted successfully.");
      } else {
        if (ns.blogPages && typeof ns.blogPages.prependPendingComment === "function") {
          ns.blogPages.prependPendingComment({
            id: response && response.commentId ? response.commentId : null,
            author_name: payload.authorName,
            author_avatar_url: response && response.authorAvatarUrl
              ? response.authorAvatarUrl
              : ((ns.authState && ns.authState.user && ns.authState.user.user_metadata
                && (ns.authState.user.user_metadata.avatar_url || ns.authState.user.user_metadata.picture)) || null),
            author_user_id: (ns.authState && ns.authState.user && ns.authState.user.id)
              ? ns.authState.user.id
              : null,
            message: payload.message,
            created_at: response && response.createdAt ? response.createdAt : new Date().toISOString(),
            status: response && response.status ? response.status : "pending",
          });
        }
        ns.notify("Comment submitted and shown live (pending moderation).");
      }
      return true;
    } catch (error) {
      const message = ns.resolveErrorMessage
        ? await ns.resolveErrorMessage(error, "Failed to submit comment")
        : ns.normalizeError(error, "Failed to submit comment");
      ns.notify(message, true);
      return true;
    } finally {
      setBusy(button, false);
      button.dataset.submitting = "0";
    }
  }

  async function submitSubscription(button) {
    const root = button.closest(".footer_2i1, .contact_page_2i");
    if (!root) return false;

    let email = valueByPlaceholder(root, "Email") || valueByPlaceholder(root, "Your email");
    const fullName = valueByPlaceholder(root, "Your name");

    if (!email) {
      const anyInput = root.querySelector("input[type='text'], input[type='email']");
      email = anyInput ? (anyInput.value || "").trim() : "";
    }

    const payload = {
      fullName,
      email,
      sourceChannel: button.closest("#contact_page") ? "contact_page_subscription" : "footer_subscription",
    };

    setBusy(button, true, "Subscribing...");
    try {
      await ns.subscriptionApi.subscribe(payload);
      ns.notify("Subscription updated successfully.");
      return true;
    } catch (error) {
      const message = ns.resolveErrorMessage
        ? await ns.resolveErrorMessage(error, "Failed to subscribe")
        : ns.normalizeError(error, "Failed to subscribe");
      ns.notify(message, true);
      return true;
    } finally {
      setBusy(button, false);
    }
  }

  function inferNewsletterSourceChannel() {
    const page = (location.pathname.split("/").pop() || "unknown").replace(".html", "").toLowerCase();
    return "newsletter_" + (page || "unknown");
  }

  async function submitNewsletterForm(form) {
    const emailField = form.querySelector("input[name='EMAIL'], input[type='email']");
    const firstNameField = form.querySelector("input[name='FNAME']");

    const payload = {
      fullName: firstNameField ? (firstNameField.value || "").trim() : "",
      email: emailField ? (emailField.value || "").trim() : "",
      sourceChannel: inferNewsletterSourceChannel(),
    };

    setFormSubmitBusy(form, true, "Subscribing...");
    try {
      await ns.subscriptionApi.subscribe(payload);
      ns.notify("Subscription updated successfully.");
      form.reset();
    } catch (error) {
      const message = ns.resolveErrorMessage
        ? await ns.resolveErrorMessage(error, "Failed to subscribe")
        : ns.normalizeError(error, "Failed to subscribe");
      ns.notify(message, true);
    } finally {
      setFormSubmitBusy(form, false);
    }
  }

  function shouldHandle(label) {
    return ["SUBMIT INQUIRY", "SUBMIT", "SEND MESSAGE", "SEND COMMENT", "SUBSCRIBE"].some(function (token) {
      return label.indexOf(token) >= 0;
    });
  }

  function onClick(event) {
    const button = event.target.closest("a.button_1, a.button_2, button.button_1, button.button_2");
    if (!button) return;

    const label = textFrom(button).toUpperCase();
    if (!shouldHandle(label)) return;

    if (label.indexOf("SUBMIT INQUIRY") >= 0) {
      if (!hasInquirySupport() || !ns.notify || !ns.normalizeError) {
        return;
      }

      event.preventDefault();

      if (button.closest("#contact_page")) {
        void submitContactInquiry(button);
        return;
      }
      if (button.closest(".comment_1")) {
        void submitProductInquiry(button);
        return;
      }
      if (button.closest("#consultation")) {
        void submitIndexInquiry(button);
        return;
      }
      return;
    }

    if (label === "SUBMIT" && button.closest("#consultation")) {
      if (!hasInquirySupport() || !ns.notify || !ns.normalizeError) {
        return;
      }
      event.preventDefault();
      void submitIndexInquiry(button);
      return;
    }

    if (label.indexOf("SEND MESSAGE") >= 0 || label.indexOf("SEND COMMENT") >= 0) {
      if (!ns.hasSupabaseConfig || !ns.hasSupabaseConfig()) {
        return;
      }
      if (!ns.blogApi || !ns.notify || !ns.normalizeError) {
        return;
      }
      event.preventDefault();
      void submitBlogComment(button);
      return;
    }

    if (label.indexOf("SUBSCRIBE") >= 0) {
      if (!ns.hasSupabaseConfig || !ns.hasSupabaseConfig()) {
        return;
      }
      if (!ns.subscriptionApi || !ns.notify || !ns.normalizeError) {
        return;
      }
      event.preventDefault();
      void submitSubscription(button);
    }
  }

  function onFormSubmit(event) {
    const form = event.target && event.target.closest ? event.target.closest("form") : null;
    if (!form) return;

    if (form.matches("#home-export-inquiry-form")) {
      if (!hasInquirySupport() || !ns.notify || !ns.normalizeError) {
        return;
      }

      event.preventDefault();
      void submitIndexInquiry(form);
      return;
    }

    if (!form.matches("form.mc-newsletter-form")) {
      return;
    }

    if (!ns.hasSupabaseConfig || !ns.hasSupabaseConfig()) {
      return;
    }
    if (!ns.subscriptionApi || !ns.notify || !ns.normalizeError) {
      return;
    }

    event.preventDefault();
    void submitNewsletterForm(form);
  }

  function onKeyDown(event) {
    if (event.key !== "Enter") return;
    if (!event.target || !event.target.closest) return;

    const commentRoot = event.target.closest(".blog_d_page_li3");
    if (!commentRoot) return;
    if (!commentRoot.querySelector('input[placeholder="Name"]') || !commentRoot.querySelector('input[placeholder="Email"]') || !commentRoot.querySelector('textarea[placeholder="Message"]')) {
      return;
    }

    if (!ns.hasSupabaseConfig || !ns.hasSupabaseConfig()) {
      return;
    }
    if (!ns.blogApi || !ns.notify || !ns.normalizeError) {
      return;
    }

    const isTextArea = event.target.tagName === "TEXTAREA";
    if (isTextArea && !(event.ctrlKey || event.metaKey)) {
      return;
    }

    const isInput = event.target.tagName === "INPUT";
    if (!isInput && !isTextArea) {
      return;
    }

    const submitButton = commentRoot.querySelector("a.button_1");
    if (!submitButton) return;

    event.preventDefault();
    void submitBlogComment(submitButton);
  }

  document.addEventListener("click", onClick, false);
  document.addEventListener("submit", onFormSubmit, false);
  document.addEventListener("keydown", onKeyDown, false);
})(window);
