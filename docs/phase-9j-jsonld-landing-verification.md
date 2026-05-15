# Phase 9-j JSON-LD Landing Verification

本文件封存 **Phase 9-j JSON-LD 正式落地檢查**之純讀取盤點結果。屬**驗收快照型**封存；**不**代表新增 source / dist / validate 變動；**不**啟動任何 deferred 強化批次。

對應之上層紀錄：
- `docs/seo-ga4-adsense.md`（Phase 5-b / 5-f 落地紀錄；§7.4 BlogPosting schema 完整規範）
- `docs/checklists/seo-checklist.md`（既有 JSON-LD 驗收條目）
- `docs/phase-9h-known-blockers.md` §6.B（Phase 9-i-b2 修正後 we-media-myself2 JSON-LD `@id` 對齊紀錄）
- `docs/phase-1-completion-report.md` §8.1 / §8.2（9-g-g / 9-f-g deferred 紀錄）

---

## §1 文件目的

### 1.1 本文件是什麼

- BLOG 系統 **Phase 9-j JSON-LD landing verification** 之驗收文件封存
- Phase 9-j 為 Phase 9-i 系列收尾後之 JSON-LD 落地檢查批
- 本文件採**快照型**封存：記錄撰寫當下之 JSON-LD source code / dist / docs 三層落地狀態

### 1.2 本文件不是什麼

- ❌ **不是** Phase 9-g-g（relatedLinks / otherLinks JSON-LD `mentions` / `isPartOf`）之啟動報告
- ❌ **不是** Phase 9-f-g（Book / Periodical structured data）之啟動報告
- ❌ **不是** source code / dist / build / validate 變動之記錄（本批僅新增本文件）
- ❌ **不是**對「Phase 9-j 必須有後續批次」之背書（後續 9-g-g / 9-f-g 為 deferred / future candidate）

### 1.3 Phase 9-j 當前狀態

```
Phase 9-j JSON-LD landing verification    ✅ completed（本批；docs-only）
├── JSON-LD 基礎已落地                    ✅（Phase 5-b GitHub + Phase 5-f-2 Blogger；含 Phase 9-i-b2 修正）
├── Phase 9-g-g 進階強化                  ⏸ deferred
└── Phase 9-f-g 進階強化                  ⏸ deferred
```

---

## §2 JSON-LD 正式落地狀態彙整

### 2.1 結論：**已正式落地**

JSON-LD 於本專案**已正式落地**；**不是** deferred；**不是** half-landed；**不是**未啟動。

落地時序：

- **Phase 5-b**：GitHub 端 WebSite + BlogPosting JSON-LD（home page + post-detail）+ `src/views/seo/json-ld.ejs` partial
- **Phase 5-f-2**：Blogger 端 BlogPosting JSON-LD（full / summary 兩模式）+ `src/scripts/build-blogger.js` 之 `buildBloggerJsonLd()` + `<` → `<` escape 防注入 + canonicalUrl 缺 graceful return null
- **Phase 5-f-3**：Blogger copy-helper [10] 區段 JSON-LD 提示 + publish-checklist Rich Results Test 勾選條目
- **Phase 9-i-b2**：canonical resolver 修正後，we-media-myself2 之 BlogPosting `@id` 正確指向 Blogger publishedUrl（per `docs/phase-9h-known-blockers.md` §6.B.9）

### 2.2 production-readiness 驗證

| 項目 | 狀態 | 來源 |
|---|---|---|
| GitHub dist 端 BlogPosting JSON-LD 實際輸出 | ✅ 正確 | `dist/posts/we-media-myself2/index.html` line 27 含完整 `@id` / `@type` / `headline` / `description` / `datePublished` / `dateModified` / `author` / `mainEntityOfPage` / `inLanguage` / `articleSection` / `image` |
| Blogger dist 端 BlogPosting JSON-LD 實際輸出 | ✅ 正確 | `dist-blogger/posts/we-media-myself2/post.html` 含 `<script type="application/ld+json">` |
| example.com placeholder 全域殘留 | ✅ 0 命中 | per Phase 9-i-b1（commit `eced408`）+ Phase 9-i-b2（commit `7be40a7`）|
| 主機名稱於 JSON-LD `@id` / `mainEntityOfPage` | ✅ 真實 URL | `https://babel-lab.blogspot.com/2026/05/we-media-myself2.html`（per Phase 9-i-b2 修正後）|

---

## §3 已落地範圍

### 3.1 落地清單（11 項）

| # | 項目 | 落地 phase | 對應檔案 / 行號 |
|---|---|---|---|
| 1 | GitHub WebSite JSON-LD（home page）| Phase 5-b | `src/scripts/build-github.js:178-185` + `src/views/seo/json-ld.ejs` |
| 2 | GitHub BlogPosting JSON-LD（post-detail）| Phase 5-b | `src/scripts/build-github.js:210-226` + 同上 partial |
| 3 | Blogger BlogPosting JSON-LD（full mode）| Phase 5-f-2 | `src/scripts/build-blogger.js:130-151` + `src/views/blogger/blogger-post-full.ejs:22-24` |
| 4 | Blogger BlogPosting JSON-LD（summary mode）| Phase 5-f-2 | 同上 build function + `src/views/blogger/blogger-post-summary.ejs:19-21` |
| 5 | Blogger redirect-card 不含 JSON-LD（by design）| Phase 5-f-2 | `src/views/blogger/blogger-redirect-card.ejs:3` 註解明示「純跳轉卡無 BlogPosting 語意」|
| 6 | copy-helper [10] 區段 JSON-LD 提示 | Phase 5-f-3 | `src/views/blogger/blogger-copy-helper.ejs:93-98`（含 redirect-card 條件分支）|
| 7 | publish-checklist Rich Results Test 勾選 | Phase 5-f-2 | `src/views/blogger/blogger-publish-checklist.ejs:99-106` |
| 8 | `<` → `<` escape 防 `</script>` 注入 | Phase 5-b | `src/views/seo/json-ld.ejs` line 2 + `src/views/blogger/blogger-post-full.ejs:23` / `summary.ejs:20` |
| 9 | canonicalUrl 缺 → graceful return null | Phase 5-f-2 | `src/scripts/build-blogger.js:132`（`buildBloggerJsonLd` 第一行 guard）|
| 10 | seo-checklist.md 驗收條目 | Phase 5 | `docs/checklists/seo-checklist.md` line 9-11 / 62 / 89-91 / 113 |
| 11 | Phase 9-i 修正後：we-media-myself2 BlogPosting `@id` 正確指向 Blogger publishedUrl | Phase 9-i-b2 | `src/scripts/build-blogger.js` `resolveCanonicalUrl()` + commit `7be40a7` |

### 3.2 BlogPosting schema 欄位（per `docs/seo-ga4-adsense.md` §7.4）

| 欄位 | GitHub | Blogger | 來源 |
|---|---|---|---|
| `@context` | ✅ `https://schema.org` | ✅ 同 | 固定值 |
| `@type` | ✅ `BlogPosting` | ✅ 同 | 固定值 |
| `@id` | ✅ canonical URL | ✅ canonical URL | 動態 |
| `headline` | ✅ post.title | ✅ post.title | post 欄位 |
| `description` | ✅ post.description | ✅ post.description（fallback site.description）| post 欄位 |
| `datePublished` | ✅ post.date | ✅ post.date | post 欄位 |
| `dateModified` | ✅ post.updated ?? post.date | ✅ 同 | post 欄位 |
| `author` | ✅ `{ '@type': 'Person', name: post.author }` | ✅ 同 | post 欄位 / settings.site.author fallback |
| `mainEntityOfPage` | ✅ canonical URL | ✅ canonical URL | 動態 |
| `inLanguage` | ✅ settings.site.language | ✅ 同 | settings |
| `articleSection` | ✅ category name | ✅ 同 | category lookup |
| `image` | ✅ 條件 ogImage | ✅ 條件 ogImage | post.cover 絕對化 |

### 3.3 WebSite schema 欄位（GitHub home only）

| 欄位 | 狀態 | 來源 |
|---|---|---|
| `@context` / `@type` / `@id` / `name` / `url` / `inLanguage` | ✅ | `src/scripts/build-github.js:179-185` |
| `potentialAction`（SearchAction）| 視 settings | 條件 |

### 3.4 docs 標示彙整

| 檔案 | JSON-LD 標示位置 | 狀態 |
|---|---|---|
| `docs/seo-ga4-adsense.md` | §5-b / §5-f / §7.4 / line 13-91 多處 | ✅ landed |
| `docs/checklists/seo-checklist.md` | line 9-11 / 62 / 89-91 / 113 | ✅ landed |
| `docs/checklists/blogger-publish-checklist.md` | 無 JSON-LD 字樣（master checklist；JSON-LD 由 publish-checklist.ejs 動態 inline）| 設計性質決定 |
| `docs/publish-workflow.md` | 無 JSON-LD 字樣（author SOP 不直接操作 JSON-LD）| 設計性質決定 |
| `docs/future-roadmap.md` | Phase 9 row 含 9-g-g / 9-f-g deferred 標示 | ✅ 已紀錄 |
| `docs/phase-1-completion-report.md` | §8.1 / §8.2 / §9.1 含 deferred 理由 | ✅ 已紀錄 |
| `docs/phase-1-completion-checklist.md` | §10.8 含 JSON-LD 驗收條目（含 §10.8.4 之 deferred 註明）| ✅ 已紀錄 |
| `docs/phase-9h-known-blockers.md` | §6.B.9 含 Phase 9-i 修正後 JSON-LD `@id` 驗證 | ✅ 已紀錄 |

---

## §4 Deferred 強化項

JSON-LD 基礎已落地；以下兩項屬**進階強化**，仍 deferred：

### 4.1 Phase 9-g-g：relatedLinks / otherLinks JSON-LD `mentions` / `isPartOf`

| 項目 | 值 |
|---|---|
| **狀態** | ⏸ deferred |
| **範圍** | 為 relatedLinks / otherLinks 之 internal links 補 schema.org `mentions` / `relatedLink` / `isPartOf` 屬性 |
| **trigger condition** | 真實 ready post 含 relatedLinks 已發布至 Blogger 且可用 Google Rich Results Test 驗證 |
| **trigger condition 當前狀態** | ✅ **已滿足**（we-media-myself2 已含 relatedLinks 且 Blogger URL 已正確指向；per Phase 9-i-b2 修正後）|
| **來源** | `docs/phase-9g-completion-report.md` §8.3 / `docs/related-links-schema.md` §9.2 / `docs/phase-1-completion-report.md` §8.1 |

### 4.2 Phase 9-f-g：Book / Periodical structured data

| 項目 | 值 |
|---|---|
| **狀態** | ⏸ deferred |
| **範圍** | 為 book-review / magazine 文章補 `Book` / `Periodical` JSON-LD schema |
| **trigger condition** | 真實 ready book-review post 已發布 |
| **trigger condition 當前狀態** | ✅ **已滿足**（we-media-myself2 為 book-review；book metadata 已 landed；Phase 9-i 系列後 JSON-LD `@id` 已正確）|
| **來源** | `docs/future-roadmap.md` Phase 9-f 系列補述 / `docs/phase-1-completion-report.md` §8.2 |

### 4.3 deferred 共通理由（per `docs/phase-1-completion-report.md` §9.1）

1. **schema.org 嚴格性**：錯誤 schema 會被 Google 標 invalid；本機驗證之 `JSON.stringify` 正確不代表 Google 認可
2. **byte-identical 驗證對 schema 結構正確性不足夠**：sanity check 之 grep / diff 只能驗證「結構未變」，無法驗證「Google 認可」
3. **建議流程**：作者於 Google Rich Results Test 對 we-media-myself2 之**現有** BlogPosting JSON-LD 進行驗證 → 確認基礎 schema 通過 → 再評估 9-g-g / 9-f-g 進階強化是否啟動

---

## §5 本批不改 source code 之理由

### 5.1 既有 JSON-LD 已完整接入兩端

- **Blogger 端**：`buildBloggerJsonLd()` + `blogger-post-full.ejs` + `blogger-post-summary.ejs` + `blogger-copy-helper.ejs` [10] + `blogger-publish-checklist.ejs` 全部 landed
- **GitHub 端**：`build-github.js` WebSite + BlogPosting + `seo/json-ld.ejs` partial 全部 landed
- **兩端 dist 實證**：we-media-myself2 之 `dist/posts/we-media-myself2/index.html` + `dist-blogger/posts/we-media-myself2/post.html` 皆含 JSON-LD 輸出

### 5.2 若再做方案 2 / 方案 3，會造成重複或破壞

per Phase 9-j pre-analysis 之 spec 4 options：

| 方案 | 假設 | 實況 | 後果 |
|---|---|---|---|
| 方案 2：JSON-LD 最小接入 Blogger | 假設 Blogger 尚未接入 | ❌ 前提錯誤；Blogger 已接入 | 若硬做，會於 Blogger post.html 新增**第二個** `<script type="application/ld+json">` → Google index 衝突 / duplicate schema |
| 方案 3：JSON-LD 同步接入 Blogger + GitHub | 假設兩端尚未接入 | ❌ 前提錯誤；兩端皆已接入 | 同上，且 GitHub 端也會 duplicate |
| 方案 1（本批選擇）：純文件盤點 | 無前提錯誤 | ✅ 適用 | 不影響任何 source / dist / validate |
| 方案 4：更新 publish checklist / roadmap | 無前提錯誤 | ✅ 也適用 | 與方案 1 可合併或獨立做（本批先做方案 1）|

### 5.3 本批只做驗收文件封存

per `docs/phase-9j-pre-analysis` 之 §E 推薦 + spec「若發現 JSON-LD 既有設計尚未穩定，改做 docs + checklist」之**反向適用**（既有設計**穩定**，仍做 docs 屬合理保守）。

---

## §6 對 baseline 之影響

### 6.1 影響範圍對照

| Baseline 維度 | 本批影響 | 證據 |
|---|---|---|
| **source code** | ❌ 不變 | 本批僅新增 `docs/phase-9j-jsonld-landing-verification.md`（純 docs）|
| **dist**（含 dist / dist-blogger / dist-promotion）| ❌ 不變 | 本批未執行 build；不影響任何 dist 產物 |
| **validate baseline** | ❌ 不變 | validate 不掃 `docs/`；維持 `0 error / 22 warning / 17 post(s)` |
| **copy-helper** | ❌ 不變 | 本批未動 `blogger-copy-helper.ejs` 或 build pipeline |
| **publish-checklist** | ❌ 不變 | 本批未動 `blogger-publish-checklist.ejs` 或 build pipeline |
| **GitHub article output** | ❌ 不變 | 本批未動 `post-detail.ejs` / `build-github.js` |
| **Blogger article output** | ❌ 不變 | 本批未動 `blogger-post-full.ejs` / `blogger-post-summary.ejs` / `build-blogger.js` |

### 6.2 與既有 baseline 一致性

- HEAD（本批 commit 前）：`fae087f docs(phase-9h): mark blocker #1 as completed`
- validate baseline：`0 error / 22 warning / 17 post(s)`（沿用 Phase 9-h-r snapshot）
- working tree（本批 commit 前）：clean

---

## §7 下一步建議

### 7.1 候選方向（per 風險 / 觸發條件排序）

| 候選 | 範圍 | 觸發條件當前狀態 | 風險 | 適合時機 |
|---|---|---|---|---|
| **A. Phase 9-g-g**：relatedLinks / otherLinks JSON-LD `mentions` / `isPartOf` | 為 internal links 補 schema.org 屬性 | ✅ 滿足（we-media-myself2 含 relatedLinks 且 Blogger URL 已正確）| 🟡 中（schema.org 嚴格性；需 Rich Results Test 驗證）| 作者完成 Rich Results Test 驗證 BlogPosting 基礎通過後 |
| **B. Phase 9-f-g**：Book / Periodical structured data | 為 book-review / magazine 補 Book / Periodical schema | ✅ 滿足（we-media-myself2 為 book-review；book metadata 已 landed）| 🟡 中（同上 schema.org 嚴格性）| 同上時機 |
| **C. Phase 8-h legacy 欄位退場** | 跨 8 個 source code 位置之 legacy fallback 退場 | 部分滿足（per `docs/phase-8h-pre-analysis.md`；trigger = Phase 1 final report 封存後）| 🔴 中-高（scope 大；需拆 6 子批；需跑完整 build×5 + validate）| Phase 1 final 封存後 |
| **D. 第 1 階段完整使用測試**（§10 真實作者試寫流程）| 作者 ≥1 GitHub ready + ≥1 Blogger ready 之 end-to-end 流程；含 Blogger 後台貼上 / 預覽 / 發布 / FB 推廣 | 部分滿足（系統端 ~95%；作者手動端 ~30-50%）| 🟢 低（屬作者人工 SOP）| **當前最關鍵；屬唯一 Claude 不可代替之工作**（per `docs/phase-1-completion-report.md` §11.1）|

### 7.2 推薦順序

per `docs/phase-1-completion-report.md` §11 之既有保守判定 + 本文件 §4 trigger condition 評估：

1. **順序 1（推薦）**：候選 D（第 1 階段完整使用測試）— 屬唯一 Claude 不可代替之工作；包含作者於 Google Rich Results Test 對 we-media-myself2 之 BlogPosting JSON-LD 進行驗證（即 §10.8.3）
2. **順序 2**：依 §10 試寫結果 + Rich Results Test 結果 → 評估是否啟動候選 A（9-g-g）或候選 B（9-f-g）
3. **順序 3**：候選 C（Phase 8-h legacy 退場）— 屬清理；建議在 Phase 1 final report 封存後再啟動

### 7.3 idle freeze 候選

若無時程壓力，**維持 idle freeze 亦為合理保守選擇**：

- 當前狀態：JSON-LD 已正式落地 + Phase 9-h known blockers 3/3 全清 + working tree clean + validate `0/22/17` 維持
- 自 Phase 9-i 系列收尾後，系統能力層已達 Phase 1 final completion 條件（per `docs/phase-1-completion-report.md` §4.1）
- 唯一 blocker 為 §10 真實作者試寫流程 — 屬作者個人工作，Claude 不可代替

---

## §8 邊界聲明

### 8.1 本文件嚴格邊界

- ✅ 本文件**僅為驗收文件封存**；不啟動任何 source / dist / validate 變動
- ✅ 本文件**不**啟動 Phase 9-g-g / 9-f-g
- ✅ 本文件**不**啟動 Phase 8-h legacy 退場
- ✅ 本文件**不**升 Phase 1 final report 為正式 final（per `docs/phase-1-completion-report.md` §4.3 之保守判定維持）
- ✅ 本文件**不**動既有 source code / 既有 EJS templates / 既有 build scripts / 既有 settings / 既有 content

### 8.2 與 Phase 9-i 系列之關係

- Phase 9-j 為 Phase 9-i 系列收尾後之**驗收文件批**；屬 Phase 9-i 之**後續封存動作**而非新功能批
- 不重新打開 Phase 9-i 系列之 known blockers（3/3 維持 completed 狀態）
- 不修改 `docs/phase-9h-known-blockers.md` / `docs/phase-9h-completion-report.md` / `docs/phase-1-completion-report.md` / `docs/phase-1-completion-checklist.md`

### 8.3 與 Phase 8-h pre-analysis 之關係

Phase 8-h legacy 退場 pre-analysis（commit `a538564`）已 landed；Phase 8-h **實作仍 pending**；本文件**不**啟動 Phase 8-h；不修改 `docs/phase-8h-pre-analysis.md`。

---

## §9 Cross-links

- `docs/seo-ga4-adsense.md`（Phase 5 SEO 整體落地紀錄；§7.4 BlogPosting schema 完整規範）
- `docs/checklists/seo-checklist.md`（既有 JSON-LD 驗收條目）
- `docs/phase-9h-known-blockers.md` §6.B（Phase 9-i-b2 修正後 JSON-LD `@id` 對齊紀錄）
- `docs/phase-9h-completion-report.md`（Phase 9-h GitHub article block parity 系列收尾）
- `docs/phase-1-completion-report.md` §8.1 / §8.2 / §9.1（9-g-g / 9-f-g deferred 紀錄與理由）
- `docs/phase-1-completion-checklist.md` §10.8（JSON-LD 驗收條目；含 §10.8.4 deferred 註明）
- `docs/phase-9g-completion-report.md` §8.3（relatedLinks JSON-LD `mentions` / `isPartOf` deferred）
- `docs/related-links-schema.md` §9.2（relatedLinks JSON-LD 屬性候選）
- `docs/book-schema.md`（book / periodical metadata schema；Phase 9-f-g 之資料基礎）
- `docs/future-roadmap.md` Phase 9 row（跨 phase 路線總覽）
- `docs/phase-8h-pre-analysis.md`（Phase 8-h legacy 退場分析；mirror 之 pre-analysis 命名模式）

---

（本文件結束）
