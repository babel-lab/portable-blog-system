# 20260523 Design Token / Component Style Audit

本文件為 portable-blog-system 於 **2026-05-23** 之 **Design System / token / 主色副色 / component style 盤點 + 後續批次建議**；屬 docs-only / read-only；本批 phase `20260523-day-1-batch-5` **不**修改 src / content / template / dist；不 build / 不 deploy / 不 push。

本文件**不取代**既有 DS-1/2/3 技術深入文件；屬 5/23 系統級盤點與 Phase 1 可用性判定。

對應上層：
- `docs/design-system.md`（high-level Design System reference）
- `docs/css-design-system-policy.md`（10 條禁則 + 三層 token 政策）
- `docs/design-system-ds1-audit.md`（Phase DS-1 盤點）
- `docs/design-system-ds2-token-naming.md`（Phase DS-2 naming strategy）
- `docs/design-system-ds3b-theme-overrides-proposal.md`（Phase DS-3-b platform override）
- `docs/design-system-ds3c-hardcoded-color-pre-analysis.md`（Phase DS-3-c hard-coded color）
- `docs/phase-status-20260523.md` §8（5/23 Phase 1 Design system 維度）
- `CLAUDE.md` §9 / §10（CSS / class 命名 / Blogger Design Token 匯出）

---

## 1. 目前 Design System 定位

### 1.1 性質

| 維度 | 狀態 |
|---|---|
| **Phase** | Phase 1 基礎樣式規範 |
| **目的** | 支撐 Blogger 與 GitHub Pages 兩平台之**靜態文章閱讀**為核心 |
| **設計哲學** | 共用 Design System；platform theme 走 sealed `.lab-site--{platform}` selector |
| **過度設計風險** | 🟢 低；當前避免過度設計（per `CLAUDE.md` §4 第一版限制 + §9 命名規範）|
| **可搬家性** | ✅ 純 SCSS + CSS variable；無 framework dependency；可隨 source repo 搬家 |
| **可重建性** | ✅ build script 派生；Blogger CSS 為一次性貼上後不再變動 |

### 1.2 是否足以支撐 Blogger / GitHub Pages 靜態文章閱讀

✅ **是**。理由：

| 元素 | 兩平台 parity | 落地狀態 |
|---|---|---|
| Article body 排版 | ✅ `.lab-blogger-article` / `.lab-article` 群組 selector 共用 max-width + cover | per `_article.scss` |
| Header / Nav | ✅ GitHub 端完整；Blogger 主題層級 | per `_header.scss` + Blogger 主題 |
| Footer | ✅ 同上 | per `_footer.scss` |
| Article components | ✅ 全 17 個 component partial 完整 | per `components/*.scss` |
| Hashtag / relatedLinks / otherLinks / affiliate / download / book-photo | ✅ 兩平台 parity | per `phase-1-completion-report.md` §7.1 |
| Blogger theme CSS 匯出 | ✅ 4 entry 完整（tokens / article / components / full-style）| per `dist-blogger/theme/`（build-blogger-theme-css.js）|

### 1.3 是否不應過度設計

✅ **是；當前已有 governance 保護過度設計**：

- per `docs/css-design-system-policy.md` §5 之 **10 條禁則**（含「不寫死 hex」/「不直接讀 platform token」/「不 invent component-specific token」等）
- per `CLAUDE.md` §4 第一版**不得使用** Tailwind / Bootstrap / 任何 CSS framework
- per `CLAUDE.md` §9.4 **Flexbox 優先**；CSS Grid 需 user 明確需求
- 本批 audit 結論：當前 design system **平衡良好**；不需重構

---

## 2. token 使用現況

### 2.1 SCSS 結構盤點

per `src/styles/`：

```
src/styles/
├─ main.scss                        # GitHub Pages entry；@use 33 partials
├─ abstracts/                       # 7 partials（純 token / mixin）
│  ├─ _tokens.scss                  # color / radius / shadow / focus-ring tokens（mixin lab-tokens-base）
│  ├─ _themes.scss                  # platform theme override（.lab-site--github / .lab-site--blogger / .lab-blogger-article）
│  ├─ _spacing.scss                 # spacing token + $space-* SCSS 變數
│  ├─ _typography.scss              # font family / size / line-height / weight token
│  ├─ _breakpoints.scss             # breakpoint token + $bp-* SCSS 變數
│  ├─ _z-index.scss                 # z-index scale
│  └─ _mixins.scss                  # 共用 mixin（含 lab-focus-ring）
├─ base/                            # 4 partials
│  ├─ _reset.scss                   # CSS reset
│  ├─ _base.scss                    # 全域基底 + .lab-hero（含 1 個 documented exempted hex gradient）
│  ├─ _article.scss                 # 兩平台共用 article max-width
│  └─ _print.scss                   # print stylesheet
├─ layout/                          # 7 partials
│  ├─ _header.scss / _nav.scss / _mobile-drawer.scss / _footer.scss / _sidebar.scss / _grid.scss / _post-list.scss
├─ components/                      # 17 partials
│  ├─ article components：_affiliate-box / _book-photo / _download-box / _related-links / _related-posts / _hashtag / _social-follow / _adsense / _toc / _code-block / _prev-next / _back-to-top
│  ├─ list / card：_card / _post-card / _tag / _breadcrumb
│  └─ generic：_button
└─ blogger/                         # Blogger 獨立 pipeline 之 5 個檔
   ├─ blogger-tokens.scss           # Blogger 專用 tokens（scope to .lab-blogger-article）
   ├─ blogger-article.scss          # Blogger article body 排版
   ├─ blogger-components.scss       # Blogger 全域 components
   ├─ blogger-full-style.scss       # 一次性 Blogger 主題貼上 CSS（合併）
   └─ _blogger-article-rules.scss / _blogger-components-rules.scss   # mirror partial
```

**檔案數**：42 個 SCSS 檔（GitHub pipeline 37 + Blogger pipeline 5）。

### 2.2 各 token 類別現況

| Token 類別 | 來源 | 命名 prefix | 狀態 |
|---|---|---|---|
| **Color** | `_tokens.scss` + `_themes.scss` | `--lab-color-*` | ✅ 完整（含 primary / accent / text / muted / background / surface / border / link 系列 / gray-50~900 / overlay-dark / on-primary / semantic alias secondary / text-muted / bg / bg-soft / badge-bg / badge-text / callout-bg / callout-border）|
| **Typography** | `_typography.scss` | `--lab-font-*` | ✅ 完整（family / size / line-height / weight）|
| **Spacing** | `_spacing.scss` | `--lab-space-*` + `$space-*` SCSS 變數 | ✅ 完整；雙軌結構（CSS 變數 + SCSS 變數）支撐 @media |
| **Radius** | `_tokens.scss` | `--lab-radius-*` | ✅ 含 sm / md / lg / full |
| **Shadow** | `_tokens.scss` | `--lab-shadow-*` | ✅ 含 sm / md / lg / card |
| **Breakpoint** | `_breakpoints.scss` | `$bp-*` SCSS 變數 + CSS variable mixin | ✅ 完整；@media 用 SCSS 變數（CSS variable 限制） |
| **Z-index** | `_z-index.scss` | `--lab-z-*` | ✅ 完整 |
| **Focus ring** | `_tokens.scss` | `--lab-focus-ring-*` | ✅ 半透明柔和策略；含 color / width / offset / style |
| **Container** | `_tokens.scss` | `--lab-container-*` | ✅ 階層（sm / md / lg）|

### 2.3 hard-coded hex / px / magic number 現況

per `docs/design-system-ds3c-hardcoded-color-pre-analysis.md` + 5/23 re-grep（per Batch 5 read-only 驗證）：

| 維度 | 結果 |
|---|---|
| 含 hex 之 SCSS 檔 | **3 個**（`_tokens.scss` / `_themes.scss` / `_base.scss`）|
| hex 是否合理 | ✅ 全合理：tokens（token 定義層）+ themes（platform override 定義層）+ base（1 個 documented exempted `.lab-hero` gradient）|
| 違反禁則之 hard-coded hex | **0 個**（DS-3 系列已 resolved；10 fixes + 2 documented exemptions）|
| `_base.scss` 之 exempted hex | `#eff6ff` + `#fff`（hero gradient；屬視覺表現色；per DS-3-c §14.3 documented exemption）|

### 2.4 px / magic number 狀況

- ✅ Spacing 全採 `rem`（per `CLAUDE.md` §2 spacing 單位以 `rem` 為主）
- ✅ Container 全採 `rem`
- ✅ Radius 全採 `rem`（含 9999px 之 full radius 為標準慣例；非 magic number）
- ✅ Shadow 採 `rgb(... / N%)` 透明度；無 px magic number
- ✅ Focus ring `2px` 為**該屬性之正確單位**（focus outline 為 px 屬於 design 慣例；非 magic number）

→ **無 px magic number 違規**。

---

## 3. 主色 / 副色狀態

### 3.1 當前主色 / 副色

per `src/styles/abstracts/_tokens.scss` + `_themes.scss`：

| Token | 預設值 | GitHub override | Blogger override |
|---|---|---|---|
| `--lab-color-primary` | `#2563eb`（藍）| `#2563eb`（同 default）| `#b45309`（warm；source-level；目前 Blogger 端**不生效**，per `_themes.scss` 註解 §3）|
| `--lab-color-accent` | `#f97316`（橘）| reserved | reserved |
| `--lab-color-secondary` | alias 至 `--lab-color-accent` | explicit alias | explicit alias |
| `--lab-color-text` | `#1f2937`（深灰）| — | — |
| `--lab-color-muted` | `#6b7280`（中灰）| — | — |
| `--lab-color-background` | `#ffffff`（白）| — | — |
| `--lab-color-surface` | `#f8fafc`（淺灰白）| — | — |
| `--lab-color-border` | `#e5e7eb`（淺灰）| — | — |
| `--lab-color-link` | `#2563eb`（同 primary）| `var(--lab-color-primary)` | `var(--lab-color-primary)` |
| `--lab-color-link-hover` | `#1d4ed8`（深藍）| reserved | reserved |
| `--lab-color-link-visited` | `#6d28d9`（紫）| reserved | reserved |

### 3.2 語意色（success / warning / danger / info）

| 語意色 | 狀態 |
|---|---|
| `--lab-color-success` | ❌ **未定義** |
| `--lab-color-warning` | ❌ **未定義** |
| `--lab-color-danger` | ❌ **未定義** |
| `--lab-color-info` | ❌ **未定義** |

→ **當前無語意色 token**；如有需要採以下替代：
- 既有 Admin 之 stat-card / warning banner 使用 inline style（`background: #fff3cd; color: #856404` 等；屬 dev-mode-only 之 admin/index.ejs）
- 系統訊息使用 `--lab-color-primary` / `--lab-color-muted` 等基本 token

### 3.3 主色 / 副色是否符合內容方向

當前內容方向（per `CLAUDE.md` §2.1）：

```
Blogger 站：書評、生活、四格、教具下載、書評漫畫、講座
GitHub 站：技術筆記、AI 工具、經營筆記
```

| 維度 | 評估 |
|---|---|
| GitHub 主色 `#2563eb`（藍）| ✅ 符合「技術筆記」之冷色調定位 |
| GitHub 副色 `#f97316`（橘）| 🟡 與藍主色形成補色對比；用於 accent / CTA |
| Blogger 主色 `#b45309`（warm）| 🟡 source-level 已設；但 **目前 Blogger 端不生效**（per `_themes.scss` 註解 §3；Blogger 4 個 entry 都不 @use 'abstracts/themes'；屬 DS-3-b-blogger-entry future batch）|
| Blogger 當前實際主色 | 仍為 `#2563eb`（藍；來自 `lab-tokens-base` mixin default）|
| 是否符合「貝果書屋 / 生活 / 教育 / 書評漫畫」| 🟡 partial；藍色偏冷不完全契合書評 / 生活溫暖調；但 DS-3-b platform branding（Option B）屬 future user 表態 |

### 3.4 是否需要現在調整

🟡 **不急；可延後**。理由：

| 觀點 | 理由 |
|---|---|
| ✅ 不急 | 當前 Phase 1 之核心 KPI 為「靜態發布 + 文章可讀」；色彩 polish 屬 Phase 2 visual 範疇 |
| ✅ 不急 | DS-3-b 之 Option A 保守版已落地；platform theme 結構就位；後續切到 Option B（平台品牌色）為 trivial 改動 |
| 🟡 可考慮 | Blogger 端主色不生效屬已知 limit；DS-3-b-blogger-entry batch 可解；但需 user 重貼 Blogger 後台 CSS（一次性成本）|
| 🟡 可考慮 | 內容方向（書評 / 教具下載）可能需要溫暖 accent；但需 user 設計師決方案 |

**推薦延後條件**：
- ⭐ Phase 1 close 後再評估
- ⭐ user 表態「想要平台品牌化」後再啟動 DS-3-b-blogger-entry + 色票選定

---

## 4. component style 現況

### 4.1 各 component 之 SCSS 落地狀態

| Component | SCSS partial | 落地 | 兩平台 parity |
|---|---|---|---|
| **header** | `layout/_header.scss` | ✅ | GitHub 完整；Blogger 主題層級 |
| **nav** | `layout/_nav.scss` | ✅ | 同上 |
| **mobile drawer** | `layout/_mobile-drawer.scss` | ✅ | GitHub only（Blogger 主題自管）|
| **footer** | `layout/_footer.scss` | ✅ | 兩平台 parity |
| **sidebar** | `layout/_sidebar.scss` | ✅ | 兩平台 parity |
| **post detail** | `_article.scss`（兩平台共用 max-width）+ `post-detail.ejs` | ✅ | parity |
| **post card** | `components/_post-card.scss` + `pages/post-list.ejs` | ✅ | GitHub only（首頁 / 列表 / 分類 / 標籤頁）|
| **card**（generic）| `components/_card.scss` | ✅ | GitHub only |
| **related links** | `components/_related-links.scss` | ✅ | parity；GitHub 端含 GA4 click attrs |
| **other links** | `components/_related-links.scss`（同檔；類別 `lab-other-links`）| ✅ | parity；GA4 click attrs |
| **hashtag** | `components/_hashtag.scss` | ✅ | parity；仍 `<span>`（非 `<a>`）|
| **affiliate block** | `components/_affiliate-box.scss` | ✅ | parity；GitHub 端含 click_affiliate_cta attrs |
| **download box** | `components/_download-box.scss` | ✅ | parity |
| **book photo** | `components/_book-photo.scss` | ✅ | parity（GitHub 端 dormant；無 ready book-review post）|
| **back-to-top button** | `components/_back-to-top.scss` | ✅ | GitHub only |
| **pagination** | ❌ **未實作** | — | 不需要（per `phase-status-20260523.md` §5.4；採 default recent + show-all toggle 代替）|
| **admin overview** | `src/views/admin/index.ejs` inline `<style>` + 既有 components | ✅ | GitHub only（dev-mode-only；prod 不產出）|
| **404 page** | `404.html`（Vite mpa default + Flask fallback）| ✅ | 線上 GitHub Pages 自動 fallback |
| **prev / next** | `components/_prev-next.scss` | ✅ | parity |
| **TOC** | `components/_toc.scss` | ✅ | parity |
| **code block** | `components/_code-block.scss` | ✅ | parity |
| **breadcrumb** | `components/_breadcrumb.scss` | ✅ | parity |
| **tag**（item）| `components/_tag.scss` | ✅ | parity |
| **adsense placeholder** | `components/_adsense.scss` | ✅ | parity；GitHub 端 enabled=false（待 custom domain）|
| **social follow** | `components/_social-follow.scss` | ✅ | parity |
| **button**（generic）| `components/_button.scss` | ✅ | parity |

### 4.2 兩平台 parity 完成度

per 5/22 Phase 9-h 系列（per `publish-workflow.md` §11）：

| Article block | Blogger 端 | GitHub 端 | parity 狀態 |
|---|---|---|---|
| affiliate-box | ✅ 既有 | ✅ Phase 9-h-b-b 落地 | ✅ |
| download box | ✅ 既有 | ✅ Phase 9-h-c-b 落地 | ✅ |
| hashtag（`<span>` non-link）| ✅ 既有 | ✅ Phase 9-h-d-b 落地 | ✅ |
| book photo | ✅ 既有 | ✅ Phase 9-h-e-b 落地 | ✅（GitHub 端 dormant；無 ready book-review post）|
| related links | ✅ Phase 9-g-d-b | ✅ Phase 9-g-f-b | ✅ |
| other links | 同上 | 同上 | ✅ |

→ Phase 1 article block parity **8/8 完整**。

### 4.3 BEM 命名 + lab- prefix 一致性

per `CLAUDE.md` §9.1 / §9.3：

| 維度 | 一致性 |
|---|---|
| `lab-` prefix | ✅ 全 component class 一致 |
| BEM block / element / modifier | ✅ 一致（如 `.lab-affiliate-box` / `.lab-affiliate-box__cta` / `.lab-button--primary`）|
| Theme class | ✅ `.lab-site--blogger` / `.lab-site--github` 一致 |
| Blogger article wrapper | ✅ `.lab-blogger-article` |

---

## 5. RWD / layout 現況

### 5.1 mobile / desktop 可讀性

| 維度 | 評估 |
|---|---|
| mobile（< 768px）| ✅ 基本可讀；mobile-drawer 已實作；sticky-header 已落地 |
| tablet（768-1024px）| ✅ 中間態無 layout 斷裂 |
| desktop（> 1024px）| ✅ 主要使用情境 |
| sidebar 大版右側 / 小版下移 | ✅ per `CLAUDE.md` §17 article 版型；`_sidebar.scss` 已處理 |
| post-list / category / tag 頁 RWD | ✅ flex-wrap 自然 wrap |

### 5.2 已知 overflow 問題

| 元素 | 狀態 |
|---|---|
| 長 slug / 長 URL 顯示（detail panel）| 🟡 partial；當前 mono 顯示；未加 `word-break` / `overflow-wrap: anywhere`；極長 URL 可能 overflow |
| 長 hashtag 字串 | 🟡 partial；hashtag 為 inline `<span>`；長中文 hashtag 不會破版但可能 wrap 不雅 |
| 長 title 多語顯示 | ✅ 已正確 wrap；無 overflow |
| 表格 / pre code block 長行 | ✅ `_code-block.scss` 含 `overflow-x: auto` |
| 圖片寬度 | ✅ `max-width: 100%` |

### 5.3 需要優先修的版面問題

🟢 **目前無 critical layout 問題**。可考慮之小修：

| 項目 | 優先級 | 預估 LOC |
|---|---|---|
| 長 URL `word-break: break-all` 補強（Admin detail panel mono）| 🟢 low | ~3 行 |
| 長 hashtag wrap polish | 🟢 low | ~3 行 |
| mobile 下 sidebar 移動位置之 spacing 微調 | 🟡 medium（視 user 觀察）| ~5 行 |

### 5.4 Flexbox 優先 vs CSS Grid

per `CLAUDE.md` §9.4：

```
本專案 CSS / SCSS 排版優先使用 Flexbox。
除非有明確需求或人工確認，避免使用 CSS Grid。
```

當前現況：
- ✅ 大部分 layout / component 採 Flexbox
- ✅ `.lab-card-grid` 命名保留但實作仍走 Flexbox
- ❌ **無** `grid-template-columns` / `grid-template-rows` 使用
- ✅ 對齊 CLAUDE.md §9.4 之保守路線

→ **不急著引入 Grid**；當前 Flexbox 足以支撐 Phase 1 所有 layout 需求。

---

## 6. SEO / performance 角度

### 6.1 HTML 結構是否避免過度包裝

| 元素 | 評估 |
|---|---|
| `<article>` 結構 | ✅ 語意化（per `_article.scss` 之 `.lab-blogger-article` / `.lab-article`）|
| Section nesting depth | ✅ 控制在 3-4 層；無過度 `<div>` wrapper |
| Aside 區塊 | ✅ relatedLinks / otherLinks 採 `<aside>` 語意 |
| Figure / figcaption | ✅ book-photo 採 `<figure>` 結構 |
| Heading hierarchy | ✅ H1 (title) → H2 (article body) → H3+ 為 author markdown 控制 |

### 6.2 樣式是否避免過重

| 維度 | 評估 |
|---|---|
| GitHub Pages CSS bundle size | ✅ Vite tree-shake；只 build 必要 SCSS |
| Blogger CSS（一次性貼上）| ✅ `blogger-full-style.css` 為合併輸出；含 tokens + components + article 三層 |
| Component CSS 平均行數 | ✅ 多數 < 50 行；無單一 component 超重 |
| 全域 CSS（reset / base）| ✅ 約 200 行；屬合理範圍 |
| 是否依賴外部 CSS framework | ❌ 無（per `CLAUDE.md` §4 第一版不得使用）|

### 6.3 是否會影響文章速度

| 維度 | 評估 |
|---|---|
| CSS critical path | ✅ Vite 自動 inline / bundle；無 blocking render |
| Font loading | ✅ 系統字型 fallback；無 web font 阻塞 |
| Image lazy loading | ✅ per `src/js/modules/lazy-image.js` + `loading="lazy"` |
| JavaScript bundle | ✅ minimal vanilla JS modules（sticky-header / mobile-drawer / back-to-top / ga4-events / link-tracker / etc.）|
| Blogger 端額外 JS | ❌ 無 Vite bundle；Blogger HTML 為純靜態 |

### 6.4 是否符合「HTML 結構清楚、易維護、SEO 友善」

✅ **是**。理由：

| 維度 | 符合 |
|---|---|
| 語意化 HTML | ✅（article / aside / nav / footer / figure 等）|
| meta tags（title / description / OG / canonical / JSON-LD）| ✅（per `phase-1-completion-report.md` §3.4）|
| sitemap.xml 過濾 noindex | ✅ 14 entries |
| robots.txt 含 Disallow + Sitemap | ✅ |
| 結構化資料（BlogPosting / WebSite / Book mainEntity）| ✅ Phase 9-g-g + 9-f-g 落地 |
| 兩平台 canonical 一致 | ✅ |
| 不依賴 JS render（SSR via Vite mpa）| ✅ GitHub Pages 端為純靜態；Blogger 端為平台 render |

---

## 7. Phase 1 結論

### 7.1 ✅ 已達 Phase 1 基本可用

| 維度 | 狀態 |
|---|---|
| Token 系統完整（color / typography / spacing / radius / shadow / breakpoint / z-index / focus-ring）| ✅ |
| Component partial 完整（17 個 article components + 7 個 layout + 7 個 abstracts + 4 個 base）| ✅ |
| 兩平台 parity（8/8 article blocks）| ✅ |
| BEM 命名 + `lab-` prefix 一致 | ✅ |
| Theme class structure | ✅ `.lab-site--{platform}` / `.lab-blogger-article` |
| DS-3 hard-coded color resolved（10 fixes + 2 exemptions）| ✅ |
| Flexbox 優先 | ✅ |
| HTML 結構語意化 / SEO 友善 | ✅ |
| Blogger CSS 匯出 pipeline | ✅ 4 entry |
| RWD 基本可讀 | ✅ |

### 7.2 🟢 Must Fix before Phase 1 close

**無**。

當前 Design system 已超過 Phase 1 基本可用標準；無 source-level must fix。

### 7.3 🟡 Should Improve soon

| # | 項目 | 對應 | 預估 LOC |
|---|---|---|---|
| 1 | 長 URL `word-break: break-all` 補強（Admin detail panel）| `src/views/admin/index.ejs` inline `<style>` | ~3 行 |
| 2 | 長 hashtag wrap polish | `components/_hashtag.scss` | ~3 行 |
| 3 | Admin overview 視覺微調（stat-card density / detail panel spacing）| `src/views/admin/index.ejs` inline `<style>` | ~10 行 |

### 7.4 🔵 Nice to have

| # | 項目 | 預估 LOC |
|---|---|---|
| 1 | DS-3-b platform theme 完整化（Option B 平台品牌色；需 user 表態 + 色票選定）| ~20 行 |
| 2 | DS-3-b-blogger-entry（讓 themes 真正進 Blogger CSS；需 user 重貼 Blogger 後台）| ~10 行 + user 一次性貼 CSS |
| 3 | 語意色 token 補完（success / warning / danger / info）| ~20 行 + token 設計 |
| 4 | Relative time 顯示（Admin / post detail）| ~10 行 |
| 5 | Dark mode 支援 | ~50 行 + token 重整 |
| 6 | Print stylesheet polish | ~20 行 |
| 7 | Sort indicator（↑↓ icon）for Admin overview | ~5 行 |

### 7.5 🔵 Phase 2+ 才做

| # | 項目 | 阻擋條件 |
|---|---|---|
| 1 | Visual regression test（DS-5）| 未啟動；需 user 表態 + tooling 選定 |
| 2 | Animation / micro-interaction polish | 屬 visual polish；Phase 1 不必要 |
| 3 | Component-level token 細化（如 affiliate-box-specific tokens）| 需 design system maturity；Phase 1 不必要 |
| 4 | Storybook / component playground | 屬 dev tooling；Phase 1 不必要；違反「不過度工程化」原則 |
| 5 | DS-4 article components 共用化 reorganization | 屬 refactor；當前 partial 結構已足夠 |
| 6 | DS-5 visual regression test | 屬 testing infrastructure |

---

## 8. 不建議現在做的項目

| # | 項目 | 不建議理由 |
|---|---|---|
| 1 | **大改視覺風格** | Phase 1 close 在即；大改視覺會延後核心 KPI；DS-3-b Option A 保守已落地，足以撐 Phase 1 |
| 2 | **全面重構 SCSS 結構** | 當前 5 大區（abstracts / base / layout / components / blogger）結構穩定；重構無 ROI |
| 3 | **導入複雜 Design System**（如 Material / Carbon / Polaris token system）| 違反 `CLAUDE.md` §4 第一版限制；不需依賴外部 token system |
| 4 | **改成 Tailwind / Bootstrap / 任何 CSS framework** | 違反 `CLAUDE.md` §4 第一版**永不**使用 framework |
| 5 | **大改 component HTML 結構** | 影響 Blogger 已貼文（HTML 結構變動需重貼）+ GitHub Pages dist 重建 + 線上 deploy；屬高風險 |
| 6 | **token rename / 重整 namespace** | DS-2 已採 additive-only 原則；rename 屬 breaking change |
| 7 | **Dark mode 啟動** | Phase 1 不必要；token 重整成本高；user 未表態需求 |
| 8 | **Animation library 引入**（如 Framer Motion / GSAP）| 違反「不過度工程化」；Phase 1 靜態文章閱讀為核心 |
| 9 | **CSS-in-JS 引入** | 與既有 SCSS pipeline 衝突；違反 Phase 1 技術限制 |
| 10 | **Component refactor 至獨立 npm package** | 過度工程；違反「可搬家」原則（單一 source repo）|
| 11 | **大改 Blogger CSS 結構**（破壞既有貼上 CSS 之 selector）| 影響 Blogger 後台已貼 CSS；屬高風險 |
| 12 | **改變 `.lab-` prefix / BEM convention** | 全 component 一致；改變 = 大規模 sed；屬高風險 |
| 13 | **引入 CSS variables `@property`** | 屬 advanced；Phase 1 不必要；瀏覽器支援議題 |
| 14 | **改成 Sass modules / 拆 npm package** | 過度工程；既有 `@use` 結構足夠 |

---

## 9. 後續小批次建議

per §7 priority + 既有 docs 共識：

### 9.1 🟢 短期可啟動（docs-only or 單檔小修；風險低）

| Batch ID | 主題 | 範圍 | 預估 LOC | 風險 |
|---|---|---|---|---|
| **DT-A1** | Admin detail panel 長 URL word-break 補強 | `src/views/admin/index.ejs` inline `<style>` | ~3 行 | 🟢 低 |
| **DT-A2** | hashtag long-text wrap polish | `src/styles/components/_hashtag.scss` | ~3 行 | 🟢 低 |
| **DT-A3** | Admin stat-card density 微調 | `src/views/admin/index.ejs` inline `<style>` | ~5 行 | 🟢 低 |
| **DT-A4** | mobile drawer transition timing polish | `src/styles/layout/_mobile-drawer.scss` | ~3 行 | 🟢 低 |
| **DT-A5** | back-to-top button transition polish | `src/styles/components/_back-to-top.scss` | ~3 行 | 🟢 低 |

### 9.2 🟡 中期可啟動（需 user 表態 / 多檔小修）

| Batch ID | 主題 | 範圍 | 阻擋 |
|---|---|---|---|
| **DT-B1** | DS-3-b platform theme Option B（平台品牌色）| `_themes.scss` ~20 行 | user 設計師決方案 + 色票 hex |
| **DT-B2** | DS-3-b-blogger-entry（讓 themes 進 Blogger CSS）| `blogger-tokens.scss` 補 @use；重產 dist-blogger | user 重貼 Blogger 後台 CSS（一次性成本）|
| **DT-B3** | 語意色 token 補完（success / warning / danger / info）| `_tokens.scss` + 視需求 component 使用 | user 表態需求（如想要 callout 元件）|
| **DT-B4** | 404 page polish | `src/views/pages/404.ejs` + 對應 SCSS | user 表態需求 |
| **DT-B5** | post detail readability polish（typography 微調 / spacing / heading style）| `_typography.scss` + 對應 component | user 表態需求 |

### 9.3 🔵 Phase 2+ 啟動

| Batch ID | 主題 | 阻擋 |
|---|---|---|
| **DT-C1** | Visual regression test 引入（DS-5）| user 表態 + tooling 選定（Playwright / Chromatic / Percy 等）|
| **DT-C2** | Dark mode 支援 | user 表態；token 重整 |
| **DT-C3** | DS-4 article components 共用化 reorganization | refactor 需求；屬 Phase 2+ |
| **DT-C4** | Animation / micro-interaction polish | user 表態 |
| **DT-C5** | Print stylesheet polish | user 表態 |

### 9.4 推薦短期 batch 順序

⭐ **第一推薦**：**DT-A1**（Admin 長 URL word-break）+ **DT-A2**（hashtag wrap）合批

理由：
- 🟢 風險最低（單檔 ≤ 5 行；零功能改動）
- 修 §5.3 之兩個 low-priority overflow polish
- 對齊 Admin overview audit §10 之 A 系列 candidate
- 完成後 working tree 仍 clean；可順勢評估 DT-A3-A5

⭐ **第二推薦**：**DT-A3**（Admin stat-card density）

理由：
- 5/22 night 5 fixes 後 stat-card 已 14 張；視覺密度可微調
- 對齊 `admin-overview-audit-20260523.md` §6.3 風險評估

### 9.5 不推薦短期啟動

| 項目 | 不推薦理由 |
|---|---|
| DT-B1 / DT-B2（platform theme Option B + Blogger entry）| 需 user 設計師決方案 + 色票 + user 重貼 Blogger 後台；屬中期工作 |
| DT-B3（語意色 token）| 需 user 表態具體 callout / alert 元件需求；當前無實際用例 |
| DT-C1-C5（Phase 2+）| 均非當前 ROI 重點 |

---

## 10. 本批不做事項

per spec：

- ❌ 不修改 `src/styles/**/*.scss`
- ❌ 不修改 `src/views/**/*.ejs`
- ❌ 不修改 `src/js/**/*.js`
- ❌ 不修改 `content/` / `dist/` / `dist-blogger/` / `dist-promotion/`
- ❌ 不修改既有 `docs/design-system*.md` / `docs/css-design-system-policy.md`
- ❌ 不跑 `npm run build` / `npm run dev` / `npm run build:blogger-theme` / `npm run validate:content`
- ❌ 不 push
- ❌ 不 deploy
- ❌ 不啟動 DT-A / DT-B / DT-C 任一 batch
- ❌ 不加入 `.claude/`

---

## 11. Cross-links

### 11.1 既有 Design System docs

- `docs/design-system.md`（high-level Design System reference）
- `docs/css-design-system-policy.md`（10 條禁則 + 三層 token 政策）
- `docs/design-system-ds1-audit.md`（Phase DS-1 盤點）
- `docs/design-system-ds2-token-naming.md`（Phase DS-2 naming strategy）
- `docs/design-system-ds3b-theme-overrides-proposal.md`（Phase DS-3-b platform override）
- `docs/design-system-ds3c-hardcoded-color-pre-analysis.md`（Phase DS-3-c hard-coded color）

### 11.2 上層規範

- `CLAUDE.md` §4（第一版技術限制；不得使用 framework）
- `CLAUDE.md` §9（CSS / class 命名規則）
- `CLAUDE.md` §10（Blogger Design Token 匯出）
- `CLAUDE.md` §17（文章頁基本版型）
- `CLAUDE.md` §19（Design System 頁規則）

### 11.3 相關 schema / phase docs

- `docs/phase-1-completion-report.md`（Phase 1 最終 report）
- `docs/phase-status-20260523.md` §8（5/23 Phase 1 Design system 維度）
- `docs/admin-overview-audit-20260523.md` §10（Admin polish batch candidates）
- `docs/publishing-workflow-20260523.md` §1.1（system-level orientation）

### 11.4 5/23 同日 batch docs

- `docs/phase-status-20260523.md`（Batch 1）
- `docs/ga4-link-tracking-spec.md`（Batch 2；spec 固化）
- `docs/admin-overview-audit-20260523.md`（Batch 3）
- `docs/publishing-workflow-20260523.md`（Batch 4）
- 本文件（Batch 5）

### 11.5 Source refs

- `src/styles/main.scss`（GitHub Pages entry）
- `src/styles/abstracts/`（7 partials）
- `src/styles/base/`（4 partials）
- `src/styles/layout/`（7 partials）
- `src/styles/components/`（17 partials）
- `src/styles/blogger/`（5 partials；獨立 Blogger pipeline）
- `src/scripts/build-blogger-theme-css.js`（Blogger CSS 匯出 build script）
- `dist-blogger/theme/blogger-{tokens,article,components,full-style}.css`（4 entry 輸出）

---

（本文件結束）
