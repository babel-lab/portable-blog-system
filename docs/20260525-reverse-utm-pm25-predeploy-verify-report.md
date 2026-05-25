# Reverse UTM pm-25 Pre-Deploy Verify Report

Phase: `20260525-night-5-reverse-utm-pm25-predeploy-verify-a`
Date: 2026-05-25
Scope: docs-only（執行 build 屬於 build output 檢查，不 commit dist；未 deploy / 未 push / 未改 source / 未改 content）

---

## §A. 摘要

本 phase 為 **reverse UTM pm-25 pre-deploy verification**。

目的：

- 在不 deploy、不重貼 Blogger、不改 source / content 的前提下，補做 reverse UTM source-to-dist 對映 verification，補上 pm-24d「byte-identical-modulo-builtAt」之後仍未驗證的 **正向 / 負向 invariant 對應 build output**。
- 確認 reverse UTM 自 pm-24a/b/c source landing 以來，仍維持 source live but dormant；dist-blogger 之注入結果符合 `CLAUDE.md` §16.4 規格之預期（含 fixture 缺席時之預期 0 reverse UTM 命中）。
- 釐清 dist-blogger 內既有之 `utm_source=blogger` 18 個命中為 legacy summary CTA scheme，與 reverse UTM scheme 雖共用 `utm_source=blogger` 但其餘三個 UTM 欄位完全不同，可區分。

本 phase **不**啟動 pm-26（Blogger 後台重貼 + GA4 Realtime 驗收）；亦**不**建立 reverse UTM fixture。

---

## §B. Baseline（pm-25 啟動時刻）

| 檢查 | 結果 |
|---|---|
| `git status --short --branch` | `## main...origin/main`（working tree clean）|
| `git rev-parse HEAD` | `e4feb339d1efc8932a0df2cc84ae3e1fb2ef0f61`（short `e4feb33`）|
| `git rev-parse origin/main` | `e4feb339d1efc8932a0df2cc84ae3e1fb2ef0f61` |
| `git rev-list --left-right --count origin/main...HEAD` | `0	0`（ahead/behind 0/0）|
| `npm run smoke:reverse-utm` | `reverse UTM L1 smoke passed`，exit 0 |

baseline 完全對齊預期：HEAD ≡ origin/main = pm-25 entry point；L1 smoke 通過；無 working tree drift。

---

## §C. 規格錨點與本批驗證範圍

### C.1 規格錨點

| 文件 | 段落 | 用途 |
|---|---|---|
| `CLAUDE.md` | §16.4 Blogger → GitHub Pages（source landed；un-deployed；live but dormant）| reverse UTM 規格主錨；含正向與負向 invariant |
| `docs/blogger-to-github-reverse-utm-plan.md` | §0 / §5 / §10 | reverse UTM 原 plan + step 1-7 落地對照；pm-24a/b/c source landing 記錄 |
| `docs/reverse-utm-fixture-plan.md` | §0-§9 + §10 addendum | fixture 設計 SOP + 5/24 readiness review；pm-26 啟動條件 §6 |
| `docs/20260525-reverse-utm-readiness-snapshot.md` | §3 / §4 | 5/25 readiness snapshot；dormant 維持確認 |
| `docs/20260525-reverse-utm-l1-smoke-completion-report.md` | §D / §E / §F | L1 smoke 覆蓋範圍；明示**未**驗證 production data path |

### C.2 本批驗證範圍

| 範圍 | 是否在本批 |
|---|---|
| baseline 對齊（HEAD / smoke / clean）| ✅ |
| ready posts inventory（content/blogger + content/github）| ✅ |
| 正向 reverse UTM fixture 是否存在 | ✅（read-only 確認）|
| `npm run build:blogger` + `npm run build:github` 執行 | ✅ |
| dist-blogger / .cache reverse UTM grep | ✅ |
| 正向 invariant 驗證（fixture 存在時應注入 reverse UTM）| ❌（fixture 不存在 → 無法驗證）|
| 負向 invariant 驗證（無 GitHub cross-link 之 post 不誤注入）| ✅ |
| legacy summary CTA scheme 與 reverse UTM 區分 | ✅ |
| 既有 forward UTM（GitHub→Blogger）不受影響 | ✅ |
| deploy / push / Blogger 重貼 / GA4 驗收 | ❌（pm-26 範圍） |

---

## §D. Ready Posts / Full-mode / GitHub Cross-link 盤點

### D.1 content/blogger/posts/

| Slug | status | draft | publishTargets.blogger.enabled / mode | publishTargets.github.enabled / mode | dist-blogger export |
|---|---|---|---|---|---|
| `20260504-sample-book-review.md` | draft | true | true / full | （未含）| ❌ filtered（draft:true） |
| `20260515-we-media-myself2.md` | ready | false | true / **full** | true / full | ✅ `dist-blogger/posts/we-media-myself2/post.html` |
| `20260525-draft-book-review.md` | draft | true | true / full | false / full | ❌ filtered（draft:true）|

### D.2 content/github/posts/

| Slug | status | publishTargets.github.enabled / mode | publishTargets.blogger.enabled / mode | dist-blogger export（從 github-cross source） |
|---|---|---|---|---|
| `20260504-github-pages-blog-planning.md` | ready | true / full | true / **summary** | ✅ `dist-blogger/posts/github-pages-blog-planning/post.html`（summary）|
| `20260504-portable-blog-system-mvp.md` | ready | true / full | true / **summary** | ✅ `dist-blogger/posts/portable-blog-system-mvp/post.html`（summary）|

### D.3 reverse UTM 觸發前置盤點

| 維度 | 結果 |
|---|---|
| 全部 ready posts | 3 篇（we-media-myself2 full + github-pages-blog-planning summary + portable-blog-system-mvp summary）|
| **`bloggerMode: 'full'` 之 ready post**（reverse UTM 之唯一 caller `renderFullPost`）| **1 篇**（we-media-myself2）|
| 該 post `relatedLinks` 內含 GitHub Pages cross-link？ | ❌ 否（唯一 relatedLinks 為 Blogger-internal `https://babel-lab.blogspot.com/2026/04/we-media-myself.html`，`kind: internal`）|
| 該 post `otherLinks` 內含 GitHub Pages cross-link？ | ❌ 否（`otherLinks: []`）|
| content/blogger/ 是否存在任何 `babel-lab.github.io` 引用 | ❌ 否（grep 0 命中）|
| **正向 reverse UTM fixture 存在？** | ❌ **不存在** |

→ pm-25 **只能驗 dormant / negative case**，**不能驗 positive injection**。完全對齊 `docs/reverse-utm-fixture-plan.md` §0 / §10 與 `docs/20260525-reverse-utm-readiness-snapshot.md` §3 之記錄。

---

## §E. Build 執行與輸出

### E.1 npm run build:blogger

```
[build-blogger] mode=build
[build-blogger] sources scanned: blogger=5, github-cross=3
[build-blogger]   blogger source: 1 ready / 4 filtered
[build-blogger]   github-cross source: 2 ready / 1 filtered
[build-blogger] total ready: 3 / total filtered: 5
[validate-content] 0 warning(s)
[build-blogger] wrote dist-blogger/posts/we-media-myself2/post.html (full)
[build-blogger] wrote dist-blogger/posts/github-pages-blog-planning/post.html (summary)
[build-blogger] wrote dist-blogger/posts/portable-blog-system-mvp/post.html (summary)
[build-blogger] wrote dist-blogger/index/blogger-home.html
[build-blogger] wrote dist-blogger/index/category-book-review.html
[build-blogger] wrote dist-blogger/index/category-tech-note.html
[build-blogger] wrote dist-blogger/build-manifest.json
[build-blogger] done in 203ms
```

- exit 0；無 warning；total ready = 3
- filtered 詳情：`sample-book-review.md`（draft:true）/ `we-media-myself2.fb.md`（status:draft）/ `draft-book-review.fb.md`（status:draft）/ `draft-book-review.md`（draft:true）/ `github-pages-blog-planning.fb.md`（status:draft）

### E.2 npm run build:github

```
[build-github] admin (dev-mode) rendered: 5 posts
[build-github] mode=dev
[build-github] scanned 8, ready 3, filtered 5
[validate-content] 0 warning(s)
[build-github] wrote .cache/data/posts.json
[build-github] wrote .cache/pages/posts/we-media-myself2/index.html
[build-github] wrote .cache/pages/posts/github-pages-blog-planning/index.html
[build-github] wrote .cache/pages/posts/portable-blog-system-mvp/index.html
... （略，design-system / categories / tags / 404）
[build-github] done in 121ms
```

- exit 0；無 warning；ready 3 對齊
- 注：`build:github` 在 `mode=dev` 寫入 `.cache/pages/`（vite admin pre-render），非 `dist/`；本批以 `.cache/pages/posts/` 為 GitHub forward UTM 驗證 source

### E.3 build output git 狀態確認

`git status --short --branch` 於 build 後 → 仍 `## main...origin/main`（無 working tree 變動）；確認 `dist-blogger/*` / `dist/*` / `.cache/` 皆已 gitignored（`.gitignore` line 2-9）。

---

## §F. Reverse UTM Grep 驗證結果

### F.1 dist-blogger/ UTM key 命中總表

執行命令：`rg --no-ignore -c "<pattern>" dist-blogger/`

注：dist-blogger 屬 gitignored，Grep tool（ripgrep with respect-gitignore）會回 0；本批改用 `rg --no-ignore` via Bash 取真實命中。

| Pattern | 命中數 | 出處 |
|---|---|---|
| `utm_source=blogger` | **10 files / 18 occurrences** | index/blogger-home.html (2) + index/category-tech-note.html (2) + github-pages-blog-planning（post.html 3 / copy-helper.txt 2 / publish-checklist.txt 1 / meta.json 1 = 7）+ portable-blog-system-mvp（post.html 3 / copy-helper.txt 2 / publish-checklist.txt 1 / meta.json 1 = 7）|
| `utm_source=github_pages` | **0** | 無（GitHub 端 forward UTM 不應出現在 dist-blogger）|
| `utm_medium=referral` | **0** | 無（reverse UTM 之 medium；未觸發）|
| `utm_campaign=portable_blog_system` | **0** | 無（reverse UTM 之 campaign；未觸發）|
| `utm_medium=internal_referral` | **10 files / 18 occurrences** | 與 `utm_source=blogger` 完全同分布（legacy summary CTA scheme）|
| `utm_campaign=blogger_to_github` | **10 files / 18 occurrences** | 同上 |
| `utm_content=related_links` 或 `utm_content=other_links` | **0** | 無（reverse UTM 之 content slot；未觸發）|

### F.2 出處解析

**18 個 `utm_source=blogger` 命中之完整身份**：

全部為 **legacy `buildBloggerToGithubUrl` scheme**（用於 Blogger summary 模式之「閱讀完整文章 →」CTA + canonical + JSON-LD `@id` + index 頁面 CTA + helper / checklist / meta.json）：

```
utm_source=blogger
utm_medium=internal_referral
utm_campaign=blogger_to_github
utm_content={slug}
```

範例（取自 `dist-blogger/posts/github-pages-blog-planning/post.html` line 39）：

```html
<a class="lab-button lab-button--primary"
   href="https://babel-lab.github.io/portable-blog-system/posts/github-pages-blog-planning/?utm_source=blogger&amp;utm_medium=internal_referral&amp;utm_campaign=blogger_to_github&amp;utm_content=github-pages-blog-planning"
   rel="noopener noreferrer" target="_blank">
  閱讀完整文章 →
</a>
```

→ 18 個命中**全為 legacy scheme**；**無一**為 reverse UTM。

### F.3 Reverse UTM scheme vs Legacy scheme 區分

| 欄位 | Legacy summary CTA scheme（既有；production live）| Reverse UTM scheme（pm-24a/b/c source；dormant）|
|---|---|---|
| utm_source | `blogger` | `blogger`（**同**）|
| utm_medium | `internal_referral` | `referral`（**不同**）|
| utm_campaign | `blogger_to_github` | `portable_blog_system`（**不同**）|
| utm_content | `{slug}`（per-post）| `related_links` / `other_links`（per-slot）|
| 適用位置 | Blogger summary post 之 canonical / JSON-LD / CTA / index / helper | Blogger full post 之 relatedLinks / otherLinks aside 內 GitHub cross-link |

雖共用 `utm_source=blogger`，但 medium / campaign / content 三欄足以區分；GA4 後台可用 `utm_medium` + `utm_campaign` 任一切片即可分離兩 scheme，無歧義。

per `docs/reverse-utm-fixture-plan.md` §5.1.3 之預期：legacy `utm_medium=internal_referral` 數量應**與 fixture 加入前一致**。本批為 fixture 加入前狀態 → legacy 命中 18 即為 baseline，未來 pm-26 fixture 加入後再次驗證時，預期 legacy 命中**不變**。

### F.4 we-media-myself2 post.html（唯一 ready full-mode post）核心 invariant 確認

| Invariant | 檢查 | 結果 |
|---|---|---|
| 該 post.html 是否含任何 `utm_` | `rg --no-ignore -n "utm_" dist-blogger/posts/we-media-myself2/post.html` | **0 命中** ✅ |
| relatedLinks 內 Blogger-internal cross-link 是否被誤注入 reverse UTM | line 83 `<a class="lab-related-links__link" href="https://babel-lab.blogspot.com/2026/04/we-media-myself.html">` | **無 UTM、無 target、無 rel**（per `CLAUDE.md` §16.5 `kind: internal` 同分頁開啟）✅ |
| canonical URL 是否含 reverse UTM 污染 | line 13 `https://babel-lab.blogspot.com/2026/05/we-media-myself2.html` | **clean**（無 UTM）✅ |
| JSON-LD @id / mainEntityOfPage 是否含 reverse UTM 污染 | line 16 | **clean**（無 UTM）✅ |

→ **核心 invariant 維持**：`bloggerMode: 'full'` ready post 在無 GitHub cross-link 時，post.html 完全無 reverse UTM 注入痕跡。

### F.5 GitHub forward UTM（`.cache/pages/posts/`）健康確認

執行：`rg --no-ignore -c "utm_source=github_pages" .cache/pages/posts/`

```
.cache/pages/posts/we-media-myself2\index.html:1
```

範例（`.cache/pages/posts/we-media-myself2/index.html` line 121）：

```html
<a class="lab-related-links__link"
   href="https://babel-lab.blogspot.com/2026/04/we-media-myself.html?utm_source=github_pages&amp;utm_medium=referral&amp;utm_campaign=portable_blog_system&amp;utm_content=related_links"
   target="_blank" rel="nofollow noopener noreferrer"
   data-ga4-event="click_related_link" ...>
```

執行：`rg --no-ignore -c "utm_source=blogger" .cache/pages/posts/`

```
（無命中）
```

| Invariant | 結果 |
|---|---|
| forward UTM 在 GitHub build output 中維持 | ✅ `utm_source=github_pages&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=related_links` 完整 |
| target / rel 合併維持 | ✅ `target="_blank" rel="nofollow noopener noreferrer"` |
| GA4 data-* attr 維持 | ✅ `data-ga4-event="click_related_link"` 等完整 |
| reverse UTM 是否誤滲入 GitHub build output | ✅ **無**（`utm_source=blogger` 於 `.cache/pages/posts/` 命中 0）|

### F.6 target / rel pattern 確認

執行：`rg --no-ignore -c "target=\"_blank\"" dist-blogger/posts/`

```
dist-blogger/posts/we-media-myself2\copy-helper.txt:1
dist-blogger/posts/we-media-myself2\publish-checklist.txt:1
dist-blogger/posts/github-pages-blog-planning\post.html:1
dist-blogger/posts/portable-blog-system-mvp\post.html:1
```

說明：

- `we-media-myself2/copy-helper.txt` line 117：人類可讀說明文字「external 連結於 HTML render 時會自動加 target="_blank" rel="nofollow noopener"」（非 HTML 標籤；屬 helper 描述）
- `we-media-myself2/publish-checklist.txt` line 46：同樣為說明文字
- `github-pages-blog-planning/post.html` + `portable-blog-system-mvp/post.html`：legacy summary CTA 按鈕之 `target="_blank"` 屬性（已存在於 pm-24 前）

執行：`rg --no-ignore -n "rel=\"nofollow noopener noreferrer\"" dist-blogger/posts/`

```
（無命中）
```

→ reverse UTM 之完整 rel 合併 pattern（`nofollow noopener noreferrer`）於 dist-blogger 完全未出現；對齊未觸發狀態。

### F.7 grep 結果摘要表

| 規格 invariant | 預期 | 實測 | 對齊 |
|---|---|---|---|
| **正向 invariant**：有 GitHub cross-link 之 Blogger ready post，relatedLinks/otherLinks 內 GitHub link 注入 reverse UTM | n/a（無 fixture）| 不可驗證 | ⚠️ 待 pm-26 fixture |
| **負向 invariant**：無 GitHub cross-link 之 Blogger ready post（we-media-myself2）不誤注入 `utm_source=blogger` | 0 命中於該 post.html | 0 | ✅ |
| **negative**：非 GitHub external links 不誤注入 reverse UTM | 0 | 0 | ✅ |
| **negative**：Blogger-internal relatedLinks 不注入 UTM、不加 target/rel | clean | clean（`kind: internal` 正確處理） | ✅ |
| **Strategy A**：既有 utm 不覆蓋 | n/a（無 fixture）| 不可驗證 | ⚠️ 待 pm-26 fixture |
| **legacy summary CTA scheme** 維持 `utm_medium=internal_referral` + `utm_campaign=blogger_to_github` + `utm_content={slug}` | 不被誤改 | 18 命中皆為 legacy scheme；無一為 reverse | ✅ |
| **legacy / reverse UTM 區分**：reverse UTM 應使用 `utm_medium=referral` / `utm_campaign=portable_blog_system`，不可使用 legacy 值 | 兩 scheme 區分 | reverse 命中 0；legacy 命中 18；兩者互不混 | ✅ |
| **forward UTM（GitHub→Blogger）不受影響** | 仍注入 `utm_source=github_pages` | 1 命中（we-media-myself2 relatedLinks 至 Blogger）| ✅ |
| **reverse UTM 滲入 GitHub build output** | 不應發生 | 0 命中於 `.cache/pages/posts/` | ✅ |

---

## §G. Reverse UTM 規格符合 / 不符合判定

### G.1 規格符合（per `CLAUDE.md` §16.4）

| 規格 | 狀態 |
|---|---|
| reverse UTM source 已 push origin/main（pm-24a/b/c）| ✅ |
| pm-24d build verification（無 GitHub cross-link 之 ready post 無新 UTM 注入；既有 3 ready posts post.html byte-identical-modulo-builtAt）| ✅ 仍有效 |
| Blogger 同站內部連結 不加 UTM | ✅（we-media-myself2 relatedLinks Blogger-internal link 無 UTM）|
| 第三方非 GitHub external links 不加 reverse UTM | ✅（dist-blogger 內無 reverse UTM 命中）|
| Blogger summary / redirect-card / home-index / category-index 模式 不串接 reverse UTM | ✅（reverse UTM 之唯一 caller `renderFullPost`；summary mode 未受影響）|
| `buildBloggerToGithubUrl` / canonical / JSON-LD / summary CTA / redirect CTA / index CTA 不變 | ✅（18 個 legacy scheme 命中為既有；reverse UTM scheme 0 命中）|

### G.2 規格無法驗證（待 fixture）

| 規格 | 原因 |
|---|---|
| `bloggerMode: 'full'` 之 ready post，relatedLinks/otherLinks 內 GitHub cross-link → 注入 `utm_source=blogger&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=related_links\|other_links` | ❌ **無 fixture 觸發**：唯一 ready full-mode post（we-media-myself2）之 relatedLinks 不含 GitHub Pages cross-link；otherLinks 為空 |
| `target="_blank"` 強制套用於 GitHub cross-link | ❌ 同上 |
| `rel="nofollow noopener noreferrer"` 合併套用於 GitHub cross-link | ❌ 同上 |
| Strategy A（已含 UTM 之 url 不覆蓋）| ❌ 同上 |

→ 待 `docs/reverse-utm-fixture-plan.md` §6 啟動條件全部滿足後，方能於 pm-26 fixture 階段做正向 invariant 驗證。

### G.3 規格不符 / 偏差

| 項目 | 狀態 |
|---|---|
| 任何規格偏差 | ❌ **無偏差** |
| 任何意外 production state drift | ❌ **無 drift** |
| 任何 reverse UTM 滲入錯誤位置 | ❌ **無滲入** |

---

## §H. Dormant / Live 狀態判斷

### H.1 結論

✅ **完全符合「source landed；un-deployed；live but dormant」**，per `CLAUDE.md` §16.4 之 reverse direction 段落。

### H.2 與 5/25 am-7 readiness snapshot 對照

| 維度 | 5/25 am-7（readiness-snapshot）| 5/25 night-5（pm-25 verify；本批）| drift |
|---|---|---|---|
| reverse UTM source landed | ✅ pm-24a/b/c | ✅ unchanged | 0 |
| 唯一 ready full-mode Blogger post | `we-media-myself2` | `we-media-myself2`（無新候選；新增之 `20260525-draft-book-review.md` 為 draft）| 0 |
| 該 post 含 GitHub cross-link？ | ❌ | ❌（grep 確認）| 0 |
| dist-blogger 含 reverse UTM？ | ❌ 0 命中 | ❌ 0 命中（`utm_medium=referral` + `utm_campaign=portable_blog_system`）| 0 |
| Blogger 後台重貼 | ❌ | ❌ | 0 |
| GA4 reverse UTM Realtime 驗收 | ❌ | ❌ | 0 |
| live 狀態 | 🟡 dormant | 🟡 **dormant 維持** | 0 |

### H.3 結論

**5/25 am-7 → 5/25 night-5（pm-25 verify）reverse UTM production state drift = 0**。

所有 reverse UTM readiness 維度自 am-7 readiness snapshot 至今未漂移；pm-25 build verification 進一步 dist-output 層級確認 negative invariant 無破壞，比 am-7 之 grep-only 更扎實。

---

## §I. 是否可進 pm-26？

### I.1 結論

❌ **不可進 pm-26**（per `docs/reverse-utm-fixture-plan.md` §6 啟動條件）。

### I.2 fixture-plan §6 啟動條件對照

| # | 條件 | 滿足？ | 說明 |
|---|---|---|---|
| 1 | 已存在至少 1 篇符合 §3 / §4 之 fixture post | ❌ **未滿足** | 唯一 ready full-mode post（we-media-myself2）之 relatedLinks 不含 GitHub cross-link；otherLinks 為空；無新自然 fixture 候選 |
| 2 | fixture post 之 frontmatter 已通過 `npm run validate:content`，0 warning | ⚠️ n/a（無 fixture）| build:blogger / build:github 內含 validate-content step 通過（既有 ready posts 0 warning）|
| 3 | `npm run build:blogger` 成功 + §5.1.1 ~ §5.1.4 全部驗證通過 | ⚠️ **部分通過** | build:blogger 成功（§E.1）；§5.1.2-5.1.4（negative + summary CTA + forward UTM 不影響）✅ 通過；但 §5.1.1（正向 reverse UTM 注入）無 fixture 觸發 → 不可驗證 |
| 4 | user 已**明確同意**手動重貼 Blogger 後台 | ❌ **未啟動** | 待 fixture 落地後 user 自決 |
| 5 | 若 fixture post 為新建非已發布文章，已決定**驗收後是否保留為正式發布文章** | ⚠️ n/a（無 fixture）| 同上 |
| 6 | GA4 Realtime / Acquisition 已準備就緒 | ⚠️ unverified | 本批未操作 GA4 後台 |

⛔ 條件 1 未滿足 → pm-26 啟動條件**全部不成立**；應繼續維持 dormant。

### I.3 對齊 fixture-plan §10.4 主軌策略

- 🟢 **主軌（推薦）**：等待下一篇自然書評 / 心得文章自然引用 GitHub 站既有技術文章；無時間壓力 / 無驗收 deadline
- 🟢 **副軌 A**：user 自決時機，新寫 Blogger + GitHub 雙站管理心得文章
- 🔴 **不建議**：硬改既有 ready / published 文章作為 fixture（per fixture-plan §2 之 4 個 invariant 衝突）

---

## §J. 風險與下一步建議

### J.1 風險判斷

| # | 風險面向 | 等級 | 說明 |
|---|---|---|---|
| 1 | reverse UTM 規格與實際 build output 不一致 | 🟢 **無** | dist-blogger 0 個 reverse UTM 命中；source / build / spec 對齊 |
| 2 | legacy summary CTA scheme 與 reverse UTM 混淆 | 🟢 **無** | 兩 scheme 之 medium/campaign/content 完全不同；GA4 可區分 |
| 3 | forward UTM（GitHub→Blogger）受 reverse UTM 影響 | 🟢 **無** | `.cache/pages/posts/we-media-myself2/index.html` 仍正確注入 `utm_source=github_pages`；無 `utm_source=blogger` 滲入 |
| 4 | we-media-myself2 之 relatedLinks Blogger-internal link 之 `kind: internal` 處理偏差 | 🟢 **無** | line 83 之 anchor 無 target / 無 rel；對齊 `CLAUDE.md` §16.5「kind: internal → 不加 nofollow；同分頁開啟」|
| 5 | pm-25 verify 之 build artifact（dist-blogger / `.cache`）誤入 git | 🟢 **無** | `.gitignore` line 2-9 完整覆蓋 `dist/*`、`dist-blogger/*`、`.cache/`；`git status` 於 build 後仍 `## main...origin/main` |
| 6 | 因 fixture 缺而 pm-25 無法驗正向 invariant | 🟡 **低（已知 expected gap）** | 屬 fixture-plan §10.2 deadlock；無時間壓力；pm-26 啟動條件明定 §6 |
| 7 | docs / source / dist drift 之意外發生 | 🟢 **無** | smoke pass + build pass + grep 全對齊預期 |

### J.2 整體風險評估

🟢 **低 + expected dormant**：屬穩定狀態；無 production 異常；無 docs / source / dist drift。

### J.3 下一步建議

1. **本機驗證 baseline 維持完整**：reverse UTM 自 pm-24a/b/c source landing 以來，已通過 L1 smoke（pm-25 之前）+ build output 層 negative invariant（本批）兩層驗證；繼續維持 dormant，無 production 風險。

2. **不啟動 pm-26**：fixture-plan §6 啟動條件不成立（條件 1 未滿足 / 條件 3 部分通過 / 條件 4 未啟動）。

3. **未來啟動 fixture 之觸發路徑**：
   - 🟢 主軌：等自然書評 / 心得文章
   - 🟢 副軌 A：user 自決時機，寫雙站管理心得文章
   - 任一觸發後依 `docs/reverse-utm-fixture-plan.md` §10.5 Phase 1-6 順序執行

4. **本 report commit 範圍建議**：
   - ✅ 建議 commit 本檔 `docs/20260525-reverse-utm-pm25-predeploy-verify-report.md`（docs-only；無 source / content / dist 改動）
   - ❌ 不 commit 任何 dist 變動（dist-blogger / `.cache/` 全 gitignored）

5. **後續 cold-start regression check**：
   - 任何 cold-start session 或要動 `src/scripts/ga4-url-builder.js` / `src/scripts/build-blogger.js` 前，先 `npm run smoke:reverse-utm` 確認 source-level 行為 baseline
   - 若需 dist-output 層 regression check，跑本批之 `npm run build:blogger` + 對 dist-blogger 之 grep（per §F.1 + §F.5）對齊預期；無需另開 phase

---

## §K. 邊界宣告（本 phase 落地保證）

| 項目 | 狀態 |
|---|---|
| 新增 `docs/20260525-reverse-utm-pm25-predeploy-verify-report.md`（本檔） | ✅ 唯一應 commit 內容 |
| 修改 `src/` | ❌ 無 |
| 修改 `content/`（任何 `.md` / `.publish.json` / `.fb.md`）| ❌ 無 |
| 修改 `content/settings/` | ❌ 無 |
| 修改 `package.json` | ❌ 無 |
| 修改 `.claude/` | ❌ 無 |
| 修改 `CLAUDE.md` | ❌ 無 |
| 修改其他 docs（含 reverse-utm-fixture-plan.md / blogger-to-github-reverse-utm-plan.md / readiness-snapshot.md / L1-smoke-completion-report.md）| ❌ 無 |
| 執行 `npm run smoke:reverse-utm` | ✅（baseline pass；exit 0）|
| 執行 `npm run build:blogger` | ✅（dist-blogger 為 gitignored；無 commit）|
| 執行 `npm run build:github` | ✅（`.cache/` 為 gitignored；無 commit）|
| 寫入 `dist/` / `dist-blogger/` / `.cache/` | ✅ build output；皆 gitignored；不 commit |
| git commit | ❌ 本批不 commit；待 user 確認 |
| git push | ❌ 無 |
| 操作 Blogger 後台 | ❌ 無 |
| 操作 GA4 後台 | ❌ 無 |
| Deploy gh-pages | ❌ 無 |
| 啟動 pm-26 / fixture 建立 / Blogger 重貼 / GA4 Realtime 驗收 | ❌ 無 |

本 report 落地後**不**改變任何 production state；屬純 verification snapshot。

---

## §L. Cross-links

### L.1 Reverse UTM 三層 canonical 詳本

- `CLAUDE.md` §16.4（Blogger ↔ GitHub cross-site UTM 規則；reverse 方向 source landed but dormant）
- `docs/blogger-to-github-reverse-utm-plan.md`（reverse UTM 原 plan §1-§12 + §0 status update）
- `docs/reverse-utm-fixture-plan.md`（fixture 設計 SOP §0-§9 + §10 readiness addendum）

### L.2 5/25 reverse UTM 日內 docs trail

- `docs/20260525-reverse-utm-readiness-snapshot.md`（am-8；本日 readiness 狀態紀錄）
- `docs/20260525-reverse-utm-code-smoke-plan.md`（night-4 之前；L1 smoke plan）
- `docs/20260525-reverse-utm-l1-smoke-completion-report.md`（night-4；L1 smoke completion；commit `e4feb33`）
- 本檔（night-5；pm-25 pre-deploy verify report；待 commit）

### L.3 上層 SOP

- `docs/20260524-blogger-repost-checklist.md`（Phase 4 Blogger 後台重貼 SOP）
- `docs/20260524-ga4-reverse-utm-observation.md`（Phase 5 GA4 reverse UTM 觀察 SOP）
- `docs/20260524-blogger-github-publishing-runbook.md`（operator entry runbook）

### L.4 規格錨點

- `docs/click-tracking-governance.md` §4 row 3 / §10 順序 5（reverse UTM 規格）
- `docs/ga4-link-tracking-spec.md` §3.5（Blogger to GitHub UTM；source landed；dormant）
- `docs/ga4-parameter-naming-registry.md` §4.2（reverse UTM 命名規格）
- `docs/blogger-listener-strategy.md` §5.1（短期推薦方案 D — reverse UTM；listener 短期不做）

---

（本文件結束）
