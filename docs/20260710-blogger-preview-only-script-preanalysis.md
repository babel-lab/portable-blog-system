# Blogger preview-only script Option B preanalysis（docs-only）

- 建立日期：2026-07-10（Asia/Taipei）
- 類型：docs-only **preanalysis note**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 目的：評估未來（若 Dean explicit approval）是否值得新增一支 Blogger preview-only helper 之基本 scope、允許 / 禁止行為、安全 gate、命名候選與接受條件。本 session **不**實作 script、**不**動 package.json、**不**改 build 行為，僅落地一份可供未來實作 phase 引用之 preanalysis。
- 觸發：Phase 1 RC handoff 後續小切片；`docs/20260710-phase1-rc-next-readiness-analysis.md` §7 排名 #4（候選 D）；`docs/20260710-phase1-rc-handoff-operating-readout.md` §6 候選 D；`docs/20260708-blogger-draft-preview-export-eligibility-inventory.md` §7 Option B / §9 S2 之延伸 preanalysis。
- 本輪界線（docs-only）：**不**改程式 / **不**新 guard / **不**新 npm script / **不** build / **不** preview / **不** deploy / **不**碰 deploy clone 寫入 / **不**改任何 frontmatter / **不**改任何 sidecar `.publish.json` / **不**動 Blogger backfill 語意（`check:blogger-backfill` 維持 report-only）/ **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / **不**買網域 / **不**設 DNS / **不**建 `CNAME` / **不**建 `ads.txt` / **不**啟用 AdSense / **不**改 AdSense production behavior / **不**碰 Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 / **不**動 `CLAUDE.md` / `MEMORY.md` / `memory/`。
- 本輪允許 mutation：新增本檔（唯一）+ commit + push origin/main。

---

## 0. Boot baseline（本輪已驗）

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `c0ee384` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅（read-only 驗證） | `0 / 0` | clean | absent ✅ |

Source HEAD full hash = `c0ee384df3b67ed0c4b276f100a32cb5ae118030`；subject `docs(release): define domain adsense gates`。前 5 commit：`e477a75`（`docs(blogger): record backfill write preflight`）→ `a9003e8`（`docs(state): record phase1 rc next readiness`）→ `f42ba32`（preview sanity）→ `d73492b`（admin export workflow alignment）→ `4e34d20`（rc handoff readout）。

Deploy HEAD full hash = `1170e7e14aaa7f3449999bf92b9c8586719a76b4`（read-only 驗證；本 session 未寫入 deploy clone）。

Readiness checks 於前一輪已跑（本 recovery 復用；本 doc landing 前後將 re-run）：

| # | 指令 | 預期 Exit | 說明 |
| --- | --- | --- | --- |
| C-1 | `npm run check:phase1-readiness` | 0 | validate 0/135/107、npm-script-targets 48/48、adsense-mode 0 warn、blogger-backfill 7 missing report-only、prepublish 16/16、smoke 8/8 |
| C-2 | `npm run check:phase1-readiness-contract` | 0 | 22/22 PASS |

判定：baseline 完全一致；readiness 未 drift；backfill guard 維持 report-only；無 partial work、無 orphan artifact。

**Recovery note**：前一次 session 於本 doc 撰寫過程中因 `API Error: The socket connect...` 中斷；本 recovery 檢查（`git status --short` / `git diff --stat` / `git diff --check` / 目標 docs 檔存在檢查）全部 clean、無 partial file、無 `.git/index.lock`。判定：中斷發生於任何 filesystem write 之前；本輪從零開始寫本 doc、無沿用半截草稿。

---

## 1. 結論（先講結果）

**A. 現有 `build:blogger` 已足夠支援 Blogger preview**。逐項對照：

- `build:blogger` 為 ready-only 正式 build（`load-posts.js` 之 `classify`；`draft !== true` 且 `status ∈ {ready, published}`）；輸出 `dist-blogger/posts/<slug>/post.html` / `copy-helper.txt` / `publish-checklist.txt` / `meta.json`。
- 手動 draft-preview 流程已於 `docs/20260708-blogger-draft-preview-runbook.md` §D 10 步完整可重複；`docs/20260710-blogger-preview-sanity-analysis.md` §5 補齊 40 項 sanity checklist。
- Admin `#blogger-export` 為 source-driven（不看 `dist-blogger/` 是否存在）；per-post 5 顆 Copy 按鈕（folder / `post.html` / `copy-helper.txt` / `publish-checklist.txt` / `meta.json`）恆常 render；`be-notice` 2 步指引明示「先跑 `npm run build:blogger` → 打開 dist-blogger 路徑」（`docs/20260710-blogger-admin-export-workflow-alignment.md` §2 逐行盤點）。

**B. 短期不需新增 preview-only helper**。理由：

1. 現有 workflow 已可重複、已 documented、已通過 3 次 E2E / smoke（`docs/20260708-phase1-second-manual-e2e-result.md` / `-third-manual-smoke-result.md`）。
2. Preview-only helper 之最小合理 scope（見 §6）為**唯讀 navigator**（列 `dist-blogger/posts/<slug>/` 路徑 / 存在性 / build 建議），不改 build 行為；此 scope 之收益低於 Admin `#blogger-export` per-post Copy 按鈕（既有）+ runbook §D-6 打開檔（既有）。
3. Preview-only build（`docs/20260708-blogger-draft-preview-export-eligibility-inventory.md` §7 Option B / draft-aware `dist-blogger-preview/`）之收益中等但風險非零（需新 dist 目錄 / gitignore 對齊 / PREVIEW-ONLY 標記 / cleanup 契約）；只有 Dean 手動流程仍顯繁瑣時才啟動獨立 phase。

**C. 若未來啟動 Option B**，必須以下三條紅線同時滿足：

1. **不改 `build:blogger` 行為、不改 `classify`、不改正式 `dist-blogger/`**（`CLAUDE.md` §23 draft 不得進正式 dist）。
2. **不寫入 content / frontmatter / `.publish.json` sidecar / `CLAUDE.md` / `MEMORY.md` / `memory/`**（read-only or `dist-blogger-preview/`-only）。
3. **不呼叫 Blogger API / 不猜 Blogger IDs / 不改 AdSense production 行為 / 不 deploy / 不動 gh-pages**（`CLAUDE.md` §3a Red lines）。

**D. Recommendation = remain docs-only**。本 doc landing 後不啟動 Option B；若 Dean 於未來 Session 明確判斷手動流程繁瑣，另開獨立 phase + explicit approval（`CLAUDE.md` §3a Recommended next paths；§7 idle freeze）。本 doc 不代 Dean 決策、不主動實作。

---

## 2. Current Blogger preview workflow

依 `docs/20260710-blogger-admin-export-workflow-alignment.md` §3、`docs/20260708-blogger-draft-preview-runbook.md` §D、`docs/20260710-blogger-preview-sanity-analysis.md` §5，現有 workflow 摘要：

```
Step 1  Admin #blogger-export → 找到目標 blogger-enabled 文章的 per-post output paths
        （5 顆 Copy 按鈕：folder / post.html / copy-helper.txt / publish-checklist.txt / meta.json）
Step 2  terminal: npm run build:blogger
        （Admin 全區「Copy build command」按鈕可複製此指令）
Step 3  build 產出檔案於 dist-blogger/posts/<slug>/
        （dist-blogger/* 已 gitignored；只保留 .gitkeep）
Step 4  手動開 dist-blogger/posts/<slug>/post.html → 複製 HTML
        → Blogger 後台切 HTML 模式貼上 → 儲存 draft → 使用 Blogger preview
Step 5  依 preview sanity checklist（40 項）逐項驗證
Step 6  改回 draft / 清理 dist-blogger/ / git status --short 回到 clean
```

**Key facts**：

- **`build:blogger` 不依賴 GitHub Pages deploy**：Blogger preview 為獨立驗證管道；不需 push gh-pages、不需 deploy clone、不需 online GitHub Pages。
- **不需登入 Blogger 之後才能看**：Blogger 後台之 draft / preview 為 Dean 手動操作；Claude 不代登入。
- **Admin 恆為 read-only / source-driven**：不讀 `dist-blogger/`、不代 build、不代開檔（`src/views/admin/index.ejs` 2938–2942 `be-notice` 契約）。
- **每篇 build 產出 4 檔**：`post.html`（Blogger 可貼）/ `copy-helper.txt`（複製輔助）/ `publish-checklist.txt`（發布前檢查）/ `meta.json`（metadata 對照）。
- **draft 一律不進 dist-blogger/**：手動 preview 須依 runbook §D-4 暫改 `status: ready` + `draft: false` → 產 HTML → 貼 Blogger draft → §D-10 改回 draft → §D-11 清 dist-blogger/。

**Recap 一句話**：現有 workflow 已可覆蓋「不 deploy、不發布、只手動看 Blogger 外觀」之完整場景。

---

## 3. Why a preview-only helper might help

未來 Dean 若手動流程仍顯繁瑣，preview-only helper 之潛在價值：

- **降低找檔摩擦**：目前 Dean 須於 Admin `#blogger-export` per-post card 複製路徑後、於 file explorer / terminal 手動開檔；一支 helper 可**一步列出 target 文章之全部 output 檔存在性**（例如：先 `build:blogger` 未跑則提示、跑過則列 4 檔 mtime / 大小 / 路徑）。
- **降低忘改 draft 風險**：runbook §D-10 之「改回 draft」為手動操作、Dean 曾表達過此為主要隱患；helper 可於 preview 結束時**檢查測試檔是否仍為 `ready`**（read-only warning，不動 frontmatter）。
- **降低跨 doc 拼湊摩擦**：目前 workflow 分佈於 5 份 docs（alignment / runbook / sanity checklist / eligibility inventory / RC handoff readout）；helper 可以 console output 集中提示對應 doc（例：「本 helper 為 read-only；下一步請對照 preview sanity checklist §5.1–§5.9」）。
- **降低 hallucination 風險**：Dean 之前 session 曾把 Admin markdown export 誤讀為 Blogger HTML；helper 可 output 明確警語（例：「Admin markdown 屬 draft raw markdown；本 helper 只讀 dist-blogger/ 之 HTML build 產出」）。

**但**：以上潛在價值均為**便利性**，非 blocker、非阻擋 Phase 1 RC。目前僅 Dean 一人手動測試；helper 之開發成本（一支 script + guard + smoke + 對應 doc / phase）暫大於便利性收益。

---

## 4. Why it is not required yet

- **Phase 1 RC 已 stable**（`docs/20260710-phase1-rc-next-readiness-analysis.md` §4）；readiness 兩支 guard exit 0；三次手動 E2E / smoke 皆 PASS。
- **既有 workflow 已 documented + repeatable**：runbook 10 步 / sanity checklist 40 項 / alignment audit 7 觸點；每份 doc 皆 landed、可重複 lookup。
- **Admin 5 顆 Copy 按鈕已 landed**（`38a4e98` P1-1 fix；`docs/20260708-phase1-p1-followup-closeout-inventory.md` §B）；per-post 找檔摩擦已顯著降低。
- **Preview 頻率仍低**：Phase 1 RC 之 blogger-native + github-cross 之 blogger-enabled 文章總量有限（`check:blogger-backfill` 顯示 candidate 7 篇）；未來 Phase 2 若批量發文才需 helper 加速。
- **Preview-only helper 本身有維護成本**：新 script 需納入 `check:npm-script-targets` guard、須撰寫 dry-run smoke、須避免與 Admin 5 顆 Copy 按鈕語意重疊；不能無條件視為「純加分」。
- **Dean 於本 session briefing 明列 idle freeze / 不啟動 script implementation**；先 landing 一份 preanalysis 即可，實作留給未來 Session。

**判定：目前不啟動；本 doc 為未來 Session 之 anchor / lookup**。

---

## 5. Option A：keep docs-only manual workflow（recommended default）

**Scope**：不動任何 code / build / guard；沿用既有 5 份 docs + Admin `#blogger-export` per-post Copy 按鈕。

**Dean 之手動流程**（sequential）：

1. 開 Admin `#blogger-export` 找目標文章 per-post card；複製 output paths。
2. terminal 跑 `npm run build:blogger`。
3. 打開 `dist-blogger/posts/<slug>/post.html`；複製 HTML 內容。
4. Blogger 後台切 HTML 模式；貼上；儲存 draft；使用 Blogger preview。
5. 依 preview sanity checklist（`docs/20260710-blogger-preview-sanity-analysis.md` §5）逐項勾。
6. 改回 draft（runbook §D-10）+ 清 dist-blogger/（runbook §D-11）。
7. `git status --short` 回到 clean。

**優點**：

- 零 code 變更、零紅線風險、零實作 phase。
- 立即可用（本 session 及以後皆可）。
- 與 Admin idle freeze 一致（`CLAUDE.md` §3a）。

**缺點**：

- 仍是手動；找檔仍分兩步（Admin 複製路徑 → file explorer 開檔）。
- 「改回 draft」風險依賴人工紀律 + sanity checklist §5.9 recap；無 automated 提醒。
- 5 份 docs cross-reference 對新 tester 仍有學習曲線。

**判定**：本 session 之 **default recommendation**；本 doc landing 後即維持此路徑，除非 Dean 明確要 Option B。

---

## 6. Option B：future preview-only helper（potential; not now）

**Scope**：於未來獨立 phase + Dean explicit approval 下，新增一支唯讀 helper script。以下兩個變體皆為 Option B 之落地形態；本 doc 不代 Dean 選擇。

### 6.1 Variant B1 — read-only navigator（本 session briefing 首選）

**行為**：

- 讀 `dist-blogger/posts/<slug>/` 目錄；列 4 個 output 檔（`post.html` / `copy-helper.txt` / `publish-checklist.txt` / `meta.json`）之存在性 / mtime / size。
- 若 `dist-blogger/posts/<slug>/` 不存在（未跑 build），output 明確提示：「先於 terminal 跑 `npm run build:blogger`」，並列出 command。
- 若指定 slug 不存在於 content/blogger/posts/ 也不存在於 dist-blogger/posts/，output warning + 建議 double-check slug。
- 可選：output 對應 doc 之 pointer（例：「請對照 preview sanity checklist §5.1–§5.9」）。
- **不 build**、**不觸發 dev-server**、**不呼叫任何 external API**、**不寫入任何檔**、**不改 frontmatter**、**不動 dist-blogger 內容**、**不動 dist-blogger-preview**（B1 不建立新 dist 目錄）。
- Command line：接 slug 或空（列所有 blogger-enabled candidates）。
- 若走 npm script，屬 read-only guard 語意（類似 `check:blogger-backfill` 之 report-only 契約）。

**優點**：

- Zero risk to build / classify / production dist；純 navigator。
- 收益明確（一步列出 output 檔存在性 vs 目前手動 file explorer 開多步）。
- 不需 gitignore 對齊 / 不需新 dist 目錄 / 不需 PREVIEW-ONLY 標記。

**缺點**：

- 收益偏低（Admin 5 顆 Copy 按鈕 + runbook 已能覆蓋；navigator 只把「用 Admin 複製 → 用 file explorer 開」壓縮成「跑 script → console 提示」，仍需人工開檔貼 Blogger）。
- 未解決 draft-preview 之「改 ready → build → 改回」摩擦（該摩擦屬 B2 scope）。

### 6.2 Variant B2 — draft-aware preview build（原 `20260708` inventory §7 Option B）

**行為**：

- 建立獨立 `dist-blogger-preview/` 目錄；`.gitignore` 加入該目錄。
- 讀指定 slug（可含 draft）；產出 HTML / copy-helper / meta（可省 publish-checklist）；輸出檔頂部 / metadata 明確標記 `PREVIEW-ONLY / NOT FOR DEPLOY`。
- **不改** `build:blogger` / `classify` / `load-posts.js` / 正式 `dist-blogger/`。
- 命令列須要求指定 slug（避免無腦全部 build 進 preview dist）。
- 可選：於 helper 結束時提示「本輸出僅供本機 preview；勿 deploy、勿貼正式 Blogger 發布」。
- **不寫入** content / frontmatter / `.publish.json` / `CLAUDE.md` / `MEMORY.md` / `memory/`。
- **不呼叫** Blogger API、**不猜** Blogger IDs、**不改** AdSense production 行為。

**優點**：

- 根治「改 ready → build → 改回」摩擦；預覽 draft 不必動 frontmatter。
- 保留 `build:blogger` ready-only 語意（`CLAUDE.md` §23 紅線不變）。

**缺點**：

- 收益中等；風險非零（新 dist 目錄 / gitignore 對齊 / PREVIEW-ONLY 標記 / cleanup 契約 / 與 admin `#blogger-export` per-post 顯示邏輯之對齊）。
- 實作成本高於 B1（新 renderer entrypoint / 新 dist 產出邏輯 / 新 smoke / 新 doc）。
- 對 Phase 1 RC 之收益偏低（Dean 目前預覽頻率仍低）。

### 6.3 Variant 選擇建議（未來 phase 用）

- 若 Dean 之痛點主要為「找檔」→ 選 B1。
- 若 Dean 之痛點主要為「改 ready / 改回 draft 忘記」→ 選 B2。
- 兩者可**串行實作**（先 B1，再視需求評估 B2）；**不建議捆綁**；**不建議** parallel 開兩支 script。

---

## 7. Allowed behavior for future helper

以下行為為未來 Option B 實作時之**允許清單**（cumulative；white list）：

- ✅ 讀 `dist-blogger/` 之現有 output（B1 navigator）
- ✅ 讀 `content/blogger/posts/*.md` frontmatter（read-only、只 parse、不 re-serialize）
- ✅ 讀 `content/settings/*.json`（read-only）
- ✅ Console output 之 path / mtime / size / build 建議 / doc pointer
- ✅ 於獨立 `dist-blogger-preview/` 產 preview HTML（**僅** B2 variant；且該目錄須 gitignored）
- ✅ Exit code 表達 success / warning / error（類似 `check:blogger-backfill` 語意）
- ✅ 支援 `--dry-run` flag（若有 filesystem write 動作，B2 之預設應為 dry-run）
- ✅ 支援 slug 指定 / listing mode 之 CLI arg
- ✅ 註冊於 `package.json` 之 `scripts`（**未來 phase**）+ `check:npm-script-targets` guard
- ✅ 對應 doc（runbook update / smoke / phase closeout doc）

---

## 8. Forbidden behavior for future helper

以下為未來 Option B 實作時之**絕不允許清單**（cumulative；red line；違反即 abort）：

| 項目 | 為何禁止 |
| --- | --- |
| 寫入 `content/**/*.md` frontmatter | frontmatter 為 content 屬性；helper 為 preview tooling、非 content editor |
| 寫入 `.publish.json` sidecar | sidecar 屬 platform metadata；backfill write 專屬另一 phase（`docs/20260710-blogger-backfill-write-phase-preflight.md`） |
| 寫入 `.fb.md` sidecar | FB sidecar 屬另一 dormant 線；helper 不應碰 |
| 寫入 `content/settings/**` | 站台設定；preview helper 不改站台 |
| 改變 `build:blogger` 行為 / `classify` / `load-posts.js` | `CLAUDE.md` §23 draft 不得進正式 dist；改變 = 破壞紅線 |
| 動正式 `dist-blogger/` 內容（B1 完全不動；B2 只動 `dist-blogger-preview/`） | 正式 dist 為 deploy 依據；不得由 preview 工具污染 |
| Deploy / push gh-pages / 動 deploy clone | preview helper 為 source-only 工具；deploy 屬另一獨立 phase |
| 呼叫 Blogger API（authentication / publish / update / list / delete） | Blogger API flow 未落地；`CLAUDE.md` §29 第一版禁止 |
| 猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` | `CLAUDE.md` §3a Red lines；`docs/20260706-blogger-identity-and-backfill-strategy.md` |
| 生成 / 假造任何 Blogger internal ID | 同上 |
| 改變 AdSense production script / slot loading / serving 行為 | AdSense red line；`CLAUDE.md` §3a |
| 洩漏 real AdSense `client id` / `slot id` 至 console output / dist-blogger-preview 檔案 | `CLAUDE.md` §3a Red lines；real IDs 只存於 `content/settings/ads.config.json` |
| 動 GA4 / Google Drive / Search Console / DNS / domain 後台 | `CLAUDE.md` §3a Red lines / §29 |
| 動 `CLAUDE.md` / `MEMORY.md` / `memory/**` | State / memory 屬另一 sync phase；helper 不應碰 |
| 動 `package.json` / `package-lock.json` 於執行時（非註冊 phase） | 執行時修改 package.json 屬 write-path；helper 為 read-only |
| 打開 dev-server / 觸發 Vite build | 不需要；navigator 為 file system read-only |
| 產出 preview 供正式發布 / 誤導 Dean 貼正式 Blogger | B2 之 output 必須明確 PREVIEW-ONLY / NOT FOR DEPLOY |

---

## 9. Required safety gates

未來實作 phase 若啟動，須全數滿足以下 gates 才可 landing（cumulative；缺一即不 landing）：

### 9.1 Baseline gates

- **G-B1**：Source repo baseline 對照 `memory/project_baseline.md`：`main` HEAD == `origin/main`、`0 / 0`、clean、`.git/index.lock` absent。
- **G-B2**：Deploy clone baseline 對照：`gh-pages` HEAD == `origin/gh-pages`、`0 / 0`、clean、`.git/index.lock` absent（preview helper 不動 deploy，但驗 baseline）。
- **G-B3**：`check:phase1-readiness` exit 0；`check:phase1-readiness-contract` 22/22 PASS。

### 9.2 Scope gates

- **G-S1**：實作 phase 為 **source-only**、不與 memory-sync / docs-only 混合（`memory/feedback_phase_discipline.md`）。
- **G-S2**：Helper 為 read-only（B1）或僅寫入獨立 `dist-blogger-preview/`（B2）；**不動** 正式 `dist-blogger/`。
- **G-S3**：B2 之 `dist-blogger-preview/` 於同 phase 內加入 `.gitignore`；避免污染 repo。
- **G-S4**：Helper CLI 有 `--dry-run` flag；B2 之 default 應為 dry-run（避免無意間產出）。
- **G-S5**：不新增 preview helper 之外的 script（例：不順便加 preview-only guard、preview manifest 等）。

### 9.3 Behavioral gates

- **G-B-a**：Helper 之單次執行不動 `content/` / `src/` / `settings/` / `.publish.json` / `.fb.md`。
- **G-B-b**：不 build / 不 deploy / 不 push / 不動 gh-pages / 不動 deploy clone。
- **G-B-c**：不呼叫 external API（Blogger / GA4 / AdSense / GSC / Google Drive）。
- **G-B-d**：不修改 `CLAUDE.md` / `MEMORY.md` / `memory/**`；state / memory sync 屬另一 phase。
- **G-B-e**：Commit 不使用 `--no-verify` / `--no-gpg-sign`；hook 失敗即 abort、fix root cause、re-commit。
- **G-B-f**：Helper 不寫入 real AdSense IDs / GA4 measurement IDs / 任何 secret 至 console / dist。

### 9.4 Validation gates

- **G-V1**：新 helper 有 smoke test（`check:blogger-preview-smoke` 或等價），smoke 覆蓋：happy-path / slug-not-found / dist-blogger-absent / stale-mtime / read-only 保證。
- **G-V2**：`check:npm-script-targets` 上升為 49/49（B1 加 1）或 50/50（B2 加 2）；無 registration miss。
- **G-V3**：`check:phase1-readiness` 之 forbidden token 未新增（保持 13 條 forbidden absent）；helper 不進 phase1-readiness umbrella。
- **G-V4**：`check:release-readiness` 之 forbidden token 未新增；helper 不進 release-readiness umbrella。
- **G-V5**：`validate:content` exit 0（helper 之新增檔案不影響 content validation）。

### 9.5 Docs gates

- **G-D1**：Helper 有對應 doc（實作 phase 之 landing note）；沿用 `docs/20260708-blogger-draft-preview-runbook.md` 之格式。
- **G-D2**：Runbook §D 更新（若 B1）或 §I 標示（若 B2 landed）；docs update 為同 phase 之 additive 動作。
- **G-D3**：Preview sanity checklist（`docs/20260710-blogger-preview-sanity-analysis.md` §5）更新 §5.0 前置段，指向新 helper。

---

## 10. Suggested command naming（本 session **不**實作）

以下為未來實作 phase 之命名候選；本 session 僅列討論，**不動 package.json**：

| 候選 | 對應 variant | 優點 | 缺點 |
| --- | --- | --- | --- |
| `preview:blogger` | B1 / B2 | 語意直觀（「Blogger preview」）；短 | 與 `preview`（Vite preview server）字面相近；可能與 GitHub Pages preview 語意混淆 |
| `blogger:preview` | B1 / B2 | 命名空間清楚（Blogger scope）；不與 Vite `preview` 衝突 | 較長；命名空間前綴不與現有 `check:*` / `build:*` / `validate:*` 一致 |
| `check:blogger-preview` | B1（navigator） | 與 `check:blogger-backfill` / `check:adsense-*` 風格一致；語意 read-only | 若後續進化為 B2 build variant 則語意不符（`check:*` 通常不產檔） |
| `build:blogger-preview` | B2（draft-aware build） | 與 `build:blogger` / `build:github` 對稱；語意產檔 | 若同時 landing B1 navigator 則命名需另一支 |
| `blogger:navigate` / `blogger:paths` | B1 only | 語意精確（navigator）；不與 build 混 | 命名離既有慣例遠 |

**建議命名決策原則（未來 phase）**：

- 若先實作 B1（navigator）：`check:blogger-preview`（read-only 語意）；未來 B2 landing 時再引入 `build:blogger-preview`。
- 若跳過 B1、直接實作 B2：`build:blogger-preview`。
- **不建議** 於 B1 / B2 之間搖擺；**不建議** 一次 landing 兩支。
- **不建議** 命名為 `preview:blogger`（易與 Vite `preview` 混淆）。

---

## 11. Acceptance criteria if Dean later approves implementation

未來實作 phase 之 landing 判準（cumulative）：

### 11.1 If Dean approves B1（navigator）

- [ ] Helper `src/scripts/check-blogger-preview.js` 落地；純 read-only；只讀 `dist-blogger/` + `content/blogger/posts/*.md` frontmatter。
- [ ] `package.json` scripts 新增 `check:blogger-preview`；`check:npm-script-targets` 49/49（或更多）PASS。
- [ ] Helper 之 CLI 支援 slug 指定 / listing mode / `--dry-run`（雖 B1 本身無 write）。
- [ ] Helper 之 exit code：happy-path exit 0、build-not-run warning-only exit 0、slug-not-found warning-only exit 0、file crash exit 1。
- [ ] Console output 包含：Admin `#blogger-export` 對照提示、`build:blogger` 建議指令、`docs/20260710-blogger-preview-sanity-analysis.md` §5 對照 pointer。
- [ ] Smoke test（`check:blogger-preview-smoke` 或 embedded）覆蓋 happy-path + 4 種 mismatch case（dist-absent / slug-not-found / stale-mtime / broken-file）；smoke n/n PASS。
- [ ] Runbook §D-6 更新（提示 helper 為 optional / recommended）；preview sanity checklist §5.0 前置段更新。
- [ ] `check:phase1-readiness` exit 0；`check:phase1-readiness-contract` 22/22 PASS。
- [ ] `check:release-readiness` exit 0 / `-contract` 14/14 PASS（無 forbidden token 引入）。
- [ ] `validate:content` 0 error / 135 warning / 107 post（不變）。
- [ ] `git status --short` 之 diff 白名單：`src/scripts/check-blogger-preview.js` / `package.json` / `docs/<landing-note>.md`（+ runbook / sanity checklist 更新）。
- [ ] Commit subject 建議：`feat(blogger): add preview navigator helper`；不含 `build` / `deploy` / `push` token。

### 11.2 If Dean approves B2（draft-aware preview build）

- [ ] B1 已 landed（**建議** 先 B1 / 再 B2）或 Dean 明示跳過 B1。
- [ ] Helper `src/scripts/build-blogger-preview.js` 落地；讀 slug（可含 draft）、產 `dist-blogger-preview/posts/<slug>/`。
- [ ] `.gitignore` 加 `dist-blogger-preview/*`；driver / build manifest 加 PREVIEW-ONLY 標記。
- [ ] `package.json` scripts 新增 `build:blogger-preview`；`check:npm-script-targets` PASS。
- [ ] Output HTML top comment / meta.json 明確標 `PREVIEW-ONLY / NOT FOR DEPLOY`。
- [ ] Helper CLI 需 slug（不 accept 空 = 避免無腦全部產出）；`--dry-run` 為 default。
- [ ] `build:blogger`（正式）之行為 byte-identical（`load-posts.js` `classify` 不動；正式 `dist-blogger/` 內容不動）。
- [ ] `check:phase1-readiness` / `-contract` / `check:release-readiness` / `-contract` / `validate:content` 全 exit 0 / 契約 PASS。
- [ ] Smoke 覆蓋：happy-path / draft slug / ready slug / missing slug / gitignore 對齊；smoke n/n PASS。
- [ ] Runbook §D 更新（新增「B2 alternative」段落，不刪 §D 原 10 步）；preview sanity checklist §5 更新。
- [ ] Commit subject 建議：`feat(blogger): add preview-only build helper`。

### 11.3 Cross-cutting acceptance（B1 或 B2 皆須滿足）

- [ ] **No forbidden token** 進入 `check:phase1-readiness` / `check:release-readiness` 之 script text（`build` / `deploy` / `push` / `gh-pages` / `dist` / `publish` / `write` / ...）。
- [ ] **Deploy clone 未動**。
- [ ] **Blogger backfill guard** 未動；仍 report-only（missing 7）。
- [ ] **Custom domain / AdSense** 未動；`content/settings/ads.config.json` 未動；`CNAME` / `ads.txt` 未建。
- [ ] **無** Blogger API / GA4 / GSC 呼叫。
- [ ] **無** frontmatter / sidecar 動作。
- [ ] `CLAUDE.md` / `MEMORY.md` / `memory/**` 未動於同 commit；state / memory sync 屬 helper landing 之後之獨立 minimal slice。

---

## 12. Non-goals for this session

本 session 明確不做（cumulative；違反即 abort）：

| 項目 | 狀態 |
| --- | --- |
| 實作 Option B（B1 navigator / B2 preview build） | ❌ 未做 |
| 新增任何 script（`check:blogger-preview` / `build:blogger-preview` / preview:blogger / blogger:preview） | ❌ 未新增 |
| 修改 `package.json` / `package-lock.json` | ❌ 未動 |
| 修改 `.gitignore` | ❌ 未動 |
| 修改 `src/**` / `views/**` / `styles/**` / `js/**` / `scripts/**` | ❌ 未動 |
| 修改任何 frontmatter / `.publish.json` sidecar / `.fb.md` | ❌ 未動 |
| 修改 `content/settings/**` | ❌ 未動 |
| build / preview / deploy / push gh-pages / 動 `dist*` | ❌ 未做 |
| 動 deploy clone（僅 §0 read-only 驗證）| ❌ 未寫入 |
| 動 `CLAUDE.md` / `MEMORY.md` / `memory/**` | ❌ 未動 |
| 動 Blogger backfill 語意（`check:blogger-backfill` 維持 report-only）| ❌ 未動 |
| 猜 Blogger `publishedUrl` / `bloggerPostId` / `publishedAt` / `bloggerBlogId` | ❌ 未猜 |
| Blogger 後台 / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 | ❌ 未動 |
| Admin write path / Apply / middleware / admin-write-cli | ❌ 未動 |
| Reverse UTM pm-26 deploy | ❌ 未動 |
| Second GitHub Pages deploy / `github-pages-blog-planning` quarantine 解除 | ❌ 未動 |
| Blogger AdSense Batch 2 P2 live repost | ❌ 未動 |
| Custom domain / DNS / `CNAME` / `ads.txt` / AdSense formal application | ❌ 未動 |
| Phase 1 final 之降級 / 重新封存 | ❌ 未動 |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | ❌ 未做 |

---

## 13. Recommendation

**Recommendation = remain docs-only；不啟動 Option B**。

理由：

1. 現有 workflow 已可覆蓋所有 Phase 1 RC 場景；readiness 未 drift；三次 E2E / smoke 皆 PASS。
2. Preview-only helper 之收益偏低（Admin 5 顆 Copy 按鈕 + runbook + sanity checklist 已能覆蓋）；未來 phase 之開發成本大於當前便利性收益。
3. Dean 於本 session briefing 明列「不要實作 script」；符合 idle freeze 保守路徑（`CLAUDE.md` §3a Recommended next paths）。
4. 本 doc 已為未來 Option B 實作 phase 落定 scope / red line / gates / naming / acceptance；未來 Session 可直接引用、無需重複 audit。
5. Option A（維持現狀 + 補文件）為 `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md` §8 之 recommendation；本 doc 沿用該判斷、不 override。

**未來啟動觸發**：Dean 於某 Session 明確：

- 說明手動流程之痛點（找檔繁瑣 / 改 ready 忘記改回 / 其他），且
- 明列選擇 B1 或 B2，且
- Explicit approval 啟動 preview helper 實作 phase，且
- 對照本 doc §7 allowed / §8 forbidden / §9 gates / §11 acceptance。

Claude **不代 Dean 決策**、**不主動啟動** Option B 實作 phase。

---

## 14. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔（+ 對應 commit + push origin/main）。**不含**任何程式 / frontmatter / settings / sidecar / build / deploy / dev-server 變更；未新增 guard / npm script / preview-only script / helper script；未改 `.gitignore`；未改 CSS；未改 `CLAUDE.md` / `MEMORY.md` / `memory/`；未觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages；未發布 Blogger；未購買網域 / 未動 DNS / 未碰 AdSense / GA4 / Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`；未猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId`；未從任何 metadata 推導 Blogger internal ID；未新增測試文章 / artifact；未建 `CNAME` / `ads.txt`（含 placeholder / fake）。§0 boot baseline 為本 session read-only 驗證；§1 結論、§2 workflow recap、§3 潛在收益、§4 不需啟動之理由皆基於現有 docs（alignment / runbook / sanity checklist / eligibility inventory / RC handoff readout / next-readiness analysis）之 read-only 整理；§5 Option A 沿用 `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md` §7 Option A；§6 Option B 之 B1 為本 session 新提出之 read-only navigator（符合 Dean briefing 語意）、B2 沿用 `20260708` inventory §7 Option B（draft-aware preview build）；§7 allowed / §8 forbidden 為對現有紅線之整合列表；§9 gates 為 proposed pre-implementation gates、未落地；§10 命名為候選、未動 `package.json`；§11 acceptance 為 proposed；§12 non-goals 沿用 handoff readout §7 + `CLAUDE.md` §3a Red lines；§13 recommendation 沿用 `CLAUDE.md` §3a Recommended next paths（idle freeze）+ `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md` §8。

---

## See also

- `docs/20260708-blogger-draft-preview-runbook.md`（Blogger draft-preview 6 步可重複流程；本 doc §2 workflow recap 之依據）
- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（build eligibility 盤點 + Option A/B/C；本 doc §6 B2 sourced from §7 Option B / §9 S2）
- `docs/20260708-phase1-second-manual-e2e-result.md`（第二次人工 E2E；§D Attempt notes 為本 doc 之觸發背景）
- `docs/20260708-phase1-third-manual-smoke-result.md`（第三次小型人工 smoke；P1-1 verified resolved）
- `docs/20260708-phase1-p1-followup-closeout-inventory.md`（Admin `#blogger-export` per-post Copy 按鈕 5 顆 fix landing record；本 doc §2 / §3 / §4 之支援依據）
- `docs/20260710-blogger-admin-export-workflow-alignment.md`（Admin export workflow alignment；本 doc §2 workflow / §4 not required 之依據）
- `docs/20260710-blogger-preview-sanity-analysis.md`（Blogger preview sanity checklist 40 項；本 doc §2 workflow / §11 acceptance §11.1 之對照）
- `docs/20260710-phase1-rc-handoff-operating-readout.md`（Phase 1 RC handoff readout；候選 D = 本 doc）
- `docs/20260710-phase1-rc-next-readiness-analysis.md`（Phase 1 RC → next-readiness；§7 排名 #4 = 本 doc）
- `docs/20260710-blogger-backfill-write-phase-preflight.md`（Blogger backfill write phase preflight；本 doc §8 forbidden 引用之 backfill sidecar 專屬 phase 來源）
- `docs/20260710-custom-domain-adsense-trigger-checklist.md`（custom domain / AdSense trigger checklist；本 doc §8 forbidden 引用之 domain / AdSense red line 來源）
- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger identity 分層 policy；不猜 ID；本 doc §8 forbidden 之依據）
- `docs/20260706-blogger-backfill-write-target-inventory.md`（Blogger backfill sidecar canonical location）
- `docs/20260630-admin-markdown-export-phase1-closeout.md`（Admin markdown export Phase 1 MVP closeout；Admin 恆 `status:"draft"` + `draft:true` 契約）
- `docs/20260702-phase1-manual-e2e-runbook.md`（第一次 E2E：github-site happy-path PASS）
- `src/views/admin/index.ejs`（`#blogger-export` section；per-post 5 顆 Copy 按鈕；`be-notice` 2 步；本 doc §2 workflow 之依據）
- `src/scripts/load-posts.js`（`classify` 單一事實來源：`draft !== true` 且 `status ∈ {ready, published}`；本 doc §5 / §6 之依據）
- `src/scripts/build-blogger.js`（Blogger 渲染 / 輸出路徑；本 doc §2 workflow / §6 B2 之依據）
- `src/scripts/admin-markdown-export.js`（Admin 恆 draft 契約；本 doc §4 / §6 之依據）
- `.gitignore`（`dist/*` / `dist-blogger/*` / `dist-promotion/*` / `dist-reports/*` 已 gitignored；本 doc §6 B2 gitignore 對齊之依據）
- `package.json`（`scripts.build:blogger` / `check:phase1-readiness` / `check:release-readiness` umbrella；本 doc §9 / §11 之依據）
- `CLAUDE.md` §5（分階段）、§7（Blogger 發布 checklist）、§14/§15（tags / categories registry）、§23（發布狀態；draft 不得進正式 dist）、§26（package.json 指令）、§27（Claude Code 修改規則）、§28（MVP 必做）、§29（第一版不做）
- `CLAUDE.md` §3a Current state snapshot（含 Red lines / Recommended next paths / Admin idle freeze）
- `MEMORY.md` + `memory/project_baseline.md`（frozen source / deploy baseline）
- `memory/project_report_only_metadata_guards.md`（8 warning-only guards + release-readiness umbrella；本 doc §9 / §11 acceptance §11.3 之依據）
- `memory/feedback_phase_discipline.md`（memory-sync-only / docs-only / source-only phases 不重疊；本 doc §9 G-S1 之依據）
- `memory/feedback_no_per_article_html_decorations.md`（keep posting simple；本 doc §4 相容）

---

（本文件結束 / end of document）
