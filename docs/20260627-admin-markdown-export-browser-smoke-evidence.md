# 20260627 — Admin Markdown export browser/manual smoke evidence

本文件記錄 Phase 1 Admin UI / Markdown draft export MVP 之 browser/manual smoke
驗收。本 Session 不改 source、不改 Admin UI、不新增 ready option、不啟用任何
repo write path；僅以 build:github 重新 render Admin page、靜態掃 rendered HTML
與 client-side script、用 Node 跑 server-side helper 對齊 client 預期，並跑全套
validations。

---

## 1. Baseline

驗收於本 phase 啟動前執行：

```
pwd                                   # /d/github/blog-new/portable-blog-system
git status --short                    # （空 — working tree clean）
git rev-parse --abbrev-ref HEAD       # main
git rev-parse HEAD                    # 10a423233cae8ec7aa601a6d418f34604532304a
git log -1 --oneline                  # 10a4232 docs(claude-md): compress admin phase state
git rev-list --left-right --count origin/main...HEAD   # 0   0
ls -la .git/index.lock                # absent
```

- branch = `main`
- HEAD short = `10a4232`
- HEAD full = `10a423233cae8ec7aa601a6d418f34604532304a`
- subject = `docs(claude-md): compress admin phase state`
- working tree clean
- ahead / behind = 0 / 0
- `.git/index.lock` absent

---

## 2. Smoke method

採用 method **C**（靜態 + helper simulation，無 dev server、無 browser
automation、無新增 dependency）：

1. 跑 `npm run build:github` 重新 render `.cache/pages/admin/index.html`
   （CI-equivalent；同 production EJS path）。
2. 用 `Grep` 對 rendered HTML 掃 24 個 `#new-post-draft` 相關 DOM IDs，確認元素
   存在於最終輸出（不僅止於 EJS source）。
3. 用 `Grep` 對 rendered HTML 之 client-side script range 掃寫入指紋：
   `fetch` / `XMLHttpRequest` / `sendBeacon` / `axios` / `writeFile` /
   `appendFile` / `.submit(` / `formData` / `location.assign` /
   `location.replace` / `status: "ready"` / `ready.*option`。
4. 用 `Node --input-type=module` import `src/scripts/admin-markdown-export.js`，
   以 §4 dummy data 跑 `buildPostFilename` / `buildTargetFolder` /
   `buildTargetPath` / `isExportReady` / `analyzeReadyGap` /
   `buildPostMarkdown`，比對 client mirror 在 EJS 內之預期行為（smoke 鎖在
   `check:admin-markdown-export` 52 case 內，本 phase 不再 fork client/server）。
5. 跑全套 validations（§7）。
6. `git status --short` 確認 build 未在 working tree 留下 diff。

**未啟動** dev server / preview。**未啟動** Playwright / browser automation。
**未** 新增 npm / runtime dependency。**未** 寫入 `content/` / `dist/` /
`dist-blogger/` 任何受 git 追蹤之檔案。

---

## 3. Commands run

```
npm run build:github
node --input-type=module -e '...admin-markdown-export simulation...'
npm run check:admin-markdown-export
npm run validate:content
node src/scripts/check-page-type-validator.js
npm run build:blogger
```

---

## 4. Test data

純 in-memory dummy data，未寫入 repo（亦未寫入 `.cache/` 之外的任何受 git
追蹤位置）：

```
site:             "github"
contentKind:      "post"
primaryPlatform:  "github"
title:            "Admin Smoke Test Draft"
slug:             "admin-smoke-test-draft"
date:             "2026-06-27"
category:         "tech-note"
tags:             "admin, smoke, draft"
description:      "This is a local admin smoke test draft for validating Markdown export only."
body:             "## Smoke test\n\nThis draft is generated only for local UI smoke evidence."
```

---

## 5. Observed UI elements

`.cache/pages/admin/index.html`（rendered；非 EJS source）含以下 24 個
`#new-post-draft` 相關 DOM 元素（行號為 rendered HTML 內位置）：

- `#new-post-draft` h2 anchor — line 11014
- 表單欄位（10）：`#npd-site` / `#npd-contentkind` / `#npd-primary` /
  `#npd-title` / `#npd-slug` / `#npd-date` / `#npd-category` / `#npd-tags` /
  `#npd-description` / `#npd-body` — lines 11032 / 11042 / 11056 / 11065 /
  11071 / 11078 / 11085 / 11103 / 11110 / 11116
- Markdown preview：`#npd-output` / `#npd-filename` — lines 11126 / 11125
- Export buttons：`#npd-copy` / `#npd-download` / `#npd-status` — lines 11132 /
  11134 / 11136（均含 `disabled` + `aria-disabled="true"` initial state）
- Manual import flow：`#npd-target-folder` / `#npd-target-path` /
  `#npd-validation-command` / `#npd-copy-path` / `#npd-copy-cmd` /
  `#npd-flow-status` — lines 11153 / 11160 / 11166 / 11172 / 11174 / 11176
  （`#npd-copy-path` initial `disabled`；`#npd-copy-cmd` 不 gate，validation
  command 是 literal 常數）
- Ready preflight：`#npd-ready-summary` / `#npd-ready-blocking` /
  `#npd-ready-warnings` / `#npd-ready-unsupported` — lines 11189 / 11199 /
  11203 / 11207（`#npd-ready-summary` initial badge text = `keep-draft`）

`#new-post-draft` block 上方含明顯之 read-only banner：

> 🔒 Authoring helper — no fs write · no fetch · no Apply · copy / download
> only. Repo 寫入仍只由 VS Code / terminal-only CLI 進行。

Manual import flow 之 `section-tag` 標示為 `no repo write`；Ready preflight
之 `section-tag` 標示為 `read-only hint`。

---

## 6. Observed filename / target path / markdown output

以 §4 dummy data 呼叫 server-side helper 結果（client mirror smoke 已鎖於
`check:admin-markdown-export` 52 case）：

| Helper                        | Observed value                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| `buildPostFilename(input)`    | `2026-06-27-admin-smoke-test-draft.md`                                               |
| `buildTargetFolder(input)`    | `content/github/posts/`                                                              |
| `buildTargetPath(input)`      | `content/github/posts/2026-06-27-admin-smoke-test-draft.md`                          |
| `isExportReady(input).ok`     | `true`                                                                               |
| `isExportReady(input).missing`| `[]`                                                                                 |

→ 與 task 預期 (`2026-06-27-admin-smoke-test-draft.md` /
`content/github/posts/2026-06-27-admin-smoke-test-draft.md`) byte-identical。

`buildPostMarkdown(input)` 輸出（838 bytes）首段 frontmatter 內含以下兩行
（hardcoded，無條件分支）：

```
status: "draft"
draft: true
```

並**不**含 `status: "ready"` 任何形式。客戶端 mirror 於 rendered HTML 內亦以
完全相同的兩行硬編碼：

```
.cache/pages/admin/index.html (client-script range)
  lines.push('status: "draft"');
  lines.push('draft: true');
```

Tags 由 comma-separated string 解析為 `["admin", "smoke", "draft"]`，YAML
block list 形式輸出（與 `check:admin-markdown-export` smoke 5 / 6 / 38 一致）。

---

## 7. Ready preflight panel — observed behavior

對 §4 dummy data 呼叫 `analyzeReadyGap(input)`：

```
{
  "ok": false,
  "summary": "keep-draft",
  "blocking": [
    { "field": "cover",
      "label": "cover（封面圖；validator missing-cover）" }
  ],
  "warnings": [
    { "field": "searchDescription",
      "label": "searchDescription 空（建議補；不影響 baseline）" },
    { "field": "coverAlt",
      "label": "coverAlt 空（建議補；不影響 baseline）" }
  ],
  "unsupported": []
}
```

→ Admin 表單目前不收集 `cover` / `coverAlt` / `searchDescription`（per panel
之 read-only 註腳），所以 dummy data 雖然 title / slug / date / description /
category / tags 全部 OK，仍會落在 `keep-draft` summary（因 `cover` blocking）
+ 兩個 soft warnings。此行為與 `check:admin-markdown-export` smoke 44 / 45 /
51 鎖之語意一致：

- smoke 44 — `analyzeReadyGap missing cover → blocking includes cover`
- smoke 45 — `analyzeReadyGap empty searchDescription → soft warnings (not blocking)`
- smoke 51 — `analyzeReadyGap does not alter buildPostMarkdown output (status stays draft)`

`contentKind = "post"`（非 `book-review` / `download`）→ `unsupported = []`，
panel 之 "contentKind 提示" 區域維持「—」（per client mirror，smoke 46 / 47 / 52）。

---

## 8. No repo write path / no fetch / no ready option / no deploy

對 `src/views/admin/index.ejs` 與 rendered `.cache/pages/admin/index.html`
之 `#new-post-draft` 區段做 grep 結果（只匹配到註解；無 live function call）：

- `fetch(` / `XMLHttpRequest` / `sendBeacon` / `axios` — 無
- `writeFile` / `appendFile` — 無
- `.submit(` / `<form action=` — 無
- `location.assign` / `location.replace` — 無
- `status: "ready"` / ready option — 無；客戶端硬編碼 `status: "draft"`
- Apply button on `#new-post-draft` block — 無；只有 Copy / Download / Copy
  target path / Copy validation command（均為 clipboard / blob href）
- deploy / push gh-pages 觸發點 — 無

對 EJS source 額外 grep 上方註解區段（lines 1785–1801 / 1919–1931 /
1972–1985）明確記載：

- `純 client-side：無 fetch / XHR / fs write / form submit / Apply / safeWrite caller / middleware ping`
- `🔒 Authoring helper — no fs write · no fetch · no Apply · copy / download only.`
- `本區塊只顯示路徑與指令給 Dean 手動操作；Admin 不寫入 content/、不觸發 build、不 deploy。`
- `Admin 不新增 ready option、不切 export 的 status、不寫入 content/`

對 rendered HTML 之 client-script range 額外做廣譜寫入指紋掃描：唯二 match
均為 explicit 「No fs / fetch / write path」 與 「execCommand fallback via
temporary textarea (no fs / fetch)」之防禦註解。無 live IO。

---

## 9. Validations result

| Command                                          | Expected   | Observed   |
| ------------------------------------------------ | ---------- | ---------- |
| `npm run check:admin-markdown-export`            | 52 / 52    | **52 / 52 PASS** |
| `npm run validate:content`                       | 0 / 134 / 106 | **0 / 134 / 106** |
| `node src/scripts/check-page-type-validator.js`  | 110 / 0    | **110 passed, 0 failed** |
| `npm run build:github`                           | PASS       | **PASS**（done in 280ms） |
| `npm run build:blogger`                          | PASS       | **PASS**（done in 202ms） |

無 baseline regression。`build:github` 之最終輸出 `wrote .cache/data/build-manifest.json`；
`build:blogger` 之最終輸出 `wrote dist-blogger/build-manifest.json`。二者皆寫入
gitignored 路徑，working tree 維持 clean。

---

## 10. Limitations

1. **無真實 browser DOM 互動。** 本環境（Windows / Claude Code CLI）未啟動 dev
   server / Vite preview / Playwright；因此「實際點 Copy markdown 把字串放入
   系統剪貼簿」「實際點 Download 觸發瀏覽器存檔」「實際在 Chrome / Edge 渲染
   並透過 dev tools 觀察 `recompute()` event listener fire」等行為**未** 由本
   Session 親自執行；改以「client mirror 完全 mirror 於 server-side helper
   並由 52-case smoke 鎖兩端對齊」為等效驗證。實際 clipboard / download
   行為需 Dean 在 `npm run dev` 啟動後手動驗證；該驗證屬 K1 / Q-future phase，
   不在本 Session scope。
2. **未驗證 `npd-category` `<select>` 內 site mismatch live filtering 行為。**
   `npd-category` 之 `data-site` 屬性在 EJS 中存在；client script 是否依
   `npd-site` 變動而隱藏 cross-site 選項，本 Session 未在 browser DOM 觀察；
   client mirror 之 helper 不檢查 site mismatch（per source line 1875 註腳
   `draft 不檢查 site mismatch`），與 `buildPostMarkdown` 行為一致。
3. **未啟用 dev server，故無 HTTP fetch trace。** 「`#new-post-draft` 不發出
   任何 fetch」之證據完全來自 rendered HTML 之靜態 grep；若 Dean 想要 HTTP
   level 驗證可在 `npm run dev` 啟動後開 dev tools Network 面板觀察。
4. **僅 1 組 dummy data。** 本 Session 對 dummy data 只跑單一 happy path
   `site: github / contentKind: post`；其他組合（`site: blogger`、
   `contentKind: book-review / download`、long title / long description、
   invalid slug、invalid date、tag dedupe、tag whitespace trim、unicode、
   default body fallback）已由 `check:admin-markdown-export` 52 case 覆蓋，
   本 Session 不再重跑等效用例。
5. **未測 Phase 2+ Admin 擴張行為。** R2 overview / R3 健康 legend / R4
   categories·tags 切分 / R5 cosmetic / SEO Dry-run edit / filter chip /
   warning badge / per-post prescription / write path / ready option /
   loader aggregation migration — 均依 §3a discipline 不主動推進。

---

## 11. Touched files

- `docs/20260627-admin-markdown-export-browser-smoke-evidence.md`（本文件，新增）

無 source 變更。無 `CLAUDE.md` 變更。無 `package.json` / lockfile 變更。
無 dependency 變更。
