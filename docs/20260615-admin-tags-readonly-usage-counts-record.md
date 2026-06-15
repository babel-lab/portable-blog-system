# BLOG ADMIN — Tags Read-only Usage Counts Implementation Record

- **Phase**：`20260615-night-7-admin-tags-readonly-usage-counts-a`
- **日期**：2026-06-15（night-7，22:35 起）
- **性質**：source 實作（loader 延伸 + EJS Categories & Tags 區塊延伸 Tags 部分；不改 production content / settings / templates 之既有檔案；不 npm install；不 deploy；不重貼 Blogger；不動 CLAUDE.md）
- **承接**：
  - `docs/20260615-blog-admin-ia-current-state-preanalysis.md`（pm-2 preanalysis）
  - `docs/20260615-admin-ia-shell-implementation-record.md`（night-1 IA shell）
  - `docs/20260615-admin-ia-shell-human-acceptance-record.md`（night-2 IA shell acceptance）
  - `docs/20260615-admin-posts-index-readonly-derived-fields-record.md`（night-3 posts readiness fields）
  - `docs/20260615-admin-posts-readiness-human-acceptance-record.md`（night-4 posts readiness acceptance）
  - `docs/20260615-admin-categories-readonly-usage-counts-record.md`（night-5 categories usage counts implementation）
  - `docs/20260615-admin-categories-readonly-usage-counts-human-acceptance.md`（night-6 categories usage acceptance）

---

## A. Baseline verify

```
branch        : main
working tree  : clean
HEAD          : 77bdc20 == origin/main
last commit   : docs(admin): record category usage acceptance

git log --oneline -5:
  77bdc20 docs(admin): record category usage acceptance
  f9f7ef5 feat(admin): add category usage counts
  30ffd29 docs(admin): record posts readiness acceptance
  215ba07 feat(admin): add posts readiness fields
  deea42b docs(admin): record management shell acceptance
```

→ baseline 完全符合預期；本 phase 自此基礎上延伸 Tags 區塊。

---

## B. 本 phase 目標

依 night-5 §H §3 / night-6 §I §2 之主線：強化 ADMIN 之 Tags 區塊，加入 **read-only usage counts**，讓使用者可以從 ADMIN 頁直接看到：

- 每個 tag 目前被多少文章使用（per-post dedupe，同篇若意外重複列同 tag 只計一次）
- 各 tag 之 ready / draft / published / archived / other 狀態摘要
- 文章來源站台（github / blogger source）分佈
- 跨 site mismatch（post 之 sourceSite 不在 tag.site 內）篇數提示
- per-tag 樣本文章（slug + title + sourceSite + status）
- untagged（無 tags 欄位 / 空陣列）文章 bucket
- unknown tag usage（使用未在 `tags.json` 定義之 tag）bucket
- unused defined tags（registry 已定義但 0 篇使用）bucket

**明確邊界**（仍是 read-only management shell；不是 CMS）：

- ✅ 在既有 `#categories` 區塊上**延伸**為 Categories & Tags 雙區塊，**不**另開孤立頁面
- ✅ 全部 read-only derived；資料來源 = posts（admin loader）+ `tags.json` registry
- ✅ 與 night-5 categories 共用 CSS class（`.cat-usage-table` / `.cat-status-bar` / `.cat-sample-list` / `.cat-bucket-card` / `.cat-totals-row`）；**不**引入新色板 / 新 token
- ✅ 明確標示「不取代 validator」；admin 不重跑 validator（per-post warning 計數仍 deferred）
- ❌ **不**啟用新增 / 編輯 / 刪除 / 發布 / Apply / Save / browser write / middleware / CLI write
- ❌ **不**改 production content（任何 `content/*.md` / `*.publish.json` / `*.fb.md`）
- ❌ **不**改 settings（任何 `content/settings/*.json`；含 `categories.json` / `tags.json`）
- ❌ **不**改 validation rules / `src/scripts/validate-content.js`
- ❌ **不** `npm install`；**不**動 `package.json` / lockfile
- ❌ **不** build / deploy / push gh-pages / 重貼 Blogger / 改 AdSense / GA4 / commerce 後台
- ❌ **不**動 `CLAUDE.md`

---

## C. 實作內容

### C.1 `buildTagUsage(posts, tagsArr)` helper

新增於 `src/scripts/load-admin-posts.js`，純函式 derive，掃 admin loader 已產生之 `posts` 陣列 + `settings.tags`，產出以下 shape：

```
{
  perTag: [
    {
      id, name, slug, site: [...],   // 來自 tags.json
      postCount,                      // 使用此 tag 之文章篇數（per-post dedupe）
      statusBreakdown: { ready, draft, published, archived, other },
      siteBreakdown: { github, blogger },
      crossSiteMismatchCount,         // post.sourceSite 不在 tag.site[] 內之篇數
      samplePosts: [ { slug, title, status, sourceSite, draft, isMismatch }, ... ],  // 限 10 筆
      truncated
    },
    ...排序依 postCount desc / id asc
  ],
  unusedTags: [...],
  unknownTags: [
    { key, postCount, statusBreakdown, samplePosts (限 5 筆), truncated },
    ...
  ],
  untagged: { count, samplePosts (限 10 筆), truncated },
  totals: {
    totalPosts,
    taggedPosts,                 // = totalPosts - untaggedPosts（含同時帶 known + unknown tag 之文章）
    untaggedPosts,
    postWithUnknownTagCount,     // 至少帶一個 unknown tag 之文章篇數
    definedTagCount,
    unusedTagCount,
    unknownTagKeyCount
  }
}
```

**設計要點**：

- **mirror buildCategoryUsage**：rule、sample 限額、排序、結構一致；唯一差異為「tag 是 array → per-post 內 dedupe + 同篇可同時出現在 known sample 與 unknown bucket」
- **id-or-slug match**：post.tags 元素可指 id 或 slug；helper 同時 index 兩者
- **per-post dedupe**：若同篇 frontmatter.tags 意外重複列同 tag，只計一次
- **cross-site mismatch 來源**：admin loader 之 `sourceSite`（與 categories 一致）；validator 之 `tag-site-mismatch` 仍為 ground truth
- **status normalize**：mirror 既有 admin stats（line 204）之 5-bucket 規則
- **sample 限額**：per-tag 10、unknown 5、untagged 10（共用 categories 常數）
- **不**寫檔；**不**打 API；**不**改 frontmatter / settings；**不**取代 validator

### C.2 Build wiring（`src/scripts/build-github.js`）

```diff
         categoryUsage: adminData.categoryUsage || null,
+        // Phase 20260615-night-7-admin-tags-readonly-usage-counts-a
+        tagUsage: adminData.tagUsage || null,
```

並更新 admin render console log，補上 tagUsage 摘要：

```
[build-github] admin (dev-mode) rendered: 11 posts; categoryUsage: 4 defined / 0 unknown / 0 uncategorized post(s); tagUsage: 7 defined / 1 unknown / 0 untagged post(s)
```

### C.3 EJS Categories & Tags 區塊延伸（`src/views/admin/index.ejs`）

`#categories` section 由「Categories per-category usage + 3 buckets」延伸為「Categories 區塊 + 視覺分隔 `<hr>` + Tags 區塊 + Tags 3 buckets」：

1. **Categories registry / Tags registry 卡片**（既有；Tags registry 之 `⏳ 用量計數仍未實作` 文字改為「用量計數 / 未使用偵測 / cross-site mismatch 見下方 Per-tag usage」）
2. **Categories Per-category usage 表格 + Categories 3 buckets**（既有，未動）
3. **【新】Tags Per-tag usage 區塊**：
   - 視覺分隔 `<hr>` + h3 `Tags — Per-tag usage`（含 `id="tags"` anchor）
   - Tag totals 列：7 個 pill（totalPosts / tagged / untagged / 篇有 unknown tag / unknown tag key / unused defined / cross-site mismatch）；anomaly pill 以暖色 `.warn` 強調
   - Per-tag usage table：每 tag 一 row（id / slug、name、allowed sites、posts、status breakdown + 文字 counts、by source site + cross-site mismatch callout、sample posts ≤10）
4. **【新】Tags 3 sub-bucket cards**：Untagged posts / Unknown tag usage / Unused defined tags（共用 `.cat-bucket-card` class）
5. **⏳ 仍未實作 planned list**：移除「tag 用量計數」一行；保留 category / tag 編輯 UI / per-post 修正 / unused 移除建議 / validator warning 計數 mirror（皆 deferred）

**CSS**：本 phase **完全沿用**既有 `.cat-usage-table` / `.cat-status-bar` / `.cat-status-legend` / `.cat-status-counts` / `.cat-sample-list` / `.cat-mismatch-callout` / `.cat-bucket-grid` / `.cat-bucket-card` / `.cat-totals-row` / `.totals-pill` 等 class；**未**新增任何 class / 色票 / token。

**Nav**：admin nav 新增 `<li><a href="#tags">Tags</a></li>`（提供直接 anchor 跳轉；無新 router / 無外連）。

**無**任何 Add / Edit / Delete / Save / Apply / Submit / Publish 按鈕；**無** form；**無** disabled-button-as-tease。

---

## D. 變更檔案（精確清單）

```
src/scripts/load-admin-posts.js   — 新增 buildTagUsage helper
                                    + loadAdminPosts return 新增 tagUsage 欄位
                                    （所有既有 export / behavior 不變；buildCategoryUsage 未動）
src/scripts/build-github.js       — admin render context 新增 tagUsage 欄位
                                    + console log 補 tagUsage 摘要
src/views/admin/index.ejs         — admin nav 新增 #tags 連結
                                    + #categories section 註解 + lede 補入 tags.json
                                    + Tags registry surface-note 由 deferred 改為「見下方 Per-tag usage」
                                    + 新增 Tag totals row / Per-tag usage table / 3 sub-bucket cards
                                    + planned-list 移除「tag 用量計數」一行
                                    （無新 CSS；無新 class；無新色板）
docs/20260615-admin-tags-readonly-usage-counts-record.md  — 本紀錄
```

**未動**：

- `content/`（任何 .md / .publish.json / .fb.md）
- `content/settings/`（任何 JSON；含 `categories.json` / `tags.json` / `ads.config.json` / `ga4.config.json` / `commerce-links.json`）
- `package.json` / lockfile（未 `npm install`；scripts 未動）
- 其他 EJS template（`pages/` / `blogger/` / `design-system/` / `promotion/`）
- `src/scripts/build-blogger.js` / `build-promotion.js` / `build-sitemap.js`
- `src/scripts/resolve-adsense-blocks.js` / `validate-content.js` / `load-posts.js` / `load-settings.js`
- `src/scripts/check-*.js` / `admin-field-validators.js` / `active-source-keys.js` / `active-commerce-links.js`
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
→ admin (dev-mode) rendered: 11 posts;
  categoryUsage: 4 defined / 0 unknown / 0 uncategorized post(s);
  tagUsage: 7 defined / 1 unknown / 0 untagged post(s)
→ wrote .cache/pages/admin/index.html
→ done in ~147ms
```

### E.2 git 驗證

```
git diff --check    → 無實際錯誤（僅 LF→CRLF 行終結器 warning；既有 repo config，不是本 phase 引入）
git diff --stat
  src/scripts/build-github.js     |   6 +-
  src/scripts/load-admin-posts.js | 145 ++++++++++++++++++++++-
  src/views/admin/index.ejs       | 242 +++++++++++++++++++++++++++++++++++++---
  3 files changed, 377 insertions(+), 16 deletions(-)
git status -sb
  ## main...origin/main
   M src/scripts/build-github.js
   M src/scripts/load-admin-posts.js
   M src/views/admin/index.ejs
```

### E.3 Rendered admin HTML 結構驗證

```
grep "Per-tag usage|Untagged posts|Unknown tag usage|Unused defined tags"  in .cache/pages/admin/index.html
   → 4 matches（4 個區塊標題皆 render）

grep -oE '"cat-id">[a-z][a-z-]*'  in .cache/pages/admin/index.html | sort -u
   → 10 unique（4 categories: tech-note / book-review / download / life-note
              + 7 tags: book / book-review / reading-notes / self-growth / github / vite / static-site
              + 1 unknown tag: download；book-review 同時出現於 categories.json 與 tags.json
              且 download 同時出現於 categories.json 與 unknown tag bucket）

grep "篇 tag|篇 untagged|有 unknown tag|unknown tag key|unused defined|cross-site mismatch" in .cache/pages/admin/index.html
   → tag totals row 7 pills 全 render
   → categories totals row 6 pills 不變（既有）
```

### E.4 Masking / leak guard

```
grep "ca-pub-[0-9]{12,}" / "G-[A-Z0-9]{8,}" in src/views/admin/index.ejs / src/scripts/load-admin-posts.js / src/scripts/build-github.js / docs/20260615-admin-tags-readonly-usage-counts-record.md
  → 0 matches（real AdSense client / GA4 measurementId 未寫入 source / docs）

grep "ca-pub-…" in .cache/pages/admin/index.html
  → 2 matches（既有 IA shell 之 dashboard masked tail4；本 phase 未新增 AdSense markup）
```

### E.5 Tag usage 分佈（admin loader 量測；當前 11 篇 admin post）

| tag id | name | allowed sites | postCount | 主要備註 |
|---|---|---|---|---|
| `reading-notes` | 讀書筆記 | blogger | 5 | （life-note + book-review 共用） |
| `self-growth` | 自我成長 | blogger | 5 | |
| `book-review` | 書評 | blogger | 3 | |
| `book` | 書籍 | blogger | 3 | |
| `github` | GitHub | github | 1 | github-only |
| `vite` | Vite | github | 1 | github-only |
| `static-site` | 靜態網站 | github | 1 | github-only |

- untagged：**0**（所有文章皆有非空 tags 陣列）
- unknown tag key：**1**（`download`，被 1 篇 draft `phonics-practice-sheet-download.md` 使用；`download` 為 categories.json 定義之 category id，**未**列入 tags.json）
- 篇有 unknown tag：**1**（同上 draft 文章）
- unused defined tags：**0**（7 個 tags.json entry 皆有 ≥1 篇文章使用）
- cross-site mismatch（tag）：**0**

> 補充說明：`unknown tag` 在 admin loader 顯示為 1，但 `npm run validate:content` 之 `unknown-tag` warning **本 baseline 未觸發** — 因 validator 對 ready / published 篇套 sourcePath filter，而 `phonics-practice-sheet-download` 為 draft，validator 不掃。Admin loader 含 draft，於此 read-only 表面誠實揭露 — 屬「admin 提供額外可見性，validator 仍為 ready/published ground truth」之預期差異，符合 night-5 §C.5 立場。

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
- ❌ 未改 admin loader 之 `buildCategoryUsage` 既有 helper（僅新增 `buildTagUsage`）
- ❌ 未改 EJS 之 Categories per-category usage table / 3 buckets（既有 markup 完全未動）
- ❌ 未引入新 CSS class / 新色板 / 新 token（Tags 區塊全部沿用 `.cat-*` class）
- ❌ 未改 GA4 tracking implementation / measurementId / events / custom dimensions
- ❌ 未改 AdSense resolver / slot 行為 / real AdSense ID / `ads.enabled` master switch
- ❌ 未改 commerce-links registry / affiliate-networks / token / credential 紅線
- ❌ 未動 slug / permalink / category / tags 資料
- ❌ 未動 `tags.json`（registry 本身完全未改；只讀）
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
- ❌ 未自動補 missing tag / 未自動建議 unknown tag 對映
- ❌ 未自動移除 unused defined tags
- ❌ 未自動修正 phonics-practice-sheet-download.md 之 `download` tag（即使可推測作者意圖；admin 不寫 frontmatter）
- ❌ 未把 read-only acceptance 視為對 ADMIN 寫入路徑之解鎖訊號
- ❌ 未把 read-only acceptance 視為 deploy / Blogger repost gate 解除
- ❌ 未壓縮 / 重排 CLAUDE.md
- ❌ 未把 hardcoded real AdSense client / slot id / GA4 measurementId 寫進 source / docs

---

## G. Commit / push

預計 commit：

```
feat(admin): add tag usage counts
```

Files staged：

```
src/scripts/build-github.js
src/scripts/load-admin-posts.js
src/views/admin/index.ejs
docs/20260615-admin-tags-readonly-usage-counts-record.md
```

CLAUDE.md：本 phase **不**動。

push：依 phase 指示推到 `origin/main`。

---

## H. Next recommended phase

依本 phase 之實作與 night-6 / night-5 之 next-phase 主線：

### 保守路線（推薦預設）

1. **`20260615-night-final-idle-freeze-after-admin-tags-usage-counts-a`** —
   收工 idle freeze；不再於本日推進；等 user 隔日決定下一個功能路線（並做 human acceptance）。

### Acceptance（並行可做；不動 source）

2. **`20260615-XX-admin-tags-readonly-usage-counts-human-acceptance-a`** —
   人眼瀏覽 `/admin/#tags`，確認 Tag totals row / Per-tag usage table / Tags 3 buckets 是否符合預期；docs-only。

### 下一個功能路線（等 user 確認後再做）

3. **`20260616-admin-posts-detail-readability-refinement-a`** —
   回應 night-4 §E 與 night-6 §D 之觀察：改善 Posts detail readability + Categories / Tags usage tables 之 responsive 折版（card layout 切換）。仍 read-only。
4. **`20260616-admin-validation-per-post-aggregation-preanalysis-a`** —
   docs-only preanalysis：探討 admin loader / validator sourcePath 對齊或 per-post API 設計；不改 validator。

### 仍按既定主線之候選（不在本日推進）

5. **`20260615-XX-admin-post-detail-readonly-expand-a`** —
   detail panel 擴充 commerce ref / book metadata / download ref / prev / next slug 預覽。
6. **`20260615-XX-admin-build-deploy-readonly-status-a`** —
   接 `report:build` / git log，read-only 顯示最後 build / deploy 狀態。
7. **（最後）write path** —
   仍按 preanalysis §E 分階段紅線：read-only → copy-helper / dry-run → gated CLI write → middleware（須獨立安全 preanalysis）。**不跳階。**

---

（本紀錄結束）
