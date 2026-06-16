# ADMIN readability / IA refinement preanalysis（docs-only）

> Phase: `20260616-admin-readability-ia-refinement-preanalysis-docs-only-a`
> Date: 2026-06-16 17:05
> Type: docs-only preanalysis（只分析 + 文件，**不**實作）

---

## A. Phase name

`20260616-admin-readability-ia-refinement-preanalysis-docs-only-a`

承接 `pm-13`（governance aggregation detail panel human visual acceptance，verdict「PASS with minor readability watch」）之並行建議：
> 可選並行 = `20260616-admin-readability-information-architecture-refinement-preanalysis-docs-only-a`（ADMIN 高密度 readability/IA 改善 preanalysis）。

本 phase 把該「minor readability watch」正式展開為一份保守、可落地的 readability / IA refinement 計畫，但**本段不實作**。重點不是新增功能，而是讓**既有資訊**更容易閱讀、分群、掃描、操作。

---

## B. Baseline

- branch: `main`
- HEAD == origin/main == `5246d78`（`docs(admin): accept validation report detail panel render`）
- working tree: clean / ahead-behind 0/0
- carry-forward（未於本 docs-only phase 重跑；未碰 content/source）：
  - `validate:content` = **0 errors / 94 warnings / 84 issue-posts**
  - `check:adsense-resolver` 34/0 · `check:adsense-article-block` 13/0 · `check:adsense-anchor-wiring` 14/0
  - `check:blogger-adsense-output` 85/0 · `check-commerce-affiliate-resolver` 23/0
  - `check:admin-governance-aggregation` 16/0 · `check:validation-report` 14/0 · `check:admin-validation-consume` 12/0
- ADMIN render：dev-mode-only（`build-github.js --mode=dev` → `.cache/pages/admin/index.html`；vite dev serve `/admin/`）；**prod build 不產出、不進 dist、不 deploy、noindex**。11 posts render。

---

## C. Current ADMIN information architecture snapshot

唯讀來源（read-only inspection）：
- `src/views/admin/index.ejs`（**2,684 行**；單檔 standalone HTML，不 wrap base.ejs）
- `src/scripts/load-admin-posts.js`（1,179 行；derive 所有 read-only 欄位）
- `src/scripts/build-github.js` L803–836（dev-mode-only admin render wiring）

### C.1 量化指標（density proxy）

| 指標 | 數值 |
| --- | --- |
| `index.ejs` 總行數 | 2,684 |
| top-level `<h2>` 區段 | 11（Dashboard / Posts / Categories & Tags / Blogger Export / GitHub Pages / AdSense / GA4 / Settings / System checks / Write path；另 Commerce 為 inline `<h3>` section） |
| nav 連結 | 11 |
| `<h3>` 小節 | 45 |
| 一張展開 post detail panel 內 `.detail-section` | **17** |
| 一張展開 post detail panel 內 `<h3>` 子標題 | ~19 |
| 頁首 `.stat-card`（flat 統計條） | 15 |
| Dashboard `.surface-card`（IA shell 卡片） | 6 |
| inline `style="…"` 屬性 | **241** |

### C.2 由上而下的區塊順序（DOM order）

1. **`<h1>` + `.admin-meta`** — 標題 + 產生時間 + 來源 + 模式（dev-mode-only）
2. **`.admin-nav`**（sticky）— 11 個 anchor 連結
3. **`.stats`** — **15 張** flat stat-card（total / ready / draft / published / blogger source / github source / blogger enabled / github enabled / has .fb.md / SEO ok / URL ok / fb published ok / Missing FB URL / Missing Blogger URL / Missing GitHub URL）
4. **Dashboard section**（`20260615-night-1` IA shell）— 系統定位 lede + **6 張** surface-card（📘 Blogger / 🐙 GitHub Pages / 💰 AdSense / 📊 GA4 / 🛒 Commerce / 📚 Content kinds）
5. **Commerce / Affiliate preview**（inline section，L422）— read-only registry preview（DOM 上位於 Posts **之前**）
6. **Posts**（L541）— search / filter（巨大 `<select>` 多 optgroup）/ sort / show-all toggle + 7 欄 table + 每 row 一個展開式 `tr.post-detail`
7. **Categories & Tags**（L1561–2068，**~500 行**）— governance summary card（`pm-8/am-4`）+ Categories registry + Tags registry + Per-category usage table + Uncategorized + Unknown category usage + Unused defined categories + Per-tag usage table + Untagged + Unknown tag usage + Unused defined tags
8. **Blogger Export** / **GitHub Pages** / **AdSense** / **GA4 / Analytics** — 各 1 section（surface-card dl）
9. **Settings**
10. **System checks / Validation** — CLI script 清單 + 「⏳ 未實作」planned-list
11. **Write path**（dormant；黃底警示）

### C.3 單篇 post detail panel 內部結構（展開一篇 = 一面牆）

依序 17 個 `.detail-section` / ~19 個 `<h3>`：
`Missing metadata banner`（條件）→ Identity → Platform Routing → **Readiness**（最長；含 Content readiness / SEO readiness / **Validation warnings（report-backed read-only consume，`pm-18`）**）→ **Governance signals**（含 raw 4 訊號 dl + **Aggregation summary**，`pm-8`）→ Dates → SEO → Blogger channel → GitHub channel → FB promotion → FB Post → **FB Sidecar Dry-run Editor**（client-side preview，Apply 永遠 disabled）→ Related / other links → **sourceKey selector preview**（dry-run）→ Completeness summary → Missing fields（建議補齊）→ Missing fields → **Dry-run edit (no write)** → Future write readiness checklist → Source path。

> 展開**一**篇文章即一次攤開 ~19 個子小節，是目前**最高的單點認知負擔**。

---

## D. Readability pain points

### D.1 頁首兩個 overview 區塊語意重疊（高）
`.stats`（15 張 flat card）與 Dashboard `.surface-grid`（6 張 surface-card）並列於頁首，且**部分數字重複**：`blogger enabled` / `github enabled` 同時出現在 flat 統計條與 Blogger/GitHub surface-card；blogger source / github source / published 等也分散兩處。讀者一進頁面先看到 15 個小卡，再看到 6 張卡，得自己對照「哪個才是主視圖」。屬純認知負擔，可整併。

### D.2 單篇 detail panel 過長、缺分群（高）
~19 個子小節一次全開、無摺疊、無分群。多數情境（例如只想看 routing 或 readiness）也得滾過 FB dry-run editor / sourceKey selector / future-write-checklist / source-path。`minor readability watch` 主要來自此處。

### D.3 「健康狀態」三套語彙未統一（中高）
同一個「這篇 OK 嗎？」的問題，被三套**來源不同**的機制各自呈現，但視覺上沒有清楚分層：
- **Completeness**（admin loader derive）：seo / fb / url / blogger / github / categoryTags / fbPublished。出現在 → 頁首 stat 條、row badge、detail「Missing metadata banner」、detail「Completeness summary」、detail「Missing fields」（出現**兩次** h3，L1383 + L1390）。
- **Governance signals**（admin loader derive，taxonomy）：unknown tag/category + cross-site mismatch。出現在 → row `gov: N` badge、detail「Governance signals + Aggregation summary」、Categories & Tags「Governance summary card」。
- **Validation**（`validate:content` generated report，**ground truth**）：detail「Readiness → Validation warnings」（report-backed read-only consume）；System checks 列 CLI script。

讀者難以一眼判斷**哪個是權威**（validator = ground truth；completeness / governance = admin hint）。三者各有正當存在理由，但缺一句統一 legend 與一致視覺層級。

### D.4 Posts table 多行 cell 密度高（中）
7 欄，但 col1（id/title）一格塞 title + titleEn + id + slug + published+相對時間+source；col2（kind/status）塞 kind + status + src。掃描時縱向資訊量大；欄位本身合理但缺視覺層級（primary vs secondary metadata 同字重/同色階較難快速掃描）。

### D.5 nav 順序 ≠ DOM 順序（中）
nav 將 `#commerce` 排在 AdSense / GA4 **之後**、Settings 之前；但 Commerce inline section 實際 render 於 **Posts 之前**（L422）。點 nav「Commerce」會往**上**跳，與其在 nav 的位置（偏後）直覺不符。另：Dashboard 第 6 張 surface-card「Content kinds」與 nav「Categories / Tags」概念相近但未在 nav 出現，易混。

### D.6 Categories & Tags section 過長（中）
單一 `<h2>` 底下 ~500 行、10+ 個 `<h3>` 子表（registry ×2 + per-category usage + 3 個 category edge-case 表 + per-tag usage + 3 個 tag edge-case 表 + governance summary card），全部常駐展開，無 Categories / Tags 摺疊切分。

### D.7 inline style 散落（低 / 純維護性）
241 個 inline `style="…"`，與 `<style>` block 並存。純 cosmetic / 維護性議題，不影響功能，但讓未來改版視覺一致性較難維護。

---

## E. Information hierarchy 分析（Governance / validation / completeness / system checks）

| 維度 | 來源 | universe | 權威性 | 目前落點 | 問題 |
| --- | --- | --- | --- | --- | --- |
| Completeness | admin loader derive（frontmatter/settings） | 全 11 篇含 draft | admin hint | stat 條 + row badge + detail banner + Completeness summary + Missing fields ×2 | 同概念 5 處重複；Missing fields 標題出現兩次 |
| Governance signals | admin loader derive（taxonomy） | 全 11 篇含 draft | admin hint | row `gov:N` + detail（raw + aggregation）+ Categories summary card | post-level vs key-level 兩種 rollup，已標 same-source，尚可 |
| Validation warnings | `validate:content` generated report（`.cache/data/validation-report.json`） | ready/published only（draft 顯「未驗證」） | **ground truth** | detail Readiness → Validation warnings（`pm-18`）+ System checks CLI 清單 | 與上兩者視覺同階，未凸顯「這才是權威」 |
| System checks | CLI script 清單（人工跑） | N/A | 指引 | 獨立 section + planned-list | 與 detail 內 validation consume 概念相鄰但分處兩地 |

**結論**：三套「健康」語彙**資料責任邊界已正確**（validator = ground truth，admin = read-only hint / visibility），但**視覺層級未表達此邊界**。readability 改善的核心不是合併資料，而是：(1) 用一致的 badge 視覺 + 一句 legend 表達「validator 權威 / admin 提示」之分層；(2) 收斂 completeness 的重複落點（尤其 detail panel 內 Missing fields ×2）。**此為純 presentation，不需改任何 loader / validator / report schema。**

---

## F. 改善分類：pure readability vs 牽涉資料模型

### F.1 ✅ Pure readability（不改資料來源 / 不改 schema / 不改 validator / 不改 loader）
1. **detail panel 分群 + 摺疊**：把 ~19 子小節依邏輯歸為 ~5 群（Identity & Routing / Readiness & Validation / Channels & FB / Links & Commerce / Completeness & Source），低頻群（FB dry-run editor / sourceKey selector / Future write checklist / Source path）以原生 `<details>`（預設收合）包裹。**原生 `<details>/<summary>`＝零 JS、零資料變更**。
2. **頁首 overview 整併**：`.stats`（15 卡）與 Dashboard surface-grid（6 卡）擇一為主、另一降階或摺疊；移除重複數字。所有數字 view 端既有 reduce，**不動 loader**。
3. **健康語彙 legend**：在 detail panel 健康相關小節加一句「validator = ground truth；Completeness / Governance 為 admin read-only 提示，不取代 `npm run validate:content`」legend；統一三者 badge 配色階。
4. **detail panel 去重**：Missing metadata banner / Completeness summary / Missing fields（×2）語意收斂為單一呈現（純 EJS 條件重排）。
5. **Categories & Tags 切分**：Categories 群與 Tags 群各以 `<details>` 或 sub-heading 分段，降低單一 section 長度。
6. **nav 順序對齊 DOM 順序**：把 nav 的 `#commerce` 移到符合其 DOM 位置（Posts 之前）；或把 nav 補上缺漏 anchor。純連結排序。
7. **Posts table 視覺層級**：primary（title）vs secondary（id/slug/published source）以字重 / 色階 / 行距分層（純 CSS / class）；**不**改欄位數、不改 cell 內容欄位、不改 colspan。
8. **inline style → `<style>` block**：把重複 inline style 收進既有 `<style>`（純 cosmetic 維護性，optional / 可獨立）。

### F.2 ❌ 看似 UI 但其實牽涉資料模型 / 功能（必須排除，各須獨立 phase + approval）
- **Posts index per-post validator warning 計數 badge** → 需 validator-report join / aggregation（`pm-2` / `pm-14` 已標為前置 schema+join-contract，獨立路線）。
- **governance / completeness filter chip 跳轉篩選** → 需改 Posts index filter JS（既有紅線）。
- **summary card 補 validator warning 欄位** → 需 aggregation（紅線）。
- **可排序 / 可摺疊但改變載入哪些 post** → 需動 loader universe。
- **per-post「應改為 X」suggested-fix / prescription** → 產品決策（C7 NO-GO 同精神）。
- **tab 化 + lazy-load detail** → 可能需資料重構 / JS 行為改變。
- **任何 write / Apply / Save / Auto-fix 啟用** → write-path 仍 dormant（紅線）。

> 判準：凡需要**新資料來源、新 loader 欄位、新 validator/report 契約、改 filter/sort JS 行為、或引入 prescription / write** 者，一律歸 F.2，不在 readability phase 內做。

---

## G. Recommended conservative implementation path（建議，但本段不實作）

採**最小可行、單檔 additive、可獨立 backout** 之切片序列；每片各自一個 implementation phase + acceptance，不混做：

- **切片 R1（推薦首做，MVP）— detail panel 低頻子小節原生 `<details>` 收合**
  只動 `src/views/admin/index.ejs`：把 detail panel 內低頻 4 群（FB Sidecar Dry-run Editor / sourceKey selector preview / Future write readiness checklist / Source path）各以原生 `<details>`（`open` 省略＝預設收合）包裹，`<summary>` 用既有標題。**零 JS、零 loader、零 CSS 必要變更、零資料變更**；既有展開/收合 row 行為（JS toggle `tr.post-detail`）完全不碰。這是「立刻降低單點認知負擔」cost/benefit 最高的一步。
- **切片 R2 — 頁首 overview 整併**：擇 `.stats` 或 Dashboard surface-grid 為主視圖，另一降階；移除重複數字。view 端 reduce 既有。
- **切片 R3 — 健康語彙 legend + badge 配色統一 + detail Missing fields 去重**：純 EJS / class。
- **切片 R4 — Categories & Tags 內 Categories / Tags 群 `<details>` 切分**。
- **切片 R5（optional / 低優先）— nav 順序對齊 + inline style 收進 `<style>`**：cosmetic。

每片完成後：`build-github.js --mode=dev` render → grep 驗證 → human visual acceptance → 下一片。**建議從 R1 起，逐片小步；任何一片可單獨 ship 或 revert。**

> 對齊使用者既有偏好（保守落地路線）：所有切片皆 warning-free / additive / 單檔 / 可獨立 backout；不為「一次到位」把多片綁進同一 phase。

---

## H. Explicit non-goals / red lines

本 readability/IA 線**不得**：
- 啟用任何 ADMIN write / Apply / Save / Auto-fix / 發布 / 重貼 / deploy（write-path 維持 dormant）。
- 新增 per-post prescription（「應改為 X」規則引擎）。
- 新增 Posts-index 計數 badge / filter chip / 跳轉篩選 / summary-card validator warning 欄位（各須獨立 phase + approval）。
- join validator warnings / 新增 validator JSON output / reporter（已是另一線：`pm-14` schema+join-contract → reporter → consume，已 landed 至 detail panel；readability phase 不重做、不擴張）。
- 重做 validation-report detail panel render acceptance（`pm-21` 已 PASS）。
- 改 loader（`load-admin-posts.js`）/ validator / reporter schema / settings / content / frontmatter。
- 改 `package.json` / 新增 npm script / `npm install`。
- 觸碰 GA4 / AdSense / Blogger 後台；改 real id（仍只存 `ads.config.json`）。
- 把 ADMIN 由 dev-mode-only 變成 prod-build / 進 dist / 進 deploy。

---

## I. Expected files for future implementation + acceptance design

### I.1 未來實作預期觸碰檔（每切片應**僅**動以下其一）
- 主：`src/views/admin/index.ejs`（唯一必動 source；additive / 重排 / 摺疊 / class）。
- 可能（僅 R5 cosmetic）：同檔 `<style>` block（把 inline style 收斂；不新增外部 CSS 檔）。
- **不**應觸碰：`src/scripts/load-admin-posts.js`、`src/scripts/build-github.js`、任何 validator / reporter / settings / content / package。

### I.2 Acceptance 設計（未來 implementation phase 用）
- **dev render**：`node src/scripts/build-github.js --mode=dev` → exit 0、`admin (dev-mode) rendered: 11 posts`、無 EJS error。
- **rendered HTML grep**（對 `.cache/pages/admin/index.html`）：
  - 無 `>undefined<` / `>null<` leak。
  - 健康相關數值不變（governance summary card 數字、gov badge 計數、validation 四態計數與 `pm-21` 一致）。
  - **無新增 write 元素**：除既有 FB / SEO / commerce dry-run editor（pre-existing）外，新增區塊 grep `<button` / `<input` / `<form` / `<select` / `<textarea` / `onclick` / `onchange` / `fetch(` = 0。
  - 若做 `<details>`：grep `<details` / `<summary>` 數量符合預期；row toggle JS 仍只控 `tr.post-detail`（未被破壞）。
- **validate:content**：`0/94/84 不變`（loader / content 未動，理論上不受影響；implementation phase 仍應實跑確認）。
- **既有 admin smoke carry**：`check:admin-governance-aggregation` 16/0、`check:admin-validation-consume` 12/0、`check:validation-report` 14/0（loader / report 未動 → 不受影響）。
- **human visual acceptance**：人眼於 `/admin/`（dev mode）確認分群正確、無破版、健康層級清楚、無寫入誤導。

### I.3 是否需要新增 smoke guard？
**建議：不新增。** 理由：
- 本線為**純 presentation EJS**，不動資料來源 / loader / validator / report → 既有 `check:admin-*` smoke 已守住資料層；新增 UI 結構 smoke 對「摺疊 / 重排」這類 cosmetic 變更維護成本高、易脆（structure-locking 對 readability 反覆微調是負擔）。
- 既有 **dev render + rendered-HTML grep + human visual** 三層已足以驗收 presentational 變更（對齊 `pm-21` rendered-artifact acceptance 慣例）。
- 例外：若未來某切片**確實**新增了需要鎖定的結構不變式（例如「detail panel 恰 N 個 `<details>` 群」被視為契約），才考慮極小 grep-based guard；預設不加。

---

## J. Rollback plan

- **本 docs-only phase rollback**：僅新增 1 份 doc + 極小 CLAUDE.md ledger sync。如需回退：`git revert` 該 docs commit（或刪除 doc + 還原 ledger 段落）。無 source / content / settings / build 影響，rollback 風險 ≈ 0。
- **未來各 implementation 切片 rollback**：每切片僅動 `index.ejs` 單檔 additive → `git revert` 該切片 commit 即還原；因 admin 為 dev-mode-only、不進 dist / 不 deploy，rollback **不影響 production / live site / Blogger / GitHub Pages**。逐片小步使任一片可獨立 backout，不牽連其他片。

---

## K. Non-actions（本 phase 實際未做）

docs-only —— 未改 `src/` / `views/` / `scripts/` / `loader` / `validator` / `reporter` / `content` / `settings` / `tags.json` / `categories.json` / `package.json` / `lockfile` / 任何 frontmatter·markdown / `dist` / `gh-pages` / `.cache`；未做任何 ADMIN UI / CSS / 摺疊 / 重排 source 變更；未啟用 write / Apply / filter chip / count badge / suggested-fix / validator-warning join；未 build / deploy / push gh-pages / Blogger repost；未 `npm install`；未 merge / rebase / reset / amend / force push；未壓縮·重排 CLAUDE.md。唯一 mutation = 本 preanalysis doc + CLAUDE.md 極小 ledger sync。

未跑 npm validation：本 phase 未碰 content / source / settings / loader / validator，baseline 數值 carry-forward（見 §B）；依 docs-only 慣例不重跑 `validate:content` 與各 `check:*`。

---

## L. Recommended next phase

- 主線（須 user explicit approval；NOT docs-only）：`20260616-admin-detail-panel-collapsible-sections-implementation-a`（切片 R1，單檔 `index.ejs` 把 detail panel 低頻 4 群以原生 `<details>` 收合）。
- 或保守：idle freeze（readability 線維持規劃完成、未動 source）。
- 並行不衝突（docs-only）：本 preanalysis 之 read-only acceptance record。

紅線：write path / per-post prescription / filter chip / Posts-index 計數 badge / summary-card 補欄 / validator-warning join / loader 聚合搬遷一律獨立 phase + user explicit approval。
