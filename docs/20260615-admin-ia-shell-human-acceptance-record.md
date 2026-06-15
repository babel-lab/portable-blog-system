# BLOG ADMIN — IA Shell 人眼瀏覽驗收紀錄

- **Phase**：`20260615-night-2-admin-ia-shell-human-acceptance-record-docs-only-a`
- **日期**：2026-06-15（night-2，21:00）
- **性質**：docs-only acceptance record（人眼瀏覽驗收紀錄；**不**改 src / content / settings / templates / views / package / lockfile；**不** npm install / build / deploy / Blogger repost）
- **承接**：
  - `docs/20260615-blog-admin-ia-current-state-preanalysis.md`（pm-2 preanalysis）
  - `docs/20260615-admin-ia-shell-implementation-record.md`（night-1 implementation）

---

## A. Baseline verify

```
branch        : main
working tree  : clean
HEAD          : a34df7d == origin/main
last commit   : feat(admin): implement management shell
```

`git log --oneline -3`：

```
a34df7d feat(admin): implement management shell
c751398 docs(admin): plan blog admin information architecture
efdc6f5 docs(ga4): verify article bottom nav p1 report
```

→ baseline 完全符合預期；本 phase 自此基礎上做純 docs-only 驗收紀錄。

---

## B. 本 phase 目標

依 night-1 implementation 之預期使用流程，**由 user 以人眼瀏覽方式驗收** ADMIN 管理殼層：

- 確認 `npm run dev` 後可從預期路徑開啟 ADMIN 頁
- 確認頂端 in-page anchor nav 可導到頁面下方各區塊
- 確認 read-only 管理殼層之資訊架構符合 preanalysis §C / §D 之規劃
- 不在本 phase 補新功能；不在本 phase 改任何 source

明確邊界：

- ✅ 只做 docs-only 驗收紀錄
- ❌ **不**改 `src/` / `content/` / `content/settings/` / `src/views/` / `src/scripts/` / `package.json` / lockfile / `CLAUDE.md`
- ❌ **不** `npm install`
- ❌ **不** `npm run build` / `npm run build:blogger` / `npm run build:sitemap` / 任何 deploy
- ❌ **不**重貼 Blogger / 不動 AdSense / GA4 / commerce 後台
- ❌ **不**新增功能；ADMIN 仍維持 read-only management shell 狀態

---

## C. 人眼瀏覽驗收結果

由 user（操作者）於 2026-06-15 21:00 左右執行；過程未經 Claude 操作瀏覽器，僅 Claude 紀錄 user 提供之結果。

### C.1 ADMIN 頁可開啟之網址

- ✅ `npm run dev` 啟動後，ADMIN 頁可由 `http://localhost:5173/admin/` 開啟
- ✅ **不需要** `http://localhost:5173/portable-blog-system/admin/`（base path 行為符合 Vite dev server 預設 + build-github dev-mode-only render 至 `.cache/pages/admin/index.html` 之路由規劃）

> 紀錄：production build 仍**不**輸出 admin（per night-1 implementation §E．dev-mode-only / 不進 dist / 不 deploy / noindex），本驗收僅針對 dev mode 之本機檢視體驗。

### C.2 IA 導覽（in-page anchor nav）

- ✅ 頁面最上方之 ADMIN 導覽列連結皆可正常導到頁面下方對應區塊
- ✅ 涵蓋 11 個 in-page anchor（per night-1 §C.1）：

  | 導覽連結 | 對應 anchor | 是否可導到 |
  |---|---|---|
  | Dashboard | `#dashboard` | ✅ |
  | Posts | `#posts` | ✅ |
  | Categories | `#categories` | ✅ |
  | Blogger Export | `#blogger-export` | ✅ |
  | GitHub Pages | `#github-pages` | ✅ |
  | AdSense | `#adsense` | ✅ |
  | GA4 | `#ga4` | ✅ |
  | Commerce | `#commerce` | ✅ |
  | Settings | `#settings` | ✅ |
  | System Checks | `#system-checks` | ✅ |
  | Write-path notice | `#write` | ✅ |

### C.3 各管理區塊可見性

User 於頁面上肉眼確認以下 read-only 管理殼層區塊皆可見：

- ✅ **Dashboard** — 系統定位段落 + surface readiness 卡片
- ✅ **Posts** — 既有文章表格（search / filter / sort / detail）
- ✅ **Categories** — Categories & Tags 概覽
- ✅ **Blogger Export** — Blogger 匯出狀態 + 產出位置
- ✅ **GitHub Pages** — GitHub Pages 產出 / Deploy 流程
- ✅ **AdSense** — 主開關 + slot / blocks（masked）
- ✅ **GA4** — 主開關 + events 清單（masked）
- ✅ **Commerce** — 既有 commerce links preview + snippet helper
- ✅ **Settings** — `content/settings/*.json` 清單
- ✅ **System Checks** — CLI script 清單（validate / check / report 系列）
- ✅ **Write-path notice** — Write path 狀態（明示 dormant / 不開放 browser 直寫）

### C.4 驗收重點通過之具體判斷

User 確認：

> 此階段驗收重點通過：**使用者可以先從 ADMIN 頁查看系統狀況，而不是進資料夾看檔案。**

具體達成之效益（符合 preanalysis §C / §D 對 read-only shell 之初版定位）：

1. **可從單一頁面綜覽系統狀態**（5 個 surface + posts + categories + tags + settings + checks）
2. **可從 nav 直接跳到關注區塊**，不需逐個 scroll 找
3. **不需要打開檔案總管 / VS Code** 即可瀏覽 `content/` / `content/settings/` 的 high-level 內容狀態
4. **未實作功能皆明示為 read-only / planned / dormant**，不放假按鈕（per night-1 §C.4）→ user 不會被誤導為「ADMIN 已可完整後台發文」

---

## D. 本階段仍是 read-only admin shell（不是完整 CMS）

本紀錄**明確再次聲明**：

### D.1 read-only 管理殼層之定位

- ADMIN 為「**系統狀態檢視入口**」，**不是**後台 CMS
- **不**在 ADMIN 內新增 / 編輯 / 刪除 / 發布文章
- **不**寫入 `content/` 或 `content/settings/`
- **不**觸發 build / deploy / Blogger repost
- 即使 user 驗收通過，**不**代表 ADMIN 已可作為完整後台使用

### D.2 仍未實作之功能（per night-1 §D / preanalysis §H §3–8）

下列功能本 phase **仍未實作**；ADMIN 內以 `⏳ 未實作` planned list 呈現：

| 類別 | 仍未實作 |
|---|---|
| 文章 | 新增 / 編輯 / 刪除 |
| 文章 | 發布 / 重貼 Blogger |
| 文章 | published URL 一鍵回填 UI |
| 分類 / 標籤 | 用量計數 / 未使用偵測 / cross-site mismatch 紅綠燈 / 編輯 UI |
| Blogger | per-post copy-helper 一鍵打開 / repost readiness flag |
| GitHub Pages | 最後 build / deploy 時間 commit 顯示 / sitemap 預覽 / 一鍵 deploy |
| AdSense | per-post resolved blocks count / surface / 後台收益 mirror |
| GA4 | per-post tracking readiness / custom dimensions / 後台連結 |
| Settings | JSON 編輯 UI / schema 視覺化 / 欄位 picker |
| System checks | 最近一次結果 mirror / per-post warning 計數 / 一鍵觸發 |
| Write path（browser 直寫） | **不開放**；須獨立 middleware 安全 preanalysis |
| Write path（gated CLI for content） | 既有 `admin:write` 對 content dormant |

### D.3 寫入路徑紅線

- ❌ 不在 ADMIN 內提供 browser-side 直接寫檔
- ❌ 不在 ADMIN 內提供 build / deploy 觸發按鈕
- ❌ 不在 ADMIN 內提供 Blogger repost 觸發
- ❌ 不在 ADMIN 內顯示真實 AdSense client / slot id（只顯示 tail4 遮罩）
- ❌ 不在 ADMIN 內顯示真實 GA4 measurementId（只顯示 tail4 遮罩）
- ❌ 不在 ADMIN 內出現 token / API key / OAuth secret / 帳號密碼 / Google Sheet response rows
- ❌ 不在 ADMIN 內顯示 commerce dashboard credentials / commission / payout 統計

→ **驗收通過 ≠ 開放寫入；驗收通過 ≠ 進入第三階段 gated CLI write；驗收通過 ≠ 可在 ADMIN 內觸發 build / deploy / repost。**

---

## E. 變更檔案（精確清單）

本 phase 屬 docs-only acceptance record：

```
docs/20260615-admin-ia-shell-human-acceptance-record.md   — 本紀錄（新增）
```

**未動**：

- `src/`（任何 EJS / JS / SCSS / script）
- `content/`（任何 .md / .json）
- `content/settings/`（任何 JSON）
- `package.json` / lockfile（未 `npm install`）
- `CLAUDE.md`（不動，per phase 要求）
- 其他 docs/*.md
- `.cache/` / `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`
- Blogger live posts / GitHub Pages live deploy / GA4 / AdSense / commerce 後台

---

## F. Validation results

本 phase 屬 docs-only，無 source / settings / build / deploy 變更，**未跑** validation；採用 night-1 既有 baseline carry-forward：

```
npm run validate:content         → 0 error(s) / 94 warning(s) on 84 post(s)  ← baseline carry-forward
check:adsense-resolver           → 34/0  carry-forward
check:adsense-article-block      → 13/0  carry-forward
check:adsense-anchor-wiring      → 14/0  carry-forward
check:blogger-adsense-output     → 85/0  carry-forward（6 target 全覆蓋；live-verified inventory 6 = guard coverage 6；最近一次量測於 pm-18 6th target 加入）
```

本 phase 結束時之 git 驗證（在 commit 前）：

```
git diff --check    → 無錯誤
git status -sb      → 僅有 docs/20260615-admin-ia-shell-human-acceptance-record.md untracked
```

---

## G. Explicit non-actions

- ❌ 未動 `src/`（任何 EJS template / loader / build script / SCSS / JS）
- ❌ 未動 `content/`（任何 .md / .json / settings）
- ❌ 未動 `content/settings/` 任一 JSON（含 `ads.config.json` / `ga4.config.json` / `categories.json` / `tags.json` / `commerce-links.json`）
- ❌ 未動 `package.json` / lockfile；未 `npm install`
- ❌ 未動 `CLAUDE.md`（per phase 要求）
- ❌ 未動 templates / views（含 `src/views/admin/index.ejs`）
- ❌ 未動其他 docs/*.md（僅新增本紀錄一檔）
- ❌ 未跑 `npm run build` / `npm run build:blogger` / `npm run build:sitemap` / `npm run build:promotion`
- ❌ 未跑任何 `check:adsense-*` / `check:blogger-adsense-output`（無 source impact，採用 carry-forward）
- ❌ 未 deploy / 未 push gh-pages / 未動 `portable-blog-deploy` clone
- ❌ 未開 Blogger 後台 / 未重貼任何 Blogger 文章
- ❌ 未開 AdSense 後台 / 未動 ad 設定 / 未新增/hardcode real AdSense id
- ❌ 未動 GA4 後台 / 未動 measurementId / events / custom dimensions
- ❌ 未動 commerce-links registry / 未新增 affiliate entry / 未動 token / credential 紅線
- ❌ 未壓縮 / 重排 CLAUDE.md
- ❌ 未啟用 browser write / middleware / Apply button / gated CLI write
- ❌ 未把 read-only acceptance 視為對 ADMIN 寫入路徑之解鎖訊號
- ❌ 未把 read-only acceptance 視為 deploy / Blogger repost gate 解除
- ❌ 未把 Blogger VIEW count 增加判定為真實流量或 AdSense 成效（既有紅線維持）

→ 唯一 mutation = 本紀錄 doc 自身。

---

## H. Commit / push 計畫（calling phase 自會處理；本紀錄不執行）

預計 commit：

```
docs(admin): record management shell acceptance
```

Files staged：

```
docs/20260615-admin-ia-shell-human-acceptance-record.md
```

CLAUDE.md：本 phase **不**動。

push：依 phase 指示推到 origin/main。

---

## I. Next recommended phase

依 night-1 §I 之主線節奏 + 本驗收結果，下一階段建議：

1. **`20260615-night-3-admin-posts-index-readonly-derive-fields-a`** —
   強化 Posts 區塊；補 preanalysis §F 缺口欄位之 read-only derive：
   - GA4 tracking readiness（indexable + measurementId + nav prev/next/home）
   - AdSense blocks readiness（呼叫 `resolve-adsense-blocks.js` per post / surface）
   - validation warning 計數（aggregate `validate:content` per post）
   - last-checked timestamps
2. **`20260615-XX-admin-post-detail-readonly-expand-a`** —
   單篇 detail panel 擴充 GA4 / AdSense / commerce / nav / validation 區塊
3. **（並行可做）`20260615-XX-admin-categories-readonly-usage-counts-a`** —
   Categories / Tags 用量計數 + cross-site mismatch 紅綠燈
4. **（後續）`20260615-XX-admin-build-deploy-readonly-status-a`** —
   接 `report:build` / git log，read-only 顯示最後 build / deploy 狀態
5. **（最後）write path** —
   仍按 preanalysis §E 分階段紅線：read-only → copy-helper / dry-run → gated CLI write → middleware（須獨立安全 preanalysis）。**不跳階。**

**保守替代**：本 phase 收工後繼續保持 read-only shell 狀態，僅按主線推進 night-3 之 posts derive 欄位。

---

（本紀錄結束）
