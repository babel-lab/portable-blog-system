# Phase 2 ADMIN Write-Path — Actual-Write Safety Plan（docs-only）

> Phase: `20260617-pm-phase2-admin-write-path-actual-write-safety-plan-docs-only-a`
> Date: 2026-06-17（Asia/Taipei）
> Type: **docs-only safety plan**。唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages / `.cache` / CLAUDE.md / MEMORY.md。
> Scope: 訂定「**未來真正寫入 production content 之前**」必須滿足的安全規則、流程、rollback、validation gate。**本 session 不執行 actual write、不跑 `admin:write`、不跑 `admin-write-cli.js`、不跑 dry-run、不改 content。**
>
> ⚠️ 本文件**不是**實作核可，也**不**啟用 write-path、**不**啟用 Admin Apply、**不**啟用 middleware / API。它只是 plan。任何 actual write 仍須由 Dean 於 §12 推薦之 next phase（且仍須 explicit approval）才可能發生。既有 write-path infra 維持 **dormant**。

---

## 1. Baseline

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| pre-phase HEAD | `6b02e7a`（full `6b02e7a8b411a4e745f12a96eac967273de4712c`） |
| origin/main | `6b02e7a` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject（pre-phase） | `docs(admin): record production write dry-run` |

→ 完全符合 frozen baseline `6b02e7a`。未 pull / merge / reset / rebase / amend / force-push。

### 1.1 Prior proof chain（carry-forward；本 phase 不重跑）

| 步驟 | 證據 | 結果 |
| --- | --- | --- |
| Step 3 — fixture-only proof | `docs/20260617-phase2-admin-write-path-fixture-dry-run-proof.md`（`npm run safe-write:test`，OS-temp fixtures，cleanup 完成） | **209 pass / 0 fail / exit 0** |
| Step 4 — production-target dry-run | `docs/20260617-phase2-admin-write-path-production-dry-run-execution-record.md`（`node src/scripts/admin-write-cli.js --payload=<temp>`，無 `--apply`，`dryRun:true`） | **PASS**：exit 0 / `ok:true` / `mode:dry-run` / `written:false` / `changed:true`；production content 磁碟零變動 |

→ **截至本 phase，尚未發生任何一次 production content actual write。**

### 1.2 Lineage

preanalysis → design acceptance（保守 A→B 漸進）→ fixture-only dry-run proof（Step 3，209/0）→ production dry-run plan（docs-only）→ target intake readonly → production-target dry-run execution（Step 4，diff only）→ **本 doc（actual-write safety plan，docs-only；Step 5 之 plan，尚不執行 Step 5）**。

---

## 2. Purpose

- 訂定「未來真正 actual production write 前」必須滿足之安全規則、流程、rollback、validation gate。
- 本 doc **是 plan**：
  - ❌ **不是** actual write。
  - ❌ **不是** Admin Apply。
  - ❌ **不是** middleware / API。
  - ❌ **不是** build / deploy / Blogger repost。
- 本 doc 不授權執行；任何 actual write 須由 Dean 於 §12 推薦之 next phase 另行 explicit approve。

---

## 3. Definition of actual production write

「actual production write」嚴格定義為：

1. **a real file mutation to one production markdown file** —— 對單一 production `.md` 之真實檔案改寫（`fs.writeFile` / atomic tmp+rename 落地）。
2. **must use explicit `--apply` plus `dryRun:false`** —— 須**同時**帶 `--apply` flag **且** payload `dryRun:false`（缺一即被 CLI reject）。
3. **must be one file / one field / one value** —— 一次僅一檔、一欄、一值。
4. **must be followed by validation and human review** —— 寫後須跑 validation 並由 Dean 人工 review diff。
5. **must not trigger publish / repost / deploy** —— 不得觸發任何 publish / Blogger repost / deploy。

**Factual grounding（read-only 查證，CLI 既有行為）**：`admin-write-cli.js` real-write path 之啟動條件為 `wantsRealWrite = applyFlag === true && payload.dryRun === false`；`--apply` alone → reject `apply-requires-dryRun-false`（exit 2）；`dryRun:false` alone → reject `dryRun-false-requires-apply`（exit 2）；real-write 另收窄 status 至 `{'draft'}`、寫前 re-check whitelist（TOCTOU defense）、委派 `safeWrite`（atomic tmp+rename，`enforceCleanGit:true`）；patcher `changed === false` → no-op skip（`written:false`）。CLI **不**自動 `git add` / `commit` / `push`，**不**自動 build / deploy / repost。

---

## 4. Absolute preconditions before any actual write

actual write 前須**同時**滿足以下全部（缺一不寫）：

1. **Dean explicit approval for actual write** —— Dean 明示核准「actual write」，**非僅** dry-run 之核准。
2. **exact `targetRel`** —— 精確相對路徑（單一檔）。
3. **exact field** —— 精確欄位名（首批 `description` 或 `searchDescription` = CLI `ALLOWED_FIELDS`）。
4. **exact `expectedOldValue`** —— 逐字複製自 current frontmatter（CLI mismatch → exit 6）。
5. **exact `newValue`** —— 欲提案之新值。
6. **previous dry-run PASS for the same target/value** —— 同一 target / 同一 value 之 dry-run 先前已 PASS。
7. **clean working tree** —— pre-write `git status` 須 clean（git 即 restore point；dirty 拒寫）。
8. **HEAD == origin/main** —— baseline 一致。
9. **no pending local changes** —— 無未提交本地變更。
10. **target status must be `draft` for first real-write** —— 首次 real-write 之 target 須 `status: draft`（CLI real-write status set = `{'draft'}`）。
11. **target must be non-live / not Blogger-published** —— target 非已上線、非 Blogger 已發布（無 `blogger.publishedUrl` 等 live URL 牽連）。
12. **one-file / one-field only** —— 一檔一欄。
13. **no bulk / glob writes** —— 禁批次 / glob / 資料夾層級寫入。

---

## 5. Backup / restore policy

- **capture pre-write HEAD** —— 寫前記錄 HEAD（full hash），作為 lineage 與 restore 依據。
- **before write, capture `git status`** —— 寫前擷取 `git status --short --branch`（須 clean）。
- **before write, capture exact current field value** —— 寫前逐字記下 target 欄位之 current value（即 `expectedOldValue`）。
- **rollback option（未 commit 時）**：

  ```
  git restore -- <targetRel>
  ```

  → working-tree-level restore，把單一 target 還原為 HEAD 版本。
- **if committed and rollback needed** —— 若已 commit 後才需回退：使用**正常 revert commit**（`git revert <sha>`），**不**用 `git reset --hard` / **不** force-push。
- **no amend / rebase / force-push** —— 任何 rollback / 修正皆不得 amend / rebase / force-push。

---

## 6. Command policy for future actual write

> ⚠️ **本 docs phase 只記錄 policy，不執行、不附實跑輸出、不準備可執行 payload。**

- **command may be prepared only in a later execution phase** —— actual-write command 僅能於**後續 execution phase** 準備；本 doc 不準備。
- **include `--apply`** —— actual-write command 須含 `--apply` flag。
- **`dryRun:false`** —— payload `dryRun` 須為 `false`（與 `--apply` 成對；缺一即 reject）。
- **target/value must exactly match previously approved dry-run pair** —— target / field / `expectedOldValue` / `newValue` 須與先前已核可且 dry-run PASS 之組合**逐字相符**。
- **temp payload should be outside repo or git-ignored** —— payload 檔須建於 repo 外（OS temp）或 git-ignored 路徑，**不**進 repo、**不** commit。
- **be deleted after execution** —— payload 執行後即刪除。
- **command output must be captured** —— 須擷取 stdout JSON（`mode` / `written` / `changed` / `diffSummary` / `bytesDelta` / `field` / `status`）與 stderr lines。
- **any `ok:false` / warning / unexpected output stops the phase** —— 任一 `ok:false` / warning / 非預期輸出 → 立即停止該 phase。

### 6.1 Command form（後續 execution phase 用；本 session 不執行）

```
node src/scripts/admin-write-cli.js --apply --payload=<temp-payload-outside-repo>
```

```jsonc
// payload（後續 execution phase 由 Dean 提供值；actual write 固定 dryRun:false）
{
  "targetRel": "content/blogger/posts/<approved-draft-post>.md",
  "field": "description",                 // or "searchDescription"
  "expectedOldValue": "<copied-verbatim-from-current-frontmatter>",
  "newValue": "<Dean-approved>",
  "dryRun": false
}
```

→ 上述 command / payload form 僅供未來 phase 參考；本 doc **不**示範執行、**不**附實跑輸出、**不**建立此 payload 檔。

---

## 7. Required validation after actual write

actual write 之後、commit 之前須逐項核對：

- **git status must show exactly one intended content markdown changed** —— `git status` 僅顯示一個預期之 content `.md` 被改，無旁及其他檔。
- **git diff must show only the intended field changed** —— `git diff` 僅顯示指定欄位之值變動，無旁及其他欄位 / body / 其他 frontmatter key。
- **run `validate:content` after write and before commit** —— 執行 `npm run validate:content`（= `node src/scripts/validate-content.js`），須不退步（對照 CLAUDE.md §3a baseline：production-post warnings = 0）。
- **if `validate:content` fails, do not commit; restore target and report** —— 若 validation 失敗：**不** commit，以 `git restore -- <targetRel>` 還原 target，並回報。
- **no build / deploy / repost during actual-write phase** —— actual-write phase 全程不 build / deploy / Blogger repost。
- **optional later phase may build/deploy only after separate approval** —— build / deploy 僅能於**另一個** phase、且 separate approval 後才可能發生。

---

## 8. Commit policy

- **commit only after：**
  - **diff reviewed** —— Dean 已 review `git diff`。
  - **`validate:content` passes** —— validation 通過。
  - **Dean approval to commit or pre-approved commit boundary exists** —— Dean 核准 commit，或已存在 pre-approved 之 commit boundary。
- **commit message should clearly state admin write and target field** —— commit message 須明確標示 admin write 與 target field（例如 `chore(admin): write <field> on <targetRel> via admin-write-cli`）。
- **push only after commit is verified** —— commit 經驗證後才 push。
- **no amend / rebase / force-push** —— 不 amend / rebase / force-push。

---

## 9. Stop conditions

下列任一情況**立即停止**並回報，不繼續：

- **baseline mismatch** —— HEAD ≠ origin/main、branch 非 main、或 ahead/behind ≠ 0/0。
- **dirty tree** —— working tree 非 clean。
- **target not draft** —— target `status` 非 `draft`（首次 real-write）。
- **target has Blogger published metadata** —— target 含 `blogger.publishedUrl` / `publishedAt` / `bloggerPostId` 等發布 metadata。
- **`expectedOldValue` mismatch** —— 與 current frontmatter 不符（exit 6）。
- **dry-run pair not previously proven** —— 該 target/value 組合先前未經 dry-run PASS。
- **command lacks `--apply` or lacks `dryRun:false` in actual-write phase** —— actual-write phase 之 command 缺 `--apply` 或缺 `dryRun:false`（CLI 會 reject；但須在送出前即停）。
- **diff touches anything outside target field** —— diff 旁及 target field 以外之任何內容。
- **`validate:content` fails** —— 寫後 validation 失敗。
- **any content / status / publish metadata changes unexpectedly** —— 任何 content / status / publish metadata 非預期變動。
- **any build / deploy / repost trigger appears** —— 出現任何 build / deploy / repost 觸發。
- **any warning / error appears** —— 出現任何 warning / error。

---

## 10. What remains disabled

actual-write phase **不**啟用、維持 disabled / dormant：

- **middleware / API** —— `vite.config.js` 無 `configureServer` / `app.post` / `fs.writeFile`；維持 closed。
- **Admin Apply** —— browser → Node fs 通道維持關閉（FB sidecar Apply 永久 disabled）。
- **browser-to-filesystem write path** —— 不啟用。
- **build / deploy / repost coupling** —— write-path 與 build / deploy / Blogger repost 完全解耦；CLI 不 spawn 之。
- **bulk writes** —— 不啟用批次 / glob 寫入。
- **production write to published / ready posts** —— 不對 `published` / `ready` 文章寫入（首批僅 draft；ready/published 須各自獨立 phase + Dean explicit approval）。

---

## 11. First actual-write candidate, if later approved

若未來 Dean approve，建議首個 actual-write candidate 沿用 Step 4 dry-run 之同一 target / value：

| 欄位 | 值 |
| --- | --- |
| targetRel | `content/blogger/posts/20260504-sample-book-review.md` |
| field | `description` |
| expectedOldValue | 同 Step 4 dry-run record（逐字複製自 current frontmatter） |
| newValue | 同 Step 4 dry-run record |
| reason | 先前已通過 production-target dry-run（PASS），且為 `status: draft` 之範例文章（non-live / non-Blogger-published；blast radius 實質為零） |

→ 詳值見 `docs/20260617-phase2-admin-write-path-production-dry-run-execution-record.md` §3。

**⚠️ 本 doc 列出 candidate 不等於 approve execution。** actual write 仍須 §4 全部 precondition + Dean explicit approval（於 §12 next phase）才可能執行。

---

## 12. Recommended next phase

```
20260617-pm-phase2-admin-write-path-actual-write-approval-check-readonly-a
```

- **Goal**：read-only 確認 §4 / §6 / §7 / §8 / §9 所有 gate 之狀態，並請求 / 記錄 Dean 對 actual write 之 explicit approval wording —— 在任何 real write 之前。
- **No actual write unless Dean explicitly approves in that later phase** —— 該 phase 仍不寫；除非 Dean 於該 phase 明示核准，否則不進入任何 actual write。

---

## 13. Guardrails（本 doc 之自我約束）

- ❌ This doc must **not** claim actual write has happened.（本 session **未**發生任何 actual write。）
- ❌ This doc must **not** enable Admin Apply.（Admin Apply 維持 disabled。）
- ❌ This doc must **not** change source / content（except read-only git / diff inspection）.（唯一 mutation = 本 doc 新增。）
- ❌ This doc must **not** change Phase 1 history.（不改寫 / 不降級 Phase 1 final history。）

並沿用本 session hard rules：no actual write；no `safe-write:test`；no `admin:write`；no `admin-write-cli.js` 執行；no production-target dry-run；no `--apply`；no `dryRun:false`；no production content write；不改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / CLAUDE.md / MEMORY.md；不 build / deploy / Blogger repost；不跑 validate / guard；不啟用 middleware / API / Admin Apply；不新增 npm dependency；不 amend / rebase / force-push。

---

## 14. Cross-links

- `docs/20260617-phase2-admin-write-path-preanalysis.md`（Phase 2 入口 preanalysis）
- `docs/20260617-phase2-admin-write-path-design-acceptance.md`（保守 A→B 漸進路線 design acceptance；§5 Step 5 = 本 plan 之對象）
- `docs/20260617-phase2-admin-write-path-fixture-dry-run-proof.md`（fixture-only proof，209/0；Step 3）
- `docs/20260617-phase2-admin-write-path-production-dry-run-plan.md`（production-target dry-run plan，docs-only）
- `docs/20260617-phase2-admin-write-path-production-dry-run-execution-record.md`（production-target dry-run execution，Step 4，diff only）
- `docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md`（CLI write driver / payload schema / exit codes / byte-exact gate）
- `docs/20260528-admin-write-phase-4p5e-yaml-drift-mitigation-preanalysis.md`（YAML emitter drift mitigation / patcher 行為）
- `CLAUDE.md` §8 / §28 / §29（第二階段 / MVP 必做 / 第一版不做清單）

---

## 15. Acceptance（本 phase 自身）

| 項目 | 結果 |
| --- | --- |
| baseline verify（branch / HEAD / origin / ahead-behind / clean） | ✅ `main` / `6b02e7a` / 0-0 / clean |
| 唯一 file change | `docs/20260617-phase2-admin-write-path-actual-write-safety-plan.md`（新增） |
| 未改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` | ✅ |
| 未改 CLAUDE.md / MEMORY.md | ✅ |
| no actual write / no `admin:write` / no `admin-write-cli.js` 執行 / no `--apply` / no `dryRun:false` | ✅ |
| no production-target dry-run / no production content touched | ✅ |
| no `safe-write:test` / no validate / no guard / no build / deploy / repost | ✅ |
| middleware / API / Admin Apply remain disabled；dormant write-path 維持 dormant | ✅ |
| no npm dependency / no merge / rebase / reset / amend / force-push | ✅ |

→ docs-only safety plan，acceptance trivially PASS。

---

（本文件結束）
