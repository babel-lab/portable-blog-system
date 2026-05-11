# Phase 8-f 完成報告

本文件為 Phase 8-f 之整體驗收與完成紀錄。Phase 8-f 圍繞「series metadata 接入 build pipeline」展開：建構 series 設定層、loader 通道、normalize.series 資料層、純函式 helper、Blogger copy-helper 輔助區塊、promotion manifest additive 欄位、series.hashtags inheritance backfill。

對應之上層規範詳見：
- `docs/series-schema.md`（Phase 8-e-1 之原始規格 + §15-§19 累積落地紀錄）
- `docs/fb-sidecar-schema.md` §8 / §12（hashtags 規則 + 與 series 之分工）
- `docs/promotion-export.md` §9 / §10（promotion manifest 之 normalized / series 接入紀錄）
- `docs/phase-8e-completion-report.md`（Phase 8-e 完成基線；含 schema 規格化階段）

---

## §1 Phase 8-f 目標摘要

Phase 8-f 之核心目標：

1. **建構 series 設定資料層**：`content/settings/series.json` + `loadSettings()` 接入；提供集中管理之系列定義
2. **建構 loader 通道**：`loadPosts` / `loadBloggerPosts` 接受 `settings` 參數；callers 統一轉發至 `normalizePostOutput`
3. **建構 normalized.series 統一形狀**：8 欄位 schema 含 7 種 raw post.series 狀態之解析邏輯與 validationMeta 追蹤
4. **建構 series.titleTemplate placeholder helper**：純函式 module；7 個支援 placeholder；unresolved 保留原文
5. **首次 caller 接入（保守路線）**：Blogger copy-helper [11] 系列組合標題輔助區塊；**不取代 [1] 主標題**
6. **promotion manifest 暴露 series / titleEn 資料**：4 個 additive 欄位；**不取代 entry.title / fbTitle / 不改 FB `.txt`**
7. **series.hashtags fallback chain**：擴充 `normalized.promotion.facebook.hashtags` 之 fallback；**僅 FB promotion 端；不改 Blogger `post.tags`**

Phase 8-f 屬**漸進 caller 接入**性質；**所有變動對既有 fixture 保證 byte-identical**（modulo timestamps + EJS scriptlet 尾隨空白）。

---

## §2 Commit 清單

Phase 8-f 共 12 個 commit（6 個 feat + 5 個 docs + 1 個 chore；line性歷史；無 amend / 無 rebase）：

| # | 子系列 | Commit | 訊息標題 | 類型 |
|---|---|---|---|---|
| 1 | **8-f-1** | `e2d50c5` | feat(phase-8f): add series.json settings and load via loadSettings | settings 層接入 |
| 2 | **8-f-2-b** | `2c4682f` | chore(phase-8f): plumb settings through load-posts to normalize | loader plumbing |
| 3 | **8-f-3-b** | `dfbd35e` | feat(phase-8f): add normalized.series resolution in normalize-post-output | normalized.series 資料層 |
| 4 | **8-f-3-c** | `b7c8781` | docs(phase-8f): document normalized.series landing in series-schema | docs §15 / §11.3 |
| 5 | **8-f-4-b** | `e097ac5` | feat(phase-8f): add resolve-series-title helper | placeholder helper |
| 6 | **8-f-4-c** | `d94f62e` | docs(phase-8f): document resolve-series-title helper in series-schema | docs §16 |
| 7 | **8-f-5-b** | `abf8c5e` | feat(phase-8f): apply series titleTemplate in blogger copy-helper | copy-helper [11] 接入 |
| 8 | **8-f-5-c** | `14e8caa` | docs(phase-8f): document blogger copy-helper series title landing | docs §17 |
| 9 | **8-f-6-b** | `7741655` | feat(phase-8f): add series and titleEn fields to promotion manifest | promotion manifest additive |
| 10 | **8-f-6-c** | `0c963ea` | docs(phase-8f): document promotion manifest additive fields landing | docs §18 |
| 11 | **8-f-7-b** | `592d45c` | feat(phase-8f): inherit series hashtags in normalized promotion.facebook | hashtags fallback backfill |
| 12 | **8-f-7-c** | `a738491` | docs(phase-8f): document series.hashtags inheritance landing | docs §19 |

另含 8 個分析批次（純讀取，無 commit）：
- 8-f-0 / 8-f-2-a / 8-f-3-a / 8-f-4-a / 8-f-5-a / 8-f-6-a / 8-f-7-a / 8-f-8-a

---

## §3 落地能力總表

| # | 接入點 | 落地批次 | 主要檔案 | 對既有 fixture 之影響 |
|---|---|---|---|---|
| 1 | **`content/settings/series.json` + loadSettings 接入** | 8-f-1 | `content/settings/series.json`（新增；`{"series":[]}`）+ `src/scripts/load-settings.js` | 無（settings 暴露但無 caller 使用） |
| 2 | **loader plumbing**（loadPosts / loadBloggerPosts 接 settings） | 8-f-2-b | `src/scripts/load-posts.js` / `load-blogger-posts.js` + 4 callers（validate-content / build-github / build-blogger / build-promotion）| 無（settings 轉發；normalize 暫不用） |
| 3 | **`normalized.series` 資料層** | 8-f-3-b | `src/scripts/normalize-post-output.js`（series 區塊：7 種狀態解析 + 8 欄位 + validationMeta） | 無（無 caller 讀 normalized.series） |
| 4 | **`resolve-series-title.js` helper** | 8-f-4-b | `src/scripts/resolve-series-title.js`（新增；3 export / 7 placeholder） | 無（無 caller import） |
| 5 | **Blogger copy-helper [11] 系列組合標題輔助區塊** | 8-f-5-b | `src/scripts/build-blogger.js` + `src/views/blogger/blogger-copy-helper.ejs` | byte-identical（無 series fixture → [11] 區塊不顯示） |
| 6 | **promotion manifest additive 4 欄位**（titleEn / fbTitleEn / seriesResolvedTitle / seriesTitleUnresolvedPlaceholders） | 8-f-6-b | `src/scripts/build-promotion.js` | dist-promotion `.txt` byte-identical；manifest JSON 新增 4 欄位 |
| 7 | **`series.hashtags` inheritance backfill**（normalized.promotion.facebook.hashtags fallback chain） | 8-f-7-b | `src/scripts/normalize-post-output.js`（post-pass backfill） | byte-identical（既有 fixture fb hashtags 非空 → backfill 不觸發） |

---

## §4 sample / fixture / settings 之 series 接入狀態

| 資產 | 狀態 | 路徑 |
|---|---|---|
| `_sample.series.json` | ✅ 已存在（Phase 8-e-4 + 8-f-1 對齊）| `content/settings/_sample.series.json`（含 1 筆範例 + `$comment`）|
| **`series.json`（正式）** | ✅ 已建立（Phase 8-f-1） | `content/settings/series.json`（`{"series":[]}` 空 array）|
| `_sample-series-post.md` | ✅ 已存在（Phase 8-e-4） | `content/templates/_sample-series-post.md` |
| `_sample.fb.md`（含 titleEn） | ✅ 已落地（Phase 8-e-3） | `content/templates/_sample.fb.md` |
| 正式 content 之 series fixture | ❌ **不存在**；所有 ready post 皆無 series 區塊 | — |
| validation-fixtures 之 series（invalid 觸發樣本）| ✅ 已存在（Phase 8-e-6-b-2） | `content/validation-fixtures/github/posts/_test-series-*.md` |

**重要說明**：當前無**正式 ready post 帶 series**，故 Phase 8-f 之多項接入路徑（copy-helper [11] 顯示 / manifest seriesResolvedTitle 非 null / hashtags inheritance backfill）**未被 build dist 觸發**。所有邏輯經 inline node smoke test 驗證可行；end-to-end build fixture 屬獨立後續批次（詳見 §9）。

---

## §5 對既有 fixture 之 byte-identical 承諾

所有 12 commits 對**現有 fixture 之 dist / dist-blogger / dist-promotion 輸出實質完全 byte-identical**（modulo timestamps + EJS scriptlet 尾隨空白）：

| dist | 8-f-5-b / 8-f-6-b 對比基線 | 說明 |
|---|---|---|
| `dist/`（GitHub）| ✅ byte-identical | 不讀 normalized.series / 無新欄位影響 |
| `dist-blogger/posts/*/post.html` | ✅ byte-identical | 不讀 normalized.series |
| `dist-blogger/posts/*/meta.json` | ✅ byte-identical | buildMeta 不寫 series |
| `dist-blogger/posts/*/copy-helper.txt` | ✅ 實質 byte-identical（EJS scriptlet 尾隨空白除外；無 series → [11] 區塊不顯示） | 條件守衛確保無 series 時不渲染新區塊 |
| `dist-blogger/posts/*/publish-checklist.txt` | ✅ byte-identical | 不接入 |
| `dist-blogger/index/*.html` | ✅ byte-identical | 不接入 |
| `dist-promotion/facebook/*/*.txt` | ✅ **完全 byte-identical** | EJS 不讀新欄位 |
| `dist-promotion/facebook/all-posts-index.txt` | ✅ 實質 byte-identical（僅 `generated` 時間戳）| buildIndexText 不讀新欄位 |
| `dist-promotion/facebook/build-manifest.json` | ⚠️ 新增 4 個 additive 欄位 + `generatedAt` 時間戳；既有欄位 byte-identical | 設計預期（additive 不破壞既有 schema） |
| `.gitkeep` 三檔 | ✅ 不變 | 無需 restore |

**validate-content baseline**：`0 error / 9 warning on 5 post(s)` **完全不變**（4 條既有正式文章 warning + 5 條 fixture warning）。

---

## §6 已知延後項與不接入理由

下列 8 個項目於 Phase 8-f 期間**評估後選擇不接入**，列為後續批次候選：

| # | 候選項目 | 延後 / 不建議理由 |
|---|---|---|
| 1 | FB `.txt` 顯示 titleEn / fbTitleEn / seriesResolvedTitle | FB 文案字長受限（建議 < 60 chars）；標題行設計需評估 SEO / 搜尋一致性；屬獨立 EJS 設計批次 |
| 2 | site default hashtags | 無實際使用情境驗證；series.hashtags 已涵蓋系列文章需求；site-level 用例不明 |
| 3 | first article `.fb.md` hashtags fallback（series-schema §8.2 fallback 2） | 需「同系列 series.number 最小者」之跨 post 查找；複雜度高；當前 series.hashtags fallback 已可滿足主要場景 |
| 4 | Blogger `post.tags` inheritance | Blogger 標籤為短 slug（`github`），FB hashtags 為 `#` prefix；格式不互通；若要做需另設 `series.tags` 短 slug 欄位（非直接沿用 FB hashtags） |
| 5 | GitHub / Blogger 正式文章 H1 接 series titleTemplate | 取代 H1 會與 copy-helper [1] raw title 不一致；customer-facing SEO 風險高（series-schema.md §17.3 已明標）|
| 6 | `blogger-publish-checklist.ejs` 加 series 輔助區塊 | 與 copy-helper [11] 重複；publish-checklist 主要是 checkbox，加 series 標題只是 reminder；價值低 |
| 7 | `new-post.js` 支援 series 欄位提示 | 屬獨立工具改良；不影響 dist；可作為 Phase 8-f-9 / 8-f-10 候選 |
| 8 | series build fixture（end-to-end 驗證） | 會改變 dist baseline；正式 content 變動需精心設計；可作為「驗證資產」獨立批次 |

各候選若未來有實際需求，可獨立另開批次評估。

---

## §7 驗證結果摘要

Phase 8-f-8-b 落地時執行完整 sweep：

| 驗證項目 | 結果 |
|---|---|
| `node --check src/scripts/normalize-post-output.js` | ✅ 通過 |
| `node --check src/scripts/resolve-series-title.js` | ✅ 通過 |
| `node --check src/scripts/load-posts.js` | ✅ 通過 |
| `node --check src/scripts/load-blogger-posts.js` | ✅ 通過 |
| `node --check src/scripts/build-blogger.js` | ✅ 通過 |
| `node --check src/scripts/build-promotion.js` | ✅ 通過 |
| `npm run validate:content` | ✅ **0 error / 9 warning on 5 post(s)**（4 條既有 + 5 條 fixture；與基線完全相同） |
| `npm run build:github` | ✅ 通過 |
| `npm run build:blogger` | ✅ 通過 |
| `npm run build:promotion` | ✅ 通過 |
| `dist/.gitkeep` / `dist-blogger/.gitkeep` / `dist-promotion/.gitkeep` | ✅ 無動 |

額外 inline smoke test（Phase 8-f-4-b / 8-f-7-b 期間執行）：
- `resolveTitleTemplate` 之 placeholder 解析驗證
- `series.hashtags` inheritance backfill 之觸發 / 不觸發兩種情境

---

## §8 安全限制確認

| 項目 | 狀態 |
|---|---|
| 是否未 push | ✅ 未 push |
| 是否未設定 remote | ✅ 未設定（`git remote -v` 空輸出） |
| 是否未 amend | ✅ 未 amend（Phase 8-f 全部 12 個 commit 皆為新建） |
| 是否未 rebase | ✅ 未 rebase（線性歷史） |

---

## §9 後續批次建議

### 9.1 Phase 8-f 已可正式視為完成

- 主軸目標（settings / loader / normalize.series / helper / copy-helper [11] / promotion manifest additive / hashtags fallback）**7 大接入點皆已落地**
- 既有 fixture **完全 byte-identical**（無 regression）
- validate baseline 維持 `0 error / 9 warning on 5 post(s)`
- 與 Phase 8-d / 8-e 之完成度節奏一致

### 9.2 候選後續批次（依優先序）

| 候選 | 範圍 | 風險 | 推薦度 |
|---|---|---|---|
| **series build fixture（end-to-end）**| 新增正式 ready post 含 series；series.json 加 entry；驗證 dist 觸發路徑 | 中（會改變 dist baseline）| ⭐⭐⭐ 高（提供作者範例 + 實證驗證）|
| `new-post.js` 加 series 區塊 + 修正 legacy `type` → `contentKind` | 純工具改良；不影響 dist | 低 | ⭐⭐ 中 |
| `new-post.js` 自動建議 `series.number`（補缺號 / max+1） | series-schema §5 規格化邏輯實作 | 低 | ⭐ 低 |
| FB `.txt` 顯示 titleEn / fbTitleEn / seriesResolvedTitle | EJS 接入；需先評估文案長度策略 | 中 | ⭐ 低 |
| publish-checklist 加 series 輔助區塊 | 與 copy-helper [11] 重複 | 低 | ⭐ 低 |
| Blogger `post.tags` inheritance（需另設 `series.tags` slug 欄位）| 跨 schema 變動 | 中-高 | ❌ 不推薦 |
| GitHub / Blogger H1 接 series titleTemplate | customer-facing；違反「不取代主標題」原則 | 高 | ❌ 不推薦 |

### 9.3 強烈建議：下一批保持小批次

沿用 Phase 8-d / 8-e / 8-f 之拆批節奏：

- 每批一個小目標
- byte-identical（modulo timestamps + EJS whitespace）為硬性承諾
- 規則新增以 warning-only 為主，避免引入新 error
- 拆 a 分析 / b 實作 / c docs 三段

---

（本文件結束）
