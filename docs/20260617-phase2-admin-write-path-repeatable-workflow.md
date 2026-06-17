# Phase 2 ADMIN Write-Path — Repeatable Write Workflow（SOP，docs-only）

> Phase: `20260617-pm-phase2-admin-write-path-repeatable-workflow-docs-only-a`
> Date: 2026-06-17（Asia/Taipei）
> Type: **docs-only SOP**。唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages / `.cache` / CLAUDE.md / MEMORY.md。
> Purpose: 把**第一次受控 actual production write 成功並通過 acceptance** 的模式，固化成可重複的 standard operating procedure（SOP），供未來每一次受控寫入逐 stage 對照。
>
> ⚠️ 本 SOP **不**核准任何未來寫入、**不**啟用 write-path、**不**啟用 Admin Apply、**不**啟用 middleware / API、**不** build / deploy / Blogger repost。每一次 actual write 仍須 fresh explicit approval（per §4 / §12）。

---

## 1. Baseline and purpose

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| pre-phase HEAD | `5c8646d`（full `5c8646db682107ebda9a12933ce179e82644b727`） |
| origin/main | `5c8646d` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject（pre-phase） | `docs(admin): record first controlled actual write` |

→ 符合 frozen baseline `5c8646d`。未 pull / merge / reset / rebase / amend / force-push。

**已確立事實（accepted facts）：**

- 第一次受控 actual production write **已被接受（accepted，verdict PASS）**。
- commit `5c8646d` scope 恰為兩檔：
  1. `content/blogger/posts/20260504-sample-book-review.md`（單欄 `description`，+1/−1）
  2. `docs/20260617-phase2-admin-write-path-actual-write-execution-record.md`（execution record，+208）
- git diff 僅改 `description` frontmatter 欄位（句尾 additive `（dry-run 預覽測試）`）。
- `validate:content` = **0 errors / 94 warnings / 84 posts**（no regression；production-post warnings = 0）。
- 無 build / deploy / repost；middleware / API / Admin Apply remain disabled。
- 無 source / package / dist 變更；無 bulk / glob / folder write；無其他 production content 變動。
- real-write 仍 **terminal-only**（`admin-write-cli.js` `--apply` + `dryRun:false`）。

**purpose：** 本 doc 是 **repeatable SOP，不是 another write**。它把上述成功路徑固化成逐 stage 規範，使未來每次寫入都有對照清單、降低人為越界，**而本 session 本身不執行任何寫入**。

---

## 2. Workflow stages（Stage 0 → Stage 8）

| Stage | 名稱 | 一句話 |
| --- | --- | --- |
| 0 | candidate intake（readonly） | 接收候選寫入目標與意圖，不碰檔。 |
| 1 | target suitability（readonly） | 確認 target 適合（draft / non-live / 單檔單欄可行）。 |
| 2 | dry-run plan / review（readonly / docs-only） | 規劃 dry-run，記錄 target/field/old/new。 |
| 3 | production dry-run execution | 跑 `--payload` 無 `--apply`、`dryRun:true`，磁碟零變動。 |
| 4 | actual-write safety plan（docs-only） | 訂定 precondition / rollback / validation gate。 |
| 5 | approval-check（readonly） | 逐項核對 gate 狀態 + 取得 Dean explicit actual-write approval。 |
| 6 | actual write execution | 帶 `--apply` + `dryRun:false`，單檔單欄一值真實改寫。 |
| 7 | acceptance（readonly） | 驗 commit scope / diff / validation / guardrail，給 PASS/FAIL。 |
| 8 | idle freeze | 收尾凍結，不主動推進下一寫入。 |

> 對照 lineage（已實證一輪）：preanalysis → design acceptance → fixture-only dry-run proof（209/0）→ production dry-run plan → target intake → production-target dry-run（Stage 3，PASS）→ actual-write safety plan（Stage 4）→ approval-check（Stage 5，gates PASS）→ actual write execution（Stage 6，`5c8646d`）→ acceptance（Stage 7，PASS）→ **本 SOP（固化）**。

---

## 3. Per-stage allowed / forbidden actions

> 圖例：**mutation** = 是否允許改檔；**command** = 是否允許執行命令；**docs** = 是否允許新增 docs。

### Stage 0 — candidate intake（readonly）
- **Allowed：** 接收 Dean 提供之候選 targetRel / field / 意圖；read-only 檢視該檔現況（`git show` / Read）。
- **Forbidden：** 改任何檔；跑 `admin-write-cli.js` / dry-run / validate / build。
- mutation：❌ ｜ command：僅 read-only git/Read ｜ docs：選擇性（intake note 可，docs-only）

### Stage 1 — target suitability（readonly）
- **Allowed：** 確認 `status: draft`、無 `blogger.publishedUrl` / `publishedAt` / `bloggerPostId`、欄位為 inline scalar、單檔單欄可行、在 `ALLOWED_FIELDS`（`description` / `searchDescription`）內。
- **Forbidden：** 改檔；任何寫入或 dry-run。
- mutation：❌ ｜ command：read-only ｜ docs：選擇性（suitability note）

### Stage 2 — dry-run plan / review（readonly / docs-only）
- **Allowed：** 逐字記錄 targetRel / field / expectedOldValue / newValue；新增 dry-run plan doc。
- **Forbidden：** 跑 dry-run；改 content。
- mutation：僅 docs ｜ command：read-only ｜ docs：✅

### Stage 3 — production dry-run execution
- **Allowed：** 跑 `node src/scripts/admin-write-cli.js --payload=<temp-outside-repo>`（**無** `--apply`，payload `dryRun:true`）；擷取 stdout JSON / stderr / exit code；確認 `written:false`、production 磁碟零變動。
- **Forbidden：** `--apply`；`dryRun:false`；任何真實改寫；commit。
- mutation：❌（磁碟零變動）｜ command：CLI dry-run only ｜ docs：execution record（docs-only）

### Stage 4 — actual-write safety plan（docs-only）
- **Allowed：** 訂定 precondition / backup-restore / command policy / validation gate / stop conditions；新增 safety-plan doc。
- **Forbidden：** 任何 actual write；`--apply`；`dryRun:false`；改 content。
- mutation：僅 docs ｜ command：read-only ｜ docs：✅

### Stage 5 — approval-check（readonly）
- **Allowed：** read-only 逐項核對 §4 全 precondition；記錄 Dean **explicit actual-write approval wording**（含逐字 targetRel / field / expectedOldValue / newValue / 允許 `--apply` / 允許 `dryRun:false`）。
- **Forbidden：** 寫入；dry-run；改檔。dry-run approval **不等於** write approval。
- mutation：❌ ｜ command：read-only ｜ docs：選擇性（approval-check note）

### Stage 6 — actual write execution
- **Allowed：**（**僅在 Stage 5 取得 explicit approval 後**）建 repo 外 temp payload（`dryRun:false`）→ 跑 `node src/scripts/admin-write-cli.js --apply --payload=<temp>` → 擷取輸出 → 跑 `validate:content` → diff 核對 → commit（message 標示 admin write + field）→ push → 刪 temp payload → 新增 execution record。
- **Forbidden：** bulk / glob / multi-field / multi-file；build / deploy / repost；啟用 middleware / API / Admin Apply；amend / rebase / force-push。
- mutation：✅（單檔單欄 + 1 docs record）｜ command：CLI apply + validate + git commit/push ｜ docs：execution record

### Stage 7 — acceptance（readonly）
- **Allowed：** read-only 驗 commit scope（exact files / insertions / deletions）、diff（僅 target field）、validation（carried result）、guardrail；給 PASS / FAIL。
- **Forbidden：** 改檔；rerun validation（除非該 phase 明確要求 regression check）；任何寫入。
- mutation：❌ ｜ command：read-only ｜ docs：選擇性（acceptance note 或併入下一 record）

### Stage 8 — idle freeze
- **Allowed：** 收尾；working tree 維持 clean；等待下一次 fresh approval。
- **Forbidden：** 主動推進下一寫入 / UI 整合 / middleware；任何 mutation。
- mutation：❌ ｜ command：read-only ｜ docs：❌

---

## 4. Required approval boundaries

- **dry-run approval is NOT write approval** —— Stage 3 dry-run 之核准，**不**構成 actual write 之核准。
- **actual-write approval must be separate and explicit** —— actual write 須 Dean 於 Stage 5 **另行明示**核准。
- **exact values required** —— approval 須含逐字 `targetRel` / `field` / `expectedOldValue` / `newValue`。
- **`--apply` and `dryRun:false` require explicit approval** —— 此二者須 Dean 明示同意才可使用。
- **one-file / one-field / one-value only** —— 每次核准僅涵蓋一檔、一欄、一值；無 bulk / glob。
- **status 限制** —— 首批 real-write target 須 `status: draft`；`ready` / `published` 須各自獨立 phase + Dean explicit approval。

---

## 5. Command policy

- **temp payload outside repo or git-ignored** —— payload JSON 建於 OS temp（repo 外，如 `C:\Users\…\AppData\Local\Temp\admin-write-payload-XXXXXX.json`；git-bash `/tmp/…`，以 `cygpath -w` 轉 Windows 路徑）或 git-ignored 路徑；**不**進 repo、**不** commit。
- **dry-run command** —— `node src/scripts/admin-write-cli.js --payload=<temp>`，**無** `--apply`，payload `dryRun:true`。
- **actual-write command（僅 approval 後）** —— `node src/scripts/admin-write-cli.js --apply --payload=<temp>`，payload `dryRun:false`。
- **paired flags** —— `--apply` 與 `dryRun:false` 須成對；缺一 CLI reject（`--apply` alone → `apply-requires-dryRun-false`；`dryRun:false` alone → `dryRun-false-requires-apply`，exit 2）。
- **temp payload cleanup** —— 命令執行後即刪除 temp payload。
- **capture output** —— 擷取 stdout JSON（`mode` / `written` / `changed` / `diffSummary` / `bytesDelta` / `field` / `status`）+ stderr lines + exit code。
- **stop on anomaly** —— 任一 `ok:false` / warning / 非預期輸出 → 立即停止該 phase。

---

## 6. Validation and rollback policy

- **validate after write, before commit** —— actual write 後、commit 前須跑 `npm run validate:content`（= `node src/scripts/validate-content.js`），須無 regression（對照 CLAUDE.md §3a baseline：production-post warnings = 0）。
- **if validation fails → `git restore` target, no commit** —— validation 失敗：`git restore -- <targetRel>` 還原 target，**不** commit，回報。
- **if diff unexpected → `git restore` target, no commit** —— diff 旁及 target field 以外任何內容：`git restore -- <targetRel>`，**不** commit，回報。
- **if already committed and rollback needed → revert commit** —— 已 commit 後需回退：用正常 `git revert <sha>`，**不** `git reset --hard`、**不** force-push、**不** amend / rebase。
- **no build / deploy / repost coupling** —— write-path 與 build / deploy / Blogger repost 完全解耦；validation / rollback 流程不觸發其一。
- restore point = pre-write clean tree @ pre-write HEAD（每次寫前逐字記錄 HEAD full hash + current field value）。

---

## 7. Diff acceptance policy

actual write 後（Stage 7）之 diff 須逐項符合：

- **exact file list** —— 僅預期之檔（1 content `.md` + 1 docs record；無第三檔）。
- **exact field hunk** —— `git diff` 僅顯示指定欄位之單行 hunk。
- **no body changes** —— 正文零變動。
- **no publish metadata changes** —— `blogger.publishedUrl` / `publishedAt` / `bloggerPostId` / `publishTargets` 等零變動。
- **no status changes** —— `status` / `draft` 零變動。
- **no other production content changes** —— 無其他 production content 被改。
- **no source / package changes** —— 無 source / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` 變動。

---

## 8. Docs record policy

- **when to create** —— Stage 3（dry-run）與 Stage 6（actual write）各須一份 execution record；Stage 2 / Stage 4 為 plan doc；Stage 7 可獨立 acceptance note 或併入下一 record。
- **record must include** —— baseline、Dean approval boundary、exact target/field/old/new、command shape、stdout/stderr/exit code、git diff summary、validation result、confirmations、rollback note、what-it-proves / does-not-prove、acceptance table、cross-links。
- **separately authorized** —— 每份 record 僅記錄**已被授權**之單次動作；不預先記錄未核准之未來寫入為「已發生」。
- **no over-claim** —— record **不**宣稱 Admin Apply / middleware / API 已啟用、**不**宣稱 ready/published 可寫、**不**改寫 Phase 1 history。

---

## 9. Current proven baseline

| 項目 | 狀態 |
| --- | --- |
| fixture-only proof（`safe-write:test`） | ✅ **209 pass / 0 fail / exit 0** |
| production-target dry-run | ✅ **PASS**（`written:false`，磁碟零變動） |
| first actual write | ✅ **PASS**（`5c8646d`，單欄 `description`，+26 bytes） |
| first acceptance | ✅ **PASS**（commit scope / diff / validation / guardrail 全符） |
| real-write 路徑 | **terminal-only**（`admin-write-cli.js` `--apply` + `dryRun:false`） |
| middleware / API / Admin Apply | **disabled** |
| validate:content baseline | **0 errors / 94 warnings / 84 posts**（production warnings = 0） |

---

## 10. Red lines

- ❌ **no Admin Apply activation** —— browser → Node fs 通道維持關閉（FB sidecar Apply 永久 disabled）。
- ❌ **no middleware / API server** —— `vite.config.js` 無 `configureServer` / `app.post` / `fs.writeFile`。
- ❌ **no browser-to-filesystem write path** —— 不啟用。
- ❌ **no bulk writes** —— 禁 glob / folder / multi-file / multi-field。
- ❌ **no writes to ready / published / live posts** —— 在另行設計前，僅對 `status: draft` 寫；ready/published 須各自獨立 phase + explicit approval。
- ❌ **no build / deploy / repost coupling** —— write-path 與 build / deploy / Blogger repost 完全解耦。
- ❌ **no package / dependency changes without separate phase** —— 不動 `package.json` / lockfile / 不 `npm install`，除非另開 phase。

---

## 11. Recommended next phase after SOP

- **Conservative（建議）：**
  `20260617-pm-phase2-admin-write-path-second-write-candidate-intake-readonly-a`
  —— read-only 接收第二個受控寫入候選，沿用本 SOP Stage 0–1，**不**寫入。
- **Alternative：**
  `20260617-pm-phase2-admin-write-path-admin-ui-integration-preanalysis-docs-only-a`
  —— docs-only 預分析 Admin UI 整合。

→ 建議**先 second write candidate intake readonly，再談 UI integration**：先以同一 SOP 多驗證一次受控寫入路徑（仍 read-only intake → 各 stage 逐次 approval），確立模式穩定後，才評估 UI 整合（後者較接近 middleware / Apply red line，順序上應後置）。

---

## 12. Guardrails

- This SOP **does not approve future writes** —— 本 SOP 不核准任何未來寫入。
- Each write still needs fresh explicit approval —— 每次寫入仍須 Dean 重新明示核准（per §4）。
- This doc **does not enable Admin Apply or middleware** —— 不啟用 Admin Apply / middleware / API。
- This doc **must not alter Phase 1 history** —— 不改寫 / 不降級 Phase 1 final history。

並沿用本 session hard rules：docs-only（唯一 mutation = 本 doc）；no new write；no `admin-write-cli.js` 執行；no `safe-write:test`；no production dry-run；no `--apply`；no `dryRun:false`；no production content write；no build / deploy / Blogger repost；不啟用 middleware / API / Admin Apply；不跑 validate / guard；不改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / CLAUDE.md / MEMORY.md；no amend / rebase / force-push。

---

## 13. Cross-links

- `docs/20260617-phase2-admin-write-path-preanalysis.md`（Phase 2 入口 preanalysis）
- `docs/20260617-phase2-admin-write-path-design-acceptance.md`（保守 A→B 漸進 design acceptance）
- `docs/20260617-phase2-admin-write-path-fixture-dry-run-proof.md`（fixture-only proof，209/0；Stage 3 雛形）
- `docs/20260617-phase2-admin-write-path-production-dry-run-plan.md`（production-target dry-run plan）
- `docs/20260617-phase2-admin-write-path-production-dry-run-execution-record.md`（Stage 3 production-target dry-run，PASS）
- `docs/20260617-phase2-admin-write-path-actual-write-safety-plan.md`（Stage 4 safety plan）
- `docs/20260617-phase2-admin-write-path-actual-write-execution-record.md`（Stage 6 first actual write，`5c8646d`）
- `docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md`（CLI write driver / payload schema / exit codes）
- `CLAUDE.md` §8 / §27 / §28 / §29

---

## 14. Acceptance（本 phase 自身）

| 項目 | 結果 |
| --- | --- |
| baseline verify（branch / HEAD / origin / ahead-behind / clean） | ✅ `main` / `5c8646d` / 0-0 / clean |
| 唯一 file change | `docs/20260617-phase2-admin-write-path-repeatable-workflow.md`（新增） |
| 未改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` | ✅ |
| 未改 CLAUDE.md / MEMORY.md | ✅ |
| no new write / no `admin-write-cli.js` 執行 / no `--apply` / no `dryRun:false` | ✅ |
| no production dry-run / no `safe-write:test` / no production content touched | ✅ |
| no validate / guard / build / deploy / repost | ✅ |
| middleware / API / Admin Apply remain disabled | ✅ |
| no amend / rebase / force-push | ✅ |

→ docs-only SOP，acceptance trivially PASS。

---

（本文件結束）
