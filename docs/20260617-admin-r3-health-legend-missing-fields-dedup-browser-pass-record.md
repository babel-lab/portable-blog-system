# ADMIN R3 — Health legend + Missing fields dedup — browser human-eye PASS record（docs-only）

> Phase: `20260617-am-admin-r3-health-legend-missing-fields-dedup-browser-pass-record-docs-only-a`
> Date: 2026-06-17 11:20+
> Type: docs-only acceptance record（不改 source / view / scripts / loader / reporter / validator / content / settings / package / dist / gh-pages / `.cache`；不 build / deploy / repost）
> Scope: 記錄 commit `63057af`（`feat(admin): add health legend and dedup missing fields`）之 R3 browser human-eye PASS（含 console caveat），收尾 R3 全鏈。R2（頁首 overview 整併）+ R5（nav 對齊 + inline-style 收斂）維持 deferred until explicit approval。

---

## A. Phase name

`20260617-am-admin-r3-health-legend-missing-fields-dedup-browser-pass-record-docs-only-a`

承接：
- `20260617-am-admin-r3-health-legend-missing-fields-dedup-preanalysis-docs-only-a`（commit `9aca6c3`；docs-only preanalysis；Legend Opt-A + Missing fields Opt-2 路線）
- `20260617-am-admin-r3-health-legend-missing-fields-dedup-implementation-a`（commit `63057af`；Phase R3 source landed；`src/views/admin/index.ejs` +21/−11）

---

## B. Baseline observed

| 項目 | 值 | 對照 expected |
|---|---|---|
| pwd | `/d/github/blog-new/portable-blog-system` | ✅ |
| branch | `main` | ✅ |
| HEAD | `63057af` | ✅ |
| origin/main | `63057af` | ✅ |
| HEAD == origin/main | ✅ | ✅ |
| ahead / behind | `0 / 0` | ✅ |
| latest subject | `feat(admin): add health legend and dedup missing fields` | ✅ |
| working tree | clean | ✅ |

→ Baseline 完全符合 expected。未 pull / merge / reset / rebase / amend / force-push。

---

## C. Commit under acceptance

| 項目 | 值 |
|---|---|
| commit | `63057af` |
| subject | `feat(admin): add health legend and dedup missing fields` |
| 變更檔 | `src/views/admin/index.ejs`（+21 / −11；單檔） |
| 父 commit | `9aca6c3`（`docs(admin): plan r3 health legend dedup`） |

---

## D. Implementation scope summary

- **唯一變更檔** = `src/views/admin/index.ejs`（+21 / −11）
- **Legend Opt-A**：Posts section 表格上方（generatedAt banner 後、`<% if (posts.length === 0) %>` 前）加 **1 處 page-level**「健康訊號讀法（read-only）」legend（`.admin-governance-note`；**不**在每篇 detail panel ×11 重複）。三條清楚區分：
  - `Validation warnings`（detail panel → Readiness）= `npm run validate:content` report / validator·report **ground truth**（僅 ready/published；draft 顯「未驗證」非 0）
  - `Completeness / Missing fields` = admin loader derived **read-only 提示，非 build blocker**
  - `Governance signals`（`gov` badge）= taxonomy derived **read-only 提示，不等於 validator warning 計數**（universe 差異註）
  - 無「自動修正」/「應改為 X」prescription；沿用既有 class（零新 CSS）
- **Missing fields Opt-2**：Missing fields 併入 Completeness summary 同一 `.detail-section`，**移除原獨立 Missing fields section**（source `.detail-section` 19→17，−2）；保留 missing（「缺漏 / 建議補齊欄位…」+ b-missing badges）與齊全（b-ok「所有檢查欄位齊全」）兩分支
- **不變更**：loader（`load-admin-posts.js`）/ validator / reporter / validation report ground truth / `p.completeness`·`p.missingFields` data shape / content / settings / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages

### D.1 程式化驗證 carry（自 implementation phase）

| 檢查 | 結果 |
|---|---|
| `node src/scripts/build-github.js --mode=dev` | exit 0；wrote admin html；無 EJS error |
| legend rendered（page-level，含 ground-truth 措辭） | 1 |
| 舊 `<h3>Missing fields` rendered | 0（已移除/併入） |
| 併入後「缺漏 / 建議補齊欄位」rendered | 11（當前 11 篇皆有 missing hint → 全走 `if` 分支） |
| 齊全 else 分支 | source 保留（1）；當前資料未觸發（rendered 0，非 bug） |
| Completeness summary h3 rendered | 11（每篇 1） |
| EJS leak / `>undefined<`·`>null<` leak | 0 / 0 |
| R4 collapsible（`<details>`/`</details>`/`<summary>` 平衡） | 59 / 59 / 59 不變；cat-tags-group 2；`id="tags"` 1 |
| `git diff --check` | no whitespace errors；diff 僅 `index.ejs` |
| `check:admin-governance-aggregation` | 16 passed / 0 failed |
| `check:validation-report` | 14 passed / 0 failed |
| `check:admin-validation-consume` | 12 passed / 0 failed |

→ production-post warnings 維持 0；3 ADMIN smoke 全 carry（無 data regression）。

---

## E. User browser human-eye PASS result

- **測試環境**：`npm run dev` → `http://localhost:5173/admin/#posts`；Chrome（DevTools 開啟）

| # | 項目 | 結果 |
|---|---|---|
| 1 | Posts 表格上方有 **1 處**「健康訊號讀法（read-only）」legend（不每篇重複） | ✅ PASS |
| 2 | Legend 區分 `Validation warnings` = `validate:content` report / validator ground truth | ✅ PASS |
| 3 | Legend 區分 `Completeness / Missing fields` = admin loader derived read-only hint，非 build blocker | ✅ PASS |
| 4 | Legend 區分 `Governance signals` = taxonomy derived read-only hint，不等於 validator warning count | ✅ PASS |
| 5 | 沒看到「自動修正」/「應改為 X」prescription 文案 | ✅ PASS |
| 6 | 點 post row 展開 detail panel 正常 | ✅ PASS |
| 7 | `Completeness summary` 內直接接「缺漏 / 建議補齊欄位」badges | ✅ PASS |
| 8 | 不再有獨立的 `Missing fields` detail section | ✅ PASS |
| 9 | `Validation warnings` 仍在 Readiness 內；`Governance signals` 仍獨立；三者不混淆 | ✅ PASS |
| 10 | R4 Categories / Tags 收合 + 手動收合 Tags 後 nav `Tags` auto-open 無 regression | ✅ PASS |
| 11 | 低頻 details（`Dry-run edit (no write)` / `Future write readiness checklist` / `Source path`）仍可收合 / 展開 | ✅ PASS |
| 12 | validation state filter 可切換；`issues` / `no-report` 目前未篩出資料（視為當前資料狀態可接受，頁面未壞） | ✅ PASS |

---

## F. Console caveat

- Chrome console observed：`ObjectMultiplex - malformed chunk without name "[object Object]"`
- source 顯示為 `contentscript.js`
- 接受為 **browser extension / content-script noise**（非 `/admin/` app-owned）
- **no observed admin app-owned error**
- ⚠️ 本記錄**不**宣稱「console completely clean」；如實記錄為：**console has extension/content-script noise; no observed admin app-owned error**。

---

## G. Acceptance decision

- ✅ **R3 core goal PASS**：
  - Legend Opt-A —— 1 處 page-level「健康訊號讀法」legend，清楚區分 validator/report ground truth vs admin derived read-only hint，無 prescription。
  - Missing fields Opt-2 —— Missing fields 併入 Completeness summary，獨立 section 移除，detail panel 少 1 段；三套健康語彙（Validation warnings / Governance signals / Completeness summary）不混淆。
- ✅ **Console caveat accepted and non-blocking**：extension/content-script noise（`ObjectMultiplex … contentscript.js`），非 admin app-owned error。
- ✅ **No regression**：R4（Categories/Tags 收合 + `#tags` auto-open）、R1 低頻 details、SEO dry-run 收合、validation state filter 全部正常。

→ 本 acceptance 涵蓋 human visual + user-confirmed console（含 caveat 原文）。

---

## H. Red lines confirmed

本 docs-only phase 未且不得違反：
- ❌ 未改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `package.json` / `package-lock.json` / `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache/`
- ❌ 未改 `CLAUDE.md` / `MEMORY.md` / `memory/`
- ❌ 未啟動 write path（Admin Apply / Save / Auto-fix / admin-write-cli / middleware / FB sidecar 真實寫入）
- ❌ 未碰 validator `--report-json`（動 ground truth）/ loader cross-post aggregation migration
- ❌ 未 `npm install` / build / deploy / push gh-pages / Blogger repost / browser implementation change
- ❌ 未做 per-post prescription / Posts-index 計數 badge 跳轉 / summary-card 補 validator 欄
- ❌ 未 merge / rebase / reset / amend / cherry-pick / force-push / 跳 hooks / bypass signing
- ❌ 未對 Phase 1 final 宣告做任何降級或重新封存
- ❌ 未啟動 reverse UTM deploy（pm-26 gate 維持 BLOCKED）；未觸碰 Blogger / GA4 / AdSense / Google Drive / Search Console 後台

---

## I. Non-actions（本 phase 實際未做）

docs-only acceptance record —— 唯一 mutation = 本記錄 doc（+ 依本 phase 指示之 commit / push）。未改任何 source / view / scripts / loader / validator / reporter / content / settings / package / dist / gh-pages / `.cache`；未做任何 ADMIN UI / CSS / 摺疊 / 重排 source 變更；未 build / deploy；未跑 npm validation（baseline carry-forward；未碰 source）。

---

## J. Next candidates（待 user explicit approval；本 phase 不主動執行）

| 候選 | 類型 | 說明 |
|---|---|---|
| **idle freeze（建議）** | — | R1 / R3 / R4 + SEO-dryrun 收合 + validator badge/filter 皆已 landed + browser PASS；ADMIN readability 線可暫進 idle freeze；BLOG 重心可回 content / publishing / 觀察線 |
| **defer R2** | implementation（未來） | 頁首 overview 整併（`.stats` 15-card vs Dashboard 6 surface-card）；中-高視覺破壞風險，須先 mockup（per R-series next-pick §H 暫緩項） |
| **defer R5** | implementation（未來） | nav 對齊 DOM 順序（極小）+ inline-style 收斂（高 churn 低值）；建議 nav-only 可選擇性併入未來 phase |
| **其他 user-selected 方向** | — | 內容線 / 觀察線（AdSense / GA4）/ 其他，由 user 主動指定 |

---

## K. STOP

R3 全鏈完成全閉環：preanalysis（`9aca6c3`，R-series 第二順位）→ implementation（`63057af`）→ render-preflight（程式化 grep + 3 smoke carry）→ browser human-eye PASS + console caveat（本記錄）。

→ **不主動推進 R2 / R5 或任何 implementation；等待 user explicit approval。**

---

（本文件結束）
