# Blogger backfill truth apply — fingerprint-bound OS-temp rehearsal（2026-07-19）

Session：`260719 / add fingerprint-bound apply rehearsal for blogger backfill`

- Date：2026-07-19（Asia/Taipei）
- Type：source slice（rehearsal-only engine + CLI + focused guard + docs；no production content / sidecar / Markdown / deploy / dist-* mutation）
- Baseline：source `HEAD = origin/main = 679c79c`（subject `docs(backfill): record sidecar identity contract audit`）；deploy `HEAD = origin/gh-pages = 0eaf9c6`
- Pipeline position：**下一個** slice = 未來 production apply（本 slice **不** 建構 apply 授權；未來 apply 仍為獨立 Dean-gated slice）

**Revision 2026-07-19（race-safe finalization audit landed）**：§7 之 per-file 契約由 `writeFile(tmp, wx) + fs.access(target, F_OK) + fs.rename(tmp, target)` 換為 `writeFile(tmp, wx) + [beforeFinalCommit hook] + fs.link(tmp, target)` — 單一 no-replace primitive；§8 multi-record rollback 新增 inode ownership check（externally-replaced target 不被 unlink）。詳見下 §7 / §8。

> ⚠️ 本文件描述之 rehearsal 工具**不**接受 `--production` / `--apply` / `--force` / `--overwrite` / `--publish` / `--deploy` / `--commit`。所有寫入僅限於 `os.tmpdir()` 之 synthetic fixture 目錄；production repository、deploy repository、Blogger 平台皆不會被觸碰。fingerprint 匹配**不**代表 production apply 已被授權。

---

## 1. 用途 / pipeline 位置

```
missing-sidecar planner
  → optional create-only bootstrap
  → truth-manifest template generator
  → truth-manifest intake validator     (validate:blogger-backfill-truth-manifest)
  → validated apply-plan gate           (plan:blogger-backfill-truth-apply)
  → 本 slice — fingerprint-bound OS-temp rehearsal   (rehearse:blogger-backfill-truth-apply)
  → future writer apply                 (仍為獨立 slice；仍需 Dean explicit approval；
                                         fingerprint 匹配**不**授權 production apply)
```

本 slice 補齊之能力：**把 review-time 之 `plan-blogger-backfill-truth-apply` fingerprint 與實際寫入之 exact plan 綁定，並在 OS temporary synthetic repository 中演練 create-only sidecar 寫入、per-file 原子性、多筆交易之 rollback semantics。**

本 slice **不** 是 production writer；不接受 production `--apply`；不建立 approval token；不呼叫 Blogger / Google API；不 build / deploy / preview；不動 `dist-*` / `dist-blogger-preview/` / gh-pages / deploy clone。

---

## 2. 檔案

| 檔案 | 用途 |
| --- | --- |
| `src/scripts/rehearse-blogger-backfill-truth-apply.js` | engine + CLI；提供 `rehearseTruthApply()` programmatic API 與 `npm run rehearse:blogger-backfill-truth-apply` 之 CLI 入口 |
| `src/scripts/check-blogger-backfill-truth-apply-rehearsal.js` | focused guard；OS-temp fixture 上完整覆蓋 Session §12 47+ 條斷言（實跑 112/112 PASS） |
| `package.json` | 新增 `rehearse:blogger-backfill-truth-apply` + `check:blogger-backfill-truth-apply-rehearsal` scripts |
| `docs/20260719-blogger-backfill-truth-apply-rehearsal.md` | 本文件 |

**沒有** production `.publish.json` / Markdown / sidecar inventory 變更；**沒有** deploy repository 變更；**沒有** apply command 新增；**沒有** approval token 實作。

---

## 3. Rehearsal CLI 契約

### 必要參數

```bash
npm run rehearse:blogger-backfill-truth-apply -- \
  --manifest <path> \
  --repo-root <abs> \
  --expected-fingerprint <sha256-hex-64> \
  [--json] [--help]
```

- `--manifest <path>`：validated truth manifest 之路徑（絕對或相對於當前工作目錄；相對路徑會被解析為絕對）。
- `--repo-root <abs>`：synthetic fixture repository 之絕對路徑。**必須**位於 `realpath(os.tmpdir())` 之下（見下 §4）。
- `--expected-fingerprint <sha256-hex-64>`：`plan:blogger-backfill-truth-apply` 曾產出之 SHA-256 fingerprint（64 字元 lowercase hex）。**必須** 與 rehearsal engine 在該 synthetic fixture 上重新計算之 fingerprint **完全一致**。

### 明確拒絕之 flag（hard-fail exit 1）

```
--production
--allow-production
--force
--overwrite
--replace
--merge
--publish
--deploy
--commit
--yes
-y
```

未知 flag 亦 fail-closed（exit 1）。

### 不接受之語意

- 沒有 `--apply` 亦沒有 `--dry-run`。本工具**只有** rehearsal mode，且 rehearsal mode 恆對 OS-temp fixture 進行 create-only writes（成功時）；沒有需要選擇 dry-run 或 apply 的 toggle。
- 沒有 production repository option；`--repo-root` 之 OS-tmp gate 是 hard requirement（非 opt-in）。
- 沒有 approval token 或 authorization mechanism。fingerprint 匹配**只**代表「plan 未被變動」，**不**代表 Dean 已授權 production apply。

---

## 4. Gate 排序（fail-closed；每個 gate 必須通過才進入下一步）

engine 之 gate 排序：

1. **`--repo-root` OS-tmp gate**（`verifyOsTempRoot`）：
   - `path.isAbsolute(repoRoot)` 必須為 true。
   - `realpath(repoRoot)` 必須是 `realpath(os.tmpdir())` 之**strict descendant**（使用 `path.relative` 比對；不使用天真 `startsWith`，避免 `/tmp/foo` 與 `/tmp/foobar` 之混淆）。
   - 拒絕：`os.tmpdir()` 本身、source repository root、任何 symlink 經 realpath 反查後逃逸 `os.tmpdir()`。
2. **Rehearsal marker gate**（`verifyRehearsalMarker`）：`<repoRoot>/.blogger-backfill-truth-apply-rehearsal-marker.json` 必須存在，且內容為：
   ```json
   {
     "schemaVersion": 1,
     "purpose": "blogger-backfill-truth-apply-rehearsal"
   }
   ```
   缺失、無法讀取、非 JSON、非 object、`schemaVersion` 錯誤、`purpose` 錯誤 → 一律 refuse。marker 的名稱刻意選擇明確詞彙，避免任何一般 fixture 目錄意外滿足契約。
3. **Fingerprint syntactic gate**（`isSha256HexLower`）：`--expected-fingerprint` 必須是 64 字元 lowercase hex。空、trim-after-value、`A-F`、少於 / 多於 64 字元、非 hex 均 refuse。
4. **Validator + planner gate**：呼叫 `planTruthApply({manifestPath, repoRoot})`；validator 或 planner 任一失敗即 refuse，且 rehearsal 不產生任何寫入。
5. **Fingerprint binding gate**：`fingerprint.value === expectedFingerprint`（strict equal）。不相符即 refuse。
6. **All-record preflight gate**：對每 planned entry 執行 shape + duplicate + traversal + source-exists + target-absent 檢查；任一失敗 → zero writes。

未通過任一 gate → `productionWritePerformed: false`、`rehearsalWritePerformed: false`、`writePerformed: false`。

---

## 5. Fingerprint binding

- Rehearsal engine 使用 `planTruthApply` 一次性產生 `report / plan / fingerprint`；**不**再次讀取 manifest、**不**再次 derive target、**不**再次 construct payload。plan.entries 之 payload 為 review-time 之 exact bytes。
- fingerprint 匹配後，plan.entries 之 payload 會被 deep-clone 並 `Object.freeze`，避免任何後續 mutation。
- 寫入時使用之 bytes = `JSON.stringify(entry.payload, null, 2) + '\n'`（與 bootstrap writer `serializeSidecar` 字節相同）。因此 rehearsal 目標檔案之 bytes 與 fingerprint 綁定之 payload 為 byte-identical。
- Fingerprint 匹配**只**代表：
  - Manifest 之 `schemaVersion` 未變。
  - Candidate inventory 未變（validator 之 coverage layer）。
  - 每筆 `sourcePath` / `targetPath` / `operation` / `payload` 均未變（含 `bloggerPostId: ""` 之現行 identity contract）。

fingerprint 匹配**不**代表：
- Dean 已授權 production apply。
- Blogger 平台真值仍為 Dean 提供時之值（例如 Blogger 平台可能於中間變更 URL）。
- 未來 `bloggerPostId` 已被 Blogger API integration 填入。

---

## 6. Same-snapshot 保證

engine source 之靜態邊界（focused guard 靜態斷言）：

- `readFile(manifestPath, ...)` **只**於 `planTruthApply()` 內部發生；engine 之 mutating path 不會再度 open manifest。
- **不** 出現 `expectedSidecarPath`（target 之 rederive 名稱）；target 由 plan.entries `targetPath` 逐字使用。
- **不** 呼叫 `buildSidecarBody`；payload 由 plan.entries `payload` 逐字使用。
- **不** 使用 `child_process`；plan / apply 全部 in-process。

以上四點使 review 之 plan 與 apply 之 plan **必然**為同一 object，杜絕「驗證的是 plan A、寫入的卻是 plan B」之類 drift。

---

## 7. Per-file no-replace 契約（2026-07-19 finalization audit landed）

### 7.1 為何原本的 check-then-rename 不夠

原始實作為：

1. `writeFile(tmp, { flag: 'wx' })`
2. `fs.access(target, F_OK)` — 若 ENOENT 視為 target 尚未存在。
3. `fs.rename(tmp, target)` — commit。

`fs.rename` 在兩平台皆為 **replace-capable**：

- POSIX `rename(2)`：destination 存在則 atomically 覆蓋。
- Windows：libuv 之 `uv_fs_rename` 走 `MoveFileExW(MOVEFILE_REPLACE_EXISTING | MOVEFILE_COPY_ALLOWED)` — 亦覆蓋。

所以 step 2 與 step 3 之間存在 TOCTOU：若另一 actor 於此 window 建立 target，step 3 會 silently 覆蓋。原本 focused guard 之 race 測試將 target 建立於 `beforeWriteHook`（**在** temp write 之前），因此 step 2 之 `access` 即已 catch，但**真正的 race window** — temp 已寫、`access` 已通過、`rename` 尚未執行 —**未被測試**。

### 7.2 現行 no-replace 契約

Rehearsal engine 每筆 sidecar 之寫入：

1. `writeFile(<target>.rehearse.tmp, { flag: 'wx' })` — exclusive create。已存在 → 失敗。
2. Programmatic-only `beforeFinalCommit(i, ctx)` hook（僅 focused guard 使用；CLI / env 均不曝露）；hook 拋錯 → unlink tmp、rethrow。
3. **`fs.link(tmp, target)` — 單一 no-replace primitive**。
   - POSIX `link(2)`：destination 已存在 → EEXIST，原檔 bytes / mtime 不變。
   - Windows `CreateHardLinkW`：destination 已存在 → `ERROR_ALREADY_EXISTS`，原檔 bytes / mtime 不變。
   - 若在 step 1 之後、step 3 之前 target 被 concurrent actor 建立，step 3 一律失敗；沒有 check-then-commit gap；沒有 fallback 至 replace-capable primitive。
4. `fs.stat(target).ino` — capture inode，供 rollback ownership check 使用。
5. Best-effort `unlink(tmp)`；tmp 清理失敗**不**回滾成功的 commit（target 已正確落地）。
6. Post-write read-back（在 outer loop）：`fs.readFile(target)` 之 bytes 必須逐字等於本次 `JSON.stringify(payload, null, 2) + '\n'`；否則報 verification failure、進入 rollback。

Tmp suffix 刻意選用 `.rehearse.tmp`（**不**是 bootstrap writer 之 `.tmp`），避免與其他 writer 之 tmp artifact 混淆。

### 7.3 Per-file atomicity 之精確範圍

- ✅ **No-overwrite**：final commit primitive `fs.link` 於 destination-exists 時 fail-closed；不需依賴 preflight。
- ✅ **Complete-bytes visibility**：reader 看到 target 之瞬間，其內容必為完整寫入之 tmp bytes（bytes 在 link 之前就已在 tmp 完成）。
- ✅ **Same-filesystem finalization**：tmp 與 target 位於同一目錄，同一 filesystem。
- ✅ **Cross-platform**：NTFS、ext4、APFS、ZFS、Btrfs、XFS、HFS+ 均支援 hardlink；`fs.link` 於這些 FS 上之 no-replace 契約由 OS 強制。
- ⚠️ **不支援之 filesystem**（FAT / exFAT — 罕見於 `os.tmpdir()`）：`fs.link` 會回 error；engine 直接 hard-fail，**不** fallback 至 replace-capable primitive。這是設計選擇，優先於安靜降級。
- ❌ **不宣稱** durable / crash-safe atomic：無 file fsync、無 directory fsync、無 crash-recovery journal。process 於 fs.link 之間 crash 可能留下 tmp，但 target 為 all-or-nothing。
- ❌ **不宣稱** filesystem transaction：per-file 為 atomic no-replace；multi-record 只是 best-effort compensating rollback（見 §8）。

---

## 8. Multi-record transaction contract（best-effort compensating rollback）

失敗語意（明確定義）：

- 目標：**all created，或 rollback 已嘗試清除本 transaction 已建立之 targets**。此為 **best-effort compensating rollback**，**不**為 filesystem transaction、**不**保證 crash-safe。
- 第 N 筆失敗時：
  - engine 只清理**本 transaction 已建立**之 targets（`createdTargets` inventory，含 `{ absPath, ino }`）；不觸碰任何 pre-existing file。
  - Rollback 依 reverse creation order。
  - **Ownership check**：unlink 之前先 `stat(target).ino` 與 commit 時 capture 之 inode 比對；若 inode 變動（externally replaced），refuse unlink，**保留**該檔案，並將 `ownership-verification-failed` 錯誤加入 `rollbackFailures[]`。若目標已消失（ENOENT），視為已 rolled back，不再嘗試 unlink。
  - Rollback 中之失敗（inject 或 real）**不**被吞掉；`rollbackFailures[]` 明確列出。
  - `remainingCreatedTargets[]` 呈現 rollback 嘗試後仍存在 disk 上之目標。
- 成功時：`transaction.status === 'committed'`。

### 8.1 Ownership check 之範圍

- ✅ Rollback 之 unlink 只針對 inode 仍與 commit 時 capture 相符之目標。
- ✅ 若外部 actor 於 commit 之後把 target 刪掉、換上不同 inode 之新檔（例如 rm + new writeFile），rollback **不**刪它。
- ⚠️ Inode 於 POSIX 與 NTFS 均為可靠 identity signal，但 inode 可能被 recycle（POSIX 於檔案刪除後）——本 slice 未加入 rollback-time 之 digest 二次驗證。**不宣稱** concurrency-safe transaction rollback。
- ❌ 若 external actor 於 commit 之後、rollback 之前把 target 換成 inode 相同之另一副本（極少見；通常需 hardlink swap），本 slice 之 ownership check 可能誤將它視為 own inode。這是明確之限制，未於本 slice 修補；production apply 仍為 blocked slice，若未來啟動須獨立評估。

### 8.2 為何仍稱為「best-effort」

- 沒有 file fsync、沒有 directory fsync、沒有 crash-recovery journal。
- 沒有 process-global lock；single-writer 由 filesystem-level EEXIST 保證 no-overwrite，但 multi-record rollback 是 async 的補償，不是原子。
- Solo-admin / single-process 情境下已足以避免任何靜默的 partial state；multi-writer 情境下 no-overwrite 契約仍成立，rollback 於 external replacement 情境下 fail-closed。

Result envelope（human + JSON）之交易欄位：

```
transaction.status                 not-started | preflight-failed | in-progress | rolled-back | committed
transaction.createdBeforeFailure   [] | [rel...]
transaction.rolledBackTargets      [] | [rel...]
transaction.rollbackFailures       [{ target, error }, ...]
transaction.remainingCreatedTargets [] | [rel...]
summary.createdCount               attempted+created count
summary.rolledBackCount            successfully unlinked
summary.rollbackFailureCount       rollback failures
summary.remainingCreatedCount      still-on-disk after rollback attempt
```

**「atomic」一詞範圍**：per-file 級別為 exclusive-create-only 原子性；multi-record 級別為「best-effort transaction rollback + surfaced failures」，**不**宣稱單一 fsync 或 crash-safe atomic — 由此避免誇大契約範圍。solo-admin + single-process 情境下已足以避免任何靜默的 partial state。

---

## 9. Failure injection facility

Rehearsal-only test facility；透過 programmatic API 之 `failureInjection` 參數傳入：

| Hook | 用途 |
| --- | --- |
| `beforeWriteHook(i, ctx)` | 於每筆 write 之前呼叫；guard 用來模擬「target 於 preflight 與 write 間出現」之 race（**early** race point，temp 尚未寫入） |
| `beforeFinalCommit(i, ctx)` | **exact race point**：於 temp write 完成後、`fs.link` 之前呼叫。用來重現原始 check-then-rename 唯一可能被 race 之 window；也用於 two-writer 交錯測試 |
| `failBeforeWriteIndex` | 於指定 index 之 write 前拋錯 |
| `failAfterWriteIndex` | 於指定 index 之 write 後拋錯（含 verification 前） |
| `failDuringVerificationIndex` | 於指定 index 之 post-write verification 後拋錯 |
| `failDuringRollbackIndex` | 於 rollback 期間跳過該 index 之 unlink，用來測 rollback 失敗處理 |

**CLI 完全不曝露這些 hook**。沒有環境變數可觸發。只有 focused guard `check:blogger-backfill-truth-apply-rehearsal` 之 in-process API 可以使用。

---

## 10. Output 契約

### Human-readable（default）

主要欄位（順序固定；用於人工審核）：

```
mode: os-temp-rehearsal
repo root (arg): <repoRoot>
manifest path: <manifestPath>
expected fingerprint: <hex>
actual   fingerprint: <hex>
fingerprint matched: YES|NO
planned count / preflight passed / attempted count / created count
rolled back count / rollback failure count / remaining created count
transaction status
production write performed: NO         (invariant)
rehearsal write performed: YES|NO
```

Human output 恆以以下三行 footer + Overall 行結束：

```
OS-temp rehearsal only.
No production repository was modified.
No Blogger operation was performed.
Overall: PASS|FAIL
```

### JSON（`--json`）

deterministic envelope（`JSON.stringify(result, null, 2) + '\n'`），至少含：

```
ok
mode                    "os-temp-rehearsal"
productionWritePerformed  false                (invariant)
rehearsalWritePerformed
writePerformed
expectedFingerprint / actualFingerprint / fingerprintMatched
manifestPath / repoRoot
summary { plannedCount, preflightPassed, attemptedCount, createdCount,
          rolledBackCount, rollbackFailureCount, remainingCreatedCount }
transaction { status, createdBeforeFailure, rolledBackTargets,
              rollbackFailures, remainingCreatedTargets }
records
errors
```

`writePerformed` 在成功 rehearsal 時可為 `true`，但**只**代表發生於 OS-temp。`productionWritePerformed` 為 **hard-coded invariant `false`**（source-level 靜態斷言：engine 從不設它為 `true`）。

### Exit code

- `0`：全部 gate 通過 + rehearsal 成功。
- `1`：任一 gate 失敗、validator / planner 失敗、fingerprint mismatch、preflight 失敗、per-file 寫入失敗、verification 失敗、rollback 發生（含 partial rollback）、CLI misuse。

---

## 11. Focused guard 覆蓋

`check:blogger-backfill-truth-apply-rehearsal`：實際 pass/total 由當 phase 實跑產出（本檔不預先寫死；歷史 baseline 112/112 於 finalization audit 之前）。

覆蓋類別：

- Source-level 靜態禁令（no child_process / spawn / fetch / node:http[s] / googleapis / blogger.googleapis.com / manifest re-read / target re-derivation / payload re-construction）
- **2026-07-19 race-safe finalization audit 新增之 source-level 靜態斷言**：`fs.link` 存在於 engine；`fs.rename` **不**存在於 mutating write path；`writeExclusivelyOrThrow` 之 body 內**不**出現 `fs.access(targetAbs, …)` 或 `fs.rename`；`beforeFinalCommit` hook name 存在。
- parseArgs / --help contract / forbidden flag / unknown flag / missing required flag / non-abs repo-root
- OS-temp gate（source repo / deploy repo / /docs / os.tmpdir() 本身 / symlink escape / accepts fresh mkdtemp）
- Marker gate（missing / bad JSON / wrong purpose / wrong schemaVersion / array top-level / valid）
- Fingerprint（valid match / malformed empty / whitespace / uppercase / short / long / non-hex; mismatch when payload changed; mismatch when candidate inventory changed）
- Happy path（rehearsal PASS + createdCount / attemptedCount / plannedCount / transaction.status === 'committed'）
- Byte-identical to `buildSidecarBody`（rehearsal 目標 bytes 與 bootstrap writer bytes 相等）
- Failure injection（fail-before-0 / fail-after-0 / fail-after-1 / verification / rollback failure）
- Race hooks：
  - `beforeWriteHook` — early race point（target appears before temp write）；由 preflight-inside-loop 檢查捕獲。
  - **`beforeFinalCommit`（audit 新增）** — exact race point：hook 之時 temp 已完整寫入、`fs.link` 尚未執行；hook 於此 window 建立 target；engine 之 `fs.link` 必須失敗、target bytes / mtime **不變**、`.rehearse.tmp` 清除、raced target **不**加入 transaction ownership、後續 target 不寫。
- **Two-writer race at exact commit point（audit 新增）**：writer A 與 writer B 之 payload 不同；writer B 在 A 之 `beforeFinalCommit` window 完成寫入；A 之 `fs.link` 失敗、target 內容 = B 之 bytes、A 之 tmp 清除。
- **Rollback ownership check（audit 新增）**：commit 之後 target 被 external actor 刪除 + 換上不同 inode 之新檔；rollback 依 ownership check refuse unlink、將 `ownership-verification-failed` 加入 `rollbackFailures[]`；externally-replaced target 之 bytes 保持不變。
- Preservation（rollback 不刪 pre-existing 檔案）
- Invariants（`productionWritePerformed === false` in every code path；`mode === "os-temp-rehearsal"`）
- Production safety（source repo `.publish.json` inventory bytes/mtime unchanged；Blogger Markdown bytes/mtime unchanged；`dist-blogger-preview/` absent；deploy repo unchanged 若可存取）

---

## 12. 與 `bloggerPostId: ""` 契約之關係

依 2026-07-19 `docs/20260719-blogger-backfill-sidecar-identity-contract-audit.md` Decision A：

- Plan payload 之 `blogger.bloggerPostId: ""` 為 schema 允許之 **incomplete-identity state**（不是 error；不是 placeholder；不是 blocker）。
- 本 rehearsal 產出之 sidecar 亦保留 `bloggerPostId: ""`；rehearsal engine **不** 猜、**不** 填、**不** 從 URL / slug / title 推導 postId。
- Fingerprint 之計算涵蓋 `bloggerPostId` field，因此未來 Blogger API integration 若把 `""` 換成真值，fingerprint 必然改變（結構性必然，非需另 assert）。

---

## 13. 明確不做（本 slice 之硬性邊界）

- ✅ 不建立 / 修改 production `.publish.json`。
- ✅ 不修改 production Markdown。
- ✅ 不填入 production `bloggerPostId`。
- ✅ 不猜 Blogger post ID / publishedAt / URL。
- ✅ 不新增 production-facing `apply` command。
- ✅ 不放寬 existing bootstrap production authorization。
- ✅ 不執行 existing bootstrap production `--apply`。
- ✅ 不實作 approval token。
- ✅ 不呼叫 Blogger / Google API。
- ✅ 零網路。
- ✅ 不 build / deploy / preview。
- ✅ 不建立 `dist-blogger-preview/`。
- ✅ 不修改 GA4 / custom-domain 設定。
- ✅ 不升級任何 warning-only guard 為 blocking。
- ✅ 未來 production apply 為獨立 slice + Dean explicit approval（本工具**不**授權）。

---

## 14. 承接關係

- Predecessor（authorities）：
  - `docs/publish-json-schema.md` §5 / §8 / §9
  - `docs/20260706-blogger-identity-and-backfill-strategy.md`
  - `docs/20260706-blogger-backfill-write-target-inventory.md`
  - `docs/20260706-blogger-backfill-report-only-baseline.md`
- Sibling（slice-level）：
  - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`
  - `docs/20260718-blogger-backfill-missing-sidecar-bootstrap.md`
  - `docs/20260718-blogger-backfill-truth-manifest-template.md`
  - `docs/20260719-blogger-backfill-truth-manifest-intake-validator.md`
  - `docs/20260719-blogger-backfill-truth-apply-plan.md`
  - `docs/20260719-blogger-backfill-sidecar-identity-contract-audit.md`
- 本文件 = rehearsal slice；下一 slice = 未來 production apply（**未** 授權；**未** 啟動）。
