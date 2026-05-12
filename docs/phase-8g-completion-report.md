# Phase 8-g Completion Report — overall

> 批次系列：Phase 8-g-0 系列（候選分析 / roadmap）+ Phase 8-g-2 系列（new-post.js series prompt + stderr suggestion）+ Phase 8-g-2-d 系列（validate-content series warning 規則）+ Phase 8-g-3（overall completion report 初版）+ Phase 8-g-4 系列（候選 C cross-link 補強）+ Phase 8-g-5（sample post 對齊）+ Phase 8-g-6（content/templates 對齊）+ Phase 8-g-7（future-roadmap 同步）+ 本批（Phase 8-g-8 overall completion report 同步 sample/template/roadmap landings）
> 範圍：Phase 8-g 整體統整收尾報告；候選 C + sample/template/roadmap 對齊落地後之內容更新；含 `content/github/posts/*` 變動（Phase 8-g-5 / commit `44c0e8f`）+ `content/templates/*` 變動（Phase 8-g-6 / commit `5976162`）+ `docs/future-roadmap.md` 變動（Phase 8-g-7 / commit `a9db65b`）+ 本批 `docs/phase-8g-completion-report.md` 變動（Phase 8-g-8）；無 JS / EJS / SCSS / settings / sidecars / fixtures / dist 直接變動
> 起點 HEAD：`b1679d1`（Phase 8-f-8-b completion report）
> 終點 HEAD：`a9db65b`（Phase 8-g-7 future-roadmap 同步；本批前 HEAD）
> Phase 8-g 已落地 commits：**21**（不含本批；含 Phase 8-g-3 `c3b6c63` + Phase 8-g-4 系列 `4730152` + `ddae181` + Phase 8-g-4-d `eec8ff7` + Phase 8-g-5 `44c0e8f` + Phase 8-g-6 `5976162` + Phase 8-g-7 `a9db65b`）
> `dist` / `dist-blogger` / `dist-promotion` baseline：**主軸 byte-identical**；Phase 8-g-5 sample posts 對齊**間接**影響 2 個 `dist/posts/{slug}/index.html`（各少 1 個由 H1 → H2 自動降級產生之 `<h2>`；詳見 §3.4 / §3.6.4）
> `npm run validate:content` baseline：**`0 error / 9 warning on 5 post(s)`**（Phase 8-g-5 sample post 對齊後從 `0/13/7` 收斂回來；9 warnings 全為 5 篇 validation fixtures 自證資產；詳見 §3.2 / §3.3）
> git status：clean（working tree 無 modified / untracked / deleted；本批 commit 後仍 clean）
> 未 push、未設 remote、未 amend（per Phase 8-g 起手批次規範；`c3b6c63` / `4730152` / `ddae181` / `eec8ff7` / `44c0e8f` / `5976162` / `a9db65b` 皆為新建 commit，未 amend / rebase 任何既有 commit）

---

## §1 本階段目的

Phase 8-g 之核心目的：

1. **候選排程**：在 Phase 8-f 完成後，對「驗證 / 工具 / 報表 / docs」層之候選做風險分析與狀態排程（9 項數字候選 + 候選 C + sample/template alignment；含 `candidate` / `landed` / `partially landed` / `deferred` / `not recommended` 五種狀態；詳見 `docs/phase-8g-candidate-analysis.md` §6 + 本文件 §3.1）。
2. **作者工具落地**：完成不影響 dist baseline 之候選 #2（new-post.js series 欄位提示）與候選 #3（series number gap filling），共 4 commits + 1 docs commit（Phase 8-g-2 系列）。
3. **validate 規則補強**：補完 series metadata 之 validate-content 規則覆蓋（4 條新 warning + 2 篇 validation-fixtures），共 6 commits + 1 docs commit + 1 報告 commit（Phase 8-g-2-d 系列）。
4. **fixture deferred 維持**：保留 fixture / sample end-to-end 驗證（候選 E / Phase 8-g-1）於 deferred 狀態，待部署隔離機制就緒；本階段**不執行**。
5. **不擴大 customer-facing surface**：不進入 H1 接 `series.titleTemplate` / FB `.txt` 顯示 `titleEn` / publish-checklist 顯示組合標題等接入（屬 `not recommended`；per Phase 8-f-5-c §17.3 / 8-f-6-a 既有保守決策）。
6. **文件 cross-link 補強落地（候選 C）**：完成 §5.1 必要補強（schema docs → phase reports cross-link，3 檔）+ §5.2.1~5 可選後向 link（phase reports 8-b ~ 8-f 各補 1 行，5 檔）；§5.2.6（`fb-sidecar-schema.md`）依保守決策保留未補（屬可選；無功能影響）。
7. **sample / template 層 deprecated cleanup 落地（Phase 8-g-5 / 8-g-6）**：
   - **sample posts**：2 篇 `content/github/posts/*.md` 之 `type: "tech-note"` → `contentKind: "tech-note"`、移除 body leading `# 文章標題`（commit `44c0e8f`；Phase 8-g-5）
   - **templates**：5 個 `content/templates/*.md` 之 `type` → `contentKind`、移除 body leading `# 文章標題` placeholder（commit `5976162`；Phase 8-g-6）
   - **validate baseline 已回到 `0 error / 9 warning on 5 post(s)`**（從 `0/13/7` 收斂回來）；剩餘 9 warnings 全為 5 篇 validation fixtures
   - **僅清理 sample/template 來源層**；**不等同 source code 層 legacy fallback 退場**（仍屬 Phase 8-h 或更晚；詳見 §3.6.5 / §3.7.5）

Phase 8-g 與既有 Phase 8-f 之分工：

- **Phase 8-f**：series metadata 之 build pipeline 接入（`normalized.series` / `resolve-series-title.js` / `series.hashtags` inheritance backfill / Blogger copy-helper `[11]` / promotion manifest 4 個 additive 欄位）— 屬「資料層 + 既有 customer-facing surface」。
- **Phase 8-g**：基於 Phase 8-f 既有資料層之「工具 / 驗證 / 報表 / docs cross-link / sample/template cleanup」延伸 + 候選排程 — 屬「不擴大 customer-facing surface」之保守延伸。

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

### 2.3 Phase 8-g-2-d 系列(validate-content series warning 規則)

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

### 2.6 Phase 8-g-4-d（candidate C 落地後之 completion report 更新）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-4-d | `eec8ff7` | docs | update phase 8-g overall completion report with candidate C landings |

### 2.7 Phase 8-g-5 系列（sample post 對齊）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-5-a | （無 commit）| 對話內 | sample post H1 + deprecated type 對齊讀取分析（2 篇正式 sample 之 frontmatter / body 結構檢查；validate-content 規則確認；parse-markdown.js H1 → H2 降級機制驗證）|
| 8-g-5-b | `44c0e8f` | fix | align legacy type and body H1 in github sample posts（2 檔 +2 / −6；`type` → `contentKind` + 移除 body leading H1；validate baseline `0/13/7` → `0/9/5`）|

### 2.8 Phase 8-g-6 系列（content/templates 對齊）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-6-a | （無 commit）| 對話內 | content/templates 對齊讀取分析（5 個 markdown post templates 檢查 + 對照組 `_sample-series-post.md` 確認 + validate scan path 驗證）|
| 8-g-6-b | `5976162` | fix | align legacy type and body H1 in post templates（5 檔 +5 / −15；同樣兩處變更；templates 不在 validate scan path，baseline 維持 `0/9/5`）|

### 2.9 Phase 8-g-7 系列（future-roadmap 同步）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-7 | `a9db65b` | docs | sync future-roadmap with sample/template alignment landings（1 檔 +44 / −2；§3 表新增 8-g-5/6/7 列 + §3.5 新節 + §5.1 ~~E~~ landed + §7.2 補述）|

### 2.10 本批（Phase 8-g-8 overall completion report 同步）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-8 | （未 commit；待批准）| docs | sync overall completion report with sample/template/roadmap landings |

### 2.11 合計

- **Phase 8-g 已落地 commits：21**（不含本批）
  - Phase 8-g-0 系列：2（`77fb764` / `a37d92e`）
  - Phase 8-g-2 系列：6（`fa7d825` / `bb58b2d` / `2262938` / `2507748` / `9826bd5` / `3c9b2e3`）
  - Phase 8-g-2-d 系列：7（`e70af85` / `bf58364` / `ca0381a` / `94ca4c6` / `89bbbd0` / `f97cded` / `c29f63b`）
  - Phase 8-g-3：1（`c3b6c63`）
  - Phase 8-g-4 系列：2（`4730152` / `ddae181`）
  - Phase 8-g-4-d：1（`eec8ff7`）
  - Phase 8-g-5：1（`44c0e8f`）
  - Phase 8-g-6：1（`5976162`）
  - Phase 8-g-7：1（`a9db65b`）
- 對話內讀取分析批次（無 commit）：**8**（8-g-0-a / 8-g-0-d / 8-g-2-c-a / 8-g-2-d-a / 8-g-2-d-e-a / 8-g-4-a / 8-g-5-a / 8-g-6-a）
- 本批新增 commit：**1**（待作者批准）

---

## §3 功能完成摘要

### 3.1 候選清單最終狀態

per `docs/phase-8g-candidate-analysis.md` §6 + 候選 C 落地（Phase 8-g-4 系列）+ sample/template alignment 落地（Phase 8-g-5 / 8-g-6）：

| # | 候選 | 狀態 | 落地批次 / 備註 |
|---|---|---|---|
| 1 | validation / report 補強 | ⚠️ `partially landed` | Phase 8-g-2-d-b / c / d / e-b 共 4 條 warning 落地；剩餘 series report（`dist-reports/series.txt`）仍 `candidate` |
| 2 | `new-post.js` series 欄位提示 | ✅ `landed` | Phase 8-g-2-b1 / b2 / c-c 落地 |
| 3 | series number gap filling 規則 | ✅ `landed` | Phase 8-g-2-c-b / c-c 落地（stderr-only 保守路線）|
| 4 | FB `.txt` 顯示 `titleEn` / `seriesResolvedTitle` | `not recommended` | per Phase 8-f-6-a 既有保守決策（FB 字長受限）|
| 5 | site default hashtags | `candidate` | 設定層補 site-level 預設 hashtags |
| 6 | first article `.fb.md` hashtags fallback | `candidate` | 系列首篇可繼承上一篇 hashtags |
| 7 | Blogger tags inheritance | `candidate` | Blogger 平台 `tags` 從 series 繼承 |
| 8 | H1 接 series `titleTemplate` | `not recommended` | per Phase 8-f-5-c §17.3 既有保守決策（SEO 風險 / 字長風險）|
| C | docs cross-link 補強 | ✅ `landed` | Phase 8-g-4-b / 4-c 落地（commits `4730152` + `ddae181`）；§5.2.6 `fb-sidecar-schema.md` 依保守決策未補（屬可選；無功能影響）|
| S/T | sample / template alignment（deprecated `type` + body leading H1 cleanup）| ✅ `landed` | Phase 8-g-5（commit `44c0e8f`：2 篇 sample posts）+ Phase 8-g-6（commit `5976162`：5 個 templates）落地；僅 sample/template 來源層；source code 層 legacy fallback 仍存在（屬 Phase 8-h 或更晚；詳見 §3.6.5 / §3.7.5）|
| E | fixture / sample end-to-end 驗證 | `deferred` | 屬 Phase 8-g-1；詳見 §4 |

> 命名說明：上表新增之 `S/T` 為 phase-8g-completion-report.md 內部代號（sample / template alignment），與 `docs/future-roadmap.md` §5.1 之 `~~E~~`（同候選）為同義；採描述性代號以避免與 candidate E（fixture / sample end-to-end 驗證 deferred）之既有命名衝突。

### 3.2 validate baseline 現況

`npm run validate:content` baseline：**`0 error / 9 warning on 5 post(s)`**

9 warnings 分布（依來源檔分類；**全為 validation fixtures 自證資產**）：

| # | 來源檔 | 觸發 warning | 性質 |
|---|---|---|---|
| 1 | `content/validation-fixtures/github/posts/_test-fb-titleEn.md` | `fb-md-titleEn-invalid-type` | Phase 8-e fixture（既有；規則自證資產）|
| 2 | `content/validation-fixtures/github/posts/_test-series-not-object.md` | `series-not-object` | Phase 8-e fixture（既有）|
| 3 | `content/validation-fixtures/github/posts/_test-series-validation.md` | `series-id-invalid`, `series-number-invalid`, `series-subtitle-invalid-type` | Phase 8-e fixture（既有）|
| 4 | `content/validation-fixtures/github/posts/_test-series-dup-a.md` | `series-id-not-in-settings`, `series-number-duplicate` | Phase 8-g-2-d-e-c fixture（規則自證資產）|
| 5 | `content/validation-fixtures/github/posts/_test-series-dup-b.md` | `series-id-not-in-settings`, `series-number-duplicate` | Phase 8-g-2-d-e-c fixture（規則自證資產）|

合計：**9 warnings / 5 posts**。

依性質分類合計：

| 性質 | warning 數 | post 數 |
|---|---|---|
| Phase 8-e 既有 fixture（規則自證）| 5 | 3 |
| Phase 8-g-2-d-e-c 新增 fixture（規則自證）| 4 | 2 |
| **合計** | **9** | **5** |

**重要**：9 warnings **全部為 validation fixtures 之自證資產**；**無正式 sample post 之 noise warnings**（兩篇 sample 之 `body-leading-h1` + `frontmatter-uses-deprecated-type` 共 4 條已於 Phase 8-g-5 `44c0e8f` 消除）。

### 3.3 baseline 變化軌跡（含 sample alignment 收斂）

| 階段 | baseline | 變化原因 |
|---|---|---|
| Phase 8-g-2-d-e-c 前 | `0 error / 9 warning on 5 post(s)` | 兩篇 sample posts 各觸發 2 條 noise warning（4）+ Phase 8-e 既有 fixture 5 條 = 9 / 5 |
| Phase 8-g-2-d-e-c 後 | **`0 error / 13 warning on 7 post(s)`** | 新增 2 篇 fixture（`_test-series-dup-a/b`）各觸發 2 條規則自證 warning（+4 / +2）；屬 fixture 預期 |
| Phase 8-g-5（`44c0e8f`）後 | **`0 error / 9 warning on 5 post(s)`** | 兩篇 sample posts 之 `body-leading-h1` + `frontmatter-uses-deprecated-type` 共 4 條 noise warning 消除（−4 / −2）；屬 sample noise 清除 |

**−4 warnings / −2 posts（從 0/13/7 → 0/9/5）為 sample noise 清除，非 regression**：

per `docs/phase-8g-2-d-completion-report.md` §4.3 + Phase 8-g-5 讀取分析：

1. sample posts 之 4 條 warning 屬作者規格遷移落差（`type` 為 Phase 8-a 前命名，已正式更名 `contentKind`；body H1 重複 frontmatter title 已由 `parse-markdown.js` 自動降級）— 屬 noise 而非 functional issue
2. Phase 8-g-5 之 `44c0e8f` 直接消除 source；validate 規則本身未變
3. 剩餘 9 warnings 全為 5 篇 validation fixtures 之**預期觸發**（規則自證）；無 regression
4. fixtures 之 frontmatter（`contentKind` / `category` / `tags` / `cover` / `description` / body 不以 `#` 開頭）皆完整對齊，未觸發其他 noise warning

baseline 變動於 `docs/phase-8g-2-d-completion-report.md` §4 + 本文件 §3.6.4 已詳細記錄並標示為「**預期變動，非 regression**」。

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
- **future-roadmap 同步**（Phase 8-g-7；commit `a9db65b`）→ 純 docs；不接 build pipeline
- **本批 overall completion report 同步**（Phase 8-g-8）→ 純 docs；不接 build pipeline

### 3.5 Phase 8-g-4 系列：候選 C cross-link 補強落地紀錄

候選 C 之 docs cross-link 補強分 3 個 commit 落地（`4730152` / `ddae181` / `eec8ff7`），外加 1 個讀取分析批次（`8-g-4-a`）。

#### 3.5.1 §5.1 必要補強（commit `4730152`）

修補 schema docs 與 phase completion reports 之間之 cross-link 缺口：

| 檔案 | 補強內容 |
|---|---|
| `docs/phase-8d-completion-report.md` | 開頭引用區 +1 行：新增 `phase-8c-completion-report.md` 前向 link（修補 G1 — 8-c → 8-d 導航斷點）|
| `docs/publish-bundle.md` | §8 末新增 `### 8.1 Phase 8 系列完成報告` +12 行：列 6 份 phase report + `future-roadmap.md` |
| `docs/publish-json-schema.md` | 文件末新增 `## §12 相關文件` +19 行：含 §12.1 phase report 清單 + §12.2 roadmap |

合計 **3 檔 / +32 行 / 0 刪除**。**不動 `publish-bundle.md` §7.5 / §7.6 / §7.7 過時描述**（per 保守決策；屬另列 future candidate，詳見 §5.5）。

#### 3.5.2 §5.2 可選後向 link 補強（commit `ddae181`）

修補 phase 報告之間之後向導航：

| 檔案 | 補強內容 |
|---|---|
| `docs/phase-8b-completion-report.md` | §12.3「不建議方向」末 +1 行：`下一階段已於 \`docs/phase-8c-completion-report.md\` 落地。` |
| `docs/phase-8c-completion-report.md` | §13.5「第二批 placeholder 規劃」末 +1 行：→ `docs/phase-8d-completion-report.md` |
| `docs/phase-8d-completion-report.md` | §10.3「Phase 8-d 期間發現之延後候選」末 +1 行：→ `docs/phase-8e-completion-report.md`（僅末段；未動開頭引用區）|
| `docs/phase-8e-completion-report.md` | §10.3「強烈建議：下一批保持小批次」末 +1 行（§11 之前）：→ `docs/phase-8f-completion-report.md` |
| `docs/phase-8f-completion-report.md` | §9.3「強烈建議：下一批保持小批次」末 +1 行：→ `docs/phase-8g-completion-report.md` |

合計 **5 檔 / +10 行 / 0 刪除**。每檔僅 1 行純 prose 後向 link，**不新增兄弟 phase 列表**、**不重寫既有段落**、**不改既有語意**。

#### 3.5.3 §5.2.6 `fb-sidecar-schema.md`：依保守決策未補

`fb-sidecar-schema.md` 於 §12.3.1 既有 1 個 link 到 `phase-8f-completion-report.md`（per Phase 8-f-7-b series.hashtags inheritance 落地）；可選補連 8-c（FB 必備檢查與 placeholder）/ 8-e（FB sidecar schema 補強）系列之 phase report，但屬可選補強。**本批未執行**，per 保守原則「不過度 cross-link」；未來如有實際導航需求再單獨評估（詳見 §5.5 future candidate）。

#### 3.5.4 對 dist / build / validate 之影響

| 影響面 | 變動？ | 說明 |
|---|---|---|
| `npm run build:*` 輸出 | ❌ 不變 | 純 docs 補強；不接 build pipeline |
| `npm run validate:content` baseline | ❌ 不變 | 候選 C 落地時仍為 `0 error / 13 warning on 7 post(s)`；其後 Phase 8-g-5 才收斂回 `0/9/5` |
| `dist` / `dist-blogger` / `dist-promotion` / `dist-reports` baseline | ❌ 不變 | 無 build 觸發 |
| `package.json` | ❌ 不變 | 無新增 npm script / 外部相依 |

#### 3.5.5 Phase 8-g-4-d（candidate C 落地後之 completion report 更新）

於 commit `eec8ff7` 落地：將本 phase-8g-completion-report.md 從 Phase 8-g-3 初版（c3b6c63；尚未含候選 C）更新為「候選 C 落地後狀態」（Phase 8-g-4 系列 §5.1 + §5.2 已 landed）。具體更新範圍含本 §3.5 / §5.1（候選 C 標 landed）/ §6 / §7.1（標「本批 8-g-4-d」）等。

### 3.6 Phase 8-g-5 系列：sample post 對齊落地紀錄

Phase 8-g-5 補完 2 篇正式 sample post 之 deprecated `type` 與 body leading H1 cleanup（per `docs/phase-8g-completion-report.md` §6.2 之 sample 對齊候選；屬「最高優先候選」之落地實作）。

#### 3.6.1 讀取分析（8-g-5-a；無 commit）

對話內讀取分析批次，識別範圍：

- 2 篇 ready sample posts（`status: ready` / `draft: false`）：
  - `content/github/posts/20260504-github-pages-blog-planning.md`
  - `content/github/posts/20260504-portable-blog-system-mvp.md`
- 兩篇 frontmatter L4 皆 `type: "tech-note"`（無 `contentKind`）
- 兩篇 body 第 1 行皆為 ATX H1 `# 文章標題`
- 確認 `parse-markdown.js` 既有 H1 → H2 自動降級邏輯
- 確認 `post-detail.ejs` L14 之 H1 由 frontmatter title 渲染，不依賴 body
- 確認 promotion / sitemap / copy-helper 不從 body 取
- 風險評估：🟢 極低

#### 3.6.2 實作（8-g-5-b；commit `44c0e8f`）

修改範圍：

| 檔案 | frontmatter L4 修改 | body H1 刪除 |
|---|---|---|
| `20260504-github-pages-blog-planning.md` | `type: "tech-note"` → `contentKind: "tech-note"` | L52-53 `# GitHub Pages 免費空間限制與部落格規劃` + 空白行 |
| `20260504-portable-blog-system-mvp.md` | 同上 | L51-52 `# Portable Blog System MVP 開發筆記` + 空白行 |

合計 **2 檔 / +2 / −6**（淨 −4 行）；不保留 legacy `type`、不新增其他欄位、不改其他段落。

#### 3.6.3 validate baseline 變化

| 階段 | baseline |
|---|---|
| Phase 8-g-5 前（HEAD `5d38d46`）| `0 error / 13 warning on 7 post(s)` |
| Phase 8-g-5 後（HEAD `44c0e8f`）| **`0 error / 9 warning on 5 post(s)`** |

差異：**−4 warnings / −2 posts**（兩篇 sample posts 之 `body-leading-h1` + `frontmatter-uses-deprecated-type` 共 4 條 noise warning 消除）。

#### 3.6.4 dist 影響

| dist 檔 | 變動 |
|---|---|
| `dist/posts/github-pages-blog-planning/index.html` | body `<article>` 少一個 `<h2>GitHub Pages 免費空間限制與部落格規劃</h2>`；`<h1 class="lab-article__title">` 仍由 frontmatter title 渲染 |
| `dist/posts/portable-blog-system-mvp/index.html` | 同上；少一個 `<h2>Portable Blog System MVP 開發筆記</h2>` |
| 其他 dist 產物 | byte-identical（Blogger summary mode 不從 body；blogger.enabled=false 不輸出；promotion / sitemap / copy-helper 全部從 frontmatter）|

預期 dist 變動 = **2 個 GitHub 站文章詳細頁** body H2 刪除；其他 dist 全部不變。本批未執行 build；實際 build diff 待作者後續驗證。

#### 3.6.5 與 source code 層 legacy fallback 之區分（保守決策保留）

Phase 8-g-5 只清理 **sample posts 來源層**；以下 source code 層 legacy 機制**仍存在**（未退場）：

- **`src/scripts/load-posts.js`** L60-67：`contentKind: data.contentKind ?? data.type` fallback 仍存在；保留以涵蓋未來作者誤寫 `type`
- **`src/scripts/validate-content.js`** L223-230：`frontmatter-uses-deprecated-type` warning 規則仍存在；fixtures 不觸發此規則，但若未來作者誤用 `type` 仍會被偵測
- **`src/scripts/parse-markdown.js`** L33-46：H1 → H2 自動降級（Phase 7-fix-1 (B)）仍存在；保留 SEO 防呆

上述 source code 層之 legacy fallback / warning rule / H1 demotion **退場屬 Phase 8-h 或更晚**（per §5.2 排除原則「相容層退場」之既有立場）。

### 3.7 Phase 8-g-6 系列：content/templates 對齊落地紀錄

Phase 8-g-6 補完 5 個 markdown post 範本之 deprecated `type` 與 body leading H1 placeholder cleanup（per Phase 8-g-5 讀取分析之延伸；per 8-g-6-a 讀取分析）。

#### 3.7.1 讀取分析（8-g-6-a；無 commit）

對話內讀取分析批次，識別範圍：

- 5 個 markdown post 範本（皆使用 `type: "tech-note"` + body `# 文章標題`）：
  - `content/templates/post-template.md`
  - `content/templates/github-tech-note-template.md`
  - `content/templates/blogger-book-review-template.md`
  - `content/templates/blogger-download-template.md`
  - `content/templates/blogger-summary-template.md`
- 對照組（已現代化）：`_sample-series-post.md`（使用 `contentKind` + body 無 H1）
- scope 外：`_sample.fb.md`（FB sidecar schema）/ `*.publish.json`（JSON schema）
- 確認 `content/templates/**` **不在** `validate-content.js` 之 scan path（per L677-678）
- 確認 `new-post.js` 使用 inline TEMPLATE 常數，**不讀** `content/templates/*.md`
- 風險評估：🟢 極低（純文件對齊；不影響 validate / build / dist）

#### 3.7.2 實作（8-g-6-b；commit `5976162`）

修改範圍：

| 檔案 | frontmatter L4 修改 | body H1 刪除 |
|---|---|---|
| `post-template.md` | `type: "tech-note"` → `contentKind: "tech-note"` | L48-49 `# 文章標題` + 空白行 |
| `github-tech-note-template.md` | 同上 | L39-40 同 |
| `blogger-book-review-template.md` | 同上 | L48-49 同 |
| `blogger-download-template.md` | 同上 | L39-40 同 |
| `blogger-summary-template.md` | 同上 | L39-40 同 |

合計 **5 檔 / +5 / −15**（淨 −10 行）；同樣不保留 legacy `type`、不新增其他欄位、不改其他段落。

#### 3.7.3 validate baseline 變化

| 階段 | baseline |
|---|---|
| Phase 8-g-6 前（HEAD `44c0e8f`）| `0 error / 9 warning on 5 post(s)` |
| Phase 8-g-6 後（HEAD `5976162`）| **`0 error / 9 warning on 5 post(s)`** |

差異：**完全不變**（templates 不在 validate scan path）。

#### 3.7.4 dist 影響

`content/templates/**` **不在任何 `build:*` 之 loader path**；本批改動完全不影響 dist baseline。

| dist 範圍 | 變動 |
|---|---|
| 所有 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` 產物 | byte-identical |

#### 3.7.5 與 source code 層 legacy fallback 之區分（保守決策保留）

Phase 8-g-6 同樣只清理 **template 來源層**；同 §3.6.5 之 source code 層 legacy 機制（`load-posts.js` fallback / `validate-content.js` warning rule / `parse-markdown.js` H1 demotion）**仍存在**，退場屬 Phase 8-h 或更晚。

額外確認：`new-post.js` 之 inline TEMPLATE 已於 Phase 8-g-2-b1（commit `fa7d825`）對齊 `contentKind`；與本批之 `content/templates/*.md` 範本獨立；scope 外之 `_sample-series-post.md` 早於 Phase 8-e 已現代化。

### 3.8 Phase 8-g-7 系列：future-roadmap 同步落地紀錄

Phase 8-g-7（commit `a9db65b`）將 `docs/future-roadmap.md` 同步到 Phase 8-g-5 / 8-g-6 落地後狀態。

#### 3.8.1 實作

修改範圍（1 檔 / +44 / −2）：

- **§3 子批次表**：修正 8-g-4-e 自我參照（🔄 → ✅ 完成 + commit `5d38d46`）；新增 5 列（8-g-5-a / 5-b / 6-a / 6-b / 7）
- **§3.5 新增小節**：Phase 8-g-5 / 8-g-6 落地摘要
- **§5.1 推薦候選表**：新增 `~~E~~` 列（sample / template 對齊）✅ landed
- **§7.2 Phase 8-g 紀錄**：phase-8g-completion-report.md 描述補述「sample/template 對齊已於 `44c0e8f` / `5976162` 落地；overall completion report 之 §5 / §6 待後續獨立批次（Phase 8-g-8）同步」

#### 3.8.2 完成本批（Phase 8-g-8）後

本批 Phase 8-g-8 完成 phase-8g-completion-report.md 同步後，**roadmap 與 completion report 之間將完全一致**；§7.2 描述中「待後續獨立批次同步」之預告即由本批兌現。

---

## §4 deferred 狀態：Phase 8-g-1 fixture / sample end-to-end 驗證

**狀態**：`deferred`（沿用 Phase 8-g-0-b 與 `docs/phase-8g-candidate-analysis.md` §5 之決策；**本批不變動此狀態**；候選 C / sample alignment / template alignment / roadmap sync 落地皆**不解封** Phase 8-g-1 deferred）

### 4.1 暫不執行理由（沿用既有決策）

1. ready fixture 會進入正式 `dist/` / `sitemap.xml` / `dist-promotion/` baseline。
2. 若未來不小心部署，`_sample-` 內容可能對外可見。
3. 本系統第一版無 noindex / staging dist 機制可隔離 fixture。
4. 已完成 Phase 8-f / 8-g-2 / 8-g-2-d / 8-g-3 / 8-g-4 / 8-g-5 / 8-g-6 / 8-g-7 系列；目前不是非做 fixture 不可。
5. fixture end-to-end 驗證有價值，但應獨立排程，不能混在 Phase 8-g 收尾批次。

### 4.2 觸發條件（未滿足）

進入 Phase 8-g-1 前需滿足以下其一：

- 作者人工確認部署流程能隔離 `_sample-` 內容；或
- 在作者正式建立第一篇系列文章之前不執行；或
- 先設計 noindex / staging dist 機制再執行。

### 4.3 建議方案內容（deferred）

完整方案內容（series.json entry / fixture post / `.publish.json` / `promotion.facebook.enabled` / 不搭配 `.fb.md` / 拆 2 commits / 部署把關）詳見 `docs/phase-8g-candidate-analysis.md` §5。**本批不執行**。

### 4.4 與 Phase 8-g-2-d-e-c validation-fixtures 之區分

| 維度 | Phase 8-g-2-d-e-c validation-fixtures | Phase 8-g-1 ready fixture |
|---|---|---|
| 放置位置 | `content/validation-fixtures/` | `content/{site}/posts/` |
| 是否被 `build:*` 掃到 | ❌ 不會 | ✅ 會 |
| 影響 dist baseline | ❌ 不會 | ✅ 會 |
| 部署風險 | ❌ 無 | ✅ 有 |
| 用途 | validate 規則自證 | end-to-end 接入路徑驗證 |
| 本階段執行 | ✅ 已執行 | ❌ 仍 deferred |

兩者**設計上互不影響**；Phase 8-g-2-d-e-c 之 fixture 落地 / Phase 8-g-4 候選 C cross-link 補強落地 / Phase 8-g-5 sample post 對齊落地 / Phase 8-g-6 template 對齊落地 / Phase 8-g-7 roadmap 同步落地皆**不解封** Phase 8-g-1 之 deferred 狀態。

---

## §5 尚未處理候選清單

per `docs/phase-8g-candidate-analysis.md` §6 + `docs/future-roadmap.md` §5（含 Phase 8-g-4 / 8-g-5 / 8-g-6 / 8-g-7 落地後之更新）：

### 5.1 candidate（不影響 dist；可優先排程）

候選 C（docs cross-link 補強）已於 Phase 8-g-4 系列（commits `4730152` + `ddae181`）落地；sample / template alignment（S/T）已於 Phase 8-g-5（commit `44c0e8f`）+ Phase 8-g-6（commit `5976162`）落地；§5.2.6（`fb-sidecar-schema.md`）依保守決策保留未補（屬可選；無功能影響）。**本層級當前無待辦項。**

### 5.2 candidate（會影響 dist / settings / reports baseline；需獨立讀取分析批次）

| # | 候選 | 性質 | 影響面 | 備註 |
|---|---|---|---|---|
| 1（剩餘）| series report（`dist-reports/series.txt`）| 報表延伸 | `dist-reports/` | 與 `series-number-duplicate` 配套之報表 |
| 5 | site default hashtags | settings fallback chain | promotion baseline | hashtags fallback chain 上游補強 |
| 6 | 系列首篇 `.fb.md` hashtags fallback | normalize-post-output 改 | promotion baseline | 前篇延續策略 |
| 7 | Blogger tags inheritance | normalize / publish.json | blogger meta baseline | 與 FB hashtags 平行設計（注意格式分離原則，per `docs/fb-sidecar-schema.md` §12.3.1）|

> 「兩篇 sample post H1 + deprecated `type` 對齊」與「`content/templates/*` 對齊」已於 Phase 8-g-5 / 8-g-6 落地（詳見 §3.6 / §3.7），從本表移除。

### 5.3 not recommended（既有保守決策；如未來改變需另開規格）

| # | 候選 | 性質 | 理由 |
|---|---|---|---|
| 4 | FB `.txt` 顯示 `titleEn` / `seriesResolvedTitle` | customer-facing | FB 字長受限；per Phase 8-f-6-a 既有保守決策 |
| 8 | H1 接 series `titleTemplate` | customer-facing | SEO 風險 / 字長風險；per Phase 8-f-5-c §17.3 既有保守決策 |

### 5.4 deferred

| # | 候選 | 性質 | 觸發條件 |
|---|---|---|---|
| E / 8-g-1 | fixture / sample end-to-end 驗證 | 測試資產 | 詳見 §4 |

### 5.5 future candidate（per `docs/phase-8g-2-d-completion-report.md` §8.4 + Phase 8-g-4-a / 8-g-5-a / 8-g-6-a 讀取分析）

- 升級任一 series warning 為 error：違反 Phase 8-g-2-d 系列 warning-only 保守路線；不建議
- 跨 status 之 duplicate 檢查（含 drafts）：需擴充 `load-posts.js`；與既有 series 規則範圍分歧
- `titleTemplate unresolved` 升級為 user-visible warning（per `docs/series-schema.md` §15.4.2）：屬 Phase 8-f-7 之 helper-internal warnings 升級候選
- **`docs/publish-bundle.md` §7.5 / §7.6 / §7.7 過時描述對齊**：屬「規格內容更新」而非 cross-link 補強；Phase 8-g-4-a 讀取分析之 §5.3 N2 排除原則明確標示**不在候選 C scope**；應另開批次（內容對齊應檢視實際 Phase 8-e / 8-f / 8-g 落地，與 §7 既有「Phase 8-a 撰寫時預期計畫」之差異全面對齊）。
- **`docs/fb-sidecar-schema.md` 補連 8-c / 8-e 系列 phase report**：屬 §5.2.6 可選補強；Phase 8-g-4-c 依保守決策未執行；未來如有導航需求再評估。
- **source code 層 legacy fallback / warning rule / H1 demotion 退場**（per §3.6.5 / §3.7.5）：
  - `src/scripts/load-posts.js` `contentKind ?? data.type` fallback 退場
  - `src/scripts/validate-content.js` `frontmatter-uses-deprecated-type` warning rule 退場
  - `src/scripts/parse-markdown.js` H1 → H2 自動降級退場
  - 屬 Phase 8-h 或更晚；需先確認所有 source（含 sample / template / 既有 posts / 文件範例）已對齊，再評估退場時機

---

## §6 下一步建議拆批順序

### 6.1 低風險優先（不影響 dist；本層級候選已全數落地）

候選 C（docs cross-link 補強）+ sample / template alignment（S/T）皆已落地（commits `4730152` / `ddae181` / `eec8ff7` / `44c0e8f` / `5976162` / `a9db65b` / 本批 Phase 8-g-8）；**本層級當前無待辦項**。下一步建議移至 §6.2 之需要人工決策候選。

### 6.2 建議下一步（先讀取分析批次，不直接實作）

依優先序：

1. **候選 5 / 6 / 7（site default hashtags / 首篇 fallback / Blogger tags inheritance）**：三者皆會動 normalize 或 settings；建議**分別**做讀取分析批次（無 commit），評估 fallback chain 上下游與 promotion / blogger meta baseline 影響後，再決定是否進實作。**不混批**。優先序由作者決定。
2. **series report（`dist-reports/series.txt`）延後**：reports 補強；build pipeline 改動屬中等規模；建議於候選 5 / 6 / 7 之後再評估，由作者排程。
3. **source code 層 legacy fallback 退場**（Phase 8-h 或更晚之候選）：sample / template 來源層已清理；待作者確認所有 source（含 fixtures 之 deprecated 寫法是否屬刻意 vs 待清理）後再評估退場時機。屬獨立規格議題；不應混入既有批次。
4. **`docs/publish-bundle.md` §7.5 / §7.6 / §7.7 過時描述對齊**：屬規格內容更新；另開批次評估與實際 Phase 8-e / 8-f / 8-g 落地之全面對齊。

### 6.3 建議暫緩

- **Phase 8-g-1 fixture / sample end-to-end**：deferred 條件仍未滿足（無 noindex / staging dist 機制；作者尚未建立首篇正式系列文章）；**本批不變動此狀態**。
- **候選 4 / 8（customer-facing 系列輸出）**：`not recommended`；per Phase 8-f-5-c §17.3 / 8-f-6-a 既有保守決策；如未來改變需另開規格。

### 6.4 起手批次節奏建議（保留）

per `docs/future-roadmap.md` §5.3：每個候選首批應為**純讀取分析 + docs**，不直接修改 JS / EJS / settings；確認方向後再進入實作批次。本原則 Phase 8-g 全程沿用（含候選 C `8-g-4-a` / sample alignment `8-g-5-a` / template alignment `8-g-6-a` 讀取分析 + 各自實作）；建議下一階段仍維持。

---

## §7 不變項 / 安全邊界

### 7.1 本批（Phase 8-g-8）明確未修改之範圍

| 範圍 | 狀態 |
|---|---|
| `src/scripts/*` | ❌ 未修改 |
| `src/views/*` / `src/styles/*` / `src/js/*` | ❌ 未修改 |
| `content/blogger/posts/*` / `content/blogger/pages/*` / `content/github/pages/*` | ❌ 未修改 |
| `content/github/posts/*`（Phase 8-g-5 對齊對象）| ❌ 本批未修改（commit `44c0e8f` 已落地；本批不重觸碰）|
| 任何 `.publish.json` / `.fb.md` sidecar | ❌ 未修改 |
| `content/settings/*`（含 `series.json` 維持 `{"series":[]}`）| ❌ 未修改 |
| `content/templates/*`（Phase 8-g-6 對齊對象）| ❌ 本批未修改（commit `5976162` 已落地；本批不重觸碰）|
| `content/validation-fixtures/*` | ❌ 未修改（未新增 fixture）|
| `content/drafts/` / `content/archive/` | ❌ 未修改（皆空目錄）|
| `package.json` | ❌ 未修改（無新增 npm script / 外部相依）|
| 任何 EJS / SCSS | ❌ 未修改 |
| `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | ❌ 未修改（本批未執行 build）|
| `docs/phase-8b-completion-report.md` ~ `docs/phase-8f-completion-report.md`（Phase 8-g-4 系列 cross-link 補強對象）| ❌ 本批未修改（前 commits `4730152` / `ddae181` 已落地；本批不重觸碰）|
| `docs/phase-8g-2-completion-report.md` / `docs/phase-8g-2-d-completion-report.md` | ❌ 未修改（frozen）|
| `docs/phase-8g-candidate-analysis.md` | ❌ 未修改（本批不需要重寫候選分析）|
| `docs/publish-bundle.md` / `docs/publish-json-schema.md`（Phase 8-g-4-b §5.1 補強對象；含 §7.5 / §7.6 / §7.7 過時描述）| ❌ 本批未修改 |
| `docs/fb-sidecar-schema.md`（§5.2.6 候選；Phase 8-g-4-c 依保守決策未補；本批維持）| ❌ 本批未修改 |
| `docs/future-roadmap.md`（Phase 8-g-7 對齊對象）| ❌ 本批未修改（commit `a9db65b` 已落地；本批不重觸碰）|
| `docs/series-schema.md` / `docs/promotion-export.md` / `docs/migration-from-frontmatter.md` | ❌ 未修改 |

### 7.2 本批明確未引入之機制

- ❌ 新 fixture（未動 `content/validation-fixtures/`）
- ❌ 新 validate 規則（未動 `src/scripts/validate-content.js`）
- ❌ baseline 變動（validate / build / dist baseline 皆不變；仍為 `0 error / 9 warning on 5 post(s)` / dist 主軸 byte-identical）
- ❌ 新 npm script 或外部相依
- ❌ Phase 8-g-1 fixture deferred 解封（仍 `deferred`；sample/template alignment + candidate C 落地不解封）
- ❌ 新增 cross-link 至 docs（本批僅更新 `phase-8g-completion-report.md` 內容；不擴大 cross-link 範圍至其他檔）
- ❌ 修正 `publish-bundle.md` §7.5 / §7.6 / §7.7 過時描述（保留為 §5.5 future candidate）
- ❌ 啟動 source code 層 legacy fallback 退場（仍屬 Phase 8-h 或更晚；per §3.6.5 / §3.7.5 / §5.5）
- ❌ 將 Phase 8-g overall 狀態標成「完全完成」（仍有 8-g-1 deferred / candidate 5 / 6 / 7 / series report / source code fallback 退場 / publish-bundle 過時描述 / fb-sidecar §5.2.6 等 future candidates；overall 狀態仍為 🔄 進行中，per `docs/future-roadmap.md` §2）

### 7.3 git 操作確認（本批落地後預期狀態）

| 項目 | 狀態 |
|---|---|
| `git status` | 本批 commit 後 working tree 將回到 clean（`.gitignore` 包含之 `dist*` / `node_modules` / `.cache` 屬產物，不算 working tree 變動）|
| `git remote` | **未設定**（本批未設 remote）|
| `git push` | **未執行** |
| `git commit --amend` / `git rebase` | **未執行**（本批不 amend / rebase 既有 commit；新增 commit 待作者批准後另行建立；`c3b6c63` / `4730152` / `ddae181` / `eec8ff7` / `44c0e8f` / `5976162` / `a9db65b` 已落地 commits 皆未被 amend / rebase）|
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

- `docs/series-schema.md`（series metadata schema；§5 auto-suggest / §20 Phase 8-g-2 落地 / §21 Phase 8-g-2-d 落地）
- `docs/promotion-export.md`（promotion manifest §10 4 個 additive 欄位）
- `docs/fb-sidecar-schema.md`（§12.3.1 Blogger tags / FB hashtags 格式分離原則；Phase 8-g-4-c §5.2.6 依保守決策未補連 8-c / 8-e）
- `docs/publish-bundle.md`（sidecar bundle schema；§8.1 含 Phase 8-g-4-b 新增之 Phase 8 系列完成報告清單）
- `docs/publish-json-schema.md`（publish.json schema；§12 含 Phase 8-g-4-b 新增之相關文件節）
- `docs/migration-from-frontmatter.md`（既有 frontmatter 遷移指南）

### 8.4 Roadmap

- `docs/future-roadmap.md`（已於 Phase 8-g-7 `a9db65b` 同步 Phase 8-g-5 / 8-g-6 / 8-g-7 landings；§2（Phase 8 系列進度；8-g 仍 🔄 進行中）/ §3（Phase 8-g 子批次進度；含 §3.5 Phase 8-g-5 / 8-g-6 落地摘要）/ §5（下一步候選；候選 C + ~~E~~ S/T 皆標 landed））

---

（本文件結束）
