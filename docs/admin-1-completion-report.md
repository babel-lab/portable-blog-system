# Admin-1 Completion Report：本機 dev-mode-only Admin Read-only 系列收尾

本文件封存 **Admin-1 系列（Admin-1-a preflight + Admin-1-b dev-mode-only page + Admin-1-c enhanced read-only）** 之完整 completion 紀錄。Admin-1 為 Admin MVP 之第一個實作階段；屬 **read-only 不寫入** 設計；屬 **dev-mode-only** 不部署。

對應上層文件：
- `docs/admin-mvp-pre-analysis.md`（Admin MVP 詳規劃；Phase Admin-0；§7 階段順序之 Admin-1 為本系列）
- `docs/admin-local-boundary-pre-analysis.md`（Admin 邊界政策；本系列 100% 對齊）
- `docs/admin-1-readonly-preflight.md`（Phase Admin-1-a；preflight + Plan B 選定）
- `docs/system-direction.md`（BLOG 系統整體方向）
- `CLAUDE.md` §29（第一版不做清單；Admin 屬第二階段，本系列嚴格 dev-only）

---

## §1 Admin-1 目標摘要

提供作者「本機可瀏覽 / 不寫入」之文章 metadata 檢視介面，降低長期手動編輯 sidecar JSON / frontmatter 之風險（per `admin-mvp-pre-analysis.md` §1.1 之 8 條痛點）。

**Admin-1 嚴格 read-only**：

- 只讀 / 不寫
- 只本機 / 不公開
- 只 dev mode / prod build 跳過
- 無 nav / sitemap / robots Disallow 需求（天然 absent from prod dist）
- 無 framework / 無 server / 無 auth / 無 npm deps

---

## §2 子批時間線 + commits

Admin-1 系列共 3 子批，全於 2026-05-19 落地：

| 子批 | 性質 | commit | 內容 |
|---|---|---|---|
| **Admin-1-a** | preflight + plan selection | `f876e9e docs(admin): land Admin-1 read-only preflight` | `docs/admin-1-readonly-preflight.md`（286 行）；audit content/settings/loaders/build pipeline；對比 4 方案 placement；推薦 Plan B（dev-mode-only） |
| **Admin-1-b** | dev-mode-only read-only page MVP | `7f9c6b7 feat(admin): land Admin-1-b dev-mode-only read-only admin page` | `src/scripts/load-admin-posts.js`（95 行 / new）+ `src/views/admin/index.ejs`（187 行 / new）+ `src/scripts/build-github.js`（+23 行：import + early cleanup + dev-mode render block）|
| **Admin-1-c** | enhanced read-only（search / filter / detail / completeness）| `11ba32e feat(admin): Admin-1-c read-only search / filter / detail / completeness` | `src/scripts/load-admin-posts.js`（+75 / -16；加 completeness + missingFields + 2 counts）+ `src/views/admin/index.ejs`（+312 / -101；stats + controls + detail panel + vanilla JS）|

### 2.1 commit 累計

- 3 個 source commits（全於本地 main；**未 push**）
- 1 個 docs commit（preflight；屬規劃階段）
- 2 個 source commits（實作階段）
- 5 個檔案異動範圍：1 個新 doc / 1 個新 EJS / 1 個新 loader / 1 個 existing build script edit / 1 個 incremental docs

合計：3 commits / +873 / -118（含 docs / source / EJS / SCSS-inline）

---

## §3 最終狀態 snapshot

| 項目 | 值 |
|---|---|
| **source HEAD** | `11ba32e feat(admin): Admin-1-c read-only search / filter / detail / completeness` |
| **source git status** | clean / branch main / **無 upstream tracking**（per source 留本機原則）|
| **deploy HEAD** | `4ecd92d deploy: publish Blogger cross-link GA4 UTM update`（**不變**；Admin 系列全程未動 deploy）|
| **GitHub Pages 線上** | 含 Blogger cross-link UTM + back-to-top button + Design System nav 移除（per 今日累積 commits）；**不含** admin |
| **Admin 本機 URL** | `http://localhost:5173/admin/`（僅 `npm run dev` 啟動 vite dev server 後可訪問）|

---

## §4 Admin 現有能力（read-only）

### 4.1 列表頁主要欄位

per row table column：

| Column | 內容 |
|---|---|
| id / title | title（中文 + 英文 titleEn）+ id + slug |
| kind / status | contentKind + status badge（ready / draft / published / no status）+ source site |
| category / tags | category badge + tags badges（含 `#` 前綴）|
| Blogger | enabled / mode / publishedUrl 狀態 badges |
| GitHub | enabled / mode badges |
| Completeness | 6 維度 badges（SEO / FB / Blogger / GitHub / URL / cat-tags 各 ok / missing）|
| URLs | Blogger publishedUrl + GitHub previewUrl 之 mono 顯示 |

### 4.2 統計摘要列（per Admin-1-c）

8 個 stat-card：

- total / ready / draft / published / bloggerEnabled / githubEnabled / fbExists / seoOk / urlOk

### 4.3 搜尋（per Admin-1-c）

- 1 個 `<input type="search">`；case-insensitive 即時 filter
- match 範圍：title / titleEn / slug / category / id / tags

### 4.4 篩選（per Admin-1-c）

- 1 個 `<select>` 含 5 個 optgroup + 12 個 filter options：
  - status: ready / draft / published
  - channel: Blogger enabled/disabled / GitHub enabled/disabled
  - completeness: SEO missing / FB missing / publishedUrl missing / category-tags missing
  - contentKind: post / page / tech-note / book-review / download

### 4.5 Per-post detail panel（per Admin-1-c）

- 點 row toggle detail panel 顯示 / 收合（▶ / ▼ hint）
- detail 含 7 sections：
  - Identity（id / title / titleEn / slug / contentKind / primaryPlatform / sourceSite / status / category / tags）
  - SEO（description / searchDescription / cover / coverAlt）
  - Blogger channel（publishTargets.enabled/mode + blogger.type/status/permalink/publishedUrl）
  - GitHub channel（publishTargets.enabled/mode + github.path/previewUrl）
  - FB promotion（sidecar exists + enabled flag；註明本批不解析 hashtags/body/UTM）
  - Related / other links（陣列長度；註明本批不解析個別 entry）
  - Completeness summary + Missing fields list + Source path

### 4.6 Vanilla JS 互動（per Admin-1-c）

- Search input → filter rows by data-search includes
- Filter select → match data-status / data-blogger / data-github / data-content-kind / data-seo / data-fb / data-url / data-cat-tags
- Click row → toggle 對應 detail 之 hidden
- 即時計數「N / M 顯示中」

### 4.7 Loader（src/scripts/load-admin-posts.js）

- 直接 glob `content/{github,blogger}/posts/*.md`（排除 .fb.md）
- 不沿用 load-posts.js 之 status filter（admin 需顯示 draft）
- 讀對應 `.publish.json` 與 `.fb.md` sidecar 之存在 + enabled 旗標
- 不寫入 / 不修改既有資料
- 不複製 build-blogger / build-github 之渲染邏輯
- 補 completeness object + missingFields array + relatedLinks/otherLinks count

---

## §5 dev-mode-only 邊界說明

per Admin-1-b 之 `src/scripts/build-github.js` 修改：

### 5.1 機制

1. **早期 cleanup**：`main()` 開頭**永遠** `fs.rm -rf .cache/pages/admin/`（防 stale 殘留誤入 prod build）
2. **dev mode 條件 render**：`if (mode === 'dev') { render admin... }`；prod build 不執行
3. **standalone EJS**：admin/index.ejs 為完整 HTML 文件；**不**經 base.ejs 包裝 → 無 nav / footer / GA4 / AdSense / back-to-top JS 注入
4. **noindex meta**：admin HTML head 含 `<meta name="robots" content="noindex, nofollow">`（多一層 search engine 防護）

### 5.2 prod build 流程之 admin 自動 isolation

```
npm run build  (即 prebuild --mode=build + vite build + postbuild build:sitemap)
   ↓
prebuild: build-github.js --mode=build
   ↓
   - rm -rf .cache/pages/admin/   ← 早期 cleanup
   - render category/tag/post pages (normal)
   - render design-system (existing)
   - mode === 'build' → SKIP admin render
   ↓
vite build (emptyOutDir + glob .cache/pages/**/*.html)
   ↓
   .cache/pages/admin/ ABSENT → vite glob 0 hits → dist/admin/ 永遠 ABSENT
   ↓
postbuild: build:sitemap
   ↓
   build-sitemap.js 之 buildEntries() 從 loadGithubPosts 取資料；admin 不在 post-detail / category / tag 範圍 → sitemap 0 admin entries
```

---

## §6 dist / sitemap / public navigation 驗證 snapshot

per Admin-1-c 之 `npm run build` 驗證輸出（每次 verify 結果一致）：

| 驗證項 | 命令 | 結果 |
|---|---|---|
| dev mode admin render | `node src/scripts/build-github.js --mode=dev` | ✅ exit 0；wrote `.cache/pages/admin/index.html`（859 行）|
| prod build admin cleanup | `npm run build` 後 `test -d .cache/pages/admin` | ✅ ABSENT |
| dist 端 admin 不產出 | `test -d dist/admin` | ✅ ABSENT |
| sitemap 不含 admin | `grep -c admin dist/sitemap.xml` | ✅ **0** |
| robots.txt 內容 | `cat dist/robots.txt` | ✅ `Disallow: /design-system/` + `Disallow: /404.html` + `Sitemap: ...`（無需加 admin Disallow，因 prod 不產出）|
| navigation 不含 admin | `grep -c admin content/settings/navigation.json` | ✅ **0** |

---

## §7 尚未做的項目（per Admin-1 read-only scope 限制）

以下屬 Admin-2 / schema 擴充 / Admin-3+ / 其他 phase 範圍，**Admin-1 系列嚴格不做**：

| 項目 | 屬 Phase | 觸發條件 |
|---|---|---|
| **Admin-2 write**（新增 / 編輯 / 刪除）| Admin-2 | 強烈建議 user 先做 Admin-2 write **pre-analysis + safety plan** 後再啟動實作；屬高風險批 |
| **schema gap 擴充**（utm_audience / zh-en 摘要 / 多 FB page 等）| schema 擴充批 | per `admin-mvp-pre-analysis.md` §9；建議在 Admin-2 之前評估 |
| **GA4 measurementId 接入** | 獨立批（GA4 接入）| user 提供 measurementId + 評估 §7 policy 嚴格性 |
| **Blogger 反向 UTM**（Blogger → GitHub UTM）| 反向 UTM 實作批 | 已 per `CLAUDE.md` §16.4 標 future phase |
| **per-post validate warning 顯示** | Admin-1-d（若 user 之後想再增強 read-only）| pure additive；風險低 |
| **inline iframe preview**（admin 內預覽 dist post）| Admin-1-d 或 Admin-3 | 需考慮 dev server iframe sandbox |
| **sidecar diff viewer**（比較 git status 之 sidecar 變動）| Admin-1-d 或 Admin-3 | 需引入 git diff 解析 |
| **multi-page per-post detail route**（`/admin/posts/{slug}/`）| Admin-1-d | 屬 routing 增強；single-page 已足 |
| **build / validate 整合 button** | Admin-3 | per `admin-mvp-pre-analysis.md` §7 Phase Admin-3 |
| **發布輔助**（copy-helper / publishedUrl 回填 form）| Admin-4 | per `admin-mvp-pre-analysis.md` §7 Phase Admin-4 |
| **富 metadata 編輯**（book / download / affiliate）| Admin-5+ | post-MVP |

---

## §8 風險與下一步建議

### 8.1 風險清單

| # | 風險 | 等級 | 對 Admin-2 之啟示 |
|---|---|---|---|
| 1 | Admin 誤 deploy 到公開 GitHub Pages | 🔴 高 | 已透過 dev-mode-only render + early cleanup 雙層保護；Admin-2 write 即使有寫入，仍要保留 dev-mode-only 渲染邊界 |
| 2 | Admin 寫入功能誤啟動 | 🔴 高（Admin-2 啟動後 surface 顯著增加）| Admin-2 啟動前必須先做 pre-analysis + write safety plan；含 atomicity / git collision / rollback / dry-run mode |
| 3 | Admin 直接 import build-github helper 連帶引入 prod 副作用 | 🟡 中 | 當前 Admin 只 import loader；Admin-2 應維持 loader-only import；不 import write helpers |
| 4 | Admin write 與 git commit 衝突（user 手動 edit 同時 admin write）| 🔴 高 | Admin-2 write 前必須先 git status check + diff preview + user 確認 |
| 5 | Admin write atomicity 失敗（寫了 .md 但 .publish.json 失敗）| 🟡 中 | Admin-2 採 temp-file + rename atomic 或 try-commit + rollback |
| 6 | Admin 變更 settings categories / tags 後既有文章 broken | 🟡 中 | Admin-2 應在 settings 編輯 UI 加 dependency warning |
| 7 | Admin 暴露 settings 之 GA4 measurementId / AdSense client ID 於 dev mode | 🟡 中 | dev mode 僅本機；本機作者本來就能讀 settings 檔；屬可接受暴露範圍 |
| 8 | 未來 Admin 線上化 / 加入 auth 之 scope creep | 🟡 中 | 嚴格 phase 拆分；admin-local-boundary §3 之硬性禁則保留 |

### 8.2 下一步建議

✅ **強烈建議**：Admin-2 write 啟動前**先做獨立批 Admin-2 write pre-analysis / write safety plan**。

理由：

- Admin-1 read-only 之風險集中在「不要誤上線」；Admin-2 write 之風險急遽增加（資料破壞 / git 衝突 / atomicity）
- write surface 之設計（哪些欄位允許 write / 何種 validation 在 write 前 / 失敗如何 rollback / git 整合策略）需先有明確 plan
- 沿用今日 Admin-1-a 之 preflight pattern 之成功經驗（preflight → user 批准方案 → 再實作；最低 surprise）

建議下批名：**Phase Admin-2-a：write pre-analysis + safety plan**

範圍：

- audit Admin-1-c 之 loader / EJS 結構（可重用部分）
- 列出 write surface 範圍（per `admin-mvp-pre-analysis.md` §4 7 區欄位）
- safety guarantees（atomicity / git status check / diff preview / dry-run / rollback）
- 風險清單 + 緩解
- 預估 Admin-2-b 實作 scope
- 推薦方案 + 待 user 批准

**不建議**直接進 Admin-2 實作（不對齊 Admin-1-a 之 preflight 經驗）。

---

## §9 stable snapshot 維持紀錄

Admin-1 系列全程**未影響** stable snapshot：

| 維度 | 狀態 |
|---|---|
| Blogger templates / dist-blogger output | ❌ 未動（dist-blogger/posts/we-media-myself2/post.html mtime 仍 2026-05-18 17:06）|
| deploy repo（portable-blog-deploy）| ❌ 未動（HEAD 仍 `4ecd92d`）|
| build-blogger.js / build-promotion.js / build-sitemap.js / build-blogger-theme-css.js | ❌ 未動 |
| GitHub Pages 線上行為（內部 nav / back-to-top / Blogger cross-link UTM）| ❌ 未動 |
| content posts | ❌ 未動 |
| settings JSON | ❌ 未動 |
| package.json | ❌ 未動 |
| npm dependencies | ❌ 未新增 |
| GA4 / AdSense 程式碼 | ❌ 未動 |
| validate baseline `0/22/17` | ❌ 預期未動（本系列未動 validate rules 或 content；本批未跑 validate）|
| navigation / sitemap / robots（線上效果）| ❌ 未動 |
| 雙 repo 分離設計（source 留本機 / public repo 純 deploy-only）| ✅ 維持 |

---

## §10 限制遵守確認（Admin-1 全系列）

| 限制 | Admin-1-a | Admin-1-b | Admin-1-c | Admin-1-wrap |
|---|---|---|---|---|
| read-only / 不寫入 | ✅ | ✅ | ✅ | ✅ |
| 不新增 CRUD | ✅ | ✅ | ✅ | ✅ |
| 不新增 auth / server | ✅ | ✅ | ✅ | ✅ |
| 不大改 build scripts | ✅ | ⚠️ +23 行於 build-github.js（最小可接受）| ✅ | ✅ |
| 不導入大型 framework | ✅ | ✅ | ✅ | ✅ |
| 不修改 content / settings | ✅ | ✅ | ✅ | ✅ |
| 不修改 Blogger / GitHub 產製邏輯 | ✅ | ✅ | ✅ | ✅ |
| 不修改 GA4 / AdSense | ✅ | ✅ | ✅ | ✅ |
| 不修改 deploy repo | ✅ | ✅ | ✅ | ✅ |
| 不 push / amend / rebase / force | ✅ | ✅ | ✅ | ✅ |
| Admin 不進 nav / sitemap / prod dist | ✅ | ✅ | ✅ | ✅ |

---

## §11 邊界聲明

- ✅ 本文件**僅為 completion report**；**不**修改 source code / build / content / dist / deploy
- ✅ 本文件**不**啟動 Admin-2 write
- ✅ 本文件**不**新增 Admin-1-d 功能
- ✅ 本文件**不**改變既有 schema
- ✅ 本文件**不**改變既有 stable snapshot
- ✅ Admin-1 系列 3 commits 線性堆疊；無 amend / rebase / force

---

## §12 Cross-links

- `docs/admin-1-readonly-preflight.md`（Admin-1-a preflight；commit `f876e9e`）
- `docs/admin-mvp-pre-analysis.md`（Admin MVP 詳規劃；Phase Admin-0）
- `docs/admin-local-boundary-pre-analysis.md`（Admin 邊界政策）
- `docs/system-direction.md`（BLOG 系統整體方向）
- `docs/publish-bundle.md`（sidecar 三檔結構；Admin read 之資料來源）
- `docs/content-schema.md`（frontmatter 欄位字典）
- `docs/publish-json-schema.md`（.publish.json schema）
- `docs/fb-sidecar-schema.md`（.fb.md schema）
- `docs/related-links-schema.md`（相關連結 schema；Admin detail panel 之 link count 引用）
- `CLAUDE.md` §11（contentKind）/ §17（article blocks）/ §29（第一版不做清單）

---

（本文件結束）
