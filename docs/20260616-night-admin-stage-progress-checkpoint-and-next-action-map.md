# ADMIN stage progress checkpoint & next action map（docs-only）

> Phase: `20260616-night-admin-stage-progress-checkpoint-and-next-action-map-docs-only-a`
> Date: 2026-06-16 21:51
> Type: docs-only checkpoint + action map（不實作；不改 src / views / scripts / content / settings / package / dist / gh-pages；只整理 ADMIN 現況與下一步建議）
> Scope: ADMIN dev-mode-only 後台之能力盤點 + 第一階段 BLOG 系統 MVP 完成前之 ADMIN 最小必要能力判斷 + 下一步保守 / 實作候選 phase 建議。

---

## A. Phase name

`20260616-night-admin-stage-progress-checkpoint-and-next-action-map-docs-only-a`

承接 `20260616-pm-25`（detail panel collapsible sections browser-PASS note）。R1 readability 已 rendered + browser 雙重 PASS，readability 線可暫收尾。本 phase 不啟動新實作，把 20260615-pm-2 起的 ADMIN 進度收成一份單頁 checkpoint，並列出下一個建議 phase（一保守 / 一可實作），方便後續 session cold-start。

---

## B. Baseline 狀態

| 項目 | 值 |
| --- | --- |
| branch | `main` |
| HEAD | `3628fcb`（`docs(admin): record detail panel browser pass`） |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |
| 最近 5 commits | `3628fcb` browser pass · `df0c02f` accept collapsible · `f89ad09` collapse detail panel sections · `a1a3132` plan readability IA · `5246d78` accept validation detail panel |

Carry-forward acceptance numbers（未於本 docs-only phase 重跑）：
- `validate:content` = **0 errors / 94 warnings / 84 issue-posts**
- `report:validation` = 0/94/84
- `check:validation-report` 14/0 · `check:admin-validation-consume` 12/0 · `check:admin-governance-aggregation` 16/0
- `check:adsense-resolver` 34/0 · `check:adsense-article-block` 13/0 · `check:adsense-anchor-wiring` 14/0
- `check:blogger-adsense-output` 85/0 · `check-commerce-affiliate-resolver` 23/0

---

## C. 已完成 ADMIN 功能頁能力清單（landed / dev-mode-only）

> ADMIN render = `build-github.js --mode=dev` → `.cache/pages/admin/index.html`；vite dev serve `/admin/`。**prod build 不產出 / 不進 dist / 不 deploy / noindex**。11 posts 全 status 含 draft。

### C.1 IA shell / Dashboard
- C1.1 Dashboard IA shell（`20260615-night-1`）：系統定位 lede + 6 張 surface-card（📘 Blogger / 🐙 GitHub Pages / 💰 AdSense / 📊 GA4 / 🛒 Commerce / 📚 Content kinds）
- C1.2 頁首 `.stats` 15-card flat overview（既有）
- C1.3 sticky `.admin-nav`（11 anchor）

### C.2 Posts index（read-only）
- C2.1 Posts table 7 欄：id/title · kind/status · platform · readiness · validation · governance · urls
- C2.2 search / filter（多 optgroup `<select>`）/ sort / show-all toggle
- C2.3 per-row 展開式 `tr.post-detail`
- C2.4 Posts table `<td>` 結構閉合（`pm-11` 已修；7/7 平衡）

### C.3 Per-post detail panel（read-only / dry-run）
- C3.1 Identity / Platform Routing / Dates / SEO / Blogger / GitHub / FB Promotion / FB Post sections
- C3.2 **Readiness section**：Content readiness + SEO readiness + **Validation warnings**（report-backed read-only consume，`pm-18`，四態 no-report / status-excluded / matched / clean + asOf footer）
- C3.3 **Governance signals section**：raw 4 訊號 dl + **Aggregation summary**（`pm-8`；hasSignals / totalSignalCount / byClass taxonomy / signals[] 固定順序 + same-source 註）
- C3.4 Related / other links + sourceKey selector preview（read-only / dry-run；無寫入）
- C3.5 FB Sidecar Dry-run Editor（client-side preview；Apply 永遠 disabled）
- C3.6 SEO dry-run edit viewer（`docs/admin-2b1-completion-report.md`；無寫入）
- C3.7 Completeness summary / Missing fields / Source path / Future write readiness checklist
- C3.8 **R1 native disclosure 收合**（`pm-23`）：FB Sidecar Dry-run Editor · sourceKey selector preview · Future write readiness checklist · Source path 四個低頻區段 `<details>` 預設收合；高頻 sections 維持直接可見

### C.4 Categories & Tags governance
- C4.1 governance aside（unknown / cross-site mismatch tag/category；`am-1` L2 read-only UI 入口）
- C4.2 Categories registry + Tags registry 列表
- C4.3 Per-category / per-tag usage table
- C4.4 Uncategorized / Untagged / Unknown / Unused 邊界表
- C4.5 **Governance summary card**（`am-4`；Option B 位於 Categories & Tags section 開頭；post-level rollup + cross-site mismatch + healthy empty-state；read-only 不 prescription）

### C.5 Surface-specific sections
- C5.1 Blogger Export / GitHub Pages / AdSense / GA4 / Settings 各 1 surface-card dl
- C5.2 System checks 區段（CLI script 清單 + 「⏳ 仍未實作」planned-list；`pm-20` 文案已對齊 report-backed）
- C5.3 Write path 黃底警示區（dormant）

### C.6 Loader 派生資料（`load-admin-posts.js`）
- C6.1 `governanceSignals` 5 欄派生（`am-5` / `am-2`：unknownTagCount / unknownCategoryCount / crossSiteMismatchTag(flag) / crossSiteMismatchCategory(flag) / signalSum）
- C6.2 `governanceAggregation`（`pm-4`：hasSignals / totalSignalCount / byClass / signals[] 固定順序；純函式 + deterministic + 不 mutate input）
- C6.3 `validationReport` per-post derive（`pm-18`：四態 from `.cache/data/validation-report.json`；缺檔 graceful；`validationReadiness` 維持原欄位不動）

### C.7 報告 / 工具腳本（CLI）
- C7.1 `npm run report:validation`（`pm-16` reporter；產 git-ignored `.cache/data/validation-report.json`；schema lock per `pm-14`）
- C7.2 `npm run check:validation-report`（`pm-17` smoke 14/0；synthetic + real-report assertions）
- C7.3 `npm run check:admin-validation-consume`（`pm-18` smoke 12/0；synthetic-only）
- C7.4 `npm run check:admin-governance-aggregation`（`pm-4` smoke 16/0；synthetic-only）

---

## D. 已完成但仍屬 read-only / observation / validation 的能力

| 能力 | 性質 | 備註 |
| --- | --- | --- |
| Posts index governance badge（`gov: N` / `gov ✓`） | read-only display | `am-1` L2；只顯示 signalSum，不暗示 build blocker |
| Validation warnings detail-panel section | read-only consume | `pm-18` 由 generated report 讀；draft 顯「未驗證」非 0；非 validator warning count；不修法、不 prescription |
| Governance summary card（Categories & Tags） | read-only rollup | `am-4` post-level rollup；明示 same-source；non-blocker |
| Aggregation summary in detail panel | read-only enumeration | `pm-8` byClass + signals[] 固定順序；same-source 註；非 validator warning |
| SEO dry-run edit viewer | dry-run only | 既有；無寫入 |
| FB Sidecar Dry-run Editor | dry-run only | client-side preview；Apply 永遠 disabled |
| sourceKey selector preview | dry-run only | guard-gated 顯示；不寫入 |
| System checks 區段 | guidance only | 列 CLI script；要 user 自行 npm run |

→ 上述全屬「**讓人看 / 讓人查 / 不修改任何來源**」之能力；ADMIN 本身**不**取代 validator / 不取代發布工具 / 不取代 source-of-truth。

---

## E. 尚未進入實作的 ADMIN 能力

### E.1 readability / IA 待落地（已 preanalysis；可實作但須個別 approval）
- E1.1 **R2** 頁首 overview 整併（`.stats` 15-card vs Dashboard 6 surface-card；`pm-22` preanalysis §G）
- E1.2 **R3** 健康狀態 legend + Missing fields ×2 去重（`pm-22` §G）
- E1.3 **R4** Categories & Tags section 切分（`pm-22` §G）
- E1.4 **R5** nav 對齊 DOM 順序 + inline-style cosmetic 收斂（`pm-22` §G）
- E1.5 SEO 「Dry-run edit (no write)」區段改 native `<details>` 收合（`pm-25` §E minor watch；非 R1 範圍）

### E.2 Validator 路線之擴充（preanalysis-only；conservative deferred）
- E2.1 reporter Option B（validator `--report-json`，動 ground truth）— `pm-14` **NOT 選**；`pm-2` / `pm-3` 拒絕
- E2.2 Posts-index validator warning **計數 badge** — 屬資料模型擴充 + universe-mismatch 高混淆風險，`pm-2` §F 表列獨立 phase；**未授權**
- E2.3 Summary-card 補 validation warning 欄 — 同 E2.2；**未授權**
- E2.4 filter chip 跳轉篩選 — 動 Posts index search/filter/sort JS；**未授權**
- E2.5 loader 跨篇聚合搬遷 / cross-post aggregation migration — `pm-22` §F.2 排除清單

### E.3 寫入路徑（dormant；嚴格紅線）
- E3.1 Admin Apply / Save / Auto-fix — **dormant**
- E3.2 admin-write-cli — 存在但 dormant，未接 browser
- E3.3 middleware write — dormant
- E3.4 FB sidecar **真實寫入** — ⏳ 待 user 勾選 preflight checklist（per `docs/fb-sidecar-write-safety.md` / `docs/fb-sidecar-write-preflight-decision.md` §7）
- E3.5 per-post **prescription**（自動建議「應改為 X」規則引擎）— **未授權，永久紅線**

### E.4 其他
- E4.1 真正登入後台 / 會員 / 留言 / View 數 / Like — **第一版禁項**（`CLAUDE.md` §29）
- E4.2 視覺化文章編輯器 — **第一版禁項**
- E4.3 Blogger API 自動發文 / Google Drive API 自動上傳 — **第一版禁項**

---

## F. 第一階段 BLOG 系統完成前，ADMIN 最小必要能力判斷

### F.1 判斷準則
依 `CLAUDE.md` §1 / §3 / §28 / §29：
- ADMIN **不是** Phase 1 MVP 必做之 17 項中的任何一項
- ADMIN **dev-mode-only**，不進 prod build / dist / deploy
- 第一版**避免過度工程化**；不做真正後台、寫入、留言、會員、資料庫
- ADMIN 之正當功能 = **read-only 觀察、驗證輔助、治理可視化**

### F.2 最小必要能力（判斷已達成）

| 必要能力 | 達成狀態 | 來源 |
| --- | --- | --- |
| 看到全 11 篇 post 含 draft 之 IA / Routing / Readiness 概觀 | ✅ | C.2 + C.3 |
| 看到 validator ground truth 之 per-post warnings（draft 顯「未驗證」） | ✅ | C.3.2 + C.7.1–C.7.3 |
| 看到治理訊號（unknown / cross-site mismatch tag / category） | ✅ | C.4.1 + C.4.5 + C.6.1 |
| 看到 per-post Aggregation summary（structured / 同源 / 非 validator count） | ✅ | C.3.3 + C.6.2 |
| 看到 SEO / FB / Blogger / GitHub channel 各 surface 狀態 | ✅ | C.3 + C.5 |
| Posts table 結構正確（`<td>` 7/7 平衡，不靠 browser auto-repair） | ✅ | C.2.4（`pm-11`） |
| 不出現誤導性「修復 / Apply / Save」UI | ✅ | E.3 dormant；C.3.5 / C.3.6 dry-run only |

→ **結論：ADMIN 已超過第一階段 BLOG 系統 MVP 之最小必要能力**。R2–R5 readability、SEO dry-run 收合、validator count badge 等屬 nice-to-have，**非** Phase 1 MVP 出貨之 blocker。

### F.3 與 Phase 1 MVP 17 項之關係
- ADMIN **不**列於 17 項清單；不直接 unblock 任何 MVP 項目
- ADMIN **有助於**作者觀察既有 17 項輸出之健康程度（validator / governance / readiness），可加速 MVP 後續驗收與 release
- 因此最小必要能力 = 「**已落地之 read-only 觀察 / 驗證輔助**」即足夠，無需新功能

---

## G. 下一個最保守建議 phase

**保守 idle freeze / handoff**：

- ADMIN readability 線 = R1 rendered + browser 雙重 PASS，可暫收尾
- ADMIN validator-warning 線 = reporter → smoke → detail-panel consume → footnote / system-checks 文案 已全程一致並 rendered-accepted
- ADMIN governance 線 = signals → aggregation → detail panel UI → summary card → browser PASS 全閉環
- 目前 working tree clean、ahead/behind 0/0、所有 smoke 通過

**保守候選 phase**：

`20260617-XX-admin-stage-idle-freeze-handoff-confirmation-docs-only-a`
（極小 docs-only：確認 idle freeze、紀錄已可進入下一階段，BLOG 系統重心可回 content / publishing 主線）

紅線：保守階段**不**啟動 R2 / R3 / R4 / R5 / SEO 收合 / validator count badge / 任何 write path。

---

## H. 下一個若要繼續實作的建議 phase

若 user 仍想推進 ADMIN，**推薦最低風險之 implementation candidate**：

### H.1 推薦（最低風險）：SEO「Dry-run edit (no write)」區段改 native `<details>` 收合

- 動機：`pm-25` §E 已記錄 minor readability watch；此區塊為 detail panel 內未收合且佔高最大之區段；R1 pattern 已 PASS、可直接 mirror
- 範圍：**單檔** `src/views/admin/index.ejs`；改 1 個 `<div class="detail-section">` 為 `<details class="detail-section">` + `<summary>` 包入 h3；**零新 CSS / 零 JS**；mirror `pm-23` 之 R1 模式
- 風險：極低；可獨立 backout；不改 loader / data / UI 行為 / write path
- 規模：~+10 / −5 行 EJS
- Phase 命名建議：`20260617-XX-admin-seo-dryrun-edit-collapsible-section-implementation-a`
- 前置：建議先做 1 個 read-only acceptance（rendered HTML grep + dev render exit 0 + Aggregation summary ×11 不破壞）

### H.2 次推薦：R2 頁首 overview 整併（`pm-22` preanalysis §G）

- 動機：D1 高 readability pain point；`.stats` 15-card 與 Dashboard 6 surface-card 部分數字重疊
- 範圍：單檔 `index.ejs`；屬中等規模 cosmetic restructure；不改 loader / data
- 風險：中（重排序 / 視覺重大改變；user 可能不喜歡新版）
- Phase 命名建議：`20260617-XX-admin-header-overview-consolidation-implementation-a`
- 前置：建議先做一個小 mockup / preanalysis 變體確認方向

### H.3 不推薦（紅線）

- ❌ Posts-index validator warning **計數 badge**（universe-mismatch 高混淆；`pm-2` 已分析）
- ❌ Summary-card 補 validator warning 欄
- ❌ filter chip / 跳轉篩選
- ❌ 任何 write path / Apply / Save / Auto-fix / per-post prescription
- ❌ validator `--report-json`（動 ground truth）
- ❌ cross-post loader aggregation migration

---

## I. Non-actions（本 phase 明確不做）

- ❌ 不改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `package.json` / `package-lock.json` / `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache/`
- ❌ 不新增、調整、刪除任何 `<details>` / `<summary>` / CSS / JS / EJS partial
- ❌ 不執行 R2 / R3 / R4 / R5 / SEO 收合
- ❌ 不啟動 write path / Apply / Save / Auto-fix / FB sidecar 真實寫入 / admin-write-cli
- ❌ 不新增 Posts-index 計數 badge / summary-card 補欄 / filter chip / per-post prescription
- ❌ 不改 validator rule / reporter schema / join contract
- ❌ 不 `npm install` / 不 `build` / 不 `deploy` / 不 push gh-pages / 不重貼 Blogger
- ❌ 不 merge / rebase / reset / amend / force push
- ❌ 不重跑 validate / check guards（baseline carry-forward；未碰 source）
- ❌ 不壓縮 / 重排 `CLAUDE.md`（僅允許極小 ledger sync ≤5 行）
- ❌ 不重做已完成項目（見 §J）
- ❌ 不對 BLOG 系統 content / Blogger / GA4 / AdSense 後台動手

---

## J. 不應重做的已完成項目（重做 = 浪費 / 風險）

| 已完成項目 | 完成 phase | 完成 commit / baseline |
| --- | --- | --- |
| Suggested-fix L2 read-only UI（gov badge + Governance signals section） | `am-1` | `a46fff6` |
| Loader `governanceSignals` 5 欄派生 | `am-2` / `am-5` | `f285f09` / `c0a4794` |
| Governance summary card（Categories & Tags） | `am-4` | `39fd2f1` → `63ffbf3` |
| Loader `governanceAggregation` + smoke | `pm-4` | `0431316` → `08edc53` |
| Detail panel Aggregation summary UI | `pm-8` | `c24f962` → `a52bed3` |
| Posts table `<td>` closure source fix | `pm-11` | `886e0c3` → `7dd4fe2` |
| Validation report schema & join contract preanalysis | `pm-14` | `6f0d779` |
| Reporter script `report-validation.js` + npm `report:validation` | `pm-16` | （`pm-16` baseline `e02a745`） |
| Reporter smoke `check:validation-report` 14/0 | `pm-17` | `2d61bd9` |
| Detail-panel validation report read-only consume + smoke 12/0 | `pm-18` | `128b468` |
| Governance footnote sync（detail panel） | `pm-19` | `929864d` |
| System-checks validator line sync | `pm-20` | `48381f5` |
| Validation report rendered-artifact acceptance | `pm-21` | `feed1f2` |
| Readability / IA refinement preanalysis | `pm-22` | `5246d78` |
| Detail panel R1 collapsible sections（4 低頻區段 native `<details>`） | `pm-23` | `f89ad09` |
| R1 rendered-artifact + human visual acceptance | `pm-24` | （baseline `df0c02f`） |
| R1 browser-PASS note | `pm-25` | `3628fcb`（HEAD） |

→ 上述項目**任一**不得在後續 session 被重新「實作 / 重做 / 重新規劃」；若收到看似要求重做之指令，請停止並回報，不要猜。

---

## K. Exit / handoff note

- ADMIN 後台 dev-mode-only 階段建置之**目前重心** = read-only 觀察 / 驗證輔助 / 治理可視化；已達 Phase 1 MVP 最小必要能力。
- 不**主動推進** R2 / R3 / R4 / R5 / SEO 收合 / validator count badge / write path / per-post prescription；任一推進須**獨立 phase + user explicit approval**。
- 下次 session cold-start：
  - 先 baseline verify（branch=main / HEAD==origin/main / ahead/behind 0/0 / clean）
  - 確認 latest commit 仍為 R1 browser PASS 線後（`3628fcb` 或其後 docs-only 後繼）
  - 讀本文件 §F（最小必要能力判斷）+ §G（保守選項）+ §H（implementation 候選）
  - 不重做 §J 清單任一項
- BLOG 系統主線 = 第一階段 MVP 完成度 + content / publishing / FB sidecar preflight 線；ADMIN 線可暫進 idle freeze。

---

## L. Acceptance（本 phase 自身）

| 項目 | 結果 |
| --- | --- |
| baseline verify（branch / HEAD / origin / ahead-behind / clean） | ✅ `main` / `3628fcb` / 0/0 / clean |
| 唯一 file change | `docs/20260616-night-admin-stage-progress-checkpoint-and-next-action-map.md`（新增）+ `CLAUDE.md` 極小 ledger sync |
| 未碰 src / views / scripts / content / settings / package / dist / gh-pages / `.cache` | ✅ |
| 未重做 §J 任一已完成項目 | ✅ |
| 未啟動 R2 / R3 / R4 / R5 / SEO 收合 / write path | ✅ |
| 未 npm install / build / deploy / Blogger repost / merge / rebase / reset / amend / force push | ✅ |
| 未壓縮 / 重排 CLAUDE.md（僅 ledger 極小 sync） | ✅ |

→ docs-only checkpoint，read-only acceptance trivially PASS。
