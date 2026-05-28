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
| 4 | **Vite dev middleware for Admin POST endpoint**（讓 browser POST 至 Node fs；dev-only）| source；vite.config.js custom middleware；新 npm script `dev:admin`（保留既有 `dev` 不變）| middleware spec verify；Admin UI 仍 read-only；endpoint 暫接 echo / dry-run | ⏸ pending — phase 4a docs ✅ landed `c8b7d74`；source impl 延後（see §15.G.3）|
| **4a** | **Vite middleware preanalysis docs-only**（split from phase 4；先設計 middleware shape / dev-only gate / CSRF / origin / payload schema；不實作）| docs-only；新增 `docs/20260528-admin-write-phase-4-middleware-preanalysis.md`（1 file）| 21 章節 + boundary gates 驗收；baseline 不變 | ✅ landed `c8b7d74` (2026-05-27 night-12) |
| **4b** | **Middleware preanalysis acceptance cross-check**（read-only verify Phase 4a `c8b7d74` docs；docs sync at §15.G）| read-only；no commit | baseline 不變；boundary 保留；schema / status code 一致性通過；19 章節驗收；無 source / content / package / vite config 變動 | ✅ done (Phase 20260528-admin-write-phase-4b-middleware-preanalysis-acceptance-crosscheck-readonly-a；read-only；accepted `c8b7d74`) — no commit |
| **4.5a** | **CLI write driver preanalysis docs-only**（Phase 4a §15.3 candidate A 展開；docs 設計 CLI 作為 middleware 前低風險過渡層；不實作）| docs-only；新增 `docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md`（1 file；1424 lines）| 21 章節 + payload / exit code / allowed write scope 一致性 + boundary gates 驗收；baseline 不變 | ✅ landed `32f8951` (2026-05-27 night-13) — see §15.G.3 |
| **4.5b** | **CLI driver preanalysis acceptance cross-check**（read-only verify Phase 4.5a docs；docs sync at §15.G）| read-only；no commit（acceptance）→ optional docs-sync commit at §15.G.3 | 21 章節驗收；schema / exit code / allowed write scope 一致性；無檔案變動 | ✅ done (Phase 20260527-night-14 read-only) — no commit |
| **4.5c** | **CLI source implementation dry-run only**（首個 safeWrite production caller；只支援 dry-run；不接 `--apply`；不啟用 real write）| source；新增 `src/scripts/admin-write-cli.js` + `package.json` 加 npm script `admin:write` | helper unit-testable；對 ≥3 篇 production `.md`（含 nested object）dry-run 通過；無 production content mutate；validate baseline 不退步 | ✅ landed `5efe83c` (2026-05-28 am-1) — see §15.G.4 |
| **4.5d** | **CLI dry-run acceptance**（驗 YAML emitter 對 nested object 副作用；驗 wouldWriteBytes 對齊預期）| source / verify；無 real write | wouldWriteBytes 與 expected 對齊；無 unintended frontmatter normalize | ✅ done (Phase 20260528-am-3 read-only) — no commit；see §15.G.4 |
| **4.5e** | **CLI real write gate**（首篇 production SEO description / searchDescription 寫入 draft / ready 文章；user 明確 `--apply`；首次 production content mutate）| source；CLI 解開 `--apply`；首次 safeWrite production write | git diff 驗目標 field only；validate baseline 不退步；user 手動 review + commit + push；無 auto rollback | 🔄 in-progress；YAML drift mitigation preanalysis ✅ landed `8268345` (2026-05-28 am-7) — see §15.G.5；Phase am-9 read-only acceptance ✅ done；real write **remains hard-blocked**；下一步**不是** `--apply`，而是 **4.5e-b mitigation prototype / dry-run-only spike**（field-preserving frontmatter patcher + bytes-drift fail-closed gate；CLI 維持 dry-run only；`--apply` / `dryRun:false` 雙重 fail-safe 不解開）；per §15.G.5 §F 保守拆批（4.5e-b → 4.5e-c → 4.5e-d → 4.5e-real-write）；**4.5e-b ✅ landed** `4de2d9b` (2026-05-28 pm-2) + **4.5e-c ✅ done** (pm-3 read-only acceptance；3 production .md pre/post `git hash-object` identical) + **4.5e-d ✅ docs sync** (pm-4) — see §15.G.6；real write **continues to remain blocked**；下一步為獨立 **`4.5e-real-write-gate`** phase（需 user explicit approval；尚未啟動；不繼承 4.5e-b/c 之 approval）|
| 5 | **First real write behind explicit Apply: SEO fields**（依賴 phases 2-4；per §9.1 Admin-2-b-2 + §15.E.1 ranked #1）| source；`.md` description / searchDescription write；single-file atomic | git diff verify；validate baseline 不退步；rollback flow 演練 | ⏸ pending — CLI path (4.5e) 為當下推薦首選；middleware path 延後（per §15.G.3） |
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

#### 15.G.3 Phase 4.5a Landing Details（2026-05-27 night-13；含 Phase 4a carried-in）

**Phase 名稱**：

- `20260527-night-12-admin-write-phase-4-middleware-preanalysis-docs-only-a`（Phase 4a docs preanalysis；Phase 4 middleware design 之 prerequisite；Phase 4.5a §15.3 candidate A 之上游）
- `20260527-night-13-admin-write-phase-4p5-cli-driver-preanalysis-docs-only-a`（Phase 4.5a；本 landing）
- `20260527-night-14-admin-write-phase-4p5-cli-driver-preanalysis-acceptance-crosscheck-readonly-a`（Phase 4.5b read-only acceptance；no commit）
- `20260527-night-15-admin-write-phase-4p5-docs-sync-admin-preanalysis-docs-only-a`（本 §15.G.3 docs sync；docs-only）

**Landed commits**：

| Phase | full | short | message |
|---|---|---|---|
| Phase 4a docs | `c8b7d74d8a3d4721bf2583a8086cbcc1322fcba4` | `c8b7d74` | `docs(admin): plan phase 4 vite write middleware` |
| Phase 4.5a docs | `32f895109ab8eb1ce0e03831c920d504357255f5` | `32f8951` | `docs(admin): plan phase 4.5 cli write driver` |

**Commit scope of Phase 4.5a**（1 file; 1424 insertions(+), 0 deletions(-)）：

| File | Lines | 用途 |
|---|---|---|
| `docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md` | +1424 | 21 章節 docs-only preanalysis：Phase metadata / baseline summary / why CLI exists / design overview / command proposal (3 candidates A flags / B payload file / C stdin；推薦首批 B) / payload schema (mirror Phase 4a §5；CLI 無 csrfToken) / allowed write scope (mirror Phase 4a §6；初期 `content/{github,blogger}/posts/*.md` + draft/ready + description / searchDescription) / safeWrite reuse design / atomic write flow / dry-run mode (default `dryRun: true`) / real-write gate (9 gates) / pre-/post-write validation / 10 exit codes (mirror Phase 4a HTTP status；CLI exit ↔ HTTP status 1-to-1) / rollback design (manual `git restore`；不自動) / Admin UI relationship (不啟用 Apply；不新增 fetch / XHR；future CLI command preview) / 11 security risks (shell escaping / long text / accidental overwrite / wrong file target / path traversal / arbitrary field / bulk write / published content / race condition / payload leakage / regression) / candidate comparison (A docs-only / B CLI source / C middleware source / D dry-run only) / recommended sequence (4a → 4b → 4.5a → 4.5b → 4.5c → 4.5d → 4.5e) / explicit non-goals / acceptance checklist / boundary reaffirmation |

**Acceptance verification**（per `20260527-night-14` read-only cross-check；no commit；docs sync recorded by `20260527-night-15` 本 §15.G.3）：

- ✅ HEAD `32f8951` == origin/main；ahead/behind 0/0；working tree clean
- ✅ `safe-write:test`：71 pass / 0 fail（與 Phase 2 landing `5bcdd02` baseline 一致）
- ✅ `validate:content`：0 errors / 42 warnings / 37 posts（與 Phase 2 / Phase 3 / Phase 4a landing baseline 一致）
- ✅ 21 章節全部命中（§1 metadata / §2 baseline / §3 why CLI / §4 design overview / §5 command proposal / §6 payload schema / §7 allowed write scope / §8 safeWrite reuse / §9 atomic flow / §10 dry-run / §11 real-write gate / §12 pre-/post-write validation / §13 exit codes / §14 rollback / §15 Admin UI / §16 security / §17 candidate comparison / §18 sequence / §19 non-goals / §20 acceptance / §21 boundary）
- ✅ payload schema 與 Phase 4a middleware payload 同形（targetRel / field / newValue / expectedOldValue / dryRun；CLI 無 csrfToken）
- ✅ exit code 與 Phase 4a HTTP status 1-to-1 mapping（exit 0/1/2/3/4/5/6/7/8/9 ↔ 200/500/400/400/403/409/409/422/500/200+regression）
- ✅ allowed write scope 保守：只允 `content/{github,blogger}/posts/*.md` + draft/ready status + description / searchDescription field；禁 published / `.publish.json` / `.fb.md` / relatedLinks / book.* / download.* / category / tags / status / publishTargets / slug / title / titleEn / settings / templates / validation-fixtures / pages / dist / src / package / vite config / gh-pages / .cache / node_modules
- ✅ non-goals 全部命中：不實作 CLI / 不修改 package.json / 不新增 npm script / 不實作 middleware / 不啟用 Apply / 不新增 fetch / XHR / click handler / 不打開 browser → Node fs 通道 / 不新增 safeWrite production caller / 不做 content write / 不解除 pm-26 deploy gate / 不建立 reverse UTM fixture
- ✅ commit scope 只有 1 個 docs file；無 src / content / settings / templates / fixtures / dist / package / vite config 變動

**保留限制**（Phase 4.5a landing 後仍維持）：

- ❌ **無** CLI source（`src/scripts/admin-write-cli.js` 不存在；待 Phase 4.5c；requires explicit user approval）
- ❌ **無** `admin:write` npm script（待 Phase 4.5c）
- ❌ **無** middleware source（`vite.config.js` 無 `configureServer`；待 Phase 5；本 §15.G.3 建議延後至 4.5e 完成後再評估）
- ❌ **無** Admin UI Apply button enable（Phase 3b 之 disabled 狀態 100% 保留；DOM 上 `fetch(` / `XMLHttpRequest` / `addEventListener('click', ...)` 對 `.apply-disabled` 命中 = 0）
- ❌ **無** safeWrite runtime production caller（Phase 2 helper 仍未被 production caller 呼叫；唯一 caller 為 `safe-write-test.js` self-test）
- ❌ **無** production content mutate（無 `fs.writeFile` / `fs.rename` 對 `content/**/*.md` / `.publish.json` / `.fb.md`）
- ❌ **未**修改 src / content / settings / templates / validation-fixtures / dist / dist-blogger / dist-promotion / dist-reports / gh-pages / package.json / package-lock.json / vite.config.js
- ❌ **未**做 build / deploy / Blogger repost / GA4 validation
- ❌ **未**新增 fixture
- ✅ `validate:content` baseline 維持 `0 errors / 42 warnings / 37 posts`
- ✅ `safe-write:test` = `71 pass / 0 fail`
- ✅ Step 6 sourceKey selector remains blocked by phases 4-9（per 既有 §15.F 12 條 prerequisites）
- ✅ reverse UTM remains landed but dormant；pm-26 deploy gate remains blocked by no positive GitHub cross-link fixture

**下一階段狀態**（per Phase 4.5a §18 recommended sequence）：

- **Phase 4.5c**（CLI source implementation dry-run only）：⏸ **not started**；requires explicit user approval；source 階段；首個 safeWrite production caller 但只支援 dry-run（不接 `--apply`）；新增 `src/scripts/admin-write-cli.js` + `package.json` 加 `admin:write` script
- **Phase 4.5d**（CLI dry-run acceptance）：⏸ not started；驗 YAML emitter 對 nested object 副作用；無 real write
- **Phase 4.5e**（first real content write gate via CLI）：⏸ **not started**；requires explicit user approval；首次 production SEO description / searchDescription 寫入 draft / ready 文章；per Phase 4.5a §11 之 9-gate
- **Phase 5**（middleware source implementation；§15.G phase 4 列）：⏸ **not recommended yet / deferred**；per Phase 4.5a §18.3 user 可選擇延後至 CLI path 完成後再評估；CLI path 與 middleware path 功能等價，user 可選擇任一條或並行
- **pm-26 deploy gate**：remains **blocked** by no positive GitHub cross-link fixture（per CLAUDE.md §16.4）
- **reverse UTM source landing**：remains **dormant**（source landed at pm-24a/b/c `7e1d356` / `e2309e9` / `7c769fe`；Blogger 後台未重貼；GA4 Realtime 未驗收；live 狀態 dormant）

**下一個建議 phase**：§15.G phase 4.5c（CLI source implementation dry-run only）—— 屬源碼變更；需獨立 user 簽收；本 docs sync 不啟動。Phase 4b acceptance cross-check 已 ✅ done（read-only；no commit；accepted Phase 4a `c8b7d74` docs）。

#### 15.G.4 Phase 4.5c Landing + Phase 4.5d Acceptance Details（2026-05-28 am-1 → am-4）

**Phase 名稱**：

- `20260528-am-1-admin-write-phase-4p5c-cli-driver-dry-run-source-a`（Phase 4.5c source；CLI dry-run only）
- `20260528-am-2-admin-write-phase-4p5c-cli-driver-commit-push-main-only-a`（Phase 4.5c commit + push）
- `20260528-am-3-admin-write-phase-4p5d-cli-driver-dry-run-acceptance-readonly-a`（Phase 4.5d read-only acceptance；no commit）
- `20260528-am-4-admin-write-phase-4p5c-4p5d-docs-sync-a`（本 §15.G.4 docs sync；docs-only）

**Landed commits**：

| Phase | full | short | message |
|---|---|---|---|
| Phase 4.5c source | `5efe83c29e61261d48b97688db3643e2579075dc` | `5efe83c` | `feat(admin): add dry-run CLI write driver` |

**Phase 4.5c commit scope**（3 files; 661 insertions(+), 1 deletion(-)）：

| File | LOC | 用途 |
|---|---|---|
| `package.json` | +2 / -1 | 新增 npm script `admin:write` 指向 `node src/scripts/admin-write-cli.js`；無新 dependency；package-lock 未動 |
| `src/scripts/admin-write-cli.js` | +454（new） | CLI dry-run driver；export `runCli({ argv, projectRoot })` 為純函式（return `{ exit, stdoutJson, stderrLines }`）；entry-point 守門 `if (isMainModule()) ...`；接 `--payload=<file>` (Candidate B per Phase 4.5a §5.5)；payload schema 對齊 Phase 4a §5.3 / Phase 4.5a §6.2（`targetRel` / `field` / `newValue` / `expectedOldValue` / `dryRun` 五個必填 + 可選 `reason` xor `memo`）；allowed field enum `{description, searchDescription}`；allowed targetRel 透過 `isWriteAllowed` 限 `content/{blogger,github}/posts/*.md`（4.5c 額外收窄為 `post-md` kind；`.publish.json` / `.fb.md` 即使白名單通過仍 reject）；allowed status `{draft, ready}`；exit code mirror Phase 4.5a §13.1（0 dry-run pass / 1 invalid-project-root or unknown / 2 invalid-args 含 `--apply` 或 `dryRun:false` 拒絕 / 3 invalid-payload / 4 forbidden-target / 6 expected-old-value-mismatch / 7 validator-failed or target-status-not-allowed / 8 read-failed or frontmatter-parse-failed / 9 reserved post-write regression — 4.5c 不觸發）；imports 僅 `node:fs/promises`（read-only fs.readFile）/ `node:path` / `node:url` / `gray-matter` / `./admin-write-whitelist.js#isWriteAllowed` / `./admin-field-validators.js#{validateDescription,validateSearchDescription,LIMITS}`；**不** import `safeWrite` / `fs.writeFile` / `fs.rename` / `checkGitStatus`；CLI 內無 fs.write 系列 syscall（dry-run 僅讀取目標檔、stringify 至 buffer、丟入 stdout JSON）|
| `src/scripts/safe-write-test.js` | +205 | import `runCli` 並追加 `[admin-write-cli]` 區塊（33 assertions）；OS temp dir only（`fs.mkdtemp(os.tmpdir())`）；建立 fixture post（draft）+ published-status post 後跑 CLI；逐項驗：missing `--payload` (exit 2) / unknown arg (2) / `--apply` reject (2 + reason `apply-not-supported-in-phase-4p5c`) / missing file (2) / invalid JSON (3) / array payload (3) / missing required fields (3) / field not in allowlist (3) / non-boolean dryRun (3) / `dryRun:false` reject (2 + same reason) / `reason+memo` mutex (3) / absolute targetRel (4) / `..` traversal (4) / `content/settings` target (4) / non-`post-md` kind (4) / file not found (8) / published reject (7) / expectedOldValue mismatch (6) / too-long newValue (7) / control char (7) / non-string newValue (3) / success dry-run (0) / mode echo / target normalized / `changed:true` / validator pass / no mutation / no `.tmp` / searchDescription success / no-op `changed:false` (0) / reason echo / empty projectRoot (1) |

**Phase 4.5c CLI behaviour gates**：

- ✅ `--apply` flag → exit 2 with reason `apply-not-supported-in-phase-4p5c`；不執行 payload load 之後步驟（fail-safe early-exit）
- ✅ payload `dryRun: false` → exit 2 with reason `apply-not-supported-in-phase-4p5c`；shape check 後立刻 reject
- ✅ payload omits `dryRun` → reject as invalid-payload (3, `dryRun-must-be-boolean`)（保守：不採用 §10.1 之「省略視為 true」；要求顯式 true 以對齊 Phase 4a middleware）
- ✅ 無 fs.writeFile / fs.rename / safeWrite / checkGitStatus 之 caller；對 grep `safeWrite|fs\.writeFile|fs\.rename|checkGitStatus` 之命中為單一 comment line（`admin-write-cli.js:8`，「Never calls fs.writeFile / fs.rename / safeWrite (no real write surface).」）
- ✅ stdout 為單一 JSON object；stderr 為 `[admin-write] ...` 多行 trace；`--quiet` 暫不實作（Phase 4.5e+ 可選擇加）

**Phase 4.5d acceptance verification**（per `20260528-am-3` read-only cross-check；no commit；docs sync recorded by `20260528-am-4` 本 §15.G.4）：

- ✅ HEAD `5efe83c` == origin/main；ahead / behind 0/0；working tree clean throughout 整輪 acceptance
- ✅ `safe-write:test`：104 pass / 0 fail（Phase 4.5c landing 起 stable）
- ✅ `validate:content`：0 errors / 42 warnings / 37 posts（與 Phase 2 / 3 / 4a / 4.5a landing baseline 一致）

**3 production `.md` dry-run cases**（皆 exit 0；stdout `ok:true` / `mode:"dry-run"` / `phase:"4.5c"`；pre/post `git hash-object` 一致）：

| # | File | Site | Status | Field | newValue vs old | changed | bytesChanged | bytesDelta | 覆蓋條件 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `content/blogger/posts/20260515-we-media-myself2.md` | blogger | ready | `searchDescription` | 126→71 chars (Mandarin → mixed ASCII) | true | true | −218 | blogger ✅；複雜 nested（`book.authors[]` / `affiliate.links[]` / `relatedLinks[]` / `blocks.*` / `publishTargets.{github,blogger}`）✅；searchDescription ✅；changed dry-run ✅ |
| 2 | `content/github/posts/20260504-github-pages-blog-planning.md` | github | ready | `description` | newValue === expectedOldValue（32 chars 重複） | false | **true** | **−32** | github ✅；inline-array `tags: ["github", "vite", "static-site"]` ✅；description ✅；no-op dry-run ✅（`changed:false`）|
| 3 | `content/blogger/posts/20260525-draft-book-review.md` | blogger | draft | `description` | "" → 40 chars | true | true | +31 | blogger ✅；draft status ✅；description ✅；empty → populated transition ✅；changed dry-run ✅ |

**Pre/post `git hash-object` 證據**：

| File | Pre-hash | Post-hash | Match |
|---|---|---|---|
| `content/blogger/posts/20260515-we-media-myself2.md` | `5c3b4ad8ddb5cc2b299dc5c110d57fb5509a70f0` | `5c3b4ad8ddb5cc2b299dc5c110d57fb5509a70f0` | ✅ |
| `content/github/posts/20260504-github-pages-blog-planning.md` | `533942b2905bb05c877939e6355f9738714bc9c4` | `533942b2905bb05c877939e6355f9738714bc9c4` | ✅ |
| `content/blogger/posts/20260525-draft-book-review.md` | `9827142ae5215fdf0b984cc0b96d62f78ff55dd3` | `9827142ae5215fdf0b984cc0b96d62f78ff55dd3` | ✅ |

→ Dry-run 路徑對 production content **零 mutation**；無 `.tmp` / `.bak` artifact；`git status` 全程 clean。

**6 fail-safe spot checks**（皆使用 OS temp payload；無 repo 污染；temp dir 已清除）：

| # | Case | Expected | Actual exit / reason |
|---|---|---|---|
| 1 | `dryRun: false` | exit 2 / `apply-not-supported-in-phase-4p5c` | ✅ 2 / 同 reason；detail `payload.dryRun must be true. Real write opens in phase 4.5e.` |
| 2 | `--apply` flag | exit 2 / `apply-not-supported-in-phase-4p5c` | ✅ 2 / 同 reason；detail `CLI is dry-run only. Real write opens in phase 4.5e.` |
| 3 | `field: "title"` | exit 3 / `invalid-payload` / `field-not-in-allowlist` | ✅ 3 / 完整 detail |
| 4a | `targetRel: content/settings/site.config.json` | exit 4 / `forbidden-target` | ✅ 4 / detail `not-in-posts-folder`（whitelist 第二層 reject）|
| 4b | `targetRel: content/blogger/posts/../../../etc/passwd` | exit 4 / `forbidden-target` | ✅ 4 / detail `targetRel-has-dot-segment`（CLI 第一層 sanity reject；whitelist 雙層備援）|
| 5 | `expectedOldValue` mismatch | exit 6 / `expected-old-value-mismatch` | ✅ 6 / `actualOldLen=126 / expectedOldLen=59` |
| 6 | published-status production post | exit 7 / `target-status-not-allowed` | ⚠️ **未做 live test**：`content/{blogger,github}/posts/` 內 0 個 production post 有 `status: published`（唯一命中為 `content/validation-fixtures/github/posts/_test-fb-post-url-{missing,populated}.md`，但 whitelist 對 5-part path reject）；per instruction「不要為了測試去改檔」明確 reported；coverage 已存於 `safe-write-test.js` synthetic temp-fixture（test `CLI rejects published target`）|

**⚠️ Critical Phase 4.5e blocker / caveat — YAML emitter drift**：

- **Phenomenon**：dry-run 之 `bytesChanged` 與 `diffSummary.changed` 不等價。`changed` 反映「目標 field 是否真的變了」（`payload.newValue !== payload.expectedOldValue`）；`bytesChanged` 反映「整檔 stringify 後 bytes 是否與原檔一致」。在 production frontmatter 上，即使 `changed: false`，`bytesChanged` 仍可為 `true`。
- **Concrete example**：case 2 `content/github/posts/20260504-github-pages-blog-planning.md`，field `description`，no-op 寫入：
  - `changed`: `false`
  - `bytesChanged`: `true`
  - `bytesDelta`: `−32`
  - 原檔 currentBytes 1143 → stringify 後 wouldWriteBytes 1111
- **Cause**：`gray-matter` 內部使用 `js-yaml` emitter；對 inline arrays / indentation / empty 行有 normalize 行為。原檔包含 `tags: ["github", "vite", "static-site"]`（inline）/ 結構化縮排；stringify 後可能轉為 block style array `tags:\n  - github\n  ...` 或調整 spacing。即使目標 field 完全未動，**非目標 frontmatter sections 仍會被重排**。
- **Cross-link to Phase 4.5a §9.3**：本現象正是 Phase 4.5a §9.3 提前點出之風險；Phase 4.5d acceptance 之 design purpose 即為「以 production content 實測 surface 此 risk」。case 2 已具體 quantify drift（−32 bytes on a no-op write）。
- **Phase 4.5e 之硬性 blocker**：在 YAML drift mitigation 設計 + 簽收前，`--apply` **不得**解開。理由：
  1. real write 將把 `bytesChanged` 之非目標部分 commit 入 git；`git diff` 會顯示遠超 SEO 雙欄之變動範圍
  2. user 之 `git add <file>` 將包含未審查之 YAML 重排；變動範圍不可預測
  3. 多次 real write 累積後，所有 production frontmatter 將被 `gray-matter` style 同質化，喪失既有手寫格式
  4. 對 review / audit / blame 之 signal-to-noise ratio 大幅降低
- **Future Phase 4.5e acceptance gate 必須區分**：
  - ✅ targeted field mutation（intended）
  - ❌ unrelated YAML emitter drift（unintended）
  - acceptance gate 推薦：`git diff` 之 +/− 行數需 ≤ 對目標 field 之 expected delta；超出即 fail closed
- **Possible mitigation directions（NOT implemented in this phase；屬 4.5e pre-analysis scope）**：
  - **方向 A — field-preserving frontmatter patcher**：放棄 `matter.stringify`；改用 line-based regex / AST-aware patcher 只動目標 field 之 value bytes；保留其餘 raw bytes
  - **方向 B — stricter no-surprise-rewrite gate**：保留 `matter.stringify`；但 pre-write 比對 stringify-roundtrip 之 byte drift；若超出目標 field 之預期長度差 → fail closed
  - **方向 C — js-yaml emitter options tuning**：探索 `js-yaml` dump options（`noCompatMode` / `flowLevel` / `lineWidth` / `noRefs` / `quotingType`）是否可逼近原檔 style；validate 對多 production sample 之 drift 量
  - **方向 D — accept YAML normalize as feature**：先一次性對所有 production posts 跑 `matter.stringify` round-trip 並 commit「normalize-only」change；之後所有 SEO write 之 `bytesDelta` 即等於目標 field delta；屬大型 prep commit
- **本 phase 不選擇 mitigation 方向**；屬 Phase 4.5e pre-analysis 之獨立決策；本 §15.G.4 僅 surface + reserve。

**保留限制**（Phase 4.5c landing + Phase 4.5d acceptance 後仍維持）：

- ❌ **無** real write surface（CLI 為 dry-run only；`--apply` 與 `dryRun:false` 雙重 fail-safe reject）
- ❌ **無** middleware source（`vite.config.js` 無 `configureServer`；Phase 5 仍 deferred per Phase 4.5a §18.3）
- ❌ **無** Admin UI Apply enable（Phase 3b 之 disabled 狀態 100% 保留；EJS 內 `fetch(` / `XMLHttpRequest` / `addEventListener('click', ...)` 對 `.apply-disabled` 命中 = 0）
- ❌ **無** safeWrite production runtime caller（CLI 不 import safeWrite；唯一 caller 仍為 `safe-write-test.js` self-test）
- ❌ **無** production content mutation（3 production `.md` 之 hash 在 acceptance 前/後 byte-identical；無 `.tmp` / `.bak` 殘留）
- ❌ **未**修改 src（CLI source 已 landed at 4.5c；本 §15.G.4 docs sync 不動 src）/ content / settings / templates / validation-fixtures / dist / dist-blogger / dist-promotion / dist-reports / gh-pages / package.json / package-lock.json / vite.config.js
- ❌ **未**做 build / deploy / Blogger repost / GA4 validation
- ❌ **未**新增 fixture（acceptance temp payloads 全部於 OS temp dir；acceptance 結束時 `fs.rm` 清除；repo 內 zero pollution）
- ✅ `validate:content` baseline 維持 `0 errors / 42 warnings / 37 posts`
- ✅ `safe-write:test` = `104 pass / 0 fail`（自 71/0 擴至 104/0；新增 33 CLI assertions）
- ✅ Step 6 sourceKey selector remains blocked by phases 4-9（per 既有 §15.F 12 條 prerequisites）
- ✅ reverse UTM remains landed but dormant；pm-26 deploy gate remains blocked by no positive GitHub cross-link fixture

**下一階段狀態**（per Phase 4.5a §18 recommended sequence；含本 §15.G.4 新增 blocker）：

- **Phase 4.5e**（first real content write gate via CLI）：⏸ **not started**；requires explicit user approval；**新增 hard-block：YAML emitter drift mitigation design 必須先完成**（per 本 §15.G.4 caveat）；屬獨立 phase 4.5e-pre-analysis docs-only 作為前置
- **Phase 5**（middleware source implementation；§15.G phase 4 列）：⏸ **deferred**；per Phase 4.5a §18.3 user 可選擇延後至 CLI path 完成後再評估
- **pm-26 deploy gate**：remains **blocked** by no positive GitHub cross-link fixture（per CLAUDE.md §16.4）
- **reverse UTM source landing**：remains **dormant**（source landed at pm-24a/b/c `7e1d356` / `e2309e9` / `7c769fe`；Blogger 後台未重貼；GA4 Realtime 未驗收；live 狀態 dormant）

**下一個建議 phase**：兩條候選並列：

1. **Phase 4.5e pre-analysis docs-only**（推薦）：對本 §15.G.4 caveat 之 mitigation 方向 A/B/C/D 做 trade-off analysis；落定 acceptance gate 之 byte-drift threshold；不實作；docs only。
2. **Final Idle Freeze**：當下 CLI dormant；無 real write surface；無下游 live state degradation；若 user 無立即推進需求亦可選此路徑。

本 §15.G.4 docs sync 不啟動上述任一條；屬獨立 user 決策。

#### 15.G.5 Phase 4.5e YAML Drift Mitigation Preanalysis Checkpoint（2026-05-28 am-7 → am-10）

**Phase 名稱**：

- `20260528-am-7-admin-write-phase-4p5e-yaml-drift-mitigation-preanalysis-docs-only-a`（4.5e mitigation preanalysis 文件落地；docs-only）
- `20260528-am-9-admin-write-phase-4p5e-mitigation-preanalysis-acceptance-crosscheck-readonly-a`（am-9 read-only acceptance cross-check；no commit）
- `20260528-am-10-admin-write-phase-4p5e-preanalysis-docs-sync-a`（本 §15.G.5 docs sync；docs-only）

##### A. Landed documents / commits

| 項目 | 值 |
|---|---|
| Landed commit (full) | `826834550e7c20a2c28a853a18ebfa819703406e` |
| Landed commit (short) | `8268345` |
| Commit subject | `docs(admin): analyze yaml drift mitigation for cli writes` |
| Added file | `docs/20260528-admin-write-phase-4p5e-yaml-drift-mitigation-preanalysis.md`（13 章節 docs-only preanalysis）|
| am-9 read-only acceptance | ✅ done；`safe-write:test` 104/0；`validate:content` 0 errors / 42 warnings / 37 posts；HEAD == origin/main；ahead/behind 0/0；working tree clean |

##### B. Problem recap

- `diffSummary.changed` 與 `bytesChanged` **不等價**：前者反映「目標 field 之 string value 是否真的變了」，後者反映「整檔 `matter.stringify` 後 bytes 是否與原檔一致」
- `gray-matter` 之 `matter.stringify`（內部使用 `js-yaml` emitter）對 inline arrays / indentation / quoting / line-width / empty-line 等多個 surface 會 normalize；YAML inline comment 在 round-trip 後被丟棄
- **No-op 也可能 `bytesChanged: true`**：即使 `payload.newValue === payload.expectedOldValue`，stringify 仍會跑完整 dump；原檔任一非 emitter-default 樣式即會產生 byte drift
- Concrete evidence — `content/github/posts/20260504-github-pages-blog-planning.md`：
  - field: `description`
  - `changed`: **`false`**
  - `bytesChanged`: **`true`**
  - `bytesDelta`: **`−32`**
  - `currentBytes` 1143 → `wouldWriteBytes` 1111
  - 推測 normalize 來源：`tags: ["github", "vite", "static-site"]` inline → block style；nested `publishTargets.*` 縮排；quoting heuristics
  - pre/post `git hash-object` identical（CLI 為 dry-run；未寫檔）

##### C. Mitigation candidates summary

| 方向 | 說明 | 評估 |
|---|---|---|
| A | **Field-preserving frontmatter patcher**（line-based / AST-aware；只動目標 field 之 value bytes；保留其餘 raw bytes byte-identical）| ✅ **首選** |
| B | **`matter.stringify` + fail-closed bytes-drift gate**（pre-write 比對 `unexpectedDrift = actualDelta − expectedDelta`，超出 tolerance 即 reject）| 🟡 **次選 / defense-in-depth**（作為 A 之最終 safety net；不單獨採用）|
| C | **`js-yaml` emitter options tuning**（`flowLevel` / `lineWidth` / `quotingType` / `indent` 等）| ❌ **不建議作為唯一解**（inline comment loss 為硬傷；inline flow array 還原能力有限）|
| D | **One-time normalize-only commit**（先對 ≥37 篇 production posts 跑一次 `matter.stringify` round-trip 並 commit；之後 SEO write drift = 0）| ❌ **不建議作為首選**（comment loss / 不可逆 / 大量 review pressure；屬最後手段）|

##### D. Recommended path

per `feedback_conservative_landing.md`（保守落地路線）：

- **不**直接開 `--apply`
- **不**直接做 content-wide normalize（方向 D）
- **優先**：field-preserving frontmatter patcher（方向 A）**+** bytes-drift fail-closed gate（方向 B）作為 defense-in-depth
- 若 prototype 階段判斷無法保證 non-target YAML sections 不被改寫（如方向 A 對 block scalar / 特殊 char 之 edge case 太多）→ Phase 4.5e real write **繼續 hard-blocked**；CLI 維持 dry-run only；不退而求其次走方向 D

##### E. Acceptance gate summary

per 4.5e preanalysis §8 之最低要求：

- **No-op must not mutate file**：`payload.newValue === payload.expectedOldValue` → 不觸發 `fs.writeFile`；無 `.tmp` artifact；pre/post `git hash-object` identical
- **Changed target field must not rewrite unrelated frontmatter**：`git diff` 限於目標 field 之 single key/value；非目標 sections（`tags` / `publishTargets` / `blocks` / `book` / `affiliate` / `images` / `relatedLinks` / `otherLinks` / 等）byte-exact preserved
- **必須有測試覆蓋**：inline array / nested object / affiliate links / relatedLinks / empty field / non-empty field / special chars (中文 / `"` / `'` / `:` / `#`) / field-not-present 等 case
- `safe-write:test` **must remain green**（baseline 至少 104/0；mitigation 新測試為 additive）
- `validate:content` **must remain unchanged**（`0 errors / 42 warnings / 37 posts`）
- **No package dependency change** unless explicitly approved（不 `npm install`；不引 `yaml` / `yaml-ast-parser` 等替代 lib；不升級 `gray-matter` / `js-yaml`）
- `dryRun:false` **仍 reject until mitigation accepted**（CLI fail-safe 不解開直至 4.5e-c acceptance 通過）
- `--apply` **仍 reject until explicit real-write approval**（4.5e-real-write 需獨立 user 簽收；不繼承 mitigation acceptance 之 approval）

##### F. Conservative next phases

per 4.5e preanalysis §9 之 phase sequence：

| Phase | Kind | 目標 |
|---|---|---|
| **4.5e-b** | source spike / prototype | 對方向 A patcher 做 minimum viable prototype（description / searchDescription 雙欄 single-line string）；新增 `src/scripts/admin-frontmatter-patcher.js` 或 inline 進 CLI；新增對應 unit test；**仍 dry-run only**；`--apply` 仍 reject |
| **4.5e-c** | dry-run acceptance | 對 ≥3 篇 production `.md`（含 inline array + nested object）跑 mitigation 後之 dry-run；驗 §E 之 no-op gate / non-target preserved gate；pre/post `git hash-object` identical；無 production content mutate |
| **4.5e-d** | docs sync | 把 4.5e-b / 4.5e-c 結果記入本文件 §15.G 新節（屬獨立 phase；不在 4.5e-b/c 同 phase）|
| **4.5e-real-write** | gate | **獨立 user explicit approval**；單篇 SEO 雙欄首寫；user 在 terminal 觀察 git diff 後手動 commit；首寫對象建議 draft / ready 之短 frontmatter `.md`（非含 nested affiliate / book schema 之長檔）|

**保守原則**：

- 每階段最大 1 種 source change
- 每階段獨立 user approval
- mitigation source landing 與 real write **不在同 phase**
- docs sync 在每階段 source change 之後**另立 phase**
- 任一階段 baseline 退步即 hard-block 下一階段

##### G. Non-goals / retained boundaries

本 §15.G.5 docs sync phase（am-10）**不做**：

- ❌ **no implementation in this docs sync**（不寫 patcher；不寫 byte-drift gate；不擴 CLI；不擴 safeWrite；不擴 validator；不擴 whitelist）
- ❌ **no content rewrite**（不動任一 `content/**` 檔；不做 normalize-only commit）
- ❌ **no Admin Apply enable**（Phase 3b 之 disabled Apply button 100% 保留）
- ❌ **no middleware route**（`vite.config.js` 之 `configureServer` 維持空；Phase 5 仍 deferred）
- ❌ **no build / deploy / Blogger repost / GA4 validation**
- ❌ **no fixture creation**（不新增 `content/validation-fixtures/**`；不在 repo 內留下 acceptance artifact）
- ❌ **no `npm install`**；no `package.json` / `package-lock.json` mutation；no dep upgrade
- ❌ **no `git fetch` / commit / push**（本 docs sync 交付後由 user 在 terminal 手動 review / commit）

**保留邊界**：

- ✅ CLI 維持 dry-run only（per Phase 4.5c `5efe83c`）
- ✅ `--apply` 維持 fail-safe reject（exit 2 / reason `apply-not-supported-in-phase-4p5c`）
- ✅ `payload.dryRun: false` 維持 fail-safe reject（同 reason）
- ✅ `safe-write:test` 104 pass / 0 fail
- ✅ `validate:content` 0 errors / 42 warnings / 37 posts
- ✅ Step 6 sourceKey selector remains blocked by phases 4-9（per 既有 §15.F 12 條 prerequisites）
- ✅ reverse UTM remains landed but dormant；pm-26 deploy gate remains blocked by no positive GitHub cross-link fixture（per CLAUDE.md §16.4）

**下一個建議 phase**：Phase 4.5e-b（source spike / prototype；新增 field-preserving frontmatter patcher；仍 dry-run only）—— 屬源碼變更；**需獨立 user 簽收**；本 §15.G.5 docs sync 不啟動。

#### 15.G.6 Phase 4.5e-b Patcher Prototype Landing + Phase 4.5e-c Production Acceptance（2026-05-28 pm-2 → pm-4）

Phases that produced this checkpoint:

- `20260528-pm-1-admin-write-yaml-drift-next-work-triage-readonly-a`（pm-1 read-only triage；no commit；recommended C = source implementation as next phase）
- `20260528-pm-2-admin-write-phase-4p5e-b-patcher-prototype-commit-push-a`（4.5e-b patcher prototype source landing；source + tests；committed + pushed）
- `20260528-pm-3-admin-write-phase-4p5e-c-patcher-acceptance-readonly-a`（4.5e-c production sample acceptance；read-only；no commit）
- `20260528-pm-4-admin-write-phase-4p5e-d-docs-sync-commit-push-a`（本 §15.G.6 docs sync；docs-only）

##### A. Phase 4.5e-b — Source Landing

| 項目 | 值 |
|---|---|
| Commit full hash | `4de2d9b4e58d8e459bba421a29710d3aebc8b9fe` |
| Short hash | `4de2d9b` |
| Subject | `feat(admin): add frontmatter patcher prototype` |
| Committed | 2026-05-28 14:39:10 +0800 |
| Changed files | `src/scripts/admin-frontmatter-patcher.js`（新增 326 lines）/ `src/scripts/admin-write-cli.js`（mutation pipeline 改用 patcher）/ `src/scripts/safe-write-test.js`（+56 additive test cases）|
| `safe-write:test` | `104 pass / 0 fail` → **`160 pass / 0 fail`**（+56 additive；既有 104 不退步）|
| `validate:content` | `0 errors / 42 warnings / 37 posts`（與 baseline 一致；本 phase 未動 content）|
| package.json / package-lock.json | 未動 |
| vite.config.js | 未動 |
| src/views/admin/index.ejs | 未動（Admin Apply button 維持 disabled）|

##### B. Patcher Mitigation Summary

per `src/scripts/admin-frontmatter-patcher.js`：

- Line-based targeted frontmatter patcher（per §15.G.5 §D 方向 A 首選）
- 對非目標 frontmatter sections **byte-for-byte preserved**（inline arrays / block-style arrays / nested objects / YAML inline comments / quoting / indentation 皆原樣保留）
- No-op output **byte-identical** with input（避免 §15.G.4 之 `changed:false` 但 `bytesChanged:true` 之 semantic gap）
- 避開 `gray-matter` `matter.stringify` / 內部 `js-yaml` emitter 之 round-trip normalize 行為
- 目前僅支援 CLI 既允許之保守 top-level scalar 欄位：
  - `description`
  - `searchDescription`
- Unsupported / unsafe structures **fail closed**（block scalar `|`/`>`、missing key、duplicate top-level key、nested dot path、non-allowlist field、non-string value、缺 frontmatter delimiter）；不退而 fallback `matter.stringify` 全量 dump
- 不寫檔（純 in-memory 字串處理；返回 patched text）
- 不 spawn process（無 `child_process` / `spawn` / `exec`）
- 不引入新 npm package（zero import；既有 `gray-matter` 仍只用於 parse）
- CLI 維持 **dry-run only**（patcher 之輸出供 dry-run preview 用；CLI 仍不呼叫 `fs.writeFile` / `safeWrite`）

##### C. Phase 4.5e-c — Production Sample Acceptance Result

| 項目 | 值 |
|---|---|
| Phase ID | `20260528-pm-3-admin-write-phase-4p5e-c-patcher-acceptance-readonly-a` |
| Baseline HEAD | `4de2d9b` = `origin/main`；ahead/behind 0/0 |
| `safe-write:test` | `160 pass / 0 fail` |
| `validate:content` | `0 errors / 42 warnings / 37 posts` |
| Working tree | clean |
| Approach | read-only；CLI dry-run only；無 commit / push；無 src / docs / content mutation |
| Pre/post `git hash-object` per file | identical（3 production .md 均 byte-identical 前後） |

##### D. Production Sample Findings

**§15.G.4 case 2 之 YAML emitter drift 已消失**：

- File：`content/github/posts/20260504-github-pages-blog-planning.md`
- Field：`description`
- No-op invocation（`newValue === expectedOldValue`）result：
  - `diffSummary.changed` = **`false`**
  - `diffSummary.bytesChanged` = **`false`**（§15.G.4 之 hard-block surface 已解除）
  - `bytesDelta` = **`0`**
  - `currentBytes` → `wouldWriteBytes` = **`1143` → `1143`**（§15.G.4 紀錄之 `1143 → 1111 / −32` 已不再發生）

**Targeted update dry-run（GitHub MVP，frontmatter 含 YAML inline comments + block-style tags array + nested seo）**：

- File：`content/github/posts/20260504-portable-blog-system-mvp.md`
- Field：`searchDescription`
- Expected `bytesDelta` = **`+16`**；Actual `bytesDelta` = **`+16`**（精準預測；無 non-target YAML drift）
- frontmatter 內 YAML 註解、`tags:` block-style array、`seo.indexing` nested 欄位、`publishTargets` nested 區塊皆 verbatim 保留

**Targeted update dry-run（Blogger draft；empty description patch）**：

- File：`content/blogger/posts/20260525-draft-book-review.md`
- Field：`description`
- Old value：`""`（empty quoted string）
- Expected `bytesDelta` = **`+33`**；Actual `bytesDelta` = **`+33`**（11 中文字 × 3 bytes UTF-8 = 33；精準預測；無 non-target YAML drift）

##### E. Status Wording Update

§15.G.4 ⚠️ caveat（line 1012 起）紀錄之「YAML emitter drift hard-block」現況更新為：

- **YAML emitter drift mitigation source is landed and accepted for dry-run scope**（per pm-2 commit `4de2d9b` + pm-3 acceptance）
- Real write **remains blocked** until explicit future approval and a separate real-write gate phase
- §15.G.4 之歷史紀錄（含 `1143 → 1111 / −32` 等具體 evidence）保留不動，作為 pre-mitigation baseline 參考

本更新**不**意涵：

- ❌ **不**意涵 real write 已可開放
- ❌ **不**意涵 Admin Apply button 已可啟用
- ❌ **不**意涵 middleware write route 已存在
- ❌ **不**意涵 CLI `--apply` 已可使用
- ❌ **不**意涵 `dryRun: false` 已可接受

##### F. Continued Gates（仍維持 fail-safe）

- ✅ CLI `--apply` flag **remains rejected**（exit 2 / `apply-not-supported-in-phase-4p5c`）
- ✅ `payload.dryRun: false` **remains rejected**（同 reason）
- ✅ Admin Apply button **remains disabled**（`src/views/admin/index.ejs` lines 616-619 之 `disabled aria-disabled="true"` 維持；本 phase 未動 Admin UI）
- ✅ **No middleware write route**（`vite.config.js` 無 `configureServer`；無 `/api/admin/**` endpoint）
- ✅ **No production content write**（pm-3 acceptance 之 pre/post `git hash-object` per file identical；3 個 production .md byte-identical）
- ✅ CLI 仍不 `import safeWrite`、不 `fs.writeFile`、不 `fs.rename`、不 spawn git
- ✅ Real-write first use **must be a separate explicit approval phase**；不繼承 4.5e-b / 4.5e-c acceptance 之 approval
- ✅ 4.5e-b / 4.5e-c 之 acceptance **不**作為解開 `--apply` 之依據；解開條件由獨立 4.5e-real-write phase 之 user 簽收界定

##### G. Suggested Future Phase（Not Started）

per §15.G.5 §F 之保守拆批，下一條建議 phase 為 **`4.5e-real-write-gate`**：

- 目的：首篇 production SEO description / searchDescription real write；user 明確 `--apply` 為前提
- 啟動條件：獨立 user explicit approval；不可由本 §15.G.6 docs sync 之 landing 推導
- 範圍：CLI source 解開 `--apply` 與 `dryRun: false` 之 fail-safe；新增首寫 production write 路徑；含 git diff manual review 之 reviewer flow
- **狀態：尚未啟動**；本 §15.G.6 docs sync **不**啟動此 phase
- 在啟動前 CLI 維持 dry-run only / dormant；patcher 之輸出僅供 dry-run preview 使用

##### H. Phase Boundary（本 §15.G.6 docs sync）

本 §15.G.6 docs sync phase（pm-4）**僅**：

- ✅ append 至 `docs/admin-2-write-pre-analysis.md`（本檔；單一 docs 變動）
- ✅ §4.5e 表格 row 之 status cell 精準補充 4.5e-b / 4.5e-c landed（不改寫歷史段落）

本 §15.G.6 docs sync phase **不做**：

- ❌ **無** source change（src/scripts/admin-frontmatter-patcher.js / admin-write-cli.js / safe-write-test.js 已於 pm-2 落地；本 phase 不動）
- ❌ **無** content / settings / templates / validation-fixtures / dist / dist-blogger / dist-promotion / dist-reports / gh-pages / package.json / package-lock.json / vite.config.js / src/views/admin/index.ejs 變動
- ❌ **無** `npm install` / build / deploy / Blogger repost / GA4 validation
- ❌ **無** fixture creation
- ❌ **無** production content write
- ❌ **無** Admin Apply enable
- ❌ **無** middleware write route
- ❌ **無** `--apply` enable
- ❌ **無** `dryRun: false` enable
- ❌ **無** `git fetch` / `pull`
- ❌ **無** `amend` / `rebase` / `force-push`

#### 15.G.7 Phase 4.5e first real SEO write checkpoint（2026-05-28 pm-8 → pm-12）

Phase 4.5e-real-write-gate 整段（sub-phase A → D）首次端對端落地紀錄。本 §15.G.7 為 docs-only sync（pm-12）；source / content / governance 變動於 pm-8 / pm-10 / pm-11 完成。

##### A. Phase 4.5e-real-write-gate sub-phase A — Source Landing

| 項目 | 值 |
|---|---|
| Phase ID | `20260528-pm-8-admin-write-phase-4p5e-real-write-gate-source-landing-a` |
| Commit | `778e099e6ff3a21930485f7e5cb6c58075a97920`（short `778e099`） |
| Subject | `feat(admin): gate cli real writes safely` |
| Changed files | `src/scripts/admin-write-cli.js`（+258 lines）/ `src/scripts/safe-write-test.js`（+262 lines）；**僅** 2 src 檔；無 patcher / safe-write / whitelist 變動 |
| `safe-write:test` | `160 pass / 0 fail` → **`209 pass / 0 fail`**（+49 additive；既有 160 全保留無 regression）|
| `validate:content` | `0 errors / 42 warnings / 37 posts`（與 baseline 一致；本 phase 未動 content）|

Source landing summary：

- **CLI gated real-write path landed**：僅 `--apply` flag **AND** `payload.dryRun === false` 兩者同時設立才進入 real-write 路徑；任一單獨 → reject（`apply-requires-dryRun-false` / `dryRun-false-requires-apply`，exit 2）
- **Real-write status set narrowed to `{'draft'}`**：`ready` / `published` / missing 全 reject（exit 7）；dry-run 仍維持 `{'draft', 'ready'}` 無 regression
- **`expectedOldValue` exact match required**：bytes-level equal（exit 6 on mismatch）
- **`safeWrite` atomic tmp+rename path used**：透過 `src/scripts/safe-write.js` 既有 helper；`enforceCleanGit: true`；非 raw `fs.writeFile`
- **Output shape**（real-write）含 `mode: "apply"` / `phase: "4.5e-real-write"` / `written: true|false` / `changed` / `target` / `site` / `kind` / `field` / `status` / `diffSummary` / `bytesDelta`
- **TOCTOU pre-write 再保護層**：write 前再驗 `isWriteAllowed`；patcher `changed: false` → 不觸 fs（`written: false skipped: "no-op"`）
- **Hermetic test injection**：`__testOverrides.gitStatusFn` 內部 hook 僅供 `safe-write-test.js`；production CLI entry（`process.argv` runner）永不傳；不開啟 production 旁路
- **No content write occurred in pm-8**：所有 real-write 測試 fixture 寫於 OS temp dir（`os.tmpdir()` 之 `admin-write-cli-test-*`）；finally{} cleanup；production content/* 完全未動

##### B. Phase 4.5e-real-write-gate sub-phase B — Dry-run Verify

| 項目 | 值 |
|---|---|
| Phase ID | `20260528-pm-9-admin-write-phase-4p5e-real-write-candidate-dry-run-verify-a` |
| Approach | read-only / dry-run only；無 commit；無 push；無 content write |
| Candidate file | `content/blogger/posts/20260504-sample-book-review.md` |
| Field | `description` |
| `expectedOldValue` | `"Blogger 書評文章範例。"`（JS String.length=15；UTF-8=29 bytes） |
| `newValue` | `"Blogger 書評文章範例：用於驗證 portable-blog-system 的書評模板、SEO frontmatter 與 Admin 安全寫入流程。"`（JS String.length=78；UTF-8=128 bytes） |

Dry-run output：

- `ok`：`true`
- `mode`：`"dry-run"`
- `phase`：`"4.5e-dry-run"`
- `written`：`false`（dry-run path short-circuit；CLI 不觸 `fs.writeFile` / `fs.rename` / `safeWrite`）
- `changed`：`true`（bytes-level）
- `diffSummary.changed` / `diffSummary.bytesChanged`：皆 `true`
- `diffSummary.oldLen` / `diffSummary.newLen`：`15` / `78`
- `bytesDelta`：`+99`（=128 − 29；與 pm-7 §E 之 analytic prediction 完全一致）
- `currentBytes` / `wouldWriteBytes`：`919` / `1018`
- `validators.description.ok`：`true`
- `target` / `site` / `kind` / `status`：`content/blogger/posts/20260504-sample-book-review.md` / `blogger` / `post-md` / `draft`

Pre/post candidate state（pm-9）：

- Pre-run `git hash-object`：`dc31134545d79a2b4a9de068259d9a212bdf9461`（919 bytes）
- Post-run `git hash-object`：`dc31134545d79a2b4a9de068259d9a212bdf9461`（919 bytes）**byte-identical**
- `git status` 全程 clean；working tree 入場=出場
- `safe-write:test`：`209 pass / 0 fail`
- `validate:content`：`0 errors / 42 warnings / 37 posts`
- Temp payload 建立於 OS temp dir（`C:\Users\user\AppData\Local\Temp\admin-write-dryrun-4p5e-pm9.json`）；執行後 `rm -f` 刪除

##### C. Phase 4.5e-real-write-gate sub-phase C — First Real Write Apply（uncommitted）

| 項目 | 值 |
|---|---|
| Phase ID | `20260528-pm-10-admin-write-phase-4p5e-first-real-seo-write-apply-a` |
| Approach | first ever production content mutation via gated CLI；`--apply` + `dryRun: false`；**not committed in pm-10** |
| Candidate file | `content/blogger/posts/20260504-sample-book-review.md` |
| Field | `description` |
| Pre-write `git hash-object` | `dc31134545d79a2b4a9de068259d9a212bdf9461` |
| Post-write `git hash-object` | `aeeac0c63ad551e74418ed00adc7a1f130b8fb58` |
| File size | `919` → `1018` bytes（delta **`+99`**；與 pm-9 dry-run 預測精確相符；無 YAML emitter drift） |
| `git diff --stat` | `1 file changed, 1 insertion(+), 1 deletion(-)` |
| Diff scope | **只 line 13 description value** 之替換（line 13 之 `-description: "Blogger 書評文章範例。"` → `+description: "Blogger 書評文章範例：用於驗證 portable-blog-system 的書評模板、SEO frontmatter 與 Admin 安全寫入流程。"`）；line 11 `tags`、line 14 `status`、line 15 `draft`、line 16 `publishTargets:` 等前後 context **byte-identical preserved**（無 non-target frontmatter drift） |
| `safe-write:test` | `209 pass / 0 fail` |
| `validate:content` | `0 errors / 42 warnings / 37 posts` |
| `git diff --check` | clean（無 whitespace error） |
| Commit / Push in pm-10 | ❌ **無**（pm-10 留下 uncommitted change 供 user 手動 review） |
| Temp payload | 建於 `C:\Users\user\AppData\Local\Temp\admin-write-apply-4p5e-pm10.json`；執行後 `rm -f` 刪除 |

CLI invocation：

```
node src/scripts/admin-write-cli.js --payload="<ABS_TEMP_PAYLOAD>" --apply
```

CLI output：

- `exit`：`0`
- `ok`：`true`
- `mode`：`"apply"`
- `phase`：`"4.5e-real-write"`
- `written`：`true`
- `changed`：`true`
- 其餘 fields 同 pm-9 dry-run（`bytesDelta: +99` / `currentBytes: 919` / `wouldWriteBytes: 1018` / `diffSummary.changed: true` / `diffSummary.bytesChanged: true` / `validators.description.ok: true`）

##### D. Phase 4.5e-real-write-gate sub-phase D — Commit + Push

| 項目 | 值 |
|---|---|
| Phase ID | `20260528-pm-11-admin-write-phase-4p5e-first-real-seo-write-commit-push-a` |
| Commit | `abcb58e70f10744be5829679fc54aa307b3ee049`（short `abcb58e`） |
| Subject | `content(blogger): apply first gated seo description write` |
| Push | ✅ pushed to `origin/main`；`778e099..abcb58e  main -> main` |
| HEAD == origin/main | ✅ `abcb58e` == `abcb58e` |
| ahead / behind | `0 / 0` |
| Working tree | clean |
| Commit scope | `content/blogger/posts/20260504-sample-book-review.md` only（無其他 staged / untracked）|
| Stat | `1 file changed, 1 insertion(+), 1 deletion(-)` |
| Post-push `safe-write:test` | `209 pass / 0 fail` |
| Post-push `validate:content` | `0 errors / 42 warnings / 37 posts` |

##### E. Governance Note（explicit；持續適用）

- ✅ **First real write approval was specific to one file, one field, one newValue only**。pm-10 user explicit approval 之範圍**限縮**為：
  - File：`content/blogger/posts/20260504-sample-book-review.md`
  - Field：`description`
  - `expectedOldValue`：`"Blogger 書評文章範例。"`
  - `newValue`：`"Blogger 書評文章範例：用於驗證 portable-blog-system 的書評模板、SEO frontmatter 與 Admin 安全寫入流程。"`
- ✅ **Future real writes do NOT inherit this approval**。任何後續 `--apply` 與 `dryRun: false` 之執行皆**不**繼承 pm-10 之 approval scope。
- ✅ **Each future real write still requires a separate user explicit approval phase**。需獨立 phase + 獨立 user simbolic approval；CLI source 雖已具備 gated real-write path（pm-8 landed），但 source 之存在**不**等同 future write 之 approval。
- ✅ **Admin Apply remains disabled**（`src/views/admin/index.ejs` lines 616, 721 之 `disabled aria-disabled="true"` 維持；本系列 phase 未動 Admin UI）。
- ✅ **Middleware write route remains NOT started**（`vite.config.js` 無 `configureServer`；無 `/api/admin/**` endpoint）。
- ✅ **No build / deploy / Blogger repost / GA4 validation occurred** in 本 4.5e-real-write-gate 系列（pm-8 → pm-12）。
- ✅ **Reverse UTM remains landed but dormant**（per CLAUDE.md §16.4 之 source landed @ `7e1d356` / `e2309e9` / `7c769fe` 2026-05-23；pm-26 deploy gate 仍 blocked）。
- ✅ **pm-26 deploy gate remains blocked** unless separately resolved（per `docs/reverse-utm-fixture-plan.md` §6 之啟動條件；本 §15.G.7 不解除 pm-26 阻擋）。
- ✅ **CLI source 之 `--apply` 解開 + `dryRun:false` 解開 之 fail-safe 雙鎖**：兩者皆已於 pm-8 source 解開為**有條件接受**（任一單獨仍 reject）。但「有條件接受」不等於「production approval」；production approval 由 per-phase user explicit simbolic gate 界定。

##### F. Phase Boundary（本 §15.G.7 docs sync = pm-12）

本 §15.G.7 docs sync phase（pm-12）**僅**：

- ✅ append §15.G.7 至 `docs/admin-2-write-pre-analysis.md`（本檔；單一 docs 變動）
- ✅ 紀錄 pm-8 / pm-9 / pm-10 / pm-11 完整 checkpoint
- ✅ 紀錄 governance note；明確 future real writes 需獨立 user explicit approval

本 §15.G.7 docs sync phase **不做**：

- ❌ **無** source change
- ❌ **無** content / settings / templates / validation-fixtures / dist / dist-blogger / dist-promotion / dist-reports / gh-pages / package.json / package-lock.json / vite.config.js / src/views/admin/index.ejs 變動
- ❌ **無** write CLI 再執行
- ❌ **無** payload 建立
- ❌ **無** `npm install` / build / deploy / Blogger repost / GA4 validation
- ❌ **無** fixture creation
- ❌ **無** production content write
- ❌ **無** Admin Apply enable
- ❌ **無** middleware write route
- ❌ **無** `git fetch` / `pull` / `checkout` / `reset` / `stash` / `rebase` / `amend` / `force-push`

#### 15.G.8 Phase 4.5e second real SEO write checkpoint（2026-05-28 night-2 → night-6）

Phase 4.5e second-real-write 整段（night-2 → night-5）首次 second-write 端對端落地紀錄。本 §15.G.8 為 docs-only sync（night-6）；governance / content / commit 變動於 night-2 / night-3 / night-4 / night-5 完成。CLI source infra **重用** §15.G.7 §A 之 pm-8 landing（commit `778e099`）；本系列 phase 無 source 變動。

##### A. Phase night-2 sub-phase — Candidate Preanalysis (Read-only Scan)

| 項目 | 值 |
|---|---|
| Phase ID | `20260528-night-2-second-real-seo-write-candidate-preanalysis-readonly-a` |
| Baseline | HEAD `418480e`（== origin/main）；ahead / behind 0 / 0；working tree clean |
| Approach | read-only scan only；**無** dry-run / **無** payload / **無** write / **無** file modification |
| Scan scope | `content/blogger/posts/*.md` + `content/github/posts/*.md`（扣 `.fb.md` sidecar；扣 §15.G.7 之 first-write target `20260504-sample-book-review.md`）|
| Posts scanned | 5（.md 計）|
| Viable candidates | **1**（過 `status: draft` real-write gate 之候選；其他 4 個皆 `status: ready` → CLI exit 7 reject） |
| Selected candidate | `content/blogger/posts/20260525-draft-book-review.md` |
| Candidate status | `draft` |
| Candidate description | `""`（empty string；JS String.length=0）|
| Candidate searchDescription | `""`（empty string；本系列 phase **不**動）|
| Recommended target field | `description`（mirror §15.G.7 之 single-field isolation pattern；`searchDescription` 留下次獨立 phase）|
| `safe-write:test` | `209 pass / 0 fail` |
| `validate:content` | `0 errors / 42 warnings / 37 posts` |

##### B. Phase night-3 sub-phase — Dry-run Verify

| 項目 | 值 |
|---|---|
| Phase ID | `20260528-night-3-second-seo-write-dry-run-verify-a` |
| Approach | read-only / dry-run only；**無** commit / **無** push / **無** content write |
| Candidate file | `content/blogger/posts/20260525-draft-book-review.md` |
| Field | `description` |
| `expectedOldValue` | `""`（empty string；JS String.length=0；UTF-8=0 bytes） |
| `newValue` | `"Blogger 書評草稿範例：用於驗證 portable-blog-system 的書評文章欄位、SEO 描述與 Admin 安全寫入流程。"`（JS String.length=70；UTF-8=128 bytes） |

Dry-run output：

- `ok`：`true`
- `mode`：`"dry-run"`
- `phase`：`"4.5e-dry-run"`
- `written`：`false`（dry-run path short-circuit；CLI 不觸 `fs.writeFile` / `fs.rename` / `safeWrite`）
- `changed`：`true`（bytes-level）
- `diffSummary.changed` / `diffSummary.bytesChanged`：皆 `true`
- `diffSummary.oldLen` / `diffSummary.newLen`：`0` / `70`
- `bytesDelta`：`+128`（= 128 − 0；等於 newValue UTF-8 bytes 精確匹配；無 YAML emit drift）
- `currentBytes` / `wouldWriteBytes`：`1534` / `1662`
- `validators.description.ok`：`true`
- `target` / `site` / `kind` / `status`：`content/blogger/posts/20260525-draft-book-review.md` / `blogger` / `post-md` / `draft`

Pre/post candidate state（night-3）：

- Pre-run `git hash-object`：`9827142ae5215fdf0b984cc0b96d62f78ff55dd3`（1534 bytes）
- Post-run `git hash-object`：`9827142ae5215fdf0b984cc0b96d62f78ff55dd3`（1534 bytes）**byte-identical**
- `git status` 全程 clean；working tree 入場 = 出場
- `safe-write:test`：`209 pass / 0 fail`
- `validate:content`：`0 errors / 42 warnings / 37 posts`
- Temp payload 建立於 OS temp dir（`C:\Users\user\AppData\Local\Temp\admin-write-dryrun-second-seo-night3.json`）；執行後 `rm -f` 刪除

##### C. Phase night-4 sub-phase — Second Real Write Apply（uncommitted）

| 項目 | 值 |
|---|---|
| Phase ID | `20260528-night-4-second-seo-write-apply-a` |
| Approach | second production content mutation via gated CLI；`--apply` + `dryRun: false`；**not committed in night-4** |
| Candidate file | `content/blogger/posts/20260525-draft-book-review.md` |
| Field | `description` |
| Pre-write `git hash-object` | `9827142ae5215fdf0b984cc0b96d62f78ff55dd3` |
| Post-write `git hash-object` | `83715db0c3b91128dd5513c6b210d7f6edfb51ba` |
| File size | `1534` → `1662` bytes（delta **`+128`**；與 night-3 dry-run 預測精確相符；無 YAML emitter drift） |
| `git diff --stat` | `1 file changed, 1 insertion(+), 1 deletion(-)` |
| Diff scope | **只 line 18 description value** 之替換（`-description: ""` → `+description: "Blogger 書評草稿範例：用於驗證 portable-blog-system 的書評文章欄位、SEO 描述與 Admin 安全寫入流程。"`）；line 19 `searchDescription: ""` byte-identical preserved（仍空字串；未動）；其餘 frontmatter 與正文 byte-identical |
| `safe-write:test` | `209 pass / 0 fail` |
| `validate:content` | `0 errors / 42 warnings / 37 posts` |
| `git diff --check` | clean（exit 0；無 whitespace error；stderr autocrlf warning 屬 Windows 行為，per §15.G.7 §C 同類處理）|
| Commit / Push in night-4 | ❌ **無**（night-4 留下 uncommitted change 供 user 手動 review） |
| Temp payload | 建於 `C:\Users\user\AppData\Local\Temp\admin-write-apply-second-seo-night4.json`；執行後 `rm -f` 刪除 |

CLI invocation（**單次**）：

```
node src/scripts/admin-write-cli.js --payload="<ABS_TEMP_PAYLOAD>" --apply
```

CLI output：

- `exit`：`0`
- `ok`：`true`
- `mode`：`"apply"`
- `phase`：`"4.5e-real-write"`
- `written`：`true`
- `changed`：`true`
- 其餘 fields 同 night-3 dry-run（`bytesDelta: +128` / `currentBytes: 1534` / `wouldWriteBytes: 1662` / `diffSummary.changed: true` / `diffSummary.bytesChanged: true` / `validators.description.ok: true`）

##### D. Phase night-5 sub-phase — Commit + Push

| 項目 | 值 |
|---|---|
| Phase ID | `20260528-night-5-second-seo-write-commit-push-a` |
| Commit | `9c6a915e5c4c6c9d3b9d56ab38dc0a76bfc783a8`（short `9c6a915`） |
| Subject | `content(blogger): apply second gated seo description write` |
| Push | ✅ pushed to `origin/main`；`418480e..9c6a915  main -> main`（fast-forward；無 force / 無 reject）|
| HEAD == origin/main | ✅ `9c6a915` == `9c6a915` |
| ahead / behind | `0 / 0` |
| Working tree | clean |
| Commit scope | `content/blogger/posts/20260525-draft-book-review.md` only（無其他 staged / untracked）|
| Stat | `1 file changed, 1 insertion(+), 1 deletion(-)` |
| Post-push `safe-write:test` | `209 pass / 0 fail` |
| Post-push `validate:content` | `0 errors / 42 warnings / 37 posts` |

##### E. Governance Note（explicit；持續適用）

- ✅ **Second real write approval was specific to one file, one field, one newValue only**。night-4 user explicit approval 之範圍**限縮**為：
  - File：`content/blogger/posts/20260525-draft-book-review.md`
  - Field：`description`
  - `expectedOldValue`：`""`
  - `newValue`：`"Blogger 書評草稿範例：用於驗證 portable-blog-system 的書評文章欄位、SEO 描述與 Admin 安全寫入流程。"`
- ✅ **Future real writes do NOT inherit this approval**。任何後續 `--apply` 與 `dryRun: false` 之執行皆**不**繼承 night-4 之 approval scope（亦**不**繼承 §15.G.7 §E 之 pm-10 first-write approval scope）。
- ✅ **Each future real write still requires a separate user explicit approval phase**。需獨立 phase + 獨立 user simbolic approval；CLI source 雖已具備 gated real-write path（per §15.G.7 §A 之 pm-8 `778e099`），但 source 之存在**不**等同 future write 之 approval。
- ✅ **`searchDescription` remains empty (`""`)**：候選 file `content/blogger/posts/20260525-draft-book-review.md` 之 line 19 `searchDescription: ""` 經 night-4 real write 後仍維持原值未動。若未來需 SEO write 該欄位，須**獨立 user explicit approval phase**（含獨立 candidate preanalysis / dry-run verify / apply / commit-push / docs sync 序列）；**不可**繼承 night-4 之 description approval。
- ✅ **Admin Apply remains disabled**（`src/views/admin/index.ejs` lines ~616, ~721 之 `disabled aria-disabled="true"` 維持；本系列 phase 未動 Admin UI）。
- ✅ **Middleware write route remains NOT started**（`vite.config.js` 無 `configureServer`；無 `/api/admin/**` endpoint）。
- ✅ **No build / deploy / Blogger repost / GA4 validation occurred** in 本 second-real-write 系列（night-2 → night-6）。
- ✅ **Reverse UTM remains landed but dormant**（per CLAUDE.md §16.4 之 source landed @ `7e1d356` / `e2309e9` / `7c769fe` 2026-05-23；pm-26 deploy gate 仍 blocked）。
- ✅ **pm-26 deploy gate remains blocked** unless separately resolved（per `docs/reverse-utm-fixture-plan.md` §6 之啟動條件；本 §15.G.8 不解除 pm-26 阻擋）。
- ✅ **CLI source 之 `--apply` 解開 + `dryRun:false` 解開 之 fail-safe 雙鎖**：兩者皆已於 §15.G.7 §A 之 pm-8 source 解開為**有條件接受**（任一單獨仍 reject）。但「有條件接受」不等於「production approval」；production approval 由 per-phase user explicit simbolic gate 界定。Second-write 之 night-4 approval 即屬此 per-phase gate；future writes 須各自取得獨立 gate。

##### F. Phase Boundary（本 §15.G.8 docs sync = night-6）

本 §15.G.8 docs sync phase（night-6）**僅**：

- ✅ append §15.G.8 至 `docs/admin-2-write-pre-analysis.md`（本檔；單一 docs 變動）
- ✅ 紀錄 night-2 / night-3 / night-4 / night-5 完整 checkpoint
- ✅ 紀錄 governance note；明確 future real writes 需獨立 user explicit approval；明確 `searchDescription` 仍需 separate phase

本 §15.G.8 docs sync phase **不做**：

- ❌ **無** source change
- ❌ **無** content / settings / templates / validation-fixtures / dist / dist-blogger / dist-promotion / dist-reports / gh-pages / package.json / package-lock.json / vite.config.js / src/views/admin/index.ejs 變動
- ❌ **無** write CLI 再執行
- ❌ **無** payload 建立
- ❌ **無** `npm install` / build / deploy / Blogger repost / GA4 validation
- ❌ **無** fixture creation
- ❌ **無** production content write
- ❌ **無** Admin Apply enable
- ❌ **無** middleware write route
- ❌ **無** `git fetch` / `pull` / `checkout` / `reset` / `stash` / `rebase` / `amend` / `force-push`

#### 15.G.9 Phase 4.5e third gated SEO searchDescription write checkpoint（2026-05-28 night-9 → night-12）

Phase 4.5e third-real-write 整段（night-9 → night-11）首次 third-write 端對端落地紀錄。本 §15.G.9 為 docs-only sync（night-12）；governance / content / commit 變動於 night-9 / night-10 / night-11 完成。CLI source infra **重用** §15.G.7 §A 之 pm-8 landing（commit `778e099`）；本系列 phase 無 source 變動。本次 write 目標欄位為 §15.G.8 §E 預先標記之 `searchDescription`（同 file `content/blogger/posts/20260525-draft-book-review.md`；同 file 上之第二個 SEO 欄位 write）。

##### A. Phase night-9 sub-phase — Candidate Preanalysis (Read-only Scan)

| 項目 | 值 |
|---|---|
| Phase ID | `20260528-night-9-third-seo-write-candidate-preanalysis-readonly-a` |
| Baseline | HEAD `7e4896e`（== origin/main）；ahead / behind 0 / 0；working tree clean |
| Approach | read-only scan only；**無** dry-run / **無** payload / **無** write / **無** file modification |
| Scan scope | `content/blogger/posts/*.md` + `content/github/posts/*.md`（扣 `.fb.md` sidecar；扣 `validation-fixtures/**`）|
| SEO 空值欄位 scan pattern | `description:\s*""` / `searchDescription:\s*""` / `titleEn:\s*""` / `coverAlt:\s*""` |
| Candidates considered | 5（含 §15.G.7 first-write 後仍存在的 top-level SEO 空值；其中 `20260504-sample-book-review.md` 之 `description` 已 §15.G.7 寫入，餘 `book.titleEn` / `book.coverAlt` 屬 nested 不在 CLI top-level allowlist；`20260515-we-media-myself2.md` 為 `status: ready` → `--apply` 路徑 exit 7 reject；`20260504-github-pages-blog-planning.md` / `20260504-portable-blog-system-mvp.md` top-level SEO 已全填）|
| Viable candidates | **1**（過 `status: draft` real-write gate + top-level SEO allowlist 之候選） |
| Selected candidate | `content/blogger/posts/20260525-draft-book-review.md` |
| Candidate status | `draft` |
| Candidate description | `"Blogger 書評草稿範例：用於驗證 portable-blog-system 的書評文章欄位、SEO 描述與 Admin 安全寫入流程。"`（§15.G.8 night-4 之 second-write 已寫入；本系列 phase **不**動）|
| Candidate searchDescription | `""`（empty string；§15.G.8 §E 預告留至本系列 phase）|
| Recommended target field | `searchDescription`（mirror §15.G.7 / §15.G.8 之 single-field isolation pattern；同 file 上 description 與 searchDescription 為 sibling SEO field；風險類別同等）|
| `safe-write:test` | `209 pass / 0 fail` |
| `validate:content` | `0 errors / 42 warnings / 37 posts` |

##### B. Phase night-10 sub-phase — Dry-run Verify

| 項目 | 值 |
|---|---|
| Phase ID | `20260528-night-10-third-seo-write-dry-run-verify-a` |
| Approach | read-only / dry-run only；**無** commit / **無** push / **無** content write |
| Candidate file | `content/blogger/posts/20260525-draft-book-review.md` |
| Field | `searchDescription` |
| `expectedOldValue` | `""`（empty string；JS String.length=0；UTF-8=0 bytes） |
| `newValue` | `"驗證 portable-blog-system 的 Blogger 書評草稿欄位、SEO 摘要與 Admin 安全寫入流程，作為後續書評內容建置範例。"`（JS String.length=75；UTF-8=141 bytes） |

Dry-run output：

- `ok`：`true`
- `mode`：`"dry-run"`
- `phase`：`"4.5e-dry-run"`
- `written`：`false`（dry-run path short-circuit；CLI 不觸 `fs.writeFile` / `fs.rename` / `safeWrite`）
- `changed`：`true`（bytes-level）
- `diffSummary.changed` / `diffSummary.bytesChanged`：皆 `true`
- `diffSummary.oldLen` / `diffSummary.newLen`：`0` / `75`
- `bytesDelta`：`+141`（= 141 − 0；等於 newValue UTF-8 bytes 精確匹配；無 YAML emit drift）
- `currentBytes` / `wouldWriteBytes`：`1662` / `1803`
- `validators.searchDescription.ok`：`true`
- `target` / `site` / `kind` / `status`：`content/blogger/posts/20260525-draft-book-review.md` / `blogger` / `post-md` / `draft`

Pre/post candidate state（night-10）：

- Pre-run `git hash-object`：`83715db0c3b91128dd5513c6b210d7f6edfb51ba`（1662 bytes；= §15.G.8 §D night-5 commit `9c6a915` 之 post-commit blob hash）
- Post-run `git hash-object`：`83715db0c3b91128dd5513c6b210d7f6edfb51ba`（1662 bytes）**byte-identical**
- `git status` 全程 clean；working tree 入場 = 出場
- `safe-write:test`：`209 pass / 0 fail`
- `validate:content`：`0 errors / 42 warnings / 37 posts`
- Temp payload 建立於 OS temp dir（`C:\Users\babel\AppData\Local\Temp\third-seo-searchdescription-dryrun-payload.json`）；執行後 `Remove-Item` 刪除；Read tool 驗證 file UTF-8 bytes 正確（PowerShell console mojibake 屬 display-only，未影響 file content）

Negative guard spot-checks（night-10，皆 dry-run；皆未 mutate）：

- NEG-1 wrong `expectedOldValue`：`"not-empty-wrong"` against actual `""` → exit `6` / `reason: "expected-old-value-mismatch"`（`actualOldLen=0`, `expectedOldLen=15`）；file unchanged
- NEG-2 wrong `field`：`field: "titleEn"`（CLI allowlist 僅 `description` / `searchDescription`）→ exit `3` / `reason: "invalid-payload"` / `detail.error: "field-not-in-allowlist"`（在 payload-shape stage reject；未觸 file read）；file unchanged
- NEG-3 wrong `status`（status:ready target `20260515-we-media-myself2.md`，dry-run mode）→ status gate 在 dry-run 為 permissive (`{draft, ready}`)，故 status 通過；但 file 之 `searchDescription` 已非空（actualOldLen=126），故 expectedOldValue mismatch 先 fire → exit `6`；file unchanged。apply-mode `{draft}` only 之 hard reject 由 `safe-write:test` 既有 case `apply ready: exit 7 / reason=target-status-not-allowed / allowed list = [draft]` 覆蓋，本 phase 不重複（避免使用 `--apply`）

##### C. Phase night-11 sub-phase — Third Real Write Apply

| 項目 | 值 |
|---|---|
| Phase ID | `20260528-night-11-third-seo-write-apply-commit-push-a` |
| Approach | third production content mutation via gated CLI；`--apply` + `dryRun: false`；同 phase 內 apply + commit + push |
| Candidate file | `content/blogger/posts/20260525-draft-book-review.md` |
| Field | `searchDescription` |
| Pre-write `git hash-object` | `83715db0c3b91128dd5513c6b210d7f6edfb51ba` |
| Post-write `git hash-object` | `b23eb19ba18f117f4ab27b31d0facd04f9dfaec0` |
| File size | `1662` → `1803` bytes（delta **`+141`**；與 night-10 dry-run 預測精確相符；無 YAML emitter drift） |
| `git diff --stat` | `1 file changed, 1 insertion(+), 1 deletion(-)` |
| Diff scope | **只 line 19 searchDescription value** 之替換（`-searchDescription: ""` → `+searchDescription: "驗證 portable-blog-system 的 Blogger 書評草稿欄位、SEO 摘要與 Admin 安全寫入流程，作為後續書評內容建置範例。"`）；line 18 `description` 維持 §15.G.8 night-4 寫入後之值 byte-identical preserved；line 21 `cover: ""` / line 22 `coverAlt: ""` / line 24 `status: "draft"` / line 8 `titleEn: "Draft Book Review"` / `book.*` / `blocks.*` / `publishTargets.*` 皆 byte-identical preserved |
| `safe-write:test` | `209 pass / 0 fail` |
| `validate:content` | `0 errors / 42 warnings / 37 posts` |
| `git diff --check` | clean（exit 0；無 whitespace error；stderr autocrlf warning 屬 Windows 行為，per §15.G.7 §C / §15.G.8 §C 同類處理）|
| Temp payload | 建於 `C:\Users\babel\AppData\Local\Temp\third-seo-searchdescription-apply-payload.json`；執行後 `Remove-Item` 刪除 |

CLI invocation（**單次**）：

```
node src/scripts/admin-write-cli.js --payload="<ABS_TEMP_PAYLOAD>" --apply
```

CLI output：

- `exit`：`0`
- `ok`：`true`
- `mode`：`"apply"`
- `phase`：`"4.5e-real-write"`
- `written`：`true`
- `changed`：`true`
- 其餘 fields 同 night-10 dry-run（`bytesDelta: +141` / `currentBytes: 1662` / `wouldWriteBytes: 1803` / `diffSummary.changed: true` / `diffSummary.bytesChanged: true` / `validators.searchDescription.ok: true`）

##### D. Phase night-11 sub-phase — Commit + Push

| 項目 | 值 |
|---|---|
| Commit | `82be258a10cb09ec2c4cb8b3fc572f036d0b79e8`（short `82be258`） |
| Parent | `7e4896e`（== §15.G.8 night-6 docs-sync commit） |
| Subject | `content(blogger): apply third gated seo search description write` |
| Push | ✅ pushed to `origin/main`；`7e4896e..82be258  main -> main`（fast-forward；無 force / 無 reject）|
| HEAD == origin/main | ✅ `82be258` == `82be258` |
| ahead / behind | `0 / 0` |
| Working tree | clean |
| Commit scope | `content/blogger/posts/20260525-draft-book-review.md` only（無其他 staged / untracked）|
| Stat | `1 file changed, 1 insertion(+), 1 deletion(-)` |
| Amend / force-push / hook skip | ❌ 皆無 |
| Post-push `safe-write:test` | `209 pass / 0 fail` |
| Post-push `validate:content` | `0 errors / 42 warnings / 37 posts` |

##### E. Governance Note（explicit；持續適用）

- ✅ **Third real write approval was specific to one file, one field, one newValue only**。night-11 user explicit approval 之範圍**限縮**為：
  - File：`content/blogger/posts/20260525-draft-book-review.md`
  - Field：`searchDescription`
  - `expectedOldValue`：`""`
  - `newValue`：`"驗證 portable-blog-system 的 Blogger 書評草稿欄位、SEO 摘要與 Admin 安全寫入流程，作為後續書評內容建置範例。"`
- ✅ **Future real writes do NOT inherit this approval**。任何後續 `--apply` 與 `dryRun: false` 之執行皆**不**繼承 night-11 之 approval scope（亦**不**繼承 §15.G.7 §E 之 pm-10 first-write approval scope，亦**不**繼承 §15.G.8 §E 之 night-4 second-write approval scope）。
- ✅ **Each future real write still requires a separate user explicit approval phase**。需獨立 phase + 獨立 user simbolic approval；CLI source 雖已具備 gated real-write path（per §15.G.7 §A 之 pm-8 `778e099`），但 source 之存在**不**等同 future write 之 approval。
- ✅ **`cover` / `coverAlt` / `titleEn` on this same file remain empty / placeholder**：
  - line 21 `cover: ""`（top-level；empty string）
  - line 22 `coverAlt: ""`（top-level；empty string）
  - line 8 `titleEn: "Draft Book Review"`（top-level；placeholder value）
  - line 49 `book.titleEn: ""`（nested；不在 CLI top-level allowlist）
  - line 63 `book.coverAlt: ""`（nested；不在 CLI top-level allowlist）
  若未來需 SEO write 上述任一欄位，須**獨立 user explicit approval phase**（含獨立 candidate preanalysis / dry-run verify / apply / commit-push / docs sync 序列）；**不可**繼承 night-11 之 searchDescription approval。
- ✅ **Admin Apply remains disabled**（`src/views/admin/index.ejs` lines ~616, ~721 之 `disabled aria-disabled="true"` 維持；本系列 phase 未動 Admin UI）。
- ✅ **Middleware write route remains NOT started**（`vite.config.js` 無 `configureServer`；無 `/api/admin/**` endpoint）。
- ✅ **No build / deploy / Blogger repost / GA4 validation occurred** in 本 third-real-write 系列（night-9 → night-12）。
- ✅ **Reverse UTM remains landed but dormant**（per CLAUDE.md §16.4 之 source landed @ `7e1d356` / `e2309e9` / `7c769fe` 2026-05-23；pm-26 deploy gate 仍 blocked）。
- ✅ **pm-26 deploy gate remains blocked** unless separately resolved（per `docs/reverse-utm-fixture-plan.md` §6 之啟動條件；本 §15.G.9 不解除 pm-26 阻擋）。
- ✅ **CLI source 之 `--apply` 解開 + `dryRun:false` 解開 之 fail-safe 雙鎖**：兩者皆已於 §15.G.7 §A 之 pm-8 source 解開為**有條件接受**（任一單獨仍 reject）。但「有條件接受」不等於「production approval」；production approval 由 per-phase user explicit simbolic gate 界定。Third-write 之 night-11 approval 即屬此 per-phase gate；future writes 須各自取得獨立 gate。

##### F. Phase Boundary（本 §15.G.9 docs sync = night-12）

本 §15.G.9 docs sync phase（night-12）**僅**：

- ✅ append §15.G.9 至 `docs/admin-2-write-pre-analysis.md`（本檔；單一 docs 變動）
- ✅ 紀錄 night-9 / night-10 / night-11 完整 checkpoint
- ✅ 紀錄 governance note；明確 future real writes 需獨立 user explicit approval；明確同 file 上 `cover` / `coverAlt` / `titleEn` 仍需各自 separate phase

本 §15.G.9 docs sync phase **不做**：

- ❌ **無** source change
- ❌ **無** content / settings / templates / validation-fixtures / dist / dist-blogger / dist-promotion / dist-reports / gh-pages / package.json / package-lock.json / vite.config.js / src/views/admin/index.ejs 變動
- ❌ **無** write CLI 再執行
- ❌ **無** payload 建立
- ❌ **無** `npm install` / build / deploy / Blogger repost / GA4 validation
- ❌ **無** fixture creation
- ❌ **無** production content write
- ❌ **無** Admin Apply enable
- ❌ **無** middleware write route
- ❌ **無** `git fetch` / `pull` / `checkout` / `reset` / `stash` / `rebase` / `amend` / `force-push`

#### 15.G.10 2026-05-29 AM fourth SEO write candidate scan — zero viable candidate checkpoint

Phase: `20260529-am-3-fourth-seo-write-zero-candidate-checkpoint-docs-only-a`

本 §15.G.10 為 docs-only checkpoint，紀錄前一 phase（`20260529-am-2-fourth-seo-write-candidate-preanalysis-readonly-a`）之 fourth SEO write candidate scan 結論。Scan 結論為 **0 viable candidate**；本 §15.G.10 **不**啟動第四次 real write、**不**改 content、**不**改 CLI source、**不**解除任何 dormant 邊界。

##### A. Phase Identification

| 項目 | 值 |
|---|---|
| Phase name | `20260529-am-3-fourth-seo-write-zero-candidate-checkpoint-docs-only-a` |
| Source pre-analysis phase | `20260529-am-2-fourth-seo-write-candidate-preanalysis-readonly-a`（read-only；無 commit）|
| Cold-start triage phase | `20260529-am-1-post-eod-cold-start-next-work-triage-readonly-a`（read-only；無 commit）|
| Type | docs-only checkpoint（單檔 append at §15.G.10）|

##### B. Baseline

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD（本 §15.G.10 commit 前）| `acabb4fd629b1bf9cd015af117bd7381cc253065`（== §15.G.9 night-12 之後加上 2026-05-28 EOD report commit `acabb4f`）|
| ahead / behind | `0 / 0` |
| working tree | clean |
| safe-write:test | `209 pass / 0 fail` |
| validate:content | `0 error(s) / 42 warning(s) / 37 post(s)` |

##### C. Scan Scope

| 範圍 | 對象 |
|---|---|
| 掃描路徑 | `content/blogger/posts/**/*.md` + `content/github/posts/**/*.md`（排除 `.fb.md` sidecar / `content/validation-fixtures/` / `content/templates/` / `content/shared/` / `content/drafts/` / `content/archive/`）|
| Actual hit | **5 個 .md 檔** |
| 5 hits 清單 | 1. `content/blogger/posts/20260504-sample-book-review.md`（draft）<br>2. `content/blogger/posts/20260515-we-media-myself2.md`（ready）<br>3. `content/blogger/posts/20260525-draft-book-review.md`（draft）<br>4. `content/github/posts/20260504-github-pages-blog-planning.md`（ready）<br>5. `content/github/posts/20260504-portable-blog-system-mvp.md`（ready）|

##### D. Previous Three Real Write Precise Verification

由 `git show --stat + diff` 從 commit object 精確讀取（**非推測**；對齊本 §15.G.7 / §15.G.8 / §15.G.9 紀錄並補上前 cold-start triage 之欄位誤標）：

| # | commit（full）| date | target file | field | old value | new value |
|---|---|---|---|---|---|---|
| 1 | `abcb58e70f10744be5829679fc54aa307b3ee049` | 2026-05-28 16:26:54 +0800 | `content/blogger/posts/20260504-sample-book-review.md` | `description` | `"Blogger 書評文章範例。"` | `"Blogger 書評文章範例：用於驗證 portable-blog-system 的書評模板、SEO frontmatter 與 Admin 安全寫入流程。"` |
| 2 | `9c6a915e5c4c6c9d3b9d56ab38dc0a76bfc783a8` | 2026-05-28 17:55:19 +0800 | `content/blogger/posts/20260525-draft-book-review.md` | `description` | `""` | `"Blogger 書評草稿範例：用於驗證 portable-blog-system 的書評文章欄位、SEO 描述與 Admin 安全寫入流程。"` |
| 3 | `82be258a10cb09ec2c4cb8b3fc572f036d0b79e8` | 2026-05-28 21:09:51 +0800 | `content/blogger/posts/20260525-draft-book-review.md` | `searchDescription` | `""` | `"驗證 portable-blog-system 的 Blogger 書評草稿欄位、SEO 摘要與 Admin 安全寫入流程，作為後續書評內容建置範例。"` |

每筆均 `1 file changed, 1 insertion(+), 1 deletion(-)`；無 body / 其他欄位變動。對應 docs 記錄位置：§15.G.7（first；pm-8 ~ pm-12）/ §15.G.8（second；night-2 ~ night-6）/ §15.G.9（third；night-9 ~ night-12）。

前 cold-start triage 報告之欄位誤標（將 commit 2 target 寫成 `20260504-sample-book-review.md`、field 標 unknown）於本 §15.G.10 §D 正式校正。

##### E. Scan Conclusion — Zero Viable Candidate

| 結論 | **第四次 SEO real write viable candidate pool = 0** |
|---|---|

5 個 posts 經 CLI 雙條 hard gate 收斂後皆不可寫：

| post | status gate（`ALLOWED_STATUSES_WRITE = {'draft'}`）| field 已寫 / 結構 | 結果 |
|---|---|---|---|
| `20260504-sample-book-review.md` | ✅ draft 通過 | `description` 已 §15.G.7 寫入；**`searchDescription` 欄位不存在** | ❌ patcher missing-key fail-closed（per `src/scripts/admin-frontmatter-patcher.js` 註解 line 7-8 + line 20 "fail-closed on ... missing key"）|
| `20260515-we-media-myself2.md` | ❌ status=ready | description / searchDescription 已填 | ❌ exit 7 / `target-status-not-allowed` |
| `20260525-draft-book-review.md` | ✅ draft 通過 | `description` 已 §15.G.8 寫入；`searchDescription` 已 §15.G.9 寫入 | ❌ 無剩餘 SEO 欄位 |
| `20260504-github-pages-blog-planning.md` | ❌ status=ready | description / searchDescription 已填 | ❌ exit 7 / `target-status-not-allowed` |
| `20260504-portable-blog-system-mvp.md` | ❌ status=ready | description / searchDescription 已填 | ❌ exit 7 / `target-status-not-allowed` |

##### F. Zero-Candidate Root Cause Breakdown

1. **Status gate（CLI `ALLOWED_STATUSES_WRITE = new Set(['draft'])`）**：5 posts 中 3 個 status=ready；ready 在 `--apply` 路徑直接 exit 7 reject（per `src/scripts/admin-write-cli.js` line 51-52 + step 8 status gate at line 346-363）。本檔不主張改為允許 ready；對齊 Phase 4.5e 安全收斂原則。
2. **Patcher missing-key fail-closed**：唯一未飽和 SEO 欄位之 draft post（`20260504-sample-book-review.md` 之 `searchDescription`）整個欄位**不存在**於 frontmatter；CLI patcher（`src/scripts/admin-frontmatter-patcher.js`）對 missing key 直接 fail-closed → 即使 shape check 與 expectedOldValue check 通過（`""` 對 `""`），patcher step（CLI line 410-424）會 exit 8 / `frontmatter-patch-failed`。
3. **Draft candidates 已無安全可寫欄位**：2 個 draft posts 中，`20260525-draft-book-review.md` 兩欄位已寫滿（§15.G.8 + §15.G.9）；`20260504-sample-book-review.md` 之 `description` 已寫滿（§15.G.7），餘 `searchDescription` 為 missing-key 而非空字串。
4. **Ready posts 不應進 real write**：本 §15.G.10 不主張為了補第四次寫入而臨時切 status 或繞 gate；Phase 4.5e gate 設計即為阻擋此類冒進。

##### G. Closest-But-Unwritable Half-Candidate

| 項目 | 值 |
|---|---|
| Target file | `content/blogger/posts/20260504-sample-book-review.md` |
| Target field | `searchDescription` |
| Why half-candidate | status=draft 通過 gate；但 frontmatter 內整個 key 不存在 |
| Reject stage | CLI step 11 `patchFrontmatter` → exit 8 / `frontmatter-patch-failed`（patcher 對 missing key fail-closed）|
| 是否可進 dry-run | ❌ **不可**；patcher 在 dry-run 與 apply 兩路徑均跑（CLI line 410 在 mode-split 前），無分支可繞 |
| 是否可進 apply | ❌ **不可**；同上 |
| Body 狀態 | placeholder（`請在此撰寫書評內容。`）；屬 schema demo；不足以 SEO-grade fully justify newValue |

##### H. Recommendation — Do Not Hard-Push Fourth Write

1. **不建議**為了完成「第四次寫入」而硬改既有 `20260504-sample-book-review.md` 之 `description`：description 已於 §15.G.7 寫入 56 字之 SEO-grade 句；二次改寫屬 cosmetic / 無新增資訊；違反「不誇大內容 / 不新增文章沒有提到的資訊」之 SEO write 原則。
2. **不建議**此時擴 patcher 支援 key insertion：屬 source change；改動 Phase 4.5e 安全邊界；需獨立 pre-analysis（評估 insertion 點之 YAML 上下文判斷、blank line / comment 保留、existing-key duplicate detection、validate baseline 對齊等）；本 §15.G.10 **不**啟動此方向。
3. **不建議**繞過 status gate 或改 ready post：違反 Phase 4.5e gate 之設計目的；ready post 之 SEO 欄位已飽和或屬 production-grade content；不適合作為 gate-bypass 練習材料。

##### I. Future Trigger Conditions

第四次 SEO real write 可在以下任一條件成立後**獨立 phase**啟動（**本 §15.G.10 不啟動**）：

| 觸發條件 | 性質 | 是否需新 phase |
|---|---|---|
| **I-1**：未來自然產生之新 draft post（如新書評草稿、新教具下載草稿、新技術筆記草稿）frontmatter 自帶 `description: ""` 或 `searchDescription: ""` 空字串欄位 | 被動 wait；自然觸發 | ✅ 須獨立 dry-run + apply phase |
| **I-2**：user 於 VS Code 手動補 `searchDescription: ""` 行至 `20260504-sample-book-review.md`（緊接 description 下一行）後 commit；屬 user maintain `.md` 之既有許可範圍（per CLAUDE.md §1 / §27）| 主動 user manual | ✅ 須獨立 dry-run + apply phase |
| **I-3**：未來獨立 pre-analysis 評估擴 CLI patcher 支援 key insertion 並 landed 後 | source change；長期 unblocker | ✅ 須獨立 pre-analysis → source → dry-run → apply 四段 |

本 §15.G.10 **不**選擇任一觸發條件；亦**不**催促 user 主動觸發 I-2 / I-3。

##### J. Governance Note

| 項目 | 狀態 |
|---|---|
| 前三次 real write approval scope | 各**僅授權該一次**；不延伸至第四次（per §15.G.7 §E / §15.G.8 §E / §15.G.9 §E）|
| Future real write 啟動條件 | 須**獨立 explicit user approval**；approval 必須**明列**：target file / field / expectedOldValue / newValue 四項全部 |
| CLI source 之 `--apply` + `dryRun:false` 雙鎖 | 仍為「有條件接受」（per §15.G.7 §A）；不等同 production approval；per-phase user explicit simbolic gate 仍為唯一通行依據 |
| Pre-analysis 與 docs-only checkpoint 之 scope | **均不**等同 write approval；無論本 §15.G.10 或前置 `20260529-am-2` 之 scan 結論為何，皆不可作為 future write 之預授權 |

##### K. Phase Boundary

本 §15.G.10 docs-only checkpoint phase（`20260529-am-3-...-a`）**僅**：

- ✅ append §15.G.10 至 `docs/admin-2-write-pre-analysis.md`（本檔；單一 docs 變動）
- ✅ 紀錄 `20260529-am-2` scan 之 0-candidate 結論 + reasons + half-candidate + future trigger conditions
- ✅ 校正前 cold-start triage 報告之欄位誤標（§D 三筆 commit / file / field / old / new 全部精確列出）
- ✅ 重申 governance：前三次 approval 不延伸至第四次

本 §15.G.10 docs-only checkpoint phase **不做**：

- ❌ **無** content posts 修改
- ❌ **無** source 修改（含 `src/scripts/admin-write-cli.js` / `src/scripts/admin-frontmatter-patcher.js` / `src/views/admin/index.ejs` 等）
- ❌ **無** settings / templates / validation-fixtures / dist / dist-blogger / dist-promotion / dist-reports / gh-pages / package.json / package-lock.json / vite.config.js 變動
- ❌ **無** CLI dry-run / apply 執行（含 payload 建立 / 加載）
- ❌ **無** 第四次 real write
- ❌ **無** Admin Apply UI 啟用（仍 disabled per `src/views/admin/index.ejs` line 616-619 / 721-724）
- ❌ **無** middleware write route 新增（仍 not started；`vite.config.js` 無 `configureServer`）
- ❌ **無** `npm install` / build / deploy / Blogger repost / GA4 validation / fixture creation
- ❌ **無** reverse UTM dormant 狀態解除（per `CLAUDE.md` §16.4；remains landed but dormant）
- ❌ **無** pm-26 deploy gate 解除（per `docs/reverse-utm-fixture-plan.md` §6；remains BLOCKED on no positive GitHub cross-link fixture）
- ❌ **無** `git fetch` / `pull` / `checkout` / `reset` / `stash` / `rebase` / `merge` / `amend` / `force-push`

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
