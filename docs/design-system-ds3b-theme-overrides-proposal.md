# Design System DS-3-b-pre：Theme Overrides Proposal

本文件為 **Phase DS-3-b 之前置 pre-analysis**。屬純 docs / 純規劃；**本批不改任何 SCSS / EJS / build / dist / deploy**。為 DS-3-b（`_themes.scss` 實際 platform override 補齊）落地前之 user 共識文件。

對應上層文件：
- `docs/css-design-system-policy.md`（commit `08cba04`；§3 platform theme 概念）
- `docs/design-system-ds1-audit.md`（commit `8dbfffe`；§4.3 platform theme tokens 現況）
- `docs/design-system-ds2-token-naming.md`（commit `28f5d0c`；§6 platform override rule / §10.2 DS-3-b 範圍）
- DS-3-a commit `c3b47dd`（10 個 semantic token defaults 已新增）

---

## §1 背景與範圍

### 1.1 為何 DS-3-b 需要 pre-analysis

DS-3-b 將實際修改 `src/styles/abstracts/_themes.scss`，可能影響 Blogger / GitHub 視覺色彩。屬中風險批；視覺改變需 user 設計師確認；Blogger 後台已貼 CSS 可能需重貼。

依保守原則，**先做 pre-analysis 列方案 / 影響範圍 / 確認事項**，等 user 批准後再進 source 修改。

### 1.2 本批範圍

- 規劃 Blogger / GitHub theme override 色票
- 列哪些 semantic token 可被平台覆寫
- 提兩套方案（A 保守 / B 品牌化）供 user 選
- 分析影響範圍（GitHub Pages / Blogger 後台 / dist-blogger/theme CSS）
- 提 DS-3-b source 修改前確認事項
- 提 DS-3-b 最小實作策略

### 1.3 不在本批

- 任何 SCSS / EJS / build 修改
- 具體色票 hex 之裁決（本批提候選，user 決最終）
- Blogger entry SCSS 結構變動（屬 DS-3-b-extended 或新批）
- mirror partial 整合（屬 DS-3-e）

---

## §2 目前 theme override 現況

### 2.1 `_themes.scss` 當前內容

完整 2 行：

```scss
.lab-site--github { --lab-color-primary: #2563eb; }
.lab-site--blogger { --lab-color-primary: #b45309; }
```

只覆寫 1 個 token（`--lab-color-primary`）。

### 2.2 ⚠️ 關鍵結構觀察：`.lab-site--blogger` override 實際上是 dead code

**直觀假設**：「Blogger primary = `#b45309`（褐）；GitHub primary = `#2563eb`（藍）」。

**實際情況**（經 sanity check 驗證；grep `dist-blogger/theme/blogger-full-style.css`）：

- 既有 `_themes.scss` 之 `.lab-site--blogger { ... }` override **完全沒有進入 Blogger CSS**
- 原因：Blogger pipeline 之 4 個 entry（`blogger-tokens.scss` / `blogger-article.scss` / `blogger-components.scss` / `blogger-full-style.scss`）**都不 `@use 'abstracts/themes'`**；故 `_themes.scss` 不被 Blogger 編譯流程引用
- 實測 `dist-blogger/theme/blogger-full-style.css` 內 `--lab-color-primary: #2563eb`（藍；來自 `lab-tokens-base` mixin 之預設值；非褐）
- 實測 4 個 Blogger CSS 內 **0 個** `.lab-site--` selector

**GitHub Pages 端**：

- `main.scss` `@use './abstracts/themes'` → CSS bundle 含 `.lab-site--blogger { ... #b45309 }`
- GitHub Pages body class 是 `.lab-site--github`（per `base.ejs` line 6） → CSS cascade **永不 match** `.lab-site--blogger`
- 該 override 在 GitHub Pages 上**不會觸發**；屬未使用 selector

**結論**：`.lab-site--blogger { --lab-color-primary: #b45309 }` 為 **dead code**：

| 環境 | 是否進入 CSS bundle | 是否 match | 是否生效 |
|---|---|---|---|
| GitHub Pages | ✅ 進入 `dist/assets/entry-*.css` | ❌ 永不（body 是 `.lab-site--github`） | ❌ 不生效 |
| Blogger 後台 | ❌ 不進入 `dist-blogger/theme/*.css` | ❌ 沒這個 selector | ❌ 不生效 |

**真實狀況**：

- GitHub Pages 上 `--lab-color-primary` = `#2563eb`（藍；來自 `.lab-site--github` override 或 raw default；兩者目前同值）
- Blogger 後台上 `--lab-color-primary` = `#2563eb`（藍；來自 `lab-tokens-base` mixin 預設值；**非褐 #b45309**）

→ **兩平台目前 primary 實質上同色**（都是藍）！DS-1 audit §4.3 / §4.5 之描述「Blogger 主色 #b45309」屬 source-level 觀察；實際 dist-level 是兩平台同藍。

### 2.3 DS-3-a 新增 semantic token defaults 之可用性

DS-3-a 新增之 10 個 token（per `docs/design-system-ds2-token-naming.md` §5.4；commit `c3b47dd`）已注入 `_tokens.scss` 之 `lab-tokens-base` mixin → 同步進入 GitHub CSS（`:root`）+ Blogger CSS（`.lab-blogger-article` / `:where(.lab-blogger-article, .lab-blogger-components)` scope）。

→ DS-3-b 之 `_themes.scss` override 可直接覆寫這 10 個 token。

### 2.4 Component 讀取現況

per DS-1 audit §4 / §5：

- 多數 component（button / post-card / hashtag / tag / breadcrumb / adsense / book-photo / affiliate-box / download-box / related-links / related-posts / prev-next / back-to-top / toc / code-block 等）已用 `var(--lab-color-*)` 取色
- 主要取的是既有 token（primary / accent / text / muted / background / surface / border / link）
- **未取** DS-3-a 新增之 10 個 token（secondary / text-muted / bg / bg-soft / badge-bg / badge-text / callout-bg / callout-border / overlay-dark / on-primary）
- → DS-3-b 覆寫新 token **目前對視覺零影響**；要等 DS-3-c 改 component 才會生效

→ DS-3-b 影響範圍主要在 **既有 token**（primary / link / link-hover / link-visited / accent / surface 等）；新 token 之 platform override 屬「為 DS-3-c 鋪路」性質。

---

## §3 可覆寫 / 不建議覆寫 token 清單

### 3.1 可被平台覆寫（per `docs/design-system-ds2-token-naming.md` §6.2）

| Token | 為何可覆寫 | 預期 component 影響（DS-3-b 落地後） |
|---|---|---|
| `--lab-color-primary` | 主色；platform 視覺核心 | button primary / post-card category / link（若 link 沿用 primary）/ focus-ring base / blockquote border / button hover overlay base |
| `--lab-color-secondary` (alias `--lab-color-accent`) | 輔色 | download-box CTA（透過 `--lab-color-accent`）/ 未來次要 CTA |
| `--lab-color-link` | 連結色；可獨立於 primary | article body links / button text variant / breadcrumb |
| `--lab-color-link-hover` | 連結 hover | 同上 hover |
| `--lab-color-link-visited` | 連結 visited | article body links visited |
| `--lab-color-badge-bg` (DS-3-a 新) | tag / hashtag 底色 | 預期 DS-3-c 接 tag / hashtag |
| `--lab-color-badge-text` (DS-3-a 新) | tag / hashtag 文字色 | 同上 |
| `--lab-color-bg-soft` (alias `--lab-color-surface`) | 區塊柔色背景 | sidebar / blockquote / hero gradient（DS-3-c 接） |
| `--lab-color-callout-bg` (DS-3-a 新) | callout 區塊底色 | 預期 DS-3-c 才落地 callout component |
| `--lab-color-callout-border` (DS-3-a 新) | callout 邊框 | 同上 |
| `--lab-focus-ring-color` | focus ring 色（current = `color-mix(primary, 60%)` 自動跟隨 primary） | button focus / link focus / 表單 focus；若 primary 變則自動跟隨；通常不需獨立 platform override |
| `--lab-color-on-primary` (DS-3-a 新) | primary 背景上之文字色 | 預期 DS-3-c 接 button primary 內文 / `_header.scss` `#fff` 替代 |

### 3.2 不建議平台覆寫

| Token | 為何不建議 |
|---|---|
| `--lab-color-text` | 主要文字色；應跨平台一致以維可讀性 + SEO 結構一致 |
| `--lab-color-bg` (alias `--lab-color-background`) | 頁面背景；應跨平台一致 |
| `--lab-color-border` | 分隔線；應跨平台一致 |
| `--lab-color-muted` / `--lab-color-text-muted` (alias) | 次要文字色；應跨平台一致以維可讀性 |
| raw gray scale（`--lab-color-gray-50` ~ `-900`） | raw 不被 platform 覆寫；屬尺度系統 |
| spacing scale (`--lab-space-*`) | 尺度系統；跨平台一致 |
| typography (`--lab-font-*` / `--lab-line-height-*` / `--lab-letter-spacing-*`) | 跨平台一致；改字級會破壞 layout 一致 |
| radius (`--lab-radius-*`) | 尺度系統 |
| shadow (`--lab-shadow-*`) | 尺度系統 |
| z-index (`--lab-z-*`) | 尺度系統 |
| breakpoint (`--lab-bp-*`) | RWD 行為一致 |
| container width (`--lab-container-*`) | 跨平台一致 |
| `--lab-color-overlay-dark` (DS-3-a 新) | 純色 `#000`；非平台主題範圍 |

---

## §4 方案 A：保守 alias 方案

### 4.1 目標

- 視覺變動最小（理論上對 GitHub Pages 零差異；對 Blogger 後台亦零差異 — 因 _themes.scss 不進 Blogger CSS）
- 只補足 token override 結構（為 DS-3-c component 改讀新 token 鋪路）
- 不大幅改變現有 Blogger / GitHub 顏色

### 4.2 GitHub theme token values（方案 A）

```scss
.lab-site--github {
  --lab-color-primary: #2563eb;              // 保留既有（無變化）
  // 其餘 semantic token 不覆寫 → 沿用 _tokens.scss 之 default
  // 即：secondary = accent default / link = primary / badge-bg = gray-100 etc.
}
```

### 4.3 Blogger theme token values（方案 A）

```scss
.lab-site--blogger,
.lab-blogger-article {
  --lab-color-primary: #b45309;              // 保留既有 source（無變化於 GitHub Pages；
                                              // Blogger 後台仍維持 dead code 不生效 —
                                              // 視 DS-3-b 是否決定動 blogger entry 而定）
  // 其餘 semantic token 不覆寫
}
```

**注意**：方案 A 僅補 `.lab-blogger-article` selector（額外的群組 selector）— 這樣**理論上**未來若 user 決定把 themes 注入 blogger entry，`.lab-blogger-article` rule 就會生效。但本批 DS-3-b 不動 blogger entry → 即使加了 `.lab-blogger-article` selector，仍不會進入 Blogger CSS。屬「將來可用之預備設計」。

### 4.4 哪些值沿用既有

- GitHub primary：沿用 `#2563eb`
- Blogger primary：沿用 `#b45309`（source 值；Blogger 後台仍實質為藍 — 見 §2.2）
- 其他 9 個 semantic token：**全部沿用 default**（不在 platform override 內覆寫）→ DS-3-c component 改讀新 token 時，視覺等同既有 default

### 4.5 預期視覺差異

| 環境 | DS-3-b（方案 A）後之預期差異 |
|---|---|
| GitHub Pages | **零差異**（primary 不變；其他 token 不覆寫；component 也未改讀） |
| Blogger 後台（已貼 blogger-full-style.css） | **零差異**（_themes.scss 不進 blogger CSS；vd-color-primary 仍為 `lab-tokens-base` 之 `#2563eb`） |

→ 方案 A 屬「**為 DS-3-c 預備結構；當前視覺零變化**」之保守批。

---

## §5 方案 B：平台品牌化方案

### 5.1 目標

- Blogger 與 GitHub 視覺上有更清楚區分
- Blogger 偏暖色（書評 / 生活 / 教育 / 親子感）
- GitHub 偏藍綠色（技術 / 文件 / 工程感）
- 仍保持同一套 Design System（structure / spacing / typography / RWD 完全一致）

### 5.2 GitHub theme token values（方案 B 候選；user 設計師可調整）

```scss
.lab-site--github {
  --lab-color-primary: #2563eb;              // 既有藍；保留
  --lab-color-secondary: #20c997;            // 綠色點綴（technical / docs accent）
  --lab-color-link: var(--lab-color-primary);
  --lab-color-link-hover: #1e40af;
  --lab-color-link-visited: #6d28d9;
  --lab-color-badge-bg: #dbeafe;             // 淡藍底
  --lab-color-badge-text: #1e3a8a;           // 深藍字
  --lab-color-bg-soft: #f8fafc;              // 沿用 surface 預設
  --lab-color-callout-bg: #eff6ff;           // 淡藍 callout
  --lab-color-callout-border: #bfdbfe;
}
```

### 5.3 Blogger theme token values（方案 B 候選；user 設計師可調整）

```scss
.lab-site--blogger,
.lab-blogger-article {
  --lab-color-primary: #b45309;              // 既有褐；保留 source 值
  --lab-color-secondary: #facc15;            // 亮黃（生活 / 教育點綴）
  --lab-color-link: var(--lab-color-primary);
  --lab-color-link-hover: #9a3412;           // 深褐
  --lab-color-link-visited: #92400e;
  --lab-color-badge-bg: #ffedd5;             // 淡橘底
  --lab-color-badge-text: #9a3412;           // 深褐字
  --lab-color-bg-soft: #fff7ed;              // 淡橘背景
  --lab-color-callout-bg: #fff7ed;
  --lab-color-callout-border: #fed7aa;
}
```

### 5.4 link / badge / soft bg / callout 色彩建議

- **link**：兩平台建議「沿用 primary」最簡；若要獨立 link 色需 user 確認 contrast / accessibility
- **badge**：兩平台都採「淡底深字」pattern；對比清楚易讀；不喧賓奪主
- **bg-soft**：Blogger 微暖（`#fff7ed`）/ GitHub 微冷（`#f8fafc`）— 區隔感明顯但不刺眼
- **callout**：可與 bg-soft 同色或微深；callout-border 取較深之同色系

### 5.5 可能影響的畫面區域

**GitHub Pages**（前提：component 已或將改讀新 token；DS-3-c 後才完整觸發）：

- article body link 色 → 不變（沿用 primary）
- button primary（含 hover / active）→ 不變（primary 不變）
- post card category 色 → 不變（仍是 primary）
- tag / hashtag → 預期 DS-3-c 改讀 badge token 後變淡藍底深藍字
- blockquote / callout → 預期 DS-3-c 改讀 callout token 後變淡藍框
- sidebar background → 預期 DS-3-c 改讀 bg-soft 後變淡冷色

**Blogger 後台**（前提：DS-3-b 動 blogger entry 結構讓 _themes.scss 進 blogger CSS；屬 scope 延伸；非本批承諾）：

- 同 GitHub Pages 之 component 影響範圍，但色調是暖橘 / 褐 / 黃
- 若 DS-3-b 不動 blogger entry → Blogger 後台仍是 `lab-tokens-base` 預設藍；方案 B 對 Blogger 後台無影響

### 5.6 方案 B 之 Blogger 後台真實生效之需求

若 user 真的想要 **Blogger 後台看到方案 B 之褐色品牌化**：

- 必須讓 `_themes.scss` 之 `.lab-blogger-article` selector **進入 Blogger CSS**
- 兩種做法：
  - **做法 1**：blogger entry（如 `blogger-tokens.scss` 或 `blogger-full-style.scss`）`@use '../abstracts/themes'`；屬動 Blogger SCSS pipeline 結構
  - **做法 2**：把 platform override 直接寫進 `blogger-tokens.scss` 或新建 `_blogger-theme-override.scss` 並由 blogger entry 引用
- 兩者皆屬「**動 Blogger pipeline 結構**」；非 _themes.scss 單檔修改範圍
- → 建議本 DS-3-b 只動 _themes.scss；若要 Blogger 後台生效另開 batch（如 DS-3-b-blogger-entry）

---

## §6 GitHub Pages 影響範圍

### 6.1 直接影響（既有 component 已用既有 token）

| 區域 | 既有讀 token | 方案 A 影響 | 方案 B 影響 |
|---|---|---|---|
| article body link `<a>` | `--lab-color-link` (default = primary) | 無 | link color 不變（仍 primary）；hover 變深藍 |
| button primary | `--lab-color-primary` | 無 | 無（primary 不變） |
| button hover | `color-mix(primary, #000)` | 無 | 無（hover overlay 不變） |
| post card category | `--lab-color-primary` | 無 | 無 |
| post card link | `--lab-color-primary` | 無 | 無 |
| blockquote border | `--lab-color-primary` | 無 | 無 |
| focus ring | `color-mix(primary, 60%, transparent)` | 無 | 無（自動跟隨 primary） |

### 6.2 待 DS-3-c component 改讀新 token 後才影響

| 區域 | 改讀新 token 候選 | 方案 A | 方案 B |
|---|---|---|---|
| tag / hashtag | `--lab-color-badge-bg` / `-text` | 無（沿用 default = gray-100 + text） | 變淡藍底深藍字 |
| sidebar background | `--lab-color-bg-soft` | 無（= surface default） | 微冷淡底 |
| blockquote bg | `--lab-color-bg-soft` 或 `-callout-bg` | 無 | 微冷淡底 |
| `.lab-hero` gradient | `--lab-color-bg-soft` + `-bg` | 無 | 微冷漸層 |
| callout（未來 component） | `--lab-color-callout-bg` / `-border` | 無 | 淡藍底 + 中藍框 |
| 未來次要 CTA | `--lab-color-secondary` | 無 | 變綠（GitHub） |

### 6.3 homepage / post card / tag / navigation 是否可能受影響

- **homepage**：post card 仍讀 primary → 兩方案皆不變
- **post card**：category 色 / link 色仍讀 primary → 兩方案皆不變
- **tag**：DS-3-c 後才受影響（方案 B 變藍色系 badge）
- **navigation**：未讀 platform-overridable token；不變

→ **DS-3-b 落地時 GitHub Pages 視覺改動主要在 link-hover（若改色）**；其餘待 DS-3-c

---

## §7 Blogger 影響範圍

### 7.1 Blogger CSS 4 個檔之影響

| CSS 檔 | 方案 A | 方案 B（_themes.scss 不進 blogger entry） | 方案 B（_themes.scss 進 blogger entry） |
|---|---|---|---|
| `blogger-tokens.css` | 無變化 | 無變化（dead code 不進） | 含 `.lab-blogger-article` override；token 變 |
| `blogger-article.css` | 無變化 | 無變化 | article body rules 用之 token cascade 變色 |
| `blogger-components.css` | 無變化 | 無變化 | components 內取 token 變色 |
| `blogger-full-style.css` | 無變化 | 無變化 | 含 `.lab-blogger-article` override + 全部 rules |

→ **若 DS-3-b 只改 `_themes.scss`、不動 blogger entry**：4 個 Blogger CSS **byte-identical**；**無需重貼**

→ **若 DS-3-b 也動 blogger entry（讓 themes 進去）**：4 個 Blogger CSS 全部變動；**user 需重貼 `blogger-full-style.css` 至 Blogger 後台**

### 7.2 Blogger 後台已貼 CSS 是否需要重貼

| 條件 | 是否需重貼 |
|---|---|
| 方案 A（_themes.scss 補結構；不動 blogger entry） | ❌ 不需重貼（Blogger CSS byte-identical） |
| 方案 B（_themes.scss 補結構；不動 blogger entry） | ❌ 不需重貼（同上；方案 B 對 Blogger 後台無實際視覺影響） |
| 方案 B + 動 blogger entry 讓 themes 進 Blogger CSS | ✅ 需重貼；屬「DS-3-b-blogger-entry」新批範圍；本 DS-3-b 不主張包進來 |

### 7.3 舊文章是否會同步變色

- Blogger 後台貼 CSS 為「主題層」；改 CSS 後**所有**使用 `.lab-blogger-article` wrapper 之文章自動同步變色
- 所以若做方案 B + blogger entry 整合：**所有已發布 Blogger 文章**會在重貼 CSS 後一起變色
- 此屬期望行為（**一處改、全文章生效**），但 user 應在重貼前**先預覽**至少一篇代表性文章（書評 / 生活 / 教育各取一）

---

## §8 DS-3-b source 修改前確認事項

落地 DS-3-b 前，user 需確認：

### 8.1 選方案 A 或 B

- **方案 A（保守）**：視覺零差異；補結構為 DS-3-c 鋪路；風險 🟢 低
- **方案 B（品牌化）**：GitHub Pages 視覺微變（主要 link-hover）；Blogger 後台無變（除非另動 blogger entry）；風險 🟡 中

### 8.2 Blogger 主色確認

- 目前 source 值 `#b45309`（褐）；Blogger 後台實際顯示藍（dead code）
- 方案 A：保留 `#b45309`（source 不變；Blogger 後台仍藍）
- 方案 B：保留 `#b45309` 或微調至 `#c2410c`（橘磚）/ `#a16207`（金棕）等候選；user 設計師確認
- **附議**：若要 Blogger 後台真實看到褐色，需開新批動 blogger entry（per §5.6 / §7.1）— **本 DS-3-b 不主張包進來**

### 8.3 GitHub 主色確認

- 目前 `#2563eb`（中藍）
- 方案 A：保留
- 方案 B：保留或微調至 `#1d4ed8`（深藍）；user 確認

### 8.4 link color 是否獨立於 primary

- 方案 A：沿用既有（`--lab-color-link: var(--lab-color-primary)` default 設計）
- 方案 B：建議仍沿用 primary（最簡；contrast 已驗）；若 user 要獨立 link 色需確認 contrast

### 8.5 badge 色是否偏淡底深字

- 方案 A：不覆寫；沿用 default（`--lab-color-badge-bg: gray-100` / `-text: text`）
- 方案 B：建議淡底深字 pattern；GitHub 淡藍 / Blogger 淡橘；user 確認

### 8.6 Blogger 後台 CSS 重貼時機

- 方案 A：**不需重貼**（Blogger CSS 不變）
- 方案 B（不動 blogger entry）：**不需重貼**
- 方案 B + 動 blogger entry（屬另開 batch）：**需重貼**；建議於 DS-3-b 落地 + DS-3-c 完成 + visual 確認後一併重貼，避免重貼多次

---

## §9 DS-3-b 最小實作策略

### 9.1 範圍（嚴格）

- **只改** `src/styles/abstracts/_themes.scss`
- **不改** component
- **不改** mirror partial（`_blogger-components-rules.scss`）
- **不改** EJS
- **不改** build script
- **不改** blogger entry 結構（`blogger-*.scss` 4 個檔）
- **不 rename** token
- **不刪** token

### 9.2 修改方式

依 user 確認之方案（A 或 B），在 `_themes.scss` 內：

- 保留既有 2 行 `--lab-color-primary` override
- 新增其餘 semantic token 之 platform override（per §4.2/§4.3 或 §5.2/§5.3）
- 對 Blogger override 採群組 selector `.lab-site--blogger, .lab-blogger-article { ... }`（為未來 Blogger entry 整合預留）

### 9.3 驗證流程

1. `npm run validate:content` — 確認 `0/22/17` baseline 不退步
2. `npm run build` — 確認 GitHub prod build 成功；admin isolation 三項全綠
3. `npm run build:blogger-theme` — 確認 4 個 Blogger CSS 重產成功
4. **對比新舊 Blogger CSS**：`git diff dist-blogger/theme/*.css` 應 **byte-identical**（因 _themes.scss 不被 blogger entry 引用）；若不是 → 表示有非預期 cascade 路徑 → 停下分析
5. **GitHub Pages 視覺 sanity**：方案 A 應**完全無差異**；方案 B 應僅在 link-hover 等少量點變化
6. **Blogger CSS 變動回報**：若 4 個 CSS 真有變動 → 明確列哪幾個 / 變動行數 / 是否需重貼

### 9.4 若 Blogger CSS 變動明確回報需要重貼哪些 CSS

per §7.2 之三組條件對應：

- 條件 1 / 2（方案 A / 方案 B 不動 blogger entry）：**回報「Blogger CSS byte-identical；無需重貼」**
- 條件 3（方案 B + 動 blogger entry；非本 DS-3-b 範圍）：**回報「Blogger CSS 全部變動；需重貼 `blogger-full-style.css`（建議）」**

---

## §10 本批不做事項

| # | 項目 | 狀態 |
|---|---|---|
| 1 | 不改 SCSS | ✅ `src/styles/**` 41 檔完全未動 |
| 2 | 不改 `_themes.scss` | ✅ 仍是 2 行；DS-3-b 才擴充 |
| 3 | 不改 component | ✅ `src/styles/components/**` 15 檔未動 |
| 4 | 不改 Blogger mirror partial | ✅ `_blogger-components-rules.scss` 未動 |
| 5 | 不改 EJS | ✅ `src/views/**` 51 檔未動 |
| 6 | 不改 build script | ✅ `src/scripts/**` / `package.json` / `vite.config.js` 未動 |
| 7 | 不改 content | ✅ `content/**` 未動 |
| 8 | 不改 dist | ✅ `dist/` / `dist-blogger/` / `dist-promotion/` / `.cache/` 未動 |
| 9 | 不改 deploy repo | ✅ `D:\github\blog-new\portable-blog-deploy\` 未動 |
| 10 | 不 push | ✅ source repo 無 upstream；未 push |
| 11 | 不重產 Blogger CSS | ✅ 未跑 `npm run build:blogger-theme`（pre-analysis 之 §2.2 sanity grep 僅讀既有產出，未重產） |
| 12 | 不要求 user 重貼 Blogger CSS | ✅ Blogger 後台未動 |
| 13 | 不裁決方案 A 或 B | ✅ 方案 A / B 並列；user 決定 |
| 14 | 不裁決具體色票 hex 值 | ✅ §5.2 / §5.3 為候選範例；user 設計師確認 |
| 15 | 不啟動 blogger entry 結構變動（讓 themes 進 blogger CSS） | ✅ 屬另開 batch（DS-3-b-blogger-entry）；非 DS-3-b 範圍 |

---

## §11 對既有系統之影響

| 維度 | 狀態 |
|---|---|
| `src/styles/**` | ❌ 未動 |
| `src/views/**` | ❌ 未動 |
| `src/scripts/**` | ❌ 未動 |
| content posts / settings / publish.json / fb.md | ❌ 未動 |
| `package.json` / `vite.config.js` | ❌ 未動 |
| `dist/` / `dist-blogger/` / `dist-promotion/` / `.cache/` | ❌ 未動 |
| Deploy repo | ❌ 未動（HEAD 仍 `4ecd92d`） |
| GitHub Pages 線上 | ❌ 未動 |
| Blogger 後台已貼 CSS | ❌ 未動 |
| sitemap / robots / navigation | ❌ 未動 |
| validate baseline `0/22/17` | ❌ 預期未動 |
| Admin 既有功能 | ❌ 未動 |

---

## §12 邊界聲明

- ✅ 本文件**僅為 DS-3-b pre-analysis**；不改任何 source / build / dist / deploy
- ✅ 本文件**不**啟動 DS-3-b / DS-3-c / DS-3-d / DS-3-e 任一 sub-batch
- ✅ 本文件**不**裁決方案 A / B winner（§8.1 留給 user）
- ✅ 本文件**不**裁決具體色票 hex 值
- ✅ 本文件**不**動 Blogger pipeline 結構（blogger entry 不變）
- ✅ 本文件**不**整合 mirror partial（屬 DS-3-e）
- ✅ 本文件 §2.2 之「dead code」觀察為事實陳述（經 `grep dist-blogger/theme/blogger-full-style.css` 驗證），不為改正主張；改正屬 DS-3-b 範圍

---

## §13 Cross-links

- `docs/css-design-system-policy.md`（commit `08cba04`；§3 platform theme 概念 / §5 禁則）
- `docs/design-system-ds1-audit.md`（commit `8dbfffe`；§4.3 platform theme tokens 現況；本 pre 更新並修正其「Blogger primary = #b45309」之 source-level 描述至 dist-level 真實狀況）
- `docs/design-system-ds2-token-naming.md`（commit `28f5d0c`；§6 platform override rule / §10.2 DS-3-b 範圍）
- DS-3-a commit `c3b47dd`（10 個 semantic token defaults）
- `CLAUDE.md` §9.2（theme class convention）/ §10（Blogger Design Token 匯出）

---

（本文件結束）
