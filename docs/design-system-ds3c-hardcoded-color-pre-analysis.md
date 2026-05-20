# Design System DS-3-c-pre：Hard-coded Color Tokenization Pre-Analysis

本文件為 **Phase DS-3-c 之前置 pre-analysis**。屬純 docs / 純 read-only 分析；**本批不改任何 SCSS / EJS / build / dist / deploy**。為 DS-3-c（hard-coded color 修正之 source 修改）落地前之 user 共識文件。

對應上層文件：
- `docs/css-design-system-policy.md`（commit `08cba04`；§5 禁則 #9 hex 寫死）
- `docs/design-system-ds1-audit.md`（commit `8dbfffe`；§4.4 hex 違規清單）
- `docs/design-system-ds2-token-naming.md`（commit `28f5d0c`；§8 tokenization proposal / §10.3 DS-3-c 範圍）
- `docs/design-system-ds3b-theme-overrides-proposal.md`（commit `fc6ff81`；DS-3-b-pre dead-code 觀察）
- DS-3-a commit `c3b47dd`（10 個 semantic token defaults，含 `--lab-color-overlay-dark` / `--lab-color-bg-soft` / `--lab-color-on-primary`）
- DS-3-b commit `a129a79`（保守 theme override；未動 hard-coded color）

---

## §1 背景與範圍

### 1.1 為何 DS-3-c 需要 pre-analysis

DS-3-c 將實際修改 6 個 SCSS 檔（GitHub component / layout / base + Blogger mirror partial），可能影響視覺。屬中風險批；某些修正（如 `.lab-hero` gradient）即使吃既有 token 也會視覺改變；mirror partial 同步成本需明確。

依保守原則，**先做 pre-analysis 重新盤點 / 重新分級 / 制定最小策略 / 列同步方式**，等 user 批准後再進 source 修改。

### 1.2 本批範圍

- 重新確認 DS-1 / DS-2 提到的 hex 違規點是否仍存在（DS-3-a / DS-3-b 期間未動 component / layout / blogger mirror，但需驗證）
- 判斷每個 hex 是否真的需要修
- 提出 DS-3-c 之最小 source 修改策略
- 明確處理 GitHub component 與 Blogger mirror partial 之同步方式
- 對每點預估視覺差異 / Blogger CSS 變動 / 重貼需求

### 1.3 不在本批

- 任何 SCSS / EJS / build / dist 修改
- mirror partial 之架構整合（屬 DS-3-e）
- Blogger entry 結構變動（屬 DS-3-b-blogger-entry）
- 視覺真實 visual regression test（屬 DS-5）

---

## §2 hard-coded color 現況盤點

### 2.1 Re-grep 結果（驗證 DS-1 audit §4.4）

於 commit `a129a79` HEAD 下重新 grep `src/styles/**`（排除 `abstracts/`）：

**結果：11 行 / 12 個 hex occurrences 散在 6 個檔**（**較 DS-1 audit §4.4 之「11 個 hex 點」精確 +1**；DS-1 audit 漏算 `_blogger-components-rules.scss:54` 之 border-color 第二個 `#000`）。

| # | 檔 / 行 | hex | context（簡） |
|---|---|---|---|
| 1 | `components/_button.scss:34` | `#000` | `.lab-button--primary:hover` background `color-mix(..., #000)` |
| 2 | `components/_button.scss:35` | `#000` | `.lab-button--primary:hover` border-color `color-mix(..., #000)` |
| 3 | `components/_button.scss:38` | `#000` | `.lab-button--primary:active` background `color-mix(..., #000)` |
| 4 | `components/_download-box.scss:7` | `#000` | `.lab-download-box__cta:hover` background `color-mix(..., #000)` |
| 5 | `layout/_mobile-drawer.scss:4` | `#f3f4f6` | `.lab-mobile-drawer` background `var(--lab-color-gray-100, #f3f4f6)` fallback |
| 6 | `base/_base.scss:5` | `#eff6ff` | `.lab-hero` gradient 第一色 |
| 7 | `base/_base.scss:5` | `#fff` | `.lab-hero` gradient 第二色 |
| 8 | `layout/_header.scss:11` | `#fff` | `.lab-header__menu-button` background |
| 9 | `blogger/_blogger-components-rules.scss:54` | `#000` | mirror of #1（button hover background） |
| 10 | `blogger/_blogger-components-rules.scss:54` | `#000` | mirror of #2（button hover border-color） — **DS-1 audit 漏算** |
| 11 | `blogger/_blogger-components-rules.scss:55` | `#000` | mirror of #3（button active background） |
| 12 | `blogger/_blogger-components-rules.scss:140` | `#000` | mirror of #4（download hover background） |

### 2.2 pattern 分類

- **`color-mix(..., #000)` hover/active overlay**：8 個 occurrences（4 個 GitHub + 4 個 Blogger mirror）；分散在 2 個 GitHub component + 1 個 mirror partial
- **`#fff` 寫死**：3 個 occurrences（1 個 `_header.scss` + 2 個 `.lab-hero` gradient）
- **`#eff6ff` 寫死**：1 個 occurrence（`.lab-hero` gradient）
- **`#f3f4f6` token fallback**：1 個 occurrence（`_mobile-drawer.scss`；屬「token 不存在時的退化值」非真寫死）

### 2.3 是否還有其他 hard-coded color

✅ **無**。re-grep 結果與 DS-1 audit §4.4 一致（除 +1 of 漏算）；DS-3-a / DS-3-b 期間未引入新 hex（DS-3-a 唯一新增之 `#000` 在 `_tokens.scss` `--lab-color-overlay-dark` token 層；屬 §3 合理；DS-3-b 寫的 hex 在 `_themes.scss` 屬 §3 合理）。

---

## §3 token 層允許的 hard-coded color

依 `docs/css-design-system-policy.md` §5 禁則 #9，**只有 token 定義層可出現 hex**。當前合理 hex 點：

| 檔 | 行數區間 | hex 數 | 性質 |
|---|---|---|---|
| `abstracts/_tokens.scss` | line 4-52（含 DS-3-a 新增之 token） | 20 + 1（`--lab-color-overlay-dark: #000`） | ✅ 合理；token 定義 |
| `abstracts/_themes.scss` | DS-3-b 後 line 51, 62 | 2（`#2563eb` / `#b45309`） | ✅ 合理；platform theme override 定義 |

→ Token 層共 ~23 個 hex；皆屬定義層；本 DS-3-c 不動。

---

## §4 低風險修正項（🟢；可即修；視覺零差異）

### 4.1 `_header.scss:11` `#fff` → token

**現況**：
```scss
.lab-header__menu-button {
  background: #fff;
  ...
}
```

**修正建議**：
```scss
.lab-header__menu-button {
  background: var(--lab-color-background);
  ...
}
```

**選項分析**：
- `var(--lab-color-background)`（推薦）：純白頁面背景；語意正確；當前 default `#ffffff` 完全相同
- `var(--lab-color-on-primary)`（不推薦）：on-primary 是「primary 背景上之文字色」；用於 menu button 之 background 語意錯誤
- `var(--lab-color-bg)`：DS-3-a alias 至 background；可用但 canonical 仍是 `--lab-color-background`

**視覺差：** ✅ 零（`var(--lab-color-background)` 預設 = `#ffffff` = `#fff`）

**Blogger 影響：** ❌ 無（`_header.scss` 不在 mirror partial；非 Blogger 範圍）

### 4.2 `_mobile-drawer.scss:4` 移除 fallback `#f3f4f6`

**現況**：
```scss
.lab-mobile-drawer {
  background: var(--lab-color-gray-100, #f3f4f6);
  ...
}
```

**修正建議**：
```scss
.lab-mobile-drawer {
  background: var(--lab-color-gray-100);
  ...
}
```

**理由**：`--lab-color-gray-100` 必存於 `_tokens.scss` mixin（line 23），fallback 永不觸發；屬 dead fallback。

**視覺差：** ✅ 零（fallback 永未生效）

**Blogger 影響：** ❌ 無（`_mobile-drawer.scss` 屬 GitHub Pages chrome；不在 mirror partial）

---

## §5 中風險修正項（🟡；需 mirror 同步或視覺確認）

### 5.1 `color-mix(..., #000)` hover/active overlay × 8 → `--lab-color-overlay-dark`

**現況**（4 個 GitHub source + 4 個 Blogger mirror）：

```scss
// _button.scss
.lab-button--primary:hover {
  background: color-mix(in srgb, var(--lab-color-primary) 88%, #000);
  border-color: color-mix(in srgb, var(--lab-color-primary) 88%, #000);
}
.lab-button--primary:active {
  background: color-mix(in srgb, var(--lab-color-primary) 78%, #000);
}

// _download-box.scss
.lab-download-box__cta:hover {
  background: color-mix(in srgb, var(--lab-color-accent) 88%, #000);
}

// _blogger-components-rules.scss (mirror)
.lab-button--primary:hover { background: color-mix(in srgb, var(--lab-color-primary) 88%, #000); border-color: color-mix(in srgb, var(--lab-color-primary) 88%, #000); }
.lab-button--primary:active { background: color-mix(in srgb, var(--lab-color-primary) 78%, #000); }
.lab-download-box__cta:hover { background: color-mix(in srgb, var(--lab-color-accent) 88%, #000); }
```

**修正建議**：全部 8 個 `#000` 改為 `var(--lab-color-overlay-dark)`：

```scss
.lab-button--primary:hover {
  background: color-mix(in srgb, var(--lab-color-primary) 88%, var(--lab-color-overlay-dark));
  ...
}
```

**視覺差：** ✅ 零（DS-3-a 已新增 `--lab-color-overlay-dark: #000`；token 值與既有 hex 字面相同）

**Mirror 同步：** ⚠️ 是；必須**同時修改** `_button.scss` / `_download-box.scss` 與 `_blogger-components-rules.scss` 三檔；4 個 GitHub source 改動需對應同步 4 個 mirror 改動

**Blogger CSS 影響：** ⚠️ 是；mirror partial 是 Blogger pipeline 之 source；改動會進入 `dist-blogger/theme/blogger-components.css` 與 `blogger-full-style.css`；雖然字面結果同（`#000` 替換為 `var(--lab-color-overlay-dark)` 而 token 值就是 `#000`），但 CSS 文本不同 → **非 byte-identical**

**Blogger 後台重貼需求：** ⚠️ **建議重貼**（4 個 hover/active overlay 從 hex 改 var；render 結果視覺相同，但 CSS 文本不同；保險起見建議 user 重貼 `blogger-full-style.css` 以維持 source-truth 一致；若 user 評估 hover render 同色可暫不重貼）

### 5.2 `_base.scss:5` `.lab-hero` gradient → token

**現況**：
```scss
.lab-hero {
  padding: 6rem 0 4rem;
  background: linear-gradient(180deg, #eff6ff, #fff);
}
```

**修正建議 A（DS-2 §8.2.2 推薦；視覺微差）**：
```scss
.lab-hero {
  padding: 6rem 0 4rem;
  background: linear-gradient(180deg, var(--lab-color-bg-soft), var(--lab-color-background));
}
```

**⚠️ 視覺差**：**有**。
- DS-3-a 新增之 `--lab-color-bg-soft` alias 至 `--lab-color-surface`
- `--lab-color-surface` default = `#f8fafc`（per `_tokens.scss` line 9；灰白）
- 原 hex `#eff6ff` = 淡藍
- → hero gradient 第一色從淡藍 `#eff6ff` 變灰白 `#f8fafc` → **頁面 hero 區塊頂部色調改變**（從藍調轉灰調）

**修正建議 B（新增 component-specific token；視覺零差）**：
- 在 `_tokens.scss` 新增 `--lab-color-hero-bg-start: #eff6ff` / `--lab-color-hero-bg-end: #ffffff`
- `.lab-hero` 改吃此 2 個 token
- ⚠️ 違反 DS-2 §4 / §5「不主張 component-specific token」原則（DS-2 §8.2.2 列為 Proposal B 但不推薦）

**修正建議 C（豁免；維持 hex；本批不修）**：
- `.lab-hero` 屬 chrome（不在 article block 之必須 token 化清單；不在 policy §4 之 19 個共用 components 列表）
- DS-2 §8.2.2 Proposal C 列為「保留現狀」之選項
- 風險最低；策略上一致性退讓

**Mirror 同步：** ❌ 否（`.lab-hero` 為 GitHub Pages homepage 元素；不在 Blogger 範圍；mirror partial 無此 selector）

**Blogger CSS 影響：** ❌ 無

**本 DS-3-c-pre 建議：**
- **若 user 接受 hero 微色差** → 採方案 A（最符合 token 化原則）
- **若 user 要視覺絕對零差** → 採方案 C（本批豁免；標 future DS-3-c-bis 再評估）
- **不推薦** 方案 B（破壞 semantic 抽象原則）

---

## §6 高風險 / 本批不建議項

### 6.1 `_blogger-components-rules.scss` mirror partial 整合

- 整合屬 **DS-3-e** 範圍（per `docs/design-system-ds2-token-naming.md` §10.5）
- 涉及 Blogger pipeline 結構變動；🔴 高風險
- 本 DS-3-c 範圍**只同步**既有 mirror 之 hex 替換；**不**整合 mirror

### 6.2 Blogger entry 結構變動（讓 themes 進 Blogger CSS）

- 屬 **DS-3-b-blogger-entry** 範圍（per `docs/design-system-ds3b-theme-overrides-proposal.md` §5.6 / §7.2）
- 落地後 Blogger 後台需重貼 `blogger-full-style.css`
- 本 DS-3-c 範圍**不**動 Blogger entry

### 6.3 component class 改名 / EJS 改動 / build script 改動

- 不在 DS-3-c 範圍
- 任何此類改動屬獨立議題

---

## §7 DS-3-c 最小 source 修改策略

### 7.1 原則

- **只做 token 等價替換**；不改視覺意圖
- **不改 selector / class / EJS / build script**
- **不整合 mirror partial**（屬 DS-3-e）
- **只同步修改 mirror partial 中相同 pattern**，避免 GitHub / Blogger component drift
- **不讓 Blogger entry 引用 `_themes.scss`**（屬 DS-3-b-blogger-entry）
- **不要求重貼 Blogger CSS**，除非 `build:blogger-theme` 產出之 CSS substantive 變動需要 user 更新

### 7.2 拆批策略選項

#### Option 1（推薦）：單一 batch DS-3-c 含全部低 + 中風險（除 hero）

| 內容 | 範圍 |
|---|---|
| 修正 §4.1 / §4.2 | `_header.scss` / `_mobile-drawer.scss`（GitHub only；零視覺差） |
| 修正 §5.1 | `_button.scss` / `_download-box.scss` / `_blogger-components-rules.scss`（含 mirror 同步；零視覺差） |
| **不修** §5.2 hero（留待 user 決方案 A/B/C） | — |
| Mirror 同步 | 是；3 個 GitHub + 1 個 mirror = 4 檔聯動 |
| Blogger CSS substantive 變動 | ⚠️ 是（`color-mix(..., #000)` → `color-mix(..., var(--lab-color-overlay-dark))`；render 同色但文本不同） |
| Blogger 後台重貼 | ⚠️ 建議重貼 `blogger-full-style.css`（保險起見；若 hover render 同色 user 可評估延後） |
| 預估 LOC | SCSS ~12 修改（4 hex + 1 fallback + 1 hex × 1 + mirror 4 hex） |
| 風險 | 🟡 中（mirror 同步成本；Blogger 重貼決策） |

#### Option 2（更保守）：拆 DS-3-c-a / DS-3-c-b

- **DS-3-c-a**：只修 §4 低風險（_header / _mobile-drawer）；GitHub only；零 Blogger 影響；🟢 低風險
- **DS-3-c-b**：修 §5.1 hover overlay（含 mirror 同步）；🟡 中風險
- **DS-3-c-c（可選）**：hero gradient（user 確認方案 A/B/C 後）

→ 拆批優點：每 sub-batch 風險獨立；user 可在 DS-3-c-a 後 visual diff 確認再進 b
→ 拆批缺點：commit 數變 3；mirror partial 改 1 次（在 b）；同步成本不變

#### Option 3：含 hero gradient（單批全部）

- §4 + §5.1 + §5.2 全做
- 額外含視覺差（hero 區塊色調改變）
- 需 user 預先決方案 A（接受視覺差）；不適合保守

### 7.3 本 DS-3-c-pre 推薦

**推薦 Option 2 拆批**（per `feedback_conservative_landing` 偏好保守落地）：

- **DS-3-c-a 先做**：純 GitHub low-risk fix（_header / _mobile-drawer）；user 跑 dev preview 確認零差後進 b
- **DS-3-c-b 後做**：hover overlay tokenize + mirror 同步；user 在落地後評估 Blogger 後台重貼時機
- **DS-3-c-c 留待**：hero gradient（要等 user 對方案 A / B / C 表態）

---

## §8 預期修改檔與修改內容

### 8.1 預期修改檔（per Option 2；當前 DS-3-c-pre 推薦）

| 檔 | DS-3-c-a | DS-3-c-b | DS-3-c-c |
|---|---|---|---|
| `src/styles/layout/_header.scss` | ✅ 1 行（`#fff` → `var(--lab-color-background)`） | — | — |
| `src/styles/layout/_mobile-drawer.scss` | ✅ 1 行（移除 fallback） | — | — |
| `src/styles/components/_button.scss` | — | ✅ 3 行（`#000` → `var(--lab-color-overlay-dark)`） | — |
| `src/styles/components/_download-box.scss` | — | ✅ 1 行（同上） | — |
| `src/styles/blogger/_blogger-components-rules.scss` | — | ✅ 3 行 / 4 hex（mirror 同步） | — |
| `src/styles/base/_base.scss` | — | — | ⚠️ 1 行（待 user 方案決定） |

### 8.2 每檔修改內容（diff 預覽）

**`_header.scss:11`（DS-3-c-a）**：
```diff
- .lab-header__menu-button { ... background: #fff; ... }
+ .lab-header__menu-button { ... background: var(--lab-color-background); ... }
```

**`_mobile-drawer.scss:4`（DS-3-c-a）**：
```diff
- .lab-mobile-drawer { ... background: var(--lab-color-gray-100, #f3f4f6); ... }
+ .lab-mobile-drawer { ... background: var(--lab-color-gray-100); ... }
```

**`_button.scss:34/35/38`（DS-3-c-b）**：
```diff
- .lab-button--primary:hover { background: color-mix(in srgb, var(--lab-color-primary) 88%, #000); border-color: color-mix(in srgb, var(--lab-color-primary) 88%, #000); }
+ .lab-button--primary:hover { background: color-mix(in srgb, var(--lab-color-primary) 88%, var(--lab-color-overlay-dark)); border-color: color-mix(in srgb, var(--lab-color-primary) 88%, var(--lab-color-overlay-dark)); }
- .lab-button--primary:active { background: color-mix(in srgb, var(--lab-color-primary) 78%, #000); }
+ .lab-button--primary:active { background: color-mix(in srgb, var(--lab-color-primary) 78%, var(--lab-color-overlay-dark)); }
```

**`_download-box.scss:7`（DS-3-c-b）**：
```diff
- .lab-download-box__cta:hover { background: color-mix(in srgb, var(--lab-color-accent) 88%, #000); }
+ .lab-download-box__cta:hover { background: color-mix(in srgb, var(--lab-color-accent) 88%, var(--lab-color-overlay-dark)); }
```

**`_blogger-components-rules.scss:54/55/140`（DS-3-c-b mirror 同步）**：同 `_button.scss` + `_download-box.scss` 之 pattern；4 個 `#000` 全替換為 `var(--lab-color-overlay-dark)`

**`_base.scss:5`（DS-3-c-c；待 user 方案決定）**：
```diff
- .lab-hero { padding: 6rem 0 4rem; background: linear-gradient(180deg, #eff6ff, #fff); }
+ .lab-hero { padding: 6rem 0 4rem; background: linear-gradient(180deg, var(--lab-color-bg-soft), var(--lab-color-background)); }
```
（方案 A；視覺微差）

### 8.3 是否需同步 mirror partial

| sub-batch | 是否同步 mirror | 同步檔 |
|---|---|---|
| DS-3-c-a | ❌ 否（_header / _mobile-drawer 不在 mirror 範圍） | — |
| DS-3-c-b | ✅ 是（4 個 GitHub overlay → 4 個 mirror overlay） | `_blogger-components-rules.scss` |
| DS-3-c-c | ❌ 否（_base.scss 不在 mirror） | — |

### 8.4 是否會影響 Blogger CSS

| sub-batch | Blogger CSS 變動 | Blogger 後台重貼 |
|---|---|---|
| DS-3-c-a | ❌ 無 | ❌ 不需 |
| DS-3-c-b | ⚠️ 是（文本變動；render 同色） | ⚠️ 建議重貼（user 可評估延後） |
| DS-3-c-c | ❌ 無 | ❌ 不需 |

---

## §9 驗證計畫

每 sub-batch 落地時應跑：

1. `npm run validate:content` → 確認 `0/22/17` baseline 不退步
2. `npm run build` → 確認 GitHub prod build 成功
3. `npm run build:blogger-theme` → 確認 4 個 CSS 成功產出

並做 sanity check：

| 檢查項 | DS-3-c-a 預期 | DS-3-c-b 預期 | DS-3-c-c 預期（方案 A） |
|---|---|---|---|
| validate baseline | 0/22/17 | 0/22/17 | 0/22/17 |
| GitHub build | ✅ | ✅ | ✅ |
| Blogger theme CSS 產出 | ✅ | ✅ | ✅ |
| `.cache/pages/admin` ABSENT | ✅ | ✅ | ✅ |
| `dist/admin` ABSENT | ✅ | ✅ | ✅ |
| sitemap admin grep = 0 | ✅ | ✅ | ✅ |
| GitHub dist CSS 文本變動 | ⚠️ 小（2 行 token 化） | ⚠️ 中（4 行 token 化） | ⚠️ 小（1 行 token 化） |
| Blogger CSS substantive 變動 | ❌ 無 | ⚠️ 是（4 行 hex → var；render 同色） | ❌ 無 |
| Blogger 後台需重貼 | ❌ 不需 | ⚠️ 建議 | ❌ 不需 |
| GitHub Pages 視覺 diff | 零 | 零（hover render 同色） | 微差（hero 區塊色調由淡藍轉灰白） |

### 9.1 Blogger CSS 是否需重貼之判斷流程（DS-3-c-b 落地時）

```
build:blogger-theme 後 → diff dist-blogger/theme/blogger-components.css 與 blogger-full-style.css
   ↓
若 diff 只是 #000 → var(--lab-color-overlay-dark) 之文本替換（render 同色）
   ↓
建議重貼（保險起見；維持 source-truth 一致）
但若 user 已驗證 Blogger 後台 hover 視覺與既有相同
   ↓
可暫不重貼；延至下一個需 Blogger 後台同步之 batch 一起重貼（如 DS-3-b-blogger-entry 落地時）
```

---

## §10 本批不做事項

| # | 項目 | 狀態 |
|---|---|---|
| 1 | 不改 SCSS | ✅ `src/styles/**` 41 檔完全未動 |
| 2 | 不改 component | ✅ `src/styles/components/**` 15 檔未動 |
| 3 | 不改 mirror partial | ✅ `_blogger-components-rules.scss` 未動 |
| 4 | 不改 EJS | ✅ `src/views/**` 51 檔未動 |
| 5 | 不改 build script | ✅ `src/scripts/**` / `package.json` / `vite.config.js` 未動 |
| 6 | 不改 content | ✅ `content/**` 未動 |
| 7 | 不改 dist | ✅ `dist/` / `dist-blogger/` / `dist-promotion/` / `.cache/` 未動 |
| 8 | 不改 deploy repo | ✅ `D:\github\blog-new\portable-blog-deploy\` 未動 |
| 9 | 不 push | ✅ source repo 無 upstream；未 push |
| 10 | 不重產 Blogger CSS | ✅ 未跑 `npm run build:blogger-theme` |
| 11 | 不要求 user 重貼 Blogger CSS | ✅ Blogger 後台未動 |
| 12 | 不裁決 Option 1 / 2 / 3 拆批 | ✅ §7.3 推薦 Option 2；user 可決 |
| 13 | 不裁決 hero gradient 方案 A / B / C | ✅ §5.2 列三方案；user 設計師決 |
| 14 | 不整合 mirror partial 架構 | ✅ 屬 DS-3-e |
| 15 | 不動 Blogger entry 結構 | ✅ 屬 DS-3-b-blogger-entry |

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

- ✅ 本文件**僅為 DS-3-c pre-analysis**；不改任何 source / build / dist / deploy
- ✅ 本文件**不**啟動 DS-3-c / DS-3-c-a / DS-3-c-b / DS-3-c-c
- ✅ 本文件**不**裁決 Option 1 / 2 / 3 拆批策略
- ✅ 本文件**不**裁決 hero gradient 方案 A / B / C
- ✅ 本文件**不**整合 mirror partial（屬 DS-3-e）
- ✅ 本文件**不**動 Blogger entry 結構（屬 DS-3-b-blogger-entry）
- ✅ 本文件 §2.1 之「12 個 hex occurrences」修正 DS-1 audit §4.4 之「11 個」漏算（多算 `_blogger-components-rules.scss:54` 之 border-color `#000`）

---

## §13 Cross-links

- `docs/css-design-system-policy.md`（commit `08cba04`；§5 禁則 #9 hex 寫死）
- `docs/design-system-ds1-audit.md`（commit `8dbfffe`；§4.4 hex 違規清單；本批 §2.1 修正其漏算）
- `docs/design-system-ds2-token-naming.md`（commit `28f5d0c`；§8 tokenization proposal / §10.3 DS-3-c 範圍）
- `docs/design-system-ds3b-theme-overrides-proposal.md`（commit `fc6ff81`；DS-3-b-pre dead-code 觀察）
- DS-3-a commit `c3b47dd`（10 個 semantic token defaults）
- DS-3-b commit `a129a79`（保守 theme override；未動 hard-coded color）
- `CLAUDE.md` §9（class 命名）/ §10（Blogger Design Token 匯出）

---

## §14 落地進度紀錄

### 14.1 DS-3-c-a（commit `f530a39` — 2026-05-20 早些時候）

✅ **完整落地**（per §7.1 / §8.2 / §8.3）：
- `src/styles/layout/_header.scss:11`：`background: #fff` → `background: var(--lab-color-background)`
- `src/styles/layout/_mobile-drawer.scss:4`：移除 `, #f3f4f6` fallback；變純 `var(--lab-color-gray-100)`
- 視覺零差；Blogger 端零影響（layout 不在 mirror）；2 個 hex 違規清除。

### 14.2 DS-3-c-b（完整落地）（commits `67a0ccc` GitHub source + `cc2621d` mirror partial sync — 2026-05-20）

✅ **GitHub source 落地**（commit `67a0ccc`，Phase 20260520-pm-3）：
- `src/styles/components/_button.scss:34/35/38`：3 個 `#000` → `var(--lab-color-overlay-dark)`
- `src/styles/components/_download-box.scss:7`：1 個 `#000` → `var(--lab-color-overlay-dark)`
- 視覺零差（token 值 = `#000`；render 結果 byte-equal）

✅ **Mirror partial 同步完成**（commit `cc2621d`，Phase 20260520-am-1）：
- `src/styles/blogger/_blogger-components-rules.scss` line 54 (×2) / 55 / 140 之 4 個 `#000` 全替換為 `var(--lab-color-overlay-dark)`
- source-truth 與 GitHub component 完全對齊；先前「source 不齊但 render 等值」之 drift 已消除
- `dist-blogger/theme/*.css` 已透過 `npm run build:blogger-theme` 重產；CSS 文本變動（hex literal → var reference）但 render 同色（`--lab-color-overlay-dark` token 值 = `#000`）
- ⚠️ Blogger 後台**建議重貼** `blogger-full-style.css` 以維持 source-truth 一致；render 視覺相同；user 可擇時動作（非強制）

### 14.3 DS-3-c-c（hero gradient）

⏳ **未落地**；待 user 表態方案 A / B / C（per §5.2）。本日 Phase 20260520-pm-3 不處理（spec 第 8/9 條「不新增 token / 不改視覺語意」嚴格範圍 → 三個方案皆有違反或需新 token）。

### 14.4 累計 hex 違規清除進度

| 範疇 | hex 違規 | 已修 | 剩餘 | 狀態 |
|---|---|---|---|---|
| Layout（`_header.scss` + `_mobile-drawer.scss`）| 2 | 2 | 0 | ✅ DS-3-c-a 完成 |
| GitHub component overlay（`_button.scss` + `_download-box.scss`）| 4 | 4 | 0 | ✅ DS-3-c-b GitHub side 完成 |
| Blogger mirror overlay（`_blogger-components-rules.scss`）| 4 | 4 | 0 | ✅ DS-3-c-b mirror sync 完成（commit `cc2621d`，Phase 20260520-am-1）|
| Hero gradient（`_base.scss`）| 2 | 0 | 2 | ⏳ DS-3-c-c 待 user 方案 |
| **合計** | **12** | **10** | **2**（hero gradient）| 83% 完成 |

---

（本文件結束）
