# Admin-1 Read-only Preflight

本文件為 Admin Phase 1（read-only MVP）之**啟動前盤點與最小實作方案**。屬 **preflight / planning** 性質；本批僅產此 doc，**不**啟動任何 source / vite / output 變動。實作留待 user 批准方案後之 **Admin-1-b** 批次。

對應上層文件：
- `docs/admin-mvp-pre-analysis.md`（Admin MVP 詳規劃；Phase Admin-0）
- `docs/admin-local-boundary-pre-analysis.md`（Admin 邊界政策 + 三方案目錄策略 + GA4/Ads/UTM placement）
- `docs/system-direction.md`（BLOG 系統整體方向）

---

## §1 現有資料來源盤點

### 1.1 Content 文章資料

| 路徑 | 檔數 | 內容 |
|---|---|---|
| `content/blogger/posts/` | 4 檔（2 篇文章）| `20260504-sample-book-review.md`（draft）+ `20260515-we-media-myself2.md` + `.fb.md` + `.publish.json`（ready）|
| `content/github/posts/` | 3 檔（2 篇文章）| `20260504-github-pages-blog-planning.md` + `.fb.md`（ready）+ `20260504-portable-blog-system-mvp.md`（ready）|

當前 ready posts 共 3 篇（2 native github + 1 cross-source blogger mirror per `loadGithubPosts()`）+ 1 draft（sample-book-review）。

### 1.2 Settings 配置

16 JSON 檔案位於 `content/settings/`，含：

| 類別 | 檔案 |
|---|---|
| 站台 | `site.config.json` / `themes.json` / `navigation.json` / `sidebar.config.json` / `footer.config.json` |
| 分類 | `categories.json` / `tags.json` |
| 廣告 / 追蹤 | `ads.config.json` / `ga4.config.json` / `seo.config.json` |
| 推廣 / 連結 | `promotion.config.json` / `link-rules.json` / `social-links.json` / `affiliate-networks.json` |
| 系列 | `series.json` / `_sample.series.json` |

### 1.3 既有 loader 函式（可重用，read-only）

| Loader | 功能 |
|---|---|
| `src/scripts/load-settings.js` | 載入 settings/*.json |
| `src/scripts/load-posts.js` | 通用 post loader（per site filter）|
| `src/scripts/load-blogger-posts.js` | Blogger-specific |
| `src/scripts/load-github-posts.js` | GitHub + cross-source mirror（per Phase 9-i-f-b）|
| `src/scripts/load-sidecars.js` | .publish.json + .fb.md 載入 |

→ Admin read-only loader 不需新寫；**可直接 import 既有 loader**。

### 1.4 既有 build pipeline

- `src/scripts/build-github.js`：主 build；render .ejs → `.cache/pages/{path}/index.html`
- `vite build`：consume `.cache/pages/**/*.html` → `dist/{path}/index.html`
- `src/scripts/build-sitemap.js`：產 `dist/sitemap.xml` + `dist/robots.txt`（**已自動排除** design-system / 404）

### 1.5 既有 noindex / robots 防護 pattern（design-system 為參考）

| 防護層 | 既有實作 |
|---|---|
| meta robots noindex | `buildSeoNoindex({ pageType: 'design-system' })` → 模板 `<meta name="robots" content="noindex, nofollow" />` |
| robots.txt Disallow | `Disallow: /design-system/`（per build-sitemap.js line 66）|
| sitemap exclude | build-sitemap.js 之 `buildEntries()` 不包含 design-system |
| navigation exclude | `content/settings/navigation.json` 已移除 Design System link（per Phase 10-ds-fix-a-redeploy）|

→ Admin 可**完全沿用 design-system pattern**。

---

## §2 Admin read-only 最小欄位

Per user §1 Admin-1 之 9 點目標 ↔ 對應 metadata 欄位：

| Admin-1 目標 | 對應欄位 / 來源檔 |
|---|---|
| 1. 列出文章 / content records | `loadGithubPosts()` + `loadBloggerPosts()` 之 `.posts` array |
| 2. 顯示主要 metadata | frontmatter: `title` / `titleEn` / `slug` / `id` / `date` / `updated` / `author` / `status` |
| 3. Blogger / GitHub channel 狀態 | frontmatter: `site` / `primaryPlatform` / `publishTargets.{github,blogger}.{enabled,mode}` + `.publish.json` 之 `blogger.status` / `blogger.publishedUrl` / `github.enabled` / `github.path` |
| 4. SEO 欄位 | frontmatter: `description` / `searchDescription` / `canonical` / `cover` / `coverAlt` + `.publish.json` 之 `seo.metaTitle` / `seo.metaDescription` / `seo.ogImage` |
| 5. FB promotion 是否存在 | `.fb.md` 檔案是否存在（boolean）+ `enabled` 旗標 + `hashtags` / `page` / `title` 摘要 |
| 6. contentKind: post / page | frontmatter: `contentKind` + `.publish.json` 之 `blogger.type` |
| 7. slug / permalink / category / tags | frontmatter: `slug` / `category` / `tags` + `.publish.json` 之 `blogger.permalink` |
| 8. 預覽連結 / 輸出檢查 | 推導 URL：<br>- Local dist: `dist/posts/{slug}/index.html`<br>- GitHub Pages: `https://babel-lab.github.io/portable-blog-system/posts/{slug}/`<br>- Blogger published: `.publish.json.blogger.publishedUrl`（若有）<br>- Blogger dist: `dist-blogger/posts/{slug}/post.html`<br>- copy-helper: `dist-blogger/posts/{slug}/copy-helper.txt` |
| 9-10. 不寫入 / 不改 | 純 read；無 form / no submit / no button writes |

**所需最小視圖**：

- 文章列表頁（all posts；含上述欄位摘要 columns）
- 文章詳細頁（per-post；展開所有 metadata + 預覽連結 + sidecar 存在狀態）

---

## §3 可能頁面位置（4 方案比較）

### Plan A：`src/views/admin/` + `build-github.js` render 至 `dist/admin/` + 沿用 design-system 防護模式

| 維度 | 評估 |
|---|---|
| EJS 模板位置 | `src/views/admin/index.ejs` / `admin/post-detail.ejs` |
| Build 整合 | 修改 `build-github.js` 新增 `if (mode === 'dev') { render admin... }` block；prod build 跳過 |
| Dist 輸出 | `dist/admin/index.html`（**僅 dev mode**）|
| 是否進 sitemap | ❌ 不進（build-sitemap.js 不收 admin）|
| 是否進 robots.txt Disallow | ⚠️ **需加** `Disallow: /admin/`（per design-system pattern）|
| 是否含 noindex meta | ⚠️ **需加**（per `buildSeoNoindex({ pageType: 'admin' })`）|
| Public navigation 連結 | ❌ 不加（per `navigation.json` 不含 admin）|
| 是否進 deploy repo | ⚠️ **需** redeploy 流程明確排除 `admin/` 目錄（或 prod build 不產出即天然排除）|
| build script 變動規模 | 中（需條件分支 + 4 個防護點修改：buildSeoNoindex / build-sitemap / robots.txt / deploy 排除）|
| 可逆性 | 🟢 高（revert 1 commit 即清）|
| 推薦度 | 🟡 中：完整沿用 design-system 模式但需多處修改；天然「公開風險」需嚴格防護 |

### Plan B：`src/views/admin/` + 僅在 dev mode render；**prod build 完全跳過**

| 維度 | 評估 |
|---|---|
| EJS 模板位置 | 同 Plan A |
| Build 整合 | `build-github.js` 之 admin render block 包 `if (mode === 'dev')` 條件；prod build 完全不渲染 |
| Dist 輸出 | dev: `.cache/pages/admin/index.html`（被 vite serve）/ prod: **不存在** |
| 是否進 sitemap | ❌ 天然不進（dist 無 admin/）|
| 是否進 deploy repo | ❌ 天然不進（cp dist 時無此目錄）|
| 是否需要明示 Disallow / noindex | 🟢 不需（即使 user 跑 prod build 然後 cp 到 deploy，admin 也不在 dist）|
| build script 變動規模 | 小（單一 mode 條件 + render block）|
| 可逆性 | 🟢 高 |
| 推薦度 | 🟢🟢 **強推薦**（最少防護點 / 最天然 local-only / 對齊 admin-local-boundary §3 之硬性禁則）|

### Plan C：`tools/admin/` 獨立 standalone HTML + 獨立 dev server（per admin-local-boundary §6 Plan B）

| 維度 | 評估 |
|---|---|
| 位置 | `tools/admin/` 子目錄 |
| 技術 | 可獨立技術選型（如 plain HTML + fetch JSON / 或 minimal Node express）|
| Build 整合 | ❌ **完全不接** vite / build-github.js |
| Dist 輸出 | ❌ 不存在 |
| 是否進 deploy | ❌ 天然不進 |
| 開發體驗 | user 需另起 server（如 `cd tools/admin && python -m http.server`）|
| 對齊 admin-local-boundary §6 Plan B | ✅（獨立 local tool；不參與 public build）|
| 重複工作量 | 🟡 中（需自行重做 settings/posts loader 或調用 build-github helper）|
| 推薦度 | 🟡 中（架構最乾淨但 setup 較重；適合 Phase Admin-3+ 進階階段）|

### Plan D：純 docs only（本批僅 preflight；不實作）

| 維度 | 評估 |
|---|---|
| 變動 | 只新增本 preflight 文件 |
| 風險 | 🟢 零 |
| 推薦度 | 🟢 **本批採用**（per user 「可回退、保守」原則；實作 + 方案決策留下批）|

### 方案比較總結

| 方案 | 變動範圍 | 公開風險 | 對齊 admin-local-boundary | 適合時機 |
|---|---|---|---|---|
| **D**（本批）| 0 source / 1 doc | 🟢 零 | ✅ | **本批採用**（preflight only）|
| **B**（推薦 Admin-1-b）| `src/views/admin/` + build-github.js +1 條件分支 | 🟢 極低（dev-only；不入 prod dist）| ✅ 完全對齊 §3「不輸出到 dist」 | Admin-1-b 推薦起手 |
| A | 同 B + 4 處防護（noindex / robots / sitemap / deploy 排除）| 🟡 低（多層防護後）| ⚠️ 部分對齊（仍進 dist）| 不推薦（防護工作量大；defense-in-depth 但 marginal 收益）|
| C | 獨立 `tools/admin/` | 🟢 零 | ✅ 完全對齊 §6 Plan B | Admin-3+ 進階（當 Admin 功能成熟需獨立技術棧）|

---

## §4 是否會進 dist / sitemap

### 4.1 本批（Plan D；preflight only）

- ❌ 不進 dist（本批未修改 build / vite / source；無新 HTML 產出）
- ❌ 不進 sitemap（本批未動 build-sitemap）
- ❌ 不進 deploy repo（本批未動 deploy；source main 也不 push）

### 4.2 下批採 Plan B 之預期（Admin-1-b）

| 維度 | dev mode（`npm run dev`）| prod build（`npm run build`）|
|---|---|---|
| dist | `.cache/pages/admin/index.html` 存在；vite serve 可預覽 `/admin/` | **不存在**（build 條件跳過）|
| sitemap | n/a（dev 不產 sitemap）| 不變（build-sitemap.js 不掃 admin）|
| robots.txt | n/a | 不變（無需加 Disallow，因 admin 不在 prod dist）|
| deploy repo（gh-pages）| n/a | 不受影響（cp dist 時無 admin/）|
| public navigation | 不變（navigation.json 不含 admin）| 不變 |

→ Plan B 實作後 admin **完全不會洩漏到公開 GitHub Pages**；屬 local-dev-only 設計。

---

## §5 風險與防護

| # | 風險 | 等級 | 防護 |
|---|---|---|---|
| 1 | Admin 頁面誤上線 GitHub Pages | 🔴 高 | Plan B 之 dev-mode 條件 + admin-local-boundary §3 硬性禁則 + 未來實作後跑 sanity check：`ls dist/admin/` 應 absent |
| 2 | Admin 寫入功能誤啟動 | 🔴 高 | Admin-1 嚴格 read-only；無 form / 無 button writes；下批 Admin-1-b 也只允許 GET / parse；Admin-2 才開放 write |
| 3 | Admin 直接 import build-github helper 連帶引入 prod build 副作用 | 🟡 中 | Admin 只 import loader（load-*.js）；不 import build-github 之 render / writeText / vite caller |
| 4 | Admin 暴露 settings 之 GA4 ID / AdSense ID 至 dist | 🟡 中 | settings JSON 當前 ID 為空字串；即使 admin render 顯示也是空值；未來填入後 Plan B 之 dev-only 保護生效 |
| 5 | Admin 連結到 internal sidecar 路徑（如 `/content/blogger/posts/...`）被讀者 access | 🔴 高 | Admin 顯示路徑為**文字描述**；不產生可點之 anchor；或 anchor 限本機 file:// URL |
| 6 | Admin 引入大型 framework（React / Vue 等）超出第一版 scope | 🟡 中 | Plan B 沿用既有 EJS + minimal vanilla JS；不引入 framework |
| 7 | Admin 開發過程誤 commit 大量 untracked sandbox files | 🟢 低 | tools/admin/ 加入 .gitignore 排除（若採 Plan C）；Plan B 則新增之 `src/views/admin/` 為 source-tracked，需注意 |
| 8 | 未來 Admin 線上化 / 加入 auth 之 scope creep | 🟡 中 | per admin-local-boundary §3「不做登入」+ admin-mvp §3 不做完整 CMS；嚴格 phase 拆分 |

---

## §6 下一步建議

### 6.1 推薦：批准 **Plan B** 作為 Admin-1-b 實作方向

理由：

- ✅ 最小變動範圍（1 個 conditional branch in build-github.js + 2-3 個 EJS templates + minimal loader）
- ✅ 天然 local-only（prod build 不產出 → 自動排除 deploy / sitemap / robots / nav 連結之防護負擔）
- ✅ 對齊 admin-local-boundary §3 硬性禁則「不輸出到 dist」
- ✅ 可逆性高（revert 1 commit 即清）
- ✅ 沿用既有 loader（load-github-posts.js + load-blogger-posts.js + load-settings.js）
- ✅ 沿用既有 EJS / vite 架構（不引入 framework）

### 6.2 預計 Admin-1-b 範圍

| Step | 動作 | 預估行數 |
|---|---|---|
| 1 | 新增 `src/views/admin/index.ejs`（文章列表 + metadata table）| ~100 行 EJS |
| 2 | 新增 `src/views/admin/post-detail.ejs`（per-post 完整 metadata 展開）| ~120 行 EJS |
| 3 | 新增 `src/scripts/load-admin-data.js`（讀 settings + 兩 site posts；不寫）| ~60 行 JS |
| 4 | 修改 `src/scripts/build-github.js` 加 dev-mode admin render block | +30 / -0 行 |
| 5 | 新增 minimal admin SCSS（用既有 token；不重構 design system）| ~50 行 SCSS |
| 6 | 跑 `npm run dev` 開瀏覽器 `http://localhost:5173/admin/` 預覽 | 0 |
| 7 | 跑 `npm run build` 驗證 `dist/admin/` 不存在 + sitemap/robots 不含 admin | 0 |
| 8 | Single commit | 1 |

**預估總行數**：~360 行 / 4-5 files / 1 commit

### 6.3 Admin-1-b 啟動條件

| 條件 | 狀態 |
|---|---|
| 本 preflight doc 已 landed | ✅ 本批 |
| Plan B 經 user 批准 | ⏸ 待 user |
| 確認不引入新 npm dependencies | ✅ Plan B 不需 |
| 確認 stable snapshot 維持 | ✅ source `d7ce9b3` |
| 確認既有 build / validate / postbuild sitemap 不 regression | ⏸ Admin-1-b 內驗證 |

### 6.4 Admin-1-b 不做（per Admin-1 read-only scope）

- ❌ 任何 write button / form submit
- ❌ 任何 JSON 寫入
- ❌ 任何 npm run new:post 觸發
- ❌ 任何 git command 觸發
- ❌ 直接編輯 .md / .publish.json / .fb.md
- ❌ GA4 measurementId / AdSense client ID 編輯

留至 Admin-2（write）+ Admin-3（build 整合）+ Admin-4（發布輔助）。

---

## §7 對目前系統之影響

本批（Phase Admin-1-a；preflight only）：

| 維度 | 狀態 |
|---|---|
| source code | ❌ 未動 |
| build scripts | ❌ 未動 |
| EJS templates | ❌ 未動 |
| content 既有文章 | ❌ 未動 |
| settings JSON | ❌ 未動 |
| package.json | ❌ 未動 |
| dist | ❌ 未動 |
| deploy repo | ❌ 未動 |
| Blogger templates / output | ❌ 未動 |
| GA4 / AdSense | ❌ 未動 |
| navigation / sitemap / robots | ❌ 未動 |
| 既有 stable snapshot | ✅ 維持 |

---

## §8 邊界聲明

- ✅ 本文件**僅為 preflight 規劃**；不啟動 Admin 實作
- ✅ 本文件**不**修改 source / build / content / dist / deploy / settings
- ✅ 本文件**不**新增 npm dependencies
- ✅ 本文件**不**改變既有 schema
- ✅ 本文件**不**等同 Admin-1-b 之最終設計；屬高階方向 + Plan B 推薦

---

## §9 Cross-links

- `docs/admin-mvp-pre-analysis.md`（Admin MVP 詳規劃；本文件為 Phase Admin-1-a 之具體執行 plan）
- `docs/admin-local-boundary-pre-analysis.md`（Admin 邊界政策；本文件 Plan B 對齊 §3 「不輸出到 dist」之硬性禁則）
- `docs/system-direction.md`（BLOG 系統整體方向）
- `docs/publish-bundle.md`（sidecar 三檔結構；Admin read 之資料來源）
- `docs/content-schema.md`（frontmatter 欄位字典）
- `docs/publish-json-schema.md`（.publish.json schema）
- `docs/fb-sidecar-schema.md`（.fb.md schema）
- `CLAUDE.md` §11（contentKind）/ §17（article blocks）/ §29（第一版不做清單）

---

（本文件結束）
