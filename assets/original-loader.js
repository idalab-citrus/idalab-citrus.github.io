"use strict";
(async function () {
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const legacy = {"#history":"/history/", "#admin":"/admin/", "#settings":"/settings/", "#register":"/register/"};
  if (legacy[location.hash]) return location.replace(legacy[location.hash]);
  const routes = {"/":"analyze", "/login":"login", "/register":"register", "/history":"history", "/admin":"admin", "/settings":"settings", "/admin/student":"student", "/forgot-password":"forgot-password", "/reset-password":"reset-password"};
  const page = routes[path];
  const status = document.getElementById("loadStatus");
  if (!page) { status.textContent = "找不到頁面。請返回首頁。"; return; }
  const cfg = window.CITRUS_CONFIG;
  const token = sessionStorage.getItem("citrus_api_token");
  const publicPage = ["login", "register", "forgot-password", "reset-password"].includes(page);
  if (!token && !publicPage) return location.replace("/login/?next=" + encodeURIComponent(location.pathname + location.search));
  try {
    const query = new URLSearchParams(location.search);
    const res = await fetch(cfg.API_BASE + "/pages/" + page + "?" + query, {
      headers: token ? {Authorization: "Bearer " + token} : {}, credentials: "omit", cache: "no-store"
    });
    const data = await res.json();
    if (res.status === 401) {
      sessionStorage.removeItem("citrus_api_token");
      sessionStorage.removeItem("citrus_last_batch");
      return location.replace("/login/?next=" + encodeURIComponent(location.pathname + location.search));
    }
    if (data.force_pw) return location.replace("/settings/");
    if (!res.ok || !data.ok) throw new Error(data.error || "無法讀取頁面（" + res.status + "）");
    // This HTML is rendered by the same original Flask templates as the lab site.
    const doc = new DOMParser().parseFromString(data.html, "text/html");
    doc.querySelector('meta[name="csrf-token"]')?.remove();
    doc.querySelectorAll('input[name="csrf_token"]').forEach(el => el.remove());
    doc.querySelectorAll("[src],[href]").forEach(el => {
      for (const name of ["src", "href"]) {
        const value = el.getAttribute(name);
        if (value?.startsWith("/static/")) el.setAttribute(name, value.replace("/static/", "/assets/original/"));
      }
    });
    doc.querySelectorAll("[onclick]").forEach(el => {
      let code = el.getAttribute("onclick");
      code = code.replace(/window\.location\.href=('\/api\/[^']*')/, "citrusDownload($1)");
      el.setAttribute("onclick", code);
    });
    doc.querySelectorAll("script").forEach(el => {
      if (!el.src) el.textContent = el.textContent.replaceAll("/admin/student/${s.id}", "/admin/student/?id=${s.id}");
    });
    const config = doc.createElement("script"); config.src = "/config.js";
    const bridge = doc.createElement("script"); bridge.src = "/assets/original-bridge.js";
    const policy = doc.createElement("meta"); policy.httpEquiv = "Content-Security-Policy";
    policy.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' " + new URL(cfg.API_BASE).origin + "; object-src 'none'; base-uri 'self'; form-action 'self'";
    const referrer = doc.createElement("meta"); referrer.name = "referrer"; referrer.content = "no-referrer";
    doc.head.prepend(policy, referrer, config, bridge);
    document.open();
    document.write("<!doctype html>" + doc.documentElement.outerHTML);
    document.close();
  } catch (error) {
    status.textContent = error.message === "Failed to fetch" ? "目前無法連線至實驗室主機，請稍後重試。" : error.message;
  }
})();
