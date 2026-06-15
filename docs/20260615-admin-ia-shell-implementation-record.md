# BLOG ADMIN — IA Shell Implementation Record

- **Phase**：`20260615-night-1-admin-ia-shell-implementation-a`
- **日期**：2026-06-15（night-1，20:15 起）
- **性質**：source 實作（loader + EJS shell；read-only；不改 content / settings；不 deploy；不重貼 Blogger）
- **承接**：`docs/20260615-blog-admin-ia-current-state-preanalysis.md`（pm-2 preanalysis）
- **GA4 P1 gate**：已解除（`docs/20260615-ga4-article-bottom-nav-p1-report-verified-resume-blog-build.md`）

---

## A. Baseline verify

```
branch        : main
working tree  : clean
HEAD          : c751398 == origin/main
last commit   : docs(admin): plan blog admin information architecture
```

→ baseline 符合預期；本 phase 自此基礎上開始實作。

---

## B. 本 phase 目標

依 `docs/20260615-blog-admin-ia-current-state-preanalysis.md` §C / §D / §H §2，
落地 ADMIN 後台**第一個低風險版本之資訊架構 / 導覽殼層 / 系統狀態可視化**。

明確邊界：

- ✅ 顯示「目前 BLOG 系統狀態」
- ✅ 明示「產生內容 / 匯出 / 手動搬到 Blogger」的系統定位，不誤導為已可完整後台發文
- ✅ 建立清楚的 IA 導覽入口（in-page anchor nav）
- ✅ 把未實作功能標示為 read-only / planned / dormant，不放假按鈕
- ❌ **不**做文章編輯 / 新增 / 刪除 / 發布
- ❌ **不**做寫入操作
- ❌ **不**做 deploy
- ❌ **不**動 production content / settings / build / Blogger / AdSense / GA4 後台
- ❌ **不**新增第三方套件 / 不 `npm install`

---

## C. 已實作

### C.1 IA 導覽（in-page anchor nav）

在 admin 頁面頂端新增 sticky `<nav class="admin-nav">`，含以下 11 個 in-page anchor：

| Anchor | 區塊 | 性質 |
|---|---|---|
| `#dashboard` | 系統定位 + 5 surface readiness 卡片 | read-only |
| `#posts` | 既有文章表格（search/filter/sort/detail）| read-only |
| `#categories` | Categories & Tags 概覽 + categories list | read-only |
| `#blogger-export` | Blogger 匯出狀態 + 產出位置 | read-only |
| `#github-pages` | GitHub Pages 產出 / Deploy 流程 | read-only |
| `#adsense` | AdSense 主開關 + slot / blocks（masked）| read-only |
| `#ga4` | GA4 主開關 + events 清單（masked）| read-only |
| `#commerce` | 既有 commerce links preview + snippet helper | read-only |
| `#settings` | `content/settings/*.json` 清單 | read-only |
| `#system-checks` | CLI script 清單（validate / check / report） | read-only |
| `#write` | Write path 狀態（明示 dormant）| read-only |

### C.2 Dashboard hero

`#dashboard` 區塊新增之內容：

- **系統定位段落**：以 `<p class="system-def">` 明確說明
  > 本機 Markdown + JSON 設定 → 產生 GitHub Pages 靜態站（自動 build / deploy）+ Blogger 文章 HTML（**手動複製貼到 Blogger** 後台）。
  > ADMIN 為「系統狀態檢視入口」，**不是**後台 CMS：不在此新增 / 編輯 / 刪除 / 發布文章；不寫入 `content/` 或 `content/settings/`；不觸發 build；不重貼 Blogger；不 deploy。
- **6 張 surface readiness 卡片**：Blogger 站 / GitHub Pages 站 / AdSense / GA4 / Commerce/Affiliate / Content kinds。
  - AdSense 卡片：master enabled、`ca-pub-…<tail4>`、non-empty slots、default blocks enabled/total、loader pages/blogger。
  - GA4 卡片：enabled、`G-…<tail4>`、events 數。
  - Blogger 卡片：publishTargets enabled / mode 分布 / 已回填 publishedUrl 數 / 站台 URL。
  - GitHub Pages 卡片：publishTargets enabled / 有 previewUrl 數 / 站台 URL。
  - Commerce 卡片：registry size / active count / affiliate networks 數。
  - Content kinds 卡片：per-kind 篇數 + categories / tags 總數。

### C.3 既有 Posts 區塊保留 + 加 section anchor

- 既有 `<h1>Posts (read-only)</h1>` 改為 `<h2 id="posts">Posts</h2>` + intro 段；表格 / search / filter / sort / detail / commerce preview 行為 **不變**。
- 既有 commerce preview section 加上 `id="commerce"` anchor。
- 既有 14+ 張 stats 卡片、relative date 顯示、FB sidecar dry-run editor、Platform Routing 等 **全部保留**，未刪除。

### C.4 新增 7 個 read-only sections（IA expansion）

每個 section 結構統一：`<h2>` + section-tag（read-only / live / dormant）+ section-lede + 一組 surface cards + `⏳ 未實作` planned list。

- `#categories` — Categories & Tags 概覽 + `sys.categories.list` 表
- `#blogger-export` — Blogger publishTargets / mode / publishedUrl / 產出位置 + guard
- `#github-pages` — publishTargets / preview URL / build / sitemap / deploy 指令
- `#adsense` — master enabled / client masked / slot 數 / default blocks
- `#ga4` — enabled / measurementId masked / events 清單
- `#settings` — `content/settings/*.json` 完整清單（19 個 JSON 檔）
- `#system-checks` — 12 個 CLI script 表（validate / check / report 系列）
- `#write` — Write path 狀態（dormant；明示不開放 browser 直寫）

### C.5 真實 id 遮罩

- `adsenseClient`、`articleAd1`–`articleAd6` 真實 id **不**寫入 source；loader 只傳 last-4 字元 tail。
- EJS render 端組 `ca-pub-…<tail4>` / `G-…<tail4>`；rendered HTML grep `ca-pub-2445077695943759` / `7549133677` / `3892656977` / `C77SMPF8VD` **= 0**。
- source 端 grep `ca-pub-[0-9]{12,}` / `G-[A-Z0-9]{8,}` 對 `src/views/admin/index.ejs`、`src/scripts/load-admin-posts.js`、`src/scripts/build-github.js` **= 0**。

---

## D. 仍未實作（read-only / planned / dormant）

以下功能本 phase **明確不做**；ADMIN 內以 `⏳ 未實作` 文字 + 灰色 planned list 呈現，不放假按鈕：

| 類別 | 仍未實作 | 路徑 |
|---|---|---|
| 文章 | 新增 / 編輯 / 刪除 | 第三階段（gated CLI write 之後） |
| 文章 | 發布 / 重貼 Blogger | 手動 Blogger 後台流程 |
| 文章 | published URL 一鍵回填 UI | 須另開 middleware 安全 preanalysis |
| 分類 / 標籤 | 用量計數 / 未使用偵測 / cross-site mismatch 紅綠燈 / 編輯 UI | 待 phase |
| Blogger | per-post copy-helper 一鍵打開 / repost readiness flag | 待 phase |
| GitHub Pages | 最後 build / deploy 時間 commit 顯示 / sitemap 預覽 / 一鍵 deploy | 待 phase（不會在 ADMIN 內提供觸發；CLI 保持） |
| AdSense | per-post resolved blocks count / surface / 後台收益 mirror | 待 phase |
| GA4 | per-post tracking readiness / custom dimensions / 後台連結 | 待 phase |
| Settings | JSON 編輯 UI / schema 視覺化 / 欄位 picker | 待 phase |
| System checks | 最近一次結果 mirror / per-post warning 計數 / 一鍵觸發 | 待 phase |
| Write path | browser 直接寫檔 | **不開放**；須獨立 middleware 安全 preanalysis |
| Write path | gated CLI write for content | 既有 `admin:write` 對 content dormant |

---

## E. 變更檔案（精確清單）

```
src/scripts/load-admin-posts.js   — 新增 buildSystemSummary(settings) + return systemSummary
src/scripts/build-github.js       — admin render context 新增 systemSummary 欄位
src/views/admin/index.ejs         — 加 IA nav + Dashboard hero + 7 個新 read-only sections + 對應 CSS
docs/20260615-admin-ia-shell-implementation-record.md  — 本紀錄
```

**未動**：
- `content/`（任何 .md / .json）
- `content/settings/`（任何 JSON）
- `package.json` / lockfile（無 npm install）
- 其他 EJS template / SCSS / JS / build / blogger renderer / deploy
- `ads.config.json` / `ga4.config.json` 內 real id（僅讀，未改）
- Blogger live posts / GitHub Pages live deploy / GA4 / AdSense 後台

---

## F. Validation results

```
npm run validate:content
→ 0 error(s) / 94 warning(s) on 84 post(s)    ← baseline 不變

node src/scripts/build-github.js --mode=dev
→ admin (dev-mode) rendered: 7 posts
→ wrote .cache/pages/admin/index.html
→ done in ~1.25s
```

Rendered HTML 結構驗證：

```
grep id 個數（dashboard / posts / categories / blogger-export / github-pages /
            adsense / ga4 / commerce / settings / system-checks / write）
            → 11

grep masked AdSense / GA4 (ca-pub-… / G-…) in rendered HTML
            → 4（皆為遮罩）

grep real AdSense client / 6 slot ids / GA4 measurementId in rendered HTML
            → 0

grep real id 在 source（admin EJS / loader / build-github）
            → 0
```

未跑（無 source impact 之 check）：

- `check:adsense-resolver` / `check:adsense-article-block` / `check:adsense-anchor-wiring` /
  `check:blogger-adsense-output`：本 phase **未改** AdSense source / settings / EJS partial / build:blogger；
  既有 carry-forward measurement（34/0、13/0、14/0、71/0–85/0 視最新 commit）不受影響。
- `build:blogger` / `build` / `build:sitemap` / `npm install`：未跑（無 prod build / deploy 需求）。

---

## G. Explicit non-actions

- ❌ 未跑 `npm install`；未動 `package.json` / lockfile
- ❌ 未改任何 production content 檔（`content/{github,blogger}/posts/*.md`、`*.publish.json`、`*.fb.md`）
- ❌ 未改任何 settings JSON（含 `ads.config.json` / `ga4.config.json` / `categories.json` / `tags.json` / `commerce-links.json`）
- ❌ 未改其他 EJS template（`pages/`、`blogger/`、`design-system/`、`promotion/`）
- ❌ 未改 `build-blogger.js` / `build-promotion.js` / `build-sitemap.js` / 任何 resolver / validator
- ❌ 未 `npm run build` / `npm run build:blogger` / `npm run build:sitemap`
- ❌ 未 deploy / 未 push gh-pages / 未動 `portable-blog-deploy` clone
- ❌ 未開 Blogger 後台 / 未重貼任何 Blogger 文章
- ❌ 未開 AdSense 後台 / 未動 ad 設定
- ❌ 未動 GA4 後台 / 未動 measurementId / events / custom dimensions
- ❌ 未動 commerce-links registry / 未新增 affiliate entry / 未動 token / credential 紅線
- ❌ 未壓縮 / 重排 CLAUDE.md
- ❌ 未啟用 browser write / middleware / Apply button
- ❌ 未把 hardcoded real AdSense client / slot id 寫進 source（只走 settings → loader → render masking）

---

## H. Commit / push（calling phase 自會處理；本紀錄不執行）

預計 commit：

```
feat(admin): implement management shell
```

Files staged：

```
src/scripts/load-admin-posts.js
src/scripts/build-github.js
src/views/admin/index.ejs
docs/20260615-admin-ia-shell-implementation-record.md
```

CLAUDE.md：本 phase **不**動（per phase 要求；無 ledger sync 必要）。

---

## I. Next recommended phase

依 preanalysis §H §3–5 之主線節奏，下一階段建議：

1. **`20260615-XX-admin-posts-index-readonly-derive-fields-a`** — 強化 Posts 區塊；補 §F 缺口欄位之 read-only derive：
   - GA4 tracking readiness（indexable + measurementId + nav prev/next/home）
   - AdSense blocks readiness（呼叫 `resolve-adsense-blocks.js` per post / surface）
   - validation warning 計數（aggregate `validate:content` per post）
   - last-checked timestamps
2. **`20260615-XX-admin-post-detail-readonly-expand-a`** — 單篇 detail panel 擴充 GA4 / AdSense / commerce / nav / validation 區塊
3. **（並行可做）`20260615-XX-admin-categories-readonly-usage-counts-a`** — Categories / Tags 用量計數 + cross-site mismatch 紅綠燈
4. **（後續）`20260615-XX-admin-build-deploy-readonly-status-a`** — 接 `report:build` / git log，read-only 顯示最後 build / deploy 狀態
5. **（最後）write path** — 仍按 preanalysis §E 分階段紅線：read-only → copy-helper/dry-run → gated CLI write → middleware（須獨立安全 preanalysis）。不跳階。

**保守替代**：本 phase 收工後直接做 user-facing acceptance（人工瀏覽 `/admin/`，確認 IA 是否符合預期），再決定下一階段是 posts derive 還是 categories 用量計數。

---

（本紀錄結束）
