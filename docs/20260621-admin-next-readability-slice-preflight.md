# ADMIN next readability slice preflight（docs-only）

- **Phase**：`20260621-admin-next-readability-slice-preflight-docs-only-a`
- **Date**：2026-06-21（Asia/Taipei；evening, 20:25+）
- **Type**：**docs-only preflight**（唯一 mutation = 本檔新增；CLAUDE.md / MEMORY.md / source / settings / content / build / dist 皆不動；不啟動 implementation；不啟動 Admin write path）
- **Verdict**：**PLANNING ONLY — no source change in this phase**
- **Baseline**：`main` HEAD == origin/main == `ad0961c`（subject `docs(project): add cross-line checkpoint`）；ahead/behind = 0/0；working tree clean。
- **Predecessor**：`docs/20260617-admin-readability-r-series-next-pick-preanalysis.md`（at `441877a`；R-series 候選盤點；當時推薦 R4 第一順位）→ `docs/20260617-admin-categories-tags-collapsible-split-browser-pass-record.md`（R4 browser PASS）→ K7 → K8 → K9 → 本 preflight。
- **Scope flag**：**不**改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `templates/` / `public/` / `dist*` / `gh-pages` / `package.json` / lockfile / `vite.config.js` / CLAUDE.md / MEMORY.md；**不** build / 不 deploy / 不 dev / 不 Blogger repost / 不 admin write / 不 safe-write / 不 --apply / 不 dryRun:false / 不打 GA4 / AdSense / Blogger / Google Drive / Search Console 後台。

---

## 1. Purpose

| 項 | 值 |
| --- | --- |
| 本檔屬性 | **K7 / K8 / K9 / R4 全 closed 之後的 ADMIN next-slice preflight** |
| 本檔屬性 | 只盤點 current pain points + 列候選下一切片 + 推薦一個最小安全切片 |
| 本檔不屬性 | ❌ 不是 implementation phase；不寫 source；不啟動 Admin write path |
| 本檔不屬性 | ❌ 不是 evidence record；不為 E1 / E2 / P3 / P2 / live verification 收集 evidence |
| 本檔不屬性 | ❌ 不重開 K7 / K8 / K9 / R4 / R3 / R5（已 closed 或已決定 deferred 者不改變狀態） |
| 本檔不屬性 | ❌ 不是 Phase 1 final 重新宣告 / 降級 / 重新封存 |
| 適用對象 | Dean（決策入口；下一個 ADMIN 切片是否啟動 + 啟動哪個） |
| 適用時機 | Dean 想知道「K7/K8/K9/R4 全 closed 後 ADMIN 還有哪些 readability 痛點 + 下一個最小安全切片是什麼」 |

本 preflight 目的 = **單檔讀懂目前 ADMIN UI 狀態 + 候選下一切片**；**不**取代各候選之獨立 implementation phase preanalysis。

---

## 2. Baseline / closed items

### 2.1 Frozen baseline

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `ad0961c` |
| origin/main | `ad0961c` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean（`git status --short` 為空） |
| latest subject | `docs(project): add cross-line checkpoint` |

本 preflight 未跑 `npm run validate:content` 或任何 check guard（per CLAUDE.md §3a carry-forward；無 regression 風險，因不動 source / content / settings）。

### 2.2 已 closed / accepted（不重開）

| # | 項目 | 證據 | 狀態 |
| --- | --- | --- | --- |
| R1 | detail panel 低頻 4 區段原生 `<details>` 收合（FB Sidecar Dry-run Editor / sourceKey selector preview / Future write readiness checklist / Source path） | `f89ad09`→`3628fcb` browser-PASS | ✅ closed |
| SEO-dryrun | SEO「Dry-run edit (no write)」`<details>` 收合 | `b0a21ad`→`48baabf` browser-PASS；`docs/20260617-admin-seo-dryrun-collapse-browser-pass-record.md` | ✅ closed |
| Validator badge | Posts list 5 態 validator warning badge | `7e4d9cf`→`5793bf6` browser-PASS | ✅ closed |
| Validator filter | Posts list validation state filter（4 option） | `c7b36ee`→`644562e` browser-PASS | ✅ closed |
| R3 | 健康語彙 legend + Missing fields ×2 去重 | `docs/20260617-admin-r3-health-legend-missing-fields-dedup-browser-pass-record.md` | ✅ closed |
| R4 | Categories / Tags collapsible split | `adea772`；`docs/20260617-admin-categories-tags-collapsible-split-browser-pass-record.md` | ✅ closed |
| K7 | Static payload preview copy buttons（clipboard-only；no write path） | `efaa774` source + `c443d31` browser-PASS（Dean 2026-06-18 10:48–11:04） | ✅ closed |
| K8 | Field auto-switch / auto-follow preview-only | `0a89983` source + `d311108` browser-PASS（Dean 2026-06-18 12:11） | ✅ closed |
| K9 | Multi-click determinism smoke browser-PASS（docs-only） | `50b1536`；Dean 2026-06-18 17:50 | ✅ closed |

### 2.3 Dormant / 不主動推進（per CLAUDE.md §3a Red lines）

| Item | Status |
| --- | --- |
| Admin Apply / middleware / API / `admin-write-cli` / `--apply` / `dryRun:false` / browser write / payload file write | ⏸ dormant |
| FB sidecar 真實寫入 | ⏸ dormant（待 `docs/fb-sidecar-write-preflight-decision.md` §7 之 8 項 preflight 完成） |
| ADMIN R2 overview 整併 / R5 cosmetic / SEO Dry-run edit 收合進一步重排 / per-post prescription（「應改為 X」規則引擎）/ loader aggregation migration / validator JSON `--report-json` 改 source-side / filter chip / posts-index validator warning **計數 badge** / summary-card 補 validator 欄 | ⏸ 各須獨立 phase + Dean explicit approval |
| Reverse UTM deploy（pm-26 gate） | 🔴 BLOCKED |

---

## 3. Current ADMIN UI pain points（read-only observation）

> 唯讀盤點來源：`src/views/admin/index.ejs` 現 **2949 行**（read-only `wc -l`）；單檔 standalone HTML，不 wrap base.ejs。本節**只描述既有觀測**，不發明、不推導新規則、不算 line-shift；所有引用之既有 docs / commit 為 carry-forward。

### 3.1 已 closed 之 readability 元素（**不重開**）

| 元素 | 狀態 |
| --- | --- |
| R1 detail panel 低頻 4 區段原生 `<details>` 收合 | ✅ landed |
| SEO Dry-run edit `<details>` 收合 | ✅ landed |
| R3 健康語彙 legend + Missing fields ×2 去重 | ✅ landed |
| R4 Categories / Tags 群 `<details>` 切分 + nav `#tags` `openHashDetails()` | ✅ landed |
| Validator badge + filter chip | ✅ landed |
| K7 / K8 / K9 payload preview（clipboard-only / auto-follow field / multi-click determinism） | ✅ landed |

### 3.2 Pain points still present（**未實作**；既有觀測；不發明新 finding）

| # | 區塊 | 觀測（既有；read-only） | pm-22 / 前 preanalysis 對應 |
| --- | --- | --- | --- |
| P-1 | 頁首 overview 重複 | 頁首 `.stats` flat 15-card overview（L299–315）**與** Dashboard `.surface-grid` 6-card（L342–422）並列；部分數字重複出現於兩處（`blogger enabled` / `github enabled` 同時出現在 flat 15-card 與 Blogger/GitHub surface-card；blogger source / github source 分散兩處） | pm-22 §D.1 R2；`docs/20260617-admin-readability-r-series-next-pick-preanalysis.md` §C.1 / §D.1（評為「中-高視覺破壞風險」） |
| P-2 | nav 順序 vs DOM 順序 | nav（L175–189）順序：Dashboard → Posts → Categories → Tags → Blogger Export → GitHub Pages → AdSense → GA4 → **Commerce / Affiliate（第 9 位，`#commerce`）** → Settings → System checks；但 `#commerce` section 實際 render 於 **L441**（Posts L560 之前）；點 nav `Commerce` 會往**上**跳，與其在 nav 偏後之位置直覺不符 | pm-22 §D.5 R5a；前 preanalysis §C.4 / §D.4 |
| P-3 | inline style 散落 | 全檔 inline `style=` 屬性散布（前 preanalysis §C.4 量測為 244 處；本 preflight 未重數，carry-forward） | pm-22 §D.7 R5b；前 preanalysis §D.4（評為「大面積 cosmetic 搬遷；高 churn / 低值」） |
| P-4 | detail panel 高頻區仍長 | 即使 R1 + SEO Dry-run 已收合，detail panel 之 7 段高頻 `<div class="detail-section">` 仍直接展開：Identity（L867）/ Platform Routing（L887）/ Readiness（L930；含 5 sub-block：Content / Navigation / GA4 / AdSense / Validation）/ Governance signals（L1140）/ Dates（L1217）/ SEO（L1230）/ Blogger channel（L1240）/ GitHub channel（L1252）/ FB promotion（L1262）/ FB Post（L1273；13-row `<dl>`）/ Related / other links（L1369）/ Completeness summary（L1447） | 新觀測；非既有 pm-22 切片之主目標（pm-22 主鎖低頻區段已 R1 完成；高頻區之內部細收合屬「下一輪細部」） |
| P-5 | FB Post `<dl>` 13 列直接展開 | FB Post（read-only metadata；L1273–1301）13 個 `<dt>/<dd>`：exists / enabled / status / badge / fbPostUrl / fbPostedAt / campaign / audience / title / titleEn / hashtags / imageUrl / note / fbPostId；無收合；部分為高頻（badge / status / fbPostUrl / fbPostedAt），部分為低頻 metadata（campaign / audience / imageUrl / note / fbPostId） | 新觀測；非 pm-22 既有切片 |
| P-6 | Readiness 5 sub-block 直接展開 | Readiness section（L930–1132）內含 5 sub-block：Content readiness / Navigation readiness / GA4 readiness / AdSense readiness / Validation warnings；validator badge + filter 已 land 後，「Validation warnings」是讀者最常看的；其餘 4 sub-block（Content / Navigation / GA4 / AdSense）屬靜態 / setup-time readiness，重複看每篇之 ROI 低 | 新觀測；非 pm-22 既有切片；屬「下一輪細部」 |

### 3.3 明確排除（per prompt §3 與既有狀態）

| 項目 | 排除理由 |
| --- | --- |
| ❌ 重開 R4 Categories / Tags split | 已 closed + browser PASS；prompt 明禁 |
| ❌ 重開 K7 / K8 / K9 payload preview | 已 closed + browser PASS；prompt 明禁 |
| ❌ R2 頁首 overview 整併之「擇一為主視圖」 | 前 preanalysis §E 評為中-高風險；屬重大版面決策；非「最小安全切片」 |
| ❌ R5b inline-style 收斂 | 前 preanalysis §H 評為「高 churn / 低值 / 不易乾淨 revert」；可永遠延後 |
| ❌ per-post prescription（「應改為 X」規則引擎） | CLAUDE.md §3a 明示不主動推進 |
| ❌ Apply / write path / middleware / browser write | dormant；CLAUDE.md §3a Red line |
| ❌ loader aggregation migration / validator `--report-json` 改 source-side | CLAUDE.md §3a 明示不主動推進 |
| ❌ filter chip / posts-index validator warning **計數 badge** / summary-card 補 validator 欄 | CLAUDE.md §3a 明示不主動推進；屬獨立 phase + approval |

---

## 4. Candidate next slices

> 各候選**須 Dean explicit approval 才啟動**；Claude 端**不自動執行**。每候選之 acceptance criteria 為 draft，實際 implementation phase 須另開獨立 preanalysis + acceptance。

### 4.1 候選 A — Browser readonly acceptance checklist（docs-only）

| 項 | 值 |
| --- | --- |
| Suggested phase name | `2026XXXX-admin-post-k7-k8-k9-r4-readonly-state-browser-acceptance-checklist-docs-only-a` |
| Target area | ADMIN 全頁（dev-mode-only；K7/K8/K9/R4 closed 後之 current state；no source change） |
| Type | **docs-only**（含 read-only browser checklist；不寫 source；Dean 後續可選擇照 checklist 跑 browser PASS evidence） |
| Risk | **low**（無 source mutation；無 build / deploy） |
| Expected files if implemented later | `docs/2026XXXX-admin-post-k7-k8-k9-r4-readonly-state-browser-acceptance-checklist.md`（單檔；如 Dean 跑 browser，再新增 evidence record 1 檔） |
| Explicit non-goals | ❌ 不寫 source；❌ 不啟動任何 implementation 切片；❌ 不啟動 Admin write；❌ 不重開 K7/K8/K9/R4；❌ 不發 R2/R5 / FB-detail 等新切片之 preanalysis；❌ 不打 backend |
| Acceptance criteria draft | (a) checklist 包含 R1 collapse 預設展開 / R4 Categories/Tags details 預設展開 / SEO Dry-run details 預設收合 / Validator badge 5 態 / Validator filter 4 option / K7 copy buttons 兩顆 / K8 field auto-follow / K9 multi-click determinism；(b) 每項 PASS 條件以 user-evidence 可驗證；(c) 不引入新 source 變更；(d) commit + push docs-only |
| Why now | ✅ K7/K8/K9/R4 closed 後尚未有「一份 checklist 把全部 closed 切片之 browser-observable 狀態列在一起」之文件；對 Dean 為「下一輪 idle freeze 前最後一次 read-only 確認」之低成本工具；零 source 風險 |
| Why not now | ⚠️ 純 docs-only 之 ROI 取決於 Dean 是否會照 checklist 跑 browser；若 Dean 已對現況滿意可直接 idle freeze |

### 4.2 候選 B — FB Post detail section 內部收合（low-freq metadata into `<details>`）

| 項 | 值 |
| --- | --- |
| Suggested phase name | `2026XXXX-admin-fb-post-detail-low-freq-metadata-collapsible-implementation-a` |
| Target area | `src/views/admin/index.ejs` 之 FB Post（read-only metadata）section（L1273–1301；13-row `<dl>`） |
| Type | source change（單檔 additive；mirror R4 / R1 之原生 `<details>` 包裹模式） |
| Risk | **low**（proven `<details>` 機械化包裹；零新 CSS / 零新 JS / 零 loader / 零 data；單檔 additive；可獨立 backout） |
| Expected files if implemented later | `src/views/admin/index.ejs`（單檔 additive 包 `<details>`）+ 1 份 preanalysis + 1 份 browser-PASS record |
| Explicit non-goals | ❌ 不改 `<dl>` row 順序 / 不改文案 / 不改 badge class；❌ 不動 FB Sidecar Dry-run Editor（R1 已收合）；❌ 不啟動 Admin write；❌ 不接 FB Graph API；❌ 不重開 R4 / K7 / K8 / K9；❌ 不動 loader / validator / report；❌ 不新增 smoke guard |
| Acceptance criteria draft | (a) FB Post section 高頻欄位（badge / status / fbPostUrl / fbPostedAt / title / titleEn）直接可見；低頻 metadata（campaign / audience / hashtags / imageUrl / note / fbPostId）包進 `<details>`（預設 `open` 保守 or 預設 `closed`，由 implementation phase 決定文案決策；建議預設 `open` mirror R4 保守風格，資訊不被藏）；(b) dev render exit 0 + admin html grep 無 `<%`/`%>` / `>undefined<` / `>null<` leak；(c) `<details>` / `</details>` / `<summary>` 平衡；(d) browser human-eye PASS：可手動點 summary 收合 / 展開；(e) carry baseline：`check:admin-governance-aggregation` 16/0 + `check:validation-report` 14/0 + `check:admin-validation-consume` 12/0 |
| Why now | ⚠️ 候選之一：mirror R4 proven 模式；單檔；低風險；可降低 detail panel 高頻區之常駐長度；但屬「下一輪細部」，非當前明示 pain |
| Why not now | ⚠️ ADMIN stage 目前 idle freeze（CLAUDE.md §3a「ADMIN 線目前 idle freeze。後續 session 不主動推進」）；P-5 屬「下一輪細部」非當前明示 pain；建議由 Dean 主動點名 |

### 4.3 候選 C — nav-only reorder（將 `Commerce` `<li>` 移至 DOM 順序對齊位置）

| 項 | 值 |
| --- | --- |
| Suggested phase name | `2026XXXX-admin-nav-order-align-dom-implementation-a` |
| Target area | `src/views/admin/index.ejs` nav block（L175–189；`<li>` 重排）；對應 `#commerce` section（L441，在 Posts L560 之前） |
| Type | source change（單檔；極小 `<li>` 重排；零新元素 / 零文案 / 零 CSS / 零 JS） |
| Risk | **極 low**（`<li>` 重排序；無資料 / 條件 / 邏輯變更；可獨立 backout） |
| Expected files if implemented later | `src/views/admin/index.ejs`（單檔；nav `<li>` 重排）+ 1 份 preanalysis + 1 份 browser-PASS record（極小） |
| Explicit non-goals | ❌ 不動 nav 文案 / class / icon；❌ 不動 `#commerce` section 位置（不重排 section render order；只動 nav `<li>` 順序）；❌ 不動其他 nav `<li>`；❌ 不動 anchor / fragment；❌ 不啟動 Admin write；❌ 不重開 K7 / K8 / K9 / R4 |
| Acceptance criteria draft | (a) nav 順序與 DOM render 順序對齊（`Commerce` 改至 `Posts` 之前；或 Dean 偏好任一方向之 alignment）；(b) 點各 nav `<li>` 跳轉方向皆「往下捲」而非「往上跳」；(c) dev render exit 0；(d) browser human-eye PASS：點 nav `Commerce` 跳 `#commerce` 不再往上跳；其他 nav 跳轉行為不變 |
| Why now | ⚠️ 前 preanalysis §H 評為「風險極低但**價值低**；單獨開 phase 性價比不高」；建議若做可順手併入其他 nav-touching phase |
| Why not now | ⚠️ ROI 低；非 P-1/P-2 之主目標；可永遠延後；Dean 也可在 idle freeze 階段忍受目前 nav 跳轉方向 |

### 4.4 候選 D — Readiness section 4 sub-block 內部收合（保留 Validation warnings 直接可見）

| 項 | 值 |
| --- | --- |
| Suggested phase name | `2026XXXX-admin-readiness-section-subblock-collapsible-implementation-a` |
| Target area | `src/views/admin/index.ejs` detail panel 之 Readiness section（L930–1132）內之 4 sub-block：Content readiness（L939）/ Navigation readiness（L971）/ GA4 readiness（L1000）/ AdSense readiness（L1038）；**Validation warnings** sub-block（L1080）維持直接展開 |
| Type | source change（單檔 additive；mirror R4 / R1 之原生 `<details>` 包裹模式） |
| Risk | **low-medium**（高頻區內部細收合；改剛 accept 的 Readiness 區；validator state filter 行為不應受影響；單檔 additive） |
| Expected files if implemented later | `src/views/admin/index.ejs`（單檔 additive）+ 1 份 preanalysis + 1 份 browser-PASS record |
| Explicit non-goals | ❌ 不動 Validation warnings sub-block 之展開 / 文案 / 條件；❌ 不動 5 個 sub-block 之資料來源 / source 文字 / note 文字；❌ 不動 loader / validator / report；❌ 不重開 K7/K8/K9/R4；❌ 不啟動 Admin write；❌ 不新增 smoke guard |
| Acceptance criteria draft | (a) Content / Navigation / GA4 / AdSense readiness 各包一個 `<details>`（預設 `open` 保守，資訊不被藏）；(b) Validation warnings 仍直接可見；(c) dev render exit 0 + admin html grep 無 EJS leak；(d) `<details>` / `</details>` / `<summary>` 平衡；(e) browser human-eye PASS：可手動收合 4 sub-block；filter / sort / detail-panel toggle 行為不變；(f) carry baseline：3 ADMIN smoke 不變 |
| Why now | ⚠️ 候選之一：mirror R4 proven 模式；可大幅降低 detail panel 高頻區常駐長度（Readiness 是最長的高頻 detail-section） |
| Why not now | ⚠️ 為「動剛 accept 的高頻區」之風險（mirror R4 但目標較高頻）；非當前明示 pain；建議由 Dean 主動點名後再啟動 |

### 4.5 候選 E — Idle freeze（noop；docs-only 宣告）

| 項 | 值 |
| --- | --- |
| Suggested phase name | `2026XXXX-admin-post-k7-k8-k9-r4-idle-freeze-noop-a` |
| Target area | n/a（純宣告 idle freeze） |
| Type | docs-only（最小落地） |
| Risk | **極 low**（無 mutation） |
| Expected files if implemented later | 0；或 1 份極短 idle-freeze record |
| Explicit non-goals | ❌ 不啟動任何切片；❌ 不寫 source；❌ 不打 backend |
| Acceptance criteria draft | (a) 明示 ADMIN 線維持 idle freeze；(b) Dean 可隨時改變心意點名候選 A–D 任一 |
| Why now | ✅ 對齊 CLAUDE.md §3a「ADMIN 線目前 idle freeze。後續 session 不主動推進」；對齊 prompt §5「如不確定，推薦 docs-only browser acceptance checklist，而不是 source implementation」之保守原則之最保守端點 |
| Why not now | ⚠️ 若 Dean 已明確想推進某切片，可直接點名候選 A–D 之一 |

### 4.6 候選優先序總覽

| 候選 | Type | Risk | Recommended? | 主要適用情境 |
| --- | --- | --- | --- | --- |
| A — Browser readonly acceptance checklist | docs-only | low | ✅ **第一順位**（如 Dean 想要 read-only 階段最後一份視圖） | Dean 想對現況做最後一次 read-only check |
| B — FB Post detail collapsible | source（單檔 additive） | low | ⚠️ 第二順位（如 Dean 想推一個最小 source 切片） | Dean 想推一個低風險 mirror-R4 切片 |
| C — nav-only reorder | source（單檔；極小） | 極 low | ⚠️ 可順手做（如某未來 phase 動 nav） | Dean 對 nav 跳轉方向已感困擾 |
| D — Readiness 4 sub-block collapsible | source（單檔 additive） | low-medium | ⚠️ 第三順位（動高頻區風險略高） | Dean 想進一步降低 detail panel 高頻區長度 |
| E — Idle freeze | docs-only | 極 low | ✅ 預設（如未獲明確下一步指示） | 對齊 CLAUDE.md §3a ADMIN idle freeze |

---

## 5. Recommended next action

**建議下一輪採候選 A（Browser readonly acceptance checklist；docs-only）。**

理由：

1. **對齊 prompt §5 「如不確定，推薦 docs-only browser acceptance checklist，而不是 source implementation」之保守原則**。
2. **對齊 CLAUDE.md §3a 之 ADMIN idle freeze 紀律**：候選 A 屬 docs-only，**不啟動 source implementation**；可在不破壞 idle freeze 之前提下為 K7/K8/K9/R4 closed 後之現況提供一份單一 read-only 視圖。
3. **零 source 風險**：候選 A 不動 source / content / settings / package / build / deploy / backend / admin-write；K7/K8/K9/R4 不重開；無 regression 風險。
4. **對 Dean 之低成本工具**：若 Dean 跑 checklist，可一次性確認所有 closed 切片之 browser-observable 狀態；若 Dean 不跑，仍保有此檔作為「下一輪 cold-start 之單一視圖」之 reference。

**若 Dean 不想做候選 A 也不想推任何 source 切片**：直接採候選 E（idle freeze；noop），對齊 CLAUDE.md §3a「ADMIN 線目前 idle freeze。後續 session 不主動推進」。

**若 Dean 想推一個最小 source 切片**：建議候選 B（FB Post detail collapsible）為最小機械化 mirror-R4 切片；風險最低、單檔 additive、proven 模式、可獨立 backout。

**禁止自動執行（重申）**：build / deploy / Blogger repost / Admin Apply / middleware / `admin-write-cli` / `--apply` / `dryRun:false` / dev server / Blogger / GA4 / AdSense / Google Drive / Search Console / GitHub Pages 後台 / Phase 1 重做 / 任何 R2+ / write path / FB sidecar 真實寫入 / reverse UTM deploy / npm install / 動 dependency / merge / rebase / reset / amend / force-push / 把巨型 ledger 又寫回 CLAUDE.md。

---

## 6. Implementation boundary for future phase

若 Dean approval 候選 B / C / D 中任一啟動，未來 implementation phase **必須**遵守以下邊界（per 既有 R1 / R4 / SEO-dryrun PASS 慣例）：

### 6.1 Allowed files

- `src/views/admin/index.ejs`（單檔 additive；候選 B / C / D 皆為單檔）

### 6.2 Forbidden files

- ❌ `src/scripts/load-admin-posts.js`（loader；不動）
- ❌ `src/scripts/validate-content.js`（validator；不動）
- ❌ `src/scripts/report-validation.js`（reporter；不動）
- ❌ `src/scripts/build-github.js`（builder；不動）
- ❌ `src/js/` / `src/styles/` / `src/views/pages/`（不動）
- ❌ `content/` / `content/settings/`（不動）
- ❌ `content/validation-fixtures/`（不動）
- ❌ `package.json` / `package-lock.json`（不動）
- ❌ `vite.config.js`（不動）
- ❌ `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache/`（不動 / 不 commit）
- ❌ `CLAUDE.md` / `MEMORY.md`（不動）

### 6.3 Required validation / browser evidence

每候選之 implementation phase 須跑：

| 檢查 | 預期 |
| --- | --- |
| `node src/scripts/build-github.js --mode=dev` | exit 0；admin html render 無 EJS error |
| rendered admin html grep | 無 `<%` / `%>` leak；無 `>undefined<` / `>null<` leak |
| `<details>` / `</details>` / `<summary>` 平衡 | 計數對稱 |
| `git diff --check` | no whitespace errors |
| `check:admin-governance-aggregation` | 16/0 carry |
| `check:validation-report` | 14/0 carry |
| `check:admin-validation-consume` | 12/0 carry |
| browser human-eye PASS（Chrome on Windows） | 候選 B：FB Post details 可收合 / 展開；高頻欄位直接可見；其他 detail panel 行為不變；console 無新錯誤<br>候選 C：點 nav `Commerce` 跳轉方向直覺；其他 nav 行為不變<br>候選 D：4 sub-block details 可收合 / 展開；Validation warnings 仍直接可見；filter / sort / detail-panel toggle 行為不變；console 無新錯誤 |

### 6.4 Rollback plan

每候選之 implementation phase 須符合：

- **單檔 additive**：僅動 `src/views/admin/index.ejs`；可 `git revert <commit>` 一鍵還原
- **無 deploy 影響**：ADMIN = dev-mode-only；不進 dist / 不 deploy / noindex；rollback 不影響 production / live site / Blogger / GitHub Pages
- **無 loader / validator / report schema 變動**：3 ADMIN smoke + validate:content 不受 schema 影響

### 6.5 No-write guarantee

每候選之 implementation phase 須符合：

- ❌ 不引入新 `<button>` / `<input>` / `<form>` / `<textarea>` / `<select>` / `onclick=` / `onchange=` / `fetch(` / `XMLHttpRequest` / `navigator.clipboard.write*`（候選 B / D 不應引入；候選 C 純 nav `<li>` 重排，不引入任何新元素）
- ❌ 不引入新 Apply 路徑 / dryRun:false / --apply / middleware / admin-write-cli / payload file write
- ❌ K7 之 clipboard-only copy buttons 不擴大範圍；K8 之 field auto-follow 不擴大範圍；K9 之 multi-click determinism 觀測屬性不改變

---

## 7. Explicit non-actions（本 preflight phase）

本 phase 之 **唯一 mutation = 本檔新增**。本 phase **未**：

| 類 | 範圍 |
| --- | --- |
| Source change | `src/views/` / `src/scripts/` / `src/js/` / `src/styles/` 全未動 |
| Admin write | Admin Apply / middleware / API / `admin-write-cli` / `safe-write:test` / `--apply` / `dryRun:false` / payload file write 全未啟動 |
| Build / deploy / dev server | `npm run dev` / `npm run build` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap` / `npm run preview` / dev server 全未跑 |
| Blogger repost | Blogger 後台未登入；未重貼；未動 P2 / P3 / 既有 6 篇 |
| GA4 / AdSense / Blogger / Google Drive / Search Console / GitHub Pages 後台 | 未登入；未操作；未打 GA4 Admin / Reporting API |
| Content / settings change | `content/settings/` / `content/github/` / `content/blogger/` / `content/templates/` / `content/drafts/` / `content/archive/` / `content/validation-fixtures/` / `package.json` / lockfile / `vite.config.js` 全未動 |
| Validation / check guard | `npm run validate:content` / `check:adsense-resolver` / `check:adsense-article-block` / `check:adsense-anchor-wiring` / `check:blogger-adsense-output` / `check-commerce-affiliate-resolver` / `check:admin-governance-aggregation` / `check:validation-report` / `check:admin-validation-consume` / `report:validation` 全未跑 |
| K7 / K8 / K9 / R4 / R3 / SEO-dryrun / R1 重開 | 未重開；全 carry-forward closed |
| R2 overview 整併 / R5b inline-style 收斂 | 未啟動 implementation |
| Evidence record（E1 / E2 / P3 metadata backfill / P2 live verification / live source fetch） | 未建立；未推導；未猜測；未填 Blogger `postId` / `publishedAt` |
| CLAUDE.md / MEMORY.md change | CLAUDE.md / MEMORY.md / `memory/` / `docs/README.md` 全未動 |
| Git destructive operation | npm install / amend / rebase / merge / cherry-pick / force-push / `--no-verify` / `--no-gpg-sign` 全未做 |
| Reverse UTM deploy | 未啟動；pm-26 gate 維持 BLOCKED |
| FB sidecar 真實寫入 | 未啟動；dormant |
| Phase 1 final 重做 / 降級 / 重新封存 | 未做 |

---

## 8. Acceptance criteria（本 preflight phase）

### 8.1 PASS 條件

1. baseline verify observed 與 phase prompt §Baseline verify 一致（HEAD = origin/main = `ad0961c`；clean；0/0）
2. 本檔（`docs/20260621-admin-next-readability-slice-preflight.md`）新增成功
3. 內容涵蓋 prompt §1–§8 所要求之 8 個 section
4. current pain points / candidate next slices / recommended next action 清楚可讀
5. K7 / K8 / K9 / R4 / R3 / SEO-dryrun / R1 之 closed 狀態**不**被改寫
6. 無 source / content / settings / package / build / deploy / backend / admin-write mutation
7. commit + push 成功；post-push working tree clean；ahead/behind = 0/0
8. 本檔 land 後 working tree 回到 clean（除本檔新增以外無 untracked）

### 8.2 FAIL 條件

任一發生 → FAIL：

- baseline verify 不符 → 立即停止；不修正；不 commit
- 本檔誤觸 `src/` / `content/` / `settings/` / `package.json` / lockfile / dist
- 本檔含完整 `measurementId`（非 masked tail4）/ AdSense 真實 client / slot / affiliate token / Forms responses / 猜測之 Blogger `postId` / `publishedAt`
- 本檔誤推薦「立即啟動 R2 / R5b / per-post prescription / Admin write / browser write / E1 / E2 / E3 / P3 metadata backfill / P2 live repost」
- 本檔重開 K7 / K8 / K9 / R4 / R3 / SEO-dryrun / R1
- 本檔取代 Phase 1 final 宣告 / 降級 / 重新封存
- 本檔建立 evidence record（屬 E1 / acceptance phase；本 phase 不啟動）
- 本檔 claim live verification（本檔不 fetch live URL；不打 backend）
- 本檔改 CLAUDE.md / MEMORY.md

---

## 9. Cross-links

- `docs/20260621-blog-system-cross-line-checkpoint.md`（前一輪 cross-line checkpoint；at `0816044`；本 preflight 之前置 cross-line 視圖）
- `docs/20260617-admin-readability-r-series-next-pick-preanalysis.md`（at `441877a`；R-series 候選盤點之 source-of-truth；本 preflight carry-forward 其 R4 / R5 / R2 評估）
- `docs/20260617-admin-categories-tags-collapsible-split-browser-pass-record.md`（R4 browser PASS）
- `docs/20260617-admin-seo-dryrun-collapse-browser-pass-record.md`（SEO Dry-run 收合 browser PASS）
- `docs/20260617-admin-validator-warning-badge-browser-pass-record.md`（validator badge browser PASS）
- `docs/20260617-admin-validator-state-filter-browser-pass-record.md`（validator filter browser PASS）
- `docs/20260617-admin-r3-health-legend-missing-fields-dedup-browser-pass-record.md`（R3 browser PASS）
- `docs/20260618-am-admin-k7-copy-buttons-acceptance-record.md`（K7 acceptance；at `7dcb0b4`）
- `docs/20260618-am-admin-k7-copy-buttons-browser-pass-record.md`（K7 browser PASS；at `c443d31`）
- `docs/20260618-admin-k8-field-auto-switch-browser-pass-record.md`（K8 browser PASS；at `d311108`）
- `docs/20260618-admin-k9-multiclick-determinism-browser-pass-record.md`（K9 browser PASS；at `50b1536`）
- `docs/20260616-night-admin-stage-progress-checkpoint-and-next-action-map.md`（ADMIN stage checkpoint；本 preflight 對齊 §G 保守 / §H implementation 候選之分類）
- `docs/20260616-admin-readability-ia-refinement-preanalysis.md`（pm-22；R1–R5 切片序列原始 source-of-truth）
- CLAUDE.md §3a Core operating rules / §3a Red lines / §28 / §29 / §30

---

（本文件結束）
