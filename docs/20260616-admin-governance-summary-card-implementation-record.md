# ADMIN — Governance Summary Card Implementation Record

- **Phase**：`20260616-admin-governance-summary-card-implementation-a`
- **日期**：2026-06-16（10:12 起；am session）
- **性質**：implementation（read-only UI；改 `src/views/admin/index.ejs` 單一檔；**不**改 loader / validator / admin JS / filter / sort / search / content / settings / tags.json / categories.json / frontmatter；**不**啟用 write / Apply / Save / auto-fix；**不** deploy / 重貼 Blogger / npm install）
- **承接**：
  - `docs/20260616-admin-governance-summary-card-preanalysis.md`（Option B 位置、view 端 reduce、不改 loader、指標、UI 紅線、acceptance criteria）
  - `docs/20260616-admin-suggested-fix-l2-readonly-ui-implementation-record.md`（loader am-5 已 derive `post.governanceSignals` 五欄位 + 既有 per-post 兩處顯示）

---

## A. Baseline verify

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main
HEAD           : 39fd2f1 == origin/main
working tree   : clean
last subject   : docs(admin): add governance summary card preanalysis
```

→ baseline 完全符合 phase 指示。

---

## B. 本階段目標

依 preanalysis 推薦之 **Option B**，在 ADMIN Categories & Tags section 前方（既有 governance aside 之後、registry surface-grid 之前）新增一張 **read-only governance summary card**，以 view 端 reduce `posts[].governanceSignals` 呈現全站 per-post 治理訊號 rollup。**不改 loader、不新增 summary object、不碰 Posts index table / search / filter / sort、不新增任何 write path。**

---

## C. Files read（read-only）

- `docs/20260616-admin-governance-summary-card-preanalysis.md`（位置 / 指標 / reduce / 紅線 / acceptance）
- `src/scripts/load-admin-posts.js`（確認 `post.governanceSignals` 五欄位 contract + `posts` 為 loader return array；**未改**）
- `src/views/admin/index.ejs`（Categories & Tags section locals block L1435–1451、governance aside L1466–1477、registry surface-grid、既有 `posts.forEach` / `.filter` 聚合慣例 L251/L306/L1442/L1450、`.surface-card`/`.cat-totals-row`/`.totals-pill(.warn)` class）
- `package.json`（scripts）

---

## D. Files changed

- `src/views/admin/index.ejs`（**唯一** source 變更；+62 / −0）
  1. **locals block 內新增 view 端 reduce**（接於既有 `tagMismatchTagCount` 之後）：`posts.forEach` 聚合出 `govPostsTotal` / `govPostsWithSignals` / `govSignalTotal` / `govPostsUnknownTag` / `govPostsUnknownCategory` / `govPostsMismatchTag` / `govPostsMismatchCategory`。沿用既有聚合慣例；nullable-safe（`p.governanceSignals` 缺值 → `{}`）。
  2. **summary card 區塊**（接於 governance aside 之後、`<div class="surface-grid">`〔registry cards〕之前）：`.surface-card` 內含
     - 標題「🏷️ 內容治理摘要 / Governance summary」+ `read-only · derived` tag；
     - lede：說明 post-level rollup vs 下方 key-level totals 維度不同、互補；逐篇明細以 Posts index badge / detail panel 為準；
     - `.cat-totals-row` 內 totals-pill：篇數檢視（中性）/ 篇有治理訊號（`>0 warn`）/ 治理訊號總數（`>0 warn`）/ cross-site mismatch · tag（post-level）/ cross-site mismatch · category（post-level）；
     - same-source / healthy 註：`unknownTag||unknownCategory>0` → 標明與下方 key-level totals 同源；否則 healthy empty-state「✓ …未偵測到…此僅反映現況快照，不代表全站永久正確」；
     - anti-write / non-blocker footer：「治理訊號為 read-only 人眼提示，非 build blocker…Admin 不會自動修改…validator 仍為 ground truth」。
  3. **CSS**：**零新 class**（沿用既有 `.surface-card` / `.cat-totals-row` / `.totals-pill` / `.totals-pill.warn` / `.section-tag` / `.surface-note`；僅用 inline `style` 微調 margin / 背景，與既有卡片慣例一致）。

- `docs/20260616-admin-governance-summary-card-implementation-record.md`（本檔，新增）
- `CLAUDE.md`（極小 ledger sync）

---

## E. Implementation summary（對齊 preanalysis）

| preanalysis 要求 | 本實作 |
|---|---|
| §2 採 Option B（Categories & Tags 前方，不放 Dashboard / 不改 Posts index） | ✅ 插於該 section aside 後、registry grid 前 |
| §3.1 主軸 net-new rollup | ✅ posts with signals / total signal count（既有 totals 皆無此統一 per-post rollup） |
| §3.2 post-level cross-site mismatch（補 key-level 視角） | ✅ mismatch · tag / · category 為 post-level |
| §3.2 重疊分項從簡 + 明示同源 | ✅ unknown tag/category posts 移入 same-source 註，明標與 `postWithUnknownTagCount` / `unknown category` totals 同源 |
| §3.3 healthy empty-state 不過度承諾 | ✅「此僅反映現況快照，不代表全站永久正確」 |
| §4 read-only only | ✅ 只用 `<div>`/`<span>`/`<p>`/`<strong>`/`<code>`；無 form/button/input/select/textarea/fetch/onclick |
| §4 warn 一級不暗示 build blocker | ✅ 只用 `.totals-pill.warn`（黃）；footer 明示「非 build blocker」 |
| §4 無 per-post prescription | ✅ 只列全站計數；無「應改為 X」 |
| §5 不改 loader（view 端 reduce） | ✅ loader 未動；沿用既有 `posts.forEach` 慣例 |
| §6 不影響 search/filter/sort | ✅ 靜態 aggregate；不在 Posts index section；不碰其 JS |

---

## F. Validation results

| 檢查 | 結果 |
|---|---|
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（normal baseline carry-forward；admin EJS dev-only 不影響 validator） |
| dev admin render（`node src/scripts/build-github.js --mode=dev`） | ✅ `11 posts` 無 EJS error，寫出 `.cache/pages/admin/index.html`；`tagUsage: 7 defined / 1 unknown` |
| 渲染卡片數值 | total **11** 篇檢視 / **1** 篇有治理訊號 / **1** 治理訊號總數 / cross-site mismatch · tag **0** / · category **0** / same-source 註「**1** 篇含 unknown tag、**0** 篇 unknown category」 → 與 L2 UI human-accepted（10「gov ✓」+ 1「gov: 1」= `phonics-practice-sheet-download` unknownTagCount=1）**一致** |
| `check:adsense-resolver` | 34 / 0 carry |
| `check:adsense-article-block` | 13 / 0 carry |
| `check:adsense-anchor-wiring` | 14 / 0 carry |
| `check-commerce-affiliate-resolver`（node 直呼） | 23 / 0 carry |
| `check:blogger-adsense-output` | 85 / 0 by construction 不受影響（admin EJS dev-only，不在 build:blogger 路徑） |
| 安全 grep（新增 diff 行，排除註解列舉行） | 0 個實際 `<form>`/`<button>`/`<input>`/`<select>`/`<textarea>`/`fetch(`/`onclick`/`onchange`；渲染卡片區 write-element count = 0 |

---

## G. Safety / read-only confirmation

- ❌ **未**改 `src/scripts/load-admin-posts.js`（loader）
- ❌ **未**改 validator（`validate-content.js`）
- ❌ **未**改 admin search / filter / sort JS（summary card 不在 Posts index section）
- ❌ **未**改 Posts index table 結構 / `colspan` / `<thead>`
- ❌ **未**改 content / settings / tags.json / categories.json / 任何 frontmatter·markdown
- ❌ **未**新增 Apply / Save / Auto-fix / Write / Mutate / browser write / middleware / CLI fix
- ❌ **未**新增 form / button / input / select / textarea / fetch / onclick
- ❌ **未**引入 per-post prescription（「應改為 X」規則引擎）
- ❌ **未**引入 error / blocker severity（只 warn 一級）
- ❌ **未** `npm install` / 未動 `package.json` / lockfile
- ❌ **未** production build / deploy / push gh-pages / 重貼 Blogger / 動 GA4·AdSense·commerce 後台
- ✅ source mutation = `src/views/admin/index.ejs` 單一檔（+62/−0）+ 本 record doc + CLAUDE.md 極小 ledger sync

---

## H. 下一階段缺口（未在本 phase 處理）

1. **逐字文案一致性審稿（切片 5）**：summary card 與既有 empty-state / anti-write 文案之逐字一致性；獨立低風險 phase。
2. **Dashboard 極簡 governance pill**（preanalysis §2 次選）：若 user 要 Dashboard glance；須避免與本卡雙重來源困惑；獨立 micro-phase。
3. **governance filter chip / 點數字跳轉篩選**：須改 Posts index filter/sort JS；高風險獨立 phase + approval。
4. **loader 聚合搬遷**：若未來多 consumer 共用 / 要寫 unit test 才考慮；本 phase 維持 view 端 reduce。
5. **validator per-post aggregation**（detail panel 仍 deferred）：獨立 docs-only preanalysis。

---

## I. Recommended next phase

- **保守預設（推薦）**：`20260616-admin-governance-summary-card-human-acceptance-docs-only-a` —— 人眼於 dev mode 載入 `/admin/`，捲至 Categories & Tags section 開頭目視確認 summary card 顯示正確、無重複統計困惑、無 Apply/Save 誤導、無破版；docs-only acceptance。
- **並行不衝突**：切片 5 empty-state 文字審稿 / validator per-post aggregation preanalysis（docs-only）。
- **紅線提醒**：Dashboard pill / filter chip / 跳轉篩選 / loader 聚合搬遷 / write path / per-post prescription 一律須獨立 phase + user explicit approval；不跳階。

---

（本紀錄結束）
