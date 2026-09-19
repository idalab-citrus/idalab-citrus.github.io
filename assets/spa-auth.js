"use strict";

(function () {
  const cfg = window.CITRUS_CONFIG || {};
  const SESSION_TOKEN_KEY = "citrus_api_token";
  const REMEMBERED_USER_KEY = "citrus_remembered_username";
  const loginView = document.getElementById("loginView");
  const appView = document.getElementById("appView");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  let token = sessionStorage.getItem(SESSION_TOKEN_KEY);

  window.IS_STAFF = false;

  function setError(message) {
    loginError.textContent = message || "登入失敗";
    loginError.hidden = !message;
  }

  function clearToken() {
    token = null;
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  }

  function saveToken(value, remember) {
    clearToken();
    token = value;
    sessionStorage.setItem(SESSION_TOKEN_KEY, value);
    if (remember) localStorage.setItem(REMEMBERED_USER_KEY, document.getElementById("loginUsername").value.trim());
    else localStorage.removeItem(REMEMBERED_USER_KEY);
  }

  function isStaff(user) {
    return Boolean(user && (user.is_staff || user.is_admin || user.is_ta || ["admin", "ta"].includes(String(user.role || "").toLowerCase())));
  }

  function roleLabel(user) {
    const role = String(user.role || "student").toLowerCase();
    if (role === "admin") return getLang() === "zh" ? "管理員" : "Admin";
    if (role === "ta") return getLang() === "zh" ? "助教" : "TA";
    return getLang() === "zh" ? "學生" : "Student";
  }

  function showApp(user) {
    window.IS_STAFF = isStaff(user);
    loginView.hidden = true;
    appView.hidden = false;
    document.title = "影像分析 · Citrus Surgical Scorer";
    document.body.classList.toggle("is-staff", window.IS_STAFF);
    document.getElementById("navUsername").textContent = user.username || "";
    const role = document.getElementById("navRole");
    role.textContent = roleLabel(user);
    role.className = "nav-role " + (String(user.role).toLowerCase() === "admin" ? "role-admin" : (String(user.role).toLowerCase() === "ta" ? "role-ta" : "role-student"));
    document.querySelectorAll("[data-staff-only]").forEach((el) => { el.hidden = !window.IS_STAFF; });
    document.querySelectorAll("[data-student-only]").forEach((el) => { el.hidden = window.IS_STAFF; });
    setupOnboarding();
  }

  function showLogin(message) {
    clearToken();
    appView.hidden = true;
    loginView.hidden = false;
    document.title = "登入 · Citrus Surgical Scorer";
    if (message) setError(message);
  }

  async function request(path, options) {
    if (!cfg.API_BASE) throw new Error("尚未設定 API 位址");
    const init = Object.assign({}, options || {});
    const headers = new Headers(init.headers || {});
    if (token) headers.set("Authorization", "Bearer " + token);
    init.headers = headers;
    init.mode = "cors";
    const response = await fetch(cfg.API_BASE + path, init);
    if (response.status === 401 && path !== "/auth/login") {
      showLogin(getLang() === "zh" ? "登入已逾時，請重新登入" : "Session expired. Please sign in again.");
      throw new Error("AUTH_401");
    }
    return response;
  }

  window.apiFetch = function (path, options) {
    const apiPath = path === "/api/analyze" ? "/analyze" : path.replace(/^\/api\/v1/, "");
    return request(apiPath, options);
  };

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    setError("");
    const button = document.getElementById("loginBtn");
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = getLang() === "zh" ? "登入中…" : "Signing in…";
    try {
      const response = await request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: document.getElementById("loginUsername").value.trim(), password: document.getElementById("loginPassword").value })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "登入失敗 (" + response.status + ")");
      saveToken(data.access_token, document.getElementById("rememberLogin").checked);
      document.getElementById("loginPassword").value = "";
      showApp(data.user || {});
    } catch (error) {
      setError(error.message === "Failed to fetch" ? "目前無法連線至 5090 主機" : error.message);
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", async function () {
    try { await request("/auth/logout", { method: "POST" }); } catch (_) {}
    try { sessionStorage.removeItem("citrus_last_batch"); } catch (_) {}
    showLogin();
  });

  document.querySelectorAll("[data-auth-lang]").forEach((button) => button.addEventListener("click", function () { setLang(button.dataset.authLang); }));
  document.querySelectorAll("[data-static-page]").forEach((link) => link.addEventListener("click", function (event) {
    event.preventDefault();
    showToast(getLang() === "zh" ? "此頁面正在移轉；分析功能已可正常使用。" : "This page is being migrated; analysis is ready to use.", "info");
  }));

  document.getElementById("registerLink").href = (cfg.ORIGINAL_SITE || "#") + "/register";
  document.getElementById("forgotLink").href = (cfg.ORIGINAL_SITE || "#") + "/forgot-password";

  const rememberedUser = localStorage.getItem(REMEMBERED_USER_KEY);
  if (rememberedUser) {
    document.getElementById("loginUsername").value = rememberedUser;
    document.getElementById("rememberLogin").checked = true;
  }

  const themeButton = document.getElementById("navTheme");
  const langButtons = document.querySelectorAll(".nav-lang-group button");
  function syncLangButtons() {
    const current = getLang();
    langButtons.forEach((button) => {
      const active = button.dataset.lang === current;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }
  themeButton.addEventListener("click", function () { setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"); });
  langButtons.forEach((button) => button.addEventListener("click", function () { setLang(button.dataset.lang); syncLangButtons(); }));
  document.addEventListener("langchange", syncLangButtons);
  syncLangButtons();

  function setupOnboarding() {
    const box = document.getElementById("onboard");
    if (box.dataset.ready) return;
    box.dataset.ready = "1";
    let dismissed = false;
    try { dismissed = localStorage.getItem("onboard_analyze") === "done"; } catch (_) {}
    box.hidden = dismissed;
    document.getElementById("onboardClose").addEventListener("click", function () {
      box.classList.add("onboard-hide");
      setTimeout(function () { box.hidden = true; }, 300);
      try { localStorage.setItem("onboard_analyze", "done"); } catch (_) {}
    });
  }

  (async function restoreSession() {
    if (!token) return showLogin();
    try {
      const response = await request("/auth/me");
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error("登入已逾時");
      showApp(data.user || {});
    } catch (error) {
      if (error.message !== "AUTH_401") showLogin("請重新登入");
    }
  })();
})();
