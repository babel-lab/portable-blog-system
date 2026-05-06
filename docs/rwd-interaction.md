# I-01 RWD interaction

第一版互動包含 Sticky Header、Mobile Drawer、Back to Top、Active Nav 與 Lazy Image。

本檔目前涵蓋 **Phase 6-a**（RWD breakpoints + Sticky Header DOM 接線）。
其餘 6-b ~ 6-h 子階段尚未實作，逐步擴寫此檔。

---

## 1. Breakpoints（Phase 6-a）

本專案採 **mobile-first**，三個共用斷點對應手機 / 平板 / 桌機：

| Token | 值 | 對應 px @ 16px base | 適用 |
|---|---|---|---|
| `sm` | `36em` | 576 px | 大型手機橫向、小型平板直向 |
| `md` | `48em` | 768 px | 平板（drawer ↔ nav 切換點） |
| `lg` | `64em` | 1024 px | 桌機 |

### 1.1 SCSS 用法

```scss
@use '../abstracts/breakpoints' as bp;

.lab-foo {
  // 手機（mobile-first 預設）
  font-size: 1rem;

  @include bp.respond-to('md') {
    // 平板以上
    font-size: 1.125rem;
  }
}
```

`$bp-sm` / `$bp-md` / `$bp-lg` 仍可直接 `@media (min-width: bp.$bp-md)` 使用，與 `respond-to` mixin 共存。

### 1.2 CSS 變數的使用範圍

CSS 變數 `--lab-bp-sm / --lab-bp-md / --lab-bp-lg` 由 `main.scss :root` 透過 `lab-tokens-bp` mixin 輸出，**僅供 JS 讀取或 Design System 頁顯示**。

**CSS 變數無法用於 `@media` query**，因此 `@media` 條件必須直接用 SCSS 變數（或 `respond-to` mixin）。

---

## 2. Sticky Header（Phase 6-a）

`src/views/layout/header.ejs` 已具備 `data-sticky-header` 屬性。
`src/js/modules/sticky-header.js` 對該屬性掛 scroll listener，當 `window.scrollY > 8` 時加 `.is-scrolled` class。

`src/styles/layout/_header.scss` 對應規則：
- 預設：`border-bottom: 1px solid transparent`
- `.is-scrolled`：`border-bottom-color: var(--lab-color-border)`

> **Phase 6-a 不調整 Header 高度**；手機版短 Header 屬 6-b 範圍。

---

## 3. Phase 6 後續子階段（規劃中，未實作）

| 子階段 | 主題 |
|---|---|
| 6-b | 手機版短 Header + Mobile Drawer / Overlay Menu |
| 6-c | Back to Top 元件接 DOM |
| 6-d | Active Nav + Lazy Image |
| 6-e | Footer 完整化（連結 + 社群）|
| 6-f | 基本 a11y（skip-link / aria / prefers-reduced-motion） |
| 6-g | GA4 `data-ga4-*` 屬性散播（5-d 機制收尾） |
| 6-h | 本檔擴寫 + RWD / a11y checklists |

---

## 相關文件

- 規範來源：`CLAUDE.md` §6 Phase 6、§9.4 Flex 優先、§20 互動模組
- 5-d GA4 機制：`docs/seo-ga4-adsense.md`
