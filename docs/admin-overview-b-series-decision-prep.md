# Admin Overview B 系列決策整理

本文件為 BLOG / portable-blog-system 之 **Admin Overview B 系列候選之 user 決策整理 prep doc**；屬 docs-only；新增於 phase `20260523-night-admin-b-series-decision-prep-a`。

本文件**不取代**既有 admin docs；屬「將散落在 audit doc 內的 B 系列候選集中至單一 prep doc」之導航與決策補完文件。

對應上層：
- `docs/admin-overview-audit-20260523.md` §8.3 / §10.1 / §10.4（B 系列原 audit 出處）
- `docs/20260523-eod-report.md` §13.9 / §15.7（B 系列 EOD 狀態）
- `docs/fb-sidecar-schema.md`（FB sidecar 12 read-only 欄位 schema；對應 B1 / B2 之 loader 來源）
- `docs/ad-affiliate-schema-proposal.md`（聯盟行銷 schema proposal；對應 B2）
- `docs/phase-2-candidate-roadmap.md`（Phase 2 roadmap；B 系列屬其子集）
- `CLAUDE.md` §29（第一版不做清單）

---

## §1 背景與目的

### 1.1 本文件之來由

`docs/admin-overview-audit-20260523.md` 於 5/23 上午建立後，B 系列 6 個候選（B1-B6）散落於 §8.3 / §10.1 推薦序 table / §10.4 dependency table 三處；經 5/23 下午 pm-7 ~ pm-25 之多輪 sync，目前狀態為：

| 候選 | 狀態 |
|---|---|
| **B4** | ✅ 已落地（pm-16 `2df85e2`；fbPostedAt sort option）|
| **B5** | 🟡 **low priority / optional**（per pm-19 偵察 + pm-20 sync；不建議目前做 source polish）|
| **B1 / B2 / B3 / B6** | 🟡 **仍待 user 表態**；散落於 audit doc 內 |

→ 本文件將 **B1 / B2 / B3 / B6** 4 個仍待 user 表態之候選集中至單一 prep doc，明列各候選之：

- 問題描述
- user 需要決定什麼
- 預估 source 變動範圍 / LOC
- 風險評估
- 若 user 暫不表態之建議處理

### 1.2 目的

| 目的 | 說明 |
|---|---|
| **集中** | 將散落於 audit doc 之 4 個 B 候選集中至單一 prep doc |
| **補完** | 為每個候選補完 user 決策題目與選項，讓 user 明確知道「需決定什麼」 |
| **預估** | 為每個候選預估 source 變動範圍 + LOC + 風險，便於未來啟動拆批之 scope 評估 |
| **不啟動** | 本文件**不**啟動任何 source change；屬 docs-only planning |

### 1.3 本 phase 範圍

| 項目 | 狀態 |
|---|---|
| **新增單檔** | 本文件 `docs/admin-overview-b-series-decision-prep.md` |
| **修改既有檔案** | ❌ 完全不 |
| **觸碰 src / content / settings JSON** | ❌ 完全不 |
| **build / validate / deploy** | ❌ 完全不 |
| **觸碰 Reverse UTM / pm-29c / fixture post / Blogger 後台 / GA4 Realtime** | ❌ 完全不（per 今晚 EOD freeze 邊界）|

---

## §2 目前 Admin Overview 狀態摘要

### 2.1 A 系列 / B 系列 / C 系列 / D 系列當前狀態

per `docs/admin-overview-audit-20260523.md` §10.1 + 5/23 下午多輪 sync 後狀態：

| 系列 | 狀態 | 備註 |
|---|---|---|
| **A1-A7**（Admin polish 收斂段）| ✅ **全收斂** | A1 / A2 / A7 ✅ 落地（pm-3 / pm-5 / pm-10）；A3 stale（5/21 `da00f53` 早已實作）；A4 essentially done（commit `f3c7ee8`）；A5 / A6 stale / no-op（per pm-13 偵察）|
| **B4** fbPostedAt sort option | ✅ **已完成** | 落地 pm-16（commit `2df85e2`）|
| **B5** Sort indicator（↑↓ icon）| 🟡 **optional / 暫不建議** | 既有 4 個 sort label 已含明文 `desc` / `asc`；替換為 ↑↓ 可能 downgrade accessibility；per pm-19 偵察 + pm-20 sync |
| **B1 / B2 / B3 / B6** | 🟡 **仍待 user 表態** | 本文件主要範圍 |
| **C1-C3**（tag 多選 filter / per-row action / numeric pagination）| 🟡 **目前文章數仍少（6 篇），暫緩** | 屬規模性 polish；當前 6 篇遠未到觸發需求 |
| **D1-D4**（FB / Admin write series）| 🔴 **blocked** | user 8+6 項 preflight 未勾；per `fb-sidecar-write-preflight-decision.md` §7 |

### 2.2 Admin overview 當前 14 stat-card 編號

per `src/views/admin/index.ejs:126-139`（5/22 night fixes 後）：

| # | 卡名 | 來源欄位 |
|---|---|---|
| 1 | total posts | `posts.length` |
| 2 | ready | `byStatus.ready` |
| 3 | draft | `byStatus.draft` |
| 4 | published | `byStatus.published` |
| 5 | blogger source | `srcBlogger` |
| 6 | github source | `srcGithub` |
| 7 | blogger enabled | `bloggerEnabled` |
| 8 | github enabled | `githubEnabled` |
| 9 | has .fb.md | `fbExists` |
| 10 | SEO ok | `seoOk` |
| 11 | URL ok | `urlOk` |
| 12 | fb published ok | `fbPublishedOk` |
| 13 | Missing FB URL | `total - fbPublishedOk` |
| 14 | Missing Output URL | `total - urlOk` |

### 2.3 邊界：本文件**不**改任何上述卡片

本文件僅整理 user 決策；任何 stat-card 增 / 改 / 拆分**皆需於後續 micro-batch 才執行**。

---

## §3 B1 決策整理：FB posted ok stat-card

### 3.1 問題描述

per `docs/admin-overview-audit-20260523.md` §8.3 第 1 列：

> FB posted ok stat-card（單獨計數；非 ok 概念）

當前 14 stat-card 中已有：
- **#12 `fb published ok`**：對應 `fbPublishedOk` derived field；語意 = ?
- **#13 `Missing FB URL`**：對應 `total - fbPublishedOk`；語意 = total 篇數 - 已成功填回 FB URL 之篇數

候選 B1 想新增之 stat-card 為「FB posted ok」單獨計數。

### 3.2 為什麼可能與既有 fb published ok 混淆

問題核心：**`fb published ok` 與 `fb posted ok` 兩字串語意極接近，user 看到時無法快速分辨**：

| 語意候選 | 對應 derived field 假設 |
|---|---|
| `fb published ok` = `.fb.md` `enabled: true` && 有 `fbPostUrl` && `fbPostedAt` | 既有 |
| `fb posted ok` = ? | 候選 B1 想引入 |

**可能語意分歧**：

| 假設 | `fb published ok` 解釋 | `fb posted ok` 解釋 |
|---|---|---|
| A | `enabled && status===published` | 同上 |
| B | `enabled && fbPostUrl && fbPostedAt`（含完整 metadata 回填）| `enabled && fbPostUrl`（只要有貼 URL；不需 fbPostedAt）|
| C | broad「FB 流程已完成」 | narrow「實際已貼到 FB 平台」 |

→ 若不確認語意差，**雙字串並列會造成 user 認知混亂**。

### 3.3 建議命名 / 顯示語意

若仍要做，建議：
- ❌ 不用「FB posted ok」（與既有 `fb published ok` 字面差距太小）
- 🟢 改用更明確之命名，例如：
  - `FB has URL`（明確指有 `fbPostUrl`）
  - `FB metadata complete`（明確指 `fbPostUrl` + `fbPostedAt` + `fbPostId` 三欄齊全）
  - `FB sidecar enabled`（明確指 `.fb.md` `enabled: true` 不分後續狀態）

→ 命名需與既有 `fb published ok` 之語意明確區分，避免 user 誤判。

### 3.4 user 需要決定什麼

| 決策題 | 選項 |
|---|---|
| **D1**：是否確認既有 `fb published ok` 之精確 derived 邏輯？ | （a）查 `src/scripts/load-admin-posts.js` 之 `fbPublishedOk` 計算邏輯 →（b）再決定是否需要 B1 |
| **D2**：若確定需要新 stat-card，應命名為何？ | 候選：`FB has URL` / `FB metadata complete` / `FB sidecar enabled` / 其他 |
| **D3**：與既有 #13 `Missing FB URL` 之關係？ | 是否冗餘（`Missing FB URL` = total - 新 stat-card）？ |
| **D4**：14 → 15 stat-card 之展示密度是否可接受？ | 與 B2 / B3 同時做時為 14 → 17 或 18 |

### 3.5 預估 source 變動範圍

| 維度 | 預估 |
|---|---|
| `src/scripts/load-admin-posts.js` | ❌ 若 reuse 既有 derived field 則 0 行；🟡 若新 derived field 則 ~5 行 |
| `src/views/admin/index.ejs` | ~5 行（新增 1 stat-card）|
| 風險 | 🟡 中（**語意混淆風險**；非技術風險）|

### 3.6 若 user 暫不表態：建議暫不做

理由：
- 若 user 對 `fb published ok` vs `fb posted ok` 之精確 derived 邏輯**不確定**，貿然新增第二個語意極接近之 stat-card 會降低 Admin overview 之資訊清晰度
- 既有 #12 + #13 已涵蓋「成功 / 缺漏」兩面；除非 user 明確指出新 derived field 之**獨立業務需求**，否則新增邊際價值低
- 風險不高（單檔小修），但 ROI 視 user 表態而定

→ **若 user 暫不表態，建議跳過 B1，優先處理 B3 / B6**。

---

## §4 B2 決策整理：affiliate enabled stat-card

### 4.1 問題描述

per `docs/admin-overview-audit-20260523.md` §8.3 第 2 列：

> affiliate enabled stat-card

當前 14 stat-card **無**任何聯盟行銷 / affiliate 相關計數。Admin detail panel 也未直接顯示 `affiliate.enabled`（per audit §2.6）。

候選 B2 想新增「affiliate enabled」stat-card，計數**所有 `affiliate.enabled: true` 之文章篇數**。

### 4.2 是否真的需要在 overview 顯示

**正面理由**：

| 場景 | 受益 |
|---|---|
| user 想快速看「我有幾篇開啟聯盟連結」 | ✅ 直接於 overview 看到 |
| user 想識別「應該開但忘了開」之 book-review 文章 | 🟡 部分（需 cross-ref 文章類型）|
| 未來作 affiliate-link rotation / health check | 🟡 屬 future；當前無此需求 |

**反面理由**：

| 場景 | 風險 |
|---|---|
| 大多數 affiliate-enabled 之文章皆為書評類；數量本來就有限 | 🟡 stat-card 計數可能恆為個位數，邊際價值低 |
| stat-card 數量已 14；繼續擴張會增加視覺密度 | 🟡 與 B1 / B3 同時做時為 14 → 17 / 18 |
| 既有 `Completeness summary` 之 detail panel 已可顯示 missing affiliate links | 🟡 部分重疊 |

### 4.3 對 AdSense / 通路王 / 聯盟網管理的關聯

per `docs/ad-affiliate-schema-proposal.md`：

| 系統 | 與 B2 之關係 |
|---|---|
| **AdSense**（Google）| ❌ **無關**；AdSense 為**版位**控制（`adsConfig.json` + EJS partial）；非文章級 enabled flag |
| **通路王** / **聯盟網**（affiliate.links[].network）| ✅ **直接相關**；frontmatter 之 `affiliate.enabled: true` + `affiliate.links[]` 為來源 |
| **B2 計數對象** | 限「文章 frontmatter 之 `affiliate.enabled: true`」；不包含 AdSense |

### 4.4 可能需要 loader / derived field

per `src/scripts/load-admin-posts.js`：

| 現況 | B2 後 |
|---|---|
| ❌ **無** `affiliateEnabled` derived field | 🟡 需新增 `affiliateEnabled = post.affiliate?.enabled === true` derived field |
| 既有 derived fields | 仍保留（`fbExists` / `urlOk` / `seoOk` / `fbPublishedOk` 等）|

→ B2 屬**首批引入 affiliate 維度 derived field**；後續若有 affiliate health check / link expiry 之 audit 需求，可基於此 field 擴張。

### 4.5 user 需要決定什麼

| 決策題 | 選項 |
|---|---|
| **D1**：是否確認 affiliate 維度在 Admin overview 之 stat-card 真實需求？ | （a）若僅做 book-review 之 polish，可直接於文章 frontmatter 觀察，不需 stat-card；（b）若需快速 overview 視角，做之 |
| **D2**：若做，是否同時擴張 detail panel 顯示 affiliate.enabled / affiliate.links count / provider 列表？ | 屬 B2 之 sub-decision；同 audit §8.4 第 7 列「Affiliate.enabled detail 顯示 + provider 顯示」 |
| **D3**：對 14 → 15 stat-card 之展示密度是否可接受？ | 同 B1 / B3 之展示密度題 |
| **D4**：是否預期未來會擴張為 affiliate health check / link expiry warning？ | 若是 → B2 為前置；若否 → B2 為一次性 polish |

### 4.6 預估 source 變動範圍

| 維度 | 預估 |
|---|---|
| `src/scripts/load-admin-posts.js` | ~5 行（新增 derived field `affiliateEnabled`）|
| `src/views/admin/index.ejs` | ~5 行（新增 1 stat-card；可選同時新增 detail panel section）|
| 合計 | ~10-15 行 |
| 風險 | 🟡 中（需 user 確認業務需求；非技術風險）|

### 4.7 建議：先做 docs planning，不急著 source change

理由：
- B2 屬「**全新維度**」之擴張（首次引入 affiliate 至 stat-card 層）；不是既有 derived field 之 polish
- 若無明確的後續擴張路徑（如 affiliate health check / link expiry），單一 stat-card 之邊際價值不大
- 建議**等待**書評 / 聯盟行銷之內容創作累積至**至少 10 篇**後，再 evaluate B2 之 stat-card 是否真有 overview 視角之需求

→ **若 user 暫不表態，建議先擱置 B2 至內容累積成熟**。

---

## §5 B3 決策整理：Missing Blogger URL / Missing GitHub URL 拆分

### 5.1 現有 missing URL 顯示可能過於合併

當前 14 stat-card 中有：
- **#14 `Missing Output URL`** = `total - urlOk`

其中 `urlOk` 之 derived 邏輯（per `src/scripts/load-admin-posts.js`）：

```
urlOk = (Blogger enabled && hasBloggerPublishedUrl) || (GitHub enabled && hasGithubPreviewUrl)
                  ↑                                                ↑
        必須兩平台都符合（若兩平台皆 enabled）         OR-relation 雖看似 lenient
                                                       但 user 期待之語意為 AND
```

**問題**：合併之 `Missing Output URL` 無法告訴 user：

- 缺漏屬 Blogger 那邊？還是 GitHub 那邊？還是兩邊都缺？
- 對發布流程的 actionable item 不夠精確（user 需要點進 detail panel 才知道要修哪個平台）

### 5.2 拆分成 Missing Blogger URL / Missing GitHub URL 的好處

| 好處 | 說明 |
|---|---|
| **明確 actionable item** | user 看到 `Missing Blogger URL: 3` 立即知道有 3 篇要去 Blogger 後台貼文回填 |
| **對應現實流程** | Blogger 手動貼 + 回填 URL 與 GitHub Pages build + deploy 為**兩條獨立流程**；對應拆分 stat-card 更貼合工作節奏 |
| **與既有 #13 Missing FB URL 對齊** | #13 已單獨計數 FB 缺漏；#14 應同樣按平台拆 |
| **detail panel 已有對應展示** | detail panel 之 Blogger / GitHub channel 已分開顯示 `publishedUrl` / `previewUrl`；stat-card 拆分屬自然延伸 |

### 5.3 對 stat-card 數量的影響：14 → 16

| 狀態 | stat-card 數 |
|---|---|
| 現況 | 14（#14 為合併之 Missing Output URL）|
| **B3 落地後** | **16**（#14 拆為 `Missing Blogger URL` + `Missing GitHub URL`）|
| 若同時做 B1 + B2 + B3 | 17 或 18（取決於 B1 是否做）|

### 5.4 展示密度風險

| 維度 | 評估 |
|---|---|
| 14 → 16 之視覺擴張 | 🟢 低（每 row 4 cards；多 2 cards = 多 0.5 row）|
| 與既有 #13 Missing FB URL 之 visual parity | ✅ 加分（同類拆分；視覺一致）|
| 計算 derived field 之 loader 成本 | 🟢 低（既有 `urlOk` 計算邏輯已分 Blogger / GitHub；只需 export 兩個獨立 field）|

### 5.5 user 需要決定什麼

| 決策題 | 選項 |
|---|---|
| **D1**：是否認可「合併 missing 不夠 actionable」之理由？ | （a）是 → 啟動 B3；（b）否 → 維持 #14 合併 |
| **D2**：拆分後是否保留 #14 合併之 stat-card？ | （a）拆分後**取代** #14；（b）拆分後**並列**（總 17 cards）；（c）只新增 Missing Blogger URL（不拆 GitHub）|
| **D3**：拆分後之 stat-card 排序如何？ | 建議：`Missing FB URL` / `Missing Blogger URL` / `Missing GitHub URL` 三 missing 連續排列 |
| **D4**：是否同時整合 detail panel 之 Completeness summary 之對應顯示？ | 建議：同 batch 做；保持一致性 |

### 5.6 預估 source 變動範圍

| 維度 | 預估 |
|---|---|
| `src/scripts/load-admin-posts.js` | ~10 行（拆 `urlOk` → `bloggerUrlOk` + `githubUrlOk`；保留既有合併計算為 backward compat 或刪除）|
| `src/views/admin/index.ejs` | ~10 行（拆 #14 → 兩個 stat-card；可選順序調整）|
| 風險 | 🟢 低-中（純 derived field 拆分；無 schema 變動；對其他系統無影響）|

### 5.7 為何 B3 為 B 系列中最高優先級

per §7 之保守建議：

| 維度 | B1 | B2 | B3 | B6 |
|---|---|---|---|---|
| 對發布流程之直接幫助 | 🟡 中 | 🟢 低 | **🟢 高** | 🟡 中 |
| 語意明確性（無混淆風險）| 🔴 低 | 🟢 高 | **🟢 高** | 🟢 高 |
| 與既有 stat-card 之 visual parity | 🟢 高 | 🟢 中 | **🟢 高** | N/A |
| user 決策成本 | 🔴 高（需釐清語意）| 🟡 中（業務需求題）| **🟢 低**（明確 actionable）| 🟡 中（顯示格式題）|
| 預估 LOC | ~5-10 | ~10-15 | ~10-20 | ~10 |

→ **B3 為最有「Phase 1 收尾 polish」價值之候選**。

---

## §6 B6 決策整理：Relative time 顯示

### 6.1 需求例

per `docs/admin-overview-audit-20260523.md` §8.3 第 9 列：

> Relative time 顯示（如 `5 days ago`）| ~10 行 | 🟢 低 |

當前 detail panel 之 Dates section 顯示：

| 欄位 | 顯示格式 | 來源 |
|---|---|---|
| `publishedAt` (canonical) | `2026-05-15`（絕對日期）| `.publish.json` derived |
| `updatedAt` | `2026-05-23`（絕對日期）| `.md` frontmatter |
| `fbPostedAt` | `2026-05-20T10:30:00+08:00`（ISO）| `.fb.md` frontmatter |

候選 B6 想新增 relative time 顯示，例如：

| 絕對 | 相對 |
|---|---|
| `2026-05-15` | `8 days ago` |
| `2026-05-23` | `today` |
| `2026-05-20T10:30:00+08:00` | `3 days ago` |

### 6.2 替換原日期 vs 與原日期並排

| 方案 | 說明 | 優點 | 缺點 |
|---|---|---|---|
| **A. 替換** | `2026-05-15` → `8 days ago` | 視覺輕量；對 overview 快速掃描友善 | 失去絕對日期；user 需另查 |
| **B. 並排** | `2026-05-15 (8 days ago)` | 兩資訊兼得 | 視覺密度增加 |
| **C. tooltip** | 顯示 `8 days ago`，hover 顯示 `2026-05-15` | 視覺輕量 + 可查 | 行動裝置無 hover；UX 對等性差 |
| **D. 切換** | UI toggle 切換絕對 / 相對 | 完全 user-controlled | 增加 UI 複雜度；over-engineering 風險 |

### 6.3 對使用者快速掃描的幫助

| 場景 | 受益 |
|---|---|
| user 想快速看「最近發了什麼」 | ✅ 顯著（`yesterday` / `2 days ago` 即時辨識）|
| user 想對齊 FB 發文與文章發布 lag | ✅ 顯著（`fbPostedAt = 3 days after publishedAt` 一目了然）|
| user 想精準比對日期（如月底 archive）| 🟡 反而較難（需絕對日期）|

### 6.4 對介面雜訊的風險

| 風險 | 評估 |
|---|---|
| 絕對日期已足夠 user 認知（user 為 single-author；對自己文章發布日有概念）| 🟡 中（B6 之邊際價值較低）|
| relative time 之 i18n 處理（如 `8 天前` vs `8 days ago`）| 🟡 中（需確認本系統 UI 語言策略）|
| relative time 之 stale risk（瀏覽器 cache；不是 live update）| 🟢 低（Admin 為 dev-mode-only；user 每次 dev server 啟動皆重 render）|

### 6.5 user 需要決定什麼

| 決策題 | 選項 |
|---|---|
| **D1**：顯示格式選哪個？ | （a）替換；（b）並排（推薦）；（c）tooltip；（d）切換 |
| **D2**：應用範圍？ | （a）僅 detail panel Dates section；（b）含列表 #1 欄 `publishedAt`；（c）含 #7 欄 fbPostedAt sort |
| **D3**：i18n 顯示語言？ | （a）`8 days ago`（英）；（b）`8 天前`（中）；（c）跟隨 page lang |
| **D4**：threshold 設計？ | 建議：`today` / `yesterday` / `N days ago`（≤30）/ `N weeks ago`（≤90）/ `N months ago`（≤365）/ 絕對日期（>365） |

### 6.6 預估 source 變動範圍

| 維度 | 預估 |
|---|---|
| `src/scripts/load-admin-posts.js` | 🟡 ~5 行（derived `publishedAtRelative` / `updatedAtRelative` / `fbPostedAtRelative`；或於 EJS render 階段計算）|
| `src/views/admin/index.ejs` | ~10 行（並排或替換）|
| 第三方 dependency | ❌ **不引入**（不裝 `dayjs` / `date-fns` 等套件；自實作 ~30 行 utility）|
| 風險 | 🟢 低（純 display 層；零 schema 影響）|

### 6.7 為何 B6 為 B 系列中第二優先

per §7 之保守建議：

- B6 之 UX 改善明確：「快速判斷文章新舊」屬日常工作頻率高之 polish
- 風險低（純 display 層）
- 對 user 決策成本適中（D1 顯示格式為主要題；其他屬 sub-decision）
- 若採推薦方案 B（並排），失去絕對日期之風險為零

---

## §7 建議優先順序

### 7.1 推薦序

1. **B3** Missing Blogger / GitHub URL 拆分 — **優先度最高**
2. **B6** Relative time 顯示 — **次高**
3. **B2** affiliate enabled stat-card — **視聯盟行銷資料結構成熟度再做**
4. **B1** FB posted ok stat-card — **若語意仍不清楚，先不做 source change**

### 7.2 推薦理由

#### B3 為何最高

- 對發布流程**最直接幫助**（缺漏 URL 為現實 workflow 之 actionable item）
- 語意明確（無與既有 stat-card 之混淆風險）
- 對齊既有 #13 Missing FB URL 之 visual parity
- user 決策成本低（D1 確認即可啟動）
- 與 EOD `20260523-eod-report.md` §13.6 提及之「Admin B3 ... 14→16 stat-card 展示密度」題對齊

#### B6 為何次高

- UX 改善明確（快速判斷文章新舊）
- 風險低（純 display 層）
- 推薦方案 B（並排）可同時保留絕對日期；無資訊損失
- 不需 user 決定複雜業務需求；僅需決定顯示格式

#### B2 為何視成熟度再做

- 首次引入 affiliate 維度 derived field；屬「全新維度」之擴張
- 當前書評 / 聯盟行銷文章數量有限；stat-card 邊際價值待累積
- 建議等待內容累積至 ≥10 篇聯盟相關文章後再 evaluate
- 不阻擋；不急

#### B1 為何最末

- 與既有 `fb published ok` 之**語意混淆風險**為 B 系列最高
- user 決策成本最高（需先釐清既有 derived 邏輯 + 命名 + 與 #13 之冗餘性）
- 若命名不夠明確，貿然新增反而**降低**Admin overview 之資訊清晰度
- 建議**最後做**或**乾脆不做**

### 7.3 不建議同批做之組合

| 不建議組合 | 理由 |
|---|---|
| B1 + B3 同批 | B1 風險最高 + B3 風險最低；不同風險梯度不宜混合 |
| B1 + B2 同批 | 兩者皆需 user 決策成本高；認知負擔過重 |
| 全部 B1-B6 同批 | 14 → 18 stat-card；視覺密度暴增；user 無法評估個別效果 |

### 7.4 建議分批序

| 批次 | 範圍 | 預估 LOC | 風險 |
|---|---|---|---|
| **Batch 1** | B3 拆分（Missing Blogger URL + Missing GitHub URL）| ~15-20 行 | 🟢 低 |
| **Batch 2** | B6 並排顯示（推薦方案 B）| ~15 行 | 🟢 低 |
| **Batch 3**（**可選 / 延後**）| B2 affiliate enabled stat-card | ~10-15 行 | 🟡 中 |
| **Batch 4**（**可選 / 延後 / 或跳過**）| B1 FB posted ok stat-card（**需先釐清語意**）| ~5-10 行 | 🟡 中 |

---

## §8 下一步可執行 micro-batch 候選

### 8.1 可啟動 phase（按推薦序）

per §7.4 分批序，未來可啟動之 phase（**本文件不啟動任何**；僅列為候選）：

| Phase name 候選 | 主題 | 範圍 | 預估 | 風險 |
|---|---|---|---|---|
| **`20260524-admin-overview-b3-missing-url-split-a`** | B3 Missing Blogger / GitHub URL 拆分 | `src/views/admin/index.ejs` + `src/scripts/load-admin-posts.js` | ~15-20 行 | 🟢 低 |
| **`20260524-admin-overview-b6-relative-time-a`** | B6 Relative time 顯示（推薦方案 B 並排）| `src/views/admin/index.ejs`（render 層；不引入第三方 lib）| ~15 行 | 🟢 低 |
| **`20260524-admin-overview-b2-affiliate-enabled-stat-a`** | B2 affiliate enabled stat-card | `src/views/admin/index.ejs` + `src/scripts/load-admin-posts.js`（新 derived field）| ~10-15 行 | 🟡 中 |
| **`20260524-admin-overview-b1-fb-posted-ok-label-a`**（**可選**）| B1 FB posted ok stat-card（**需先決定命名 + 語意**）| `src/views/admin/index.ejs`（+ 可選 loader 修）| ~5-10 行 | 🟡 中 |

### 8.2 啟動前置條件

每個 micro-batch 啟動前，**必須**：

| Phase | 啟動前置 |
|---|---|
| B3 | user 表態：認可拆分理由（D1 / D2）+ 排序偏好（D3）|
| B6 | user 表態：顯示格式（D1）+ 應用範圍（D2）+ i18n 語言（D3）+ threshold（D4）|
| B2 | user 表態：業務需求（D1）+ detail panel 同步擴張？（D2）+ 展示密度（D3）+ 未來擴張路徑（D4）|
| B1 | user 表態：**先釐清既有 `fb published ok` 之精確 derived 邏輯**（D1）→ 再決定命名（D2）+ 與 #13 冗餘性（D3）+ 展示密度（D4）|

### 8.3 啟動後通用邊界

每個 micro-batch 都應遵守：

- ✅ 單檔或最多兩檔 source 修改（`src/views/admin/index.ejs` ± `src/scripts/load-admin-posts.js`）
- ✅ 不動 content / settings JSON / dist / dist-blogger
- ✅ 不動 prod build（Admin 為 dev-mode-only Plan B；prod build 跳過）
- ✅ 跑 EJS compile syntax check + 必要時跑 `validate:content`（loader 變動才需）
- ✅ 不 deploy / 不 push gh-pages / 不碰 Blogger 後台
- ✅ 不啟動其他 B 批
- ✅ 每批獨立 commit

---

## §9 明確不做事項

本 phase `20260523-night-admin-b-series-decision-prep-a` 之嚴格邊界：

| 不做事項 | 狀態 |
|---|---|
| **不修改 `src/`** | ❌ 完全不（任何 EJS / SCSS / JS / build script）|
| **不修改 `content/`** | ❌ 完全不（任何 Markdown / .fb.md / .publish.json / settings JSON）|
| **不修改 admin template**（`src/views/admin/index.ejs`）| ❌ 完全不 |
| **不修改 loader**（`src/scripts/load-admin-posts.js`）| ❌ 完全不 |
| **不修改既有 docs** | ❌ 完全不（本文件僅**新增**單檔；不動既有 docs）|
| **不跑 build**（`npm run build` / `npm run build:blogger` / 其他 build:* / `npm run dev`）| ❌ 完全不 |
| **不跑 validate**（`npm run validate:content`）| ❌ 完全不 |
| **不 deploy**（gh-pages branch / deploy repo）| ❌ 完全不 |
| **不碰 Reverse UTM**（pm-29c / fixture post / blogger-to-github-reverse-utm-plan.md 等）| ❌ 完全不（per 今晚 EOD freeze 邊界）|
| **不建立 fixture post**（任何 GitHub cross-link 之 Blogger fixture）| ❌ 完全不 |
| **不 commit deploy branch** | ❌ 完全不 |
| **不 push origin/main**（本批 commit 後留在 local；待 user 明示後再 push）| ❌ 完全不 |
| **不碰 Blogger 後台 / Blogger theme CSS 重產 / 重貼** | ❌ 完全不 |
| **不啟動任何 B1 / B2 / B3 / B6 source batch** | ❌ 完全不（本文件僅為 prep；不啟動實作）|
| **不碰 `.claude/`** | ❌ 完全不 |

---

## §10 Cross-links

### 10.1 上層 audit / EOD doc

- `docs/admin-overview-audit-20260523.md`（5/23 Admin overview audit；B 系列原始出處）
- `docs/20260523-eod-report.md` §13.9 / §15.7（5/23 EOD 之 B 系列狀態）
- `docs/phase-status-20260523.md` §5（5/23 Phase 1 Admin 維度盤點）

### 10.2 相關 schema docs

- `docs/fb-sidecar-schema.md`（FB sidecar 12 read-only 欄位；對應 B1 之 derived 邏輯）
- `docs/fb-post-url-metadata-proposal.md`（FB post URL metadata proposal；對應 B1 之新欄位來源）
- `docs/ad-affiliate-schema-proposal.md`（聯盟行銷 schema proposal；對應 B2）
- `docs/publish-json-schema.md`（`.publish.json` schema；對應 B3 之 `publishedUrl` 來源）
- `docs/publish-bundle.md`（publish bundle 規範）

### 10.3 Phase 2 roadmap

- `docs/phase-2-candidate-roadmap.md` §1 / §2（Phase 2 候選；B 系列屬其子集）
- `docs/20260522-pm-phase-2-batch-plan.md`（Phase 2 batch plan）

### 10.4 規範來源

- `CLAUDE.md` §29（第一版不做清單；B1-B6 皆屬第一版範圍內 polish；不違反此清單）
- `docs/system-direction.md`（BLOG 系統整體方向）

### 10.5 Source code refs

- `src/views/admin/index.ejs:126-139`（14 stat-card render 區塊）
- `src/scripts/load-admin-posts.js`（loader + completeness + derived badge + sort）

---

（本文件結束）
