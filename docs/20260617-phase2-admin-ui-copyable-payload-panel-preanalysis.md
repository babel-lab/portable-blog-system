# Phase 2 — Admin UI Copyable Payload Panel Preanalysis（docs-only）

> Session: `20260617-pm-phase2-admin-ui-copyable-payload-panel-preanalysis-docs-only-a`
> Date: 2026-06-17（Asia/Taipei）
> Type: **docs-only preanalysis**。唯一 mutation = 本 doc 新增。
> **不**做任何 source implementation；**不**啟用 Apply；**不**啟用 middleware / API；**不**做 browser-to-filesystem write；**不**執行任何寫入；**不**核准任何未來寫入。

---

## 1. Scope / purpose

- 規劃 **未來 Admin UI 如何安全顯示「可複製 payload / command preview」面板**，讓 Dean 在進終端機跑 dry-run 之前能先在 UI 檢視「將要送出的 payload」，但本 phase **只**產出設計分析，不落任何 source。
- 本檔聚焦於既有 integration preanalysis（`docs/20260617-phase2-admin-ui-integration-preanalysis.md`）中 **Stage UI-1 / UI-2（copyable payload preview + CLI dry-run instruction generator）** 的深入展開：payload 內容、安全規則、staged implementation、acceptance criteria、risk register。
- 明確不做（本 phase）：
  - ❌ 不實作 UI（不改 `src/views/admin/index.ejs` 或任何 view / JS / SCSS）。
  - ❌ 不啟用 Admin Apply。
  - ❌ 不啟用 middleware / API / POST endpoint / dev-server `fs.writeFile`。
  - ❌ 不執行任何寫入（無 `admin:write` / `admin-write-cli.js` / `safe-write:test` / production dry-run / `--apply` / `dryRun:false`）。
  - ❌ 不核准任何未來寫入（dry-run approval ≠ actual-write approval；每次寫入仍須 Dean fresh explicit approval）。
  - ❌ 不改變 Phase 1 / Blogger live publishing 行為。
  - ❌ 不 build / deploy / Blogger repost；不跑 validate / guard；不開第三次 write；不重生 `.cache`；不起 dev server。

---

## 2. Baseline

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| pre-phase HEAD（short / full） | `f0371ce` / `f0371ce71923d37bd1ba14106023632e3e85dd94` |
| origin/main | `f0371ce`（== HEAD） |
| ahead / behind | `0 / 0` |
| working tree（pre-phase） | clean |
| latest subject（pre-phase） | `fix(admin): clarify terminal-only write copy` |

→ 符合 frozen baseline `f0371ce`。未 pull / merge / reset / rebase / amend / force-push。
（本 preanalysis commit 本身會將 HEAD 推進至新 docs commit；以上為寫入前 baseline。）

前置 lineage：admin ui integration preanalysis（`65d0115`）→ stale-copy correction（`7bf1136`，source/UI copy-only）→ clarify terminal-only write copy（`f0371ce`）→ **本 copyable payload panel preanalysis（docs-only）**。

---

## 3. Current safe boundary（proven write-path 現況）

來源：`docs/20260617-phase2-admin-write-path-milestone-checkpoint.md`、`docs/20260617-phase2-admin-write-path-repeatable-workflow.md`（SOP Stage 0–8）、兩份 actual-write execution record（`5c8646d` / `7bf1136`）、integration preanalysis §3。

- **terminal-only write path proven** —— 真實寫入唯一入口為 `node src/scripts/admin-write-cli.js --apply --payload=<temp>`（`dryRun:false`）；已於兩個 draft target 之 `description` 編輯實證並 accepted。
- **Admin UI Apply disabled** —— 三處 dry-run 區塊之 Apply button 永久 `disabled aria-disabled="true"`；即使移除 `disabled`，亦無 fetch / fs / safeWrite caller 可觸發。
- **browser writes disabled** —— `vite.config.js` 無 `configureServer` / `app.post` / `fs.writeFile`；dev server 為 static MPA，不存在 browser-to-filesystem 通道。
- **middleware / API disabled** —— 無任何 write route / API server。
- **one-file / one-field / one-value only** —— 每次一檔、一欄、一值；無 bulk / glob / folder / multi-field / multi-file。
- **draft description only proven** —— 迄今僅對 `status: draft` 文章之 `description` 欄位實證 actual write；其餘 field / status 須各自獨立 phase + explicit approval。
- **every write requires Dean fresh explicit approval** —— 每次 actual write 須 Dean 於 SOP Stage 5 逐字明示核准（targetRel / field / expectedOldValue / newValue / 允許 `--apply` / 允許 `dryRun:false`）。
- **dry-run approval is NOT actual-write approval** —— 兩者各自獨立授權。
- **no build / deploy / repost coupling** —— write-path 與 build / deploy / Blogger repost 完全解耦。

→ 本 copyable payload panel 的設計目標，是在**不擴張**上述任一界線的前提下，讓 UI 成為「payload 的可讀預覽 + 可複製文字」，而真正的執行永遠停在終端機 + 人手 + per-write approval。

---

## 4. Purpose of the copyable payload panel

面板存在的理由（全部為「協助人」而非「代替人」）：

- **help Dean review proposed payload before terminal dry-run** —— 進終端機前，先在 UI 檢視「將要送出的 payload 長什麼樣」。
- **reduce manual copy errors** —— 由 UI 依 current frontmatter + 使用者輸入之 new value 自動組裝 payload，降低手抄 targetRel / field / expectedOldValue 出錯機率。
- **show JSON payload preview** —— readonly textarea 顯示 deterministic JSON payload（預設 `dryRun:true`）。
- **show command preview** —— 顯示對應之終端機指令字串（dry-run 版，**不含 `--apply`**）。
- **show checklist / warnings** —— SOP Stage 對照清單、紅線提醒、「dry-run approval ≠ write approval」警語。

面板**不做**的事：

- ❌ **does NOT execute write from browser** —— 面板永不從瀏覽器觸發任何寫入 / CLI 執行 / fetch / POST。

---

## 5. Proposed UI content（面板可顯示之欄位）

> 全部為 read-only display 或純文字產出；不觸 fs / fetch / POST。

- **selected targetRel** —— 目標文章相對路徑（如 `content/.../foo.md`），由既有 posts 選取流程帶入；read-only 顯示。
- **selected field** —— 欲編輯之欄位（safe-editable subset：`description` / `searchDescription` / `titleEn` / `coverAlt`）。
- **current value / expectedOldValue** —— 直接取自 server-side render 之 current frontmatter 值；作為 payload 之 `expectedOldValue`（**必須**逐字來自現值，不可人工臆造）。
- **proposed newValue** —— 使用者於 UI 輸入之新值的純顯示（client-side，不寫檔）。
- **dryRun:true payload preview by default** —— readonly textarea 顯示 JSON payload，**預設 `dryRun:true`**。
- **command preview without `--apply`** —— 終端機指令字串（`node src/scripts/admin-write-cli.js --payload=<temp>`，**無 `--apply`**）。
- **warning that actual write requires separate approval** —— 明示「實際寫入須另行 Dean explicit approval + 終端機執行」。
- **disabled Apply message** —— permanently-disabled Apply button（視覺 shell）+ tooltip 明示「actual write 僅由終端機 CLI + per-write approval 執行」。
- **link / reference to SOP and milestone docs** —— 連向 repeatable-workflow SOP / milestone checkpoint / integration preanalysis / 本 preanalysis。

---

## 6. Red lines（面板全程不可違反）

- ❌ **no browser-to-filesystem write** —— 瀏覽器永不直接寫 source / content / settings。
- ❌ **no Apply activation** —— Apply button 維持永久 disabled。
- ❌ **no middleware / API** —— `vite.config.js` 不加 `configureServer`；不起任何 API server。
- ❌ **no POST endpoint** —— 不新增任何 write route。
- ❌ **no `fs.writeFile`** —— 面板 / dev server 不得具備寫檔能力。
- ❌ **no `fetch` / `XMLHttpRequest` write path** —— 不引入任何網路寫入呼叫。
- ❌ **no `admin-write-cli` invocation from UI** —— UI 不得 spawn / exec / 觸發 CLI。
- ❌ **no `--apply` generated by default** —— UI 產生之指令預設不含 `--apply`。
- ❌ **no `dryRun:false` generated by default** —— UI 產生之 payload 預設不含 `dryRun:false`。
- ❌ **no content write** —— 不寫任何 production content。
- ❌ **no build / deploy / repost coupling** —— payload panel 與 build / deploy / Blogger repost 完全解耦。
- ❌ **no bulk / multi-field / multi-file writes** —— 維持 one-file / one-field / one-value。

---

## 7. Payload safety rules

- **generated preview must default to `dryRun:true`** —— UI 產生之 payload 本體預設 dry-run。
- **`expectedOldValue` must be copied from current frontmatter** —— 取自 server-side render 之現值，逐字一致；不得由使用者臆造或從別處推導。
- **payload must be deterministic** —— 同輸入恆同輸出；無時間戳 / 隨機值 / 序號混入 payload 本體。
- **payload must be visibly labeled PREVIEW ONLY** —— textarea 標題 / 邊框 / 標籤明示「PREVIEW ONLY — 不執行任何寫入」。
- **actual-write payload must not be generated in UI** —— 任何 `dryRun:false` / 帶 `--apply` 之 actual-write payload，除非未來另行獨立設計 phase 明示核准，否則 UI **不得**產生。
- **no payload auto-submit** —— payload 永不自動送出；無 form submit / 無 onload fetch / 無 auto-copy。
- **no mutation side effects** —— 產生 / 顯示 / 複製 payload 皆為純前端文字操作，無任何 fs / network / state mutation 副作用。

---

## 8. Suggested staged implementation later

> 設計原則：UI 永遠停在「產生人可讀、可複製的 payload / 指令 / 檢查清單」這一側；真正的 `--apply` + `dryRun:false` 永遠在終端機、由人手動執行 + Dean per-write approval。UI 與 filesystem 之間**永遠隔著一個人**。每一 stage 皆 additive、可獨立 accept、可隨時停在 idle freeze。

| Stage | 名稱 | allowed actions | forbidden actions | mutation? | approval required? | acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- |
| **P0** | docs acceptance | read-only 驗收本 preanalysis（design accept / 紅線 / acceptance criteria 確認） | 任何 source 落地 | ❌ no | Dean read-only acceptance | preanalysis accepted；無 source；exact UI placement 已識別 |
| **P1** | source implementation of read-only static payload preview | 落 UI-1：由 current + 使用者輸入產生 readonly textarea payload JSON（`dryRun:true` by default）；mirror 既有 commerce snippet helper | 自動寫檔；跑 CLI；產生 `dryRun:false`；fetch / fs / POST | ❌ no（純文字產出） | Dean explicit approval（首個 source phase） | payload deterministic；預設 `dryRun:true`；grep 無 fetch / POST / fs.writeFile / admin-write-cli caller / 預設 `--apply` / 預設 `dryRun:false`；既有 admin guard no-regression；panel disabled 時輸出不退化 |
| **P2** | browser / read-only verification | 起 dev server 人工檢視 panel render；確認 read-only / Apply disabled / payload 預設 dry-run | 任何寫入 / Apply 啟用 | ❌ no | Dean read-only acceptance | browser PASS：panel 顯示 deterministic payload、Apply disabled、無 console 寫入呼叫 |
| **P3** | copy button only | 加「Copy payload」按鈕（`navigator.clipboard.writeText`，mirror 既有 commerce YAML copy） | 自動複製；auto-submit；fetch / fs | ❌ no | Dean explicit approval | 複製內容 == textarea 內容（deterministic）；無 auto-copy；無 mutation 副作用 |
| **P4** | CLI dry-run instruction panel | 產生可複製之終端機指令字串（`node src/scripts/admin-write-cli.js --payload=<temp>`，**無 `--apply`**）+ 操作 checklist（temp payload 建於 repo 外 / 跑完刪除） | 產生帶 `--apply` 之指令；自動執行；fetch / fs | ❌ no | Dean explicit approval | 指令字串不含 `--apply`；明示 payload 須 repo 外；UI 不執行任何命令 |
| **P5** | actual write remains terminal-only | 人在終端機手動跑 `--apply` + `dryRun:false`（**僅 Dean per-write explicit approval 後**）；UI 不參與執行 | UI 觸發寫入；bulk / multi-field；ready/published target（除非另核准）；build/deploy/repost | ✅（單檔單欄，由終端機 CLI 落地；非 UI 落地） | **Dean fresh explicit actual-write approval**（逐字 target/field/old/new + 允許 `--apply` + 允許 `dryRun:false`） | 對照 SOP Stage 6：one-file/one-field、`written:true`、temp payload 跑完刪除、post-write validate no-regression |
| **P6** | middleware / API discussion only in far future | docs-only 評估是否值得 middleware；風險 / 紅線 / hard gates | 任何 middleware / API 實作；啟用 POST / `fs.writeFile` | ❌ no（docs-only） | **獨立 phase + Dean explicit approval（預設不啟動）** | 僅產出 preanalysis doc；不落 source；明示「預設不實作 middleware」 |

> P0 ~ P4 為「UI 可安全做的事」（純顯示 + 純文字產出 + 複製）；P5 的真正動作**全在終端機 + 人手 + per-write approval**，UI 只當說明書；P6 為遠期、預設不啟動、須 hard gates。

---

## 9. Acceptance criteria before source implementation

任何 UI source 落地（即使只是 P1 payload preview）之前，須先滿足：

- **preanalysis accepted** —— 本 preanalysis 經 Dean read-only acceptance（見 §11 next phase）。
- **no source implementation in this phase** —— 本 docs-only phase 唯一 mutation = 本 doc。
- **exact UI placement identified** —— 面板掛載位置確定（建議：per-post detail panel 內、既有 SEO dry-run editor 區段附近，與 commerce YAML snippet helper 同類「copyable 純文字產出」模式）。
- **output-preserving if panel disabled** —— 即使移除 / 停用 panel，現有 read-only 行為不退化。
- **Apply remains disabled** —— 任何 Apply 視覺元件預設 `disabled aria-disabled`，且無 fetch / fs / safeWrite caller 可觸發。
- **preview deterministic** —— 同輸入恆同輸出；payload 本體無時間戳 / 隨機值。
- **no command execution** —— UI 不 spawn / exec / 觸發任何命令。
- **tests / grep needed**（首個 UI source phase 須附）：
  - grep 確認 **no `fetch`**（無新增 write-path fetch）。
  - grep 確認 **no `POST`**（無 write route）。
  - grep 確認 **no `fs.writeFile`**。
  - grep 確認 **no `admin-write-cli` caller**（UI 不 spawn CLI）。
  - grep 確認 **no `--apply` in generated default preview**。
  - grep 確認 **no `dryRun:false` in generated default preview**。
  - 既有 admin guard（`check:admin-governance-aggregation` / `check:admin-validation-consume`）no-regression。

---

## 10. Risk register

| # | 風險 | mitigation |
| --- | --- | --- |
| R1 | user may think copy panel writes directly | panel 標題明示「PREVIEW ONLY — 不執行任何寫入」；Apply 永久 disabled + tooltip；section-lede 寫「寫入僅終端機 CLI + per-write approval」；連向 SOP / milestone docs |
| R2 | user may confuse dry-run with actual write | payload 預設 `dryRun:true`；指令預設不含 `--apply`；面板每處明示「dry-run approval ≠ actual-write approval」 |
| R3 | wrong `expectedOldValue` risk（手改 / 來源錯） | `expectedOldValue` 一律由 server-side current frontmatter 帶入、逐字顯示；UI 文案提示「貼上後務必人工核對 + 跑 validate:content」；CLI 端 expectedOldValue 比對 fail-closed |
| R4 | accidental `--apply` / `dryRun:false` exposure | UI 預設永不產生 `--apply` / `dryRun:false`；actual-write payload 須未來獨立 design phase 明示核准；P5 維持終端機 + 人手 |
| R5 | creep toward middleware / API（為「方便」加 server） | 紅線 §6 明列；middleware 須獨立 P6 + hard gates + explicit approval；預設不實作 |
| R6 | payload stale if source changes（顯示值落後現值） | payload 由 server-side render 當下之 current frontmatter 組裝；UI 文案提示「以實際 source 為準，貼上前再核對 + validate」；P2 browser verification 對照現值 |
| R7 | scope creep（preanalysis 滑向實作） | 本 phase 唯一 mutation = 本 doc；不改 source / 不啟用任何寫入；下一步僅 read-only acceptance |

---

## 11. Recommended next phase

- **本 docs-only preanalysis 之後：**
  `20260617-pm-phase2-admin-ui-copyable-payload-panel-preanalysis-acceptance-readonly-a`
  —— read-only 驗收本 preanalysis（design accept / 紅線確認 / acceptance criteria 確認 / exact UI placement 確認）；不落 source。
- **其後：** 大概率 **idle freeze**（除非 Dean 決定推進 §8 P1 之 UI copyable payload panel implementation，且須 §9 acceptance criteria 全滿足 + explicit approval）。
- **No source implementation until preanalysis is accepted.**

---

## 12. Explicit guardrail statement

- 本 doc **不實作 UI**。
- 本 doc **不啟用 Admin Apply**。
- 本 doc **不啟用 middleware / API**。
- 本 doc **不核准任何寫入**（dry-run approval ≠ actual-write approval；每次寫入仍須 Dean fresh explicit approval）。
- 本 doc **不建立 browser-to-filesystem write**。
- 本 doc **不改變 Blogger live publishing 行為**。

並沿用本 session hard rules：docs-only（唯一 mutation = 本 doc）；不改 source / content / settings / views / scripts / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages / `.cache` / CLAUDE.md / MEMORY.md；no `admin:write`；no `admin-write-cli.js`；no `safe-write:test`；no production dry-run；no `--apply`；no `dryRun:false`；no production content write；no validate / guard；no build / deploy / Blogger repost；no third write opened；no `.cache` regeneration；no dev server；no amend / rebase / force-push；no package / dependency changes。

---

## 13. Cross-links

- `docs/20260617-phase2-admin-ui-integration-preanalysis.md`（staged UI-0→UI-6；本檔展開 UI-1 / UI-2）
- `docs/20260617-phase2-admin-ui-stale-copy-correction-record.md`（UI 文案誠實反映 terminal-only write 現況）
- `docs/20260617-phase2-admin-write-path-milestone-checkpoint.md`（write-path boundary）
- `docs/20260617-phase2-admin-write-path-repeatable-workflow.md`（SOP Stage 0–8）
- `docs/20260617-phase2-admin-write-path-actual-write-execution-record.md`（first actual write，`5c8646d`）
- `docs/20260617-phase2-admin-write-path-second-write-execution-record.md`（second actual write，`7bf1136`）
- `docs/20260528-admin-write-phase-4-middleware-preanalysis.md`（middleware preanalysis，遠期 P6 參考）
- `docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md`（CLI write driver / payload schema / exit codes）
- `CLAUDE.md` §8 / §27 / §28 / §29

---

## 14. Acceptance（本 phase 自身）

| 項目 | 結果 |
| --- | --- |
| baseline verify（branch / HEAD / origin / ahead-behind / clean） | `main` / `f0371ce` / 0-0 / clean |
| 唯一 file change | `docs/20260617-phase2-admin-ui-copyable-payload-panel-preanalysis.md`（新增） |
| 未改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` | ✅ |
| 未改 CLAUDE.md / MEMORY.md | ✅ |
| no UI implementation / no Apply activation / no middleware / API | ✅ |
| no `admin:write` / no `admin-write-cli.js` / no `--apply` / no `dryRun:false` | ✅ |
| no production dry-run / no `safe-write:test` / no production content touched | ✅ |
| no validate / guard / build / deploy / repost / no third write / no `.cache` regen / no dev server | ✅ |
| no amend / rebase / force-push / no package change | ✅ |

→ docs-only preanalysis，acceptance trivially PASS。

---

（本文件結束）
