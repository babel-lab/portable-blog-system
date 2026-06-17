# Phase 2 — Admin UI Stale-Copy Correction（source/UI copy-only）

> Session: `20260617-pm-phase2-admin-ui-stale-copy-correction-a`
> Date: 2026-06-17（Asia/Taipei）
> Type: **source/UI copy-only**。無行為變更；不啟用 Apply；不啟用 middleware / API；不執行任何寫入。

---

## 1. Baseline

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| pre-phase HEAD（short / full） | `65d0115` / `65d0115262bf18d69d3d3cdc83b2c54963902999` |
| origin/main | `65d0115`（== HEAD） |
| ahead / behind | `0 / 0` |
| working tree（pre-phase） | clean |
| latest subject（pre-phase） | `docs(admin): plan admin ui write integration` |

→ 符合 frozen baseline `65d0115`。未 pull / merge / reset / rebase / amend / force-push。

前置 lineage：admin ui integration preanalysis（`65d0115`）→ read-only acceptance（verdict PASS；default next = B tiny UI copy correction）→ **本 copy-correction phase（B）**。

---

## 2. Stale-copy finding（被修正者）

來源：`docs/20260617-phase2-admin-ui-integration-preanalysis.md` §4.6 + risk register R6。

Admin UI detail panel 之 SEO dry-run editor「Apply tooltip」與「Future write readiness checklist」仍寫：

- 「Phase 3 dry-run only — actual write path is not enabled. Phase 5 才會啟用實際寫入。」（Apply tooltip）
- 「⏸ Phase 5 actual write path（not enabled；SEO fields 將為首個 enabled write）」（checklist li）
- EJS 註解「此 button 屬視覺 shell；actual write 由 Phase 5 啟用」

此文案**已落後現況**：terminal-only CLI write-path（`admin-write-cli`）已於兩個 draft target 之 `description` 編輯完成並 accepted（Case 1 `5c8646d` / Case 2 `7bf1136`）。stale 文案會讓使用者誤以為「完全沒有任何 actual write 能力」，或誤以為未來 Apply = Phase 5 自動啟用。

> 範圍界定：FB sidecar dry-run 區塊（`index.ejs` ~1342–1344，FB-P5-c）屬**另一條 genuinely-dormant** write path（Apply 永久 disabled），**不在本 finding 範圍**，未修改。

---

## 3. Files changed

| 檔案 | 變更 |
| --- | --- |
| `src/views/admin/index.ejs` | 3 處 copy 修正（+3 / −3） |
| `docs/20260617-phase2-admin-ui-stale-copy-correction-record.md` | 本紀錄（新增） |

source 變更僅文字 / 一處 cosmetic CSS class；無 CSS rule / logic / data / command generation / middleware / write function 變更。

---

## 4. Before / after copy intent

### 4.1 Apply tooltip（rendered，hover 可見）

- **before**：`Phase 3 dry-run only — actual write path is not enabled. Phase 5 才會啟用實際寫入。`
- **after**：`Admin UI 不寫入：此為 dry-run only。實際寫入僅由 terminal-only CLI（admin-write-cli）執行，已於核准之 draft description 編輯實證；Admin UI Apply 維持 disabled，瀏覽器寫入 / middleware / API 未啟用，每次寫入仍須 Dean explicit approval。`

### 4.2 Future write readiness checklist（rendered li）

- **before**：`<li class="ph-pending">⏸ Phase 5 actual write path（not enabled；SEO fields 將為首個 enabled write）</li>`
- **after**：`<li class="ph-done">✅ Terminal-only CLI write path（admin-write-cli）已實證：核准之 draft description 編輯（兩次 accepted）；Admin UI Apply 仍 disabled、瀏覽器寫入 / middleware / API 未啟用；每次 actual write 仍須 Dean explicit approval + 終端機執行</li>`
- class `ph-pending`→`ph-done`：純 CSS 顏色（index.ejs 86–88，灰→綠），無 JS 依賴，屬狀態文案的一部分。

### 4.3 EJS 開發者註解（non-rendered）

- **before**：`此 button 屬視覺 shell；actual write 由 Phase 5 啟用`
- **after**：`此 button 屬視覺 shell；Admin UI Apply 維持 disabled。actual write 僅由 terminal-only CLI（admin-write-cli）執行，已於核准之 draft description 編輯實證，每次仍須 Dean explicit approval`

### 4.4 Wording constraints 遵循

- 不暗示 Admin UI 可寫入。
- 不暗示 Apply 會自動啟用。
- 不暗示 dry-run approval = actual-write approval。
- 不暗示 build / deploy / repost 與 write 耦合。
- 文字保持精簡，適合 UI。

---

## 5. Verification evidence

- `git diff --stat`：`src/views/admin/index.ejs | 6 +++---`，1 file changed, 3 insertions(+), 3 deletions(-)。
- `git diff`：三處皆 string/text；Apply button 仍 `disabled aria-disabled="true"`（未動）；無 event handler 變更；無 disabled attribute 變更。
- grep（`app.post` / `configureServer` / `fs.writeFile` / `fetch(` / `XMLHttpRequest` / `safeWrite` / `adminWrite` / `admin-write-cli` execution）：無新增寫入 / server / fetch / 命令執行路徑；既有 `navigator.clipboard.writeText`（commerce YAML copy helper，~2740）為 pre-existing、未觸碰。
- grep（`apply-disabled` / `disabled aria-disabled`）：Apply button（index.ejs 1515）維持 `disabled aria-disabled="true"`。
- 渲染驗證：三處皆 static server-rendered strings，rendered 輸出 deterministic 等於新字串；本 phase 未啟動 `npm run dev`（維持最小 scope，不起 server / 不 build）。

---

## 6. Explicit guardrail statement

- no behavior change（source/UI copy-only）。
- Apply remains disabled（`disabled aria-disabled="true"` 未變）。
- no Admin Apply activation。
- no middleware / API / server route / POST endpoint。
- no browser-to-filesystem write path。
- no `admin:write` / no `admin-write-cli.js` execution。
- no `--apply` / no `dryRun:false`。
- no production dry-run / no `safe-write:test`。
- no production content touched。
- no content / settings / package / lockfile / dist / gh-pages / `.cache` 變更。
- no build / deploy / Blogger repost。
- no third write opened。
- no validate / guard 重跑。
- no amend / rebase / force-push。
- CLAUDE.md / MEMORY.md 未變更。

---

## 7. Recommended next session

`20260617-pm-phase2-admin-ui-stale-copy-correction-acceptance-readonly-a`
—— read-only 驗收本 copy 修正（diff copy-only / Apply 仍 disabled / 文案誠實反映現況）；不落 source。其後大概率 idle freeze，除非 Dean 決定推進 §10 step 2（UI copyable payload panel）並滿足 acceptance criteria + explicit approval。

---

## 8. Cross-links

- `docs/20260617-phase2-admin-ui-integration-preanalysis.md`（§4.6 finding / R6 / staged UI-0→UI-6）
- `docs/20260617-phase2-admin-write-path-milestone-checkpoint.md`（write-path boundary）
- `docs/20260617-phase2-admin-write-path-repeatable-workflow.md`（SOP Stage 0–8）

---

（本文件結束）
