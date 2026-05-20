# FB Sidecar Metadata P4 Pre-Analysis

本文件為 **Phase 20260520-fb-p4-pre-analysis** 之 FB sidecar metadata 事前盤點與規劃。屬純 docs / 純 proposal；**本批不改任何 source / loader / Admin UI / write flow / .fb.md 實際資料**。實作落地拆批留待 user 批准後之 **FB-P5-a ~ FB-P5-d** 系列。

對應上層文件：
- `docs/fb-sidecar-schema.md`（`.fb.md` 既有 schema；含 SEO-2-c commit `bdf8fdf` 收編之 4 個 FB post metadata 欄位 + finalUrl）
- `docs/fb-post-url-metadata-proposal.md`（commit `dbbe002`；含 SEO-2-c 之 Status banner；P1 已收編 / P2 已 read-only display / P3-P6 未啟動）
- `docs/admin-2-write-pre-analysis.md`（Admin-2-a；write surface + safety plan；B+D+E+F 寫入策略；本批參考其 write pattern）
- `docs/admin-1-completion-report.md`（Admin-1 read-only 邊界政策）
- `CLAUDE.md` §29（第一版不做清單：不接 FB API / 不自動社群發文）

---

## §1 背景與範圍

### 1.1 使用情境

作者完成 Blogger / GitHub 文章發布後，會**手動**到 Facebook 發文（per 既有 `docs/promotion-export.md` 之 manual workflow；無 FB API）。發完後可能需要：

- 把 FB 貼文 URL **手動回填**到 metadata（per fb-post-url-metadata-proposal §1.1）
- 紀錄 campaign / audience / UTM 以供未來分析
- 若有多次發文 / 多粉專 / A/B title 之情境，需評估 schema 是否足夠

當前 FB sidecar 機制（per `docs/fb-sidecar-schema.md` §3.1）已涵蓋部分欄位；本 pre-analysis 整理「**P4 完整可能欄位集合**」+「**命名收斂方向**」+「**未來 Admin write flow 候選**」。

### 1.2 本批範圍

- 盤點 `.fb.md` 既有 schema 與 Admin read-only 讀取現況
- 提出 P4 完整建議欄位（4 類：發文狀態 / campaign-UTM / 顯示用 / 系統追蹤）
- 提出欄位命名收斂方向（去 `fb` 前綴 vs 保留）
- 提供 `.fb.md` frontmatter 3 種範例（未發文 / 已發文 / 不發 FB）
- 提出 Admin read-only 顯示建議
- 提出未來 Admin write flow 拆批（FB-P5-a ~ FB-P5-d）
- 列風險點與多 FB 貼文情境分析
- 給最終建議結論

### 1.3 不在本批

- 任何 source / loader / Admin UI / write flow / .fb.md 實際資料 修改
- 跑 build
- 新增 fixtures
- 動 validator
- 啟動 FB-P5-a / FB-P5-b / FB-P5-c / FB-P5-d 任一 sub-batch
- 接 FB Graph API（per CLAUDE.md §29）

---

## §2 現況盤點

### 2.1 `.fb.md` 既有 schema（per `docs/fb-sidecar-schema.md` §3.1）

12 個 frontmatter 欄位（原始 8 個 + SEO-2-c commit `bdf8fdf` 收編 5 個含 finalUrl）：

**core**（per Phase 8-a 既有）：
| 欄位 | 型別 | 用途 |
|---|---|---|
| `enabled` | boolean | 是否啟用本篇 FB 文案 |
| `page` | string | 對應 promotion.config.json 之 page key |
| `target` | enum | 文章 URL 解析目標（auto / blogger / github / canonical / custom） |
| `customUrl` | string | target=custom 時之 URL |
| `hashtags` | array of string | FB 貼文 hashtags |
| `title` | string | FB 貼文標題 |
| `titleEn` | string | 英文 metadata（per Phase 8-e-2 收編） |
| `note` | string | 作者備忘 |

**Phase 20260520-c-2 收編**：
| 欄位 | 型別 | 用途 |
|---|---|---|
| `finalUrl` | string | FB 貼文 body 內 outbound 目標文章 URL（FB → article）|
| `fbPostUrl` | string | FB 貼文本身 URL（→ FB；手動回填） |
| `fbPostedAt` | string | FB 實際發佈時間 |
| `fbPostId` | string | optional；FB Graph API post ID |
| `fbCampaign` | string | optional；人工分類標記 |

合計 **13 個** frontmatter 欄位 + body 部分（純文字 FB 貼文 + placeholder `{{ articleUrl }}` 等）。

### 2.2 Admin read-only 目前讀取哪些欄位

per `src/scripts/load-admin-posts.js`（Phase 20260520-c-1 commit `aa08e66`）：

`readFbSidecarMeta()` 讀 6 個欄位：
- `exists`（檔案存在）
- `enabled`
- `postUrl` (= `fbPostUrl`)
- `postedAt` (= `fbPostedAt`)
- `postId` (= `fbPostId`)
- `campaign` (= `fbCampaign`)

**未讀**：page / target / customUrl / hashtags / title / titleEn / note / finalUrl + body。

Admin detail panel 顯示 4 個欄位（`fbPostUrl` / `fbPostedAt` / `fbPostId` / `fbCampaign`；per c-1 / c-3 disclaimer）。

### 2.3 目前是否只有顯示，沒有 write / form submit / fs API

✅ **嚴格 read-only**。per Phase 20260520-c-1 報告：
- 無 fs.writeFile / 無 fetch / 無 form action / 無新 button writes
- 既有 dry-run edit viewer（Admin-2-b-1 commit `b676f26`）僅針對 4 個 SEO 欄位（description / searchDescription / titleEn / coverAlt），**不**涵蓋 FB sidecar
- 真正寫入需另開 write batch

### 2.4 與 Blogger / GitHub 文章 metadata 之關係

- `.fb.md` 為 sidecar；與 `.md` frontmatter（含 `publishTargets.blogger.enabled` / `publishTargets.github.enabled`）為**並列關係**
- FB 推廣與否獨立於文章是否發布 Blogger / GitHub
- `target` 欄位（auto / blogger / github / canonical / custom）連接 FB body 內 placeholder 到實際文章 URL
- `finalUrl` 與 `target` 之 cascade 詳見 `docs/fb-sidecar-schema.md` §5（placeholder）+ §3.5.2

---

## §3 P4 建議欄位（4 類完整列表）

### 3.1 A. 發文狀態欄位

| 欄位 | 既有 / 新 | 型別 | 建議 |
|---|---|---|---|
| `enabled` | 既有 | boolean | ✅ 保留；屬全域開關 |
| `status` | **新** | enum | ✅ 新增；列舉 `draft` / `ready` / `posted` / `archived`；與 `.md` 之 `status` 命名一致但 namespace 隔離 |
| `postedAt` | 既有（命名 `fbPostedAt`）| string | ✅ 保留；考慮去 fb 前綴（per §4） |
| `postUrl` | 既有（`fbPostUrl`）| string | ✅ 保留；考慮去 fb 前綴 |
| `postId` | 既有（`fbPostId`）| string | ✅ 保留；optional；考慮去 fb 前綴 |

### 3.2 B. campaign / UTM 欄位

| 欄位 | 既有 / 新 | 型別 | 建議 |
|---|---|---|---|
| `campaign` | 既有（`fbCampaign`）| string | ✅ 保留；人工分類標記；非 UTM |
| `audience` | **新** | string | ⚠️ 建議；目標受眾標記（如 `developers` / `parents` / `educators`）|
| `source` | **新** | string | ❌ 不建議；應用 `promotion.config.json` 之 `facebook.utm.source`（per fb-sidecar-schema.md §8.3）|
| `medium` | **新** | string | ❌ 不建議；同上 UTM 集中管理原則 |
| `utmCampaign` | **新** | string | ❌ 不建議；UTM 由 `promotion.config.json` 之 `campaignPattern` 動態組裝 |
| `utmContent` | **新** | string | ❌ 不建議；同上 |
| `utmTerm` | **新** | string | ❌ 不建議；同上 |

**重要**：per `docs/fb-sidecar-schema.md` §8.3「`.fb.md` 不得寫死 UTM 參數」之既有政策，**B 類之 UTM 5 欄位皆不建議納入 `.fb.md`**；UTM 集中管理於 `promotion.config.json`。

→ B 類 P4 最終建議：**只新增 `audience`**；UTM 全部 reject。

### 3.3 C. 顯示用欄位

| 欄位 | 既有 / 新 | 型別 | 建議 |
|---|---|---|---|
| `title` | 既有 | string | ✅ 保留 |
| `titleEn` | 既有（Phase 8-e-2 收編） | string | ✅ 保留 |
| `excerpt` | **新** | string | ⚠️ 建議；FB 貼文摘要；目前由 body 直接擔任此角色，新增 excerpt 可能 redundant |
| `hashtags` | 既有 | array of string | ✅ 保留 |
| `linkUrl` | **新** | string | ❌ 不建議；與既有 `finalUrl` 重疊；用 finalUrl |
| `imageUrl` | **新** | string | ⚠️ 建議；FB 貼文預覽圖；若不同於 .md frontmatter 之 cover；可選 |

→ C 類 P4 最終建議：**只考慮新增 `imageUrl`（可選）**；不新增 excerpt / linkUrl。

### 3.4 D. 系統追蹤欄位

| 欄位 | 既有 / 新 | 型別 | 建議 |
|---|---|---|---|
| `createdAt` | **新** | string | ⚠️ 可考慮；屬 audit trail；但作者手動維護成本高；建議自動由 file mtime / git log 推導 |
| `updatedAt` | **新** | string | ⚠️ 同上 |
| `lastCheckedAt` | **新** | string | ❌ 不建議；屬 verification 之 audit；當前無 verification flow |
| `note` | 既有 | string | ✅ 保留 |

→ D 類 P4 最終建議：**全部 reject**；createdAt / updatedAt 應由 git history 取得；lastCheckedAt 屬 verification feature 之外圍欄位，當前 scope 不需。

### 3.5 P4 最終建議欄位集合

A 類全保留 + 新增 `status`（5 個）；B 類保留 `campaign` + 新增 `audience`（2 個）；C 類保留 `title` / `titleEn` / `hashtags` + 可選 `imageUrl`（3-4 個）；D 類保留 `note`（1 個）。

**合計**：13 個既有 + 新增 2-3 個 = **15-16 個** frontmatter 欄位（+ body 部分）。

---

## §4 欄位命名建議

### 4.1 `fb` 前綴之 4 個欄位現況

| 欄位 | sidecar 內 | Admin loader 輸出 |
|---|---|---|
| `fbPostUrl` | 有 fb 前綴 | `postUrl`（已去 fb；per `readFbSidecarMeta()`）|
| `fbPostedAt` | 有 fb 前綴 | `postedAt`（已去 fb） |
| `fbPostId` | 有 fb 前綴 | `postId`（已去 fb） |
| `fbCampaign` | 有 fb 前綴 | `campaign`（已去 fb） |

### 4.2 建議：sidecar 內欄位**去 fb 前綴**

**理由**：
- `.fb.md` sidecar 本身就 file-scope 為 FB；frontmatter 內欄位再加 `fb` 前綴屬冗餘（per `docs/fb-sidecar-schema.md` §3.1 之原始 8 欄位皆無 fb 前綴：`enabled` / `page` / `target` / `customUrl` / `hashtags` / `title` / `titleEn` / `note`）
- SEO-2-c 收編時加 fb 前綴主因是 `.publish.json` 之 `blogger.publishedUrl` 與 `.fb.md` 之 fbPostUrl 同時存在於 cross-sidecar context 容易混淆；但實際上 sidecar 是 file-scope namespace，已自然隔離
- 去 fb 前綴後與 A/B/C/D 類新欄位（`status` / `audience` / `imageUrl` / 既有 `title` / `titleEn` 等）命名風格一致

### 4.3 建議：Admin loader 輸出**保留現有去前綴行為**

當前 loader 已將 `fbPostUrl` → `postUrl` 等映射；保持不變。

### 4.4 建議：Admin EJS 顯示**選用 fb 前綴**

Admin overview detail panel 顯示時：
- 用「FB Post」section 標題標識範疇
- 欄位顯示用 `fbPostUrl` / `fbPostedAt` 之 label（不去前綴）；理由：與 SEO / Blogger / GitHub 等 sibling sections 並列時，作者一眼看出此屬 FB 範疇

### 4.5 命名遷移成本

若 P4 落地時將 sidecar 內欄位去 fb 前綴：

| 影響範圍 | 改動 |
|---|---|
| `docs/fb-sidecar-schema.md` §3.1 | 更新 row name（fbPostUrl → postUrl 等）|
| 既有 `.fb.md` 檔案 | **需 migration**（rename 4 個 key）；當前 2 個 .fb.md（we-media-myself2 / github-pages-blog-planning）皆未填 fb post 欄位 → migration cost = 0 |
| `src/scripts/load-admin-posts.js` `readFbSidecarMeta()` | 改讀 `data?.postUrl` 取代 `data?.fbPostUrl`；屬 1-line per field |
| Admin EJS（per c-1 read-only display）| 顯示 label 可選保留 fbPostUrl style 或改 postUrl style |
| validate-content rules | 暫無對 fb post 欄位之 schema check；無 migration |

→ **命名遷移成本極低**（當前 0 個 sidecar 含 fb post 值）；建議 P4 落地時一併執行。

### 4.6 與 Blogger / GitHub 主文章欄位之混淆避免

- `.md` frontmatter 內 `publishTargets.blogger.publishedUrl` / `publishTargets.github.previewUrl` 屬 sidecar 之外 namespace
- `.publish.json` 內 `blogger.publishedUrl` / `github.publishedUrl` 屬 publish bundle namespace
- `.fb.md` 內 `postUrl` 屬 FB sidecar namespace
- 三者透過**檔案副檔名 + frontmatter location** 自然 namespace 隔離；無命名衝突

→ **去 fb 前綴後不會與主文章混淆**；屬安全 rename。

---

## §5 `.fb.md` frontmatter 範例

依 P4 最終建議欄位（含去 fb 前綴）：

### 5.1 A. 尚未發文

```yaml
---
enabled: true
page: "fan1"
status: "ready"
target: "auto"

# 顯示用
title: "Master AI Content Monetization with《自媒自創》"
titleEn: ""
hashtags:
  - "#書評"
  - "#自媒體"
  - "#AI"

# campaign 標記（人工分類；非 UTM）
campaign: "book-review-2026q2"
audience: "creators"

# 發文後欄位（尚未填）
postUrl: ""
postedAt: ""
postId: ""

note: "排程晚間發文；先確認 Blogger publishedUrl 已回填"
---

[FB 貼文 body：含 placeholder {{ articleUrl }} 等]
```

### 5.2 B. 已發文

```yaml
---
enabled: true
page: "fan1"
status: "posted"
target: "auto"

title: "Master AI Content Monetization with《自媒自創》"
titleEn: ""
hashtags:
  - "#書評"
  - "#自媒體"
  - "#AI"

campaign: "book-review-2026q2"
audience: "creators"

# 發文後欄位（已填）
postUrl: "https://www.facebook.com/babelblab/posts/pfbid02xyz..."
postedAt: "2026-05-20T20:30:00+08:00"
postId: ""   # 仍留空；非 Graph API 必填

note: "FB 互動：留言 5 / 分享 2（截至 2026-05-22）"
---

[FB 貼文 body：實際已貼到 Blogger / FB 之文字內容]
```

### 5.3 C. 不發 FB

```yaml
---
enabled: false
page: "fan1"
status: "archived"
target: "auto"

# 顯示用欄位可留空或保留歷史 draft
title: ""
hashtags: []

note: "此篇技術筆記較 niche，不規劃 FB 推廣"
---

[body 可空或保留 draft 內容]
```

### 5.4 範例之 design intent

- `enabled` + `status` 並用：`enabled: false` 屬全域關閉；`status` 細分 lifecycle（per §3.1 enum）
- `postUrl` 不存在 ≠ `postUrl: ""`：YAML 解析後皆 falsy；validator 對「postUrl 空 + status=posted」可考慮 warning（屬 FB-P5-d validate 範圍）
- `audience` 非強制；用作分類報表

---

## §6 Admin read-only 顯示建議

### 6.1 當前 c-1 之 read-only display section

per Admin overview detail panel「FB Post (read-only metadata)」section：
- 4 個 row：`fbPostUrl` / `fbPostedAt` / `fbPostId` / `fbCampaign`
- `fbPostUrl` 有值時用 `<a target="_blank" rel="noopener noreferrer">` 包
- 空值顯示 `(empty)`

### 6.2 P4 建議擴充

**Admin overview 列表行**（per-post row；簡）：
- 加 1 個小 badge：`FB: not posted` / `FB: posted` / `FB: disabled`（依 status enum）
- 點 row 展開 detail 才看完整欄位

**Admin overview detail panel「FB Post」section**（per-post 展開；詳）：

| 欄位 | 顯示 | 空值處理 |
|---|---|---|
| FB 是否啟用 | badge `enabled` / `disabled` | `disabled` |
| FB 發文狀態 | badge `draft` / `ready` / `posted` / `archived` | `(empty)` |
| postUrl | `<a target="_blank" rel="noopener noreferrer">` | `(empty)` |
| postedAt | mono text | `(empty)` |
| postId | mono text（可選用 small font；屬 debug 用）| `(empty)` |
| campaign | text + 小註標明「人工標記；非 UTM」 | `(empty)` |
| audience | text | `(empty)` |
| title | text | `(empty)` |
| hashtags | inline badge chips | `(無)` |
| note | text in muted color | `(empty)` |

**空值顯示原則**：
- 統一用 `(empty)` 與既有 Admin Identity / SEO section 之既有風格一致
- **不**顯示空值 row 之意見：spec hint「空值如何顯示，避免畫面太亂」— 但既有 Admin pattern 是「空值仍顯示但用 muted」；維持一致較好；future 可加「hide empty fields」toggle（屬 FB-P5-a polish 範圍）

**`postId` 顯示位置**：
- 屬 debug 用（Graph API 預備）；建議**只在 detail panel 顯示**；overview 列表不顯示
- 可加 `<details>` collapsible 進一步隱藏

**外連 icon**：
- `postUrl` 有值時可加小 icon（如 `↗`）標識外連；對齊既有 Admin URLs column 之外連風格

---

## §7 未來 Admin write flow 方案（FB-P5 拆批）

### 7.1 FB-P5-a：read-only UI polish

| 項目 | 內容 |
|---|---|
| 範圍 | Admin overview FB section 顯示之 polish；加 status badge / 外連 icon / hide empty fields toggle；**不寫入** |
| 改檔 | `src/scripts/load-admin-posts.js`（補讀 status / audience / title 等）+ `src/views/admin/index.ejs`（detail panel 擴 row）|
| 風險 | 🟢 低（純 read-only display 增強）|
| 前置 | 無 |

### 7.2 FB-P5-b：新增 draft editor / form UI（dry-run preview）

| 項目 | 內容 |
|---|---|
| 範圍 | Admin detail panel 加 form UI（textarea / input）；點 "Preview Diff" 計算 new value + 顯示 diff；**仍不寫入**（per Admin-2-b-1 dry-run viewer pattern）|
| 改檔 | `src/views/admin/index.ejs`（dry-run form 區擴含 FB sidecar 欄位）|
| 風險 | 🟢 低（純 client-side dry-run；無 fs.write）|
| 前置 | FB-P5-a 完成 |

### 7.3 FB-P5-c：寫入 .fb.md frontmatter（限 FB sidecar）

| 項目 | 內容 |
|---|---|
| 範圍 | dry-run form 加 "Apply" button；fs.writeFile temp + rename atomic；僅允許更新 `.fb.md` frontmatter；**不碰** `.md` / `.publish.json` |
| 改檔 | `src/views/admin/index.ejs` + `src/scripts/load-admin-posts.js`（新增 fb sidecar write helper）|
| 風險 | 🟡 中（屬 write batch；參考 `docs/admin-2-write-pre-analysis.md` §6.7 之 B+D+E+F 策略）|
| 前置 | FB-P5-b 完成 + user 確認 write strategy（temp-file + atomic rename + dry-run default + pre-write inline validate + post-write validate:content baseline check）|

### 7.4 FB-P5-d：validate / backup / rollback 文件

| 項目 | 內容 |
|---|---|
| 範圍 | 寫文件補 validate rule for fb post status / postUrl 必填 conditions / backup 策略（git-status check 取代 .bak）/ rollback workflow（spawn `git restore` 或 manual command 提示）|
| 改檔 | docs only（補 `docs/fb-sidecar-schema.md` validate rules）|
| 風險 | 🟢 低（純 docs / validator hardening）|
| 前置 | FB-P5-c 完成（write 機制就位後再補 safety doc）|

### 7.5 推薦執行順序

per `feedback_conservative_landing` 偏好保守：FB-P5-a → user 批准 + visual diff 確認 → FB-P5-b dry-run → user UX feedback → FB-P5-c write（含 atomic + validate） → FB-P5-d safety doc。每批之間 stop point。

**強烈建議**：**不**跳過 FB-P5-b dry-run；對齊 Admin-2-b-1 之「先看後做」原則。

---

## §8 風險點與分級

| # | 風險 | 等級 | 緩解 |
|---|---|---|---|
| 1 | 寫入錯檔（如誤寫到 `.md` 而非 `.fb.md`）| 🔴 高 | FB-P5-c 之 write helper 必須 hardcode 限定 `.fb.md` extension；單測 + atomic rename |
| 2 | 覆蓋主文章 metadata（誤改 `.md` frontmatter）| 🔴 高 | 同 #1；write helper 之 file path 必經 `.fb.md` 後綴 guard |
| 3 | YAML frontmatter 格式壞掉 | 🟡 中 | Pre-write inline validate（per Admin-2-a §6 Strategy E）；fs.writeFile 前先用 gray-matter 試 parse |
| 4 | FB URL 手動貼錯 | 🟡 中 | Pre-write URL 格式 validation（`http(s)://` + 合法 facebook.com / fb.com host） |
| 5 | campaign 命名不一致（typo / 格式不統一）| 🟡 中 | 建議 campaign naming convention 文件化；驗 enum / regex；屬 FB-P5-d |
| 6 | UTM 與實際連結不一致 | 🟢 低 | UTM 集中管理於 `promotion.config.json`（per `docs/fb-sidecar-schema.md` §8.3）；`.fb.md` 不寫死 UTM；風險降至最低 |
| 7 | Admin UI 顯示過於雜亂（欄位太多）| 🟡 中 | FB-P5-a 之 polish 含「hide empty fields toggle」+ collapsible postId section |
| 8 | postUrl / postId / postedAt 欄位命名未定導致 migration 成本 | 🟢 低 | per §4.5 命名遷移 cost 已分析；當前 0 個 sidecar 含 fb post 值；migration 可在 P4 落地時一併執行 |
| 9 | 多 FB 貼文 / 多粉專 / A/B title 之單一欄位不足 | 🟡 中 | per §9 中期可改 posts array；當前單一足夠；建議短期不過度設計 |
| 10 | Admin write batch 與 git workflow 衝突（user 同時手動 edit `.fb.md`）| 🔴 高 | 同 admin-2-a §6.8 之 git status check；強制 clean 才允許 write；或顯示 dirty list 讓 user 確認 |
| 11 | atomic rename 失敗（如磁碟空間 / 權限）| 🟡 中 | Try/catch + fallback：fs.unlink temp file；不污染既有 .fb.md |
| 12 | Admin 寫入 .fb.md 後 build-promotion 行為改變未驗 | 🟡 中 | FB-P5-c 之 post-write validate 應 spawn `npm run validate:content` baseline check |
| 13 | UTF-8 encoding 與 LF newline 一致性（per Windows CRLF）| 🟢 低 | fs.writeFile 顯式指定 `utf-8` + 寫入後 normalize newline |

---

## §9 多 FB 貼文情境分析

### 9.1 是否未來需要支援

| 情境 | 短期是否需要 | 中期是否需要 |
|---|---|---|
| 同一篇文章多次 FB 發文 | ❌ 否 | ⚠️ 可能（若作者做「補發」/ retry） |
| 不同粉專同時發文 | ❌ 否 | ⚠️ 可能（per `promotion.config.json` 之 `facebook.pages` 多 page key 設計暗示未來支援多粉專） |
| 不同 audience 之 A/B title | ❌ 否 | ⚠️ 可能（屬 A/B testing 需求） |
| 不同 campaign | ❌ 否 | ⚠️ 可能 |
| 重發 / 補發 | ❌ 否 | ⚠️ 可能 |

### 9.2 短期建議

**維持單一 FB post metadata**（per §3.5 P4 最終建議欄位集合）。理由：
- 當前 4 個 `.fb.md` 中無多次發文情境
- single-post schema 已涵蓋 80% 之 happy path
- 設計成 array 結構增加 schema 複雜度與 Admin UI 顯示成本
- 屬「**未來 add，現在不**」之保守設計（per `feedback_conservative_landing` 偏好）

### 9.3 中期評估方向

當作者實際遇到「補發」/「多粉專同步」之情境時，再考慮：

**Option A**：將 fb post 4 欄位（postUrl / postedAt / postId / campaign）改為 array of object：
```yaml
posts:
  - postUrl: "..."
    postedAt: "..."
    postId: ""
    campaign: "..."
    page: "fan1"
  - postUrl: "..."
    postedAt: "..."
    page: "fan2"
```

**Option B**：保留單一 post + 加 `revisions` / `history` array 紀錄歷史

**Option C**：拆 multi-sidecar（`{slug}.fb.md` / `{slug}.fb.fan2.md` / `{slug}.fb.audience-b.md`）— **不推薦**；違反 1-post-1-sidecar 之既有設計

### 9.4 不過度設計理由

- YAGNI 原則（You Aren't Gonna Need It）：當前 0 個 use case 觸發
- Schema migration 之成本應留待真實需求觸發時付出
- Single-post schema 易理解 / 易實作 / 易驗證

→ **本 P4 建議：維持單一 FB post schema**；多 FB 貼文情境留待**獨立 phase**（FB-P6 或更晚）評估。

---

## §10 建議結論

### 10.1 P4 建議採用的欄位集合

per §3.5：**15-16 個** frontmatter 欄位：

- A 類（5 個）：`enabled` / `status`（新）/ `postedAt` / `postUrl` / `postId`
- B 類（2 個）：`campaign` / `audience`（新）
- C 類（3-4 個）：`title` / `titleEn` / `hashtags` /（可選）`imageUrl`
- D 類（1 個）：`note`
- core 既有（4 個非 A/B/C/D 但保留）：`page` / `target` / `customUrl` / `finalUrl`
- 合計：15 個必選 + 1 個可選

### 10.2 哪些欄位現在可以先保留

per §4.5 命名遷移：**4 個 fb 前綴欄位**（`fbPostUrl` / `fbPostedAt` / `fbPostId` / `fbCampaign`）當前已存在；可在 P4 落地時統一去 fb 前綴；遷移成本極低（當前 0 個 .fb.md 含 fb post 值）。

### 10.3 哪些欄位不要急著做

- **UTM 5 欄位**（source / medium / utmCampaign / utmContent / utmTerm）：**永不**納入 `.fb.md`；UTM 集中於 `promotion.config.json`（per `docs/fb-sidecar-schema.md` §8.3）
- **D 類 createdAt / updatedAt / lastCheckedAt**：應由 git history / build pipeline 自動產生；不需作者手動維護
- **excerpt** / **linkUrl**：與既有 body / `finalUrl` 重疊；不必新增
- **multi-post / multi-page / A/B title schema**：留待真實 use case 觸發（per §9.4）

### 10.4 Admin write 是否應延後

✅ **建議延後至 FB-P5-c**；先做：

- **FB-P5-a** read-only polish（補讀 status / audience / title / hashtags 等顯示）
- **FB-P5-b** dry-run preview（form UI + diff calc；無 fs.write）

兩階段 user UX 驗證後再進 write。對齊 Admin-2-a 之 dry-run → write 拆批模式。

### 10.5 下一批最小可做 phase

依保守原則：

**FB-P5-a**（read-only UI polish；🟢 低風險）
- 補讀 `.fb.md` frontmatter 之 status / title / titleEn / hashtags / audience / page 等
- Admin overview list row 加 1 個 FB status badge
- Admin detail panel "FB Post" section 擴含 §6.2 表列之 9-10 個 row
- 不寫入；不動 validator
- 預估 LOC：loader +~30 / EJS +~50

**FB-P5-b dry-run** 留待 FB-P5-a 完成 + user UX 確認後啟動。

---

## §11 本批不做事項

| # | 項目 | 狀態 |
|---|---|---|
| 1 | 不改 source（`src/**`）| ✅ |
| 2 | 不改 loader / validator / build scripts | ✅ |
| 3 | 不改 Admin UI（`src/views/admin/`）| ✅ |
| 4 | 不改 write flow（FB-P5-c 不啟動）| ✅ |
| 5 | 不改 `.fb.md` 實際資料 | ✅ |
| 6 | 不改 `.fb.md` schema（fb-sidecar-schema.md）| ✅ |
| 7 | 不改 content / fixtures / dist / deploy | ✅ |
| 8 | 不跑 npm run build | ✅ |
| 9 | 不接 FB Graph API | ✅ |
| 10 | 不裁決 multi-post schema | ✅（per §9.4 留至真實需求）|
| 11 | 不啟動 FB-P5-a / P5-b / P5-c / P5-d 任一 sub-batch | ✅ |
| 12 | 不 push | ✅ |

---

## §12 對既有系統之影響

| 維度 | 狀態 |
|---|---|
| `src/**` | ❌ 未動 |
| `content/**` | ❌ 未動 |
| `dist/**` / `dist-blogger/**` | ❌ 未動 |
| Deploy repo | ❌ 未動（HEAD 仍 `4ecd92d`）|
| GitHub Pages 線上 | ❌ 未動 |
| Blogger 後台 | ❌ 未動 |
| validate baseline `0/38/33` | ❌ 預期未動（純 docs 編輯）|
| SEO 系列 commits / docs | ❌ 未動 |
| Admin 既有功能 | ❌ 未動 |
| FB sidecar 之 `.fb.md` 實際資料（4 個 .fb.md）| ❌ 未動 |

---

## §13 邊界聲明

- ✅ 本文件**僅為 P4 pre-analysis**；不改任何 source / loader / Admin UI / write flow / .fb.md 實際資料
- ✅ 本文件**不**啟動 FB-P5-a / P5-b / P5-c / P5-d 任一 sub-batch
- ✅ 本文件**不**裁決欄位命名最終 winner（§4.2 建議去 fb 前綴；user 可決方案 A 保留 / 方案 B 去前綴）
- ✅ 本文件**不**裁決多 FB 貼文 schema 形態（§9.3 列 Option A / B / C；屬未來決策）
- ✅ 本文件**不**動 `.fb.md` schema 文件
- ✅ 本文件**不** push
- ✅ 對齊 `CLAUDE.md` §29「不接 FB API / 不自動社群發文」之預設邊界

---

## §14 Cross-links

- `docs/fb-sidecar-schema.md`（`.fb.md` 既有 schema；§3.1 含 SEO-2-c commit `bdf8fdf` 收編之 4 個 FB post 欄位 + finalUrl；§3.5 含 fb-post-url-metadata-proposal §5 之 P1-P6 roadmap）
- `docs/fb-post-url-metadata-proposal.md`（commit `dbbe002`；P1 已收編 / P2 已 read-only display）
- `docs/admin-2-write-pre-analysis.md`（write strategy B+D+E+F 之 reuse 對象）
- `docs/admin-1-completion-report.md`（read-only 邊界政策）
- `docs/admin-2b1-completion-report.md`（Admin-2-b-1 dry-run viewer pattern）
- Admin 系列 commits：`b676f26` Admin-2-b-1 dry-run viewer / `aa08e66` c-1 read-only fb post display / `be20dbd` c-3 disclaimer drift fix / `101c85d` c-4 FB completeness filter / `bdf8fdf` c-2 schema 收編
- `CLAUDE.md` §29（第一版不做清單）

---

（本文件結束）
