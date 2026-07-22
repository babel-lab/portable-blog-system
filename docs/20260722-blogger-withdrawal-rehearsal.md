# Blogger Withdrawal — OS-temp Rehearsal Capability（Slice 4E）

Phase：`20260722-publish-target-stage` Slice 4E
狀態：landed（single local commit；**未 push**）
上位契約：
- `docs/20260722-blogger-withdrawal-authorization-preparation.md`（Slice 4D：authorization / preflight）
- `docs/20260721-blogger-withdrawal-planner.md`（Slice 4C：read-only withdrawal planner）
- `docs/20260720-publish-target-stage-contract.md`（stage 三者正交；missing→production；invalid fail-closed）
- `docs/publish-json-schema.md` §5.7 / §9（withdrawn / schemaVersion 2 / lifecycle）
- Slice 4A：`src/scripts/active-publication.js`
- Slice 4B：`src/scripts/sidecar-withdrawal-contract.js`

---

## 0. 位置

本 Slice 只新增**一個** operator-facing、與 production content 完全隔離的 rehearsal 工具，以及一個
focused guard。它**不**執行真正撤回，**不**建立 production apply capability，**不**新增
authorization approver、**不**驗證遠端 Blogger 真值。完整未來管線（每一步皆須獨立授權）：

```
1. plan:blogger-withdrawals                     (Slice 4C；read-only planner)
2. remote disposition verification              (人工；Slice 4D 不做)
3. prepare:blogger-withdrawal-authorization     (Slice 4D；read-only draft generator)
4. operator review + 手動 flip explicitlyAuthorized
5. validate:blogger-withdrawal-authorization    (Slice 4D；read-only preflight)
6. rehearse:blogger-withdrawal                  ★ 本 Slice（OS-temp mutate-in-place 演練）
7. future production apply                      ❌ 尚未存在（未來獨立 Slice）
8. future commit                                ❌ 須後續獨立授權（本工具永不 commit）
9. future push                                  ❌ 須後續獨立授權（本工具永不 push）
```

## 1. 目的

在 authorization、planner、preflight 皆 apply-ready 的前提下，將「未來 production apply 對
sidecar 的 deterministic mutate-in-place」搬到 **os.tmpdir() 之下的隔離副本**演練一次；驗證
write primitive、new sidecar semantics、read-back exact bytes；結束後 **unconditional cleanup**。

Rehearsal 是（且**只**是）：

```
production input validation
+ exact authorization / fingerprint binding
+ isolated OS-temp copy
+ exact future mutation simulation
+ read-back verification
+ deterministic report
+ unconditional cleanup
```

Rehearsal **不**是：

```
production apply
dry-run that skips write logic
Blogger API operation
remote Blogger verification
authorization generator
authorization approval
sidecar editor
Git commit helper
deploy helper
```

## 2. 硬邊界

- **不**寫入 source repository 之任何 `.md` / `.publish.json` / metadata / 其他檔。
- **不**碰 deploy repository。
- **不**建立、批准、修改 authorization；**不**把 `explicitlyAuthorized` 由 false 改為 true。
- **不**驗證遠端 Blogger 真值；**不**猜 remote disposition。
- **不**呼叫 Blogger / Google / GA4 / AdSense API；**不** child_process / fetch / network。
- **不** build / preview artifact；**不** deploy；**不** commit；**不** push；**不** amend；**不** tag。
- **不**接受 caller-provided scratch / test / repo / output root（CLI 級）。
- CLI 只接受 `--source-path` / `--authorization` / `--json` / `--help`；forbidden flag 出現即 exit 2。

## 3. Public CLI contract

```
Usage: rehearse-blogger-withdrawal \
  --source-path <content/blogger/posts/<slug>.md> \
  --authorization <path-outside-repo> \
  [--json] [--help]
```

Exit codes：

```
0   rehearsal completed（scratchMutationPerformed:true, cleanupPerformed:true）
1   rehearsal refused / failed（blockers reported；authorization 尚未 apply-ready、
    fingerprint 漂移、scratch containment 失敗、write primitive 失敗、read-back mismatch、
    sidecar / source SHA drift、preview artifact present、repo dirty 等）
2   CLI misuse（unknown / forbidden flag / 缺 required flag / --help → 0）
```

Forbidden flags（任一出現 → exit 2）：`--apply` / `--write` / `--output` / `--repo-root` /
`--project-root` / `--test-root` / `--scratch-root` / `--temp-root` / `--approve` / `--yes` /
`-y` / `--force` / `--skip-validation` / `--skip-fingerprint` / `--ignore-head` / `--dirty-ok` /
`--no-verify` / `--production` / `--publish` / `--deploy` / `--commit` / `--push` / `--restore` /
`--republish` / `--api`。

Programmatic API 可注入 `projectRoot`（供 focused guard 以 synthetic git repo 驅動）與
`scratchRootFactory` / `tmpBase`（供 guard 驅動 containment negative case）；**這些注入不從 CLI 暴露**。

## 4. Authorization 語意重用

**不**建立第二套 authorization parser／approver。本 Slice 直接重用 Slice 4D 的
`preflightWithdrawalAuthorization` 完成：

```
documentValid              authorization 通過 strict schema
repositoryBindingsMatched  repo-state eligible + HEAD/branch + 無 preview artifact
planBindingsMatched        重算 plan fingerprint 吻合
recordBindingsMatched      candidate unique + path / hash / status / URL fingerprint 吻合
                          + record fingerprint 吻合
explicitlyAuthorized       approval.explicitlyAuthorized === true
```

`applyReady = 上述五者皆真` 是進入 scratch mutation 的**前置條件**。任何一項不符 →
rehearsal refused（exit 1；`scratchMutationPerformed:false`；`productionMutationPerformed:false`）。

Rehearsal 額外在 preflight 通過後再讀一次 authorization 檔（read-only）以計算
`authorizationFingerprint = sha256(rawAuthorizationBytes)`，作為 lifecycle event 的
`authorizationFingerprint` 綁定值；**不**回顯 authorization 內容。

## 5. Exact snapshot 原則（TOCTOU 防護）

1. 完成 Git safety preflight（`admin-git-safety-preflight.js`）。
2. 完成 authorization 驗證（Slice 4D preflight）。
3. **重新**讀 source Markdown 與 sidecar bytes。
4. 計算 source / sidecar SHA-256，逐項比對 authorization 綁定值。
5. 建立 immutable rehearsal payload snapshot；後續 scratch 寫入使用此 snapshot 之 byte-identical
   bytes；**不**再重讀 production sidecar、**不**重 derive target。
6. 若 TOCTOU drift（source 或 sidecar 檔案改變）→ `source-hash-toctou-drift` /
   `sidecar-hash-toctou-drift`，refuse；zero scratch write。

## 6. Rehearsal mutation 語意

Scratch sidecar 由 `buildWithdrawnSidecar` 依既有 withdrawal contract 建構：

```
schemaVersion:  1 → 2
blogger.status: "published" → "withdrawn"
blogger.lifecycle: append 一個 withdrawn event
```

**保留**的 evidence（withdrawal contract §7.1 明列 withdrawn sidecar 必要條件；缺失即
`withdrawnMissingEvidence` error）：

```
blogger.publishedUrl
blogger.publishedAt
blogger.bloggerPostId
blogger.publishYear
blogger.publishMonth
```

這些欄位在 `status="withdrawn"` 下**不再**構成 active publication —— Slice 4A 之
`isActivePublishedTarget` 已於 consumer 端硬編為 status-gated，僅 `status==="published"` +
非空 `publishedUrl` 才視為 active。因此 withdrawn sidecar 保留原 URL 只作為 historical
evidence，不會被 build / preview / admin / render 顯示為 live URL。

保留 blogger 區塊之其他欄位（`type` / `permalink` / 未來 `history` 等）與所有其他 top-level keys
（`canonical` / `ogImage` / `seo` / 其他 platform block），順序沿用 prior sidecar；append 新的
lifecycle event：

```json
{
  "event": "withdrawn",
  "fromStatus": "published",
  "toStatus": "withdrawn",
  "recordedAt": "<withdrawal.remoteVerifiedAt>",
  "remoteVerifiedAt": "<withdrawal.remoteVerifiedAt>",
  "reason": "<withdrawal.reason>",
  "remoteDisposition": "<withdrawal.remoteDisposition>",
  "sourcePath": "<candidate.sourcePath>",
  "sourceSha256": "<candidate source sha256>",
  "priorSidecarSha256": "<candidate sidecar sha256>",
  "gitHead": "<preflight sourceHead>",
  "authorizationFingerprint": "<sha256(rawAuthorizationBytes)>"
}
```

`reasonDetail` 只在非空字串時輸出（landed contract 之 optional key）。lifecycle **append-only**：
prior sidecar 若有 lifecycle，新事件 append 到既有陣列尾端。

Rehearsal 之 `recordedAt` **不**使用 wall clock：取自 authorization 的 `remoteVerifiedAt`，滿足
withdrawal contract 之 `remoteVerifiedAt.epoch <= recordedAt.epoch` 常量，並保證 rehearsal
輸出 byte-deterministic。真正 production apply 時 recordedAt 語意 / 來源由未來 Slice 決定，非本 Slice 職責。

## 7. Deterministic serialization

- 固定 2-space indent + trailing newline（repository 慣例）。
- Field ordering 於 `buildWithdrawnSidecar` 內部固定：`schemaVersion` → `blogger` → 其餘 top-level（依 prior 順序）。
- `blogger` 內固定：preserved keys → `status` → `lifecycle`。
- 相同 immutable input（priorSidecar / authorization / candidate hashes / gitHead / authorizationFingerprint）
  → byte-identical output、byte-identical SHA-256。
- Approval `false → true` 不改變 plan / record fingerprint（fingerprint 語意 4D 已 lock）。

## 8. Scratch containment

- CLI 自行以 `mkdtempSync(join(os.tmpdir(), 'portable-blog-withdrawal-rehearsal-'))` 建立 scratch root。
- `realpath(scratchRoot)` 必須是：
  - `realpath(os.tmpdir())` 的 **strict descendant**（segment-safe；`/tmp-evil/wd` 不算 `/tmp/` 內）
  - **不**等於 os.tmpdir() 本身
  - **不**等於 source repo、**不**是 source repo 之 parent 或 descendant
  - 有由本次 invocation 建立之 marker file `.blogger-withdrawal-rehearsal-marker.json`
    （`{"schemaVersion":1,"purpose":"blogger-withdrawal-rehearsal"}`；`wx` 建立、外部預存 marker 不視為信任）
- Scratch 之 source / sidecar 副本 mirror repo-relative POSIX layout。
- `finally{}` 中無條件 `rmSync(scratchRoot, { recursive:true, force:true })`；report `cleanupPerformed`
  反映 scratch 是否已消失。

## 9. Atomic scratch mutate-in-place primitive

1. 同目錄 rehearsal temp file（`.<basename>.rehearsal-<pid>-tmp`）；`wx` flag 防覆蓋。
2. 寫入完整 deterministic bytes 到 temp。
3. Pre-rename：`lstat` scratch target；非 regular file / 為 symlink → refuse（temp 清除）。
4. `renameSync(temp, scratchSidecar)` — same-directory rename。
5. Read-back：bytes exact；SHA-256 相符；JSON.parse ok；`schemaVersion:2` + `blogger.status:"withdrawn"`；
   再次跑 `collectSidecarWithdrawalIssues` 無 issue。

Pre-rename 任一步失敗 → temp 清除、scratch target 保持原 bytes；rename 後 read-back 失敗 →
rehearsal failure，production 完全不受影響；`finally{}` 仍會清除整個 scratch tree。

## 10. Report contract（deterministic key order；redacted）

Human 與 JSON report 皆固定 key 順序：

```
ok
mode
sourcePath
sidecarPath
branch
sourceHead
planFingerprint
recordFingerprint
documentValid
repositoryBindingsMatched
planBindingsMatched
recordBindingsMatched
explicitlyAuthorized
preflightEligible
authorizationValidated
sourceHashMatched
sidecarHashMatched
outputSha256
semanticValidationOk
scratchMutationPerformed
readBackOk
rehearsalPerformed
productionMutationPerformed
applyReady
cleanupPerformed
blockers
```

`productionMutationPerformed` **恆為 false**（invariant；不由任何 code path 設為 true）。
`scratchMutationPerformed` 只在 scratch rename 完成後為 true；rename 前任何失敗一律 false。

Redaction（絕不輸出）：

- raw `publishedUrl` / Blogger host / Blogger post id / `publishedAt` / operator identity
- authorization file path / authorization file content
- OS temp absolute path / scratch absolute path
- repository absolute path / gitdir path
- stack trace / raw fs error / environment variables / tokens / credentials

Allowed（safe）：repo-relative POSIX path、SHA-256 hex、fixed enum、sanitized blocker code、
counts、booleans。

## 11. 檔案

- `src/scripts/rehearse-blogger-withdrawal.js`（rehearsal engine + CLI；重用 preflight / authorization loader / sidecar contract）。
- `src/scripts/check-blogger-withdrawal-rehearsal.js`（focused guard；OS-temp synthetic git repo + in-memory fixtures）。
- `docs/20260722-blogger-withdrawal-rehearsal.md`（本文件）。
- `package.json`（`rehearse:blogger-withdrawal` / `check:blogger-withdrawal-rehearsal` scripts；未動既有 scripts / dependencies / lockfile）。

## 12. Guard baselines（本 Slice 實跑）

Guard 覆蓋 happy path、authorization failures、candidate / sidecar failures、git safety、
scratch boundary（含 injected `scratchRootFactory` 之 negative case）、atomic primitive、
determinism / privacy proofs、CLI e2e、real repository read-only smoke。實際 assertion count
由執行時輸出決定，本文件不提前寫死。

## 13. 邊界（本 Slice 明確不做）

不 push；不建立真實 operator authorization；不執行 production apply；不 commit；不 amend；
不啟動下一 Slice；不建立 sidecar writer / rollback / restore / republish / remote action /
Blogger API integration；不修改任何 `content/**`（含 sidecar / markdown / template）；
不動 withdrawal sidecar contract 語意、validator truth table、active-publication helper、
canonical URL consumers、blogger / GitHub builder、Blogger preview planner / builder、
backfill apply tools、deploy repository、`.gitignore`、lockfile；不動 Slice 4A–4D 之
implementation module。下一步（production apply / remote verification / commit / push）**必須
各自另開獨立 Slice + Dean explicit approval**。
