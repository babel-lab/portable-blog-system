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
| 1 | validation / report 補強 | `candidate` | series 相關 validate 規則擴充（如 series number 重複、titleTemplate unresolved 升級為 warning）；可選 series report（`dist-reports/series.txt`）|
| 2 | `new-post.js` series 欄位提示 | `candidate` | 新建文章流程提示作者選填 series 區塊；純 stdout 工具改良，不影響 dist |
| 3 | series number gap filling 規則 | `deferred` | 需先有 series fixture / 真實 series posts；無觸發樣本即無法實證 |
| 4 | FB `.txt` 顯示 `titleEn` / `seriesResolvedTitle` | `not recommended` | 屬 Phase 8-f-6-a 既有保守決策（FB 字長受限）；如未來改變需另開規格 |
| 5 | site default hashtags | `candidate` | 設定層補 site-level 預設 hashtags（hashtags fallback chain 之上游補強）|
| 6 | first article `.fb.md` hashtags fallback | `candidate` | 系列首篇可繼承上一篇 `.fb.md` hashtags（前篇延續策略）|
| 7 | Blogger tags inheritance | `candidate` | Blogger 平台 `tags` 從 series 繼承（與 FB hashtags 之 series.hashtags 繼承平行設計；注意格式分離原則，見 `docs/fb-sidecar-schema.md` §12.3.1）|
| 8 | H1 接 series `titleTemplate` | `not recommended` | 屬 Phase 8-f-5-c §17.3 既有保守決策（SEO 風險、字長風險）；如未來改變需另開規格 |
| E | fixture / sample end-to-end 驗證 | `deferred` | 本文件 §5 已詳述；部署風險需獨立批次排程 |

### 6.1 狀態定義

- `candidate`：可進入後續 Phase 8-g-X 批次；待作者另行排程；無結構性阻擋。
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
