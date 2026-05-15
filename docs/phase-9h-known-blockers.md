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
| **HEAD** | `7986d58 fix(github): cross-build blogger posts with publishTargets.github.enabled` |
| **working tree** | clean |
| **validate baseline** | `0 error / 22 warning / 17 warning-posts`（per validate-content.js byPath.size 定義；17 為「有 warning/error 之 post 數」非「總載入 post 數」；新 migration post 載入且 clean，**不**列入此 17 計數）|
| **第 1 篇 migration post commit** | `8332d82 feat(content): migrate blogger article we-media-myself2`（3 檔；170 insertions）|
| **已解除 blocker commits** | `7212ccd fix(blogger): repair copy-helper EJS scriptlet for book metadata block`（per §6.A）+ `eced408 fix(settings): replace site.config.json placeholder URLs` + `7be40a7 fix(blogger): use Blogger publishedUrl as canonical when primaryPlatform=blogger`（per §6.B；Blocker #2 完全解除）+ `31ae053 fix(promotion): use .fb.md sidecar as facebook source when present`（per §6.C；Blocker #3 完全解除）+ `7986d58 fix(github): cross-build blogger posts with publishTargets.github.enabled`（per §6.D；Blocker #1 完全解除；**Phase 9-h known blockers 3/3 completed**）|

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

## §3 Known Blocker 1：GitHub cross-source dist 未產出 ✅ COMPLETED

**狀態**：✅ **完全解除**（resolved on 2026-05-15）
**修復 commit**：`7986d58 fix(github): cross-build blogger posts with publishTargets.github.enabled`（Phase 9-i-f-b）

詳細修復紀錄見 §6.D（已解除 blockers）。本節以下保留原問題分析；§3.3 推測根因標 ✅ 已修；§3.5 / §3.6 之後續候選批次與優先級已過期，僅作歷史紀錄。

### 3.1 現象

`dist/posts/we-media-myself2/index.html` **不存在**。

### 3.2 build 結果

`npm run build` 之 vite 輸出僅包含：

- `dist/posts/github-pages-blog-planning/index.html`（來源：`content/github/posts/20260504-github-pages-blog-planning.md`）
- `dist/posts/portable-blog-system-mvp/index.html`（來源：`content/github/posts/20260504-portable-blog-system-mvp.md`）

`dist/posts/` 只包含 `content/github/posts/` 來源之文章；**不**含 `content/blogger/posts/we-media-myself2.md`（即使其 `publishTargets.github.enabled: true`）。

### 3.3 推測根因 ✅ 已修（commit `7986d58`）

`build-github.js`（vite build 之 prebuild）似乎只掃描 `content/github/posts/`，**未**掃描 `content/blogger/posts/` 中 `publishTargets.github.enabled: true` 的文章。

與 `build-blogger.js` 之雙路徑設計**不對稱**：

- `build-blogger.js` 掃描 `blogger source（content/blogger/posts/）+ github-cross source（content/github/posts/）`；per `[build-blogger] sources scanned: blogger=3, github-cross=2`
- `build-github.js` 似乎**只**掃描 `content/github/posts/`

意即 `publishTargets.github.enabled` 對於 `content/blogger/posts/` 來源之文章**為 dead metadata**（cross-build 邏輯為單向）。

### 3.4 影響

- ❌ Blogger → GitHub cross-build 邏輯**未生效**
- ❌ 跨平台 article block parity **無法驗證**（per Phase 9-h 達成之 100% conditional article blocks parity 設計理想）
- ❌ GitHub Pages 站之文章列表 / 卡片頁無此 migration post

### 3.5 後續候選批次（歷史；已過期）

- ~~**Phase 9-h-fix-build-github-cross-source**~~ → ✅ **landed as Phase 9-i-f-b**（commit `7986d58`）

### 3.6 優先級（歷史；已過期）

~~**Medium-High**~~ → ✅ **completed on 2026-05-15**

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

## §5 Known Blocker 3：build:promotion sidecar attach 未生效 ✅ COMPLETED

**狀態**：✅ **完全解除**（resolved on 2026-05-15）
**修復 commit**：`31ae053 fix(promotion): use .fb.md sidecar as facebook source when present`（Phase 9-i-d-b）

詳細修復紀錄見 §6.C（已解除 blockers）。本節以下保留原問題分析；§5.3 推測根因標 ✅ 已修；§5.5 / §5.6 之後續候選批次與優先級已過期，僅作歷史紀錄。

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

### 5.3 推測根因 ✅ 已修（commit `31ae053`）

⚠️ Phase 9-i-d-a 純讀取分析後**修正**之根因：實際 root cause **非** load-posts.js / buildManifestEntry 之 sidecar attach 邏輯（兩者皆已正確運作），而是 `build-promotion.js` 之 `classifyFacebook()` **只讀 legacy `post.promotion?.facebook?.enabled`**，**未讀** `post.sidecars?.facebook?.data?.enabled`。詳見 §6.C。

以下原推測根因保留為歷史紀錄：

`build-promotion.js` / `load-posts.js` **未正確**將 `.fb.md` sidecar attach 到主 `.md` post：

- `load-posts.js` 之 `**/*.md` glob 同時命中 `.md` + `.fb.md`
- 兩者被當作獨立 post 載入；沒有 attach 邏輯將 `.fb.md` 視為 `.md` 之 sidecar 資料
- build-promotion.js 之過濾邏輯獨立看待 `.md`（無 promotion block）與 `.fb.md`（無 status）→ 雙重過濾

### 5.4 影響

- ❌ `.fb.md` sidecar 模式目前**無法產出 FB promotion txt**
- ❌ Phase 8-a 之 sidecar bundle 三檔設計於 promotion 流程**未完整生效**
- ❌ 本 migration post 之 FB 推廣手動流程**缺失對應 dist 輸出**

### 5.5 後續候選批次（歷史；已過期）

- ~~**Phase 9-h-fix-build-promotion-sidecar**~~ → ✅ **landed as Phase 9-i-d-b**（commit `31ae053`）

### 5.6 優先級（歷史；已過期）

~~**Medium**~~ → ✅ **completed on 2026-05-15**

---

## §6 已解除 blockers

本節記錄**已解除之 blockers**（共 4 條；含 1 個 pre-existing EJS bug + 3 個 Phase 9-h known blockers）：

- **§6.A**：blogger-copy-helper.ejs book metadata EJS scriptlet bug（commit `7212ccd`）
- **§6.B**：Blocker #2 canonical.resolved → example.com / GitHub path（commits `eced408` + `7be40a7`；於 2026-05-15 完全解除）
- **§6.C**：Blocker #3 build:promotion sidecar attach 未生效（commit `31ae053`；於 2026-05-15 完全解除）
- **§6.D**：Blocker #1 GitHub cross-source dist 未產出（commit `7986d58`；於 2026-05-15 完全解除；**Phase 9-h known blockers 3/3 completed**）

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

### §6.C build:promotion sidecar attach 未生效（Blocker #3）

#### 6.11 原問題

`dist-promotion/facebook/blogger/we-media-myself2.txt` **不存在**；`build:promotion` log 顯示 we-media-myself2 之 `.md` 被 filter 為 `no-promotion-block` + 其 `.fb.md` 被 filter 為 `status:draft`（雙重過濾）。

詳見 §5（原 Blocker #3 描述）。

#### 6.12 真實根因（Phase 9-i-d-a 純讀取分析修正）

⚠️ **Phase 9-i-d-a 純讀取分析確認原 §5.3 推測根因不準確**：

- ✅ `load-posts.js` （line 74-77, 93-99）**已正確** attach `.fb.md` 至 `post.sidecars.facebook`
- ✅ `build-promotion.js` `buildManifestEntry()`（line 228-264）**已有** sidecar 處理邏輯（Phase 8-c-4 既有）
- ❌ **真正問題**：`build-promotion.js` `classifyFacebook()`（line 129-146）**只讀** legacy `post.promotion?.facebook?.enabled` 路徑，**未讀** `post.sidecars?.facebook?.data?.enabled` 路徑

結果：we-media-myself2 之 `.md` frontmatter 無 `promotion` block（per Phase 8-a sidecar 設計），`post.promotion` 為 undefined → `classifyFacebook` 直接 return `no-promotion-block` → filter；無機會走 buildManifestEntry 之 sidecar resolution。

`.fb.md` 被當獨立 post 載入並 filter 為 `status:draft` 屬**並行存在之 harmless 副作用**（`**/*.md` glob 命中 `.fb.md`），不阻擋主修復。

#### 6.13 修復摘要

- **`31ae053` fix(promotion): use .fb.md sidecar as facebook source when present**
  - `src/scripts/build-promotion.js` `classifyFacebook()` 重構為 sidecar-first fallback chain：
    - 先讀 `post.sidecars?.facebook`；條件：`exists === true` + `data` 為 plain object（非 null / 非 array）→ `sidecarData`
    - 再讀 legacy `post.promotion?.facebook`；若為 plain object → `legacyFb`
    - `fb = sidecarData || legacyFb`
    - 若 `fb` 為 null → `no-promotion-block`；否則沿用既有 `enabled` / `page` / `pages-config` 檢查
  - 既有 return 格式 `{ include, reason, page, fb }` 保留不變
  - 既有 page / pages-enabled 過濾邏輯完全未動
  - 既有無 sidecar 之 post 走 legacyFb fallback（行為完全保留）
  - 缺欄位防 crash：`typeof / Array.isArray / !fb` 之 short-circuit
  - diff +18 / -6；commit message scope `(promotion)`

#### 6.14 驗證摘要

| 維度 | 結果 |
|---|---|
| **validate baseline** | ✅ `0 error / 22 warning / 17 post(s)`（維持；無 regression） |
| **we-media-myself2 promotion txt 產出** | ✅ `dist-promotion/facebook/blogger/we-media-myself2.txt`（647 bytes；新產出） |
| **all-posts-index.txt 含 we-media-myself2** | ✅（3 grep 命中） |
| **build-manifest.json 含 we-media-myself2** | ✅（9 grep 命中） |
| **github-pages-blog-planning promotion** | ✅ 仍正常產出（472 bytes；無 regression） |
| **`total enabled` 數** | ✅ 從 1 → **2**（多 we-media-myself2） |
| **dist-promotion example.com 殘留** | ✅ **0 命中** |
| **.fb.md 被當獨立 promotion txt 輸出** | ✅ **無**（仍 filter 為 `status:draft`；不會進入 enabledEntries） |
| **既有無 sidecar 之 promotion 行為** | ✅ legacyFb fallback chain 保留 |

#### 6.15 修正後狀態

✅ Blocker #3 之根因**完全解除**。

- 修復日期：**2026-05-15**
- 修復 commit：`31ae053`
- `.fb.md` sidecar 模式之 FB promotion 流程已生產可用
- Phase 8-a 之 sidecar bundle 三檔設計於 promotion 流程**完整生效**

---

### §6.D GitHub cross-source dist 未產出（Blocker #1）

#### 6.16 原問題

`dist/posts/we-media-myself2/index.html` **不存在**；`build-github.js`（vite build 之 prebuild）只掃描 `content/github/posts/`，**未**掃描 `content/blogger/posts/` 中 `publishTargets.github.enabled: true` 之 cross-source 文章；publishTargets.github.enabled 對 blogger 來源文章為 **dead metadata**。

詳見 §3（原 Blocker #1 描述）。

#### 6.17 兩個根因（per Phase 9-i-f-a 純讀取分析）

| 根因 | 影響 | 修復細節 |
|---|---|---|
| **根因 1**：`build-github.js:256` 僅呼叫 `loadPosts({ site: 'github', settings })`；**完全沒讀** `content/blogger/posts/`；architecture asymmetry vs build-blogger.js 之 cross-source 設計 | blogger source 文章（即使含 `publishTargets.github.enabled: true`）不會進入 GitHub dist 產出 | 新增 `src/scripts/load-github-posts.js`（mirror load-blogger-posts.js）+ build-github.js swap loadPosts → loadGithubPosts |
| **根因 2**：`buildCanonicalUrl()` post-detail 分支未考慮 cross-source post（primaryPlatform=blogger 但於 GitHub dist 之 mirror page）之 canonical 策略；應指向 Blogger publishedUrl 而非 GitHub URL | mirror page 之 canonical / JSON-LD 指向錯誤站台；duplicate content 風險 | build-github.js `buildCanonicalUrl()` post-detail 分支加 cross-source 分支（mirror Phase 9-i-b2 對稱實作）|

#### 6.18 修復摘要

- **`7986d58` fix(github): cross-build blogger posts with publishTargets.github.enabled**
  - **新增** `src/scripts/load-github-posts.js`（99 行）：
    - mirror `load-blogger-posts.js` 結構（方向相反）
    - 兩 loadPosts call：`site: 'github'`（primary）+ `site: 'blogger'`（cross）
    - cross-source filter：`p.publishTargets?.github?.enabled === true` → `sourceSite: 'blogger-cross'`
    - slug 衝突偵測 + warnings + filteredOut 整合 + 排序
    - 不加 `githubMode`（per Phase 9-i-a §6.2 確認 `publishTargets.github.mode` 為 dead metadata）
  - **修改** `src/scripts/build-github.js`（+13 / -2；3 處 edit）：
    - line 8 import swap：`loadPosts` → `loadGithubPosts`
    - line 264-266 main flow swap：`loadPosts({ site: 'github' })` → `loadGithubPosts({ settings })`
    - line 129-138 `buildCanonicalUrl()` post-detail 分支：加 cross-source canonical 分支（`post.primaryPlatform === 'blogger'` + `post.publish?.blogger?.publishedUrl` 存在 → return Blogger publishedUrl；對稱 Phase 9-i-b2 之 build-blogger.js 修正）
  - 既有原生 GitHub posts 行為**完全保留**（fallback chain）
  - 既有 GitHub posts 之 canonical 仍指向 `https://babel-lab.github.io/posts/{slug}/`
  - 對 Blogger build / Promotion build **無影響**（commit 範圍嚴格限於 build-github.js + load-github-posts.js）

#### 6.19 驗證摘要

| 維度 | 結果 |
|---|---|
| **validate baseline** | ✅ `0 error / 22 warning / 17 post(s)`（維持；無 regression）|
| **`dist/posts/we-media-myself2/index.html` 產出** | ✅ 11,035 bytes |
| **GitHub mirror page canonical** | ✅ `https://babel-lab.blogspot.com/2026/05/we-media-myself2.html` |
| **GitHub mirror page JSON-LD `@id` / `mainEntityOfPage`** | ✅ 同 canonical |
| **GitHub mirror page `og:url`** | ✅ 同 canonical |
| **GitHub mirror page article content** | ✅ 含 文章標題 + relatedLinks / otherLinks aside + hashtags + 5 張 Comic 圖；book photo / affiliate / download 正確 dormant |
| **dist/index.html / categories / tags 含 we-media-myself2** | ✅（home: 1 / categories/book-review: 1 / tags/book-review + reading-notes + self-growth: 各 1）|
| **既有 GitHub posts canonical** | ✅ 仍指向 `https://babel-lab.github.io/posts/{slug}/`（無 regression）|
| **Blogger / Promotion regression** | ✅ 無 regression（per Phase 9-i-f-verify §G）|
| **example.com 全域殘留** | ✅ **0 命中**（dist / dist-blogger / dist-promotion / dist-reports 皆 0）|

#### 6.20 修正後狀態

✅ Blocker #1 之兩個根因**完全解除**。

- 修復日期：**2026-05-15**
- 修復 commit：`7986d58`
- GitHub Pages 站之 cross-source mirror page 流程已生產可用
- Phase 1 之**跨平台 article block parity 100%** 達成（Blogger + GitHub 兩端皆可產出對應 post detail page）
- Phase 9-h 之 conditional article blocks 設計理想於 cross-source 場景**完整生效**

🎉 **Phase 9-h known blockers 3/3 全部完成驗證並 commit**：
- ✅ Blocker #1（GitHub cross-source；commit `7986d58`）
- ✅ Blocker #2（canonical → example.com；commits `eced408` + `7be40a7`）
- ✅ Blocker #3（promotion sidecar attach；commit `31ae053`）

---

## §7 建議後續處理順序

| 順序 | 批次 | 範圍 | 優先級 |
|---|---|---|---|
| ~~**1**~~ | ~~**Phase 9-h-fix-canonical-resolver + Phase 9-h-fix-site-config-urls**~~ | ~~修 build-blogger.js canonical 邏輯 + 修 site.config.json placeholder URLs~~ | ✅ **completed**（Phase 9-i-b1 + 9-i-b2；commits `eced408` + `7be40a7`） |
| ~~**2**~~ | ~~**Phase 9-h-fix-build-promotion-sidecar**~~ | ~~修 build-promotion.js / load-posts.js 之 .fb.md sidecar attach 邏輯~~ | ✅ **completed**（Phase 9-i-d-b；commit `31ae053`；實際根因為 `classifyFacebook()` 未讀 sidecar；無需動 load-posts.js）|
| ~~**3**~~ | ~~**Phase 9-h-fix-build-github-cross-source**~~ | ~~修 build-github.js 使其掃描 `content/blogger/posts/` 中 `publishTargets.github.enabled: true` 之文章~~ | ✅ **completed**（Phase 9-i-f-b；commit `7986d58`；新增 `load-github-posts.js` mirror 既有 cross-source 模式；含 GitHub mirror page canonical 對稱修正）|
| **4**（→ 改為 1）| **視需要再更新 `docs/phase-1-completion-report.md` / `docs/phase-1-completion-checklist.md`** | 同步 known blockers 之修復狀態 + 視情況升級 completion report 為正式 final | — |

---

### §7.1 Phase 9-h known blockers 完整收尾

🎉 **Phase 9-h known blockers 3/3 全部解除**（2026-05-15）：

| Blocker | 修復 commits | docs 標記 commits | 狀態 |
|---|---|---|---|
| #1 GitHub cross-source dist 未產出 | `7986d58` | （本批 Phase 9-i-g）| ✅ completed |
| #2 canonical → example.com / GitHub path | `eced408` + `7be40a7` | `4514de6` | ✅ completed |
| #3 build:promotion sidecar attach | `31ae053` | `ee52544` | ✅ completed |

**remaining open blockers**：**0**（無 open blocker）

**後續候選**：

- **Phase 9-z / Phase 1 final report sync**：考慮升級 `docs/phase-1-completion-report.md` 為正式 final（移除 "candidate" 標註）；前提是 §10 真實作者試寫流程已完成（per phase-1 completion-checklist.md）
- **Phase 8-h legacy 退場系列**：per `docs/phase-8h-pre-analysis.md`；trigger condition 已滿足（per Phase 9-z-c §11 順序 3：「final report 已封存後啟動 8-h 退場」）
- **Phase 9-g-g JSON-LD `mentions` / `isPartOf`**：deferred；觸發條件「真實 ready post 可做 Google Rich Results Test」**已滿足**（per 本 session 之 we-media-myself2 + Phase 9-i-b 之 canonical 修正）
- **Phase 9-f-g Book / Periodical structured data**：deferred；同上觸發條件已滿足
- **idle freeze**：本 session 已達 7+ commits；可作收尾

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
