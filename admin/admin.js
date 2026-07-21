/* Hawcus admin panel - vanilla JS, no build step. */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var state = { posts: [], categories: [], analytics: null, editingId: null };

  /* ---------------- api ---------------- */

  async function api(path, options) {
    var res = await fetch(path, Object.assign({ headers: { "Content-Type": "application/json" } }, options));
    if (res.status === 401) {
      showLogin();
      throw new Error("Session expired, please sign in again.");
    }
    var data = res.status === 204 ? {} : await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function toast(msg, isError) {
    var el = $("#toast");
    el.textContent = msg;
    el.className = "adm-toast" + (isError ? " is-error" : "");
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.hidden = true; }, 3200);
  }

  function fmtDate(d) {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function fmtMins(secs) {
    var s = Number(secs) || 0;
    if (s < 1) return "-";
    var m = Math.floor(s / 60);
    var r = Math.round(s % 60);
    return m > 0 ? m + "m " + r + "s" : r + "s";
  }

  /* ---------------- auth ---------------- */

  function showLogin() {
    $("#view-app").hidden = true;
    $("#view-login").hidden = false;
  }

  function showApp(user) {
    $("#view-login").hidden = true;
    $("#view-app").hidden = false;
    $("#who-name").textContent = user.name;
    $("#who-email").textContent = user.email;
    $("#who-av").textContent = (user.name || "A").charAt(0).toUpperCase();
  }

  $("#login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var err = $("#login-error");
    err.hidden = true;
    var fd = new FormData(e.target);
    try {
      var out = await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
      });
      showApp(out.user);
      await refreshAll();
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
    }
  });

  $("#logout").addEventListener("click", async function () {
    await api("/api/admin/logout", { method: "POST" });
    showLogin();
  });

  /* ---------------- tabs ---------------- */

  var TITLES = {
    dashboard: ["Dashboard", "Overview of your blog performance."],
    posts: ["Posts", "Everything you have written, published or draft."],
    editor: ["Write", "Compose a new article or edit an existing one."],
    analytics: ["Analytics", "Clicks and average reading time for every post."],
  };

  function goTab(name) {
    $$(".adm-nav__item").forEach(function (b) { b.classList.toggle("is-on", b.dataset.tab === name); });
    $$(".adm-tab").forEach(function (p) { p.classList.toggle("is-on", p.dataset.panel === name); });
    $("#page-title").textContent = TITLES[name][0];
    $("#page-sub").textContent = TITLES[name][1];
    window.scrollTo({ top: 0 });
  }

  $$(".adm-nav__item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (btn.dataset.tab === "editor" && state.editingId === null) resetForm();
      goTab(btn.dataset.tab);
    });
  });
  document.addEventListener("click", function (e) {
    var go = e.target.closest("[data-goto]");
    if (go) goTab(go.dataset.goto);
  });

  /* ---------------- dashboard ---------------- */

  function renderKpis(target, t) {
    $(target).innerHTML = [
      kpi("Total clicks", t.total_views, "All article views"),
      kpi("Unique readers", t.unique_visitors, "Distinct visitors"),
      kpi("Avg read time", fmtMins(t.avg_secs), "Visible time on page"),
      kpi("Last 7 days", t.views_7d, "Clicks this week"),
      kpi("Published", t.published, "Live articles"),
      kpi("Drafts", t.drafts, "Not yet live"),
    ].join("");
  }

  function kpi(label, value, sub) {
    return '<div class="adm-kpi"><small>' + esc(label) + "</small><b>" + esc(value) +
           "</b><span>" + esc(sub) + "</span></div>";
  }

  function renderChart(daily) {
    var max = Math.max.apply(null, daily.map(function (d) { return d.views; }).concat([1]));
    $("#chart").innerHTML = daily.map(function (d) {
      var h = Math.round((d.views / max) * 100);
      var label = new Date(d.day).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      return '<div class="adm-bar" title="' + esc(label) + ": " + d.views + ' clicks">' +
             '<i style="height:' + Math.max(h, 2) + '%"></i>' +
             "<span>" + esc(label.split(" ")[0]) + "</span></div>";
    }).join("");
  }

  function statusPill(status) {
    return '<span class="adm-pill adm-pill--' + status + '">' + (status === "published" ? "Published" : "Draft") + "</span>";
  }

  function renderTopTable(posts) {
    var top = posts.slice(0, 5);
    $("#top-table").innerHTML =
      "<thead><tr><th>Post</th><th>Clicks</th><th>Avg read</th><th>Status</th></tr></thead><tbody>" +
      (top.length
        ? top.map(function (p) {
            return "<tr><td><b>" + esc(p.title) + "</b></td><td>" + p.views +
                   "</td><td>" + fmtMins(p.avg_secs) + "</td><td>" + statusPill(p.status) + "</td></tr>";
          }).join("")
        : '<tr><td colspan="4" class="adm-empty">No data yet.</td></tr>') +
      "</tbody>";
  }

  /* ---------------- posts table ---------------- */

  function renderPostsTable() {
    $("#posts-table").innerHTML =
      "<thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Published</th><th>Clicks</th><th></th></tr></thead><tbody>" +
      (state.posts.length
        ? state.posts.map(function (p) {
            return "<tr>" +
              "<td><b>" + esc(p.title) + "</b><small>/blog/" + esc(p.slug) + "/</small></td>" +
              "<td>" + esc(p.category) + "</td>" +
              "<td>" + statusPill(p.status) + "</td>" +
              "<td>" + fmtDate(p.published_at) + "</td>" +
              "<td>" + (p.views || 0) + "</td>" +
              '<td class="adm-rowact">' +
                '<button class="adm-btn adm-btn--ghost" data-edit="' + p.id + '">Edit</button>' +
                '<a class="adm-btn adm-btn--ghost" href="/blog/' + esc(p.slug) + '/' +
                  (p.status === "published" ? "" : "?preview=1") + '" target="_blank" rel="noopener">View</a>' +
              "</td></tr>";
          }).join("")
        : '<tr><td colspan="6" class="adm-empty">No posts yet. Hit "New post" to write your first.</td></tr>') +
      "</tbody>";
  }

  function renderAnalyticsTable(posts) {
    $("#analytics-table").innerHTML =
      "<thead><tr><th>Post</th><th>Clicks</th><th>Unique</th><th>Avg read time</th><th>Read sessions</th><th>Avg scroll</th></tr></thead><tbody>" +
      (posts.length
        ? posts.map(function (p) {
            return "<tr>" +
              "<td><b>" + esc(p.title) + "</b><small>" + esc(p.category) + "</small></td>" +
              "<td>" + p.views + "</td>" +
              "<td>" + p.uniques + "</td>" +
              "<td>" + fmtMins(p.avg_secs) + "</td>" +
              "<td>" + p.reads + "</td>" +
              "<td>" + Math.round(p.avg_scroll) + "%</td>" +
              "</tr>";
          }).join("")
        : '<tr><td colspan="6" class="adm-empty">No data yet.</td></tr>') +
      "</tbody>";
  }

  document.addEventListener("click", function (e) {
    var edit = e.target.closest("[data-edit]");
    if (edit) loadPost(Number(edit.dataset.edit));
  });

  /* ---------------- editor ---------------- */

  var form = $("#post-form");

  /* ---------------- category (with custom entry) ---------------- */

  var CUSTOM = "__custom__";

  /* The select carries a "New category" option; picking it reveals a text box. */
  function syncCategoryUi() {
    $("#category-custom-field").hidden = $("#category").value !== CUSTOM;
  }

  function chosenCategory() {
    var sel = $("#category");
    if (sel.value !== CUSTOM) return sel.value;
    return $("#category-custom").value.trim();
  }

  /* Selects the category, falling back to the custom box for one not in the list. */
  function setCategory(value) {
    var sel = $("#category");
    var known = state.categories.indexOf(value) !== -1;
    sel.value = known ? value : CUSTOM;
    $("#category-custom").value = known ? "" : value || "";
    syncCategoryUi();
  }

  $("#category").addEventListener("change", function () {
    syncCategoryUi();
    if ($("#category").value === CUSTOM) $("#category-custom").focus();
  });

  /* ---------------- author picture ---------------- */

  /* Mirrors what the article will show: the picture if there is one, otherwise the
     author's first letter in the same circle. */
  function syncInitial() {
    var name = (form.elements.author_name.value || "H").trim();
    $("#avatar-ph").textContent = (name.charAt(0) || "H").toUpperCase();
  }

  function setAvatar(url) {
    var img = $("#avatar-preview");
    $("#author-avatar").value = url || "";
    img.hidden = !url;
    if (url) img.src = url;
    $("#avatar-ph").hidden = !!url;
    $("#avatar-clear").hidden = !url;
    syncInitial();
  }

  form.elements.author_name.addEventListener("input", syncInitial);

  $("#avatar-clear").addEventListener("click", function () { setAvatar(""); });

  $("#avatar-file").addEventListener("change", async function (e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast("Image must be under 2 MB", true);

    var dataUrl = await new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(new Error("Could not read that file")); };
      r.readAsDataURL(file);
    });

    try {
      var out = await api("/api/admin/upload", { method: "POST", body: JSON.stringify({ data: dataUrl }) });
      setAvatar(out.url);
      toast("Picture uploaded");
    } catch (ex) {
      toast(ex.message, true);
    }
  });

  function resetForm() {
    form.reset();
    state.editingId = null;
    form.elements.id.value = "";
    $("#faq-list").innerHTML = "";
    $("#delete-post").hidden = true;
    $("#view-live").hidden = true;
    $("#post-stats").hidden = true;
    $("#form-error").hidden = true;
    $("#form-ok").hidden = true;
    $("#preview").hidden = true;
    $("#content").hidden = false;
    $("#category-custom").value = "";
    $("#category-custom-field").hidden = true;
    setAvatar("");
    setMode("write");
    updateWordCount();
  }

  $("#new-post").addEventListener("click", function () {
    resetForm();
    goTab("editor");
  });

  async function loadPost(id) {
    try {
      var data = await api("/api/admin/posts/" + id);
      var p = data.post;
      resetForm();
      state.editingId = p.id;
      form.elements.id.value = p.id;
      form.elements.title.value = p.title;
      form.elements.slug.value = p.slug;
      form.elements.excerpt.value = p.excerpt;
      form.elements.tldr.value = p.tldr;
      form.elements.content.value = p.content;
      form.elements.status.value = p.status;
      setCategory(p.category);
      form.elements.author_name.value = p.author_name;
      setAvatar(p.author_avatar);
      form.elements.read_minutes.value = p.read_minutes;

      $("#faq-list").innerHTML = "";
      data.faqs.forEach(function (f) { addFaq(f.question, f.answer); });

      $("#delete-post").hidden = false;
      var live = $("#view-live");
      live.hidden = false;
      live.href = "/blog/" + p.slug + "/" + (p.status === "published" ? "" : "?preview=1");

      renderPostStats(p.id);
      updateWordCount();
      goTab("editor");
    } catch (ex) {
      toast(ex.message, true);
    }
  }

  function renderPostStats(id) {
    if (!state.analytics) return;
    var row = state.analytics.posts.find(function (p) { return p.id === id; });
    if (!row) return;
    $("#post-stats").hidden = false;
    $("#post-stats-body").innerHTML =
      '<div class="adm-stat"><small>Clicks</small><b>' + row.views + "</b></div>" +
      '<div class="adm-stat"><small>Unique readers</small><b>' + row.uniques + "</b></div>" +
      '<div class="adm-stat"><small>Avg read time</small><b>' + fmtMins(row.avg_secs) + "</b></div>" +
      '<div class="adm-stat"><small>Avg scroll depth</small><b>' + Math.round(row.avg_scroll) + "%</b></div>";
  }

  /* FAQ rows */
  function addFaq(q, a) {
    var wrap = document.createElement("div");
    wrap.className = "adm-faq";
    wrap.innerHTML =
      '<input placeholder="Question" value="' + esc(q || "") + '" />' +
      '<textarea rows="2" placeholder="Answer">' + esc(a || "") + "</textarea>" +
      '<button type="button" class="adm-faq__x" title="Remove">&times;</button>';
    wrap.querySelector(".adm-faq__x").addEventListener("click", function () { wrap.remove(); });
    $("#faq-list").appendChild(wrap);
  }
  $("#add-faq").addEventListener("click", function () { addFaq("", ""); });

  function collectFaqs() {
    return $$(".adm-faq").map(function (row) {
      return {
        question: row.querySelector("input").value.trim(),
        answer: row.querySelector("textarea").value.trim(),
      };
    }).filter(function (f) { return f.question; });
  }

  /* toolbar */
  var SNIPPETS = {
    h2: ["<h2>", "</h2>"],
    h3: ["<h3>", "</h3>"],
    p: ["<p>", "</p>"],
    b: ["<strong>", "</strong>"],
    i: ["<em>", "</em>"],
    quote: ["<blockquote><p>", "</p></blockquote>"],
    link: ['<a href="https://">', "</a>"],
    ul: ["<ul>\n  <li>", "</li>\n</ul>"],
    callout: ['<div class="callout"><p><strong>Tip:</strong> ', "</p></div>"],
    table: [
      "<table>\n  <thead><tr><th>Column</th><th>Column</th></tr></thead>\n  <tbody>\n    <tr><td>",
      "</td><td>Value</td></tr>\n  </tbody>\n</table>",
    ],
  };

  $("#toolbar").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-ins]");
    if (!btn) return;
    var pair = SNIPPETS[btn.dataset.ins];
    var ta = $("#content");
    var s = ta.selectionStart, en = ta.selectionEnd;
    var selected = ta.value.slice(s, en);
    ta.value = ta.value.slice(0, s) + pair[0] + selected + pair[1] + ta.value.slice(en);
    ta.focus();
    ta.selectionStart = s + pair[0].length;
    ta.selectionEnd = ta.selectionStart + selected.length;
    updateWordCount();
  });

  function setMode(mode) {
    $$("[data-mode]").forEach(function (b) { b.classList.toggle("is-on", b.dataset.mode === mode); });
    var preview = mode === "preview";
    $("#content").hidden = preview;
    $("#preview").hidden = !preview;
    $("#toolbar").style.display = preview ? "none" : "";
    if (preview) $("#preview").innerHTML = $("#content").value;
  }
  $$("[data-mode]").forEach(function (b) {
    b.addEventListener("click", function () { setMode(b.dataset.mode); });
  });

  function updateWordCount() {
    var text = $("#content").value.replace(/<[^>]+>/g, " ");
    var words = text.split(/\s+/).filter(Boolean).length;
    $("#wordcount").textContent = words + " words, roughly " + Math.max(1, Math.round(words / 200)) + " min read";
  }
  $("#content").addEventListener("input", updateWordCount);

  /* save */
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var err = $("#form-error"), ok = $("#form-ok");
    err.hidden = true; ok.hidden = true;

    if (!chosenCategory()) {
      err.textContent = "Give the new category a name, or pick an existing one.";
      err.hidden = false;
      $("#category-custom").focus();
      return;
    }

    var fd = new FormData(form);
    var payload = {
      title: fd.get("title"),
      slug: fd.get("slug"),
      excerpt: fd.get("excerpt"),
      tldr: fd.get("tldr"),
      content: fd.get("content"),
      status: fd.get("status"),
      category: chosenCategory(),
      author_name: fd.get("author_name"),
      author_avatar: fd.get("author_avatar"),
      read_minutes: fd.get("read_minutes"),
      faqs: collectFaqs(),
    };

    try {
      var id = form.elements.id.value;
      var out = id
        ? await api("/api/admin/posts/" + id, { method: "PUT", body: JSON.stringify(payload) })
        : await api("/api/admin/posts", { method: "POST", body: JSON.stringify(payload) });

      state.editingId = out.post.id;
      form.elements.id.value = out.post.id;
      form.elements.slug.value = out.post.slug;

      var live = $("#view-live");
      live.hidden = false;
      live.href = "/blog/" + out.post.slug + "/" + (out.post.status === "published" ? "" : "?preview=1");
      $("#delete-post").hidden = false;

      ok.textContent = out.post.status === "published"
        ? "Published. It is live on the blog now."
        : "Saved as a draft.";
      ok.hidden = false;
      toast(out.post.status === "published" ? "Post published" : "Draft saved");
      await refreshAll();
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
      toast(ex.message, true);
    }
  });

  $("#delete-post").addEventListener("click", async function () {
    var id = form.elements.id.value;
    if (!id) return;
    if (!confirm("Delete this post permanently? Its analytics will be removed too.")) return;
    try {
      await api("/api/admin/posts/" + id, { method: "DELETE" });
      toast("Post deleted");
      resetForm();
      await refreshAll();
      goTab("posts");
    } catch (ex) {
      toast(ex.message, true);
    }
  });

  /* ---------------- load ---------------- */

  async function refreshAll() {
    var [postsData, analytics] = await Promise.all([
      api("/api/admin/posts"),
      api("/api/admin/analytics"),
    ]);

    state.posts = postsData.posts;
    state.categories = postsData.categories;
    state.analytics = analytics;

    var sel = $("#category");
    var current = sel.value;
    var pending = $("#category-custom").value;
    sel.innerHTML = state.categories.map(function (c) {
      return '<option value="' + esc(c) + '">' + esc(c) + "</option>";
    }).join("") + '<option value="' + CUSTOM + '">+ New category...</option>';
    if (current) sel.value = current;
    $("#category-custom").value = pending;
    syncCategoryUi();

    renderKpis("#kpis", analytics.totals);
    renderKpis("#kpis2", analytics.totals);
    renderChart(analytics.daily);
    renderTopTable(analytics.posts);
    renderPostsTable();
    renderAnalyticsTable(analytics.posts);
    if (state.editingId) renderPostStats(state.editingId);
  }

  (async function init() {
    try {
      var me = await api("/api/admin/me");
      showApp(me.user);
      await refreshAll();
    } catch {
      showLogin();
    }
  })();
})();
