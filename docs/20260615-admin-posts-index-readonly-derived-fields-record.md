# BLOG ADMIN — Posts Index Read-only Derived Fields Implementation Record

- **Phase**：`20260615-night-3-admin-posts-index-readonly-derive-fields-a`
- **日期**：2026-06-15（night-3，21:20 起）
- **性質**：source 實作（loader 延伸 + EJS 顯示；不改 production content / settings / templates 之既有檔案；不 npm install；不 deploy；不重貼 Blogger）
- **承接**：
  - `docs/20260615-blog-admin-ia-current-state-preanalysis.md`（pm-2 preanalysis §F 缺口欄位）
  - `docs/20260615-admin-ia-shell-implementation-record.md`（night-1 IA shell；本 phase 在其上延伸 Posts 區塊）
  - `docs/20260615-admin-ia-shell-human-acceptance-record.md`（night-2 human acceptance；驗收要點 = 可由 ADMIN 看系統狀況）

---

## A. Baseline verify

```
branch        : main
working tree  : clean
HEAD          : deea42b == origin/main
last commit   : docs(admin): record management shell acceptance
git log --oneline -5:
  deea42b docs(admin): record management shell acceptance
  a34df7d feat(admin): implement management shell
  c751398 docs(admin): plan blog admin information architecture
  efdc6f5 docs(ga4): verify article bottom nav p1 report
  95430d1 docs(ga4): record p1 custom dimensions registration
```

→ baseline 完全符合預期；本 phase 自此基礎上延伸 Posts 區塊。

---

## B. 本 phase 目標

依 night-1 §I §1（admin-posts-index-readonly-derive-fields）與 preanalysis §F「per-post 資料模型缺口（多數識別 / surface / commerce 欄位 loader 已備；缺口 = GA4 / AdSense readiness / nav 狀態 / validation 計數 / last-checked，皆可 read-only derive）」，把 ADMIN Posts 區塊由「只列 frontmatter / publish.json 既有欄位」擴充到「可看每篇文章之 GA4 / AdSense / nav / content readiness 摘要」。

明確邊界：

- ✅ 在既有 Posts 區塊上**延伸**，**不**另開孤立頁面
- ✅ 全部 read-only derived；每欄位附 source / note 明示限制
- ✅ Validation per-post 計數：**deferred**（兩個 loader 之 post-shape / sourcePath 表示法不一致；不為本 phase 重寫 validator）
- ❌ **不**啟用新增 / 編輯 / 刪除 / 發布 / Apply / Save / browser write
- ❌ **不**改 production content（任何 `content/*.md` / `*.publish.json` / `*.fb.md`）
- ❌ **不**改 settings（任何 `content/settings/*.json`）
- ❌ **不**改 AdSense resolver 行為 / `ads.config.json` / real AdSense ID
- ❌ **不**改 GA4 tracking implementation / measurementId / events
- ❌ **不** `npm install`；**不**動 `package.json` / lockfile
- ❌ **不** build / deploy / push gh-pages / 重貼 Blogger
- ❌ **不**動 `CLAUDE.md`

---

## C. 實作之 derived fields

每篇 post 在 admin loader 之 `toAdminView` 返回時，新增 **5 個 readiness 物件**（外加 generation timestamp）；每物件附 `source` + `note` 欄位明示推導來源與限制：

### C.1 Content readiness（static / from frontmatter）

| 欄位 | 來源 | UI 顯示 |
|---|---|---|
| `titleExists` | `fm.title` 非空 string | `present` / `missing` badge |
| `slugExists` | `fm.slug` 非空 string | `present` / `missing` + slug mono |
| `contentKindExists` | `fm.contentKind` 非空 | kind badge / `missing` |
| `statusValue` | `fm.status` | ready / draft / published / archived / `no status` |
| `draftFlag` | `fm.draft === true` | 顯示為 draft badge |
| `categoryExists` | `fm.category` 非空 | category badge / `no category` |
| `tagCount` | `fm.tags.length` | `N tag(s)` badge |

> Source：frontmatter（title / slug / contentKind / status / draft / category / tags）。

### C.2 Navigation readiness（template-level only）

| 欄位 | 來源 | UI 顯示 |
|---|---|---|
| `templateLevel` | 固定 `'ready'`（build-github post-detail.ejs 已含 prev / next / home + N8 anchor wiring） | `template-level ready` badge |
| `eligibleForNav` | `publishTargets.github.enabled === true` | `eligible` / `not eligible` badge |
| `perPostLiveVerified` | **always `false`** — 不偽稱已 live verified | `no` badge + note「admin 不抓 GA4 後台」 |
| `source` | `'template-level (build-github.js post-detail.ejs)'` | text |
| `note` | `'GA4 點擊事件實際送達須以 GA4 後台 / DebugView / Exploration 驗證；admin 不抓 GA4 報表'` | text |

> 關鍵：本欄**不**宣稱「每篇都已驗證 GA4 點擊」；只標 template-level markup-ready。

### C.3 GA4 readiness（static config only；masked）

| 欄位 | 來源 | UI 顯示 |
|---|---|---|
| `configEnabled` | `settings.ga4.enabled === true` | `true` / `false` badge |
| `hasMeasurementId` | `settings.ga4.measurementId` 非空 | `present` / `(none)` |
| `measurementIdTail4` | tail4 of measurementId | `G-…XXXX`（**只顯示 tail4 mask；source / EJS 無真實 ID**） |
| `eventsRegistered` | `settings.ga4.events.length` | 數字 |
| `surfaceIndexable` | `deriveSeoIndexingStatus(fm)` → `index` / `noindex-follow` / `noindex-nofollow` | `indexable` / `noindex` / `unknown` badge + value mono |
| `perPostEventReceived` | **always `'unknown'`** — 不打 GA4 API | `unknown` badge + 明示 admin 不抓 GA4 |
| `source` | `'static-config (settings.ga4 + frontmatter.seo.indexing)'` | text |
| `note` | 明示 admin 不打 GA4 API / 不抓報表 + 指向 P1 report verified doc | text |

> 關鍵：本欄**不**宣稱 GA4 實際有收到事件；只 mirror settings 與 frontmatter.seo.indexing 之 markup readiness。

### C.4 AdSense readiness（per-post resolver 推導）

| 欄位 | 來源 | UI 顯示 |
|---|---|---|
| `configEnabled` | `settings.ads.enabled === true` | `true` / `false` badge |
| `hasClient` | `settings.ads.adsenseClient` 非空 | `(client present · masked)` / `(client missing)` |
| `postLevelEnabled` | `!(fm.adsense && fm.adsense.enabled === false)` | `not opted out` / `opted out` |
| `overrideSource` | `'post.adsense.blocks'` / `'settings.ads.defaults.blocks'` / `'none'` | mono badge |
| `pagesBlockCount` | `deriveRenderedAdsenseBlocks({adsense}, settings.ads, 'pages')` 之每 anchor 加總 | `N block(s)` badge |
| `bloggerBlockCount` | 同上但 surface = `'blogger'` | `N block(s)` badge |
| `source` | `'resolve-adsense-blocks.js (read-only; not deploying)'` | text |
| `note` | 明示「build-time resolver 之預期結果；live 廣告是否填充屬 AdSense 端，admin 不抓後台」 | text |

> 重用既有 `src/scripts/resolve-adsense-blocks.js`（pure module；不 mutate）；不暴露 real client / slot id（只回 count）。
>
> 量測：當前 baseline 11 篇 admin post，pages surface 全 6 blocks（皆 fallback 至 `settings.ads.defaults.blocks[]`），blogger surface 全 1 block（仅 `articleAd6` 之 `surfaces` 含 `blogger`）。production posts 未設 per-post `adsense.blocks[]` override。

### C.5 Validation readiness — DEFERRED

| 欄位 | 值 |
|---|---|
| `perPostWarningCount` | `'deferred'` |
| `reason` | `'validate-content uses load-posts.js post-shape with relative sourcePath; admin loader uses absolute path; cross-loader join deferred'` |
| `source` | `'deferred'` |
| `aggregateCommand` | `'npm run validate:content'` |

> **Deferred 原因**（per user 明示「若沒有安全 per-post API 改在 docs 記錄 deferred」）：
> - `validate:content` 主入口走 `src/scripts/load-posts.js`（與 admin 的 `loadAdminPosts` 為兩條獨立 loader）。
> - `loadAdminPosts` 用 `path.resolve(mdPath)` → 絕對路徑；`validateContent` 內部 `issue.sourcePath` 為相對路徑。
> - 對齊兩端、或把 validator 改為 per-post API，皆屬獨立 phase，**不**為這件事重寫 validator。
> - 不在 admin loader 內 re-run validator（避免 double-run / loader drift / 效能成本）。
> - UI 直接顯示 `warn def.` badge + 提示 `npm run validate:content` 取整體結果。

### C.6 Generation timestamp（last derived / checked）

| 欄位 | 值 |
|---|---|
| `builtAt` | build-github 已傳入 admin EJS（ISO 8601） |
| UI | Posts 區塊頂端顯示 `generatedAt / lastDerivedAt: <ISO timestamp>` |

> **不**寫入 source / production content / commit `.cache/` 或 `dist/`；dev server 重 build 會更新此 timestamp。

---

## D. UI 變更概覽

### D.1 Posts 區塊頂端

- 新增小型 generation banner：`generatedAt / lastDerivedAt: <ISO> · 本次 admin 頁所有 derived 欄位皆於此時間從 frontmatter / settings 推導；重新整理 dev server 會重新 derive`

### D.2 Table row · Completeness 欄位內

- 在 `FB pub` badge 後追加分隔線 + `readiness ▾` label
- 顯示 5 個 compact badges：
  - `ads:pages <N>` — pages surface 可解析 block 數
  - `ads:blogger <N>` — blogger surface 可解析 block 數
  - `idx ok` / `noindex` / `idx ?` — surfaceIndexable
  - `nav eligible` / `nav n/a` — eligibleForNav
  - `warn def.` — validation deferred（hover 顯示「per-post validation aggregation deferred; run npm run validate:content」）

> 不新增 column（避免動到 detail row 的 `colspan="7"`）；新 badges 進入既有「Completeness」cell 之下半。

### D.3 Detail panel · Readiness 區塊

- 在「Platform Routing」之後、「Dates」之前**新增** `<div class="detail-section">`，包含 5 個 sub-block：
  1. Content readiness
  2. Navigation readiness
  3. GA4 readiness（含 measurementId masked）
  4. AdSense readiness（含 pages / blogger 兩 surface 之 block count）
  5. Validation warnings（deferred + reason）
- 每 sub-block 結尾附 `source` + `note` 文字明示推導來源與限制
- 區塊標題附 `read-only · derived` section-tag
- **無**任何 Apply / Save / Edit / Submit / Publish / Delete / Add 按鈕

---

## E. 變更檔案（精確清單）

```
src/scripts/load-admin-posts.js  — import deriveRenderedAdsenseBlocks；新增 deriveSeoIndexingStatus
                                   + countResolvedAdsenseBlocks helper；toAdminView 加 5 組 readiness
                                   物件並返回；其他既有欄位 / 行為不變
src/views/admin/index.ejs        — Posts 區塊頂端加 generation timestamp banner；row Completeness
                                   cell 加 5 compact badges；detail panel 加 Readiness section
                                   （Platform Routing 之後 / Dates 之前）
docs/20260615-admin-posts-index-readonly-derived-fields-record.md  — 本紀錄
```

**未動**：

- `content/`（任何 .md / .publish.json / .fb.md）
- `content/settings/`（任何 JSON；含 `ads.config.json` / `ga4.config.json` / `categories.json` / `tags.json` / `commerce-links.json` / `affiliate-networks.json` 等）
- `package.json` / lockfile（未 `npm install`；scripts 未動）
- 其他 EJS template（`pages/` / `blogger/` / `design-system/` / `promotion/`）
- `src/scripts/build-github.js`（admin render context 已於 night-1 落地；本 phase 不動）
- `src/scripts/build-blogger.js` / `build-promotion.js` / `build-sitemap.js`
- `src/scripts/resolve-adsense-blocks.js`（只 import，不 mutate）
- `src/scripts/validate-content.js` / `load-posts.js`
- `CLAUDE.md`（per phase 要求）
- Blogger live posts / GitHub Pages live deploy / GA4 / AdSense / commerce 後台

---

## F. Validation results

### F.1 必跑檢查

```
npm run validate:content
→ 0 error(s) / 94 warning(s) on 84 post(s)    ← baseline carry-forward 不變

node src/scripts/build-github.js --mode=dev
→ admin (dev-mode) rendered: 11 posts
→ wrote .cache/pages/admin/index.html
→ done in ~150ms
```

### F.2 git 驗證

```
git diff --check    → 無錯誤
git diff --stat     → 2 files changed, 331 insertions(+), 0 deletions(-)
                       src/scripts/load-admin-posts.js | 147 +
                       src/views/admin/index.ejs       | 184 +
git status -sb      → ## main...origin/main
                       M src/scripts/load-admin-posts.js
                       M src/views/admin/index.ejs
                       ?? docs/20260615-admin-posts-index-readonly-derived-fields-record.md
```

### F.3 Masking 驗證

**Rendered admin HTML（`.cache/pages/admin/index.html`）**：

```
grep "ca-pub-…"  → 1 match  (masked: "ca-pub-…3759")
grep "G-…F8VD"   → 多次     (masked tail4 in each post's GA4 readiness section)
grep "ca-pub-2445077695943759"  → 0 match  ← real AdSense client NOT leaked
grep "G-C77SMPF8VD"             → 0 match  ← real GA4 measurementId NOT leaked
grep "(7549133677|7465373194|3751770373|7035489397|7582284302|3892656977)"
                                → 0 match  ← real slot IDs NOT leaked
```

**Source 端（EJS + JS）**：

```
grep "ca-pub-[0-9]{12,}" src/views/admin/index.ejs src/scripts/load-admin-posts.js
                                → 0 match
grep "G-C77SMPF8VD|G-[A-Z0-9]{8,}" src/views/admin/index.ejs src/scripts/load-admin-posts.js
                                → 0 match
grep "(7549133677|3892656977|2445077695943759|C77SMPF8VD)" src/views/admin/ src/scripts/load-admin-posts.js src/scripts/build-github.js src/scripts/resolve-adsense-blocks.js
                                → 0 match
```

→ Real AdSense client / 6 slot IDs / GA4 measurementId 一律**不**在 source；rendered HTML 只見 tail4 mask。

### F.4 Readiness 區塊渲染分佈

```
"Readiness <span" 出現次數              = 11  （每 post 一個）
"resolved blocks · pages" 出現次數        = 11
"per-post warning count" 出現次數        = 11
"template-level ready" 出現次數           = 11
"warn def." 出現次數                     = 11

ads:pages 分佈    → 11 篇皆 6 blocks（fallback 至 settings.ads.defaults.blocks[]，per N9b resolver design）
ads:blogger 分佈  → 11 篇皆 1 block（唯一 articleAd6 之 surfaces 含 "blogger"）
nav eligible       → 3 篇  (github.enabled=true)
nav n/a            → 8 篇  (github.enabled=false / blogger-only)
idx ok             → 10 篇 (含 default indexable)
noindex (badge)    → 出現於 noindex-* post 之 readiness 區塊
```

→ 分佈合理；resolver fallback / per-post override / surface gating 行為與 N9b / N8 anchor wiring 設計一致。

### F.5 未跑

- `npm run build` / `build:blogger` / `build:sitemap` / `build:promotion`：本 phase 不改 production 輸出，無需重跑
- `check:adsense-resolver` / `check:adsense-article-block` / `check:adsense-anchor-wiring` / `check:blogger-adsense-output`：本 phase **未改** AdSense resolver / EJS partial / ads.config.json / dist；既有 carry-forward measurement（34/0、13/0、14/0、85/0）不受影響
- `npm install`：未跑（無新套件需求）
- `npm run admin:write`：未跑（content write path 仍 dormant）

---

## G. Explicit non-actions

- ❌ 未新增第三方套件；未 `npm install`；未動 `package.json` / lockfile
- ❌ 未改任何 production content（`content/{github,blogger}/posts/*.md` / `.publish.json` / `.fb.md`）
- ❌ 未改任何 settings JSON（含 `ads.config.json` / `ga4.config.json` / `categories.json` / `tags.json` / `commerce-links.json` / `affiliate-networks.json`）
- ❌ 未改其他 EJS template（`pages/` / `blogger/` / `design-system/` / `promotion/`）
- ❌ 未改 `build-blogger.js` / `build-promotion.js` / `build-sitemap.js` / `build-github.js` / 任何 renderer / validator
- ❌ 未改 `resolve-adsense-blocks.js`（只 import / 不 mutate）
- ❌ 未改 GA4 tracking implementation / measurementId / events / custom dimensions
- ❌ 未改 AdSense resolver / slot 行為 / real AdSense ID / `ads.enabled` master switch
- ❌ 未改 commerce-links registry / affiliate-networks / token / credential 紅線
- ❌ 未動 slug / permalink / category / tags 資料
- ❌ 未 `npm run build` / `build:blogger` / `build:sitemap` / `build:promotion`
- ❌ 未 deploy / 未 push gh-pages / 未動 `portable-blog-deploy` clone
- ❌ 未開 Blogger 後台 / 未重貼任何 Blogger 文章
- ❌ 未開 AdSense 後台 / 未動 ad 設定
- ❌ 未動 GA4 後台 / 未抓 GA4 報表 / 未打 GA4 API
- ❌ 未壓縮 / 重排 `CLAUDE.md`（per phase 要求；本紀錄與 ledger sync 為將來決定）
- ❌ 未啟用 browser write / middleware / Apply button / gated CLI for content
- ❌ 未在 ADMIN 內提供任何 Apply / Save / Submit / Edit / Publish / Delete / Add 互動
- ❌ 未把 hardcoded real AdSense client / slot id / GA4 measurementId 寫進 source（只走 settings → loader → render tail4 masking）
- ❌ 未把 read-only derived 視為「已 live verified」訊號
- ❌ 未把 Blogger VIEW count 增加判定為真實流量或 AdSense 成效

---

## H. Commit / push

預計 commit：

```
feat(admin): add posts readiness fields
```

Files staged：

```
src/scripts/load-admin-posts.js
src/views/admin/index.ejs
docs/20260615-admin-posts-index-readonly-derived-fields-record.md
```

CLAUDE.md：本 phase **不**動。

push：依 phase 指示推到 `origin/main`。

---

## I. Next recommended phase

依本 phase 之 deferred 項目與 night-1 §I §2–4 主線：

1. **`20260615-XX-admin-post-detail-readonly-expand-a`** —
   單篇 detail panel 進一步擴充：
   - 把 commerce ref / book metadata / download ref 等已 loader 備但 detail 未顯示之欄位納入 read-only 顯示
   - 加 prev / next slug 預覽（從 GitHub Pages 列表序推導；不打 GA4）
2. **`20260615-XX-admin-categories-readonly-usage-counts-a`** —
   Categories / Tags 用量計數（per post category↔post 反向索引）+ cross-site mismatch 紅綠燈（per validate-content 之 `category-site-mismatch` / `tag-site-mismatch` rule）
3. **`20260615-XX-admin-validation-per-post-aggregation-preanalysis-a`** —
   docs-only preanalysis：探討如何在 admin loader / validator 之間建立 per-post warning 對齊（兩條 loader 之 sourcePath 統一，或為 validator 加 per-post API）；不改 validator
4. **`20260615-XX-admin-build-deploy-readonly-status-a`** —
   接 `report:build` / git log，read-only 顯示最後 build / deploy 狀態
5. **（最後）write path** —
   仍按 preanalysis §E 分階段紅線：read-only → copy-helper / dry-run → gated CLI write → middleware（須獨立安全 preanalysis）。**不跳階。**

**保守替代**：本 phase 收工後可請 user 人眼瀏覽新 Readiness 區塊，再決定下一階段是 detail expand 還是 categories usage counts。

---

（本紀錄結束）
