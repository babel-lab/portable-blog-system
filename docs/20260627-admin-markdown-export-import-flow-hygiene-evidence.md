# 20260627 — Admin Markdown export import-flow source/comment hygiene evidence

本文件記錄一個 **source/comment hygiene + 5-step import flow lock** 小切片：
修正 `src/views/admin/index.ejs` 內過期的 `4 步 checklist` source comment，
並在 `src/scripts/check-admin-markdown-export.js` 新增 1 個 smoke case 鎖住

1. source 不再宣稱 `4 步 / 4-step / four-step`
2. `.npd-import-flow` 內 `<ol>` 必須恰好有 5 個 `<li>`

本 Session **不**改 UI 功能、**不**改 helper contract、**不**新增 ready/write
path、**不**啟動 dev server、**不**做 browser smoke、**不**動 content /
dist / Blogger / GA4 / AdSense 任何後台或 build artifact。

---

## 1. Baseline（修改前）

```
pwd                                   # /d/github/blog-new/portable-blog-system
git branch --show-current             # main
git rev-parse HEAD                    # a10d38a2e2abc72f5b57528a401e79401bef15ff
git log -1 --oneline                  # a10d38a docs(admin): record markdown export browser smoke
git status --short                    # （空 — working tree clean）
git rev-list --left-right --count origin/main...HEAD   # 0   0
.git/index.lock                       # absent
npm run check:admin-markdown-export   # 92 / 92 PASS
```

- branch = `main`
- HEAD short = `a10d38a`
- HEAD full = `a10d38a2e2abc72f5b57528a401e79401bef15ff`
- subject = `docs(admin): record markdown export browser smoke`
- working tree clean
- ahead / behind = 0 / 0
- `.git/index.lock` absent
- `check:admin-markdown-export` = **92 / 92 PASS**

符合本 Session 進場條件，可開始修改。

---

## 2. 問題 surface

上一輪 browser smoke evidence
（`docs/20260627-admin-markdown-export-browser-smoke-evidence.md`）已 dual-accept
Admin UI 實際 DOM 是 5-step manual import checklist，但
`src/views/admin/index.ejs` 行 ~2017–2022 的 source comment 仍寫：

```
<%# Phase 20260627-admin-markdown-import-checklist-slice2-a:
    Manual import flow block — 純 display helper：顯示「應該存到哪裡」「之後該跑什麼」+
    4 步 checklist；按鈕只 copy 字串到 clipboard，永不寫 fs / fetch / repo。
    ...
-%>
```

實際 `<ol>`（line ~2064–2070）已是 5 個 `<li>`（Download → save → validate →
edit → 升 ready 前再 validate）。source comment 與實際 DOM 不一致 → 維運時
容易誤判 / 容易把舊版描述複製到別處。

---

## 3. 修改

### 3.1 `src/views/admin/index.ejs`

把 source comment 從 `4 步 checklist` 改成 `5 步 checklist（download →
save → validate → edit → 升 ready 前再 validate）`，並補上「實際 `<ol>` 必須
維持 5 個 `<li>`、smoke 鎖在 `check-admin-markdown-export.js`」之 hint。

```diff
 <%# Phase 20260627-admin-markdown-import-checklist-slice2-a:
     Manual import flow block — 純 display helper：顯示「應該存到哪裡」「之後該跑什麼」+
-    4 步 checklist；按鈕只 copy 字串到 clipboard，永不寫 fs / fetch / repo。
+    5 步 checklist（download → save → validate → edit → 升 ready 前再 validate）；
+    按鈕只 copy 字串到 clipboard，永不寫 fs / fetch / repo。
     target folder / target path / Copy markdown / Download / Copy target path
     共用同一套 date + slug + title 驗證來源（isExportReady → npd state），
-    避免使用者誤把半成品 copy 出去並存進 content/posts/。 -%>
+    避免使用者誤把半成品 copy 出去並存進 content/posts/。
+    Lock：實際 <ol> 必須維持 5 個 <li>，且 source 不再宣稱「4 步」/「4-step」；
+    smoke 鎖在 check-admin-markdown-export.js。 -%>
```

**沒有**改 UI render 結果（DOM / class / style / id / button label / 顯示
文字 / 順序皆未變）。改動全部在 EJS source comment 區段內 —— 不會出現在
build 後之 HTML。

### 3.2 `src/scripts/check-admin-markdown-export.js`

- 補三個 ESM std imports（`node:fs` / `node:url` / `node:path`），僅供新 smoke
  case 使用，不影響其餘 92 case。
- 新增 **case 93**：`admin index.ejs manual import flow is 5-step (no stale
  "4 步" / "4-step")`：
  - 用 `readFileSync` 讀 `src/views/admin/index.ejs`（純 string scan，無 DOM /
    無 headless browser / 無新增 npm dependency）。
  - 三條 negative assertion：MUST NOT match `4\s*步\s*checklist` /
    `4-step\s+(checklist|import|flow)` / `four[-\s]step\s+(checklist|import|flow)`。
  - 一條 positive assertion：定位 `class="npd-import-flow"`，往後找最近一個
    `<ol>…</ol>`，掃 `<li(\s|>)` 出現次數，必須**恰好為 5**。

case 93 之意圖：

- 鎖住 source comment hygiene：未來任何人若把 `4 步` 又寫回來、或把流程改回
  4 步卻忘了同步註解，checker 會立刻 FAIL。
- 鎖住 DOM 結構：若有人手滑刪掉一個 `<li>` 或新增第 6 個 `<li>`，checker 會
  FAIL，逼迫變更走 phase + docs evidence。

---

## 4. 紅線 / 不變項

本 phase **未**跨越下列任一條紅線（對齊 CLAUDE.md §3a Core operating
rules + 本 Session 任務描述）：

| 紅線項目 | 狀態 |
| --- | --- |
| repo write path（Apply / middleware / admin-write-cli） | ❌ 未新增 |
| ready option / `status:"ready"` / `draft:false` 可達 | ❌ 未新增 |
| database / login / auth / multi-user | ❌ 未新增 |
| Blogger live / Google Form / Google Drive / GA4 / AdSense / Search Console | ❌ 未動 |
| `content/` / `content/settings/` | ❌ 未動 |
| `dist/` / `dist-blogger/` / `gh-pages/` | ❌ 未動 |
| `package.json` / `package-lock.json` | ❌ 未動 |
| LearnOops 專案 | ❌ 未動 |
| `npm run build` / build:github / build:blogger / build:promotion / build:sitemap | ❌ 未跑 |
| dev server / preview | ❌ 未啟動 |
| Blogger / AdSense / GA4 / Search Console / Drive 後台 | ❌ 未登入 |
| `git push --force` / `reset --hard` / `rebase` / `amend` / `cherry-pick` / `merge` | ❌ 未用 |
| 把大段 ledger 回寫 CLAUDE.md | ❌ 未做 |

Helper contract：`buildPostMarkdown` / `isExportReady` / `analyzeReadyGap` /
`buildExportSummary` / `analyzeRegistryHints` / `buildTargetFolder` /
`buildPostFilename` / `buildTargetPath` 之 import surface 全部不變。

---

## 5. 驗證

```
npm run check:admin-markdown-export
```

結果：**93 / 93 PASS**（baseline 92 → 93；新增 1 case；無回退）。

關鍵 case：

```
PASS  92 raw markdown text contains literal `status: "draft"` and `draft: true` lines
PASS  93 admin index.ejs manual import flow is 5-step (no stale "4 步" / "4-step")

93 / 93 PASS
```

`status:"draft"` + `draft:true` defense-in-depth lock 仍 PASS（case 91 / 92）；
本 phase 沒有打破 draft-only contract。

其餘 validation baseline 未跑（本 phase 無新內容、無 schema / loader / renderer
變更；對齊 CLAUDE.md §3a「不重跑 validate:content 或 check guard，除非 phase
要求 regression check」）。

---

## 6. Changed files

```
src/views/admin/index.ejs                                           （source comment only）
src/scripts/check-admin-markdown-export.js                          （+1 smoke case，+3 std import）
docs/20260627-admin-markdown-export-import-flow-hygiene-evidence.md （本檔）
```

`git status --short` / `git diff --check` / `git diff --stat` 結果於 commit 前
再次量測，確認無 whitespace error、無未追蹤的意外檔案。

---

## 7. Next（不主動執行）

- 不再主動推進 ADMIN 線；仍維持 idle freeze（CLAUDE.md §3a ADMIN current
  state）。
- 後續若有對 import flow 步驟之內容變更（例：加入「先在 VS Code 預覽 cover
  圖」步），請：
  1. 同步更新 case 93 之 `5` → `N`，並更新 source comment 與本文件之 hint。
  2. 變更須走獨立 phase + user explicit approval；本 hygiene 紀錄不視為對未來
     step 數變更之預先授權。
- 完整 browser-run smoke for `/admin/#new-post-draft` 仍待 Dean 本機手動開啟，
  Claude 不會自行啟動 dev server / 引入 Playwright（per CLAUDE.md §3a）。
