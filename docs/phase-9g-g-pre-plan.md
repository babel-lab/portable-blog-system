# Phase 9-g-g Pre-Plan：JSON-LD mentions / isPartOf 設計

本文件封存 **Phase 9-g-g（JSON-LD `mentions` / `isPartOf` structured data 強化）系列**之 docs-only pre-plan 設計。為**純設計批**；無 source / content / fixtures / dist 變動。

對應之上層紀錄：
- `docs/related-links-schema.md` §9.2（既有 Phase 9-g-g deferred 標註；本批同步補強 mentions 映射設計）
- `docs/phase-9j-jsonld-landing-verification.md` §4.1 / §4.2（既有 JSON-LD 落地紀錄 + Phase 9-g-g / 9-f-g deferred 理由）
- `docs/phase-1-completion-report.md` §8.1（Phase 9-g-g post-Phase-1 deferred）+ §11 順序 4
- `docs/seo-ga4-adsense.md` §7.4（BlogPosting JSON-LD schema；本批同步補 Phase 9-g-g 預計新增欄位）
- `docs/future-roadmap.md` §8.5 順序 4（Phase 9-g-g 排程）

---

## §1 Phase 9-g-g 目標摘要

### 1.1 高階目標

Phase 9-g-g 為 Phase 1 final + Phase 8-h 退場完成後之 SEO structured data 強化批，目的為**擴充 BlogPosting JSON-LD schema**，加入 `mentions` / `isPartOf` 兩個 schema.org 標準欄位：

1. **BlogPosting JSON-LD 增強**：在既有 12 欄位基礎上，新增 `mentions` + `isPartOf` 兩個 schema.org-compliant 欄位
2. **mentions**：將 `post.relatedLinks` / `post.otherLinks` 之作者主動引用之延伸閱讀 / 來源連結，映射為 `mentions[]` array
3. **isPartOf**：將文章歸屬之 site / blog（最保守 type）映射為 `isPartOf` object
4. **Blogger / GitHub 兩端 parity**：兩端 BlogPosting schema 同步 mirror（per Phase 9-h article block parity precedent + Phase 9-i-b2 canonical 同步）
5. **不影響既有 production output**：既有 12 欄位完全保留；本批屬 additive；對無 relatedLinks 之 ready posts 之 JSON-LD 變動限於新增 `isPartOf`；對 relatedLinks live activated 之 we-media-myself2 新增 `mentions[]`

### 1.2 範圍區分

| 範圍 | 屬性 |
|---|---|
| **in-scope**（本系列預計處理）| `mentions` field + `isPartOf` field on BlogPosting；Blogger + GitHub 兩端 |
| **out-of-scope**（per §10）| Google Rich Results Test 驗證 / Phase 9-f-g Book / Periodical structured data / Related Posts auto block / sitemap cross-source gap / library type enum / YouTube / Netflix / DVD / magazine specific @type |

### 1.3 設計原則

- **保守 @type**：mentions[] item 採 `WebPage` 或 `CreativeWork` base type；不臆造 specific subType（避免 schema.org 嚴格性導致 Google 標 invalid）
- **保守 isPartOf**：第一版僅接 site / blog；不接 book / series / category（避免語義錯誤）
- **嚴格 pre-filter**：mentions 來源（relatedLinks / otherLinks）必須有 url + title；無資料之 entries 不進 mentions
- **兩端 mirror**：Blogger + GitHub schema 完全一致；single design / dual implementation point
- **不接 normalize-post-output**：per `docs/related-links-schema.md` §9.3 第一版設計；直接讀 `post.relatedLinks` / `post.otherLinks` / `post.primaryPlatform` / `settings.site.*`

---

## §2 目前基準狀態

### 2.1 Git 狀態

| 項目 | 值 |
|---|---|
| **HEAD** | `e9e2ada docs(phase-8h): land legacy fallback retirement completion report` |
| **working tree** | clean |
| **Phase 8-h** | ✅ 實質完成（15/15 in-scope positions retired-or-migrated；per `docs/phase-8h-completion-report.md`）|

### 2.2 Baseline 指標

| 指標 | 數值 |
|---|---|
| `validate:content` baseline | `0 error / 22 warning on 17 post(s)` |
| `build:promotion` | exit 0；**total enabled=2 / total filtered=4** |
| Real ready posts | 3 篇（2 篇 GitHub tech-note + 1 篇 Blogger book-review）|

### 2.3 Phase 9-g 系列既有 landed（per related-links-schema.md §9.1）

| Sub-batch | 狀態 |
|---|---|
| Phase 9-g-a ~ 9-g-f-c | ✅ landed（schema / fixtures / Blogger render / GitHub render / copy-helper / publish-checklist 全套；relatedLinks / otherLinks 結構性能力完整）|
| **Phase 9-g-g**（本系列）| ⏸ pre-plan 階段（本文件）|

---

## §3 目前 JSON-LD 架構

### 3.1 產出位置

| 端 | 函式 / 模板 | 輸出 schema |
|---|---|---|
| **GitHub home** | `src/scripts/build-github.js:177-187` `buildSeoForHome()` → `seo.jsonLd` | `WebSite` |
| **GitHub post detail** | `src/scripts/build-github.js:197-227` `buildSeoForPostDetail()` → `seo.jsonLd` | `BlogPosting` |
| **GitHub other pages**（category / tag / search / about / 404 / post-list / design-system）| 無 jsonLd | ❌ 不輸出 |
| **Blogger post (full mode)** | `src/scripts/build-blogger.js:131-151` `buildBloggerJsonLd()` | `BlogPosting` |
| **Blogger post (summary mode)** | 同上函式（共用）| `BlogPosting` |
| **Blogger redirect-card** | 無 jsonLd | ❌ by design 不輸出（per `blogger-redirect-card.ejs:3` 註明「純跳轉卡無 BlogPosting 語意」）|

### 3.2 EJS template 是否需要修改

✅ **預期不需要動 EJS template**：
- GitHub 端 `src/views/seo/json-ld.ejs` 為純 `JSON.stringify(seo.jsonLd)` wrapper；新增欄位自動納入序列化
- Blogger 端之 inline `<script type="application/ld+json">` 於 `blogger-post-full.ejs:22-24` + `blogger-post-summary.ejs:19-21` 採同 pattern；新增欄位自動納入

### 3.3 主要接入點

| 端 | 檔案 | 函式 | 預期改動行數 |
|---|---|---|---|
| **GitHub** | `src/scripts/build-github.js` | `buildSeoForPostDetail()`（line 197-227）| ~+10-20 行（isPartOf + mentions object literal 條件式組裝）|
| **Blogger** | `src/scripts/build-blogger.js` | `buildBloggerJsonLd()`（line 131-151）| ~+10-20 行（同上 mirror）|

### 3.4 不需動之路徑

- ❌ `src/views/seo/json-ld.ejs`：partial wrapper；新欄位自動納入
- ❌ `src/views/blogger/blogger-post-{full,summary}.ejs`：inline script wrapper；同上
- ❌ `src/scripts/normalize-post-output.js`：per `docs/related-links-schema.md` §9.3 第一版不接 normalize
- ❌ `content/`：不需新增 fixtures / 不需動 production posts（we-media-myself2 已含完整 relatedLinks 可作為 live regression target）

---

## §4 現有 BlogPosting 欄位表

per Phase 9-j JSON-LD landing verification（`docs/phase-9j-jsonld-landing-verification.md` §3.2）+ 本批 Phase 9-g-g-a 讀取確認；兩端 12 欄位 mirror 一致：

| # | 欄位 | 來源 | 條件 |
|---|---|---|---|
| 1 | `@context` | `'https://schema.org'`（固定）| 永遠輸出 |
| 2 | `@type` | `'BlogPosting'`（固定）| 永遠 |
| 3 | `@id` | `canonicalUrl` | canonicalUrl 為空 → 整 jsonLd return null |
| 4 | `headline` | `post.title` | 永遠 |
| 5 | `description` | `post.description ?? settings.site.description` | 永遠 |
| 6 | `datePublished` | `post.date` | 永遠 |
| 7 | `dateModified` | `post.updated ?? post.date` | 永遠 |
| 8 | `author` | `{ '@type': 'Person', name: post.author ?? settings.site.author }` | 永遠 |
| 9 | `mainEntityOfPage` | `canonicalUrl` | 永遠 |
| 10 | `inLanguage` | `settings.site.language` | 永遠 |
| 11 | `articleSection` | category name（lookup from settings.categories）| 永遠 |
| 12 | `image` | `ogImage` | 條件式：`if (ogImage)` |
| **+ 13（planned）** | **`isPartOf`** | site / blog（從 settings + canonicalPlatform 構建）| 永遠 |
| **+ 14（planned）** | **`mentions`** | 來自 post.relatedLinks + post.otherLinks（嚴格 pre-filter）| 條件式：non-empty array |

---

## §5 isPartOf 設計

### 5.1 設計決策摘要

| 決策 | 內容 | 理由 |
|---|---|---|
| 第一版只接 **site / blog** 層級 | `isPartOf` 指 BlogPosting 所屬之 WebSite / Blog | schema.org 標準用法；最廣覆蓋（所有 ready posts 適用）|
| **不用 book** 當 isPartOf | book 屬 mentions / about 範疇 | schema.org 之 isPartOf 定義「CreativeWork is part of larger CreativeWork」；書評不是 PART OF 被評書本 |
| **series** 列為未來 conditional enhancement | 當 ready post 含 series 時 conditionally added | 當前 0 篇 ready post 含 series；屬 dormant feature |
| **category / channel** 暫不優先 | 留至第三版（如需要）| WebPageSection 之 @type 在 schema.org 較少見；Google 解析較弱 |

### 5.2 第一版 @type 選擇

| 端 | primaryPlatform | isPartOf @type | 範例 |
|---|---|---|---|
| **GitHub-source posts** | `github` | `Blog`（schema.org 標準）| `{ "@type": "Blog", "@id": "https://babel-lab.github.io/", "name": "...", "url": "https://babel-lab.github.io/" }` |
| **Blogger-source posts** | `blogger` | `Blog` | `{ "@type": "Blog", "@id": "https://babel-lab.blogspot.com/", "name": "...", "url": "https://babel-lab.blogspot.com/" }` |
| **Cross-source mirror post (GitHub end of Blogger post)** | mirror page | `Blog`（指向 Blogger 主站）| 同 Blogger-source posts |

**保守選擇**：採 `Blog` 而非 `WebSite`，因 BlogPosting 之 parent CreativeWork 語義最精確為 Blog；schema.org 也支援。

替代方案（更保守）：採 `WebSite` 通用 type；Google 對其廣泛接受度高。但 `Blog` 語義更精確；建議第一版採 `Blog`。

### 5.3 isPartOf 欄位映射

| isPartOf 子欄位 | 來源 |
|---|---|
| `@type` | `'Blog'`（fixed）|
| `@id` | `settings.site.githubSiteUrl` 或 `settings.site.bloggerSiteUrl`（依 post.primaryPlatform 選擇）|
| `name` | `settings.site.siteName`（GitHub 端）或 settings.site.bloggerSiteName（若未設定則用 siteName）|
| `url` | 同 `@id` |
| `inLanguage` | `settings.site.language` |

### 5.4 Blogger / GitHub 兩端 mirror

| 端 | 接入點 | mirror 程度 |
|---|---|---|
| GitHub | `buildSeoForPostDetail` line 211-225 之 seo.jsonLd | isPartOf 欄位語義完全一致 |
| Blogger | `buildBloggerJsonLd` line 131-151 之 jsonLd | 同上；@type / 結構完全 mirror |

**唯一差異**：`@id` / `url` 之具體 URL（依 post 屬於 GitHub 還是 Blogger 而不同）。其他結構性欄位完全相同。

### 5.5 Series conditional enhancement（未來）

當 post 含 `post.series.id` + `post.series.resolvedTitle` 時，可進一步補：

```json
"isPartOf": [
  { "@type": "Blog", ... },
  { "@type": "CreativeWorkSeries", "name": "{series.resolvedTitle}", ... }
]
```

**第一版不實作**；列為 future enhancement；當 ready post 含 series 時再啟動。

---

## §6 mentions 設計

### 6.1 設計決策摘要

| 決策 | 內容 | 理由 |
|---|---|---|
| 第一版只接 **relatedLinks + otherLinks** | 兩個 array 之 entries 映射為 `mentions[]` items | 作者主動策劃；語義精確（referenced but not necessarily about）|
| **嚴格 pre-filter** | entry 必須是 plain object + url non-empty + title non-empty | 避免 fixture 殘缺 entries 進 production JSON-LD |
| 第一版 item **只輸出 @type + name + url** | 不擴及 description / platform 等欄位 | 最保守 schema.org 結構；Google 寬鬆接受 |
| **不臆造 specific @type** | 統一用 `WebPage` 或 `CreativeWork` base | YouTube / Netflix / DVD / magazine 之 specific subType 需正確 metadata 才能通過 Google；本批不臆造 |
| **book / author / platform** 屬 Phase 9-f-g 範疇 | book metadata 之 schema.org structured data | Phase 9-f-g 為獨立批；不在本批 source 設計 |
| **不接 affiliate.links** | affiliate 屬 sponsored；不應為 mentions | schema.org mentions 為「referenced」；affiliate 之 sponsored 性質會誤導 Google 解讀 |

### 6.2 第一版 @type 選擇

| Item @type | 採用 | 理由 |
|---|---|---|
| `WebPage` | ✅ 採 | 最通用；schema.org 對外部連結之預設選擇 |
| `CreativeWork` | ✅ 替代候選（更廣）| 若有更佳語義場景；第一版採 `WebPage` |
| `VideoObject`（YouTube）| ❌ 不採 | 需正確 contentUrl / duration 等欄位；本批無 metadata |
| `MediaObject`（Netflix）| ❌ 不採 | 同上 |
| `Book`（DVD / 紙本書）| ❌ 不採 | 屬 Phase 9-f-g 範疇 |
| `Periodical`（magazine）| ❌ 不採 | 同上 |
| `LibrarySystem` / `Library`（圖書館）| ❌ 不採 | schema.org 之 Library 為「機構」schema；非「館藏頁面」之 schema |

**第一版統一採 `WebPage`**。

### 6.3 mentions item 欄位映射

per `docs/related-links-schema.md` §3 之 relatedLinks / otherLinks per-item schema（8 欄位：kind / platform / title / url / description / order / target / rel）：

| mentions[] item 欄位 | 來源（per-item） |
|---|---|
| `@type` | `'WebPage'`（fixed；第一版）|
| `name` | `entry.title`（必填；pre-filter 排除空值）|
| `url` | `entry.url`（必填；pre-filter 排除空值）|

**第一版不映射**：`platform` / `description` / `order` / `kind` / `target` / `rel` 等欄位（不在 mentions output）。

### 6.4 Pre-filter rule

```js
// pseudo-code (本文件設計提案；非 source code)
const mentionsSource = [
  ...(Array.isArray(post.relatedLinks) ? post.relatedLinks : []),
  ...(Array.isArray(post.otherLinks) ? post.otherLinks : []),
];

const mentionsItems = mentionsSource
  .filter(entry =>
    entry &&
    typeof entry === 'object' &&
    !Array.isArray(entry) &&
    typeof entry.url === 'string' &&
    entry.url.trim() !== '' &&
    typeof entry.title === 'string' &&
    entry.title.trim() !== ''
  )
  .map(entry => ({
    '@type': 'WebPage',
    name: entry.title,
    url: entry.url,
  }));

if (mentionsItems.length > 0) {
  jsonLd.mentions = mentionsItems;
}
// 若 mentionsItems.length === 0：不輸出 mentions 欄位（avoid empty array）
```

### 6.5 mentions[] 不輸出空陣列

當 pre-filter 後 mentionsItems 為空（post 無 relatedLinks / otherLinks，或全 entry 皆缺 url / title）：
- **不**輸出 `"mentions": []`
- **不**輸出 `"mentions": null`
- 整個 `mentions` 欄位**不出現**於 JSON-LD object

此設計避免 JSON-LD 含空 / null 欄位被 Google 標 invalid。

### 6.6 範例 JSON output

**we-media-myself2（含 6 個 relatedLinks）退場後預期輸出**：

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": "https://babel-lab.blogspot.com/2026/05/we-media-myself2.html",
  "headline": "貝果書屋-AI玩轉自媒體的52個商業思維#2(提問筆記書)",
  "description": "Master AI Content Monetization with...",
  "datePublished": "2026-05-15",
  "dateModified": "2026-05-15",
  "author": { "@type": "Person", "name": "Dean" },
  "mainEntityOfPage": "https://babel-lab.blogspot.com/2026/05/we-media-myself2.html",
  "inLanguage": "zh-Hant",
  "articleSection": "書評",
  "isPartOf": {
    "@type": "Blog",
    "@id": "https://babel-lab.blogspot.com/",
    "name": "Babel Lab",
    "url": "https://babel-lab.blogspot.com/",
    "inLanguage": "zh-Hant"
  },
  "mentions": [
    { "@type": "WebPage", "name": "...", "url": "..." },
    { "@type": "WebPage", "name": "...", "url": "..." }
    /* ...4 more items */
  ]
}
```

**無 relatedLinks 之 ready post（github-pages-blog-planning / portable-blog-system-mvp）退場後預期輸出**：

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": "https://babel-lab.github.io/posts/github-pages-blog-planning/",
  /* ... 既有 11 欄位 ... */
  "isPartOf": {
    "@type": "Blog",
    "@id": "https://babel-lab.github.io/",
    "name": "Babel Lab",
    "url": "https://babel-lab.github.io/",
    "inLanguage": "zh-Hant"
  }
  /* mentions 欄位不出現（無 relatedLinks/otherLinks）*/
}
```

---

## §7 風險表

per Phase 9-g-g-a 既有分析；本批 pre-plan 再次收斂：

| # | 風險項 | 風險等級 | 詳細評估 | 緩解策略 |
|---|---|---|---|---|
| 1 | **mentions JSON-LD 膨脹** | 🟡 中 | we-media-myself2 含 6 個 entries → 增量 ~500-700 bytes / post；無 relatedLinks post 之增量限於 isPartOf（~150-200 bytes）| 限 3 欄位 / item（@type + name + url）；不擴及 description / platform |
| 2 | **relatedLinks / otherLinks 是否全部進 mentions** | 🟠 中-高 | 兩個 array 屬作者主動策劃；語義適合 mentions。需嚴格 pre-filter（避免 fixture entries 進 mentions）；不分 kind=internal/external（皆適合）| pre-filter：array only + title non-empty + url non-empty；不包含 affiliate.links |
| 3 | **isPartOf 語義選擇（series / book / website / category）** | 🟠 中-高 | book 屬 mentions 而非 isPartOf（語義錯誤）；series 當前 0 ready posts；category 之 WebPageSection 較弱；website / blog 最廣 | **第一版只接 site / blog**（最廣覆蓋；schema.org 標準）；series / category 列為 future enhancement |
| 4 | **Blogger / GitHub parity** | 🟢 低-中 | 既有兩端 BlogPosting 12 欄位完全 mirror；新增 mentions / isPartOf 應同步 mirror | 採 Phase 9-h article block parity 同 pattern；2 個 source files 同步修改；兩端 sanity check |
| 5 | **Google Rich Results Test 對 mentions / isPartOf 敏感度** | 🟠 中-高（**核心風險**）| schema.org 嚴格性：錯誤 @type / 缺欄位 → invalid；mentions / isPartOf 屬 schema.org 標準；@type 採 base type（WebPage / Blog）降低敏感度 | 起手用最保守 @type；landed 後**強烈建議用戶實測 Rich Results Test**；若 Google 拒絕，可在 Phase 8-h-d-1 pattern 之 next batch 退場 |
| 6 | **validate baseline 影響** | 🟢 低 | JSON-LD 構建在 build-*.js 階段；validate-content 不掃 JSON-LD；既有 `0/22/17` baseline 無 validate path 之變動 | 預期 validate baseline 維持 `0/22/17` |
| 7 | **是否需要 fixtures** | 🟡 中 | we-media-myself2 已含完整 relatedLinks（6 個）；可作為 live regression target；其他 2 篇 ready posts 無 relatedLinks 可驗證「不輸出空 mentions」邊界 | **不**新增 fixture；用 3 篇 ready posts 做 live verification |
| 8 | **schema docs 更新需求** | 🟢 低 | `docs/related-links-schema.md` §9.2 補 mentions 映射設計；`docs/seo-ga4-adsense.md` §7.4 補 Phase 9-g-g 預計欄位 | 本批 9-g-g-b 完成；後續 source 批次 9-g-g-c / 9-g-g-d 不必再動 docs |
| 9 | **dist regression（既有 ready posts JSON-LD 變動）** | 🟡 中 | 兩端 ready posts 之 JSON-LD output **將變動**（新增 isPartOf 全部 posts；新增 mentions 限 we-media-myself2）；但屬 additive；既有 12 欄位不變 | sanity check 採 byte-identical-modulo-builtAt + JSON keyset diff（新增 isPartOf / mentions；其他欄位完全保留）|
| 10 | **dist/.gitkeep 副作用（vite build）** | 🟡 中 | 若 source 退場批跑 `npm run build`，需處理 .gitkeep restore（per Phase 8-h-b 既有 pattern）| Phase 9-g-g-c / 9-g-g-d 各批含 `git restore dist/.gitkeep` 後續處理 |

---

## §8 分批實作建議

### 8.1 Phase 9-g-g 系列拆批 roadmap

| 子批次 | 範圍 | 預估 commit 數 | 風險等級 |
|---|---|---|---|
| **Phase 9-g-g-a** | 純讀取分析（pre-analysis）| 0（無 commit）| 🟢 極低 |
| **Phase 9-g-g-b（本批）** | docs-only pre-plan（本文件 + related-links-schema.md §9.2 + seo-ga4-adsense.md §7.4）| 1 | 🟢 極低 |
| **Phase 9-g-g-c** | source 接入 **isPartOf only**（單一欄位；最保守第一步）| 1 | 🟠 中（首次 BlogPosting schema additive；觸發 vite build dist/.gitkeep）|
| **Phase 9-g-g-d** | source 接入 **mentions only**（接 relatedLinks / otherLinks；嚴格 pre-filter）| 1 | 🟠 中（mentions[] 構建邏輯較複雜；pre-filter 邊界 case）|
| **Phase 9-g-g-z** | completion report + docs sync（mirror Phase 8-h-z pattern）| 1 | 🟢 低 |

**合計**：3 source / docs commits + 1 pre-plan commit + 1 completion report commit = **5 commits**（不含 9-g-g-a 純分析）

### 8.2 拆批理由

- **9-g-g-c（isPartOf）先 / 9-g-g-d（mentions）後**：isPartOf 為單一 object；scope 最小；先驗證 Google Rich Results Test 接受度後再進入 mentions
- **不合批**：mirror Phase 8-h 退場系列之保守拆批；每批單一欄位降低 surface area
- **completion report 留 9-g-g-z**：mirror Phase 8-h-z；docs sync 一次處理

### 8.3 各批 trigger conditions

| 批次 | trigger condition |
|---|---|
| Phase 9-g-g-c | ✅ 本批（9-g-g-b）docs landed；用戶批准進入 source 批 |
| Phase 9-g-g-d | ✅ 9-g-g-c 已 landed + 用戶確認 isPartOf 之 Google Rich Results Test 通過（或用戶主動選擇略過 Rich Results Test 直接續做）|
| Phase 9-g-g-z | ✅ 9-g-g-c + 9-g-g-d 皆 landed |

---

## §9 驗證策略

### 9.1 各批驗證命令

| 批次 | 驗證命令 | 預期結果 |
|---|---|---|
| **Phase 9-g-g-b（本批）** | `npm run validate:content`（可選）| `0 error / 22 warning / 17 post(s)` 維持 |
| **Phase 9-g-g-c（isPartOf source）** | `npm run validate:content` + `npm run build:github` + `npm run build`（vite）+ `npm run build:blogger` | 全 exit 0；baseline 維持；dist JSON-LD 含 isPartOf 欄位 |
| **Phase 9-g-g-d（mentions source）** | 同 9-g-g-c | 同上 + we-media-myself2 JSON-LD 含 mentions[6 items]；其他 ready posts 無 mentions 欄位 |
| **Phase 9-g-g-z** | `npm run validate:content`（驗證 baseline）| 同上 |

### 9.2 Blogger / GitHub parity 驗證

每批 source 退場後，需確認 Blogger + GitHub 兩端 BlogPosting JSON-LD 達成 **欄位 parity**：

| 維度 | 預期 |
|---|---|
| 既有 12 欄位 | byte-identical-modulo-builtAt（每個 ready post 兩端 mirror）|
| 新增 isPartOf | 結構完全 mirror（@type + @id + name + url + inLanguage 五欄位）|
| 新增 mentions | 結構完全 mirror（@type + name + url 三欄位 / item）；mentions[] 長度一致 |
| `@id` 唯一差異 | 反映 cross-source mirror（GitHub 端 mirror page canonical 指向 Blogger publishedUrl；per Phase 9-i-b2 既有設計）|

### 9.3 Live target verification

| Post | 角色 | 驗證重點 |
|---|---|---|
| `20260515-we-media-myself2`（Blogger book-review；6 個 relatedLinks）| **mentions live target** | dist-blogger 之 BlogPosting JSON-LD `mentions[]` 含 6 個 items；name + url 與 relatedLinks entries 對齊 |
| `20260504-github-pages-blog-planning`（GitHub tech-note；無 relatedLinks）| **mentions empty case** | dist 之 BlogPosting JSON-LD **不含** mentions 欄位（避免 empty array 噪音）|
| `20260504-portable-blog-system-mvp`（GitHub tech-note；無 relatedLinks）| 同上 | 同上 |

### 9.4 Google Rich Results Test

**作者 SOP**（per `docs/phase-1-completion-report.md` §11 順序 1）：

| 階段 | 作者執行 |
|---|---|
| Phase 9-g-g-c landed 後 | 對 we-media-myself2 之 dist BlogPosting JSON-LD（含 isPartOf）做 Rich Results Test；確認 schema 通過 |
| Phase 9-g-g-d landed 後 | 同上但含 mentions[]；確認 Google 對 mentions 之 WebPage @type 接受 |
| 任一階段 Google 拒絕 | 暫停後續批次；回報具體 Google 訊息；評估退場 / 修正 @type / 縮減欄位範圍 |

---

## §10 Out-of-scope

本系列**明確不處理**之項目：

| 項目 | 範疇 | 處置 |
|---|---|---|
| **Google Rich Results Test 驗證** | 屬作者 SOP；非 Claude 執行 | 9-g-g-c / 9-g-g-d landed 後由作者執行；不在本批或後續 9-g-g-* 之 source 變動 |
| **Phase 9-f-g Book / Periodical structured data** | book metadata schema.org 強化（book-review post 之被評書本 → Book / Periodical）| 獨立 Phase 9-f-g 處理；不在 Phase 9-g-g scope |
| **Phase 9-h-f Related Posts auto block** | 兩端自動相關文章推薦邏輯 | 獨立 Phase 9-h-f；觸發條件需 ≥ 5 篇 ready post（當前 3 篇）|
| **sitemap.xml cross-source gap 修復** | we-media-myself2 cross-source mirror 未入 sitemap | 獨立 future batch；per `docs/phase-10-a-b-sitemap-robots-baseline.md` §3.3 |
| **library type enum 擴充** | 一般圖書 / 電子書 / DVD / 雜誌 / Netflix 等正式 type | per `docs/phase-1-completion-report.md` §8.10；屬未來 schema 候選 |
| **YouTube / Netflix / DVD / magazine specific @type** | mentions[] item 採 VideoObject / MediaObject / Book / Periodical | 第一版統一 WebPage；未來若有正確 metadata 再分 type |
| **mentions / isPartOf 之 normalize-post-output 接入** | 第一版直接讀 post.* 欄位 | per `docs/related-links-schema.md` §9.3 第一版設計 |
| **affiliate.links 映射** | sponsored 性質 | 不應為 mentions；本批不處理 |
| **BreadcrumbList / WebPage / Organization 等其他 schema** | 既有 BlogPosting + WebSite 之外的 schema 類型 | 不在 Phase 9-g-g scope；屬未來 SEO 強化批 |

---

## §11 Cross-links

### 11.1 既有 docs

- `docs/related-links-schema.md` §3 / §9.2（relatedLinks / otherLinks schema + JSON-LD 後續設計位置）
- `docs/phase-9j-jsonld-landing-verification.md` §3 / §4（既有 11 項 JSON-LD landings + Phase 9-g-g deferred 紀錄）
- `docs/phase-1-completion-report.md` §8.1 / §11 順序 4（Phase 9-g-g post-Phase-1 deferred + 啟動順序）
- `docs/seo-ga4-adsense.md` §7.4（BlogPosting schema 規範；本批同步補 Phase 9-g-g 預計欄位）

### 11.2 規範來源

- `CLAUDE.md` §27（Claude Code 修改規則；本批嚴格遵守「docs-only / 不動 source / 不 push」之保守原則）
- `CLAUDE.md` §21（GitHub 站 SEO 必做項目；JSON-LD 已落地，本批為強化）

### 11.3 Phase 9-g 系列既有 landed（per related-links-schema.md §9.1）

`docs/phase-9g-completion-report.md`（Phase 9-g overall 系列收尾報告；本批 9-g-g 為其 deferred 之 9-g-g 子批）

---

（本文件結束）
