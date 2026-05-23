# 20260523 Admin Overview Audit

本文件為 BLOG 系統 Admin overview 頁（`/admin/index.html`）之 **2026-05-23 audit + 後續改善規劃**；屬 docs-only / read-only；本批 phase `20260523-day-1-batch-3` **不**修改 src / content / template / dist；不 build / 不 deploy / 不 push。

本文件**不取代**既有 admin docs（5/21 audit + 5/22 night report）；屬 night fixes 落地後之新一輪盤點 + 後續 batch 拆分建議。

對應上層：
- `docs/20260521-admin-overview-display-audit.md`（5/21 Admin 顯示一致性 audit）
- `docs/20260522-night-admin-usability-report.md`（5/22 night 5 fixes 落地 report）
- `docs/admin-1-completion-report.md`（Admin Phase 1 完成 report；dev-mode-only Plan B）
- `docs/admin-2b1-completion-report.md`（Admin dry-run editor 規範）
- `docs/admin-2-write-pre-analysis.md`（Admin write pre-analysis）
- `docs/fb-sidecar-write-preflight-decision.md`（FB write preflight；user 8+6 項 checklist）
- `docs/fb-sidecar-schema.md`（FB sidecar 12 read-only 欄位 schema）
- `docs/phase-status-20260523.md` §5（5/23 Phase 1 status audit 之 Admin 維度）
- `CLAUDE.md` §29（第一版不做清單）

---

## 1. Admin 目前定位

### 1.1 性質

| 維度 | 狀態 |
|---|---|
| **Admin 本質** | read-only / dry-run / preview metadata viewer |
| **可新增文章？** | ❌ 不可（無 form / 無 fs.writeFile / 無 server-side endpoint）|
| **可修改文章？** | ❌ 不可（dry-run editor 為純 client-side diff preview；複製後 user 自行於 VS Code 編輯）|
| **真正寫入路徑** | ❌ **完全不存在**；無 form submit / 無 fetch / 無 XHR / 無 localStorage |
| **prod build 是否產出 admin 頁** | ❌ **不產出**（per `admin-1-completion-report.md` Plan B；dev-mode-only）|
| **production 線上是否暴露** | ❌ **不暴露**；即使誤 deploy 亦含 `<meta name="robots" content="noindex,nofollow">` |
| **僅顯示，不寫入之區塊** | 全部 detail panel / dry-run editors / SEO viewer / FB Sidecar Editor / Source path display |

### 1.2 Source of truth 關係

```
本機 content/ markdown + frontmatter + sidecar + JSON settings
   ↓ (load-admin-posts.js)
Admin overview （read-only metadata viewer；dev-mode-only）
   ↓ (user 手動於 VS Code 編輯 source)
本機 content/ 變動
   ↓ (build / validate / deploy 流程)
dist / dist-blogger / GitHub Pages production / Blogger 手動貼文
```

- ✅ **Source of truth** = 本機 `content/` 之 markdown + frontmatter + sidecar
- ✅ Admin 為**讀取面**；非寫入面
- ✅ 任何 metadata 變動皆透過 VS Code 編輯後重 reload Admin viewer
- ❌ Admin **不**為 Blogger / FB / GA4 之中轉前端
- ❌ Admin **不**接 Blogger / Facebook Graph API（per `CLAUDE.md` §29 永不清單）

### 1.3 與 production 之關係

| 線上系統 | Admin 顯示 metadata | 真實線上狀態 |
|---|---|---|
| Blogger 後台 | `.publish.json` 之 `publishedUrl` / `bloggerPostId` | user 手動貼文後回填 |
| GitHub Pages | 自 `settings.site.githubSiteUrl + /posts/{slug}/` 推導之 `previewUrl` | build + deploy 後上線；**Admin 不檢測上線狀態** |
| FB 粉絲頁 | `.fb.md` sidecar 之 `fbPostUrl` / `fbPostedAt` / `fbPostId` | user 手動貼文後回填；**Admin 不接 Graph API** |
| GA4 | ❌ 不接 | per `CLAUDE.md` §29 不做清單 |

→ Admin 顯示**為 source metadata snapshot**；**不**為 production runtime status；user 需於各平台另行驗收。

---

## 2. 目前總覽頁可看到的資訊

### 2.1 Stats cards（5/22 night fixes 後）

當前 **14 張 stat-card**（per `src/views/admin/index.ejs:126-139`）：

| # | 卡名 | 來源 | 5/21 audit 已有 | 5/22 night 新增 |
|---|---|---|---|---|
| 1 | `total posts` | `posts.length` | ✅ | — |
| 2 | `ready` | `byStatus.ready` | ✅ | — |
| 3 | `draft` | `byStatus.draft` | ✅ | — |
| 4 | `published` | `byStatus.published` | ✅ | — |
| 5 | `blogger source` | `srcBlogger` | ✅ | — |
| 6 | `github source` | `srcGithub` | ✅ | — |
| 7 | `blogger enabled` | `bloggerEnabled` | ✅ | — |
| 8 | `github enabled` | `githubEnabled` | ✅ | — |
| 9 | `has .fb.md` | `fbExists` | ✅ | — |
| 10 | `SEO ok` | `seoOk` | ✅ | — |
| 11 | `URL ok` | `urlOk` | ✅ | — |
| 12 | `fb published ok` | `fbPublishedOk` | ✅ | — |
| 13 | **`Missing FB URL`** | `total - fbPublishedOk` | — | ✅（night-3-a commit `0814c05`）|
| 14 | **`Missing Output URL`** | `total - urlOk` | — | ✅（night-3-a 同 commit）|

### 2.2 列表 7 欄表頭

| # | 欄名 | 顯示內容 |
|---|---|---|
| 1 | id / title | title (strong) + titleEn (muted) + id + slug + publishedAt + source 註記 |
| 2 | kind / status | contentKind badge + status badge + source badge + FB derived badge |
| 3 | category / tags | category badge + tag badges（多個）|
| 4 | Blogger | enabled badge + mode badge + published-URL / no-URL badge |
| 5 | GitHub | enabled badge + mode badge（無 URL 第 3 行 badge；per 5/21 audit §3.3 不對稱屬本質限制）|
| 6 | Completeness | 7 個 badge（SEO / FB / Blogger / GitHub / URL / cat-tags / FB pub）|
| 7 | URLs | 📘 Blogger URL（mono）+ 🐙 GitHub URL（mono）|

### 2.3 Detail panel 10 個 section

per 5/21 audit §2.3 + 5/22 night-3-e 新增 warning banner：

| # | section | 欄位 |
|---|---|---|
| 1 | Identity | id / title / titleEn / slug / contentKind / primaryPlatform / sourceSite / status / category / tags |
| 2 | Dates | publishedAt (canonical) / publishedSource / dateIntent / updatedAt |
| 3 | SEO | description / searchDescription / cover / coverAlt |
| 4 | Blogger channel | enabled / mode / blogger.type / blogger.status / blogger.permalink / blogger.publishedUrl |
| 5 | GitHub channel | enabled / mode / github.path / github.previewUrl |
| 6 | FB promotion (.fb.md) | sidecar exists / enabled flag |
| 7 | **FB Post (read-only metadata)** | exists / enabled / status / badge / **fbPostUrl** (linkified) / **fbPostedAt** / campaign / audience / title / titleEn / hashtags / imageUrl / note / **fbPostId** |
| 8 | FB Sidecar Dry-run Editor | 12 個欄位 form + diff（client-side 純 preview）|
| 9 | Related / other links | relatedLinks 數量 + otherLinks 數量 |
| 10 | Completeness summary / Missing fields / Dry-run edit (SEO) / Source path | 6 個 sub-section |
| **+** | **Missing metadata warning banner**（5/22 night-3-e commit `745c48d`）| 條件式 render；7 completeness fields 之 human-readable 名稱 |

### 2.4 Controls

per 5/22 night fixes 後：

| 元件 | 功能 | 落地 |
|---|---|---|
| `🔎 input[search]` | search title / titleEn / slug / category / id / tags（case-insensitive；substring）| 既有 |
| `select#admin-filter` | **6 optgroup**：status (3) / channel (4) / completeness (5) / contentKind (5) / **Category**（動態派生）/ **Series**（架構就位；無 data）| 既有 4 + night-3-c 新增 2 |
| `select#admin-sort` | **3 sort options**：publishedAt desc / updatedAt desc / title asc | night-3-d commit `884437c` |
| `button#admin-show-all-toggle` | 預設隱藏；matchedCount > SHOW_LIMIT (=**30**) 時出現；切 show all / show latest 30 | 既有；night-3-b 將 SHOW_LIMIT 從 20 → 30 |
| `.visible-count` | `showing X of Y matched (Z total)` 三欄計數 | 既有 |
| `isFilterActive` 邏輯 | search / filter active 時不被 SHOW_LIMIT 截斷；toggle 自動隱藏 | night-3-b 新增 |

### 2.5 已顯示之 GA4 / UTM / campaign 欄位

| 欄位 | 顯示位置 | 來源 |
|---|---|---|
| `fbCampaign` | detail panel §7（FB Post）| `.fb.md` sidecar |
| `campaign`（per 文章；建議 frontmatter 欄位）| ❌ 未顯示；當前無 frontmatter `campaign:` schema | 🔵 future |
| `utm_*` 任一參數 | ❌ 不顯示；屬 build 階段 derived | 🔴 不應顯示（per §13 Admin 不接 GA4 報表）|
| GA4 event coverage（某文章是否已對接 click_affiliate_cta / click_related_link 等）| ❌ 未顯示；屬 source code-level concern | 🔵 future |

### 2.6 已顯示之 related / other / hashtag / affiliate metadata

| 欄位 | 顯示位置 | 來源 |
|---|---|---|
| `relatedLinks` 數量 | detail panel §9 | frontmatter |
| `otherLinks` 數量 | detail panel §9 | frontmatter |
| `tags`（即 hashtag）| 列表 #3 欄 + detail §1 | frontmatter |
| `affiliate.enabled` | ❌ 未直接顯示；可從 missing metadata 衍生 | frontmatter |
| `affiliate.links[]` count | ❌ 未顯示 | 🔵 future |
| affiliate provider | ❌ 未顯示 | `content/settings/affiliate-networks.json` + frontmatter `affiliate.links[].network` |

---

## 3. 文章數增加後的痛點

當前文章數 **6 篇**（per `content/{github,blogger}/posts/` 盤點：2 blogger + 4 github，含 .md + draft）；以下為**理論評估**：

### 3.1 規模門檻 vs 痛點

| 文章數 | 當前 default recent N=30 行為 | SSR DOM 規模（含 detail panel）| 主要痛點 | 評估 |
|---|---|---|---|---|
| **≤ 10 篇** | 全顯示；show-all toggle 隱藏 | ~60 nodes | 無 | ✅ 完全可用（當前狀況）|
| **11-30 篇** | 全顯示（≤ N）| ~180 nodes | 無 | ✅ 完全可用 |
| **31-50 篇** | default 30；show-all toggle 出現 | full mode ~300 nodes | 想找 #31-#50 需 toggle | ✅ 可用；toggle 為唯一額外動作 |
| **51-100 篇** | default 30；toggle 可全展 | full mode ~600 nodes | DOM 開始膨脹；search/filter 仍即時 | 🟡 可用但 toggle 後 render 時間明顯 |
| **101-300 篇** | 同上 | full mode ~2000 nodes | search/filter 即時性下降；toggle 後 jank 明顯 | 🟡 需 server-side filter or virtual scroll |
| **300+ 篇** | 同上 | full mode 5000+ nodes | SSR render + 瀏覽器 layout 皆 lag | 🔴 需重寫 pagination 或 windowing |

### 3.2 各 UX 痛點之必要性評估（at current scale）

| 痛點 | 是否需要 | 落地狀態 |
|---|---|---|
| **pagination** | 🔵 future；≥ 100 篇再評估 | ❌ 未實作；採 default recent N + toggle 涵蓋 ≤ 50 篇 |
| **「顯示全部」按鈕** | ✅ 必要（≥ N 篇時觸發）| ✅ 已實作（show-all toggle；N=30）|
| **搜尋** | ✅ 必要（任何規模）| ✅ 已實作（substring on title/titleEn/slug/category/id/tags）|
| **status filter** | ✅ 必要 | ✅ 已實作（ready/draft/published；3 options）|
| **platform filter** | ✅ 必要 | ✅ 已實作（channel optgroup；4 options：Blogger enabled/disabled + GitHub enabled/disabled）|
| **completeness filter** | ✅ 必要 | ✅ 已實作（5 options：SEO/FB/URL/categoryTags/fbPublished missing）|
| **contentKind filter** | ✅ 必要 | ✅ 已實作（5 options：post/page/tech-note/book-review/download）|
| **category filter** | ✅ 已實作 | ✅ night-3-c 動態派生 |
| **series filter** | 🟡 結構就位；無 data | ✅ 架構 ready；待 series.json 補入後自動 surface |
| **tag (hashtag) 多選 filter** | 🔵 nice-to-have；當前 search 可單 tag | ❌ 未實作 |
| **sourceSite filter** | 🔵 nice-to-have；當前 search/detail 可區分 | ❌ 未實作 |
| **fbBadge filter**（none/disabled/posted/ready/missing）| 🔵 nice-to-have；可從 completeness filter 部分覆蓋 | ❌ 未實作 |
| **affiliate enabled filter** | 🔵 nice-to-have | ❌ 未實作 |
| **排序** | ✅ 必要（任何規模）| ✅ 已實作（3 options：publishedAt desc / updatedAt desc / title asc；night-3-d）|

### 3.3 缺漏 filter 之優先級

| Filter | 優先級 | 理由 |
|---|---|---|
| sourceSite | 🟢 high（小修；structure ready）| 既有 `sourceSite` 已在 row class；只需加 filter optgroup ~10 行 |
| fbBadge | 🟢 high（小修）| 既有 `fbBadge` 已在 row class；只需加 filter optgroup |
| affiliate enabled | 🟡 medium | 需新增 `data-affiliate-enabled` attr；非 zero-cost |
| tag 多選 | 🔵 low | 多選需重寫 select / 採 checkbox；屬重要 nice-to-have；非 Phase 1 必要 |

### 3.4 規模壓力預估與「個人 blog」假設

per `phase-status-20260523.md` §5.4 + `20260521-admin-overview-display-audit.md` §5.3：

- 預估**第一階段年度**累積至 **30-80 篇**之區間
- 當前 default recent N=30 + show-all toggle + search/filter/sort 對此規模**已足夠**
- ≥ 100 篇門檻：建議 **再評估 server-side filter or pagination**（非當前必要）

---

## 4. publishedDate 的價值

### 4.1 publishedAt canonical fallback chain

per `load-admin-posts.js` + 5/21 audit §3.4：

```
publishedAt canonical chain：
  1. blogger.publishedAt（per .publish.json）
  2. github.publishedAt（per .publish.json 或推導）
  3. frontmatter.date
  4. fallback empty string
```

對應 `publishedSource` 標記欄位顯示來源（如 `blogger.publishedAt` / `frontmatter.date`）。

### 4.2 publishedDate 在總覽頁的用途

| 用途 | Admin 是否支援 | 評估 |
|---|---|---|
| **判斷文章發布順序** | ✅ default sort = publishedAt desc | ✅ 列表頂部即最新 |
| **判斷系列文是否不照編號發布**（如系列第 3 篇早於第 2 篇）| 🟡 partial；可看 publishedAt 但 series 結構未落地 | 🟡 待 series.json 補入後可判斷 |
| **判斷 FB 是否已發文** | ✅ `fbPostedAt` 欄位（detail panel §7）；FB derived badge（list）| ✅ 完整支援 |
| **判斷 Blogger / GitHub 是否同步**（兩平台 publishedAt diff）| ✅ detail panel §2 Dates section 顯示 publishedSource | ✅ 完整支援 |
| **判斷 sitemap / SEO 更新狀態** | 🟡 partial；可看 `updatedAt`；但 sitemap.xml 之 lastmod 為 build-time | 🟡 user 須額外查 dist/sitemap.xml |
| **relative time 顯示**（如 `5 days ago`）| ❌ 未實作；當前為原樣字串 | 🔵 nice-to-have |

### 4.3 publishedDate 之 source-of-truth 鏈

| 場景 | source | 顯示 |
|---|---|---|
| Blogger 已發布 | `.publish.json` 之 `blogger.publishedAt` | detail panel §2 `publishedAt (canonical)` + `publishedSource` |
| GitHub 已 deploy | `.publish.json` 之 `github.publishedAt` 或推導自 build time | detail panel §2 |
| 尚未發布 | frontmatter `date` 或 frontmatter `updated` | detail panel §2 `dateIntent` |
| FB 已貼文 | `.fb.md` sidecar 之 `fbPostedAt` | detail panel §7 |

→ canonical fallback chain **已**涵蓋當前情境；不需在本批 audit 改動。

---

## 5. FB metadata 回填需求

### 5.1 12 個 FB sidecar 欄位（per `fb-sidecar-schema.md` §3.1 / §3.5）

| # | 欄位 | Admin 當前顯示 | 寫入路徑 | 建議優先級 |
|---|---|---|---|---|
| 1 | `enabled` | ✅ 列表 + detail | 🔴 user VS Code（FB-P5-c 未啟動）| — |
| 2 | `status` | ✅ detail（derived badge）| 同上 | — |
| 3 | `fbPostUrl` | ✅ detail（linkified）| 同上 | ⭐ high（user 回填最頻繁）|
| 4 | `fbPostedAt` | ✅ detail | 同上 | ⭐ high |
| 5 | `fbPostId` | ✅ detail（debug; Graph API 預備）| 同上 | medium |
| 6 | `fbCampaign` | ✅ detail | 同上 | medium |
| 7 | `audience` | ✅ detail | 同上 | low |
| 8 | `title` | ✅ detail | 同上 | low（FB 端 title）|
| 9 | `titleEn` | ✅ detail | 同上 | low |
| 10 | `hashtags` | ✅ detail（badge 列）| 同上 | low |
| 11 | `imageUrl` | ✅ detail（linkified）| 同上 | medium |
| 12 | `note` | ✅ detail | 同上 | low |

→ Admin **顯示完整**；**唯一不足為寫入路徑未啟動**（屬 FB-P5-c phase；需 user 勾 8+6 項 preflight；per `fb-sidecar-write-preflight-decision.md` §7）。

### 5.2 Admin write 啟動條件

per `fb-sidecar-write-preflight-decision.md` §7：

- ❌ **8 項 user preflight checklist 未勾**（含承擔風險 / 接受 Plan B-write / 同意 atomic write 流程等）
- ❌ **6 項前置確認未完成**（含 backup / VS Code reload / dry-run 機制等）
- ❌ FB-P5-c-a server-side dry-run validation endpoint 未實作
- ❌ FB-P5-c-b 真實寫入 未實作

→ **Admin 應只讀取 `.fb.md` sidecar，不直接寫入**；當前狀態符合 Phase 1 邊界。

### 5.3 Admin 作為快速回查 FB 貼文之入口

| 用途 | 當前支援 |
|---|---|
| **從文章 list 找對應 FB 貼文 URL** | ✅ 列表 FB derived badge 顯示是否 posted；detail panel §7 之 fbPostUrl linkified 可點開 |
| **依 fbCampaign 篩選** | ❌ 未實作；當前需 search by campaign 字串 |
| **依 fbBadge 篩選**（如僅顯示 posted / 僅 ready）| ❌ 未實作（per §3.3 缺漏 filter 列）|
| **缺 FB URL 之文章一覽** | ✅ `Missing FB URL` stat-card + completeness filter `fbPublished missing` |
| **依 fbPostedAt 排序** | ❌ 當前 sort 僅含 publishedAt / updatedAt / title；不含 fbPostedAt |

### 5.4 FB metadata 回填之 user workflow

當前流程：

```
1. user 於 FB 粉絲頁發布貼文
2. user 從 FB 後台取得 post URL / post ID
3. user 於 VS Code 開啟對應 .fb.md sidecar
4. user 手動填入 fbPostUrl / fbPostedAt / fbPostId / fbCampaign
5. 儲存 .fb.md
6. reload Admin → 確認 FB derived badge 已升級為 posted
7. （可選）reload 後驗證 missing metadata warning 已消失
```

→ 流程穩定；無寫入風險；屬 Phase 1 保守策略。

未來 FB-P5-c-a / -b 啟動後可由 Admin 之 dry-run editor 直接寫入（atomic temp+rename）。

---

## 6. Blogger / GitHub / FB 數量統計

### 6.1 當前 14 stat-cards 之覆蓋

| 維度 | 當前是否有 stat-card | 維度 |
|---|---|---|
| Blogger 文章數 | ✅ `blogger source` + `blogger enabled` | dual（source vs enabled）|
| GitHub 文章數 | ✅ `github source` + `github enabled` | dual |
| FB 已發文數 | 🟡 partial：`has .fb.md` 顯示 sidecar 存在數；`fb published ok` 顯示 published 滿足條件數（含 disabled 視為 ok）| 非直接「已發 FB 文之文章數」|
| draft / scheduled / published 數 | ✅ `ready` / `draft` / `published` | 3 status |
| 缺 Blogger URL 之文章數 | ✅ `Missing Output URL`（含 GitHub）| combined |
| 缺 GitHub URL 之文章數 | ✅ 同上（combined）| 未拆 |
| 缺 FB URL 之文章數 | ✅ `Missing FB URL` | direct |
| affiliate enabled 數 | ❌ 未統計 | 🔵 future |
| GA4 tracking ready 數 | ❌ 未統計 | 🔵 future（屬 code-level；非 metadata）|

### 6.2 建議新增之 stat-card

| 候選 stat-card | 優先級 | 派生來源 | 預估 LOC |
|---|---|---|---|
| **FB posted ok**（enabled=true && fbPostUrl 已填）| 🟡 medium | `posts.filter(p => p.fb?.enabled && p.fb?.fbPostUrl).length` | ~5 行（loader 新增 derived count + EJS 新增 stat-card）|
| **affiliate enabled** | 🟡 medium | `posts.filter(p => p.affiliate?.enabled).length` | ~5 行（同上）|
| **Missing Blogger URL**（單拆；非 combined）| 🔵 low | `posts.filter(p => p.publishTargets?.blogger?.enabled && !p.blogger?.publishedUrl).length` | ~5 行 |
| **Missing GitHub deploy verification**（單拆；非 combined）| 🔴 deferred；屬本質限制 | github previewUrl 為推導 URL；無法檢測 deploy 真實性 | N/A |
| **GA4 tracking ready** | 🔴 deferred | 屬 source code-level；非 frontmatter | N/A |

### 6.3 stat-card 14 → 17 之擴展風險

| 風險 | 評估 |
|---|---|
| 視覺密度 | 14 → 17 不致破版；Flexbox `flex-wrap` 自然 wrap |
| Tooltip 複雜度 | 每張 stat-card 需獨立 tooltip 解釋；建議 user 表態前不擴展 |
| Loader 改動 | +3 derived counts；屬輕度擴充；無 schema 影響 |
| 文章多時計算成本 | O(n) per stat-card；total O(n × 17) → 對 < 100 篇影響不大 |

→ **建議 stat-card 擴展屬 Phase 2 polish；非 Phase 1 必要**。當前 14 cards 已涵蓋核心痛點。

---

## 7. 建議 UI 結構

### 7.1 既有結構（5/22 night 後）

```
Page header
  ├─ READ-ONLY banner（yellow box）
  └─ Admin meta（dev-mode-only / robots noindex）

Summary cards（14 stat-cards；flex-wrap）

Filter / Controls bar
  ├─ Search input（substring on multiple fields）
  ├─ Filter select（6 optgroup：status / channel / completeness / contentKind / Category / Series）
  ├─ Sort select（3 options）
  ├─ Show-all toggle button（conditional render）
  └─ Visible-count display（showing X of Y matched (Z total)）

Table（list view）
  ├─ Header row（7 columns）
  └─ Body rows
        ├─ Row（click to expand）
        └─ Detail panel（hidden by default；展開後 10 sections + missing warning banner）

Footer
  └─ Boundary statement（無 form / 無 button writes）
```

### 7.2 建議改進區塊（未實作）

per 5/21 audit §8 + 本批 §6.2 / §3.3：

| 區塊 | 改進建議 | 優先級 |
|---|---|---|
| **Summary cards** | 加 FB posted ok / affiliate enabled / Missing Blogger URL 拆分 | 🟡 medium |
| **Filter bar** | 加 sourceSite / fbBadge 兩個 optgroup（zero-cost） | 🟢 high |
| **Search input** | 加 placeholder example 提示（如 `搜尋 title / slug / tag / category`） | 🟢 low（UX 微調）|
| **Table** | URL 欄位 linkify（Blogger / GitHub URL；對齊 FB URL 既有 linkify） | 🟢 high（5/21 S-2 候選）|
| **Detail panel** | 補 affiliate.enabled / affiliate.links count / GA4 event coverage hint（dry-run-style） | 🔵 future |
| **Per-row action links** | 新增 ➜ Blogger / GitHub / dist HTML / copy-helper 之快速連結 | 🔵 future |
| **Metadata completeness indicators** | 既有 7 badge + missing warning banner 已涵蓋 | ✅ 已實作（5/22 night-3-e）|
| **Pagination / show-all toggle** | 既有；N=30；可考慮加 numeric pagination（如 1 / 2 / 3 頁數）為 ≥ 100 篇預備 | 🔵 future |
| **Empty state** | 全篩選後 0 matched 時之 fallback message | 🟡 medium（當前無；應補）|
| **Warning state** | 既有 missing warning banner | ✅ 已實作 |
| **Sort indicator** | sort dropdown 已切換；可加 ↑↓ icon | 🔵 nice-to-have |

### 7.3 建議資訊層級

per Phase 1 邊界：

```
Layer 1（must；at glance）：
  Summary cards
  Search / Filter / Sort bar
  Visible-count display
  Table 7 columns

Layer 2（progressive disclosure）：
  Row click → Detail panel
    ├─ Identity / Dates / SEO / Channel sections
    ├─ FB Post metadata（含 linkified URL）
    └─ Missing warning banner（top）

Layer 3（dry-run only；no write）：
  SEO dry-run viewer（4 fields）
  FB Sidecar dry-run editor（12 fields）
  Source path display（user 自行於 VS Code 開啟）

Layer 4（future；Phase 2）：
  Write surface（FB-P5-c / Admin-2-b-2）
  Per-row action links
  GA4 event coverage indicators
```

---

## 8. 優先級分類

### 8.1 ✅ Must have for Phase 1 close

| # | 項目 | 狀態 |
|---|---|---|
| 1 | 14 stat-cards 完整 | ✅ 完成（含 5/22 night 補的 Missing FB URL / Missing Output URL）|
| 2 | search / 6 filter optgroups / 3 sort options | ✅ 完成 |
| 3 | default recent N=30 + show-all toggle | ✅ 完成 |
| 4 | Detail panel 10 sections + dry-run editors | ✅ 完成 |
| 5 | FB sidecar 12 欄位 read-only 顯示 | ✅ 完成 |
| 6 | Missing metadata warning banner（detail panel）| ✅ 完成（5/22 night-3-e）|
| 7 | Read-only / dry-run safety（banner + robots noindex + dev-mode-only + no write path）| ✅ 完成 |

→ **Phase 1 close 已不依賴任何 Admin 新功能**；當前 Admin 已超越 Phase 1 必要範圍。

### 8.2 🟢 Should improve soon（Phase 1.5 polish；docs-only or 小修）

| # | 項目 | 預估 LOC | 風險 |
|---|---|---|---|
| 1 | **sourceSite filter optgroup** | ~10 行 | 🟢 低（既有 data attr 已就位）|
| 2 | **fbBadge filter optgroup** | ~10 行 | 🟢 低（既有 data attr 已就位）|
| 3 | **Blogger / GitHub URL linkify**（per 5/21 S-2）| ~10 行 | 🟢 低（純 EJS 加 `<a target="_blank" rel="noopener noreferrer">`；對齊 FB URL 既有）|
| 4 | **列表 empty state 文案統一**（per 5/21 S-1）| ~10 行 | 🟢 低（純字串替換）|
| 5 | **stat-card tooltip 文案優化**（per 5/21 S-4）| ~6 行 | 🟢 低（純文案）|
| 6 | **Empty state fallback message**（全篩選 0 matched 時）| ~5 行 | 🟢 低 |
| 7 | **Search placeholder example 提示** | ~3 行 | 🟢 低 |

### 8.3 🟡 Nice to have（Phase 2 candidate）

| # | 項目 | 預估 LOC | 風險 |
|---|---|---|---|
| 1 | FB posted ok stat-card（單獨計數；非 ok 概念）| ~5 行 | 🟡 中（需 user 確認語意；避免與既有 fb published ok 混淆）|
| 2 | affiliate enabled stat-card | ~5 行 | 🟡 中 |
| 3 | Missing Blogger URL / Missing GitHub URL 拆分 stat-card（非 combined）| ~10 行 | 🟡 中（需 user 確認展示密度）|
| 4 | tag 多選 filter（checkbox list）| ~30 行 | 🟡 中（UX 變動較大）|
| 5 | fbPostedAt 排序 option | ~5 行 | 🟢 低 |
| 6 | Sort indicator（↑↓ icon）| ~5 行 | 🟢 低 |
| 7 | Numeric pagination（為 ≥ 100 篇預備）| ~30 行 | 🟡 中（需重寫 SHOW_LIMIT 邏輯）|
| 8 | Per-row action links（dist HTML / copy-helper / VS Code 開啟）| ~20 行 | 🟡 中（含 dist 路徑 hardcode；需審視）|
| 9 | Relative time 顯示（如 `5 days ago`）| ~10 行 | 🟢 低 |

### 8.4 🔵 Phase 2+ 才做

| # | 項目 | 阻擋條件 |
|---|---|---|
| 1 | FB-P5-c-a server-side dry-run validation endpoint | user 勾 8+6 項 preflight |
| 2 | FB-P5-c-b 真實寫入 .fb.md | 同上 + FB-P5-c-a 落地 |
| 3 | Admin-2-b-2 SEO write（寫 .md frontmatter description / searchDescription）| user 表態 |
| 4 | FB-P5-e（new .fb.md create）| FB-P5-c 落地 |
| 5 | Series filter 真實 surface | series.json 補入 + frontmatter series 落地 |
| 6 | GA4 event coverage display（哪些文章已對接 click attr）| 屬 source code-level；需 build 階段 derive |
| 7 | Affiliate.enabled detail 顯示 + provider 顯示 | 屬 Admin polish；無阻擋 |

### 8.5 🔴 不建議現在做

| # | 項目 | 不建議理由 |
|---|---|---|
| 1 | Graph API 接入（即使僅 read） | per `CLAUDE.md` §29 永不清單 |
| 2 | Admin 接 GA4 Data API | 同上；屬會員系統範疇 |
| 3 | Admin 開放公開部署 | 違反 dev-mode-only 設計；Plan B 既定 |
| 4 | 完整 CMS 重寫（multi-user / role-based / draft scheduling 等）| 違反 `CLAUDE.md` §4 第一版技術限制 + §29 |
| 5 | DOM virtual scrolling / 大規模 pagination 重寫 | 當前 6 篇遠未到規模問題；過度工程 |
| 6 | localStorage 寫入（即使僅儲存 UI 狀態如 filter selection）| 與「無寫入路徑」原則衝突；UI 狀態 user 可重設 |
| 7 | 大改 metadata schema（如把 .fb.md 併進 .md frontmatter）| 違反 sidecar 既定設計；per `fb-sidecar-schema.md` |
| 8 | 把 Admin 變成 production editor | 違反 dev-mode-only |

---

## 9. 不建議現在做的項目（明確列）

| # | 項目 | 邊界 |
|---|---|---|
| 1 | **不要現在做真正寫入** | FB-P5-c / Admin-2-b-2 未啟動；user 8+6 項 preflight 未勾 |
| 2 | **不要現在接 GA4 API** | per `CLAUDE.md` §29 |
| 3 | **不要現在做完整 CMS** | per `CLAUDE.md` §4 第一版限制 + §29 不做清單 |
| 4 | **不要現在大改資料結構** | sidecar / frontmatter / settings JSON 之 schema 為 Phase 1 source of truth；改 schema 影響 build / validate / Blogger 已貼文 |
| 5 | **不要現在把 Admin 變成 production editor** | dev-mode-only Plan B 既定；違反此設計需重新評估整體 Phase 1 邊界 |
| 6 | **不要現在加 localStorage / sessionStorage 寫入** | 與 read-only / dry-run 原則衝突 |
| 7 | **不要現在加 Blogger / FB Graph API**（即使僅 read）| per `CLAUDE.md` §29 |
| 8 | **不要現在做 GA4 報表前端** | per §1.3；user 直接 GA4 後台查詢 |
| 9 | **不要現在做 bulk edit** | 屬 write path；違反邊界 |
| 10 | **不要現在開放 Admin 公開部署** | dev-mode-only Plan B；違反 robots noindex 設計初衷 |

---

## 10. 後續實作批次建議

### 10.1 推薦序：🟢 high → 🟡 medium → 🔵 low

per §8 分類；推薦小批次拆法（每批 docs-only or 單檔小修；獨立 commit）：

| Batch ID（建議命名）| 主題 | 範圍 | 預估 LOC | 風險 | 阻擋 |
|---|---|---|---|---|---|
| **A1** | Admin sourceSite filter optgroup | `src/views/admin/index.ejs` filter select + matchesFilter JS | ~10 行 | 🟢 低 | 無 |
| **A2** | Admin fbBadge filter optgroup | 同上 | ~10 行 | 🟢 低 | 無 |
| **A3** | Admin Blogger / GitHub URL linkify | `src/views/admin/index.ejs` URL display blocks | ~10 行 | 🟢 低 | 無 |
| **A4** | Admin 列表 empty state 文案統一 | `src/views/admin/index.ejs` ~7 處字串 | ~10 行 | 🟢 低 | 無 |
| **A5** | Admin stat-card tooltip 文案優化 | `src/views/admin/index.ejs` 4 個 tooltip | ~6 行 | 🟢 低 | 無 |
| **A6** | Admin search input placeholder example | `src/views/admin/index.ejs` | ~3 行 | 🟢 低 | 無 |
| **A7** | Admin empty state fallback message（0 matched）| `src/views/admin/index.ejs` JS + EJS | ~5 行 | 🟢 低 | 無 |
| **B1** | FB posted ok stat-card | loader + EJS | ~5 行 | 🟡 中 | user 確認語意（避免與既有 fb published ok 混淆） |
| **B2** | affiliate enabled stat-card | loader + EJS | ~5 行 | 🟡 中 | user 確認展示需求 |
| **B3** | Missing Blogger URL / Missing GitHub URL 拆分 stat-card | loader + EJS | ~10 行 | 🟡 中 | user 確認 |
| **B4** | fbPostedAt 排序 option | `src/views/admin/index.ejs` sort select + applySort JS | ~5 行 | 🟢 低 | 無 |
| **B5** | Sort indicator（↑↓ icon）| sort select 視覺 | ~5 行 | 🟢 低 | 無 |
| **B6** | Relative time 顯示 | EJS render layer | ~10 行 | 🟢 低 | 無 |
| **C1** | tag 多選 filter（checkbox list）| 大幅 UX 變動 | ~30 行 | 🟡 中 | user 表態 |
| **C2** | Per-row action links（dist HTML / copy-helper / VS Code）| 含 dist 路徑 hardcode | ~20 行 | 🟡 中 | user 表態 |
| **C3** | Numeric pagination（為 ≥ 100 篇預備）| 重寫 SHOW_LIMIT 邏輯 | ~30 行 | 🟡 中 | 當前 6 篇遠未需；evaluate 時機 |
| **D1** | FB-P5-c-a dry-run validation endpoint | server-side route + validation | ~150 行 | 🟡 中 | user 勾 8+6 項 preflight |
| **D2** | FB-P5-c-b 真實寫入 .fb.md | atomic temp+rename write | ~80 行 | 🟡 中 | D1 落地 |
| **D3** | Admin-2-b-2 SEO write（description / searchDescription）| 同 D2 pattern | ~80 行 | 🟡 中 | user 表態 |
| **D4** | FB-P5-e new sidecar create | new file 寫入 | ~80 行 | 🟡 中 | D2 落地 |

### 10.2 推薦今日 / 近期可啟動

⭐ **推薦最高**：**A1（sourceSite filter）** 或 **A3（URL linkify）**

理由：
- 🟢 風險最低（單檔小修；零 loader 改動）
- A1 利用既有 `sourceSite` data attr；zero-cost
- A3 利用既有 Blogger / GitHub URL；對齊 FB URL 既有 linkify
- 完成後可繼續 A2-A7 序列
- 不阻擋任何 Phase 2 批次

⭐ **推薦第二**：**B4（fbPostedAt 排序 option）** 或 **B5（Sort indicator）**

### 10.3 不推薦今日啟動

| 項目 | 不推薦理由 |
|---|---|
| B1-B3（stat-card 擴展）| 需 user 確認語意與展示密度；今日 docs-only batch 不適合啟動 source 改動 |
| C1（tag 多選 filter）| UX 變動較大；需 user 表態 |
| C2（per-row action links）| 含 dist 路徑 hardcode；需審視；非當前 ROI 重點 |
| C3（numeric pagination）| 當前 6 篇遠未需 |
| D1-D4（FB write series）| 屬 Phase 2 high-sensitivity；需 user 勾 preflight |

### 10.4 與其他 Phase 之依賴

| Admin batch | 阻擋於 | 阻擋條件 |
|---|---|---|
| A1-A7 | 無 | 任何時候可啟動 |
| B1-B6 | user 表態（語意 / 展示需求）| 完成 A 系列後可逐次 evaluate |
| C1-C3 | user 表態 | UX 變動較大；需明示啟動 |
| D1 | user 勾 8+6 項 preflight | per `fb-sidecar-write-preflight-decision.md` §7 |
| D2 | D1 落地 + user 再次確認 | 同上 + atomic write 流程確認 |
| D3 | user 表態 | per `admin-2-write-pre-analysis.md` §7.2 |
| D4 | D2 落地 + user new sidecar template 決議 | per `fb-sidecar-write-preflight-decision.md` §3.6 |

---

## 11. 本批不做事項

per spec：

- ❌ 不修改 `src/views/admin/index.ejs`
- ❌ 不修改 `src/scripts/load-admin-posts.js`
- ❌ 不修改任何 EJS template / SCSS
- ❌ 不修改 `content/` / `dist/` / `dist-blogger/`
- ❌ 不修改 deploy repo
- ❌ 不跑 `npm run build` / `npm run dev` / `npm run validate:content`
- ❌ 不 push
- ❌ 不 deploy
- ❌ 不啟動任何 A / B / C / D 批次

---

## 12. Cross-links

### 12.1 既有 Admin docs

- `docs/admin-1-completion-report.md`（Admin Phase 1 完成；dev-mode-only Plan B）
- `docs/admin-1-readonly-preflight.md`（Admin Phase 1 preflight）
- `docs/admin-2b1-completion-report.md`（dry-run editor 規範）
- `docs/admin-2-write-pre-analysis.md`（Admin write pre-analysis；§4.1 safe-editable subset；§7.2 SEO write 規範）
- `docs/admin-mvp-pre-analysis.md`（Admin MVP pre-analysis）
- `docs/admin-local-boundary-pre-analysis.md`（Admin local boundary）
- `docs/admin-platform-routing-extension-plan.md`（Admin platform routing extension）
- `docs/20260521-admin-overview-display-audit.md`（5/21 顯示一致性 audit）
- `docs/20260522-night-admin-usability-report.md`（5/22 night 5 fixes 落地 report）

### 12.2 相關 schema docs

- `docs/fb-sidecar-schema.md`（FB sidecar 12 read-only 欄位 schema）
- `docs/fb-sidecar-metadata-pre-analysis.md`（derived badge 規則）
- `docs/fb-sidecar-write-preflight-decision.md`（FB write user 8+6 項 preflight）
- `docs/fb-sidecar-write-safety.md`（FB write safety analysis）
- `docs/fb-post-url-metadata-proposal.md`（FB post URL metadata proposal）
- `docs/publish-json-schema.md`（`.publish.json` schema；含 publishedUrl / bloggerPostId）
- `docs/publish-bundle.md`（publish bundle 規範）
- `docs/book-schema.md`（book metadata）

### 12.3 上層 Phase docs

- `docs/phase-status-20260523.md` §5（5/23 Phase 1 Admin 維度盤點）
- `docs/phase-1-completion-report.md`
- `docs/phase-1-completion-checklist.md`
- `docs/phase-1-user-operation-guide.md` §4（Admin 操作手冊）
- `docs/phase-2-candidate-roadmap.md` §1.3 / §2.3 / §2.6（Phase 2 候選；含 FB write 系列）
- `docs/20260522-pm-phase-2-batch-plan.md`
- `docs/20260522-eod-report.md`

### 12.4 規範來源

- `CLAUDE.md` §1（本機資料夾型 CMS 定位）/ §4（第一版技術限制）/ §29（第一版不做清單）/ §30（最終樣貌）
- `docs/system-direction.md`（BLOG 系統整體方向）

### 12.5 Source code refs

- `src/views/admin/index.ejs`（861 行；含 inline `<style>` + EJS render + client-side JS）
- `src/scripts/load-admin-posts.js`（267 行；loader + completeness + derived badge + sort）

---

（本文件結束）
