# Phase 2 ADMIN Write-Path — Production-Target Dry-Run Plan（docs-only）

> Phase: `20260617-pm-phase2-admin-write-path-production-dry-run-plan-docs-only-a`
> Date: 2026-06-17（Asia/Taipei）
> Type: **docs-only plan**。唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages / `.cache` / CLAUDE.md / MEMORY.md。
> Scope: 設計「未來如何對 production content markdown 做 **dry-run diff only**」之操作規則。**本 session 不執行 production dry-run、不寫入任何 content。**
>
> ⚠️ 本文件**不是**實作核可，也**不**啟用 write-path。它記錄「未來 production-target dry-run」之 plan / target-selection rules / command policy / review checklist / stop conditions，供 Dean 審閱後，於另一個 phase 才決定是否實際執行（且仍須 explicit approval）。既有 write-path infra 維持 **dormant**。

---

## 1. Baseline（phase 開始前 / read-only verification）

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| pre-phase HEAD | `a8492ee`（full `a8492ee4b47455a14573130573abed2aa5316229`） |
| origin/main | `a8492ee` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `docs(admin): record write path fixture dry-run proof` |
| fixture-only proof（carry-forward） | **209 pass / 0 fail**（`npm run safe-write:test`，OS-temp fixtures only，cleanup completed；`docs/20260617-phase2-admin-write-path-fixture-dry-run-proof.md`） |

→ Baseline 完全符合 frozen baseline `a8492ee`。未 pull / merge / reset / rebase / amend / force-push。

**前置 lineage**：preanalysis（`docs/20260617-phase2-admin-write-path-preanalysis.md`）→ design acceptance（`docs/20260617-phase2-admin-write-path-design-acceptance.md`，採保守 A→B 漸進路線）→ fixture-only dry-run proof（`docs/20260617-phase2-admin-write-path-fixture-dry-run-proof.md`，Step 3 完成）。本 doc 為 design acceptance §5 之 **Step 4（production-target dry-run diff only）的 plan**，**尚不執行 Step 4**。

Carry-forward acceptance numbers（**本 phase 不重跑**；引用 CLAUDE.md §3a / fixture proof）：

- `safe-write:test` = **209 pass / 0 fail**（OS-temp fixtures only；本 phase 未跑）。
- `validate:content` = 0 errors / 94 warnings / 84 issue-posts（production-post warnings = 0）。
- 其餘 guard 皆 carry-forward green。

---

## 2. Purpose

- 規劃**未來** production-target **dry-run diff only** 之操作規則。
- ❌ **no production write**（本 session 不寫入任何 content）。
- ❌ **no Admin Apply**（browser → Node fs 通道維持關閉；FB Apply 永久 disabled）。
- ❌ **no middleware / API**（`vite.config.js` 無 `configureServer` / `app.post` / `fs.writeFile`）。
- ❌ **no build / deploy / repost**（write-path 與 build / deploy / Blogger repost 完全解耦）。

本 doc 只是 plan；任何對 production `.md` 之實際 dry-run 須由 Dean 於 §11 推薦之 next phase 另行 approve。

---

## 3. Definition of production-target dry-run

「production-target dry-run」嚴格定義為：

1. **reads one selected production markdown file** —— 讀取單一已選定之 production `.md`。
2. **computes proposed frontmatter patch/diff only** —— 僅計算 frontmatter 之 proposed patch / byte-diff。
3. **produces diff summary** —— 產出 diff summary（field / oldLen / newLen / changed / bytesChanged / bytesDelta）。
4. **does not write file** —— 不對檔案做任何 `fs.writeFile` / `fs.rename`。
5. **does not commit** —— 不 `git add` / `git commit` / `git push`。
6. **does not publish / repost** —— 不 build / deploy / Blogger repost。
7. **does not change status** —— 不改 `status` 欄位、不改任何發布狀態。

**Factual grounding（read-only 查證，CLI 既有行為）**：`admin-write-cli.js` 在未帶 `--apply` 且 `payload.dryRun:true` 時走 dry-run path（`if (!wantsRealWrite)`），輸出 `mode:'dry-run'` / `written:false` / `diffSummary` / `bytesDelta`，**無任何 fs write**。real-write 須**同時** `--apply` flag **且** `payload.dryRun === false`（缺一即 reject）。本 plan 之 dry-run 完全落在前者，永不滿足 real-write 條件。

---

## 4. Target selection rules

- **single file only** —— 一次僅一個 target 檔。
- **path only** —— 以明確相對路徑指定；不接受隱式 / 推斷 target。
- **must be allowlisted content path** —— 須通過 `admin-write-whitelist.js`：僅 `content/{github,blogger}/posts/*.{md,publish.json,fb.md}`；本 plan 首批僅 `*.md`（CLI `kind === 'post-md'`）。
- **no glob / bulk / folder write** —— 禁批次 / glob / 資料夾層級。
- **target should start with draft article only** —— 首批 target 僅限 `status: draft` 文章。
- **published / ready articles out of scope** —— `published` / `ready` 文章不在首次 production dry-run 範圍，**除非 Dean explicitly approves**。
  - 註：CLI dry-run status set 雖接受 `{draft, ready}`，但**本 plan 自我收窄至 draft-only**；ready 須 Dean 明示才納入。
- **target field should start with low-risk field only** —— 首批欄位僅限低風險 inline scalar，如 `description` 或 `searchDescription`（= CLI `ALLOWED_FIELDS`）。
- **expectedOldValue required** —— 必填；須逐字複製自 current frontmatter（CLI mismatch → exit 6）。

### 4.1 候選 target（target-selection 設計用；本 session 不讀取內容、不 dry-run、不編輯）

allowlisted path 內、`status: draft` 之 production posts（僅列路徑供設計）：

```
content/blogger/posts/20260529-phonics-practice-sheet-download.md
content/blogger/posts/20260525-draft-book-review.md
content/blogger/posts/20260504-sample-book-review.md
```

→ 上述僅為 target-selection 設計參考；**Dean 於 §6 / §11 明示單一 target 前，皆不選定、不讀內容、不 dry-run**。templates（`content/templates/**`）與 validation-fixtures 非 allowlisted posts path，**排除**。

---

## 5. Candidate criteria（target 適格條件）

target 須**同時**滿足以下全部條件，否則不列入首批：

- **draft status** —— `status: draft`。
- **non-live / non-Blogger-published** —— 非已上線、非 Blogger 已發布（無 live URL 牽連）。
- **simple inline frontmatter scalar** —— 目標欄位為單行 inline scalar。
- **no block scalar** —— 不得為 block scalar（`|` / `>`）；CLI patcher fail-closed on block scalar。
- **no duplicate key** —— frontmatter 無重複 key；CLI patcher fail-closed on duplicate key。
- **no nested field** —— 不碰 nested field。
- **no commerce registry mutation** —— 不動 `affiliate.blocks[]` / `links[].ref` / `content/settings/commerce-links.json`。
- **no relatedLinks / books / hashtags mutation** —— 不動 `relatedLinks[]` / `otherLinks[]` / `book.*` / `tags[]`。
- **no publish metadata mutation** —— 不動 `blogger.publishedUrl` / `publishedAt` / `bloggerPostId` 等發布 metadata。

---

## 6. Required inputs from Dean before actual production-target dry-run

未來實際跑 production-target dry-run 前，Dean 須提供以下全部：

1. **exact target markdown relative path** —— 精確相對路徑（單一檔）。
2. **exact field name** —— 精確欄位名（首批 `description` 或 `searchDescription`）。
3. **expectedOldValue copied from current frontmatter** —— 逐字複製自 current frontmatter 之舊值。
4. **newValue** —— 欲提案之新值。
5. **confirmation that dry-run only is approved** —— 明示僅核可 dry-run。
6. **confirmation no write / no commit / no publish** —— 明示不寫入 / 不 commit / 不發布。

缺任一項 → 不進入 dry-run。

---

## 7. Dry-run command policy

> ⚠️ **本 docs phase 只記錄 command form，不執行。** 本 session 未跑 `safe-write:test`、未跑 `admin:write`、未直接呼叫 `admin-write-cli.js`、未傳 `--apply`、未用 `dryRun:false`、未對 production 跑任何 dry-run。

- **documented but not executed in this docs phase** —— 僅文件化下列 command form 供未來 phase 參考。
- **`dryRun` must remain true or default and must not include `dryRun:false`** —— payload 之 `dryRun` 須為 `true`（或預設 dry-run path）；**絕不**含 `dryRun:false`；**絕不**傳 `--apply`。
- **output must be captured** —— 未來執行時須擷取 stdout JSON（`mode` / `written` / `diffSummary` / `bytesDelta` / `changed`）與 stderr lines。
- **git status must be checked before and after** —— 執行前後皆須 `git status --short --branch` 對照。
- **if working tree becomes dirty, stop immediately** —— 若 working tree 變 dirty（理論上 dry-run 不該發生），**立即停止**並回報。

### 7.1 Command form（未來 phase 用；本 session 不執行）

未來 phase 之 dry-run 將以 payload 檔（JSON）形式呼叫；payload 須含 `dryRun:true`，**不**帶 `--apply`：

```jsonc
// payload（未來 phase 由 Dean 提供值；dryRun 固定 true）
{
  "targetRel": "content/blogger/posts/<draft-post>.md",
  "field": "description",            // or "searchDescription"
  "newValue": "<Dean-provided>",
  "expectedOldValue": "<copied-verbatim-from-current-frontmatter>",
  "dryRun": true
}
```

→ command form 之實際 invocation 將於 §11 next phase 之後、且 Dean explicit approval 下才執行；本 doc **不**示範執行、**不**附實跑輸出。

---

## 8. Review checklist after future dry-run

未來 dry-run 跑完後，須逐項核對：

- [ ] **diff summary matches only intended field** —— diff 僅涉指定欄位，無旁及其他欄位。
- [ ] **bytesDelta reasonable** —— `bytesDelta` 與「新舊值長度差」相符、合理。
- [ ] **no file changed on disk** —— 磁碟上無檔案被改（dry-run `written:false`）。
- [ ] **git status remains clean** —— working tree 仍 clean、HEAD 不變。
- [ ] **no source / package / content mutation** —— 無 source / package / content 變動。
- [ ] **no build / deploy / repost** —— 未 build / deploy / repost。
- [ ] **no Admin Apply / middleware / API** —— 未啟用 Admin Apply / middleware / API。

任一項不符 → 視為 stop condition（§9）。

---

## 9. Stop conditions

下列任一情況**立即停止**並回報，不繼續：

- **target not allowlisted** —— target 不在 allowlist（whitelist reject / exit 4）。
- **target is published/ready without explicit approval** —— target 為 `published` / `ready` 且無 Dean explicit approval。
- **expectedOldValue mismatch** —— expectedOldValue 與 current frontmatter 不符（exit 6）。
- **patcher rejects frontmatter** —— patcher 拒絕（block scalar / missing key / duplicate key；exit 8）。
- **field validator rejects value** —— 欄位 validator 拒絕新值（exit 7）。
- **command proposes unexpected change** —— command 提案非預期之變更。
- **any file becomes modified** —— 任何檔案被改動。
- **any warning / error appears** —— 出現任何 warning / error。

---

## 10. Remaining gap before actual write

actual write（Step 5）之前仍存在之 gap（**本 plan 不解決，留待獨立 future phase**）：

- **`validate:content` gate not yet integrated** —— CLI 尚未 spawn post-write `validate:content`；須整合或以 manual gate 補。
- **rollback instructions required** —— 每次 write 須附 rollback 指示（`git restore <file>`）。
- **backup / restore point policy required** —— 須明定 backup / restore point 政策（working tree clean 作為 restore point；dirty 拒寫）。
- **actual write must be separate future phase** —— actual write 須為獨立 future phase，不在本 plan、不在 §11 next phase。
- **actual write requires explicit Dean approval** —— 每次 actual write 前皆須 Dean 明示。
- **actual write must still keep build / deploy / repost decoupled** —— actual write 仍須與 build / deploy / repost 完全解耦。

---

## 11. Recommended next phase

```
20260617-pm-phase2-admin-write-path-production-dry-run-target-intake-readonly-a
```

- **Goal**：Dean 選定一個 safe draft target 與對應值；Claude 僅 **read-only** 驗證 target suitability（is allowlisted / is draft / field 是 inline scalar / 取得 expectedOldValue）並準備 command preview，**仍不執行**，除非另行 approve。
- **Do not execute yet** —— 該 phase 仍為 read-only / intake；任何 dry-run 之實際開跑須再經 Dean explicit approval。

---

## 12. Guardrails（本 doc 之自我約束）

- ❌ This doc must **not** claim production dry-run has been executed.（本 session **未**執行 production dry-run。）
- ❌ This doc must **not** claim production write is allowed.（production write **未**被允許。）
- ❌ This doc must **not** enable Admin Apply.（Admin Apply 維持 disabled。）
- ❌ This doc must **not** change Phase 1 history.（不改寫 / 不降級 Phase 1 final history。）
- ❌ This doc must **not** alter source or content.（唯一 mutation = 本 doc 新增。）

並沿用本 session hard rules：no `safe-write:test`；no `admin:write`；no `admin-write-cli.js` 直接呼叫；no production-target dry-run；no `--apply`；no `dryRun:false`；no production content write；不改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / CLAUDE.md / MEMORY.md；不 build / deploy / Blogger repost；不啟用 middleware / API / Admin Apply；不新增 npm dependency；不 amend / rebase / force-push。

---

## 13. Cross-links

- `docs/20260617-phase2-admin-write-path-preanalysis.md`（Phase 2 入口 preanalysis）
- `docs/20260617-phase2-admin-write-path-design-acceptance.md`（保守 A→B 漸進路線 design acceptance；§5 Step 4 = 本 plan 之對象）
- `docs/20260617-phase2-admin-write-path-fixture-dry-run-proof.md`（fixture-only proof，209/0；Step 3 完成）
- `docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md`（CLI write driver / payload schema / exit codes / byte-exact gate）
- `docs/20260528-admin-write-phase-4p5e-yaml-drift-mitigation-preanalysis.md`（YAML emitter drift mitigation / patcher 行為）
- `CLAUDE.md` §8 / §28 / §29（第二階段 / MVP 必做 / 第一版不做清單）

---

## 14. Acceptance（本 phase 自身）

| 項目 | 結果 |
| --- | --- |
| baseline verify（branch / HEAD / origin / ahead-behind / clean） | ✅ `main` / `a8492ee` / 0-0 / clean |
| 唯一 file change | `docs/20260617-phase2-admin-write-path-production-dry-run-plan.md`（新增） |
| 未改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` | ✅ |
| 未改 CLAUDE.md / MEMORY.md | ✅ |
| no `safe-write:test` / no `admin:write` / no `admin-write-cli.js` 直接呼叫 | ✅ |
| no production-target dry-run / no `--apply` / no `dryRun:false` / no production content touched | ✅ |
| middleware / API / Admin Apply remain disabled；dormant write-path 維持 dormant | ✅ |
| 未 build / deploy / repost / npm install / merge / rebase / reset / amend / force-push | ✅ |

→ docs-only plan，acceptance trivially PASS。

---

（本文件結束）
