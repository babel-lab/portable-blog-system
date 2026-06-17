# ADMIN readability R-series next-pick preanalysis（docs-only）

> Phase: `20260617-admin-readability-r-series-next-pick-preanalysis-docs-only-a`
> Date: 2026-06-17 09:50+
> Type: docs-only preanalysis（**只決定下一個最值得先做的 R 小階段與其安全範圍**；**不**改 source / view / scripts / loader / validator / reporter / content / settings / package / dist / gh-pages / `.cache`；**不** build / deploy / browser implementation check）
> Scope: 承接 `docs/20260616-admin-readability-ia-refinement-preanalysis.md`（pm-22；R1–R5 切片序列）+ `docs/20260616-night-admin-stage-progress-checkpoint-and-next-action-map.md`（night checkpoint；§E readability 待落地 / §G 保守 / §H implementation 候選）。R1（detail panel 低頻 4 區段 `<details>` 收合）與 SEO dry-run edit 收合、validator warning badge + state filter 皆已於 2026-06-16~17 landed + browser PASS；本 phase 把「R2/R3/R4/R5 接下來先做哪一個」正式收斂成一份選擇性 preanalysis，**只寫計畫，不實作**。

---

## A. Phase name

`20260617-admin-readability-r-series-next-pick-preanalysis-docs-only-a`

---

## B. Baseline verify observed

| 項目 | 值 | 對照 expected |
|---|---|---|
| pwd | `/d/github/blog-new/portable-blog-system` | ✅ |
| branch | `main` | ✅ |
| HEAD | `644562e` | ✅ |
| origin/main | `644562e` | ✅ |
| HEAD == origin/main | ✅ | ✅ |
| ahead / behind | `0 / 0` | ✅ |
| latest subject | `docs(admin): record validation state filter browser pass` | ✅ |
| working tree | clean | ✅ |

→ Baseline 完全符合 expected。未 pull / merge / reset / rebase / amend / force-push。

Carry-forward acceptance numbers（**未於本 docs-only phase 重跑**；未碰 content / source / loader / validator）：
- `validate:content` = **0 errors / 94 warnings / 84 issue-posts**（production-post warnings = 0）
- `check:admin-governance-aggregation` 16/0 · `check:validation-report` 14/0 · `check:admin-validation-consume` 12/0
- `check:adsense-resolver` 34/0 · `check:adsense-article-block` 13/0 · `check:adsense-anchor-wiring` 14/0 · `check:blogger-adsense-output` 85/0 · `check-commerce-affiliate-resolver` 23/0

---

## C. R2 / R3 / R4 / R5 目前狀態摘要

> 唯讀盤點來源：`src/views/admin/index.ejs`（現 **2,738 行**；單檔 standalone HTML，不 wrap base.ejs；244 個 inline `style=`；6 個 `<details>`）。行號為本 phase 實測（badge/filter 落地後較 pm-22 的 2,684 行位移）。

### C.0 已 landed 之 readability 元素（**不重做**）

| 元素 | 狀態 | commit |
|---|---|---|
| R1 detail panel 低頻 4 區段原生 `<details>` 收合（FB Sidecar Dry-run Editor / sourceKey selector preview / Future write readiness checklist / Source path） | ✅ browser PASS | `f89ad09`→`3628fcb` |
| SEO「Dry-run edit (no write)」區段 `<details>` 收合 | ✅ browser PASS | `b0a21ad`→`48baabf` |
| Posts list 5 態 validator warning badge | ✅ browser PASS | `7e4d9cf`→`5793bf6` |
| Posts list validation state filter（4 option） | ✅ browser PASS + console PASS | `c7b36ee`→`644562e` |

→ 現有 6 個 `<details>`：detail panel 內 FB Sidecar Dry-run Editor（L1280）/ sourceKey selector preview（L1361）/ Dry-run edit no write（L1446）/ Future write readiness checklist（L1519）/ Source path（L1533），共 5；加 1 個其他（依 render 結構）。

### C.1 R2 — 頁首 overview 整併（**未實作**）

| 項目 | 觀測 |
|---|---|
| 來源 | pm-22 §D.1（高 pain）/ §F.1.2 / §G 切片 R2；night checkpoint §E1.1 / §H.2 |
| 現況 | `.stats` 15-card flat overview（L280）**與** Dashboard `.surface-grid` 6-card（L330）並列於頁首，部分數字重疊（`blogger enabled` / `github enabled` 同時出現在 flat 條與 Blogger/GitHub surface-card；blogger source / github source / published 也分散兩處） |
| 性質 | view 端既有 reduce 之重新編排；**不動 loader** |

### C.2 R3 — 健康語彙 legend + Missing fields ×2 去重（**未實作**）

| 項目 | 觀測 |
|---|---|
| 來源 | pm-22 §D.3（中高 pain）/ §E / §F.1.3 + §F.1.4 / §G 切片 R3；night checkpoint §E1.2 |
| 現況（legend） | 三套「健康」語彙（Completeness = admin hint / Governance signals = admin hint / Validation = **ground truth**）視覺同階，無一句統一 legend 表達「validator 權威 / admin 提示」之分層 |
| 現況（Missing fields ×2） | detail panel 內「Missing fields」h3 出現**兩次**：L1430「Missing fields（建議補齊）」+ L1437「Missing fields」 |
| 性質 | 純 EJS / class / 文案；條件重排；**不動 loader / validator / report schema** |

### C.3 R4 — Categories & Tags section 切分（**未實作**）

| 項目 | 觀測 |
|---|---|
| 來源 | pm-22 §D.6（中 pain）/ §F.1.5 / §G 切片 R4；night checkpoint §E1.3 |
| 現況 | 單一 `<h2 id="categories">`（L1614）底下約 **L1614–2118 ~500 行**、10+ 個 `<h3>` 子表：Governance summary card（L1650）+ Categories registry（L1691）+ Tags registry（L1699）+ Per-category usage（L1736）+ Uncategorized（L1838）+ Unknown category usage（L1863）+ Unused defined categories（L1893）+ Tags Per-tag usage（L1911）+ Untagged（L2041）+ Unknown tag usage（L2066）+ Unused defined tags（L2096）；全部常駐展開 |
| 性質 | mirror R1 / SEO-dryrun 之原生 `<details>` 模式（Categories 群 / Tags 群各包一個 `<details>`）；**零新 CSS / 零 JS / 零 loader / 零 data** |

### C.4 R5 — nav 順序對齊 DOM + inline-style 收斂（**未實作**）

| 項目 | 觀測 |
|---|---|
| 來源 | pm-22 §D.5（中）+ §D.7（低 / 純維護性）/ §F.1.6 + §F.1.8 / §G 切片 R5；night checkpoint §E1.4 |
| 現況（nav 順序） | nav（L175–189）順序：Dashboard → Posts → Categories → Tags → Blogger Export → GitHub Pages → AdSense → GA4 → **Commerce / Affiliate（第 9 位，`#commerce`）** → Settings → System checks。但 `#commerce` section 實際 render 於 **L422（Posts L541 之前）**；點 nav「Commerce」會往**上**跳，與其在 nav 偏後之位置直覺不符。另 nav `#tags` 指向 L1911（Categories & Tags section 內之 Per-tag usage h3） |
| 現況（inline style） | **244 個** inline `style=`，與既有 `<style>` block 並存 |
| 性質 | nav 部分＝純 `<li>` 重排序（極小）；inline-style 部分＝大面積 cosmetic 搬遷（純維護性，低值） |

---

## D. 各候選的目的、預期改善、會動的區塊

### D.1 R2 — 頁首 overview 整併

| 維度 | 內容 |
|---|---|
| 目的 | 消除「一進頁面先看 15 個 flat 小卡、再看 6 張 surface-card、得自行對照哪個是主視圖」之認知負擔 |
| 預期改善 | 擇一為主視圖（建議 Dashboard surface-grid 為主），另一降階 / 摺疊；移除重複數字（blogger/github enabled 等） |
| 會動的區塊 | `index.ejs` L280 `.stats` block + L330 `.surface-grid` block（單檔；view 端 reduce 既有，**不動 loader**） |
| 規模估計 | 中等（重排 + 降階；可能數十行重組） |

### D.2 R3 — 健康語彙 legend + Missing fields ×2 去重

| 維度 | 內容 |
|---|---|
| 目的 | (1) 讓讀者一眼判斷「validator = ground truth / Completeness·Governance = admin read-only 提示」；(2) 消除 detail panel 內重複的「Missing fields」h3 |
| 預期改善 | 在 detail panel 健康相關小節加一句統一 legend；統一三者 badge 配色階；Missing fields ×2 收斂為單一呈現（純 EJS 條件重排） |
| 會動的區塊 | `index.ejs` Readiness / Governance signals / Completeness / Missing fields 區段（L899–1109 + L1416–1443 附近；單檔；純文案 / class / 條件） |
| 規模估計 | 小-中（legend 文案 + dedup 條件重排） |

### D.3 R4 — Categories & Tags section `<details>` 切分

| 維度 | 內容 |
|---|---|
| 目的 | 把 ~500 行、10+ h3 之單一 section 切成可摺疊的 Categories 群 / Tags 群，降低該 section 常駐長度 |
| 預期改善 | Categories 群（registry + per-category usage + 3 edge-case 表）與 Tags 群（registry + per-tag usage + 3 edge-case 表）各包一個原生 `<details>`；Governance summary card 維持直接可見（高頻） |
| 會動的區塊 | `index.ejs` L1614–~2118（單檔；mirror R1 / SEO-dryrun 已 PASS 之 `<details>` 包裹模式；**零新 CSS / 零 JS / 零 loader / 零 data**） |
| 規模估計 | 中（行數多但變更機械化＝包 `<details>` + `<summary>`） |
| ⚠️ 注意 | nav `#tags`（L1911）指向 Tags 群內 h3；若用 `<details>` 收合 Tags 群，**錨點跳轉時須確保 `<details>` 自動展開**（或 anchor 指向 `<details>`/`<summary>` 本身）。屬本候選實作時必驗項，但仍屬純 presentation |

### D.4 R5 — nav 順序對齊 + inline-style 收斂

| 維度 | 內容 |
|---|---|
| 目的 | (a) nav 順序對齊 DOM 順序（Commerce 移到符合 L422 之位置，即 Posts 之前）；(b) 把重複 inline style 收進既有 `<style>` block |
| 預期改善 | 點 nav 連結之跳轉方向符合直覺；未來改版視覺一致性較好維護 |
| 會動的區塊 | (a) nav-only：`index.ejs` L175–189 之 `<li>` 重排（極小）；(b) inline-style：散落全檔 244 處（大面積 cosmetic） |
| 規模估計 | (a) 極小；(b) 大（純 cosmetic，低值） |
| 拆分建議 | nav-only 與 inline-style **應拆成兩個獨立子片**；inline-style 收斂屬低值高 churn，建議單獨延後或永遠 optional |

---

## E. 各候選的風險比較

| 候選 | 變更性質 | novelty（模式新穎度） | 視覺破壞風險 | 語意/條件風險 | 可獨立 backout | 綜合風險 |
|---|---|---|---|---|---|---|
| **R4** Categories/Tags `<details>` 切分 | 機械化包裹 | 低（R1 + SEO-dryrun 已三度驗證之 `<details>` 模式） | 低 | 低（不改 cell 內容 / 不改條件） | ✅ | **低** |
| **R3** legend + Missing fields dedup | 文案 + 條件重排 | 中（legend 措辭為設計決策；dedup 動剛 accept 的 detail panel） | 低 | 中（dedup 重排條件須不漏顯 / 不誤合） | ✅ | **低-中** |
| **R5a** nav-only 重排 | `<li>` 重排序 | 低 | 極低 | 低（須驗 anchor 不破） | ✅ | **極低（但低值）** |
| **R5b** inline-style 收斂 | 大面積 cosmetic 搬遷 | 低 | 中（244 處搬遷易誤動視覺） | 低 | ⚠️（面大不易乾淨 revert） | **中（高 churn / 低值）** |
| **R2** 頁首 overview 整併 | 重排 + 降階 | 中 | **中-高**（重大視覺改變；user 可能不喜歡新版） | 中 | ✅ | **中**（建議先 mockup） |

風險判準（對齊 user 既有保守落地偏好）：proven 模式 + 機械化 + 單檔 additive + 可獨立 backout → 低風險；引入設計決策（legend 措辭 / overview 主視圖選擇 / 大面積 cosmetic 搬遷）→ 風險上升。

---

## F. 是否需要 npm run dev / browser human-eye check

| 候選 | dev render（`build-github.js --mode=dev`） | browser human-eye | 說明 |
|---|---|---|---|
| 本 preanalysis（docs-only） | ❌ 不需 | ❌ 不需 | 純文件；不碰 source |
| R2 / R3 / R4 / R5（**未來** implementation phase） | ✅ 需 | ✅ 需 | 屬 presentational 變更；依 pm-21 / R1 慣例＝dev render + rendered-HTML grep + human visual acceptance 三層驗收；**本 phase 不執行** |

→ 本 docs-only phase **不** `npm run dev`、**不** build、**不** browser implementation check。未來任一 R 切片之 implementation phase 才需 dev render + browser PASS。

---

## G. 是否可能碰 loader / validator / report ground truth

| 候選 | 碰 loader（`load-admin-posts.js`）？ | 碰 validator / report schema？ | 碰 ground truth？ |
|---|---|---|---|
| R2 | ❌ 否（view reduce 既有） | ❌ 否 | ❌ 否 |
| R3 | ❌ 否（純文案 / class / 條件） | ❌ 否 | ❌ 否 |
| R4 | ❌ 否（`<details>` 包裹） | ❌ 否 | ❌ 否 |
| R5 | ❌ 否（nav 重排 / cosmetic） | ❌ 否 | ❌ 否 |

→ **R2/R3/R4/R5 全屬 pure presentation（pm-22 §F.1）**，皆**不**碰 loader / validator / reporter schema / report ground truth / settings / content / frontmatter。任何需要新 loader 欄位 / 新 validator·report 契約 / 改 filter·sort JS 行為 / prescription / write 之項目皆屬 pm-22 §F.2 排除清單，**不在 R-series readability 範圍內**。

---

## H. Recommendation ranking（第一順位 / 第二順位 / 暫緩）

### 第一順位（推薦先做）：**R4 — Categories & Tags `<details>` 切分**

理由：
1. **模式已三度驗證**（R1 detail panel 4 區段 + SEO dry-run + 本日另一處），原生 `<details>` 包裹是目前最可預測、最機械化、acceptance 最穩的 readability 手法 → 對齊 user 保守落地偏好。
2. **高 cost/benefit**：目標 section ~500 行、10+ h3，是頁面最長的常駐展開區塊之一；包成 Categories 群 / Tags 群兩個 `<details>` 立即降低長度。
3. **零 loader / validator / data 風險**（§G）；單檔 additive；可獨立 backout。
4. 唯一必驗點 = nav `#tags` 錨點跳轉時 `<details>` 須能展開（§D.3 ⚠️）；屬 implementation 階段 acceptance 項，非阻擋。

### 第二順位：**R3 — 健康語彙 legend + Missing fields ×2 去重**

理由：
1. 解決 pm-22 §D.3「三套健康語彙視覺同階」之中高 pain，且順帶移除 detail panel 內**真實重複**的「Missing fields」h3（L1430 / L1437）。
2. 純 presentation（§G），單檔。
3. 之所以排第二而非第一：legend 措辭屬設計決策、dedup 須重排剛 accept 的 detail panel 條件（§E 語意風險中），執行確定性略低於 R4 的機械化包裹。建議實作前先在該 phase 內提一個 legend 文案小樣 + dedup 前後條件對照。

### 暫緩項

| 項目 | 暫緩理由 | 解凍條件 |
|---|---|---|
| **R2 頁首 overview 整併** | 中-高視覺破壞風險；「擇一為主視圖」屬重大版面決策，user 可能不喜歡新版 | 須先補 1 份視覺 mockup / 變體 preanalysis 確認方向後，再獨立 implementation phase |
| **R5b inline-style 收斂** | 244 處大面積 cosmetic 搬遷；高 churn、低值、不易乾淨 revert | 純維護性 optional；可永遠延後，或待其他 R 全部 landed 後再評估 |
| **R5a nav-only 重排** | 風險極低但**價值低**；單獨開 phase 性價比不高 | 可考慮**併入 R4 implementation phase 順手做**（同屬 nav/categories 區），或待 user 認為 nav 跳轉方向困擾時再做 |

→ 建議路徑：**R4（第一順位）→ browser PASS → 再評估 R3（第二順位）**；R2 / R5b 暫緩；R5a 可選擇性併入 R4。每片各自一個 implementation phase + acceptance，不混做、不跳階。

---

## I. 只寫計畫，不實作（本 phase 邊界）

本 phase **僅**新增本 preanalysis doc；**不**進行任何 R2/R3/R4/R5 之 source implementation。未來任一 R 切片之實作須**獨立 phase + user explicit approval**，且每片：
- 僅動 `src/views/admin/index.ejs` 單檔（R5b 若做亦同檔 `<style>` block；不新增外部 CSS）。
- 不新增 smoke guard（pm-22 §I.3：presentational 變更靠 dev render + rendered-HTML grep + human visual 三層驗收；structure-locking 對反覆微調反成負擔）。
- 完成後 dev render exit 0 + `admin (dev-mode) rendered: 11 posts` + rendered-HTML grep（無 `>undefined<` / `>null<` leak；健康數值不變；無新增 `<button>`/`<input>`/`<form>`/`<textarea>`/`onclick`/`onchange`/`fetch(` 寫入元素）+ human visual PASS。
- carry baseline：`validate:content` 0/94/84 + 3 ADMIN smoke（16/0 + 14/0 + 12/0）理論上不受影響（未動 loader / report），implementation phase 仍應實跑確認。

---

## J. Non-actions / red lines（本 phase 明確不做）

本 docs-only phase **未**且**不得**：
- ❌ 改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `package.json` / `package-lock.json` / `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache/`
- ❌ 新增 / 調整 / 刪除任何 `<details>` / `<summary>` / CSS / JS / EJS partial
- ❌ 執行 R2 / R3 / R4 / R5 任一 implementation
- ❌ `npm install` / `npm run build`（含 build:github / blogger / promotion / sitemap / blogger-theme）/ `npm run dev` / `npm run preview` / deploy / push gh-pages / browser implementation check
- ❌ 重跑 `validate:content` 或任何 `check:*` guard（baseline carry-forward；未碰 source）
- ❌ 啟動 Admin write / Apply / Save / Auto-fix / middleware / admin-write-cli / FB sidecar 真實寫入
- ❌ validator `--report-json`（動 ground truth；pm-14 NOT 選）
- ❌ loader cross-post aggregation migration（pm-22 §F.2 排除）
- ❌ Posts-index validator warning **計數 badge** / summary-card 補 validator 欄 / filter chip 跳轉 / per-post prescription（各須獨立 phase + approval；永久紅線）
- ❌ 改 validator rule / reporter schema / join contract / loader 派生欄位（pm-18 stable）
- ❌ merge / rebase / reset / amend / cherry-pick / force-push / 跳 hooks（`--no-verify`）/ bypass signing
- ❌ 重做 night checkpoint §J 清單任一已完成項目（含 R1 / SEO-dryrun 收合 / validator badge / filter）
- ❌ 對 Phase 1 final 宣告做任何降級或重新封存
- ❌ 觸碰 Blogger / GA4 / AdSense / Google Drive / Search Console 後台；改 real AdSense id（仍只存 `ads.config.json`）
- ❌ 把 ADMIN 由 dev-mode-only 變成 prod-build / 進 dist / 進 deploy
- ❌ 壓縮 / 重排 CLAUDE.md（本 phase 不改 CLAUDE.md）
- ❌ 改 `MEMORY.md` / `memory/`（本 phase 非 memory-sync）

唯一 mutation = 本 preanalysis doc（+ 依本 phase 指示之 commit / push）。

---

## K. Rollback plan

- **本 docs-only phase rollback**：僅新增 1 份 doc（`docs/20260617-admin-readability-r-series-next-pick-preanalysis.md`）。如需回退：`git revert <commit>`（或刪除該 doc）。無 source / content / settings / build / deploy 影響，rollback 風險 ≈ 0。
- **未來各 R 實作切片 rollback**：每片僅動 `index.ejs` 單檔 additive → `git revert` 該切片 commit 即還原；因 admin 為 dev-mode-only、不進 dist / 不 deploy，rollback **不影響 production / live site / Blogger / GitHub Pages**。逐片小步使任一片可獨立 backout，不牽連其他片。

---

## L. STOP

本 phase 到此為 **docs-only preanalysis 完成**。

→ **不進入任何 R2/R3/R4/R5 implementation phase，直到 user explicit approval。**

推薦下一步（待 user 指示）：**R4 — Categories & Tags `<details>` 切分 implementation phase**（第一順位；最低執行風險；proven `<details>` 模式）。若 user 想推 R3 / R2 / R5 或維持 idle freeze，亦由 user 主動指定。

---

（本文件結束）
