# 20260521 Dev Route Fix Manual Verification

本文件記錄 **Phase 20260521-mid-4 系列**（dev route 404 diagnosis + fix + user manual verification）之收尾紀錄。

對應上層：
- `CLAUDE.md` §26 — `npm run dev` 必須能本機檢視 GitHub 靜態站
- `vite.config.js` line 11 — `base = command === 'serve' ? '/' : './'` 之 mode-aware 既有原則
- `src/scripts/build-github.js` — `siteBasePath()` / `makeBaseData()` 之 basePath 注入點
- `docs/architecture.md` / `docs/github-deploy.md` — 既有 architecture / deploy 對齊

---

## §1 問題

### 1.1 現象

`npm run dev` 啟動 vite dev server 後：

- 首頁 `http://localhost:5173/` 可正常打開
- 但首頁上所有 internal link（header brand / nav / post card / category / tag）點擊後 → **404**

### 1.2 404 範例

```
http://localhost:5173/portable-blog-system/posts/github-pages-blog-planning/
```

### 1.3 user 觀察之 source code

首頁 HTML 內 internal links 形如：

```html
<a class="lab-header__brand" href="/portable-blog-system/">...</a>
<a href="/portable-blog-system/posts/">...</a>
<a href="/portable-blog-system/categories/">...</a>
<a href="/portable-blog-system/posts/github-pages-blog-planning/">閱讀文章</a>
```

而 vite dev server 之 asset 引用為：

```html
<script type="module" src="/@vite/client"></script>
<script type="module" src="/_assets/entry.js"></script>
```

→ **dev server 從根 namespace `/` 提供頁面；但 EJS internal links 帶 `/portable-blog-system/` prefix；兩者 namespace 不對齊 → 404**

---

## §2 根因

per Phase 20260521-mid-4-a read-only diagnosis：

`src/scripts/build-github.js` 之 `siteBasePath()` 原本邏輯：

```js
function siteBasePath(settings) {
  const url = settings.site?.githubSiteUrl || '';
  if (!url) return '';
  try {
    return new URL(url).pathname.replace(/\/+$/, '');
  } catch (e) {
    return '';
  }
}
```

- 讀 `settings.site.githubSiteUrl` = `https://babel-lab.github.io/portable-blog-system`
- 推導 pathname = `/portable-blog-system`
- 透過 `makeBaseData(settings)` 注入 EJS 全域 `basePath` 變數
- EJS 12 個 template 使用 `<%= basePath %>{root-relative-href}` 模式

**關鍵問題**：`siteBasePath()` 與 `makeBaseData()` **不分** dev / build mode；無論 `--mode=dev`（predev）還是 `--mode=build`（prebuild）皆吐 `/portable-blog-system`。

**對比**：`vite.config.js` line 11 之 `base = command === 'serve' ? '/' : './'` 已實踐 mode-aware 原則；但僅作用於 vite assets（`@vite/client` / entry.js），**不**作用於 EJS 注入之 `basePath` 變數。屬 Phase 10-e-fix-a 落地時遺漏 dev case。

---

## §3 修正

### 3.1 commit

`7c9f7ea fix(build): scope basePath to production mode`

### 3.2 修改範圍

`src/scripts/build-github.js`（單檔；3 處改動）：

- `siteBasePath(settings)` → `siteBasePath(settings, mode)`；首行加 `if (mode === 'dev') return '';`
- `makeBaseData(settings)` → `makeBaseData(settings, mode)`；內部 `siteBasePath(settings, mode)` 轉發
- main 流程 caller：`makeBaseData(settings, mode)`（mode 已由既有 `parseMode()` line 406 取得；本批僅新增傳遞）

### 3.3 dev vs build basePath

| mode | trigger | basePath |
|---|---|---|
| `dev` | `predev: node src/scripts/build-github.js --mode=dev` | `''`（空字串；early return）|
| `build` | `prebuild: node src/scripts/build-github.js --mode=build` | `/portable-blog-system`（推導自 `githubSiteUrl`；保留原邏輯）|
| undefined / 其他 | 直接 `node src/scripts/build-github.js` | 走 production 推導（保守 default；保留 production 行為）|

### 3.4 diff stat

```
1 file changed, 9 insertions(+), 4 deletions(-)
```

---

## §4 user 手動驗證

### 4.1 步驟

1. **Ctrl+C** 停掉舊 `npm run dev`（修正落地前啟動之 session；`.cache/pages` 內 HTML 仍含舊 basePath）
2. **重新執行** `npm run dev`（自動跑 `predev: ... --mode=dev` 重產 `.cache/pages` 為新 basePath = `''`；然後 vite serve）

### 4.2 驗證結果

✅ **user 確認：本機網頁連結真的正常了**。

具體 user 確認重點：

- ✅ dev server 重啟後，`predev` 重產 `.cache/pages`
- ✅ Internal links 已改為 dev root path（不再帶 `/portable-blog-system/`）
- ✅ localhost 下不再導向 `/portable-blog-system/...`
- ✅ 網頁連結可正常開啟（首頁、文章列表、分類、文章 detail、admin）

### 4.3 預期 vs 實際對應

| 預期 dev URL | 實際 |
|---|---|
| `http://localhost:5173/` | ✅ 200 OK（首頁）|
| `http://localhost:5173/posts/` | ✅ 200 OK（文章列表）|
| `http://localhost:5173/categories/` | ✅ 200 OK（分類列表）|
| `http://localhost:5173/posts/github-pages-blog-planning/` | ✅ 200 OK（文章 detail）|
| `http://localhost:5173/admin/` | ✅ 200 OK（Admin；本就不受 basePath 影響）|

---

## §5 邊界

| 維度 | 結果 |
|---|---|
| **production GitHub Pages URL** | ✅ **不變**；prod build 仍 `/portable-blog-system/posts/...`；deploy repo (`portable-blog-deploy` HEAD `4ecd92d`) 未動 |
| **sitemap.xml** | ✅ 不變（基於 absolute `siteBaseUrl`，不經 `basePath`）|
| **canonical URL** | ✅ 不變（同上）|
| **JSON-LD url** | ✅ 不變（同上）|
| **og:url** | ✅ 不變（同上）|
| **Blogger 輸出** | ✅ 不變（`build-blogger.js` 屬獨立 pipeline；不用 `basePath`）|
| **Admin 頁** | ✅ 不變（`src/views/admin/index.ejs` 無 `basePath` 使用；grep 確認 0 match）|
| **drawer / back-to-top JS** | ✅ 不變（純 client-side；不讀 `basePath`）|
| **404 頁** | ✅ 功能不變；dev mode 下 prefix 對齊 root 是預期行為 |
| **本 phase 是否跑 build** | ❌ 未跑（spec 禁止 + 採保守做法）|
| **本 phase 是否改 dist** | ❌ 未動 |
| **本 phase 是否改 src（mid-4-c 範疇）** | ❌ 未動（mid-4-c 屬 docs sync）|

---

## §6 後續

### 6.1 已完成

- ✅ Phase 20260521-mid-4-a read-only diagnosis（無 commit；純分析）
- ✅ Phase 20260521-mid-4-b dev-route-fix（commit `7c9f7ea`）
- ✅ Phase 20260521-mid-4-c manual verification docs sync（本批；本 doc 落地）

### 6.2 仍 deferred

| 項目 | 說明 |
|---|---|
| **Production sanity check** | 若 user 想驗證 prod build 仍正常，可另開 phase 跑 `npm run build` 並檢視 `dist/index.html` 內 `<a href="/portable-blog-system/posts/...">` 是否仍正確。本批未跑 build；屬可選。|
| **Idle freeze** | 本批 docs sync 後可進 idle freeze；working tree 預期保持 clean |

### 6.3 不建議今天做

| 項目 | 理由 |
|---|---|
| Push to GitHub remote | 屬 user 明示啟動之事項；本日所有 commits 皆未 push |
| Deploy（更新 GitHub Pages 線上）| 屬獨立 pipeline；user 明示時才跑 |

---

## §7 對既有系統之影響

| 維度 | 狀態 |
|---|---|
| `src/**` | ❌ 未動（本 phase 純 docs；mid-4-b 已 commit）|
| `content/**` | ❌ 未動 |
| `dist/**` | ❌ 未動 |
| `package.json` | ❌ 未動 |
| `vite.config.js` | ❌ 未動 |
| Deploy repo | ❌ 未動（HEAD 仍 `4ecd92d`）|
| GitHub Pages 線上 | ❌ 未動 |
| Blogger 後台 | ❌ 未動 |
| validate baseline `0/38/33` | ❌ 預期未動（純 docs；mid-4-b 邏輯改動亦不在 validate 範圍）|

---

## §8 邊界聲明

- ✅ 本文件僅為 verification 紀錄；不改任何 source / build / dist / deploy
- ✅ 本文件不啟動任何新 phase
- ✅ 本文件不修改 README / roadmap 等既有 docs 之索引（per spec 「只更新合適既有文件或新增 verification doc」之保守邊界）
- ✅ 本文件不 push

---

## §9 Cross-links

- `src/scripts/build-github.js` — `siteBasePath()` / `makeBaseData()` 修正點
- `vite.config.js` line 11 — mode-aware 既有原則
- `content/settings/site.config.json` — `githubSiteUrl` 設定來源
- `CLAUDE.md` §26 — `npm run dev` 必須能本機檢視
- 今日完成 commits：`f3c7ee8` / `bd0d6e8` / `da00f53` / `818e135` / `edbf6d0` / `022d8bd` / `7c9f7ea`

---

## §10 Production Sanity Check（Phase 20260521-mid-5 / mid-5-b）

本章節記錄 mid-4-b 修正落地後之 production build sanity check 結果。屬保險驗證；確認 dev / build mode 分流之 build mode 端**未壞**任何 production 行為。

### 10.1 npm run build 結果

| 階段 | 結果 |
|---|---|
| `predev` / 不適用本批 | n/a（本批跑 `npm run build` 而非 dev）|
| `prebuild`（`build-github.js --mode=build`） | ✅ done in 208ms；產出 `.cache/pages/` 全部 HTML（含 posts / categories / tags / design-system / 404）|
| `vite build` | ✅ built in 1.01s；35 modules transformed；無 error |
| `postbuild`（`build-sitemap.js`） | ✅ done in 49ms；產出 `dist/sitemap.xml`（14 url entries）+ `dist/robots.txt` |
| 整體 | ✅ 成功；無 error / warning |
| 產出 dist 檔 | 25 個（HTML pages + entry CSS / JS + sitemap.xml + robots.txt）|

### 10.2 Production internal links 檢查

| 位置 | 連結 prefix 預期 | 實際 |
|---|---|---|
| `dist/index.html` header brand | `/portable-blog-system/` | ✅ `<a class="lab-header__brand" href="/portable-blog-system/">` |
| `dist/index.html` nav 連結（首頁 / 文章 / 分類） | `/portable-blog-system/{path}/` | ✅ 三項皆正確 |
| `dist/index.html` post card 連結（3 篇）| `/portable-blog-system/posts/{slug}/` | ✅ `we-media-myself2` / `github-pages-blog-planning` / `portable-blog-system-mvp` 三篇皆正確 |
| `dist/index.html` mobile drawer 連結 | `/portable-blog-system/{path}/` | ✅ 三項皆正確 |
| `dist/posts/github-pages-blog-planning/index.html` header / nav / mobile drawer | 同首頁規則 | ✅ 全對 |
| 不該出現之 root path 連結（`href="/posts/"` / `href="/categories/"` / `href="/tags/"` 等無 prefix）| 應 **0 個** | ✅ grep 兩個 dist HTML 皆 0 match |

→ build mode basePath = `/portable-blog-system` 完整保留；mid-4-b 修正未污染 production output。

### 10.3 SEO 絕對 URL 檢查

| 位置 | 欄位 | 值 |
|---|---|---|
| `dist/index.html` | canonical | `https://babel-lab.github.io/portable-blog-system/` ✓ |
| `dist/index.html` | og:url | `https://babel-lab.github.io/portable-blog-system/` ✓ |
| `dist/index.html` | JSON-LD `url` + `@id` | `https://babel-lab.github.io/portable-blog-system/` ✓ |
| `dist/posts/github-pages-blog-planning/index.html` | canonical | `https://babel-lab.github.io/portable-blog-system/posts/github-pages-blog-planning/` ✓ |
| `dist/posts/github-pages-blog-planning/index.html` | og:url | 同上 ✓ |

→ canonical / og:url / JSON-LD 皆基於 absolute `siteBaseUrl`（不經 `basePath` 變數）；mid-4-b 之 basePath mode 分流對此鏈無影響。

### 10.4 Sitemap 檢查

| 項目 | 值 |
|---|---|
| `dist/sitemap.xml` `<loc>` 數量 | **14**（與既有 baseline `0/38/33` 對齊之 sitemap 14 entries 一致）|
| 全部 `<loc>` 以 `https://babel-lab.github.io/portable-blog-system/` 開頭 | ✅ 14 / 14 |
| 是否含 localhost 污染 | ❌ 0 個 match |
| 首條 `<loc>` | `https://babel-lab.github.io/portable-blog-system/` |
| 次條 `<loc>` | `https://babel-lab.github.io/portable-blog-system/posts/` |

→ sitemap 完整保留 production 絕對 URL；mid-4-b 修正未影響 build-sitemap pipeline。

### 10.5 dist `.gitkeep` 處理紀錄

- **現象**：`npm run build` 啟動時 vite `emptyOutDir: true` 清空 `dist/` 全部內容；其中 git 追蹤之 placeholder `dist/.gitkeep` 一併被刪除
- **影響**：build 後 `git status --short` 顯示 ` D dist/.gitkeep`；其他 dist 產出檔皆 `.gitignored` 不入 diff
- **決議**：Option A — `git restore dist/.gitkeep`（保留 placeholder 之原始設計；不 commit deletion；不 commit dist 內容）
- **執行**：mid-5-b 啟動時 `git restore dist/.gitkeep` → working tree 立即 clean
- **未來**：每次 `npm run build` 仍會觸發此 side effect；建議 user 自行決定長期策略（如改 `.gitignore` 排除 `.gitkeep` 之 emptyOutDir 行為 / 接受 commit deletion / 持續手動 restore）；本批不擅自啟動長期策略

### 10.6 對齊 mid-4-b 修正之確認矩陣

| 確認項 | 結果 |
|---|---|
| dev mode 已修正為 root path | ✅ mid-4-c user 手測通過 |
| build mode 仍保留 `/portable-blog-system` prefix | ✅ §10.2 確認 |
| dist 中 internal links 未壞 | ✅ §10.2 |
| canonical / og:url / JSON-LD 未壞 | ✅ §10.3 |
| sitemap 未壞 | ✅ §10.4（14 url entries baseline 維持）|
| 本批未動 source / content / docs（除本 doc）/ package.json / vite.config.js / EJS templates / fixtures | ✅ |
| 本批未跑 validate:content | ✅ |
| 本批未 push / 未 deploy | ✅ |
| dist 目前狀態 | ✅ restored；working tree clean |

### 10.7 進入 idle freeze 之 baseline

| 項目 | 值 |
|---|---|
| HEAD（本批 commit 後將更新）| `3f97890`（commit 前）→ 本 docs commit 後新增 1 個 hash |
| working tree（本批 commit 後）| clean |
| dist | clean（`.gitkeep` 已 restore；其餘 .gitignored）|
| deploy repo | `4ecd92d`（未動）|
| validate baseline | `0/38/33`（未跑驗證；mid-4-b / mid-5 邏輯改動不在 validate 範圍）|
| sitemap | 14 url entries（不變）|

---

（本文件結束）
