# BLOG Phase 2 / next-phase entry — next work packet（docs-only）

- 建立日期：2026-07-09（Asia/Taipei）
- 類型：docs-only **next-work-packet**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）。
- 目的：Phase 1 stability closeout 之後，明確 scope 出下一步真正可實作 session 之最小切片候選面，避免直接碰 deploy / Blogger / AdSense / GA4 / Search Console / write path。
- 本輪界線（docs-only）：**不** build / **不** deploy / **不** run guard（除 boot 讀 git 狀態）/ **不**動 Blogger / AdSense / GA4 / GSC / DNS / domain / Google Drive 後台 / **不**進 write path / **不** Blogger repost / **不** reverse UTM deploy / **不**猜 Blogger postId / URL / publishedAt / **不**改任何 frontmatter / **不**改任何 sidecar `.publish.json`。

---

## 0. Frozen baseline（本輪 boot verification）

Source repo（`/d/github/blog-new/portable-blog-system`）：

| 欄位 | 值 |
| --- | --- |
| branch | `main` |
| HEAD | `625b8737b9003cb5998fe5b5bad463e4a842680a`（`625b873`） |
| subject | `docs(state): record phase1 stability closeout note` |
| == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |

Deploy clone（`/d/github/blog-new/portable-blog-deploy`；本輪僅讀 git 狀態，未動）：

| 欄位 | 值 |
| --- | --- |
| branch | `gh-pages` |
| HEAD | `1170e7e14aaa7f3449999bf92b9c8586719a76b4`（`1170e7e`） |
| subject | `deploy(github): publish first verified github pages scope` |
| == origin/gh-pages | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |

`CLAUDE.md` size（本輪 read-only 量測）：`wc -m` = **39799**、`wc -c` = **51658**；仍在 40000 chars 管控線內；不需 compaction；本輪不動 `CLAUDE.md`。

判定：boot baseline 完全符合 frozen baseline；deploy clone 於本輪未寫入。

---

## A. Phase 1 stability closeout 狀態摘要

以下為 **不改變 / carry-forward** 之現況盤點（依 §7 See also 引用之 result / RC 文件，未重跑 guard）：

| 項目 | 狀態 |
| --- | --- |
| Phase 1 functional final 宣告 | ✅ 2026-05-18（`docs/phase-1-completion-report.md`） |
| MVP §28 17 條 | ✅ 全達標；6/6 article block parity；sitemap + robots + JSON-LD landed |
| 第一次人工 E2E（github-site happy-path） | ✅ 2026-07-02 PASS（`docs/20260702-phase1-manual-e2e-runbook.md`） |
| 第二次人工 E2E（blogger-site draft-preview 鏈路） | ✅ 2026-07-08 PASS with P1/P2 follow-up |
| 第三次小型人工 smoke | ✅ 2026-07-08 PASS with P2 follow-up |
| Phase 1 stability closeout RC 判定 | ✅ **RC-ready for manual workflow**（`docs/20260708-phase1-stability-closeout-rc-note.md` §F） |
| P0 blocker | **none**（三次人工測試皆無） |
| P1 follow-up | P1-1 verified resolved（commit `38a4e98`）／ P1-2 documented+usable（runbook `docs/20260708-blogger-draft-preview-runbook.md`）／ P1-3 downgraded → P2（likely external Blogger preview artifact） |
| P2 follow-up | P2-1 documented / accepted（測試資料問題非系統缺陷） |
| First GitHub Pages deploy milestone | ✅ 2026-07-03，deploy commit `1170e7e`，live `https://babel-lab.github.io/portable-blog-system` |
| Validation baseline（carry-forward） | `validate:content` 0 / 135 / 107；`check:admin-markdown-export` 256/256；`check:github-pages-prepublish` 16/16；prepublish-smoke 8/8；`check:release-readiness-contract` 22/22（per RC note §B） |

**caveat**：RC 判定屬「開發線 / 內部 sign-off」，**不**涵蓋 custom domain / 正式 AdSense serving / GA4 後台 / Blogger 營運發文。Claude 未登入任何後台，未 build / deploy。

---

## B. 目前 dormant / blocked / report-only 項目盤點

以下路徑於本 session **不觸發**、且不列為本 packet 之候選切片；每項均需**獨立 phase + Dean explicit approval**。

### B.1 Blocked（含 forbidden by Claude）

| 項目 | 狀態 | 說明來源 |
| --- | --- | --- |
| Blogger 後台 login / post / repost / update / delete / draft flip / template edit / URL 設定 / 標籤設定 / 圖片上傳 | 🔴 forbidden（by Claude） | `CLAUDE.md` §3a Red lines / §29 |
| Guess Blogger `publishedUrl` / `bloggerPostId` / `publishedAt` | 🔴 forbidden | `CLAUDE.md` §3a Red lines；`docs/20260706-blogger-identity-and-backfill-strategy.md` |
| Blogger AdSense Batch 2 P2 live repost（`ai-tools-simplify-daily-workflow`） | 🔴 BLOCKED | 至 explicit approval |
| Reverse UTM Blogger → GitHub deploy（pm-26 gate） | 🔴 BLOCKED / dormant | source landed `7e1d356` / `e2309e9` / `7c769fe`（2026-05-23）；live dormant |
| Custom domain / DNS / GitHub Pages custom domain 設定 | 🔴 out of Phase 1 scope | `docs/20260708-domain-github-pages-adsense-decision.md` §7–§9 |
| AdSense formal application / serving verification | 🔴 out of Phase 1 scope | `docs/20260708-adsense-source-evidence-audit.md` §6 |
| GA4 dashboard / D4 dimension expansion / Search Console 後台 | 🔴 forbidden（by Claude） | Dean-provided masked evidence only |
| Second GitHub Pages deploy（含新 push gh-pages / 更新 `dist/`） | 🔴 out of Phase 1 scope | 依 low-risk candidate = 0；各篇均 Dean-gated |
| `github-pages-blog-planning` quarantine 解除 | 🔴 hold（by design） | `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md` |
| Admin write path（Apply / middleware / admin-write-cli / `--apply` / `dryRun:false`） | 🔴 dormant | `memory/project_admin_write_path_status.md` |
| FB sidecar 真實寫入 | ⏸ dormant | 待 Dean 勾選 8 項 preflight |
| Phase 2 功能（後台登入 / 視覺編輯器 / Blogger API / Drive API / View 數 / 讚 / 留言 / 全文搜尋 / DB） | 🔴 第一版永禁 | `CLAUDE.md` §29 |
| Phase 1 final 之降級 / 重新封存 | 🔴 永禁 | `CLAUDE.md` §3a Core operating rules |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | 🔴 永禁 | `CLAUDE.md` §3a Historical ledger replacement rule |

### B.2 Report-only guards（warning-only，不阻擋 build）

| Guard | Scope | 狀態 |
| --- | --- | --- |
| `check:blogger-backfill` | Blogger backfill 完整度 | report-only；candidates 7 / complete 0 / missing 7；bloggerPostId 屬 A.3 系統欄位不列必填（`docs/20260706-blogger-identity-and-backfill-strategy.md`） |
| `check:adsense-mode-metadata` | AdSense mode metadata | scanned 17 / legacy 17 / valid 0 / warnings 0 |
| `check:content-type-metadata` / `check:campaign-purpose-metadata` / `check:campaign-industry-metadata` / `check:custom-promo-metadata` | 5 支 single-field metadata guard | 皆 warning-only；聚合於 `check:metadata-guards` |
| `check:metadata-cross-fields` | 3 支 cross-field guard | 皆 warning-only；聚合於 `check:metadata-cross-fields` |
| `check:metadata-all` | metadata suite umbrella | report-only；聚合上兩者 |
| `check:validation-report` | validation report guard | 27/0（carry-forward） |

### B.3 Deferred（非 Phase 1 blocker，未來可另開 phase）

| 項目 | 狀態 |
| --- | --- |
| Blogger draft preview-only script（Option B；隔離輸出 + gitignored + PREVIEW-ONLY 標記） | deferred（`docs/20260708-blogger-draft-preview-export-eligibility-inventory.md` §7 Option B） |
| Blogger-only CSS scope hardening（若日後**實機發布頁**再現水平捲軸） | deferred（audit `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md` §7 Option B；未達觸發條件） |
| Admin richer fields / ready option / R2+ / loader migration | deferred（`CLAUDE.md` §3a ADMIN idle freeze） |
| Blogger backfill write phase | deferred；待 Dean 提供 §6 三項真值（`publishedUrl` / `publishedAt` + optional note；`bloggerPostId` 屬系統欄位不列必填） |
| GitHub Pages second deploy 各 Dean-gated 候選 | deferred（每篇獨立 phase） |
| Commerce C7 / C9 broader expansion | deferred |
| Download Admin picker / renderer / Forms 串接 / content migration | deferred |
| Reverse UTM Blogger → GitHub pm-26 deploy | dormant（source landed；未 deploy） |
| GA4 P2 / P3 dimension expansion / D4 broader | deferred |

---

## C. 候選切片（3–5 個；皆為 docs-only 或極小 scope；本 packet 只列不執行）

以下候選皆**未實作**、皆須**獨立 phase + Dean explicit approval** 才能啟動；本 packet 僅 scope-out，本 session 不動任一。**推薦順序 = 候選 1 → 2 → 3 → 4 → 5**。

---

### 候選 1（推薦 #1）— Phase 1 RC handoff / operating readout（docs-only）

**scope**：把 Phase 1 stability closeout RC note（`docs/20260708-phase1-stability-closeout-rc-note.md`）落地為一份**對外可交接**之 handoff checklist / operating readout，聚合：

- Phase 1 RC-ready sign-off 依據
- P1 / P2 follow-up 狀態表
- §E out-of-scope 明列（custom domain / AdSense / DNS / deploy / Blogger / GA4 / GSC）
- 每項 out-of-scope 若日後要啟動之**前置條件 checklist**（如 domain：`docs/20260708-domain-github-pages-adsense-decision.md` §8 觸發條件 / §9 缺項；AdSense：`docs/20260708-adsense-source-evidence-audit.md` §6 正式申請前確認清單）
- 未來 Session 起始「該讀哪些檔案」之精簡入口清單

**允許觸碰檔案**：

- 新增：`docs/<YYYYMMDD>-phase1-rc-handoff-checklist.md`（唯一 mutation）

**禁止觸碰檔案 / 動作**：

- ❌ `src/**` / `views/**` / `scripts/**` / `content/**`（含 posts / settings / templates / fixtures / drafts / archive / shared / sidecar）
- ❌ `package.json` / `package-lock.json` / lockfile / `CLAUDE.md` / `MEMORY.md` / `memory/**`
- ❌ `dist/**` / `dist-blogger/**` / `dist-promotion/**` / `dist-reports/**` / `.cache/**`
- ❌ deploy clone `/d/github/blog-new/portable-blog-deploy`（不寫入；至多 boot 讀 git 狀態）
- ❌ build / preview / dev / deploy / gh-pages push
- ❌ 動 domain / DNS / AdSense / GA4 / GSC / Blogger / Google Drive 後台
- ❌ 補任何 backfill 真值 / 猜 Blogger postId / URL / publishedAt

**驗證方式**：

1. `git status --short` clean（新增檔外無他動）
2. `git diff --stat` 只顯示 `docs/<YYYYMMDD>-phase1-rc-handoff-checklist.md` 新增
3. `wc -m docs/<YYYYMMDD>-phase1-rc-handoff-checklist.md` 記錄字元數
4. 目視審 handoff checklist 與 RC note §D–§G 引用一致；未虛構新 PASS

**風險**：極低（docs-only，未新增 guard / script；未動任何非 docs 檔）。

---

### 候選 2（推薦 #2）— Phase 1 RC → next-phase 決策入口 preanalysis（docs-only）

**scope**：docs-only 落地一份**下一階段選擇分析**，把「Phase 1 stable → 之後」之**分岔決策點**明列，供 Dean 在下一個 real-implementation session 之前先做 route selection：

- Route 1 = Blogger backfill write phase preflight（僅 preflight，不實寫）
- Route 2 = Second GitHub Pages deploy 候選 refresh（read-only；不 deploy）
- Route 3 = Blogger preview-only script Option B preanalysis（docs-only；不實作）
- Route 4 = Custom domain / AdSense 觸發條件 checklist（docs-only；不觸碰 domain / DNS）
- Route 5 = Admin richer fields / ready option preanalysis（docs-only；不動 UI）

每條 route 需列：（a）觸發條件（Dean 何時該選這條）、（b）該 route 之 next slice 最小可實作單元、（c）前置依賴、（d）此 route 之風險上限、（e）本輪明確**不**執行之事項。

**允許觸碰檔案**：

- 新增：`docs/<YYYYMMDD>-blog-next-phase-route-selection-preanalysis.md`（唯一 mutation）

**禁止觸碰檔案 / 動作**：與候選 1 相同（見上）。

**驗證方式**：

1. `git status --short` clean（新增檔外無他動）
2. `git diff --stat` 只顯示新增 doc
3. 目視審每條 route 之風險上限 / 前置依賴不虛構
4. 5 條 route 均有 explicit「本輪不執行」段落

**風險**：極低（docs-only；不決策，只分岔面）。

**caveat**：本候選**不**代 Dean 選 route；只提供選擇面。

---

### 候選 3（推薦 #3）— Blogger backfill write phase preflight（docs-only，不實寫）

**scope**：docs-only 落地一份 write-phase **前置準備 doc**，把 Blogger backfill 真正實寫前的**資料需求 + 影響檔面 + 驗收判準**先寫清楚（sidecar-first；`.publish.json` 為 canonical；per `docs/20260706-blogger-backfill-write-target-inventory.md`），但**本輪不實寫**：

- 每篇候選（7 篇 report-only missing）之目前狀態表
- Dean 需提供的真值（`publishedUrl` / `publishedAt` + optional `blogger.type` / note；`bloggerPostId` 屬 A.3 系統欄位不列必填）
- 每篇候選之 sidecar 目標路徑 + 目標 schema keys（僅 canonical `.publish.json`；`.md` frontmatter blogger block = legacy fallback、不建議寫入；per `docs/20260706-blogger-backfill-write-target-inventory.md`）
- 未來 write phase 之 acceptance：`check:blogger-backfill` 由 missing 7 / complete 0 逐篇轉為 complete；validate 0 error 不破；byte-identical `dist-blogger/` build（Dean 選跑）
- 明確排除：真值寫入 / 猜值 / 動 frontmatter / 動 `content/**`

**允許觸碰檔案**：

- 新增：`docs/<YYYYMMDD>-blogger-backfill-write-phase-preflight.md`（唯一 mutation）

**禁止觸碰檔案 / 動作**：

- ❌ 一切 §C-1 列出之禁區
- ❌ 補**任何** Blogger backfill 真值
- ❌ 動任何 `.publish.json` sidecar / frontmatter blogger block
- ❌ 動 Blogger 後台 / Google 後台

**驗證方式**：

1. `git status --short` clean（新增檔外無他動）
2. `git diff --stat` 只顯示新增 doc
3. 目視審：每篇候選之 sidecar 路徑必須指向現存 canonical 位置；不虛構新欄位
4. 明確標示「本輪不寫真值」
5. `bloggerPostId` 必列於 A.3 系統欄位，不列為 Dean 必填

**風險**：低。若日後 Dean 提供真值並啟動 write phase，屬**獨立** phase；write phase 自身另需 acceptance / guard baseline 對照。

---

### 候選 4（優先度 #4；僅在觀察到條件時觸發）— Blogger 實機發布頁 overflow 觀察 docs-only 紀錄

**觸發條件**：Dean 於**實機發布之 Blogger 頁面**（非 preview）再度觀察到水平捲軸，且 offender 屬 `.lab-blogger-article` 內專案元素。

**scope**：依 `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md` §7 Option A（已於 runbook §F landed）走一次 debug；docs-only 紀錄 offender element / `scrollWidth` / viewport / 跨平台是否復現 / 分類判定。

**允許觸碰檔案**：

- 新增：`docs/<YYYYMMDD>-blogger-mobile-overflow-live-page-observation.md`（唯一 mutation）

**禁止觸碰檔案 / 動作**：

- ❌ 一切 §C-1 列出之禁區
- ❌ 動 CSS / build / deploy / Blogger theme
- ❌ 動 GitHub Pages 輸出（若日後真需 Blogger-scope hardening，屬**另一** phase；強約束：不得改變已 live-accepted 之 GitHub Pages byte-identical 輸出）

**驗證方式**：

1. `git status --short` clean（新增檔外無他動）
2. offender element / selector / scrollWidth / viewport 均由 Dean DevTools 提供，Claude 不猜
3. 分類判定依 runbook §F-4 規則

**風險**：極低（純觀察 + docs-only 紀錄）。若無觸發條件，**不啟動**。

---

### 候選 5（推薦 #5；僅在 Dean 有意評估手動流程繁瑣度時觸發）— Blogger preview-only script Option B preanalysis（docs-only）

**scope**：docs-only 落地 Option B preview-only script 之 preanalysis：

- 為何目前 Option A（暫改 ready → build → 改回 → cleanup）足以 workaround，但未來若手動流程仍嫌繁瑣可考慮 Option B
- Option B 之最小 spec（隔離輸出 + `dist-blogger-preview/` gitignored + PREVIEW-ONLY 標記；build 不動 `dist-blogger/`）
- Option B 之風險上限（`build:blogger` 契約不動；不改 `classify` 單一事實來源；不放寬 draft 進正式 dist）
- 明確排除：本輪**不**新增 script、不改 `build:blogger`、不改 `classify`

**允許觸碰檔案**：

- 新增：`docs/<YYYYMMDD>-blogger-preview-only-script-option-b-preanalysis.md`（唯一 mutation）

**禁止觸碰檔案 / 動作**：

- ❌ 一切 §C-1 列出之禁區
- ❌ `src/scripts/**` 任一新 script 落地
- ❌ 改 `src/scripts/load-posts.js` `classify`
- ❌ 改 `src/scripts/build-blogger.js`
- ❌ 動 `.gitignore` 為 `dist-blogger-preview/` 開路（若日後 Option B 落地時再談）

**驗證方式**：

1. `git status --short` clean（新增檔外無他動）
2. `git diff --stat` 只顯示新增 doc
3. 目視審：spec 部分明確標示「未實作」、風險上限明確標示「`CLAUDE.md` §23 紅線不破」

**風險**：低（docs-only；不改 build 契約）。

---

## D. 建議下一個真正實作 session 只做哪一個最小切片

**建議：候選 1（Phase 1 RC handoff / operating readout）。**

**理由**：

1. **風險最低**：docs-only；未新增 script / guard；未動 `src/` / `content/` / `settings/` / `dist*/`；不需 Dean 提供新資料。
2. **順接 Phase 1 stability closeout**：RC note（`docs/20260708-phase1-stability-closeout-rc-note.md`）已把 sign-off 依據寫好；候選 1 只是把該 sign-off 落成可對外交接 / 未來 session cold-start 直讀之 handoff checklist，屬**自然收尾動作**。
3. **不需 Dean 決策**：不涉及選 route、不涉及 backfill 真值、不涉及觀察條件觸發；Dean 只需 explicit approval 即可啟動。
4. **為候選 2 / 3 / 4 / 5 鋪路**：handoff checklist 內明列各 out-of-scope 之前置條件後，Dean 未來要選 route（候選 2）或啟動 backfill preflight（候選 3）時，可直接從 checklist 進入，減少 session cold-start 開銷。
5. **對 CLAUDE.md 40000 chars 管控線友善**：docs-only 新增；本 session 未動 `CLAUDE.md`，仍保 39799 / 51658 headroom。

**明確排除**：

- 本 packet **不**代 Dean 啟動候選 1；候選 1 仍需 Dean **explicit approval** 才於**下一個 session** 執行。
- 候選 1 執行時**仍需**逐項對照本 doc §C-1 之「禁止觸碰檔案」清單，不擴大 scope。

**caveat**：若 Dean 之下一階段目標**明確**指向 Blogger backfill write（提供真值）或 second GitHub Pages deploy 或 domain / AdSense，本推薦可改採候選 2（route selection preanalysis）或候選 3（backfill preflight）作為第一切片；由 Dean 判定。

---

## E. 明確排除清單（本 packet 不做、本 session 不做、下一實作 session 也**不**在候選 1 scope 內）

- ❌ 修改 `src/**` / `views/**` / `scripts/**` / `content/**` / `settings/**` / `.cache/**` / `dist*/**` 任一檔案
- ❌ 修改 `package.json` / `package-lock.json` / lockfile
- ❌ build / preview / deploy / dev / push gh-pages（含 `build:github` / `build:blogger` / `build:promotion` / `build:sitemap` / `build:blogger-theme`）
- ❌ 執行 `validate:content` / `check:*` guard / regression check（除非先回報理由 + Dean 同意）
- ❌ 動 deploy clone（除本輪 boot 讀 git 狀態）
- ❌ 動 Blogger / AdSense / GA4 / Google Drive / Search Console 後台
- ❌ 進入 Admin write path（Apply / middleware / admin-write-cli / `--apply` / `dryRun:false`）
- ❌ Blogger repost / Blogger AdSense Batch 2 P2 live repost / reverse UTM pm-26 deploy
- ❌ 猜測 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt`
- ❌ 修改任何 content frontmatter 或 sidecar `.publish.json`
- ❌ 修改 `CLAUDE.md` / `MEMORY.md` / `memory/**`
- ❌ 購買網域 / 動 DNS / 動 GitHub Pages custom domain 設定 / 落地 `ads.txt` / `CNAME`
- ❌ Phase 2 功能（後台登入 / 視覺編輯器 / Blogger API / Drive API / View 數 / 讚 / 留言 / 全文搜尋 / DB）
- ❌ CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填

---

## F. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔。**不含**任何程式 / frontmatter / settings / build / deploy / dev-server 變更；未新增 guard / npm script；未修 CSS；未改 `CLAUDE.md` / `MEMORY.md` / `memory/`；未觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages / 未發布 Blogger；未新增測試文章 / artifact；未購買網域 / 未動 DNS / 未碰 AdSense / GA4 / Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`。§0 boot baseline 為 read-only 驗證；§A 之 Phase 1 stability closeout 狀態摘要為對既有 result / RC docs 之盤點結論，未代替 Dean 宣告新 PASS；§B dormant / blocked / report-only 項目盤點沿用既有 status；§C 候選皆為建議，**未**實作；§D 建議推薦下一切片，仍需 Dean explicit approval 才於**下一個 session** 執行；§E 明確排除清單為本 packet 與下一實作 session 之 scope 界線。

---

## See also

- `docs/20260708-phase1-stability-closeout-rc-note.md`（Phase 1 stability closeout RC note；本 packet §A / §D 引用）
- `docs/20260708-phase1-stability-readiness-inventory.md`（Phase 1 穩定測試就緒盤點；readiness umbrella 起源）
- `docs/20260708-phase1-p1-followup-closeout-inventory.md`（第二次 E2E 之 P1/P2 follow-up closeout inventory）
- `docs/20260708-phase1-second-manual-e2e-result.md`（第二次人工 E2E；P1/P2 follow-up 分級來源）
- `docs/20260708-phase1-third-manual-smoke-result.md`（第三次小型人工 smoke；P1-1 verified resolved、P1-2 verified usable、P1-3 downgraded）
- `docs/20260708-blogger-draft-preview-runbook.md`（Blogger draft-preview 6 步可重複流程；§F Blogger mobile preview overflow debug）
- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（P1-2 build eligibility 盤點 / Option A/B/C 決策；候選 5 引用 Option B）
- `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md`（P1-3 audit / 9 類假說；候選 4 觸發條件）
- `docs/20260708-domain-github-pages-adsense-decision.md`（domain / AdSense 時機決策；§8 觸發條件 / §9 缺項；候選 1 交接內容源）
- `docs/20260708-adsense-source-evidence-audit.md`（AdSense 官方來源稽核；§6 正式申請前確認清單；候選 1 交接內容源）
- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger identity 分層 / 不猜 ID；候選 3 policy 來源）
- `docs/20260706-blogger-backfill-write-target-inventory.md`（Blogger backfill write target inventory；候選 3 sidecar 路徑來源）
- `docs/20260706-blogger-backfill-report-only-baseline.md`（Blogger backfill report-only baseline）
- `docs/20260707-release-readiness-runbook.md` / `docs/20260707-release-readiness-docs-index.md`（release-readiness umbrella 家族）
- `docs/20260703-post-c1-next-deploy-candidates.md`（post-first-deploy candidate roster；low=0 / medium=1 / blocked=12）
- `docs/20260705-post-e-next-line-inventory-excluding-admin-ui.md`（post-E next-line inventory；本 packet §B 引用 dormant / blocked 分類）
- `docs/20260705-blogger-continuation-next-line-inventory.md`（Blogger continuation next-line inventory；本 packet §B / §C-3 引用）
- `docs/20260702-phase1-manual-e2e-runbook.md`（第一次人工 E2E：github-site happy-path PASS）
- `docs/phase-1-completion-report.md` / `docs/phase-1-completion-checklist.md`（Phase 1 functional final 2026-05-18 宣告）
- `docs/20260617-blog-phase1-wrapup-status-map.md`（收尾路線圖 A/B/C/D/E 各線）
- `CLAUDE.md` §3a Current state snapshot（Phase 1 current state / first GitHub Pages deploy milestone / ADMIN idle freeze / dormant summary / Red lines / Recommended next paths）
- `CLAUDE.md` §5（分階段）、§21（SEO / canonical / primaryPlatform）、§23（發布狀態；draft 不得進正式 dist）、§26（package.json 指令）、§27（Claude Code 修改規則）、§28（MVP 必做）、§29（第一版不做）
- `memory/project_baseline.md`（frozen source / deploy baseline）
- `memory/project_admin_write_path_status.md`（Admin write path dormant）
- `memory/project_reverse_utm_status.md`（pm-24a/b/c source landed；pm-26 deploy BLOCKED）

---

（本文件結束 / end of document）
