# FB Post URL Metadata Proposal

本文件為 **`.fb.md` sidecar 新增 FB 貼文 URL metadata 欄位**之 proposal。屬規格提案 / 討論性質；**本批不修改既有 schema、不啟動 write、不接 FB API**。

對應上層文件：
- `docs/fb-sidecar-schema.md`（`.fb.md` 既有 schema；§3.1 之 frontmatter 欄位總表）
- `docs/publish-bundle.md`（sidecar bundle 三檔結構）
- `docs/publish-json-schema.md`（`.publish.json` schema；§5.3 Blogger URL 預測禁則之原則同樣適用 FB URL）
- `docs/admin-mvp-pre-analysis.md`（Admin MVP；FB metadata 屬未來編輯候選）
- `docs/admin-2-write-pre-analysis.md`（Admin-2 write surface；§4.1 safe-editable 之未來擴充）
- `CLAUDE.md` §29（第一版不做清單：不接 Blogger API / Google Drive API / 自動社群發文）

---

## §1 背景

### 1.1 使用者需求

使用者於本機完成文章 + 編輯 `.fb.md` 推廣文案後，會手動將 FB 文案複製貼上至 Facebook 後台、按發佈。Facebook 發佈後產生**該則 FB 貼文之獨立 URL**（例：`https://www.facebook.com/{page}/posts/{post-id}` 或 `https://www.facebook.com/share/p/{share-token}/`）。

目前此 URL 沒有任何 metadata 欄位可記錄。後續若要：

- 回查「我這篇文章對應的 FB 貼文在哪裡」
- 在 Admin overview 看到「該文章已發 FB / FB 貼文位址」
- 在某處（如 Blogger 文章底部 / GitHub 文章底部 / 後續報表）反向連結至 FB 貼文
- 對 FB 貼文做事後編輯 / 留言管理 / 刪除追蹤

…都需要先知道該 FB 貼文 URL，目前僅靠使用者自己記憶或在 FB 端搜尋。

### 1.2 目的

提供**單一欄位**記錄 FB 貼文 URL，作為後續所有「快速回查 / Admin 顯示 / 反向連結」之資料來源。

### 1.3 第一階段範圍

- **僅定義 schema 提案**（本 doc）
- **不**改 `.fb.md` 既有 schema
- **不**改 build / promotion / validate
- **不**改 Admin（write 部分）
- **不**接 FB API

---

## §2 重要語意區分（必讀）

本批最容易混淆之處：FB 相關之兩個 URL 概念**截然不同，不可混用**。

| 欄位 | 位置 | 語意 | 來源 | 用途 |
|---|---|---|---|---|
| `finalUrl` | `.fb.md` frontmatter（既存；參見 §6 schema drift） | **FB 貼文 body 裡要放的目標文章 URL**（指向 Blogger / GitHub article）| 由 build 階段依 `target` + `publishedUrl` 推導；或作者手動填 | 提供給 FB 讀者「點此連結看完整文章」之 outbound link |
| `fbPostUrl` | `.fb.md` frontmatter（**本 proposal 新增**）| **FB 貼文本身之 URL**（指向 Facebook 上的這則貼文）| 由使用者於 FB 發佈後手動回填 | 用於 Admin / 報表 / 反向回查；指向 FB 內 |

### 2.1 方向圖示

```
作者準備 FB 文案（.fb.md）
   ↓ 含 placeholder {{ articleUrl }}
build-promotion 解析 placeholder
   ↓ 套入 finalUrl（指向 Blogger / GitHub article）
產出 dist-promotion/facebook/.../{slug}.txt
   ↓ 使用者複製貼到 FB 後台
FB 發佈
   ↓ 產生 FB 貼文 URL（即 fbPostUrl）
使用者手動回填 fbPostUrl 至 .fb.md frontmatter
   ↓
未來 Admin 可顯示；未來可作為反向連結來源
```

### 2.2 簡記

- `finalUrl`：**從 FB 出去**的連結（FB → article）
- `fbPostUrl`：**指回 FB**的連結（任何地方 → 該則 FB 貼文）

兩者不可互填、不可互推導、不可共用同一欄位。Schema validation 與 build 階段都應視為兩個獨立欄位。

---

## §3 建議欄位

放置位置：`.fb.md` frontmatter，與既有 `enabled` / `page` / `target` / `customUrl` / `hashtags` / `title` / `titleEn` / `note` 同層（per `docs/fb-sidecar-schema.md` §3.1）。

### 3.1 欄位定義

| 欄位 | 型別 | 必填 | 預設值 | 說明 |
|---|---|---|---|---|
| `fbPostUrl` | string | 否 | `""` | **FB 貼文本身之 URL**。第一階段由使用者手動回填；發佈前留空字串 |
| `fbPostedAt` | string | 否 | `""` | FB 實際發佈時間。建議格式：`ISO 8601`（如 `2026-05-20T10:30:00+08:00`）或 `YYYY-MM-DD HH:mm`；**canonical 格式留待後續批次決議** |
| `fbPostId` | string | 否 | `""` | optional。若未來接 FB Graph API 才可能使用之 numeric / GUID post ID。第一階段**不依賴**此欄位 |
| `fbCampaign` | string | 否 | `""` | optional。**人工分類標記**用途（如 `book-review-2026q2` / `summer-promo`）。**不**等同 `promotion.config.json` 之 UTM `campaign` 欄位；UTM campaign 由 build 階段依 `promotion.config.json` 動態組裝、寫入 `finalUrl` query；本欄位純為作者後續手動分組 / 報表分類使用 |

### 3.2 與既有欄位 / 設定之分工

| 既有來源 | 既有欄位 | 與本 proposal 之關係 |
|---|---|---|
| `.fb.md` frontmatter | `enabled` / `page` / `target` / `customUrl` / `hashtags` / `title` / `titleEn` / `note` | **不變**；新增 4 欄位於同層 |
| `.fb.md` frontmatter | `finalUrl`（schema drift；參見 §6） | 與 `fbPostUrl` **不同欄位**；不可混用 |
| `promotion.config.json` | `facebook.utm.campaignPattern` / `contentPattern` | UTM 自動組裝；與 `fbCampaign`（人工標記）**不同概念** |
| `promotion.config.json` | `facebook.pages.{key}` | `page` 欄位之合法值來源；本 proposal 不動 |
| `.publish.json` | `blogger.publishedUrl` / `github.publishedUrl` / `blogger.publishedAt` | 屬 article 發佈側；與 FB 貼文發佈側分開；不混用 |

### 3.3 驗證行為（建議）

第一階段建議 validate 行為（**僅建議；本 proposal 不實作**）：

| 條件 | severity |
|---|---|
| 缺欄位（4 欄位全缺） | OK（向後相容；既有 `.fb.md` 不會 break） |
| `fbPostUrl` 非空字串但不是 `http(s)://` 開頭 | warning |
| `fbPostedAt` 非空字串但無法解析為時間 | warning |
| `fbPostId` 非空字串但非 numeric / 非 GUID-like | OK（reserved；第一階段不驗） |
| `fbCampaign` 非空字串 | OK（自由字串） |

severity 規則之**正式**落地時機與 `.fb.md` 既有規則同步（per `docs/fb-sidecar-schema.md` §7.4）；本 proposal 不主張提早。

---

## §4 第一階段不做的事（嚴格邊界）

| # | 項目 | 不做理由 |
|---|---|---|
| 1 | **不做真正儲存** | 本批僅 docs proposal；不改 schema / 不改 loader / 不改 Admin write |
| 2 | **不做 FB API 串接** | 對齊 `CLAUDE.md` §29「不得自動社群發文 / 不接 Blogger API / 不接 Google Drive API」之同類限制 |
| 3 | **不自動抓 FB post URL** | 第一階段 `fbPostUrl` 由使用者手動回填；無 Graph API / 無 scraping |
| 4 | **不把 `fbPostUrl` 寫入 Blogger / GitHub article** | 文章 body / `.md` frontmatter 不引用 `fbPostUrl`；屬 FB sidecar 之私有 metadata |
| 5 | **不影響 sitemap** | `fbPostUrl` 非站內 URL；不入 `sitemap.xml` |
| 6 | **不影響 production dist** | 本 proposal 不改 build pipeline；`dist/` / `dist-blogger/` / `dist-promotion/` 全部不變 |
| 7 | **不擴大 `.fb.md` schema 至本批**（per `docs/fb-sidecar-schema.md` §3.3）| 新增欄位屬規格變更；需先有此 proposal → user 批准 → 後續批次正式落地 |
| 8 | **不啟動 Admin write** | per `docs/admin-2-write-pre-analysis.md` §1.2；FB sidecar write 留至 Admin-2-b-3+ 或更晚 |
| 9 | **不改 `finalUrl` 既有行為** | `finalUrl` schema drift 屬獨立議題（§6）；本 proposal 不修正 |
| 10 | **不接 UTM 自動產出於 `fbPostUrl`** | `fbPostUrl` 是指回 FB 之 URL；不需 UTM；UTM 屬 `finalUrl` 範圍 |

---

## §5 後續可選落地方式（roadmap 候選；非承諾）

依**最小破壞性 / 先讀後寫**原則排序：

### 5.1 階段 P1：schema 正式收編（lowest risk）

- 更新 `docs/fb-sidecar-schema.md` §3.1 之欄位總表，正式加入 `fbPostUrl` / `fbPostedAt` / `fbPostId` / `fbCampaign` 4 欄位（含 §3.2 驗證細節）
- 範本檔 `content/templates/_sample.fb.md`（若存在）同步加入欄位
- **不影響** validate / build / Admin（純文件層）

### 5.2 階段 P2：Admin overview read-only 顯示（low risk）

- `src/scripts/load-admin-posts.js`：讀 `.fb.md` frontmatter 時補抓 `fbPostUrl` / `fbPostedAt` / `fbPostId` / `fbCampaign`（純讀）
- `src/views/admin/index.ejs`：detail panel 之 FB section 加 4 行 read-only 顯示；若欄位不存在顯示 `(empty)` / `not set`
- 沿用 Admin-1 read-only 邊界；無 write button / 無 form submit
- 風險：🟢 低（純 additive；不影響既有 detail 顯示）

### 5.3 階段 P3：Admin completeness 加 FB published 維度（low-medium risk）

- 條件：若 `.fb.md` `enabled === true` 且 article status 為 `published`，但 `fbPostUrl` 為空字串 → `completeness.fbPosted = 'missing'`
- 補入 `completeness` filter optgroup
- 風險：🟡 低-中（會影響既有 completeness 數據；既有 `.fb.md` 都會多一條 missing）
- 前置：必須先做 P1 + P2

### 5.4 階段 P4：Admin dry-run edit / 真實 write（medium risk）

- 沿用 `docs/admin-2-write-pre-analysis.md` §7.2 之 sub-batch 模式
- 先做 dry-run viewer（per Admin-2-b-1 pattern），再做實際 write
- 寫入策略：B（temp + atomic rename）+ D（dry-run default）+ E（pre-write validate）+ F（post-write validate）
- 風險：🟡 中（屬 .fb.md write；單檔 atomic；無 cross-file dependency）

### 5.5 階段 P5（可選）：Blogger / GitHub article 內顯示「也看 FB 貼文」連結

- 條件：若 `fbPostUrl` 非空，於文章底部 partial 加 outbound link
- 影響檔：post-detail.ejs / blogger-post-full.ejs
- 風險：🟡 中（涉及文章 render；需 user 確認 UX 與 placement）
- **非必要**：FB 反向連結屬可選功能；可永久不做

### 5.6 階段 P6（遠期，需 user 啟動）：FB Graph API 自動抓 fbPostUrl

- 需 OAuth / page access token / Graph API call
- 違反 `CLAUDE.md` §29（不接 FB API）之預設邊界
- **第一版 / 第二版均不做**；屬 Z 類（第二階段暫緩）
- 若啟動，須另開 phase 並重新評估隱私 / token 儲存 / API rate limit

---

## §6 Schema drift 補充：既有 `finalUrl` 欄位

### 6.1 觀察

實際 `.fb.md` 檔案中觀察到 `finalUrl` 欄位：

```yaml
# content/blogger/posts/20260515-we-media-myself2.fb.md
---
enabled: true
page: "fan1"
target: "auto"
titleEn: ""
hashtags: [...]
note: "..."
finalUrl: ""   ← 此欄位
---
```

```yaml
# content/github/posts/20260504-github-pages-blog-planning.fb.md
---
...
finalUrl: ""   ← 此欄位
---
```

但 `docs/fb-sidecar-schema.md` §3.1 之欄位總表**未列** `finalUrl`。

### 6.2 性質判定

依 `docs/fb-sidecar-schema.md` §3.3：「frontmatter 不得包含本表以外之欄位。出現未列欄位於 validate 階段列為 warning，不阻擋 build。」

→ `finalUrl` 目前屬「未列欄位 / schema drift」。

### 6.3 可能來源（推測；非定論）

- 過往批次（Phase 8-? 或更早）曾於範本檔加入 `finalUrl` placeholder，但 schema doc 未同步更新
- 或某 build script 曾寫入此欄位作為 cache，後來移除但檔案殘留
- 或屬作者手動補入，作為「最終文章連結」之備忘

### 6.4 與 `fbPostUrl` 之關係（**極重要**）

| 欄位 | 語意 |
|---|---|
| `finalUrl`（既存 drift） | 推測：FB 貼文 body 內要放的**目標文章 URL**（指向 Blogger / GitHub article） |
| `fbPostUrl`（本 proposal） | **FB 貼文本身之 URL**（指向 Facebook 上的這則貼文） |

兩者**完全不同**。`finalUrl` 與 `fbPostUrl` 不可合併、不可互推導。

### 6.5 本批處置

**本 proposal 不做 schema drift 強制修正**。理由：

- 修正 schema drift 屬獨立議題；範圍 = `docs/fb-sidecar-schema.md` schema doc 變更 + 既有 `.fb.md` 檔案處置（保留 / 移除 / 收編）
- 與本 proposal 之 `fbPostUrl` 新增為**兩個獨立 schema 變更**
- 強行合併會擴大本批 surface；違反「最小批次落地」原則

### 6.6 後續處置建議（給未來 schema 整理批次）

- **選項 A：正式收編** `finalUrl` 至 `.fb.md` §3.1，定義其語意為「FB 貼文 body 之 outbound 目標 URL；可手動覆寫 placeholder 推導結果」
- **選項 B：移除** `finalUrl`，要求作者改用 `{{ articleUrl }}` / `{{ blogger.publishedUrl }}` / `{{ github.publishedUrl }}` placeholder（per `docs/fb-sidecar-schema.md` §5.1）
- **選項 C：保留** 為非正式欄位，於 schema doc 中加入「ignored field」備註

任一選項皆屬獨立批次；本 proposal 不裁決。

---

## §7 對既有系統之影響

本 proposal（本批；文件層）之影響：

| 維度 | 狀態 |
|---|---|
| `.fb.md` 既有 schema | ❌ 未動 |
| `.md` frontmatter | ❌ 未動 |
| `.publish.json` schema | ❌ 未動 |
| `content/settings/*.json` | ❌ 未動 |
| `content/templates/*` | ❌ 未動 |
| `src/scripts/build-promotion.js` | ❌ 未動 |
| `src/scripts/validate-content.js` | ❌ 未動 |
| `src/scripts/load-admin-posts.js` | ❌ 未動 |
| Admin overview EJS（本 proposal 範圍）| ❌ 未動（任務 A 屬同批之獨立改動，與本 proposal 不耦合）|
| `dist/` / `dist-blogger/` / `dist-promotion/` | ❌ 未動 |
| Deploy repo | ❌ 未動 |
| GitHub Pages 線上 | ❌ 未動 |
| Sitemap / robots / navigation | ❌ 未動 |

---

## §8 邊界聲明

- ✅ 本文件**僅為 schema proposal**；不改既有 schema / source / build / dist / deploy
- ✅ 本文件**不**啟動 `.fb.md` write
- ✅ 本文件**不**啟動 FB API / scraping / 自動回填
- ✅ 本文件**不**裁決 `finalUrl` schema drift（屬獨立議題）
- ✅ 本文件**不**改變 `docs/fb-sidecar-schema.md` § 3.1 欄位總表
- ✅ 對齊 `CLAUDE.md` §29「不接 Blogger API / Google Drive API / 不自動社群發文」之同類限制

---

## §9 Cross-links

- `docs/fb-sidecar-schema.md`（`.fb.md` 既有 schema；§3.1 / §3.3 / §5 placeholder / §7 severity / §8 promotion.config 分工）
- `docs/publish-bundle.md`（sidecar bundle 三檔結構）
- `docs/publish-json-schema.md`（`.publish.json` schema；§5.3 URL 預測禁則之同類原則）
- `docs/admin-mvp-pre-analysis.md`（Admin MVP；§4 欄位分區）
- `docs/admin-2-write-pre-analysis.md`（Admin-2 write surface + safety plan；§4.1 safe-editable 之未來擴充）
- `docs/admin-1-completion-report.md`（Admin-1 read-only 系列收尾；FB section 既有 read-only 顯示範圍）
- `CLAUDE.md` §29（第一版不做清單：不接 Blogger API / Google Drive API / 自動社群發文）

---

（本文件結束）
