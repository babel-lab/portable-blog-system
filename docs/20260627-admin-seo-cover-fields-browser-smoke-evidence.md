# 20260627 — Admin SEO / Cover richer fields browser/manual smoke evidence

本文件記錄 Phase 1 Admin UI / Markdown draft export MVP 之 **SEO / Cover richer
fields**（`searchDescription` / `cover` / `coverAlt`）browser/manual smoke
驗收。本 Session 不改 source、不改 Admin UI、不新增 ready option、不啟用任何
repo write path；僅以 build:github 重新 render Admin page、靜態掃 rendered HTML
與 client-side script、用 Node 跑 server-side helper 對齊 client 預期，並跑全套
validations。

延續 `docs/20260627-admin-markdown-export-browser-smoke-evidence.md` 之 method C，
本輪聚焦在 commit `54233df`（`feat(admin): add seo cover draft fields`）所新增之
三個 optional 欄位是否：

1. 在 rendered Admin HTML 內以正確 DOM IDs 出現；
2. 透過 client recompute pipeline（mirror 於 `admin-markdown-export.js` 之 inline
   script）正確 trim / escape 並寫入 markdown preview frontmatter；
3. 使 `analyzeReadyGap()` 對應 cover blocker / coverAlt warning / searchDescription
   warning 在 Ready preflight panel 中 clear；
4. 維持 `status:"draft"` + `draft:true`、無 ready option、無 fetch / XHR / repo
   write path、無 Apply button、無 deploy、無 Blogger live mutation。

---

## 1. Baseline

驗收於本 phase 啟動前執行：

```
pwd                                   # /d/github/blog-new/portable-blog-system
git status --short                    # （空 — working tree clean）
git rev-parse --abbrev-ref HEAD       # main
git rev-parse HEAD                    # 54233dfb57996856b4c8296f6ff8e10232da289d
git log -1 --oneline                  # 54233df feat(admin): add seo cover draft fields
git rev-list --left-right --count origin/main...HEAD   # 0   0
ls -la .git/index.lock                # absent
```

- branch = `main`
- HEAD short = `54233df`
- HEAD full = `54233dfb57996856b4c8296f6ff8e10232da289d`
- subject = `feat(admin): add seo cover draft fields`
- working tree clean
- ahead / behind = 0 / 0
- `.git/index.lock` absent

---

## 2. Smoke method

採用 method **C**（靜態 + helper simulation，無 dev server、無 browser
automation、無新增 dependency）：

1. 確認 `.cache/pages/admin/index.html` 為最新 frozen baseline 之 build 產物
   （`stat` mtime = 2026-06-27 13:12，落後 commit 後）；隨後再跑 `npm run
   build:github` 重新 render，確認結果不變。
2. 用 `Grep` 對 rendered HTML 掃 SEO / Cover fields 之 DOM IDs（`npd-search-description`
   / `npd-cover` / `npd-cover-alt`）+ 既有 `#new-post-draft` 區塊之 14 個輸入 /
   按鈕 / 預覽 IDs，確認元素存在於最終 rendered 輸出（不僅止於 EJS source）。
3. 用 `Node --input-type=module` import `src/scripts/admin-markdown-export.js`，
   以 §4 dummy data 跑 `buildPostFilename` / `buildTargetFolder` /
   `buildTargetPath` / `isExportReady` / `analyzeReadyGap` /
   `buildPostMarkdown`，並斷言 7 條 assertion（§6.3）。
4. 用 `Read` 對比 `src/views/admin/index.ejs` 內 client-side `buildMarkdown()`
   mirror（lines 3636 – 3640）與 `admin-markdown-export.js`（lines 312 – 316）
   之 `searchDescription` / `cover` / `coverAlt` 寫入順序與 `yamlEscapeScalar`
   呼叫；確認 client / server 對齊（regression 由 `check:admin-markdown-export`
   62 case 鎖死）。
5. 跑全套 validations（§8）。
6. `git status --short` 確認 build 未在 working tree 留下 diff。

**未啟動** dev server / preview。**未啟動** Playwright / browser automation。
**未** 新增 npm / runtime dependency。**未** 寫入 `content/` / `dist/` /
`dist-blogger/` 任何受 git 追蹤之檔案。

---

## 3. Commands run

```
# baseline verify
pwd
git status --short
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
git log -1 --oneline
git rev-list --left-right --count origin/main...HEAD
ls -la .git/index.lock

# DOM ID scan against rendered admin page
stat .cache/pages/admin/index.html
# Grep "id=\"npd-(search-description|cover|cover-alt|...)\"" .cache/pages/admin/index.html

# server-side helper simulation (Node ESM dynamic import; no temp files in repo)
node /tmp/admin-seo-cover-smoke.mjs

# validations
npm run check:admin-markdown-export
npm run validate:content
node src/scripts/check-page-type-validator.js
npm run build:github
npm run build:blogger
```

`/tmp/admin-seo-cover-smoke.mjs` 為 OS 暫存區之 ad-hoc 腳本（不在 repo、不會被
git 追蹤、不寫任何 repo 內檔案）；僅 import production helper 並 `console.log`。

---

## 4. Test data

純 local dummy data。**不**寫入 `content/`、**不**碰 Blogger live、**不**寫入
任何 Drive / Form 後台。

```yaml
site: github
contentKind: post
primaryPlatform: github
title: "Admin SEO Cover Smoke Draft"
slug: "admin-seo-cover-smoke-draft"
date: "2026-06-27"
category: "tech-note"
tags: "admin, smoke, seo"
description: "This is a local admin smoke test draft for validating SEO and cover fields."
searchDescription: "SEO smoke test description for validating Admin Markdown export preview."
cover: "/images/placeholders/cover-placeholder.svg"
coverAlt: "Placeholder cover image for Admin SEO cover smoke draft"
body: |
  ## Smoke test

  This draft validates SEO and cover field export only.
```

預期 filename：`2026-06-27-admin-seo-cover-smoke-draft.md`
預期 target path：`content/github/posts/2026-06-27-admin-seo-cover-smoke-draft.md`

---

## 5. Observed new SEO / Cover fields in rendered Admin HTML

`.cache/pages/admin/index.html`（882 359 bytes；mtime 2026-06-27 13:12）內掃出
三個新欄位 element：

| 欄位 | DOM ID | element | line |
| --- | --- | --- | --- |
| searchDescription | `npd-search-description` | `<textarea rows="2" maxlength="160">` | 11125 |
| cover | `npd-cover` | `<input type="text" maxlength="500">` | 11132 |
| coverAlt | `npd-cover-alt` | `<input type="text" maxlength="200">` | 11139 |

三欄皆位於 `#new-post-draft` 區塊內、皆為 **optional** 標籤、且 placeholder
明示「空白時 ready preflight 會 blocking / warning」。

既有 14 個 DOM IDs（`npd-filename` / `npd-output` / `npd-copy` / `npd-download`
/ `npd-target-folder` / `npd-target-path` / `npd-validation-command` /
`npd-copy-path` / `npd-copy-cmd` / `npd-ready-summary` / etc.）皆仍存在；本輪
未改 source。

---

## 6. Observed helper output (Node simulation)

### 6.1 filename / target path / export readiness

```
buildPostFilename(input)       → "2026-06-27-admin-seo-cover-smoke-draft.md"
buildTargetFolder(input)       → "content/github/posts/"
buildTargetPath(input)         → "content/github/posts/2026-06-27-admin-seo-cover-smoke-draft.md"
isExportReady(input)           → { ok: true, missing: [] }
```

`isExportReady` 維持原語意（gate = title + slug + date）；SEO / Cover fields
**不**進入 export gate（與 §3 smoke method 4 一致）。

### 6.2 Ready preflight panel 行為（cover blocker / warnings clear）

**Case A — 三欄全填**（§4 dummy data）：

```
{
  "ok": true,
  "blocking": [],
  "warnings": [],
  "unsupported": [],
  "summary": "ready-candidate"
}
```

→ Ready preflight summary badge 應由 `keep-draft` 切到 `ready-candidate`；
cover blocker / coverAlt warning / searchDescription warning 三條皆 clear。

**Case B — 三欄全空**（同 input 之 `searchDescription` / `cover` / `coverAlt`
覆寫為 `""`）：

```
{
  "ok": false,
  "blocking": [
    { "field": "cover", "label": "cover（封面圖；validator missing-cover）" }
  ],
  "warnings": [
    { "field": "searchDescription", "label": "searchDescription 空（建議補；不影響 baseline）" },
    { "field": "coverAlt",          "label": "coverAlt 空（建議補；不影響 baseline）" }
  ],
  "unsupported": [],
  "summary": "keep-draft"
}
```

→ cover 進 blocking、searchDescription / coverAlt 進 warnings，summary 為
`keep-draft`，UI 對應之 badge 樣式仍 `b-draft`。

兩 case 的 `summary` 差異證實 panel 對三欄之即時反應符合 `docs/20260627-
admin-ready-mode-validator-impact-preanalysis.md` §5 規格。

### 6.3 Markdown preview frontmatter

```yaml
---
id: "20260627-admin-seo-cover-smoke-draft"
site: "github"
contentKind: "post"
primaryPlatform: "github"

title: "Admin SEO Cover Smoke Draft"
titleEn: ""
slug: "admin-seo-cover-smoke-draft"

date: "2026-06-27"
updated: "2026-06-27"
author: "Dean"

category: "tech-note"
tags:
  - "admin"
  - "smoke"
  - "seo"

description: "This is a local admin smoke test draft for validating SEO and cover fields."
searchDescription: "SEO smoke test description for validating Admin Markdown export preview."

cover: "/images/placeholders/cover-placeholder.svg"
coverAlt: "Placeholder cover image for Admin SEO cover smoke draft"

status: "draft"
draft: true

canonical: "auto"

publishTargets:
  github:
    enabled: true
    mode: "full"
  blogger:
    enabled: false
    mode: "summary"

blocks:
  toc: false
  adsenseTop: true
  adsenseMiddle: false
  adsenseBottom: true
  hashtags: true
  socialFollow: true
  relatedPosts: true
  sidebar: true
---

## Smoke test

This draft validates SEO and cover field export only.
```

7 條 assertion 皆 PASS：

```
PASS — has searchDescription line
PASS — has cover line
PASS — has coverAlt line
PASS — has status:draft
PASS — has draft:true
PASS — no status:ready
PASS — no status:published
```

---

## 7. No repo write path / no fetch write / no ready option / no deploy

本輪掃靜態檔與 Node helper 行為，逐項負面斷言：

| 風險 | 觀察結果 |
| --- | --- |
| 任何 `fetch` / `XHR` / `sendBeacon` 寫入 | ❌ 不存在（client mirror 為 string assembly + clipboard / download，無 network call） |
| `Apply` / `Save` 按鈕（write path UI） | ❌ 不存在（panel 永久 disabled，per `docs/20260619-admin-k7-copy-buttons-implementation.md` lock） |
| ready option（dropdown / radio / toggle） | ❌ 不存在；`buildPostMarkdown()` 寫死 `status:"draft"` + `draft:true`（admin-markdown-export.js lines 318 – 319） |
| 直接寫入 `content/github/posts/*.md` | ❌ 無；Manual import flow 區塊僅顯示 target path 字串 + clipboard copy |
| 直接寫入 `content/blogger/posts/*.md` | ❌ 無；同上 |
| Blogger live 後台動作 | ❌ 無；本輪未碰 Blogger、未碰 Google Form / Drive / GA4 backend / AdSense / Search Console |
| Deploy | ❌ 無；`build:github` / `build:blogger` 僅產 `.cache/` 與 `dist-blogger/`，**未** push gh-pages |
| 新增 dependency | ❌ 無；`package.json` / `package-lock.json` 未動 |
| 新增 / 修改 source / Admin UI | ❌ 無；本輪 touched files 僅本 evidence doc |
| 新增 contentKind picker / write CLI 啟用 | ❌ 無；本 phase 不啟動 |

---

## 8. Validations

| 指令 | 結果 |
| --- | --- |
| `npm run check:admin-markdown-export` | **62 / 62 PASS** |
| `npm run validate:content` | **0 error / 134 warning / 106 post** |
| `node src/scripts/check-page-type-validator.js` | **110 / 0** |
| `npm run build:github` | **PASS**（done in 168 ms；wrote `.cache/pages/admin/index.html`） |
| `npm run build:blogger` | **PASS**（done in 116 ms；6 ready posts + 4 index pages） |

對齊 CLAUDE.md §3a snapshot；無 regression。

---

## 9. Limitations

1. 本輪未啟動實體 dev server / browser，**未** 直接點 `Copy markdown` /
   `Download .md` / `Copy target path` / `Copy validation command` 按鈕，亦
   **未** 透過 keystroke 觸發 `recompute()`。等同行為由 `check:admin-markdown-export`
   62 case + `Read` 對比 client mirror 鎖死；`docs/20260627-admin-markdown-
   export-browser-smoke-evidence.md` 已就 `#new-post-draft` 整體 browser-PASS。
2. 本輪未驗證 clipboard 實際寫入（OS clipboard API 在 CLI 無法觀察）；client
   mirror 行為由 K7 commit + `docs/20260619-admin-k7-copy-buttons-implementation.md`
   browser-PASS 鎖死。
3. 本輪未驗證 `download` `<a>` 點擊後 browser 之 file save dialog（同樣需實
   browser）；K7 / K8 / K9 之 dual-accepted ledger 已覆蓋。
4. `searchDescription` / `cover` / `coverAlt` 之 YAML escape 在 §6.3 預覽下
   為簡單字串；含特殊字元（`\` / `"` / 換行）之 escape 由
   `check:admin-markdown-export` case 57 鎖死，本輪未額外 fork。
5. Ready preflight panel 之 `unsupported` 路徑（`book-review` / `download`）
   未在本輪 smoke 觸發；該行為由 `check:admin-markdown-export` case 46 / 47 /
   52 鎖死。

---

## 10. Touched files / next-step constraints

本輪 touched files = **僅本檔**：

- `docs/20260627-admin-seo-cover-fields-browser-smoke-evidence.md`（新增）

**未** 改 source / Admin UI / `CLAUDE.md` / `package.json` / lockfile /
`content/` / `dist/` / `dist-blogger/` / `.cache/`（`.cache/` 由 `build:github`
覆寫但內容與既有 frozen baseline 一致，**未** git 追蹤）。

Next-step constraints（per CLAUDE.md §3a Admin idle-freeze）：

- 不主動推 ready option / repo write path / contentKind picker / R2 overview /
  R3 健康 legend / loader aggregation migration。
- 任一推進均須獨立 phase + user explicit approval。

---

## 11. References

- `docs/20260627-admin-markdown-export-browser-smoke-evidence.md`（method C 原型
  + `#new-post-draft` 基礎 DOM scan / Node helper simulation）
- `docs/20260627-admin-markdown-draft-export-implementation-a.md`（buildPostMarkdown
  原始 landing；status:"draft" + draft:true 寫死）
- `docs/20260627-admin-markdown-import-checklist-slice2-a.md`（target folder /
  target path / Copy target path / Copy validation command 之 isExportReady 共
  用 source of truth）
- `docs/20260627-admin-ready-mode-validator-impact-preanalysis.md`（Ready
  preflight panel 規格；本輪 §6.2 行為對齊）
- `src/scripts/admin-markdown-export.js`（server-side helper；本輪 §6 直接 import）
- `src/scripts/check-admin-markdown-export.js`（62 case regression lock；本輪
  §8 跑過 PASS）
- `src/views/admin/index.ejs`（client mirror；lines 3636 – 3640 SEO / Cover 寫
  入順序對應 helper lines 312 – 316）
