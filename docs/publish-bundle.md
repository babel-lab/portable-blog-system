# 跨平台文章發布包規範 (Cross-Platform Article Publish Bundle)

本文件為本專案 Phase 8 之核心規範文件。所有與 `.publish.json`、`.fb.md` sidecar、跨平台 metadata、發布回填資料相關之實作，皆須以本文件為準。本文件之地位等同 `CLAUDE.md` 對應章節之延伸規範，與 `CLAUDE.md` 衝突時，以更嚴格之一方為準。

---

## §1 定位：什麼是「發布包」

### 1.1 source 與 output 之區分

本專案以「每篇文章 = 一個發布包」為核心觀念。發布包包含文章內容、跨平台 metadata、平台發布資料、社群導流文案、AdSense 配置、SEO 資訊與發布狀態紀錄。

發布包之資料來源 (source) 必須為以下檔案，任何發布相關之修改皆應回到 source 保存：

- Markdown 文章本體與 frontmatter (`.md`)
- 跨平台發布回填資料 (`.publish.json`)
- Facebook 推廣文案來源 (`.fb.md`)
- 全站設定 (`content/settings/*.json`)
- 共用模板與素材 (`content/templates/`、`public/`)

build 階段所產生之以下產物為 output，重新 build 會被覆蓋，不得作為來源資料：

- `dist/` (GitHub 靜態站)
- `dist-blogger/` (Blogger 文章 HTML、copy-helper.txt、meta.json、publish-checklist.txt)
- `dist-promotion/` (FB 文案 .txt、all-posts-index.txt)
- `dist-reports/` (build report、各類報表)

任何僅修改 dist-* 之變更皆視為臨時操作，下次 build 將被覆蓋。

### 1.2 三檔組合

每篇文章之發布包以三個檔案構成。三檔位於同一資料夾，共用同一檔名前綴 `{slug}`：

```
content/{site}/posts/{slug}.md
content/{site}/posts/{slug}.publish.json
content/{site}/posts/{slug}.fb.md
```

`{site}` 為 `github` 或 `blogger`，依文章主要來源資料夾決定。三檔之檔名前綴必須完全一致，便於工具掃描與作者管理。

---

## §2 三檔分工

### 2.1 `.md` ＝ 文章內容與內容屬性

`.md` 管理「**內容屬性**」，亦即文章建立後幾乎不再變動之事實，包含：

- title、titleEn、slug、date、updated、author
- category、tags
- description、searchDescription
- cover、coverAlt
- status、draft
- primaryPlatform、publishTargets
- blocks (toc、hashtags、socialFollow、relatedPosts、sidebar、ads 等)
- 型別專屬區塊：book、affiliate、download、comicGallery 等

文章本文以 Markdown 撰寫，置於 frontmatter 之後。

### 2.2 `.publish.json` ＝ 跨平台發布回填資料

`.publish.json` 管理「**發布後才回填、會頻繁變動之資料**」，包含：

- canonical (最終 canonical URL 與來源平台)
- ogImage (社群分享預覽圖)
- blogger (permalink、status、publishedUrl、publishedAt、bloggerPostId、history)
- github (slug、path、status、publishedUrl、publishedAt)
- seo (metaTitle、metaDescription、robots)

完整欄位字典詳見 `docs/publish-json-schema.md`。

### 2.3 `.fb.md` ＝ Facebook 推廣文案來源

`.fb.md` 管理「**FB 粉絲頁導流文案**」。第一版僅支援 Facebook，未來可擴充 LINE / Threads / IG / X 等其他社群（屬 Phase Z 範疇，本階段不實作）。

`.fb.md` 為 YAML frontmatter + Markdown body 之結構，body 內容支援 URL placeholder。完整欄位字典詳見 `docs/fb-sidecar-schema.md`。

### 2.4 `contentKind` × `blogger.type` 分離原則

Phase 8-a 起明確分離兩個獨立維度，避免 CLAUDE.md §11 既有 `type` 命名與 Blogger 發布端 `post` / `page` 撞名之語意混淆。

#### 2.4.1 `contentKind`：內容屬性 / 內容型態

`contentKind` 位於 `.md` frontmatter（§2.1），描述「這是什麼樣的內容」。第一版列舉值：

- `post`：一般文章
- `tech-note`：技術筆記
- `book-review`：書評文章
- `download`：教具下載文章
- `comic`：四格漫畫
- `life-note`：生活文章
- `page`：固定頁（About / 工具目錄 / 下載索引頁等）

#### 2.4.2 `blogger.type`：Blogger 發布端型態

`blogger.type` 位於 `.publish.json` 之 `blogger` 區塊（§2.2），描述「於 Blogger 後台被放在哪個管理區」。僅允許下列兩值：

- `"post"`：Blogger 後台之「文章」管理區
- `"page"`：Blogger 後台之「網頁」管理區

詳細欄位規格詳見 `docs/publish-json-schema.md` §5.6。

#### 2.4.3 不可混用

`contentKind` 與 `blogger.type` 為**獨立兩維度**，不可混用、不可相互推導：

- `contentKind` **不得**寫入 `.publish.json`
- `blogger.type` **不得**寫入 `.md` frontmatter
- 同一篇文章之兩值取值可不同

#### 2.4.4 對照範例

| `contentKind`（`.md` frontmatter） | `blogger.type`（`.publish.json`） | 語意 |
| --- | --- | --- |
| `book-review` | `post` | 書評內容，發到 Blogger「文章」區 |
| `tech-note` | `post` | 技術筆記，發到 Blogger「文章」區 |
| `page` | `page` | 固定頁（About / 工具目錄 / 下載索引頁），發到 Blogger「網頁」區 |

#### 2.4.5 與 CLAUDE.md §11 之命名對齊歷史

「內容型態」之欄位名於 Phase 8-a 起正式由 `type` 重新命名為 `contentKind`，以避免與 `blogger.type` 之 `post` / `page` 撞名。

對齊歷程：

1. **Phase 8-a-1～7（文件先行）**：8-a 新建之規範文件、遷移指引、checklist、sample 範本一律使用 `contentKind`。CLAUDE.md §11 此期間暫保留舊 `type` 命名，僅以 See also 指向本節。
2. **CLAUDE.md 整理批次（路徑 C）**：CLAUDE.md §11 之欄位名與列舉值已對齊為 `contentKind`，並補入 `page` 列舉值；CLAUDE.md §3.1 frontmatter 範例之 `type:` 同步改為 `contentKind:`。本節描述之命名落差至此**收尾**。
3. **既有文章 frontmatter 之相容處理**：`content/{site}/posts/*.md` 之既有文章若仍含舊 `type` 欄位，於相容期內由 `validate-content` 視為 `contentKind` 之相容寫法（實作落地時機為 Phase 8-b 之後）。本節不要求現在主動遷移既有文章。

明確標註：**「內容型態」欄位 = `contentKind`；CLAUDE.md §3.1、§11、本文件、`docs/publish-json-schema.md`、`docs/fb-sidecar-schema.md`、`docs/migration-from-frontmatter.md`、sample 範本之命名已全部對齊。**

### 2.5 `posts/` 與 `pages/` 皆適用 publish bundle

#### 2.5.1 適用範圍

publish bundle 三檔組合（§1.2）同時適用於 `posts/` 與 `pages/` 資料夾，不限於 posts。

#### 2.5.2 路徑

posts 路徑：

```
content/{site}/posts/{slug}.md
content/{site}/posts/{slug}.publish.json
content/{site}/posts/{slug}.fb.md
```

pages 路徑：

```
content/{site}/pages/{slug}.md
content/{site}/pages/{slug}.publish.json
content/{site}/pages/{slug}.fb.md
```

`{site}` 為 `github` 或 `blogger`，與 §1.2 規則一致。

#### 2.5.3 Page 採完整三檔，不簡化

Page 採用與 post 完全相同之三檔組合，**不另設簡化版**。Page 不因「於 Blogger 後台被歸為網頁」而失去任何 metadata 能力。

Page 同樣支援下列資料：

- `publishedUrl` / `publishedAt` / `canonical`（`.publish.json`）
- FB 推廣 sidecar（`.fb.md`）
- 內容屬性如 `series` / `quote` / `relatedLinks` / `otherLinks` / `cover` / `coverAlt` 等（`.md` frontmatter，§2.6.1）

#### 2.5.4 Blogger Page URL 不可預測

Blogger 文章 URL 帶年月路徑，例：

```
https://babel-lab.blogspot.com/2026/04/we-media-myself.html
```

月份由 Blogger 平台依實際發布月份產生，作者於 Blogger 後台無法修改。

Blogger Page URL **不一定遵守文章年月規則**。Page URL 之形式由 Blogger 平台依後台設定產生，亦由平台控制，作者不可預測。

由此衍生：

- `blogger.type === "page"` 時，`docs/publish-json-schema.md` §9.5 之 yyyy/mm URL pattern **不適用**
- 但「`publishedUrl` 為唯一真相」之原則**完全適用**：發布前不得預測，發布後由作者回填，build 階段不得自行組出 Page URL

詳細之 Page URL 規則差異詳見 `docs/publish-json-schema.md` §5.3 與 §9.5。

### 2.6 三檔欄位分工（single source of truth 落地）

本節規範三檔之欄位分工原則，作為「single source of truth」之具體落地。實作層欄位字典詳見 `docs/publish-json-schema.md`、`docs/fb-sidecar-schema.md`。

#### 2.6.1 `.md` frontmatter：內容屬性 / 長期不變動

放置「內容建立後幾乎不再變動」之屬性資料：

- `title`、`titleEn`、`slug`、`date`、`updated`、`author`
- `contentKind`（§2.4.1）
- `description`、`searchDescription`
- `category`、`tags`
- `series`、`quote`
- `relatedLinks`、`otherLinks`
- `cover`、`coverAlt`
- `status`、`draft`
- 型別專屬區塊：`book`、`affiliate`、`download`、`comicGallery` 等

`series`、`quote`、`relatedLinks`、`otherLinks` 為 Phase 8-a 起新加入之內容屬性欄位；具體欄位字典留待後續批次之 content-schema 文件定義（屬本批之外）。

See also：`series` 之完整欄位字典、跨平台共用原則、`series.id` 穩定性、自動建議序號、Blogger / FB title 與 `titleEn` 分工，詳見 `docs/series-schema.md`（Phase 8-e-1）。`series` 屬內容屬性，**不放** `.publish.json` 與 `.fb.md`（沿用 §1.1 / §2.6.4 之硬性原則）。

#### 2.6.2 `.publish.json`：發布狀態 / 平台回填 / 平台輸出

放置「發布後才回填、會頻繁變動」之資料：

- `schemaVersion`
- `canonical`（最終 canonical URL 與來源平台）
- `ogImage`（社群分享預覽圖）
- `blogger`：`type`（§2.4.2）、`status`、`permalink`、`publishedUrl`、`publishedAt`、`bloggerPostId`、`publishYear`、`publishMonth`、`history` 等
- `github`：`status`、`slug`、`path`、`publishedUrl`、`publishedAt` 等
- `seo`：`metaTitle`、`metaDescription`、`robots`
- 未來平台（如自架站、Substack、Medium 等）之發布回填資料：預留擴充空間，**目前未實作，Phase 8-a 不大幅新增**

#### 2.6.3 `.fb.md`：Facebook 推廣文案 / 社群導流

放置「FB 粉絲頁導流文案」與相關設定：

- FB 貼文正文（body）
- `hashtags`、`target`、`customUrl`、`page`、`title`、`note`
- CTA 文字（屬 body 內容）
- 手動貼文備註（`note`）
- UTM 套用由 `promotion.config.json` 動態組裝，**不寫死於 `.fb.md`**（詳見 `docs/fb-sidecar-schema.md` §8.3）

#### 2.6.4 不可混用原則（硬性）

下列為硬性原則：

- 內容屬性（§2.6.1 列表項目）**不得**塞入 `.publish.json`
- 平台發布狀態與回填資料（§2.6.2 列表項目）**不得**塞入 `.md` frontmatter
- FB 文案與 FB 設定（§2.6.3 列表項目）**不得**塞入 `.md` 或 `.publish.json`

違反者於 validate 階段列為 warning，不阻擋 build。實作落地時機為 Phase 8-b / 8-c。

#### 2.6.5 過渡期相容

Phase 1-7 既有文章 frontmatter 含 §2.6.2 / §2.6.3 列舉之欄位（如 `canonical`、`promotion.facebook` 等）時，於相容期內仍以 fallback 形式被讀取（沿用 §3 之 sidecar 勝、frontmatter fallback 原則）。具體相容期 severity 規則詳見 §4 與各 sidecar 文件。

---

## §3 來源優先序與相容期

### 3.1 sidecar 勝、frontmatter fallback

當 `.publish.json` 或 `.fb.md` 與 `.md` frontmatter 同欄位皆存在時，**sidecar 之值勝出**。frontmatter 同欄位之值僅作為 fallback 使用。

當 sidecar 不存在時，build / validate 流程必須能 fallback 到 frontmatter，避免破壞既有文章。

### 3.2 衝突處置

當 sidecar 與 frontmatter 同時提供同一欄位且值不同時，build / validate 應列出 warning，提示作者整理資料來源。**不得升為 error**，避免相容期內既有文章一次全部壞掉。

衝突 warning 之規則名稱、訊息格式、適用範圍由 Phase 8-b 之 `validate-content` 規則定義。

### 3.3 相容期長度

相容期自 Phase 8-b 啟用 sidecar 讀取起算，至 Phase 8-g 相容層退場止。Phase 8-b 至 Phase 8-f 期間皆為相容期。

Phase 8-a 階段尚未啟用 sidecar 讀取，故不屬於相容期範圍；本文件之相容性規則僅作為後續階段之依據。

---

## §4 必備性 (severity 矩陣總表)

### 4.1 FB 文案必備條件

FB 文案視為**必備**，每篇文章皆須提供。「FB 文案存在」之判定須同時符合下列兩條件：

- `{slug}.fb.md` 檔案存在
- `.fb.md` frontmatter `enabled === true`

兩條件缺其一，視為「FB 文案缺漏」。

### 4.2 status × severity 矩陣

FB 文案缺漏時，依文章 status 對應不同 severity：

| 文章 status | FB 文案缺漏之 severity |
| --- | --- |
| draft     | warning (不擋 build) |
| ready     | error (擋正式檢查)   |
| published | error (擋正式檢查)   |
| archived  | warning              |

「擋正式檢查」之具體行為由 `validate-content` 之 exit code 與 severity 機制決定，沿用 Phase 5-g 既有設計。

### 4.3 placeholder 未解析之 severity

`.fb.md` body 內之 URL placeholder (`{{ articleUrl }}`、`{{ blogger.publishedUrl }}`、`{{ github.publishedUrl }}`、`{{ canonicalUrl }}`) 若於 build 階段無法解析（對應欄位為空字串、缺漏或無法推導），其 severity 與 §4.2 相同：

| 文章 status | placeholder 未解析之 severity |
| --- | --- |
| draft     | warning |
| ready     | error   |
| published | error   |
| archived  | warning |

理由：未解析之 placeholder 若被張貼至 Facebook，將導致導流連結錯誤，影響使用者體驗與 SEO 流量。

### 4.4 規則生效時機

§4.1 至 §4.3 所述規則之實作落地時機為 Phase 8-c。Phase 8-a 至 Phase 8-b 期間，本文件僅作為規範依據，validate-content 尚未加入對應規則。

---

## §5 schemaVersion 演進策略

`.publish.json` 第一版固定 `schemaVersion: 1`。

非破壞性變更（欄位新增、選填欄位調整、預設值調整）不升 schemaVersion。

破壞性變更（欄位移除、語意變更、結構重組）始升至 `schemaVersion: 2`，並於 `docs/publish-json-schema.md` 提供 v1 → v2 之遷移說明。

`.fb.md` 第一版未設 schemaVersion 欄位。若未來 frontmatter 結構發生破壞性變更，再行引入版本機制。

---

## §6 git 版控政策

### 6.1 進 git 版控

下列檔案皆為 source data，必須進 git 版控：

- `.md` (文章內容與 frontmatter)
- `.publish.json` (跨平台發布回填資料)
- `.fb.md` (FB 文案來源)

### 6.2 不進 git 版控

下列為 build 產物，沿用 `.gitignore` 規則：

- `dist/`
- `dist-blogger/`
- `dist-promotion/`
- `dist-reports/`

### 6.3 大型素材原始檔

PSD、CLIP、AI、高解析原始 JPG / PNG 等大型素材原始檔，沿用 `CLAUDE.md` §22 規則，不進 public repo，建議置於專案外或外部硬碟。文章 frontmatter `sourceAssets.folder` 可記錄原始檔位置。

---

## §7 Phase 8 階段範圍

### 7.1 Phase 8-a：文件先行

範圍**僅限新增規範文件與 sample 範本**。不修改任何既有檔案、不寫程式、不改變 build / validate / report 行為。

完成判準：以下檔案皆已建立並通過人工審核。

- `docs/publish-bundle.md`（本文件）
- `docs/publish-json-schema.md`
- `docs/fb-sidecar-schema.md`
- `docs/migration-from-frontmatter.md`
- `docs/checklists/sidecar-migration-checklist.md`
- `content/templates/_sample.publish.json`
- `content/templates/_sample.fb.md`
- `content/templates/_sample-from-frontmatter.publish.json`

### 7.2 Phase 8-b：load 階段讀取 sidecar

於 `load-posts` 流程整合 `.publish.json` 與 `.fb.md` 之讀取與合併。sidecar 不存在時 fallback 到 frontmatter；同欄位衝突列 warning。本階段不改變 build 產物之輸出格式。

### 7.3 Phase 8-c：FB 必備檢查與 placeholder 解析

新增 FB 文案必備規則與 URL placeholder 解析。validate-content 依 §4 之 severity 矩陣判定。

### 7.4 Phase 8-d：Blogger permalink / publishedUrl 規則重整（Phase 8-a 撰寫時之預期計畫之一）

`blogger.permalink` 自 `slug` 解耦；`publishedUrl` 為真相來源；copy-helper 與 publish-checklist 依此調整提示。Blogger URL 之 yyyy/mm 路徑僅由 publishedAt 或 publishedUrl 推導，缺則留空，不預測正式 URL。

**Phase 8-d 實際落地更新**：本節描述為 Phase 8-a 撰寫時之預期計畫之一；**實際 Phase 8-d（commit `12919cf`）之主軸為 normalized post output helper 之建立與漸進採用**：

- **normalized post output helper**：`src/scripts/normalize-post-output.js` 建立；建立 `normalized.display` / `normalized.seo` / `normalized.publish` / `normalized.promotion.facebook` 等資料層 namespace
- **load-posts 掛入**：`src/scripts/load-posts.js` 於 post 物件附加 `normalized` 欄位（不破壞既有 `post.title` / `post.cover` 等 top-level 欄位）
- **GitHub / Blogger / promotion 漸進採用 normalized 優先 + legacy fallback 策略**：EJS template 與 build script 之多個接入點採用 `normalized.display.title || post.title` 等 fallback chain；既有 dist 保持 byte-identical
- **Blogger permalink / publishedUrl 規則**：屬上述 `normalized.publish.blogger` 之 sub-scope（per 本節原文）；非 Phase 8-d 主軸

詳細落地紀錄詳見 `docs/phase-8d-completion-report.md`。

### 7.5 Phase 8-e：AdSense templates + placements 重構（Phase 8-a 撰寫時之預期計畫）

`ads.config.json` 改為 `templates + placements` 模型；文章 `blocks.ads` 改為 placement key 陣列。保留舊 `adsenseTop / adsenseMiddle / adsenseBottom` boolean 之相容層；同一篇文章同時使用新舊兩種寫法時 warning。

**Phase 8-e 實際落地更新**：本節描述為 Phase 8-a 撰寫時之預期計畫；**實際 Phase 8-e（commit `e5677dd`）採完全不同方向，未執行 AdSense templates + placements 重構**；主軸為：

- **series metadata schema 規格化**：`docs/series-schema.md` 全文（含 §2 欄位字典、§5 auto-suggest 規格、§6/§7/§8 title/titleEn/hashtags 規則、§11 schema 落地點）
- **`.fb.md` `titleEn` 第 8 欄位補強**：per 本文件 §3.1 / §3.4 title metadata 分工
- **sample / template / validation-fixtures 落地**：`_sample.series.json` + `_sample-series-post.md` + 多篇 fixtures
- **`validate-content` 4 條 warning-only 規則**：`series-not-object` / `series-id-invalid` / `series-number-invalid` / `series-subtitle-invalid-type`

AdSense templates + placements 重構**未執行**；屬未來規劃但目前無明確 phase 排程。

詳細落地紀錄詳見 `docs/phase-8e-completion-report.md`。

### 7.6 Phase 8-f：書評文章模組擴充（Phase 8-a 撰寫時之預期計畫）

新增 comicGallery、Book JSON-LD、FAQ JSON-LD、CTA partial 等書評類文章專屬區塊。

**Phase 8-f 實際落地更新**：本節描述為 Phase 8-a 撰寫時之預期計畫；**實際 Phase 8-f（commit `b1679d1`）採完全不同方向，未執行書評文章模組擴充**；主軸為 **series metadata 接入 build pipeline**：

- **series 設定層**：`content/settings/series.json`（series 之集中設定檔；schema per `docs/series-schema.md` §11.3）
- **loader plumbing**：`src/scripts/load-posts.js` plumb `settings.series` 至 `normalize-post-output`
- **`normalized.series` 資料層**：`normalize-post-output.js` 合併 `frontmatter.series` + `settings.series` → `normalized.series.{id, number, subtitle, name, nameEn, titleTemplate, hashtags, resolved}`
- **`resolve-series-title.js` helper**：純函式 placeholder resolver；支援 `{series.name}` / `{series.nameEn}` / `{series.number}` / `{series.subtitle}` / `{series.id}` / `{post.title}` / `{post.titleEn}` 共 7 個 placeholder（詳見 `docs/series-schema.md` §16）
- **Blogger copy-helper [11] 區塊接入**：`blogger-copy-helper.ejs` 新增 [11] 系列組合標題輔助區塊（per `docs/series-schema.md` §17）
- **promotion manifest 4 個 additive 欄位**：`build-promotion.js` 之 manifest entry 新增 `titleEn` / `fbTitleEn` / `seriesResolvedTitle` / `seriesTitleUnresolvedPlaceholders`（per `docs/series-schema.md` §18）
- **`series.hashtags` inheritance backfill**：`normalize-post-output.js` post-pass 將 `normalized.promotion.facebook.hashtags` 之 fallback chain 擴充至 `series.hashtags`（per `docs/series-schema.md` §19）

書評文章模組（comicGallery / Book JSON-LD / FAQ JSON-LD / CTA partial）**未執行**；屬未來規劃但目前無明確 phase 排程。

詳細落地紀錄詳見 `docs/phase-8f-completion-report.md` + `docs/series-schema.md` §17 / §18 / §19。

### 7.7 Phase 8-g：相容層退場（可選）（Phase 8-a 撰寫時之預期計畫）

待全部文章遷移完成後，評估是否退場 frontmatter fallback、AdSense 舊 boolean、validate 中 deprecated 警告。本階段是否執行由作者另行決定，非 Phase 8 必經階段。

**Phase 8-g 實際落地更新**：本節描述為 Phase 8-a 撰寫時之預期計畫；**實際 Phase 8-g 已擴充為「Phase 8-f 後之候選分析與排程」**（仍 🔄 進行中；per `docs/future-roadmap.md` §2 + `docs/phase-8g-completion-report.md`）。已落地重點：

- **Phase 8-g-0 系列**：候選分析 + roadmap 更新（9 項候選 + 額外 candidate C / S/T / F；含 fixture / sample end-to-end 之 deferred 決策）
- **Phase 8-g-2 系列**：`new-post.js` series 欄位 CLI flags + stderr-only next number suggestion（保守路線；無互動 prompt）
- **Phase 8-g-2-d 系列**：`validate-content.js` 4 條新 series structure warning（`series-id-not-in-settings` / `series-block-missing-number` / `series-subtitle-without-id` / `series-number-duplicate`）+ validation-fixtures
- **Phase 8-g-4 系列（候選 C）**：schema docs ↔ phase reports cross-link 補強（含本文件 §8.1 之 Phase 8 系列完成報告清單）
- **Phase 8-g-5 / 8-g-6（sample / template alignment）**：2 篇正式 sample posts + 5 個 markdown post templates 之 `type` → `contentKind` + body leading `# 文章標題` 移除
- **Phase 8-g-12 系列**：`series-title-unresolved` warning rule + validation fixture（升級 `titleTemplate` placeholder 解析之 helper-internal traceability 為 `validate-content` user-visible warning）

**相容層退場未啟動**；屬 **Phase 8-h 或更晚**之 future candidate（per `docs/phase-8g-completion-report.md` §3.6.5 / §3.7.5 / §3.9.6 / §5.5）。所謂相容層包含：

- `src/scripts/load-posts.js` 之 `contentKind ?? data.type` fallback
- `src/scripts/validate-content.js` 之 `frontmatter-uses-deprecated-type` warning rule
- `src/scripts/parse-markdown.js` 之 H1 → H2 自動降級

Phase 8-g overall **仍 🔄 進行中**（仍有 candidate 5 / 6 / 7 / series report / Phase 8-g-1 fixture deferred / fb-sidecar §5.2.6 保守決策保留 + 本批 publish-bundle §7 過時描述對齊等 future candidates）；**不應誤標 Phase 8-g 為已全部完成**。

詳細落地紀錄詳見 `docs/phase-8g-completion-report.md`。

---

## §8 與既有 docs 之 cross-link

下列既有文件之相關章節，將於 Phase 8-a 收尾批次以「在相關章節末加 See also 一行」之最小變更，由本規範與其他 8-a 文件單向 cross-link 連入。既有文件本身於 Phase 8-a 第一批至倒數第二批之間**不予修改**。

- `CLAUDE.md` §3.1（文章資料）、§3.2（站台設定）、§24（Blogger 發布 URL 回填）
- `docs/content-schema.md`
- `docs/blogger-export.md`
- `docs/promotion-export.md`
- `docs/publish-workflow.md`

cross-link 補回時不得重寫既有章節，僅以最小篇幅指向新文件。

### 8.1 Phase 8 系列完成報告

下列為 Phase 8-b 起至 Phase 8-g 之完成報告與跨 phase 路線總覽。各 phase 之實作落地紀錄、commit 清單、驗證結果與後續候選排程詳見對應文件：

- `docs/phase-8b-completion-report.md`（Phase 8-b：load-posts sidecar 整合 + `contentKind` 相容 + `pages/` 路徑支援）
- `docs/phase-8c-completion-report.md`（Phase 8-c：placeholder resolver helper + validate / build-promotion 接入）
- `docs/phase-8d-completion-report.md`（Phase 8-d：normalized post output helper + 各輸出路徑漸進採用）
- `docs/phase-8e-completion-report.md`（Phase 8-e：series metadata schema 規格化 + validate warning-only 規則 + validation-fixtures）
- `docs/phase-8f-completion-report.md`（Phase 8-f：series metadata 接入 build pipeline）
- `docs/phase-8g-completion-report.md`（Phase 8-g：候選分析 + `new-post.js` series prompt + validate series 規則）
- `docs/future-roadmap.md`（跨 phase 路線總覽與下一步候選排程）

---

## §9 對 Phase 1-7 之承諾

### 9.1 零功能變更

Phase 8-a 階段不改變任何 npm script 之輸出與行為：

- `npm run dev`：行為不變
- `npm run build` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap` / `build:blogger-theme`：產物 byte-identical
- `npm run validate:content`：規則與 exit code 不變
- `npm run report:*` / `check:*` / `new:post`：行為不變

### 9.2 既有文章不需改動

`content/{github,blogger}/posts/*.md` 之既有 frontmatter 結構於 Phase 8-a 階段完全不需調整。文章遷移屬 Phase 8-b 之後逐篇進行之工作，不在本階段範圍內。

### 9.3 既有 settings 與模板不變

`content/settings/*.json` 與 `content/templates/` 之既有檔案於 Phase 8-a 階段不予修改。Phase 8-a 僅新增以底線開頭之 sample 範本（`_sample.publish.json`、`_sample.fb.md`、`_sample-from-frontmatter.publish.json`），與既有檔案區隔明確。

### 9.4 既有 src 不變

`src/scripts/*.js`、`src/views/**/*.ejs`、`src/styles/**/*.scss` 於 Phase 8-a 階段完全不予修改。

---

（本文件結束）
