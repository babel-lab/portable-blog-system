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

#### 2.4.5 與 CLAUDE.md §11 既有 `type` 命名之關係

CLAUDE.md §11「文章類型」既有 `type` 欄位（列舉 `post / tech-note / book-review / download / comic / life-note`）語意對應本文件之 `contentKind`。

**Phase 8-a 不修改 CLAUDE.md**。本文件以下列原則處置命名落差：

1. 8-a 起所有規範文件（本文件、`docs/publish-json-schema.md`、`docs/fb-sidecar-schema.md`、後續批次之 migration 文件）一律使用 `contentKind` 作為內容型態欄位名
2. CLAUDE.md §11 之 `type` 視為**舊命名**，待 Phase 8 後續批次（CLAUDE.md 整理批次）統一更名為 `contentKind`，更名時機由作者另行決定
3. CLAUDE.md 更名前，遇舊文章 frontmatter 出現 `type` 欄位時，視為 `contentKind` 之相容寫法。實作落地時機為 Phase 8-b 之後

明確標註：**「內容型態」之欄位名於 Phase 8-a 起正式由 `type` 重新命名為 `contentKind`，以避免與 `blogger.type` 之 `post` / `page` 撞名。**

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

### 7.4 Phase 8-d：Blogger permalink / publishedUrl 規則重整

`blogger.permalink` 自 `slug` 解耦；`publishedUrl` 為真相來源；copy-helper 與 publish-checklist 依此調整提示。Blogger URL 之 yyyy/mm 路徑僅由 publishedAt 或 publishedUrl 推導，缺則留空，不預測正式 URL。

### 7.5 Phase 8-e：AdSense templates + placements 重構

`ads.config.json` 改為 `templates + placements` 模型；文章 `blocks.ads` 改為 placement key 陣列。保留舊 `adsenseTop / adsenseMiddle / adsenseBottom` boolean 之相容層；同一篇文章同時使用新舊兩種寫法時 warning。

### 7.6 Phase 8-f：書評文章模組擴充

新增 comicGallery、Book JSON-LD、FAQ JSON-LD、CTA partial 等書評類文章專屬區塊。

### 7.7 Phase 8-g：相容層退場（可選）

待全部文章遷移完成後，評估是否退場 frontmatter fallback、AdSense 舊 boolean、validate 中 deprecated 警告。本階段是否執行由作者另行決定，非 Phase 8 必經階段。

---

## §8 與既有 docs 之 cross-link

下列既有文件之相關章節，將於 Phase 8-a 收尾批次以「在相關章節末加 See also 一行」之最小變更，由本規範與其他 8-a 文件單向 cross-link 連入。既有文件本身於 Phase 8-a 第一批至倒數第二批之間**不予修改**。

- `CLAUDE.md` §3.1（文章資料）、§3.2（站台設定）、§24（Blogger 發布 URL 回填）
- `docs/content-schema.md`
- `docs/blogger-export.md`
- `docs/promotion-export.md`
- `docs/publish-workflow.md`

cross-link 補回時不得重寫既有章節，僅以最小篇幅指向新文件。

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
