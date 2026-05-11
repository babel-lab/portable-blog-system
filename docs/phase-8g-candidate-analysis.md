# Phase 8-g 候選分析與 fixture 風險決策

> 批次：Phase 8-g-0-b（純文件批次）
> 日期：2026-05-11
> 前置：HEAD = `b1679d1`（Phase 8-f-8-b completion report）
> 本批不修改 JS / EJS / settings / content posts / sidecars / templates / fixtures / dist。

---

## 1. 文件目的

本文件記錄 Phase 8-f 完成後 Phase 8-g 之候選方向、方案 E（fixture / sample end-to-end 驗證）之風險評估，以及 2026-05-11 之決策。

本文件屬「分析 / 決策紀錄」，**不規格化任何 schema 變動**；任何進入實作之候選需另開批次。

---

## 2. Phase 8-g 候選定位

- Phase 8-f 已完成 series 接入核心架構：`normalized.series` / `titleTemplate` 解析（`resolve-series-title.js`）/ `series.hashtags` 繼承（normalize-post-output post-pass backfill）/ Blogger copy-helper `[11]` 區塊 / promotion manifest 4 個 additive 欄位。完整 12 commits 已於 Phase 8-f-8-b commit `b1679d1` 收尾。
- Phase 8-g **不應急著接 customer-facing 輸出**：
  - GitHub / Blogger 文章 H1 接 `series.titleTemplate`：屬 Phase 8-f-5-c §17.3 既有保守決策（SEO 風險、字長風險）。
  - FB `.txt` / publish-checklist 顯示 `seriesResolvedTitle`：屬 Phase 8-f-6-a / 8-f-5-c 既有保守決策（FB 字長受限；publish-checklist 顯示與 copy-helper [11] 重複）。
- Phase 8-g 候選應以「**驗證 / 工具 / 報表 / docs**」為主，避免擴大 customer-facing surface 而引入新 SEO / 字長 / 部署風險。

---

## 3. 方案 E：fixture / sample end-to-end 驗證分析摘要

### 3.1 fixture 放置與 build 觸發

| 放置位置 | 是否被 build 掃到 | 影響 dist | 用途 |
|---|---|---|---|
| `content/validation-fixtures/` | ❌ 不會 | ❌ 不會 | 僅供 `validate-content` 掃描；驗證 validate 規則 |
| `content/{site}/posts/`（site = blogger / github）| ✅ 會 | ✅ 會 | 真正 end-to-end 接入路徑驗證 |

若要對 Phase 8-f 接入路徑做**真正 end-to-end 驗證**（normalized.series / titleTemplate / hashtags inheritance / copy-helper [11] / promotion manifest 4 個新欄位），**必須接受正式 dist 變動**：

- `dist/{site}/`：新增 fixture post 之 list / detail / category / tag 頁面 entry，sitemap.xml 新增索引 URL。
- `dist-blogger/posts/{slug}/`：若 `blogger.enabled=true`，新增 post.html / copy-helper.txt（含 `[11]` 區塊首次非空）/ meta.json / publish-checklist.txt。
- `dist-promotion/facebook/{site}/{slug}.txt`：若 `facebook.enabled=true`，新增 FB 推廣 txt。
- `dist-promotion/facebook/manifest.json`：新增 entry；`seriesResolvedTitle` 首次非 null；`titleEn` / `fbTitleEn` / `seriesTitleUnresolvedPlaceholders` 視 fixture 設計可能首次非預設值。

### 3.2 風險摘要

| 風險 | 嚴重度 | 性質 |
|---|---|---|
| 改變 sitemap.xml 索引 URL 集合 | 🟡 中 | 索引擴散 |
| 改變 dist / dist-blogger / dist-promotion baseline | 🟡 中 | baseline 漂移 |
| 若未來不小心部署，`_sample-` 內容可能對外可見 | 🔴 高 | 部署污染 |
| 本系統第一版**無 noindex / staging dist 機制**可隔離 fixture | 🔴 高 | 結構性缺口 |

→ 屬「**有價值但有部署風險之測試資產**」；應**獨立批次**處理，**不混入 Phase 8-g 起手批次**。

---

## 4. 本次（2026-05-11）決策

| 決策 | 狀態 |
|---|---|
| 暫不新增 ready series fixture | ✅ 暫不執行 |
| 暫不修改 `content/settings/series.json`（仍維持 `{"series":[]}`）| ✅ 暫不執行 |
| 暫不修改正式 `content/blogger/posts/` / `content/github/posts/` 文章 | ✅ 暫不執行 |
| 暫不改 dist / dist-blogger / dist-promotion baseline | ✅ 暫不執行 |
| Phase 8-g-1 fixture 落地保留為未來獨立批次 | ✅ deferred |

### 4.1 決策理由

1. **ready fixture 會進入正式 dist / sitemap / promotion**。
2. **若未來不小心部署，`_sample-` 內容可能對外可見**。
3. **已完成 Phase 8-f completion report，目前不是非做 fixture 不可**。
4. **fixture end-to-end 驗證有價值，但應獨立排程**，不能混在 Phase 8-g 起手批次直接做。

---

## 5. 未來 Phase 8-g-1（fixture / sample end-to-end 驗證）建議方案（deferred）

以下為未來進入 fixture 落地批次時之建議方案；本批**不執行**。

### 5.1 方案內容

| 項目 | 建議 |
|---|---|
| `content/settings/series.json` entry | 新增 1 個 `_test-series-001`（或類似明確識別碼，避免與作者真實系列耦合）|
| 新增 fixture post | 1 篇位於 `content/github/posts/` 之 ready sample series post（slug / title 明確標示 `_sample-` 或 `[sample]`）|
| `.publish.json` sidecar | 可選搭配（驗 Phase 8-b 接入 + Phase 8-a schema 落地）|
| `promotion.facebook.enabled` | `true`（實證 Phase 8-f-6-b 之 4 個 manifest additive 欄位）|
| `.fb.md` sidecar | **不搭配**（實證 Phase 8-f-7-b 之 `series.hashtags` 繼承路徑）|
| commit 拆分 | **拆 2 commits**：fixture commit + docs commit |
| 部署把關 | 必須人工確認**不會部署 sample 內容**到正式 GitHub Pages / Blogger |

### 5.2 觸發條件

- 必須人工確認部署流程能隔離 `_sample-` 內容；或
- 作者在正式建立第一篇系列文章之前不執行；或
- 先設計 noindex / staging dist 機制再執行。

---

## 6. Phase 8-g 候選清單（含狀態）

| # | 候選 | 狀態 | 簡述 |
|---|---|---|---|
| 1 | validation / report 補強 | ⚠️ `partially landed` | 3 條 warning 已於 Phase 8-g-2-d-b / c / d 落地（詳見 §11）；剩餘 `series-number-duplicate` 仍 `candidate`（需 fixture 配套）；series report（`dist-reports/series.txt`）仍 `candidate` |
| 2 | `new-post.js` series 欄位提示 | ✅ `landed` | 已於 Phase 8-g-2-b1 / b2 / c-b / c-c 落地（詳見 §10）|
| 3 | series number gap filling 規則 | ✅ `landed` | 已於 Phase 8-g-2-c-b / c-c 落地，採 stderr-only 保守路線（詳見 §10）|
| 4 | FB `.txt` 顯示 `titleEn` / `seriesResolvedTitle` | `not recommended` | 屬 Phase 8-f-6-a 既有保守決策（FB 字長受限）；如未來改變需另開規格 |
| 5 | site default hashtags | `candidate` | 設定層補 site-level 預設 hashtags（hashtags fallback chain 之上游補強）|
| 6 | first article `.fb.md` hashtags fallback | `candidate` | 系列首篇可繼承上一篇 `.fb.md` hashtags（前篇延續策略）|
| 7 | Blogger tags inheritance | `candidate` | Blogger 平台 `tags` 從 series 繼承（與 FB hashtags 之 series.hashtags 繼承平行設計；注意格式分離原則，見 `docs/fb-sidecar-schema.md` §12.3.1）|
| 8 | H1 接 series `titleTemplate` | `not recommended` | 屬 Phase 8-f-5-c §17.3 既有保守決策（SEO 風險、字長風險）；如未來改變需另開規格 |
| E | fixture / sample end-to-end 驗證 | `deferred` | 本文件 §5 已詳述；部署風險需獨立批次排程 |

### 6.1 狀態定義

- `candidate`：可進入後續 Phase 8-g-X 批次；待作者另行排程；無結構性阻擋。
- `landed`：已落地；對應實作 commit 與設計細節詳見對應 phase 子批次紀錄。
- `partially landed`：部分子規格已落地，仍有候選未完成；對應實作 commit 與剩餘候選詳見對應 phase 子批次紀錄。
- `deferred`：有價值但有風險或前置條件未滿足；待條件成熟（如 fixture 觸發樣本、部署隔離機制等）。
- `not recommended`：依既有保守決策不建議接入；如未來改變需另開規格。

---

## 7. validate-content baseline

本批為純文件批次，預期 baseline 不變：

- **0 error / 9 warning on 5 post(s)**
- 既有 9 warnings：
  - `github/posts/20260504-github-pages-blog-planning.md`：`body-leading-h1`、`frontmatter-uses-deprecated-type`
  - `github/posts/20260504-portable-blog-system-mvp.md`：`body-leading-h1`、`frontmatter-uses-deprecated-type`
  - `validation-fixtures/github/posts/_test-fb-titleEn.md`：`fb-md-titleEn-invalid-type`
  - `validation-fixtures/github/posts/_test-series-not-object.md`：`series-not-object`
  - `validation-fixtures/github/posts/_test-series-validation.md`：`series-id-invalid`、`series-number-invalid`、`series-subtitle-invalid-type`

---

## 8. 相關文件（不在本批修改）

本批僅新增本文件；不修改既有 docs。如未來進入 Phase 8-g-1 fixture 落地批次或其他候選實作批次，建議閱讀以下作為背景：

- `docs/series-schema.md` §15-§19（Phase 8-f 各子批次落地紀錄）
- `docs/phase-8f-completion-report.md`（Phase 8-f 完整 12 commits 收尾）
- `docs/promotion-export.md` §10（promotion manifest 4 個 additive 欄位之 schema 與 fallback chain）
- `docs/fb-sidecar-schema.md` §12.3.1（Blogger tags 與 FB hashtags 格式分離原則）

---

## 9. 後續路線

本批完成後，**Phase 8-g 進一步實作批次需作者另行批准**。下一個可考慮之最小批次（建議由作者選擇）：

- **方案 A**：暫停實作，保留乾淨停止點。
- **方案 B**：docs cross-link 收斂（最小風險）。
- **方案 D**：`new-post.js` series 欄位提示（純工具改良）。
- **候選 1 / 5 / 6 / 7** 其中之一（屬 `candidate` 狀態之最小實作批次）。

方案 E（fixture 落地）屬本文件 §5 範圍，建議待部署隔離機制就緒後再執行。

> **追記（Phase 8-g-2-c-d）**：方案 D 已於 Phase 8-g-2-b / c 系列共 4 commits 完整落地（詳見 §10）。下一步候選收斂為：候選 1（validate 規則）、docs consistency（候選 C）、Phase 8-g-2 completion report。詳見 `docs/future-roadmap.md` §5.1。

---

## 10. Phase 8-g-2 落地紀錄（new-post.js series prompt + next number suggestion）

> 批次：Phase 8-g-2-b1 / 8-g-2-b2 / 8-g-2-c-b / 8-g-2-c-c（共 4 commits）
> 本節屬 Phase 8-g-2-c-d 批次新增之追記；§1-§9 為 Phase 8-g-0-b 之 2026-05-11 原始紀錄，狀態以 §6 更新版為準。

### 10.1 落地子批次清單

| 子批次 | 範圍 | Commit |
|---|---|---|
| 8-g-2-b1 | new-post.js 模板 `type` → `contentKind` 修正（修 deprecated）| `fa7d825` |
| 8-g-2-b2 | new-post.js 加 series CLI flags（`--series-id` / `--series-number` / `--series-subtitle`）| `bb58b2d` |
| 8-g-2-c-b | `src/scripts/suggest-series-number.js` 純函式 helper 落地（無 caller）| `2262938` |
| 8-g-2-c-c | new-post.js 接入 stderr-only next series.number suggestion | `2507748` |

### 10.2 保守設計原則

| 維度 | 設計 |
|---|---|
| series 區塊輸出條件 | 僅當 `--series-id` 有提供時輸出 series 區塊 |
| series CLI flags | 純手動輸入；**無互動 prompt**；無 readline / inquirer |
| next number suggestion 輸出位置 | **僅** `stderr`；stdout template **永不**自動寫入 suggested number |
| 觸發條件 | `--series-id` 有提供 + `--series-number` **未**提供 |
| 手動 `--series-number` 行為 | **永遠優先**；提供時**完全不顯示**自動建議 |
| 使用者最終決定 | 仍須自行加 `--series-number` 才寫入模板 |
| dist 影響 | ❌ 完全不影響 `dist` / `dist-blogger` / `dist-promotion` baseline |
| build pipeline 接入 | new-post.js 與 helper 皆不參與 build pipeline |
| validate baseline | 不變（helper 為純函式；無 validate-content import）|
| 外部套件 | 無新增；沿用既有 `fast-glob` + `gray-matter` 相依 |
| I/O 失敗 fallback | scan I/O 失敗 → stderr warning；stdout template 仍正常輸出 |

### 10.3 CLI 範例

```bash
# 一般文章（無 series；行為與 Phase 8-g-2-b1 前一致）
node src/scripts/new-post.js my-slug

# 系列文章：提供 series-id，未提供 number → stderr 顯示建議
node src/scripts/new-post.js my-slug --series-id we-media-ai-52

# 系列文章：手動指定全部欄位（不顯示建議，stdout 直接輸出）
node src/scripts/new-post.js my-slug --series-id we-media-ai-52 --series-number 3 --series-subtitle 提問筆記本
```

### 10.4 詳細落地紀錄

詳細規格、helper API、stderr 訊息格式、scan 範圍 / 排除規則、Phase 8-f 既有 normalized.series 資料層之關係，見 `docs/series-schema.md` §20。

### 10.5 對 dist / build / validate 之影響

| 影響面 | 變動？ | 說明 |
|---|---|---|
| `npm run build:github` 輸出 | ❌ 不變 | new-post.js 不參與 build pipeline |
| `npm run build:blogger` 輸出 | ❌ 不變 | 同上 |
| `npm run build:promotion` 輸出 | ❌ 不變 | 同上 |
| `npm run validate:content` baseline | ❌ 不變 | helper 為純函式；無 validate-content import |
| `dist` / `dist-blogger` / `dist-promotion` baseline | ❌ 不變 | 無 build 觸發路徑變動 |
| `package.json` | ❌ 不變 | 無新增 npm script；無新增相依 |

---

## 11. Phase 8-g-2-d 落地紀錄（validate-content series warning 規則）

> 批次：Phase 8-g-2-d-a / 8-g-2-d-b / 8-g-2-d-c / 8-g-2-d-d / 8-g-2-d-f（本節屬 Phase 8-g-2-d-f 批次新增之追記）
> 範圍：候選 #1（validation / report 補強）之 3 條 series warning 落地紀錄；候選 `series-number-duplicate` 與 series report 仍 `candidate`

### 11.1 落地子批次清單

| 子批次 | Commit | 範圍 |
|---|---|---|
| 8-g-2-d-a | （無 commit；對話內分析）| validate series warning 規則讀取分析 |
| 8-g-2-d-b | `e70af85` | `validate-content.js` 加 `series-id-not-in-settings` warning |
| 8-g-2-d-c | `bf58364` | `validate-content.js` 加 `series-block-missing-number` warning |
| 8-g-2-d-d | `ca0381a` | `validate-content.js` 加 `series-subtitle-without-id` warning |

### 11.2 保守設計原則

| 維度 | 設計 |
|---|---|
| severity | 皆 `warning`（不升 error；不阻擋 build / `validate:content` exit code）|
| 觸發範圍 | 與既有 Phase 8-e-5-b series 規則一致（僅 ready / published；drafts / archived 由 `load-posts` 過濾不進）|
| settings 載入路徑 | 未擴充；`settings.series` 已由 Phase 8-f-2-b plumbing 載入並傳入 `validateContent` |
| `loadPosts` 行為 | 未修改 |
| fixture | 未新增（未動 `content/validation-fixtures/`）|
| baseline 影響 | ❌ 不變（`0 error(s) / 9 warning(s) on 5 post(s)`）|
| dist 影響 | ❌ 不變 |
| 外部套件 | 無新增 |

### 11.3 規則邊界（避免重複觸發）

| 場景 | 觸發之規則 |
|---|---|
| `series` 非 plain object（string / array / number / boolean / null）| `series-not-object`（既有）|
| `series` 為 object，`s.id` `defined` 但為空字串 / 非 string | `series-id-invalid`（既有）|
| `series` 為 object，`s.id` valid，settings 找不到 | **`series-id-not-in-settings`**（8-g-2-d-b；本系列）|
| `series` 為 object，`s.id` valid，`s.number === undefined` | **`series-block-missing-number`**（8-g-2-d-c；本系列）|
| `series` 為 object，`s.number` defined 但非正整數 | `series-number-invalid`（既有）|
| `series` 為 object，`s.subtitle` defined（任何型別）且 `s.id === undefined` | **`series-subtitle-without-id`**（8-g-2-d-d；本系列）|
| `series` 為 object，`s.subtitle` defined 但非 string | `series-subtitle-invalid-type`（既有）|

關鍵互斥 / 共存保證：
- `series-id-invalid` ⟷ `series-id-not-in-settings`：互斥。前者在 `s.id` 非 valid 時觸發；後者要求 `s.id` 已通過 valid 檢查
- `series-id-invalid` ⟷ `series-subtitle-without-id`：互斥。前者要求 `s.id !== undefined`；後者要求 `s.id === undefined`
- `series-block-missing-number` ⟷ `series-number-invalid`：互斥。前者在 `s.number === undefined` 觸發；後者在 `s.number !== undefined` 但非正整數時觸發
- `series-subtitle-without-id` ⟷ `series-subtitle-invalid-type`：**可共存**。前者檢查結構配對（subtitle 不論型別 + id 缺漏）；後者檢查型別（subtitle 存在但非 string）。subtitle 為非 string 且 id 缺漏時，兩條 warning 同時觸發

### 11.4 仍未落地之候選

| 候選 rule key | 規格依據 | 狀態 | 備註 |
|---|---|---|---|
| `series-number-duplicate` | series-schema §5.3 | `candidate`（屬 Phase 8-g-2-d-e）| 需 ≥ 2 篇 same id same number 觸發樣本 + fixture 配套；單獨排程；本系列**未實作**，不應視為已完成 |
| series report（`dist-reports/series.txt`）| 8-g-0-b §6 候選 #1 | `candidate` | 屬「報表」延伸；與 `series-number-duplicate` 配套；本系列未實作 |
| Phase 8-g-2-d completion report | — | `candidate`（屬 Phase 8-g-2-d-g）| Phase 8-g-2-d 系列收尾報告；本批僅 docs 補強，未產出 completion report |

### 11.5 cross-link

- `docs/series-schema.md` §21（Phase 8-g-2-d validate-content series 規則接入實況）
- `docs/future-roadmap.md` §3.3（Phase 8-g-2-d 落地摘要）
- `docs/phase-8g-2-completion-report.md`（Phase 8-g-2 new-post.js prompt 系列收尾；scope 不含 8-g-2-d；不在本批修改）
