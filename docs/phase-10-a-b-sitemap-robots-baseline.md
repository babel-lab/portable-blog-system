# Phase 10-a-b: Sitemap / Robots Dist Baseline Snapshot

本文件封存 **Phase 10-a-b（post-Phase-1 quick win）** 之 sitemap / robots dist 首次補檔結果。屬**快照型**封存；**不**代表啟動 Phase 8-h legacy 退場批；**不**代表啟動 JSON-LD 進階強化批。

對應之上層紀錄：
- `docs/phase-1-completion-report.md` §8.9（sitemap / robots dist 補檔列為 post-Phase-1 quick win）
- `docs/phase-8h-pre-analysis.md` §6（Phase 8-h-b 退場前 baseline run 規劃；mirror 本批 snapshot pattern）
- `docs/future-roadmap.md` §8.5 順序 2（Phase 8-h-b baseline run；本批為其前置 / 預演）

---

## §1 文件目的

### 1.1 本文件是什麼

- BLOG 系統 **Phase 10-a-b** sitemap / robots dist 首次補檔之 baseline snapshot 封存
- Phase 10-a-b 屬 **post-Phase-1 quick win**：在 Phase 1 final（commit `7f4958c`）封存後，解除 `docs/phase-1-completion-report.md` §8.9 所列「sitemap.xml / robots.txt 缺檔（流程未跑而非系統缺漏）」之註記
- 採**快照型**封存：記錄撰寫當下之 sitemap.xml 內容、robots.txt 內容、build 命令結果、副作用驗證

### 1.2 本文件不是什麼

- ❌ **不是** Phase 8-h legacy fallback removal 之啟動報告（Phase 8-h-a-doc pre-analysis 已落地於 commit `a538564`；Phase 8-h-b ~ 8-h-z 退場批仍未啟動）
- ❌ **不是** Phase 9-g-g（relatedLinks / otherLinks JSON-LD `mentions` / `isPartOf`）之啟動報告
- ❌ **不是** Phase 9-f-g（Book / Periodical structured data）之啟動報告
- ❌ **不是** Google Rich Results Test 驗證批
- ❌ **不是** Phase 8-h-b 退場前 baseline run 之代替（Phase 8-h-b 範圍更大，含完整 build × 5 + 7 個 report scripts；本批僅執行 `npm run build:sitemap` 一個指令）

### 1.3 Phase 10-a-b 當前狀態

```
Phase 10-a-b sitemap / robots dist baseline snapshot   ✅ completed（本批；docs + dist filesystem additions）
├── dist/sitemap.xml                                    ✅ 已產出（10 url entries）
├── dist/robots.txt                                     ✅ 已產出
├── build:sitemap                                       ✅ 執行成功（65ms）
├── validate baseline                                   ✅ 維持 0/22/17
└── 後續批次                                            未啟動（per §9 邊界聲明）
```

---

## §2 當前 snapshot

### 2.1 Git 狀態

| 項目 | 值 |
|---|---|
| **HEAD**（本批啟動時 + 本文件建立時） | `7f4958cc66edfd9a2877426d4a0e8ba10c4b6ac9`（短：`7f4958c`） |
| **working tree** | clean |
| **本批名稱** | Phase 10-a-b post-Phase-1 quick win（含 build:sitemap 執行 + baseline snapshot doc） |
| **前一 HEAD** | `4d68f50 docs(json-ld): add phase 9j landing verification` |

### 2.2 Baseline 指標（執行 build:sitemap 後仍維持）

| 指標 | 數值 | 與 Phase 1 final baseline 對比 |
|---|---|---|
| `validate:content` baseline | `0 error / 22 warning on 17 post(s)`（`0/22/17`） | ✅ 與 `docs/phase-1-completion-report.md` §3.2 完全一致；無 regression |
| Ready GitHub posts | 2 篇 | 不變 |
| Ready Blogger posts | 1 篇（we-media-myself2）| 不變 |
| Cross-source mirror posts | 1 篇（we-media-myself2 於 dist/posts/）| 不變 |
| Validation fixtures | 15 個 | 不變 |

### 2.3 .gitignore 對 dist 之既有設計

`.gitignore` 之 dist 相關規則：

```
dist/*
!dist/.gitkeep
dist-blogger/*
!dist-blogger/.gitkeep
dist-promotion/*
!dist-promotion/.gitkeep
dist-reports/*
!dist-reports/.gitkeep
```

意涵：

- `dist/*` 整個被 git ignore
- 唯一例外為 `dist/.gitkeep`（保留資料夾結構）
- 本批產出之 `dist/sitemap.xml` + `dist/robots.txt` 皆為 gitignored；**不**進入 git status / 不可 commit（per §8）

---

## §3 sitemap.xml 內容（10 url entries）

### 3.1 檔案資訊

| 項目 | 值 |
|---|---|
| 路徑 | `dist/sitemap.xml` |
| 大小 | 1206 bytes |
| 產出時間 | 2026-05-18 11:04 |
| Encoding | UTF-8 |
| Schema | `http://www.sitemaps.org/schemas/sitemap/0.9` |
| URL host | `https://babel-lab.github.io/`（per Phase 9-i-b1 commit `eced408` 修正之 `content/settings/site.config.json`）|

### 3.2 10 url entries 列舉

| # | loc | lastmod | 性質 |
|---|---|---|---|
| 1 | `https://babel-lab.github.io/` | 2026-05-18 | home |
| 2 | `https://babel-lab.github.io/posts/` | 2026-05-18 | posts list |
| 3 | `https://babel-lab.github.io/posts/github-pages-blog-planning/` | 2026-05-04 | tech-note post（github source）|
| 4 | `https://babel-lab.github.io/posts/portable-blog-system-mvp/` | 2026-05-04 | tech-note post（github source）|
| 5 | `https://babel-lab.github.io/categories/` | 2026-05-18 | categories list |
| 6 | `https://babel-lab.github.io/categories/tech-note/` | 2026-05-18 | category page（tech-note）|
| 7 | `https://babel-lab.github.io/tags/` | 2026-05-18 | tags list |
| 8 | `https://babel-lab.github.io/tags/github/` | 2026-05-18 | tag page |
| 9 | `https://babel-lab.github.io/tags/vite/` | 2026-05-18 | tag page |
| 10 | `https://babel-lab.github.io/tags/static-site/` | 2026-05-18 | tag page |

### 3.3 觀察：we-media-myself2 cross-source mirror 不在 sitemap

當前 sitemap 之 10 url entries **未包含**以下項目：

- `https://babel-lab.github.io/posts/we-media-myself2/`（we-media-myself2 GitHub cross-source mirror page；該 page 存在於 `dist/posts/we-media-myself2/index.html`，但不出現於 sitemap.xml）
- `https://babel-lab.github.io/categories/book-review/`（we-media-myself2 之分類）
- `https://babel-lab.github.io/tags/{reading-notes,self-growth,…}/`（we-media-myself2 之標籤）

**性質判定**：

- 此為 `src/scripts/build-sitemap.js` 之既有行為；推測該 script 之 post scan 邏輯類似 Phase 9-i-f-b 之前的 `build-github.js`（只掃 `content/github/posts/`，未掃 `content/blogger/posts/` 之 `publishTargets.github.enabled: true` cross-source posts）
- **不**屬 Phase 10-a-b scope（本批僅補檔；不修 source code）
- **可考慮**列為未來候選批次（建議稱 `Phase 10-a-c` 或 `Phase 10-a-d`；範圍：mirror Phase 9-i-f-b 之 cross-source 設計，使 `build-sitemap.js` 接入 cross-source mirror posts）
- 對 Phase 1 final 之影響：屬 sitemap 範圍 gap，**不**動搖系統能力完成度判定

---

## §4 robots.txt 內容

### 4.1 檔案資訊

| 項目 | 值 |
|---|---|
| 路徑 | `dist/robots.txt` |
| 大小 | 118 bytes |
| 產出時間 | 2026-05-18 11:04 |

### 4.2 內容

```
User-agent: *
Allow: /
Disallow: /design-system/
Disallow: /404.html
Sitemap: https://babel-lab.github.io/sitemap.xml
```

### 4.3 對 CLAUDE.md §21 之對應

per CLAUDE.md §21：

> GitHub 站需支援：title / description / canonical / Open Graph / JSON-LD / **sitemap.xml** / **robots.txt**

✅ sitemap.xml + robots.txt 皆已產出至 dist；對應 CLAUDE.md §21 之第一版 SEO 必做項目（含 5 條 directive：`User-agent: *` + `Allow: /` + `Disallow: /design-system/` + `Disallow: /404.html` + `Sitemap` 引用）。

---

## §5 build:sitemap 執行結果

### 5.1 命令

```bash
npm run build:sitemap
```

### 5.2 結果輸出

```
> portable-blog-system@0.1.0 build:sitemap
> node src/scripts/build-sitemap.js

[build-sitemap] wrote dist/sitemap.xml (10 url entries)
[build-sitemap] wrote dist/robots.txt
[build-sitemap] done in 65ms
```

### 5.3 結果摘要

| 項目 | 值 |
|---|---|
| Exit code | 0（成功）|
| 執行時間 | 65 ms |
| 產出檔案 | 2 個（dist/sitemap.xml + dist/robots.txt）|
| URL entries 數 | 10 |
| Warning / Error | 0 |
| Stderr 殘留 | 無 |

---

## §6 副作用驗證

### 6.1 .gitkeep 副作用：✅ 無

| 項目 | 值 |
|---|---|
| `dist/.gitkeep` 是否存在 | ✅ 存在 |
| `dist/.gitkeep` 大小 | 0 bytes（未變）|
| `dist/.gitkeep` mtime | 2026-05-15 16:35（**未更新**；確認未被 build:sitemap 觸碰）|

對比歷史：Phase 9-g-f-b / 9-h-b-b / 9-h-c-b / 9-h-d-b / 9-h-e-b 多次出現「`dist/.gitkeep` 副作用需 `git restore` 還原以維持單檔 commit」。本批 `build:sitemap` **無此副作用**；推測 `src/scripts/build-sitemap.js` 不執行 dist 清空操作，只 append-only 寫入 sitemap.xml + robots.txt。

### 6.2 跨類變動驗證：✅ 全無

| 維度 | 狀態 | 驗證方式 |
|---|---|---|
| **source code（`src/`）變動** | ❌ 無 | `git status` 0 個 `src/` 路徑 modified |
| **content（`content/`）變動** | ❌ 無 | `git status` 0 個 `content/` 路徑 modified |
| **settings（`content/settings/`）變動** | ❌ 無 | `git status` 0 個 `content/settings/` 路徑 modified |
| **package / config（`package.json` / `vite.config.js` / `.gitignore` 等）變動** | ❌ 無 | `git status` 0 個 root 級檔案 modified |
| **dist 既有檔案變動** | ❌ 無 | dist/posts/ / dist/categories/ / dist/tags/ / dist/index.html 等既有檔案皆未動 |
| **dist 新增檔案** | ✅ 2 個 | dist/sitemap.xml + dist/robots.txt（gitignored；屬預期 dist 新增）|

### 6.3 git status 驗證

執行 `git status` 之輸出：

```
On branch main
nothing to commit, working tree clean
```

working tree clean；無 staged / unstaged 變動；無 untracked 檔案（dist/sitemap.xml + dist/robots.txt 被 `.gitignore` `dist/*` pattern 隱藏，不顯示於 untracked）。

### 6.4 validate baseline：✅ 維持

執行 `npm run validate:content`（per §2.2）後：

```
0 error(s) / 22 warning(s) on 17 post(s)
```

與 `docs/phase-1-completion-report.md` §3.2 之 `0/22/17` baseline 100% 一致；無 regression。

---

## §7 與 Phase 1 final 之關係

### 7.1 解除 phase-1-completion-report.md §8.9 之 sitemap 缺檔註記

`docs/phase-1-completion-report.md` §8.9（post-Phase-1 quick win 段落）原文：

> **8.9 `dist/sitemap.xml` + `dist/robots.txt` 補檔**
>
> - **狀態**：⏸ post-Phase-1 quick win
> - **範圍**：跑 `npm run build:sitemap` 補檔
> - **性質**：系統 ready；屬流程未跑而非系統缺漏
> - **建議**：列為下一批可選 quick win；可單獨成批或併入 Phase 8-h-b baseline run

**本批執行結果**：

- ✅ 已執行 `npm run build:sitemap`
- ✅ 已產出 `dist/sitemap.xml`（10 url entries）+ `dist/robots.txt`
- ✅ baseline 維持 `0/22/17`
- ✅ 無 source code / content / settings / package / config / dist 既有檔案變動
- ✅ 採「單獨成批」路線（**未**併入 Phase 8-h-b baseline run，per 用戶 spec 規則 3「不進入 Phase 8-h」）

### 7.2 對其他 post-Phase-1 deferred 項目之影響：✅ 無

| Phase 1 final §8 列出之後續強化 | 本批是否影響 |
|---|---|
| §8.1 Phase 9-g-g relatedLinks JSON-LD `mentions` / `isPartOf` | ❌ 無影響 |
| §8.2 Phase 9-f-g Book / Periodical structured data | ❌ 無影響 |
| §8.3 Phase 8-h legacy 退場 | ❌ 無影響 |
| §8.4 Phase 9-h-f Related Posts auto block | ❌ 無影響 |
| §8.5 Dormant article blocks | ❌ 無影響 |
| §8.6 Phase 8-g-1 fixture / sample end-to-end | ❌ 無影響 |
| §8.7 Phase 8-g candidate 6 | ❌ 無影響 |
| §8.8 Google Rich Results Test | ❌ 無影響 |
| §8.9 sitemap / robots 補檔 | ✅ **本批解除** |
| §8.10 圖書館類型 enum schema | ❌ 無影響 |

### 7.3 Phase 1 final 狀態：✅ 維持 final / completion snapshot

本批為 post-Phase-1 quick win；**不**重新打開 Phase 1 final 狀態；**不**升級 / 降級 `docs/phase-1-completion-report.md` 之 final 判定。

---

## §8 為什麼不 commit dist 檔（gitignored 設計）

### 8.1 .gitignore 設計理由

per `.gitignore` line 2-3：

```
dist/*
!dist/.gitkeep
```

`dist/*` 整體被 ignore；例外只有 `dist/.gitkeep`。這是專案標準 build output 慣例：

- **build output 不入 repo**：dist 為 `npm run build:*` 之衍生產出，可隨時重建；不適合進入版控
- **資料夾保留**：`dist/.gitkeep` 確保 `dist/` 目錄結構於 fresh clone 後仍存在
- **GitHub Pages 部署**：未來部署流程（手動 / CI）會獨立產出 dist 並推送至 `gh-pages` 分支或 GitHub Actions artifact；不依賴 main 分支之 dist
- **減少 commit 噪音**：build output 變動頻繁；若入版控會產生大量無實質意義之 commit

### 8.2 本批 dist 新增檔之處置

| 檔案 | git tracked | 是否進 commit | 處置 |
|---|---|---|---|
| `dist/sitemap.xml` | ❌ gitignored | ❌ 不 commit | 留於 filesystem；可被未來 `npm run build:sitemap` 覆寫 |
| `dist/robots.txt` | ❌ gitignored | ❌ 不 commit | 同上 |
| `dist/.gitkeep` | ✅ tracked | ❌ 不 commit（mtime 未變）| 維持既有 tracked 狀態 |

### 8.3 對未來部署之影響

- 本批產出之 dist 檔僅存在於 local working tree
- 未來部署 GitHub Pages 時，CI / 手動部署流程應重新跑 `npm run build` + `npm run build:sitemap` 取得最新 dist
- 本批**不**對應「準備 GitHub Pages 部署」之 deployment 批；屬內部 dev 流程之 baseline snapshot

---

## §9 邊界聲明

### 9.1 本文件嚴格邊界

- ✅ 本文件**僅為 baseline snapshot 封存**；不啟動任何後續強化批
- ✅ 本文件**不**啟動 Phase 8-h legacy 退場批（Phase 8-h-b ~ 8-h-z 仍未啟動）
- ✅ 本文件**不**啟動 Phase 9-g-g（relatedLinks JSON-LD `mentions` / `isPartOf`）
- ✅ 本文件**不**啟動 Phase 9-f-g（Book / Periodical structured data）
- ✅ 本文件**不**啟動 Phase 9-h-f（兩端 Related Posts auto block）
- ✅ 本文件**不**啟動 Google Rich Results Test 驗證批
- ✅ 本文件**不**處理 §3.3 觀察到之 we-media-myself2 cross-source mirror 不在 sitemap 之 gap（屬未來候選；建議獨立批次）
- ✅ 本文件**不**動既有 source code / 既有 EJS templates / 既有 build scripts / 既有 settings / 既有 content
- ✅ 本文件**不**改 `.gitignore`（既有 dist gitignored 設計維持）

### 9.2 與 Phase 8-h-b 之關係

- Phase 8-h-b 之**範圍更大**：完整 build × 5（github / blogger / promotion / sitemap / blogger-theme）+ validate + 7 個 report scripts + 各 dist 檔案 hash snapshot
- 本批僅執行 build × 5 之 **1 個指令**（`build:sitemap`）+ validate
- 本批產出之 baseline snapshot doc**不**取代 Phase 8-h-b 之 `docs/phase-8h-baseline-snapshot.md`（per `docs/phase-8h-pre-analysis.md` §6 規劃）
- 兩者為**獨立 baseline**：本批為 sitemap 專屬；Phase 8-h-b 為完整 dist regression 對照

### 9.3 與本批 commit 之關係

- 本批僅新增 `docs/phase-10-a-b-sitemap-robots-baseline.md` 1 個檔案
- dist 新增檔（sitemap.xml + robots.txt）為 gitignored；**不**進入 commit
- 本批 commit 範圍：**1 個 docs 檔案；單檔 commit**

---

## §10 Cross-links

### 10.1 主要引用基準

- `docs/phase-1-completion-report.md` §8.9（sitemap / robots dist 補檔 post-Phase-1 quick win 註記；本批解除）
- `docs/phase-8h-pre-analysis.md` §6（Phase 8-h-b 退場前 baseline run 規劃；mirror 本批 snapshot pattern）
- `docs/future-roadmap.md` §8.5 順序 2（Phase 8-h-b baseline run；本批為其前置 / 預演）

### 10.2 Phase 9-i / 9-j 系列封存

- `docs/phase-9h-known-blockers.md`（Phase 9-i 系列 3/3 known blockers 修復；其中 #2 之 site.config.json placeholder 修復為本批 sitemap host `babel-lab.github.io` 之前提）
- `docs/phase-9j-jsonld-landing-verification.md`（Phase 9-j JSON-LD landing verification 封存；與本批 sitemap 共為 Phase 5 SEO 落地補述）

### 10.3 Phase 5 SEO 落地紀錄

- `docs/seo-ga4-adsense.md` §5 / §7（Phase 5-c 落地 sitemap / robots 設計；本批為其首次 dist 輸出）
- `docs/checklists/seo-checklist.md`（SEO 驗收條目；含 sitemap / robots 檢查）

### 10.4 規範來源

- `CLAUDE.md` §21（GitHub 站需支援 sitemap.xml / robots.txt；本批達成）
- `CLAUDE.md` §27（Claude Code 修改規則；本批嚴格遵守「不動 source / 不改技術選型 / 不 push」之保守原則）

---

（本文件結束）
