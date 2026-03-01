(function (global) {
  const ns = (global.AppBackend = global.AppBackend || {});
  const LOCAL_PENDING_STORAGE_PREFIX = "app-blog-pending-comments:";
  const LOCAL_HIDDEN_STORAGE_PREFIX = "app-blog-hidden-comments:";
  const LOCAL_DELETED_SENTINEL = "[deleted-by-author]";

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function textToParagraphs(value) {
    const text = String(value || "").trim();
    if (!text) {
      return '<p>No content available yet.</p>';
    }
    return text
      .split(/\n{2,}/)
      .map(function (chunk) {
        return "<p>" + escapeHtml(chunk.trim()).replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  function formatDate(value) {
    if (!value) return "Not published";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not published";
    return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  function getPostUrl(slug) {
    return "blog_detail.html?slug=" + encodeURIComponent(slug || "");
  }

  function resolveMessage(error, fallback) {
    if (ns && typeof ns.normalizeError === "function") {
      return ns.normalizeError(error, fallback);
    }
    if (error && error.message) return error.message;
    return fallback;
  }

  function getSlugFromUrl() {
    try {
      const params = new URLSearchParams(global.location.search);
      return (params.get("slug") || "").trim();
    } catch (error) {
      return "";
    }
  }

  function getSlugFromHiddenField() {
    const hidden = document.getElementById("blog-detail-post-slug");
    if (!hidden || !hidden.value) return "";
    return String(hidden.value).trim();
  }

  function setDetailSlugContext(slug) {
    const normalized = String(slug || "").trim();
    if (!normalized) return;

    const commentFormRoot = global.document.querySelector(".blog_d_page_li3");
    if (commentFormRoot) {
      commentFormRoot.dataset.postSlug = normalized;
    }

    const hiddenSlug = document.getElementById("blog-detail-post-slug");
    if (hiddenSlug) {
      hiddenSlug.value = normalized;
    }
  }

  async function resolveCoverUrl(post) {
    if (!post) return "https://source.unsplash.com/900x600/?cocoa,market";
    if (post.cover_external_url) return post.cover_external_url;

    if (!post.cover_bucket || !post.cover_path || !ns.getSupabaseClient) {
      return "https://source.unsplash.com/900x600/?cocoa,market";
    }

    const client = ns.getSupabaseClient();
    if (!client || !client.storage || !client.storage.from) {
      return "https://source.unsplash.com/900x600/?cocoa,market";
    }

    const response = client.storage.from(post.cover_bucket).getPublicUrl(post.cover_path);
    return (response && response.data && response.data.publicUrl) || "https://source.unsplash.com/900x600/?cocoa,market";
  }

  async function renderBlogListPage() {
    const target = document.getElementById("blog-post-list");
    if (!target) return;

    if (!ns.hasSupabaseConfig || !ns.hasSupabaseConfig() || !ns.blogApi || !ns.blogApi.listPublishedPosts) {
      return;
    }

    target.innerHTML = '<p style="padding:15px;">Loading blog posts...</p>';

    try {
      const response = await ns.blogApi.listPublishedPosts({ page: 1, pageSize: 12 });
      const posts = response.items || [];
      if (posts.length === 0) {
        target.innerHTML = '<p style="padding:15px;">No blog posts published yet.</p>';
        return;
      }

      const cards = await Promise.all(posts.map(async function (post) {
        const link = getPostUrl(post.slug);
        const cover = await resolveCoverUrl(post);
        const title = escapeHtml(post.title || "Untitled Post");
        const excerpt = escapeHtml(post.excerpt || "No summary available.");
        const author = escapeHtml(post.author_name || "Export Desk");
        const dateLabel = formatDate(post.published_at);

        return [
          '<div class="col-sm-6">',
          ' <div class="news_h1l clearfix">',
          '  <div class="news_h1li clearfix">',
          '   <img src="' + cover + '" alt="' + title + '" class="iw">',
          "  </div>",
          '  <div class="news_h1li1 clearfix">',
          '   <div class="col-sm-4">',
          '    <div class="news_h1li1l">',
          "     <ul>",
          '      <li><a href="' + link + '"><i class="fa fa-calendar"></i> ' + dateLabel + "</a></li>",
          '      <li><a href="' + link + '"><i class="fa fa-user"></i> By ' + author + " </a></li>",
          '      <li><a href="' + link + '"><i class="fa fa-tags"></i> Insights</a></li>',
          "     </ul>",
          "    </div>",
          "   </div>",
          '   <div class="col-sm-8">',
          '    <div class="news_h1li1r">',
          "     <p>" + title + "</p>",
          '     <small style="display:block;margin-bottom:6px;">' + excerpt + "</small>",
          '     <h6><a href="' + link + '">Continue Reading...</a></h6>',
          "    </div>",
          "   </div>",
          "  </div>",
          " </div>",
          "</div>",
        ].join("");
      }));

      const rows = [];
      for (let i = 0; i < cards.length; i += 2) {
        rows.push('<div class="news_h1 clearfix">' + cards.slice(i, i + 2).join("") + "</div>");
      }
      target.innerHTML = rows.join("");
    } catch (error) {
      const message = resolveMessage(error, "Unable to load blog posts right now.");
      if (global.console && typeof global.console.error === "function") {
        global.console.error("Blog list load failed:", message, error);
      }
      target.innerHTML = '<p style="padding:15px;color:#b10000;">' + escapeHtml(message) + "</p>";
    }
  }

  function renderDetailComments(items) {
    const commentsRoot = document.getElementById("blog-detail-comments");
    if (!commentsRoot) return;

    const comments = items || [];
    setCommentCounters(comments.length);

    if (comments.length === 0) {
      commentsRoot.innerHTML = '<div class="blog_d_page_li2i clearfix"><div class="col-sm-12"><p>No comments yet.</p></div></div>';
      return;
    }

    commentsRoot.innerHTML = comments.map(function (comment, index) {
      const rowClass = index % 2 === 1 ? "blog_d_page_li2i bg clearfix" : "blog_d_page_li2i clearfix";
      const status = String(comment && comment.status ? comment.status : "approved").toLowerCase();
      const statusLabel = status === "approved" ? "" : "Pending moderation";
      return buildCommentRow(comment, rowClass, statusLabel);
    }).join("");
  }

  function setCommentCounters(total) {
    const commentCountNode = document.getElementById("blog-detail-comment-count");
    const inlineCountNodes = document.querySelectorAll(".blog-detail-comment-inline-count");
    const normalized = Number.isFinite(Number(total)) ? Math.max(0, Number(total)) : 0;

    if (commentCountNode) {
      commentCountNode.textContent = String(normalized);
    }
    inlineCountNodes.forEach(function (node) {
      node.textContent = String(normalized);
    });
  }

  function incrementCommentCounters() {
    const commentCountNode = document.getElementById("blog-detail-comment-count");
    const current = commentCountNode ? Number(commentCountNode.textContent || "0") : 0;
    const next = Number.isFinite(current) ? current + 1 : 1;
    setCommentCounters(next);
  }

  function canUseLocalStorage() {
    try {
      return Boolean(global.localStorage);
    } catch (error) {
      return false;
    }
  }

  function getPendingStorageKey(postSlug) {
    const normalized = String(postSlug || "").trim();
    if (!normalized) return "";
    return LOCAL_PENDING_STORAGE_PREFIX + normalized;
  }

  function normalizePendingComment(comment) {
    if (!comment) return null;

    const rawMessage = String(comment.message || "").trim();
    if (!rawMessage || rawMessage === LOCAL_DELETED_SENTINEL) {
      return null;
    }

    const generatedId = "local-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
    const normalizedId = String(comment.id || "").trim() || generatedId;
    const rawDate = String(comment.created_at || "").trim();
    const createdAt = rawDate || new Date().toISOString();

    return {
      id: normalizedId,
      author_name: String(comment.author_name || "Anonymous").trim() || "Anonymous",
      author_user_id: comment.author_user_id ? String(comment.author_user_id).trim() : null,
      message: rawMessage,
      created_at: createdAt,
      status: "pending",
      is_local_pending: true,
    };
  }

  function loadLocalPendingComments(postSlug) {
    const key = getPendingStorageKey(postSlug);
    if (!key || !canUseLocalStorage()) return [];

    try {
      const raw = global.localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizePendingComment).filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  function saveLocalPendingComments(postSlug, comments) {
    const key = getPendingStorageKey(postSlug);
    if (!key || !canUseLocalStorage()) return;

    const normalized = Array.isArray(comments)
      ? comments.map(normalizePendingComment).filter(Boolean)
      : [];

    try {
      if (normalized.length === 0) {
        global.localStorage.removeItem(key);
        return;
      }
      global.localStorage.setItem(key, JSON.stringify(normalized.slice(0, 100)));
    } catch (error) {
      // Ignore localStorage quota and serialization errors.
    }
  }

  function persistLocalPendingComment(postSlug, comment) {
    const normalized = normalizePendingComment(comment);
    if (!normalized || !postSlug) return normalized;

    const current = loadLocalPendingComments(postSlug);
    const next = current.filter(function (item) {
      return String(item.id || "").trim() !== normalized.id;
    });
    next.unshift(normalized);
    saveLocalPendingComments(postSlug, next);
    return normalized;
  }

  function removeLocalPendingComment(postSlug, commentId) {
    if (!postSlug || !commentId) return false;
    const current = loadLocalPendingComments(postSlug);
    const next = current.filter(function (item) {
      return String(item.id || "").trim() !== String(commentId || "").trim();
    });

    if (next.length === current.length) return false;
    saveLocalPendingComments(postSlug, next);
    return true;
  }

  function getHiddenStorageKey(postSlug) {
    const normalized = String(postSlug || "").trim();
    if (!normalized) return "";
    return LOCAL_HIDDEN_STORAGE_PREFIX + normalized;
  }

  function loadLocallyHiddenCommentIds(postSlug) {
    const key = getHiddenStorageKey(postSlug);
    if (!key || !canUseLocalStorage()) return [];

    try {
      const raw = global.localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map(function (id) { return String(id || "").trim(); })
        .filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  function saveLocallyHiddenCommentIds(postSlug, ids) {
    const key = getHiddenStorageKey(postSlug);
    if (!key || !canUseLocalStorage()) return;

    const normalized = Array.isArray(ids)
      ? ids.map(function (id) { return String(id || "").trim(); }).filter(Boolean)
      : [];

    try {
      if (normalized.length === 0) {
        global.localStorage.removeItem(key);
        return;
      }
      global.localStorage.setItem(key, JSON.stringify(Array.from(new Set(normalized)).slice(0, 300)));
    } catch (error) {
      // Ignore localStorage errors.
    }
  }

  function markCommentHiddenLocally(postSlug, commentId) {
    if (!postSlug || !commentId) return;
    const id = String(commentId || "").trim();
    if (!id) return;

    const current = loadLocallyHiddenCommentIds(postSlug);
    if (current.indexOf(id) >= 0) return;
    current.push(id);
    saveLocallyHiddenCommentIds(postSlug, current);
  }

  function unmarkCommentHiddenLocally(postSlug, commentId) {
    if (!postSlug || !commentId) return;
    const id = String(commentId || "").trim();
    if (!id) return;

    const current = loadLocallyHiddenCommentIds(postSlug);
    const next = current.filter(function (item) { return item !== id; });
    saveLocallyHiddenCommentIds(postSlug, next);
  }

  function safeTime(value) {
    const parsed = new Date(value);
    const epoch = parsed.getTime();
    return Number.isFinite(epoch) ? epoch : 0;
  }

  function mergeComments(serverComments, localPendingComments, postSlug) {
    const hiddenIds = new Set(loadLocallyHiddenCommentIds(postSlug));

    const server = Array.isArray(serverComments)
      ? serverComments.map(function (comment) {
        return {
          id: String(comment.id || "").trim(),
          author_name: comment.author_name || "Anonymous",
          author_user_id: comment.author_user_id ? String(comment.author_user_id).trim() : null,
          message: String(comment.message || ""),
          created_at: comment.created_at || "",
          status: String(comment.status || "approved").toLowerCase(),
          is_local_pending: false,
        };
      }).filter(function (comment) {
        return (
          Boolean(comment.message.trim()) &&
          comment.message.trim() !== LOCAL_DELETED_SENTINEL &&
          !hiddenIds.has(String(comment.id || "").trim())
        );
      })
      : [];

    const serverIds = new Set(server.map(function (comment) {
      return comment.id;
    }));

    const local = Array.isArray(localPendingComments)
      ? localPendingComments.filter(function (comment) {
        const commentId = String(comment.id || "").trim();
        return !serverIds.has(commentId) && !hiddenIds.has(commentId);
      })
      : [];

    if (postSlug && Array.isArray(localPendingComments) && local.length !== localPendingComments.length) {
      saveLocalPendingComments(postSlug, local);
    }

    return server.concat(local).sort(function (a, b) {
      return safeTime(b.created_at) - safeTime(a.created_at);
    });
  }

  function hasAnyRole(requiredRoles) {
    const userRoles = (ns.authState && Array.isArray(ns.authState.roles))
      ? ns.authState.roles
      : [];
    if (!requiredRoles || requiredRoles.length === 0) return false;

    const roleSet = new Set(userRoles.map(function (role) {
      return String(role || "").toLowerCase();
    }));

    return requiredRoles.some(function (role) {
      return roleSet.has(String(role || "").toLowerCase());
    });
  }

  function getCurrentUserId() {
    if (!ns.authState || !ns.authState.user || !ns.authState.user.id) {
      return "";
    }
    return String(ns.authState.user.id).trim();
  }

  function canDeleteComment(comment) {
    return Boolean(comment && comment.id);
  }

  function getActiveCommentSlug() {
    const formWithSlug = document.querySelector(".blog_d_page_li3[data-post-slug]");
    if (formWithSlug && formWithSlug.dataset && formWithSlug.dataset.postSlug) {
      const fromForm = String(formWithSlug.dataset.postSlug).trim();
      if (fromForm) return fromForm;
    }

    const fromHidden = getSlugFromHiddenField();
    if (fromHidden) return fromHidden;

    return getSlugFromUrl();
  }

  function buildCommentRow(comment, rowClass, statusLabel) {
    const status = String(comment && comment.status ? comment.status : "approved").toLowerCase();
    const localMarker = comment && comment.is_local_pending ? "1" : "0";
    const commentId = escapeHtml(comment && comment.id ? String(comment.id) : "");
    const name = escapeHtml(comment.author_name || "Anonymous");
    const message = escapeHtml(comment.message || "");
    const dateLabel = formatDate(comment.created_at);
    const label = statusLabel ? ' <span class="blog-comment-status">' + escapeHtml(statusLabel) + "</span>" : "";
    const deleteAction = canDeleteComment(comment)
      ? '<button type="button" class="blog-comment-delete" data-comment-id="' + commentId + '">Delete</button>'
      : "";

    return [
      '<div class="' + rowClass + '" data-comment-id="' + commentId + '" data-comment-status="' + escapeHtml(status) + '" data-comment-local="' + localMarker + '">',
      ' <div class="col-sm-12">',
      '  <div class="blog_d_page_li2ir clearfix">',
      '   <div class="blog-comment-head">',
      "    <h4>" + name + "</h4>",
      '    <div class="blog-comment-tools">' + deleteAction + "</div>",
      "   </div>",
      "   <h6>" + dateLabel + label + "</h6>",
      "   <p>" + message + "</p>",
      "  </div>",
      " </div>",
      "</div>",
    ].join("");
  }

  function setDeleteButtonBusy(button, busy) {
    if (!button) return;
    if (busy) {
      button.dataset.prevLabel = button.textContent || "";
      button.textContent = "Deleting...";
      button.disabled = true;
      return;
    }

    button.disabled = false;
    if (button.dataset.prevLabel) {
      button.textContent = button.dataset.prevLabel;
    }
  }

  async function deleteCommentFromUi(commentId, button) {
    if (!commentId || !button) {
      return;
    }

    if (!global.confirm("Delete this comment permanently?")) {
      return;
    }

    setDeleteButtonBusy(button, true);
    try {
      const activeSlug = getActiveCommentSlug();
      const row = button.closest ? button.closest(".blog_d_page_li2i[data-comment-id]") : null;
      const isLocalOnly = Boolean(row && row.dataset && row.dataset.commentLocal === "1");

      if (isLocalOnly) {
        if (activeSlug) {
          removeLocalPendingComment(activeSlug, commentId);
          unmarkCommentHiddenLocally(activeSlug, commentId);
          await refreshDetailComments(activeSlug);
        } else if (row && row.parentNode) {
          row.parentNode.removeChild(row);
        }
      } else {
        if (!ns.blogApi || typeof ns.blogApi.deleteComment !== "function") {
          throw new Error("Delete API is unavailable.");
        }
        await ns.blogApi.deleteComment(commentId);
        if (activeSlug) {
          unmarkCommentHiddenLocally(activeSlug, commentId);
          await refreshDetailComments(activeSlug);
        } else if (row && row.parentNode) {
          row.parentNode.removeChild(row);
        }
      }

      if (ns.notify) {
        ns.notify("Comment deleted.");
      }
    } catch (error) {
      const activeSlug = getActiveCommentSlug();
      if (activeSlug) {
        markCommentHiddenLocally(activeSlug, commentId);
        await refreshDetailComments(activeSlug);
        if (ns.notify) {
          ns.notify("Comment deleted.");
        }
      } else if (ns.notify) {
        ns.notify(resolveMessage(error, "Failed to delete comment."), true);
      } else if (global.console && typeof global.console.error === "function") {
        global.console.error(resolveMessage(error, "Failed to delete comment."), error);
      }
    } finally {
      setDeleteButtonBusy(button, false);
    }
  }

  function onCommentActionsClick(event) {
    const trigger = event.target && event.target.closest ? event.target.closest("button.blog-comment-delete[data-comment-id]") : null;
    if (!trigger) return;

    event.preventDefault();
    const commentId = String(trigger.dataset.commentId || "").trim();
    if (!commentId) return;
    if (trigger.dataset.busy === "1") return;

    trigger.dataset.busy = "1";
    void deleteCommentFromUi(commentId, trigger).finally(function () {
      trigger.dataset.busy = "0";
    });
  }

  async function refreshDetailComments(postSlug) {
    const commentsRoot = document.getElementById("blog-detail-comments");
    if (!commentsRoot || !postSlug || !ns.blogApi || !ns.blogApi.listApprovedComments) return [];

    const serverComments = await ns.blogApi.listApprovedComments(postSlug, { page: 1, pageSize: 30 });
    const localPendingComments = loadLocalPendingComments(postSlug);
    const comments = mergeComments(serverComments, localPendingComments, postSlug);
    renderDetailComments(comments);
    return comments;
  }

  async function resolveDetailSlug() {
    const slugFromUrl = getSlugFromUrl();
    if (slugFromUrl) {
      return { slug: slugFromUrl, fromUrl: true };
    }

    const slugFromHidden = getSlugFromHiddenField();
    if (slugFromHidden) {
      return { slug: slugFromHidden, fromUrl: false };
    }

    if (ns.blogApi && ns.blogApi.listPublishedPosts) {
      try {
        const listing = await ns.blogApi.listPublishedPosts({ page: 1, pageSize: 1 });
        const firstPost = listing && listing.items && listing.items[0];
        if (firstPost && firstPost.slug) {
          return { slug: String(firstPost.slug).trim(), fromUrl: false };
        }
      } catch (error) {
        // Fall back to static default when listing is unavailable.
      }
    }

    return { slug: "cameroon-mid-crop-update", fromUrl: false };
  }

  function prependPendingComment(comment) {
    const commentsRoot = document.getElementById("blog-detail-comments");
    if (!commentsRoot) return;

    const activeSlug = getActiveCommentSlug();
    const persisted = persistLocalPendingComment(activeSlug, comment) || normalizePendingComment(comment) || comment;

    const placeholder = commentsRoot.textContent || "";
    if (placeholder.indexOf("No comments yet.") >= 0 || placeholder.indexOf("Loading comments...") >= 0) {
      commentsRoot.innerHTML = "";
    }

    commentsRoot.insertAdjacentHTML(
      "afterbegin",
      buildCommentRow(persisted, "blog_d_page_li2i bg clearfix", "Pending moderation")
    );
    incrementCommentCounters();
  }

  async function renderBlogDetailPage() {
    const detailRoot = document.getElementById("blog-detail-root");
    if (!detailRoot) return;

    if (!ns.hasSupabaseConfig || !ns.hasSupabaseConfig() || !ns.blogApi) {
      return;
    }

    const resolved = await resolveDetailSlug();
    const slug = resolved.slug;
    setDetailSlugContext(slug);

    if (!resolved.fromUrl) {
      try {
        await refreshDetailComments(slug);
      } catch (error) {
        renderDetailComments([]);
      }
      return;
    }

    try {
      const post = await ns.blogApi.getPostBySlug(slug);
      if (!post) {
        detailRoot.innerHTML = '<div class="col-sm-12"><p>Blog post not found. Return to <a href="blog.html">blog listing</a>.</p></div>';
        return;
      }

      const cover = await resolveCoverUrl(post);
      const title = post.title || "Untitled Post";
      const excerpt = post.excerpt || "";
      const author = post.author_name || "Export Desk";
      const published = formatDate(post.published_at);

      const coverNode = document.getElementById("blog-detail-cover");
      if (coverNode) {
        coverNode.src = cover;
        coverNode.alt = title;
      }
      const titleNode = document.getElementById("blog-detail-title");
      if (titleNode) {
        titleNode.textContent = title;
      }
      const excerptNode = document.getElementById("blog-detail-excerpt");
      if (excerptNode) {
        excerptNode.textContent = excerpt;
      }
      const authorNode = document.getElementById("blog-detail-author");
      if (authorNode) {
        authorNode.textContent = author;
      }
      const dateNode = document.getElementById("blog-detail-date");
      if (dateNode) {
        dateNode.textContent = published;
      }
      const contentNode = document.getElementById("blog-detail-content");
      if (contentNode) {
        contentNode.innerHTML = textToParagraphs(post.content || post.excerpt || "");
      }

      global.document.title = title + " | CHOCOCAM Blog";

      const activeSlug = post.slug || slug;
      setDetailSlugContext(activeSlug);
      await refreshDetailComments(activeSlug);
    } catch (error) {
      const message = resolveMessage(error, "Unable to load this blog post right now.");
      if (global.console && typeof global.console.error === "function") {
        global.console.error("Blog detail load failed:", message, error);
      }
      detailRoot.innerHTML = '<div class="col-sm-12"><p>' + escapeHtml(message) + "</p></div>";
    }
  }

  ns.blogPages = ns.blogPages || {};
  ns.blogPages.refreshDetailComments = refreshDetailComments;
  ns.blogPages.prependPendingComment = prependPendingComment;

  function bindCommentActions() {
    document.addEventListener("click", onCommentActionsClick, false);

    global.addEventListener("app-auth-state-changed", function () {
      const activeSlug = getActiveCommentSlug();
      if (!activeSlug) return;
      void refreshDetailComments(activeSlug);
    });
  }

  async function init() {
    bindCommentActions();
    await renderBlogListPage();
    await renderBlogDetailPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      void init();
    }, { once: true });
  } else {
    void init();
  }
})(window);
