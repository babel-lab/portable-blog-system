# ADMIN — Per-Post Governance Aggregation Read-Only UI Preanalysis

- **Phase**：`20260616-admin-per-post-governance-aggregation-readonly-ui-preanalysis-docs-only-a`
- **日期**：2026-06-16（13:44 起；pm session）
- **性質**：docs-only preanalysis（**不**改 src / views / content / settings / package / tests；**不**做 UI source implementation；**不**做 Admin write/apply/fix；**不**做 validator-warning join；**不**做 filter chip；**不**做 Posts-index count badge source；**不**做 suggested-fix；**不** build/deploy；**不** npm install）。唯一 mutation = 本 preanalysis doc + CLAUDE.md 極小 ledger sync。
- **承接**：
  - `docs/20260616-admin-validator-per-post-aggregation-preanalysis.md`（pm-2）
  - `docs/20260616-admin-validator-per-post-aggregation-preanalysis-acceptance-record.md`（pm-3）
  - `docs/20260616-admin-validator-per-post-aggregation-implementation-acceptance-record.md`（pm-5；commit `08edc53` accepted）

---

## A. Baseline

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main
HEAD           : d9b37c8 == origin/main
working tree   : clean
ahead / behind : 0 / 0
latest commit  : d9b37c8 docs(admin): accept validator aggregation implementation
```

→ baseline 完全符合 phase 指示。未執行任何 merge / rebase / reset / amend / force push。

---

## B. Source state（read-only intake 結論）

### B.1 admin loader data-flow

- `loadAdminPosts({ settings })`（`src/scripts/load-admin-posts.js`）：glob `content/{github,blogger}/posts/*.md`（排除 `.fb.md`；含 draft / 全 status；排除 fixtures）→ 每篇 `toAdminView()` 組 admin view shape → `posts.sort()`（publishedAt desc，fallback id desc）→ 迴圈 attach `p.governanceSignals`（am-5 五欄）**與 `p.governanceAggregation`（pm-4 新增）** → 回傳 `{ posts, commerceLinksPreview, allowedCommerceRoles, systemSummary, categoryUsage, tagUsage }`。
- `build-github.js`（**dev-mode-only**）render `src/views/admin/index.ejs`（render context = `{ posts, builtAt }`）至 `.cache/pages/admin/index.html`，Vite dev serve 於 `/admin/`。**prod build 不產出 / 不進 dist / 不 deploy / noindex。**
- ⇒ **`governanceAggregation` 已存在於 render context**（為 `posts[].governanceAggregation`）；目前 EJS **尚未引用**任何 `governanceAggregation`（grep 確認 view 端 0 命中）。因此「顯示」純屬 additive EJS read，**不需改 loader**。

### B.2 既有 Admin UI 對 governance / validation / taxonomy 的呈現

| 位置 | 現況 | 來源欄位 |
|---|---|---|
| **Posts index readiness cell**（`index.ejs` L757–761） | per-post `gov: N`（`b-warn`）/ `gov ✓`（`b-ok`）badge | `p.governanceSignals.signalSum` |
| **Detail panel — Validation warnings (deferred)**（L996–1007） | `deferred` badge + `aggregateCommand` + reason | `p.validationReadiness`（仍 deferred） |
| **Detail panel — Governance signals**（L1016–1056） | `signalSum` 摘要 + 4 訊號 dl（unknown tag / unknown category / cross-site mismatch tag / category）+ source 註 + anti-write 一句話 + 治理 docs cross-link；empty-state 正向「✓ 皆已對齊」 | `p.governanceSignals`（raw 5 欄） |
| **Categories & Tags — Governance summary card**（am-4；L1504–1535） | 全站 **per-post rollup**（view 端 reduce over `posts[].governanceSignals`）：篇數 / 篇有訊號 / 訊號總數 / cross-site mismatch tag·category（post-level）+ same-source 註 + anti-write footer | view-side reduce `posts[].governanceSignals` |

### B.3 關鍵觀察

1. **detail panel 已逐欄顯示同一組 taxonomy 訊號**（raw 5 欄）。`governanceAggregation` 是同一組訊號的 **normalized / enumerable 重塑**（`signals[]` 固定順序 + `byClass` rollup + `totalSignalCount` + `hasSignals`）。⇒ 兩者**同源**（皆衍生自 `governanceSignals`），**不可**並列成兩個獨立問題以免重複統計困惑。
2. `governanceAggregation` 之**邊際價值** = (a) 提供一個 **machine-shaped、固定順序、可迭代**的 signal 列表（未來若新增 signal class/type 時，UI 迭代 `signals[]` 即可，不必再逐欄手寫 dl）；(b) `byClass` 之 class-level rollup（目前僅 `taxonomy` 一類）。在目前只有 4 條 taxonomy 概念、detail panel 已逐欄顯示的前提下，**立即顯示的增量價值「中等偏低」**，主要是結構化 / future-proof。
3. **posts index 已有 signalSum badge**；若再加 byClass / signal type 細目會提高資訊密度與 search/filter/sort JS 風險 → **不適合 L1**。
4. validator-warning（真正 per-post validator count）**仍 deferred**；`governanceAggregation` **不可**被標成 "validation warnings"（universe 不同：governance signals 含 draft；validator 只掃 ready/published）。任何 UI 文案須沿用既有 anti-confusion 措辭。

---

## C. `governanceAggregation` data contract（pm-4 已落地，read-only）

```
post.governanceAggregation = {
  hasSignals: boolean,              // totalSignalCount > 0
  totalSignalCount: number,        // 各 signal count 相加（與 governanceSignals.signalSum 交叉一致）
  byClass: { taxonomy: number },   // 只含 count>0 之 class（目前唯一 class = taxonomy）
  signals: [                       // 只含 count>0；固定 canonical 順序（GOVERNANCE_SIGNAL_ORDER）
    { type: 'unknown-tag',                  class: 'taxonomy', count },
    { type: 'unknown-category',             class: 'taxonomy', count },  // flag→count 1
    { type: 'cross-site-mismatch-tag',      class: 'taxonomy', count },
    { type: 'cross-site-mismatch-category', class: 'taxonomy', count },  // flag→count 1
  ],
}
```

- 純資料；無 prescription / 無 write hint；deterministic（固定順序、純值）。
- empty post → `{ hasSignals:false, totalSignalCount:0, byClass:{}, signals:[] }`。
- 資料來源 = 既有 `governanceSignals`，**非** validator output。

---

## D. UI 位置分析（回答 phase 問題 1 / 2）

### 問題 1：最適合先顯示在哪裡？

- **detail panel（推薦）**：單篇展開才看；已有「Governance signals」section 作為自然落點；風險最低；不碰 Posts index JS。
- posts index：已有 signalSum badge；再加細目→密度過高 + 動 cell / 可能牽動 filter/sort → **L1 不建議**。
- 獨立 diagnostic / governance section：site-level governance summary card 已存在（per-post rollup）；per-post 細目塞進該卡會混淆 per-post vs site-level → **不建議**。
- 暫不顯示：合理的保守 fallback（資料已 derived，未顯示亦無損）。

### 問題 2：顯示內容到什麼程度？

| 欄位 | L1 是否顯示 | 說明 |
|---|---|---|
| `hasSignals` | ✅（隱含；用於 empty-state 切換） | 沿用既有「✓ 皆已對齊」/「⚠️ N 個治理訊號」 |
| `totalSignalCount` | ✅ | 與既有 `signalSum` 顯示一致（同值）；標示同源避免重複統計 |
| `byClass` summary | ✅（精簡） | 目前僅 `taxonomy: N`；以一行 class rollup 呈現；future-proof |
| `signals[]` type list | ✅（精簡、唯讀列舉） | 固定順序列 `type × count`；**不**加「應改為 X」 |
| signal class / count | ✅ | 即 `signals[].class` / `.count`；純計數 |

**程度上限**：只列「class + type + count」之**唯讀列舉**；**不**做 per-post prescription、**不**做 suggested fix、**不**連 write、**不**加可點擊跳轉 / filter。文案須標示「與下方 raw 4 訊號同源、非 validator warning count」。

---

## E. Options analysis（A / B / C / D）

### Option A — Detail panel only，read-only governance aggregation summary（**推薦**）

- **scope**：在 detail panel 既有「Governance signals」section 內（或緊鄰）additive 一段 read-only summary：`byClass` 一行 + `signals[]` 固定順序列舉（type × count）+ same-source 註（與下方 raw 4 訊號同源、非 validator warning count）。**保留**既有 raw 4 訊號 dl（不移除、不重構）。
- **future implementation files**：`src/views/admin/index.ejs`（**單檔** additive EJS block，讀 `p.governanceAggregation`）。**不改 loader**（資料已在 context）。**零新 CSS**（沿用 `.detail-section` / `.detail-grid` / `.badge` / `.b-warn` / `.b-ok` / `.text-muted` / `.section-tag`）。
- **benefits**：最低風險；落點現成；不碰 Posts index / filter / sort JS；提供 normalized / future-proof 列舉與 class rollup；backout = 移除單一 EJS block。
- **risks**：與既有 raw 4 訊號**輕度重複顯示**（須以「同源」文案化解）；增量價值中等。
- **validation/check strategy**：`npm run validate:content` 0/94/84 不變；dev admin render（`build-github.js --mode=dev`）無 EJS error、aggregation 區塊渲染正確；grep 新區塊 0 個 `<form>`/`<button>`/`<input>`/`<select>`/`<textarea>`/`fetch(`/`onclick`/`onchange`；carry checks 不受影響（admin dev-only）。
- **explicit non-actions**：不改 loader / 不改 raw 訊號 section / 不動 Posts index / 不加 filter / 不加 prescription / 不連 write。
- **recommended**：✅ **是**（符合 phase 預設推薦）。

### Option B — Posts index minimal read-only indicator（不做 filter chip、不做 count badge implementation）

- **scope**：在 posts index readiness cell 既有 `gov:`/`gov ✓` badge 之上，**僅**以 title/tooltip 補 byClass 細目（不新增欄、不新增 count badge 元件、不連 filter）。
- **future implementation files**：`src/views/admin/index.ejs`（readiness cell 區塊）。
- **benefits**：清單頁即可瞥見 class 分布。
- **risks**：cell 密度上升；tooltip 仍屬「動到 Posts index render」，未來易與 filter/sort 演化衝突；與既有 signalSum badge 語意重疊。
- **validation/check strategy**：同 A + 確認 search/filter/sort JS 行為不變（L2279 既有保證）。
- **explicit non-actions**：**明文不做** filter chip / count badge 元件 / 跳轉。
- **recommended**：❌ 否（L1 不建議；列為「可選、低優先」，且仍須與 A 分開）。

### Option C — 獨立 governance / diagnostic section（per-post），但不碰 posts index

- **scope**：在 detail panel 新增一個獨立「Governance aggregation」section（與既有 raw 訊號 section 並列），完整呈現 contract（hasSignals / total / byClass / signals[]）。
- **future implementation files**：`src/views/admin/index.ejs`。
- **benefits**：結構完整、契約清楚。
- **risks**：與既有「Governance signals」section **明顯重複**（同源、同篇、相鄰）；徒增 detail panel 長度與重複統計困惑。
- **validation/check strategy**：同 A。
- **explicit non-actions**：不碰 posts index / 不連 write / 不 prescription。
- **recommended**：❌ 否（除非未來把 raw 訊號 section 重構為由 aggregation 驅動的 DRY 版本——那屬獨立重構 phase，非 L1）。

### Option D — Don't display yet（先等 validator-warning schema / join contract）

- **scope**：不接 UI；維持現況（detail panel raw 訊號 + site-level summary card）。`governanceAggregation` 保持「資料已 derived、UI dormant」。
- **future implementation files**：無。
- **benefits**：零風險；零重複；等 validator-warning join 路線釐清後再一次性設計 per-post「governance + validation」整合呈現，避免日後再改。
- **risks**：`governanceAggregation` 暫無 UI 消費者（但 backout cost 本來就是 0；non-issue）。
- **validation/check strategy**：N/A（docs-only）。
- **explicit non-actions**：不接 UI。
- **recommended**：保守 fallback（次選）。

---

## F. Recommended option

**推薦 Option A（detail panel only，read-only governance aggregation summary）。**

理由：(1) 符合 phase 預設推薦（detail panel governance summary）；(2) 資料已在 render context，僅需單檔 additive EJS、零新 CSS、零 loader 改動；(3) 落點現成（既有 Governance signals section）；(4) 提供 normalized / future-proof 列舉與 class rollup；(5) 風險最低、backout = 移除單一 block。**前提護欄**：保留既有 raw 4 訊號 dl、以「同源 / 非 validator warning count」文案化解重複統計困惑、只做唯讀列舉、無 prescription / write / filter / 跳轉。

**次選 Option D（暫不顯示）** 為可接受之保守替代（資料已 derived，dormant 無損）。**Option B / C 不建議於 L1**。

---

## G. Future implementation boundaries（回答 phase 問題 3 / 4）

### L1 allowed future implementation（單獨一個 NOT-docs-only phase，須 user approval）

- 只讀顯示 `governanceAggregation`（Option A：detail panel byClass + signals[] 列舉）。
- 不改資料（不改 loader / 不改既有欄位 / 不改 raw 訊號 section）。
- 不產生修法（無 per-post prescription / suggested fix）。
- 不連結 write path（無 form/button/input/select/textarea/fetch/onclick/onchange）。
- 不做 filter / 不做 badge 元件 / 不做跳轉。
- 不 join validator warnings（`validationReadiness` 維持 deferred）。

### Must be separate phase（各須獨立 phase + user explicit approval）

- Posts index count badge（升級既有 `gov:` badge 為 class-breakdown / 數值 badge 元件）。
- filter chip（governance 連動篩選 Posts index）。
- suggested fix / per-post prescription（「應改為 X」規則引擎）。
- validator-warning join（per-post validator count；相對⇄絕對 sourcePath join）。
- validation report schema（structured validator JSON output + join contract preanalysis；pm-3 已列為前置）。
- write / apply / fix action（Admin 寫回 frontmatter / settings）。
- cross-post loader aggregation migration（把 site-level reduce 從 view 搬進 loader）。

---

## H. Validation plan（for future Option A implementation phase）

1. `npm run validate:content` → 期望 **0/94/84 不變**（EJS 不在 validator scope；跑以確認 baseline）。
2. dev admin render：`node src/scripts/build-github.js --mode=dev` → `.cache/pages/admin/index.html` 無 EJS error；每篇 detail panel 之 aggregation 區塊渲染；數值與既有 raw 訊號一致（同源）。
3. 安全 grep：新區塊 0 個 write 元素 / handler（`<form>`/`<button>`/`<input>`/`<select>`/`<textarea>`/`fetch(`/`onclick`/`onchange`）；0 個 per-post prescription 字樣。
4. carry（不受影響，admin dev-only 不在 build:blogger 路徑）：`check:adsense-resolver` 34/0 · `check:adsense-article-block` 13/0 · `check:adsense-anchor-wiring` 14/0 · `check-commerce-affiliate-resolver` 23/0 · `check:blogger-adsense-output` 85/0 · `check:admin-governance-aggregation` 16/0。

---

## I. Risk / rollback plan

- **風險**：(1) 與 raw 訊號重複顯示 → 以「同源」文案化解；(2) 誤把 governance signal 當 validator warning → 沿用既有 anti-confusion 措辭 + 維持「Validation warnings (deferred)」分區；(3) detail panel 變長 → 精簡一行 byClass + 短列舉。
- **rollback**：Option A 為單一 additive EJS block → 移除該 block 即還原（零資料 / 零 loader 影響）；`governanceAggregation` 資料保留（其他未來消費者不受影響）。

---

## J. Explicit non-actions（本 docs-only phase）

- ❌ source implementation（未改 src / views / scripts / loader / validator）
- ❌ UI / EJS / views source change
- ❌ content / frontmatter / markdown mutation
- ❌ settings / tags.json / categories.json
- ❌ Admin write / apply / fix
- ❌ filter chip
- ❌ Posts-index count badge implementation
- ❌ suggested fix / per-post prescription
- ❌ validator-warning join / validation report schema
- ❌ Blogger repost
- ❌ GitHub Pages build / deploy
- ❌ ads / commerce unrelated change
- ❌ npm install / package change
- ❌ merge / rebase / reset / amend / force push / unrelated cleanup
- ❌ CLAUDE.md compression / reorder
- ✅ 唯一 mutation = 本 preanalysis doc + CLAUDE.md 極小 ledger sync

---

## K. Next recommended phase

- **`20260616-admin-per-post-governance-aggregation-readonly-ui-preanalysis-acceptance-readonly-a`**（read-only acceptance of 本 preanalysis；docs-only）。
- 之後若推進實作：`20260616-admin-per-post-governance-aggregation-readonly-ui-detail-panel-implementation-a`（Option A；**NOT docs-only**；單檔 `index.ejs` additive read-only block；須 user explicit approval）。
- 紅線：Posts-index count badge / filter chip / suggested-fix / per-post prescription / validator-warning join / validation report schema / write path / cross-post loader aggregation 一律獨立 phase + user explicit approval。

---

（本紀錄結束）
