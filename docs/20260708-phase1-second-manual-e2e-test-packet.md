# Phase 1 第二次人工 E2E 測試包 / 紀錄模板（docs-only test packet）

- 建立日期：2026-07-08（Asia/Taipei）
- 類型：docs-only **測試包 + 紀錄模板**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md`）。
- 狀態：**待 Dean 執行**。本檔只提供可重複的測試步驟與空白紀錄表；**未宣稱任何 E2E PASS**。實際 PASS / FAIL 一律由 Dean 手動填入。
- 前一份人工 E2E：`docs/20260702-phase1-manual-e2e-runbook.md`（2026-07-02，github-site happy-path，Dean 手動 PASS）。本次為**第二次**，聚焦「內容準備 → admin 匯出 → Blogger 手貼 → GitHub Pages 預發布檢查 → 觀察回填」整鏈是否**可重複**。

---

## A. 本次測試目的

- 進行 **Phase 1 第二次人工 E2E**。
- 目標是驗證下列人工流程可**重複**、無新 regression：
  1. 內容準備（frontmatter / metadata 完整性）
  2. Admin markdown export（或既有匯出流程）
  3. Blogger 手貼（copy-helper / publish-checklist / meta 輸出 → Blogger draft/preview）
  4. GitHub Pages 預發布檢查（現有公開頁面外觀 / 連結 / 圖片 / 廣告位置）
  5. 觀察與回填（發布後 URL / 成效觀察欄位是否可照流程記錄）
- **非目標**：本輪不 deploy、不改後台、不買網域、不做 Phase 2 功能。第一次 E2E 已測 github-site；本次可延伸至 blogger-site 或既有 draft，補齊可重複性證據。
- ⚠️ 本檔**不預先判定 PASS**；除非 Dean 實際提供人工測試結果，否則本輪僅為「測試包 + 紀錄模板」。

---

## B. 測試前 frozen baseline

| 項目 | 期望值 |
| --- | --- |
| Source repo | `/d/github/blog-new/portable-blog-system` |
| Source branch | `main` |
| Source HEAD | `891a0b8`（== `origin/main`；full `891a0b85e9025f8bb0b1c6e34221f65496a6e10e`） |
| Source tree | clean、ahead/behind `0/0`、`.git/index.lock` absent |
| Deploy clone | `/d/github/blog-new/portable-blog-deploy` |
| Deploy branch | `gh-pages` |
| Deploy HEAD | `1170e7e`（== `origin/gh-pages`；full `1170e7e14aaa7f3449999bf92b9c8586719a76b4`） |

本輪界線：**不 deploy、不改任何後台（DNS / GitHub Pages settings / Blogger / AdSense / GA4 / GSC）、不買網域、不改 `content/` / `src/` / `package.json` / `CLAUDE.md` / `MEMORY.md`。** deploy clone 只允許 read-only 檢視。

Boot 驗證（read-only，Dean 執行前可先跑一次對照）：

```bash
# source
git -C /d/github/blog-new/portable-blog-system rev-parse --short HEAD        # 期望 891a0b8
git -C /d/github/blog-new/portable-blog-system status -sb                    # 期望 clean, 0/0
# deploy clone（唯讀）
git -C /d/github/blog-new/portable-blog-deploy rev-parse --short HEAD        # 期望 1170e7e
git -C /d/github/blog-new/portable-blog-deploy branch --show-current         # 期望 gh-pages
```

---

## C. 測試前自動 checks（read-only）

兩支皆為 read-only、checks-only（無 build / deploy / push / gh-pages 寫入）。Dean 執行後把結果填入下表。

```bash
npm run check:phase1-readiness
npm run check:phase1-readiness-contract
```

| # | 指令 | 執行時間 | Exit code | 摘要（Dean 填） |
| --- | --- | --- | --- | --- |
| C-1 | `npm run check:phase1-readiness` | | | 例：validate 0/135/107、npm-script-targets、adsense-mode 0 warn、blogger-backfill report-only、prepublish 16/16、smoke 8/8 |
| C-2 | `npm run check:phase1-readiness-contract` | | | 例：22/22 PASS |

> 參考（本測試包建立時，Claude 已於 2026-07-08 read-only 實跑，僅供對照，**非** Dean 執行結果）：C-1 exit 0（validate `0/135/107`、prepublish `16/16`、smoke `8/8`）；C-2 exit 0（`22/22 PASS`）。Dean 執行以自己那次量測為準。

**若任一 check FAIL：不要 commit、不要改檔，直接回報失敗點。**

---

## D. Dean 手動 E2E 步驟（checklist；請勿代填 PASS）

依序執行，逐項在 §E 紀錄表登記 Expected / Actual / PASS·FAIL·N/A。**本檔不替 Dean 勾選任何結果。**

- [ ] **D-1** 準備測試環境或開啟 admin 頁面（`npm run dev` → `/admin/#new-post-draft`，dev-mode-only、noindex、不進 prod build）
- [ ] **D-2** 選定一篇測試文章或既有 draft（建議挑一篇 blogger-site 草稿以補齊第一次未測的平台；亦可用既有 draft）
- [ ] **D-3** 檢查 frontmatter / metadata 是否完整（title / slug / date / category〔registry-bound〕/ tags〔registry〕/ description / searchDescription / status / publishTargets / blocks 等）
- [ ] **D-4** 執行 admin markdown export 或既有匯出流程（Copy markdown / Download `.md`；匯出恆 `status:"draft"` + `draft:true`）
- [ ] **D-5** 檢查 Blogger copy-helper / publish-checklist / meta 輸出（`build:blogger` 之 `dist-blogger/posts/{slug}/` 內 `post.html` / `copy-helper.txt` / `meta.json` / `publish-checklist.txt`；**本輪若不 build，可改檢查前一次既有輸出，並在 Actual 註明來源**）
- [ ] **D-6** 手貼到 Blogger **draft / preview**（不正式發文；僅存草稿或預覽）
- [ ] **D-7** 檢查 Blogger 預覽：標題、段落、圖片、連結、廣告位置、CTA、RWD（桌機 + 手機）
- [ ] **D-8** 檢查 GitHub Pages 現有公開頁面：首頁、文章頁、分類頁、標籤頁、隱私權頁、聯盟揭露（線上瀏覽，唯讀）
- [ ] **D-9** 檢查是否有 console error / 404 / broken image（Blogger preview 與 GitHub Pages 兩端；用瀏覽器 DevTools Console + Network）
- [ ] **D-10** 記錄是否需要修正（把每個異常寫進 §E，並於 §F 分級 P0/P1/P2）

> 界線提醒：D-5/D-6/D-7 僅到 Blogger **draft/preview** 為止，**不**按下發布；D-8/D-9 僅**檢視**線上頁面，**不**改 GitHub Pages settings、**不** push gh-pages。

---

## E. 結果紀錄模板（Dean 填）

每個 Step 一列；PASS / FAIL / N/A 由 Dean 判定。可依需要增列。

| Test time | Tester | Source HEAD | Deploy HEAD | Article / URL | Step | Expected | Actual | PASS / FAIL / N/A | Note | Follow-up issue |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | D-1 | admin 頁可開、dev-only、noindex | | | | |
| | | | | | D-2 | 選定測試文章 / draft | | | | |
| | | | | | D-3 | frontmatter / metadata 完整 | | | | |
| | | | | | D-4 | 匯出 draft（status draft / draft true） | | | | |
| | | | | | D-5 | copy-helper / checklist / meta 輸出正確 | | | | |
| | | | | | D-6 | 成功貼到 Blogger draft/preview | | | | |
| | | | | | D-7 | Blogger 預覽外觀正確（含 RWD） | | | | |
| | | | | | D-8 | GitHub Pages 各頁正常 | | | | |
| | | | | | D-9 | 無 console error / 404 / broken image | | | | |
| | | | | | D-10 | 需修正項目已記錄並分級 | | | | |

欄位定義：
- **Test time**：實際執行時間（含起訖）。
- **Tester**：執行者（預期 Dean）。
- **Source HEAD / Deploy HEAD**：執行當下兩 repo short HEAD（對照 §B）。
- **Article / URL**：測試文章 slug 與對應 Blogger draft / GitHub Pages URL。
- **Step**：對應 §D 之 D-1..D-10。
- **Expected / Actual**：預期行為 vs 實測結果。
- **PASS / FAIL / N/A**：判定。
- **Note**：補充（如輸出來源為既有 build、平台差異等）。
- **Follow-up issue**：需後續處理者，連結至 §F 分級。

---

## F. 問題分級（P0 / P1 / P2）

Dean 把 §E 中每個 FAIL / 異常歸類：

| 級別 | 定義 | 處置 |
| --- | --- | --- |
| **P0** | 阻擋「Phase 1 穩定測試完成」的關鍵缺陷（例：ready 文章 validate error、公開頁面 404 / broken image / 版面崩壞、匯出契約破損）。 | 下一個 session 只針對**最高優先級 P0** 做**最小修正 slice**；修完重跑本測試包對應步驟。 |
| **P1** | 可 workaround，但**應在正式累積 SEO / 變現前修**（例：非阻擋性 metadata 缺漏、次要連結錯誤、RWD 小瑕疵）。 | 排入後續 slice，於正式對外累積 SEO 前處理。 |
| **P2** | 可延後到 Phase 2 / operation（例：優化性建議、非必要視覺調整、營運線增強）。 | 記錄備查，延後。 |

Issue 記錄格式建議：`[Pn] {Step} — {現象} — {建議修正方向}`。

---

## G. 不在本次範圍（明列排除）

本輪**不**做以下任一項（各須獨立 phase + explicit approval）：

- ❌ deploy / push gh-pages / 動 deploy clone 寫入
- ❌ custom domain 啟用 / 購買網域
- ❌ DNS 設定
- ❌ AdSense 正式送審 / AdSense 後台操作
- ❌ GA4 後台調整
- ❌ Blogger 正式發文（僅到 draft / preview）
- ❌ content 大量回填
- ❌ gh-pages 修改
- ❌ 新增 guard / 新增 npm script / 改 `src/` / `content/` / `package.json` / `CLAUDE.md` / `MEMORY.md`

---

## H. 下一步判斷

- **若 Dean 人工測試全 PASS**：下一個 session 可做 **docs-only E2E result record**（把 §E 已填表格 + §F 分級整理成正式紀錄 doc；仍不 build / 不 deploy）。
- **若有 FAIL**：下一個 session **只針對最高優先級 P0** 做**最小修正 slice**（單一問題、最小 diff、修後重跑對應步驟驗證），不擴大範圍。
- 兩種情形皆**不**自動 deploy / 買網域 / 動後台。

---

## 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔。**不含**任何程式 / frontmatter / settings / build / deploy / dev-server 變更；不新增 guard / npm script；不改 `CLAUDE.md` / `MEMORY.md` / `memory/`；不觸碰 deploy clone 寫入；未購買網域 / 未動 DNS / 未碰 AdSense·GA4·Blogger·GSC 後台。所述步驟供 Dean 手動執行；本檔僅為測試包與紀錄模板，**未宣稱任何 E2E PASS**。

## See also

- `docs/20260702-phase1-manual-e2e-runbook.md`（第一次人工 E2E：Admin→content→validate→ready，github-site happy-path PASS）
- `docs/20260708-phase1-stability-readiness-inventory.md`（Phase 1 穩定測試就緒盤點；readiness umbrella 候選來源）
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`（GitHub Pages prepublish checklist）
- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger backfill policy：不猜 postId / publishedAt）
- `CLAUDE.md` §7（Blogger 發布 checklist）、§23（發布狀態）、§24（Blogger 發布 URL 回填）、§26（package.json 指令）、§28（MVP 必做）、§29（第一版不做）
