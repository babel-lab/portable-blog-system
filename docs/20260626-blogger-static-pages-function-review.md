# Blogger 系統靜態頁功能檢視與調整建議

> 文件名稱：**Blogger 系統靜態頁功能檢視與調整建議**
> 日期：**2026-06-26**
> 對象專案：`D:\github\blog-new\portable-blog-system`（portable-blog-system）
> 範圍：以 `src/views/**/*.ejs` 為 source of truth；`src/scripts/build-github.js` / `build-blogger.js` 為頁面產生與路由邏輯；`.cache/pages/**/*.html` 為**生成結果輔助檢視（generated artifact，可能 stale，不可直接修改）**。
> 排除：LearnOops（完全未檢視）、Phase 0 legacy 根目錄 `index.html`、`dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`（generated，非 source）。
> 性質：**檢視 + 文件輸出**。本文件未修改任何 source / content / settings / build / deploy / live service。

---

## 1. 封面

| 項目 | 內容 |
| --- | --- |
| 文件名稱 | Blogger 系統靜態頁功能檢視與調整建議 |
| 日期 | 2026-06-26 |
| 專案 | portable-blog-system（可搬家的本機資料夾型內容管理系統，第一版 MVP） |
| Source of truth | `src/views/**/*.ejs` |
| 頁面產生邏輯 | `src/scripts/build-github.js`（GitHub Pages）、`src/scripts/build-blogger.js`（Blogger HTML 匯出） |
| 生成結果輔助 | `.cache/pages/**/*.html`（Vite serve root；generated；可能 stale；**不可直接改**） |
| 排除 | LearnOops、根 `index.html`（Phase 0 legacy）、`dist*/` |
| baseline | HEAD `2c96ad9`、working tree clean、ahead/behind 0/0、`.git/index.lock` absent |

---

## 2. 檢視方法

### 2.1 為何本專案沒有 `/web/index.html`
本專案不採 `web/` 目錄慣例。前端入口由 **Vite MPA** 模式組裝，`vite.config.js` 的 `root` 指向 `.cache/pages`，並以 `**/*.html` glob 當作 rollup input。實際的頁面 HTML 由 `build-github.js`（`predev` / `prebuild` 自動執行）在 build 階段產生到 `.cache/pages/`，再由 Vite serve / build。因此沒有、也不需要 `web/index.html`。

### 2.2 為何不以根目錄 `index.html` 為入口
根目錄 `index.html` 是 **Phase 0 初始化骨架**遺留檔：
- 內含 `<%= siteName %>`（未被任何 build 流程渲染）、`Phase 0 初始化骨架` eyebrow、`onclick="alert('Phase 0 階段請先在 VS Code...')"`、被註解掉的連結。
- 其 nav（最新文章 / 分類 / Design System）與現行 `navigation.json`（首頁 / 文章 / 分類）**不一致**。
- Vite root 是 `.cache/pages`，**不是** repo root → 此檔不進 dev/build/deploy，是 orphan。
- 結論：以它為入口會再次誤判專案功能現況，故**排除**。

### 2.3 交叉盤點方法
1. `src/views/` 列出全部 EJS 模板（pages / layout / blogger / design-system / admin / ads / seo / tracking / promotion）。
2. `build-github.js` 的 `renderPage()` + `writeText(... PAGES_DIR ...)` 呼叫，確認**哪些模板真的被生成成頁面**與其路由。
3. `.cache/pages/**/*.html` 對照「目前實際生成出的頁面」（generated；可能 stale）。
4. `build-blogger.js` + `src/views/blogger/*` 確認 Blogger 匯出 HTML 的產生（手動貼上流程）。
5. content frontmatter（含 2026-06-26 funnel draft pair）確認 download / gated / pageType / indexing 後設資料。

### 2.4 三類頁面區分
- **Phase 0 legacy skeleton**：根 `index.html`（orphan，建議清理 / 隔離）。
- **dev-only admin**：`.cache/pages/admin/index.html`（僅 `mode==='dev'` 產生；prod build 前 `rm`；不進 sitemap / deploy；`noindex,nofollow`）。
- **部署頁**：`build-github.js` 生成、`vite build` → `dist/` → push gh-pages 的 GitHub Pages 頁；以及 `build-blogger.js` 產生、人工貼到 Blogger 後台的 HTML。

### 2.5 SEO / GA4 head 的特殊注入（重要維護注意）
`base.ejs` 的 `<head>` **只** include `head.ejs`，而 `head.ejs` 只輸出 `charset` / `viewport` / `title`。SEO meta / Open Graph / canonical / JSON-LD / GA4 / adsense-head **不在** `head.ejs` 內，而是由 `build-github.js` 的 `renderHeadPartials()`（`HEAD_PARTIALS` 清單）在 build 階段以「字串取代 `</head>`」**post-process 注入**。
→ 只看 `base.ejs` / `head.ejs` source 會**誤以為沒有 SEO/GA4**；真正來源是 `build-github.js:58-91` 的 `HEAD_PARTIALS`。這是本專案最易誤判的維護點。

---

## 3. 頁面 / 模組清單

| # | 頁面 / 模組 | source template | content / script | generated page（`.cache/pages/`） | 類型 | 納入檢視 | 備註 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 首頁 | `pages/home.ejs` | build-github `renderPage` | `index.html` | 部署頁 | ✅ | MVP 精簡卡片 |
| 2 | 文章列表 | `pages/post-list.ejs` | build-github | `posts/index.html` | 部署頁 | ✅ | 無篩選/排序/分頁 |
| 3 | 文章詳細 | `pages/post-detail.ejs` | build-github | `posts/{slug}/index.html` | 部署頁 | ✅ | 功能最完整 |
| 4 | 分類頁 + 索引 | `pages/category.ejs` / `category-list.ejs` | build-github | `categories/**` | 部署頁 | ✅ | — |
| 5 | 標籤頁 + 索引 | `pages/tag.ejs` / `tag-list.ejs` | build-github | `tags/**` | 部署頁 | ✅ | — |
| 6 | Design System | `design-system/index.ejs` + 6 subs | build-github（`designSubpages` G-02~G-07） | `design-system/**` | 部署頁 | ✅ | layouts/forms-search 未生成 |
| 7 | 404 | `pages/404.ejs` | build-github | `404.html` | 部署頁 | ✅ | 極簡，堪用 |
| 8 | Admin dev-only | `admin/index.ejs` | build-github（僅 dev）/ `load-admin-posts.js` | `admin/index.html`（dev） | dev-only | ✅ | read-only |
| 9 | Blogger full | `blogger/blogger-post-full.ejs` | build-blogger | （Blogger 後台手貼） | 匯出 | ✅ | — |
| 10 | Blogger summary / redirect-card | `blogger/blogger-post-summary.ejs` / `blogger-redirect-card.ejs` | build-blogger | 手貼 | 匯出 | ✅ | 導流卡 |
| 10b | Blogger home/category index + copy-helper + meta-json + publish-checklist | `blogger/blogger-{home-index,category-index,copy-helper,meta-json,publish-checklist}.ejs` | build-blogger | 手貼 / 輔助檔 | 匯出 | ✅（概覽） | 發布輔助 |
| 11 | Download entry / gated | content `20260626-bopomofo-practice-cards-{entry,access}.md`（draft） | — | 無（draft 不輸出） | 內容（推定） | ✅ | 見 §5.11 |
| 12 | Platform policy / indexing / sitemap / listings | `page-type-robots.js` / `platform-policy-effective.js` / `include-in-{sitemap,listings}.js` + seo partials | build-github / build-sitemap | robots meta（注入） | 後設資料（推定） | ✅ | 見 §5.12 |
| 13 | GA4 tracking | `tracking/ga4.ejs` / `tracking/ga4-events-helper.ejs` + inline `data-ga4-*` | build-github HEAD_PARTIALS / `js/modules/link-tracker.js` | head 注入 | 追蹤（推定） | ✅ | 見 §5.13 |
| 14 | Header / Nav / Footer / Mobile Drawer / Article Bottom Nav | `layout/{header,nav,footer,mobile-drawer,article-bottom-nav}.ejs` | build-github base.ejs | 各頁 | 部署頁 | ✅ | footer 見 §5.14 |
| — | about / search | `pages/about.ejs` / `pages/search.ejs` | **未被 build-github 生成** | 無 | stub | ➖ | 空檔，未接線 |
| — | breadcrumb / sidebar / forms-search / DS layouts | `layout/breadcrumb.ejs` / `layout/sidebar.ejs` / `design-system/forms-search.ejs` / `design-system/layouts.ejs` | 未 include / 未生成 | 無 | stub | ➖ | 空檔或未接線 |

**排除清單（不納入功能檢視）：**
- 根 `index.html` — Phase 0 legacy skeleton（orphan）。
- `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` — generated 產物，非 source。
- `node_modules/` — 依賴。
- `content/validation-fixtures/` — validator fixtures，非現行功能頁。
- LearnOops — 不在本專案範圍，完全未檢視。

---

## 4. 問題總表

| # | 功能模組 | 頁面 | source 路徑 | generated 路徑 | 問題類型 | 目前靜態頁狀況 | 為何需要調整 | 建議調整方式 | 優先級 | 影響範圍 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | Footer | 全站 footer | `src/views/layout/footer.ejs` | 各頁 footer | 設定與呈現落差 | footer.ejs 只輸出 copyright + "Built for..."；**完全未讀** `footer.config.json` 的 `links`（隱私權政策 / 聯盟揭露） | AdSense / 聯盟行銷站台通常需可見的隱私權 / 揭露連結；設定已存在卻未渲染 | footer.ejs 讀 `footer.config.json.links` 並渲染；或明確記錄「Phase 6 再做」 | Medium | F / D / 法遵 |
| P2 | 揭露頁 | `/privacy/` `/affiliate-disclosure/` | （無模板） | 無 | 缺頁 | `footer.config.json` 指向 `/privacy/` 與 `/affiliate-disclosure/`，但**無對應模板、build 未生成** | 一旦 P1 把 links 渲染出來即成 dead link（404） | 補頁面模板 + build route，或先不渲染 links | Medium | F / D |
| P3 | Download funnel 前端呈現 | gated download / entry CTA | `pages/post-detail.ejs`、`blogger/blogger-post-full.ejs` | post-detail（github）/ 手貼（blogger） | 模板缺漏（schema 已 lock） | `gatedDownload`（google-form / formEmbedUrl / postSubmitResource）與 `downloadFunnel`（role / targetGatedPage / ctaEventName）**無任何模板渲染**；entry CTA 與 Form 嵌入僅靠 markdown body placeholder | funnel metadata 已 spec-lock + validator 把關，但無 render 路徑 → 內容定稿後仍無法由系統輸出 gated 流程 | 另開「下載功能 / funnel renderer」phase 實作（per CLAUDE.md deferred） | Medium | C / D / E |
| P4 | Blogger gated download | Blogger full 模板 | `blogger/blogger-post-full.ejs` | 手貼 | 模板缺漏 | Blogger full 只有 `download.fileUrl` 直接下載 box；**無 gated / Google Form / post-submit** 分支 | funnel 內容 `primaryPlatform: blogger`、`blogger.enabled: true`，但 Blogger 模板無對應 render | 同 P3 funnel renderer phase；Blogger NO INDEX 仍須後台手動 | Medium | E / C |
| P5 | 根 legacy index.html | 根入口 | `index.html` | （不進 build） | legacy / 誤判風險 | Phase 0 骨架，nav 與現況不一致，orphan | 易被誤當入口；維護者誤判 | 清理或移到 `docs/legacy/` 隔離（另開 phase；本次不動） | Low~Medium | A / D |
| P6 | 列表頁互動 | 文章列表 / 分類 / 標籤 | `pages/{post-list,category,tag}.ejs` | 對應頁 | 功能缺漏（多為 by-design） | 無篩選 / 排序 / 分頁 / 狀態標籤；純列表 | 文章量增加後瀏覽性下降 | 第一版可不做（MVP）；量大後再評估分頁 | Low | F / D |
| P7 | 導覽一致性 | header nav | `layout/nav.ejs` / `navigation.json` | 各頁 | 導覽不一致 | nav 只有 首頁 / 文章 / 分類；**標籤索引（/tags/）與 Design System 已存在卻不在 nav** | 使用者無從 nav 到達標籤索引 | 視意圖在 `navigation.json` 補 `/tags/`（DS 通常刻意不放 nav） | Low | B / D |
| P8 | 空 stub 模板 | about / search / breadcrumb / sidebar / DS layouts·forms-search | 對應 `.ejs` | 多數無生成 | 未實作（by-design） | 檔案存在但為空註解；search/about 未接 build route | 屬 Phase 1 後 / Phase 2 範圍；目前不誤導使用者（無連結指向） | 文件記錄即可；依 CLAUDE.md 分階段 | Low | D / G |
| P9 | head.ejs SEO 可見性 | 全站 head | `layout/head.ejs` / `base.ejs` | 注入後 head | 維護誤判風險 | source 看不出有 SEO / GA4；實際由 build-github `HEAD_PARTIALS` 注入 | 維護者只讀 base/head 會誤判「SEO 缺失」 | 在 head.ejs 加註解指向 `HEAD_PARTIALS`（docs 已記錄） | Low | F / J |
| P10 | 文章頁區塊 vs §17 規格 | 文章詳細 | `pages/post-detail.ejs` | post detail | 規格落差 | §17 列 Breadcrumb / TOC / Sidebar / Social Follow / Prev-Next；目前 Breadcrumb / Sidebar / TOC / Social Follow 未實作（Prev/Next/Back 已實作為 article-bottom-nav） | 與 CLAUDE.md §17 理想版型有差距 | 屬 Phase 2/6；非阻斷；文件記錄 | Low | D / H |

---

## 5. 各頁 / 各模組詳細檢視

### 5.1 首頁 `pages/home.ejs`
- **用途**：站台 hero + 最新文章卡片。
- **可互動元素**：文章卡片連結（`/posts/{slug}/`）、（ads.enabled 時）home inline AdSense、header/drawer 導覽。
- **應補 / 缺漏**：CLAUDE.md §18 列「推薦文章 / 標籤區 / 社群回導 / 分類入口」；目前首頁僅 hero + 最新文章 + （條件）AdSense。其餘屬 MVP 未做。
- **不一致**：home 卡片只讀 title / description / slug（無 cover / titleEn），與 post-list 卡片欄位不同 —— 已於模板註解標明為刻意精簡，非 bug。
- **建議**：維持 MVP；若要強化首頁，另開 phase 補推薦 / 分類入口 / 社群回導。

### 5.2 文章列表 `pages/post-list.ejs`
- **用途**：全部 ready/published 文章列表。
- **可互動元素**：卡片標題連結、cover 圖（lazy）。
- **缺漏**：無搜尋 / 篩選 / 排序 / 分頁 / 狀態標籤 / 操作按鈕（P6）。`contentKind` / `excerpt` 未顯示（模板註解標明不新增）。
- **Empty state**：✅ 有「目前沒有可顯示的文章。」
- **建議**：MVP 可接受；分頁待文章量成長後評估。

### 5.3 文章詳細 `pages/post-detail.ejs`
- **用途**：GitHub Pages 文章主頁，功能最完整。
- **可互動元素 / 區塊**：6 個 AdSense anchor（default-safe zero-byte）、cover、book photo（book-review guard）、affiliate top/bottom（resolved links + GA4 attrs）、article body、**download box（`download.fileUrl`）**、**download landing 分支（`download.landingPage===true`）**、related/other links（GA4 + cross-site UTM）、hashtags、文章底部導覽（prev/next/home）。
- **缺漏 / 落差**：
  - download landing 分支讀的是 `download.landingPage`，**與 2026-06-26 funnel 的新 schema（`pageType: gated_download` + `gatedDownload`）不對齊**（P3）。
  - §17 的 Breadcrumb / TOC / Sidebar / Social Follow 未實作（P10）。
- **狀態處理**：Optional 區塊皆有 guard，資料缺漏不輸出空殼（符合 §17）。
- **建議**：funnel renderer 另開 phase；其餘 MVP 可接受。

### 5.4 分類 / 標籤頁
- **用途**：`category.ejs` / `tag.ejs` 列該分類/標籤文章；`category-list.ejs` / `tag-list.ejs` 為索引（含文章數 count）。
- **可互動元素**：文章卡片連結、索引連結（含 `（count）`）。
- **缺漏**：同 P6（無篩選/排序/分頁）。
- **Empty state**：✅ 皆有「此分類/標籤目前沒有可顯示的文章。」
- **一致性**：與 post-list 卡片結構一致（好）。

### 5.5 Design System
- **用途**：G-01 首頁 + G-02~G-07（Colors / Spacing / Typography / Buttons / Cards / Article Components）。
- **生成**：`build-github.js` `designSubpages` 明列 6 子頁；以 `buildSeoNoindex` 標 noindex。
- **缺漏**：`design-system/layouts.ejs` 與 `design-system/forms-search.ejs` **存在但不在 `designSubpages`，未生成**（P8）。
- **建議**：若要展示 layouts / forms，補進 `designSubpages`；否則視為未來頁。

### 5.6 404 `pages/404.ejs`
- 標題 + 說明 + 回首頁連結。堪用；無多語 / 搜尋建議（非必要）。

### 5.7 Admin dev-only `admin/index.ejs`
- **用途**：本機 dev-mode read-only dashboard（`noindex,nofollow`；prod build 不產出）。
- **可互動元素**：in-page anchor nav、Posts 搜尋 / 篩選（status / channel / sourceSite / completeness / fbBadge / contentKind / category / validation）/ 排序、row 展開 detail、commerce snippet 勾選 + role/labelOverride 產生 YAML、dry-run editor + static payload preview。
- **刻意 disabled（非 bug，by-design per CLAUDE.md 紅線）**：
  - Commerce 「Copy YAML」按鈕 `disabled aria-disabled="true"`。
  - Apply 按鈕 `.apply-disabled` 永久 disabled。
  - payload preview 為 readonly textarea / `<pre>`；無 fetch / write path。
- **判定**：這些 disabled 元素**符合**「ADMIN 不是後台 CMS、無寫入路徑」的設計意圖；不應視為「假按鈕」缺陷。唯一須持續把關：未來不可在未開 phase + explicit approval 下啟用任何 Apply / write。
- **輸入欄位**：搜尋框 / select / snippet 勾選與 labelOverride 為**真實可輸入**（純前端字串組裝，產生可複製文字），非「做成無法輸入」。

### 5.8~5.10 Blogger 模板
- **full**（`blogger-post-full.ejs`）：canonical + JSON-LD（inline）、header、book photo、affiliate（legacy links + dual-block `blocks[]`，Blogger-only）、body、**download box（僅 `download.fileUrl`）**、related/other links（含 reverse UTM 預處理）、hashtags、beforeRelatedLinks AdSense anchor。**無 gated download / Google Form / post-submit 分支（P4）**。
- **summary**：description + CTA（canonical，UTM）+ hashtag；不渲染全文（避免外洩）。✅ canonical 缺漏有 fallback 提示文案。
- **redirect-card**：標題 + description + 大 CTA。✅ canonical 缺漏有提示。
- **發布輔助**：copy-helper / meta-json / publish-checklist / home-index / category-index 為手動發布流程輔助（符合 §3 手動貼上定位）。
- **一致性**：full 的 affiliate / download / related-links markup 與 GitHub post-detail mirror（class 名一致）。

### 5.11 Download entry / gated（funnel content；推定來源 = content frontmatter + markdown body）
- **推定來源**：`content/blogger/posts/20260626-bopomofo-practice-cards-entry.md`（`downloadFunnel.role: entry`、`targetGatedPage`、`ctaEventName: click_all_download`、`pageType: article`、index）與 `...-access.md`（`pageType: gated_download`、`role: gated_page`、`gatedDownload.mechanism: google-form`、`formEmbedUrl: ""`、`postSubmitResource: drive-link`、`noindex-follow`、不進 sitemap/listings）。皆 `status: draft` / `draft: true` / `github.enabled: false` / `blogger.enabled: true`。
- **流程現況**：entry「取得下載」CTA、gated「Google Form 嵌入 / 表單送出後顯示」**全為 markdown body placeholder**；無模板把 `gatedDownload` / `downloadFunnel` 轉成實際 form embed / CTA / post-submit UI。
- **落差（P3 / P4）**：
  - schema 已 spec-lock + validator 多 slice 把關（required-combo / robots-safety / reciprocity 等），但**前端 render = deferred**。
  - GitHub post-detail 的 landing 分支用舊欄位 `download.landingPage`，不吃新 funnel schema。
  - Blogger full 無 gated 分支。
  - Blogger NO INDEX 須 Dean 於 Blogger 後台「自訂 robots 標頭標記」**手動**設定（系統無法 inject Blogger head）。
- **判定**：屬 documented deferred；非 bug，但「內容已存在、輸出未實作」是須讓 Dean 知道的關鍵落差。

### 5.12 Platform policy / indexing / sitemap / listings
- **呈現路徑**：GitHub robots meta 由 `page-type-robots.js` / `platform-policy-effective.js` 推導 → seo partials（`HEAD_PARTIALS`）注入 head；sitemap 由 `build-sitemap.js` 依 `includeInSitemap` + pageType 決定；listings 由 `include-in-listings.js`。
- **後設資料一致性**：funnel draft 的 `seo.indexing` / `includeInSitemap` / `includeInListings` / `platformPolicy.{blogger,github,future}` 已對齊（gated = noindex / 不進 sitemap / 不進 listings；entry = index）。
- **已知不對稱（documented）**：download pages noindex + 不進 sitemap，但預設仍進 listings；唯一受影響 live post = `content/github/posts/20260504-portable-blog-system-mvp.md`；MVP listing intent = hold（待 Dean 決定，**不**主動加 validator / 欄位）。
- **Blogger 維度**：Blogger head 無法由系統注入 robots → NO INDEX 為人工後台動作（前端模板無此呈現）。

### 5.13 GA4 tracking
- **head**：`tracking/ga4.ejs` 經 `HEAD_PARTIALS` 注入；**雙條件 + prod gate**（`isProdBuild` && `ga4.enabled` && measurementId 非空）→ dev 不輸出 gtag。
- **inline events**：affiliate CTA（`click_affiliate_cta`）、related（`click_related_link`）、other（`click_other_link`）、article bottom nav（`click_other_link` + `click_area=article_bottom_nav` + `nav_direction`）等以 `data-ga4-*` 屬性標記，由 `js/modules/link-tracker.js` delegated listener 送出。
- **一致性**：篩文章底部導覽紅線 = `click_other_link` **加** `click_area=article_bottom_nav` 雙條件（不可單看 event）。
- **判定**：GA4 為 build-time 注入 + 前端 attr，無「假按鈕」；measurementId 以遮罩呈現於 Admin。

### 5.14 Header / Nav / Footer / Mobile Drawer / Article Bottom Nav
- **header**：brand 連結 + menu button（預設 `hidden`，JS 控制）+ nav include。
- **nav / mobile-drawer**：皆讀 `navigation.json`（首頁 / 文章 / 分類）。**標籤索引、Design System 未在 nav**（P7）。
- **footer（P1）**：`footer.ejs` 只輸出 `© {year} {siteName}. Built for...`；**未讀** `footer.config.json` 的 `links`（隱私權政策 `/privacy/`、聯盟揭露 `/affiliate-disclosure/`），也無社群連結。CLAUDE.md §6 Phase 6 要求 footer 含隱私權 / 聯盟揭露 / 聯絡 / 社群 → 未達成。對應頁面亦未生成（P2）。
- **article-bottom-nav**：prev/next/home，GA4 attr 齊全，href 由 slug 推導（無 `href="undefined"` 風險）。✅

---

## 6. 跨頁一致性問題

| 維度 | 觀察 | 評估 |
| --- | --- | --- |
| 命名一致性 | `lab-` prefix + BEM 全站一致；GitHub post-detail 與 Blogger full 的 affiliate / download / related-links class 名 mirror | ✅ 良好 |
| 欄位一致性 | post-list / category / tag 卡片欄位一致；home 卡片刻意精簡（少 cover/titleEn） | 🟡 刻意差異，已註解 |
| 按鈕一致性 | 前台 CTA（lab-button）一致；Admin 的 disabled Copy/Apply 為 by-design | ✅ / 🟡 by-design |
| 狀態一致性 | 列表頁皆有 empty state；無 loading/error/toast（靜態站，多數不需要） | ✅（靜態站合理） |
| 導覽一致性 | nav/drawer 共用 navigation.json（一致）；但缺標籤/DS 入口；root legacy index.html nav 與現況不符 | 🟡 P7 / P5 |
| 平台政策一致性（Blogger / GitHub / future） | funnel frontmatter 三平台 indexing/listings 對齊；Blogger NO INDEX 須人工後台 | 🟡 系統限制（已 documented） |
| Admin / content / download / indexing / GA4 追蹤一致性 | Admin 以 read-only 呈現各面 surface；download funnel schema 已驗證但前端未 render（P3） | 🟡 render deferred |
| source template ↔ generated page 一致性 | `.cache/pages` / `dist/` 為 generated，可能 stale；含 admin/index.html（dev artifact）；SEO head 由 build 注入（source 不可見，P9） | ⚠️ 注意 §10 |

---

## 7. 優先修正建議

### High
- 無「阻斷生產」級問題。目前生產線（GitHub Pages live、Blogger 手動發布、GA4 live、validator baseline）穩定，working tree clean。

### Medium（建議排程；多屬「另開 phase」）
- **P1 + P2 Footer 揭露**：AdSense / 聯盟站台的隱私權 / 聯盟揭露屬合規關切。建議：先決定是「footer.ejs 渲染 config.links + 補頁」或「Phase 6 再做」，二擇一並記錄，避免 config 與頁面長期不同步。
- **P3 + P4 Download funnel renderer**：內容草稿已存在、schema 已 lock，但無 render 路徑。屬 **可等下載功能階段修正**；建議明確列為「funnel renderer phase」待 Dean 內容定稿後啟動。

### Low（文件 / 規格先補即可；多為 by-design 或 Phase 2+）
- **P5 root legacy index.html**：建議未來清理 / 隔離至 `docs/legacy/`（降低誤判）。
- **P6 列表頁分頁 / 篩選**：MVP 不做，量大再評估。
- **P7 nav 缺標籤 / DS**：依內容意圖決定是否補 `/tags/`。
- **P8 空 stub（about/search/breadcrumb/sidebar/DS layouts·forms-search）**：屬 Phase 1 後 / Phase 2；文件記錄即可。
- **P9 head.ejs SEO 可見性**：建議於 head.ejs 加註解指向 `HEAD_PARTIALS`（本文件已記錄）。
- **P10 §17 版型落差（Breadcrumb/TOC/Sidebar/Social Follow）**：Phase 2/6 範圍。

> 優先順序原因：Medium 項涉及合規（揭露）或「內容已備但無法輸出」（funnel），對外溝通與內容上線有實際影響；Low 項多為 CLAUDE.md 明列「第一版不做 / 分階段」或純維護註記，不影響現有生產線。

---

## 8. Open Questions（需 Dean 確認）
1. **Footer 揭露**：要在 footer 渲染 `footer.config.json` 的隱私權 / 聯盟揭露連結並補對應頁，還是維持「Phase 6 再做」？（影響 P1/P2 優先級）
2. **Download funnel renderer**：funnel 內容定稿後，gated download 前端流程要由系統模板 render（GitHub）＋ Blogger 模板支援，還是 Blogger 端完全靠手貼 markdown + 後台 Google Form embed？（影響 P3/P4 範圍）
3. **GitHub funnel**：input packet 標 `future_possible_not_active`；未來是否要在 GitHub Pages 端也提供 funnel（目前 `github.enabled: false`）？
4. **nav 標籤入口**：標籤索引 `/tags/` 是否要進主選單？Design System 是否刻意不放 nav？
5. **root legacy index.html**：是否同意未來另開 phase 清理 / 隔離？
6. **MVP download listing 不對稱**：`portable-blog-system-mvp.md`（download，noindex 但進 listings）的內容意圖 = 維持現狀 hold，還是要排除於 listings？

---

## 9. Assumptions（檢視時的合理假設）
1. 以 `git status` clean + Vite root = `.cache/pages` 推斷：根 `index.html` 不進 build，為 orphan legacy。
2. `.cache/pages` / `dist/` 反映「上一次 build」狀態，可能 stale；本次未 build，故以 source + build script 邏輯為準。
3. funnel 兩篇為 draft（`draft: true`）→ 不進 production listing/sitemap；前端目前不會渲染。
4. Admin 的 disabled Copy/Apply 與 readonly 欄位是**刻意 by-design**（依 CLAUDE.md 紅線「無寫入路徑」），非殘缺。
5. SEO/GA4/adsense-head 由 `build-github.js` `HEAD_PARTIALS` 注入；故 head.ejs 精簡屬正常。
6. footer.config.json 指向的 `/privacy/` `/affiliate-disclosure/` 目前無模板、build 未生成（依 build-github renderPage 清單與 `.cache/pages` 推定）。
7. 本檢視未執行 build / dev server，故未實際開瀏覽器驗證互動行為；判斷基於模板與 build script 靜態閱讀。

---

## 10. Legacy / Generated Artifact 注意事項
- **根 `index.html`（Phase 0 legacy）**：orphan；nav 與現況不一致；含未渲染 `<%= siteName %>` 與 `alert()`。**不可**當入口；建議未來清理 / 隔離（本次不動）。
- **`.cache/pages/` stale 風險**：Vite serve root；由 `build-github.js` 生成；可能與最新 source 不同步；**含 `admin/index.html`（dev artifact）**，prod build 前會被 `rm`。**不可直接編輯**（改 source `.ejs` 後重 build 才正確）。
- **`dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`**：build / 匯出產物，非 source；不作為檢視或修改標的（改這些不會回寫 source，且會被下次 build 覆蓋）。
- **SEO head 注入（P9）**：`base.ejs` / `head.ejs` source **看不到** SEO/GA4；真正來源是 `build-github.js` 的 `HEAD_PARTIALS`（§2.5）。維護者勿據 source 誤判 SEO 缺失。
- **Blogger 輸出**：以 Blogger 平台貼上後預覽為準；repo 不完整模擬 Blogger；Blogger head（robots/NO INDEX）無法由系統注入。

---

*本文件為 read-only 檢視輸出，未修改任何 source / content / settings / build / deploy / live service，未碰 LearnOops。*
