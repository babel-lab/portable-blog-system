# Shared author / visual byline contract（2026-07-12 landed）

> Focused slice：讓 Blogger 與 GitHub Pages 共用同一份 `author`，並讓一般文章的視覺署名可依文章
> 選擇顯示 / 隱藏。實作範圍為 renderer + template default + report-only guard，**不**動任何既有
> 已發布文章、**不** deploy、**不** 觸碰 Blogger 後台。

Frozen source baseline（實作起點）：`origin/main` = `53cc20d1215ace553bd846e86e4e942690b4e96a`
（subject `docs(blogger): record b1 manual preview result`）。

---

## 1. Author 與 Publisher 的差別

| 概念 | 值 | 用途 |
| --- | --- | --- |
| **Author** | `Babel` | 內容創作者。跨平台不變。落在 `.md` frontmatter `author` 欄位、`meta.json.author`、JSON-LD `author.name`。 |
| **Publisher / site brand** | `Babel's Lab` | 網站品牌名。用於 JSON-LD `publisher`、`<meta name="author">`（`settings.site.author`）、Blogger `siteName` 等站台層識別。 |
| **Technical slug** | `babel-lab` | GitHub / 網域 / repo naming。純技術識別。 |

三者互不推導。本 slice **不**把 `Babel's Lab` 當作文章 `author` 預設值。

---

## 2. 契約條文

### 2.1 Blogger 與 GitHub Pages 共用同一份作者值

- `author` 為 `.md` frontmatter 之字串欄位，跨平台共用。
- ❌ 不新增 `bloggerAuthor` / `githubAuthor`。
- ❌ 不新增 `showOnBlogger` / `showOnGithub`。
- ✅ Blogger 主題未額外顯示 Google 帳號作者名，因此無「雙 byline」風險 → 無平台專屬 override 需求。

### 2.2 `author` 維持字串

- `author` 為 non-empty string；不改成 object。
- 若未來要擴充 avatar / bio / social profile，屬另一 phase，不在本 slice 範圍。

### 2.3 `byline.showAuthor` 語意

```yaml
author: "Babel"

byline:
  showAuthor: true    # 或 false
```

- `byline.showAuthor` 只控制**視覺 article byline** 是否顯示作者姓名。
- `showAuthor: false` **不**清空 `meta.json.author`、**不**清空 JSON-LD `author`、**不**清空 `<meta name="author">`。
- Blogger 與 GitHub Pages 依同一份 `byline.showAuthor` 決定視覺渲染。

#### 型別契約（hard validation；validate:content 會拒絕）

`byline` 為 optional。若出現：

- `byline` **必須**為 plain object；非 object（string / number / array / null）→ `byline-invalid-type` ERROR。
- `byline.showAuthor` 為 optional；若出現則**必須**為 YAML boolean（`true` / `false`）。
- **不**做 truthy / falsy coercion —— 字串 `"true"` / `"false"`、數值、`null`、YAML 空值皆為 invalid。

合法：

```yaml
byline:
  showAuthor: true
```

```yaml
byline:
  showAuthor: false
```

```yaml
# byline omitted 也合法（backward-compat：視覺 byline 顯示）
```

不合法（`validate:content` exit 1，錯誤類型 `byline-show-author-invalid-type`）：

```yaml
byline:
  showAuthor: "false"    # string
```

```yaml
byline:
  showAuthor: 0          # number
```

```yaml
byline:
  showAuthor: null       # explicit null
```

```yaml
byline:
  showAuthor:            # YAML empty value → parse 為 null
```

不合法（`validate:content` exit 1，錯誤類型 `byline-invalid-type`）：

```yaml
byline: "true"           # byline 本身非 object
```

```yaml
byline:                  # byline 為 YAML empty 值 → null
```

錯誤訊息形如：

```text
[ERROR] byline-show-author-invalid-type  content/foo/bar.md: string "false"
[ERROR] byline-invalid-type              content/foo/bar.md: string
```

### 2.4 Backward-compatible default

- `byline` 缺 → 視覺 byline 顯示（`showAuthor` 邏輯上等於 `true`）。
- ❌ **不**批次替所有既有文章補 `byline:\n  showAuthor: true`。
- ❌ **不**批次把既有 `author: Dean` 改成 `Babel`。
- ✅ `we-media-myself2` 是測試文章，維持 `author: "Dean"`。

### 2.5 Renderer 判斷式（canonical form）

三支 EJS 皆採同一式：

```ejs
<% if (post.author && !(post.byline && post.byline.showAuthor === false)) { %>
```

規則：

1. `post.author` 必為 truthy 才進入 byline 分支。
2. `byline.showAuthor === false` 是 **strict boolean false** 才隱藏；其他值（`undefined` / `true` / string / null / …）一律顯示。
3. 因此 string `"false"` **不**被靜默轉成 `false`（Case E）。

### 2.6 新文章 template 預設

以下五個入口一律預設 `author: "Babel"` + `byline.showAuthor: true`：

- `src/scripts/new-post.js`
- `src/scripts/admin-markdown-export.js`（Admin dashboard 之 markdown export）
- `src/views/admin/index.ejs`（客戶端 mirror）
- `content/templates/post-template.md`
- `content/templates/github-tech-note-template.md`
- `content/templates/blogger-book-review-template.md`
- `content/templates/blogger-magazine-review-template.md`
- `content/templates/blogger-download-template.md`
- `content/templates/blogger-summary-template.md`

### 2.7 外部投稿

作者姓名直接寫進 `author` 即可：

```yaml
author: "投稿者姓名"

byline:
  showAuthor: true
```

Renderer **不**回退到 `Babel`；validate-content.js 之 `author` 語意維持。

### 2.8 非文章頁面

Landing / campaign / download 等頁面若共用同一 article renderer，行為由 renderer 決定：

- 這些頁面本來就渲染 `<article class="lab-article">` header，byline block 一律依契約走。
- 若不需要顯示作者，作者自行寫 `byline: { showAuthor: false }`。
- 本 slice **不**額外新增 page-type-based auto-hide。

---

## 3. Metadata 保留（顯示 vs. 內容分離）

無論 `byline.showAuthor` 為何：

| Output | 欄位 | 值來源 |
| --- | --- | --- |
| Blogger `meta.json` | `author` | `post.author ?? null`（frontmatter） |
| Blogger post JSON-LD | `author.name` | `post.author \|\| settings.site.author` |
| GitHub Pages JSON-LD | `author.name` | `post.author \|\| settings.site.author` |
| `<meta name="author">` | content | `settings.site.author`（站台層 publisher；不受本 slice 影響） |

`showAuthor: false` 只縮小視覺 DOM，不縮小 SEO / metadata。

---

## 4. Case matrix

| Case | frontmatter | GitHub visible | Blogger visible | meta.json.author | JSON-LD author |
| ---- | ----------- | -------------- | --------------- | ---------------- | -------------- |
| A（legacy 相容） | `author: Dean`（無 byline） | Dean | Dean | Dean | Dean |
| B（新文章預設） | `author: Babel` + `byline.showAuthor: true` | Babel | Babel | Babel | Babel |
| C（隱藏視覺） | `author: Babel` + `byline.showAuthor: false` | hidden | hidden | Babel | Babel |
| D（外部投稿） | `author: 投稿者` + `byline.showAuthor: true` | 投稿者 | 投稿者 | 投稿者 | 投稿者 |
| E（invalid type，validator hard-fail） | `byline.showAuthor: "false"`（string） | validate:content ERROR | validate:content ERROR | — | — |
| F（invalid null，validator hard-fail） | `byline.showAuthor: null`（或 YAML 空值） | validate:content ERROR | validate:content ERROR | — | — |

Case C 對 GitHub Pages 之 DOM 差異（`post-detail.ejs`）：

- `showAuthor: true / omitted` → `<time>2026-05-15</time> · <span>更新於 2026-05-16</span> · <span>Babel</span>`
- `showAuthor: false` → `<time>2026-05-15</time> · <span>更新於 2026-05-16</span>`
  - 無 updated 時 → 純 `<time>2026-05-15</time>`
- 分隔符 `·` 綁在 author `<span>` 前，故條件塊整段消失時**不留 trailing separator**。

Blogger `blogger-post-full.ejs` / `blogger-post-summary.ejs` 同 DOM 結構（` · ` 綁在條件塊起始）。

Case E / F 的雙層防護：
- **`validate:content`**（新 ERROR 規則 `byline-show-author-invalid-type`）hard-fail，exit 1；
  非 boolean 值**不能進**任何 build / render 路徑。
- **Renderer**（`=== false` strict）作為第二層防禦：即便 validator 被繞過，字串 `"false"` 也
  **不會**被靜默轉成 `false` 而誤隱藏作者。
- **`check:byline-contract`** Layer 2 對 production content 掃描報告；Layer 3 in-memory 跑
  `validateContent()` 直接證明 Cases D/E/F/G 觸發 ERROR。

---

## 5. Guard: `check:byline-contract`

- Standalone；**不**接進 `check:phase1-readiness` / `check:release-readiness` umbrella
  （避免無關 baseline 位移）。**invalid byline 本身由 `validate:content` 之 ERROR 規則
  hard-fail**；本 guard 是「三層契約 rehearsal」。
- 三層契約：
  - **Layer 1** — renderer decision cases（A–E）in-memory，鎖 EJS `=== false` 語意；
    全 PASS 才 exit 0。
  - **Layer 2** — frontmatter schema surface scan，warning-only 報告（掃 production
    content；現況 0 production byline → 0 warning，作為未來新內容加入時之報告器）。
  - **Layer 3** — validator hard-fail proof；import `validateContent()` 跑 synthetic
    minimal posts 證明 non-boolean `byline.showAuthor` 與 non-object `byline` 皆升為
    ERROR，且 boolean / omitted 通過。全 PASS 才 exit 0。
- 掃描範圍（Layer 2）：`content/{github,blogger}/{posts,pages}/**/*.md`（排除 `*.fb.md`）。
- baseline @ boolean-hardening landing：
  - Layer 1 5/5 PASS
  - Layer 2 scanned 17 / legacy 17 / withByline 0 / warnings 0
  - Layer 3 10/10 PASS（Cases A–J；Cases H/I/J 分別鎖 `byline === null` /
    `Array.isArray(byline)` / `typeof byline !== 'object'` 三條 validator 分支；
    Cases D/F/G/H/I 另鎖 error `value` 字串格式契約 —— 分別覆蓋
    `string "…"` / `null`（showAuthor 分支）/ bare `typeof` / `null`（byline 分支）/ `array`
    五種格式輸出，per §2.3 錯誤訊息範例）

執行：

```bash
npm run check:byline-contract
npm run validate:content    # 亦會對真正 content 之非 boolean byline 直接 exit 1
```

---

## 6. Non-goals（本 slice 未做 / 未來另 phase）

- ❌ 批次改寫既有文章 `author`（Dean → Babel）。
- ❌ 新增作者個人頁 / avatar / bio / social profile。
- ❌ 平台專屬 `bloggerAuthor` / `githubAuthor`。
- ❌ 修改 Blogger 後台文章、rebuild 已發布 Blogger post、deploy GitHub Pages、push gh-pages。
- ❌ 大改 JSON-LD 架構（僅 renderer 加條件式；`author` 欄位語意不變）。
- ❌ B2 draft-aware preview build。
- ❌ 修改 Blogger theme slider（外部殘留，非本系統範圍）。
- ❌ 接入 `validate:content` / `phase1-readiness` / `release-readiness`（獨立 phase 才考慮）。

---

## 7. See also

- CLAUDE.md §Red lines（Blogger / GitHub 共用作者值；不新增平台專屬 override）
- `src/views/pages/post-detail.ejs` line 34-39（GitHub Pages byline 判斷式）
- `src/views/blogger/blogger-post-full.ejs` line 57-60（Blogger full byline 判斷式）
- `src/views/blogger/blogger-post-summary.ejs` line 32-35（Blogger summary byline 判斷式）
- `src/scripts/check-byline-contract.js`（三層契約 guard 實作；Layer 3 直接 invoke validator）
- `src/scripts/validate-content.js`（新 ERROR 規則 `byline-invalid-type` / `byline-show-author-invalid-type`，
  於 `validateContent()` 主 loop 內；status-agnostic；boolean-hardening 落點於 2026-07-12）
- `docs/20260703-c1-*` / `docs/20260702-phase1-manual-e2e-runbook.md`（Phase 1 relevant baseline）
