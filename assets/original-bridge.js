"use strict";
(function () {
  const nativeFetch = window.fetch.bind(window);
  const key = "citrus_api_token";
  function clearSession() {
    sessionStorage.removeItem(key);
    sessionStorage.removeItem("citrus_last_batch");
  }
  function message(value) {
    let box = document.getElementById("authFeedback");
    if (!box) {
      box = document.createElement("p"); box.id = "authFeedback";
      box.setAttribute("role", "alert");
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
    const headers = new Headers(init.headers || {});
    headers.delete("X-CSRFToken");
    const token = sessionStorage.getItem(key);
    if (token) headers.set("Authorization", "Bearer " + token);
    init.headers = headers; init.credentials = "omit"; init.mode = "cors"; init.cache = "no-store";
    const apiPath = url.pathname.replace(/^\/api\/(v1\/)?/, "/");
    let response;
    try { response = await nativeFetch(window.CITRUS_CONFIG.API_BASE + apiPath + url.search, init); }
    catch (error) { if (typeof showToast === "function") showToast("連線中斷，請重試", "error"); throw error; }
    let data;
    if (response.headers.get("Content-Type")?.includes("application/json")) data = await response.clone().json();
    if (data?.access_token) sessionStorage.setItem(key, data.access_token);
    if (response.status === 401 && apiPath !== "/auth/login") { toLogin(); throw new Error("AUTH_401"); }
    if (data?.force_pw && location.pathname !== "/settings/") { location.replace("/settings/"); throw new Error("FORCE_PASSWORD"); }
    if (!response.ok && !location.pathname.startsWith("/login")) {
      if (typeof showToast === "function") showToast(data?.error || "操作失敗，請重試", "error");
    }
    return response;
  };
  window.citrusDownload = async function (path) {
    try {
      const response = await fetch(path);
      if (!response.ok) return;
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a"); a.href = url; a.download = "citrus-records.csv";
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (_) { if (typeof showToast === "function") showToast("匯出失敗，請重試", "error"); }
  };
  document.addEventListener("submit", async event => {
    const form = event.target;
    const path = new URL(form.action, location.href).pathname;
    if (!["/login", "/register", "/logout", "/forgot-password"].includes(path) && !path.startsWith("/reset-password/")) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const button = form.querySelector('[type="submit"]');
    if (button) button.disabled = true;
    const body = Object.fromEntries(new FormData(form)); delete body.csrf_token;
    try {
      if (path === "/logout") {
        // Capture token before original onsubmit clears sessionStorage.
        await fetch("/api/v1/auth/logout", {method:"POST"}); clearSession(); location.replace("/login/"); return;
      }
      let endpoint = path.slice(1);
      if (path.startsWith("/reset-password/")) { endpoint = "reset-password"; body.token = decodeURIComponent(path.split("/").pop()); }
      const res = await fetch("/api/v1/auth/" + endpoint, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.errors?.join("\n") || data.error || "操作失敗");
      if (endpoint === "login") {
        sessionStorage.removeItem("citrus_last_batch");
        if (body.remember) localStorage.setItem("citrus_remembered_username", body.username);
        else localStorage.removeItem("citrus_remembered_username");
        const next = new URLSearchParams(location.search).get("next") || "/";
        const safeNext = new URL(next, location.origin);
        location.replace(data.user.must_change_pw ? "/settings/" : safeNext.origin === location.origin ? safeNext.pathname + safeNext.search : "/");
      } else if (endpoint === "register" || endpoint === "reset-password") {
        clearSession(); sessionStorage.setItem("citrus_auth_notice", data.message || "完成，請登入"); location.replace("/login/");
      } else message(data.message);
    } catch (error) { if (error.message !== "AUTH_401") message(error.message === "Failed to fetch" ? "無法連線，請重試" : error.message); }
    finally { if (button) button.disabled = false; }
  }, true);
  document.addEventListener("DOMContentLoaded", () => {
    // Original logout uses inline sessionStorage.clear(); use the authenticated bridge instead.
    document.querySelectorAll('form[action="/logout"]').forEach(form => form.removeAttribute("onsubmit"));
    document.querySelectorAll('a[href^="/"]').forEach(a => {
      const u = new URL(a.href);
      if (u.pathname !== "/" && !u.pathname.includes(".")) a.href = u.pathname.replace(/\/$/, "") + "/" + u.search + u.hash;
    });
    const remembered = localStorage.getItem("citrus_remembered_username");
    const username = document.querySelector('input[name="username"]');
    if (location.pathname.startsWith("/login") && username && remembered) {
      username.value = remembered;
      const check = document.querySelector('input[name="remember"]'); if (check) check.checked = true;
    }
    const notice = sessionStorage.getItem("citrus_auth_notice");
    if (notice) { sessionStorage.removeItem("citrus_auth_notice"); message(notice); }
  });
  window.addEventListener("pageshow", event => { if (event.persisted) location.reload(); });
  window.addEventListener("unhandledrejection", event => {
    if (["AUTH_401", "FORCE_PASSWORD"].includes(event.reason?.message)) return;
    if (typeof showToast === "function") showToast("操作未完成，請重試或重新整理頁面", "error");
  });
})();
