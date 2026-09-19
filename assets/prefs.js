/* ==========================================================================
   prefs.js — 在 <head> 最前面執行，套用主題 + 語言 (避免畫面閃爍)
   ========================================================================== */
(function () {
  try {
    var theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    var lang = localStorage.getItem('lang') || 'zh';
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-Hant' : 'en');
  } catch (e) { /* localStorage 不可用時略過 */ }
})();