# Phase 1 Completion Report：第 1 階段收尾正式報告

> **本文件性質**：completion **final** report（第 1 階段收尾正式報告）。
>
> 於 Phase 9-z-c（commit `4f4349c`）之 completion candidate 版本基礎上升正式 final，反映 Phase 9-i 系列 known blockers 3/3 全清、Phase 9-j JSON-LD landing verification 已封存、首篇真實 ready Blogger post `20260515-we-media-myself2` 通過完整 build × 5 pipeline 驗證之事實。

對應之上層文件：
- `docs/phase-1-completion-checklist.md`（Phase 9-z-b 落地之逐項對照清單；本文件之主要引用基準）
- `CLAUDE.md` §28 / §29 / §30（第一版 MVP 必做清單 + 不做清單 + 專案最終樣貌）
- `docs/future-roadmap.md` §2（Phase 8 / 9 跨 phase 路線總覽）
- `docs/phase-9j-jsonld-landing-verification.md`（Phase 9-j JSON-LD landing verification 封存）
- `docs/phase-9h-known-blockers.md`（Phase 9-h-full-build-verify-a 之 3 個 known blockers 修復紀錄）
- `docs/phase-8h-pre-analysis.md`（Phase 8-h legacy 退場前盤點分析）

---

## §1 文件目的

### 1.1 本文件是什麼

本文件為 BLOG 系統第 1 階段（Phase 0 ~ Phase 9-j 收尾止；含 Phase 8 sidecar 系列、Phase 9 book / relatedLinks / GitHub article block parity / 9-i blocker fixes / 9-j JSON-LD landing 全系列）之**正式 final completion report**。

升級時序：

1. Phase 9-z-b（`docs/phase-1-completion-checklist.md`，commit `4c87d1f`）已落地，提供完整對照基準（13 主節 / 525 行 / 含 §10 ~50 條真實作者使用 checklist）
2. Phase 9-z-c（本文件 candidate 版，commit `4f4349c`）已落地，封存當時「系統能力 ✅ 接近收尾 / 真實作者流程 🟡 尚待驗證」之雙層狀態
3. Phase 9-h-i 系列（commits `eced408` + `7be40a7` + `31ae053` + `7986d58`）完成 3/3 known blockers 修復（canonical placeholder / canonical resolver / promotion sidecar attach / GitHub cross-source）
4. Phase 9-j（commit `4d68f50`）封存 JSON-LD landing verification（兩端 BlogPosting + WebSite schema 已正式落地 + production-readiness 驗證 + we-media-myself2 `@id` 對齊紀錄）
5. 期間首篇真實 ready Blogger post `20260515-we-media-myself2`（commit `8332d82`）通過完整 build × 5 pipeline，驗證 canonical / JSON-LD / copy-helper / promotion 全鏈正確
6. Phase 9-z-d（本批）將原 candidate 版升為正式 final，反映上述既成事實

### 1.2 本文件不是什麼

- ❌ **不是** Phase 8-h legacy fallback removal 之啟動報告（Phase 8-h-a pre-analysis 已落地於 commit `a538564`；Phase 8-h-b ~ 8-h-z 退場批仍未啟動）
- ❌ **不是** Phase 9-g-g（relatedLinks / otherLinks JSON-LD `mentions` / `isPartOf`）之啟動報告
- ❌ **不是** Phase 9-f-g（Book / Periodical structured data）之啟動報告
- ❌ **不是** Phase 9-h-f（兩端 Related Posts auto block）之啟動報告
- ❌ **不是**「Phase 1 內所有 article block 皆 live activated」之背書（仍有 4 個 dormant blocks 屬作者內容路徑，**不視為** Phase 1 阻擋；詳見 §8.5）
- ❌ **不是** `dist/sitemap.xml` / `dist/robots.txt` 補檔批（系統 ready；屬下一批可選 quick win）
- ❌ **不是** Google Rich Results Test 驗證批（屬作者持續執行之 post-Phase-1 author SOP）

### 1.3 「系統能力」與「真實作者使用流程」之兩層完成度區分

承 `docs/phase-1-completion-checklist.md` §1.2 之兩層完成度區分：

| 層級 | 定義 | 本文件對應段落 |
|---|---|---|
| **系統能力完成度** | 程式碼、模板、設定、文件、build 流程、validate 規則皆已 landed | §4.1 / §5 / §6 / §7 |
| **真實作者使用流程完成度** | ≥ 1 篇真實 ready post 通過完整 build × 5 / validate / 兩平台輸出檢查 / Blogger 平台貼上 / publishedUrl 回填 全流程 | §4.2 |

**兩層皆已達成 Phase 1 final 條件**（per §4）。

**後續每篇新文章之發布 SOP**（含 `docs/phase-1-completion-checklist.md` §10 之 ~50 條操作 checklist）屬**持續適用**之手冊，不視為 Phase 1 一次性阻擋；詳見 §10。

---

## §2 Executive Summary

### 2.1 一句話現況

> **「BLOG 系統第 1 階段已達 final 條件：CLAUDE.md §28 17 條 MVP 必做項目全數系統落地、6/6 conditional article block 兩端 parity 達成、JSON-LD 兩端基礎正式落地並通過 we-media-myself2 真實 dist 驗證、Phase 9-i known blockers 3/3 全清、首篇真實 ready Blogger post 通過完整 build × 5 pipeline。後續強化（Phase 8-h legacy 退場 / 9-g-g 與 9-f-g JSON-LD 進階 / Google Rich Results Test 驗證 / sitemap dist 補檔 / Phase 9-h-f Related Posts auto）皆屬 post-Phase-1 範疇，不阻擋本文件升正式 final。」**

### 2.2 三段式分層摘要

**已完成**：
- CLAUDE.md §28 17 條 MVP 必做項目全數系統落地
- CLAUDE.md §29 12 項第一版不做清單全維持不做
- Phase 0 ~ 7 主軸全達標
- Phase 8-a ~ 8-g 主軸全達標
- Phase 9-b / 9-c / 9-e / 9-f-c / 9-g / 9-h 主軸全達標
- Phase 9-i 系列 known blockers 3/3 全清（commits `eced408` + `7be40a7` + `31ae053` + `7986d58`）
- Phase 9-j JSON-LD landing verification 已封存（commit `4d68f50`）
- 6/6 conditional article blocks 達成 100% Blogger ↔ GitHub parity
- relatedLinks / otherLinks 全套系統落地（schema / template / validate / Blogger render / copy-helper [13] / publish-checklist / GitHub render）
- Phase 8-h pre-analysis 已封存（commit `a538564`；屬 post-Phase-1 退場批之前置）
- **首篇真實 ready Blogger post `20260515-we-media-myself2`** 通過完整 build × 5 pipeline；canonical 正確指向 `https://babel-lab.blogspot.com/2026/05/we-media-myself2.html`；兩端 BlogPosting JSON-LD `@id` / `mainEntityOfPage` 一致；copy-helper.txt 含 [12] book metadata + [13] relatedLinks；publish-checklist 含 book-review / magazine + relatedLinks / otherLinks 內容檢查；FB promotion txt 含正式 URL（per Phase 9-i-b2 修復）
- **relatedLinks live activated**（we-media-myself2 dist post.html 含 6 個 relatedLinks 命中；GitHub 端 cross-source mirror page 同步輸出）
- **Hashtag live activated**（既有 ready posts 之 dist 含 hashtag 區塊）

**Post-Phase-1 / 後續強化**（trigger condition 多項已滿足，但屬 post-Phase-1 範疇）：
- **Phase 8-h**：legacy 欄位退場（17 個 source code 位置；trigger condition「Phase 1 final 封存」於本批達成；可進入 Phase 8-h-b baseline run）
- **Phase 9-g-g**：relatedLinks / otherLinks JSON-LD `mentions` / `isPartOf`（trigger 已滿足；待 Google Rich Results Test 驗證 BlogPosting 基礎後評估）
- **Phase 9-f-g**：Book / Periodical structured data（trigger 已滿足；同上）
- **Phase 9-h-f**：兩端 Related Posts auto block（需 ≥ 5 篇 ready post；當前 3 篇）
- **Phase 8-g-1**：fixture / sample end-to-end 驗證（需作者人工確認部署隔離流程）
- **Phase 8-g candidate 6**：first article `.fb.md` hashtags fallback（nice-to-have）
- **Google Rich Results Test 驗證**：作者持續執行（屬 post-Phase-1 author SOP）
- **`dist/sitemap.xml` + `dist/robots.txt` 補檔**：✅ landed（Phase 9-g-g-c；2026-05-19 09:49；`npm run build:sitemap` 成功，wrote 10 url entries）
- **圖書館可借類型 enum schema 擴充**（一般圖書 / 電子書 / DVD / 雜誌 / Netflix 等正式 type）：屬未來 schema 候選

**Dormant article blocks**（infrastructure ready；屬作者內容路徑，**不視為** Phase 1 阻擋）：
- Cover（既有 ready posts `cover` 多為空字串）
- Affiliate Box top/bottom（需 ready post 含 `affiliate.links`）
- Download Box（需 ready download post 含 `download.fileUrl`）
- Book Photo（we-media-myself2 為 book-review 但 `book.showBookPhoto` 未啟用）

---

## §3 Current Snapshot

### 3.1 Git 狀態

| 項目 | 值 |
|---|---|
| **HEAD**（本文件升正式 final 前） | `4d68f50 docs(json-ld): add phase 9j landing verification` |
| **working tree** | clean |
| **本文件批次** | Phase 9-z-d（純 docs；升正式 final） |

### 3.2 Baseline 指標

| 指標 | 數值 | 來源 |
|---|---|---|
| `validate:content` baseline | `0 error / 22 warning on 17 post(s)`（`0/22/17`） | `docs/phase-9g-completion-report.md` §5.1 / `docs/phase-9h-completion-report.md` §6.1 / `docs/phase-1-completion-checklist.md` §2.2 |
| Ready GitHub posts | 2 篇（`20260504-github-pages-blog-planning` + `20260504-portable-blog-system-mvp`；均為 `contentKind: tech-note`） | `content/github/posts/*.md` |
| Ready Blogger posts | **1 篇**（`20260515-we-media-myself2`；book-review；commit `8332d82` 遷移自既有 Blogger 文章；`20260504-sample-book-review` 仍為 draft） | `content/blogger/posts/*.md` |
| Cross-source GitHub mirror posts | 1 篇（we-media-myself2 透過 `publishTargets.github.enabled: true` 同步輸出至 `dist/posts/we-media-myself2/index.html`；per Phase 9-i-f-b commit `7986d58`） | `dist/posts/` |
| Validation fixtures | 15 個（series / book / fb / relatedLinks-otherLinks 規則） | `content/validation-fixtures/{github,blogger}/posts/_test-*.md` |
| Article block parity（Blogger ↔ GitHub） | 6/6 conditional blocks 達成 100% | `docs/phase-9h-completion-report.md` §4 |
| Phase 9-h known blockers | 3/3 全清 | `docs/phase-9h-known-blockers.md` §6 / §7.1 |

### 3.3 主要 dist 產物狀態

| 產物 | 狀態 |
|---|---|
| `dist/index.html` + `dist/posts/{slug}/index.html` × 3（含 we-media-myself2 cross-source mirror）+ `dist/categories/` / `dist/tags/` / `dist/design-system/` | ✅ 存在 |
| `dist/sitemap.xml` / `dist/robots.txt` | ✅ 已補（Phase 9-g-g-c；2026-05-19 09:49；`npm run build:sitemap` 成功，wrote 10 url entries；dist 受 `.gitignore` 管理不入 commit）|
| `dist-blogger/posts/{slug}/{post.html,copy-helper.txt,meta.json,publish-checklist.txt}` × 2（含 we-media-myself2）| ✅ 存在 |
| `dist-blogger/theme/blogger-{tokens,components,article,full-style}.css` | ✅ 存在 |
| `dist-blogger/build-manifest.json` | ✅ 存在 |
| `dist-promotion/facebook/{site}/{slug}.txt`（2 enabled：we-media-myself2 + github-pages-blog-planning）+ `all-posts-index.txt` | ✅ 存在 |
| `dist-reports/{build,draft-posts,missing-tags,published-urls,series,book,check-broken-links,check-image-links}-report.{txt,json}` | ✅ 存在（8 類 × 2 格式）|

### 3.4 we-media-myself2 端對端驗證摘要

| 驗證點 | 結果 | 來源 |
|---|---|---|
| `dist/posts/we-media-myself2/index.html` 產出 | ✅ 11,035 bytes | Phase 9-i-f-b commit `7986d58` |
| `dist-blogger/posts/we-media-myself2/{post.html,meta.json,copy-helper.txt,publish-checklist.txt}` 全 4 檔產出 | ✅ | Phase 9-h-known-blockers §2.2 |
| canonical 指向 Blogger publishedUrl | ✅ `https://babel-lab.blogspot.com/2026/05/we-media-myself2.html` | Phase 9-i-b2 commit `7be40a7` |
| 兩端 BlogPosting JSON-LD `@id` / `mainEntityOfPage` 一致 | ✅ | Phase 9-j §2.2 |
| example.com placeholder 全域殘留 | ✅ 0 命中 | Phase 9-i-b1 commit `eced408` + Phase 9-i-b2 |
| copy-helper [12] book metadata 區塊 | ✅ 正確輸出（媒體類型 / 書名 / 作者 / 出版社 4 欄位）| Phase 9-f-c-b + 9-h-fix-copy-helper-bug-b commit `7212ccd` |
| copy-helper [13] relatedLinks / otherLinks 區塊 | ✅ 正確輸出（含 6 個 internal cross-link）| Phase 9-g-d-c + Phase 9-g-d-c-fix `b97c57a` |
| publish-checklist book-review / magazine 內容檢查 | ✅ 存在 | Phase 9-f-c-c-b |
| publish-checklist relatedLinks / otherLinks 內容檢查（含 `hasInternalLink` nested checkbox）| ✅ 存在 | Phase 9-g-e-b |
| FB promotion txt（`dist-promotion/facebook/blogger/we-media-myself2.txt`）| ✅ 647 bytes；含正式 URL | Phase 9-i-d-b commit `31ae053` |
| `total enabled` FB promotion count | ✅ 2（we-media-myself2 + github-pages-blog-planning）| 同上 |

### 3.5 最新 checklist 文件

- **`docs/phase-1-completion-checklist.md`**（commit `4c87d1f`，525 行，13 主節）
  - §3 CLAUDE.md §28 17 條 MVP 必做清單對照
  - §4 CLAUDE.md §29 12 條第一版不做清單對照
  - §5-7 Phase 0 ~ 9 完成對照
  - §8 18 個 article block × 6 維度對照
  - §10 真實作者使用流程 ~50 條 checklist（屬持續適用之 author SOP，per §10）
  - §12 兩層完成度判定 + 保守 wording

---

## §4 Phase 1 完成度判定

### 4.1 A 層：系統能力完成度

**狀態：✅ 已達 Phase 1 final 條件**

依據：

- CLAUDE.md §28 17 條 MVP 必做項目**全數系統落地**（per `docs/phase-1-completion-checklist.md` §3）
- CLAUDE.md §29 12 項第一版不做清單**全維持不做**（per 同檔 §4）
- Phase 0 ~ 7 主軸**全 ✅**（per §5）
- Phase 8-a ~ 8-g 主軸**全 ✅**（Phase 8-h pending 屬 post-Phase-1 清理工作，非新功能缺漏）
- Phase 9 主軸**全 ✅**（per §7；含 9-b / 9-c / 9-e / 9-f-c / 9-g / 9-h / 9-i / 9-j）
- Article block parity 100%（per §7.1）
- 輸出產物 9 大類**全可產出**（per §3.3；`sitemap.xml` / `robots.txt` 已於 Phase 9-g-g-c 補檔完成；2026-05-19 09:49）
- Phase 9-i 系列 known blockers 3/3 全清（per `docs/phase-9h-known-blockers.md` §7.1）
- JSON-LD landing verification 已封存（per `docs/phase-9j-jsonld-landing-verification.md` §2.1）

### 4.2 B 層：真實作者使用流程完成度

**狀態：✅ 已通過首篇真實 ready post 端對端驗證**

依據：

- **首篇真實 ready Blogger post `20260515-we-media-myself2`** 已通過完整 build × 5 pipeline（per §3.4 端對端驗證摘要 12 項全 ✅）
- 真實 publishedUrl 已回填至 `.publish.json`（`https://babel-lab.blogspot.com/2026/05/we-media-myself2.html`）
- canonical / JSON-LD / copy-helper / promotion 四鏈全部驗證正確（per §3.4）
- relatedLinks live activation 已達成（6 個 relatedLinks 命中 dist post.html；兩端 mirror 一致）
- Hashtag live activation 已達成（既有 ready GitHub posts 之 dist 含 hashtag 區塊）

**關於 §10 ~50 條 checklist 之說明**：

`docs/phase-1-completion-checklist.md` §10 之 ~50 條 checklist 屬**每篇文章發布之 author SOP**，**非** Phase 1 一次性阻擋。首篇 we-media-myself2 之發布實質涵蓋 §10 大部分操作（內容建立 / validate / build × 5 / 兩端檢查 / Blogger 平台貼上 / publishedUrl 回填 / FB 推廣準備），但本文件**不**逐項勾選封存 —— §10 為持續適用手冊，每篇後續新文章發布皆應對照。

### 4.3 雙層判定彙整

```
A 系統能力完成度       ✅ 已達 Phase 1 final 條件
B 真實作者使用流程完成度  ✅ 已通過 we-media-myself2 端對端驗證

Phase 1 整體判定        ✅ final / completion snapshot
                       └→ §10 author SOP 持續適用於後續每篇新文章
                       └→ post-Phase-1 強化路線可啟動（Phase 8-h / 9-g-g / 9-f-g / sitemap 補檔 / Rich Results Test）
```

---

## §5 已完成主要能力

本節彙整第 1 階段已 landed 之系統能力。詳細對照見 `docs/phase-1-completion-checklist.md` §3 / §5-7 / §9。

### 5.1 Markdown / frontmatter content pipeline

- **內容來源**：`content/{site}/posts/*.md` + `content/{site}/pages/*.md`（Phase 8-a / 8-b）
- **解析**：`src/scripts/parse-markdown.js`（含 body H1 → H2 自動降級）+ `gray-matter`
- **載入**：`src/scripts/load-posts.js` / `load-blogger-posts.js` / `load-github-posts.js`（含 draft / archived 過濾；含 cross-source mirror 載入，per Phase 9-i-f-b）
- **frontmatter 欄位字典**：詳見 `docs/content-schema.md` + `docs/publish-bundle.md` §2.6
- **sidecar bundle 三檔結構**：`.md` + `.publish.json` + `.fb.md`（Phase 8-a ~ 8-b）

### 5.2 normalized metadata

由 `src/scripts/normalize-post-output.js` 落地（Phase 8-d 起手 + 8-f / 8-g-18 / 8-g-19 補強）：

- `normalized.identity.contentKind`（含 legacy `type` fallback）
- `normalized.publish.canonical.{url,source}`（含 Phase 9-i-b2 之 Blogger publishedUrl 優先邏輯）
- `normalized.publish.blogger.tags`（含 `series.tags` inheritance；per 8-g-18-c）
- `normalized.promotion.facebook.{enabled,target,title,message,body,hashtags,finalUrl}`（含 series.hashtags / site default hashtags 多層 fallback；含 Phase 9-i-d-b 之 sidecar-first fallback chain）
- `normalized.series.{id,number,subtitle,resolvedTitle}`（per 8-f-2-b + resolve-series-title.js）

### 5.3 Blogger build

- **CLI**：`npm run build:blogger`（`src/scripts/build-blogger.js`）
- **輸出**：`dist-blogger/posts/{slug}/{post.html,copy-helper.txt,meta.json,publish-checklist.txt}` + `dist-blogger/index/blogger-home.html` + `dist-blogger/theme/*.css`
- **三種 mode**：full / summary / redirect-card（per `src/views/blogger/blogger-post-{full,summary,redirect-card}.ejs`）
- **首頁 / 目錄**：`blogger-home-index.ejs` + `blogger-category-index.ejs`
- **canonical resolver**（Phase 9-i-b2 後）：primaryPlatform=blogger + canonical=auto + publishedUrl 已知 → 直接使用 publishedUrl

### 5.4 GitHub build

- **CLI**：`npm run build:github` + `npm run build`（vite build）
- **輸出**：`dist/` 全站（含 `index.html` / `posts/{slug}/` / `categories/` / `tags/` / `design-system/` / `404.html` / `assets/`）
- **本機 dev**：`npm run dev`
- **vite 設定**：`vite.config.js` + `vite-plugin-ejs`
- **Cross-source mirror**（Phase 9-i-f-b 後）：透過 `src/scripts/load-github-posts.js` 將 `publishTargets.github.enabled: true` 之 Blogger source posts 同步至 GitHub dist；canonical 對稱指向 Blogger publishedUrl

### 5.5 Promotion build

- **CLI**：`npm run build:promotion`（`src/scripts/build-promotion.js`）
- **輸出**：`dist-promotion/facebook/{site}/{slug}.txt` + `all-posts-index.txt`
- **模板**：`facebook-post.ejs`（full）+ `facebook-summary.ejs`（精簡，預留 mode 切換）+ `facebook-hashtags.ejs`（partial）
- **UTM 集中管理**：`content/settings/promotion.config.json`（per CLAUDE.md §4）
- **Sidecar-first fallback chain**（Phase 9-i-d-b 後）：`classifyFacebook` 先讀 `.fb.md` sidecar，再讀 legacy frontmatter；既有無 sidecar 之 post 走 legacyFb fallback

### 5.6 copy-helper

- **檔案**：`src/views/blogger/blogger-copy-helper.ejs`
- **13 個區塊**全數落地（含 Phase 9-f-c-b 之 [12] book metadata 11 欄位 + Phase 9-g-d-c 之 [13] relatedLinks / otherLinks 純文字確認區塊）
- **trim-newline pattern + EJS comment delimiter leak 預防**：per 9-g-d-c-fix（commit `b97c57a`）+ 9-h-fix-copy-helper-bug-b（commit `7212ccd`）+ Phase 9-h 全系列 inline 預防
- **we-media-myself2 實證**：[12] + [13] 區塊正確輸出（per §3.4）

### 5.7 publish checklist

- **檔案**：`src/views/blogger/blogger-publish-checklist.ejs`
- **conditional 區塊**：含 Phase 9-f-c-c-b 之 book-review / magazine 內容檢查 + Phase 9-g-e-b 之 relatedLinks / otherLinks 5 條 checkbox
- **對應人工 master**：`docs/checklists/blogger-publish-checklist.md`（12 條 master checkbox；含 Phase 9-g-e-c +1 條 relatedLinks / otherLinks 已核對）
- **we-media-myself2 實證**：book-review + relatedLinks 兩區塊正確輸出（per §3.4）

### 5.8 Article blocks（Hero / Cover / Article Body / Hashtag / Affiliate Box / Download Box / Book Photo / relatedLinks / otherLinks）

| 區塊 | Blogger | GitHub | landed phase | 啟用狀態 |
|---|---|---|---|---|
| Hero / Cover / Article Body | ✅ | ✅ | Phase 1 / 2 | 🟢 live（Cover 部分 dormant）|
| Hashtag | ✅ | ✅ | Phase 2-2-g / 9-h-d-b | 🟢 **live activated** |
| Affiliate Box top/bottom | ✅ | ✅ | Phase 2-2-p / 9-h-b-b | 🟡 dormant |
| Download Box | ✅ | ✅ | Phase 2-2-o / 9-h-c-b | 🟡 dormant |
| Book Photo | ✅ | ✅（dormant render） | Phase 2 / 9-h-e-b | 🟡 dormant |
| relatedLinks / otherLinks | ✅ | ✅ | Phase 9-g-d-b / 9-g-f-b | 🟢 **live activated**（we-media-myself2 6 命中）|

詳見 §7 對照表 + `docs/phase-9h-completion-report.md` §4。

### 5.9 Validation fixtures

- **位置**：`content/validation-fixtures/{github,blogger}/posts/_test-*.md`
- **fixtures**：15 個（series 5 + book 7 + fb 1 + related-links 4，部分共用）
- **設計**：每 fixture 嚴格只觸發指定 warning，無 noise
- **不被 build:* 掃描**：per Phase 8-e-6-b-1 既有設計
- **baseline 貢獻**：22 warnings 中之多數來自 fixtures（per `docs/phase-9g-completion-report.md` §5.1）

### 5.10 future-roadmap / checklists / 整體 docs

- **跨 phase 路線**：`docs/future-roadmap.md`（含 Phase 8 / 9 mega-row）
- **整體 docs**：40+ 檔；含 schema（content-schema / publish-bundle / publish-json-schema / fb-sidecar-schema / book-schema / related-links-schema / series-schema）+ architecture / requirements / design-system / link-rules / publish-workflow / migration-from-frontmatter / phase-X-completion-report.md 系列
- **操作型 checklists**：`docs/checklists/`（7 個：blogger-publish / github-deploy / fb-promotion / image-upload / seo / backup / sidecar-migration）
- **總驗收 checklist**：`docs/phase-1-completion-checklist.md`（Phase 9-z-b 落地）
- **Phase 1 final 報告**：本文件（Phase 9-z-d 落地）
- **JSON-LD landing 封存**：`docs/phase-9j-jsonld-landing-verification.md`
- **Known blockers 修復紀錄**：`docs/phase-9h-known-blockers.md`（3/3 completed）
- **Phase 8-h pre-analysis**：`docs/phase-8h-pre-analysis.md`（屬 post-Phase-1 退場批之前置）

---

## §6 relatedLinks / otherLinks 完成狀態

本系列為 Phase 9-g 系列之主軸，於 Phase 9-z-c candidate 版時為「系統完成、內容待驗證」最典型案例；本批升 final 時已透過 we-media-myself2 達成 live activation。

### 6.1 系統層全數完成（13 commits + 7 純分析批；per `docs/phase-9g-completion-report.md` §3）

| 層級 | 狀態 | landed commit / phase |
|---|---|---|
| **Schema 已定案** | ✅ | Phase 9-g-b commit `258ab9e`（`docs/related-links-schema.md` 10 主節） |
| platform 與 title / description **已拆開**（`[Youtube]` 等顯示前綴拆入 `platform`，**不**併入 `title`）| ✅ | per `docs/related-links-schema.md` §3.4（含正反例）|
| 5 個 templates 補入 sample frontmatter | ✅ | Phase 9-g-c-b commit `fbe6597` |
| 4 條 validate warning-only rules | ✅ | Phase 9-g-c-c commit `b05240b` |
| 4 個 validation fixtures | ✅ | Phase 9-g-c-c 同 commit |
| **Blogger render 已完成**（`blogger-post-full.ejs` 兩個 conditional `<aside>` + SCSS）| ✅ | Phase 9-g-d-b commit `500df12` |
| **Blogger copy-helper [13] 已完成**（純文字確認區塊；含 9-g-d-c-fix EJS comment 修正）| ✅ | Phase 9-g-d-c commit `f7cd5b9` + fix `b97c57a` |
| **Blogger publish-checklist 已完成**（4 條 always-show + 1 條 internal nested conditional checkbox）| ✅ | Phase 9-g-e-b commit `97e2c56` |
| **GitHub post-detail render 已完成**（mirror Blogger pattern；EJS comment 嚴格無 delimiter inline 預防）| ✅ | Phase 9-g-f-b commit `1bb807f` |
| docs sync（schema docs / future-roadmap / completion report / publish-workflow / blogger-publish-checklist） | ✅ | 9-g-c-d / 9-g-e-c / 9-g-e-d / 9-g-r / 9-g-f-c |

### 6.2 schema 設計關鍵點

- **頂層**：`relatedLinks: []` + `otherLinks: []`（兩個獨立 array；扁平結構；不需 discriminator 欄位）
- **per-item 8 欄位**：`kind`（必）/ `platform`（必）/ `title`（必）/ `url`（必）/ `description`（選）/ `order`（選）/ `target`（選；render 自動套）/ `rel`（選；render 自動套）
- **自動 rel 規則**：`kind === "internal"` → 不加 `target` / `rel`；`kind !== "internal"` → `target="_blank" rel="nofollow noopener"`
- **與 `blocks.relatedPosts` 為 two-track 獨立**（不互相 fallback；per `docs/related-links-schema.md` §2.2 / §7）
- **與 `affiliate.links` 嚴格分離**（販售 vs 來源 / 延伸閱讀；per §2.3 / §6）
- **internal link `url`** 必須是已發布後回填之真實 URL（不可預測 Blogger URL；per §5）

### 6.3 內容層 live activation 達成

**we-media-myself2 實證**（per `docs/phase-9h-known-blockers.md` §2.3）：

| Block signature | 命中數 | 狀態 |
|---|---|---|
| `lab-related-links`（dist-blogger）| 6 | ✅ live |
| `lab-related-links`（dist GitHub cross-source mirror）| 同步輸出 | ✅ live |

含 6 個 relatedLinks 命中 dist post.html；兩端 mirror 一致；copy-helper [13] + publish-checklist relatedLinks 區塊皆正確輸出。

### 6.4 結論

「系統完成、內容驗證已達成」：Phase 9-g relatedLinks / otherLinks 系列由 Phase 9-z-c candidate 時之「infrastructure 100% ready；ready post 啟用率 0%」案例，經 we-media-myself2 migration 達成 live activation 狀態。後續每篇新文章可依需要自由套用此兩 array 欄位。

---

## §7 GitHub / Blogger article block parity

本節為 Phase 9-h 結果之摘要（per `docs/phase-9h-completion-report.md` §4）。

### 7.1 6/6 conditional article blocks 達成 100% Blogger ↔ GitHub parity

| # | 區塊 | Blogger（`blogger-post-full.ejs`） | GitHub（`post-detail.ejs`） | landed phase | 當前啟用狀態 |
|---|---|---|---|---|---|
| 1 | relatedLinks / otherLinks（`<aside>`）| ✅ | ✅ | 9-g-d-b / 9-g-f-b | 🟢 **live**（we-media-myself2）|
| 2 | Affiliate Box top（`<aside>`）| ✅ | ✅ | pre-9-h / 9-h-b-b | 🟡 dormant |
| 3 | Affiliate Box bottom（`<aside>`）| ✅ | ✅ | pre-9-h / 9-h-b-b | 🟡 dormant |
| 4 | Download Box（`<aside>`）| ✅ | ✅ | pre-9-h / 9-h-c-b | 🟡 dormant |
| 5 | Hashtag（`<ul>` 內 `<span>`）| ✅ | ✅ | pre-9-h / 9-h-d-b | 🟢 **live activated** |
| 6 | Book Photo（`<figure>` + `<img>` + 可選 `<figcaption>`）| ✅ | ✅ | pre-9-h / 9-h-e-b | 🟡 dormant render |

### 7.2 永久區塊（Hero / Cover / Article Body）

| 區塊 | Blogger | GitHub | 啟用狀態 |
|---|---|---|---|
| Hero | ✅ | ✅ | 🟢 live |
| Cover | ✅ | ✅ | 🟡 dormant（既有 ready posts `cover` 多為空字串）|
| Article Body | ✅ | ✅ | 🟢 live |

### 7.3 啟用狀態彙整（Phase 9-z-d 升 final 時 snapshot）

- **live activated**：Hashtag（既有 ready GitHub posts）+ relatedLinks / otherLinks（we-media-myself2；6 命中）
- **4 個 dormant render**：Affiliate Box top/bottom（共算 1 區塊家族）+ Download Box + Book Photo + Cover
- **唯一缺漏（非 dormant 而是未實作）**：Related Posts auto block（自動推薦邏輯；Phase 9-h-f post-Phase-1 candidate；per `docs/phase-9h-completion-report.md` §8.1）

### 7.4 設計原則彙整

per `docs/phase-9h-completion-report.md` §1：

1. **mechanical mirror**：GitHub 端 EJS render pattern 完整 mirror Blogger 端
2. **不接 normalize-post-output**：直接讀 `post.*` 欄位
3. **lab-container 包裝**：GitHub 端每區塊包覆 `<div class="lab-container">`
4. **trim-newline pattern + EJS comment 嚴格無 delimiter 字符**：對既有無對應 frontmatter 之 ready posts 達 byte-identical-modulo-builtAt
5. **single-file implementation commit precedent**：每實作批僅 1 個檔案被 staged

---

## §8 Post-Phase-1 / 後續強化項目

本節列出**升 Phase 1 final 後仍待後續批次處理**之強化項目。皆**不阻擋** Phase 1 final 之宣告。

### 8.1 Phase 9-g-g：relatedLinks / otherLinks JSON-LD `mentions` / `isPartOf`

- **狀態**：✅ **landed / closed**（2026-05-18；per `docs/phase-9g-g-completion-report.md`）
- **歷史脈絡**：本項原列為 ⏸ deferred / post-Phase-1（per §11 順序 4）；trigger condition 已滿足後，於 2026-05-18 由 Claude Code 落地完整 Phase 9-g-g 系列（5 子批；4 commits）
- **範圍**：為 BlogPosting JSON-LD 補 schema.org `isPartOf`（永遠輸出；@type `Blog`）+ `mentions`（條件式輸出；@type `WebPage`；來源為 `post.relatedLinks` + `post.otherLinks`）；兩端 Blogger / GitHub mirror
- **landed commits**：
  - Phase 9-g-g-b `f5fb400`：docs-only pre-plan
  - Phase 9-g-g-c `70fbf22`：source 接入 isPartOf only
  - Phase 9-g-g-d `1d56f8a`：source 接入 mentions only
  - Phase 9-g-g-z `efed101`：completion report + docs sync
- **後續關聯**：本系列 closed 後，順序 1（Google Rich Results Test 驗證）仍由作者執行；通過後可評估啟動順序 5（Phase 9-f-g Book / Periodical structured data）
- **來源**：`docs/phase-9g-g-completion-report.md`（10 個 section；落地紀錄完整）/ `docs/phase-9g-completion-report.md` §8.3 / `docs/related-links-schema.md` §9.2 / §9.5 / `docs/phase-9j-jsonld-landing-verification.md` §4.1

### 8.2 Phase 9-f-g：Book / Periodical structured data

- **狀態**：✅ **Book mainEntity landed / closed**（2026-05-18；per `docs/phase-9f-g-completion-report.md`）；Periodical / magazine 延後至 **Phase 9-f-g2**（deferred）
- **歷史脈絡**：本項原列為 ⏸ deferred / post-Phase-1（per §11 順序 5）；trigger condition 已滿足後，於 2026-05-18 由 Claude Code 落地 Phase 9-f-g 系列第一版（Book mainEntity；5 子批；3 commits）；Periodical / magazine 因當前 0 ready magazine post 仍 deferred 至 Phase 9-f-g2
- **第一版範圍**：BlogPosting JSON-LD 新增 `mainEntity` of `@type: Book`（條件式：`post.book` object + `book.mediaType` 缺省或 === `"book"` + `book.title` non-empty）；只支援 `mediaType="book"`；兩端 Blogger / GitHub mirror
- **landed commits**：
  - Phase 9-f-g-b `10df61c`：docs-only pre-plan
  - Phase 9-f-g-c `b394e4f`：source 接入 Book mainEntity
  - Phase 9-f-g-z `283af96`：completion report + docs sync
- **後續關聯**：Google Rich Results Test 對含 mainEntity Book 之新 schema 仍由作者執行（屬作者 SOP；**非 Claude 已執行**）；Periodical / magazine structured data 延後至 Phase 9-f-g2（trigger：首篇 ready magazine post + Rich Results Test 對應驗證）
- **來源**：`docs/phase-9f-g-completion-report.md`（10 sections；落地紀錄完整）/ `docs/phase-9f-g-pre-plan.md` / `docs/book-schema.md` §9 / `docs/seo-ga4-adsense.md` §7.4.2 / `docs/future-roadmap.md` Phase 9-f 系列補述 / `docs/phase-9j-jsonld-landing-verification.md` §4.2

### 8.3 Phase 8-h：legacy 欄位退場

- **狀態**：✅ **landed**（Phase 8-h 系列實質完成；per `docs/phase-8h-completion-report.md`）
- **範圍**：跨 6 個 source code 檔案、17 個 legacy 位置（per `docs/phase-8h-pre-analysis.md` §3）；含 `validate-content.js` / `normalize-post-output.js` / `build-blogger.js` / `build-promotion.js` / `resolve-placeholders.js`；**不**含 `parse-markdown.js` H1→H2 自動降級（屬永久 SEO 防呆，per §3.3）
- **退場結果**：**15 of 15 in-scope positions retired-or-migrated（100%）**；含 14 個完全退場 + 1 個 source migration（#12 meta.json type；field 永久保留 schema 相容性）+ 1 個 skipped（#12 field removal；Phase 8-h-e-2-b 永久 deferred）
- **landed commits**：Phase 8-h-a-doc `a538564` / 8-h-b `c9ce52c` / 8-h-c-pre `130097a` / 8-h-c-pre-1 `546686d` / 8-h-c `bc41b80` / 8-h-d-1 `f05de63` / 8-h-d-2 `28096e3` / 8-h-d-3 `fa74d02` / 8-h-d-4 `0b47f5b` / 8-h-e-1 `6ce66f4` / 8-h-e-2-a `b49e2c3` / 8-h-f-content-migration-a `6f1b3c9` / 8-h-f `72db25f` / 8-h-z（本系列收尾批；docs sync）
- **規範**（為歷史脈絡保留）：拆批建議 per `docs/phase-8h-pre-analysis.md` §5；fixture 補強 per `docs/phase-8h-c-pre-plan.md` §5.2；regression handling（8-h-f）per `docs/phase-8h-completion-report.md` §4

### 8.4 Phase 9-h-f：兩端 Related Posts auto block

- **狀態**：⏸ future candidate / post-Phase-1
- **範圍**：跨兩端（GitHub + Blogger）之**自動**相關文章推薦邏輯（依 tags / category / contentKind / series.id 計算）
- **與 relatedLinks / otherLinks 之關係**：屬 two-track 獨立機制（不互相 fallback）
- **trigger condition**：作者 ≥ 5 篇 ready post（當前 3 篇；推薦演算法需多文章樣本才有意義）
- **來源**：`docs/phase-9h-completion-report.md` §8.1

### 8.5 Dormant article blocks

- **狀態**：🟡 dormant render；infrastructure ready；**不視為 Phase 1 阻擋**
- **範圍**：Cover / Affiliate Box top/bottom / Download Box / Book Photo 共 4 個區塊
- **性質**：屬作者內容路徑（需特定 contentKind 之 ready post + 對應 frontmatter 欄位）
- **後續啟動方式**：作者撰寫對應類型 post 並填欄位即自動 live activate；不需新增任何 source / build pipeline 修改

### 8.6 Phase 8-g-1：fixture / sample end-to-end 驗證

- **狀態**：⏸ deferred / post-Phase-1
- **範圍**：`content/{site}/posts/_sample-*.md` end-to-end 驗證流程
- **理由**：ready fixture 會進入正式 dist / sitemap / promotion；本系統無 noindex / staging dist 機制可隔離
- **trigger condition**：作者人工確認部署流程能隔離 `_sample-` 內容
- **來源**：`docs/future-roadmap.md` §4

### 8.7 Phase 8-g candidate 6：first article `.fb.md` hashtags fallback

- **狀態**：⏸ deferred / nice-to-have / Phase 8-h+
- **範圍**：系列首篇 `.fb.md` hashtags fallback（屬「跨文章查找邏輯」之 implicit ergonomic shortcut）
- **理由**：既有 explicit FB hashtags fallback chain（`series.hashtags` / `defaultHashtags` / `series.tags`）已覆蓋主要使用情境
- **來源**：`docs/phase-8g-completion-report.md` §3.14 / §8.8

### 8.8 Google Rich Results Test 驗證

- **狀態**：⏸ post-Phase-1 author SOP
- **範圍**：作者於 [Google Rich Results Test](https://search.google.com/test/rich-results) 對 we-media-myself2 之 BlogPosting JSON-LD 進行驗證
- **trigger condition**：we-media-myself2 已發布至 Blogger（per Phase 9-i-b2 已確認 publishedUrl）
- **後續用途**：驗證通過後可評估啟動 Phase 9-g-g / 9-f-g JSON-LD 進階強化

### 8.9 `dist/sitemap.xml` + `dist/robots.txt` 補檔

- **狀態**：✅ landed（Phase 9-g-g-c；2026-05-19 09:49）
- `dist/sitemap.xml`：✅ 已補
- `dist/robots.txt`：✅ 已補
- **補檔批次**：Phase 9-g-g-c
- **補檔時間**：2026-05-19 09:49
- **指令**：`npm run build:sitemap`
- **結果**：成功；wrote 10 url entries
- **說明**：dist 產物受 `.gitignore` 管理，不納入 commit；後續部署前需確認 `build:sitemap` 已執行或納入部署流程

### 8.10 圖書館可借類型 enum schema 擴充

- **狀態**：⏸ post-Phase-1 schema 候選
- **範圍**：為 `relatedLinks` / `otherLinks` 之 `platform` 欄位補正式「媒介類型」維度（一般圖書 / 電子書 / DVD / 雜誌 / Netflix 等）
- **當前對應**：platform 為自由字串（可填站台名稱），可表達但無正式分類 enum
- **trigger condition**：作者實際使用過程中明確需求

---

## §9 為什麼 Phase 1 可以升正式 final

本節說明 §4.1 / §4.2 / §4.3 之**升 final 依據**，並劃清「Phase 1 final」與「Phase 1 100% 包含所有後續強化」之邊界。

### 9.1 系統能力 17 條 MVP 必做項目全數系統落地

CLAUDE.md §28 17 條 MVP 必做清單**全 ✅**（per §3 / `docs/phase-1-completion-checklist.md` §3）：

- 專案資料夾結構 / README / CLAUDE.md / docs / settings JSON / 範例文章 / GitHub 全部頁面 / Blogger full / summary / redirect-card / copy-helper / publish-checklist / Blogger CSS 匯出 / FB promotion / Design System / SCSS / Sticky Header + Mobile Drawer + Back to Top / link processor / GA4 events / sitemap + robots（系統 ready；dist 補檔已於 Phase 9-g-g-c landed）

第一版不做清單 12 項**全維持不做**。

### 9.2 真實作者使用流程已通過首篇 ready post 端對端驗證

we-media-myself2 通過完整 build × 5 pipeline（per §3.4 12 項全 ✅）：

- canonical 正確指向 Blogger publishedUrl（per Phase 9-i-b2）
- 兩端 BlogPosting JSON-LD `@id` 一致（per Phase 9-j）
- copy-helper / publish-checklist 全 13 + book + relatedLinks 區塊正確輸出
- FB promotion txt 含正式 URL（per Phase 9-i-d-b）
- relatedLinks live activation 達成（6 命中）
- example.com placeholder 全域 0 殘留

這證明系統能力與作者工作流程之**整合可用性**已驗證。

### 9.3 Phase 9-i 系列 known blockers 3/3 全清

per `docs/phase-9h-known-blockers.md` §7.1：

- ✅ Blocker #1：GitHub cross-source dist 未產出（commit `7986d58`）
- ✅ Blocker #2：canonical.resolved → example.com / GitHub path（commits `eced408` + `7be40a7`）
- ✅ Blocker #3：build:promotion sidecar attach 未生效（commit `31ae053`）

**remaining open blockers：0**（per §7.1）

### 9.4 JSON-LD 兩端基礎已正式落地並通過驗收

per `docs/phase-9j-jsonld-landing-verification.md` §2.1：

> JSON-LD 於本專案**已正式落地**；**不是** deferred；**不是** half-landed；**不是**未啟動。

Phase 5-b GitHub WebSite + BlogPosting + Phase 5-f-2 Blogger BlogPosting（full + summary）+ Phase 9-i-b2 we-media-myself2 `@id` 對齊修正全數 landed。

### 9.5 後續強化項目皆屬 post-Phase-1，不阻擋 final 宣告

| 後續項目 | 性質 | 是否阻擋 Phase 1 final |
|---|---|---|
| Phase 9-g-g / 9-f-g JSON-LD 進階 | 屬未來；需 Google Rich Results Test 驗證 | ❌ 不阻擋 |
| Phase 8-h legacy 退場 | 屬清理；不影響系統能力 | ❌ 不阻擋（且本文件升 final 反為 Phase 8-h 之 trigger condition）|
| Dormant article blocks | 屬作者內容問題；不影響系統結構 | ❌ 不阻擋 |
| Phase 9-h-f Related Posts auto | 屬未來；CLAUDE.md §17 列為 Optional | ❌ 不阻擋 |
| Google Rich Results Test | 屬作者持續 SOP；持續適用 | ❌ 不阻擋 |
| `dist/sitemap.xml` + `dist/robots.txt` 補檔 | ✅ 已補（Phase 9-g-g-c；2026-05-19 09:49）| ❌ 不阻擋 |

### 9.6 結論

✅ **Phase 1 final / completion snapshot 條件已達成**：系統能力 17 條全 ✅ + 真實作者流程已通過首篇 ready post 端對端驗證 + known blockers 3/3 全清 + JSON-LD 兩端基礎已落地。

後續強化路線可啟動，皆**不阻擋**本文件升 final。

---

## §10 後續作者 SOP（持續適用；不視為 Phase 1 一次性阻擋）

`docs/phase-1-completion-checklist.md` §10 之 ~50 條 checklist 屬**每篇新文章發布之 author SOP**，**非** Phase 1 一次性阻擋。

### 10.1 §10 之新定位

本文件升 Phase 1 final 後，`docs/phase-1-completion-checklist.md` §10 之角色由「Phase 1 收尾阻擋條件」轉為「**每篇新文章發布之持續適用手冊**」。

- 首篇 we-media-myself2 之發布實質涵蓋 §10 大部分操作（內容建立 / validate / build × 5 / 兩端檢查 / Blogger 平台貼上 / publishedUrl 回填 / FB 推廣準備）
- 後續每篇新文章發布皆應對照 §10 各子節執行
- **本文件不**逐項勾選封存 §10 50 條（per 用戶 Phase 9-z-d 指示「不要逐項補完 §10 50 條作者 checklist」）

### 10.2 每篇新文章發布建議參考路徑

對應 `docs/publish-workflow.md` §8-§16（Phase 9-b landed 之作者 SOP）：

1. 建立 `.md` + `.publish.json` + 可選 `.fb.md`（per §10.1）
2. 填 frontmatter / book / relatedLinks / affiliate / download 等欄位（依文章類型）
3. validate（`npm run validate:content`）
4. build × 5（`npm run build:github` / `build:blogger` / `build:promotion` / `build:sitemap` / `build:blogger-theme`）
5. 檢查兩端 dist 與 copy-helper / publish-checklist
6. 貼至 Blogger 後台、發布、取得正式 URL
7. 回填 `publishedUrl`（`npm run backfill:url --slug={slug}`）
8. 重 build:blogger / build:promotion
9. 貼 FB 推廣文案

### 10.3 後續 dormant blocks 可依需要啟動

per §8.5：當作者撰寫對應類型 post 並填欄位時，dormant article blocks 自動 live activate；不需新增任何 source / build pipeline 修改。

---

## §11 後續啟動順序建議

本文件升 Phase 1 final 後，後續強化路線之**建議順序**（每候選獨立批次）：

### 順序 1：Google Rich Results Test 驗證（屬作者 post-Phase-1 SOP）

- **負責**：作者本人
- **範圍**：對 we-media-myself2 之 BlogPosting JSON-LD 進行 Rich Results Test 驗證
- **觸發條件**：✅ 已滿足（we-media-myself2 已發布；canonical 已正確）
- **預期效益**：驗證 BlogPosting 基礎 schema 通過 → 為順序 4 / 5 鋪路

### 順序 2：Phase 8-h-b legacy 退場前 baseline run（可選 quick win）

- **負責**：Claude Code
- **範圍**：跑 build × 5 + validate + 7 個 report scripts；產出 `docs/phase-8h-baseline-snapshot.md`；含 dist hash snapshot
- **觸發條件**：✅ 已滿足（本文件升 final 後）
- **預期效益**：為後續 8-h-c ~ 8-h-z 退場批提供 regression 對照基準；順帶補 `dist/sitemap.xml` + `dist/robots.txt`

### 順序 3：Phase 8-h 退場批（依序 8-h-c → 8-h-d-1 ~ d-4 → 8-h-e-1 / e-2 → 8-h-f → 8-h-z）

- **負責**：Claude Code（建議拆 9-11 commits）
- **範圍**：per `docs/phase-8h-pre-analysis.md` §5
- **觸發條件**：✅ 已滿足（順序 2 完成後）
- **預期效益**：source code 層 legacy fallback 全清；codebase 乾淨度提升

### 順序 4：Phase 9-g-g JSON-LD `mentions` / `isPartOf`

- **狀態**：✅ **landed / closed**（2026-05-18；per `docs/phase-9g-g-completion-report.md`）
- **歷史脈絡**：本項原列為 post-Phase-1 順序 4；觸發條件原為「順序 1 通過 Rich Results Test 驗證後啟動」；於 2026-05-18 由作者主動選擇略過 Rich Results Test 先啟動 Phase 9-g-g 系列，並完整落地
- **負責**：Claude Code（實際拆 5 子批：a/b/c/d/z；4 commits）
- **範圍**：BlogPosting JSON-LD 補 `isPartOf`（永遠輸出）+ `mentions`（條件式輸出；來源為 `post.relatedLinks` + `post.otherLinks`）；兩端 Blogger / GitHub mirror
- **landed commits**：`f5fb400`（pre-plan）/ `70fbf22`（isPartOf source）/ `1d56f8a`（mentions source）/ `efed101`（completion report + docs sync）
- **後續驗證**：Google Rich Results Test 對含 isPartOf + mentions 之新 schema 仍待作者執行；屬順序 1 之延伸驗證

### 順序 5：Phase 9-f-g Book / Periodical structured data

- **狀態**：✅ **Book mainEntity landed / closed**（2026-05-18；per `docs/phase-9f-g-completion-report.md`）；Periodical / magazine 延後至 **Phase 9-f-g2**
- **歷史脈絡**：本項原列為 post-Phase-1 順序 5 structured data enhancement；觸發條件原為「同順序 4（順序 1 通過 Rich Results Test 驗證後）」；於 2026-05-18 由作者主動選擇略過 Rich Results Test 先啟動 Phase 9-f-g 系列；第一版只完成 Book，Periodical / magazine 因當前 0 ready magazine post 延後
- **負責**：Claude Code（實際拆 5 子批：a/b/c/d/z；3 commits）
- **第一版範圍**：BlogPosting JSON-LD 新增 `mainEntity` of `@type: Book`；只支援 `mediaType="book"`；兩端 Blogger / GitHub mirror
- **landed commits**：`10df61c`（pre-plan）/ `b394e4f`（Book mainEntity source）/ `283af96`（completion report + docs sync）
- **後續驗證**：Google Rich Results Test 對含 mainEntity Book 之新 schema 仍待作者執行；屬作者 SOP，非 Claude 範疇
- **後續延伸**：Periodical / magazine structured data 延後至 **Phase 9-f-g2**（trigger：首篇 ready magazine post + Rich Results Test 驗證）

### 順序 6：Phase 9-h-f 兩端 Related Posts auto block

- **負責**：Claude Code（建議拆 3 子批：GitHub-only / Blogger-only / 共用邏輯）
- **範圍**：跨兩端 auto 推薦邏輯
- **觸發條件**：作者 ≥ 5 篇 ready post

### 11.1 保守原則

- 每批獨立 commit；不混入跨類變動
- 不為趕進度而合併不相干批次
- 順序 1 屬作者個人工作；其餘皆可待 Claude 批次處理

---

## §12 結論

### 12.1 雙層彙整

| 維度 | 狀態 | 措辭 |
|---|---|---|
| **系統能力** | ✅ | 已達 Phase 1 final 條件 |
| **真實作者使用流程** | ✅ | 已通過 we-media-myself2 端對端驗證 |
| **整體第 1 階段** | ✅ | **final / completion snapshot** |

### 12.2 正式 final 結論

> BLOG 系統第 1 階段之**系統能力已達 final 條件**：CLAUDE.md §28 17 條 MVP 必做項目全數系統落地、CLAUDE.md §29 12 項第一版不做清單全維持不做、Phase 0 ~ 9 主軸全 ✅、6/6 conditional article block 兩端 parity 達成、Phase 9-i known blockers 3/3 全清、Phase 9-j JSON-LD landing verification 已封存。
>
> **真實作者使用流程已通過首篇 ready post 端對端驗證**：`20260515-we-media-myself2` 通過完整 build × 5 pipeline；canonical / JSON-LD / copy-helper / promotion 全鏈驗證正確；relatedLinks live activation 達成。
>
> **後續強化路線**（Phase 8-h legacy 退場 / 9-g-g 與 9-f-g JSON-LD 進階 / Google Rich Results Test 驗證 / sitemap dist 補檔 / Phase 9-h-f Related Posts auto）皆屬 post-Phase-1 範疇，**不阻擋**本文件升正式 final。後續每篇新文章發布應對照 `docs/phase-1-completion-checklist.md` §10 之 author SOP。
>
> 本文件視為**正式 Phase 1 final / completion snapshot**；繼承自 Phase 9-z-c candidate report 之內容基礎，於 Phase 9-z-d 完成升級。

### 12.3 邊界聲明

- 本文件**不**主動觸發任何 source code 變動
- 本文件**不**主動觸發 build / validate / 內容修改
- 本文件**不**啟動 Phase 8-h / 9-g-g / 9-f-g / 9-h-f 或其他 post-Phase-1 強化批
- 本文件**不**啟動 `dist/sitemap.xml` / `dist/robots.txt` 補檔
- 本文件**不**啟動 Google Rich Results Test 驗證
- 本文件落地後，working tree 應維持 clean；不混入任何其他變動

---

## §13 Cross-links

### 13.1 主要引用基準

- `docs/phase-1-completion-checklist.md`（Phase 9-z-b 落地之逐項對照清單；本文件之主要引用基準）
- `docs/future-roadmap.md`（跨 phase 路線總覽）

### 13.2 主要 phase completion reports

- `docs/phase-9g-completion-report.md`（relatedLinks / otherLinks metadata schema 系列收尾）
- `docs/phase-9h-completion-report.md`（GitHub article block parity 系列收尾）
- `docs/phase-9e-completion-report.md`（book / source metadata schema 系列收尾）
- `docs/phase-9f-c-completion-report.md`（Blogger manual posting helper / book metadata output 系列收尾）
- `docs/phase-8g-completion-report.md`（Phase 8-g 候選分析與排程系列收尾）
- `docs/phase-8b-completion-report.md` ~ `docs/phase-8f-completion-report.md`（Phase 8 各 sub-phase 收尾）

### 13.3 Phase 9-i / 9-j / 8-h-a 封存文件

- `docs/phase-9h-known-blockers.md`（Phase 9-i 系列 3/3 known blockers 修復紀錄）
- `docs/phase-9j-jsonld-landing-verification.md`（Phase 9-j JSON-LD landing verification 封存）
- `docs/phase-8h-pre-analysis.md`（Phase 8-h legacy 退場前盤點分析；屬 post-Phase-1 退場批之前置）

### 13.4 schema docs

- `docs/related-links-schema.md`（relatedLinks / otherLinks metadata schema）
- `docs/book-schema.md`（book / source metadata schema）
- `docs/series-schema.md`（series metadata schema）
- `docs/publish-bundle.md`（sidecar bundle 三檔結構）
- `docs/publish-json-schema.md`（`.publish.json` schema）
- `docs/fb-sidecar-schema.md`（`.fb.md` schema）
- `docs/content-schema.md`（content / frontmatter schema）

### 13.5 操作手冊

- `docs/publish-workflow.md`（作者 SOP）
- `docs/migration-from-frontmatter.md`（舊 frontmatter 遷移指引）

### 13.6 Checklists

- `docs/checklists/blogger-publish-checklist.md`（Blogger 發布 12 條 master checklist）
- `docs/checklists/github-deploy-checklist.md`
- `docs/checklists/fb-promotion-checklist.md`
- `docs/checklists/image-upload-checklist.md`
- `docs/checklists/seo-checklist.md`
- `docs/checklists/backup-checklist.md`
- `docs/checklists/sidecar-migration-checklist.md`

### 13.7 規範來源

- `CLAUDE.md`（專案開發規範；本文件嚴格遵守 §28 必做 / §29 不做 / §30 最終樣貌）

---

（本文件結束）
