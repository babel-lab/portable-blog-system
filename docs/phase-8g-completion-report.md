# Phase 8-g Completion Report — overall

> 批次系列：Phase 8-g-0 系列（候選分析 / roadmap）+ Phase 8-g-2 系列（new-post.js series prompt + stderr suggestion）+ Phase 8-g-2-d 系列（validate-content series warning 規則）+ Phase 8-g-3（overall completion report 初版）+ Phase 8-g-4 系列（候選 C cross-link 補強）+ Phase 8-g-5（sample post 對齊）+ Phase 8-g-6（content/templates 對齊）+ Phase 8-g-7 / 8-g-8 / 8-g-9 / 8-g-10（sample/template/roadmap landings sync 與自我參照修正）+ Phase 8-g-11（fb-sidecar §5.2.6 讀取分析；維持保守）+ Phase 8-g-12 系列（`series-title-unresolved` warning + fixture + docs sync）+ Phase 8-g-13 / 8-g-14（publish-bundle §7 過時描述對齊讀取分析與實作）+ 本批（Phase 8-g-15 docs sync）
> 範圍：Phase 8-g 整體統整收尾報告；含 Phase 8-g-13 / 8-g-14 之 publish-bundle §7.4-§7.7 對齊實際 Phase 8-d/e/f/g landings 之 docs sync；本批僅修改 `docs/future-roadmap.md` / `docs/phase-8g-completion-report.md`
> 起點 HEAD：`b1679d1`（Phase 8-f-8-b completion report）
> 終點 HEAD：`108de25`（Phase 8-g-14 publish-bundle §7 對齊；本批前 HEAD）
> Phase 8-g 已落地 commits：**30**（不含本批；含 Phase 8-g-3 `c3b6c63` + Phase 8-g-4 系列 4 commits（`4730152` / `ddae181` / `eec8ff7` / `5d38d46`）+ Phase 8-g-5 `44c0e8f` + Phase 8-g-6 `5976162` + Phase 8-g-7 `a9db65b` + Phase 8-g-8 `38a0007` + Phase 8-g-9 `ffa0310` + Phase 8-g-10 `be4304f` + Phase 8-g-12 系列 3 commits（`a73c064` / `78d1f30` / `662bcdf`）+ Phase 8-g-14 `108de25` + Phase 8-g-0 系列 2 commits + Phase 8-g-2 系列 6 commits + Phase 8-g-2-d 系列 7 commits）
> `dist` / `dist-blogger` / `dist-promotion` baseline：**主軸 byte-identical**；Phase 8-g-5 sample posts 對齊**間接**影響 2 個 `dist/posts/{slug}/index.html`（各少 1 個由 H1 → H2 自動降級產生之 `<h2>`；詳見 §3.4 / §3.6.4）；Phase 8-g-12 純 validate 規則 + fixture；Phase 8-g-13 / 8-g-14 純 docs；皆**不影響 dist baseline**
> `npm run validate:content` baseline：**`0 error / 11 warning on 6 post(s)`**（Phase 8-g-12-c fixture 落地後之預期變動：`0/9/5` → `0/11/6`；+2 warnings / +1 post 屬 fixture 預期觸發，**非 regression**；詳見 §3.2 / §3.3）；Phase 8-g-13 / 8-g-14 / 8-g-15 docs-only，**baseline 不變**
> git status：clean（working tree 無 modified / untracked / deleted；本批 commit 後仍 clean）
> 未 push、未設 remote、未 amend（per Phase 8-g 起手批次規範；`c3b6c63` / `4730152` / `ddae181` / `eec8ff7` / `5d38d46` / `44c0e8f` / `5976162` / `a9db65b` / `38a0007` / `ffa0310` / `be4304f` / `a73c064` / `78d1f30` / `662bcdf` / `108de25` 皆為新建 commit，未 amend / rebase 任何既有 commit）

---

## §1 本階段目的

Phase 8-g 之核心目的：

1. **候選排程**：在 Phase 8-f 完成後，對「驗證 / 工具 / 報表 / docs」層之候選做風險分析與狀態排程（9 項數字候選 + 候選 C + sample/template alignment + titleTemplate-unresolved 升級 + publish-bundle §7 對齊；含 `candidate` / `landed` / `partially landed` / `deferred` / `not recommended` 五種狀態；詳見 `docs/phase-8g-candidate-analysis.md` §6 + 本文件 §3.1）。
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
   - **docs sync（Phase 8-g-12-d；commit `662bcdf`）** 將上述升級反映於 `docs/series-schema.md` §15.4.2 / §15.4.3 / §18.5 + 本文件 + `docs/future-roadmap.md`
9. **`publish-bundle.md` §7 過時描述對齊（Phase 8-g-13 / 8-g-14）**：
   - **過時描述識別（Phase 8-g-13 讀取分析；無 commit）**：`docs/publish-bundle.md` §7.5（Phase 8-e）/ §7.6（Phase 8-f）/ §7.7（Phase 8-g）為 Phase 8-a 撰寫時之預期計畫，與實際 Phase 8-e / 8-f / 8-g landings **嚴重不符**（§7.5 預期 AdSense templates + placements；實際 series metadata schema；§7.6 預期書評模組擴充；實際 series build pipeline；§7.7 預期相容層退場；實際候選分析與排程，仍 🔄）；§7.4（Phase 8-d）描述偏窄（僅提 Blogger permalink；實際主軸為 normalized post output helper）
   - **對齊策略**：採「保留歷史脈絡 + 補述實際落地」pattern（per Phase 8-g-12-b §15.4.3 之既有 pattern）；**不刪除原 prose**
   - **實作（Phase 8-g-14；commit `108de25`）**：`docs/publish-bundle.md` §7.4 ~ §7.7 共 4 節，標題加「（Phase 8-a 撰寫時之預期計畫）」後綴 + 末段補入「**Phase 8-X 實際落地更新**」段落（粗體 + bullet 列實際落地內容 + cross-link 至對應 phase report）；§7.1 ~ §7.3 / §8 / §9 **完全未動**；+57 / −4 行
   - **§7.7 明示**：Phase 8-g overall **仍 🔄 進行中**；相容層退場**未啟動**（屬 Phase 8-h 或更晚）；列出 source code 三項機制；明示「**不應誤標 Phase 8-g 為已全部完成**」
   - **本批 Phase 8-g-15 docs sync** 將上述對齊反映於 `docs/future-roadmap.md` §3 / §5.1（新增 ~~G~~ row 標 landed）+ 本文件（Header / §1 / §2 / §3 / §5.5 / §7 同步）

Phase 8-g 與既有 Phase 8-f 之分工：

- **Phase 8-f**：series metadata 之 build pipeline 接入（`normalized.series` / `resolve-series-title.js` / `series.hashtags` inheritance backfill / Blogger copy-helper `[11]` / promotion manifest 4 個 additive 欄位）— 屬「資料層 + 既有 customer-facing surface」。
- **Phase 8-g**：基於 Phase 8-f 既有資料層之「工具 / 驗證 / 報表 / docs cross-link / sample-template cleanup / titleTemplate validate 升級 / schema 規格 prose 對齊」延伸 + 候選排程 — 屬「不擴大 customer-facing surface」之保守延伸。

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
| 8-g-3 | `c3b6c63` | docs | add phase 8-g overall completion report |

### 2.5 Phase 8-g-4 系列（候選 C cross-link 補強）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-4-a | （無 commit）| 對話內 | 候選 C docs cross-link 讀取分析 |
| 8-g-4-b | `4730152` | docs | cross-link schema docs to phase reports |
| 8-g-4-c | `ddae181` | docs | add backward links between phase reports |
| 8-g-4-d | `eec8ff7` | docs | update phase 8-g overall completion report with candidate C landings |
| 8-g-4-e | `5d38d46` | docs | sync future-roadmap with candidate C landings |

### 2.6 Phase 8-g-5 / 8-g-6 / 8-g-7 / 8-g-8 系列（sample / template / roadmap / completion report 同步）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-5-a | （無 commit）| 對話內 | sample post 對齊讀取分析 |
| 8-g-5-b | `44c0e8f` | fix | align legacy type and body H1 in github sample posts |
| 8-g-6-a | （無 commit）| 對話內 | content/templates 對齊讀取分析 |
| 8-g-6-b | `5976162` | fix | align legacy type and body H1 in post templates |
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

### 2.9 Phase 8-g-12 系列（`series-title-unresolved` warning + fixture + docs sync）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-12-a | （無 commit）| 對話內 | `titleTemplate unresolved` 升級為 user-visible warning 讀取分析 |
| 8-g-12-b | `a73c064` | feat | add series-title-unresolved warning to validate-content |
| 8-g-12-c | `78d1f30` | test | add series-title-unresolved validation fixture |
| 8-g-12-d | `662bcdf` | docs | sync docs with series-title-unresolved landing |

### 2.10 Phase 8-g-13 / 8-g-14 系列（publish-bundle §7 過時描述對齊）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-13 | （無 commit）| 對話內 | publish-bundle §7.5-§7.7 過時描述對齊讀取分析；推薦選項 B（保留歷史脈絡 + 補述實際落地）|
| 8-g-14 | `108de25` | docs | sync §7.4-§7.7 with actual Phase 8-d/e/f/g landings（`docs/publish-bundle.md` +57 / −4；4 節補述；§7.1-§7.3 / §8 / §9 未動）|

### 2.11 本批（Phase 8-g-15 docs sync）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-15 | （未 commit；待批准）| docs | sync future-roadmap and overall report with publish-bundle §7 alignment |

### 2.12 合計

- **Phase 8-g 已落地 commits：30**（不含本批）
  - Phase 8-g-0 系列：2（`77fb764` / `a37d92e`）
  - Phase 8-g-2 系列：6
  - Phase 8-g-2-d 系列：7
  - Phase 8-g-3：1（`c3b6c63`）
  - Phase 8-g-4 系列：4（`4730152` / `ddae181` / `eec8ff7` / `5d38d46`）
  - Phase 8-g-5：1（`44c0e8f`）
  - Phase 8-g-6：1（`5976162`）
  - Phase 8-g-7：1（`a9db65b`）
  - Phase 8-g-8：1（`38a0007`）
  - Phase 8-g-9：1（`ffa0310`）
  - Phase 8-g-10：1（`be4304f`）
  - Phase 8-g-12 系列：3（`a73c064` / `78d1f30` / `662bcdf`）
  - Phase 8-g-14：1（`108de25`）
- 對話內讀取分析批次（無 commit）：**9**（8-g-0-a / 8-g-0-d / 8-g-2-c-a / 8-g-2-d-a / 8-g-2-d-e-a / 8-g-4-a / 8-g-5-a / 8-g-6-a / 8-g-11 / 8-g-12-a / 8-g-13）
- 本批新增 commit：**1**（待作者批准）

---

## §3 功能完成摘要

### 3.1 候選清單最終狀態

per `docs/phase-8g-candidate-analysis.md` §6 + 候選 C 落地（Phase 8-g-4 系列）+ sample/template alignment 落地（Phase 8-g-5 / 8-g-6）+ titleTemplate-unresolved 升級（Phase 8-g-12）+ publish-bundle §7 對齊（Phase 8-g-13 / 8-g-14）：

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
| C | docs cross-link 補強 | ✅ `landed` | Phase 8-g-4-b / 4-c 落地（commits `4730152` + `ddae181`）；§5.2.6 `fb-sidecar-schema.md` 經 Phase 8-g-11 維持保守 |
| S/T | sample / template alignment | ✅ `landed` | Phase 8-g-5 / 8-g-6 落地（commits `44c0e8f` + `5976162`）|
| F | `titleTemplate unresolved` 升級為 validate-content user-visible warning | ✅ `landed` | Phase 8-g-12-b（commit `a73c064`）+ Phase 8-g-12-c fixture（commit `78d1f30`）|
| G | `publish-bundle.md` §7.4-§7.7 過時描述對齊（Phase 8-a 撰寫時預期計畫 vs 實際 Phase 8-d/e/f/g landings）| ✅ `landed` | Phase 8-g-14（commit `108de25`）落地；採「保留歷史脈絡 + 補述實際落地」pattern；詳見 §3.10 |
| E | fixture / sample end-to-end 驗證 | `deferred` | 屬 Phase 8-g-1；詳見 §4 |

### 3.2 validate baseline 現況

`npm run validate:content` baseline：**`0 error / 11 warning on 6 post(s)`**

11 warnings 分布（依來源檔分類；**全為 validation fixtures 自證資產**）：

| # | 來源檔 | 觸發 warning |
|---|---|---|
| 1 | `_test-fb-titleEn.md` | `fb-md-titleEn-invalid-type` |
| 2 | `_test-series-not-object.md` | `series-not-object` |
| 3 | `_test-series-validation.md` | `series-id-invalid`, `series-number-invalid`, `series-subtitle-invalid-type` |
| 4 | `_test-series-dup-a.md` | `series-id-not-in-settings`, `series-number-duplicate` |
| 5 | `_test-series-dup-b.md` | `series-id-not-in-settings`, `series-number-duplicate` |
| 6 | `_test-series-title-unresolved.md` | `series-id-not-in-settings`, `series-title-unresolved` |

合計：**11 warnings / 6 posts**。

**重要**：11 warnings **全部為 validation fixtures 之自證資產**；**無正式 sample post 之 noise warnings**（per Phase 8-g-5 `44c0e8f` 清除）。

### 3.3 baseline 變化軌跡

| 階段 | baseline |
|---|---|
| Phase 8-g-2-d-e-c 前 | `0 error / 9 warning on 5 post(s)` |
| Phase 8-g-2-d-e-c 後 | **`0 error / 13 warning on 7 post(s)`**（+4 / +2；fixture 預期）|
| Phase 8-g-5（`44c0e8f`）後 | **`0 error / 9 warning on 5 post(s)`**（−4 / −2；sample noise 清除）|
| Phase 8-g-12-b（`a73c064`）後 | `0 error / 9 warning on 5 post(s)`（不變；規則無觸發樣本）|
| Phase 8-g-12-c（`78d1f30`）後 | **`0 error / 11 warning on 6 post(s)`**（+2 / +1；fixture 預期）|
| Phase 8-g-12-d / 13 / 14 / 15 | `0 error / 11 warning on 6 post(s)`（不變；皆為 docs-only）|

### 3.4 build / dist baseline

| 工具 | baseline |
| --- | --- |
| `npm run build:github` 輸出 | **主軸不變**；2 個 GitHub post detail 變動（Phase 8-g-5 sample alignment 間接影響）|
| `npm run build:blogger` 輸出 | **主軸 byte-identical** |
| `npm run build:promotion` 輸出 | byte-identical |
| `npm run build:sitemap` 輸出 | byte-identical |
| `dist-reports/*` | byte-identical |
| `package.json` | byte-identical |

Phase 8-g 之所有實作均**未直接接 build pipeline**（new-post.js / validate-content.js / validation-fixtures / docs cross-link / sample-template alignment / roadmap sync / completion report sync / series-title-unresolved rule + fixture / **publish-bundle §7 對齊 docs**）；除 Phase 8-g-5 之 2 dist 檔間接變動外，全部 byte-identical。

### 3.5 Phase 8-g-4 系列：候選 C cross-link 補強落地紀錄

候選 C 之 docs cross-link 補強分 3 個 commit 落地（`4730152` / `ddae181` / `eec8ff7`）+ 1 個 roadmap sync（`5d38d46`）+ 讀取分析（`8-g-4-a`）。詳見既有結構（§5.1 必要補強 / §5.2 可選後向 link / §5.2.6 保守決策）。

### 3.6 Phase 8-g-5 系列：sample post 對齊落地紀錄

Phase 8-g-5 補完 2 篇正式 sample post（`44c0e8f`）；baseline `0/13/7` → `0/9/5`；dist 影響：2 個 GitHub 站文章詳細頁 body 各少 1 個 `<h2>`。**僅清理 sample 來源層；source code 層 legacy fallback（load-posts / validate-content / parse-markdown）仍存在，屬 Phase 8-h 或更晚**。

### 3.7 Phase 8-g-6 系列：content/templates 對齊落地紀錄

Phase 8-g-6 補完 5 個 markdown post 範本（`5976162`）；baseline 維持 `0/9/5`（templates 不在 validate scan path）；dist **完全不變**。同 §3.6.5 之 source code 層保留立場。

### 3.8 Phase 8-g-7 / 8-g-8 / 8-g-9 / 8-g-10 系列：sync 與自我參照修正落地紀錄

- Phase 8-g-7（`a9db65b`）：future-roadmap sync sample/template landings
- Phase 8-g-8（`38a0007`）：completion report sync sample/template landings
- Phase 8-g-9（`ffa0310`）：future-roadmap sync 8-g-7 / 8-g-8 landings
- Phase 8-g-10（`be4304f`）：修正 8-g-9 self-reference（接受 8-g-10 / 8-g-12-d / 8-g-15 自我參照尾，不開無限 loop）

### 3.9 Phase 8-g-12 系列：`series-title-unresolved` warning + fixture + docs sync 落地紀錄

Phase 8-g-12 將 `titleTemplate` 之 unresolved placeholders 偵測從 helper-internal traceability 升級為 `validate-content` user-visible warning。4 個 sub-batches：

| 子批次 | Commit | 摘要 |
|---|---|---|
| 8-g-12-a | （無 commit）| 讀取分析；識別升級位置（validate-content.js）+ 觸發條件 |
| 8-g-12-b | `a73c064` | 新增 `series-title-unresolved` warning rule（+44 / −0；warning-only；ready/published 範圍）|
| 8-g-12-c | `78d1f30` | 新增 fixture `_test-series-title-unresolved.md`（+22；baseline `0/9/5` → `0/11/6`；採 unsupported-placeholder `{post.unknown}`）|
| 8-g-12-d | `662bcdf` | docs sync：`docs/series-schema.md` §15.4.2 / §15.4.3 / §18.5 + 本文件 + roadmap |

**僅升級 titleTemplate placeholder 解析面向**；§15.4.2 之 3 條結構性 helper-internal warnings **仍未升級**（屬 normalize 內部 traceability；外部偵測由既有 8 條 series structure warning 覆蓋）。**source code 層 legacy fallback 退場**（per §3.6.5 / §3.7.5）**未啟動**；屬 Phase 8-h 或更晚。

### 3.10 Phase 8-g-13 / 8-g-14 系列：publish-bundle §7 過時描述對齊落地紀錄

Phase 8-g-13 / 8-g-14 將 `docs/publish-bundle.md` §7.4 ~ §7.7 從 Phase 8-a 撰寫時之預期計畫對齊至實際 Phase 8-d / 8-e / 8-f / 8-g landings。3 個 sub-batches（含本批 docs sync）：

| 子批次 | Commit | 摘要 |
|---|---|---|
| 8-g-13 | （無 commit）| 讀取分析；確認 §7.5 / §7.6 / §7.7 與實際落地嚴重不符；§7.4 描述偏窄；推薦選項 B（保留歷史脈絡 + 補述實際落地）|
| 8-g-14 | `108de25` | 落地：`docs/publish-bundle.md` §7.4 ~ §7.7 共 4 節，標題加「（Phase 8-a 撰寫時之預期計畫）」後綴 + 末段補入「**Phase 8-X 實際落地更新**」段落；+57 / −4 |
| 8-g-15 | （本批；未 commit）| docs sync：本文件 + roadmap 同步 |

**對齊內容摘要（§7.4-§7.7 補述要點）**：

- **§7.4（Phase 8-d）**：原為「Blogger permalink / publishedUrl 規則重整」；補述實際主軸為 **normalized post output helper**（GitHub / Blogger / promotion 漸進採用 normalized 優先 + legacy fallback）；Blogger permalink 屬 sub-scope
- **§7.5（Phase 8-e）**：原為「AdSense templates + placements 重構」；補述實際為 **series metadata schema 規格化** + `.fb.md` titleEn + sample/template/validation-fixtures + 4 條 warning-only 規則；AdSense 重構**未執行**
- **§7.6（Phase 8-f）**：原為「書評文章模組擴充」；補述實際為 **series metadata 接入 build pipeline**（settings / loader / `normalized.series` / resolve-series-title helper / Blogger copy-helper [11] / promotion manifest 4 個 additive 欄位 / series.hashtags inheritance）；書評文章模組（comicGallery / Book JSON-LD / FAQ JSON-LD / CTA partial）**未執行**
- **§7.7（Phase 8-g）**：原為「相容層退場（可選）」；補述實際擴充為「Phase 8-f 後之候選分析與排程」（仍 🔄 進行中）；列 Phase 8-g-0 / 2 / 2-d / 4 / 5-6 / 12 系列重點；明示**相容層退場未啟動**（Phase 8-h 候選）；明示 **Phase 8-g overall 仍 🔄 進行中**，「**不應誤標 Phase 8-g 為已全部完成**」

**對齊策略**：採「保留歷史脈絡 + 補述實際落地」pattern（per Phase 8-g-12-b §15.4.3 之既有 pattern）；既有 prose **完全保留未刪除**；只在標題加後綴 + 末段補述。

**對 dist / build / validate 之影響**：純 docs；不接 build pipeline；不在 validate-content scan path；baseline 維持 `0 error / 11 warning on 6 post(s)`。

**範圍邊界**：§7.1（Phase 8-a 文件先行）/ §7.2（Phase 8-b sidecar 讀取）/ §7.3（Phase 8-c FB 必備 + placeholder）/ §8（與既有 docs cross-link；含 §8.1 之 Phase 8 系列完成報告清單）/ §9（對 Phase 1-7 之承諾）皆**未動**。

---

## §4 deferred 狀態：Phase 8-g-1 fixture / sample end-to-end 驗證

**狀態**：`deferred`（沿用既有決策；**本批不變動**；既有所有落地皆**不解封** Phase 8-g-1 deferred）

per `docs/phase-8g-candidate-analysis.md` §5：觸發條件未滿足（部署隔離 / 作者首篇正式系列文章前 / staging dist 機制）。

### 4.1 暫不執行理由

1. ready fixture 會進入正式 `dist/` / `sitemap.xml` / `dist-promotion/` baseline。
2. 若未來不小心部署，`_sample-` 內容可能對外可見。
3. 本系統第一版無 noindex / staging dist 機制可隔離 fixture。
4. 已完成 Phase 8-f / 8-g-2 / 8-g-2-d / 8-g-3 ~ 8-g-15 系列；目前不是非做 fixture 不可。

### 4.2 觸發條件（未滿足）

per 既有決策；本批不變動。

### 4.3 與 validation-fixtures 之區分

`content/validation-fixtures/` 之 fixture（Phase 8-g-2-d-e-c / Phase 8-g-12-c 含 3 篇）**不被 build:* 掃到**；**不影響 dist baseline**；**不解封** 8-g-1。

---

## §5 尚未處理候選清單

per `docs/phase-8g-candidate-analysis.md` §6 + `docs/future-roadmap.md` §5：

### 5.1 candidate（不影響 dist；可優先排程）

候選 C / S/T / F / G 皆已落地（commits `4730152` / `ddae181` / `eec8ff7` / `44c0e8f` / `5976162` / `a73c064` / `78d1f30` / `108de25`）。**本層級當前無待辦項**。

### 5.2 candidate（會影響 dist / settings / reports baseline；需獨立讀取分析批次）

| # | 候選 | 性質 | 影響面 |
|---|---|---|---|
| 1（剩餘）| series report（`dist-reports/series.txt`）| 報表延伸 | `dist-reports/` |
| 5 | site default hashtags | settings fallback chain | promotion baseline |
| 6 | 系列首篇 `.fb.md` hashtags fallback | normalize-post-output 改 | promotion baseline |
| 7 | Blogger tags inheritance | normalize / publish.json | blogger meta baseline |

### 5.3 not recommended

| # | 候選 | 理由 |
|---|---|---|
| 4 | FB `.txt` 顯示 titleEn / seriesResolvedTitle | FB 字長受限 |
| 8 | H1 接 series titleTemplate | SEO / 字長風險 |

### 5.4 deferred

| # | 候選 | 觸發條件 |
|---|---|---|
| E / 8-g-1 | fixture / sample end-to-end 驗證 | 詳見 §4 |

### 5.5 future candidate

- 升級任一**結構性** series warning 為 error：違反 warning-only 路線；不建議
- 跨 status 之 duplicate 檢查（含 drafts）：需擴 `load-posts.js`
- ~~`docs/publish-bundle.md` §7.5 / §7.6 / §7.7 過時描述對齊~~：✅ **已於 Phase 8-g-13 / 8-g-14 落地**（commit `108de25`；§7.4 一併補強；採「保留歷史脈絡 + 補述實際落地」模式；4 節皆 cross-link 至對應 phase report；§7.1-§7.3 / §8 / §9 未動）；**本項已從 future candidate 移除**。
- **`docs/fb-sidecar-schema.md` 補連 8-c / 8-e 系列 phase report**：屬 §5.2.6 可選補強；Phase 8-g-4-c / 8-g-11 兩次讀取分析皆依保守決策未執行
- **source code 層 legacy fallback / warning rule / H1 demotion 退場**（per §3.6.5 / §3.7.5 / §3.9）：
  - `load-posts.js` `contentKind ?? type` fallback
  - `validate-content.js` `frontmatter-uses-deprecated-type` warning rule
  - `parse-markdown.js` H1 → H2 自動降級
  - 屬 Phase 8-h 或更晚

> ~~`titleTemplate unresolved` 升級為 user-visible warning~~：✅ 已於 Phase 8-g-12 落地。

---

## §6 下一步建議拆批順序

### 6.1 低風險優先（不影響 dist；本層級候選已全數落地）

候選 C / S/T / F / G 皆已落地；**本層級當前無待辦項**。

### 6.2 建議下一步（先讀取分析批次，不直接實作）

依優先序：

1. **candidate 5 / 6 / 7（site default hashtags / 首篇 fallback / Blogger tags inheritance）**：建議**分別**做讀取分析批次（無 commit）；**不混批**。優先序由作者決定（候選 7 Blogger tags 有明確規範依據 per `docs/fb-sidecar-schema.md` §12.3.1）
2. **series report（`dist-reports/series.txt`）延後**：reports 補強；build pipeline 改動屬中等規模
3. **source code 層 legacy fallback 退場**（Phase 8-h 或更晚）

### 6.3 建議暫緩

- **Phase 8-g-1 fixture / sample end-to-end**：deferred 條件仍未滿足
- **候選 4 / 8（customer-facing 系列輸出）**：`not recommended`

### 6.4 起手批次節奏建議（保留）

per `docs/future-roadmap.md` §5.3：每個候選首批應為**純讀取分析 + docs**。

---

## §7 不變項 / 安全邊界

### 7.1 本批（Phase 8-g-15）明確未修改之範圍

| 範圍 | 狀態 |
|---|---|
| `src/scripts/*`（含 `validate-content.js` Phase 8-g-12-b 對齊對象）| ❌ 本批未修改 |
| `src/views/*` / `src/styles/*` / `src/js/*` | ❌ 未修改 |
| `content/blogger/posts/*` / `content/blogger/pages/*` / `content/github/pages/*` | ❌ 未修改 |
| `content/github/posts/*`（Phase 8-g-5 對齊對象）| ❌ 本批未修改 |
| 任何 `.publish.json` / `.fb.md` sidecar | ❌ 未修改 |
| `content/settings/*` | ❌ 未修改 |
| `content/templates/*`（Phase 8-g-6 對齊對象）| ❌ 本批未修改 |
| `content/validation-fixtures/*` | ❌ 本批未修改 |
| `content/drafts/` / `content/archive/` | ❌ 未修改 |
| `package.json` / `package-lock.json` | ❌ 未修改 |
| 任何 EJS / SCSS | ❌ 未修改 |
| `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | ❌ 未修改 |
| `docs/publish-bundle.md`（Phase 8-g-14 對齊對象）| ❌ 本批未修改（commit `108de25` 已落地；本批不重觸碰）|
| `docs/series-schema.md`（Phase 8-g-12-d 對齊對象）| ❌ 本批未修改 |
| `docs/phase-8b-completion-report.md` ~ `docs/phase-8f-completion-report.md` | ❌ 本批未修改 |
| `docs/phase-8g-2-completion-report.md` / `docs/phase-8g-2-d-completion-report.md` | ❌ 未修改（frozen）|
| `docs/phase-8g-candidate-analysis.md` | ❌ 未修改 |
| `docs/publish-json-schema.md` / `docs/fb-sidecar-schema.md` | ❌ 本批未修改 |
| `docs/migration-from-frontmatter.md` / `docs/promotion-export.md` | ❌ 未修改 |

### 7.2 本批明確未引入之機制

- ❌ 新 fixture
- ❌ 新 validate 規則
- ❌ baseline 變動（仍為 `0 error / 11 warning on 6 post(s)`；docs-only）
- ❌ 新 npm script 或外部相依
- ❌ Phase 8-g-1 fixture deferred 解封（仍 `deferred`）
- ❌ 啟動 source code 層 legacy fallback 退場（屬 Phase 8-h 或更晚）
- ❌ 將 Phase 8-g overall 狀態標成「完全完成」（仍有 candidate 5/6/7 / series report / Phase 8-g-1 fixture deferred / fb-sidecar §5.2.6 保守決策保留等 future candidates；overall 狀態仍為 🔄 進行中）

### 7.3 git 操作確認

| 項目 | 狀態 |
|---|---|
| `git status` | 本批 commit 後 working tree 將回到 clean |
| `git remote` | **未設定** |
| `git push` | **未執行** |
| `git commit --amend` / `git rebase` | **未執行**（`c3b6c63` / `4730152` / `ddae181` / `eec8ff7` / `5d38d46` / `44c0e8f` / `5976162` / `a9db65b` / `38a0007` / `ffa0310` / `be4304f` / `a73c064` / `78d1f30` / `662bcdf` / `108de25` 皆未被 amend / rebase）|
| 本批 commit | **未 commit**（待作者批准）|

---

## §8 Cross-links

### 8.1 Phase 8-g 內部紀錄

- `docs/phase-8g-candidate-analysis.md`
- `docs/phase-8g-2-completion-report.md`
- `docs/phase-8g-2-d-completion-report.md`

### 8.2 既有 Phase 收尾紀錄（背景）

- `docs/phase-8b-completion-report.md` ~ `docs/phase-8f-completion-report.md`（皆含 Phase 8-g-4 系列之 cross-link 增補）

### 8.3 規格與設計文件

- `docs/series-schema.md`（§15.4.2 / §15.4.3 / §18.5 含 Phase 8-g-12-b 補述）
- `docs/promotion-export.md`
- `docs/fb-sidecar-schema.md`（§12.3.1；Phase 8-g-4-c / 8-g-11 §5.2.6 維持保守）
- `docs/publish-bundle.md`（§8.1 含 Phase 8-g-4-b 新增之 phase report 清單；**§7.4-§7.7 含 Phase 8-g-14 新增之「Phase 8-X 實際落地更新」補述**）
- `docs/publish-json-schema.md`（§12 含 Phase 8-g-4-b 新增之相關文件節）
- `docs/migration-from-frontmatter.md`

### 8.4 Roadmap

- `docs/future-roadmap.md`（已於 Phase 8-g-7 ~ 8-g-15 系列各批 sync；§2 Phase 8-g 仍 🔄 進行中；§3 子批次表；§5.1 候選表含 ~~C~~ / ~~E~~ / ~~F~~ / ~~G~~ 皆 landed）

---

（本文件結束）
