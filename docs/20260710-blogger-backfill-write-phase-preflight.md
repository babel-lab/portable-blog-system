# Blogger backfill write-phase preflight（docs-only）

- 建立日期：2026-07-10（Asia/Taipei）
- 類型：docs-only **preflight note**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 目的：為將來（若 Dean explicit approval）之 Blogger backfill **write phase** 落定前置條件、資料需求、允許 / 禁止之寫入位置、風險控管、dry-run 流程、寫後驗證與 rollback。本 session **不**進入 write phase、**不**寫入任何 backfill 真值、**不**猜任何 Blogger internal ID / URL / publishedAt。
- 本輪界線（docs-only）：**不** build / **不** preview / **不** deploy / **不**碰 deploy clone 寫入 / **不**改任何 frontmatter / **不**改任何 sidecar `.publish.json` / **不**動 `check:blogger-backfill` guard 語意（維持 report-only / warning-only / exit 0）/ **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / **不**碰 Blogger / AdSense / GA4 / Google Drive / Search Console 後台 / **不**動 `CLAUDE.md` / `MEMORY.md` / `memory/` / **不**新增 npm script / guard。
- 本輪允許 mutation：新增本檔（唯一）+ 對應 commit + push origin/main。

---

## 0. Boot baseline（本輪已驗）

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `a9003e8` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅（read-only 驗證） | `0 / 0` | clean | absent ✅ |

Source HEAD full hash = `a9003e8649c45ce88fe6ea91cf444c406c6231fd`（`git rev-parse HEAD` / `git rev-parse origin/main` 一致），subject `docs(state): record phase1 rc next readiness`。前接依序為 `f42ba32`（preview sanity checklist）→ `d73492b`（admin export workflow alignment）→ `4e34d20`（rc handoff readout）→ `1480ede`（phase2 next work packet）。

Deploy HEAD full hash = `1170e7e14aaa7f3449999bf92b9c8586719a76b4`（read-only 驗證）。本 session **未寫入** deploy clone。

Readiness checks 本輪已跑（read-only；exit 0）：

| # | 指令 | Exit | 結果 |
| --- | --- | --- | --- |
| C-1 | `npm run check:phase1-readiness` | 0 | validate 0/135/107、npm-script-targets 48/48、adsense-mode-metadata scanned 17 / warnings 0、blogger-backfill scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5（report-only）、prepublish 16/16、smoke 8/8 |
| C-2 | `npm run check:phase1-readiness-contract` | 0 | 22/22 PASS（1 parseable + 1 script-present + 6 required + 13 forbidden absent + 1 ordered 6/6） |
| C-3 | `npm run check:blogger-backfill`（直接跑，觀測本 session 對照 §1 baseline） | 0 | scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5，7 篇 WARN 逐項與 §1 表相符 |

判定：baseline 完全一致；readiness 未 drift；backfill guard 維持 report-only。

---

## 1. Current report-only baseline（recap，未動語意）

`check:blogger-backfill`（`src/scripts/check-blogger-backfill.js`）本 session 實測 = `exit 0`、`scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5`（與 `docs/20260706-blogger-backfill-report-only-baseline.md` §3 / `memory/project_baseline.md` 一致）。

Candidate 判定條件（`isCandidate`）：

- `publishTargets.blogger.enabled === true`
- `status ∈ [ready, published]`
- `draft !== true`

Guard 檢查三個 backfill 欄位（權威名稱、來源優先 `.publish.json` sidecar > `.md` frontmatter fallback）：

- `blogger.publishedUrl`
- `blogger.bloggerPostId`
- `blogger.publishedAt`

7 篇 missing candidate（本 session 實測，值與 predecessor docs 一致；**未動**）：

| # | source markdown | sidecar | status | missing fields |
| --- | --- | --- | --- | --- |
| 1 | `content/blogger/posts/20260515-we-media-myself2.md` | present（`content/blogger/posts/20260515-we-media-myself2.publish.json`）| ready | `blogger.bloggerPostId`（`publishedUrl`、`publishedAt` 已由 sidecar present） |
| 2 | `content/blogger/posts/20260612-after-work-writing-time-blocking.md` | absent | ready | `publishedUrl` / `bloggerPostId` / `publishedAt` |
| 3 | `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md` | absent | ready | 同上 3 欄 |
| 4 | `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md` | absent | ready | 同上 3 欄 |
| 5 | `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md` | absent | ready | 同上 3 欄 |
| 6 | `content/blogger/posts/20260612-daily-reading-habit-notes.md` | absent | ready | 同上 3 欄 |
| 7 | `content/blogger/posts/20260612-reading-notes-three-questions.md` | absent | ready | 同上 3 欄 |

Guard 行為契約（`docs/20260706-blogger-backfill-report-only-baseline.md` §2；本 session 未動）：

1. 正常路徑 `return 0` → **exit 0**；唯 script crash / IO error 才 exit 1
2. 即使有 candidate 缺 backfill，**不 fail**（warning-only）
3. 全程只 `console.log`；**不寫任何檔**（僅 `fs.readFile`；無 write / mkdir）
4. **不修改** frontmatter（`gray-matter` 只 parse，從不 re-serialize 回寫）
5. **不猜測** `publishedUrl` / `bloggerPostId` / `publishedAt`（`resolveBackfillValue` 只讀既有值）
6. output 清楚列出 sidecar-present / sidecar-absent、status、缺哪些欄位、已 present 欄位來源

---

## 2. 為什麼 write phase 仍 blocked

Write phase 尚未啟動；下列**每一項**皆是啟動阻擋（cumulative；缺一即不啟動）：

1. **Dean 尚未提供真值**：`publishedUrl` / `publishedAt` 尚待 Dean 從 Blogger 後台複製；`bloggerPostId` 屬 §A.2 / §A.3 系統欄位，即使 Dean 手動也取不到（見 `docs/20260706-blogger-identity-and-backfill-strategy.md`）。
2. **不猜原則（Red line）**：`CLAUDE.md` §3a Red lines 明列「❌ 不得 guess Blogger postId / publishedAt」；不得從 slug / date / title / URL path / GitHub metadata 推導任何 Blogger internal ID。
3. **Dean explicit approval 未給**：本 session Dean 明列「不要實作 Blogger backfill write phase / 不要實際寫入任何 Blogger 回填值」；即使真值到位，寫入仍須另開 phase + explicit approval。
4. **`bloggerPostId` 尚未有 API flow 可取得**：Blogger API credential / auth / publish / update flow 未落地（`docs/20260706-blogger-identity-and-backfill-strategy.md` §E），因此本欄位無法由系統取得；Dean 亦無法從一般後台介面取得。write phase 若強行留白 / 假造，違反 §B 不猜原則。
5. **write-target 契約僅記錄、未實作**：`docs/20260706-blogger-backfill-write-target-inventory.md` §2 已定 canonical write target = `.publish.json` sidecar；但實際寫入路徑 / diff-only helper / rollback flow **未實作**（無 `backfill:apply` / `admin:write` / `safe-write` script；本 session **不**新增）。
6. **Guard 需維持 report-only**：`check:blogger-backfill` 為 warning-only、`check:phase1-readiness` forbidden token 明列 `backfill:url` / `admin:write` / `safe-write` / `write` / `publish` 皆缺席（contract 22/22 PASS）；升為 blocking 或加入 write 契約皆須另開 phase + 對應 baseline / smoke。

---

## 3. Dean 可提供之資料（A.1 欄位）

Dean 可從 Blogger 後台實際取得、可於未來 write phase 提供之欄位（沿用 `docs/20260706-blogger-identity-and-backfill-strategy.md` §A.1）：

- `blogger.publishedUrl`：Blogger 已發布文章之正式網址（後台文章列表 → 檢視 / 發布視窗可看到）
- `blogger.publishedAt`：Blogger 已發布文章之發布 / 更新時間（後台文章列表可見；ISO 8601 或 `YYYY-MM-DD` 皆可，取決於既有 sidecar 之慣例）
- 選填：`note` / `source reference`（人工備註 / 來源說明；write phase 若加入應獨立欄位，不得覆寫既有 metadata）

上述資料收集容器：`docs/20260706-blogger-backfill-value-intake-template.md`（intake template；docs-only；本 session 未動）。

**建議 A.1 提供的最小充分格式**：

| slug | `blogger.publishedUrl`（Dean 提供） | `blogger.publishedAt`（Dean 提供） |
| --- | --- | --- |
| `20260612-after-work-writing-time-blocking` | *（Dean to provide）* | *（Dean to provide）* |
| ...（同 §1 表）| | |

`we-media-myself2` 之 `publishedUrl` / `publishedAt` 已於 sidecar；不需重複提供。

---

## 4. 絕不可猜測之值

以下值即使 Dean 未提供、write phase 之工具亦**絕不得**產生 / 假造 / 從其他 metadata 推導：

- `blogger.publishedUrl`（Blogger 正式網址）
  - 不得由 `slug` + Blogger 站 URL pattern 推導（Blogger URL 由 permalink slug + yyyy/mm 決定；permalink 可能與 markdown `slug` 不同、可能經人工調整）
  - 不得由既有 `we-media-myself2` sidecar 之 URL pattern 反推其他 6 篇
- `blogger.bloggerPostId`（Blogger 內部 post ID）
  - **永不**由 slug / date / title / URL path / GitHub metadata 推導
  - 待未來 Blogger API / management flow 落地，由系統於 publish/update response 取得（§A.3）
  - Dean 亦不應被要求手動提供
- `blogger.publishedAt`（Blogger 發布 / 更新時間）
  - 不得由 markdown frontmatter `date` 推導（Blogger `publishedAt` 與 GitHub `date` **可不同**，非錯誤；`docs/20260706-blogger-identity-and-backfill-strategy.md` §C）
  - 不得由檔名 `20260612-*` yyyymmdd 推導
- 其他 Blogger internal identifiers（如 `bloggerBlogId`、`lastSyncAt`、`platform sync state`）
  - 皆屬 §A.3 系統欄位，本 phase 之 sidecar schema **無**該欄位；write phase 亦不新增，除非另開 schema-extension phase + explicit approval

---

## 5. 允許之寫入目標（future write phase）

**Canonical write target = `.publish.json` sidecar**（`docs/20260706-blogger-backfill-write-target-inventory.md` §2；本 phase 未動）：

- 每篇 blogger-enabled markdown 對應同名 sidecar：`content/blogger/posts/<slug>.md` → `content/blogger/posts/<slug>.publish.json`
- Sidecar 範本：`content/templates/_sample.publish.json`（`schemaVersion: 1`）
- Sidecar `blogger` block 欄位：`type` / `permalink` / `status` / `publishedUrl` / `publishedAt` / `publishYear` / `publishMonth` / `bloggerPostId` / `history[]`
- Guard fallback 順序：sidecar `blogger.<field>` 優先；`.md` frontmatter `blogger.<field>` 為 legacy fallback

**Write scope（sidecar only；per candidate）**：

| 欄位 | 允許 write phase 動作 |
| --- | --- |
| `publishedUrl` | 由 Dean 提供之真值寫入 |
| `publishedAt` | 由 Dean 提供之真值寫入 |
| `bloggerPostId` | **不寫入**（保留為空字串；待未來 API flow 落地由系統寫入） |
| 其他 sidecar 欄位（`canonical` / `github` / `seo` / `ogImage` 等） | **不動** |

**新建 sidecar 之 minimal template**（6 篇 sidecar-absent 之候選；欄位空字串為預設；`bloggerPostId` 一律留空）：

```json
{
  "$comment": "Blogger backfill sidecar (initial). bloggerPostId 待系統整合。",
  "canonical": { "source": "auto", "url": "" },
  "blogger": {
    "type": "post",
    "permalink": "<slug>",
    "status": "published",
    "publishedUrl": "<Dean to provide>",
    "publishedAt": "<Dean to provide>",
    "publishYear": 2026,
    "publishMonth": 6,
    "bloggerPostId": ""
  },
  "github": { "enabled": true, "path": "/posts/<slug>/", "publishedUrl": "" },
  "seo": { "metaTitle": "", "metaDescription": "", "ogImage": { "url": "", "alt": "" } }
}
```

（`permalink` / `publishYear` / `publishMonth` 皆為 Dean 於後台可見之表層資訊；如 permalink 與 markdown `slug` 不同，須 Dean 明示；不得猜。）

---

## 6. 禁止之寫入目標

Write phase **不得**寫入下列位置（cumulative；違反即 abort）：

| 位置 | 為何禁止 |
| --- | --- |
| `content/blogger/posts/*.md` frontmatter | Legacy fallback；不建議寫入；backfill 只動 sidecar |
| `content/github/**` 之 markdown / sidecar | GitHub 站 metadata；與 Blogger backfill 不相關 |
| `content/settings/**` | 站台設定；backfill 值屬 per-post metadata、非全站 |
| `content/templates/**` | 範本；不代表個別 post metadata |
| `src/**`（scripts / views / styles / js） | Backfill 為 data-only；不應觸發程式改動 |
| `package.json` / `package-lock.json` | 不新增 npm script / guard；backfill write 應由獨立 helper 於 phase 內臨時使用、且 output 為 diff（見 §7） |
| `CLAUDE.md` / `MEMORY.md` / `memory/**` | Policy / state / memory；backfill data 屬 sidecar；此類文件僅於 write phase closeout 之 minimal state sync 允許動（且須遵守 `feedback_phase_discipline.md`） |
| `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | Build output；backfill 不觸發 build |
| `deploy clone` / `gh-pages` | Deploy repo；backfill 為 source-only；不 push、不動 |
| `.cache/` | Build cache；backfill 不觸發 build |
| Blogger 後台 / AdSense / GA4 / Google Drive / Search Console 後台 | 外部平台；Claude 從不登入；Dean 若操作屬另一獨立 phase |

---

## 7. Proposed future write-phase gates（未來啟動 write phase 之必要 gate）

若 Dean 於未來某 session 明確批准啟動 backfill write phase，該 session **必須全數滿足以下 gate 才可寫入**（缺一即不寫）：

### 7.1 Data gates

- **G-D1**：Dean 已提供每篇 candidate 對應之 `publishedUrl` + `publishedAt`（`we-media-myself2` 除外；已於 sidecar）。
- **G-D2**：Dean 已確認 permalink（若不確定，該篇不進 write scope；等待 Dean 再確認）。
- **G-D3**：Dean 已 explicit approval「啟動 backfill write phase」；不由 Claude 自行推斷。
- **G-D4**：本 write phase **不含** `bloggerPostId` 之寫入；該欄位延後至未來 API flow phase。

### 7.2 Baseline gates（write 前）

- **G-B1**：Source repo baseline 對照 `memory/project_baseline.md`：`main` HEAD == `origin/main`、`0 / 0`、clean、`.git/index.lock` absent。
- **G-B2**：Deploy clone baseline 對照：`gh-pages` HEAD == `origin/gh-pages`、`0 / 0`、clean、`.git/index.lock` absent（write phase 不動 deploy，但需驗 baseline）。
- **G-B3**：`check:phase1-readiness` exit 0；`check:phase1-readiness-contract` 22/22 PASS。
- **G-B4**：`check:blogger-backfill` exit 0；scanned / candidates / complete / missing / skipped 對照 §1（write 前 baseline snapshot）。
- **G-B5**：write phase 前先於「保護分支或 backup snapshot」記錄各 sidecar 之 pre-write 狀態（例：`git status --short` 之 clean 對照；未 commit 之 stash / patch 供 rollback；見 §10）。

### 7.3 Scope gates

- **G-S1**：Write 範圍白名單 = 對應之 `.publish.json` sidecar 路徑；**且僅** `blogger.publishedUrl` / `blogger.publishedAt` 兩欄位（`we-media-myself2` 除外 —— 該篇兩欄已 present、不動；本 phase 於該篇無寫入動作）。
- **G-S2**：6 篇 sidecar-absent 之新建 sidecar 採 §5 之 minimal template；其他 sidecar 欄位（`canonical` / `github` / `seo` / `ogImage`）依範本預設值。
- **G-S3**：`bloggerPostId` **強制留空**（`""`），不得由任何來源填入。
- **G-S4**：write phase 之單 slice 建議 = 「一次全 6 篇」或「先 1 篇 dry-run + 5 篇分批」二選一；由 Dean 於啟動時明示（Claude 不代決策）。
- **G-S5**：write phase **不新增** npm script / guard / helper（若必要，屬另一獨立 phase）；write 動作以 minimal ad-hoc Node script（不 registered 於 `package.json`）或人工 JSON 編輯執行；write 結束後該 ad-hoc script **刪除**（不留 in `src/`）。

### 7.4 Behavioral gates

- **G-B-a**：write phase 全程**只動 sidecar 檔**；`git status --short` 於 write 前後之 diff 僅出現 `content/blogger/posts/<slug>.publish.json`（既有 modify）或新增（sidecar-absent 6 篇）；**其他任何路徑之 diff = abort**。
- **G-B-b**：write phase **不 build** / **不 deploy** / **不動** `dist*` / **不 push** gh-pages / **不動** deploy clone。
- **G-B-c**：write phase **不修改 frontmatter**。
- **G-B-d**：write phase **不修改** `CLAUDE.md` / `MEMORY.md` / `memory/**`（write closeout 之 minimal state sync 允許；但屬 write phase 之後之獨立 sync slice，不與 write commit 混）。
- **G-B-e**：write phase 之 commit **不使用** `--no-verify` / `--no-gpg-sign`；hook 失敗即 abort、fix root cause、re-commit。
- **G-B-f**：write phase **不 push** 至 `origin/main` 直至 §8 dry-run diff 通過 + §9 post-write 驗證通過 + Dean 二次確認。

---

## 8. Proposed dry-run / diff-only workflow

Write phase 之 execution 建議三段式（Dean 於啟動時可選單 slice 或分批；本 doc 不代決策）：

### 8.1 Stage 1 — dry-run（no filesystem write）

- 準備一份「預計寫入內容」之 JSON payload（例：`{ slug, sidecarPath, action: 'update'|'create', diff: {...} }` 陣列）。
- 以 Node ad-hoc script（或人工比對）計算 diff：
  - `update`（`we-media-myself2` case，本 phase 不動；此列表為 future template，供其他 partial-sidecar case 沿用）：對現有 sidecar `blogger.publishedUrl` / `blogger.publishedAt` 之 diff。
  - `create`（6 篇 sidecar-absent）：以 §5 template 生成完整 JSON 內容。
- Diff 輸出至 stdout 或 `/tmp/`-類 ephemeral 位置；**不寫入** `content/`。
- Dean 檢視 diff、確認 URL / date 值與後台真值一致、permalink 無誤。

### 8.2 Stage 2 — apply（filesystem write）

- Dean 明示 「apply」→ ad-hoc script 執行寫入：
  - 對 sidecar-present（1 篇；本 phase 無此 case）：更新 `blogger.<field>` 值（保留其他欄位）。
  - 對 sidecar-absent（6 篇）：以 §5 template 建立新檔（`permalink` 由 Dean 明示；不猜）。
- 寫入後立刻執行 §9 post-write 驗證。

### 8.3 Stage 3 — commit + push（write phase 收尾）

- `git status --short` 對照 §7.4 G-B-a 白名單；不合即 abort、rollback。
- `git add <sidecar paths only>`；**不用** `git add -A` / `git add .`（避免拉入其他修改）。
- Commit subject 建議：`data(blogger): backfill sidecar publishedUrl/publishedAt`（或 `create publish sidecar`；不含 `push` / `write` / `deploy` token）。
- `git push origin main`（write phase 之唯一 push；不 push gh-pages）。
- Push 後回到 idle-freeze；**不**同 commit 動 CLAUDE.md / MEMORY.md / memory/。

---

## 9. Validation after future write phase

Write phase 完成 filesystem write 後（Stage 2 之後、Stage 3 commit 之前）**必須通過**下列驗證（缺一即 rollback）：

- **V-1**：`npm run check:blogger-backfill` exit 0；**complete 上升為 6**（`we-media-myself2` 之 `bloggerPostId` 仍留空、屬 A.3 未來 API flow；本 phase 該篇仍歸 missing candidate；complete = candidates − missing = 7 − 1 = 6）
- **V-2**：`npm run validate:content` exit 0；warning 數 = 135（不新增新 warning class；若新增 sidecar 導致 warning 上升，須 audit 原因、可能是 sidecar schema 之 side-effect）
- **V-3**：`npm run check:phase1-readiness` exit 0；umbrella 內 baseline 數字對照 §0 表 —— **`check:blogger-backfill` 之 missing 應為 1**（僅剩 `we-media-myself2` `bloggerPostId`）
- **V-4**：`npm run check:phase1-readiness-contract` 22/22 PASS
- **V-5**：`git status --short` 僅顯示 `content/blogger/posts/<slug>.publish.json` 之 modify / untracked（6 或 7 檔）；**其他任何 diff = abort**
- **V-6**：build 不跑（本 phase 不 build）；若 write phase 後 Dean 明示 build，屬另一獨立 phase
- **V-7**：deploy 不跑（本 phase 不 deploy）；deploy clone 未動

Optional（若 Dean 明示需觀察 render impact，屬另一獨立 phase）：

- `npm run build:blogger` 於本地 dry-build（不 deploy）→ 觀察 `dist-blogger/posts/<slug>/meta.json` 之 `canonical` / `publishedUrl` 是否受 sidecar 更新影響；此 optional 步驟不進 write phase 契約。

---

## 10. Rollback / recovery considerations

若 write phase 於 Stage 2 之後、Stage 3 commit 之前遭 abort（例：§9 V-1 至 V-7 任一失敗、`git status --short` 拉入非白名單 diff、hook 失敗、Dean 中止），rollback 步驟：

- **R-1**：`git status --short` 列出所有 uncommitted 修改。
- **R-2**：對 sidecar-present 之 update case（本 phase 無此案）：`git checkout -- content/blogger/posts/<slug>.publish.json` 還原至 write 前。
- **R-3**：對 sidecar-absent 之 create case（本 phase 6 篇）：直接 `rm content/blogger/posts/<slug>.publish.json`（僅刪除新建 sidecar；不動 markdown）。**注意**：僅刪本 phase 新建之 sidecar；不動任何既有檔（`we-media-myself2.publish.json` 未於本 phase 動）。
- **R-4**：重跑 `check:blogger-backfill`；驗證回到 §1 baseline（`missing 7`）。
- **R-5**：重跑 `check:phase1-readiness` / `check:phase1-readiness-contract` 驗證 exit 0。

若 write phase 已 commit 但未 push：`git reset --soft HEAD~1` + 手動 unstage + §R-2/R-3；此屬 destructive git action，須 Dean explicit approval。

若 write phase 已 push origin/main：屬 committed state；rollback 須另開 revert-only phase（`git revert <sha>` + push）+ Dean explicit approval。不建議 force push。

**Rollback 前置條件**：本 phase 開始前 `main == origin/main` 且 clean（§7.2 G-B1）→ rollback safe。若 baseline drift 已存在，write phase 本就 abort（G-B1 gate）。

---

## 11. Explicit non-goals for this session

本 session **明確不做**（cumulative；違反即 abort）：

| 項目 | 狀態 |
| --- | --- |
| 進入 backfill write phase | ❌ 不做 |
| 寫入任何 Blogger `publishedUrl` / `publishedAt` / `bloggerPostId` | ❌ 未寫入 |
| 建立 6 篇 sidecar-absent 之新 sidecar | ❌ 未建立 |
| 修改 `we-media-myself2.publish.json` 之 `bloggerPostId` | ❌ 未動 |
| 修改任何 markdown frontmatter | ❌ 未動 |
| 動 `src/**` / `content/settings/**` / `content/templates/**` | ❌ 未動 |
| 新增 npm script / guard / helper script | ❌ 未做 |
| 升級 `check:blogger-backfill` 為 blocking / fail-fast | ❌ 未做 |
| build / preview / deploy | ❌ 未做 |
| 動 deploy clone / push gh-pages | ❌ 未動（僅 §0 read-only 驗證） |
| 動 `CLAUDE.md` / `MEMORY.md` / `memory/**` | ❌ 未動 |
| 猜 Blogger `publishedUrl` / `bloggerPostId` / `publishedAt` / `bloggerBlogId` | ❌ 未猜 |
| 從 slug / date / title / URL path / GitHub metadata 推導 Blogger internal ID | ❌ 未做 |
| Blogger 後台任何操作 / repost / draft flip / URL 設定 / 標籤設定 / 圖片上傳 | ❌ 未做 |
| AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 | ❌ 未動 |
| Admin write path / Apply / middleware / admin-write-cli / `--apply` / `dryRun:false` | ❌ 未動 |
| Reverse UTM pm-26 deploy | ❌ 未動 |
| Second GitHub Pages deploy / `github-pages-blog-planning` quarantine 解除 | ❌ 未動 |
| Blogger AdSense Batch 2 P2 live repost | ❌ 未動 |
| Phase 1 final 之降級 / 重新封存 | ❌ 未動 |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | ❌ 未做 |

---

## 12. Recommendation

**建議：本 doc landing 後 remain report-only；不啟動 backfill write phase**（除非 Dean 於未來 session 明確批准）。

理由：

1. `check:blogger-backfill` 為 report-only / warning-only / exit 0；無 blocker、無需急於 write。
2. `bloggerPostId` 屬 A.3 系統欄位、無 API flow；即使強行 write 亦無法補齊，該欄位仍 missing。
3. Dean 尚未於任何 session 主動提供 `publishedUrl` / `publishedAt` 真值。
4. Phase 1 RC baseline 對「backfill 尚未 write」= 兼容（`check:phase1-readiness` exit 0 已含 backfill guard；write 未動不影響 RC 判定）。
5. 本 doc 已把 write phase 之前置條件 / gate / dry-run / validation / rollback 全數 documented；未來啟動時可直接引用、無需重複 audit。

**未來啟動觸發**：Dean 於某 session 明確提出：
- 「請進入 Blogger backfill write phase，附 Dean 提供之 publishedUrl / publishedAt 真值」，且
- 明列本 doc §7 gates 皆已具備、
- 對照本 doc §8–§10 workflow 執行。

Claude **不代 Dean 決策**、**不主動啟動** write phase。

---

## 13. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔（+ 對應 commit + push origin/main）。**不含**任何程式 / frontmatter / settings / sidecar / build / deploy / dev-server 變更；未新增 guard / npm script / preview-only script / write helper；未改 CSS；未改 `CLAUDE.md` / `MEMORY.md` / `memory/`；未觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages；未發布 Blogger；未購買網域 / 未動 DNS / 未碰 AdSense / GA4 / Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`；未猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId`；未從任何 metadata 推導 Blogger internal ID；未新增測試文章 / artifact。§0 boot baseline 為本 session read-only 驗證；§1 baseline recap 為本 session `check:blogger-backfill` 實測（結果與 predecessor docs 一致，未動 guard）；§2 blocked 理由沿用 `docs/20260706-blogger-identity-and-backfill-strategy.md` / `CLAUDE.md` §3a Red lines；§3 Dean 可提供欄位沿用 identity strategy §A.1；§4 不可猜之值沿用 identity strategy §A.2 / §B；§5 允許 write target 沿用 write-target-inventory §2；§6 禁止 write target 為對現有紅線之整合列表；§7 gates 為新提出、未實作、不入契約；§8 dry-run workflow 為 proposed procedure、未實作；§9 validation 為 proposed acceptance；§10 rollback 為 proposed procedure；§11 non-goals 沿用 handoff readout §7 + `CLAUDE.md` §3a Red lines；§12 recommendation 沿用 `CLAUDE.md` §3a Recommended next paths（idle freeze）。

---

## See also

- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger identity 分層 policy；A.1 / A.2 / A.3 / 不猜 ID / date mismatch 非錯誤 / guard 定位；本檔 §2 / §3 / §4 引用）
- `docs/20260706-blogger-backfill-write-target-inventory.md`（canonical write target = `.publish.json` sidecar；本檔 §5 引用）
- `docs/20260706-blogger-backfill-report-only-baseline.md`（guard 行為契約 + report snapshot；本檔 §1 引用）
- `docs/20260706-blogger-backfill-value-intake-template.md`（backfill 真值收集模板；本檔 §3 引用）
- `docs/20260710-phase1-rc-handoff-operating-readout.md`（Phase 1 RC handoff readout；本檔 §6 候選 B 對應之 preflight）
- `docs/20260710-phase1-rc-next-readiness-analysis.md`（Phase 1 RC → next-readiness；§7 候選排序 backfill preflight = 候選 B / #3）
- `docs/20260710-blogger-admin-export-workflow-alignment.md`（Admin export workflow；未直接引用，但同 2026-07-10 docs-only 家族）
- `docs/20260710-blogger-preview-sanity-analysis.md`（Blogger preview sanity checklist；未直接引用，但同家族）
- `docs/20260617-night-blogger-p3-metadata-backfill-preflight.md`（P3 metadata backfill preflight；backfill 仍 Dean-gated）
- `docs/publish-json-schema.md` §5.3（Blogger URL 規則）/ §5.6（`blogger.type`）
- `content/templates/_sample.publish.json`（`schemaVersion: 1` sidecar 範本；本檔 §5 引用）
- `CLAUDE.md` §3a Current state snapshot（含 Red lines / Recommended next paths；不猜 Blogger postId / publishedAt / bloggerBlogId）
- `CLAUDE.md` §7（Blogger 發布 checklist；發布階段，非 backfill）、§23（發布狀態；draft 不得進正式 dist）、§24（Blogger 發布 URL 回填）、§26（package.json 指令）、§27（Claude Code 修改規則）、§29（第一版不做）
- `MEMORY.md` + `memory/project_baseline.md`（frozen source / deploy baseline）
- `memory/project_report_only_metadata_guards.md`（8 warning-only guards + release-readiness umbrella；`check:blogger-backfill` 為獨立 guard、非 metadata guard suite 成員）
- `memory/feedback_phase_discipline.md`（memory-sync-only / docs-only / source-only phases 不重疊）

---

（本文件結束 / end of document）
