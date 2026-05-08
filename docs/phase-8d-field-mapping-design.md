# Phase 8-d 欄位映射規格與優先序設計

本文件為 Phase 8-d-0 之文件先行批次成果，定義 sidecar / publish / legacy frontmatter 之欄位優先序、統一輸出物件形狀、各欄位之映射規則，作為 8-d-1（helper 純實作）/ 8-d-2（load-posts 接入）/ 8-d-3（EJS 接入）/ 8-d-4（copy-helper / promotion manifest 整理）之共同藍圖。

對應之上層規範詳見：
- `docs/publish-bundle.md` §3 / §4（sidecar 勝、frontmatter fallback；severity 矩陣）
- `docs/publish-json-schema.md` §5.3（Blogger URL 不可預測強制規則）
- `docs/fb-sidecar-schema.md` §3 / §5（`.fb.md` schema 與 placeholder）
- `docs/placeholder-resolver-design.md`（Phase 8-c 之 placeholder 規格）
- `docs/phase-8c-completion-report.md` §13（Phase 8-d 初步方向）

---

## §1 Phase 8-d 目標摘要

Phase 8-d 之目的：

1. **整理 sidecar / publish / legacy frontmatter 之欄位來源**：將分散於三層之資料來源（`.md` frontmatter / `.publish.json` / `.fb.md`）依語意歸位至統一形狀
2. **建立 sidecar-first 之欄位優先序**：sidecar 勝、frontmatter fallback；明確各欄位之 fallback chain
3. **讓 GitHub / Blogger / promotion / copy-helper 使用更一致的資料形狀**：減少各 EJS / build script 自行判斷欄位來源之複雜度
4. **為後續批次提供規格**：8-d-1 helper / 8-d-2 load-posts / 8-d-3 EJS / 8-d-4 copy-helper 之共同依據

本批（8-d-0）僅交付**規格文件**；**不寫 code、不接入任何 caller、不修改 build output**。

---

## §2 現況問題摘要

目前欄位來源分散之問題：

1. **Markdown frontmatter 仍有 legacy 欄位**：`type`（已由 8-b-3 normalize 為 `contentKind`）、`promotion.facebook.*`（Phase 4 既有）、`canonical`（字串或 'auto'）、`publishTargets.{platform}.{enabled,mode}` 等
2. **`.publish.json` 已成為發布輔助資料來源**：8-b-4 已將 raw data 掛入 `post.publish`，但**尚未攤平**為統一欄位（top-level `post.canonical` / `post.cover` / `post.metaTitle` 等仍從 frontmatter 讀取，未走 sidecar-first 攤平）
3. **`.fb.md` sidecar 提供 Facebook body 與 metadata**：8-b-5 已掛入 `post.sidecars.facebook`、8-c-4 已於 build-promotion 接入；但 `promotion output` 仍保留 legacy `promotion.facebook.message` 之 EJS fallback 路徑
4. **GitHub / Blogger / Facebook promotion 各自有部分資料來源**：`build-github.js` 走 frontmatter + EJS、`build-blogger.js` 同左、`build-promotion.js` 路徑分流為 sidecar-first（8-c-4）+ legacy EJS fallback；三者未對齊統一資料形狀
5. **若不先定義優先序，後續改 build script / EJS template 容易造成輸出不一致**：相同欄位可能於不同 build path 取得不同值（例如 `post.canonical` vs `post.publish.canonical.url`）

---

## §3 欄位來源分層

定義 7 層資料來源（自上而下，由具體到通用）：

| # | 層級 | 對應檔案 / 來源 | 描述 |
|---|---|---|---|
| 1 | **Markdown frontmatter** | `content/{site}/posts/{slug}.md` 之 YAML frontmatter | 內容屬性主來源；含 `title` / `slug` / `description` / `tags` / `category` / `cover` 等 |
| 2 | **`.publish.json` sidecar** | `content/{site}/posts/{slug}.publish.json` | 跨平台發布回填資料；含 `canonical` / `ogImage` / `blogger` / `github` / `seo` 等 |
| 3 | **`.fb.md` sidecar frontmatter** | `content/{site}/posts/{slug}.fb.md` 之 YAML frontmatter | Facebook 推廣 metadata；含 `enabled` / `target` / `hashtags` / `customUrl` 等 |
| 4 | **`.fb.md` body** | 同上之 body 段（純文字） | FB 貼文正文（含未解析 placeholder） |
| 5 | **Build runtime computed fields** | build script 階段計算 | `finalUrl`（含 UTM）、`canonicalUrl` 推導、`articleUrl` 解析等 |
| 6 | **Site settings / global settings** | `content/settings/*.json` | `site.config.json githubSiteUrl` / `promotion.config.json` 等 |
| 7 | **Fallback / legacy compatibility fields** | frontmatter `type` / `promotion.facebook.*` / `canonical`（字串） | 舊欄位之相容讀取；不主動廢棄 |

---

## §4 優先序總原則

7 條總原則：

1. **sidecar 勝**：`.publish.json` 與 `.fb.md` 之欄位優先於同欄位 frontmatter（沿用 `docs/publish-bundle.md` §3）
2. **legacy frontmatter 作為 fallback**：sidecar 不存在或欄位空時，由 frontmatter 補位
3. **computed field 不覆蓋人工明確指定欄位**：例如 `canonicalUrl` 推導值僅當 sidecar 與 frontmatter 皆無時才使用
4. **Blogger publishedUrl 不可預測**：唯有 `.publish.json` `blogger.publishedUrl` 回填後才視為可信；不從 `permalink + 月份` / `bloggerSiteUrl + slug` 推導（永久強制規則）
5. **GitHub URL 是否可推導**：本文件標記為「**可推導但不在 8-d-0 實作**」；推導規則之具體行為留待 8-d-1 helper 實作或更晚批次決定
6. **unresolved / missing 欄位不應被自動替換為錯誤資訊**：保留為 `undefined` / `null` / 原文 placeholder，由 caller / EJS 自行決定 fallback 顯示
7. **helper 應盡量純函式，避免直接 mutate post**：normalize 之輸出應為**新物件**（可掛在 `post.normalized` 或回傳新值）；不修改 input `post` / `context`

---

## §5 建議統一輸出物件形狀

helper（暫名 `normalize-post-output.js`）建議產出以下統一形狀（**本批不實作，僅規格設計**）：

候選欄位名：`post.normalized` / `post.publishView` / `post.output`（建議用 `post.normalized` 以符合動詞命名習慣）。

```
post.normalized = {
  identity: {
    site,                  // 'github' | 'blogger'
    sourceCollection,      // 'posts' | 'pages'
    slug,                  // string
    contentKind,           // 'post' | 'tech-note' | 'book-review' | ... | 'page'
    status,                // 'draft' | 'ready' | 'published' | 'archived'
  },
  display: {
    title,                 // string
    subtitle,              // string | null（保留欄位；目前 schema 無對應）
    description,           // string
    excerpt,               // string | null（保留欄位；目前 schema 無對應）
    cover,                 // string（image URL or path）
    altText,               // string（cover 之 alt）
  },
  seo: {
    metaTitle,             // string；fallback 至 display.title
    metaDescription,       // string；fallback 至 display.description
    canonicalUrl,          // string | null；推導後最終 URL
    ogTitle,               // string；fallback 至 metaTitle / display.title
    ogDescription,         // string；fallback 至 metaDescription / display.description
    ogImage,               // string；fallback 至 display.cover
  },
  publish: {
    primaryPlatform,       // 'blogger' | 'github'
    targetPlatforms,       // Array<'blogger' | 'github'>（依 publishTargets.{x}.enabled）
    publishedAt,           // ISO 8601 string | null
    updatedAt,             // ISO 8601 string | null
    blogger: {
      publishedUrl,        // string | null（不預測；空字串視為 null）
    },
    github: {
      url,                 // string | null（可由 siteUrl + path 推導；本批不實作）
    },
    canonicalPlatform,     // 'blogger' | 'github' | 'manual'（依 canonical.source）
  },
  promotion: {
    facebook: {
      enabled,             // boolean
      target,              // 'auto' | 'blogger' | 'github' | 'canonical' | 'custom'
      message,             // string（legacy promotion.facebook.message；保留作 fallback）
      body,                // string（.fb.md body；含未解析 placeholder）
      hashtags,            // Array<string>
      finalUrl,            // string | null（含 UTM 之最終 FB 推廣 URL）
      utm: {
        source,            // string（依 promotion.config.json）
        medium,            // string
        campaign,          // string（依 campaignPattern 展開）
        content,           // string（依 contentPattern 展開）
      },
    },
  },
  validationMeta: {
    fieldSource: { ... },                  // 每欄位之取值來源（'sidecar' | 'frontmatter' | 'computed' | 'fallback'）
    fallbackUsed: Array<{ field, from }>,  // 哪些欄位走了 fallback chain
    warnings: Array<{ type, field, ... }>, // helper 階段產生之 warning（不混入 validate-content 之 issues）
    unresolvedPlaceholders: Array,         // 沿用 8-c-2 helper 之回傳結構
  },
}
```

設計重點：
- 每欄位**不**重複 frontmatter / sidecar 之原 raw 結構；統一攤平語意
- `validationMeta.fieldSource` 提供 traceability（debug 用，可省略 commit 至 manifest）
- 不修改 `post.publish` / `post.sidecars`（仍保留 raw 形式作為 normalize 之 input）

---

## §6 欄位映射表

26 個主要欄位之映射規則。表格 8 欄位：

| # | 統一欄位 | 第一優先來源 | 第二優先來源 | fallback 來源 | computed 規則 | 可空 | 影響輸出 | 備註 |
|---|---|---|---|---|---|---|---|---|
| 1 | `display.title` | `.publish.json` `seo.metaTitle` | frontmatter `title` | — | — | 否 | EJS title / FB | sidecar metaTitle 為 SEO override |
| 2 | `identity.slug` | frontmatter `slug` | `.publish.json` `blogger.permalink` / `github.slug` | — | — | 否 | URL / 檔名 | slug 屬內容屬性，frontmatter 為主 |
| 3 | `identity.contentKind` | frontmatter `contentKind` | frontmatter `type`（legacy） | `'post'` | — | 否 | EJS / validate | 8-b-3 之 normalize 邏輯 |
| 4 | `identity.status` | frontmatter `status` | — | `'draft'` | — | 否 | load-posts filter / validate | 平台層 status（`.publish.json` `blogger.status` / `github.status`）為次要，與文件層分離 |
| 5 | `type`（legacy） | frontmatter `type` | — | — | — | 是 | （僅作 contentKind fallback） | 已 deprecated；不寫入 normalized；validate 規則保留 deprecated warning |
| 6 | `display.description` | `.publish.json` `seo.metaDescription` | frontmatter `description` | — | — | 否 | EJS / FB / SEO | sidecar metaDescription 為 SEO override |
| 7 | `display.excerpt` | frontmatter `excerpt`（若加入 schema） | frontmatter `description` | — | — | 是 | EJS list / preview | schema 未明文支援 excerpt；保留欄位 |
| 8 | `display.cover` | `.publish.json` `ogImage.url` | frontmatter `cover` | — | — | 是 | EJS hero / OG | 對應 ogImage |
| 9 | `seo.canonicalUrl` | `.publish.json` `canonical.url` | frontmatter `canonical`（字串非 'auto'） | computed（依 source） | source='blogger'→`blogger.publishedUrl`；'github'→`github.url`；'auto'→依 primaryPlatform；'manual'→不推導 | 是 | EJS canonical / FB | Blogger 不可預測；缺漏時 fallback 至 articleUrl 解析（同 8-c-2 §6.3） |
| 10 | `seo.metaTitle` | `.publish.json` `seo.metaTitle` | — | `display.title` | — | 否 | EJS `<title>` / OG | 缺漏 fallback 至 display.title |
| 11 | `seo.metaDescription` | `.publish.json` `seo.metaDescription` | — | `display.description` | — | 否 | EJS meta / OG | 缺漏 fallback 至 display.description |
| 12 | `publish.publishedAt` | `.publish.json` `blogger.publishedAt` 或 `github.publishedAt`（依 primaryPlatform） | frontmatter `publishedAt`（若有） | frontmatter `date` | — | 是 | sitemap / OG / metadata | ISO 8601 |
| 13 | `publish.updatedAt` | `.publish.json` `blogger.publishedAt`（最後一次） | frontmatter `updated` | `publishedAt` | — | 是 | sitemap | 簡化採最後一次發布時間 |
| 14 | `publish.primaryPlatform` | frontmatter `primaryPlatform` | — | `'blogger'` | — | 否 | URL 推導分流 / canonical | 預設 blogger（依現況以 Blogger 流量為主） |
| 15 | `publish.targetPlatforms` | frontmatter `publishTargets.{x}.enabled === true` 篩選 | — | `[primaryPlatform]` | — | 否 | build 範圍判斷 | Array |
| 16 | `publish.blogger.publishedUrl` | `.publish.json` `blogger.publishedUrl` | frontmatter `blogger.publishedUrl`（legacy） | — | **永不推導** | 是 | EJS / FB / canonical | Blogger URL 不可預測（強制規則） |
| 17 | `publish.github.url` | `.publish.json` `github.publishedUrl` | `.publish.json` `github.url`（別名） | computed（`siteUrl + github.path` / `siteUrl + '/posts/' + slug + '/'`） | 推導規則本批不實作 | 是 | EJS / FB / canonical | 8-d-1 之後評估 |
| 18 | `promotion.facebook.enabled` | `.fb.md` frontmatter `enabled` | frontmatter `promotion.facebook.enabled`（legacy） | `false` | — | 否 | build-promotion 過濾 | sidecar 勝 |
| 19 | `promotion.facebook.target` | `.fb.md` frontmatter `target` | frontmatter `promotion.facebook.target`（legacy） | `'auto'` | — | 否 | placeholder articleUrl 解析 | sidecar 勝 |
| 20 | `promotion.facebook.message` | frontmatter `promotion.facebook.message`（legacy） | — | — | — | 是 | legacy EJS path | 與 .fb.md body 並存；僅當 sidecar body 缺時使用 |
| 21 | `promotion.facebook.body` | `.fb.md` body（resolved） | — | `promotion.facebook.message`（legacy fallback） | resolved by `resolvePlaceholders`（8-c-2） | 是 | build-promotion `.txt` | 含未解析 placeholder 之原文 |
| 22 | `promotion.facebook.hashtags` | `.fb.md` frontmatter `hashtags` | frontmatter `promotion.facebook.hashtags`（legacy） | `[]` | — | 是 | build-promotion `.txt` 結尾 | sidecar 勝 |
| 23 | `promotion.facebook.finalUrl` | computed by `buildFacebookUrl`（既有 `ga4-url-builder.js`） | — | — | 依 target 決定 baseUrl + UTM 組合 | 是 | FB 推廣 URL | computed only |
| 24 | `promotion.facebook.utm.source` | `promotion.config.json` `facebook.utm.source` | — | `'facebook'` | — | 否 | UTM 組裝 | 由 settings 集中管理 |
| 25 | `promotion.facebook.utm.medium` | `promotion.config.json` `facebook.utm.medium` | — | `'social'` | — | 否 | UTM 組裝 | 同上 |
| 26 | `promotion.facebook.utm.campaign` | `promotion.config.json` `facebook.utm.campaignPattern` | — | `'{page}_post'` | `expandPattern(pattern, { page, slug })` | 否 | UTM 組裝 | 由 settings 集中管理 |

---

## §7 Blogger URL 規則

5 條 Blogger URL 規則（沿用 `docs/publish-json-schema.md` §5.3）：

1. **Blogger URL 前綴包含年份與月份，不應由系統預測**：例 `https://babel-lab.blogspot.com/2026/04/we-media-myself.html`，月份由 Blogger 平台依實際發布月決定，作者於後台無法修改
2. **Blogger 最終 URL 以 `.publish.json` 之 `blogger.publishedUrl` 為唯一可信來源**：normalize helper 不主動推導 Blogger URL
3. **若尚未發布，Blogger URL 應留空或顯示 pending，不應假造**：normalize 之 `publish.blogger.publishedUrl` 為 `null`；EJS 應檢查 null 並顯示 pending 字樣或省略
4. **`blogger.type === "page"` 時 yyyy/mm 結構不適用**：Blogger Page URL 由平台依後台設定產生，亦不可預測（同強制規則）
5. **canonicalUrl 若 primaryPlatform 是 blogger，但 publishedUrl 缺失**：採取 warning / fallback 策略（fallback 至 articleUrl 解析或 frontmatter `canonical`）；具體實作留至 8-d-1 之後

---

## §8 GitHub URL 規則

4 條 GitHub URL 策略：

1. **GitHub URL 通常可由 `site.config.json` `githubSiteUrl + path / slug` 推導**：例 `siteUrl + '/posts/' + slug + '/'` 或 `siteUrl + post.publish.github.path`
2. **是否推導取決於 `primaryPlatform` 與 `publishTargets.github.enabled` 設定**：若文章未啟用 GitHub 發布，URL 推導即無語意
3. **若 GitHub Pages 未來可能搬家，URL 推導應集中在 helper，不要散落在 EJS**：normalize helper 為唯一推導入口；EJS 直接讀 `normalized.publish.github.url`
4. **本批只寫設計，不實作**：8-d-1 helper 實作時設計具體推導邏輯，並決定推導之嚴格度（是否需要 `siteUrl` 非空、是否需要 `enabled === true` 等 guard）

---

## §9 Facebook promotion 規則

6 條規則（整合 8-c 後狀態與 8-d 目標）：

1. **`.fb.md` body 若存在，優先作為完整 FB 貼文**：8-c-4 已落地（`entry.resolvedFacebookBody` 路徑）
2. **legacy frontmatter `promotion.facebook.message` 作為 fallback**：8-c-4 之 EJS template 路徑保留此 fallback
3. **`.fb.md` frontmatter 可承載 target / hashtags / enabled 等 metadata**：8-b-5 已掛入 `post.sidecars.facebook.data`；normalize 階段將其攤平至 `normalized.promotion.facebook`
4. **`finalUrl` 由 `target` / `primaryPlatform` / `canonical` / `publishedUrl` / `githubUrl` 規則產生**：computed field；normalize helper 或 build-promotion 階段組裝；含 UTM 參數
5. **unresolved placeholder 保留原文**：沿用 8-c-2 helper 行為；normalize 階段保持 body 含原始 `{{ ... }}` 字串
6. **build-promotion 對 unresolved placeholder soft-fail，validate-content 依 status 判斷 warning / error**：8-c-3 / 8-c-4 已落地之雙層機制延續至 8-d

---

## §10 Legacy compatibility 策略

5 條舊欄位兼容策略：

1. **frontmatter `type` deprecated，但仍 fallback 到 `contentKind`**：8-b-3 之 normalize 維持；validate-content 之 `frontmatter-uses-deprecated-type` warning 保留（提示作者更名）
2. **`promotion.facebook` legacy block 暫時保留**：作為 `.fb.md` 不存在時之 message / hashtags / enabled fallback；不在 8-d 退場
3. **既有文章不應因沒有 sidecar 立即壞掉**：normalize helper 對缺 sidecar 之文章必須能由 frontmatter 完整提供 normalized 形狀；既有 fixture 之 build output byte-identical 為硬性承諾
4. **新文章建議使用 `.publish.json` + `.fb.md`**：作者於 `new-post.js` 或範本層之引導；不在 8-d 強制
5. **未來退場可列為後續 phase，不在 8-d 實作**：legacy 欄位之最終退場時機由作者另行決定；屬 Phase Z 或更晚批次

---

## §11 後續 helper 設計草案（8-d-1 範圍預告）

候選檔名：

```
src/scripts/normalize-post-output.js
```

### 11.1 input

```js
normalizePostOutput(post, settings, options)
```

- `post`：8-b-7 後之 entry 物件（含 frontmatter 攤平、`sidecars.publish` / `sidecars.facebook`、`publish` 條件式欄位）
- `settings`：`loadSettings()` 之回傳（含 `site.config.json` / `promotion.config.json` / `categories` / `tags` 等）
- `options`：可選控制（如 `{ derivedGithubUrl: boolean }` 用於暫不啟用 GitHub URL 推導）

### 11.2 output

```js
{
  normalized: { identity, display, seo, publish, promotion, validationMeta },
  warnings: Array<{ type, field, message }>,
}
```

或更簡潔：直接回傳 `normalized` 物件，warnings 嵌於 `normalized.validationMeta.warnings`。

### 11.3 是否純函式

✅ **是**。沿用 8-c-2 之純函式原則：
- 不讀檔
- 不寫檔
- 不執行 build / spawn
- 不依賴 `process.cwd()` / `process.env`
- 相同 input 永遠相同 output

### 11.4 是否 mutate post

❌ **不 mutate**。輸入之 `post` / `settings` / `options` 視為 immutable；輸出為**新物件**。caller 自行決定是否將結果掛回 `post.normalized`（屬 caller 之責任，不在 helper 內）。

### 11.5 如何記錄 field source

`normalized.validationMeta.fieldSource` 為 object，鍵為欄位路徑（如 `'display.title'` / `'seo.canonicalUrl'`），值為來源描述：

```js
{
  'display.title': 'sidecar:publish.seo.metaTitle',
  'identity.contentKind': 'frontmatter:contentKind',
  'publish.blogger.publishedUrl': 'sidecar:publish.blogger.publishedUrl',
  'seo.canonicalUrl': 'computed:from-publishedUrl',
  ...
}
```

### 11.6 如何提供 warnings

`normalized.validationMeta.warnings` 為 Array：

```js
[
  { type: 'fallback-used', field: 'seo.metaTitle', from: 'display.title' },
  { type: 'computed-missing-input', field: 'publish.github.url', reason: 'githubSiteUrl-missing' },
  ...
]
```

不直接 push 到 `validate-content` 之 issues（責任邊界分明）；caller（如 validate-content）可選擇將其轉換為自身格式之 issue。

### 11.7 讓 load-posts / build scripts / validate-content 共用

- **load-posts.js（8-d-2 接入）**：在 entry 已含 sidecar 後呼叫 `normalizePostOutput`，將結果掛在 `post.normalized`
- **build-github.js / build-blogger.js（8-d-3 接入）**：EJS template 改讀 `post.normalized.X` 而非 `post.X`
- **build-promotion.js（8-d-4 接入）**：使用 `post.normalized.promotion.facebook.*` 取代 entry 自行組裝
- **validate-content.js（8-d-3 之後評估）**：可選擇讀 `post.normalized.validationMeta.warnings` 補充規則

### 11.8 如何避免 EJS template 自己判斷過多欄位來源

normalize 後，EJS template 只需讀單一統一欄位（如 `post.normalized.seo.canonicalUrl`），不必判斷 `post.canonical || post.publish?.canonical?.url || ...` 之多重 fallback。將欄位優先序之複雜度封閉在 helper 內。

---

## §12 對各 build script 的後續影響

8 個影響點：

| # | 檔案 | 8-d 影響 | 落地批次 |
|---|---|---|---|
| 1 | `src/scripts/load-posts.js` | 呼叫 normalize helper；將 `post.normalized` 掛入 entry | 8-d-2 |
| 2 | `src/scripts/build-github.js` | EJS data 改讀 `post.normalized` | 8-d-3 |
| 3 | `src/scripts/build-blogger.js` | EJS data 改讀 `post.normalized` | 8-d-3 |
| 4 | `src/scripts/build-promotion.js` | manifest entry 改用 `normalized.promotion.facebook.*`；保留既有 sidecar-first / EJS fallback 邏輯 | 8-d-4 |
| 5 | `src/scripts/validate-content.js` | 可選：補充規則使用 `normalized.validationMeta.warnings` 之資訊 | 8-d-3 之後評估 |
| 6 | copy-helper EJS（屬 Phase 3-e 範圍） | 改讀 `post.normalized` | 8-d-4 或更晚 |
| 7 | Blogger full / summary / redirect-card EJS（`src/views/blogger/`） | 改讀 `post.normalized`；同步更新 placeholder 變數名 | 8-d-3 |
| 8 | GitHub page / post EJS（`src/views/pages/post-detail.ejs` 等） | 改讀 `post.normalized` | 8-d-3 |

---

## §13 驗收策略

10 種驗收方式（規劃；本批不執行）：

1. **node --check**：每個改動 .js 之語法檢查
2. **npm run validate:content**：規則與 issues 不應因 normalize 引入而變動（除非 8-d 期間故意新增規則）
3. **npm run build:promotion**：dist-promotion 對既有 fixture（無 sidecar）byte-identical
4. **npm run build:blogger**：dist-blogger 對既有 fixture byte-identical
5. **npm run build / npm run build:github**：dist 對既有 fixture byte-identical
6. **dist byte-identical 比對**：以 sha256 對 `dist/` / `dist-blogger/` / `dist-promotion/` 之 commit-by-commit 比對
7. **Blogger URL 缺失案例**：建立有 `.publish.json` 但 `blogger.publishedUrl` 為空之 fixture；驗證 normalize 不推導、EJS 顯示 pending
8. **GitHub URL 推導案例**：建立有 `github.path` 之 fixture；驗證 normalize 推導正確（待 8-d-1 之後）
9. **有 `.fb.md` sidecar 的 promotion 輸出案例**：建立帶 `.fb.md` body + 解析後 placeholder 之 fixture；驗證 build-promotion `.txt` 內容正確
10. **無 sidecar 的 legacy fallback 案例**：既有 fixture（無 `.publish.json` / `.fb.md`）必須 byte-identical

---

## §14 Phase 8-d 建議拆批表

9 批次 × 7 欄位：

| # | 批次 | 目的 | 允許修改範圍 | 寫 code | 影響 build output | 主要風險 | 驗收指令 |
|---|---|---|---|---|---|---|---|
| 1 | **8-d-0** | field mapping design 文件（**本批**） | `docs/phase-8d-field-mapping-design.md`（新增） | ❌ | ❌ | 設計與後續實作落差 | git status / git log |
| 2 | **8-d-1** | normalize helper 純實作 | `src/scripts/normalize-post-output.js`（新增） | ✅ | ❌（不接入） | helper 邏輯不對；計算欄位錯誤 | node --check |
| 3 | **8-d-2** | load-posts 接入 normalized output | `src/scripts/load-posts.js` | ✅ | **可能變動**（需驗證 byte-identical） | post 物件結構變動，下游 build 可能受影響 | npm run validate:content / npm run build:promotion |
| 4 | **8-d-3** | GitHub / Blogger EJS 接入 | `src/scripts/build-github.js` / `src/scripts/build-blogger.js` / `src/views/**/*.ejs` | ✅ | **✅ 變動** dist/、dist-blogger/ | EJS 改讀新欄位，需嚴謹 byte-identical 比對 | npm run build / npm run build:blogger |
| 5 | **8-d-4** | promotion manifest 資料來源整理 | `src/scripts/build-promotion.js` / `src/views/promotion/*.ejs` | ✅ | **✅ 變動** dist-promotion/ | manifest 結構變動，下游工具需同步 | npm run build:promotion |
| 6 | **8-d-5** | 測試 fixture 或 sample sidecar 補強 | `content/templates/_sample*` 之擴充 / 新增 `.fb.md` / `.publish.json` 範例 | ❌（純文字） | ❌ | 測試覆蓋率風險 | 人工 review |
| 7 | **8-d-6** | 第二批 placeholder 規格 | `docs/placeholder-resolver-design.md`（補節）或新增獨立文件 | ❌ | ❌ | 規格遺漏 | 文件 review |
| 8 | **8-d-7** | 第二批 placeholder 實作 | `src/scripts/resolve-placeholders.js` / `src/scripts/validate-content.js` / `src/scripts/build-promotion.js` | ✅ | **可能變動** dist-promotion/ | 文字類序列化規則複雜 | npm run validate:content / npm run build:promotion |
| 9 | **8-d-8** | Phase 8-d completion report | `docs/phase-8d-completion-report.md`（新增） | ❌ | ❌ | 漏記既有 batch | git log |

---

## §15 本批完成判斷

### 15.1 8-d-0 是否完成

✅ **是**。本批之單一交付（`docs/phase-8d-field-mapping-design.md`）已寫成，涵蓋 §1～§14 共 14 個必要章節 + 本節 §15。

### 15.2 8-d-0 不代表 8-d 實作完成

本批僅交付**規格文件**；helper、load-posts 接入、EJS 接入、build script 整理、第二批 placeholder 等實作工作**全在後續批次**（§14 之 8-d-1 至 8-d-8）。

### 15.3 下一步建議

**建議：先人工審閱本文件，再進 8-d-1。**

理由：
1. 本文件涵蓋之欄位映射表（§6 之 26 欄位）為後續 helper 實作之直接依據；映射規則一旦進入 8-d-1 即難以回頭調整
2. 統一物件形狀（§5）影響 EJS template 之改寫範圍；建議於 helper 實作前確認結構合理
3. 拆批表（§14）對 build output 變動之風險評估亦需審閱

若審閱後確認設計可行，可直接進 **8-d-1 normalize helper 純實作**（單檔、不接入、零 build output 風險）。

---

（本文件結束）
