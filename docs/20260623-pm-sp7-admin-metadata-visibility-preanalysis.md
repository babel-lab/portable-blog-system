# SP-7 — Admin read-only visibility of special page-type / indexing metadata（docs-only preanalysis）

> Phase：`20260623-pm-sp7-admin-metadata-visibility-preanalysis-docs-only-a`（2026-06-23）
> Baseline：`main @ d0c854f`（HEAD == origin/main，ahead/behind 0/0，working tree clean）
> 前身：
> - `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1，平台無關架構 preanalysis）
> - `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2，schema lock + warning-only validator + fixtures）
> - `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3，GitHub post-detail robots precedence）
> - `docs/20260623-sp4-include-in-listings-inventory-preflight.md`（SP-4，inventory + binding decision §H.3）
> - `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a，listing selector + GitHub wiring）
> - `docs/20260623-pm-sp5a-include-in-sitemap-selector-wiring.md`（SP-5a，sitemap selector + wiring）
> - `docs/20260623-sp6-blogger-page-type-guidance-copy.md`（SP-6，Blogger operator guidance copy）

本文件落地 SP 系列之 **Admin read-only 視覺化前置分析**：規劃「未來 Admin UI 應如何 **read-only** 顯示特殊頁面 metadata」，在任何實作之前先定案資料流、版面與 badge / warning 對映。

> 🟢 **本文件為 docs-only preanalysis。SP-7 未改變任何 source / Admin / 輸出行為。**
> - **不**改 source / EJS template / build script / validator / Admin loader / content posts / settings / package / lockfile。
> - **不**改 Admin generated HTML / `.cache/pages/admin/index.html`（彼為 build 生成物）。
> - **不**實作 SP-7 UI、SP-8、write path，或任何 behavior change。
> - **不**動 dist / dist-blogger / gh-pages / `.cache`。
> - **不** repost Blogger；**不**存取或宣稱存取 GA4 / AdSense / Search Console / Blogger / Drive 後台。
> - Admin write path 維持 **dormant**；Apply 維持 **disabled**，除非另行授權。
> - 任何 metadata **不得**被 Admin 靜默變更；本 phase 不做 content migration。

### 命名對齊註記（重要）

SP-1 §6.4 之 roadmap 將「`platformPolicy` 平台 override」標為 **SP-7**、「Admin 欄位暴露 + 防呆」標為 **SP-8**。本 phase 採 **Dean 於本 session 之新命名**：本 docs-only preanalysis = **SP-7（Admin metadata visibility preanalysis）**，未來實作 = **SP-7a（Admin detail read-only section）**。兩種編號指向**同一塊 Admin 視覺化工作**；`platformPolicy` 之 schema 子欄位 validator（SP-1 §6.4 之 SP-7）仍為**獨立**未啟動 phase。本文件只規劃 Admin **read-only 顯示**，不含 `platformPolicy` 子欄位 shape validator、不含 write path。

對應上層：
- `CLAUDE.md` §11 文章類型 / §15–§17 分類·標籤·版型 / §21 SEO / §23 發布狀態 / §24 Blogger URL 回填 / §27 修改規則 / §29 第一版不做清單
- `docs/seo-indexing-rules.md`（indexing policy 總則）

---

## A. Phase name

`20260623-pm-sp7-admin-metadata-visibility-preanalysis-docs-only-a`

---

## B. Baseline observed

| 項目 | 值 |
|---|---|
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `d0c854f` |
| origin/main | `d0c854f` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `docs(blogger): add page type guidance checklist` |

baseline 與本 phase 預期完全一致（HEAD == origin/main，ahead/behind 0/0，clean）。

`check-validation-report.js` baseline（read-only 確認）：line 37 已為 `BASELINE = { errorCount: 0, warningCount: 104, issuePostCount: 94 }`（pin 與目前 validate 量測一致）；本 phase **未修改**。

---

## C. Files changed

- **新增 1 個 docs 檔**：`docs/20260623-pm-sp7-admin-metadata-visibility-preanalysis.md`（本檔）。
- 無任何 source / Admin / content / settings / package / lockfile / dist / gh-pages / `.cache` / 生成 HTML 變動。

---

## D. Current Admin findings（read-only 來源盤點）

### D.1 哪些檔案 render Admin overview / detail

| 角色 | 檔案 | 說明 |
|---|---|---|
| **資料 loader** | `src/scripts/load-admin-posts.js`（1185 行） | dev-mode-only read-only loader。glob `content/{github,blogger}/posts/*.md`（排除 `.fb.md`）→ 每篇 `loadOnePost()` 以 `gray-matter` 解析 → `toAdminView()` 把 raw frontmatter `fm` **投影成固定欄位之 view 物件**。同時 build `systemSummary` / `buildCategoryUsage` / `buildTagUsage` / governance signals / validation report join。 |
| **render context 注入** | `src/scripts/build-github.js`（admin render 分支） | 把 loader 輸出（`posts` = `toAdminView()` 陣列、`builtAt`、`systemSummary`、`commerceLinksPreview` 等）傳給 EJS。dev-mode-only；prod build **跳過** admin（不進 dist、不 deploy、`noindex,nofollow`）。 |
| **view template** | `src/views/admin/index.ejs`（2950 行） | 單檔內含 inline `<style>` + overview（Dashboard hero / 5 surface cards / Commerce preview）+ Posts table + per-post collapsible detail panel + 全部 client JS（search / filter / sort / detail toggle / dry-run compute / clipboard copy）。 |
| **生成輸出** | `.cache/pages/admin/index.html` | build 生成物（gitignored）；非 source。 |
| **write infra（dormant）** | `admin-write-cli.js` / `admin-frontmatter-patcher.js` / `admin-field-validators.js` / `admin-write-whitelist.js` | CLI-only（`npm run admin:write`），對 content **dormant**；Admin UI 內**無** browser write path；Apply 按鈕永久 disabled。 |

關鍵架構事實：**EJS 收到的 `posts` 是 `toAdminView()` 投影後的 view 物件，不是 raw frontmatter**。因此任何新欄位要在 detail panel 顯示，**必須先在 `toAdminView()` 把它從 `fm` 投影出來**（見 §G）。

### D.2 目前 post metadata 如何顯示

per-post detail panel（`index.ejs` 第 844 行起，`tr.post-detail`）目前的 `.detail-section` 區段順序：

1. **Missing metadata 警示 banner**（第 859 行；重用 `p.completeness.*`；無 missing 時不渲染）。
2. **Identity**（第 867 行）：id / title / titleEn / slug / `contentKind` / `primaryPlatform` / sourceSite / status(+draft) / category / tags。
3. **Platform Routing**（第 887 行）：primaryPlatform / publishTargets / canonicalTarget / platformUrl / gaHostname / bloggerStatus / githubStatus。
4. **Readiness**（第 930 行）：5 sub-block — Content / Navigation / **GA4（含 SEO indexing）** / AdSense / Validation。
5. 之後：URLs / FB sidecar / FB dry-run / Related-Other links selector / Completeness summary（含 Missing fields 併入）/ SEO dry-run editor / static payload preview / copy buttons。

顯示慣例（供新 section 對齊）：`<dl class="detail-grid">`（12rem label 欄 + 值欄）；值用 `<span class="badge b-ok|b-missing|b-info|b-draft|b-warn">`；每區附 `<p class="text-muted">source: …；note: …</p>` 明示推導來源與限制。

### D.3 SEO / indexing / warnings 目前如何顯示

| 維度 | 目前顯示處 | 來源 |
|---|---|---|
| `seo.indexing` → indexable | Readiness → GA4 sub-block（`index 可被搜尋引擎收錄` / `noindex` badge + `(seo.indexing = …)` mono）第 1015–1024 行 | loader `deriveSeoIndexingStatus(fm)`（第 554 行）回 `{ value, indexable, source }`；attach 為 `p.ga4Readiness.surfaceIndexable` / `seoIndexingValue` / `seoIndexingSource` |
| robots meta 推導 | **未在 Admin 顯示**（Admin 不重算 build-github robots precedence；只摘要 indexable 布林） | — |
| sitemap inclusion | **未在 Admin 顯示**（無 per-post sitemap 欄位） | — |
| listing inclusion | **未在 Admin 顯示**（無 per-post listing 欄位） | — |
| validator warnings | Posts table validation badge（第 705–712 行；`p.validationReport.state` issues/clean/excluded/no-report）+ detail Readiness → Validation sub-block（第 1079 行；read-only consume `npm run report:validation` cache；asOf banner）。**為 validator/report ground truth（僅掃 ready/published）。** | loader join `.cache/data/validation-report.json`（pm-14 §D；repo-relative posix key） |
| governance signals | Posts table `gov` badge（taxonomy 治理 read-only 提示；含 draft；**不等於** validator warning count） | loader `derivePostGovernanceSignals()` |

關鍵：`deriveSeoIndexingStatus()` 已存在且可直接重用為新 section 之「indexing」列；它**刻意不重算** build-github robots precedence，只摘要 source-of-truth（與本 phase「mirror、不另造 business logic」原則一致）。

### D.4 payload preview / dry-run 目前如何顯示

- **SEO dry-run editor**（第 1474 行起，`details.dry-run-section`）：讀 `p.seoValidation`（4 個 `{ ok, error? }`，server-side 預算），textarea 編輯 → client `dry-run-compute` 算 diff → 顯示 changed count + per-field old/new；**Apply 按鈕 `.apply-disabled` 永久 disabled**（第 78 行 CSS：cursor not-allowed、hover 不變色、不引導點擊）。
- **Static payload preview**（第 89 行 CSS / nested `<details>`）：純前端字串組裝 admin:write CLI command + JSON payload；textarea `readonly`；`dryRun:true`；無 fetch / fs / XHR / form submit。
- **K7 copy buttons**（第 102 行 CSS）：clipboard-only（`writeText` + `execCommand('copy')` fallback）；複製不構成核准；無 write path。

→ 既有 dry-run / preview 全為 **preview-only + Apply-disabled** 範式；新 metadata section 應**純顯示**（`<dl>` read-only），**不**接入 dry-run editor / payload preview（避免引導「可改」誤解；§E.4 / §F UX 規則）。

### D.5 特殊頁 metadata 可落點（最小 UI 擾動）

- **最小擾動落點**：在 detail panel **Readiness section 之後、URLs section 之前**新增 1 個獨立 `.detail-section`「Page metadata / 頁面中繼設定」。理由：indexing / listing / sitemap 與 Readiness → GA4 之 SEO indexing 概念相鄰，但語意上屬「頁面索引/列表政策」獨立維度，獨立 section 比塞進 Readiness 更清楚，且可整段 collapse（§F）。
- **替代落點（不建議）**：併進 Identity（會稀釋 Identity 的「這是什麼文章」語意）或 Platform Routing（platformPolicy 雖屬平台維度，但 pageType/listing/sitemap 非 routing）。
- detail panel 已偏長（~10+ section）→ 新 section 應預設 **collapse**（`<details>`，預設 closed）以免再加高度（§F）。

### D.6 detail panel / 資料物件是否已收到新欄位

**否。** `toAdminView()`（第 591–901 行）目前**未**從 `fm` 投影 `pageType` / `includeInListings` / `includeInSitemap` / `includeInFeeds` / `platformPolicy` / `gatedDownload`。已投影的相鄰欄位只有 `contentKind`、`primaryPlatform`、以及經 `deriveSeoIndexingStatus()` 的 `seo.indexing`。

→ 結論：**Admin loader 在 `loadOnePost()` 已持有 raw `fm`，但 view 物件尚未攜帶新欄位**；SP-7a 第一步必為「在 `toAdminView()` additive 投影新欄位 + 一個 derived summary」（§G）。目前 production 12 篇**無任一**使用新欄位（SP-4 inventory §D.3；本 phase grep 再確認 0 命中），故新 section 對現有文章只會顯示「default / current behavior」。

---

## E. Proposed read-only metadata display（「Page metadata / 頁面中繼設定」section）

> 形式：detail panel 內 1 個 collapsible `.detail-section`，內含 1 個 `<dl class="detail-grid">`，每列 read-only 顯示一個維度的 **raw 值 + effective（推導後）值**。純顯示；**無**任何 input / select / Apply / textarea。

### E.1 欄位、label 與值來源

| 欄位 | 中文 label | English label | 值來源（read-only） | 缺省顯示 |
|---|---|---|---|---|
| `pageType` | 頁面類型 | Page type | `fm.pageType`（string；SP-2 封閉列舉） | `article (default)` — 標明「缺省視為一般文章」 |
| `seo.indexing` | 搜尋引擎索引 | Search indexing | `deriveSeoIndexingStatus(fm)` → value + indexable + source（**重用既有**） | `default → indexable`（per seo-indexing-rules §3） |
| `includeInListings` | 顯示於列表 | Include in listings | raw `fm.includeInListings` + effective `resolveIncludeInListings(post)`（**重用 SP-4a helper**） | `auto → 顯示於列表`（effective true） |
| `includeInSitemap` | 加入 sitemap | Include in sitemap | raw `fm.includeInSitemap` + effective `resolveIncludeInSitemap(post)`（**重用 SP-5a helper**；safety 永遠優先） | `auto → 依 safety 推導` |
| `includeInFeeds` | 加入 feeds | Include in feeds | raw `fm.includeInFeeds`（**目前無消費端**） | `auto · feed 未啟用` |
| `gatedDownload` | 受控下載 | Gated download | raw `fm.gatedDownload` 之 **safe 欄位**（`mechanism` / `postSubmitResource`）；**永不**顯示 secret / token / 私有直連 / 表單回覆 | `—`（無 gated 區塊時整列 muted） |
| `platformPolicy` | 平台覆寫 | Platform policy | raw `fm.platformPolicy` 之 per-platform `indexing` / `includeInListings`（read-only 摘要） | `—`（無 override 時顯示「全平台沿用頂層值」） |

補充顯示列（derived，協助一眼判讀）：

- **robots meta（effective）**：`resolvePostDetailRobots(post)`（**重用 SP-3 helper**）→ 顯示推導後 robots 字串（`index, follow` / `noindex, follow` / `noindex, nofollow`）。標 source：explicit `seo.indexing` / legacy `contentKind:download` / `pageType` 推導 / default。
- **effective summary 一行**：`索引: <indexable> · 列表: <listing> · sitemap: <sitemap>`，讓 collapse 標題列即可預覽（§F）。

### E.2 raw vs effective 並陳原則

每個有「推導」的維度同時顯示：
1. **raw**（作者實填值；缺省標 `auto` / `(empty)`），與
2. **effective**（helper 推導後實際生效值）。

這呼應既有 copy-helper [14] / SEO dry-run 之「顯示解析後值」慣例，讓作者看出 override 結果，且**不**讓 Admin 自行下新判斷（effective 全由既有 SP-3/4a/5a helper 算）。

### E.3 ASCII 版面草稿（供實作參考；非最終 markup）

```
▸ Page metadata / 頁面中繼設定          [索引: 可收錄 · 列表: 顯示 · sitemap: 排除]
  ─────────────────────────────────────────────────────────────────
  頁面類型 / Page type        article (default)
  搜尋引擎索引 / Indexing      [可收錄] (seo.indexing = —, source: default)
  robots meta (effective)     index, follow   (source: default)
  顯示於列表 / Listings        [顯示] raw: auto → effective: true
  加入 sitemap / Sitemap       [排除] raw: auto → effective: false
                              (legacy contentKind:download safety；與 listing 正交)
  加入 feeds / Feeds           auto · feed 未啟用 (no consumer)
  受控下載 / Gated download    —
  平台覆寫 / Platform policy    — (全平台沿用頂層值)
  ─────────────────────────────────────────────────────────────────
  source: frontmatter + page-type-robots / include-in-listings / include-in-sitemap helpers
  note: read-only 推導快照；Admin 不修改 frontmatter；validator 為 ground truth
```

（以 `portable-blog-system-mvp` 為例：listing「顯示」、sitemap「排除」，正是 §F 要求清楚呈現的 legacy download 狀態。）

### E.4 純顯示約束

- 全部 `<dl>` + `<span class="badge">`；**無** `<input>` / `<select>` / `<textarea>` / Apply / Save / Edit。
- **不**接入 SEO dry-run editor / static payload preview / copy buttons（那些屬未來 write-path 規劃；本 section 維持 pure read-only）。
- 每維度附 source / note，明示「推導快照、非 live、Admin 不改 frontmatter」。

---

## F. Warning / badge plan（mirror validator；不另造 business logic）

> 🔴 核心原則：badge / warning **mirror SP-2 validator 既有規則**，**不**在 Admin 端新增獨立 business logic。若需任何 validator 未涵蓋之顯示判斷，必須在本 doc 明文記載為「Admin-only display hint」並標 read-only（對齊既有 governance signal 與 completeness 之「derived hint ≠ ground truth」分層）。

### F.1 read-only badges（狀態標示）

| badge | 觸發（effective 值） | 色票（既有 token） |
|---|---|---|
| `noindex` | robots effective ∈ {noindex-follow, noindex-nofollow} 或 `indexable === false` | `b-info`（中性；非錯誤） |
| `hidden from listings` | `resolveIncludeInListings(post) === false` | `b-info` |
| `excluded from sitemap` | `resolveIncludeInSitemap(post) === false` | `b-info` |
| `gated download` | `pageType === 'gated_download'` 或 `gatedDownload` 物件存在 | `b-info` |
| `utility hidden` | `pageType === 'utility_hidden'` | `b-info` |
| `platform special` | `pageType === 'platform_special'` 或 `platformPolicy` 存在 | `b-info` |
| `dangerous combination` | **見 §F.2**（mirror validator） | `b-warn`（黃；非紅，不暗示 build block） |

狀態 badge 一律用 `b-info`（中性）：noindex / hidden / excluded 多為**刻意**設定，不應渲染成紅色 error（per §F.3 missing → 顯示 default 而非告警）。

### F.2 dangerous combination warnings（**逐條 mirror SP-2 validator §2**）

| Admin warn badge | 對映 SP-2 validator rule | 條件 |
|---|---|---|
| `gated+index 🔴` | `page-gated-download-indexed` | `pageType === 'gated_download'` 且 `seo.indexing === 'index'` |
| `gated+listings` | `page-gated-download-in-listings` | `pageType === 'gated_download'` 且 `includeInListings === true` |
| `noindex+sitemap` | `page-noindex-in-sitemap` | `seo.indexing` ∈ noindex-* 且 `includeInSitemap === true` |
| `noindex+listings` | `page-noindex-in-listings` | `seo.indexing` ∈ noindex-* 且 `includeInListings === true` |
| `redirect 缺 canonical` | `page-redirect-canonical-missing-target` | `pageType === 'redirect_canonical'` 且 canonical 缺/空/`auto` |
| `pageType 非法` | `page-type-invalid` | `pageType` present 但非合法列舉 |
| `gated 含敏感 key` | `page-gated-download-suspicious-field` | `gatedDownload` 含 disallowed key 名稱（**只比對 key 名稱、不 echo value**） |

實作建議：**不要**在 EJS 端重算這些條件（會 drift）。應在 loader 端把 SP-2 validator 之 `validatePageTypeMetadata` 抽成可被 admin loader 呼叫的 **pure helper**（回 issue 陣列），admin 直接 render 同一份 issue list（§G.4）。在抽出之前，Admin warn badge 應標「mirror validator；ground truth 為 `npm run validate:content`」。

### F.3 缺省 / missing 顯示語氣

- 缺 `pageType` → 顯示 `article (default)`，**非** error；不進 Missing metadata banner（per Dean：missing 應顯示「default/current behavior」而非告警）。
- 缺 `includeIn*` → `auto`（走推導），不告警。
- 與既有 detail panel Missing metadata banner（§D.2 第 1）**不重疊**：新欄位皆 optional，缺省不視為 missing。

### F.4 collapse / 版面長度規則（Admin UX）

- 新 section 用 `<details>`，**預設 closed**；`<summary>` 顯示 §E.1 之 effective 一行摘要（`索引 · 列表 · sitemap`）+ 任何 `b-warn` badge（危險組合即使收合也可見）。
- dangerous combination 在收合摘要列**可見但不可編輯**（本 phase 無 write path）。
- 不增加 detail panel 預設高度（closed 時僅 1 行 summary）。

### F.5 兩個指定案例之顯示契約

| 案例 | 應顯示 |
|---|---|
| `portable-blog-system-mvp`（github, ready, `contentKind:download`） | **stays in listings**（listing effective `true`，badge 無 hidden）+ **excluded from sitemap by legacy download safety**（sitemap effective `false`，badge `excluded from sitemap`，note 標「legacy contentKind:download safety；與 listing 正交」）。即 listing 與 sitemap 並陳、明顯不同步。 |
| Google Form 下載頁（**目前未建模於 repo**） | 一旦未來以 content + metadata 建模：顯示 `noindex` / `hidden from listings` / `excluded from sitemap` / `gated download` badges；**但不暴露** secret / 私有 URL / 表單回覆 / Drive folder ID（gated 只顯示 `mechanism` / `postSubmitResource` safe 欄位）。在建模前，Admin 無此頁可顯示（不偽造）。 |

---

## G. Implementation plan（保守 SP-7a；不在本 phase 執行）

> 全部 **additive read-only**；不啟用 write path；不做 content migration；不改既有輸出 / behavior。

### G.1 哪個資料物件需攜帶 metadata

`toAdminView()`（`load-admin-posts.js`）之 return 物件。新增 additive 欄位（既有 view 欄位不動）：

```
pageMetadata: {
  pageType,                       // fm.pageType（raw；string|''）
  seoIndexing,                    // 重用 deriveSeoIndexingStatus(fm)
  includeInListings: { raw, effective },   // raw=fm.includeInListings；effective=resolveIncludeInListings(post)
  includeInSitemap:  { raw, effective },   // effective=resolveIncludeInSitemap(post)
  includeInFeeds:    { raw },              // 無 effective（無消費端）
  robotsEffective: { value, source },      // resolvePostDetailRobots(post) + 推導來源
  gatedDownload:   { mechanism, postSubmitResource },  // 只投影 safe 欄位
  platformPolicy:  { /* per-platform indexing / includeInListings 摘要 */ },
  warnings: [ /* mirror SP-2 validatePageTypeMetadata issue 陣列 */ ],
}
```

既有 view 忽略此欄位 → backout cost = 0（mirror governance signals 之 additive 慣例）。

### G.2 Admin 是否已收到 raw frontmatter

`loadOnePost()` 已持有完整 raw `fm`（§D.6）。**只需在 `toAdminView()` 投影**，**無需**改 loader 的讀取路徑或 glob。EJS 端則消費 `p.pageMetadata`（不直接碰 raw fm）。

### G.3 可重用的 helper（避免重複實作）

| 維度 | 重用 | 註 |
|---|---|---|
| robots meta | `src/scripts/page-type-robots.js` → `resolvePostDetailRobots(post)` / `derivePageTypeRobots()` | 純函式、零依賴；已被 build-github 消費；admin 第二 consumer |
| listing | `src/scripts/include-in-listings.js` → `resolveIncludeInListings(post)` | 同上 |
| sitemap | `src/scripts/include-in-sitemap.js` → `resolveIncludeInSitemap(post)` / `isSitemapEligible(post)` | 同上；safety 永遠優先 |
| indexing | `load-admin-posts.js` 既有 `deriveSeoIndexingStatus(fm)` | 已在用（GA4 readiness）；直接共用 |

⚠️ 三個 helper 入參為 **post-shape**（讀 `post.seo.indexing` / `post.contentKind` / `post.pageType` / `post.includeIn*`）。admin loader 的 `fm` 即 frontmatter 物件，欄位名一致，可直接以 `fm`（或一個 `{ seo, contentKind, pageType, includeInListings, includeInSitemap }` 薄物件）餵入。**不**改三個 helper 本體。

### G.4 是否需要一個 pure metadata summary helper（建議：是）

建議新增 `src/scripts/page-metadata-summary.js`：`derivePageMetadataView(fm)` → 回 §G.1 的 `pageMetadata` 物件（內部委派上述 4 個既有 helper + 把 SP-2 `validatePageTypeMetadata` 抽出之 pure issue function）。好處：
- loader 與未來任何 consumer 共用同一推導，避免 EJS 端散落邏輯 / drift。
- warning 與 validator **同源**（§F.2）：把 `validate-content.js` 內 `validatePageTypeMetadata` 重構為 export 的 pure helper（不改其行為 / 不改 validate baseline），admin 直接呼叫同一份 → badge 永遠 mirror validator。
- 純函式、零依賴、node:assert smoke 可獨立測（mirror `check-page-type-robots.js` 範式；不改 package.json）。

> 註：把 `validatePageTypeMetadata` 抽成 export 屬「touch validator 檔」，須在 SP-7a 以 **byte-identical refactor**（行為逐字不變 + validate baseline 0/104/94 不漂移）落地，並加 smoke 證明。若該 refactor 風險評估偏高，退路為「admin loader 內以**註解標明對映 SP-2 rule** 的方式複算 §F.2 條件」（會有 drift 風險，須在 doc 標記）——**建議優先抽 helper**（per [[feedback_conservative_landing]] 之 helper-first / 單一 source 偏好）。

### G.5 如何維持 write path dormant

- 新 section **無任何** input / Apply / form / fetch / clipboard write；純 `<dl>` 顯示。
- 不碰 `admin-write-cli` / `admin-frontmatter-patcher` / `admin-field-validators` / safe-write / middleware。
- 不接入 SEO dry-run editor / static payload preview（那些是未來 write-path 的前置；本 section 與其隔離）。
- Apply 全域維持 disabled；本 section 不新增任何「可寫」入口。

### G.6 預期 diff 範圍（SP-7a，供未來估算）

| 檔案 | 變更性質 |
|---|---|
| `src/scripts/page-metadata-summary.js` | **新增** pure helper |
| `src/scripts/check-page-metadata-summary.js` | **新增** node:assert smoke（不改 package.json） |
| `src/scripts/validate-content.js` | refactor `validatePageTypeMetadata` 為 export pure helper（byte-identical；baseline 不漂移）—— **僅在 §G.4 抽 helper 路線採用時** |
| `src/scripts/load-admin-posts.js` | `toAdminView()` additive 投影 `pageMetadata` |
| `src/views/admin/index.ejs` | 新增 1 個 collapsible `.detail-section`（純顯示）+ 少量 CSS（沿用既有 badge token，盡量零新 class） |

→ source 變動集中、additive、可逐檔 review；無 content / settings / dist / gh-pages 變動。

---

## H. Validation results

> 本 phase 為 docs-only（僅新增本檔），下列量測 by construction 不變；仍依 spec 實跑驗證（phase 明確要求 regression check）。

| 量測 | 期望 | 實測 |
|---|---|---|
| `npm run validate:content` | 0 error / 104 warning / 94 post | ✅ **0 / 104 / 94** |
| `node src/scripts/check-page-type-validator.js`（SP-2） | 20 / 0 | ✅ **20 passed, 0 failed** |
| `node src/scripts/check-page-type-robots.js`（SP-3） | 29 / 0 | ✅ **29 passed, 0 failed** |
| `node src/scripts/check-include-in-listings.js`（SP-4a） | 16 / 0 | ✅ **16 passed, 0 failed** |
| `node src/scripts/check-include-in-sitemap.js`（SP-5a） | 19 / 0 | ✅ **19 passed, 0 failed** |

> git status 確認**僅本 1 個 docs 檔變動**（`?? docs/20260623-pm-sp7-admin-metadata-visibility-preanalysis.md`）。未執行 build（本 phase 不需要）。全部量測與 baseline 一致，無漂移。

---

## I. What was NOT done（本 phase 邊界）

| # | 項目 | 狀態 |
|---|---|---|
| 1 | 實作 SP-7a Admin UI（新 section / loader 投影 / helper） | ❌ 未做（僅 §E–§G 規劃） |
| 2 | 改 `src/**`（build / loader / validator / EJS / Admin / helper） | ❌ 未動 |
| 3 | 啟用 Admin write path / Apply / 任何 browser write | ❌ 未動（仍 dormant / disabled） |
| 4 | 改 `content/**` / `settings/**` / 新增任何 page content（含 Google Form 頁） | ❌ 未動 |
| 5 | content migration（把 Google Form 頁建模為 repo content） | ❌ 未做（須另開 phase） |
| 6 | 改 `package.json` / lockfile / `dist*` / `gh-pages` / `.cache` / 生成 HTML | ❌ 未動 |
| 7 | 執行 build / deploy / preview / dev server / repost | ❌ 未執行 |
| 8 | 存取 / 宣稱存取 GA4 / AdSense / Search Console / Blogger / Drive 後台 | ❌ 無 |
| 9 | 改 `CLAUDE.md` / `MEMORY.md` | ❌ 未動 |
| 10 | 啟動 SP-8（platformPolicy 子欄位 validator）/ SP-9（feed）/ 任何 behavior change | ❌ 未做 |

---

## J. Final git state

- 新增 1 檔：`docs/20260623-pm-sp7-admin-metadata-visibility-preanalysis.md`（本檔）。
- 其餘 working tree 維持 clean；無 source / content / settings / dist / gh-pages / `.cache` 變動。
- 建議 commit subject（per spec）：`docs(admin): analyze page metadata visibility`。
- push 須 user explicit approval（per CLAUDE.md §3a 紀律）。

---

## K. Next recommended phase

- **SP-7a（保守實作）**：依 §G 落地——
  1. 新增 pure `page-metadata-summary.js`（委派既有 robots / listing / sitemap / indexing helper + 抽出之 SP-2 issue helper）+ node:assert smoke。
  2. `toAdminView()` additive 投影 `pageMetadata`（無 production 命中 → 既有 view 不變）。
  3. `index.ejs` 新增 1 個 collapsible read-only `.detail-section`（純 `<dl>`；無 write path；Apply 維持 disabled）。
  4. 驗收：source-level smoke + `validate:content` 0/104/94 不漂移；若用 dev server 則 browser-PASS 檢查 collapse / badge / `portable-blog-system-mvp` 顯示「listing 顯示 / sitemap 排除」；read-only-only、無 content 變動。
  - 各步驟須 **user explicit approval**；不主動執行。
- **不在 SP-7a 範圍**（各須另開 phase）：platformPolicy 子欄位 shape validator（SP-1 §6.4 之 SP-7）、Google Form 頁 content migration、feed builder（SP-9）、任何 write path / Apply 啟用。

## L. Exit / idle freeze recommendation

- SP-7 為 docs-only preanalysis，無行為變動 → 完成後建議 **idle freeze**。
- 不主動推進 SP-7a 實作；待 user 接受本分析 + explicit approval 後另開 SP-7a phase。
- 不主動 build / deploy / repost / dev server / 動 Google 後台 / 改 CLAUDE.md / MEMORY.md。

---

## Cross-links
- `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1 §5 Admin implications / §6.4 roadmap）
- `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2 validator rules §2）
- `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3 robots helper）
- `docs/20260623-sp4-include-in-listings-inventory-preflight.md`（SP-4 inventory / MVP disposition §H.3）
- `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a listing selector）
- `docs/20260623-pm-sp5a-include-in-sitemap-selector-wiring.md`（SP-5a sitemap selector）
- `docs/20260623-sp6-blogger-page-type-guidance-copy.md`（SP-6 operator labels §4）
- `docs/seo-indexing-rules.md`（indexing policy 總則）
- `CLAUDE.md` §11 / §15–§17 / §21 / §23 / §27 / §29

（本文件結束）
