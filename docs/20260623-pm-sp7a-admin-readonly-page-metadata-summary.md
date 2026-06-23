# SP-7a — Admin read-only page metadata summary（implementation ledger）

> Phase：`20260623-pm-sp7a-admin-readonly-page-metadata-summary-a`（2026-06-23）
> Baseline：`main @ 1943545`（HEAD == origin/main，ahead/behind 0/0，working tree clean）
> 前身：
> - `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1，架構）
> - `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2，schema + validator）
> - `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3，robots helper）
> - `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a，listing helper）
> - `docs/20260623-pm-sp5a-include-in-sitemap-selector-wiring.md`（SP-5a，sitemap helper）
> - `docs/20260623-pm-sp7-admin-metadata-visibility-preanalysis.md`（SP-7，Admin visibility preanalysis；本實作之直接規格）

本 phase 落地 SP-7 preanalysis §E–§G：Admin detail panel 新增 **read-only**「Page metadata / 頁面中繼設定」
collapsible section，顯示 special page-type / indexing / listing / sitemap metadata 之 raw + effective 值。
**純顯示**；不啟用 write path、不改 content、不改 Blogger / GitHub post / listing / sitemap output。

---

## A. Phase name

`20260623-pm-sp7a-admin-readonly-page-metadata-summary-a`

## B. Baseline observed

| 項目 | 值 |
|---|---|
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `1943545` |
| origin/main | `1943545` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `docs(admin): analyze page metadata visibility` |

baseline 與 phase 預期完全一致。

## C. Files changed

| 檔案 | 變更 |
|---|---|
| `src/scripts/page-metadata-summary.js` | **新增** 純函式 helper `derivePageMetadataView(fm)`：委派既有 SP-3/4a/5a helper（robots / listing / sitemap）+ mirror SP-2 validator warning + safe gatedDownload / platformPolicy 投影。零依賴、無 side effect。 |
| `src/scripts/check-page-metadata-summary.js` | **新增** 22-case node:assert smoke（只 import 純 helper；zero new dependency；未加 package.json script）。 |
| `src/scripts/load-admin-posts.js` | **additive**：import helper；`toAdminView()` 計算 `pageMetadata = derivePageMetadataView(fm)` 並加入 return 物件（+16 行）。既有 view 欄位逐字未動。 |
| `src/views/admin/index.ejs` | **additive**：detail panel Readiness section 之後新增 1 個 `<details class="detail-section">` 純 read-only「Page metadata / 頁面中繼設定」section（+100 行；無 input / select / textarea / button / onclick / fetch / form / Apply / 任何 write path）。 |
| `docs/20260623-pm-sp7a-admin-readonly-page-metadata-summary.md` | 本 ledger。 |

未動：`page-type-robots.js` / `include-in-listings.js` / `include-in-sitemap.js` / `validate-content.js` /
`build-github.js` / `build-blogger.js` / `build-sitemap.js` / content / settings / package / lockfile /
dist / gh-pages / `.cache` / 生成 HTML / `CLAUDE.md` / `MEMORY.md`。

## D. Helper / summary behavior

`derivePageMetadataView(fm)` 回傳 read-only `pageMetadata` 物件：

| 欄位 | 內容 | 來源 |
|---|---|---|
| `pageType` | `{ raw, present, valid, label }`（缺省 label = `article (default)`） | frontmatter（SP-2 封閉列舉） |
| `seoIndexing` | `{ value, indexable, source }` | mirror `deriveSeoIndexingStatus`（同一 seo.indexing 規則） |
| `robots` | `{ value, source }` | `resolvePostDetailRobots(fm)`（SP-3）+ source 標籤 |
| `includeInListings` | `{ raw, rawLabel, effective }` | `resolveIncludeInListings(fm)`（SP-4a） |
| `includeInSitemap` | `{ raw, rawLabel, effective, eligible }` | `resolveIncludeInSitemap` / `isSitemapEligible`（SP-5a） |
| `includeInFeeds` | `{ raw, rawLabel, hasConsumer:false }` | frontmatter（無消費端） |
| `gatedDownload` | `{ present, isObject, mechanism, postSubmitResource, suspiciousKeys[] }` | **只 safe 欄位**；suspicious key **只列名、不 echo value** |
| `platformPolicy` | `{ present, isObject, platforms[{name,indexing,includeInListings}] }` | **只 safe primitive 摘要** |
| `warnings` | `[{ type, badge, message }]` | **逐條 mirror SP-2 `validatePageTypeMetadata`** rule type |
| `summary` | `{ indexable, listing, sitemap, warningCount }` | 收合摘要列預覽用 |

- effective 值**全部委派既有 SP-3/4a/5a helper**；Admin 不另算 business logic。
- 缺省欄位 → default / current behavior（非 error）。

## E. Admin UI section added

- detail panel Readiness section 之後、Governance signals 之前，新增 `<details class="detail-section">`
  （**預設 closed**，mirror 既有 collapsible section 慣例）。
- `<summary>` 顯示 effective 一行（`索引 · 列表 · sitemap`）+ 任何 `b-warn` warning badge（收合時仍可見）。
- 內含 1 個 `<dl class="detail-grid">`：頁面類型 / 搜尋引擎索引 / robots meta (effective) / 顯示於列表 /
  加入 sitemap / 加入 feeds / 受控下載 / 平台覆寫 /（有 warning 時）危險組合。
- 純 `<dl>` + `<span class="badge">`（沿用既有 token：`b-ok` / `b-info` / `b-missing` / `b-warn`；**零新 CSS class**）。
- **無** input / select / textarea / button / onclick / fetch / form / Apply / 任何 write path。
- 每區附 source / note，明示「read-only 推導快照；Admin 不修改 frontmatter；validator 為 ground truth」。

## F. Warning / badge behavior

- 狀態 badge 一律中性 `b-info`（noindex / 隱藏 / 排除多為刻意設定，不渲染成 error）。
- 危險組合 badge `b-warn`（黃；非紅，不暗示 build block）。
- warning 邏輯**逐條 mirror SP-2 `validatePageTypeMetadata`**（rule type 一字不差：`page-type-invalid` /
  `page-include-flag-invalid-type` / `page-platform-policy-invalid-type` / `page-gated-download-invalid-type` /
  `page-gated-download-indexed` / `page-gated-download-in-listings` / `page-noindex-in-sitemap` /
  `page-noindex-in-listings` / `page-redirect-canonical-missing-target` / `page-gated-download-suspicious-field`）。
- 🔴 **temporary duplication（明文記載）**：本 phase **刻意不** refactor `validate-content.js` 之
  `validatePageTypeMetadata` 為 export（避免動到 pin 住 0/104/94 baseline 之大檔；per
  [[feedback_conservative_landing]] 保守偏好）。改在 `page-metadata-summary.js` 內最小化重複實作，每條附
  對映 SP-2 rule type 註解。**validator（`npm run validate:content`）仍為 ground truth**；本 phase
  **未改** validator severity / count（baseline 0/104/94 不漂移）。未來若把 `validatePageTypeMetadata`
  抽成 byte-identical export helper（+ baseline 不漂移 + smoke），可改共用同一份以消除此重複（per SP-7 §G.4）。

## G. Validation results

| 量測 | 期望 | 實測 |
|---|---|---|
| `npm run validate:content` | 0 error / 104 warning / 94 post | ✅ **0 / 104 / 94**（無漂移） |
| `node src/scripts/check-page-type-validator.js`（SP-2） | 20 / 0 | ✅ **20 / 0** |
| `node src/scripts/check-page-type-robots.js`（SP-3） | 29 / 0 | ✅ **29 / 0** |
| `node src/scripts/check-include-in-listings.js`（SP-4a） | 16 / 0 | ✅ **16 / 0** |
| `node src/scripts/check-include-in-sitemap.js`（SP-5a） | 19 / 0 | ✅ **19 / 0** |
| `node src/scripts/check-page-metadata-summary.js`（**新**） | all PASS | ✅ **22 / 0** |
| `npm run check:admin-governance-aggregation`（loader regression） | 16 / 0 | ✅ **16 / 0** |
| `npm run check:admin-validation-consume`（loader regression） | 12 / 0 | ✅ **12 / 0** |
| EJS template compile（`ejs.compile`，不寫檔） | OK | ✅ **OK** |

real-data 驗證（throwaway script，已刪，repo 未留痕）：12 篇 production post 全部攜帶 `pageMetadata`；
**0 warning 跨全部 production post**；`portable-blog-system-mvp`：listing.effective = **true（仍顯示於列表）**、
sitemap.effective = **false（legacy download safety 排除）**、robots = `noindex, follow`、warnings = 0
→ 符合 SP-7 §F.5 指定顯示契約。

## H. Read-only / write-path confirmation

- 新 EJS section **無** `<input>` / `<select>` / `<textarea>` / `<button>` / `onclick` / `onchange` /
  `fetch(` / `<form>` / `addEventListener` / `writeText` / `execCommand` / Apply（git diff grep 證實；
  唯一命中為宣告「無 write path」之註解行）。
- loader 只新增 pure derive + return 欄位；**未碰** `admin-write-cli` / `admin-frontmatter-patcher` /
  `admin-field-validators` / middleware / safe-write。
- Admin write path 維持 **dormant**；Apply 維持 **disabled**。
- 未接入 SEO dry-run editor / static payload preview / copy buttons（保持純 read-only 隔離）。

## I. Output-preservation confirmation

- helper / loader / EJS 變動皆 **additive read-only**；既有 view 欄位逐字未動。
- **未動** Blogger output 邏輯（`build-blogger.js` / blogger EJS）。
- **未動** GitHub post / listing / sitemap 行為（`build-github.js` / `build-sitemap.js` /
  `include-in-listings.js` / `include-in-sitemap.js` / `page-type-robots.js`）。
- **未改** validator severity / count（`validate-content.js` 未動；baseline 0/104/94 不漂移）。
- **未產生 / 未 stage** 任何 `dist/` / `dist-blogger/` / `dist-promotion/` / `.cache/` / gh-pages /
  生成 HTML（EJS 僅 compile 檢查，未 render 寫檔；未執行 build / deploy / preview / dev server）。

## J. Smoke / data confirmation

- 新 smoke `check-page-metadata-summary.js` 22 case 涵蓋：缺省 default、mvp download 契約、explicit
  seo.indexing precedence、pageType robots 推導、includeIn* override、10 條 SP-2 warning 精準觸發、
  gatedDownload safe 投影 + secret value 不洩、platformPolicy safe 摘要。
- loader regression（admin governance aggregation 16/0 + validation consume 12/0）確認 `toAdminView()`
  additive 投影未破壞既有 admin 資料路徑。

## K. What was NOT done（本 phase 邊界）

- ❌ 未 refactor `validate-content.js`（warning 改以最小重複 mirror；temporary duplication 已記載 §F）。
- ❌ 未啟用 Admin write path / Apply / browser write / SEO dry-run / payload preview 接入。
- ❌ 未改 content posts / settings / Blogger output / GitHub post-list-sitemap 行為。
- ❌ 未新增 Google Form 頁為 content file（content migration 須另開 phase）。
- ❌ 未啟動 SP-8（platformPolicy 子欄位 shape validator）/ SP-9（feed builder）。
- ❌ 未執行 build / deploy / preview / repost / dev server；未碰 GA4 / AdSense / Search Console / Blogger / Drive 後台。
- ❌ 未改 `package.json` / lockfile / `dist*` / `gh-pages` / `.cache` / `CLAUDE.md` / `MEMORY.md`。

## L. Final git state

- 新增 3 檔（`page-metadata-summary.js` / `check-page-metadata-summary.js` / 本 ledger）+ 修改 2 檔
  （`load-admin-posts.js` / `index.ejs`，皆 additive）。
- commit subject：`feat(admin): show read-only page metadata summary`。
- push 須 user explicit approval（per CLAUDE.md §3a 紀律）。

## M. Next recommended phase

- **SP-7a browser-PASS**（user 本機 `npm run dev` → `localhost:5173/admin/#posts`）：展開某 post detail →
  「Page metadata / 頁面中繼設定」collapse 可開、badge 正確、`portable-blog-system-mvp` 顯示「列表: 顯示 /
  sitemap: 排除」、無 input / Apply、無 secret 外洩。屬 read-only 驗收，須 user 操作。
- **SP-8**（platformPolicy 子欄位 shape validator）/ **SP-9**（feed builder）/ validator export refactor（消除
  §F temporary duplication）/ Google Form 頁 content migration —— 各須另開 phase + explicit approval。

## N. Exit / idle freeze recommendation

- SP-7a 為純 additive read-only Admin 顯示，落地後建議 **idle freeze**。
- 不主動推進 SP-8 / SP-9 / write path / content migration；不主動 build / deploy / repost / dev server /
  動 Google 後台 / 改 `CLAUDE.md` / `MEMORY.md`。

---

## Cross-links
- `docs/20260623-pm-sp7-admin-metadata-visibility-preanalysis.md`（SP-7 規格）
- `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1）
- `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2 validator rules）
- `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3 robots helper）
- `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a listing helper）
- `docs/20260623-pm-sp5a-include-in-sitemap-selector-wiring.md`（SP-5a sitemap helper）
- `CLAUDE.md` §11 / §15–§17 / §21 / §23 / §27 / §29

（本文件結束）
