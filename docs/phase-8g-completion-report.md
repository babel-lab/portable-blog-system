# Phase 8-g Completion Report — overall

> 批次系列：Phase 8-g-0 系列（候選分析 / roadmap）+ Phase 8-g-2 系列（new-post.js series prompt + stderr suggestion）+ Phase 8-g-2-d 系列（validate-content series warning 規則）+ 本批（Phase 8-g-3 overall completion report）
> 範圍：Phase 8-g 整體統整收尾報告；無 JS / EJS / SCSS / settings / content posts / sidecars / templates / fixtures / dist 變動
> 起點 HEAD：`b1679d1`（Phase 8-f-8-b completion report）
> 終點 HEAD：`c29f63b`（Phase 8-g-2-d-g completion report；本批前 HEAD）
> Phase 8-g 已落地 commits：15（不含本批）
> `dist` / `dist-blogger` / `dist-promotion` baseline：**byte-identical**（Phase 8-g 全程無 build pipeline 變動）
> `npm run validate:content` baseline：**`0 error / 13 warning on 7 post(s)`**（Phase 8-g-2-d-e-c fixture 落地之預期變動；詳見 §3.2 / §3.3）
> git status：clean（working tree 無 modified / untracked / deleted）
> 未 push、未設 remote、未 amend（per Phase 8-g 起手批次規範）

---

## §1 本階段目的

Phase 8-g 之核心目的：

1. **候選排程**：在 Phase 8-f 完成後，對「驗證 / 工具 / 報表 / docs」層之候選做風險分析與狀態排程（9 項候選；含 `candidate` / `landed` / `partially landed` / `deferred` / `not recommended` 五種狀態；詳見 `docs/phase-8g-candidate-analysis.md` §6）。
2. **作者工具落地**：完成不影響 dist baseline 之候選 #2（new-post.js series 欄位提示）與候選 #3（series number gap filling），共 4 commits + 1 docs commit（Phase 8-g-2 系列）。
3. **validate 規則補強**：補完 series metadata 之 validate-content 規則覆蓋（4 條新 warning + 2 篇 validation-fixtures），共 6 commits + 1 docs commit + 1 報告 commit（Phase 8-g-2-d 系列）。
4. **fixture deferred 維持**：保留 fixture / sample end-to-end 驗證（候選 E / Phase 8-g-1）於 deferred 狀態，待部署隔離機制就緒；本階段**不執行**。
5. **不擴大 customer-facing surface**：不進入 H1 接 `series.titleTemplate` / FB `.txt` 顯示 `titleEn` / publish-checklist 顯示組合標題等接入（屬 `not recommended`；per Phase 8-f-5-c §17.3 / 8-f-6-a 既有保守決策）。

Phase 8-g 與既有 Phase 8-f 之分工：

- **Phase 8-f**：series metadata 之 build pipeline 接入（`normalized.series` / `resolve-series-title.js` / `series.hashtags` inheritance backfill / Blogger copy-helper `[11]` / promotion manifest 4 個 additive 欄位）— 屬「資料層 + 既有 customer-facing surface」。
- **Phase 8-g**：基於 Phase 8-f 既有資料層之「工具 / 驗證 / 報表」延伸 + 候選排程 — 屬「不擴大 customer-facing surface」之保守延伸。

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

### 2.4 本批（Phase 8-g-3 overall completion report）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-3 | （未 commit；待批准）| docs | add phase 8-g overall completion report + roadmap 同步 |

### 2.5 合計

- Phase 8-g 已落地 commits：**15**（不含本批）
- 對話內讀取分析批次（無 commit）：**5**
- 本批新增 commit：**1**（待作者批准）

---

## §3 功能完成摘要

### 3.1 候選清單最終狀態

per `docs/phase-8g-candidate-analysis.md` §6（Phase 8-g-2-d-g 更新版）：

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
| E | fixture / sample end-to-end 驗證 | `deferred` | 屬 Phase 8-g-1；詳見 §4 |

### 3.2 validate baseline 現況

`npm run validate:content` baseline：**`0 error / 13 warning on 7 post(s)`**

13 warnings 分布（依來源檔分類）：

| # | 來源檔 | 觸發 warning | 性質 |
|---|---|---|---|
| 1 | `content/github/posts/20260504-github-pages-blog-planning.md` | `body-leading-h1`, `frontmatter-uses-deprecated-type` | Legacy sample post 對齊問題 |
| 2 | `content/github/posts/20260504-portable-blog-system-mvp.md` | `body-leading-h1`, `frontmatter-uses-deprecated-type` | Legacy sample post 對齊問題 |
| 3 | `content/validation-fixtures/github/posts/_test-fb-titleEn.md` | `fb-md-titleEn-invalid-type` | Phase 8-e fixture（既有；規則自證資產）|
| 4 | `content/validation-fixtures/github/posts/_test-series-not-object.md` | `series-not-object` | Phase 8-e fixture（既有）|
| 5 | `content/validation-fixtures/github/posts/_test-series-validation.md` | `series-id-invalid`, `series-number-invalid`, `series-subtitle-invalid-type` | Phase 8-e fixture（既有）|
| 6 | `content/validation-fixtures/github/posts/_test-series-dup-a.md` | `series-id-not-in-settings`, `series-number-duplicate` | **Phase 8-g-2-d-e-c fixture（本系列新增；預期觸發）** |
| 7 | `content/validation-fixtures/github/posts/_test-series-dup-b.md` | `series-id-not-in-settings`, `series-number-duplicate` | **Phase 8-g-2-d-e-c fixture（本系列新增；預期觸發）** |

合計：**13 warnings / 7 posts**。

依性質分類合計：

| 性質 | warning 數 | post 數 |
|---|---|---|
| Legacy sample post 對齊問題 | 4 | 2 |
| Phase 8-e 既有 fixture（規則自證）| 5 | 3 |
| Phase 8-g-2-d-e-c 新增 fixture（預期觸發；本系列新增）| **4** | **2** |
| **合計** | **13** | **7** |

### 3.3 +4 warnings 屬 fixture 預期變動，**非 regression**

baseline 變化：`0 error / 9 warning on 5 post(s)`（Phase 8-g-2-d-e-c 前）→ **`0 error / 13 warning on 7 post(s)`**（Phase 8-g-2-d-e-c 後）。

+4 warning 來源（每篇 fixture 各觸發 2 條）：

| 來源檔案 | Warning 1 | Warning 2 |
| --- | --- | --- |
| `_test-series-dup-a.md` | `series-id-not-in-settings` | `series-number-duplicate` |
| `_test-series-dup-b.md` | `series-id-not-in-settings` | `series-number-duplicate` |

**屬預期結果之理由**（per `docs/phase-8g-2-d-completion-report.md` §4.3）：

1. fixture 設計刻意觸發新規則（per Phase 8-g-2-d-e-c batch spec）。
2. series.id `_test-series-dup` 不在 `content/settings/series.json` 中（settings 維持 `{"series":[]}`，避免污染作者實際 series namespace）→ `series-id-not-in-settings` 必觸發（預期）。
3. 兩篇 fixture 共用 series.id + series.number → `series-number-duplicate` 必觸發（預期）。
4. 兩條 warning 屬獨立面向之設計（settings 配置 vs. 文章編號規劃；per `docs/series-schema.md` §21.3）；刻意共存。
5. fixture 之 frontmatter（`contentKind` / `category` / `tags` / `cover` / `description` / body 不以 `#` 開頭）皆完整對齊，未觸發其他 noise warning。

baseline 變動於 `docs/phase-8g-2-d-completion-report.md` §4 已詳細記錄並標示為「**預期變動，非 regression**」；本報告再次確認此判定。

### 3.4 build / dist baseline

| 工具 | baseline | 狀態 |
| --- | --- | --- |
| `npm run build:github` 輸出 | byte-identical | ❌ Phase 8-g 全程不變 |
| `npm run build:blogger` 輸出 | byte-identical | ❌ Phase 8-g 全程不變 |
| `npm run build:promotion` 輸出 | byte-identical | ❌ Phase 8-g 全程不變 |
| `npm run build:sitemap` 輸出 | byte-identical | ❌ Phase 8-g 全程不變 |
| `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | byte-identical | ❌ Phase 8-g 全程不變 |
| `package.json` | byte-identical | ❌ Phase 8-g 全程未新增 npm script / 外部相依 |

Phase 8-g 之所有實作（new-post.js / suggest-series-number.js / validate-content.js 4 條新規則 / 2 篇 validation-fixtures）皆**未接 build pipeline**：

- new-post.js / suggest-series-number.js → 純作者工具層；不在 `build:*` 流程
- validate-content.js → 純檢查工具；不在 `build:*` 流程；exit code 不被任何 build script 依賴
- validation-fixtures → 位於 `content/validation-fixtures/`；不被任何 `build:*` 掃到

---

## §4 deferred 狀態：Phase 8-g-1 fixture / sample end-to-end 驗證

**狀態**：`deferred`（沿用 Phase 8-g-0-b 與 `docs/phase-8g-candidate-analysis.md` §5 之決策；**本批不變動此狀態**）

### 4.1 暫不執行理由（沿用既有決策）

1. ready fixture 會進入正式 `dist/` / `sitemap.xml` / `dist-promotion/` baseline。
2. 若未來不小心部署，`_sample-` 內容可能對外可見。
3. 本系統第一版無 noindex / staging dist 機制可隔離 fixture。
4. 已完成 Phase 8-f / 8-g-2 / 8-g-2-d 系列；目前不是非做 fixture 不可。
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

兩者**設計上互不影響**；Phase 8-g-2-d-e-c 之 fixture 落地**不解封** Phase 8-g-1 之 deferred 狀態。

---

## §5 尚未處理候選清單

per `docs/phase-8g-candidate-analysis.md` §6 + `docs/future-roadmap.md` §5：

### 5.1 candidate（不影響 dist；可優先排程）

| # | 候選 | 性質 | 影響 dist | 備註 |
|---|---|---|---|---|
| C | docs cross-link 補強 | 純文件 | ❌ | `phase-8b/c/d/e/f-completion-report.md` 互鏈完整性盤點 |

### 5.2 candidate（會影響 dist / settings / reports baseline；需獨立讀取分析批次）

| # | 候選 | 性質 | 影響面 | 備註 |
|---|---|---|---|---|
| 1（剩餘）| series report（`dist-reports/series.txt`）| 報表延伸 | `dist-reports/` | 與 `series-number-duplicate` 配套之報表 |
| 5 | site default hashtags | settings fallback chain | promotion baseline | hashtags fallback chain 上游補強 |
| 6 | 系列首篇 `.fb.md` hashtags fallback | normalize-post-output 改 | promotion baseline | 前篇延續策略 |
| 7 | Blogger tags inheritance | normalize / publish.json | blogger meta baseline | 與 FB hashtags 平行設計（注意格式分離原則，per `docs/fb-sidecar-schema.md` §12.3.1）|
| — | 兩篇 sample post H1 + deprecated `type` 對齊 | sample 修正 | dist baseline | 修後 validate baseline 可收斂至 `0 error / 9 warning / 7 posts`（僅 fixture 殘留）|

### 5.3 not recommended（既有保守決策；如未來改變需另開規格）

| # | 候選 | 性質 | 理由 |
|---|---|---|---|
| 4 | FB `.txt` 顯示 `titleEn` / `seriesResolvedTitle` | customer-facing | FB 字長受限；per Phase 8-f-6-a 既有保守決策 |
| 8 | H1 接 series `titleTemplate` | customer-facing | SEO 風險 / 字長風險；per Phase 8-f-5-c §17.3 既有保守決策 |

### 5.4 deferred

| # | 候選 | 性質 | 觸發條件 |
|---|---|---|---|
| E / 8-g-1 | fixture / sample end-to-end 驗證 | 測試資產 | 詳見 §4 |

### 5.5 future candidate（per `docs/phase-8g-2-d-completion-report.md` §8.4）

- 升級任一 series warning 為 error：違反 Phase 8-g-2-d 系列 warning-only 保守路線；不建議
- 跨 status 之 duplicate 檢查（含 drafts）：需擴充 `load-posts.js`；與既有 series 規則範圍分歧
- `titleTemplate unresolved` 升級為 user-visible warning（per `docs/series-schema.md` §15.4.2）：屬 Phase 8-f-7 之 helper-internal warnings 升級候選

---

## §6 下一步建議拆批順序

### 6.1 低風險優先（不影響 dist；可立刻安排）

1. **候選 C：docs cross-link 補強** — 純文件批次；先盤點 `phase-8b/c/d/e/f-completion-report.md` 互鏈完整性，再個別 docs commit。可單獨成批，無前置依賴。

### 6.2 需要人工決策（先讀取分析批次，不直接實作）

2. **候選 5 / 6 / 7（site default hashtags / 首篇 fallback / Blogger tags inheritance）**：三者皆會動 normalize 或 settings；建議**分別**做讀取分析批次（無 commit），評估 fallback chain 上下游與 promotion / blogger meta baseline 影響後，再決定是否進實作。**不混批**。
3. **兩篇 sample post H1 + deprecated `type` 對齊**：屬「修正既有 4 條 noise warning」候選；修兩篇正式 sample 會改 `dist` baseline，建議先讀取分析，並同步檢視 `content/templates/*` 模板是否需要對齊。
4. **series report（`dist-reports/series.txt`）**：reports 補強；build pipeline 改動屬中等規模；建議獨立讀取分析。

### 6.3 建議暫緩

- **Phase 8-g-1 fixture / sample end-to-end**：deferred 條件未滿足（無 noindex / staging dist 機制；作者尚未建立首篇正式系列文章）。
- **候選 4 / 8（customer-facing 系列輸出）**：`not recommended`；per Phase 8-f-5-c §17.3 / 8-f-6-a 既有保守決策；如未來改變需另開規格。

### 6.4 起手批次節奏建議

per `docs/future-roadmap.md` §5.3：每個候選首批應為**純讀取分析 + docs**，不直接修改 JS / EJS / settings；確認方向後再進入實作批次。本原則 Phase 8-g 全程沿用，建議下一階段仍維持。

---

## §7 不變項 / 安全邊界

### 7.1 本批（Phase 8-g-3）明確未修改之範圍

| 範圍 | 狀態 |
|---|---|
| `src/scripts/*` | ❌ 未修改 |
| `src/views/*` / `src/styles/*` / `src/js/*` | ❌ 未修改 |
| `content/blogger/posts/*` / `content/github/posts/*` | ❌ 未修改 |
| `content/blogger/pages/*` / `content/github/pages/*` | ❌ 未修改 |
| 任何 `.publish.json` / `.fb.md` sidecar | ❌ 未修改 |
| `content/settings/*`（含 `series.json` 維持 `{"series":[]}`）| ❌ 未修改 |
| `content/templates/*` | ❌ 未修改 |
| `content/validation-fixtures/*` | ❌ 未修改（未新增 fixture）|
| `content/drafts/` / `content/archive/` | ❌ 未修改（皆空目錄）|
| `package.json` | ❌ 未修改（無新增 npm script / 外部相依）|
| 任何 EJS / SCSS | ❌ 未修改 |
| `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | ❌ 未修改（未執行 build）|
| 既有 phase completion reports（`phase-8b/c/d/e/f-completion-report.md`）| ❌ 未修改（frozen）|
| `docs/phase-8g-2-completion-report.md` | ❌ 未修改（frozen）|
| `docs/phase-8g-2-d-completion-report.md` | ❌ 未修改（frozen）|
| `docs/phase-8g-candidate-analysis.md` | ❌ 未修改（本批不需要重寫候選分析）|
| `docs/series-schema.md` | ❌ 未修改 |

### 7.2 本批明確未引入之機制

- ❌ 新 fixture（未動 `content/validation-fixtures/`）
- ❌ 新 validate 規則（未動 `src/scripts/validate-content.js`）
- ❌ baseline 變動（validate / build / dist baseline 皆不變）
- ❌ 新 npm script 或外部相依
- ❌ Phase 8-g-1 fixture deferred 解封（仍 `deferred`）

### 7.3 git 操作確認

| 項目 | 狀態 |
|---|---|
| `git status` | clean（working tree 無 modified / untracked / deleted；僅 `.gitignore` 包含之 `dist*` / `node_modules` / `.cache` 屬產物）|
| `git remote` | **未設定**（本批未設 remote）|
| `git push` | **未執行** |
| `git commit --amend` | **未執行**（本批不 amend 既有 commit；新增 commit 待作者批准後另行建立）|
| 本批 commit | **未 commit**（待作者批准）|

---

## §8 Cross-links

### 8.1 Phase 8-g 內部紀錄

- `docs/phase-8g-candidate-analysis.md`（Phase 8-g-0-b 候選分析；§6 候選清單 / §10 Phase 8-g-2 落地紀錄 / §11 Phase 8-g-2-d 落地紀錄）
- `docs/phase-8g-2-completion-report.md`（Phase 8-g-2 new-post.js prompt 系列收尾報告）
- `docs/phase-8g-2-d-completion-report.md`（Phase 8-g-2-d validate-content series warning 規則收尾報告）

### 8.2 既有 Phase 收尾紀錄（背景）

- `docs/phase-8b-completion-report.md`
- `docs/phase-8c-completion-report.md`
- `docs/phase-8d-completion-report.md`
- `docs/phase-8e-completion-report.md`
- `docs/phase-8f-completion-report.md`

### 8.3 規格與設計文件

- `docs/series-schema.md`（series metadata schema；§5 auto-suggest / §20 Phase 8-g-2 落地 / §21 Phase 8-g-2-d 落地）
- `docs/promotion-export.md`（promotion manifest §10 4 個 additive 欄位）
- `docs/fb-sidecar-schema.md`（§12.3.1 Blogger tags / FB hashtags 格式分離原則）
- `docs/publish-bundle.md` / `docs/publish-json-schema.md`（sidecar bundle / publish.json schema）
- `docs/migration-from-frontmatter.md`（既有 frontmatter 遷移指南）

### 8.4 Roadmap

- `docs/future-roadmap.md` §2（Phase 8 系列進度）/ §3（Phase 8-g 子批次進度）/ §5（下一步候選）

---

（本文件結束）
