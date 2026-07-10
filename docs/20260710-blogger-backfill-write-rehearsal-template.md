# Blogger backfill write-phase rehearsal template（docs-only；WP-01）

- 建立日期：2026-07-10（Asia/Taipei）
- 類型：docs-only **rehearsal template**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 對應 work package：`docs/20260710-phase2-next-work-scope-preanalysis.md` §4 **WP-01** — Blogger backfill write-phase rehearsal（docs-only；含 dry-run runbook / rollback drill）。
- 目的：在 WP-02（真實 sidecar 寫入）**尚未**啟動之前，把「若未來啟動 WP-02 那一天，實際會做什麼、按什麼順序、如何驗、如何 rollback」以 rehearsal 表格 / mock 命令 / rollback 演練整理成一份可 offline 走一遍的模板。**不填任何真值、不寫任何 sidecar、不動 guard 語意、不猜 Blogger IDs / URL / publishedAt**。
- 本輪界線（docs-only）：**不** build / **不** preview / **不** deploy / **不**碰 deploy clone 寫入 / **不**改任何 frontmatter / **不**改任何 sidecar `.publish.json` / **不**動 `check:blogger-backfill` guard 語意（維持 report-only / warning-only / exit 0）/ **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / **不**買網域 / **不**設 DNS / **不**建 `CNAME` / **不**建 `ads.txt` / **不**啟用 AdSense / **不**改 AdSense production behavior / **不**碰 Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 / **不**動 `CLAUDE.md` / `MEMORY.md` / `memory/` / **不**新增 npm script / preview helper script / **不**動 `package.json` / `package-lock.json` / **不**進入 WP-02 真實寫入。
- 本輪允許 mutation：新增本檔（唯一）+ 對應 commit + push origin/main。

---

## 0. Boot baseline（本輪已驗）

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `4d88165` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅（read-only 驗證） | `0 / 0` | clean | absent ✅ |

Source HEAD full hash = `4d881655499410404b55a2c304e2dc7561ee8c2c`；subject `docs(phase2): analyze next work scope`（前一 session 落地之 Phase 2 20-WP preanalysis；`docs/20260710-phase2-next-work-scope-preanalysis.md` 為當時唯一 mutation）。前 4 commit：`ca9e94f`（`docs(phase1): analyze next phase routes`）→ `a52ff4c`（`docs(state): add phase1 rc docs index`）→ `abc707c`（`docs(blogger): record preview-only helper preanalysis`）→ `c0ee384`（`docs(release): define domain adsense gates`）→ `e477a75`（`docs(blogger): record backfill write preflight`）。

Deploy HEAD full hash = `1170e7e14aaa7f3449999bf92b9c8586719a76b4`（read-only 驗證；本 session **未寫入** deploy clone）。

Readiness checks 本輪已跑（read-only；exit 0）：

| # | 指令 | Exit | 結果 |
| --- | --- | --- | --- |
| C-1 | `npm run check:phase1-readiness` | 0 | validate 0/135/107、npm-script-targets 48/48、adsense-mode-metadata scanned 17 / warnings 0、blogger-backfill scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5（report-only）、prepublish 16/16、smoke 8/8 |
| C-2 | `npm run check:phase1-readiness-contract` | 0 | 22/22 PASS（1 parseable + 1 script-present + 6 required + 13 forbidden absent + 1 ordered 6/6） |
| C-3 | `npm run check:blogger-backfill` | 0 | scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5；7 篇 WARN 逐項與既有 baseline 相符 |

判定：baseline 完全一致；readiness 未 drift；backfill guard 維持 report-only；deploy clone 未動；`.git/index.lock` 皆 absent。

**Previous session 截斷資訊補確認**：

- 上一 session commit `4d88165` 之完整 subject 已 `git log -1 --oneline` 復核 = `docs(phase2): analyze next work scope`。
- 上一 session 新增之 docs 檔完整檔名 = `docs/20260710-phase2-next-work-scope-preanalysis.md`（`git show --name-only 4d88165` 顯示為唯一 mutation）。
- 上一 session 未動 program / content / frontmatter / sidecar / settings / views / scripts / package.json / lockfile / dist / gh-pages / CLAUDE.md / MEMORY.md / memory；符合上一 session docs-only 契約。

---

## 1. 結論（先講結果）

**A. 本 doc 是 WP-01 之落地**：於 `docs/20260710-blogger-backfill-write-phase-preflight.md`（preflight；scope gate / dry-run / validation / rollback proposed）+ `docs/20260710-phase2-next-work-scope-preanalysis.md` §4 WP-01 之上，追加一份「offline 可走完的 rehearsal 模板」。**本 doc 不含任何 Blogger 真值、不寫任何 sidecar、不動任何 guard**。

**B. Rehearsal template 內容**：（i）Dean 未來若進 WP-02 可 fill 之空白 input table；（ii）dry-run 命令範例（於 stdout，不落地檔案）；（iii）Apply / commit / validation / rollback 之逐步 checklist（皆標記 `Future WP-02 only`）；（iv）rollback drill 之演練說明（模擬 abort、模擬 sidecar removal、模擬 `check:blogger-backfill` re-verify）。

**C. WP-01 rehearsal 之邊界**：本 doc **只**是模板；**不代**啟動 WP-02、**不代** Dean 決策。若 Dean 未來 session 明確聲明「進入 WP-02」+ 提供真值 + 明列篇目，Claude 才可依 preflight §7–§10 + 本 doc §4–§8 執行。若 Dean 未來 session 只想再 walkthrough 一遍模板 / 補齊 rehearsal 細節（例：新增 rollback drill 情境），仍屬 WP-01 之後續 slice，仍是 docs-only。

**D. Recommendation = remain rehearsal-only until Dean provides real values and explicitly approves WP-02**（沿用 preflight §12；`CLAUDE.md` §3a Red lines「不猜 postId / publishedAt」）。本 doc landing 後回到 idle freeze。

---

## 2. Relationship to WP-01 and WP-02

三者關係（不覆蓋、不重複、不 downgrade）：

```
docs/20260710-blogger-backfill-write-phase-preflight.md      ← 前置條件 / gate / dry-run / validation / rollback proposed（規則面）
    │
    ├── docs/20260710-phase2-next-work-scope-preanalysis.md §4 WP-01  ← Phase 2 work-package 拆分中之 WP-01（planning 面）
    │
    └── 本 doc（WP-01 rehearsal template）                   ← 把上述兩份濃縮為 offline 可走完之 rehearsal 模板（練習面）
                │
                └── 未來 WP-02 landing（Dean-approved）      ← 真實 sidecar 寫入；本 doc 不代啟動、不代 Dean 決策
```

**本 doc 定位**：

- 屬 WP-01（docs-only）；本 doc 落地 = WP-01 完成一個小切片（第一份 rehearsal template）。
- **不**屬 WP-02；不觸發真實寫入；本 doc 完成後 write phase 仍 dormant / blocked。
- 未來若 Dean 想擴充 rehearsal（例：加更多 rollback 情境 / 加 sidecar-present partial update case），仍為 WP-01 後續 slice，各自新增 docs、皆為 docs-only。
- WP-02 若啟動，仍為獨立 phase、獨立 approval、獨立 gate；本 doc 不代任何一步實作。

**本 doc 不做**：

- **不**新增 npm script（例：`npm run backfill:rehearsal` / `backfill:dry-run` / `backfill:apply`）。
- **不**新增 helper script（例：`src/scripts/backfill-rehearsal.js`）。
- **不**新增 fixture 檔（例：`content/validation-fixtures/backfill/*`）。
- **不**改 `check:blogger-backfill` guard 語意（維持 report-only / warning-only / exit 0）。
- **不**改 `check:phase1-readiness-contract` 之 forbidden token list（`backfill:url` / `admin:write` / `safe-write` / `write` / `publish` 皆維持缺席）。

---

## 3. Current report-only backfill baseline（recap；未動語意）

`check:blogger-backfill`（本 session 實測）exit 0；`scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5`。

Guard 契約（`docs/20260706-blogger-backfill-report-only-baseline.md` §2；未動）：

1. 正常路徑 `return 0` → **exit 0**；唯 script crash / IO error 才 exit 1
2. 即使有 candidate 缺 backfill，**不 fail**（warning-only）
3. 全程只 `console.log`；**不寫任何檔**（僅 `fs.readFile`；無 write / mkdir）
4. **不修改** frontmatter（`gray-matter` 只 parse，從不 re-serialize 回寫）
5. **不猜測** `publishedUrl` / `bloggerPostId` / `publishedAt`（`resolveBackfillValue` 只讀既有值）

7 篇 missing candidate 逐項對照（本 session 實測 = 沿用 predecessor docs；**未動**）：

| # | source markdown | sidecar | status | missing fields |
| --- | --- | --- | --- | --- |
| 1 | `content/blogger/posts/20260515-we-media-myself2.md` | **present**（`content/blogger/posts/20260515-we-media-myself2.publish.json`）| ready | `blogger.bloggerPostId`（`publishedUrl` / `publishedAt` 已由 sidecar 提供） |
| 2 | `content/blogger/posts/20260612-after-work-writing-time-blocking.md` | absent | ready | 全 3 欄（`publishedUrl` / `bloggerPostId` / `publishedAt`）|
| 3 | `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md` | absent | ready | 全 3 欄 |
| 4 | `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md` | absent | ready | 全 3 欄 |
| 5 | `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md` | absent | ready | 全 3 欄（**caveat**：Blogger LIVE published 2026-06-17 有 Dean 截圖佐證，但 backfill 值仍待 Dean 從後台回填；不可從 CLAUDE.md 記載反推）|
| 6 | `content/blogger/posts/20260612-daily-reading-habit-notes.md` | absent | ready | 全 3 欄 |
| 7 | `content/blogger/posts/20260612-reading-notes-three-questions.md` | absent | ready | 全 3 欄 |

**Identity policy（`docs/20260706-blogger-identity-and-backfill-strategy.md`；未動）**：`bloggerPostId` 屬 §A.3 系統欄位，即使 Dean 手動亦取不到；待未來 Blogger API flow 落地由系統於 publish/update response 取得。**Dean 不列必填**該欄位。因此本 rehearsal 模板中 `bloggerPostId` 欄位一律留空、標記 `API-only / not manually required`。

---

## 4. Required Dean input table template（rehearsal only；Dean 未來若進 WP-02 才填）

以下表為 **rehearsal 空白模板**；本 doc **不填任何真值**。Dean 於未來 WP-02 session 提供時，可 copy 到新 doc 或 chat message 中填寫；**不必**直接改本 rehearsal doc（本 doc 為模板；填寫應於另一 doc 或 approval message 中）。

**建議填寫顆粒度**：Dean 於一次 approval 中可選（i）1 篇（Claude 建議之最保守 first slice）或（ii）全 6 篇 sidecar-absent + 1 篇 sidecar-present partial update（Dean 明示接受批量）；本 doc 不代決策。

### 4.1 模板（per candidate；每欄之預期值形態）

| 欄位 | 描述 | 期望格式 | 是否必要 | 資料來源 | 備註 |
| --- | --- | --- | --- | --- | --- |
| `local content id / slug` | markdown 檔案之 slug（不含日期前綴） | e.g. `after-work-writing-time-blocking` | ✅ 必要 | markdown 檔名 | 不改 markdown；只為對應 sidecar 路徑 |
| `markdown path` | 對應 markdown 之 repo 相對路徑 | e.g. `content/blogger/posts/20260612-after-work-writing-time-blocking.md` | ✅ 必要 | repo 檔案系統 | 不改 markdown |
| `sidecar path` | 對應 sidecar 之 repo 相對路徑 | e.g. `content/blogger/posts/20260612-after-work-writing-time-blocking.publish.json` | ✅ 必要 | 由 markdown 檔名衍生（同名 `.publish.json`） | write scope 白名單 |
| `sidecar action` | `update` / `create` | `update`（sidecar-present partial fields）or `create`（sidecar-absent） | ✅ 必要 | 對照 §3 表 | `we-media-myself2` = update；6 篇 20260612-* = create |
| `blogger.title` | Blogger 後台顯示標題（visible title） | 純文字 | 選填（記錄用；不寫入 sidecar；sidecar schema 目前無此欄位） | Dean 從 Blogger 後台複製 | 若 Dean 想留 rehearsal 對照，可寫進 note；不進 sidecar |
| `blogger.publishedUrl` | Blogger 已發布正式網址 | e.g. `https://<blogger-domain>/YYYY/MM/<permalink>.html` | ✅ 必要（`we-media-myself2` 除外；已由 sidecar 提供） | Dean 從 Blogger 後台複製 | **不猜、不從 slug 推導** |
| `blogger.publishedAt` | Blogger 已發布 / 更新時間 | ISO 8601（e.g. `2026-06-12T10:30:00+08:00`）或 `YYYY-MM-DD`；取決於既有 sidecar 慣例 | ✅ 必要（`we-media-myself2` 除外；已由 sidecar 提供） | Dean 從 Blogger 後台複製 | **不猜、不從 markdown `date` 推導**（Blogger publishedAt 與 GitHub `date` 可不同，非錯誤） |
| `blogger.permalink` | Blogger URL slug 部分（`YYYY/MM/<permalink>.html` 之 `<permalink>`） | 純文字 | ✅ 必要（若 `create` action） | Dean 從 Blogger 後台複製 | 若與 markdown slug 相同 Dean 可明示；若不同 Dean 需明列真值 |
| `blogger.publishYear` | Blogger URL 之年份部分 | e.g. `2026` | ✅ 必要（若 `create` action） | Dean 從 Blogger 後台複製 | 為 `publishedUrl` 之 yyyy 部分；`publishedUrl` filled 後亦可從 URL 導出、但仍以 Dean 提供為準 |
| `blogger.publishMonth` | Blogger URL 之月份部分 | e.g. `6`（or `06`；取決於既有 sidecar 慣例） | ✅ 必要（若 `create` action） | Dean 從 Blogger 後台複製 | 同上 |
| `blogger.bloggerPostId` | Blogger 內部 post ID | **不填**；一律 `""`（空字串） | ❌ **不必要**（API-only / not manually required） | 未來 Blogger API flow 之 publish/update response | **絕不**由 Dean 手動猜；**絕不**由 Claude 推導 |
| `optional note / source of truth` | Dean 想留之備註 / 資料來源說明 | 純文字 | 選填 | Dean 明示 | 若有，寫在 approval message 中；不進 sidecar schema |

### 4.2 模板表（7 篇；全數留空；Dean 未來若進 WP-02 才 fill）

| # | slug | markdown path | sidecar path | sidecar action | title | publishedUrl | publishedAt | permalink | publishYear | publishMonth | bloggerPostId | note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `we-media-myself2` | `content/blogger/posts/20260515-we-media-myself2.md` | `content/blogger/posts/20260515-we-media-myself2.publish.json` | `update` | *（Dean to provide 若想記錄）* | *（sidecar 已 present，不動）* | *（sidecar 已 present，不動）* | *（sidecar 已 present，不動）* | *（sidecar 已 present，不動）* | *（sidecar 已 present，不動）* | `""` API-only | 只補 `bloggerPostId`；當前 phase 不寫、留空 |
| 2 | `after-work-writing-time-blocking` | `content/blogger/posts/20260612-after-work-writing-time-blocking.md` | `content/blogger/posts/20260612-after-work-writing-time-blocking.publish.json` | `create` | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | `""` API-only | 新建 sidecar；三值全缺 |
| 3 | `ai-tools-simplify-daily-workflow` | `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md` | `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.publish.json` | `create` | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | `""` API-only | 新建 sidecar；三值全缺 |
| 4 | `blog-as-personal-knowledge-base` | `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md` | `content/blogger/posts/20260612-blog-as-personal-knowledge-base.publish.json` | `create` | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | `""` API-only | 新建 sidecar；三值全缺 |
| 5 | `blog-restart-steady-rhythm-notes` | `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md` | `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.publish.json` | `create` | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | `""` API-only | 新建 sidecar；三值全缺；**caveat**：本篇有 CLAUDE.md 記載 Blogger LIVE 2026-06-17，但真值仍待 Dean 提供、不可預設 |
| 6 | `daily-reading-habit-notes` | `content/blogger/posts/20260612-daily-reading-habit-notes.md` | `content/blogger/posts/20260612-daily-reading-habit-notes.publish.json` | `create` | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | `""` API-only | 新建 sidecar；三值全缺 |
| 7 | `reading-notes-three-questions` | `content/blogger/posts/20260612-reading-notes-three-questions.md` | `content/blogger/posts/20260612-reading-notes-three-questions.publish.json` | `create` | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | *（Dean to provide）* | `""` API-only | 新建 sidecar；三值全缺 |

**注意**：本表為模板；本 doc landing 時，所有欄位仍為 `Dean to provide` / `""`（或本輪 rehearsal 之對應說明）；**不含任何真值**。

### 4.3 期望 sidecar 落地形態（rehearsal only；不實寫）

對 `create` case（6 篇 sidecar-absent），預期 sidecar 內容形態（沿用 `content/templates/_sample.publish.json` `schemaVersion: 1`，本 rehearsal 模板中之值全為 `<Dean to provide>` placeholder；未來 WP-02 apply 時由 Dean 提供真值替換 placeholder）：

```json
{
  "schemaVersion": 1,
  "canonical": { "url": "", "source": "auto" },
  "ogImage":   { "url": "", "alt": "" },
  "blogger": {
    "type": "post",
    "permalink": "<Dean to provide>",
    "status": "published",
    "publishedUrl": "<Dean to provide>",
    "publishedAt": "<Dean to provide>",
    "bloggerPostId": "",
    "publishYear": "<Dean to provide>",
    "publishMonth": "<Dean to provide>",
    "history": []
  },
  "github": { "slug": "", "path": "", "status": "draft", "publishedUrl": "", "publishedAt": "" },
  "seo": { "metaTitle": "", "metaDescription": "", "robots": "index,follow" }
}
```

對 `update` case（`we-media-myself2`），預期只補 `blogger.bloggerPostId`；但如 §3 所述，本欄位屬 API-only、Dean 不填、Claude 不猜；因此**本篇於 WP-02 亦無實際寫入動作**（`we-media-myself2` 於 WP-02 之意義為 recorded no-op；`check:blogger-backfill` 該篇之 `missing bloggerPostId` warning 仍存在，直至未來 API flow phase 落地）。

**caveat**：上述 JSON 為 rehearsal 對照；**本 doc 不落地 JSON**；未來 WP-02 若 apply，才會將 JSON 落到對應 sidecar path。

---

## 5. Dry-run checklist（rehearsal only；本 doc **不執行**任何 dry-run）

本 §5 為未來 WP-02 之 Stage 1 dry-run walkthrough（Preflight §8.1 之細化）。本 doc **不執行**任何命令；下列命令為 rehearsal 範例，Dean 於未來 WP-02 session 才會實際跑（或由 Claude 依 approval 執行）。

### 5.1 Baseline verify（rehearsal step D-1）

```bash
# rehearsal-only；本 doc 不執行
pwd
git branch --show-current
git status -sb
git rev-parse HEAD
git rev-parse origin/main
git rev-list --left-right --count origin/main...HEAD
git log -5 --oneline
```

期望：`main`、HEAD == `origin/main`、`0 / 0`、clean、log 顯示 rehearsal 前之 frozen baseline。

### 5.2 Report-only guard baseline snapshot（rehearsal step D-2）

```bash
# rehearsal-only；本 doc 不執行
npm run check:blogger-backfill
npm run check:phase1-readiness
npm run check:phase1-readiness-contract
```

期望：`scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5` exit 0；readiness exit 0；contract 22/22 PASS。此為 write 前 baseline snapshot；write 後對照 §7 V-*。

### 5.3 Diff-only compute（rehearsal step D-3）

**目的**：於「不落地任何檔」的前提下，計算「若真 apply，會對哪些 sidecar 產生什麼 diff」。

**rehearsal command（不執行；示意用）**：

```bash
# rehearsal-only；本 doc 不執行；未來 WP-02 session 由 Claude 依 approval 執行
node -e '
const inputs = require("./_rehearsal-inputs.json");   // hypothetical input file，Dean 提供之真值 payload
for (const cand of inputs) {
  console.log(JSON.stringify({ slug: cand.slug, action: cand.action, sidecarPath: cand.sidecarPath, diff: cand.diff }, null, 2));
}
' > /tmp/rehearsal-diff.log
```

**注意**：

- 上述 `_rehearsal-inputs.json` 為 hypothetical；本 doc **不建**該檔、**不落地** payload。
- 未來 WP-02 若 Dean 傾向以 chat message 提供真值（而非落地檔），Claude 可在 chat 中構造 diff 輸出至 stdout；**不落地** intake file 於 repo。
- Diff 輸出**只到 stdout / `/tmp/` 或 ephemeral 檔**；**絕不**寫入 `content/` / `src/` / repo root。

### 5.4 Dry-run diff review checklist

Dean 檢視 diff 時逐項對照：

- [ ] 每一 sidecar 之 `blogger.publishedUrl` 與 Dean 從後台複製之真值**逐字元一致**（含 https / trailing `.html` / 大小寫 / yyyy/mm 路徑）
- [ ] 每一 sidecar 之 `blogger.publishedAt` 與後台顯示之時間**逐字元一致**（ISO 8601 或 sidecar 慣例）
- [ ] `blogger.permalink` 與後台 URL 之 `<permalink>` 部分**逐字元一致**
- [ ] `blogger.publishYear` / `blogger.publishMonth` 與後台 URL 之 yyyy / mm 部分**逐字元一致**
- [ ] `blogger.bloggerPostId` 一律 `""`（空字串），**絕無**任何值
- [ ] `blogger.type` = `"post"`（除非 Dean 明示為 `"page"`）
- [ ] `blogger.status` = `"published"`（若已 published 於後台）
- [ ] `blogger.history` = `[]`（無歷史紀錄；WP-02 為初始寫入）
- [ ] `canonical` / `github` / `seo` / `ogImage` 欄位 = `_sample.publish.json` 預設值（空字串 / `"auto"` / `"draft"` / `"index,follow"`）
- [ ] Sidecar path 精準 = 對應 markdown path 之同名 `.publish.json`（例：`.../20260612-<slug>.md` → `.../20260612-<slug>.publish.json`）
- [ ] 白名單外任何欄位 = 缺席（未新增任何 non-schema field）
- [ ] `update` case（`we-media-myself2`）之預期 diff = **empty**（本 phase 無實際寫入；因 `bloggerPostId` 屬 API-only）

**dry-run abort 條件**（任一命中即 abort，不進 apply）：

- 任一欄位與 Dean 提供之真值**不一致**（或 Dean 未提供該欄位真值）
- Sidecar path 與 markdown 檔名不對應
- 出現任何白名單外欄位 / 白名單外檔案 / 非 sidecar path 之 diff
- Dean 於 review 中口頭 / 明示 abort

---

## 6. Apply-phase checklist（future WP-02 only；rehearsal 對照用）

本 §6 為未來 WP-02 之 Stage 2 apply walkthrough（Preflight §8.2 之細化）。本 doc **不執行**任何 apply；下列 checklist 供 rehearsal 對照。

### 6.1 Pre-apply gate（重複 §5.2 baseline verify）

- [ ] Baseline 對照 §5.1（未 drift）
- [ ] Dry-run diff 已 §5.4 逐項確認通過
- [ ] Dean 於 chat 中明確聲明「apply」
- [ ] 本 session Claude 已再度確認：**不動** frontmatter / **不動** deploy clone / **不動** guard / **不動** package.json

### 6.2 Filesystem write（rehearsal 對照命令；不執行）

```bash
# future WP-02 only；本 doc 不執行
# create case（6 篇 sidecar-absent）：
node -e '
const fs = require("fs");
const payload = require("./_rehearsal-inputs.json");   // ephemeral，之後刪除
for (const cand of payload.filter(c => c.action === "create")) {
  fs.writeFileSync(cand.sidecarPath, JSON.stringify(cand.sidecarContent, null, 2) + "\n", "utf8");
}
'

# update case（we-media-myself2）：本 phase 無寫入（bloggerPostId 屬 API-only）
```

**write scope 白名單**（未來 WP-02 apply 前，Claude 必再度確認）：

- ✅ `content/blogger/posts/20260612-after-work-writing-time-blocking.publish.json`（新建）
- ✅ `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.publish.json`（新建）
- ✅ `content/blogger/posts/20260612-blog-as-personal-knowledge-base.publish.json`（新建）
- ✅ `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.publish.json`（新建）
- ✅ `content/blogger/posts/20260612-daily-reading-habit-notes.publish.json`（新建）
- ✅ `content/blogger/posts/20260612-reading-notes-three-questions.publish.json`（新建）

**write scope 白名單外**（未來 WP-02 apply 前，Claude 必再度確認缺席）：

- ❌ 任何 `.md`（frontmatter 不動）
- ❌ 任何 `content/settings/**` / `content/templates/**` / `content/github/**` / `content/drafts/**` / `content/archive/**`
- ❌ 任何 `src/**` / `views/**` / `styles/**` / `js/**` / `scripts/**`
- ❌ `package.json` / `package-lock.json`
- ❌ `CLAUDE.md` / `MEMORY.md` / `memory/**`
- ❌ `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `.cache/`
- ❌ deploy clone / gh-pages
- ❌ `_rehearsal-inputs.json`（ephemeral；apply 完成後**必須刪除**；不進 repo）

### 6.3 Ephemeral cleanup（apply 完成後）

- [ ] `_rehearsal-inputs.json`（若使用）已 `rm`；`git status --short` 不顯示該檔
- [ ] `/tmp/rehearsal-diff.log`（若使用）已刪除；不進 repo
- [ ] 任何 ad-hoc Node script（若使用）已刪除；不留 `src/scripts/**`
- [ ] `git status --short` 只顯示白名單內 6 個新 sidecar；其他 diff = **0 檔**

### 6.4 Commit（未來 WP-02 收尾）

```bash
# future WP-02 only；本 doc 不執行
git add content/blogger/posts/20260612-after-work-writing-time-blocking.publish.json \
        content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.publish.json \
        content/blogger/posts/20260612-blog-as-personal-knowledge-base.publish.json \
        content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.publish.json \
        content/blogger/posts/20260612-daily-reading-habit-notes.publish.json \
        content/blogger/posts/20260612-reading-notes-three-questions.publish.json
git commit -m "data(blogger): backfill sidecar publishedUrl/publishedAt"
git push origin main
```

**注意**：

- **不用** `git add -A` / `git add .` / `git add content/`（可能拉入非白名單）
- **不用** `--no-verify` / `--no-gpg-sign`（hook 失敗 → fix root cause → re-commit）
- **不 push** gh-pages
- commit subject **不含** `write` / `publish` / `backfill:url` / `admin:write` / `safe-write` / `push` token（避免 forbidden token 誤入 script 名稱；本 subject 只出現於 commit message，不影響 forbidden token guard）
- 若 Dean 於 approval 中選單篇 first slice，則 commit 只含該篇 sidecar（其他 5 篇留至後續 WP-03 slice）

---

## 7. Post-write verification checklist（future WP-02 only）

本 §7 為 Preflight §9 之細化。未來 WP-02 apply 之後、commit 之前必須逐項通過：

- [ ] **V-1**：`npm run check:blogger-backfill` exit 0；**complete = 6**（`we-media-myself2` `bloggerPostId` 仍 missing 屬 API-only，其他 6 篇之三值填齊）；**missing = 1**（僅 `we-media-myself2`）
- [ ] **V-2**：`npm run validate:content` exit 0；warning 數 = 135（不新增新 warning class；若上升須 audit 原因）
- [ ] **V-3**：`npm run check:phase1-readiness` exit 0；umbrella 內 `check:blogger-backfill` 之 `missing 1` 對照
- [ ] **V-4**：`npm run check:phase1-readiness-contract` 22/22 PASS（forbidden token 無新入）
- [ ] **V-5**：`git status --short` 僅顯示白名單內 6 個新 sidecar；其他 diff = **0 檔**
- [ ] **V-6**：build 不跑（本 phase 不 build）
- [ ] **V-7**：deploy 不跑（本 phase 不 deploy）；deploy clone 未動
- [ ] **V-8**：Sidecar 內容於檔案系統中 canonical readable（`cat` / `Get-Content` 顯示合法 JSON、可 `JSON.parse`）
- [ ] **V-9**：Sidecar 內每欄之值與 Dean 提供之真值**逐字元一致**（重複 §5.4）
- [ ] **V-10**：`blogger.bloggerPostId` 一律 `""`（空字串）；**絕無**任何值

**任一失敗即 abort**：轉入 §8 rollback。

**Optional post-write**（未來獨立 phase；本 rehearsal 不列必要）：

- `npm run build:blogger` local dry-build（**不 deploy**），觀察 `dist-blogger/posts/<slug>/meta.json` 之 `canonical` / `publishedUrl` 是否受 sidecar 更新影響。若欲執行，屬 build-observation slice，需 Dean 額外 approval。

---

## 8. Rollback / recovery checklist（future WP-02 only）

本 §8 為 Preflight §10 之細化。未來 WP-02 若於 apply 後 / commit 前 abort（或 commit 後 push 前 abort），rollback 步驟：

### 8.1 Case A：apply 完成、commit 尚未執行

- [ ] **R-1**：`git status --short` 列出所有 uncommitted 修改（預期為 §6.2 白名單內 6 個新 sidecar）
- [ ] **R-2**：`we-media-myself2.publish.json` 若受動（本 phase 不受動），`git checkout -- content/blogger/posts/20260515-we-media-myself2.publish.json` 還原
- [ ] **R-3**：6 篇新建 sidecar：`rm content/blogger/posts/20260612-<slug>.publish.json`（僅刪本 phase 新建；不動 markdown）
- [ ] **R-4**：`git status --short` 對照 baseline = clean（無 uncommitted / untracked）
- [ ] **R-5**：重跑 `npm run check:blogger-backfill`；驗證回到 §3 baseline（`missing 7 / complete 0`）
- [ ] **R-6**：重跑 `npm run check:phase1-readiness` / `-contract` 驗證 exit 0

### 8.2 Case B：commit 完成、push 尚未執行

- [ ] **R-B1**：`git log -1 --oneline` 確認 head 為 write commit
- [ ] **R-B2**：`git reset --soft HEAD~1` **需 Dean explicit approval**（destructive git action）
- [ ] **R-B3**：`git status --short` 顯示 staged 之 6 檔；`git reset` 至 unstaged
- [ ] **R-B4**：per §8.1 R-2 / R-3 進行 filesystem restore
- [ ] **R-B5**：per §8.1 R-4 / R-5 / R-6 verify

### 8.3 Case C：push 已完成（發現需 revert）

- [ ] **R-C1**：**不使用** force push；一律採 `git revert <sha>` + push（forward-only）
- [ ] **R-C2**：屬另一獨立 revert-only phase；**需 Dean explicit approval**
- [ ] **R-C3**：revert commit landed 後重跑 §7 V-*，驗證回到 §3 baseline（`missing 7 / complete 0`）

### 8.4 Rollback drill（rehearsal mock；本 doc **不執行**任何實際 rollback）

**目的**：於 offline rehearsal 走一遍 rollback 之心智模型（無實際 file / git 操作）。

**Mock scenario 1**：apply 6 篇 sidecar 後，V-1 顯示 warning 上升（非預期）→ 進 Case A → R-3 刪除 6 檔 → R-5 驗 baseline → V-1 回到 `missing 7 / complete 0` → 通知 Dean 「rollback 完成，abort 原因 = X，建議下一步 = Y」。

**Mock scenario 2**：commit 已完成、push 前發現 permalink 對應 3 篇錯誤 → 進 Case B → R-B2 於 Dean approval 後 `git reset --soft HEAD~1` → R-B4 修正 permalink → 若 Dean 同意 → 重新 dry-run → 重新 apply → 重新 commit → verify V-* → push。或 Dean 若選 abort，per R-B5 完全還原。

**Mock scenario 3**：push 已完成、Dean 發現 permalink 錯誤 → 進 Case C → 另開 revert-only phase → `git revert <sha>` + push → 驗 baseline 回到 `missing 7 / complete 0`；此時 6 篇 sidecar 不存在於 main HEAD；write phase 需重跑（另一 WP-02b slice）。

**Rollback drill 之意義**：確認 Claude 於 WP-02 apply 前**已充分認知** rollback 之三種 case 與各自流程；避免真正遇到問題時決策倉促。本 rehearsal drill 不需 Dean 實際操作、亦不需 Claude 實際跑命令。

---

## 9. Red lines（不可違反 / 不可降級）

以下紅線於本 doc（WP-01 rehearsal）與未來 WP-02（實際寫入）**皆**必須遵守；違反即 abort。

### 9.1 Data red lines

- ❌ **絕不** guess Blogger `publishedUrl` / `bloggerPostId` / `publishedAt` / `bloggerBlogId`
- ❌ **絕不** 從 slug / date / title / URL path / GitHub metadata / 檔名 yyyymmdd / CLAUDE.md 記載 推導 Blogger internal ID
- ❌ **絕不** 由 `we-media-myself2` sidecar 之 URL pattern 反推其他 6 篇之 URL
- ❌ **絕不** 由 markdown frontmatter `date` 推導 Blogger `publishedAt`（兩者可不同、非錯誤）
- ❌ **絕不** 填任何值於 `blogger.bloggerPostId`（永遠 `""`，待未來 API flow）

### 9.2 Write target red lines

- ❌ **絕不** 動 `content/blogger/posts/*.md` frontmatter（backfill 只動 sidecar；frontmatter 為 legacy fallback、不建議寫入）
- ❌ **絕不** 動 `content/github/**` 之 markdown / sidecar
- ❌ **絕不** 動 `content/settings/**` / `content/templates/**` / `content/drafts/**` / `content/archive/**`
- ❌ **絕不** 動 `src/**` / `views/**` / `styles/**` / `js/**` / `scripts/**`
- ❌ **絕不** 動 `package.json` / `package-lock.json`
- ❌ **絕不** 動 `CLAUDE.md` / `MEMORY.md` / `memory/**`（除非另一獨立 memory-sync-only phase；不與 WP-02 混）
- ❌ **絕不** 動 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `.cache/`
- ❌ **絕不** 動 deploy clone / gh-pages
- ❌ **絕不** 建 fixture 檔 / rehearsal intake 檔於 `content/` 或 repo root
- ❌ **絕不** 留 ad-hoc script 於 `src/scripts/**`（apply 完成即刪除）

### 9.3 Behavioral red lines

- ❌ **絕不** deploy during backfill write（本 phase 不 build / 不 preview / 不 deploy）
- ❌ **絕不** push gh-pages during backfill write
- ❌ **絕不** 跳過 hooks（`--no-verify`）/ bypass signing（`--no-gpg-sign`）
- ❌ **絕不** force push（destructive；rollback 一律採 forward-only revert）
- ❌ **絕不** 動 Blogger / AdSense / GA4 / Google Drive / Search Console 後台
- ❌ **絕不** 呼叫 Blogger API（第一版永禁；`CLAUDE.md` §29）
- ❌ **絕不** 升級 `check:blogger-backfill` 為 fail-fast（維持 report-only；`memory/project_report_only_metadata_guards.md` §6）
- ❌ **絕不** 修改 `check:phase1-readiness-contract` 之 forbidden token list（`backfill:url` / `admin:write` / `safe-write` / `write` / `publish` 皆必維持 absent）
- ❌ **絕不** 於 WP-02 commit 混入 CLAUDE.md / MEMORY.md / memory diff（memory-sync 屬獨立 phase）
- ❌ **絕不** 於 WP-02 commit 中包含 Blogger 真值以外之欄位變更（sidecar 只動 §5.4 白名單欄位）

---

## 10. WP-01 non-goals（本 session 明確不做）

本 session **明確不做**（cumulative；違反即 abort）：

| 項目 | 狀態 |
| --- | --- |
| 進入 WP-02 backfill write phase | ❌ 未進 |
| 寫入任何 Blogger `publishedUrl` / `publishedAt` / `bloggerPostId` | ❌ 未寫 |
| 建立 6 篇 sidecar-absent 之新 sidecar | ❌ 未建 |
| 修改 `we-media-myself2.publish.json` 任何欄位 | ❌ 未動 |
| 修改任何 markdown frontmatter | ❌ 未動 |
| 動 `src/**` / `views/**` / `styles/**` / `js/**` / `scripts/**` | ❌ 未動 |
| 動 `content/settings/**` / `content/templates/**` | ❌ 未動 |
| 動 `package.json` / `package-lock.json` | ❌ 未動 |
| 新增 npm script / guard / helper script / preview-only script | ❌ 未做 |
| 建 rehearsal intake JSON 檔（`_rehearsal-inputs.json` 或類似） | ❌ 未建 |
| 建 fixture 於 `content/validation-fixtures/backfill/**` | ❌ 未建 |
| 升級 `check:blogger-backfill` 為 blocking / fail-fast | ❌ 未做 |
| 修改 `check:phase1-readiness-contract` forbidden token list | ❌ 未做 |
| build / preview / deploy | ❌ 未做 |
| 動 deploy clone / push gh-pages | ❌ 未動（僅 §0 read-only 驗證） |
| 動 `CLAUDE.md` / `MEMORY.md` / `memory/**` | ❌ 未動 |
| 猜 Blogger `publishedUrl` / `bloggerPostId` / `publishedAt` / `bloggerBlogId` | ❌ 未猜 |
| 從 slug / date / title / URL path / GitHub metadata 推導 Blogger internal ID | ❌ 未做 |
| 從 CLAUDE.md 記載（例：P3 LIVE 2026-06-17）反推 Blogger URL / publishedAt | ❌ 未做 |
| Blogger 後台 / repost / draft flip / URL 設定 / 標籤設定 / 圖片上傳 | ❌ 未動 |
| AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 | ❌ 未動 |
| Admin write path / Apply / middleware / admin-write-cli / `--apply` / `dryRun:false` | ❌ 未動 |
| Reverse UTM pm-26 deploy | ❌ 未動 |
| Second GitHub Pages deploy / `github-pages-blog-planning` quarantine 解除 | ❌ 未動 |
| Blogger AdSense Batch 2 P2 live repost | ❌ 未動 |
| Phase 1 final 之降級 / 重新封存 | ❌ 未動 |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | ❌ 未做 |
| 呼叫 Blogger API / Drive API / Forms API | ❌ 未做 |
| 執行 dry-run / apply / rollback（任一實作）| ❌ 未做（本 doc 為 rehearsal template；命令只作範例） |

---

## 11. Recommendation

**建議：本 doc landing 後 remain rehearsal-only；不啟動 WP-02**（沿用 preflight §12；`CLAUDE.md` §3a Recommended next paths「idle freeze」；WP-02 需 Dean explicit approval + Dean 提供之真值）。

理由：

1. `check:blogger-backfill` 為 report-only / warning-only / exit 0；無 blocker、無時效壓力急於 write。
2. `bloggerPostId` 屬 API-only；即使強行 write 亦無法補齊該欄位，該篇 warning 仍存在。
3. Dean 尚未於任何 session 主動提供 `publishedUrl` / `publishedAt` 真值；rehearsal 已備好模板，Dean 未來若想 fill、可直接於 chat 或另一 doc 中填。
4. Phase 1 RC baseline 對「backfill 尚未 write」= 兼容（`check:phase1-readiness` exit 0 已含 backfill guard；write 未動不影響 RC 判定）。
5. 本 doc 已把 rehearsal 模板 / dry-run / apply / verification / rollback 三種 case + rollback drill 三個 mock scenario 全數 documented；未來啟動 WP-02 時可直接引用、無需重複 audit。

**未來 WP-02 啟動觸發**：Dean 於某 session 明確提出：

- 「請進入 Blogger backfill write phase 第 1 篇；篇目 = `<明列 slug>`；附 Dean 提供之 `publishedUrl` / `publishedAt` 真值」（Preflight §7 G-D1 / G-D3；WP-02 preanalysis §4 approval 格式）
- 或「請進入 Blogger backfill write phase 全 6 篇（sidecar-absent）；附 6 篇之真值」
- 且明列 Preflight §7 gates 皆已具備、對照 §8–§10 workflow 執行
- Dean 於同 approval 中明示 `permalink` / `publishYear` / `publishMonth`；`bloggerPostId` 一律留空

Claude **不代 Dean 決策**、**不主動啟動** WP-02、**不主動填** 模板；本 doc 為 rehearsal-only。

**下一個 slice 建議候選**（沿用 preanalysis §5；本 doc 不代 Dean 選）：

- idle freeze（保守路徑；預設）
- WP-01 之後續 slice（若 Dean 想擴 rehearsal 情境：加更多 rollback drill 場景 / 加 sidecar-present partial update mock）；仍為 docs-only
- 其他 P2-Entry candidate（WP-05 / WP-11 / WP-14 / WP-16；per preanalysis §5）
- WP-02（真實 sidecar 寫入；需 Dean 明列篇目 + 提供真值）

---

## 12. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔（+ 對應 commit + push origin/main）。**不含**任何程式 / frontmatter / settings / sidecar / build / deploy / dev-server 變更；未新增 guard / npm script / preview-only script / write helper / rehearsal intake JSON / fixture；未改 CSS；未改 `CLAUDE.md` / `MEMORY.md` / `memory/`；未觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages；未發布 Blogger；未購買網域 / 未動 DNS / 未碰 AdSense / GA4 / Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`；未猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId`；未從任何 metadata 推導 Blogger internal ID；未新增測試文章 / artifact；未建 `CNAME` / `ads.txt`（含 placeholder / fake）；未動 `content/settings/ads.config.json`；未升級任何 report-only guard 為 fail-fast；未修改 `check:phase1-readiness-contract` 之 forbidden token list。§0 boot baseline 為本 session read-only 驗證；§1 結論 sourced from preflight §12 + preanalysis §4 WP-01；§2 relationship 為對既有 preflight / preanalysis / 本 doc 三者之定位圖；§3 baseline recap 為本 session `check:blogger-backfill` 實測（結果與 predecessor docs 一致，未動 guard）；§4 input table template 為新提出之空白模板（無真值、無填寫；欄位定義沿用 preflight §5 minimal template + `_sample.publish.json` schema）；§5 dry-run checklist / §6 apply-phase checklist / §7 post-write verification / §8 rollback / drill 為 preflight §8–§10 之細化 + 三個 mock scenario；§9 red lines 為 `CLAUDE.md` §3a Red lines + preflight §6 之整合列表；§10 non-goals 沿用 preflight §11 + preanalysis §8 + `CLAUDE.md` §3a Red lines；§11 recommendation 沿用 preflight §12 + preanalysis §5 + `CLAUDE.md` §3a Recommended next paths（idle freeze）。

---

## See also

- `docs/20260710-blogger-backfill-write-phase-preflight.md`（前置條件 / gate / dry-run / validation / rollback proposed；本檔 §2 / §5–§8 引用）
- `docs/20260710-phase2-next-work-scope-preanalysis.md` §4 WP-01（Phase 2 work packages 拆分；本檔為 WP-01 落地）
- `docs/20260710-phase1-rc-docs-index.md`（2026-07-10 家族單頁 lookup index；本檔於 See also 對應）
- `docs/20260710-phase1-rc-next-phase-route-selection.md`（Routes A–G；WP-01 屬 Route B 之下一層拆分）
- `docs/20260710-phase1-rc-handoff-operating-readout.md`（Phase 1 RC handoff readout；家族入口）
- `docs/20260710-phase1-rc-next-readiness-analysis.md`（RC readiness re-verify）
- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger identity 分層 policy；A.1 / A.2 / A.3；`bloggerPostId` = API-only；本檔 §3 / §4 / §9.1 引用）
- `docs/20260706-blogger-backfill-write-target-inventory.md`（canonical write target = `.publish.json` sidecar；本檔 §4.3 / §5 / §6 引用）
- `docs/20260706-blogger-backfill-report-only-baseline.md`（guard 行為契約 + report snapshot；本檔 §3 引用）
- `docs/20260706-blogger-backfill-value-intake-template.md`（backfill 真值收集模板；本檔 §4 之 predecessor；本檔補 rehearsal / dry-run / rollback drill）
- `docs/20260709-blog-phase2-next-work-packet.md`（Phase 2 next-work packet；候選 A–E scope-out）
- `docs/publish-json-schema.md` §5.3（Blogger URL 規則）/ §5.6（`blogger.type`）
- `content/templates/_sample.publish.json`（`schemaVersion: 1` sidecar 範本；本檔 §4.3 引用）
- `CLAUDE.md` §3a Current state snapshot（含 Red lines / Recommended next paths；不猜 Blogger postId / publishedAt / bloggerBlogId）
- `CLAUDE.md` §7（Blogger 發布 checklist；發布階段，非 backfill）、§23（發布狀態）、§24（Blogger 發布 URL 回填）、§26（package.json 指令）、§27（Claude Code 修改規則）、§29（第一版不做）
- `MEMORY.md` + `memory/project_baseline.md`（frozen source / deploy baseline）
- `memory/project_report_only_metadata_guards.md`（8 warning-only guards + release-readiness umbrella；`check:blogger-backfill` 為獨立 guard、非 metadata guard suite 成員）
- `memory/feedback_phase_discipline.md`（memory-sync-only / docs-only / source-only phases 不重疊）

---

（本文件結束 / end of document）
