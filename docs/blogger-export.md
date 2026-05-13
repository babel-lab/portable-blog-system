# E-01 Blogger Export

本文件說明 **Blogger Theme CSS 匯出**的使用方式。

> **進度說明**
> - ✅ Phase 3-a ~ 3-d（CSS 匯出，CLAUDE.md §10）已完成 — 本文件涵蓋這部分。
> - ⏸ Phase 3-e 之後（Blogger 文章 HTML / `meta.json` / `publish-checklist.txt`）尚未開始 — 詳見最末節。

---

## 0. 概覽

執行：

```bash
npm run build:blogger-theme
```

產出 4 個 CSS 檔案至 `dist-blogger/theme/`：

```
dist-blogger/theme/
├─ blogger-tokens.css          (~2.81 kB)
├─ blogger-article.css         (~6.16 kB)
├─ blogger-components.css      (~17.37 kB)
└─ blogger-full-style.css      (~20.74 kB)   ← 推薦使用
```

所有檔案皆使用 Phase 2-1 定義的 75 個 `--lab-*` token，不污染 `:root`、不影響 Blogger 預設主題。

---

## 1. CSS 匯出檔案總覽

| 檔案 | 用途 | 是否自包含 75 tokens | 適用情境 |
|---|---|---|---|
| **`blogger-full-style.css`** ⭐ | 完整 CSS：tokens + 文章排版 + 全部 components | ✅（一次性，無重複） | **預設推薦**：一次貼用、最完整、自包含 |
| `blogger-tokens.css` | 只含 75 個 `--lab-*` token | ✅ | 進階：自寫元件 + 排版的使用者 |
| `blogger-article.css` | 文章 body 排版（h1~h6 / p / ul / ol / blockquote / hr / a / img / figure / table / code / pre）+ tokens | ✅ | 進階：已有自家元件、僅需排版的 Blogger 主題 |
| `blogger-components.css` | 全部 15 個 components（button / card / post-card / tag / hashtag / breadcrumb / adsense / social-follow / affiliate-box / book-photo / download-box / related-posts / prev-next / back-to-top / toc）+ tokens | ✅ | 進階：自寫文章排版、僅需元件樣式 |

> 體積標示為 raw（未 gzip）。實際數值以 `npm run build:blogger-theme` 後的輸出為準。

---

## 2. 推薦使用方式

### 2.1 把 CSS 貼到 Blogger 主題

於 Blogger 後台 → 主題 → **編輯 HTML** → 在 `<head>` 內加：

```html
<style>
  /* ↓ 貼 dist-blogger/theme/blogger-full-style.css 的內容 ↓ */
</style>
```

### 2.2 文章內容外層加 wrapper class

撰寫 Blogger 文章時，HTML 內容外層包：

```html
<div class="lab-blogger-article">
  <!-- 文章內容（h1 / p / table / button / card 等皆可使用） -->
</div>
```

### 2.3 文章外（首頁 / 側欄 / CTA 區塊）使用 components

若在 Blogger 首頁、側欄 widget、自訂 HTML 區塊要用 `.lab-button` / `.lab-card` 等元件，外層包另一個 wrapper：

```html
<div class="lab-blogger-components">
  <a class="lab-button lab-button--primary" href="/">CTA 連結</a>
</div>
```

兩個 wrapper 的差別：

| Wrapper | 取得 tokens | 取得文章 body 排版（h1~h6 / p / table 等） | 取得 components |
|---|---|---|---|
| `.lab-blogger-article` | ✅ | ✅ | ✅（components 維持全域 selector） |
| `.lab-blogger-components` | ✅ | ❌ | ✅ |

---

## 3. 不建議重複貼用

`blogger-full-style.css` 已同時包含 tokens / article / components，**請不要再貼**：

- ❌ `blogger-tokens.css`（會重複 75 個 token 宣告）
- ❌ `blogger-article.css`（會重複 article body 規則 + tokens）
- ❌ `blogger-components.css`（會重複 components 規則 + tokens）

雖然 CSS last-wins 不會有視覺錯誤，但會造成：
- 不必要的 KB 增加（最多多 ~25 kB）
- 維護混亂（不知道誰覆蓋誰）
- 未來想 debug 時對應不到 source

**規則**：要嘛只貼 `blogger-full-style.css`，要嘛只組合貼用三個個別檔（不貼 full-style）。**不要混用**。

---

## 4. Scope 設計說明

| 設計選擇 | 內容 | 原因 |
|---|---|---|
| **不使用 `:root`** | 所有 token 宣告皆不在 `:root` 上 | 避免污染 Blogger 預設主題的 root scope |
| **tokens 用 `:where(.lab-blogger-article, .lab-blogger-components)`** | tokens 只在這兩個 wrapper class 內可用 | `:where()` 為 zero specificity，使用者自訂值容易覆蓋 |
| **article body rules scope 在 `.lab-blogger-article`** | 例：`.lab-blogger-article h1 { ... }` | 文章排版只在文章內生效；不影響 Blogger 主題的 `<h1>`、`<p>` |
| **components 維持 `.lab-*` 全域** | 例：`.lab-button { ... }` | 同個元件可在文章、首頁、側欄、CTA 重用；外層只要包 `.lab-blogger-article` 或 `.lab-blogger-components` 任一即可拿到 tokens |

---

## 5. 基本 HTML 範例

### 5.1 一篇 Blogger 文章

```html
<div class="lab-blogger-article">
  <h1>文章標題</h1>
  <p>第一段文字。<a href="#">內文連結</a> 與 <code>inline code</code>。</p>

  <h2>小節標題</h2>
  <ul>
    <li>清單項目 1</li>
    <li>清單項目 2</li>
  </ul>

  <blockquote>
    這是引言段落。
  </blockquote>

  <pre><code>function hello(name) {
  console.log(`Hello, ${name}!`);
}</code></pre>

  <table>
    <thead>
      <tr><th>欄 A</th><th>欄 B</th></tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>2</td></tr>
    </tbody>
  </table>
</div>
```

### 5.2 Button

```html
<div class="lab-blogger-article">
  <a class="lab-button lab-button--primary" href="#">Primary</a>
  <a class="lab-button lab-button--secondary" href="#">Secondary</a>
  <a class="lab-button lab-button--outline" href="#">Outline</a>
  <a class="lab-button lab-button--text" href="#">Text</a>
  <a class="lab-button lab-button--primary lab-button--disabled" aria-disabled="true">Disabled</a>

  <!-- size variants -->
  <a class="lab-button lab-button--primary lab-button--sm" href="#">Small</a>
  <a class="lab-button lab-button--primary lab-button--lg" href="#">Large</a>
</div>
```

### 5.3 Card / Download Box

```html
<div class="lab-blogger-article">
  <!-- 通用卡片 -->
  <div class="lab-card">
    <h3>卡片標題</h3>
    <p>卡片內容。</p>
  </div>

  <!-- 教具下載卡 -->
  <aside class="lab-download-box">
    <h3 class="lab-download-box__title">下載教具 PDF</h3>
    <p class="lab-download-box__description">適用小學中年級數學練習單，附解答。</p>
    <a class="lab-download-box__cta" href="..." download>
      <span class="lab-download-box__filetype">PDF</span>下載檔案
    </a>
    <p class="lab-download-box__license">本素材僅供個人、家庭與教學使用。</p>
  </aside>
</div>
```

### 5.4 Blogger 文章外的 CTA 區塊（首頁 / 側欄）

```html
<!-- Blogger 首頁或側欄 widget 自訂 HTML 區塊 -->
<div class="lab-blogger-components">
  <article class="lab-post-card">
    <p class="lab-post-card__category">tech-note</p>
    <h3 class="lab-post-card__title">推薦文章標題</h3>
    <p class="lab-post-card__description">短描述兩三行。</p>
    <a class="lab-post-card__link" href="...">閱讀文章</a>
  </article>
</div>
```

---

## 6. 注意事項

### 6.1 Blogger 真機測試前，先用「預覽」確認

Blogger 後台貼完 CSS 後，**務必用 Blogger 平台的「預覽」功能**確認下列項目，再正式發布：
- 文章內容（h1 / p / table / code 等）排版正確
- 元件（button / card 等）視覺正常
- Blogger 主題的 header / sidebar / footer / comment / widget **未被污染**

### 6.2 不要把 `.lab-blogger-article` 包到整個 Blogger theme 外層

```html
<!-- ❌ 錯誤：包整個 Blogger theme -->
<body class="lab-blogger-article">
  ...header / nav / sidebar / footer / 全部 Blogger 主題...
</body>
```

這會讓 Blogger 預設主題（header / nav / footer）也套用我們的 article body 規則（如 h1 / p 樣式），造成視覺衝突。

正確用法只把 `.lab-blogger-article` 包**單篇文章 HTML 內容**（不含 header / sidebar / footer）。

### 6.3 不要自行修改 `.lab-*` token，除非確認影響範圍

`--lab-*` 設計為跨平台共用（GitHub Pages 站 + Blogger 站）。修改 token 會同時影響兩站視覺；建議：
- 在 Blogger 端只**覆蓋**（透過更高 specificity 的 inline style 或新規則）特定情境
- 不直接編輯 `:where(.lab-blogger-article, .lab-blogger-components)` 內的 token 宣告
- 若要全域改 token 值，回到 source `src/styles/abstracts/` 修改、重 build

### 6.4 `back-to-top` 是 fixed 元件，不使用就不要放 HTML

`.lab-back-to-top` 採 `position: fixed`，加上 `.is-visible` 會固定在視窗右下角（44×44 圓鈕）。若 Blogger 文章不需要此元件，**HTML 不要放 `.lab-back-to-top` 元素**即可（CSS 規則存在於檔案中但無對應 DOM 不會渲染）。

如要使用：

```html
<button class="lab-back-to-top is-visible" type="button" aria-label="回到頁面上方">↑</button>
```

通常配合 JS 控制 `.is-visible` 顯隱（屬 Phase 6 範圍）；目前沒有對應 JS，預設不會自動出現。

---

## 7. 後續 Phase 3-e 仍未開始

**本文件僅說明 CSS 使用**。CLAUDE.md §6 Phase 3 列出的其他項目尚未實作：

- ⏸ Blogger full / summary / redirect-card 文章 HTML 匯出（`dist-blogger/posts/{slug}/post.html`）
- ⏸ Blogger 首頁 / 目錄 HTML 匯出（`dist-blogger/index/blogger-home.html`）
- ⏸ `copy-helper.txt`（每文章發布輔助）
- ⏸ `meta.json`（每文章 metadata）
- ⏸ `publish-checklist.txt`（每文章發布清單）
- ⏸ `src/scripts/build-blogger.js`（內容輸出 build script，目前為占位）
- ⏸ `src/views/blogger/*.ejs`（8 個 Blogger 模板皆占位）

→ 上述項目將於 Phase 3-e 起另行規劃實作。

See also:
- `docs/publish-bundle.md` §2.5（`posts/` 與 `pages/` 皆適用 publish bundle）
- `docs/publish-json-schema.md` §5.3（Blogger URL 規則，含 post / page 分支）
- `docs/publish-json-schema.md` §5.6（`blogger.type`）
- `docs/book-schema.md` §13（Blogger copy-helper [12] book metadata 區塊；book-review 文章之 Blogger manual posting 輔助已包含書名 / 作者 / 出版社 / 出版年 / ISBN / 雜誌 issue 等欄位之純文字傾印；conditional show；mediaType-aware）
- `docs/book-schema.md` §14（Blogger publish-checklist 已包含 book-review / magazine 內容檢查區塊：copy-helper [12] 對照確認 / `book.coverImage` URL 確認 / mediaType=magazine 期數標示確認；conditional show；mediaType-aware）

---

## 附錄：Build 指令對照

| 指令 | 說明 |
|---|---|
| `npm run build:blogger-theme` | 編譯 Blogger CSS（4 個 .css 檔到 `dist-blogger/theme/`）|
| `npm run build` | 編譯 GitHub Pages 站（含 SCSS、Vite build），與 Blogger 匯出互不影響 |
| `npm run dev` | 本機預覽 GitHub Pages 站（不影響 Blogger 匯出） |

## 附錄：相關 source 對照

| Blogger 輸出檔 | SCSS source |
|---|---|
| `blogger-tokens.css` | `src/styles/blogger/blogger-tokens.scss` + `src/styles/abstracts/_*.scss`（5 個 mixin） |
| `blogger-article.css` | `src/styles/blogger/blogger-article.scss` + `_blogger-article-rules.scss`（partial） |
| `blogger-components.css` | `src/styles/blogger/blogger-components.scss` + `_blogger-components-rules.scss`（鏡射 Phase 2-2 components） |
| `blogger-full-style.css` | `src/styles/blogger/blogger-full-style.scss`（合併 entry，token 一份） |

> ⚠ `_blogger-components-rules.scss` 為 Phase 2-2 components 的鏡射；當 `src/styles/components/*` 異動時，需同步更新此 partial。
