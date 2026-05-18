# Phase 9-g-g Completion Report：JSON-LD mentions / isPartOf 系列收尾

本文件封存 **Phase 9-g-g（JSON-LD `mentions` / `isPartOf` structured data 強化）系列**之完整 completion 紀錄。Phase 9-g-g 為 Phase 1 final + Phase 8-h legacy fallback retirement 收尾後之 SEO structured data 強化批，目的為**擴充 BlogPosting JSON-LD schema**，加入 `mentions` / `isPartOf` 兩個 schema.org 標準欄位，並保持 Blogger / GitHub 兩端 parity。

對應之上層紀錄：
- `docs/phase-9g-g-pre-plan.md`（Phase 9-g-g-b docs-only pre-plan；commit `f5fb400`）
- `docs/phase-9j-jsonld-landing-verification.md` §3 / §4（既有 11 項 JSON-LD landings + Phase 9-g-g / 9-f-g deferred 紀錄）
- `docs/phase-1-completion-report.md` §8.1 / §11 順序 4（Phase 9-g-g post-Phase-1 deferred + 啟動順序）
- `docs/seo-ga4-adsense.md` §7.4 / §7.4.1（BlogPosting schema 規範 + Phase 9-g-g 預計新增欄位）
- `docs/related-links-schema.md` §9.5（mentions / isPartOf 設計提案）
- `docs/future-roadmap.md` §8.5 順序 4（Phase 9-g-g 排程）

---

## §1 Phase 9-g-g 目標摘要

### 1.1 高階目標

Phase 9-g-g 之目標為**擴充 BlogPosting JSON-LD schema**：

1. **BlogPosting JSON-LD 增強**：在既有 12 欄位基礎上，新增 `mentions` + `isPartOf` 兩個 schema.org-compliant 欄位
2. **isPartOf**：將文章歸屬之 site / blog（最保守 type）映射為 `isPartOf` object（永遠輸出）
3. **mentions**：將 `post.relatedLinks` / `post.otherLinks` 之作者主動引用之延伸閱讀 / 來源連結，映射為 `mentions[]` array（條件式：non-empty 時才出）
4. **Blogger / GitHub 兩端 parity**：兩端 BlogPosting schema 同步 mirror（per Phase 9-h article block parity precedent + Phase 9-i-b2 canonical 同步）
5. **不影響既有 production output**：既有 12 欄位完全保留；本批屬 **additive**

### 1.2 範圍區分

| 範圍 | 屬性 |
|---|---|
| **in-scope**（本系列處理）| `mentions` field + `isPartOf` field on BlogPosting；Blogger + GitHub 兩端 |
| **out-of-scope**（per §8）| Google Rich Results Test 驗證 / Phase 9-f-g Book / Periodical structured data / Related Posts auto block / sitemap cross-source gap / library type enum / YouTube / Netflix / DVD / magazine specific @type |

### 1.3 退場 / 設計原則

- **保守 @type**：mentions[] item 採 `WebPage` base type；isPartOf 採 `Blog`；不臆造 specific subType（避免 schema.org 嚴格性導致 Google 標 invalid）
- **保守 isPartOf**：第一版僅接 site / blog；不接 book / series / category（避免語義錯誤）
- **嚴格 pre-filter**：mentions 來源（relatedLinks / otherLinks）必須有 url + title；無資料之 entries 不進 mentions；mentionsItems empty 時整個欄位不出
- **兩端 mirror**：Blogger + GitHub schema 完全一致；single design / dual implementation point
- **不接 normalize-post-output**：per `docs/related-links-schema.md` §9.3 第一版設計；直接讀 `post.relatedLinks` / `post.otherLinks` / `post.primaryPlatform` / `settings.site.*`

---

## §2 最終基準狀態

（Phase 9-g-g-d mentions source 落地完成後）

| 項目 | 值 |
|---|---|
| **HEAD** | `1d56f8a refactor(seo): add mentions to BlogPosting JSON-LD` |
| **working tree** | clean |
| **`validate:content` baseline** | `0 error / 22 warning / 17 post(s)` |
| **`build:github`** | exit 0 |
| **`build:blogger`** | exit 0 |
| **`dist/.gitkeep`** | 0 bytes；mtime `2026-05-18 11:34`（自 Phase 8-h-b restore 後**全程保留**）|

### 2.1 Phase 9-g-g 系列累計變動

| 維度 | 變動 |
|---|---|
| source files 修改 | 2 個檔案（`src/scripts/build-github.js` + `src/scripts/build-blogger.js`）|
| docs landed | 5 個檔案（pre-plan + 本 completion report + 3 個 sync 檔；詳見 §3）|
| content / fixtures / settings | ❌ 未動 |
| dist / dist-blogger / dist-promotion | ❌ 未直接 commit；source 退場批之 build 驗證採 dist-untracked 模式 |
| commits（不含 9-g-g-a 純分析）| **4 個**（本 Phase 9-g-g-z 收尾批為第 5 個）|

---

## §3 子批次 landed table

| 子批次 | 範圍 | 狀態 | commit |
|---|---|---|---|
| **Phase 9-g-g-a** | 純讀取分析（read-only pre-analysis；無 commit）| ✅ completed | — |
| **Phase 9-g-g-b** | docs-only pre-plan（新增 `docs/phase-9g-g-pre-plan.md` + `docs/related-links-schema.md` §9.5 + `docs/seo-ga4-adsense.md` §7.4.1）| ✅ landed | `f5fb400` |
| **Phase 9-g-g-c** | source 接入 **isPartOf only**（單一欄位；最保守第一步；2 個 source file mirror）| ✅ landed | `70fbf22` |
| **Phase 9-g-g-d** | source 接入 **mentions only**（接 `relatedLinks[]` + `otherLinks[]`；嚴格 pre-filter；2 個 source file mirror）| ✅ landed | `1d56f8a` |
| **Phase 9-g-g-z** | completion report + docs sync（本批；mirror Phase 8-h-z pattern）| 🔄 本批 pending | 本批 |

**合計**：3 source / docs commits（9-g-g-b + 9-g-g-c + 9-g-g-d）+ 本 9-g-g-z 收尾批 = **4 commits**（不含 9-g-g-a 純分析）

---

## §4 isPartOf 落地摘要

（Phase 9-g-g-c；commit `70fbf22`）

### 4.1 兩端 BlogPosting JSON-LD 已新增 `isPartOf`

| 端 | 接入函式 | 檔案 |
|---|---|---|
| **GitHub** | `buildSeoForPostDetail()` | `src/scripts/build-github.js`（line 197-262 區段內）|
| **Blogger** | `buildBloggerJsonLd()` | `src/scripts/build-blogger.js`（line 130-180 區段內）|

### 4.2 欄位結構

| isPartOf 子欄位 | 值 | 來源 |
|---|---|---|
| `@type` | `"Blog"`（fixed；schema.org 標準）| 設計常數 |
| `@id` | `${settings.site.bloggerSiteUrl}/` 或 `${settings.site.githubSiteUrl}/` | 依 `post.primaryPlatform` 選擇 |
| `name` | `settings.site.siteName` | settings 直讀 |
| `url` | 同 `@id` | 同上 |
| `inLanguage` | `settings.site.language` | settings 直讀 |

### 4.3 條件式輸出

- `if (canonicalUrl)` block 內構建 isPartOf；canonicalUrl 為空 → 整個 jsonLd return null（既有行為，未變動）
- canonicalUrl 非空時，isPartOf **永遠輸出**（無 conditional skip）

### 4.4 不採之設計（per 設計原則）

| 替代設計 | 不採理由 |
|---|---|
| `isPartOf` 指向 `book` | schema.org isPartOf 定義「CreativeWork is part of larger CreativeWork」；書評不是 PART OF 被評書本（語義錯誤）|
| `isPartOf` 指向 `series` | 當前 0 ready posts 含 series；列為 future enhancement |
| `isPartOf` 指向 `category` | WebPageSection 在 schema.org 較少見；Google 解析較弱 |
| `@type: WebSite` 替代 `Blog` | `Blog` 之 BlogPosting parent CreativeWork 語義更精確；schema.org 支援 |

---

## §5 mentions 落地摘要

（Phase 9-g-g-d；commit `1d56f8a`）

### 5.1 兩端 BlogPosting JSON-LD 已新增 `mentions`

| 端 | 接入函式 | 檔案 |
|---|---|---|
| **GitHub** | `buildSeoForPostDetail()` | `src/scripts/build-github.js`（line 197-262 區段內）|
| **Blogger** | `buildBloggerJsonLd()` | `src/scripts/build-blogger.js`（line 130-180 區段內）|

### 5.2 來源

- `post.relatedLinks[]` + `post.otherLinks[]` 兩個 array concat
- 不接 `book.*` / `affiliate.links[]` / `series.*` / `author` / `platform` 等其他欄位

### 5.3 item 結構（嚴格三欄位）

| mentions[] item 欄位 | 來源（per-item） |
|---|---|
| `@type` | `'WebPage'`（fixed；schema.org base type）|
| `name` | `entry.title`（必填；pre-filter 排除空值）|
| `url` | `entry.url`（必填；pre-filter 排除空值）|

**不映射之欄位**（per §3.1 之 8 per-item 欄位中之 6 個不進 mentions）：`kind` / `platform` / `description` / `order` / `target` / `rel`

### 5.4 嚴格 pre-filter

每個 entry 必須通過以下條件才進 mentions[]：

1. `Array.isArray()` 確認 source 為 array（非 array source 全 fallback 為 `[]`）
2. entry 為 plain object（`typeof entry === 'object'` + 非 null + `!Array.isArray(entry)`）
3. `entry.title` 為 string 且 `entry.title.trim() !== ''`
4. `entry.url` 為 string 且 `entry.url.trim() !== ''`

### 5.5 Empty array 處置

- pre-filter 後 mentionsItems 為空時：**不輸出** `mentions` 欄位
- 採 JS spread conditional：`...(mentionsItems.length > 0 ? { mentions: mentionsItems } : {})`
- 整個 `mentions` key 不出現於 JSON-LD object（避免 `[]` / `null` 噪音被 Google 標 invalid）

### 5.6 不採之設計（per 設計原則）

| 替代設計 | 不採理由 |
|---|---|
| **輸出 empty `mentions: []`** | schema.org 對空 array 解析寬鬆但 Google Rich Results Test 嚴格；避免噪音 |
| **依 `platform` 推導 specific @type** | platform 為 free-form 字串（"Youtube" / "台北市立圖書館" / "出版社官網" 等）；不映射為 schema.org subType；統一用 `WebPage` |
| **接 `affiliate.links[]`** | affiliate 屬 sponsored；schema.org mentions 為「referenced」；混入會誤導 Google 解讀；屬 Phase 9-f-g 範疇 |
| **specific @type（VideoObject / MediaObject / Book / Periodical）** | 需正確 contentUrl / duration 等 metadata；本批不臆造；屬 Phase 9-f-g + future schema enum 範疇 |
| **接 normalize-post-output** | per `docs/related-links-schema.md` §9.3 第一版設計；直接讀 `post.*` |

---

## §6 Blogger / GitHub parity 驗證

### 6.1 兩端 mirror

| 維度 | 驗證 |
|---|---|
| **isPartOf 結構** | 兩端完全 mirror（@type / @id / name / url / inLanguage 五欄位）；唯一差異為具體 URL 依 `post.primaryPlatform` 而異 |
| **mentions 結構** | 兩端完全 mirror（@type / name / url 三欄位 / item）；mentions[] 長度一致 |
| **既有 12 欄位** | 完全保留；byte-identical-modulo-builtAt（per Phase 9-g-g-c / 9-g-g-d 各批 dist sanity check）|

### 6.2 Live verification posts

| Post | 角色 | 驗證結果 |
|---|---|---|
| `20260515-we-media-myself2`（Blogger book-review；1 個 relatedLinks）| **mentions live target** | ✅ 兩端 `mentions[1]`；name = "貝果書屋-AI玩轉自媒體的52個商業思維"；url = `https://babel-lab.blogspot.com/2026/04/we-media-myself.html`；兩端 byte-identical |
| `20260504-github-pages-blog-planning`（GitHub tech-note；無 relatedLinks/otherLinks）| **mentions empty case** | ✅ 兩端 BlogPosting JSON-LD **不含** mentions 欄位（spread conditional short-circuit）|
| `20260504-portable-blog-system-mvp`（GitHub tech-note；無 relatedLinks/otherLinks）| 同上 | ✅ 同上 |

### 6.3 isPartOf 全 ready posts 驗證

| Post | primaryPlatform | isPartOf.@id |
|---|---|---|
| we-media-myself2 | blogger | `https://babel-lab.blogspot.com/` |
| github-pages-blog-planning | github | `https://babel-lab.github.io/` |
| portable-blog-system-mvp | github | `https://babel-lab.github.io/` |

三篇 ready posts 之 isPartOf 結構於兩端皆完整輸出；`@id` / `url` 依 primaryPlatform 正確切換；其他 4 欄位（@type / name / inLanguage）完全一致。

---

## §7 驗證摘要

### 7.1 各子批驗證結果

| 子批 | `validate:content` | `build:github` | `build:blogger` | 備註 |
|---|---|---|---|---|
| Phase 9-g-g-b（docs only）| `0/22/17`（baseline 維持）| 不適用（純 docs；未必跑）| 不適用 | 純 docs；validate 不掃 docs |
| Phase 9-g-g-c（isPartOf source）| `0/22/17`（baseline 維持）| ✅ exit 0 | ✅ exit 0 | isPartOf 進入 dist JSON-LD |
| Phase 9-g-g-d（mentions source）| `0/22/17`（baseline 維持）| ✅ exit 0 | ✅ exit 0 | mentions 進入 we-media-myself2 dist JSON-LD（其他無 relatedLinks 之 post 不出 mentions key）|
| Phase 9-g-g-z（本批；docs only）| 未執行（per scope 限制）| 未執行 | 未執行 | 純 docs；無 source / content 變動 |

### 7.2 dist 保留狀態

| 項目 | 狀態 |
|---|---|
| `dist/.gitkeep` | ✅ 0 bytes；mtime 2026-05-18 11:34；未動 |
| `dist/` 其他內容 | untracked；不入 commit（per Phase 8-h-b 既有 pattern）|
| `dist-blogger/` | untracked；不入 commit |
| `dist-promotion/` | untracked；不入 commit |
| `dist-reports/` | untracked；不入 commit |

### 7.3 Google Rich Results Test

❌ **未執行**：屬作者 SOP（per `docs/phase-1-completion-report.md` §11 順序 1）；不在本 Phase 9-g-g 系列任一子批之 Claude 範疇；建議於 Phase 9-g-g-z 收尾後由作者執行（per §9.1）。

---

## §8 Out-of-scope / Deferred

本系列**明確不處理**之項目：

| 項目 | 範疇 | 處置 |
|---|---|---|
| **Google Rich Results Test 驗證** | 屬作者 SOP；非 Claude 執行 | 本系列收尾後由作者執行；不在本批或後續 9-g-g-* 之 source 變動 |
| **Phase 9-f-g Book / Periodical structured data** | book metadata schema.org 強化（book-review post 之被評書本 → Book / Periodical）| 獨立 Phase 9-f-g 處理；不在 Phase 9-g-g scope |
| **Phase 9-h-f Related Posts auto block** | 兩端自動相關文章推薦邏輯 | 獨立 Phase 9-h-f；觸發條件需 ≥ 5 篇 ready post（當前 3 篇）|
| **sitemap.xml cross-source gap 修復** | we-media-myself2 cross-source mirror 未入 sitemap | 獨立 future batch；per `docs/phase-10-a-b-sitemap-robots-baseline.md` §3.3 |
| **library type enum 擴充** | 一般圖書 / 電子書 / DVD / 雜誌 / Netflix 等正式 type | per `docs/phase-1-completion-report.md` §8.10；屬未來 schema 候選 |
| **YouTube / Netflix / DVD / magazine specific @type** | mentions[] item 採 VideoObject / MediaObject / Book / Periodical | 第一版統一 `WebPage`；未來若有正確 metadata 再分 type |
| **mentions / isPartOf 之 normalize-post-output 接入** | 第一版直接讀 `post.*` 欄位 | per `docs/related-links-schema.md` §9.3 第一版設計 |
| **`affiliate.links[]` 映射** | sponsored 性質 | 不應為 mentions；本批不處理；屬 Phase 9-f-g 範疇 |
| **`book.*` / `author` 映射為 mentions / about** | book / author 屬「實體」非「連結」| 屬 Phase 9-f-g 範疇 |
| **BreadcrumbList / WebPage / Organization 等其他 schema** | 既有 BlogPosting + WebSite 之外的 schema 類型 | 不在 Phase 9-g-g scope；屬未來 SEO 強化批 |

---

## §9 下一步建議

### 9.1 順序 1（首要）：Google Rich Results Test

**建議由作者執行**：

1. 對 `we-media-myself2`（Blogger book-review；含 mentions[1] + isPartOf）之 dist BlogPosting JSON-LD 執行 Google Rich Results Test
2. 確認 schema 通過（`@type: BlogPosting` + 新增 isPartOf / mentions 不導致 invalid）
3. 對 `github-pages-blog-planning`（無 mentions；含 isPartOf）執行同樣測試
4. 若 Google 拒絕：暫停後續 Phase 9-f-g / 9-h-f 啟動；回報具體 Google 訊息；評估退場 / 修正 @type / 縮減欄位範圍

### 9.2 順序 2（次要）：Phase 9-f-g Book / Periodical structured data

**Trigger condition**：順序 1 通過後啟動

- `book-review` post 之被評書本 → schema.org `Book` / `Periodical`
- 接 `book.title` / `book.authors[]` / `book.isbn` / `book.publishedYear` 等欄位
- 與 mentions 之差異：書評對被評書本之關係屬 `about` 或獨立 entity；非 `mentions`

### 9.3 順序 3（觸發 trigger 後）：Phase 9-h-f Related Posts auto block

**Trigger condition**：作者 ≥ 5 篇 ready post（當前 3 篇；尚未達成）

- 兩端自動相關文章推薦邏輯（per CLAUDE.md §17）
- 與 Phase 9-g 之 relatedLinks / otherLinks（作者手動指定）**為兩套獨立機制**（per `docs/related-links-schema.md` §2.2）

### 9.4 順序 4（獨立 future batch）：sitemap.xml cross-source gap 修復

per `docs/phase-10-a-b-sitemap-robots-baseline.md` §3.3：we-media-myself2 cross-source mirror 未入 sitemap。

---

## §10 Cross-links

### 10.1 既有 docs

- `docs/phase-9g-g-pre-plan.md`（Phase 9-g-g-b 之 pre-plan 設計；本批之上層；commit `f5fb400`）
- `docs/related-links-schema.md` §9.5（mentions / isPartOf 設計提案；本批同步更新狀態）
- `docs/seo-ga4-adsense.md` §7.4.1（BlogPosting JSON-LD schema；本批同步更新狀態）
- `docs/phase-9j-jsonld-landing-verification.md` §3 / §4（既有 11 項 JSON-LD landings；本批之擴充紀錄）
- `docs/phase-1-completion-report.md` §8.1 / §11 順序 4（Phase 9-g-g post-Phase-1 deferred）
- `docs/future-roadmap.md` §8.5 順序 4（Phase 9-g-g 排程；本批同步更新狀態）

### 10.2 規範來源

- `CLAUDE.md` §21（GitHub 站 SEO 必做項目；JSON-LD 已落地，本批為強化）
- `CLAUDE.md` §27（Claude Code 修改規則；本批嚴格遵守「docs-only / 不動 source / 不 push」之保守原則）

### 10.3 系列之間的關係

- **Phase 9-g 系列**（relatedLinks / otherLinks schema + render + checklist）：✅ 已 landed（per `docs/phase-9g-completion-report.md`）
- **Phase 9-g-g 系列**（本系列；JSON-LD mentions / isPartOf）：✅ 本批收尾完成
- **Phase 9-f-g 系列**（book / periodical structured data）：⏸ 未啟動；屬順序 2
- **Phase 9-h-f 系列**（Related Posts auto block）：⏸ 未啟動；屬順序 3；trigger 條件未達成

---

（本文件結束）
