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

  async function submitContactInquiry(button) {
    const root = button.closest("#contact_page");
    if (!root) return false;

    const payload = {
      sourceChannel: "contact_page",
      companyName: valueByPlaceholder(root, "Company Name"),
      phoneWhatsApp: valueByPlaceholder(root, "Phone / WhatsApp"),
      workEmail: valueByPlaceholder(root, "Work Email"),
      requiredVolumeMt: valueByPlaceholder(root, "Required Volume (MT)"),
      message: valueByPlaceholder(root, "Destination port, cocoa variety, quality specs, and preferred Incoterm."),
      inquiryTopic: "Export Inquiry Form",
    };

    setBusy(button, true, "Submitting...");
    try {
      await ns.inquiryApi.submitInquiry(payload);
      ns.notify("Inquiry submitted. Our export desk will contact you shortly.");
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

    const payload = {
      sourceChannel: "product_page",
      productSlug: getProductSlugFromPath(),
      companyName: valueByPlaceholder(root, "Company Name*"),
      workEmail: valueByPlaceholder(root, "Work Email*"),
      countryRegion: valueByPlaceholder(root, "Country / Region"),
      message: valueByPlaceholder(root, root.querySelector("textarea") ? root.querySelector("textarea").getAttribute("placeholder") || "" : ""),
      inquiryTopic: "Product Inquiry",
    };

    setBusy(button, true, "Submitting...");
    try {
      await ns.inquiryApi.submitInquiry(payload);
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

  async function submitIndexInquiry(button) {
    const root = button.closest("#consultation");
    if (!root) return false;

    const topic = findInputAfterLabel(root, "Inquiry Topic");
    const name = findInputAfterLabel(root, "Your Name");
    const email = findInputAfterLabel(root, "Your Email");

    const payload = {
      sourceChannel: "index_inquiry",
      inquiryTopic: topic,
      contactName: name,
      companyName: name || "Website Buyer",
      workEmail: email,
      message: topic ? `Inquiry Topic: ${topic}` : "General inquiry from homepage",
    };

    setBusy(button, true, "Submitting...");
    try {
      await ns.inquiryApi.submitInquiry(payload);
      ns.notify("Inquiry submitted. We will respond by email.");
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
    return ["SUBMIT INQUIRY", "SUBMIT", "SEND MESSAGE", "SUBSCRIBE"].some(function (token) {
      return label.indexOf(token) >= 0;
    });
  }

  function onClick(event) {
    const button = event.target.closest("a.button_1, a.button_2");
    if (!button) return;

    const label = textFrom(button).toUpperCase();
    if (!shouldHandle(label)) return;

    if (!ns.hasSupabaseConfig || !ns.hasSupabaseConfig()) {
      return;
    }
    if (!ns.inquiryApi || !ns.subscriptionApi || !ns.blogApi || !ns.notify || !ns.normalizeError) {
      return;
    }

    event.preventDefault();

    if (label.indexOf("SUBMIT INQUIRY") >= 0) {
      if (button.closest("#contact_page")) {
        void submitContactInquiry(button);
        return;
      }
      if (button.closest(".comment_1")) {
        void submitProductInquiry(button);
        return;
      }
    }

    if (label === "SUBMIT" && button.closest("#consultation")) {
      void submitIndexInquiry(button);
      return;
    }

    if (label.indexOf("SEND MESSAGE") >= 0) {
      void submitBlogComment(button);
      return;
    }

    if (label.indexOf("SUBSCRIBE") >= 0) {
      void submitSubscription(button);
    }
  }

  function onFormSubmit(event) {
    const form = event.target && event.target.closest ? event.target.closest("form.mc-newsletter-form") : null;
    if (!form) return;

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
