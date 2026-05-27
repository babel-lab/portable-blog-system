# Admin-2 Write Pre-Analysis：write surface + safety plan

本文件為 **Admin Phase 2（write MVP）** 之**啟動前盤點與安全設計分析**。屬 **pre-analysis / planning** 性質；本批僅產此 doc，**不**啟動任何 source / build / 寫入功能。實作留待 user 批准方案後之 **Admin-2-b** 拆批落地。

對應上層文件：
- `docs/admin-mvp-pre-analysis.md`（Admin MVP 詳規劃；Phase Admin-0；§4 欄位分區 + §7 階段順序）
- `docs/admin-local-boundary-pre-analysis.md`（Admin 邊界政策；本系列 100% 對齊）
- `docs/admin-1-completion-report.md`（Admin-1 read-only 系列收尾；§7-§8 列已 / 未做項 + 風險清單）
- `docs/admin-1-readonly-preflight.md`（Plan B dev-mode-only render 之選定理由）
- `docs/system-direction.md`（BLOG 系統整體方向）
- `docs/publish-bundle.md`（sidecar 三檔結構）
- `docs/content-schema.md`（frontmatter 欄位字典）
- `CLAUDE.md` §29（第一版不做清單；Admin 屬第二階段）

---

## §1 Admin-2 目標與非目標

### 1.1 目標

Admin-2 為 Admin MVP 之**第一個 write 階段**。目標：

- 提供作者**結構化欄位編輯介面**，降低長期手動編輯 sidecar 之 YAML / JSON 格式錯誤風險
- **保留所有 Admin-1 既有邊界**（read-only 部分仍正確 / dev-mode-only / 不入 dist / sitemap / nav）
- 寫入機制必須**安全 / 可預覽 / 可回退**
- 沿用 Admin-1 之 loader / EJS / build-github.js 架構，不引入 framework / server / npm deps

### 1.2 非目標（明確不做）

- ❌ **不**做完整 CMS（user / role / permission / multi-tenant）
- ❌ **不**做線上化（per `admin-local-boundary` §3 之硬性禁則）
- ❌ **不**接 Blogger API / Google Drive API
- ❌ **不**做 git commit 自動化（user 手動 `git add + commit`）
- ❌ **不**做檔案刪除 / 批次操作 / 多檔同時 write
- ❌ **不**做 settings JSON 編輯（categories / tags / promotion / ga4 / ads）
- ❌ **不**做文章內文 WYSIWYG（內文仍 Markdown 編輯走 VS Code）
- ❌ **不**做 publishedUrl 寫入 UI（已有 `npm run backfill:url` CLI helper；保留）

---

## §2 Admin-2 Write Surface Inventory

### 2.1 可寫入檔案類型（候選）

per `admin-mvp-pre-analysis.md` §4 欄位分區 + sidecar bundle 既有結構：

| 檔案類型 | 路徑 pattern | 格式 | 既有 parser |
|---|---|---|---|
| Post Markdown | `content/{site}/posts/{YYYYMMDD-slug}.md` | Markdown + YAML frontmatter | `gray-matter` |
| Publish sidecar | `content/{site}/posts/{YYYYMMDD-slug}.publish.json` | JSON | `JSON.parse` |
| FB sidecar | `content/{site}/posts/{YYYYMMDD-slug}.fb.md` | Markdown + YAML frontmatter | `gray-matter` |
| Series settings | `content/settings/series.json` | JSON | `JSON.parse` |
| 其他 settings | `content/settings/*.json` | JSON | `JSON.parse` |

### 2.2 風險表 per 檔案類型

| 檔案 | 格式風險 | 語義風險 | 跨檔影響 | git collision | rollback 難度 |
|---|---|---|---|---|---|
| `.md` frontmatter | YAML 縮排 / 引號 / multiline string；body 之 H1 / image | slug / category / tags must exist in settings；contentKind affects template / blogger.type；status lifecycle | 改 slug → 影響 sidecar 對應；改 contentKind → 影響 cross-platform routing | 與 user 手動 edit 衝突；與 git rebase / merge 衝突 | 🟢 低（單檔；git restore 即回）|
| `.publish.json` | JSON 嚴格格式；trailing comma 不允許；string escape | blogger.publishedUrl 影響 canonical / FB UTM；github.path 影響 dist URL | 改 publishedUrl → 影響 sitemap / canonical / FB promotion txt | 同上 | 🟢 低 |
| `.fb.md` frontmatter | 同 .md | enabled flag 影響 promotion build；hashtags array；UTM | 改 enabled → 影響 dist-promotion/ 產出 | 同上 | 🟢 低 |
| `series.json` | JSON | series.id 跨多文章引用；改 id 會 break 所有引用之 post | 改 series.id → 跨所有引用 post 失效 | 同上 + 多 post 同步問題 | 🔴 高（需找出所有引用 + 同步修）|
| `categories.json` / `tags.json` | JSON | 改 category id → 多 post 之 category 欄位 broken；改 tag id → 多 post 之 tags 欄位 broken | 跨多 post | 同上 | 🔴 高 |
| `promotion.config.json` / `ga4.config.json` / `ads.config.json` | JSON | 影響全站 build；measurement ID / utm patterns / ad slot IDs | 全站 | 屬全站 config | 🟡 中 |

---

## §3 不應寫入檔案清單

Admin-2 **嚴格不寫入**以下檔案（即使作者要求）：

| 類別 | 路徑 / pattern | 不寫入理由 |
|---|---|---|
| Source code | `src/**/*.js` / `src/**/*.ejs` / `src/**/*.scss` | 屬程式碼；應 git + IDE 手動編輯 |
| Build scripts | `src/scripts/build-*.js` / `vite.config.js` | 同上；改錯會 break build pipeline |
| Package metadata | `package.json` / `package-lock.json` | 影響 dependency 管理；應 npm CLI 操作 |
| Dist / cache | `dist/**` / `.cache/**` | 屬 build output；不應 source-level write |
| Deploy repo | `D:\github\blog-new\portable-blog-deploy\**` | per `admin-local-boundary` §3 / Phase 10 部署設計 |
| Docs / 規範 | `docs/**` / `CLAUDE.md` / `README.md` / `PROJECT_TREE.txt` | 屬人類維護文件；Admin 不應自動 mutate |
| Git metadata | `.git/**` | 屬 git internal；只能透過 git CLI |
| Env / secrets | `.env` / `.env.local` | 屬機密；不應 Admin UI 處理 |
| `.gitignore` / `.vscode/` | repo config | 不在 Admin scope |
| Settings JSON（Admin-2 MVP 範圍）| `content/settings/**` | 屬全站 config；改錯影響全站；保留至 Admin-X+ 進階階段（per §4.4）|

---

## §4 欄位分級

依風險程度將 Admin-2 之 write 候選欄位分 4 級。**MVP 只動 §4.1 safe editable**；其餘留至後續 sub-batches。

### 4.1 Safe editable（低風險；MVP 候選）

| 欄位 | 檔案 | 風險評估 |
|---|---|---|
| `description` | `.md` frontmatter | 純 string；無下游 routing；只影響 SEO 顯示 |
| `searchDescription` | `.md` frontmatter | 同上 |
| `titleEn` | `.md` frontmatter | 純 string；FB / OG 用；無下游 routing |
| `cover` | `.md` frontmatter | URL string；錯誤 URL 顯示破圖（不破壞 build）|
| `coverAlt` | `.md` frontmatter | 純 string；無下游影響 |
| `updated` | `.md` frontmatter | ISO date string；影響 sitemap lastmod；low cross-effect |
| `.fb.md` 之 `enabled` | `.fb.md` frontmatter | boolean；切換 FB promotion 產出 |
| `.fb.md` 之 `hashtags` | `.fb.md` frontmatter | array of string；影響 FB promotion txt |
| `.fb.md` body | `.fb.md` 內文 | FB 貼文內容；string；無 schema 約束 |
| `blocks.adsenseMiddle` / `blocks.toc` / `blocks.relatedPosts` | `.md` frontmatter | boolean toggles；影響 post-detail render |

### 4.2 Risky editable（中-高風險；MVP 後再開放）

| 欄位 | 檔案 | 風險 |
|---|---|---|
| `title` | `.md` frontmatter | 影響 SEO / sitemap / Blogger 標題 / FB 預設 title；改後需 user 在 Blogger 後台同步更新 |
| `slug` | `.md` frontmatter | 改 slug → URL 變動；舊連結 break；需 file rename（多檔 atomic）|
| `id` | `.md` frontmatter | 屬 identity；理論不應改；改後需 sidecar 同步 rename |
| `contentKind` | `.md` frontmatter | 影響 template routing / blogger.type / article block 顯示 |
| `category` | `.md` frontmatter | 影響 categories page / sitemap；必須 exist in `categories.json` |
| `tags` | `.md` frontmatter | 必須 exist in `tags.json`；多 tags 增刪需逐一驗證 |
| `status` | `.md` frontmatter | draft → ready → published lifecycle；改錯影響 build 範圍 |
| `publishTargets.{github,blogger}.enabled` | `.md` frontmatter | 影響 deploy scope；改 enabled=false 後再 build 會撤 dist 內容 |
| `publishTargets.{github,blogger}.mode` | `.md` frontmatter | enum: full / summary / redirect-card；改錯影響 Blogger HTML mode |
| `book.*` / `download.*` / `affiliate.*` / `series.*` | `.md` frontmatter | 富 metadata；schema 複雜；改錯影響 conditional render |
| `relatedLinks[]` / `otherLinks[]` | `.md` frontmatter | array of object；per-item schema；改錯破壞 UTM 自動處理 |

### 4.3 Read-only（顯示，不允許 Admin 改）

| 欄位 | 檔案 | 理由 |
|---|---|---|
| `id` | `.md` frontmatter | 屬 identity；改後 sidecar 對不齊 |
| `slug`（顯示）| `.md` frontmatter | 同上；改 slug 屬 risky-editable 需多檔 atomic |
| `publish.blogger.publishedUrl` | `.publish.json` | 已有 `npm run backfill:url` CLI helper；不應 Admin form 寫入 |
| `publish.blogger.publishedAt` | `.publish.json` | 同上 |
| `publish.blogger.bloggerPostId` | `.publish.json` | 同上 |
| `publish.github.publishedUrl` | `.publish.json` | 由 settings.site.githubSiteUrl + path 推導；不需手動寫 |
| `sourcePath` | derived | 由 loader 計算；非 source 欄位 |
| `normalized.*` | derived | 由 normalize-post-output 計算；非 source 欄位 |
| `builtAt` / dist mtime | dist | 屬 build artifact；不可寫 |

### 4.4 Forbidden（Admin-2 MVP 完全不做；Admin-X+ 才評估）

| 行為 | 理由 |
|---|---|
| 直接 file rename（slug change → 改檔名 + 3 個 sidecar 同步 rename）| 高風險 multi-file atomic；需 git diff 多檔；難 rollback |
| Settings JSON 編輯（categories / tags / promotion / ga4 / ads / series / etc.）| 跨多文章影響；需 cascading update |
| Multi-file batch operations（如「給所有 ready post 加 tag X」）| 批次寫入；難 rollback |
| Delete operations（刪 post / 刪 sidecar）| 不可逆；應 git rm + commit 手動處理 |
| Series tree editing | series.json 結構複雜；跨多 post 引用 |
| 跨平台 sync writes（如同時改 .md + .publish.json 之相關欄位）| 增加 atomicity 複雜度 |
| File creation outside posts/ pattern | 不在 sidecar bundle 三檔結構內 |
| Markdown body 內文編輯 | per §1.2 非目標；內文仍 VS Code 編輯 |

---

## §5 Schema gap 前置需求

per `admin-mvp-pre-analysis.md` §9 之 gap 清單，評估**是否必須在 Admin-2 之前先補 schema**：

| Gap | 是否影響 MVP write scope (§4.1) | 建議處理時機 |
|---|---|---|
| FB UTM `utm_audience` 欄位 | ❌ 不影響（MVP 不寫 UTM）| 後續批；可選；屬 Admin-X+ 進階 |
| zh-en 摘要（`descriptionEn` / `searchDescriptionEn` / `excerptEn`）| ❌ 不影響（MVP 只寫 zh description / searchDescription）| 後續批；可選 |
| `titleEn` | ✅ 已在 schema | — |
| `contentKind` | ✅ 已在 schema | — |
| Blogger / GitHub channel metadata | ✅ 已在 schema | — |
| FB promotion fields（per `docs/fb-sidecar-schema.md`）| ✅ 已在 schema（除 audience）| — |
| relatedLinks / otherLinks | ✅ 已在 schema | — |

**結論**：

- ✅ **MVP scope（§4.1）所需 schema 已完整**；不需先做 schema 擴充
- ⏸ utm_audience / zh-en 摘要 / excerptEn 屬未來增強；可在 Admin-2 write MVP 落地後、進入 risky-editable 階段前評估

→ **Admin-2-b 可直接啟動實作**；schema gap 不阻擋。

---

## §6 Write Strategy 比較

### Strategy A：直接覆寫原檔（rejected）

| 維度 | 評估 |
|---|---|
| 實作複雜度 | 🟢 最低 |
| 寫入安全性 | 🔴 高風險：無 rollback；無 diff preview；失敗 state 不一致 |
| 推薦 | ❌ **不推薦**（違反 Admin-2 安全設計核心）|

### Strategy B：Temp file + atomic rename（推薦核心）

| 維度 | 評估 |
|---|---|
| 機制 | 寫入 `{file}.tmp` → 完成後 `fs.rename` 原子替換 |
| 寫入安全性 | 🟢 per-file atomic（OS-level guaranteed）|
| Rollback | 🟢 .tmp 失敗時直接刪除即可；不污染既有檔案 |
| Multi-file atomic | ⚠️ 不直接支援；需多檔依序 + 失敗時逐一 revert |
| 推薦 | ✅ **推薦核心機制**（per-file 一律走此策略）|

### Strategy C：Pre-write .bak backup + write + on-failure restore

| 維度 | 評估 |
|---|---|
| 機制 | 寫前複製為 `{file}.bak` → 寫入 → 失敗時從 .bak 還原 |
| 寫入安全性 | 🟡 中（.bak 為快照）|
| Rollback | 🟡 中（.bak 即恢復點）|
| 缺點 | .bak 檔累積；user 手動清理；可能誤被 git add；可能誤被 build 掃到 |
| 推薦 | 🟡 **不採**（git status check 已可替代 .bak；避免雜訊）|

### Strategy D：Dry-run mode default + explicit "apply" confirmation（推薦 UX）

| 維度 | 評估 |
|---|---|
| 機制 | Admin 預設只計算 + 顯示 diff；user 必須明示「Apply」才實際寫入 |
| 寫入安全性 | 🟢 user 看 diff 後才寫；避免 surprise mutation |
| UX 成本 | 🟡 多 1 步 click |
| 推薦 | ✅ **推薦 UX**（per "可預覽" 原則）|

### Strategy E：Write-after-validate（pre-write schema check）

| 維度 | 評估 |
|---|---|
| 機制 | 寫入前先跑 inline schema validation（不跑全 validate:content；只驗本檔之欄位）|
| 寫入安全性 | 🟢 catch schema error 於寫入前 |
| 速度 | 🟢 inline 驗證快（單檔；不掃全 content）|
| 推薦 | ✅ **推薦**（per-field type check + format check）|

### Strategy F：Post-write validate（寫入後跑 validate:content）

| 維度 | 評估 |
|---|---|
| 機制 | 寫入後跑 `validate:content` 確認 baseline 不退步 |
| 寫入安全性 | 🟢 catch downstream impact |
| 速度 | 🟡 慢（全 content scan；當前 17 posts × 30 rules）|
| Rollback 整合 | 🟢 若 validate 結果惡化 → 提示 user rollback option |
| 推薦 | ✅ **推薦**（per "寫入後檢查" 原則；可 background 跑）|

### 6.7 推薦組合

**Admin-2-b MVP 採 B + D + E + F**：

- B（temp + atomic rename）：核心寫入機制
- D（dry-run default + apply 確認）：UX 安全層
- E（pre-write inline schema validation）：catch 寫入前錯誤
- F（post-write validate:content）：catch 寫入後 downstream 影響

**不採** A（直接覆寫）/ C（.bak）。

### 6.8 git 整合哲學

- ✅ Admin **不**自動 `git add` / `git commit`（user 手動操作）
- ✅ Admin **強制** pre-write `git status` check（要求 clean / 或顯示既有 dirty 變動讓 user 決定）
- ✅ Admin **顯示** post-write reminder banner：「請於 terminal 跑 `git diff` + `git commit`」
- ❌ Admin **不**整合 git CLI（不 spawn git）；避免 Admin 與 git workflow 衝突

---

## §7 建議 MVP write scope（Admin-2-b）

依**最小破壞性**原則，建議 Admin-2-b 拆**多個 sub-batches**，每批單一寫入 surface：

### 7.1 Admin-2-b-1：dry-run viewer only（**強烈推薦起手**）

| 維度 | 內容 |
|---|---|
| 寫入功能 | ❌ **無**（純顯示 diff；無 fs.write） |
| 範圍 | UI 加 "Edit" button per safe-editable field；click 後顯示 form；form 計算 new value + 顯示 diff；無 apply button |
| 目的 | 驗證 form / diff calc / UX 流程；不冒寫入風險 |
| 風險 | 🟢 零（pure read + render）|
| 預估 LOC | ~150（admin EJS form + diff render + JS）|
| 推薦度 | 🟢🟢🟢 **強烈推薦作為 Admin-2 之 stepping stone** |

### 7.2 Admin-2-b-2：SEO 欄位最小 write（description / searchDescription only）

| 維度 | 內容 |
|---|---|
| 寫入欄位 | `description` / `searchDescription`（純 string）|
| 影響檔案 | 1 個 `.md`（單檔 atomic）|
| 寫入策略 | B + D + E + F |
| 範圍 | Admin-2-b-1 之 form 加 "Apply" button；fs.writeFile temp + rename；post-write validate |
| 風險 | 🟢 低（只改 string；無 routing / lifecycle 影響）|
| 預估 LOC | ~80（write helper + UX confirm + post-write validate）|
| 推薦度 | 🟢🟢 推薦作為**第一個實際寫入** sub-batch |

### 7.3 Admin-2-b-3：FB sidecar enable / hashtags / body

| 維度 | 內容 |
|---|---|
| 寫入欄位 | `.fb.md` 之 `enabled` / `hashtags` / body |
| 影響檔案 | 1 個 `.fb.md`（單檔 atomic）|
| 範圍 | 沿用 b-2 機制；擴 form to .fb.md |
| 風險 | 🟢 低（只影響 promotion txt 產出）|
| 預估 LOC | ~60 |
| 推薦度 | 🟢 推薦第三 |

### 7.4 Admin-2-b-4：titleEn / cover / coverAlt / updated

| 維度 | 內容 |
|---|---|
| 寫入欄位 | `titleEn` / `cover` / `coverAlt` / `updated` |
| 影響檔案 | 1 個 `.md` |
| 範圍 | 沿用 b-2 機制 |
| 風險 | 🟢 低 |
| 推薦度 | 🟢 推薦第四 |

### 7.5 Admin-2-b-5：blocks.* boolean toggles

| 維度 | 內容 |
|---|---|
| 寫入欄位 | `blocks.adsenseMiddle` / `blocks.toc` / `blocks.relatedPosts` 等 boolean |
| 影響檔案 | 1 個 `.md` |
| 範圍 | 沿用 b-2 機制；UI 為 checkboxes |
| 風險 | 🟢 低 |
| 推薦度 | 🟢 推薦第五 |

### 7.6 Admin-2-c+（risky-editable；MVP 後）

- `category` / `tags` 編輯（需 settings 對齊）
- `status` lifecycle 切換
- `publishTargets.*` enabled toggle
- `contentKind` 編輯

→ 留至 MVP 穩定後評估；每候選獨立 pre-analysis。

### 7.7 永久 forbidden（Admin scope 外）

per §4.4 清單。

---

## §8 dry-run / diff / backup / validate / rollback 設計

### 8.1 dry-run 機制

```
作者於 Admin → click "Edit" on a field
   ↓
Admin form 顯示 current value
   ↓
作者修改 → 按 "Preview Diff"
   ↓
Admin 計算 new file content（含 frontmatter 重組）
   ↓
Admin 顯示 side-by-side diff（current vs new；highlighted lines）
   ↓
Admin 顯示 inline validation result（schema check pass / fail）
   ↓
作者選擇：
   - "Apply Changes"（觸發實際 write）
   - "Cancel"（不寫入）
```

### 8.2 diff preview UI

- HTML 顯示 unified diff（lines added/removed）
- 區分 frontmatter 段 vs body 段
- 顯示 validation status（warnings before / after）

### 8.3 git status backup 替代 .bak

| 條件 | Admin 行為 |
|---|---|
| `git status` clean | ✅ 允許寫入（git 即為 backup；revert = `git restore <file>`）|
| `git status` dirty（有 untracked / modified）| ⚠️ 顯示 dirty 清單；要求 user 確認「我已備份此變動，要繼續嗎」|
| `git status` 含本批 Admin 要寫之檔案 | 🔴 拒絕寫入；強制 user 先 commit / restore 既有變動 |

### 8.4 pre-write inline validation

- 寫入前對 form field value 跑：
  - type check（string / boolean / array / etc.）
  - format check（如 description 不能超過 1000 字 / URL 必須 https:// 開頭 / date ISO format / etc.）
  - schema check（per `docs/content-schema.md` + `docs/publish-bundle.md`）
- 失敗 → 顯示 inline error；不寫入

### 8.5 atomic write

- `fs.writeFile({file}.tmp, newContent)`
- `fs.rename({file}.tmp, {file})`（OS-level atomic）
- 失敗時：`fs.unlink({file}.tmp)`

### 8.6 post-write validate

- write 完成後立即 spawn `node src/scripts/validate-content.js`（不阻塞 UI）
- 顯示 baseline 變化（`0/22/17` vs new）
- 若 warning count 增加 → 顯示「⚠️ 寫入後 validate baseline 變化」+ rollback button

### 8.7 rollback

- **方法 1（推薦）**：`git restore <file>` — 直接還原至 commit 狀態
- **方法 2（如有 .tmp 殘留）**：手動清 `.tmp`
- Admin UI：寫入後顯示「Rollback last write」button → 跑 `git restore <file>`（spawn git CLI）

**注意**：Admin spawn git CLI 屬例外（per §6.8 「不整合 git」原則之 narrow 例外）；理由：rollback 為單一明確、可逆操作；風險低。可選：不 spawn；改顯示「請於 terminal 跑 `git restore {file}`」之提示。

---

## §9 Admin-2-b 建議執行方案

### 9.1 推薦順序（拆 5 sub-batches）

| 順序 | Sub-batch | 寫入功能 | 預估 LOC | 風險 |
|---|---|---|---|---|
| 1 | Admin-2-b-1：dry-run viewer | ❌ 無 | ~150 | 🟢 零 |
| 2 | Admin-2-b-2：SEO description / searchDescription write | ✅ 1 個 .md 之 2 欄位 | ~80 | 🟢 低 |
| 3 | Admin-2-b-3：FB sidecar write（enabled / hashtags / body）| ✅ 1 個 .fb.md | ~60 | 🟢 低 |
| 4 | Admin-2-b-4：titleEn / cover / coverAlt / updated write | ✅ 1 個 .md 之 4 欄位 | ~50 | 🟢 低 |
| 5 | Admin-2-b-5：blocks.* boolean toggles write | ✅ 1 個 .md 之 boolean | ~40 | 🟢 低 |

合計 ~380 LOC / 5 commits / 全 dev-mode-only。

### 9.2 每批之 user 批准點

- 啟動前：user 確認本批 sub-batch 之 surface（哪些欄位）
- 完成後：user 驗證 UX + 寫入正確性 + git diff 預期
- 通過後：方可啟動下一 sub-batch

### 9.3 不建議跳過 Admin-2-b-1（dry-run viewer）

Admin-2-b-1 為**安全 stepping stone**：
- 驗證 form / diff calc / UX 流程 _without_ 任何 fs write
- user 驗證 UX 後再開啟實際寫入
- 對齊 Admin-1-a preflight 之「先看後做」原則

---

## §10 安全檢查清單

### 10.1 Pre-write checklist（Admin 寫入前必跑）

- [ ] `git status` check（建議 clean；dirty 需 user 確認）
- [ ] target file 是否在白名單（per §2.1）
- [ ] target file 是否不在黑名單（per §3）
- [ ] field 是否在 safe-editable 範圍（per §4.1）
- [ ] field 之 type / format / length 通過 inline validation
- [ ] diff preview 已 render；user 已 confirm

### 10.2 Post-write checklist（Admin 寫入後必跑）

- [ ] atomic rename 完成（temp file 已 removed）
- [ ] file 可重新 parse（gray-matter / JSON.parse 不報錯）
- [ ] `git status` 顯示**只有預期之變動**
- [ ] `npm run validate:content` baseline 不退步
- [ ] dist / sitemap / nav / admin isolation 不受影響（per Admin-1 邊界）
- [ ] 顯示 git commit 提示給 user
- [ ] 暴露 rollback button

### 10.3 Rollback checklist

- [ ] confirm rollback 操作
- [ ] spawn `git restore <file>`（或顯示 manual command）
- [ ] verify file 已還原至 commit 狀態
- [ ] verify Admin form 顯示之 current value 已同步

---

## §11 停止點設計

依保守原則，Admin-2-b 全程拆 5 sub-batches，每批之後皆**停下等待 user**：

| Stop point | 觸發條件 | user 動作 |
|---|---|---|
| 1. Admin-2-a 完成（本批）| pre-analysis doc landed | user 批准 Admin-2-b-1 dry-run viewer 方向 |
| 2. Admin-2-b-1 完成 ✅ **landed 2026-05-19** | dry-run viewer landed（commit `b676f26`；per `docs/admin-2b1-completion-report.md`）；可預覽但不能 apply | user 驗證 UX；確認可進 b-2 實際 write |
| 3. Admin-2-b-2 完成 | SEO 2 欄位 write 可用 | user 驗證原子性 + diff preview + post-validate；確認可進 b-3 |
| 4. Admin-2-b-3 完成 | FB sidecar write 可用 | user 驗證 |
| 5. Admin-2-b-4 完成 | titleEn / cover / etc. write 可用 | user 驗證 |
| 6. Admin-2-b-5 完成 | blocks.* boolean write 可用 | user 驗證；Admin-2-b MVP 完成 |
| 7. Admin-2-b-wrap | completion report | user 決定是否進 Admin-2-c risky-editable / 或 idle |

**每批之間皆 stop point**；無「鏈式啟動」。

---

## §12 對目前系統之影響

本批（Admin-2-a；pre-analysis only）：

| 維度 | 狀態 |
|---|---|
| source code | ❌ 未動 |
| build scripts | ❌ 未動 |
| EJS templates（含 admin/index.ejs）| ❌ 未動 |
| content 既有文章 | ❌ 未動 |
| settings JSON | ❌ 未動 |
| package.json | ❌ 未動 |
| dist / deploy repo | ❌ 未動 |
| Blogger templates | ❌ 未動 |
| GA4 / AdSense | ❌ 未動 |
| 既有 Admin-1 read-only 功能 | ❌ 未動 |
| 既有 stable snapshot | ✅ 維持 |

---

## §13 邊界聲明 + 限制遵守聲明

- ✅ 本文件**僅為 pre-analysis / safety plan**；不啟動任何 write 功能
- ✅ 本文件**不**修改 source code / build / content / settings / dist / deploy
- ✅ 本文件**不**新增 npm dependencies / package script
- ✅ 本文件**不**改變既有 schema
- ✅ 本文件**不**啟動 Admin-2-b implementation
- ✅ 本文件**不**等同 Admin-2-b 之最終設計規格書；屬高階方向 + 推薦組合
- ✅ Admin-2 系列**全程**將保留 Admin-1 既定邊界：
  - dev-mode-only（prod build 跳過）
  - 不入 dist / sitemap / robots Disallow / public navigation
  - 不部署 gh-pages
  - 無 framework / 無 server / 無 auth
  - 不修改 build-blogger / build-promotion / build-sitemap / build-blogger-theme 之 production 邏輯
  - 不引入 npm dependencies

---

## §14 Cross-links

- `docs/admin-1-completion-report.md`（Admin-1 read-only 系列收尾；§7 列未做項 / §8 風險 / §8.2 建議下批為 Admin-2-a）
- `docs/admin-mvp-pre-analysis.md`（Admin MVP 詳規劃；§4 欄位分區 / §7 階段順序 / §9 schema gap）
- `docs/admin-local-boundary-pre-analysis.md`（邊界政策；§3 硬性禁則 / §7 GA4/Ads/UTM placement）
- `docs/admin-1-readonly-preflight.md`（Plan B dev-mode-only 之選定）
- `docs/system-direction.md`（BLOG 系統整體方向）
- `docs/publish-bundle.md`（sidecar bundle 三檔結構）
- `docs/content-schema.md`（frontmatter 欄位字典）
- `docs/publish-json-schema.md`（.publish.json schema）
- `docs/fb-sidecar-schema.md`（.fb.md schema）
- `docs/related-links-schema.md`（相關連結 schema）
- `CLAUDE.md` §11（contentKind）/ §17（article blocks）/ §29（第一版不做清單）

---

## §15 2026-05-27 Snapshot：Admin Write Infra Design Refinement

本節為 **Phase 20260527-am-15-admin-write-infra-design-docs-only-a** 之 docs-only 追加。屬本文件之**追加**（append-only）：§1–§14 既有設計**不刪改**；§15 補充自原文件落地（2026-05-15 前後）以來之**現況快照**、**首個寫入功能選擇之 rationale**、**sourceKey selector 之 prerequisites checklist**、與**更新後之 phase 順序**。

對應上層 trigger：sourceKey Step 6 Admin selector 仍被 Admin write infra 擋住；Step 5 / 7 / 7-d 已落地（per `docs/related-links-schema.md` §11.5）；Phase 20260527-am-14 read-only preflight 已確認 Admin 無 actual file write path / 無 reusable atomic write helper / 無 pre-/post-write validate hook / 無 relatedLinks 編輯 UI。

### 15.A Current State（2026-05-27）

| 範疇 | 狀態 | 證據 / 來源 |
|---|---|---|
| Admin 渲染模式 | dev-mode-only（Plan B；prod build 跳過）| `src/views/admin/index.ejs` line 6 (`noindex, nofollow`) + line 12-14 banner；`src/scripts/build-github.js` predev only |
| Admin loader | `src/scripts/load-admin-posts.js`（~298 LOC；glob `content/{github,blogger}/posts/*.md` 排除 `.fb.md`）| 既有檔；不寫入；不解析 .fb.md body |
| Admin EJS | `src/views/admin/index.ejs`（~1004 LOC）| 既有檔；statically rendered；無 form submit / 無 fetch / 無 XHR |
| SEO dry-run viewer | ✅ landed（Phase Admin-2-b-1；commit `b676f26`，2026-05-19）| 4 fields（description / searchDescription / titleEn / coverAlt）；client-side diff only；無 Apply button |
| FB sidecar dry-run editor | ✅ landed（Phase 20260520-fb-p5-b）| 12 fields；client-side diff + simulated frontmatter；無 fs.write / 無 fetch |
| FB Post read-only metadata 顯示 | ✅ landed（Phase 20260520-fb-p5-a + 20260520-c-1～c-4）| 13 個 FB 欄位 + badge derived；屬 read-only display |
| Platform Routing read-only display | ✅ landed（Phase 20260521-pm-57 + pm-59）| canonicalTarget / platformUrl / gaHostname / githubStatus；屬 read-only derived |
| Admin overview filters / sort / search | ✅ landed（多批；最新 Phase 20260523-pm-16 fbPostedAt sort）| client-side only |
| relatedLinks / otherLinks 編輯 UI | ❌ **無**；index.ejs line 590-591 僅顯示 count（number）| `load-admin-posts.js` `toAdminView` line 130-131 只 derive `.length`；array 內容**未** expose 至 EJS |
| Actual file-write path（任何 .md / .fb.md / .publish.json）| ❌ **無**任何 Admin write surface | grep `fs.writeFile|writeFile` on `src/scripts/load-admin-posts.js` / `src/views/admin/index.ejs` 皆 0 命中 |
| Reusable atomic write helper | ❌ **無**模組化；唯一 pattern 在 `src/scripts/backfill-published-url.js` line 366-369（CLI；temp + rename inline） | — |
| Pre-write inline schema validator | ❌ **無** | — |
| Post-write `validate:content` hook | ❌ **無** | — |
| git-status pre-write guard | ❌ **無** | — |
| HTTP / IPC endpoint（讓 browser POST 至 Node fs）| ❌ **無**；`vite.config.js` 無 custom middleware / 無 API routes | — |
| `linkSources` 載入至 Admin context | ⚠️ 未驗證；`load-admin-posts.js` 簽名為 `({ settings })`，但目前 `toAdminView` 未使用 `settings.linkSources` | grep `linkSources` 命中 `validate-content.js` / `build-blogger.js` / `build-github.js` / `load-settings.js`；**未**命中 `load-admin-posts.js` 或 `index.ejs` |
| validate baseline | 0 errors / 42 warnings / 37 posts | `npm run validate:content`（2026-05-27 21:55）|
| sourceKey chain landed steps | Steps 2 / 3 / 4 / 5 / 7 / 7-d + docs-sync ✅ | per `docs/related-links-schema.md` §11.5；commits `310062d` / `1707881` / `702e5db` 等 |
| sourceKey Step 6 Admin selector | ❌ blocked by Admin write infra | 本節 §15.F 詳列 prerequisites |

### 15.B Non-goals（本 phase 之硬性界線；不重複 §1.2）

本 phase（20260527-am-15）為 **docs-only**；以下**不**做：

- ❌ production Admin（線上化；登入；多 user）— per `docs/admin-local-boundary-pre-analysis.md` §3
- ❌ build / deploy / Blogger repost / GA4 validation
- ❌ reverse UTM positive fixture 建立
- ❌ sourceKey selector 之 source code 實作
- ❌ 真正檔案寫入（無 fs.writeFile / 無 fs.rename / 無 HTTP POST handler）
- ❌ Admin source / loader / EJS / vite config 修改
- ❌ content / settings / templates 修改
- ❌ npm install / package.json 修改

### 15.C Safety Principles（彙整）

§6 / §8 已有完整策略；本節彙整為 **9 條核心原則**，供未來 implementer 對齊：

1. **Dry-run first**：任何寫入功能之第一個 sub-batch 必為 dry-run viewer（無 fs.write；只算 diff）
2. **Explicit Apply step**：實際寫入必須由 user 在看過 diff 後明示 click「Apply」；無 auto-write；無 implicit save-on-blur
3. **Working tree must be clean before write**：寫入前 `git status` check；dirty 時拒絕或要求 user 明示確認
4. **Atomic temp + rename**：per Strategy B；`{file}.tmp` → `fs.rename` → OS-level atomic；失敗即 unlink .tmp
5. **No .bak strategy**：拒絕 Strategy C；依賴 `git status` / `git diff` / `git restore` 作為唯一回退機制
6. **Pre-write validation**：per Strategy E；inline 驗證 field type / format / length / schema 後才 write
7. **Post-write `npm run validate:content`**：per Strategy F；寫入後跑全 content scan；baseline 退步即 alert + 提示 rollback
8. **One post / one sidecar / one transaction at a time**：禁 multi-file batch；禁 multi-post 同步；MVP 階段一次只動一檔
9. **Never write generated dist files**：寫入白名單嚴格限制於 source content（`content/**/*.md` / `.publish.json` / `.fb.md`）；`dist/` / `.cache/` / `node_modules/` / `src/` / `docs/` / `.git/` 全禁；per §3 黑名單

### 15.D Proposed Architecture（高階；不實作）

§4 / §6 / §8 已涵蓋細節；本節為 **10 個必備元件之 high-level shape**，供未來 implementation phase 拆批參考：

#### 15.D.1 reusable safe write helper

- 模組位置（提議）：`src/scripts/safe-write.js`
- 接口（提議）：
  ```js
  // 純 Node；無 third-party dep；ESM
  export async function safeWrite({
    targetPath,       // absolute path; must pass whitelist
    newContent,       // string; UTF-8
    validators,       // array of (content) => { ok, errors[] }
    onPreWriteGitCheck, // optional; default 'enforce-clean'
  }) {
    // 1. whitelist check（§15.D.4）
    // 2. git status check（§15.D.2）
    // 3. validators forEach（§15.D.5）
    // 4. writeFile(tmpPath) → rename(targetPath) → cleanup on failure
    // 5. return { ok, writtenPath, validateBaselineDelta? }
  }
  ```
- 不 spawn git；git status check 由 caller 傳入結果（避免 helper 與 git 緊耦合）

#### 15.D.2 git clean guard

- 模組位置（提議）：`src/scripts/git-status-check.js`
- 功能：spawn `git status --porcelain` → parse → return `{ clean, dirtyFiles: [], untracked: [] }`
- Admin 寫入前 UI 端：呼叫此 helper → display dirty 清單 → user 必須 confirm 或 cancel
- **不**自動 stash / reset / restore

#### 15.D.3 frontmatter parse / stringify flow

- 寫入 `.md` / `.fb.md` 時：
  - 用 `gray-matter` parse 原檔 → 拿 `{ data, content }`
  - 更新 `data` 之指定欄位 → stringify 回 `'---\n' + yaml.dump(data) + '---\n' + content`
  - **保留** body content bit-exact（per `fb-sidecar-write-safety.md` §4 frontmatter preservation）
  - YAML emitter 選擇：`gray-matter` 內建 `js-yaml`；採用既有 dependency；不引新 lib
- 寫入 `.publish.json` 時：
  - `JSON.parse` → mutate → `JSON.stringify(obj, null, 2) + '\n'`
  - 保留尾隨 newline；保留 2-space indent；對齊既有檔案格式

#### 15.D.4 write target whitelist

- 模組位置（提議）：`src/scripts/admin-write-whitelist.js`
- 規則（hard-coded）：
  - ✅ 允許：`content/github/posts/*.md` / `*.publish.json` / `*.fb.md`
  - ✅ 允許：`content/blogger/posts/*.md` / `*.publish.json` / `*.fb.md`
  - ❌ 禁止：所有其他路徑（含 `content/settings/**` / `content/validation-fixtures/**` / `content/{github,blogger}/pages/**`）
  - ❌ 禁止：symlink / UNC / network path / `..` traversal
- Helper：`isWriteAllowed(absPath) => boolean`；以**字串比對 + path.resolve**雙層；不接受 client-supplied path（per `fb-sidecar-write-safety.md` §2.3）

#### 15.D.5 pre-write field validator

- 模組位置（提議）：`src/scripts/admin-field-validators.js`
- per-field type / format check（範例）：
  - `description`: string；length ≤ 1000；無 control chars
  - `searchDescription`: string；length ≤ 500
  - `titleEn`: string；length ≤ 200；optional
  - `cover` / `coverAlt`: string
  - `relatedLinks[].sourceKey`: string；trim 後非空；在 `activeSourceKeys` set 內（per `validate-content.js` line 137-138 之 builder）
  - `relatedLinks[].url`: string；非空
  - `relatedLinks[].kind`: enum `'internal' | 'external'`
- 失敗 → return `{ ok: false, errors: [{ field, message }] }`；不寫入

#### 15.D.6 post-write `validate:content` runner

- spawn `node src/scripts/validate-content.js` as child process
- capture stdout 之 final summary line（`X error(s) / Y warning(s) on Z post(s)`）
- 比對寫入前 baseline；warning count 增加 → alert + 顯示 rollback button
- 預估耗時：~1-2 sec for 37 posts；可 background spawn

#### 15.D.7 dry-run diff generator

- Admin UI 端純 client-side（沿用 SEO / FB dry-run viewer pattern）：
  - 取 oldValue（dataset.current）+ newValue（form input）
  - per-field 比對 → 標 `changed / unchanged / unchanged-empty`
  - 顯示 side-by-side diff table
- **不**計算完整 file diff（避免在 browser 引入 diff lib）；只 per-field

#### 15.D.8 rollback strategy using git

- 寫入後 UI 顯示 `Rollback last write` button（或顯示 manual command 不 spawn git）
- 預設**不**自動 spawn git；改顯示：
  ```
  ⚠️ 寫入完成。若需 rollback：
    cd <repo>
    git restore content/.../{slug}.md
  ```
- per §8.7 narrow 例外：若 user 啟用「auto-rollback on validate baseline 退步」option，才 spawn `git restore`；預設關閉

#### 15.D.9 Admin UI apply flow

```
作者於 Admin → click "Edit" on a field (per existing SEO / FB dry-run pattern)
   ↓
form 顯示 current value
   ↓
作者修改 → 按 "Preview Diff"
   ↓
client-side diff render（per §15.D.7）
   ↓
inline validation render（per §15.D.5；失敗即停）
   ↓
作者按 "Apply Changes"
   ↓
[POST 至 Vite dev middleware；或直接 fs（如改採 Node-based dev runner）]
   ↓
git-status-check（per §15.D.2）；dirty 時要求 confirm
   ↓
safe-write helper（per §15.D.1）：whitelist → temp → rename
   ↓
post-write validate（per §15.D.6）：baseline delta
   ↓
UI 顯示「✅ 寫入完成 / git commit 提示 / rollback option」
```

#### 15.D.10 logging / final report format

- 寫入每次 produce 一個 console log line + UI status row：
  ```
  [admin-write] 2026-MM-DD HH:mm:ss path=<rel> field=<name> old=<...> new=<...> validate-delta=<+0|+N> ok=true
  ```
- 不寫入 log file（避免新增 source 檔案）；只 console + UI；user 若要 archive 自行重導

### 15.E First Write Scope Recommendation

#### 15.E.1 候選排序（最小 → 最大風險）

| 排名 | 候選 | 影響檔案 | 影響欄位數 | 跨檔影響 | downstream | 推薦時序 |
|---|---|---|---|---|---|---|
| 1 | **SEO fields write**（description / searchDescription）| 1 個 `.md` | 2 | ❌ 無 | SEO meta / OG description；不影響 routing / build scope / lifecycle | ✅ **第一個寫入** |
| 2 | FB sidecar write（`enabled` / `hashtags` / body）| 1 個 `.fb.md` | 3 | ❌ 無 | dist-promotion txt 產出；不影響主文章 | ✅ 第二 |
| 3 | titleEn / cover / coverAlt / updated | 1 個 `.md` | 4 | ❌ 無 | sitemap lastmod；SEO；無 routing | ✅ 第三 |
| 4 | blocks.* boolean toggles | 1 個 `.md` | N 個 boolean | ❌ 無 | post-detail render；無 routing | ✅ 第四 |
| 5 | relatedLinks / otherLinks 編輯（含 sourceKey selector）| 1 個 `.md` | per-item array | ⚠️ 中 | UTM 自動處理 / GA4 click tracking / sourceKey registry | ⏸ 第五；本批 MVP 完成後評估 |
| 6 | publishedUrl / `.publish.json` write | 1 個 `.publish.json` | publish bundle | 🔴 高 | canonical / FB UTM / sitemap | ❌ **不採**（已有 `npm run backfill:url` CLI helper；per §4.3）|

#### 15.E.2 為什麼 sourceKey selector **不**應該是第一個 write feature

明確 8 條 rationale：

1. **影響 array of object，非單一 scalar**：sourceKey 屬 `relatedLinks[i].sourceKey`；per-item 寫入需處理 array index + per-item validation；複雜度高於 SEO 之單一 string 寫入。
2. **依賴未實作之 array exposure**：`load-admin-posts.js` `toAdminView` 目前只 derive `.length`；array 內容**未** expose 至 EJS。Step 6 之前必須先補此 exposure；屬獨立 source change。
3. **依賴未實作之 linkSources 載入**：Admin 目前無 `linkSources` 上下文；需先把 `settings.linkSources` 通過 loader 傳入 EJS；屬獨立 source change。
4. **依賴未實作之 active sourceKey filter**：`<select>` options 必須只列 `isActive !== false` 之 sourceKey；需 import / mirror `validate-content.js` line 137-138 之 `activeSourceKeys` builder；屬獨立 source change。
5. **per-item editor row UI 不存在**：relatedLinks section 目前 0 editable affordances；需新建一整套 per-item 編輯 UI（toggle / form / diff / cancel；mirror SEO / FB dry-run pattern 但 per-array-item-indexed）。
6. **downstream 影響範圍廣**：sourceKey 影響 GA4 click tracking 之 `link_source_key` 參數 + 未來 UTM 自動處理（per `docs/click-tracking-governance.md` / `docs/ga4-link-tracking-spec.md`）；改錯破壞 production GA4 data。SEO description 改錯只影響顯示，無 downstream。
7. **validation 已 ready 但 UI 未 ready**：Step 7 / 7-d（not-found / invalid-type / empty）warning 已落地於 `validate-content.js`；post-write validate 會 catch 錯誤，但若 UI 已寫入錯誤值，user 仍需手動 rollback。SEO write 之失敗 surface 更小。
8. **「最小 write 學習成本」原則**：首個 write feature 應驗證 atomic write helper / git guard / pre-write validator / post-write hook 等**基礎設施**；用最低 schema 複雜度（單一 string）。array of object + registry lookup + active filter 不適合作為基礎設施驗證載體。

→ **結論**：sourceKey selector 必須等基礎設施（per §15.G phase 3）驗證穩定 + SEO write（§15.G phase 5）跑通後，才進入規劃。

### 15.F sourceKey Step 6 Prerequisites（必要前置清單）

| # | Prerequisite | 屬性 | 阻擋等級 |
|---|---|---|---|
| 1 | **Admin write infra 基礎建立**（safe-write helper / git guard / atomic temp+rename / pre-write validator / post-write validate）| source change；多檔；含新 helper 模組 | 🔴 hard-block |
| 2 | **Vite dev middleware 或替代 server**（讓 browser POST 至 Node fs）| source change；vite.config.js 或新增 dev server | 🔴 hard-block |
| 3 | **`linkSources` 通過 loader 傳入 Admin EJS**（caller 在 `build-github.js` Admin emit 處補一行；`load-admin-posts.js` `toAdminView` 接受並 attach `linkSources`）| source change；單檔；~5 LOC | 🟡 medium |
| 4 | **expose `relatedLinks` / `otherLinks` arrays at Admin view object**（`toAdminView` 額外 return；保留既有 `relatedLinksCount` / `otherLinksCount` 不刪）| source change；單檔；~10 LOC | 🟡 medium |
| 5 | **active sourceKey options builder shared**（抽 `validate-content.js` line 137-138 之 `activeSourceKeys` builder 至共用 helper `src/scripts/active-source-keys.js`；validate / build-github / build-blogger / Admin 共用）| source change；refactor；多 caller | 🟡 medium |
| 6 | **per-link editor row UI shell**（index.ejs detail panel 新增 relatedLinks per-item 編輯區；toggle / form / diff / cancel；mirror FB dry-run pattern）| source change；EJS；~200-300 LOC | 🟡 medium |
| 7 | **dry-run diff generator extended for array fields**（per-item field-level diff；mirror FB dry-run 之 `splitNorm` array 處理）| source change；EJS / JS；~50 LOC | 🟢 low |
| 8 | **safe write path for `.md` frontmatter relatedLinks[] mutation**（path: `relatedLinks[i].sourceKey`；safe-write helper 必須支援 array index mutation）| 依賴 #1；§15.D.3 frontmatter parse / stringify flow 需支援 array 寫回 | 🔴 hard-block（依賴 #1）|
| 9 | **pre-write `sourceKey` validators** active set / type / empty check（type / empty / not-found；mirror `validate-content.js` line 212-237 之三條互斥規則）| source change；依賴 #5；~30 LOC | 🟢 low |
| 10 | **post-write `validate:content` baseline 比對**（hook per §15.D.6；catch 任何下游 warning 退步）| 依賴 #1；屬基礎設施 | 🔴 hard-block（依賴 #1）|
| 11 | **sourceKey selector option list 排序**（per `link-sources.json` 之 `sortOrder` 欄位；Admin UI display order；UX nice-to-have）| source change；EJS；~5 LOC | 🟢 low |
| 12 | **rollback UX for relatedLinks edit failure**（per §15.D.8）| 依賴 #1；UI banner | 🟡 medium |

**結論**：12 條 prerequisites 中 hard-blockers 為 #1 / #2 / #8 / #10；其中 #1 + #2 為基礎設施類，必須先落地。#3–#7 + #9 + #11 + #12 為 Step 6 自身 scope 之 sub-batches；可在 #1 + #2 完成後拆批執行。

### 15.G Recommended Phase Sequence（重排版）

§9.1 之 5 sub-batches 仍有效，但本節**前置 + 後置**補充 phase 0 / phase 1 / phase X+：

| Phase 序 | Phase 名稱 | 屬性 | 驗收門 | Status |
|---|---|---|---|---|
| **0** | **Read-only acceptance cross-check**（如本 phase 之 am-14 read-only preflight）| read-only；docs only | 確認 Admin 現況 + Admin write infra 缺什麼 + Step 6 blockers | ✅ done（Phase 20260527-am-14）|
| **1** | **Docs sync / roadmap update**（如本 phase 之 am-15）| docs-only | 把 Admin write infra design refinement append 至 admin-2-write-pre-analysis.md；同步 phase-2-candidate-roadmap / future-roadmap | 🔄 in-progress（本 phase）|
| 2 | **Safe write helper source implementation**（純 source；無 Admin UI 寫入；CLI testable）| source；新增 `src/scripts/safe-write.js` / `git-status-check.js` / `admin-write-whitelist.js` / `admin-field-validators.js` / `active-source-keys.js`（per §15.D） | helper unit-testable；新增 npm script `safe-write:test`；validate baseline 不退步 | ✅ landed `5bcdd02` (2026-05-27) — see §15.G.1 |
| 3 | **First dry-run-only UI enhancement**（依賴 phase 2；新增 Admin Apply button 但**不**綁實際 write）| source；index.ejs Apply button visible but **disabled with explanatory tooltip**；server-side validation preview（scheme A 方案 A：EJS 注入） | UX 流程 verify；無 fs.write | ✅ landed `efd3ac5` (2026-05-27) — see §15.G.2 |
| 4 | **Vite dev middleware for Admin POST endpoint**（讓 browser POST 至 Node fs；dev-only）| source；vite.config.js custom middleware；新 npm script `dev:admin`（保留既有 `dev` 不變）| middleware spec verify；Admin UI 仍 read-only；endpoint 暫接 echo / dry-run | ⏸ pending |
| 5 | **First real write behind explicit Apply: SEO fields**（依賴 phases 2-4；per §9.1 Admin-2-b-2 + §15.E.1 ranked #1）| source；`.md` description / searchDescription write；single-file atomic | git diff verify；validate baseline 不退步；rollback flow 演練 | ⏸ pending |
| 6 | Admin-2-b-3：FB sidecar write | source；per §9.1 | per §11 stop point 5 | ⏸ pending |
| 7 | Admin-2-b-4：titleEn / cover / coverAlt / updated write | source；per §9.1 | per §11 stop point 6 | ⏸ pending |
| 8 | Admin-2-b-5：blocks.* boolean toggles write | source；per §9.1 | per §11 stop point 7 | ⏸ pending |
| 9 | **Admin-2-b wrap**：completion report；驗證 5 個 write surfaces 全部穩定運作 ≥ N days；validate baseline 健康；user 確認可進 Admin-2-c | docs | user 簽收 | ⏸ pending |
| **10** | **sourceKey Step 6 Admin selector**（依賴 phase 9 wrap；per §15.F prerequisites）| source；relatedLinks / otherLinks per-item editor + sourceKey `<select>` + per-item dry-run + write | per §15.F 12 條 prerequisites；validate baseline 不退步；live GA4 verify | ⏸ pending；blocked by phases 0-9 |
| X+ | Admin-2-c risky-editable（category / tags / status / publishTargets / contentKind）| source；per §7.6 | 每候選獨立 pre-analysis | ⏸ pending |

→ **sourceKey selector 必須在 phase 10**；不可插隊。最早可啟動時點為 phases 0-9 全部完成 + user 簽收。

#### 15.G.1 Phase 2 Landing Details（2026-05-27 night-2）

**Phase 名稱**：
- `20260527-night-2-admin-write-safe-helper-source-implementation-a`（source）
- `20260527-night-2-admin-write-safe-helper-source-implementation-commit-push-a`（commit + push）
- `20260527-night-3-admin-write-safe-helper-acceptance-crosscheck-readonly-a`（read-only acceptance）

**Landed commit**：
- full：`5bcdd026f4f6ee8420fbcff529d152f17ec43519`
- short：`5bcdd02`
- message：`feat(admin): add safe write infra helpers`

**Commit scope**（7 files; 666 insertions(+), 1 deletion(-)）：

| File | LOC | 用途 |
|---|---|---|
| `package.json` | +2 / -1 | 新增 npm script `safe-write:test`；無新 dependency |
| `src/scripts/active-source-keys.js` | 33 | `buildActiveSourceKeySet(settings)` / `loadActiveSourceKeySet(projectRoot)`；mirror `validate-content.js:131-142`；graceful 缺檔 / 壞 JSON → 空 Set（per §15.D + §15.F prereq #5） |
| `src/scripts/admin-write-whitelist.js` | 72 | `isWriteAllowed(targetPath, projectRoot)`；只允許 `content/{github,blogger}/posts/*.{md,publish.json,fb.md}`；阻擋 `..` traversal / 相對路徑 / 跨 drive / dist / settings / pages / validation-fixtures / package-lock（per §15.D.4） |
| `src/scripts/git-status-check.js` | 66 | `checkGitStatus({ cwd, timeoutMs })` spawn `git status --porcelain` → `{ ok, clean, dirtyFiles[], untracked[] }`；5 秒 timeout；4 條 graceful reason（`git-spawn-throw` / `git-spawn-error` / `git-timeout` / `git-exit-nonzero`）；不修改 git 狀態（per §15.D.2） |
| `src/scripts/admin-field-validators.js` | 94 | `validateDescription` / `validateSearchDescription` / `validateTitleEn` / `validateCover` / `validateCoverAlt` / `validateRelatedLinkKind` / `validateRelatedLinkUrl` / `validateRelatedLinkSourceKey` + `LIMITS`；統一 `{ ok, error? }` return；sourceKey 規則 mirror Phase 20260527-pm-14 三條互斥（per §15.D.5） |
| `src/scripts/safe-write.js` | 106 | `safeWrite({ targetPath, newContent, projectRoot, validators, gitStatus, enforceCleanGit })`；流程：whitelist → git-status check（caller-supplied）→ validators → tmp write → rename；失敗清 `.tmp`；不 spawn git；不寫 log file（per §15.D.1） |
| `src/scripts/safe-write-test.js` | 293 | CLI self-test entry；71 assertions across 5 helpers；OS temp dir only（`fs.mkdtemp(os.tmpdir())`）；`finally { fs.rm(tmpRoot, recursive, force) }`；exit non-zero on any fail |

**Acceptance verification**（per `20260527-night-3` read-only cross-check）：

- ✅ HEAD `5bcdd02` == origin/main；ahead/behind 0/0；working tree clean
- ✅ `safe-write:test`：71 pass / 0 fail
- ✅ `validate:content`：0 errors / 42 warnings / 37 posts（與開工前一致）
- ✅ 7 helper acceptance checklist 全部 PASS（atomic temp+rename / cleanup tmp / 不綁 Admin UI / 不寫 production content / 無 third-party dep / git-status 只檢查不修復 / 白名單保守 / validators 格式一致 / sourceKey 規則 mirror / graceful fallback / OS temp dir only）

**保留限制**（landing 後仍維持）：

- ❌ 未串接 Admin UI（`src/views/admin/index.ejs` / `load-admin-posts.js` 未動）
- ❌ 未啟用實際 write path（無 Apply button；無 Vite dev middleware；無 HTTP POST handler）
- ❌ 未修改 content / settings / templates / validation-fixtures / dist / dist-blogger / gh-pages
- ❌ 未做 build / deploy / Blogger repost / GA4 validation
- ❌ 未新增 fixture
- ✅ `validate:content` baseline 維持 `0 errors / 42 warnings / 37 posts`
- ✅ `safe-write:test` = `71 pass / 0 fail`
- ✅ Step 6 sourceKey selector remains blocked by phase 3-9（per 既有 §15.F 12 條 prerequisites）
- ✅ reverse UTM remains landed but dormant；pm-26 deploy gate remains blocked by no positive GitHub cross-link fixture

**下一個建議 phase**：§15.G phase 3（First dry-run-only UI enhancement）—— 屬源碼變更；本 docs sync 不啟動。

#### 15.G.2 Phase 3 Landing Details（2026-05-27 night-9）

**Phase 名稱**：
- `20260527-night-8-admin-write-phase-3b-dry-run-ui-preflight-readonly-a`（read-only preflight）
- `20260527-night-9-admin-write-phase-3b-dry-run-ui-implementation-source-a`（source）
- `20260527-night-9-admin-write-phase-3b-dry-run-ui-implementation-commit-push-a`（commit + push）
- `20260527-night-10-admin-write-phase-3b-dry-run-ui-acceptance-crosscheck-readonly-a`（read-only acceptance）

**Landed commit**：
- full：`efd3ac5dc5689f392651fe5c3353e7d745dd4bd2`
- short：`efd3ac5`
- message：`feat(admin): add dry-run write readiness UI`

**Commit scope**（2 files; 116 insertions(+), 0 deletions(-)）：

| File | LOC | 用途 |
|---|---|---|
| `src/scripts/load-admin-posts.js` | +42 | import 5 reusable validators（`validateDescription` / `validateSearchDescription` / `validateTitleEn` / `validateCoverAlt` / `validateRelatedLinkUrl`）from `admin-field-validators.js`；於 `toAdminView` 內 server-side pre-compute `seoValidation = { description, searchDescription, titleEn, coverAlt }` + 保守 `fbValidation = { title, titleEn, postUrl, note }`（4 / 12 fields；其餘 8 fields 待 future phase）；append 至 return object；**未** import `safe-write.js`；**未**新增 fs/promises write 用途 |
| `src/views/admin/index.ejs` | +74 | 新增 3 個 CSS class（`.apply-disabled` / `.validator-badge.ok|error` / `.readiness-checklist` 含 `.ph-done|current|pending`）；SEO dry-run section 加 server-side validator preview（4 fields badges）+ disabled Apply button（`disabled` + `aria-disabled="true"` + tooltip "Phase 3 dry-run only — actual write path is not enabled. Phase 5 才會啟用實際寫入。"）；FB sidecar dry-run section 加保守 4 / 12 fields validator preview + disabled Apply FB button；新增 Future write readiness checklist `.detail-section`（5-row list：Phase 2 ✅ / Phase 3 🔄 / Phase 4 ⏸ / Phase 5 ⏸ / Step 6 ⏸）；**未**綁 click handler；**未**新增 fetch / POST / PUT / XMLHttpRequest / safeWrite caller |

**Implementation scheme**：

採 night-8 preflight 推薦之**方案 A：server-side pre-compute / EJS 注入 validation 結果**：

- ✅ 直接重用 Phase 2 之 `admin-field-validators.js` ESM module；無 client-side validator drift 風險
- ✅ 最少 source change（2 files；116 LOC）；不動 `build-github.js` / `vite.config.js` / `package.json`
- ✅ 與 Phase 5 之 actual write 路徑自然銜接（server 端 validator 已是寫入時必經之 validators[] 參數）
- ✅ 不擴張 EJS render context（`build-github.js:670-673` 之 `{ posts, builtAt }` 不變；LIMITS 常數本 phase 不暴露至 EJS）
- ✅ error code 本身已能傳達 max 違規（e.g. `description-too-long`）；length counter 留至 future phase

**Acceptance verification**（per `20260527-night-10` read-only cross-check）：

- ✅ HEAD `efd3ac5` == origin/main；ahead / behind 0/0；working tree clean
- ✅ `safe-write:test`：71 pass / 0 fail
- ✅ `validate:content`：0 errors / 42 warnings / 37 posts（與 night-2 之 phase 2 landing baseline 一致）
- ✅ commit subject 完整為 `feat(admin): add dry-run write readiness UI`（無 truncation；先前疑慮屬 terminal output 顯示問題）
- ✅ commit scope 僅 2 files；對齊允許清單
- ✅ Write-path grep gate 通過：`fetch( / XMLHttpRequest / POST / PUT` 0 命中；`fs.writeFile / fs.rename / safeWrite / writeFile` 唯一命中為 `src/views/admin/index.ejs:719` EJS `<%# %>` server-side-only 註解之**負向**聲明「無 safeWrite caller 可觸發」，屬 documentation false positive
- ✅ UI acceptance 全 PASS：SEO + FB 各一 disabled Apply button + validator preview；readiness checklist 5-row 完整

**保留限制**（landing 後仍維持）：

- ❌ Admin actual write path **仍未啟用**（disabled Apply buttons 屬視覺 shell；無 click handler 綁定；DOM 上無 fetch / fs / safeWrite caller）
- ❌ **無** safeWrite runtime caller（Phase 2 helper 仍未被 Admin UI / loader 呼叫）
- ❌ **無** fs.writeFile / fs.rename / writeFile runtime caller
- ❌ **無** fetch / POST / PUT / XMLHttpRequest
- ❌ **未**新增 Vite dev middleware / HTTP POST handler（留待 phase 4）
- ❌ **未**修改 content / settings / templates / validation-fixtures / dist / dist-blogger / gh-pages
- ❌ **未**修改 package.json / package-lock.json / vite.config.js / safe-write helpers（5 helpers + 1 self-test 未動）
- ❌ **未**做 build / deploy / Blogger repost / GA4 validation
- ❌ **未**新增 fixture
- ✅ `validate:content` baseline 維持 `0 errors / 42 warnings / 37 posts`
- ✅ `safe-write:test` = `71 pass / 0 fail`
- ✅ Step 6 sourceKey selector remains blocked by phases 4-9（per 既有 §15.F 12 條 prerequisites）
- ✅ Step 7-c source-inactive warning remains future（等真實 inactive source 出現）
- ✅ reverse UTM remains landed but dormant；pm-26 deploy gate remains blocked by no positive GitHub cross-link fixture

**下一個建議 phase**：§15.G phase 4（Vite dev middleware for Admin POST endpoint）—— 屬源碼變更；屬解開 browser → Node fs 通道之關鍵步驟；本 phase 3 landing 不啟動 phase 4。

### 15.H Boundary Reaffirmation

本 §15 補充段：

- ✅ **僅 docs**（append 至既有 admin-2-write-pre-analysis.md §15）；不新增其他 doc 檔案
- ✅ **不**修改 src / content / settings / templates / vite.config / package.json / dist
- ✅ **不**啟動 phase 2 之 safe-write helper 實作
- ✅ **不**新增 npm dependency / package script
- ✅ **不**改變 §1–§14 既有設計（包含 §6 之 B+D+E+F 策略 / §7 之 Admin-2-b sub-batches）
- ✅ §15.A 之 current state 反映 2026-05-27 baseline（HEAD `d4db570`；validate 0/42/37）
- ✅ §15.G phase 0 + 1 補的是 docs-sync gate；不取代既有 §9 之 implementation sub-batches
- ✅ Step 6 sourceKey selector remains blocked by Admin write infra（phases 2-9）；本 §15 不解除阻擋

---

（本文件結束）
