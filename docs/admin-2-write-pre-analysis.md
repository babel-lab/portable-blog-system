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

（本文件結束）
