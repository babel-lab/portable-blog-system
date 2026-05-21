# 20260521 Admin Overview Display Audit

本文件為 **Phase 20260521-am-3 / C-4** 之 Admin 總覽顯示一致性 read-only 審計。屬純 audit / pre-analysis 性質；**本批不修改任何 source / Admin UI / build / dist / deploy**。

對應上層：
- `docs/README.md` §5 — Admin 總覽機制摘要
- `docs/phase-1-user-operation-guide.md` §4 — Admin 總覽操作手冊
- `docs/phase-2-candidate-roadmap.md` §1.3 — FB completeness 條件式候選 / §2.3 Admin SEO write
- `docs/fb-sidecar-schema.md` §3.1 / §3.5 — FB sidecar 12 個 read-only 欄位 schema
- `docs/fb-post-url-metadata-proposal.md` — FB post URL metadata proposal
- `docs/fb-sidecar-metadata-pre-analysis.md` §3 / §6 — derived badge 規則
- `docs/admin-2-write-pre-analysis.md` §4.1 — safe-editable subset
- `CLAUDE.md` §29 — 第一版不做清單

審計對象（read-only sources）：
- `src/views/admin/index.ejs`（759 行；含 inline `<style>` + EJS render + client-side JS）
- `src/scripts/load-admin-posts.js`（249 行；loader + completeness + sort）
- `content/blogger/posts/` × 2 md + 1 sidecar
- `content/github/posts/` × 2 md + 1 sidecar

---

## 1. Scope

### 1.1 In-scope

- Admin overview 頁（`/admin/index.html`；dev-mode-only；prod build 不產出）顯示欄位完整盤點
- Blogger / GitHub 兩種來源（`sourceSite`）+ publishTargets 兩種啟用（`publishTargets.{blogger,github}.enabled`）之顯示一致性
- FB sidecar metadata（12 個 read-only 欄位 + derived badge）之顯示狀態
- counts / filters / search / pagination 之 UX 評估
- read-only / dry-run safety 邊界檢查（無寫入意外暴露）
- 後續小修候選分類（🟢 / 🟡 / 🔴）

### 1.2 Out-of-scope

- 任何 source / template / build / deploy 改動（本批 spec 禁修）
- write surface 設計（屬 Admin-2-b-2 / FB-P5-c phase）
- Graph API 接入（屬 §29 永不清單）
- 視覺重排 / SCSS refactor（屬 DS-3 後續）

### 1.3 邊界聲明

本 audit **僅讀**現況 + 對齊既有 docs；不擅自更動實作；不啟動任何 write phase；不修 roadmap；不修 README。

---

## 2. Current Admin Overview Fields

### 2.1 Stats cards（總覽頂部統計區）

共 **12 張 stat-card**：

| # | 卡名 | 來源 | 備註 |
|---|---|---|---|
| 1 | `total posts` | `posts.length` | 全部來源加總（blogger source + github source）|
| 2 | `ready` | `byStatus.ready` | `frontmatter.status === 'ready'` |
| 3 | `draft` | `byStatus.draft` | `frontmatter.status === 'draft'` |
| 4 | `published` | `byStatus.published` | `frontmatter.status === 'published'` |
| 5 | `blogger source` | `srcBlogger` | `sourceSite === 'blogger'`；tooltip 解釋與 enabled 不同 |
| 6 | `github source` | `srcGithub` | `sourceSite === 'github'`；tooltip 解釋與 enabled 不同 |
| 7 | `blogger enabled` | `bloggerEnabled` | `publishTargets.blogger.enabled === true`；tooltip 解釋與 source 不同 |
| 8 | `github enabled` | `githubEnabled` | `publishTargets.github.enabled === true`；tooltip 解釋與 source 不同 |
| 9 | `has .fb.md` | `fbExists` | sidecar 檔存在 |
| 10 | `SEO ok` | `seoOk` | `completeness.seo === 'ok'`（description + searchDescription 都有值）|
| 11 | `URL ok` | `urlOk` | `completeness.url === 'ok'`（至少一邊有 published / preview URL）|
| 12 | `fb published ok` | `fbPublishedOk` | `completeness.fbPublished === 'ok'`（per docs/fb-sidecar-schema.md §3.5.5 P3；fb.enabled=false 或 fbPostUrl/fbPostedAt 有值）|

### 2.2 列表表頭欄位

共 **7 欄**：

| # | 欄名 | 顯示內容 |
|---|---|---|
| 1 | id / title | title (strong) + titleEn (muted) + id + slug + publishedAt (+ source 註記) |
| 2 | kind / status | contentKind badge + status badge (+ source: blogger/github) + FB derived badge |
| 3 | category / tags | category badge + tag badges（多個）|
| 4 | Blogger | enabled badge + mode badge + published-URL/no-URL badge |
| 5 | GitHub | enabled badge + mode badge（**無 URL 狀態列**；見 §3）|
| 6 | Completeness | 7 個 badge（SEO / FB / Blogger / GitHub / URL / cat-tags / FB pub）|
| 7 | URLs | 📘 Blogger URL + 🐙 GitHub URL（皆 mono）|

### 2.3 Detail panel 欄位（點 row 展開）

共 **10 個 detail-section** + 12 fb dry-run + 4 SEO dry-run：

| # | section | 欄位 |
|---|---|---|
| 1 | Identity | id / title / titleEn / slug / contentKind / primaryPlatform / sourceSite / status / category / tags |
| 2 | Dates | publishedAt (canonical) / publishedSource / dateIntent / updatedAt |
| 3 | SEO | description / searchDescription / cover / coverAlt |
| 4 | Blogger channel | enabled / mode / blogger.type / blogger.status / blogger.permalink / blogger.publishedUrl |
| 5 | GitHub channel | enabled / mode / github.path / github.previewUrl |
| 6 | FB promotion (.fb.md sidecar) | sidecar exists / enabled flag |
| 7 | FB Post (read-only metadata) | exists / enabled / status / badge / fbPostUrl / fbPostedAt / campaign / audience / title / titleEn / hashtags / imageUrl / note / fbPostId |
| 8 | FB Sidecar Dry-run Editor | 12 個欄位 form + dry-run diff（client-side 純 preview）|
| 9 | Related / other links | relatedLinks 數量 + otherLinks 數量 |
| 10 | Completeness summary / Missing fields / Dry-run edit (SEO) / Source path | 6 個 sub-section |

### 2.4 Controls（搜尋 + 篩選 + show-all）

| 元件 | 功能 |
|---|---|
| `🔎 input[search]` | search title / titleEn / slug / category / id / tags（case-insensitive；前端 substring match）|
| `select#admin-filter` | 4 optgroup：status (3) / channel (4) / completeness (5) / contentKind (5)|
| `button#admin-show-all-toggle` | 預設隱藏；matchedCount > SHOW_LIMIT (20) 時出現；切換 show all / show latest 20 |
| `.visible-count` | `showing X of Y matched (Z total)` 三欄計數 |

### 2.5 Edit / preview / copy helper 入口

| 入口 | 狀態 |
|---|---|
| Detail panel `Source path` 顯示完整 mdPath | ✅ 純文字；無連結；user 自己用 VS Code 打開 |
| Blogger `publishedUrl` / `permalink` | ✅ 純文字 mono 顯示；**未** linkify |
| GitHub `previewUrl` / `path` | ✅ 純文字 mono 顯示；**未** linkify |
| FB `fbPostUrl` / `fbImageUrl` | ✅ **有** linkify（`<a target="_blank" rel="noopener noreferrer">`）|
| dist-blogger `post.html` / `copy-helper.txt` 入口 | ❌ Admin 總覽**未提供** |
| 直接編輯 .md / .fb.md 入口 | ❌ Admin 總覽**未提供**；只能 `Source path` 顯示後 user 用 VS Code 打開 |
| Apply / Save / Submit / Write button | ❌ **不存在**；read-only banner 明示 |

### 2.6 Read-only / dry-run safety 顯示

| 機制 | 位置 | 效果 |
|---|---|---|
| `🔒 READ-ONLY ADMIN` banner | 頁首 yellow box | 明示「本機開發檢視；不公開；不寫入；不部署；prod build 不產出」|
| dev-mode-only（Plan B）| `.admin-meta` | 「模式：dev-mode-only（Plan B；prod build 跳過）」|
| `<meta name="robots" content="noindex, nofollow">` | `<head>` | 即使誤部署也不被搜尋引擎收錄 |
| SEO Dry-run viewer warning | yellow dashed box | `⚠️ Dry-run only. No file will be written.` |
| FB Sidecar Dry-run Editor warning | blue dashed box | `⚠️ Dry-run only. No file will be written.` × 2（form + result 各一）|
| postId 顯示備註 | mono small text | `(debug; Graph API 預備)` |
| 邊界說明（頁尾）| `.admin-meta` | 「本頁屬 read-only；無 form / 無 button writes」|

---

## 3. Blogger / GitHub Display Consistency

### 3.1 欄位命名一致性 ✅（大部分）

| 維度 | Blogger | GitHub | 一致？ |
|---|---|---|---|
| stat-card `* source` | ✅ blogger source | ✅ github source | ✅ |
| stat-card `* enabled` | ✅ blogger enabled | ✅ github enabled | ✅ |
| 列表欄 enabled badge | ✅ enabled / disabled | ✅ enabled / disabled | ✅ |
| 列表欄 mode badge | ✅ blogger.mode | ✅ github.mode | ✅ |
| 列表欄 URL 狀態 | ✅ published / no URL | ❌ **無**對應 | ❌ 不對稱（見 §3.3）|
| URLs 欄圖示 | 📘 | 🐙 | ✅ |
| detail panel publishedUrl | ✅ blogger.publishedUrl | ❌ **不存在** github.publishedUrl（用 previewUrl 推導）| 🟡 概念不對稱 |
| completeness badge | ✅ Blogger ok/missing | ✅ GitHub ok/missing | ✅ |
| missingFields 邏輯 | ✅ enabled + 無 publishedUrl → missing | ❌ 不檢查 github URL（only `url` 維度檢查兩邊任一）| 🟡 不對稱 |

### 3.2 empty state 一致性

| 場景 | 顯示 | 一致？ |
|---|---|---|
| 文章無 title | `(no title)` (italic muted) | — |
| 文章無 id | `no-id` (mono muted) | — |
| 文章無 slug | `—` | — |
| 文章無 publishedAt | `no date` | — |
| 文章無 category | `no category` badge | — |
| 文章無 tags | `no tags` badge | — |
| 文章無 contentKind | `no kind` badge | — |
| Blogger 無 publishedUrl | `no URL` badge | 與 GitHub 不對稱（GitHub 無對應 badge）|
| URLs 欄兩邊都無 | `—` | — |
| detail panel 各欄位 empty | `(empty)` (italic muted) | ✅ 統一 |

**發現**：列表欄之 empty state **不統一**（`(no title)` / `no-id` / `—` / `no date` / `no category` / `no tags` / `no kind` 7 種文案）；detail panel **統一**用 `(empty)`。屬輕度 drift；不影響功能。

### 3.3 主要不對稱：GitHub 缺 URL 狀態 badge

**現象**：
- 列表「Blogger」欄：enabled + mode + **published/no-URL badge** 三層
- 列表「GitHub」欄：enabled + mode **無第三層** URL 狀態

**原因**：
- Blogger publishedUrl 來自 `.publish.json`，作者**發佈後手動回填**之**真實 URL**
- GitHub previewUrl 是 `loadAdminPosts` 由 `settings.site.githubSiteUrl + /posts/{slug}/` **自動推導**之**預測 URL**（不保證已發佈）
- 兩者語意不同 → 不能假裝對稱

**評估**：合理但不直觀。user 若僅看列表會以為 GitHub 從不缺 URL，實際上 previewUrl 可能指向尚未部署之路徑。`completeness.github` 邏輯（disabled 視為 ok；enabled 且 slug 推導出 previewUrl 視為 ok）會在「slug 缺漏 + enabled」時抓到，但不會抓「slug 有 + 尚未部署到 GitHub Pages」之狀況。

### 3.4 日期格式一致性 ✅

| 欄位 | 來源 | 格式 | 一致？ |
|---|---|---|---|
| `publishedAt` (列表) | canonical fallback chain | 原樣字串顯示（如 `2026-05-04`）| ✅ |
| `publishedAt (canonical)` (detail) | 同上 | mono 原樣 | ✅ |
| `publishedSource` | canonical chain 來源標記 | mono 原樣（如 `blogger.publishedAt` / `github.publishedAt` / `frontmatter.date`）| ✅ |
| `dateIntent` | `frontmatter.date` | mono 原樣 | ✅ |
| `updatedAt` | `frontmatter.updated` | mono 原樣 | ✅ |
| `fbPostedAt` | `.fb.md` frontmatter | mono 原樣（ISO 8601 或 `YYYY-MM-DD HH:mm` placeholder）| ✅ |

**發現**：所有日期皆**原樣顯示**；沒有強制 timezone / locale formatting；對 read-only audit 是合理選擇（保留作者意圖）。

### 3.5 target / rel 安全屬性審計

| 連結 | href | target | rel | 評估 |
|---|---|---|---|---|
| `fbPostUrl` (detail panel) | `<a href="<%= p.fbPostUrl %>" target="_blank" rel="noopener noreferrer">` | ✅ `_blank` | ✅ `noopener noreferrer` | ✅ 對；不需 `nofollow`（admin 內部頁；非公開）|
| `fbImageUrl` (detail panel) | 同上 | ✅ `_blank` | ✅ `noopener noreferrer` | ✅ 對 |
| Blogger `publishedUrl` (URLs 欄 + detail) | **未 linkify** | n/a | n/a | 🟡 純文字顯示（user 須複製貼到瀏覽器）|
| GitHub `previewUrl` (URLs 欄 + detail) | **未 linkify** | n/a | n/a | 🟡 純文字顯示 |
| Blogger `permalink` (detail) | **未 linkify** | n/a | n/a | 🟡 純文字顯示 |
| `github.path` (detail) | **未 linkify** | n/a | n/a | 🟡 純文字顯示（相對路徑；本來就不該 linkify 至外部）|

**發現**：FB 兩個連結 linkify 一致正確；Blogger / GitHub 之 URL 全部未 linkify（user 須手動複製）。這是「保守 admin」之合理選擇但可能想改進（屬 §8 候選）。

---

## 4. FB Sidecar Metadata Display

### 4.1 12 個 read-only 欄位（per docs/fb-sidecar-schema.md §3.1 / §3.5）

| # | 欄位 | loader 邏輯 | 顯示位置 | 顯示狀態（當前 fixtures）|
|---|---|---|---|---|
| 1 | `enabled` | `Boolean(data?.enabled)` | 列表 FB badge + detail | ✅ 兩 fixture 都 `enabled: true` |
| 2 | `status` | `strOrEmpty(data?.status)` | 列表 FB badge（derived）+ detail | ❌ 兩 fixture 都 **無此欄**（loader 回 `''`）|
| 3 | `fbPostUrl` | `strOrEmpty(data?.fbPostUrl)` | detail（linkified）| ❌ 兩 fixture 都 **無此欄** |
| 4 | `fbPostedAt` | `strOrEmpty(data?.fbPostedAt)` | detail | ❌ 兩 fixture 都 **無此欄** |
| 5 | `fbPostId` | `strOrEmpty(data?.fbPostId)` | detail (debug)| ❌ 兩 fixture 都 **無此欄** |
| 6 | `fbCampaign` | `strOrEmpty(data?.fbCampaign)` | detail | ❌ 兩 fixture 都 **無此欄** |
| 7 | `audience` | `strOrEmpty(data?.audience)` | detail | ❌ 兩 fixture 都 **無此欄** |
| 8 | `title` | `strOrEmpty(data?.title)` | detail | ❌ 兩 fixture 都 **無此欄** |
| 9 | `titleEn` | `strOrEmpty(data?.titleEn)` | detail | 🟡 兩 fixture 都有欄位但 value=空字串 |
| 10 | `hashtags` | `normHashtags(data?.hashtags)` | detail（badge 列）| ✅ 兩 fixture 都有 4-5 個 hashtag |
| 11 | `imageUrl` | `strOrEmpty(data?.imageUrl)` | detail（linkified）| ❌ 兩 fixture 都 **無此欄** |
| 12 | `note` | `strOrEmpty(data?.note)` | detail | ✅ 兩 fixture 都有 placeholder note |

**發現**：當前 fixtures **無一筆**包含 8 個 fb post URL metadata 欄位（fbPostUrl / fbPostedAt / fbPostId / fbCampaign / status / audience / title / imageUrl），導致：
- Admin overview 顯示路徑（populated state）**未經實際資料驗證**
- 只能透過 dry-run editor 之 input field 模擬填入 → render diff 體驗
- `fbPublished` completeness 在當前 fixtures 全部呈 `missing`（enabled=true 但無 fbPostUrl / fbPostedAt）

### 4.2 derived badge 規則一致性 ✅

per `docs/fb-sidecar-metadata-pre-analysis.md` §6.2 + loader `deriveFbBadge`：

| 條件 | badge | class |
|---|---|---|
| `!exists` | `none` | b-info（grey）|
| `exists && !enabled` | `disabled` | b-info（grey）|
| `enabled && (status === 'posted' \|\| postUrl)` | `posted` | b-published（green）|
| `enabled && status === 'ready'` | `ready` | b-ready（blue）|
| `enabled && status === '<other>'` | `<other>` | b-draft（yellow）|
| `enabled && !status && !postUrl` | `ready` (default) | b-ready（blue）|

**發現**：列表欄與 detail panel 之 derived badge 用**同一邏輯**（兩處都從 `p.fbBadge` 讀），無 drift。

### 4.3 read-only 真正性檢查 ✅

| 檢查項 | 結果 |
|---|---|
| Admin overview 是否有 `<form>` 元素？ | ❌ 無 |
| 是否有 `submit` button / `type="submit"`？ | ❌ 無 |
| 是否有 `fetch` / `XMLHttpRequest` / `XHR`？ | ❌ 無（grep `src/views/admin/index.ejs` 結果為 0）|
| 是否有 `fs` / `writeFile` / `localStorage` 寫入？ | ❌ 無 |
| Apply / Save / Write button？ | ❌ 無 |
| Cancel button？ | ✅ 有（屬純 UI 收合；不寫入）|
| Show Diff button？ | ✅ 有（純 client-side compute；不寫入）|
| `data-fb-input` / `data-input` 之 readonly 屬性？ | ❌ 未加（但無 form submit 故無實質影響）|

**結論**：✅ Admin 嚴格 read-only / dry-run only；無寫入路徑暴露。

---

## 5. Counts / Filters / Pagination Assessment

### 5.1 Counts 區分清晰度

| 概念 | 來源 | 當前是否能清楚看出？ |
|---|---|---|
| all posts count | stat-card 1 (`total posts`) | ✅ 是 |
| Blogger source count | stat-card 5 (`blogger source`) | ✅ 是（有 tooltip 區分 source / enabled）|
| GitHub source count | stat-card 6 (`github source`) | ✅ 是 |
| Blogger enabled count | stat-card 7 (`blogger enabled`) | ✅ 是 |
| GitHub enabled count | stat-card 8 (`github enabled`) | ✅ 是 |
| filtered count | `.visible-count` `showing X of Y matched (Z total)` | ✅ 三欄並列；非常清楚 |

**潛在 confusion 點**：
- `source` 與 `enabled` 兩個概念對非工程師可能不直觀（雖有 tooltip）
- 用戶可能誤以為「blogger source = 5 篇 → blogger 站有 5 篇文章」，但實際上 blogger source 5 篇之中可能只有 3 篇 `publishTargets.blogger.enabled=true`

### 5.2 Filters 完整性

| Filter 群組 | 選項 | 評估 |
|---|---|---|
| status (3) | ready / draft / published | ✅ 完整 |
| channel (4) | Blogger enabled / disabled / GitHub enabled / disabled | ✅ 完整 |
| completeness (5) | SEO / FB / URL / cat-tags / FB published missing | ✅ 完整 |
| contentKind (5) | post / page / tech-note / book-review / download | ✅ 完整（覆蓋 CLAUDE.md §11 列舉值）|

**缺少之 filter**（屬 nice-to-have）：
- `sourceSite` filter（blogger vs github source）→ 目前只能透過 search 或 detail 點開看
- `fbBadge` filter（none / disabled / posted / ready / 其他）→ 目前無；只能透過 detail 看
- `tags` 多選 filter → 目前無；只能 search 單個 tag
- `category` filter → 目前無；只能 search

### 5.3 Pagination / show-all 行為

當前實作（per `index.ejs` line 519-582）：
- `SHOW_LIMIT = 20`
- 預設只顯示 latest 20（per publishedAt desc + id desc fallback）
- `matchedCount > 20` 時 toggle button 出現
- toggle 「Show all」 / 「Show latest 20」

**規模壓力測試（理論評估；未實跑）**：

| posts 數 | 渲染行為 | UX 評估 |
|---|---|---|
| 0 | 顯示 `empty` 提示；無 table | ✅ |
| 1-19 | 全顯示；無 toggle | ✅ |
| 20 | 全顯示；無 toggle（matchedCount === LIMIT 不觸發）| ✅ |
| 21-50 | 預設 20；toggle 出現；show all 可全展 | ✅ |
| 51-100 | 預設 20；toggle 出現；show all 後 100 row HTML 已全 SSR 渲染（CSS hidden） | 🟡 SSR HTML size 上升；瀏覽器 DOM 元素數量上升至 ~600 nodes（每 row 含 detail panel）；仍可用 |
| 101-300 | 同上；DOM ~2000 nodes | 🟡 開始有可感知 lag；search/filter 仍即時 |
| 300+ | 同上；DOM 5000+ nodes | 🔴 SSR 時間 + 瀏覽器渲染明顯 lag；search 即時性下降 |

**註**：當前 fixtures 共 **4 篇** post（2 blogger + 2 github）；遠未達壓力測試門檻。

---

## 6. Read-only / Dry-run Safety Check

### 6.1 寫入暴露面盤點

| 暴露面 | 狀態 | 證據 |
|---|---|---|
| 後端寫入 endpoint | ❌ 無 | Admin 屬 Vite SSR 靜態頁；無 server-side route |
| 前端 fetch / XHR | ❌ 無 | grep 結果為 0 |
| `<form>` 元素 | ❌ 無 | EJS 內無 `<form` tag |
| `type="submit"` button | ❌ 無 | 所有 button 都 `type="button"` |
| localStorage / sessionStorage | ❌ 無 | grep 結果為 0 |
| fs API | ❌ 無（browser 端不可能）| n/a |
| dist build 產出（prod）| ❌ 不產出 | `build-github.js --mode=build` 跳過 admin 頁 |
| dev mode 顯示 | ✅ 唯一可見路徑 | `npm run dev` 後 `/admin/` |

### 6.2 顯示狀態安全 ✅

- ✅ Banner 強調 read-only
- ✅ Robots `noindex, nofollow`
- ✅ dev-mode-only 標示
- ✅ Dry-run editor warning × 4 處（SEO viewer 開始 + result；FB editor 開始 + result）
- ✅ postId 標示為「Graph API 預備 debug」

### 6.3 dry-run editor 邊界

| editor | 12 fields / 4 fields | 寫入路徑？ |
|---|---|---|
| SEO dry-run viewer | 4 fields (description / searchDescription / titleEn / coverAlt) | ❌ 純前端 diff；無 fetch / 無 fs |
| FB Sidecar dry-run editor | 12 fields | ❌ 純前端 diff + simulated frontmatter preview；無 fetch / 無 fs |

兩者 diff 結果**僅 render 至 DOM**；user 須手動複製 → 編輯 source file。屬安全設計。

---

## 7. Risks and Drift

### 7.1 已知 drift（**不在本批修正**）

| # | drift | 嚴重 |
|---|---|---|
| D-1 | 列表 empty state 文案不統一（7 種：`(no title)` / `no-id` / `—` / `no date` / `no category` / `no tags` / `no kind`；detail panel 統一用 `(empty)`）| 🟢 低（不影響功能；視覺一致性）|
| D-2 | GitHub 欄無「published / no URL」第 3 行 badge（與 Blogger 不對稱）；但概念上 Blogger publishedUrl 是真實回填、GitHub previewUrl 是推導，本就不對稱 | 🟡 中（user 可能誤以為 GitHub 永遠有 URL；實際是預測）|
| D-3 | `missingFields` 邏輯不檢查 `github.previewUrl 已部署狀態`（無法判斷預測 URL 是否真實線上）| 🟡 中（屬本質限制；需 user 啟動 deploy verifier 才能解）|
| D-4 | 當前 fixtures 無一筆有 fb post URL metadata（8 個欄位皆缺）→ FB Post (read-only metadata) 區塊之 populated state 顯示路徑**未經真實資料驗證**；只能透過 dry-run editor 模擬 | 🟢 低（dry-run editor 已覆蓋；populated state 顯示邏輯有 unit-level 信心）|
| D-5 | Blogger / GitHub 之 URL 全部未 linkify（user 須手動複製）；FB 之 fbPostUrl / fbImageUrl **有** linkify | 🟢 低（屬保守設計；可選擇是否加 linkify）|
| D-6 | source / enabled 兩概念雖有 tooltip 區分，但 stat-card label 文字（"blogger source" vs "blogger enabled"）對非工程師可能仍不直觀 | 🟢 低（tooltip 已解；不影響功能）|
| D-7 | filter 缺 `sourceSite` / `fbBadge` / `category` / `tags` 多選 → user 須透過 search 或點開 detail 才能看 | 🟢 低（nice-to-have；現有 search 可代替）|

### 7.2 規模 drift（理論評估；未實際觸發）

| 規模 | 風險 |
|---|---|
| posts > 100 | DOM 渲染 lag 開始（SSR render 所有 row + detail panel） |
| posts > 300 | search / filter 即時性下降 |
| fb sidecar > 50 | 12 欄位 detail 之累積 DOM 開始膨脹 |

當前實際 4 篇 → 距規模 drift 門檻仍遠。

### 7.3 docs / source 一致性審計 ✅

跨文確認 **無 drift**：

| 維度 | 涉 docs | 與 source 一致？ |
|---|---|---|
| FB sidecar 12 read-only 欄位 | `docs/fb-sidecar-schema.md` §3.1 / §3.5 | ✅ loader 與 schema 對齊 |
| derived badge 5 種狀態 | `docs/fb-sidecar-metadata-pre-analysis.md` §6.2 | ✅ loader `deriveFbBadge` 與 docs 對齊 |
| safe-editable 4 欄位 | `docs/admin-2-write-pre-analysis.md` §4.1 | ✅ EJS SEO dry-run viewer 列 4 欄位 |
| publishedAt canonical fallback chain | EJS detail panel 註腳 | ✅ loader 與顯示一致 |
| fbPublished completeness P3 | `docs/fb-sidecar-schema.md` §3.5.5 | ✅ loader 與顯示一致 |
| contentKind 列舉值 | `CLAUDE.md` §11 | ✅ filter 5 個選項覆蓋 |

---

## 8. Recommended Small Phases

### 8.1 🟢 安全小修候選（docs-only 或 read-only UI；可今天直接做）

| # | phase 名 | 範圍 | 預估 LOC | 風險理由 |
|---|---|---|---|---|
| S-1 | **列表 empty state 文案統一**（將 `(no title)` / `no-id` / `no date` / `no category` / `no tags` / `no kind` 全部改為 `(empty)` 與 detail panel 對齊）| `src/views/admin/index.ejs` ~6 處字串 | ~10 行 | 🟢 純 EJS 文案；零功能改動 |
| S-2 | **dist URL 文字 linkify**（Blogger publishedUrl / GitHub previewUrl 加 `<a target="_blank" rel="noopener noreferrer">`；保留 mono 樣式）| `src/views/admin/index.ejs` ~4 處 | ~10 行 | 🟢 純 UI 增強；與 FB 連結對齊；保留 user 複製能力 |
| S-3 | **fixture 範例補 fb post URL metadata 欄位**（為 1 篇 sidecar 補 fbPostUrl / fbPostedAt / status / campaign 等真實 placeholder 值；驗證 populated state 顯示）| 1 個 `.fb.md` fixture（建議 `content/validation-fixtures/`） | ~10 行 | 🟢 純 fixture；不污染正式 content |
| S-4 | **stat-card tooltip 文案優化**（將 source / enabled 區分強化 tooltip 表述）| `src/views/admin/index.ejs` 4 個 tooltip | ~6 行 | 🟢 純文案 |
| S-5 | **docs sync：admin-1-completion-report.md 補 P5-a 進度註記**（若已有，檢查；若無，補一段）| `docs/admin-1-completion-report.md` | ~10 行 | 🟢 純 docs |

### 8.2 🟡 中風險小修候選（會動 source；需 build + 人工檢視）

| # | phase 名 | 範圍 | 預估 LOC | 風險理由 |
|---|---|---|---|---|
| M-1 | **filter 增 sourceSite / fbBadge 兩個 optgroup**（client-side filter 增 2 群組；不動 loader）| `src/views/admin/index.ejs` filter `<select>` + JS `matchesFilter` | ~25 行 | 🟡 改 EJS template + JS；無 write；需 build 驗證 |
| M-2 | **GitHub URL 第三層 badge**（在 GitHub 欄補 `previewUrl ok / no preview` badge；對齊 Blogger 視覺；明示「預測 URL」）| `src/views/admin/index.ejs` GitHub td + tooltip | ~10 行 | 🟡 視覺改動；可能 user 誤解；需文案解釋 |
| M-3 | **FB completeness P3 條件式**（per roadmap §1.3：`enabled=true && status=published && !postUrl → missing`）| `src/scripts/load-admin-posts.js` ~10 LOC | ~10 行 | 🟡 改 loader；會動既有 fixture `fbPublished` 計數 |
| M-4 | **fixture 補完整 FB post URL metadata 真實樣本**（在正式 content sidecar 加 placeholder 值；非 validation-fixtures）| `content/**/*.fb.md` × 1-2 個 | ~10 行 | 🟡 動正式 content；可能影響 build-promotion 輸出 |

### 8.3 🔴 不建議今天做（涉及 write / Graph API / schema 大改 / deploy）

| # | phase 名 | 理由 |
|---|---|---|
| L-1 | FB-P5-c-a server-side dry-run validation endpoint | per `docs/fb-sidecar-write-preflight-decision.md` §7；需 user 勾 8 項 + 6 項前置確認 |
| L-2 | FB-P5-c-b 真實寫入 | 同上 |
| L-3 | Admin-2-b-2 SEO write 真正啟動 | per roadmap §2.3；屬寫入 phase |
| L-4 | Graph API 接入（即使僅 read）| per `CLAUDE.md` §29 永不清單 |
| L-5 | DOM virtual scrolling / 大規模 pagination 重寫 | 當前 4 篇文章遠未到規模問題；過度工程 |
| L-6 | Admin 開放公開部署 | 違反 dev-mode-only 設計 |

---

## 9. Suggested Next Phase

### 9.1 問題回答

**Q1：Admin 文章多會不會雜？**
- 當前 4 篇：✅ 不雜
- ≤ 20 篇：✅ 不雜（預設全顯示）
- 21-50 篇：✅ 仍 OK（show-all toggle 啟動；user 自選展開）
- 51-100 篇：🟡 SSR DOM 開始膨脹；瀏覽器仍可用但 search/filter 開始有微感
- 100+ 篇：🟡-🔴 建議啟動 server-side filter or virtual scroll（屬第二階段；不今天做）

**結論**：以**個人部落格規模**（預估第一階段 < 50 篇）為前提，當前實作**已足夠**；不需立即改 pagination 機制。

**Q2：published date 放在總覽是否有參考價值？**
- ✅ **有強參考價值**。理由：
  1. 列表已按 publishedAt desc 排序 → 最新文章在頂部
  2. `publishedSource` 標記（blogger / github / frontmatter）讓 user 知道日期來源
  3. 對「我這篇是不是已 publish」之回查很直接
- 改進空間：可考慮加 relative time（如 `5 days ago`）；但屬 nice-to-have，不影響功能

**Q3：FB URL 是否適合在總覽顯示快速回查連結？**
- ✅ **適合且應該保留**。當前實作（detail panel linkified）合理。
- 是否要進列表（而非僅 detail）？建議**不要**：
  - 列表已有 7 欄；再加 1 欄會擠
  - FB 已有 derived badge 在 kind/status 欄顯示狀態
  - 想看 URL 可點開 detail
- 建議改進：detail panel 之 `📘 Blogger URL` / `🐙 GitHub URL` 也 linkify（per S-2）

**Q4：目前是否看得出 Blogger / GitHub 文章數？**
- ✅ **看得出**。stat-card 5-8 四張卡明確區分：
  - blogger source / github source（**文章原始位於哪個資料夾**）
  - blogger enabled / github enabled（**publishTargets 是否啟用**）
- 改進空間：tooltip 文字可優化以對非工程師更直觀（per S-4）

**Q5：比較推薦哪種總覽 UX？**

| 方案 | 適用情境 | 評估 |
|---|---|---|
| pagination（傳統分頁）| 100+ 篇 | 🔴 屬重寫；當前不需 |
| show all button（已實作）| 21-50 篇 | ✅ 當前已就位 |
| default collapsed | 卡片摺疊 | 🟡 與 detail panel 概念重複 |
| filter by platform/status（已實作 4 群組）| 任何規模 | ✅ 當前已就位 |
| **combination**（show-all + filter + search）| 當前情境 | ✅ **已實作；不需改動** |

**最小且最安全的改進**：S-1（empty state 文案統一）→ S-2（dist URL linkify）→ S-4（tooltip 文案）。三者全屬 🟢 安全小修；可順序做完都不會碰 loader / write path。

### 9.2 推薦下一個 phase

**第一推薦：S-1（列表 empty state 文案統一）**

理由：
- 🟢 風險最低（純 EJS 文案；零 loader / 零 JS 改動；零 build:* / 零 validate 影響）
- 修 D-1 drift；列表與 detail panel 對齊
- 修改範圍小（~10 行；約 6 處字串）
- 完成後仍 working tree clean；可順勢評估 S-2 / S-4
- 適合作為今早第二批，延續「最小可驗證」節奏

**第二推薦（若 S-1 結束時間還早）：S-4（stat-card tooltip 文案優化）**

理由：
- 同屬純文案；零功能改動
- 進一步解 D-6 source / enabled 概念混淆
- 修改範圍更小（~6 行）

**不推薦先做 S-2（dist URL linkify）**：雖然也是 🟢，但會新增 HTML 標籤（`<a>`）而非單純字串替換，diff 較複雜；建議先把單純字串替換型小修做完。

**不推薦先做 S-3（fixture 補欄位）**：雖然也是 🟢，但會動 fixture 內容；建議 user 先看 Admin 當前 missing 顯示後再決定要不要補。

### 9.3 啟動條件

- 上一 phase C-1 已完成（commit `45ba3d9`）✅
- working tree 仍 clean ✅
- 本 audit doc 落地後即可進入 S-1（**但需 user 明示啟動**）

---

## 10. 對既有系統之影響

| 維度 | 狀態 |
|---|---|
| `src/**` | ❌ 未動 |
| `content/**` | ❌ 未動 |
| `dist/**` / `dist-blogger/**` | ❌ 未動 |
| Deploy repo | ❌ 未動（HEAD 仍 `4ecd92d`） |
| GitHub Pages 線上 | ❌ 未動 |
| Blogger 後台 | ❌ 未動 |
| validate baseline `0/38/33` | ❌ 預期未動（純新增 docs）|
| 既有 docs | ❌ 未動（本批不更 README / roadmap 索引）|

---

## 11. 邊界聲明

- ✅ 本文件**僅為 audit / pre-analysis**；不改 source / template / build / dist / deploy
- ✅ 本文件**不**啟動任何 phase
- ✅ 本文件**不修** README 索引（per spec「本 phase 先不要做索引同步」）
- ✅ 本文件**不** push
- ✅ 所有改善建議須 user 明示啟動方可進

---

## 12. Cross-links

- `src/views/admin/index.ejs` — Admin overview template
- `src/scripts/load-admin-posts.js` — Admin loader（12 FB 欄位 + derived badge + completeness + sort）
- `docs/fb-sidecar-schema.md` §3.1 / §3.5 — FB sidecar 12 欄位 canonical schema
- `docs/fb-sidecar-metadata-pre-analysis.md` §6.2 — derived badge 規則
- `docs/fb-post-url-metadata-proposal.md` §1-3 — fb post URL metadata 設計脈絡
- `docs/admin-2-write-pre-analysis.md` §4.1 — safe-editable 4 欄位
- `docs/phase-2-candidate-roadmap.md` §1.3 / §2.3 — 後續 FB completeness P3 與 Admin SEO write
- `CLAUDE.md` §29 — 第一版不做清單

---

（本文件結束）
