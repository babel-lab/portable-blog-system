# Phase 8-h Completion Report：Legacy Fallback Retirement 系列收尾

本文件封存 **Phase 8-h legacy fallback retirement 系列**之完整 completion 紀錄。Phase 8-h 為 BLOG 系統第 1 階段（Phase 1 final）封存後之主要清理批次，目的為移除 source code 中之 deprecated legacy fallback 路徑，使 normalized / sidecar / identity 欄位成為正式且**唯一**之資料來源。

對應之上層紀錄：
- `docs/phase-8h-pre-analysis.md`（Phase 8-h-a-doc 退場前盤點分析；commit `a538564`）
- `docs/phase-8h-baseline-snapshot.md`（Phase 8-h-b 退場前 baseline run；commit `c9ce52c`）
- `docs/phase-8h-c-pre-plan.md`（Phase 8-h-c-pre fixture / split plan 分析；commit `130097a`）
- `docs/phase-1-completion-report.md` §8.3（Phase 1 final 之 Phase 8-h post-Phase-1 排程）

---

## §1 Phase 8-h 目標摘要

### 1.1 高階目標

Phase 8-h 為 Phase 8-a sidecar bundle migration 完成後之 source code 清理批次。在 Phase 1-7 之 frontmatter schema 與 Phase 8-a 之 sidecar / normalized schema 並存期間，source code 持有「**legacy fallback chain**」維持向後相容。Phase 8-h 之目標為：

1. **退場 17 個 legacy fallback 位置**（16 in-scope + 1 out-of-scope；per `docs/phase-8h-pre-analysis.md` §3）
2. **normalized / sidecar / identity 欄位**作為正式來源（移除 legacy frontmatter / top-level alias 路徑）
3. **保留 production output 行為不 regression**（real ready posts 之 dist / dist-blogger / dist-promotion 結果不變或語義升級）

### 1.2 範圍區分

| 範圍 | 屬性 |
|---|---|
| **in-scope**（16 個位置）| 跨 5 個 source files：validate-content.js / normalize-post-output.js / build-blogger.js / build-promotion.js / resolve-placeholders.js |
| **out-of-scope**（1 個位置；position #10）| parse-markdown.js H1→H2 自動降級（Phase 7-fix-1 (B) 永久 SEO 防呆；**非 schema migration legacy**；本批永久排除）|

### 1.3 退場原則

- 每批單檔 source；風險分級依 `docs/phase-8h-c-pre-plan.md` §4
- 每批含驗證（validate / build × N）+ baseline 對照
- regression fixture 安全網先於退場批落地（Phase 8-h-c-pre-1）
- baseline `0 error / 22 warning / 17 post(s)` 全程維持

---

## §2 最終基準狀態

（Phase 8-h-f content migration + source retirement 完成後）

| 項目 | 值 |
|---|---|
| **HEAD** | `72db25f refactor(promotion): retire facebook legacy fallback` |
| **working tree** | clean |
| **`validate:content` baseline** | `0 error / 22 warning / 17 post(s)` |
| **`build:promotion`** | exit 0；**total enabled=2 / total filtered=4** |
| **`build:github` / `build:blogger`** | 皆 exit 0 |
| **`dist/.gitkeep`** | 0 bytes；mtime `2026-05-18 11:34`（自 Phase 8-h-b restore 後**全程保留**）|

### 2.1 FB promotion 輸出

| 檔案 | 大小 | 來源 |
|---|---|---|
| `dist-promotion/facebook/blogger/we-media-myself2.txt` | 647 bytes | `.fb.md` sidecar body（Phase 8-a sidecar 既有 post）|
| `dist-promotion/facebook/github/github-pages-blog-planning.txt` | 422 bytes | `.fb.md` sidecar body（Phase 8-h-f-content-migration-a 新建）|

**注**：github-pages-blog-planning.txt 由原 421 bytes（legacy EJS template 渲染）變為 422 bytes（sidecar body 直接渲染；+1 byte 為 leading newline，per `we-media-myself2.fb.md` sidecar convention 一致；內容語義不變）。

### 2.2 dist 全域檔案數（vs Phase 8-h-b baseline）

| 目錄 | Phase 8-h-b | Phase 8-h-z | Delta |
|---|---|---|---|
| `dist/` | 33 + 1 .gitkeep | 同 | 不變 |
| `dist-blogger/` | 17 | 同 | 不變 |
| `dist-promotion/` | 5 | 同 | 不變 |
| `dist-reports/` | 17 | 同 | 不變 |

---

## §3 子批次 landed table

Phase 8-h 系列共 **14 個子批次**（含本文件之 Phase 8-h-z）；累計 **13 commits** + 1 skipped sub-batch（位置 #12 field removal）+ 0 deferred。

| # | Sub-batch | 範圍 | commit |
|---|---|---|---|
| 1 | Phase 8-h-a-doc | retirement pre-analysis（17 位置盤點 + 拆批建議）| `a538564` |
| 2 | Phase 8-h-b | retirement baseline run + snapshot（15 commands）| `c9ce52c` |
| 3 | Phase 8-h-c-pre | fixture / split plan analysis（17 位置驗證 + 12-commit roadmap）| `130097a` |
| 4 | Phase 8-h-c-pre-1 | **5 個 minimal regression fixtures** 落地（fixture #6 deferred）| `546686d` |
| 5 | **Phase 8-h-c** | 位置 #1：validate `frontmatter-uses-deprecated-type` warning rule 退場 | `bc41b80` |
| 6 | **Phase 8-h-d-1** | 位置 #2：normalize `contentKind ?? type` legacy fallback + deprecated warning 退場 | `f05de63` |
| 7 | **Phase 8-h-d-2** | 位置 #3-#8：normalize FB sidecar legacy fallback × 6 + legacyFb 變數宣告退場 | `28096e3` |
| 8 | **Phase 8-h-d-3** | 位置 #9：normalize canonical legacy frontmatter URL string fallback 退場 | `fa74d02` |
| 9 | **Phase 8-h-d-4** | 位置 #14-#17：resolve-placeholders 4 處 URL legacy fallback 退場 | `0b47f5b` |
| 10 | **Phase 8-h-e-1** | 位置 #11：build-blogger `bloggerTags` post.tags legacy fallback 退場 | `6ce66f4` |
| 11 | **Phase 8-h-e-2-a** | 位置 #12 source migration：meta.json `type` 來源改為 `normalized.identity.contentKind` | `b49e2c3` |
| 12 | **Phase 8-h-e-2-b** | 位置 #12 field removal | ⏸ **skipped / permanent deferred**（per §5）|
| 13 | **Phase 8-h-f-content-migration-a** | github-pages-blog-planning FB sidecar migration（破例 content migration）| `6f1b3c9` |
| 14 | **Phase 8-h-f** | 位置 #13：build-promotion classifyFacebook + buildManifestEntry 4 欄位 legacy fallback 退場 | `72db25f` |
| 15 | **Phase 8-h-z（本文件）** | completion report + docs sync | 見本批 git log |

### 3.1 退場 vs migration vs skip 分類

| 處置 | 位置 | 數量 |
|---|---|---|
| 完全退場（remove）| #1, #2, #3-#8, #9, #11, #13, #14-#17 | 14 |
| Source migration（保留欄位 + 改來源）| #12 | 1 |
| Skip / permanent deferred | #12 field removal (8-h-e-2-b) | — |
| Out-of-scope | #10（parse-markdown H1→H2）| 1 |
| **in-scope retired-or-migrated** | — | **15 of 15 = 100%** |

**注**：原 pre-analysis §3.7 合計 typo 為「17 範圍位置」，per Phase 8-h-c-pre-plan §3.1 修正為「16 in-scope + 1 out-of-scope = 17 total」。本文件以修正後計數為準。

---

## §4 Phase 8-h-f Regression Handling 記錄

Phase 8-h-f 為 Phase 8-h 系列中**唯一觸發 production regression** 之退場批。本節記錄完整事件序列與最終解決路徑。

### 4.1 Regression 觸發

**Phase 8-h-f 初次 source-only edit 後**：

| 指標 | 退場前 | Phase 8-h-f 初次退場後 |
|---|---|---|
| `total enabled` | 2 | **1** ⚠️ |
| `total filtered` | 3 | 4 |
| `20260504-github-pages-blog-planning` | enabled | **filtered: no-promotion-block** |

### 4.2 根因分析

**根因**：`content/github/posts/20260504-github-pages-blog-planning.md` frontmatter 含完整 `promotion.facebook.*` block（enabled / page / title / message / target / hashtags / note），但**無對應 `.fb.md` sidecar**。

Phase 8-h-c-pre-plan §3.2 / pre-analysis §2.4 之既有 grep 假設「real ready posts 已遷移至 sidecar」**不準確**：實際 grep 範圍漏掉此一 production post 之 legacy frontmatter 殘留。

### 4.3 解決路徑

**拆 2 個 commits 處理**（per 用戶授權之候選 3：content migration + source retirement）：

| Commit | 範圍 | 作用 |
|---|---|---|
| **`6f1b3c9` Phase 8-h-f-content-migration-a** | 1. 新建 `content/github/posts/20260504-github-pages-blog-planning.fb.md`（per `we-media-myself2.fb.md` sidecar convention）<br>2. 移除 `.md` frontmatter 之 `promotion:` block（-13 lines）| **Production migration**：將 legacy frontmatter 遷至 sidecar 架構 |
| **`72db25f` Phase 8-h-f** | 1. `classifyFacebook`：移除 `legacyFb` 宣告 + `sidecarData \|\| legacyFb` 簡化為 `sidecarData`<br>2. `buildManifestEntry`：移除 `fb.message` / `fb.target` / `fb.hashtags` legacy fallback | **Source retirement**：移除 #13 legacy fallback |

### 4.4 最終結果

`total enabled` 恢復至 **2**（we-media-myself2 + github-pages-blog-planning 皆走 `.fb.md` sidecar 路徑）。

### 4.5 性質判定

🟢 **此次處理為 production migration 補齊，非接受功能退場**：

- 兩篇 ready posts 持續產出 FB promotion txt
- github-pages-blog-planning 之 FB 推廣文案、URL with UTM、hashtags 全部保留（內容 byte-for-byte 對齊 + 1 byte leading newline）
- production 行為對外部觀察者「FB txt 是否存在 + 內容是否符合」**完全保留**
- 屬「將原本掛 legacy 路徑之 production post 提升至 sidecar 架構」之改善，而非「失去 FB 功能」

### 4.6 後續學習

Phase 8-h-f 之 regression 提示：未來退場批之 pre-analysis 應加強 grep 覆蓋率（含跨 site / 含 alias variants）；建議 Phase 8-h-c-pre-plan §5.2 之 fixture 補強同時掃描真實 content 是否有未遷移之 legacy 殘留，避免 source retirement 暴露 production gap。

---

## §5 Phase 8-h-e-2-b Deferred 判斷

Phase 8-h-e-2-b 原規劃移除 meta.json `type` 欄位（位置 #12 第二步）。本節說明**永久 skip / deferred** 判斷依據。

### 5.1 背景

Phase 8-h-e-2-a 已完成 **source migration**：meta.json `type` 欄位之來源由 `post.type`（legacy frontmatter，永為 null）改為 `post.normalized?.identity?.contentKind`（永為實際值如 "book-review" / "tech-note"）。

### 5.2 Deferred 理由

| 考量 | 評估 |
|---|---|
| **欄位語義已升級** | Phase 8-h-e-2-a 後 `type` 含實際 contentKind 值（非 null placeholder）；屬有用之 informational metadata，非 legacy 殘留 |
| **Schema 穩定性** | 移除 meta.json 欄位屬 **breaking schema change**；對下游消費者（Blogger 手動發布 helper、未來 tooling）可能造成 silent broken |
| **無移除動機** | type 欄位仍承載**正式 normalized 來源**之值；移除唯一效益為「schema 更精簡」但風險明顯 |
| **Phase 1 保守原則** | per CLAUDE.md §27 「不主動破壞 API / schema」；per `docs/phase-1-completion-report.md` §12 之保守判定 |
| **退場目標已達成** | Phase 8-h 之核心目標「移除 legacy 來源」已由 8-h-e-2-a 完成；8-h-e-2-b 屬「進一步移除欄位本身」之獨立決策，非退場必要步驟 |

### 5.3 建議

**永久 skip**。未來若有具體外部消費者反饋要求 schema 精簡，再個案評估；否則維持 type 欄位以保持 schema 相容性。

---

## §6 最終退場結果

| 項目 | 結果 |
|---|---|
| **in-scope positions retired-or-migrated** | **15 of 15（100%）** |
| 完全退場（remove）| 14 個位置 |
| Source migration（含欄位保留）| 1 個位置（#12 第一步）|
| Skip / permanent deferred | 1 個 sub-batch（8-h-e-2-b；#12 第二步）|
| Out-of-scope（永久不在範圍）| 1 個位置（#10 parse-markdown H1→H2）|

### 6.1 Phase 8-h 實質完成

**Phase 8-h source code retirement 任務實質完成**：

- 5 個 source files 之 legacy fallback 路徑**全數清除**（除 #12 之 `type` 欄位語義升級保留 + #10 永久排除）
- normalized / sidecar / identity 欄位成為 **production 唯一資料來源**
- production output 行為 **無 regression**（含 8-h-f 之 production migration 解決）
- validate baseline `0/22/17` 全程維持

### 6.2 剩餘工作

剩餘工作**非 source 任務**：
- ✅ Phase 8-h-z（本文件）：completion report + docs sync
- 後續若有 Phase 9-g-g / 9-f-g / 9-h-f / Google Rich Results Test 等 post-Phase-1 任務啟動，與 Phase 8-h 退場系列**互相獨立**

---

## §7 驗證摘要

### 7.1 完整 verification（per Commit 72db25f post-commit run）

| 命令 / 檢查 | 結果 |
|---|---|
| `npm run validate:content` | **0 error / 22 warning / 17 post(s)**（Phase 8-h 全程維持）|
| `npm run build:promotion` | exit 0；52ms |
| `npm run build:github` | exit 0 |
| `npm run build:blogger` | exit 0 |
| total enabled | **2**（we-media-myself2 + github-pages-blog-planning）|
| total filtered | 4 |
| `we-media-myself2` 狀態 | enabled via `.fb.md` sidecar（既有；自 Phase 8-a）|
| `github-pages-blog-planning` 狀態 | enabled via `.fb.md` sidecar（**Phase 8-h-f-content-migration-a 新建**）|
| `dist-promotion/facebook/blogger/we-media-myself2.txt` | ✅ 647 bytes 產出 |
| `dist-promotion/facebook/github/github-pages-blog-planning.txt` | ✅ 422 bytes 產出 |
| `all-posts-index.txt` | ✅ 產出 |
| `build-manifest.json` | ✅ `posts.length: 2` |

### 7.2 Legacy 殘留 grep

| Grep | 命中 | 結論 |
|---|---|---|
| `grep "legacyFb" src/scripts/build-promotion.js` | **0** code references | ✅ 完全清除 |
| `grep "legacyFb" src/scripts/normalize-post-output.js` | **0** code references（僅 Phase 8-h-d-2 marker comment）| ✅ 完全清除 |
| `grep "^promotion:" content/{github,blogger}/posts/*.md` | **0** 命中 | ✅ production posts 無 legacy `promotion.facebook.*` 殘留 |
| `grep "^type:" content/{github,blogger}/posts/*.md` | **0** 命中（per Phase 8-h-a-doc §2.4 既有）| ✅ legacy `type:` 全清 |
| `grep "^publishedUrl:\|^githubUrl:\|^canonicalUrl:" content/{github,blogger}/posts/*.md` | **0** 命中 | ✅ legacy top-level URL 全清 |

### 7.3 dist/.gitkeep 副作用全程紀錄

| Phase | dist/.gitkeep mtime | 處置 |
|---|---|---|
| Phase 8-h-b（vite build）| 被刪 → restored to 2026-05-18 11:34 | per Phase 8-h-b §7.1 |
| Phase 8-h-c ~ Phase 8-h-f | 全程未動（建類 build 命令未觸發）| — |
| 最終狀態（Phase 8-h-z）| 2026-05-18 11:34 | ✅ 完整保留 |

其他 3 個 `.gitkeep`（dist-blogger / dist-promotion / dist-reports）全程**未動**（mtime 維持 2026-05-04 06:36）。

---

## §8 邊界聲明 / 不在 Phase 8-h scope

本批 Phase 8-h-z 與 Phase 8-h 系列**全程**之邊界：

- ✅ **不**動 parse-markdown.js #10（H1→H2；永久 SEO 防呆；per pre-analysis §3.3）
- ✅ **不**動 meta.json `type` 欄位本身（Phase 8-h-e-2-b 永久 skip；per §5）
- ✅ **不**動 JSON-LD 進階強化（Phase 9-g-g / 9-f-g 仍 deferred；屬獨立批次）
- ✅ **不**動 sitemap cross-source gap（per Phase 10-a-b §3.3 觀察；屬未來候選批）
- ✅ **不**動 Google Rich Results Test（屬作者 SOP；per `docs/phase-1-completion-report.md` §11 順序 1）
- ✅ **不**動 Phase 9-h-f Related Posts auto block（屬未來候選；需 ≥ 5 篇 ready post）
- ✅ **不**動其他 production content posts（僅 8-h-f-content-migration-a 破例處理 github-pages-blog-planning.md）
- ✅ **不** push / 設定 remote / amend / rebase（Phase 8-h 全 13 個 commits 皆為線性新增 commit）

---

## §9 Cross-links

### 9.1 Phase 8-h 系列文件

- `docs/phase-8h-pre-analysis.md`（Phase 8-h-a-doc 退場前盤點分析）
- `docs/phase-8h-baseline-snapshot.md`（Phase 8-h-b 退場前 baseline run）
- `docs/phase-8h-c-pre-plan.md`（Phase 8-h-c-pre fixture / split plan 分析）

### 9.2 Phase 1 / Roadmap 上層紀錄

- `docs/phase-1-completion-report.md` §8.3（Phase 1 final 之 Phase 8-h post-Phase-1 排程；本批完成後該節 Phase 8-h 狀態應由 ⏸ pending 改為 ✅ landed）
- `docs/phase-1-completion-checklist.md` §11.3（Phase 1 checklist 之 Phase 8-h 拆批建議）
- `docs/future-roadmap.md` §8.4 + §8.5 順序 3（post-Phase-1 路線；Phase 8-h 退場系列）

### 9.3 規範來源

- `CLAUDE.md` §27（Claude Code 修改規則；本批嚴格遵守「不動 source / 不動 content / 不 push」之保守原則）

---

（本文件結束）
