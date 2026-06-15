# BLOG ADMIN — Categories Read-only Usage Counts Implementation Record

- **Phase**：`20260615-night-5-admin-categories-readonly-usage-counts-a`
- **日期**：2026-06-15（night-5，22:05 起）
- **性質**：source 實作（loader 延伸 + EJS Categories 區塊延伸；不改 production content / settings / templates 之既有檔案；不 npm install；不 deploy；不重貼 Blogger；不動 CLAUDE.md）
- **承接**：
  - `docs/20260615-blog-admin-ia-current-state-preanalysis.md`（pm-2 preanalysis）
  - `docs/20260615-admin-ia-shell-implementation-record.md`（night-1 IA shell；`#categories` section anchor 已存在）
  - `docs/20260615-admin-ia-shell-human-acceptance-record.md`（night-2 IA shell acceptance）
  - `docs/20260615-admin-posts-index-readonly-derived-fields-record.md`（night-3 posts readiness fields）
  - `docs/20260615-admin-posts-readiness-human-acceptance-record.md`（night-4 posts readiness acceptance）

---

## A. Baseline verify

```
branch        : main
working tree  : clean
HEAD          : 30ffd29 == origin/main
last commit   : docs(admin): record posts readiness acceptance

git log --oneline -5:
  30ffd29 docs(admin): record posts readiness acceptance
  215ba07 feat(admin): add posts readiness fields
  deea42b docs(admin): record management shell acceptance
  a34df7d feat(admin): implement management shell
  c751398 docs(admin): plan blog admin information architecture
```

→ baseline 完全符合預期；本 phase 自此基礎上延伸 Categories 區塊。

---

## B. 本 phase 目標

依 night-3 §I §2 / night-4 §I §2 之主線：強化 ADMIN 之 Categories 區塊，加入 **read-only usage counts**，讓使用者可以從 ADMIN 頁直接看到：

- 每個 category 目前被多少文章使用
- 各分類之 ready / draft / published / archived / other 狀態摘要
- 文章來源站台（github / blogger source）分佈
- 跨 site mismatch（post 之 sourceSite 不在 category.site 內）篇數提示
- per-category 樣本文章（slug + title + sourceSite + status）
- uncategorized（無 category 欄位）文章 bucket
- unknown category usage（使用未在 `categories.json` 定義之 category 值）bucket
- unused defined categories（registry 已定義但 0 篇使用）bucket

**明確邊界**（仍是 read-only management shell；不是 CMS）：

- ✅ 在既有 `#categories` 區塊上**延伸**，**不**另開孤立頁面
- ✅ 全部 read-only derived；資料來源 = posts（admin loader）+ `categories.json` registry
- ✅ 明確標示「不取代 validator」；admin 不重跑 validator，per-post warning 計數仍 deferred（沿用 night-3 §C.5 立場）
- ❌ **不**啟用新增 / 編輯 / 刪除 / 發布 / Apply / Save / browser write / middleware / CLI write
- ❌ **不**改 production content（任何 `content/*.md` / `*.publish.json` / `*.fb.md`）
- ❌ **不**改 settings（任何 `content/settings/*.json`；含 `categories.json` / `tags.json`）
- ❌ **不**改 validation rules / `src/scripts/validate-content.js`
- ❌ **不** `npm install`；**不**動 `package.json` / lockfile
- ❌ **不** build / deploy / push gh-pages / 重貼 Blogger / 改 AdSense / GA4 / commerce 後台
- ❌ **不**動 `CLAUDE.md`
- ❌ tag 用量計數 **不在本 phase 範圍**（須獨立 phase；ADMIN 內以 `⏳ 仍未實作` 文字提示，不放假按鈕）

---

## C. 實作內容

### C.1 `buildCategoryUsage(posts, categoriesArr)` helper

新增於 `src/scripts/load-admin-posts.js`，純函式 derive，掃 admin loader 已產生之 `posts` 陣列 + `settings.categories`，產出以下 shape：

```
{
  perCategory: [
    {
      id,                            // 來自 categories.json
      name,                          //
      slug,                          //
      site: [...],                   // 該 category 允許之 surface
      postCount,                     // 使用此 category 之文章篇數
      statusBreakdown: {             // mirror admin 既有 status normalize 邏輯
        ready, draft, published,
        archived, other
      },
      siteBreakdown: {               // 依 sourceSite
        github, blogger
      },
      crossSiteMismatchCount,        // post.sourceSite 不在 category.site[] 內之篇數
      samplePosts: [                 // 限 10 筆
        { slug, title, status, sourceSite, draft, isMismatch }
      ],
      truncated                      // postCount > samplePosts.length → true
    },
    ...排序依 postCount desc / id asc
  ],
  unusedCategories: [...],           // postCount === 0 之 perCategory entries
  unknownCategories: [               // 文章用了不在 registry 之 category key
    {
      key,                           // 原始字串（不 normalize）
      postCount,
      statusBreakdown,
      samplePosts (限 5 筆),
      truncated
    },
    ...
  ],
  uncategorized: {                   // 無 category 欄位
    count, samplePosts (限 10 筆), truncated
  },
  totals: {
    totalPosts,
    categorizedPosts,
    uncategorizedPosts,
    unknownCategoryPosts,
    definedCategoryCount,
    unusedCategoryCount,
    unknownCategoryKeyCount
  }
}
```

**設計要點**：

- **id-or-slug match**：post.category 可指 id 或 slug；helper 同時 index 兩者，避免重複統計
- **cross-site mismatch 來源**：admin loader 之 `sourceSite`（= `content/{github,blogger}/posts/` 之 site）；validator 之 `post.site` 行為類似但語意不完全等同 — 此區明確標示「validator 仍為 ground truth」，admin 只做 derived 提示
- **status normalize**：mirror 既有 admin stats（line 204）之 5-bucket 規則（ready / draft / published / archived / other）
- **sample 限額**：per-category 10、unknown 5、uncategorized 10；避免 admin 頁面過長
- **不寫檔；不打 API；不改 frontmatter / settings；不取代 validator**

### C.2 Build wiring（`src/scripts/build-github.js`）

```diff
-        systemSummary: adminData.systemSummary || null,
+        systemSummary: adminData.systemSummary || null,
+        categoryUsage: adminData.categoryUsage || null,
```

並更新 admin render console log，補上 categoryUsage 摘要：

```
[build-github] admin (dev-mode) rendered: 11 posts; categoryUsage: 4 defined / 0 unknown / 0 uncategorized post(s)
```

### C.3 EJS Categories 區塊延伸（`src/views/admin/index.ejs`）

`#categories` section 由「Categories registry 數量卡 + 簡列 id/name/slug/site 4 欄表」升級為：

1. **Categories registry / Tags registry 卡片**（既有；tags registry 加註 ⏳ 計數仍未實作避免誤導）
2. **Cat totals 列**：7 個 pill 顯示 totalPosts / categorized / uncategorized / unknown / unused defined / cross-site mismatch；超過 0 之 anomaly pill 以暖色 `.warn` 視覺強調
3. **Per-category usage table**：每 category 一 row，含：
   - id / slug（mono）
   - name
   - allowed sites（既有 site badge）
   - posts（總篇數；0 時整 row 灰底）
   - status breakdown（**micro bar chart** 用 inline-flex + flex weight；含 aria-label + 文字 count fallback）
   - by source site（github / blogger 各幾篇；cross-site mismatch 篇數以紅框 callout 顯示）
   - sample posts（最多 10 筆；含 draft/ready/published status badge + slug + title + sourceSite；超出時顯示「…還有 N 篇未列」）
4. **Status color legend**（5 色 swatch）
5. **3 個 sub-bucket cards**：
   - Uncategorized posts（count + sample；0 → 綠色狀態文字）
   - Unknown category usage（per-key 計數 + sample；指向 validator 之 `unknown-category` warning）
   - Unused defined categories（registry 已定義但 0 使用之 entries；不自動移除）
6. **⏳ 仍未實作 planned list**：
   - tag 用量計數（須另開 phase）
   - category / tag 編輯 UI（不開放）
   - per-post category fix（不開放）
   - validator warning 計數 mirror（per-post 仍 deferred）

**CSS 新增**（per phase；只用既有 admin 顏色 token，不引入新色板）：

- `.cat-usage-table` / `.cat-status-bar` + 5 子色 / `.cat-status-legend` / `.cat-status-counts`
- `.cat-sample-list` / `.cat-sample-list .sample-mismatch`
- `.cat-mismatch-callout`
- `.cat-bucket-grid` / `.cat-bucket-card` / `.cat-bucket-card.is-warn`
- `.cat-totals-row` / `.totals-pill` / `.totals-pill.warn`

**無**任何 Add / Edit / Delete / Save / Apply / Submit / Publish 按鈕；無 form；無 disabled-button-as-tease。

---

## D. 變更檔案（精確清單）

```
src/scripts/load-admin-posts.js   — 新增 buildCategoryUsage helper + 5 個輔助函式
                                    + loadAdminPosts return 新增 categoryUsage 欄位
                                    （所有既有 export / behavior 不變）
src/scripts/build-github.js       — admin render context 新增 categoryUsage 欄位
                                    + console log 補 categoryUsage 摘要
src/views/admin/index.ejs         — #categories section 由簡單 list 升級為 usage table + 3 buckets
                                    + 新增 ~30 行 CSS（無新色板，沿用既有 token）
docs/20260615-admin-categories-readonly-usage-counts-record.md  — 本紀錄
```

**未動**：

- `content/`（任何 .md / .publish.json / .fb.md）
- `content/settings/`（任何 JSON；含 `categories.json` / `tags.json` / `ads.config.json` / `ga4.config.json` / `commerce-links.json`）
- `package.json` / lockfile（未 `npm install`；scripts 未動）
- 其他 EJS template（`pages/` / `blogger/` / `design-system/` / `promotion/`）
- `src/scripts/build-blogger.js` / `build-promotion.js` / `build-sitemap.js`
- `src/scripts/resolve-adsense-blocks.js` / `validate-content.js` / `load-posts.js` / `load-settings.js`
- `CLAUDE.md`（per phase 要求）
- Blogger live posts / GitHub Pages live deploy / GA4 / AdSense / commerce 後台
- AdSense real client / slot id（仍只存 `ads.config.json`，不寫進 source / docs）
- GA4 real measurementId（仍只存 `ga4.config.json`，不寫進 source / docs）

---

## E. Validation results

### E.1 必跑檢查

```
npm run validate:content
→ 0 error(s) / 94 warning(s) on 84 post(s)    ← baseline carry-forward 不變

node src/scripts/build-github.js --mode=dev
→ admin (dev-mode) rendered: 11 posts; categoryUsage: 4 defined / 0 unknown / 0 uncategorized post(s)
→ wrote .cache/pages/admin/index.html
→ done in ~150ms
```

### E.2 git 驗證

```
git diff --check    → 無實際錯誤（僅 LF→CRLF 行終結器 warning；既有 repo config，不是本 phase 引入）
git diff --stat
  src/scripts/build-github.js       |   6 +-
  src/scripts/load-admin-posts.js   | 167 ++++++++++++++++++++++-
  src/views/admin/index.ejs         | 287 +++++++++++++++++++++++++++++++++++++---
  3 files changed, 443 insertions(+), 17 deletions(-)
git status -sb
  ## main...origin/main
   M src/scripts/build-github.js
   M src/scripts/load-admin-posts.js
   M src/views/admin/index.ejs
```

### E.3 Rendered admin HTML 結構驗證

```
grep "Per-category usage|Unknown category usage|Unused defined categories|Uncategorized posts|cat-usage-table|cat-status-bar|cat-bucket-card"  in .cache/pages/admin/index.html
   → 36 matches（含 5 個區塊標題 + 4 categories 各組 status-bar/sample/badge）

grep "<code class=\"cat-id\">(tech-note|book-review|life-note|download)"  in .cache/pages/admin/index.html
   → 4 matches（4 個 category 全列）

grep "ready N · draft N · published"  in .cache/pages/admin/index.html
   → 4 matches（per-category 4 row 之 status counts 文字）
```

### E.4 Masking / leak guard

```
grep "ca-pub-[0-9]{12,}" / "G-[A-Z0-9]{8,}"
  in src/views/admin/index.ejs
     src/scripts/load-admin-posts.js
     src/scripts/build-github.js
     docs/20260615-admin-categories-readonly-usage-counts-record.md
  → 0 matches（real AdSense client / GA4 measurementId 未寫入 source / docs）

grep "ca-pub-…"  in .cache/pages/admin/index.html
  → 2 matches（既有 IA shell 之 dashboard masked tail4；本 phase 未新增 AdSense markup）
```

### E.5 Category usage 分佈（admin loader 量測；當前 11 篇 admin post）

| category id | name | allowed sites | postCount | status breakdown | source site | cross-site mismatch |
|---|---|---|---|---|---|---|
| `life-note` | 生活文章 | blogger | 5 | ready 5 / draft 0 / published 0 / archived 0 / other 0 | github 0 · blogger 5 | 0 |
| `book-review` | 書評 | blogger | 3 | ready 1 / draft 2 / published 0 / archived 0 / other 0 | github 0 · blogger 3 | 0 |
| `tech-note` | 技術筆記 | github, blogger | 2 | ready 2 / draft 0 / published 0 / archived 0 / other 0 | github 2 · blogger 0 | 0 |
| `download` | 教具下載 | blogger | 1 | ready 0 / draft 1 / published 0 / archived 0 / other 0 | github 0 · blogger 1 | 0 |
| **totals** |  |  | **11** | **ready 8 / draft 3 / 其他 0** |  | **0** |

- uncategorized：**0**（所有文章皆有 category）
- unknown category：**0 key / 0 篇**（所有 category 皆在 registry）
- unused defined categories：**0**（4 個 registry entry 皆有至少 1 篇）
- cross-site mismatch：**0**（無 post 之 sourceSite 違反 category.site）

→ 與 `npm run validate:content` 之 `unknown-category` / `category-site-mismatch` warning 數一致（baseline 之 94 warning 中皆無此兩類，皆來自其他 fixture rule）。

### E.6 未跑（與本 phase 無關之既有 guard）

- `check:adsense-resolver` / `check:adsense-article-block` / `check:adsense-anchor-wiring` / `check:blogger-adsense-output`：本 phase **未改** AdSense source / settings / EJS partial / build / dist；既有 carry-forward measurement（34/0、13/0、14/0、85/0）不受影響
- `build:blogger` / `build` / `build:sitemap` / `npm install`：未跑（無 prod build / deploy 需求）
- `npm run admin:write`：未跑（content write path 仍 dormant）

---

## F. Explicit non-actions

- ❌ 未新增第三方套件；未 `npm install`；未動 `package.json` / lockfile
- ❌ 未改任何 production content（`content/{github,blogger}/posts/*.md` / `.publish.json` / `.fb.md`）
- ❌ 未改任何 settings JSON（含 `categories.json` / `tags.json` / `ads.config.json` / `ga4.config.json` / `commerce-links.json` / `affiliate-networks.json`）
- ❌ 未改其他 EJS template（`pages/` / `blogger/` / `design-system/` / `promotion/`）
- ❌ 未改 `build-blogger.js` / `build-promotion.js` / `build-sitemap.js` / 其他 renderer / validator
- ❌ 未改 `src/scripts/validate-content.js` / `load-posts.js` / `load-settings.js` / `resolve-adsense-blocks.js`
- ❌ 未改 GA4 tracking implementation / measurementId / events / custom dimensions
- ❌ 未改 AdSense resolver / slot 行為 / real AdSense ID / `ads.enabled` master switch
- ❌ 未改 commerce-links registry / affiliate-networks / token / credential 紅線
- ❌ 未動 slug / permalink / category / tags 資料
- ❌ 未動 `categories.json`（registry 本身完全未改；只讀）
- ❌ 未動 `tags.json`（read 都沒有；本 phase tag 用量計數 deferred）
- ❌ 未 `npm run build` / `build:blogger` / `build:sitemap` / `build:promotion`
- ❌ 未 deploy / 未 push gh-pages / 未動 `portable-blog-deploy` clone
- ❌ 未開 Blogger 後台 / 未重貼任何 Blogger 文章
- ❌ 未開 AdSense 後台 / 未動 ad 設定
- ❌ 未動 GA4 後台 / 未抓 GA4 報表 / 未打 GA4 API
- ❌ 未動 commerce 後台 / 未新增 affiliate entry
- ❌ 未動 `CLAUDE.md`（per phase 要求；本紀錄只新增 docs/* 一檔）
- ❌ 未啟用 browser write / middleware / Apply button / gated CLI for content
- ❌ 未在 ADMIN 內新增任何 Add / Edit / Delete / Publish / Save / Apply / Submit 互動或 disabled-button-as-tease
- ❌ 未在 admin 內 re-run validator（per-post warning 計數仍 deferred；以 `npm run validate:content` 為 ground truth）
- ❌ 未自動補 missing category / 未自動建議 unknown category 對映
- ❌ 未自動移除 unused defined categories
- ❌ 未把 read-only acceptance 視為對 ADMIN 寫入路徑之解鎖訊號
- ❌ 未把 read-only acceptance 視為 deploy / Blogger repost gate 解除
- ❌ 未壓縮 / 重排 CLAUDE.md
- ❌ 未把 hardcoded real AdSense client / slot id / GA4 measurementId 寫進 source / docs

---

## G. Commit / push

預計 commit：

```
feat(admin): add category usage counts
```

Files staged：

```
src/scripts/build-github.js
src/scripts/load-admin-posts.js
src/views/admin/index.ejs
docs/20260615-admin-categories-readonly-usage-counts-record.md
```

CLAUDE.md：本 phase **不**動。

push：依 phase 指示推到 `origin/main`。

---

## H. Next recommended phase

依本 phase 之實作與 night-3 / night-4 之 next-phase 主線：

### 保守路線（推薦預設）

1. **`20260615-night-final-idle-freeze-after-admin-categories-usage-counts-a`** —
   收工 idle freeze；不再於本日推進；等 user 隔日決定下一個功能路線（並做 human acceptance）。

### Acceptance（並行可做；不動 source）

2. **`20260615-XX-admin-categories-readonly-usage-counts-human-acceptance-a`** —
   人眼瀏覽 `/admin/#categories`，確認 usage table / 3 buckets / planned list 是否符合預期；docs-only。

### 下一個功能路線（等 user 確認後再做）

3. **`20260616-admin-tags-readonly-usage-counts-a`** —
   對齊本 phase 的 categories 結構，把 tags 也加 read-only usage counts（per-tag post count / status / site / mismatch）。仍 read-only。
4. **`20260616-admin-posts-detail-readability-refinement-a`** —
   回應 night-4 §E 之觀察：改善 Posts detail readability（標題層級 / 分隔線 / 空白 / collapse grouping / summary badges）。仍 read-only。

### 仍按既定主線之候選（不在本日推進）

5. **`20260615-XX-admin-validation-per-post-aggregation-preanalysis-a`** —
   docs-only preanalysis：探討 admin loader / validator sourcePath 對齊或 per-post API 設計；不改 validator。
6. **`20260615-XX-admin-post-detail-readonly-expand-a`** —
   detail panel 擴充 commerce ref / book metadata / download ref / prev / next slug 預覽。
7. **`20260615-XX-admin-build-deploy-readonly-status-a`** —
   接 `report:build` / git log，read-only 顯示最後 build / deploy 狀態。
8. **（最後）write path** —
   仍按 preanalysis §E 分階段紅線：read-only → copy-helper / dry-run → gated CLI write → middleware（須獨立安全 preanalysis）。**不跳階。**

---

（本紀錄結束）
