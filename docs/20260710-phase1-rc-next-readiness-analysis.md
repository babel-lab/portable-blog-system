# Phase 1 RC → next-readiness analysis（docs-only）

- 建立日期：2026-07-10（Asia/Taipei）
- 類型：docs-only **audit + next-readiness confirmation**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 目的：於 2026-07-10 已 landed 之三份 docs-only 切片後（`docs/20260710-phase1-rc-handoff-operating-readout.md` / `docs/20260710-blogger-admin-export-workflow-alignment.md` / `docs/20260710-blogger-preview-sanity-analysis.md`），重跑 readiness gate 並 audit：
  1. Phase 1 RC baseline 是否仍維持 0-error / warning-only；
  2. `check:phase1-readiness` / `check:phase1-readiness-contract` / prepublish / smoke / metadata guards / Blogger backfill report-only 之間狀態是否一致；
  3. 最近兩份 Blogger workflow docs 是否已把 Admin export / Blogger preview 流程補齊；
  4. 哪些事項可視為 Phase 1 RC 穩定條件之一部分；哪些仍不可進入 write / deploy phase；
  5. 下一階段前 recommended path 之排序。
- 本輪界線（docs-only）：**不** build / **不** preview / **不** deploy / **不**改任何 frontmatter / **不**改任何 sidecar `.publish.json` / **不**動 Blogger backfill 語意（`check:blogger-backfill` 維持 report-only）/ **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / **不**碰 Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 / **不**動 `CLAUDE.md` / `MEMORY.md` / `memory/`。
- 本輪允許 mutation：新增本檔（唯一）+ commit + push origin/main。

---

## 0. Boot baseline（本輪已驗）

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `f42ba32` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅（read-only 驗證） | `0 / 0` | clean | absent ✅ |

Source HEAD `f42ba32` = `docs(blogger): record preview sanity checklist`。前接三 commit 依序為 `d73492b`（`docs(blogger): clarify admin export workflow alignment`）→ `4e34d20`（`docs(state): record phase1 rc handoff readout`）→ `1480ede`（`docs(state): record blog phase2 next work packet`）→ `625b873`（`docs(state): record phase1 stability closeout note`）。四份皆為 docs-only 切片、皆 signed by phase discipline（source-only phase 未混入）。

判定：boot baseline 完全符合 `docs/20260710-phase1-rc-handoff-operating-readout.md` §1；deploy clone 本輪僅 read-only 驗證，未寫入。

---

## 1. 結論（先講結果）

**A. Phase 1 RC readiness = 未 drift**。三份 2026-07-10 docs-only slice landing 後，readiness 兩支 guard 皆 exit 0 / green：

| 指令 | 結果 | 對照 handoff readout §2.3 |
| --- | --- | --- |
| `npm run check:phase1-readiness` | exit 0；validate 0/135/107、npm-script-targets **48/48**、adsense-mode-metadata scanned 17 / warnings 0、blogger-backfill scanned 12 / candidates 7 / complete 0 / missing 7 report-only、prepublish 16/16、smoke 8/8 | ✅ 完全一致（惟 npm-script-targets 為 48/48，見 §2.2） |
| `npm run check:phase1-readiness-contract` | **22/22 PASS**（1 parseable + 1 script-present + 6 required fragments + 13 forbidden tokens absent + 1 ordered-fragments 6/6） | ✅ 一致 |

**B. 兩份 2026-07-10 Blogger workflow docs（alignment + preview sanity）已把 Admin export → build → dist → Blogger preview 流程之描述面補齊**。以下三個 pain points 已 documented / covered：

- **Attempt 1（貼 raw MD）失敗根因**：alignment doc §3 明示 workflow 4 步；runbook §D-7 / §E first bullet 亦明示。
- **Admin `#blogger-export` 為 source-driven、不讀 dist**：alignment doc §2 逐行盤點 `src/views/admin/index.ejs:2911–3073`；`be-notice` + per-post 5 顆 Copy 按鈕已恆常 render；契約已定案。
- **preview 階段 sanity 檢查**：preview sanity doc §5 提供 40 項勾選（content parity / images / links / metadata / RWD / optional blocks / console / cross-verify / boundary recap），補齊 runbook §D-8..§D-9 之細化。

**C. RC baseline 之「穩定」有明確界線**：不涵蓋 custom domain / AdSense 正式 serving / GA4 dim expansion / Blogger 正式營運發文 / Blogger 後台任何寫入（handoff readout §3.3）。以下項目仍**不可** enter write / deploy phase 除非 Dean explicit approval + 對應 phase：

- Blogger backfill write phase（sidecar `.publish.json` 或 frontmatter blogger block 之任何寫入）
- Reverse UTM Blogger → GitHub pm-26 deploy
- Second GitHub Pages deploy（含新 push gh-pages / 更新 `dist/`）
- Custom domain / DNS / GitHub Pages custom domain 設定 / `CNAME`
- AdSense formal application / ads.txt 落地 / serving verification
- Blogger AdSense Batch 2 P2 live repost
- `github-pages-blog-planning` quarantine 解除
- Admin write path（Apply / middleware / admin-write-cli / `--apply` / `dryRun:false`）
- 動任何 frontmatter / 任何 `.publish.json`

**D. Recommended next path**：**idle freeze**（保守路徑）為預設。若 Dean 目標分岔明確，推薦候選 A → B → D → E → C 順序（見 §7；C 為觸發條件命中時才啟動）。本 doc **不**代 Dean 決策、**不**啟動任何候選。

---

## 2. Readiness 一致性 audit

### 2.1 `check:phase1-readiness` 之組成與現況

**組成順序**（`package.json` `scripts["check:phase1-readiness"]`；由 `check:phase1-readiness-contract` §22-fragment ordered check 鎖定）：

```
validate:content
  → check:npm-script-targets
  → check:adsense-mode-metadata
  → check:blogger-backfill
  → check:github-pages-prepublish
  → check:github-pages-prepublish-smoke
```

本輪實跑（`f42ba32`；本 doc commit 前）：

| 子 guard | 本輪跑結果 | 對照 baseline（handoff readout §2.3） | 差異 |
| --- | --- | --- | --- |
| `validate:content` | 0 error / 135 warning / 107 post | 0 / 135 / 107 | 一致 |
| `check:npm-script-targets` | 48/48 PASS | 47/48 差異註（見 §2.2） | 註記差異、非 regression |
| `check:adsense-mode-metadata` | scanned 17 / warnings 0 | scanned 17 / warnings 0 | 一致 |
| `check:blogger-backfill` | scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5 / exit 0 | 一致 | 一致 |
| `check:github-pages-prepublish` | 16/16 PASS（source 8 + deploy clone 8；純讀 git） | 16/16 | 一致 |
| `check:github-pages-prepublish-smoke` | 8/8 PASS | 8/8 | 一致 |

**判定**：umbrella exit 0；子 guard 皆 exit 0 / warning-only；無新 error class；無 regression。

### 2.2 `check:npm-script-targets` 47 vs 48 差異註

`CLAUDE.md` §Validation baseline 顯示 `check:npm-script-targets` = 37/37（舊 snapshot；additive-only drift 已 documented in `memory/project_baseline.md`）；`memory/project_baseline.md` @ `d11b595` 記 47/47；本輪跑 **48/48**。差異來源均為 additive-only（每 slice 新增 1 script target 之 registered check）；序列由 `aefc3d9` → `b1707c9` → `f6acf19` → `738da53` → `b5c45d0` → `ec0b5b0` 依序推進，並未取代任何既有 target。**判定：非 regression**。CLAUDE.md 之 baseline 表為舊 snapshot、不 fix（除非 memory-sync phase 明訂）。

### 2.3 `check:phase1-readiness-contract` 之組成

**Meta-guard**（不執行 umbrella / 不讀 deploy clone / 不 build / 不 fetch / 純讀 `package.json` text）；本輪 **22/22 PASS**：

| 類別 | 通過 |
| --- | --- |
| package.json parseable | 1/1 |
| `check:phase1-readiness` script present | 1/1 |
| Required fragments present（6 條） | 6/6 |
| Forbidden tokens absent（13 條：`build` / `deploy` / `gh-pages` / `push` / `write` / `backfill:url` / `admin:write` / `safe-write` / `rm -rf` / `git push` / `git checkout` / `git reset` / `publish`） | 13/13 |
| Ordered fragments in expected sequence（6/6） | 1/1 |

**判定**：umbrella 契約 lock 完整；6/6 required fragment 依序排列；13/13 forbidden token 均缺席。

### 2.4 readiness / release-readiness / metadata-all 三 umbrella 邊界

三 umbrella 各有清楚 scope；**不重疊、不互相取代**：

| Umbrella | Scope | 本輪狀態 |
| --- | --- | --- |
| `check:phase1-readiness` | Phase 1 穩定測試就緒 gate（含 prepublish + smoke + metadata guards partial + validate + backfill report-only） | ✅ 本 session 已跑 exit 0 |
| `check:phase1-readiness-contract` | `check:phase1-readiness` script 契約 meta-guard | ✅ 本 session 已跑 22/22 |
| `check:release-readiness` | Release-readiness 契約 umbrella（contract → prepublish → smoke → metadata-all → validate） | 本 session **未跑**（carry-forward from `d11b595`：exit 0；`memory/project_report_only_metadata_guards.md` §4b） |
| `check:release-readiness-contract` | `check:release-readiness` script 契約 meta-guard（含 5-fragment order lock） | 本 session **未跑**（carry-forward 14/14 PASS） |
| `check:metadata-all` | 8 支 report-only metadata guard 之組合 | 本 session **未跑**（carry-forward 8 guards exit 0；`memory/project_report_only_metadata_guards.md` §3） |

**判定**：本 session 只跑 `check:phase1-readiness` + `check:phase1-readiness-contract`（Dean 於 briefing 明列之兩支）；其餘 umbrella carry-forward、狀態未動。

### 2.5 Blogger backfill report-only 一致性

`check:blogger-backfill` 於本輪跑之結果 = **scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5 / exit 0 / warning-only**。

| candidate | sidecar | 缺欄位 |
| --- | --- | --- |
| `20260515-we-media-myself2.md` | sidecar-present, status=ready | 缺 `blogger.bloggerPostId`（`publishedUrl` / `publishedAt` 已於 sidecar）|
| `20260612-after-work-writing-time-blocking.md` | sidecar-absent, status=ready | 缺 3 欄位 |
| `20260612-ai-tools-simplify-daily-workflow.md` | sidecar-absent, status=ready | 缺 3 欄位 |
| `20260612-blog-as-personal-knowledge-base.md` | sidecar-absent, status=ready | 缺 3 欄位 |
| `20260612-blog-restart-steady-rhythm-notes.md` | sidecar-absent, status=ready | 缺 3 欄位 |
| `20260612-daily-reading-habit-notes.md` | sidecar-absent, status=ready | 缺 3 欄位 |
| `20260612-reading-notes-three-questions.md` | sidecar-absent, status=ready | 缺 3 欄位 |

**判定**：backfill guard 語意 = **report-only / warning-only / exit 0**；本輪未動 guard 語意、未動 policy、未動 candidate 分類。

- `bloggerPostId` 屬**系統欄位**、待未來 Blogger API flow 取得、不列為 Dean 人工 backfill 必填（`docs/20260706-blogger-identity-and-backfill-strategy.md`）。
- Dean 只能提供 `publishedUrl` / `publishedAt` / `note`。
- **不猜** Blogger `publishedUrl` / `bloggerPostId` / `publishedAt`。
- Backfill write phase = **blocked** 至 Dean 提供真值 + explicit approval + 對應 phase（handoff readout §4.1 / §6 候選 B）。
- Canonical write target = `.publish.json` sidecar；frontmatter blogger block = **legacy fallback、不建議寫入**（`docs/20260706-blogger-backfill-write-target-inventory.md`）。

---

## 3. 2026-07-10 三份 docs-only slice 影響面 audit

### 3.1 `docs/20260710-phase1-rc-handoff-operating-readout.md`（`4e34d20`）

- **交付物**：一份 session cold-start 可讀完之 operating readout；§1 boot baseline、§2 Phase 1 completed 摘要、§3 milestone / RC decision / follow-up status、§4 dormant / blocked / report-only、§5 Phase 2 啟動前 checklist、§6 候選 A–E 啟動條件、§7 red-line、§8 建議入口。
- **influence 面**：把 RC note（`docs/20260708-phase1-stability-closeout-rc-note.md`）+ Phase 2 packet（`docs/20260709-blog-phase2-next-work-packet.md`）+ CLAUDE.md §3a 三份文件之 handoff 資訊集中為單一 lookup。
- **未動**：源程式 / frontmatter / settings / build / deploy / dev-server / CLAUDE.md / MEMORY.md / memory / deploy clone。
- **對 readiness 之影響**：無（純 docs；未影響 guard / 契約 / baseline 數值）。

### 3.2 `docs/20260710-blogger-admin-export-workflow-alignment.md`（`d73492b`）

- **交付物**：Admin `#blogger-export` 資料來源 audit（§2 逐行盤點 `src/views/admin/index.ejs:2911–3073`）+ workflow 4 步（§3）+ 描述一致性 audit（§4 對照 4 類 docs）+ 觸點盤點（§5）+ 是否需 guard / script 之判定（§6）+ backfill 行為不動之明示（§7）+ red-line（§8）+ 下一 session 候選（§9）。
- **influence 面**：確認 Admin `#blogger-export` per-post Copy 按鈕 = **NOT a regression**；為 source-driven（不看 `dist-blogger/` 是否存在）；契約已恆常 render。
- **未動**：源程式 / frontmatter / settings / build / deploy / dev-server / CLAUDE.md / MEMORY.md / memory / deploy clone。
- **對 readiness 之影響**：無；補齊「Admin 匯出到 Blogger 貼 HTML」的 workflow 描述完整性；未新增 guard、未新增 script、未動 Admin `be-notice`。

### 3.3 `docs/20260710-blogger-preview-sanity-analysis.md`（`f42ba32`）

- **交付物**：Blogger preview sanity checklist（§5 之 9 個 subsection 共 40 項勾選）+ 現有 docs 覆蓋 audit（§3）+ 與 runbook / `publish-checklist.txt` / 第二次 E2E 之關係（§6）+ red-line（§7）+ 下一 session 候選（§8）。
- **influence 面**：補齊 runbook §D-8..§D-9 之細化；作為下一輪手動 E2E 之 paste-preview 階段操作表。
- **未動**：源程式 / frontmatter / settings / build / deploy / dev-server / CLAUDE.md / MEMORY.md / memory / deploy clone。
- **對 readiness 之影響**：無；本 checklist 為手動 E2E 檢核之工具，不進入 automated readiness gate。

**判定**：三份 docs-only slice 皆為 additive-only；**未** drift readiness baseline、**未**新增契約 / guard / script、**未**改任何程式面。RC baseline 對比 2026-07-08 stability closeout RC note 之數值完全一致。

---

## 4. 已可視為 Phase 1 RC 穩定條件之部分

### 4.1 Automated readiness（本 session 已再驗）

- ✅ `check:phase1-readiness` exit 0
- ✅ `check:phase1-readiness-contract` 22/22 PASS
- ✅ `validate:content` 0 error / 135 warning / 107 post
- ✅ `check:github-pages-prepublish` 16/16 PASS
- ✅ `check:github-pages-prepublish-smoke` 8/8 PASS
- ✅ `check:blogger-backfill` report-only 一致（scanned 12 / candidates 7 / missing 7）
- ✅ `check:adsense-mode-metadata` scanned 17 / warnings 0

### 4.2 Automated readiness（carry-forward from `d11b595` / handoff readout §2.3）

- ✅ `check:release-readiness` exit 0（contract → prepublish → smoke → metadata-all → validate）
- ✅ `check:release-readiness-contract` 14/14 PASS
- ✅ `check:metadata-all` 8 guards exit 0
- ✅ `check:admin-markdown-export` 256/256 PASS
- ✅ `check:validation-report` 27/0

### 4.3 手動測試（三次 E2E / smoke）

- ✅ 第一次人工 E2E（github-site happy-path，2026-07-02）
- ✅ 第二次人工 E2E（blogger-site draft-preview 鏈路，2026-07-08）— P1/P2 follow-up 已 resolved / documented / downgraded
- ✅ 第三次小型人工 smoke（2026-07-08）— P1-1 verified resolved / P1-2 verified usable / P1-3 downgraded to P2

### 4.4 已 live 內容 / 已 deploy

- ✅ First GitHub Pages deploy（2026-07-03；deploy `1170e7e`）；4 篇 online verified
- ✅ P3 Blogger post live verified（2026-06-17；`blog-restart-steady-rhythm-notes`）
- ✅ GA4 production live（`G-C77SMPF8VD`，2026-05-21 起）；P1 `article_bottom_nav` verified 2026-06-15 17:35

### 4.5 已 documented workflow / handoff

- ✅ Blogger draft-preview 6 步 runbook（`docs/20260708-blogger-draft-preview-runbook.md`）
- ✅ Admin export workflow alignment（`docs/20260710-blogger-admin-export-workflow-alignment.md`）
- ✅ Blogger preview sanity checklist（`docs/20260710-blogger-preview-sanity-analysis.md`）
- ✅ Phase 1 RC handoff / operating readout（`docs/20260710-phase1-rc-handoff-operating-readout.md`）
- ✅ Phase 1 stability closeout RC note（`docs/20260708-phase1-stability-closeout-rc-note.md`）

**判定**：以上 §4.1–§4.5 已完成，屬 Phase 1 RC 穩定條件之核心。RC 判定為「開發線 / 內部 sign-off」（handoff readout §3.3）；不涵蓋 custom domain / AdSense serving / GA4 後台 / Blogger 正式營運發文（見 §5）。

---

## 5. 仍不可進入 write / deploy phase 的項目（RC 邊界外）

依 handoff readout §4.1 與 §7 red-line，以下項目**仍為 blocked / dormant / forbidden**、不得於 RC 狀態下直接進入 write / deploy：

| 項目 | 現況 | 為何仍 blocked |
| --- | --- | --- |
| Blogger backfill write phase | ⏸ dormant | 待 Dean 提供 `publishedUrl` / `publishedAt` / 選填 `note` + explicit approval + 對應 phase；`bloggerPostId` 屬系統欄位 |
| Second GitHub Pages deploy（含新 push gh-pages / 更新 `dist/`） | 🔴 blocked | 低風險候選 = 0；各篇 Dean-gated；handoff readout §4.1 |
| Reverse UTM Blogger → GitHub pm-26 deploy | 🔴 dormant | source landed `7e1d356` / `e2309e9` / `7c769fe`（2026-05-23）；live dormant；pm-26 gate BLOCKED |
| Custom domain / DNS / GitHub Pages custom domain 設定 / `CNAME` | 🔴 out of Phase 1 scope | `docs/20260708-domain-github-pages-adsense-decision.md` §7–§9 |
| AdSense formal application / `ads.txt` 落地 / serving verification | 🔴 out of Phase 1 scope | `docs/20260708-adsense-source-evidence-audit.md` §6 |
| Blogger AdSense Batch 2 P2 live repost（`ai-tools-simplify-daily-workflow`） | 🔴 BLOCKED | 至 explicit approval |
| `github-pages-blog-planning` quarantine 解除 | 🔴 hold（by design） | `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md` |
| Admin write path（Apply / middleware / admin-write-cli / `--apply` / `dryRun:false`） | 🔴 dormant | `memory/project_admin_write_path_status.md` |
| FB sidecar 真實寫入 | ⏸ dormant | 待 Dean 勾選 8 項 preflight |
| GA4 dashboard / D4 dimension expansion / Search Console 後台 | 🔴 forbidden（by Claude） | Dean-provided masked evidence only |
| Blogger 後台 login / post / repost / update / delete / draft flip / template edit / URL 設定 / 標籤設定 / 圖片上傳 | 🔴 forbidden（by Claude） | `CLAUDE.md` §3a Red lines / §29 |
| Guess Blogger `publishedUrl` / `bloggerPostId` / `publishedAt` | 🔴 forbidden | `CLAUDE.md` §3a；`docs/20260706-blogger-identity-and-backfill-strategy.md` |
| 動任何 frontmatter / 任何 `.publish.json` sidecar | 🔴 forbidden（除 Dean 提供真值） | `CLAUDE.md` §3a Red lines |

---

## 6. 必須維持 report-only 的項目

以下 guard 必須維持 **report-only / warning-only / exit 0**；**不得升為 fail-fast**（升級須另開 phase + 對應 baseline / smoke 對照）：

| Guard | 現況 | 升為 fail-fast 之後果 |
| --- | --- | --- |
| `check:blogger-backfill` | report-only；candidates 7 / complete 0 / missing 7 | 阻擋所有 build / release 直到 Dean 提供 backfill 真值；不符合 Phase 1 red line（不猜 ID） |
| `check:adsense-mode-metadata` / `check:content-type-metadata` / `check:campaign-purpose-metadata` / `check:campaign-industry-metadata` / `check:custom-promo-metadata` | 5 支 single-field；warning-only | 阻擋所有既有 legacy 文章；破壞 additive-only 契約 |
| `check:campaign-metadata-cross-field` / `check:custom-promo-cross-field` / `check:adsense-cross-field` | 3 支 cross-field；warning-only | 阻擋所有既有 legacy 文章；破壞 additive-only 契約 |
| `check:validation-report` | 27/0；warning-only 為 baseline | 若升為 fail-fast，需重新設 baseline（本 phase 不做） |

`memory/project_report_only_metadata_guards.md` §6 明列以下 red line：

- Do NOT add build / deploy / push / gh-pages / dist / publish tokens into `check:release-readiness` — contract guard 會 fail-fast
- Do NOT reorder `check:release-readiness` fragments — contract guard's `ORDERED_FRAGMENTS` check will fail-fast on any swap
- Do NOT promote any single-field or cross-field guard from warning-only to fail-fast without a dedicated baseline/smoke phase

---

## 7. Recommended next path（下一階段前）

**保守路徑 = idle freeze**（`CLAUDE.md` §3a Recommended next paths；handoff readout §8）。若 Dean 目標分岔明確，以下推薦順序基於：

- 觸發條件是否已具備
- Dean 目標分岔（handoff readout §8）
- 風險上限（docs-only < preflight < source-only < 實作）
- 對 RC 邊界之 impact（RC 邊界外候選較高）

**推薦順序**：

| 排名 | 候選 | 觸發條件（本 doc 判斷） | 風險上限 | 對應 handoff readout §6 |
| --- | --- | --- | --- | --- |
| #1 | **idle freeze** | 預設 | 極低 | 保守路徑 |
| #2 | **候選 A**（Phase 1 RC → next-phase 決策入口 preanalysis；docs-only） | Dean 想看清下一步分岔面 | 極低 | 候選 A |
| #3 | **候選 B**（Blogger backfill write phase preflight；docs-only，不實寫） | Dean 準備進 backfill、想先 scope 資料需求 | 低 | 候選 B |
| #4 | **候選 D**（Blogger preview-only script Option B preanalysis；docs-only） | Dean 想長期評估 draft-preview 流程 | 低 | 候選 D |
| #5 | **候選 E**（custom domain / AdSense 觸發條件 checklist；docs-only） | Dean 準備讓 GitHub Pages 站累積 SEO / 變現 | 極低 | 候選 E |
| #6 | **候選 C**（Blogger 實機發布頁 overflow 觀察 docs-only） | **僅在實機發布頁再度出現水平捲軸時** | 極低 | 候選 C |

**排序理由**：

- 候選 A 排 #2：作為決策層 docs-only，可讓 Dean 一次比較多條路徑，投報比最高、對後續選擇最有幫助。
- 候選 B 排 #3：backfill preflight docs-only 可在 Dean 尚未提供真值前先落地資料需求 / 影響檔面 / 驗收判準；為 write phase 前的必要文件（handoff readout §6 候選 B）。
- 候選 D 排 #4：preview-only script preanalysis 屬長期 tooling 評估；短期無迫切性但長期可降低手動繁瑣度。
- 候選 E 排 #5：custom domain / AdSense 觸發條件檢清單屬時機決策 docs；只在 Dean 明確準備變現時才啟動。
- 候選 C 排 #6：**觸發條件未具備**（第三次 smoke §E-3 判定 offender 屬 Blogger preview 外殼、非 `.lab-blogger-article`），本 doc 建議**不主動啟動**；只在實機發布頁再現時才觸發。

**須 Dean explicit approval 才啟動**：以上 #2–#6 皆須 Dean explicit approval；本 doc **不**代 Dean 決策、**不**啟動任何候選。

---

## 8. Exit / idle-freeze recommendation

**Recommendation = idle freeze**（保守路徑）。理由：

1. Phase 1 RC baseline 於本 session 已再驗、未 drift；readiness 兩支 guard 皆 exit 0；三次手動 E2E / smoke 皆 PASS。
2. 三份 2026-07-10 docs-only slice 已 landing；Admin export → build → Blogger preview 流程之描述面已完整覆蓋。
3. 目前**無** blocking issues（P0 = none；P1-1 resolved / P1-2 documented accepted / P1-3 downgraded to P2 external artifact）。
4. RC 邊界外之候選（custom domain / AdSense serving / Blogger backfill write / second deploy / reverse UTM pm-26）皆 blocked；**啟動任何一條均須 Dean explicit approval + 對應 phase**。
5. `CLAUDE.md` §3a Recommended next paths 明列「保守路徑 = idle freeze」為預設；本 doc 沿用。

**若 Dean 明確判斷需推進**：依 §7 推薦順序執行；每個 slice 皆須另開獨立 phase + explicit approval + 對照 handoff readout §5.3 Session rules gate。

---

## 9. 明確不執行清單（本輪 red-line）

| 項目 | 狀態 |
| --- | --- |
| 動 `src/views/admin/index.ejs` / `src/scripts/*` / `src/js/*` / `src/styles/*` / EJS / SCSS / JS | ❌ 不動 |
| 動 `content/**/*.md` frontmatter / `.publish.json` sidecar / `.fb.md` | ❌ 不動 |
| 動 `content/settings/*.json` | ❌ 不動 |
| 動 `CLAUDE.md` / `MEMORY.md` / `memory/**` | ❌ 不動 |
| 動 `package.json` / `package-lock.json` | ❌ 不動 |
| 新增 npm script / guard / preview-only script | ❌ 不做 |
| 跑 `npm run build:*` / `preview` / `dev` | ❌ 未跑 |
| 跑其他 `check:*` guard（除 §2.1 兩支 phase1-readiness）| ❌ 未跑 |
| deploy / push gh-pages / 動 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | ❌ 未動 |
| Blogger 後台任何操作 / repost / draft flip / URL 設定 / 標籤設定 / 圖片上傳 | ❌ 未動 |
| AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 | ❌ 未動 |
| 猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` | ❌ 不猜 |
| Admin write path / Apply / middleware / admin-write-cli / `--apply` / `dryRun:false` | ❌ 未動 |
| Blogger AdSense Batch 2 P2 live repost | ❌ 未動 |
| Reverse UTM pm-26 deploy | ❌ 未動 |
| Custom domain / AdSense formal application / `CNAME` / `ads.txt` | ❌ 未動 |
| Second GitHub Pages deploy / `github-pages-blog-planning` quarantine 解除 | ❌ 未動 |
| Phase 1 final 之降級 / 重新封存 | ❌ 未動 |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | ❌ 不做 |
| 動 deploy clone / push gh-pages | ❌ 未動（僅 §0 read-only 驗證） |

---

## 10. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔（+ 對應 commit + push origin/main）。**不含**任何程式 / frontmatter / settings / build / deploy / dev-server 變更；未新增 guard / npm script / preview-only script；未修 CSS；未改 `CLAUDE.md` / `MEMORY.md` / `memory/`；未觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages；未發布 Blogger；未新增測試文章 / artifact；未購買網域 / 未動 DNS / 未碰 AdSense / GA4 / Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`；未猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt`。§0 boot baseline 為 read-only 驗證；§2 readiness 一致性 audit 為本 session 實跑 `check:phase1-readiness` + `check:phase1-readiness-contract` 之結果 + carry-forward baseline 對照；§3 slice 影響面 audit 為對 2026-07-10 已 landed 三份 docs 之整理；§4 已 stable / verified 為既有 sign-off 之複述；§5 blocked 為既有 status 之複述；§6 report-only red-line 沿用 `memory/project_report_only_metadata_guards.md` §6；§7 候選排序為建議、不代 Dean 決策；§8 exit recommendation = idle freeze 沿用 `CLAUDE.md` §3a Recommended next paths；§9 red-line 沿用 handoff readout §7 + `CLAUDE.md` §3a Red lines。

---

## See also

- `docs/20260710-phase1-rc-handoff-operating-readout.md`（Phase 1 RC handoff / operating readout；本檔為其後續 next-readiness 追蹤補充；未動 §6 候選啟動狀態、未動 §7 red-line）
- `docs/20260710-blogger-admin-export-workflow-alignment.md`（Admin `#blogger-export` 資料來源 audit + workflow 4 步；本檔 §3.2 引用）
- `docs/20260710-blogger-preview-sanity-analysis.md`（Blogger preview sanity checklist 40 項；本檔 §3.3 引用）
- `docs/20260708-phase1-stability-closeout-rc-note.md`（Phase 1 stability closeout RC note；本檔 §4 sign-off 依據）
- `docs/20260709-blog-phase2-next-work-packet.md`（Phase 2 next-work packet；候選 A–E 對應 §C-2 → §C-5）
- `docs/20260708-phase1-second-manual-e2e-result.md`（第二次人工 E2E；P1/P2 follow-up 分級來源）
- `docs/20260708-phase1-third-manual-smoke-result.md`（第三次小型人工 smoke；P1-1 resolved / P1-2 usable / P1-3 downgraded）
- `docs/20260708-blogger-draft-preview-runbook.md`（Blogger draft-preview 6 步；本檔 §3.3 引用）
- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（P1-2 build eligibility 盤點 / Option A/B/C；候選 D 引用 Option B）
- `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md`（P1-3 audit / 9 類假說；候選 C 觸發條件）
- `docs/20260708-domain-github-pages-adsense-decision.md`（domain / AdSense 時機決策；候選 E 內容源）
- `docs/20260708-adsense-source-evidence-audit.md`（AdSense 官方來源稽核；候選 E 內容源）
- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger identity 分層 policy；不猜 ID；候選 B policy 來源）
- `docs/20260706-blogger-backfill-write-target-inventory.md`（Blogger backfill write target inventory；候選 B sidecar 路徑來源）
- `docs/20260706-blogger-backfill-report-only-baseline.md`（Blogger backfill report-only baseline）
- `docs/20260702-phase1-manual-e2e-runbook.md`（第一次人工 E2E：github-site happy-path PASS）
- `docs/20260707-release-readiness-runbook.md` / `docs/20260707-release-readiness-docs-index.md`（release-readiness umbrella 家族；本檔 §2.4 引用）
- `docs/phase-1-completion-report.md` / `docs/phase-1-completion-checklist.md`（Phase 1 functional final 2026-05-18 宣告）
- `CLAUDE.md` §3a Current state snapshot（含 Red lines / Recommended next paths）
- `CLAUDE.md` §5（分階段）、§21（SEO / canonical / primaryPlatform）、§23（發布狀態；draft 不得進正式 dist）、§26（package.json 指令）、§27（Claude Code 修改規則）、§28（MVP 必做）、§29（第一版不做）
- `MEMORY.md` + `memory/project_baseline.md`（frozen source / deploy baseline）
- `memory/project_report_only_metadata_guards.md`（8 warning-only guards + release-readiness umbrella；本檔 §2.4 / §6 引用）
- `memory/project_admin_write_path_status.md`（Admin write path dormant）
- `memory/project_reverse_utm_status.md`（pm-24a/b/c source landed；pm-26 deploy BLOCKED）
- `memory/project_commerce_status.md`（Commerce L1 seed / L2+ blocked / C7 deferred）
- `memory/project_download_status.md`（empty registries；R-rules + R5b landed；production migration blocked）
- `memory/feedback_phase_discipline.md`（memory-sync-only / docs-only / source-only phases 不重疊）
- `memory/feedback_no_per_article_html_decorations.md`（keep posting simple）

---

（本文件結束 / end of document）
