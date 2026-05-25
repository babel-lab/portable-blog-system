# 2026-05-25 AM Checkpoint Report

> Phase: `20260525-am-9-morning-checkpoint-report-a`
> 模式：docs-only（純 checkpoint report 落地；為下個 session 之 cold-start 入口）
> 來源：本文件整理 2026-05-25 上午 PC handoff 後完成之 5 個 docs-only phases。

---

## §1 日期與背景

| 項目 | 內容 |
|------|------|
| **日期** | 2026-05-25 上午 |
| **背景** | 由 NB 拷貝專案檔至 PC 後完成接手確認，並接續推進 Phase 1 「好不好用」盤點 + user guide drift 同步 + Reverse UTM readiness snapshot |
| **本日上午工作性質** | docs-only / read-only audit / guide sync / readiness snapshot |
| **production state 改動** | ❌ 無（無 build / deploy / Blogger 後台 / GA4 後台操作；無 content 新增；無 fixture 建立）|

---

## §2 Git final baseline

| 項目 | 值 |
|------|---|
| repo | `portable-blog-system` |
| working directory | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `762386a9f054c3c2f43155795adb8fa2010acec3`（short `762386a`；am-11 commit）|
| origin/main | `762386a9f054c3c2f43155795adb8fa2010acec3` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| modified / staged / untracked | ❌ 無 |
| remote | `https://github.com/babel-lab/portable-blog-system.git` |

---

## §3 本日上午完成 commits timeline

7 commits（按時序由舊至新；全 push origin/main；全 linear advance；無 merge）：

| # | commit | message | phase | 性質 |
|---|--------|---------|-------|------|
| 1 | `65145a8` | `docs(handoff): add 2026-05-25 PC handoff baseline report` | am-1 commit | docs new（132 行）|
| 2 | `d13174f` | `docs(report): add 2026-05-25 phase 1 usability review` | am-3 commit | docs new（296 行）|
| 3 | `dc167a6` | `docs(audit): add 2026-05-25 phase 1 user guide drift check` | am-5 commit | docs new（297 行）|
| 4 | `d6a8922` | `docs(guide): sync phase 1 user guide with D1-D8 drift` | am-6 commit | docs modify（+41 / -29；唯一 modify）|
| 5 | `2470deb` | `docs(report): add 2026-05-25 reverse utm readiness snapshot` | am-8 commit | docs new（289 行）|
| 6 | `62b7298` | `docs(report): add 2026-05-25 am checkpoint report` | am-9 commit | docs new（242 行；本檔自身初版）|
| 7 | `762386a` | `docs(report): add 2026-05-25 affiliate first activation readiness` | am-11 commit | docs new（403 行）|

### 3.1 統計

- **docs new**：6 commits（pc-handoff / usability-review / drift-check / reverse-utm-readiness-snapshot / am-checkpoint-report 本檔 / affiliate-first-activation-readiness）
- **docs modify**：1 commit（user-guide D1-D8 rewrite）
- **source / content / settings / template / dist / deploy 變動**：0
- **push 動作**：7 次 origin/main（每 commit 後一次 push）
- **build / install / validate（除 audit 用之 read-only `validate:content`）**：0
- **Blogger 後台 / GA4 後台操作**：0

---

## §4 完成事項摘要

### 4.1 PC handoff baseline（am-1）

- 文件：`docs/20260525-pc-handoff-baseline.md`（commit `65145a8`）
- 內容：NB → PC 接手 read-only confirmation；包含 git baseline / 最新 commit 對齊 `dcb0939`（接手前 HEAD）/ node / npm 狀態 / deploy repo / gh-pages 檢查結果 / session 邊界 / 下一步候選 5 項
- 結論：✅ PC 端 clean 接手；無 blocker；可安全進入後續工作

### 4.2 Phase 1 usability review（am-3）

- 文件：`docs/20260525-phase1-usability-review.md`（commit `d13174f`）
- 內容：7 維度能力盤點（Blogger / GitHub / FB / GA4 / Ads & affiliate / Admin / Design token）+ 13 個主要使用流程之「好不好用」表 + Phase 1 是否基礎可運行判定 + 痛點 8 項 + 文件補強候選 4 項 + Phase 2 待處理 10 項 + 下一批 3 個小任務（T1 / T2 / T3）
- 結論：✅ Phase 1 已正式 final（per `phase-1-completion-report.md`）；產出可運行但有 8 項痛點與 4 項文件補強需求

### 4.3 User guide drift audit（am-5）

- 文件：`docs/20260525-phase1-user-guide-drift-check.md`（commit `dc167a6`）
- 內容：對 `docs/phase-1-user-operation-guide.md` 之 read-only drift audit；identified 8 個 drift（HIGH 4 / MEDIUM 2 / LOW 1 / INFO 1）+ 7 項未漂移確認 + 是否建議直接改 user guide 之決策（建議拆兩批）
- 跑 `validate:content` 1 次（read-only；無 side-effect；得 `0 error / 39 warning / 34 post(s)`）
- 結論：✅ 8 drift 全 traceable；推薦另開 phase 修 user guide（即 am-6）

### 4.4 User guide D1-D8 rewrite（am-6）

- 文件：`docs/phase-1-user-operation-guide.md`（commit `d6a8922`；唯一 modify）
- 範圍：+41 / -29 行（淨 +12 行）；對應 §1 / §2 / §3 / §6.1 / §7 / §10 之精準修改
- 結論：✅ 8/8 D1-D8 全處理；無遺漏；無超出範圍之擴大修改

### 4.5 Reverse UTM readiness snapshot（am-8）

- 文件：`docs/20260525-reverse-utm-readiness-snapshot.md`（commit `2470deb`）
- 內容：source live but dormant 狀態 5/24 → 5/25 跨日 drift = 0 之 read-only 確認 + 已完成 / 未完成 / blocked / deferred 全表 + 風險判斷（整體 🟢 低）+ 不建議現在建立 fixture 之 6 理由 + 後續啟動順序（per fixture-plan §10.5 Phase 1-6）
- 結論：✅ 5/24 → 5/25 production state drift = 0；fixture 仍 deferred；live status 維持 🟡 dormant

### 4.6 Affiliate first activation readiness（am-11）

- 文件：`docs/20260525-affiliate-first-activation-readiness.md`（commit `762386a`）
- 內容：affiliate 第一篇啟用前之 readiness snapshot + walkthrough；§1-§11 結構同型 reverse-utm-readiness-snapshot；含 audit baseline（9 個檢查過之檔案）+ 目前狀態表 + dormant 確認 + 候選文章盤點（C1 we-media-myself2 / C2 sample-book-review / C3 未來自然書評 / GitHub tech-note）+ 未來啟用 walkthrough 7 子節 + 風險判斷 7 項 + 不建議現在硬啟用 5 條 + 後續啟動條件 6 項
- 結論：✅ affiliate 仍 dormant
  - 0 ready post with `affiliate.enabled=true`
  - `we-media-myself2` 之 `affiliate.links[]` 已預填 2 筆但 `enabled=false` + `position.top/bottom=false`（render 階段被 skip）
  - `sample-book-review` 仍為 draft / sample（`status=draft`；`book.title` 空；body 僅 placeholder）
  - 不建議現在硬啟用（候選 C1 / C2 皆違反「不改既有 + 不硬升 draft」原則；§7.5 高風險）
  - 主軌是等未來自然書評 / 心得文章再啟用（per `phase-1-usability-review.md` §5.4 row #1）

---

## §5 Phase 1 現況結論

| 項目 | 狀態 |
|------|------|
| **Phase 1 可視為基礎可運行** | ✅ 是（per `docs/phase-1-completion-report.md` Phase 9-z-d；正式 final）|
| **仍有不好用的部分** | ⚠️ 有（per `docs/20260525-phase1-usability-review.md` §5.2 痛點 8 項）|
| **Admin 是否為正式寫入後台** | ❌ 否 — 仍是 read-only / dry-run；FB-P5-c / Admin-2-b-2 blocked on user preflight |
| **Blogger 發文流程** | 100% 手動貼文（per `CLAUDE.md` §29 Blogger API 不做；本質如此） |
| **GitHub Pages 基礎支援** | ✅ production live；deploy `960f234` 含 GA4 + G2 click tracking fix |
| **FB promotion 基礎支援** | ✅ 可運作（sidecar schema + build:promotion + UTM 集中管理）|
| **GA4 click tracking 基礎支援** | ✅ GitHub 端 production live（measurementId `G-C77SMPF8VD`）；Blogger 端不做（設計層決議）|
| **UTM 雙向支援** | ✅ GitHub → Blogger production live；🟡 Blogger → GitHub source live but dormant |

---

## §6 User guide drift 修正摘要（D1-D8）

`docs/phase-1-user-operation-guide.md` 已於 am-6 同步更新（commit `d6a8922`）：

| Drift | 嚴重度 | 修正內容 |
|-------|-------|---------|
| **D1** | 🔴 HIGH | §1「⏳ 機制就位但尚未啟用」表移除 GA4 row；改加到「✅ 已可做」表，註明 measurementId `G-C77SMPF8VD` 自 2026-05-21 production live |
| **D2** | 🔴 HIGH | §2 deploy repo「當前 HEAD」改為最近一次已知 deploy `960f234`（2026-05-24），並註明實際 HEAD 仍以本機 deploy repo 為準 |
| **D3** | 🟡 MEDIUM | §2 source repo「Git 角色」改為「branch main → origin/main；push 屬常規 source 同步流程」 |
| **D4** | 🟡 MEDIUM | §3 GA4 row 由「雙條件 gating」改為「四條件 gating」並列出 4 個 AND 條件 |
| **D5** | 🔴 HIGH | §7「GA4 目前狀態」整節 rewrite 為「✅ 已啟用」+ §7.1 觀察方式 + §7.2 歷史註記 / 未來重設參考 |
| **D6** | 🔴 HIGH | §10 表 #1 GA4 measurementId 啟用移出「仍需人工確認」清單；renumber 2-14 → 1-13；新增「歷史註記」段註明已完成 |
| **D7** | 🟡 LOW | §1 + §6.1 validate baseline 由 `0 / 38 / 33` 更新為 `0 / 39 / 34`（2026-05-25 實測）並註明 baseline 自然漂移 |
| **D8** | 🔵 INFO | §2 末段移除「今日所有 commits 都只在 source repo；GitHub Pages 線上版未變」時間錨；改為「source repo 與 deploy repo 是獨立流程；GitHub Pages 是否更新需以 gh-pages deploy repo HEAD / production 驗證為準」 |

---

## §7 Reverse UTM readiness 結論

| 維度 | 狀態 |
|------|------|
| **live 狀態** | 🟡 source live but dormant |
| **5/24 → 5/25 drift** | 0（per `docs/20260525-reverse-utm-readiness-snapshot.md` §4） |
| **reverse UTM source landed** | ✅ pm-24a/b/c（2026-05-23）；grep 確認仍 in place |
| **fixture 建立** | ❌ 未建立 |
| **Blogger 後台重貼** | ❌ 尚未 |
| **GA4 reverse direction production traffic** | ❌ 0 session |
| **是否建議現在硬建 fixture** | ❌ **不建議**（per `docs/20260525-reverse-utm-readiness-snapshot.md` §7：無時間壓力 / 候選破壞 invariant / deadlock 未解 / 主軌等自然文章）|
| **啟動觸發路線** | 主軌（自然書評 / 心得文章引用 GitHub 站）/ 副軌 A（user 主動寫雙站心得文）/ 副軌 B（教具 / 親子素材主題涉及網站製作）|

---

## §8 本日上午未做事項

明確列出本日上午**未碰**之範圍：

| 項目 | 狀態 |
|------|------|
| 修改 `src/`（views / styles / js / scripts） | ❌ 無 |
| 修改 `content/`（posts / settings / templates / fixtures） | ❌ 無 |
| 修改 build scripts（`src/scripts/`） | ❌ 無 |
| 修改 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | ❌ 無 |
| 建立 fixture（reverse UTM 或其他）| ❌ 無 |
| 新增 Blogger / GitHub content（`content/blogger/posts/` / `content/github/posts/`）| ❌ 無 |
| 執行 `npm install` | ❌ 無 |
| 執行 `npm run build*` / `npm run dev` | ❌ 無 |
| 執行 deploy（`cp -r dist/*` to deploy repo / push gh-pages）| ❌ 無 |
| 觸碰 Blogger 後台（Theme CSS / per-post HTML 重貼 / 發布 / 編輯）| ❌ 無 |
| 觸碰 GA4 後台（measurement / DebugView / Realtime / Reports）| ❌ 無 |
| 觸碰 FB 後台 | ❌ 無 |
| 修改 `README.md` | ❌ 無 |
| 修改 docs index（`docs/README.md`）| ❌ 無 |
| 修改 `CLAUDE.md` | ❌ 無 |
| 修改 `package.json` / `vite.config.js` / `.gitignore` | ❌ 無 |
| 修改 5/24 既有 docs（runbook / repost-checklist / reverse-utm-observation / EOD report 等） | ❌ 無 |
| 修改其他 docs trail 既有檔（fixture-plan §10 / blogger-to-github-reverse-utm-plan 等）| ❌ 無 |
| 啟動 deferred items（FB-P5-c / Admin-2-b-2 / hashtag a 化 / reverse UTM fixture / custom domain / AdSense / Blogger listener / 等）| ❌ 無 |
| 修改 deploy repo（`portable-blog-deploy/`）| ❌ 無 |

唯一允許並執行之動作：

- ✅ 新增 5 個 `docs/2026052*.md`（pc-handoff-baseline / phase1-usability-review / phase1-user-guide-drift-check / reverse-utm-readiness-snapshot / 本檔）
- ✅ 修改 1 個既有 `docs/phase-1-user-operation-guide.md`（D1-D8 drift sync）
- ✅ 跑 1 次 `npm run validate:content`（am-5 audit；read-only；無 side-effect）
- ✅ git read-only commands（status / log / rev-parse / diff / grep）
- ✅ git add / commit / push（per 各 commit phase；皆單檔；皆 linear advance）

### §8.1 am-11 affiliate readiness 階段補充（11:05 後新增）

- ✅ 唯一允許並執行之動作：新增 `docs/20260525-affiliate-first-activation-readiness.md`（403 行；commit `762386a`）
- ✅ 未啟用 affiliate（任何 `affiliate.enabled` / `position.top` / `position.bottom` / `links[]` 皆未動）
- ✅ 未修改任何文章（含 `we-media-myself2.md` / `sample-book-review.md` / 其他 post）
- ✅ 未修改 settings（`affiliate-networks.json` / `ads.config.json`）/ templates
- ✅ 未 build / 未 deploy
- ✅ 未碰 Blogger / GA4 / FB 後台

---

## §9 下一步候選

列出但**不承諾**；由 user 主動決定啟動：

### 9.1 若今天下午繼續

- **AM checkpoint commit 後的 read-only review**：對 5 commits 跨檔 diff 做最後一次 read-only review；確認 5 docs trail 內部 cross-link 一致；無 stale ref
- **小範圍 docs 補強**：如某段措辭微調；不啟動新 phase

### 9.2 若要收工

- **Final Idle Freeze**：本日工作收尾；不再開新 phase；working tree 維持 clean
- 下次 cold-start 由本 checkpoint report（§10）作為入口

### 9.3 未來可做（無時序承諾）

1. **Reverse UTM fixture 等自然內容觸發**（per `docs/20260525-reverse-utm-readiness-snapshot.md` §8.1 主軌；user 自決時機）
2. **Admin write preflight user 決策**（FB-P5-c / Admin-2-b-2；per `docs/fb-sidecar-write-preflight-decision.md` §7 之 user 8+6 項 preflight）
3. **Custom domain 前置盤點**（per `docs/custom-domain-root-files-strategy.md`；阻擋於 user DNS access）
4. **Affiliate 第一篇啟用 walkthrough**（在某 book-review post 設 `affiliate.enabled=true` + 填 links；驗 `click_affiliate_cta` 真實 fire）
5. **Phase 1 操作流程實際使用回饋**（user 實際走過一次新文章發布 → Blogger 後台 → 回填 → FB 推廣完整流程後之回饋）

---

## §10 Cold-start 指引

給下一個 Claude session 之 cold-start 讀取順序：

| # | 文件 | 用途 | 預估時間 |
|---|------|------|---------|
| 1 | **本文件**（`docs/20260525-am-checkpoint-report.md`）| 5/25 上午全貌總覽；接續工作起點 | ~5 min |
| 2 | `docs/20260525-pc-handoff-baseline.md` | PC 端 baseline 確認紀錄 | ~2 min |
| 3 | `docs/20260525-phase1-usability-review.md` | Phase 1 7 維度能力盤點 + 13 流程 usability 表 + 痛點 + 文件補強候選 + Phase 2 待處理 | ~5 min |
| 4 | `docs/20260525-phase1-user-guide-drift-check.md` | user guide 8 drift audit 紀錄；D1-D8 已於 am-6 修正 | ~3 min |
| 5 | `docs/20260525-reverse-utm-readiness-snapshot.md` | Reverse UTM source live but dormant；fixture 仍 deferred | ~3 min |
| 6 | 最後確認 | `git status --short --branch` 應為 `## main...origin/main`（clean）；`git rev-parse HEAD` 應等於 `git rev-parse origin/main`（皆 `762386a` 或更新 HEAD） | ~1 min |

**am-11 補充**：若下一 session 要看 affiliate 第一篇啟用規劃，讀 `docs/20260525-affiliate-first-activation-readiness.md`（~3 min）。

讀完 1-6 後即可判斷下一步方向；不需再讀 5/24 docs trail（5/24 §15 trail map 已被本 checkpoint §3 / §4 摘要包含）。

若需深入查 5/24 細節，再讀 `docs/20260524-eod-report.md` §15（5/24 全日 docs trail map）。

---

## §11 邊界保證

本 phase `20260525-am-9-morning-checkpoint-report-a` 嚴格 docs-only：

| 項目 | 狀態 |
|------|------|
| 新增 `docs/20260525-am-checkpoint-report.md`（本檔）| ✅ 唯一允許之動作 |
| 修改其他 docs（含 5/25 上午 4 個 docs + 5/24 既有 trail）| ❌ 無 |
| 修改 README / docs index / CLAUDE.md | ❌ 無 |
| 修改 src / content / templates / settings / build scripts | ❌ 無 |
| 修改 dist / dist-blogger / dist-promotion / dist-reports | ❌ 無 |
| 修改 deploy repo（`portable-blog-deploy/`）| ❌ 無 |
| 執行 `npm install` / `npm run build*` / `npm run validate*` / `npm run dev` | ❌ 無 |
| 執行 git commit / push | ❌ 無（待 user 確認後另行決定）|
| 觸碰 Blogger 後台 / GA4 後台 / FB 後台 | ❌ 無 |
| 啟動任何 deferred items / 未來候選 | ❌ 無 |

本文件落地後**不**改變任何 production state；屬純 cold-start onboarding 工具。

---

（本文件結束）
