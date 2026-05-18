# Phase 8-h Baseline Snapshot

本文件封存 **Phase 8-h-b** 之退場前 baseline run 結果，作為後續 **Phase 8-h legacy fallback removal** 系列（Phase 8-h-c 至 Phase 8-h-z）之**正式 regression 對照基準**。屬**快照型**封存；**不**移除任何 legacy fallback；**不**進入退場實作批。

對應之上層文件：
- `docs/phase-8h-pre-analysis.md`（Phase 8-h-a-doc 退場前盤點分析；commit `a538564`）—— 列出 17 個 source code 位置與 §6 baseline run 規劃
- `docs/phase-1-completion-report.md`（Phase 1 final completion report；commit `7f4958c`）—— §11 順序 3 規範 Phase 8-h 退場 trigger condition「Phase 1 final 已封存後啟動」
- `docs/phase-10-a-b-sitemap-robots-baseline.md`（Phase 10-a-b sitemap / robots dist baseline；commit `7758ce2`）—— §9.2 明示「本批為 sitemap 專屬 baseline；Phase 8-h-b 為完整 dist regression 對照」
- `docs/future-roadmap.md` §8.5 順序 2（Phase 8-h-b 退場前 baseline run 排程）
- `docs/phase-8h-completion-report.md`（**Phase 8-h 系列收尾報告**；本 baseline snapshot 為退場系列之 regression 對照基準；最終驗證結果見 completion report §7）

---

## §1 文件目的

### 1.1 本文件是什麼

- BLOG 系統 **Phase 8-h-b（legacy fallback removal baseline run）** 之退場前 baseline 封存
- 對 15 個 baseline commands（1 validate + 6 builds + 6 reports + 2 checks）之執行結果與輸出做完整 snapshot
- 作為後續 Phase 8-h-c 至 Phase 8-h-z 退場批之**regression 對照基準**
- 採**快照型**封存：記錄撰寫當下之 git 狀態、build / validate / report / check 結果、dist 狀態、副作用驗證

### 1.2 本文件不是什麼

- ❌ **不是** Phase 8-h legacy fallback removal 之啟動或實作批（Phase 8-h-c ~ Phase 8-h-z 仍未啟動）
- ❌ **不是**任何 source code 變動（per `docs/phase-8h-pre-analysis.md` §3 列出之 17 個 legacy 位置**完整保留**）
- ❌ **不是** Phase 8-h-c-pre fixture 補強批（屬未來；建議排於本批與 Phase 8-h-c 之間）
- ❌ **不是** JSON-LD 進階強化（Phase 9-g-g / 9-f-g 仍 deferred / post-Phase-1）
- ❌ **不是** sitemap cross-source gap 修復批（per `docs/phase-10-a-b-sitemap-robots-baseline.md` §3.3 之 we-media-myself2 observation）
- ❌ **不是** Phase 10-a-b 之代替（兩者範圍不同：Phase 10-a-b 為 sitemap 專屬 quick win；本批為完整 dist regression 對照）

### 1.3 Phase 8-h-b 當前狀態

```
Phase 8-h-b legacy fallback removal baseline run    ✅ completed（本批；無 source / dist tracked / validate baseline 變動）
├── 15 baseline commands                            ✅ 15/15 exit 0
├── validate baseline                               ✅ 維持 0/22/17
├── dist regression snapshot                        ✅ 已捕獲（dist/ 33 + dist-blogger/ 17 + dist-promotion/ 5 + dist-reports/ 17 = 72 files）
├── dist/.gitkeep 副作用                            ⚠️ 已偵測並修復（vite build 刪除 → git restore 還原）
└── Phase 8-h-c ~ 8-h-z 退場批                      未啟動（per §9 邊界聲明）
```

---

## §2 啟動前 snapshot

### 2.1 Git 狀態（啟動時）

| 項目 | 值 |
|---|---|
| **HEAD** | `7758ce22579e100d10f5ee0e087a444868ddbfc4`（短：`7758ce2`） |
| **working tree** | clean |
| **本批名稱** | Phase 8-h-b（legacy fallback removal baseline run） |
| **前一 HEAD** | `7f4958c docs(phase-9z): upgrade Phase 1 completion report to final (9-z-d)` |

### 2.2 上游里程碑

| 里程碑 | 狀態 | commit |
|---|---|---|
| Phase 1 final completion report 已封存 | ✅ | `7f4958c`（Phase 9-z-d 升正式 final）|
| Phase 9-i 系列 known blockers 3/3 全清 | ✅ | `eced408` + `7be40a7` + `31ae053` + `7986d58` |
| Phase 9-j JSON-LD landing verification 已封存 | ✅ | `4d68f50` |
| Phase 10-a-b sitemap / robots baseline 已完成 | ✅ | `7758ce2`（本批 HEAD）|
| Phase 8-h-a-doc 退場前盤點 已封存 | ✅ | `a538564` |
| Phase 8-h-c ~ 8-h-z 退場批 | ⏸ 未啟動 | — |

### 2.3 Baseline 起點指標

| 指標 | 數值 | 來源 |
|---|---|---|
| `validate:content` baseline | `0 error / 22 warning on 17 post(s)` | 啟動時 + 本批執行驗證皆一致 |
| Ready GitHub posts | 2 篇（`20260504-github-pages-blog-planning` + `20260504-portable-blog-system-mvp`）| — |
| Ready Blogger posts | 1 篇（`20260515-we-media-myself2`）| — |
| Cross-source GitHub mirror posts | 1 篇（we-media-myself2）| Phase 9-i-f-b commit `7986d58` |
| Validation fixtures | 15 個 | — |

---

## §3 baseline commands 執行結果

### 3.1 總覽

| # | command | exit | 執行時間 | 屬性 |
|---|---|---|---|---|
| 1 | `npm run validate:content` | 0 | — | validate |
| 2 | `npm run build:github` | 0 | 213ms | build（cache only；不寫 dist）|
| 3 | `npm run build`（vite）| 0 | 899ms | build（dist 全站；含 prebuild=build:github）|
| 4 | `npm run build:blogger` | 0 | 86ms | build |
| 5 | `npm run build:promotion` | 0 | 46ms | build |
| 6 | `npm run build:sitemap` | 0 | 37ms | build |
| 7 | `npm run build:blogger-theme` | 0 | 249ms | build |
| 8 | `npm run report:build` | 0 | — | report |
| 9 | `npm run report:drafts` | 0 | — | report |
| 10 | `npm run report:missing-tags` | 0 | — | report |
| 11 | `npm run report:urls` | 0 | — | report |
| 12 | `npm run report:series` | 0 | — | report |
| 13 | `npm run report:book` | 0 | — | report |
| 14 | `npm run check:links` | 0 | — | check |
| 15 | `npm run check:images` | 0 | — | check |

### 3.2 結論

✅ **15 / 15 commands 全部 exit 0**；無任何 error；無任何 stderr 警告；無任何 stop condition 觸發。

### 3.3 與 Phase 8-h pre-analysis §6 規劃對照

per `docs/phase-8h-pre-analysis.md` §6 之 15 條建議命令清單：本批**全數執行**，無遺漏；無新增 scripts；無修改 scripts。

---

## §4 validate baseline

### 4.1 結果

```
0 error(s) / 22 warning(s) on 17 post(s)
```

簡寫：**`0 / 22 / 17`**

### 4.2 與 Phase 1 final baseline 對照

| 指標 | 本批 | Phase 1 final | regression？ |
|---|---|---|---|
| error 數 | 0 | 0 | ❌ 無 |
| warning 數 | 22 | 22 | ❌ 無 |
| 有 warning/error 之 post 數 | 17 | 17 | ❌ 無 |

✅ baseline 100% 維持；與 `docs/phase-1-completion-report.md` §3.2 / `docs/phase-9g-completion-report.md` §5.1 之 `0/22/17` baseline 完全一致。

### 4.3 22 warnings 來源分佈

全 22 warnings 來自 15 個 validation fixtures（series 5 + book 7 + related-links 4，部分共用觸發點）：

| 規則名稱 | 數 | 來源 fixture |
|---|---|---|
| series-id-not-in-settings | 1 | _test-series-title-unresolved |
| series-title-unresolved | 1 | _test-series-title-unresolved |
| series-id-invalid | 2 | _test-series-dup-a / -b |
| series-number-duplicate | 2 | _test-series-dup-a / -b |
| series-not-object | 1 | _test-series-not-object |
| series-id-invalid（empty）| 1 | _test-series-validation |
| series-number-invalid | 1 | _test-series-validation |
| series-subtitle-invalid-type | 1 | _test-series-validation |
| related-links-entry-kind-invalid | 1 | _test-related-links-entry-kind-invalid |
| related-links-entry-missing-kind | 1 | _test-related-links-entry-missing-kind |
| related-links-entry-missing-url | 1 | _test-related-links-entry-missing-url |
| related-links-not-array | 1 | _test-related-links-not-array |
| book-authors-entry-empty | 1 | _test-book-authors-entry-empty |
| book-authors-invalid-role | 1 | _test-book-authors-invalid-role |
| book-issn-without-magazine-mediatype | 1 | _test-book-issn-without-magazine |
| book-issue-without-magazine-mediatype | 1 | _test-book-issue-without-magazine |
| book-mediatype-invalid | 1 | _test-book-mediatype-invalid |
| book-published-year-invalid-type | 1 | _test-book-published-year-invalid-type |
| book-volume-invalid-type | 1 | _test-book-volume-invalid-type |
| **合計** | **22** | — |

**重要觀察**：真實 content（ready posts）**0 warning**；warnings 全為 fixture 預期觸發。

---

## §5 build outputs baseline

### 5.1 build:github

```
[build-github] wrote .cache/pages/* (多檔)
[build-github] wrote .cache/data/build-manifest.json
[build-github] done in 213ms
```

- exit 0；耗時 213ms
- 產出位置：`.cache/pages/` 與 `.cache/data/`（非 dist；屬 vite prebuild 中間產物）
- 不直接寫 dist；dist 之最終產出由後續 `npm run build`（vite build）完成

### 5.2 build（vite）

```
[vite] ✓ built in 899ms
```

dist 全站重建：18 個 HTML + 2 個 asset（CSS + JS bundle）。

| 主要 dist 路徑 | 檔案數 | 備註 |
|---|---|---|
| `dist/index.html` | 5.48 kB | home |
| `dist/posts/index.html` | 6.86 kB | posts list |
| `dist/posts/{github-pages-blog-planning,portable-blog-system-mvp,we-media-myself2}/index.html` | 各 5.79 / 6.17 / 11.03 kB | 3 篇 ready posts（含 cross-source mirror）|
| `dist/categories/`（list + tech-note）| 2 個 HTML | — |
| `dist/tags/`（list + 4 個 tag pages）| 5 個 HTML | github / vite / static-site / reading-notes |
| `dist/design-system/`（index + 6 子頁）| 7 個 HTML | — |
| `dist/404.html` | — | — |
| `dist/assets/entry-*.{css,js}` | 22.09 kB CSS + 2.93 kB JS | vite bundle |

**特別記錄**：we-media-myself2 cross-source mirror page (`dist/posts/we-media-myself2/index.html` 11.03 kB) 已正確產出（per Phase 9-i-f-b commit `7986d58` 之 cross-source build 機制）。

### 5.3 build:blogger

```
[build-blogger] wrote dist-blogger/posts/we-media-myself2/{post.html,meta.json,copy-helper.txt,publish-checklist.txt} (full)
[build-blogger] wrote dist-blogger/posts/github-pages-blog-planning/{post.html,meta.json,copy-helper.txt,publish-checklist.txt} (summary)
[build-blogger] wrote dist-blogger/index/{blogger-home.html,category-book-review.html,category-tech-note.html}
[build-blogger] wrote dist-blogger/build-manifest.json
[build-blogger] done in 86ms
```

- exit 0；耗時 86ms
- 2 篇 posts（1 full mode + 1 summary mode）+ 3 index pages + 1 manifest
- we-media-myself2 為 full mode（per `publishTargets.blogger.mode`）
- github-pages-blog-planning 為 summary mode（per `publishTargets.blogger.mode`）

### 5.4 build:promotion

```
[build-promotion] sources scanned: github=2, blogger=3
[build-promotion]   github source: 1 enabled / 1 filtered
[build-promotion]   blogger source: 1 enabled / 2 filtered
[build-promotion] total enabled: 2 / total filtered: 3
[build-promotion] wrote dist-promotion/facebook/blogger/we-media-myself2.txt
[build-promotion] wrote dist-promotion/facebook/github/github-pages-blog-planning.txt
[build-promotion] wrote dist-promotion/facebook/all-posts-index.txt
[build-promotion] wrote dist-promotion/facebook/build-manifest.json
[build-promotion] done in 46ms
```

- exit 0；耗時 46ms
- **total enabled = 2**（we-media-myself2 + github-pages-blog-planning）
- **total filtered = 3**（portable-blog-system-mvp `no-promotion-block` / sample-book-review `draft:true` / we-media-myself2.fb.md 被當獨立 post `status:draft`，per Phase 9-i-d-b 既有 harmless 副作用）
- 4 個輸出檔（2 FB txt + 1 index + 1 manifest）

### 5.5 build:sitemap

```
[build-sitemap] wrote dist/sitemap.xml (10 url entries)
[build-sitemap] wrote dist/robots.txt
[build-sitemap] done in 37ms
```

- exit 0；耗時 37ms
- sitemap.xml **10 url entries**（同 Phase 10-a-b baseline；per `docs/phase-10-a-b-sitemap-robots-baseline.md` §3.2 之 10 url 列表）
- robots.txt 內容同 Phase 10-a-b（5 directives；不變）

### 5.6 build:blogger-theme

```
[build-blogger-theme] compiling src/styles/blogger/blogger-tokens.scss
[build-blogger-theme] wrote dist-blogger/theme/blogger-tokens.css (2.99 kB)
[build-blogger-theme] compiling src/styles/blogger/blogger-article.scss
[build-blogger-theme] wrote dist-blogger/theme/blogger-article.css (6.34 kB)
[build-blogger-theme] compiling src/styles/blogger/blogger-components.scss
[build-blogger-theme] wrote dist-blogger/theme/blogger-components.css (19.74 kB)
[build-blogger-theme] compiling src/styles/blogger/blogger-full-style.scss
[build-blogger-theme] wrote dist-blogger/theme/blogger-full-style.css (23.11 kB)
[build-blogger-theme] done in 249ms
```

- exit 0；耗時 249ms
- 4 個 CSS：tokens 2.99 kB / article 6.34 kB / components 19.74 kB / **full-style 23.11 kB**（per CLAUDE.md §10 「Blogger 主題貼一次 blogger-full-style.css，之後文章只貼 HTML」設計）

---

## §6 report outputs baseline

### 6.1 report:build

```
[export-build-report] wrote dist-reports/build-report.{json,txt}
[export-build-report] github ready=2 blogger ready=1 drafts=2 validate-errors=0 validate-warnings=0
```

| 指標 | 值 |
|---|---|
| GitHub ready | 2 |
| Blogger ready | 1 |
| drafts | 2 |
| validate-errors | 0 |
| validate-warnings | 0（**注**：此處為 build pipeline 自帶之 validate 結果；屬 build 內部 validate，不含 validation fixtures，故與 `validate:content` 之 22 不同）|

### 6.2 report:drafts

```
[report-draft-posts] wrote dist-reports/draft-posts-report.{json,txt}
[report-draft-posts] total drafts: 2
```

| 指標 | 值 |
|---|---|
| total drafts | 2 |

**drafts 來源**：`20260504-sample-book-review`（Blogger）+ 推測另一篇（具體 listing 詳見 `dist-reports/draft-posts-report.txt`）。

### 6.3 report:missing-tags

```
[report-missing-tags] wrote dist-reports/missing-tags-report.{json,txt}
[report-missing-tags] missing=0 site-mismatch=0
```

| 指標 | 值 |
|---|---|
| missing | 0 |
| site-mismatch | 0 |

✅ 所有 ready posts 之 tags 皆命中 `content/settings/tags.json`；無 site 不匹配。

### 6.4 report:urls

```
[report-published-urls] wrote dist-reports/published-urls-report.{json,txt}
[report-published-urls] enabled=2 filled=0 missing=2
```

| 指標 | 值 |
|---|---|
| enabled | 2 |
| filled | 0 |
| missing | 2 |

**注釋**：此處 enabled=2 為「需 publishedUrl 之 ready post 數」；filled=0 / missing=2 可能反映「**GitHub publishedUrl 尚未回填**」（we-media-myself2 之 Blogger publishedUrl 已 filled，但 GitHub publishedUrl 未填；具體欄位邏輯詳見 `src/scripts/report-published-urls.js`）。屬既有設計；**不**屬本批 scope。

### 6.5 report:series

```
[report-series] wrote dist-reports/series-report.{json,txt}
[report-series] total series=0 total posts=0
```

| 指標 | 值 |
|---|---|
| total series | 0 |
| total posts | 0 |

✅ 當前 ready content 無 series；fixtures（_test-series-*）之 series 不入 report：series 計數（per Phase 8-g-17-b 既有設計：fixtures 排除）。

### 6.6 report:book

```
[report-book] wrote dist-reports/book-report.{json,txt}
[report-book] total posts=2 groups=1
```

| 指標 | 值 |
|---|---|
| total posts | 2 |
| groups | 1 |

**注釋**：total posts=2 可能涵蓋 we-media-myself2（ready）+ 20260504-sample-book-review（draft）兩篇 book-review；groups=1 反映同一 mediaType 群組。具體分群邏輯詳見 `src/scripts/report-book.js`。

### 6.7 check:links

```
[check-broken-links] wrote dist-reports/check-broken-links-report.{json,txt}
[check-broken-links] total=0 broken=0 external=0 anchors=0 unknown=0
```

| 指標 | 值 |
|---|---|
| total | 0 |
| broken | 0 |
| external | 0 |
| anchors | 0 |
| unknown | 0 |

✅ 無 broken links 偵測（total=0 可能反映 scope 為 ready content 內部 markdown 連結；具體掃描範圍詳見 `src/scripts/check-broken-links.js`）。

### 6.8 check:images

```
[check-image-links] wrote dist-reports/check-image-links-report.{json,txt}
[check-image-links] total=8 local-missing=0 external=6 unknown=0 alt-missing=0
```

| 指標 | 值 |
|---|---|
| total | 8 |
| local-missing | 0 |
| external | 6 |
| unknown | 0 |
| alt-missing | 0 |

✅ 無本地圖片缺失；外部圖片 6 張（推測 we-media-myself2 之 5 張 Comic 圖 + 其他）；無 alt 缺失。

---

## §7 dist / git status 副作用檢查

### 7.1 dist/.gitkeep 副作用：⚠️ 偵測 → ✅ 修復

| 階段 | 狀態 |
|---|---|
| baseline run 開始前 | `dist/.gitkeep` 存在（mtime 2026-05-15 16:35）|
| `npm run build`（vite）執行後 | `dist/.gitkeep` **被刪除**（vite build 預設清空 dist/ 後重建）|
| `git status` 偵測 |  `deleted: dist/.gitkeep`（per spec 規則 13）|
| 修復方式 | `git restore dist/.gitkeep`（per 候選 A 批准之命令）|
| 修復後狀態 | ✅ `dist/.gitkeep` 0 bytes 存在；working tree clean |

**歷史對照**：此副作用模式於 Phase 9-g-f-b / 9-h-b-b / 9-h-c-b / 9-h-d-b / 9-h-e-b 多次出現，每次以 `git restore dist/.gitkeep` 處理；屬已知 vite build 行為。

### 7.2 其他 .gitkeep 檔案：✅ 全完整

| 路徑 | 狀態 | mtime |
|---|---|---|
| `dist-blogger/.gitkeep` | ✅ 完整 | 2026-05-04 06:36（未動）|
| `dist-promotion/.gitkeep` | ✅ 完整 | 2026-05-04 06:36（未動）|
| `dist-reports/.gitkeep` | ✅ 完整 | 2026-05-04 06:36（未動）|

**意涵**：build:blogger / build:blogger-theme / build:promotion / reports / checks 之 build script **皆**未執行 dist 清空操作；只有 `npm run build`（vite build）會清 `dist/`。

### 7.3 git status（restore + 本文件建立前）

```
On branch main
nothing to commit, working tree clean
```

### 7.4 跨類變動驗證

| 維度 | 狀態 | 驗證 |
|---|---|---|
| `src/` source code | ❌ 不變 | 0 個 modified |
| `content/` content | ❌ 不變 | 0 個 modified |
| `content/settings/` settings | ❌ 不變 | 0 個 modified |
| `package.json` / `vite.config.js` / `.gitignore` | ❌ 不變 | 0 個 modified |
| `dist/.gitkeep` | ⚠️ 曾被刪 → ✅ 已 restore | git restore dist/.gitkeep |
| 其他 dist tracked 檔案 | ❌ 不適用（dist/* gitignored 除 .gitkeep）| — |
| **legacy fallback 程式碼** | ❌ **未移除**（per `docs/phase-8h-pre-analysis.md` §3 列出之 17 個位置完整保留）| — |

### 7.5 dist 全域檔案數 baseline（regression 對照基準）

| 目錄 | recursive file count | 內容 |
|---|---|---|
| `dist/` | 33 個檔案（不含 .gitkeep）+ 1 .gitkeep = 34 | 18 HTML + 2 assets + sitemap.xml + robots.txt + 其他靜態 |
| `dist-blogger/` | 17 個 | 2 posts × 4 檔（8）+ 3 index html（3）+ build-manifest（1）+ 4 theme CSS（4）+ .gitkeep（1）= 17 |
| `dist-promotion/` | 5 個 | 2 FB txt（2）+ all-posts-index（1）+ build-manifest（1）+ .gitkeep（1）= 5 |
| `dist-reports/` | 17 個 | 8 reports × 2 格式（16）+ .gitkeep（1）= 17 |
| **合計** | **72 個** | 跨 4 個 dist 目錄之完整 regression baseline |

---

## §8 Phase 8-h legacy fallback removal 的後續用途

### 8.1 本文件作為 regression 對照基準

per `docs/phase-8h-pre-analysis.md` §5 之拆批規劃，Phase 8-h-c 至 Phase 8-h-z 為實際退場批。每批退場後須執行**相同 15 個 baseline commands** 並與本文件之 baseline 對照，確認：

1. `validate:content` 仍維持 `0 / 22 / 17`（或預期之改動，例如 8-h-c 移除 `frontmatter-uses-deprecated-type` rule 後 warning 數可能減少）
2. dist / dist-blogger / dist-promotion / dist-reports 之檔案數與內容**結構性不變**（byte-identical 或 byte-identical-modulo-builtAt）
3. 各 report 之計數**不變**（除明確預期之變動）
4. 兩端 article block parity 維持 6/6
5. canonical / JSON-LD / copy-helper / publish-checklist / promotion 全鏈正確

### 8.2 後續 Phase 8-h-c 至 Phase 8-h-z 退場批之 regression 流程

per `docs/phase-8h-pre-analysis.md` §5 之 9-11 commits 拆批：

| 退場批 | 範圍 | 預期 baseline 變動 | regression 對照重點 |
|---|---|---|---|
| 8-h-c-pre（可選）| 補 legacy regression fixtures | validate warning 數可能 +N | fixture 觸發 |
| 8-h-c | validate `frontmatter-uses-deprecated-type` warning rule 調整 | warning 數可能變動 | rule landed / removed |
| 8-h-d-1 | normalize contentKind/type fallback 退場 | content 層既無 legacy `type:`；dist byte-identical | normalize-post-output regression |
| 8-h-d-2 | normalize FB sidecar legacy fallback 6 處退場 | FB promotion txt byte-identical-modulo-builtAt | build-promotion regression |
| 8-h-d-3 | normalize canonical legacy fallback 退場 | canonical resolver 一致 | canonical chain regression |
| 8-h-d-4 | resolve-placeholders 4 處 legacy URL fallback 退場 | resolver 一致 | placeholder regression |
| 8-h-e-1 | build-blogger tags fallback 退場 | meta.json tags byte-identical | build-blogger regression |
| 8-h-e-2 | build-blogger meta.json `type` 欄位處理 | meta.json schema 變動（預期） | meta.json schema regression |
| 8-h-f | build-promotion 4 欄位 legacy fallback 退場 | FB promotion txt 一致 | build-promotion regression |
| 8-h-z | docs sync + completion report | 無 dist 變動 | — |

### 8.3 dist 規模對照（本文件 vs 退場批後）

退場批後預期 dist 規模：

- dist/ 33 個（不變）
- dist-blogger/ 17 個（不變）
- dist-promotion/ 5 個（不變）
- dist-reports/ 17 個（不變）

**若任何退場批導致 dist 規模變動**：屬意外 regression；需暫停退場批並回到本 baseline 重新對照。

### 8.4 validate baseline 對照

退場批後 `validate:content` baseline 預期：

- 8-h-c 之前：維持 `0 / 22 / 17`
- 8-h-c 後（若 `frontmatter-uses-deprecated-type` rule 移除）：可能變為 `0 / 21 / 17`（warning -1）
- 8-h-z 後（全退場完成）：依各批變動累積；最終 baseline 將於 8-h-z 之 completion report 確認

---

## §9 不做項目與邊界聲明

### 9.1 本文件嚴格邊界

- ✅ 本文件**僅為 baseline snapshot 封存**；不啟動任何 source code 變動
- ✅ 本文件**不**啟動 Phase 8-h-c-pre fixture 補強批（屬未來；建議排於本批與 Phase 8-h-c 之間）
- ✅ 本文件**不**啟動 Phase 8-h-c 至 Phase 8-h-z 退場批
- ✅ 本文件**不**移除任何 legacy fallback（17 個位置完整保留；per `docs/phase-8h-pre-analysis.md` §3）
- ✅ 本文件**不**啟動 Phase 9-g-g（relatedLinks JSON-LD `mentions` / `isPartOf`）
- ✅ 本文件**不**啟動 Phase 9-f-g（Book / Periodical structured data）
- ✅ 本文件**不**啟動 Phase 9-h-f（兩端 Related Posts auto block）
- ✅ 本文件**不**啟動 Google Rich Results Test 驗證批
- ✅ 本文件**不**處理 we-media-myself2 cross-source mirror sitemap gap（per `docs/phase-10-a-b-sitemap-robots-baseline.md` §3.3 觀察；屬未來候選）
- ✅ 本文件**不**動既有 source code / 既有 EJS templates / 既有 build scripts / 既有 settings / 既有 content
- ✅ 本文件**不**改 `.gitignore`

### 9.2 與 Phase 10-a-b 之關係

- Phase 10-a-b（commit `7758ce2`）為 **sitemap / robots 專屬 baseline**；範圍窄（僅 `build:sitemap` + 1 個 validate）
- 本批 Phase 8-h-b 為**完整 dist regression baseline**；範圍寬（15 個 commands 涵蓋 validate / build × 6 / report × 6 / check × 2）
- 兩者**獨立並存**；本文件**不**取代 Phase 10-a-b 之 baseline doc

### 9.3 與本批 commit 之關係

- 本批僅新增 `docs/phase-8h-baseline-snapshot.md` 1 個檔案
- dist 既有檔案（含 build 重建後）為 gitignored；**不**進入 commit
- dist/.gitkeep 已 restore 至原狀；**不**進入 commit
- 本批 commit 範圍：**1 個 docs 檔案；單檔 commit**

### 9.4 安全網設計

- 本批 dist regression baseline 為「退場批前最後一道對照基準」
- 任何後續退場批失敗 → 可由 `git revert` 退場 commit + 重新 `git restore dist/.gitkeep`（若需要）+ 重跑 baseline 對照
- 退場批之 sanity check 必須**至少**驗證：(1) validate baseline / (2) dist 檔案數 / (3) build × 6 exit 0 / (4) 各 report 計數一致

---

## §10 建議下一步

完成本 baseline snapshot 後，**不**立即進入 Phase 8-h-c 退場實作批。建議順序：

### 10.1 順序 1（推薦；保守路線）：Phase 8-h-c-pre fixture 補強分析批

- **負責**：Claude Code
- **範圍**：純讀取分析 + 可能新增 1-2 個 `_test-deprecated-*` validation fixtures，補強 Phase 8-h-c 退場前之 regression fixture 保護
- **理由**：per `docs/phase-8h-pre-analysis.md` §7.4「無 fixture 保護退場路徑」+ §5 建議拆批之 8-h-c-pre 預留批位
- **預期 commit 數**：1-2（分析批 0 commit；fixture 落地批 1-2 commits）
- **觸發條件**：✅ 已滿足（本 baseline 已 landed）

### 10.2 順序 2：Phase 8-h-c validate rule 退場分析批（純讀取）

- **負責**：Claude Code
- **範圍**：純讀取 `src/scripts/validate-content.js:326-333` 之 `frontmatter-uses-deprecated-type` warning rule 邊界；提出退場方案 A / B / C 比較
- **理由**：8-h-c 為最小退場批（單檔 / 1 個 warning rule 調整）；適合作為退場系列起手
- **觸發條件**：順序 1 完成後

### 10.3 順序 3：Phase 8-h-c 實作退場批

- **負責**：Claude Code
- **範圍**：執行順序 2 之分析批所提之方案
- **觸發條件**：順序 2 完成 + 用戶批准

### 10.4 順序 4 至 8-z

- per `docs/phase-8h-pre-analysis.md` §5 拆批：8-h-d-1 ~ d-4 → 8-h-e-1 / e-2 → 8-h-f → 8-h-z
- 每批獨立 commit；每批執行 sanity check 對照本 baseline

### 10.5 並行候選（不影響 Phase 8-h 系列）

- **Phase 9-g-g**：relatedLinks JSON-LD `mentions` / `isPartOf`（trigger 已滿足；屬獨立 SEO 強化）
- **Phase 9-f-g**：Book / Periodical structured data（trigger 已滿足；同上）
- **Google Rich Results Test**：作者 SOP；可隨時執行
- **sitemap cross-source gap 修復**：mirror Phase 9-i-f-b cross-source 設計使 build-sitemap.js 接入 cross-source

### 10.6 保守原則

- 每批獨立 commit；不混入跨類變動
- 每批執行完整 15 個 baseline commands；對照本文件
- 任何意外 regression → 立即暫停；不嘗試 hot-fix；回報後等用戶批准

---

（本文件結束）
