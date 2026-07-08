# Phase 1 第二次人工 E2E — P1/P2 follow-up closeout inventory（docs-only）

- 建立日期：2026-07-08（Asia/Taipei）
- 類型：docs-only **closeout inventory**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md`）。
- 觸發來源：`docs/20260708-phase1-second-manual-e2e-result.md` §E 之 P1-1 / P1-2 / P1-3 與 P2-1；本次結案盤點自 result doc 落地起（`e739c3a`）至本 doc 建立時之處理狀態。
- 目的：**盤點**第二次人工 E2E 之 P1 / P2 follow-up 目前哪些已處理、哪些仍待實測，作為下一輪 Phase 1 穩定測試的**決策基準**。
- 本輪界線（docs-only）：**不**改程式、**不**新增 guard、**不**修 CSS、**不** build、**不** deploy、**不**產 dist / dist-blogger、**不**碰 deploy clone 寫入、**不**新增測試 artifact / 測試文章、**不**碰 DNS / GitHub Pages settings / Blogger / AdSense / GA4 / GSC 後台、**不** push（除非 Dean 明確授權）。

---

## 0. Boot baseline（read-only 驗證）

| Repo | branch | HEAD | 對照 | ahead/behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `9763db2` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅ | `0 / 0` | clean | absent ✅ |

判定：boot baseline 完全符合 frozen baseline。Deploy clone 僅 read-only 讀取，未寫入。

---

## A. Phase 1 第二次人工 E2E 結論回顧

依 `docs/20260708-phase1-second-manual-e2e-result.md`：

| 項目 | 結論 |
| --- | --- |
| E2E 整體判定 | **PASS with P1/P2 follow-up** |
| P0 | **none** |
| Blogger | **draft preview only**（僅 draft/preview，未按發布） |
| GitHub Pages | **readonly only**（讀 live 首頁 / 文章 / 隱私 / 揭露頁；**未 deploy**） |
| Repo cleanup | 測試文章 + `dist-blogger/` 已於建立 result doc 前清理；tree clean |
| 界線 | Claude 未登入任何 Google / Blogger / GA4 / AdSense / GSC 後台 |

P1 / P2 follow-up 列表（原始清單）：

- P1-1：Admin Blogger Export 頁僅唯讀總覽，未提供 per-post copy-helper / publish-checklist 開啟按鈕。
- P1-2：測試文章需先改為 build-eligible（`status: ready` / `draft: false`）才能經 `build:blogger` 產生 Blogger HTML。
- P1-3：Blogger mobile preview 出現水平捲軸（來源未定位）。
- P2-1：測試文章使用假 cover URL → JSON-LD image 無意義（因未發布，非 blocker）。

本 doc 逐項評估其後續處理進度與狀態建議。

---

## B. P1 follow-up status

### P1-1 — Admin Blogger Export 無 per-post copy-helper / publish-checklist 存取

**原始問題**：Admin Export 頁只列出「HTML / meta 位於 `dist-blogger/posts/<slug>/`」總覽字串，未提供 per-post 導引；Dean 想找特定文章的 `copy-helper.txt` / `publish-checklist.txt` 必須手動跑 `build:blogger` 後在檔案系統內找路徑，摩擦大。

**已完成處理**：

- Commit `38a4e98`「feat(admin): expose blogger export output paths」（本 doc 建立前已 landed 於 origin/main）。
- 變更範圍：僅 `src/views/admin/index.ejs`（+148 / -2）。**未**新增 loader / fetch / build / write path。
- 新的 helper 區塊（Admin `/#blogger-export` section）為每一篇 blogger-enabled 文章列出：
  - title / slug / mode / status
  - `dist-blogger/posts/<slug>/`（folder）
  - `dist-blogger/posts/<slug>/post.html`
  - `dist-blogger/posts/<slug>/copy-helper.txt`
  - `dist-blogger/posts/<slug>/publish-checklist.txt`
  - `dist-blogger/posts/<slug>/meta.json`
  - 每條路徑一顆「Copy … path」按鈕（clipboard-only）
  - 全區 top「Copy build command」按鈕（複製 `npm run build:blogger`）
- Read-only helper 契約：無檔案讀取、無 fetch、無 build、無 deploy、無 repo write；按鈕 wording 恆為 **Copy**，永不 **Open**。缺 slug 之文章顯示 disabled reason，不列路徑。
- 資料來源：既有 Admin `posts` array（`publishTargets.blogger` + slug + status），無新 loader。
- 版面：Flex-first、沿用既有 Admin visual tokens（未動 `CLAUDE.md` §9.4）。

**未做（明確保留為 future enhancement）**：

- ❌ 真正讀檔 / open file / preview-only UX（Admin 區塊尾端 TODO 已列此項）。
- ❌ 觸發 build（保持 Admin 不寫 repo 之契約；使用者仍手動跑 `npm run build:blogger`）。

**狀態建議**：**Resolved for Phase 1 stability testing**。原摩擦點（找不到 per-post 檔案位置）已消除；剩餘增強（真正開檔 preview）**非 Phase 1 blocker**，若要做須另開獨立 phase + explicit approval。

---

### P1-2 — Draft 文章不被 `build:blogger` 輸出（除非 `status: ready` / `draft: false`）

**原始問題**：Blogger draft-preview 鏈路測試中，Dean 想預覽一篇 draft 的 Blogger 外觀，但 `build:blogger` 只收 `draft !== true` 且 `status ∈ {ready, published}` 的文章（`src/scripts/load-posts.js` `classify` 單一事實來源，`build:github` / `build:blogger` 共用）。E2E 中被迫暫改 frontmatter → build → 手動改回 → 清理 dist-blogger。

**已完成處理**：

- Commit `743bea7`「docs(blogger): inventory draft preview export eligibility」——`docs/20260708-blogger-draft-preview-export-eligibility-inventory.md` landed：
  - §2 盤點 build eligibility 規則（`classify` 單一事實來源；Blogger github-cross 需 `publishTargets.blogger.enabled === true`；mode 不參與 eligibility；無 `--include-draft` 旁路）。
  - §5 定性：主因是「1 正確設計」（deploy 安全根基）、痛點是「3 文件不足」；「2 缺功能」是可選增強、非必需。
  - §6 風險：放寬 `build:blogger` 收 draft = 違反 `CLAUDE.md` §23（任何 draft 不得進正式 dist），**不建議**。
  - §7 選項：Option A 補文件（推薦）、Option B 獨立 preview-only script（未來可選、須另開 phase）、Option C 放寬 build（不建議）。
  - §8 建議：**Option A**。
- Commit `d9a1ab7`「docs(blogger): add draft preview runbook」——`docs/20260708-blogger-draft-preview-runbook.md` landed：
  - Option A 落地成可重複之 6 步人工流程（§D 操作、§E 常見錯誤、§G 不可做事項、§H 結果紀錄模板）。
  - 明確強調：`build:blogger` 不輸出 draft 是**正確且必要**的設計；本 runbook 是人工 preview workaround、**不代表**正式發布流程；跑完 ≠ 已發布 Blogger、≠ 已 deploy GitHub Pages。

**結論**：

- `build:blogger` **不**輸出 draft 為**正確正式-build 設計**（deploy 安全根基；`CLAUDE.md` §23 紅線）；**本輪不改** build 行為 / 不動 `classify`。
- Phase 1 採**人工 preview workaround**（暫改 ready → build → 貼 Blogger draft → 改回 → cleanup），已文件化、可重複。
- Option B（preview-only script，隔離輸出 + gitignored + PREVIEW-ONLY 標記）為**未來可選增強**，非 Phase 1 blocker。

**狀態建議**：**Documented / accepted for Phase 1**。原摩擦點已由 runbook 補齊；Option B 若日後手動流程仍顯繁瑣可另開獨立 phase 評估，本輪 / 本 session **不做**。

---

### P1-3 — Blogger mobile preview 出現水平捲軸

**原始問題**：Blogger 手機版預覽（HTML 模式貼上、draft/preview）出現水平捲軸；來源可能為 Blogger 預覽工具列 / Blogger 主題 / 廣告區 / code 版面 / long URL / table 等，尚未定位。

**已完成處理**：

- Commit `879953e`「docs(blogger): audit mobile preview horizontal overflow」——`docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md` landed：
  - §2 現有證據：**證據不足**（僅 Blogger mobile preview 觀察到、GitHub Pages readonly mobile 未復現、**未** 用 DevTools 定位 overflowing element）→ **needs reproduction**。
  - §3 9 類假說（Blogger preview chrome / Blogger theme / `.lab-blogger-article` wrapper / pre / table / long URL / adsbygoogle / img / JSON-LD）。
  - §4 CSS 防護盤點：Blogger 端**刻意缺少**全域 `box-sizing: border-box` 與 page-level `.lab-site { overflow-x: clip }`（避免污染 Blogger 主題）；此為 Blogger 較易外顯捲軸的**結構性差異**，但**仍不足以判定為系統 CSS bug**。
  - §5 人工重測 checklist + Console snippet（`document.querySelectorAll('*').filter(scrollWidth > vw)`）+ 交叉驗證 GitHub Pages。
  - §6 分級規則：目前**維持 P1 / needs reproduction**；升 P0 / 降 P2 / 定為 external Blogger preview artifact 之觸發條件皆列。
  - §7 下一步 Option A（併入 runbook）→ B（Blogger-scope CSS hardening，須另開 phase）→ C（新增 static check）。
- Commit `9763db2`「docs(blogger): add overflow debug steps to preview runbook」——runbook §F「Blogger mobile preview 水平捲軸 overflow debug」章節 landed（Option A 落地）：
  - §F-1 先分類再處理（不逕自判系統 bug、也不逕自關為 external）。
  - §F-2 DevTools 步驟（開手機 viewport、逐層找超寬元素、分辨 offender 屬 9 類假說之何者）。
  - §F-3 Console snippet（列出所有 `scrollWidth > clientWidth` 元素）。
  - §F-4 判斷規則（Blogger chrome → external / project 元素 → 維持 P1 / 內容裁切 → 升 P0 / 邊界 → 降 P2）。
  - §F-5 GitHub Pages 交叉驗證。
  - §F-6 清理與紀錄。
  - Runbook §H 結果紀錄模板新增水平捲軸相關欄位（Offending element / selector / Likely source / Classification / Screenshot note）。

**結論**：

- **尚不能判定為系統 CSS bug**；不逕自關為 external Blogger preview artifact。
- **需 reproduction / offender element evidence** 才能升 P0 或降 P2 / external；下一次觀察到時走 runbook §F。
- **本輪不改 CSS**；若日後真為 project 輸出來源，Blogger-scope hardening 須另開獨立 phase + explicit approval，且**不得**改變已 live-accepted 的 GitHub Pages 輸出（byte-identical constraint）。

**狀態建議**：**Remains P1 / needs reproduction**。debug 步驟已文件化；不應在沒有 offending element 前修 CSS。

---

## C. P2 follow-up status

### P2-1 — 測試文章使用假 cover URL / JSON-LD image artifact

**原始問題**：測試文章 cover 使用 `www.test.com` 這類假 URL，導致 `build:blogger` 產出的 JSON-LD image 無意義。

**性質**：**測試資料問題**，非系統缺陷。

**已完成處理**：

- 測試文章與 `dist-blogger/` artifact 已於 E2E result 建立前由 Dean 清理（result §F Repo cleanup）；build 前狀態 tree clean，未 commit 任何 artifact。
- Blogger post **未發布**、GitHub Pages **未 deploy** → JSON-LD 假 image **未流入 live**。
- Runbook `docs/20260708-blogger-draft-preview-runbook.md` §D-4 明確提醒：
  > `cover` 使用**有效 placeholder 或正式圖**，**不要**用 `www.test.com` 這類假 URL（假 cover 會讓 JSON-LD image 無意義，且不可用於正式發布）。
- Runbook §E 亦列為常見錯誤：
  > **fake cover URL 造成 JSON-LD image 奇怪**：是**測試資料問題**，不是系統缺陷，且**不可用於正式發布**。→ 用有效 placeholder / 正式圖；正式文章嚴禁假 cover。

**狀態建議**：**Documented / accepted**。因未發布，非 Phase 1 blocker；未來正式文章依 runbook 使用有效 cover 即可，**不需**額外 code 變更。

---

## D. Phase 1 readiness implication

依 A / B / C 盤點結果評估：

| 問題 | 判定 | 依據 |
| --- | --- | --- |
| 是否有 P0 blocker？ | **none** | E2E result §E P0 = none；後續處理未引入新 P0 |
| Phase 1 是否可繼續穩定測試？ | **yes** | P1-1 resolved、P1-2 documented、P1-3 needs reproduction 但已有 debug 步驟；P2-1 為測試資料問題，非 blocker |
| 是否可以開始下一輪人工測試？ | **yes**，但**條件**：若 horizontal scrollbar 再次出現，須依 runbook §F 抓 offender 元素 | 3 篇 doc 已文件化 Blogger draft-preview 鏈路 + overflow debug 步驟 |
| 是否可以買網域 / 送 AdSense / deploy？ | **no**，本輪**不處理** | `docs/20260708-phase1-stability-readiness-inventory.md` §4.4 明列 domain / AdSense / deploy = post-Phase-1；`CLAUDE.md` §5 分階段 + §27 修改規則 |

**caveat**：本判定基於 repo 內 read-only guard + Dean 既有人工驗收；Claude 未登入任何 Google / Blogger / GA4 / AdSense / GSC 後台，未 build / deploy。

---

## E. 下一個 safe slice 建議（最多 3；標推薦順序）

**候選 1（推薦 #1）— 第三次小型人工 smoke，docs-only 執行紀錄**

- **內容**：Dean 依既有材料執行一次小型（單篇 / short flow）Blogger draft-preview smoke：
  - 依 `docs/20260708-blogger-draft-preview-runbook.md` §C 前置檢查 → §D 6 步操作。
  - **重點驗收**：
    1. Admin `/#blogger-export` 之 per-post output paths helper（P1-1 fix）是否**真的順手** —— copy folder / post.html / copy-helper / publish-checklist / meta 路徑按鈕是否直接可用、是否減少手動找檔摩擦。
    2. Runbook §D-4「暫改 status: ready / draft: false → build → 改回 → cleanup」流程是否**真的可重複** —— 特別是 §D-10 改回 + §D-11 cleanup 步驟是否清晰、tree 是否確實回到 clean。
  - **產出**：新增 `docs/<YYYYMMDD>-phase1-third-manual-e2e-result.md`（結果紀錄；PASS / FAIL / N/A 由 Dean 判定）。
- **界線**：只到 Blogger draft/preview；**不**發布、**不** deploy、**不** commit 測試文章。docs-only 紀錄。
- **風險**：極低（人工執行 + docs-only 紀錄；界線與 runbook 相同）。
- **前置**：本 doc 落地並確認 baseline。

**候選 2（推薦 #2，僅在 §F 抓到 offender 時觸發）— Blogger-only CSS scope hardening mini-slice**

- **觸發條件**：Dean 於某次執行 runbook 時抓到具體 offending element（tag / class / scrollWidth）且屬 `.lab-blogger-article` 內專案輸出（如 `pre` / `table` / long URL / `.lab-ad-slot`）。
- **內容**：於 `.lab-blogger-article` scope 內針對性補防護（audit §7 Option B），例如 table wrapper `overflow-x:auto`、body `overflow-wrap`、ad slot `max-width:100%`。
- **強約束**（audit §7 Option B / `CLAUDE.md` dual-block surface-gating 精神）：
  - **僅**動 Blogger CSS scope；**不得**改變已 live-accepted 之 GitHub Pages 輸出（byte-identical）。
  - 逐項先做 acceptance；warning-only-first 若需 static check（audit §7 Option C）。
  - 屬 code 變更 = **獨立 phase + explicit approval**。
- **風險**：中（涉及 CSS；須逐項 acceptance）。
- **前置**：候選 1 或後續 E2E 已抓到具體 offender。

**候選 3（推薦 #3）— Phase 1 stability closeout checklist / RC note（docs-only）**

- **內容**：若 Dean 準備進入 release 管理，可 docs-only 落地一份 Phase 1 stability closeout checklist（例如 `docs/<YYYYMMDD>-phase1-stability-closeout-checklist.md`）或 RC note，聚合本 doc + `20260708-phase1-stability-readiness-inventory.md` + `20260708-phase1-second-manual-e2e-result.md` + 本 P1/P2 status，作為進入下一階段（domain / AdSense / deploy 前）之 sign-off 依據。
- **界線**：docs-only；**不** build / deploy / 動 domain / AdSense / GA4 / GSC。
- **風險**：低。
- **前置**：候選 1 完成、且 Dean 有下一階段規劃需求。

**推薦順序**：候選 1（真正驗證 P1-1 / P1-2 workflow 是否順手）→ 候選 2（僅在抓到 offender 時觸發，非固定下一步）→ 候選 3（release 管理需求出現時再考慮）。

**皆須 Dean explicit approval 才於獨立 phase 執行。本 session 不實作任一候選（本 session 僅落地本 closeout inventory）。**

---

## F. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔。**不含**任何程式 / frontmatter / settings / build / deploy / dev-server 變更；不新增 guard / npm script；不修 CSS；不改 `CLAUDE.md` / `MEMORY.md` / `memory/`；不觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages / 未發布 Blogger；未新增測試文章 / artifact；未購買網域 / 未動 DNS / 未碰 AdSense·GA4·Blogger·GSC 後台。§0 之 boot baseline 為 read-only 驗證；§B / §C 之 resolved / documented / needs reproduction 狀態均為對既有 commits 與 docs 之盤點結論，未代替 Dean 宣告任何新 PASS；§E 之候選皆為建議，**未**實作，各須 Dean explicit approval 才於獨立 phase 執行。

---

## See also

- `docs/20260708-phase1-second-manual-e2e-result.md`（第二次人工 E2E 結果 / P0-P1-P2 分級來源）
- `docs/20260708-phase1-second-manual-e2e-test-packet.md`（第二次 E2E 測試包 + 紀錄模板）
- `docs/20260708-blogger-draft-preview-runbook.md`（P1-2 documented；含 §F overflow debug = P1-3 needs-reproduction 步驟）
- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（P1-2 盤點依據 / Option A/B/C 決策）
- `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md`（P1-3 audit / 9 類假說 / Blogger 端 CSS 防護 gap）
- `docs/20260708-phase1-stability-readiness-inventory.md`（Phase 1 穩定測試就緒盤點；readiness umbrella 來源）
- `docs/20260702-phase1-manual-e2e-runbook.md`（第一次人工 E2E：github-site happy-path PASS）
- `src/views/admin/index.ejs`（P1-1 fix landed in commit `38a4e98`；Blogger Export 區塊 per-post output paths helper）
- `src/scripts/load-posts.js`（`classify` 單一事實來源；`build:github` / `build:blogger` 共用 draft/status 閘門）
- `src/scripts/build-blogger.js`（Blogger 渲染 / 輸出路徑）
- `src/scripts/admin-markdown-export.js`（Admin 恆 draft 契約；`check:admin-markdown-export` 256/256）
- `CLAUDE.md` §5（分階段）、§9.4/§9.5（Flex-first / SCSS 歸類）、§10（Blogger design token 匯出）、§17（文章頁版型）、§23（發布狀態；draft 不得進正式 dist）、§26（package.json 指令）、§27（Claude Code 修改規則）、§28（MVP 必做）、§29（第一版不做）
