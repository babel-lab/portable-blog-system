# `.fb.md` Sidecar 格式規範 (Facebook Promotion Sidecar Schema)

本文件為 `.fb.md` 之完整格式規範。所有讀取、寫入、驗證 `.fb.md` 之實作皆須以本文件為準。

對應之上層規範詳見 `docs/publish-bundle.md`；對應之 `.publish.json` 規格詳見 `docs/publish-json-schema.md`。

對應之範本檔 `_sample.fb.md` 將於 Phase 8-a 後續批次建立，本文件先行公布規格與簡短範例（見 §10）。

---

## §1 檔名規則

### 1.1 命名

每篇文章之 `.fb.md` 檔名為：

```
{slug}.fb.md
```

`{slug}` 必須與同資料夾內 `{slug}.md` 之 frontmatter `slug` 欄位、以及同資料夾內 `{slug}.publish.json`（若存在）之檔名前綴完全一致。

### 1.2 位置

`.fb.md` 與對應之 `.md` 位於同一資料夾。本檔同時適用於 `posts/` 與 `pages/` 資料夾：

posts：

```
content/blogger/posts/example.md
content/blogger/posts/example.fb.md

content/github/posts/example.md
content/github/posts/example.fb.md
```

pages：

```
content/blogger/pages/about.md
content/blogger/pages/about.fb.md

content/github/pages/tools-index.md
content/github/pages/tools-index.fb.md
```

`pages/` 之 sidecar 規範與 `posts/` 完全一致；publish bundle 適用範圍與 Page 一級支援詳見 `docs/publish-bundle.md` §2.5。

不得置於 `content/templates/`、`content/{site}/posts/`、`content/{site}/pages/` 以外之其他資料夾，亦不得置於 `dist-*` 內。

### 1.3 編碼與格式

- 編碼：UTF-8 無 BOM
- 換行：LF
- 內容：合法之 YAML frontmatter + Markdown body 結構（詳見 §2）

### 1.4 一對一關係

一篇文章對應一份 `.fb.md`。`.fb.md` 不得脫離對應 `.md` 單獨存在。若 `.md` 被刪除或封存，對應之 `.fb.md` 應一併刪除或移至 `content/archive/`（屬作者操作）。

### 1.5 `posts/` 與 `pages/` 皆適用

`.fb.md` 同時適用於 `content/{site}/posts/` 與 `content/{site}/pages/` 資料夾。Page 之 FB 推廣文案需求與 post 一致，採完整 sidecar 結構，**不另設簡化版**。Page 不因「於 Blogger 後台被歸為網頁」而失去 FB 推廣能力，所有 §3 之 frontmatter 欄位、§4 之 body 規格、§5 之 placeholder、§7 之 severity 規則皆同等適用。

詳細之 publish bundle 適用範圍與 Page 一級支援原則詳見 `docs/publish-bundle.md` §2.5。

---

## §2 結構

### 2.1 整體結構

`.fb.md` 由 YAML frontmatter 與 Markdown body 兩段構成：

```
---
<YAML frontmatter>
---

<Markdown body>
```

frontmatter 以兩道 `---` 分隔線界定，必須位於檔案開頭。frontmatter 段之後可空一行或多行；其後之內容皆視為 body。

### 2.2 frontmatter 段

frontmatter 為標準 YAML，欄位定義詳見 §3。frontmatter 段必須存在；若缺漏（檔案無 `---` 分隔線、或 frontmatter 為空）則視為格式錯誤，validate 階段列為 error。

### 2.3 body 段

body 為標準 Markdown，作為 FB 貼文之純文字內容使用。Markdown 之精細排版指令（如 `**bold**`、表格、程式碼區塊）於 FB 平台不被解析，故建議僅使用換行、段落分隔、純文字、URL 與 emoji。詳見 §4。

---

## §3 frontmatter 欄位

### 3.1 欄位總表

| 欄位 | 型別 | 必填 | 預設值 | 說明 |
| --- | --- | --- | --- | --- |
| `enabled` | boolean | 是 | `false` | 是否啟用本篇 FB 文案；§6 判定之第二條件 |
| `page` | string | 否 | `""` | 對應 `promotion.config.json` 中之 page key；空字串時 fallback 至 `defaultPage` |
| `target` | enum | 是 | `"auto"` | 文章 URL 解析目標；列舉值見 §5.4 |
| `customUrl` | string | 否 | `""` | 當 `target === "custom"` 時使用之外部 URL；其他 target 值下忽略 |
| `hashtags` | array of string | 否 | `[]` | FB 貼文使用之 hashtag 陣列；建議帶 `#` 號 |
| `title` | string | 否 | `""` | FB / OG 標題；空字串時 fallback 至 `.md` frontmatter `title` |
| `titleEn` | string | 否 | `""` | FB 貼文英文標題 metadata；空字串時 fallback 至 `.md` frontmatter `titleEn`；FB 端目前可暫不顯示，欄位保留供未來 GitHub / SEO / 跨平台轉換使用（詳見 §3.4 與 `docs/series-schema.md` §7） |
| `note` | string | 否 | `""` | 作者備忘，不輸出至 FB 貼文 |
| `finalUrl` | string | 否 | `""` | FB 貼文 body 中要放入之**目標文章 URL**（指向 Blogger / GitHub article）；方向為 FB → article；與 `fbPostUrl` 不可混用（詳見 §3.5.1）；Phase 20260520-c-2 正式收編（schema drift closure） |
| `fbPostUrl` | string | 否 | `""` | **FB 貼文本身之 URL**（指向 Facebook 上之該則貼文）；方向為 → FB；由作者於 FB 發佈後手動回填；**不**加 UTM；與 `finalUrl` 不可混用；Phase 20260520-c-2 正式收編 |
| `fbPostedAt` | string | 否 | `""` | FB 實際發佈時間；建議格式 ISO 8601（如 `2026-05-20T10:30:00+08:00`）或 `YYYY-MM-DD HH:mm`；canonical 格式留待後續批次決議；Phase 20260520-c-2 正式收編 |
| `fbPostId` | string | 否 | `""` | optional；FB Graph API 之 post ID（numeric / GUID）；第一階段**不**依賴此欄位；Phase 20260520-c-2 正式收編 |
| `fbCampaign` | string | 否 | `""` | optional；**人工分類標記**用途（如 `book-review-2026q2`）；**不**等同 `promotion.config.json` 之 UTM `campaign`（後者由 build 階段動態組裝）；Phase 20260520-c-2 正式收編 |

### 3.2 欄位驗證細節

- `enabled` 必須為 boolean；其他型別（如字串 `"true"`、整數 `1`）視為 invalid，列為 warning
- `page` 之合法值由 `promotion.config.json` 之 `facebook.pages` 動態決定；驗證規則見 §8.1
- `target` 必須為 §5.4 列舉值之一；其他值列為 error
- `customUrl` 僅於 `target === "custom"` 時生效；非 custom 但 `customUrl` 非空字串時列為 warning
- `hashtags` 必須為陣列，元素必須為字串；不符 → warning
- `title` / `titleEn` / `note` 為自由字串，本文件不限長度
- `titleEn` 預期為英文文本（不強制；作者可自由使用其他語言）；空字串時 build 階段 fallback 至 `.md` frontmatter `titleEn`
- `finalUrl` / `fbPostUrl` 為自由字串；建議非空字串時為合法 URL（`http(s)://` 開頭）；非 string 列為 warning；URL 格式驗證之 severity 與生效時機留待 Phase 8-c 後續批次決議（同 §7.4）
- `fbPostedAt` 為自由字串；建議格式 ISO 8601 或 `YYYY-MM-DD HH:mm`；canonical 格式 + 解析驗證之 severity 留待後續批次決議
- `fbPostId` / `fbCampaign` 為自由字串；本文件不限長度；非 string 列為 warning

### 3.3 不允許之欄位

frontmatter 不得包含本表以外之欄位。出現未列欄位於 validate 階段列為 warning，不阻擋 build。新增欄位屬規格變更，應更新本文件。

Phase 8-e-2 起，`titleEn` 已正式納入 §3.1 之允許欄位清單，**不再視為未列欄位**；其他擬議擴充欄位之 TBD 狀態詳見 §12.2。

Phase 20260520-c-2 起，`finalUrl` / `fbPostUrl` / `fbPostedAt` / `fbPostId` / `fbCampaign` 5 欄位已正式納入 §3.1 之允許欄位清單，**不再視為未列欄位**。其中 `finalUrl` 之收編為 schema drift 之 closure（既有 `.fb.md` 已含此欄位，但 §3.1 此前未列；詳見 §3.5.2）；其餘 4 欄位之 proposal 詳見 `docs/fb-post-url-metadata-proposal.md`（commit `dbbe002`）；Admin overview detail panel 已於 Phase 20260520-c-1（commit `aa08e66`）read-only 接通顯示（詳見 §3.5.4）。

### 3.4 Blogger title / FB title / titleEn 之關係

Phase 8-e-2 起，`.fb.md` frontmatter 之 `title` 與 `titleEn` 與 `.md` frontmatter 之 `title` / `titleEn`、`.publish.json` 之 `seo.metaTitle` 形成多處 title metadata 之分工：

| 欄位 | 位置 | 用途 |
| --- | --- | --- |
| `.md` frontmatter `title` | 文章層 | 文章本體標題 |
| `.md` frontmatter `titleEn` | 文章層 | 文章本體英文標題 |
| `.publish.json` `seo.metaTitle` | 發布層 | SEO override；空字串時 fallback 至 `.md` frontmatter `title` |
| `.fb.md` frontmatter `title` | FB 推廣層 | FB 貼文標題；空字串時 fallback 至 `.md` frontmatter `title` |
| `.fb.md` frontmatter `titleEn` | FB 推廣層 | FB 貼文英文標題 metadata；空字串時 fallback 至 `.md` frontmatter `titleEn` |

關係原則：

- **Blogger 文章 title 與 FB 貼文 title 預設可相同**，以利 SEO / 搜尋一致性（詳見 `docs/series-schema.md` §6.1）
- **Blogger title 與 FB title 允許後續手動修改**，不永久鎖定；validate 階段不強制三處一致（詳見 `docs/series-schema.md` §6.4）
- **`titleEn` 為英文 metadata 欄位**，FB 端目前可暫不顯示，但仍應保留在 sidecar schema，方便未來 FB / GitHub / SEO / 跨平台轉換使用（詳見 `docs/series-schema.md` §7）

### 3.5 FB post metadata（`finalUrl` / `fbPostUrl` / `fbPostedAt` / `fbPostId` / `fbCampaign`）

Phase 20260520-c-2 起，本節正式定義 5 個 FB post metadata 欄位之語意分工、區分原則、Admin 整合狀態、後續落地階段。

#### 3.5.1 `finalUrl` / `fbPostUrl` 語意區分（**必讀**）

兩個 URL 概念**截然不同**，不可混用、不可互推導、不可共用同一欄位：

| 欄位 | 語意 | 方向 | 來源 | 用途 |
| --- | --- | --- | --- | --- |
| `finalUrl` | FB 貼文 body 內要放入之**目標文章 URL** | **FB → article** | 由 build 階段依 `target` + `publishedUrl` 推導；或作者手動填 | 提供給 FB 讀者「點此連結看完整文章」之 outbound link |
| `fbPostUrl` | **FB 貼文本身之 URL** | **→ FB** | 由作者於 FB 發佈後手動回填 | 用於 Admin / 報表 / 反向回查；指向 FB 內 |

簡記：

- `finalUrl`：**從 FB 出去**的連結（FB → article）
- `fbPostUrl`：**指回 FB** 的連結（任何地方 → 該則 FB 貼文）

詳細之 schema 設計動機、典型 user flow、未來落地階段（P1-P6 roadmap），詳見 `docs/fb-post-url-metadata-proposal.md`（commit `dbbe002`）§2 / §3 / §5。

#### 3.5.2 `finalUrl` 之 schema drift closure

過去批次起既有 `.fb.md` 已含 `finalUrl` 欄位（如 `content/blogger/posts/20260515-we-media-myself2.fb.md` 與 `content/github/posts/20260504-github-pages-blog-planning.fb.md`），但 §3.1 此前未列 → 屬 schema drift（per `docs/fb-post-url-metadata-proposal.md` §6 之觀察）。Phase 20260520-c-2 將 `finalUrl` 正式納入 §3.1，drift 關閉。

`finalUrl` 與 §5 placeholder（`{{ articleUrl }}` / `{{ blogger.publishedUrl }}` / `{{ github.publishedUrl }}` / `{{ canonicalUrl }}`）之關係：

- placeholder 與 `finalUrl` 為**兩種可選機制**：
  - 採 placeholder（推薦；自動解析）：body 內寫 `{{ articleUrl }}` 等；build 階段套入實際 URL
  - 採 `finalUrl`（手動覆寫）：作者於 frontmatter 顯式指定；可覆寫 placeholder 推導結果
- 兩者同時使用時之優先序與互動行為，留待後續批次（或專屬 batch）決議；本批不裁決
- 本 Phase 20260520-c-2 不改 `build-promotion.js` 對 `finalUrl` 之既有處理（若有）；僅正式收編 schema 文件層

#### 3.5.3 第一階段不做事項（per `docs/fb-post-url-metadata-proposal.md` §4）

- **不**做真正寫入（schema 已收編，但 Admin 仍為 read-only display）
- **不**接 FB Graph API
- **不**自動抓 `fbPostUrl`（手動回填）
- **不**把 `fbPostUrl` 寫入 Blogger / GitHub article（屬 `.fb.md` 私有 metadata）
- **不**影響 sitemap / production dist
- **不**對 `fbPostUrl` 加 UTM（`fbPostUrl` 為指回 FB 之 URL，不需 UTM）
- **不**啟動 Admin write（屬未來 Admin-2-b-3+ 或更晚批次）

#### 3.5.4 與 Admin read-only 之關係

Phase 20260520-c-1（commit `aa08e66`）起，Admin overview detail panel 已 read-only 顯示 4 個 fb post 欄位（`fbPostUrl` / `fbPostedAt` / `fbPostId` / `fbCampaign`）：

- loader（`src/scripts/load-admin-posts.js`）之 `readFbSidecarMeta()` 讀 `.fb.md` frontmatter 之 4 個欄位；空值 / 缺欄位 / 非 string 一律回 `""`（共用 `strOrEmpty()` helper），不 throw
- detail panel "FB Post (read-only metadata)" section 顯示 4 個欄位；`fbPostUrl` 有值時用 `<a target="_blank" rel="noopener noreferrer">` 包；空值顯示 `(empty)`
- **Admin 為 read-only**；無 form / 無 input / 無 button writes；無 fetch / 無 fs API；真正寫入需另開 Admin-2-b-3+ 或更晚 write batch
- Admin detail panel 內之 disclaimer note 目前仍寫「proposal；尚未正式收編」；屬 Phase 20260520-c-2 收編前之既有文字；本 Phase 之 spec 明確限制「不改 Admin UI」，故本批不同步更新該 disclaimer；下次 Admin UI 更新時應同步調整為「Phase 20260520-c-2 已收編」

#### 3.5.5 後續落地階段（roadmap；per `docs/fb-post-url-metadata-proposal.md` §5）

| 階段 | 內容 | 狀態 |
| --- | --- | --- |
| **P1** | schema 正式收編 | ✅ 本 Phase 20260520-c-2 落地 |
| **P2** | Admin overview detail panel read-only 顯示 | ✅ Phase 20260520-c-1（commit `aa08e66`）已落地 |
| **P3** | Admin completeness 加 FB published 維度（條件：`.fb.md` `enabled === true` && article `status === 'published'` && `fbPostUrl` 為空 → `completeness.fbPosted = 'missing'`） | 🟡 低-中風險；屬未來批 |
| **P4** | Admin dry-run edit / 真實 write（先 dry-run viewer → user 確認 → 實際 write） | 🟡 中風險；需 write strategy 對齊 |
| **P5** | Blogger / GitHub article 內顯示「也看 FB 貼文」outbound link（若 `fbPostUrl` 非空） | 🟡 中風險；可選；屬非必要功能 |
| **P6** | FB Graph API 自動抓 `fbPostUrl` | 🔴 遠期；違反 `CLAUDE.md` §29「不接 FB API / 不自動社群發文」之預設邊界；屬 Z 類第二階段暫緩；需 user 明確啟動 |

---

## §4 body 規格

### 4.1 內容定位

body 為 FB 貼文之**純文字內容**。於 build 階段經 placeholder 解析後，整段輸出至：

```
dist-promotion/facebook/{site}/{slug}.txt
```

作者再手動複製貼上至 Facebook 後台。

### 4.2 Markdown 使用建議

由於 Facebook 貼文不解析 Markdown 語法，body 雖以 `.fb.md` 副檔名標示為 Markdown，實務上建議：

- **可使用**：換行、空行段落分隔、純文字、URL、emoji
- **避免使用**：粗體、斜體、標題、表格、清單符號、程式碼區塊、圖片語法（FB 不顯示，反而干擾閱讀）

若作者選擇使用部分 Markdown 標記，build 階段不主動移除，最終呈現以 FB 平台為準。

### 4.3 多段結構

body 允許多段、多空行。空行作為段落分隔被保留至輸出 `.txt`。

### 4.4 placeholder 嵌入

body 中可嵌入 URL placeholder（詳見 §5），於 build 階段被解析為實際 URL。

### 4.5 hashtag 與 body 之關係

`hashtags` 欄位與 body 內容彼此獨立。build 階段預設將 `hashtags` 陣列以空格串接、附於 body 結尾輸出。實際輸出格式由 `src/views/promotion/facebook-post.ejs` 模板決定，本文件不另指定。

---

## §5 URL placeholder

### 5.1 支援清單

`.fb.md` body 內可使用下列 URL placeholder：

- `{{ articleUrl }}` — 依 `target` 動態解析之文章 URL
- `{{ blogger.publishedUrl }}` — 強制為 Blogger 平台之 `publishedUrl`
- `{{ github.publishedUrl }}` — 強制為 GitHub Pages 平台之 `publishedUrl`
- `{{ canonicalUrl }}` — 強制為 canonical URL（依 `.publish.json` `canonical` 區塊）

placeholder 名稱為 case-sensitive。其他名稱（含拼寫變體、未定義路徑）皆視為未知 placeholder，build 階段不解析、validate 階段列為 warning。

### 5.2 比對規則

placeholder 比對容忍左右空白：

```
{{KEY}}        ← 視為同一 placeholder
{{ KEY }}      ← 視為同一 placeholder
{{  KEY  }}    ← 視為同一 placeholder
```

對應之概念正規表達式為：

```
\{\{\s*KEY\s*\}\}
```

其中 `KEY` 為 §5.1 列舉之 placeholder 名稱。實作時 `KEY` 中之路徑符號 `.`（如 `blogger.publishedUrl`）必須以正規表達式之 escape 形式比對。

不容忍 `{{` 與 `}}` 之間出現換行。跨行 placeholder 不被解析。

### 5.3 各 target 對應之 `articleUrl`

`{{ articleUrl }}` 之解析結果依 frontmatter `target` 欄位動態決定（詳見 §5.4）。其他三個 placeholder（`{{ blogger.publishedUrl }}` / `{{ github.publishedUrl }}` / `{{ canonicalUrl }}`）不受 `target` 影響，固定指向各自對應欄位。

### 5.4 `target` 列舉值與解析來源

`target` 之合法值如下：

| `target` 值 | `{{ articleUrl }}` 解析來源 |
| --- | --- |
| `"auto"` | 依 `primaryPlatform` 與可用 `publishedUrl` 推導；詳見 §5.5 |
| `"blogger"` | `.publish.json` `blogger.publishedUrl` |
| `"github"` | `.publish.json` `github.publishedUrl`，缺則 fallback 至 `site.config.json` `githubSiteUrl` + `github.path`（沿用 `docs/publish-json-schema.md` §8.4） |
| `"canonical"` | `.publish.json` `canonical.url` |
| `"custom"` | frontmatter `customUrl` 欄位 |

未列於上述者皆視為 invalid，validate 階段列為 error。

### 5.5 `target === "auto"` 之解析原則

`target === "auto"` 時，`{{ articleUrl }}` 依以下順序推導：

1. 若 `primaryPlatform === "blogger"`：取 `blogger.publishedUrl`；若為空字串，進入步驟 2
2. 若 `primaryPlatform === "github"`：取 `github.publishedUrl`（含 §5.4 之 fallback）；若為空字串，進入步驟 3
3. 步驟 1 或 2 之選定平台 URL 為空字串時：取 `canonical.url`
4. 全部皆為空字串：解析失敗，依 §7.2 之 placeholder 未解析 severity 規則處置

### 5.6 Blogger URL 預測禁則（強制規範）

下列規則承襲自 `docs/publish-json-schema.md` §5.3：

- 系統不得自行組出 Blogger 之 `publishedUrl`
- 若 `blogger.publishedUrl` 尚未回填（為空字串），系統不得以 `bloggerSiteUrl + permalink` 或任何月份組合替代
- Blogger URL 必須等實際發布後由作者回填至 `.publish.json` 之 `blogger.publishedUrl`
- 因此 `target === "blogger"` 但 `blogger.publishedUrl` 為空時，`{{ articleUrl }}` 與 `{{ blogger.publishedUrl }}` 皆判為解析失敗，依 §7.2 處置

### 5.7 解析失敗之處置

placeholder 解析失敗（對應欄位為空字串、缺漏、或無法推導）時：

- build 階段不阻擋產出 `.txt`；於該檔內保留原始 placeholder 字串（例：`{{ articleUrl }}` 不被替換），作者於最終貼文前可肉眼辨識
- validate 階段依 §7.2 之 severity 矩陣處置

build 階段不得以「未知 URL」或任意預測值替換未解析之 placeholder。

---

## §6 FB 文案存在判定

### 6.1 兩條件 AND

「FB 文案存在」之判定為下列兩條件之**邏輯 AND**：

1. `{slug}.fb.md` 檔案存在
2. `.fb.md` frontmatter `enabled === true`

兩條件缺其一，視為「FB 文案缺漏」。

### 6.2 反例

下列情況皆視為「FB 文案缺漏」：

- `.fb.md` 檔案不存在
- `.fb.md` 檔案存在但 frontmatter 缺 `enabled` 欄位
- `.fb.md` 檔案存在但 `enabled === false`
- `.fb.md` 檔案存在但 frontmatter 為非合法 YAML 或無法解析

「檔案存在但 `enabled === false`」明確視為缺漏，**不視為「作者選擇不發 FB」之合法狀態**。作者若暫不欲發 FB，仍應建立 `.fb.md` 並填入完整文案備用，僅將 `enabled` 設為 `false` 暫停；遇 §7.1 之 severity 判定時依 status 對應 severity 處置。

### 6.3 與 frontmatter `promotion.facebook.enabled` 之關係

舊 frontmatter `promotion.facebook.enabled` 於 Phase 8-b 相容期內仍作為 fallback 使用。當 `.fb.md` 不存在但 frontmatter `promotion.facebook.enabled === true` 時，視為「FB 文案存在於 frontmatter 之相容期路徑」；此情況下 §6.1 之第一條件不成立，仍判為缺漏，但於 8-b 相容期內 severity 應依 §9 之相容性規則調整為 warning，不直接 error。

詳細之相容期 severity 處置規則屬 Phase 8-c 之實作範圍。

---

## §7 severity 規則

### 7.1 FB 文案缺漏之 severity

依 `.md` frontmatter 文件層級 `status` 動態判定：

| 文章 status | severity |
| --- | --- |
| `draft` | warning |
| `ready` | error（擋正式檢查） |
| `published` | error（擋正式檢查） |
| `archived` | warning |

「擋正式檢查」之具體行為由 `validate-content` 之 exit code 與 severity 機制決定，沿用 Phase 5-g 既有設計。

### 7.2 placeholder 未解析之 severity

| 文章 status | severity |
| --- | --- |
| `draft` | warning，不擋 build |
| `ready` | error，擋正式檢查 |
| `published` | error，擋正式檢查 |
| `archived` | warning |

未解析之 placeholder 若被作者複製貼上至 Facebook，將輸出原始字串（例：`{{ articleUrl }}`），導致導流連結錯誤。`ready` / `published` 階段對此採 error 阻擋；`draft` / `archived` 階段採 warning 提醒。

### 7.3 與 `docs/publish-bundle.md` §4 之關係

本文件 §7.1 與 §7.2 之 severity 矩陣為 `docs/publish-bundle.md` §4 之具體落地版本。`publish-bundle.md` 為總則；本表為 `.fb.md` 之專屬適用條目。

### 7.4 規則生效時機

§7.1 與 §7.2 之**實作落地時機為 Phase 8-c**。Phase 8-a 至 Phase 8-b 期間本文件僅作為規範依據，`validate-content.js` 尚未加入對應規則。

---

## §8 與 `promotion.config.json` 的關係

### 8.1 `page` 欄位驗證

`.fb.md` frontmatter `page` 欄位之合法值由 `content/settings/promotion.config.json` 之 `facebook.pages` 動態決定。

驗證規則：

- `page` 必須為 `pages` 中**存在**之 key
- 對應之 `pages[page].enabled` 必須為 `true`
- 兩條件任一不符 → warning，不阻擋 build

`page` 為空字串時，fallback 至 `promotion.config.json` 之 `facebook.defaultPage`。`defaultPage` 亦須符合上述兩條件。

### 8.2 全域開關

`promotion.config.json` 之 `facebook.enabled` 為全域開關。當全域 `enabled !== true` 時：

- 所有 `.fb.md` 不再產出 `dist-promotion/facebook/{site}/{slug}.txt`
- validate 階段列 warning（沿用 Phase 4-g 之 `promotion-globally-disabled` 規則）
- 不視為 §7.1 之 FB 文案缺漏 error 條件

### 8.3 UTM 與粉專設定不寫死於 `.fb.md`

UTM 參數、粉專完整名稱、URL pattern、campaign 命名規則等仍由 `promotion.config.json` 集中管理。`.fb.md` **不得**寫死下列欄位：

- UTM 參數（`utm_source` / `utm_medium` / `utm_campaign` / `utm_content`）
- 粉專完整名稱
- campaign / content 命名 pattern

UTM 之套用由 build 階段依 `promotion.config.json` 之 `facebook.utm` 設定動態組裝。

### 8.4 `.fb.md` 與 `promotion.config.json` 之分工

| 資料類型 | 管理位置 |
| --- | --- |
| 個別文章之 FB 文案內容 | `.fb.md` body |
| 個別文章之 hashtag、target、customUrl、note | `.fb.md` frontmatter |
| 粉專定義、enabled 狀態、defaultPage | `promotion.config.json` `facebook.pages` |
| UTM 規則、campaign / content pattern | `promotion.config.json` `facebook.utm` |
| FB 全域開關 | `promotion.config.json` `facebook.enabled` |

---

## §9 與既有 frontmatter `promotion.facebook` 的關係

### 9.1 範圍

既有 `.md` frontmatter 之 `promotion.facebook` 區塊（Phase 1-7 既有設計，含 `enabled` / `page` / `title` / `message` / `target` / `hashtags` / `note` 等欄位）為舊路徑。Phase 8 引入 `.fb.md` sidecar 後，二者形成新舊兩條路徑並存。

### 9.2 Phase 8-a 階段：僅定義規格，不執行遷移

Phase 8-a 階段不執行任何 frontmatter `promotion.facebook` 至 `.fb.md` 之資料遷移。既有文章之 frontmatter 不予改動。

### 9.3 Phase 8-b 階段起進入相容期

Phase 8-b 啟用 `.fb.md` 讀取後，進入相容期：

- 同欄位同時存在於 `.fb.md` frontmatter 與 `.md` frontmatter `promotion.facebook` 時：**`.fb.md` 勝**
- `.fb.md` 不存在時：fallback 至 `.md` frontmatter `promotion.facebook`
- 兩者皆無：依 §7.1 之 severity 規則判定

### 9.4 衝突處置

當 `.fb.md` 與 `.md` frontmatter `promotion.facebook` 同時提供同一欄位且值不同時：

- sidecar 勝出
- validate 階段列 warning，提示作者整理資料來源
- **不得升為 error**（沿用 `docs/publish-bundle.md` §3.2 之相容性原則）

### 9.5 詳細對照表延至遷移文件

`promotion.facebook.message` 與 `.fb.md` body、`promotion.facebook.hashtags` 與 `.fb.md` frontmatter `hashtags` 等之逐欄位對照表，留待 `docs/migration-from-frontmatter.md` 撰寫（屬 Phase 8-a 後續批次）。本文件不重複列出。

### 9.6 相容層退場時機

`.md` frontmatter `promotion.facebook` 之相容層退場屬 Phase 8-g 之決策，由作者於所有文章遷移完成後另行決定。

---

## §10 範例

下列範例為**規格示意**，**不建立為範本檔**。範本檔 `_sample.fb.md` 屬 Phase 8-a 後續批次建立。

### 10.1 簡短範例：書評文章

```
---
enabled: true
page: "fan1"
target: "auto"
customUrl: ""
hashtags:
  - "#貝果書屋"
  - "#書評"
  - "#AI玩轉自媒體的52個商業思維"
title: ""
note: "排程晚間發文"
---

[貝果書屋] 《自媒自創：AI玩轉自媒體的52個商業思維》

書封完全沒有文字，會有人敢買嗎？

買了後發現…是本在講用 AI 提示詞驗證自己的「自媒體藍圖筆記書」。

👇 完整故事與漫畫全文：
{{ articleUrl }}
```

說明：

- `enabled: true` 且檔案存在，符合 §6 判定
- `target: "auto"` → `{{ articleUrl }}` 依 `primaryPlatform` 推導（§5.5）
- `customUrl` 留空（target 非 custom）
- `note` 為作者備忘，不輸出
- `title` 留空，build 階段 fallback 至 `.md` frontmatter `title`

### 10.2 簡短範例：純導流卡（指定 Blogger）

```
---
enabled: true
page: "fan1"
target: "blogger"
customUrl: ""
hashtags:
  - "#新文上線"
title: ""
note: ""
---

新文上線，整理 GitHub Pages 免費空間限制與部落格規劃。

👇 詳細整理：
{{ blogger.publishedUrl }}
```

說明：

- `target: "blogger"` → `{{ articleUrl }}` 解析來源為 `blogger.publishedUrl`
- 此例作者直接使用 `{{ blogger.publishedUrl }}` 而非 `{{ articleUrl }}`，於本範例兩者解析結果一致；但語意上前者明確、後者依 target 動態，可讀性差異留作者自行選擇

### 10.3 範例使用注意

完整範本檔 `content/templates/_sample.fb.md` 將於 Phase 8-a 後續批次建立。本批次僅以本節 §10 之示意範例先行公布規格用法，**不建立 `_sample.fb.md` 檔案**。

---

## §11 範本參照

### 11.1 起點範本（後續批次建立）

作者建立新 `.fb.md` 時，將自下列範本複製為起點：

```
content/templates/_sample.fb.md
```

該範本將於 Phase 8-a 後續批次建立。本文件先行公布規格與簡短範例（§10）；範本檔之欄位、預設值、結構必須與本文件一致。

### 11.2 範本與本規範之一致性

範本檔之內容必須與本文件之 §3 / §5 / §6 / §10 一致。若兩者不同，以本文件為準，範本應更新對齊。

範本變更不視為規格變更，不需更新本文件。

---

## §12 與系列文章 metadata 之分工（cross-link）

### 12.1 series 不放 `.fb.md`

系列文章 metadata（`series.id` / `series.name` / `series.number` / `series.subtitle` / `series.titleTemplate` / `series.hashtags` 等）為**內容屬性**，放在 `.md` frontmatter 或集中設定檔 `content/settings/series.json`（詳見 `docs/series-schema.md` §1 與 §11），**不**置於 `.fb.md`。

`.fb.md` 第一版 frontmatter 7 欄位（`enabled` / `page` / `target` / `customUrl` / `hashtags` / `title` / `note`）沿 §3.1 定義不變，**本批次不擴大**。

### 12.2 後續批次預告之新欄位

Phase 8-e-1 之 series metadata 規格（`docs/series-schema.md`）所預告之 `.fb.md` 擴充項目中：

- **`titleEn`：已於 Phase 8-e-2 落地至 §3.1**（詳見 §3.4 之 title metadata 分工說明、`docs/series-schema.md` §7）

下列欄位**仍為「後續批次待定（TBD）」**；本批**不正式納入 §3.1 schema、不允許實作**：

- `seriesNumberOverride`：單篇覆寫系列序號之極少數情境（詳見 `docs/series-schema.md` §5.4 / §10.3）
- `hashtagsInheritFromSeries`：是否從 series 繼承 hashtags 之顯式開關（詳見 `docs/series-schema.md` §8 / §10.3；目前採「自動繼承 + 單篇完整覆蓋」策略，未必需要此欄位）
- `seriesTitleOverride`：單篇覆寫系列標題之極少數情境

以上 TBD 欄位**仍不允許出現於 `.fb.md` frontmatter**；於 §3.3 判定下視為 warning。具體 schema 擴充需於 Phase 8-e-3 或更晚批次另開規格決定。

### 12.3 hashtags 預設來源與 series 之關係

`.fb.md` frontmatter `hashtags` 之預設來源與 series 之關係詳見 `docs/series-schema.md` §8。摘要：

- 當文章屬系列時，hashtags 預設來自 `series.hashtags`（或同系列第一篇文章之 `.fb.md` `hashtags`）
- 單篇 `.fb.md` 可完整覆寫；**不**採自動合併策略
- `series.hashtags` 屬系列定義層，**不**作為單篇 override 機制

**Phase 8-e-2 本批只定義 schema 文件**：`.fb.md` `hashtags` 目前仍為單篇 FB override；`series.hashtags` 預設帶出與繼承邏輯之**實作**屬後續 Phase 8-e 批次（建議 Phase 8-e-6 build script 接入時一併處理），**本批不改 `build-promotion.js` 的 hashtags 行為**。

#### 12.3.1 Phase 8-f-7-b 已落地：normalized 層 series.hashtags fallback

於 commit `592d45c` 落地之 `normalize-post-output.js` post-pass backfill 邏輯，擴充 `normalized.promotion.facebook.hashtags` 之 fallback chain：

```
1. .fb.md hashtags（非空 array；sidecar-first；本層既有最高優先）
2. legacy frontmatter.promotion.facebook.hashtags（非空 array）
3. series.hashtags（Phase 8-f-7-b 新增；當 1 / 2 皆解為 [] 時觸發）
4. []（最終 fallback）
```

**設計原則**（與 §8 / §15.6 / §19 對齊）：

- **`.fb.md` hashtags 仍是 FB hashtags 最高優先來源**；本批不破壞單篇 override 設計
- 若 `.fb.md` hashtags 與 legacy `promotion.facebook.hashtags` **都空**且文章屬 series，則 `normalized.promotion.facebook.hashtags` **fallback 到 `series.hashtags`**
- **不自動合併**；採完整 fallback（替換空陣列為 series.hashtags）
- **Blogger `post.tags` 與 FB hashtags 不互通**：Blogger 標籤為短 slug（`github`），FB hashtags 為 `#` prefix；格式不同；本批**不影響** Blogger `post.tags`；若未來要做 Blogger 標籤繼承，應另設 `series.tags` 短 slug 欄位，**不應直接沿用** FB `#hashtags`

詳細落地紀錄詳見 `docs/series-schema.md` §19 與 `docs/phase-8f-completion-report.md`。

### 12.4 title 與 series 之關係

`.fb.md` frontmatter `title` 與 `titleEn`（§3.1）與 Blogger `.md` frontmatter `title` / `titleEn`、`.publish.json` `seo.metaTitle` 之預設一致性規則、可手動修改原則，詳見 `docs/series-schema.md` §6 與 §7；本檔 §3.4 提供 title metadata 分工總表。摘要：

- 三處 title 預設相同（SEO 一致性）
- 若文章屬系列且定義 `series.titleTemplate`，預設值來自 template 套用結果
- 三處皆允許後續手動修改，build / validate 不強制鎖死
- `titleEn` 為英文 metadata；FB 端目前可暫不顯示，但欄位保留供未來使用

---

（本文件結束）
