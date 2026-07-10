# Blogger backfill WP-02 intake template（docs-only；WP-02 pre-phase）

- 建立日期：2026-07-10（Asia/Taipei；本 session 為當日晚間 slice）
- 類型：docs-only **WP-02 intake template**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 對應 work package：`docs/20260710-phase2-next-work-scope-preanalysis.md` §4 **WP-01/WP-02** 之 bridging artifact。前置 slice：
  - `docs/20260710-blogger-backfill-write-rehearsal-template.md`（WP-01；全 7 篇空白 rehearsal 表 + 3 rollback drill 情境）
  - `docs/20260710-blogger-backfill-one-post-dry-run-worksheet.md`（WP-01 follow-up；單篇 dry-run worksheet + 5 rollback drill 情境）
- 目的：把「Dean 之後若提供 Blogger 真值時，要怎麼填 / 怎麼驗 / 怎麼開 WP-02 write phase」以 **intake template** 形式定型。本 doc 是 Dean 未來 WP-02 approval 時之 **對照工具**，不代 Dean 填任何真值、不代 Dean 決策啟動 WP-02、不新增任何 script、不改任何 guard 語意。
- 本輪界線（docs-only）：**不** build / **不** preview / **不** deploy / **不**碰 deploy clone 寫入 / **不**改任何 frontmatter / **不**改任何 sidecar `.publish.json` / **不**動 `check:blogger-backfill` guard 語意（維持 report-only / warning-only / exit 0）/ **不**動 `check:blogger-backfill:one-post` guard 語意 / **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / **不**碰 Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 / **不**動 `CLAUDE.md` / `MEMORY.md` / `memory/` / **不**新增 npm script / preview helper script / **不**動 `package.json` / `package-lock.json` / **不**把任何新 script 加進 `phase1-readiness` umbrella / **不**進入 WP-02 真實寫入。
- 本輪允許 mutation：新增本檔（唯一）+ 對應 commit + push origin/main。

---

## 0. Boot baseline（本 session 已驗）

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `b0b0488` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅（read-only 驗證） | `0 / 0` | clean | absent ✅ |

Source HEAD full hash = `b0b04886d26e422794290a9a7e59fbb7b744cd72`；subject `chore(blogger): add one-post backfill dry-run script`（前一 slice 落地之 one-post dry-run 命令行工具；`src/scripts/check-blogger-backfill-one-post.js` + `package.json` `check:blogger-backfill:one-post` 註冊；為 source-only slice，非 docs-only）。

Deploy HEAD full hash = `1170e7e14aaa7f3449999bf92b9c8586719a76b4`（read-only 驗證；本 session **未寫入** deploy clone；subject `deploy(github): publish first verified github pages scope`）。

Readiness / guard checks 本輪已跑（read-only；exit 0；於 §7 詳列）：`npm run check:blogger-backfill`（本 doc 之 pre-mutation guard snapshot）。

判定：baseline 完全一致；readiness 未 drift；backfill guard 維持 report-only；deploy clone 未動；`.git/index.lock` 皆 absent。

---

## A. Frozen baseline

### A.1 Source baseline（本 doc landing 前）

```
full hash: b0b04886d26e422794290a9a7e59fbb7b744cd72
short:     b0b0488
subject:   chore(blogger): add one-post backfill dry-run script
branch:    main == origin/main
tree:      clean
ahead/behind: 0 / 0
index.lock: absent
```

### A.2 Deploy baseline（read-only；本 session 未寫入）

```
full hash: 1170e7e14aaa7f3449999bf92b9c8586719a76b4
short:     1170e7e
subject:   deploy(github): publish first verified github pages scope
branch:    gh-pages == origin/gh-pages
tree:      clean
ahead/behind: 0 / 0
index.lock: absent
```

### A.3 Next frozen baseline（本 doc landing 後）

本 doc landing 後之 next frozen source baseline = 本 doc commit hash（見 §7 final report）；deploy 不動。

### A.4 Recent related slice chain（近期相關 slice；不含全部 phase）

```
b0b0488  chore(blogger): add one-post backfill dry-run script   ← 前一 slice（source；one-post dry-run script + package.json 註冊）
5c92d15  docs(blogger): add one-post dry-run worksheet          ← WP-01 follow-up docs-only（單篇 dry-run worksheet + 5 rollback drill）
f1aec08  docs(blogger): add backfill rehearsal template         ← WP-01 docs-only（全 7 篇 rehearsal 空白表 + 3 rollback drill）
4d88165  docs(phase2): analyze next work scope                  ← Phase 2 next work scope preanalysis（WP-01/02/03/04 拆分）
ca9e94f  docs(phase1): analyze next phase routes                ← Phase 1 RC after-slice route selection preanalysis
```

---

## B. WP-02 邊界

### B.1 WP-02 write phase 尚未開始

**明確聲明**：

- ✅ WP-02（Blogger backfill 真實 sidecar 寫入 phase）**尚未開始**
- ✅ 本 doc **只是 intake template**（Dean 未來 approval 之對照工具）
- ✅ 本 doc landing 後 write phase 仍 **dormant / blocked**
- ✅ WP-02 若未來啟動，仍為獨立 phase、獨立 session、獨立 approval、獨立 gate

### B.2 本 intake template 不得被反向使用

**明確禁止**：

- ❌ **不能** 用本文件推導或猜測 Blogger 真值
- ❌ **不能** 用本文件的 placeholder token 反推 Dean 未提供之欄位
- ❌ **不能** 從本文件的 candidate list 反推 candidate 的 Blogger URL / postId / publishedAt
- ❌ **不能** 從 markdown frontmatter `date` / 檔名 yyyymmdd / slug / title 推導 Blogger 真值
- ❌ **不能** 從 `we-media-myself2` sidecar 已有的 URL pattern 反推其他 6 篇的 URL
- ❌ **不能** 從 CLAUDE.md §3a 記載（例：P3 於 2026-06-17 Blogger LIVE published）反推 backfill 真值
- ❌ **不能** 從 GitHub markdown `date` field 推導 `publishedAt`

### B.3 只有 Dean 明確提供的值才可使用

**規則**：

- ✅ 只有 Dean 於未來 WP-02 approval message 中 **明確提供**（inline / structured）之值，才可用於 write
- ✅ Dean 未明確提供之欄位 → 一律留為 missing / 一律留空字串 `""`（`bloggerPostId` 例外，見 B.6）
- ✅ 若欄位有既有 sidecar 值（例：`we-media-myself2` 之 `publishedUrl` / `publishedAt`）→ 保留現值；Dean 未在 approval 中明列覆蓋，**不覆蓋**
- ✅ Dean 明列覆蓋時，逐字元對照原值；typo / whitespace / 大小寫差異 → abort

### B.4 Blogger publishedAt vs GitHub markdown date

**明確聲明**：

- ✅ Blogger `publishedAt`（後台顯示之 Blogger 發布 / 更新時間）**可以與** GitHub markdown frontmatter 之 `date` 欄位**不同**
- ✅ 兩者 mismatch **不視為錯誤**、**不視為 warning**、**不觸發 guard failure**
- ✅ Blogger `publishedAt` 之 source of truth = **Blogger 後台**；GitHub markdown `date` 之 source of truth = **markdown frontmatter**
- ✅ 兩者為獨立語意（per `docs/20260706-blogger-identity-and-backfill-strategy.md` §A.2 date policy）
- ❌ **不能** 用 GitHub markdown `date` 補 Blogger `publishedAt`（即使兩者巧合相符）

**理由**：GitHub markdown `date` 代表 markdown 於本 repo 的 canonical 建檔 / 修訂時間；Blogger `publishedAt` 代表 Blogger 平台之發布時間戳。兩者 workflow 不同、審核節奏不同、可能相差數日甚至數週。

### B.5 Blogger postId 取得限制

**明確聲明**：

- ✅ Blogger `bloggerPostId` 屬 **系統欄位**（per `docs/20260706-blogger-identity-and-backfill-strategy.md` §A.3）
- ✅ 該欄位透過 Blogger 平台 API 於 publish / update response 取得
- ✅ Dean 手動於 Blogger 後台**不易取得**（後台 UI 不直接顯示 postId；需查看 HTML source / URL query param / API dashboard）
- ❌ **不得要求** Dean 手動提供 `bloggerPostId`
- ⏸ 未來若系統 / Blogger API integration flow 落地（獨立 phase；未規劃），可由系統於 API response 自動補入
- ❌ **不得** 從 publishedUrl 反推 / 從 slug / date / title 假造

### B.6 只有 URL / publishedAt 可先進 sidecar；bloggerPostId 允許保持 missing

**規則**：

- ✅ 即使只有 `publishedUrl` + `publishedAt`（Dean 提供）+ `bloggerPostId=""`（保持空）之 sidecar，仍可視為 valid 進入 WP-02 write
- ✅ 不因 `bloggerPostId` missing 而 abort write
- ✅ `check:blogger-backfill` 仍會 warn 「missing blogger.bloggerPostId」；此為預期行為，非新錯誤（per `we-media-myself2` 現況：sidecar-present + `bloggerPostId=""` + guard warn）
- ✅ 未來若 API flow 補入 `bloggerPostId`，warning 自動消失

---

## C. Candidate list（本 session `check:blogger-backfill` 實測；未動）

本 §C 之候選清單 = 本 session `npm run check:blogger-backfill` 之實測結果（見 §7 verification snapshot 之 C-1 raw output）。**不代 Dean 選**；本表為 Dean 未來 approval 時之對照工具。

### C.1 全欄位對照表

| # | markdown path | slug / id | expected sidecar path | publishedUrl（Dean 未來提供） | publishedAt（Dean 未來提供） | bloggerPostId | source of truth / evidence | status | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `content/blogger/posts/20260515-we-media-myself2.md` | `we-media-myself2` | `content/blogger/posts/20260515-we-media-myself2.publish.json` | *（sidecar-present；已存；Dean 若欲覆蓋須明列）* | *（sidecar-present；已存；Dean 若欲覆蓋須明列）* | `""`（API-only；保持空） | Blogger 後台 + 現有 sidecar | ready | sidecar-present；`bloggerPostId` 現況 `""`；WP-02 對該篇為 **recorded no-op**；不建議作為 first slice |
| 2 | `content/blogger/posts/20260612-after-work-writing-time-blocking.md` | `after-work-writing-time-blocking` | `content/blogger/posts/20260612-after-work-writing-time-blocking.publish.json` | *（Dean to provide；逐字元一致 with 後台 URL）* | *（Dean to provide；ISO 8601 或既有慣例）* | `""`（API-only；保持空） | Blogger 後台 | ready | sidecar-absent；三值全缺；`create` case |
| 3 | `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md` | `ai-tools-simplify-daily-workflow` | `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.publish.json` | *（Dean to provide）* | *（Dean to provide）* | `""`（API-only） | Blogger 後台 | ready | sidecar-absent；三值全缺；`create` case |
| 4 | `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md` | `blog-as-personal-knowledge-base` | `content/blogger/posts/20260612-blog-as-personal-knowledge-base.publish.json` | *（Dean to provide）* | *（Dean to provide）* | `""`（API-only） | Blogger 後台 | ready | sidecar-absent；三值全缺；`create` case |
| 5 | `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md` | `blog-restart-steady-rhythm-notes` | `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.publish.json` | *（Dean to provide）* | *（Dean to provide）* | `""`（API-only） | Blogger 後台（P3 於 2026-06-17 Blogger LIVE published；Dean 截圖佐證；但 backfill 真值仍待 Dean 從後台複製） | ready | sidecar-absent；三值全缺；`create` case；**caveat**：LIVE 狀態不代表 Claude 可推導真值 |
| 6 | `content/blogger/posts/20260612-daily-reading-habit-notes.md` | `daily-reading-habit-notes` | `content/blogger/posts/20260612-daily-reading-habit-notes.publish.json` | *（Dean to provide）* | *（Dean to provide）* | `""`（API-only） | Blogger 後台 | ready | sidecar-absent；三值全缺；`create` case |
| 7 | `content/blogger/posts/20260612-reading-notes-three-questions.md` | `reading-notes-three-questions` | `content/blogger/posts/20260612-reading-notes-three-questions.publish.json` | *（Dean to provide）* | *（Dean to provide）* | `""`（API-only） | Blogger 後台 | ready | sidecar-absent；三值全缺；`create` case |

### C.2 對應 guard baseline

Guard baseline（本 session 實測；未動）：

```
scanned:    12 .md file(s) under content/blogger/posts/
candidates: 7
complete:   0
missing:    7
skipped:    5
```

7 篇 missing candidate 之 `[sidecar-present|sidecar-absent]` / status / missing fields 對照 §C.1 表；**未動**。

---

## D. Dean 填寫格式（Dean 未來 approval 時 inline 使用；本 doc 不填任何真值）

Dean 未來若進入 WP-02 approval，建議於 chat message 中 **inline** 使用下列格式（不必直接改本 doc）。本 doc **不填任何真值**；下方為空白模板。

### D.1 單篇 intake item 模板

```markdown
## Intake item

- markdown path:
- slug/id:
- expected sidecar path:
- Blogger published URL:
- Blogger publishedAt:
- Blogger postId:
- evidence:
- notes:
```

### D.2 欄位說明 / required 分類

**Required if available（Dean 需提供）**：

- `Blogger published URL` — Blogger 後台已發布之正式網址（逐字元一致，含 `https://` / 大小寫 / `.html`）
- `Blogger publishedAt` — Blogger 後台顯示之發布 / 更新時間戳（ISO 8601 或 `YYYY-MM-DD`；per Dean approval 中明示）

**Not Dean-required（不列必填；系統欄位）**：

- `Blogger postId` — API-only；Dean 手動不易取得；一律留 `""`；未來 API flow 落地補入

**Optional**：

- `markdown path` — Dean approval 中明列（可從 slug 衍生，但建議明列避免歧義）
- `slug/id` — Dean approval 中明列（用於 script 匹配）
- `expected sidecar path` — Dean approval 中明列（由 markdown 檔名衍生：`<yyyymmdd>-<slug>.publish.json`）
- `evidence` — Dean 可附後台截圖 URL / 描述（不進 sidecar；僅供 audit）
- `notes` — Dean 可附備註（例：Blogger URL 有特殊字元轉譯 / 該篇 publishedAt 落後 GitHub markdown date N 天 / ...）

### D.3 多篇 approval 之格式

若 Dean 未來一次 approval 多篇（不建議；per §E.8 首次建議 1 篇），可於 chat message 中重複 §D.1 區塊：

```markdown
## Intake item 1
...

## Intake item 2
...
```

**首次 WP-02 建議 1 篇**（per §E.8）；多篇 approval 屬 WP-02 後續 slice（例：WP-02b / WP-02c）。

### D.4 Dean 未提供之欄位處理

- ✅ 若 Dean 未提供 `Blogger published URL` → **abort**；不代猜；請 Dean 補提供
- ✅ 若 Dean 未提供 `Blogger publishedAt` → **abort**；不代猜；請 Dean 補提供 or 明列「目前不可得」
- ✅ 若 Dean 明列 `Blogger publishedAt` 目前不可得 → sidecar 該欄位保持空字串 `""`；WP-02 write 仍可進行；`check:blogger-backfill` 仍會 warn（預期行為）
- ✅ 若 Dean 未提供 `Blogger postId` → **不視為 abort**；一律留 `""`（per §B.5）

---

## E. Pre-write checklist（未來 WP-02 write phase 前必須滿足）

以下 checklist 為未來真的進 WP-02 write phase 前 **必須逐項通過** 之 gate。本 doc **不執行** 任何 gate；本 §E 為 Dean 未來 approval 時之對照工具。

### E.1 Dean 明列處理範圍

- [ ] Dean 於 chat message 中 **明確聲明「進入 WP-02 write phase」**（非隱含 / 非推論）
- [ ] Dean 明列 **要處理哪一篇** 或哪幾篇（首次建議 1 篇；per E.8）
- [ ] Dean 明列之 slug 於 §C.1 表中存在（若非 §C.1 之 7 篇之一，需 audit 為何未在 candidate list）

### E.2 Blogger publishedUrl 真值

- [ ] Dean 提供 **真實 Blogger publishedUrl**（逐字元一致 with 後台）
- [ ] URL 格式與 `docs/publish-json-schema.md` §5.3 契約一致
  - post case: `https://<blog-domain>/<yyyy>/<mm>/<permalink>.html`
  - page case: `https://<blog-domain>/p/<permalink>.html`
- [ ] URL 不含 UTM / query string（純 canonical URL）

### E.3 Blogger publishedAt 真值

- [ ] Dean 提供 **真實 Blogger publishedAt** 值（ISO 8601 或 `YYYY-MM-DD`）
- [ ] **或** Dean **明確標註 「目前不可得」**（允許；sidecar 欄位保持 `""`；WP-02 write 仍可進行）
- [ ] Dean 未提供且未標註 → abort（per D.4）

### E.4 Blogger postId 保持 missing

- [ ] `bloggerPostId` 一律 `""`（per §B.5 / B.6）
- [ ] Dean 未提供 → 保持 `""`；**不視為 abort**
- [ ] 若 Dean 誤提供 → 於 approval 對話中確認 Dean 的來源（若來源可信，可考慮寫入；否則保持 `""`）
- [ ] **絕不** 從 publishedUrl / slug / date / title 反推

### E.5 Dry-run 先跑

- [ ] 於 write 前，先跑：

  ```bash
  npm run check:blogger-backfill:one-post -- --slug=<slug>
  ```

- [ ] 檢查 output 之 `resolved slug argument` 與 Dean approval 一致
- [ ] 檢查 `markdown path` / `sidecar path` 與 Dean approval / §C.1 表一致
- [ ] 檢查 `backfill candidate: yes`
- [ ] 檢查 `MISSING` / `PRESENT` 欄位對照 Dean 未來提供之真值

### E.6 Expected sidecar path 精準確認

- [ ] 預期 sidecar path 精準 = `<CANDIDATE_MARKDOWN_PATH>` 之同名 `.publish.json`
  - 例：`.../<yyyymmdd>-<CANDIDATE_SLUG>.md` → `.../<yyyymmdd>-<CANDIDATE_SLUG>.publish.json`
- [ ] Sidecar path 不含任何 rename / 移動（per canonical write target 契約；`docs/20260706-blogger-backfill-write-target-inventory.md`）

### E.7 Write phase session 隔離

- [ ] Write phase 必須 **另開 session**（不繼續本 doc landing session）
- [ ] 另下 **明確 write phase 指令**（不隱含於本 doc / 不隱含於 rehearsal doc）
- [ ] 新 session 之 boot verification 必須成功（HEAD == origin/main / clean / 0 0 / no index.lock）
- [ ] 新 session 之 approval message 中包含 §D.1 之 intake item 內容

### E.8 一次最多 1 篇（首次）

- [ ] Write phase **首次 slice** 一次最多先處理 **1 篇**
- [ ] Dean approval 中若列出多篇 → 提示 Dean 拆為多個獨立 slice；首次仍只寫 1 篇
- [ ] 首次 slice 完成後 verify（per one-post dry-run worksheet §12 V-* checklist），確認無 side effect、guard 未 regression，才進入下一 slice
- [ ] 後續 slice 各自獨立 approval / 獨立 gate

---

## F. Forbidden actions（禁止事項；違反即 abort）

### F.1 Blogger metadata 反推 / 假造

- ❌ **不可** 從 Blogger URL 反推 `bloggerPostId`
- ❌ **不可** 用 markdown 檔名 yyyymmdd / slug / title / GitHub metadata / CLAUDE.md 記載 假造 `bloggerPostId`
- ❌ **不可** 從 Blogger URL 反推 `publishedAt`（即使 URL 含 yyyy/mm；月份≠日期）
- ❌ **不可** 從 GitHub markdown frontmatter `date` 推導 Blogger `publishedAt`
- ❌ **不可** 從 slug 反推 Blogger `permalink`（雖然 §7.3 之 one-post dry-run worksheet 有 permalink placeholder，但 Dean approval 中明列為準）

### F.2 Frontmatter 不動

- ❌ **不可** 把 Blogger metadata 寫進 markdown frontmatter
  - `publishedUrl` / `publishedAt` / `bloggerPostId` 一律寫入 `.publish.json` sidecar，**不寫**入 markdown frontmatter
  - 即使 markdown frontmatter 已有 legacy `blogger.publishedUrl` 欄位（若歷史 fixture 遺留），**不覆寫 / 不更新**
  - Canonical write target = `.publish.json` sidecar（per `docs/20260706-blogger-backfill-write-target-inventory.md`）

### F.3 大量批次寫入

- ❌ **不可** 一次寫入多篇 sidecar（首次 slice 一次最多 1 篇；per §E.8）
- ❌ **不可** 使用 `git add -A` / `git add .` / `git add content/` 批次 stage
- ❌ **不可** 使用 `find` / glob-based loop / batch script 批次 write
- ❌ **不可** 於 apply 過程中誤動非 approval 明列之 sidecar（per one-post dry-run worksheet §13.4 partial multi-file abort）

### F.4 Umbrella 不加

- ❌ **不可** 在未驗證前把 `check:blogger-backfill:one-post` 加進 `check:phase1-readiness` umbrella
- ❌ **不可** 在未驗證前把任何 WP-02 相關 script 加進 umbrella
- ❌ `check:phase1-readiness-contract` 之 forbidden token list（`backfill:url` / `admin:write` / `safe-write` / `write` / `publish`）**維持缺席**；新 script 若涉及 write，不加入 umbrella

### F.5 Deploy 不觸發

- ❌ **不可** 於 WP-02 slice 中觸發 `npm run build:github` / `build:blogger` / `preview` / deploy
- ❌ **不可** 於 WP-02 slice 中動 deploy clone（`/d/github/blog-new/portable-blog-deploy`）
- ❌ **不可** push gh-pages
- ❌ **不可** 動 `dist/` / `dist-blogger/` / `.cache/`
- ✅ Post-write build 觀察屬**另一獨立 phase**（per one-post dry-run worksheet §12 optional post-write）

### F.6 後台 / API 不觸

- ❌ **不可** 動 Blogger 後台
- ❌ **不可** 動 AdSense 後台
- ❌ **不可** 動 Google Search Console 後台
- ❌ **不可** 動 GA4 後台
- ❌ **不可** 動 Google Drive
- ❌ **不可** 動 DNS / domain 設定
- ❌ **不可** 呼叫 Blogger API / Google API（未來 API flow 屬獨立 phase）

---

## G. Suggested future command shape（未來可能命令形狀；不代表本 doc 實作）

以下為 **未來** WP-02 可能之命令形狀；本 doc **不實作** 任何 write 命令。以下 `blogger-backfill:one-post:write` **不存在**；本 doc **不新增** 該 script、**不新增** 該 npm 註冊、**不新增** helper。

### G.1 已存在（本 doc landing 前已註冊；本 doc 未動）

```bash
# 已存在（package.json 已註冊；本 doc 未動）
npm run check:blogger-backfill                              # 全域 report-only guard
npm run check:blogger-backfill:one-post -- --slug=<slug>    # 單篇 dry-run report（read-only；warning-only）
```

### G.2 未來可能（本 doc **不實作**；WP-02 開始時獨立設計）

```bash
# ⚠️ future only；本 doc 不實作；不代表未來一定採此形狀
npm run blogger-backfill:one-post:write -- --slug=<slug> --intake=<path>
```

**明確標註**：

- ❌ **write command does not exist yet**
- ❌ **do not implement in this session**
- ❌ 本 doc **不設計** 該 script 之 CLI schema / argument list / behavior
- ❌ 本 doc **不設計** `<path>` intake file 之 schema
- ⏸ 未來 WP-02 若啟動，該 script 之設計為 WP-02 之第一 slice；獨立 phase / 獨立 approval / 獨立 gate
- ⏸ 亦可能未來 WP-02 選擇**不新增 script**、改用 ad-hoc Node one-liner（per one-post dry-run worksheet §11.2）；此為 Dean 未來決策

### G.3 未來 WP-02 若採用 intake file 路徑

若未來 WP-02 選擇使用 intake file（而非 Dean chat inline）：

- `<path>` 建議為 **ephemeral 檔**（例：`/tmp/dean-inputs-<slug>.json` / repo 外路徑）
- **不進 repo**（apply 完成後必刪；per one-post dry-run worksheet §11.4）
- Schema 由 WP-02 開始時獨立設計；本 doc **不代設計**

**注意**：本 doc **不新增** intake file 之 schema fixture、**不新增** 樣本 intake JSON、**不新增** intake validator。

---

## 7. 本輪 verification snapshot（本 session 已跑；exit code 逐項記錄）

以下為本 session 於本 doc landing **之前 / 之後** 之 verification（前置在 §7.1；docs-only mutation 後在 §7.2 補跑 subset）。

### 7.1 Pre-mutation snapshot

| # | 指令 | Exit | 結果 |
| --- | --- | --- | --- |
| C-1 | `npm run check:blogger-backfill` | 0 | scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5；與 `docs/20260710-blogger-backfill-one-post-dry-run-worksheet.md` §4 baseline 一致 |

（本 doc 為 docs-only；本 session 於 doc 撰寫階段先跑 C-1 作為 candidate list 來源；不動任何檔。）

### 7.2 Post-mutation snapshot（本 doc landing 後）

於本 doc landing 後、commit 前，跑下列 verification（詳實測結果見 §12 final report）：

- `npm run check:blogger-backfill`
- `npm run check:blogger-backfill:one-post -- --slug=we-media-myself2`
- `npm run check:blogger-backfill:one-post -- --slug=blog-restart-steady-rhythm-notes`
- `npm run validate:content`
- `npm run check:phase1-readiness-contract`
- `npm run check:phase1-readiness`

期望：所有指令 exit 0；guard 數字未 drift；contract 22/22 PASS；readiness umbrella 16/16 PASS + smoke 8/8 PASS。

---

## 8. Non-goals（本 doc 明確不做）

- ❌ **不代 Dean 選** first WP-02 candidate（§C.1 表為工具，非決策）
- ❌ **不代 Dean 填** 任何 Blogger 真值
- ❌ **不設計** WP-02 write script 之 CLI / behavior
- ❌ **不新增** `blogger-backfill:one-post:write` script（於本 doc landing 後 **不存在**）
- ❌ **不新增** intake file schema
- ❌ **不改** `check:blogger-backfill` / `check:blogger-backfill:one-post` guard 語意
- ❌ **不改** `check:phase1-readiness-contract` 之 forbidden token list
- ❌ **不加** `check:blogger-backfill:one-post` 到 `phase1-readiness` umbrella
- ❌ **不改** `check:phase1-readiness` composition
- ❌ **不改** 任何 `.publish.json` sidecar
- ❌ **不改** 任何 markdown frontmatter
- ❌ **不觸發** build / preview / deploy
- ❌ **不動** deploy clone
- ❌ **不動** `CLAUDE.md` / `MEMORY.md` / `memory/`

---

## 9. Recommendation

**本 doc landing 後之建議下一步**：

1. **Idle-freeze**（保守路徑）：本 doc landing 後，Dean 於未來 approval 時可依 §D.1 格式提供 first slice；不主動觸發。
2. **若 Dean 未來想擴充 rehearsal 系列**（各自為 docs-only follow-up slice；不代啟動）：
   - 補其他 candidate 之單篇 dry-run worksheet（per WP-01 follow-up 定位）
   - 補其他 rollback drill 情境（例：sidecar-present partial update mock）
   - 補 URL 格式 edge case 分析（例：Blogger 自訂 permalink 含特殊字元 / URL 轉譯）
3. **若 Dean 未來想啟動 WP-02**（新 session；per §E.7）：
   - 另開 session
   - 明列 first slice slug（per §E.8 一次 1 篇）
   - 提供 §D.1 intake item 真值（per §E.2 / E.3）
   - 走 §E.5 dry-run
   - 通過 §E.1–§E.8 全部 gate
   - 才進入 filesystem write

**Claude 於本 doc landing 後**：進入 **idle-freeze**；**不主動** 觸發任何 WP-02 動作、**不主動** 建議 Dean 選 first slice、**不主動** 補其他 rehearsal doc。

---

## 10. See also

- `docs/20260710-blogger-backfill-write-rehearsal-template.md` — WP-01 rehearsal template（全 7 篇空白 rehearsal 表 + 3 rollback drill 情境）
- `docs/20260710-blogger-backfill-one-post-dry-run-worksheet.md` — WP-01 follow-up one-post dry-run worksheet（§8 dry-run command checklist / §9 diff review / §10 abort conditions / §11 future apply / §12 post-write verification / §13 5 rollback drill 情境）
- `docs/20260710-phase2-next-work-scope-preanalysis.md` — Phase 2 next work scope preanalysis（WP-01/02/03/04 拆分）
- `docs/20260710-blogger-backfill-write-phase-preflight.md` — Blogger backfill write phase preflight（rules 面 / gate / dry-run / validation / rollback proposed）
- `docs/20260706-blogger-backfill-write-target-inventory.md` — canonical write target = `.publish.json` sidecar（不寫 markdown frontmatter）
- `docs/20260706-blogger-identity-and-backfill-strategy.md` — identity policy（`bloggerPostId` API-only；publishedAt vs GitHub markdown date 語意分離）
- `docs/20260706-blogger-backfill-report-only-baseline.md` — `check:blogger-backfill` guard 契約（report-only / warning-only / exit 0）
- `docs/publish-json-schema.md` — sidecar JSON schema（`_sample.publish.json` 為權威範本）
- `content/blogger/posts/_sample.publish.json` — sidecar 樣本檔（權威預設值）
- `CLAUDE.md` §16.4 / §24 — Blogger 發布 URL 回填規則
- `CLAUDE.md` §3a Blogger backfill red lines — 不猜 URL / postId / publishedAt

---

## 11. Change log

| 日期 | 動作 | 檔案 | 說明 |
| --- | --- | --- | --- |
| 2026-07-10 | 新增（唯一 mutation） | `docs/20260710-blogger-backfill-wp02-intake-template.md` | 本 doc |

---

## 12. Final report（本 doc landing 收尾；於 commit + push 完成後於 chat 中輸出）

- 本輪做了什麼：docs-only；新增 WP-02 intake template（本 doc；Dean 未來 approval 時之對照工具）
- 修改檔案清單：**新增** `docs/20260710-blogger-backfill-wp02-intake-template.md`（僅此一檔）
- 驗證指令與 exit code：見 §7.2；於 commit 前逐項跑並回報 chat
- 新 source baseline：本 doc commit hash（於 chat 中回報 full hash / short hash / subject）
- deploy 是否未變：✅ 未變（`1170e7e14aaa7f3449999bf92b9c8586719a76b4`；本 session 未寫入）
- git status / ahead-behind / index.lock：commit + push 後 clean / 0 0 / absent
- BLOCKED / deferred：
  - WP-02 write phase 尚未開始（本 doc landing 不代啟動）
  - `blogger-backfill:one-post:write` script 未實作、不新增
  - 其他 candidate 之單篇 dry-run worksheet 未補（Dean 未來若需要，屬 WP-01 後續 slice）
  - Umbrella 未加新 script（維持 `phase1-readiness` 現況）

**本 doc landing 後 Claude 進入 idle-freeze；不主動改動任何檔。**
