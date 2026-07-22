# Blogger Withdrawal Read-Only Planner（Slice 4C）

Phase：`20260721-publish-target-stage` Slice 4C
狀態：landed（local commit；**未 push**）+ boundary-hardening follow-up（見 §11a；correction-only、
未改 planner 結果 / content / sidecar；亦 **未 push**）
上位契約：
- `docs/20260720-publish-target-stage-contract.md`（stage 三者正交；missing→production；invalid fail-closed）
- `docs/publish-json-schema.md` §5.7 / §9（withdrawn / schemaVersion 2 / lifecycle）
- Slice 4A：`src/scripts/active-publication.js`（active publication predicate）
- Slice 4B：`src/scripts/sidecar-withdrawal-contract.js`（withdrawn sidecar schema）

---

## 1. 目的

新增一個**完全唯讀、deterministic、fail-closed** 的 Blogger withdrawal investigation planner。它盤點
現行 `content/blogger/posts/` 中「Blogger publish target 已進入 `stage: "preview"`、且對應 sidecar 仍
代表一個 active publication（`status: "published"` + 非空 `publishedUrl`）」的文章，產出穩定的
withdrawal-investigation candidate 清單。

每個 candidate **只**是一條「仍需 operator 親自驗證遠端 Blogger 真值」的線索。Planner 沒有、也不得
取得遠端 Blogger truth，因此：

- 不建立 authorization。
- 不產生 withdrawal payload。
- 不修改 Markdown 或 sidecar。
- 不呼叫 Blogger / Google / HTTP API（零網路）。
- 不宣稱遠端文章已刪除 / 已轉草稿 / 仍公開 / permalink 有效 / withdrawal 已核准 / candidate 已可 apply。

本 Slice **不**執行真正 withdrawal。

## 2. 語意重用（單一事實來源；本 planner 不複製任何一份）

| 語意 | 來源 helper | 函式 |
| --- | --- | --- |
| stage 解析（missing→production；invalid→ok:false） | `src/scripts/publish-stage.js` | `resolvePublishTargetStage` |
| active publication 判定（Slice 4A） | `src/scripts/active-publication.js` | `isActivePublishedTarget` / `getActivePublishedUrl` |
| withdrawal sidecar schema（Slice 4B） | `src/scripts/sidecar-withdrawal-contract.js` | `collectSidecarWithdrawalIssues` / `resolveSchemaVersion` / `isWithdrawnSidecar` |

active URL 語意 **不**另建第二套；status enum / schemaVersion 規則 / lifecycle 規則 / stage default 皆
重用上表 helper。

## 3. Candidate 定義

一篇文章只有在以下全部成立時，才是 withdrawal investigation candidate：

1. 位於 `content/blogger/posts/`（排除 `*.fb.md`）。
2. `publishTargets.blogger.enabled === true`。
3. resolved Blogger stage `=== "preview"`。
4. 對應 `.publish.json` sidecar 存在。
5. sidecar JSON 可解析。
6. sidecar 對目前 withdrawal contract 有效（`collectSidecarWithdrawalIssues` 回空陣列）。
7. sidecar `blogger.status === "published"`。
8. sidecar 為 active publication URL（`isActivePublishedTarget`：status published AND `publishedUrl` 非空）。

frontmatter 之 `draft` / `status` **不**影響 candidacy —— withdrawal candidacy 只由 sidecar 之 active
publication 真值決定。

## 4. Candidate 初始不可視為 apply-ready

所有 candidate 初始恆為：

```
remoteDisposition:     null
remoteVerifiedAt:      null
authorizationEligible: false
nextAction:            verify-remote-disposition
reason:                stage-preview
```

`bloggerPostId` 不存在或為空字串時，**不** fabricate ID、**不**因此丟失 candidate，只輸出
`hasBloggerPostId: false`。

## 5. 分類契約（除 candidate 外皆 fail-closed）

| 情境 | 分類 | bucket |
| --- | --- | --- |
| preview + published + active URL + valid sidecar | `CANDIDATE_WITHDRAWAL_INVESTIGATION` | candidate |
| preview + withdrawn（valid） | `NO_ACTION_ALREADY_WITHDRAWN` | no-action |
| preview + draft / ready / archived / sidecar 缺 / published-無-URL | `NO_ACTION_PREVIEW_NO_ACTIVE_PUBLICATION` | no-action |
| production（含 missing→production） | `NO_ACTION_PRODUCTION_STAGE` | no-action |
| blogger target disabled / 缺 | `NO_ACTION_NO_BLOGGER_TARGET` | no-action |
| invalid stage | `BLOCKED_INVALID_STAGE` | blocker |
| sidecar JSON parse error / read error | `BLOCKED_SIDECAR_MALFORMED` | blocker |
| unsupported schemaVersion / unknown v2 status / malformed lifecycle / 其他 withdrawal-contract error | `BLOCKED_SIDECAR_INVALID` | blocker |
| markdown / frontmatter 無法解析 | `BLOCKED_SOURCE_UNREADABLE` | blocker |
| source markdown 或 sidecar 為 symlink / junction / realpath 逸出 scan root | `BLOCKED_UNSAFE_SOURCE_PATH` | blocker |

invalid stage **不** fallback production；production post **不**自動改為 preview。已 withdrawn 之
sidecar **不**再成為 candidate。unsafe path 一律 fail-closed 為 blocker（**不**靜默忽略），blocker 只
輸出 logical `sourcePath` + 安全短碼（`unsafe-source-symlink` / `unsafe-source-outside-root` /
`unsafe-sidecar-symlink` / `unsafe-sidecar-outside-root` 等），**不**輸出 realpath / 外部 absolute path。

## 6. Deterministic JSON contract（`--json`）

單一 JSON object，field ordering 固定；`candidates` / `blockers` 依 `sourcePath` bytewise 升冪排序。

Top-level：`planVersion` / `gitHead`（40-char lowercase hex）/ `mutationPerformed`（正式 top-level
boolean）/ `summary` / `candidates` / `blockers`。

`summary`：`scannedPostCount` / `previewTargetCount` / `candidateCount` /
`needsRemoteVerificationCount` / `authorizationEligibleCount` / `blockedCount` / `noActionCount`。

candidate 欄位：`sourcePath` / `sidecarPath` / `sourceSha256` / `sidecarSha256` /
`publishedUrlFingerprint`（= SHA-256 of 精確 active publishedUrl 字串）/ `resolvedStage` /
`sidecarStatus` / `resolvedSchemaVersion` / `reason` / `hasPublishedUrl` / `hasBloggerPostId` /
`remoteDisposition` / `remoteVerifiedAt` / `authorizationEligible` / `nextAction`。

no-action records **不**逐筆列於 JSON，只計入 `noActionCount`。

輸出**不含**：`generatedAt` / current timestamp / absolute path / OS-specific path / process ID /
`publishedUrl` / `publishedAt` / `bloggerPostId` / operator identity / authorization path。

## 7. Redaction

JSON / human / stdout / stderr / blocker / error 輸出均**不得**含：publishedUrl、URL host、Blogger post
id 值、operator identity、private path、authorization note。blocker 只回顯安全短碼（issue type slug /
`parse-error` / `sidecar-read-error` / stage reason），**不**回顯 malformed 內容。

可輸出：sourcePath / sidecarPath / SHA-256 / URL fingerprint / boolean / status enum / stage enum /
error code / 欄位名。

Planner 對外拋出的 error 必為 `PlannerError`（stable `code` + safe `message` + `exitCode`）；`code` /
`message` **絕不**含動態 path、raw fs error（如 `ENOENT: ... <abs path>`）、URL、post id、operator
identity。CLI 之 error boundary 只回顯 `[plan-blogger-withdrawals] ERROR: <code>`；任何 non-`PlannerError`
/ unexpected error 一律轉為固定 `unexpected-internal-error`，**不**回顯 raw `err.message` / stack trace。

## 8. Exit codes

| 條件 | exit |
| --- | --- |
| 掃描完成、無 blocker（candidate 仍待 remote verification 不算 blocker） | 0 |
| 有 blocker | 1 |
| unknown / unsupported CLI argument（含任何 write-like flag） | 2 |
| internal planner failure（`PlannerError`：git-head 無法解析等） | 1 |
| `--help` | 0 |

## 9. 真實 repo 現況（read-only 掃描結果）

```
scannedPostCount:               12
previewTargetCount:             6
candidateCount:                 1
needsRemoteVerificationCount:   1
authorizationEligibleCount:     0
blockedCount:                   0
noActionCount:                  11
mutationPerformed:              false
exit code:                      0
```

唯一 candidate（由實際掃描得到，**非**硬編碼）：

```
sourcePath:              content/blogger/posts/20260612-after-work-writing-time-blocking.md
sidecarPath:             content/blogger/posts/20260612-after-work-writing-time-blocking.publish.json
sourceSha256:            cadcd68e639367964c3cdb0dc92a663cbfabfcb2b13404b01e8db8c2c1b4f060
sidecarSha256:           ed3e1e4a6700e30b5ae4458c40d4694b63d5f7ae218f79a83cb710efa095022e
resolvedStage:           preview
sidecarStatus:           published
resolvedSchemaVersion:   1
reason:                  stage-preview
hasPublishedUrl:         true
hasBloggerPostId:        false
remoteDisposition:       null
remoteVerifiedAt:        null
authorizationEligible:   false
nextAction:              verify-remote-disposition
```

現有 backfill candidate `content/blogger/posts/20260515-we-media-myself2.md`（production stage）**不**被
誤列為 withdrawal candidate。

## 10. 指令

```
npm run plan:blogger-withdrawals              # human-readable
npm run plan:blogger-withdrawals -- --json    # deterministic JSON to stdout
npm run plan:blogger-withdrawals -- --help
npm run check:blogger-withdrawal-plan         # focused guard（94/94 PASS）
```

CLI guard-only flag：`--repo-root <abs>` / `--git-head <40hex>`（隔離 synthetic fixture 測試用）。

## 11. 檔案

- `src/scripts/plan-blogger-withdrawals.js`（planner；read-only / deterministic / fail-closed）。
- `src/scripts/check-blogger-withdrawal-plan.js`（focused guard；in-memory / OS temp / synthetic fixture +
  read-only real-repo invocation；94 assertions，含 synthetic git-layout / error-redaction /
  symlink · junction containment + 真實 linked-worktree（`git worktree add --detach`，OS temp，primary 不
  受污染）+ 真實 symlink / junction fixture；不可建立 symlink / junction 之平台會明確標示 skip）。
- `docs/20260721-blogger-withdrawal-planner.md`（本文件）。
- `package.json`（`plan:blogger-withdrawals` / `check:blogger-withdrawal-plan`；本 correction 未變動）。

## 11a. Boundary hardening（follow-up correction；`c7b11f3` 之後的獨立 commit）

Slice 4C 首個 commit（`c7b11f3`）之 post-commit audit 找出三項 planner 安全缺陷；本 follow-up commit
（correction-only）修正之，**未**改變任何 planner 結果、content、sidecar：

1. **Linked worktree Git HEAD 解析**（`resolveGitHead`）
   - 支援 `.git` 為目錄（primary worktree）**與** `.git` 為 `gitdir: <path>` 指標檔（linked worktree）。
   - 指標檔須嚴格為單一有效 `gitdir:` 行；支援 absolute / relative-to-repoRoot；normalize 後須指向存在之
     目錄，否則 `missing-gitdir` / `invalid-gitdir-pointer`。
   - `commondir` 依 Git 規則解析 common git dir；branch ref 查找順序為 `<worktreeGitDir>/<ref>` →
     `<commonGitDir>/<ref>` → `packed-refs`（worktree 後 common）。
   - detached HEAD 只接受 `^[0-9a-f]{40}$`（拒 short / uppercase / whitespace / 其他文字）。
   - 全程純 fs 讀取：**無** `child_process` / git 子行程 / 網路 / 任何 write。fail-closed 只產生
     `unresolvable-git-head:<reason>` 安全短碼（`missing-dot-git` / `invalid-gitdir-pointer` /
     `missing-gitdir` / `invalid-head` / `missing-ref` / `invalid-ref` / `invalid-packed-refs`）。

2. **安全錯誤邊界**（error sanitization）
   - 新增 `PlannerError`（`code` / `safeMessage` / `exitCode`）；所有對外 error 皆為此型。
   - 所有 `.git` 讀取經 `safeReadTextSync`，任何 fs 錯誤（含 `ENOENT` 之 raw absolute path）→ `null`，
     **不**外洩。CLI error boundary 只輸出 `[plan-blogger-withdrawals] ERROR: <code>`；non-`PlannerError`
     一律 `unexpected-internal-error`；**不**回顯 raw `err.message` / stack trace / absolute path / secret。

3. **Symlink / junction escape containment**（scan `content/blogger/posts/**/*.md`）
   - fast-glob `followSymbolicLinks: false`（不走進 symlink / junction 目錄）+ `onlyFiles: false`
     （symlink 檔項不被靜默丟棄，交由分類）。
   - 每個 candidate 檔 + 對應 sidecar 皆做 `lstat`（拒 symlink）+ `realpath` containment（以 **path
     segment** 判斷是否位於 canonical scan root 內，**非**字串 prefix，故 `…/posts-evil/` **不**被誤判為
     `…/posts/` 內）。逸出者一律 `BLOCKED_UNSAFE_SOURCE_PATH`，**不**讀取內容、**不**輸出 realpath / 外部
     absolute path。symlink sidecar 亦一律拒讀。sidecar 為目錄（非 symlink）維持既有
     `BLOCKED_SIDECAR_MALFORMED` / `sidecar-read-error` 行為不變。

真實 repo 掃描結果（§9 之 12 / 6 / 1 / 1 / 0 / 0 / 11、gitHead、mutationPerformed:false）與 target
source / sidecar SHA、`content` diff 全部**不變**。

## 12. 邊界（本 Slice 明確不做）

不 push；不記錄 `remoteDisposition` / `remoteVerifiedAt`；不建立 authorization draft / validator；不建立
rehearsal / apply capability；不修改真實 sidecar / content / template；不執行任何 remote Blogger action；
不 build / preview / deploy。下一步（真正 withdrawal / authorization / remote verification）**必須另開**
post-commit audit-only Session + Dean explicit approval。
