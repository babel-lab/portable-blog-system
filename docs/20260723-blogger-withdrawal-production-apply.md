# Blogger withdrawal — production apply capability（Slice 4I）

## 0. Pipeline position

```
plan:blogger-withdrawals                                  (Slice 4C；read-only planner)
  → operator 親自驗證遠端 Blogger disposition             (人工)
  → prepare:blogger-withdrawal-authorization              (Slice 4D；draft generator)
  → operator 手動 flip explicitlyAuthorized               (人工)
  → validate:blogger-withdrawal-authorization             (Slice 4D；read-only preflight)
  → rehearse:blogger-withdrawal                           (Slice 4E；OS-temp rehearsal)
  → **apply:blogger-withdrawal**                          (**this slice**；production apply)
  → (future) post-commit audit / push / redraft           (各須獨立授權)
```

## 1. 能力與非能力（Strategy B — fail-closed capability gate）

### 能力（authorization / preflight / rehearsal 全程可用）

- 對 authorization 指定之單一 `.publish.json` sidecar 執行 read-only 之 authorization
  parse / duplicate-key scan / preflight（含 remote-disposition / repository / plan /
  record / target bindings）、hash observation、path safety gate（strict containment /
  lstat / realpath / parent junction / hard-link identity）。
- 在具備受支持 atomic-commit primitive 之 runtime（`native-compare-and-swap` 或
  `mandatory-exclusive-lock`）上，執行 deterministic mutate-in-place transformation：
  `blogger.status: "published" → "withdrawn"`、append 一次 withdrawn lifecycle event、
  `schemaVersion: 2`；並提供 raw-byte authorization binding、same-buffer source/sidecar
  binding、in-directory sibling temp file、adapter 主導之 atomic commit、read-back
  byte-compare + SHA-256 verification、post-commit source freshness gate、rollback on
  read-back / source drift、unconditional cleanup、redacted report。

### 非能力

- **不** commit、**不** push、**不** rebase、**不** reset、**不** stash、**不**修改 git index。
- **不** build、**不** preview、**不** deploy、**不** 動 `dist*`、**不**碰 gh-pages / deploy repo。
- **不** 呼叫 Blogger / Google / GA4 / AdSense API、**不** fetch、**不** child_process。
- **不** 動 source Markdown、**不** 動其他 sidecar、**不** 動 authorization 以外之任何 metadata。
- **不** 自動掃描並 apply 其他 candidate；本 Slice **只** 支援 single record。
- **不** 於任何缺乏 CAS 或 mandatory exclusive lock 之 runtime 執行 production temp write /
  rename。目前 Node.js（含 Windows）Core 不提供受支持之 CAS / mandatory lock primitive，
  因此 CLI 之 default library path 會於 `atomic-commit-capability-unavailable` 安全 fail
  closed（見 §8a）。真實 withdrawal apply 尚不可執行；authorization / preflight /
  rehearsal 仍可使用。

### Strategy 選擇（B）

Runtime constraint（Node.js on Windows、無 child_process、無未稽核 native binding、無 shell、
無 unaudited dependency）下，Node core 未提供：

- native compare-and-swap primitive（Linux 為 `renameat2(..., RENAME_EXCHANGE)`；Windows
  為 `SetFileInformationByHandle FILE_RENAME_INFO` 之 atomic verify-if-unchanged 語意，
  Node fs API 未曝露）
- mandatory exclusive lock（Windows FILE_SHARE_NONE 需要底層 API；POSIX flock/fcntl 為
  advisory；均非 mandatory）

Advisory lock 及 rename-after-check 不合契約規範對「compare-and-swap／mandatory exclusion」之
明示要求，因此本 Slice 採 Strategy B（fail-closed capability gate）。default CLI / default
library path 於任何 temp file 建立、production write、rename 之前，emit 穩定 blocker
`atomic-commit-capability-unavailable`；`applyReady` 可保留 preflight 之 authorization 判定
（表示 authorization ready），但 `commitReady=false`、`applyPerformed=false`、
`productionMutationPerformed=false`、`tempFileCreated=false`、`readBackOk=false`、
`rollbackAttempted=false`。

未來若 Node core / 受稽核 dependency 提供可證明之 CAS 或 mandatory exclusion primitive，另
開 Slice 提出實作與正式驗收；本 Slice **不** 主動導入 native binding / child_process /
shell command / unaudited native API。

## 2. 單筆限制

- `plan.recordCount` 必為 `1`；schema 已固定。
- authorization 之 `target.sourcePath` 必在 `content/blogger/posts/<slug>.md`。
- `target.sidecarPath` 必等於 `<stem>.publish.json`（由 CLI 硬編碼推導；不接受任意值）。
- authorization record 必恰好匹配 planner 之 唯一 candidate。
- 不支援 batch apply、不自動掃描、不自動選 candidate。

## 3. Authorization 要求

- schema：`schemaVersion:1` + `purpose:"blogger-sidecar-withdrawal"` +
  `repository.expectedBranch:"main"` + `repository.expectedHead:<git40>` +
  `plan.expectedPlanFingerprint:<sha256>` + `plan.expectedRecordFingerprint:<sha256>` +
  `plan.recordCount:1` + `target.expectedSourceSha256:<sha256>` +
  `target.expectedSidecarSha256:<sha256>` + `target.expectedCurrentStatus:"published"` +
  `target.expectedPublishedUrlFingerprint:<sha256>` + `withdrawal.event:"withdrawn"` +
  `withdrawal.remoteDisposition` ∈ withdrawal-eligible enum（**排除** `remote-live`）+
  `withdrawal.remoteVerifiedAt` 為 TZ-aware ISO-8601 + `withdrawal.reason` ∈ landed reason enum +
  `withdrawal.reasonDetail:<string>` + `approval.explicitlyAuthorized:true`。
- 任一欄位缺失 / shape 錯 / duplicate key（含 escape 變體） → schema refused、無 write。

## 4. Exact confirmation phrase

CLI 必要 flag `--confirm "<phrase>"` 必須 verbatim 匹配：

```
APPLY BLOGGER WITHDRAWAL
```

- Case-sensitive；`apply blogger withdrawal` / `Apply Blogger Withdrawal` 均被拒。
- **不** 接受 `yes` / `y` / `true` / `1`。
- **不** 可透過 env / authorization content / repo file 提供。
- **不** 可省略；缺 `--confirm` → exit 2；空字串 → exit 2；重複 `--confirm` → exit 2。

## 5. Preflight gates（唯一安全入口）

Apply 呼叫既有 `validate-blogger-withdrawal-authorization.js` 之 `preflightWithdrawalAuthorization`
（Slice 4D）並要求下列全部為 `true`：

```
documentValid
repositoryBindingsMatched
planBindingsMatched
recordBindingsMatched
remoteDispositionEligible
explicitlyAuthorized
applyReady          ← 上述五者 AND remoteDispositionEligible
blockers === []
```

任一為 `false`：`applyPerformed=false`、`productionMutationPerformed=false`、
**不** 建立 production temp file、**不** 修改 sidecar。

## 6. Remote-live 拒絕

`withdrawal.remoteDisposition === "remote-live"` 之 authorization（即使 schema-valid、
approved、fingerprints 全對）→ preflight 直接 fail-closed，blockers 含 `remote-disposition-still-live`。
理由：撤回一篇仍公開之 Blogger 文章代表 metadata 與遠端真值脫節；operator 若真要撤回，必須先於
Blogger 後台真的把文章轉草稿 / 刪除，重新驗證 disposition，再產出新 authorization。

## 7. Same-buffer binding

- Authorization raw bytes **只讀一次**（`readFileSync(authorizationPath, 'utf-8')`）；計算
  SHA-256；透過 `preflightWithdrawalAuthorization` 之 `authorizationText` 參數傳入。preflight
  duplicate-key scan / JSON parse / schema validation / binding validation 全部依此份
  in-memory bytes；apply 使用同一份已驗證 `authorization` object。preflight 完成後，
  **不** 再重讀 authorization pathname。
- Source Markdown 讀入單一 `Buffer`（`readFileSync(absSource)`）；計算 SHA-256；
  與 preflight 觀察值比較；transformation 不使用 source（source 全程唯讀）。
- Sidecar 讀入單一 `Buffer`（`readFileSync(absSidecar)`）；計算 SHA-256；與 preflight 觀察值比較；
  transformation 從**此 buffer parse 出的 object** 建構 payload。
- Pre-rename freshness check 為 **compare-only**：重讀 sidecar bytes，若與原 buffer byte-identical
  才繼續；否則拒絕 apply（不覆蓋外部新內容）。此 second read **不** 作為 transformation input。

## 8. Atomic commit（Strategy B；adapter-driven）

Production commit primitive **不** 由本 library 直接以 `renameSync` 執行，而是委由
`atomicCommitAdapter` 執行。CLI **不** 建構 adapter；default library call（無 adapter）
一律於 §8a capability gate fail closed。

當 adapter 已提供時，流程（依序）：

1. 執行 §10a hard-link identity gate 與 §10b realpath / parent junction gate。
2. §8a atomic-commit capability gate 通過。
3. 讀 source / sidecar 為單一 buffer 並比對 preflight-observed SHA-256（TOCTOU pre-check）。
4. Parse sidecar；build transformation payload（reuse `buildWithdrawnSidecar`）；semantic
   validation。
5. 於 sidecar 同 directory 建立 exclusive sibling temp file，檔名
   `.<basename>.apply-<pid>-<suffix>.tmp`，`suffix` 由 `process.hrtime` + attempt counter
   產生（不可預測）。`openSync(candidate, 'wx', 0o600)`；bounded retry 上限 5 次。
6. `writeSync` 寫入完整 bytes；`fstatSync` 驗證 size；`fsyncSync` flush；`closeSync`。
7. `lstat` 再次確認 sidecar target 仍為 regular file、非 symlink、`nlink === 1`。
8. Pre-commit compare-only freshness gate：重讀 sidecar bytes / source bytes，byte-compare
   與 SHA-256 均須等於原 buffer；drift → 拒絕（不進入 adapter.commit）。
9. `atomicCommitAdapter.commit({ tempPath, targetPath, expectedTargetSha256,
   expectedTargetBytes })`：adapter 於其自身之 CAS 或 mandatory-exclusive-lock 語意下重新
   讀 target bytes，若與 `expectedTargetBytes` 不 byte-identical 或 SHA-256 不匹配則拒絕
   （不 rename、target 保留原 bytes）；一致則執行 rename。回傳 `{ ok, blocker? }`。
10. 讀 back production sidecar；byte-compare 與 SHA-256 驗證；schema 驗證。
11. §9a post-commit source freshness gate：重讀 source，若 drift → 進入 rollback
    路徑並保留 `post-write-source-freshness-drift` 為 primary blocker。
12. Cleanup temp（無論成功 / 失敗）。

**永不** 直接 truncate production sidecar、**永不** 先 delete 再 rename、**永不** copyFile 後才驗證、
**永不** 寫 source / 其他 sidecar / deploy repo。

## 8a. Atomic commit capability gate

`resolveAtomicCommitCapability({ atomicCommitAdapter })` 為唯一 authoritative capability
判定，report 含 `atomicCommitSupported` / `atomicCommitStrategy`。`atomicCommitStrategy`
enum 只允許：

```
native-compare-and-swap
mandatory-exclusive-lock
unsupported
```

Adapter 契約：own-property `strategy` ∈ 前二者、own method `commit`；否則 capability 判定為
`{ supported: false, strategy: 'unsupported' }`。Prototype pollution 無法通過 own-property
check；env / argv / authorization content / repo file / JSON 皆不可到達（見 §14a）。

Capability gate 執行時機：於 preflight / hash observation / path safety gate 通過之後、
於 temp file 建立、source / sidecar production write、adapter.commit 之前。

`supported=false` 時：

```
ok = false
applyReady = <preflight verdict（可為 true 表示 authorization ready）>
commitReady = false
applyPerformed = false
productionMutationPerformed = false
tempFileCreated = false
tempFileRemoved = false
readBackOk = false
rollbackAttempted = false
cleanupPerformed = true
cleanupSucceeded = true
blockers 含 "atomic-commit-capability-unavailable"
```

Default CLI / default library call（無 adapter）在本 runtime 必於此 gate fail closed。

## 9. Read-back

- 讀回 production sidecar bytes；bytes must equal writeSync output；SHA-256 must equal
  `outputSha256`。
- 再 parse 為 object；跑 `collectSidecarWithdrawalIssues`；`schemaVersion` 必為 2、
  `blogger.status` 必為 `"withdrawn"`。
- 任一不符 → `readBackOk=false` → 進入 rollback。

## 9a. Post-commit source freshness gate

即使 adapter.commit 成功、read-back 通過，若 source Markdown 在 pre-commit 與此刻之間
drifted，withdrawal lifecycle event 綁定之 `sourceSha256` 已無法描述 source bytes 真值。
本 library **必** rollback sidecar 並保留 `post-write-source-freshness-drift` 為 primary
blocker；不得回 `ok=true`。Rollback 使用 apply 前保留之原始 sidecar buffer；rollback
失敗時 rollback-* blocker 追加於 primary 之後、不覆蓋 primary。

## 10. Rollback

- 條件：production rename 已發生，但（a）read-back 失敗；或（b）post-commit source
  freshness gate 偵測到 source drift。
- Primary blocker（`readback-mismatch` / `post-write-source-freshness-drift`）**必** 於
  rollback 執行前先寫入 blockers；rollback 失敗時 rollback-* blocker append，不得 displace
  primary。
- 使用 apply 前保留之原始 sidecar buffer；同一 temp+rename primitive；不 truncate。
- 成功：`rollbackSucceeded=true` + `rollbackVerified=true` +
  `productionMutationPerformed=false` + `sidecarSha256After=sidecarSha256Before` +
  sidecar bytes 恢復 byte-identical。
- 失敗：blockers 追加 `rollback-*-failed`；`productionMutationPerformed` 保留為 true（mutation
  state unknown）；**絕不** 宣稱 cleanup 成功掩蓋風險。
- Blocker slugs：`rollback-temp-create-failed` / `rollback-temp-write-failed` /
  `rollback-rename-failed` / `rollback-verification-failed`。

## 10a. Hard-link identity gate

Apply 自身於 lstat 完 source / sidecar 後、於 capability gate 之前，執行 dev + ino +
nlink identity check：

- source 與 sidecar 相同 `dev + ino`（皆非 0）→ 拒絕 `source-sidecar-same-file`
- source `nlink > 1` → 拒絕 `source-hard-link-detected`
- sidecar `nlink > 1` → 拒絕 `sidecar-hard-link-detected`
- platform 未提供可信 identity（`ino === 0` 或 non-finite）→ 拒絕 `file-identity-unavailable`

Pre-commit 前重跑 sidecar nlink check；rollback / commit path 中偵測到 `sidecar-hard-link-detected`
即 refuse。

## 10b. Realpath / parent junction gate

Apply 對 project root、source、sidecar 執行 `realpathSync.native`；若 realpath 解析失敗
→ 拒絕 `realpath-unresolvable`。實際 path 必須仍為 project root real path 之 strict
descendant；否則拒絕 `target-outside-project-root-after-realpath`。

對 source 與 sidecar 之每一 intermediate parent segment（不含 leaf）執行 `lstatSync`；若
任何 segment 為 symbolic link / junction / reparse-point → 拒絕
`source-parent-junction-detected` / `sidecar-parent-junction-detected`。

於 OS 不允許建立 junction / reparse point 之 guard 環境，對應 guard 明確 OS-SKIPPED
（不計入 executed PASS），fail-closed production policy 不因 skip 而改變。

## 11. Cleanup

- 每次 apply 結束（成功 / 失敗）皆嘗試清 temp file。
- Report：`cleanupPerformed:true/false` + `cleanupSucceeded:true/false` +
  `tempFileCreated:true/false` + `tempFileRemoved:true/false`。
- Cleanup failure **不** 掩蓋 primary blocker；primary blocker 先加，`temp-cleanup-failed`
  後加，兩者皆保留於 blockers。順序：primary → rollback-* → temp-cleanup-failed；
  deterministic。
- Session 結束後 sidecar dir 不應留下 `.apply-*.tmp` / `.rollback-*.tmp` 殘留。

## 12. Exit codes

```
0   apply succeeded：ok:true / applyPerformed:true / productionMutationPerformed:true
1   apply refused / failed：blockers reported；sidecar 未改 或 已 rollback
2   CLI misuse：unknown flag / forbidden flag / duplicate flag / missing required flag
```

## 13. JSON report

至少包含以下 key（deterministic 順序、fixed keyset；unknown-key 一律不添加）：

```
ok
mode ("apply-blogger-withdrawal")
sourcePath (repo-relative POSIX)
sidecarPath (repo-relative POSIX)
branch
sourceHead
planFingerprint
recordFingerprint
documentValid
repositoryBindingsMatched
planBindingsMatched
recordBindingsMatched
remoteDispositionEligible
explicitlyAuthorized
preflightEligible
applyReady
commitReady
atomicCommitSupported
atomicCommitStrategy
applyPerformed
productionMutationPerformed
authorizationSha256
sourceSha256
sidecarSha256Before
sidecarSha256After
outputSha256
readBackOk
rollbackAttempted
rollbackSucceeded
rollbackVerified
cleanupPerformed
cleanupSucceeded
tempFileCreated
tempFileRemoved
blockers
```

`applyReady` 反映 preflight（authorization）verdict；`commitReady` 進一步要求
`atomicCommitSupported === true` 與 path safety gate 均通過。`applyReady:true`
且 `commitReady:false` 之組合表示 authorization 已通過但目前 runtime 無法安全執行 commit。

## 14. Redaction

Report 與 stderr **絕不** 回顯：

```
Blogger URL / Blogger host / bloggerPostId
publishedAt / operator identity / operator email
authorization absolute path
project absolute path / scratch absolute path
raw fs error message / errno / stack trace
secret token / API key / credential
```

回顯只含：boolean / repo-relative POSIX path / SHA-256 hex / git40 hex / enum / 安全短碼
（穩定、機器可判讀）。Human-readable 與 JSON 語意一致。

## 14a. Adapter isolation

`atomicCommitAdapter` 只能透過 direct programmatic API 傳入（`applyBloggerWithdrawal({
projectRoot, authorizationPath, hooks, atomicCommitAdapter })`）；本 CLI **不**構造、
**不**接受、**不**轉發 adapter。無 adapter 之 library call 於 §8a fail closed。

Guard 需靜態證明：

```
CLI source 不出現 atomicCommitAdapter / atomicCommitStrategy / commitAdapter reference
apply library 不從 process.env / process.argv / authorization content / repo file /
  JSON parse 讀取 adapter
adapter 之 strategy field check 為 Object.prototype.hasOwnProperty own-property check，
  prototype chain 不生效
```

## 15. CLI examples（placeholder；不使用真實 URL / identity）

```
# Show help (no filesystem access, no preflight).
node src/scripts/apply-blogger-withdrawal.js --help

# Attempt apply against an authorization file that lives OUTSIDE the repo.
# On the current runtime (Node.js on Windows, no supported CAS / mandatory lock
# primitive) this will fail closed at the atomic-commit capability gate with
# blocker `atomic-commit-capability-unavailable`; no temp file, no write, no
# rename will be performed.  Preflight is still executed and reported.
node src/scripts/apply-blogger-withdrawal.js \
  --authorization "/absolute/path/to/authorization.json" \
  --apply \
  --confirm "APPLY BLOGGER WITHDRAWAL" \
  --json

# npm form.
npm run apply:blogger-withdrawal -- \
  --authorization "/absolute/path/to/authorization.json" \
  --apply \
  --confirm "APPLY BLOGGER WITHDRAWAL"
```

**Placeholder paths / URLs above are for documentation only。真實 authorization 之路徑、
真實 candidate 之 slug / URL、真實 operator identity **絕不** 出現在 docs、CLAUDE.md、
`content/**` 或 fixtures。**

## 16. Rehearsal ≠ apply

- `rehearse:blogger-withdrawal` 於 `os.tmpdir()` 之隔離副本上執行 mutation 演練；
  完成後 unconditional cleanup；production sidecar **完全未變**。
- `apply:blogger-withdrawal` 對 production sidecar 執行 mutation。兩者共用同一
  `buildWithdrawnSidecar` transformation authority，但**寫入 target 完全不同**：
  rehearsal = OS-temp scratch；apply = production sidecar。
- Rehearsal PASS **不代表** apply PASS；每次 apply 前仍會重跑 preflight（含 TOCTOU
  freshness gate）。
- 對真實 candidate 之 apply 必須另開獨立 Session；本 Slice 4I 之 landing session
  **不** 對真實 production candidate 執行 apply。

## 17. 本工具不操作 Blogger

- **不** 呼叫 Blogger API / Google API。
- **不** 把文章從 Blogger 後台刪除 / 轉草稿。
- Apply 之後 Blogger 後台狀態**仍為 apply 前之 remote disposition**；只有 operator 手動
  於 Blogger 後台完成該動作，才能真正改變遠端狀態。
- 本工具**只** 改本 repo 之 `.publish.json` 一份。metadata 上 sidecar 變 withdrawn 之後，
  build / preview / redraft 等 consumer 才會停止把該篇當作 active publication；此為 Slice
  4A / 4B 已 landed 之 consumer-side gate，不由本 Slice 建構。

## 18. 本工具不 commit、不 push

- Apply 完成後，`git status` 會看到 sidecar dirty；但本工具**不**執行 `git add` /
  `git commit` / `git push` / `git reset` / `git restore` / `git checkout`。
- 後續 commit / push 由獨立 audit + push Session 處理，operator 各須明確授權；本 Slice
  之 CLI **不** 提供對應 flag。

## 19. 真實 apply 必須另開獨立 Session

單一 Session **不** 得同時完成：build capability 實作 + adversarial guard + 對真實
production candidate 執行 apply + post-commit audit + push。真實 apply 之流程必須包含：

```
1. 獨立 post-commit audit
2. 獨立 push-only Session
3. Operator 重新確認 remote disposition
4. Operator 提供核准 authorization（於 repo 外儲存）
5. 獨立真實 apply Session
```

不得合併上述階段；每階段須 operator 明確授權；guard 出錯時全體 rollback。

---

參考：

- `docs/20260722-blogger-withdrawal-rehearsal.md`（Slice 4E rehearsal 契約）
- `docs/20260722-blogger-withdrawal-authorization-preparation.md`（Slice 4D authorization / preflight）
- `docs/20260721-blogger-withdrawal-planner.md`（Slice 4C read-only planner）
- `docs/20260720-publish-target-stage-contract.md`（stage 三者正交）
- `docs/publish-json-schema.md` §5.7 / §9（withdrawn / schemaVersion 2 / lifecycle）
