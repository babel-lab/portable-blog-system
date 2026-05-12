# Phase 8-d 完成報告

本文件為 Phase 8-d 之整體驗收與完成紀錄。Phase 8-d 建立 normalized post output helper，將 normalized 掛入 `load-posts`，並讓 GitHub / Blogger / promotion 輸出逐步採用 normalized 優先、legacy fallback 之欄位讀取策略；在不改變既有輸出內容之前提下，降低未來欄位分散讀取之風險。

對應之上層規範詳見：
- `docs/phase-8c-completion-report.md`（前一階段完成基線；含 placeholder resolver helper 與 validate / build-promotion 接入）
- `docs/phase-8d-field-mapping-design.md`（Phase 8-d-0 之 15 節規格）
- `docs/publish-bundle.md` §3 / §4（sidecar 勝、frontmatter fallback；severity 矩陣總則）
- `docs/publish-json-schema.md` §5.3（Blogger URL 不可預測強制規則）
- `docs/fb-sidecar-schema.md` §3 / §5（`.fb.md` schema 與 placeholder）
- `docs/promotion-export.md` §9（Phase 8-d-4 manifest entry normalized 接入規則）

---

## §1 Phase 8-d 目標摘要

Phase 8-d 之核心目標：

1. **建立 normalized post output helper**（`src/scripts/normalize-post-output.js`，純函式）：將 `.md` frontmatter / `.publish.json` / `.fb.md` 多層資料來源依優先序攤平至統一形狀
2. **將 normalized 掛入 `load-posts`**：於 entry 組裝完成後 additive 掛載 `entry.normalized`，不修改既有欄位
3. **讓 GitHub / Blogger / promotion 輸出逐步採 normalized 優先、legacy fallback**：build script 與 EJS template 改讀 `post.normalized.X` 並保留 legacy 路徑為 fallback
4. **在不改變既有輸出內容之前提下，降低未來欄位分散讀取之風險**：所有改造批次以 byte-identical（modulo timestamps / EJS whitespace）為硬性承諾

Phase 8-d 屬**結構整理**性質，不引入新內容模型；series / titleEn / FB sidecar schema 擴充 / 系列 hashtags 預設與覆寫等**新內容欄位**屬 Phase 8-e 範圍，不在 8-d 處理。

---

## §2 拆批與 commit 對照表

Phase 8-d 共 16 個 commit（與並行 Phase 8-e-1 之 1 個 docs commit 共存於同段歷史）：

| # | 批次 | Commit | 修改檔案 | 完成內容 | dist 影響 |
|---|---|---|---|---|---|
| 1 | **8-d-0** field mapping design | `44c19fb` | `docs/phase-8d-field-mapping-design.md`（新增） | 15 節規格、26 欄位映射表、9 批次拆批計畫 | 無 |
| 2 | **8-d-1** normalize-post-output helper | `070fa16` | `src/scripts/normalize-post-output.js`（新增） | 純函式 helper；不接入 caller；零外部相依 | 無 |
| 3 | **8-d-2** load-posts 掛 normalized | `4f589a1` | `src/scripts/load-posts.js` | entry 組裝後 additive 呼叫 `normalizePostOutput`，掛 `entry.normalized` | additive，不影響 dist |
| 4 | **8-d-3a** build-github 傳 normalized | `4534eb4` | `src/scripts/build-github.js` | 各 render path additive 傳遞 `normalized: post.normalized` 給 EJS | additive，不影響 dist |
| 5 | **8-d-3b** build-blogger 單篇傳 normalized | `77245c8` | `src/scripts/build-blogger.js` | 5 個單篇 render 函式 additive 傳 normalized | additive，不影響 dist |
| 6 | **8-d-3c-1** blogger-post-summary EJS | `6da175d` | `src/views/blogger/blogger-post-summary.ejs` | normalized 優先 + legacy fallback | byte-identical（modulo timestamps） |
| 7 | **8-d-3c-2** post-detail EJS | `eb64c24` | `src/views/pages/post-detail.ejs` | 同上 | byte-identical |
| 8 | **8-d-3c-3** blogger full / redirect-card EJS | `157ec00` | `src/views/blogger/blogger-post-full.ejs`、`blogger-redirect-card.ejs` | 同上（兩檔合併） | byte-identical |
| 9 | **8-d-3c-4** post-list EJS | `27e07f4` | `src/views/pages/post-list.ejs` | per-item view-model（5 變數） | byte-identical |
| 10 | **8-d-3c-5** category EJS | `905dbc4` | `src/views/pages/category.ejs` | per-item view-model | byte-identical |
| 11 | **8-d-3c-6** tag EJS | `43af9ad` | `src/views/pages/tag.ejs` | per-item view-model | byte-identical |
| 12 | **8-d-3c-7** home EJS | `ba1ae29` | `src/views/pages/home.ejs` | per-item view-model（精簡 3 變數） | byte-identical |
| 13 | **8-d-3c-8-a** blogger-category-index EJS + indexPosts 投影補 normalized | `421a142` | `src/scripts/build-blogger.js`、`src/views/blogger/blogger-category-index.ejs` | indexPosts.push() additive 加 `normalized`；EJS per-item view-model | byte-identical（modulo EJS whitespace + timestamps） |
| 14 | **8-d-3c-8-b** blogger-home-index EJS | `62f243d` | `src/views/blogger/blogger-home-index.ejs` | 巢狀迴圈內 per-item view-model | byte-identical（modulo EJS whitespace + timestamps） |
| 15 | **8-d-4-a** promotion 分析 | （無 commit；純讀取分析） | — | 盤點 build-promotion 資料流、normalized 可替代欄位、URL/UTM 安全邊界 | 無 |
| 16 | **8-d-4-b** build-promotion manifest entry 接 normalized | `e57d4e2` | `src/scripts/build-promotion.js` | `buildManifestEntry` 內 4 欄位（title / target / message / hashtags）改 normalized 優先 + legacy fallback | byte-identical（modulo `generatedAt` / `generated`）|
| 17 | **8-d-4-c** promotion docs 補強 | `8d8e031` | `docs/promotion-export.md` | 新增 §9（8 個子節）記錄 normalized 接入規則、安全邊界、與 Phase 8-e 邊界 | 無 |

線性歷史，無 amend、無 rebase。

---

## §3 Template 完成度

### 3.1 已完成 normalized 優先 + legacy fallback（10 個）

| # | Template | 落地批次 | Commit |
|---|---|---|---|
| 1 | `src/views/pages/post-detail.ejs` | 8-d-3c-2 | `eb64c24` |
| 2 | `src/views/pages/post-list.ejs` | 8-d-3c-4 | `27e07f4` |
| 3 | `src/views/pages/category.ejs` | 8-d-3c-5 | `905dbc4` |
| 4 | `src/views/pages/tag.ejs` | 8-d-3c-6 | `43af9ad` |
| 5 | `src/views/pages/home.ejs` | 8-d-3c-7 | `ba1ae29` |
| 6 | `src/views/blogger/blogger-post-summary.ejs` | 8-d-3c-1 | `6da175d` |
| 7 | `src/views/blogger/blogger-post-full.ejs` | 8-d-3c-3 | `157ec00` |
| 8 | `src/views/blogger/blogger-redirect-card.ejs` | 8-d-3c-3 | `157ec00` |
| 9 | `src/views/blogger/blogger-category-index.ejs` | 8-d-3c-8-a | `421a142` |
| 10 | `src/views/blogger/blogger-home-index.ejs` | 8-d-3c-8-b | `62f243d` |

### 3.2 標記為 not applicable（taxonomy list，非 post-list）

| Template | 標記 | 理由 |
|---|---|---|
| `src/views/pages/category-list.ejs` | **N/A** | 迭代 `entries[]` 為 taxonomy（`slug` / `name` / `count`），非 post-list；per-item view-model 不適用 |
| `src/views/pages/tag-list.ejs` | **N/A** | 同上 |

### 3.3 標記為 out of scope（非 post-list 結構）

| Template | 標記 | 理由 |
|---|---|---|
| `src/views/pages/search.ejs` | **Out of scope** | 非 post 迭代結構 |
| `src/views/pages/about.ejs` | **Out of scope** | 非 post 迭代結構 |
| `src/views/pages/404.ejs` | **Out of scope** | 錯誤頁 |

---

## §4 8-d-4 promotion 完成度

### 4.1 manifest entry 4 個欄位採 normalized 優先 + legacy fallback

`src/scripts/build-promotion.js` 之 `buildManifestEntry` 內，下列 4 個欄位採新讀取策略：

| 欄位 | 第一優先 | Fallback 1 | Fallback 2 |
|---|---|---|---|
| `entry.title` | `post.normalized.display.title` | `post.title` | `null` |
| `entry.target` | `post.normalized.promotion.facebook.target` | `post.promotion.facebook.target` | `'auto'` |
| `entry.message` | `post.normalized.promotion.facebook.message` | `post.promotion.facebook.message` | `null` |
| `entry.hashtags` | `post.normalized.promotion.facebook.hashtags`（陣列即採用） | `post.promotion.facebook.hashtags` | `[]` |

`hashtags` 採用後仍套既有 `.filter(Boolean)`；輸出格式不變。

### 4.2 維持 legacy 之安全邊界

**13 個 manifest entry 欄位仍維持既有 legacy 來源**：

- `site` / `slug` / `sourcePath` / `id`
- `page`
- `fbTitle` / `note`
- `baseUrl` / `finalUrl` / `urlSource` / `urlReason`
- `resolvedFacebookBody` / `facebookSidecar`

**5 條不動之安全邊界**：

1. **`classifyFacebook` 不改**：過濾邏輯維持 `post.promotion.facebook.enabled` / `page` 等 legacy 判斷，避免引入 `.fb.md` sidecar `enabled` precedence 造成過濾變動
2. **`src/scripts/ga4-url-builder.js` 不改**：`baseUrl` / `urlSource` / `urlReason` 仍由 `resolvePostBaseUrl` 解析
3. **URL / UTM / `finalUrl` 不改**：UTM 套用、Blogger publishedUrl 解析、page URL 解析皆走既有路徑；不得以 `normalized.promotion.facebook.finalUrl` 取代（normalized 不套 UTM）
4. **EJS promotion templates 不改**：`src/views/promotion/*.ejs` 接收 manifest entry 而非 raw post；normalized 接入點為 `buildManifestEntry`，EJS 內不需 per-item view-model
5. **series / titleEn / 系列 hashtags 繼承不在 8-d 處理**：屬 Phase 8-e 範圍

---

## §5 最終驗證結果

本批執行最終 sweep（HEAD = `8d8e031`，未含本 completion report commit）：

| 驗證指令 | 結果 |
|---|---|
| `node --check src/scripts/normalize-post-output.js` | ✅ 通過 |
| `node --check src/scripts/load-posts.js` | ✅ 通過 |
| `node --check src/scripts/build-github.js` | ✅ 通過 |
| `node --check src/scripts/build-blogger.js` | ✅ 通過 |
| `node --check src/scripts/build-promotion.js` | ✅ 通過 |
| `npm run validate:content` | ✅ 0 error / 4 warning（皆為既有；詳見下表）|
| `npm run build:github` | ✅ 通過（done in 223ms；寫 `.cache/data/build-manifest.json` 等）|
| `npm run build:blogger` | ✅ 通過（done in 57ms；寫 `dist-blogger/` posts + index + manifest）|
| `npm run build:promotion` | ✅ 通過（done in 43ms；total enabled: 1 / total filtered: 2）|

### 5.1 既有 warning（4 個，非本批阻塞）

| Warning | 來源 | 數量 | 性質 |
|---|---|---|---|
| `body-leading-h1` | `content/github/posts/20260504-github-pages-blog-planning.md` | 1 | 既有 |
| `frontmatter-uses-deprecated-type: tech-note` | 同上 | 1 | 既有；legacy `type` 欄位（Phase 8-b-3 已啟用相容讀取） |
| `body-leading-h1` | `content/github/posts/20260504-portable-blog-system-mvp.md` | 1 | 既有 |
| `frontmatter-uses-deprecated-type: tech-note` | 同上 | 1 | 既有；同上 |

合計 0 error / 4 warning，皆為既有，**不視為本批阻塞**。

### 5.2 `.gitkeep` restore 狀態

執行 sweep 後 `git status` 為 `working tree clean`，**無任何 `.gitkeep` 異動**，**無需 restore**。

---

## §6 byte-identical / diff 結論

| dist | 各批次驗證結果 | 最終 sweep 結果 |
|---|---|---|
| **GitHub `.cache/` / `dist/`** | 8-d-3a 為 additive 不變動；8-d-3c-2 / 4 / 5 / 6 / 7 之 EJS 改造皆驗證 byte-identical（modulo EJS whitespace + builtAt） | ✅ 無阻塞 |
| **Blogger `dist-blogger/`** | 8-d-3b 為 additive 不變動；8-d-3c-1 / 3 之單篇 EJS 改造、8-d-3c-8-a / 8-b 之 index EJS 改造皆驗證 byte-identical（modulo EJS whitespace + builtAt） | ✅ 無阻塞 |
| **Promotion `dist-promotion/`** | 8-d-4-b：個別 FB `.txt` **完全 byte-identical**；`build-manifest.json` 僅 `generatedAt` 一行差異；`all-posts-index.txt` 僅 `generated` 一行差異；URL / UTM / hashtags / FB 貼文內容無實質差異 | ✅ 無阻塞 |

實質內容（HTML 文字節點、URL、UTM、hashtags、JSON 業務欄位）於各批次皆 byte-identical；可預期差異為：
- **builtAt / generatedAt / generated 時間戳**：每次 build 必然不同
- **EJS 多行 scriptlet 之尾隨空白**：list-view 模板加入 per-item view-model 後出現的純空白行，無實質 HTML 內容變動

---

## §7 已知延後項

下列項目於 Phase 8-d 期間**未落地**，依設計 §12 / §14 之原文判定**非本期強制完成**：

### 7.1 `validate-content.js` 是否接 normalized

- 狀態：未動（grep 確認無 `normalized` 引用）
- 設計依據：`docs/phase-8d-field-mapping-design.md` §12 item 5 標記「8-d-3 之後評估」
- 延後理由：`validate-content` 既有規則皆走 legacy frontmatter 路徑，且已涵蓋本期所需檢查；接入 `normalized.validationMeta.warnings` 屬可選 traceability 強化，不阻塞 Phase 8-d 收尾
- 後續批次：建議於 Phase 8-e-4 或更晚評估

### 7.2 `blogger-copy-helper.ejs` / `blogger-publish-checklist.ejs` 是否接 normalized

- 狀態：`build-blogger.js` 已 additive pass `normalized: post.normalized` 給兩 EJS（8-d-3b），**但兩 EJS 仍 legacy** 讀 `post.X`（grep 確認無 `normalized` 引用）
- 設計依據：`docs/phase-8d-field-mapping-design.md` §12 item 6 標記「8-d-4 或更晚」
- 延後理由：兩 EJS 為複製貼用之純文字輸出，與線上 HTML / JSON 不同性質；改造可獨立進行，不阻塞 Phase 8-d 主軸
- 後續批次：建議於 Phase 8-d 之後另開小批次（可命名 8-d-X 或併入 Phase 8-f）

### 7.3 8-d-5 sample sidecar 補強

- 狀態：未做
- 設計依據：`docs/phase-8d-field-mapping-design.md` §14 第 6 批
- 延後理由：Phase 8-a 已建立 `_sample.publish.json` / `_sample.fb.md` / `_sample-from-frontmatter.publish.json` 三份 sample；fixture 帶 sidecar 之測試案例屬可選測試覆蓋強化，不阻塞 8-d completion
- 後續批次：依需求安排

### 7.4 8-d-6 / 8-d-7 第二批 placeholder 規格 / 實作

- 狀態：未做
- 設計依據：`docs/phase-8d-field-mapping-design.md` §14 第 7 / 8 批
- 延後理由：「第二批 placeholder」與 `series.titleTemplate` placeholder（已於 `docs/series-schema.md` §2.4 規格化）高度重疊；獨立於 Phase 8-d 落地易與 Phase 8-e 規格分裂
- 後續批次：**建議併入 Phase 8-e 後續批次**（如 8-e-6 build script 接入 series titleTemplate 時一併處理）

---

## §8 與 Phase 8-e 的邊界

Phase 8-d **不處理**下列內容，皆屬 Phase 8-e 範圍（規格已於 8-e-1 `docs/series-schema.md` 落地）：

- **series metadata**（`series.id` / `series.name` / `series.nameEn` / `series.number` / `series.subtitle` / `series.titleTemplate` / `series.hashtags`）
- **titleEn**（`.fb.md` frontmatter 之英文標題欄位擴充）
- **FB sidecar schema 擴充**（titleEn / seriesNumberOverride / hashtagsInheritFromSeries 等候選欄位）
- **系列 hashtags 預設與覆寫**（從系列定義帶出、單篇完整覆蓋）
- **自動建議序號邏輯**（補缺號優先、無缺號則 max+1、作者可手動覆寫）

Phase 8-d 僅接入目前 `normalize-post-output.js` 既有 `normalized.promotion.facebook` 欄位（`enabled` / `target` / `message` / `body` / `hashtags` / `finalUrl` / `utm.*`），**不擴大 schema、不引入新內容模型**。

---

## §9 安全限制確認

| 項目 | 狀態 |
|---|---|
| 是否未 push | ✅ 未 push |
| 是否未設定 remote | ✅ 未設定（`git remote -v` 空輸出） |
| 是否未 amend | ✅ 未 amend（Phase 8-d 全部 16 個 commit 皆為新建） |
| 是否未 rebase | ✅ 未 rebase（線性歷史） |

---

## §10 後續建議

### 10.1 Phase 8-d 已可正式視為完成

- **設計 §12 八項影響點完成度：6 已落地 / 2 明確延後**（item 5 validate-content、item 6 copy-helper EJS，皆設計原文標記「之後評估」「或更晚」，非本期強制）
- **10 / 10 list-view 模板**完成 normalized 接入
- **promotion manifest entry 4 欄位**完成 normalized 接入
- **byte-identical 驗收**於各批次與最終 sweep 皆通過
- **新內容模型（series / titleEn / 系列 hashtags）已劃歸 Phase 8-e**，邊界清晰

### 10.2 下一步建議：進入 Phase 8-e-2

**Phase 8-e-2：FB sidecar schema 補強**（`.fb.md` frontmatter §3.1 表格擴充，加入 `titleEn`、視需要加入 series 互動欄位之最小規格）。

**強烈建議 8-e-2 仍保持小批次**：

- 先補 `titleEn` / series 相關欄位之**規格化與 schema 表格擴充**（修訂 `docs/fb-sidecar-schema.md` §3.1 / §3.3）
- **不直接寫**完整自動序號邏輯（屬 Phase 8-e-5 範圍）
- **不直接寫** `series.titleTemplate` placeholder 解析實作（屬 Phase 8-e-6 範圍）
- 沿 Phase 8-d 之拆批節奏：每批一個小目標、每批可獨立驗收

### 10.3 Phase 8-d 期間發現之延後候選

如未來規劃時間，建議於 Phase 8-e 系列**之後或交錯**補上以下兩項（皆屬可選強化）：

- **8-d-X1（候選）**：`blogger-copy-helper.ejs` / `blogger-publish-checklist.ejs` 接 normalized（屬設計 §12 item 6）
- **8-d-X2（候選）**：`validate-content.js` 接 `normalized.validationMeta.warnings`（屬設計 §12 item 5）

兩項皆**非阻塞**，可依工作排序自由安排。

---

（本文件結束）
