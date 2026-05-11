# K-01 promotion export

FB 推廣文案系統規格。**完整對應 CLAUDE.md §6 Phase 4 與本實作 Phase 4-a~4-g。**

---

## 1. 系統定位

- FB 推廣文案 **不顯示在文章內**，僅輸出成可手動貼到 FB 的 `.txt`。
- 不做 FB API 自動發文（CLAUDE.md §29 明文禁止）。
- 文章來源：`content/github/posts/*.md` 與 `content/blogger/posts/*.md`，由 `loadPosts` 共用過濾（draft / status:ready/published）。
- 輸出位置：`dist-promotion/facebook/`（被 `.gitignore` 排除，不入庫）。
- Build 入口：`npm run build:promotion`。

---

## 2. frontmatter schema：`promotion.facebook`

放在文章 frontmatter 內。**僅當 `enabled: true` 才會被處理**。

```yaml
promotion:
  facebook:
    enabled: false       # bool；預設 false 等於不發 FB
    page: "fan1"         # 粉絲頁代號，必須對應 promotion.config.json `pages` key
    title: ""            # FB 貼文標題；空則 fallback 至 post.title
    message: ""          # FB 推廣文案正文（必填，enabled=true 時）
    target: "auto"       # "auto" | "" | 絕對 http(s):// URL
    hashtags: []         # 字串陣列（必填，enabled=true 時至少 1 個）
    note: ""             # 內部備註，不輸出到 FB
```

| 欄位 | 類型 | enabled=true 時必填 | 說明 |
|---|---|---|---|
| `enabled` | bool | ✓（gate） | 是否輸出此篇的 FB 推廣 |
| `page` | string | ✓ | 對應 promotion.config.json `pages.{page}` |
| `title` | string | ✗ | 為空時 fallback 至 post.title |
| `message` | string | ✓ | FB 貼文正文 |
| `target` | string | ✗（預設 auto） | URL 解析方式：auto / 空 → 走 site 解析；http(s):// → 視為絕對 URL |
| `hashtags` | string[] | ✓（≥1） | FB 用 hashtag，可含或不含 `#` 開頭 |
| `note` | string | ✗ | 內部備註，純供作者自己看 |

---

## 3. `promotion.config.json` 結構

放在 `content/settings/promotion.config.json`。集中管理粉絲頁與 UTM。

```json
{
  "facebook": {
    "enabled": true,
    "defaultPage": "fan1",
    "pages": {
      "fan1": {
        "name": "粉絲頁 1",
        "enabled": true
      }
    },
    "utm": {
      "source": "facebook",
      "medium": "social",
      "campaignPattern": "{page}_post",
      "contentPattern": "{slug}"
    }
  }
}
```

| 路徑 | 說明 |
|---|---|
| `facebook.enabled` | 全域 kill switch；false 時所有 enabled 文章被視為「全域停用」 |
| `facebook.defaultPage` | 文章 `fb.page` 為空時的 fallback |
| `facebook.pages.{key}.name` | 給人看的粉絲頁名稱 |
| `facebook.pages.{key}.enabled` | 該粉絲頁是否啟用；false 時對應文章被擋 |
| `facebook.utm.source` | UTM `utm_source` 固定值 |
| `facebook.utm.medium` | UTM `utm_medium` 固定值 |
| `facebook.utm.campaignPattern` | `utm_campaign` 模式；支援 `{page}` `{slug}` placeholder |
| `facebook.utm.contentPattern` | `utm_content` 模式；同上 |

**Placeholder**：`expandPattern` 會把 `{key}` 替換成 vars 中的 `key` 值；未知 placeholder 維持原樣。

---

## 4. URL / UTM 解析規則

由 `src/scripts/ga4-url-builder.js` 的 `buildFacebookUrl` 處理。回傳 `{ baseUrl, finalUrl, urlSource, urlReason }`。

### 4.1 baseUrl 解析優先序

| 條件 | 解析來源 | `urlSource` |
|---|---|---|
| `target` 是合法 `http://` 或 `https://` URL | 直接使用 target | `absolute` |
| `target` 為其他非空、非 `auto` 字串 | 不解析 | `null` + `urlReason: "invalid-target:{value}"` |
| `target` ∈ {`auto`, `''`, null, undefined} 且 `post.site = "github"` | `${githubSiteUrl}/posts/${slug}/` | `github-site` |
| 同上 + `githubSiteUrl` 為空 | 不解析 | `null` + `urlReason: "github-site-url-missing"` |
| `post.site = "blogger"` + `post.blogger.publishedUrl` 有值 | 直接使用 publishedUrl | `blogger-published` |
| `post.site = "blogger"` + publishedUrl 空 + `bloggerSiteUrl` 有值 | `${bloggerSiteUrl}/${slug}.html` | `blogger-fallback` |
| `post.site = "blogger"` + 兩者皆空 | 不解析 | `null` + `urlReason: "blogger-url-missing"` |
| `post.slug` 缺漏 | 不解析 | `null` + `urlReason: "slug-missing"` |
| 不認得的 site | 不解析 | `null` + `urlReason: "unknown-site:{site}"` |

### 4.2 UTM 套用

`baseUrl` 解析成功後，用 `URL` + `searchParams.set` 套上以下參數：

| Query | 來源 |
|---|---|
| `utm_source` | `utm.source` |
| `utm_medium` | `utm.medium` |
| `utm_campaign` | `expandPattern(utm.campaignPattern, { page, slug })` |
| `utm_content` | `expandPattern(utm.contentPattern, { page, slug })` |

### 4.3 範例

當 `githubSiteUrl: "https://example.com"`、`page: "fan1"`、`slug: "github-pages-blog-planning"`、`target: "auto"`：

```
https://example.com/posts/github-pages-blog-planning/?utm_source=facebook&utm_medium=social&utm_campaign=fan1_post&utm_content=github-pages-blog-planning
```

---

## 5. Build 流程與輸出檔案結構

### 5.1 流程順序

`npm run build:promotion` →

1. `loadSettings()` 讀全部 JSON 設定
2. `loadPosts({ site: 'github' })` 與 `loadPosts({ site: 'blogger' })` 各一次（draft 已被過濾）
3. 對每篇 post 跑 `classifyFacebook`：依 `enabled / page / config.pages` 判斷是否進入 enabled 集合
4. 對每筆 enabled post 算 `buildFacebookUrl` 補 `baseUrl / finalUrl / urlSource / urlReason`
5. console 印 stats、filtered 列表、`finalUrl=null` warning（如有）
6. 對每筆 enabled post 用 `facebook-post.ejs` render 寫個別 `.txt`，`entry.txtPath` 寫回 entry
7. 寫 `all-posts-index.txt`
8. 寫 `build-manifest.json`（含 stats / config snapshot / posts / filtered）

### 5.2 輸出結構

```
dist-promotion/facebook/
├─ build-manifest.json       # 機器讀：所有 enabled posts 結構化資料 + filtered 診斷
├─ all-posts-index.txt       # 人讀：表格化索引 + URL/reason/txtPath 對照
├─ github/
│  └─ {slug}.txt             # 個別 FB 貼文純文字（site=github 的文章）
└─ blogger/
   └─ {slug}.txt             # 個別 FB 貼文純文字（site=blogger 的文章）
```

| 檔案 | 角色 |
|---|---|
| `build-manifest.json` | 機器讀，下游工具可直接拿 |
| `all-posts-index.txt` | 人讀，批次 review、發布清單 |
| `{site}/{slug}.txt` | 個別檔，人手複製貼到 FB |

`dist-promotion/` 被 `.gitignore` 排除，build 結果不入庫；只有 `dist-promotion/.gitkeep` 入庫保留資料夾。

### 5.3 EJS 模板

`src/views/promotion/`：

| 模板 | 用途 |
|---|---|
| `facebook-post.ejs` | 4-e 唯一接入的模板；render 每篇個別 `.txt`。輸出 4 段：title / message / URL（含 fallback）/ hashtags |
| `facebook-summary.ejs` | 精簡版（無標題），4-e 暫未接入；保留給日後加 `mode` 欄位時使用 |
| `facebook-hashtags.ejs` | partial，被 post / summary include；空陣列輸出空字串 |

---

## 6. validate-content 警告規則

由 `src/scripts/validate-content.js` 在 `npm run validate:content`、`build:github`、`build:blogger` 啟動時自動跑。**只在 `promotion.facebook.enabled === true` 時觸發**；不阻擋 build。

| Warning type | 觸發條件 | 嚴重度 | 修正方式 |
|---|---|---|---|
| `promotion-message-missing` | message 空字串 / null / 全空白 | P0 | 補 message |
| `promotion-hashtags-empty` | hashtags 不存在、非 array、或 trim 後皆空 | P0 | 加至少 1 個 hashtag |
| `promotion-page-unknown` | page（或 fallback defaultPage）不在 `promotion.config.json pages` | P0 | 改用已知 page，或在 config 加新 page |
| `promotion-page-disabled` | page 存在但 `pages[page].enabled !== true` | P0 | 開啟該 page，或文章換 page |
| `promotion-target-invalid` | target 是字串且既非 `auto` / 空 / 合法 `http(s)://` | P0 | 改 target=auto 或填合法絕對 URL |
| `promotion-globally-disabled` | `promotion.config.json facebook.enabled !== true` | P1（診斷） | 開啟全域，或文章端 enabled=false |

`npm run validate:content` 在 main 模式下載入 **github + blogger** 兩來源的 ready/published 文章一起檢查；`build:github` / `build:blogger` 仍依各自呼叫範圍。

---

## 7. 已知限制與待辦

### 7.1 site config URL 未設

`content/settings/site.config.json`：

| 欄位 | 現值 | 影響 |
|---|---|---|
| `githubSiteUrl` | `""` | 4-a 樣本（`github-pages-blog-planning`）`finalUrl: null`、`urlReason: "github-site-url-missing"`；個別 `.txt` 與 index 顯示 fallback 字串 `(URL 待設定 site.config.json githubSiteUrl / bloggerSiteUrl)` |
| `bloggerSiteUrl` | `""` | blogger 文章若未回填 `blogger.publishedUrl`，`finalUrl: null`、`urlReason: "blogger-url-missing"` |

**處理時機**：屬 SEO / site config 階段。Phase 4 範圍**不**處理。`build:blogger` 的 canonical warning 同源，一併留待。

### 7.2 CLAUDE.md 與本實作的 schema 漂移（已對齊）

CLAUDE.md §6 Phase 4 已於規範對齊階段更新，與 Phase 4-a~4-h 實作一致。已對齊內容：

- frontmatter 欄位名：`targetUrl` → `target`
- UTM 設定位置：移除 frontmatter inline utm，集中於 `promotion.config.json`
- frontmatter 補上 `note` 欄位
- §6 補上 `promotion.config.json` 結構說明
- §6 補上三支 EJS 模板的角色說明

`facebook-summary.ejs` 仍保留為「未來加 `mode` 欄位時使用」，現階段 4-e 只接入 `facebook-post.ejs`，CLAUDE.md 已寫明此行為。

### 7.3 Phase 4 範圍外 / Phase 4 後做

- 多粉絲頁（fan2 / fan3）：schema 已支援 `pages` map；目前只啟用 fan1
- 文章 frontmatter 自帶 utm 覆寫：4-c 不支援，留待後續
- 絕對 URL 範例：未加範例文章；自行測試需暫改 frontmatter
- 4-g 負面測試：實作期間不暫改 frontmatter；可在獨立驗收階段做

### 7.4 第二階段（CLAUDE.md §29）— 永不在第一版做

- FB Graph API 自動發文
- 排程發文
- 多版本 A/B 文案
- 文案版本歷史
- IG / Threads / X / LINE 等其他社群

---

## 8. 相關檔案

- 規格：`CLAUDE.md` §6 Phase 4
- Build 腳本：`src/scripts/build-promotion.js`
- URL/UTM helper：`src/scripts/ga4-url-builder.js`
- 驗證：`src/scripts/validate-content.js`
- 模板：`src/views/promotion/facebook-{post,summary,hashtags}.ejs`
- 設定：`content/settings/promotion.config.json`、`content/settings/site.config.json`
- 人工流程：`docs/checklists/fb-promotion-checklist.md`

---

## 9. Phase 8-d-4：manifest entry 接入 normalized

### 9.1 適用範圍

Phase 8-d-4 起，`src/scripts/build-promotion.js` 之 `buildManifestEntry` 內部分 manifest entry 欄位採 **normalized 優先、legacy fallback**。`normalized` 來源為 `post.normalized.promotion.facebook` 與 `post.normalized.display`，由 `src/scripts/normalize-post-output.js` 於 `load-posts` 階段 additive 掛載（Phase 8-d-2）。

normalize 欄位映射規則詳見 `docs/phase-8d-field-mapping-design.md` §6（26 欄位映射表）。

### 9.2 改用 normalized 之 4 個欄位

| 欄位 | 第一優先 | Fallback 1 | Fallback 2 |
|---|---|---|---|
| `entry.title` | `post.normalized.display.title` | `post.title` | `null` |
| `entry.target` | `post.normalized.promotion.facebook.target` | `post.promotion.facebook.target` | `'auto'` |
| `entry.message` | `post.normalized.promotion.facebook.message` | `post.promotion.facebook.message` | `null` |
| `entry.hashtags` | `post.normalized.promotion.facebook.hashtags`（陣列即採用，含空陣列） | `post.promotion.facebook.hashtags` | `[]` |

`hashtags` 採用後仍套既有 `.filter(Boolean)` 處理；輸出格式不變。

### 9.3 維持 legacy 來源之欄位（不在 8-d-4 改造範圍）

下列 13 個 manifest entry 欄位**仍維持既有 legacy 來源**：

- `site` / `slug` / `sourcePath` / `id`
- `page`
- `fbTitle` / `note`
- `baseUrl` / `finalUrl` / `urlSource` / `urlReason`
- `resolvedFacebookBody` / `facebookSidecar`

### 9.4 安全邊界：URL / UTM

- **8-d-4 不修改** `src/scripts/ga4-url-builder.js`
- `entry.baseUrl` / `entry.finalUrl` / `entry.urlSource` / `entry.urlReason` 仍由既有 `buildFacebookUrl` 與 `ga4-url-builder.js` 決定（沿用 §4 解析邏輯）
- **不得**以 `normalized.promotion.facebook.finalUrl` 直接取代 `entry.finalUrl`

理由：

- promotion 輸出需套用 UTM（依 `promotion.config.json facebook.utm` 之 `campaignPattern` / `contentPattern` 展開），normalized 之 `finalUrl` 不套 UTM
- 需保留既有 Blogger `publishedUrl` / `target` / page URL 解析行為（含 `target: absolute` / `target: auto` / blogger fallback 等分支，見 §4.1）
- normalized 之 `publish.blogger.publishedUrl` 不讀 frontmatter `post.blogger.publishedUrl` 路徑，與 `resolvePostBaseUrl` 之來源不一致

### 9.5 安全邊界：classifyFacebook

- **8-d-4 不修改** `classifyFacebook` 過濾邏輯
- 是否納入 promotion export 之過濾仍依既有 legacy 判斷：
  - `post.promotion.facebook.enabled === true`
  - `post.promotion.facebook.page`（或 fallback `defaultPage`）對應之 `promotion.config.json pages.{page}` 存在且 `enabled === true`
  - 全域 `promotion.config.json facebook.enabled === true`

理由：避免引入 `.fb.md` sidecar 之 `enabled` precedence 造成過濾行為改變；該變動屬後續批次規格決策範圍。

### 9.6 EJS template 不需 view-model 改造

- `src/views/promotion/facebook-post.ejs` 接收之 `post` 為 **manifest entry**（由 `await ejs.renderFile(FB_POST_TEMPLATE, { post: entry }, ...)` 注入），**非** raw post
- entry 之 `title` / `message` / `finalUrl` / `hashtags` 已於 `buildManifestEntry` 階段確定值
- 因此 8-d-4 normalized 接入點為 `build-promotion.js` 之 `buildManifestEntry`，**不**需在 EJS 內建立 per-item view-model
- 與 list view EJS（直接接 raw post，於迴圈內建 per-item view-model；Phase 8-d-3c-4 ～ 8-d-3c-8-b）情況不同

### 9.7 與 Phase 8-e 之分工

- 8-d-4 **不處理**：
  - `series` metadata（`series.id` / `series.name` / `series.number` 等）
  - `titleEn`（FB metadata 之英文標題欄位）
  - 系列 hashtags 預設帶出與繼承策略
- 上述屬 Phase 8-e 後續批次規格範圍（詳見 `docs/series-schema.md`）
- 8-d-4 僅接入目前 `normalize-post-output.js` 既有 `normalized.promotion.facebook` 欄位（`enabled` / `target` / `message` / `body` / `hashtags` / `finalUrl` / `utm.*`），不擴大 schema

### 9.8 8-d-4-b 驗證結果摘要

| 驗證項目 | 結果 |
|---|---|
| `node --check src/scripts/build-promotion.js` | 通過 |
| `npm run validate:content` | 0 error / 4 warning（皆為既有，與本批無關）|
| `npm run build:promotion` | 通過 |
| `dist-promotion/facebook/github/github-pages-blog-planning.txt` | **完全 byte-identical** |
| `dist-promotion/facebook/build-manifest.json` | 僅 `generatedAt` 一行差異 |
| `dist-promotion/facebook/all-posts-index.txt` | 僅 `generated` 一行差異 |
| URL / UTM / hashtags / FB 貼文內容 | **無實質差異** |

落地 commit：`e57d4e2 feat(phase-8d): use normalized fields in promotion manifest entry`

---

## 10. Phase 8-f：series / titleEn 之 promotion 接入

### 10.1 Phase 8-f-6 manifest 新增 4 個 additive 欄位（commit `7741655`）

`buildManifestEntry()` 內新增 4 個 additive 欄位（位置：既有 `note` 之後、`baseUrl` 之前；既有欄位順序不變）：

| 欄位 | 型別 | 來源 |
|---|---|---|
| `titleEn` | `string \| null` | `post.titleEn`（`.md` frontmatter） |
| `fbTitleEn` | `string \| null` | `post.sidecars?.facebook?.data?.titleEn`（`.fb.md` frontmatter；Phase 8-e-2 schema） |
| `seriesResolvedTitle` | `string \| null` | `resolveTitleTemplate(normalized.series.titleTemplate, { series, post: { title, titleEn } })` 之 `resolvedText`（純函式 helper；Phase 8-f-4-b） |
| `seriesTitleUnresolvedPlaceholders` | `Array<{ name, reason }>` | 同上 helper 之 `unresolvedPlaceholders` array |

**設計原則**：
- **不取代** `entry.title` / `entry.fbTitle` / `entry.message` / `entry.target` / `entry.hashtags`
- **不修改** `facebook-post.ejs` / `facebook-summary.ejs`；FB `.txt` 實際輸出 byte-identical
- **manifest 暴露資料供下游 EJS / 工具選用**；本階段 EJS 不讀新欄位
- 無 series / 無 .fb.md / 無 titleEn 時：對應欄位為 `null` / `[]`

詳見 `docs/series-schema.md` §18 與 `docs/phase-8f-completion-report.md`。

### 10.2 Phase 8-f-7 series.hashtags fallback chain（commit `592d45c`）

`normalize-post-output.js` 加 post-pass「inheritance backfill」邏輯；擴充 `normalized.promotion.facebook.hashtags` 之 fallback chain：

```
1. .fb.md.hashtags（非空 array；sidecar-first）
2. legacy frontmatter.promotion.facebook.hashtags（非空 array）
3. series.hashtags（Phase 8-f-7-b 新增；當 1 / 2 皆解為 [] 時觸發）
4. []（最終 fallback）
```

**設計原則**：
- **僅 FB promotion 端**；不改 Blogger `post.tags`（格式不互通）
- **不自動合併**；採完整 fallback（替換空陣列為 series.hashtags）
- 既有 fixture 之 fb hashtags 非空 → backfill 不觸發 → dist-promotion `.txt` byte-identical
- 觸發時 `validationMeta.fieldSource['promotion.facebook.hashtags']` 記為 `'computed:series.hashtags'`；`fallbackUsed` 新增對應記錄

詳見 `docs/series-schema.md` §19 與 `docs/phase-8f-completion-report.md`。

### 10.3 目前 FB `.txt` 輸出仍不顯示新欄位

`facebook-post.ejs` / `facebook-summary.ejs` **未修改**；不讀 Phase 8-f-6 之 4 個 additive 欄位。

manifest 已保留 `titleEn` / `fbTitleEn` / `seriesResolvedTitle` 之資料供下游選用；**未來若要在 FB `.txt` 顯示**需另開批次評估：
- 文案長度（FB 貼文建議標題 < 60 chars）
- 標題行格式（並列 / 多語）
- 與 SEO / 搜尋一致性之對應

---

See also:
- `docs/fb-sidecar-schema.md`（`.fb.md` 規格）
- `docs/publish-bundle.md` §2.6.3（`.fb.md` 放 Facebook 貼文文案與社群導流資料）
