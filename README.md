# Citrus GitHub Pages beta

這是獨立於既有 Flask 網站的靜態前端測試版。瀏覽器網址維持在 GitHub Pages，
登入與圖片分析透過 HTTPS Bearer API 直接送到實驗室 5090。

## 發佈前設定

1. 編輯 `config.js` 的 `API_BASE` 與 `ORIGINAL_SITE`。
2. 伺服器環境變數設定精確的 GitHub origin（不要包含專案路徑）：

   `API_ALLOWED_ORIGINS=https://YOUR-USER.github.io`

3. 重新載入 Gunicorn worker，不需重啟 Cloudflare Tunnel。
4. 將本資料夾推到 GitHub repository，於 Settings → Pages 選擇發布來源。

## 安全設計

- Access token 四小時失效，僅存在 `sessionStorage`。
- 密碼變更或「登出所有裝置」會使既有 token 立即失效。
- CORS 僅允許 `API_ALLOWED_ORIGINS` 白名單。
- 不使用跨站 Cookie，因此不受第三方 Cookie 阻擋，也不依賴 Cookie 型 CSRF。
- CSP 只允許連線到目前設定的 API 主機；Tunnel 網址變更時必須同步更新 CSP 與 `config.js`。
