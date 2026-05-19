# Admin Local-Only Boundary Pre-Analysis

本文件為**未來「所見即所得管理畫面（WYSIWYG admin / authoring UI）」之邊界 pre-analysis**。屬**規劃性質**；**不啟動實作**；**不違反 CLAUDE.md §29 第一版不做清單**之既有規範。

對應之上層紀錄：
- `CLAUDE.md` §29（第一版不做清單；含「真正後台登入管理」/「視覺化文章編輯器」）
- `CLAUDE.md` §8（系統分階段；admin 屬第二階段範疇）
- `docs/phase-10-completion-report.md`（Phase 10 GitHub Pages 部署系列；建立「source 留本機 / public repo 純 deploy-only」雙 repo 分離設計）
- `docs/future-roadmap.md` §8.8（Phase 10 deployment 系列 landed 紀錄）

---

## §1 背景說明

本系統未來會分成兩個明確分層：

### 1.1 Public Site / 對外靜態網站

- build 後輸出至 `dist/`
- 可部署到 GitHub Pages（per Phase 10 deployment 系列；URL: `https://babel-lab.github.io/portable-blog-system/`）
- 給**一般讀者**看
- 內容為正式發布之文章 / 分類 / 標籤 / 首頁 / 404 / sitemap / robots

### 1.2 Local Admin / Authoring UI / 本機管理畫面

- **只在本機開發環境使用**
- 提供作者「所見即所得」之新增 / 修改 / 預覽文章與相關連結之介面
- **不輸出到** GitHub Pages
- **不進** deploy repo（`D:\github\blog-new\portable-blog-deploy\`）
- **不推到** gh-pages branch
- 預設僅作者本人（本機 user）使用；不對外提供 URL

### 1.3 為何需要分離

- 雙 repo 設計（per Phase 10）已分離 source ↔ public；admin 屬 source 端工具，不應污染 public output
- CLAUDE.md §29 之「視覺化文章編輯器」屬第一版不做；若未來實作必須嚴格限制於 local，不違反原始設計原則
- 安全性：admin 牽涉 content 寫入；若上線需獨立評估 auth / RBAC / CSRF 等；local-only 可繞過這些複雜度

---

## §2 Public Site 規則

Public Site 之可包含項目（**僅限**這些）：

| 類別 | 項目 |
|---|---|
| **核心頁面** | 首頁 / 文章列表 / 文章詳細頁 / 分類頁 / 標籤頁 / 404 |
| **SEO 與 crawler** | sitemap.xml / robots.txt |
| **對外導覽** | 公開 nav（desktop + mobile drawer）/ 公開 footer |
| **追蹤與廣告** | GA4 / Google AdSense / 對外連結之 GA / UTM 參數 |
| **SEO index** | meta tags / Open Graph / JSON-LD / canonical |
| **公開資源** | 正式給讀者看的圖片 / cover / 教具下載檔（per `content/settings/download.config` 之 enabled 項）|
| **互動 JS** | sticky header / mobile drawer / back-to-top / lazy image / link tracker / GA4 events / active nav |

---

## §3 Local Admin 規則

Local Admin 必須**嚴格遵守**以下硬性規則：

| 規則 | 理由 |
|---|---|
| **不輸出到 dist** | dist 是 public build 目的地；admin 不對外 |
| **不部署到 GitHub Pages** | public 部署管道只走 Phase 10 既定流程；admin 不參與 |
| **不推到 gh-pages branch** | gh-pages 為 deploy-only；含任何 admin 即破壞 single-purpose |
| **不進 sitemap** | sitemap 為 search engine discoverability；admin URL 不應被發現 |
| **不出現在 public navigation** | public nav 為讀者導覽；admin 不對讀者開放 |
| **不放 GA4** | GA4 為對外讀者行為分析；admin 操作不應污染分析資料 |
| **不放 Google Ads** | admin 為作者工作環境；不適合放廣告 |
| **不產生正式 GA / UTM 追蹤點擊** | admin preview 之點擊不應觸發正式 conversion / UTM 紀錄 |
| **不被搜尋引擎索引** | 即使誤上線也需 noindex / nofollow 保護 |
| **不給一般讀者使用** | 設計目標即為作者單人工具 |
| **第一階段不做登入系統**（因只在本機使用）| local-only 已是邊界；多餘 auth 屬過度工程 |
| **若未來要線上化**，必須**獨立重新評估**登入 / 權限 / 安全性 / 部署方式 | 任何上線決定屬重大架構變更；不應 implicit drift |

---

## §4 WYSIWYG 管理畫面未來需求

**僅做規劃**，**不實作**。

未來本機管理畫面可能需要支援以下功能：

### 4.1 文章生命週期

- 新增文章（含 frontmatter 預填）
- 修改文章（編輯既有 markdown + frontmatter）
- 狀態切換：`draft` / `ready` / `published`
- 編輯標題（中文 + titleEn）
- 編輯 slug（含警告：published 後改 slug 影響 URL / canonical）
- 編輯 description（短摘要 + searchDescription）
- 編輯作者資料

### 4.2 富 metadata 編輯

- 編輯書籍 / 雜誌 / DVD / 電子書 metadata（per `docs/book-schema.md`：book.mediaType / titleEn / volume / issue / authors[] / publishedYear 等）
- 編輯相關連結 `relatedLinks[]` 與其他連結 `otherLinks[]`（per `docs/related-links-schema.md`：kind / platform / title / url 等）
- 編輯 FB promotion metadata（per `docs/fb-sidecar-schema.md`：title / titleEn / hashtags / page / target / message / body）
- 編輯 affiliate links（per CLAUDE.md §12 書評文章規則）
- 編輯 download config（per CLAUDE.md §13 下載文章規則）

### 4.3 預覽功能

- 預覽 Blogger 輸出（dist-blogger/posts/{slug}/post.html）
- 預覽 GitHub Pages 輸出（dist/posts/{slug}/index.html）
- 預覽 FB promotion txt（dist-promotion/facebook/{site}/{slug}.txt）
- 預覽 copy-helper 與 publish-checklist

### 4.4 驗證功能

- 檢查連結（broken link / image link，per 既有 `check:links` / `check:images`）
- 檢查 build 前資料完整性（per 既有 `validate:content` 22 warnings 規則）
- 檢查 missing tags / categories / series

### 4.5 資料匯出 / 匯入

- 匯出或更新 content JSON（含 settings 類 config）
- 匯入外部 markdown / metadata
- 備份本機 content 至 source repo 之 git history

---

## §5 建議技術邊界

Local Admin 之技術原則：

| # | 原則 | 說明 |
|---|---|---|
| 1 | **Admin 可存在 source repo，但不能進 production build output** | admin 程式碼可 commit 至 source main（屬本機紀錄）；但 `npm run build` 不應 include admin |
| 2 | **Admin 可用 dev-only route、local script、或獨立 local tool** | 三種實作風格皆可（per §6 三方案）；共通點為「不參與 vite build」|
| 3 | **`build-github.js` / vite build 流程必須排除 admin** | conditional skip 或 admin 不放於 vite 之 page input glob |
| 4 | **`build-sitemap.js` 必須排除 admin** | admin URL 不應出現於 sitemap 即使誤 include |
| 5 | **Public layout 與 admin layout 必須分離** | public 用 `src/views/layout/base.ejs`；admin 應有獨立 layout（如 `src/admin/layout/admin-base.ejs`）|
| 6 | **GA4 / Ads injection 只能出現在 public layout** | admin layout 不 include GA4 / Ads partial |
| 7 | **Admin preview 之 click 不應觸發正式 analytics** | 即使 admin 用同 EJS templates 渲染 post detail 預覽，preview 模式下 GA4 / link-tracker 不啟用 |
| 8 | **Admin 之 link processor 應跳過 UTM injection** | per CLAUDE.md §16.3-§16.4，UTM 屬對外正式追蹤；admin 預覽不應預先生成 UTM URL |

---

## §6 建議目錄策略（3 方案；不實作）

### Plan A：Admin 放在 source repo 之 `src/admin/` 或 `tools/admin/`，只能本機 dev 使用，不輸出到 dist

| 維度 | 評估 |
|---|---|
| 優點 | 與 source repo 同 repo；版本控管統一；作者只需 clone 1 個 repo；可共用 schema / settings / loader 程式 |
| 風險 | 🟡 若 build 配置疏忽，admin 可能誤入 dist；需嚴格 vite input glob 排除；admin code 量增加會 inflate source repo 大小 |
| 是否適合第一階段 | ⚠️ 不適合**啟動實作**（per CLAUDE.md §29）；但**規劃目錄結構**屬可接受 |
| 是否影響目前 GitHub Pages | ❌ 不影響（admin 只在本機 dev mode 啟用；不進 dist / gh-pages）|
| 是否需要登入系統 | ❌ 不需（local-only）|
| 是否適合未來擴充 | ✅ 中高：若未來想線上化，需獨立評估抽出至 private repo |

### Plan B：Admin 做成獨立 local tool，例如 `tools/content-manager/`，只負責編輯 JSON / content，不參與 public build

| 維度 | 評估 |
|---|---|
| 優點 | 明確分離 admin code 與 public render code；admin 只需 CLI 或 minimal UI（如 local web server on 不同 port）；可獨立技術選型（如 React / Vue / desktop app）；無 conflict with vite build pipeline |
| 風險 | 🟡 兩套 build / dependency 管理；admin 自有 package.json 子目錄；需明確 data interface（content / settings JSON schema）|
| 是否適合第一階段 | ⚠️ 同 Plan A：規劃 OK；實作不啟動 |
| 是否影響目前 GitHub Pages | ❌ 不影響 |
| 是否需要登入系統 | ❌ 不需（local-only）|
| 是否適合未來擴充 | ✅ 高：tool 之獨立性高，未來抽出為獨立 repo / desktop app 容易 |

### Plan C：Admin 未來獨立成 private repo 或 local desktop / web app；public blog repo 只接收輸出的 content data

| 維度 | 評估 |
|---|---|
| 優點 | 最徹底分離；admin 可獨立技術棧（Electron / Tauri / web SPA / etc.）；public blog repo 純粹 / 易維護；admin 可線上化時不影響 public site 設計 |
| 風險 | 🔴 較高 setup overhead；需設計 content 同步機制（git push / file sync / API）；跨 repo 開發環境設定複雜 |
| 是否適合第一階段 | ❌ 過度工程；第一階段不啟動 |
| 是否影響目前 GitHub Pages | ❌ 不影響 |
| 是否需要登入系統 | ⚠️ 若 admin 為 desktop app，OS-level auth 即可；若為 web app + 線上化，需完整 auth |
| 是否適合未來擴充 | ✅✅ 最高：擴充自由度最大 |

### 三方案比較總結

| 方案 | 第一階段適合度 | 第二階段擴充性 | 推薦時機 |
|---|---|---|---|
| Plan A | 🟡 規劃 OK | 🟡 中 | 第二階段啟動時之 default 起手點；最低 setup overhead |
| Plan B | 🟡 規劃 OK | 🟢 高 | 第二階段中期；當 admin 功能成熟需獨立技術棧時 |
| Plan C | 🔴 不建議 | 🟢🟢 最高 | 第二階段後期或第三階段；admin 需線上化或多人協作時 |

**保守推薦**：第二階段啟動時走 Plan A → 視擴充需求自然 evolve 至 Plan B → 最終可能升至 Plan C。**不需在第一階段決定終局**。

---

## §7 GA4 / Ads / UTM placement policy

明確規則：

| 規則 | 範圍 |
|---|---|
| **GA4 只注入 public layout** | `src/views/layout/base.ejs` + `src/views/tracking/ga4.ejs`；admin layout 不 include |
| **Google Ads 只注入 public pages** | `src/views/ads/*.ejs` + post detail 之 conditional render；admin 不 include |
| **UTM / GA 參數只用於對外正式連結** | per `src/scripts/ga4-url-builder.js`；admin preview 之 link 不 inject UTM |
| **Admin layout 不注入 GA4** | 即使 admin 用 EJS 渲染 post preview，preview mode 下不 include ga4.ejs partial |
| **Admin layout 不注入 Ads** | 同上 |
| **Admin preview 不應記錄正式流量** | preview 之 fetch / render 不 fire GA4 event；不更新 GA4 page_view |
| **若需要測試 UTM**，只顯示 preview/test result，不產生正式點擊 | admin 可有 UTM 預覽功能（display generated URL）但**不**點擊跳轉 |

---

## §8 對目前系統的影響

本批次（Phase 10-ds-fix-a + Phase 10-admin-local-boundary-a）：

| 項目 | 狀態 |
|---|---|
| 本批不實作 Admin UI | ✅ 維持（per CLAUDE.md §29）|
| 不改文章資料結構 | ✅ |
| 不改 GA4 | ✅（既有 `enabled: false` 不變）|
| 不改 Ads | ✅（既有 `enabled: false` 不變）|
| 不改 JSON-LD | ✅ |
| 不改 Phase 8-h legacy | ✅（既有 Phase 8-h 已完成；本批不重啟）|
| 不改 deploy repo | ✅（本批未操作 deploy repo）|

本批僅完成 2 件事：

1. **移除 Design System 公開導覽**（A 段；commit pending）：`content/settings/navigation.json` 移除第 4 條 Design System entry；rebuild dist + sitemap；sanity check 通過
2. **建立 admin local-only 邊界文件**（B 段；本檔案）：規範 public site vs local admin 之分層；提出 3 方案目錄策略；明訂 GA4 / Ads / UTM placement policy

---

## §9 Recommended next batch

依**保守順序**評估（**不執行**；屬下一批 candidate）：

| 順序 | 批次 | 範圍 | 觸發條件 | 風險 |
|---|---|---|---|---|
| 1 | **commit 本批 navigation + docs** | 將 A 段之 navigation.json + B 段之 admin-local-boundary-pre-analysis.md 一起 commit 至 source main | ✅ 已滿足（本批已完成編輯 + sanity 通過）| 🟢 低 |
| 2 | **redeploy GitHub Pages**，讓 Design System 從公開導覽消失 | 依 `docs/github-deploy.md` §5.4 增量更新流程；同 Phase 10-d-redeploy 模式 | 順序 1 完成後 | 🟢 低 |
| 3 | **GA4 public-only 接入** | 設 `content/settings/ga4.config.json` 之 `measurementId` + `enabled: true`；確保 §7 policy（不入 admin layout） | 順序 2 完成後 + user 提供 GA4 measurementId | 🟡 中（屬正式 analytics 接入）|
| 4 | **Rich Results Test 手動驗證** | 作者於 https://search.google.com/test/rich-results 對 we-media-myself2 之 JSON-LD（含 BlogPosting / mentions / isPartOf / Book mainEntity）驗證 | 順序 2 完成後（線上版本可訪問）| 🟢 低（屬作者 SOP）|
| 5 | **Admin UI MVP pre-analysis** | 依本文件 §4 / §6 規劃；產出 Phase 11-a admin-ui-mvp-pre-plan.md（pre-plan，不實作）| 第二階段啟動時 | 🟡 中（規劃；不實作）|
| 6 | **Phase 8-h legacy 退場** | 已完成（per `docs/phase-8h-completion-report.md` 2026-05-18 landed 15/15 in-scope）| — | — |

**保守原則**：
- 順序 1-2 為**當前可立即執行**之後續批
- 順序 3 需 user 提供 GA4 ID + 評估 §7 policy 嚴格性
- 順序 4 屬作者個人 SOP；非 Claude 範疇
- 順序 5 為**第二階段**起手；不在第一階段範圍
- 順序 6 已實質完成；列出僅供完整性 reference

---

## §10 邊界聲明

- ✅ 本文件**僅為 pre-analysis / 邊界規劃**；**不**啟動 Admin UI 實作
- ✅ 本文件**不**修改 source code（除 navigation.json 屬本批 A 段之最小修正）
- ✅ 本文件**不**修改 Blogger templates / dist / deploy repo
- ✅ 本文件**不**啟動 GA4 / Ads
- ✅ 本文件**不**啟動 Phase 8-h legacy（已完成）
- ✅ 本文件**不**改 JSON-LD / 文章資料結構
- ✅ 本文件**不**等同對 CLAUDE.md §29 第一版不做清單之豁免；admin 實作仍屬第二階段範疇

---

## §11 Cross-links

- `CLAUDE.md` §8（系統分階段）/ §29（第一版不做清單）/ §16（連結處理規則含 UTM）
- `docs/phase-10-completion-report.md`（Phase 10 deployment 系列；雙 repo 分離設計）
- `docs/future-roadmap.md` §8.8（Phase 10 landed 紀錄）
- `docs/seo-ga4-adsense.md`（GA4 / Ads 既有配置）
- `docs/publish-workflow.md`（作者既有發布 SOP）

---

（本文件結束）
