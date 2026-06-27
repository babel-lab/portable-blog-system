# 20260627 Admin UI / Markdown export — dev server browser smoke evidence

**Phase / slice**：`20260627-admin-markdown-export-dev-server-smoke-evidence-a`
**Type**：docs-only evidence record（無 source / config / registry / content / dist 變更）
**Pre-baseline**：`80285e22a86cd16906fdb40dd2f342eade4dbfbc`（`feat(admin): clarify markdown export preflight`，2026-06-27）

> 與 `821ec38`（`docs/20260627-admin-markdown-export-browser-smoke-evidence.md`）之差異：
> 該紀錄為**靜態 + helper-only simulation**，**未** 啟動 dev server、未 HTTP fetch；本紀錄則
> **真正啟動本機 Vite dev server**、用 `curl` HTTP fetch `/admin/` 取 served HTML，並輔以
> helper-driven quadrant smoke。兩者互補，不取代彼此；本紀錄補足 `821ec38` caveat 中
> 「無 Vite dev server」之 gap。仍無 browser GUI / Playwright / screenshot（task 範圍外）。

---

## 1. 目的

驗證上一輪 `feat(admin): clarify markdown export preflight`（`80285e2`）所硬化的：

- Draft-only contract callout（`.npd-draft-contract`，6-bullet read-only invariants）
- Manual import flow checklist（`.npd-import-flow` 內 `<ol>`，預期 **5 步**）
- Markdown export contract（永遠 `status:"draft"` + `draft:true`；不可被翻成 ready / published）
- 周邊區塊（registry hints、SEO / cover、ready preflight）不會反向破壞 export contract

是否真的在 dev server 端 served HTML 可見、可讀、行為與 `src/scripts/admin-markdown-export.js`
helper 一致；並確認 missing-title / missing-slug 兩種 unhappy state 仍維持安全提示，
不會誤導成 ready / published。

---

## 2. Scope（本切片做了 / 沒做什麼）

### ✅ 做了

- 啟動本機 Vite dev server（`npm run dev`；本次落在 port 5174，因為 LearnOops 已佔 5173）
- 用 `curl` HTTP fetch `/admin/` → `.cache/admin-served.html`（`.cache/` gitignored，不入 repo）
- 在 served HTML 內定位並比對：
  - 6-bullet draft-only contract callout
  - 5-step manual import checklist `<ol>` / `<li>`
  - export 按鈕 markup（Copy markdown / Download .md / Copy target path / Copy validation command）
- 直接 `node` 跑 `src/scripts/admin-markdown-export.js` exported helpers，
  以 4 組 input quadrant 做 markdown 輸出快照
- 跑 `npm run check:admin-markdown-export`，與 pre-baseline 對齊
- Smoke 結束後 kill dev server 進程，確認本 session 無殘留 vite

### ❌ 沒做（紅線守住）

- ❌ 沒打開實體 browser GUI、沒跑 Playwright、沒新增 devDep、沒 screenshot
- ❌ 沒新增 repo write path / Apply / middleware / admin-write-cli
- ❌ 沒新增 ready option / published option / 任何切 status 的 UI
- ❌ 沒碰 `content/` / `content/settings/` / `dist/` / `dist-blogger/`
- ❌ 沒碰 `package.json` / `package-lock.json`
- ❌ 沒碰 `src/views/admin/index.ejs` / `src/scripts/admin-markdown-export.js` /
   `src/scripts/check-admin-markdown-export.js`
- ❌ 沒 build（dev server 內部 `predev` 是 `build-github --mode=dev`，
   只 render 到 `.cache/pages/`，不出 `dist/`、不 deploy）
- ❌ 沒 push gh-pages、沒碰 Blogger live
- ❌ 沒碰 Google Form / Drive / GA4 / AdSense / Search Console
- ❌ 沒碰 LearnOops 專案（port 5173 listener = LearnOops vite，PID 19544，明確排除）

---

## 3. Baseline verify（進場時）

```text
pwd                    : /d/github/blog-new/portable-blog-system
branch                 : main
HEAD                   : 80285e22a86cd16906fdb40dd2f342eade4dbfbc
log -1                 : 80285e2 feat(admin): clarify markdown export preflight
status --short         : (clean)
rev-list left/right    : 0  0
.git/index.lock        : absent
check:admin-md-export  : 92 / 92 PASS
```

---

## 4. Dev server start log（節錄）

`npm run dev` 內部串：`predev`（`build-github.js --mode=dev`）→ Vite。

```text
[build-github] wrote .cache/pages/admin/index.html
[build-github] done in 6087ms
> portable-blog-system@0.1.0 dev
> vite --host 0.0.0.0
Port 5173 is in use, trying another one...
VITE v8.0.10 ready in 6767 ms
➜  Local:   http://localhost:5174/
```

> `Port 5173 is in use` = LearnOops 專案 vite 已佔；驗 PID = `19544`，
> CommandLine = `node ... D:\github\learnoops_starship_express_demo_20260626_ga_ejs\...\vite.js`，
> 明確排除為本 session 之 process（不予 kill；本 session 紅線守 LearnOops）。

---

## 5. HTTP smoke：curl GET /admin/

```text
$ curl -s -o .cache/admin-served.html -w "HTTP=%{http_code} BYTES=%{size_download}\n" \
    http://127.0.0.1:5174/admin/
HTTP=200 BYTES=899192
$ wc -l .cache/admin-served.html
13873 .cache/admin-served.html
$ grep -c "npd-" .cache/admin-served.html
99
```

### 5.1 Draft-only contract callout（六項）

served HTML 在 L11028 之後含 `<div class="npd-draft-contract">`，標題為
`📋 Draft-only contract  read-only invariants`，內含 6 個 `<li>`：

| 任務需求（task §二.3） | served HTML 字串實況（節錄）|
| --- | --- |
| 目前輸出仍是 draft-only | `產出永遠是 draft：frontmatter 固定 status: "draft" + draft: true；表單沒有 ready / published 切換` |
| 產生 Markdown 不等於發布 | `產出 ≠ 發布：Copy / Download 不會送上 Blogger、GitHub Pages、Google Drive 或任何後台；不會觸發 build / deploy` |
| 不會自動寫入 repo | `不會自動寫入 repo：Admin 不寫 content/、不發 fetch、不跑 Apply / safeWrite / middleware；要存檔請由 Dean 人工貼入` |
| 必須人工複製或下載 .md | 同上（人工貼入）+ Step 1 of `<ol>`（§5.2）|
| 目標位置是 `content/blogger/posts/`（或 github）| `目標位置：依 site 切換 content/github/posts/ 或 content/blogger/posts/，檔名 {date}-{slug}.md` |
| 匯入後需要跑 validation/checker | `匯入後請執行 validation：npm run validate:content（VS Code terminal）；通過後再決定是否在 VS Code 把 status 改成 ready / published` |

六項全 PASS。callout 上方還有黃底 🔒 `Authoring helper — no fs write · no fetch · no Apply ·
copy / download only` 區塊 + `section-lede`，三層 draft-only 提醒疊加，難以誤會。

### 5.2 Manual import flow checklist：5-step

`<ol>` 內共 **5 個 `<li>`**（served HTML L11263–L11269）：

1. `Download .md（或 Copy markdown），取得 {date}-{slug}.md 檔案 — 此時檔案還在瀏覽器 / 剪貼簿，尚未進入 repo`
2. `用 VS Code 或 Explorer 把 .md 手動存到 target folder（例：content/github/posts/）— 這一步完成後檔案才正式在 repo 內`
3. `在 terminal 跑 npm run validate:content 檢查 frontmatter 與 schema（PASS 才算 import 完成）`
4. `需要時用 VS Code 編修 body / category / tags / cover；本階段請維持 status:"draft" + draft:true`
5. `若日後要升 ready / published，請在 VS Code 手動改 frontmatter（Admin 永遠不切 status），改完再跑 npm run validate:content 確認 0 errors`

→ ✅ 確認 served HTML 為 **5-step**（task §二.4 預期值）；舊 4-step 已不在 DOM。

### 5.3 Markdown export 區可見 + 無 ready / published 控件

```text
$ grep -c 'status:"ready"\|status: "ready"\|status:"published"\|status: "published"\
         |draft: false\|draft:false\|<input...type="checkbox"...draft\
         |<button...publish\|<button...Publish' .cache/admin-served.html
1
$ grep -n 'status:"ready"' .cache/admin-served.html
11279:  若未來想把這份 draft 手動改成 status:"ready"，需要先補下方 Blocking 欄位…
```

唯一命中 = Ready preflight panel 之 read-only 提示 prose（明示「未來人工手改」的
future-action，並冠 `read-only hint` tag + `Admin 永遠不切 status` 免責文字）。served HTML
**沒有任何**能切 ready / published 的 form 控件（無 `<button>Publish</button>`、
無 `<input ... draft>`、無 `<select id="...status">`）。

→ ✅ task §二.5 之「UI 不會出現 ready/published 的誤導性訊息」PASS。

---

## 6. Helper-driven smoke（4 quadrant input states）

直接 `node` import `src/scripts/admin-markdown-export.js`（client EJS inline JS 之 mirror
source-of-truth），對 4 組 input 跑 `buildPostMarkdown` / `isExportReady` /
`buildPostFilename` / `buildTargetFolder` / `buildTargetPath` / `buildExportSummary`，所有
helper 已被 `check:admin-markdown-export` 之 92 個 case 鎖定：

| Input quadrant | site | slug | title | date | `isExportReady.ok` | `filename` | `targetPath` | `status` line | `draft` line | `summary.status` | `summary.draft` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Q1** minimal-valid | github | `browser-smoke-evidence-note` | `Browser smoke evidence note` | `2026-06-27` | **true** | `2026-06-27-browser-smoke-evidence-note.md` | `content/github/posts/2026-06-27-…md` | `status: "draft"` ✅ | `draft: true` ✅ | `"draft"` | `true` |
| **Q2** missing-title | github | (有) | **`""`** | (有) | **false**（`missing:["title"]`） | (有；slug+date 仍合法) | (有) | `status: "draft"` ✅ | `draft: true` ✅ | `"draft"` | `true` |
| **Q3** missing-slug | github | **`""`** | (有) | (有) | **false**（`missing:["slug"]`） | **`""`**（UI Download disable） | **`""`**（UI Copy target path disable） | `status: "draft"` ✅ | `draft: true` ✅ | `"draft"` | `true` |
| **Q4** blogger-site | blogger | `blogger-smoke` | `Blogger smoke` | `2026-06-27` | **true** | `2026-06-27-blogger-smoke.md` | `content/blogger/posts/2026-06-27-blogger-smoke.md` | `status: "draft"` ✅ | `draft: true` ✅ | `"draft"` | `true` |

四個 quadrant **皆無**任何字串 `status: "ready"` / `status: "published"` /
`draft: false`。constants 也 mirror 鎖定值：

```text
VALIDATION_COMMAND = "npm run validate:content"
TARGET_FOLDERS     = { github: "content/github/posts/", blogger: "content/blogger/posts/" }
```

→ ✅ task §二.5 之「Markdown 仍包含 `status:"draft"` 與 `draft:true`」PASS（4/4 quadrant）。
→ ✅ task §二.6 之「missing title / slug 時 UI 應維持安全提示，不應鼓勵匯入」PASS：
   Q2/Q3 `isExportReady.ok=false` → Download / Copy target path 按鈕（依 `isExportReady`
   gate）會 disable；export 預設仍是 draft，永遠不會反向變成 ready。

> Note：Q2 missing-title 時 helper 仍輸出含 placeholder `title: "TODO-fill-title"` 的
> markdown 字串（因為 helper 本身設計為 always returns markdown），但 UI gate 來自
> `isExportReady.ok`，false 時 Download / Copy buttons 禁用，避免使用者匯入半成品。

---

## 7. Server stop / 殘留檢查

```text
$ Get-NetTCPConnection -LocalPort 5174 -State Listen | Stop-Process -Force
killed pid 21620
$ Get-NetTCPConnection -LocalPort 5174 -State Listen
(empty → port 5174 free)
$ Get-NetTCPConnection -LocalPort 5173 -State Listen
pid 19544（LearnOops 專案；不予處理）
```

背景 task `bmkimht0w`（`npm run dev`）回報 `failed exit code 127` 即上述 kill 之 OS-level
信號，非實際 build / vite 失敗（dev server 在被 kill 前已正常 ready 並 serve HTTP 200）。

→ ✅ dev server 已關閉，本 session 沒有殘留 background vite process。

---

## 8. Validation re-run（post-smoke）

```text
$ npm run check:admin-markdown-export
... 92 / 92 PASS
```

與 baseline 一致（沒有新增 / 移除 smoke case；本切片為 docs-only）。

```text
$ git diff --check         → clean
$ git diff --stat          → 僅 docs/20260627-admin-markdown-export-dev-server-smoke-evidence.md 新增
$ git status --short       → ??（新檔）
```

---

## 9. 觀察 / 不在本切片修正

1. **EJS 內一處 source 端 comment drift（無 UI 影響）**：
   `src/views/admin/index.ejs:2019` 之 `<%# ... %>` comment 寫
   `4 步 checklist`，但 DOM 已是 5-step（見 §5.2）。屬上輪 import-checklist slice2 → 後續
   擴張時遺漏更新 comment；**served HTML 不可見**，無 UI 誤導風險。本切片**不**修，
   留給未來文案 / source comment hardening slice 處理。
2. **Ready preflight panel 之「未來手動改 ready」prose**：是唯一 served HTML 出現
   `status:"ready"` 字串之處（L11279），但已在 read-only hint 內、配 `read-only hint`
   tag + `Admin 永遠不切 status` 免責文字。不誤導；不需處理。
3. **`.cache/admin-served.html` / `.cache/admin-smoke-script.mjs`** 為 smoke 中介產物；
   `.cache/` 已 gitignored，不會進 commit。
4. **port 5173 是 LearnOops 專案 vite**，本 session 全程未碰。port 5174 為本 session 啟動
   + 結束時主動 kill 清理。

---

## 10. 結論

`80285e2` 引入的 draft-only contract callout、Manual import flow 5-step checklist、
Markdown export contract 在本機 Vite dev server **真實 HTTP serve** 端皆可正常 render，
內容字串與行為與 `src/scripts/admin-markdown-export.js` helper 一致；4 種 input state
（minimal-valid / missing-title / missing-slug / blogger-site）皆未能讓 export 反向變成
ready / published。

`check:admin-markdown-export` 保持 **92 / 92 PASS**（baseline 不動）。

本紀錄補足 `821ec38` 紀錄之「無 Vite dev server」caveat，**仍非** full browser GUI smoke
（無 Playwright / 無 screenshot），這部分仍待 Dean 本機目視 / 或另開 phase（不引入新 dep）。

下一步建議（**不**在本切片實作；各須獨立 phase + explicit approval）：

- 文案 / source comment hardening：把 `index.ejs:2019` 之 `4 步 checklist` 更新為 `5 步`
- B1 / B3 / B4 / B5 推進、admin richer fields、ready option 等仍需明示啟動 phase
- Browser GUI / Playwright 級別之 smoke 不在本階段範圍

---

## 11. Red lines（本切片沒有碰）

- ❌ no repo write path / no Apply / no middleware / no admin-write-cli
- ❌ no ready option / no published option / 沒有任何切 status 的 UI
- ❌ no database / no login / no multi-user
- ❌ no Blogger live / no Google Form / no Google Drive / no GA4 / no AdSense / no Search Console
- ❌ no `content/` / no `content/settings/` / no `dist/` / no gh-pages 異動
- ❌ no `package.json` / no `package-lock.json` 異動
- ❌ no LearnOops 專案處置
- ❌ no deploy / no `npm run build` / no big ledger 回寫 CLAUDE.md
- ❌ no destructive git ops（no reset --hard / rebase / amend / force push / cherry-pick / merge）
