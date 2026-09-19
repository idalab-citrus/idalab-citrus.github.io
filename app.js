"use strict";

const cfg = window.CITRUS_CONFIG || {};
const TOKEN_KEY = "citrus_api_token";
const state = { token: sessionStorage.getItem(TOKEN_KEY), user: null, objectUrls: [] };

const $ = (id) => document.getElementById(id);
const loginView = $("loginView");
const analyzeView = $("analyzeView");
const loginForm = $("loginForm");
const loginError = $("loginError");
const globalError = $("globalError");
const fileInput = $("fileInput");
const dropzone = $("dropzone");

function showMessage(el, text) {
  el.textContent = text || "發生未知錯誤";
  el.hidden = false;
}

function clearMessage(el) {
  el.textContent = "";
  el.hidden = true;
}

function setAuthenticated(user) {
  state.user = user;
  loginView.hidden = true;
  analyzeView.hidden = false;
  $("userArea").hidden = false;
  $("username").textContent = `${user.username} · ${user.role}`;
}

function setLoggedOut(message) {
  state.token = null;
  state.user = null;
  sessionStorage.removeItem(TOKEN_KEY);
  analyzeView.hidden = true;
  $("userArea").hidden = true;
  loginView.hidden = false;
  if (message) showMessage(loginError, message);
}

async function api(path, options = {}) {
  if (!cfg.API_BASE) throw new Error("尚未設定 API 位址");
  const headers = new Headers(options.headers || {});
  if (state.token) headers.set("Authorization", `Bearer ${state.token}`);
  const response = await fetch(`${cfg.API_BASE}${path}`, { ...options, headers, mode: "cors" });
  if (response.status === 401 && path !== "/auth/login") {
    setLoggedOut("登入已逾時，請重新登入");
    throw new Error("AUTH_401");
  }
  return response;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage(loginError);
  const button = $("loginBtn");
  button.disabled = true;
  button.textContent = "登入中…";
  try {
    const response = await api("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: $("loginUsername").value.trim(),
        password: $("loginPassword").value
      })
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || `登入失敗 (${response.status})`);
    state.token = data.access_token;
    sessionStorage.setItem(TOKEN_KEY, state.token);
    $("loginPassword").value = "";
    setAuthenticated(data.user);
  } catch (error) {
    showMessage(loginError, error.message === "Failed to fetch" ? "目前無法連線至 5090 主機" : error.message);
  } finally {
    button.disabled = false;
    button.textContent = "安全登入";
  }
});

$("logoutBtn").addEventListener("click", async () => {
  try { await api("/auth/logout", { method: "POST" }); } catch (_) { /* 本機清除仍可登出 */ }
  setLoggedOut();
});

$("originalSiteLink").href = `${cfg.ORIGINAL_SITE || "#"}/settings`;

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInput.click(); }
});
["dragenter", "dragover"].forEach((name) => dropzone.addEventListener(name, (event) => {
  event.preventDefault();
  dropzone.classList.add("dragging");
}));
["dragleave", "drop"].forEach((name) => dropzone.addEventListener(name, (event) => {
  event.preventDefault();
  dropzone.classList.remove("dragging");
}));
dropzone.addEventListener("drop", (event) => analyzeFiles(event.dataTransfer.files));
fileInput.addEventListener("change", () => {
  analyzeFiles(fileInput.files);
  fileInput.value = "";
});

function isImage(file) {
  return (file.type || "").startsWith("image/") || /\.(heic|heif)$/i.test(file.name || "");
}

function renderQueue(files) {
  state.objectUrls.forEach((url) => URL.revokeObjectURL(url));
  state.objectUrls = [];
  const queue = $("queue");
  queue.replaceChildren();
  files.forEach((file) => {
    const url = URL.createObjectURL(file);
    state.objectUrls.push(url);
    const item = document.createElement("div");
    const img = document.createElement("img");
    const name = document.createElement("span");
    img.src = url;
    img.alt = "";
    name.textContent = file.name;
    item.append(img, name);
    queue.append(item);
  });
  queue.hidden = false;
}

function setProgress(percent, text, count = "") {
  $("progress").hidden = false;
  $("progressText").textContent = text;
  $("progressCount").textContent = count;
  $("progressBar").style.width = `${Math.max(3, Math.min(100, percent))}%`;
}

async function analyzeFiles(fileList) {
  clearMessage(globalError);
  const files = Array.from(fileList || []).filter(isImage);
  if (!files.length) return showMessage(globalError, "請選擇有效的圖片檔案");
  if (files.length > 20) return showMessage(globalError, "每次最多上傳 20 張圖片");
  if (files.some((file) => file.size > 20 * 1024 * 1024)) return showMessage(globalError, "單張圖片不可超過 20 MB");

  $("results").replaceChildren();
  $("summary").hidden = true;
  renderQueue(files);
  setProgress(12, "正在上傳圖片…", `0 / ${files.length}`);
  const body = new FormData();
  files.forEach((file) => body.append("images", file));

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60000 + files.length * 20000);
  let simulated = 14;
  const animation = window.setInterval(() => {
    simulated = Math.min(88, simulated + 2);
    setProgress(simulated, simulated < 35 ? "圖片已送達，正在載入模型…" : "5090 正在執行 AI 分析…", `0 / ${files.length}`);
  }, 700);

  try {
    const response = await api("/analyze", { method: "POST", body, signal: controller.signal });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || `分析失敗 (${response.status})`);
    setProgress(100, "分析完成", `${data.count} / ${files.length}`);
    renderSummary(data);
    renderResults(data.results || []);
  } catch (error) {
    if (error.message !== "AUTH_401") {
      showMessage(globalError, error.name === "AbortError" ? "分析逾時，請減少圖片數量後重試" : error.message);
    }
  } finally {
    clearTimeout(timeout);
    clearInterval(animation);
    window.setTimeout(() => { $("progress").hidden = true; }, 900);
  }
}

function renderSummary(data) {
  const scores = (data.results || []).filter((item) => item.ok).map((item) => Number(item.ai_score));
  $("summaryAvg").textContent = Number(data.summary?.avg_ai || 0).toFixed(1);
  $("summaryBest").textContent = scores.length ? Math.max(...scores).toFixed(1) : "—";
  $("summaryCount").textContent = String(data.count || 0);
  $("summary").hidden = false;
}

function metric(label, value) {
  const row = document.createElement("div");
  const key = document.createElement("span");
  const val = document.createElement("strong");
  key.textContent = label;
  val.textContent = value ?? "—";
  row.append(key, val);
  return row;
}

function renderResults(results) {
  const root = $("results");
  results.forEach((result) => {
    const card = document.createElement("article");
    card.className = "result-card";
    const title = document.createElement("h2");
    title.textContent = result.filename || "未命名圖片";
    card.append(title);
    if (!result.ok) {
      const error = document.createElement("p");
      error.className = "message error";
      error.textContent = result.error || "無法分析此圖片";
      card.append(error);
      root.append(card);
      return;
    }

    const layout = document.createElement("div");
    layout.className = "result-layout";
    const gallery = document.createElement("div");
    gallery.className = "gallery";
    const labels = { original: "原始影像", roi: "果皮區域", white: "白膜偵測", damage: "破皮偵測" };
    Object.entries(labels).forEach(([key, label]) => {
      if (!result.images?.[key]) return;
      const figure = document.createElement("figure");
      const img = document.createElement("img");
      const caption = document.createElement("figcaption");
      img.src = result.images[key];
      img.alt = label;
      caption.textContent = label;
      figure.append(img, caption);
      gallery.append(figure);
    });

    const panel = document.createElement("div");
    panel.className = "score-panel";
    const score = document.createElement("strong");
    const grade = document.createElement("span");
    score.className = "score";
    score.textContent = Number(result.ai_score).toFixed(1);
    grade.className = "grade";
    grade.textContent = `${result.grade || "評分完成"} · 分類 ${result.ai_class ?? "—"}`;
    panel.append(score, grade);
    panel.append(
      metric("破皮比例", formatPercent(result.features?.Damage_Ratio)),
      metric("白膜比例", formatPercent(result.features?.White_Ratio)),
      metric("破皮區域數", result.features?.Damage_Count)
    );
    layout.append(gallery, panel);
    card.append(layout);
    root.append(card);
  });
}

function formatPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${(number * 100).toFixed(2)}%` : "—";
}

async function restoreSession() {
  if (!state.token) return setLoggedOut();
  try {
    const response = await api("/auth/me");
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error("登入已逾時");
    setAuthenticated(data.user);
  } catch (error) {
    if (error.message !== "AUTH_401") setLoggedOut("請重新登入");
  }
}

restoreSession();
