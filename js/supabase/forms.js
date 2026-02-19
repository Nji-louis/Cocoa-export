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
    if (!raw || raw === "detail") return null;
    return raw;
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

    const payload = {
      sourceChannel: "blog_detail",
      postSlug: "cameroon-mid-crop-update",
      authorName: valueByPlaceholder(root, "Name"),
      authorEmail: valueByPlaceholder(root, "Email"),
      message: valueByPlaceholder(root, "Message"),
    };

    setBusy(button, true, "Sending...");
    try {
      await ns.blogApi.submitComment(payload);
      ns.notify("Comment submitted for moderation.");
      return true;
    } catch (error) {
      const message = ns.resolveErrorMessage
        ? await ns.resolveErrorMessage(error, "Failed to submit comment")
        : ns.normalizeError(error, "Failed to submit comment");
      ns.notify(message, true);
      return true;
    } finally {
      setBusy(button, false);
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

  document.addEventListener("click", onClick, false);
  document.addEventListener("submit", onFormSubmit, false);
})(window);
