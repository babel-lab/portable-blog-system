# Blogger backfill truth-manifest intake validator（2026-07-19）

Session：`260719 / add truth-manifest intake validator`

- Date：2026-07-19（Asia/Taipei）
- Type：source implementation + targeted guard + minimal docs
- 上游 policy：
  - `docs/20260706-blogger-identity-and-backfill-strategy.md`（identity 分層 A.1 human / A.3 system；不猜 ID）
  - `docs/20260706-blogger-backfill-write-target-inventory.md`（canonical write target = `.publish.json` sidecar）
  - `docs/publish-json-schema.md` §5.3 / §5.3.1 / §5.4 / §9.5（Blogger URL / publishedAt 為唯一真相；URL yyyy/mm 由平台依當地發布月份產生；URL yyyy/mm 須與 publishYear/publishMonth 一致）
  - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`（planner classification；本工具重用其 candidate discovery）
  - `docs/20260718-blogger-backfill-missing-sidecar-bootstrap.md`（writer manifest schema + 逐 record shape / URL / ISO / duplicate / candidate / target 驗證；本工具重用其 `loadManifest` / `planBootstrap`）
  - `docs/20260718-blogger-backfill-truth-manifest-template.md`（generator；本工具之上游 producer）
- Predecessor / sibling tools：
  - `src/scripts/plan-blogger-backfill-sidecars.js`（planner；本工具重用 `planMissingSidecars(...)` 供 coverage 交叉比對）
  - `src/scripts/bootstrap-blogger-backfill-sidecars.js`（writer；本工具重用 `loadManifest` / `planBootstrap`；產物之下游）
  - `src/scripts/prepare-blogger-backfill-truth-manifest.js`（generator；產出空 template 供 Dean 填寫）
  - `src/scripts/backfill-published-url.js`（`deriveYearMonth` 重用來源）
  - `src/scripts/check-blogger-backfill.js`（父 guard；warning-only）

> ⚠️ 本工具**不含** Blogger 真值。
> Claude **不得猜** `publishedUrl` / `bloggerPostId` / `publishedAt` / `bloggerBlogId`。
> Validator 之工作是嚴格驗證 Dean **已填入**之 truth，並在任何 apply/write 前作為 fail-closed 閘門；未填 template 直接送入即 hard-fail（bootstrap `loadManifest` / `planBootstrap` 之空 URL / 空 ISO 驗證會 reject）。
> `bloggerPostId` 屬 identity 分層 A.3（system-supplied），template 完全**不含**該欄，本 validator 亦**不**驗證該欄；未來 Blogger API integration 落地後由系統寫入。

---

## 1. 目的

本工具是 Blogger backfill pipeline 中：

```text
missing-sidecar planner
→ optional create-only bootstrap
→ truth-manifest template generator
→ **本工具**：intake validator（本 slice）
→ future writer apply（另 slice；本 slice 不執行）
```

之中間「使用者填入 truth manifest 後、任何 apply/write 之前」的**嚴格唯讀驗證層**。

輸入為 Dean 依 template schema 填入 Blogger 後台真值之 JSON manifest；輸出為 deterministic 之 human-readable 摘要或 `--json` envelope；exit 0 表示 manifest 通過所有 layered checks，可安全交給 `bootstrap:blogger-backfill-sidecars` 進行 dry-run 驗證；exit 1 覆蓋所有 fail-closed 情境。

Validator 只補足 `bootstrap:blogger-backfill-sidecars` 之 dry-run **未涵蓋**之驗證：

| 層 | 檢查 | 提供者 |
| --- | --- | --- |
| A. Envelope | `schemaVersion` / top-level keys / `records` is array | reuse bootstrap `loadManifest` |
| B. Shape / strict URL / strict ISO / duplicate / filesystem candidate | 每筆 record 之 sourcePath 位於 `content/blogger/posts/`、URL 為 strict http(s):// 無 padding、publishedAt 為 strict ISO-8601 且為合法曆日、manifest 內 sourcePath / target sidecar 不重複、對應 Markdown 存在且為 backfill candidate、目標 sidecar 尚不存在 | reuse bootstrap `planBootstrap` |
| C. Coverage | manifest sourcePath 集合須「精確等於」現行所有 `MISSING_SIDECAR` candidate（缺一即 `missing_candidate`，多一即 `unknown_candidate`） | reuse planner `planMissingSidecars` + validator 自身 |
| D. Sentinel rejection | publishedUrl / publishedAt 精確 match（case-insensitive、trim 後）任一 sentinel（TODO / TBD / UNKNOWN / N/A / NA）即 hard-fail | validator 自身 |
| E. publishedUrl uniqueness | manifest 內任兩筆 record 之 publishedUrl 不得相同（bootstrap 只查 sourcePath / target 兩軸） | validator 自身 |
| F. Cross-field consistency | publishedUrl `/YYYY/MM/` ↔ publishedAt YYYY-MM 一致；post URL 缺 `/YYYY/MM/` 亦 hard-fail | reuse `deriveYearMonth` + validator 自身 |

任一層 fail 即 non-zero exit；validator **不**「先寫再驗」；**不**修改 manifest。

---

## 2. 邊界（fail-closed）

Validator 是純 read-only：

- 執行前後 repo 檔案 bytes / mtime 均不變；輸入 manifest bytes / mtime 亦不變。
- 唯一 output channel = stdout（human-readable 文字 或 `--json` envelope）+ stderr（診斷訊息）。
- 缺 `--manifest` 即 hard-fail exit 1；manifest 不存在 / 非一般檔 / 讀取失敗 / JSON parse 失敗 / schema 不符 → exit 1。
- 無 `--apply` / `--write` / `--output` / `--out` / `--force` / `--overwrite` / `--replace` / `--merge` / `--yes` / `-y` / `--fix` 等 mutation-like flag；出現即 hard-fail（防止未來誤加）。
- 不建立 manifest；不重寫 / 格式化 / trim manifest；不寫 `.publish.json`；不 touch Markdown；不動 `dist-*`；不動 gh-pages；不動 deploy clone。
- 不呼叫 Blogger / Google API；不需網路；不需 credential。
- 不透過 `child_process` 呼叫 planner、bootstrap 或 generator 之 CLI；直接 import 各自之 structured API。
- 輸出 JSON **不含** `generatedAt` / `timestamp` / absolute machine path / hostname / OS-dependent separator / random ID；同一 frozen repo + 同 manifest 重跑兩次 `--json` stdout bytes 應完全一致。

---

## 3. 使用

Human-readable summary（預設；stdout；含 layered check 之逐筆說明 + `Overall: PASS/FAIL`）：

```bash
npm run validate:blogger-backfill-truth-manifest -- --manifest <path>
```

Deterministic JSON envelope（`ok` / `summary` / `coverage` / `sentinelHits` / `duplicateUrls` / `monthMismatches` / `entries` / `errors`；`mutationPerformed: false`）：

```bash
npm run validate:blogger-backfill-truth-manifest -- --manifest <path> --json
```

Help（含 fail-closed 條件列表 + 不含 Blogger 真值聲明）：

```bash
npm run validate:blogger-backfill-truth-manifest -- --help
```

Guard：

```bash
npm run check:blogger-backfill-truth-manifest-validator
```

Guard 覆蓋 CLI 邊界（缺 `--manifest` / forbidden flag / unknown flag / non-absolute `--repo-root`）、envelope 錯誤（invalid JSON / wrong schemaVersion / unknown top-level / records not array）、shape / URL / ISO 錯誤（blank / whitespace-padded / non-http(s) / non-strict-ISO / invalid calendar date）、duplicate sourcePath、duplicate publishedUrl、coverage 錯誤（missing candidate / unknown candidate / 已有 sidecar）、sentinel（每個 TRUTH_SENTINELS 之 case-insensitive + whitespace padding 變體）、cross-field month mismatch、URL 缺 `/YYYY/MM/`、timezone / month boundary 正例（string-based year/month；不因 UTC 換算失敗）、determinism（human 與 `--json` 各連跑兩次 stdout bytes 一致）、fixture 前後檔案 bytes / mtime 不變、input manifest bytes / mtime 不變、production `.publish.json` inventory / mtime / Markdown bytes / mtime 不變、`dist-blogger-preview/` absent、source-level 無 `fs.writeFile` / `fs.mkdir` / `fs.rm` / `fs.rename` / `fs.unlink` / `fs.copyFile` / `child_process` / `fetch(` / `node:http[s]` / `googleapis` / oauth。

---

## 4. Exit behavior

- Exit 0：manifest 通過所有 layered checks（envelope + shape + coverage + sentinel + duplicate URL + cross-field）。
- Exit 1：任一
  - 缺 `--manifest`
  - forbidden flag（`--apply` / `--write` / `--output` / `--out` / `--force` / `--overwrite` / `--replace` / `--merge` / `--yes` / `-y` / `--fix`）
  - unknown flag
  - non-absolute `--repo-root`（guard-only flag）
  - manifest read / parse 失敗、unknown top-level、wrong `schemaVersion`、`records` 非 array
  - 任一 record shape 錯誤（unknown key / 非 `content/blogger/posts/` sourcePath / blank / whitespace-padded / non-http(s) publishedUrl / blank / whitespace-padded / non-strict-ISO / calendar-invalid publishedAt）
  - duplicate sourcePath 或 duplicate target sidecar
  - Markdown 缺失、frontmatter 非 backfill candidate、目標 sidecar 已存在
  - coverage 錯誤（missing_candidate / unknown_candidate）
  - sentinel truth（publishedUrl / publishedAt 精確等於 TODO / TBD / UNKNOWN / N/A / NA，case-insensitive、trim 後）
  - duplicate publishedUrl 於 manifest 內
  - cross-field 錯誤（URL `/YYYY/MM/` 與 publishedAt YYYY-MM 不符；或 post URL 缺 `/YYYY/MM/`）

---

## 5. Layered checks（逐層對應現有契約）

### Layer A — Envelope

重用 `bootstrap-blogger-backfill-sidecars.js` 之 `loadManifest(inputPath)`：

- read failure → error
- JSON parse failure → error
- top-level 非 plain object → error
- 未定義之 top-level key（`ALLOWED_MANIFEST_TOP_KEYS` = `{schemaVersion, records, notes}`）→ error
- `schemaVersion !== 1` → error
- `records` 非 array → error

### Layer B — Shape / strict URL / strict ISO / duplicate / filesystem candidate

重用 `bootstrap-blogger-backfill-sidecars.js` 之 `planBootstrap({ manifest, repoRoot })`：

- record shape：`ALLOWED_RECORD_TOP_KEYS` = `{sourcePath, blogger}`；`ALLOWED_RECORD_BLOGGER_KEYS` = `{publishedUrl, publishedAt}`（**不含** `bloggerPostId`；identity A.3）
- `sourcePath`：非空、無 padding、repo-relative POSIX-style、無 `..`、位於 `content/blogger/posts/`、副檔為 `.md`（非 `.fb.md`）
- `blogger.publishedUrl`：strict http(s)://，無 padding（`isHttpUrl`）
- `blogger.publishedAt`：strict ISO-8601（YYYY-MM-DD 或 YYYY-MM-DDThh:mm[:ss][Z|±hh:mm]），無 padding、Date-parseable、合法曆日、`deriveYearMonth` 可推得非空年月（`resolvePublishedAt`）
- duplicate sourcePath / duplicate target sidecar
- 對應 Markdown 存在且 frontmatter 解析成功
- Markdown 為 Blogger backfill candidate（`publishTargets.blogger.enabled === true`、`draft !== true`、`status ∈ [ready, published]`）
- 目標 `.publish.json` 尚不存在（create-only 語意；已存在即 `SIDECAR_ALREADY_EXISTS`）

任一 non-`READY_FOR_WRITE` readiness → 於 report 標記該 entry 錯誤，整份 manifest fail-closed。

### Layer C — Coverage

重用 `plan-blogger-backfill-sidecars.js` 之 `planMissingSidecars({ repoRoot })`，取得現行所有 `MISSING_SIDECAR` candidate。

- `missing_candidates` = 現行 `MISSING_SIDECAR` 但 manifest **未**含之 sourcePath。
- `unknown_candidates` = manifest 中出現但**非**現行 `MISSING_SIDECAR` 之 sourcePath。

任一 > 0 → fail-closed。此為 `bootstrap:blogger-backfill-sidecars` dry-run **未涵蓋**之維度（bootstrap 只看 manifest 內 entry，不比對 candidate universe）。

### Layer D — Sentinel rejection

對每筆 record 之 `blogger.publishedUrl` / `blogger.publishedAt`，若 trim + `toUpperCase()` 後精確等於任一 sentinel（`TODO` / `TBD` / `UNKNOWN` / `N/A` / `NA`），即 hard-fail 並於 `sentinelHits[]` 列出。

`bootstrap:blogger-backfill-sidecars` 之 `isHttpUrl` / `resolvePublishedAt` 只拒空字串與 padding；sentinel 值本身為非空 string，會通過該層而寫入。intake validator 補此層以攔截人類 placeholder。

### Layer E — publishedUrl uniqueness

manifest 內任兩筆 record 之 `blogger.publishedUrl` 完全相同 → hard-fail 並於 `duplicateUrls[]` 列出所有涉及之 `recordIndexes`。

bootstrap 只驗 sourcePath / target sidecar 之 uniqueness；URL uniqueness 為本 validator 補足。

### Layer F — Cross-field consistency

擷取 `blogger.publishedUrl` 之 `/YYYY/MM/` segment；比對 `deriveYearMonth(blogger.publishedAt)` 之 `year` / `month`：

- URL 缺 `/YYYY/MM/`：post URL 依 `publish-json-schema.md` §5.3.1 必含 `/YYYY/MM/`（manifest sourcePath 已由 shape 層限制在 `content/blogger/posts/`，即 post，不含 page）；缺即 hard-fail（`reason: 'url_missing_yyyy_mm'`）。
- URL yyyy/mm ≠ publishedAt YYYY-MM：hard-fail（`reason: 'url_month_mismatch'`）。

`deriveYearMonth` 依 publishedAt 字串本身之 YYYY-MM，**不**先換算 UTC；符合 §5.4 之 timezone / month boundary 契約。範例 `2026-08-01T00:30:00+08:00` 對應 URL `/2026/08/`（不因 UTC 換算漂移至 `/2026/07/`）。

---

## 6. Recommended workflow（Dean 未來 slice；本 slice 不執行）

1. 現況盤點：
   ```bash
   npm run plan:blogger-backfill-sidecars
   ```
2. 產出空 template（可存檔亦可只 preview）：
   ```bash
   npm run prepare:blogger-backfill-truth-manifest -- --manifest-only > <path>
   ```
3. Dean 於**本機、非 tracked** location 逐筆填入 Blogger 後台真值（`publishedUrl` / `publishedAt`）。
4. **本 validator**（intake gate）：
   ```bash
   npm run validate:blogger-backfill-truth-manifest -- --manifest <path>
   ```
   通過（exit 0 + `Overall: PASS`）前**不得**進 bootstrap dry-run。
5. Bootstrap dry-run 驗證（第二層閘門；重覆驗證 shape / candidate / target；本 slice 不動）：
   ```bash
   npm run bootstrap:blogger-backfill-sidecars -- --input <path>
   ```
   全部 `READY_FOR_WRITE` 前**不得** apply。
6. 明確授權後才 apply（本 slice **不**執行；仍需獨立 phase + explicit approval）：
   ```bash
   npm run bootstrap:blogger-backfill-sidecars -- --input <path> --apply
   ```

---

## 7. Publication truth 不得猜測

無論任何情況，validator 都：

- **不**推導 / 猜測 `publishedUrl`
- **不**推導 / 猜測 `publishedAt`（不 fallback 至當下時間；不由 `.md` frontmatter `date` 推導）
- **不**推導 / 猜測 `bloggerPostId`（identity A.3；template 完全不含該欄；validator 亦不驗證）
- **不**推導 / 猜測 `bloggerBlogId`
- **不**從 slug、title、URL、檔案時間推導任何 Blogger identifier
- **不**在 sentinel / whitespace / 缺欄位時「填一個看似合理的值」以放行

Blogger 平台真值只能由 Dean 從 Blogger 後台複製提供（human-supplied 部分），或由未來 Blogger API integration 之 response 取得（system-supplied 部分）。

---

## 8. 未來 slice（本 slice 不做）

以下屬 future slice，各須另開 phase + Dean explicit approval：

- 對六篇正式 `20260612-*` 之 production truth 填寫（Dean human input）
- 對六篇正式 `20260612-*` 之 bootstrap `--apply`（實際建立 sidecar）
- Blogger API credential / auth / publish / update flow
- Blogger `postId` capture after API publish / update
- 對 `PRESENT_INCOMPLETE` sidecar 之現地補值（`backfill:url` 路徑；本 slice 不動）
- validator 擴至 `PRESENT_INCOMPLETE` 補值 workflow（現階段刻意排除；避免與 create-only writer 語意衝突）
- URL slug / permalink consistency 驗證（Blogger 允許自訂 permalink，作者可能與 Markdown slug 不同；當前僅驗 `/YYYY/MM/`）
- warning-only report mode（本 validator 只有 hard-fail 一種模式；符合「intake 閘門」定位）
- 升級 `check:blogger-backfill` warning 為 blocking

---

## 9. 硬性聲明（不可違反）

- 本文件**不含** Blogger 真值。
- Validator **不得**建立 / 修改 / 移動 / 重新命名任何檔案。
- Validator **不得** touch Markdown / sidecar / dist-* / gh-pages / deploy clone。
- Validator **不得** 呼叫 Blogger / Google API；不得存取網路；不需 credential。
- Validator **不得** fabricate 任何 truth；缺失即 hard-fail，不 fallback。
- Validator **不得** 透過 `child_process` 呼叫 planner / bootstrap / generator；三者以 in-process import 重用其 structured API。
- Validator **不得** 由 slug / title / URL / 檔案時間推導 Blogger truth。
- Guard 覆蓋須維持所有 fixture assertion 在 OS temp 目錄；**不得**暫改真實 repo 檔案後再還原。
- Guard 覆蓋須維持 source-level 靜態斷言：validator 原始碼不得含 `fs.writeFile` / `fs.mkdir` / `fs.rm` / `fs.rename` / `fs.unlink` / `fs.copyFile` / `fs.appendFile` / `child_process` / `fetch(` / `node:http[s]` / `googleapis` / oauth。
- 現行 `check:blogger-backfill` / `backfill:url` / `check:blogger-backfill:one-post` / `plan:blogger-backfill-sidecars` / `bootstrap:blogger-backfill-sidecars` / `prepare:blogger-backfill-truth-manifest` / `check:blogger-backfill-truth-manifest` 之定位與行為**不變**。
- 本 slice **不**升級任何 warning-only guard 為 blocking。
- 本 slice **不**觸發 build / deploy / preview / dist-* / Blogger 後台 / GA4 / AdSense / custom domain / AdSense 開啟。
- 本 slice **不**代表已取得七篇候選文章之正式 Blogger truth；validator 之存在**不**授權任何 apply / write。

---

## 10. 承接關係

- Predecessor：
  - `docs/20260706-blogger-identity-and-backfill-strategy.md`
  - `docs/20260706-blogger-backfill-write-target-inventory.md`
  - `docs/20260706-blogger-backfill-report-only-baseline.md`
  - `docs/publish-json-schema.md` §5
  - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`
  - `docs/20260718-blogger-backfill-missing-sidecar-bootstrap.md`
  - `docs/20260718-blogger-backfill-truth-manifest-template.md`
- Sibling tools：
  - `src/scripts/plan-blogger-backfill-sidecars.js`（planner）
  - `src/scripts/bootstrap-blogger-backfill-sidecars.js`（writer；本 validator 之下游）
  - `src/scripts/prepare-blogger-backfill-truth-manifest.js`（generator；本 validator 之上游 producer）
  - `src/scripts/backfill-published-url.js`（`deriveYearMonth` 重用來源）
- New：
  - `src/scripts/validate-blogger-backfill-truth-manifest.js`（intake validator；本 slice 落地）
  - `src/scripts/check-blogger-backfill-truth-manifest-validator.js`（validator contract guard；本 slice 落地）
  - `package.json` scripts：`validate:blogger-backfill-truth-manifest` / `check:blogger-backfill-truth-manifest-validator`

本文件補足 missing-sidecar 分工線上「planner → truth manifest generator → **intake validator** → writer」之閘門：先 preview 缺口與 truth 欄位、以確定 schema 之 template 承接 Dean 之人工填寫、以**本 validator** 做嚴格 layered 驗證，然後才進 writer dry-run 驗證與後續明確授權 apply。實際對六篇 `20260612-*` 之 production truth 填寫、bootstrap apply 仍等待 Dean 明確授權，屬未來 slice。
