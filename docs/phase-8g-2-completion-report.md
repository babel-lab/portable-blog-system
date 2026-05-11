# Phase 8-g-2 Completion Report — new-post.js series prompt and stderr suggestion

> 批次系列：Phase 8-g-2-b1 / 8-g-2-b2 / 8-g-2-c-a / 8-g-2-c-b / 8-g-2-c-c / 8-g-2-c-d / 8-g-2-e（本報告）
> 範圍：作者工具層 `new-post.js` 與其支援之 `suggest-series-number.js` helper；docs 同步補強
> 起點 HEAD：`a37d92e`（Phase 8-g-0-c roadmap 收尾）
> 終點 HEAD：`9826bd5`（Phase 8-g-2-c-d docs 補強收尾）
> 完整 commits：5（含 4 個實作 + 1 個 docs 補強；2 個讀取分析批次無 commit）
> dist / dist-blogger / dist-promotion baseline：**byte-identical**

---

## §1 本階段目的

Phase 8-g-2 之核心目的為**補齊作者新增文章工具 `new-post.js` 與 Phase 8 series schema 之間的落差**：

1. **修正 deprecated 命名**：new-post.js 模板沿用 Phase 8-a 前之 `type` 欄位；每次產生之文章都會觸發 `frontmatter-uses-deprecated-type` warning。Phase 8-a 起欄位已正式更名為 `contentKind`（per `docs/publish-bundle.md` §2.4）；本階段補上模板對齊。
2. **支援 series 手動 flags**：Phase 8-e / 8-f 完成 series metadata schema 與 build pipeline 接入；但 new-post.js 無法產生含 `series:` 區塊之文章，作者須手動補。本階段新增 `--series-id` / `--series-number` / `--series-subtitle` 三個 CLI flag。
3. **支援 next series.number stderr-only suggestion**：依 `docs/series-schema.md` §5 規格化之自動建議邏輯（補缺號優先 / 否則 max+1 / 空集合 1）落地；保守採 **stderr-only** 路線，不污染 stdout template。
4. **維持 no dist impact**：所有變動侷限於作者工具層；不接 EJS / build script / customer-facing 輸出；validate baseline 與 build outputs 完全不變。

Phase 8-g-2 對應 `docs/phase-8g-candidate-analysis.md` §6 候選 #2（`new-post.js` series 欄位提示）與 #3（series number gap filling 規則）；兩候選狀態於 §6 表中皆已更新為 `landed`。

---

## §2 Commit 摘要

| Commit | 類型 | 摘要 |
| --- | --- | --- |
| `fa7d825` | `fix(phase-8g)` | use contentKind in new-post.js template (deprecated type) |
| `bb58b2d` | `feat(phase-8g)` | add series CLI flags to new-post.js |
| `2262938` | `feat(phase-8g)` | add suggest-series-number helper (no caller yet) |
| `2507748` | `feat(phase-8g)` | print stderr next series.number suggestion in new-post.js |
| `9826bd5` | `docs(phase-8g)` | record new-post.js series prompt and stderr suggestion landing |

讀取分析批次（**無 commit**；於對話內留下分析紀錄）：
- 8-g-0-d：new-post.js series prompt 讀取分析
- 8-g-2-c-a：next series.number suggestion 讀取分析

---

## §3 功能完成摘要

### 3.1 new-post.js 新行為

| 行為 | 落地批次 | 細節 |
| --- | --- | --- |
| 模板 `contentKind` 取代 deprecated `type` | 8-g-2-b1 | 新建文章不再觸發 `frontmatter-uses-deprecated-type` warning |
| `--series-id` 提供時模板輸出 `series:` 區塊 | 8-g-2-b2 | 區塊位於 `tags: []` 之後、`description:` 之前，符合 `docs/publish-bundle.md` §2.6.1 之內容屬性欄位排序 |
| `--series-number` 可選輸出 number 行 | 8-g-2-b2 | bare YAML number（無引號）；type number per series-schema §2.1 |
| `--series-subtitle` 可選輸出 subtitle 行 | 8-g-2-b2 | quoted YAML string |
| 無 series flag 時模板行為**完全不變** | 8-g-2-b1 / b2 | byte-identical 至 Phase 8-g-2-b1 前模板（除 deprecated 修正）|
| 手動 `--series-number` **永遠優先** | 8-g-2-c-c | 手動指定時 stdout 寫入；stderr 完全不顯示自動建議 |
| 未提供 `--series-number` 時 **stderr** 顯示建議 | 8-g-2-c-c | stdout template 不寫入 suggested number；作者須主動 copy |
| 不寫檔 / 無互動 prompt | 全系列 | new-post.js 維持 pure stdout printer + stderr suggestion 副作用 |

### 3.2 `suggest-series-number.js` helper（純函式）

- **檔案**：`src/scripts/suggest-series-number.js`（commit `2262938`）
- **狀態**：純函式 module；零外部 import；不讀寫檔；不 throw；不 process.exit
- **三個 export**：
  - `collectSeriesNumbers(posts, targetSeriesId)` → `{ numbers, ignored }`
  - `suggestNextSeriesNumber(numbers)` → `number`
  - `suggestSeriesNumberForPosts(posts, targetSeriesId)` → `{ suggestedNumber, usedNumbers, ignored }`
- **支援 posts 元素 frontmatter shape**（3 種）：
  - `{ series: {...} }`（`load-posts` entry spread）
  - `{ data: { series: {...} } }`（gray-matter 原始 `{ data, content }`）
  - `{ frontmatter: { series: {...} } }`（通用 wrapper）
- **規格對齊**：`docs/series-schema.md` §5 之 auto-suggest rules

### 3.3 series.number 自動建議邏輯規格

| 規則 | 行為 |
| --- | --- |
| 補缺號優先 | 已有 `[1, 2, 4]` → 建議 `3` |
| 否則 max + 1 | 已有 `[1, 2, 3]` → 建議 `4` |
| 空集合 → 1 | 無匹配 series.id → 建議 `1` |
| dedupe | 同系列同編號重複時 dedupe；不擋 |
| invalid numbers ignored | 非 number / 非整數 / 非正 / NaN / Infinity 跳過並計入 ignored；可選 stderr warning |
| status / publishedAt 不影響編號分配 | 所有 status（draft / ready / published）皆視為「已分配創作編號」（per series-schema §4）|
| 手動 `--series-number` 優先 | 永遠寫入 stdout；suggestion 完全不顯示 |
| suggestion 不寫入 stdout template | 僅 stderr 輸出；stdout template 保持作者意圖之純複製目標 |

### 3.4 new-post.js stderr 訊息格式

成功 suggestion：
```
[new-post] Suggested series.number for "we-media-ai-52": 3
[new-post] Add it explicitly with: --series-number 3
```

含 invalid numbers（追加一行 warning）：
```
[new-post] Warning: ignored 1 invalid series.number value while scanning.
```

scan 失敗（graceful fallback；stdout template 仍正常輸出）：
```
[new-post] Warning: unable to suggest series.number; please set --series-number manually.
```

### 3.5 掃描範圍

| 納入 | 排除 |
| --- | --- |
| `content/blogger/posts/**/*.md` | `content/validation-fixtures/**` |
| `content/blogger/pages/**/*.md` | `content/templates/**` |
| `content/github/posts/**/*.md` | （`content/archive` 不納入；保守決策；詳見 §3.6）|
| `content/github/pages/**/*.md` | |
| `content/shared/posts/**/*.md` | |
| `content/drafts/**/*.md` | |

實作層使用 `fast-glob` + `gray-matter`（既有相依；無新增外部套件）。`loadPosts()` 未被重用——其預設過濾 draft 並限單一 site，不符合「ALL status / 跨 site」之 series.number 統計需求。

### 3.6 `content/archive` 不納入掃描之理由

依 8-g-2-c-a §B #7 保守決策：

- 已歸檔不影響新文章編號（series-schema §4.3 排序欄位不含 archive）
- archive 之 series.number 可能與未來新編號意外衝突
- 預設不納入較安全
- 未來如需要可加 `--include-archived` flag；本階段不實作

---

## §4 驗證實況 / 測試摘要

### 4.1 各批次測試覆蓋

| 批次 | 測試類型 | 涵蓋情境 | 結果 |
| --- | --- | --- | --- |
| 8-g-2-b1 | stdout 比對 | `node new-post.js test` 輸出含 `contentKind: "tech-note"`，無 `type: "tech-note"` | ✅ PASS |
| 8-g-2-b2 | 4 組 CLI flag 組合 stdout 比對 | A 無 flag / B 僅 `--series-id` / C `--series-id` + `--series-number` / D 三 flag 齊全 | ✅ 4/4 PASS |
| 8-g-2-c-b | helper smoke test（22 條 assertion）| A-H 主要情境 + gray-matter shape / invalid shape / edge cases / empty / empty target id | ✅ 22/22 PASS |
| 8-g-2-c-c | new-post.js stderr/stdout 5 組情境 | A 無 series flag / B `--series-id` only / C 含 `--series-number` / D 三 flag 齊全 / E 不存在 series-id | ✅ 5/5 PASS |
| 8-g-2-c-d | git diff scope | 3 docs 修改，無其他檔案 | ✅ PASS |

### 4.2 未執行 build / validate:content 之理由

| 工具 | 是否執行 | 理由 |
| --- | --- | --- |
| `npm run build:github` | ❌ 未執行 | new-post.js 與 suggest-series-number.js 皆不參與 build pipeline；無 EJS / build script 變動；dist baseline 不可能變動 |
| `npm run build:blogger` | ❌ 未執行 | 同上；無 Blogger 輸出路徑變動 |
| `npm run build:promotion` | ❌ 未執行 | 同上；無 manifest / FB txt 路徑變動 |
| `npm run validate:content` | ❌ 未執行 | helper 為純函式；validate-content 未 import 本 helper 或 new-post.js；無 validate 規則變動；baseline 確定不變 |

屬「**no dist impact + 工具層 / docs 層變更**」之自然推論：

- 工具層（`src/scripts/new-post.js` / `src/scripts/suggest-series-number.js`）僅作者使用時觸發；不在 npm script 之 build / validate / dev 流程中
- docs 層（4 份文件更新）為純 markdown；不影響任何 runtime 行為
- 本系列**未動**任何 EJS / SCSS / settings / posts / sidecars / templates / fixtures

### 4.3 CLI 範例（人工執行驗證）

```bash
# 一般文章
node src/scripts/new-post.js my-slug

# 系列文章：自動建議（stderr 顯示）
node src/scripts/new-post.js my-slug --series-id we-media-ai-52
# stderr 範例：
#   [new-post] Suggested series.number for "we-media-ai-52": 1
#   [new-post] Add it explicitly with: --series-number 1

# 系列文章：手動指定全部欄位（不顯示建議）
node src/scripts/new-post.js my-slug --series-id we-media-ai-52 --series-number 3 --series-subtitle 提問筆記本
```

---

## §5 不變項 / 安全邊界

本階段**明確未修改**之範圍：

| 範圍 | 狀態 |
| --- | --- |
| `content/blogger/posts/*` / `content/github/posts/*` | ❌ 未修改 |
| `content/blogger/pages/*` / `content/github/pages/*` | ❌ 未修改 |
| 任何 `.publish.json` / `.fb.md` sidecar | ❌ 未修改 |
| `content/settings/*`（含 `series.json`）| ❌ 未修改 |
| `content/templates/*` | ❌ 未修改 |
| `content/validation-fixtures/*` | ❌ 未修改 |
| `content/drafts/` / `content/archive/` | ❌ 未修改（皆空目錄）|
| `package.json` | ❌ 未修改（無新增 npm script；無新增外部套件）|
| 任何 EJS / SCSS | ❌ 未修改 |
| `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | ❌ 未修改 |
| 既有 phase completion reports（`phase-8b/c/d/e/f-completion-report.md`）| ❌ 未修改（frozen）|

本階段**明確未引入**之機制：

- ❌ 互動 prompt（無 readline / inquirer / TTY 互動）
- ❌ 寫檔（new-post.js 仍為 pure stdout printer + 純資訊 stderr）
- ❌ 外部套件（沿用既有 `fast-glob` + `gray-matter` 相依）
- ❌ 自動掃描整個專案（scan 嚴格限於 §3.5 之納入範圍）
- ❌ 自動寫入 suggested number 至 stdout template（保守 stderr-only 路線）

本階段**明確不接觸**之延後項：

- ❌ Phase 8-g-1 fixture / sample end-to-end 驗證（per 8-g-0-b `deferred`；部署風險未解）
- ❌ Customer-facing series 輸出接入（H1 / FB `.txt` 標題 / publish-checklist；per 8-f-5-c §17.3 / 8-f-6-a 保守決策）

---

## §6 後續候選

### 6.1 Phase 8-g-2-d：validate series warning 規則（候選；未進入）

依 `docs/phase-8g-candidate-analysis.md` §6 候選 #1：
- series duplicate-number warning（重號偵測；per series-schema §5.3）
- series id-not-in-settings warning
- titleTemplate unresolved 升級為 user-visible warning
- 可選 series report（`dist-reports/series.txt`）

屬獨立批次；無前置依賴；可由作者另行排程。

### 6.2 Phase 8-g-1：fixture / sample end-to-end 驗證（仍 deferred）

per 8-g-0-b §3.2 / `docs/phase-8g-candidate-analysis.md` §5：
- ready fixture 會進入正式 dist / sitemap / promotion
- 本系統第一版無 noindex / staging dist 機制
- 觸發條件未滿足（人工部署隔離 / 作者首篇實際系列文章前 / staging 機制）
- 屬獨立排程；不混入既有批次

### 6.3 pre-existing 問題：`canonical: "auto"`

`new-post.js` 模板 L52 之 `canonical: "auto"` 屬 Phase 8-a 起列舉之 deprecated 候選之一（per 8-g-0-d §A.3 第 2 點 / 第 3 點）；本階段**未動**。

若未來認定需退場，建議另開獨立批次與 schema 同步討論；單獨在 new-post.js 修改可能與 validate-content 之 canonical 規則不一致。

### 6.4 archive 掃描

`--include-archived` flag 屬未來可選擴充；目前不建議：
- 已歸檔不影響新文章編號（per §3.6）
- 加 flag 會擴大 CLI 表面；無實證需求

如未來作者實際使用中發現「archive 編號與新文章編號意外衝突」之情境，再行評估。

### 6.5 Phase 8-g 整體後續

| 候選 | 狀態 | 備註 |
| --- | --- | --- |
| Phase 8-g-2-d（validate series）| `candidate` | 詳見 §6.1 |
| Phase 8-g 整體 completion report | `candidate` | 整合 8-g-0-b / 8-g-0-c / 8-g-2 全系列 |
| Phase 8-g-1 fixture | `deferred` | 詳見 §6.2 |
| Phase 8-g 其他候選（#5 / #6 / #7）| `candidate` | 詳見 `docs/phase-8g-candidate-analysis.md` §6 |

---

## §7 Cross-links

### 7.1 Phase 8-g 系列文件
- `docs/future-roadmap.md` §3 / §3.2 / §5.1
- `docs/phase-8g-candidate-analysis.md` §6 / §10

### 7.2 規格與設計文件
- `docs/series-schema.md` §5（auto-suggest 規格）/ §15.6（後續批次預告）/ §20（Phase 8-g-2 落地紀錄）
- `docs/publish-bundle.md` §2.4 / §2.6.1（contentKind 命名與 series 欄位位置）

### 7.3 落地檔案
- `src/scripts/new-post.js`
- `src/scripts/suggest-series-number.js`

### 7.4 既有 Phase 收尾紀錄（背景）
- `docs/phase-8f-completion-report.md`（Phase 8-f series build pipeline 接入；本階段之前置依賴）

---

（本文件結束）
