---
title: "[validation-fixture] legacy top-level publishedUrl"
slug: "test-legacy-published-url"
status: "ready"
draft: false
date: "2026-05-18"
description: "Phase 8-h-c-pre-1 fixture：故意在 .md frontmatter 放 top-level publishedUrl 與 githubUrl；用以保護 Phase 8-h-d-4 退場批之 regression。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags:
  - "book"
cover: "/images/placeholders/cover.png"
publishedUrl: "https://example.com/blogger/legacy-published-url"
githubUrl: "https://example.com/github/legacy-published-url"
---

本 fixture 故意在 `.md` frontmatter 放 top-level legacy URL 欄位：

- `publishedUrl`（per Phase 8-a 已遷移至 `.publish.json` 之 `blogger.publishedUrl`）
- `githubUrl`（per Phase 8-a 已遷移至 `.publish.json` 之 `github.publishedUrl`）

**無對應 `.publish.json` sidecar**：因此 `resolve-placeholders.js` 之 step 1-2 找不到 publish-nested 值；走 step 3-4 legacy fallback。

對應 `docs/phase-8h-c-pre-plan.md` §3.2 位置 #14 + #16：

- **#14** `resolve-placeholders.js` line 91-94 `getBloggerPublishedUrl` step 3：`post.publishedUrl`（top-level frontmatter）→ 觸發
- **#16** `resolve-placeholders.js` line 116-119 `getGithubPublishedUrl` step 4：`post.githubUrl`（top-level alias）→ 觸發
- 同時對應位置 #15（`post.github.publishedUrl` nested step 3）— 本 fixture **不**設計觸發（需另一 fixture `post.github: { publishedUrl: "..." }`）

對 Phase 8-h-d-4（resolve-placeholders 4 處 URL fallback 退場）之 regression 用途：

- 退場前：本 fixture 之 placeholder 解析（`{blogger.publishedUrl}` / `{github.publishedUrl}` / `{githubUrl}`）走 legacy 分支並 resolve 為 `https://example.com/...`
- 退場後：本 fixture 之 placeholder 解析應 unresolved（無 sidecar + 無 legacy fallback）；validate 將觸發 placeholder-unresolved warning
- 行為差異可作為退場是否完整之驗證點

validate 階段預期 0 new warning：
- 無針對 top-level `publishedUrl` / `githubUrl` 之 deprecated frontmatter 規則
- `sidecar-frontmatter-overlap` 不觸發（無 `.publish.json` 存在）

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:*` 掃到。
