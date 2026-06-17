# ADMIN R3 — Health vocabulary legend + Missing fields dedup preanalysis（docs-only）

> Phase: `20260617-am-admin-r3-health-legend-missing-fields-dedup-preanalysis-docs-only-a`
> Date: 2026-06-17 10:50+
> Type: docs-only preanalysis（**只規劃**「健康狀態語彙 legend」與「Missing fields ×2 去重」最小安全實作方案；**不**改 source / view / scripts / loader / validator / reporter / content / settings / package / dist / gh-pages / `.cache`；**不** build / deploy / browser implementation check）
> Scope: 承接 `docs/20260617-admin-readability-r-series-next-pick-preanalysis.md`（R-series next-pick；R3 列為第二順位）+ R4 收尾（`docs/20260617-admin-categories-tags-collapsible-split-browser-pass-record.md`，commit `fff9a0f`）。把 pm-22 §D.3（健康語彙三套來源視覺同階）+ §D.3 末（Missing fields ×2）正式展開為一份可落地、單檔、可獨立 backout 的計畫，**本 phase 不實作**。

---

## A. Phase name

`20260617-am-admin-r3-health-legend-missing-fields-dedup-preanalysis-docs-only-a`

---

## B. Baseline observed

| 項目 | 值 | 對照 expected |
|---|---|---|
| pwd | `/d/github/blog-new/portable-blog-system` | ✅ |
| branch | `main` | ✅ |
| HEAD | `fff9a0f` | ✅ |
| origin/main | `fff9a0f` | ✅ |
| HEAD == origin/main | ✅ | ✅ |
| ahead / behind | `0 / 0` | ✅ |
| latest subject | `docs(admin): record categories tags browser pass` | ✅ |
| working tree | clean | ✅ |

→ Baseline 完全符合 expected。未 pull / merge / reset / rebase / amend / force-push。

Carry-forward acceptance numbers（**未於本 docs-only phase 重跑**；未碰 content / source / loader / validator）：
- `validate:content` = **0 errors / 94 warnings / 84 issue-posts**（production-post warnings = 0）
- `check:admin-governance-aggregation` 16/0 · `check:validation-report` 14/0 · `check:admin-validation-consume` 12/0

---

## C. R3 問題定義

### C.1 健康狀態語彙目前不易理解

ADMIN 對「這篇文章 OK 嗎？」用**三套來源不同、權威性不同**的機制呈現，但視覺上同階、無一句統一 legend：

| 語彙 | 來源 | 權威性 | universe |
|---|---|---|---|
| **Validation warnings** | `npm run validate:content` 之 generated report（`.cache/data/validation-report.json`，read-only consume） | **ground truth** | ready/published only（draft 顯「未驗證」） |
| **Completeness**（Completeness summary + Missing fields） | admin loader derive（frontmatter / settings） | admin read-only hint | 全 11 篇含 draft |
| **Governance signals**（Governance signals + Aggregation summary + row `gov` badge + Categories & Tags governance summary card） | admin loader derive（taxonomy） | admin read-only hint | 全 11 篇含 draft |

讀者難以一眼判斷**哪個才是權威**（validator = ground truth；completeness / governance = admin 提示、非 build blocker）。三者各有正當存在理由，缺的只是一句統一 legend + 一致視覺層級。

### C.2 Missing fields 段落語意重複 / 標題不一致

⚠️ **精確界定（修正 pm-22 §D.3「出現兩次」之表述）**：detail panel 內「Missing fields」**並非同時出現兩段**，而是一組 `if/else` 互斥分支（見 §D.2）：

- `p.missingFields.length > 0` → 顯 `<h3>Missing fields（建議補齊）</h3>` + b-missing badges
- else → 顯 `<h3>Missing fields</h3>` + 「所有檢查欄位齊全」b-ok badge

讀者一次只看到**一個**分支。真正問題有二：
1. **兩分支標題文案不一致**（「Missing fields（建議補齊）」vs「Missing fields」）—— source 兩個 h3，維護性 / 語意一致性 smell。
2. **與相鄰 Completeness summary 語意重疊**：Completeness summary（L1416）已用 7 個 badge（SEO / FB / Blogger / GitHub / URL / cat/tags / FB pub）呈現完整度；Missing fields 又把「未達 ok」者重列一次 → 同一份 `p.completeness` 資料的兩種視角相鄰兩個 `.detail-section`，造成 detail panel 偏長。

---

## D. 現況盤點

> 來源：`src/views/admin/index.ejs`（read-only inspect）。R4（`adea772`）之 `<details>` 插入位於 L1712+，**在以下 detail panel 區段（L899–1535）之後**，故本節行號為當前實況、未受 R4 位移影響。

### D.1 相關區塊位置（per-post detail panel；皆在 `tr.post-detail` 內）

| 區塊 | 行號 | 性質 | 來源 |
|---|---|---|---|
| **Readiness section**（Content readiness + SEO readiness + **Validation warnings**） | `<h3>` L899 起 | 混合：readiness 為 derived；**Validation warnings 為 report-backed ground-truth consume**（pm-18 四態 no-report / status-excluded / matched / clean + asOf） | validator report（ground truth）+ loader derive |
| **Governance signals section**（raw 4 訊號 dl + Aggregation summary） | `<h3>` L1109 起 | derived display（admin hint；taxonomy） | loader derive |
| **Completeness summary** | `<h3>` L1416；`.detail-section` L1415–1426 | derived display（admin hint） | `p.completeness`（loader derive） |
| **Missing fields**（if/else 兩分支） | `<h3>` L1430（建議補齊）/ L1437（齊全）；`.detail-section` L1428–1440 | derived display（admin hint） | `p.missingFields`（loader derive） |

另：detail panel 頂部另有條件式「Missing metadata banner」（pm-22 §C.3 記錄；亦 derived），與本 R3 dedup 同屬 completeness universe，但本 phase **聚焦 Completeness summary + Missing fields 兩相鄰段**，banner 不在本次 dedup 範圍（避免擴張）。

### D.2 Missing fields 兩分支 source 實況（L1428–1440）

```ejs
<% if (p.missingFields && p.missingFields.length > 0) { %>
<div class="detail-section">
  <h3>Missing fields（建議補齊）</h3>
  <div class="completeness-summary">
    <% p.missingFields.forEach(function(f) { %><span class="badge b-missing"><%= f %></span><% }); %>
  </div>
</div>
<% } else { %>
<div class="detail-section">
  <h3>Missing fields</h3>
  <p style="margin: 0;"><span class="badge b-ok">所有檢查欄位齊全</span></p>
</div>
<% } %>
```

### D.3 哪些只是 derived display、哪些是 validator ground truth

- **唯一 ground truth** = Readiness section 內之 **Validation warnings**（讀 `validate:content` 產生之 report）。
- **以下皆 derived display（admin read-only hint，非 validator、非 build blocker）**：Completeness summary、Missing fields、Governance signals、Aggregation summary、row `warn` / `gov` badge、Categories & Tags governance summary card。
- 此邊界**資料責任已正確**（validator = ground truth，admin = read-only 提示）；R3 改善的核心**不是合併資料**，而是用一句 legend + 一致視覺層級**表達此邊界**，並收斂 completeness 在 detail panel 內的重複呈現。

---

## E. Health vocabulary legend 設計方案

### E.1 legend 應放在哪裡（候選 + 推薦）

| 選項 | 位置 | 優點 | 缺點 |
|---|---|---|---|
| **Opt-A（推薦）** | **Posts section 表格上方**（`<h2 id="posts">` L541 之後、search/filter bar 附近）一條 page-level legend | 只出現 **1 次**，同時涵蓋 row 之 `warn`/`gov` badge **與** detail panel 三段健康語彙；不隨 11 篇 detail panel 重複 → 不增 density | 與 detail panel 內各段距離較遠（但 badge 用語一致即可對應） |
| Opt-B | 每個 detail panel 內 Readiness section 開頭各放 1 條 | 就近說明 | ×11 重複 → 反而加長 detail panel（與 R3 目標相悖） |
| Opt-C | detail panel 最上方（Identity 之前）放「讀法」note | 就近 | ×11 重複；同 Opt-B 缺點 |

→ **推薦 Opt-A**：page-level legend 只出現一次，density 最友善，且涵蓋 row badges + detail panel 兩處用語。若 user 偏好就近說明，Opt-B/C 為備案（但須接受 ×11 重複）。

### E.2 legend 要解釋哪些 badge / health words

1. **Validation warnings**（Readiness section）= `npm run validate:content` 之 **ground truth**；僅掃 ready/published；draft 顯「未驗證」非 0。
2. **Completeness / Missing fields** = admin loader 依 frontmatter/settings 推導之**完整度提示**；**非** validator、**非** build blocker。
3. **Governance signals / `gov` badge** = admin loader 之 taxonomy 治理提示（unknown / cross-site mismatch）；含 draft；**非** validator、**非** build blocker。
4. row 之 `warn` badge（pm-A 五態）= validator warning report 之 per-post 對映；`gov` badge = governance signalSum。

### E.3 文案草案（Opt-A，page-level，1 條 aside；中文）

> **健康訊號讀法（read-only）：** `npm run validate:content` 為唯一 **ground truth**；其結果於每篇 detail panel 之 **Readiness → Validation warnings** 呈現（僅 ready/published；draft 顯「未驗證」）。**Completeness / Missing fields** 與 **Governance signals（`gov` badge）** 為 admin 依 frontmatter / settings / taxonomy 推導之 **read-only 提示**，協助人眼掃描，**不取代 validator、非 build blocker**。是否調整由人眼判斷後另開 phase；Admin 不自動寫入。

- 沿用既有 `.admin-governance-note` / `.section-lede` / `.surface-note` 風格（**零新 CSS**）。
- **不**含 per-post prescription（不寫「應改為 X」「應加 tag Y」）。
- **不**新增任何數值判斷 / 不重算 rule（純文案）。

### E.4 是否預設展開 / 收合

- legend 為**一短段文字**，建議**預設可見（不收合）**——一行 read-only 說明，收合反增點擊成本。
- 若 user 嫌佔位，備案：用 `<details>`（mirror R1）預設收合，`<summary>`=「健康訊號讀法」。**推薦預設可見**（保守：說明本應一眼可見）。

---

## F. Missing fields dedup 方案

### F.1 哪兩段重複

- Completeness summary（L1415–1426）：7 badge 全覽（含 ok 與 missing）。
- Missing fields（L1428–1440，if/else）：把「未達 ok」者再列一次（或顯「齊全」）。
- 兩者同源 `p.completeness` / `p.missingFields`，相鄰兩個 `.detail-section`，語意重疊。

### F.2 方案候選

| 方案 | 作法 | 改善 | 風險 |
|---|---|---|---|
| **Opt-1（最小）** | 只**統一兩分支 h3 文案**（兩分支皆用「Missing fields」，把「（建議補齊）」改為分支內說明文字或移除），消除標題不一致 | 修標題 smell；段落數不變 | 極低（純文案） |
| **Opt-2（推薦：真去重）** | 把 Missing fields **併入 Completeness summary** 同一 `.detail-section`：完整度 7 badge 之下，條件式接「缺：<b-missing badges>」或「✓ 所有檢查欄位齊全」；**移除**獨立 Missing fields section | detail panel **少 1 段**；同源資料單一呈現（真 dedup） | 低（純 presentation 重排；`p.completeness` / `p.missingFields` data shape 不變） |

→ **推薦 Opt-2**（直接達成 user 要的「去重 / 降低 detail panel 冗長」）；Opt-1 為超保守 fallback。

### F.3 不改 data shape 的方式

- 兩方案皆**只動 render（EJS 條件 + h3 文案 + section 合併）**；**不**改 `load-admin-posts.js` 之 `p.completeness` / `p.missingFields` 派生；**不**改 validator / reporter / settings / content。
- Opt-2 合併後仍讀同樣 `p.completeness.*`（badge）+ `p.missingFields[]`（缺欄列舉），只是放進同一 `.detail-section`，移除第二個 `.detail-section` 容器。
- 沿用既有 `.completeness-summary` / `.badge b-ok` / `.badge b-missing` class（**零新 CSS**）。

---

## G. 最小 implementation plan（未來 implementation phase；本 phase 不實作）

- **唯一允許變更檔** = `src/views/admin/index.ejs`（單檔 additive / 重排 / 文案）。
- **不**改 loader / validator / reporter / content / settings / package / lockfile / dist / gh-pages / `.cache`。
- **不**新增寫入路徑（Apply / Save / Auto-fix / middleware / admin-write-cli / FB sidecar write）。
- **不**新增 form / button / input / select / textarea / onclick / onchange / fetch。
- **不**新增 smoke guard（per pm-22 §I.3：presentational 變更靠 dev render + rendered-HTML grep + human visual 三層驗收）。
- 範圍（建議拆成可獨立 backout 之兩小步，或併一 phase 由 user 決定）：
  1. **Legend**（Opt-A）：Posts section 表格上方加 1 條 page-level `.admin-governance-note` legend（§E.3 文案）。
  2. **Missing fields dedup**（Opt-2）：併 Missing fields 進 Completeness summary，移除獨立 section。
- 預估規模：legend ~+8 行；dedup ~+6 / −10 行（淨可能略減）。

---

## H. Acceptance criteria（未來 implementation phase 用）

### H.1 程式化（dev render + rendered-HTML grep）

- `node src/scripts/build-github.js --mode=dev` exit 0；`admin (dev-mode) rendered: 11 posts`；無 EJS error。
- rendered `.cache/pages/admin/index.html`：
  - legend 出現次數 = 1（Opt-A page-level）。
  - 「Missing fields（建議補齊）」字面值出現次數 = 0（標題已統一 / 已併入）；Completeness 相關 badge 數不變。
  - Missing fields 獨立 `.detail-section` 移除後，detail panel 內 health 相關 `.detail-section` 數較前 −1（Opt-2）。
  - 無 `>undefined<` / `>null<` leak；無 EJS leak（`<%` / `%>`）。
  - **Validation warnings（ground truth）四態 render 不變**（pm-18 / pm-21 carry）；Governance signals / Aggregation summary 數值不變。
  - 無新增 write 元素（grep `<button` / `<input` / `<form` / `<textarea` / `onclick` / `onchange` / `fetch(` 於新增區塊 = 0）。
- `git diff --check` 無 whitespace error；diff 僅 `index.ejs`。
- 3 ADMIN smoke carry（16/0 · 14/0 · 12/0）；`validate:content` 0/94/84 carry（loader / content 未動）。

### H.2 Browser human-eye（user 執行）

- 開 `/admin/#posts`，展開任一篇 post detail panel：
  - **Posts row 展開後 detail panel 是否更清楚**：Completeness 與缺欄合為一段、不再相鄰兩段重複。
  - **Validation warnings / Governance signals / Completeness summary 是否不被混淆**：legend 讀後可一眼分辨「validator = 權威」vs「completeness/governance = 提示」。
  - legend 文案清楚、無破版；badge 配色一致。
  - R4（Categories/Tags 收合）+ R1（低頻區段收合）+ SEO dry-run 收合 + validation state filter **無 regression**。
  - **Chrome console 無新錯誤**。

---

## I. Risks / rollback plan

### I.1 Risks

| 風險 | 等級 | 緩解 |
|---|---|---|
| legend 措辭過長 / 與既有 lede 重複 | 低 | 控制在 1 短段；放 Posts section 上方一次；不 ×11 |
| Missing fields 併入後遺漏「齊全」分支文案 | 低 | Opt-2 保留 if/else 兩分支文字，只換容器；rendered grep 驗 b-ok「齊全」字串仍在 |
| 動到剛 accept 的 detail panel 造成視覺 regression | 低-中 | 單檔 additive / 重排；dev render grep + human-eye；可獨立 backout |
| 誤把 ground truth 與 hint 混為一談（legend 寫錯權威性） | 中 | 文案明示「validator = ground truth；completeness/governance = read-only 提示、非 build blocker」 |

### I.2 Rollback plan

- **本 docs-only phase**：僅新增 1 份 doc。回退 = `git revert <commit>` 或刪 doc。風險 ≈ 0。
- **未來 implementation 切片**：僅動 `index.ejs` 單檔 → `git revert` 該 commit 即還原；ADMIN 為 dev-mode-only、不進 dist / 不 deploy → rollback 不影響 production / live site / Blogger / GitHub Pages。

---

## J. Red lines / non-actions

本 docs-only phase 未且不得：
- ❌ 改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `package.json` / `package-lock.json` / `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache/`
- ❌ 改 `CLAUDE.md` / `MEMORY.md` / `memory/`（未先回報 user approval 前不動）
- ❌ `npm install` / build / deploy / browser implementation check
- ❌ validator `--report-json`（動 ground truth）
- ❌ loader cross-post aggregation migration
- ❌ Admin write / Apply / Save / middleware / admin-write-cli / FB sidecar 真實寫入
- ❌ per-post prescription（「應改為 X」規則引擎）/ Posts-index 計數 badge 跳轉 / summary-card 補 validator 欄
- ❌ merge / rebase / reset / amend / cherry-pick / force-push / 跳 hooks / bypass signing
- ❌ 重做 R1 / R4 / SEO-dryrun / validator badge / filter 任一已 landed 項目
- ❌ 對 Phase 1 final 宣告做任何降級或重新封存
- ❌ 觸碰 Blogger / GA4 / AdSense / Google Drive / Search Console 後台；啟動 reverse UTM deploy

唯一 mutation = 本 preanalysis doc（+ 依本 phase 指示之 commit / push）。

---

## K. Recommendation

- ✅ **建議下一段進 R3 implementation**（範圍清楚、純 presentation、單檔、可獨立 backout、acceptance 明確）。
- 建議採 **Legend Opt-A**（page-level 1 條）+ **Missing fields Opt-2**（併入 Completeness summary 真去重）。
- 是否拆成兩個 implementation phase（legend 一段、dedup 一段）或併一個 phase，由 user 決定；preanalysis 建議**併一個 phase**（皆 detail-panel/Posts-section presentation，規模小，acceptance 可一次涵蓋）。
- 建議 implementation phase name：`20260617-XX-admin-r3-health-legend-missing-fields-dedup-implementation-a`
- 若 user 偏好收手，**idle freeze** 亦完全可接受（R4 已乾淨收尾）。

---

## L. STOP

本 phase 為 docs-only preanalysis 完成。

→ **不進入 R3 implementation，直到 user explicit approval。**

---

（本文件結束）
