# Phase 2 — Admin UI Integration Preanalysis（docs-only）

> Session: `20260617-pm-phase2-admin-ui-integration-preanalysis-docs-only-a`
> Date: 2026-06-17（Asia/Taipei）
> Type: **docs-only preanalysis**。唯一 mutation = 本 doc 新增。
> **不**做任何 source implementation；**不**啟用 Apply；**不**啟用 middleware / API；**不**做 browser-to-filesystem write；**不**執行任何寫入；**不**核准任何未來寫入。

---

## 1. Purpose

- 規劃 **Admin UI 未來如何安全銜接已驗證的 terminal-only write-path**，但本 phase 只產出設計分析，不落任何 source。
- 本檔為 **docs-only preanalysis**：定義 staged design、red lines、UI 可安全顯示 / 必須維持手動的界線、以及在任何 source implementation 之前所需的 acceptance criteria。
- 明確不做：
  - ❌ 不實作 UI（不改 `src/views/admin/index.ejs` 或任何 view / JS）。
  - ❌ 不啟用 Admin Apply。
  - ❌ 不啟用 middleware / API / POST endpoint / dev-server `fs.writeFile`。
  - ❌ 不核准任何未來寫入（dry-run approval ≠ actual-write approval；每次寫入仍須 Dean fresh explicit approval）。
  - ❌ 不改變 Phase 1 / Blogger live publishing 行為。

---

## 2. Baseline

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| pre-phase HEAD (short) | `9790738` |
| pre-phase HEAD (full) | `9790738d9da14277326d14fb230eec05afae85e2` |
| origin/main | `9790738`（== HEAD） |
| ahead / behind | `0 / 0` |
| working tree（pre-phase） | clean |
| latest subject（pre-phase） | `docs(admin): checkpoint write path milestone` |

→ 符合 frozen baseline `9790738`。未 pull / merge / reset / rebase / amend / force-push。
（本 preanalysis commit 本身會將 HEAD 推進至新 docs commit；以上為寫入前 baseline。）

前置 lineage：write-path milestone checkpoint（`9790738`）→ next-step decision readonly（verdict：Choose B）→ **本 preanalysis（B，docs-only）**。

---

## 3. Current proven write-path boundary

來源：`docs/20260617-phase2-admin-write-path-milestone-checkpoint.md` §3–§7、`docs/20260617-phase2-admin-write-path-repeatable-workflow.md`（SOP Stage 0–8）、兩份 actual-write execution record（`5c8646d` / `7bf1136`）。

- **terminal-only `admin-write-cli`** —— 真實寫入唯一入口為 `node src/scripts/admin-write-cli.js --apply --payload=<temp>`（`dryRun:false`）；無其他觸發路徑。
- **draft markdown only** —— 迄今僅對 `status: draft` 文章寫入；ready / published / live 須各自獨立 phase + explicit approval。
- **`description` field only** —— 迄今僅改 `description`；`searchDescription` 等其他欄位尚未實證 actual write（雖在 `ALLOWED_FIELDS` / safe-editable subset 內）。
- **one-file / one-field / one-value only** —— 每次一檔、一欄、一值；無 bulk / glob / folder / multi-field / multi-file。
- **explicit Dean approval every time** —— 每次 actual write 須 Dean 於 SOP Stage 5 逐字明示核准（含 targetRel / field / expectedOldValue / newValue / 允許 `--apply` / 允許 `dryRun:false`）。
- **dry-run approval is NOT actual-write approval** —— 兩者各自獨立授權。
- **`--apply` 與 `dryRun:false` 須成對** —— 缺一 CLI reject（`apply-requires-dryRun-false` / `dryRun-false-requires-apply`，exit 2）。
- **post-write `validate:content` before commit** —— 寫後跑 `npm run validate:content`，no regression（production-post warnings = 0；對照 CLAUDE.md §3a baseline 0/94/84）才 commit；失敗 → `git restore` target、不 commit。
- **no build / deploy / repost coupling** —— write-path 與 build / deploy / Blogger repost 完全解耦。
- **rollback** —— commit 前 `git restore`；commit 後 `git revert`（不 `reset --hard` / 不 force-push / 不 amend / rebase）。
- **proven cases**：Case 1 `5c8646d`（`20260504-sample-book-review.md`，+26 bytes）；Case 2 `7bf1136`（`20260525-draft-book-review.md`，+33 bytes）；兩次 validate 皆 0/94/84，兩次 acceptance 皆 PASS。

---

## 4. Current Admin UI inventory（read-only mapping）

來源：read-only 檢視 `src/views/admin/index.ejs`（2789 行）、`vite.config.js`、既有 admin docs。

### 4.1 既有 pages / components

- 單頁 dev-mode-only dashboard `src/views/admin/index.ejs`：
  - `<meta name="robots" content="noindex, nofollow">` + 頂部 `🔒 READ-ONLY ADMIN` banner（明示「不寫入任何資料 / 不部署 / prod build 不產此頁」）。
  - IA nav（in-page anchor；無 router、無外連）：Dashboard / Posts / Categories / Tags / Blogger Export / GitHub Pages / AdSense / GA4 / Commerce / Settings / System checks。
  - Dashboard hero：system 定位說明 + 6 surface cards（Blogger / GitHub Pages / AdSense / GA4 / Commerce / Content kinds）；AdSense client、GA4 measurementId 僅顯示遮罩 tail4。
  - Posts section：stats 卡、search / filter / sort controls、posts table，row 可展開 per-post detail panel（含 collapsible sections）。

### 4.2 什麼是 read-only

- 全頁標示 read-only；無新增 / 編輯 / 刪除 / 發布按鈕。
- 所有統計、completeness、governance signals、validation report 消費皆為 server-side render 後純顯示。
- Posts table section-lede 明寫：「任何寫入路徑仍只有 CLI（`npm run admin:write`，目前對 content dormant）」。

### 4.3 detail panel / YAML / dry-run helper 現況

- **SEO dry-run editor**（`.dry-run-section`，預設收合）：支援 safe-editable subset `description / searchDescription / titleEn / coverAlt`；顯示 server-side validator preview badges（ok / error）；client-side「Show Dry-run Diff」計算 old/new 差異；**不寫檔**。
- **FB sidecar dry-run editor**（`.fb-dry-run-section`，藍色 tint，預設收合）：12 欄位 dry-run diff 預覽；**No file will be written**。
- **sourceKey selector preview**（read-only / dry-run）：selector 為 disabled `<select>`；無 Apply / 無 form submit / 無 fs write。
- 三處 dry-run 區塊各自帶 **permanently-disabled Apply button**（`.apply-disabled`，`disabled aria-disabled="true"` + tooltip「actual write path is not enabled」），即使有人移除 `disabled`，亦無 fetch / fs / safeWrite caller 可觸發。

### 4.4 copy / export / snippet 行為

- **Commerce copyable YAML snippet helper**（`#commerce` 區塊）：勾選 registry entry +（選填）role / labelOverride → readonly `<textarea>` 即時產生可貼入 `.md` frontmatter 之 `affiliate.links` YAML fragment + 「Copy YAML」按鈕。**純文字產出**，不執行任何寫入；只輸出 safe 欄位（ref / role / labelOverride），永不輸出 targetUrl / internalLabel / tracking / token / merchant id。
- 此即「UI 產生 copyable payload，由作者手動貼入 + 人工 `validate:content` 把關」之既有先例 —— Admin write integration 的 Stage UI-1 / UI-2 可沿用同一模式。

### 4.5 寫入控制 disabled / dormant 之處

- 三處 dry-run 的 Apply button 永久 disabled（§4.3）。
- FB sidecar 真實寫入 dormant（per CLAUDE.md §3a：Apply 永久 disabled）。
- `vite.config.js` 無 `configureServer` / `app.post` / `fs.writeFile`；dev server 為 static MPA，`server.fs.allow` 僅 read-scope → **目前不存在 browser-to-filesystem 寫入通道**。

### 4.6 ⚠️ Inventory finding：UI 文案 staleness（本 phase 不修，僅記錄）

- detail panel 之「Future write readiness checklist」與部分 tooltip 仍寫 **「Phase 5 actual write path（not enabled）」**、Apply tooltip 寫「Phase 5 才會啟用實際寫入」。
- 但**現況已前進**：terminal-only CLI write-path 已實證可運作（兩次 actual write accepted）。UI 文字落後於 milestone。
- 風險：使用者讀 UI 會誤以為「沒有任何 actual write 能力」；或誤以為未來 Apply = Phase 5 自動啟用。→ 列入 §11 risk register；修正須另開（極小）UI 文案 phase，本 docs-only phase **不**動 source。

---

## 5. Admin Apply / write-path red lines

以下為 Admin UI integration 全程不可違反之紅線（沿用 milestone checkpoint §6 / SOP §10 / CLAUDE.md §3a）：

- ❌ **no browser-to-filesystem write** —— 瀏覽器永不直接寫 source / content / settings。
- ❌ **no Admin Apply activation** —— Apply button 維持永久 disabled；FB sidecar Apply 永久 disabled。
- ❌ **no middleware / API server** —— `vite.config.js` 不加 `configureServer`；不起任何 API server。
- ❌ **no POST endpoint** —— 不新增任何 write route。
- ❌ **no `fs.writeFile` from dev server** —— dev server 不得具備寫檔能力。
- ❌ **no bulk / multi-field / multi-file writes** —— 維持 one-file / one-field / one-value。
- ❌ **no ready / published / live post writes** —— 僅 `status: draft`；其餘須各自獨立 phase + explicit approval。
- ❌ **no build / deploy / repost coupling** —— write-path 與 build / deploy / Blogger repost 完全解耦。
- ❌ **no package / dependency changes** —— 不動 `package.json` / lockfile / 不 `npm install`（除非另開 phase）。

---

## 6. Safe staged design proposal

> 設計原則：UI 永遠停在「**產生人可讀、可複製的 payload / 指令 / 檢查清單**」這一側；真正的 `--apply` + `dryRun:false` 永遠在終端機、由人手動執行 + Dean per-write approval。UI 與 filesystem 之間**永遠隔著一個人**。

| Stage | 名稱 | allowed actions | forbidden actions | mutation allowed? | approval required? | acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- |
| **UI-0** | read-only display of current frontmatter fields | 顯示 target 之 current frontmatter 值（safe-editable subset：description / searchDescription / titleEn / coverAlt）；read-only | 任何編輯 / 寫入 / payload 產生 | ❌ no | 設計 accept | 顯示值與 source frontmatter 逐字一致；無任何 input/textarea 可送出；no fs / fetch |
| **UI-1** | copyable payload preview only | 由 current + 使用者輸入之 new value，產生 readonly `<textarea>` payload JSON（**`dryRun:true` by default**）+ Copy button；mirror 既有 commerce snippet helper | 自動寫檔；自動跑 CLI；產生 `dryRun:false` payload；fetch / fs | ❌ no（純文字產出） | 設計 accept | payload deterministic（同輸入同輸出）；預設含 `dryRun:true`；`dryRun:false` 永不被 UI 自動產生；無 fs / fetch / POST |
| **UI-2** | CLI dry-run instruction generator | 產生可複製之終端機指令字串（`node src/scripts/admin-write-cli.js --payload=<temp>`，**無 `--apply`**）+ 操作 checklist（建 temp payload 於 repo 外 / 跑完刪除） | 產生帶 `--apply` 之指令；自動執行；fetch / fs | ❌ no | 設計 accept | 指令字串不含 `--apply`；明示 payload 須 repo 外；UI 不執行任何命令 |
| **UI-3** | human-approved terminal dry-run | 人在終端機手動跑 dry-run（`written:false`）；UI 僅作說明 | UI 觸發執行；`--apply`；`dryRun:false` | ❌ no（磁碟零變動） | dry-run approval（≠ write approval） | 對照 SOP Stage 3：`written:false`、磁碟零變動、擷取 stdout/stderr/exit |
| **UI-4** | human-approved terminal actual write | 人在終端機手動跑 `--apply` + `dryRun:false`（**僅 Dean per-write explicit approval 後**）；UI 不參與執行 | UI 觸發寫入；bulk / multi-field；ready/published target（除非另核准）；build/deploy/repost | ✅（單檔單欄，由終端機 CLI 落地；非 UI 落地） | **Dean fresh explicit actual-write approval**（逐字 target/field/old/new + 允許 `--apply` + 允許 `dryRun:false`） | 對照 SOP Stage 6：one-file/one-field、`written:true`、temp payload 跑完刪除 |
| **UI-5** | post-write validation and acceptance | 人在終端機跑 `npm run validate:content` + `git diff` 檢視；UI 可顯示「請執行下列檢查」清單（read-only） | UI 自動跑 validate / commit；skip validation | ❌ no（UI 僅顯示清單） | acceptance（read-only verdict） | 對照 SOP Stage 7：no regression、diff 僅核准欄、commit scope 正確 |
| **UI-6** | （**僅在另行 approval 後**）middleware / API design preanalysis | docs-only 評估是否值得 middleware；風險 / 紅線 / hard gates | 任何 middleware / API 實作；啟用 POST / `fs.writeFile` | ❌ no（docs-only） | **獨立 phase + Dean explicit approval（預設不啟動）** | 僅產出 preanalysis doc；不落 source；明示「預設不實作 middleware」 |

> Stage UI-0 ~ UI-2 為「UI 可安全做的事」（純顯示 + 純文字產出）；UI-3 ~ UI-5 的真正動作**全在終端機 + 人手 + per-write approval**，UI 只當說明書；UI-6 為遠期、預設不啟動、須 hard gates。

---

## 7. What UI may safely show before middleware exists

（全部為 read-only display 或純文字產出；不觸 fs / fetch / POST）

- **current value** —— target frontmatter 欄位現值（safe-editable subset）。
- **proposed new value preview** —— 使用者輸入之 new value 的純顯示 diff（client-side 計算，不寫檔）。
- **diff preview text** —— old/new 文字差異（既有 SEO / FB dry-run editor 已有此能力）。
- **payload JSON preview** —— readonly textarea，**預設 `dryRun:true`**。
- **command preview** —— 終端機指令字串（dry-run 版不含 `--apply`）。
- **checklist / warning labels** —— SOP Stage 對照清單、紅線提醒、「dry-run approval ≠ write approval」警語。
- **copy buttons** —— 複製 payload / 指令到剪貼簿（mirror 既有 commerce snippet Copy 按鈕）。
- **permanently-disabled Apply button**（with clear reason）—— 視覺 shell + tooltip 明示「actual write 僅由終端機 CLI + per-write approval 執行」。
- **link to SOP / milestone docs** —— 連向 repeatable-workflow SOP / milestone checkpoint / 本 preanalysis。

---

## 8. What must remain manual / terminal-only

- **actual CLI execution** —— `node src/scripts/admin-write-cli.js ...` 由人在終端機手動跑。
- **`--apply` usage** —— 僅終端機、僅 per-write approval 後。
- **`dryRun:false` usage** —— 同上；與 `--apply` 成對。
- **`validate:content` run** —— 寫後人工執行（UI 不 spawn）。
- **`git diff` review** —— 人工檢視 diff 僅含核准欄。
- **commit / push** —— 人工；commit message 標示 admin write + field。
- **rollback / restore** —— 人工（`git restore` / `git revert`）。

---

## 9. Acceptance criteria before any source implementation

任何 UI source 落地（即使只是 UI-1 payload preview）之前，須先滿足：

- **full design accepted** —— 本 preanalysis 經 Dean read-only acceptance（見 §12 next phase）。
- **nothing changes if write features disabled** —— 即使所有 write affordance 移除，現有 read-only 行為不退化。
- **Apply button must remain disabled by default** —— 任何 Apply 視覺元件預設 `disabled aria-disabled`，且無 fetch / fs / safeWrite caller 可觸發。
- **no middleware / API in first source phase** —— 首個 UI source phase 不得引入 `configureServer` / POST / `fs.writeFile`。
- **payload preview must be deterministic** —— 同輸入恆同輸出；無時間戳 / 隨機值混入 payload 本體。
- **copyable payload must include `dryRun:true` by default** —— UI 產生之 payload 預設 dry-run；`dryRun:false` 永不由 UI 自動產生。
- **`dryRun:false` must never be generated without explicit approval wording** —— 任何 `dryRun:false` 內容只能由人手動於終端機編輯，UI 不得代勞。
- **tests / checks needed** —— 首個 UI source phase 須附：(a) 既有 admin guard（`check:admin-governance-aggregation` / `check:admin-validation-consume`）no-regression；(b) 一條 smoke 驗證 UI 產生之 payload 預設 `dryRun:true` 且不含 `--apply`；(c) grep 確認 view / JS 無 `fetch(` / `fs.` / `XMLHttpRequest` / POST。

---

## 10. Future implementation decomposition（建議保守 phase 序）

1. **Admin UI read-only write panel preanalysis acceptance**（docs-only；本 preanalysis 之 read-only 驗收）。
2. **UI copyable payload panel implementation, disabled write only**（首個 source phase；只落 UI-1 payload preview，Apply 永久 disabled；附 §9 tests）。
3. **UI CLI dry-run instruction generator**（UI-2；產生不含 `--apply` 之指令 + checklist）。
4. *(much later)* **middleware / API design preanalysis**（UI-6；docs-only；預設不啟動）。
5. *(still later, if ever)* **Apply activation behind hard gates** —— 僅在多重 hard gate + Dean explicit approval 下才考慮；預設**永不**自動啟用。

> 每一步皆 additive、可獨立 accept、可隨時停在 idle freeze；順序上「離 middleware / Apply 越近者越後置」。

---

## 11. Risk register

| # | 風險 | mitigation |
| --- | --- | --- |
| R1 | UI affordance 可能讓人以為 write 已被允許 | Apply 永久 disabled + tooltip 明示；section-lede 寫「寫入僅終端機 CLI + per-write approval」；連向 SOP / milestone docs |
| R2 | 使用者把 dry-run approval 誤當 actual-write approval | UI 每處明示「dry-run approval ≠ write approval」；payload 預設 `dryRun:true`；指令預設不含 `--apply` |
| R3 | copyable payload 被錯誤編輯（如手改成 `dryRun:false` / 改 target） | payload 預設 `dryRun:true`；UI 文案提示「貼上後務必人工核對 + 跑 `validate:content`」；CLI 端 expectedOldValue 比對 + status gate fail-closed |
| R4 | browser-to-filesystem 的誘惑（為「方便」加 middleware） | 紅線 §5 明列；middleware 須獨立 phase（UI-6）+ hard gates + explicit approval；預設不實作 |
| R5 | validate gate 被略過 | UI 僅顯示「請執行 validate」清單，不代跑也不代 commit；SOP Stage 5/7 人工 gate 維持；commit 前人工 diff 檢視 |
| R6 | UI 文案 staleness（§4.6：仍寫「Phase 5 not enabled」） | 列為待修；修正須另開極小 UI 文案 phase；本 docs-only phase 不動 source（避免擴張 scope） |
| R7 | scope creep（preanalysis 滑向實作） | 本 phase 唯一 mutation = 本 doc；不改 source / 不啟用任何寫入；下一步僅 read-only acceptance |

---

## 12. Recommended next phase

- **本 docs-only preanalysis 之後：**
  `20260617-pm-phase2-admin-ui-integration-preanalysis-acceptance-readonly-a`
  —— read-only 驗收本 preanalysis（design accept / 紅線確認 / acceptance criteria 確認）；不落 source。
- **其後：** 大概率 **idle freeze**（除非 Dean 決定推進 §10 step 2 之 UI copyable payload panel，且須 §9 acceptance criteria 全滿足 + explicit approval）。

---

## 13. Explicit guardrail statement

- 本 preanalysis **不實作 UI**。
- 本 preanalysis **不啟用 Admin Apply**。
- 本 preanalysis **不啟用 middleware / API**。
- 本 preanalysis **不核准任何寫入**（dry-run approval ≠ actual-write approval；每次寫入仍須 Dean fresh explicit approval）。
- 本 preanalysis **不改變 Phase 1 / Blogger live publishing 行為**。

並沿用本 session hard rules：docs-only（唯一 mutation = 本 doc）；不改 source / content / settings / views / scripts / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages / `.cache` / CLAUDE.md / MEMORY.md；no `admin:write`；no `admin-write-cli.js`；no `safe-write:test`；no production dry-run；no `--apply`；no `dryRun:false`；no production content write；no validate / guard；no build / deploy / Blogger repost；no amend / rebase / force-push。

---

## 14. Cross-links

- `docs/20260617-phase2-admin-write-path-milestone-checkpoint.md`（write-path milestone checkpoint，`9790738` 前 baseline）
- `docs/20260617-phase2-admin-write-path-repeatable-workflow.md`（repeatable write workflow SOP，Stage 0–8）
- `docs/20260617-phase2-admin-write-path-actual-write-execution-record.md`（first actual write，`5c8646d`）
- `docs/20260617-phase2-admin-write-path-second-write-execution-record.md`（second actual write，`7bf1136`）
- `docs/20260527-admin-write-phase-3-dry-run-ui-preanalysis.md`（dry-run-only UI / disabled Apply 設計來源）
- `docs/20260528-admin-write-phase-4-middleware-preanalysis.md`（middleware preanalysis，遠期 UI-6 參考）
- `docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md`（CLI write driver / payload schema / exit codes）
- `docs/admin-2-write-pre-analysis.md`（safe editable subset / §15.F prerequisites）
- `CLAUDE.md` §8 / §27 / §28 / §29

---

## 15. Acceptance（本 phase 自身）

| 項目 | 結果 |
| --- | --- |
| baseline verify（branch / HEAD / origin / ahead-behind / clean） | ✅ `main` / `9790738` / 0-0 / clean |
| 唯一 file change | `docs/20260617-phase2-admin-ui-integration-preanalysis.md`（新增） |
| 未改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` | ✅ |
| 未改 CLAUDE.md / MEMORY.md | ✅ |
| no UI implementation / no Apply activation / no middleware / API | ✅ |
| no `admin:write` / no `admin-write-cli.js` / no `--apply` / no `dryRun:false` | ✅ |
| no production dry-run / no `safe-write:test` / no production content touched | ✅ |
| no validate / guard / build / deploy / repost | ✅ |
| no amend / rebase / force-push | ✅ |

→ docs-only preanalysis，acceptance trivially PASS。

---

（本文件結束）
