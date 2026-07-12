# Blogger preview navigator B1 — one-post operational rehearsal（docs-only）

- 建立日期：2026-07-12（Asia/Taipei）
- 類型：docs-only **operational evidence 記錄**（唯一 mutation = 本 doc 新增；**不**改 source /
  content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` /
  `CLAUDE.md` / `MEMORY.md` / `memory/`；不新增 npm script；不動 `.gitignore`）
- 目的：把 `docs/20260710-blogger-preview-only-script-preanalysis.md` §6.1（B1 navigator）
  之 helper（source landing 見 `docs/20260712-preview-only-helper-implementation.md`（`cc6497b`）；
  operationalize / runbook / sanity / index / Route D 之 fold-in 見 `cae3123`）拉一次真實但完全
  唯讀之單篇 rehearsal，
  留下可重現操作證據，並交出「Dean 下一步人工 Blogger Preview」明確 stop line；不啟動 B2、
  不寫 Blogger、不動 sidecar、不 deploy。
- 觸發：Dean 於 2026-07-12 session briefing 明確要求：
  「執行一次真實但完全唯讀的 B1 one-post operational rehearsal」。
- 本輪界線（docs-only）：**不** build / **不** preview / **不** deploy / **不**碰 deploy clone 寫入 /
  **不**改任何 frontmatter / **不**改任何 sidecar `.publish.json` / **不**動 Blogger backfill 語意
  （`check:blogger-backfill` 維持 report-only）/ **不**猜 Blogger `bloggerPostId` /
  `publishedUrl` / `publishedAt` / **不**買網域 / **不**設 DNS / **不**建 `CNAME` / **不**建 `ads.txt` /
  **不**啟用 AdSense / **不**改 AdSense production behavior / **不**碰 Blogger / AdSense / GA4 /
  Google Drive / Search Console / DNS / domain 後台 / **不**動 `CLAUDE.md` / `MEMORY.md` /
  `memory/` / **不**新增 npm script / preview helper script / **不**動 `package.json` /
  `package-lock.json` / **不**新增 `dist-blogger-preview/` / **不**修改 `.gitignore`。
- 本輪允許 mutation：新增本檔（唯一）+ commit + push origin/main。

---

## 0. Boot baseline（本輪已驗）

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `cae3123` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅（read-only 驗證） | `0 / 0` | clean | absent ✅ |

Source HEAD full hash = `cae3123ac7316eaa2f68d62461b0f8255a4cfdbb`；subject
`docs(blogger): operationalize preview navigator`。

Deploy HEAD full hash = `1170e7e14aaa7f3449999bf92b9c8586719a76b4`（read-only 驗證；本 session
**未寫入** deploy clone）。

`.git/index.lock` 於 source repo 於本 rehearsal 前、中（每 CLI run 之後）、後皆 absent。

---

## 1. 結論（先講結果）

**A. Rehearsal PASS**。B1 navigator 於 3 種 CLI 模式（listing / focus / dry-run）之語意於本 rehearsal
均與 `docs/20260712-preview-only-helper-implementation.md` §11 acceptance / `cae3123` operationalize
之 runbook §C.5 / sanity §5.0 所述一致；helper 執行前後 source repo 之 `git status --short` 空、
tree hash 未變；`dist-blogger/` 之 mtime / size 未變；`--dry-run` 為 no-op（僅 stderr 一行 note）。

**B. 選定 slug = `we-media-myself2`**（原 briefing 指定 `20260708-phase1-e2e-smoke-test-20260708` 於現行
`content/` 內不存在；per Dean briefing §3「若指定 slug 已不符合目前契約，請依既有內容選擇一篇最適合的
ready／published 測試稿」，選定理由見 §2.2）。

**C. `dist-blogger/` 未重建**。既有 artifacts 於 baseline `cae3123` 之前已完成 build（mtime =
`2026-07-08T15:09:08.xxxZ`），4 檔全 exists / readable / 內部一致；navigator advice = 「complete —
open post.html and paste into Blogger HTML mode」。無需觸發 `npm run build:blogger`。

**D. 未發現 B1 defect**。listing 8 candidates / 6 filtered-out、focus 4/4 artifacts exists、text 與 JSON
輸出之關鍵欄位一致、`--dry-run` no-op、exit 0、無非預期 stderr（除 dry-run stderr note 為預期行為）。
navigator 沿用 preanalysis §6.1 / implementation §5 契約，未偵測到 code / doc drift。

**E. Recommendation = idle freeze**。B1 已 operational；B2 draft-aware preview build **未實作 / 未啟動**；
Dean 若欲實際將 `post.html` 貼入 Blogger Preview，人工單一步驟見 §9；stop line 見 §10。

---

## 2. Slug selection

### 2.1 Briefing 指定 slug 之現況

Briefing §3 指定：`20260708-phase1-e2e-smoke-test-20260708`。

實查：

```bash
find content -name "*phase1-e2e-smoke-test*" -o -name "*20260708-phase1-e2e*"
# → 0 matches
grep -rEl "phase1-e2e-smoke-test-20260708|phase1-e2e" content/
# → 0 matches
```

指定 slug **於現行 `content/` 內不存在**，且對應之 `.md` frontmatter / `.publish.json` sidecar 均無
記錄。合理推斷該 slug 於 briefing 撰寫時屬臨時假想 fixture，未 landed 進 repo。

### 2.2 選定替代 slug = `we-media-myself2`

依 briefing §3「若指定 slug 已不符合目前契約，請依既有內容選擇一篇最適合的 ready／published 測試稿」，
從 `check:blogger-preview` listing 之 8 candidates 內選定 `we-media-myself2`：

| 選擇準則 | `we-media-myself2` 表現 |
| --- | --- |
| ready / published 狀態 | ✅ `status: ready` / `draft: false`（listing PASS） |
| `publishTargets.blogger.enabled` | ✅ true |
| `publishTargets.blogger.mode` | `full`（B1 spec 支援；non-summary / non-redirect-card） |
| 4 artifacts 完整性 | ✅ 全 exists（post.html 8422 / copy-helper.txt 5998 / publish-checklist.txt 3158 / meta.json 4666） |
| 是 flagship E2E 對象 | ✅ 專案文件多處 reference（`CLAUDE.md` §3a A1 內容線 / `memory/project_blogger_repost_acceptance_we_media_myself2.md`） |
| 已含 dual-block `affiliate.blocks[]` | ✅ meta.json size 4666（單區塊約 2100 上下） |
| Blogger LIVE 狀態 | ✅ 20260610 night-2 manual paste PASS（`memory/project_blogger_repost_acceptance_we_media_myself2.md`）；因此 Dean 若欲進 Blogger Preview 之風險最低（Preview 本就不改動已 live 之 post） |
| 未列於 backfill blocked 名單 | ✅ 依 `docs/20260706-blogger-identity-and-backfill-strategy.md`，該篇僅缺 `bloggerPostId`（system field；不列 Dean 必填） |

不選其他候選之理由（簡短）：

- `after-work-writing-time-blocking` / `ai-tools-simplify-daily-workflow` / `blog-as-personal-knowledge-base` /
  `blog-restart-steady-rhythm-notes` / `daily-reading-habit-notes` / `reading-notes-three-questions`：
  皆 ready；但 `we-media-myself2` 為專案 flagship，rehearsal 收益 / 佐證強度較高。
- `portable-blog-system-mvp`：`source=github-cross` 且 `mode=summary`（redirect card 導流），
  artifacts size 較小（post.html 2536），rehearsal 不足以覆蓋 full 模式 artifacts。
- `ai-tools-simplify-daily-workflow`：目前列於 P2 live repost **BLOCKED**（`CLAUDE.md` §3a
  Dormant / blocked summary），選之會混淆 rehearsal 與 blocked repost；不選。

**未為了符合 rehearsal 而修改任何文章之 `status` / `draft` / frontmatter / sidecar**。

---

## 3. Pre-rehearsal state snapshot

執行 rehearsal 前之 source repo 狀態（read-only 驗證）：

```
git status --short              # 空
git rev-parse HEAD              # cae3123ac7316eaa2f68d62461b0f8255a4cfdbb
git rev-parse HEAD:             # 9417a5b698991f0ee4f690c8ec295bef02172478 (tree hash)
git rev-parse origin/main       # cae3123ac7316eaa2f68d62461b0f8255a4cfdbb
git rev-list --left-right --count origin/main...HEAD   # 0  0
```

`dist-blogger/posts/we-media-myself2/` 之既有 4 檔 mtime（rehearsal 前）：

| File | mtime | size |
| --- | --- | --- |
| `post.html` | `2026-07-08 23:09:08.824361900 +0800` | 8422 |
| `copy-helper.txt` | `2026-07-08 23:09:08.829885100 +0800` | 5998 |
| `publish-checklist.txt` | `2026-07-08 23:09:08.831888600 +0800` | 3158 |
| `meta.json` | `2026-07-08 23:09:08.827389100 +0800` | 4666 |

`dist-blogger/posts/` 存在之 9 個 slug 目錄：

```
after-work-writing-time-blocking, ai-tools-simplify-daily-workflow,
blog-as-personal-knowledge-base, blog-restart-steady-rhythm-notes,
daily-reading-habit-notes, github-pages-blog-planning, portable-blog-system-mvp,
reading-notes-three-questions, we-media-myself2
```

其中 `github-pages-blog-planning` 為 quarantine hold（`docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`），
仍存於 dist（歷史 build 產物）；listing 之 filtered-out 6 篇對應 `draft: true`。

**判定：`dist-blogger/` 不需重建**。所有 4 artifacts 對應之 `we-media-myself2` 已 complete
於 `cae3123` 之前建立、對本 rehearsal 為現行 canonical output；再跑 `npm run build:blogger`
將僅重置 mtime、不會改 semantic 內容；徒增 dist 變動且無新增證據。

---

## 4. Executed CLI（實際指令）

以下每支指令均直接以 `node src/scripts/check-blogger-preview.js` 呼叫（避免 npm banner 進 stdout
影響 JSON 解析）；語意與 `npm run check:blogger-preview -- <flags>` 完全相同。

### 4.1 Listing mode（一般文字輸出）

```bash
npm run check:blogger-preview                 # 或
node src/scripts/check-blogger-preview.js
```

摘要：

- mode = list
- distBloggerRootExists = true（`dist-blogger`）
- candidates = 8
- filtered-out = 6
- missing-slug = 0
- parse-failures = 0
- 每 candidate 4 檔全 exists
- pointers = runbook / sanity / admin export / preanalysis 全 4 條

尾行：`PASS blogger preview navigator (read-only; warning-only; no writes performed).`

### 4.2 Listing mode（`--json`）

```bash
node src/scripts/check-blogger-preview.js --json > <tmp>.json
```

JSON 主要欄位驗證（透過 `node -e` 讀 tmp）：

```
mode          = 'list'
candidateCount = 8
filteredOutCount = 6
distBloggerRootExists = true
entries[].slug = [after-work-writing-time-blocking, ai-tools-simplify-daily-workflow,
                  blog-as-personal-knowledge-base, blog-restart-steady-rhythm-notes,
                  daily-reading-habit-notes, portable-blog-system-mvp,
                  reading-notes-three-questions, we-media-myself2]
pointers      = [docs/20260708-blogger-draft-preview-runbook.md,
                 docs/20260710-blogger-preview-sanity-analysis.md,
                 docs/20260710-blogger-admin-export-workflow-alignment.md,
                 docs/20260710-blogger-preview-only-script-preanalysis.md]
```

**與 §4.1 text mode 之對照結果 = 一致**（candidates 8 / filtered-out 6 / 8 slug 完全對齊 /
distBloggerRootExists true）。

### 4.3 Focus mode（`--slug we-media-myself2`；text）

```bash
node src/scripts/check-blogger-preview.js --slug we-media-myself2
```

摘要：

```
mode:                focus
slug:                we-media-myself2
source path:         content/blogger/posts/20260515-we-media-myself2.md
source site:         blogger
blogger mode:        full
status:              ready
draft:               false
dist-blogger root:   dist-blogger
build command:       npm run build:blogger
---- dist outputs (dist-blogger/posts/we-media-myself2) ----
    post.html: exists  size=8422  mtime=2026-07-08T15:09:08.824Z
    copy-helper.txt: exists  size=5998  mtime=2026-07-08T15:09:08.830Z
    publish-checklist.txt: exists  size=3158  mtime=2026-07-08T15:09:08.832Z
    meta.json: exists  size=4666  mtime=2026-07-08T15:09:08.827Z
---- advice ----
  dist-blogger/posts/we-media-myself2/ complete — open post.html and paste into Blogger HTML mode
  (see docs/20260708-blogger-draft-preview-runbook.md §D-7).
```

尾行：`PASS blogger preview navigator (read-only; warning-only; no writes performed).`

### 4.4 Focus mode（`--slug we-media-myself2 --json`）

```bash
node src/scripts/check-blogger-preview.js --slug we-media-myself2 --json > <tmp>.json
```

JSON 主要欄位驗證：

```
mode                  = 'focus'
slug                  = 'we-media-myself2'
entry.sourceSite      = 'blogger'
entry.bloggerMode     = 'full'
entry.status          = 'ready'
entry.draft           = false
entry.candidate       = true
outputs.slugDir       = 'dist-blogger/posts/we-media-myself2'
outputs.dirExists     = true
outputs.files[0-3]    = 全 exists（size / mtime 與 §4.3 text 完全對齊）
advice                = 同 §4.3
```

### 4.5 `--dry-run`（相容性 no-op）

```bash
node src/scripts/check-blogger-preview.js --slug we-media-myself2 --dry-run
```

- stderr 首行：`[check-blogger-preview] note: --dry-run is a no-op (navigator is read-only)`
- stdout：與 §4.3 focus mode 之 text 輸出**完全相同**（未省略任何欄位）
- exit code = 0

**No-op 驗證**：`git status --short` 空、`git rev-parse HEAD:` 保持 `9417a5b6...`、
`dist-blogger/posts/we-media-myself2/` 之 4 檔 mtime **完全不變**（詳 §5.2）。

---

## 5. Artifact paths（實際檔案）

### 5.1 4 檔實際 workspace 路徑（相對 project root）

```
dist-blogger/posts/we-media-myself2/post.html
dist-blogger/posts/we-media-myself2/copy-helper.txt
dist-blogger/posts/we-media-myself2/publish-checklist.txt
dist-blogger/posts/we-media-myself2/meta.json
```

### 5.2 Metadata cross-check

```
meta.json.slug        = 'we-media-myself2'
meta.json.title       = '貝果書屋-AI玩轉自媒體的52個商業思維#2(提問筆記書)'
meta.json.bloggerMode = 'full'
meta.json.canonical.raw       = 'auto'
meta.json.canonical.resolved  = 'https://babel-lab.blogspot.com/2026/05/we-media-myself2.html'
meta.json.canonical.warning   = null
```

`post.html` 前 400 字元含：

```html
<div class="lab-blogger-article">
  <link rel="canonical" href="https://babel-lab.blogspot.com/2026/05/we-media-myself2.html" />
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"BlogPosting",...}
```

- ✅ 首層 `<div class="lab-blogger-article">` 符合 `CLAUDE.md` §10 之 Blogger 文章外層 class 契約
- ✅ `<link rel="canonical">` 與 `meta.json.canonical.resolved` 對齊
- ✅ JSON-LD `@id` 與 canonical 對齊

`copy-helper.txt` 前 12 行含：

```
Blogger 發布輔助 - 貝果書屋-AI玩轉自媒體的52個商業思維#2(提問筆記書)
slug:       we-media-myself2
mode:       full
sourcePath: content/blogger/posts/20260515-we-media-myself2.md
builtAt:    2026-07-08T15:09:05.845Z
...
[1] Blogger 標題（貼到「文章標題」欄位）
```

`publish-checklist.txt` 前 12 行含：

```
Blogger 發布檢查清單 - 貝果書屋-AI玩轉自媒體的52個商業思維#2(提問筆記書)
slug:    we-media-myself2
mode:    full
builtAt: 2026-07-08T15:09:05.845Z
基本欄位（共通）
```

- ✅ slug / mode 三檔一致
- ✅ `builtAt` 兩檔一致（都是 `2026-07-08T15:09:05.845Z`）
- ✅ title 三檔一致（copy-helper / publish-checklist 顯示 title / meta.json 存 title）

### 5.3 rehearsal 全程 mtime 未變證明

以下 mtime 於 §3 pre-run / §4.5 post-dry-run 均相同（`2026-07-08 23:09:08.xxxxxxx +0800`）：

| File | mtime（rehearsal 前後皆同） |
| --- | --- |
| `post.html` | `23:09:08.824361900` |
| `copy-helper.txt` | `23:09:08.829885100` |
| `publish-checklist.txt` | `23:09:08.831888600` |
| `meta.json` | `23:09:08.827389100` |

---

## 6. Git tree 前後對照

| 檢查點 | `git status --short` | `git rev-parse HEAD:`（tree hash） |
| --- | --- | --- |
| Pre-navigator（rehearsal 開始）| 空 | `9417a5b698991f0ee4f690c8ec295bef02172478` |
| After §4.1 listing text | 空 | `9417a5b698991f0ee4f690c8ec295bef02172478` |
| After §4.2 listing JSON | 空 | `9417a5b698991f0ee4f690c8ec295bef02172478` |
| After §4.3 focus text | 空 | `9417a5b698991f0ee4f690c8ec295bef02172478` |
| After §4.4 focus JSON | 空 | `9417a5b698991f0ee4f690c8ec295bef02172478` |
| After §4.5 dry-run | 空 | `9417a5b698991f0ee4f690c8ec295bef02172478` |

Working tree 於 rehearsal 全程僅落在 `$TMPDIR` 之暫存 JSON 檔（每次即讀即刪；未進 repo）。
`.git/index.lock` 於 rehearsal 全程 absent。

---

## 7. Findings（本 rehearsal 之發現）

### 7.1 B1 defect（none）

Rehearsal 過程未偵測到 B1 defect：

- ✅ CLI shape（`--slug` / `--json` / `--dry-run` / `--help`）與 preanalysis §10 / implementation §5 一致
- ✅ Text 與 JSON 輸出之關鍵欄位一致（`candidateCount` / `filteredOutCount` /
  `distBloggerRootExists` / 8 slug 清單 / focus 之 4 檔存在性 / advice 全對齊）
- ✅ `--dry-run` 為 no-op（tree hash / mtime 全未變；stderr note 為預期）
- ✅ exit 0（listing / focus / dry-run 全 0；即使指定不存在 slug 之情況亦 exit 0，符合 §6.1 契約，
  本 rehearsal 未觸發，見 §7.3）
- ✅ Advice 語意分岔（`complete` / `MISSING` / `filtered` / `not found`）與 preanalysis §6.1 一致
- ✅ Pointers 4 條全指向存在 doc
- ✅ 未新增 `dist-blogger-preview/`、未動 `.gitignore`

### 7.2 Doc drift（none）

`docs/20260708-blogger-draft-preview-runbook.md` §D-7 之 pointer 有效；navigator advice 指向該 §
可實際導 Dean 至下一步。`docs/20260710-blogger-preview-sanity-analysis.md` §5 之 40 項 checklist
於本 rehearsal 未進行（rehearsal stop line 於 Blogger paste 之前，見 §10）。

### 7.3 未於本 rehearsal 覆蓋之情況（合理範圍外）

以下情況本 rehearsal **未主動觸發**，屬 preanalysis §6.1 已規範但 rehearsal scope 外：

- 指定不存在之 slug（e.g. `--slug something-that-does-not-exist`）之 exit 0 + `not found` advice
- 指定 `draft: true` slug 之 `filter reason` advice
- `dist-blogger/` 整包不存在時之 `run npm run build:blogger` advice
- 4 檔僅缺一部分時之 `re-run npm run build:blogger` advice

以上均由 `check:blogger-preview-smoke`（49/49，本 slice 未跑）覆蓋；rehearsal 目的為單篇 happy-path，
非全面 case 覆蓋。

---

## 8. Regression checks 執行結果

本 rehearsal 為 docs-only slice，regression check 目的為確認 rehearsal 未副作用寫入、carry-forward
baseline 未 drift（rehearsal 前 read-only；rehearsal 後於本 slice docs 落地前一次驗）。

| # | 指令 | Exit | 結果 | 對照 baseline |
| --- | --- | --- | --- | --- |
| R-1 | `npm run check:blogger-preview-smoke` | 0 | 49/49 PASS | 對照 `docs/20260712-preview-only-helper-implementation.md` §11：49/49 ✅ 相同 |
| R-2 | `npm run check:npm-script-targets` | 0 | 59/59 PASS | 對照 `docs/20260712-preview-only-helper-implementation.md` §0：57/57 → 本 slice 前既有 59/59（B1 operationalize `cae3123` 為 docs-only、未新增 script） ✅ 相同 |
| R-3 | `npm run validate:content` | 0 | 0 error / 135 warning / 107 post | 對照 `CLAUDE.md` §Validation baseline：0/135/107 ✅ 相同 |
| R-4 | `npm run check:github-pages-prepublish` | 0 | 16/16 PASS | 對照 `CLAUDE.md` §Validation baseline：16/16 ✅ 相同 |
| R-5 | `npm run check:github-pages-prepublish-smoke` | 0 | 8/8 PASS | 對照 `CLAUDE.md` §Validation baseline：8/8 ✅ 相同 |
| R-6 | `npm run check:phase1-readiness` | 0 | umbrella exit 0 | 對照 `docs/20260710-phase1-rc-docs-index.md` §4：exit 0 ✅ 相同 |
| R-7 | `npm run check:blogger-backfill` | 0 | scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5（report-only） | 對照 baseline：完全相同、未 drift ✅ |
| R-8 | `git diff --check` | 0 | no whitespace errors | rehearsal 期間 tree 未動 ✅ |

135 warnings 之組成未變化（1 production expected warning +
`content/validation-fixtures/` 一組；per `CLAUDE.md` §Validation baseline）。

---

## 9. Dean 人工 Blogger Preview 之下一步（明確 stop line 前之單一步驟）

若 Dean 判斷欲**實際**進行 Blogger Preview（非 rehearsal 必要；本 rehearsal 停在此步驟之前）：

**下一單一步驟**：

```
1. 於本機以文字編輯器或 VS Code 開啟：
   dist-blogger/posts/we-media-myself2/post.html
2. 依 docs/20260708-blogger-draft-preview-runbook.md §D-7 之指引，
   於 Blogger 後台文章編輯器切換至 HTML 模式，貼上完整 post.html 內容。
3. 於 Blogger 後台按「預覽 / Preview」（切記：不是「發布 / Publish」）。
4. 依 docs/20260710-blogger-preview-sanity-analysis.md §5 之 40 項 checklist
   於瀏覽器逐項勾選（Dean 手動；Claude 不代勾）。
```

以上步驟**由 Dean 手動於瀏覽器完成**；Claude 於本 session 不代 Dean 執行。

---

## 10. 明確 stop line（本 rehearsal 之邊界）

本 rehearsal 明確停在以下 stop line **之前**（cumulative；違反即 abort）：

| 項目 | 狀態 |
| --- | --- |
| **B2** draft-aware preview build 實作 | ❌ 未進入（未新增 `dist-blogger-preview/`、未動 `.gitignore`、未加 PREVIEW-ONLY marker） |
| Blogger 後台任何動作（login / paste HTML / preview 按鈕 / 發布 / draft flip / URL 設定 / 標籤設定 / 圖片上傳） | ❌ 未動 |
| `.publish.json` sidecar 任何 true value 修改（`bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId`） | ❌ 未動 |
| GitHub Pages 任何 deploy（新 push gh-pages / 更新 `dist/`） | ❌ 未動 |
| Deploy repo（`portable-blog-deploy`）任何寫入 | ❌ 未動（本 rehearsal 對 deploy clone 僅 §0 read-only 驗證） |
| `content/**/*.md` frontmatter 任何修改（含未主動 flip 任何 `draft: true`） | ❌ 未動 |
| `content/settings/*.json` 任何修改 | ❌ 未動 |
| `package.json` / `package-lock.json` 修改 / 新增 npm script | ❌ 未動 |
| 新增任何 helper script / guard | ❌ 未做 |
| `dist-blogger/` 重建 / 內容修改 / mtime touch | ❌ 未動（詳 §5.3 mtime 對照） |
| `CLAUDE.md` / `MEMORY.md` / `memory/**` | ❌ 未動 |
| AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 | ❌ 未動 |
| 猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId` | ❌ 未猜 |
| 升級 `check:blogger-backfill` 或任何 report-only guard 為 fail-fast | ❌ 未升級 |
| Phase 1 final 之降級 / 重新封存 | ❌ 未動 |
| CLAUDE.md 大型 ledger 回寫 | ❌ 未做 |

---

## 11. Recommendation

**Recommendation = idle freeze**（沿用 `CLAUDE.md` §3a Recommended next paths；
`docs/20260710-phase1-rc-next-phase-route-selection.md` §8；
`docs/20260712-preview-only-helper-implementation.md` §12）。

理由：

1. B1 navigator 於本 rehearsal 已證明 operationally sound（listing / focus / dry-run 三模式 PASS、
   4 artifacts 完整、metadata 內部一致、tree / mtime 未動、`--dry-run` no-op、exit 0）。
2. 未偵測到 B1 defect 或 doc drift；無 code / guard fix 需要於本 slice 加入。
3. B2 draft-aware preview build **未實作 / 未啟動**；啟動須另開 phase + Dean explicit approval
   （見 `docs/20260710-blogger-preview-only-script-preanalysis.md` §6.2 / §11、
   `docs/20260710-phase1-rc-next-phase-route-selection.md` §3 Route D）。
4. Dean 若欲下一單一步驟（實際 Blogger Preview 手動）見 §9；stop line 見 §10。
5. Phase 1 RC baseline 於本 rehearsal 已再驗、未 drift（`check:phase1-readiness` exit 0；
   validate 0/135/107；deploy clone 未動）。

---

## 12. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔（+ 對應 commit + push origin/main）。**不含**任何
程式 / frontmatter / settings / sidecar / build / deploy / dev-server 變更；未新增 guard /
npm script / preview-only script / helper script / smoke fixture；未改 `.gitignore`；未改 CSS；
未改 `CLAUDE.md` / `MEMORY.md` / `memory/`；未觸碰 deploy clone 寫入；未 build / 未產 dist /
未 deploy / 未 push gh-pages；未發布 Blogger；未購買網域 / 未動 DNS / 未碰 AdSense / GA4 /
Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`；未猜 Blogger `bloggerPostId` /
`publishedUrl` / `publishedAt` / `bloggerBlogId`；未從任何 metadata 推導 Blogger internal ID；
未新增測試文章 / artifact；未建 `CNAME` / `ads.txt`（含 placeholder / fake）；未動
`content/settings/ads.config.json`；未升級任何 report-only guard 為 fail-fast；未新增
`dist-blogger-preview/`；未進入 B2；未按 Blogger 發布；未寫回 Blogger URL / postId / publishedAt。
§0 boot baseline 為本 session read-only 驗證；§2 slug selection rationale 為 B1 spec + 現行
`content/` 內容 + `memory/` 佐證；§4 CLI 指令為 `check:blogger-preview` 於 `cae3123` 之現行語意，
未 patch；§5 artifact paths / metadata 為 `cae3123` 前既有 `dist-blogger/` 之現行 build（mtime
`2026-07-08T15:09:08.xxxZ`），未於本 rehearsal 觸發 rebuild；§6 tree 對照為 rehearsal 全程 5 個
檢查點之實際 `git rev-parse HEAD:`；§8 regression checks 為本 slice 允許之 read-only 驗證；
§9 Dean 手動 next step 明說由 Dean 執行、Claude 不代；§10 stop line 為 cumulative；§11
recommendation 沿用既有 idle freeze 路線；§12 為本 slice 變更安全性宣告。

---

## See also

- `docs/20260712-preview-only-helper-implementation.md`（B1 navigator source slice landing ledger；
  2026-07-12；`cc6497b`；`check:blogger-preview` + `check:blogger-preview-smoke` 49/49）
- Commit `cae3123`（B1 navigator operationalize slice；2026-07-12；docs-only fold-in
  `docs/20260708-blogger-draft-preview-runbook.md` §C.5 / §D-6 / §I、
  `docs/20260710-blogger-preview-sanity-analysis.md` §5.0 / §4、
  `docs/20260710-phase1-rc-docs-index.md` §5 / §7 / §8、
  `docs/20260710-phase1-rc-next-phase-route-selection.md` §3 Route D）
- `docs/20260710-blogger-preview-only-script-preanalysis.md`（B1 navigator / B2 draft-aware
  preview build preanalysis；本 rehearsal 之 spec 上位）
- `docs/20260708-blogger-draft-preview-runbook.md`（Blogger draft-preview 6 步；navigator advice
  之下一步指向 §D-7；Dean 手動 Preview 由此執行）
- `docs/20260710-blogger-preview-sanity-analysis.md`（Blogger preview 40 項 sanity checklist；
  Dean 於 Blogger Preview 按下之後逐項勾選；rehearsal 未進入此步驟）
- `docs/20260710-blogger-admin-export-workflow-alignment.md`（Admin `#blogger-export` 資料來源 audit +
  Admin→build→dist→Blogger paste 4 步 workflow；navigator 沿用相同資料來源契約）
- `docs/20260710-phase1-rc-next-phase-route-selection.md` §3 Route D（preview-only helper route；
  B1 為本 route 之當前 landed 部分；B2 blocked）
- `docs/20260710-phase1-rc-docs-index.md` §5（preview-only helper B1 / B2 狀態列表）
- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger identity 分層 policy；
  `bloggerPostId` 屬 system field / 不列 Dean 必填之依據）
- `memory/project_blogger_repost_acceptance_we_media_myself2.md`（`we-media-myself2` 為
  Blogger LIVE flagship 對象之依據）
- `memory/project_baseline.md`（frozen source / deploy baseline）
- `memory/project_report_only_metadata_guards.md`（8 warning-only guards + release-readiness
  umbrella；R-7 backfill guard 為其一）
- `CLAUDE.md` §3a Current state snapshot（Red lines / Recommended next paths；本 rehearsal
  之上位契約）
- `CLAUDE.md` §10（Blogger 文章 HTML 之 `lab-blogger-article` 外層 class 契約；§5.2 已驗）
- `CLAUDE.md` §21（canonical / primaryPlatform；§5.2 已驗）
- `CLAUDE.md` §24（Blogger 發布 URL 回填；rehearsal 未動）
- `CLAUDE.md` §27（Claude Code 修改規則；本 rehearsal 遵守「修改前先說明 / 修改後回報」）
- `CLAUDE.md` §29（第一版不做；本 rehearsal 未違反任何一項）

---

（本文件結束 / end of document）
