# Phase 1 RC 2026-07-10 docs single-page lookup index（docs-only）

- 建立日期：2026-07-10（Asia/Taipei）
- 類型：docs-only **single-page lookup index**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 目的：把 2026-07-10 這一批 Phase 1 RC docs-only slices（7 份）整合為單頁索引；讓 Dean / Claude 未來 session 可**一頁**快速判斷「該讀哪一份、什麼時候讀、每份的紅線、目前哪些仍 blocked / held、下一步要什麼」。**不**新增任何規則、**不**改變任何流程、**不**代 Dean 決策。
- 觸發：本 session 明確指示；handoff readout §6 未列此 slice，屬 handoff family 之後續合併 index（同性質於 `docs/20260707-release-readiness-docs-index.md` — release-readiness 家族之單點索引）。
- 本輪界線（docs-only）：**不** build / **不** preview / **不** deploy / **不**碰 deploy clone 寫入 / **不**改任何 frontmatter / **不**改任何 sidecar `.publish.json` / **不**動 Blogger backfill 語意（`check:blogger-backfill` 維持 report-only）/ **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / **不**買網域 / **不**設 DNS / **不**建 `CNAME` / **不**建 `ads.txt` / **不**啟用 AdSense / **不**改 AdSense production behavior / **不**碰 Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 / **不**動 `CLAUDE.md` / `MEMORY.md` / `memory/` / **不**新增 npm script / preview helper script。
- 本輪允許 mutation：新增本檔（唯一）+ commit + push origin/main。

---

## 0. Boot baseline（本輪已驗）

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `abc707c` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅（read-only 驗證） | `0 / 0` | clean | absent ✅ |

Source HEAD full hash = `abc707caf5a5b095157bddbb08503b23f54b6840`；subject `docs(blogger): record preview-only helper preanalysis`。前 6 commit 依序為 `c0ee384`（`docs(release): define domain adsense gates`）→ `e477a75`（`docs(blogger): record backfill write preflight`）→ `a9003e8`（`docs(state): record phase1 rc next readiness`）→ `f42ba32`（`docs(blogger): record preview sanity checklist`）→ `d73492b`（`docs(blogger): clarify admin export workflow alignment`）→ `4e34d20`（`docs(state): record phase1 rc handoff readout`）。

Deploy HEAD full hash = `1170e7e14aaa7f3449999bf92b9c8586719a76b4`（read-only 驗證；本 session **未寫入** deploy clone）。

Readiness checks 本輪已跑（read-only；exit 0）：

| # | 指令 | Exit | 結果 |
| --- | --- | --- | --- |
| C-1 | `npm run check:phase1-readiness` | 0 | validate 0/135/107、npm-script-targets 48/48、adsense-mode-metadata scanned 17 / warnings 0、blogger-backfill scanned 12 / candidates 7 / complete 0 / missing 7 report-only、prepublish 16/16、smoke 8/8 |
| C-2 | `npm run check:phase1-readiness-contract` | 0 | 22/22 PASS（1 parseable + 1 script-present + 6 required + 13 forbidden absent + 1 ordered 6/6） |

判定：baseline 完全一致；readiness 未 drift；backfill guard 維持 report-only；deploy clone 未動。

---

## 1. 結論（先講結果）

**A. 2026-07-10 家族共 7 份 docs-only slice（含本 index 為第 8 份）**。全部為 additive-only；未動 program / build / deploy / settings / frontmatter / sidecar / package.json / memory；Phase 1 RC baseline 於各 slice 之間未 drift。

**B. 家族結構分三層**：
1. **Handoff / operating layer**（1 份）：`20260710-phase1-rc-handoff-operating-readout.md` — 家族入口 / session cold-start 讀完可重建上下文。
2. **Workflow alignment layer**（3 份）：Admin export workflow / Blogger preview sanity checklist / preview-only helper preanalysis — 圍繞 Blogger 手動流程之 audit / checklist / 未來 tooling 候選。
3. **Gate / preflight layer**（3 份）：next-readiness analysis / backfill write phase preflight / custom domain·AdSense trigger checklist — 未來要動什麼、要滿足什麼 gate。

**C. 本 index 之角色 = 單頁 lookup**。不重寫 7 份 doc 之內容、不新增規則、不改變流程；僅提供表格式 discovery + red-line summary + 下一步指引。若 Dean / Claude 進入新 session 只讀本 index + `CLAUDE.md` §3a 應能判斷「今天要不要做什麼、該讀哪一份」。

**D. Recommendation = idle freeze**（保守路徑；`CLAUDE.md` §3a Recommended next paths；handoff readout §8；next-readiness §8）。本 index 不代 Dean 決策、不啟動任何候選；若 Dean 未來 session 明確判斷推進，依 handoff readout §6 / next-readiness §7 之候選啟動條件執行。

---

## 2. Included docs（2026-07-10 家族 7 份）

依 commit 時序列表；每份僅列 1-line hook / 何時讀 / 主要紅線；細節請開檔。

| # | Commit | File | 一句話定位 | 何時讀 | 主要紅線 |
| --- | --- | --- | --- | --- | --- |
| 1 | `4e34d20` | `docs/20260710-phase1-rc-handoff-operating-readout.md` | Phase 1 RC handoff / operating readout（家族入口） | Session cold-start；上下文重建；判定 RC 邊界內 / 邊界外 | 不宣告新 PASS、不代 Dean 決策、不啟動 §6 候選、不寫回大型 ledger 至 `CLAUDE.md` |
| 2 | `d73492b` | `docs/20260710-blogger-admin-export-workflow-alignment.md` | Admin `#blogger-export` 資料來源 audit + Admin→build→dist→Blogger paste 4 步 workflow | 有人問「Admin 匯出去 Blogger 貼 HTML 怎麼做？」；判定 `#blogger-export` 是否 regression | Admin 恆 read-only / source-driven / 不讀 dist / 不 build / 不寫 repo；`build:blogger` 為必要前置、`validate:content` 非必要 |
| 3 | `f42ba32` | `docs/20260710-blogger-preview-sanity-analysis.md` | Blogger preview 40 項 sanity checklist（9 subsection） | 貼 HTML 到 Blogger draft、按 preview 之後逐項勾；下一輪手動 E2E 時 | Blogger 僅 draft、不按發布；不 deploy GitHub Pages；不 commit 測試 dist-blogger；不猜 Blogger IDs |
| 4 | `a9003e8` | `docs/20260710-phase1-rc-next-readiness-analysis.md` | RC readiness re-verify + 三份 workflow docs 影響面 audit + 候選推薦順序 | 判定 RC baseline 是否仍 stable；決定下一 slice 排序 | 6 支 report-only guard 不得升 fail-fast；`ORDERED_FRAGMENTS` 不得改；不代 Dean 決策 |
| 5 | `e477a75` | `docs/20260710-blogger-backfill-write-phase-preflight.md` | Blogger backfill write phase 前置條件 / gates / dry-run / rollback（不實寫）| Dean 準備進 backfill write；先 scope 資料需求 | 不猜 `publishedUrl` / `publishedAt` / `bloggerPostId`；`bloggerPostId` 屬系統欄位、不列 Dean 必填；write 只動 sidecar、不動 frontmatter |
| 6 | `c0ee384` | `docs/20260710-custom-domain-adsense-trigger-checklist.md` | Custom domain（Gate D）+ AdSense（Gate A）trigger conditions；未來啟動 sequence | Dean 判斷「要不要買網域 / 申請 AdSense」；每次 session 一頁勾選 | Phase 1 RC 階段不買 domain、不設 DNS、不建 `CNAME` / `ads.txt`（含 placeholder）、不啟用 AdSense；real pub id 只在真值取得後才建 |
| 7 | `abc707c` | `docs/20260710-blogger-preview-only-script-preanalysis.md` | Preview-only helper（B1 navigator / B2 draft-aware preview build）preanalysis；不實作 | Dean 覺得 Blogger 手動流程繁瑣、評估是否值得引入 helper 時 | 不改 `build:blogger` / `classify` / 正式 dist-blogger；不 deploy；不呼叫 Blogger API；不猜 IDs；本 session 不新 script / 不動 `package.json` |
| 8 | *this doc* | `docs/20260710-phase1-rc-docs-index.md` | 本檔（2026-07-10 家族單頁 lookup index） | 新 session 想「一頁看完 2026-07-10 做了什麼」時 | 不新增規則、不改流程、不代 Dean 決策；不宣告新 PASS |

---

## 3. Recommended reading order

**新 session cold-start 之推薦讀法**（依用途分岔）：

| Dean 目標 | 推薦讀序 | 為什麼 |
| --- | --- | --- |
| 「我是新 session、想快速重建 Phase 1 RC 上下文」 | `CLAUDE.md` §3a → 本 index → `20260710-phase1-rc-handoff-operating-readout.md` §1–§4 | RC handoff readout 已含全景；本 index 提供快速 discovery |
| 「Blogger 匯出 / preview / paste 相關問題」 | `20260710-blogger-admin-export-workflow-alignment.md` § 3 → `20260708-blogger-draft-preview-runbook.md` §D → `20260710-blogger-preview-sanity-analysis.md` §5 | 三份互補、順序為 workflow → runbook → sanity checklist |
| 「Phase 1 RC 是否還 stable？」 | `20260710-phase1-rc-next-readiness-analysis.md` §2 / §4 | RC readiness re-verify 明列 exit code 與 carry-forward baseline |
| 「準備進 Blogger backfill write」 | `20260710-blogger-backfill-write-phase-preflight.md` §3 → §5 → §7 → §8 → §9 → §10 | preflight 已 scope 出資料 / 允許寫入 / gate / dry-run / validate / rollback |
| 「Dean 想討論 domain / AdSense 時機」 | `20260710-custom-domain-adsense-trigger-checklist.md` §5 → §8 → §11 | 觸發條件 + Gate A/D 分離 + 未來 sequence |
| 「Blogger preview 手動流程太繁瑣、想長期評估 tooling」 | `20260710-blogger-preview-only-script-preanalysis.md` §5–§6 → §11 | Option A / B1 / B2 對照 + acceptance criteria |
| 「不做任何事、只需驗證 baseline」 | 本 index §0 + `CLAUDE.md` §3a Core operating rules（Baseline verify 7 步）| idle freeze 保守路徑 |

---

## 4. 目前安全 baseline summary

以下狀態於本 session（`abc707c`）已 verified；下一 session cold-start 首要對照此表。

| 面向 | 狀態 |
| --- | --- |
| Source repo | `main` @ `abc707c` == origin/main；`0 / 0`；clean；`.git/index.lock` absent |
| Deploy clone | `gh-pages` @ `1170e7e` == origin/gh-pages；`0 / 0`；clean；`.git/index.lock` absent（read-only 驗證） |
| `check:phase1-readiness` | exit 0 |
| `check:phase1-readiness-contract` | 22/22 PASS（6/6 required、6/6 ordered、13 forbidden absent） |
| `validate:content` | 0 error / 135 warning / 107 post（carry-forward；本 session 於 phase1-readiness 內執行）|
| `check:npm-script-targets` | 48/48（additive-only drift；`CLAUDE.md` §Validation baseline 顯示舊 37/37 snapshot，不修 unless memory-sync phase）|
| `check:adsense-mode-metadata` | scanned 17 / warnings 0（report-only） |
| `check:blogger-backfill` | scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5 / exit 0（report-only）|
| `check:github-pages-prepublish` | 16/16 PASS（source 8 + deploy clone 8；純讀 git；本 session 於 phase1-readiness 內執行）|
| `check:github-pages-prepublish-smoke` | 8/8 PASS（本 session 於 phase1-readiness 內執行）|
| `check:release-readiness` / `-contract` | 未於本 session 跑；carry-forward 14/14 PASS + umbrella exit 0（`memory/project_report_only_metadata_guards.md`）|
| `check:metadata-all` | 未於本 session 跑；carry-forward 8 guards exit 0 |
| `check:admin-markdown-export` | 未於本 session 跑；carry-forward 256/256 |
| First GitHub Pages deploy | ✅ 2026-07-03；deploy `1170e7e`；live verified；本 session 未動 |
| GA4 production | ✅ live（`G-C77SMPF8VD`，2026-05-21 起）；本 session 未動 |
| Blogger LIVE | P3（`blog-restart-steady-rhythm-notes`）✅ live verified 2026-06-17；本 session 未動 |
| Production expected warning | 1（`page-noindex-in-listings` @ `content/github/posts/20260504-portable-blog-system-mvp.md`；`docs/20260626-q6-download-listing-asymmetry-policy-lock.md`）|

---

## 5. Currently blocked / held / dormant summary

以下狀態於本 session **不動**（沿用 handoff readout §4.1、next-readiness §5、custom-domain checklist §9）：

| 項目 | 狀態 | 主要 pointer |
| --- | --- | --- |
| Blogger 後台 login / post / repost / update / delete / draft flip / template edit / URL 設定 / 標籤設定 / 圖片上傳 | 🔴 forbidden（by Claude） | `CLAUDE.md` §3a Red lines / §29 |
| Guess Blogger `publishedUrl` / `bloggerPostId` / `publishedAt` / `bloggerBlogId` | 🔴 forbidden | `CLAUDE.md` §3a；`docs/20260706-blogger-identity-and-backfill-strategy.md` |
| Blogger AdSense Batch 2 P2 live repost（`ai-tools-simplify-daily-workflow`） | 🔴 BLOCKED | 至 explicit approval |
| Reverse UTM Blogger → GitHub deploy（pm-26 gate） | 🔴 BLOCKED / dormant | source landed `7e1d356` / `e2309e9` / `7c769fe`（2026-05-23）；live dormant |
| Custom domain / DNS / GitHub Pages custom domain 設定 / `CNAME` | 🔴 out of Phase 1 scope | `docs/20260710-custom-domain-adsense-trigger-checklist.md` §5 / §9 |
| AdSense formal application / `ads.txt` 落地 / serving verification | 🔴 out of Phase 1 scope | `docs/20260710-custom-domain-adsense-trigger-checklist.md` §8 / §9 |
| Blogger backfill write phase（動 `.publish.json` / frontmatter 之任何寫入） | 🔴 dormant | `docs/20260710-blogger-backfill-write-phase-preflight.md` §2 / §7 |
| GA4 dashboard / D4 dimension expansion / Search Console 後台 | 🔴 forbidden（by Claude） | Dean-provided masked evidence only |
| Second GitHub Pages deploy（新 push gh-pages / 更新 `dist/`） | 🔴 out of Phase 1 scope | 各篇 Dean-gated |
| `github-pages-blog-planning` quarantine 解除 | 🔴 hold（by design） | `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md` |
| Admin write path（Apply / middleware / admin-write-cli / `--apply` / `dryRun:false`） | 🔴 dormant | `memory/project_admin_write_path_status.md` |
| FB sidecar 真實寫入 | ⏸ dormant | 待 Dean 勾選 8 項 preflight |
| Preview-only helper — B1 navigator | ✅ implemented（`cc6497b`，2026-07-12；`check:blogger-preview`；read-only；未進 phase1-readiness / release-readiness umbrella） | `docs/20260712-preview-only-helper-implementation.md`；`docs/20260710-blogger-preview-only-script-preanalysis.md` §6.1 |
| Preview-only helper — B2 draft-aware preview build | ⏸ not implemented / Dean-gated（未建立 `dist-blogger-preview/` / 未動 `.gitignore` / 無 PREVIEW-ONLY marker） | `docs/20260710-blogger-preview-only-script-preanalysis.md` §6.2 / §13；須另開 phase + explicit approval |
| Commerce L2 / L3 / L4 新 candidates | 🔴 BLOCKED；user-provided YAML + explicit approval | `memory/project_commerce_status.md` |
| Phase 2 功能（後台登入 / 視覺編輯器 / Blogger API / Drive API / View 數 / 讚 / 留言 / 全文搜尋 / DB） | 🔴 第一版永禁 | `CLAUDE.md` §29 |
| Phase 1 final 之降級 / 重新封存 | 🔴 永禁 | `CLAUDE.md` §3a Core operating rules |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | 🔴 永禁 | `CLAUDE.md` §3a Historical ledger replacement rule |

---

## 6. Report-only guards summary（不得升為 fail-fast）

以下 guard **必須維持 report-only / warning-only / exit 0**；升級須另開 phase + baseline / smoke 對照（`memory/project_report_only_metadata_guards.md` §6；next-readiness §6）：

| Guard | Scope | 本 session 狀態 |
| --- | --- | --- |
| `check:blogger-backfill` | Blogger backfill 完整度 | scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5 / exit 0 |
| `check:adsense-mode-metadata` | AdSense mode metadata | scanned 17 / warnings 0（於 phase1-readiness 內跑） |
| `check:content-type-metadata` | content-type field enum | 未本 session 跑；carry-forward warnings 0 |
| `check:campaign-purpose-metadata` | campaign purpose enum | 未本 session 跑；carry-forward warnings 0 |
| `check:campaign-industry-metadata` | campaign industry enum（`{travel}` on campaign-like bucket） | 未本 session 跑；carry-forward warnings 0 |
| `check:custom-promo-metadata` | custom promo blocks 結構 | 未本 session 跑；carry-forward warnings 0 |
| `check:campaign-metadata-cross-field` | contentType × campaignPurpose × industry cross-field | 未本 session 跑；carry-forward warnings 0 |
| `check:custom-promo-cross-field` | custom promo blocks 內部一致性 | 未本 session 跑；carry-forward warnings 0 |
| `check:adsense-cross-field` | AdSense mode × slots[] 內部一致性 | 未本 session 跑；carry-forward warnings 0 |
| `check:metadata-all` | 上述 8 guards 之 umbrella | 未本 session 跑；carry-forward 8 guards exit 0 |
| `check:validation-report` | validation report guard | 未本 session 跑；carry-forward 27/0 |

**升級為 fail-fast 之後果**：阻擋所有既有 legacy 文章之 build / release；破壞 additive-only 契約；不符合 Phase 1 red line（backfill 更會直接阻擋直到 Dean 提供真值）。**不做**。

---

## 7. Dean explicit approval required list

以下動作**皆須 Dean 於未來某 session 主動並明確聲明**才可啟動；每項為獨立 phase；本 index / 家族 7 份 doc **皆不代 Dean 決策、皆不啟動**：

| 動作 | Approval 顆粒度 | 主要 preflight doc |
| --- | --- | --- |
| Blogger backfill write phase 啟動 + `publishedUrl` / `publishedAt` 真值 | 「請進入 Blogger backfill write phase，附 Dean 提供之 publishedUrl / publishedAt 真值」 | `docs/20260710-blogger-backfill-write-phase-preflight.md` |
| 6 篇 sidecar-absent 之新 sidecar 建立 | Dean 於同 approval 中明示 permalink | 同上 §5 / §8 |
| Custom domain（Gate D）啟動 + domain 字串 + 註冊商 + DNS 管理權限 | 「啟動 Gate D，`babel-lab.tw`（或其他），已註冊 + 可管 DNS」 | `docs/20260710-custom-domain-adsense-trigger-checklist.md` §10 / §11 |
| `custom-domain-prep-1..7` 各 phase | 逐 phase Dean 明說 | 同上 §6 |
| AdSense（Gate A）啟動 + pub id | 「啟動 Gate A，附 Dean 手動取得之 pub id」 | 同上 §8 / §10 / §11 |
| `adsense-1..5` 各 phase | 逐 phase Dean 明說 | 同上 §6 |
| Blogger AdSense Batch 2 P2 live repost | 「啟動 P2 live repost（`ai-tools-simplify-daily-workflow`）」 | `docs/20260612-blogger-adsense-batch-*` |
| Reverse UTM pm-26 deploy | 「啟動 pm-26 deploy」 | `docs/reverse-utm-fixture-plan.md` §6；`memory/project_reverse_utm_status.md` |
| Second GitHub Pages deploy（新篇 / 更新 dist）| 各篇 Dean-gated | `docs/20260703-post-c1-next-deploy-candidates.md` |
| `github-pages-blog-planning` 解除 quarantine | Dean 明說 | `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md` |
| Admin write path 啟動（Apply / middleware / admin-write-cli / `--apply` / `dryRun:false`） | Dean 明說 | `memory/project_admin_write_path_status.md` |
| FB sidecar 真實寫入 | Dean 完成 8 項 preflight 勾選 | dormant |
| Preview-only helper — B1 navigator | ✅ landed（`cc6497b`，2026-07-12；`docs/20260712-preview-only-helper-implementation.md`）；本行僅存於歷史比對，未來不需再次 approval | — |
| Preview-only helper — B2 draft-aware preview build | 「啟動 B2 preview helper 實作 phase」（B1 已 landed，此項僅剩 B2） | `docs/20260710-blogger-preview-only-script-preanalysis.md` §6.2 / §11 |
| 動 `content/settings/ads.config.json` real IDs | Dean 明說；real IDs 僅存於該檔（`CLAUDE.md` §3a Red lines）| — |
| CLAUDE.md / MEMORY.md / memory/** 大型改動 | 明訂 memory-sync phase | `memory/feedback_phase_discipline.md` |

**Claude 於任何 session 皆不代 Dean 決策、皆不主動啟動**上表任一項。

---

## 8. Recommended next path

**保守路徑 = idle freeze**（預設；`CLAUDE.md` §3a Recommended next paths；handoff readout §8；next-readiness §7 / §8）。

若 Dean 未來 session 明確判斷推進，候選排序（handoff readout §6 + next-readiness §7）：

| 排名 | 候選 | 觸發條件 | 對應 doc |
| --- | --- | --- | --- |
| #1 | idle freeze | 預設 | `CLAUDE.md` §3a Recommended next paths |
| #2 | 候選 A — Phase 1 RC → next-phase 決策入口 preanalysis（docs-only） | Dean 想看清下一步分岔面 | 未來 slice：`docs/<YYYYMMDD>-blog-next-phase-route-selection-preanalysis.md` |
| #3 | 候選 B — Blogger backfill write phase preflight 已 landed（`e477a75`）→ 未來實寫 | Dean 提供真值 + explicit approval | `docs/20260710-blogger-backfill-write-phase-preflight.md` |
| #4 | 候選 D — Blogger preview-only helper：B1 navigator 已 landed（`cc6497b`，2026-07-12）；剩 B2 draft-aware preview build 待 Dean 明說 | Dean 明說啟動 B2 | `docs/20260710-blogger-preview-only-script-preanalysis.md` §6.2；`docs/20260712-preview-only-helper-implementation.md` |
| #5 | 候選 E — custom domain / AdSense trigger checklist 已 landed（`c0ee384`）→ 未來 Gate D / A | Dean 判斷 SEO 累積時機 + 明說啟動 | `docs/20260710-custom-domain-adsense-trigger-checklist.md` |
| #6 | 候選 C — Blogger 實機發布頁 overflow 觀察 docs-only | **僅在** Blogger 實機發布頁再現水平捲軸時 | `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md` §7 Option A |
| #7 | 候選 F — WP-12 Download next-phase preanalysis（docs-only）已於 2026-07-13 landed；未來若啟動實作，見 follow-up A–I | Dean 明說啟動 §10 任一 follow-up | `docs/20260713-wp12-download-next-phase-preanalysis.md` |

**啟動任一候選皆須 Dean explicit approval + 另開獨立 phase**；本 index 不代 Dean 決策。

---

## 9. 如何使用本 index（未來 Claude session）

**新 session cold-start 建議 flow**：

1. 跑 `CLAUDE.md` §3a Baseline verify 7 步（`pwd` / branch / status / HEAD / origin / ahead-behind / log -5）；對照本 index §0 或最新 phase doc 之 boot baseline。
2. 讀 `MEMORY.md` index + `memory/project_baseline.md` 之最新 frozen baseline。
3. 讀 `CLAUDE.md` §3a Current state snapshot（Phase 1 current state / Red lines / Recommended next paths）。
4. 讀本 index（單頁）→ 若需要深入某主題，依 §2 表 + §3 讀序打開對應 doc。
5. 讀 Dean 之啟動指令：確認屬 §8 某候選或 idle freeze；若不屬任一，先向 Dean 澄清。
6. 對照 handoff readout §5.3 Session rules gate + §7 red-line；每項均過再進實作。
7. slice 結束時對照 handoff readout §5.4 Post-slice sign-off gate。

**本 index 非取代 handoff readout**：本 index 為 lookup / discovery；handoff readout 為 operating readout（含 gates / red lines / boot baseline / RC decision / follow-up status）。兩者角色互補；session cold-start 兩份都值得讀，但本 index 更精簡、handoff readout 更完整。

---

## 10. Non-goals for this session

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
| 新增規則 / 新增契約 / 改流程 | ❌ 未做（本 index 純 discovery / lookup） |
| 代 Dean 決策 / 啟動任一候選 | ❌ 未做 |

---

## 11. Idle-freeze recommendation

**Recommendation = idle freeze**（沿用 `CLAUDE.md` §3a Recommended next paths；handoff readout §8；next-readiness §8；custom-domain checklist §13；preview-only script preanalysis §13）。理由：

1. Phase 1 RC baseline 於本 session 已再驗、未 drift；readiness 兩支 guard 皆 exit 0；三次手動 E2E / smoke 皆 PASS；deploy clone 未動。
2. 2026-07-10 家族 7 份 docs-only slice 已 landing；handoff / workflow / gate / preflight 三層皆補齊；下一 session 可直接讀本 index + `CLAUDE.md` §3a 進入上下文。
3. 目前**無** blocking issues（P0 = none；P1-1 resolved / P1-2 documented accepted / P1-3 downgraded to P2 external artifact）。
4. RC 邊界外之候選（custom domain / AdSense serving / Blogger backfill write / second deploy / reverse UTM pm-26 / preview helper 實作 / Blogger Batch 2 live repost）**皆 blocked**；啟動任一均須 Dean explicit approval + 對應 phase。
5. 本 index 之角色 = 未來 session 一頁 lookup；今日不做任何啟動決策。

**若 Dean 於未來 session 明確判斷需推進**：依 §8 排序執行；每個 slice 皆須另開獨立 phase + explicit approval + 對照 handoff readout §5.3 Session rules gate。

---

## 12. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔（+ 對應 commit + push origin/main）。**不含**任何程式 / frontmatter / settings / sidecar / build / deploy / dev-server 變更；未新增 guard / npm script / preview-only script / helper script；未改 `.gitignore`；未改 CSS；未改 `CLAUDE.md` / `MEMORY.md` / `memory/`；未觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages；未發布 Blogger；未購買網域 / 未動 DNS / 未碰 AdSense / GA4 / Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`；未猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId`；未從任何 metadata 推導 Blogger internal ID；未新增測試文章 / artifact；未建 `CNAME` / `ads.txt`（含 placeholder / fake）；未動 `content/settings/ads.config.json`；未升級任何 report-only guard 為 fail-fast。§0 boot baseline 為本 session read-only 驗證；§2 included docs 表為對 7 份既有 doc 之整理（每份 hook / 何時讀 / 主要紅線皆為既有 doc 之濃縮，未新增規則）；§3 reading order 為建議、非強制流程；§4 baseline summary 沿用 handoff readout §2.3 + next-readiness §2；§5 blocked 沿用 handoff readout §4.1 + next-readiness §5；§6 report-only guards 沿用 `memory/project_report_only_metadata_guards.md` §6；§7 approval list 沿用 custom-domain checklist §10 + backfill preflight §7 + memory 相關；§8 recommended next path 沿用 handoff readout §6 + next-readiness §7；§9 usage flow 為建議、非契約；§10 non-goals 沿用 handoff readout §7 + `CLAUDE.md` §3a Red lines；§11 idle-freeze recommendation 沿用 `CLAUDE.md` §3a Recommended next paths。

---

## See also

- `docs/20260710-phase1-rc-handoff-operating-readout.md`（handoff / operating readout；本 index 之上位入口；session cold-start 兩份都值得讀）
- `docs/20260710-blogger-admin-export-workflow-alignment.md`（Admin `#blogger-export` 資料來源 audit + Admin→build→dist→Blogger paste 4 步 workflow）
- `docs/20260710-blogger-preview-sanity-analysis.md`（Blogger preview 40 項 sanity checklist；9 subsection）
- `docs/20260710-phase1-rc-next-readiness-analysis.md`（RC readiness re-verify + 三份 workflow docs 影響面 audit + 候選推薦順序）
- `docs/20260710-blogger-backfill-write-phase-preflight.md`（Blogger backfill write phase 前置條件 / gates / dry-run / rollback）
- `docs/20260710-custom-domain-adsense-trigger-checklist.md`（Custom domain Gate D + AdSense Gate A trigger conditions + 未來 sequence）
- `docs/20260710-blogger-preview-only-script-preanalysis.md`（Preview-only helper B1 navigator / B2 draft-aware preview build preanalysis；B1 已於 2026-07-12 landing，見下）
- `docs/20260712-preview-only-helper-implementation.md`（B1 navigator source slice landing ledger；2026-07-12；`cc6497b`；`check:blogger-preview` + `check:blogger-preview-smoke` 49/49）
- `docs/20260708-phase1-stability-closeout-rc-note.md`（Phase 1 stability closeout RC note；handoff / next-readiness 之 RC sign-off 依據）
- `docs/20260708-phase1-second-manual-e2e-result.md`（第二次人工 E2E；P1/P2 follow-up 分級來源）
- `docs/20260708-phase1-third-manual-smoke-result.md`（第三次小型人工 smoke；P1-1 verified resolved）
- `docs/20260708-phase1-p1-followup-closeout-inventory.md`（Admin `#blogger-export` 5 顆 Copy 按鈕 fix landing record；commit `38a4e98`）
- `docs/20260708-blogger-draft-preview-runbook.md`（Blogger draft-preview 6 步可重複流程；含 §F overflow debug）
- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（build eligibility 盤點 + Option A/B/C；preview-only preanalysis §6 B2 sourced from §7 Option B）
- `docs/20260708-domain-github-pages-adsense-decision.md`（domain / AdSense 決策盤點；custom-domain checklist §1–§3 之上位）
- `docs/20260708-adsense-source-evidence-audit.md`（AdSense 官方來源稽核；custom-domain checklist §2 / §4 / §8 之上位）
- `docs/custom-domain-root-files-strategy.md`（custom domain 遷移機制 / §3 ads.txt CNAME 之 no-placeholder / §4 逐 phase checklist；custom-domain checklist §6 / §8 / §11 之上位）
- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger identity 分層 policy；不猜 ID；backfill preflight §2 / §4 之上位）
- `docs/20260706-blogger-backfill-write-target-inventory.md`（Blogger backfill sidecar canonical location；backfill preflight §5 之上位）
- `docs/20260706-blogger-backfill-report-only-baseline.md`（Blogger backfill report-only baseline；backfill preflight §1 之上位）
- `docs/20260706-blogger-backfill-value-intake-template.md`（backfill 真值收集模板；backfill preflight §3 引用）
- `docs/20260709-blog-phase2-next-work-packet.md`（Phase 2 next-work packet；候選 A–E scope-out）
- `docs/20260707-release-readiness-docs-index.md`（release-readiness 家族之單點索引；本 index 之姊妹 index）
- `docs/20260707-release-readiness-runbook.md` / `docs/20260707-release-readiness-clean-baseline-verification.md` / `docs/20260707-release-readiness-contract-baseline-verification.md` / `docs/20260707-metadata-all-prepublish-integration-audit.md`（release-readiness 家族）
- `docs/20260702-phase1-manual-e2e-runbook.md`（第一次 E2E：github-site happy-path PASS）
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`（GitHub Pages publish path readiness + prepublish checklist；`check:phase1-readiness` 之 required doc）
- `docs/20260702-session-start-dual-repo-baseline-snapshot.md`（session start dual-repo baseline snapshot；`check:phase1-readiness` 之 required doc）
- `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`（`github-pages-blog-planning` quarantine hold 依據）
- `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`（唯一 production expected warning 之依據）
- `docs/phase-1-completion-report.md` / `docs/phase-1-completion-checklist.md`（Phase 1 functional final 2026-05-18 宣告）
- `docs/20260617-blog-phase1-wrapup-status-map.md`（收尾路線圖 A/B/C/D/E 各線）
- `CLAUDE.md` §3a Current state snapshot（含 Red lines / Recommended next paths；本 index 之上位）
- `CLAUDE.md` §5（分階段）、§7（Blogger 發布 checklist）、§14 / §15（tags / categories registry）、§16.4（cross-link UTM）、§17（文章頁基本版型）、§21（SEO / canonical / primaryPlatform）、§23（發布狀態；draft 不得進正式 dist）、§24（Blogger 發布 URL 回填）、§26（package.json 指令）、§27（Claude Code 修改規則）、§28（MVP 必做）、§29（第一版不做）
- `MEMORY.md` + `memory/project_baseline.md`（frozen source / deploy baseline）
- `memory/project_report_only_metadata_guards.md`（8 warning-only guards + release-readiness umbrella；本 index §6 之上位）
- `memory/project_admin_write_path_status.md`（Admin write path dormant）
- `memory/project_reverse_utm_status.md`（pm-24a/b/c source landed；pm-26 deploy BLOCKED）
- `memory/project_commerce_status.md`（Commerce L1 seed / L2+ blocked / C7 deferred）
- `memory/project_download_status.md`（empty registries；R-rules + R5b landed；production migration blocked）
- `memory/feedback_phase_discipline.md`（memory-sync-only / docs-only / source-only phases 不重疊）
- `memory/feedback_no_per_article_html_decorations.md`（keep posting simple）

---

（本文件結束 / end of document）
