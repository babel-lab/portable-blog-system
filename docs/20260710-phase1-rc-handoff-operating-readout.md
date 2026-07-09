# Phase 1 RC handoff / operating readout（docs-only）

- 建立日期：2026-07-10（Asia/Taipei）
- 類型：docs-only **handoff checklist / operating readout**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 目的：把 Phase 1 stability closeout RC note（`docs/20260708-phase1-stability-closeout-rc-note.md`）落地為一份**對外可交接、可操作、可讀**的 handoff checklist，作為後續 Phase 2 工作啟動前的 operating readout。任何 session cold-start 只讀本檔 + §1 boot baseline 應可完成上下文重建。
- 對應觸發：`docs/20260709-blog-phase2-next-work-packet.md` §C 候選 1（推薦 #1）＋ Dean 明確啟動指令。
- 本輪界線（docs-only）：**不** build / **不** preview / **不** deploy / **不**跑 validate:content / **不**跑 check:* guard / **不**碰 Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 / **不**進 Admin write path / **不** Blogger repost / **不** reverse UTM deploy / **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / **不**改任何 frontmatter / **不**改任何 sidecar `.publish.json` / **不**動 deploy clone。

---

## 1. Frozen baseline（session cold-start 必讀）

Source repo（`/d/github/blog-new/portable-blog-system`）：

| 欄位 | 值 |
| --- | --- |
| branch | `main` |
| HEAD | `1480ede5b336ec2b9eee1556bd0607f40ab47206`（`1480ede`） |
| subject | `docs(state): record blog phase2 next work packet` |
| == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |

Deploy clone（`/d/github/blog-new/portable-blog-deploy`；本輪僅讀 git 狀態，未寫入）：

| 欄位 | 值 |
| --- | --- |
| branch | `gh-pages` |
| HEAD | `1170e7e14aaa7f3449999bf92b9c8586719a76b4`（`1170e7e`） |
| subject | `deploy(github): publish first verified github pages scope` |
| == origin/gh-pages | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |

判定：boot baseline 完全符合 frozen baseline；deploy clone 本輪未寫入。**下一 session 進場後應先重跑 §3a Baseline verify 標準 7 步，數值應完全等於本表**（除本檔 commit 之後 HEAD 已更新）。

---

## 2. Phase 1 已完成項目摘要（sign-off 依據）

以下為 Phase 1 sign-off 之依據；**皆為 carry-forward 狀態**，本輪未重跑 guard、未新增宣告。

### 2.1 功能面（Phase 1 §28 MVP 17 條）

| # | 項目 | 狀態 | 依據 |
| --- | --- | --- | --- |
| 1 | 專案資料夾結構 | ✅ | `CLAUDE.md` §8 |
| 2 | `README.md` | ✅ | repo root |
| 3 | `CLAUDE.md` | ✅ | repo root |
| 4 | docs 文件家族 | ✅ | `docs/` |
| 5 | settings JSON | ✅ | `content/settings/` |
| 6 | Markdown 範例文章 | ✅ | `content/github/posts/`、`content/blogger/posts/` |
| 7 | GitHub 首頁 / 列表 / 詳細 / 分類 / 標籤頁 | ✅ | `src/views/` |
| 8 | Blogger full / summary 匯出 | ✅ | `build:blogger` |
| 9 | Blogger copy-helper / checklist | ✅ | `dist-blogger/posts/<slug>/` |
| 10 | Blogger design token CSS 匯出 | ✅ | `build:blogger-theme` |
| 11 | FB promotion txt 匯出 | ✅ | `build:promotion` |
| 12 | Design System 基礎頁 | ✅ | `/design-system/` |
| 13 | SCSS tokens / themes / components | ✅ | `src/styles/` |
| 14 | Sticky Header / Mobile Drawer / Back to Top | ✅ | `src/js/modules/` |
| 15 | link processor | ✅ | `src/scripts/link-processor.js` |
| 16 | GA4 event data attributes | ✅ | live 2026-05-21 起 |
| 17 | sitemap.xml / robots.txt | ✅ | `build:sitemap` |

**6/6 article block parity**（Blogger ↔ GitHub）／`we-media-myself2` 端對端 ／ sitemap + robots + JSON-LD 全 PASS，皆屬 Phase 1 final 之範圍。

### 2.2 內容面（線上已 deploy）

- **First GitHub Pages deploy** ✅（2026-07-03，deploy commit `1170e7e`）
  - live: `https://babel-lab.github.io/portable-blog-system`
  - scope: 3 github-native（`what-is-design-token` / `github-pages-build-preview-workflow` / `portable-blog-system-mvp`）+ 1 blogger-cross mirror（`we-media-myself2`）
  - quarantine 生效：`github-pages-blog-planning` flip draft（`94385b1`）→ online **404**、orphan / stale / canary absent
- **P3 Blogger post live verified** ✅（2026-06-17，Dean 截圖佐證）：`blog-restart-steady-rhythm-notes`；bloggerPostId 尚未回填、Claude 未登入 Blogger
- **GA4 production live** ✅（`G-C77SMPF8VD`，2026-05-21 起；GA4 P1 `article_bottom_nav` report verified 2026-06-15 17:35）

### 2.3 Validation baseline（carry-forward；regression 對照本表）

| 指令 | 結果 |
| --- | --- |
| `validate:content` | 0 error / 135 warning / 107 post |
| `check:npm-script-targets` | 47/47 PASS（`docs/20260709-blog-phase2-next-work-packet.md` §B-1b 記 48/48；per RC note §B-1b「48/48 PASS（47 targets）」；差異為 npm-alias 與 target 數之計數差）|
| `check:admin-markdown-export` | 256/256 PASS |
| `check:adsense-mode-metadata` | scanned 17 / legacy 17 / valid 0 / warnings 0（report-only） |
| `check:blogger-backfill` | scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5（report-only） |
| `check:github-pages-prepublish` | 16/16 PASS（source 8 + deploy clone 8；純讀 git，不 build/deploy/fetch/pull） |
| `check:github-pages-prepublish-smoke` | 8/8 PASS（happy-path + 7 failure detection；OS temp repo 自動清除） |
| `check:phase1-readiness-contract` | 22/22 PASS（per RC note §B-2） |
| `check:release-readiness-contract` | 14/14 PASS（含 5-fragment order lock；per `memory/project_report_only_metadata_guards.md`）|
| `check:validation-report` | 27/0 |
| `check:metadata-all` | umbrella；5 single-field + 3 cross-field 皆 warning-only |

**production expected warning = 1**（`page-noindex-in-listings` @ `content/github/posts/20260504-portable-blog-system-mvp.md`；legacy download listing intentional hold；warning-only；詳 `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`）；其餘 warnings 全來自 `content/validation-fixtures/`。

---

## 3. Phase 1 final / RC / readiness / manual smoke / first GitHub Pages deploy 狀態

依時間軸整理 Phase 1 sign-off 各 milestone：

| 日期 | Milestone | 結論 | 依據 |
| --- | --- | --- | --- |
| 2026-05-18 | **Phase 1 functional final 宣告** | ✅ landed | `docs/phase-1-completion-report.md`、`docs/phase-1-completion-checklist.md` |
| 2026-05-21 | GA4 production live | ✅ | `G-C77SMPF8VD` |
| 2026-06-15 | GA4 P1 `article_bottom_nav` report verified | ✅ | Dean 手動 GA4 觀察 |
| 2026-06-17 | P3 Blogger post live verified | ✅ | `blog-restart-steady-rhythm-notes` |
| 2026-07-02 | **第一次人工 E2E（github-site happy-path）** | ✅ PASS | `docs/20260702-phase1-manual-e2e-runbook.md` |
| 2026-07-03 | **First GitHub Pages deploy** + online verified | ✅ | deploy `1170e7e`；live `https://babel-lab.github.io/portable-blog-system` |
| 2026-07-08 | **第二次人工 E2E（blogger-site draft-preview 鏈路）** | ✅ PASS with P1/P2 follow-up | `docs/20260708-phase1-second-manual-e2e-result.md` |
| 2026-07-08 | **第三次小型人工 smoke** | ✅ PASS with P2 follow-up | `docs/20260708-phase1-third-manual-smoke-result.md` |
| 2026-07-08 | **Phase 1 stability closeout / RC note** | ✅ **RC-ready for manual workflow** | `docs/20260708-phase1-stability-closeout-rc-note.md` §F |
| 2026-07-09 | Phase 2 next-work packet | ✅ scoped（5 候選）| `docs/20260709-blog-phase2-next-work-packet.md` |
| 2026-07-10 | 本檔（Phase 1 RC handoff / operating readout） | ✅ landed | 本檔 |

### 3.1 RC decision（複製自 RC note §F）

| 判定項 | 結論 |
| --- | --- |
| Phase 1 can continue stability testing | **yes** |
| Phase 1 can be considered RC-ready for manual workflow | **yes**（穩定收尾狀態） |
| Blocking issues（P0） | **none** |
| Non-blocking follow-ups | 見 §3.2 |

### 3.2 Follow-up status（複製自 RC note §D）

| # | Item | Status | 依據 |
| --- | --- | --- | --- |
| P1-1 | Admin Blogger Export per-post paths | **Resolved** | commit `38a4e98`（`src/views/admin/index.ejs`）+ 第三次 smoke §D 5/5 PASS |
| P1-2 | `build:blogger` draft eligibility | **Documented / accepted** | `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（Option A 決策）＋ `docs/20260708-blogger-draft-preview-runbook.md`（可重複 6 步）；`build:blogger` 不輸出 draft 為正確設計（`CLAUDE.md` §23 紅線） |
| P1-3 | Blogger Preview horizontal scrollbar | **Downgraded to P2 / likely external Blogger preview artifact** | 第三次 smoke §E-3：實機發布手機版未復現；offender `div.Rcpctd` 非 `.lab-blogger-article` 內元素；若日後**實機頁**再度出現，須立即依 runbook §F 重新分類、**不**逕自視為 external artifact |
| P2-1 | Fake cover / metadata warning | **Documented / accepted** | 測試資料問題、非系統缺陷；runbook §D-4 / §E 已規範正式文章使用有效 cover |
| P0 | — | **none** | 三次人工測試皆未發現 |

### 3.3 RC 判定之邊界

**RC 判定屬「開發線 / 內部 sign-off」**，涵蓋：

- ✅ repo 內 read-only guard 全綠燈
- ✅ Dean 既有人工驗收（三次 E2E / smoke）
- ✅ First GitHub Pages deploy 線上驗證 PASS

**不涵蓋**（見 §4.1 blocked、§4.3 out-of-scope）：

- ❌ custom domain 啟用 / 品牌字串鎖定
- ❌ 正式 AdSense serving 驗證（後台實測 serving、ads.txt 落地）
- ❌ GA4 後台調整（D4 dim expansion、custom event 增修）
- ❌ Blogger 正式營運發文（含 P2 / P3 live repost、Batch 2、AdSense Batch 2 live repost）
- ❌ Blogger 後台任何寫入 / 讀取（Claude 從未登入 Blogger）

---

## 4. 仍 dormant / blocked / report-only 的項目

### 4.1 Blocked（含 forbidden by Claude）

| 項目 | 狀態 | 說明來源 |
| --- | --- | --- |
| Blogger 後台 login / post / repost / update / delete / draft flip / template edit / URL 設定 / 標籤設定 / 圖片上傳 | 🔴 forbidden（by Claude） | `CLAUDE.md` §3a Red lines / §29 |
| Guess Blogger `publishedUrl` / `bloggerPostId` / `publishedAt` | 🔴 forbidden | `CLAUDE.md` §3a；`docs/20260706-blogger-identity-and-backfill-strategy.md` |
| Blogger AdSense Batch 2 P2 live repost（`ai-tools-simplify-daily-workflow`） | 🔴 BLOCKED | 至 explicit approval |
| Reverse UTM Blogger → GitHub deploy（pm-26 gate） | 🔴 BLOCKED / dormant | source landed `7e1d356` / `e2309e9` / `7c769fe`（2026-05-23）；live dormant |
| Custom domain / DNS / GitHub Pages custom domain 設定 | 🔴 out of Phase 1 scope | `docs/20260708-domain-github-pages-adsense-decision.md` §7–§9 |
| AdSense formal application / serving verification | 🔴 out of Phase 1 scope | `docs/20260708-adsense-source-evidence-audit.md` §6 |
| GA4 dashboard / D4 dimension expansion / Search Console 後台 | 🔴 forbidden（by Claude） | Dean-provided masked evidence only |
| Second GitHub Pages deploy（含新 push gh-pages / 更新 `dist/`） | 🔴 out of Phase 1 scope | low-risk candidate = 0；各篇 Dean-gated |
| `github-pages-blog-planning` quarantine 解除 | 🔴 hold（by design） | `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md` |
| Admin write path（Apply / middleware / admin-write-cli / `--apply` / `dryRun:false`） | 🔴 dormant | `memory/project_admin_write_path_status.md` |
| FB sidecar 真實寫入 | ⏸ dormant | 待 Dean 勾選 8 項 preflight |
| Phase 2 功能（後台登入 / 視覺編輯器 / Blogger API / Drive API / View 數 / 讚 / 留言 / 全文搜尋 / DB） | 🔴 第一版永禁 | `CLAUDE.md` §29 |
| Phase 1 final 之降級 / 重新封存 | 🔴 永禁 | `CLAUDE.md` §3a Core operating rules |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | 🔴 永禁 | `CLAUDE.md` §3a Historical ledger replacement rule |

### 4.2 Report-only guards（warning-only，不阻擋 build）

| Guard | Scope | 狀態 |
| --- | --- | --- |
| `check:blogger-backfill` | Blogger backfill 完整度 | report-only；candidates 7 / complete 0 / missing 7；bloggerPostId 屬系統欄位不列必填 |
| `check:adsense-mode-metadata` | AdSense mode metadata | scanned 17 / legacy 17 / valid 0 / warnings 0 |
| `check:content-type-metadata` / `check:campaign-purpose-metadata` / `check:campaign-industry-metadata` / `check:custom-promo-metadata` | 5 支 single-field metadata guard | 皆 warning-only；聚合於 `check:metadata-guards` |
| `check:metadata-cross-fields` | 3 支 cross-field guard | 皆 warning-only；聚合於 `check:metadata-cross-fields` |
| `check:metadata-all` | metadata suite umbrella | report-only；聚合上兩者 |
| `check:validation-report` | validation report guard | 27/0（carry-forward） |

### 4.3 Deferred（非 Phase 1 blocker；未來可另開 phase）

| 項目 | 狀態 |
| --- | --- |
| Blogger draft preview-only script（Option B；隔離輸出 `dist-blogger-preview/` + gitignored + PREVIEW-ONLY 標記） | deferred（`docs/20260708-blogger-draft-preview-export-eligibility-inventory.md` §7 Option B） |
| Blogger-only CSS scope hardening（若日後**實機發布頁**再現水平捲軸） | deferred（`docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md` §7 Option B；未達觸發條件） |
| Admin richer fields / ready option / R2+ / loader migration | deferred（`CLAUDE.md` §3a ADMIN idle freeze） |
| Blogger backfill write phase | deferred；待 Dean 提供 `publishedUrl` / `publishedAt` + optional note；`bloggerPostId` 系統欄位不列必填 |
| GitHub Pages second deploy 各 Dean-gated 候選 | deferred（每篇獨立 phase） |
| Commerce C7 / C9 broader expansion | deferred |
| Commerce L2 / L3 / L4 新 candidates | 🔴 BLOCKED；須 user-provided YAML + explicit approval |
| Download Admin picker / renderer / Forms 串接 / content migration | deferred |
| Reverse UTM Blogger → GitHub pm-26 deploy | dormant（source landed；未 deploy） |
| GA4 P2 / P3 dimension expansion / D4 broader | deferred |

---

## 5. Phase 2 啟動前 checklist（handoff checklist）

**每一項須在 Phase 2 任何 real-implementation slice 啟動前 read-only 對照。若有一項不符，須先修正、不得啟動 Phase 2 phase。**

### 5.1 Baseline gate（必過）

- [ ] source `pwd` = `/d/github/blog-new/portable-blog-system`
- [ ] source branch = `main`
- [ ] source HEAD == `origin/main`
- [ ] source ahead/behind = `0 / 0`
- [ ] source working tree clean
- [ ] source `.git/index.lock` absent
- [ ] deploy clone branch = `gh-pages`
- [ ] deploy clone HEAD == `origin/gh-pages`
- [ ] deploy clone ahead/behind = `0 / 0`
- [ ] deploy clone working tree clean
- [ ] deploy clone `.git/index.lock` absent

### 5.2 Docs gate（必過；session cold-start 應直讀）

- [ ] `CLAUDE.md` §3a Current state snapshot（Phase 1 current state / first GitHub Pages deploy milestone / ADMIN idle freeze / dormant summary / Red lines / Recommended next paths）
- [ ] 本檔 §1（frozen baseline）→ §4（dormant / blocked / report-only）
- [ ] `docs/20260708-phase1-stability-closeout-rc-note.md`（RC sign-off 依據）
- [ ] `docs/20260709-blog-phase2-next-work-packet.md` §C（候選切片面）
- [ ] `MEMORY.md` index + 相關 memory 檔（`project_baseline.md` / `project_report_only_metadata_guards.md` / `project_admin_write_path_status.md` / `project_reverse_utm_status.md` / `project_commerce_status.md` / `feedback_phase_discipline.md`）

### 5.3 Session rules gate（必過；每個 phase 各自 explicit approval）

- [ ] Phase 2 slice 已由 Dean **explicit approval** 啟動（不得依候選 packet 自行啟動）
- [ ] Phase 2 slice scope 未觸 §4.1 blocked / forbidden 清單
- [ ] Phase 2 slice 屬 docs-only / source-only / memory-sync-only 之**單一**類型（`feedback_phase_discipline.md`：三類 phase 不得重疊）
- [ ] Phase 2 slice 未動 `CLAUDE.md` / `MEMORY.md` / `memory/**`（除非該 phase 明訂為 memory-sync）
- [ ] Phase 2 slice 未跑 build / preview / deploy（除非該 phase 明訂）
- [ ] Phase 2 slice 未跑 validate:content / check:* guard（除非該 phase 明訂 regression check）
- [ ] Phase 2 slice 未動 Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台
- [ ] Phase 2 slice 未進 Admin write path / Blogger repost / reverse UTM deploy
- [ ] Phase 2 slice 未猜任何 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt`
- [ ] Phase 2 slice 未動 frontmatter / sidecar `.publish.json`（除非 Dean 提供真值 + explicit approval）

### 5.4 Post-slice sign-off gate（各 slice 收尾必過）

- [ ] slice 完成後 source working tree clean（新增檔外無他動）
- [ ] slice 完成後 source `.git/index.lock` absent
- [ ] slice 完成後 source main == origin/main（若 slice 允許 push）
- [ ] slice 完成後 deploy clone 未動（除非 slice 明訂 deploy）
- [ ] slice 完成後 ledger 寫到 `docs/<date>-<phase>.md`、**不**回寫 `CLAUDE.md` 大型 ledger
- [ ] slice 完成後 `CLAUDE.md` 若需極小 sync（validation 數值 / live inventory / Phase status）僅在必要時 sync、size `wc -m` 保持 < 40000 chars
- [ ] slice 完成後 若有新 dormant / blocked 狀態，同步至 `MEMORY.md` + 對應 memory 檔

---

## 6. 後續候選切片啟動條件

以下候選皆**已於 `docs/20260709-blog-phase2-next-work-packet.md` §C scope-out**；本檔僅補「啟動條件」與「前置文件入口」，便於 Dean 判斷何時可推進哪條路徑。

**推薦順序 = 候選 A → B → C → D → E**（等同 packet §C 之 1 → 2 → 3 → 4 → 5，去掉本檔對應之候選 1）。

### 候選 A（原 packet 候選 2）— Phase 1 RC → next-phase 決策入口 preanalysis（docs-only）

- **觸發條件**：Dean 需在多條路徑間做 route selection、但不想馬上進實作。
- **允許 mutation**：新增 `docs/<YYYYMMDD>-blog-next-phase-route-selection-preanalysis.md`（唯一）。
- **前置**：本檔（Phase 1 RC handoff readout）已 landed。
- **主要引用**：packet §C-2；本檔 §4；`docs/20260708-domain-github-pages-adsense-decision.md`；`docs/20260708-adsense-source-evidence-audit.md`；`docs/20260706-blogger-identity-and-backfill-strategy.md`；`docs/20260706-blogger-backfill-write-target-inventory.md`。
- **風險上限**：極低（docs-only；不決策，只分岔面）。
- **本輪明確不執行**：任何 route 之實作 / build / deploy / 後台動作。

### 候選 B（原 packet 候選 3）— Blogger backfill write phase preflight（docs-only，不實寫）

- **觸發條件**：Dean 準備進 Blogger backfill write phase、需先 scope 資料需求 + 影響檔面 + 驗收判準。
- **允許 mutation**：新增 `docs/<YYYYMMDD>-blogger-backfill-write-phase-preflight.md`（唯一）。
- **前置**：Dean 於未來（本 phase 之後）提供 `publishedUrl` / `publishedAt` + optional note（`bloggerPostId` 屬 §4.2 系統欄位、不列必填）；本 preflight phase 不需真值 in-hand。
- **主要引用**：`docs/20260706-blogger-backfill-write-target-inventory.md`（canonical = `.publish.json` sidecar；frontmatter blogger block = legacy fallback 不建議寫入）；`docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger identity 分層 policy）；`docs/20260706-blogger-backfill-report-only-baseline.md`。
- **風險上限**：低（docs-only；write phase 自身另開 phase + 另需 acceptance / guard baseline 對照）。
- **本輪明確不執行**：補任何 backfill 真值 / 猜值 / 動 frontmatter / 動 `content/**` / 動任何 `.publish.json` sidecar。

### 候選 C（原 packet 候選 4）— Blogger 實機發布頁 overflow 觀察 docs-only 紀錄

- **觸發條件**：Dean 於**實機發布之 Blogger 頁面**（非 preview）再度觀察到水平捲軸，且 offender 屬 `.lab-blogger-article` 內專案元素。**若無觸發條件，不啟動。**
- **允許 mutation**：新增 `docs/<YYYYMMDD>-blogger-mobile-overflow-live-page-observation.md`（唯一）。
- **前置**：Dean DevTools 觀察 offender element / selector / `scrollWidth` / viewport。
- **主要引用**：`docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md` §7 Option A / §F-4 判斷規則；`docs/20260708-blogger-draft-preview-runbook.md` §F。
- **風險上限**：極低（純觀察 + docs-only；CSS 變更屬**另**一獨立 phase；強約束：不得改變已 live-accepted 之 GitHub Pages byte-identical 輸出）。
- **本輪明確不執行**：動 CSS / build / deploy / Blogger theme。

### 候選 D（原 packet 候選 5）— Blogger preview-only script Option B preanalysis（docs-only）

- **觸發條件**：Dean 有意評估手動 Blogger draft-preview 流程繁瑣度、考慮長期是否值得引入 preview-only script。
- **允許 mutation**：新增 `docs/<YYYYMMDD>-blogger-preview-only-script-option-b-preanalysis.md`（唯一）。
- **前置**：無（純設計層 preanalysis）。
- **主要引用**：`docs/20260708-blogger-draft-preview-export-eligibility-inventory.md` §7 Option B；`docs/20260708-blogger-draft-preview-runbook.md`；`CLAUDE.md` §23（draft 不得進正式 dist 之紅線）。
- **風險上限**：低（docs-only；不改 build 契約）。
- **本輪明確不執行**：新增 script / 改 `build:blogger` / 改 `src/scripts/load-posts.js` `classify` / 動 `.gitignore` 為 `dist-blogger-preview/` 開路。

### 候選 E（延伸）— custom domain / AdSense 觸發條件 checklist（docs-only）

- **觸發條件**：Dean 明確判斷「準備讓 GitHub Pages 站本身認真累積 SEO 權重 / 認真變現」時。
- **允許 mutation**：新增 `docs/<YYYYMMDD>-custom-domain-adsense-trigger-checklist.md`（唯一）。
- **前置**：本檔 §4.1「custom domain / AdSense formal application」仍為 blocked 之狀態未改變（本 phase 不改）。
- **主要引用**：`docs/20260708-domain-github-pages-adsense-decision.md` §7–§9；`docs/20260708-adsense-source-evidence-audit.md` §6；`docs/custom-domain-root-files-strategy.md`；`docs/content-platform-routing.md` §5。
- **風險上限**：極低（docs-only；不買網域 / 不動 DNS / 不建 ads.txt / CNAME / 不碰 AdSense·GA4·GSC 後台 / 不 deploy）。
- **本輪明確不執行**：購買網域、動 DNS、動 GitHub Pages custom domain 設定、落地 `ads.txt` / `CNAME`、Blogger / AdSense / GA4 / GSC 後台任何動作。

---

## 7. 明確禁止誤啟動的項目（session cold-start 必讀 red-line）

**下列動作 Claude 於任何 phase 均不得自行執行**（除非該 phase 明訂 + Dean explicit approval，且本檔 §5.3 gate 全過）：

- ❌ `git push` / `git push --force` / `git rebase` / `git reset --hard` / `git amend` / `git cherry-pick` / `git merge`
- ❌ 跳過 hooks（`--no-verify`）/ bypass signing（`--no-gpg-sign`）
- ❌ `npm install` / 動 `package.json` / `package-lock.json` / lockfile
- ❌ `npm run build` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap` / `build:blogger-theme` / `preview` / `dev` / deploy / push gh-pages / 動 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`
- ❌ 重跑 `validate:content` / `check:*` guard / regression check（除非該 phase 明訂）
- ❌ 動 `src/**` / `views/**` / `scripts/**` / `content/**` / `settings/**` / `.cache/**`
- ❌ 動 `CLAUDE.md` / `MEMORY.md` / `memory/**`（除非該 phase 是 memory-sync）
- ❌ Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台任何操作（Claude 從未登入任何 Google / Blogger 後台）
- ❌ 猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt`（`CLAUDE.md` §3a Red lines）
- ❌ 動任何 frontmatter / 任何 sidecar `.publish.json`（除非該 phase 明訂 + Dean 提供真值）
- ❌ Admin write path（Apply / middleware / admin-write-cli / `--apply` / `dryRun:false`）
- ❌ Blogger repost / Blogger AdSense Batch 2 P2 live repost / reverse UTM pm-26 deploy / `github-pages-blog-planning` 解除 quarantine
- ❌ Second GitHub Pages deploy（含新 push gh-pages / 更新 `dist/`）
- ❌ Phase 1 final 之降級 / 重新封存
- ❌ CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填（`CLAUDE.md` §3a Historical ledger replacement rule）
- ❌ Real AdSense `client id` / `slot id` 出現於 `docs/` / `CLAUDE.md` / `src/` / `views/` / `tests/` / `package.json` / 任何 frontmatter / 任何 ledger（`CLAUDE.md` §3a Red lines：real IDs 只存於 `content/settings/ads.config.json`）
- ❌ Public docs 出現完整 measurement ID / 完整 AdSense ID
- ❌ Phase 2 功能（後台登入 / 視覺編輯器 / Blogger API / Drive API / View 數 / 讚 / 留言 / 全文搜尋 / DB；`CLAUDE.md` §29）
- ❌ 引入 React / Vue / Astro / Next.js / Nuxt / Tailwind / 後端資料庫 / 會員系統（`CLAUDE.md` §4）
- ❌ 為 fixture 修改 production `affiliate-networks.json`（`CLAUDE.md` §3a Red lines）
- ❌ commerce registry 含 dashboard credentials / token / commission / payout / 帳號 email / 結算密碼 / 私人 Drive folder ID
- ❌ download registry 含 respondent data / token / API key / OAuth secret / 帳號 email / private permission / 私人 Drive folder ID

---

## 8. 下一 session 建議入口

**推薦入口（依 Dean 目標分岔）**：

| Dean 目標 | 推薦入口 slice | 推薦順序 |
| --- | --- | --- |
| 「先不決策，但想看清下一步分岔面」 | 候選 A（Phase 1 RC → next-phase 決策入口 preanalysis） | #1 |
| 「準備進 Blogger backfill write，但先想 scope 出資料需求」 | 候選 B（Blogger backfill write phase preflight） | #2 |
| 「實機發布 Blogger 頁再現水平捲軸」 | 候選 C（overflow observation） | #3（僅在觸發條件命中時） |
| 「想長期評估 Blogger draft-preview 流程繁瑣度」 | 候選 D（Blogger preview-only script Option B preanalysis） | #4 |
| 「準備讓 GitHub Pages 站累積 SEO / 變現」 | 候選 E（custom domain / AdSense 觸發條件 checklist） | #5 |
| 「不想推進、繼續觀察」 | idle freeze | 保守路徑（`CLAUDE.md` §3a Recommended next paths） |

**session cold-start 檢查清單**（依序）：

1. 跑 §3a Baseline verify 7 步（`pwd` / branch / status / HEAD / origin / ahead-behind / log -5）；對照本檔 §1。
2. 讀 `MEMORY.md` index；如需要，讀 §5.2 列出之對應 memory 檔。
3. 讀 `CLAUDE.md` §3a Current state snapshot（含 Red lines / Recommended next paths）。
4. 讀本檔 §3.1 RC decision / §3.2 follow-up status / §4 dormant summary。
5. 讀 Dean 之啟動指令：確認屬**上表某條**候選 A–E 或 idle freeze；若不屬任一，先向 Dean 澄清。
6. 對照本檔 §5.3 Session rules gate + §7 red-line；每項均過再進實作。
7. slice 結束時對照本檔 §5.4 Post-slice sign-off gate。

**session cold-start 必讀入口清單（極精簡）**：

- `CLAUDE.md`（尤其 §3a、§23、§27、§28、§29）
- 本檔（`docs/20260710-phase1-rc-handoff-operating-readout.md`）
- `docs/20260708-phase1-stability-closeout-rc-note.md`（RC sign-off 依據）
- `docs/20260709-blog-phase2-next-work-packet.md`（Phase 2 候選 packet）
- `MEMORY.md` + `memory/project_baseline.md` + `memory/feedback_phase_discipline.md`

---

## 9. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔。**不含**任何程式 / frontmatter / settings / build / deploy / dev-server 變更；未新增 guard / npm script；未修 CSS；未改 `CLAUDE.md` / `MEMORY.md` / `memory/`；未觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages；未發布 Blogger；未新增測試文章 / artifact；未購買網域 / 未動 DNS / 未碰 AdSense / GA4 / Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`；未猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt`。§1 boot baseline 為 read-only 驗證；§2 已完成項目摘要為對既有 Phase 1 final 宣告與 RC note 之盤點結論，未代替 Dean 宣告新 PASS；§3 milestone / RC decision / follow-up status 均複製自既有 result / RC docs，未新增新宣告；§4 dormant / blocked / report-only 沿用既有 status；§5 checklist 為對 `CLAUDE.md` §3a Core operating rules 與既有 memory / feedback discipline 之整理；§6 候選啟動條件複用 packet §C 之 scope，僅補入口引用；§7 red-line 複製自 `CLAUDE.md` §3a Red lines + §4 + §29；§8 建議入口為建議、不代 Dean 決策。

---

## See also

- `docs/20260708-phase1-stability-closeout-rc-note.md`（Phase 1 stability closeout RC note；本檔 §2 / §3 / §7 sign-off 依據來源）
- `docs/20260708-phase1-stability-readiness-inventory.md`（Phase 1 穩定測試就緒盤點；readiness umbrella 起源）
- `docs/20260708-phase1-p1-followup-closeout-inventory.md`（P1/P2 follow-up closeout inventory）
- `docs/20260708-phase1-second-manual-e2e-result.md`（第二次人工 E2E；P1/P2 follow-up 分級來源）
- `docs/20260708-phase1-third-manual-smoke-result.md`（第三次小型人工 smoke；P1-1 verified resolved、P1-2 verified usable、P1-3 downgraded）
- `docs/20260708-blogger-draft-preview-runbook.md`（Blogger draft-preview 6 步可重複流程；§F Blogger mobile preview overflow debug）
- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（P1-2 build eligibility 盤點 / Option A/B/C 決策；候選 D 引用 Option B）
- `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md`（P1-3 audit / 9 類假說；候選 C 觸發條件）
- `docs/20260708-domain-github-pages-adsense-decision.md`（domain / AdSense 時機決策；§7–§9；候選 E 內容源）
- `docs/20260708-adsense-source-evidence-audit.md`（AdSense 官方來源稽核；§6 正式申請前確認清單；候選 E 內容源）
- `docs/20260709-blog-phase2-next-work-packet.md`（Phase 2 next-work packet；候選 A–E 對應 §C-2 → §C-5）
- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger identity 分層 / 不猜 ID；候選 B policy 來源）
- `docs/20260706-blogger-backfill-write-target-inventory.md`（Blogger backfill write target inventory；候選 B sidecar 路徑來源）
- `docs/20260706-blogger-backfill-report-only-baseline.md`（Blogger backfill report-only baseline）
- `docs/20260702-phase1-manual-e2e-runbook.md`（第一次人工 E2E：github-site happy-path PASS）
- `docs/20260707-release-readiness-runbook.md` / `docs/20260707-release-readiness-docs-index.md`（release-readiness umbrella 家族）
- `docs/phase-1-completion-report.md` / `docs/phase-1-completion-checklist.md`（Phase 1 functional final 2026-05-18 宣告）
- `docs/20260617-blog-phase1-wrapup-status-map.md`（收尾路線圖 A/B/C/D/E 各線）
- `docs/20260703-post-c1-next-deploy-candidates.md`（post-first-deploy candidate roster；low=0 / medium=1 / blocked=12）
- `docs/20260705-post-e-next-line-inventory-excluding-admin-ui.md`（post-E next-line inventory）
- `docs/20260705-blogger-continuation-next-line-inventory.md`（Blogger continuation next-line inventory）
- `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`（`github-pages-blog-planning` quarantine hold 依據）
- `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`（唯一 production expected warning 之依據）
- `CLAUDE.md` §3a Current state snapshot（Phase 1 current state / first GitHub Pages deploy milestone / ADMIN idle freeze / dormant summary / Red lines / Recommended next paths）
- `CLAUDE.md` §5（分階段）、§21（SEO / canonical / primaryPlatform）、§23（發布狀態；draft 不得進正式 dist）、§26（package.json 指令）、§27（Claude Code 修改規則）、§28（MVP 必做）、§29（第一版不做）
- `MEMORY.md` + `memory/project_baseline.md`（frozen source / deploy baseline）
- `memory/project_report_only_metadata_guards.md`（8 warning-only guards + release-readiness umbrella）
- `memory/project_admin_write_path_status.md`（Admin write path dormant）
- `memory/project_reverse_utm_status.md`（pm-24a/b/c source landed；pm-26 deploy BLOCKED）
- `memory/project_commerce_status.md`（Commerce L1 seed / L2+ blocked / C7 deferred）
- `memory/project_download_status.md`（empty registries；R-rules + R5b landed；production migration blocked）
- `memory/feedback_phase_discipline.md`（memory-sync-only / docs-only / source-only phases 不重疊）
- `memory/feedback_commerce_red_lines.md`（no auto-seed / no token / no credential）
- `memory/feedback_no_per_article_html_decorations.md`（keep posting simple）

---

（本文件結束 / end of document）
