# Blogger backfill truth-manifest — selected coverage（2026-07-20）

Session：`260720 / add selected-coverage truth manifest`

- Date：2026-07-20（Asia/Taipei）
- Type：tools + contract slice（source implementation + guard extension + docs）。**不是** production backfill execution。
- 上游 policy / predecessor：
  - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`（candidate discovery / `MISSING_SIDECAR` 分類）
  - `docs/20260718-blogger-backfill-missing-sidecar-bootstrap.md`（writer manifest schema；本 slice 為其 additive `coverage` 擴充）
  - `docs/20260718-blogger-backfill-truth-manifest-template.md`（generator；本 slice 加 `--source-path` 選取）
  - `docs/20260719-blogger-backfill-truth-manifest-intake-validator.md`（intake validator；本 slice 使其 coverage 判定 mode-aware）
  - `docs/20260719-blogger-backfill-truth-apply-plan.md`（apply-plan + plan fingerprint；本 slice 使 fingerprint coverage-bound）
  - `docs/20260719-blogger-backfill-production-apply-capability.md` / `docs/20260719-blogger-backfill-apply-authorization-preparation.md`（authorization / single-record apply；**未改**，自動繼承 coverage-bound fingerprint）

---

## 1. 這個 slice 解決的問題

現行 missing-sidecar planner 找到六篇 `20260612-*` candidates。其中五篇已由 Dean 從 Blogger
後台確認為真實已發布文章；第六篇 `20260612-ai-tools-simplify-daily-workflow.md` 目前**尚無任何
已發布 Blogger truth**（repo evidence 僅 `status: ready` + `draft: false` + `publishTargets.blogger.enabled: true`
+ sidecar absent，這**不等於**已發布 truth）。

在本 slice 之前，intake validator 強制 truth manifest 之 sourcePath 集合必須「精確等於」全部六篇
`MISSING_SIDECAR` candidates（exact-all coverage）。於是一篇尚無 truth 的文章，阻擋了另外五篇
合法 backfill。

exact-all coverage 的原始安全目的是保護三件事：

1. **completeness**：不要漏掉任何一篇已發布、卻沒回填 sidecar 的文章。
2. **write safety**：確保 manifest 內每一筆都對應到真實、可寫入的 `MISSING_SIDECAR` 目標。
3. **migration consistency**：manifest 不是「剛好少幾筆」的殘缺輸入。

本 slice **只鬆綁 completeness**（且只在 operator 明確要求時），完整保留 write safety 與 migration
consistency，並且**不降低** production apply 的任何安全邊界。

**不得**為了縮小 coverage 而修改 `ai-tools` 的 lifecycle、draft、Blogger target，或把它排除出 planner。
它保持 `status: ready` / `draft: false` / Blogger enabled / sidecar absent，並**繼續**出現在
`plan:blogger-backfill-sidecars` 的 missing-sidecar inventory。

---

## 2. 兩種 coverage 模式

Truth manifest 現在支援兩種明確模式。**預設不變**：舊 manifest、舊命令、舊 guard 一律走 full coverage。

### Mode 1 — full coverage（既有預設；不變）

- 觸發：manifest **不含** `coverage` 欄位，或 `coverage.mode === "full"`。
- 契約：manifest 之 sourcePath 集合必須**精確等於**當前所有 `MISSING_SIDECAR` candidates。
  少一筆 → `missing_candidate` hard-fail；多一筆 → `unknown_candidate` hard-fail。
- 一個「剛好少幾筆」的 manifest **永遠**被當成不完整的 full coverage 失敗，**不會**被 silent 降級成
  selected。
- generator：`prepare:blogger-backfill-truth-manifest`（無 `--source-path`）之輸出與過去
  **byte-identical**（無 `coverage` 欄位、records 涵蓋全部 `MISSING_SIDECAR`）。

### Mode 2 — explicit selected coverage（本 slice 新增）

- 觸發：manifest 帶
  ```json
  "coverage": {
    "mode": "selected",
    "selectedSourcePaths": [
      "content/blogger/posts/20260612-after-work-writing-time-blocking.md",
      "content/blogger/posts/20260612-blog-as-personal-knowledge-base.md"
    ]
  }
  ```
- 語意（intake validator 強制）：
  - `selectedSourcePaths` 必須**非空**（空集合 hard-fail）。
  - 每一筆須為 canonical repo-relative POSIX path、位於 `content/blogger/posts/`、以 `.md` 結尾
    （非 `.fb.md`）。
  - `selectedSourcePaths` **不得重複**。
  - manifest `records` 之 sourcePath 集合須與 `selectedSourcePaths`「精確相等」——
    宣告了卻沒有對應 record（`declared-but-absent`，即「明示 selected 卻少 candidate」）與
    有 record 卻未宣告（`undeclared-record`）**都**是 hard-fail。這使 manifest **自行攜帶**足以判定
    coverage mode 的明確資料，掉了一筆 record 會被抓到，而不是 silent 縮小 coverage。
  - 每一筆 selected path 必須**當前確實是** `MISSING_SIDECAR` candidate。因此 unknown path、
    已有 sidecar 的文章、draft / Blogger disabled / 非 candidate 文章**都**會 hard-fail。
  - **不要求**涵蓋未被選擇的其他 candidates。未選取者以 `missingCandidates`（informational）列出，
    並繼續由 planner 顯示；selected mode 不會隱藏它們，也不會標示為已處理。
- selected mode **不會**發布 Blogger、**不會**建立 sidecar、**不會**改任何文章的 lifecycle。它只是
  界定「本次確認要回填的歷史已發布文章集合」，供後續**另行授權**的 single-record apply 逐篇寫入。

---

## 3. CLI

### Generator：`prepare:blogger-backfill-truth-manifest`

```bash
# full coverage（預設；輸出與過去 byte-identical）
npm run prepare:blogger-backfill-truth-manifest -- --manifest-only

# selected coverage（--source-path 可重複）
npm run prepare:blogger-backfill-truth-manifest -- --manifest-only \
  --source-path content/blogger/posts/20260612-after-work-writing-time-blocking.md \
  --source-path content/blogger/posts/20260612-blog-as-personal-knowledge-base.md \
  --source-path content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md \
  --source-path content/blogger/posts/20260612-daily-reading-habit-notes.md \
  --source-path content/blogger/posts/20260612-reading-notes-three-questions.md \
  > selected-manifest.json
```

- 無 `--source-path` → full coverage。
- 有 `--source-path` → selected coverage；輸出 deterministic。
- 重複 path、空選取、unknown / 非 `MISSING_SIDECAR` path → hard-fail、**stdout 無輸出**（不會把壞
  選取往下游 pipe）。
- **刻意沒有** `--all` / `--force` / `--yes` / `--overwrite` 類 bypass flag。selected coverage 必須一
  筆一筆 `--source-path` 明示，不能因少填資料自動降級成 subset。

### Validator：`validate:blogger-backfill-truth-manifest`

`--manifest <path>` 不變。validator 依 manifest 內的 `coverage` 欄位自動判定 mode 並套用對應規則。
`--json` 輸出新增 `coverage.mode` / `coverage.selectedSourcePaths` / `coverage.declaredButAbsent` /
`coverage.undeclaredRecords` / `coverage.notMissingSelected` 與 `summary.coverageMode` / `summary.selectedCount`
（皆 additive；既有欄位保留）。

### 下游（未改，但行為隨之調整）

`plan:blogger-backfill-truth-apply` / `rehearse:blogger-backfill-truth-apply` /
`prepare:blogger-backfill-apply-authorization` / `validate:blogger-backfill-apply-authorization` /
`apply:blogger-backfill-truth` 皆**未改動**，透過 `planTruthApply()` 自動繼承 coverage-bound plan
fingerprint（見 §4）。apply 仍是 **single-record**，沒有 batch apply。

---

## 4. Fingerprint binding / downstream compatibility

`plan:blogger-backfill-truth-apply` 之 plan fingerprint（sha256 over canonical JSON）現在**綁定
coverage mode**：

- **full coverage**：fingerprint 輸入與過去**byte-identical**（不含 coverage descriptor）。既有 full-
  coverage fingerprint、以及任何綁定它的 authorization，**完全不變**（backward-compatible）。
- **selected coverage**：fingerprint 輸入額外含 `{ mode: "selected", selectedSourcePaths: [...sorted] }`。

因此：

- 更改 selected set → plan fingerprint 改變（同時因 entries 改變**和** coverage descriptor 改變）。
- full plan 與「records 剛好相同」的 selected plan → fingerprint **不同**（coverage 意圖被綁定）。
- 既有 authorization 之 `expectedPlanFingerprint` 與新 fingerprint 嚴格比對；一旦 selection drift，
  authorization preflight 與 production apply 皆 `plan-fingerprint-mismatch` **fail closed**。
- per-record fingerprint（`fingerprintEntry`）維持不變——一筆 record 是同一次寫入、與 coverage mode
  無關；authorization 已同時綁 plan fingerprint 與 per-record fingerprint。

沒有第二套 manifest JSON 格式：`coverage` 是既有 v1 schema 的 additive、optional 欄位；schemaVersion
不變。舊 manifest 仍可驗證、預設 full coverage。

---

## 5. 安全邊界（本 slice 未放寬）

- selected mode 不 publish、不建立 sidecar、不改 lifecycle、不呼叫 Blogger / Google API、無網路。
- production apply 仍 single-record、authorization-bound、create-only + no-replace + read-back verified。
- 未提供 `--all` / `--force` / `--skip-validation` 之類 bypass；forbidden flags 一律拒絕。
- manifest preparation / validation / authorization / apply / commit / push 仍是**分離階段**；
  production manifest 與 authorization 建議放在 source repo 外部。selection 或 manifest 任何變動都會使
  authorization 失效。
- `ready` + `blogger.enabled` + no sidecar **不等於**已發布 truth；真值仍須 Dean 由 Blogger 後台人工
  提供，本工具**絕不**猜測 URL / publishedAt / bloggerPostId。

---

## 6. Real-world acceptance（read-only / fixture-level 已證明）

以下五篇可被明確選成 selected coverage（generator 產出 `coverage.mode: "selected"` +
五筆 `selectedSourcePaths` + 五筆 records；validator coverage 過關）：

```
content/blogger/posts/20260612-after-work-writing-time-blocking.md
content/blogger/posts/20260612-blog-as-personal-knowledge-base.md
content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md
content/blogger/posts/20260612-daily-reading-habit-notes.md
content/blogger/posts/20260612-reading-notes-three-questions.md
```

而 `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md` 保持
`status: ready` / `draft: false` / Blogger enabled / sidecar absent、**未被本次 manifest 選擇**、
**仍出現在** missing-sidecar inventory（`plan:blogger-backfill-sidecars`）。

本 slice **未**建立 production manifest、**未**寫入 Dean 的真實 URL / 時間、**未**建立 authorization、
**未**執行 apply、**未**建立任何 `.publish.json`。所有 mutation-bearing 測試皆在
`mkdtempSync(os.tmpdir())` 之 synthetic fixture 上執行，production Markdown / sidecar bytes 不變。

---

## 7. Changed files

| Path | 作用 |
| --- | --- |
| `src/scripts/bootstrap-blogger-backfill-sidecars.js` | 於共用 `loadManifest` 加 `coverage` envelope（additive、optional）+ `resolveCoverageMode` helper；writer 本身仍 create-only、忽略 coverage 語意 |
| `src/scripts/validate-blogger-backfill-truth-manifest.js` | `computeCoverage` mode-aware（full = exact-all；selected = declared subset）+ report/summary/JSON additive 欄位 |
| `src/scripts/plan-blogger-backfill-truth-apply.js` | `fingerprintPlan` 可選 coverage descriptor（full 省略＝byte-identical；selected 綁定）+ `coverageDescriptorFromReport` + plan JSON `coverageMode` |
| `src/scripts/prepare-blogger-backfill-truth-manifest.js` | 可重複 `--source-path` selected 選取；無選取＝full byte-identical；壞選取 hard-fail no-output |
| `src/scripts/check-blogger-backfill-truth-manifest.js` | generator guard：selected template / dedup / unknown / non-candidate / already-sidecar / bypass 拒絕 |
| `src/scripts/check-blogger-backfill-truth-manifest-validator.js` | validator guard：§7 selected acceptance matrix（SC1–SC14）+ full-coverage regression |
| `src/scripts/check-blogger-backfill-truth-apply-plan.js` | apply-plan guard：full vs selected fingerprint 不同、selected set 改變 fingerprint 不同、authorization fail-closed 佐證 |

`apply-blogger-backfill-truth.js` / `prepare-blogger-backfill-apply-authorization.js` /
`validate-blogger-backfill-apply-authorization.js` / `rehearse-blogger-backfill-truth-apply.js`
**未改**（自動繼承 coverage-bound fingerprint）。package.json **未新增 script**（generator / validator
既有 script 承接新旗標）。
