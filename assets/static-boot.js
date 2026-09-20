"use strict";
(async function () {
  const flags = window.CITRUS_STATIC_FLAGS || {};
  const variants = window.CITRUS_PAGE_VARIANTS || {};
  const tokenKey = "citrus_api_token";
  const userKey = "citrus_api_user";
  function decode(value) {
    const bytes = Uint8Array.from(atob(value), ch => ch.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[ch]);
  }
  function login() {
    sessionStorage.removeItem(tokenKey); sessionStorage.removeItem(userKey);
    location.replace("/login/?next=" + encodeURIComponent(location.pathname + location.search));
  }
  let user = null;
  if (flags.protected) {
    const token = sessionStorage.getItem(tokenKey);
    if (!token) return login();
    try { user = JSON.parse(sessionStorage.getItem(userKey) || "null"); } catch (_) {}
    if (!user) {
      try {
        const response = await fetch(window.CITRUS_CONFIG.API_BASE + "/auth/me", {headers:{Authorization:"Bearer " + token}, credentials:"omit", cache:"no-store"});
        const data = await response.json();
        if (!response.ok || !data.ok) return login();
        user = data.user; sessionStorage.setItem(userKey, JSON.stringify(user));
      } catch (_) { return login(); }
    }
    if (flags.staffOnly && !user.is_staff) return location.replace("/");
  }
  const role = flags.protected ? (user.is_admin ? "admin" : user.is_ta ? "ta" : "student") : "public";
  const encoded = variants[role] || variants.public;
  if (!encoded) return location.replace("/");
  let html = decode(encoded);
  html = html.replaceAll("__CITRUS_API_ORIGIN__", new URL(window.CITRUS_CONFIG.API_BASE).origin);
  if (user) {
    html = html.replaceAll("__CITRUS_USERNAME__", escapeHtml(user.username));
    html = html.replaceAll("__CITRUS_EMAIL__", escapeHtml(user.email || ""));
    html = html.replaceAll("2000-01-02 03:04 · 203.0.113.1", escapeHtml((user.prev_login_at ? user.prev_login_at + " · " : "") + (user.prev_login_ip || "—")));
    html = html.replaceAll(role === "admin" ? "910003" : role === "ta" ? "910002" : "910001", String(Number(user.id)));
  }
  html = html.replaceAll("__CITRUS_RESET_TOKEN__", escapeHtml(new URLSearchParams(location.search).get("token") || ""));
  if (flags.detail) {
    html = html.replaceAll("919999", String(Number(new URLSearchParams(location.search).get("id")) || 0));
    html = html.replaceAll("__CITRUS_TARGET_USERNAME__", "學生");
    html = html.replaceAll("__CITRUS_TARGET_EMAIL__", "");
  }
  document.open(); document.write(html); document.close();
})();
