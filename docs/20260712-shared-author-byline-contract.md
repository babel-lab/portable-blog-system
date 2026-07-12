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
| E（invalid type） | `byline.showAuthor: "false"`（string） | 仍顯示 | 仍顯示 | 保留 | 保留 |

Case C 對 GitHub Pages 之 DOM 差異（`post-detail.ejs`）：

- `showAuthor: true / omitted` → `<time>2026-05-15</time> · <span>更新於 2026-05-16</span> · <span>Babel</span>`
- `showAuthor: false` → `<time>2026-05-15</time> · <span>更新於 2026-05-16</span>`
  - 無 updated 時 → 純 `<time>2026-05-15</time>`
- 分隔符 `·` 綁在 author `<span>` 前，故條件塊整段消失時**不留 trailing separator**。

Blogger `blogger-post-full.ejs` / `blogger-post-summary.ejs` 同 DOM 結構（` · ` 綁在條件塊起始）。

Case E 的 renderer 行為：`byline.showAuthor: "false"` 為 string；`=== false` 不成立 → 視為顯示。
`check:byline-contract` guard 於 Layer 2 對此發 `byline-showAuthor-invalid-type` warning
（report-only；不阻擋 build）。

---

## 5. Guard: `check:byline-contract`

- Standalone / report-only / warning-only；**不**接進 `validate:content` / `check:phase1-readiness`
  / `check:release-readiness` umbrella（避免位移 documented baseline 0/135/107）。
- 兩層契約：
  - Layer 1 — renderer decision cases（A–E）in-memory，全 PASS 才 exit 0。
  - Layer 2 — frontmatter schema surface scan，warning-only。
- 掃描範圍：`content/{github,blogger}/{posts,pages}/**/*.md`（排除 `*.fb.md`）。
- baseline @ landing：Layer 1 5/5 PASS；Layer 2 scanned 17 / legacy 17 / withByline 0 / warnings 0。

執行：

```bash
npm run check:byline-contract
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
- `src/scripts/check-byline-contract.js`（兩層契約 guard 實作）
- `docs/20260703-c1-*` / `docs/20260702-phase1-manual-e2e-runbook.md`（Phase 1 relevant baseline）
