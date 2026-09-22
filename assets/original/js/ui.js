/* ==========================================================================
   ui.js — 共用 UI 元件
   ==========================================================================
   1. animateCount(el, target, opts) — 數字 count-up 動畫 (Apple Health 風格)
   2. openLightbox(views, startIdx)  — 影像檢視器 v2 (醫療影像 PACS 風格)
      views: [{src, label, color, compareWith}]，或舊式單一 src 字串
      · 標籤頁切換 4 視圖 · ← → 鍵盤切換 · Esc 關閉
      · 「對比原圖」模式：拖曳分隔線比較偵測前後 (Viz.ai / PACS 慣例)
   ========================================================================== */

const REDUCED_MOTION = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── HTML 跳脫：所有使用者可控字串 (檔名/帳號/Email) 注入 innerHTML 前必經，防儲存型 XSS ── */
function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ── API fetch 包裝：統一處理 401 登入逾時 ──
   後端對 /api/* 的未登入請求回 401 JSON；這裡顯示提示並自動導回登入頁。
   呼叫端 catch 到 message === 'AUTH_401' 時直接安靜返回即可。 */
/* ── CSRF：全域攔截 fetch，同源且會改動狀態 (非 GET/HEAD) 的請求自動帶 X-CSRFToken ──
   token 來自 base.html 的 <meta name="csrf-token">，後端 Flask-WTF 驗證。
   全域攔截的原因：頁面模板裡有多處 inline script 直接呼叫 fetch()，不經 apiFetch；
   在這裡統一處理，現在與未來的呼叫點都涵蓋。只對同源加 header，不會把 token 洩漏給第三方。 */
(function () {
  if (window.__csrfFetchPatched) return;
  window.__csrfFetchPatched = true;
  const origFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    init = init || {};
    const method = ((init.method) || (input instanceof Request ? input.method : 'GET') || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      let sameOrigin = true;
      try {
        const u = new URL(typeof input === 'string' ? input : input.url, location.href);
        sameOrigin = (u.origin === location.origin);
      } catch (e) { sameOrigin = false; }
      const meta = document.querySelector('meta[name="csrf-token"]');
      if (sameOrigin && meta && meta.content) {
        const h = new Headers(init.headers || (input instanceof Request ? input.headers : undefined) || {});
        if (!h.has('X-CSRFToken')) h.set('X-CSRFToken', meta.content);
        init.headers = h;
      }
    }
    return origFetch(input, init);
  };
})();

async function apiFetch(url, opts) {
  const res = await fetch(url, opts);
  if (res.status === 401) {
    let msg = (typeof t === 'function') ? t('toast.session_expired') : '登入逾時，請重新登入';
    try { const d = await res.json(); if (d && d.error && msg === 'toast.session_expired') msg = d.error; } catch (e) {}
    if (typeof showToast === 'function') showToast(msg, 'error');
    setTimeout(() => { location.href = '/login?next=' + encodeURIComponent(location.pathname); }, 1200);
    throw new Error('AUTH_401');
  }
  return res;
}

/* ── 非阻塞載入回饋 ──
   快速請求不顯示，避免畫面閃爍；超過 140ms 才浮現，顯示後至少停留 280ms。
   同一區塊若有多個並行請求，會等全部結束才收起。 */
const _dataLoadingStates = new WeakMap();
const _buttonLoadingStates = new WeakMap();

function _loadingTarget(target) {
  return typeof target === 'string' ? document.querySelector(target) : target;
}

function beginDataLoading(target, opts) {
  const el = _loadingTarget(target);
  if (!el) return null;
  opts = opts || {};

  let state = _dataLoadingStates.get(el);
  if (!state) {
    let overlay = el.querySelector(':scope > .data-loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'data-loading-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML = '<span class="data-loading-spinner"></span><span class="data-loading-label"></span>';
      el.appendChild(overlay);
    }
    state = { count: 0, timer: null, hideTimer: null, shownAt: 0, overlay };
    _dataLoadingStates.set(el, state);
  }

  state.count += 1;
  if (state.hideTimer) { clearTimeout(state.hideTimer); state.hideTimer = null; }
  const labelKey = opts.labelKey || 'loading.data';
  state.overlay.querySelector('.data-loading-label').textContent = opts.label ||
    ((typeof t === 'function') ? t(labelKey) : '載入中…');
  el.classList.add('data-loading-host');
  el.setAttribute('aria-busy', 'true');

  if (!el.classList.contains('is-data-loading') && !state.timer) {
    state.timer = setTimeout(() => {
      state.timer = null;
      if (state.count < 1) return;
      state.shownAt = performance.now();
      state.overlay.setAttribute('aria-hidden', 'false');
      el.classList.add('is-data-loading');
    }, opts.delay == null ? 140 : opts.delay);
  }
  return { el, state, done: false, minVisible: opts.minVisible == null ? 280 : opts.minVisible };
}

function endDataLoading(token) {
  if (!token || token.done) return;
  token.done = true;
  const { el, state } = token;
  state.count = Math.max(0, state.count - 1);
  if (state.count > 0) return;
  if (state.timer) { clearTimeout(state.timer); state.timer = null; }

  const hide = () => {
    if (state.count > 0) return;
    el.classList.remove('is-data-loading');
    el.removeAttribute('aria-busy');
    state.overlay.setAttribute('aria-hidden', 'true');
    state.hideTimer = null;
  };
  const remaining = state.shownAt ? Math.max(0, token.minVisible - (performance.now() - state.shownAt)) : 0;
  state.hideTimer = setTimeout(hide, remaining);
}

function beginButtonLoading(target) {
  const button = _loadingTarget(target);
  if (!button) return null;
  let state = _buttonLoadingStates.get(button);
  if (!state) {
    state = { count: 0, wasDisabled: button.disabled };
    _buttonLoadingStates.set(button, state);
  }
  state.count += 1;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.classList.add('button-is-loading');
  return { button, state, done: false };
}

function endButtonLoading(token) {
  if (!token || token.done) return;
  token.done = true;
  token.state.count = Math.max(0, token.state.count - 1);
  if (token.state.count > 0) return;
  token.button.disabled = token.state.wasDisabled;
  token.button.removeAttribute('aria-busy');
  token.button.classList.remove('button-is-loading');
  _buttonLoadingStates.delete(token.button);
}

/* ── 全站確認對話框：取代瀏覽器原生 confirm，支援鍵盤、焦點回復與雙語 ── */
let _globalConfirmResolver = null;
let _globalConfirmPreviousFocus = null;

function askGlobalConfirm(options) {
  options = options || {};
  const modal = document.getElementById('globalConfirmModal');
  if (!modal) return Promise.resolve(window.confirm(options.message || 'Are you sure?'));
  if (_globalConfirmResolver) finishGlobalConfirm(false);

  document.getElementById('globalConfirmTitle').textContent = options.title || t('common.confirm');
  document.getElementById('globalConfirmMessage').textContent = options.message || '';
  document.getElementById('globalConfirmAccept').textContent = options.confirmText || t('common.confirm');
  document.getElementById('globalConfirmCancel').textContent = options.cancelText || t('common.cancel');
  _globalConfirmPreviousFocus = document.activeElement;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => document.getElementById('globalConfirmCancel').focus());
  return new Promise(resolve => { _globalConfirmResolver = resolve; });
}

function finishGlobalConfirm(confirmed) {
  const modal = document.getElementById('globalConfirmModal');
  if (!modal || !modal.classList.contains('show')) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  const resolve = _globalConfirmResolver;
  _globalConfirmResolver = null;
  if (_globalConfirmPreviousFocus && document.contains(_globalConfirmPreviousFocus)) {
    _globalConfirmPreviousFocus.focus({ preventScroll: true });
  }
  _globalConfirmPreviousFocus = null;
  if (resolve) resolve(Boolean(confirmed));
}

document.addEventListener('keydown', event => {
  const modal = document.getElementById('globalConfirmModal');
  if (!modal || !modal.classList.contains('show')) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    finishGlobalConfirm(false);
    return;
  }
  if (event.key !== 'Tab') return;
  const controls = [
    document.getElementById('globalConfirmCancel'),
    document.getElementById('globalConfirmAccept')
  ].filter(Boolean);
  if (!controls.length) return;
  const first = controls[0], last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

/* ── 密碼欄位：全站一致的顯示／隱藏控制 ──
   按鈕可用鍵盤操作，aria-pressed 與標籤會跟目前狀態及介面語言同步。 */
let _passwordFieldSeq = 0;

function _passwordToggleLabel(visible) {
  const key = visible ? 'a11y.hide_password' : 'a11y.show_password';
  if (typeof t === 'function') return t(key);
  return visible ? 'Hide password' : 'Show password';
}

function _syncPasswordToggle(button) {
  const input = document.getElementById(button.getAttribute('aria-controls'));
  if (!input) return;
  const visible = input.type === 'text';
  const label = _passwordToggleLabel(visible);
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
  button.setAttribute('aria-pressed', visible ? 'true' : 'false');
  button.classList.toggle('is-visible', visible);
}

function initPasswordToggles(root) {
  (root || document).querySelectorAll('input[type="password"]:not([data-password-toggle-ready])').forEach(input => {
    input.dataset.passwordToggleReady = 'true';
    if (!input.id) input.id = 'password-field-' + (++_passwordFieldSeq);

    const wrap = document.createElement('span');
    wrap.className = 'password-input-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'password-toggle';
    button.setAttribute('aria-controls', input.id);
    button.innerHTML = '<svg class="password-eye password-eye-open" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/></svg><svg class="password-eye password-eye-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16.5 16.5 0 0 1-2.3 2.9M14.2 14.2A3.1 3.1 0 0 1 9.8 9.8M6.2 7.3C3.8 9.1 2.5 12 2.5 12s3.5 6 9.5 6c1.5 0 2.8-.4 4-.9"/></svg>';
    button.addEventListener('click', () => {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      input.type = input.type === 'password' ? 'text' : 'password';
      _syncPasswordToggle(button);
      input.focus({ preventScroll: true });
      try { input.setSelectionRange(start, end); } catch (e) {}
    });
    wrap.appendChild(button);
    _syncPasswordToggle(button);
  });
}

/* 補上常見表單控制項的可存取名稱；優先使用畫面上的欄位標籤。 */
function enhanceFormAccessibility(root) {
  (root || document).querySelectorAll('input:not([type="hidden"]),select,textarea').forEach((control, index) => {
    if (control.getAttribute('aria-label') || control.getAttribute('aria-labelledby')) return;
    const explicit = control.id && document.querySelector('label[for="' + CSS.escape(control.id) + '"]');
    if (explicit || control.closest('label')) return;
    const fieldLabel = control.closest('.field') && control.closest('.field').querySelector('.field-label');
    if (fieldLabel) {
      if (!fieldLabel.id) fieldLabel.id = 'field-label-' + index + '-' + Date.now().toString(36);
      control.setAttribute('aria-labelledby', fieldLabel.id);
      return;
    }
    const fallback = control.getAttribute('placeholder') || control.getAttribute('title');
    if (fallback) control.setAttribute('aria-label', fallback);
  });
}

// 傳統表單（登入、註冊、忘記密碼、登出）送出後也提供一致的等待回饋。
document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  enhanceFormAccessibility();
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (event) => {
      if (event.defaultPrevented) return;
      const button = event.submitter || form.querySelector('button[type="submit"],input[type="submit"]');
      if (button) requestAnimationFrame(() => beginButtonLoading(button));
    });
  });
});
document.addEventListener('langchange', () => {
  document.querySelectorAll('.password-toggle').forEach(_syncPasswordToggle);
  enhanceFormAccessibility();
});

/* ── 分數 → 顏色 / 等第 (全站共用；index 卡片、歷史表格、詳情彈窗都用) ── */
function scoreColor(s){
  if(s>=88) return 'var(--green)';
  if(s>=63) return 'var(--teal)';
  if(s>=38) return 'var(--amber)';
  return 'var(--red)';
}
function gradeText(s){
  if(s>=88) return (typeof t==='function')?t('grade.excellent'):'優異 Excellent';
  if(s>=63) return (typeof t==='function')?t('grade.good'):'良好 Good';
  if(s>=38) return (typeof t==='function')?t('grade.fair'):'待改進 Fair';
  return (typeof t==='function')?t('grade.poor'):'不及格 Poor';
}

/* ── 數字 count-up ── */
function animateCount(el, target, opts) {
  if (!el || target == null || isNaN(target)) return;
  opts = opts || {};
  const decimals = opts.decimals != null ? opts.decimals : (Number.isInteger(+target) ? 0 : 1);
  const duration = opts.duration || 900;
  const suffix = opts.suffix || '';
  // 減少動態偏好、或分頁在背景 (rAF 會被瀏覽器暫停) → 直接顯示最終值
  if (REDUCED_MOTION || document.hidden) { el.textContent = (+target).toFixed(decimals) + suffix; return; }
  const start = performance.now();
  function frame(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    el.textContent = (target * eased).toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // 保險：動畫時間過後強制寫入最終值 (分頁中途被切到背景也能收尾)
  setTimeout(() => { el.textContent = (+target).toFixed(decimals) + suffix; }, duration + 100);
}

/* ── 影像檢視器 v2 ── */
const _lb = { views: [], idx: 0, compare: false, pos: 0.5 };

function _lbT(key, fallback) {
  return (typeof t === 'function') ? t(key) : fallback;
}

function _lbEnsure() {
  let lb = document.getElementById('lightbox');
  if (lb && lb.dataset.v2) return lb;
  if (lb) lb.remove(); // 移除舊版殘留
  lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.className = 'lightbox';
  lb.dataset.v2 = '1';
  lb.innerHTML = `
    <div class="lb-top">
      <div class="lb-tabs"></div>
      <button class="lb-close" aria-label="關閉">✕</button>
    </div>
    <div class="lb-stage">
      <div class="lb-frame">
        <img class="lb-base" alt="">
        <div class="lb-overlay"><img alt=""></div>
        <div class="lb-divider"><div class="lb-handle">⇄</div></div>
        <div class="lb-badge left"></div>
        <div class="lb-badge right"></div>
      </div>
    </div>
    <div class="lb-bottom">
      <button class="lb-compare-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M8 7l-5 5 5 5M16 7l5 5-5 5"/></svg>
        <span class="lb-compare-label"></span>
      </button>
      <span class="lb-hint"></span>
    </div>`;
  document.body.appendChild(lb);

  lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
  lb.querySelector('.lb-stage').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeLightbox();
  });
  lb.querySelector('.lb-compare-btn').addEventListener('click', () => {
    const v = _lb.views[_lb.idx];
    if (!v || !v.compareWith) return;
    _lb.compare = !_lb.compare;
    _lb.pos = 0.5;
    _lbRender(lb);
  });
  lb.querySelector('.lb-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.lb-tab');
    if (!tab) return;
    _lb.idx = +tab.dataset.idx;
    if (!_lb.views[_lb.idx].compareWith) _lb.compare = false;
    _lbRender(lb);
  });
  _lbDragInit(lb);
  return lb;
}

function _lbDragInit(lb) {
  const divider = lb.querySelector('.lb-divider');
  const frame = lb.querySelector('.lb-frame');
  let dragging = false;
  divider.addEventListener('pointerdown', (e) => { dragging = true; e.preventDefault(); });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = frame.getBoundingClientRect();
    _lb.pos = Math.max(0.05, Math.min(0.95, (e.clientX - r.left) / r.width));
    _lbSetPos(lb);
  });
  window.addEventListener('pointerup', () => { dragging = false; });
}

function _lbSetPos(lb) {
  lb.querySelector('.lb-divider').style.left = (_lb.pos * 100) + '%';
  lb.querySelector('.lb-overlay').style.clipPath = `inset(0 0 0 ${_lb.pos * 100}%)`;
}

function _lbRender(lb) {
  const v = _lb.views[_lb.idx];
  if (!v) return;
  const comparing = _lb.compare && !!v.compareWith;

  // 標籤頁
  const tabs = lb.querySelector('.lb-tabs');
  tabs.innerHTML = _lb.views.map((view, i) => `
    <button class="lb-tab ${i === _lb.idx ? 'active' : ''}" data-idx="${i}">
      ${view.color ? `<span class="dot" style="background:${view.color}"></span>` : ''}${view.label || ''}
    </button>`).join('');

  // 影像 (切換時淡入回饋)
  const baseImg = lb.querySelector('.lb-base');
  baseImg.src = comparing ? v.compareWith : v.src;
  if (!REDUCED_MOTION) {
    baseImg.classList.remove('fading');
    void baseImg.offsetWidth;        // 強制重排以重啟動畫
    baseImg.classList.add('fading');
  }
  const overlay = lb.querySelector('.lb-overlay');
  overlay.style.display = comparing ? '' : 'none';
  if (comparing) overlay.querySelector('img').src = v.src;
  lb.classList.toggle('comparing', comparing);
  if (comparing) _lbSetPos(lb);

  // 對比按鈕 / 徽章 / 提示
  const btn = lb.querySelector('.lb-compare-btn');
  btn.disabled = !v.compareWith;
  btn.classList.toggle('on', comparing);
  lb.querySelector('.lb-compare-label').textContent = _lbT('lb.compare', '對比原圖');
  lb.querySelector('.lb-badge.left').textContent = _lbT('lb.before', '偵測前');
  lb.querySelector('.lb-badge.right').textContent = v.label || _lbT('lb.after', '偵測後');
  lb.querySelector('.lb-hint').textContent = _lbT('lb.hint', '← → 切換視圖 · Esc 關閉');
}

function _lbKeys(e) {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('show')) return;
  if (e.key === 'Escape') {
    e.stopPropagation();
    closeLightbox();
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const n = _lb.views.length;
    if (n < 2) return;
    _lb.idx = (e.key === 'ArrowRight') ? (_lb.idx + 1) % n : (_lb.idx - 1 + n) % n;
    if (!_lb.views[_lb.idx].compareWith) _lb.compare = false;
    _lbRender(lb);
  }
}

function openLightbox(views, startIdx) {
  if (typeof views === 'string') views = [{ src: views, label: '' }];
  _lb.views = views;
  _lb.idx = startIdx || 0;
  _lb.compare = false;
  _lb.pos = 0.5;

  const lb = _lbEnsure();
  _lbRender(lb);
  lb.classList.add('show');
  requestAnimationFrame(() => lb.classList.add('visible'));
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', _lbKeys, true);
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.classList.remove('visible');
  setTimeout(() => lb.classList.remove('show'), 250);
  document.body.style.overflow = '';
  document.removeEventListener('keydown', _lbKeys, true);
}
