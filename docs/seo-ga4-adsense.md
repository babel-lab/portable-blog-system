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
| 5-e | AdSense partial 與版位（5-e-1~5-e-4 完整路線） | ✅ 完成 |
| 5-f | Blogger SEO（OG / JSON-LD / copy-helper 擴充）（5-f-1~5-f-4 完整路線） | ✅ 完成 |
| 5-g | validate-content severity / ERROR / WARNING（5-g-1~5-g-5 完整路線） | ✅ 完成 |
| 5-h | docs（本份） | ✅ 完成 |

⚠️ Phase 5-a~5-h 全部子階段已完成。部署前必須完成 §9「部署前檢查」全部項目（含換正式 URL / 啟用 GA4 / AdSense 等）。
5-e 已建立 enabled=false 安全路徑；正式啟用 AdSense 仍需提供 publisher id + 5 個 slot ID 並做獨立授權驗收（見 §6.7 / §6.8）。
5-g 已完成 validate-content severity 機制 + 6 條 ERROR + 12 條 WARNING（見 §8）。
5-f 已完成 Blogger 端 SEO 結構化輸出（JSON-LD / canonical body link / copy-helper SEO 區段 / publish-checklist SEO 勾選；見 §7）。

---

## 1. 系統定位

- 範圍：GitHub 靜態站的搜尋引擎標籤、sitemap、追蹤腳本、廣告版位
- 不在範圍：Blogger 平台層 SEO（5-f 已補結構化輸出 / canonical / copy-helper / publish-checklist；平台 theme 層 SEO 由 Blogger 後台處理）；CLAUDE.md §29「第一版不做」清單（自動發文 / View 數 / Like 數等）

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

## 6. AdSense（5-e）

GitHub 站 AdSense 版位的 partial 結構、接入位置、enabled gating 機制與部署前啟用流程。對應 commit：5-e-2 `f545f9f`、5-e-3 `bf6d90a`、5-e-4 `<本份 docs commit>`。

### 6.1 Partial 角色

| Partial | 職責 |
|---|---|
| `src/views/ads/adsense-slot.ejs` | 基底；接收 `{ slotKey, ads }` → 輸出 `<ins class="adsbygoogle">` + push script。3 重 gate：`ads.enabled === true` && `ads.adsenseClient` 非空 && `ads.slots[slotKey]` 非空 |
| `src/views/ads/adsense-post-top.ejs` | 文章頂部；forward `slotKey: 'postTop'` |
| `src/views/ads/adsense-post-middle.ejs` | 文章中段；partial 完成、本階段未接入（見 §6.5） |
| `src/views/ads/adsense-post-bottom.ejs` | 文章底部；forward `slotKey: 'postBottom'` |
| `src/views/ads/adsense-sidebar.ejs` | 側欄；partial 完成、本階段未接入（見 §6.6） |
| `src/views/ads/adsense-home-inline.ejs` | 首頁穿插；forward `slotKey: 'homeInline'` |
| `src/views/ads/adsense-head.ejs` | head 端 adsbygoogle.js loader；2 重 gate：enabled + adsenseClient |

### 6.2 接入位置

| 接入點 | 處理 |
|---|---|
| GitHub head loader | `src/scripts/build-github.js HEAD_PARTIALS` 加 `{ dir: 'ads', name: 'adsense-head' }`，沿 5-b/5-d 之 post-process 注入機制把 partial 結果注入 `</head>` 之前。**未動 base.ejs / head.ejs** |
| post-detail | `src/views/pages/post-detail.ejs` 在 `</header>` 後接 postTop slot；在 body div 後接 postBottom slot。雙重 gate：settings `ads.enabled === true` + frontmatter `post.blocks.adsenseTop`（resp. `adsenseBottom`） |
| home | `src/views/pages/home.ejs` 在 hero 與 latest 之間接 homeInline slot。單一 gate：settings `ads.enabled === true` |
| post-list / category / tag / 404 / design-system | **不接 AdSense**（CLAUDE.md §6 Phase 5 未指定；design-system 為 noindex 工具頁） |

### 6.3 settings 結構與 placeholder 狀態

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

- 5 個 slot key 與 partial 命名 1:1：postTop / postMiddle / postBottom / sidebar / homeInline
- 目前**全部 placeholder 狀態**（enabled=false / adsenseClient 空 / 5 slot 全空）
- enabled=false 路徑下，build 後 head 與 body 都**不出**任何 AdSense 標記

### 6.4 enabled=false 安全模式

3 重 gate 任一失敗 → partial 整段空輸出。

| 配置情境 | 行為 |
|---|---|
| `ads.config.json` parse error | 中斷 build（load-settings 階段） |
| `ads.config.json` 缺欄位 | 視同空，partial 靜默 disable |
| `enabled !== true` | 整段空（與 GA4 5-d 一致） |
| `adsenseClient` 空 | head loader 與 slot 都不出 |
| 對應 `slots[key]` 空 | 該 slot partial 不出（其他 slot 不受影響） |

設計與 GA4 5-d 一致：靜默 disable 而非 fail fast。

### 6.5 frontmatter `blocks.adsense*` 對應

| frontmatter flag | 對應 partial | 本階段是否 wire |
|---|---|---|
| `blocks.adsenseTop` | adsense-post-top.ejs | ✅ 5-e-3 已 wire 到 post-detail.ejs |
| `blocks.adsenseMiddle` | adsense-post-middle.ejs | ❌ 本階段**未 wire**（partial 已存在） |
| `blocks.adsenseBottom` | adsense-post-bottom.ejs | ✅ 5-e-3 已 wire 到 post-detail.ejs |

**postMiddle 為何不 wire**：post-detail.ejs 的 `<%- bodyHtml %>` 是已 render 完成的 markdown HTML 字串，沒有清晰的中段 anchor。要做真實 in-body 中段需要修改 `parse-markdown.js` 加分段 marker / shortcode。**屬非本階段範圍**；blocks.adsenseMiddle 在 frontmatter schema 保留，但 5-e-3 不引用。後續可擴充（需獨立階段處理 markdown 分段）。

### 6.6 sidebar 與 Blogger 未接入說明

**sidebar**：
- `src/views/layout/sidebar.ejs` 為 1 行 placeholder（5-e 開始時即無正式 sidebar 結構）
- 5-e 採 S1 不動 sidebar.ejs；adsense-sidebar.ejs partial 已完成，但**無頁面引用**
- 屬非本階段範圍；後續可擴充（需先設計 sidebar 元件再接入）

**Blogger**：
- 5-e 完全不動 `src/views/blogger/*.ejs` 與 `src/scripts/build-blogger.js`
- 理由：Blogger 平台後台已自管 AdSense（自動廣告 / 後台版位），模板插入會與後台版位重複
- 保留作者在 Blogger 後台手動 / 自動管理 AdSense 的彈性
- 屬非本階段範圍；Blogger AdSense 整合需獨立階段處理

### 6.7 部署前 AdSense 啟用流程

1. 申請 AdSense 並取得 publisher id（`ca-pub-XXXXXXXXXXXXXXXX`）與對應 slot id
2. 在 `content/settings/ads.config.json`：
   - `adsenseClient`: 填 publisher id
   - `slots.postTop / postBottom / homeInline`: 各填對應 slot id（這 3 個是 5-e-3 已 wire 的版位；postMiddle / sidebar 可留空待未來接入）
   - `enabled`: 切 `true`
3. 重 build：`npm run build`（prebuild + vite build）；之後跑 `npm run build:sitemap`（順序見 §4.4）
4. 抽樣檢查 `dist/posts/{slug}/index.html` head 含 `<script async src="...adsbygoogle.js?client=ca-pub-...">`、body 含 `<ins class="adsbygoogle">`
5. 部署
6. 在 AdSense 後台確認版位審核

### 6.8 enabled=true 驗收尚未做

5-e 全程（5-e-1 ~ 5-e-4）所有驗收均跑 enabled=false 安全路徑：
- partial 端 sanity check（disabled / enabled with id / enabled without id / head enabled / forward）已通過（5-e-2）
- build 端 enabled=false 安全輸出 grep 通過（5 條全 0 命中，5-e-3）

**enabled=true 整體 build 驗收尚未做**——需要：
- 正式 publisher id（`ca-pub-XXX`）
- slot id（至少 postTop / postBottom / homeInline 三個）
- 獨立授權階段暫改 ads.config.json + 還原（或於部署前驗證流程中執行）

屬非本階段範圍。

### 6.9 5-e 各子階段 commit 對應

| 子階段 | 範圍 | commit |
|---|---|---|
| 5-e-1 | 盤點（α 零修改、sidebar 採 S1） | 無 commit |
| 5-e-2 | AdSense partials（6 modified + 1 new = 7 個 ads/*.ejs） | `f545f9f feat: add adsense ejs partials` |
| 5-e-3 | build script wire + page templates wire（3 個檔案，20 insertions） | `bf6d90a feat: wire adsense disabled build path` |
| 5-e-4 | docs / checklist / 驗收說明 + CLAUDE.md §8 對齊 | 本份 commit |

---

## 7. Blogger SEO（5-f）

Blogger 端 SEO 結構化輸出與發布輔助。對應 commit：5-f-2 `867672a`、5-f-3 `4ec42bb`、5-f-4 `<feat commit>` + `<docs commit>`。

### 7.1 SEO 輸出策略總覽

| 元素 | 策略 |
|---|---|
| **JSON-LD** | in-body `<script type="application/ld+json">` 含 BlogPosting；Google 在 body 也 parse |
| **OG（og:title / og:description / og:image）** | **不在 body 寫 og:* meta**；改透過 `copy-helper.txt` [7]-[10] 區段給作者人工填 Blogger 後台 |
| **canonical** | 雙保險：5-a 解析 + Blogger theme 自動 head canonical + 5-f-2 in-body `<link rel="canonical">` |
| **Twitter cards** | 同 OG，走 copy-helper |

對齊原則：Blogger 平台 theme 自動處理大部分 SEO meta；模板層只補**結構化資料**（JSON-LD）與**輔助 canonical**；OG 屬人工確認，避免 in-body meta 引爭議。

### 7.2 Blogger 模板 SEO（5-f-2）

| 模板 | canonical body link | BlogPosting JSON-LD |
|---|---|---|
| `blogger-post-full.ejs` | ✅ | ✅ |
| `blogger-post-summary.ejs` | ✅ | ✅ |
| `blogger-redirect-card.ejs` | ✅ | ❌（純跳轉卡，無 BlogPosting 語意） |

JSON-LD 用 `<` escape `<`（防 `</script>` 注入），與 5-b `seo/json-ld.ejs` 一致。

### 7.3 helper（5-f-2）

`src/scripts/build-blogger.js`：

| Helper | 簽章 | 失敗 |
|---|---|---|
| `absolutizeBloggerCover(post, settings)` | post / settings → string \| null | cover 空 / bloggerSiteUrl 空且 cover 為相對路徑 → null |
| `buildBloggerJsonLd(post, canonicalUrl, settings, ogImage)` | → BlogPosting object \| null | canonicalUrl 缺 → null |
| `buildOgFields(post, canonicalUrl, ogImage)` | → `{ title, description, url, image, alt }` | 永遠回物件，缺欄位以空字串補 |

純函式、無 I/O / 無 console，不重構既有 `buildMeta` / `resolveCanonicalUrl`。

### 7.4 BlogPosting JSON-LD schema

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": "{canonicalUrl}",
  "headline": "{post.title}",
  "description": "{post.description || site.description}",
  "datePublished": "{post.date}",
  "dateModified": "{post.updated || post.date}",
  "author": { "@type": "Person", "name": "{post.author || site.author}" },
  "mainEntityOfPage": "{canonicalUrl}",
  "inLanguage": "{site.language}",
  "articleSection": "{categories[].name || post.category}",
  "image": "{ogImage}"  // 條件性，cover 有值時才出
}
```

`canonicalUrl` 已含 blogger→github UTM（5-a / Phase 3-e-3 解析），與 5-b GitHub canonical 對齊。

#### 7.4.1 Phase 9-g-g 新增欄位（landed）

per `docs/phase-9g-g-pre-plan.md`（Phase 9-g-g-b；commit `f5fb400`）之設計，以及 Phase 9-g-g-c / 9-g-g-d 之 source landings：

| 欄位 | 狀態 | @type / 結構 | 來源 |
|---|---|---|---|
| **`isPartOf`** | ✅ **landed**（Phase 9-g-g-c；commit `70fbf22`）| object `{ @type: "Blog", @id, name, url, inLanguage }`（永遠輸出）| `settings.site.{githubSiteUrl, bloggerSiteUrl, siteName, language}` + `post.primaryPlatform` |
| **`mentions`** | ✅ **landed**（Phase 9-g-g-d；commit `1d56f8a`）| array `[ { @type: "WebPage", name, url } ]`（條件式：non-empty 時才出；empty 時整個欄位不出）| `post.relatedLinks[]` + `post.otherLinks[]`（嚴格 pre-filter：title + url 非空）|

**Blogger / GitHub parity**：✅ 已完成。兩端 BlogPosting JSON-LD 新增欄位完全 mirror（per Phase 9-h article block parity 既有 pattern）。`isPartOf` / `mentions` 之 schema 結構 / @type / 欄位順序在兩端一致；唯一差異為 `isPartOf.@id` / `mentions[].url` 之具體 URL 依 platform 而異。

**設計詳情**：詳見 `docs/phase-9g-g-pre-plan.md` §5（isPartOf 設計）+ §6（mentions 設計）+ `docs/related-links-schema.md` §9.5（mentions / isPartOf 落地紀錄）。

**完整收尾紀錄**：詳見 `docs/phase-9g-g-completion-report.md`（含 §4 isPartOf 落地摘要 + §5 mentions 落地摘要 + §6 Blogger / GitHub parity 驗證 + §7 驗證摘要 + §9 下一步建議）。

#### 7.4.2 Phase 9-f-g 新增欄位（landed）

per `docs/phase-9f-g-pre-plan.md`（Phase 9-f-g-b；commit `10df61c`）+ Phase 9-f-g-c source landing（commit `b394e4f`）：

| 欄位 | 狀態 | @type / 結構 | 來源 |
|---|---|---|---|
| **`mainEntity`** | ✅ **landed**（Phase 9-f-g-c；commit `b394e4f`）| object `{ @type: "Book", name, author[]: [{@type: Person, name}], publisher: {@type: Organization, name}, datePublished?, isbn?, image?, bookEdition?, alternateName? }`（條件式：只在 `post.book` object + `book.mediaType` 缺省或 === `"book"` + `book.title` non-empty 時才出）| `post.book.{title, authors[], publisher, publishedYear, isbn, coverImage, volumeLabel, titleEn, originalTitle}`（嚴格 pre-filter：empty book.title 不出整個 mainEntity）|

**第一版範圍**：
- ✅ 只支援 `mediaType="book"`
- ❌ `mediaType="magazine"` / Periodical 延後至 **Phase 9-f-g2**
- ❌ DVD / YouTube / Netflix / Movie / TVSeries / VideoObject specific @type 全部延後；維持 mentions[].@type = WebPage
- ❌ 不接 library sameAs / @graph / author Person.sameAs / publisher Organization.url
- ❌ 不接 normalize-post-output；不新增 validate rules；不修改 fixtures / samples

**Blogger / GitHub parity**：✅ 已完成。兩端 BlogPosting JSON-LD 新增 mainEntity 完全 mirror（per Phase 9-h article block parity + Phase 9-g-g 既有 pattern）。we-media-myself2 兩端 byte-identical mirror 已 live verified（per Phase 9-f-g-d audit）。

**設計詳情**：詳見 `docs/phase-9f-g-pre-plan.md` §4-§7（支援範圍 / JSON-LD mapping / we-media-myself2 live target / 與 isPartOf / mentions 關係）。

**完整收尾紀錄**：詳見 `docs/phase-9f-g-completion-report.md`（含 §4 source landing 摘要 + §5 Book mapping 摘要 + §6 live verification 摘要 + §7 風險與 deferred + §8 Google Rich Results Test 作者 SOP + §9 後續建議）。

### 7.5 canonical 雙保險策略

1. **5-a 解析**（既有）：`resolveCanonicalUrl(post, settings)` 回傳含 UTM 的 absolute URL
2. **Blogger theme 自動 head canonical**（平台層）：通常指向 Blogger URL（不同於我們的 canonical）
3. **5-f-2 in-body link**（新）：`<link rel="canonical" href="...">` 在 article wrapper 內

三層各司其職：theme 處理 Blogger 平台路由、in-body link 給某些抓取工具 / RSS / 人工核對、5-a 解析輸出供 copy-helper 與 JSON-LD 使用。

### 7.6 copy-helper SEO 區段（5-f-3）

`blogger-copy-helper.ejs` 既有 [1]-[6] 區段保留；5-f-3 新增 [7]-[10]：

| 區段 | 內容 |
|---|---|
| [7] OG title | `ogFields.title`（fbTitle 優先 / fallback post.title）+ Blogger theme 對照提示 |
| [8] OG description | `ogFields.description` + 與 [3] 搜尋說明對照提示 |
| [9] OG image | URL + Alt（cover 空時印「（無 cover...）」）+ 1200×630 建議 |
| [10] canonical & JSON-LD 檢查 | canonical URL（含 UTM）+ Rich Results Test 連結 + redirect-card 模式特別說明 |

### 7.7 publish-checklist SEO 項目（5-f-4）

`blogger-publish-checklist.ejs` 既有「基本欄位 / 預覽 / 內容檢查（依模式）/ 發布後」區段保留；5-f-4 新增「SEO 檢查（5-f）」區段，含 4-6 條條件式勾選（依 bloggerMode）：
- canonical body link 已自動產出
- BlogPosting JSON-LD 已自動產出（redirect-card 模式跳過）
- Google Rich Results Test 已驗證
- copy-helper [7]-[10] 已對照 Blogger 後台輸入
- OG image / cover 已補或確認不需要

### 7.8 已知限制

- **placeholder URL** `https://example.com` 仍出現於 JSON-LD `mainEntityOfPage` / canonical link / copy-helper canonical URL；屬 5-a 同源策略，部署前必須換正式 URL
- **Blogger theme 自動 og** 與我們 in-body 標籤**不衝突**（多份 JSON-LD 各自被 Google parse；canonical 雙保險）
- **`blogger-meta-json.ejs` 為死檔**（保留模板未被引用）；實際 `dist-blogger/posts/{slug}/meta.json` 由 `buildMeta()` 函式直接寫入；本檔加註解標明
- **redirect-card 模式不含 JSON-LD**（純跳轉卡，無 BlogPosting 語意）；publish-checklist 條件式特別標明
- **OG image** 5-f 不在 body 寫 og:* meta；作者需手動到 Blogger 後台 / theme custom 確認 OG title / description / image
- **既有 `buildMeta()` schema** 5-f 未擴充加入 JSON-LD object / OG fields；屬獨立階段（meta.json schema 對齊規範對齊）

### 7.9 Blogger 發布流程（人工）

1. `npm run build:blogger` 產出 `dist-blogger/posts/{slug}/`
2. 開啟 `copy-helper.txt`，逐區複製到 Blogger 後台
3. 開啟 `publish-checklist.txt`，逐項勾選（含新增的 SEO 區段）
4. 將 `post.html` 內容複製到 Blogger 文章編輯器
5. 發布
6. 用 Google Rich Results Test 驗證（針對 BlogPosting JSON-LD）
7. 回填 frontmatter `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`
8. 重 build 後 `finalUrl`（promotion 用）會自動套正確 URL

---

## 8. validate-content 規則（5-g）

`src/scripts/validate-content.js` 提供 frontmatter / SEO / schema 一致性檢查。對應 commit：5-g-2 `486c9d1`、5-g-3 `39dd3fa`、5-g-4 `f671a89`、5-g-5 本份 docs commit。

### 8.1 severity 機制（5-g-2）

每筆問題含 `severity: 'error' | 'warning'`。`validateContent` 回傳 `{ issues, errors, warnings, errorCount, warningCount, count }`。`warnings` 欄位保留為 `severity:'warning'` 子集合，向後相容 build-github / build-blogger 既有 `printWarnings` 呼叫。

新增 `printIssues(issues)`：依 sourcePath 分組、條目前綴 `[ERROR]` / `[WARNING]`、結尾 `N error(s) / M warning(s) on K post(s)`。`printWarnings(arr)` 保留舊式 `N warning(s)` 格式，build script console 不變。

### 8.2 ERROR 規則（5-g-3，6 條）

| Type | 條件 | 觸發範圍 |
|---|---|---|
| `invalid-status` | status 不在 {draft, ready, published, archived} | 任何 status |
| `duplicate-slug` | 全集合掃描 ≥ 2 篇同 slug；每篇命中都加 ERROR | 任何 status |
| `missing-title` | title 為空 / 非字串 / trim 空 | ready / published |
| `missing-slug` | slug 為空 / trim 空 | ready / published |
| `missing-date` | date 為空 / trim 空 | ready / published |
| `invalid-date-format` | date 是字串但不符合 `^\d{4}-\d{2}-\d{2}$` | ready / published |

### 8.3 WARNING 規則

#### 8.3.1 5-g-4 新增 12 條（ready / published 觸發）

| Type | 條件 |
|---|---|
| `missing-description` | description 空 / trim 空 |
| `missing-category` | post.category 空 |
| `missing-cover` | cover 空 |
| `empty-tags` | tags 非 array 或過濾後 0 個 string entry |
| `long-title` | title.length > 60 |
| `long-description` | description.length > 160 |
| `long-search-description` | searchDescription.length > 200 |
| `invalid-site` | site 不在 {github, blogger} |
| `invalid-content-kind` | contentKind 不在 {post, tech-note, book-review, download, comic, life-note, page}（Phase 8-b-3 起：contentKind 為主欄位，舊 `type` 為 legacy frontmatter 欄位、由 load-posts 相容讀取） |
| `invalid-primary-platform` | primaryPlatform 不在 {github, blogger} |
| `invalid-canonical` | canonical 是字串、非空、非 auto、不符 `^https?://` |
| `invalid-publish-target-mode` | publishTargets.{x}.enabled=true 且 mode 不在 valid set（github: full/summary；blogger: full/summary/redirect-card） |

#### 8.3.2 既有 10 條 WARNING（不在 5-g-4 範圍動）

- 4 條 category/tag：`unknown-category` / `category-site-mismatch` / `unknown-tag` / `tag-site-mismatch`
- 6 條 promotion-*（4-g）：`promotion-message-missing` / `promotion-hashtags-empty` / `promotion-page-unknown` / `promotion-page-disabled` / `promotion-target-invalid` / `promotion-globally-disabled`

### 8.4 status 觸發策略對照

| status | invalid-status / duplicate-slug | 5-g-3 missing-* / invalid-date-format | 5-g-4 12 條 WARNING |
|---|---|---|---|
| ready / published | 觸發 | 觸發 | 觸發 |
| draft | 觸發 | 不觸發 | 不觸發 |
| archived | 觸發 | 不觸發 | 不觸發 |
| 不在合法集合 | invalid-status 觸發 | 不另觸發 | 不觸發 |

### 8.5 exit code 機制

| 情境 | exit code |
|---|---|
| `errorCount > 0`（main 模式） | **1**（`process.exit(1)`） |
| 只有 WARNING、無 ERROR | 0 |
| 無 issue | 0 |
| `loadSettings` / `loadPosts` 拋例外（檔案缺漏 / JSON parse / frontmatter parse） | 非 0（node 預設） |

### 8.6 build:github / build:blogger 互動

兩支 build script 維持向後相容：呼叫 `validateContent({...})` 取 `warnings` 欄位（severity:'warning' 子集），再走 `printWarnings(warnings)` 印舊式 `N warning(s)`。**ERROR 不會讓 build 中斷**——errors 只在 main 模式觸發 exit 1，build 流程仍正常輸出 dist 內容。

### 8.7 已知限制

- `invalid-status`：因 `loadPosts` 已過濾非 `{ready, published}` 文章，main 模式接到的 posts 通常已為合法 status；本規則實際命中機會低，但保留作 safety net
- 長度檢查用 `String.length`，emoji（surrogate pair）算 2 字；不引 grapheme 庫
- date 只檢正則格式，不檢日曆合法性（`2026-13-32` 會通過）
- 既有 10 條 WARNING 未加 status gate（屬規範對齊獨立階段；目前 loadPosts 預過濾使 de facto 只警告 ready/published）

### 8.8 驗收輸出範例

#### main 模式（npm run validate:content）— 4-a 樣本目前狀態
```
[validate-content] post: content/github/posts/20260504-github-pages-blog-planning.md
[validate-content]   - [WARNING] missing-cover
[validate-content] post: content/github/posts/20260504-portable-blog-system-mvp.md
[validate-content]   - [WARNING] missing-cover
[validate-content] 0 error(s) / 2 warning(s) on 2 post(s)
```
exit 0（warning-only）。2 條 missing-cover 為作者待處理項，不阻擋 build。

#### build 模式（build-github / build-blogger）— 向後相容路徑
```
[validate-content] post: content/github/posts/20260504-github-pages-blog-planning.md
[validate-content]   - missing-cover
[validate-content] 2 warning(s) on 2 post(s)
```
無 `[WARNING]` 前綴；dist 輸出照常。

### 8.9 5-g 各子階段 commit 對應

| 子階段 | 範圍 | commit |
|---|---|---|
| 5-g-1 | 盤點（α 零修改、4-a 樣本 frontmatter 確認） | 無 commit |
| 5-g-2 | severity 機制基礎建設 | `486c9d1 feat: add validate severity handling` |
| 5-g-3 | 6 條 ERROR 規則 | `39dd3fa feat: add frontmatter required field errors` |
| 5-g-4 | 12 條 WARNING 規則 | `f671a89 feat: add frontmatter quality warnings` |
| 5-g-5 | docs / checklist + 全 build 驗收 | 本份 commit |

---

## 9. 部署前檢查（中央化）

完整勾選清單見 `docs/checklists/seo-checklist.md`。**必須項目摘要**：

1. **site URL 換成正式**（`site.config.json` 的 `githubSiteUrl` / `bloggerSiteUrl` 不再是 `https://example.com`）
2. **GA4 啟用**：`ga4.config.json` 填正式 `measurementId` 並切 `enabled: true`
3. **AdSense 啟用**（如要顯示）：`ads.config.json` 填 `adsenseClient` + 對應 slot ID（5-e-3 已 wire postTop / postBottom / homeInline）+ 切 `enabled: true`
4. **Build 順序**：`npm run build` 後再跑 `npm run build:sitemap`（vite build 會清空 dist/）
5. **0 errors**：`npm run validate:content` 必須 `0 error(s)` 且 exit 0（warning 不阻擋部署但建議補；4-a 樣本目前 2 條 missing-cover）；`npm run build:github` / `build:blogger` / `build:promotion` 全部 exit 0
6. **Phase 5-a~5-h 全部完成**：5-e enabled=false 安全路徑已完成（啟用 AdSense 時做 enabled=true 驗收）；5-g validate-content severity / ERROR / WARNING 已完成；5-f Blogger SEO 結構化輸出已完成
7. **Blogger SEO 已驗收**：JSON-LD 通過 [Google Rich Results Test](https://search.google.com/test/rich-results)；canonical 對照正確；OG title / description 已對照 copy-helper [7]-[10] 區段
7. **抽樣檢查 dist/ HTML head**：title / description / canonical / og:* / JSON-LD 為**正式 URL**，無 `example.com` 殘留
8. **抽樣檢查 dist/sitemap.xml**：所有 `<loc>` 為正式 URL
9. **抽樣檢查 dist/robots.txt**：`Sitemap:` 行為正式 URL

---

## 10. 相關檔案

| 類別 | 檔案 |
|---|---|
| 設定 | `content/settings/site.config.json` / `seo.config.json` / `ga4.config.json` / `ads.config.json` |
| 程式 | `src/scripts/build-github.js` / `src/scripts/build-sitemap.js` / `src/scripts/validate-content.js`（5-g 提供 `validateContent` / `printIssues` / `printWarnings` API） |
| SEO 模板 | `src/views/seo/{meta-tags,open-graph,canonical,json-ld}.ejs` |
| Tracking 模板 | `src/views/tracking/{ga4,ga4-events-helper}.ejs` |
| AdSense 模板 | `src/views/ads/{adsense-slot,adsense-post-top,adsense-post-middle,adsense-post-bottom,adsense-sidebar,adsense-home-inline,adsense-head}.ejs`（5-e 完成 enabled=false 安全路徑） |
| Blogger SEO | `src/views/blogger/{blogger-post-full,blogger-post-summary,blogger-redirect-card,blogger-copy-helper,blogger-publish-checklist,blogger-meta-json}.ejs` / `src/scripts/build-blogger.js`（含 `buildBloggerJsonLd` / `absolutizeBloggerCover` / `buildOgFields` helper） |
| JS module | `src/js/modules/link-tracker.js` / `src/js/modules/ga4-events.js` |
| Checklist | `docs/checklists/seo-checklist.md` |
| 規範來源 | `CLAUDE.md` §6 Phase 5 |
