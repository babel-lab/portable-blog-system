# Phase 2 — Admin UI Static Payload Preview Implementation Plan（docs-only）

> Session: `20260617-pm-phase2-admin-ui-static-payload-preview-implementation-plan-docs-only-a`
> Date: 2026-06-17（Asia/Taipei）
> Type: **docs-only implementation plan**。唯一 mutation = 本 doc 新增。
> **不**做 source implementation；**不**改 Admin UI；**不**啟用 Apply；**不**啟用 middleware / API；**不**做 browser-to-filesystem write；**不**執行任何寫入；**不**核准任何未來寫入。

---

## 1. Purpose

- 為 **未來 Admin UI static payload preview / command preview panel** 撰寫一份可被驗收的 **實作計畫（implementation plan）**，把上一個 read-only source preflight（verdict PASS）之發現，固化為「未來 source phase 該怎麼做、該守哪些紅線、該怎麼驗收」的逐項規格。
- **本 phase 是 docs-only plan**：
  - ❌ **no implementation in this phase** —— 不改 `src/views/admin/index.ejs` 或任何 view / JS / SCSS / script。
  - ❌ **no write authorization** —— 本 plan **不**核准任何未來寫入；dry-run approval ≠ actual-write approval；每次 actual write 仍須 Dean fresh explicit approval。
  - ❌ 不啟用 Admin Apply；不啟用 middleware / API / POST endpoint / dev-server `fs.writeFile`；不執行任何 `admin:write` / `admin-write-cli.js` / `safe-write:test` / production dry-run / `--apply` / `dryRun:false`。
  - ❌ 不改變 Phase 1 / Blogger live publishing 行為；不 build / deploy / Blogger repost；不跑 validate / guard；不起 dev server；不重生 `.cache`；不開第三次 write；不建 payload 檔。

---

## 2. Baseline

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| pre-phase HEAD（short / full） | `aaa2463` / `aaa2463af6ad9acddd672bf6595ecd71e50750bc` |
| origin/main | `aaa2463`（== HEAD） |
| ahead / behind | `0 / 0` |
| working tree（pre-phase） | clean |
| latest subject（pre-phase） | `docs(admin): plan copyable payload panel` |

→ 符合 frozen baseline `aaa2463`。未 pull / merge / reset / rebase / amend / force-push。
（本 plan commit 本身會將 HEAD 推進至新 docs commit；以上為寫入前 baseline。）

前置 lineage：admin ui integration preanalysis（`65d0115`）→ copyable payload panel preanalysis（`aaa2463`）→ **source preflight readonly（verdict PASS，無新 commit）** → **本 implementation plan（docs-only）**。

---

## 3. Accepted preflight summary

來源：上一 session `20260617-pm-phase2-admin-ui-static-payload-preview-source-preflight-readonly-a`（verdict **PASS**）。

| 項目 | 發現 |
| --- | --- |
| **candidate file** | `src/views/admin/index.ejs`（單檔；EJS markup + inline `<script>`；無需新增 view / JS module / SCSS file） |
| **UI placement** | per-post detail panel 內、既有 SEO dry-run editor（`.dry-run-section`，現行 `src/views/admin/index.ejs:1455`）之區段內，**置於既有 diff table（行 1501–1510）之後、disabled Apply button（行 1515）之前** |
| **existing dry-run editor** | `.dry-run-section`（行 1455–1520）已支援 safe-editable subset `description / searchDescription / titleEn / coverAlt`；current value 來自 `data-current="<%= p.description %>"`（行 1480 等 4 欄）；client-side「Show Dry-run Diff」算 old/new；末端 disabled Apply（`.apply-disabled`，行 1515） |
| **existing commerce copy helper precedent** | Commerce copyable YAML snippet helper（`#commerce`，行 482–537）—— readonly `<textarea id="commerce-snippet-output">`（行 524）即時產生純文字 + 「Copy YAML」按鈕（行 530，預設 disabled）；clipboard JS 於行 2740–2741（`navigator.clipboard.writeText` 優先、`execCommand('copy')` fallback）。此即「UI 產生 copyable 純文字 + 人手貼入 + `validate:content` 把關」之既有先例，payload panel 直接 mirror |
| **grep baseline clean** | `src/views/admin/index.ejs` 對 `fetch(` / `POST`·`method="post"` / `fs.writeFile`·`writeFileSync` / `XMLHttpRequest` / `admin-write-cli` caller / 預設 `--apply` / `dryRun:false` 皆 **0 matches**；`vite.config.js` 對 `configureServer` / `app.post` / `fs.writeFile` / `server.fs` 亦 **0 matches**（無 browser-to-filesystem 通道） |
| **known copy inconsistency risk** | 既有 UI 文案 staleness：Apply button（行 1517）仍寫「Phase 3 dry-run only」、readiness checklist（行 1533–1534）仍寫「Phase 3 current / Phase 4 not started」，與「terminal-only CLI write 已實證兩次」現況不一致（行 1535 已部分更新）。本 plan §7 提出處理選項，但 **本 docs phase 不修 source** |
| **是否已有 payload-like 產生器** | **沒有**。現行 dry-run editor 僅算 old/new diff 顯示，**不**組裝 `{ targetRel, field, expectedOldValue, newValue, dryRun }` payload；payload 形態目前僅存在於 terminal-only `src/scripts/admin-write-cli.js` 與 CLI driver preanalysis docs。→ payload preview 為**新**前端組裝邏輯 |

→ preflight verdict：路徑判定為**小且低風險**（single-file、additive、mirror 既有先例、無新資料管線、guardrail grep 全 clean）。

---

## 4. Exact future implementation sketch（未來 source phase；**本 phase 不實作**）

### 4.1 Candidate file & placement

- **candidate file**：`src/views/admin/index.ejs`（單檔）。
- **proposed placement**：within SEO dry-run section（`.dry-run-section`），**after the existing diff table**（`.dry-run-result` / `.dry-run-diff-rows`，現行行 1501–1510）**and before the disabled Apply button**（`.apply-disabled`，現行行 1515）。

### 4.2 Markup sketch（示意，**非 final source**）

```html
<!-- 置於 .dry-run-result 之後、.apply-disabled 之前 -->
<div class="payload-preview" hidden>
  <h4>Payload preview（PREVIEW ONLY — 不執行任何寫入）</h4>
  <p class="dry-run-warning">
    ⚠️ PREVIEW ONLY · dry-run 預覽 · 不寫任何檔案。
    實際寫入僅由終端機 CLI（admin-write-cli）執行，每次仍須 Dean explicit approval。
  </p>

  <!-- (a) payload JSON：readonly textarea -->
  <label>Payload JSON（dryRun:true）</label>
  <textarea class="payload-json-output" readonly rows="9" spellcheck="false"
            aria-label="admin write payload preview (dry-run)"></textarea>

  <!-- (b) command preview：pre/code 或 readonly textarea，無 --apply -->
  <label>Command preview（dry-run，無 --apply）</label>
  <pre class="payload-cmd-output"><code></code></pre>

  <!-- (c) optional copy buttons（mirror commerce helper；預設可 disabled） -->
  <button type="button" class="payload-copy-json" disabled aria-disabled="true">Copy payload JSON</button>
  <button type="button" class="payload-cmd-copy"  disabled aria-disabled="true">Copy command</button>
  <span class="payload-copy-status" aria-live="polite"></span>
</div>
```

markup 要點：
- 一段 **readonly textarea** 顯示 payload JSON；一段 **`<pre><code>`（或 readonly textarea）** 顯示 command preview。
- 顯著 **PREVIEW ONLY warning**（mirror 既有 `.dry-run-warning`）。
- 末端沿用既有 **disabled Apply text**（`.apply-disabled`，視覺 shell + tooltip；不新增可觸發之寫入按鈕）。
- optional **command buttons**（copy only）；預設可 disabled，啟用後僅 clipboard、無 auto-copy / 無 auto-submit。

### 4.3 Client-side logic sketch（示意；純前端、零副作用）

- **derive field**：由既有 safe-editable field selector / diff rows 取得使用者正在編輯之欄位（`description` / `searchDescription` / `titleEn` / `coverAlt`），或預設 `description`。
- **derive `expectedOldValue`**：直接取自既有 `data-current="<%= p.* %>"`（`.dry-run-old-value[data-field]`，現行行 1480 等）—— server-side current frontmatter 值，**逐字、不可臆造**。
- **derive `newValue`**：取自既有 `<textarea data-input="...">`（現行行 1481 等）之 client-side 值，純讀取，不寫檔。
- **derive `targetRel`**：優先使用 server-side render 的 safe relative path。
  - ⚠️ open item：現行 detail panel 顯示之 `p.sourcePath`（行 1543）可能為絕對 / 系統路徑；payload 之 `targetRel` 須為 repo-relative（如 `content/blogger/posts/<file>.md`）。未來 source phase 須**確認**是否已有 repo-relative 欄位可用，否則須由 server-side 提供一個 **safe relative path data attribute**（read-only，純顯示），不可在 client 端用字串猜測拼湊。此為 §11 R2 之 mitigation 對象。
- **render payload**：以**固定 key 順序**組 deterministic JSON（見 §5），預設 `dryRun: true`。
- **render command**：固定字串 `node src/scripts/admin-write-cli.js --payload=<temp>`，**無 `--apply`**。
- ❌ **no auto-submit**：payload / command 永不自動送出；無 form submit / 無 onload 觸發 / 無 auto-copy。
- ❌ **no `fetch` / `POST` / `fs.writeFile` / `XMLHttpRequest`**：全程純前端字串操作。
- ❌ **no `admin-write-cli` invocation**：UI 不 spawn / exec / 觸發任何命令。

---

## 5. Payload contract（UI 產生之 preview payload）

未來 UI 產生之 preview payload **本體**之欄位與規則：

| 欄位 | 規則 |
| --- | --- |
| `targetRel` | repo-relative 目標路徑（safe relative path；不可絕對路徑、不可 client 猜測拼湊；見 §4.3 open item） |
| `field` | safe-editable subset 之一（`description` / `searchDescription` / `titleEn` / `coverAlt`） |
| `expectedOldValue` | 逐字取自 server-side current frontmatter（`data-current`）；不可人工臆造 |
| `newValue` | 使用者於既有 textarea 輸入之新值（client-side 純讀取） |
| `dryRun` | **固定 `true`**（by default） |

額外硬性規則：
- **deterministic order** —— payload key 順序固定（`targetRel` → `field` → `expectedOldValue` → `newValue` → `dryRun`）；同輸入恆同輸出。
- **no timestamp / random** —— payload 本體不含時間戳 / 隨機值 / 序號 / nonce。
- **no `dryRun:false`** —— UI 預設**永不**產生 `dryRun:false`。
- **no `--apply`** —— UI 產生之 command 預設**永不**含 `--apply`。
- **no actual-write payload generated by default** —— 任何 `dryRun:false` / 帶 `--apply` 之 actual-write payload，UI **不得**產生；此類 payload 只能由人手動於終端機編輯，且須未來另行獨立設計 phase + Dean explicit approval。

---

## 6. Copy button policy

- **optional** —— copy button 為選配；即使不實作，payload / command 仍可由人手動選取複製。
- **non-mutating** —— 複製為純前端剪貼簿操作；無 fs / network / state mutation 副作用。
- **uses clipboard only** —— 僅 `navigator.clipboard.writeText`（fallback `execCommand('copy')`），mirror 既有 commerce snippet copy（行 2740–2741）。
- **mirrors commerce YAML helper** —— UI 行為、disabled 預設、status `aria-live` 提示皆沿用 `#commerce-snippet-copy` 既有先例。
- **copy does not imply approval** —— 複製 payload / command **不**構成任何寫入核准；UI 文案須明示「複製 ≠ 核准」。
- **is dry-run preview only** —— 所複製之內容恆為 dry-run preview（`dryRun:true`、無 `--apply`）。

---

## 7. UI copy / wording plan

未來面板文案須清楚傳達：
- **clear PREVIEW ONLY wording** —— textarea 標題 / 邊框 / 標籤明示「PREVIEW ONLY — 不執行任何寫入」。
- **dry-run preview only** —— 每處明示「dry-run 預覽，不寫任何檔案」。
- **actual write remains terminal-only** —— 實際寫入僅由終端機 CLI（`admin-write-cli`）執行。
- **every actual write requires fresh Dean approval** —— 每次 actual write 仍須 Dean 逐字 explicit approval（targetRel / field / old / new / 允許 `--apply` / 允許 `dryRun:false`）。
- **Admin Apply remains disabled** —— Apply button 維持永久 `disabled aria-disabled`。
- **browser write / middleware / API remain disabled** —— 明示瀏覽器寫入 / middleware / API 未啟用。

### 7.1 既有 Phase 3 / Phase 4 wording inconsistency 之處理

現況：Apply button（行 1517）寫「Phase 3 dry-run only」、readiness checklist（行 1533–1534）寫「Phase 3 current / Phase 4 not started」，與「terminal-only CLI write 已實證兩次」現況不一致。

兩個處理選項：

| 選項 | 內容 | 評估 |
| --- | --- | --- |
| **A** | 在未來 payload preview source implementation phase **內**順帶校正 wording（限於相鄰文案、且須 explicit approval） | 省一個 phase，但**擴張該 source phase 的 diff 範圍**，使 single-file additive diff 不再「純 additive」，增加 review 負擔與越界風險 |
| **B** | 先開一個 **separate tiny copy-only phase**（只改文案，零功能），校正 Phase 3/4 wording，再開 payload preview implementation phase | diff 各自最小、各自可獨立 accept、payload preview phase 維持「純 additive」；符合保守落地原則 |

→ **Recommended：選項 B（separate tiny copy-only phase before implementation）**。理由：保持每個 phase diff 最小且單一職責；payload preview source phase 維持 additive-only、更易 grep / review；wording 校正與功能落地解耦，任一步皆可獨立驗收與回退。

---

## 8. Guardrail check plan

### 8.1 Pre-implementation grep baseline（已於 preflight 取得，clean）

`src/views/admin/index.ejs`：`fetch(` / `POST`·`method="post"` / `fs.writeFile`·`writeFileSync` / `XMLHttpRequest` / `admin-write-cli` caller / 預設 `--apply` / `dryRun:false` 皆 **0 matches**；`vite.config.js`：`configureServer` / `app.post` / `fs.writeFile` / `server.fs` 皆 **0 matches**。

### 8.2 After-implementation grep（未來 source phase 必跑，須維持 0 / 受控）

| grep target | 期望 |
| --- | --- |
| `fetch(` | 0 matches |
| `XMLHttpRequest` | 0 matches |
| `method="post"` | 0 matches |
| `app.post` | 0 matches（含 `vite.config.js`） |
| `fs.writeFile` / `writeFileSync` | 0 matches |
| `admin-write-cli` caller / `spawn` / `exec` | 0 matches（說明文字 / tooltip 提及字串不算 caller，但須人工確認非執行路徑） |
| `--apply` in generated default preview | 0 matches（command preview 預設不含 `--apply`） |
| `dryRun:false` / `dryRun: false` | 0 matches（payload preview 預設不含） |

### 8.3 其他 after-implementation confirmations

- **confirm Apply disabled** —— 所有 `.apply-disabled` 維持 `disabled aria-disabled="true"`，無 click handler / 無 fetch / fs / safeWrite caller。
- **confirm no source / content write** —— 落地僅改 `src/views/admin/index.ejs`；無 content / settings / scripts / package / lockfile / dist / gh-pages / `.cache` 變動。
- **confirm no build / deploy / repost** —— source phase 不觸發 build / deploy / Blogger repost。
- **confirm tracked diff limited to expected file(s)** —— `git diff --stat` 僅顯示 `src/views/admin/index.ejs`（+ 該 phase 之 1 份 docs record，若有）。
- **既有 admin guard no-regression** —— `check:admin-governance-aggregation` / `check:admin-validation-consume`（該 source phase 若 phase 要求 regression check 才跑）。

---

## 9. Browser / generated HTML verification plan

> 僅在未來 source implementation **之後**、且**另行 explicit approval** 下，才於本機起 dev server 人工檢視（本 plan / 該 source phase 預設不起 dev server）。

- **allow local dev render only if separately approved** —— browser verification 須獨立核准。
- **verify payload panel renders** —— 面板正常出現於 SEO dry-run section、diff table 之後 / disabled Apply 之前。
- **verify `dryRun:true` appears** —— payload JSON 預設含 `dryRun:true`。
- **verify `--apply` absent from default preview** —— command preview 預設不含 `--apply`。
- **verify `dryRun:false` absent** —— payload 預設不含 `dryRun:false`。
- **verify Apply disabled** —— Apply button 仍 disabled、不可觸發。
- **verify no write action** —— 操作面板 / 複製時 console 無任何寫入 / fetch / fs 呼叫；磁碟零變動。
- **verify stale / confusing copy absent or clearly scoped** —— Phase 3/4 wording inconsistency 已依 §7.1 處理（已校正或明確 scope）。

---

## 10. Acceptance criteria for future source phase

未來 payload preview source phase 落地之驗收門檻：

- **single-file additive diff preferred** —— 僅 `src/views/admin/index.ejs`，additive 為主。
- **output deterministic** —— payload / command 同輸入恆同輸出；無時間戳 / 隨機值。
- **no runtime write path** —— 無 `fetch` / `POST` / `fs.writeFile` / `XMLHttpRequest` / CLI spawn。
- **no API / middleware** —— 不引入 `configureServer` / POST route / API server。
- **no content mutation** —— 不寫任何 production content / settings。
- **no dependency changes** —— 不動 `package.json` / lockfile / 不 `npm install`。
- **no deploy / repost** —— 不 build / deploy / Blogger repost。
- **source diff reviewed** —— `git diff` 人工檢視僅含預期 markup / JS。
- **generated HTML verified** —— per §9（須另行 approval）。
- **working tree clean after commit / push** —— 落地後 working tree clean、HEAD == origin/main。

---

## 11. Risk register

| # | 風險 | mitigation |
| --- | --- | --- |
| R1 | **stale `expectedOldValue`**（顯示值落後現值） | payload 由 server-side render 當下之 current frontmatter（`data-current`）帶入；UI 文案提示「貼上前再核對 + 跑 `validate:content`」；CLI 端 `expectedOldValue` 比對 fail-closed |
| R2 | **`targetRel` / path mismatch**（絕對路徑 / 猜測拼湊） | `targetRel` 僅取 server-side 提供之 safe relative path；不可 client 端字串拼湊；若無現成 repo-relative 欄位，由 server-side 新增 read-only data attribute（§4.3 open item） |
| R3 | **UI confusion：preview vs write** | PREVIEW ONLY warning + 永久 disabled Apply + tooltip + section-lede 明示「寫入僅終端機 CLI + per-write approval」；連向 SOP / milestone docs |
| R4 | **accidental `--apply` / `dryRun:false` exposure** | UI 預設永不產生此二者；§8.2 grep gate 守住；actual-write payload 須未來獨立 design phase 明示核准 |
| R5 | **copy button perceived as approval** | UI 文案明示「複製 ≠ 核准；所複製內容恆為 dry-run preview」；copy 為非 mutating clipboard-only |
| R6 | **source complexity** | 路徑判定小（single-file additive、mirror 既有 commerce snippet + SEO dry-run editor）；維持 additive；不新增 view / module |
| R7 | **wording inconsistency**（Phase 3/4 stale copy） | 依 §7.1 選項 B：先 separate tiny copy-only phase 校正，再開 implementation phase；payload preview phase 維持純 additive |
| R8 | **classifier / tooling interruptions**（fragmented spec / 中斷） | 每 phase 開頭 baseline verify；docs-only + 單檔 mutation；斷句 spec 時停下回報缺項，不自行從前批推測；working tree clean 為正確收尾 |

---

## 12. Recommended next phase

- **本 docs-only plan 之後：**
  `20260617-pm-phase2-admin-ui-static-payload-preview-implementation-plan-acceptance-readonly-a`
  —— read-only 驗收本 implementation plan（plan accept / 紅線確認 / acceptance criteria 確認 / §7.1 wording 處理選項拍板）；不落 source。
- **其後：** 大概率 **idle freeze**（除非 Dean 決定推進 source implementation，且須本 plan §10 acceptance criteria 全滿足 + explicit approval）。
- **Do not recommend source implementation until plan acceptance passes.**

---

## 13. Explicit guardrail statement

- This plan **does not implement UI**.
- This plan **does not enable Apply**.
- This plan **does not enable middleware / API**.
- This plan **does not authorize any write**（dry-run approval ≠ actual-write approval；每次寫入仍須 Dean fresh explicit approval）。
- This plan **does not create browser-to-filesystem write**.
- This plan **does not run `admin-write-cli`**.
- This plan **does not touch production content**.
- This plan **does not change Blogger live publishing behavior**.

並沿用本 session hard rules：docs-only（唯一 mutation = 本 doc）；不改 source / content / settings / views / scripts / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages / `.cache` / CLAUDE.md / MEMORY.md；no `admin:write`；no `admin-write-cli.js`；no `safe-write:test`；no production dry-run；no `--apply`；no `dryRun:false`；no production content write；no validate / guard；no build / deploy / Blogger repost；no dev server；no `.cache` regeneration；no third write opened；no payload files created；no middleware / API / Admin Apply enabled；no UI implementation；no amend / rebase / force-push；no package / dependency changes。

---

## 14. Cross-links

- `docs/20260617-phase2-admin-ui-copyable-payload-panel-preanalysis.md`（copyable payload panel preanalysis，`aaa2463`）
- `docs/20260617-phase2-admin-ui-integration-preanalysis.md`（staged UI-0→UI-6）
- `docs/20260617-phase2-admin-ui-stale-copy-correction-record.md`（UI 文案誠實反映 terminal-only write 現況）
- `docs/20260617-phase2-admin-write-path-milestone-checkpoint.md`（write-path boundary）
- `docs/20260617-phase2-admin-write-path-repeatable-workflow.md`（SOP Stage 0–8）
- `docs/20260617-phase2-admin-write-path-actual-write-execution-record.md`（first actual write，`5c8646d`）
- `docs/20260617-phase2-admin-write-path-second-write-execution-record.md`（second actual write，`7bf1136`）
- `docs/20260528-admin-write-phase-4-middleware-preanalysis.md`（middleware preanalysis，遠期參考）
- `docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md`（CLI write driver / payload schema / exit codes）
- `CLAUDE.md` §8 / §27 / §28 / §29

---

## 15. Acceptance（本 phase 自身）

| 項目 | 結果 |
| --- | --- |
| baseline verify（branch / HEAD / origin / ahead-behind / clean） | `main` / `aaa2463` / 0-0 / clean |
| 唯一 file change | `docs/20260617-phase2-admin-ui-static-payload-preview-implementation-plan.md`（新增） |
| 未改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` | ✅ |
| 未改 CLAUDE.md / MEMORY.md | ✅ |
| no UI implementation / no Apply activation / no middleware / API | ✅ |
| no `admin:write` / no `admin-write-cli.js` / no `--apply` / no `dryRun:false` | ✅ |
| no production dry-run / no `safe-write:test` / no production content touched | ✅ |
| no validate / guard / build / deploy / repost / no third write / no `.cache` regen / no dev server / no payload files | ✅ |
| no amend / rebase / force-push / no package change | ✅ |

→ docs-only implementation plan，acceptance trivially PASS。

---

（本文件結束）
