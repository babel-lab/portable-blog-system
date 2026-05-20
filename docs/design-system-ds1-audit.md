# Design System DS-1 Audit：盤點現有 CSS / SCSS / EJS article blocks

本文件為 **Phase DS-1 盤點報告**。屬純讀 / 純報告性質；**本批不改任何 source**。為後續 DS-2（token naming 整理）/ DS-3（platform theme variables）/ DS-4（article components 共用化）之前置資料。

對應上層文件：
- `docs/css-design-system-policy.md`（本政策；本 audit 之對照基準）
- `CLAUDE.md` §9（CSS / class 命名規則；§9.1 lab- prefix / §9.2 theme class / §9.3 BEM / §9.4 Flexbox / §9.5 SCSS 歸類）
- `CLAUDE.md` §10（Blogger Design Token 匯出；本 audit §2.2 之 Blogger pipeline）
- `CLAUDE.md` §17（文章頁基本版型；EJS article block 對齊基準）
- `docs/blogger-export.md`（Blogger 匯出系統規格）
- `docs/github-deploy.md`（GitHub Pages 部署）
- `docs/related-links-schema.md`（related / other links schema；本 audit §3 之資料來源）

---

## §1 背景與範圍

### 1.1 本批為 DS-1 盤點

per `docs/css-design-system-policy.md` §7 之 Phase DS-1 範圍：

- 列出當前 `src/styles/` 之既有檔案結構
- 列出當前 EJS article block 之共用 / 分裂程度
- 比對 Blogger 匯出 `dist-blogger/theme/*.css` 與 GitHub 站 CSS 之差異
- 找出已違反本政策的地方
- 屬純讀 / 純報告；**不改 source**

### 1.2 對照基準

`docs/css-design-system-policy.md`（commit `08cba04`）：

- §1 共用同一套 Design System
- §2 三層 token 分層（global / semantic / platform）
- §3 Blogger / GitHub theme 概念（sealed `.lab-site--*` selector）
- §4 19 個可共用文章 components
- §5 10 條明確禁則

### 1.3 盤點來源

- `src/styles/**/*.scss`（41 檔）
- `src/views/**/*.ejs`（51 檔）
- `src/scripts/build-github.js` / `src/scripts/build-blogger.js` / `src/scripts/build-blogger-theme-css.js`
- `dist-blogger/theme/*.css`（4 檔；既有產出）

---

## §2 CSS / SCSS 檔案盤點

### 2.1 GitHub Pages 主 pipeline（`src/styles/main.scss`）

41 個 SCSS 檔分 5 大區。`main.scss` 用 `@use` 載入 33 個 partials（**不**包 `blogger/` 子目錄）。

| 檔案 | 類型 | 用途 | 是否與 article page 有關 | 備註 |
|---|---|---|---|---|
| `main.scss` | entry | GitHub Pages 主入口 | ✅ 是 | 33 個 @use；`:root` 顯式 include 5 個 token mixin |
| `abstracts/_tokens.scss` | token | global color / radius / shadow / link / gray / focus-ring tokens | — | mixin `lab-tokens-base`；**唯一定義 hex 之檔（合理）**；50 行 |
| `abstracts/_themes.scss` | theme | platform theme override | — | **2 行；只覆寫 `--lab-color-primary` 1 個 token**（per §4.4 §5）|
| `abstracts/_spacing.scss` | token | spacing scale | — | mixin |
| `abstracts/_typography.scss` | token | font family / size / line-height / weight | — | mixin |
| `abstracts/_breakpoints.scss` | token | breakpoint | — | mixin |
| `abstracts/_z-index.scss` | token | z-index scale | — | mixin |
| `abstracts/_mixins.scss` | mixin | 共用 mixin（含 `lab-focus-ring`）| — | |
| `base/_reset.scss` | base | CSS reset | — | |
| `base/_base.scss` | base | 全域基底 + `.lab-hero` | ⚠️ 半相關 | **有 1 個 hex 寫死**（hero gradient）|
| `base/_article.scss` | base | `.lab-blogger-article, .lab-article` 共用 max-width + cover | ✅ 是 | **good practice 範例**：群組 selector 兩平台共用 |
| `base/_print.scss` | base | print stylesheet | — | |
| `layout/_header.scss` | layout | header | — | ⚠️ 有 1 個 hex 寫死（menu button `#fff`）|
| `layout/_nav.scss` | layout | nav | — | |
| `layout/_mobile-drawer.scss` | layout | mobile drawer | — | ⚠️ 有 1 個 hex（token fallback `#f3f4f6`）|
| `layout/_footer.scss` | layout | footer | — | |
| `layout/_sidebar.scss` | layout | sidebar | ✅ 是 | 文章頁 sidebar |
| `layout/_grid.scss` | layout | grid | — | per 註解：**Blogger 不需此 layout-level margin** |
| `layout/_post-list.scss` | layout | post list | — | |
| `components/_button.scss` | component | button | — | ⚠️ 3 個 hex（hover `color-mix(..., #000)`）|
| `components/_card.scss` | component | card | — | |
| `components/_post-card.scss` | component | post card | — | |
| `components/_tag.scss` | component | tag | — | |
| `components/_hashtag.scss` | component | hashtag | ✅ 是 | article block |
| `components/_breadcrumb.scss` | component | breadcrumb | ✅ 是 | |
| `components/_adsense.scss` | component | adsense placeholder | ✅ 是 | article block |
| `components/_social-follow.scss` | component | social follow | ✅ 是 | article block |
| `components/_affiliate-box.scss` | component | affiliate box | ✅ 是 | article block |
| `components/_book-photo.scss` | component | book photo | ✅ 是 | article block |
| `components/_download-box.scss` | component | download box | ✅ 是 | ⚠️ 1 個 hex（hover）；article block |
| `components/_related-posts.scss` | component | related posts（自動推薦）| ✅ 是 | article block |
| `components/_related-links.scss` | component | related / other links（作者手動指定）| ✅ 是 | article block |
| `components/_prev-next.scss` | component | prev / next | ✅ 是 | article block |
| `components/_back-to-top.scss` | component | back to top button | ✅ 是 | |
| `components/_toc.scss` | component | TOC | ✅ 是 | article block |
| `components/_code-block.scss` | component | code block | ✅ 是 | article body 元素 |

### 2.2 Blogger 獨立 pipeline（`src/styles/blogger/`）

`build-blogger-theme-css.js` 透過 `sass.compile` 編譯 4 個 entry，產出至 `dist-blogger/theme/`：

| Entry SCSS | Output CSS | 用途 |
|---|---|---|
| `blogger-tokens.scss` | `blogger-tokens.css` | Blogger 專用 token；scope 在 `.lab-blogger-article` |
| `blogger-article.scss` | `blogger-article.css` | Blogger article body 排版（scoped） |
| `blogger-components.scss` | `blogger-components.css` | Blogger 全域 components |
| `blogger-full-style.scss` | `blogger-full-style.css` | 合併版（推薦使用；per `CLAUDE.md` §10） |

Partial：

| 檔案 | 用途 | 備註 |
|---|---|---|
| `blogger/_blogger-article-rules.scss` | `lab-article-rules` mixin；article body 基礎排版（headings / p / a / lists / blockquote / hr / img / figure / table）| **全部用 `--lab-*` token；0 個 hex 寫死**；scope 在 `.lab-blogger-article` 下 |
| `blogger/_blogger-components-rules.scss` | `lab-components-rules` mixin；鏡射 15 個 components | ⚠️ **mirror partial**；註解明寫「未來若有異動，必須同步更新」；**3 個 hex（mirror _button.scss + _download-box.scss 之 hover）** |

### 2.3 重要架構觀察

- `main.scss` **不** import `src/styles/blogger/**` → GitHub Pages CSS 與 Blogger CSS **不互污染**
- `src/styles/blogger/blogger-tokens.scss` 與 `main.scss` **共用** `tokens.lab-tokens-base` mixin → token 來源是同一處（**已符合 policy §1.1「共用 token 庫」**）
- 差異在於 `:root` vs `.lab-blogger-article` 的 scope 範圍：
  - main.scss：`:root { @include tokens.lab-tokens-base; ... }`
  - blogger-tokens.scss：`.lab-blogger-article { @include tokens.lab-tokens-base; ... }`
  - blogger-full-style.scss：`:where(.lab-blogger-article, .lab-blogger-components) { @include ... }` (zero specificity)
- **components 部分**：main.scss 透過 `@use './components/*'` 直接使用；blogger pipeline 透過 `_blogger-components-rules.scss` **mirror partial** 鏡射 15 個 component（**violation：兩處 copy；非 single source**）
- **article body rules**：main.scss 用 `base/_article.scss`（含 `.lab-blogger-article, .lab-article` 群組）；blogger pipeline 另用 `_blogger-article-rules.scss` mixin scope 在 `.lab-blogger-article` 下 → **概念上是兩處實作；雖然兩處共用 token，但 selector / rule 結構不一**

---

## §3 EJS / article template 盤點

### 3.1 文章頁 EJS 清單

| 檔案 | 平台 | 用途 | 是否共用 | 備註 |
|---|---|---|---|---|
| `views/pages/post-detail.ejs` | GitHub | GitHub Pages article 詳細頁（單一 template） | ❌ 平台獨用 | 用 `<article class="lab-article">` + `lab-container` wrapper |
| `views/blogger/blogger-post-full.ejs` | Blogger | Blogger full mode article | ❌ 平台獨用 | 用 `<div class="lab-blogger-article">` 外包；**全部子區塊 inline（不使用 partials）** |
| `views/blogger/blogger-post-summary.ejs` | Blogger | Blogger summary mode（GitHub 導流） | ❌ Blogger only | |
| `views/blogger/blogger-redirect-card.ejs` | Blogger | redirect card | ❌ Blogger only | |
| `views/blogger/blogger-home-index.ejs` | Blogger | Blogger 首頁 / 目錄 | ❌ Blogger only | |
| `views/blogger/blogger-category-index.ejs` | Blogger | Blogger 分類索引 | ❌ Blogger only | |
| `views/blogger/blogger-copy-helper.ejs` | Blogger | Blogger 複製輔助 txt | ❌ Blogger only（不渲染 HTML；屬發布輔助）| |
| `views/blogger/blogger-publish-checklist.ejs` | Blogger | Blogger 發布清單 | ❌ Blogger only（屬發布輔助）| |
| `views/blogger/blogger-meta-json.ejs` | Blogger | Blogger metadata JSON | ❌ Blogger only（屬發布輔助）| |
| `views/layout/base.ejs` | GitHub | GitHub base layout；`<body class="lab-site lab-site--github">` | ❌ GitHub only（Blogger 走 Blogger 主題；無 base.ejs）| 含 back-to-top button + nav include |
| `views/layout/head.ejs` | GitHub | `<head>` partial | ❌ GitHub only | |
| `views/layout/header.ejs` / `nav.ejs` / `mobile-drawer.ejs` / `footer.ejs` / `sidebar.ejs` / `breadcrumb.ejs` | GitHub | layout partials | ❌ GitHub only | |
| `views/seo/meta-tags.ejs` / `open-graph.ejs` / `canonical.ejs` / `json-ld.ejs` | shared | SEO partials | ✅ 共用（被 GitHub 與 Blogger 都引用） | |
| `views/tracking/ga4.ejs` / `ga4-events-helper.ejs` | shared | GA4 | ✅ 共用 | |
| `views/ads/adsense-*.ejs`（7 檔） | shared | AdSense 區塊 | ✅ 共用 | |
| `views/promotion/facebook-*.ejs`（3 檔） | promotion | FB 推廣文案 | promotion only | 不在 article render path |
| `views/design-system/**`（9 檔） | GitHub | Design System 頁 | ❌ GitHub only | |
| `views/pages/home.ejs` / `post-list.ejs` / `category.ejs` / `tag.ejs` / `category-list.ejs` / `tag-list.ejs` / `404.ejs` / `about.ejs` / `search.ejs` | GitHub | GitHub 頁面 | ❌ GitHub only | |
| `views/admin/index.ejs` | GitHub dev-mode | Admin overview | dev only | per Admin-1-b dev-mode-only |

### 3.2 article block inline 重複觀察

`post-detail.ejs` 與 `blogger-post-full.ejs` 兩端**各自 inline** 以下 article block，**無 partial 共用機制**：

| Block | GitHub post-detail.ejs | Blogger blogger-post-full.ejs | BEM class 是否一致 | 結構 / 邏輯是否一致 |
|---|---|---|---|---|
| article header | inline | inline | ✅ `lab-article__header` / `lab-article__category` / `lab-article__title` / `lab-article__title-en` / `lab-article__meta` 全一致 | GitHub 多 `lab-container` wrapper |
| cover image | inline | inline（透過 book photo + body cover）| ✅ `lab-article__cover` / `lab-article__cover-img` | GitHub 含 cover；Blogger header 不渲染 cover（依書評 / contentKind 邏輯） |
| book photo | inline | inline | ✅ `lab-book-photo` / `lab-book-photo__image` / `lab-book-photo__caption` 一致 | guard 條件一致（4 條 AND）|
| affiliate box (top) | inline | inline | ✅ `lab-affiliate-box` 一致 | guard 條件一致（5 條 AND）|
| article body | inline | inline | ✅ `lab-article__body` 一致 | |
| download box | inline | inline | ✅ `lab-download-box` 一致 | guard 條件一致（3 條 AND）|
| affiliate box (bottom) | inline | inline | ✅ `lab-affiliate-box` 一致 | guard 條件一致 |
| related links | inline | inline | ✅ `lab-related-links` + BEM modifier `--internal/--external` 一致 | ⚠️ **GitHub 讀 `relatedLinksRendered`（含 cross-link UTM）+ 支援 author target/rel override；Blogger 讀 `post.relatedLinks` 無 UTM 處理 / 無 author override**（per `CLAUDE.md` §16.4 之單向實作） |
| other links | inline | inline | ✅ `lab-other-links` 一致 | 同 related links 之差異 |
| hashtag | inline | inline | ✅ `lab-hashtag` / `lab-hashtags` 一致 | |
| social follow / TOC / series nav / back-to-top | （依各 ready post 之 blocks.* 而定） | 同左 | 多數 BEM 一致 | TBD |

**重複現象**：

- `renderable pre-filter`（related links 的 plain object + url + title 非空 filter）兩端 copy-paste（post-detail.ejs lines 152-156 vs blogger-post-full.ejs lines 120-124）→ 應抽 helper
- book photo guard / affiliate guard / download guard 邏輯兩端字面相同 → 應抽 partial 或 helper

### 3.3 兩端可接受的平台差異

- GitHub 用 `lab-container` wrapper（限制最大寬度）；Blogger 不用（沿用主題寬度）→ 屬 layout-level 平台差異；partial 共用時應接受 wrapper 開關 prop
- Blogger 外層 `<div class="lab-blogger-article">` 多一層 namespace wrapper（避免污染 Blogger 主題）→ 屬 sandbox 需求；不可移除
- GitHub 用 `<article>` semantic element；Blogger 用 `<div>`（Blogger 後台已有自己的 `<article>` 結構）→ 屬 sandbox 需求

---

## §4 現有 token / theme 狀態

### 4.1 是否已有 global tokens

✅ **是**。`abstracts/_tokens.scss` + `_spacing.scss` + `_typography.scss` + `_breakpoints.scss` + `_z-index.scss` 共 5 個 mixin；包含：

- font family / size / weight / line-height（typography）
- spacing scale（4-step 體系）
- breakpoint
- z-index
- radius（sm / md / lg / full）
- shadow（sm / md / lg / card）
- container（sm / md / lg）
- focus ring（color / width / offset / style）

### 4.2 是否已有 semantic tokens

⚠️ **部分**。Token 命名空間是 `--lab-color-*`，是 namespace 而非語意分層：

- 有部分 semantic 命名：`--lab-color-text` / `--lab-color-muted` / `--lab-color-background` / `--lab-color-surface` / `--lab-color-border` / `--lab-color-link` / `--lab-color-link-hover` / `--lab-color-link-visited`
- 有 raw scale：`--lab-color-gray-50` ~ `--lab-color-gray-900`
- 有 brand：`--lab-color-primary` / `--lab-color-accent`

→ **無明確兩層分離（raw vs semantic）**。`--lab-color-primary` 兼當 raw（值）與 semantic（語意）；當 platform theme 想覆寫 primary 同時保留 raw 參照時，沒有 fallback chain。

→ **缺 policy §2.2 之 semantic token**：`--color-bg-soft` / `--color-badge-bg` / `--color-badge-text` / `--color-text-muted`（後者已部分以 `--lab-color-muted` 對應，但命名未顯式分層）。

### 4.3 是否已有 platform theme tokens

⚠️ **存在但僅覆寫 1 個 token**。`abstracts/_themes.scss` 只有 2 行：

```scss
.lab-site--github { --lab-color-primary: #2563eb; }
.lab-site--blogger { --lab-color-primary: #b45309; }
```

→ Selector 機制 / cascade 機制已就位；**但 token override 集合過小**（只 1 個 `--lab-color-primary`）。

→ 缺 secondary / link / badge / soft-bg 等 token 之 platform override。

→ 缺 `:root` 之 default fallback（無單獨 `.lab-site` 之外層 default；若 component 未在 `.lab-site--*` 之下，會 fallback 至 `_tokens.scss` 之 `:root` 預設值；目前 default = GitHub 藍）。

### 4.4 是否已有 hard-coded colors（違規 hex 清單）

11 個 hex 點散在 6 個非 token 檔案：

| # | 檔 / 行 | hex | context | 違規類別 |
|---|---|---|---|---|
| 1 | `_button.scss:34` | `#000` | `.lab-button--primary:hover` `color-mix(..., #000)` | hover/active overlay；可改 mixin 或 token |
| 2 | `_button.scss:35` | `#000` | 同 #1 之 border-color | 同 #1 |
| 3 | `_button.scss:38` | `#000` | `.lab-button--primary:active` `color-mix(..., #000)` | 同 #1 |
| 4 | `_download-box.scss:7` | `#000` | `.lab-download-box__cta:hover` `color-mix(..., #000)` | 同 #1 pattern |
| 5 | `_mobile-drawer.scss:4` | `#f3f4f6` | `background: var(--lab-color-gray-100, #f3f4f6)` | token fallback；風險中等 |
| 6 | `_base.scss:5` | `#eff6ff` | `.lab-hero` `linear-gradient(180deg, #eff6ff, #fff)` | 純色寫死；違規明確 |
| 7 | `_base.scss:5` | `#fff` | 同 #6 之 gradient 第二色 | 同 #6 |
| 8 | `_header.scss:11` | `#fff` | `.lab-header__menu-button` background | 應為 `var(--lab-color-background)` |
| 9-11 | `_blogger-components-rules.scss:54/55/140` | `#000` × 3 | mirror #1/#2/#4 | mirror partial；同步存在 |

**模式分析**：
- 5 個 `color-mix(..., #000)` 之 hover/active overlay → 屬「動態色階」需求；建議抽 mixin 或新增 `--lab-color-overlay-dark` token
- `.lab-hero` gradient → 屬一次性裝飾；建議直接抽 token 或 mixin
- `.lab-header__menu-button background: #fff` → 直接改 `var(--lab-color-background)`
- `_mobile-drawer.scss` 之 `var(--..., #f3f4f6)` fallback → token 缺失時退化；可保留或移除 fallback（token 必存）

### 4.5 是否已有 platform class

✅ **已有**：

- `.lab-site--github` / `.lab-site--blogger`（body 層；per `_themes.scss` + `base.ejs`）
- `.lab-blogger-article`（Blogger article 外 wrapper；per CLAUDE.md §9.2；多處 selector 使用）
- `.lab-blogger-components`（per `blogger-full-style.scss` 之 components scope）

→ Selector convention 完全對齊 `CLAUDE.md` §9.2；**0 個 `[data-site]` attribute selector**（policy §3.2 提示沿用既有 class convention，已自然符合）。

---

## §5 Article components 盤點

| Component / block | Blogger 狀態 | GitHub 狀態 | 是否共用 | 建議處理 |
|---|---|---|---|---|
| article header（含 category / title / titleEn / meta） | ✅ inline at blogger-post-full.ejs；class `lab-article__*` | ✅ inline at post-detail.ejs；class `lab-article__*` | BEM 共用；EJS inline 重複 | **DS-4 抽 partial**（接受 wrapper prop） |
| article title | ✅ 同上 | ✅ 同上 | 同上 | 同上 |
| article meta | ✅ 同上 | ✅ 同上 | 同上 | 同上 |
| article body | ✅ `lab-article__body`；body rules 由 `_blogger-article-rules.scss` mixin 提供 | ✅ `lab-article__body`；body rules 由 `base/_article.scss` 群組 selector 提供 | **BEM 共用 / body rules 兩處實作** | DS-2 / DS-3 統一 body rules 來源 |
| article TOC | TBD（未在當前 ready posts 觀察到） | ✅ `_toc.scss` 已建 | TBD | DS-4 階段補 EJS partial |
| callout | ❌ 未有 | ❌ 未有 | — | 未來需求；DS-4 階段補 |
| related links | ✅ inline；無 cross-link UTM；無 author target/rel override；`lab-related-links` | ✅ inline；含 cross-link UTM + author override；`lab-related-links` | **BEM 共用 / EJS 邏輯有差異** | DS-4 抽 partial + helper；統一 renderable filter；UTM 差異獨立議題 |
| other links | ✅ inline；同 related links 之 simplified 版；`lab-other-links` | ✅ inline；同 related links 之 simplified 版；`lab-other-links` | **同 related links** | 同上 |
| link badge（`.lab-related-links__platform`）| ✅ 在 related links 內 inline | ✅ 同左 | BEM 一致 | 隨 related links partial 抽出 |
| social follow | ✅ `_social-follow.scss` 已建；inline render 細節 TBD | ✅ 同左 | BEM 一致；render TBD | DS-4 階段補 EJS partial |
| AdSense | ✅ `views/ads/adsense-*.ejs` 7 檔 + `_adsense.scss` | ✅ 同左 | **已共用 EJS partial** | ✅ 符合 policy；無需處理 |
| book metadata | ✅ inline；`lab-book-photo`；4 條 AND guard | ✅ inline；`lab-book-photo`；4 條 AND guard | BEM 共用；guard 字面相同；EJS inline 重複 | **DS-4 抽 partial**（最容易抽；guard 簡單）|
| download block | ✅ inline；`lab-download-box`；3 條 AND guard | ✅ inline；`lab-download-box`；3 條 AND guard | BEM 共用；guard 字面相同；EJS inline 重複 | 同 book metadata |
| series navigation | TBD | TBD | — | DS-4 階段補 |
| back-to-top button | ❌ Blogger 不在主題；屬 GitHub 站 chrome | ✅ `base.ejs` line 13；`_back-to-top.scss` | GitHub only（合理） | ✅ 屬 chrome；不在 article scope |
| affiliate box | ✅ inline；`lab-affiliate-box`；5 條 AND guard；rel 固定 | ✅ inline；`lab-affiliate-box`；5 條 AND guard；rel 固定 | BEM 共用；guard 字面相同；EJS inline 重複 | **DS-4 抽 partial**（與 book metadata 同類）|
| prev / next | TBD | `_prev-next.scss` 已建；render 細節 TBD | TBD | DS-4 補 |
| post card | ✅ `_post-card.scss`（透過 mirror 鏡射至 blogger components）| ✅ `_post-card.scss` | BEM 共用 / CSS mirror | DS-3 整合 mirror（移除鏡射）|
| breadcrumb | ❌ Blogger 主題自有 | ✅ `_breadcrumb.scss` + `views/layout/breadcrumb.ejs` | GitHub only | ✅ 合理；不處理 |
| code block | ✅ 隨 article body rules；`_code-block.scss` 為 GitHub 用；Blogger 由 article rules 處理 | ✅ `_code-block.scss` | 部分共用；實作分散 | DS-4 階段統整 |

---

## §6 與 `docs/css-design-system-policy.md` 對照

### 6.1 已符合的部分

| # | 項目 | 對齊 policy 章節 |
|---|---|---|
| 1 | 共用 `lab-` prefix + BEM class naming | §1.3 / §4 |
| 2 | 共用 article BEM（`lab-article__*` / `lab-book-photo` / `lab-affiliate-box` / `lab-download-box` / `lab-related-links` / `lab-other-links` / `lab-hashtag` 兩平台命名一致）| §1.3 / §4 |
| 3 | `.lab-site--blogger` / `.lab-site--github` / `.lab-blogger-article` wrapper class 已存在 | §3.2 |
| 4 | `_themes.scss` 平台 theme selector 機制已就位 | §3 |
| 5 | Tokens 用 CSS variables（cascade 友善）| §3.3 |
| 6 | Tokens 用 mixin 設計（避免重複 emit）| §2.4 |
| 7 | Blogger token mixin 共用 `tokens.lab-tokens-base`（**非另立 token 庫**）| §1.1 |
| 8 | `base/_article.scss` 用 `.lab-blogger-article, .lab-article` 群組 selector 共用 max-width / h1 line-height | §1.1 / §6.2 |
| 9 | AdSense 已有 partial 共用（`views/ads/adsense-*.ejs` × 7）| §4 |
| 10 | SEO / GA4 partial 已共用（`views/seo/**` / `views/tracking/**`）| §6.2 |
| 11 | `main.scss` 不 import `blogger/` → 兩 pipeline 不互污染 | §1.1 / §2 |
| 12 | 0 個 `[data-site]` attribute selector（全用 class）| §3.2 |
| 13 | 0 個 `.lab-post-card--blogger` / `.lab-post-card--github` 類 platform modifier | §5 禁則 #5 |
| 14 | 0 個 component 直接讀 `--blogger-*` / `--github-*` token | §5 禁則 #6 |
| 15 | EJS 內 0 個 `<% if (site === 'blogger') %>` 切換 CSS 路徑邏輯 | §5 禁則 #7 |
| 16 | 多數 component 用 `--lab-*` token 取色（無直接寫死 hex）| §5 禁則 #9 |

### 6.2 尚未符合 / 需改善的部分

| # | Gap | 違反 policy 章節 | 觀察 |
|---|---|---|---|
| 1 | **Token 分層只有 1 層**（global only）；無 raw vs semantic 分層 | §2 三層架構 | `--lab-color-primary` 兼當 raw + semantic |
| 2 | **`_themes.scss` 只覆寫 1 個 token**（`--lab-color-primary`）；缺 link / badge / soft-bg 等其他 platform override | §1.2 / §3 | 2 行 SCSS；platform 差異未充分利用 token cascade |
| 3 | **`_blogger-components-rules.scss` 是 mirror partial** | §5 禁則 #1 | 鏡射 15 個 components；雖當下同步但架構上是兩套；無 enforce |
| 4 | **post-detail.ejs / blogger-post-full.ejs 各自 inline 重複** 所有 article block | §5 禁則 #4（partial-level） | 無 partial 共用；任何 block 結構改一處需改兩處 |
| 5 | **11 個 hex 寫死於 6 個 component/layout 檔** | §5 禁則 #9 | per §4.4 之違規清單；多數為 `color-mix(..., #000)` 之 hover overlay |
| 6 | **GitHub 用 `lab-container` wrapper / Blogger 不用** | 部分違反 §1.3 結構一致 | 屬 sandbox 需求；可接受但需 partial 支持 wrapper 開關 |
| 7 | **Related Links / Other Links 渲染邏輯重複**（renderable pre-filter copy-paste）| §5 禁則 #4 之 partial-level | 兩端字面相同；應抽 helper |
| 8 | **Related Links GitHub 端含 cross-link UTM + author override；Blogger 端不含** | per `CLAUDE.md` §16.4 設計（已知差異） | 屬已標記之 future phase；非 policy gap，屬 functional gap |
| 9 | **缺缺 `:root` 之 default token override**；若 component 不在 `.lab-site--*` 下時 fallback 至 `_tokens.scss` 之 `:root` 預設值，目前等於 GitHub 藍 | §3.3 / §2 | 屬輕度語意混淆；無 production impact |
| 10 | **article body rules 兩處實作**（`base/_article.scss` 群組 selector vs `blogger/_blogger-article-rules.scss` mixin）| §1.1 共用實作 | concept 共用 token，但 selector / rule 結構分散；難 enforce 一致 |

### 6.3 風險最高項目

per §7 風險清單，**最高風險** = #3（mirror partial drift 風險），原因：

- 鏡射 15 個 components；每次改 component 都必須 manually 同步兩處
- 無 build-time enforce / lint / CI 檢查；只靠 documentation 與 reviewer 記憶
- 若 drift → Blogger 端與 GitHub 端視覺逐步分歧；user 後續察覺成本高
- 改正成本：移除 mirror partial → 需重組 Blogger build pipeline；屬 🔴 高風險 batch（會改 dist-blogger/theme/* 內容，Blogger 後台已貼 CSS 需重貼）

---

## §7 Gap / 風險清單摘要

| 編號 | 問題 | 影響 | 風險 | 建議 phase |
|---|---|---|---|---|
| 1 | Token 分層只有 1 層；無 raw vs semantic 分層 | 中（cascade 設計不夠抽象；platform override 能力受限） | 🟢 低（純命名 / docs） | **DS-2 token naming 整理** |
| 2 | `_themes.scss` 只覆寫 1 個 token | 中（platform 差異未充分利用 cascade） | 🟡 中（需動 SCSS；platform 設計師需確認新增 token 值） | **DS-3 platform theme variables** |
| 3 | `_blogger-components-rules.scss` 是 mirror partial（鏡射 15 個 components） | 高（長期 drift 風險） | 🔴 高（會改 dist-blogger/theme/* / Blogger 後台需重貼 CSS） | **DS-3 / DS-4** 整合（先 token unification 再 component unification）|
| 4 | post-detail.ejs / blogger-post-full.ejs inline 重複 article block | 高（任何 block 結構改一處需改兩處；長期 drift 風險） | 🟡 中（會動 EJS；輸出 HTML 不變則 production safe）| **DS-4 抽 partial** |
| 5 | 11 個 hex 寫死於 6 個 component/layout 檔 | 中（platform override 能力受限；hover/active 無 platform 差異）| 🟡 中（會動 SCSS；視覺需 visual diff 確認）| **DS-2 / DS-3**（hover overlay 抽 mixin / token） |
| 6 | Related/Other Links 渲染邏輯重複 (renderable pre-filter) | 中（兩端 logic 同步成本） | 🟡 中（會動 EJS / 新增 helper） | **DS-4** 抽 helper |
| 7 | article body rules 兩處實作（`_article.scss` vs `_blogger-article-rules.scss`） | 中（rule 結構分散；難 enforce 一致） | 🟡 中（會動 SCSS / 影響 Blogger CSS 產出） | **DS-3 / DS-4** 統整 |
| 8 | `.lab-hero` gradient 寫死 hex（`#eff6ff` / `#fff`） | 低（單一 component；非文章 block） | 🟢 低（單檔；視覺影響範圍小） | **DS-2** 補 token |
| 9 | `.lab-header__menu-button background: #fff` | 低（單一 component） | 🟢 低（直接改 token） | **DS-2** |
| 10 | `_mobile-drawer.scss` token fallback hex `#f3f4f6` | 低（token 必存；fallback 不會觸發） | 🟢 低（移除 fallback 即可） | **DS-2** |

---

## §8 後續建議

依 `docs/css-design-system-policy.md` §7 之 6 phase 順序，根據本 audit 補述：

| Phase | 名稱 | 範圍 | 風險 | 預估 LOC | 前置 |
|---|---|---|---|---|---|
| **DS-2** | token naming 整理 | 規劃 raw vs semantic 分層 naming；列 hex 違規處之 token 抽出建議；hover/active overlay 抽 mixin 或 token 之設計；可選新增 `--lab-color-overlay-dark` / `--lab-color-bg-soft` / `--lab-color-badge-*`；屬 docs only | 🟢 低（純 docs / 命名 plan） | docs ~250 | 本 audit |
| **DS-3** | Blogger / GitHub theme variables | 補齊 `_themes.scss` 完整 platform override；補齊缺漏 semantic token；統整 article body rules 來源；可選整合 `_blogger-components-rules.scss` mirror partial（**最關鍵**） | 🔴 高（動 dist-blogger/theme/* 內容；Blogger 後台需重貼 CSS；GitHub Pages 視覺需 visual diff） | SCSS ~150 + dist 重建 | DS-2 |
| **DS-4** | article components 共用化 | 抽 EJS partial（先 book-photo / affiliate / download；再 related/other-links）；抽 renderable pre-filter helper；修正 11 個 hex 違規（隨 DS-2 / DS-3 token 抽出而改）| 🟡 中（會動 EJS；輸出 HTML 應 byte-identical-modulo-comment）| EJS / SCSS ~200 + 新增 partial | DS-3 |
| **DS-5** | RWD / SEO / performance check | 確認 component mobile/tablet/desktop 穩定；確認 JSON-LD / OG / canonical 兩平台一致；確認 CSS 檔大小未爆量；確認 LCP / CLS / FID 不退步 | 🟡 中（屬驗證 batch；read-only + measure）| 工具 setup + report ~100 | DS-4 |
| **DS-6** | visual checklist | 建立 Design System 頁（per `CLAUDE.md` §19）visual regression 清單；每次 component PR 過清單 | 🟢 低（流程 / SOP 層）| 清單 doc ~150 | DS-5 |

**推薦執行順序：DS-2（docs only）→ user 批准 → DS-3 拆 sub-batches（先 token 補 / 再 article body rules 統整 / 最後 mirror 整合，每 sub-batch 都需先有 pre-analysis）→ DS-4 拆 partial-by-partial（先低風險 block 如 book-photo / download；再高風險如 related-links）→ DS-5 → DS-6**。

**不建議跳過 DS-2 直接進 DS-3**：mirror partial 整合風險過高；需先有 token naming 共識，避免反工。

---

## §9 本批未做事項（嚴格邊界）

| 維度 | 狀態 |
|---|---|
| `src/styles/**` 任何 SCSS | ❌ 未動 |
| `src/views/**` 任何 EJS | ❌ 未動 |
| `src/scripts/**` 任何 JS | ❌ 未動 |
| `content/**` | ❌ 未動 |
| `package.json` / `vite.config.js` | ❌ 未動 |
| `dist/` / `dist-blogger/` / `dist-promotion/` / `.cache/` | ❌ 未動 |
| Deploy repo（`D:\github\blog-new\portable-blog-deploy\`） | ❌ 未動 |
| GitHub Pages 線上 | ❌ 未動 |
| sitemap / robots / navigation | ❌ 未動 |
| validate baseline `0/22/17` | ❌ 預期未動（本批未動 validate rules 或 content） |
| Admin 既有功能 | ❌ 未動 |
| 雙 repo 分離 / source 留本機 / dev-mode-only Admin 三大原則 | ✅ 維持 |
| 未 push | ✅ 維持 |

---

## §10 邊界聲明

- ✅ 本文件**僅為 audit 報告**；不改任何 source / CSS / SCSS / EJS / build / dist / deploy
- ✅ 本文件**不**啟動 DS-2 / DS-3 / DS-4 / DS-5 / DS-6 任一 phase
- ✅ 本文件**不**裁決 token rename 之具體新命名（屬 DS-2 範圍）
- ✅ 本文件**不**裁決 platform 之具體色票值（屬 DS-3 範圍）
- ✅ 本文件**不**改變 `CLAUDE.md` / 既有 schema / 既有命名規範
- ✅ 本文件**不** push

---

## §11 Cross-links

- `docs/css-design-system-policy.md`（本 audit 對照基準；commit `08cba04`）
- `CLAUDE.md` §9 / §10 / §17 / §19（命名 / Blogger theme 匯出 / 文章頁版型 / Design System 頁）
- `docs/design-system.md`（Design System 規格 / token / component catalog）
- `docs/blogger-export.md`（Blogger 匯出系統規格；本 audit §2.2 之 Blogger pipeline）
- `docs/github-deploy.md`（GitHub Pages 部署）
- `docs/related-links-schema.md`（related / other links schema；本 audit §3 / §5 之資料來源）
- `docs/book-schema.md`（書籍 metadata；本 audit §5 之 book-photo block）
- `docs/seo-ga4-adsense.md`（SEO / GA4 / AdSense；本 audit §3 / §5 之 AdSense partial 共用情況）
- `docs/rwd-interaction.md`（RWD；本 audit §5 / §8 之 DS-5 範圍）

---

（本文件結束）
