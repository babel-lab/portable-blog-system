# Phase 8-e 完成報告

本文件為 Phase 8-e 之整體驗收與完成紀錄。Phase 8-e 圍繞「系列文章與 FB 推廣 metadata 之 schema 規格化」展開：正式定義 `series` metadata、補強 `.fb.md` schema 之 `titleEn` 欄位、建立對應 sample / template、並落地 validate-content 之 warning-only 結構檢查。

對應之上層規範詳見：
- `docs/series-schema.md`（Phase 8-e-1 之 14 節規格）
- `docs/fb-sidecar-schema.md`（Phase 8-e-2 補強之 `titleEn` 欄位與 §3.4 title metadata 分工）
- `docs/publish-bundle.md` §2.6（內容屬性 / 平台回填分工原則）
- `docs/phase-8d-completion-report.md`（前一階段完成基線；含 normalized 接入之邊界）

---

## §1 Phase 8-e 目標摘要

Phase 8-e 之核心目標：

1. **建立 series metadata 規格**（`docs/series-schema.md`）：定義 `series.id` / `name` / `nameEn` / `number` / `subtitle` / `titleTemplate` / `hashtags` 之語意、跨平台共用原則、`series.id` 穩定性、發布順序解耦、自動建議序號之**規格**（不在本階段實作）
2. **補強 FB sidecar schema**（`docs/fb-sidecar-schema.md`）：正式新增 `titleEn` 為 `.fb.md` 第 8 個 frontmatter 欄位；補 Blogger title / FB title / titleEn 分工總表；明列 series 相關欄位（`seriesNumberOverride` / `hashtagsInheritFromSeries` / `seriesTitleOverride`）為後續批次待定
3. **建立最小可參考之 sample / template**：`_sample.fb.md` 加入 `titleEn`、新增 `_sample.series.json`（系列集中設定範本）、`_sample-series-post.md`（含 series 區塊之文章範本）
4. **落地 warning-only 結構檢查**（`src/scripts/validate-content.js`）：5 條規則涵蓋 `.fb.md` `titleEn` 型別與文章 `series` 結構（`series-not-object` / `id` / `number` / `subtitle`）

Phase 8-e 屬**規格與規範**性質，**不實作**自動序號邏輯、hashtags 繼承、缺號驗證、series.id 對應驗證等行為層功能；亦**不改 build output 結構**。

---

## §2 Commit 清單

Phase 8-e 共 5 個 commit：

| # | 批次 | Commit | 訊息標題 | 類型 |
|---|---|---|---|---|
| 1 | **8-e-1** | `a882888` | docs(phase-8e): define series metadata schema | 規格文件 |
| 2 | **8-e-2** | `ccec77e` | docs(phase-8e): add titleEn to facebook sidecar schema | schema 補強 |
| 3 | **8-e-3** | `331a158` | chore(phase-8e): add titleEn to facebook sidecar sample | sample 補強 |
| 4 | **8-e-4** | `3ce4c30` | chore(phase-8e): add series metadata samples | sample / template / docs 補強 |
| 5 | **8-e-5-b** | `aadecb5` | feat(phase-8e): validate fb sidecar titleEn and article series fields | validate-content 規則落地 |

另含分析批次（純讀取，無 commit）：
- 8-d-4-a（屬 Phase 8-d 範圍，分析 promotion）
- 8-e-5-a（validate-content 規則分析）

線性歷史，無 amend、無 rebase。

---

## §3 Blogger / FB titleEn 對齊情況

Phase 8-e 完成後，五處 title metadata 之分工已明確規範（詳見 `docs/fb-sidecar-schema.md` §3.4、`docs/series-schema.md` §6 / §7）：

| 欄位 | 位置 | 用途 |
|---|---|---|
| `.md` frontmatter `title` | 文章層 | 文章本體標題（既有；Phase 1 起） |
| `.md` frontmatter `titleEn` | 文章層 | 文章本體英文標題（既有；CLAUDE.md §3.1 範例已存在） |
| `.publish.json` `seo.metaTitle` | 發布層 | SEO override；空字串時 fallback 至 `.md` `title` |
| `.fb.md` frontmatter `title` | FB 推廣層 | FB 貼文標題；空字串時 fallback 至 `.md` `title` |
| `.fb.md` frontmatter `titleEn` | FB 推廣層 | **Phase 8-e-2 落地**；FB 英文 metadata 保留欄位（目前 FB 端可暫不顯示） |

**關係原則**：

- Blogger 文章 title 與 FB 貼文 title 預設可相同（SEO 一致性）
- 允許後續手動修改，validate 不強制鎖死
- `titleEn` 屬跨平台 metadata 保留欄位；FB 端可暫不顯示，但欄位保留供未來 SEO / GitHub / 跨平台轉換使用

---

## §4 Facebook sidecar schema 補強內容

`docs/fb-sidecar-schema.md` 於 Phase 8-e-1 / 8-e-2 期間累積以下變動：

### 4.1 frontmatter 欄位表擴充（Phase 8-e-2）

`§3.1 欄位總表` 從 7 欄位擴充為 **8 欄位**：

```
enabled / page / target / customUrl / hashtags / title / titleEn(新) / note
```

`titleEn` 規格：

- 型別：string
- 必填：否
- 預設：`""`（空字串時 build 階段 fallback 至 `.md` frontmatter `titleEn`）
- 用途：FB 貼文英文標題 metadata，FB 端目前可暫不顯示，欄位保留供未來使用

### 4.2 新增 §3.4「Blogger title / FB title / titleEn 之關係」

提供 5 列分工表 + 3 條關係原則（SEO 一致性 / 可手動修改不鎖死 / titleEn 為跨平台保留欄位），cross-link 至 `docs/series-schema.md` §6 / §7。

### 4.3 §12 跨文件分工補入 series cross-link（Phase 8-e-1 加入；8-e-2 微調）

`§12 與系列文章 metadata 之分工`：

- §12.1：series 不放 `.fb.md`
- §12.2：後續批次預告（titleEn 已落地 / TBD 三項：`seriesNumberOverride` / `hashtagsInheritFromSeries` / `seriesTitleOverride`）
- §12.3：hashtags 預設來源與 series 之關係；**Phase 8-e-2 本批只定義 schema 文件**，`build-promotion.js` 之 hashtags 行為不改
- §12.4：title 與 series 之關係（含 titleEn 延伸）

---

## §5 Article series metadata schema 補強內容

`docs/series-schema.md`（Phase 8-e-1 新增，共 14 節）規範以下內容：

### 5.1 欄位字典（§2）

7 個 series 欄位之語意、型別、必填、預設：

```
series.id / name / nameEn / number / subtitle / titleTemplate / hashtags
```

當文章 frontmatter 含 `series:` 區塊時，`series.id` 與 `series.number` 為必填；其餘選填。

### 5.2 穩定性與排序（§3 / §4）

- `series.id` 一旦寫入即不可修改；`series.name` 可修改而不影響 id
- `series.number` 為創作層級編號，**非發布順序**
- 排序依 `.publish.json` `publishedAt` / `status` / `publishedUrl` 與 build script 之既有規則決定

### 5.3 自動建議序號規則（§5）

- 補缺號優先（已有 `#1 / #2 / #4` → 建議 `#3`），無缺號則 max+1
- 作者必須可手動覆寫
- **本階段規格化，不在 Phase 8-e 實作**

### 5.4 title / titleEn / hashtags 規則（§6 / §7 / §8）

- 三處 title 預設相同（SEO 一致性），允許後續手動修改不鎖死
- `titleEn` 為 Blogger / FB metadata 共保留欄位
- hashtags 預設可從 `series.hashtags` 或第一篇文章帶出；單篇可完整覆寫；**不採自動合併**
- **以上預設帶出邏輯本階段規格化，不在 Phase 8-e 實作**

### 5.5 schema 落地點（§11）

- 候選 A（分散於 `.md` frontmatter）vs 候選 B（集中於 `content/settings/series.json`）兩種策略
- 建議候選 B + 文章層覆寫
- `_sample.series.json` 之 array-of-objects 結構於 Phase 8-e-4 落地

### 5.6 與 `.publish.json` / `.fb.md` 之分工（§9 / §10）

- series 屬內容屬性，**不放** `.publish.json`、**不放** `.fb.md`
- `.fb.md` 之 series 互動欄位皆為 TBD（不在本階段加入）

---

## §6 Sample / fixture 補強內容

### 6.1 `content/templates/_sample.fb.md`（Phase 8-e-3 修改）

- frontmatter 加入 `titleEn: ""`（位置：`title` 後、`note` 前；與 fb-sidecar-schema.md §3.1 表格順序一致）
- header 註解列加入第 6 點：說明 `titleEn` 為 FB 英文標題 metadata，目前可暫不顯示但欄位保留

### 6.2 `content/settings/_sample.series.json`（Phase 8-e-4 新增）

- 採 **array-of-objects** 結構：`{ "series": [{ id, name, nameEn, titleTemplate, hashtags }] }`
- 單一系列範例：`we-media-ai-52` / 「自媒自創：AI玩轉自媒體的52個商業思維」
- 補 `$comment` 4 行（沿用 `_sample.publish.json` 風格）：範本注意事項、`series.id` 穩定性、hashtags 繼承待後續、build 系統尚未自動讀取
- **未加入未正式支援之自動欄位**（`seriesNumberOverride` / `hashtagsInheritFromSeries` / `seriesTitleOverride`）

### 6.3 `content/templates/_sample-series-post.md`（Phase 8-e-4 新增）

- frontmatter 包含：`title` / `titleEn` / `description` / `contentKind` / `status` / `date` / `series.{id, number, subtitle}`
- header 註解 5 點明確示範：`series.number` 非發布順序、可手動覆寫、系統可建議補缺號最小值
- body 簡短，**不示範 placeholder 套用**（避免誤導；具體實作屬後續批次）

### 6.4 `docs/series-schema.md` §11.3 / §13 同步更新（Phase 8-e-4）

- §11.3：將原 object-keyed 候選結構替換為實際 array-of-objects 結構，明列「採 array 之原因」
- §13：從「本批不建立 sample」改為「Phase 8-e-4 已落地」並列出兩個 sample，明確標示**不代表系統行為已啟用**

---

## §7 validate-content 新增 warning-only 規則摘要

Phase 8-e-5-b（commit `aadecb5`）於 `src/scripts/validate-content.js` 加入 **5 條 warning-only 規則**（+77 行；單檔變動）：

| # | Rule type | 觸發條件 | 觸發範圍 |
|---|---|---|---|
| 1 | `fb-md-titleEn-invalid-type` | `.fb.md` frontmatter `titleEn` 存在但非 string（空字串視為合法） | `.fb.md` 存在時 |
| 2 | `series-not-object` | `post.series` 存在但非 plain object（含 null / array） | ready/published |
| 3 | `series-id-invalid` | `series.id` 存在但非 non-empty string | ready/published |
| 4 | `series-number-invalid` | `series.number` 存在但非正整數 | ready/published |
| 5 | `series-subtitle-invalid-type` | `series.subtitle` 存在但非 string | ready/published |

**設計原則**：

- 全部 warning-only，**無新增 error**
- **不改既有 ready / published 阻擋邏輯**（error 規則完全不動）
- 觸發範圍與 `invalid-content-kind` / `invalid-primary-platform` 一致（series 規則）或與其他 `fb-md-*` 一致（titleEn 規則）
- 現有 fixture 無 `series` 區塊、無 `.fb.md` sidecar 之 titleEn，故 **5 條新規則 0 觸發**

---

## §8 本階段未實作項目

下列項目**明確不在 Phase 8-e 範圍**：

1. **不實作自動序號**（series.number 補缺號建議；屬 `new:post` 或更晚批次工具）
2. **不實作 hashtags 繼承**（從 `series.hashtags` 自動帶出至文章 / `.fb.md`；屬 build script 接入批次，建議 Phase 8-e-6 或更晚）
3. **不驗證缺號**（同系列 `series.number` 缺號 / 重號之 validate 規則）
4. **不驗證 `series.id` 與 `_sample.series.json` 對應**（`content/settings/series.json` 正式建立前不掃描）
5. **不改 Blogger / GitHub / promotion build output 結構**（不動 build:github / build:blogger / build:promotion 之輸出格式）

延伸未實作項：

- `_sample.series.json` 之 build 系統接入（loadSettings 是否自動讀取）
- `series.titleTemplate` placeholder 解析（如 `{series.name}` / `{series.number}` 等）
- `.fb.md` schema 之 TBD 欄位（`seriesNumberOverride` / `hashtagsInheritFromSeries` / `seriesTitleOverride`）
- 文章 frontmatter `titleEn` 之 type 驗證（屬可選；Phase 8-e-5 評估後刻意未加，與現有 fixture 行為無關聯）

以上皆於各批次（8-e-1 / 8-e-2 / 8-e-3 / 8-e-4 / 8-e-5-b）明確記錄為「後續批次待定」或「TBD」狀態。

---

## §9 驗證結果摘要

Phase 8-e-5-b 落地時（commit `aadecb5`）已執行完整 sweep：

| 驗證項目 | 結果 |
|---|---|
| `node --check src/scripts/validate-content.js` | ✅ 通過 |
| `npm run validate:content` | ✅ 0 error / 4 warning（皆為既有 `body-leading-h1` × 2 + `frontmatter-uses-deprecated-type` × 2；**與 Phase 8-e 啟動前基線完全相同**） |
| `npm run build:github` | ✅ done in 105ms（含 validate 0 error / 2 warning） |
| `npm run build:blogger` | ✅ done in 46ms（含 validate 0 error / 2 warning；dist-blogger byte-identical modulo timestamps） |
| `npm run build:promotion` | ✅ done in 42ms（dist-promotion byte-identical modulo `generatedAt` / `generated`） |
| `dist/.gitkeep` / `dist-blogger/.gitkeep` / `dist-promotion/.gitkeep` | ✅ 無動（無需 restore） |
| JSON 格式檢查（Phase 8-e-4） | ✅ `node -e "JSON.parse(...)"` → OK |

**5 條新 warning-only 規則於現有 fixture 觸發次數：0**（現有 fixture 無 series 區塊、無 `.fb.md` 含 titleEn；屬預期行為）。

無任何 dist / build output / 既有 warning / error 變動。

---

## §10 後續 Phase 8-f 或下一階段建議

### 10.1 Phase 8-e 已可正式視為完成

- 5 個 commit 全部落地（8-e-1 至 8-e-5-b）
- schema / sample / validate 三層皆有對應落地（schema = 8-e-1 / 8-e-2、sample = 8-e-3 / 8-e-4、validate = 8-e-5-b）
- validate 規則 0 觸發於現有 fixture（無 regression）
- 與 Phase 8-d 邊界清晰（series / titleEn / FB sidecar schema 擴充屬 8-e；normalized 接入屬 8-d）

### 10.2 候選後續批次（依優先序）

| 候選批次 | 範圍 | 風險 | 推薦度 |
|---|---|---|---|
| **Phase 8-e-6**（候選） | build script 接入 `content/settings/series.json`：loadSettings 讀取、傳給 build-github / blogger / promotion；`series.titleTemplate` placeholder 解析 | 中（需處理 dist byte-identical） | ⭐ 若希望系列文章自動產生標題，優先做 |
| **Phase 8-e-7**（候選） | `new:post` 之自動序號建議邏輯（補缺號優先、可手動覆寫） | 低（工具腳本，不影響 build） | ⭐ 若新增系列文章頻繁，優先做 |
| **Phase 8-d-X1**（Phase 8-d 延後項） | `blogger-copy-helper.ejs` / `blogger-publish-checklist.ejs` 接 normalized（Phase 8-d 設計 §12 item 6） | 低 | ⭐ Phase 8-d 收尾，可補完 |
| **Phase 8-d-X2**（Phase 8-d 延後項） | `validate-content.js` 接 `normalized.validationMeta.warnings` traceability（Phase 8-d 設計 §12 item 5） | 低 | 可選 |
| **Phase 8-f**（書評文章模組擴充） | `comicGallery` / Book JSON-LD / FAQ JSON-LD / CTA partial（CLAUDE.md §7.6） | 中 | ⭐ 若有書評內容增長需求 |

### 10.3 強烈建議：下一批保持小批次

沿用 Phase 8-d / 8-e 之拆批節奏：

- 每批一個小目標（如「8-e-6-a 分析」/「8-e-6-b 實作」/「8-e-6-c docs / completion」）
- byte-identical（modulo timestamps）為硬性承諾
- 規則新增以 warning-only 為主，避免引入新 error

---

## §11 安全限制確認

| 項目 | 狀態 |
|---|---|
| 是否未 push | ✅ 未 push |
| 是否未設定 remote | ✅ 未設定（`git remote -v` 空輸出） |
| 是否未 amend | ✅ 未 amend（Phase 8-e 全部 5 個 commit 皆為新建） |
| 是否未 rebase | ✅ 未 rebase（線性歷史） |

---

（本文件結束）
