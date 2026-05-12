# Phase 8-c 完成報告

本文件為 Phase 8-c 之整體驗收與完成紀錄。Phase 8-c 將 `.fb.md` sidecar body 之 placeholder 解析能力以三層接入方式落地：resolver helper（純函式）→ validate-content（驗證層）→ build-promotion（輸出層）。

對應之上層規範詳見：
- `docs/placeholder-resolver-design.md`（Phase 8-c-1 之 13 節規格）
- `docs/fb-sidecar-schema.md` §5 / §7（既有 placeholder 列表與 status × severity 矩陣依據）
- `docs/publish-bundle.md` §3 / §4（sidecar 勝、frontmatter fallback；severity 矩陣總則）
- `docs/phase-8b-completion-report.md`（Phase 8-b 後 post 物件結構與 sidecar metadata）

---

## §1 Phase 8-c 目標摘要

讓 `.fb.md` sidecar body 中之 URL placeholder 能於 build 階段被解析為實際 URL，並由 validate-content 對未解析者依 status 提示。完成三層接入：

1. **Resolver helper（8-c-2）**：純函式 module，提供 `extractPlaceholders` / `resolvePlaceholderValue` / `resolvePlaceholders` 三個 export，不接入任何 caller。
2. **Validate-content 驗證（8-c-3）**：對 `.fb.md` body 呼叫 resolver，依 status × severity 矩陣產生 `fb-md-content-missing` / `fb-md-placeholder-unresolved` warning / error。
3. **Build-promotion 輸出（8-c-4）**：build 階段對 `.fb.md` body 呼叫 resolver；解析後字串作為 `entry.resolvedFacebookBody` 寫入 `.txt`；unresolved placeholder 保留原文（soft-fail）。

---

## §2 Commit 清單

Phase 8-c 主線（含並行 docs 對齊）共 5 個 commit：

| # | Commit | 訊息標題 | 類型 |
|---|---|---|---|
| 1 | `3839fdf` | docs(phase-8c): add placeholder resolver design | 規格文件（8-c-1） |
| 2 | `5bf2159` | docs: align seo validation terms with contentKind | docs 對齊小批次（並行） |
| 3 | `37e6bca` | feat(phase-8c): add placeholder resolver helper | helper 純實作（8-c-2） |
| 4 | `1eb8cc2` | feat(phase-8c): validate facebook placeholders | validate 接入（8-c-3） |
| 5 | `e4e49ce` | feat(phase-8c): resolve facebook promotion placeholders | build-promotion 接入（8-c-4） |

線性歷史，無 amend、無 rebase。

---

## §3 各批次摘要

### 3.1 8-c-1：placeholder resolver design 文件（commit `3839fdf`）

新增 `docs/placeholder-resolver-design.md`（13 節，613 行）。

涵蓋：
- 第一批 4 個 URL placeholder 之取值優先序與 fallback chain
- URL 語意定義（`articleUrl` / `canonicalUrl` / `blogger.publishedUrl` / `github.publishedUrl`）
- status × severity 矩陣（draft / ready / published / archived）
- resolver helper 候選 API（純函式形狀）
- 8-c-2～8-c-5 之拆批計畫
- 風險與邊界（**永遠不預測 Blogger URL** 為強制規則）

### 3.2 docs 對齊小批次：SEO validation terms 與 contentKind 對齊（commit `5bf2159`）

修改 `docs/seo-ga4-adsense.md` §8.3.1（單行 +1 −1）：
- `invalid-type` → `invalid-content-kind`
- `type 不在 {…}` → `contentKind 不在 {post, tech-note, book-review, download, comic, life-note, page}`
- 補入 `page` 列舉值
- 標註 legacy `type` 由 load-posts 相容讀取

### 3.3 8-c-2：resolve-placeholders.js helper（commit `37e6bca`）

新增 `src/scripts/resolve-placeholders.js`（純函式 module，375 行）。

3 個 export：
- `extractPlaceholders(text)`：抽出去重之 placeholder 名稱
- `resolvePlaceholderValue(name, context, options)`：解析單一 placeholder
- `resolvePlaceholders(text, context, options)`：對整段字串做替換

設計原則：不讀檔、不寫檔、不 throw、不修改 input、相同輸入永遠相同輸出。

### 3.4 8-c-3：validate-content 接入（commit `1eb8cc2`）

修改 `src/scripts/validate-content.js`（+80 −0）。

新增：
- `import { resolvePlaceholders }` from `./resolve-placeholders.js`
- `severityForFbContentMissing(status)` 與 `severityForFbPlaceholder(...)` 兩個 helper
- 在 post 主迴圈內、8-b-6 sidecar overlap 檢查之後加入 `.fb.md` 檢查區塊
- 新規則：`fb-md-content-missing` / `fb-md-placeholder-unresolved`

不修改 `.fb.md` body、不修改 post 欄位、不產生 build output。

### 3.5 8-c-4：build-promotion 接入（commit `e4e49ce`）

修改 `src/scripts/build-promotion.js`（+67 −6）。

新增：
- `import { resolvePlaceholders }` from `./resolve-placeholders.js`
- `buildManifestEntry` 末段：若 `.fb.md` sidecar 存在且 body 非空，呼叫 resolver 並掛 `entry.resolvedFacebookBody` + `entry.facebookSidecar` metadata；console.warn 對 unresolved placeholder
- `renderAndWriteFacebookText` 分流：有 `entry.resolvedFacebookBody` → 直接使用；否則沿用既有 EJS template 路徑

EJS template 完全未動。

---

## §4 第一批支援的 placeholder

依實際 helper（`src/scripts/resolve-placeholders.js`）核對：

### 4.1 已支援之 4 個 URL placeholder

| Placeholder | 主要資料來源（依優先序） | unresolved 處理 |
|---|---|---|
| `{{ articleUrl }}` | 依 `target` 動態：`blogger` / `github` / `canonical` / `custom` / `auto`（依 primaryPlatform 分流；含 `canonicalUrl` 之 fallback） | 保留原文 `{{ articleUrl }}` |
| `{{ blogger.publishedUrl }}` | `post.publish.blogger.publishedUrl` → `post.publish.publishedUrl` → `post.publishedUrl`（**永不推導**） | 保留原文 |
| `{{ github.publishedUrl }}` | `post.publish.github.publishedUrl` → `post.publish.github.url` → `post.github.publishedUrl` → `post.githubUrl`（**本批不實作 siteUrl + path 推導**） | 保留原文 |
| `{{ canonicalUrl }}` | `post.publish.canonical.url`（schema nested） → `post.publish.canonicalUrl`（flat alias） → `post.canonicalUrl` → `articleUrl` resolved（防遞迴：articleUrl → canonical 時，canonical 之 articleUrl resolver 為 null） | 保留原文 |

### 4.2 行為驗證

| 行為 | 結果 |
|---|---|
| unresolved 保留原文 | ✅ `resolvePlaceholders` 之 `String.prototype.replace` callback 對 unresolved return `match`（原始 `{{ ... }}` 字串） |
| unresolved 不替換為空字串 | ✅ |
| 不修改 input `text` | ✅ `originalText` 為入參副本；`resolvedText` 為新字串 |
| 不 throw 作為控制流程 | ✅ 所有不可解析情境透過回傳結構之 `resolved=false` / `unresolvedPlaceholders[]` 表達 |
| 純函式 | ✅ 無 `fs` import、無 `process.cwd()` / `process.env`、無外部副作用、相同 input 永遠相同 output |

---

## §5 暫不支援與刻意保留的邊界

Phase 8-c **尚未**處理之事項（屬未來階段範圍；以「尚未做」語氣描述）：

### 5.1 第二批 placeholder（尚未做）

`KNOWN_UNSUPPORTED_PLACEHOLDERS` 中之 9 個項目目前列為 `unsupported-placeholder`，由 helper 拒絕解析、validate-content 一律 warning：

`title` / `description` / `excerpt` / `tags` / `hashtags` / `slug` / `publishedAt` / `siteName` / `category`

延後理由：第一批先專注 URL 類；文字類涉及陣列序列化 / 日期格式化 / settings lookup 等獨立規則，需另開規格批次。

### 5.2 GitHub URL 推導（尚未做）

helper 之 `getGithubPublishedUrl` 只讀取既有欄位（4 層 fallback），**未實作 `siteUrl + path` 推導**。空值即 unresolved。

未來 GitHub URL 推導待 site.config.json 與 route 規則穩定化後另開批次評估。

### 5.3 Blogger publishedUrl 以外的預測 URL（永不做）

`docs/publish-json-schema.md` §5.3 之**強制規則**：永遠不預測 Blogger URL。本階段嚴格遵守：

- ❌ 不從 `permalink + 月份` 組 URL
- ❌ 不從 `bloggerSiteUrl + slug` 組 URL
- ❌ 不從 `publishedAt` 推算月份
- ❌ 不反推任何 yyyy/mm 結構

此規則為**永久強制**，不在 Phase 8-d 或後續階段放寬。

### 5.4 更完整的欄位映射（尚未做）

Phase 8-c **不**做下列映射（屬 Phase 8-d 範圍）：
- `publishSidecar.canonical.url` → `post.canonical`（top-level）
- `publishSidecar.ogImage.url` → `post.cover`
- `publishSidecar.blogger` → `post.blogger`（top-level）
- `publishSidecar.github` → `post.github`（top-level）
- `publishSidecar.seo.metaTitle` → `post.metaTitle`
- 諸如此類之欄位攤平

`post.sidecars.publish` / `post.publish` 結構維持 8-b-4 之 raw 形式；無 sidecar-first 攤平至 top-level。

### 5.5 多社群平台 placeholder 擴充（尚未做）

目前 placeholder 僅服務 Facebook（`.fb.md`）。未來如新增 LINE / Threads / IG / X 等社群之 sidecar 與 placeholder，屬 Phase Z（CLAUDE.md §29）或更晚批次範圍。

### 5.6 sidecar schema 新欄位擴充（尚未做）

`.fb.md` frontmatter 7 欄位、`.publish.json` 6 個 top-level keys 維持 Phase 8-a 之 schema 不變。新欄位（如 `excerpt` / `series` / `quote` 等）若加入需另開規格批次。

---

## §6 status × severity 最終驗證矩陣

依實際 `src/scripts/validate-content.js` 之 `severityForFbContentMissing` / `severityForFbPlaceholder` 實作核對：

### 6.1 `fb-md-content-missing`（`.fb.md` 存在但 body trim 後為空）

| status | severity |
|---|---|
| `draft` | warning |
| `ready` | **error** |
| `published` | **error** |
| `archived` | warning |
| 未知 status | warning（默認 fallback） |

### 6.2 `fb-md-placeholder-unresolved`（依 placeholder 名稱、reason、target、primaryPlatform 動態分流）

**reason='unsupported-placeholder'** （任何 status / 任何 placeholder）：
- → **warning**（一律降階；不影響 URL 導流核心，但提示作者）

**reason='unresolved'**（supported 但無值），依 status × placeholder 分流：

| 條件 \ status | `draft` | `ready` | `published` | `archived` |
|---|:---:|:---:|:---:|:---:|
| `{{ articleUrl }}` unresolved | warning | **error** | **error** | warning |
| `{{ blogger.publishedUrl }}` unresolved，target=blogger 或 auto+primaryPlatform=blogger | warning | **error** | **error** | warning |
| `{{ blogger.publishedUrl }}` unresolved，target 不指向 blogger | warning | warning | **error** | warning |
| `{{ github.publishedUrl }}` unresolved，target=github 或 auto+primaryPlatform=github | warning | **error** | **error** | warning |
| `{{ github.publishedUrl }}` unresolved，target 不指向 github | warning | warning | **error** | warning |
| `{{ canonicalUrl }}` unresolved | warning | warning | **error** | warning |

### 6.3 exit code 行為

沿用既有 `validate-content.js` 之 main 模式邏輯（line 421-423）：

```js
if (result.errorCount > 0) {
  process.exit(1);
}
```

- **0 errors** → exit code 0（即使有任意數量 warning）
- **errors > 0** → exit code 1
- **未知 status 之 fallback**：默認 warning（不阻擋 exit）

### 6.4 unresolved placeholder 保留原文

`resolvePlaceholders` helper 對 unresolved placeholder：
- `resolvedText` 中保留原始 `{{ name }}` 字串（含括號與內部空白）
- **絕不替換為空字串**
- **絕不修改 input `text`**

build-promotion 將 `entry.resolvedFacebookBody`（含原始 placeholder 文字）直接寫入 `.txt`。validate-content 同步以 status × severity 矩陣 push warning / error。

設計依據：`docs/fb-sidecar-schema.md` §5.7（build soft-fail）+ `docs/placeholder-resolver-design.md` §10.1。

---

## §7 Resolver helper API 摘要

依實際 `src/scripts/resolve-placeholders.js` 核對：

### 7.1 主要 export

```js
export function extractPlaceholders(text)
export function resolvePlaceholderValue(name, context, options)
export function resolvePlaceholders(text, context, options)
```

### 7.2 `resolvePlaceholders(text, context, options)` 用法

#### context 形狀

```js
{
  post,                                    // 完整 post 物件（required for fallback chain）
  publish: post.publish ?? null,           // 8-b-4 之 .publish.json raw data（可選；fallback 到 post.publish）
  facebook: post.sidecars.facebook.data,   // .fb.md frontmatter（可選；fallback 到 post.sidecars.facebook.data）
  sourceCollection: post.sourceCollection, // 'posts' | 'pages'（可選）
}
```

#### options 形狀

```js
{
  target: <string>,                                                    // 'blogger' | 'github' | 'canonical' | 'custom' | 'auto'
  primaryPlatform: <string>,                                           // 'blogger' | 'github'
}
// 預設：target = 'auto'；primaryPlatform = 'blogger'
// fallback：options 未提供 → 從 facebook.target / post.primaryPlatform 取值
```

### 7.3 回傳欄位（`resolvePlaceholders`）

```js
{
  originalText,                  // string；入參之副本（不修改）
  resolvedText,                  // string；替換後字串
  placeholders,                  // string[]；text 中 unique 之 placeholder 名稱
  replacements,                  // Array<{ name, value, source }>；已 resolved 之清單
  unresolvedPlaceholders,        // Array<{ name, reason }>；未 resolved 之清單
  issues,                        // Array<{ type, placeholder, reason }>；通用 issue 格式
}
```

### 7.4 `unresolvedPlaceholders` 結構

```js
[
  { name: 'articleUrl',           reason: 'unresolved' },
  { name: 'title',                reason: 'unsupported-placeholder' },
  { name: 'foo',                  reason: 'unsupported-placeholder' },  // 未知名稱同等處理
]
```

### 7.5 `replacementsCount`（build-promotion 之衍生欄位）

build-promotion 將 `resolved.replacements.length` 存於 `entry.facebookSidecar.replacementsCount` 作為 manifest 摘要欄位（避免 manifest 過度龐大；完整 replacements 已存於 `entry.facebookSidecar.placeholders` 之衍生資訊中可推得）。

### 7.6 純函式特性（已驗證）

- ✅ 不讀檔（無 `fs` import）
- ✅ 不寫檔
- ✅ 不執行 build / spawn / child_process
- ✅ 不依賴 `process.cwd()` / `process.env` / `process.argv`
- ✅ 不修改傳入之 `post` / `context` / `options`
- ✅ 不 throw 作為一般 unresolved 控制流程
- ✅ 相同 input 永遠相同 output

---

## §8 validate-content 接入點

依實際 `src/scripts/validate-content.js` 核對：

### 8.1 `.fb.md` body 讀取位置

於 `validateContent({ posts, settings })` 之 post 主迴圈內，每筆 post 通過 `post.sidecars?.facebook` 讀取。位置：8-b-6 sidecar overlap 檢查之**後**、post for-loop closing `}` 之**前**（line ~306-355 區段）。

### 8.2 placeholder 檢查時機

僅當 `fbSidecar.exists === true` 時觸發：

```js
if (fbSidecar && fbSidecar.exists === true) {
  const fbBody = typeof fbSidecar.body === 'string' ? fbSidecar.body : '';
  if (fbBody.trim() === '') {
    // → fb-md-content-missing
  } else {
    const resolved = resolvePlaceholders(fbBody, ctx, opts);
    for (const u of resolved.unresolvedPlaceholders) {
      // → fb-md-placeholder-unresolved
    }
  }
}
```

### 8.3 依 status 決定 error / warning

呼叫 `severityForFbContentMissing(status)` 或 `severityForFbPlaceholder(status, name, reason, target, primaryPlatform)`。詳見 §6.1 / §6.2。

### 8.4 不修改任何 content 檔案

validate-content 流程僅 `issues.push(...)` 至 in-memory 陣列，**不**對 `.fb.md` body / `.publish.json` / post frontmatter / `dist-*` 任何內容做寫入。最終由 `printIssues` console 輸出，由 main 模式之 exit code 決定是否阻擋。

---

## §9 build-promotion 接入點

依實際 `src/scripts/build-promotion.js` 核對：

### 9.1 `.fb.md` body 處理位置

於 `buildManifestEntry(post, page, fb, settings)` 末段（在 base entry 物件建立完成後、`return entry` 之前）。

```js
const fbSidecar = post.sidecars?.facebook;
if (fbSidecar && fbSidecar.exists === true && fbSidecar.body.trim() !== '') {
  const resolved = resolvePlaceholders(fbSidecar.body, ctx, opts);
  entry.resolvedFacebookBody = resolved.resolvedText;
  entry.facebookSidecar = { sourcePath, placeholders, replacementsCount, unresolvedPlaceholders };
  if (resolved.unresolvedPlaceholders.length > 0) {
    console.warn(`[build-promotion] WARNING: .fb.md placeholder unresolved in ${post.sourcePath}: ...`);
  }
}
```

### 9.2 `entry.resolvedFacebookBody` 用途

- **作為 `.txt` 輸出之內容**（由 `renderAndWriteFacebookText` 直接寫入）
- 同時存於 `dist-promotion/facebook/build-manifest.json` 之 `posts[]` 中，供下游工具或 debug 使用

### 9.3 `entry.facebookSidecar` metadata 用途

```js
entry.facebookSidecar = {
  sourcePath: <PROJECT_ROOT 相對之 .fb.md 路徑>,
  placeholders: <text 中 unique placeholder 名稱>,
  replacementsCount: <已 resolved 之數量>,
  unresolvedPlaceholders: <{ name, reason }[]>,
};
```

純為 manifest 之 traceability 欄位（debug、build report、未來 promotion-checklist 之輔助資料）。

### 9.4 `renderAndWriteFacebookText` 分流

```js
async function renderAndWriteFacebookText(entry) {
  let txt;
  if (typeof entry.resolvedFacebookBody === 'string' && entry.resolvedFacebookBody !== '') {
    txt = entry.resolvedFacebookBody;        // ← 路徑 A：sidecar
  } else {
    txt = await ejs.renderFile(FB_POST_TEMPLATE, { post: entry }, { async: true });  // ← 路徑 B：legacy EJS
  }
  await writeText(txtFile, txt.trimEnd() + '\n');
}
```

### 9.5 有 sidecar body 時直接輸出 resolved 字串

走路徑 A，**跳過 EJS template**。理由：`.fb.md` body 設計為**完整 FB 貼文文字**（fb-sidecar-schema.md §4），不需要 EJS framing。

### 9.6 無 sidecar body 時保留 legacy EJS template fallback

走路徑 B，渲染 `src/views/promotion/facebook-post.ejs` 並以 `entry`（含 `entry.message` / `entry.fbTitle` / `entry.finalUrl` / `entry.hashtags`）作為 EJS 上下文。**EJS template 與 entry 之欄位完全未動，舊行為保留**。

### 9.7 unresolved placeholder soft-fail

build-promotion 對 unresolved placeholder：
- ❌ 不 throw
- ❌ 不 process.exit(1)
- ❌ 不阻擋 `.txt` 輸出
- ❌ 不替換為空字串
- ✅ console.warn 提示
- ✅ `.txt` 包含原始 `{{ name }}` 文字（作者人工貼文前可肉眼辨識）

hard-fail 由 8-c-3 validate-content 之 status × severity 矩陣負責；build 維持 soft-fail。

---

## §10 dist-promotion 變動範圍

### 10.1 dist-promotion 是輸出產物，不進 git

`dist-promotion/` 與 `dist/` / `dist-blogger/` / `dist-reports/` / `node_modules/` 同屬 gitignored。`git status` 不顯示 dist-promotion 內變動。

### 10.2 接入後之路徑分流

| 文章類型 | 走路徑 | dist-promotion 變化 |
|---|---|---|
| 有 `.fb.md` 且 body 非空 | 路徑 A（resolved sidecar body） | `.txt` 內容由 sidecar body 解析後替換 placeholder |
| 有 `.fb.md` 但 body 空 | 路徑 B（legacy EJS） | 不變動（trim 後空字串條件未滿足，不進 sidecar 路徑） |
| 無 `.fb.md`（`exists === false`） | 路徑 B（legacy EJS） | 不變動 |
| 不通過 `classifyFacebook`（例 frontmatter `enabled !== true`） | 不進入 build 流程 | 不變動 |

### 10.3 既有測試樣本之實際行為

目前 `content/` 下唯一通過 `classifyFacebook` 之 enabled post 為 `content/github/posts/20260504-github-pages-blog-planning.md`。該 post **無對應 `.fb.md` sidecar**（`post.sidecars.facebook.exists === false`），故走路徑 B（EJS）。

`dist-promotion/facebook/github/github-pages-blog-planning.txt` 之內容**與 8-c-4 commit 前完全等價**（路徑 B 邏輯未變、entry 內 EJS 使用之欄位未變）。

### 10.4 等效性驗證

`npm run build:promotion` 執行結果（截錄關鍵行）：
```
[build-promotion] total enabled: 1 / total filtered: 2
[build-promotion] wrote dist-promotion/facebook/github/github-pages-blog-planning.txt
```

**未出現** `[build-promotion] WARNING: .fb.md placeholder unresolved` 訊息，佐證 sidecar 路徑未對唯一 enabled post 觸發。

---

## §11 驗收指令與結果

本批執行之 5 項驗收指令：

| # | 指令 | 結果 |
|---|---|---|
| 1 | `node --check src/scripts/resolve-placeholders.js` | ✅ syntax-ok |
| 2 | `node --check src/scripts/validate-content.js` | ✅ syntax-ok |
| 3 | `node --check src/scripts/build-promotion.js` | ✅ syntax-ok |
| 4 | `npm run validate:content` | ✅ exit 0；0 error / 4 warning（2x `body-leading-h1` + 2x `frontmatter-uses-deprecated-type`，皆 8-b 既有規則命中既有 fixture） |
| 5 | `npm run build:promotion` | ✅ exit 0；1 enabled post（無 sidecar）寫出 `.txt`；無 unresolved placeholder 警告 |

**未執行**：`npm run build` / `vite build`（依本批禁令）。

**git tracked 變動**：本批驗收期間執行 `npm run build:promotion` 重生 `dist-promotion/`，但 `dist-promotion/` 為 gitignored；`git status` 顯示 `nothing to commit, working tree clean`，無 dist-promotion tracked 變動。

---

## §12 完成判斷

### 12.1 完成判斷

✅ **Phase 8-c 可判定完成並入庫**。

### 12.2 完成依據

| 判準 | 結果 |
|---|---|
| 8-c-1 規格文件已 commit | ✅ `3839fdf` |
| docs 對齊小批次已 commit | ✅ `5bf2159` |
| 8-c-2 helper 已 commit | ✅ `37e6bca` |
| 8-c-3 validate 接入已 commit | ✅ `1eb8cc2` |
| 8-c-4 build-promotion 接入已 commit | ✅ `e4e49ce` |
| 5 項驗收指令全 pass | ✅ |
| validate-content exit code 維持 0 | ✅ |
| build:promotion 流程正確 | ✅ |
| dist-promotion 未進 git | ✅（gitignored） |
| 無 amend / rebase / push / 設 remote | ✅ |
| EJS template / content 檔 / package.json 未動 | ✅ |
| Blogger URL 未推導 | ✅（強制規則沿用） |

### 12.3 已知風險

| 風險 | 描述 | 影響 / 緩解 |
|---|---|---|
| 第二批 placeholder 未實作 | `{{ title }}` 等 9 個文字類 placeholder 一律 unsupported-placeholder warning | 作者若用 typo 之 placeholder 會被視為 unsupported；行為一致無功能風險 |
| GitHub URL 推導未實作 | 無 `siteUrl + path` 自動組 URL | 若 `.publish.json` 之 `github.publishedUrl` 未回填且 fb.md 用 `{{ github.publishedUrl }}` → unresolved。屬已知行為，由 status × severity 矩陣處置 |
| 未實際測試 sidecar 路徑 | 既有測試 fixture 無 `.fb.md`；新代碼路徑於 dist-promotion 未實際觸發 | 程式語法 OK、邏輯經 review；首次有 `.fb.md` 文章建立後可實機驗證 |
| 設定 fbData.primaryPlatform 之讀取 | options 中 `fbData?.primaryPlatform` 為 `.fb.md` schema §3.1 七欄位之外 | 此欄位讀取為防禦式 fallback；`.fb.md` 不寫此欄位即 fall through 至 `post.primaryPlatform`。**fb-sidecar-schema.md 未動**，不違反 schema 規範 |
| `.publish.json` schema 深度驗證未實作 | 缺漏欄位 / enum 違規未由 validate-content 檢查 | 屬 Phase 8-d 之後或獨立 schema 驗證批次範圍 |
| EJS template 欄位映射尚未做 | sidecar 與 EJS template 欄位仍分離 | 屬 Phase 8-d 範圍 |

### 12.4 是否可進 Phase 8-d

✅ **可進 Phase 8-d**。所有 Phase 8-c 主線批次完整入庫；驗收指令全通過；`dist-promotion` 在無 sidecar 之 fixture 上維持等價輸出；validate-content 與 build-promotion 在 Phase 8-c 引入之新規則與接入點均不影響既有 build 行為。

---

## §13 下一階段建議

Phase 8-d 之初步建議方向（**僅建議，不在本批實作**）：

### 13.1 欄位映射整理

將 sidecar / publish / legacy frontmatter 之欄位攤平至 post top-level，例：
- `post.publish.canonical.url` → `post.canonical`
- `post.publish.ogImage.url` → `post.cover`
- `post.publish.blogger` → `post.blogger`
- `post.publish.seo.metaTitle` → `post.metaTitle`

需設計 sidecar 勝、frontmatter fallback 之優先序規則，並驗證 byte-identical 承諾。

### 13.2 sidecar / publish / legacy frontmatter 的優先序收斂

將「sidecar 勝、frontmatter fallback」原則（`docs/publish-bundle.md` §3）落地到 build 流程：
- 各層 post 物件 / EJS template 之欄位讀取統一改用 sidecar-first chain
- legacy frontmatter 之 `promotion.facebook` / `canonical` / `blogger.publishedUrl` 等視為 fallback
- 衝突時依 8-b-6 之 `sidecar-frontmatter-overlap` warning 提示

### 13.3 GitHub / Blogger 輸出欄位一致化

- `dist/`（GitHub Pages）與 `dist-blogger/`（Blogger HTML）之欄位讀取邏輯統一
- EJS template 接收之 `post` 物件欄位形狀對齊
- 兩平台之 `publishedUrl` / `canonicalUrl` / `metaTitle` 等之來源規則文件化

### 13.4 copy-helper / promotion manifest 的資料來源整理

- `dist-blogger/posts/{slug}/copy-helper.txt` 之資料來源整理
- `build-manifest.json` 與 `all-posts-index.txt` 之欄位語意統一
- 8-c-4 引入之 `entry.resolvedFacebookBody` / `entry.facebookSidecar` 之 manifest 結構納入正式規格

### 13.5 第二批 placeholder 規劃

評估第二批文字類 placeholder（`{{ title }}` / `{{ description }}` / `{{ excerpt }}` / `{{ tags }}` / `{{ hashtags }}` / `{{ slug }}` / `{{ publishedAt }}` / `{{ siteName }}` / `{{ category }}`）之引入時機：
- 需先定義各欄位之取值優先序（與 §13.1 欄位映射整合）
- 陣列序列化規則（`tags` / `hashtags` 之分隔符）
- 日期格式化（`publishedAt` 之 ISO / 本地化）
- settings lookup（`siteName` / `category` 之 categories.json 對照）

下一階段已於 `docs/phase-8d-completion-report.md` 落地。

---

（本文件結束）
