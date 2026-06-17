# Phase 2 — Admin UI Phase 3 / Phase 4 Wording Correction（source/UI copy-only）

> Session: `20260617-pm-phase2-admin-ui-phase3-phase4-wording-correction-a`
> Date: 2026-06-17（Asia/Taipei）
> Type: **source/UI copy-only / string-only**。無行為變更；不實作 static payload preview；不啟用 Apply；不啟用 middleware / API；不執行任何寫入。

---

## 1. Baseline

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| pre-phase HEAD（short / full） | `e402ed7` / `e402ed73466376d9d104df549d6cb7ea893ce4d0` |
| origin/main | `e402ed7`（== HEAD） |
| ahead / behind | `0 / 0` |
| working tree（pre-phase） | clean |
| latest subject（pre-phase） | `docs(admin): plan static payload preview implementation` |

→ 符合 frozen baseline `e402ed7`。未 pull / merge / reset / rebase / amend / force-push。

前置 lineage：stale-copy correction（`f0371ce`）→ static payload preview implementation plan（`e402ed7`）→ **phase3/phase4 wording correction preanalysis（verdict PASS，無新 commit）** → **本 copy-only correction phase**。

---

## 2. Findings corrected（W1 / W2）

來源：`docs/20260617-phase2-admin-ui-phase3-phase4-wording-correction-preanalysis`（preanalysis verdict PASS）之 core in-scope items。

- **W1**（`src/views/admin/index.ejs` ~1517）：SEO dry-run editor 末端 disabled Apply button 之**可見文字**仍寫「Phase 3 dry-run only」。上一輪 stale-copy correction（`f0371ce`）已校正其 tooltip（1516），但**按鈕可見字未同步**，殘留「Phase 3」phase-number 框架。
- **W2**（`src/views/admin/index.ejs` ~1533）：Future write readiness checklist li 仍以 `ph-current` + `🔄` +「current phase」描述 Phase 3 dry-run UI，與同清單 1535 行之「✅ terminal-only CLI write 已實證（兩次 accepted）」自相矛盾，暗示「系統整體仍停在 Phase 3」。

> 範圍界定：
> - **W3**（1534「Phase 4 … not started」）= 仍屬實（middleware / API 確實未啟動）→ **不改**。
> - **F1 / F2**（FB sidecar「Phase 3 dry-run only」/ FB-P5-c 文案）= genuinely dormant 且獨立 write path → **out of scope，不改**。
> - **C1**（非 rendered provenance / CSS 註解之歷史 phase tag）→ **out of scope，不改**。
> - **W4 / W5**（section-lede / System checks 之「對 content dormant」措辭）= optional / low priority；非與 W1/W2 相鄰 → **預設不改，本 phase 維持不動**。

---

## 3. Files changed

| 檔案 | 變更 |
| --- | --- |
| `src/views/admin/index.ejs` | 2 處 copy 修正（W1 按鈕可見字、W2 checklist li 文字 + 狀態 class） |
| `docs/20260617-phase2-admin-ui-phase3-phase4-wording-correction-record.md` | 本紀錄（新增） |

source 變更僅文字 / 一處 cosmetic 狀態 class（`ph-current`→`ph-done`，純 CSS 顏色，沿用 `f0371ce` 之先例）；無 CSS rule / logic / data / event handler / command generation / middleware / write function 變更。

---

## 4. Before / after wording intent

### 4.1 W1 — SEO Apply button 可見文字（rendered）

- **before**：`Apply (disabled — Phase 3 dry-run only)`
- **after**：`Apply (disabled — dry-run preview only; actual write remains terminal-only)`
- 意圖：去除 stale「Phase 3」phase-number 框架；明示 Apply 維持 disabled、此為 SEO dry-run preview only、實際寫入維持 terminal-only CLI（與已校正之 tooltip 1516 一致；tooltip 已含「須 Dean explicit approval」）。

### 4.2 W2 — readiness checklist li（rendered）

- **before**：`<li class="ph-current">🔄 Phase 3 dry-run UI（current phase；validator preview + disabled Apply button）</li>`
- **after**：`<li class="ph-done">✅ Phase 3 dry-run UI landed（preview-only；validator preview + disabled Admin UI Apply button）</li>`
- 意圖：避免「current phase」措辭，不暗示 Phase 3 仍為系統整體當前狀態；表達 SEO dry-run UI 已 landed 且 preview-only、Apply 維持 disabled；與 1535 行「terminal-only CLI write 已實證」狀態一致（消除自相矛盾）。
- class `ph-current`→`ph-done`：純 CSS 顏色（index.ejs 86–88，黃→綠），無 JS 依賴，屬狀態文案的一部分（mirror `f0371ce` / stale-copy-correction-record §4.2 先例）。

### 4.3 Wording constraints 遵循

- 不暗示 Admin UI 可寫入。
- 不暗示 Apply 會自動啟用。
- 不暗示 dry-run approval = actual-write approval。
- 不暗示 Phase 3 為系統整體當前狀態。
- 不更動 W3（Phase 4 not started 仍屬實）。
- 文字保持精簡，適合 UI。

---

## 5. Verification evidence

- `git diff --stat`：`src/views/admin/index.ejs`（2 行 copy 修正）+ 本 docs record（新增）。
- `git diff`：兩處皆 string/text；W1 為按鈕文字節點；W2 為 li 文字 + 狀態 class（`ph-current`→`ph-done`）。Apply button（1515）維持 `disabled aria-disabled="true"`（未動）。
- grep：未新增 `fetch(` / `XMLHttpRequest` / `method="post"` / `app.post` / `fs.writeFile` / `writeFileSync` / `admin-write-cli` caller / `spawn` / `exec`；未新增 `--apply` / `dryRun:false`。
- 既有 `apply-disabled` button 之 `disabled aria-disabled="true"` 未變；無 event handler 變更；無 disabled / aria-disabled 行為變更。
- 本 phase 未跑 validate / guard（copy-only，per hard rules default no validate）；未起 dev server。

---

## 6. Current truth preserved

- terminal-only CLI write path 已於核准之 draft `description` 編輯實證（兩次 accepted）。
- Admin UI Apply remains disabled。
- browser write / middleware / API remain disabled。
- every actual write 仍須 Dean fresh explicit approval + 終端機執行。
- static payload preview 尚未實作、尚未核准。
- source implementation 尚未核准。
- FB sidecar write path remains genuinely dormant unless separately proven。

---

## 7. Explicit guardrail statement

- no behavior change（source/UI copy-only / string-only）。
- no event handler change。
- no disabled / aria-disabled behavior change。
- no source implementation。
- no static payload preview implementation（no payload markup / JS added）。
- no Admin Apply activation。
- no middleware / API / server route / POST endpoint。
- no browser-to-filesystem write path。
- no `admin:write` / no `admin-write-cli.js` execution。
- no `--apply` / no `dryRun:false`。
- no production dry-run / no `safe-write:test`。
- no production content touched。
- no content / settings / scripts / package / lockfile / dist / gh-pages / `.cache` 變更。
- no build / deploy / Blogger repost。
- no third write opened。
- no `.cache` regeneration / no dev server。
- no amend / rebase / force-push / no package change。
- CLAUDE.md / MEMORY.md 未變更。

---

## 8. Recommended next session

`20260617-pm-phase2-admin-ui-phase3-phase4-wording-correction-acceptance-readonly-a`
—— read-only 驗收本 copy 修正（diff copy-only / Apply 仍 disabled / W1·W2 文案誠實反映 terminal-only write 現況 / W3·FB·C1·W4·W5 未動）；不落 source。其後大概率 idle freeze，除非 Dean 決定推進 static payload preview source implementation（須 implementation plan §10 acceptance criteria 全滿足 + explicit approval）。

---

## 9. Cross-links

- `docs/20260617-phase2-admin-ui-stale-copy-correction-record.md`（上一輪 tooltip / checklist 校正，`f0371ce`）
- `docs/20260617-phase2-admin-ui-static-payload-preview-implementation-plan.md`（§7.1 已拍板 Option B：先 tiny copy-only phase 再實作）
- `docs/20260617-phase2-admin-ui-integration-preanalysis.md`（§4.6 finding / R6）
- `docs/20260617-phase2-admin-write-path-milestone-checkpoint.md`（write-path boundary）

---

（本文件結束）
