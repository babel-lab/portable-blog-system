# Blogger backfill validated truth apply-plan gate（2026-07-19）

Session：`260719 / add validated truth apply planner`

- Date：2026-07-19（Asia/Taipei）
- Type：source implementation + targeted guard + minimal docs
- 上游 policy：
  - `docs/20260706-blogger-identity-and-backfill-strategy.md`（identity 分層 A.1 human / A.3 system；不猜 ID）
  - `docs/20260706-blogger-backfill-write-target-inventory.md`（canonical write target = `.publish.json` sidecar）
  - `docs/publish-json-schema.md` §5.3 / §5.3.1 / §5.4 / §9.5（Blogger URL / publishedAt 為唯一真相）
  - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`（planner classification）
  - `docs/20260718-blogger-backfill-missing-sidecar-bootstrap.md`（writer manifest schema + create-only + `buildSidecarBody`）
  - `docs/20260718-blogger-backfill-truth-manifest-template.md`（generator）
  - `docs/20260719-blogger-backfill-truth-manifest-intake-validator.md`（intake validator；本工具之上游）
- Sibling tools：
  - `src/scripts/plan-blogger-backfill-sidecars.js`（planner；報告 missing）
  - `src/scripts/bootstrap-blogger-backfill-sidecars.js`（writer；create-only，dry-run + `--apply`；本工具**重用其** `buildSidecarBody`）
  - `src/scripts/prepare-blogger-backfill-truth-manifest.js`（generator；產出空 template）
  - `src/scripts/validate-blogger-backfill-truth-manifest.js`（intake validator；本工具**重用其** `validateTruthManifest` + `formatHumanReadable` + `formatJson`）
  - `src/scripts/backfill-published-url.js`（`deriveYearMonth` 之最終來源）

> ⚠️ 本工具**不含** Blogger 真值。
> Claude **不得猜** `publishedUrl` / `bloggerPostId` / `publishedAt` / `bloggerBlogId`。
> Apply-plan 的工作是：intake validator 通過後，把 exact payload、target path、operation 具體化，讓人可以「看到未來 apply 會寫入什麼」再決定是否授權；本工具**不執行** apply、**不寫任何檔案**、**不呼叫任何 Blogger API**。

---

## 1. 目的

本工具是 Blogger backfill pipeline 中：

```text
missing-sidecar planner
→ optional create-only bootstrap
→ truth-manifest template generator
→ truth-manifest intake validator
→ **本工具**：validated apply-plan gate（本 slice）
→ future writer apply（另 slice；本 slice 不執行；仍需獨立 phase + Dean explicit approval）
```

之中間「intake validator 通過後、任何 apply/write 之前」的**deterministic 唯讀 apply 規劃層**。

intake validator 只回報「manifest 通不通過 layered checks」；apply-plan gate 補足兩件事：

1. **具體化未來 apply 之寫入**：每筆 `READY_FOR_WRITE` entry 產出 `sourcePath` / `targetPath` / `operation: "create"` / **exact JSON payload**（由 `buildSidecarBody` 生成，與未來 `bootstrap --apply` 實際寫入 byte-identical modulo `bloggerPostId` 之 system-supplied 填值）。
2. **deterministic plan fingerprint**：sha256 of canonical JSON of `{planSchemaVersion, manifestSchemaVersion, entries: [{sourcePath, targetPath, operation, payload}]}`。fingerprint 為 **informational**：future authorized apply slice **若採用**，可用於驗證「reviewed plan 沒有在 review 與 apply 之間漂移」；本 slice **不**實作 apply 或 approval 之強制 fingerprint 比對。

輸入為 Dean 依 template schema 填入 Blogger 後台真值之 JSON manifest；輸出為 deterministic 之 human-readable 摘要或 `--json` envelope；exit 0 表示 manifest 通過所有 layered checks 且 plan 完整，可供 future explicit approval 使用；exit 1 覆蓋所有 fail-closed 情境。

---

## 2. 與 sibling tools 的分工

| 工具 | 角色 | 寫入 | Fingerprint |
| --- | --- | --- | --- |
| `plan:blogger-backfill-sidecars` | 現況盤點（哪些 candidate MISSING / INCOMPLETE / COMPLETE） | ❌ | ❌ |
| `prepare:blogger-backfill-truth-manifest` | 產出空 template | ❌（stdout only） | ❌ |
| `validate:blogger-backfill-truth-manifest` | 對 Dean 填入之 manifest 執行 layered checks | ❌ | ❌ |
| **`plan:blogger-backfill-truth-apply`（本工具）** | validator 通過後，產出 exact create plan + fingerprint | ❌ | ✅（informational） |
| `bootstrap:blogger-backfill-sidecars`（dry-run） | manifest → plan 之 second-layer 驗證（shape / candidate / target） | ❌ | ❌ |
| `bootstrap:blogger-backfill-sidecars --apply` | 實際建立 `.publish.json`（本 slice **不**執行） | ✅（create-only） | ❌ |

**本工具不取代 validator 或 bootstrap dry-run**：它重用 validator 之 in-process API（`validateTruthManifest`）+ bootstrap 之 `buildSidecarBody`；不 duplicate validation logic；不 duplicate payload construction。因此 validator 或 writer schema 若未來變更，本工具會 automatically inherit 而不會 drift。

---

## 3. 邊界（fail-closed）

Apply-plan gate 是純 read-only：

- 執行前後 repo 檔案 bytes / mtime 均不變；輸入 manifest bytes / mtime 亦不變。
- 唯一 output channel = stdout（human-readable 文字 或 `--json` envelope）+ stderr（診斷訊息）。
- 缺 `--manifest` 即 hard-fail exit 1；manifest 不存在 / 非一般檔 / 讀取失敗 / JSON parse 失敗 / schema 不符 → exit 1（由 validator 之 envelope layer 覆蓋）。
- 無 `--apply` / `--write` / `--output` / `--out` / `--force` / `--overwrite` / `--replace` / `--merge` / `--yes` / `-y` / `--fix` / `--commit` / `--publish` / `--deploy` 等 mutation-like flag；出現即 hard-fail（防止未來誤加）。
- 不建立 manifest；不重寫 / 格式化 / trim manifest；不寫 `.publish.json`；不 touch Markdown；不動 `dist-*`；不動 `dist-blogger-preview/`；不動 gh-pages；不動 deploy clone。
- 不呼叫 Blogger / Google API；不需網路；不需 credential。
- **不透過 `child_process` 呼叫 validator / bootstrap / planner / generator 之 CLI**；直接 import structured API。validation 與 planning 共用同一 in-process manifest snapshot（validator 之 `loadManifest()` 讀取一次；本工具**不**再 `readFile`）。
- 輸出 JSON **不含** `generatedAt` / `timestamp` / hostname / OS-dependent separator / random ID；`manifestPath` 為使用者輸入之 echo（同一路徑重跑 stdout bytes 一致）。fingerprint 完全**不含** manifest path / repo root / OS separator / 時間；同 manifest 不同 repo root 產出 identical fingerprint。

---

## 4. 使用

Human-readable（預設；stdout；含每筆 planned create 之 full JSON payload block + fingerprint + `Overall: PASS/FAIL`）：

```bash
npm run plan:blogger-backfill-truth-apply -- --manifest <path>
```

Deterministic JSON envelope（`schemaVersion` / `mode: "plan-apply"` / `writePerformed: false` / `manifest` / `summary` / `validator` / `plan.entries` / `fingerprint` / `ok` / `errors`）：

```bash
npm run plan:blogger-backfill-truth-apply -- --manifest <path> --json
```

Help（含 fail-closed 條件列表 + fingerprint informational 聲明）：

```bash
npm run plan:blogger-backfill-truth-apply -- --help
```

Guard：

```bash
npm run check:blogger-backfill-truth-apply-plan
```

Guard 覆蓋 CLI 邊界（缺 `--manifest` / 每一個 forbidden flag + `--flag=value` 形 / unknown flag / non-absolute `--repo-root`）、validator failure propagation（sentinel / missing candidate / unknown candidate / duplicate publishedUrl / URL/month mismatch / sourcePath 出 allowed prefix / source Markdown 缺 / target sidecar 已存在 / duplicate sourcePath / path traversal `../`）、happy path plan shape（`operation === "create"`、`operationsAccepted === ["create"]`、payload 完整含 canonical/ogImage/blogger/github/seo、`writePerformed === false`）、determinism（human + `--json` 各連跑兩次 stdout bytes 一致；fingerprint 同 input identical；不同 payload 產生不同 fingerprint；不同 temp root 產生 identical fingerprint）、in-process snapshot（planner 之 payload publishedUrl 等於 manifest 原始 truth）、fixture bytes / mtime 前後不變、production `.publish.json` inventory / Markdown bytes / mtime 前後不變、`dist-blogger-preview/` absent、source-level 無 `fs.writeFile` / `fs.mkdir` / `fs.rm` / `fs.rename` / `fs.unlink` / `fs.copyFile` / `fs.appendFile` / `child_process` / `fetch(` / `node:http[s]` / `googleapis` / oauth。

---

## 5. Exit behavior

- Exit 0：manifest 通過所有 validator layered checks 且 apply-plan 建構成功；`fingerprint` 已產出；plan entries 均為 `operation: "create"`。
- Exit 1：任一
  - 缺 `--manifest`
  - forbidden flag（`--apply` / `--write` / `--output` / `--out` / `--force` / `--overwrite` / `--replace` / `--merge` / `--yes` / `-y` / `--fix` / `--commit` / `--publish` / `--deploy`；及 `--flag=value` 形）
  - unknown flag
  - non-absolute `--repo-root`（guard-only flag）
  - validator layered check failure（envelope / shape / coverage / sentinel / duplicate URL / cross-field）

Exit 1 時 `fingerprint` 為 `null`，plan `entries` 為空陣列，`writePerformed` 仍為 `false`。

---

## 6. Output contract

### Human-readable（`Overall: PASS`）

```text
plan-blogger-backfill-truth-apply (planning only; no mutation performed)

manifest path:                       <path>
validator PASS:                      YES
candidate count:                     N
current MISSING_SIDECAR count:       N
manifest record count:               N
planned create count:                N
conflict count:                      0
writePerformed:                      false
plan fingerprint (sha256):           <64 hex>

---- planned creates ----
  1. content/blogger/posts/<file>.md
     → target:    content/blogger/posts/<file>.publish.json
     operation:   create
     conflicts:   (none)
     payload:
       { ... exact JSON payload (buildSidecarBody output) ... }

Planning only.
No files were created, modified, renamed, or deleted.
Production apply was not performed.
Overall: PASS
```

### Human-readable（`Overall: FAIL`）

上半段結構相同（fingerprint 顯示 `(not emitted; validation failed)`），接一段 validator 之 human-readable failure detail（重用 `formatHumanReadable(report)`，避免 error diagnostic 分岔），再以下方 footer 結束：

```text
Planning only.
No files were created, modified, renamed, or deleted.
Production apply was not performed.
Overall: FAIL
```

### JSON

```json
{
  "schemaVersion": 1,
  "mode": "plan-apply",
  "writePerformed": false,
  "manifestPath": "...",
  "manifest": { "schemaVersion": 1, "recordCount": N },
  "summary": {
    "candidateCount": N,
    "currentMissingSidecarCount": N,
    "manifestRecordCount": N,
    "plannedCreateCount": N,
    "conflictCount": 0,
    "validatorOk": true
  },
  "validator": { /* nested validator JSON envelope (same as validate:blogger-backfill-truth-manifest --json) */ },
  "plan": {
    "operationsAccepted": ["create"],
    "entries": [
      {
        "recordIndex": 0,
        "sourcePath": "content/blogger/posts/<file>.md",
        "targetPath": "content/blogger/posts/<file>.publish.json",
        "operation": "create",
        "payload": { /* buildSidecarBody output — full sidecar body */ },
        "conflicts": []
      }
    ]
  },
  "fingerprint": {
    "algorithm": "sha256",
    "encoding": "hex",
    "value": "<64 hex>"
  },
  "ok": true,
  "errors": []
}
```

`writePerformed` **恆為 `false`**。fingerprint 失敗時為 `null`。

---

## 7. Plan fingerprint 契約

Fingerprint = `sha256(canonicalJSON({planSchemaVersion, manifestSchemaVersion, entries: [{sourcePath, targetPath, operation, payload}]}))`。

**綁定**：
- `planSchemaVersion`（本工具 output 契約版本；當前 = 1）
- `manifestSchemaVersion`（manifest.schemaVersion；當前 = 1）
- 每筆 entry 之 `sourcePath` / `targetPath` / `operation` / **完整 `payload`**（含 canonical/ogImage/blogger/github/seo 全欄；由 `buildSidecarBody` 產出）
- entry 順序：預先依 sourcePath ↑ / targetPath ↑ / recordIndex ↑ 排序

**明確 NOT 綁定**：
- manifest 絕對路徑
- repo root（temp fixture root）
- 當下時間 / hostname / process ID / OS path separator / random ID
- object 之 insertion order（canonicalJSON sort keys）

**用途 / 限制**：
- Fingerprint 為 informational。本 slice **不**實作 approval token / apply-time 強制比對。
- Future authorized apply slice **若採用**，可在 apply-time 執行本工具、比對 fingerprint 與人核准時之 fingerprint；不符即 fail-closed，防止「review 與 apply 之間 manifest 或 candidate universe 漂移」。
- 若 future slice **不採用** fingerprint，本欄位仍為 read-only diagnostic，不影響 validator / writer 之現行契約。
- Fingerprint 之演算法（sha256）與序列化契約（canonical JSON with sorted keys）為 semantic 契約；`planSchemaVersion` bump 時可調整，operator 須明確知情。

---

## 8. Recommended workflow（Dean 未來 slice；本 slice 不執行）

1. 現況盤點：
   ```bash
   npm run plan:blogger-backfill-sidecars
   ```
2. 產出空 template：
   ```bash
   npm run prepare:blogger-backfill-truth-manifest -- --manifest-only > <path>
   ```
3. Dean 於**本機、非 tracked** location 逐筆填入 Blogger 後台真值。
4. Intake validator（第一層閘門）：
   ```bash
   npm run validate:blogger-backfill-truth-manifest -- --manifest <path>
   ```
   通過（exit 0 + `Overall: PASS`）前**不得**進 apply-plan gate。
5. **本工具**（第二層閘門；apply-plan gate）：
   ```bash
   npm run plan:blogger-backfill-truth-apply -- --manifest <path>
   ```
   人工審核每筆 planned create 之 exact payload 與 fingerprint。通過（exit 0 + `Overall: PASS`）前**不得** apply。
6. Bootstrap dry-run 驗證（第三層閘門；重覆驗證 shape / candidate / target；本 slice 不動）：
   ```bash
   npm run bootstrap:blogger-backfill-sidecars -- --input <path>
   ```
7. 明確授權後才 apply（本 slice **不**執行；仍需獨立 phase + explicit approval + 可選之 fingerprint 比對機制）：
   ```bash
   npm run bootstrap:blogger-backfill-sidecars -- --input <path> --apply
   ```

---

## 9. Publication truth 不得猜測

無論任何情況，apply-plan gate 都：

- **不**推導 / 猜測 `publishedUrl`
- **不**推導 / 猜測 `publishedAt`
- **不**推導 / 猜測 `bloggerPostId`（identity A.3；`buildSidecarBody` 已寫死為 `""`；本工具亦不覆寫）
- **不**推導 / 猜測 `bloggerBlogId`
- **不**從 slug、title、URL、檔案時間推導任何 Blogger identifier
- **不**在 sentinel / whitespace / 缺欄位時「填一個看似合理的值」以放行

Blogger 平台真值只能由 Dean 從 Blogger 後台複製提供（human-supplied 部分），或由未來 Blogger API integration 之 response 取得（system-supplied 部分）。

---

## 10. 未來 slice（本 slice 不做）

以下屬 future slice，各須另開 phase + Dean explicit approval：

- 對六篇正式 `20260612-*` 之 production truth 填寫（Dean human input）
- 對六篇正式 `20260612-*` 之 bootstrap `--apply`（實際建立 sidecar）
- fingerprint 於 apply 時之強制比對機制（apply-time approval + fingerprint binding）
- Blogger API credential / auth / publish / update flow
- Blogger `postId` capture after API publish / update
- 對 `PRESENT_INCOMPLETE` sidecar 之現地補值（本工具限於 create-only；不涵蓋 update workflow）
- update / delete / rename operation 之接納（本工具永固定於 `SUPPORTED_OPERATIONS = ["create"]`）
- `PRESENT_INCOMPLETE` 補值 workflow（現階段刻意排除；避免與 create-only writer 語意衝突）
- URL slug / permalink consistency 驗證
- warning-only report mode（本工具只有 hard-fail 一種模式；符合閘門定位）
- 升級 `check:blogger-backfill` warning 為 blocking

---

## 11. 硬性聲明（不可違反）

- 本文件**不含** Blogger 真值。
- Apply-plan gate **不得**建立 / 修改 / 移動 / 重新命名任何檔案。
- Apply-plan gate **不得** touch Markdown / sidecar / dist-* / gh-pages / deploy clone。
- Apply-plan gate **不得** 呼叫 Blogger / Google API；不得存取網路；不需 credential。
- Apply-plan gate **不得** fabricate 任何 truth；缺失即 hard-fail，不 fallback。
- Apply-plan gate **不得** 透過 `child_process` 呼叫 validator / bootstrap / planner / generator；四者以 in-process import 重用其 structured API。
- Apply-plan gate **不得** 由 slug / title / URL / 檔案時間推導 Blogger truth。
- Apply-plan gate **不得** 接受任何 mutation-like flag（forbidden list 見 §3 / §5）。
- Apply-plan gate 不建立第二套 sidecar path 規則：`targetPath` 直接來自 bootstrap `planBootstrap` 之 `expectedSidecarPath`。
- Apply-plan gate 不建立第二套 payload schema：`payload` 直接呼叫 bootstrap `buildSidecarBody`。
- Apply-plan gate 之 `operation` 只可為 `"create"`；`SUPPORTED_OPERATIONS` = `["create"]`。若 target 已存在或有其他 conflict，整份 plan hard-fail（不轉為 update）。
- Guard 覆蓋須維持所有 fixture assertion 在 OS temp 目錄；**不得**暫改真實 repo 檔案後再還原。
- Guard 覆蓋須維持 source-level 靜態斷言：apply-plan gate 原始碼不得含 `fs.writeFile` / `fs.mkdir` / `fs.rm` / `fs.rename` / `fs.unlink` / `fs.copyFile` / `fs.appendFile` / `child_process` / `fetch(` / `node:http[s]` / `googleapis` / oauth。
- 現行 sibling tools（`check:blogger-backfill` / `backfill:url` / `check:blogger-backfill:one-post` / `plan:blogger-backfill-sidecars` / `bootstrap:blogger-backfill-sidecars` / `prepare:blogger-backfill-truth-manifest` / `check:blogger-backfill-truth-manifest` / `validate:blogger-backfill-truth-manifest`）之定位與行為**不變**。
- 本 slice **不**升級任何 warning-only guard 為 blocking。
- 本 slice **不**觸發 build / deploy / preview / dist-* / Blogger 後台 / GA4 / AdSense / custom domain / AdSense 開啟。
- 本 slice **不**代表已取得七篇候選文章之正式 Blogger truth；apply-plan gate 之存在**不**授權任何 apply / write。
- Fingerprint 之存在**不**代表已建立 apply-time approval 機制；apply 仍須獨立 phase + explicit approval。

---

## 12. 承接關係

- Predecessor：
  - `docs/20260706-blogger-identity-and-backfill-strategy.md`
  - `docs/20260706-blogger-backfill-write-target-inventory.md`
  - `docs/20260706-blogger-backfill-report-only-baseline.md`
  - `docs/publish-json-schema.md` §5
  - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`
  - `docs/20260718-blogger-backfill-missing-sidecar-bootstrap.md`
  - `docs/20260718-blogger-backfill-truth-manifest-template.md`
  - `docs/20260719-blogger-backfill-truth-manifest-intake-validator.md`
- Sibling tools：（枚舉見 §2）
- New：
  - `src/scripts/plan-blogger-backfill-truth-apply.js`（apply-plan gate；本 slice 落地）
  - `src/scripts/check-blogger-backfill-truth-apply-plan.js`（apply-plan contract guard；本 slice 落地）
  - `package.json` scripts：`plan:blogger-backfill-truth-apply` / `check:blogger-backfill-truth-apply-plan`

本文件補足 missing-sidecar 分工線上「planner → generator → intake validator → **apply-plan gate** → writer dry-run → future apply」之閘門：以 validator 通過為前提，把「未來 apply 會寫什麼」具體化為 human-auditable exact payload + deterministic fingerprint，供人工審核與 future apply-time 之可選 fingerprint 比對使用。實際對六篇 `20260612-*` 之 production truth 填寫、bootstrap apply、apply-time approval / fingerprint binding 之實作，仍等待 Dean 明確授權，屬未來 slice。
