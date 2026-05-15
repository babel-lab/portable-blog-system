# Phase 9-h Known Blockers

本文件封存 **Phase 9-h-full-build-verify-a** 發現之 3 個未處理 blockers，作為後續修正批次之依據。屬**快照型分析**；**不**代表 blocker 已啟動修復批次；**不**修改任何 source / settings / content。

對應之上層紀錄：
- `docs/phase-1-completion-checklist.md`（Phase 1 完成 checklist；本批 blockers 屬其 §10 / §11 之延伸發現）
- `docs/phase-1-completion-report.md`（Phase 1 completion candidate；本批 blockers 之後續修復影響 final report 升級時機）
- `docs/phase-8h-pre-analysis.md`（Phase 8-h legacy 退場分析；mirror 之 pre-analysis 命名模式）

---

## §1 當前穩定狀態

| 項目 | 值 |
|---|---|
| **HEAD** | `7be40a7 fix(blogger): use Blogger publishedUrl as canonical when primaryPlatform=blogger` |
| **working tree** | clean |
| **validate baseline** | `0 error / 22 warning / 17 warning-posts`（per validate-content.js byPath.size 定義；17 為「有 warning/error 之 post 數」非「總載入 post 數」；新 migration post 載入且 clean，**不**列入此 17 計數）|
| **第 1 篇 migration post commit** | `8332d82 feat(content): migrate blogger article we-media-myself2`（3 檔；170 insertions）|
| **已解除 blocker commits** | `7212ccd fix(blogger): repair copy-helper EJS scriptlet for book metadata block`（per §6.A）+ `eced408 fix(settings): replace site.config.json placeholder URLs` + `7be40a7 fix(blogger): use Blogger publishedUrl as canonical when primaryPlatform=blogger`（per §6.B；Blocker #2 完全解除）|

---

## §2 已通過項目摘要

### 2.1 Build / validate 命令

| 命令 | 結果 |
|---|---|
| `npm run build` | ✅ 成功（vite ✓ built in 828ms；含 prebuild = build-github + vite build） |
| `npm run build:blogger` | ✅ 成功（73ms；含 Phase 9-h-fix-copy-helper-bug-b 修正後正常處理含 book block 之 ready post） |
| `npm run validate:content` | ✅ 維持 `0/22/17` baseline |

### 2.2 dist-blogger 完整輸出

`dist-blogger/posts/we-media-myself2/` **4 檔齊備**：

- `post.html`
- `meta.json`
- `copy-helper.txt`
- `publish-checklist.txt`

### 2.3 Blogger `post.html` block signatures 驗證

| Block signature | 預期 | 實際 | 結果 |
|---|---|---|---|
| `lab-related-links` | exists（≥1） | 6 | ✅ |
| `lab-hashtags` | exists（≥1） | 1 | ✅ |
| `Comic 01` ~ `Comic 05` | exists（5） | 5 | ✅ |
| `lab-book-photo` | absent（0） | 0 | ✅ as expected dormant |
| `lab-affiliate-box` | absent（0） | 0 | ✅ as expected dormant |
| `lab-download-box` | absent（0） | 0 | ✅ as expected dormant |

### 2.4 copy-helper.txt 區塊驗證

- ✅ `[12] 書籍 / 內容來源 metadata` 正確輸出（媒體類型 / 書名 / 作者 / 出版社 4 欄位）
- ✅ `[13] 相關連結 / 其他連結` 正確輸出（含 relatedLinks 系列 #1 internal cross-link）

### 2.5 publish-checklist.txt 區塊驗證

- ✅ 書評內容檢查區塊存在
- ✅ 相關連結 / 其他連結內容檢查區塊存在（含 `hasInternalLink` nested checkbox）

---

## §3 Known Blocker 1：GitHub cross-source dist 未產出

### 3.1 現象

`dist/posts/we-media-myself2/index.html` **不存在**。

### 3.2 build 結果

`npm run build` 之 vite 輸出僅包含：

- `dist/posts/github-pages-blog-planning/index.html`（來源：`content/github/posts/20260504-github-pages-blog-planning.md`）
- `dist/posts/portable-blog-system-mvp/index.html`（來源：`content/github/posts/20260504-portable-blog-system-mvp.md`）

`dist/posts/` 只包含 `content/github/posts/` 來源之文章；**不**含 `content/blogger/posts/we-media-myself2.md`（即使其 `publishTargets.github.enabled: true`）。

### 3.3 推測根因

`build-github.js`（vite build 之 prebuild）似乎只掃描 `content/github/posts/`，**未**掃描 `content/blogger/posts/` 中 `publishTargets.github.enabled: true` 的文章。

與 `build-blogger.js` 之雙路徑設計**不對稱**：

- `build-blogger.js` 掃描 `blogger source（content/blogger/posts/）+ github-cross source（content/github/posts/）`；per `[build-blogger] sources scanned: blogger=3, github-cross=2`
- `build-github.js` 似乎**只**掃描 `content/github/posts/`

意即 `publishTargets.github.enabled` 對於 `content/blogger/posts/` 來源之文章**為 dead metadata**（cross-build 邏輯為單向）。

### 3.4 影響

- ❌ Blogger → GitHub cross-build 邏輯**未生效**
- ❌ 跨平台 article block parity **無法驗證**（per Phase 9-h 達成之 100% conditional article blocks parity 設計理想）
- ❌ GitHub Pages 站之文章列表 / 卡片頁無此 migration post

### 3.5 後續候選批次

- **Phase 9-h-fix-build-github-cross-source**

### 3.6 優先級

**Medium-High**

---

## §4 Known Blocker 2：canonical.resolved 指向 example.com / GitHub path ✅ COMPLETED

**狀態**：✅ **完全解除**（resolved on 2026-05-15）
**修復 commits**：
- `eced408 fix(settings): replace site.config.json placeholder URLs`（Phase 9-i-b1；根因 1）
- `7be40a7 fix(blogger): use Blogger publishedUrl as canonical when primaryPlatform=blogger`（Phase 9-i-b2；根因 2）

詳細修復紀錄見 §6.B（已解除 blockers）。本節以下保留原問題分析；§4.3 / §4.4 根因標 ✅ 已修；§4.7 優先級已過期，僅作歷史紀錄。

### 4.1 現象

`dist-blogger/posts/we-media-myself2/meta.json` 之 `canonical.resolved` 為：

```
https://example.com/posts/we-media-myself2/?utm_source=blogger&utm_medium=internal_referral&utm_campaign=blogger_to_github&utm_content=we-media-myself2
```

### 4.2 期望

當 `primaryPlatform: blogger` + `canonical: "auto"` + `.publish.json` 之 `blogger.publishedUrl` 已知時，canonical.resolved 應指向：

```
https://babel-lab.blogspot.com/2026/05/we-media-myself2.html
```

### 4.3 已確認根因 1：site.config.json placeholder ✅ 已修（commit `eced408`）

`content/settings/site.config.json` 中 `githubSiteUrl` / `bloggerSiteUrl` 仍是 `https://example.com` placeholder：

```json
{
  "siteName": "Portable Blog System",
  "author": "Dean",
  "language": "zh-Hant",
  "githubSiteUrl": "https://example.com",
  "bloggerSiteUrl": "https://example.com",
  ...
}
```

→ 計算之 canonical URL 之 host 為 `example.com`。

### 4.4 推測根因 2：build-blogger.js canonical resolver 邏輯不正確 ✅ 已修（commit `7be40a7`）

`build-blogger.js` 之 canonical resolver **未優先使用** `.publish.json` 之 `blogger.publishedUrl`，而 fallback 至 `buildBloggerToGithubUrl()` 之 cross-platform 邏輯（per build-blogger.js line 96-104 之既有設計）。

即使 site URLs 為正確值，canonical 仍會錯誤指向 GitHub 路徑（`/posts/{slug}/`）+ UTM（`blogger_to_github`），而非 Blogger 路徑（`/yyyy/mm/{slug}.html`）。

### 4.5 影響

- ❌ SEO canonical 錯誤；可能導致 search engine 對重複內容處理失準
- ❌ 文章 cross-platform 之 canonical 指向錯誤站台
- ❌ Phase 5 SEO 強化（meta-tags / OG / Twitter card）受影響

### 4.6 後續候選批次

- **Phase 9-h-fix-canonical-resolver**（修 build-blogger.js canonical 邏輯）
- **Phase 9-h-fix-site-config-urls**（修 site.config.json placeholder）

可合併為單批或分開；兩者皆需處理才能完整解決。

### 4.7 優先級（歷史；已過期）

~~**High**~~ → ✅ **completed on 2026-05-15**

---

## §5 Known Blocker 3：build:promotion sidecar attach 未生效

### 5.1 現象

`dist-promotion/facebook/blogger/we-media-myself2.txt` **不存在**；`dist-promotion/facebook/blogger/` 目錄本身不存在。

### 5.2 build:promotion 結果

```
[build-promotion] total enabled: 1 / total filtered: 4
[build-promotion]   filtered: content/blogger/posts/20260515-we-media-myself2.fb.md (status:draft)
[build-promotion]   filtered: content/blogger/posts/20260515-we-media-myself2.md (no-promotion-block)
```

兩個項目均被過濾：

- `20260515-we-media-myself2.fb.md` 被當作獨立 post 載入；無 `status` 欄位 → 預設 `draft` → 過濾
- `20260515-we-media-myself2.md` 被判定 `no-promotion-block`（.md frontmatter 無 `promotion.facebook.*` block；per Phase 8-a 設計用 `.fb.md` sidecar）

### 5.3 推測根因

`build-promotion.js` / `load-posts.js` **未正確**將 `.fb.md` sidecar attach 到主 `.md` post：

- `load-posts.js` 之 `**/*.md` glob 同時命中 `.md` + `.fb.md`
- 兩者被當作獨立 post 載入；沒有 attach 邏輯將 `.fb.md` 視為 `.md` 之 sidecar 資料
- build-promotion.js 之過濾邏輯獨立看待 `.md`（無 promotion block）與 `.fb.md`（無 status）→ 雙重過濾

### 5.4 影響

- ❌ `.fb.md` sidecar 模式目前**無法產出 FB promotion txt**
- ❌ Phase 8-a 之 sidecar bundle 三檔設計於 promotion 流程**未完整生效**
- ❌ 本 migration post 之 FB 推廣手動流程**缺失對應 dist 輸出**

### 5.5 後續候選批次

- **Phase 9-h-fix-build-promotion-sidecar**

### 5.6 優先級

**Medium**

---

## §6 已解除 blockers

本節記錄**已解除之 blockers**（共 2 條）：

- **§6.A**：blogger-copy-helper.ejs book metadata EJS scriptlet bug（commit `7212ccd`）
- **§6.B**：Blocker #2 canonical.resolved → example.com / GitHub path（commits `eced408` + `7be40a7`；於 2026-05-15 完全解除）

---

### §6.A blogger-copy-helper.ejs book metadata EJS scriptlet bug

#### 6.1 原錯誤

```
ReferenceError: lines is not defined
  at eval ("src/views/blogger/blogger-copy-helper.ejs":185)
```

#### 6.2 原因

`src/views/blogger/blogger-copy-helper.ejs` line 127 之 EJS scriptlet 過早關閉：

- `<% if (post.book && ...) { -%>` 中之 `-%>` 在 line 127 末尾關閉 scriptlet
- Lines 128-179 之 JS 程式碼（`const book` / `const lines` / `lines.push(...)` 等）被視為 raw template text
- Line 185 `<%= lines.join('\n') %>` 嘗試 access `lines` 變數 → `ReferenceError`

#### 6.3 為何之前未發現

該分支觸發條件為 `post.book` 為 plain object（即 `contentKind: book-review` + 含 `book` block）。Phase 9-f-c-b 之前無 ready post 含 `book` block；該程式分支從未執行。本 migration post 為**第一篇** ready book-review post 觸發此程式碼。

#### 6.4 修正

- **commit**：`7212ccd fix(blogger): repair copy-helper EJS scriptlet for book metadata block`
- **修改**：1 檔 1 行（`src/views/blogger/blogger-copy-helper.ejs` line 127：移除 `-%>` 中之 `-` 與 `>`，改為 `{` 不關閉 scriptlet；讓 scriptlet 延伸至 line 180 `%>` 才關閉）

#### 6.5 修正後狀態

✅ `build:blogger` 對含 `book` block 之 ready post **已成功**；`copy-helper.txt` 之 `[12]` book metadata 區塊**正確輸出**（per §2.4）。

---

### §6.B canonical.resolved → example.com / GitHub path（Blocker #2）

#### 6.6 原問題

`dist-blogger/posts/we-media-myself2/meta.json` 之 `canonical.resolved` 為 `https://example.com/posts/we-media-myself2/?utm_source=blogger&utm_medium=internal_referral&utm_campaign=blogger_to_github&utm_content=we-media-myself2`，**未**指向 Blogger publishedUrl `https://babel-lab.blogspot.com/2026/05/we-media-myself2.html`。

詳見 §4（原 Blocker #2 描述）。

#### 6.7 兩個根因

| 根因 | 影響 | 修復批次 |
|---|---|---|
| **根因 1**：`content/settings/site.config.json` 之 `githubSiteUrl` / `bloggerSiteUrl` 為 `https://example.com` placeholder | host 全為 example.com（影響所有 dist 之 JSON-LD / canonical / OG URL） | **Phase 9-i-b1**（commit `eced408`）|
| **根因 2**：`src/scripts/build-blogger.js` 之 `resolveCanonicalUrl()` **永遠** cross-link 至 GitHub URL + 加 `blogger_to_github` UTM；未優先使用 `post.publish?.blogger?.publishedUrl` | path 為 `/posts/{slug}/` 含 UTM（非 Blogger publishedUrl 之 `/yyyy/mm/{slug}.html`）| **Phase 9-i-b2**（commit `7be40a7`）|

#### 6.8 修復摘要

- **`eced408` fix(settings): replace site.config.json placeholder URLs**
  - `githubSiteUrl`: `https://example.com` → `https://babel-lab.github.io`
  - `bloggerSiteUrl`: `https://example.com` → `https://babel-lab.blogspot.com`
  - diff +2 / -2；commit message scope `(settings)`

- **`7be40a7` fix(blogger): use Blogger publishedUrl as canonical when primaryPlatform=blogger**
  - `src/scripts/build-blogger.js` `resolveCanonicalUrl()` 新增 fall-through 條件分支：
    - 若 `post.primaryPlatform === 'blogger'`
    - 且 `canonical` 為 `"auto"` 或缺漏
    - 且 `post.publish?.blogger?.publishedUrl` 為非空字串
    - → 直接 `return { url: bloggerPublishedUrl, warning: null }`（不 cross-link、不加 UTM）
  - 既有邏輯（手動 canonical URL / 缺 publishedUrl fallback）完全保留
  - 取值路徑：`post.publish?.blogger?.publishedUrl`（sidecar attach；per `load-posts.js:105-106`；**不是** legacy `post.blogger?.publishedUrl`）
  - diff +13 / -0；commit message scope `(blogger)`

#### 6.9 驗證摘要

| 維度 | 結果 |
|---|---|
| **validate baseline** | ✅ `0 error / 22 warning / 17 post(s)`（維持；無 regression） |
| **example.com 全域殘留** | ✅ **0 命中**（dist / dist-blogger / dist-promotion / dist-reports 皆 0） |
| **we-media-myself2 BlogPosting JSON-LD `@id`** | ✅ `https://babel-lab.blogspot.com/2026/05/we-media-myself2.html` |
| **we-media-myself2 BlogPosting JSON-LD `mainEntityOfPage`** | ✅ 同上 |
| **we-media-myself2 canonical link** | ✅ 同上 |
| **blogger_to_github UTM** | ✅ **完全移除** |
| **GitHub 端 WebSite + BlogPosting JSON-LD** | ✅ host 為 `https://babel-lab.github.io/`（無 regression） |
| **既有無 publishedUrl 之 post** | ✅ 行為不變（既有 cross-link 邏輯保留） |

#### 6.10 修正後狀態

✅ Blocker #2 之兩個根因**完全解除**。

- 修復日期：**2026-05-15**
- 修復 commits：`eced408` + `7be40a7`
- Phase 1 之 SEO canonical 正確性已達生產可驗證狀態（可送 Google Rich Results Test）

---

## §7 建議後續處理順序

| 順序 | 批次 | 範圍 | 優先級 |
|---|---|---|---|
| ~~**1**~~ | ~~**Phase 9-h-fix-canonical-resolver + Phase 9-h-fix-site-config-urls**~~ | ~~修 build-blogger.js canonical 邏輯 + 修 site.config.json placeholder URLs~~ | ✅ **completed**（Phase 9-i-b1 + 9-i-b2；commits `eced408` + `7be40a7`） |
| **2**（→ 改為 1）| **Phase 9-h-fix-build-promotion-sidecar** | 修 build-promotion.js / load-posts.js 之 .fb.md sidecar attach 邏輯 | 🟠 Medium |
| **3**（→ 改為 2）| **Phase 9-h-fix-build-github-cross-source** | 修 build-github.js 使其掃描 `content/blogger/posts/` 中 `publishTargets.github.enabled: true` 之文章 | 🟠 Medium-High |
| **4**（→ 改為 3）| **視需要再更新 `docs/phase-1-completion-report.md` / `docs/phase-1-completion-checklist.md`** | 同步 known blockers 之修復狀態 + 視情況升級 completion report 為正式 final | — |

**保守原則**：每批次獨立 commit；不混合多 blocker 修正於同一 commit。

---

## §8 Scope 明確排除

本文件**只封存** blocker，**不**：

- ❌ 不修正 source（src/）
- ❌ 不修正 settings（content/settings/）
- ❌ 不修正 content（content/blogger/posts/ 等）
- ❌ 不修正 dist
- ❌ 不執行 build
- ❌ 不執行 validate
- ❌ 不 commit 本文件（依本批次限制）

各 blocker 之實際修復**屬另開之獨立批次**（per §7 建議順序）。

---

## §9 Cross-links

- `docs/phase-1-completion-checklist.md`（Phase 1 完成 checklist；§10 真實作者試寫流程）
- `docs/phase-1-completion-report.md`（Phase 1 completion candidate report）
- `docs/phase-8h-pre-analysis.md`（Phase 8-h legacy 退場分析；mirror 之 pre-analysis 命名模式）
- `docs/phase-9g-completion-report.md`（Phase 9-g relatedLinks / otherLinks schema 系列收尾）
- `docs/phase-9h-completion-report.md`（Phase 9-h GitHub article block parity 系列收尾；本批 blockers 為其後 full build 驗證才暴露）
- `docs/phase-9f-c-completion-report.md`（Phase 9-f-c book metadata output 系列收尾；含本批 §6 之 EJS bug 引入點）
- `docs/related-links-schema.md`（relatedLinks / otherLinks schema）
- `docs/book-schema.md`（book / source metadata schema）
- `docs/publish-bundle.md`（sidecar bundle 三檔結構；本批 §5 涉及之 sidecar attach 機制）
- `docs/publish-json-schema.md`（`.publish.json` schema；本批 §4 涉及之 publishedUrl）

---

（本文件結束）
