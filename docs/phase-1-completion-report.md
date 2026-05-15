# Phase 1 Completion Report：第 1 階段收尾報告草案

> **本文件性質**：completion **candidate** report（收尾報告草案），**非**正式 final completion 宣告。
>
> 第 1 階段之系統能力已接近收尾，但「完整使用與測試」尚待真實作者 end-to-end 流程驗證。本文件依當前 snapshot 描述系統能力完成度，並明確列出剩餘驗收工作；待真實作者流程跑完後可考慮升級為正式 final report，或維持本文件並補入實際驗證結果。

對應之上層文件：
- `docs/phase-1-completion-checklist.md`（Phase 9-z-b 落地之逐項對照清單；本文件之主要引用基準）
- `CLAUDE.md` §28 / §29 / §30（第一版 MVP 必做清單 + 不做清單 + 專案最終樣貌）
- `docs/future-roadmap.md` §2（Phase 8 / 9 跨 phase 路線總覽）

---

## §1 文件目的

### 1.1 本文件是什麼

本文件為 BLOG 系統第 1 階段（Phase 0 ~ Phase 9-h 收尾止；含 Phase 8 sidecar 系列與 Phase 9 book / relatedLinks / GitHub article block parity 系列）之**收尾報告草案**。

撰寫時機點：Phase 9-z-b（`docs/phase-1-completion-checklist.md`，commit `4c87d1f`）已落地，提供完整對照基準；但 §10 真實作者使用流程 checklist（~50 條）尚未啟動，5/6 conditional article blocks 仍屬 dormant render。本文件因此採**草案形式**封存當前 snapshot，作為「系統能力完成 → 真實使用驗證 → 正式 final report」三階段中間之 milestone 記錄。

### 1.2 本文件不是什麼

- **不是**正式 final completion 宣告（per §4 完成度判定之 §4.2 保守 wording）
- **不是** Phase 8-h legacy 退場 / Phase 9-g-g 與 9-f-g JSON-LD / Phase 9-h-f Related Posts auto 等 deferred 項目之啟動報告
- **不是**「系統 100% 完成」之背書（避免該宣告引發後續批次過度自信）

### 1.3 「系統能力完成」與「完整使用與測試完成」之嚴格區分

承 `docs/phase-1-completion-checklist.md` §1.2 之兩層完成度區分：

| 層級 | 定義 | 本文件對應段落 |
|---|---|---|
| **系統能力完成度** | 程式碼、模板、設定、文件、build 流程、validate 規則皆已 landed | §4.1 / §5 / §6 / §7 |
| **完整使用與測試完成度** | 作者已**真實建立** ≥ 1 篇 ready post，完整跑過 build × 5 / validate / 兩平台檢查 / Blogger 貼上 / publishedUrl 回填全流程 | §4.2 / §10 |

本文件**不**將兩層混為一談；任何「Phase 1 已完成」之表述皆嚴格限定於系統能力層，不外延至完整使用層。

---

## §2 Executive Summary

### 2.1 一句話現況

> **「BLOG 系統第 1 階段之系統能力已接近收尾條件；Blogger / GitHub / Promotion / copy-helper / publish-checklist / validation / docs 七大主流程皆已具備可運轉之狀態。但第 1 階段尚不能宣告 100% 完成，因為真實作者 end-to-end 使用流程驗證尚未跑過，且 JSON-LD 進階強化 deferred、legacy 欄位退場 pending。」**

### 2.2 三段式分層摘要

**已完成**：
- CLAUDE.md §28 17 條 MVP 必做項目全數系統落地
- Phase 0 ~ 7 主軸全達標
- Phase 8-a ~ 8-g 主軸全達標（除 Phase 8-h legacy 退場 / 8-g-1 fixture 兩項 deferred）
- Phase 9-b / 9-c / 9-e / 9-f-c / 9-g / 9-h 主軸全達標
- 6/6 conditional article blocks 達成 100% Blogger ↔ GitHub parity
- relatedLinks / otherLinks 全套（schema / template / validate / Blogger render / copy-helper [13] / publish-checklist / GitHub render）系統落地完整

**待驗證**：
- §10 真實作者使用流程 checklist 0 條已勾選
- 5 個 article block 屬 dormant render（infrastructure ready；零個 ready post 啟用）
- `dist/sitemap.xml` / `dist/robots.txt` 當前缺檔（流程未跑而非系統缺漏）

**Deferred / Pending**：
- Phase 9-g-g：relatedLinks / otherLinks JSON-LD `mentions` / `isPartOf`
- Phase 9-f-g：Book / Periodical structured data
- Phase 8-h：legacy 欄位退場（跨 8 個 source code 位置）
- Phase 9-h-f：兩端 Related Posts auto block
- Phase 8-g-1：fixture / sample end-to-end 驗證
- Phase 8-g candidate 6：first article `.fb.md` hashtags fallback

---

## §3 Current Snapshot

### 3.1 Git 狀態

| 項目 | 值 |
|---|---|
| **HEAD**（本文件撰寫前） | `4c87d1f docs(phase-9z): draft Phase 1 completion checklist` |
| **working tree** | clean |
| **本文件批次** | Phase 9-z-c（純 docs；單檔新增） |

### 3.2 Baseline 指標

| 指標 | 數值 | 來源 |
|---|---|---|
| `validate:content` baseline | `0 error / 22 warning on 17 post(s)`（`0/22/17`） | `docs/phase-9g-completion-report.md` §5.1 / `docs/phase-9h-completion-report.md` §6.1 / `docs/phase-1-completion-checklist.md` §2.2 |
| Ready GitHub posts | 2 篇（`20260504-github-pages-blog-planning` + `20260504-portable-blog-system-mvp`；均為 `contentKind: tech-note`） | `content/github/posts/*.md` |
| Ready Blogger posts | 0 篇（`20260504-sample-book-review.md` 仍為 draft） | `content/blogger/posts/*.md` |
| Validation fixtures | 15 個（series / book / fb / relatedLinks-otherLinks 規則） | `content/validation-fixtures/{github,blogger}/posts/_test-*.md` |
| Article block parity（Blogger ↔ GitHub） | 6/6 conditional blocks 達成 100% | `docs/phase-9h-completion-report.md` §4 |

### 3.3 主要 dist 產物狀態

| 產物 | 狀態 |
|---|---|
| `dist/index.html` + `dist/posts/{slug}/index.html` × 2 + `dist/categories/` / `dist/tags/` / `dist/design-system/` | ✅ 存在 |
| `dist/sitemap.xml` / `dist/robots.txt` | ❌ 缺檔（系統 ready；最近一波 build 未跑 `npm run build:sitemap`） |
| `dist-blogger/posts/{slug}/{post.html,copy-helper.txt,meta.json,publish-checklist.txt}` | ✅ 存在 |
| `dist-blogger/theme/blogger-{tokens,components,article,full-style}.css` | ✅ 存在 |
| `dist-blogger/build-manifest.json` | ✅ 存在 |
| `dist-promotion/facebook/{site}/{slug}.txt` + `all-posts-index.txt` | ✅ 存在 |
| `dist-reports/{build,draft-posts,missing-tags,published-urls,series,book,check-broken-links,check-image-links}-report.{txt,json}` | ✅ 存在（8 類 × 2 格式） |

### 3.4 最新 checklist 文件

- **`docs/phase-1-completion-checklist.md`**（commit `4c87d1f`，525 行，13 主節）
  - §3 CLAUDE.md §28 17 條 MVP 必做清單對照
  - §4 CLAUDE.md §29 12 條第一版不做清單對照
  - §5-7 Phase 0 ~ 9 完成對照
  - §8 18 個 article block × 6 維度對照
  - §10 真實作者使用流程 ~50 條 checklist
  - §12 兩層完成度判定 + 保守 wording

---

## §4 Phase 1 完成度判定

### 4.1 A 層：系統能力完成度

**狀態：✅ 接近收尾條件 / 已達收尾條件**

依據：

- CLAUDE.md §28 17 條 MVP 必做項目**全數系統落地**（per `docs/phase-1-completion-checklist.md` §3）
- CLAUDE.md §29 12 項第一版不做清單**全維持不做**（per 同檔 §4）
- Phase 0 ~ 7 主軸**全 ✅**（per §5）
- Phase 8-a ~ 8-g 主軸**全 ✅**（除 8-h pending 屬清理工作非新功能缺漏）
- Phase 9 主軸**全 ✅**（per §7）
- Article block parity 100%（per §7.1）
- 輸出產物 9 大類**全可產出**（per §9；`sitemap.xml` 缺檔屬流程未跑）

**保留措辭**：使用「接近收尾」/「已達收尾條件」，**不**使用「100% 完成」/「正式完成」/「全部完成」。理由：Phase 8-h legacy 退場仍 pending；雖屬清理而非新增，但其存在代表系統內部仍有相容期過渡狀態。

### 4.2 B 層：完整使用與測試完成度

**狀態：🟡 尚待真實作者流程驗證**

依據：

- `docs/phase-1-completion-checklist.md` §10 真實作者使用流程 checklist：**0 條已勾選 / 共 ~50 條**
- §8 article blocks 之 **5 個 dormant render**（relatedLinks / otherLinks / Affiliate Box / Download Box / Book Photo）未經 ready post 啟用驗證
- Phase 9-g 系列之 relatedLinks / otherLinks 系統 100% ready 但**零個 ready post 使用**
- Phase 9-f-c 系列之 book metadata output 系統 ready 但**零個 ready book-review post**（既有唯一一篇 book-review sample 仍為 draft）
- `dist/sitemap.xml` / `dist/robots.txt` 缺檔代表 `npm run build:sitemap` 在當前流程未跑過

**避免之過度宣告**：本文件**不**使用以下任一表述：

- ❌「Phase 1 已 100% 完成」
- ❌「BLOG 系統第 1 階段已正式完成」
- ❌「第一版開發已全部結束」
- ❌「可進入第二階段開發」

### 4.3 雙層判定彙整

```
A 系統能力完成度       ✅ 接近收尾條件 / 已達收尾條件
B 完整使用與測試完成度  🟡 尚待真實作者流程驗證

Phase 1 整體判定        🟡 收尾候選狀態（completion candidate）
                       └→ 待 §10 真實作者流程跑完後可考慮升級為正式 final
```

---

## §5 已完成主要能力

本節彙整第 1 階段已 landed 之系統能力。詳細對照見 `docs/phase-1-completion-checklist.md` §3 / §5-7 / §9。

### 5.1 Markdown / frontmatter content pipeline

- **內容來源**：`content/{site}/posts/*.md` + `content/{site}/pages/*.md`（Phase 8-a / 8-b）
- **解析**：`src/scripts/parse-markdown.js`（含 body H1 → H2 自動降級）+ `gray-matter`
- **載入**：`src/scripts/load-posts.js` / `load-blogger-posts.js`（含 draft / archived 過濾）
- **frontmatter 欄位字典**：詳見 `docs/content-schema.md` + `docs/publish-bundle.md` §2.6
- **sidecar bundle 三檔結構**：`.md` + `.publish.json` + `.fb.md`（Phase 8-a ~ 8-b）

### 5.2 normalized metadata

由 `src/scripts/normalize-post-output.js` 落地（Phase 8-d 起手 + 8-f / 8-g-18 / 8-g-19 補強）：

- `normalized.identity.contentKind`（含 legacy `type` fallback）
- `normalized.publish.canonical.{url,source}`
- `normalized.publish.blogger.tags`（含 `series.tags` inheritance；per 8-g-18-c）
- `normalized.promotion.facebook.{enabled,target,title,message,body,hashtags,finalUrl}`（含 series.hashtags / site default hashtags 多層 fallback）
- `normalized.series.{id,number,subtitle,resolvedTitle}`（per 8-f-2-b + resolve-series-title.js）

### 5.3 Blogger build

- **CLI**：`npm run build:blogger`（`src/scripts/build-blogger.js`）
- **輸出**：`dist-blogger/posts/{slug}/{post.html,copy-helper.txt,meta.json,publish-checklist.txt}` + `dist-blogger/index/blogger-home.html` + `dist-blogger/theme/*.css`
- **三種 mode**：full / summary / redirect-card（per `src/views/blogger/blogger-post-{full,summary,redirect-card}.ejs`）
- **首頁 / 目錄**：`blogger-home-index.ejs` + `blogger-category-index.ejs`

### 5.4 GitHub build

- **CLI**：`npm run build:github` + `npm run build`（vite build）
- **輸出**：`dist/` 全站（含 `index.html` / `posts/{slug}/` / `categories/` / `tags/` / `design-system/` / `404.html` / `assets/`）
- **本機 dev**：`npm run dev`
- **vite 設定**：`vite.config.js` + `vite-plugin-ejs`

### 5.5 Promotion build

- **CLI**：`npm run build:promotion`（`src/scripts/build-promotion.js`）
- **輸出**：`dist-promotion/facebook/{site}/{slug}.txt` + `all-posts-index.txt`
- **模板**：`facebook-post.ejs`（full）+ `facebook-summary.ejs`（精簡，預留 mode 切換）+ `facebook-hashtags.ejs`（partial）
- **UTM 集中管理**：`content/settings/promotion.config.json`（per CLAUDE.md §4）

### 5.6 copy-helper

- **檔案**：`src/views/blogger/blogger-copy-helper.ejs`
- **13 個區塊**全數落地（含 Phase 9-f-c-b 之 [12] book metadata 11 欄位 + Phase 9-g-d-c 之 [13] relatedLinks / otherLinks 純文字確認區塊）
- **trim-newline pattern + EJS comment delimiter leak 預防**：per 9-g-d-c-fix（commit `b97c57a`）+ Phase 9-h 全系列 inline 預防

### 5.7 publish checklist

- **檔案**：`src/views/blogger/blogger-publish-checklist.ejs`
- **conditional 區塊**：含 Phase 9-f-c-c-b 之 book-review / magazine 內容檢查 + Phase 9-g-e-b 之 relatedLinks / otherLinks 5 條 checkbox
- **對應人工 master**：`docs/checklists/blogger-publish-checklist.md`（12 條 master checkbox；含 Phase 9-g-e-c +1 條 relatedLinks / otherLinks 已核對）

### 5.8 Article blocks（Hero / Cover / Article Body / Hashtag / Affiliate Box / Download Box / Book Photo / relatedLinks / otherLinks）

| 區塊 | Blogger | GitHub | landed phase |
|---|---|---|---|
| Hero / Cover / Article Body | ✅ | ✅ | Phase 1 / 2 |
| Hashtag | ✅ | ✅（live activated）| Phase 2-2-g / 9-h-d-b |
| Affiliate Box top/bottom | ✅ | ✅ | Phase 2-2-p / 9-h-b-b |
| Download Box | ✅ | ✅ | Phase 2-2-o / 9-h-c-b |
| Book Photo | ✅ | ✅（dormant）| Phase 2 / 9-h-e-b |
| relatedLinks / otherLinks | ✅ | ✅ | Phase 9-g-d-b / 9-g-f-b |

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

---

## §6 relatedLinks / otherLinks 完成狀態

本系列為 Phase 9-g 系列之主軸，亦為「系統完成、內容待驗證」之最典型案例。

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

### 6.3 內容層 0% 啟用（dormant render）

**關鍵限制**：

- 既有 2 篇 ready GitHub posts 之 frontmatter **均無** `relatedLinks` / `otherLinks` 欄位
- 既有 0 篇 ready Blogger posts
- grep `relatedLinks|otherLinks` 於 `content/` 命中 9 個檔案，**全部是** templates（5）+ validation fixtures（4），**無 ready 內容**

### 6.4 結論

「系統完成、內容待驗證」：當前 relatedLinks / otherLinks 屬第 1 階段最完整之「infrastructure 100% ready；ready post 啟用率 0%」案例。後續真實作者試寫（per §10）至少應啟用 1 個 ready post 之 `relatedLinks` / `otherLinks` 以完成 live activation 驗證。

---

## §7 GitHub / Blogger article block parity

本節為 Phase 9-h 結果之摘要（per `docs/phase-9h-completion-report.md` §4）。

### 7.1 6/6 conditional article blocks 達成 100% Blogger ↔ GitHub parity

| # | 區塊 | Blogger（`blogger-post-full.ejs`） | GitHub（`post-detail.ejs`） | landed phase | 當前啟用狀態 |
|---|---|---|---|---|---|
| 1 | relatedLinks / otherLinks（`<aside>`）| ✅ | ✅ | 9-g-d-b / 9-g-f-b | 🟡 **dormant** |
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

### 7.3 啟用狀態彙整

- **唯一 live activated**：Hashtag（既有 2 篇 ready GitHub posts frontmatter 已含 `blocks.hashtags: true` + `tags`）
- **5 個 dormant render**：relatedLinks / otherLinks + Affiliate Box top/bottom（共算 1 區塊家族）+ Download Box + Book Photo + Cover
- **唯一缺漏（非 dormant 而是未實作）**：Related Posts auto block（自動推薦邏輯；Phase 9-h-f future candidate；per `docs/phase-9h-completion-report.md` §8.1）

### 7.4 設計原則彙整

per `docs/phase-9h-completion-report.md` §1：

1. **mechanical mirror**：GitHub 端 EJS render pattern 完整 mirror Blogger 端
2. **不接 normalize-post-output**：直接讀 `post.*` 欄位
3. **lab-container 包裝**：GitHub 端每區塊包覆 `<div class="lab-container">`
4. **trim-newline pattern + EJS comment 嚴格無 delimiter 字符**：對既有無對應 frontmatter 之 ready posts 達 byte-identical-modulo-builtAt
5. **single-file implementation commit precedent**：每實作批僅 1 個檔案被 staged

---

## §8 Deferred / Pending 項目

### 8.1 Phase 9-g-g：relatedLinks / otherLinks JSON-LD `mentions` / `isPartOf`

- **狀態**：⏸ deferred
- **範圍**：為 relatedLinks / otherLinks 之 internal links 補 schema.org `mentions` / `relatedLink` / `isPartOf` 屬性
- **trigger condition**：作者完成 §10 試寫 + Blogger 發布 + 回填 publishedUrl 後，有 1 篇含 relatedLinks 之 ready post 可用 Google Rich Results Test 驗證
- **來源**：`docs/phase-9g-completion-report.md` §8.3 / `docs/related-links-schema.md` §9.2

### 8.2 Phase 9-f-g：Book / Periodical structured data

- **狀態**：⏸ deferred
- **範圍**：為 book-review / magazine 文章補 `Book` / `Periodical` JSON-LD
- **trigger condition**：作者完成 1 篇 ready book-review post + Blogger 發布
- **來源**：`docs/future-roadmap.md` Phase 9-f 系列補述（per Phase 9-f-a A.2 保守路線）

### 8.3 Phase 8-h：legacy 欄位退場

- **狀態**：⏸ pending
- **範圍**：跨 8 個 source code 位置（per `docs/phase-1-completion-checklist.md` §6.2 含精確檔案 + 行號）：
  - `validate-content.js:329`（`frontmatter-uses-deprecated-type` warning rule）
  - `normalize-post-output.js:179-195 / 122 / 715 / 729 / 763 / 783 / 798 / 812 / 822 / 674-688`（`contentKind ?? type` + `legacyFb` 多處 + canonical fallback）
  - `parse-markdown.js`（body H1 → H2 自動降級）
  - `build-blogger.js:231-237`（legacy `post.tags` fallback）
  - `build-promotion.js:151`（4 欄位 legacy fallback）
  - `resolve-placeholders.js:91 / 112 / 116`（legacy publishedUrl fallback）
- **建議拆批**（per `docs/phase-1-completion-checklist.md` §11.3）：8-h-a 純讀取盤點 → 8-h-b new-post / template 確認 → 8-h-c validate warning 升級 → 8-h-d normalize 退場 → 8-h-e build-blogger / build-promotion 退場 → 8-h-f docs sync + completion report
- **trigger condition**：本 final report 已寫（Phase 9-z-c 完成）+ 作者已熟悉 Phase 8-a normalized 結構

### 8.4 Phase 9-h-f：兩端 Related Posts auto block

- **狀態**：⏸ future candidate
- **範圍**：跨兩端（GitHub + Blogger）之**自動**相關文章推薦邏輯（依 tags / category / contentKind / series.id 計算）
- **與 relatedLinks / otherLinks 之關係**：屬 two-track 獨立機制（不互相 fallback）
- **trigger condition**：作者 ≥ 5 篇 ready post（推薦演算法需多文章樣本才有意義）
- **來源**：`docs/phase-9h-completion-report.md` §8.1

### 8.5 Dormant article blocks 尚未由 ready post 驗證

- **狀態**：🟡 dormant render
- **範圍**：relatedLinks / otherLinks / Affiliate Box top/bottom / Download Box / Book Photo / Cover 共 5 個區塊
- **理由**：既有 2 篇 ready GitHub posts frontmatter 無此 5 種欄位；既有 1 篇 Blogger sample 仍為 draft
- **trigger condition**：作者依 §10 試寫流程啟用
- **驗收方式**：per `docs/phase-1-completion-checklist.md` §10.10.2

### 8.6 Phase 8-g-1：fixture / sample end-to-end 驗證

- **狀態**：⏸ deferred
- **範圍**：`content/{site}/posts/_sample-*.md` end-to-end 驗證流程
- **理由**：ready fixture 會進入正式 dist / sitemap / promotion；本系統無 noindex / staging dist 機制可隔離
- **trigger condition**：作者人工確認部署流程能隔離 `_sample-` 內容
- **來源**：`docs/future-roadmap.md` §4

### 8.7 Phase 8-g candidate 6：first article `.fb.md` hashtags fallback

- **狀態**：⏸ deferred / nice-to-have / Phase 8-h+
- **範圍**：系列首篇 `.fb.md` hashtags fallback（屬「跨文章查找邏輯」之 implicit ergonomic shortcut）
- **理由**：既有 explicit FB hashtags fallback chain（`series.hashtags` / `defaultHashtags` / `series.tags`）已覆蓋主要使用情境
- **來源**：`docs/phase-8g-completion-report.md` §3.14 / §8.8

---

## §9 為什麼不直接宣告完整完成收尾

本節說明 §4.2 / §12 之保守判定**理由依據**，避免讀者誤以為「系統能力 ✅ = 第 1 階段完成」。

### 9.1 JSON-LD 進階需要真實內容與 Google Rich Results Test，不宜用假資料硬上

Phase 9-g-g（relatedLinks JSON-LD）+ Phase 9-f-g（Book / Periodical JSON-LD）兩項 deferred 之**根本理由**：

1. **無真實 ready post 可做 Google Rich Results Test**：當前 0 篇 ready book-review post + 0 篇含 relatedLinks 之 ready post，無內容可貼至 Rich Results Test 驗證 schema 結構正確性
2. **schema.org 嚴格性**：錯誤 schema 會被 Google 標 invalid；本機驗證之 `JSON.stringify` 正確不代表 Google 認可
3. **byte-identical 驗證對 schema 結構正確性不足夠**：sanity check 之 grep / diff 只能驗證「結構未變」，無法驗證「Google 認可」
4. **若用 fixture 假資料硬上**：fixture 之 placeholder URL（如 `""` 或 `https://example.com/...`）會被 Google 視為 invalid；無真實驗證效果

**結論**：JSON-LD 進階強化必須等待真實 ready post，才有實質驗證意義。**不**屬「系統缺漏」，而是「驗證資料缺漏」。

### 9.2 legacy 退場 scope 大，適合在已有 final checklist / report 後獨立處理

Phase 8-h legacy 退場跨 8 個 source code 位置（含 `validate-content.js` / `normalize-post-output.js` / `parse-markdown.js` / `build-blogger.js` / `build-promotion.js` / `resolve-placeholders.js`），涉及：

- 4 條 validate rule 升級 / 退場
- normalize-post-output 10+ 處 legacy fallback 退場
- build-blogger / build-promotion 之 normalized 優先 + legacy fallback 改為 normalized only
- parse-markdown body H1 → H2 自動降級之 deprecated 化

退場後**必須跑完整 build × 5 + validate**驗證**沒退步**。若在第 1 階段 final report 尚未封存前混入退場批，會出現「同一波 commit 中既宣告 Phase 1 完成又動 source code」之矛盾。

**保守安排**：第 1 階段 final 封存 → Phase 8-h 退場批啟動（屬 Phase 1 → Phase 1.5 過渡清理）→ 退場完成後封存 Phase 8-h completion report。

### 9.3 dormant blocks 是內容驗證問題，不是系統結構缺漏

5 個 dormant article blocks 之**性質**：

- relatedLinks / otherLinks：作者尚未在 frontmatter 填欄位
- Affiliate Box：作者尚未撰寫書評文章（需 `affiliate.links` + `affiliate.enabled`）
- Download Box：作者尚未撰寫教具下載文章（需 `download.enabled` + `download.fileUrl`）
- Book Photo：作者尚未撰寫 ready book-review 文章（既有 sample 仍 draft）
- Cover：作者尚未為既有 ready posts 準備封面圖

**根本性質**：infrastructure ready；validate / build / render 三層皆已通過 byte-identical / structurally identical 之 sanity check。**dormant ≠ broken**，dormant 代表「等內容啟用」。

**保守判定**：不能因 dormant 比例高就宣告系統缺漏；應透過 §10 真實作者試寫驗證 dormant → live 之轉換能成功。

### 9.4 relatedPosts auto block 屬 future enhancement，不是 MVP 阻擋

Phase 9-h-f（兩端 Related Posts auto block）為「**系統自動推薦**之相關文章卡片」，與 §6 描述之「**作者手動指定**之 relatedLinks / otherLinks」為 **two-track 獨立機制**（per `docs/related-links-schema.md` §2.2 / §7）。

- 第 1 階段未強制要求自動推薦邏輯（CLAUDE.md §17 列為 Optional block）
- 系統推薦演算法需 ≥ 5 篇 ready post 才有意義（當前 2 篇）
- 屬第二階段強化候選；不阻擋 Phase 1 收尾

### 9.5 結論

第 1 階段之**真正阻擋點**是「真實作者使用流程驗證」，而非：

- ❌ JSON-LD 進階強化（屬未來；無真實內容無法驗證）
- ❌ legacy 退場（屬清理；不阻擋宣告系統能力完成）
- ❌ dormant blocks（屬內容問題；不阻擋宣告系統結構完成）
- ❌ Related Posts auto block（屬未來；CLAUDE.md 第 1 版未強制要求）

✅ **真正應該推進的是 §10 真實作者試寫流程**。

---

## §10 剩餘驗收工作

本節為「真正進入正式 final completion 前」之必要工作清單。詳細勾選表詳見 `docs/phase-1-completion-checklist.md` §10（10 子節 ~50 條）。本節摘要核心 12 項：

1. **建立 1 篇真實作者測試文章**（GitHub 或 Blogger）；使用 `npm run new:post`
2. **啟用 relatedLinks / otherLinks**：frontmatter 填入至少 1 個 `relatedLinks` entry 與 1 個 `otherLinks` entry（含 `kind` / `platform` / `title` / `url`）
3. **啟用至少 1 個 dormant block**（建議 download 或 affiliate 或 book photo 三選一）：
   - download：`download.enabled: true` + `fileUrl` + `licenseNote`
   - affiliate：`affiliate.enabled: true` + `affiliate.links[]` + `affiliate.position.top/bottom: true`
   - book photo：`contentKind: book-review` + `book.coverImage` + `book.showBookPhoto: true`
4. **status 設為 ready**：`status: "ready"` + `draft: false`
5. **跑 `npm run build:github`** → 驗證 `dist/posts/{slug}/index.html` 含對應區塊
6. **跑 `npm run build:blogger`** → 驗證 `dist-blogger/posts/{slug}/post.html` 含對應區塊
7. **跑 `npm run build:promotion`** → 驗證 FB 推廣 txt（若 `.fb.md` enabled）
8. **跑 `npm run validate:content`** → 驗證 baseline 仍 `0 error`（warning 可能增加，但非預期 ≥ 22）
9. **檢查 GitHub article detail**：本機 `npm run dev` + 瀏覽器檢視
10. **檢查 Blogger HTML**：開 `post.html` 預覽 + 對照 `copy-helper.txt` + 對照 `publish-checklist.txt`
11. **實際貼到 Blogger 後發布** → 取得正式 URL
12. **回填 publishedUrl**：`npm run backfill:url --slug={slug}` 寫入 `.publish.json`

**最低驗收條件**：12 項全數通過 → 升級本文件為正式 final completion report。

---

## §11 建議後續順序

承 §4.2 / §9.5 之保守判定，建議後續順序如下：

### 順序 1：真實作者內容試寫 / end-to-end validation

- **負責**：作者本人
- **產出**：≥ 1 篇 ready post 跑過 §10 全 12 項
- **預期時間**：1 ~ 2 篇試寫文章之撰寫 + 發布週期
- **完成條件**：§10 12 項全 ✅

### 順序 2：視結果修正 checklist / report

- **負責**：Claude Code（屬批次工作）
- **範圍**：
  - 若 §10 試寫過程發現 checklist 條目不夠細 / 多餘 / 語意模糊 → 更新 `docs/phase-1-completion-checklist.md`
  - 若試寫過程暴露系統 bug → 修 bug + 更新對應 phase report
  - 若試寫順利完成 → 將本文件升級為正式 final completion report（移除「草案 / candidate」標註）
- **完成條件**：本文件升級為正式 final completion report

### 順序 3：Phase 8-h legacy 退場拆批分析

- **負責**：Claude Code（建議拆 6 子批）
- **範圍**：per §8.3 之 6 子批拆解（8-h-a ~ 8-h-f）
- **trigger condition**：順序 2 完成（final report 已封存）+ 作者熟悉 Phase 8-a normalized 結構
- **預期效益**：降低 source code 複雜度；validate rules / normalize fallback / build legacy 鏈全清理

### 順序 4：Phase 9-g-g JSON-LD 進階落地

- **負責**：Claude Code（建議拆 2-3 子批）
- **範圍**：relatedLinks / otherLinks 之 `mentions` / `isPartOf` schema.org 補強
- **trigger condition**：順序 1 已啟用 relatedLinks 之 ready post 已發布至 Blogger 並可用 Rich Results Test 驗證
- **預期效益**：SEO 強化；search engine 對 internal link 之語意理解

### 順序 5：Phase 9-f-g Book / Periodical structured data

- **負責**：Claude Code（建議拆 2-3 子批）
- **範圍**：book-review / magazine 之 `Book` / `Periodical` schema.org
- **trigger condition**：順序 1 已啟用 book-review 之 ready post 已發布
- **預期效益**：書評 SEO 強化

### 順序 6：Related Posts auto block future enhancement

- **負責**：Claude Code（建議拆 3 子批：GitHub-only / Blogger-only / 共用邏輯）
- **範圍**：跨兩端 auto 推薦邏輯（依 tags / category / contentKind / series.id 計算）
- **trigger condition**：作者 ≥ 5 篇 ready post

### 保守原則

- 每批獨立 commit；不混入跨類變動
- 不為趕進度而合併不相干批次
- 順序 1 是當前唯一**不能由 Claude 替代**之工作；其餘皆可待 Claude 批次處理

---

## §12 結論

### 12.1 雙層彙整

| 維度 | 狀態 | 措辭 |
|---|---|---|
| **系統能力** | ✅ | 已完成到可進入驗收階段 |
| **完整使用與測試** | 🟡 | 尚待真實作者流程驗證 |
| **整體第 1 階段** | 🟡 | 收尾候選狀態（completion candidate）|

### 12.2 保守結論

> 第 1 階段之**系統能力已完成到可進入驗收階段**。
>
> 但**目前不建議宣告完全完成**：因為 §10 真實作者 end-to-end 使用流程驗證尚未跑過，且 5 個 article block 仍屬 dormant render；同時 Phase 9-g-g / 9-f-g JSON-LD deferred、Phase 8-h legacy 退場 pending。
>
> 下一個關鍵**不是再堆功能**，而是**跑真實作者使用流程**。透過 ≥ 1 篇 ready post 之完整 end-to-end 驗證（含 dormant block 啟用 + Blogger 貼上 + publishedUrl 回填），方能確認系統能力與作者工作流程之整合可用，並升級本文件為正式 final completion report。
>
> 本文件當前應視為「**收尾報告草案 / completion candidate report**」，不應對外宣告為「Phase 1 已完成」。

### 12.3 邊界聲明

- 本文件**不**主動觸發任何 source code 變動
- 本文件**不**主動觸發 build / validate / 內容修改
- 本文件**不**升級 §4 之保守判定為「100% 完成」
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

### 13.3 schema docs

- `docs/related-links-schema.md`（relatedLinks / otherLinks metadata schema）
- `docs/book-schema.md`（book / source metadata schema）
- `docs/series-schema.md`（series metadata schema）
- `docs/publish-bundle.md`（sidecar bundle 三檔結構）
- `docs/publish-json-schema.md`（`.publish.json` schema）
- `docs/fb-sidecar-schema.md`（`.fb.md` schema）
- `docs/content-schema.md`（content / frontmatter schema）

### 13.4 操作手冊

- `docs/publish-workflow.md`（作者 SOP）
- `docs/migration-from-frontmatter.md`（舊 frontmatter 遷移指引）

### 13.5 Checklists

- `docs/checklists/blogger-publish-checklist.md`（Blogger 發布 12 條 master checklist）
- `docs/checklists/github-deploy-checklist.md`
- `docs/checklists/fb-promotion-checklist.md`
- `docs/checklists/image-upload-checklist.md`
- `docs/checklists/seo-checklist.md`
- `docs/checklists/backup-checklist.md`
- `docs/checklists/sidecar-migration-checklist.md`

### 13.6 規範來源

- `CLAUDE.md`（專案開發規範；本文件嚴格遵守 §28 必做 / §29 不做 / §30 最終樣貌）

---

（本文件結束）
