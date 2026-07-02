# Session-start dual repo baseline snapshot（2026-07-02 20:09）

## 1. Scope

本文件是 **2026-07-02 20:09 session-start read-only baseline snapshot**。

目的僅為記錄 source repo 與 deploy clone 於本 session 開頭之可信只讀狀態，作為未來 publish slice 前的起點證據。

- 本文件 **不代表**已 build / deploy / publish。
- 本輪執行過程 **無** `npm run build` / `build:github` / `build:blogger` / `preview` / dev server / `git push gh-pages` / Blogger 貼文 / GA4 / AdSense / Search Console / Google Drive 任何動作。
- 本輪執行過程 **無** `fetch` / `pull` / lock / dependency 動作。
- 本文件為 docs-only；為 commit 本文件所做之 `git add` / `git commit` / `git push origin main` 僅推送本文件本身。

## 2. Source repo baseline

只讀查證結果（source repo）：

```text
path: /d/github/blog-new/portable-blog-system
branch: main
HEAD = origin/main = 1dfe2810b7f7fb97bf286b89752efd8b8945e7c0
short: 1dfe281
subject: docs(publish): add github pages pre-publish checklist
working tree: clean
ahead/behind: 0/0
.git/index.lock: absent
```

C1 checklist 文件存在（於本文件 commit 之前為 HEAD @ `1dfe281` 之唯一 docs 變更）：

```text
docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md
size: 10629 bytes
mtime: Jul 2 17:28
```

`§6`–`§9` heading 已確認存在，各 heading 於檔案內之行號如下：

```text
L163  ## 6. Responsibility split（權責分工）
L177  ## 7. Stop conditions（遇到即停止，不猜測）
L188  ## 8. Next-step options（本輪不選、不啟動）
L198  ## 9. 本 phase 邊界（self-check）
```

## 3. Deploy clone baseline

只讀查證結果（deploy clone）：

```text
path: /d/github/blog-new/portable-blog-deploy
branch: gh-pages
HEAD = origin/gh-pages = d0f37ebce2d0a716d9b12f9a6e78fb1f14de7df7
short: d0f37eb
subject: deploy(github): refresh SEO meta for github-pages-build-preview-workflow
working tree: clean
ahead/behind: 0/0
.git/index.lock: absent
remote (fetch): https://github.com/babel-lab/portable-blog-system.git
remote (push):  https://github.com/babel-lab/portable-blog-system.git
```

頂層概況（`ls -la` 觀察，排除 `.` / `..`）：

```text
files:
  .nojekyll
  404.html
  index.html
  robots.txt
  sitemap.xml

dirs:
  .git/
  affiliate-disclosure/
  assets/
  categories/
  design-system/
  downloads/
  favicon/
  icons/
  images/
  posts/
  privacy/
  tags/
```

備註：頂層 **檔案** mtime 多為 `Jul 1 12:31`（對應上次 deploy 落地時間戳）；頂層 **資料夾** mtime `Jul 2 20:08` 為本輪目錄 `stat` 觀察造成，並非內容更動；deploy clone working tree 於本輪查證前後皆 clean，HEAD 未變、`origin/gh-pages` 未變、無新 commit、無 stash、無 index.lock。

## 4. Stop conditions result

本輪 stop conditions 逐項無觸發：

```text
source repo clean
deploy clone clean
both ahead/behind 0/0
both index.lock absent
deploy clone branch is gh-pages
no build/deploy/publish/dev server executed
no fetch/pull/push to gh-pages executed
no Blogger / GA4 / AdSense / Search Console / Google Drive interaction
no dependency / lockfile changes
no CLAUDE.md / MEMORY.md / memory/ / src/ / content/ / settings/ changes
```

## 5. Boundary

```text
This document is documentation-only.
It does not change runtime behavior.
It does not update CLAUDE.md.
It does not publish GitHub Pages.
It does not touch Blogger or Google-side integrations.
```

未來若基於本 baseline 進入任何 publish / deploy / repost / GA4 / AdSense / Blogger 相關 slice，須另開 phase + explicit approval，並須先重跑一次 `git status` / `rev-parse HEAD` / `rev-parse origin/*` / `.git/index.lock` 只讀 guard，不得直接沿用本 snapshot 之時點資料。
