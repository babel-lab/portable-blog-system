# Blogger backfill one-post dry-run worksheet（docs-only；WP-01 follow-up）

- 建立日期：2026-07-10（Asia/Taipei）
- 類型：docs-only **one-post dry-run worksheet + rollback drill scenarios**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 對應 work package：`docs/20260710-phase2-next-work-scope-preanalysis.md` §4 **WP-01**（Blogger backfill write-phase rehearsal；docs-only；含 dry-run runbook / rollback drill）之 **follow-up**。前一個 slice = `docs/20260710-blogger-backfill-write-rehearsal-template.md`（模板 + 全 7 篇空白表 + rollback drill 3 情境）；本 doc 進一步聚焦「**單篇 candidate** 之 dry-run worksheet」+ 擴充 rollback drill 為 5 情境（新增 partial multi-file accidental write abort + permalink mismatch abort）。
- 目的：把「若未來啟動 WP-02 那一天，針對**單一** candidate 之 dry-run 流程」以 worksheet 形式細化：（i）candidate 選擇之評估欄位（不代 Dean 選）；（ii）Dean input 空白欄位（不填真值）；（iii）placeholder sidecar diff 範例（**所有值皆為 placeholder token；不含任何真實 URL / ID / timestamp**）；（iv）dry-run command checklist；（v）diff review checklist；（vi）abort conditions；（vii）future WP-02 apply checklist（明標 future only）；（viii）post-write verification checklist（明標 future only）；（ix）5 個 rollback drill scenarios（含新增 2 個）；（x）red lines；（xi）WP-01 follow-up non-goals；（xii）recommendation。**不填任何真值、不寫任何 sidecar、不動 guard 語意、不猜 Blogger IDs / URL / publishedAt / permalink。**
- 本輪界線（docs-only）：**不** build / **不** preview / **不** deploy / **不**碰 deploy clone 寫入 / **不**改任何 frontmatter / **不**改任何 sidecar `.publish.json` / **不**動 `check:blogger-backfill` guard 語意（維持 report-only / warning-only / exit 0）/ **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / **不**買網域 / **不**設 DNS / **不**建 `CNAME` / **不**建 `ads.txt` / **不**啟用 AdSense / **不**改 AdSense production behavior / **不**碰 Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 / **不**動 `CLAUDE.md` / `MEMORY.md` / `memory/` / **不**新增 npm script / preview helper script / **不**動 `package.json` / `package-lock.json` / **不**進入 WP-02 真實寫入。
- 本輪允許 mutation：新增本檔（唯一）+ 對應 commit + push origin/main。

---

## 0. Boot baseline（本輪已驗）

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `f1aec08` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅（read-only 驗證） | `0 / 0` | clean | absent ✅ |

Source HEAD full hash = `f1aec08c38e7f04de3caddd4007a6ae9adec75a3`；subject `docs(blogger): add backfill rehearsal template`（前一 session 落地之 WP-01 rehearsal template；`docs/20260710-blogger-backfill-write-rehearsal-template.md` 為當時唯一 mutation）。前 4 commit：`4d88165`（`docs(phase2): analyze next work scope`）→ `ca9e94f`（`docs(phase1): analyze next phase routes`）→ `a52ff4c`（`docs(state): add phase1 rc docs index`）→ `abc707c`（`docs(blogger): record preview-only helper preanalysis`）→ `c0ee384`（`docs(release): define domain adsense gates`）。

Deploy HEAD full hash = `1170e7e14aaa7f3449999bf92b9c8586719a76b4`（read-only 驗證；本 session **未寫入** deploy clone）。

Readiness checks 本輪已跑（read-only；exit 0）：

| # | 指令 | Exit | 結果 |
| --- | --- | --- | --- |
| C-1 | `npm run check:blogger-backfill`（本 session 首次跑，作為 pre-mutation baseline snapshot） | 0 | scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5；7 篇 WARN 與 rehearsal template §3 表一致 |

`check:phase1-readiness` / `check:phase1-readiness-contract` 於本 session mutation 之後始跑（見 §12 verification snapshot）。

判定：baseline 完全一致；readiness 未 drift；backfill guard 維持 report-only；deploy clone 未動；`.git/index.lock` 皆 absent。

---

## 1. Purpose / scope

**Purpose**：為未來 WP-02（真實 sidecar 寫入）**單篇** first slice 建立 offline 可走完之 dry-run worksheet + 5 個 rollback drill scenarios。本 worksheet 之定位是「**單篇聚焦**」——不同於 rehearsal template（全 7 篇空白表 + 3 個 rollback 情境），本 worksheet 只針對「Dean 未來選定之 1 篇 candidate」提供 walk-through 空間 + 補強 rollback drill 至 5 情境（多加 partial multi-file accidental write abort + permalink mismatch abort）。

**Scope**（docs-only；本 doc 之唯一 mutation = 本檔）：

- ✅ 新增本 doc（單檔 markdown）
- ✅ 引用 predecessor docs 之既有 §-anchor（不重述 red lines / 不 downgrade / 不覆寫）
- ✅ Placeholder sidecar diff 範例（**所有值 = placeholder token；無真值**）
- ❌ **不填任何 Blogger 真值**（`publishedUrl` / `publishedAt` / `bloggerPostId` / `permalink` / `publishYear` / `publishMonth` / `title` / `bloggerBlogId` 皆不填）
- ❌ **不寫入任何 `.publish.json` sidecar**
- ❌ **不動任何 markdown frontmatter**
- ❌ **不新增 helper script** / **不新增 npm script** / **不動 `package.json`**
- ❌ **不代 Dean 選 candidate**（本 worksheet §4 提供評估欄位；Dean 未來若進 WP-02 才選）
- ❌ **不代 Dean 決策啟動 WP-02**
- ❌ **不 build / 不 preview / 不 deploy / 不 push gh-pages**
- ❌ **不動 CLAUDE.md / MEMORY.md / memory/**
- ❌ **不動 deploy clone**

---

## 2. Relationship to WP-01 and future WP-02

三份 doc 之關係（不覆蓋、不重複、不 downgrade）：

```
docs/20260710-blogger-backfill-write-phase-preflight.md      ← 前置條件 / gate / dry-run / validation / rollback proposed（規則面）
    │
    ├── docs/20260710-phase2-next-work-scope-preanalysis.md §4 WP-01  ← Phase 2 work-package 拆分中之 WP-01（planning 面）
    │
    ├── docs/20260710-blogger-backfill-write-rehearsal-template.md   ← WP-01 landed 之第一份 rehearsal template（全 7 篇空白表 + 3 rollback drill 情境）
    │
    └── 本 doc（WP-01 follow-up；one-post dry-run worksheet）        ← 聚焦單篇 candidate + 5 rollback drill 情境（補 partial write abort + permalink mismatch abort）
                │
                └── 未來 WP-02 landing（Dean-approved；提供真值 + 明列篇目）  ← 真實 sidecar 寫入；本 doc 不代啟動、不代 Dean 決策
```

**本 doc 定位**：

- 屬 **WP-01 之 follow-up slice**（docs-only）；本 doc 落地 = WP-01 之第二份 rehearsal artifact。
- **不**屬 WP-02；本 doc landing 後 write phase 仍 dormant / blocked。
- 未來若 Dean 想擴 rehearsal（例：新增更多 rollback drill 情境 / 加 sidecar-present partial update mock），仍為 WP-01 後續 slice；各自新增 docs、皆為 docs-only。
- WP-02 若啟動，仍為獨立 phase、獨立 approval、獨立 gate；本 doc 不代任何一步實作。

**本 doc 明確不做（重申）**：

- **不**新增 npm script（例：`npm run backfill:rehearsal` / `backfill:dry-run` / `backfill:apply`）
- **不**新增 helper script（例：`src/scripts/backfill-rehearsal.js`）
- **不**新增 fixture 檔（例：`content/validation-fixtures/backfill/*`）
- **不**改 `check:blogger-backfill` guard 語意（維持 report-only / warning-only / exit 0）
- **不**改 `check:phase1-readiness-contract` 之 forbidden token list（`backfill:url` / `admin:write` / `safe-write` / `write` / `publish` 皆維持缺席）

---

## 3. Current frozen baseline

- **Source frozen baseline**：`f1aec08c38e7f04de3caddd4007a6ae9adec75a3` == `origin/main`（clean；ahead/behind 0/0；index.lock absent）
- **Deploy frozen baseline**：`1170e7e14aaa7f3449999bf92b9c8586719a76b4` == `origin/gh-pages`（clean；ahead/behind 0/0；index.lock absent；read-only 驗證；本 session 未寫入）
- **Phase 1 status**：Phase 1 final 已 landed（2026-05-18；`docs/phase-1-completion-report.md`）；Phase 1 RC 家族 8 docs + route selection preanalysis + Phase 2 next-work scope preanalysis + WP-01 rehearsal template 皆 landed（見 `docs/20260710-phase1-rc-docs-index.md`）
- **本 doc landing 後之 next frozen baseline** = 本 doc commit hash（見 §12 final report）

---

## 4. Current report-only backfill baseline（本 session 實測）

`npm run check:blogger-backfill`（本 session 實測）**exit 0**；`scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5`（與 rehearsal template §3 / preflight §1 / value intake template §Guard baseline 一致；**未動**）。

Guard 契約（`docs/20260706-blogger-backfill-report-only-baseline.md` §2；未動）：

1. 正常路徑 `return 0` → **exit 0**；唯 script crash / IO error 才 exit 1
2. 即使有 candidate 缺 backfill，**不 fail**（warning-only）
3. 全程只 `console.log`；**不寫任何檔**（僅 `fs.readFile`；無 write / mkdir）
4. **不修改** frontmatter（`gray-matter` 只 parse，從不 re-serialize 回寫）
5. **不猜測** `publishedUrl` / `bloggerPostId` / `publishedAt`（`resolveBackfillValue` 只讀既有值）

**7 篇 missing candidate 對照**（本 session 實測，與 predecessor docs 一致）：

| # | source markdown | sidecar | status | missing fields |
| --- | --- | --- | --- | --- |
| 1 | `content/blogger/posts/20260515-we-media-myself2.md` | **present** | ready | `blogger.bloggerPostId`（`publishedUrl` / `publishedAt` 已由 sidecar 提供） |
| 2 | `content/blogger/posts/20260612-after-work-writing-time-blocking.md` | absent | ready | 全 3 欄 |
| 3 | `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md` | absent | ready | 全 3 欄 |
| 4 | `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md` | absent | ready | 全 3 欄 |
| 5 | `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md` | absent | ready | 全 3 欄（**caveat**：Blogger LIVE published 2026-06-17 有 Dean 截圖佐證，但 backfill 值仍待 Dean 從後台回填；不可從 CLAUDE.md 記載反推） |
| 6 | `content/blogger/posts/20260612-daily-reading-habit-notes.md` | absent | ready | 全 3 欄 |
| 7 | `content/blogger/posts/20260612-reading-notes-three-questions.md` | absent | ready | 全 3 欄 |

**Identity policy 提醒**（`docs/20260706-blogger-identity-and-backfill-strategy.md`；未動）：`bloggerPostId` 屬 §A.3 系統欄位，即使 Dean 手動亦取不到；待未來 Blogger API flow 落地由系統於 publish/update response 取得。**Dean 不列必填**該欄位。因此本 worksheet 之單篇 dry-run 亦一律將 `bloggerPostId` 標為 `<PLACEHOLDER_EMPTY_STRING>`（`""`）+ 標記 `API-only / not manually required`。

---

## 5. Candidate selection worksheet（rehearsal only；Dean 未來若進 WP-02 才選）

本 §5 為 Dean 未來若進 WP-02 之第一篇 candidate 選擇評估欄位。**本 doc 不代 Dean 選**；本表僅為 offline reasoning 用之空白工作表。

### 5.1 評估欄位定義

| 欄位 | 說明 |
| --- | --- |
| `slug` | Candidate slug（不含日期前綴） |
| `sidecar action` | `update`（sidecar present；partial update）or `create`（sidecar absent；新建） |
| `# fields to write` | 本次 write 需寫入之欄位數量 |
| `Dean 需提供欄位` | Dean 未來需從 Blogger 後台複製之欄位（不列 API-only） |
| `note / caveat` | 特殊情況（例：Blogger LIVE 但值未回填 / permalink 需 Dean 明示 / 已有部分 sidecar 值） |
| `Dry-run 風險評估` | Low / Medium / High（依 write scope / rollback 複雜度） |
| `Dean 目標對應` | 若 Dean 目標 = 「先驗 write path」→ 選 low risk / few fields；若 Dean 目標 = 「先補 P3 已 live 篇目」→ 選 `blog-restart-steady-rhythm-notes` |

### 5.2 空白評估表（7 篇候選；Dean 未來若進 WP-02 才選 1 篇）

| # | slug | sidecar action | # fields to write | Dean 需提供欄位 | note / caveat | Dry-run 風險評估 | Dean 目標對應 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `we-media-myself2` | `update` | 0（`bloggerPostId` 屬 API-only；本 phase 無實際寫入） | — | 該篇於 WP-02 之意義為 **recorded no-op**；不建議作為 first slice | Low（無寫入） | 「先驗 no-op 路徑」（罕見；不建議） |
| 2 | `after-work-writing-time-blocking` | `create` | 5+（`publishedUrl` / `publishedAt` / `permalink` / `publishYear` / `publishMonth` + `bloggerPostId=""`） | `publishedUrl` / `publishedAt` / `permalink` / `publishYear` / `publishMonth` | 三值全缺 | Medium（新建 sidecar 首次觸發 write path） | 「先驗新建 sidecar 流程」 |
| 3 | `ai-tools-simplify-daily-workflow` | `create` | 5+ | 同 #2 | 三值全缺 | Medium | 同 #2 |
| 4 | `blog-as-personal-knowledge-base` | `create` | 5+ | 同 #2 | 三值全缺 | Medium | 同 #2 |
| 5 | `blog-restart-steady-rhythm-notes` | `create` | 5+ | 同 #2 | 三值全缺；**caveat**：Blogger LIVE 2026-06-17（Dean 截圖佐證）；backfill 真值仍待 Dean 提供、不可從 CLAUDE.md 記載反推 | Medium（同 #2；LIVE 狀態不改 dry-run 複雜度） | 「先補 P3 已 live 篇目 backfill」 |
| 6 | `daily-reading-habit-notes` | `create` | 5+ | 同 #2 | 三值全缺 | Medium | 同 #2 |
| 7 | `reading-notes-three-questions` | `create` | 5+ | 同 #2 | 三值全缺 | Medium | 同 #2 |

**Claude 不代 Dean 選**；本表為 Dean 未來 approval 時之對照工具。若 Dean 未來 approval 只想寫 1 篇 first slice，本表可協助 Dean 判斷該篇之 risk / 對應目標。

### 5.3 選定候選之 placeholder（本 doc 用；不代 Dean 決策）

以下 §6 / §7 / §8 / §9 / §11 之所有具體命令 / diff / checklist 之 slug 皆以 `<CANDIDATE_SLUG>` placeholder 表示；Dean 未來若進 WP-02，於 approval 中會明列真值。本 doc **不代選** 任一 slug；`<CANDIDATE_SLUG>` **不指向** 任何具體篇目。

- `<CANDIDATE_SLUG>` = *（Dean 未來 approval 中提供之單篇 slug；本 doc 為 placeholder）*
- `<CANDIDATE_MARKDOWN_PATH>` = `content/blogger/posts/<yyyymmdd>-<CANDIDATE_SLUG>.md`（實際路徑於 Dean approval 中明列）
- `<CANDIDATE_SIDECAR_PATH>` = `content/blogger/posts/<yyyymmdd>-<CANDIDATE_SLUG>.publish.json`（同名 `.publish.json`；per canonical write target 契約）

---

## 6. Dean input worksheet（rehearsal only；Dean 未來若進 WP-02 才填）

以下表為 **rehearsal 空白 input 工作表**；本 doc **不填任何真值**。Dean 於未來 WP-02 session 提供時，建議於 approval message 中 inline 提供（不必直接改本 rehearsal doc）。

### 6.1 Placeholder token 定義

| Token | 應被 Dean 未來替換為 | Claude **絕不**推導之來源 |
| --- | --- | --- |
| `<PLACEHOLDER_PUBLISHED_URL>` | Blogger 已發布正式網址 | slug / date / title / URL pattern / GitHub metadata / `we-media-myself2` sidecar URL pattern |
| `<PLACEHOLDER_PUBLISHED_AT>` | Blogger 已發布 / 更新時間（ISO 8601 或 `YYYY-MM-DD`） | markdown frontmatter `date` / 檔名 yyyymmdd |
| `<PLACEHOLDER_PERMALINK>` | Blogger URL slug 部分（`YYYY/MM/<permalink>.html` 之 `<permalink>`） | markdown slug |
| `<PLACEHOLDER_PUBLISH_YEAR>` | Blogger URL yyyy 部分 | 檔名 yyyymmdd / markdown `date` |
| `<PLACEHOLDER_PUBLISH_MONTH>` | Blogger URL mm 部分 | 同上 |
| `<PLACEHOLDER_EMPTY_STRING>` | 一律 `""`（API-only；`bloggerPostId` 永遠留空） | 任何來源；本欄永不推導 |
| `<PLACEHOLDER_TITLE>` | Blogger 後台顯示標題（可選；不進 sidecar schema） | markdown title |
| `<PLACEHOLDER_NOTE>` | Dean 於 approval 中之備註（可選；不進 sidecar schema） | — |

### 6.2 單篇 Dean input 空白工作表

| 欄位 | 值（Dean 未來提供） |
| --- | --- |
| `local content slug` | `<CANDIDATE_SLUG>` *（Dean to provide）* |
| `markdown path` | `<CANDIDATE_MARKDOWN_PATH>` *（Dean to provide；per approval 中明列）* |
| `sidecar path` | `<CANDIDATE_SIDECAR_PATH>` *（Dean to provide；per approval 中明列；由 markdown 檔名衍生）* |
| `sidecar action` | `<create>` or `<update>` *（Dean to provide）* |
| `blogger.title`（可選；不進 sidecar schema） | `<PLACEHOLDER_TITLE>` *（Dean to provide 若想記錄）* |
| `blogger.publishedUrl` | `<PLACEHOLDER_PUBLISHED_URL>` *（Dean to provide；**逐字元一致** with 後台）* |
| `blogger.publishedAt` | `<PLACEHOLDER_PUBLISHED_AT>` *（Dean to provide；**逐字元一致** with 後台）* |
| `blogger.permalink` | `<PLACEHOLDER_PERMALINK>` *（Dean to provide；**逐字元一致** with 後台 URL）* |
| `blogger.publishYear` | `<PLACEHOLDER_PUBLISH_YEAR>` *（Dean to provide；為 publishedUrl 之 yyyy 部分）* |
| `blogger.publishMonth` | `<PLACEHOLDER_PUBLISH_MONTH>` *（Dean to provide；為 publishedUrl 之 mm 部分；`5` or `05`；取決於既有 sidecar 慣例；`we-media-myself2` 為 numeric `5`）* |
| `blogger.bloggerPostId` | `<PLACEHOLDER_EMPTY_STRING>` **一律 `""`；API-only；Dean 不填、Claude 不猜** |
| `optional note` | `<PLACEHOLDER_NOTE>` *（Dean to provide 若想附備註）* |

**Reminder**：本表為模板；本 doc landing 時所有欄位皆為 placeholder；**不含任何真值**。

---

## 7. Placeholder sidecar diff example（**placeholder only**；**不含**任何真實 URL / ID / timestamp）

**⚠️ 明確警告**：本 §7 之 JSON 為 **placeholder-only example**；所有值皆為 `<PLACEHOLDER_*>` token；**不含**任何真實 Blogger URL / ID / timestamp / permalink / bloggerBlogId / bloggerPostId；**不含**任何從 slug / date / title / URL path / GitHub metadata / CLAUDE.md 記載推導之值。本 doc **絕不落地** JSON 至任何 sidecar path。

### 7.1 Create case（sidecar-absent；預期新建 sidecar）

假設 `<CANDIDATE_SLUG>` 為 sidecar-absent 之 6 篇之一（Dean 未來明列）：

**預期 diff（相對於「無檔」）**：

```diff
--- /dev/null
+++ content/blogger/posts/<yyyymmdd>-<CANDIDATE_SLUG>.publish.json
@@ -0,0 +1,20 @@
+{
+  "schemaVersion": 1,
+  "canonical": { "url": "", "source": "auto" },
+  "ogImage":   { "url": "", "alt": "" },
+  "blogger": {
+    "type": "post",
+    "permalink": "<PLACEHOLDER_PERMALINK>",
+    "status": "published",
+    "publishedUrl": "<PLACEHOLDER_PUBLISHED_URL>",
+    "publishedAt": "<PLACEHOLDER_PUBLISHED_AT>",
+    "bloggerPostId": "<PLACEHOLDER_EMPTY_STRING>",
+    "publishYear": "<PLACEHOLDER_PUBLISH_YEAR>",
+    "publishMonth": "<PLACEHOLDER_PUBLISH_MONTH>",
+    "history": []
+  },
+  "github": { "slug": "", "path": "", "status": "draft", "publishedUrl": "", "publishedAt": "" },
+  "seo": { "metaTitle": "", "metaDescription": "", "robots": "index,follow" }
+}
```

**注意事項**：

- 所有 `<PLACEHOLDER_*>` token **絕非**真實值；Dean 未來 approval 中替換
- `bloggerPostId` = `<PLACEHOLDER_EMPTY_STRING>` = `""`（永空；API-only）
- `history` = `[]`（初始寫入；無歷史）
- `canonical.url` / `ogImage.url` / `ogImage.alt` / `github.*` / `seo.metaTitle` / `seo.metaDescription` = 空字串（`_sample.publish.json` 之預設值）
- `seo.robots` = `"index,follow"`（`_sample.publish.json` 之預設值）
- `blogger.type` = `"post"`（若 Dean 未來 approval 明示為 `"page"`，需獨立標記；本 worksheet 預設 `"post"`）
- `blogger.status` = `"published"`（若已 published 於後台；Dean approval 中確認）

### 7.2 Update case（sidecar-present；partial update）

假設 `<CANDIDATE_SLUG>` = `we-media-myself2`（sidecar-present；只缺 `bloggerPostId`）：

**預期 diff（相對於現有 sidecar）**：

```diff
# content/blogger/posts/20260515-we-media-myself2.publish.json
# 現有 sidecar 內容（read-only；本 doc 不動）:
#   blogger.bloggerPostId = ""  ← 已為空字串（API-only；無需寫入）
#
# WP-02 於本 slice 之預期 diff = EMPTY（無實際欄位變更；recorded no-op）
```

**注意事項**：

- `we-media-myself2` sidecar 之 `bloggerPostId` 已為 `""`（現況）；WP-02 若寫入 `""` 亦為 no-op
- 該篇於 WP-02 之意義 = **recorded no-op**；`check:blogger-backfill` 該篇之 `missing bloggerPostId` warning 仍存在（因 guard 檢查 `!== ""` 之 truthy 值；per report-only baseline）
- 不建議選該篇作為 first slice（無實質 write path 觸發）

### 7.3 Absolute placeholder rule

本 §7 之所有 diff / JSON / value **皆為 placeholder token**：

- ❌ **不含**真實 blogger.blogspot.com URL / 網域
- ❌ **不含**真實 yyyy/mm 路徑
- ❌ **不含**真實 permalink slug
- ❌ **不含**真實 ISO 8601 timestamp / date
- ❌ **不含**真實 Blogger internal ID
- ❌ **不含**從 slug / date / title / URL path / GitHub metadata / CLAUDE.md 記載推導之值
- ❌ **不含** `we-media-myself2` sidecar 之 URL pattern 反推之其他 6 篇值

---

## 8. Dry-run command checklist（rehearsal only；本 doc **不執行**任何命令）

本 §8 為未來 WP-02 之 Stage 1 dry-run walkthrough（Preflight §8.1 + rehearsal template §5 之細化）。本 doc **不執行**任何命令；下列命令為 rehearsal 範例，Dean 於未來 WP-02 session 才會實際跑（或由 Claude 依 approval 執行）。

### 8.1 Baseline verify（rehearsal step D-1）

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

**期望**：`main`、HEAD == `origin/main`、`0 / 0`、clean、log 顯示 rehearsal 前之 frozen baseline。

**abort 條件**：HEAD != origin/main / `0 / 0` 不成立 / working tree dirty / index.lock 存在 → 停止 rehearsal，通報 Dean，等待 baseline 修正。

### 8.2 Report-only guard baseline snapshot（rehearsal step D-2）

```bash
# rehearsal-only；本 doc 不執行
npm run check:blogger-backfill
npm run check:phase1-readiness
npm run check:phase1-readiness-contract
```

**期望**：`scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5` exit 0；readiness 16/16 + smoke 8/8 exit 0；contract 22/22 PASS。此為 write 前 baseline snapshot；write 後對照 §11 V-*。

**abort 條件**：backfill 數字不符 / readiness exit 非 0 / contract 22/22 不成立 → 停止 rehearsal。

### 8.3 Diff-only compute（rehearsal step D-3）

**目的**：於「不落地任何檔」的前提下，計算「若真 apply，會對 `<CANDIDATE_SIDECAR_PATH>` 產生什麼 diff」。

**rehearsal command（不執行；示意用）**：

```bash
# rehearsal-only；本 doc 不執行；未來 WP-02 session 由 Claude 依 approval 執行
# 方式 A：以 stdout 印出預期 JSON 內容，Dean 於 chat 中 review
node -e '
const expected = {
  schemaVersion: 1,
  canonical: { url: "", source: "auto" },
  ogImage: { url: "", alt: "" },
  blogger: {
    type: "post",
    permalink: process.env.DEAN_PERMALINK,        // Dean 未來 approval 中提供
    status: "published",
    publishedUrl: process.env.DEAN_PUBLISHED_URL, // Dean 未來 approval 中提供
    publishedAt: process.env.DEAN_PUBLISHED_AT,   // Dean 未來 approval 中提供
    bloggerPostId: "",
    publishYear: Number(process.env.DEAN_PUBLISH_YEAR),
    publishMonth: Number(process.env.DEAN_PUBLISH_MONTH),
    history: []
  },
  github: { slug: "", path: "", status: "draft", publishedUrl: "", publishedAt: "" },
  seo: { metaTitle: "", metaDescription: "", robots: "index,follow" }
};
console.log(JSON.stringify(expected, null, 2));
'
```

**注意**：

- 上述命令為 rehearsal-only；本 doc **不執行**；`DEAN_*` 環境變數為 hypothetical。
- 未來 WP-02 若 Dean 傾向以 chat message inline 提供真值（而非 env var），Claude 於 chat 中構造 diff 輸出至 stdout；**不落地** intake file 於 repo。
- Diff 輸出**只到 stdout / `/tmp/` 或 ephemeral 檔**；**絕不**寫入 `content/` / `src/` / repo root。
- 若 Dean 未來提供之值為字串（例 `publishYear: "2026"`），需與既有 sidecar 慣例（`we-media-myself2` 為 numeric `2026`）對照；Dean 未來 approval 明示 numeric or string；本 doc 預設 numeric（per `_sample.publish.json` 為 empty string，實際 sidecar `we-media-myself2` 為 numeric）。

---

## 9. Diff review checklist（rehearsal only）

Dean 於未來 WP-02 檢視 dry-run diff 時逐項對照（沿用 rehearsal template §5.4；補「單篇聚焦」細節）：

- [ ] `<CANDIDATE_SIDECAR_PATH>` 之 `blogger.publishedUrl` = `<PLACEHOLDER_PUBLISHED_URL>`（Dean 提供之真值）**逐字元一致**（含 `https://` / 大小寫 / `.html` / yyyy/mm 路徑）
- [ ] `<CANDIDATE_SIDECAR_PATH>` 之 `blogger.publishedAt` = `<PLACEHOLDER_PUBLISHED_AT>`（Dean 提供之真值）**逐字元一致**（ISO 8601 或既有 sidecar 慣例）
- [ ] `<CANDIDATE_SIDECAR_PATH>` 之 `blogger.permalink` = `<PLACEHOLDER_PERMALINK>`（Dean 提供之真值）**逐字元一致**（與後台 URL 之 `<permalink>` 部分一致）
- [ ] `<CANDIDATE_SIDECAR_PATH>` 之 `blogger.publishYear` = `<PLACEHOLDER_PUBLISH_YEAR>`（Dean 提供之真值）
- [ ] `<CANDIDATE_SIDECAR_PATH>` 之 `blogger.publishMonth` = `<PLACEHOLDER_PUBLISH_MONTH>`（Dean 提供之真值）
- [ ] `<CANDIDATE_SIDECAR_PATH>` 之 `blogger.bloggerPostId` = `""`（空字串；**絕無**任何值）
- [ ] `<CANDIDATE_SIDECAR_PATH>` 之 `blogger.type` = `"post"`（除非 Dean 未來 approval 明示為 `"page"`）
- [ ] `<CANDIDATE_SIDECAR_PATH>` 之 `blogger.status` = `"published"`
- [ ] `<CANDIDATE_SIDECAR_PATH>` 之 `blogger.history` = `[]`
- [ ] `<CANDIDATE_SIDECAR_PATH>` 之 `canonical` / `github` / `seo` / `ogImage` 欄位 = `_sample.publish.json` 之預設值（空字串 / `"auto"` / `"draft"` / `"index,follow"`）
- [ ] Sidecar path 精準 = `<CANDIDATE_MARKDOWN_PATH>` 之同名 `.publish.json`（例：`.../<yyyymmdd>-<CANDIDATE_SLUG>.md` → `.../<yyyymmdd>-<CANDIDATE_SLUG>.publish.json`）
- [ ] 白名單外任何欄位 = 缺席（未新增任何 non-schema field）
- [ ] Diff **僅**涉及 `<CANDIDATE_SIDECAR_PATH>`；其他任何路徑之 diff = 0 檔
- [ ] Update case（`we-media-myself2`）之預期 diff = **empty**（本 phase 無實際寫入）

---

## 10. Abort conditions（dry-run 階段任一命中即 abort）

若下列任一命中，dry-run 階段立即 abort，不進 apply：

| # | Abort 條件 | 對應處理 |
| --- | --- | --- |
| A-1 | Baseline verify（§8.1）失敗（HEAD drift / dirty tree / index.lock） | 停止 rehearsal；通報 Dean baseline 已 drift；等待 Dean 決定復原路徑 |
| A-2 | Report-only guard baseline（§8.2）數字不符 | 停止 rehearsal；audit 差異原因；未證實無害前不進 apply |
| A-3 | 任一欄位與 Dean 提供之真值**不一致**（含 typo / 大小寫 / trailing whitespace） | 停止 dry-run；請 Dean 再度確認真值；重新 §8.3 diff-only compute |
| A-4 | Dean 未提供某必要欄位（`publishedUrl` / `publishedAt` / `permalink` / `publishYear` / `publishMonth`）之真值 | 停止 dry-run；請 Dean 補提供；不代猜 |
| A-5 | Sidecar path 與 markdown 檔名不對應（yyyymmdd 前綴 / slug 部分不一致） | 停止 dry-run；audit 檔名對應；非同名 `.publish.json` 一律禁止 |
| A-6 | 出現任何白名單外欄位（例：`blogger.legacyLastSyncAt` / `blogger.bloggerBlogId`）之 diff | 停止 dry-run；審查 schema；`_sample.publish.json` 為權威範本 |
| A-7 | 出現任何白名單外檔案（`.md` / `settings/**` / `src/**` / `package.json` / `views/**` / `styles/**` / `js/**` / `scripts/**` / `dist*` / `.cache/`）之 diff | 停止 dry-run；audit 觸發原因；unstage、restore；不進 apply |
| A-8 | Dean 於 review 中口頭 / 明示 abort | 立即停止；無需理由；rehearsal 為 Dean 主導 |
| A-9 | 出現任何 non-placeholder 真值於本 doc 或 rehearsal doc 之 committed content | 立即停止；本 doc 之 §7 為 placeholder-only；若真值誤入，abort + revert doc |
| A-10 | `bloggerPostId` 出現任何非 `""` 之值 | 立即停止；本欄位 API-only；任何值皆為錯誤 |
| A-11 | Permalink 與 Dean 提供之 URL 之 `<permalink>` 部分**不一致** | 詳見 §12 mock scenario 5（permalink mismatch abort） |

---

## 11. Future WP-02 apply checklist（**future only；本 doc 不執行**）

**⚠️ 本 §11 明確標記為 future only**：本 doc 為 WP-01 follow-up rehearsal；apply 屬 WP-02。以下 checklist 僅供 rehearsal 對照 / 未來 WP-02 session 引用；本 doc **不執行**任何 apply 命令、**不寫入**任何 sidecar。

### 11.1 Pre-apply gate（future WP-02 only；rehearsal 對照用）

- [ ] Baseline 對照 §8.1（未 drift）
- [ ] Report-only guard baseline 對照 §8.2（未 drift）
- [ ] Dry-run diff 已 §9 逐項確認通過
- [ ] Dean 於 chat 中明確聲明「apply」+ 明列篇目 slug + 提供全部必要欄位真值
- [ ] Claude 於本 session 再度確認：**不動** frontmatter / **不動** deploy clone / **不動** guard / **不動** `package.json` / **不動** memory
- [ ] Rollback plan（§12 三種 case）已 review

### 11.2 Filesystem write（future WP-02 only；rehearsal 對照命令）

```bash
# future WP-02 only；本 doc 不執行
# Create case（sidecar-absent；1 篇）：
node -e '
const fs = require("fs");
const path = process.env.DEAN_SIDECAR_PATH;  // Dean approval 中明列
const payload = {
  schemaVersion: 1,
  canonical: { url: "", source: "auto" },
  ogImage: { url: "", alt: "" },
  blogger: {
    type: "post",
    permalink: process.env.DEAN_PERMALINK,
    status: "published",
    publishedUrl: process.env.DEAN_PUBLISHED_URL,
    publishedAt: process.env.DEAN_PUBLISHED_AT,
    bloggerPostId: "",
    publishYear: Number(process.env.DEAN_PUBLISH_YEAR),
    publishMonth: Number(process.env.DEAN_PUBLISH_MONTH),
    history: []
  },
  github: { slug: "", path: "", status: "draft", publishedUrl: "", publishedAt: "" },
  seo: { metaTitle: "", metaDescription: "", robots: "index,follow" }
};
fs.writeFileSync(path, JSON.stringify(payload, null, 2) + "\n", "utf8");
'
```

### 11.3 Write scope 白名單（future WP-02 only；apply 前必再度確認）

**允許寫入**：

- ✅ **僅** `<CANDIDATE_SIDECAR_PATH>`（單篇；Dean approval 中明列之單一 `.publish.json`）

**禁止寫入（cumulative；違反即 abort）**：

- ❌ 任何 `.md`（frontmatter 不動）
- ❌ 任何其他 `.publish.json`（本 slice 只寫 1 篇）
- ❌ 任何 `content/settings/**` / `content/templates/**` / `content/github/**` / `content/drafts/**` / `content/archive/**`
- ❌ 任何 `src/**` / `views/**` / `styles/**` / `js/**` / `scripts/**`
- ❌ `package.json` / `package-lock.json`
- ❌ `CLAUDE.md` / `MEMORY.md` / `memory/**`
- ❌ `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `.cache/`
- ❌ deploy clone / gh-pages
- ❌ 任何 ephemeral intake file（若使用；apply 完成後**必須刪除**；不進 repo）

### 11.4 Ephemeral cleanup（future WP-02 only；apply 完成後）

- [ ] 任何 ad-hoc Node script（若使用）已刪除；不留 `src/scripts/**`
- [ ] 任何 ephemeral intake JSON（若使用；例 `/tmp/dean-inputs.json`）已 `rm`；`git status --short` 不顯示該檔
- [ ] `/tmp/dry-run-diff.log`（若使用）已刪除
- [ ] `git status --short` 只顯示 **1** 個檔（`<CANDIDATE_SIDECAR_PATH>`）；其他 diff = **0 檔**

### 11.5 Commit（future WP-02 only；收尾）

```bash
# future WP-02 only；本 doc 不執行
git add <CANDIDATE_SIDECAR_PATH>
git commit -m "data(blogger): backfill sidecar publishedUrl/publishedAt <CANDIDATE_SLUG>"
git push origin main
```

**注意**：

- **不用** `git add -A` / `git add .` / `git add content/`（可能拉入非白名單）
- **不用** `--no-verify` / `--no-gpg-sign`（hook 失敗 → fix root cause → re-commit）
- **不 push** gh-pages
- Commit subject 不含 `write` / `publish` / `backfill:url` / `admin:write` / `safe-write` / `push` token 作為 script name（避免 forbidden token 誤入；本 subject 只出現於 commit message，不影響 forbidden token guard）
- 單篇 first slice；其他 5 篇留至後續 WP-03 slice

---

## 12. Post-write verification checklist（**future only；本 doc 不執行**）

**⚠️ 本 §12 明確標記為 future only**：本 doc 為 WP-01 follow-up rehearsal；post-write verification 屬 WP-02 apply 完成後執行。本 doc **不執行**任何 verification 命令。

Verification（未來 WP-02 apply 之後、commit 之前必須逐項通過）：

- [ ] **V-1**：`npm run check:blogger-backfill` exit 0；
  - `create` case：**complete = 1**（本 slice 該篇之三值填齊）；**missing = 6**（減 1）；scanned / candidates / skipped 不變
  - `update` case（`we-media-myself2`）：**complete = 0**（no-op；`bloggerPostId` 仍 missing）；**missing = 7**（不變）
- [ ] **V-2**：`npm run validate:content` exit 0；warning 數 = 135（不新增新 warning class）
- [ ] **V-3**：`npm run check:phase1-readiness` exit 0；umbrella 內 `check:blogger-backfill` 之新 baseline 對照 V-1
- [ ] **V-4**：`npm run check:phase1-readiness-contract` 22/22 PASS（forbidden token 無新入）
- [ ] **V-5**：`git status --short` 僅顯示 **1** 個新 sidecar；其他 diff = **0 檔**
- [ ] **V-6**：build 不跑（本 phase 不 build）
- [ ] **V-7**：deploy 不跑（本 phase 不 deploy）；deploy clone 未動
- [ ] **V-8**：Sidecar 內容於檔案系統中 canonical readable（`cat` / `Get-Content` 顯示合法 JSON、可 `JSON.parse`）
- [ ] **V-9**：Sidecar 內每欄之值與 Dean 提供之真值**逐字元一致**（重複 §9）
- [ ] **V-10**：`blogger.bloggerPostId` = `""`（**絕無**任何值）

**任一失敗即 abort**：轉入 §13 rollback drill scenarios。

**Optional post-write**（未來獨立 phase；本 rehearsal 不列必要）：

- `npm run build:blogger` local dry-build（**不 deploy**）；觀察 `dist-blogger/posts/<slug>/meta.json` 之 `canonical` / `publishedUrl` 是否受 sidecar 更新影響。若欲執行，屬 build-observation slice，需 Dean 額外 approval。

---

## 13. Rollback drill scenarios（rehearsal only；本 doc **不執行**任何實際 rollback）

本 §13 為 5 個 rollback drill scenarios（rehearsal template §8.4 之 3 情境 + 本 worksheet 新增 2 情境：partial multi-file accidental write abort + permalink mismatch abort）。本 doc **不執行**任何 file / git 操作；下列為 offline mental walkthrough。

### 13.1 Scenario 1 — Uncommitted sidecar write rollback（apply 完成、commit 尚未執行）

**觸發**：apply 1 篇 sidecar 後，V-1 顯示 warning 上升 / V-9 逐字元檢查失敗（非預期）。

**心智步驟**：

1. `git status --short` 列出所有 uncommitted 修改（預期為單一新建 sidecar `?? <CANDIDATE_SIDECAR_PATH>`）
2. 若 create case：`rm <CANDIDATE_SIDECAR_PATH>`（僅刪本 slice 新建 sidecar；不動 markdown）
3. 若 update case（`we-media-myself2`）：`git checkout -- <CANDIDATE_SIDECAR_PATH>` 還原至 write 前
4. `git status --short` 對照 baseline = clean（無 uncommitted / untracked）
5. 重跑 `npm run check:blogger-backfill`；驗證回到 §4 baseline（`missing 7 / complete 0 / scanned 12`）
6. 重跑 `npm run check:phase1-readiness` / `-contract` 驗證 exit 0
7. 通報 Dean「rollback 完成，abort 原因 = X，建議下一步 = Y」

**特點**：**最安全**；unstage 即可還原；無 git history 影響。

### 13.2 Scenario 2 — Committed but not pushed rollback（commit 完成、push 尚未執行）

**觸發**：commit 已完成、push 前發現值錯誤 / warning 檢查失敗。

**心智步驟**：

1. `git log -1 --oneline` 確認 head 為 write commit
2. **Dean explicit approval required**：`git reset --soft HEAD~1`（destructive git action；不可自行執行）
3. `git status --short` 顯示 staged 之單一檔；`git reset` 至 unstaged
4. per §13.1 步驟 2 / 3 進行 filesystem restore
5. per §13.1 步驟 4 / 5 / 6 verify
6. 通報 Dean「rollback 完成，git head 已回退，abort 原因 = X」

**特點**：涉及 destructive git action；須 Dean explicit approval；hooks history 仍需通過（若 hook fail 屬另議）。

### 13.3 Scenario 3 — Pushed bad sidecar rollback（push 已完成、發現需 revert）

**觸發**：push 已完成、Dean 發現值錯誤 / permalink 錯誤 / warning 檢查失敗。

**心智步驟**：

1. **不使用** force push；一律採 `git revert <sha>` + push（forward-only）
2. 屬另一獨立 revert-only phase；**需 Dean explicit approval**
3. Revert commit landed 後重跑 §12 V-*；驗證回到 §4 baseline（`missing 7 / complete 0`）
4. 若 create case revert：sidecar 檔案於 main HEAD 已刪除；write phase 需重跑（另一 WP-02b slice）
5. 若 update case revert：`we-media-myself2` sidecar 之欄位還原至 revert 前狀態
6. 通報 Dean「revert 完成，涉及 revert commit SHA = X；write phase 需重跑」

**特點**：涉及公開 git history；forward-only；不 force push；屬另一獨立 phase。

### 13.4 Scenario 4（新增）— Partial multi-file accidental write abort

**觸發**：apply 過程中 ad-hoc script 誤動多於 1 檔（例：script bug 導致同時寫入 6 檔 sidecar / 誤動 `.md` frontmatter / 誤觸 `content/settings/**` / 誤觸 `src/**`）。

**心智步驟**：

1. **立即停止**（Ctrl+C；不 continue script）
2. `git status --short` 列出所有 modification / addition
3. **審查 diff 範圍**：
   - 若僅動白名單內 `.publish.json`（但 > 1 檔）：屬 **超出單篇 first slice scope**；`git checkout --` 或 `rm` 還原至僅剩 Dean approval 中明列之單一 slug；其他 sidecar 刪除
   - 若動白名單外檔案（`.md` / `settings/**` / `src/**` / `views/**` / `styles/**` / `js/**` / `scripts/**` / `package.json` / `dist*` / `.cache/` / deploy clone）：**全部** `git checkout --` 或 `rm` 還原
4. `git status --short` 對照 baseline = 僅剩 Dean approval 明列之單一 sidecar（若 apply 尚未確認完成）或 clean（若尚未 apply）
5. 重跑 §4 baseline check + §12 V-*
6. **必要**：向 Dean 通報「發生 partial multi-file accidental write；已還原；apply 是否重跑由 Dean 決定；建議修正 ad-hoc script 之 scope constraint」
7. Root cause audit：檢查 ad-hoc script 之 write path enumeration；未修正前**不**重跑 apply

**特點**：**scope creep 之最壞情境**；還原範圍需精準；不可誤刪 Dean approval 明列之單篇 sidecar；ad-hoc script 需 root cause 修正。

**避免此情境之 pre-apply gate（rehearsal template §7.4 G-B-a）**：apply 前 `git status --short` 對照白名單；apply 執行時逐檔 write（loop 每次僅寫 1 檔並立即檢查 `git status --short`）；不使用 `find` / `git add -A` / glob-based batch write。

### 13.5 Scenario 5（新增）— Permalink mismatch abort

**觸發**：dry-run 或 apply 過程中，發現 `<PLACEHOLDER_PERMALINK>` 與 Dean 提供之 `<PLACEHOLDER_PUBLISHED_URL>` 之 `<permalink>` 部分**不一致**（例：Dean approval 中提供 `permalink=my-post`、但 `publishedUrl=https://blog/2026/06/other-post.html`；`<permalink>` 部分為 `other-post`；兩者不一致）。

**心智步驟**：

1. **Dry-run 階段命中**（recommend）：於 §9 diff review 或 §10 A-11 條件命中；立即 abort dry-run
2. **Apply 階段命中**（rehearsal template §5.4 未觸發、逐檔 verify 遺漏；不應發生但 rehearsal 覆蓋此極端情況）：
   - 若 uncommitted：per §13.1 Scenario 1 步驟 2 rollback
   - 若 committed but not pushed：per §13.2 Scenario 2 rollback（需 Dean approval）
   - 若 pushed：per §13.3 Scenario 3 revert（forward-only；需獨立 revert phase）
3. **Root cause audit**：檢查 Dean approval message 中 `permalink` 與 `publishedUrl` 是否一致；若 Dean 誤填、請 Dean 再度確認後台真值
4. **重新 dry-run**：per §8.3 D-3；驗證 permalink 與 publishedUrl 之 `<permalink>` 部分**逐字元一致**
5. **不代 Dean 修正**：`<PLACEHOLDER_PERMALINK>` 之真值以 Dean 提供者為準；不由 Claude 從 `publishedUrl` 拆解 `<permalink>` 部分自動填入（雖然理論上可行，但屬 Dean 明示職責；不代猜）
6. 通報 Dean「permalink 與 publishedUrl 不一致；已 abort；請 Dean 再度確認後台 URL / permalink 真值」

**特點**：**Dean 需複核後台真值**；不代猜；permalink 與 publishedUrl 之關係於 dry-run diff review 即應攔截，apply 階段命中屬 rehearsal template §9 diff review 遺漏（可能發生但不應發生）。

**識別 permalink 與 publishedUrl 一致之心智檢查**：

- publishedUrl 形如 `https://<blog-domain>/<yyyy>/<mm>/<permalink>.html`（per `docs/publish-json-schema.md` §5.3；post case）
- `<permalink>` 部分 = publishedUrl 之 last path segment（去除 `.html`）
- 若 Dean 提供之 `permalink` 欄位 != publishedUrl 之該部分：mismatch；abort

---

## 14. Red lines（不可違反 / 不可降級）

以下紅線於本 doc（WP-01 follow-up）與未來 WP-02（實際寫入）**皆**必須遵守；違反即 abort。

### 14.1 Data red lines

- ❌ **絕不** guess Blogger `publishedUrl` / `bloggerPostId` / `publishedAt` / `bloggerBlogId` / `permalink` / `publishYear` / `publishMonth`
- ❌ **絕不** 從 slug / date / title / URL path / GitHub metadata / 檔名 yyyymmdd / CLAUDE.md 記載 / rehearsal template 中之範例文字 推導 Blogger internal ID / URL / timestamp
- ❌ **絕不** 由 `we-media-myself2` sidecar 之 URL pattern 反推其他 6 篇之 URL
- ❌ **絕不** 由 markdown frontmatter `date` 推導 Blogger `publishedAt`（兩者可不同、非錯誤）
- ❌ **絕不** 由 markdown slug 推導 Blogger `permalink`（可能相同、可能不同；由 Dean 明示）
- ❌ **絕不** 由 Dean 提供之 `publishedUrl` 自動拆解 `<permalink>` 部分填入 `permalink` 欄位（雖理論可行，屬 Dean 明示職責；不代猜）
- ❌ **絕不** 填任何值於 `blogger.bloggerPostId`（永遠 `""`，待未來 API flow）

### 14.2 Content red lines（本 doc 特有）

- ❌ **絕不** 於本 worksheet 中包含任何真實 Blogger URL / ID / timestamp / permalink / bloggerBlogId
- ❌ **絕不** 於本 worksheet 中包含任何從 Dean 過往 approval / CLAUDE.md 記載 / rehearsal template 推導之 Blogger 值
- ❌ **絕不** 於本 worksheet 中示範任何具體篇目之 diff（`<CANDIDATE_SLUG>` 為 placeholder；不指向具體篇目）
- ❌ **絕不** 落地 rehearsal intake JSON / fixture / test payload 於 `content/**` / `src/**` / repo root

### 14.3 Write target red lines

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

### 14.4 Behavioral red lines

- ❌ **絕不** deploy during backfill write（本 phase 不 build / 不 preview / 不 deploy）
- ❌ **絕不** push gh-pages during backfill write
- ❌ **絕不** 跳過 hooks（`--no-verify`）/ bypass signing（`--no-gpg-sign`）
- ❌ **絕不** force push（destructive；rollback 一律採 forward-only revert）
- ❌ **絕不** 動 Blogger / AdSense / GA4 / Google Drive / Search Console 後台
- ❌ **絕不** 呼叫 Blogger API（第一版永禁；`CLAUDE.md` §29）
- ❌ **絕不** 升級 `check:blogger-backfill` 為 fail-fast（維持 report-only；`memory/project_report_only_metadata_guards.md` §6）
- ❌ **絕不** 修改 `check:phase1-readiness-contract` 之 forbidden token list（`backfill:url` / `admin:write` / `safe-write` / `write` / `publish` 皆必維持 absent）
- ❌ **絕不** 於 WP-02 commit 混入 CLAUDE.md / MEMORY.md / memory diff（memory-sync 屬獨立 phase）
- ❌ **絕不** 於 WP-02 commit 中包含 Blogger 真值以外之欄位變更（sidecar 只動 §9 白名單欄位）
- ❌ **絕不** 於 WP-02 apply 中同時寫入 > 1 篇（單篇 first slice；其他篇於後續 WP-03 slice；per §13.4 avoid scope creep）

---

## 15. WP-01 follow-up non-goals

本 session **明確不做**（cumulative；違反即 abort）：

| 項目 | 狀態 |
| --- | --- |
| 進入 WP-02 backfill write phase | ❌ 未進 |
| 寫入任何 Blogger `publishedUrl` / `publishedAt` / `bloggerPostId` / `permalink` / `publishYear` / `publishMonth` | ❌ 未寫 |
| 於本 worksheet 中含任何真實 Blogger URL / ID / timestamp / permalink | ❌ 未含（§7 為 placeholder-only） |
| 於本 worksheet 中示範任何具體篇目之 diff | ❌ 未示（`<CANDIDATE_SLUG>` 為 placeholder） |
| 代 Dean 選 first slice candidate | ❌ 未選 |
| 建立 1 篇 / 多篇 sidecar-absent 之新 sidecar | ❌ 未建 |
| 修改 `we-media-myself2.publish.json` 任何欄位 | ❌ 未動 |
| 修改任何 markdown frontmatter | ❌ 未動 |
| 動 `src/**` / `views/**` / `styles/**` / `js/**` / `scripts/**` | ❌ 未動 |
| 動 `content/settings/**` / `content/templates/**` | ❌ 未動 |
| 動 `package.json` / `package-lock.json` | ❌ 未動 |
| 新增 npm script / guard / helper script / preview-only script | ❌ 未做 |
| 建 rehearsal intake JSON 檔（`_rehearsal-inputs.json` / `/tmp/dean-inputs.json` 或類似） | ❌ 未建 |
| 建 fixture 於 `content/validation-fixtures/backfill/**` | ❌ 未建 |
| 升級 `check:blogger-backfill` 為 blocking / fail-fast | ❌ 未做 |
| 修改 `check:phase1-readiness-contract` forbidden token list | ❌ 未做 |
| build / preview / deploy | ❌ 未做 |
| 動 deploy clone / push gh-pages | ❌ 未動（僅 §0 read-only 驗證） |
| 動 `CLAUDE.md` / `MEMORY.md` / `memory/**` | ❌ 未動 |
| 猜 Blogger `publishedUrl` / `bloggerPostId` / `publishedAt` / `bloggerBlogId` / `permalink` | ❌ 未猜 |
| 從 slug / date / title / URL path / GitHub metadata / CLAUDE.md 記載 推導 Blogger internal ID / URL / timestamp | ❌ 未做 |
| 由 `we-media-myself2` sidecar URL pattern 反推其他 6 篇 URL | ❌ 未做 |
| Blogger 後台 / repost / draft flip / URL 設定 / 標籤設定 / 圖片上傳 | ❌ 未動 |
| AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 | ❌ 未動 |
| Admin write path / Apply / middleware / admin-write-cli / `--apply` / `dryRun:false` | ❌ 未動 |
| Reverse UTM pm-26 deploy | ❌ 未動 |
| Second GitHub Pages deploy / `github-pages-blog-planning` quarantine 解除 | ❌ 未動 |
| Blogger AdSense Batch 2 P2 live repost | ❌ 未動 |
| Phase 1 final 之降級 / 重新封存 | ❌ 未動 |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | ❌ 未做 |
| 呼叫 Blogger API / Drive API / Forms API | ❌ 未做 |
| 執行 dry-run / apply / rollback（任一實作）| ❌ 未做（本 doc 為 rehearsal template；命令只作範例；rollback 為 mental drill） |

---

## 16. Recommendation

**建議：本 doc landing 後 remain worksheet-only；不啟動 WP-02**（沿用 preflight §12 / rehearsal template §11 / preanalysis §5；`CLAUDE.md` §3a Recommended next paths「idle freeze」；WP-02 需 Dean explicit approval + Dean 提供之真值 + Dean 明列篇目）。

**理由**：

1. `check:blogger-backfill` 為 report-only / warning-only / exit 0；無 blocker、無時效壓力急於 write。
2. `bloggerPostId` 屬 API-only；即使強行 write 亦無法補齊該欄位（`we-media-myself2` update case = no-op）。
3. Dean 尚未於任何 session 主動提供 `publishedUrl` / `publishedAt` / `permalink` 真值；本 worksheet 已備好單篇 dry-run 空間 + 5 rollback drill 情境，Dean 未來若想 fill、可直接於 chat 提供。
4. Phase 1 RC baseline 對「backfill 尚未 write」= 兼容（`check:phase1-readiness` exit 0 已含 backfill guard；write 未動不影響 RC 判定）。
5. 本 doc 已把單篇 candidate 之 dry-run worksheet / placeholder diff / apply checklist / post-write verification / 5 rollback drill scenarios 全數 documented；未來啟動 WP-02 時可直接引用、無需重複 audit。

**未來 WP-02 啟動觸發條件**（沿用 rehearsal template §11 + preflight §7 gates）：

Dean 於某 session 明確提出：

- 「請進入 Blogger backfill write phase 第 1 篇；篇目 = `<明列 slug>`；附 Dean 提供之 `publishedUrl` / `publishedAt` / `permalink` / `publishYear` / `publishMonth` 真值」
- 且明列 Preflight §7 gates 皆已具備、對照 rehearsal template §5–§8 + 本 worksheet §8–§12 執行
- Dean 於同 approval 中明示 `permalink` / `publishYear` / `publishMonth`；`bloggerPostId` 一律留空
- Dean 於 approval 中確認 permalink 與 publishedUrl 之 `<permalink>` 部分**逐字元一致**（per §13.5 mismatch scenario 之 pre-empt）

Claude **不代 Dean 決策**、**不主動啟動** WP-02、**不主動填** 模板、**不主動選** first slice；本 doc 為 worksheet-only。

**下一個 slice 建議候選**（沿用 preanalysis §5；本 doc 不代 Dean 選）：

- idle freeze（保守路徑；預設；per `CLAUDE.md` §3a Recommended next paths）
- WP-01 之進一步後續 slice（例：sidecar-plane git-hook walkthrough / partial mid-apply abort mock scenario / rollback drill 之 pre-defined role-play with mock timestamps）；仍為 docs-only
- 其他 P2-Entry candidate（WP-05 / WP-11 / WP-14 / WP-16；per preanalysis §5）
- WP-02（真實 sidecar 寫入；需 Dean 明列篇目 + 提供真值 + 對照本 worksheet §8–§12）

---

## 17. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔（+ 對應 commit + push origin/main）。**不含**任何程式 / frontmatter / settings / sidecar / build / deploy / dev-server 變更；未新增 guard / npm script / preview-only script / write helper / rehearsal intake JSON / fixture；未改 CSS；未改 `CLAUDE.md` / `MEMORY.md` / `memory/`；未觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages；未發布 Blogger；未購買網域 / 未動 DNS / 未碰 AdSense / GA4 / Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`；未猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId` / `permalink` / `publishYear` / `publishMonth`；未從任何 metadata 推導 Blogger internal ID / URL / timestamp；未新增測試文章 / artifact；未建 `CNAME` / `ads.txt`（含 placeholder / fake）；未動 `content/settings/ads.config.json`；未升級任何 report-only guard 為 fail-fast；未修改 `check:phase1-readiness-contract` 之 forbidden token list；未於本 worksheet 中含任何真實 Blogger 值（§7 皆為 `<PLACEHOLDER_*>` token）。§0 boot baseline 為本 session read-only 驗證；§1–§2 目的 / 定位 / 關係 sourced from preflight §12 + rehearsal template §1 / §2 + preanalysis §4 WP-01；§3 frozen baseline 為本 session `git rev-parse` 實測；§4 backfill baseline 為本 session `check:blogger-backfill` 實測（結果與 predecessor docs 一致，未動 guard）；§5 candidate selection worksheet 為新增評估表（不代 Dean 選）；§6 Dean input worksheet 為 rehearsal template §4.1 / §4.2 之單篇聚焦版；§7 placeholder sidecar diff example 為 rehearsal template §4.3 之 diff 化 + 補明確 placeholder token 定義；§8 dry-run command checklist 為 rehearsal template §5 之單篇聚焦版；§9 diff review checklist 為 rehearsal template §5.4 之單篇聚焦版；§10 abort conditions 為 rehearsal template §5.4 abort 之明細列表 + 新增 A-9 / A-10 / A-11；§11 future WP-02 apply checklist 為 rehearsal template §6 之單篇聚焦版（明標 future only）；§12 post-write verification checklist 為 rehearsal template §7 之單篇聚焦版（明標 future only）；§13 rollback drill scenarios 為 rehearsal template §8 之 3 情境 + 新增 §13.4 partial multi-file accidental write abort + §13.5 permalink mismatch abort；§14 red lines 為 rehearsal template §9 + 本 doc 特有 content red lines（§14.2）；§15 non-goals 為 rehearsal template §10 之單篇聚焦版；§16 recommendation 為 rehearsal template §11 之單篇聚焦版。

---

## See also

- `docs/20260710-blogger-backfill-write-rehearsal-template.md`（WP-01 第一份 rehearsal template；全 7 篇空白表 + 3 rollback drill 情境；本檔 §2 / §5 / §7 / §8 / §11 / §13 / §14 / §15 / §16 之 predecessor）
- `docs/20260710-blogger-backfill-write-phase-preflight.md`（前置條件 / gate / dry-run / validation / rollback proposed；本檔 §8 / §11 / §12 / §13 之規則面 predecessor）
- `docs/20260710-phase2-next-work-scope-preanalysis.md` §4 WP-01（Phase 2 work packages 拆分；本檔為 WP-01 follow-up slice）
- `docs/20260710-phase1-rc-docs-index.md`（2026-07-10 家族單頁 lookup index；本檔於 See also 對應）
- `docs/20260710-phase1-rc-next-phase-route-selection.md`（Routes A–G；WP-01 屬 Route B 之下一層拆分）
- `docs/20260710-phase1-rc-handoff-operating-readout.md`（Phase 1 RC handoff readout；家族入口）
- `docs/20260710-phase1-rc-next-readiness-analysis.md`（RC readiness re-verify）
- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger identity 分層 policy；A.1 / A.2 / A.3；`bloggerPostId` = API-only；本檔 §4 / §14.1 引用）
- `docs/20260706-blogger-backfill-write-target-inventory.md`（canonical write target = `.publish.json` sidecar；本檔 §5.3 / §7 / §11 引用）
- `docs/20260706-blogger-backfill-report-only-baseline.md`（guard 行為契約 + report snapshot；本檔 §4 引用）
- `docs/20260706-blogger-backfill-value-intake-template.md`（backfill 真值收集模板；本檔 §5 / §6 之 predecessor）
- `docs/20260709-blog-phase2-next-work-packet.md`（Phase 2 next-work packet；候選 A–E scope-out）
- `docs/publish-json-schema.md` §5.3（Blogger URL 規則；本檔 §13.5 permalink 拆解心智檢查引用）/ §5.6（`blogger.type`）
- `docs/publish-bundle.md` §2.4（`contentKind` 與 `blogger.type` 分離）/ §2.6.1（`.md` frontmatter 內容屬性欄位列表）
- `content/templates/_sample.publish.json`（`schemaVersion: 1` sidecar 範本；本檔 §7.1 / §11.2 引用）
- `content/blogger/posts/20260515-we-media-myself2.publish.json`（唯一 sidecar-present 篇目；本檔 §5.2 / §7.2 / §12 update case 引用；read-only）
- `CLAUDE.md` §3a Current state snapshot（含 Red lines / Recommended next paths；不猜 Blogger postId / publishedAt / bloggerBlogId）
- `CLAUDE.md` §7（Blogger 發布 checklist；發布階段，非 backfill）、§23（發布狀態）、§24（Blogger 發布 URL 回填）、§26（package.json 指令）、§27（Claude Code 修改規則）、§29（第一版不做）
- `MEMORY.md` + `memory/project_baseline.md`（frozen source / deploy baseline）
- `memory/project_phase1_rc_2026_07_10_family.md`（2026-07-10 Phase 1 RC 家族）
- `memory/project_report_only_metadata_guards.md`（8 warning-only guards + release-readiness umbrella；`check:blogger-backfill` 為獨立 guard、非 metadata guard suite 成員）
- `memory/feedback_phase_discipline.md`（memory-sync-only / docs-only / source-only phases 不重疊）

---

（本文件結束 / end of document）
