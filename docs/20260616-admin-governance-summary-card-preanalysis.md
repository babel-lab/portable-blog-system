# ADMIN — Governance Summary Card Preanalysis（docs-only）

- **Phase**：`20260616-admin-governance-summary-card-preanalysis-docs-only-a`
- **日期**：2026-06-16（10:00 起；am session）
- **性質**：docs-only preanalysis（**不**實作；**不**改 src / views / scripts / loader / validator / content / settings / tags.json / categories.json / frontmatter / markdown；**不** build / deploy / Blogger repost / npm install）
- **承接**：
  - `docs/20260616-admin-suggested-fix-l2-readonly-ui-implementation-record.md` §H.3（明列「分類治理摘要卡（aggregate）」為下一階段缺口，並提醒「preanalysis E.2 提醒避免重複統計，須先確認價值」→ 本 doc 即此價值確認步驟）
  - `docs/20260616-admin-suggested-fix-l2-readonly-ui-human-acceptance-record.md`（L2 read-only UI human acceptance PASS）
  - `docs/20260616-admin-suggested-fix-readonly-ui-preanalysis.md`（顯示哲學 / L1–L4 分級 / UI contract 紅線）
  - `docs/20260615-admin-content-taxonomy-governance-preanalysis.md`（taxonomy 治理規則 / 五維度 / status·surface 分級）

---

## 0. Baseline verify

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main
HEAD           : f403dca2722661496cd4b073c5dfd5083c8e026f == origin/main
working tree   : clean
last subject   : docs(admin): record suggested-fix l2 read-only ui human acceptance
```

→ baseline 完全符合 phase 指示。未做任何 merge / rebase / reset / amend / force push。

---

## 1. 目前資料來源盤點

### 1.1 loader 目前已 derive 哪些 governanceSignals

`src/scripts/load-admin-posts.js` 之 `derivePostGovernanceSignals(post, catLookup, tagLookup)`（L928–971）已對**每篇 admin post**（含 draft / 全 status，github + blogger 兩 source）derive 一個 `post.governanceSignals` 物件，五欄位 contract：

| 欄位 | 型別 | 意義 |
|---|---|---|
| `unknownTagCount` | number | registry（tags.json）找不到對應 id/slug 之 tag 數 |
| `unknownCategoryFlag` | boolean | registry（categories.json）找不到對應 id/slug 之 category（category 非空時） |
| `crossSiteMismatchTagCount` | number | tag.site 非空且不含本文 `sourceSite` 之 tag 數 |
| `crossSiteMismatchCategoryFlag` | boolean | category.site 非空且不含本文 `sourceSite` |
| `signalSum` | number | 上四項合計（boolean 各算 1） |

注意：
- mismatch 採 **sourceSite-based**（`content/{site}/posts/` 之 site，即作者主寫站台），與 `buildCategoryUsage` / `buildTagUsage` 之 admin 慣例一致；**非** validator 之 `post.site`。
- `uncategorized`（category 空）/ `untagged`（tags 空）**不**計入 governanceSignals（屬既有 bucket 計數責任，見 §1.3）。

### 1.2 admin view 目前已在哪些地方顯示 per-post governance

`src/views/admin/index.ejs`（HEAD `f403dca`）已有兩處 per-post 顯示（皆 L2 read-only UI 落地，human-accepted）：

1. **Posts index row badge**（L757–760 附近）：既有 readiness（col-narrow）cell 內，`govSum = p.governanceSignals.signalSum`；`>0 → b-warn「gov: N」`、`=0 → b-ok「gov ✓」`。
2. **detail panel「Governance signals」section**（L1011–1060 附近）：展開 row 列四訊號 + signalSum + empty-state「✓ 皆已對齊」+ anti-write 一句話 + 治理 docs cross-link。

→ **目前無任何「全站 per-post governance rollup」單一彙總顯示**；只有逐 post 兩處。

### 1.3 是否已有足夠資料可做全站彙總

**有兩類既存彙總資料，但與 per-post governance rollup 不完全等價**——這是本 phase 最關鍵的價值釐清：

**(A) loader 已 derive 之 `categoryUsage.totals` / `tagUsage.totals`**（已在 Categories & Tags section 以 `totals-pill` 顯示，L1499–1733）：

| 既有 totals 欄位 | 維度 | 與 per-post governance 之關係 |
|---|---|---|
| `categoryUsage.totals.unknownCategoryPosts` | **post-level**（# 篇 category unknown） | 與 governanceSignals `unknownCategoryFlag` 聚合**概念等價** → ⚠️ 重複風險 |
| `tagUsage.totals.postWithUnknownTagCount` | **post-level**（# 篇含 ≥1 unknown tag） | 與 governanceSignals `unknownTagCount>0` 聚合**概念等價** → ⚠️ 重複風險 |
| `categoryUsage.totals.uncategorizedPosts` | post-level（# 篇無 category） | governanceSignals **不含** uncategorized → 不重複，但屬不同訊號家族 |
| `tagUsage.totals.untaggedPosts` | post-level（# 篇無 tag） | 同上，不重複 |
| `categoryUsage.totals.unusedCategoryCount` / `unknownCategoryKeyCount` | **registry-key-level** | 與 per-post 維度不同；不重複 |
| `tagUsage.totals.unusedTagCount` / `unknownTagKeyCount` | registry-key-level | 同上 |

**(B) view 端已 reduce 出之 mismatch 計數**（`index.ejs` L1442 / L1450）：

| 既有 view 變數 | 維度 | 與 per-post governance 之關係 |
|---|---|---|
| `catMismatchCategoryCount = catPer.filter(e=>e.crossSiteMismatchCount>0).length` | **registry-key-level**（# 個有 mismatch 之 category key） | governanceSignals `crossSiteMismatchCategoryFlag` 為 **post-level** → **角度不同，不重複** |
| `tagMismatchTagCount = tagPer.filter(...).length` | registry-key-level（# 個有 mismatch 之 tag key） | 同上，post-level vs key-level → **不重複** |

**結論**：
- 資料**充足**——summary card 所需數值全可由現成 `posts[].governanceSignals` view 端 reduce 得到（in-view reduce 已是既有 pattern，見 §5）。
- 但**部分指標與既有 totals-pill 概念重疊**（unknown category posts、posts-with-unknown-tag）。summary card 的**真正 net-new 價值**＝目前**任何地方都沒有**的「**統一 per-post rollup**」：
  - 「**N 篇文章有 ≥1 治理訊號**」（跨四維度的單一 per-post flag rollup）— 全新。
  - 「**全站治理訊號總數**（Σ signalSum）」— 全新。
  - 「**cross-site mismatch（post-level）**」— 與既有 key-level mismatch 是不同角度，補上 post-level 視角。
- 故 summary card **應以「統一 per-post rollup」為主軸**，對與既有 totals 重疊之分項採「明示同源、避免讀者誤以為是新問題」之文案（見 §3 / §4）。

---

## 2. summary card 建議位置（優缺點比較）

| 選項 | 位置 | 優點 | 缺點 |
|---|---|---|---|
| **A. Dashboard top cards** | `surface-grid`（L330–402）新增第 7 張 `surface-card`「🏷️ 內容治理」 | 置頂一眼可見；與既有 6 卡視覺一致；單一 glance 即知治理健康度 | Dashboard 已 6 卡偏密；治理屬 taxonomy-specific，與其餘 5 個「輸出/追蹤面」概念略異；與下方 Categories & Tags 之 totals-pill **空間上分離** → 重複統計感更明顯 |
| **B. Categories & Tags section 前方（推薦）** | 該 section 開頭、既有 governance aside（L1466–1477）與 `cat-totals-row`（L1500）之間，新增一張 governance rollup card | 與其所彙總之 per-category / per-tag detail **上下相鄰** → 讀者同時看到 rollup 與明細，最易理解、重複風險最低（可直接在文案標明「與下方 key-level totals 同源、此處為 post-level rollup」）；緊鄰既有 totals-pill 群 → 減少 fragmentation；不影響 Dashboard 密度 | 非 Dashboard glance 可見；位置在頁面中段（須捲動） |
| C. Posts index 前方 | Posts index section 表格上方 banner | 與 per-post badge（同 section）相鄰，rollup↔逐筆對照直覺 | Posts index 為**操作型表格**（search/filter/sort）；插入 aggregate banner 增加噪音、與該 section「逐 post 檢視」職責混雜；且 banner 緊貼 filter UI 有誤觸/版面風險 |
| D. 獨立新 section | Dashboard 與 Categories & Tags 之間新增獨立 section | 職責清晰、可獨立 anchor | 多一個 nav 跳點 + section；對「單一 read-only 摘要卡」而言過重；與 Categories & Tags 內容高度相關卻被拆開 |

**推薦：Option B**（Categories & Tags section 前方）。
- 理由：與既有治理明細 / totals-pill **同處一節**，是**降低重複統計困惑**的最佳結構（可在同一視野內用文案明確區分「post-level rollup（本卡）」vs「key-level / 分項 totals（下方既有 pill）」）；符合保守落地（單一卡、單一位置、最小風險、不動 Dashboard、不動 Posts index 操作區）。
- 次選：若未來 user 仍要 Dashboard glance，可於 Dashboard 放**一行極簡 pill**（「治理：N 篇有訊號」）並以文案標明「明細見 Categories & Tags」——但本 phase **不建議同時兩處**（避免重複統計感）；Dashboard pill 留作未來獨立 micro-phase，且須先確認不與 Option B 卡片造成雙重來源困惑。

---

## 3. summary card 可顯示的 read-only 指標

以下全可由 `posts[].governanceSignals` view 端 reduce（§5）得到，**不需改 loader**。指標分兩層，並明示與既有 totals 之關係：

### 3.1 主軸：統一 per-post rollup（net-new，本卡核心）

| 指標 | 來源 reduce | 性質 |
|---|---|---|
| **total posts checked** | `posts.length`（admin loader 全 status，含 draft） | 中性計數 |
| **posts with governance signals** | `posts.filter(p => (p.governanceSignals?.signalSum||0) > 0).length` | **net-new** rollup；`>0 → warn`，`=0 → healthy` |
| **total signal count** | `posts.reduce((s,p)=>s+(p.governanceSignals?.signalSum||0),0)` | **net-new** rollup |

### 3.2 分項：per-post per-dimension（部分與既有 totals 同源，須文案標明）

| 指標 | 來源 reduce | 與既有 totals 關係 |
|---|---|---|
| posts with unknown tag | `filter(p=>p.governanceSignals.unknownTagCount>0).length` | ⚠️ 概念等同 `tagUsage.totals.postWithUnknownTagCount` → 文案標「同源；此為 governanceSignals 視角」 |
| unknown tag count（總數） | `reduce(...unknownTagCount)` | tag-instance 級總數（既有 totals 無此精確總和） |
| posts with unknown category | `filter(p=>p.governanceSignals.unknownCategoryFlag).length` | ⚠️ 概念等同 `categoryUsage.totals.unknownCategoryPosts` → 同源標示 |
| posts with cross-site mismatch · tag | `filter(p=>p.governanceSignals.crossSiteMismatchTagCount>0).length` | **post-level**；與既有 `tagMismatchTagCount`（key-level）**不同角度**，補新視角 |
| posts with cross-site mismatch · category | `filter(p=>p.governanceSignals.crossSiteMismatchCategoryFlag).length` | post-level；與 `catMismatchCategoryCount`（key-level）不同角度 |

> ⚠️ **避免重複統計原則**（呼應 suggested-fix preanalysis E.2）：分項中「posts with unknown tag / unknown category」與既有 totals-pill 同源。建議實作時 **summary card 只放主軸三指標 + cross-site mismatch（post-level，補新視角）為預設顯示**；unknown tag/category 之 post-level 分項可：(a) 省略（讀者看下方既有 pill 即可），或 (b) 顯示但加一句「與下方 key-level / 分項 totals 同源，僅維度不同」。最終呈現範圍由 implementation phase 依版面與 user 偏好決定；本 preanalysis **建議採 (a) 從簡**，主軸三指標 + post-level mismatch 兩項，最大化 net-new、最小化重複。

### 3.3 no-op healthy state 文案

- `posts with governance signals === 0` 時：正向確認，例如「✓ 全 N 篇文章之分類 / 標籤治理訊號皆已對齊（無 unknown / 無 cross-site mismatch）」。
- 須與既有 detail panel empty-state「✓ 皆已對齊」用語**一致**（逐字一致性審稿屬切片 5；本卡先沿用同調性）。
- healthy 文案**不**承諾「內容完美 / 已驗證」——只陳述「這四維治理訊號為零」。

---

## 4. UI 原則（對齊 suggested-fix preanalysis 紅線）

- **read-only**：只用 `<div>` / `<span>` / `<p>` / `<dl>`/`<dt>`/`<dd>` / `<strong>` / `<code>` / `<a>`；**無** `<form>` / `<button>` / `<input>` / `<select>` / `<textarea>` / `fetch(` / `onclick` / 任何 event handler。
- **不顯示 per-post prescription**：summary card 只列**全站計數**，**無**「某篇應改為 X」「建議改成 Y」字樣；逐 post 明細仍在既有 detail panel（亦無 prescription）。
- **不提供 Apply / Save / Auto-fix / Write / Mutate**：無任何寫入 affordance 或寫入暗示。
- **warning wording 不暗示 build blocker**：沿用 `totals-pill.warn`（黃 `#fff3cd`/`#856404`）一級 severity；**不**用紅色 `b-missing` / 「error」/「必須修正」/「build 失敗」字樣。明示「治理訊號 = 人眼可判斷之提示，非 build block」（`validate:content` 對 production 仍 0 error）。
- **empty-state 清楚但不過度承諾**：見 §3.3。
- **明示 source / 範圍差異**：沿用既有慣例標明「admin loader（含 draft / 全 status）vs validator（ready/published）→ 計數可能不對齊屬設計」+ 「不取代 `npm run validate:content`（validator 為 ground truth）」+ cross-link 治理 docs。
- **重複統計揭露**：若顯示與既有 totals 同源之分項，須一句話標明同源（§3.2）。

---

## 5. 是否需要改 loader

**不需要改 loader。** 結論：summary card 可 **100% 由 view 端 reduce `posts[].governanceSignals` 完成**。

理由與根據：
- **in-view reduce 已是既有 established pattern**：`index.ejs` 已有多處 view 端聚合——
  - L251 / L306：`posts.forEach(...)` 算 Dashboard 統計（contentKind / blogger mode / published url counts 等）。
  - L1442：`catMismatchCategoryCount = catPer.filter(e => e.crossSiteMismatchCount > 0).length`。
  - L1450：`tagMismatchTagCount = tagPer.filter(...).length`。
  → 新增「reduce over `posts[].governanceSignals`」與既有寫法同構，**零新模式**。
- loader 已對每 post derive 完整五欄位 `governanceSignals`（§1.1），view 端只需做 `filter` / `reduce` 加總。
- **不改 loader 的好處（保守）**：
  - loader 無 unit test harness（純 dev-mode-only），改 loader 風險面較大；view 端聚合與既有 pattern 一致、backout cost 趨近零（移除一段 EJS 即可）。
  - 不擴張 `build-github.js` 之 admin render context（context 已含 `posts`，無須新增 key）。
- **若未來**要把聚合移進 loader（例如多個 consumer 共用、或要寫 unit test）：屬獨立 phase，須說明動機與風險；本 phase **不建議**為單一 view consumer 提前移進 loader（YAGNI + 保守）。

---

## 6. 對 search / filter / sort 之影響

**完全不影響。**
- summary card（Option B）為**靜態 aggregate 顯示區塊**，置於 Categories & Tags section 開頭，**不在** Posts index section 內、**不碰** Posts index 之 `<thead>` / `colspan` / row 欄位索引 / search input / filter chip / sort JS。
- summary card **不**新增任何 filter chip、**不**連動 Posts index 篩選（governance filter chip 屬高風險、須改 filter JS → 獨立 phase，本卡不做）。
- 純展示一段由現成 `posts` reduce 出之數字 → 對 Posts index 操作行為零耦合。

> 後續若要「點 summary card 之 mismatch 數 → 跳轉並篩出對應 post」之互動：須改 Posts index filter/sort JS（與 implementation record §H.1 同屬高風險 filter-chip phase），**獨立 phase + user explicit approval**；不在本卡範圍。

---

## 7. Acceptance criteria（未來 implementation phase 用）

### 7.1 Source acceptance
- 唯一 source 變更 = `src/views/admin/index.ejs`（additive 一段 EJS + 對應 scoped CSS class，若沿用既有 `.totals-pill` / `.surface-card` 則 CSS 變更可為零或極小）。
- **0 個** loader / validator / content / settings / tags.json / categories.json / frontmatter / build-github.js / build output / dist 變更。
- 安全 grep（新增 diff 行）：0 個實際 `<form>` / `<button>` / `<input>` / `<select>` / `<textarea>` / `fetch(` / `onclick` / prescription（「應改為」「建議改為」）。
- summary card 數值由 `posts[].governanceSignals` reduce；無 hardcoded 數字。

### 7.2 Implementation acceptance
- `npm run validate:content` = **0 errors / 94 warnings / 84 posts**（normal baseline 不變；本卡為 admin EJS dev-only，不影響 validator）。
- dev build admin render（`node src/scripts/build-github.js --mode=dev`）寫出 `.cache/pages/admin/index.html` 無 EJS error。
- summary card 渲染數值與逐 post 一致：以現有資料應為「**total posts checked = admin loader post 數**；**posts with signals = 1**（`phonics-practice-sheet-download`，unknownTagCount=1）；**total signal count = 1**；cross-site mismatch（post-level）= 0」（與 L2 UI human-accepted 之 10「gov ✓」+ 1「gov: 1」一致）。
- `check:adsense-resolver` 34/0 · `check:adsense-article-block` 13/0 · `check:adsense-anchor-wiring` 14/0 · `check-commerce-affiliate-resolver` 23/0 · `check:blogger-adsense-output` 85/0 carry（admin EJS dev-only，不在 build:blogger 路徑）。

### 7.3 Human visual acceptance
- 人眼於 dev mode 載入 `/admin/`，捲至 Categories & Tags section 開頭，目視確認 governance summary card：
  - 顯示 total posts / posts with signals / total signal count（+ post-level mismatch）；
  - 與既有 totals-pill **無重複統計困惑**（文案有區分 post-level rollup vs key-level totals）；
  - warn 用黃色一級、無紅色 error 感、無 Apply/Save/Auto-fix 按鈕或寫入暗示；
  - healthy/empty-state（若數值為 0 之分項）文案清楚不過度承諾；
  - 無破版。
- docs-only human acceptance record 收尾。

---

## 8. 下一階段建議

- **implementation phase**：`20260616-admin-governance-summary-card-implementation-a`
  - 性質：implementation（改 `src/views/admin/index.ejs` 單一檔；view 端 reduce；**不**改 loader/validator/content/settings）。
  - 採 Option B 位置；主軸三指標 + post-level cross-site mismatch；重疊分項從簡（§3.2 (a)）。
  - **須 user explicit approval**（會動 source view）→ NOT docs-only。
- **human acceptance phase**：`20260616-admin-governance-summary-card-human-acceptance-docs-only-a`
  - 性質：docs-only；人眼目視 + acceptance record。
- **仍禁止 write path 的紅線**（跨所有後續 phase，不跳階）：
  - ❌ 不得新增 Apply / Save / Auto-fix / Write / Mutate / browser write / middleware / admin-write-cli 接線。
  - ❌ 不得引入 per-post prescription（規則引擎「應改為 X」）。
  - ❌ 不得引入 error / blocker severity（只 warn 一級）。
  - ❌ governance filter chip / Posts index 篩選連動 / 獨立 governance 欄 / loader 聚合搬遷 一律須**獨立 phase + user explicit approval**。
  - ❌ 不得 build prod / deploy / push gh-pages / 重貼 Blogger / 動 GA4·AdSense·commerce 後台。

---

（本 preanalysis 結束）
