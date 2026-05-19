# Admin-2-b-1 Completion Report：dry-run edit viewer 收尾

本文件封存 **Phase Admin-2-b-1（dry-run edit viewer；no write）**之收尾紀錄。屬 Admin-2 write 系列之**第一個 sub-batch**；嚴格 **read + preview-only**；**無**任何實際寫入。

對應上層文件：
- `docs/admin-2-write-pre-analysis.md`（Phase Admin-2-a；§7.1 推薦 b-1 為 dry-run viewer / §11 stop point 2）
- `docs/admin-1-completion-report.md`（Admin-1 read-only 系列收尾）
- `docs/admin-mvp-pre-analysis.md`（Admin MVP 詳規劃）
- `docs/admin-local-boundary-pre-analysis.md`（邊界政策）

---

## §1 Admin-2-b-1 目標摘要

提供作者於本機 dev-mode Admin 內**預覽**對 safe-editable 欄位之擬寫變更（old / new / status diff），**完全不寫入**任何 source 檔案。

設計動機（per `admin-2-write-pre-analysis.md` §9.3）：

- 對齊 Admin-1-a preflight 之「先看後做」原則
- 在啟動實際寫入（Admin-2-b-2+）之前，先驗證 form / diff calculation / UX 流程
- 避免做完寫入功能才發現 form 設計不對；user 可提早 UX feedback
- 風險完全為零（無 fs.write / 無 server / 無 fetch / 無 form submit）

---

## §2 commit hash

```
b676f26 feat(admin): add Admin-2-b-1 dry-run edit viewer
```

線性堆疊於 `652e2b5`（Admin-2-a pre-analysis）之後；無 amend / rebase / force / push。

---

## §3 新增功能摘要

於 `src/views/admin/index.ejs`（+119 行）per-post detail panel 內新增 **`Dry-run edit (no write)`** section（位置：Source path 之前；既有 7 detail sections 之後）：

| 元素 | 行為 |
|---|---|
| **Warning banner** | `⚠️ Dry-run only. No file will be written.` 明顯黃框 |
| **per-post dry-run edit section** | 每篇 post detail panel 各 1 個（4 篇 → 4 個 dry-run section）|
| **Start Edit / Cancel button** | toggle 表單顯示；reset 時隱藏 result |
| **Show Dry-run Diff button** | 計算 old / new / status；純 client-side JS；不寫任何檔案 |
| **old / new / status table** | per-field 顯示舊值 / 新值 / 狀態（changed / unchanged / unchanged-empty）+ 顏色標示 |
| **Changed count** | 變更欄位數量統計（X / 4） |
| **二次 warning banner** | Diff result 下方再次提醒「VS Code + git workflow 處理實際寫入」|
| **click stopPropagation** | dry-run section 內 click 不冒泡至 post-row（避免誤觸折疊 detail）|

實作要點：

- 純 vanilla JS（無 framework / 無 fetch / 無 XHR）
- old value 來源：EJS render 時直接從 loader 注入 `data-current="<%= p.field %>"`
- new value 來源：瀏覽器 textarea.value（僅 in-memory）
- diff 計算：簡單字串比較；無 char-level diff library
- HTML escape：`escapeHtml()` 用 `textContent → innerHTML` 防 XSS

---

## §4 支援欄位

**4 個 safe-editable 欄位**（per `admin-2-write-pre-analysis.md` §4.1 subset；最小 MVP）：

| 欄位 | 來源檔 | UI 控件 | 風險評估 |
|---|---|---|---|
| `description` | `.md` frontmatter | textarea rows=2 | 🟢 純 string；無 routing；只影響 SEO 顯示 |
| `searchDescription` | `.md` frontmatter | textarea rows=2 | 🟢 同上 |
| `titleEn` | `.md` frontmatter | textarea rows=1 | 🟢 FB / OG 用；無下游 routing |
| `coverAlt` | `.md` frontmatter | textarea rows=1 | 🟢 圖片 alt；無下游影響 |

**未支援**（per Admin-2-b-1 scope；留至後續 sub-batches）：

- `cover`（URL；屬 §4.1 safe-editable 但需 URL 驗證）
- `updated`（ISO date；需 format 驗證）
- `.fb.md` 欄位（enabled / hashtags / body；留 b-3）
- `blocks.*`（boolean；留 b-5）
- 所有 risky-editable / read-only / forbidden 欄位（per §4.2-§4.4）

---

## §5 dev-mode-only 邊界

per Admin-1-b 之 `src/scripts/build-github.js` 機制（本批未動）：

| 條件 | 結果 |
|---|---|
| `node src/scripts/build-github.js --mode=dev` | ✅ 產出 `.cache/pages/admin/index.html`（1119 行；含 dry-run viewer）|
| `node src/scripts/build-github.js --mode=build`（含於 prebuild）| ❌ 早期 `fs.rm -rf .cache/pages/admin/` cleanup + 跳過 admin render |

→ Admin（含 dry-run viewer）**僅本機 dev mode**；prod build 永遠不產出。

---

## §6 無寫入保證

| 保證項 | 驗證 |
|---|---|
| 無 Apply / Save / Write button | ✅ EJS 內僅 3 個 button：`Start Edit / Cancel`（toggle 表單）+ `Show Dry-run Diff`（純計算）|
| 無 content / publish.json / fb.md / settings 寫入 | ✅ `grep -REn "writeFile\|writeFileSync\|fs\.write" src/views/admin/ src/scripts/load-admin-posts.js` → **0 hits** |
| 無新增 `fs.writeFile` 寫資料來源 | ✅ 本批僅修改 `src/views/admin/index.ejs`；無 .js 變動；無 fs API 引用 |
| 無 server / 無 API endpoint | ✅ 純 client-side vanilla JS；無 fetch / XHR / WebSocket / FileSystem API |
| 無 form submit 寫入 | ✅ `<button>` 皆 `type="button"`；無 `<form action>` |
| build-github.js 既有 writeFile 屬 build render | ✅ 既有 writeText / writeJson 寫 `.cache/pages/`（per Admin-1-b 之 admin render call line 616 屬此類）；本批未新增此類呼叫；無寫入 content / sidecar / settings |

---

## §7 build / isolation 驗證摘要

per `npm run build` + 後續 sanity grep：

| 驗證項 | 結果 |
|---|---|
| dev mode 產出 admin | ✅ `node src/scripts/build-github.js --mode=dev` → `.cache/pages/admin/index.html`（1119 行） |
| prod build 清除 admin | ✅ `npm run build` 後 `.cache/pages/admin/` **ABSENT**（early cleanup 生效）|
| dist/admin 不存在 | ✅ `test -d dist/admin` → ABSENT |
| sitemap 不含 admin | ✅ `grep -c admin dist/sitemap.xml` → **0** |
| navigation 不含 admin | ✅ `grep -c admin content/settings/navigation.json` → **0** |
| robots.txt 內容不變 | ✅ `Disallow: /design-system/` + `Disallow: /404.html`；不需加 admin Disallow（prod 不產出）|

---

## §8 尚未做項目

per `admin-2-write-pre-analysis.md` §7.2 之後續 sub-batches；**本批一律不做**：

| 項目 | 屬 sub-batch |
|---|---|
| 實際 write（將 dry-run 變成可 apply）| Admin-2-b-2（SEO write）|
| Markdown frontmatter 完整寫回 | Admin-2-b-2 |
| Apply / Save button | Admin-2-b-2+ |
| Backup mechanism（`.bak` or git status check）| Admin-2-b-2 |
| Post-write validate（spawn `npm run validate:content`）| Admin-2-b-2 |
| Atomic temp-rename write strategy | Admin-2-b-2 |
| Rollback workflow（git restore button or instruction）| Admin-2-b-2+ |
| FB sidecar dry-run / write | Admin-2-b-3 |
| `titleEn` / `cover` / `coverAlt` / `updated` write（dry-run 已支援）| Admin-2-b-4 |
| `blocks.*` boolean toggles write | Admin-2-b-5 |
| Risky-editable fields（title / slug / contentKind / category / status / publishTargets / etc.）| Admin-2-c+ |

---

## §9 下一步建議

per `admin-2-write-pre-analysis.md` §7.2 + §11 stop point 3 之建議：

1. **明天再啟動 Admin-2-b-2**：今日 Admin 系列 batch 已 5 個（1-a / 1-b / 1-c / 1-wrap / 2-a / 2-b-1 / 2-b-1-wrap）；給 user 一晚消化驗證 UX + 確認方向
2. **Admin-2-b-2 只允許 description / searchDescription 兩欄位**（per `admin-2-write-pre-analysis.md` §7.2 之 SEO 欄位最小 write scope；單一 .md / 兩個 string 欄位 / 最低跨欄位影響）
3. **必須先設計 write safety checkpoint**（per `admin-2-write-pre-analysis.md` §6 推薦 B+D+E+F 組合）：
   - B：temp-file + atomic rename
   - D：dry-run default + explicit "Apply" confirmation
   - E：pre-write inline validation（type / format / length）
   - F：post-write `npm run validate:content` baseline 對照

---

## §10 stable snapshot 維持紀錄

Admin-2-b-1 系列**未影響** stable snapshot：

| 維度 | 狀態 |
|---|---|
| build-github.js / load-admin-posts.js | ❌ 未動 |
| build-blogger / build-promotion / build-sitemap / build-blogger-theme | ❌ 未動 |
| content posts / settings JSON / publish.json / fb.md | ❌ 未動 |
| package.json / npm dependencies | ❌ 未動 / 未新增 |
| dist / deploy repo（HEAD `4ecd92d`）| ❌ 未動 |
| Blogger templates / output（dist-blogger/posts/we-media-myself2/post.html mtime 仍 2026-05-18 17:06）| ❌ 未動 |
| GA4 / AdSense 程式碼 | ❌ 未動 |
| navigation / sitemap / robots（線上效果）| ❌ 未動 |
| Admin-1-c 既有 read-only 功能（search / filter / detail / completeness）| ✅ 維持 |
| 雙 repo 分離 / source 留本機 / dev-mode-only Admin 三大原則 | ✅ 維持 |

---

## §11 邊界聲明

- ✅ 本系列嚴格 read + preview-only；**無**任何實際寫入
- ✅ 沿用 Admin-1 既有邊界（dev-mode-only / 不入 dist / sitemap / nav / robots Disallow）
- ✅ 本系列**不**啟動 Admin-2-b-2 SEO write
- ✅ 本系列**不**改變既有 schema
- ✅ 本系列**未**引入 npm dependencies / framework / server / auth

---

## §12 Cross-links

- `docs/admin-2-write-pre-analysis.md`（Phase Admin-2-a；§7.1 推薦 b-1 為 dry-run viewer）
- `docs/admin-1-completion-report.md`（Admin-1 read-only 系列收尾）
- `docs/admin-mvp-pre-analysis.md`（Admin MVP 詳規劃）
- `docs/admin-local-boundary-pre-analysis.md`（Admin 邊界政策）
- `docs/admin-1-readonly-preflight.md`（Plan B dev-mode-only 之選定）
- `docs/system-direction.md`（BLOG 系統整體方向）
- `docs/publish-bundle.md`（sidecar 三檔結構；Admin read 之資料來源）
- `docs/content-schema.md`（frontmatter 欄位字典）
- `CLAUDE.md` §11（contentKind）/ §17（article blocks）/ §29（第一版不做清單）

---

（本文件結束）
