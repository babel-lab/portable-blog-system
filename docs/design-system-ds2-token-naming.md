# Design System DS-2：Token Naming Strategy

本文件為 **Phase DS-2** 之 token naming 整理。屬純 docs / 純規劃；**本批不改任何 source / SCSS / EJS / build / dist / deploy**。為後續 DS-3（platform theme variables 實作）之前置共識文件。

對應上層文件：
- `docs/css-design-system-policy.md`（commit `08cba04`；§2 三層架構基準）
- `docs/design-system-ds1-audit.md`（commit `8dbfffe`；現況盤點；§4 token / theme 現況、§6 gap 清單、§7 風險分級）
- `CLAUDE.md` §9 / §10（命名規則 / Blogger theme 匯出）

---

## §1 背景與範圍

### 1.1 本批為 DS-2

per `docs/css-design-system-policy.md` §7 與 DS-1 audit §8 建議順序：DS-2 為 **token naming 整理之純 docs 階段**，先求 user 對命名 / 分層 / migration 策略之共識，避免直接進 DS-3 反工。

### 1.2 範圍

- 定義 raw tokens / semantic tokens / platform theme tokens 三層 naming 原則
- 列現有 token 對照表 + 建議層級歸類
- 對 DS-1 audit §4.4 列出之 11 個 hex 違規點，提出 tokenization 建議 + 風險分級
- 規範 component 應讀哪一層 token
- 提出 DS-3 之拆批建議（DS-3-a 至 DS-3-e）

### 1.3 不在本批範圍

- 任何 SCSS / EJS / build / dist 修改
- 具體色票 hex 值之挑選（屬 DS-3；由 user 設計師決定）
- mirror partial（`_blogger-components-rules.scss`）之整合（高風險；屬 DS-3-e）
- 既有 token 之 rename（避免反工；本批採 **additive-only** 原則）

---

## §2 DS-1 主要發現摘要

per `docs/design-system-ds1-audit.md` §4 / §6 / §7：

| 項目 | 現況 |
|---|---|
| Global tokens（spacing / typography / breakpoints / z-index / shadow / radius / focus-ring）| ✅ 完整；mixin 設計 |
| Color tokens | ⚠️ 命名空間 `--lab-color-*` 單層；部分名稱已是 semantic（`text` / `muted` / `link` / `background` / `surface` / `border`），部分是 raw scale（`gray-50` ~ `gray-900`），部分是品牌（`primary` / `accent`）；**無明顯 raw vs semantic 分層** |
| `_themes.scss` | ⚠️ 只 2 行；只覆寫 `--lab-color-primary` 1 個 token |
| `_tokens.scss` 內 hex | ✅ 20 個（合理；token 定義層） |
| `_themes.scss` 內 hex | ✅ 2 個（合理；platform override 定義層） |
| Component / layout 內 hex 違規 | ❌ 11 個散在 6 個檔（_button × 3 / _blogger-components-rules × 3 mirror / _mobile-drawer × 1 / _base × 2 / _header × 1 / _download-box × 1） |
| Platform class selector | ✅ `.lab-site--blogger` / `.lab-site--github` / `.lab-blogger-article` 已就位 |
| 0 個 `[data-site]` attribute selector | ✅ 全用 class（符合 CLAUDE.md §9.2） |
| 0 個 component 直讀 `--blogger-*` / `--github-*` | ✅（目前根本沒這種 token；structurally 無 risk） |

### 2.1 既有雙軌結構觀察

`src/styles/abstracts/` 之 spacing / typography / breakpoints / z-index 4 個檔都採「**SCSS 變數 + CSS variable mixin** 雙軌」：

```scss
// 例：_spacing.scss
// SCSS 變數（保留向後相容）
$space-1: 0.25rem;
$space-4: 1rem;

// CSS variable mixin（Phase 3-a 引入）
@mixin lab-tokens-space {
  --lab-space-1: 0.25rem;
  --lab-space-4: 1rem;
  ...
}
```

理由：CSS 變數**無法用於 `@media` query**，故 `$bp-*` SCSS 變數保留供 `@media (min-width: $bp-md)` 使用。本 DS-2 策略**保留**此雙軌；token 重組只動 CSS variable 層。

---

## §3 Token 三層架構

### 3.1 三層概念

per `docs/css-design-system-policy.md` §2：

```
[Platform layer]   .lab-site--blogger / .lab-site--github / .lab-blogger-article
       ↓ 覆寫
[Semantic layer]   --lab-color-primary / --lab-color-link / --lab-color-bg-soft / ...
       ↑ 唯一可讀來源（component）
[Component layer]  .lab-post-card / .lab-button / .lab-badge / ...
       ↑ 也可讀
[Global / Raw layer]   --lab-color-gray-100 / --lab-space-* / --lab-font-size-* / --lab-radius-* / ...
```

### 3.2 讀取規則（強制）

| 層 | 誰可以讀 | 誰可以覆寫 |
|---|---|---|
| **Global / Raw layer**（scale / 灰階 / 品牌原色） | base / abstracts；少量 layout；**少用於 component** | 不被任何 selector 覆寫 |
| **Semantic layer**（語意；component 唯一色彩來源） | **component / layout / base**（推薦） | platform selector（`.lab-site--*`） |
| **Platform layer**（platform override） | 不直接被 component 讀 | platform selector 自身定義 |

### 3.3 簡記

- **Component → Semantic**（一律走中介）
- **Platform → Semantic**（platform 只負責覆寫 semantic）
- **Global → 各層皆可讀**（但 component 取色一律走 semantic；scale token 例外）
- **Component ⊥ Platform**（component 不直讀 platform token；無 `--blogger-*` / `--github-*` 給 component 用）

---

## §4 Raw tokens naming

### 4.1 用途

- 定義基礎色票（gray / brand atoms / white / black）
- 定義基礎尺度（spacing / font-size / radius / shadow / z-index / breakpoint / line-height / font-weight / letter-spacing）
- **不直接給 component 使用之色彩**（除非 fallback；如 gray scale 在 layout 之少量使用可接受）
- **可給 component 使用之尺度**（spacing / font-size / radius / shadow / z-index 是 raw 也是 component 直讀來源；無需 semantic 中介）

### 4.2 命名原則

| 類別 | 範例 | 規則 |
|---|---|---|
| Brand atom color | `--lab-color-blue-600` / `--lab-color-amber-700` | `--lab-color-{hue}-{step}`；step 採 50/100/200/.../900 之 Tailwind-like 體系（**未來擴充；當前未必落地**） |
| Neutral / gray scale | `--lab-color-gray-50` ~ `--lab-color-gray-900` | ✅ 已存在；保留 |
| Absolute color | `--lab-color-white` / `--lab-color-black` | （**proposal；當前無；若需要可加**）絕對色；屬 raw 但**極少直用**；通常給 `color-mix()` 之 mixing base |
| Spacing scale | `--lab-space-1` ~ `--lab-space-24` | ✅ 已存在；保留 |
| Font size scale | `--lab-font-size-xs` ~ `--lab-font-size-4xl` | ✅ 已存在；保留 |
| Line height | `--lab-line-height-tight` ~ `--lab-line-height-loose` | ✅ 已存在；保留 |
| Font weight | `--lab-font-weight-regular` ~ `--lab-font-weight-bold` | ✅ 已存在；保留 |
| Letter spacing | `--lab-letter-spacing-tight` ~ `--lab-letter-spacing-wide` | ✅ 已存在；保留 |
| Radius | `--lab-radius-sm` / `-md` / `-lg` / `-full` | ✅ 已存在；保留 |
| Shadow | `--lab-shadow-sm` / `-md` / `-lg` / `-card` | ✅ 已存在；保留 |
| z-index | `--lab-z-base` / `-dropdown` / `-header` / `-back-to-top` / `-overlay` / `-drawer` / `-modal` | ✅ 已存在；保留 |
| Breakpoint | `--lab-bp-sm` / `-md` / `-lg` | ✅ 已存在；保留（CSS var 僅供 DS 頁顯示 / JS 讀取；`@media` 仍用 SCSS `$bp-*`） |
| Container width | `--lab-container-sm` / `-md` / `-lg` | ✅ 已存在；保留 |
| Font family | `--lab-font-sans` / `--lab-font-mono` | ✅ 已存在；保留 |
| Focus ring atoms | `--lab-focus-ring-color` / `-width` / `-offset` / `-style` | ✅ 已存在；保留（屬 raw + semantic 中間態） |

### 4.3 本 DS-2 不主張 brand scale 擴充

目前每個品牌色只有單一值（`--lab-color-primary` 一個值，非 `--lab-color-primary-50` ~ `-900` 之 scale）。本批**不**主張新增完整 brand scale（過度工程化）；除非未來有 hover / active / disabled 色階自動推導需求，否則維持單值。

→ DS-3-c 之 hover/active overlay 採 `color-mix()` 解決（per §8.1），不需 scale。

---

## §5 Semantic tokens naming

### 5.1 用途

- **component 主要讀此層**
- 表達 UI 用途，**不**表達顏色 hue
- 由 platform selector 覆寫值

### 5.2 命名原則

`--lab-color-{purpose}` 或 `--lab-color-{element}-{prop}`。Purpose 應為**語意**（primary / link / text / bg / border / badge / callout / overlay / focus 等），**非**顏色（blue / orange / amber）。

### 5.3 既有 semantic-equivalent tokens

| Token | 性質 | 本批建議 |
|---|---|---|
| `--lab-color-primary` | brand primary；半 semantic 半 raw | ✅ 保留命名；歸 **semantic**（platform 可覆寫） |
| `--lab-color-accent` | brand secondary；半 semantic 半 raw | ✅ 保留命名；歸 **semantic**；**alias 建議** `--lab-color-secondary`（per policy §2.2 命名建議）→ 屬 DS-3 拆批；本批不動 |
| `--lab-color-text` | 主要文字色 | ✅ 保留；標準 semantic |
| `--lab-color-muted` | 次要文字色 | ✅ 保留；**alias 建議** `--lab-color-text-muted`（policy §2.2 命名建議）→ 同上 |
| `--lab-color-background` | 頁面基底背景 | ✅ 保留；**alias 建議** `--lab-color-bg`（policy 較短命名）→ 同上 |
| `--lab-color-surface` | 卡片 / 區塊柔色背景 | ✅ 保留；**alias 建議** `--lab-color-bg-soft`（policy 命名）→ 同上 |
| `--lab-color-border` | 分隔線 / 卡片邊框 | ✅ 保留；標準 semantic |
| `--lab-color-link` | 連結文字色 | ✅ 保留；標準 semantic（當前 `:= --lab-color-primary`） |
| `--lab-color-link-hover` | 連結 hover | ✅ 保留 |
| `--lab-color-link-visited` | 連結 visited | ✅ 保留 |
| `--lab-focus-ring-*` | focus ring（color / width / offset / style） | ✅ 保留；屬 semantic-equivalent |

### 5.4 本批建議新增之 semantic tokens

依 DS-1 audit §6.2 之 gap 與 policy §2.2 之缺漏清單：

| Token | 用途 | 預設值對應（建議；DS-3 落地時確認） | 來源驅動 |
|---|---|---|---|
| `--lab-color-secondary` | 輔色（次要 CTA / 副標）| 沿用 `--lab-color-accent` 之值 | policy §2.2 |
| `--lab-color-text-muted` | 次要 / 提示文字色（meta / caption）| 沿用 `--lab-color-muted` 之值 | policy §2.2 |
| `--lab-color-bg` | 頁面基底背景 | 沿用 `--lab-color-background` 之值 | policy §2.2 |
| `--lab-color-bg-soft` | 區塊柔色背景（callout / 引文 / hover）| 沿用 `--lab-color-surface` 之值 | policy §2.2；hero gradient 也可吃此 token |
| `--lab-color-badge-bg` | badge / tag / hashtag 底色 | 預設可 `--lab-color-gray-100` | policy §2.2 |
| `--lab-color-badge-text` | badge / tag / hashtag 文字色 | 預設可 `--lab-color-text` | policy §2.2 |
| `--lab-color-callout-bg` | callout 區塊底色 | 預設可 `--lab-color-surface` | spec §B.2 |
| `--lab-color-callout-border` | callout 邊框 | 預設可 `--lab-color-border` 或 `--lab-color-primary` | spec §B.2 |
| `--lab-color-overlay-dark` | hover / active 暗化覆蓋層（給 `color-mix()` 用） | 沿用 `#000` 抽出 | DS-1 §4.4 hex 違規 |
| `--lab-color-on-primary` | 放在 `--lab-color-primary` 背景上之文字色 | 預設可 `--lab-color-background`（亦即白） | 對齊 Material Design 命名；component 內 hardcode `color: #fff` 之替代 |

### 5.5 命名一致性說明

policy §2.2 之命名（`--color-primary` 等）**未含 `--lab-` prefix**；本專案既有命名是 `--lab-color-primary`（含 prefix）。**本批保留現有 `--lab-` prefix**（per CLAUDE.md §9.1 一致性）；policy 之命名為跨專案通用範例，落到本專案時自動加 `--lab-` prefix。

### 5.6 命名 alias 策略

對 §5.3 「需新增 alias」之 4 個 token（secondary / text-muted / bg / bg-soft），**本 DS-2 不裁決最終命名 winner**；DS-3 落地時 user 可選：

- **方案 A（推薦保守）**：保留既有名稱（`accent` / `muted` / `background` / `surface`）；alias 只用於 platform override 場合，不強制 component 改讀
- **方案 B（命名統一）**：以 `secondary` / `text-muted` / `bg` / `bg-soft` 為 canonical；既有名稱 alias 至新名；逐步遷移 component；遷移期 ~1-2 個 phase；屬 🟡 中風險（component 廣泛使用）

本 DS-2 提示：兩方案皆需要 user 設計師確認；不在本批解決。

---

## §6 Platform theme override rule

### 6.1 規則摘要

- selector 採既有 `.lab-site--github` / `.lab-site--blogger` / `.lab-blogger-article`（per `CLAUDE.md` §9.2；DS-1 §4.5 已落地）
- platform selector **只覆寫 semantic tokens**
- platform selector **不**新增 component-specific token
- platform selector **不**新增 `--blogger-*` / `--github-*` 命名（避免 component 誤直讀）

### 6.2 哪些 semantic token 可被 platform 覆寫

per policy §6.3 之「可平台差異」一欄：

| Token | 是否可 platform 覆寫 | 備註 |
|---|---|---|
| `--lab-color-primary` | ✅ 可 | 當前已覆寫（`_themes.scss`） |
| `--lab-color-secondary` (alias `--lab-color-accent`) | ✅ 可 | 平台輔色 |
| `--lab-color-link` | ✅ 可 | 預設等於 primary；若需平台差異化可單獨覆寫 |
| `--lab-color-link-hover` / `-visited` | ✅ 可 | 配合 link |
| `--lab-color-badge-bg` / `-text` | ✅ 可 | tag 視覺 |
| `--lab-color-bg-soft` (alias `--lab-color-surface`) | ✅ 可 | 區塊底色 |
| `--lab-color-callout-bg` / `-border` | ✅ 可 | callout 視覺 |
| `--lab-color-on-primary` | ⚠️ 慎 | 通常白/黑；若 primary 變色需確認對比 |
| `--lab-color-overlay-dark` | ❌ 不 | 純色 `#000`；非平台主題範圍 |
| `--lab-color-text` | ❌ 不 | 主要文字色不應平台差異化（會影響可讀性 / SEO 一致性） |
| `--lab-color-bg` (alias `--lab-color-background`) | ❌ 不 | 頁面背景；應跨平台一致 |
| `--lab-color-border` | ❌ 不 | 分隔線；應一致 |
| `--lab-color-gray-*`（raw scale） | ❌ 不 | raw 不被平台覆寫 |
| `--lab-space-*` / `--lab-font-size-*` / `--lab-radius-*` / `--lab-shadow-*` / `--lab-z-*` | ❌ 不 | 尺度系統；不被平台覆寫 |

### 6.3 _themes.scss 預期擴充樣貌（DS-3-b 落地參考；本 DS-2 不寫入）

```scss
// :root 內維持 default semantic（per _tokens.scss）

.lab-site--github {
  --lab-color-primary: #2563eb;
  --lab-color-secondary: #20c997;       // 新增（per DS-2 §5.4）
  --lab-color-link: var(--lab-color-primary);
  --lab-color-badge-bg: #cfe2ff;        // 新增
  --lab-color-badge-text: #084298;      // 新增
  --lab-color-bg-soft: #f8f9fa;         // 新增
}

.lab-site--blogger,
.lab-blogger-article {
  --lab-color-primary: #b45309;
  --lab-color-secondary: #facc15;       // 新增
  --lab-color-link: var(--lab-color-primary);
  --lab-color-badge-bg: #ffedd5;        // 新增
  --lab-color-badge-text: #9a3412;      // 新增
  --lab-color-bg-soft: #fff7ed;         // 新增
}
```

色票為**範例**；DS-3-b 落地時由 user 確認。

### 6.4 預期不應出現

```scss
// ❌ 不應出現之 platform token（component 會被誘導直讀）
.lab-site--blogger {
  --blogger-primary: #b45309;
  --blogger-bg: ...;
}

// ❌ component 直讀 platform token（policy §5 禁則 #6）
.lab-button {
  background: var(--blogger-primary);
}

// ❌ component 內 platform modifier（policy §5 禁則 #5）
.lab-button--blogger { ... }
```

---

## §7 現有 token 對照表

涵蓋現有 `--lab-*` CSS variable + DS-1 §4.4 之 11 個 hex 違規點。

| # | 現有 token / pattern | 目前位置 | 建議層級 | 建議名稱 | 是否需要改 source | 建議 phase | 備註 |
|---|---|---|---|---|---|---|---|
| 1 | `--lab-color-primary` | `_tokens.scss` | semantic | 保留 | ❌ 不改 | — | 已是 semantic；platform 覆寫已就位 |
| 2 | `--lab-color-accent` | `_tokens.scss` | semantic | 保留；alias `--lab-color-secondary` | ⚠️ 可選 | DS-3-a（add alias） | per §5.3 / §5.4 |
| 3 | `--lab-color-text` | `_tokens.scss` | semantic | 保留 | ❌ | — | 不應 platform 覆寫 |
| 4 | `--lab-color-muted` | `_tokens.scss` | semantic | 保留；alias `--lab-color-text-muted` | ⚠️ 可選 | DS-3-a（add alias） | per §5.3 |
| 5 | `--lab-color-background` | `_tokens.scss` | semantic | 保留；alias `--lab-color-bg` | ⚠️ 可選 | DS-3-a | per §5.3；不應 platform 覆寫 |
| 6 | `--lab-color-surface` | `_tokens.scss` | semantic | 保留；alias `--lab-color-bg-soft` | ⚠️ 可選 | DS-3-a | per §5.3 |
| 7 | `--lab-color-border` | `_tokens.scss` | semantic | 保留 | ❌ | — | 不應 platform 覆寫 |
| 8 | `--lab-color-link` / `-hover` / `-visited` | `_tokens.scss` | semantic | 保留 | ❌ | — | 已是 semantic |
| 9 | `--lab-color-gray-50` ~ `-900` | `_tokens.scss` | raw scale | 保留 | ❌ | — | 已是 raw |
| 10 | `--lab-radius-sm` / `-md` / `-lg` / `-full` | `_tokens.scss` | raw | 保留 | ❌ | — | |
| 11 | `--lab-shadow-sm` / `-md` / `-lg` / `-card` | `_tokens.scss` | raw | 保留 | ❌ | — | |
| 12 | `--lab-container-sm` / `-md` / `-lg` | `_tokens.scss` | raw | 保留 | ❌ | — | layout-level |
| 13 | `--lab-focus-ring-*`（color / width / offset / style）| `_tokens.scss` | semantic-equivalent | 保留 | ❌ | — | |
| 14 | `--lab-space-1` ~ `--lab-space-24` | `_spacing.scss` | raw scale | 保留 | ❌ | — | |
| 15 | `--lab-font-sans` / `--lab-font-mono` | `_typography.scss` | raw | 保留 | ❌ | — | |
| 16 | `--lab-font-size-xs` ~ `-4xl` | `_typography.scss` | raw scale | 保留 | ❌ | — | |
| 17 | `--lab-line-height-tight` ~ `-loose` | `_typography.scss` | raw | 保留 | ❌ | — | |
| 18 | `--lab-font-weight-regular` ~ `-bold` | `_typography.scss` | raw | 保留 | ❌ | — | |
| 19 | `--lab-letter-spacing-*` | `_typography.scss` | raw | 保留 | ❌ | — | |
| 20 | `--lab-bp-sm` / `-md` / `-lg` | `_breakpoints.scss` | raw（meta；CSS var 無法 @media）| 保留 | ❌ | — | `@media` 仍用 SCSS `$bp-*` |
| 21 | `--lab-z-base` / `-dropdown` / `-header` / `-back-to-top` / `-overlay` / `-drawer` / `-modal` | `_z-index.scss` | raw | 保留 | ❌ | — | |
| 22 | `_themes.scss` 之 `--lab-color-primary` override | `_themes.scss` | platform | 保留並擴充（per §6.3） | ⚠️ 需擴充 | DS-3-b | 補齊 secondary / link / badge / bg-soft 等 |
| 23 | `color-mix(..., #000)` × 5（_button × 3 / _download-box × 1 / _blogger-components-rules × 3 mirror 之含 _download-box）| `_button.scss` / `_download-box.scss` / `_blogger-components-rules.scss` | hex 違規 → semantic | 新增 `--lab-color-overlay-dark`；component 改 `color-mix(..., var(--lab-color-overlay-dark))` | ⚠️ 需改 source | DS-3-a + DS-3-c | 新增 token 屬 DS-3-a 之 additive；component 改吃屬 DS-3-c |
| 24 | `#fff` × 1 in `_header.scss:11`（menu button background）| `_header.scss` | hex 違規 → semantic | 改吃 `var(--lab-color-background)` | ⚠️ 需改 source | DS-3-c | 🟢 低風險 |
| 25 | `#eff6ff` / `#fff` gradient in `_base.scss:5`（.lab-hero）| `_base.scss` | hex 違規 → semantic / raw | 改吃 `var(--lab-color-bg-soft)` + `var(--lab-color-background)`；或新增 `--lab-color-hero-bg-start` | ⚠️ 需改 source | DS-3-c | 🟡 中風險（視覺需 diff） |
| 26 | `#f3f4f6` token fallback in `_mobile-drawer.scss:4`（`var(--lab-color-gray-100, #f3f4f6)`）| `_mobile-drawer.scss` | 移除 fallback | 移除 `, #f3f4f6` 改為純 `var(--lab-color-gray-100)` | ⚠️ 需改 source | DS-3-c | 🟢 低風險（token 必存） |
| 27 | `_blogger-components-rules.scss` mirror partial 全檔 | `src/styles/blogger/` | naming 與 main components 一致（已是）；架構整合屬 DS-3-e | 不在 token naming 範圍；架構議題 | ⚠️ 高風險 | DS-3-e（**最後做**）| 🔴 高風險；屬 DS-3-e 評估；本 DS-2 不裁決 |

---

## §8 Hard-coded color tokenization proposal

依 DS-1 §4.4 之 11 個 hex 違規點 + 風險分級：

### 8.1 `color-mix(..., #000)` hover/active overlay（5 個 hex 點）

涉及：`_button.scss:34/35/38` + `_download-box.scss:7` + `_blogger-components-rules.scss:54/55/140`（mirror 3 點屬同步副本）。

**現況**：
```scss
.lab-button--primary:hover { background: color-mix(in srgb, var(--lab-color-primary) 88%, #000); }
```

**Proposal A（推薦）**：新增 semantic token + component 改吃
```scss
// _tokens.scss
--lab-color-overlay-dark: #000;
--lab-color-overlay-light: #fff;       // optional 對稱（若未來 light overlay 需求）

// _button.scss
.lab-button--primary:hover {
  background: color-mix(in srgb, var(--lab-color-primary) 88%, var(--lab-color-overlay-dark));
}
```

優點：消除 hex 寫死；未來 platform 可微調 overlay 強度（如改 `#1a1a1a` 取代純黑）。

**Proposal B（保留現狀）**：`#000` 視為 CSS `color-mix()` 的常見配料；不抽 token
- 優點：CSS 慣用法；不增加 token 複雜度
- 缺點：仍違反 policy §5 禁則 #9 字面（component 內出現 hex）

**本 DS-2 建議**：採 **Proposal A**（增加 semantic 抽象；未來 platform 可調整）；風險 🟡 中（hover 視覺需 visual diff 確認與原本 `#000` 無感差）。

**或**採 mixin 包裝（Proposal C）：
```scss
// _mixins.scss
@mixin lab-overlay-darken($base, $amount: 88%) {
  background: color-mix(in srgb, var(#{$base}) $amount, var(--lab-color-overlay-dark));
}
```
LOC 較高但可重用；本 DS-2 不裁決選 A 或 C，留 DS-3-c 決定。

**風險：🟡 中**（hover/active 視覺需確認；改一處同步改 mirror partial）。

### 8.2 `#fff` 寫死（3 個 hex 點）

涉及：`_header.scss:11` × 1（menu button background）+ `_base.scss:5` × 2（.lab-hero gradient 之 `#eff6ff, #fff`）。

#### 8.2.1 `_header.scss:11` `.lab-header__menu-button`

**現況**：`background: #fff`

**Proposal**：改 `background: var(--lab-color-background)`

**風險：🟢 低**（語意正確；視覺零差異；單一 component）。

#### 8.2.2 `_base.scss:5` `.lab-hero` gradient

**現況**：`background: linear-gradient(180deg, #eff6ff, #fff)`

**Proposal A（推薦）**：
- 新增 semantic `--lab-color-bg-soft`（per §5.4；platform 可覆寫）
- 改：`background: linear-gradient(180deg, var(--lab-color-bg-soft), var(--lab-color-background))`

**Proposal B（specific token）**：新增 `--lab-color-hero-bg-start` / `--lab-color-hero-bg-end` 專用於 hero
- 缺點：太 component-specific；違反 semantic 抽象原則

**Proposal C（保留現狀；當 hero 是 chrome 而非 article block）**：因 hero 不在文章頁，不在 policy §4 之 19 個 article components 清單；可選擇豁免
- 缺點：仍違反 §5 禁則 #9

**本 DS-2 建議**：採 **Proposal A**；風險 🟡 中（gradient 視覺需 diff 確認）。

### 8.3 `_mobile-drawer.scss:4` token fallback `#f3f4f6`

**現況**：`background: var(--lab-color-gray-100, #f3f4f6)`

**Proposal**：移除 fallback，改為 `background: var(--lab-color-gray-100)`

**風險：🟢 低**（`--lab-color-gray-100` 必定存在於 `_tokens.scss`；fallback 永不觸發；屬無功能 dead code）。

### 8.4 風險分級總覽

| 風險級 | 項目 | 數 |
|---|---|---|
| 🟢 低 | `_header.scss` `#fff` 改 token / `_mobile-drawer.scss` 移除 fallback | 2 |
| 🟡 中 | `color-mix(..., #000)` hover overlay 抽 token / `.lab-hero` gradient 抽 token | 2 個 pattern（涉及 7 個 hex 點：5 個 hover + 2 個 gradient） |
| 🔴 高 | mirror partial（`_blogger-components-rules.scss`）整合 | 1（**屬 DS-3-e**，非本 tokenization 範圍） |

**本批 0 個 hex 真正落地修改**；以上皆為 proposal。

---

## §9 Component token usage rules

### 9.1 可使用

| 層 | Component 可讀 | 範例 |
|---|---|---|
| **Semantic color tokens** | ✅ 推薦 | `var(--lab-color-primary)` / `var(--lab-color-link)` / `var(--lab-color-bg-soft)` / `var(--lab-color-badge-bg)` |
| **Global / raw scale tokens** | ✅ 可（取尺度） | `var(--lab-space-4)` / `var(--lab-font-size-base)` / `var(--lab-radius-md)` / `var(--lab-shadow-sm)` / `var(--lab-z-overlay)` |
| **Gray scale (raw)** | ⚠️ 慎用 | `var(--lab-color-gray-100)` 作為次要背景**可接受**（如 disabled state）；但若該用 `--lab-color-bg-soft` 更語意正確 |
| **Focus ring atoms** | ✅ 可 | `var(--lab-focus-ring-color)` / `var(--lab-focus-ring-width)` 等 |

### 9.2 不應使用

| 反例 | 原因 | 對應 policy 禁則 |
|---|---|---|
| `var(--blogger-primary)` / `var(--github-primary)` | platform token 不存在；若存在屬 component 平台耦合 | §5 禁則 #6 |
| 寫死 hex（`#fff` / `#000` / `#b45309` 等） | 違反 token 抽象 | §5 禁則 #9 |
| 同色票在 Blogger / GitHub 兩處複製 | drift 起點 | §5 禁則 #3 |
| `--lab-color-blue-600` / `--lab-color-amber-700` 之 raw brand | 應改吃 semantic（`--lab-color-primary`） | §2 三層架構 |
| component 內 `@media` 自定義 breakpoint 數值 | 應用 `bp.respond-to('md')` mixin 或 `var(--lab-bp-md)` | policy §5 禁則 #8 |

### 9.3 Layout 層

- Layout 可少量使用 semantic layout token（如 `--lab-container-md`）
- Layout 可使用 spacing / typography / shadow / z-index 等 raw 尺度
- Layout 取色仍走 semantic（同 component）

### 9.4 Base / root 層

- `:root` / `base/_base.scss` 可定義或 include raw tokens
- `base/_article.scss` 可定義跨平台 article 結構規則（已有 `.lab-blogger-article, .lab-article` 群組 selector 之 good practice）

### 9.5 Theme selector 層

- 只覆寫 semantic token
- 不新增 component-specific token

### 9.6 SCSS 範例

**✅ 正確**：

```scss
.lab-button--primary {
  background: var(--lab-color-primary);
  color: var(--lab-color-on-primary);           // 新 semantic（per §5.4）
  border-color: var(--lab-color-primary);
  padding: var(--lab-space-3) var(--lab-space-4);
  border-radius: var(--lab-radius-full);
}

.lab-button--primary:hover {
  background: color-mix(in srgb, var(--lab-color-primary) 88%, var(--lab-color-overlay-dark));
}
```

**❌ 錯誤 — 直讀 platform token**：

```scss
.lab-button {
  background: var(--blogger-primary);   // ❌ platform 耦合
}
```

**❌ 錯誤 — 寫死 hex**：

```scss
.lab-button {
  background: #b45309;                  // ❌ 違反 §5 禁則 #9
}
```

**❌ 錯誤 — platform modifier in component**：

```scss
.lab-button--blogger { background: ...; }   // ❌ 違反 policy §5 禁則 #5
```

**❌ 錯誤 — hex 寫死於 hover**：

```scss
.lab-button:hover {
  background: color-mix(in srgb, var(--lab-color-primary) 88%, #000);   // ❌ 應改吃 --lab-color-overlay-dark
}
```

---

## §10 DS-3 拆批建議

依 **最小破壞性** 原則拆 5 個 sub-batches。每批之間皆 stop point；user 驗收後才啟動下一批。

### 10.1 DS-3-a：補 semantic token defaults（only additive；不改 component）

| 項目 | 內容 |
|---|---|
| 範圍 | `src/styles/abstracts/_tokens.scss` 新增 §5.4 之 10 個 semantic token；既有 token 全保留 |
| Component 改動 | ❌ 無；本批不改 component |
| 預期視覺差異 | 零（純 additive；無 selector 改動） |
| 預期輸出差異 | dist CSS 多 ~10 行 token 定義；無實際取用 |
| 風險 | 🟢 低 |
| 預估 LOC | SCSS ~15 |
| 驗證 | `npm run build` + 對比 dist CSS 多出之 token 行；GitHub Pages 視覺零差異 |

**目的**：建立 semantic token 基底，讓 DS-3-b / DS-3-c 可直接讀。

### 10.2 DS-3-b：補 `.lab-site--blogger` / `.lab-site--github` theme override

| 項目 | 內容 |
|---|---|
| 範圍 | `src/styles/abstracts/_themes.scss` 由 2 行擴至 §6.3 所示之完整 override；新增 secondary / link / badge / bg-soft 之 platform 值 |
| Component 改動 | ❌ 無 |
| 預期視覺差異 | ⚠️ 兩平台之 secondary / badge / bg-soft 開始有差異化視覺（per user 設計師確認之色票） |
| 風險 | 🟡 中（platform 視覺改變；需 user 確認 hex 值） |
| 預估 LOC | SCSS ~20 |
| 驗證 | `npm run build` + 兩平台視覺 diff（GitHub Pages / Blogger 後台貼上）；確認對比 / 可讀性無 regression |
| 前置 | DS-3-a 完成 |

### 10.3 DS-3-c：處理低風險 hard-coded color

| 項目 | 內容 |
|---|---|
| 範圍 | DS-2 §8 之 🟢 低風險 + 🟡 中風險 hex 違規修正：① `_header.scss:11` `#fff` → `var(--lab-color-background)` ② `_mobile-drawer.scss:4` 移除 fallback ③ `color-mix(..., #000)` 改 `color-mix(..., var(--lab-color-overlay-dark))`（5 個 hex 點）④ `.lab-hero` gradient 改吃 `var(--lab-color-bg-soft)` + `var(--lab-color-background)` |
| Component 改動 | ⚠️ 是；改 4 個檔（_header / _mobile-drawer / _button / _download-box / _base） + 同步改 mirror partial `_blogger-components-rules.scss`（hover overlay 3 點） |
| 預期視覺差異 | 零或極小；hover / hero 視覺需 diff 確認 |
| 風險 | 🟡 中（5 個檔改動；視覺需確認；mirror 同步成本） |
| 預估 LOC | SCSS ~10 / 散在 6 檔 |
| 驗證 | `npm run build` + 視覺 diff（button hover / hero / header / drawer） |
| 前置 | DS-3-a 完成（需 `--lab-color-overlay-dark` 與 `--lab-color-bg-soft`） |

### 10.4 DS-3-d：檢查 Blogger theme CSS output

| 項目 | 內容 |
|---|---|
| 範圍 | `npm run build:blogger-theme` 重產 `dist-blogger/theme/*`；對比新舊 4 個 CSS；確認 token 新增 / 取用變化符合預期；確認 mirror partial 同步正確 |
| Component 改動 | ❌ 無 source 改動（屬驗證 batch） |
| 預期輸出差異 | 4 個 CSS 內容增加 token；component CSS 應 byte-identical-modulo-comment（除已改之 hover overlay 處） |
| 風險 | 🟡 中（產出影響 Blogger 後台；需 user 重貼 CSS） |
| 預估 LOC | 0（純驗證） + user 手動重貼 Blogger 後台 CSS |
| 驗證 | diff 4 個 CSS；Blogger 後台貼上 + 預覽桌機/手機；確認既有文章視覺無 regression |
| 前置 | DS-3-a / DS-3-b / DS-3-c 完成 |

### 10.5 DS-3-e：再評估 `_blogger-components-rules.scss` mirror partial 整合

| 項目 | 內容 |
|---|---|
| 範圍 | 評估是否將 mirror partial 改為直接 import `src/styles/components/*`；含遷移路徑、Blogger entry 結構調整、scope 處理 |
| Component 改動 | ❌ 本批不做；屬 pre-analysis only |
| 預期視覺差異 | TBD（取決於整合方案） |
| 風險 | 🔴 高（會改 dist-blogger/theme/* 內容；Blogger 後台需重貼；影響全 component CSS） |
| 預估 LOC | pre-analysis docs ~250 |
| 驗證 | 屬獨立 pre-analysis；不改 source；user 批准後再開 DS-3-e-impl batch 拆 sub-batches 落地 |
| 前置 | DS-3-d 完成（穩定基線後再評估） |
| 落地時機 | **不主動建議；待 user 評估 mirror partial 維護痛點時再啟動** |

### 10.6 不建議事項

- ❌ **不建議**一開始就整合 mirror partial（per spec F 之提醒；屬 🔴 高風險）
- ❌ **不建議**直接做既有 token rename（per 本 DS-2 §5.6 之 additive-only 原則）
- ❌ **不建議**在 DS-3-a 之外的批次新增 raw brand scale（如 `--lab-color-blue-600`；當前單值已足）

---

## §11 本批不做事項

| # | 項目 | 狀態 |
|---|---|---|
| 1 | 不改 SCSS source | ✅ `src/styles/**` 完全未動 |
| 2 | 不改 EJS source | ✅ `src/views/**` 完全未動 |
| 3 | 不改 JS / build script | ✅ `src/scripts/**` 完全未動 |
| 4 | 不改 content | ✅ `content/**` 未動 |
| 5 | 不改 dist | ✅ `dist/` / `dist-blogger/` / `dist-promotion/` / `.cache/` 未動 |
| 6 | 不改 deploy repo | ✅ `D:\github\blog-new\portable-blog-deploy\` 未動 |
| 7 | 不 push | ✅ 未 push（source repo 無 upstream） |
| 8 | 不直接修 hard-coded colors | ✅ 11 個 hex 違規點全部未動；皆為 proposal |
| 9 | 不整合 `_blogger-components-rules.scss` | ✅ 未動；屬 DS-3-e 評估範圍 |
| 10 | 不改 Blogger theme CSS output | ✅ `dist-blogger/theme/*` 未重產 |
| 11 | 不改 `_themes.scss` | ✅ 仍是 2 行；DS-3-b 才擴充 |
| 12 | 不新增 / rename 任何 token | ✅ 純 proposal；DS-3-a 才落地 |
| 13 | 不執行 token migration | ✅ 既有 component 取用 token 全保留 |
| 14 | 不裁決 alias 與 canonical 之最終 winner | ✅ §5.6 列方案 A / B；DS-3 落地時 user 決定 |
| 15 | 不裁決具體色票 hex 值 | ✅ §6.3 之色票為範例；DS-3-b 落地時 user 確認 |

---

## §12 對既有系統之影響

| 維度 | 狀態 |
|---|---|
| `src/styles/**` | ❌ 未動（含 abstracts / base / layout / components / blogger 全 5 區） |
| `src/views/**` | ❌ 未動 |
| `src/scripts/**` | ❌ 未動 |
| content posts / settings / publish.json / fb.md | ❌ 未動 |
| `package.json` / `vite.config.js` | ❌ 未動 |
| `dist/` / `dist-blogger/` / `dist-promotion/` / `.cache/` | ❌ 未動 |
| Deploy repo（`portable-blog-deploy`） | ❌ 未動（HEAD 仍 `4ecd92d`） |
| GitHub Pages 線上 | ❌ 未動 |
| Blogger 後台已貼 CSS | ❌ 未動（DS-3-d 才需評估重貼） |
| sitemap / robots / navigation | ❌ 未動 |
| validate baseline `0/22/17` | ❌ 預期未動 |
| Admin 既有功能 | ❌ 未動 |

---

## §13 邊界聲明

- ✅ 本文件**僅為 token naming proposal**；不改任何 source / build / dist / deploy
- ✅ 本文件**不**啟動 DS-3-a / DS-3-b / DS-3-c / DS-3-d / DS-3-e 任一 sub-batch
- ✅ 本文件**不**裁決 alias 命名 winner（§5.6 兩方案待 user 決定）
- ✅ 本文件**不**裁決具體色票（§6.3 為範例；DS-3-b 落地時 user 確認）
- ✅ 本文件**不**修正既有 11 個 hex 違規點（§8 為 proposal；DS-3-c 落地）
- ✅ 本文件**不**整合 mirror partial（§10.5 屬 DS-3-e 評估範圍）
- ✅ 對齊 `docs/css-design-system-policy.md` §2 三層架構

---

## §14 Cross-links

- `docs/css-design-system-policy.md`（commit `08cba04`；本 DS-2 之政策依據；§2 三層架構 / §3 platform theme / §5 禁則）
- `docs/design-system-ds1-audit.md`（commit `8dbfffe`；本 DS-2 之現況依據；§4.4 11 個 hex 違規點 / §6.2 10 項 gap / §7 風險分級）
- `CLAUDE.md` §9（CSS / class 命名規則；`--lab-` prefix）
- `CLAUDE.md` §10（Blogger Design Token 匯出；DS-3-d 之 Blogger theme CSS output 對照）
- `docs/design-system.md`（Design System 規格 / token / component catalog）
- `docs/blogger-export.md`（Blogger 匯出系統規格）

---

（本文件結束）
