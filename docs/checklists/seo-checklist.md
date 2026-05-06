# seo-checklist

對齊 Phase 5-a~5-e 實作。完整規格參見 `docs/seo-ga4-adsense.md`。

---

## 1. 文章 frontmatter（撰文時）

- [ ] `title` 已填寫（影響 head title / og:title / twitter:title / JSON-LD headline）
- [ ] `description` 已填寫（影響 meta description / og:description / JSON-LD description）
- [ ] `cover` / `coverAlt` 已填（影響 og:image / og:image:alt / BlogPosting image）
- [ ] `tags` 已填（影響 keywords meta / 標籤頁 sitemap）
- [ ] `category` 在 `categories.json` 內存在
- [ ] `canonical` 留 `"auto"`，或填合法絕對 URL（5-b 會優先用絕對 URL）
- [ ] `status: "ready"` 或 `"published"`、`draft: false`（draft 會被 loadPosts 過濾，不進 SEO 與 sitemap）

---

## 2. site / SEO / GA4 / AdSense 配置（部署前）

### 2.1 site URL

- [ ] `content/settings/site.config.json` `githubSiteUrl` 已換**正式 URL**（不再是 `https://example.com`）
- [ ] `bloggerSiteUrl` 已換正式 URL（如有 Blogger 平台）
- [ ] 兩個 URL 都使用 `https://` 開頭、無 trailing slash

### 2.2 SEO

- [ ] `content/settings/seo.config.json` `defaultTitle` / `defaultDescription` 為正式網站文案

### 2.3 GA4

- [ ] `content/settings/ga4.config.json` `measurementId` 已填（`G-XXXXXXX`）
- [ ] `enabled` 切為 `true`
- [ ] 確認本機 build 後 `dist/index.html` head 含 `gtag/js?id=G-...` 與 `gtag('config', ...)`

### 2.4 AdSense

- [ ] `content/settings/ads.config.json` `adsenseClient` 已填（`ca-pub-...`）
- [ ] 5 個 `slots.{postTop,postMiddle,postBottom,sidebar,homeInline}` ID 已填
- [ ] `enabled` 切為 `true`（如要顯示版位）

---

## 3. Build 與檢查

### 3.1 Validate

- [ ] `npm run validate:content` → **0 warnings**

### 3.2 Build 順序（重要）

- [ ] `npm run build` → 等於 prebuild (build-github.js) + vite build
- [ ] `npm run build:sitemap` → **必須在 vite build 之後**（vite build 會清空 `dist/`）
- [ ] `npm run build:blogger` → Blogger HTML 與 copy-helper（任何時間執行皆可，輸出至 `dist-blogger/`）
- [ ] `npm run build:promotion` → FB 推廣 .txt 與 manifest（任何時間執行皆可，輸出至 `dist-promotion/`）

### 3.3 抽樣檢查 dist/ 產出

- [ ] `dist/index.html` head：含 title / meta description / og:title / og:description / og:url / canonical
- [ ] `dist/posts/{slug}/index.html` head：含 article meta / BlogPosting JSON-LD（用 Google Rich Results Test 或 `jq` 解析驗證為合法 JSON）
- [ ] 開啟瀏覽器，確認 GA4（啟用後）：DevTools Network 面板看到 `collect?v=2&...` 請求；Tag Assistant 顯示 page_view
- [ ] 開啟瀏覽器，確認 AdSense（啟用後且 5-e 完成）：版位區塊顯示廣告 / 預留位
- [ ] 確認 head **無 `example.com` 殘留**（grep 應為 0）

### 3.4 抽樣檢查 dist/sitemap.xml 與 dist/robots.txt

- [ ] `dist/sitemap.xml` 所有 `<loc>` 為**正式 URL**，無 `example.com`
- [ ] `dist/sitemap.xml` 條目齊全：home、post-list、所有 ready 文章、有文章的 categories、有文章的 tags
- [ ] `dist/sitemap.xml` 無 draft 文章
- [ ] `dist/robots.txt` `Sitemap:` 行為**正式 URL**

### 3.5 AdSense enabled=false 安全輸出檢查

`ads.config.json` 維持 `enabled: false / adsenseClient: "" / slots 全空` 時，下列字串應**不出現**於 build 產物（`.cache/pages/` 與 `dist-blogger/` 與 `dist-promotion/` 與 `dist/sitemap.xml` 與 `dist/robots.txt`）：

- [ ] `pagead2.googlesyndication.com`（loader URL）→ 0 命中
- [ ] `adsbygoogle`（class / global）→ 0 命中
- [ ] `ca-pub-`（publisher id 前綴；同時包含於 `data-ad-client` 值）→ 0 命中
- [ ] `google_ad_client`（legacy 屬性名）→ 0 命中
- [ ] `lab-ad-slot`（本專案 hook class）→ 0 命中

⚠️ 啟用 AdSense（`enabled=true` + 填 ID）後，這些字串**自然會**出現於對應頁面的 head（loader URL / `ca-pub-`）與啟用版位的 body（`<ins class="adsbygoogle lab-ad-slot ...">` 含 `data-ad-client="ca-pub-..."` / `data-ad-slot="..."`）；屆時改為「應出現於對應頁面 head / body」，而非「不應出現」。

---

## 4. 部署後

- [ ] 推 GitHub Pages（或目標 host）
- [ ] Google Search Console：提交 `https://{正式網域}/sitemap.xml`
- [ ] Google Tag Assistant：開啟正式站確認 GA4 page_view 觸發
- [ ] AdSense 後台：確認版位審核通過 / 審核中（首次部署）
- [ ] 用 `curl` 或瀏覽器確認 `https://{正式網域}/robots.txt` 可達

---

## 5. 待辦提醒（Phase 5 尚未完成項）

⚠️ 部署前若以下項目未補完，對應功能會缺失或不正常：

- [ ] **AdSense enabled=true 整體 build 驗收**：5-e 全程跑 enabled=false 安全路徑（含 5 條 grep 0 命中）；正式啟用須提供 publisher id + 對應 slot ID 並做獨立授權驗收（流程見 docs/seo-ga4-adsense.md §6.7）
- [ ] **AdSense postMiddle / sidebar 接入**：partial 已存在但 5-e 未 wire（postMiddle 因 markdown body 無中段 anchor；sidebar 因尚無正式元件）；後續可擴充
- [ ] **5-f Blogger SEO**：Blogger summary HTML 缺 OG / JSON-LD；copy-helper 缺搜尋說明 / 自訂 slug 欄位
- [ ] **5-g validate-content SEO 警告**：description / cover / JSON-LD 必填欄缺漏目前不會被警告
- [ ] **GA4 data-ga4-* 屬性散播**：5-d 機制就緒但未在 post-detail / category / tag / affiliate-box / download-box / social-follow 等元件上加 `data-ga4-*` 屬性。即使啟用 GA4，page_view 之外的 8 個 event 不會送
- [ ] **4-g 負面測試**：（promotion 階段）正向樣本驗證已過；負面測試（暫改 frontmatter 觸發 6 條 warning 後還原）尚未做

---

## 相關文件

- 完整規格：`docs/seo-ga4-adsense.md`
- 規範來源：`CLAUDE.md` §6 Phase 5、§16 連結處理、§29 第二階段不做清單
- Promotion checklist：`docs/checklists/fb-promotion-checklist.md`
