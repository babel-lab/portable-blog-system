# Blogger / GitHub CSS Design System Policy

本文件為 **Blogger 站與 GitHub Pages 站之 CSS Design System 共用政策**。屬高層政策 / 規範性文件；本批**不**修改任何 CSS / SCSS / EJS / build / 既有 source；亦**不**強制改變既有 selector 命名。實作層之逐步落地拆批詳見 §7。

對應上層文件：
- `CLAUDE.md` §9（CSS / class 命名規則；`lab-` 共用 prefix；`.lab-site--blogger` / `.lab-site--github` theme class；§9.4 Flexbox 優先；§9.5 SCSS 歸類）
- `CLAUDE.md` §10（Blogger Design Token 匯出；`blogger-tokens.css` / `blogger-components.css` / `blogger-article.css` / `blogger-full-style.css`）
- `CLAUDE.md` §17（文章頁基本版型；Blogger 與 GitHub 之 article body 結構需一致）
- `CLAUDE.md` §19（Design System 頁規則；G-01 ~ G-07）
- `docs/design-system.md`（Design System 規格 / token / component catalog；本政策為其上層）
- `docs/blogger-export.md`（Blogger 匯出系統）
- `docs/github-deploy.md`（GitHub Pages 部署）
- `docs/rwd-interaction.md`（RWD 與互動）
- `docs/seo-ga4-adsense.md`（SEO 結構需求）

---

## §1 核心原則

### 1.1 共用一套 Design System（強制）

- ✅ **Blogger 站與 GitHub Pages 站共用同一套 CSS Design System**
- ❌ **不**建立兩套完全分離的 CSS
- ✅ 共用以下實作層：
  - layout（header / footer / nav / grid / sidebar）
  - article body（標題 / 段落 / 圖片 / 引文 / 代碼 / 列表 / 表格）
  - cards（post card / book card / download card / sidebar card / 推廣 card）
  - buttons / badges / tags / hashtags
  - related links / other links
  - RWD（breakpoint 體系、行為）
  - typography scale（font family / size / line-height / weight）
  - spacing scale（margin / padding / gap）
  - article block 元件（callout / TOC / book metadata / download box / affiliate box / series navigation / social follow / adsense placeholder）

### 1.2 平台差異透過 theme tokens 控制

平台間的可變項目限定在 **semantic theme tokens**：

- 主色 `--color-primary`
- 輔色 `--color-secondary`
- link color `--color-link`
- badge / tag 之 bg / text color
- soft background `--color-bg-soft`

→ 上述 token 可在 Blogger / GitHub 各自有不同值；但**所有 component**之實作只透過這層 semantic token 取色，**不**直接綁定平台。

### 1.3 HTML 結構盡量一致

- ✅ Blogger 與 GitHub 之 article HTML 結構**應盡量一致**
- ✅ 同一 component 在兩平台之 class 命名應一致（沿用 `CLAUDE.md` §9 之 `lab-` prefix + BEM）
- ✅ 維持結構一致有利於：
  - SEO（schema markup / 微資料一致；JSON-LD 推導一致）
  - 維護（一處改、兩處生效）
  - cross-build（同套 EJS partial 可雙平台共用）
  - 平台搬家（structure 不變即可搬至第三平台）

---

## §2 建議 token 分層

採三層架構：global → semantic → platform theme。component **僅吃 semantic 層**；platform 層僅覆寫 semantic token。

### 2.1 A. Global tokens（無語意；純尺度系統）

不分平台、不分語意，純粹定義「設計刻度系統」。component 不直接吃 global token 之色彩值（global 層不定義色彩）；但可直接吃 global 之尺度值（spacing / font-size / radius / shadow / breakpoint）。

| Token 類別 | 範例 |
|---|---|
| font family | `--font-sans` / `--font-serif` / `--font-mono` |
| font size scale | `--fs-xs` / `--fs-sm` / `--fs-base` / `--fs-lg` / `--fs-xl` / `--fs-2xl` ... |
| spacing scale | `--space-1` / `--space-2` / `--space-3` / `--space-4` / `--space-6` / `--space-8` ...（以 rem 為主，per `CLAUDE.md` §2.2 / §11） |
| radius | `--radius-sm` / `--radius-md` / `--radius-lg` / `--radius-pill` |
| shadow | `--shadow-sm` / `--shadow-md` / `--shadow-lg` |
| breakpoint | `--bp-sm` / `--bp-md` / `--bp-lg` / `--bp-xl` |
| z-index | `--z-base` / `--z-sticky` / `--z-drawer` / `--z-modal` / `--z-toast` |

### 2.2 B. Semantic tokens（語意；component 唯一可吃的色彩來源）

每個 token 對應一個 UI 語意；不綁平台、不綁 component。

| Token | 語意 |
|---|---|
| `--color-primary` | 主色（主要 CTA / 主要連結 hover / focus accent） |
| `--color-secondary` | 輔色（次要 CTA / 副標 / 標籤底色之替代調） |
| `--color-link` | 文章內超連結文字色 |
| `--color-text` | 主要文字色 |
| `--color-text-muted` | 次要 / 提示文字色（meta / caption / footnote） |
| `--color-bg` | 頁面 / 卡片之基底背景色 |
| `--color-bg-soft` | 區塊柔色背景（callout / 引文 / hover state） |
| `--color-border` | 分隔線 / 卡片邊框 |
| `--color-badge-bg` | badge / tag / hashtag 之底色 |
| `--color-badge-text` | badge / tag / hashtag 之文字色 |

可依未來需求擴充（如 `--color-success` / `--color-warning` / `--color-danger` / `--color-info`），但**新增 semantic token 屬政策變更，需更新本文件**。

### 2.3 C. Platform theme tokens（覆寫層；不被 component 直接讀）

Platform 層只負責「覆寫 semantic token 的值」。**component 不應直接吃** `--blogger-primary` / `--github-primary` 這類綁平台 token；component 統一吃 `--color-primary`，由 platform 層提供實際值。

→ 此分層保證未來新增第三平台（如 Hashnode / dev.to / 自家 CMS）時，**只需新增一層 platform theme 覆寫**，不需動 component 任何一行。

#### 2.3.1 反例（**不應如此設計**）

```scss
/* ❌ 不建議：component 直接綁平台 */
.lab-post-card {
  color: var(--blogger-text);  /* component 變成平台耦合 */
  background: var(--github-bg-card);
}
```

#### 2.3.2 正確設計

```scss
/* ✅ component 只吃 semantic */
.lab-post-card {
  color: var(--color-text);
  background: var(--color-bg);
  border-color: var(--color-border);
}
```

### 2.4 三層關係圖

```
[Platform layer]   blogger theme / github theme
       ↓ 覆寫
[Semantic layer]   --color-primary / --color-link / --color-bg / ...
       ↑ 唯一可讀來源
[Component layer]  .lab-post-card / .lab-button / .lab-badge / ...
       ↑ 也可讀
[Global layer]     --space-* / --fs-* / --radius-* / ...
```

Component 可讀 semantic + global；**不可**直接讀 platform。Platform 只能覆寫 semantic。Global 不能被 platform 覆寫（global 是系統常數）。

---

## §3 Blogger / GitHub theme 概念

### 3.1 Pseudo-code 示意

```scss
:root {
  /* default theme（fallback；無平台識別時生效） */
  --color-primary: #2563eb;
  --color-secondary: #f59e0b;
  --color-link: var(--color-primary);
  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-bg: #ffffff;
  --color-bg-soft: #f9fafb;
  --color-border: #e5e7eb;
  --color-badge-bg: #eef2ff;
  --color-badge-text: #3730a3;
}

[data-site="blogger"] {
  --color-primary: #c2410c;        /* 範例：橘調主色 */
  --color-secondary: #facc15;
  --color-link: var(--color-primary);
  --color-badge-bg: #ffedd5;
  --color-badge-text: #9a3412;
  --color-bg-soft: #fff7ed;
}

[data-site="github"] {
  --color-primary: #0d6efd;        /* 範例：藍調主色 */
  --color-secondary: #20c997;
  --color-link: var(--color-primary);
  --color-badge-bg: #cfe2ff;
  --color-badge-text: #084298;
  --color-bg-soft: #f8f9fa;
}
```

### 3.2 重要：實作 selector 由現有專案結構決定

**本文件之 `[data-site="..."]` selector 為 pseudo code 示意；不主張實作。**

本專案 `CLAUDE.md` §9.2 已定義既有 theme class convention：

```html
<body class="lab-site lab-site--blogger">...</body>
<body class="lab-site lab-site--github">...</body>
```

且 Blogger 文章匯出採另一外層 wrapper：

```html
<div class="lab-blogger-article">...</div>
```

→ 實作時 platform theme 覆寫**應用既有 `.lab-site--blogger` / `.lab-site--github` / `.lab-blogger-article` selector 體系**，而非新增 `[data-site="..."]` attribute。若日後決定改採 attribute-based 識別，屬獨立決策批次，需先更新 `CLAUDE.md` §9.2。

**本批不裁決 selector 寫法；本批不改 source。**

### 3.3 Token override 之 cascade 行為

由 CSS variable cascade 機制保證：

- component 寫 `color: var(--color-primary)` 一次
- 當 component 位於 `.lab-site--blogger` 之內 → 解析為 Blogger primary
- 當 component 位於 `.lab-site--github` 之內 → 解析為 GitHub primary
- 當 component 位於 dev preview / standalone page → fallback 至 `:root` 預設

無需 component 端做任何 `if blogger else github` 判斷。

---

## §4 可共用的文章 components

下列 components 應**單一實作 + 雙平台共用**（差異僅透過 semantic token 體現；HTML 結構與 class 命名一致）：

| Component | 描述 | 相關 SCSS 候選位置 |
|---|---|---|
| article header | 標題 + 英文標題 + meta 區塊外框 | `src/styles/base/_article.scss` |
| article title | 主標 + 英文副標 | 同上 |
| article meta | 發布日期 / 更新日期 / 作者 / 分類 | 同上 |
| article body | Markdown 渲染後之段落 / 引文 / 代碼 / 列表 | 同上 |
| article TOC | 文章目錄 | `src/styles/components/_toc.scss` |
| callout | 提示框 / 警告框 / 重點框 | （新增）`_callout.scss` |
| related links | 相關連結 aside（per `docs/related-links-schema.md`） | （新增）`_related-links.scss` |
| other links | 其他連結 aside | 同上 |
| link badge | 連結之 platform 前綴 badge | `src/styles/components/_hashtag.scss` 體系延伸 |
| social follow block | 社群追蹤區塊 | `src/styles/components/_social-follow.scss` |
| AdSense placeholder / block | 廣告版位佔位 | `src/styles/components/_adsense.scss` |
| book metadata block | 書籍 metadata（per `docs/book-schema.md`） | `src/styles/components/_book-photo.scss` 體系延伸 |
| download block | 教具下載區塊 | `src/styles/components/_download-box.scss` |
| series navigation | 系列文章導覽（per `docs/series-schema.md`） | （新增）`_series-nav.scss` |
| back-to-top button | 回頂部按鈕（per `CLAUDE.md` §6 Phase 6） | `src/styles/components/_back-to-top.scss` |
| affiliate box | 聯盟連結區塊 | `src/styles/components/_affiliate-box.scss` |
| prev / next | 上下篇導覽 | `src/styles/components/_prev-next.scss` |
| post card | 文章卡片 | `src/styles/components/_post-card.scss` |
| breadcrumb | 麵包屑 | `src/styles/components/_breadcrumb.scss` |

每個 component 之實作應遵守：

- 只吃 semantic token 取色
- 只吃 global token 取尺度
- class 命名遵守 `lab-` prefix + BEM（per `CLAUDE.md` §9.1 / §9.3）
- 排版優先 Flexbox（per `CLAUDE.md` §9.4）
- SCSS 檔放在 `src/styles/components/`（per `CLAUDE.md` §9.5）

---

## §5 不建議做法（明確禁則）

| # | 反例 | 理由 |
|---|---|---|
| 1 | 建立兩套大檔：`blogger.css` 與 `github.css` 各自演化 | 雙倍維護成本；任何 component 改一處需改兩處；長期會 drift |
| 2 | 同一 component 在 Blogger / GitHub 使用不同 class 命名 | 破壞 SEO 結構一致性；EJS partial 無法共用；CSS 無法共用；測試難以對齊 |
| 3 | 為了顏色差異複製整段 CSS | 顏色屬 token 層議題；不應拉動 component 邏輯；複製即等於 drift 起點 |
| 4 | GitHub Pages 與 Blogger article HTML 結構大幅分裂 | 破壞 cross-build 可能；破壞搬家性；破壞 JSON-LD / Open Graph 一致性；長期維護災難 |
| 5 | 把平台差異寫死在 component class 裡（如 `.lab-post-card--blogger` / `.lab-post-card--github`） | component 變成平台耦合；違反三層分層；未來新增第三平台需逐 component 加 modifier |
| 6 | Component 直接讀 `--blogger-primary` / `--github-primary` 之類綁平台 token | 違反 §2.3.1 反例；同 #5 之耦合問題；應改吃 semantic `--color-primary` |
| 7 | 在 EJS partial 內以 `<% if (site === 'blogger') %>` 切換 CSS 路徑 / inline style | 應由 CSS variable cascade 處理；EJS 不應承擔色彩決策 |
| 8 | 在 component CSS 內寫 `@media` 自定義 breakpoint 數值 | breakpoint 屬 global token；應用 `var(--bp-md)` 或 SCSS mixin（per `_breakpoints.scss` / `_mixins.scss`） |
| 9 | 在 component 寫死色票 hex 值 | 任何 hex 應放 token 層；component 內出現 `#xxxxxx` 即為違規 |
| 10 | 為了 Blogger 後台貼上方便而捨棄 BEM 命名 | Blogger 匯出採 `.lab-blogger-article` wrapper 即可避免污染主題；無需犧牲命名規範 |

---

## §6 與 SEO / 維護性的關係

### 6.1 HTML 結構穩定性 → SEO 友善

- HTML 結構越穩定 → 爬蟲 parse 結果越穩定 → SEO 信號越一致
- Theme token 屬 presentation layer；**不應影響語意 HTML**（不應為了平台美觀改變 `<article>` / `<header>` / `<section>` / `<aside>` 之選用）
- JSON-LD（per `docs/seo-ga4-adsense.md` / `docs/phase-9j-jsonld-landing-verification.md`）之 schema 應在 Blogger / GitHub 兩平台採同樣 structure；token 不影響 JSON-LD

### 6.2 Cross-platform 資料結構一致

- Blogger ↔ GitHub cross-link（per `CLAUDE.md` §16.4）
- relatedLinks / otherLinks（per `docs/related-links-schema.md`）
- JSON-LD / Open Graph
- canonical URL（per `docs/publish-json-schema.md` §5.3）
- series navigation（per `docs/series-schema.md`）

→ 上述**內容資料結構**在兩平台應**完全一致**；UI 呈現之色彩 / 視覺差異透過 theme token 解決；**不**應為了某平台修改資料 schema。

### 6.3 平台差異 = presentation layer

| 層 | 是否可平台差異 |
|---|---|
| 資料 schema（frontmatter / sidecar / settings） | ❌ 一致 |
| 語意 HTML structure（element / 階層 / aria）| ❌ 一致 |
| class 命名（per `lab-` BEM） | ❌ 一致 |
| 內容文字 / metadata | ❌ 一致 |
| Component layout（flex / grid 排列） | ❌ 一致 |
| RWD breakpoint 邏輯 | ❌ 一致（per `docs/rwd-interaction.md`） |
| 字級 / 行高 / spacing 數值 | ❌ 一致（global token） |
| **色彩**（primary / link / badge / soft bg） | ✅ 可平台覆寫 |
| **soft background 色階** | ✅ 可平台覆寫 |
| **logo / favicon / OG image** | ✅ 可平台差異（屬資產層；不在本政策範圍） |

### 6.4 維護成本對照

| 設計策略 | 改一處 component 顏色 | 改一處 spacing | 新增 component | 新增第三平台 |
|---|---|---|---|---|
| 兩套 CSS 分離 | 改 2 處 | 改 2 處 | 寫 2 次 | 寫 3 次（複製成 3 份） |
| **本政策（共用 + token）** | 改 1 處（token） | 改 1 處（token） | 寫 1 次（吃 token） | 新增 1 層 platform token override |

→ 隨 component 數量與平台數量成長，差距呈乘積放大。

---

## §7 後續落地建議（roadmap；非承諾）

依**最小破壞性 / 先盤點再實作**原則，建議分 6 phase 逐步落地：

### Phase DS-1：盤點現有 CSS / SCSS / EJS article blocks

- 列出當前 `src/styles/` 之既有檔案結構
- 列出當前 EJS article block 之共用 / 分裂程度
- 比對 Blogger 匯出 `dist-blogger/theme/*.css` 與 GitHub 站 CSS 之差異
- 找出已違反本政策的地方（如 component 直接讀平台 token / hex 寫死 / 重複 component）
- 屬純讀 / 純報告；**不改 source**

### Phase DS-2：整理 token naming

- 確認既有 SCSS 中之 token 命名是否符合 §2 三層
- 如有不符（如 `$blogger-primary` 變數綁平台），列出建議重命名
- 提出 token naming convention 文件（建議在本文件之延伸或新建 `docs/css-tokens-naming.md`）
- 屬 docs only；**不改 source**

### Phase DS-3：建立 Blogger / GitHub theme variables

- 在 `src/styles/abstracts/_themes.scss`（per `CLAUDE.md` §8 既有規劃）建立 `:root` / `.lab-site--blogger` / `.lab-site--github` 三層 cascade
- 補齊 semantic token 完整清單
- platform token override 值由 user 設計師確認後填入
- 屬 additive 實作；不破壞既有 component
- **第一個有 source 改動的 batch**

### Phase DS-4：抽共用 article components

- 將既有 EJS article blocks 抽成 single source partial
- 兩平台 build 共用同一 partial
- 修正違反本政策的 component（hex 改 token / 平台分支移除）
- 屬 refactor batch；需逐 component 拆批；每批驗證視覺一致

### Phase DS-5：審查 RWD / SEO / performance

- 確認 component 在 mobile / tablet / desktop 皆穩定
- 確認 JSON-LD / Open Graph / canonical 兩平台一致
- 確認 CSS 檔大小未爆量（per `docs/github-deploy.md` 之 GitHub Pages 100 MiB 限制 + Pages 1 GB 軟限）
- 確認 LCP / CLS / FID 不退步

### Phase DS-6：建立 visual checklist

- 建立 Design System 頁（per `CLAUDE.md` §19 之 G-01 ~ G-07）之 visual regression 清單
- 每次 component PR 過清單檢查
- 屬流程 / SOP 層；不一定要工具自動化

---

## §8 本批不做事項（嚴格邊界）

| # | 項目 | 說明 |
|---|---|---|
| 1 | **不改 CSS source** | 不動 `src/styles/**`；不動既有 `_themes.scss` / `_tokens.scss` / `_breakpoints.scss` |
| 2 | **不改 EJS source** | 不動 `src/views/**`；包括 layout / pages / blogger / design-system / promotion / seo / tracking / ads 全部 EJS |
| 3 | **不改 build** | 不動 `src/scripts/build-*.js`；不動 `vite.config.js`；不動 `package.json` |
| 4 | **不改 Blogger / GitHub output** | 不動 `dist/` / `dist-blogger/` 之既有產出；不影響 GitHub Pages 線上 |
| 5 | **不改 Admin** | 不動 `src/views/admin/**`；不動 `src/scripts/load-admin-posts.js` |
| 6 | **不改 deploy repo** | `D:\github\blog-new\portable-blog-deploy\` 完全未動 |
| 7 | **不 push** | source repo 仍留本機；無 upstream |
| 8 | **純 docs policy** | 本批僅新增 1 個 docs 檔案；不涉及任何 source / build / output 變動 |

---

## §9 對既有系統之影響

| 維度 | 狀態 |
|---|---|
| CSS / SCSS source | ❌ 未動 |
| EJS source（含 admin / layout / blogger / design-system） | ❌ 未動 |
| build scripts（build-github / build-blogger / build-promotion / build-sitemap / build-blogger-theme-css） | ❌ 未動 |
| content posts / settings / publish.json / fb.md | ❌ 未動 |
| `package.json` / npm dependencies | ❌ 未動 |
| `dist/` / `dist-blogger/` / `dist-promotion/` / `.cache/` | ❌ 未動 |
| Deploy repo | ❌ 未動 |
| GitHub Pages 線上 | ❌ 未動 |
| sitemap / robots / navigation（線上效果） | ❌ 未動 |
| validate baseline `0/22/17` | ❌ 預期未動（本批未動 validate rules 或 content） |
| Admin 既有功能（read-only / dry-run / sourceSite count / publishedAt 顯示） | ❌ 未動 |

---

## §10 邊界聲明

- ✅ 本文件**僅為政策 docs**；不改任何 source / build / dist / deploy
- ✅ 本文件**不**啟動 DS-1 ~ DS-6 任一 phase
- ✅ 本文件**不**裁決 token override selector 應用 `.lab-site--*` 還是 `[data-site="..."]`（per §3.2 沿用既有 CLAUDE.md §9.2 convention）
- ✅ 本文件**不**裁決具體色票 hex 值（由 user 設計師於 DS-3 階段提供）
- ✅ 本文件**不**改變既有 schema 或既有 SCSS / EJS 命名
- ✅ 對齊 `CLAUDE.md` §9（class 命名）/ §10（Blogger theme 匯出）/ §17（文章頁版型）/ §19（Design System 頁）

---

## §11 Cross-links

- `CLAUDE.md` §9（CSS / class 命名規則；§9.1 lab- prefix / §9.2 theme class / §9.3 BEM / §9.4 Flexbox / §9.5 SCSS 歸類）
- `CLAUDE.md` §10（Blogger Design Token 匯出）
- `CLAUDE.md` §17（文章頁基本版型）
- `CLAUDE.md` §19（Design System 頁規則）
- `docs/design-system.md`（Design System 規格 / token / component catalog）
- `docs/blogger-export.md`（Blogger 匯出系統規格）
- `docs/github-deploy.md`（GitHub Pages 部署）
- `docs/rwd-interaction.md`（RWD 與互動）
- `docs/seo-ga4-adsense.md`（SEO / GA4 / AdSense 規格；本政策之 SEO 影響詳見 §6.1）
- `docs/phase-9j-jsonld-landing-verification.md`（JSON-LD 落地驗證；本政策之結構一致主張支撐其運作）
- `docs/related-links-schema.md`（related / other links schema；本政策 §4 共用 component 之資料來源）
- `docs/book-schema.md`（書籍 metadata schema；本政策 §4 book block 之資料來源）
- `docs/series-schema.md`（系列文章 schema；本政策 §4 series navigation 之資料來源）

---

（本文件結束）
