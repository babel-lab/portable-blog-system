# Phase 1 穩定測試 / 發佈前缺口盤點（docs-only inventory）

- 建立日期：2026-07-08（Asia/Taipei）
- 類型：docs-only inventory snapshot（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / CLAUDE.md / MEMORY.md）。
- 目的：確認 BLOG 系統 Phase 1 距「穩定測試完成」還缺什麼，並整理下一個最小 safe slice。**本輪不實作功能、不 build、不 deploy、不碰 domain / DNS / AdSense 後台。**
- 範圍：只執行「已確認 read-only」的 check；會寫檔或需授權者一律不跑，改記為「待人工確認 / dormant」。

---

## 1. Boot baseline（read-only 驗證）

| Repo | branch | HEAD | 對照 | ahead/behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `5a5ff73` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅ | `0 / 0` | clean | absent ✅ |

判定：**boot baseline 完全符合 frozen baseline**。未 pull / merge / reset / rebase / amend / force-push。Deploy clone 僅被 read-only 讀取，未寫入。

---

## 2. Checks executed（本輪實跑，皆 read-only）

執行前先 grep 每支 script 確認無 `writeFile` / `mkdir` / `rm` / `unlink` / `appendFile` / `execSync` / `git` 寫入操作（prepublish 只 spawn `git` 讀狀態；smoke 只寫 OS temp dir 並於結束 `rmSync` 清除，**不觸碰**真實 source/deploy repo、無網路）。

| # | 指令 | 結果 | 性質 |
| --- | --- | --- | --- |
| 1 | `npm run validate:content` | **0 error / 135 warning / 107 post** | hard gate 0 error 維持；warning 全來自 `content/validation-fixtures/` + 1 production intentional hold |
| 2 | `npm run check:npm-script-targets` | **47/47 PASS**（46 targets） | 每個 npm script 對應 `.js` target 存在 |
| 3 | `npm run check:adsense-mode-metadata` | scanned 17 / legacy 17 / valid 0 / **warnings 0** / exit 0 | report-only / warning-only；不阻擋 build |
| 4 | `npm run check:blogger-backfill` | **report-only PASS**；candidates 7 / missing 7 | warning-only；missing 不 fail（見 §5 缺口） |
| 5 | `npm run check:github-pages-prepublish` | **16/16 PASS** | read-only；source 8 + deploy clone 8，只讀 git 狀態，不 build/deploy/fetch/pull |
| 6 | `npm run check:github-pages-prepublish-smoke` | **8/8 PASS** | 8 情境（happy-path + 7 failure detection）；全在 OS temp repo，自動清除 |

執行後 source working tree 仍 clean（smoke 只動 temp）。

### 2.1 check:blogger-backfill 明細（report-only）

7 篇 `status=ready` Blogger 文章缺 backfill：

- `20260515-we-media-myself2.md`：sidecar 已有 `publishedUrl` / `publishedAt`，**僅缺** `blogger.bloggerPostId`。
- 6 篇 `20260612-*`（after-work-writing-time-blocking / ai-tools-simplify-daily-workflow / blog-as-personal-knowledge-base / blog-restart-steady-rhythm-notes / daily-reading-habit-notes / reading-notes-three-questions）：sidecar-absent，缺 `publishedUrl` / `bloggerPostId` / `publishedAt`。

依 policy（`docs/20260706-blogger-identity-and-backfill-strategy.md`）：`bloggerPostId` 屬系統欄位、待未來 Blogger API flow 取得，**不列為** Dean 人工必填；不猜 Blogger URL / postId / publishedAt。此 guard 維持 report-only，**非 Phase 1 blocker**。

---

## 3. Checks skipped（本輪不跑）與理由

| 指令 / 動作 | 不跑理由 | 記為 |
| --- | --- | --- |
| `npm run build` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap` / `preview` | Session rule 明訂不 build/deploy；非本輪盤點所需 | out of scope |
| deploy / push gh-pages / 碰 deploy clone | Session rule：不 deploy、不改 gh-pages | out of scope |
| `npm run check:admin-markdown-export` | read-only guard，但不在本輪 priority 清單；carry-forward **256/256 PASS** | carry-forward，未重跑 |
| `check:content-type-metadata` / `check:campaign-*-metadata` / `check:custom-promo-metadata` / 三支 `*-cross-field` / `check:metadata-guards` / `check:metadata-cross-fields` / `check:metadata-all` | read-only report-only；非本輪 priority；避免擴大 round | carry-forward，未重跑 |
| `npm run check:release-readiness`（含 contract → prepublish → smoke → metadata-all → validate） | umbrella；其關鍵子檢查（prepublish / smoke / validate）本輪已個別跑過綠燈；含 prepublish 會 read-only 讀 deploy clone | 未整支跑（子檢查已覆蓋） |
| `npm run admin:write`（`--apply` / `dryRun:false`）、`npm run safe-write:test` | **具寫檔路徑**；dormant，須 explicit approval | 🔒 待人工確認 / dormant |
| `npm run backfill:url` | 具寫檔路徑（回填 frontmatter） | 🔒 待人工確認 |

---

## 4. Phase 1 現況盤點

### 4.1 已通過 / 已有 guard（green）

- **內容驗證**：`validate:content` 0 error（hard gate）；ready/published 全數 schema / category / tag / duplicate-slug 驗證。
- **npm script 完整性**：`check:npm-script-targets` 47/47。
- **GitHub Pages 發佈前就緒**：`check:github-pages-prepublish` 16/16（source + deploy clone 雙 repo 狀態）+ smoke 8/8（failure detection 覆蓋）。
- **Admin Markdown 匯出契約**：`check:admin-markdown-export` 256/256（carry-forward）——匯出恆 `status:"draft"` + `draft:true`、無 write path、category registry-bound。
- **AdSense mode metadata**：`check:adsense-mode-metadata` warnings 0。
- **Metadata guards 全家族**：5 single-field + 3 cross-field + umbrella（metadata-guards / metadata-cross-fields / metadata-all）+ release-readiness umbrella + release-readiness-contract 靜態守則（carry-forward，皆 warning-only / checks-only）。
- **Phase 1 功能面**：Phase 1 final 已於 2026-05-18 宣告（`docs/phase-1-completion-report.md`）；MVP §28 17 條達標、6/6 article block 兩端 parity、sitemap + robots + JSON-LD landed。

### 4.2 已完成人工測試（manual E2E）

- **Phase 1 Manual E2E Happy Path PASS**（2026-07-02，Dean 手動；`docs/20260702-phase1-manual-e2e-runbook.md` §6）：Admin 填表 → 匯出 draft → 手動放檔 → validate(draft) → VS Code 轉 ready → validate(ready) 0 error → dev preview 可見 → 刪檔回 clean baseline。全程 Admin 未自動寫 repo，未碰 build/deploy/Blogger/GA4/AdSense。
- **P3 Blogger post live verified**（2026-06-17，Dean 截圖佐證）：`blog-restart-steady-rhythm-notes` live；Claude 未登入 Blogger。

### 4.3 仍缺 guard / 仍待人工（非 Phase 1 blocker）

- **Blogger backfill 完整性**：report-only（7 篇 missing），刻意 blocked 於 Dean 提供 Blogger 後台真值；不猜值。屬營運線，非 Phase 1 完成條件。
- **無「Phase 1 穩定測試」單一 umbrella**：目前需逐支跑 validate / npm-script-targets / prepublish / smoke（+ admin-markdown-export）。可加一支 checks-only 聚合器提升可重複性（見 §6 候選）。
- **人工 E2E 為單次 happy-path**：尚無 blogger-site 新文章的獨立第二次 E2E 紀錄（github-site 已測）；屬可選加強，非 blocker。
- **GA4 / AdSense 後台成效**：待 Dean 後台 evidence；屬發佈後觀察線。

### 4.4 不應在 Phase 1 做的項目（明確排除 / 本輪不碰）

- ❌ Custom domain 啟用 / 購買網域 / DNS 設定 —— post-Phase-1；結論：Phase 1 穩定、準備正式累積 SEO / 變現時再買。
- ❌ 正式 AdSense 送審 / AdSense 後台操作 —— 發佈後線。
- ❌ GitHub Pages deploy / push gh-pages / 重貼 Blogger 後台 —— 發佈動作，各須獨立 phase + explicit approval。
- ❌ Reverse UTM Blogger→GitHub deploy（pm-26 gate）—— source landed but dormant / BLOCKED。
- ❌ Admin write-path / FB sidecar 真實寫入 —— dormant，受 §29 紅線約束。
- ❌ Phase 2 功能（後台登入 / 視覺編輯器 / Blogger API / Drive API / View 數 / 讚 / 留言 / 全文搜尋 / DB）。

---

## 5. Phase 1 ready / not ready 判斷

**判定：Phase 1 READY for 穩定測試（stable testing）。**

依據：

1. Boot baseline 雙 repo 完全對齊 frozen baseline。
2. 全部本輪 read-only readiness check 綠燈（validate 0 error、npm-script-targets 47/47、prepublish 16/16、smoke 8/8、adsense-mode 0 warn）；admin-markdown-export 256/256 carry-forward。
3. Phase 1 functional final 已於 2026-05-18 宣告，且 2026-07-02 Manual E2E Happy Path PASS。
4. 所有 remaining gap（Blogger backfill / GA4 / AdSense / domain / deploy / reverse UTM / Phase 2）皆為 **post-Phase-1 營運線或刻意排除**，**不阻擋** Phase 1 穩定測試。

**caveat**：本判定基於 repo 內 guard + Dean 既有人工驗收；Claude 未登入任何 Google / Blogger / GA4 / AdSense 後台，未 build / deploy。

---

## 6. Remaining gaps 與下一個最小 safe slice 建議

### Remaining gaps 摘要

| Gap | 性質 | 阻擋 Phase 1？ |
| --- | --- | --- |
| Blogger backfill 7 篇 missing | 待 Dean 後台真值；report-only | ❌ 否 |
| 無 Phase 1 readiness 單一 umbrella | 可重複性 / 便利性 | ❌ 否 |
| blogger-site 第二次獨立人工 E2E | 可選加強 | ❌ 否 |
| GA4 / AdSense 後台成效 evidence | 發佈後觀察 | ❌ 否 |

### 下一個最小 safe slice 候選（最多 3；標推薦順序）

**候選 1（推薦 #1）— `check:phase1-readiness` checks-only umbrella（Option A，純 package.json 串接）**
- 內容：新增一支 npm script，fail-fast 串接本輪已驗證的 Phase 1 穩定測試 read-only 檢查：`check:npm-script-targets && validate:content && check:github-pages-prepublish && check:github-pages-prepublish-smoke && check:admin-markdown-export`。
- 性質：additive、**不新增 JS 檔**、不改任何既有 guard 語意、checks-only（無 build/deploy/push/gh-pages）；mirror 既有 `check:release-readiness` 模式但聚焦 Phase 1 穩定測試。
- 風險：極低（純 package.json 一行 + 之後 `check:npm-script-targets` 自動涵蓋新 target）。
- 驗收：整支 exit 0 = 各子檢查沿用本 §2 數值。

**候選 2（推薦 #2）— `check:phase1-readiness-contract` 靜態守則（新 JS，mirror release-readiness-contract）**
- 內容：新增 `src/scripts/check-phase1-readiness-contract.js`，純讀 `package.json` 文字，斷言候選 1 之 umbrella 維持 checks-only（含指定子檢查片段、不含 build/deploy/gh-pages/push/dist token）。
- 前提：候選 1 先落地。
- 風險：低（新 standalone guard，read-only，warning/exit-code only）。

**候選 3（推薦 #3）— blogger-site 第二次人工 E2E 紀錄（docs-only runbook 執行紀錄）**
- 內容：Dean 依既有 runbook 對一篇 **blogger-site** 草稿跑 Admin→content→validate→ready，補齊 github-site 已測、blogger-site 未獨立記錄的缺口；產出 docs-only 執行紀錄。
- 性質：人工執行 + docs-only 紀錄；不改 source。
- 風險：低；但需 Dean 手動時間。

**推薦順序：候選 1 → 候選 2 → 候選 3。** 三者皆 additive / read-only / 無 build·deploy·domain·後台動作；候選 1 立即提升 Phase 1 穩定測試可重複性且風險最低。

---

## 7. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔。**不含**任何程式 / frontmatter / settings / build / deploy / dev-server 變更；不改 `CLAUDE.md` / `MEMORY.md` / `memory/`；不觸碰 deploy clone；未購買網域 / 未動 DNS / 未碰 AdSense·GA4·Blogger 後台。所述 §6 候選皆為建議，**未實作**，各須 Dean explicit approval 才於獨立 phase 執行。

## See also

- `docs/20260702-phase1-manual-e2e-runbook.md`（Phase 1 人工 E2E 流程 + 2026-07-02 執行紀錄）
- `docs/20260617-blog-phase1-closure-checkpoint.md`（2026-06-17 Phase 1 closure snapshot）
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`（prepublish checklist）
- `docs/20260707-release-readiness-runbook.md` / `docs/20260707-release-readiness-docs-index.md`（release-readiness umbrella 家族）
- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger backfill policy：不猜 postId / publishedAt）
- `CLAUDE.md` §23（發布狀態）、§26（package.json 指令）、§28（MVP 必做）、§29（第一版不做）
