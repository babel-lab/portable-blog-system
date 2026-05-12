# Phase 8-g Completion Report — overall

> 批次系列：Phase 8-g-0 系列（候選分析 / roadmap）+ Phase 8-g-2 系列（new-post.js series prompt + stderr suggestion）+ Phase 8-g-2-d 系列（validate-content series warning 規則）+ Phase 8-g-3（overall completion report 初版）+ Phase 8-g-4 系列（候選 C cross-link 補強）+ Phase 8-g-5（sample post 對齊）+ Phase 8-g-6（content/templates 對齊）+ Phase 8-g-7 / 8-g-8 / 8-g-9 / 8-g-10（sample/template/roadmap landings sync 與自我參照修正）+ Phase 8-g-11（fb-sidecar §5.2.6 讀取分析；維持保守）+ Phase 8-g-12 系列（`series-title-unresolved` warning + fixture）+ 本批（Phase 8-g-12-d docs sync）
> 範圍：Phase 8-g 整體統整收尾報告；含 Phase 8-g-12 之 validate-content 規則 + fixture 落地後之 docs 同步；本批僅修改 `docs/series-schema.md` / `docs/phase-8g-completion-report.md` / `docs/future-roadmap.md`
> 起點 HEAD：`b1679d1`（Phase 8-f-8-b completion report）
> 終點 HEAD：`78d1f30`（Phase 8-g-12-c fixture；本批前 HEAD）
> Phase 8-g 已落地 commits：**28**（不含本批；含 Phase 8-g-3 `c3b6c63` + Phase 8-g-4 系列 4 commits（`4730152` / `ddae181` / `eec8ff7` / `5d38d46`）+ Phase 8-g-5 `44c0e8f` + Phase 8-g-6 `5976162` + Phase 8-g-7 `a9db65b` + Phase 8-g-8 `38a0007` + Phase 8-g-9 `ffa0310` + Phase 8-g-10 `be4304f` + Phase 8-g-12 系列 2 commits（`a73c064` / `78d1f30`）+ Phase 8-g-0 系列 2 commits + Phase 8-g-2 系列 6 commits + Phase 8-g-2-d 系列 7 commits）
> `dist` / `dist-blogger` / `dist-promotion` baseline：**主軸 byte-identical**；Phase 8-g-5 sample posts 對齊**間接**影響 2 個 `dist/posts/{slug}/index.html`（各少 1 個由 H1 → H2 自動降級產生之 `<h2>`；詳見 §3.4 / §3.6.4）；Phase 8-g-12 純 validate 規則 + fixture；**不影響 dist baseline**
> `npm run validate:content` baseline：**`0 error / 11 warning on 6 post(s)`**（Phase 8-g-12-c fixture 落地後之預期變動：`0/9/5` → `0/11/6`；+2 warnings / +1 post 屬 fixture 預期觸發，**非 regression**；詳見 §3.2 / §3.3）
> git status：clean（working tree 無 modified / untracked / deleted；本批 commit 後仍 clean）
> 未 push、未設 remote、未 amend（per Phase 8-g 起手批次規範；`c3b6c63` / `4730152` / `ddae181` / `eec8ff7` / `5d38d46` / `44c0e8f` / `5976162` / `a9db65b` / `38a0007` / `ffa0310` / `be4304f` / `a73c064` / `78d1f30` 皆為新建 commit，未 amend / rebase 任何既有 commit）

---

## §1 本階段目的

Phase 8-g 之核心目的：

1. **候選排程**：在 Phase 8-f 完成後，對「驗證 / 工具 / 報表 / docs」層之候選做風險分析與狀態排程（9 項數字候選 + 候選 C + sample/template alignment + titleTemplate-unresolved 升級；含 `candidate` / `landed` / `partially landed` / `deferred` / `not recommended` 五種狀態；詳見 `docs/phase-8g-candidate-analysis.md` §6 + 本文件 §3.1）。
2. **作者工具落地**：完成不影響 dist baseline 之候選 #2（new-post.js series 欄位提示）與候選 #3（series number gap filling），共 4 commits + 1 docs commit（Phase 8-g-2 系列）。
3. **validate 規則補強**：補完 series metadata 之 validate-content 規則覆蓋（4 條新 warning + 2 篇 validation-fixtures），共 6 commits + 1 docs commit + 1 報告 commit（Phase 8-g-2-d 系列）。
4. **fixture deferred 維持**：保留 fixture / sample end-to-end 驗證（候選 E / Phase 8-g-1）於 deferred 狀態，待部署隔離機制就緒；本階段**不執行**。
5. **不擴大 customer-facing surface**：不進入 H1 接 `series.titleTemplate` / FB `.txt` 顯示 `titleEn` / publish-checklist 顯示組合標題等接入（屬 `not recommended`；per Phase 8-f-5-c §17.3 / 8-f-6-a 既有保守決策）。
6. **文件 cross-link 補強落地（候選 C）**：完成 §5.1 必要補強（schema docs → phase reports cross-link，3 檔）+ §5.2.1~5 可選後向 link（phase reports 8-b ~ 8-f 各補 1 行，5 檔）；§5.2.6（`fb-sidecar-schema.md`）依保守決策保留未補（Phase 8-g-11 讀取分析後維持決策；屬可選；無功能影響）。
7. **sample / template 層 deprecated cleanup 落地（Phase 8-g-5 / 8-g-6）**：
   - **sample posts**：2 篇 `content/github/posts/*.md` 之 `type: "tech-note"` → `contentKind: "tech-note"`、移除 body leading `# 文章標題`（commit `44c0e8f`；Phase 8-g-5）
   - **templates**：5 個 `content/templates/*.md` 之 `type` → `contentKind`、移除 body leading `# 文章標題` placeholder（commit `5976162`；Phase 8-g-6）
   - **validate baseline 已從 `0/13/7` 收斂回 `0/9/5`**（後於 Phase 8-g-12-c fixture 落地再變為 `0/11/6`，per §3.3 軌跡）
   - **僅清理 sample/template 來源層**；**不等同 source code 層 legacy fallback 退場**（仍屬 Phase 8-h 或更晚；詳見 §3.6.5 / §3.7.5）
8. **`series-title-unresolved` warning 規則 + fixture 落地（Phase 8-g-12）**：
   - **規則升級**：`titleTemplate` 之 unresolved placeholders 偵測**已升級**為 `validate-content` user-visible warning（commit `a73c064`；Phase 8-g-12-b）— 對應 `docs/series-schema.md` §15.4.2 / §15.4.3 之 helper-internal 升級候選；warning-only；ready/published 範圍
   - **Fixture 配套**：`_test-series-title-unresolved.md`（commit `78d1f30`；Phase 8-g-12-c）採 unsupported-placeholder（`{post.unknown}`）規則自證；baseline `0/9/5` → `0/11/6`（+2 warnings / +1 post：`series-id-not-in-settings` + `series-title-unresolved`；屬獨立面向之預期共存，per `docs/series-schema.md` §21.3）
   - **本升級不擴大** source code 層退場（per §3.6.5 / §3.7.5）；`load-posts.js` `contentKind ?? type` fallback / `validate-content.js` `frontmatter-uses-deprecated-type` warning rule / `parse-markdown.js` H1 → H2 自動降級**仍存在**
   - **本批（Phase 8-g-12-d）docs sync** 將上述升級反映於 `docs/series-schema.md` §15.4.2 / §15.4.3 / §18.5 + 本文件 + `docs/future-roadmap.md`

Phase 8-g 與既有 Phase 8-f 之分工：

- **Phase 8-f**：series metadata 之 build pipeline 接入（`normalized.series` / `resolve-series-title.js` / `series.hashtags` inheritance backfill / Blogger copy-helper `[11]` / promotion manifest 4 個 additive 欄位）— 屬「資料層 + 既有 customer-facing surface」。
- **Phase 8-g**：基於 Phase 8-f 既有資料層之「工具 / 驗證 / 報表 / docs cross-link / sample-template cleanup / titleTemplate validate 升級」延伸 + 候選排程 — 屬「不擴大 customer-facing surface」之保守延伸。

---

## §2 Commit 清單（依子批次系列）

### 2.1 Phase 8-g-0 系列（候選分析與 roadmap）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-0-a | （無 commit）| 對話內 | 候選方向初步分析 |
| 8-g-0-b | `77fb764` | docs | record phase 8-g candidate list and defer fixture landing |
| 8-g-0-c | `a37d92e` | docs | expand future-roadmap with phase 8 progress and next steps |
| 8-g-0-d | （無 commit）| 對話內 | new-post.js series prompt 讀取分析 |

### 2.2 Phase 8-g-2 系列（new-post.js series prompt + stderr suggestion）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-2-b1 | `fa7d825` | fix | use contentKind in new-post.js template (deprecated type) |
| 8-g-2-b2 | `bb58b2d` | feat | add series CLI flags to new-post.js |
| 8-g-2-c-a | （無 commit）| 對話內 | next series.number suggestion 讀取分析 |
| 8-g-2-c-b | `2262938` | feat | add suggest-series-number helper (no caller yet) |
| 8-g-2-c-c | `2507748` | feat | print stderr next series.number suggestion in new-post.js |
| 8-g-2-c-d | `9826bd5` | docs | record new-post.js series prompt and stderr suggestion landing |
| 8-g-2-e | `3c9b2e3` | docs | add phase 8-g-2 completion report |

Phase 8-g-2 完整落地紀錄：`docs/phase-8g-2-completion-report.md`

### 2.3 Phase 8-g-2-d 系列（validate-content series warning 規則）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-2-d-a | （無 commit）| 對話內 | validate series warning 規則讀取分析 |
| 8-g-2-d-b | `e70af85` | feat | add series-id-not-in-settings warning to validate-content |
| 8-g-2-d-c | `bf58364` | feat | add series-block-missing-number warning to validate-content |
| 8-g-2-d-d | `ca0381a` | feat | add series-subtitle-without-id warning to validate-content |
| 8-g-2-d-f | `94ca4c6` | docs | record validate-content series rule landings |
| 8-g-2-d-e-a | （無 commit）| 對話內 | series-number-duplicate warning + fixture 讀取分析 |
| 8-g-2-d-e-b | `89bbbd0` | feat | add series-number-duplicate warning to validate-content |
| 8-g-2-d-e-c | `f97cded` | test | add series-number-duplicate validation fixtures |
| 8-g-2-d-g | `c29f63b` | docs | add phase 8-g-2-d completion report |

Phase 8-g-2-d 完整落地紀錄：`docs/phase-8g-2-d-completion-report.md`

### 2.4 Phase 8-g-3（overall completion report 初版）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-3 | `c3b6c63` | docs | add phase 8-g overall completion report（含 `docs/future-roadmap.md` §3 / §7.2 同步）|

### 2.5 Phase 8-g-4 系列（候選 C cross-link 補強）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-4-a | （無 commit）| 對話內 | 候選 C docs cross-link 讀取分析（10 份目標檔案 / 缺口識別 G1~G5 / §5.1 必要 + §5.2 可選 + §5.3 不建議補強之分級）|
| 8-g-4-b | `4730152` | docs | cross-link schema docs to phase reports（§5.1 必要補強：`phase-8d-completion-report.md` 補前向 link + `publish-bundle.md` §8.1 + `publish-json-schema.md` §12；3 檔 +32 行）|
| 8-g-4-c | `ddae181` | docs | add backward links between phase reports（§5.2 可選後向 link：`phase-8b/c/d/e/f-completion-report.md` 各補 1 行 prose；5 檔 +10 行；§5.2.6 `fb-sidecar-schema.md` 依保守決策未執行）|
| 8-g-4-d | `eec8ff7` | docs | update phase 8-g overall completion report with candidate C landings |
| 8-g-4-e | `5d38d46` | docs | sync future-roadmap with candidate C landings |

### 2.6 Phase 8-g-5 / 8-g-6 / 8-g-7 / 8-g-8 系列（sample / template / roadmap / completion report 同步）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-5-a | （無 commit）| 對話內 | sample post H1 + deprecated type 對齊讀取分析 |
| 8-g-5-b | `44c0e8f` | fix | align legacy type and body H1 in github sample posts（2 檔 +2 / −6；baseline `0/13/7` → `0/9/5`）|
| 8-g-6-a | （無 commit）| 對話內 | content/templates 對齊讀取分析 |
| 8-g-6-b | `5976162` | fix | align legacy type and body H1 in post templates（5 檔 +5 / −15；baseline 維持 `0/9/5`）|
| 8-g-7 | `a9db65b` | docs | sync future-roadmap with sample/template alignment landings |
| 8-g-8 | `38a0007` | docs | sync overall completion report with sample/template landings |

### 2.7 Phase 8-g-9 / 8-g-10（roadmap self-reference sync）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-9 | `ffa0310` | docs | sync future-roadmap with Phase 8-g-7 / 8-g-8 landings |
| 8-g-10 | `be4304f` | docs | fix 8-g-9 self-reference in future-roadmap |

### 2.8 Phase 8-g-11（fb-sidecar §5.2.6 讀取分析；維持保守）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-11 | （無 commit）| 對話內 | fb-sidecar-schema.md §5.2.6 補連 8-c / 8-e phase report 讀取分析；結論：維持 Phase 8-g-4-c「不過度 cross-link」保守決策；未補 |

### 2.9 Phase 8-g-12 系列（`series-title-unresolved` warning + fixture）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-12-a | （無 commit）| 對話內 | `titleTemplate unresolved` 升級為 user-visible warning 讀取分析（既有 helper / normalize / build-promotion / copy-helper 之偵測流程 + validate-content 缺口識別 + 升級位置評估）|
| 8-g-12-b | `a73c064` | feat | add series-title-unresolved warning to validate-content（`src/scripts/validate-content.js` +44 / −0；新規則 + import `resolve-series-title.js`；warning-only；ready/published 範圍；baseline 維持 `0/9/5`）|
| 8-g-12-c | `78d1f30` | test | add series-title-unresolved validation fixture（`content/validation-fixtures/github/posts/_test-series-title-unresolved.md` +22；採 unsupported-placeholder `{post.unknown}`；baseline `0/9/5` → `0/11/6`）|

### 2.10 本批（Phase 8-g-12-d docs sync）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-12-d | （未 commit；待批准）| docs | sync docs with series-title-unresolved landing（`docs/series-schema.md` §15.4.2 / §15.4.3 / §18.5 + `docs/phase-8g-completion-report.md` + `docs/future-roadmap.md`）|

### 2.11 合計

- **Phase 8-g 已落地 commits：28**（不含本批）
  - Phase 8-g-0 系列：2（`77fb764` / `a37d92e`）
  - Phase 8-g-2 系列：6（`fa7d825` / `bb58b2d` / `2262938` / `2507748` / `9826bd5` / `3c9b2e3`）
  - Phase 8-g-2-d 系列：7（`e70af85` / `bf58364` / `ca0381a` / `94ca4c6` / `89bbbd0` / `f97cded` / `c29f63b`）
  - Phase 8-g-3：1（`c3b6c63`）
  - Phase 8-g-4 系列（b/c/d/e）：4（`4730152` / `ddae181` / `eec8ff7` / `5d38d46`）
  - Phase 8-g-5：1（`44c0e8f`）
  - Phase 8-g-6：1（`5976162`）
  - Phase 8-g-7：1（`a9db65b`）
  - Phase 8-g-8：1（`38a0007`）
  - Phase 8-g-9：1（`ffa0310`）
  - Phase 8-g-10：1（`be4304f`）
  - Phase 8-g-12 系列（b/c）：2（`a73c064` / `78d1f30`）
- 對話內讀取分析批次（無 commit）：**8**（8-g-0-a / 8-g-0-d / 8-g-2-c-a / 8-g-2-d-a / 8-g-2-d-e-a / 8-g-4-a / 8-g-5-a / 8-g-6-a / 8-g-11 / 8-g-12-a）— 含 Phase 8-g-11 之決策保守路線
- 本批新增 commit：**1**（待作者批准）

---

## §3 功能完成摘要

### 3.1 候選清單最終狀態

per `docs/phase-8g-candidate-analysis.md` §6 + 候選 C 落地（Phase 8-g-4 系列）+ sample/template alignment 落地（Phase 8-g-5 / 8-g-6）+ titleTemplate-unresolved 升級（Phase 8-g-12）：

| # | 候選 | 狀態 | 落地批次 / 備註 |
|---|---|---|---|
| 1 | validation / report 補強 | ⚠️ `partially landed` | Phase 8-g-2-d-b / c / d / e-b 共 4 條 warning 落地 + Phase 8-g-12-b `series-title-unresolved` 升級落地；剩餘 series report（`dist-reports/series.txt`）仍 `candidate` |
| 2 | `new-post.js` series 欄位提示 | ✅ `landed` | Phase 8-g-2-b1 / b2 / c-c 落地 |
| 3 | series number gap filling 規則 | ✅ `landed` | Phase 8-g-2-c-b / c-c 落地（stderr-only 保守路線）|
| 4 | FB `.txt` 顯示 `titleEn` / `seriesResolvedTitle` | `not recommended` | per Phase 8-f-6-a 既有保守決策（FB 字長受限）|
| 5 | site default hashtags | `candidate` | 設定層補 site-level 預設 hashtags |
| 6 | first article `.fb.md` hashtags fallback | `candidate` | 系列首篇可繼承上一篇 hashtags |
| 7 | Blogger tags inheritance | `candidate` | Blogger 平台 `tags` 從 series 繼承 |
| 8 | H1 接 series `titleTemplate` | `not recommended` | per Phase 8-f-5-c §17.3 既有保守決策（SEO 風險 / 字長風險）|
| C | docs cross-link 補強 | ✅ `landed` | Phase 8-g-4-b / 4-c 落地（commits `4730152` + `ddae181`）；§5.2.6 `fb-sidecar-schema.md` 經 Phase 8-g-11 讀取分析後依保守決策維持未補 |
| S/T | sample / template alignment（deprecated `type` + body leading H1 cleanup）| ✅ `landed` | Phase 8-g-5（commit `44c0e8f`：2 篇 sample posts）+ Phase 8-g-6（commit `5976162`：5 個 templates）落地；僅 sample/template 來源層；source code 層 legacy fallback 仍存在（屬 Phase 8-h 或更晚；詳見 §3.6.5 / §3.7.5）|
| F | `titleTemplate unresolved` 升級為 `validate-content` user-visible warning | ✅ `landed` | Phase 8-g-12-b（commit `a73c064`）落地新規則 `series-title-unresolved`；Phase 8-g-12-c（commit `78d1f30`）fixture 配套；詳見 §3.9 |
| E | fixture / sample end-to-end 驗證 | `deferred` | 屬 Phase 8-g-1；詳見 §4 |

> 命名說明：`S/T` / `F` 為 phase-8g-completion-report.md 內部代號，與 `docs/future-roadmap.md` §5.1 之 `~~E~~` / `~~F~~`（同候選）為同義；採描述性代號以避免與 candidate-analysis §6 之 candidate E（fixture / sample end-to-end 驗證 deferred）之既有命名衝突。

### 3.2 validate baseline 現況

`npm run validate:content` baseline：**`0 error / 11 warning on 6 post(s)`**

11 warnings 分布（依來源檔分類；**全為 validation fixtures 自證資產**）：

| # | 來源檔 | 觸發 warning | 性質 |
|---|---|---|---|
| 1 | `content/validation-fixtures/github/posts/_test-fb-titleEn.md` | `fb-md-titleEn-invalid-type` | Phase 8-e fixture（既有；規則自證資產）|
| 2 | `content/validation-fixtures/github/posts/_test-series-not-object.md` | `series-not-object` | Phase 8-e fixture（既有）|
| 3 | `content/validation-fixtures/github/posts/_test-series-validation.md` | `series-id-invalid`, `series-number-invalid`, `series-subtitle-invalid-type` | Phase 8-e fixture（既有）|
| 4 | `content/validation-fixtures/github/posts/_test-series-dup-a.md` | `series-id-not-in-settings`, `series-number-duplicate` | Phase 8-g-2-d-e-c fixture（規則自證資產）|
| 5 | `content/validation-fixtures/github/posts/_test-series-dup-b.md` | `series-id-not-in-settings`, `series-number-duplicate` | Phase 8-g-2-d-e-c fixture（規則自證資產）|
| 6 | `content/validation-fixtures/github/posts/_test-series-title-unresolved.md` | `series-id-not-in-settings`, `series-title-unresolved` | **Phase 8-g-12-c fixture（本系列新增；規則自證資產）** |

合計：**11 warnings / 6 posts**。

依性質分類合計：

| 性質 | warning 數 | post 數 |
|---|---|---|
| Phase 8-e 既有 fixture（規則自證）| 5 | 3 |
| Phase 8-g-2-d-e-c 新增 fixture（規則自證）| 4 | 2 |
| **Phase 8-g-12-c 新增 fixture（規則自證；本系列新增）**| **2** | **1** |
| **合計** | **11** | **6** |

**重要**：11 warnings **全部為 validation fixtures 之自證資產**；**無正式 sample post 之 noise warnings**（兩篇 sample 之 `body-leading-h1` + `frontmatter-uses-deprecated-type` 共 4 條已於 Phase 8-g-5 `44c0e8f` 消除）。

### 3.3 baseline 變化軌跡（含 sample alignment 收斂 + titleTemplate fixture 變動）

| 階段 | baseline | 變化原因 |
|---|---|---|
| Phase 8-g-2-d-e-c 前 | `0 error / 9 warning on 5 post(s)` | 兩篇 sample posts 各觸發 2 條 noise warning（4）+ Phase 8-e 既有 fixture 5 條 = 9 / 5 |
| Phase 8-g-2-d-e-c 後 | **`0 error / 13 warning on 7 post(s)`** | 新增 2 篇 fixture（`_test-series-dup-a/b`）各觸發 2 條規則自證 warning（+4 / +2）；屬 fixture 預期 |
| Phase 8-g-5（`44c0e8f`）後 | **`0 error / 9 warning on 5 post(s)`** | 兩篇 sample posts 之 `body-leading-h1` + `frontmatter-uses-deprecated-type` 共 4 條 noise warning 消除（−4 / −2）；屬 sample noise 清除 |
| Phase 8-g-12-b（`a73c064`）後 | `0 error / 9 warning on 5 post(s)`（不變）| 新增 `series-title-unresolved` 規則；無觸發樣本 |
| Phase 8-g-12-c（`78d1f30`）後 | **`0 error / 11 warning on 6 post(s)`** | 新增 fixture `_test-series-title-unresolved` 觸發 2 條 warning（`series-id-not-in-settings` + `series-title-unresolved`）；+2 / +1；屬 fixture 預期觸發 |

**+2 warnings / +1 post（從 `0/9/5` → `0/11/6`）為 Phase 8-g-12-c fixture 預期變動，非 regression**：

per `docs/phase-8g-2-d-completion-report.md` §4.3 + Phase 8-g-12-c 讀取分析：

1. fixture 設計刻意觸發新規則（per Phase 8-g-12-c batch spec）
2. fixture `series.id="_test-title-template"` 不在 `content/settings/series.json` 中（採方案 A 保守決策；不污染作者實際 series namespace）→ `series-id-not-in-settings`（Phase 8-g-2-d-b）必觸發（預期）
3. fixture `series.titleTemplate="{post.title} — {post.unknown}"` 含 unsupported-placeholder（`{post.unknown}` 不在 `resolve-series-title.js` SUPPORTED 7 個 placeholder 之內）→ `series-title-unresolved`（Phase 8-g-12-b）必觸發（預期）
4. 兩條 warning 屬獨立面向之設計（settings 配置 vs. placeholder 解析；per `docs/series-schema.md` §15.4.3 + §21.3）；刻意共存
5. fixture 之 frontmatter（`contentKind` / `category` / `tags` / `cover` / `description` / body 不以 `#` 開頭）皆完整對齊，未觸發其他 noise warning

baseline 變動於 `docs/phase-8g-2-d-completion-report.md` §4 + 本文件 §3.6.4 + §3.9 已詳細記錄並標示為「**預期變動，非 regression**」；本報告再次確認此判定。

### 3.4 build / dist baseline

| 工具 | baseline | 狀態 |
| --- | --- | --- |
| `npm run build:github` 輸出 | **主軸不變**；2 個 GitHub post detail 變動 | Phase 8-g-5 sample alignment 間接影響 `dist/posts/github-pages-blog-planning/index.html` + `dist/posts/portable-blog-system-mvp/index.html`：body 各少 1 個 `<h2>`（原 markdown body `# H1` 被 `parse-markdown.js` 自動降級之 H2；移除 source 後消失）|
| `npm run build:blogger` 輸出 | **主軸 byte-identical** | Phase 8-g-5 之 `github-pages-blog-planning.md` 之 Blogger `mode: summary` 從 frontmatter description 取，**不從 body**；`portable-blog-system-mvp.md` 之 `blogger.enabled: false`，不輸出 |
| `npm run build:promotion` 輸出 | byte-identical | 構建從 frontmatter `promotion.facebook.message` 取，不從 body |
| `npm run build:sitemap` 輸出 | byte-identical | 構建從 slug / date 取，不從 body |
| `dist-blogger/posts/*/copy-helper.txt` / `meta.json` / `publish-checklist.txt` | byte-identical | 構建從 frontmatter 取，不從 body |
| `dist-reports/*` | byte-identical | 構建邏輯與 body 無關 |
| `package.json` | byte-identical | Phase 8-g 全程未新增 npm script / 外部相依 |

Phase 8-g 之所有實作均**未直接接 build pipeline**：

- **new-post.js / suggest-series-number.js**（Phase 8-g-2 系列）→ 純作者工具層；不在 `build:*` 流程
- **validate-content.js 4 條新規則**（Phase 8-g-2-d 系列）→ 純檢查工具；不在 `build:*` 流程；exit code 不被任何 build script 依賴
- **2 篇 validation-fixtures**（Phase 8-g-2-d-e-c）→ 位於 `content/validation-fixtures/`；不被任何 `build:*` 掃到
- **9 檔 docs cross-link 補強**（Phase 8-g-4 系列）→ 純 markdown 文件；不接 build pipeline
- **2 篇 sample posts 對齊**（Phase 8-g-5；commit `44c0e8f`）→ source 變動於 `content/github/posts/`；**間接**影響 `build:github` 之 2 個 dist 檔（per `parse-markdown.js` H1 demotion 邏輯）
- **5 個 templates 對齊**（Phase 8-g-6；commit `5976162`）→ `content/templates/` **不在任何 `build:*` 之 loader path 內**；不影響 dist
- **future-roadmap 同步**（Phase 8-g-7 / 8-g-9）+ **completion report 同步**（Phase 8-g-8）+ **roadmap self-reference 修正**（Phase 8-g-10）+ **本批 docs sync**（Phase 8-g-12-d）→ 純 docs；不接 build pipeline
- **fb-sidecar §5.2.6 讀取分析**（Phase 8-g-11）→ 純讀取；無變動
- **`series-title-unresolved` warning 規則**（Phase 8-g-12-b；commit `a73c064`）→ 純 validate 規則；不在 `build:*` 流程；exit code warning-only 不阻擋 build
- **`_test-series-title-unresolved` fixture**（Phase 8-g-12-c；commit `78d1f30`）→ 位於 `content/validation-fixtures/`；不被任何 `build:*` 掃到

### 3.5 Phase 8-g-4 系列：候選 C cross-link 補強落地紀錄

候選 C 之 docs cross-link 補強分 3 個 commit 落地（`4730152` / `ddae181` / `eec8ff7`），外加 1 個讀取分析批次（`8-g-4-a`）+ 1 個 roadmap sync（`5d38d46`；8-g-4-e）。

詳細落地紀錄詳見既有結構（§3.5.1 §5.1 必要補強 / §3.5.2 §5.2 可選後向 link / §3.5.3 §5.2.6 依保守決策未補 / §3.5.4 對 dist / build / validate 之影響 / §3.5.5 Phase 8-g-4-d completion report 更新 / Phase 8-g-4-e roadmap sync）。

per `docs/series-schema.md` 之 §15 / §17 / §18 各章節 cross-link；per `docs/phase-8g-candidate-analysis.md` §10 / §11 候選分析；不重述。

### 3.6 Phase 8-g-5 系列：sample post 對齊落地紀錄

Phase 8-g-5 補完 2 篇正式 sample post 之 deprecated `type` 與 body leading H1 cleanup。

| 子節 | 範圍 |
|---|---|
| 3.6.1 | 讀取分析（8-g-5-a；無 commit）|
| 3.6.2 | 實作（8-g-5-b；commit `44c0e8f`；2 檔 +2 / −6）|
| 3.6.3 | validate baseline 變化（`0/13/7` → `0/9/5`）|
| 3.6.4 | dist 影響（2 個 GitHub 站文章詳細頁少 1 個 `<h2>`）|
| 3.6.5 | 與 source code 層 legacy fallback 之區分（保守決策保留；屬 Phase 8-h 或更晚）|

### 3.7 Phase 8-g-6 系列：content/templates 對齊落地紀錄

Phase 8-g-6 補完 5 個 markdown post 範本之 deprecated `type` 與 body leading H1 placeholder cleanup。

| 子節 | 範圍 |
|---|---|
| 3.7.1 | 讀取分析（8-g-6-a；無 commit）|
| 3.7.2 | 實作（8-g-6-b；commit `5976162`；5 檔 +5 / −15）|
| 3.7.3 | validate baseline 變化（維持 `0/9/5`）|
| 3.7.4 | dist 影響（templates 不在 build path；不影響 dist）|
| 3.7.5 | 與 source code 層 legacy fallback 之區分（同 §3.6.5；屬 Phase 8-h 或更晚）|

### 3.8 Phase 8-g-7 / 8-g-8 系列：roadmap 同步 + completion report 同步落地紀錄

| 子節 | 範圍 |
|---|---|
| 3.8.1 | Phase 8-g-7（commit `a9db65b`）— `future-roadmap.md` 同步 sample/template landings |
| 3.8.2 | Phase 8-g-8（commit `38a0007`）— `phase-8g-completion-report.md` 同步 sample/template/roadmap landings；§3.6 / §3.7 / §3.8 新增 |
| 3.8.3 | Phase 8-g-9 / 8-g-10（commits `ffa0310` / `be4304f`）— roadmap self-reference 修正（互鏈一致性）|

### 3.9 Phase 8-g-12 系列：`series-title-unresolved` warning + fixture 落地紀錄

Phase 8-g-12 將 `titleTemplate` 之 unresolved placeholders 偵測從 helper-internal traceability 升級為 `validate-content` user-visible warning。分 2 個實作 commit + 2 個讀取分析批次 + 1 個本批 docs sync。

#### 3.9.1 讀取分析（8-g-12-a；無 commit）

對話內讀取分析批次，識別範圍：

- `resolve-series-title.js`（Phase 8-f-4-b 既有 helper）：純函式；返回 `unresolvedPlaceholders` array 含 `{ name, reason }`（`missing-value` / `unsupported-placeholder`）
- `normalize-post-output.js`（Phase 8-f-3-b / 8-f-7-b）：建構 `normalized.series.titleTemplate`；**不執行**placeholder 解析
- `build-promotion.js`（Phase 8-f-6-b）：manifest entry 已含 `seriesResolvedTitle` + `seriesTitleUnresolvedPlaceholders`；無 console.warn 對應
- `blogger-copy-helper.ejs`（Phase 8-f-5-b）：[11] 區塊已顯示 unresolved 提醒（僅作者讀 copy-helper.txt 時可見）
- `validate-content.js`（Phase 8-e-5-b + Phase 8-g-2-d）：既有 7 條 series 結構 warning + 1 條 duplicate；**無**titleTemplate unresolved 規則
- 升級位置評估：選擇 `validate-content.js`（Option A）— 與既有 Phase 8-g-2-d 系列一致；warning-only；ready/published 範圍

#### 3.9.2 規則落地（8-g-12-b；commit `a73c064`）

新增 `series-title-unresolved` warning rule：

| 維度 | 設計 |
|---|---|
| 檔案 | `src/scripts/validate-content.js`（+44 行 / −0）|
| import | 新增 `import { resolveTitleTemplate } from './resolve-series-title.js'`（沿用 Phase 8-f-4-b helper；不修改 helper）|
| severity | `warning`（沿用 series warning-only 保守路線）|
| 觸發範圍 | ready / published（沿用 Phase 8-e-5-b series 規則）|
| 觸發條件 | ① `post.normalized?.series` 存在且為 plain object<br>② `series.titleTemplate` 為非空 string<br>③ `resolveTitleTemplate(...)` 返回 `unresolvedPlaceholders.length > 0` |
| 互斥邊界 | series 非 plain object / series.id invalid / missing → normalize 不建 valid `normalized.series`；本規則前置守門過濾；與 `series-id-not-in-settings` / `series-number-duplicate` 屬獨立面向，可共存 |
| Message 格式 | `series.id="{id}"; titleTemplate has unresolved placeholders: {names} (reasons: {reasons})` |
| 對稱規則 | 與 `fb-md-placeholder-unresolved`（針對 .fb.md body）形成對稱（針對 series.titleTemplate）|
| 不變範圍 | 不修改 `resolve-series-title.js` / `normalize-post-output.js` / `build-promotion.js`；不擴大 source code |

#### 3.9.3 Fixture 配套（8-g-12-c；commit `78d1f30`）

新增 fixture 自證規則：

| 維度 | 設計 |
|---|---|
| 檔案 | `content/validation-fixtures/github/posts/_test-series-title-unresolved.md`（+22 行）|
| status | `ready` |
| series.id | `_test-title-template`（**不入** `content/settings/series.json`；採方案 A 保守決策，沿用 Phase 8-g-2-d-e-c `_test-series-dup-a/b` pattern）|
| series.number | `1` |
| series.titleTemplate | `{post.title} — {post.unknown}`（`{post.title}` 為 supported；`{post.unknown}` 為 unsupported-placeholder）|
| 觸發 warnings | 2 條：`series-id-not-in-settings`（Phase 8-g-2-d-b）+ `series-title-unresolved`（Phase 8-g-12-b）|
| frontmatter 其他欄位 | `contentKind` / `category` / `tags` / `cover` / `description` 完整對齊（避免 noise warning）|

#### 3.9.4 baseline 變化

| 階段 | baseline |
|---|---|
| Phase 8-g-12-b 落地後（HEAD `a73c064`）| `0 error / 9 warning on 5 post(s)`（規則新增；無觸發樣本；不變）|
| Phase 8-g-12-c 落地後（HEAD `78d1f30`）| **`0 error / 11 warning on 6 post(s)`**（+2 warnings / +1 post；fixture 預期觸發；**非 regression**）|

#### 3.9.5 與 helper-internal warning 之區分（per `docs/series-schema.md` §15.4.2 / §15.4.3 / §18.5）

Phase 8-g-12-b 只升級**`titleTemplate` placeholder 解析面向**之 helper-internal warning；其他 3 條結構性 helper-internal warnings（`series-invalid-shape` / `series-id-empty` / `series-id-not-resolved`）**仍未升級**（屬 normalize 內部 traceability；外部偵測由 Phase 8-e-5-b + Phase 8-g-2-d 之既有 8 條 series structure warning 覆蓋）。

build-promotion.js 之 `seriesResolvedTitle` + `seriesTitleUnresolvedPlaceholders` 行為**仍 valid**（不阻擋 build / 不重複觸發 build-time warning）；blogger-copy-helper.ejs [11] 區塊之 unresolved 顯示**仍 valid**；validate 升級與既有 build / copy-helper 行為**獨立**，per `docs/series-schema.md` §18.5 之 Phase 8-g-12-b 補述。

#### 3.9.6 對 source code 層 legacy fallback 之區分（保守決策保留）

Phase 8-g-12 之升級**僅限**`titleTemplate` placeholder 解析；以下 source code 層 legacy 機制**仍存在**（未退場；屬 Phase 8-h 或更晚）：

- **`src/scripts/load-posts.js`**：`contentKind: data.contentKind ?? data.type` fallback 仍存在
- **`src/scripts/validate-content.js`**：`frontmatter-uses-deprecated-type` warning 規則仍存在
- **`src/scripts/parse-markdown.js`**：H1 → H2 自動降級仍存在

per §3.6.5 / §3.7.5 之既有立場；本批不變動上述機制。

---

## §4 deferred 狀態：Phase 8-g-1 fixture / sample end-to-end 驗證

**狀態**：`deferred`（沿用 Phase 8-g-0-b 與 `docs/phase-8g-candidate-analysis.md` §5 之決策；**本批不變動此狀態**；候選 C / sample alignment / template alignment / roadmap sync / titleTemplate-unresolved 升級 / fixture 落地皆**不解封** Phase 8-g-1 deferred）

### 4.1 暫不執行理由（沿用既有決策）

1. ready fixture 會進入正式 `dist/` / `sitemap.xml` / `dist-promotion/` baseline。
2. 若未來不小心部署，`_sample-` 內容可能對外可見。
3. 本系統第一版無 noindex / staging dist 機制可隔離 fixture。
4. 已完成 Phase 8-f / 8-g-2 / 8-g-2-d / 8-g-3 / 8-g-4 / 8-g-5 / 8-g-6 / 8-g-7 / 8-g-8 / 8-g-9 / 8-g-10 / 8-g-11 / 8-g-12 系列；目前不是非做 fixture 不可。
5. fixture end-to-end 驗證有價值，但應獨立排程，不能混在 Phase 8-g 收尾批次。

### 4.2 觸發條件（未滿足）

進入 Phase 8-g-1 前需滿足以下其一：

- 作者人工確認部署流程能隔離 `_sample-` 內容；或
- 在作者正式建立第一篇系列文章之前不執行；或
- 先設計 noindex / staging dist 機制再執行。

### 4.3 建議方案內容（deferred）

完整方案內容（series.json entry / fixture post / `.publish.json` / `promotion.facebook.enabled` / 不搭配 `.fb.md` / 拆 2 commits / 部署把關）詳見 `docs/phase-8g-candidate-analysis.md` §5。**本批不執行**。

### 4.4 與 Phase 8-g-2-d-e-c / 8-g-12-c validation-fixtures 之區分

| 維度 | Phase 8-g-2-d-e-c / 8-g-12-c validation-fixtures | Phase 8-g-1 ready fixture |
|---|---|---|
| 放置位置 | `content/validation-fixtures/` | `content/{site}/posts/` |
| 是否被 `build:*` 掃到 | ❌ 不會 | ✅ 會 |
| 影響 dist baseline | ❌ 不會 | ✅ 會 |
| 部署風險 | ❌ 無 | ✅ 有 |
| 用途 | validate 規則自證 | end-to-end 接入路徑驗證 |
| 本階段執行 | ✅ 已執行 | ❌ 仍 deferred |

兩者**設計上互不影響**；既有 fixture 落地（含 Phase 8-g-12-c `_test-series-title-unresolved`）**不解封** Phase 8-g-1 之 deferred 狀態。

---

## §5 尚未處理候選清單

per `docs/phase-8g-candidate-analysis.md` §6 + `docs/future-roadmap.md` §5（含 Phase 8-g-4 候選 C + Phase 8-g-5/6/7/8 sample/template/roadmap + Phase 8-g-12 titleTemplate-unresolved 落地後之更新）：

### 5.1 candidate（不影響 dist；可優先排程）

候選 C / S/T / F 皆已落地（commits `4730152` / `ddae181` / `eec8ff7` / `44c0e8f` / `5976162` / `a73c064` / `78d1f30`）；§5.2.6（`fb-sidecar-schema.md`）經 Phase 8-g-11 讀取分析後依保守決策維持未補。**本層級當前無待辦項。**

### 5.2 candidate（會影響 dist / settings / reports baseline；需獨立讀取分析批次）

| # | 候選 | 性質 | 影響面 | 備註 |
|---|---|---|---|---|
| 1（剩餘）| series report（`dist-reports/series.txt`）| 報表延伸 | `dist-reports/` | 與 `series-number-duplicate` 配套之報表 |
| 5 | site default hashtags | settings fallback chain | promotion baseline | hashtags fallback chain 上游補強 |
| 6 | 系列首篇 `.fb.md` hashtags fallback | normalize-post-output 改 | promotion baseline | 前篇延續策略 |
| 7 | Blogger tags inheritance | normalize / publish.json | blogger meta baseline | 與 FB hashtags 平行設計（注意格式分離原則，per `docs/fb-sidecar-schema.md` §12.3.1）|

> 「兩篇 sample post H1 + deprecated `type` 對齊」與「`content/templates/*` 對齊」已於 Phase 8-g-5 / 8-g-6 落地（詳見 §3.6 / §3.7）；「titleTemplate unresolved 升級為 user-visible warning」已於 Phase 8-g-12 落地（詳見 §3.9），從本表移除。

### 5.3 not recommended（既有保守決策；如未來改變需另開規格）

| # | 候選 | 性質 | 理由 |
|---|---|---|---|
| 4 | FB `.txt` 顯示 `titleEn` / `seriesResolvedTitle` | customer-facing | FB 字長受限；per Phase 8-f-6-a 既有保守決策 |
| 8 | H1 接 series `titleTemplate` | customer-facing | SEO 風險 / 字長風險；per Phase 8-f-5-c §17.3 既有保守決策 |

### 5.4 deferred

| # | 候選 | 性質 | 觸發條件 |
|---|---|---|---|
| E / 8-g-1 | fixture / sample end-to-end 驗證 | 測試資產 | 詳見 §4 |

### 5.5 future candidate（per `docs/phase-8g-2-d-completion-report.md` §8.4 + Phase 8-g-4-a / 8-g-5-a / 8-g-6-a / 8-g-12-a 讀取分析）

- 升級任一**結構性** series warning 為 error：違反 Phase 8-g-2-d 系列 warning-only 保守路線；不建議
- 跨 status 之 duplicate 檢查（含 drafts）：需擴充 `load-posts.js`；與既有 series 規則範圍分歧
- **`docs/publish-bundle.md` §7.5 / §7.6 / §7.7 過時描述對齊**：屬「規格內容更新」而非 cross-link 補強；Phase 8-g-4-a 讀取分析之 §5.3 N2 排除原則明確標示**不在候選 C scope**；應另開批次（內容對齊應檢視實際 Phase 8-e / 8-f / 8-g 落地，與 §7 既有「Phase 8-a 撰寫時預期計畫」之差異全面對齊）。
- **`docs/fb-sidecar-schema.md` 補連 8-c / 8-e 系列 phase report**：屬 §5.2.6 可選補強；Phase 8-g-4-c / 8-g-11 兩次讀取分析皆依保守決策未執行；未來如有導航需求再評估。
- **source code 層 legacy fallback / warning rule / H1 demotion 退場**（per §3.6.5 / §3.7.5 / §3.9.6）：
  - `src/scripts/load-posts.js` `contentKind ?? data.type` fallback 退場
  - `src/scripts/validate-content.js` `frontmatter-uses-deprecated-type` warning rule 退場
  - `src/scripts/parse-markdown.js` H1 → H2 自動降級退場
  - 屬 Phase 8-h 或更晚；需先確認所有 source（含 sample / template / 既有 posts / 文件範例 / fixtures）已對齊，再評估退場時機

> ~~`titleTemplate unresolved` 升級為 user-visible warning（per `docs/series-schema.md` §15.4.2）~~：✅ 已於 Phase 8-g-12-b 落地（commit `a73c064`）；fixture 配套於 Phase 8-g-12-c（commit `78d1f30`）；詳見 §3.9。

---

## §6 下一步建議拆批順序

### 6.1 低風險優先（不影響 dist；本層級候選已全數落地）

候選 C / S/T / F 皆已落地（commits `4730152` / `ddae181` / `eec8ff7` / `44c0e8f` / `5976162` / `a73c064` / `78d1f30` / 本批 Phase 8-g-12-d）；**本層級當前無待辦項**。下一步建議移至 §6.2 之需要人工決策候選。

### 6.2 建議下一步（先讀取分析批次，不直接實作）

依優先序：

1. **候選 5 / 6 / 7（site default hashtags / 首篇 fallback / Blogger tags inheritance）**：三者皆會動 normalize 或 settings；建議**分別**做讀取分析批次（無 commit），評估 fallback chain 上下游與 promotion / blogger meta baseline 影響後，再決定是否進實作。**不混批**。優先序由作者決定。
2. **series report（`dist-reports/series.txt`）延後**：reports 補強；build pipeline 改動屬中等規模；建議於候選 5 / 6 / 7 之後再評估，由作者排程。
3. **source code 層 legacy fallback 退場**（Phase 8-h 或更晚之候選）：sample / template / fixture / validate rule 來源層已清理；待作者確認所有 source 對齊狀態 + 是否需擴大 退場 scope 後再評估退場時機。屬獨立規格議題；不應混入既有批次。
4. **`docs/publish-bundle.md` §7.5 / §7.6 / §7.7 過時描述對齊**：屬規格內容更新；另開批次評估與實際 Phase 8-e / 8-f / 8-g 落地之全面對齊。

### 6.3 建議暫緩

- **Phase 8-g-1 fixture / sample end-to-end**：deferred 條件仍未滿足（無 noindex / staging dist 機制；作者尚未建立首篇正式系列文章）；**本批不變動此狀態**。
- **候選 4 / 8（customer-facing 系列輸出）**：`not recommended`；per Phase 8-f-5-c §17.3 / 8-f-6-a 既有保守決策；如未來改變需另開規格。

### 6.4 起手批次節奏建議（保留）

per `docs/future-roadmap.md` §5.3：每個候選首批應為**純讀取分析 + docs**，不直接修改 JS / EJS / settings；確認方向後再進入實作批次。本原則 Phase 8-g 全程沿用（含候選 C `8-g-4-a` / sample alignment `8-g-5-a` / template alignment `8-g-6-a` / fb-sidecar `8-g-11` / titleTemplate-unresolved `8-g-12-a` 讀取分析 + 各自實作）；建議下一階段仍維持。

---

## §7 不變項 / 安全邊界

### 7.1 本批（Phase 8-g-12-d）明確未修改之範圍

| 範圍 | 狀態 |
|---|---|
| `src/scripts/*`（含 `validate-content.js` Phase 8-g-12-b 對齊對象）| ❌ 本批未修改（commit `a73c064` 已落地；本批不重觸碰）|
| `src/views/*` / `src/styles/*` / `src/js/*` | ❌ 未修改 |
| `content/blogger/posts/*` / `content/blogger/pages/*` / `content/github/pages/*` | ❌ 未修改 |
| `content/github/posts/*`（Phase 8-g-5 對齊對象）| ❌ 本批未修改（commit `44c0e8f` 已落地；本批不重觸碰）|
| 任何 `.publish.json` / `.fb.md` sidecar | ❌ 未修改 |
| `content/settings/*`（含 `series.json` 維持 `{"series":[]}`）| ❌ 未修改 |
| `content/templates/*`（Phase 8-g-6 對齊對象）| ❌ 本批未修改（commit `5976162` 已落地；本批不重觸碰）|
| `content/validation-fixtures/*`（Phase 8-g-2-d-e-c + Phase 8-g-12-c fixtures）| ❌ 本批未修改（commits `f97cded` / `78d1f30` 已落地；本批不重觸碰）|
| `content/drafts/` / `content/archive/` | ❌ 未修改（皆空目錄）|
| `package.json` / `package-lock.json` | ❌ 未修改（無新增 npm script / 外部相依）|
| 任何 EJS / SCSS | ❌ 未修改 |
| `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | ❌ 未修改（本批未執行 build）|
| `docs/phase-8b-completion-report.md` ~ `docs/phase-8f-completion-report.md`（Phase 8-g-4 系列 cross-link 補強對象）| ❌ 本批未修改（前 commits 已落地；本批不重觸碰）|
| `docs/phase-8g-2-completion-report.md` / `docs/phase-8g-2-d-completion-report.md` | ❌ 未修改（frozen）|
| `docs/phase-8g-candidate-analysis.md` | ❌ 未修改 |
| `docs/publish-bundle.md` / `docs/publish-json-schema.md`（Phase 8-g-4-b §5.1 補強對象；含 §7.5 / §7.6 / §7.7 過時描述）| ❌ 本批未修改 |
| `docs/fb-sidecar-schema.md`（§5.2.6 候選；Phase 8-g-4-c / 8-g-11 依保守決策未補；本批維持）| ❌ 本批未修改 |
| `docs/migration-from-frontmatter.md` / `docs/promotion-export.md` | ❌ 未修改 |

### 7.2 本批明確未引入之機制

- ❌ 新 fixture（未動 `content/validation-fixtures/`；Phase 8-g-12-c 已於 `78d1f30` 落地）
- ❌ 新 validate 規則（未動 `src/scripts/validate-content.js`；Phase 8-g-12-b 已於 `a73c064` 落地）
- ❌ baseline 變動（validate / build / dist baseline 皆不變；validate 仍為 `0 error / 11 warning on 6 post(s)`；dist 主軸 byte-identical）
- ❌ 新 npm script 或外部相依
- ❌ Phase 8-g-1 fixture deferred 解封（仍 `deferred`；既有落地不解封）
- ❌ 新增 cross-link 至 `fb-sidecar-schema.md` §5.2.6（per Phase 8-g-4-c / 8-g-11 兩次保守決策）
- ❌ 修正 `publish-bundle.md` §7.5 / §7.6 / §7.7 過時描述（保留為 §5.5 future candidate）
- ❌ 啟動 source code 層 legacy fallback 退場（仍屬 Phase 8-h 或更晚；per §3.6.5 / §3.7.5 / §3.9.6 / §5.5）
- ❌ 將 Phase 8-g overall 狀態標成「完全完成」（仍有 8-g-1 deferred / candidate 5 / 6 / 7 / series report / source code fallback 退場 / publish-bundle 過時描述 / fb-sidecar §5.2.6 等 future candidates；overall 狀態仍為 🔄 進行中，per `docs/future-roadmap.md` §2）

### 7.3 git 操作確認（本批落地後預期狀態）

| 項目 | 狀態 |
|---|---|
| `git status` | 本批 commit 後 working tree 將回到 clean（`.gitignore` 包含之 `dist*` / `node_modules` / `.cache` 屬產物，不算 working tree 變動）|
| `git remote` | **未設定**（本批未設 remote）|
| `git push` | **未執行** |
| `git commit --amend` / `git rebase` | **未執行**（本批不 amend / rebase 既有 commit；新增 commit 待作者批准後另行建立；`c3b6c63` / `4730152` / `ddae181` / `eec8ff7` / `5d38d46` / `44c0e8f` / `5976162` / `a9db65b` / `38a0007` / `ffa0310` / `be4304f` / `a73c064` / `78d1f30` 已落地 commits 皆未被 amend / rebase）|
| 本批 commit | **未 commit**（待作者批准）|

---

## §8 Cross-links

### 8.1 Phase 8-g 內部紀錄

- `docs/phase-8g-candidate-analysis.md`（Phase 8-g-0-b 候選分析；§6 候選清單 / §10 Phase 8-g-2 落地紀錄 / §11 Phase 8-g-2-d 落地紀錄）
- `docs/phase-8g-2-completion-report.md`（Phase 8-g-2 new-post.js prompt 系列收尾報告）
- `docs/phase-8g-2-d-completion-report.md`（Phase 8-g-2-d validate-content series warning 規則收尾報告）

### 8.2 既有 Phase 收尾紀錄（背景）

- `docs/phase-8b-completion-report.md`（含 Phase 8-g-4-c 新增之後向 link 到 8-c）
- `docs/phase-8c-completion-report.md`（含 Phase 8-g-4-c 新增之後向 link 到 8-d）
- `docs/phase-8d-completion-report.md`（含 Phase 8-g-4-b 新增之前向 link 到 8-c + Phase 8-g-4-c 新增之後向 link 到 8-e）
- `docs/phase-8e-completion-report.md`（含 Phase 8-g-4-c 新增之後向 link 到 8-f）
- `docs/phase-8f-completion-report.md`（含 Phase 8-g-4-c 新增之後向 link 到 8-g）

### 8.3 規格與設計文件

- `docs/series-schema.md`（series metadata schema；§5 auto-suggest / §15.4.2 / §15.4.3（含 Phase 8-g-12-b 補述）/ §18.5（含 Phase 8-g-12-b 補述）/ §20 Phase 8-g-2 落地 / §21 Phase 8-g-2-d 落地）
- `docs/promotion-export.md`（promotion manifest §10 4 個 additive 欄位）
- `docs/fb-sidecar-schema.md`（§12.3.1 Blogger tags / FB hashtags 格式分離原則；Phase 8-g-4-c / 8-g-11 §5.2.6 依保守決策未補連 8-c / 8-e）
- `docs/publish-bundle.md`（sidecar bundle schema；§8.1 含 Phase 8-g-4-b 新增之 Phase 8 系列完成報告清單）
- `docs/publish-json-schema.md`（publish.json schema；§12 含 Phase 8-g-4-b 新增之相關文件節）
- `docs/migration-from-frontmatter.md`（既有 frontmatter 遷移指南）

### 8.4 Roadmap

- `docs/future-roadmap.md`（已於 Phase 8-g-7 `a9db65b` 同步 sample/template landings；於 Phase 8-g-9 `ffa0310` / 8-g-10 `be4304f` 修正自我參照；本批 Phase 8-g-12-d 同步 8-g-11 / 8-g-12 landings；§2（Phase 8 系列進度；8-g 仍 🔄 進行中）/ §3（Phase 8-g 子批次進度；含 §3.4 / §3.5 落地摘要）/ §5（下一步候選；候選 C + ~~E~~ S/T + ~~F~~ titleTemplate 皆標 landed））

---

（本文件結束）
