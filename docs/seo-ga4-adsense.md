# J-02 SEO / GA4 / AdSense

GitHub 站 SEO 標籤、sitemap、robots、GA4 追蹤、AdSense 版位的規格與實作現況。
對應 CLAUDE.md §6 Phase 5。

---

## Phase 5 進度摘要

| 子階段 | 範圍 | 狀態 |
|---|---|---|
| 5-a | site URL placeholder + canonical 基礎 | ✅ 完成 |
| 5-b | SEO meta tags / Open Graph / canonical / JSON-LD | ✅ 完成 |
| 5-c | sitemap.xml / robots.txt | ✅ 完成 |
| 5-d | GA4 tracking partials（基礎機制） | ✅ 完成 |
| 5-e | AdSense partial 與版位 | ⏳ **尚未完成** |
| 5-f | Blogger SEO（OG / JSON-LD / copy-helper 擴充） | ⏳ **尚未完成** |
| 5-g | validate-content SEO 警告 | ⏳ **尚未完成** |
| 5-h | docs（本份） | ✅ 完成 |

⚠️ **不要把目前實作當成 Phase 5 完成版**——部署前必須補完 5-e / 5-f / 5-g，並完成 §9「部署前檢查」全部項目。

---

## 1. 系統定位

- 範圍：GitHub 靜態站的搜尋引擎標籤、sitemap、追蹤腳本、廣告版位
- 不在範圍：Blogger 平台的 SEO（除 5-f 已規劃外，平台本身的 SEO 由 Blogger 後台處理）；CLAUDE.md §29「第一版不做」清單（自動發文 / View 數 / Like 數等）

實作分散於：
- 設定：`content/settings/{site,seo,ga4,ads}.config.json`
- 程式：`src/scripts/build-github.js` / `src/scripts/build-sitemap.js`
- 模板：`src/views/{seo,tracking,ads}/*.ejs`
- JS module：`src/js/modules/link-tracker.js` / `src/js/modules/ga4-events.js`

---

## 2. 站台 URL 與 canonical 基礎（5-a）

`content/settings/site.config.json` 的兩個 URL 欄位：

```json
"githubSiteUrl": "https://example.com",
"bloggerSiteUrl": "https://example.com"
```

**目前是 placeholder**（`https://example.com`），用於本機驗證流程通過。

**影響面**（placeholder URL 會出現在）：
- `dist/posts/*/index.html` head 的 `canonical` / `og:url`
- `dist/sitemap.xml` 每個 `<loc>`
- `dist/robots.txt` 的 `Sitemap:` 行
- `dist-blogger/posts/*/post.html` 的 `canonical link`
- `dist-blogger/posts/*/copy-helper.txt` 中的 URL
- `dist-promotion/facebook/**/*.txt` 的 finalUrl
- `dist-promotion/facebook/build-manifest.json` 的 `baseUrl / finalUrl`

⚠️ **部署前必須換成正式 URL**（見 §9）。

---

## 3. SEO 標籤（5-b）

### 3.1 Partial 角色

| Partial | 職責 |
|---|---|
| `src/views/seo/meta-tags.ejs` | description / author / robots / keywords / article:published_time / article:modified_time |
| `src/views/seo/open-graph.ejs` | og:type/title/description/url/site_name/locale/image/image:alt + twitter:* mirror |
| `src/views/seo/canonical.ejs` | `<link rel="canonical">`；canonicalUrl 為 null（404 / design-system）則跳過 |
| `src/views/seo/json-ld.ejs` | `<script type="application/ld+json">`；對 `<` 做 `<` escape |

### 3.2 注入策略

由於 `src/views/layout/base.ejs` 的 `await include('./head', { title, description })` 限制 head 看不到 `site` / `seo` 物件，5-b 採 **build-github.js 端 post-process 注入**：base.ejs 渲染完 → 4 個 SEO partial 用完整 data 渲染 → 字串注入到 `</head>` 之前。**未動 base.ejs**。

### 3.3 pageType ↔ JSON-LD schema 對應

| pageType | canonical | JSON-LD |
|---|---|---|
| home | `{base}/` | `WebSite` |
| post-list | `{base}/posts/` | 無 |
| post-detail | `{base}/posts/{slug}/`（或 post.canonical 絕對 URL） | `BlogPosting`（含 datePublished / dateModified / author / image / articleSection） |
| category-list | `{base}/categories/` | 無 |
| category | `{base}/categories/{slug}/` | 無 |
| tag-list | `{base}/tags/` | 無 |
| tag | `{base}/tags/{slug}/` | 無 |
| 404 | **不出 canonical** | 無 |
| design-system 主 / 子 | **不出 canonical** | 無 |

### 3.4 noindex 規則

`pages/404` 與 `design-system/*` 加 `<meta name="robots" content="noindex, nofollow">`，且不出 canonical（避免 noindex 與 canonical 衝突）。

---

## 4. sitemap.xml / robots.txt（5-c）

### 4.1 輸出檔案

```
dist/sitemap.xml
dist/robots.txt
```

兩者皆被 `.gitignore` 排除，不入庫；由 `npm run build:sitemap` 產出。

### 4.2 sitemap.xml 內容

包含：home / post-list / post-detail（每篇 ready/published 文章）/ categories index / 每個有文章的 category / tags index / 每個有文章的 tag。

每筆含 `<loc>` 與 `<lastmod>`：
- post 的 `lastmod` 用 `post.updated || post.date`
- index 頁的 `lastmod` 用 build 當天 ISO 日期

**不輸出** `<changefreq>` / `<priority>`（Google 已忽略）。

`sitemap` 的 loc 與 5-b head canonical **完全對齊**。

### 4.3 robots.txt 內容

```
User-agent: *
Allow: /
Disallow: /design-system/
Disallow: /404.html
Sitemap: {site.githubSiteUrl}/sitemap.xml
```

與 5-b noindex 規則一致；`Sitemap:` 行使用 `site.githubSiteUrl`。

### 4.4 ⚠️ Build 順序：sitemap 必須在 vite build 之後

`vite build` 會**清空 `dist/`**。`npm run build:sitemap` 寫入 `dist/sitemap.xml` 與 `dist/robots.txt`。所以正確順序是：

```
npm run build           # 等於 prebuild (build-github.js) + vite build
npm run build:sitemap   # 必須在 vite build 之後
```

5-c 不接 `prebuild` / `postbuild`（避免每次 dev 都跑），由作者手動執行。

---

## 5. GA4 tracking（5-d）

### 5.1 設定（ga4.config.json）

```json
{
  "enabled": false,
  "measurementId": "",
  "events": [
    "page_view", "internal_link_click", "tag_click",
    "category_click", "affiliate_click", "download_click",
    "social_click", "blogger_to_github_click",
    "github_to_blogger_click"
  ]
}
```

### 5.2 ga4.ejs gating 規則

```
ga4.enabled === true && ga4.measurementId 非空 → 輸出 gtag.js + config script
任一不滿足 → partial 完全空輸出
```

**目前 enabled=false**，所以**所有頁面 head 不含 gtag script**。`enabled=true + measurementId 空` 採**靜默 skip**（不 console.warn），避免 build noise。

### 5.3 events-helper partial

`src/views/tracking/ga4-events-helper.ejs` 是模板層 partial，可被 inline include 來產出 `data-ga4-*` 屬性：

```ejs
<a <%- include('../tracking/ga4-events-helper', {
  event: 'tag_click',
  params: { tag: 'github' }
}) %>>...</a>
```

輸出：`data-ga4-event="tag_click" data-ga4-param-tag="github"`

⚠️ **5-d 未在頁面模板實際 include / 撒屬性**——機制就緒，但屬性還沒散播到 post-detail / category / tag / affiliate-box / download-box / social-follow 等元件。`page_view` 由 gtag config 自動觸發；其他 8 個 event 目前不會送（即使啟用 GA4）。屬後續整合工作。

### 5.4 JS module

`src/js/modules/ga4-events.js`：

```js
export function trackEvent(name, params) {
  // gtag 不存在時靜默 no-op
}
```

`src/js/modules/link-tracker.js`：全域 click 委派監聽，讀 `data-ga4-event` / `data-ga4-param-*` 屬性 → 呼叫 `trackEvent`。

### 5.5 9 events 對應（規劃）

| Event | 觸發來源 |
|---|---|
| page_view | `gtag('config', ...)` 自動 |
| internal_link_click / tag_click / category_click | 在對應元素加 `data-ga4-event` |
| affiliate_click / download_click / social_click | 同上，於對應元件 |
| blogger_to_github_click | Blogger 模板（5-f 範圍） |
| github_to_blogger_click | GitHub 模板（後續整合） |

---

## 6. AdSense（5-e 尚未完成）

⏳ **本階段未實作**。範圍：

- 6 個 partial：`src/views/ads/{adsense-slot,adsense-post-top,adsense-post-middle,adsense-post-bottom,adsense-sidebar,adsense-home-inline}.ejs`（目前皆 1 行 placeholder）
- `content/settings/ads.config.json` 結構：

```json
{
  "enabled": false,
  "adsenseClient": "",
  "slots": {
    "postTop": "",
    "postMiddle": "",
    "postBottom": "",
    "sidebar": "",
    "homeInline": ""
  }
}
```

- 5-e 預計：實作 partial、wire 到 post-detail / home / sidebar；尊重文章 frontmatter `blocks.adsense*` flag；維持 `enabled=false` 時不輸出版位

部署前需求：填 `adsenseClient` + 5 個 slot ID + 切 `enabled: true`（前提是 5-e 已完成）。

---

## 7. Blogger SEO（5-f 尚未完成）

⏳ **本階段未實作**。範圍：

- Blogger summary HTML 補 OG / JSON-LD（目前只有 canonical，5-a 已修）
- `copy-helper.txt` 補搜尋說明、自訂 URL slug 欄位（對應 Blogger 後台輸入欄位）
- 與 §3 的 GitHub canonical / og 對齊
- 涉及修改：`src/views/blogger/*.ejs`、`src/scripts/build-blogger.js`

---

## 8. SEO 驗證警告（5-g 尚未完成）

⏳ **本階段未實作**。範圍：

擴充 `src/scripts/validate-content.js`，補 SEO 必要欄位警告，例如：

- post.description 為空（影響 meta description / og:description）
- post.cover 為空但啟用 OG（無法產生 og:image）
- BlogPosting JSON-LD 必填欄缺漏（headline / datePublished / author）
- title 過長 / description 過長（搜尋引擎截斷）

目前 `validate-content` 只跑 4 條 category/tag warning + 6 條 promotion warning（4-g）。

---

## 9. 部署前檢查（中央化）

完整勾選清單見 `docs/checklists/seo-checklist.md`。**必須項目摘要**：

1. **site URL 換成正式**（`site.config.json` 的 `githubSiteUrl` / `bloggerSiteUrl` 不再是 `https://example.com`）
2. **GA4 啟用**：`ga4.config.json` 填正式 `measurementId` 並切 `enabled: true`
3. **AdSense 啟用**（如要顯示）：`ads.config.json` 填 `adsenseClient` + 5 個 slot ID + 切 `enabled: true`；前提是 5-e 已完成
4. **Build 順序**：`npm run build` 後再跑 `npm run build:sitemap`（vite build 會清空 dist/）
5. **0 warnings**：`npm run validate:content` / `npm run build:github` / `npm run build:blogger` / `npm run build:promotion` 全部 0 warning
6. **5-e / 5-f / 5-g 完成**（或明知不部署該功能）
7. **抽樣檢查 dist/ HTML head**：title / description / canonical / og:* / JSON-LD 為**正式 URL**，無 `example.com` 殘留
8. **抽樣檢查 dist/sitemap.xml**：所有 `<loc>` 為正式 URL
9. **抽樣檢查 dist/robots.txt**：`Sitemap:` 行為正式 URL

---

## 10. 相關檔案

| 類別 | 檔案 |
|---|---|
| 設定 | `content/settings/site.config.json` / `seo.config.json` / `ga4.config.json` / `ads.config.json` |
| 程式 | `src/scripts/build-github.js` / `src/scripts/build-sitemap.js` |
| SEO 模板 | `src/views/seo/{meta-tags,open-graph,canonical,json-ld}.ejs` |
| Tracking 模板 | `src/views/tracking/{ga4,ga4-events-helper}.ejs` |
| AdSense 模板 | `src/views/ads/*.ejs`（5-e 尚未完成） |
| Blogger SEO | `src/views/blogger/*.ejs` / `src/scripts/build-blogger.js`（5-f 尚未完成） |
| JS module | `src/js/modules/link-tracker.js` / `src/js/modules/ga4-events.js` |
| Checklist | `docs/checklists/seo-checklist.md` |
| 規範來源 | `CLAUDE.md` §6 Phase 5 |
