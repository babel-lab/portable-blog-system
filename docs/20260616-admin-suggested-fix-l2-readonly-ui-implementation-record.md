# ADMIN — Suggested-Fix L2 Read-Only UI Implementation Record

- **Phase**：`20260616-am-1-admin-suggested-fix-l2-readonly-ui-implementation-a`
- **日期**：2026-06-16（09:33 起；am session）
- **性質**：implementation（read-only UI；改 `src/views/admin/index.ejs` 單一檔；**不**改 frontmatter / content markdown / `tags.json` / `categories.json` / validator / loader / build output；**不**啟用 write / Apply / Save / auto-fix；**不** deploy / 重貼 Blogger）
- **承接**：
  - `docs/20260616-admin-suggested-fix-readonly-ui-preanalysis.md`（顯示哲學 / L1–L4 分級 / IA / 資料 contract / 紅線；human-accepted）
  - `feeb224 feat(admin): link suggested-fix governance docs`（切片 1：sub-bucket docs cross-link）
  - `f285f09 feat(admin): derive governance signal counts` + `c0a4794 docs(admin): accept loader derive implementation`（切片 2：loader `post.governanceSignals.*` derive；human-accepted）

---

## A. Baseline verify

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main (ahead/behind 0/0)
HEAD           : c0a4794 == origin/main
working tree   : clean
last subject   : docs(admin): accept loader derive implementation
```

→ baseline 完全符合 phase 指示。

---

## B. 本階段目標

接 preanalysis §H.3 切片 3 + 切片 4：把 loader 已 derive（切片 2）之 per-post `post.governanceSignals.*` **接到 ADMIN UI**，使後台可見治理訊號計數，但**仍 100% read-only**。

保守調整（避免一次動太多 + 不碰 search/filter/sort JS）：
- 切片 4（detail panel section）**完整實作**（additive，最低風險）。
- 切片 3（Posts index）**降規實作**：在**既有** readiness cell 內加 1 個 governance badge，**不**新增整欄、**不**改 `colspan="7"`、**不**加 filter chip → 不觸碰 row 的欄位索引 / search / filter / sort JS。filter chip + 獨立欄 + 分類治理彙總卡留作下一階段缺口（見 §G）。

---

## C. Files read（read-only）

- `docs/20260616-admin-suggested-fix-readonly-ui-preanalysis.md`（顯示哲學 / 分級 / contract / 紅線）
- `src/scripts/load-admin-posts.js`（`derivePostGovernanceSignals` 五欄位 contract：`unknownTagCount` / `unknownCategoryFlag` / `crossSiteMismatchTagCount` / `crossSiteMismatchCategoryFlag` / `signalSum`）
- `src/views/admin/index.ejs`（Posts index 表格 col-narrow readiness cell；detail panel Readiness section L846–999；slice-1 governance note 樣板 L1409；bucket-note anti-write 樣板 L1620）
- `src/scripts/build-github.js`（L803–825 dev-mode-only admin render → `.cache/pages/admin/index.html`）
- `package.json`（scripts）

---

## D. Files changed

- `src/views/admin/index.ejs`（**唯一** source 變更；+58 / −1）
  1. **CSS**：新增 additive `.b-warn` badge class（黃色 `#fff3cd` / `#856404`；同 `totals-pill.warn` 色票）。刻意**不**重用 `b-missing`（紅色）→ 避免暗示 build block / error；只表「人眼可判斷之治理訊號」。
  2. **Posts index row badge**：既有 readiness（col-narrow）cell 內加 per-post governance badge —— `signalSum > 0 → b-warn「gov: N」`；`= 0 → b-ok「gov ✓」`。只顯示計數；展開 row 看明細。**不**新增欄、**不**改 colspan、**不**改 filter JS。
  3. **detail panel Governance signals section**：additive `<div class="detail-section">`，插在 Readiness 與 Dates section 之間。列 `unknown tag(s)` / `unknown category` / `cross-site mismatch · tag(s)` / `cross-site mismatch · category` 四訊號 + signalSum 摘要 + empty-state 正向確認「✓ 皆已對齊」+ anti-write 一句話 + 治理 docs cross-link（兩份 governance / suggested-fix preanalysis）+ source / validator 範圍差異說明。

- `docs/20260616-admin-suggested-fix-l2-readonly-ui-implementation-record.md`（本檔，新增）
- `CLAUDE.md`（極小 ledger sync）

---

## E. Implementation summary（顯示哲學對齊 preanalysis）

| preanalysis 要求 | 本實作 |
|---|---|
| C.2 #1 每個 suggested-fix 含 anti-write 一句話 | ✅ section footer「Admin 不自動修；請手改 frontmatter / tags.json / categories.json 後 `npm run validate:content`」 |
| C.2 #3 per-post signal 含計數不含 prescription | ✅ 只渲染 count / flag；無「應改為 X」字樣 |
| C.2 #4 empty state 正向確認 | ✅ `signalSum===0 → ✓ 皆已對齊` |
| D.2 L2 須 cross-link governance docs | ✅ 連 `20260615-…-taxonomy-governance-preanalysis.md` + `20260616-…-suggested-fix-readonly-ui-preanalysis.md` |
| E.3 Severity 只用 warn 一級 | ✅ 只用 `b-warn`（黃）；無 error / blocker 級別 |
| E.3 Source 標籤 | ✅ 明示「admin loader（含 draft / 所有 status）vs validator（ready/published）→ 計數可能不對齊屬設計」 |
| G.2 / H.1 read-only 元素 only | ✅ 只用 `<span>` / `<p>` / `<dl>` / `<dt>` / `<dd>` / `<code>` / `<a>`；**無** form / button / input / select / textarea / fetch / onclick |
| F.2 不擴 loader 為 write field | ✅ 未改 loader；沿用切片 2 已 derive 欄位 |

---

## F. Validation results

| 檢查 | 結果 |
|---|---|
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（normal baseline carry-forward） |
| dev build admin render（`node src/scripts/build-github.js --mode=dev`） | ✅ 寫出 `.cache/pages/admin/index.html`，無 EJS error |
| Governance signals section 渲染數 | 11（11 篇 post detail panel 各 1） |
| Posts index gov badge | 10 篇「gov ✓」+ 1 篇「gov: 1」 |
| 唯一 gov signal post | `phonics-practice-sheet-download`（sourceSite=blogger，tag `download` 未在 tags.json → unknownTagCount=1）→ 真實且正確之治理訊號 |
| `check:adsense-resolver` | 34 / 0 carry |
| `check:adsense-article-block` | 13 / 0 carry |
| `check:adsense-anchor-wiring` | 14 / 0 carry |
| `check-commerce-affiliate-resolver` | 23 / 0 carry |
| `check:blogger-adsense-output` | by construction 不受影響（admin EJS 為 dev-only，不在 build:blogger 路徑；85/0 carry） |
| 安全 grep（新增 diff 行） | 0 個實際 `<form>` / `<button>` / `<input>` / `<select>` / `<textarea>` / `fetch(` / `onclick` / prescription（唯二命中為**註解**說明「不含 應改為 X」） |

---

## G. Safety / no-mutation confirmation

- ❌ **未**改任何 `.md` frontmatter / content markdown
- ❌ **未**改 `content/settings/tags.json` / `categories.json`
- ❌ **未**改 `src/scripts/validate-content.js`
- ❌ **未**改 `src/scripts/load-admin-posts.js`（沿用切片 2 已 derive 欄位）
- ❌ **未**改 `src/scripts/build-github.js` / build output / dist
- ❌ **未**啟用 admin write / Apply / Save / auto-fix / browser write / middleware / CLI fix-cmd
- ❌ **未**新增 form / button / input / select / textarea / fetch / onclick
- ❌ **未**引入 per-post prescription（「應改為 X」/「建議改為 Y」規則引擎）
- ❌ **未**引入 error / blocker severity（只新增 warn 一級）
- ❌ **未** `npm install`；**未**動 `package.json` / lockfile
- ❌ **未** build prod / deploy / push gh-pages / 重貼 Blogger
- ❌ **未**動 GA4 / AdSense / commerce 後台
- ✅ source mutation = `src/views/admin/index.ejs` 單一檔 + 本 record doc + CLAUDE.md 極小 ledger sync

---

## H. 下一階段缺口（未在本 phase 處理）

1. **Posts index filter chip**（preanalysis 切片 3 高風險部分）：`has-unknown-tag` / `has-unknown-category` / `has-cross-site-mismatch` read-only filter chip → 須改 search/filter/sort JS 之欄位邏輯；獨立 phase。
2. **獨立 governance signal column**：本 phase 為避免 colspan / JS 連動採「既有 cell 內加 badge」；若未來要獨立欄，須同步改 `colspan="7"` + thead + JS column index；獨立 phase。
3. **分類治理摘要卡（aggregate）**：全站「N 篇有 unknown tag / M 篇 cross-site mismatch」彙總卡（registry 層已有 totals pills；per-post 彙總尚無）；獨立 phase（preanalysis E.2 提醒避免重複統計，須先確認價值）。
4. **empty-state 文字審稿切片 5**：各 sub-bucket / panel empty 文字一致性審稿；獨立低風險 phase。
5. **validator per-post aggregation**（preanalysis I / night-9 §G.3）：per-post warning count（目前 detail panel 顯示 deferred）；獨立 docs-only preanalysis。

---

## I. Recommended next phase

- **保守預設（推薦）**：`20260616-…-human-acceptance-a` —— 人眼於 dev mode 載入 `/admin/`，展開含訊號之 post（`phonics-practice-sheet-download`）目視確認 Governance signals section + row badge 顯示正確、無破版、無 Apply/Save 誤導；docs-only acceptance。
- **並行不衝突**：切片 5 empty-state 文字審稿（低風險）/ validator per-post aggregation preanalysis（docs-only）。
- **紅線提醒**：filter chip / 獨立欄 / write path / per-post prescription 一律須獨立 phase + user explicit approval；不跳階。

---

（本紀錄結束）
