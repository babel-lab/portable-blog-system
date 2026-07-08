# Phase 1 第三次小型人工 smoke 結果紀錄（docs-only result record）

- 建立日期：2026-07-08（Asia/Taipei）
- 類型：docs-only **result record**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md`）。
- 執行框架：`docs/20260708-phase1-p1-followup-closeout-inventory.md` §E 候選 1「第三次小型人工 smoke，docs-only 執行紀錄」。
- 執行者：Dean（人工）。Claude 僅做 read-only boot verification + 記錄本 doc；**未**代替宣告 PASS、**未** build / deploy / 登入任何後台。
- 前一次 E2E：`docs/20260708-phase1-second-manual-e2e-result.md`（第二次人工 E2E，2026-07-08，PASS with P1/P2 follow-up）。
- 前一次 P1/P2 closeout 盤點：`docs/20260708-phase1-p1-followup-closeout-inventory.md`（本次 smoke 用以驗證 P1-1 fix 與 P1-2 runbook 是否真的順手，並在有機會時抓 P1-3 offender element）。

---

## A. 測試前 baseline（read-only 驗證，Claude 執行）

| Repo | branch | HEAD | 對照 | ahead/behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `0c64a56` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅（前次觀察值，未於本 smoke 再讀寫） | 未於本 smoke 讀寫 | 未於本 smoke 讀寫 | 未於本 smoke 讀寫 |

判定：source baseline 完全符合 frozen baseline；deploy clone 於本次 smoke **未讀寫**（本輪為 Blogger draft-preview + 極短暫發布回退鏈路，未觸 GitHub Pages deploy）。

---

## B. 測試基本資料（Dean 提供）

| 欄位 | 值 |
| --- | --- |
| Test time | 2026-07-08 23:xx（Asia/Taipei） |
| Tester | Dean |
| Source HEAD | `0c64a56` |
| Deploy HEAD | `1170e7e`（未動） |
| Test article title | Phase 1 第三次 Smoke 測試文章 |
| Test article slug | `phase1-third-smoke-test-20260708` |
| Blogger | draft preview first；**暫時發布**（僅為驗證實機手機版），發布後**已 revert / 刪除** |
| GitHub Pages | **no deploy** |

> 註：測試文章 md、`dist-blogger/` 輸出、Blogger 該次暫時發布之貼文，均於建立本紀錄前由 Dean 清理 / 移除（見 §F Cleanup）。本紀錄不將任何測試 artifact 寫回 `content/`。
> IDE 若仍顯示 `content/blogger/posts/2026-07-08-phase1-third-smoke-test-20260708.md` 為開啟中，屬編輯器快取；Claude 已於本紀錄建立時實測該 md **不存在**於磁碟。

---

## C. 自動 checks（Dean 執行；Claude 未重跑）

| # | 指令 | 結果 |
| --- | --- | --- |
| C-1 | `npm run check:phase1-readiness-contract` | **PASS** |
| C-2 | `npm run validate:content`（build 前） | **PASS with warnings** |
| C-3 | `npm run build:blogger` | **PASS** |

> C-2 之 warning 來源為測試文章之 metadata（例如 `cover` 缺失）；因測試文章於 smoke 結束後即移除，未流入正式 dist / 正式發布，屬 **expected smoke artifact warning**，非 blocker。詳見 §G P2-2。

---

## D. Admin Blogger Export helper 驗證（對應 P1-1 fix，commit `38a4e98`）

| 項目 | 判定 |
| --- | --- |
| Admin `/#blogger-export` per-post output paths 可見 | **PASS** |
| Copy output folder path 按鈕 | **PASS** |
| Copy `post.html` path 按鈕 | **PASS** |
| Copy `copy-helper.txt` path 按鈕 | **PASS** |
| Copy `publish-checklist.txt` path 按鈕 | **PASS** |
| Copy `meta.json` path 按鈕 | **PASS** |

實際複製到之 per-post 路徑（Dean 驗證）：

- `dist-blogger/posts/phase1-third-smoke-test-20260708/`
- `dist-blogger/posts/phase1-third-smoke-test-20260708/post.html`
- `dist-blogger/posts/phase1-third-smoke-test-20260708/copy-helper.txt`
- `dist-blogger/posts/phase1-third-smoke-test-20260708/publish-checklist.txt`
- `dist-blogger/posts/phase1-third-smoke-test-20260708/meta.json`

判定：**P1-1 fix 真正順手**——原「手動找 dist-blogger 子資料夾」摩擦點已消除；per-post copy 按鈕 5/5 可用；契約仍為 clipboard-only（未觸發任何檔案讀取 / 開啟 / build / deploy）。

---

## E. Blogger draft preview + 實機手機版驗證（對應 P1-3 needs-reproduction）

### E-1 Blogger draft preview（HTML 模式）

| 項目 | 判定 |
| --- | --- |
| Blogger HTML-mode preview 渲染 | **PASS** |
| Raw Markdown 已完全消失（無 `##` / raw markdown link 等） | **PASS** |
| RWD / 版面 | **PASS with warnings** |

### E-2 Preview 水平捲軸觀察（依 `docs/20260708-blogger-draft-preview-runbook.md` §F debug）

| 項目 | 結果 |
| --- | --- |
| Blogger Preview 出現水平捲軸 | **yes** |
| Offending element 已定位 | **yes** |
| Offending selector / element | `div.Rcpctd` |
| 判定來源分類 | ad iframe / Blogger preview external layer / **unknown**（非 `.lab-blogger-article` 內元素） |
| 分級（僅就 Blogger Preview 而言） | **P1 / needs reproduction** |

### E-3 實機發布後手機版驗證（Dean 執行）

| 項目 | 結果 |
| --- | --- |
| 是否發布 Blogger 進行實機驗證 | **yes**（**暫時**發布，僅為驗證實機手機外觀；隨即 revert / 刪除） |
| 實機發布後手機版是否出現水平捲軸 | **no** |
| 實機發布分類 | **likely external Blogger Preview artifact / P2** |

### E-4 P1-3 分級更新（依 runbook §F 判斷規則）

- 前一輪（`docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md`、`docs/20260708-phase1-p1-followup-closeout-inventory.md` §B P1-3）判定：**P1 / needs reproduction**（僅 Blogger preview 觀察到、實機未復現、**未** 定位 offender element）。
- 本次觀察結果：
  1. Offender element 已定位為 `div.Rcpctd`——**非** `.lab-blogger-article` 內之專案元素；`Rcpctd` 樣式看起來屬 Blogger 平台 / 預覽鏈路層（audit §3 假說「Blogger preview chrome」/「Blogger theme」/「adsbygoogle 廣告區」之一，尚未再細分）。
  2. 實機發布之手機版**未**復現水平捲軸——與 audit §6「降 P2」觸發條件相符（「preview 出現、實機 published 未出現」）。
- **結論**：**P1-3 由 P1 / needs reproduction → 降級為 P2 / likely external Blogger preview artifact。**
- **但仍保留為 P2** 而非 close 之理由：offender element `div.Rcpctd` 之最終歸屬（Blogger chrome / Blogger theme / ad iframe / 其他）**尚未百分百確認**；若日後於**實機**發布頁再度出現水平捲軸，須立即依 runbook §F 重新分類（**不**逕自視為 external artifact）。

**caveat**：本次驗證涉及 Dean **暫時發布**測試貼文以檢視實機手機外觀，隨後 revert / 刪除。此屬 Dean 自主之 Blogger 後台操作，Claude **未** 登入 Blogger、**未** 代替發布或刪除；本 doc 僅記錄 Dean 回報之觀察結果。**本次極短暫發布並非正式 Phase 1 Blogger 發布**，不宣稱任何正式發布結論。

---

## F. Cleanup（Dean 於建立本紀錄前完成）

| 項目 | 結果 |
| --- | --- |
| 測試 `.md` 已移除（`content/blogger/posts/2026-07-08-phase1-third-smoke-test-20260708.md`） | **PASS**（Claude 實測磁碟不存在；IDE 若仍顯示為開啟中屬編輯器快取） |
| `dist-blogger/posts/phase1-third-smoke-test-20260708/` 已移除 | **PASS**（Claude 實測磁碟不存在） |
| `git status --short` clean | **PASS**（本 doc 建立前 tree clean） |
| Blogger 該次暫時發布已 revert / 刪除 | **PASS**（Dean 回報；Claude **未** 登入 Blogger 驗證） |
| GitHub Pages | **未 deploy**，`gh-pages` 未動 |

---

## G. 問題分級（Dean 判定 + 本次 smoke 更新）

### P0（阻擋性）

- **none**。

### P1（實機發布仍存在之應修項）

- **none for actual published page**——實機手機版無水平捲軸、無其他 P1。

### P2（可延後 / 需 reproduction 才升級）

1. **Blogger Preview 水平捲軸 `div.Rcpctd`**：僅於 Blogger draft preview 出現、實機發布手機版未復現；**likely external Blogger preview / ad-layer artifact**。**若日後於實機發布頁再度出現，須立即依 runbook §F 重新分類**（不逕自視為 external）。
2. **`validate:content` 對測試文章 metadata 之 warning**（例如 `cover` 缺失）：屬 **expected smoke artifact warning**；因測試文章於 smoke 結束後已移除、未發布、未進正式 dist，非 blocker。

---

## H. 對前次 P1/P2 follow-up 之狀態影響

依 `docs/20260708-phase1-p1-followup-closeout-inventory.md` §B/§C 之四項：

| 前次項目 | 前次狀態建議 | 本次 smoke 驗證結果 | 本次結論 |
| --- | --- | --- | --- |
| P1-1（Admin per-post output paths） | Resolved for Phase 1 stability testing | 5/5 per-post 路徑按鈕實地 PASS | **verified resolved**（實地驗證通過） |
| P1-2（draft preview eligibility / runbook） | Documented / accepted for Phase 1 | 依 runbook §D 6 步操作可重複；改回 + cleanup 步驟可執行、tree 回到 clean | **verified usable**（runbook 可重複） |
| P1-3（Blogger mobile preview 水平捲軸） | Remains P1 / needs reproduction | Offender `div.Rcpctd` 已定位；實機發布手機版**未**復現 | **downgraded P1 → P2 / likely external artifact**（尚未百分百確認歸屬；日後實機頁再現須依 runbook §F 重評） |
| P2-1（測試文章假 cover / JSON-LD image artifact） | Documented / accepted | 本次亦出現同類 warning，測試後即移除 | **unchanged**（測試資料問題，非系統缺陷） |

---

## I. Phase 1 readiness implication

| 問題 | 判定 | 依據 |
| --- | --- | --- |
| 是否有新的 P0 blocker？ | **none** | §G P0 = none |
| 前次三項 P1 目前有多少實地驗證通過 / 降級 / 仍待實測 | P1-1 verified resolved；P1-2 verified usable；P1-3 降為 P2 / likely external | §H |
| 是否可以繼續 Phase 1 穩定測試 / 進入下一輪流程？ | **yes**（穩定測試面）；若下一輪為「domain / AdSense / deploy」則**不可** | `docs/20260708-phase1-stability-readiness-inventory.md` §4.4；`CLAUDE.md` §5 分階段 + §27 修改規則 |
| 是否可以 build / deploy / 動 Blogger / AdSense / GA4 / GSC 後台 / 網域 / DNS？ | **no**，本輪**不處理** | 界線同 §I 上一列；本 doc 為 result-only |

---

## J. 結論（Dean）

- **整體判定：Phase 1 第三次小型人工 smoke = PASS with P2 follow-up。**
- P1-1（Admin Blogger Export per-post output paths）：**verified resolved**。
- P1-2（Blogger draft preview runbook）：**verified usable**。
- P1-3（Blogger mobile preview 水平捲軸）：**downgraded P1 → P2 / likely external Blogger preview artifact**（實機發布手機版未復現；offender = `div.Rcpctd`，尚未百分百確認歸屬）。
- **No GitHub Pages deploy。No gh-pages changes。**
- **No 正式 Phase 1 Blogger 發布**（本次極短暫發布僅為驗證實機手機外觀，隨即 revert / 刪除）。

**caveat**：本結論基於 Dean 人工測試 + repo 內 read-only guard；Claude 未登入任何 Google / Blogger / GA4 / AdSense / GSC 後台，未 build / deploy。本次 smoke 涉及 Dean 之暫時 Blogger 發布 → revert / 刪除，屬 Dean 自主操作，**不代表正式發布 / 亦不代表已完成正式發布流程**。

---

## K. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔。**不含**任何程式 / frontmatter / settings / build / deploy / dev-server 變更；不新增 guard / npm script；不修 CSS；不改 `CLAUDE.md` / `MEMORY.md` / `memory/`；不觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages；未購買網域 / 未動 DNS / 未碰 AdSense·GA4·Blogger·GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`。§A boot baseline 為 read-only 驗證；§C 自動 checks 為 Dean 執行、Claude 未重跑；§D–§H 之 PASS / verified / downgraded 等結論為 Dean 人工判定與本 smoke 回報，Claude 未代替宣告；§J 結論同。§I readiness 判定沿用既有 stability readiness inventory 與 CLAUDE.md 分階段規範。

## See also

- `docs/20260708-phase1-p1-followup-closeout-inventory.md`（本次 smoke 之候選 1 觸發依據；§E 對應）
- `docs/20260708-phase1-second-manual-e2e-result.md`（第二次人工 E2E；P1-1 / P1-2 / P1-3 / P2-1 分級來源）
- `docs/20260708-phase1-second-manual-e2e-test-packet.md`（第二次 E2E 測試包 + 紀錄模板）
- `docs/20260708-blogger-draft-preview-runbook.md`（P1-2 runbook；§F overflow debug 對應本 smoke §E-2/§E-4）
- `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md`（P1-3 audit / 9 類假說 / 降級觸發條件）
- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（P1-2 盤點依據 / Option A/B/C 決策）
- `docs/20260708-phase1-stability-readiness-inventory.md`（Phase 1 穩定測試就緒盤點）
- `docs/20260702-phase1-manual-e2e-runbook.md`（第一次人工 E2E：github-site happy-path PASS）
- `src/views/admin/index.ejs`（P1-1 fix landed in commit `38a4e98`；本 smoke §D 實地驗證來源）
- `CLAUDE.md` §5（分階段）、§7（Blogger 發布 checklist）、§17（文章頁版型）、§23（發布狀態；draft 不得進正式 dist）、§26（package.json 指令）、§27（Claude Code 修改規則）、§28（MVP 必做）、§29（第一版不做）
