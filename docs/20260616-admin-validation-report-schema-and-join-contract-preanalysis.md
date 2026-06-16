# ADMIN — Validation Report Schema & Per-Post Join Contract Preanalysis

- **Phase**：`20260616-admin-validation-report-schema-and-join-contract-preanalysis-docs-only-a`
- **日期**：2026-06-16（15:xx 起；new session）
- **性質**：docs-only preanalysis（**不**改 src / views / content / settings / package / tests；**不**做 source implementation；**不**做 validator-warning join；**不**做 Admin UI；**不**做 write/apply/fix；**不** build/deploy；**不** npm install；**不** merge/rebase/reset/amend/force push）。唯一 mutation = 本 preanalysis doc + CLAUDE.md 極小 ledger sync。**本階段只產出 preanalysis doc，不實作。**
- **目標**：規劃 validator report JSON schema 與 admin per-post join contract——把 `npm run validate:content` 之 warnings 精準對應到每篇文章 detail panel 的**前置設計**。此為 pm-2 §7 / pm-3 §F.5 指定之必經前置（先 schema + join contract，再談 reporter script，再談 admin consume）。
- **承接**：
  - `docs/20260616-admin-validator-per-post-aggregation-preanalysis.md`（pm-2；rule taxonomy / Option A2 / universe mismatch）
  - `docs/20260616-admin-validator-per-post-aggregation-preanalysis-acceptance-record.md`（pm-3；接受 C+D 現狀、列前置）
  - `docs/20260616-admin-validator-per-post-aggregation-implementation-acceptance-record.md`（pm-5；`governanceAggregation` accepted）
  - `docs/20260616-admin-governance-aggregation-detail-panel-human-visual-acceptance-record.md`（pm-13；detail panel UI human-accepted）

---

## A. Baseline

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main
HEAD           : 6f0d779 == origin/main
working tree   : clean
ahead / behind : 0 / 0
latest commit  : 6f0d779 docs(admin): record governance aggregation visual acceptance
```

→ baseline 完全符合 phase 指示。未執行任何 merge / rebase / reset / amend / force push。

---

## B. Source state（read-only intake；已驗證之事實）

### B.1 validator（`src/scripts/validate-content.js`，2577 行）

- **export**：`validateContent({ posts, settings })`（L1351）→ **回傳 `{ issues, errorCount, warningCount }`**（L2375–2376）。
- **issue shape**：`{ severity: 'error'|'warning', type: '<rule-id>', sourcePath: '<string>', value?, site? }`（全檔 `issues.push(...)`）。
- **post 維度迴圈**：`for (const post of posts) { const sourcePath = post.sourcePath; … }`（L1443–1444）——per-post 規則一律以 `post.sourcePath` 為 issue key。
- **cross-post 規則**：`duplicate-slug`（L2322，對**每一**衝突 post 之 sourcePath 各 push 一筆）；series-number 類（L2338–2361，sourcePath = 個別 post 或 series entry）。
- **settings/registry 規則**：sourcePath = settings JSON 路徑（如 `content/settings/commerce-links.json`，L424；ads / download registry 同理）。
- **CLI main**（L2531+）：`loadPosts({site:'github'})` + `blogger` + `validation-fixtures/github` + `validation-fixtures/blogger` → 合併 → `validateContent` → **`printIssues(result.issues)`（stderr 文字，L2382）** → `errorCount>0` 才 `exit(1)`。**目前無 JSON / 結構化檔輸出。**
- **overlay**：`--registry-overlay <path>`（validation-only；replace semantics；不影響 build/dev/admin）。

### B.2 validator sourcePath 形式 + universe（`src/scripts/load-posts.js`）

- **sourcePath = repo-relative posix**：`toRelative(absPath) = path.relative(PROJECT_ROOT, absPath)` 並 `.split(sep).join('/')`（L31）→ 形如 `content/blogger/posts/<file>.md` / `content/github/posts/<file>.md` / `content/validation-fixtures/{github,blogger}/posts/<file>.md`。
- **universe = ready/published only**：`VISIBLE_STATUS = new Set(['ready','published'])`（L21）；`draft===true` 排除（L24）；`status` 不在 visible set 排除（L25–26，預設 `status='draft'`）。→ **draft / archived / 其他 status 不進 validator**。
- **`loadPosts` 另回傳 `filteredOut[]`**：含被排除 post 之 `{ sourcePath, status, draft, … }`（L48–54）——**可作為 join contract 之「status-excluded」來源**（讓 admin 知道哪些 post 是「未驗證」而非「0 warnings」）。

### B.3 admin loader（`src/scripts/load-admin-posts.js`）

- glob `content/{github,blogger}/posts/*.md`（排除 `.fb.md`）；**含全 status（draft/archived）**；**排除 fixtures**。
- `post.sourcePath = path.resolve(mdPath)`（**絕對路徑**，L988）；site 基準 = `post.sourceSite`（目錄 `content/{site}/`）。
- 已 derive：`post.governanceSignals`（5 欄 taxonomy）、`post.governanceAggregation`（pm-4；read-only enumerable）。
- detail panel 既有「Validation warnings (deferred)」section 顯示 `validationReadiness.perPostWarningCount='deferred'` + `aggregateCommand`（占位現成）。

### B.4 兩端 universe 不一致（pm-2 §1.4 核心；本 phase 鎖入 join contract）

| 維度 | validator（load-posts） | admin loader |
|---|---|---|
| sourcePath | **repo-relative posix** | **絕對路徑**（path.resolve） |
| status 範圍 | **ready/published only** | **全 status 含 draft/archived** |
| fixtures | **含** | **不含** |
| settings issues | **含**（sourcePath = JSON） | 無對應 post |
| site 基準 | `post.site`（frontmatter） | `post.sourceSite`（目錄） |

→ 唯一 governance-signal post `phonics-practice-sheet-download` 為 **draft** → validator 看不到 → production validator warnings = **0**；故 join 後該 post 必須顯「未驗證」而非「0 warnings」。

---

## C. Validator report JSON schema（提案；lock 供未來 reporter 用）

> 設計原則：**reporter 不改 validator rule**，只重用 `validateContent()` 之回傳值序列化；schema 機器可讀、可被 admin 只讀消費；誠實標示 staleness。

### C.1 envelope（top-level）

```jsonc
{
  "schemaVersion": 1,
  "generator": "report-validation",            // 產生此 report 之 script 名（未來新增）
  "asOf": "<ISO-8601 timestamp>",              // report 產生時間（誠實 staleness；由 reporter 寫入，非 validator rule）
  "inputs": {
    "sites": ["github", "blogger"],
    "includesFixtures": true,                  // main 流程含 validation-fixtures
    "registryOverlay": null                     // 或 overlay 路徑字串（若以 --registry-overlay 產生）
  },
  "totals": {
    "errorCount": 0,
    "warningCount": 94,
    "issuePostCount": 84                        // 有 issue 之不同 sourcePath 數（含 settings/fixtures）
  },
  "bySourcePath": [ /* C.2 entries */ ],
  "buckets": { /* C.3 */ }
}
```

### C.2 per-sourcePath entry（join 主體）

```jsonc
{
  "sourcePath": "content/blogger/posts/x.md",  // validator 原生 repo-relative posix（join key 之 raw 形式）
  "normalizedKey": "content/blogger/posts/x.md", // §D 正規化後 join key（此例與 raw 同）
  "kind": "post" | "fixture" | "settings" | "cross-post-aggregate",
  "errorCount": 0,
  "warningCount": 2,
  "byClass": { "taxonomy": 1, "commerce": 0, "adsense": 0, "blogger": 0, "frontmatter": 1, "download": 0, "book": 0, "series": 0, "unknown": 0 },
  "issues": [
    { "severity": "warning", "type": "unknown-tag", "class": "taxonomy", "value": "download" }
    // 注意：value 可能含作者填寫之字串；reporter 不得 echo 任何 secret / token；commerce/adsense 類沿用既有「不洩 internalLabel / real id」紅線
  ]
}
```

### C.3 buckets（非 per-post issues 的家）

```jsonc
"buckets": {
  "settings": [ /* sourcePath = content/settings/*.json 之 entries（無對應文章）*/ ],
  "fixtures": [ /* sourcePath = content/validation-fixtures/** 之 entries（測試用，無對應 production 文章）*/ ],
  "crossPost": [ /* duplicate-slug / series-number-duplicate 之彙整視角（仍同時保留在 C.2 各 post entry）*/ ]
}
```

### C.4 class 對映 lock（沿用 pm-2 §3.3；rule-id 前綴 → class）

| class | rule-type 前綴 |
|---|---|
| **taxonomy** | `unknown-category` / `category-site-mismatch` / `unknown-tag` / `tag-site-mismatch` |
| **commerce** | `commerce-ref-*` / `commerce-link-*` / `affiliate-block(s)-*` |
| **adsense** | `adsense-block(s)-*` / `adsense-enabled-*` / `ads-*` |
| **blogger** | `promotion-*` / `fb-md-*` / `fb-post-url-missing` / `sidecar-frontmatter-overlap` / `invalid-publish-target-mode` |
| **frontmatter** | `missing-*` / `invalid-*`（status/site/content-kind/seo/primary-platform/canonical/date）/ `long-*` / `empty-tags` / `body-leading-h1` / `contentkind-and-type-conflict` / `related-links-*` / `book-*` / `series-*` / `download-*` / `duplicate-slug` |
| **unknown** | 任何不在上表之 rule-type（預設 bucket；future-proof） |

⚠️ class 對映為 reporter **view-side 分類 convention**，不改 validator rule severity / 判定。`download-*` / `book-*` / `series-*` 是否各自成 class 留待未來（v1 暫歸 frontmatter，與 pm-2 一致）。

---

## D. Cross-loader join contract（核心；lock）

### D.1 join key 正規化

- 目標 canonical key = **repo-relative posix**：`content/{site}/posts/<file>.md`。
- validator 端：`post.sourcePath` 已是此形式（B.2）→ 直接用。
- admin 端：`post.sourcePath` 為絕對路徑（B.3）→ 正規化 `path.relative(PROJECT_ROOT, abs).split(path.sep).join('/')`（mirror `load-posts.js` `toRelative`）→ 得 canonical key。
- join：admin post.normalizedKey ↔ report entry.normalizedKey（exact string match）。

### D.2 universe reconciliation rules（誰對應誰）

| 來源 | join 結果 | admin 顯示語意 |
|---|---|---|
| admin post（ready/published）↔ report C.2 post entry | **命中** | 顯示該 entry warningCount / byClass / issues |
| admin post（**draft/archived**） | report **無對應**（validator 不掃） | **`validated:false, reason:'status-excluded'`** → 顯「**未驗證（draft/archived）**」，**不可**顯「0 warnings」 |
| admin post（ready/published）但 report 缺該 key | report 過時 / 未含 | `validated:false, reason:'report-missing'` → 顯「未驗證（report 過時，請重跑）」 |
| report `kind:'fixture'`（`content/validation-fixtures/**`） | **無對應 admin post**（admin 排除 fixtures） | 歸 **System checks / fixtures bucket**，不掛任何文章 |
| report `kind:'settings'`（`content/settings/*.json`） | **無對應 admin post** | 歸 **System checks / settings bucket** |
| report `kind:'cross-post-aggregate'`（duplicate-slug 等） | 已同時存在於各 post entry（validator per-sourcePath push） | per-post 命中即顯示；另可在 System checks 給彙整視角 |

### D.3 site 基準差異（記錄，不在 join key 內）

- validator site 基準 = `post.site`（frontmatter）；admin = `post.sourceSite`（目錄）。
- **join key 不含 site**（用 sourcePath 即足以唯一定位檔案）→ site 差異不影響 join；但 admin UI 顯示時應沿用既有「sourceSite-based」措辭，並標示 validator 之 site mismatch rule 以 `post.site` 為準（兩者可能不同，屬設計，需誠實註記）。

### D.4 staleness / 持久化模型

- report = **git-ignored cache**（建議位置 `.cache/data/validation-report.json`，沿用既有 `.cache/data/` 慣例如 `build-manifest.json` / `site.json`；**不 commit**）。
- `asOf` 由 reporter 寫入；admin consume 端**必須**顯示 `asOf` + 「可能過時，請重跑 `npm run validate:content` / `report:validation`」banner。
- admin **不自行重跑 validator**（避免 double-run / loader drift / 效能）；只讀 report。
- report 缺檔 → admin 顯「尚未產生 report；請執行 reporter」→ 不報錯、不假裝 0。

---

## E. 責任邊界（沿用 pm-2 §2，再確認）

1. **validator = ground truth**：rule 邏輯 / severity / error-warning / exit code 一律以 `npm run validate:content` 為準。
2. **reporter = 純序列化**：重用 `validateContent()` 回傳值 → JSON；**不改 rule**、不重判 severity、不新增規則。
3. **admin = read-only hints / triage**：只顯示 report 衍生資料；**不修復**、**不 per-post prescription**、**不暗示 build blocker**（warning-only）、**不在 admin 重算 rule**。
4. **誠實 staleness / universe**：draft/archived → 未驗證（非 0）；fixture/settings → 非 per-post bucket；report 來源帶 `asOf`。

---

## F. 安全 / secret 紅線（schema-specific）

- report `issues[].value` 可能含作者填寫字串（如 unknown tag 名）；reporter **不得** echo commerce internalLabel / real AdSense client·slot id / token / credential（沿用既有 validator 措辭：commerce/adsense 類訊息本就不洩敏感值）。
- report 為 git-ignored cache，**不得 commit**；不得寫入 docs / CLAUDE.md。
- overlay 產生之 report 須在 `inputs.registryOverlay` 標示（避免把 overlay-only 結果誤當 production）。

---

## G. 實作路線（沿用 pm-2 Option A2；分階段，皆須 user approval）

1. **本 phase（docs-only）**：lock schema（§C）+ join contract（§D）+ class 對映（§C.4）+ staleness（§D.4）。← 現在
2. `…-validation-reporter-script-implementation-a`（**NOT docs-only**）：新增 read-only reporter（如 `report:validation`）`import { validateContent }` → 產生 §C JSON 至 `.cache/data/validation-report.json`；**不改 validator rule**；不改 admin；附 smoke（synthetic posts → schema 形狀 assert）。
3. `…-admin-validation-report-detail-panel-readonly-consume-implementation-a`（**NOT docs-only**）：admin loader 只讀 report，升級 detail panel「Validation warnings (deferred)」→ 顯 warningCount / byClass / asOf banner；draft 顯「未驗證」。
4.（可選後續）System checks bucket（settings/fixtures/cross-post）→ Posts index badge 升級 → summary card 補欄（最後且嚴格分區）。

**Option B（validator 直接加 `--report-json`）= 不選**（動 ground-truth validator；caution 最高）；除非未來確定要把 JSON 升為 validator 一級契約，且另開獨立 phase。

---

## H. Acceptance criteria

### H.1 本 docs-only phase
- baseline verify PASS（HEAD==origin/main==`6f0d779`、clean）。
- 僅新增本 preanalysis doc + CLAUDE.md 極小 ledger sync；**0** 個 src/views/scripts/loader/validator/content/settings/package/tests 變更。
- git diff scope 僅 docs + CLAUDE.md。

### H.2 未來 reporter phase（§G.2）
- validator **rule 邏輯 0 變更**；reporter 重用 export 產生 §C schema 之 JSON；`validate:content` baseline 0/94/84 不變；report 為 git-ignored cache（不 commit）；無 admin write；無 secret echo；smoke 驗 schema 形狀 + class 對映 + bucket 分類。

### H.3 未來 admin consume phase（§G.3）
- dev admin render 無 EJS error；100% read-only（grep 0 write 元素）；draft 顯「未驗證」非 0；`asOf` staleness banner 存在；ready/published 計數與一次 fresh `validate:content` 對該篇相符；其餘 check carry。

---

## I. Explicit non-actions（本 phase）

- ❌ source implementation
- ❌ validator rule change / validator JSON output / reporter script
- ❌ validator-warning join（實際 join 屬未來 consume phase）
- ❌ Admin UI / EJS / views source change
- ❌ write / apply / fix
- ❌ content / frontmatter mutation
- ❌ settings / package / lockfile change
- ❌ build / deploy / npm install
- ❌ Blogger repost / GitHub Pages build·deploy / ads·commerce unrelated change
- ❌ merge / rebase / reset / amend / force push / unrelated cleanup
- ❌ CLAUDE.md compression / reorder
- ✅ 唯一 mutation = 本 preanalysis doc + CLAUDE.md 極小 ledger sync

---

## J. Recommended next phase

- **`20260616-admin-validation-report-schema-and-join-contract-preanalysis-acceptance-readonly-a`**（read-only acceptance；docs-only）。
- 之後（須 user approval，依序）：reporter script（§G.2，NOT docs-only）→ admin detail-panel consume（§G.3，NOT docs-only）。
- 紅線：reporter / admin-consume / validator `--report-json` / Posts-index 計數 badge / summary-card 補欄 / write path / per-post prescription / loader 跨篇聚合搬遷 一律獨立 phase + user explicit approval；不跳階。

---

（本紀錄結束）
