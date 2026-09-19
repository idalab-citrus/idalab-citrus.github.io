"use strict";

(function () {
  const loaded = { history: false, admin: false };

  function text(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value == null || value === "" ? "—" : String(value);
  }

  function percent(value) {
    return value == null ? "—" : (Number(value) * 100).toFixed(1) + "%";
  }

  function setMessage(id, kind, message) {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = (kind === "ok" ? "✓ " : kind === "err" ? "✕ " : "") + message;
    element.className = "set-msg " + (kind === "info" ? "" : kind);
  }

  async function jsonRequest(path, options) {
    const response = await window.apiFetch(path, options || {});
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || "操作失敗 (" + response.status + ")");
    return data;
  }

  function showPage(name) {
    const user = window.CITRUS_USER || {};
    if (name === "admin" && !user.is_staff) name = "analyze";
    document.querySelectorAll("[data-page]").forEach((page) => { page.hidden = page.dataset.page !== name; });
    document.querySelectorAll(".navlink[data-page-target]").forEach((link) => link.classList.toggle("active", link.dataset.pageTarget === name));
    history.replaceState(null, "", "#" + name);
    if (name === "history") loadHistory();
    if (name === "admin") loadAdmin();
    if (name === "settings") loadSettings();
    const page = document.querySelector('[data-page="' + name + '"]');
    if (page) page.focus();
  }

  async function loadHistory(force) {
    if (loaded.history && !force) return;
    const body = document.getElementById("historyBody");
    body.innerHTML = '<tr><td colspan="6" class="empty">載入中…</td></tr>';
    try {
      const data = await jsonRequest("/api/v1/me/dashboard");
      const stats = data.stats || {};
      text("h-total", stats.total || 0);
      text("h-avg", stats.avg);
      text("h-best", stats.best);
      text("h-recent", stats.recent);
      const records = data.records || [];
      body.innerHTML = records.length ? records.map((record) => '<tr>' +
        '<td class="mono dim">' + esc(record.created_at || "") + '</td>' +
        '<td>' + esc(record.filename || "") + '</td>' +
        '<td><span class="tag ' + (record.mode === "verify" ? "tag-verify" : "tag-predict") + '">' + (record.mode === "verify" ? "驗證" : "預測") + '</span></td>' +
        '<td class="mono" style="color:' + scoreColor(Number(record.ai_score || 0)) + ';font-weight:600">' + Number(record.ai_score || 0).toFixed(1) + '</td>' +
        '<td class="mono dim">' + percent(record.damage_ratio) + '</td>' +
        '<td class="mono dim">' + percent(record.white_ratio) + '</td></tr>').join("") : '<tr><td colspan="6" class="empty">目前還沒有分析紀錄</td></tr>';
      renderTrend(data.trend || []);
      loaded.history = true;
    } catch (error) {
      body.innerHTML = '<tr><td colspan="6" class="empty">' + esc(error.message) + '</td></tr>';
    }
  }

  function renderTrend(points) {
    const root = document.getElementById("historyTrend");
    if (!points.length) {
      root.innerHTML = '<div class="empty">完成分析後會在這裡顯示分數趨勢</div>';
      return;
    }
    root.innerHTML = points.map((point) => {
      const score = Math.max(0, Math.min(100, Number(point.score || 0)));
      return '<div class="trend-column" title="' + esc(point.label) + ' · ' + score.toFixed(1) + '"><span style="height:' + score + '%"></span><small>' + esc(point.label) + '</small></div>';
    }).join("");
  }

  async function loadAdmin(force) {
    if (loaded.admin && !force) return;
    const body = document.getElementById("adminUserBody");
    body.innerHTML = '<tr><td colspan="5" class="empty">載入中…</td></tr>';
    try {
      const data = await jsonRequest("/api/v1/admin/dashboard");
      const stats = data.stats || {};
      text("a-students", stats.n_students || 0);
      text("a-analyses", stats.n_analyses || 0);
      text("a-verify", stats.n_verify || 0);
      text("a-hits", stats.n_verify ? (stats.hits || 0) + " / " + stats.n_verify : "—");
      text("a-mae", stats.mae);
      const users = data.users || [];
      body.innerHTML = users.length ? users.map((user) => {
        const roleClass = user.role === "admin" ? "tag-admin" : user.role === "ta" ? "tag-ta" : "tag-student";
        const roleLabel = user.role === "admin" ? "管理員" : user.role === "ta" ? "助教" : "學生";
        return '<tr><td style="font-weight:600">' + esc(user.username) + '</td><td class="dim">' + (esc(user.email) || "—") + '</td><td><span class="tag ' + roleClass + '">' + roleLabel + '</span></td><td class="mono">' + Number(user.n_analyses || 0) + '</td><td class="mono dim">' + esc(user.created_at) + '</td></tr>';
      }).join("") : '<tr><td colspan="5" class="empty">沒有帳號資料</td></tr>';
      loaded.admin = true;
    } catch (error) {
      body.innerHTML = '<tr><td colspan="5" class="empty">' + esc(error.message) + '</td></tr>';
    }
  }

  function loadSettings() {
    const user = window.CITRUS_USER || {};
    text("settingsUsername", user.username);
    text("settingsRole", user.role === "admin" ? "管理員" : user.role === "ta" ? "助教" : "學生");
    document.getElementById("settingsEmail").value = user.email || "";
    text("lastLogin", user.prev_login_at ? user.prev_login_at + " · " + (user.prev_login_ip || "—") : "—");
    syncSettingsToggles();
  }

  function syncSettingsToggles() {
    document.querySelectorAll("#settingsTheme button").forEach((button) => button.classList.toggle("active", button.dataset.val === getTheme()));
    document.querySelectorAll("#settingsLanguage button").forEach((button) => button.classList.toggle("active", button.dataset.val === getLang()));
  }

  document.querySelectorAll("[data-page-target]").forEach((link) => link.addEventListener("click", function (event) {
    event.preventDefault();
    showPage(link.dataset.pageTarget);
  }));
  document.getElementById("refreshHistory").addEventListener("click", () => loadHistory(true));
  document.getElementById("refreshAdmin").addEventListener("click", () => loadAdmin(true));

  document.querySelectorAll("#settingsTheme button").forEach((button) => button.addEventListener("click", function () { setTheme(button.dataset.val); syncSettingsToggles(); }));
  document.querySelectorAll("#settingsLanguage button").forEach((button) => button.addEventListener("click", function () { setLang(button.dataset.val); syncSettingsToggles(); }));

  document.getElementById("saveProfileBtn").addEventListener("click", async function () {
    try {
      const data = await jsonRequest("/api/v1/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: document.getElementById("settingsEmail").value.trim() }) });
      window.CITRUS_USER = data.user;
      setMessage("profileMsg", "ok", "已儲存");
    } catch (error) { setMessage("profileMsg", "err", error.message); }
  });

  document.getElementById("changePasswordBtn").addEventListener("click", async function () {
    const oldPassword = document.getElementById("settingsOldPw").value;
    const newPassword = document.getElementById("settingsNewPw").value;
    const confirmation = document.getElementById("settingsNewPw2").value;
    if (!oldPassword || !newPassword || !confirmation) return setMessage("passwordMsg", "err", "請填寫所有欄位");
    if (newPassword !== confirmation) return setMessage("passwordMsg", "err", "兩次新密碼不一致");
    try {
      await jsonRequest("/api/v1/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }) });
      window.citrusReturnToLogin("密碼已更新，請用新密碼重新登入", true);
    } catch (error) { setMessage("passwordMsg", "err", error.message); }
  });

  document.getElementById("logoutAllBtn").addEventListener("click", async function () {
    if (!window.confirm("確定讓所有裝置的登入失效？")) return;
    try {
      await jsonRequest("/api/v1/auth/logout-all", { method: "POST" });
      window.citrusReturnToLogin("所有裝置已登出，請重新登入", true);
    } catch (error) { setMessage("logoutAllMsg", "err", error.message); }
  });

  document.addEventListener("langchange", syncSettingsToggles);
  document.addEventListener("citrus:authenticated", function () {
    loaded.history = false;
    loaded.admin = false;
    const requested = location.hash.slice(1);
    showPage(["analyze", "history", "admin", "settings"].includes(requested) ? requested : "analyze");
  });
  if (window.CITRUS_USER && !document.getElementById("appView").hidden) showPage("analyze");
})();
