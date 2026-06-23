# SP-4 — `includeInListings` inventory + impact preflight（docs-only）

> Phase：`sp4-include-in-listings-inventory-preflight-docs-only-a`（2026-06-23）
> Baseline：`main @ 1056704`（HEAD == origin/main，ahead/behind 0/0，working tree clean）
> 前身：
> - `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1，架構 preanalysis）
> - `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2，schema lock + warning-only validator + fixtures）
> - `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3，GitHub post-detail robots precedence）

本文件為 **docs-only inventory / impact analysis**，落地 preanalysis §6.4 之 **SP-4 前置盤點**。
**不**實作 `includeInListings` 任何消費行為；**不**改 source / EJS / build script / validator / Admin / content /
settings / sitemap / robots / dist / gh-pages / `.cache`；**不**執行 build / deploy / preview / repost / dev server；
**不**碰 Blogger / AdSense / GA4 / Search Console / Drive 後台。

目的：在實作 `includeInListings` **之前**先盤點，避免未來把既有 download / 特殊頁**意外**從
listing / category / tag / archive / related 等站內列表面移除。

> **🔵 Inventory acceptance + binding decision（Dean，2026-06-23）**：
> - `portable-blog-system-mvp`（github, ready）為**唯一 visible download post**。
> - SP-4 初期**必須維持 output-preserving**；未來引入 `includeInListings` 時，這篇應**明確標記 / 視為 `includeInListings: true`**，
>   繼續出現在 home / post-list / category / tag / prev-next，**保持目前行為**。
> - **sitemap 維持目前排除狀態**，不因 listing 保留而改變（兩維度正交）。
> - **不接受**在 SP-4 初期讓 legacy `contentKind: download` 自動離開 lists。
> - 未來若要移除 legacy download，**須另開 content migration / policy phase**，先確認 live impact。

---

## A. Phase name

`sp4-include-in-listings-inventory-preflight-docs-only-a`

---

## B. Baseline observed

| 項目 | 值 |
|---|---|
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `1056704` |
| origin/main | `1056704` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `feat(github): derive robots from page type metadata` |

baseline 與本 phase 預期完全一致。

**`check-validation-report.js` baseline 驗證（required step 4）**：line 37 已為
`BASELINE = { errorCount: 0, warningCount: 104, issuePostCount: 94 }`；該檔最後一次由
commit `4c2d93d`（`chore(validation): sync page type fixture baseline`）更新 → **已同步、非 stale**，
本 phase **未修改**（符合 spec：僅在 stale 時才需處理，且須先問）。

---

## C. Files changed

- **新增 1 個 docs 檔**：`docs/20260623-sp4-include-in-listings-inventory-preflight.md`（本檔）。
- 無任何 source / content / settings / package / lockfile / dist / gh-pages / `.cache` / 生成 HTML 變動。

---

## D. Content inventory summary

### D.1 全量計數

| 範圍 | 數量 | 備註 |
|---|---|---|
| production / current 文章（`.md`） | **12** | github 2 + blogger 10；`.fb.md` 為 FB sidecar，不計入 |
| 其中 ready/published（VISIBLE_STATUS 通過、會進列表） | **9** | github 2 + blogger 7 |
| 其中 draft（被 `classify()` 過濾） | **3** | sample-book-review / draft-book-review / phonics-…-download |
| `content/shared/**/*.md` | 0 | 無 |
| `content/{github,blogger}/pages/**/*.md` | 0 | 無 page collection 內容 |
| validation fixtures（`content/validation-fixtures/**/*.md`） | 116 | **非真實 post，不計入** |
| 其中 `_test-page-*.md`（SP-2 新增） | 13 | **非真實 post，不計入**（10 觸發 warning + 3 valid） |

> ⚠️ fixtures 與 `_test-page-*` 僅被 `validate-content` main entry 掃描，**不**被 `build:github` /
> `build:blogger` / `build:promotion` loader（路徑 `content/{site}/posts`）讀到 → 不影響任何 listing / sitemap。

### D.2 production 12 篇逐篇（含 SP-4 相關欄位）

| # | 檔案 | site | `contentKind` | status | draft | 列表可見? |
|---|---|---|---|---|---|---|
| 1 | `github/posts/20260504-github-pages-blog-planning.md` | github | tech-note | ready | false | ✅ |
| 2 | `github/posts/20260504-portable-blog-system-mvp.md` | github | **download** | ready | false | **✅（唯一 visible download）** |
| 3 | `blogger/posts/20260504-sample-book-review.md` | blogger | book-review | draft | true | ❌（draft） |
| 4 | `blogger/posts/20260515-we-media-myself2.md` | blogger | book-review | ready | false | ✅ |
| 5 | `blogger/posts/20260525-draft-book-review.md` | blogger | book-review | draft | true | ❌（draft） |
| 6 | `blogger/posts/20260529-phonics-practice-sheet-download.md` | blogger | **download** | draft | true | ❌（draft；已被過濾） |
| 7 | `blogger/posts/20260612-after-work-writing-time-blocking.md` | blogger | life-note | ready | false | ✅ |
| 8 | `blogger/posts/20260612-ai-tools-simplify-daily-workflow.md` | blogger | life-note | ready | false | ✅ |
| 9 | `blogger/posts/20260612-blog-as-personal-knowledge-base.md` | blogger | life-note | ready | false | ✅ |
| 10 | `blogger/posts/20260612-blog-restart-steady-rhythm-notes.md` | blogger | life-note | ready | false | ✅ |
| 11 | `blogger/posts/20260612-daily-reading-habit-notes.md` | blogger | life-note | ready | false | ✅ |
| 12 | `blogger/posts/20260612-reading-notes-three-questions.md` | blogger | life-note | ready | false | ✅ |

### D.3 SP-2 新欄位之 production 使用情況（grep 全量掃描）

| 欄位 | production posts 命中 | 結論 |
|---|---|---|
| `contentKind: download` | **2**（#2 ready、#6 draft） | 見 §G 風險 |
| `pageType` | 0 | 無任一 production post 使用 |
| `includeInListings` | 0 | 無 |
| `includeInSitemap` | 0 | 無 |
| `includeInFeeds` | 0 | 無 |
| `relatedDownload` | 0 | 無（repo 內全域 0 命中，含 fixtures） |
| `platformPolicy` | 0 | 無 |
| `gatedDownload` | 0 | 無 |

> 結論：**除了 2 篇 legacy `contentKind: download`，沒有任何 production post 使用 SP-2/SP-4 新維度。**
> 唯一會被「download 自動隱藏列表」影響的 **visible** 頁是 **#2 `portable-blog-system-mvp`（github, ready）**；
> #6 phonics 為 draft，本來就不在列表。

---

## E. Listing behavior findings（read-only 來源盤點）

### E.1 各列表面之控制點與過濾規則

| 列表面 | 檔案 / 函式 | 目前過濾規則 |
|---|---|---|
| **shared loader** | `src/scripts/load-posts.js` `classify()`（L23–28） | **唯一過濾**：`draft === true` → exclude；`status ∉ {ready, published}`（`VISIBLE_STATUS`）→ exclude。**無 contentKind / pageType / includeInListings 維度。** |
| github 聚合 | `src/scripts/load-github-posts.js` | 在 `classify()` 之上：blogger 來源額外需 `publishTargets.github.enabled === true`；github native 全納入 |
| blogger 聚合 | `src/scripts/load-blogger-posts.js` | 在 `classify()` 之上：github 來源額外需 `publishTargets.blogger.enabled === true`；blogger native 全納入；解析 `bloggerMode` |
| **github 首頁 / home** | `build-github.js` L586–595 → `pages/home.ejs` | `posts: githubPosts.posts`（**全量** ready 清單；render 端可截切顯示，資料無 contentKind 過濾） |
| **github post-list（＝archive）** | `build-github.js` L597–606 → `pages/post-list.ejs` | `posts: githubPosts.posts`（**全量**）。**無獨立 `/archive` route**；post-list 即完整封存列表 |
| **github category** | `build-github.js` L672–691 → `pages/category.ejs` | 由 `githubPosts.posts` 依 `post.category` 分組；**無 contentKind 過濾** |
| **github tag** | `build-github.js` L712–732 → `pages/tag.ejs` | 由 `githubPosts.posts` 依 `post.tags` 分組；**無 contentKind 過濾** |
| github category-index / tag-index | L694–710 / L735–751 | 由上述 map 派生（只列「有 post 的」分類 / 標籤） |
| github post-detail prev/next | L608–660 | `orderedPosts` 相鄰（全量排序清單）；download 頁亦會進前後篇鏈 |
| **related posts（自動推薦）** | **未實作** | `relatedPosts` 僅出現於 design-system demo（hardcoded `#`）、SCSS、`new-post.js` blocks toggle 預設值；**無任何資料 wiring** → SP-4 不涉及自動相關文章 |
| 作者手動 `relatedLinks` / `otherLinks` | `post-detail.ejs` + `deriveRenderedCrossLinks`（§16.5） | 作者明示連結，與 `includeInListings` **正交、互不影響** |
| 站內 search / 全文搜尋 | — | **不存在**（CLAUDE.md §29 第一版永禁）→ N/A |
| **Blogger post 選取** | `load-blogger-posts.js` → `build-blogger.js` | 同 `classify()` + `publishTargets.blogger.enabled`；Blogger home-index / category-index 由此清單派生 |
| **GitHub Pages post 選取** | `load-github-posts.js` → `build-github.js` | 同上（方向相反） |

### E.2 共同結論

- 全部站內列表面**最終都源自** `load-posts.js classify()` 之 `draft`/`status` 兩維度，再加跨站 `publishTargets.*.enabled` gate。
- **目前完全沒有「published 但不入列表」的維度**——這正是 preanalysis §1.4 / §2.4 所述缺口，亦是 SP-4 要補的。
- download 頁（#2）目前**會**出現在 home / post-list / 其 category / 其 tag / prev-next 鏈。

---

## F. Sitemap / indexing relationship findings

### F.1 sitemap（`build-sitemap.js`）

| 點 | 行為 |
|---|---|
| `buildEntries()` post-detail inclusion（L128–134） | precedence：`seo.indexing === 'noindex-*'` → exclude；`seo.indexing !== 'index'` 且 `contentKind === 'download'` → **exclude**；其餘 → include |
| `collectCategoryMap` / `collectTagMap`（L79–111） | 收集**全量** posts（無 download 排除）；但只產生 category/tag **索引 URL**，不產生 download 頁本身 URL |
| `buildRobotsTxt()` | 靜態：`Disallow: /design-system/` + `Disallow: /404.html` + `Sitemap:` 行 |

→ **sitemap 已排除 `contentKind: download`**（除非 explicit `seo.indexing: index`）。
故 #2 `portable-blog-system-mvp`（download、無 explicit index）**目前已不在 sitemap**。

### F.2 robots meta（post-detail）

`build-github.js` `buildSeoForPostDetail()` + `src/scripts/page-type-robots.js`（SP-3）precedence（高→低）：
1. explicit `post.seo.indexing`
2. `contentKind === 'download'` → `noindex, follow`（SEO-1 fallback；不可被 pageType 放寬）
3. `pageType` 推導（SP-3）
4. default `index, follow`

→ download 頁 robots = `noindex, follow`（既有）。

### F.3 三者關係彙整（關鍵不對稱）

| 維度 | download 頁（#2）現況 | 控制處 |
|---|---|---|
| robots meta | `noindex, follow` | build-github + page-type-robots（SP-1/SP-3） |
| sitemap inclusion | **已排除** | build-sitemap `buildEntries` |
| 站內列表（home/list/category/tag） | **仍在列表內** ← gap | load-posts `classify()`（無此維度） |

- **SP-3 `pageType` robots = robots-meta only**，**不**觸及 sitemap、**不**觸及 listing（SP-3 doc §7 明示）。
- `seo.indexing` 與 `contentKind: download` 目前同時驅動 robots + sitemap，但**不**驅動 listing。
- 因此「noindex + 不入 sitemap + **卻仍入列表**」是目前唯一無法消除的不一致 → SP-4 專責補 listing 維度。
- **建議：sitemap 排除（已存在）與 listing 排除（SP-4 新增）維持兩條獨立 code path / 兩個獨立欄位**
  （`includeInSitemap` vs `includeInListings`，per preanalysis §2.3/§2.4 之正交設計），不可合併成單一旗標。

---

## G. Risk analysis

| # | 風險 | 評估 |
|---|---|---|
| G1 | **若 SP-4 直接讓 `contentKind: download` 自動退出列表** | #2 `portable-blog-system-mvp`（github, **ready, visible**）會從 home + post-list + 其 category + 其 tag + prev/next 鏈**消失**。這是**會改變 GitHub Pages 線上輸出**的點（preanalysis §6.1 已警示的唯一輸出變動處）。**故第一批 SP-4 嚴禁自動隱藏 legacy download。** |
| G2 | #6 phonics download | 為 **draft**，本來就被過濾，自動隱藏對它**無影響**。 |
| G3 | Blogger repost 工作流是否依賴這些頁出現在列表 | Blogger 線上文章為**人工逐篇重貼**，與系統 `dist-blogger` 之 home-index 列表**非同一物**；自動隱藏只改 `dist-blogger` 輸出，不直接動線上 Blogger。#2 為 github 頁、#6 為 blogger draft（未重貼）→ **目前無 repost 依賴**。仍建議實作時 build-blogger byte-identical 驗證以防回歸。 |
| G4 | Admin 未來 write-path 切換 `includeInListings` | 目前 Admin 為 dev-mode-only read-only（無 write path）→ **無立即風險**。未來開 write path 時須依 preanalysis §5.3 對危險正交組合（`noindex-* + includeInListings:true`、`gated_download + index` 等）warn/lock。 |
| G5 | sitemap 排除 vs listing 排除混淆 | 若把兩者合併成單旗標，會喪失「index 但不入列表」（landing）與「noindex 但入列表」（罕見）之表達力。**維持分離。** |
| G6 | prev/next 鏈與 category/tag 計數 | 若未來隱藏某頁，該頁所屬 category/tag 計數會 -1、prev/next 會跳過 → 須納入 acceptance count check（§H/§I）。 |

---

## H. Recommended SP-4 implementation plan（保守、分子批）

> 原則：**預設輸出 byte-identical；只有顯式 `includeInListings: false` 才隱藏；legacy download 在 inventory 被接受前不自動隱藏。**

### H.1 子批拆解

| 子批 | 範圍 | 風險 | 輸出變動 |
|---|---|---|---|
| **SP-4a** | 新增**純函式 selector**（建議 `src/scripts/page-type-listings.js`，mirror `page-type-robots.js`）：`shouldIncludeInListings(post)`，**預設對所有現有 post 回 `true`**。Wire 進 build-github 之 home / post-list / category / tag / prev-next（以 `.filter()` 套用），但因 helper 預設 true → **輸出 byte-identical**。加 node:assert smoke（不改 package.json）。 | 🟢 純 plumbing | 無（byte-identical） |
| **SP-4b** | 讓 **explicit `includeInListings: false`** 隱藏該頁；`includeInListings: true` 或缺省 → 維持現況。**仍不**依 `pageType` / `contentKind` 自動隱藏。 | 🟡 低 | 僅當作者**明確**標 false 才變 |
| **SP-4c**（延後；須另開 content migration / policy phase） | `pageType: gated_download` / `utility_hidden` 推導 `includeInListings=false` 預設（仍可被 explicit 覆蓋）。**legacy `contentKind: download` 之自動隱藏不在 SP-4 範圍**；#2 mvp 已決定保留入列表（§H.3）。未來若要移除 legacy download，須先確認 live impact。 | 🟡 中 | 視遷移 |

### H.3 MVP download disposition decision（Dean，2026-06-23；binding）

- `portable-blog-system-mvp`（github, ready；唯一 visible download）→ **保留入列表**：SP-4 引入 `includeInListings` 時，
  這篇明確標記 / 視為 `includeInListings: true`，繼續出現在 home / post-list / category / tag / prev-next，**保持目前行為**。
- **sitemap 維持目前排除**，不因 listing 保留而改變（listing 與 sitemap 正交，§F.3 / §G5）。
- **SP-4 初期不接受** legacy `contentKind: download` 自動離開 lists；自動隱藏延後且須**另開 content migration / policy phase**，先確認 live impact。
- 本決定即 inventory acceptance：SP-4a 可在後續 session（user explicit approval）啟動，預設輸出 byte-identical。

### H.2 建議 precedence（listing 維度）

```
1. explicit post.includeInListings（true/false）  ← 最高優先，wins
2. pageType 推導之 listing 預設                     ← 延後 / warning-only until 內容遷移
3. legacy / 現況行為（include）                     ← 預設保底，確保 byte-identical
```

- explicit `includeInListings` **永遠**覆蓋 pageType 預設與 legacy 行為。
- pageType 推導預設在內容遷移完成前**維持 deferred 或 warning-only**，不在 SP-4a/b 啟用。
- 缺省一律 include → 現有 12 篇（含 #2 download）行為不變。

---

## I. Acceptance criteria（供未來 SP-4 實作 session）

> 本 phase 為 docs-only，下列為**未來**實作之驗收條件，本 phase 不執行。

1. **Source-level**：`shouldIncludeInListings` 純函式 smoke——缺省/未知 → true（byte-identical 保證）；explicit `false` → 隱藏；explicit `true` → 保留；正交性（與 `seo.indexing` 無耦合）。
2. **`npm run validate:content`**：維持 **0 error / 104 warning / 94 issue-post**（production 不得新增 warning）。
3. **targeted listing helper smoke**：新增 `src/scripts/check-page-type-listings.js`（node:assert、zero new dependency、直接 `node` 呼叫、**不**改 package.json），覆蓋 §H.2 precedence 全 case。
4. **generated HTML diff（若之後跑 build）**：SP-4a 後 `dist/index.html`（home）、`dist/posts/index.html`（post-list）、`dist/categories/**`、`dist/tags/**` 與遷移前 **byte-identical**（無任何 post 使用 `includeInListings` 時）。
5. **home / archive / category / tag count checks**：SP-4a 各列表 post 數、各 category/tag 計數、prev/next 鏈長度**不變**；SP-4b 僅 explicit-false 頁數減少且數量等於標記數。
6. **Blogger output 非變動確認**：`dist-blogger/` 之 posts / home-index / category-index 在不使用新旗標時 byte-identical。
7. **sitemap 非變動確認**：SP-4 **不**動 `build-sitemap.js`；`dist/sitemap.xml` + `robots.txt` 與遷移前 byte-identical（listing 與 sitemap 維持獨立路徑，§F.3 / §G5）。
8. **無 GA4 / AdSense 互動**：SP-4 不觸及 GA4 event / AdSense 版位。

---

## J. What was NOT done（本 phase 邊界）

| # | 項目 | 狀態 |
|---|---|---|
| 1 | 實作 `includeInListings` 消費（listing / category / tag / archive / related / sitemap） | ❌ 未做（SP-4a+ 範圍） |
| 2 | 改 `src/**`（build / loader / validator / EJS / Admin / helper） | ❌ 未動 |
| 3 | 改 `content/**` / `settings/**` / 新增任何 page content | ❌ 未動 |
| 4 | 改 `check-validation-report.js` BASELINE | ❌ 未動（已為 `{0,104,94}`，非 stale） |
| 5 | 改 `package.json` / lockfile / `dist*` / `gh-pages` / `.cache` / 生成 HTML | ❌ 未動 |
| 6 | 執行 build / deploy / preview / repost / dev server | ❌ 未執行 |
| 7 | Blogger repost | ❌ 未做 |
| 8 | 宣稱存取 / 操作 GA4 / AdSense / Search Console / Blogger / Drive 後台 | ❌ 無 |
| 9 | 改 `CLAUDE.md` / `MEMORY.md` | ❌ 未動 |
| 10 | 啟動 SP-4a..SP-9 任一實作 | ❌ 僅 §H 規劃 |

---

## K. Final git state

- 新增 1 檔：`docs/20260623-sp4-include-in-listings-inventory-preflight.md`。
- 其餘 working tree 維持 clean；無 source / content / settings / dist / gh-pages / `.cache` 變動。
- 建議 commit subject（per spec）：`docs(content): inventory include-in-listings impact`。
- **未** push（push 須 user explicit approval，per CLAUDE.md §3a 紀律）。

---

## L. Next recommended phase

- **SP-4a**：新增 `shouldIncludeInListings` 純函式 selector + build-github wiring，**預設 true / 輸出 byte-identical** + helper smoke。🟢 純 additive。
- inventory + #2 disposition **已被 Dean 接受**（§H.3：mvp 保留入列表 / sitemap 不變 / 不自動隱藏 legacy download）→ SP-4a 可在後續 session（user explicit approval）啟動。
- legacy `contentKind: download` 自動隱藏**不在 SP-4 範圍**，須另開 content migration / policy phase。

---

## M. Exit / idle freeze recommendation

- 本 phase 為 docs-only inventory，無行為變動 → 完成後建議 **idle freeze**。
- 不主動推進 SP-4a 實作；待 user 接受本 inventory（含 #2 download 處置）+ explicit approval 後，另開 SP-4a phase。
- 不主動 build / deploy / repost / 動 Google 後台 / 改 CLAUDE.md / MEMORY.md。

---

## Cross-links
- `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1）
- `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2）
- `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3）
- `docs/seo-indexing-rules.md`（indexing policy 總則）
- `CLAUDE.md` §11 / §15–§17 / §21 / §23 / §29

（本文件結束）
