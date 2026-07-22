# Blogger Withdrawal Authorization — Preparation + Read-only Preflight（Slice 4D）

Phase：`20260722-publish-target-stage` Slice 4D
狀態：landed（single local commit；**未 push**）
上位契約：
- `docs/20260721-blogger-withdrawal-planner.md`（Slice 4C：read-only withdrawal planner）
- `docs/20260720-publish-target-stage-contract.md`（stage 三者正交；missing→production；invalid fail-closed）
- `docs/publish-json-schema.md` §5.7 / §9（withdrawn / schemaVersion 2 / lifecycle）
- Slice 4A：`src/scripts/active-publication.js`
- Slice 4B：`src/scripts/sidecar-withdrawal-contract.js`

---

## 0. 這個 Slice 在整條 withdrawal pipeline 的位置

本 Slice **只**新增兩個 operator-facing、唯讀的工具與一個 fixture guard。它**不**執行真正的撤回，
也**不**建立任何 rehearsal / production apply capability。完整未來管線（每一步皆須獨立授權）：

```
1. plan:blogger-withdrawals                     Slice 4C；read-only planner（列 candidate）
2. Remote disposition verification              人工；operator 親自到 Blogger 後台確認遠端真值
3. prepare:blogger-withdrawal-authorization     ★ 本 Slice；read-only、stdout-only draft generator
4. Operator review + 手動批准                    人工；operator 於 repo 外 review、flip explicitlyAuthorized
5. validate:blogger-withdrawal-authorization    ★ 本 Slice；read-only preflight validator
6. Future rehearsal                             ❌ 尚未存在（OS-temp write exercise；未來獨立 Slice）
7. Future production apply                       ❌ 尚未存在（mutate-in-place sidecar；未來獨立 Slice）
8. Future commit                                ❌ 須後續獨立授權（本工具永不 commit）
9. Future push                                  ❌ 須後續獨立授權（本工具永不 push）
```

以下九節依序說明每一步；★ 為本 Slice 實作範圍。

---

## 1. Planner（Slice 4C，回顧）

`plan:blogger-withdrawals` 掃 `content/blogger/posts/`，列出「Blogger target stage=preview 且 sidecar 仍為
active publication（status=published + 非空 publishedUrl）」的 withdrawal-investigation candidate。每個
candidate 初始恆為 `remoteDisposition:null` / `authorizationEligible:false` /
`nextAction:"verify-remote-disposition"`。planner **不**取得遠端真值、**不**建立 authorization。

現行真實 repo：`candidateCount:1`（`content/blogger/posts/20260612-after-work-writing-time-blocking.md`）、
`authorizationEligibleCount:0`、`mutationPerformed:false`。

## 2. Remote disposition verification（人工，非本工具）

`remoteDisposition` 是 **operator-provided fact**。system **不**呼叫 Blogger / Google API、**不**讀後台、
**不**網路查詢文章是否仍存在，也**不**把 planner 的 `null` 轉成任何預設值。operator 必須親自到 Blogger
後台確認遠端狀態，再把結論以 CLI 參數提供給 draft generator。

合法 remote disposition enum（**沿用** `sidecar-withdrawal-contract.js` 已落地之精確值，**不**新增、
**不**接受大小寫變體 / whitespace / 舊值 `confirmed-inactive`）：

```
remote-live
remote-draft
remote-deleted
remote-unavailable
remote-permalink-changed
operator-confirmed-inactive
```

## 3. Authorization draft preparation（★ 本 Slice）

指令：

```
npm run prepare:blogger-withdrawal-authorization -- \
  --source-path content/blogger/posts/<slug>.md \
  --remote-disposition <landed-enum> \
  --remote-verified-at <timezone-aware-ISO> \
  --reason <landed-reason-enum> \
  [--reason-detail <text>]
```

行為契約（`src/scripts/prepare-blogger-withdrawal-authorization.js`）：

- **只**輸出 stdout（deterministic JSON draft）；**永不**寫檔、**不**接受 output path。
- 綁定當前 source repo HEAD、withdrawal plan fingerprint、per-record fingerprint、target
  source/sidecar path 與其 SHA-256、published URL fingerprint、現行 sidecar status。
- `approval.explicitlyAuthorized` 由 `buildDraft` **硬編碼 boolean `false`**；本檔**無任何** in-band code
  path 會把它設為 `true`；**不**提供 `--approve` / `--yes` / `--force` / `--auto-approve`。
- **不**驗證遠端 Blogger 真值；**不**自動批准。remote disposition 純為 CLI operator input。
- **不**使用目前時間、**不**產生 `generatedAt`；所有時間來自 `--remote-verified-at`（或之後 operator edit）。
- 輸出**不含** absolute path、raw `publishedUrl` / `publishedAt` / `bloggerPostId`（只含 fingerprint /
  SHA-256 / status enum）。
- 成功時 stdout 只有 draft（可直接 `JSON.parse`），stderr 為空。
- fail-closed：缺 operator 提供之有效 remote disposition（或 source-path 非現行 candidate）→ 不生成
  半成品 draft。

repository state gate（fail-closed）：branch==main、HEAD==origin/main、ahead/behind==0/0、working tree
clean、`.git/index.lock` absent（重用 `admin-git-safety-preflight.js` 之 vetted read-only git runner）。

## 4. Operator review 與手動批准（人工，非本工具）

operator 必須：

1. 逐字 review 印出的 JSON draft。
2. 把 stdout 存到 **source repo 之外**（或某個 `.gitignore` 路徑）；否則 working tree 變髒，未來
   preflight / apply 會拒絕。
3. 唯有在 plan 與 target 確實是要撤回的對象時，才把 `approval.explicitlyAuthorized` 手動改為 `true`。

## 5. Read-only authorization preflight（★ 本 Slice）

指令：

```
npm run validate:blogger-withdrawal-authorization -- \
  --authorization <path-outside-repo> \
  --source-path content/blogger/posts/<slug>.md \
  [--json]
```

行為契約（`src/scripts/validate-blogger-withdrawal-authorization.js`）：唯讀。讀 authorization、重跑
withdrawal planner、重讀 source Markdown 與 sidecar、重算 source/sidecar SHA-256、重算 plan fingerprint 與
record fingerprint、重取 Git HEAD，驗證 branch==main、HEAD==origin/main、ahead/behind==0/0、working tree
clean、無 `.git/index.lock`、`dist-blogger-preview/` absent、candidate 仍存在且恰好一筆、
source/sidecar path 完全吻合、remote disposition 屬已落地 enum、reason 屬已落地 enum、timezone-aware ISO
以現行嚴格 calendar parser 驗證。

三層分類：

```
documentValid              authorization 通過 strict schema
repositoryBindingsMatched  repo-state eligible + HEAD/branch 吻合 + 無 preview artifact
planBindingsMatched        重算 plan fingerprint 吻合
recordBindingsMatched      candidate unique + path/hash/status/URL-fingerprint 吻合 + record fingerprint 吻合
explicitlyAuthorized       approval.explicitlyAuthorized === true
applyReady = 上述五者皆真
mutationPerformed = false（invariant）
```

**`applyReady:true` 只表示 bindings 與 approval 通過，並不表示本指令已寫入任何位元組。即使
`applyReady:true`，validator 也不執行任何 apply。** 本工具**永不** apply / 寫檔 / 修改 repository /
驗證遠端真值 / 呼叫任何 API / 連網。輸出**不**回顯 authorization file path 或其內容。

## 6. Future rehearsal（尚未存在）

未來的 OS-temp write rehearsal（把撤回意圖套到 synthetic sidecar 副本以驗證 write primitive）**尚未在
本 Slice 實作**，須另開獨立 Slice + Dean explicit approval。

## 7. Future production apply（尚未存在）

真正的 mutate-in-place（把既有 active-published sidecar 轉為 `withdrawn` + 追加 lifecycle event）
**尚未在本 Slice 實作**，須另開獨立 Slice + Dean explicit approval。與 backfill 的 create-only apply 不同，
withdrawal 是 mutate-in-place：target state / fingerprint payload / preconditions / write primitive 皆不同，
故 authorization 為**獨立** contract（purpose `blogger-sidecar-withdrawal`，見 §11）。

## 8. Future commit（須後續獨立授權）

本 Slice 之工具**永不** git add / commit。任何後續 commit 都是獨立、需明確授權的步驟。

## 9. Future push（須後續獨立授權）

本 Slice 之工具**永不** git push。任何後續 push 都是獨立、需明確授權的步驟。

---

## 10. Draft / authorization 儲存慣例

authorization draft **必須存到 operator-private 或其他 repo 外位置**（或 `.gitignore` 路徑）。本系統
**不**建立 repo-internal authorization storage 慣例；authorization 檔只作為 validator 的唯讀輸入。

## 11. Landed authorization schema（實際落地欄位）

Strict allowlist（top-level 與每個 nested object；unknown key fail-closed），固定 key order：

```json
{
  "schemaVersion": 1,
  "purpose": "blogger-sidecar-withdrawal",
  "repository": {
    "expectedBranch": "main",
    "expectedHead": "<40-lowercase-hex>"
  },
  "plan": {
    "expectedPlanFingerprint": "<64-lowercase-hex>",
    "expectedRecordFingerprint": "<64-lowercase-hex>",
    "recordCount": 1
  },
  "target": {
    "sourcePath": "content/blogger/posts/<slug>.md",
    "sidecarPath": "content/blogger/posts/<slug>.publish.json",
    "expectedSourceSha256": "<64-lowercase-hex>",
    "expectedSidecarSha256": "<64-lowercase-hex>",
    "expectedCurrentStatus": "published",
    "expectedPublishedUrlFingerprint": "<64-lowercase-hex>"
  },
  "withdrawal": {
    "event": "withdrawn",
    "remoteDisposition": "<landed-enum>",
    "remoteVerifiedAt": "<timezone-aware-ISO>",
    "reason": "<landed-reason-enum>",
    "reasonDetail": ""
  },
  "approval": {
    "explicitlyAuthorized": false
  }
}
```

Strict 規則要點（fail-closed，皆回固定 safe slug、不回顯內容）：`schemaVersion===1`、
`purpose==="blogger-sidecar-withdrawal"`（wrong purpose → fail）、`expectedBranch==="main"`、`expectedHead`
為 40-char lowercase hex、fingerprints 為 64-char lowercase hex、`recordCount===1`（integer；`0`/`2`/`"1"`
皆 fail）、`target.sourcePath` 為 canonical POSIX `.md`（拒 absolute / URI / backslash / `..` / empty
segment / `.fb.md`）、`sidecarPath` 唯一由 sourcePath 推導且吻合、`expectedCurrentStatus==="published"`、
`event==="withdrawn"`、`remoteDisposition` 屬 §2 enum、`remoteVerifiedAt` 以已落地 strict calendar parser
驗證、`reason` 屬 `sidecar-withdrawal-contract.js` reason enum、`reasonDetail` 為字串（允許空字串）、
`approval.explicitlyAuthorized` 必為真正 boolean（`1` / `"true"` / `"yes"` 皆非授權）、duplicate semantic
key fail-closed。

reason enum（沿用 `sidecar-withdrawal-contract.js`）：`stage-preview` / `content-retirement` /
`publication-error` / `policy` / `migration` / `other`。

## 12. Fingerprint contract（§六）

canonical deterministic serialization（sorted keys；TZ-independent；POSIX/Windows path separator 無漂移）。

- **Plan fingerprint** 綁：plan version / git head / candidate count / 每個 candidate 之 relative
  source+sidecar path / current status / classification / published URL fingerprint。**不**綁 current time
  / temp path / absolute path / raw published URL / raw post id / operator identity / authorization path。
- **Record fingerprint** 綁：`operation:"withdraw"` / sourcePath / sidecarPath / expectedCurrentStatus /
  expectedSourceSha256 / expectedSidecarSha256 / expectedPublishedUrlFingerprint / remoteDisposition /
  remoteVerifiedAt / reason / reasonDetail。任一綁定值改變 → record fingerprint 改變。

兩者以固定 `fingerprintKind` 前綴命名空間隔離。published URL fingerprint algorithm **沿用** planner 之
`sha256(exact publishedUrl string)`（不重新發明）。

## 13. Error redaction（§八）

CLI stderr / human / JSON / blocker 均為固定 safe slug，**絕不**回顯：raw published URL / Blogger host /
Blogger post id / publishedAt / operator name / operator email / authorization file path / OS temp path /
repository absolute path / gitdir path / stack trace / raw fs error。unexpected error 一律轉固定
`unexpected-internal-error`。guard 注入 secret 字串後於所有 stdout / stderr / serialized blocker 驗證零命中。

## 14. CLI / exit-code contract

```
success                              exit 0
authorization not apply-ready        validator exit 1（documented）
usage / unknown / forbidden flag     exit 2
internal safe failure                exit 1
--help                               exit 0（不掃描 repo）
```

Forbidden flags（任一出現 → exit 2）：`--apply` / `--write` / `--force` / `--yes` / `-y` / `--approve` /
`--auto-approve` / `--skip-validation` / `--skip-fingerprint` / `--ignore-head` / `--dirty-ok` /
`--no-verify` / `--production` / `--publish` / `--deploy` / `--commit` / `--push` / `--restore` /
`--republish` / `--api` / `--repo-root` / `--project-root` / `--test-root` / `--output` / `--out` /
`--save`。`--repo-root` 等 test-root 覆寫只在程式 API 暴露（供 guard 驅動 synthetic OS-temp repo），
CLI 不暴露。

## 15. 檔案

- `src/scripts/blogger-withdrawal-authorization.js`（shared contract：schema 常數 / allowed-key sets /
  canonical fingerprint / strict loader / draft builder / safe error boundary；single source of truth）。
- `src/scripts/prepare-blogger-withdrawal-authorization.js`（read-only、stdout-only draft generator）。
- `src/scripts/validate-blogger-withdrawal-authorization.js`（read-only preflight validator）。
- `src/scripts/check-blogger-withdrawal-authorization.js`（focused guard；OS-temp synthetic git repo +
  in-memory fixtures；**186/186 PASS**）。
- `docs/20260722-blogger-withdrawal-authorization-preparation.md`（本文件）。
- `package.json`（`prepare:blogger-withdrawal-authorization` / `validate:blogger-withdrawal-authorization`
  / `check:blogger-withdrawal-authorization`）。

## 16. Guard baselines（本 Slice 實跑）

```
check:blogger-withdrawal-authorization   186/186 PASS（新增）
check:blogger-withdrawal-plan            94/94 PASS
check:sidecar-withdrawal-schema          57/57 PASS
check:active-blogger-publication         40/40 PASS
check:publish-target-stage               69/69 PASS
validate:content                         0 error / 136 warning / 108 post
check:blogger-preview-plan               44 / 0 PASS
check:build-blogger-preview              61 / 0 PASS
check:npm-script-targets                 141/141 PASS（+3 個新 .js target）
check:docs-npm-run-refs                  82/82 PASS
check:docs-node-script-refs              30/30 PASS
plan:blogger-withdrawals（real）         scanned 12 / candidate 1 / needsRemoteVerification 1 /
                                         authorizationEligible 0 / blocked 0 / mutationPerformed false
```

## 17. 邊界（本 Slice 明確不做）

不 push；不建立真實 operator authorization；不執行 rehearsal 或 production apply；不建立 sidecar writer /
rollback / restore / republish / remote action / Blogger API integration；不修改任何 `content/**`（含
sidecar / markdown / template）；不修改 withdrawal sidecar contract 語意、validator truth table、
active-publication helper、canonical URL consumers、blogger / GitHub builder、Blogger preview
planner / builder、backfill apply tools、deploy repository、`.gitignore`、lockfile。下一步（rehearsal /
production apply / remote verification / commit / push）**必須各自另開獨立 Slice + Dean explicit approval**。
