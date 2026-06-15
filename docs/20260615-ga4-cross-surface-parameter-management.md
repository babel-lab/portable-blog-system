# GA4 Cross-Surface Parameter Management — GitHub Pages + Blogger

- **Phase**：`20260615-am-8-ga4-cross-surface-parameter-management-docs-only-a`
- **日期**：2026-06-15
- **性質**：**docs-only**（不改 source / 不改 GA config / 不 build / 不 deploy / **不實作 Blogger JS listener**）
- **baseline**：`main` HEAD == origin/main == `e958a03`（`docs(ga4): add custom dimensions checklist`）；working tree clean

> 目的：定義 **GitHub Pages 與 Blogger 共用**之 GA4 article bottom nav（及未來站內 click tracking）event / parameter 命名、Blogger 手動回補格式、報表切分方式，以及 Blogger JS listener 未實作之邊界。
> 新建 BLOG 系統的責任 = **統一管理 GA4 event / parameter 命名與範例**，讓使用者拿同一套參數去手動回補 Blogger。

---

## 1. Purpose / scope

- ✅ 定義 GitHub Pages + Blogger **共用**之 GA4 event / parameter 命名與範例。
- ✅ 提供 Blogger **手動回補**（manual backfill）之 `data-ga4-*` snippet 格式。
- ✅ 定義報表以 `surface` 切分 `github_pages` vs `blogger`。
- ❌ **不實作 Blogger JS listener**（本階段；使用者之後另開需求）。
- ❌ **不驗證 AdSense iframe click**；❌ **不驗證 Auto Ads**；❌ **不驗證 affiliate revenue**。
- ❌ **不改 source / GA config**；❌ **不 deploy**。

### 1.1 使用者決策（本 phase 依據）

1. GitHub Pages 與 Blogger 未來**都會**有文章底部「上一篇 / 下一篇 / 回首頁」。
2. GitHub Pages 已由系統產生 GA4 data attributes 並送出 `click_other_link`。
3. Blogger 文章底部連結之 GA4 data attributes，由使用者**之後手動回補**。
4. 系統責任 = **統一管理命名與範例**（單一權威來源）。
5. Blogger 若缺 JS listener / gtag click handler → 使用者**另開需求**；本階段不實作 Blogger JS。
6. 報表須能用 `surface` 區分 `github_pages` / `blogger`。

---

## 2. Cross-surface principle（跨平台原則）

- **event name 一致**：兩平台一律 `data-ga4-event="click_other_link"`（不為 Blogger 另立 event 名；避免切碎 GA4 dimension）。
- **click_area 一致**：article bottom nav 一律 `click_area="article_bottom_nav"`。
- **nav_direction 一致**：`previous` / `next` / `home`（值完全相同）。
- **用 `surface` 區分平台**：
  - `github_pages`（系統產生）
  - `blogger`（使用者手動回補）
- **報表切分維度**：以 `surface + click_area + nav_direction + post_slug + target_slug` 切分（見 §7）。

> 核心：**只有 `surface` 與各 slug / url / label 值不同；event 名與結構性 param（click_area / nav_direction）兩平台完全一致**。如此 GA4 後台同一個 `click_other_link` event + `click_area=article_bottom_nav` 即可跨平台分析，再用 `surface` 維度拆 github_pages vs blogger。

---

## 3. Canonical parameter set for article bottom nav

| parameter（`data-ga4-param-*`）| required? | GitHub Pages example | Blogger example | description | event usage | notes |
|---|---|---|---|---|---|---|
| `data-ga4-event`（event name）| ✅ | `click_other_link` | `click_other_link` | GA4 event 名；兩平台一致 | 全 nav link | 不為 Blogger 另立名 |
| `surface` | ✅ | `github_pages` | `blogger` | 點擊來源平台 | 全 nav link | **唯一**用來區分平台之參數 |
| `click_area` | ✅ | `article_bottom_nav` | `article_bottom_nav` | 點擊區塊 | 全 nav link | 與 otherLinks aside（`placement=other_links`）區分 |
| `nav_direction` | ✅ | `previous` / `next` / `home` | `previous` / `next` / `home` | 導覽方向 | 全 nav link | 值完全一致；3 值極穩定 |
| `post_slug` | ✅ | `github-pages-blog-planning` | `CURRENT_POST_SLUG` | 當前（來源）文章 slug | 全 nav link | Blogger slug 是否同 GitHub → §9 D2 |
| `target_slug` | ✅ | `portable-blog-system-mvp` / `home` | `TARGET_POST_SLUG` / `home` | 目標文章 slug 或 `home` | 全 nav link | home link 固定 `home` |
| `target_url` | ✅ | `/portable-blog-system/posts/portable-blog-system-mvp/` | `https://babel-lab.blogspot.com/.../<slug>.html` | 目標 href（rendered）| 全 nav link | ⚠️ 高 cardinality；Blogger 為實際 Blogger URL |
| `link_label` | ✅ | `Portable Blog System MVP 開發筆記` / `回首頁` | `上一篇文章標題` / `回首頁` | 連結可見文字 / 目標標題 | 全 nav link | label 用標題或固定文字 → §9 D3 |

> required 欄定義：本 article bottom nav 之 8 個欄位皆為**該 nav link 之必填**（GitHub 端由系統保證；Blogger 端由使用者手動回補時須補齊）。

---

## 4. GitHub Pages current implementation（現況記錄）

| 項目 | 狀態 |
|---|---|
| GitHub Pages article bottom nav | ✅ 已實作（am-2）|
| data attributes（live DOM）| ✅ 已確認（am-5 DevTools）|
| GA4 Realtime `click_other_link` | ✅ 已看到（am-6；count 5）|
| custom dimensions Priority 1 | 🟡 已規劃（am-7）/ 使用者正在註冊 |
| **source implementation location** | `src/views/layout/article-bottom-nav.ejs`（partial）；prev/next 推導於 `src/scripts/build-github.js`；include 於 `src/views/pages/post-detail.ejs`（`</article>` 之後）|
| deploy | gh-pages `48c03d0`（source snapshot `d326c60`）|

GitHub Pages 端為 **complete pipeline**：EJS render attr → Vite bundle 之 `link-tracker.js` delegated listener 自動 fire → GA4 property。**Blogger 端無此 listener**（見 §6）。

---

## 5. Blogger manual data-ga4 snippet examples（手動回補格式）

使用者手動於 Blogger 文章底部加入以下 anchor（HTML 模式貼上）。`surface` 一律 `blogger`；大寫 placeholder 由使用者填入實際值。

**Previous link：**
```html
<a href="BLOGGER_PREVIOUS_URL"
   data-ga4-event="click_other_link"
   data-ga4-param-surface="blogger"
   data-ga4-param-click_area="article_bottom_nav"
   data-ga4-param-nav_direction="previous"
   data-ga4-param-post_slug="CURRENT_POST_SLUG"
   data-ga4-param-target_slug="TARGET_POST_SLUG"
   data-ga4-param-target_url="BLOGGER_PREVIOUS_URL"
   data-ga4-param-link_label="上一篇文章標題">上一篇</a>
```

**Next link：**
```html
<a href="BLOGGER_NEXT_URL"
   data-ga4-event="click_other_link"
   data-ga4-param-surface="blogger"
   data-ga4-param-click_area="article_bottom_nav"
   data-ga4-param-nav_direction="next"
   data-ga4-param-post_slug="CURRENT_POST_SLUG"
   data-ga4-param-target_slug="TARGET_POST_SLUG"
   data-ga4-param-target_url="BLOGGER_NEXT_URL"
   data-ga4-param-link_label="下一篇文章標題">下一篇</a>
```

**Home link：**
```html
<a href="BLOGGER_HOME_URL"
   data-ga4-event="click_other_link"
   data-ga4-param-surface="blogger"
   data-ga4-param-click_area="article_bottom_nav"
   data-ga4-param-nav_direction="home"
   data-ga4-param-post_slug="CURRENT_POST_SLUG"
   data-ga4-param-target_slug="home"
   data-ga4-param-target_url="BLOGGER_HOME_URL"
   data-ga4-param-link_label="回首頁">回首頁</a>
```

placeholder 對照：
- `BLOGGER_PREVIOUS_URL` / `BLOGGER_NEXT_URL`：目標 Blogger 文章實際 URL（如 `https://babel-lab.blogspot.com/2026/06/<slug>.html`）
- `BLOGGER_HOME_URL`：Blogger 首頁 URL（→ §9 D4 是否固定）
- `CURRENT_POST_SLUG`：當前文章 slug
- `TARGET_POST_SLUG`：目標文章 slug（home link 固定 `home`）
- `link_label`：目標文章標題 或 固定文字（→ §9 D3）

> ⚠️ `target_url` 與 `href` 應一致（同一個目標 URL）。`<a>` 之 class / rel / target 依 Blogger 主題與既有規範自行決定（本 snippet 聚焦 GA4 attr）。

---

## 6. Blogger JS listener boundary（邊界）

- 手動補 `data-ga4-*` **只是標記（markup）**；本身不送事件。
- 若 Blogger theme **沒有 listener 或 onclick gtag handler** → 點擊時 **GA4 不會自動送出事件**（與 GitHub Pages 之根本不對稱；per `docs/blogger-listener-strategy.md` §1.3）。
- **本階段不實作 Blogger listener**。
- 未來可另開 phase：
  - **Blogger theme-level delegated listener**（一次性貼於主題；掃 `[data-ga4-event]` → `gtag('event', ...)`）
  - inline `onclick` fallback（逐連結；維護成本高）
  - Blogger DebugView checklist（驗證 Blogger 端事件）
- **推薦未來優先 theme-level delegated listener**：避免逐篇手工 onclick；對齊 GitHub 端 `link-tracker.js` 之 convention；listener 修正只需主題級重貼一次（per `blogger-listener-strategy.md` §5.3）。

> 結論：在 Blogger listener 落地前，手動回補之 `data-ga4-*` attr 為「**先備好正確標記**」；事件實際送出仍待未來 listener phase。**不**因此先做方案 C（attr 存在但 listener 延後造成誤判）—— 使用者已明確接受「先標記、listener 另開」之安排，且 §7 報表分析時應知 Blogger 端在 listener 落地前不會有 click event 流量。

---

## 7. GA4 reporting model（報表示例）

註冊 P1 custom dimensions（am-7）後，於 GA4 Explore / Reports 可呈現：

| Event name | Surface | Click Area | Nav Direction | Source Post Slug | Target Slug | Event Count |
|---|---|---|---|---|---|---|
| click_other_link | github_pages | article_bottom_nav | previous | github-pages-blog-planning | portable-blog-system-mvp | （實測）|
| click_other_link | github_pages | article_bottom_nav | next | github-pages-blog-planning | we-media-myself2 | （實測）|
| click_other_link | github_pages | article_bottom_nav | home | github-pages-blog-planning | home | （實測）|
| click_other_link | **blogger** | article_bottom_nav | previous | （Blogger slug）| （Blogger slug）| （listener 落地後）|
| click_other_link | **blogger** | article_bottom_nav | home | （Blogger slug）| home | （listener 落地後）|

分析示範：
- `surface=github_pages` vs `surface=blogger` → 比較兩平台底部導覽使用率。
- `click_area=article_bottom_nav` → 隔離底部導覽（不混入 otherLinks aside 之 `click_other_link`）。
- `nav_direction=previous|next|home` → 看讀者偏向往前 / 往後 / 回首頁。
- 加 `post_slug` / `target_slug` → 找出哪些文章互導效果好。

⚠️ Blogger 列在**主題 listener 落地前**不會有資料（attr 已標記但無 listener 送出）。

---

## 8. Manual Blogger authoring checklist（手動回補檢查）

使用者於 Blogger 手動回補時逐項確認：

- [ ] `surface` 填 `blogger`（**不要**誤填 github_pages）
- [ ] `post_slug` 是目前文章 slug
- [ ] `target_slug` 是目標文章 slug 或 `home`
- [ ] `target_url` 是實際 Blogger URL（且與 `href` 一致）
- [ ] `nav_direction` 為 `previous` / `next` / `home`（三選一，拼字正確）
- [ ] `link_label` 與使用者看見的連結文字 / 文章標題一致
- [ ] 第一篇無 previous、最後一篇無 next（缺的方向不放）；home 永遠放
- [ ] **不要**把 AdSense iframe 包進追蹤
- [ ] **不要**在廣告附近做誘導點擊文字
- [ ] 以 **HTML 模式**貼（避免 Compose 模式 strip attr）

---

## 9. Open decisions（需人決策）

| # | 決策 | 說明 / 傾向 |
|---|---|---|
| D1 | 何時導入 Blogger theme-level listener | 取決於 Blogger 端 click 分析優先度；推薦 theme-level（§6）；本階段不做 |
| D2 | Blogger slug 是否與 GitHub slug 完全一致 | 若一致 → 跨平台 `post_slug` / `target_slug` 可直接對應同一文章；若不同 → 報表須額外對照。傾向**儘量一致** |
| D3 | `link_label` 用文章標題 vs 固定文字「上一篇 / 下一篇」 | GitHub 端目前用**標題**（prev/next）+「回首頁」（home）；Blogger 建議**對齊**（用標題）以利跨平台一致；惟標題為高 cardinality（§7 注意）|
| D4 | Blogger home URL 是否固定為首頁 | 傾向固定 Blogger 首頁 URL；填入 `BLOGGER_HOME_URL` |
| D5 | 何時把 Blogger manual snippets 做成**系統產生的 copy helper** | 現為手動；未來可由 build:blogger 產出 per-post 之 nav snippet（含正確 slug/url/label）供複製 → Option D（§10）|

---

## 10. Recommended next phase

| Option | 內容 | 性質 |
|---|---|---|
| **A. GA4 custom dimensions registration record** | 使用者確認在 GA4 後台完成 P1 維度註冊後，建立 registration record（docs-only）| docs-only |
| **B. GA4 parameter detail verification record** | 待 Explore / Reports 出現資料後，逐項確認 params 並建立 PASS record（docs-only）| docs-only |
| **C. Blogger listener preanalysis** | 若使用者之後需要 Blogger 端 JS（theme-level delegated listener）| docs-only |
| **D. Blogger manual snippet copy-helper source implementation preanalysis** | 規劃由系統（build:blogger）產生 per-post nav snippet copy helper（填好 slug/url/label）| docs-only preanalysis（未來 source）|

**建議**：先 **Option A 或 B**（GA4 後台註冊 / 參數驗證閉環）；**不 source change**。D 為把本文件 §5 手動格式自動化之未來方向。

---

## 11. Cross-links

- `docs/20260615-blogger-ga4-internal-click-taxonomy-preanalysis.md`（am-1 taxonomy；event family 決策）
- `docs/20260615-ga4-debugview-article-bottom-nav-manual-checklist.md`（am-3 SOP；§4 matrix）
- `docs/20260615-github-pages-live-dom-ga4-nav-observation-record.md`（am-5 DOM observation）
- `docs/20260615-ga4-bottom-nav-backend-event-receipt-record.md`（am-6 backend receipt）
- `docs/20260615-ga4-custom-dimensions-registration-checklist.md`（am-7 custom dimensions）
- `docs/blogger-listener-strategy.md`（Blogger 端 listener 不對稱 + 方案 A/B/C/D）
- `docs/ga4-parameter-naming-registry.md`（命名 registry）
- `src/views/layout/article-bottom-nav.ejs`（GitHub 端 nav param 來源）
- `src/js/modules/link-tracker.js`（GitHub 端 delegated listener；Blogger 端未來對齊目標）

---

（本文件結束）
