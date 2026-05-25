# 2026-05-25 Book Review Ready Checklist

> Phase: `20260525-pm-ready-checklist-doc-a`
> 模式：docs-only（純 checklist 落地；不修改任何 content / sidecar / src / settings）
> 對象：`content/blogger/posts/20260525-draft-book-review.{md, publish.json, fb.md}`
> 來源：`docs/20260525-pm-sidecar-checkpoint-report.md` + `docs/publish-bundle.md` + `docs/publish-json-schema.md` + `docs/fb-sidecar-schema.md` + `docs/series-schema.md` + 既有正式範例 `20260515-we-media-myself2.{md, publish.json, fb.md}`

---

## §1 文件目的

### 1.1 用途

本文件用途：記錄 `20260525-draft-book-review` 從 draft 升 ready / published 前需要補齊的事項。

便於：

- 日後補正式書評內容、FB 文案、publish metadata 時逐項對照
- 手動發 Blogger 後的 publishedUrl / publishedAt / bloggerPostId 回填
- FB 實際發文後之 fbPostUrl / fbPostedAt 回填
- 避免漏掉 SEO / hashtag / UTM / Blogger 後台所需欄位

### 1.2 適用三檔

```
content/blogger/posts/20260525-draft-book-review.md
content/blogger/posts/20260525-draft-book-review.publish.json
content/blogger/posts/20260525-draft-book-review.fb.md
```

### 1.3 不適用

- 本檔**不是**正式書評內容草稿，亦**不是**檔案編輯指示
- 本檔**不**代表文章已 ready
- 本檔**不**觸發任何 build / deploy
- 本檔僅記錄「升 ready 前必補項目 + 升 published 後必回填項目」

---

## §2 Current baseline

| 項目 | 值 |
|------|---|
| HEAD（本檔 commit 前）| `afcf6fcd094967bd247d498a585892b6aa23dfa9`（short `afcf6fc`）|
| origin/main（本檔 commit 前）| `afcf6fcd094967bd247d498a585892b6aa23dfa9` |
| ahead / behind | 0 / 0 |
| working tree | clean |
| 三檔組合 | ✅ 已存在（per `docs/20260525-pm-sidecar-checkpoint-report.md` §4.3）|
| validate baseline | `0 error(s) / 39 warning(s) on 34 post(s)`（與 `b409580` byte-identical；per `docs/20260525-pm-sidecar-checkpoint-report.md` §5）|
| build smoke | ✅ 5 scripts 全 passed（validate / build / build:github / build:blogger / build:promotion）|
| draft 文章 production 影響 | ❌ 無（draft 未進 dist / dist-blogger / dist-promotion；enabled:false `.fb.md` 未進 promotion output）|

---

## §3 Article content checklist（`.md`）

| # | 欄位 | 現況 | 升 ready 前要做什麼 | 嚴重度 |
|---|---|---|---|---|
| A1 | `title` | `待填書評文章`（placeholder）| **必補正式書名 / 文章標題**；可加 series prefix（例 `[貝果書屋] 《書名》#N(副標)`）| 🔴 blocking SEO / Blogger 後台貼用 |
| A2 | `titleEn` | `Draft Book Review`（placeholder）| 可補英文書名或留空（既有 `we-media-myself2` 亦為空）| 🟢 optional |
| A3 | `description` | `""` | **必補**；建議中英混合 SEO 文案（同 `we-media-myself2` 模式）| 🔴 blocking SEO |
| A4 | `searchDescription` | `""` | **必補**；通常等於 `description`；Blogger 後台「搜尋說明」欄使用 | 🔴 blocking Blogger 搜尋說明 |
| A5 | `cover` | `""` | **必補或明確決定不放**；先把圖片上傳至 Blogger / Google Drive，拿 CDN URL | 🔴 blocking SEO + OG + Blogger 顯示 |
| A6 | `coverAlt` | `""` | **必補**（若 A5 補則 A6 必補）；描述性 alt（與 cover 對應） | 🟡 a11y + SEO |
| A7 | 正文 body | 3 段 TODO（簡介 / 心得 / 建議）| **必補正式書評**；可包含金句、漫畫圖片、書籍資料區塊（per `we-media-myself2` 結構） | 🔴 blocking 文章本體 |
| A8 | `book.title` / `book.authors` / `book.publisher` | 全空 | **必補**（per `docs/book-schema.md`；至少 `title` / `authors[].displayName` / `publisher`） | 🔴 blocking 書評 metadata + JSON-LD |
| A9 | `book.mediaType` | 未顯式設（schema 預設 `book`）| **建議顯式填** `"book"`（避免 `book-issn-without-magazine-mediatype` 等 warning）| 🟡 warning |
| A10 | `book.isbn` / `publishedYear` / `volume` | 空 / null | 可選；若要進 JSON-LD 結構化資料則建議補 | 🟢 optional |
| A11 | `book.coverImage` / `coverAlt` / `showBookPhoto` | 空 / true | 若要顯示書本照片，補圖；否則 `showBookPhoto: false`（render 階段 skip）| 🟢 optional |
| A12 | `tags` | `["book"]`（過於泛）| **必補齊**（per `we-media-myself2`：`["book-review", "reading-notes", ...]`）；**每個 tag 必須存在於 `content/settings/tags.json`** | 🟡 warning（missing-tag 會 build 但顯眼）|
| A13 | `category` | `"book-review"` | 已正確 ✅ | — |
| A14 | `status` | `"draft"` | **必改** `"ready"` | 🔴 blocking 升 ready |
| A15 | `draft` | `true` | **必改** `false` | 🔴 blocking 升 ready |
| A16 | `affiliate.enabled` | `true` 但 `links: []` | **必決策**：(a) 補 `links[]`（label / network / url）；(b) 改 `enabled: false`（per `CLAUDE.md` §12：`enabled: true` 但 links 空 build 會 warning） | 🟡 decision |
| A17 | `affiliate.disclosure` | 已預填 | 已正確 ✅ | — |
| A18 | `affiliate.position.top` / `bottom` | `true` / `true` | 若 A16 改 `enabled: false`，建議同步改 `top/bottom: false`（與 `we-media-myself2` dormant pattern 一致）| 🟢 consistency |
| A19 | `relatedLinks` | `[]` | 可選；若有同系列前作或相關文章，補 internal cross-link（per `docs/related-links-schema.md`；internal 不加 UTM；external 自動套 `target="_blank" rel`）| 🟢 optional |
| A20 | `otherLinks` | `[]` | 可選 | 🟢 optional |
| A21 | `publishTargets.blogger` | `enabled: true, mode: "full"` | 已正確 ✅ | — |
| A22 | `publishTargets.github` | `enabled: false` | **需決策**：(a) 只發 Blogger 保留 `false`；(b) 若要 cross-post 改 `true`（並同步處理 §4 之 github status / slug / path）| 🟡 decision |
| A23 | `series` block | 未設 | **需決策**：若加入「貝果書屋」之類系列，補 `series.id` / `name` / `number`（per `docs/series-schema.md`）；非系列文不需 | 🟢 optional |
| A24 | `blocks.*`（toc / ads / hashtags / socialFollow / relatedPosts / sidebar）| 預設值 | 已正確 ✅ | — |

---

## §4 Publish sidecar checklist（`.publish.json`）

| # | 欄位 | 現況 | 補的時機與條件 | 嚴重度 |
|---|---|---|---|---|
| P1 | `schemaVersion` | `1` | 已正確 ✅ | — |
| P2 | `canonical.source` | `"auto"` | ready 階段**可保留** `"auto"`；published 後必須為列舉值之一（per publish-json-schema §8.3）；若雙站發改 `"blogger"` 或 `"github"`；單站發 Blogger 可保 `"auto"` 由系統依 `primaryPlatform` 推導 | 🟡 |
| P3 | `canonical.url` | `""` | published 後可由系統 fallback 推導；單站發且 `canonical.source ≠ manual` 時可不填 | 🟢 |
| P4 | `ogImage.url` / `alt` | 空 | 若要 OG 圖獨立於 `.md cover`，補；否則 fallback 至 frontmatter `cover` / `coverAlt` | 🟢 optional |
| P5 | `blogger.type` | `"post"` | 已正確（書評屬 Blogger 文章區）✅ | — |
| P6 | `blogger.permalink` | `""` | **ready 階段必補**（per publish-json-schema §8.2）；建議用 `.md slug "draft-book-review"` 或更語義之 slug；Blogger 後台「自訂網址」欄位貼用 | 🔴 ready blocking |
| P7 | `blogger.status` | `"draft"` | **ready 前改** `"ready"`；published 後改 `"published"` | 🔴 ready blocking |
| P8 | `blogger.publishedUrl` | `""` | **不得發布前預測**（per publish-json-schema §5.3 唯一真相規則）；published 後從 Blogger 文章 URL 回填（`https://{blogspot}/{yyyy}/{mm}/{permalink}.html`）| 🔴 published blocking |
| P9 | `blogger.publishedAt` | `""` | published 後填 ISO 8601 字串（例 `2026-05-26T10:00:00+08:00`）| 🔴 published blocking |
| P10 | `blogger.publishYear` / `publishMonth` | 空 | **僅由 `publishedAt` 推導**；published 後填 `"2026"` / `"05"`（per §5.4：不得由 `.md date` 或 `permalink` 反推）| 🟡 warning（不一致時）|
| P11 | `blogger.bloggerPostId` | `""` | published 後從 Blogger 後台 URL 拿 `postID=...` 回填 | 🟢 optional |
| P12 | `blogger.history` | `[]` | 若不是搬家，留空 | 🟢 |
| P13 | `github.status` | `"draft"` | 若 A22 = `false`（只發 Blogger）**留** `"draft"`；若 cross-post，ready 階段升 `"ready"` + 補 P14 | 🟡 conditional |
| P14 | `github.slug` / `path` / `publishedUrl` / `publishedAt` | 空 | 若 A22 = `false` 不必補；若 A22 = `true`，per §8.2 ready 階段 `slug` 必補；published 階段三者皆必補 | 🔴/🟢 conditional |
| P15 | `seo.metaTitle` / `metaDescription` | 空 | 留空 = fallback 至 `.md title` / `description`；若要 SEO override 才填 | 🟢 optional |
| P16 | `seo.robots` | `"index,follow"` | ready / published **建議維持** `"index,follow"`（公開索引）；若仍想測試可暫設 `"noindex,follow"` | 🟢 advisory |

---

## §5 FB sidecar checklist（`.fb.md`）

| # | 欄位 | 現況 | 升 ready 前要做什麼 | 嚴重度 |
|---|---|---|---|---|
| F1 | `enabled` | `false` | **ready 前改** `true`（per `docs/publish-bundle.md` §4.1 / fb-sidecar-schema §6.1：ready/published 階段 FB 文案缺漏 = error；缺漏定義 = 檔案不存在 OR `enabled: false`） | 🔴 ready blocking |
| F2 | `title` | `"[貝果書屋] 待填書評文章"` | **改正式 FB title**；建議與 Blogger article title 開頭一致（per fb-sidecar-schema §3.4 / series-schema §6）；可保留 `[貝果書屋]` 類 prefix | 🔴 blocking FB 顯示 |
| F3 | `titleEn` | `"Draft Book Review"` | 可保留 placeholder 或補正式英文；**保留欄位**（FB 端目前不顯示但 schema 保留供未來；per fb-sidecar-schema §3.4） | 🟢 optional |
| F4 | body | 6 行 TODO + `{{ articleUrl }}` | **必補正式 FB 文案**：開場吸引文 + 補充說明 + `👇 完整文章：{{ articleUrl }}`；**保留 `{{ articleUrl }}` placeholder，不要寫死 URL** | 🔴 ready blocking（per §7.1：ready/published body 空或 placeholder 未解析 = error）|
| F5 | `hashtags` | `[]` | **建議補在 `.fb.md`**（per series-schema §19 fallback chain：`.fb.md hashtags` > legacy frontmatter > `series.hashtags` > `tags`）；本 draft 三層皆空 → 必直接補在 `.fb.md` | 🟡 advisory（不會 block，但 FB 推廣效果差） |
| F6 | `page` | `"fan1"` | 已正確（`promotion.config.json` `pages.fan1.enabled: true` ✅）| — |
| F7 | `target` | `"auto"` | 已正確（per §5.5：依 `primaryPlatform: blogger` 推導 → 取 `blogger.publishedUrl`）；published 後 placeholder 自動解析 | — |
| F8 | `customUrl` | `""` | **不要手動寫死**（target 非 custom）；除非有特別覆寫需求才填 | 🟢 do-not-touch |
| F9 | `finalUrl` | `""` | **不要手動寫死**（per §3.5.1）；URL 由 `{{ articleUrl }}` 動態解析；除非要手動覆寫推導結果才填 | 🟢 do-not-touch |
| F10 | `fbPostUrl` / `fbPostedAt` / `fbPostId` | 未在本檔出現 | **published + 實際發 FB 後**可手動回填（per §3.5.3 第一階段 read-only；不接 FB API）| 🟢 published-time backfill |
| F11 | `fbCampaign` | 未在本檔出現 | 可選；**人工分類標記**（非 UTM campaign）；per §3.5.1 | 🟢 optional |
| F12 | UTM 參數 | 不在 frontmatter / body | **不得寫死**（per §8.3）；維持由 `promotion.config.json.facebook.utm` + build 階段動態組裝（`source=facebook` / `medium=social` / `campaign=fan1_post` / `content={slug}`） | 🔴 do-not-touch |
| F13 | `note` | 已預填 | 升 ready 時可更新為 phase / 排程備忘 | 🟢 optional |

---

## §6 Output / build checklist

升 ready / published 前後要跑的 scripts 與預期 output：

| 階段 | 條件 | 應跑 script | 應出現 output |
|------|------|------------|---------------|
| **a. 升 ready 前 schema 檢查** | `.md` / `.publish.json` / `.fb.md` 內容已補完 | `npm run validate:content` | `0 error` 必達；warning 自評 |
| **b. ready 階段** | `.md status: ready` + `blogger.status: ready` + `.fb.md enabled: true` | `npm run build:blogger`（產 copy-helper + checklist + meta）；`npm run build:promotion`（產 FB txt）| `dist-blogger/posts/{slug}/{post.html, copy-helper.txt, meta.json, publish-checklist.txt}`；`dist-promotion/facebook/blogger/{slug}.txt` |
| **c. 若 cross-post GitHub** | A22 = `true` + `github.status: ready` | `npm run build`（GitHub 站 + sitemap）| `dist/posts/{slug}/index.html` + `dist/sitemap.xml` 增 entry |
| **d. Blogger 後台手動發布** | 使用 b 階段產出的 copy-helper / publish-checklist | （無 npm script；純手動）| Blogger 線上 URL + bloggerPostId |
| **e. 回填 published metadata** | Blogger 發布完成 | 手動編輯 `.publish.json`（或 `npm run backfill:url`）| `.publish.json` 更新 `blogger.{status:published, publishedUrl, publishedAt, publishYear, publishMonth, bloggerPostId}` |
| **f. FB 後台手動發文** | b 階段產出的 FB txt | （無 npm script；手動貼 FB）| FB 線上貼文 URL |
| **g. 回填 fbPostUrl** | FB 發布完成 | 手動編輯 `.fb.md` | `.fb.md` 更新 `fbPostUrl` / `fbPostedAt` |
| **h. 全鏈再驗** | 全 metadata 補完 | `npm run validate:content` + `npm run build:blogger` + `npm run build:promotion` + 視需要 `npm run build` | baseline 不退化；`fb-post-url-missing` warning 消失（per fb-sidecar-schema §3.5.5 P3）|

### 6.1 Draft / 過濾原則（不應出現之 production output）

- `.md status: draft` + `draft: true` → 不應進 `dist/` / `dist-blogger/` / `dist-promotion/`（已於 `docs/20260525-pm-sidecar-checkpoint-report.md` §6 驗證）
- `.fb.md enabled: false` → 不應進 `dist-promotion/facebook/`（已於同檔 §6 驗證）
- draft 階段跑 build 應看到 filter 訊息明確列出 `20260525-draft-book-review.{md, fb.md}` 被過濾

---

## §7 Risk notes

### 7.1 Blocking items（會擋 build / validate error）

| 來源 | 條件 | 規則 |
|------|------|------|
| `.publish.json` | `canonical.source` 不在列舉 | publish-json-schema §9.3 → error |
| `.publish.json` | `blogger.type` / `blogger.status` / `github.status` 不在列舉 | §9.3 → error |
| `.publish.json` | `schemaVersion ≠ 1` | §9.2 → error |
| `.publish.json` | JSON 不合法 / 缺頂層 key | §9.1 → error |
| `.publish.json` | `blogger.status: ready` 但 `blogger.permalink` 空 | §8.2 → error |
| `.publish.json` | `blogger.status: published` 但 `publishedUrl` / `publishedAt` 空 | §8.2 → error |
| `.publish.json` | `github.status: ready` 但 `slug` 空 | §8.2 → error |
| `.publish.json` | `github.status: published` 但 `slug` / `publishedUrl` / `publishedAt` 空 | §8.2 → error |
| `.fb.md` | `.md status: ready/published` 但 `.fb.md` 不存在或 `enabled: false` | publish-bundle §4.2 → error |
| `.fb.md` | `.md status: ready/published` 但 body placeholder 未解析（含 body 完全空）| fb-sidecar-schema §7.2 → error |

### 7.2 Warning-only items（不擋 build，但 baseline 會漂移）

- `.md` `tag` 不存在於 `content/settings/tags.json`（missing-tag）
- `.publish.json` `seo.robots` 非標準字串
- `.publish.json` `blogger.publishedUrl` 不符 yyyy/mm pattern（type=post）
- `.publish.json` ISO 8601 格式錯（`publishedAt`）
- `.publish.json` `publishYear/Month` 與 `publishedAt` / `publishedUrl` 不一致
- `.md` / `.publish.json seo.metaTitle` / `.fb.md title` 三處不一致
- 內容屬性塞 publish.json（`contentKind` / `series`）
- `.fb.md hashtags` 元素非字串
- `.fb.md titleEn` 非 string
- `.md book.authors[]` displayName/localName/originalName 全空
- `.md book.mediaType` 非標準（`ebook`, etc.）
- `.md book.issn/issue` 設了但 `mediaType=book`
- `.md relatedLinks` entry `kind` 非 internal/external
- `.md relatedLinks` entry `url` / `kind` 缺
- `.md status: published` + `.fb.md enabled: true` + `fbPostUrl` 空（`fb-post-url-missing`）

### 7.3 SEO 注意事項

`.md`：`title` / `titleEn` / `description` / `searchDescription` / `cover` / `coverAlt` / `category` / `tags`
`.publish.json`：`canonical.{url,source}` / `seo.{metaTitle,metaDescription,robots}` / `ogImage.{url,alt}` / `blogger.publishedUrl` / `blogger.publishYear/Month`（影響 canonical 推導）

### 7.4 FB 推廣注意事項

`.fb.md`：`enabled` / `title` / `titleEn` / body / `hashtags` / `target` / `page` / `finalUrl` / `fbPostUrl`（reports）
`.publish.json`：`blogger.publishedUrl`（`{{ articleUrl }}` 解析來源）/ `canonical.url`（`target: canonical` 時）
`promotion.config.json`：`facebook.enabled` 全域開關 / `pages.fan1.enabled` / `utm.{source,medium,campaignPattern,contentPattern}`

### 7.5 Blogger 發文流程注意事項

`.publish.json`：`blogger.permalink`（Blogger 自訂網址欄位）/ `blogger.publishedUrl` / `blogger.publishedAt` / `blogger.publishYear` / `blogger.publishMonth` / `blogger.bloggerPostId`
`.md`：`title`（Blogger 標題）/ `searchDescription`（Blogger 搜尋說明）/ `tags`（Blogger 標籤）/ `cover`（Blogger 首圖）

### 7.6 UTM do-not-touch 原則

- UTM **不寫死**於 `.fb.md` body / frontmatter（per fb-sidecar-schema §8.3）
- UTM **不寫死**於 `.publish.json`（schema 不存在 UTM 欄位）
- UTM **不寫死**於 `.md` frontmatter（內容層不管 UTM）
- FB 推廣 UTM 由 `promotion.config.json.facebook.utm` + build 階段組裝
- Blogger ↔ GitHub 互導 UTM 由 `src/scripts/ga4-url-builder.js` + build pipeline 處理（per `CLAUDE.md` §16.4）

---

## §8 Recommended future phases

建議順序（每 phase 單一 focus、單檔或最小範圍 edit、commit 後評估）：

| # | phase name 建議 | scope | 動作類型 | 前置依賴 |
|---|---|---|---|---|
| 1 | `book-review-content-fill` | 只補 `.md` 之 §3 表 A1-A12 / A16-A23 對應內容；不動 status / draft | edit `.md` 單檔 | user 提供書名 / 作者 / 出版社 / 心得 / 圖片 URL |
| 2 | `fb-content-fill` | 只補 `.fb.md` 之 §5 表 F2 / F4 / F5 對應正式 FB 文案與 hashtags；不動 `enabled` | edit `.fb.md` 單檔 | 1 已完成（FB title 需與 Blogger title 一致）|
| 3 | `publish-sidecar-ready` | 補 §4 表 P6（`blogger.permalink`）+ 改 §4 P7（`blogger.status: ready`）+ §3 A14/A15（`.md status: ready` / `draft: false`）+ §5 F1（`.fb.md enabled: true`）| edit `.md` + `.publish.json` + `.fb.md` 三檔 | 1 + 2 已完成 |
| 4 | `ready-build-smoke` | 跑 §6 a/b（validate / build:blogger / build:promotion；若 A22=true 加 c）；產 dist-blogger + dist-promotion；read-only 驗證 output | read-only | 3 已完成 |
| 5 | `manual-blogger-publish` | 使用 4 產出的 copy-helper / publish-checklist 手動貼 Blogger | 純手動操作（非 npm script）| 4 已完成 |
| 6 | `published-backfill` | 回填 §4 表 P7（改 `published`）/ P8 / P9 / P10 / P11 | edit `.publish.json` 單檔 | 5 已完成 |
| 7 | `fb-post-publish-backfill` | FB 後台手動發文 + 回填 §5 表 F10（`fbPostUrl` / `fbPostedAt`）| 手動 + edit `.fb.md` 單檔 | 6 已完成 |

每 phase 完成後建議：

- 跑 `npm run validate:content` 驗 baseline 不退化
- single commit + push origin/main（per 本次 PM 系列慣例）
- 不批量做多 phase；保留 user 可隨時收工 / 暫停

---

## §9 Note

| 項目 | 邊界 |
|------|------|
| 本文件只記錄 checklist | ✅ |
| 本 phase **不**修改 content（`.md` / `.publish.json` / `.fb.md` 三檔皆不動）| ✅ |
| 本 phase **不**代表文章已 ready | ✅ |
| 本 phase **不** deploy / build / Blogger 後台 / GA4 / FB 後台 | ✅ |
| 本檔落地後**不**改變任何 production state | ✅ 純對照 checklist 工具 |

---

（本文件結束）
