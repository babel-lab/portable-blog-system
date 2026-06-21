# ADMIN post-K7/K8/K9/R4 read-only state browser acceptance checklist（docs-only）

- **Phase**：`20260621-admin-post-k7-k8-k9-r4-readonly-state-browser-acceptance-checklist-docs-only-a`
- **Date**：2026-06-21（Asia/Taipei；evening, 21:22+）
- **Type**：**docs-only checklist**（唯一 mutation = 本檔新增；不改 source / view / scripts / loader / reporter / validator / content / settings / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages / `.cache`；不 build / dev server / deploy / Blogger repost；不 admin write / safe-write / admin-write-cli / `--apply` / `dryRun:false`；不登入 GA4 / AdSense / Blogger / Search Console / Google Drive；不重開 K7/K8/K9/R4/R3/R1/SEO-dryrun；不建立 browser PASS evidence record）
- **Verdict**：**CHECKLIST ONLY — no browser run executed in this phase；no PASS / FAIL claimed**

---

## 1. Purpose

| 項 | 值 |
| --- | --- |
| 本檔屬性 | **post-K7 / K8 / K9 / R4 read-only browser acceptance checklist**；供 Dean 之後在本機 Chrome / localhost dev server 人工逐項檢查目前 ADMIN 已關閉項目之 browser-observable 狀態 |
| 本檔屬性 | 單檔；無 source 動作；無 backend 動作；無 dev server 動作；無 build / deploy / repost |
| 本檔**不**屬性 | ❌ **不是 browser PASS evidence record**（PASS record 須另開 evidence phase；見 §7） |
| 本檔**不**屬性 | ❌ 不是 source implementation phase；不寫 source；不啟動 K7/K8/K9/R4 / R3 / R1 / SEO-dryrun 重做；不啟動候選 B / C / D source slice |
| 本檔**不**屬性 | ❌ 不是 Admin write path 開啟 / safe-write / `admin-write-cli` / `--apply` / `dryRun:false` / Apply button 啟用 |
| 本檔**不**屬性 | ❌ 不是 Blogger 後台 / GA4 後台 / AdSense 後台 / Search Console / Google Drive 任何驗證；不登入；不打 GA4 Admin API / Reporting API |
| 本檔**不**屬性 | ❌ 不是 P2 / P3 metadata backfill / Blogger repost / reverse UTM deploy / live URL fetch |
| 本檔**不**屬性 | ❌ 不取代 Phase 1 final 宣告；不降級；不重新封存 |
| 本檔**不**屬性 | ❌ 不 claim human-eye PASS（本 phase 未開瀏覽器、未跑 dev server、未操作 UI；無 PASS / FAIL 結論） |
| 適用對象 | Dean（之後若想做一次性整體 read-only 確認時可逐項對齊本檔執行） |
| 適用時機 | K7 / K8 / K9 / R4 / R3 / R1 / SEO-dryrun / validator badge / validator filter 全 closed 後，Dean 想要一份單一視圖把所有 closed 切片之 browser-observable 狀態羅列在一起 |

本 checklist **單檔讀懂目前 ADMIN UI 已關閉項目之 browser-observable 狀態**；**不**取代 K7 / K8 / K9 / R4 / R3 / R1 / SEO-dryrun 既有 browser PASS records（見 §9 cross-links）。

---

## 2. Baseline

| 項 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `72f2a2a` |
| origin/main | `72f2a2a` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree（pre-checklist write） | clean |
| latest subject | `docs(admin): plan next readability slice` |

> **使用本 checklist 前之 baseline 紀律**：
> 1. 若日後 baseline 已推進（HEAD != `72f2a2a`），請**先**重新跑 baseline verify（`git rev-parse --short HEAD` / `git status --short` / `git rev-list --left-right --count origin/main...HEAD`），確認 K7 / K8 / K9 / R4 / R3 / R1 / SEO-dryrun 之 source commit 仍包含於 HEAD 之祖先鏈中（可用 `git log --oneline | grep` 查 commit `efaa774` / `0a89983` / `50b1536` / `adea772` / `63057af` / `b0a21ad` / `7e4d9cf` / `c7b36ee` 仍可達）。
> 2. 若任一已 closed source commit 已被 revert / squash / rebase 出 HEAD 之祖先鏈，**請不要**用本 checklist 作 PASS evidence；該檔失效，須先重新評估各 closed item 之狀態。
> 3. 本 checklist 不負責偵測 baseline 漂移；偵測責任在 Dean / 操作者。

---

## 3. Scope（本 checklist 覆蓋之已關閉 ADMIN items）

> 引用 source-of-truth 為各 item 已 land 之 browser PASS record（§9 cross-links）；本 checklist **不**重新驗證、**不**重新計算 detail 之 ground truth。

| Item | 範圍 | 已 closed source commit | 已 land browser PASS record |
| --- | --- | --- | --- |
| **R1** | detail panel 4 個低頻 `<details>` 區段（FB Sidecar Dry-run Editor / sourceKey selector preview / Future write readiness checklist / Source path）；default-open 保守策略 | `f89ad09`→`3628fcb` | `docs/20260616-admin-detail-panel-collapsible-sections-browser-pass-note.md` / `...-human-acceptance-record.md` |
| **SEO dry-run** | SEO「Dry-run edit (no write)」`<details>`；**default-collapsed**（mirror R1 / FB sidecar pattern） | `b0a21ad`→`48baabf` | `docs/20260617-admin-seo-dryrun-collapse-browser-pass-record.md` |
| **R3** | 1 處 page-level「健康訊號讀法（read-only）」legend（Posts 表格上方；generatedAt banner 後）+ Missing fields 併入 Completeness summary（移除獨立 Missing fields section）；3 套健康語彙不混淆（Validation warnings = validator ground truth；Completeness/Missing fields = admin loader derived hint；Governance signals = taxonomy derived hint） | `63057af` | `docs/20260617-admin-r3-health-legend-missing-fields-dedup-browser-pass-record.md` |
| **R4** | Categories 群 `<details open>` 切分 + Tags 群 `<details open>` 切分；`id="tags"` 保留於 Tags `<details>` 內；極小隔離 JS `openHashDetails()` 監聽 hashchange + DOMContentLoaded（only reads `location.hash` + sets `details.open`） | `adea772` | `docs/20260617-admin-categories-tags-collapsible-split-browser-pass-record.md` |
| **Validator warning badge** | Posts list 之 5 態 read-only badge（`warn ✓` / `warn N` / `err M warn N` / `warn n/a` / `warn ?`；與 `gov ✓` / `gov: N` governance badge **並排**不混；純消費 `p.validationReport.state`） | `7e4d9cf` | `docs/20260617-admin-validator-warning-badge-browser-pass-record.md` |
| **Validator state filter** | Posts list filter `<select>` 之 `<optgroup label="validation">` + 4 個 read-only option（`issues` / `clean` / `excluded` / `no report`）；`<tr.post-row>` 加 `data-validation-state`；filter dispatcher `case 'validation':` 純 dataset 比對 | `c7b36ee` | `docs/20260617-admin-validator-state-filter-browser-pass-record.md` |
| **K7** | Static payload preview 之 2 顆 copy buttons（`Copy payload JSON` / `Copy command`）；**clipboard-only**（無 fetch / XHR / form-submit）；warning「複製不構成核准 / Copy does not approve」；按鈕點按後顯示 `已複製 (Copied)` status；clipboard 內容固定為 dry-run preview（`dryRun:true`；無 `--apply`；無 `dryRun:false`） | `efaa774`→`c443d31` | `docs/20260618-am-admin-k7-copy-buttons-browser-pass-record.md` |
| **K8** | `Show Dry-run Diff` 後 `payload-preview-field` selector 自動跟隨第一個 changed field（deterministic 欄位順序：`description` → `searchDescription` → `titleEn` → `coverAlt`）；no-change（`0/4`）時 selector **不動**；copy buttons 僅在 `Compute payload preview` 後 enable | `0a89983`→`d311108` | `docs/20260618-admin-k8-field-auto-switch-browser-pass-record.md` |
| **K9** | Multi-click determinism smoke：相同 selected field + 相同 input 下，多次點 `Compute payload preview` 所產生之 Payload JSON 與 Command preview **逐字一致** | （docs-only smoke；無 source change）`50b1536` | `docs/20260618-admin-k9-multiclick-determinism-browser-pass-record.md` |

> Apply button 之狀態（**永久 disabled**；K7 / K8 / K9 / R4 全程未改變該屬性）為 §5 之 trans-item read-only 檢查（不重複列）。

---

## 4. Browser setup checklist（給 Dean 人工操作）

> 以下為**操作前準備**；本 phase 不執行；若 Dean 之後想跑，可依下列建議準備。

| # | 步驟 | 備註 |
| --- | --- | --- |
| 1 | 開 PowerShell / VS Code terminal at `D:\github\blog-new\portable-blog-system` | repo 本地 working copy |
| 2 | 跑 baseline verify（`git rev-parse --short HEAD` / `git status --short` / `git rev-list --left-right --count origin/main...HEAD`） | 期望：`HEAD == origin/main`；ahead/behind = 0/0；clean。若不符合，**停止**並重新評估 |
| 3 | 啟動 dev server：`npm run dev`（會 auto-trigger `predev` → `node src/scripts/build-github.js --mode=dev` → 寫 `.cache/pages/admin/index.html`） | port 預設 5173；若有 leftover Node 占用，Vite 自動換 5174 / 5175。**本 phase 不啟動 dev server。** |
| 4 | 用 Chrome 開 `http://localhost:<port>/admin/#posts`；建議同時開 DevTools | port 以 dev server 啟動時實際 console output 為準 |
| 5 | 不登入任何 backend；不操作 Blogger / GA4 / AdSense / Search Console / Google Drive | ADMIN 為 dev-mode-only；不打 backend；noindex；不進 prod build / sitemap / deploy |
| 6 | 不按 Apply 按鈕（Apply 預期永久 disabled）；不於 admin html 觸發任何 `--apply` / `dryRun:false` / safe-write / admin-write-cli | 本 checklist 為 **read-only browser acceptance** |
| 7 | 若 dev server 未開或 Dean 不打算開，請**保留**本 checklist 為 reference doc；本 phase 不要求啟動 dev server | 本 phase 不開 dev server，不執行 §5 checklist；§5 為「之後若 Dean 自願人工操作」之 reference |

---

## 5. Acceptance checklist table（read-only browser observation；本 phase 不執行）

> **使用方式**：Dean 之後若決定跑，依本表逐項在 Chrome / `localhost:<port>/admin/#posts` 上人工檢查；於 `PASS / FAIL / NOTE` 欄填 observation；於 `Evidence suggestion` 欄填截圖檔名 / 短筆記。**本 phase 不在此填 PASS / FAIL；本 checklist 不是 PASS record**（PASS record 須另開 evidence phase，見 §7）。

| # | Item id | Area | What to observe | Expected result | PASS / FAIL / NOTE | Evidence suggestion |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | R1-1 | detail panel 低頻區 | 點任一 post row 展開 detail panel，捲到 FB Sidecar Dry-run Editor / sourceKey selector preview / Future write readiness checklist / Source path 4 區段 | 4 區段各為原生 `<details>`（有 disclosure triangle）；預設展開（`open` 屬性）；可手動點 summary 收合 / 再展開；無破版 | （待 Dean 填寫） | screenshot of detail panel showing 4 disclosure triangles |
| 2 | SEO-1 | detail panel SEO dry-run | 同一 detail panel 內捲到「Dry-run edit (no write)」section | 為原生 `<details>`；**預設 collapsed**（與 R1 不同，mirror R1 / FB sidecar pattern 但採 default-closed）；點 summary 後展開可見 validator preview / Start Edit / Cancel / 4-field form / disabled Apply stub；黃色 dashed border 完整 | （待 Dean 填寫） | screenshot of collapsed + expanded state |
| 3 | R3-1 | Posts page legend | 重開 admin Posts page，捲到表格上方 generatedAt banner 之**後**、posts table 之**前** | 有 **1 處** page-level「健康訊號讀法（read-only）」legend（`.admin-governance-note`）；3 條清楚區分 `Validation warnings`（validator ground truth）/ `Completeness / Missing fields`（admin loader derived hint）/ `Governance signals`（taxonomy derived hint）；無「自動修正」/「應改為 X」prescription 文案；legend 在 Posts 表格之 page level，**不**在每篇 detail panel 重複 11 次 | （待 Dean 填寫） | screenshot of legend block |
| 4 | R3-2 | detail panel completeness | 點任一 post row 展開 detail panel，捲到 Completeness summary 區段 | 「缺漏 / 建議補齊欄位…」+ b-missing badges 併入 Completeness summary 同一 `.detail-section`（missing 分支）或 b-ok「所有檢查欄位齊全」（齊全分支）；**無**獨立的 `<h3>Missing fields</h3>` section | （待 Dean 填寫） | screenshot of Completeness summary |
| 5 | R4-1 | Categories section split | 捲到 Categories & Tags top-level section（`<h2 id="categories">`） | Categories 群為一個 `<details open>` 區塊，包住 catTotals 列 + Per-category usage 表 + Uncategorized / Unknown category / Unused defined categories 三個 bucket；預設展開；可手動點 summary 收合 / 再展開；governance summary card、registry surface-grid、「⏳ 仍未實作」footer 仍**在 `<details>` 外**保持可見 | （待 Dean 填寫） | screenshot before / after manual collapse |
| 6 | R4-2 | Tags section split | 同一 section 內捲到 Tags 群（`<h3 id="tags">`） | Tags 群為一個 `<details open>` 區塊，包住 Per-tag usage 表 + Untagged / Unknown tag / Unused defined tags 三個 bucket；預設展開；可手動點 summary 收合 / 再展開 | （待 Dean 填寫） | screenshot before / after manual collapse |
| 7 | R4-3 | nav `Tags` auto-open | 手動收合 Tags details；接著點 top nav 的 `Tags` | 跳到 Tags 區塊；`openHashDetails()` 自動展開 Tags details；其他 `<details>` **不被**強制展開（auto-open 只影響含 `location.hash` target 之 ancestor `<details>`） | （待 Dean 填寫） | short note of behavior |
| 8 | R4-4 | nav `Categories` anchor | 手動收合 Categories details；接著點 top nav 的 `Categories` | 跳到 `<h2 id="categories">` top-level section overview（即 Categories & Tags 總覽區塊）；**不要求**自動展開內層 Categories details（accepted anchor 行為，per R4 browser PASS record §F） | （待 Dean 填寫） | short note of behavior |
| 9 | VAL-BADGE-1 | Posts list validator warning badge | 觀察 Posts list Completeness 欄 | 每 row 一個 validator warning badge；應屬 5 態之一：`warn ✓`（clean）/ `warn N`（matched + warnings）/ `err M warn N`（matched + errors）/ `warn n/a`（status-excluded：draft / archived）/ `warn ?`（no-report；reporter cache 未產生）；`warn def.` 舊 placeholder 不應出現；governance `gov ✓` / `gov: N` badge 並排存在且未被取代 | （待 Dean 填寫） | screenshot of one row's badges |
| 10 | VAL-FILTER-1 | Posts list filter optgroup | 點 Posts list filter `<select>`，捲到最後一組 `<optgroup label="validation">` | 4 個 option 可見：`validation: issues` / `validation: clean` / `validation: excluded` / `validation: no report`；每個都是 read-only filter；切換任一 option 不會 trigger 任何 write request | （待 Dean 填寫） | screenshot of select dropdown open |
| 11 | VAL-FILTER-2 | filter switch behavior | 逐一切換 4 個 validation option；最後切回 `all` | `clean` 應篩出 ready/published 且 0 warnings 之 rows（baseline 8）；`excluded` 應篩出 draft/archived rows（baseline 3）；`issues` 與 `no report` 在 production baseline 下應為 0 row + empty state；`all` 應回到全部 row（baseline 11）；切換期間表格不破版；console 無新 error | （待 Dean 填寫） | screenshot of each filter state |
| 12 | K7-1 | static payload preview copy buttons exist | 在 detail panel 內，按 `Show Dry-run Diff`（任一已可 compute 的欄位），接著按 `Compute payload preview` | static payload preview block 可見；2 顆 copy buttons 可見：`Copy payload JSON` 與 `Copy command`；按鈕僅在 Compute 後 enable（K8 確認） | （待 Dean 填寫） | screenshot of payload preview block |
| 13 | K7-2 | clipboard contents are dry-run only | 點 `Copy payload JSON`；切到 notepad / VS Code 貼上；點 `Copy command`；再貼上 | clipboard 1：dry-run preview JSON，含 `"dryRun": true`；**無** `--apply`；**無** `dryRun:false`。clipboard 2：固定字串 `node src/scripts/admin-write-cli.js --payload=<temp.json>`；**無** `--apply` | （待 Dean 填寫） | paste of clipboard contents to short note |
| 14 | K7-3 | warning + status visible | 觀察 copy buttons 附近 | UI 顯示 warning「複製不構成核准 / Copy does not approve · 所複製內容恆為 dry-run preview（dryRun:true；無 --apply；無 dryRun:false）。」；點按鈕後按鈕顯示 `已複製 (Copied)` 狀態 | （待 Dean 填寫） | screenshot |
| 15 | K7-4 | no network request on copy | DevTools Network 清空 / 錄製中；點兩顆 copy 按鈕各一次 | 點 copy buttons **未產生新 request**（無 fetch / XHR / payload upload / Blogger / GitHub / API write） | （待 Dean 填寫） | screenshot of empty Network tab |
| 16 | K8-1 | field auto-follow on single-field change | 在 dry-run editor 改某 1 欄（例：改 `coverAlt` 之 newValue）；點 `Show Dry-run Diff` | changed count 顯示 `1/4`；`payload-preview-field` selector 自動切到 `coverAlt`；其他 3 欄未變動 | （待 Dean 填寫） | screenshot of editor + selector |
| 17 | K8-2 | field auto-follow on multi-field change | 改 2 欄以上（例：`description` + `titleEn`）；點 `Show Dry-run Diff` | changed count 顯示對應數字（如 `2/4`）；selector 自動切到 **第一個** changed field，依固定順序 `description` → `searchDescription` → `titleEn` → `coverAlt` 解析；多欄編輯下實測案例：`description` + `titleEn` → selector landed on `description` | （待 Dean 填寫） | screenshot of editor + selector |
| 18 | K8-3 | no-change leaves selector stable | 把所有欄位 newValue 還原成 oldValue；點 `Show Dry-run Diff` | changed count 顯示 `0/4`；selector **不動**（K8 minimal conservative：no-change 不切） | （待 Dean 填寫） | screenshot |
| 19 | K9-1 | multi-click determinism | 選某 field + 某 input 值；連續點 `Compute payload preview` 3 次；每次貼 Payload JSON 與 Command preview 到 notepad 比對 | 3 次 Payload JSON **逐字一致**；3 次 Command preview **逐字一致**；payload 持續 `"dryRun": true`；command 持續無 `--apply`；selected field / newValue 期間不漂移 | （待 Dean 填寫） | 3 paste snippets to short note |
| 20 | TRANS-1 | Apply button disabled | 全程觀察 dry-run editor 之 Apply 按鈕（若存在） | Apply button **disabled**（K7 / K8 / K9 / R4 全程未啟用；write path 為 dormant） | （待 Dean 填寫） | screenshot |
| 21 | TRANS-2 | no payload file / no CLI invoked by readonly interactions | 完成 §5.1–§5.20 全部 readonly 操作後，在 terminal 跑 `git status --short --untracked-files=all` 與 `git ls-files --others --exclude-standard` | 兩條指令皆**無輸出**；repo 維持 clean；無新 payload 檔案產生；無 admin-write-cli 自動執行；無 backend / Blogger / GitHub write request（per §5.15） | （待 Dean 填寫） | terminal output snippet |

> ⚠️ **wording 約束（嚴守）**：item #21 之 `git status` / `git ls-files` 結果僅代表「**未觀察到新產生之 repo payload 輸出檔**」，**不**構成 whole-machine / production filesystem proof（mirror K7 browser PASS record §5 約束）。

---

## 6. Non-goals（本 checklist 之 phase 本身）

本 phase 為 docs-only checklist；明確**不**：

- ❌ 重開 K7 / K8 / K9 / R4 / R3 / R1 / SEO-dryrun / validator badge / validator filter（皆 closed；source 不動）
- ❌ 建立 browser PASS evidence record（PASS record 須另開 evidence phase，見 §7）
- ❌ 修 UI（無 source / view / scripts / CSS / JS 變更）
- ❌ 改 source / loader / validator / reporter / content / settings / package / lockfile / vite.config.js / dist / dist-blogger / dist-promotion / gh-pages / `.cache`
- ❌ 改 Admin write path（Apply 維持 dormant；middleware / `admin-write-cli` 行為不變；不引入 `--apply` / `dryRun:false`；不引入 safe-write）
- ❌ 驗證 GA4 / AdSense / Blogger / Search Console / Google Drive **live backend**（不登入；不打 GA4 Admin API / Reporting API；不 fetch Blogger live URL；不打 Blogger / GitHub publish API）
- ❌ 做 P2 live repost / P3 metadata backfill / live URL fetch / `bloggerPostId` / `publishedAt` 推導
- ❌ 觸碰 commerce registry（不動 `commerce-links.json` / `affiliate-networks.json` / candidate seed / merchantKey / networkKey / linkId）
- ❌ 啟動 reverse UTM deploy（pm-26 gate 維持 BLOCKED）
- ❌ 啟動 FB sidecar 真實寫入（維持 dormant；`docs/fb-sidecar-write-preflight-decision.md` §7 之 8 項 preflight 仍未完成）
- ❌ Phase 1 final 宣告之降級或重新封存
- ❌ 把巨型 ledger 又寫回 CLAUDE.md（per §3a 紀律規則）
- ❌ 改 CLAUDE.md / MEMORY.md / `memory/`
- ❌ npm install / 動 dependencies / lockfile / amend / rebase / merge / cherry-pick / force-push / 跳 hooks / bypass signing

---

## 7. Evidence packet guidance for a future evidence phase

> 若 Dean 之後**真的**照 §5 checklist 跑完，請**另開**一個獨立的 docs-only browser-PASS evidence record phase；不要在本檔上「就地」寫 PASS / FAIL（本檔不是 PASS record；要保持 checklist / evidence record 分離）。

該 evidence phase 之最低 metadata：

| 欄位 | 描述 |
| --- | --- |
| Date / time | 例：`2026-06-22 10:30+`（Asia/Taipei） |
| Baseline HEAD | 跑 evidence 當下之 `git rev-parse --short HEAD`；若已偏離本 checklist baseline `72f2a2a`，請另記錄並重新評估各 closed item 是否仍含於 HEAD 之祖先鏈 |
| Browser / OS | 例：`Chrome on Windows 11`；DevTools open / closed |
| Tested URL | 例：`http://localhost:5173/admin/#posts`（port 以實際為準） |
| Per-item observation | 對 §5 之 #1–#21 逐項：`PASS` / `FAIL` / `NOTE`；建議附 1 張 screenshot 或 1 段短 paste 證據 |
| Console state | 若 console 有 noise（例 browser extension `ObjectMultiplex … contentscript.js`），如實記錄為「extension/content-script noise; no observed admin app-owned error」；勿宣稱 `console completely clean`（mirror R3 browser PASS record §F caveat） |
| Network state | 對 K7-4 / TRANS-2 提供 DevTools Network 截圖或短註；勿宣稱超出 repo / browser-observable 範圍之 filesystem proof |
| Filesystem state | TRANS-2 之 `git status` / `git ls-files` 輸出（per §5 wording 約束：repo-level，**非** whole-machine） |
| Failures | 任何 #1–#21 FAIL 須**另開**獨立 source preflight；**不**得在 evidence record 內默默 fix；不得在 evidence phase 改 source；不得在 evidence phase 啟動 K7/K8/K9/R4 重做 |
| Next action | evidence phase 自身之 STOP / next candidates；不擴 scope |

該 evidence phase 之輸出格式建議 mirror 既有 browser PASS records：

- `docs/20260617-admin-categories-tags-collapsible-split-browser-pass-record.md`（R4 模板）
- `docs/20260617-admin-r3-health-legend-missing-fields-dedup-browser-pass-record.md`（R3 + console caveat 模板）
- `docs/20260618-am-admin-k7-copy-buttons-browser-pass-record.md`（K7 + filesystem wording 模板）
- `docs/20260618-admin-k8-field-auto-switch-browser-pass-record.md`（K8 短模板）
- `docs/20260618-admin-k9-multiclick-determinism-browser-pass-record.md`（K9 短模板）

---

## 8. Acceptance criteria（本 checklist 之 phase 本身）

### 8.1 PASS 條件

1. baseline verify observed 與本 phase prompt §Baseline verify 一致（HEAD = origin/main = `72f2a2a`；clean；0/0；latest subject = `docs(admin): plan next readability slice`）
2. 本檔（`docs/20260621-admin-post-k7-k8-k9-r4-readonly-state-browser-acceptance-checklist.md`）新增成功
3. 內容涵蓋 §1–§9（Purpose / Baseline / Scope / Browser setup / Acceptance checklist table / Non-goals / Evidence guidance / Acceptance criteria / Cross-links / Next phase options）
4. 本檔明確標示**不是 PASS record**（§1 / §6）
5. §5 checklist 覆蓋 K7 / K8 / K9 / R4 / R3 / R1 / SEO-dryrun / validator badge / validator filter / Apply disabled / no payload file 等 trans-item 紅線
6. 無 source / view / scripts / loader / reporter / validator / content / settings / package / lockfile / vite.config.js / dist / dist-blogger / dist-promotion / gh-pages / `.cache` mutation
7. 無 build / dev server / deploy / Blogger repost / backend / Admin write / safe-write / admin-write-cli / `--apply` / `dryRun:false` / Apply 啟用
8. 無 GA4 / AdSense / Blogger / Search Console / Google Drive 登入 / API call
9. K7 / K8 / K9 / R4 / R3 / R1 / SEO-dryrun / validator badge / validator filter 之 closed 狀態**不**被改寫
10. 不取代 Phase 1 final 宣告；不降級；不重新封存
11. 不建立 browser PASS evidence record；不 claim human-eye PASS
12. commit + push 成功；post-push working tree clean；ahead/behind = 0/0

### 8.2 FAIL 條件

任一發生 → FAIL：

- baseline verify 不符 → 立即停止；不修正；不 commit
- 本檔誤觸 `src/` / `content/` / `settings/` / `package.json` / lockfile / dist / `.cache`
- 本檔含完整 `measurementId`（非 masked tail4）/ AdSense 真實 client / slot / affiliate token / Forms responses / 猜測之 Blogger `postId` / `publishedAt`
- 本檔誤推薦「立即啟動 R2 / R5b / per-post prescription / Admin write / browser write / E1 / E2 / E3 / P3 metadata backfill / P2 live repost」
- 本檔重開 K7 / K8 / K9 / R4 / R3 / R1 / SEO-dryrun / validator badge / validator filter
- 本檔取代 Phase 1 final 宣告 / 降級 / 重新封存
- 本檔 claim browser PASS / human-eye PASS（本 phase 未跑 browser，不得 claim）
- 本檔建立 browser PASS evidence record（屬下一獨立 phase；本 phase 不做）
- 本檔 claim live verification / Blogger live URL fetch / GA4 / AdSense backend 確認
- 本檔改 CLAUDE.md / MEMORY.md / `memory/`
- 本檔改 `src/views/admin/index.ejs`（read-only inspection 允許，修改禁止）

---

## 9. Cross-links

- `docs/20260621-admin-next-readability-slice-preflight.md`（本檔之前置 preflight；候選 A 推薦來源）
- `docs/20260621-blog-system-cross-line-checkpoint.md`（cross-line checkpoint；at `0816044`）
- R1：
  - `docs/20260616-admin-detail-panel-collapsible-sections-browser-pass-note.md`
  - `docs/20260616-admin-detail-panel-collapsible-sections-human-acceptance-record.md`
- SEO dry-run：
  - `docs/20260617-admin-seo-dryrun-collapse-browser-pass-record.md`
- R3：
  - `docs/20260617-admin-r3-health-legend-missing-fields-dedup-preanalysis.md`
  - `docs/20260617-admin-r3-health-legend-missing-fields-dedup-browser-pass-record.md`
- R4：
  - `docs/20260617-admin-categories-tags-collapsible-split-browser-pass-record.md`
  - `docs/20260617-admin-readability-r-series-next-pick-preanalysis.md`
- Validator badge / filter：
  - `docs/20260617-admin-validator-count-badge-filter-chip-preanalysis.md`
  - `docs/20260617-admin-validator-warning-badge-browser-pass-record.md`
  - `docs/20260617-admin-validator-state-filter-browser-pass-record.md`
- K7：
  - `docs/20260618-am-admin-k7-copy-buttons-acceptance-record.md`
  - `docs/20260618-am-admin-k7-copy-buttons-browser-pass-record.md`
- K8：
  - `docs/20260618-admin-k8-field-auto-switch-browser-pass-record.md`
- K9：
  - `docs/20260618-admin-k9-multiclick-determinism-browser-pass-record.md`
- ADMIN stage：
  - `docs/20260616-night-admin-stage-progress-checkpoint-and-next-action-map.md`
  - `docs/20260616-admin-readability-ia-refinement-preanalysis.md`（pm-22；R1–R5 切片序列原始 source-of-truth）
- CLAUDE.md §3a Core operating rules / §3a Red lines / §3a ADMIN current state / §28 / §29 / §30

---

## 10. Next phase options

> 各候選**須 Dean explicit approval 才啟動**；Claude 端**不自動執行**。每候選之 acceptance criteria 為 draft；實際 implementation phase 須另開獨立 preanalysis + acceptance。

| 候選 | 類型 | 啟動條件 |
| --- | --- | --- |
| **Optional browser evidence record（docs-only）** | docs-only evidence phase | Dean 之後**真的**照 §5 checklist 跑完瀏覽器後啟動；產出 `docs/2026XXXX-admin-post-k7-k8-k9-r4-readonly-state-browser-evidence-record.md`，mirror §7 metadata；本 checklist phase **不**主動啟動該 evidence phase |
| **Candidate B — FB Post detail low-frequency metadata collapsible（source preflight / implementation）** | source change（單檔 `src/views/admin/index.ejs` additive） | Dean explicit approval；先獨立 preanalysis；mirror R4 / R1 pattern；單檔；low risk；per `docs/20260621-admin-next-readability-slice-preflight.md` §4.2 |
| **Candidate E — Idle freeze（noop）** | docs-only or pure noop | 若 Dean 不想推進任何 implementation；對齊 CLAUDE.md §3a「ADMIN 線目前 idle freeze。後續 session 不主動推進」 |
| **其他 user-selected 方向** | — | 內容線 / 觀察線（AdSense / GA4）/ Blogger P2 / P3 repost packet / reverse UTM deploy / FB sidecar preflight 等；皆須 user 主動指定 |

---

（本文件結束）
