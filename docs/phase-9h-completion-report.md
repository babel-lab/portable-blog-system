# Phase 9-h Completion Report：GitHub article block parity 系列

本文件為 Phase 9-h **GitHub article block parity 系列**之完成報告（mid-snapshot；至本批 9-h-r 落地時）。涵蓋自 Phase 9-h-a（新需求候選盤點 / spec 純讀取分析）至 Phase 9-h-r（本批；overall completion report）共 14 個子批（含 5 個純分析批 + 8 個含 commit + 本批）之落地紀錄、6 個 article block parity 對照與 deferred 項目。

**重要邊界**：本報告封存的是 **GitHub article block parity 之 completed snapshot**（6 個 conditional article blocks 已達成 100% Blogger parity），**並非** Phase 9-h overall 整體系列收尾。Phase 9-h 仍 🔄 進行中；後續候選 **兩端 Related Posts auto**（per 9-h-a §H2 推薦優先序）為未來批次；本報告不暗示整個 Phase 9 所有候選都完成。

對應之上層紀錄詳見：
- `docs/future-roadmap.md` §2 Phase 9 row（跨 phase 路線總覽）
- `docs/phase-9g-completion-report.md`「後續系列」段（Phase 9-h 各子系列 cross-link）
- `docs/publish-workflow.md` §11 末段（各區塊 GitHub 端補述：affiliate / download / hashtag / book photo）

---

## §1 Phase 9-h 目標摘要

Phase 9-h 之目標為達成 **GitHub article block parity**：讓 `src/views/pages/post-detail.ejs`（GitHub article 頁）對齊 `src/views/blogger/blogger-post-full.ejs`（Blogger article 頁）之 **conditional article blocks**，使 GitHub Pages 與 Blogger 兩平台在同一篇 Markdown 來源上輸出視覺與語意一致的文章內容區塊。

**設計原則**（建立於 Phase 9-h-a 純讀取分析）：

1. **mechanical mirror**：GitHub 端 EJS render pattern 完整 mirror Blogger 端（guard 條件 / HTML markup / BEM / 自動 rel / target / display-only 設計）
2. **不接 normalize-post-output**：mirror 既有 hashtag / affiliate / download 之 pattern；直接讀 `post.*` 欄位
3. **lab-container 包裝**：GitHub 端每區塊包覆 `<div class="lab-container">`（Blogger 端無此包裝；屬 GitHub article 結構必要）
4. **trim-newline pattern**：對既有無對應 frontmatter 之 ready posts 達成 byte-identical-modulo-builtAt
5. **EJS comment 嚴格無 delimiter 字符**：mirror 9-g-d-c-fix / 9-g-e-b 既有預防經驗
6. **SCSS / main.scss / build script / Blogger 端不動**：每實作批單檔 `post-detail.ejs` commit
7. **dist/.gitkeep restore**：vite build 副作用之 placeholder 還原
8. **single-file commit precedent**：每實作批僅 1 個檔案被 staged

---

## §2 起點狀態

Phase 9-h 啟動前之 stable snapshot：

| 項目 | 值 |
|---|---|
| HEAD 起點（最近期）| `6ae08c1`（Phase 9-h-d-c）/ 9-h 啟動初期可追溯至 Phase 9-g-f 收尾後 |
| Phase 9-g-f 已完成 | ✅ GitHub `relatedLinks` / `otherLinks` render（commit `1bb807f`；屬 9-g-f-b）|
| validate baseline | `0/22/17`（自 9-g-c-c fixtures 落地後維持穩定）|
| dist baseline | Blogger + GitHub 兩端對既有無對應新欄位之 ready posts 達 byte-identical-modulo-builtAt |
| `_book-photo.scss` / `_download-box.scss` / `_affiliate-box.scss` / `_hashtag.scss` / `_related-links.scss` | ✅ 全數已就位（Phase 2-2-g / 2-2-o / 2-2-p / 9-g-d-b 落地）|
| `main.scss` 對應 import | ✅ 全數就位（line 23 hashtag / line 27 affiliate-box / line 28 book-photo / line 29 download-box / line 31 related-links）|
| Blogger source pattern | ✅ `blogger-post-full.ejs` 已具備所有 conditional article blocks（affiliate top/bottom / download / book photo / related-links / other-links / hashtag）|

**Phase 9-h 啟動前之 gap 識別**：Phase 9-g-f-b 落地後，GitHub `post-detail.ejs` 已具備 `relatedLinks` / `otherLinks` 兩個 conditional aside，但仍**缺漏** 4 個 Blogger 端既有區塊之 GitHub render：Affiliate Box（top/bottom）/ Download Box / Hashtag / Book Photo。Phase 9-h 之 9-h-b / 9-h-c / 9-h-d / 9-h-e 四個子系列即為**逐一補齊**這四個區塊。

---

## §3 Phase 9-h 子批列表

共 14 個子批（5 個純分析 + 8 個含 commit + 本批 overall report）：

| 子批 | 性質 | commit | subject |
|---|---|---|---|
| 9-h-a | 純分析 | — | 新需求候選盤點 / spec 純讀取分析（9 個候選 H1-H9 評估；推薦優先做 H2-1 GitHub Affiliate Box × 2）|
| 9-h-b-a | 純分析 | — | GitHub Affiliate Box render 純讀取分析（5 條 AND guard + 自動 rel / target + 推薦插入點）|
| 9-h-b-b | 含 commit | `f16457e` | `feat(phase-9): add GitHub affiliate box top/bottom render`（`post-detail.ejs` +43 行）|
| 9-h-b-c | 含 commit | `c356a2b` | `docs(phase-9): sync Phase 9-h GitHub Affiliate Box landings`（future-roadmap / publish-workflow / 9-g report cross-link）|
| 9-h-c-a | 純分析 | — | GitHub Download Box render 純讀取分析（3 條 AND guard + HTML5 download + 推薦插入點）|
| 9-h-c-b | 含 commit | `6f06f28` | `feat(phase-9): add GitHub download box render`（`post-detail.ejs` +28 行）|
| 9-h-c-c | 含 commit | `7961a73` | `docs(phase-9): sync Phase 9-h Download Box landings` |
| 9-h-d-a | 純分析 | — | GitHub Hashtag render 純讀取分析（4 條 AND guard + display-only span + 既有 ready posts 已含 blocks.hashtags + tags → 預期 build delta）|
| 9-h-d-b | 含 commit | `0ddeda6` | `feat(phase-9): add GitHub hashtag render`（`post-detail.ejs` +18 行）|
| 9-h-d-c | 含 commit | `6ae08c1` | `docs(phase-9): sync Phase 9-h Hashtag landings` |
| 9-h-e-a | 純分析 | — | GitHub Book Photo render 純讀取分析（4 條 AND guard + figure/img/figcaption + 推薦插入點 + dormant render 預測）|
| 9-h-e-b | 含 commit | `5824a6d` | `feat(phase-9): add GitHub book photo render`（`post-detail.ejs` +20 行；dormant render）|
| 9-h-e-c | 含 commit | `aec2984` | `docs(phase-9): sync Phase 9-h Book Photo landings` |
| **9-h-r**（本批）| 含 commit | 見本批 git log | `docs(phase-9): add phase-9h completion report`（建議 commit message） |

**含 commit 子批合計**：9 個（含本批）
**純分析子批合計**：5 個

---

## §4 已完成的 GitHub article block parity 對照表

✅ **6 個 conditional article block 完成 GitHub parity**：

| # | Blogger block（`blogger-post-full.ejs`） | GitHub block（`post-detail.ejs`） | landing commit | docs sync commit | 狀態 | live activated / dormant |
|---|---|---|---|---|---|---|
| 1 | `<aside class="lab-related-links">` / `<aside class="lab-other-links">` | 同上（包覆 `<div class="lab-container">`）| `1bb807f`（9-g-f-b）| `f6aca11`（9-g-f-c）| ✅ landed | dormant（既有 ready posts 之 frontmatter 無 `relatedLinks` / `otherLinks`）|
| 2 | `<aside class="lab-affiliate-box">` top | 同上（包覆 `<div class="lab-container">`）| `f16457e`（9-h-b-b）| `c356a2b`（9-h-b-c）| ✅ landed | dormant（既有 ready posts 無 affiliate schema）|
| 3 | `<aside class="lab-affiliate-box">` bottom | 同上 | `f16457e`（9-h-b-b；同 commit）| `c356a2b`（同上）| ✅ landed | dormant |
| 4 | `<aside class="lab-download-box">` | 同上（包覆 `<div class="lab-container">`）| `6f06f28`（9-h-c-b）| `7961a73`（9-h-c-c）| ✅ landed | dormant（既有 ready posts 無 download schema）|
| 5 | `<ul class="lab-hashtags">` 內 `<li><span class="lab-hashtag">` | 同上（包覆 `<div class="lab-container">`）| `0ddeda6`（9-h-d-b）| `6ae08c1`（9-h-d-c）| ✅ landed | **🟢 live activated**（兩篇既有 ready GitHub posts frontmatter 已含 `blocks.hashtags: true` + `tags: ["github", "vite", "static-site"]` → build 後 dist 已含 hashtag 區塊；跨平台 100% mirror Blogger 端）|
| 6 | `<figure class="lab-book-photo">` + `<img>` + 可選 `<figcaption>` | 同上（包覆 `<div class="lab-container">`）| `5824a6d`（9-h-e-b）| `aec2984`（9-h-e-c）| ✅ landed | **🟡 dormant render**（既有 ready GitHub posts 均為 `contentKind: tech-note`；無 ready book-review post live test；infrastructure ready；當未來新增 ready book-review GitHub post 時自動激活）|

**100% coverage** for Blogger 端 `blogger-post-full.ejs` 之 conditional article blocks（Cover / Article Body 屬永久區塊，非 conditional；其他所有 conditional 區塊皆有對應 GitHub render）。

**唯一 live activated 區塊**：Hashtag（per 9-h-d-b）。其餘 5 個區塊在當前 ready posts 上屬 dormant render 設計；infrastructure 完備，待相應 frontmatter 之 ready post 出現時自動激活。

---

## §5 各區塊設計摘要

### 5.1 relatedLinks / otherLinks（per 9-g-f-b）

**性質**：作者**手動指定**之延伸閱讀 / 來源連結 / 系列文章 array（兩個顯示分區）

**規則**：
- per-item 8 欄位（`kind` / `platform` / `title` / `url` / `description` / `order` / `target` / `rel`）
- `kind === 'internal'` → 不加 `target` / `rel`（同分頁開啟）
- `kind !== 'internal'`（含 `external` / 缺漏 / invalid）→ 自動 `target="_blank" rel="nofollow noopener"`
- 不支援 `item.target` / `item.rel` author override
- 忽略 `item.order`（本期照 array 原順序）
- renderable pre-filter：plain object + `url` non-empty + `title` non-empty
- platform 非空 → `<span class="lab-related-links__platform">[Platform]</span>` 前綴
- description 非空 → `<p class="lab-related-links__description">` 獨立行

**與 `blocks.relatedPosts` 自動推薦為 two-track 獨立機制**（不互相 fallback；per `docs/related-links-schema.md` §1 / §7）。
**與 `affiliate.links` 嚴格分離**（per 同檔 §2.3 / §6）。

完整 schema 詳見 `docs/related-links-schema.md`。

### 5.2 Affiliate Box top / bottom（per 9-h-b-b）

**性質**：聯盟販售連結；前置 + 後置兩個獨立位置

**5 條 AND guard**：
- `post.affiliate` 存在
- `post.affiliate.enabled === true`
- `Array.isArray(post.affiliate.links)` 且 `links.length > 0`
- `post.affiliate.position` 存在
- `post.affiliate.position.top === true`（top）或 `position.bottom === true`（bottom）

**HTML markup**：
- `<aside class="lab-affiliate-box">` 包覆
- `<h3 class="lab-affiliate-box__title">立即購買</h3>`
- 條件 `<p class="lab-affiliate-box__disclosure">`（per `post.affiliate.disclosure`）
- `<ul class="lab-affiliate-box__links">` forEach 之 `<li><a>` 含條件 `<span class="lab-affiliate-box__network">`

**rel 與 target**：
- 固定 `rel="sponsored nofollow noopener noreferrer"`
- 固定 `target="_blank"`
- 無 author override

**不接 GA4 event**（屬未來增強候選）。

### 5.3 Download Box（per 9-h-c-b）

**性質**：教具下載；自家素材；非聯盟

**3 條 AND guard**：
- `post.download` 存在
- `post.download.enabled === true`
- `post.download.fileUrl` 有值

**HTML markup**：
- `<aside class="lab-download-box">` 包覆
- 4 個條件元素：`<h3 class="lab-download-box__title">` / `<p class="lab-download-box__description">` / `<span class="lab-download-box__filetype">` / `<p class="lab-download-box__license">`
- `<a class="lab-download-box__cta">` 使用 HTML5 `download` 屬性

**target 與 rel**：
- **不加** `target`
- **不加** `rel`（mirror Blogger 之自家教具非聯盟設計；無 affiliate disclosure 要求）

### 5.4 Hashtag（per 9-h-d-b）

**性質**：display-only；非連結

**4 條 AND guard**：
- `post.blocks` 存在
- `post.blocks.hashtags` 為 truthy
- `Array.isArray(post.tags)`
- `post.tags.length > 0`

**HTML markup**：
- `<ul class="lab-hashtags">` 包覆
- forEach 之 `<li><span class="lab-hashtag">#tag</span></li>`
- 使用 **`<span>` 而非 `<a>`**（mirror Blogger non-link pattern）

**href / target / rel**：
- **不加** `href`
- **不加** `target`
- **不加** `rel`
- **不加** GA4 `tag_click` event（屬未來增強候選）

**live activated 狀態**：既有 2 篇 ready GitHub posts frontmatter 已含 `blocks.hashtags: true` + `tags: ["github", "vite", "static-site"]` → build 後 `dist/posts/{slug}/index.html` 已自動輸出 hashtag 區塊；hashtag 區段 grep `href` / `<a` / `target` / `rel` 皆 0 條命中確認 display-only span 設計。

### 5.5 Book Photo（per 9-h-e-b）

**性質**：書評 / 雜誌類文章之書本實體照；視覺前置區塊

**4 條 AND guard**：
- `post.contentKind === 'book-review'`
- `post.book` 存在
- `post.book.showBookPhoto` 為 truthy
- `post.book.coverImage` 有值

**HTML markup**：
- `<figure class="lab-book-photo">` 包覆
- `<img class="lab-book-photo__image" src="{post.book.coverImage}" alt="...">`
- 條件 `<figcaption class="lab-book-photo__caption">《{post.book.title}》</figcaption>`
- 若 `post.book.publisher` 有值，figcaption 內 nested append ` — {publisher}`

**img alt 三層 fallback**：
- `post.book.coverAlt`
- → `post.book.title`
- → 空字串 `''`

**直接讀 `post.contentKind`**（不接 normalize-post-output；mirror 9-h-b-b / 9-h-c-b / 9-h-d-b 既有 pattern）。

**dormant render 狀態**：`content/github/posts/` 無 ready book-review post（兩篇 ready posts 均為 `contentKind: tech-note`）；4 條 AND guard 之 ① contentKind 即 fail；dist 對既有 ready posts 完全不輸出；infrastructure ready 待未來 ready book-review post 激活。

---

## §6 baseline 狀態

### 6.1 validate baseline

✅ **Phase 9-h 全程維持 `0/22/17`** — 不變動。

| 階段 | error | warning | post 數 | 變動原因 |
| --- | --- | --- | --- | --- |
| Phase 9-h 起點（9-g-f-c 收尾後）| 0 | 22 | 17 | Phase 9-g 系列收尾 baseline |
| 9-h-b-b / 9-h-c-b / 9-h-d-b / 9-h-e-b 之 EJS render 落地 | 0 | 22 | 17 | EJS template 變更不在 validate scan path |
| 9-h-b-c / 9-h-c-c / 9-h-d-c / 9-h-e-c 之 docs sync | 0 | 22 | 17 | 純 docs；validate 不掃 |
| **本批 9-h-r 後（當前）** | **0** | **22** | **17** | 純 docs；不變 |

**性質**：✅ Phase 9-h 系列**不新增 / 不修改 validate rules**；不影響 baseline。Phase 9-g-c-c 已落地之 4 條 related-links warning rules + 既有 `book-*` rules 皆涵蓋 9-h 系列之 frontmatter schema；無需新增。

### 6.2 dist baseline

✅ **Phase 9-h 全程對既有無對應新 frontmatter 之 ready posts 達成 byte-identical-modulo-builtAt**（hashtag 除外，屬 live activated 預期變動）。

| 子批 | dist 影響範圍 |
| --- | --- |
| **9-h-a** | 純分析；dist 完全不變 |
| **9-h-b-a / 9-h-c-a / 9-h-d-a / 9-h-e-a** | 純分析；dist 完全不變 |
| **9-h-b-b** `f16457e` | GitHub `post-detail.ejs` 新增 affiliate top/bottom 兩個 conditional `<aside>`；對既有 2 篇 ready posts（github-pages-blog-planning + portable-blog-system-mvp）grep `lab-affiliate-box` / `立即購買` / `lab-affiliate-box__link` / `lab-affiliate-box__disclosure` 皆 0 條命中；達成 byte-identical-modulo-builtAt |
| **9-h-c-b** `6f06f28` | GitHub `post-detail.ejs` 新增 download box conditional `<aside>`；對既有 2 篇 ready posts grep `lab-download-box` / `下載檔案` / `lab-download-box__cta` / `lab-download-box__filetype` 皆 0 條命中；達成 byte-identical-modulo-builtAt |
| **9-h-d-b** `0ddeda6` | GitHub `post-detail.ejs` 新增 hashtag conditional `<ul>`；既有 2 篇 ready posts frontmatter 已含 `blocks.hashtags` + `tags` → **預期 build delta**：hashtag 區塊已輸出於 `dist/posts/{slug}/index.html`；跨平台 100% mirror Blogger；hashtag 區段內部 grep `href` / `<a` / `target` / `rel` 皆 0 條命中確認 display-only span（屬 Option X3 接受 build 變動 + 驗證結構與內容跨平台一致）|
| **9-h-e-b** `5824a6d` | GitHub `post-detail.ejs` 新增 book photo conditional `<figure>`；對既有 2 篇 ready posts grep `lab-book-photo` / `lab-book-photo__image` / `lab-book-photo__caption` / `trim-newline` / `figure` / `figcaption` 皆 0 條命中；達成 byte-identical-modulo-builtAt；**dormant render**：infrastructure ready 待未來 ready book-review post 激活 |
| **9-h-b-c / 9-h-c-c / 9-h-d-c / 9-h-e-c / 9-h-r**（本批）| 純 docs；dist 完全不變 |

**當前 dist 整體狀態**：

- **dist-blogger**：Blogger 端原 EJS template **完全未動**（Phase 9-h 為單向 GitHub parity 推進）；對既有 ready posts 維持自 Phase 9-g 收尾以來之 byte-identical-modulo-builtAt 狀態
- **dist（GitHub）**：6 個 article block parity 中：
  - 5 個 dormant（relatedLinks/otherLinks / Affiliate Box / Download Box / Book Photo）→ 對既有 2 篇 ready GitHub posts 達 byte-identical-modulo-builtAt
  - 1 個 live activated（Hashtag）→ 對既有 2 篇 ready posts dist 已含 hashtag 區塊；跨平台 100% mirror Blogger

**`dist/.gitkeep` 副作用處理**（mirror 9-g-f-b 既有 pattern）：每 implementation 批 build 後執行 `git restore dist/.gitkeep` 還原；未納入 implementation commit；維持單檔 commit precedent。

---

## §7 邊界聲明

### 7.1 GitHub article block parity 之嚴格邊界

- **僅針對 conditional article blocks**（永久區塊 Header / Cover / Article Body / AdSense Top / AdSense Bottom 屬 pre-9-h 既有結構；非 9-h scope）
- **mirror Blogger pattern**：guard 條件 / HTML markup / BEM / 自動 rel / target / display-only 設計完整對齊
- **單向推進**：Phase 9-h 全程**不動** Blogger 端 EJS / SCSS / build script；只新增 / 修改 GitHub 端 `post-detail.ejs`
- **不接 normalize-post-output**：mirror 既有 hashtag / affiliate / download / book photo 之直接讀 `post.*` pattern
- **不接 GA4 event**：屬未來增強候選；本系列**不**新增 hashtag link / tag_click / affiliate_click / download_click data attributes（per CLAUDE.md §5 規範）
- **不新增 validate rules**：既有 9-g-c-c 4 條 related-links rules + 既有 `book-*` rules 涵蓋本系列 schema；不額外擴增
- **不新增 SCSS / 不修改 main.scss**：所有 BEM components 已於 pre-9-h 時期落地（Phase 2-2-g hashtag / 2-2-o download-box / 2-2-p affiliate-box / 9-g-d-b related-links；book-photo 早期已就位）

### 7.2 EJS comment delimiter leak 預防（架構性 inline 防護）

Phase 9-h 全系列承 9-g-d-c-fix / 9-g-e-b initial 既有 bug 教訓，採 **inline 預防原則**：

- 每實作批之 EJS comment 內**嚴格不出現** `<%` / `%>` / `-%>` 字符（即使作為文檔說明亦不寫入）
- 描述 trim-newline pattern 時用「trim-newline pattern」中文描述代替直接 quote delimiter
- 描述 EJS guard 時改寫為自然語言（如「contentKind 為 book-review」）避免 `===` 等可疑字符
- commit 前以 grep 驗證 `dist/posts/` 全樹無 `trim-newline` 漏出（4 個實作批均 0 命中）

**Phase 9-h 全系列無 EJS comment delimiter leak**。

### 7.3 dormant render 設計

Phase 9-h 之 6 個 article block parity 中，**5 個屬 dormant render**：

- relatedLinks / otherLinks（既有 ready posts 無對應 frontmatter）
- Affiliate Box top / bottom（既有 ready posts 無 affiliate schema）
- Download Box（既有 ready posts 無 download schema）
- Book Photo（無 ready book-review GitHub post）

**dormant render 原則**：
- infrastructure ready；當未來新增對應 frontmatter 之 ready post 時自動激活
- **不**為驗證 live render 而臨時建立 fixture commit / temporary post
- live render 之 cross-platform 驗證屬未來批次（觸發條件：對應 ready post 建立後）

唯一 live activated 區塊為 **Hashtag**（既有 ready posts frontmatter 已含 `blocks.hashtags` + `tags`）；該區塊 build 後 cross-platform 已 100% mirror Blogger。

### 7.4 single-file implementation commit precedent

Phase 9-h 之每實作批（9-h-b-b / 9-h-c-b / 9-h-d-b / 9-h-e-b）**嚴格僅含 1 個檔案**：`src/views/pages/post-detail.ejs`。

- `dist/.gitkeep` 副作用刪除以 `git restore` 還原，**未納入** implementation commit
- 不順手修改 SCSS / main.scss / build script / normalize / Blogger 端 / docs / content
- docs sync 屬獨立批次（9-h-b-c / 9-h-c-c / 9-h-d-c / 9-h-e-c）；3 個 docs 檔案集中於 docs commit

### 7.5 與 `blocks.relatedPosts` 自動推薦之嚴格分離（two-track 原則延續）

per `docs/related-links-schema.md` §2.2 / §7（9-g 既有原則延續至 9-h）：

- `blocks.relatedPosts`（系統自動推薦）與 `relatedLinks` / `otherLinks`（作者手動指定）為**兩條獨立軌道**
- Phase 9-h 系列**未實作**自動推薦邏輯；屬未來候選（Phase 9-h-f）
- 兩機制可同時存在於同一篇文章；不互相 fallback

---

## §8 deferred / 後續候選

### 8.1 Phase 9-h-f：兩端 Related Posts auto（未啟動）

**範圍**：
- 跨兩端（GitHub + Blogger）之**自動**相關文章推薦邏輯
- 與作者手動指定之 `relatedLinks` / `otherLinks` 為**兩套獨立機制**（per `docs/related-links-schema.md` §1 / CLAUDE.md §16.5）
- 涉及推薦演算法（依 `tags` / `category` / `contentKind` / `series.id` 計算相關 posts）

**狀態**：⏸ deferred / future candidate
**建議拆分**：GitHub-only / Blogger-only / 共用邏輯 3 階段；子批數量預估較高

**注意**：per 9-h-a §H2 推薦優先序，本項屬 9-h 後續候選；**不**屬本 completion report 之收尾範圍。

### 8.2 Phase 9-g-g：JSON-LD `mentions` / `isPartOf` structured data（deferred）

**範圍**：為 internal links 補 schema.org 屬性（`mentions` / `relatedLink` / `isPartOf`）

**狀態**：⏸ deferred（per `docs/phase-9g-completion-report.md` §8.3）
**理由**（mirror Phase 9-f-g 之保守原則）：
- 等真實 ready post 可做 Google Rich Results Test 後再評估
- schema.org 嚴格性（錯誤 schema 會被 Google 標 invalid）
- byte-identical 驗證對 schema 結構正確性不足夠

### 8.3 ready book-review GitHub post 建立以測 Book Photo live render

**範圍**：
- 將 `content/blogger/posts/20260504-sample-book-review.md` 從 draft 改 ready，**或**
- 將其複製為 `content/github/posts/` 並調整 publishTargets，**或**
- 從零撰寫新 GitHub book-review post

**狀態**：⏸ deferred / future candidate
**性質**：屬 **content 變動**（非 9-h 系列）；獨立批次
**觸發效果**：9-h-e Book Photo render 由 dormant 轉為 live activated；可作 cross-platform render 驗證

### 8.4 Phase 8-h legacy 退場盤點

**範圍**：legacy frontmatter（`type` / 舊 promotion / 舊 publishedUrl 等）退場
**狀態**：⏸ pending（per `docs/phase-9g-completion-report.md` §8.4）
**性質**：與 9-h 並行候選；屬清理工作；無直接 dependency

### 8.5 Phase 8-g pause-state 維持不變

下列 Phase 8-g deferred / pending 項目**狀態未動**：

- **candidate 6**（first article `.fb.md` hashtags fallback）仍 ⏸ `nice-to-have / Phase 8-h+`
- **Phase 8-g-1** fixture / sample end-to-end 驗證仍 ⏸ deferred

Phase 9-h 系列**未碰**上述任何項目；保留原 pause-state。

---

## §9 結論與下一步建議

### 9.1 Phase 9-h article block parity completed snapshot

✅ **Phase 9-h article block parity 可視為 completed snapshot**：

- 6 個 conditional article blocks 全數達成 GitHub parity
- 100% Blogger `blogger-post-full.ejs` conditional article blocks coverage
- 1 個 live activated（Hashtag）+ 5 個 dormant render（infrastructure ready）
- validate baseline 全程維持 `0/22/17`；無 regression
- dist baseline：dist-blogger 完全不變；dist（GitHub）對既有 ready posts 達 byte-identical-modulo-builtAt（hashtag 除外，屬預期 live activated）
- 無 EJS comment delimiter leak（inline 預防全程有效）
- single-file implementation commit precedent 全程遵守

### 9.2 Phase 9-h overall 狀態（精準文字）

**「GitHub article block parity complete；Related Posts auto deferred / future candidate」**

⚠️ **重要邊界**：
- 本 completion report 封存 **GitHub article block parity** 之 completed snapshot
- **不**等同 Phase 9-h 整體系列收尾（後續候選 9-h-f Related Posts auto 仍未啟動）
- **不**暗示整個 Phase 9 所有候選都完成（9-g-g JSON-LD / 8-h legacy 退場 / ready book-review post 建立 等仍 deferred）

### 9.3 下一步建議

| 候選 | 範圍 | 觸發條件 |
| --- | --- | --- |
| **維持 stable snapshot** | Phase 9-h-r 收尾後常見休止點 | 無時程壓力時最保守 |
| **Phase 9-h-f**（兩端 Related Posts auto）| 跨兩端；scope 最大 | 拆 3 階段；屬未來批次 |
| **Phase 9-g-g**（JSON-LD deferred 評估）| 屬 SEO 強化；與 9-h 主軸正交 | 等真實 ready post 可做 Google Rich Results Test 後再評估 |
| **ready book-review GitHub post 建立** | content 變動 | 觸發 9-h-e Book Photo render live activation；可作 cross-platform 驗證 |
| **Phase 8-h legacy 退場盤點** | 清理工作 | 與 9-h 並行候選；無直接 dependency |

**保守原則**：每候選獨立批次；不混入本 9-h-r overall report。

### 9.4 EJS comment delimiter leak 預防（架構性延續）

future EJS template edits 應持續遵守 Phase 9-g-d-c-fix spec rule 4 + Phase 9-h 全系列既有 inline 預防經驗：

- comment 內**不要再出現** `<%` / `%>` / `-%>` 這類 EJS delimiter 文字
- 修改 EJS template 後可用 `grep "^<%#"` 掃描全檔 comments 人工 review
- 如未來考慮自動化檢查，可評估在 build pipeline 加入 lint step（屬未來架構候選）

---

（本文件結束）
