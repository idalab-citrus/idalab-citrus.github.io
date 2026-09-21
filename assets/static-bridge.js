"use strict";
(function () {
  const nativeFetch = window.fetch.bind(window);
  const tokenKey = "citrus_api_token";
  const userKey = "citrus_api_user";
  function clearSession() {
    sessionStorage.removeItem(tokenKey); sessionStorage.removeItem(userKey);
    sessionStorage.removeItem("citrus_last_batch");
  }
  function uiText(key, fallback) {
    return typeof window.t === "function" ? window.t(key) : fallback;
  }
  function message(value) {
    let box = document.getElementById("authFeedback");
    if (!box) {
      box = document.createElement("p"); box.id = "authFeedback"; box.setAttribute("role", "alert");
      box.style.cssText = "white-space:pre-wrap;color:var(--red);margin:16px 0;line-height:1.6";
      (document.querySelector(".auth-card") || document.querySelector("main") || document.body).append(box);
    }
    box.textContent = value;
  }
  function toLogin() {
    clearSession();
    location.replace("/login/?next=" + encodeURIComponent(location.pathname + location.search));
  }
  window.fetch = async function (input, options) {
    const url = new URL(typeof input === "string" ? input : input.url, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith("/api/")) return nativeFetch(input, options);
    const init = Object.assign({}, options || {});
    const headers = new Headers(init.headers || {}); headers.delete("X-CSRFToken");
    const token = sessionStorage.getItem(tokenKey); if (token) headers.set("Authorization", "Bearer " + token);
    init.headers = headers; init.credentials = "omit"; init.mode = "cors"; init.cache = "no-store";
    const apiPath = url.pathname.replace(/^\/api\/(v1\/)?/, "/");
    const response = await nativeFetch(window.CITRUS_CONFIG.API_BASE + apiPath + url.search, init);
    let data;
    if (response.headers.get("Content-Type")?.includes("application/json")) data = await response.clone().json();
    if (data?.access_token) sessionStorage.setItem(tokenKey, data.access_token);
    if (data?.user) sessionStorage.setItem(userKey, JSON.stringify(data.user));
    if (response.status === 401 && apiPath !== "/auth/login") { toLogin(); throw new Error("AUTH_401"); }
    if (data?.force_pw && location.pathname !== "/settings/") { location.replace("/settings/"); throw new Error("FORCE_PASSWORD"); }
    return response;
  };
  window.citrusDownload = async function (path) {
    try {
      const response = await fetch(path); if (!response.ok) return;
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = "citrus-records.csv";
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (_) { if (typeof showToast === "function") showToast(uiText("download.failed", "Export failed. Please try again."), "error"); }
  };
  document.addEventListener("submit", async event => {
    const form = event.target; const path = new URL(form.action, location.href).pathname;
    if (!["/login", "/register", "/logout", "/forgot-password"].includes(path) && !path.startsWith("/reset-password/")) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const button = form.querySelector('[type="submit"]'); if (button) button.disabled = true;
    const body = Object.fromEntries(new FormData(form)); delete body.csrf_token;
    body.lang = typeof window.getLang === "function" ? window.getLang() : "en";
    try {
      if (path === "/logout") { await fetch("/api/v1/auth/logout", {method:"POST"}); clearSession(); location.replace("/login/"); return; }
      let endpoint = path.slice(1);
      if (path.startsWith("/reset-password/")) { endpoint = "reset-password"; body.token = new URLSearchParams(location.search).get("token") || ""; }
      const response = await fetch("/api/v1/auth/" + endpoint, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.errors?.join("\n") || data.error || uiText("auth.operation_failed", "Operation failed"));
      if (endpoint === "login") {
        if (body.remember) localStorage.setItem("citrus_remembered_username", body.username); else localStorage.removeItem("citrus_remembered_username");
        const next = new URLSearchParams(location.search).get("next") || "/"; const safe = new URL(next, location.origin);
        location.replace(data.user.must_change_pw ? "/settings/" : safe.origin === location.origin ? safe.pathname + safe.search : "/");
      } else if (endpoint === "register" || endpoint === "reset-password") {
        clearSession(); sessionStorage.setItem("citrus_auth_notice", data.message || uiText("auth.completed", "Completed. Please sign in.")); location.replace("/login/");
      } else message(data.message);
    } catch (error) {
      if (error.message !== "AUTH_401") message(error.message === "Failed to fetch" ? uiText("auth.connection_error", "Unable to connect. Please try again.") : error.message);
    } finally { if (button) button.disabled = false; }
  }, true);
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('form[action="/logout"]').forEach(form => form.removeAttribute("onsubmit"));
    document.querySelectorAll('a[href^="/"]').forEach(link => {
      const url = new URL(link.href); if (url.pathname !== "/" && !url.pathname.includes(".")) link.href = url.pathname.replace(/\/$/, "") + "/" + url.search + url.hash;
    });
    const remembered = localStorage.getItem("citrus_remembered_username"); const username = document.querySelector('input[name="username"]');
    if (location.pathname.startsWith("/login") && username && remembered) { username.value = remembered; const check = document.querySelector('input[name="remember"]'); if (check) check.checked = true; }
    const notice = sessionStorage.getItem("citrus_auth_notice"); if (notice) { sessionStorage.removeItem("citrus_auth_notice"); message(notice); }
    const registrationCta = document.querySelector("[data-registration-cta]");
    const registrationForm = document.querySelector('form[action="/register"]');
    if (registrationCta || registrationForm) {
      nativeFetch(window.CITRUS_CONFIG.API_BASE + "/auth/registration", {credentials:"omit", cache:"no-store"})
        .then(response => response.ok ? response.json() : null)
        .then(data => {
          if (!data || !data.ok) return;
          if (registrationCta) registrationCta.hidden = !data.registration_open;
          if (!registrationForm) return;
          const inviteField = registrationForm.querySelector(".invite-field");
          const inviteInput = registrationForm.querySelector('input[name="invite_code"]');
          if (inviteField) inviteField.hidden = !data.invite_required;
          if (inviteInput) inviteInput.required = !!data.invite_required;
          if (!data.registration_open) {
            registrationForm.hidden = true;
            message(uiText("register.closed", "Self-registration is currently closed. Please contact the administrator."));
          }
        })
        .catch(() => {});
    }
  });
})();
