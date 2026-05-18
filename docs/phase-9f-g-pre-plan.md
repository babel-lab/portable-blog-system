# Phase 9-f-g Pre-Plan：Book mainEntity JSON-LD 設計

本文件封存 **Phase 9-f-g（BlogPosting JSON-LD `mainEntity` = Book structured data 強化）系列**之 docs-only pre-plan 設計。為**純設計批**；無 source / content / fixtures / dist 變動。

對應之上層紀錄：
- `docs/book-schema.md`（既有 book.* frontmatter schema；含 17 欄位字典 / mediaType 規則 / authors fallback chain）
- `docs/phase-9g-g-completion-report.md`（Phase 9-g-g 既有 isPartOf / mentions 落地；本系列為其延續）
- `docs/phase-9g-g-pre-plan.md`（mirror 本系列之 pre-plan pattern）
- `docs/phase-1-completion-report.md` §8.2（Phase 9-f-g post-Phase-1 deferred）+ §11 順序 5
- `docs/seo-ga4-adsense.md` §7.4 / §7.4.1 / §7.4.2（BlogPosting JSON-LD schema；本批新增 §7.4.2）
- `docs/future-roadmap.md` §8.2 / §8.5 順序 5（Phase 9-f-g 排程）

---

## §1 目標

### 1.1 高階目標

Phase 9-f-g 為 Phase 9-g-g（isPartOf / mentions）系列收尾後之 SEO structured data 進階強化批，目的為**在 BlogPosting JSON-LD 新增 `mainEntity` 欄位指向所評論之 Book 實體**：

1. **BlogPosting JSON-LD 增強**：在既有 12 + isPartOf + mentions（Phase 9-g-g landed）基礎上，新增 `mainEntity` of `@type: Book`
2. **語義精確化**：`mainEntity` 為 schema.org 對 review-style content 之推薦 property（the primary entity described by the CreativeWork）；對 book-review 文章而言，被評書本即 mainEntity
3. **只支援 book-review / mediaType=book**：第一版範圍嚴格；不處理 Periodical / DVD / YouTube / Netflix
4. **Blogger / GitHub 兩端 parity**：mirror Phase 9-g-g / Phase 9-h article block parity precedent
5. **不影響既有 production output**：既有 14 個 BlogPosting 欄位（12 基礎 + isPartOf + mentions）完全保留；本批屬 **additive**

### 1.2 範圍區分

| 範圍 | 屬性 |
|---|---|
| **in-scope** | `mainEntity` field on BlogPosting；只支援 mediaType=`book`；Blogger + GitHub 兩端 mirror |
| **out-of-scope**（per §8）| Periodical / magazine schema（延後至 Phase 9-f-g2）/ DVD / YouTube / Netflix specific @type / library sameAs / @graph 結構 / normalize-post-output / new validate rules / content / fixture / sample update |

### 1.3 推薦方案（per Phase 9-f-g-a §8-§9）

採**方案 B**：`BlogPosting.mainEntity = Book`（語義最精確；Google 廣泛接受；回退成本低）。

---

## §2 基準狀態

### 2.1 Git 狀態

| 項目 | 值 |
|---|---|
| **HEAD** | `741797b docs(phase-9h): sync phase 1 report after json-ld mentions landing` |
| **working tree** | clean |
| **Phase 9-f-g-a** | ✅ read-only pre-analysis 已完成（無 commit；報告型輸出）|

### 2.2 Phase 9-g-g 既有 landed（本系列前序）

| Sub-batch | 狀態 | commit |
|---|---|---|
| Phase 9-g-g-b（pre-plan）| ✅ landed | `f5fb400` |
| Phase 9-g-g-c（isPartOf source）| ✅ landed | `70fbf22` |
| Phase 9-g-g-d（mentions source）| ✅ landed | `1d56f8a` |
| Phase 9-g-g-z（completion report）| ✅ landed | `efed101` |
| Phase 9-h-z（phase-1 report sync）| ✅ landed | `741797b` |
| Phase 9-g-g-rebuild-b（dist rebuild）| ✅ 完成（無 commit material；dist untracked）| — |

### 2.3 Google Rich Results Test 狀態

| 項目 | 狀態 |
|---|---|
| we-media-myself2 Blogger 端 | ✅ 通過 / 或只有非阻擋 warning |
| we-media-myself2 GitHub 端 | ✅ 通過 / 或只有非阻擋 warning |
| github-pages-blog-planning GitHub 端 | ✅ 通過 / 或只有非阻擋 warning |
| portable-blog-system-mvp GitHub 端 | ✅ 通過 / 或只有非阻擋 warning |

✅ **trigger condition 達成**：作者已完成 Rich Results Test；無阻擋性 error；可作為後續 source landing 之前置條件。

### 2.4 Baseline 指標

| 指標 | 數值 |
|---|---|
| `validate:content` baseline | `0 error / 22 warning on 17 post(s)` |
| `build:github` | exit 0 |
| `build:blogger` | exit 0 |
| Real ready book-review posts | 1 篇（we-media-myself2）|
| Real ready magazine posts | 0 篇 |

---

## §3 既有 book metadata 盤點

per `docs/book-schema.md` §4.1 之 17 欄位字典；摘要：

| 欄位 | 型別 | 適用 mediaType | 落地狀態 |
|---|---|---|---|
| `book.mediaType` | enum (`"book"` / `"magazine"`) | — | ✅ schema landed（缺省 `"book"`）|
| `book.title` | string | both | ✅ 既有 |
| `book.titleEn` | string | both | ✅ Phase 9-e landed |
| `book.originalTitle` | string | both | ✅ 既有 |
| `book.author` | string（**legacy**）| both | ⚠️ legacy；fallback chain 起點 |
| `book.authors[]` | array of objects | both | ✅ Phase 9-e landed |
| `book.authors[].displayName` | string | both | ✅ fallback chain 起點 |
| `book.authors[].localName` | string | both | ✅ |
| `book.authors[].originalName` | string | both | ✅ |
| `book.authors[].role` | enum (author/translator/illustrator/editor/other) | both | ✅ Phase 9-e-d-c 已驗證 |
| `book.publisher` | string | both | ✅ 既有 |
| `book.publishedYear` | integer | both | ✅ Phase 9-e landed |
| `book.volume` | integer | book only | ✅ Phase 9-e landed |
| `book.volumeLabel` | string | book only | ✅ Phase 9-e landed |
| `book.issue` | string | magazine only | ✅ Phase 9-e landed（本系列不接）|
| `book.issn` | string | magazine only | ✅ Phase 9-e landed（本系列不接）|
| `book.isbn` | string | book only | ✅ 既有 |
| `book.coverImage` | string | both | ✅ 既有 |
| `book.coverAlt` | string | both | ✅ 既有 |
| `book.showBookPhoto` | boolean | both | ✅ 既有（UI flag；非 JSON-LD）|

### 3.1 既有 production 之 book metadata（we-media-myself2）

| 欄位 | 值 |
|---|---|
| `book.title` | "自媒自創：AI玩轉自媒體的52個商業思維" ✅ |
| `book.mediaType` | "book" ✅ |
| `book.authors[0].displayName` | "鍾婷 anngus" ✅ |
| `book.authors[0].role` | "author" ✅ |
| `book.publisher` | "渠成文化" ✅ |
| `book.showBookPhoto` | false（UI flag）|
| 其他 14 欄位 | 缺；屬 optional |

---

## §4 第一版支援範圍

### 4.1 明確支援項目

| 項目 | 狀態 |
|---|---|
| ✅ **mediaType 缺省或 mediaType = `"book"` 才支援** | book mainEntity 只對 contentKind=book-review + mediaType=book 之 post 觸發 |
| ✅ **BlogPosting.mainEntity = Book** | 兩端 BlogPosting JSON-LD 新增 mainEntity 欄位 |
| ✅ **Book.name 來自 `book.title`** | 必填；pre-filter empty |
| ✅ **Book.author[] 來自 `book.authors[]`** | 採 fallback chain：displayName → localName → originalName → `book.author` legacy；per `book-schema.md` §7 |
| ✅ **Book.publisher 來自 `book.publisher`** | 採 `{@type: Organization, name}` |
| ✅ **Book.datePublished 來自 `book.publishedYear`** | 映射為 `"YYYY"` ISO format string |
| ✅ **Book.isbn 來自 `book.isbn`** | 條件式：非空才出 |
| ✅ **Book.image 來自 `book.coverImage`** | 條件式：非空才出 |
| ✅ **Book.bookEdition 來自 `book.volumeLabel`** | 條件式：非空才出 |

### 4.2 明確不支援項目

| 項目 | 狀態 |
|---|---|
| ❌ **不支援 mediaType = `"magazine"` / Periodical** | 延後至 Phase 9-f-g2（trigger：首篇 ready magazine post）|
| ❌ **不支援 library sameAs** | 圖書館連結維持 mentions[].@type = WebPage（per Phase 9-g-g 既有設計）|
| ❌ **不支援 YouTube specific @type** | 維持 mentions[].@type = WebPage |
| ❌ **不支援 Netflix / DVD specific @type** | 同上 |
| ❌ **不支援 @graph 結構** | 維持單一 BlogPosting JSON-LD（mainEntity nested）|
| ❌ **不支援 author Person.sameAs** | Person 只含 @type + name；不接 sameAs / url |
| ❌ **不支援 publisher Organization.url / address** | Organization 只含 @type + name |
| ❌ **不接入 normalize-post-output** | 直接讀 `post.book.*` 與 Phase 9-g-g pattern 一致 |
| ❌ **不新增 validate rules** | 既有 Phase 9-e-d 6 條規則足以；JSON-LD output 不在 validate scan path |
| ❌ **不修改 fixtures / samples / content** | 屬第二階段；不在本系列範疇 |

---

## §5 JSON-LD mapping table

| schema.org 欄位 | 來源欄位 | 條件 | 輸出型別 | 備註 |
|---|---|---|---|---|
| `mainEntity.@type` | `"Book"`（fixed）| `contentKind === 'book-review'` 且（`book.mediaType === 'book'` 或缺省）| string | mediaType=magazine 時不輸出 mainEntity |
| `mainEntity.name` | `book.title` | non-empty trim | string | 必填；empty 則整個 mainEntity 不輸出 |
| `mainEntity.alternateName` | `[book.titleEn, book.originalTitle]` 之 non-empty 子集 | 至少一個非空才出 | array of string 或 string | 兩個皆空時 key 不出；一個有時可採 string；兩個皆有可採 array |
| `mainEntity.author` | `book.authors[]` 之 fallback chain | array length > 0 | array of `{@type: Person, name}` | name = fallback chain 結果（displayName / localName / originalName / book.author legacy）；per `book-schema.md` §7 |
| `mainEntity.publisher` | `book.publisher` | non-empty trim | `{@type: Organization, name}` | empty 則 key 不出 |
| `mainEntity.datePublished` | `book.publishedYear` | integer + valid | string `"YYYY"` | null 或非 integer 則 key 不出 |
| `mainEntity.isbn` | `book.isbn` | non-empty trim | string | empty 則 key 不出 |
| `mainEntity.image` | `book.coverImage` | non-empty trim + 合法 URL | string | empty 則 key 不出 |
| `mainEntity.bookEdition` | `book.volumeLabel` | non-empty trim | string | empty 則 key 不出 |

### 5.1 spread conditional pattern（per Phase 9-g-g mentions empty-skip pattern）

```js
// pseudo-code; not source code
const bookEntity = buildBookMainEntity(post);  // returns object or null
const seo = {
  ...,
  ...(bookEntity ? { mainEntity: bookEntity } : {}),
};
```

`buildBookMainEntity()` returns null when：
- `post.contentKind !== 'book-review'`，或
- `post.book.mediaType` 不為 `"book"` 且不為缺省，或
- `post.book.title` 為 empty / undefined / non-string

---

## §6 we-media-myself2 live target 分析

### 6.1 角色

- 目前是**唯一 ready book-review live target**（per `docs/phase-9f-g-a` §7.1）
- 可產生最小 Book schema

### 6.2 預期最小輸出

```json
{
  "@type": "BlogPosting",
  /* ... 既有 12 基礎 + isPartOf + mentions ... */
  "mainEntity": {
    "@type": "Book",
    "name": "自媒自創：AI玩轉自媒體的52個商業思維",
    "author": [
      { "@type": "Person", "name": "鍾婷 anngus" }
    ],
    "publisher": { "@type": "Organization", "name": "渠成文化" }
  }
}
```

### 6.3 缺欄位狀態

| 缺欄位 | optional 性質 | 影響 |
|---|---|---|
| `book.isbn` | optional；不阻擋第一版 | ISBN 為 Google 推薦欄位；缺漏可能輕微 warning「為更佳結果建議補 ISBN」；不影響 schema 合法性 |
| `book.coverImage` | optional；不阻擋 | image 缺漏可能輕微 warning；不影響合法性 |
| `book.publishedYear` | optional；不阻擋 | datePublished 缺漏可能輕微 warning；不影響合法性 |
| `book.titleEn` / `book.originalTitle` | optional；不阻擋 | alternateName 不出；無影響 |
| `book.volume` / `book.volumeLabel` | optional；不阻擋 | bookEdition 不出；無影響（非系列書）|

### 6.4 後續補完機制

✅ **作者後續補 frontmatter 欄位，Book schema 自動更完整**：
- 補 `book.isbn` → 下次 build 後 JSON-LD 含 isbn
- 補 `book.coverImage` → 下次 build 後 JSON-LD 含 image
- 補 `book.publishedYear` → 下次 build 後 JSON-LD 含 datePublished
- 屬 conditional / additive 設計；無需修改 source

---

## §7 與 isPartOf / mentions 的關係

三個 BlogPosting 子欄位語義獨立、並存、不衝突：

| 欄位 | schema.org 語義 | 對應內容 |
|---|---|---|
| `isPartOf` | "Indicates the CreativeWork that this CreativeWork is part of" | 文章所屬之 blog / site（Phase 9-g-g-c landed；@type=Blog）|
| `mentions[]` | "Indicates that the CreativeWork contains a reference to, but is not necessarily about" | 文章 body 中提及之外部 / 內部 WebPage（Phase 9-g-g-d landed；@type=WebPage）|
| `mainEntity` | "Indicates the primary entity described in some page or other CreativeWork" | 文章主要論述之 Book 實體（Phase 9-f-g 本系列；@type=Book）|

### 7.1 三者並存範例（we-media-myself2 預期最終輸出）

```json
{
  "@type": "BlogPosting",
  "@id": "...",
  "headline": "...",
  /* 12 基礎欄位 */
  "isPartOf": { "@type": "Blog", ... },
  "mentions": [{ "@type": "WebPage", ... }],
  "mainEntity": { "@type": "Book", ... }
}
```

### 7.2 不衝突理由

- isPartOf 屬「歸屬」維度（the WHERE）
- mentions 屬「引用」維度（the LINKED）
- mainEntity 屬「論述對象」維度（the WHAT）
- 三維度正交；schema.org BlogPosting 同時可有此 3 個 properties

---

## §8 Out of scope / Deferred

本系列**明確不處理**之項目：

| # | 項目 | 處置 |
|---|---|---|
| 1 | **Periodical / magazine schema** | ⏸ deferred to **Phase 9-f-g2**（trigger：首篇 ready magazine post + Rich Results Test 對應驗證）|
| 2 | **DVD / Movie / VideoObject** | ⏸ deferred；mentions[].@type=WebPage 維持（per Phase 9-g-g 既有設計）|
| 3 | **YouTube specific schema（VideoObject）** | ⏸ deferred；同上 |
| 4 | **Netflix specific schema（Movie / TVSeries）** | ⏸ deferred；同上 |
| 5 | **library sameAs / workExample** | ⏸ deferred；圖書館連結維持 mentions[]（per `related-links-schema.md` §3.4）|
| 6 | **@graph 結構** | ⏸ deferred；維持單一 BlogPosting nested mainEntity |
| 7 | **normalize-post-output 接入** | ⏸ deferred；維持直接讀 `post.book.*`（per Phase 9-g-g §9.3 既有原則）|
| 8 | **new validate rules** | ⏸ deferred；既有 Phase 9-e-d 6 條規則足以 |
| 9 | **content / sample / fixture update** | ⏸ deferred；屬第二階段 |
| 10 | **author Person.sameAs / url** | ⏸ deferred；author 只含 @type + name |
| 11 | **publisher Organization.url / address** | ⏸ deferred；publisher 只含 @type + name |
| 12 | **Book.inLanguage** | ⏸ deferred；schema.org 接受不填 |

---

## §9 風險與回退策略

### 9.1 風險表

| # | 風險項 | 風險等級 | 評估 | 緩解策略 |
|---|---|---|---|---|
| 1 | Google Rich Results Test 對 Book schema 嚴格性 | 🟠 中（本系列**核心風險**）| schema.org Book 之 expected 欄位含 name + author（已有）；ISBN / image / datePublished 為 nice-to-have；Google 可能 warning | 起手只 we-media-myself2 live verify；landed 後**強烈建議**作者重做 Rich Results Test；若 Google 拒絕可降級為 about |
| 2 | Book.author Person 缺 sameAs / url | 🟢 低 | Person 為通用 schema base；schema.org 接受最小結構 | 第一版不接 sameAs；可作 future enhancement |
| 3 | Book.publisher Organization 缺 url | 🟢 低 | 同上 | 同上 |
| 4 | mediaType / contentKind 雙層判定可能 false positive / false negative | 🟡 中 | 若 post 之 contentKind=book-review 但 book metadata 不全 → 仍輸出 mainEntity（缺欄位） | filter null book.title 確保至少 name 有 |
| 5 | Blogger / GitHub parity 風險 | 🟢 低 | 採 Phase 9-g-g pattern 之 dual source mirror | 兩端 source 同步修改；live verify 兩端 byte-identical |
| 6 | validate baseline 影響 | 🟢 低 | JSON-LD 構建於 build-*.js；validate-content 不掃 JSON-LD | 預期 baseline `0/22/17` 維持 |
| 7 | dist regression（既有 ready posts JSON-LD 變動）| 🟡 中 | mainEntity 為 additive；既有 14 欄位完全保留；we-media-myself2 之 JSON-LD 將新增 mainEntity；其他 2 篇 GitHub posts（非 book-review）不受影響 | sanity check：byte-identical-modulo-builtAt + JSON keyset diff（mainEntity 為唯一新增 key）|
| 8 | dist/.gitkeep 副作用 | 🟡 中 | vite build 會刪除 .gitkeep（per Phase 8-h-b / 9-g-g-rebuild-b 既有 pattern）| Phase 9-f-g-c / 9-f-g-rebuild 之 batch 含 `git restore dist/.gitkeep` 後續處理 |

### 9.2 回退策略

| 觸發 | 回退動作 |
|---|---|
| Google Rich Results Test 對 mainEntity = Book 出現 blocking error | 降級為 `BlogPosting.about = Book`（per Phase 9-f-g-a Option A；單一 prop name 替換；low-risk）|
| Book schema 對特定欄位（e.g., publisher Organization）出現 warning | 簡化為 string（移除 Organization 包裝）|
| 整個 Book block 出現 schema.org 阻擋 | 移除整個 mainEntity additive block；恢復至 Phase 9-g-g 狀態（14 欄位）|
| 個別欄位（isbn / image / datePublished）出 warning | 屬 nice-to-have warning；不阻擋；不需 rollback |

### 9.3 設計原則

| 原則 | 落實 |
|---|---|
| **additive only** | 既有 14 欄位完全保留；mainEntity 為新增 key |
| **conditional** | empty book / non-book-review post 不輸出 mainEntity（key 不出）|
| **empty-skip** | individual fields（isbn / image / etc.）採 conditional spread；empty 則 key 不出 |
| **no mutate existing fields** | isPartOf / mentions / 12 基礎欄位完全不動 |
| **two-end mirror** | Blogger + GitHub source 同步；單一設計 dual implementation point |

---

## §10 後續子批計畫

| 子批 | 範圍 | 預期 commit 數 | 風險等級 |
|---|---|---|---|
| **Phase 9-f-g-a** | read-only pre-analysis | 0 | 🟢 極低 |
| **Phase 9-f-g-b（本批）** | docs-only pre-plan（本文件 + 同步 book-schema.md §9 / seo-ga4-adsense.md §7.4.2 / future-roadmap.md §8.5 順序 5）| 1 | 🟢 極低 |
| **Phase 9-f-g-c** | source 接入 Book mainEntity（兩端 build-blogger.js + build-github.js mirror）| 1 | 🟠 中（首次 Book schema additive；觸發 vite build → dist/.gitkeep restore；live verify we-media-myself2）|
| **Phase 9-f-g-d** | read-only audit / live verification（mirror Phase 9-g-g-audit pattern；含 Rich Results Test 期前準備）| 0（純分析）| 🟢 極低 |
| **Phase 9-f-g-rebuild**（可選）| `npm run build` 重建 dist + JSON-LD content verify | 0（dist untracked；無 commit material）| 🟢 低 |
| **Phase 9-f-g-z** | completion report + docs sync（mirror Phase 9-g-g-z pattern；新增 `docs/phase-9f-g-completion-report.md`）| 1 | 🟢 低 |
| **Phase 9-h-z2 / Phase 9-f-g-postlanding-sync** | `docs/phase-1-completion-report.md` §8.2 + §11 順序 5 之 landed 狀態同步（mirror Phase 9-h-z pattern）| 1 | 🟢 低 |

**合計**：~4-5 commits（取決於是否啟動 9-f-g-rebuild 為獨立 commit）；含 1 pre-plan + 1 source + 1 completion + 1 post-landing sync。

### 10.1 拆批理由

- **9-f-g-b（本批）docs only 先**：mirror Phase 9-g-g-b 之保守原則；先封存設計再進 source
- **9-f-g-c 單 commit / 不再拆 source**：mainEntity 為單一欄位；不需如 9-g-g 般拆 isPartOf / mentions 兩個 commit
- **9-f-g-d audit 留分析批**：mirror Phase 9-g-g-audit；確保 live verify + Rich Results Test 準備
- **9-f-g-rebuild 可選**：若作者於 9-f-g-c 後立即執行 build 並 manual 驗證，可省略此批

### 10.2 各批 trigger conditions

| 批次 | trigger condition |
|---|---|
| Phase 9-f-g-c | ✅ 本批（9-f-g-b）docs landed；用戶批准進入 source 批 |
| Phase 9-f-g-d | ✅ 9-f-g-c 已 landed |
| Phase 9-f-g-rebuild | ✅ 9-f-g-c 已 landed；dist/.gitkeep handling 需處理 |
| Phase 9-f-g-z | ✅ 9-f-g-c + 9-f-g-d 皆 landed |
| Phase 9-h-z2 | ✅ 9-f-g-z 已 landed |

---

## §11 預期修改檔案

per Phase 9-f-g-a §10 + 本批拆批計畫：

| 分類 | 檔案 | 預期變動 | 落地時機 |
|---|---|---|---|
| **source scripts** | `src/scripts/build-blogger.js`（`buildBloggerJsonLd`）+ `src/scripts/build-github.js`（`buildSeoForPostDetail`）| 兩端各 +25-40 行（mainEntity 構建 + Book entity helper inline）| **Phase 9-f-g-c**（本批**不修改**）|
| **docs（新增）** | `docs/phase-9f-g-pre-plan.md`（本批）+ `docs/phase-9f-g-completion-report.md`（9-f-g-z 時新增）| 本批新增 11 sections；9-f-g-z 時新增 10 sections | 本批 / 9-f-g-z |
| **docs（同步）** | `docs/book-schema.md`（§9 future-extension row 拆清楚 Book mainEntity Phase 9-f-g planned / Periodical Phase 9-f-g2 deferred）+ `docs/seo-ga4-adsense.md`（新增 §7.4.2 Phase 9-f-g 預計欄位）+ `docs/future-roadmap.md`（§8.5 順序 5 小幅補充 Book first / Periodical 延後）+ `docs/phase-1-completion-report.md`（§8.2 + §11 順序 5；9-f-g-z 或 9-h-z2 時）| 本批小幅同步；9-f-g-z 時補完整 landed 狀態 | 本批 / 9-f-g-z / 9-h-z2 |
| **content / sample / fixture** | ❌ **不動**（per §8 deferred）| — | 屬第二階段 |
| **validate** | ❌ **不動**（per §8 deferred）| — | — |
| **dist** | dist/posts/*/index.html + dist-blogger/posts/*/post.html 之 we-media-myself2 將新增 mainEntity；其他 GitHub-only posts 不受影響（contentKind != book-review）| 屬 Phase 9-f-g-c 之 vite build 副作用；untracked；不入 git | Phase 9-f-g-c / 9-f-g-rebuild |

---

（本文件結束）
