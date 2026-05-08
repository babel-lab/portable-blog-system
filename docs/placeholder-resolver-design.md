# Placeholder Resolver 設計（Phase 8-c-1）

本文件為 Phase 8-c-1 之 placeholder resolver 規格文件，定義 `.fb.md` body 中之 URL placeholder 解析規則、URL 語意、status × severity 矩陣，以及後續 helper API 形狀。

對應之上層規範詳見：
- `docs/fb-sidecar-schema.md` §5（既有 placeholder 清單與 target 對應）
- `docs/publish-json-schema.md` §5.3（Blogger URL 不可預測強制規則）
- `docs/publish-bundle.md` §3 / §4（sidecar 勝、frontmatter fallback；status × severity 既有矩陣）
- `docs/phase-8b-completion-report.md`（Phase 8-b 後 post 物件結構與 sidecar metadata）

---

## §1 Phase 8-c-1 目標與非範圍

### 1.1 本批目標

定義以下四件事：

1. **URL placeholder 解析規則**：哪些 placeholder 支援、取值來源、fallback chain
2. **URL 語意**：`articleUrl` / `canonicalUrl` / `blogger.publishedUrl` / `github.publishedUrl` / `publishedUrl` 之意義與取值
3. **status × severity 矩陣**：解析失敗時依 `draft` / `ready` / `published` / `archived` 之嚴重度
4. **resolver helper 候選 API 形狀**：未來 8-c-2 之實作依據

### 1.2 本批非範圍（**明確不做**）

- ❌ 不實作 helper（`src/scripts/resolve-placeholders.js` 屬 8-c-2）
- ❌ 不接入 `validate-content.js`（屬 8-c-3）
- ❌ 不接入 `build-promotion.js`（屬 8-c-4）
- ❌ 不解析 `.fb.md` body（runtime 解析屬 8-c-2 / 8-c-4）
- ❌ 不產生 build output（`dist/` / `dist-blogger/` / `dist-promotion/` 全部不變）
- ❌ **不預測 Blogger URL**（永久強制規則，沿用 `docs/publish-json-schema.md` §5.3）

---

## §2 背景與現況

### 2.1 Phase 8-b 後 post 物件之可用結構

| 來源 | 欄位 |
|---|---|
| frontmatter 攤平 | `title` / `slug` / `date` / `tags` / `category` / `cover` / `status` / `draft` / `description` / `searchDescription` / `primaryPlatform` / `publishTargets` / `blocks` / `promotion.facebook.*`（legacy）/ ... |
| 8-b-3 normalize | `contentKind`（fallback from legacy `type`） |
| 8-b-7 載入 | `sourcePath` / `sourceCollection: 'posts' \| 'pages'` / `bodyLength` / `body` |
| 8-b-4 / 8-b-5 始終 | `sidecars.publish: { exists, path, issues }` / `sidecars.facebook: { exists, path, data, body, issues }` |
| 8-b-4 條件式 | `publish`（raw `.publish.json` 物件，僅當存在且 parse 成功） |

### 2.2 `post.publish` 結構（raw `.publish.json`）

```
{
  schemaVersion: 1,
  canonical: { url, source },
  ogImage:   { url, alt },
  blogger:   { type, permalink, status, publishedUrl, publishedAt, bloggerPostId, publishYear, publishMonth, history },
  github:    { slug, path, status, publishedUrl, publishedAt },
  seo:       { metaTitle, metaDescription, robots }
}
```

### 2.3 `post.sidecars.facebook` 結構

```
{
  exists: boolean,
  path: string,
  data: object | null,   // .fb.md frontmatter (enabled, page, target, customUrl, hashtags, title, note)
  body: string,          // 純文字保留，含原始 {{ ... }} placeholder
  issues: Array<Issue>
}
```

### 2.4 `.fb.md` body 目前狀態

- gray-matter 解析後之 `content` 字串原樣存入 `sidecars.facebook.body`
- **未經 markdown-it render**（FB 不解析 markdown）
- **未解析 placeholder**（屬本 Phase 8-c 範圍）
- 段落、空行、emoji、URL 全部保留

### 2.5 雙來源（posts / pages）

`loadPosts({ site })` 同時讀 `content/{site}/posts/` 與 `content/{site}/pages/`。每筆 entry 標記 `sourceCollection`。pages 與 posts 共用 sidecar 結構，故 placeholder resolver 之設計**對 posts 與 pages 一致適用**。

---

## §3 URL 語意定義

### 3.1 五個 URL 概念

| 語意名稱 | 描述 | 來源 | 是否可預測 |
|---|---|---|---|
| `articleUrl` | **抽象 placeholder**：FB 推廣導流最終使用之 URL；不一定等於單一欄位 | 依 `.fb.md target` 動態解析（詳見 §6.4） | 不獨立預測；依 target 解析至下列 URL 之一 |
| `canonicalUrl` | **SEO canonical 主 URL**（單一） | `post.publish.canonical.url` 或依 `canonical.source` 推導 | 可由 source 推導（auto / blogger / github / manual） |
| `blogger.publishedUrl` | **Blogger 平台已發布之正式 URL** | `post.publish.blogger.publishedUrl`；frontmatter fallback | **永遠不可預測**（詳見 §3.3） |
| `github.publishedUrl` | **GitHub Pages 平台已發布之正式 URL** | `post.publish.github.publishedUrl`；可由 `siteUrl + path` 推導 | 可推導（依 `site.config.json` 與 route 規則；本批僅定義，不實作推導） |
| `publishedUrl` | 一般化「平台已發布 URL」（不帶平台前綴） | 不建議直接使用；建議改用 `blogger.publishedUrl` 或 `github.publishedUrl` | 同上 |

### 3.2 articleUrl 是抽象 placeholder

`articleUrl` **不是任何單一欄位之 alias**；它是一個解析時的概念，依 `.fb.md` 之 `target` 欄位動態指向以下之一：

- `target: "blogger"` → `blogger.publishedUrl`
- `target: "github"` → `github.publishedUrl`
- `target: "canonical"` → `canonicalUrl`
- `target: "custom"` → `.fb.md customUrl`
- `target: "auto"` → 依 `primaryPlatform` 自動選擇（含 fallback）

詳細解析優先序見 §6.4。

### 3.3 Blogger URL 不可預測（強制規則）

承襲 `docs/publish-json-schema.md` §5.3 與 `docs/fb-sidecar-schema.md` §5.6：

1. **resolver 不得用 `permalink + 月份` 組出 Blogger URL**
2. **resolver 不得用 `bloggerSiteUrl + slug` 組出 Blogger URL**
3. `blogger.publishedUrl` 必須由作者在 Blogger 後台發布後**手動回填**至 `.publish.json`
4. `blogger.type === "page"` 時 yyyy/mm 結構不適用，更不可推導
5. resolver 只能讀取已存在之 `publishedUrl` 值；不存在 → 回報 unresolved

### 3.4 GitHub URL 可推導（**本批僅定義，不實作**）

未來可由以下推導：

```
site.config.json githubSiteUrl + post.publish.github.path
   或
site.config.json githubSiteUrl + '/posts/' + post.slug + '/'
```

但實際推導邏輯之引入時機、route 規則穩定化、與 fallback 順序，**留至 Phase 8-c-2 helper 實作或之後階段**設計。本批僅在 §6.2 之 fallback chain 中標註「未來推導值」之佔位。

### 3.5 `publishedUrl`（不帶前綴）使用建議

- **不建議**作為 placeholder 名稱使用，因易與 `blogger.publishedUrl` / `github.publishedUrl` 混淆
- 若使用者寫 `{{ publishedUrl }}`，本批將其視為**未知 placeholder**（詳見 §4.4）
- 建議文件中使用明確命名

---

## §4 第一批支援 placeholder 清單

### 4.1 第一批 placeholder（4 個）

| # | Placeholder | 用途 | 是否可用於 `.fb.md` body |
|---|---|---|---|
| 1 | `{{ articleUrl }}` | 動態文章 URL（依 target） | ✅ |
| 2 | `{{ blogger.publishedUrl }}` | 強制 Blogger 平台 URL | ✅ |
| 3 | `{{ github.publishedUrl }}` | 強制 GitHub Pages 平台 URL | ✅ |
| 4 | `{{ canonicalUrl }}` | SEO canonical URL | ✅ |

### 4.2 各 placeholder 詳細

#### 4.2.1 `{{ articleUrl }}`

- **用途**：FB 貼文使用之主導流連結；最常見用法
- **取值來源**：依 `.fb.md target`（見 §6.4 完整 fallback chain）
- **fallback chain**：見 §6.4
- **缺漏時處理**：保留原始 `{{ articleUrl }}` 字串於輸出 body，**不替換**；validate-content 依 status × severity 矩陣處置
- **draft severity**：warning
- **ready severity**：error
- **published severity**：error

#### 4.2.2 `{{ blogger.publishedUrl }}`

- **用途**：強制使用 Blogger 平台 URL（不依 target 動態切換）
- **取值來源**：見 §6.1 fallback chain
- **缺漏時處理**：保留原始字串、不替換、不預測
- **draft severity**：warning
- **ready severity**：warning（除非 target 明確指向 blogger，則升 error）
- **published severity**：error（若 `.fb.md enabled === true` 且 body 含此 placeholder）

#### 4.2.3 `{{ github.publishedUrl }}`

- **用途**：強制使用 GitHub Pages 平台 URL
- **取值來源**：見 §6.2 fallback chain（含未來推導值之佔位）
- **缺漏時處理**：保留原始字串、不替換
- **draft severity**：warning
- **ready severity**：warning（除非 target 明確指向 github，則升 error）
- **published severity**：error（同上條件）

#### 4.2.4 `{{ canonicalUrl }}`

- **用途**：SEO canonical URL；亦可作為 FB 推廣 fallback
- **取值來源**：見 §6.3 fallback chain
- **缺漏時處理**：保留原始字串
- **draft severity**：warning
- **ready severity**：warning（canonical 推導通常可成）
- **published severity**：warning（canonical 通常可由 source 推導；極罕見全空）

### 4.3 placeholder 比對規則

沿用 `docs/fb-sidecar-schema.md` §5.2：

```
\{\{\s*KEY\s*\}\}     # 容忍 KEY 前後之空白；不容忍跨行
```

對應之三種等價寫法：

```
{{KEY}}
{{ KEY }}
{{  KEY  }}
```

`KEY` 之路徑符號 `.`（如 `blogger.publishedUrl`）必須以正規表達式 escape。

### 4.4 未知 placeholder（不在第一批清單）

- resolver **不替換**
- 保留原始字串於 body
- validate-content 列為 `unknown-placeholder` warning（不阻擋 build）
- 不升 error（避免 typo 卡住 ready / published）

---

## §5 暫不支援 placeholder 清單

### 5.1 延後清單（9 個）

| # | Placeholder | 預期取值來源 | 延後理由 |
|---|---|---|---|
| 1 | `{{ title }}` | `post.publish.seo.metaTitle` → `post.title` | 文字插入；FB 貼文通常作者直接打字，需求弱 |
| 2 | `{{ description }}` | `post.publish.seo.metaDescription` → `post.description` | 同上 |
| 3 | `{{ excerpt }}` | `post.publish.excerpt` → `post.description` | 欄位 schema 未定義（excerpt 不在 publish-json-schema.md §2 之 6 個 top-level key 內） |
| 4 | `{{ tags }}` | `post.tags` 陣列 → 字串轉換規則未定 | 需先設計陣列序列化規則（逗號分隔？空白分隔？是否含 `#`？） |
| 5 | `{{ hashtags }}` | `post.sidecars.facebook.data.hashtags` | 與 frontmatter `tags` 之差異需先釐清；`promotion.config.json` 已有 hashtag 處理 |
| 6 | `{{ slug }}` | `post.slug` | 用途模糊；FB 貼文不該直接顯示 slug |
| 7 | `{{ publishedAt }}` | `post.publish.blogger.publishedAt` 或 `github.publishedAt` | 日期格式化需先定（ISO？本地化？） |
| 8 | `{{ siteName }}` | `site.config.json siteName` | settings JSON 載入路徑與 caching 規則需先定 |
| 9 | `{{ category }}` | `post.category` | 與 `categories.json` 之 lookup 需先設計（是否輸出 name 或 id？） |

### 5.2 共通延後理由

1. **第一批先專注 URL 類 placeholder**：URL 是 FB 推廣最關鍵之資料；文字類由作者直接撰寫即可
2. **避免與 sidecar / frontmatter 欄位映射混在一起**：文字類 placeholder 涉及多重 fallback 與型別轉換（陣列 → 字串、日期格式化、lookup）；混入 8-c 易擴大範圍
3. **避免 8-c 範圍過大**：文字類 placeholder 至少是 8-c-1 之外的獨立規格批次；建議於 Phase 8-d 或更晚評估

### 5.3 第二批引入時機建議

留待以下任一條件滿足後再評估：

- Phase 8-c 全 5 批完成（URL 類穩定）
- 作者對 FB 貼文之文字插入需求顯著（非單純導流連結）
- 欄位 schema 完整（如 `excerpt` / `tags` 序列化規則確定）

---

## §6 placeholder 取值優先序

### 6.1 `{{ blogger.publishedUrl }}`

```
(1) post.publish.blogger.publishedUrl                  ← .publish.json 為主
(2) post.blogger?.publishedUrl                          ← frontmatter fallback（legacy）
(3) post.publishedUrl（若 primaryPlatform === 'blogger') ← 罕見 fallback；不建議使用
(4) → unresolved（保留原始 placeholder 字串）
```

**強制規則**：
- 步驟 (1)~(3) 取值皆**必須為非空字串**才視為解析成功
- 不得自行推導 Blogger URL（不從 permalink + 月份組出，不從 bloggerSiteUrl + slug 組出）
- `blogger.type === "page"` 時 yyyy/mm 結構不適用

### 6.2 `{{ github.publishedUrl }}`

```
(1) post.publish.github.publishedUrl                    ← .publish.json 為主
(2) post.publish.github.url                             ← 別名（若 schema 後續引入 url 欄位）
(3) post.github?.publishedUrl                           ← frontmatter fallback（legacy）
(4) <推導值：siteUrl + post.publish.github.path>         ← 未來推導；本批僅佔位，不實作
(5) → unresolved（保留原始 placeholder 字串）
```

**8-c-1 範圍**：步驟 (4) **不在本批實作**；helper 在 8-c-2 階段先以「未推導」處理，等同 unresolved。實際推導引入時機留至後續批次。

### 6.3 `{{ canonicalUrl }}`

```
(1) post.publish.canonical.url（非空字串）              ← .publish.json 為主
(2) 依 post.publish.canonical.source 推導：
      'blogger'  → resolveBloggerUrl(post)（依 §6.1 規則）
      'github'   → resolveGithubUrl(post, settings)（依 §6.2 規則）
      'manual'   → 不推導（必須步驟 (1) 已有值，否則 unresolved）
      'auto'     → 依 primaryPlatform 推導（同 §6.4 articleUrl 之 auto 邏輯）
(3) post.canonical（frontmatter，若為 URL 字串而非 'auto'）
(4) <articleUrl 可解析結果>                              ← 最後 fallback
(5) → unresolved
```

### 6.4 `{{ articleUrl }}`

依 `.fb.md target`（取自 `post.sidecars.facebook.data.target`，預設 `'auto'`）：

| target 值 | articleUrl 解析優先序 |
|---|---|
| `"blogger"` | (1) `resolveBloggerUrl(post)` (2) `resolveCanonicalUrl(post)` (3) unresolved |
| `"github"` | (1) `resolveGithubUrl(post, settings)` (2) `resolveCanonicalUrl(post)` (3) unresolved |
| `"canonical"` | (1) `resolveCanonicalUrl(post)` (2) unresolved |
| `"custom"` | (1) `post.sidecars.facebook.data.customUrl`（若為合法 URL） (2) unresolved |
| `"auto"` | 依 `post.primaryPlatform` 分流：blogger → §6.4 之 `target: "blogger"`；github → §6.4 之 `target: "github"`；無 primaryPlatform 或無法判斷 → `resolveCanonicalUrl(post)` → unresolved |

**核心原則**：
- 不得猜 Blogger URL
- Blogger 優先解析失敗時，可降至 canonicalUrl 作為 fallback（保 ready/published 不至於完全無 URL）
- canonical 也失敗 → unresolved，保留 placeholder 原文

### 6.5 一致化建議（**僅建議，不修改其他文件**）

- `docs/fb-sidecar-schema.md` §5.5 之 `target: "auto"` 解析邏輯與本文件 §6.4 大致一致，但細節（fallback 至 canonical 之時機）本文件更精細。**建議**未來於 Phase 8-c-2 或 8-c-3 階段，於 fb-sidecar-schema.md §5.5 加 cross-link 指向本文件 §6.4，由本文件作為解析權威來源。**本批不修改**。
- `docs/publish-json-schema.md` §8.4 之 `canonical.url` fallback 規則建議與本文件 §6.3 對齊；目前差異不大，**本批不修改**。

---

## §7 status × severity 矩陣

依 `validate-content.js` 既有 `VALID_STATUS = { draft, ready, published, archived }`（見 `docs/phase-8b-completion-report.md` §11）。

### 7.1 主矩陣（每格標示 ignore / warning / error）

| 條件 \ status | `draft` | `ready` | `published` | `archived` |
|---|:---:|:---:|:---:|:---:|
| 缺 `blogger.publishedUrl`（未指向 blogger） | ignore | ignore | ignore | ignore |
| 缺 `blogger.publishedUrl`（target 指向 blogger 或 primaryPlatform=blogger） | ignore | warning | **error** | ignore |
| 缺 `github.publishedUrl`（未指向 github） | ignore | ignore | ignore | ignore |
| 缺 `github.publishedUrl`（target 指向 github 或 primaryPlatform=github） | ignore | warning | **error** | ignore |
| 缺 `canonicalUrl`（含推導後仍空） | ignore | warning | warning | ignore |
| `{{ articleUrl }}` 無法解析 | warning | **error** | **error** | warning |
| `{{ blogger.publishedUrl }}` 無法解析 | warning | warning | **error** | warning |
| `{{ github.publishedUrl }}` 無法解析 | warning | warning | **error** | warning |
| `{{ canonicalUrl }}` 無法解析 | warning | warning | warning | warning |
| `.fb.md enabled=true` 但 body 空 | warning | **error** | **error** | warning |
| `.fb.md` body 有 placeholder 但無法解析（任一） | warning | **error** | **error** | warning |
| `.publish.json` 存在但 URL 欄位不足（已 published 但缺對應 publishedUrl） | warning | warning | **error** | warning |
| `.fb.md` 存在但 frontmatter parse 失敗 | **error** | **error** | **error** | **error** |
| `.publish.json` parse 失敗或 schema-broken | **error** | **error** | **error** | **error** |

### 7.2 設計原則

1. **draft 多數 ignore 或 warning**：作者編輯中，避免過度干擾
2. **ready 之必要 URL unresolved 應 warning，placeholder 無法解析升 error**：避免無效貼文輸出
3. **published 之必要 URL unresolved 應 error**：影響 SEO / 推廣導流
4. **Blogger publishedUrl 在未 published 前缺漏不應 error**：因為這是設計上的等待回填狀態
5. **published 狀態缺 Blogger publishedUrl 且 target 指向 blogger → error**：違反「published 應有 URL」之核心契約
6. **schema-broken / parse 失敗 → 全 status error**：資料污染防線，不分 status
7. **canonical 之嚴重度較低**：因可由 source 推導，少數情況才會全空
8. **archived 多數 warning**：已封存文章不應產生新導流，但仍提示已知缺漏

### 7.3 settings 全域開關之影響（不在矩陣中，但說明）

依 `docs/fb-sidecar-schema.md` §8.2：當 `promotion.config.json facebook.enabled !== true` 時：
- `.fb.md` 之 placeholder 解析失敗**不升 error**（因為 build 不產出 `.txt`，placeholder 不會被作者貼到 FB）
- 沿用既有 `promotion-globally-disabled` warning（5-g 已落地）
- 本矩陣之 ready / published placeholder error 受此全域開關「降階」為 warning

實作層之精細處置留至 8-c-3。

---

## §8 resolver helper 候選 API

**8-c-2 之實作藍圖；本批僅定義 API 形狀，不寫 code。**

### 8.1 候選函式

```js
// 純函式：對傳入字串做 placeholder 替換，不讀檔、不寫檔、不依賴 build output
resolvePlaceholders(text, context, options) → ResolveResult

// 純函式：解析單一 placeholder 名稱之值
resolvePlaceholderValue(name, context, options) → ResolveValueResult

// 純函式：從字串抽出所有 placeholder 名稱（含未支援者）
extractPlaceholders(text) → Array<PlaceholderRef>
```

### 8.2 入參

| 參數 | 型別 | 說明 |
|---|---|---|
| `text` | string | 待解析之原始字串（典型為 `.fb.md` body） |
| `name` | string | 單一 placeholder 名稱（如 `'articleUrl'` / `'blogger.publishedUrl'`） |
| `context` | object | 解析上下文，含：`post`（含 `publish` / `sidecars` 等）、`fbData`（`.fb.md` frontmatter）、`settings`（`site.config.json` 等需要時讀入） |
| `options` | object | 可選控制：`{ supportedKeys: Array<string>, strict: boolean }` |

### 8.3 回傳結構

#### `ResolveResult`（`resolvePlaceholders` 回傳）

```
{
  resolvedText: string,              // 替換後之字串；無法解析者保留原始 {{ ... }} 文字
  unresolvedPlaceholders: Array<{    // 未解析之 placeholder 清單（含未知）
    name: string,                    // placeholder 名稱
    rawText: string,                 // 原始 {{ ... }} 文字
    reason: string,                  // 'unknown-placeholder' / 'value-empty' / 'predict-blocked-blogger' / ...
  }>,
  warnings: Array<Issue>,            // resolver 階段產生之 warning issues
  errors: Array<Issue>,              // resolver 階段產生之 error issues
  replacements: Array<{              // 已成功解析之 placeholder
    name: string,
    rawText: string,
    value: string,
    source: string,                  // 'post.publish.canonical.url' / 'post.publish.blogger.publishedUrl' / ...
  }>,
}
```

#### `ResolveValueResult`（`resolvePlaceholderValue` 回傳）

```
{
  resolved: boolean,
  value: string | null,
  source: string | null,             // 取值來源之描述
  reason: string | null,             // 失敗原因（resolved=false 時）
}
```

#### `PlaceholderRef`（`extractPlaceholders` 回傳之元素）

```
{
  name: string,
  rawText: string,
  index: number,                     // 在 text 中之起始位置
}
```

### 8.4 設計原則

- **純函式**：相同 input 永遠相同 output；不讀檔、不寫檔、不操作 console（除錯訊息走 issues 陣列）
- **不依賴 build output**：不讀 `dist/` / `dist-blogger/` / `dist-promotion/`
- **不依賴 sidecar I/O**：`context.post` 已含 sidecar 資料（由 `load-posts.js` 預先載入）；resolver 不再呼叫 `readPublishSidecar` 等
- **不變更 input**：`text` 與 `context` 皆視為 immutable
- **不 throw**：所有錯誤情境轉為 issues / unresolvedPlaceholders 陣列
- **可序列化結果**：回傳結構必須能 JSON.stringify（便於測試與 build report）
- **無副作用**：呼叫 resolver 不應改變 `post` 物件、不應寫日誌

### 8.5 8-c-2 實作建議檔名

```
src/scripts/resolve-placeholders.js
```

不接入 load-posts / validate-content / build-* / EJS。獨立 module，與 `load-sidecars.js` 同一層。

---

## §9 validate-content 接入建議（**8-c-3 範圍預告**）

### 9.1 範圍

於 `src/scripts/validate-content.js` 新增規則：

| 規則 | severity（依 status × §7 矩陣） |
|---|---|
| `fb-md-placeholder-unresolved` | warning(draft) / error(ready) / error(published) / warning(archived) |
| `fb-md-content-missing` | warning(draft) / error(ready,published) / warning(archived) |
| `fb-md-unknown-placeholder` | warning（all status；不阻擋）|
| `publish-json-blogger-published-without-url` | warning(draft,ready) / error(published) |
| `publish-json-blogger-parse-failed` | error（all） |
| `fb-md-parse-failed` | error（all） |

### 9.2 實作要點

- 呼叫 `extractPlaceholders(post.sidecars.facebook.body)` 與 `resolvePlaceholders(...)` 取得 `unresolvedPlaceholders`
- 對每個 unresolved 依 §7 矩陣 push warning / error
- **不修改 `.fb.md` body**
- **不修改 `post` 欄位值**（含 `post.sidecars` / `post.publish`）
- **不產生 build output**

### 9.3 與既有 promotion 規則之關係

8-b-6 之 `sidecar-frontmatter-overlap` warning 維持；8-c-3 規則為新增，不替換既有。

---

## §10 build-promotion 接入建議（**8-c-4 範圍預告**）

### 10.1 範圍

於 `src/scripts/build-promotion.js` 與 `src/views/promotion/*.ejs` 接入 resolver：
- build 階段呼叫 `resolvePlaceholders` 對 `.fb.md` body 替換 placeholder
- 解析後文字輸出至 `dist-promotion/facebook/{site}/{slug}.txt`
- **依 `docs/fb-sidecar-schema.md` §5.7：build 不阻擋 `.txt` 產出，未解析之 placeholder 保留原文供作者肉眼辨識**

### 10.2 build output 影響

- **首次** `dist-promotion/facebook/*.txt` 內容變動（由含原始 `{{ ... }}` 變為含已解析 URL）
- `dist/` 與 `dist-blogger/` **不變動**

### 10.3 8-c-1 不做

本批僅描述 8-c-4 之計畫；**實作落地時機為 8-c-4**。

---

## §11 與既有文件 cross-link

### 11.1 文件引用關係

本文件單向引用以下既有文件（**不修改它們**）：

- **`docs/fb-sidecar-schema.md`**
  - §5（placeholder 清單與 target 對應）：本文件 §4 / §6.4 為其後續解析規格
  - §7（severity 矩陣）：本文件 §7 為其擴充版本（補上 `.publish.json` 相關情境）
  - §5.7（build soft-fail）：本文件 §10.1 沿用此原則
  - §8.2（settings 全域開關降階）：本文件 §7.3 沿用

- **`docs/publish-json-schema.md`**
  - §5.3（Blogger URL 不可預測強制規則）：本文件 §3.3 / §6.1 / §6.4 完全繼承
  - §8.2（status 必填規則）：本文件 §7.1 之「published 缺 publishedUrl → error」與其一致
  - §8.4（canonical fallback）：本文件 §6.3 與其對齊

- **`docs/publish-bundle.md`**
  - §3（sidecar 勝、frontmatter fallback）：本文件 §6 全部 fallback chain 之核心原則
  - §4（severity 矩陣）：本文件 §7 為其延伸至 placeholder 領域

- **`docs/phase-8b-completion-report.md`**
  - §3 / §4（post 物件結構）：本文件 §2 之背景對應
  - §10（尚未做事項：placeholder 解析）：本文件正式啟動該項目之 8-c-1 規格批次

### 11.2 一致化建議（**未來批次處理，不在本批**）

- `fb-sidecar-schema.md` §5 可考慮加 cross-link 指向本文件 §4 / §6
- `publish-json-schema.md` §8.4 可考慮加 cross-link 指向本文件 §6.3
- 兩者皆屬 docs 對齊小批次，**本批不執行**

---

## §12 Phase 8-c 後續拆批建議

| 批次 | 名稱 | 寫 code | 影響 build output | 依賴 |
|---|---|---|---|---|
| **8-c-1** | placeholder resolver 規格文件（**本批**） | ❌ | ❌ | 無 |
| **8-c-2** | placeholder resolver helper 純實作（不接入） | ✅ 新檔 | ❌ | 8-c-1 |
| **8-c-3** | `validate-content.js` 接入 unresolved warning / error | ✅ 改 src | ❌（僅 console warning） | 8-c-2 |
| **8-c-4** | `build-promotion.js` 接入解析後文字 | ✅ 改 src + EJS | **✅** dist-promotion 變動 | 8-c-2、8-c-3 |
| **8-c-5** | 驗收與 Phase 8-c 完成報告 | 文件 | ❌ | 全部 |
| （並行）docs 對齊小批次 | `seo-ga4-adsense.md` `invalid-type` 殘留 + `page` 列舉 | 文件 | ❌ | 獨立 |

### 12.1 各批詳細範圍預告

- **8-c-2**：新增 `src/scripts/resolve-placeholders.js`，依 §8 之 API 形狀；不接入任何流程
- **8-c-3**：改 `src/scripts/validate-content.js`，依 §9.1 之規則；不改 build output
- **8-c-4**：改 `src/scripts/build-promotion.js` + `src/views/promotion/*.ejs`；依 §10.1 接入 resolver；首次 dist-promotion 變動
- **8-c-5**：新增 `docs/phase-8c-completion-report.md`；驗收

### 12.2 並行 docs 對齊小批次

`docs/seo-ga4-adsense.md:474` 含舊 `invalid-type` 引用，且未補入 `page` 列舉值。可獨立小批次處理（單檔 + 1 commit）。**不混入 8-c 主線 commit**。

---

## §13 風險與邊界

### 13.1 永久強制規則

1. **不可預測 Blogger URL**
   - 不從 `permalink + 月份` 組出
   - 不從 `bloggerSiteUrl + slug` 組出
   - 不從任何 metadata 反推
   - 必須等 `.publish.json` `blogger.publishedUrl` 由作者回填
   - 違反者屬資料污染，禁止實作

2. **不要把 articleUrl 寫死為 Blogger**
   - articleUrl 是抽象 placeholder，依 target / primaryPlatform 動態解析
   - 不可硬編碼為 `resolveBloggerUrl()`
   - Blogger 解析失敗時應 fallback 至 canonical（見 §6.4）

3. **GitHub URL 推導等 siteUrl / route 規則穩定**
   - 8-c-2 helper 可預留推導介面，但**不實作**
   - 推導規則之引入時機留至後續批次（最早 8-c-2，視 site.config.json 與 route 設計穩定度）
   - 推導前 `{{ github.publishedUrl }}` 解析失敗 → unresolved（依 §7 處置）

### 13.2 範圍邊界

4. **placeholder resolver 不應負責 schema 深度驗證**
   - resolver 只關注 placeholder 解析；不檢查 `.publish.json` 之 top-level keys 完整性、enum 違規等
   - schema 深度驗證屬 `validate-content.js` 之獨立規則（屬 8-c-3 之外或更晚批次）

5. **解析失敗不應在 draft 階段過度干擾**
   - draft 之 placeholder unresolved → warning（不阻擋）
   - 編輯中文章常見缺資料；過度 error 會降低作者體驗
   - 唯有 schema-broken 與 parse 失敗才在 draft 升 error

6. **published 階段不能留下不可發布的導流文字**
   - published 之 placeholder unresolved → error
   - 確保 `.txt` 不會以 `{{ articleUrl }}` 等原始字串輸出至 FB
   - 但 build 仍**輸出 `.txt`**（依 fb-sidecar-schema.md §5.7 soft-fail），由作者於 validate 階段看到 error 並補資料

### 13.3 settings / 全域影響

7. **全域 `promotion.config.json facebook.enabled === false` 之降階**
   - placeholder unresolved 之 ready / published error → 降為 warning
   - 因 build 不會產出 `.txt`，作者也不會貼到 FB
   - 詳見 §7.3

### 13.4 multi-site 邊界

8. **posts 與 pages 共用 resolver**
   - resolver 不區分 `sourceCollection`；對 posts 與 pages 一致解析
   - 若未來 pages 有特殊 placeholder（例如 `{{ pageType }}`），屬另開規格

### 13.5 不在本批處理之風險

- placeholder body 含中文 / emoji / 特殊字元之 escape 行為（屬 8-c-2 實作層面）
- placeholder 名稱之 case-sensitive 處理（建議 case-sensitive，與 fb-sidecar-schema.md §5.1 一致；屬 8-c-2 實作）
- placeholder 出現於 frontmatter（非 body）之處理（不在第一批支援；frontmatter 不該含 placeholder）

---

（本文件結束）
