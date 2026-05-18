# Phase 9-f-g Completion Report：Book mainEntity JSON-LD 系列收尾

本文件封存 **Phase 9-f-g（BlogPosting JSON-LD `mainEntity` = Book structured data 強化）系列**之完整 completion 紀錄。Phase 9-f-g 為 Phase 9-g-g（isPartOf / mentions）系列收尾後之 SEO structured data 進階強化批，目的為**在 BlogPosting JSON-LD 新增 `mainEntity` 欄位指向所評論之 Book 實體**，並保持 Blogger / GitHub 兩端 parity。

對應之上層紀錄：
- `docs/phase-9f-g-pre-plan.md`（Phase 9-f-g-b docs-only pre-plan；commit `10df61c`）
- `docs/book-schema.md`（既有 book.* frontmatter schema；本批同步 §9 Book mainEntity row 之 landed 狀態）
- `docs/seo-ga4-adsense.md` §7.4.2（Phase 9-f-g 預計新增欄位；本批同步 planned → landed）
- `docs/future-roadmap.md` §8.5 順序 5（Phase 9-f-g 排程；本批同步 landed 狀態）
- `docs/phase-9g-g-completion-report.md`（Phase 9-g-g 既有 isPartOf / mentions 落地；本系列為其延續）

---

## §1 目標與結論

### 1.1 Phase 9-f-g 目標

在 BlogPosting JSON-LD 中**條件式新增 `mainEntity = Book`**：

1. **BlogPosting JSON-LD 增強**：在既有 12 + isPartOf + mentions（Phase 9-g-g landed）基礎上，新增 `mainEntity` of `@type: Book`
2. **語義精確化**：`mainEntity` 為 schema.org 對 review-style content 之推薦 property（the primary entity described by the CreativeWork）
3. **只支援 book-review / mediaType=book**：第一版範圍嚴格
4. **Blogger / GitHub 兩端 parity**：mirror Phase 9-g-g / Phase 9-h article block parity precedent
5. **不影響既有 production output**：既有 14 個 BlogPosting 欄位完全保留；本批屬 **additive**

### 1.2 結論

✅ **Book mainEntity 第一版已 landed**（commit `b394e4f`）。

| 邊界 | 狀態 |
|---|---|
| 第一版只支援 `mediaType="book"` | ✅ |
| Periodical / magazine 延後 **Phase 9-f-g2** | ✅ deferred |
| 不接 DVD / YouTube / Netflix specific schema | ✅ deferred；維持 mentions[].@type = WebPage |
| 不接 library sameAs | ✅ deferred |
| 不接 @graph | ✅ deferred |
| 不接 normalize-post-output | ✅ deferred |
| 不新增 validate rules | ✅ deferred |
| 不修改 content / fixtures / samples | ✅ deferred |

---

## §2 基準狀態

### 2.1 Git 狀態

| 項目 | 值 |
|---|---|
| **起始 HEAD**（Phase 9-f-g 系列啟動時）| `10df61c docs(phase-9f-g): add book mainEntity structured data pre-plan`（Phase 9-f-g-b landed 後）|
| **source landing commit** | `b394e4f refactor(seo): add Book mainEntity to BlogPosting JSON-LD`（Phase 9-f-g-c）|
| **working tree** | clean |
| **remote** | 未設定 |
| **push** | 未 push |

### 2.2 Phase 9-f-g 子批進度

| Sub-batch | 狀態 |
|---|---|
| Phase 9-f-g-a（read-only pre-analysis）| ✅ completed（無 commit；報告型輸出）|
| Phase 9-f-g-b（docs-only pre-plan）| ✅ landed（commit `10df61c`）|
| Phase 9-f-g-c（source 接入 Book mainEntity）| ✅ landed（commit `b394e4f`）|
| Phase 9-f-g-d（read-only audit / live verification）| ✅ completed（無 commit；audit 全綠）|
| **Phase 9-f-g-z**（本批；completion report + docs sync）| 🔄 本批進行中 |

### 2.3 Baseline 指標

| 指標 | 數值 |
|---|---|
| `validate:content` baseline | `0 error / 22 warning on 17 post(s)`（per Phase 9-f-g-c build 自動 validation）|
| `build:github` | exit 0（per 9-f-g-c；prebuild 132ms + vite 506ms）|
| `build:blogger` | exit 0（per 9-f-g-c；73ms）|
| `dist/.gitkeep` | ✅ 保留（0 bytes / mtime 2026-05-18 17:06）|

---

## §3 子批次完成表

| 子批次 | 範圍 | 狀態 | commit |
|---|---|---|---|
| **Phase 9-f-g-a** | read-only pre-analysis（feasibility 盤點 + 最小實作方案）| ✅ completed | — |
| **Phase 9-f-g-b** | docs-only pre-plan（新增 `docs/phase-9f-g-pre-plan.md` + 同步 book-schema §9 / seo-ga4-adsense §7.4.2 / future-roadmap §8.5 順序 5）| ✅ landed | `10df61c` |
| **Phase 9-f-g-c** | source 接入 Book mainEntity（兩端 `src/scripts/build-blogger.js` + `src/scripts/build-github.js` mirror；新增 `buildBookMainEntity()` helper）| ✅ landed | `b394e4f` |
| **Phase 9-f-g-d** | read-only audit / live verification（含 Rich Results Test 期前準備）| ✅ completed | — |
| **Phase 9-f-g-z**（本批）| completion report + docs sync（mirror Phase 9-g-g-z pattern）| 🔄 本批 | 本批 |

**合計**：1 pre-plan commit + 1 source commit + 1 completion report commit（本批）= **3 commits**（不含 9-f-g-a / 9-f-g-d 純分析）

---

## §4 Source landing 摘要

（Phase 9-f-g-c；commit `b394e4f`）

### 4.1 修改檔案

| 端 | 檔案 | 變動 |
|---|---|---|
| **Blogger** | `src/scripts/build-blogger.js` | +54 行（新增 helper + 接入點）|
| **GitHub** | `src/scripts/build-github.js` | +53 行（mirror）|

**合計**：2 files / +107 insertions / 0 deletions。

### 4.2 新增 `buildBookMainEntity(post)` helper

- **兩端 mirror**：兩個 source files 各自 inline；helper body byte-identical
- **觸發條件**（三層 guard）：
  1. `post.book` 必須存在且為 object（非 null / 非 array）
  2. `book.mediaType` 缺省或 === `"book"`（"magazine" 等其他值 → 拒絕）
  3. `book.title` 必須是非空 string（trim 後仍非空）
- **不符合條件時 return null**
- **JSON-LD 不輸出 mainEntity key**（spread conditional empty-skip：`...(bookMainEntity ? { mainEntity: bookMainEntity } : {})`）

### 4.3 接入點

```js
// 兩端共用 pattern（build-blogger.js / build-github.js）
const bookMainEntity = buildBookMainEntity(post);
const jsonLd = {
  /* ... 既有 14 欄位（12 基礎 + isPartOf + 條件式 mentions）... */
  ...(mentionsItems.length > 0 ? { mentions: mentionsItems } : {}),
  ...(bookMainEntity ? { mainEntity: bookMainEntity } : {}),
};
```

- mainEntity 放於 mentions 後（最小 diff；既有欄位順序完全保留）
- 既有 isPartOf / mentions / 12 基礎欄位完全不動

---

## §5 Book mapping 摘要

per Phase 9-f-g-b pre-plan §5 + Phase 9-f-g-c source landing：

| schema.org 欄位 | 來源欄位 | 條件 | 輸出型別 |
|---|---|---|---|
| `@type` | `"Book"`（fixed）| 永遠 | string |
| `name` | `book.title` | 必填；empty 則整個 mainEntity 不出 | string |
| `alternateName` | `[book.titleEn, book.originalTitle]` filter non-empty | 0→省略；1→string；2→array | string \| array |
| `author` | `book.authors[]`（role 缺省或 `"author"`）→ fallback chain name `displayName→localName→originalName`；若 0 個有效則 fallback `book.author` legacy | non-empty 才出 | array of `{@type: Person, name}` |
| `publisher` | `book.publisher` | non-empty 才出 | `{@type: Organization, name}` |
| `datePublished` | `book.publishedYear` | number + Finite + integer + 1000-9999 | string `"YYYY"` |
| `isbn` | `book.isbn` | non-empty trim | string |
| `image` | `book.coverImage` | non-empty trim | string |
| `bookEdition` | `book.volumeLabel` | non-empty trim | string |

---

## §6 Live verification 摘要

per Phase 9-f-g-d audit；3 ready posts + 5 dist outputs 全 fresh：

### 6.1 we-media-myself2（mainEntity Book live target）

#### Blogger 端（`dist-blogger/posts/we-media-myself2/post.html`）

```json
{
  "@type": "BlogPosting",
  /* 12 基礎欄位 */
  "isPartOf": { "@type": "Blog", "@id": "https://babel-lab.blogspot.com/", ... },
  "mentions": [{ "@type": "WebPage", "name": "貝果書屋-AI玩轉自媒體的52個商業思維", "url": "..." }],
  "mainEntity": {
    "@type": "Book",
    "name": "自媒自創：AI玩轉自媒體的52個商業思維",
    "author": [{ "@type": "Person", "name": "鍾婷 anngus" }],
    "publisher": { "@type": "Organization", "name": "渠成文化" }
  },
  "image": "..."
}
```

| 預期 | 實際 |
|---|---|
| BlogPosting + isPartOf + mentions[1] + mainEntity Book | ✅ |
| mainEntity.@type = Book | ✅ |
| mainEntity.name = 自媒自創：AI玩轉自媒體的52個商業思維 | ✅ |
| mainEntity.author[0] = `{@type: Person, name: 鍾婷 anngus}` | ✅ |
| mainEntity.publisher = `{@type: Organization, name: 渠成文化}` | ✅ |
| 不輸出 undefined / null / 空陣列 | ✅（缺欄位 alternateName / datePublished / isbn / image / bookEdition 完全不出 key）|

#### GitHub 端（`dist/posts/we-media-myself2/index.html`）

✅ **與 Blogger 端 byte-identical mirror**（cross-source mirror；JSON-LD 內容完全相同）。

### 6.2 github-pages-blog-planning（empty case）

`dist/posts/github-pages-blog-planning/index.html`：

| 預期 | 實際 |
|---|---|
| 不含 mainEntity | ✅（無 `"@type":"Book"` 字串；無 mainEntity key）|
| 保留 isPartOf（@type=Blog, @id=github.io/）| ✅ |
| 仍無 mentions key | ✅ |

### 6.3 portable-blog-system-mvp（empty case）

`dist/posts/portable-blog-system-mvp/index.html`：

| 預期 | 實際 |
|---|---|
| 不含 mainEntity | ✅ |
| 保留 isPartOf | ✅ |
| 仍無 mentions key | ✅ |

### 6.4 dist freshness

| 檔案 | mtime |
|---|---|
| `dist/posts/we-media-myself2/index.html` | `May 18 17:05` ✅ FRESH |
| `dist/posts/github-pages-blog-planning/index.html` | `May 18 17:05` ✅ FRESH |
| `dist/posts/portable-blog-system-mvp/index.html` | `May 18 17:05` ✅ FRESH |
| `dist-blogger/posts/we-media-myself2/post.html` | `May 18 17:06` ✅ FRESH |
| `dist/.gitkeep` | `May 18 17:06` / 0 bytes ✅ 保留 |

**無 stale dist 風險**；5 個 dist outputs 全與 source（HEAD `b394e4f`）一致。

---

## §7 風險與 deferred

### 7.1 已識別風險（per Phase 9-f-g-d audit §11）

| 風險 | 等級 | 緩解 |
|---|---|---|
| Book 缺 `isbn` / `image` / `datePublished` 可能 nice-to-have warning | 🟡 不阻擋 | 作者後續補 `book.isbn` / `book.coverImage` / `book.publishedYear` frontmatter；自動生效 |
| helper 不檢查 `contentKind`，僅靠 book metadata gate | 🟡 目前可接受 | 當前 ready posts 無 false-positive；未來如需更嚴格 gate 可加 contentKind 檢查 |

### 7.2 Deferred items

| # | 項目 | 觸發條件 |
|---|---|---|
| 1 | **Periodical / magazine schema** | ⏸ deferred to **Phase 9-f-g2**（trigger：首篇 ready magazine post + Rich Results Test 對應驗證）|
| 2 | **library sameAs / workExample** | ⏸ deferred；圖書館連結維持 mentions[]（per `related-links-schema.md` §3.4）|
| 3 | **@graph 結構** | ⏸ deferred；維持單一 BlogPosting nested mainEntity |
| 4 | **author Person.sameAs / url / honorific** | ⏸ deferred；Person 只含 @type + name |
| 5 | **publisher Organization.url / address** | ⏸ deferred；Organization 只含 @type + name |
| 6 | **validate rules**（mainEntity 之 frontmatter-level checks）| ⏸ deferred；JSON-LD output 不在 validate scan path；既有 Phase 9-e-d 6 條規則足以 |
| 7 | **DVD / YouTube / Netflix specific schema** | ⏸ deferred；維持 mentions[].@type = WebPage |
| 8 | **normalize-post-output 接入** | ⏸ deferred；維持直接讀 `post.book.*` |
| 9 | **book.publishedDate 完整日期** | ⏸ deferred；當前只有 publishedYear integer（per `book-schema.md` §9）|
| 10 | **content / sample / fixture update** | ⏸ deferred；屬第二階段 |

---

## §8 Google Rich Results Test 作者 SOP

❌ **Claude 未執行** Google Rich Results Test（屬作者 SOP；非 Claude 範疇）。

### 8.1 作者應手動測試清單（4 項）

| # | 測試對象 | URL / Test Code | 測試目的 |
|---|---|---|---|
| 1 | **we-media-myself2 Blogger 端** | https://babel-lab.blogspot.com/2026/05/we-media-myself2.html | mainEntity Book populated case + isPartOf + mentions coexist |
| 2 | **we-media-myself2 GitHub 端** | https://babel-lab.github.io/posts/we-media-myself2/（或 Test Code 貼 `dist/posts/we-media-myself2/index.html`）| cross-source mirror parity |
| 3 | **github-pages-blog-planning GitHub 端** | https://babel-lab.github.io/posts/github-pages-blog-planning/（或 Test Code）| non-book empty case；isPartOf only |
| 4 | **portable-blog-system-mvp GitHub 端** | https://babel-lab.github.io/posts/portable-blog-system-mvp/（或 Test Code）| no mainEntity false positive case |

### 8.2 觀察重點

| 重點 | 緩解 |
|---|---|
| mainEntity Book 是否被 Google 接受 | 預期接受（schema.org 標準；Google 廣泛支援 review-style content）|
| Book 缺 isbn / image / datePublished 可能 nice-to-have warning | 不阻擋；作者後續補 frontmatter |
| mentions / isPartOf 是否仍通過 | 預期接受（Phase 9-g-g 期間已通過）|

### 8.3 結果分支處置

| 結果 | 處置 |
|---|---|
| ✅ 全綠 / 只有 nice-to-have warning | 維持 Phase 9-f-g-c source as-is；不需動 source |
| ❌ blocking error | 啟動 **Phase 9-f-g-fix-a**（read-only / docs-only；不直接 source fix；先確認 Google 訊息再評估方向）|

---

## §9 後續建議

| 順序 | 任務 | 性質 | trigger condition |
|---|---|---|---|
| 1 | **作者執行 Google Rich Results Test**（per §8.1 4 項）| 作者 SOP；~30 分鐘 | ✅ 已滿足；可隨時執行 |
| 2 | **Phase 9-h-z2 / postlanding sync**：`docs/phase-1-completion-report.md` §8.2 + §11 順序 5 之 landed 狀態同步（mirror Phase 9-h-z pattern）| docs only；~20-30 分鐘 | ✅ 本批 9-f-g-z landed 後 |
| 3 | **Phase 9-f-g2**：Periodical / magazine structured data | source；🟡 中風險 | ⏸ 首篇 ready magazine post + Rich Results Test 驗證 |
| 4 | **Phase 9-g-g-e**：related-links validate 輕量規則 + fixture / sample 補強 | source + fixtures；🟡 中風險 | ⏸ 等作者實際使用情況觀察 |
| 5 | **Phase 9-h-f**：Related Posts auto block | source；🟡 中風險 | ⏸ 作者 ≥ 5 篇 ready post（當前 3 篇）|
| 6 | **publish-workflow.md §6 / §7 deferred docs cleanup**（Phase 7-b / 7-c 陳年 TODO）| docs only；🟢 低 | 任一時段獨立批次 |

---

## §10 Cross-links

### 10.1 既有 docs

- `docs/phase-9f-g-pre-plan.md`（Phase 9-f-g-b 之 pre-plan；本批之上游；commit `10df61c`；11 sections）
- `docs/book-schema.md`（既有 book.* schema；本批同步 §9 Book mainEntity row 之 landed 狀態）
- `docs/seo-ga4-adsense.md` §7.4 / §7.4.1 / §7.4.2（BlogPosting JSON-LD schema；本批同步 §7.4.2 planned → landed）
- `docs/future-roadmap.md` §8.5 順序 5（Phase 9-f-g 排程；本批同步 landed）
- `docs/phase-9g-g-completion-report.md`（Phase 9-g-g isPartOf / mentions 既有 landed；本系列為其延續）
- `docs/phase-9j-jsonld-landing-verification.md`（既有 JSON-LD 落地紀錄）

### 10.2 規範來源

- `CLAUDE.md` §21（GitHub 站 SEO 必做項目；JSON-LD 已落地，本批為強化）
- `CLAUDE.md` §27（Claude Code 修改規則；本批嚴格遵守「docs-only / 不動 source / 不 push」之保守原則）

### 10.3 系列之間的關係

- **Phase 9-g-g 系列**（BlogPosting JSON-LD isPartOf / mentions）：✅ 已 landed（per `docs/phase-9g-g-completion-report.md`）
- **Phase 9-f-g 系列**（本系列；BlogPosting JSON-LD mainEntity Book）：✅ 本批收尾完成
- **Phase 9-f-g2 系列**（Periodical / magazine structured data）：⏸ 未啟動；trigger 未滿足
- **Phase 9-h-f 系列**（Related Posts auto block）：⏸ 未啟動；trigger 未滿足

---

（本文件結束）
