# C1-D0 Build Inclusion Inventory Before First Deploy（docs-only）

- **Phase name**：`20260703-d-c1-d0-build-inclusion-inventory-before-first-deploy-docs-only`
- **Date**：2026-07-03（Asia/Taipei；接續 `20260703-C` / C1-C0 audit）
- **Type**：**docs-only / read-only inventory**。**不**改 `content/` / `src/` / `content/settings/` / `CLAUDE.md`、**不** flip status、**不** build、**不** preview、**不** deploy、**不**碰 gh-pages、**不**改 Blogger / GA4 / AdSense / Search Console、**不** `npm install` / dependency / lockfile。唯一 mutation = 新增本檔。

---

## 0. Critical disclaimers（read first）

1. **本輪沒有 build / deploy / preview / flip / gh-pages。** 只做「若現在 `npm run build`，哪些文章會被納入」之靜態盤點。
2. inclusion 結論由**讀 source + loader 過濾邏輯 + sitemap 邏輯推導**得出，**未實際跑 build**；未讀取 `dist/`、未 fetch、未 pull。
3. deploy clone（`portable-blog-deploy` / gh-pages）本輪**未進入、未觸碰**。

---

## 1. Purpose

在首次 deploy 前，盤點目前 `content/github/posts/` 全部文章，回答：

- 若現在 `npm run build`，**哪些文章會進 GitHub Pages 輸出**、哪些被過濾。
- 每篇之 status / draft / blogger.enabled / seo.indexing / includeInListings / includeInSitemap / category / tags。
- 是否有**未預期上線**風險（尤其：build 無法只選單篇，一次會帶入所有 ready+published）。

---

## 2. Session-start baseline（2026-07-03, Asia/Taipei）

Source repo（`/d/github/blog-new/portable-blog-system`）：

```text
branch: main
HEAD = origin/main = 6b18db5c7ad8582a168fd46b64299be8760d3b5d
short: 6b18db5
subject: docs(publish): audit build readiness before first article publish
ahead/behind: 0/0
working tree: clean
.git/index.lock: absent
```

Deploy clone（`/d/github/blog-new/portable-blog-deploy`；本輪未進入）：

```text
branch: gh-pages
HEAD = origin/gh-pages = d0f37eb（carry-forward；未觸碰）
```

Baseline **matched** on entry；未嘗試修正。

---

## 3. Build inclusion 條件（loader 過濾規則）

GitHub Pages build 之文章納入條件（per `src/scripts/load-posts.js` + `src/scripts/load-github-posts.js`）：

**native github post（`site: github`）** —— 本專案 `content/github/posts/` 全部屬此：

```text
draft === true                       → 排除（reason: draft:true）
status ∉ { ready, published }         → 排除（reason: status:<x>）
否則                                  → 納入
```

（`publishTargets.github.enabled` 過濾**只**套用於 blogger-primary cross-source mirror post；native github post 不受此條件過濾。本專案目前無 blogger-cross post。）

**納入 build ≠ 一定進 sitemap**。sitemap 另有 inclusion precedence（per `src/scripts/build-sitemap.js` §3 / `include-in-sitemap.js`）：

```text
1. seo.indexing = 'index'            → include
   seo.indexing = 'noindex-*'        → exclude
2. contentKind === 'download'（無 explicit）→ exclude（SEO-1 fallback）
3. default                           → include
（includeInSitemap === false 可再排除；不能把 noindex/download 強塞進 sitemap）
```

**listing（首頁 / category / tag 卡片）** 與 sitemap 正交：讀 `includeInListings`（download 類預設 exclude，可顯式 `true` 對抗）。

---

## 4. 逐篇盤點（`content/github/posts/`）

> `.fb.md`（`20260504-github-pages-blog-planning.fb.md`）= FB promotion sidecar，**非文章本體**，不參與 GitHub Pages build，不列入下表 build 主體。

| # | filename | title | status | draft | blogger.enabled | seo.indexing | includeInListings | includeInSitemap | category | tags | **build 納入?** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `20260504-github-pages-blog-planning.md` | GitHub Pages 免費空間限制與部落格規劃 | `ready` | `false` | `true` | （無） | （無） | （無） | tech-note | github, vite, static-site | ✅ **納入** |
| 2 | `20260504-portable-blog-system-mvp.md` | Portable Blog System MVP 開發筆記 | `ready` | `false` | `true` | `noindex-follow` | `true` | （無） | tech-note | github, vite, static-site | ✅ **納入**（見註 A） |
| 3 | `2026-06-29-admin-ui-draft-generator-first-test.md` | Admin UI 草稿產生器第一次實測紀錄 | `draft` | `true` | `false` | （無） | （無） | （無） | tech-note | github, vite, static-site | ❌ **排除**（draft:true） |
| 4 | `2026-06-30-what-is-design-token.md` | 什麼是Design Token? | `ready` | `false` | `false` | （無） | （無） | （無） | tech-note | static-site | ✅ **納入** |
| 5 | `2026-07-01-github-pages-build-preview-workflow.md` | GitHub Pages 本機建置與預覽流程筆記 | `published` | `false` | `false` | （無） | （無） | （無） | tech-note | github, vite, static-site | ✅ **納入** |

**註 A（#2 portable-blog-system-mvp）**：`contentKind: download` + `seo.indexing: noindex-follow` + `includeInListings: true` →

- **build 納入**（`ready` → detail 頁 `dist/posts/portable-blog-system-mvp/` 會產生）；
- **但 sitemap 排除**（noindex-follow）；
- **listing 出現**（`includeInListings: true` 顯式對抗 download 預設 exclude）；
- 此「noindex + in-listings」為**刻意**設計，且是 production 唯一 expected warning（`page-noindex-in-listings`）來源。屬既有 documented 狀態，非本輪新問題。

---

## 5. 分類彙總

### 5.1 ready 且會被 build 納入（3 篇）

- #1 `20260504-github-pages-blog-planning.md`（tech-note；indexable → sitemap + listings）
- #2 `20260504-portable-blog-system-mvp.md`（download；noindex → **不進 sitemap**，但 in-listings）
- #4 `2026-06-30-what-is-design-token.md`（tech-note；indexable → sitemap + listings）

### 5.2 published 且會被 build 納入（1 篇）

- #5 `2026-07-01-github-pages-build-preview-workflow.md`（tech-note；indexable → sitemap + listings）

### 5.3 draft / excluded（1 篇）

- #3 `2026-06-29-admin-ui-draft-generator-first-test.md`（`draft: true` / `status: draft`）→ 被 loader 過濾；**不 build、不進 sitemap、不進 listings**。🟢 安全，無上線風險。

### 5.4 noindex（sitemap 排除但仍 build/listing）

- #2 `20260504-portable-blog-system-mvp.md`（見註 A）。

---

## 6. 未預期上線風險

### 6.1 核心風險：build 無單篇選擇性 —— 一次帶入全部 4 篇

`npm run build` **不提供** per-article 選擇；只要是 `ready` 或 `published`（且非 draft），**全部**一起進 `dist/`。因此：

> 🟡 **若 Dean 的意圖只是「發布 design-token 這一篇」，一次 `npm run build` + deploy 會同時帶上 #1 / #2 / #5 共 4 篇（含 design-token）。無法只 build design-token。**

這是首次 deploy 前最重要的決策提醒 —— 不是 bug，是 build 架構本質。需 Dean 明確確認「這 4 篇是否都同意上線 / 更新」。

### 6.2 內容品質提醒（非技術 blocker）

- 🟡 #1 `github-pages-blog-planning.md` 之 body 目前為**初始化 scaffold 佔位文**（「這是一篇初始化範例文章。Phase 1 會建立 Markdown 讀取與 frontmatter 解析。」），但 `status: ready` → 會被 build 納入。若 deploy，此佔位文會（保持或成為）線上內容。屬**內容品質**問題，需 Dean 決定是否先補實內容或維持現狀。
- 🟡 #4 design-token cover 為 placeholder SVG（per C1-C0；advisory）。

### 6.3 已 documented、非本輪新問題

- #2 noindex + in-listings 不對稱 = 刻意設計 + 唯一 expected warning，屬既有 policy lock（`docs/20260626-q6-download-listing-asymmetry-policy-lock.md`）。非風險升級。

### 6.4 相對 live 的 delta = UNKNOWN this round

「這 4 篇哪些已在 live gh-pages（`d0f37eb`）、哪些是新上線」需 build + 對照 `dist` / fetch 才知；本輪不 build / 不 fetch / 不碰 deploy clone → 標 **UNKNOWN（advisory）**。#1 / #2 為舊文（可能已 live）；#4 design-token（6/30 ready）與 #5（7/01 published）相對新，是否已 live 未確認。

---

## 7. 需要 Dean 決策的項目

| # | 決策 | 現況 |
|---|---|---|
| 1 | 是否同意「一次 build 帶上全部 4 篇 ready/published」一起上線 / 更新 | 🔴 待 Dean 確認（build 無單篇選擇） |
| 2 | #1 scaffold 佔位文是否先補實內容再上線，或維持現狀 | 🔴 待 Dean 內容決定 |
| 3 | #4 design-token cover placeholder 是否換真實封面 | 🟡 建議、非強制（per C1-C0） |
| 4 | 是否 flip 任何 ready → published | 🔴 Dean 手動；Claude 不自動 flip |
| 5 | 是否授權 build / deploy | 🔴 Dean 明確授權；本輪不執行 |

---

## 8. 結論

- **現在 build 會納入 4 篇**：#1 github-pages-blog-planning（ready）、#2 portable-blog-system-mvp（ready；noindex 不進 sitemap 但 in-listings）、#4 what-is-design-token（ready）、#5 github-pages-build-preview-workflow（published）。
- **ready 文章會上線嗎？** 會 —— 3 篇 ready（#1 / #2 / #4）在 build+deploy 時**全部**進 `dist/` 並會被部署；`ready` 與 `published` 對 GitHub Pages 靜態輸出無差別（皆 `draft:false` build 候選）。
- **1 篇 draft（#3）安全排除**，無上線風險。
- **未預期上線風險**：主要是 §6.1「build 無單篇選擇 → 一次帶 4 篇」+ §6.2「#1 scaffold 佔位文會隨之上線」。皆屬 **Dean 決策**，非技術 blocker。
- **本輪明確未做**：無 build / deploy / preview / flip / gh-pages；deploy clone 未觸碰。

---

## 9. 本 phase 邊界（self-check）

- ✅ 唯一 file change：新增本檔 `docs/20260703-c1-d0-build-inclusion-inventory.md`。
- ✅ 未改 `src/` / `views/` / `scripts/` / `content/` / `content/settings/` / `package.json` / lockfile / `CLAUDE.md` / `MEMORY.md` / `memory/`。
- ✅ 未 flip 任何文章 status（design-token 仍 `ready`；draft 仍 `draft`）。
- ✅ 未 build / preview / deploy / repost / gh-pages；未讀取 `dist/`；deploy clone 未觸碰。
- ✅ 未改 Blogger / Google / GA4 / AdSense / Search Console。
- ✅ 未 `npm install` / 未動 dependency / lockfile。

---

## 10. Cross-links

- `docs/20260703-c1-b0-single-real-article-publish-checklist-dry-run.md`（C1-B0 §4 dry-run）。
- `docs/20260703-c1-c0-build-readiness-audit.md`（C1-C0 build readiness audit）。
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`（C1 checklist §2 現況表 / §3 status contract）。
- `src/scripts/load-posts.js`（`VISIBLE_STATUS` = {ready, published}；draft 過濾）+ `src/scripts/load-github-posts.js`（cross-source 過濾）。
- `src/scripts/build-sitemap.js` §3 + `src/scripts/include-in-sitemap.js`（sitemap inclusion precedence）。
- `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`（#2 noindex + in-listings policy lock）。

---

（本文件結束 / end of document）
