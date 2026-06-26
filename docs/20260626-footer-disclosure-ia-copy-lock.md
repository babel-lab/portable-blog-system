# Footer 揭露 IA / Copy Lock（Privacy Policy / Affiliate Disclosure）

> 文件名稱：**Footer Disclosure IA / Copy Lock**
> 日期：**2026-06-26**
> 對象專案：`D:\github\blog-new\portable-blog-system`（portable-blog-system，第一版 MVP）
> 性質：**docs-only**。本文件**只鎖定** footer disclosure links 未來要補的資訊架構（IA）與文案方向，**不進 source、不新增頁面模板、不修改 `footer.ejs`、不修改 settings、不進 build/deploy、不碰 Blogger/Google backend**。
> 對應決策題：上一階段 preflight 之 **Q1 Footer disclosure links → Option C（docs-only placeholder：先鎖 IA + 文案）**。

---

## 1. Baseline

| 項目 | 狀態 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `c08305d` |
| subject | `docs(decision): add blog next phase preflight` |
| working tree | clean |
| origin/main | synced（ahead/behind 0/0） |
| `.git/index.lock` | absent |

**前置文件（唯一事實來源，不重新掃 source）**：
- `docs/20260626-blog-next-phase-decision-footer-and-funnel-preflight.md`（§5 Q1 Footer disclosure links 三選項；推薦 Option C → 之後 Option B）。
- `docs/20260626-blogger-static-pages-function-review.md`（P1 footer.ejs 未讀 config.links；P2 `/privacy/`·`/affiliate-disclosure/` 無模板、未生成 → 渲染即 dead link；§5.14 footer 詳檢）。

---

## 2. Purpose

本文件目的：把 footer disclosure links（隱私權政策 / 聯盟揭露）**未來**要補的資訊架構與文案方向**鎖成文件**，讓 Dean 可在不進 source 的前提下核定 IA 與文案語氣，作為下一階段 Option B source landing 的依據。

明確界線：

- 本文件**只做** footer disclosure IA / copy lock。
- **不進 source**：不改 `src/` / `content/` / `settings/`。
- **不進 build/deploy**：不跑 build / dev / preview / sitemap / deploy / gh-pages。
- **不碰 Blogger/Google backend**：不進 Blogger 後台、Google Form、Google Drive、GA4、AdSense、Search Console、Admin write path。
- **不代表** footer links 已經在畫面上渲染。
- **不代表** privacy / affiliate disclosure 頁面已存在或已 live。
- 本文件之文案方向為 **IA 草擬，非正式法律文件、非法律意見**（見 §5 / §6 / §10）。

---

## 3. Current footer disclosure state（目前已知狀態）

依前置 review（P1 / P2 / §5.14 / §8 Assumption 6）整理目前**已知**狀態：

- `content/settings/footer.config.json` 之 `links` **已有兩筆設定觀察**：
  - `隱私權政策` → `/privacy/`
  - `聯盟揭露` → `/affiliate-disclosure/`
- `src/views/layout/footer.ejs` **尚未渲染** `footer.config.json` 的 `links`；footer 目前只輸出 copyright + "Built for..." 字樣。
- `/privacy/` 與 `/affiliate-disclosure/` 的**頁面模板尚未生成**（無對應 `.ejs`、`build-github.js` 無對應 route、`.cache/pages` 無對應頁）。
- 因此目前這兩個 links 仍是**設定觀察（config 中的字串），不是 live 功能**。
- **不可推論**：不可由「config 有 links」推論 Blogger live 或 GitHub live 已有 footer disclosure links。兩端目前畫面上**皆未呈現**這兩個揭露連結。
- 衍生風險（若未先補頁就渲染 links）：渲染即成 **dead link / 404**（P2）。本文件之 IA lock 即為避免該風險先行定義。

> 註：CLAUDE.md §6 Phase 6 要求 footer 含「隱私權 / 聯盟揭露 / 聯絡 / 社群」四類。本文件**僅**鎖定「隱私權 / 聯盟揭露」兩個揭露頁；「聯絡 / 社群」不在本 lock 範圍（未來另議）。

---

## 4. Disclosure IA decision（未來最小資訊架構鎖定）

以下鎖定**未來**最小資訊架構（IA），**僅定義方向，不實作**：

### 4.1 Privacy Policy page
- 獨立靜態頁，slug `/privacy/`（對齊現有 `footer.config.json` 設定，避免 config↔頁面再次不同步）。
- 內容為 IA + 文案方向，**非**正式法律文件（見 §5）。

### 4.2 Affiliate Disclosure page
- 獨立靜態頁，slug `/affiliate-disclosure/`（對齊現有 `footer.config.json` 設定）。
- 內容為 IA + 文案方向，**非**正式法律文件（見 §6）。

### 4.3 Footer links placement
- 揭露連結放在**全站共用 footer**（`footer.ejs` 讀 `footer.config.json.links` 渲染），與 copyright 同區。
- 兩連結並列，順序：`隱私權政策` → `聯盟揭露`（沿用 config links 既有順序）。
- footer links 為**站內連結**：依 §16.3 不加 `nofollow`、不加 UTM、同分頁開啟。
- **MUST**：footer 渲染 links 與「對應頁存在」必須**同一階段同時完成**，避免 dead link（P2）。本文件僅鎖 IA；實作時兩者不可拆成兩個 commit 造成中間態 dead link。

### 4.4 GitHub / new-domain applicability
- 本 IA 之渲染與建頁能力**適用 GitHub Pages**（可由 source / render / build 控制；見 §9.2）。
- **new-domain / merged site**：目前 `githubSiteUrl` = project-site `babel-lab.github.io/portable-blog-system/`，**無 new-domain binding**；揭露頁 URL / canonical 在 new-domain 啟用時須另行決定，本文件**不預設**（見 §9.3）。

### 4.5 Blogger-only 是否需要手動處理
- Blogger 端**無**共用 footer 注入能力（系統不模擬 Blogger 主題、無法 inject Blogger footer / head）。
- 因此 Blogger 的隱私權 / 聯盟揭露呈現屬 **Blogger 後台人工處理**（主題 footer gadget / 獨立 Blogger 頁 / 文章內揭露區塊），**不**由本系統 source 控制（見 §9.1）。
- 本 IA lock 之 footer links 渲染**僅針對 GitHub Pages**；Blogger 端是否、如何呈現由 Dean 後台決定，**不可由本文件推論 Blogger 已具備**。

---

## 5. Privacy Policy page draft IA

> 僅寫 IA 與文案方向，**不寫正式法律文件**；最終措辭須 Dean 核定，必要時諮詢專業意見。

- **page purpose**：說明本站如何處理訪客資料、使用哪些第三方服務（分析 / 廣告）、以及訪客可如何選擇；建立 AdSense / 聯盟站台之基本合規可見性。
- **suggested title**：`隱私權政策`（英文標題若需要：`Privacy Policy`）。
- **suggested slug**：`/privacy/`（對齊現有 `footer.config.json`）。
- **suggested metadata / pageType**：`contentKind: page`；視為一般固定頁（**非** `gated_download`）；`primaryPlatform: github`（GitHub Pages 可控）；不需 funnel / gated 欄位。
- **suggested robots / sitemap / listing behavior**：
  - robots：`index, follow`（合規頁面通常希望可被索引；與 §8 一致）。
  - sitemap：**include**（讓搜尋引擎可找到揭露頁）。
  - listings（home / post-list / 分類 / 標籤）：**exclude**（揭露頁不是內容文章，不應出現在文章列表）。
- **suggested content sections**（文案方向，非定稿）：
  1. 前言 / 適用範圍（本政策適用於哪個站、哪個網域）。
  2. 我們蒐集哪些資料（多為非個資之瀏覽行為；本站無會員 / 留言 / 登入 → 不主動蒐集個資）。
  3. 第三方服務（Google Analytics 4 / Google AdSense / 聯盟行銷導購連結；各自連向其隱私權說明）。
  4. Cookie 與類似技術（GA4 / AdSense 可能使用）。
  5. 外部連結免責（連到第三方後適用對方政策）。
  6. 使用者選擇（瀏覽器 cookie 設定 / 廣告個人化選擇之外部連結）。
  7. 政策更新與最後更新日期。
  8. 聯絡方式（如未來提供 contact）。
- **data / privacy caveats**：
  - 本站第一版**無**會員、留言、View 數、讚數、後端資料庫（CLAUDE.md §29）→ 文案不可宣稱蒐集 / 儲存使用者帳號資料。
  - 不可在文案寫出任何真實 measurement ID / AdSense client/slot id（紅線：secrets 不入 docs / 頁面文案）。
- **GA4 / analytics mention boundary**：
  - 可**概括**說明「使用 Google Analytics 了解流量」；**不**寫出完整 measurement ID。
  - 不宣稱可識別個別使用者身分（GA4 為彙總分析）。
- **external links / affiliate links boundary**：
  - 隱私權頁可**指向**聯盟揭露頁（`/affiliate-disclosure/`）作為交叉引用，但聯盟揭露的細節**主文放在聯盟揭露頁**，避免兩頁職責重疊。
  - 外部 / 聯盟連結之 rel 行為由系統 link processor 控制（§16.1 / §16.2），文案不需逐條列出 URL。
- **not legal advice note**：頁面**應**含一句「本頁為一般性說明，非法律意見」之提示；本 IA 文件本身亦非法律意見。

---

## 6. Affiliate Disclosure page draft IA

> 僅寫 IA 與文案方向，**不寫正式法律文件**；最終措辭須 Dean 核定。

- **page purpose**：明確揭露本站使用聯盟行銷 / 導購連結，以及讀者透過連結購買時本站可能取得回饋；符合 AdSense / 聯盟計畫之揭露要求。
- **suggested title**：`聯盟揭露`（英文標題若需要：`Affiliate Disclosure`）。
- **suggested slug**：`/affiliate-disclosure/`（對齊現有 `footer.config.json`）。
- **suggested metadata / pageType**：`contentKind: page`；一般固定頁（非 gated）；`primaryPlatform: github`。
- **suggested robots / sitemap / listing behavior**：
  - robots：`index, follow`。
  - sitemap：**include**。
  - listings：**exclude**（非內容文章）。
- **suggested content sections**（文案方向，非定稿）：
  1. 揭露聲明（本站文章可能包含聯盟 / 導購連結）。
  2. 運作方式（讀者透過連結購買，本站可能取得少量回饋，不影響讀者價格）。
  3. 合作通路 / 聯盟網（概括描述，如「通路王」等；**不**列出 dashboard 帳號 / token / 結算資訊 → 紅線）。
  4. **編輯獨立性**（見下）。
  5. 連結標示方式（聯盟連結套 `sponsored nofollow noopener noreferrer`，§16.2）。
  6. 與隱私權政策之關係（交叉引用 `/privacy/`）。
  7. 最後更新日期。
- **disclosure（揭露語氣）**：可沿用 CLAUDE.md §12 既有揭露句方向：「本文包含聯盟行銷連結。若你透過連結購買，本站可能取得少量回饋。」作為基準語氣；頁面版可擴寫但語氣保守、不誇大。
- **editorial independence boundary**：
  - 應聲明「是否推薦取決於內容判斷，不因回饋而改變評價」。
  - **不可** overclaim（例如保證「絕對中立」「完全不受影響」之過度承諾）；用語保守。
- **Blogger vs GitHub / new-domain applicability**：
  - GitHub Pages：可由 source 渲染 footer link + 建頁（§9.2）。
  - Blogger：揭露**主要**仍以文章內既有 affiliate disclosure 區塊（§12 / `affiliate.disclosure`）+ Blogger 後台人工頁呈現；footer link 注入**不適用** Blogger（§9.1）。
  - new-domain：URL / canonical 未 binding，不預設（§9.3）。
- **not legal advice note**：頁面**應**含「本頁為一般性揭露說明，非法律意見」提示。

---

## 7. Source phase preview（下一階段 Option B 預擬，僅文件不實作）

> 僅文件預擬。若下一階段進 **Option B source landing**（footer 渲染 + 補揭露頁），預期如下；**本階段不執行**。

- **可能會碰的檔案**：
  - `src/views/layout/footer.ejs`（讀 `footer.config.json.links` 並渲染）。
  - 新增 `src/views/pages/privacy.ejs`、`src/views/pages/affiliate-disclosure.ejs`（或等效頁面來源）。
  - `src/scripts/build-github.js`（新增 `/privacy/`、`/affiliate-disclosure/` 兩 route；對齊 seo/robots/sitemap/listings 推導）。
  - （視 copy 管理方式）對應 content / settings copy 來源（若揭露文案以 content 管理）。
- **不可碰的檔案**：
  - `content/`（除新揭露頁 copy 來源）、其他 `settings/`（含 `footer.config.json` 之 links **值**——slug 已對齊，不需改）、`package.json` / lockfile、`dist*/`、`gh-pages`、`.cache/`、Blogger 模板、Admin、funnel draft pair、secrets / tokens / Drive IDs / Form URLs。
- **需要新增的 page / template / content 路徑候選**：
  - template：`src/views/pages/privacy.ejs`、`src/views/pages/affiliate-disclosure.ejs`。
  - route / generated：`.cache/pages/privacy/index.html`、`.cache/pages/affiliate-disclosure/index.html`（由 build-github 生成；不手改）。
  - content（若採 content-driven copy）：候選 `content/github/pages/privacy.md` / `affiliate-disclosure.md`（路徑待 Option B 決定，本文件不建立）。
- **footer.ejs links rendering approach**：
  - 讀 `footer.config.json.links` 陣列，逐項輸出 `<a href="...">label</a>`；空陣列 → 不輸出空殼（沿用 Optional block 不輸出空白區塊原則）。
  - 站內連結：不加 `nofollow`、不加 UTM、同分頁（§16.3）。
- **GitHub build route implications**：
  - build-github 需把兩新頁納入 `renderPage` 清單與 sitemap / robots 推導；須確認**不影響既有頁輸出**（既有頁 byte-identical）。
- **Blogger implications**：
  - Blogger 模板**不變**（footer link 注入不適用 Blogger）；揭露於 Blogger 仍走文章內 disclosure + 後台人工頁。Option B **不得**改變 `dist-blogger/` 輸出。
- **validation commands（須 Dean 授權跑 build/dev 時）**：
  - `npm run validate:content`（期望 0 / 134 / 106 不退步）。
  - `npm run check:validation-report`（27 / 0）。
  - `node src/scripts/check-page-type-validator.js`（103 / 0）。
  - dev 預覽人工確認 footer links **非 dead link**（兩頁可開）。
- **rollback / stop 條件**：
  - 單一 phase commit，可 `git revert`。
  - footer 渲染 links 但**未同步補頁** → dead link → STOP。
  - build route 變更影響**既有頁**輸出（非 footer / 非兩新頁）→ STOP。
  - 動到 Blogger 輸出（`dist-blogger/` 非 byte-identical）→ STOP。
  - 需 Blogger / Google / GA4 / Admin / backend 操作 → STOP。

---

## 8. SEO / robots / sitemap / listing policy（建議，不實作）

| 維度 | Privacy Policy | Affiliate Disclosure | 理由 |
| --- | --- | --- | --- |
| robots index | **index, follow** | **index, follow** | 合規揭露頁通常希望可被搜尋到、可作為信任訊號；與 gated 頁相反 |
| sitemap include | **include** | **include** | 讓搜尋引擎找到揭露頁 |
| listings include | **exclude** | **exclude** | 揭露頁非內容文章，不應混入文章列表 / 首頁卡片 |
| 特殊 pageType | **不需要**；以一般 `page`（`contentKind: page`）處理即可 | 同左 | 無需新 pageType；沿用既有 page 政策 |

- **與 `gated_download` / noindex 頁的差異**：
  - gated download：`noindex` + 不進 sitemap + 不進 listings（隱藏 funnel 入口）。
  - 揭露頁：**相反** —— `index` + 進 sitemap + **不**進 listings（要被搜尋到，但不混入內容列表）。
  - 兩者**不可共用** robots / sitemap 政策；實作 Option B 時須確認揭露頁走「index + sitemap include + listings exclude」而非沿用 download 之 noindex 路線。
- **不對稱注意**：揭露頁「listings exclude」與 §10 之 MVP download「noindex 但仍進 listings」是**不同**議題；本文件不處理 MVP download 不對稱（hold，待 Dean 另議）。

---

## 9. Blogger-only vs transferable

### 9.1 Blogger 手貼 / 後台需人工處理的部分
- Blogger **無**系統可注入之共用 footer / head → 隱私權 / 聯盟揭露之 footer link **無法**由本系統渲染到 Blogger。
- Blogger 端揭露呈現屬**後台人工**：主題 footer gadget、獨立 Blogger 頁、或文章內 disclosure 區塊（§12 既有機制）。
- Blogger gated NO INDEX 等 head 行為同樣須後台手動（與本揭露議題類比，但屬不同題）。

### 9.2 GitHub Pages 可由 source / render / build 控制的部分
- footer link 渲染（`footer.ejs` 讀 config links）、揭露頁模板、build route、robots / sitemap / listings 推導**皆可由系統控制** → Option B 之實際落地對象 = **GitHub Pages**。

### 9.3 future new-domain 尚不可推論的部分
- 現 `githubSiteUrl` = project-site；**無 new-domain / merged site binding**。
- 揭露頁之最終 URL / canonical / 跨平台政策在 new-domain 啟用時須另行決定；**不可**由現 project-site 推導 new-domain 行為。
- 本 IA lock 之 slug（`/privacy/`、`/affiliate-disclosure/`）為**相對路徑意圖**；new-domain 之絕對 URL / canonical 另議。

---

## 10. Risk register

| 風險 | 說明 | 緩解 |
| --- | --- | --- |
| dead links | footer 渲染 links 但揭露頁未生成 → 404（P2） | §4.3 MUST：渲染與建頁同階段同時完成；Option B stop 條件 |
| legal wording overclaim | 揭露 / 隱私文案誇大或過度承諾（如「絕對中立」「完全不蒐集任何資料」） | 用語保守；§5/§6 標 not legal advice；最終措辭 Dean 核定 |
| privacy wording 不精確 | 宣稱蒐集 / 不蒐集與實際不符（本站無會員 / 後端） | 對齊 CLAUDE.md §29「第一版不做」事實；不寫超出實作的蒐集行為 |
| affiliate disclosure 不足 | 揭露不夠明確，未達聯盟 / AdSense 要求 | §6 sections 明列揭露聲明 + 運作方式 + 編輯獨立性 |
| source phase accidentally touches settings/content | Option B 誤改 `footer.config.json` 值或其他 settings/content | §7 不可碰清單；slug 已對齊不需改 config；diff 審查 |
| Blogger live mismatch | 誤以為 footer link 已在 Blogger 呈現 | §3 / §9.1：Blogger 無 footer 注入；揭露屬後台人工，不可推論已具備 |
| GitHub / new-domain over-assumption | 以 project-site 推論 new-domain URL / canonical / 政策 | §9.3：new-domain 無 binding，URL / canonical 另議 |

---

## 11. After this docs-only lock（下一步建議，不執行）

- **建議下一步 = Option B source landing（Footer 揭露最小落地）**，但**前提**：Dean 先核定本文件之 IA 與揭露 / 隱私文案語氣（§5 / §6），並確認：
  - slug 維持 `/privacy/` / `/affiliate-disclosure/`（或指定調整）。
  - 揭露 / 隱私文案之法律語氣（是否需專業意見、是否沿用 §12 基準揭露句）。
  - 揭露文案之 copy 管理方式（content-driven vs 模板 inline）。
- **若 Dean 尚未定稿文案** → 維持本 docs-only lock，**不**進 source；可由 Dean 直接在本文件補 / 改文案方向後再開 Option B。
- **最小 phase 草案（Option B，僅供參考，不執行）**：
  1. `footer.ejs` 讀 `footer.config.json.links` 渲染（站內連結，不加 nofollow/UTM）。
  2. 新增 `privacy.ejs` / `affiliate-disclosure.ejs` 兩頁（內容依本文件 §5 / §6 IA）。
  3. `build-github.js` 加兩 route + robots（index）+ sitemap（include）+ listings（exclude）。
  4. 驗證：validate:content 不退步、check:validation-report 27/0、page-type-validator 103/0、dev 確認非 dead link。
  5. Blogger 模板 / `dist-blogger/` 不變（byte-identical）。
- **funnel renderer（Q2）** 與本題無關，維持 deferred。

---

## 12. Validation plan for this docs-only phase

本階段**不跑** build / deploy / dev server / Blogger backend / GA4 backend / Google Form / Drive / AdSense / Search Console / Admin backend。

僅允許：

```
git status --short
git status -sb
git diff -- docs/20260626-footer-disclosure-ia-copy-lock.md
git diff --check
git diff --stat
```

預期：唯一變更 = 新增本 docs 檔；`git diff --check` 無 whitespace / conflict marker 錯誤。

---

## 13. Final status

- 若只新增本 docs-only 文件且 diff 無異常 → 可 commit / push。
- commit message：`docs(footer): lock disclosure ia copy`
- commit 前後回報：`git status --short` / `git status -sb` / `git log -1 --oneline` / HEAD 是否等於 origin/main / `.git/index.lock` 是否存在。
- push 後 read-only freeze 確認：working tree clean、ahead/behind 0/0、no index.lock。
- 最後 **STOP**，等待 Dean 下一步指示。

### 硬性 STOP 條件
- baseline 非 `c08305d` clean → 立刻 STOP，不修。
- 需要修改 docs 以外任何檔案 → 立刻 STOP。
- 出現 index.lock → 立刻 STOP，不刪除，先回報。
- 不慎碰到 source/content/settings/package/dist/gh-pages/.cache/generated HTML → 立刻 STOP，不 commit。
- 需要 Blogger / Google / GA4 / Admin / backend 操作 → 立刻 STOP。

---

*本文件為 docs-only footer disclosure IA / copy lock，未修改任何 source / content / settings / build / deploy / live service，未碰 LearnOops 及任何 Blogger/Google backend。所有 IA 與文案方向僅供 Dean 核定，未實作、非正式法律文件、非法律意見。*
