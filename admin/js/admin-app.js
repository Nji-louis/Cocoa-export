(function (global) {
  const ns = global.AppBackend || {};
  const state = {
    user: null,
    roles: [],
    primaryRole: "",
    products: [],
    categories: [],
    inquiries: [],
    buyers: [],
    contents: [],
    media: [],
    users: [],
    aiDrafts: [],
    activeAiDraftId: "",
    chart: null,
  };

  const sectionRules = {
    overview: ["super_admin", "admin", "editor", "staff"],
    products: ["super_admin", "admin"],
    inquiries: ["super_admin", "admin", "staff"],
    buyers: ["super_admin", "admin", "staff"],
    content: ["super_admin", "admin", "editor"],
    media: ["super_admin", "admin"],
    users: ["super_admin"],
    settings: ["super_admin", "admin", "editor", "staff"],
  };

  function qs(selector) {
    return document.querySelector(selector);
  }

  function qsa(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showStatus(message, isError) {
    const node = qs("#admin-app-status");
    if (node == null) return;
    node.textContent = message || "";
    node.className = isError ? "alert alert-danger" : "alert alert-info";
    node.style.display = message ? "block" : "none";
  }

  function formatDate(value) {
    if (value == null || value === "") return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  }

  function resolvePrimaryRole(roles) {
    const ordered = ["super_admin", "admin", "editor", "staff", "buyer"];
    return ordered.find(function (role) {
      return roles.indexOf(role) >= 0;
    }) || "buyer";
  }

  function canAccess(sectionName) {
    const allowed = sectionRules[sectionName] || [];
    return allowed.indexOf(state.primaryRole) >= 0;
  }

  function parseJsonInput(value) {
    const raw = String(value || "").trim();
    if (raw === "") return {};
    return JSON.parse(raw);
  }

  function splitCsv(value) {
    return String(value || "")
      .split(",")
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
  }

  function sanitizeDraftHtml(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    template.content.querySelectorAll("script, style, iframe, object, embed, link, meta").forEach(function (node) {
      node.remove();
    });
    template.content.querySelectorAll("*").forEach(function (node) {
      Array.from(node.attributes || []).forEach(function (attribute) {
        const name = attribute.name.toLowerCase();
        const rawValue = String(attribute.value || "").trim().toLowerCase();
        if (name.indexOf("on") === 0 || rawValue.indexOf("javascript:") === 0) {
          node.removeAttribute(attribute.name);
        }
      });
    });
    return template.innerHTML;
  }

  function fillSelect(select, items, labelKey) {
    if (select == null) return;
    const currentValue = select.value || "";
    const options = ['<option value="">Select</option>'].concat((items || []).map(function (item) {
      return '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item[labelKey] || item.name || item.slug || item.id) + '</option>';
    }));
    select.innerHTML = options.join("");
    if (currentValue) {
      select.value = currentValue;
    }
  }

  function mountPermissions() {
    const node = qs("#content-permission-list");
    if (node == null) return;
    const labels = {
      super_admin: ["dashboard.view", "products.manage", "inquiries.manage", "content.edit", "media.manage", "users.manage", "settings.manage"],
      admin: ["dashboard.view", "products.manage", "inquiries.manage", "content.edit", "media.manage"],
      editor: ["dashboard.view", "content.edit"],
      staff: ["dashboard.view", "inquiries.manage"],
    };
    node.innerHTML = (labels[state.primaryRole] || []).map(function (item) {
      return '<span class="permission-pill">' + escapeHtml(item) + '</span>';
    }).join("");
  }

  async function ensureSession() {
    const session = await ns.authApi.getSession();
    if (session == null) {
      global.location.href = "login.html";
      return false;
    }
    const user = session.user || await ns.authApi.getUser();
    const roles = await ns.authApi.getMyRoles(user);
    state.user = user;
    state.roles = (roles || []).map(function (role) { return String(role).toLowerCase(); });
    state.primaryRole = resolvePrimaryRole(state.roles);
    if (["super_admin", "admin", "editor", "staff"].indexOf(state.primaryRole) < 0) {
      await ns.authApi.signOut().catch(function () { return null; });
      global.location.href = "login.html?reason=unauthorized";
      return false;
    }
    const roleNode = qs("#admin-current-role");
    if (roleNode) roleNode.textContent = state.primaryRole.replace(/_/g, " ");
    return true;
  }

  function applySectionAccess() {
    Object.keys(sectionRules).forEach(function (name) {
      const section = qs("#" + name);
      const nav = qs('a[href="#' + name + '"]');
      const visible = canAccess(name);
      if (section) section.style.display = visible ? "" : "none";
      if (nav && nav.parentElement) nav.parentElement.style.display = visible ? "" : "none";
    });
  }

  function renderSummary(summary) {
    qs("#metric-products").textContent = String(summary.totals.products || 0);
    qs("#metric-inquiries").textContent = String(summary.totals.inquiries || 0);
    qs("#metric-admins").textContent = String(summary.totals.admins || 0);
    qs("#metric-media").textContent = String(summary.totals.mediaFiles || 0);

    const activityNode = qs("#recent-activity-list");
    if (activityNode) {
      const html = (summary.activities || []).map(function (item) {
        return '<div class="list-group-item"><div class="fw-semibold text-capitalize">' + escapeHtml(String(item.action || "").replace(/_/g, " ")) + '</div><small class="text-muted">' + escapeHtml(formatDate(item.created_at)) + '</small></div>';
      });
      activityNode.innerHTML = html.length ? html.join("") : '<div class="text-muted">No recent activity.</div>';
    }

    const labels = Object.keys(summary.sourceBreakdown || {});
    const values = labels.map(function (label) { return summary.sourceBreakdown[label]; });
    const ctx = qs("#inquiry-source-chart");
    if (ctx && global.Chart) {
      if (state.chart) {
        state.chart.destroy();
      }
      state.chart = new global.Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [{
            label: "Inquiries",
            data: values,
            backgroundColor: ["#8b5e34", "#2d6a4f", "#e09f3e", "#386fa4", "#9b2226"],
          }],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });
    }
  }

  function renderProducts() {
    const body = qs("#products-table-body");
    if (body == null) return;
    body.innerHTML = (state.products || []).map(function (item) {
      const category = item.product_categories && item.product_categories.name ? item.product_categories.name : "-";
      return '<tr>'
        + '<td><strong>' + escapeHtml(item.name) + '</strong><div class="text-muted small">' + escapeHtml(item.slug) + '</div></td>'
        + '<td>' + escapeHtml(category) + '</td>'
        + '<td>' + escapeHtml(item.status) + '</td>'
        + '<td>' + escapeHtml(formatDate(item.updated_at)) + '</td>'
        + '<td><div class="action-stack"><button class="btn btn-sm btn-outline-primary js-edit-product" data-id="' + escapeHtml(item.id) + '">Edit</button><button class="btn btn-sm btn-outline-danger js-delete-product" data-id="' + escapeHtml(item.id) + '">Archive</button></div></td>'
        + '</tr>';
    }).join("") || '<tr><td colspan="5">No products found.</td></tr>';
  }

  function renderInquiries() {
    const body = qs("#inquiries-table-body");
    if (body == null) return;
    body.innerHTML = (state.inquiries || []).map(function (item) {
      return '<tr>'
        + '<td>' + escapeHtml(item.request_number) + '</td>'
        + '<td>' + escapeHtml(item.source_channel || "unknown") + '</td>'
        + '<td>' + escapeHtml(item.company_name) + '</td>'
        + '<td>' + escapeHtml(item.work_email) + '</td>'
        + '<td>' + escapeHtml(item.status) + '</td>'
        + '<td>' + escapeHtml(formatDate(item.created_at)) + '</td>'
        + '<td><div class="action-stack"><button class="btn btn-sm btn-outline-success js-inquiry-reply" data-id="' + escapeHtml(item.id) + '">Mark Replied</button><button class="btn btn-sm btn-outline-danger js-inquiry-archive" data-id="' + escapeHtml(item.id) + '">Archive</button></div></td>'
        + '</tr>';
    }).join("") || '<tr><td colspan="7">No inquiries found.</td></tr>';
  }

  function renderBuyers() {
    const body = qs("#buyers-table-body");
    if (body == null) return;
    body.innerHTML = (state.buyers || []).map(function (item) {
      return '<tr>'
        + '<td>' + escapeHtml(item.full_name || "-") + '<div class="text-muted small">' + escapeHtml(item.email || item.id || "") + '</div></td>'
        + '<td>' + escapeHtml(item.company_name || "-") + '</td>'
        + '<td>' + escapeHtml(item.country_region || "-") + '</td>'
        + '<td>' + escapeHtml(item.buyer_status || "pending") + '</td>'
        + '<td><div class="action-stack"><button class="btn btn-sm btn-outline-success js-buyer-approve" data-id="' + escapeHtml(item.id) + '">Approve</button><button class="btn btn-sm btn-outline-warning js-buyer-disable" data-id="' + escapeHtml(item.id) + '">Disable</button></div></td>'
        + '</tr>';
    }).join("") || '<tr><td colspan="5">No buyer profiles found.</td></tr>';
  }

  function renderContent() {
    const body = qs("#content-table-body");
    if (body == null) return;
    body.innerHTML = (state.contents || []).map(function (item) {
      return '<tr>'
        + '<td>' + escapeHtml(item.page_key) + '</td>'
        + '<td>' + escapeHtml(item.section_key) + '</td>'
        + '<td>' + escapeHtml(item.title || "-") + '</td>'
        + '<td>' + escapeHtml(item.is_published ? "yes" : "no") + '</td>'
        + '<td>' + escapeHtml(formatDate(item.updated_at)) + '</td>'
        + '<td><button class="btn btn-sm btn-outline-primary js-edit-content" data-id="' + escapeHtml(item.id) + '">Edit</button></td>'
        + '</tr>';
    }).join("") || '<tr><td colspan="6">No content blocks found.</td></tr>';
  }

  function renderMedia() {
    const body = qs("#media-table-body");
    if (body == null) return;
    body.innerHTML = (state.media || []).map(function (item) {
      const url = ns.getSupabaseClient().storage.from(item.bucket_name).getPublicUrl(item.storage_path);
      const preview = url && url.data ? url.data.publicUrl : "";
      return '<tr>'
        + '<td>' + (preview ? '<img class="media-preview" src="' + escapeHtml(preview) + '" alt="">' : '-') + '</td>'
        + '<td>' + escapeHtml(item.file_name) + '</td>'
        + '<td>' + escapeHtml(item.bucket_name) + '</td>'
        + '<td>' + escapeHtml(item.visibility) + '</td>'
        + '<td><button class="btn btn-sm btn-outline-danger js-delete-media" data-id="' + escapeHtml(item.id) + '">Delete</button></td>'
        + '</tr>';
    }).join("") || '<tr><td colspan="5">No media files found.</td></tr>';
  }

  function renderUsers() {
    const body = qs("#users-table-body");
    if (body == null) return;
    body.innerHTML = (state.users || []).map(function (item) {
      const profile = item.profile || {};
      const account = item.account || {};
      const email = profile.email || item.email || "";
      return '<tr>'
        + '<td>' + escapeHtml(profile.full_name || "-") + '</td>'
        + '<td>' + escapeHtml(email) + '<div class="text-muted small">' + escapeHtml(profile.company_name || account.title || "") + '</div></td>'
        + '<td>' + escapeHtml(item.role) + '</td>'
        + '<td>' + escapeHtml(account.status || "active") + '</td>'
        + '<td><div class="action-stack"><button class="btn btn-sm btn-outline-secondary js-role-user" data-id="' + escapeHtml(item.userId) + '">Role</button><button class="btn btn-sm btn-outline-warning js-toggle-user" data-id="' + escapeHtml(item.userId) + '" data-status="' + escapeHtml(account.status || "active") + '">Suspend/Activate</button><button class="btn btn-sm btn-outline-danger js-delete-user" data-id="' + escapeHtml(item.userId) + '">Delete</button></div></td>'
        + '</tr>';
    }).join("") || '<tr><td colspan="5">No admin users found.</td></tr>';
  }

  function renderAiDraftNotifications() {
    const node = qs("#ai-draft-notification-list");
    if (node == null) return;
    node.innerHTML = (state.aiDrafts || []).map(function (item) {
      const relation = Array.isArray(item.blog_categories) ? item.blog_categories[0] : item.blog_categories;
      const category = item.category || (relation && relation.name) || "-";
      return '<div class="list-group-item d-flex flex-column flex-md-row justify-content-between gap-2">'
        + '<div><div class="fw-semibold">' + escapeHtml(item.title || "Untitled draft") + '</div>'
        + '<small class="text-muted">' + escapeHtml(category) + ' · ' + escapeHtml(formatDate(item.created_at)) + '</small></div>'
        + '<div class="action-stack"><button class="btn btn-sm btn-outline-secondary js-review-ai-draft" data-id="' + escapeHtml(item.id) + '">Review</button>'
        + '<button class="btn btn-sm btn-primary js-publish-ai-draft" data-id="' + escapeHtml(item.id) + '">Publish</button></div>'
        + '</div>';
    }).join("") || '<div class="text-muted">No AI drafts awaiting review.</div>';
  }

  function openAiDraftReview(postId) {
    const item = state.aiDrafts.find(function (row) { return row.id === postId; });
    if (!item) return;
    state.activeAiDraftId = item.id;
    const relation = Array.isArray(item.blog_categories) ? item.blog_categories[0] : item.blog_categories;
    const category = item.category || (relation && relation.name) || "-";
    const titleNode = qs("#ai-draft-review-title");
    const metaNode = qs("#ai-draft-review-meta");
    const contentNode = qs("#ai-draft-review-content");
    if (titleNode) titleNode.textContent = item.title || "AI Draft Review";
    if (metaNode) {
      metaNode.innerHTML = [
        "<strong>Category:</strong> " + escapeHtml(category),
        "<strong>Generated:</strong> " + escapeHtml(formatDate(item.created_at)),
        "<strong>Industry:</strong> " + escapeHtml(item.industry_type || "-"),
        "<strong>Country:</strong> " + escapeHtml(item.source_country || "-"),
        "<strong>SEO title:</strong> " + escapeHtml(item.seo_title || "-"),
        "<strong>SEO description:</strong> " + escapeHtml(item.seo_description || "-"),
        "<strong>Keywords:</strong> " + escapeHtml(Array.isArray(item.keywords) ? item.keywords.join(", ") : "-"),
      ].join("<br>");
    }
    if (contentNode) {
      contentNode.innerHTML = '<p class="lead">' + escapeHtml(item.excerpt || "") + '</p>' + sanitizeDraftHtml(item.content || "");
    }
    if (global.bootstrap && qs("#ai-draft-review-modal")) {
      global.bootstrap.Modal.getOrCreateInstance(qs("#ai-draft-review-modal")).show();
    }
  }

  async function publishAiDraft(postId) {
    const confirmed = global.confirm("Publish this AI-generated draft?");
    if (!confirmed) return;
    await ns.adminApi.publishAiBlogDraft(postId);
    showStatus("AI draft published.");
    state.activeAiDraftId = "";
    if (global.bootstrap && qs("#ai-draft-review-modal")) {
      global.bootstrap.Modal.getOrCreateInstance(qs("#ai-draft-review-modal")).hide();
    }
    await loadAiDrafts();
    await loadSummary();
  }

  function fillProductForm(item) {
    qs("#product-id").value = item.id || "";
    qs("#product-name").value = item.name || "";
    qs("#product-slug").value = item.slug || "";
    qs("#product-category").value = item.category_id || "";
    qs("#product-short-description").value = item.short_description || "";
    qs("#product-description").value = item.description || "";
    qs("#product-origin").value = item.origin_country || "Cameroon";
    qs("#product-flavor-notes").value = Array.isArray(item.flavor_notes) ? item.flavor_notes.join(", ") : "";
    qs("#product-status").value = item.status || "published";
    qs("#product-featured").checked = Boolean(item.is_featured);
    qs("#product-popular").checked = Boolean(item.is_popular);
    qs("#product-new").checked = Boolean(item.is_new_arrival);
  }

  function fillContentForm(item) {
    qs("#content-id").value = item.id || "";
    qs("#content-page-key").value = item.page_key || "";
    qs("#content-section-key").value = item.section_key || "";
    qs("#content-title").value = item.title || "";
    qs("#content-subtitle").value = item.subtitle || "";
    qs("#content-body").value = item.body || "";
    qs("#content-json").value = JSON.stringify(item.content || {}, null, 2);
    qs("#content-seo-title").value = item.seo_title || "";
    qs("#content-seo-description").value = item.seo_description || "";
    qs("#content-seo-keywords").value = Array.isArray(item.seo_keywords) ? item.seo_keywords.join(", ") : "";
    qs("#content-phone").value = item.contact_phone || "";
    qs("#content-email").value = item.contact_email || "";
    qs("#content-address").value = item.address_line || "";
    qs("#content-published").checked = Boolean(item.is_published);
  }

  async function loadSummary() {
    const summary = await ns.adminApi.getDashboardSummary();
    renderSummary(summary);
  }

  async function loadProducts() {
    const [categories, products] = await Promise.all([
      ns.adminApi.listProductCategories(),
      ns.adminApi.listProducts({ pageSize: 100 }),
    ]);
    state.categories = categories;
    state.products = products.items || [];
    fillSelect(qs("#product-category"), state.categories, "name");
    fillSelect(qs("#media-product-id"), state.products, "name");
    renderProducts();
  }

  async function loadInquiries() {
    const result = await ns.adminApi.listInquiries({ pageSize: 100 });
    state.inquiries = result.items || [];
    renderInquiries();
  }

  async function loadBuyers() {
    if (canAccess("buyers") === false) return;
    state.buyers = await ns.adminApi.listBuyers();
    renderBuyers();
  }

  async function loadContent() {
    state.contents = await ns.adminApi.listWebsiteContent();
    renderContent();
  }

  async function loadMedia() {
    state.media = await ns.adminApi.listMediaFiles();
    renderMedia();
  }

  async function loadUsers() {
    if (canAccess("users") === false) return;
    state.users = await ns.adminApi.listAdminUsers();
    renderUsers();
  }

  async function loadAiDrafts() {
    if (canAccess("overview") === false || !ns.adminApi.listAiBlogDrafts) return;
    state.aiDrafts = await ns.adminApi.listAiBlogDrafts();
    renderAiDraftNotifications();
  }

  async function refreshVisibleData() {
    await loadSummary();
    await loadAiDrafts();
    if (canAccess("products")) await loadProducts();
    if (canAccess("inquiries")) await loadInquiries();
    if (canAccess("buyers")) await loadBuyers();
    if (canAccess("content")) await loadContent();
    if (canAccess("media")) await loadMedia();
    if (canAccess("users")) await loadUsers();
    mountPermissions();
  }

  function exportInquiriesCsv() {
    const header = ["request_number", "source_channel", "company_name", "work_email", "status", "created_at"];
    const rows = [header.join(",")].concat((state.inquiries || []).map(function (item) {
      return [item.request_number, item.source_channel, item.company_name, item.work_email, item.status, item.created_at].map(function (value) {
        return '"' + String(value || "").replace(/"/g, '""') + '"';
      }).join(",");
    }));
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cocoabridge-inquiries.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function wireEvents() {
    qs("#category-form").addEventListener("submit", async function (event) {
      event.preventDefault();
      try {
        await ns.adminApi.createProductCategory({
          name: qs("#category-name").value,
          slug: qs("#category-slug").value,
          description: qs("#category-description").value,
          displayOrder: qs("#category-order").value,
          status: qs("#category-status").value,
        });
        showStatus("Category saved.");
        event.target.reset();
        await loadProducts();
      } catch (error) {
        showStatus(error.message || "Category save failed.", true);
      }
    });

    qs("#product-form").addEventListener("submit", async function (event) {
      event.preventDefault();
      try {
        const payload = {
          name: qs("#product-name").value,
          slug: qs("#product-slug").value,
          categoryId: qs("#product-category").value,
          shortDescription: qs("#product-short-description").value,
          description: qs("#product-description").value,
          originCountry: qs("#product-origin").value,
          flavorNotes: splitCsv(qs("#product-flavor-notes").value),
          status: qs("#product-status").value,
          isFeatured: qs("#product-featured").checked,
          isPopular: qs("#product-popular").checked,
          isNewArrival: qs("#product-new").checked,
        };
        const existingId = qs("#product-id").value;
        let saved;
        if (existingId) {
          saved = await ns.adminApi.updateProduct(existingId, payload);
        } else {
          saved = await ns.adminApi.createProduct(payload);
        }
        if (qs("#listing-code").value) {
          await ns.adminApi.upsertListing({
            productSlug: saved.slug || payload.slug,
            listingCode: qs("#listing-code").value,
            availableQuantityMt: Number(qs("#listing-quantity").value || 0),
            priceUsdPerMt: Number(qs("#listing-price").value || 0),
            status: "active",
          });
        }
        showStatus("Product saved.");
        qs("#product-form").reset();
        qs("#product-id").value = "";
        await loadProducts();
        await loadSummary();
      } catch (error) {
        showStatus(error.message || "Product save failed.", true);
      }
    });

    qs("#product-reset-btn").addEventListener("click", function () {
      qs("#product-form").reset();
      qs("#product-id").value = "";
    });

    qs("#product-media-form").addEventListener("submit", async function (event) {
      event.preventDefault();
      try {
        const productId = qs("#media-product-id").value;
        const product = state.products.find(function (item) { return item.id === productId; });
        if (product == null) {
          throw new Error("Select a product first.");
        }
        const uploaded = await ns.adminApi.uploadProductImage({
          file: qs("#media-file").files[0],
          productSlug: product.slug,
        });
        await ns.adminApi.createProductMediaAsset({
          product_id: productId,
          bucket_name: uploaded.bucketName,
          storage_path: uploaded.storagePath,
          external_url: null,
          alt_text: qs("#media-alt-text").value,
          media_type: "image",
          visibility: "public",
          is_primary: true,
          display_order: 0,
        });
        showStatus("Product image uploaded.");
        event.target.reset();
      } catch (error) {
        showStatus(error.message || "Product image upload failed.", true);
      }
    });

    qs("#refresh-inquiries-btn").addEventListener("click", function () { void loadInquiries(); });
    qs("#refresh-buyers-btn").addEventListener("click", function () { void loadBuyers(); });
    qs("#export-inquiries-btn").addEventListener("click", exportInquiriesCsv);

    qs("#content-form").addEventListener("submit", async function (event) {
      event.preventDefault();
      try {
        await ns.adminApi.upsertWebsiteContent({
          id: qs("#content-id").value,
          pageKey: qs("#content-page-key").value,
          sectionKey: qs("#content-section-key").value,
          title: qs("#content-title").value,
          subtitle: qs("#content-subtitle").value,
          body: qs("#content-body").value,
          content: parseJsonInput(qs("#content-json").value),
          seoTitle: qs("#content-seo-title").value,
          seoDescription: qs("#content-seo-description").value,
          seoKeywords: splitCsv(qs("#content-seo-keywords").value),
          contactPhone: qs("#content-phone").value,
          contactEmail: qs("#content-email").value,
          addressLine: qs("#content-address").value,
          isPublished: qs("#content-published").checked,
        });
        showStatus("Content block saved.");
        event.target.reset();
        qs("#content-id").value = "";
        await loadContent();
      } catch (error) {
        showStatus(error.message || "Content save failed.", true);
      }
    });

    qs("#library-media-form").addEventListener("submit", async function (event) {
      event.preventDefault();
      try {
        const uploaded = await ns.adminApi.uploadMediaFile({
          file: qs("#library-media-file").files[0],
          bucket: qs("#library-media-bucket").value,
          folder: qs("#library-media-folder").value,
        });
        await ns.adminApi.createMediaFile({
          bucketName: uploaded.bucketName,
          storagePath: uploaded.storagePath,
          fileName: uploaded.fileName,
          mimeType: uploaded.mimeType,
          fileSizeBytes: uploaded.fileSizeBytes,
          altText: qs("#library-media-alt").value,
          visibility: "public",
        });
        showStatus("Media uploaded.");
        event.target.reset();
        await loadMedia();
        await loadSummary();
      } catch (error) {
        showStatus(error.message || "Media upload failed.", true);
      }
    });

    qs("#invite-user-form").addEventListener("submit", async function (event) {
      event.preventDefault();
      try {
        await ns.adminApi.inviteAdminUser({
          fullName: qs("#invite-user-name").value,
          email: qs("#invite-user-email").value,
          title: qs("#invite-user-title").value,
          role: qs("#invite-user-role").value,
          redirectTo: global.location.origin + global.location.pathname.replace(/dashboard\.html$/, "login.html"),
        });
        showStatus("Invite sent.");
        event.target.reset();
        await loadUsers();
        await loadSummary();
      } catch (error) {
        showStatus(error.message || "Invite failed.", true);
      }
    });

    document.addEventListener("click", async function (event) {
      const editProduct = event.target.closest(".js-edit-product");
      const deleteProduct = event.target.closest(".js-delete-product");
      const replyInquiry = event.target.closest(".js-inquiry-reply");
      const archiveInquiry = event.target.closest(".js-inquiry-archive");
      const approveBuyer = event.target.closest(".js-buyer-approve");
      const disableBuyer = event.target.closest(".js-buyer-disable");
      const editContent = event.target.closest(".js-edit-content");
      const deleteMedia = event.target.closest(".js-delete-media");
      const roleUser = event.target.closest(".js-role-user");
      const toggleUser = event.target.closest(".js-toggle-user");
      const deleteUser = event.target.closest(".js-delete-user");
      const reviewAiDraft = event.target.closest(".js-review-ai-draft");
      const publishAiDraftButton = event.target.closest(".js-publish-ai-draft");

      try {
        if (reviewAiDraft) {
          openAiDraftReview(reviewAiDraft.getAttribute("data-id"));
        }
        if (publishAiDraftButton) {
          await publishAiDraft(publishAiDraftButton.getAttribute("data-id"));
        }
        if (editProduct) {
          const item = state.products.find(function (row) { return row.id === editProduct.getAttribute("data-id"); });
          if (item) fillProductForm(item);
        }
        if (deleteProduct) {
          await ns.adminApi.deleteProduct(deleteProduct.getAttribute("data-id"));
          await loadProducts();
          await loadSummary();
        }
        if (replyInquiry) {
          await ns.adminApi.updateInquiryStatus(replyInquiry.getAttribute("data-id"), "quoted", "Marked as replied from admin dashboard");
          await loadInquiries();
          await loadSummary();
        }
        if (archiveInquiry) {
          await ns.adminApi.updateInquiryStatus(archiveInquiry.getAttribute("data-id"), "archived", "Archived from admin dashboard");
          await loadInquiries();
          await loadSummary();
        }
        if (approveBuyer) {
          await ns.adminApi.updateBuyerStatus(approveBuyer.getAttribute("data-id"), "approved");
          await loadBuyers();
        }
        if (disableBuyer) {
          await ns.adminApi.updateBuyerStatus(disableBuyer.getAttribute("data-id"), "disabled");
          await loadBuyers();
        }
        if (editContent) {
          const item = state.contents.find(function (row) { return row.id === editContent.getAttribute("data-id"); });
          if (item) fillContentForm(item);
        }
        if (deleteMedia) {
          await ns.adminApi.deleteMediaFile(deleteMedia.getAttribute("data-id"), true);
          await loadMedia();
          await loadSummary();
        }
        if (roleUser) {
          const nextRole = global.prompt("Enter the new role: super_admin, admin, editor, or staff");
          if (nextRole) {
            await ns.adminApi.updateAdminRole(roleUser.getAttribute("data-id"), nextRole);
            await loadUsers();
            await loadSummary();
          }
        }
        if (toggleUser) {
          const currentStatus = toggleUser.getAttribute("data-status") || "active";
          if (currentStatus === "suspended") {
            await ns.adminApi.activateAdminUser(toggleUser.getAttribute("data-id"));
          } else {
            await ns.adminApi.suspendAdminUser(toggleUser.getAttribute("data-id"));
          }
          await loadUsers();
        }
        if (deleteUser) {
          const confirmed = global.confirm("Delete this admin account?");
          if (confirmed) {
            await ns.adminApi.deleteAdminUser(deleteUser.getAttribute("data-id"));
            await loadUsers();
            await loadSummary();
          }
        }
      } catch (error) {
        showStatus(error.message || "Action failed.", true);
      }
    });

    qs("#ai-draft-review-publish").addEventListener("click", async function () {
      try {
        if (!state.activeAiDraftId) return;
        await publishAiDraft(state.activeAiDraftId);
      } catch (error) {
        showStatus(error.message || "Publish failed.", true);
      }
    });
  }

  async function init() {
    if (ns.authApi == null || ns.adminApi == null) {
      return;
    }
    const ok = await ensureSession();
    if (ok === false) {
      return;
    }
    applySectionAccess();
    wireEvents();
    await refreshVisibleData();
  }

  document.addEventListener("DOMContentLoaded", function () {
    void init();
  });
})(window);
