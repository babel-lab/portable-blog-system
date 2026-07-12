# Phase 1 RC → next-phase route selection preanalysis（docs-only）

- 建立日期：2026-07-10（Asia/Taipei）
- 類型：docs-only **route selection preanalysis**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 目的：於 Phase 1 RC 已穩定、且 2026-07-10 docs family（8 份）已 landing 之後，把 Dean 接下來可能面對的**下一階段路線分岔面**明列為單一表格：每條 route 之 trigger / allowed work / forbidden work / required Dean approval / required input data / risk level / recommended first slice / checks required。**不**代 Dean 決策、**不**啟動任何 route、**不**打分建議 Dean 選哪條；只提供選擇面，讓下一 session Dean 明說啟動哪條時，Claude 可直接對照本文執行。
- 觸發：`docs/20260709-blog-phase2-next-work-packet.md` §C 候選 2「Phase 1 RC → next-phase 決策入口 preanalysis」；`docs/20260710-phase1-rc-docs-index.md` §8 排名 #2；本 session Dean 明確指示。
- 本輪界線（docs-only）：**不** build / **不** preview / **不** deploy / **不**碰 deploy clone 寫入 / **不**改任何 frontmatter / **不**改任何 sidecar `.publish.json` / **不**動 Blogger backfill 語意（`check:blogger-backfill` 維持 report-only）/ **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / **不**買網域 / **不**設 DNS / **不**建 `CNAME` / **不**建 `ads.txt` / **不**啟用 AdSense / **不**改 AdSense production behavior / **不**碰 Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 / **不**動 `CLAUDE.md` / `MEMORY.md` / `memory/` / **不**新增 npm script / preview helper script / **不**動 `package.json` / `package-lock.json`。
- 本輪允許 mutation：新增本檔（唯一）+ commit + push origin/main。

---

## 0. Boot baseline（本輪已驗）

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `a52ff4c` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅（read-only 驗證） | `0 / 0` | clean | absent ✅ |

Source HEAD full hash = `a52ff4c0be61f817ab153273bace73ed519598cf`；subject `docs(state): add phase1 rc docs index`。前 4 commit：`abc707c`（`docs(blogger): record preview-only helper preanalysis`）→ `c0ee384`（`docs(release): define domain adsense gates`）→ `e477a75`（`docs(blogger): record backfill write preflight`）→ `a9003e8`（`docs(state): record phase1 rc next readiness`）。

Deploy HEAD full hash = `1170e7e14aaa7f3449999bf92b9c8586719a76b4`（read-only 驗證；本 session **未寫入** deploy clone）。

Readiness checks 本輪已跑（read-only；exit 0）：

| # | 指令 | Exit | 結果 |
| --- | --- | --- | --- |
| C-1 | `npm run check:phase1-readiness` | 0 | validate 0/135/107、npm-script-targets 48/48、adsense-mode-metadata scanned 17 / warnings 0、blogger-backfill scanned 12 / candidates 7 / complete 0 / missing 7 report-only、prepublish 16/16、smoke 8/8 |
| C-2 | `npm run check:phase1-readiness-contract` | 0 | 22/22 PASS（1 parseable + 1 script-present + 6 required + 13 forbidden absent + 1 ordered 6/6） |

判定：baseline 完全一致；readiness 未 drift；backfill guard 維持 report-only；deploy clone 未動；`.git/index.lock` 皆 absent。

---

## 1. 結論（先講結果）

**A. Phase 1 RC 已穩定且 2026-07-10 docs family 已 landing**。RC-ready sign-off 依據見 `docs/20260708-phase1-stability-closeout-rc-note.md` §F；readiness re-verify 於 `docs/20260710-phase1-rc-next-readiness-analysis.md` §2；2026-07-10 家族單頁 lookup 於 `docs/20260710-phase1-rc-docs-index.md`。三次人工 E2E / smoke 皆 PASS；P0 blocker = none；P1 各項均 verified resolved / documented accepted / downgraded；P2 各項 documented。

**B. 本 doc 定義 7 條 route**（A–G），每條 route 皆須 Dean explicit approval + 獨立 phase 才可啟動；本 doc 皆 scope-out、皆不啟動、皆不決策。

**C. Recommended decision order = A（idle freeze，預設）→ B（route selection 再深化）→ C / D / E / F / G（依 Dean 目標分岔選其一）**。C / D / E / F / G 之間**不排優先度**，選哪條由 Dean 依當下目標判斷。

**D. Recommendation = remain idle freeze**（沿用 `CLAUDE.md` §3a Recommended next paths；handoff readout §8；next-readiness §8；docs-index §11）。本 doc 不代 Dean 決策、不啟動任何 route；若 Dean 未來 session 明確判斷推進，依對應 route 之啟動條件執行。

---

## 2. What Phase 1 RC has already stabilized

以下項目於 Phase 1 RC 階段已 **stable / carry-forward**，選任一 route 皆 build on top of 以下 baseline（不擴大 / 不重做 / 不降級）：

### 2.1 Functional baseline

| 項目 | 狀態 | 主要 pointer |
| --- | --- | --- |
| Phase 1 functional final 宣告 | ✅ 2026-05-18 | `docs/phase-1-completion-report.md` |
| MVP §28 17 條 | ✅ 全達標 | `CLAUDE.md` §28 |
| Article block parity（Blogger ↔ GitHub Pages 6/6） | ✅ | `docs/phase-1-completion-report.md` |
| sitemap + robots + JSON-LD | ✅ 全 PASS | `CLAUDE.md` §21 |
| First GitHub Pages deploy | ✅ 2026-07-03 | live `https://babel-lab.github.io/portable-blog-system`；deploy `1170e7e` |
| GA4 production live | ✅ 2026-05-21 起 `G-C77SMPF8VD` | Route B 之 GA4 D4 = CLOSED |
| Blogger P3 LIVE | ✅ 2026-06-17（`blog-restart-steady-rhythm-notes`） | Dean 截圖佐證；`bloggerPostId` 尚未回填 |
| Admin Markdown draft export MVP | ✅ 2026-06-30 landed；idle freeze | `check:admin-markdown-export` 256/256 |

### 2.2 Test / validation baseline（carry-forward）

| 指令 | 結果 |
| --- | --- |
| `validate:content` | 0 error / 135 warning / 107 post |
| `check:admin-markdown-export` | 256/256 |
| `check:github-pages-prepublish` | 16/16 PASS |
| `check:github-pages-prepublish-smoke` | 8/8 PASS |
| `check:phase1-readiness` | exit 0（umbrella）|
| `check:phase1-readiness-contract` | 22/22 PASS |
| `check:npm-script-targets` | 48/48 |
| `check:release-readiness` / `-contract` | exit 0 / 14/14 PASS（carry-forward；本 session 未跑）|
| `check:metadata-all` | exit 0（8 warning-only guards；carry-forward）|
| `check:blogger-backfill` | scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5 / exit 0（report-only）|
| Production expected warnings | 1（`page-noindex-in-listings` @ `content/github/posts/20260504-portable-blog-system-mvp.md`；`docs/20260626-q6-download-listing-asymmetry-policy-lock.md`）|

### 2.3 2026-07-10 docs family 已補齊之 gate / runbook / preflight

（依 commit 時序；每份為 additive-only、docs-only；不改流程 / 不新增規則 / 不啟動任一 route）：

| # | Commit | File | 補齊面 |
| --- | --- | --- | --- |
| 1 | `4e34d20` | `docs/20260710-phase1-rc-handoff-operating-readout.md` | Phase 1 RC handoff / operating readout；家族入口 |
| 2 | `d73492b` | `docs/20260710-blogger-admin-export-workflow-alignment.md` | Admin `#blogger-export` 資料來源 audit + 4 步 workflow |
| 3 | `f42ba32` | `docs/20260710-blogger-preview-sanity-analysis.md` | Blogger preview 40 項 sanity checklist |
| 4 | `a9003e8` | `docs/20260710-phase1-rc-next-readiness-analysis.md` | RC readiness re-verify + 三份 workflow docs 影響面 audit |
| 5 | `e477a75` | `docs/20260710-blogger-backfill-write-phase-preflight.md` | Blogger backfill write phase 前置條件 / gates / dry-run / rollback |
| 6 | `c0ee384` | `docs/20260710-custom-domain-adsense-trigger-checklist.md` | Custom domain（Gate D）+ AdSense（Gate A）trigger conditions + 未來 sequence |
| 7 | `abc707c` | `docs/20260710-blogger-preview-only-script-preanalysis.md` | Preview-only helper（B1 navigator / B2 draft-aware preview build）preanalysis |
| 8 | `a52ff4c` | `docs/20260710-phase1-rc-docs-index.md` | 家族單頁 lookup index |

### 2.4 本次「已補齊、可 build on top of」摘要

- **Handoff layer**：Session cold-start 讀 handoff readout + docs index 即可重建上下文。
- **Workflow alignment layer**：Admin export → build → dist → Blogger paste 4 步流程已明列；Blogger preview 40 項 sanity 已明列；preview-only helper 未來 candidate（B1 / B2）已 scope。
- **Gate / preflight layer**：RC next-readiness re-verify + Blogger backfill write phase preflight + custom domain / AdSense trigger checklist 皆 landed。任一 route 之啟動皆有對應 preflight doc 可對照。

---

## 3. Candidate routes（A–G；本 doc 不代 Dean 決策；均需 explicit approval + 獨立 phase）

以下 7 條 route 皆為未來可行分岔；每條 route 之欄位固定為：**trigger condition / allowed work / forbidden work / required Dean approval / required input data / risk level / recommended first slice / checks required**。本 doc **不排 C–G 優先度**（除 A 為預設、B 為深化選擇入口）。

---

### Route A — Remain idle-freeze / observe（本 doc 之預設）

- **Trigger condition**：預設；Dean 未明確指示啟動 B–G 任一時。
- **Allowed work**：無新增 mutation；至多 read-only baseline verify（`CLAUDE.md` §3a Core operating rules 7 步）+ read-only 讀取現有 docs。
- **Forbidden work**：
  - ❌ 動 `src/**` / `views/**` / `styles/**` / `js/**` / `scripts/**` / EJS / SCSS / JS
  - ❌ 動 `content/**/*.md` frontmatter / `.publish.json` sidecar / `.fb.md`
  - ❌ 動 `content/settings/*.json`
  - ❌ 動 `package.json` / `package-lock.json`
  - ❌ 動 `CLAUDE.md` / `MEMORY.md` / `memory/**`
  - ❌ build / preview / dev / deploy / push gh-pages
  - ❌ 動 Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台
  - ❌ 猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId`
  - ❌ 補 backfill 真值 / 動任何 sidecar
  - ❌ 動 Blogger backfill 語意（`check:blogger-backfill` 維持 report-only）
- **Required Dean approval**：無（預設路徑）。
- **Required input data**：無。
- **Risk level**：極低（無 mutation）。
- **Recommended first slice**：無；純 idle。
- **Checks required**：無（若 Dean 於 session 內臨時要 verify baseline，`npm run check:phase1-readiness` + `npm run check:phase1-readiness-contract` 兩支即足）。

---

### Route B — Phase 2 next-work-scope planning（docs-only 深化）

- **Trigger condition**：Dean 想在啟動 C–G 前，先深化「Phase 2 / 下一階段路線分岔」之描述；或想追加 route（B、H、…）；或想把某條既有 route 拆成更細之 preflight。
- **Allowed work**：
  - ✅ 新增 `docs/<YYYYMMDD>-<slug>.md`（docs-only；additive-only）
  - ✅ read-only 讀取 `docs/` / `CLAUDE.md` / `memory/`（不寫）
  - ✅ 至多跑 `npm run check:phase1-readiness` / `check:phase1-readiness-contract`（read-only regression check）
- **Forbidden work**：
  - ❌ 動 `src/**` / `views/**` / `styles/**` / `js/**` / `scripts/**` / EJS / SCSS / JS
  - ❌ 動 `content/**` / `content/settings/**` / frontmatter / sidecar
  - ❌ 動 `package.json` / `package-lock.json`
  - ❌ 動 `CLAUDE.md` / `MEMORY.md` / `memory/**`（除非本 phase 為 memory-sync-only；不重疊）
  - ❌ build / preview / dev / deploy / push gh-pages
  - ❌ 動任何後台
  - ❌ 猜任何 Blogger values
- **Required Dean approval**：「請進入 next-work-scope planning phase，範圍：<目標>」。
- **Required input data**：Dean 想深化之目標（例如「re-scope custom domain gate 內部 phase 順序」或「加一條 Route H = Commerce L2 candidates preanalysis」）。
- **Risk level**：極低（docs-only；不涉及 mutation 到程式 / content / settings / memory）。
- **Recommended first slice**：新增一份 `docs/<YYYYMMDD>-<topic>-preanalysis.md`（僅一份；不動任何其他檔）。
- **Checks required**：
  - `git status --short` clean（新增檔外無他動）
  - `git diff --stat` 只顯示新增 doc
  - `npm run check:phase1-readiness`（regression check；exit 0）
  - `npm run check:phase1-readiness-contract`（22/22 PASS）

---

### Route C — Blogger backfill write phase（動 `.publish.json` sidecar 之實寫）

- **Trigger condition**：Dean 提供 Blogger 後台真值（`publishedUrl` / `publishedAt`），並明確指示啟動 backfill write phase。
- **Allowed work**：
  - ✅ 依 `docs/20260710-blogger-backfill-write-phase-preflight.md` §5 / §8 之 sidecar 目標路徑，逐篇 write `.publish.json`（canonical location）
  - ✅ write 前 dry-run（若 preflight §9 定義）
  - ✅ write 後跑 `npm run check:blogger-backfill`（碼未變、但 candidates 逐篇由 missing → complete；warning-only 不 fail）
  - ✅ write 後跑 `validate:content`（0 error 保持）
  - ✅ write 後跑 `check:phase1-readiness` / `check:phase1-readiness-contract`（0 / 22-22）
  - ✅ Dean 選跑 `build:blogger`（byte-identical modulo `builtAt`；預期無 dist diff 除 Dean 指定）
- **Forbidden work**：
  - ❌ **猜任何 Blogger values**（`publishedUrl` / `publishedAt` / `bloggerPostId` / `bloggerBlogId`；per `CLAUDE.md` §3a Red lines + `docs/20260706-blogger-identity-and-backfill-strategy.md`）
  - ❌ 動 `.md` frontmatter blogger block（legacy fallback；不建議寫入）
  - ❌ 動 Blogger 後台（不 login、不 post、不 update、不 delete、不 flip draft、不 URL 設定、不標籤設定、不圖片上傳）
  - ❌ 動 `src/**` / `views/**` / `styles/**` / `js/**` / `scripts/**`
  - ❌ 升 `check:blogger-backfill` 為 fail-fast（維持 report-only）
  - ❌ 動 6 篇 sidecar-absent 之 sidecar 建立（除非 Dean 於 approval 同時明示 permalink；per preflight §5 / §8）
  - ❌ build / preview / dev / deploy / push gh-pages（除 Dean 明說 Dean-gated `build:blogger`）
- **Required Dean approval**：「請進入 Blogger backfill write phase，附 Dean 提供之 publishedUrl / publishedAt 真值，逐篇明列 target sidecar」。若涉及 6 篇 sidecar-absent，Dean 需於同 approval 中明示 permalink。
- **Required input data**：
  - Dean 提供之 real `publishedUrl`（`https://<blogger-domain>/YYYY/MM/<slug>.html`）
  - Dean 提供之 real `publishedAt`（ISO 8601 或 Blogger 後台 timestamp）
  - Optional：Dean 提供之 `note` 欄位
  - **不列** `bloggerPostId`（系統欄位；未來 Blogger API flow 取得；非 Dean 人工 backfill 必填；per preflight §2 / §4）
- **Risk level**：中（涉及 write 到 `.publish.json` sidecar；write path 首次觸發於本 route；若寫錯 sidecar 需 rollback）。
- **Recommended first slice**：Dean 選 1 篇（例如 `we-media-myself2`，只缺 `bloggerPostId`；或 P3 `blog-restart-steady-rhythm-notes` 已 live verified）；write 1 篇 sidecar；逐項對照 preflight §7 acceptance；不擴大 scope；下一篇需 Dean 另行 approval。
- **Checks required**：
  - Preflight §7 acceptance（by-file）：sidecar 存在 / schema keys 對 / value 為 Dean 明說之真值 / `check:blogger-backfill` 該篇轉為 complete
  - `git status --short` 只顯示改動之 `.publish.json`（外無他動）
  - `git diff --stat` 只顯示改動之 sidecar
  - `npm run validate:content`（0 error 保持）
  - `npm run check:blogger-backfill`（missing 逐篇減 1；不升 fail-fast）
  - `npm run check:phase1-readiness`（exit 0）
  - `npm run check:phase1-readiness-contract`（22/22）
  - Rollback plan（per preflight §10）：single-file `git restore <sidecar>` + `git status` clean

---

### Route D — Blogger preview helper implementation（B1 或 B2）

> **Status update（2026-07-12）**：**B1 navigator 已 landed**（source slice `cc6497b`；`check:blogger-preview` + `check:blogger-preview-smoke` 49/49）；details 見 `docs/20260712-preview-only-helper-implementation.md`。runbook §C.5 + sanity §5.0 已納入 B1。**B2 draft-aware preview build 仍未實作 / Dean-gated**（未建立 `dist-blogger-preview/` / 未動 `.gitignore` / 無 PREVIEW-ONLY marker）；本 Route D 之下一步僅剩 B2。以下欄位保留為完整 route spec；B1 相關欄位僅供歷史對照，未來 Dean 若啟動下一波 preview helper 實作，指涉 = B2。

- **Trigger condition**：Dean 明確判斷 Blogger 手動 preview 流程繁瑣度足以支撐引入 helper，且明說選 B1（navigator）或 B2（draft-aware preview build）。**B1 已 landed 2026-07-12；未來 Route D 啟動之預期選項 = B2。**
- **Allowed work**：
  - ✅ 依 `docs/20260710-blogger-preview-only-script-preanalysis.md` §6 / §11 acceptance criteria 實作選定之 B1 或 B2
  - ✅ 新增 `src/scripts/<slug>.js`（B1 為主）或極小改 `src/scripts/build-blogger.js`（B2 需嚴格 scope）
  - ✅ 若 B2：新增 `dist-blogger-preview/`（gitignored；PREVIEW-ONLY 標記；不動 `dist-blogger/`）+ 動 `.gitignore` 開路
  - ✅ 新增 npm script（`npm run preview:blogger` 或 `npm run blogger:preview-build`）
  - ✅ 動 `package.json`（script 註冊；additive-only；不動既有 script）
  - ✅ 新增對應 guard / smoke（若 preanalysis §11 acceptance 要求）
  - ✅ 新增 docs 紀錄 landing acceptance
- **Forbidden work**：
  - ❌ 改 `build:blogger` 契約（正式 dist-blogger/ 不動；draft 不進正式 dist；per `CLAUDE.md` §23）
  - ❌ 改 `src/scripts/load-posts.js` `classify` 單一事實來源
  - ❌ 放寬 draft 進正式 dist-blogger/
  - ❌ 動 `content/**/*.md` frontmatter 或 `.publish.json` sidecar（除 Dean 明說之 preview override，且需 preanalysis §11 明列）
  - ❌ deploy / push gh-pages / 動 `dist/`
  - ❌ 呼叫 Blogger API（第一版永禁；`CLAUDE.md` §29）
  - ❌ 猜任何 Blogger values
  - ❌ 動 Blogger 後台
  - ❌ 動 real AdSense IDs（不進 preview helper 輸出）
- **Required Dean approval**：「啟動 preview helper 實作 phase；選 B1（navigator，read-only 讀 dist-blogger/）或 B2（draft-aware preview build，隔離輸出）」。
- **Required input data**：
  - Dean 明說選 B1 或 B2
  - 若 B2：Dean 確認 `dist-blogger-preview/` gitignored 落地無風險
  - Optional：Dean 明說 preview helper 需 cover 之 target posts 範圍（若無明說，default = 全體 non-draft classify.blogger）
- **Risk level**：
  - B1 = 低（read-only；不動 build 契約；輸出 navigator 只讀 dist-blogger/）
  - B2 = 中（動 `build:blogger` 或新 script；需嚴格 scope；`CLAUDE.md` §23 紅線不破）
- **Recommended first slice**：Dean 選 B1 時，先新增 `src/scripts/preview-blogger-navigator.js`（read-only；輸出 preview HTML index；不動 build 契約）+ 新增 `npm run preview:blogger`；Dean 選 B2 時，先寫最小 spec doc（不動 script），再另開 phase 實作。
- **Checks required**：
  - `git status --short` 只顯示新增 script / doc（外無他動；若 B2 亦顯示 `.gitignore` 改動）
  - `npm run validate:content`（0 error 保持）
  - `npm run check:phase1-readiness`（exit 0）
  - `npm run check:phase1-readiness-contract`（22/22；`check:phase1-readiness` script 契約不因新 preview script 破損）
  - `npm run check:admin-markdown-export`（256/256；Admin `#blogger-export` 契約不動）
  - `npm run build:blogger`（byte-identical modulo `builtAt`；正式 dist-blogger/ 不動）
  - Preanalysis §11 acceptance criteria（by-item）

---

### Route E — Custom domain / AdSense launch path（Gate D + Gate A）

- **Trigger condition**：Dean 明確判斷「累積內容 / 流量 / SEO 觀察」時機成熟，並明說啟動 Gate D（custom domain）或 Gate A（AdSense）。
- **Allowed work**：
  - ✅ 依 `docs/20260710-custom-domain-adsense-trigger-checklist.md` §6 逐 phase 執行
  - ✅ Gate D 之 `custom-domain-prep-1..7` 各 phase 為 docs-only preflight（不含 DNS 設定 / `CNAME` 落地）
  - ✅ Gate A 之 `adsense-1..5` 各 phase 為 docs-only preflight（不含 pub id 落地）
  - ✅ Dean 手動於 registrar 買 domain / 設 DNS（Claude 不代做）
  - ✅ Dean 手動於 AdSense 後台申請（Claude 不代做）
  - ✅ 待 Dean 提供之真值取得後，再另開 phase 落地 `content/settings/*.json` real IDs / `CNAME` / `ads.txt`
- **Forbidden work**：
  - ❌ 買 domain / 設 DNS / 建 `CNAME` / 建 `ads.txt`（含 placeholder / fake；per checklist §5 / §8）
  - ❌ 啟用 AdSense / 改 production ad script / 改 AdSense mode metadata 之語意
  - ❌ 落地任何 placeholder pub id / fake domain
  - ❌ 動 Blogger 後台
  - ❌ 動 GA4 後台 / Search Console 後台
  - ❌ 動 Google Drive 後台
  - ❌ 動 real AdSense IDs 於非 `content/settings/ads.config.json`（per `CLAUDE.md` §3a Red lines；real IDs **只**存於 `content/settings/ads.config.json`）
  - ❌ 猜任何 pub id / domain / DNS 設定
  - ❌ 動 Phase 1 RC baseline（不 downgrade / 不 re-封存）
- **Required Dean approval**：
  - 若 Gate D：「啟動 Gate D，`<domain>`（例如 `babel-lab.tw`），已註冊 + 可管 DNS」；後續 `custom-domain-prep-1..7` 各 phase Dean 需逐 phase 明說
  - 若 Gate A：「啟動 Gate A，附 Dean 手動取得之 pub id」；後續 `adsense-1..5` 各 phase Dean 需逐 phase 明說
- **Required input data**：
  - Gate D：Dean 提供之 domain 字串 / 註冊商 / DNS 管理權限 / 目標 GitHub Pages custom domain 設定值
  - Gate A：Dean 手動取得之 real pub id（AdSense 後台）
  - **不列**：Google Analytics ID（已 live `G-C77SMPF8VD`；本 route 不動）
  - **不列**：`bloggerPostId`（不相關；per Blogger identity policy）
- **Risk level**：
  - Gate D docs-only prep = 極低；Gate D DNS / `CNAME` 落地 = 高（外部 DNS 影響 live SEO）
  - Gate A docs-only prep = 極低；Gate A AdSense serving 落地 = 中（改 production ad script；影響 live）
- **Recommended first slice**：Dean 選 Gate D 時，先新增 `docs/<YYYYMMDD>-custom-domain-prep-1-<slug>.md`（docs-only preflight；不動 DNS）；Dean 選 Gate A 時，先新增 `docs/<YYYYMMDD>-adsense-prep-1-<slug>.md`（docs-only preflight；不落地 pub id）。
- **Checks required**：
  - `git status --short` 只顯示新增 doc（外無他動）
  - `npm run check:phase1-readiness`（exit 0；Phase 1 baseline 不被 Gate 前置作業擾動）
  - `npm run check:phase1-readiness-contract`（22/22）
  - Checklist §6 acceptance criteria（by-phase）
  - Gate D DNS 落地 phase：Dean 手動於 registrar 驗證 + Claude 不代做
  - Gate A serving 落地 phase：Dean 手動於 AdSense 後台驗證 + Claude 不代做

---

### Route F — Live Blogger overflow observation（純觀察 + docs-only 紀錄）

- **Trigger condition**：Dean 於**實機發布之 Blogger 頁面**（非 preview）再度觀察到水平捲軸，且 offender 屬 `.lab-blogger-article` 內專案元素。
- **Allowed work**：
  - ✅ 依 `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md` §7 Option A + `docs/20260708-blogger-draft-preview-runbook.md` §F 走一次 debug
  - ✅ 新增 `docs/<YYYYMMDD>-blogger-mobile-overflow-live-page-observation.md`（docs-only 紀錄；由 Dean DevTools 提供 offender / `scrollWidth` / viewport / 跨平台是否復現 / 分類判定）
  - ✅ Dean 手動於瀏覽器 DevTools 提供資料；Claude 不猜
- **Forbidden work**：
  - ❌ 動 CSS / build / deploy / Blogger theme
  - ❌ 動 GitHub Pages 輸出（若日後真需 Blogger-scope hardening，屬**另一** phase；強約束：不得改變已 live-accepted 之 GitHub Pages byte-identical 輸出；per `CLAUDE.md` §3a / audit §7 Option B）
  - ❌ 動 `src/**` / `views/**` / `styles/**` / `js/**` / `scripts/**`
  - ❌ 動 Blogger 後台
  - ❌ 猜 offender / scrollWidth / viewport
- **Required Dean approval**：「啟動 Blogger 實機 overflow 觀察 phase，附 Dean DevTools 提供之 offender / scrollWidth / viewport / 跨平台復現資料」。
- **Required input data**：
  - Dean 於瀏覽器 DevTools 提供 offender element / selector / `scrollWidth` / viewport / 是否跨平台復現 / 分類判定
- **Risk level**：極低（純觀察 + docs-only；不動 CSS / build / deploy）。
- **Recommended first slice**：新增 `docs/<YYYYMMDD>-blogger-mobile-overflow-live-page-observation.md`；只紀錄一次觀察結果；不擴大 scope。
- **Checks required**：
  - `git status --short` 只顯示新增 doc（外無他動）
  - offender element / selector / scrollWidth / viewport 均由 Dean DevTools 提供，Claude 不猜
  - 分類判定依 runbook §F-4 規則
  - `npm run check:phase1-readiness`（exit 0）
  - `npm run check:phase1-readiness-contract`（22/22）
- **Caveat**：本 route **非**觸發不啟動；若未觀察到條件，不執行。

---

### Route G — Production deploy readiness review（second GitHub Pages deploy）

- **Trigger condition**：Dean 明確判斷「新篇 / 更新既篇」值得 push 至 gh-pages / 更新 `dist/`；且 Dean 於同 approval 中明列篇目。
- **Allowed work**：
  - ✅ 依 `docs/20260703-post-c1-next-deploy-candidates.md` roster 逐篇 review readiness（Dean-gated）
  - ✅ 於 source repo run `npm run build:github`（Dean-gated）
  - ✅ 於 deploy clone（`/d/github/blog-new/portable-blog-deploy`）copy `dist/` → gh-pages branch
  - ✅ 於 deploy clone `git commit` + `git push origin gh-pages`（Dean 明說 push；不 auto-push）
  - ✅ 於 source repo push docs / config source-side 改動（不含 dist）
  - ✅ Deploy 前跑 `check:phase1-readiness` / `check:phase1-readiness-contract` / `build-cache hygiene` / `github-pages-prepublish` / `github-pages-prepublish-smoke` 全 PASS
  - ✅ Deploy 後 Dean 手動 live verify（Claude 不代做）
- **Forbidden work**：
  - ❌ 主動 deploy（每次 Dean-gated；不 auto-push）
  - ❌ 動 `github-pages-blog-planning` quarantine（hold by design；per `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`；解除須另一 phase）
  - ❌ 動 `src/**` / `content/**` / `views/**` / `styles/**` / `js/**` / `scripts/**` 於本 phase（若需要 source 改動，屬**前置** phase；不混入 deploy phase）
  - ❌ Deploy stale `.cache/pages`（`check:github-build-cache-hygiene` 必 PASS）
  - ❌ push `main` 若尚未 landing 對應 docs / config
  - ❌ 動 Blogger / AdSense / GA4 後台
  - ❌ 動 real AdSense IDs
  - ❌ 動 Blogger backfill 語意
  - ❌ Deploy 未 verified 篇目
- **Required Dean approval**：「請進入 second GitHub Pages deploy phase，篇目 = <逐篇明列>；並確認 gh-pages push 明說授權」。
- **Required input data**：
  - Dean 明列 deploy 目標篇目（file paths）
  - Dean 明說允許 gh-pages push
- **Risk level**：中-高（deploy 對 live 有直接影響；orphan / stale / canary 需事先排查）。
- **Recommended first slice**：Dean 選 1 篇；跑完 pre-deploy gates；deploy 1 篇；deploy 後 Dean 手動 live verify；未 verify PASS 不進 next 篇。
- **Checks required**：
  - Pre-deploy：`check:phase1-readiness` + `check:phase1-readiness-contract` + `check:github-build-cache-hygiene`（2/2）+ `check:github-pages-prepublish`（16/16）+ `check:github-pages-prepublish-smoke`（8/8）+ `validate:content`（0 error）
  - Build：`npm run build:github`（無 unexpected error；Dean 選跑 preview）
  - Deploy：copy dist → deploy clone → `git status` clean 或 expected diff → `git commit` → `git push origin gh-pages`（Dean 明說授權）
  - Post-deploy：Dean 手動 live verify（Claude 不代做）
  - Landing record：新增 `docs/<YYYYMMDD>-<slug>-deploy-landing-record.md`

---

## 4. Route selection summary（一頁表）

| Route | 名稱 | Trigger | Risk | Required input | 建議 first slice |
| --- | --- | --- | --- | --- | --- |
| A | Idle freeze | 預設 | 極低 | 無 | 無（純 idle）|
| B | Phase 2 next-work-scope planning | Dean 想深化 route 描述 / 加新 route | 極低 | Dean 想深化之目標 | 新增 `docs/<YYYYMMDD>-<topic>-preanalysis.md` |
| C | Blogger backfill write phase | Dean 提供真值 + 明說啟動 | 中 | `publishedUrl` / `publishedAt`（+ optional `note`；不列 `bloggerPostId`）| 1 篇 sidecar write |
| D | Blogger preview helper 實作 | Dean 明說 B1 / B2；**B1 已 landed 2026-07-12（`cc6497b`），下一步僅剩 B2** | B1 低（已 landed） / B2 中 | 選 B1 或 B2 | B1（已 landed）: `src/scripts/check-blogger-preview.js` ／ B2: 先寫最小 spec doc |
| E | Custom domain / AdSense launch | Dean 明說 Gate D 或 Gate A | Prep 極低 / Live 中-高 | Gate D: domain 字串 + DNS 權限 ／ Gate A: real pub id | Prep phase doc |
| F | Live Blogger overflow 觀察 | 實機再現水平捲軸 | 極低 | Dean DevTools 提供 offender / scrollWidth / viewport | 新 observation doc |
| G | Second GitHub Pages deploy | Dean 明列篇目 + 明說 push 授權 | 中-高 | 逐篇 file paths + push 授權 | 1 篇 pre-deploy gate + build + deploy |

---

## 5. Recommended decision order

**A → B → 其中一條（C / D / E / F / G）**。理由：

1. **A（idle freeze）為預設**：若 Dean 未明確指示啟動 B–G 任一，維持 idle；不主動啟動任何 route。
2. **B（route selection 深化）為第二層深化入口**：若 Dean 想在啟動 C–G 前先看清各 route 之細節、或想追加新 route、或想拆某 route 為多階段，先選 B；仍是 docs-only、風險最低。
3. **C / D / E / F / G 之間不排優先度**：選哪條由 Dean 依當下目標判斷；本 doc 不代 Dean 選（因下述五面向皆非 Claude 可判斷）：
   - Dean 是否已從 Blogger 後台整理出真值 → 是則傾向 C
   - Dean 是否覺得 Blogger 手動 preview 流程繁瑣度已影響工作 → 是則傾向 D
   - Dean 是否已累積內容 / 觀察 SEO 到啟動 domain / AdSense 時機 → 是則傾向 E
   - Dean 是否於實機發布頁再現水平捲軸 → 是則觸發 F
   - Dean 是否有新篇 / 更新想 push 至 gh-pages → 是則傾向 G
4. **每條 route 皆為獨立 phase**：不合併、不重疊、不並行；一次一條。
5. **Route 之間可回退 A**：任一 route 執行中若 Dean 決定收手，即刻回退 A（idle freeze）；未完成之 mutation 需 rollback（依對應 preflight 定義）。

**caveat**：本 §5 為 recommendation，**非**強制流程；Dean 可依當下判斷選擇 A / B / C / D / E / F / G 任一，Claude 於下一 session 明確 approval 時執行。

---

## 6. What Claude must not start autonomously

以下項目 Claude 於任何 session（含未來 session cold-start）**皆不主動啟動**、**皆不代 Dean 決策**；均須 Dean explicit approval + 對應 phase 才可執行：

| 項目 | 對應 route | 主要 pointer |
| --- | --- | --- |
| Blogger backfill write phase 啟動 + 補真值 | Route C | `docs/20260710-blogger-backfill-write-phase-preflight.md` |
| 動 `.publish.json` sidecar 之任何欄位 | Route C | 同上 |
| 建立 6 篇 sidecar-absent 之新 sidecar | Route C | 同上 §5 / §8 |
| Blogger preview helper 實作 — B1 navigator | Route D | ✅ landed 2026-07-12（`cc6497b`；`docs/20260712-preview-only-helper-implementation.md`）；此列僅為歷史對照 |
| Blogger preview helper 實作 — B2 draft-aware preview build | Route D | `docs/20260710-blogger-preview-only-script-preanalysis.md` §6.2 / §11；B2 仍 Dean-gated |
| 動 `build:blogger` / `classify` / `dist-blogger/` 契約 | Route D | 同上（B2 gate；B1 未動這三者）|
| Custom domain（Gate D）啟動 + 買 domain / 設 DNS / 建 `CNAME` | Route E | `docs/20260710-custom-domain-adsense-trigger-checklist.md` §5 / §6 |
| AdSense（Gate A）啟動 + 落地 real pub id / `ads.txt` | Route E | 同上 §8 / §10 / §11 |
| Blogger 實機 overflow 觀察啟動 | Route F | `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md` §7 Option A |
| Second GitHub Pages deploy（新 push gh-pages / 更新 `dist/`） | Route G | `docs/20260703-post-c1-next-deploy-candidates.md` |
| Blogger AdSense Batch 2 P2 live repost | 未列 route（獨立 gate） | `docs/20260612-blogger-adsense-batch-*` |
| Reverse UTM pm-26 deploy | 未列 route（獨立 gate） | `docs/reverse-utm-fixture-plan.md` §6；`memory/project_reverse_utm_status.md` |
| `github-pages-blog-planning` 解除 quarantine | 未列 route（獨立 gate） | `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md` |
| Admin write path 啟動（Apply / middleware / admin-write-cli / `--apply` / `dryRun:false`） | 未列 route（永 dormant） | `memory/project_admin_write_path_status.md` |
| FB sidecar 真實寫入 | 未列 route（永 dormant） | 待 Dean 勾選 8 項 preflight |
| Commerce L2 / L3 / L4 新 candidates | 未列 route | `memory/project_commerce_status.md` |
| Phase 2 功能（後台登入 / 視覺編輯器 / Blogger API / Drive API / View 數 / 讚 / 留言 / 全文搜尋 / DB）| 未列 route（第一版永禁）| `CLAUDE.md` §29 |
| Phase 1 final 之降級 / 重新封存 | 未列 route（永禁）| `CLAUDE.md` §3a Core operating rules |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | 未列 route（永禁）| `CLAUDE.md` §3a Historical ledger replacement rule |
| Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台任何動作 | 各 route 均 forbidden | `CLAUDE.md` §3a Red lines |
| 猜任何 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId` | 各 route 均 forbidden | `docs/20260706-blogger-identity-and-backfill-strategy.md` |
| 升 report-only guard 為 fail-fast | 各 route 均 forbidden | `memory/project_report_only_metadata_guards.md` §6 |

---

## 7. Non-goals for this session

本 session 明確不做（cumulative；違反即 abort）：

| 項目 | 狀態 |
| --- | --- |
| 動 `src/**` / `views/**` / `styles/**` / `js/**` / `scripts/**` / EJS / SCSS / JS | ❌ 未動 |
| 動 `content/**/*.md` frontmatter / `.publish.json` sidecar / `.fb.md` | ❌ 未動 |
| 動 `content/settings/*.json` | ❌ 未動 |
| 動 `CLAUDE.md` / `MEMORY.md` / `memory/**` | ❌ 未動 |
| 動 `package.json` / `package-lock.json` | ❌ 未動 |
| 新增 npm script / guard / preview-only script | ❌ 未做 |
| 跑 `npm run build:*` / `preview` / `dev` | ❌ 未跑 |
| 跑其他 `check:*` guard（除 §0 兩支 phase1-readiness）| ❌ 未跑 |
| deploy / push gh-pages / 動 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | ❌ 未動 |
| Blogger 後台 / repost / draft flip / URL 設定 / 標籤設定 / 圖片上傳 | ❌ 未動 |
| AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 | ❌ 未動 |
| 猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId` | ❌ 未猜 |
| Admin write path / Apply / middleware / admin-write-cli | ❌ 未動 |
| Blogger backfill write phase / 建立任何新 sidecar / 動既有 sidecar | ❌ 未動 |
| Blogger AdSense Batch 2 P2 live repost | ❌ 未動 |
| Reverse UTM pm-26 deploy | ❌ 未動 |
| 買 custom domain / 設 DNS / 建 `CNAME` / 建 `ads.txt`（含 placeholder / fake）| ❌ 未做 |
| AdSense formal application / 動 production ad script | ❌ 未做 |
| Second GitHub Pages deploy / `github-pages-blog-planning` quarantine 解除 | ❌ 未動 |
| Phase 1 final 之降級 / 重新封存 | ❌ 未動 |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | ❌ 未做 |
| 新增規則 / 新增契約 / 改流程 | ❌ 未做（本 doc 純 preanalysis） |
| 代 Dean 決策 / 啟動 A–G 任一 route | ❌ 未做 |
| 排 C / D / E / F / G 之間 preferred order | ❌ 未做（本 doc §5 僅列判斷面向、不代 Dean 選）|

---

## 8. Idle-freeze recommendation

**Recommendation = remain idle freeze**（沿用 `CLAUDE.md` §3a Recommended next paths；handoff readout §8；next-readiness §8；docs-index §11）。理由：

1. Phase 1 RC baseline 於本 session 已再驗、未 drift；readiness 兩支 guard 皆 exit 0；三次手動 E2E / smoke 皆 PASS；deploy clone 未動。
2. 2026-07-10 家族 8 份 docs-only slice 已 landing；handoff / workflow / gate / preflight 三層皆補齊；本 doc（route selection preanalysis）為第 9 份，補齊「未來啟動路徑之單頁 route table」。
3. 目前**無** blocking issues（P0 = none；P1-1 resolved / P1-2 documented accepted / P1-3 downgraded to P2 external artifact）。
4. Route B–G 皆屬 RC 邊界外之候選；啟動任一均須 Dean explicit approval + 對應 phase；本 doc 不代 Dean 選。
5. 本 doc 之角色 = 未來 session 之單頁 route lookup；今日不做任何啟動決策；今日不排 C–G 之間 preferred order。

**若 Dean 於未來 session 明確判斷需推進**：依 §5 recommended decision order（A → B → 其中一條 C / D / E / F / G）執行；每個 slice 皆須另開獨立 phase + explicit approval + 對照 handoff readout §5.3 Session rules gate。

---

## 9. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔（+ 對應 commit + push origin/main）。**不含**任何程式 / frontmatter / settings / sidecar / build / deploy / dev-server 變更；未新增 guard / npm script / preview-only script / helper script；未改 `.gitignore`；未改 CSS；未改 `CLAUDE.md` / `MEMORY.md` / `memory/`；未觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages；未發布 Blogger；未購買網域 / 未動 DNS / 未碰 AdSense / GA4 / Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`；未猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId`；未從任何 metadata 推導 Blogger internal ID；未新增測試文章 / artifact；未建 `CNAME` / `ads.txt`（含 placeholder / fake）；未動 `content/settings/ads.config.json`；未升級任何 report-only guard 為 fail-fast。§0 boot baseline 為本 session read-only 驗證；§2 what's stabilized 為對既有 result / RC docs 之盤點結論，未代替 Dean 宣告新 PASS；§3 route table 為對既有 preflight docs 之整理，未新增契約；§4 summary 為 §3 之濃縮；§5 recommended decision order 為建議、非強制流程；§6 Claude must not start autonomously 沿用 `CLAUDE.md` §3a Red lines + 各 route 之對應 preflight；§7 non-goals 沿用 handoff readout §7 + `CLAUDE.md` §3a Red lines；§8 idle-freeze recommendation 沿用 `CLAUDE.md` §3a Recommended next paths。

---

## See also

- `docs/20260709-blog-phase2-next-work-packet.md`（Phase 2 next-work packet；本 doc 為其 §C 候選 2 之落地）
- `docs/20260710-phase1-rc-docs-index.md`（2026-07-10 家族 8 份 docs 之單頁 lookup index；本 doc §5 / §6 之上位）
- `docs/20260710-phase1-rc-handoff-operating-readout.md`（Phase 1 RC handoff / operating readout；本 doc §2 / §6 引用）
- `docs/20260710-blogger-admin-export-workflow-alignment.md`（Admin `#blogger-export` 資料來源 audit + 4 步 workflow；Route D 之 preview helper preanalysis 上位）
- `docs/20260710-blogger-preview-sanity-analysis.md`（Blogger preview 40 項 sanity checklist）
- `docs/20260710-phase1-rc-next-readiness-analysis.md`（RC readiness re-verify + 三份 workflow docs 影響面 audit）
- `docs/20260710-blogger-backfill-write-phase-preflight.md`（Route C 之 preflight；本 doc §3 Route C 引用 §2 / §4 / §5 / §7 / §8 / §9 / §10）
- `docs/20260710-custom-domain-adsense-trigger-checklist.md`（Route E 之 preflight；本 doc §3 Route E 引用 §5 / §6 / §8 / §10 / §11）
- `docs/20260710-blogger-preview-only-script-preanalysis.md`（Route D 之 preflight；本 doc §3 Route D 引用 §6 / §11）
- `docs/20260712-preview-only-helper-implementation.md`（Route D B1 navigator landing ledger；2026-07-12；`cc6497b`；`check:blogger-preview` + `check:blogger-preview-smoke` 49/49）
- `docs/20260708-phase1-stability-closeout-rc-note.md`（Phase 1 stability closeout RC note；本 doc §2.1 引用 §F）
- `docs/20260708-phase1-second-manual-e2e-result.md`（第二次人工 E2E；P1/P2 follow-up 分級來源）
- `docs/20260708-phase1-third-manual-smoke-result.md`（第三次小型人工 smoke；P1-1 verified resolved）
- `docs/20260708-phase1-p1-followup-closeout-inventory.md`（Admin `#blogger-export` 5 顆 Copy 按鈕 fix landing record；commit `38a4e98`）
- `docs/20260708-blogger-draft-preview-runbook.md`（Blogger draft-preview 6 步可重複流程；含 §F overflow debug；Route F 之 §F-4 分類判定規則來源）
- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（build eligibility 盤點 + Option A/B/C；Route D 之 §6 B2 sourced from §7 Option B）
- `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md`（Route F 之 §7 Option A 上位）
- `docs/20260708-domain-github-pages-adsense-decision.md`（domain / AdSense 決策盤點；Route E 之 §6 上位）
- `docs/20260708-adsense-source-evidence-audit.md`（AdSense 官方來源稽核；Route E 之 §8 上位）
- `docs/custom-domain-root-files-strategy.md`（custom domain 遷移機制；Route E 之 §5 / §6 / §8 上位）
- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger identity 分層 policy；Route C 之「不猜 ID」上位）
- `docs/20260706-blogger-backfill-write-target-inventory.md`（Blogger backfill sidecar canonical location；Route C 之 sidecar 路徑上位）
- `docs/20260706-blogger-backfill-report-only-baseline.md`（Blogger backfill report-only baseline）
- `docs/20260706-blogger-backfill-value-intake-template.md`（backfill 真值收集模板；Route C 引用）
- `docs/20260707-release-readiness-docs-index.md`（release-readiness 家族之單點索引；本 doc §2.2 之 carry-forward 上位）
- `docs/20260707-release-readiness-runbook.md` / `docs/20260707-release-readiness-clean-baseline-verification.md` / `docs/20260707-release-readiness-contract-baseline-verification.md` / `docs/20260707-metadata-all-prepublish-integration-audit.md`（release-readiness 家族）
- `docs/20260702-phase1-manual-e2e-runbook.md`（第一次 E2E：github-site happy-path PASS）
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`（GitHub Pages publish path readiness + prepublish checklist；`check:phase1-readiness` 之 required doc）
- `docs/20260702-session-start-dual-repo-baseline-snapshot.md`（session start dual-repo baseline snapshot；`check:phase1-readiness` 之 required doc）
- `docs/20260703-post-c1-next-deploy-candidates.md`（Route G 之 candidate roster 上位）
- `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`（`github-pages-blog-planning` quarantine hold；Route G 之 forbidden 上位）
- `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`（唯一 production expected warning 之依據）
- `docs/phase-1-completion-report.md` / `docs/phase-1-completion-checklist.md`（Phase 1 functional final 2026-05-18 宣告）
- `docs/20260617-blog-phase1-wrapup-status-map.md`（收尾路線圖 A/B/C/D/E 各線）
- `CLAUDE.md` §3a Current state snapshot（含 Red lines / Recommended next paths；本 doc 之上位）
- `CLAUDE.md` §5（分階段）、§7（Blogger 發布 checklist）、§14 / §15（tags / categories registry）、§16.4（cross-link UTM）、§17（文章頁基本版型）、§21（SEO / canonical / primaryPlatform）、§23（發布狀態；draft 不得進正式 dist）、§24（Blogger 發布 URL 回填）、§26（package.json 指令）、§27（Claude Code 修改規則）、§28（MVP 必做）、§29（第一版不做）
- `MEMORY.md` + `memory/project_baseline.md`（frozen source / deploy baseline）
- `memory/project_report_only_metadata_guards.md`（8 warning-only guards + release-readiness umbrella；本 doc §6 之 upgrade-forbidden 上位）
- `memory/project_admin_write_path_status.md`（Admin write path dormant；本 doc §6 之 forbidden 上位）
- `memory/project_reverse_utm_status.md`（pm-24a/b/c source landed；pm-26 deploy BLOCKED；本 doc §6 之 forbidden 上位）
- `memory/project_commerce_status.md`（Commerce L1 seed / L2+ blocked / C7 deferred；本 doc §6 之 forbidden 上位）
- `memory/project_download_status.md`（empty registries；R-rules + R5b landed；production migration blocked）
- `memory/project_phase1_rc_2026_07_10_family.md`（2026-07-10 docs family 上位；本 doc §2.3 之 memory upstream）
- `memory/feedback_phase_discipline.md`（memory-sync-only / docs-only / source-only phases 不重疊；本 doc §7 之 discipline 上位）
- `memory/feedback_no_per_article_html_decorations.md`（keep posting simple）

---

（本文件結束 / end of document）
