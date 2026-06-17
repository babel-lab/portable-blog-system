# ADMIN Categories / Tags collapsible split — browser human-eye PASS record（docs-only）

> Phase: `20260617-am-admin-categories-tags-collapsible-split-browser-pass-record-docs-only-a`
> Date: 2026-06-17 10:30+
> Type: docs-only acceptance record（不改 source / view / scripts / loader / reporter / validator / content / settings / package / dist / gh-pages / `.cache`；不 build / deploy / repost）
> Scope: 記錄 commit `adea772`（`feat(admin): collapse categories and tags sections`）之 R4 Categories / Tags collapsible split browser human-eye PASS，收尾 R4 全鏈。R3（健康語彙 legend + Missing fields ×2 去重）+ R2（頁首 overview 整併）+ R5（nav 對齊 + inline-style 收斂）維持 deferred until explicit approval。

---

## A. Phase name

`20260617-am-admin-categories-tags-collapsible-split-browser-pass-record-docs-only-a`

承接：
- `20260617-admin-readability-r-series-next-pick-preanalysis-docs-only-a`（commit `441877a`；docs-only preanalysis；R4 列為第一順位）
- `20260617-night-admin-categories-tags-collapsible-split-implementation-a`（commit `adea772`；Phase R4 source landed；`src/views/admin/index.ejs` +40/−0）

---

## B. Baseline observed

| 項目 | 值 | 對照 expected |
|---|---|---|
| pwd | `/d/github/blog-new/portable-blog-system` | ✅ |
| branch | `main` | ✅ |
| HEAD | `adea772` | ✅ |
| origin/main | `adea772` | ✅ |
| HEAD == origin/main | ✅ | ✅ |
| ahead / behind | `0 / 0` | ✅ |
| latest subject | `feat(admin): collapse categories and tags sections` | ✅ |
| working tree | clean | ✅ |

→ Baseline 完全符合 expected。未 pull / merge / reset / rebase / amend / force-push。

---

## C. Commit under acceptance

| 項目 | 值 |
|---|---|
| commit | `adea772` |
| subject | `feat(admin): collapse categories and tags sections` |
| 變更檔 | `src/views/admin/index.ejs`（+40 / −0；純 additive，單檔） |
| 父 commit | `441877a`（`docs(admin): plan readability r-series next pick`） |

---

## D. Implementation scope summary

- **唯一變更檔** = `src/views/admin/index.ejs`（+40 / −0 純 additive）
- **Categories 群**（source L1712→1913）以原生 `<details open>` 包住：catTotals 列 + Per-category usage 表 + Uncategorized / Unknown category / Unused defined categories 三個 bucket
- **Tags 群**（source L1921→2122）以原生 `<details open>` 包住：Per-tag usage 表 + Untagged / Unknown tag / Unused defined tags 三個 bucket
- **保留在 `<details>` 外（高頻、永遠可見）**：section `<h2 id="categories">` + lede、governance docs cross-link aside、🏷️ Governance summary card、Categories/Tags registry surface-grid、「⏳ 仍未實作」section footer
- **預設 `open`**（保守策略）：資訊預設展開不被藏；使用者可手動點 summary 收合以縮短 section
- **summary 文案**只複述既有子標題語意（per-category/per-tag usage · uncategorized/untagged · unknown · unused），不引入第二套語意或新資料判斷
- **`<h3 id="tags">` 保留**於 Tags `<details>` 內供 nav `#tags` 錨點
- **極小隔離 JS**（檔尾新 `<script>` IIFE `openHashDetails()`）：`location.hash` 指向某 `<details>` 內元素時，自動展開祖先 `<details>`；監聽 `hashchange` + `DOMContentLoaded`；只讀 `location.hash` + 設 `details.open`，**不碰** filter / search / sort / detail-panel toggle 任何邏輯
- **不變更**：loader（`load-admin-posts.js`）/ validator（`validate-content.js`）/ reporter（`report-validation.js`）/ report ground truth / content / settings / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages

### D.1 程式化驗證 carry（自 implementation phase）

| 檢查 | 結果 |
|---|---|
| `node src/scripts/build-github.js --mode=dev` | exit 0；`wrote .cache/pages/admin/index.html`；無 EJS error |
| rendered `cat-tags-group` `<details>` | 2 |
| rendered summary 文案 | Categories 用量明細 / Tags 用量明細（各 1，文案正確） |
| rendered `id="tags"` | 1（anchor 保留） |
| rendered `<details>` / `</details>` / `<summary>` 平衡 | 59 / 59 / 59 |
| source `<details>` 元素配對 | 8 / 8（含 1323 行同行巢狀 frontmatter preview；HEAD 5 帶 class → 現 7，+2） |
| rendered EJS leak（`<%` / `%>`） | 0 |
| rendered `>undefined<` / `>null<` leak | 0 |
| governance summary card / ⏳ footer 在 details 外 | ✅（各 1，可見） |
| `git diff --check` | no whitespace errors |
| `check:admin-governance-aggregation` | 16 passed / 0 failed |
| `check:validation-report` | 14 passed / 0 failed |
| `check:admin-validation-consume` | 12 passed / 0 failed |

→ production-post warnings 維持 0；3 ADMIN smoke 全 carry baseline（無 data regression）。

---

## E. User browser human-eye PASS result

- **測試環境**：`npm run dev` → Chrome on Windows
- **測試 URL**：`http://localhost:5173/admin/`（另測上方 nav `Categories` / `Tags`）

| # | 項目 | 結果 |
|---|---|---|
| 1 | 重新開 admin 時 Categories 群與 Tags 群**預設展開** | ✅ PASS |
| 2 | Categories 群可手動展開 / 收合 | ✅ PASS |
| 3 | Tags 群可手動展開 / 收合 | ✅ PASS |
| 4 | 手動收合後點 nav `Categories` → 跳到 `Categories & Tags` top-level overview（`#categories`），**不**自動展開內層 Categories details | ✅ PASS（行為接受，見 §F） |
| 5 | 點 nav `Tags` → 跳到 Tags 區塊，且**自動展開 Tags details** | ✅ PASS |
| 6 | Chrome console 無新錯誤 | ✅ PASS |
| 7 | R4 核心目標：Categories / Tags 已切成可收合區塊，預設展開不讓資訊消失，手動收合後可降低頁面長度 | ✅ PASS |

---

## F. Acceptance decision

- ✅ **R4 core goal PASS**：Categories / Tags top-level section 已切成兩個清楚的 collapsible 區塊；預設展開（資訊不被藏）；可手動收合降低頁面長度。
- ✅ **Accepted anchor 行為**：
  - `#categories`（nav `Categories`）target = top-level section overview（`<h2 id="categories">` 開頭總覽區塊）；**不要求**自動展開內層 Categories details —— user 明示接受（Categories nav 指向 top-level section，跳到總覽即可）。
  - `#tags`（nav `Tags`）target = Tags `<details>` 內之 `<h3 id="tags">` 錨點；由 `openHashDetails()` **自動展開** Tags details —— 必要且已 PASS。
- ✅ **Console PASS**：user 確認 Chrome console 無新錯誤。
- ✅ **No regression**：R1 detail-panel 低頻收合區 + SEO dry-run 收合行為未受影響（implementation phase 程式化 carry + user 視覺確認無破版）。

→ 本 acceptance 同時涵蓋 human visual + user-confirmed console。

---

## G. Red lines confirmed

本 docs-only phase 未且不得違反：
- ❌ 未改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `package.json` / `package-lock.json` / `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache/`
- ❌ 未啟動 write path（Admin Apply / Save / Auto-fix / admin-write-cli / middleware / FB sidecar 真實寫入）
- ❌ 未碰 validator `--report-json`（動 ground truth）
- ❌ 未動 loader cross-post aggregation migration
- ❌ 未 `npm install` / build / deploy / push gh-pages / Blogger repost / browser implementation change
- ❌ 未做 per-post prescription / Posts-index validator 計數 badge / summary-card 補 validator 欄 / filter chip 跳轉（各須獨立 phase + approval）
- ❌ 未推進 R2（頁首 overview 整併）/ R3（健康語彙 legend + Missing fields ×2 去重）/ R5（nav 對齊 + inline-style 收斂）
- ❌ 未 merge / rebase / reset / amend / cherry-pick / force-push / 跳 hooks / bypass signing
- ❌ 未對 Phase 1 final 宣告做任何降級或重新封存
- ❌ 未啟動 reverse UTM deploy（pm-26 gate 維持 BLOCKED）
- ❌ 未觸碰 Blogger / GA4 / AdSense / Google Drive / Search Console 後台
- ❌ 未壓縮 / 重排 CLAUDE.md；未改 `MEMORY.md` / `memory/`

---

## H. Non-actions（本 phase 實際未做）

docs-only acceptance record —— 唯一 mutation = 本記錄 doc（+ 依本 phase 指示之 commit / push）。未改任何 source / view / scripts / loader / validator / reporter / content / settings / package / dist / gh-pages / `.cache`；未做任何 ADMIN UI / CSS / 摺疊 / 重排 source 變更；未 build / deploy；未跑 npm validation（baseline carry-forward；未碰 source）。

---

## I. Next candidates（待 user explicit approval；本 phase 不主動執行）

| 候選 | 類型 | 說明 |
|---|---|---|
| **R3** 健康語彙 legend + Missing fields ×2 去重 | preanalysis 或 implementation | R-series 第二順位（per `docs/20260617-admin-readability-r-series-next-pick-preanalysis.md` §H）；純 presentation，含 legend 措辭設計決策 + dedup 條件重排；建議先小 preanalysis 確認 legend 文案 + dedup 前後條件對照，再 implementation |
| **idle freeze** | — | R4 收尾後，ADMIN readability 線可暫進 idle freeze；BLOG 重心可回 content / publishing / 觀察線 |
| **其他 user-selected 方向** | — | R2 / R5 / 內容線 / 觀察線等，由 user 主動指定 |

---

## J. STOP

R4 全鏈完成全閉環：preanalysis（`441877a`，R4 第一順位）→ implementation（`adea772`）→ render-preflight（程式化 grep + 3 smoke carry）→ browser human-eye PASS + user console PASS（本記錄）。

→ **不主動推進 R3 / R2 / R5 或任何 implementation；等待 user explicit approval。**

---

（本文件結束）
