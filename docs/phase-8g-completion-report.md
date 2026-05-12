# Phase 8-g Completion Report — overall

> 批次系列：Phase 8-g-0 系列 + Phase 8-g-2 系列 + Phase 8-g-2-d 系列 + Phase 8-g-3 + Phase 8-g-4 系列 + Phase 8-g-5 + Phase 8-g-6 + Phase 8-g-7 ~ 8-g-10（sample/template/roadmap sync）+ Phase 8-g-11（fb-sidecar §5.2.6 讀取分析；維持保守）+ Phase 8-g-12 系列（`series-title-unresolved` warning + fixture + docs sync）+ Phase 8-g-13 / 8-g-14 / 8-g-15（publish-bundle §7 對齊讀取分析 + 實作 + docs sync）+ Phase 8-g-16（剩餘項目短盤點）+ Phase 8-g-17 系列（series report 讀取分析 + 實作 + docs sync）+ Phase 8-g-18 系列（candidate 7 Blogger tags inheritance：docs spec + normalize data-layer + build-blogger 接入）+ 本批（Phase 8-g-18-e docs sync）
> 範圍：Phase 8-g 整體統整收尾報告；含 Phase 8-g-18 candidate 7 Blogger tags inheritance 三段落地後之 docs sync；本批僅修改 `docs/future-roadmap.md` / `docs/phase-8g-completion-report.md`
> 起點 HEAD：`b1679d1`（Phase 8-f-8-b completion report）
> 終點 HEAD：`a66da18`（Phase 8-g-18-d `build-blogger.js` 接入 `normalized.publish.blogger.tags`；本批前 HEAD）
> Phase 8-g 已落地 commits：**35**（不含本批；含 Phase 8-g-3 `c3b6c63` + Phase 8-g-4 系列 4 commits + Phase 8-g-5 `44c0e8f` + Phase 8-g-6 `5976162` + Phase 8-g-7 `a9db65b` + Phase 8-g-8 `38a0007` + Phase 8-g-9 `ffa0310` + Phase 8-g-10 `be4304f` + Phase 8-g-12 系列 3 commits + Phase 8-g-14 `108de25` + Phase 8-g-15 `d81e515` + Phase 8-g-17-b `f21da58` + Phase 8-g-17-c `e5f1520` + Phase 8-g-18-b `15c8252` + Phase 8-g-18-c `48b90af` + Phase 8-g-18-d `a66da18` + Phase 8-g-0 系列 2 commits + Phase 8-g-2 系列 6 commits + Phase 8-g-2-d 系列 7 commits）
> `dist` / `dist-blogger` / `dist-promotion` baseline：**主軸 byte-identical**；Phase 8-g-5 sample posts 對齊**間接**影響 2 個 `dist/posts/{slug}/index.html`；其餘批次（含 Phase 8-g-12 / 14 / 17 / 18）皆不影響 dist baseline；Phase 8-g-18-d 之 `build-blogger.js` 接入對既有無 `series.tags` 之 posts 之 `dist-blogger/posts/{slug}/meta.json` 為 byte-identical（normalized 路徑與 legacy `post.tags` 路徑回傳相同陣列）
> `dist-reports` 新增產物：`series-report.txt` + `series-report.json`（Phase 8-g-17-b 之 `npm run report:series` 產出；屬 `.gitignore` 範圍；不算 git baseline）
> `npm run validate:content` baseline：**`0 error / 11 warning on 6 post(s)`**（per Phase 8-g-12-c fixture 落地；Phase 8-g-13 ~ 8-g-18 各批 docs-only / normalize / build-blogger，baseline 不變）
> git status：clean（working tree 無 modified / untracked / deleted；本批 commit 後仍 clean）
> 未 push、未設 remote、未 amend（per Phase 8-g 起手批次規範；既有 35 個 commits 皆為新建，未 amend / rebase）

---

## §1 本階段目的

Phase 8-g 之核心目的：

1. **候選排程**：在 Phase 8-f 完成後，對「驗證 / 工具 / 報表 / docs」層之候選做風險分析與狀態排程（9 項數字候選 + 候選 C / S/T / F / G / H；含 `candidate` / `landed` / `partially landed` / `deferred` / `not recommended` 五種狀態；詳見 `docs/phase-8g-candidate-analysis.md` §6 + 本文件 §3.1）。
2. **作者工具落地**：完成不影響 dist baseline 之候選 #2（new-post.js series 欄位提示）與候選 #3（series number gap filling），共 4 commits + 1 docs commit（Phase 8-g-2 系列）。
3. **validate 規則補強**：補完 series metadata 之 validate-content 規則覆蓋（4 條新 warning + 2 篇 validation-fixtures），共 6 commits + 1 docs commit + 1 報告 commit（Phase 8-g-2-d 系列）。
4. **fixture deferred 維持**：保留 fixture / sample end-to-end 驗證（候選 E / Phase 8-g-1）於 deferred 狀態，待部署隔離機制就緒；本階段**不執行**。
5. **不擴大 customer-facing surface**：不進入 H1 接 `series.titleTemplate` / FB `.txt` 顯示 `titleEn` / publish-checklist 顯示組合標題等接入（屬 `not recommended`；per Phase 8-f-5-c §17.3 / 8-f-6-a 既有保守決策）。
6. **文件 cross-link 補強落地（候選 C）**：完成 §5.1 必要補強（schema docs → phase reports cross-link，3 檔）+ §5.2.1~5 可選後向 link（phase reports 8-b ~ 8-f 各補 1 行，5 檔）；§5.2.6（`fb-sidecar-schema.md`）依保守決策保留未補（Phase 8-g-11 讀取分析後維持決策；屬可選；無功能影響）。
7. **sample / template 層 deprecated cleanup 落地（Phase 8-g-5 / 8-g-6）**：完成 2 篇 sample posts + 5 個 templates 之 `type` → `contentKind` + body leading H1 移除；**僅清理 sample/template 來源層**；source code 層 legacy fallback 退場仍屬 Phase 8-h 或更晚。
8. **`series-title-unresolved` warning 規則 + fixture 落地（Phase 8-g-12）**：升級 `titleTemplate` 之 unresolved placeholders 偵測為 `validate-content` user-visible warning；commits `a73c064` / `78d1f30` / `662bcdf`；baseline `0/9/5` → `0/11/6`。
9. **`publish-bundle.md` §7 過時描述對齊（Phase 8-g-13 / 8-g-14 / 8-g-15）**：採「保留歷史脈絡 + 補述實際落地」pattern 將 §7.4-§7.7 對齊實際 Phase 8-d/e/f/g landings；commits `108de25` / `d81e515`；明示 Phase 8-g overall 仍 🔄 進行中、相容層退場屬 Phase 8-h。
10. **series report script 落地（Phase 8-g-17）**：新增 `src/scripts/report-series.js`（commit `f21da58`）+ `package.json` 加 `npm run report:series`；產出 `dist-reports/series-report.{txt,json}`（ignored 產物）；採 `fast-glob` + `gray-matter` 直接掃描（含 draft + ready + published；排除 archived + validation-fixtures）；依 series.id 分群並標示 missing / duplicate / unresolved。**屬 visibility / dump channel**（不是 validate channel）：不新增 warning / error；不影響 validate exit code；不阻擋 build；不接 `build:*`。與既有 validate-content series warnings（`series-number-duplicate` / `series-title-unresolved`）形成 **dual-channel**（warning：ready/published only；report：含 drafts）。Phase 8-g-17-c docs sync（commit `e5f1520`）將上述反映於 `docs/future-roadmap.md` + 本文件。
11. **candidate 7 Blogger tags inheritance 落地（Phase 8-g-18 系列）**：補完 series metadata 至 Blogger `post.tags` 之繼承鏈，3 段落地：
    - **8-g-18-b**（commit `15c8252`；`docs/series-schema.md` +141 / −1）：新增 §22 規格化 **`series.tags`** 短 slug 陣列欄位（**不含 `#`**；per §22.2）；於 §19.7 將原 future-candidate bullet 標 strikethrough 並指向 §22；§22.5 明示 **`series.tags` 與 `series.hashtags` 嚴格分離原則**（兩者不互通；服務對象不同；格式不同；實作不得做格式轉換互用）；§22.6 標明不放 `.publish.json` / `.fb.md` / 不新增 validate rule / 本批不接 build pipeline 之 scope 邊界
    - **8-g-18-c**（commit `48b90af`；`src/scripts/normalize-post-output.js` +53 / 0）：normalize 接入 `series.tags` 解析（mirror Phase 8-f-7-b `series.hashtags` backfill pattern）+ 寫入 `normalized.publish.blogger.tags`；fallback chain：`post.tags` (non-empty) → `seriesOut.tags` (non-empty) → `[]`；**不影響 `promotion.facebook.hashtags`**（per §22.5 分離原則；本欄不讀 `series.hashtags`）
    - **8-g-18-d**（commit `a66da18`；`src/scripts/build-blogger.js` +16 / −1）：`buildMeta()` 之 `tags` 欄位來源由 `post.tags` 改為「`normalized.publish.blogger.tags` 優先 + legacy `post.tags` fallback」；mirror Phase 8-d normalized-priority pattern；**保留 legacy `post.tags` fallback**（per Phase 8-g-18-d 特別禁止 13：不退場相容層）；既有無 `series.tags` 之 posts 之 `dist-blogger/posts/{slug}/meta.json` byte-identical
    - **未影響 dist / validate baseline**：validate 仍 `0/11/6`；既有無 series posts 之 Blogger meta byte-identical
    - 本批 Phase 8-g-18-e docs sync 將上述反映於 `docs/future-roadmap.md` + 本文件

Phase 8-g 與既有 Phase 8-f 之分工：

- **Phase 8-f**：series metadata 之 build pipeline 接入（資料層 + 既有 customer-facing surface）
- **Phase 8-g**：基於 Phase 8-f 既有資料層之「工具 / 驗證 / 報表 / docs cross-link / sample-template cleanup / titleTemplate validate 升級 / schema 規格 prose 對齊 / series report / Blogger tags inheritance」延伸 + 候選排程 — 屬「不擴大 customer-facing surface」之保守延伸。

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
| 8-g-11 | （無 commit）| 對話內 | fb-sidecar §5.2.6 補連 8-c / 8-e phase report 讀取分析；維持 Phase 8-g-4-c 保守決策 |

### 2.9 Phase 8-g-12 系列（`series-title-unresolved` warning + fixture + docs sync）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-12-a | （無 commit）| 對話內 | `titleTemplate unresolved` 升級為 user-visible warning 讀取分析 |
| 8-g-12-b | `a73c064` | feat | add series-title-unresolved warning to validate-content |
| 8-g-12-c | `78d1f30` | test | add series-title-unresolved validation fixture |
| 8-g-12-d | `662bcdf` | docs | sync docs with series-title-unresolved landing |

### 2.10 Phase 8-g-13 / 8-g-14 / 8-g-15 系列（publish-bundle §7 過時描述對齊）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-13 | （無 commit）| 對話內 | publish-bundle §7.5-§7.7 過時描述對齊讀取分析；推薦選項 B（保留歷史脈絡 + 補述實際落地）|
| 8-g-14 | `108de25` | docs | sync §7.4-§7.7 with actual Phase 8-d/e/f/g landings（`docs/publish-bundle.md` +57 / −4）|
| 8-g-15 | `d81e515` | docs | sync future-roadmap and overall report with publish-bundle §7 alignment |

### 2.11 Phase 8-g-16（剩餘項目短盤點）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-16 | （無 commit）| 對話內 | Phase 8-g 剩餘項目短盤點；確認 4 項已完成 + 9 項仍 pending；推薦 Top 3：B-剩餘 series report > candidate 7 > candidate 5/6 |

### 2.12 Phase 8-g-17 系列（series report script + docs sync）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-17-a | （無 commit）| 對話內 | B-剩餘 series report 讀取分析；確認 dual-output / 獨立 npm script / 含 drafts 排除 archived & fixtures / dual-channel 與 validate warnings 設計 |
| 8-g-17-b | `f21da58` | feat | add series report script（`src/scripts/report-series.js` + `package.json` 加 `report:series`；2 檔 +457 / −0；採 `fast-glob` + `gray-matter` 直接掃描；輸出 `dist-reports/series-report.{txt,json}` ignored 產物）|

### 2.13 Phase 8-g-17-c（docs sync series report landing）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-17-c | `e5f1520` | docs | sync docs with series report landing |

### 2.14 Phase 8-g-18 系列（candidate 7 Blogger tags inheritance）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-18-a | （無 commit）| 對話內 | candidate 7 Blogger tags inheritance 讀取分析；確認三段式拆批（docs spec → normalize data-layer → build-blogger 接入 → docs sync）|
| 8-g-18-b | `15c8252` | docs | add series.tags spec for Blogger tags inheritance（`docs/series-schema.md` §22 新節 + §19.7 strikethrough；+141 / −1；定義短 slug 陣列；不含 `#`；與 `series.hashtags` 嚴格分離）|
| 8-g-18-c | `48b90af` | feat | normalize series tags for Blogger inheritance（`src/scripts/normalize-post-output.js` +53；series.tags 解析 + 寫入 `normalized.publish.blogger.tags`；fallback chain：post.tags → series.tags → []）|
| 8-g-18-d | `a66da18` | feat | wire normalized blogger tags into build-blogger（`src/scripts/build-blogger.js` +16 / −1；`buildMeta()` 改為 normalized 優先 + legacy `post.tags` fallback；保留 legacy fallback；既有無 series posts byte-identical）|

### 2.15 本批（Phase 8-g-18-e docs sync）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-18-e | （未 commit；待批准）| docs | sync docs with series.tags inheritance landing |

### 2.16 合計

- **Phase 8-g 已落地 commits：35**（不含本批）
  - Phase 8-g-0 系列：2
  - Phase 8-g-2 系列：6
  - Phase 8-g-2-d 系列：7
  - Phase 8-g-3：1
  - Phase 8-g-4 系列：4
  - Phase 8-g-5：1
  - Phase 8-g-6：1
  - Phase 8-g-7：1
  - Phase 8-g-8：1
  - Phase 8-g-9：1
  - Phase 8-g-10：1
  - Phase 8-g-12 系列：3
  - Phase 8-g-14：1
  - Phase 8-g-15：1
  - Phase 8-g-17-b：1
  - Phase 8-g-17-c：1
  - Phase 8-g-18-b：1
  - Phase 8-g-18-c：1
  - Phase 8-g-18-d：1
- 對話內讀取分析批次（無 commit）：**14**（8-g-0-a / 8-g-0-d / 8-g-2-c-a / 8-g-2-d-a / 8-g-2-d-e-a / 8-g-4-a / 8-g-5-a / 8-g-6-a / 8-g-11 / 8-g-12-a / 8-g-13 / 8-g-16 / 8-g-17-a / 8-g-18-a）
- 本批新增 commit：**1**（待作者批准）

---

## §3 功能完成摘要

### 3.1 候選清單最終狀態

per `docs/phase-8g-candidate-analysis.md` §6 + 各 Phase 8-g 子批次落地：

| # | 候選 | 狀態 | 落地批次 / 備註 |
|---|---|---|---|
| **1** | **validation / report 補強** | ✅ **`landed`**（**Phase 8-g-17-b 後完整收尾**）| 3 個子議題皆已落地：<br>① 4 條 series structure warning（Phase 8-g-2-d-b/c/d/e-b）<br>② series-title-unresolved warning（Phase 8-g-12-b/c；candidate F）<br>③ series report `dist-reports/series-report.{txt,json}`（Phase 8-g-17-b；candidate H）|
| 2 | `new-post.js` series 欄位提示 | ✅ `landed` | Phase 8-g-2-b1 / b2 / c-c 落地 |
| 3 | series number gap filling 規則 | ✅ `landed` | Phase 8-g-2-c-b / c-c 落地（stderr-only 保守路線）|
| 4 | FB `.txt` 顯示 `titleEn` / `seriesResolvedTitle` | `not recommended` | per Phase 8-f-6-a 既有保守決策（FB 字長受限）|
| 5 | site default hashtags | `candidate` | 未進讀取分析 |
| 6 | first article `.fb.md` hashtags fallback | `candidate` | 未進讀取分析 |
| **7** | **Blogger tags inheritance（`series.tags` 繼承為 Blogger `post.tags`）** | ✅ **`landed`** | Phase 8-g-18 系列落地（3 commits）；詳見 §3.12：<br>① `docs/series-schema.md` §22：`series.tags` 短 slug 規格化（commit `15c8252`）<br>② `src/scripts/normalize-post-output.js`：寫入 `normalized.publish.blogger.tags`（commit `48b90af`）<br>③ `src/scripts/build-blogger.js`：normalized 優先 + legacy `post.tags` fallback（commit `a66da18`）|
| 8 | H1 接 series `titleTemplate` | `not recommended` | per Phase 8-f-5-c §17.3 既有保守決策（SEO 風險 / 字長風險）|
| C | docs cross-link 補強 | ✅ `landed` | Phase 8-g-4-b / 4-c 落地；§5.2.6 `fb-sidecar-schema.md` 經 Phase 8-g-11 維持保守 |
| S/T | sample / template alignment | ✅ `landed` | Phase 8-g-5 / 8-g-6 落地 |
| F | `titleTemplate unresolved` 升級為 validate-content user-visible warning | ✅ `landed` | Phase 8-g-12-b/c/d 落地（屬 candidate 1 之 sub-item）|
| G | `publish-bundle.md` §7.4-§7.7 過時描述對齊 | ✅ `landed` | Phase 8-g-13 / 14 / 15 落地 |
| **H** | **series report `dist-reports/series-report.{txt,json}`** | ✅ **`landed`** | Phase 8-g-17-b（commit `f21da58`）落地；屬 candidate 1 之最後一片；詳見 §3.11 |
| E | fixture / sample end-to-end 驗證 | `deferred` | 屬 Phase 8-g-1；詳見 §4 |

### 3.2 validate baseline 現況

`npm run validate:content` baseline：**`0 error / 11 warning on 6 post(s)`**（per Phase 8-g-12-c fixture 落地之預期變動；Phase 8-g-13 ~ 8-g-17 各批 docs-only 或 reports-only，baseline 不變）。

11 warnings 全為 6 篇 validation fixtures 之自證資產（無正式 sample post noise）。

### 3.3 baseline 變化軌跡

| 階段 | baseline |
|---|---|
| Phase 8-g-2-d-e-c 前 | `0/9/5` |
| Phase 8-g-2-d-e-c 後 | `0/13/7`（+4/+2；fixture 預期）|
| Phase 8-g-5 後 | `0/9/5`（−4/−2；sample noise 清除）|
| Phase 8-g-12-c 後 | **`0/11/6`**（+2/+1；fixture 預期；當前值）|
| Phase 8-g-12-d ~ 8-g-17-c | 不變（docs-only / reports-only）|

### 3.4 build / dist baseline

| 工具 | baseline |
| --- | --- |
| `npm run build:github` 輸出 | **主軸不變**；2 個 GitHub post detail 變動（Phase 8-g-5 sample alignment 間接影響）|
| `npm run build:blogger` 輸出 | **主軸 byte-identical** |
| `npm run build:promotion` 輸出 | byte-identical |
| `npm run build:sitemap` 輸出 | byte-identical |
| `dist-reports/*`（既有 reports）| byte-identical |
| `dist-reports/series-report.{txt,json}` | **新增**（Phase 8-g-17-b 之 `npm run report:series` 產出；屬 `.gitignore` 範圍；不算 git baseline）|
| `package.json` | **新增 1 行**：`"report:series": "node src/scripts/report-series.js"`（Phase 8-g-17-b；commit `f21da58`）|

### 3.5 ~ 3.10 既有子批次落地紀錄（保留簡明摘要）

per 既有結構（不重述）：

- §3.5：Phase 8-g-4 系列（候選 C cross-link 補強；4 commits + 1 讀取分析）
- §3.6：Phase 8-g-5 系列（sample post 對齊；`44c0e8f`；baseline `0/13/7` → `0/9/5`；2 dist 檔變動）
- §3.7：Phase 8-g-6 系列（content/templates 對齊；`5976162`；baseline 維持 `0/9/5`；不影響 dist）
- §3.8：Phase 8-g-7 / 8-g-8 / 8-g-9 / 8-g-10（sync 與 self-reference 修正）
- §3.9：Phase 8-g-12 系列（`series-title-unresolved` warning + fixture + docs sync；3 commits）
- §3.10：Phase 8-g-13 / 14 / 15（publish-bundle §7 過時描述對齊；採「保留歷史脈絡 + 補述實際落地」pattern；2 commits）
- §3.12：Phase 8-g-18 系列（candidate 7 Blogger tags inheritance：docs spec + normalize + build-blogger；3 commits）

詳細紀錄詳見各 commit message + cross-link 至對應 phase report。

### 3.11 Phase 8-g-17 系列：series report script 落地紀錄

Phase 8-g-17 將 candidate 1（validation / report 補強）之**最後一片**「series report」落地。3 個 sub-batches（含本批）：

| 子批次 | Commit | 摘要 |
|---|---|---|
| 8-g-17-a | （無 commit）| 讀取分析；確認 dual-output / 獨立 npm script / 範圍含 drafts / 與 validate warnings 之 dual-channel 設計 |
| 8-g-17-b | `f21da58` | 落地：新增 `src/scripts/report-series.js`（456 行）+ `package.json` 加 `report:series`；採 `fast-glob` + `gray-matter` 直接掃描（同 Phase 8-g-2-c-b suggest-series-number.js pattern）|
| 8-g-17-c | （本批；未 commit）| docs sync |

#### 3.11.1 script 設計重點

| 維度 | 設計 |
|---|---|
| 檔案 | `src/scripts/report-series.js`（沿用 `report-*.js` sub-report 命名；非 aggregator）|
| API | `generateSeriesReport({ writeFiles = true } = {})` → `{ data, txt }`（可被 aggregator import；本批不接 `export-build-report.js`）|
| CLI | `if (isMain) await generateSeriesReport()` |
| 資料載入 | **直接 `fast-glob` + `gray-matter`**（不經 `loadPosts`，因 loadPosts 預設過濾 drafts）|
| 設定載入 | `loadSettings()` |
| placeholder 解析 | `resolveTitleTemplate` from `resolve-series-title.js`（Phase 8-f-4-b helper；沿用 + 不修改）|
| 掃描範圍 | `content/github/posts/**/*.md` + `content/blogger/posts/**/*.md`（fixtures / templates / pages 自然排除）|
| 狀態過濾 | `INCLUDED_STATUS = { 'draft', 'ready', 'published' }`；`archived` 排除 |
| series 解析 | 內建 minimal `resolveSeriesEntry`（合併 frontmatter + settings.series[id]；對齊 normalize-post-output §15.3 但不 import）|
| hashtags chain | `frontmatter.promotion.facebook.hashtags > series.hashtags > []`（簡化版；不讀 `.fb.md` sidecar）|
| 排序 | series.id → series.number → publishedAt → date → sourcePath |
| 跨文章標示 | `postsLength` / `numberSequence` / `missingNumbers` / `duplicateNumbers` / `hasUnresolvedPlaceholders` |
| 輸出 | dual-output `dist-reports/series-report.{json,txt}`（JSON 2-space indent + `\n`；TXT 區塊式人類可讀）|

#### 3.11.2 與 validate-content series warnings 之 dual-channel

| 維度 | validate-content warnings | series report |
|---|---|---|
| 觸發 | `npm run validate:content`（CI / pre-commit）| `npm run report:series`（按需手動）|
| 範圍 | ready / published only | **all status**（含 drafts；排除 archive）|
| 行為 | 即時 warn + exit code | 完整 dump + 不影響 exit |
| 阻擋 build？ | ❌ | ❌ |

兩 channel **互補非衝突**（per series-schema §15.4.3 之既有獨立面向設計）；series report **不重複觸發 warning**（屬視覺化呈現）。

#### 3.11.3 對 dist / build / validate 之影響

| 影響面 | 變動？ |
|---|---|
| `npm run validate:content` baseline | ❌ 不變（仍 `0/11/6`；series report 不在 validate scan path）|
| `npm run build:*` 輸出 | ❌ 不變 |
| `dist` / `dist-blogger` / `dist-promotion` baseline | ❌ 不變 |
| `dist-reports/series-report.{txt,json}` | ✅ 新增（執行 `npm run report:series` 後產出；屬 ignored 產物）|
| `package.json` | ✅ +1 行（`"report:series"` script）|
| 既有 6 reports / `export-build-report.js` aggregator | ❌ 不變（本批未補 aggregator；屬可選後續批次）|

#### 3.11.4 未來可選補強（不在本批 scope）

- aggregator 補強：`export-build-report.js` 加 series sub-summary（如 series 總數 / 有 unresolved 之 series 數量；屬 nice-to-have）
- sidecar 讀取：series report 之 `publishedAt` / `publishedUrl` 目前僅讀 frontmatter；可擴讀 `.publish.json` sidecar 以提供更精準資訊
- `series-schema.md` 新節記錄 series report 規格（dual-channel 設計、欄位定義、排序規則）

### 3.12 Phase 8-g-18 系列：candidate 7 Blogger tags inheritance 落地紀錄

Phase 8-g-18 將原 §3.1 candidate 7（Blogger tags inheritance）由 `candidate` 改為 ✅ `landed`。4 個 sub-batches（1 讀取分析 + 3 實作 + 本批 docs sync）：

| 子批次 | Commit | 摘要 |
|---|---|---|
| 8-g-18-a | （無 commit）| 讀取分析；確認三段式拆批（docs spec → normalize data-layer → build-blogger 接入 → docs sync）|
| 8-g-18-b | `15c8252` | `docs/series-schema.md` §22 新節規格化 `series.tags`（短 slug 陣列；不含 `#`；與 `series.hashtags` 嚴格分離）+ §19.7 strikethrough |
| 8-g-18-c | `48b90af` | `src/scripts/normalize-post-output.js` 接入 `series.tags` 解析 + 寫入 `normalized.publish.blogger.tags`（mirror Phase 8-f-7-b series.hashtags backfill pattern）|
| 8-g-18-d | `a66da18` | `src/scripts/build-blogger.js` `buildMeta()` `tags` 欄位改為 normalized 優先 + legacy `post.tags` fallback（mirror Phase 8-d normalized-priority pattern）|
| 8-g-18-e | （本批；未 commit）| docs sync |

#### 3.12.1 設計重點

| 維度 | 設計 |
|---|---|
| 欄位名稱 | `series.tags`（per `docs/series-schema.md` §22.2）|
| 格式 | **短 slug / tag**（同 `frontmatter.tags`；per §22.2）|
| **是否含 `#`** | ❌ **不含**（per §22.2 / §22.5 表格明列）|
| 服務對象 | Blogger labels / `post.tags`（per §22.5）|
| 集中設定 | `content/settings/series.json` 之 series entry `tags` 欄位 |
| 文章層 override | `frontmatter.series.tags`（per §11.2 hybrid 策略；可選）|
| fallback chain（normalize 寫入 `publish.blogger.tags`）| `post.tags` (non-empty) → `seriesOut.tags` (non-empty) → `[]` |
| fallback chain（build-blogger 讀取）| `normalized.publish.blogger.tags` (non-empty) → legacy `post.tags` → `[]` |
| 不放位置 | ❌ `.publish.json` / ❌ `.fb.md`（per §22.6；屬內容屬性）|
| **與 `series.hashtags` 關係** | ❌ **嚴格分離**（per §22.5）：兩者獨立資料；格式不同（slug vs `#` prefix）；服務對象不同（Blogger labels vs FB hashtags）；實作上**不得做格式轉換互用**；本欄**不讀** `series.hashtags`；`series.hashtags` 亦**不讀**本欄 |
| validate-content 規則 | ❌ **未新增**（per §22.6；`series.tags` 屬選填；空值合理；非陣列亦回退至 empty 不 error / 不 warning）|
| GitHub tags 影響 | ❌ **不接**（per §22.6；GitHub 站之 tag 頁生成沿用 `frontmatter.tags`）|
| FB promotion 影響 | ❌ **不接**（per §22.5 分離原則；FB 端走 `series.hashtags`；本批不動 `normalized.promotion.facebook.hashtags`）|

#### 3.12.2 與 `series.hashtags` inheritance（Phase 8-f-7-b）之分離

| 維度 | `series.tags`（Phase 8-g-18）| `series.hashtags`（Phase 8-f-7-b）|
|---|---|---|
| 服務對象 | Blogger labels | Facebook hashtags |
| 格式 | 短 slug；不含 `#` | `#` prefix |
| 集中設定 | `series.tags` 於 series entry | `series.hashtags` 於 series entry |
| 範例 | `["github", "vite"]` 或 `["AI", "自媒體"]` | `["#GitHub", "#Vite"]` 或 `["#AI", "#自媒體"]` |
| normalize 寫入欄位 | `normalized.publish.blogger.tags` | `normalized.promotion.facebook.hashtags` |
| build 接入 | `build-blogger.js` `buildMeta()` `tags` | `build-promotion-manifest.js` / `facebook-post.ejs` |
| fallback chain 觸發條件 | `post.tags` empty | `.fb.md.hashtags` / legacy `promotion.facebook.hashtags` 皆空 |
| 對應文章層欄位 | `frontmatter.tags` | `frontmatter.promotion.facebook.hashtags` / `.fb.md` |

兩 inheritance 鏈**完全獨立**；本批未引入任何 cross-reference；既有 Phase 8-f-7-b 之 `series.hashtags` backfill 邏輯**完全不變**。

#### 3.12.3 對 dist / build / validate 之影響

| 影響面 | 變動？ |
|---|---|
| `npm run validate:content` baseline | ❌ 不變（仍 `0/11/6`；series.tags 屬選填；未新增 validate 規則）|
| `npm run build:github` 輸出 | ❌ 不變（本批不接 GitHub tags）|
| `npm run build:blogger` 輸出 | ❌ **既有無 `series.tags` 之 posts** byte-identical（normalized 路徑與 legacy `post.tags` 路徑回傳相同陣列；`dist-blogger/posts/{slug}/meta.json` `tags` 欄位內容完全一致）|
| `npm run build:promotion` 輸出 | ❌ 不變（本批不接 promotion；`promotion.facebook.hashtags` 邏輯完全不變）|
| `npm run build:sitemap` 輸出 | ❌ 不變 |
| `dist-reports/*` baseline | ❌ 不變 |
| `package.json` | ❌ 不變 |
| `content/settings/series.json` 既有 `{"series":[]}` | ❌ 不變（`series.tags` 屬選填；既有 empty array 仍 valid）|
| `.publish.json` / `.fb.md` schema | ❌ 不變（per §22.6）|

#### 3.12.4 保守邊界

- ❌ **不退場 legacy `post.tags` fallback**（per Phase 8-g-18-d 特別禁止 13）：`build-blogger.js` 仍保留 `Array.isArray(post.tags) ? post.tags : []` 作為 normalized 缺值之 defensive fallback
- ❌ **不接 GitHub tags inheritance**（per Phase 8-g-18-c / d 特別禁止 2）
- ❌ **不接 promotion / FB sidecar**（per Phase 8-g-18-c / d 特別禁止 3）
- ❌ **不修改 `.publish.json` schema**（per Phase 8-g-18-c / d 特別禁止 4）
- ❌ **不修改 `.fb.md` schema**（per Phase 8-g-18-c / d 特別禁止 5）
- ❌ **不新增 validate rule / fixture / sample**（per Phase 8-g-18-c / d 特別禁止 6 / 7 / 8）
- ❌ **不補 aggregator**（per Phase 8-g-18-c / d 特別禁止 9）
- ❌ **不進 candidate 5 / 6**（per Phase 8-g-18-c / d 特別禁止 10 / 11）
- ❌ **不進 source code fallback 退場**（屬 Phase 8-h 或更晚）

#### 3.12.5 未來可選補強（不在本批 scope）

- candidate 5（site default hashtags）— 未進讀取分析；屬獨立批次
- candidate 6（系列首篇 `.fb.md` hashtags fallback）— 未進讀取分析；屬獨立批次
- 退場 `build-blogger.js` 之 legacy `post.tags` fallback — 屬 Phase 8-h 或更晚（與 `load-posts.js` `contentKind ?? type` / `validate-content.js` `frontmatter-uses-deprecated-type` / `parse-markdown.js` H1 → H2 同屬相容層退場大型工作）
- `series.tags` 接入 GitHub tags inheritance — per §22.6 `series.tags` scope 限於 Blogger；若未來 GitHub 端要做類似繼承，應另設計（如 `series.githubTags` 或共用 `series.tags`）；屬獨立讀取分析批次

---

## §4 deferred 狀態：Phase 8-g-1 fixture / sample end-to-end 驗證

**狀態**：`deferred`（沿用既有決策；**本批不變動**；既有所有落地皆**不解封** Phase 8-g-1 deferred）

per `docs/phase-8g-candidate-analysis.md` §5：觸發條件未滿足（部署隔離 / 作者首篇正式系列文章前 / staging dist 機制）。

### 4.1 暫不執行理由

1. ready fixture 會進入正式 `dist/` / `sitemap.xml` / `dist-promotion/` baseline。
2. 若未來不小心部署，`_sample-` 內容可能對外可見。
3. 本系統第一版無 noindex / staging dist 機制可隔離 fixture。
4. 已完成 Phase 8-f / 8-g-2 ~ 8-g-17 系列；目前不是非做 fixture 不可。

---

## §5 尚未處理候選清單

per `docs/phase-8g-candidate-analysis.md` §6 + `docs/future-roadmap.md` §5：

### 5.1 candidate（不影響 dist；可優先排程）

候選 C / S/T / F / G / H 皆已落地。candidate B（validation / report 補強）已**完整收尾**（candidate 1 ✅ landed）。**本層級當前無待辦項**。

### 5.2 candidate（會影響 dist / settings / reports baseline；需獨立讀取分析批次）

| # | 候選 | 性質 | 影響面 |
|---|---|---|---|
| 5 | site default hashtags | settings fallback chain | promotion baseline |
| 6 | 系列首篇 `.fb.md` hashtags fallback | normalize-post-output 改 | promotion baseline |

> ~~series report `dist-reports/series-report.{txt,json}`~~：✅ 已於 Phase 8-g-17-b 落地（commit `f21da58`）；詳見 §3.11；從本表移除。
> ~~7 Blogger tags inheritance~~：✅ 已於 Phase 8-g-18 系列落地（commits `15c8252` + `48b90af` + `a66da18`）；詳見 §3.12；從本表移除。**`series.tags` 為 Blogger 專用短 slug 欄位（不含 `#`）；與 `series.hashtags`（FB promotion 專用）嚴格分離；legacy `post.tags` fallback 保留**。

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

- 升級任一**結構性** series warning 為 error：不建議
- 跨 status 之 duplicate 檢查（含 drafts）：需擴 `load-posts.js`
- **`docs/fb-sidecar-schema.md` 補連 8-c / 8-e 系列 phase report**：屬 §5.2.6 可選補強；Phase 8-g-4-c / 8-g-11 兩次讀取分析皆依保守決策未執行
- **source code 層 legacy fallback / warning rule / H1 demotion 退場**：屬 Phase 8-h 或更晚（`load-posts.js` `contentKind ?? type` / `validate-content.js` `frontmatter-uses-deprecated-type` / `parse-markdown.js` H1 → H2）
- **`export-build-report.js` aggregator 補 series sub-summary**：屬 nice-to-have；本批 Phase 8-g-17-b 之刻意 scope 邊界；可獨立後續批次
- **`docs/series-schema.md` 新節記錄 series report 規格**：屬 nice-to-have；本批 Phase 8-g-17-c 之刻意 scope 邊界（per spec 不修 series-schema）
- **series report 之 sidecar 讀取**：擴讀 `.publish.json` 以提供更精準 `publishedAt` / `publishedUrl`；屬 nice-to-have

> ~~`docs/publish-bundle.md` §7.5 / §7.6 / §7.7 過時描述對齊~~：✅ 已於 Phase 8-g-13 / 14 落地
> ~~`titleTemplate unresolved` 升級為 user-visible warning~~：✅ 已於 Phase 8-g-12 落地
> ~~series report~~：✅ 已於 Phase 8-g-17-b 落地
> ~~candidate 7 Blogger tags inheritance（`series.tags`）~~：✅ 已於 Phase 8-g-18 系列落地（commits `15c8252` + `48b90af` + `a66da18`）；詳見 §3.12

---

## §6 下一步建議拆批順序

### 6.1 低風險優先（不影響 dist；本層級候選已全數落地）

候選 C / S/T / F / G / H 皆已落地；candidate 1（validation / report 補強）已**完整收尾**。**本層級當前無待辦項**。

### 6.2 建議下一步（先讀取分析批次，不直接實作）

依優先序：

1. **candidate 5 / 6**：建議**分別**做讀取分析批次（不混批）；皆屬會影響 promotion baseline 之 settings / normalize 改動；優先序由作者決定（candidate 7 Blogger tags inheritance 已於 Phase 8-g-18 系列落地；詳見 §3.12）
2. **source code 層 legacy fallback 退場**（Phase 8-h 或更晚）；含 `load-posts.js` `contentKind ?? type` / `validate-content.js` `frontmatter-uses-deprecated-type` / `parse-markdown.js` H1 → H2 / `build-blogger.js` legacy `post.tags` fallback（per §3.12.4 保守邊界）

### 6.3 建議暫緩

- **Phase 8-g-1 fixture / sample end-to-end**：deferred 條件仍未滿足
- **候選 4 / 8（customer-facing 系列輸出）**：`not recommended`

### 6.4 起手批次節奏建議（保留）

per `docs/future-roadmap.md` §5.3：每個候選首批應為**純讀取分析 + docs**。

---

## §7 不變項 / 安全邊界

### 7.1 本批（Phase 8-g-18-e）明確未修改之範圍

| 範圍 | 狀態 |
|---|---|
| `src/scripts/normalize-post-output.js`（Phase 8-g-18-c 對齊對象）| ❌ **本批未修改**（commit `48b90af` 已落地；本批不重觸碰）|
| `src/scripts/build-blogger.js`（Phase 8-g-18-d 對齊對象）| ❌ **本批未修改**（commit `a66da18` 已落地；本批不重觸碰）|
| `src/scripts/build-github.js` / `src/scripts/build-promotion-manifest.js` / `src/scripts/build-sitemap.js` | ❌ 本批未修改（candidate 7 不接 GitHub tags / promotion / sitemap）|
| `src/scripts/validate-content.js` | ❌ 本批未修改（candidate 7 不新增 validate 規則）|
| `src/scripts/load-posts.js` / `src/scripts/parse-markdown.js` | ❌ 本批未修改（source code 層 legacy fallback 退場屬 Phase 8-h）|
| `src/scripts/report-series.js`（Phase 8-g-17-b 對齊對象）| ❌ 本批未修改 |
| `src/scripts/export-build-report.js`（aggregator）| ❌ 本批未修改 |
| `src/views/*` / `src/styles/*` / `src/js/*` | ❌ 未修改 |
| `content/github/posts/*` | ❌ 未修改 |
| `content/blogger/posts/*` / `content/blogger/pages/*` / `content/github/pages/*` | ❌ 未修改 |
| 任何 `.publish.json` / `.fb.md` sidecar | ❌ 未修改（per §3.12 `series.tags` 不放 sidecar）|
| `content/settings/*`（含 `series.json`；既有 `{"series":[]}` 不變）| ❌ 未修改 |
| `content/templates/*` | ❌ 未修改 |
| `content/validation-fixtures/*` | ❌ 未修改（candidate 7 不新增 fixture）|
| `package.json` / `package-lock.json` | ❌ 未修改 |
| 任何 EJS / SCSS | ❌ 未修改 |
| `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | ❌ 未修改（本批未執行 build；既有 dist-blogger 對既有無 `series.tags` posts 之 `meta.json` byte-identical 已於 Phase 8-g-18-d 驗證）|
| `docs/series-schema.md`（Phase 8-g-18-b 對齊對象）| ❌ **本批未修改**（commit `15c8252` 已落地；本批不重觸碰）|
| `docs/publish-bundle.md` / `docs/publish-json-schema.md` / `docs/fb-sidecar-schema.md` | ❌ 本批未修改 |
| `docs/phase-8b-completion-report.md` ~ `docs/phase-8f-completion-report.md` | ❌ 本批未修改 |
| `docs/phase-8g-2-completion-report.md` / `docs/phase-8g-2-d-completion-report.md` | ❌ 未修改（frozen）|
| `docs/phase-8g-candidate-analysis.md` | ❌ 未修改 |
| `docs/migration-from-frontmatter.md` / `docs/promotion-export.md` | ❌ 未修改 |

### 7.2 本批明確未引入之機制

- ❌ 新 fixture / 新 sample
- ❌ 新 validate 規則
- ❌ 新 source code（normalize-post-output / build-blogger 已於前 commits `48b90af` / `a66da18` 落地；本批 docs-only）
- ❌ baseline 變動（仍為 `0 error / 11 warning on 6 post(s)`；docs-only）
- ❌ 新 npm script 或外部相依
- ❌ Phase 8-g-1 fixture deferred 解封（仍 `deferred`）
- ❌ 啟動 source code 層 legacy fallback 退場（屬 Phase 8-h 或更晚；含 `build-blogger.js` legacy `post.tags` fallback）
- ❌ aggregator 補強（`export-build-report.js` 加 series sub-summary；屬 nice-to-have；可選後續批次）
- ❌ GitHub tags inheritance / promotion / FB sidecar 接入（per §3.12 `series.tags` scope 限於 Blogger）
- ❌ `.publish.json` / `.fb.md` schema 變動（per §3.12.1 `series.tags` 不放 sidecar）
- ❌ 進入 candidate 5（site default hashtags）或 candidate 6（系列首篇 `.fb.md` hashtags fallback）
- ❌ 重動 `docs/series-schema.md`（已於 8-g-18-b 完成；本批不重改）
- ❌ 將 Phase 8-g overall 狀態標成「完全完成」（仍有 candidate 5/6 / Phase 8-g-1 fixture deferred / source code fallback 退場 / fb-sidecar §5.2.6 / nice-to-have 後續批次等 future candidates；overall 狀態仍為 🔄 進行中）

### 7.3 git 操作確認

| 項目 | 狀態 |
|---|---|
| `git status` | 本批 commit 後 working tree 將回到 clean |
| `git remote` | **未設定** |
| `git push` | **未執行** |
| `git commit --amend` / `git rebase` | **未執行**（既有 35 個 commits 皆未被 amend / rebase）|
| 本批 commit | **未 commit**（待作者批准）|

---

## §8 Cross-links

### 8.1 Phase 8-g 內部紀錄

- `docs/phase-8g-candidate-analysis.md`
- `docs/phase-8g-2-completion-report.md`
- `docs/phase-8g-2-d-completion-report.md`

### 8.2 既有 Phase 收尾紀錄（背景）

- `docs/phase-8b-completion-report.md` ~ `docs/phase-8f-completion-report.md`（含 Phase 8-g-4 系列 cross-link 增補）

### 8.3 規格與設計文件

- `docs/series-schema.md`（含 Phase 8-g-12-b 補述；**Phase 8-g-18-b 新增 §22 `series.tags` 規格化**，commit `15c8252`；series report 規格之新節屬 nice-to-have 後續批次）
- `docs/promotion-export.md`
- `docs/fb-sidecar-schema.md`（Phase 8-g-4-c / 8-g-11 §5.2.6 維持保守；§12.3.1 為 Phase 8-g-18-b 之規格依據之一）
- `docs/publish-bundle.md`（§8.1 含 Phase 8-g-4-b 新增之 phase report 清單；§7.4-§7.7 含 Phase 8-g-14 之「實際落地更新」補述）
- `docs/publish-json-schema.md`（§12 含 Phase 8-g-4-b 新增之相關文件節）
- `docs/migration-from-frontmatter.md`

### 8.4 Roadmap

- `docs/future-roadmap.md`（已於 Phase 8-g-7 ~ 8-g-18-e 系列各批 sync；§2 Phase 8-g 仍 🔄 進行中；§5.1 候選表含 ~~B~~（全數落地）/ ~~C~~ / ~~E~~ / ~~F~~ / ~~G~~ / ~~H~~ / ~~7~~ 皆 landed）

### 8.5 Series Report 工具

- `src/scripts/report-series.js`（Phase 8-g-17-b commit `f21da58`）
- `package.json` script `report:series`（Phase 8-g-17-b commit `f21da58`）
- `dist-reports/series-report.{txt,json}`（執行 `npm run report:series` 後產出；屬 ignored 產物）

### 8.6 Candidate 7 Blogger tags inheritance（Phase 8-g-18 系列）

- **docs spec**：`docs/series-schema.md` §22（Phase 8-g-18-b；commit `15c8252`）
- **normalize data-layer**：`src/scripts/normalize-post-output.js` 之 `normalized.publish.blogger.tags` 寫入（Phase 8-g-18-c；commit `48b90af`）
- **build-blogger 接入**：`src/scripts/build-blogger.js` `buildMeta()` `tags` 欄位 normalized 優先 + legacy `post.tags` fallback（Phase 8-g-18-d；commit `a66da18`）
- **本批 docs sync**：Phase 8-g-18-e（本文件 + `docs/future-roadmap.md`）
- **本批未重動 source code**：normalize-post-output.js 與 build-blogger.js 已於前 commits 落地；本批僅 docs-only
- **既有 dist-blogger 對既有無 `series.tags` posts byte-identical**（per §3.12.3）

---

（本文件結束）
