# Blogger backfill missing `.publish.json` sidecar bootstrap planner（2026-07-18）

Session：`260718 / add missing-sidecar bootstrap planner`

- Date：2026-07-18（Asia/Taipei）
- Type：source implementation + targeted guard + minimal docs
- 上游 policy：`docs/20260706-blogger-identity-and-backfill-strategy.md`（identity 分層 + 不猜 ID）、`docs/20260706-blogger-backfill-write-target-inventory.md`（canonical write target = `.publish.json` sidecar）、`docs/publish-json-schema.md` §5（Blogger 區塊）
- 承接工具：`check:blogger-backfill`（report-only 父 guard）、`check:blogger-backfill:one-post`（單篇 dry-run）、`backfill:url`（已知 slug 之 sidecar 現地寫入；本 slice **不動**）

> ⚠️ 本工具**不是** backfill data source，**不含** Blogger 真值。
> Claude **不得猜** `publishedUrl` / `bloggerPostId` / `publishedAt` / `bloggerBlogId`。
> 真正建立缺漏 sidecar 之 write phase 屬另一 slice，須另開 phase + Dean explicit approval。

---

## 1. 目的

`plan-blogger-backfill-sidecars` 對現行 Blogger backfill candidates 產出 deterministic、report-only 之 dry-run plan：

- 誰缺 `.publish.json` sidecar（`MISSING_SIDECAR`）；
- 誰 sidecar 已建但 human-supplied truth 尚未備妥（`PRESENT_INCOMPLETE`）；
- 誰 sidecar 已 complete（`PRESENT_COMPLETE` → `NO_ACTION_REQUIRED`）；
- 誰 sidecar 存在但 JSON 損壞（`INVALID_SIDECAR`）；
- 未來要 bootstrap sidecar 時，各篇需要哪些 truth fields、何項 human / system 分層、何項屬阻擋原因。

本工具**只**盤點與分類；**不**寫、**不**建立、**不**覆寫任何 `.publish.json`；**不**呼叫 Blogger API；**不**猜測 Blogger 真值。

---

## 2. 邊界（fail-closed）

工具是純 read-only：

- 執行前後 repo 檔案 bytes / mtime 均不變；
- 無 `--write` / `--apply` / `--force` / `--yes` / `--create-sidecar` / `--output` / `--out` / `--fix` 等寫入 / 覆蓋 flag，出現即 hard-fail；
- 不建立 `.publish.json`、不修改 Markdown、不修改任何 sidecar、不動 `dist-*`、不動 gh-pages、不動 deploy clone；
- 不呼叫 Blogger / Google API；不需網路；不需 credential。

輸出只走 stdout。JSON mode（`--json`）之輸出**不含** `generatedAt`、absolute machine path、credentials、full GA4 ID、Blogger tokens、guessed publication values。

---

## 3. Sidecar missing 與 truth missing 的差別

**sidecar missing**（`sidecarStatus: MISSING_SIDECAR`）：
- `.publish.json` 檔案不存在於同名同資料夾。
- 未來要 bootstrap 該檔本身，先要 Dean 提供 human-supplied truth。

**truth missing**（`sidecarStatus: PRESENT_INCOMPLETE`）：
- `.publish.json` 已存在，但至少一項 human-supplied truth field 為空 / 空白。
- 未來 slice 可循 `backfill:url` 之現地寫入路徑補值（該路徑本身仍屬 Dean-gated）。

**invalid sidecar**（`sidecarStatus: INVALID_SIDECAR`）：
- `.publish.json` 存在但 JSON 解析失敗。
- 未來 slice **不得**用 planner 或任何自動化 fix，須人工檢視與修復。

---

## 4. Truth field 分層（依 `docs/20260706-blogger-identity-and-backfill-strategy.md` §A）

| Field | Role | 說明 |
| --- | --- | --- |
| `blogger.publishedUrl` | human-supplied（A.1） | Dean 從 Blogger 後台複製 |
| `blogger.publishedAt` | human-supplied（A.1） | Dean 從 Blogger 後台複製；strict ISO-8601 |
| `blogger.bloggerPostId` | system-supplied（A.3） | 未來 Blogger API flow 於 publish/update response 取得；**非**人工 backfill |

`bloggerBlogId` 屬站台級設定、**非**逐篇 sidecar truth，本 planner **不**逐篇列 required。

readiness 判斷只針對 human-supplied 缺失或 sidecar missing / invalid；system-supplied 缺失（如 `bloggerPostId`）屬 informational，**不**單獨阻擋 readiness。

---

## 5. 輸出分類（fixed enum）

**sidecarStatus**：

- `MISSING_SIDECAR`
- `PRESENT_INCOMPLETE`
- `PRESENT_COMPLETE`
- `INVALID_SIDECAR`

**readiness**：

- `BLOCKED`（任一 human-supplied truth 缺、sidecar missing 或 invalid）
- `READY_FOR_FUTURE_BOOTSTRAP`（保留列舉；本 slice 永不產生）
- `NO_ACTION_REQUIRED`（sidecar 存在且 human-supplied truth 已備妥）
- `INVALID_SOURCE`（Markdown / frontmatter 解析失敗；或 candidate slug 重複）

每個 candidate 至少輸出以下欄位：`sourcePath` / `slug` / `expectedSidecarPath` / `sidecarStatus` / `requiredTruthFields` / `knownTruthFields` / `missingTruthFields` / `readiness` / `blockingReasons` / `suggestedNextHumanAction`。

---

## 6. 執行方式

Human-readable（預設）：

```bash
npm run plan:blogger-backfill-sidecars
```

JSON（stdout）：

```bash
npm run plan:blogger-backfill-sidecars -- --json
```

Help（含 no-write 聲明）：

```bash
npm run plan:blogger-backfill-sidecars -- --help
```

Guard：

```bash
npm run check:blogger-backfill-sidecar-plan
```

Guard 覆蓋 classification、determinism、JSON contract、help、no-write（fixture bytes / mtime / entry list 執行前後不變）、real-repo smoke（human + JSON mode 執行後 production `.publish.json` inventory 未變）、forbidden write flag hard-fail、source-level 無 write API / 無 child_process / 無 network / 無 Blogger API import 之靜態斷言。

---

## 7. Exit behavior

- Exit 0：normal completion（含 all candidates BLOCKED）；
- Exit 1：malformed source、重複 candidate slug、invalid CLI 使用（unknown flag / non-absolute `--content-root` / forbidden write flag）、internal invariant failure。

publication truth 尚未提供本身**不**當作 command failure（planner 之工作即為報告缺口）。

---

## 8. Candidate discovery（不硬編碼、以 repo 現況為準）

Candidate rule 與 `check:blogger-backfill` 語意一致：

- 掃 `content/blogger/posts/**/*.md`（排除 `*.fb.md`）；
- frontmatter 滿足 `publishTargets.blogger.enabled === true` AND `status ∈ [ready, published]` AND `draft !== true`。

**不**硬編碼七篇檔名清單；**不**依 docs 手動清單；**不**掃描所有 content 後把每篇都當 candidate。current candidates 只應以實際掃描結果為準。

---

## 9. Publication truth 不得猜測

無論任何情況，planner 都：

- **不**推導 / 猜測 `publishedUrl`（不由 slug / permalink / date 組出）；
- **不**推導 / 猜測 `publishedAt`（不 fallback 至當下時間）；
- **不**推導 / 猜測 `bloggerPostId`（Blogger 內部 ID，Dean 從後台介面**無法**直接取得，屬 A.3 system-supplied，非人工 backfill；未來 API flow 落地後由 response 取得）；
- **不**推導 / 猜測 `bloggerBlogId`。

Blogger 平台真值只能由 Dean 從 Blogger 後台複製提供（human-supplied 部分），或由未來 Blogger API integration 之 response 取得（system-supplied 部分）。

---

## 10. 未來 write path（本 slice 不做）

以下屬 future slice，各須另開 phase + Dean explicit approval：

- 建立缺漏 sidecar 之 write path（bootstrap writer）；
- 對 `PRESENT_INCOMPLETE` sidecar 補入 human-supplied truth 之現地寫入（可能透過已有之 `backfill:url` 或新工具）；
- Blogger API credential / auth / publish / update flow；
- Blogger `postId` capture after API publish / update（系統自動取得並寫入 A.3 欄位）。

未來 write path 仍需具備：

- diff review；
- atomic write（`.tmp` → `rename`）；
- rollback；
- explicit authorization（env gate + exact confirmation phrase + `--expected-source-sha`；無 force bypass）；
- no overwrite（除非顯式 `--force`）；
- existing sidecar protection。

---

## 11. 硬性聲明（不可違反）

- 本文件**不含** Blogger 真值。
- Planner **不得**新增任何 `.publish.json`。
- Planner **不得**修改任何 `.publish.json`。
- Planner **不得**猜測任何 Blogger 平台真值。
- Planner **不得**呼叫 Blogger / Google API。
- Guard 覆蓋須維持 source-level 靜態斷言（planner 原始碼不得含 fs.writeFile / mkdir / rm / rename / unlink / copyFile / child_process / fetch / Blogger API 相關 module）。
- `bloggerPostId` **不得**列為 Dean 人工 backfill 必填。
- 現行 `check:blogger-backfill` / `backfill:url` / `check:blogger-backfill:one-post` 之定位與行為**不變**。
- 本 slice **不**升級任何 warning-only guard 為 blocking。

---

## 12. 承接關係

- Predecessor：
  - `docs/20260706-blogger-identity-and-backfill-strategy.md`
  - `docs/20260706-blogger-backfill-write-target-inventory.md`
  - `docs/20260706-blogger-backfill-report-only-baseline.md`
  - `docs/20260706-blogger-backfill-value-intake-template.md`
  - `docs/publish-json-schema.md` §5
- Sibling tools：
  - `src/scripts/check-blogger-backfill.js`（report-only 父 guard）
  - `src/scripts/check-blogger-backfill-one-post.js`（單篇 dry-run）
  - `src/scripts/backfill-published-url.js`（現地 sidecar 寫入 CLI；本 slice 不動）
- New：
  - `src/scripts/plan-blogger-backfill-sidecars.js`（planner）
  - `src/scripts/check-blogger-backfill-sidecar-plan.js`（guard）
  - `package.json` scripts：`plan:blogger-backfill-sidecars` / `check:blogger-backfill-sidecar-plan`

本文件補足既有 backfill 系列未落地之一件事：**pre-write 之 deterministic missing-sidecar plan**，且明確指出「plan 本身不寫、不建立、不覆寫任何 sidecar」。
