# ADMIN — Validator Per-Post Aggregation Preanalysis

- **Phase**：`20260616-admin-validator-per-post-aggregation-preanalysis-docs-only-a`
- **日期**：2026-06-16（12:39 起；pm session）
- **性質**：docs-only preanalysis（**不**改 src / views / scripts / loader / validator / content / settings / tags.json / categories.json / 任何 frontmatter·markdown；**不**新增 Apply / Save / Auto-fix / Write / Mutate；**不** npm install / build / deploy / Blogger repost）
- **承接**：
  - `docs/20260616-admin-governance-summary-card-implementation-record.md`（am-4；governance summary card；view 端 reduce `posts[].governanceSignals`）
  - `docs/20260616-admin-governance-summary-card-human-acceptance-record.md`（pm-1；human accepted）
  - `docs/20260616-admin-suggested-fix-l2-readonly-ui-implementation-record.md`（loader am-5 `derivePostGovernanceSignals` 五欄位）
- **目標**：規劃 ADMIN 後台未來如何**安全地**把 `npm run validate:content` 的 warning / governance 類訊號彙總到每篇文章的 admin detail panel 或 summary badge（per-post validator warning aggregation）。**本階段只 preanalysis，不實作。**

---

## A. Baseline verify

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main
HEAD           : 26715841ac23797c1d96f83670a58f4e892c62b2 == origin/main
working tree   : clean
last subject   : docs(admin): record governance summary card human acceptance
ahead / behind : 0 / 0
```

→ baseline 完全符合 phase 指示。未執行任何 merge / rebase / reset / amend / force push。

---

## B. 已驗收之 ADMIN governance 線（背景）

1. governance signal **loader derive**（am-5；`src/scripts/load-admin-posts.js` `derivePostGovernanceSignals` 五欄位）。
2. per-post **governance badge**（Posts index readiness cell；L2）。
3. per-post **Governance signals detail section**（detail panel；L2）。
4. **Governance summary card**（Categories & Tags section；am-4）。
5. 以上皆 **read-only 且 human accepted**。

本 phase 評估「validator warnings」與「admin governanceSignals」之關係，並規劃未來 per-post validator 彙總路線。

---

## 1. 現況盤點（read-only，源自 source）

### 1.1 `npm run validate:content` 產生哪些 warning 類型

validator（`src/scripts/validate-content.js`，2577 行）以 `issues[]` 累積，每筆 issue 形狀：

```
{ severity: 'error' | 'warning', type: '<rule-id>', sourcePath: '<相對路徑>', value?, site? }
```

`printIssues()`（L2382）依 `sourcePath` 分組印 stderr，並輸出「N error(s) / M warning(s) on K post(s)」——其中 **K = 有 issue 之不同 sourcePath 數**（含 settings 檔與 fixture posts，**非**僅 production 文章）。

完整 rule-type taxonomy（~110 條，依 source grep `type: '...'`）依「責任 surface」分為三層：

| 層 | sourcePath | rule-type 範例（前綴） |
|---|---|---|
| **post-level**（文章 .md） | `content/{site}/posts/<slug>.md` | frontmatter shape（`missing-title` / `missing-slug` / `missing-date` / `invalid-date-format` / `missing-description` / `missing-category` / `missing-cover` / `empty-tags` / `body-leading-h1` / `long-title` / `long-description` / `long-search-description` / `invalid-status` / `invalid-site` / `invalid-content-kind` / `contentkind-and-type-conflict` / `invalid-seo-block` / `invalid-seo-indexing` / `invalid-primary-platform` / `invalid-canonical` / `invalid-publish-target-mode`）、taxonomy（`unknown-category` / `category-site-mismatch` / `unknown-tag` / `tag-site-mismatch`）、related-links（`related-links-*` ×7）、commerce-ref（`commerce-ref-*` ×8）、affiliate-blocks（`affiliate-block(s)-*` ×10）、adsense-blocks（`adsense-block(s)-*` ×15）、download（`download-fileurl-*` / `download-asset-ref-*` / `download-form-ref-*` / `download-content-should-be-noindex`）、book（`book-*` ×7）、series（`series-*` ×10）、promotion/FB（`promotion-*` ×6 / `sidecar-frontmatter-overlap` / `fb-md-*` / `fb-post-url-missing`） |
| **settings/registry-level** | `content/settings/<file>.json` | `commerce-link-*` ×11（commerce-links.json）、`ads-*`（ads.config.json）、`download-registry-*`（download-*.json） |
| **cross-post（全集掃描）** | 多 sourcePath | `duplicate-slug`、`series-number-duplicate` |

### 1.2 哪些 warning 已被 admin loader / governanceSignals 局部 mirror

只有 **4 條 taxonomy 概念**被 `derivePostGovernanceSignals`（am-5）以 per-post 五欄位 mirror：

| validator rule-type | governanceSignals 欄位 |
|---|---|
| `unknown-tag` | `unknownTagCount`（number） |
| `unknown-category` | `unknownCategoryFlag`（boolean） |
| `tag-site-mismatch` | `crossSiteMismatchTagCount`（number） |
| `category-site-mismatch` | `crossSiteMismatchCategoryFlag`（boolean） |
| （上四項合計） | `signalSum`（number） |

⚠️ **這是「概念 mirror」，不是「計數 mirror」**，且**兩端 universe / 基準不同**（見 §1.4）。governanceSignals **完全未涵蓋**其餘 ~106 條 rule-type。

此外 admin 另有兩個獨立 read-only 摘要（`buildCategoryUsage` / `buildTagUsage`），以 key-level（per-category / per-tag）統計 unknown / mismatch，**亦非** per-post validator 計數，且兩處皆已在 view 明示「不取代 validator」。

### 1.3 哪些 warning 仍只存在於 validator output，不在 ADMIN UI 顯示

除上述 4 條 taxonomy 概念外，**其餘全部** rule-type 僅存在於 validator stderr，ADMIN UI **無** per-post 顯示，包含：

- post-level：frontmatter shape（~21）、related-links（7）、commerce-ref（8）、affiliate-blocks（10）、adsense-blocks（15）、download（~10）、book（7）、series（10）、promotion/FB（~9）。
- settings/registry-level：commerce-link（11）、ads（~15）、download-registry（2）—— 這些**無對應文章**，本質不屬 per-post。
- cross-post：duplicate-slug、series-number-duplicate。

ADMIN 目前對 validator 之 per-post 呈現 = **deferred 佔位**：
- detail panel `validationReadiness` section（`index.ejs` L1002–1048）顯示 `perPostWarningCount: 'deferred'` + reason + `aggregateCommand: npm run validate:content`。
- Posts index 一個 `warn def.` badge（L755，title「per-post validation aggregation deferred」）。
- System checks section（L2146–2173）列 CLI command reference + 「未實作：per-post warning 計數 / 最近一次 validate 結果 mirror（須建立 report 持久化）」。

### 1.4 兩端為何不可 1:1 join（核心事實）

| 維度 | validator（`validateContent` via `load-posts.js`） | admin loader（`loadAdminPosts`） |
|---|---|---|
| **post 範圍** | **僅 ready / published**（drafts/archived 由 loadPosts 過濾；source L2106 明示） | **全 status 含 draft / archived**（11 篇 production） |
| **fixtures** | **含** `content/validation-fixtures/{github,blogger}/posts/`（94 warnings 幾乎全來自此） | **不含** fixtures |
| **settings issues** | **含**（commerce-link / ads / download-registry，sourcePath = settings JSON） | 無對應 post |
| **sourcePath 表示** | **相對路徑**（`content/blogger/posts/x.md`） | `path.resolve()` **絕對路徑** |
| **site 基準** | `post.site`（frontmatter `site` 欄位） | `post.sourceSite`（`content/{site}/` 目錄；loader 慣例，L143–146 / L926 已記） |

**實證**：唯一有 governance signal 的 `phonics-practice-sheet-download`（draft；tag `download` 不在 tags.json）→ admin 顯示 `unknownTagCount=1`，但 **validator 對 production 仍 0 warning**（validator 根本不掃 draft）。故 admin governanceSignals（含 draft）**比 validator 範圍更廣**，兩者數值天生不會相等。

**直接結論**：任何 per-post validator 彙總方案，join 只在 **ready/published production 文章**成立；draft/archived 文章**無** validator 資料 → UI **必須顯示「未驗證（draft/archived）」而非「0 warnings」**；settings-level / fixture issues **沒有對應文章** → 屬 System checks / summary 層，**不可**強行掛到某篇文章。

---

## 2. 資料責任邊界

1. **validator 仍是 ground truth**：rule 邏輯、severity、error/warning 判定、exit code 一律以 `npm run validate:content` 為準；ADMIN 任何顯示皆為衍生 hint。
2. **ADMIN = read-only admin hints / visibility / triage**：只做「哪些文章可能需要人眼看一下」之能見度，**不做修復**、**不做 per-post 修法建議（prescription）**、**不改 severity 語意**。
3. **ADMIN UI 只能顯示 summary，不應取代 validator**：
   - 不在 ADMIN 內重新實作 rule 判定（避免 logic drift）。
   - 不暗示 warning = build blocker（production baseline = 0 error；warnings 為 warning-only）。
   - 顯示計數時必須可追溯到 `npm run validate:content`（同一 ground truth）。
   - 若資料來自快取 / 報告，必須誠實標示「as of <timestamp>，可能過時，請重跑」。

---

## 3. per-post aggregation 可能資料模型（規劃，未實作）

### 3.1 聚合鍵

以 **正規化後之 post 識別**聚合 validator issues：
- 主鍵：**正規化 sourcePath**（validator 相對路徑 ↔ admin 絕對路徑，須統一為 repo-relative posix 形式再 join）。
- 輔助標示（不作主鍵，僅供 UI / debug）：`slug` / `sourceSite`（github|blogger）/ `status`。
- join 範圍限 ready/published production；draft/archived → `validated: false, reason: 'status-excluded'`；無對應文章之 settings/fixture issues → 不掛 post，歸 System checks bucket。

### 3.2 per-post 顯示（提案 shape，僅規劃）

```
post.validationReport = {
  validated: true | false,          // false = draft/archived（validator 不掃）或 report 缺該 post
  reason: '' | 'status-excluded' | 'report-missing',
  warningCount: <number>,           // 該 post 之 warning 數（error 另計）
  errorCount: <number>,             // 預期 production = 0
  byClass: { taxonomy, commerce, adsense, blogger, frontmatter, download, unknown },
  asOf: '<iso timestamp>',          // report 產生時間（誠實標示可能過時）
  source: 'report' | 'deferred',
}
```

### 3.3 warning 類別（class）對映（提案 prefix→class，未實作；須未來 phase lock）

| class | 對映 rule-type 前綴 |
|---|---|
| **taxonomy** | `unknown-category` / `category-site-mismatch` / `unknown-tag` / `tag-site-mismatch` |
| **commerce** | `commerce-ref-*` / `commerce-link-*` / `affiliate-block(s)-*` |
| **adsense** | `adsense-block(s)-*` / `adsense-enabled-*` / `ads-*` |
| **blogger**（publish / 跨站 / FB 推廣） | `promotion-*` / `fb-md-*` / `fb-post-url-missing` / `sidecar-frontmatter-overlap` / `invalid-publish-target-mode` |
| **frontmatter**（核心欄位 shape） | `missing-*` / `invalid-*`（status/site/content-kind/seo/primary-platform/canonical/date）/ `long-*` / `empty-tags` / `body-leading-h1` / `contentkind-and-type-conflict` / `related-links-*` / `book-*` / `series-*` / `download-*` / `duplicate-slug` |
| **unknown** | 任何不在上表之 rule-type（預設 bucket；future-proof） |

⚠️ class 對映為**提案 convention**，非已實作；`download-*` / `book-*` / `series-*` 是否各自成 class 留待未來 lock（v1 暫歸 frontmatter）。

### 3.4 validator command reference（現況）

ADMIN System checks section 已列 `npm run validate:content`（warning-only baseline）+ `check:links` / `check:images` / `check:adsense-*` / `smoke:reverse-utm` / `report:*`。本資料模型沿用 `npm run validate:content` 為唯一 per-post warning 來源指令。

---

## 4. 實作路線選項比較

> 重要前提：`validateContent({ posts, settings })` 已 **export** 且回傳 `{ issues: [{severity,type,sourcePath,value,site?}], errorCount, ... }` —— 結構化資料**已存在於回傳值**；目前只是 CLI main 僅 `printIssues()` 到 stderr，**未序列化成檔**。

### Option A — 不改 validator，admin loader 讀 validator-derived report / cache

- **A1（render-time import）**：admin loader 於 dev render 時 `import { validateContent }` 直接算。
  - ✅ 不改 validator rule；無 staleness（即時）。
  - ❌ 每次 admin render double-run validator（loadPosts github+blogger+fixtures ×2 路徑）；admin loader 與 validator loader 耦合；dev render 變重；仍須處理 universe 對齊（draft/fixture/settings）。
- **A2（persisted report）**：新增獨立 read-only reporter script（如 `report:validation`）`import validateContent` → 輸出結構化 JSON（git-ignored cache）；admin loader 只**讀** JSON。
  - ✅ **不改 validator rule**；reporter 重用 export；admin loader 輕量（只讀 JSON）；staleness 以 `asOf` 誠實標示。
  - ❌ 需新增一支 script（source 變更，但**非** validator 變更）；report 可能過時（須 banner + 重跑提示）；仍須 join 正規化。

### Option B — validator 輸出 structured JSON report，再由 admin loader 讀取

- 改 validator main 加 `--report-json <path>` flag 輸出 JSON。
- ✅ 機器可讀 contract 明確；CLI 仍 ground truth；單一來源檔。
- ❌ **動到 ground-truth 檔**（validator）——風險與 caution 最高；validator 變更須自帶獨立 phase + acceptance；staleness 同 A2。

### Option C — docs 中維持 CLI 為 ground truth，不接 ADMIN

- ADMIN 維持現況（command reference + `validationReadiness: deferred`）。
- ✅ 零風險；零 staleness；validator 單一 ground truth；無 double-run。
- ❌ 無 per-post validator 能見度增益（維持現狀）。

### Option D — view 端直接 reduce 現有 governanceSignals，暫不接 validator warnings

- 沿用 am-4 governance summary card 路線，view 端 reduce `governanceSignals`。
- ✅ 零新資料依賴；已有資料；風險最低；部分已落地。
- ❌ 只涵蓋 4 條 taxonomy 概念（含 draft），**非** validator warning count；若標成「validation」會誤導（universe 不同）。

### 推薦

- **現階段（最保守，推薦維持）**：**Option C + D 現狀**。理由：production validator warnings = **0**，per-post validator 計數目前對 production 全為 0；governanceSignals 已提供 taxonomy triage（且涵蓋 draft，比 validator 更早提醒）。在 production 乾淨的前提下，立即接 validator warnings 之邊際價值低、universe-mismatch 誤導風險高。
- **未來若真要 per-post validator 能見度**：選 **Option A2**（獨立 read-only reporter → JSON → admin 只讀），**優於 Option B**。理由：不動 ground-truth validator；reporter 重用 export；staleness 以 `asOf` 處理；符合保守落地偏好（additive、separate script、read-only、helper-first）。**Option B 僅在**未來確定要把 JSON 變成 validator 一級輸出契約時才考慮，且須獨立 phase。
- **Option A1 不推薦**（render-time double-run 耦合 + 變重）。

---

## 5. UI 顯示位置建議（風險 / 優先順序）

| 位置 | 內容 | 風險 | 優先 | 備註 |
|---|---|---|---|---|
| **detail panel validator warnings section** | 升級既有 `validationReadiness`（deferred → ready/published 顯示 warningCount + byClass；draft → 「未驗證」） | **低** | **1** | 佔位已存在；不碰 Posts index JS；單篇展開才看；最自然 |
| **System checks section（最近一次結果 mirror）** | settings-level + fixture + aggregate 之家；顯示 `asOf` + 重跑提示 | 中 | 2 | 需 persisted report；天然容納無對應文章之 issues；已有「未實作」清單佔位 |
| **Posts index badge**（升級 `warn def.`） | 每篇 warning 數值 badge | 中 | 3 | 動 table cell；**不可**碰 search/filter/sort JS；draft 須顯「未驗證」非 0 |
| **governance summary card 補充欄位** | 在 am-4 卡加 validator 計數 | **高** | 4（v1 不建議） | **雙 universe 混用風險**：卡片現為 all-status governanceSignals；混入 ready/published-only validator count 易造成重複統計困惑；若做須明確分區標示 |

**優先順序原則**：先 detail panel（低風險、佔位現成）→ System checks（容納 settings/fixture/aggregate）→ Posts index（動 cell）→ summary card（最後且須嚴格分區）。每步獨立 phase。

---

## 6. 安全紅線

- **read-only only**：無 `<form>` / `<button>` / `<input>` / `<select>` / `<textarea>` / `fetch(` / `onclick` / `onchange`。
- **不新增 Apply / Save / Auto-fix / Write / Mutate**。
- **不顯示 per-post prescription**（不出現「應改為 X」「請把 tag 改成 Y」規則引擎）；只列計數 / class 分布 / flag。
- **不暗示 warning 一定是 build blocker**（production baseline = 0 error；warning-only；footer 須明示）。
- **validator 仍是 ground truth**：ADMIN 顯示一律可追溯 `npm run validate:content`；不在 ADMIN 重算 rule 判定。
- **ADMIN 只做 visibility / triage，不做修復**。
- **誠實標示**：report 來源須帶 `asOf`，明示可能過時、請重跑；draft/archived 顯「未驗證」**不可**顯「0 warnings」；ADMIN 未實際重跑 validator 時不得宣稱已重跑。

---

## 7. 是否需要 structured validator output

**需要（若要超越現有 4 條 taxonomy 概念、做真正 per-post validator warning count）**：
- `validateContent()` 回傳值**本身已結構化**（`issues[]` 含 sourcePath / type / severity）——所以「能力」已具備，缺的是**序列化成可被 admin 只讀消費之檔 + join 契約**。
- 建議**先做之 docs-only phase** = **`...-validation-report-schema-and-join-contract-preanalysis-docs-only-a`**：鎖定
  1. 結構化 report JSON schema（per-sourcePath issues + 計數 + class 對映 + asOf）；
  2. cross-loader join 契約（相對 ↔ 絕對 sourcePath 正規化；draft/archived → 未驗證；fixture / settings issues → 非 per-post bucket）；
  3. §3.3 class 對映 lock；
  4. staleness / 持久化位置（git-ignored cache）與重跑模型。
- 之後才談 reporter script 實作（Option A2）。

**不需要（若維持現狀）**：
- 用既有 `governanceSignals`（無新資料依賴）只能呈現 4 條 taxonomy 概念（unknown tag/category + cross-site mismatch tag/category），**涵蓋全 status（含 draft）**——此即 am-4 governance summary card + L2 badge/detail 已做到的程度。其餘 ~106 條 rule-type 無法在不引入 structured output 的情況下 per-post 呈現。

---

## 8. Acceptance criteria

### 8.1 docs-only acceptance（本 phase）
- baseline verify PASS（HEAD == origin/main == `2671584`、clean tree）。
- 僅新增本 preanalysis doc + CLAUDE.md 極小 ledger sync；**0** 個 src / views / scripts / loader / validator / content / settings / frontmatter 變更。
- `validate:content` 0/94/84 carry（docs-only 不重跑亦可，baseline 既有）。
- git diff scope 僅 docs + CLAUDE.md；commit / push。

### 8.2 future implementation acceptance（依 option，未來各 phase）
- reporter script（A2）：validator **rule 邏輯 0 變更**；新 script 重用 export 產生 JSON；validate baseline 不變；無 admin write；report 為 git-ignored cache。
- admin consume：dev admin render 無 EJS error；100% read-only（grep 0 個 write 元素 / handler）；draft 顯「未驗證」非 0；`asOf` staleness banner 存在；ready/published 計數與一次 fresh `npm run validate:content` 對該篇相符；`check:adsense-*` / `check:blogger-adsense-output` / `check-commerce-affiliate-resolver` 全 carry。

### 8.3 human visual acceptance（未來實作後）
- 人眼於 `/admin/` detail panel + System checks 目視：計數與手跑 `npm run validate:content`（ready/published）一致；draft 標「未驗證」；無 Apply/Save/Write/Mutate；無 per-post prescription；無「build blocker」誤導；summary card（若補欄）雙 universe 分區清楚、無重複統計困惑。

---

## 9. Recommended next phases

### 最保守（推薦預設）
- **接受本 preanalysis，維持 Option C + D 現狀**：不接 validator warnings；ADMIN 維持 command reference + `validationReadiness: deferred` + governanceSignals（已涵蓋 taxonomy triage）。理由：production validator warnings = 0，per-post 接線邊際價值低、universe-mismatch 誤導風險高。

### 若要推進（拆成小 phase，依序，皆須各自 acceptance）
1. `...-validation-report-schema-and-join-contract-preanalysis-docs-only-a`（docs-only；鎖 JSON schema + sourcePath 正規化 + draft/fixture/settings bucket + class 對映 + staleness 模型）。
2. `...-validation-report-reporter-script-implementation-a`（**NOT docs-only**；新增 read-only reporter `import validateContent` → JSON cache；**不改 validator rule**；不改 admin）。**須 user explicit approval**。
3. `...-admin-validation-report-detail-panel-readonly-consume-implementation-a`（**NOT docs-only**；admin loader 只讀 report，升級 detail panel `validationReadiness`；staleness banner；draft 顯未驗證）。**須 user explicit approval**。
4.（可選後續）System checks section mirror → Posts index badge 升級 → summary card 補欄（最後且嚴格分區）。

### 必須 user explicit approval 之事項
- 任何新增 script（reporter）/ 改 admin view（消費 report）/ 改 validator（Option B JSON flag）。
- summary card 補 validator 欄位（雙 universe，高混淆風險）。
- Posts index badge 由 `warn def.` 升級為實際計數（動 table cell）。
- 紅線：write path / Apply / per-post prescription / filter chip / 點數字跳轉 / loader 聚合搬遷一律獨立 phase + approval；不跳階。

---

（本紀錄結束）
