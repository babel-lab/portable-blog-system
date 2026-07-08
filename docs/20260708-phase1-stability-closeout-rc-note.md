# Phase 1 Stability Closeout / RC Note（docs-only RC note）

- 建立日期：2026-07-08（Asia/Taipei）
- 類型：docs-only **stability closeout / release-candidate note**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md`）。
- 目的：彙整 Phase 1 readiness、第二次人工 E2E、第三次小型 smoke、P1/P2 follow-up 目前處理狀態，作為 Phase 1 **穩定收尾 / RC 判定**之 sign-off 依據。
- 對應觸發：`docs/20260708-phase1-p1-followup-closeout-inventory.md` §E 候選 3「Phase 1 stability closeout checklist / RC note」；並回應 Dean 對於「Phase 1 是否可進入 stability closeout / RC」的判斷需求。
- 本輪界線（docs-only）：**不**改程式、**不**新增 guard、**不**修 CSS、**不** build、**不** deploy、**不**產 dist / dist-blogger、**不**碰 deploy clone 寫入、**不**新增測試 artifact / 測試文章、**不**碰 DNS / GitHub Pages settings / Blogger / AdSense / GA4 / GSC 後台、**不** push（除非 Dean 明確授權）。

---

## 0. Boot baseline（read-only 驗證）

| Repo | branch | HEAD | 對照 | ahead/behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `b6cd165` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅ | `0 / 0` | clean | absent ✅ |

判定：boot baseline 完全符合 frozen baseline。Deploy clone 僅 read-only 讀取，未寫入。

---

## A. Executive summary

- **Phase 1 current status**：Phase 1 functional final 已於 **2026-05-18** 宣告（`docs/phase-1-completion-report.md`）；MVP §28 17 條全達標；GitHub Pages 首次 deploy 已於 **2026-07-03** 完成 + 線上驗證 PASS（`1170e7e`）；2026-07-02 第一次人工 E2E（github-site happy-path）PASS；2026-07-08 第二次人工 E2E（blogger-site draft-preview 鏈路）PASS with P1/P2 follow-up；2026-07-08 第三次小型人工 smoke 再度 PASS with P2 follow-up，並實地驗證 P1-1 fix 順手、P1-2 runbook 可重複、P1-3 由 P1 降級為 P2 / likely external Blogger preview artifact。
- **是否可進入 stability closeout / RC**：**yes**。Phase 1 已可視為進入 **穩定收尾 / RC-ready for manual workflow** 狀態；後續屬人工流程穩定觀察，而非「Phase 1 尚未完成」。
- **是否有 P0 blocker**：**none**。三次人工測試均未發現 P0；本輪所有 read-only readiness check 綠燈；先前之 P1 已於前一輪 closeout inventory + 本輪第三次 smoke 逐項處理（P1-1 resolved / P1-2 documented+usable / P1-3 downgraded to P2）。

**caveat**：本 RC 判定屬**開發線 / 內部 sign-off**，僅涵蓋「repo 內 guard + Dean 既有人工驗收」。**不包含** custom domain / 正式 AdSense serving 驗證 / GA4 後台調整 / Blogger 正式營運發文（見 §E）。Claude 未登入任何 Google / Blogger / GA4 / AdSense / GSC 後台，未 build / deploy。

---

## B. Automated readiness

本輪授權跑之 read-only checks（皆 checks-only、無 build / deploy / write）：

| # | 指令 | Exit | 摘要 |
| --- | --- | --- | --- |
| B-1 | `npm run check:phase1-readiness` | 0 | 詳 B-1a..B-1f |
| B-2 | `npm run check:phase1-readiness-contract` | 0 | `22/22 PASS`（6/6 required fragments、6/6 ordered、0/13 forbidden token 全 absent） |

`check:phase1-readiness` 六支子檢查逐項：

| # | 子檢查 | 結果 |
| --- | --- | --- |
| B-1a | `validate:content` | **0 error / 135 warning / 107 post** |
| B-1b | `check:npm-script-targets` | **48/48 PASS**（47 targets） |
| B-1c | `check:adsense-mode-metadata` | scanned 17 / legacy 17 / valid 0 / **warnings 0** / exit 0（report-only / warning-only） |
| B-1d | `check:blogger-backfill` | **report-only PASS**；candidates 7 / complete 0 / missing 7；warning-only、missing 不 fail |
| B-1e | `check:github-pages-prepublish` | **16/16 PASS**（source 8 + deploy clone 8；純讀 git 狀態，不 build/deploy/fetch/pull） |
| B-1f | `check:github-pages-prepublish-smoke` | **8/8 PASS**（happy-path + 7 failure detection；全在 OS temp repo，自動清除） |

**Validation warnings baseline 是否仍屬既有 baseline，不阻擋**：**是**。135 warning 全數落在：

- 1 production intentional hold：`content/github/posts/20260504-portable-blog-system-mvp.md`（`page-noindex-in-listings`；warning-only、legacy download listing intentional hold；詳 `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`）。
- 1 production：`content/github/posts/2026-07-01-github-pages-build-preview-workflow.md`（`missing-cover`；nb: 該篇於 C1 deploy milestone 3 篇 github-native 之列，已 live PASS）。
- 其餘全部來自 `content/validation-fixtures/`（validator fixtures；期望警告，不算 regression）。

上述 warning 分佈**與現行 baseline 一致**，未新增未預期 warning、未觸發任何 hard error；validate 的 hard gate（0 error）**未破**。

執行後 source working tree 仍 clean、ahead/behind 0/0、無 index.lock；deploy clone 於本輪僅被 prepublish 讀取，未寫入。

---

## C. Manual testing summary

### Phase 1 second manual E2E（2026-07-08）
- 結果：**PASS with P1/P2 follow-up**（`docs/20260708-phase1-second-manual-e2e-result.md`）。
- 涵蓋 D-1..D-10 全部 10 個 step（PASS / PASS with warnings）；P0 = none。
- Blogger 僅 draft preview（未按發布）；GitHub Pages 僅 readonly（未 deploy）。
- Attempt notes：Attempt 1 raw Markdown 貼入 → 未渲染；Attempt 2 改用 `build:blogger` HTML + Blogger HTML 模式 → PASS。此教訓已寫入 runbook §D/§E。

### Phase 1 third manual smoke（2026-07-08）
- 結果：**PASS with P2 follow-up**（`docs/20260708-phase1-third-manual-smoke-result.md`）。
- Admin `/#blogger-export` per-post output paths helper 5/5 實地 PASS（P1-1 fix verified）。
- Runbook §D 6 步操作可重複執行（P1-2 verified usable）。
- Blogger mobile preview 觀察到水平捲軸；offender = `div.Rcpctd`（非 `.lab-blogger-article` 內元素）；Dean 為驗證實機外觀**暫時**發布 → **實機手機版未復現水平捲軸** → **P1-3 由 P1 降級為 P2 / likely external Blogger preview artifact**（暫時發布已 revert / 刪除）。
- 測試 `.md` + `dist-blogger/` artifact 已於建立 result doc 前由 Dean 清理；tree clean。

### Blogger draft preview flow 是否可重複
- **yes**。`docs/20260708-blogger-draft-preview-runbook.md` 已文件化 §D 6 步（含 §D-4 暫改 ready / §D-10 改回 draft / §D-11 cleanup）、§E 常見錯誤、§F Blogger mobile preview overflow debug 步驟（含 DevTools 步驟 + Console snippet + §F-4 判斷規則）、§G 不可做事項、§H 結果紀錄模板。第三次小型 smoke 已實地驗證 runbook 可重複執行、且 tree 可回到 clean。

### Admin Blogger Export per-post paths 是否實測可用
- **yes**。commit `38a4e98`「feat(admin): expose blogger export output paths」landed；Admin `/#blogger-export` 為每篇 blogger-enabled 文章列出 `dist-blogger/posts/<slug>/`、`post.html`、`copy-helper.txt`、`publish-checklist.txt`、`meta.json` 五條路徑，各配「Copy … path」按鈕（clipboard-only、未觸發任何檔案讀取 / 開啟 / build / deploy）；第三次 smoke §D 已實地驗證 5/5 皆 PASS，原「手動找 dist-blogger 子資料夾」摩擦點消除。

---

## D. Follow-up status

| # | Item | Status | 依據 |
| --- | --- | --- | --- |
| P1-1 | Admin Blogger Export per-post paths | **Resolved** | commit `38a4e98`（`src/views/admin/index.ejs`）+ 第三次 smoke §D 5/5 實地 PASS；剩餘增強（真正開檔 preview）非 Phase 1 blocker |
| P1-2 | `build:blogger` draft eligibility | **Documented / accepted** | `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（Option A 決策）+ `docs/20260708-blogger-draft-preview-runbook.md`（可重複 6 步流程）；`build:blogger` 不輸出 draft 為**正確且必要**設計（CLAUDE.md §23 紅線），本輪不改 build 行為 |
| P1-3 | Blogger Preview horizontal scrollbar | **Downgraded to P2 / likely external Blogger preview artifact**（unless reproduced on actual published pages） | 第三次 smoke §E-3：實機發布手機版**未**復現、offender `div.Rcpctd` 非 `.lab-blogger-article` 內元素；若日後**實機頁**再度出現，須立即依 runbook §F 重新分類，**不**逕自視為 external artifact |
| P2-1 | Fake cover / metadata warning | **Documented / accepted** | 屬**測試資料問題**、非系統缺陷；runbook §D-4 / §E 明確要求正式文章使用有效 cover；因未發布，非 blocker |
| P0 | — | **none** | 三次人工測試皆未發現 P0 |

---

## E. Out of scope for Phase 1 closeout

本 Phase 1 stability closeout / RC 判定**不涵蓋**、且本輪**不做**下列項目：

- ❌ **custom domain** 啟用 / 購買網域 / 品牌字串鎖定 / DNS 設定（`docs/20260708-domain-github-pages-adsense-decision.md` §7 + `docs/20260708-adsense-source-evidence-audit.md` §7）
- ❌ **AdSense formal application / serving verification**（正式送審、後台實測 serving、ads.txt 落地；含 GitHub Pages 站自身 AdSense）
- ❌ **DNS**（含 apex A/AAAA、subdomain CNAME、GitHub Pages custom domain）
- ❌ **GitHub Pages deploy**（含新 push gh-pages、更新 `dist/`）
- ❌ **Blogger 正式營運發文**（含 P2 / P3 live repost、Batch 2、AdSense Batch 2 live repost、Blogger 後台任何寫入）
- ❌ **GA4 後台調整**（含 D4 dim expansion、custom event 增修、看板調整）
- ❌ **preview-only export script**（inventory §7 Option B `build:blogger-preview` / `dist-blogger-preview/`）
- ❌ **Blogger-only CSS hardening**，除非**未來實際 published page** 重現 overflow 且 offender 屬 `.lab-blogger-article` 內專案元素（audit §7 Option B 之強約束：只動 Blogger scope、不得改變 GitHub Pages byte-identical 輸出）
- ❌ **Reverse UTM Blogger→GitHub deploy**（pm-26 gate；source landed but dormant / BLOCKED）
- ❌ **Admin write path / FB sidecar 真實寫入**（皆 dormant，受 CLAUDE.md §29 紅線約束）
- ❌ **Phase 2 功能**（後台登入 / 視覺編輯器 / Blogger API / Drive API / View 數 / 讚 / 留言 / 全文搜尋 / DB）

上述各項若日後要啟動，**各須另開獨立 phase + Dean explicit approval**。

---

## F. RC decision

| 判定項 | 結論 |
| --- | --- |
| Phase 1 can continue stability testing | **yes** |
| Phase 1 can be considered RC-ready for manual workflow | **yes**（RC-ready；穩定收尾狀態） |
| Blocking issues | **none** |
| Non-blocking follow-ups | ① P1-3 若日後於**實機發布頁**再度出現水平捲軸須依 runbook §F 重新分類（目前 P2 / likely external artifact）② Blogger backfill 7 篇 missing（report-only，待 Dean 於 Blogger 後台取得真值後手動回填；不猜值）③ 正式文章嚴禁假 cover（P2-1 已文件化，非系統缺陷）④ 若未來手動 Blogger draft-preview 流程仍嫌繁瑣，可獨立 phase 評估 preview-only script（Option B）— **本輪不做** |

**理由**：三次人工測試（含 happy path + blogger-site draft-preview + 第三次實地 smoke）逐次 PASS；先前 P1 逐項處理（P1-1 resolved / P1-2 documented+usable / P1-3 downgraded to P2）；本輪 automated readiness 全綠燈；validate 0 error 硬門檻未破；prepublish + smoke 覆蓋 source + deploy clone 雙 repo；npm-script-targets 48/48。**Phase 1 RC-ready 判定屬「開發線 / 內部 sign-off」**，未涵蓋 §E 之營運線 / 後台驗證項目。

**caveat**：本 RC 判定基於 repo 內 read-only guard + Dean 既有人工驗收；Claude 未登入任何 Google / Blogger / GA4 / AdSense / GSC 後台，未 build / deploy。「RC-ready for manual workflow」**不**代表已完成 domain / AdSense / 正式發布任何一項（見 §E）。

---

## G. Next safe slice recommendation

最多 3 個候選（**皆須 Dean explicit approval 才於獨立 phase 執行；本 session 不實作任一**）：

**候選 1（推薦 #1）— docs-only Phase 1 RC checklist / handoff note**

- 內容：若 Dean 準備把 Phase 1 RC 狀態交接給下一階段（domain / AdSense / operation），docs-only 落地一份 handoff checklist / RC checklist（例 `docs/<YYYYMMDD>-phase1-rc-handoff-checklist.md`），彙整（a）本 RC note 之 sign-off 依據、（b）§D follow-up 表、（c）§E out-of-scope 明列、（d）各 out-of-scope 若日後要啟動之 pre-requisite（例如 domain：§8 觸發條件 checklist / §9 缺項；AdSense：§6 正式申請前需再次人工確認的清單）。
- 界線：docs-only；**不** build / deploy / 動 domain / AdSense / GA4 / GSC / DNS / Blogger 後台。
- 風險：低。
- 前置：本 RC note 落地並確認 baseline。

**候選 2（推薦 #2；僅在觀察到條件時觸發）— optional third-party / published-page overflow observation only if reproduced**

- 觸發條件：Dean 於 **實機發布之 Blogger 頁面**（非 preview）再度觀察到水平捲軸，且 offender 屬 `.lab-blogger-article` 內專案元素。
- 內容：依 `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md` §7 Option A（已於 runbook §F landed）走一次 debug；docs-only 紀錄 offender element、`scrollWidth`、viewport、跨平台是否復現、分類判定。
- 若證實為專案元素造成，才 **另開獨立 phase** 討論 Blogger-scope CSS hardening（audit §7 Option B）；本輪 / 觸發前**不改 CSS**、**不 build**、**不 deploy**、**不動 Blogger theme**。強約束：Blogger-scope only、不得改變已 live-accepted 之 GitHub Pages 輸出 byte-identical。
- 風險：低（純觀察 + docs-only 紀錄；CSS 變更屬另一獨立 phase）。

**候選 3（推薦 #3；待 Phase 1 stable 且準備開始累積 SEO / 變現時再啟動）— defer custom domain / AdSense formal work until Phase 1 stable and ready to accumulate SEO**

- 觸發條件：Dean 明確判斷「準備讓 GitHub Pages 站本身認真累積 SEO 權重 / 認真變現」時。
- 內容：依 `docs/20260708-domain-github-pages-adsense-decision.md` §8 觸發條件 checklist + §9 缺項 + `docs/custom-domain-root-files-strategy.md` §4 逐 phase 執行；每一步各需 Dean explicit approval。
- 界線：本輪 / 觸發前**不買網域、不改 DNS、不改 GitHub Pages settings、不建 ads.txt / CNAME、不碰 AdSense·GA4·GSC 後台、不 deploy**。
- 風險：不適用（本輪不做）。

**推薦順序**：候選 1 → 候選 2（僅在實機頁重現時觸發）→ 候選 3（Phase 1 stable + SEO / 變現目標明確時觸發）。

---

## H. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔。**不含**任何程式 / frontmatter / settings / build / deploy / dev-server 變更；不新增 guard / npm script；不修 CSS；不改 `CLAUDE.md` / `MEMORY.md` / `memory/`；不觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages / 未發布 Blogger；未新增測試文章 / artifact；未購買網域 / 未動 DNS / 未碰 AdSense·GA4·Blogger·GSC 後台。§0 boot baseline / §B automated readiness 為本輪授權 read-only 實跑結果；§C manual testing summary / §D follow-up status 為對既有 result docs 與 commits 之盤點結論，未代替 Dean 宣告新 PASS；§F RC decision 屬「開發線 / 內部 sign-off」，未涵蓋 §E 之營運線 / 後台驗證項目；§G 候選皆為建議，**未**實作。

---

## See also

- `docs/20260708-phase1-stability-readiness-inventory.md`（Phase 1 穩定測試就緒盤點；readiness umbrella 起源）
- `docs/20260708-phase1-second-manual-e2e-result.md`（第二次人工 E2E；P1/P2 follow-up 分級來源）
- `docs/20260708-phase1-p1-followup-closeout-inventory.md`（第二次 E2E 之 P1/P2 follow-up closeout inventory）
- `docs/20260708-phase1-third-manual-smoke-result.md`（第三次小型人工 smoke；P1-1/P1-2 verified、P1-3 downgraded）
- `docs/20260708-blogger-draft-preview-runbook.md`（Blogger draft-preview 6 步可重複流程；§F Blogger mobile preview overflow debug）
- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（P1-2 build eligibility 盤點 / Option A/B/C 決策）
- `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md`（P1-3 audit / 9 類假說 / 降級觸發條件）
- `docs/20260708-domain-github-pages-adsense-decision.md`（domain / AdSense 時機決策；§8 觸發條件 / §9 缺項）
- `docs/20260708-adsense-source-evidence-audit.md`（AdSense 官方來源稽核；§6 正式申請前確認清單）
- `docs/20260702-phase1-manual-e2e-runbook.md`（第一次人工 E2E：github-site happy-path PASS）
- `docs/phase-1-completion-report.md` / `docs/phase-1-completion-checklist.md`（Phase 1 functional final 2026-05-18 宣告）
- `docs/20260617-blog-phase1-wrapup-status-map.md`（收尾路線圖 A/B/C/D/E 各線）
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`（prepublish checklist）
- `docs/20260707-release-readiness-runbook.md` / `docs/20260707-release-readiness-docs-index.md`（release-readiness umbrella 家族）
- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger backfill policy：不猜 postId / publishedAt）
- `CLAUDE.md` §5（分階段）、§21（SEO / canonical / primaryPlatform）、§23（發布狀態；draft 不得進正式 dist）、§26（package.json 指令）、§27（Claude Code 修改規則）、§28（MVP 必做）、§29（第一版不做）
