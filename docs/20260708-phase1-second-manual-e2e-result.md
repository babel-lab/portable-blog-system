# Phase 1 第二次人工 E2E 測試結果紀錄（docs-only result record）

- 建立日期：2026-07-08（Asia/Taipei）
- 類型：docs-only **result record**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md`）。
- 測試包來源：`docs/20260708-phase1-second-manual-e2e-test-packet.md`（§D checklist / §E 紀錄表 / §F 分級）。
- 執行者：Dean（人工）。Claude 僅做 read-only boot verification + readiness checks + 記錄本 doc；**未**代替宣告 PASS、**未** build / deploy / 登入任何後台。
- 前一次人工 E2E：`docs/20260702-phase1-manual-e2e-runbook.md`（2026-07-02，github-site happy-path PASS）。本次為**第二次**，補齊 blogger-site draft-preview 鏈路。

---

## A. 測試前 baseline（read-only 驗證，Claude 執行）

| Repo | branch | HEAD | 對照 | ahead/behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `3981a70` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅ | `0 / 0` | clean | absent ✅ |

判定：boot baseline 完全符合 frozen baseline。Deploy clone 僅 read-only 讀取，未寫入。

### 自動 readiness checks（read-only，checks-only）

| # | 指令 | Exit | 摘要 |
| --- | --- | --- | --- |
| C-1 | `npm run check:phase1-readiness` | 0 | validate `0 error / 135 warning / 107 post`、npm-script-targets `48/48`、adsense-mode 0 warn、blogger-backfill report-only、prepublish `16/16`、smoke `8/8` |
| C-2 | `npm run check:phase1-readiness-contract` | 0 | `22/22 PASS`（6/6 required fragments、順序正確、13 forbidden token 全 absent） |

---

## B. 測試基本資料（Dean 提供）

| 欄位 | 值 |
| --- | --- |
| Test time | 2026-07-08 16:xx（Asia/Taipei） |
| Tester | Dean |
| Source HEAD | `3981a70` |
| Deploy HEAD | `1170e7e` |
| Test article slug | `phase1-e2e-smoke-test-20260708` |
| Blogger | draft preview only, **not published** |
| GitHub Pages | readonly only, **no deploy** |

> 註：測試文章與其 `build:blogger` 產出（`dist-blogger/`）皆為臨時 E2E artifact，Dean 已於建立本紀錄前自 repo 移除（見 §F Repo cleanup）。本紀錄不將任何測試 artifact 寫回 `content/`。

---

## C. 人工步驟結果（Dean 判定）

對應測試包 §D 之 D-1..D-10。

| Step | 項目 | 判定 |
| --- | --- | --- |
| D-1 | Admin 頁開啟（dev-only、noindex） | **PASS** |
| D-2 | 選定測試文章 / draft | **PASS** |
| D-3 | frontmatter / metadata 完整性 | **PASS with warnings** |
| D-4 | Blogger HTML 匯出（`npm run build:blogger`） | **PASS** |
| D-5 | `dist-blogger` post.html / copy-helper 輸出 | **PASS** |
| D-6 | 貼到 Blogger draft preview（不發布） | **PASS** |
| D-7 | Blogger 預覽外觀（含 RWD） | **PASS with warnings** |
| D-8 | GitHub Pages 各頁 readonly 檢視 | **PASS** |
| D-9 | Console / 404 / broken image 檢查 | **PASS with warnings** |
| D-10 | 需修正項目已記錄並分級 | **PASS** |

> 流程備註：測試包 §D 之 D-4 原列為 Admin markdown export；本次 Dean 改以 `npm run build:blogger` 產生 Blogger HTML 並以 Blogger HTML 模式貼上（見 §D Attempt notes），屬同一「內容 → Blogger 可貼 HTML」鏈路之等效驗證。

---

## D. 執行過程（Attempt notes）

- **Attempt 1（失敗）**：直接把 raw Markdown 貼進 Blogger 預覽 → Blogger 預覽顯示未渲染的 Markdown 語法（如 `##` 標題、markdown 連結）。
- **Attempt 2（成功）**：改用 `npm run build:blogger` 產生的 HTML，並以 Blogger 的 **HTML 模式**貼上 → Blogger 預覽不再出現 raw Markdown 語法，標題 / 連結正確渲染。
- Blogger post **未發布**（僅 draft / preview）。
- GitHub Pages **未 deploy**；頁面僅 readonly 檢視。

### GitHub Pages readonly 檢視頁面

- `https://babel-lab.github.io/portable-blog-system/`
- `https://babel-lab.github.io/portable-blog-system/posts/what-is-design-token/`
- `https://babel-lab.github.io/portable-blog-system/privacy/`
- `https://babel-lab.github.io/portable-blog-system/affiliate-disclosure/`

### GitHub Pages 觀察結果

- 首頁載入正常。
- 文章頁（what-is-design-token）載入正常。
- 隱私權頁載入正常。
- 聯盟揭露頁載入正常。
- 桌機與手機 viewport 版面皆可用。
- Console 出現 `contentscript.js` orphaned background-liveness 警告，研判為瀏覽器擴充套件相關，**不**視為專案 P0。
- 文章頁出現前述警告；未觀察到專案阻擋性錯誤。

---

## E. 問題分級（Dean 判定；對應測試包 §F）

### P0（阻擋性）

- **none** —— 未發現 P0 blocker。

### P1（應在正式累積 SEO / 變現前修）

1. **Admin Export 頁目前僅唯讀總覽**，未提供 per-post copy-helper / publish-checklist 開啟按鈕。Workaround：改跑 `npm run build:blogger` 後手動開啟 `dist-blogger` 輸出。
2. **測試文章需先改為 build-eligible**（`status: ready` / `draft: false`）才能經 `build:blogger` 產生 Blogger HTML。待釐清：Blogger draft-preview 流程應支援 draft-only 文章，或僅支援 ready 文章。
3. **Blogger 預覽出現水平捲軸**。來源可能為 Blogger 預覽工具列、Blogger 模板、廣告區、或 code/ad 版面；於視為系統版面 blocker 前需 follow-up 驗證。

### P2（可延後至 Phase 2 / operation）

1. 測試文章使用假 cover URL → 產生的 JSON-LD image 無意義。因 Blogger post 僅 draft-preview、未發布，**非** blocker。

---

## F. Repo cleanup（Dean 於建立本紀錄前完成）

- 測試 artifact（測試文章）已自 `portable-blog-system` 移除。
- `build:blogger` 之 `dist-blogger` 輸出已於建立本紀錄前移除。
- **No deploy。**
- **No Blogger publish。**
- **No gh-pages changes。**

建立本紀錄時 Claude 實測 source working tree = clean（無殘留 artifact）。

---

## G. 結論（Dean）

- **整體判定：PASS with P1/P2 follow-up issues。**
- 未發現 P0 blocker。
- Phase 1 可繼續穩定測試（stable testing）。
- 下一個建議 slice：處理最高價值 P1，可能為 **Admin Blogger Export per-post copy-helper / publish-checklist 存取**（對應 §E P1-1）；但**本 session 不實作**，須另開獨立 phase + explicit approval。

**caveat**：本結論基於 Dean 人工測試 + repo 內 read-only guard；Claude 未登入任何 Google / Blogger / GA4 / AdSense / Search Console 後台，未 build / deploy。Blogger 僅 draft preview、GitHub Pages 僅 readonly 檢視，**未宣稱任何正式發布**。

---

## 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔。**不含**任何程式 / frontmatter / settings / build / deploy / dev-server 變更；不新增 guard / npm script；不改 `CLAUDE.md` / `MEMORY.md` / `memory/`；不觸碰 deploy clone 寫入；未 deploy / 未 push gh-pages / 未發布 Blogger；未購買網域 / 未動 DNS / 未碰 AdSense·GA4·Blogger·GSC 後台。測試 artifact 未寫回 `content/`。§E / §G 之 PASS·FAIL 與分級一律為 Dean 人工判定，Claude 未代填。

## See also

- `docs/20260708-phase1-second-manual-e2e-test-packet.md`（本次測試包 + 紀錄模板）
- `docs/20260708-phase1-stability-readiness-inventory.md`（Phase 1 穩定測試就緒盤點；readiness umbrella 來源）
- `docs/20260702-phase1-manual-e2e-runbook.md`（第一次人工 E2E：github-site happy-path PASS）
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`（GitHub Pages prepublish checklist）
- `CLAUDE.md` §7（Blogger 發布 checklist）、§23（發布狀態）、§26（package.json 指令）、§28（MVP 必做）、§29（第一版不做）
