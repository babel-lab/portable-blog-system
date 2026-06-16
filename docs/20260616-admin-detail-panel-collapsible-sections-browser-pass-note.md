# ADMIN detail panel collapsible sections (R1) — browser-PASS note（docs-only backfill）

> Phase: `20260616-admin-detail-panel-collapsible-sections-browser-pass-note-docs-only-a`
> Date: 2026-06-16 17:45
> Type: docs-only / read-only backfill（只補 browser-PASS note；不實作；不改 src / details / summary / CSS / JS）
> Backfills: pm-24 `docs/20260616-admin-detail-panel-collapsible-sections-human-acceptance-record.md` §F（browser 人眼 acceptance＝PENDING user）
> Reviewed implementation: pm-23 `feat(admin): collapse detail panel sections`（commit `f89ad09`）

---

## A. Phase name

`20260616-admin-detail-panel-collapsible-sections-browser-pass-note-docs-only-a`

pm-24 之 rendered-artifact acceptance 已 PASS，但 §F「summary click 展開」「實際 layout 視覺」列為 **PENDING user**（Claude 未開瀏覽器）。本 phase 由 **user 完成 browser 人眼確認**後回填 browser-PASS note，並記錄一個 minor readability watch（非 blocker）。

---

## B. Baseline

- branch: `main`
- HEAD == origin/main == `df0c02f`（`docs(admin): accept detail panel collapsible sections`）
- working tree: clean / ahead-behind 0/0
- 本 phase docs-only：未碰 source / build；rendered-artifact 結論沿用 pm-24（baseline 未變）。

---

## C. User browser evidence

> 以下為 **user 親自於瀏覽器人眼檢查**之結果（user 提供截圖 + rendered HTML source，並以 ChatGPT 協助比對確認）。Claude 為 scribe，未自行開啟瀏覽器、未取得 screenshot；本節忠實記錄 user 回報內容。

- 檢查環境：local dev admin 頁面 `localhost:5173/admin/#posts`（`npm run dev`）。
- 展開 post row 後，**高頻 sections 仍直接可見**（不需額外點擊）：
  - Identity
  - Platform Routing
  - Readiness / Validation warnings
  - Governance signals
  - Aggregation summary
  - Completeness summary
- **低頻 sections 採 native disclosure（`<details>`/`<summary>`）**，summary 可展開 / 收合：
  - FB Sidecar Dry-run Editor — summary 展開 / 收合正常
  - Future write readiness checklist — summary 展開 / 收合正常
  - Source path — summary 展開 / 收合正常
- summary 展開後內容正常顯示，**無明顯 layout overlap 或 broken nesting**。
- 點擊 summary **未觀察到整篇 row 被誤收合**。
- Apply / Apply FB **仍維持 disabled / dry-run only**；未出現 write / save / apply 實際寫入行為。
- 無明顯顯示問題；disclosure triangle / title alignment 可接受。

> 註（scribe 補述，非 user 新觀察）：R1 共 4 個低頻區段，user 上述明列 **3 個**（FB Sidecar Dry-run Editor / Future write readiness checklist / Source path）。第 4 個 **sourceKey selector preview (read-only / dry-run)** 受 `<% if relatedLinks/otherLinks %>` guard，僅於有 related/other links 之 post 才 render（pm-24 rendered-artifact 確認＝2 posts collapsed by default），user 檢查之 row 未必含此區段，故未單獨列出；其收合行為已於 pm-24 rendered-artifact PASS。

---

## D. Confirmed PASS items

| 項目 | 來源 | 狀態 |
| --- | --- | --- |
| 高頻 sections 展開後直接可見（Identity / Platform Routing / Readiness+Validation / Governance / Aggregation / Completeness） | user browser | ✅ browser-confirmed |
| 低頻 FB Sidecar Dry-run Editor summary 展開 / 收合 | user browser | ✅ browser-confirmed |
| 低頻 Future write readiness checklist summary 展開 / 收合 | user browser | ✅ browser-confirmed |
| 低頻 Source path summary 展開 / 收合 | user browser | ✅ browser-confirmed |
| 低頻 sourceKey selector preview 預設收合 | pm-24 rendered-artifact（guard-gated；2 posts） | ✅ rendered-confirmed |
| summary 展開內容無 layout overlap / broken nesting | user browser | ✅ browser-confirmed |
| 點 summary 不誤收整 row | user browser | ✅ browser-confirmed |
| Apply / Apply FB 仍 disabled / dry-run only（無實際寫入） | user browser | ✅ browser-confirmed |
| disclosure triangle / title alignment 可接受 | user browser | ✅ browser-confirmed |
| `<details>`/`</details>`/`<summary>` 46/46/46 平衡、EJS leak 0、undefined/null leak 0、純 readability 無資料語意改變 | pm-24 rendered-artifact | ✅ carry-forward |

→ pm-24 §F「browser 人眼 acceptance＝PENDING user」之缺口**已補齊**。

---

## E. Minor readability watch（記錄 only，本段不修改）

- R1 PASS，**但 detail panel 仍然很長**。
- 特別是 **「Dry-run edit (no write)」區塊**（SEO dry-run editor）**仍直接展開且佔高較大**——此區段**不在** R1 範圍內（R1 只收合 FB editor / sourceKey / future-write / source-path 四個低頻區段；SEO「Dry-run edit (no write)」維持原狀直接展開）。
- 此為 **future readability candidate，非 R1 blocker**。
- **本 phase 不修改**：不調整 CSS / `<details>` / `<summary>` / dry-run UI；不因此進 R2。
- 未來如要處理：須另開獨立 readability 切片 phase（例如「將 SEO Dry-run edit 區段一併改 native `<details>` 收合」）+ user explicit approval；與本 browser-PASS note 不混做。

---

## F. Explicit non-goals（本 phase 不做）

- ❌ 不改 src / views / scripts / content / settings / package / dist / gh-pages / `.cache`。
- ❌ 不調整 `<details>` / `<summary>` / CSS / JS（含不收合 SEO「Dry-run edit」區塊）。
- ❌ 不進 R2 overview consolidation。
- ❌ 不新增 filter chip / count badge / summary-card warning 欄 / write path / prescription。
- ❌ 不 npm install / build / deploy / Blogger repost / merge / rebase / reset / amend / force push。

---

## G. Final verdict

**Browser PASS with minor watch.**

- R1（detail panel 4 低頻區段 native `<details>` 預設收合）**rendered-artifact（pm-24）+ browser 人眼（本 phase, user）皆 PASS**。
- 附帶一個 **minor readability watch**（detail panel 仍長，尤以 SEO「Dry-run edit (no write)」區塊佔高）——記為 future readability candidate，**非 blocker，本段不處理**。

---

## H. Recommended next phase

- 保守 idle freeze（R1 已 rendered + browser 雙重 PASS；readability 線可暫收尾於穩定現狀）。
- 或未來 readability 切片（各須獨立 phase + user explicit approval）：
  - 處理 minor watch — 將 SEO「Dry-run edit (no write)」區段改 native `<details>` 收合（單檔 `index.ejs`，NOT docs-only）。
  - 切片 R2 — 頁首 overview 整併（`.stats` 15-card vs Dashboard 6 surface-card；NOT docs-only）。

紅線：R2 / SEO dry-run 收合 / write path / filter chip / Posts-index 計數 badge / summary-card 補欄 / per-post prescription 一律獨立 phase + user explicit approval。
