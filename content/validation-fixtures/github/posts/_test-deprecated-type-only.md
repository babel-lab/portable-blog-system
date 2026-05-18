---
title: "[validation-fixture] deprecated type only (no contentKind)"
slug: "test-deprecated-type-only"
status: "ready"
draft: false
date: "2026-05-18"
description: "Phase 8-h-c-pre-1 fixture：故意只填 legacy type，無 contentKind；用以保護 Phase 8-h-d-1 退場批之 regression。"
type: "tech-note"
site: "github"
primaryPlatform: "github"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
---

本 fixture 故意只填 legacy `type: "tech-note"`，**無** `contentKind`。

由於 `src/scripts/load-posts.js`（line 60-67）自動 fallback `data.contentKind ?? data.type`，validate 階段看到 `post.contentKind === post.type === "tech-note"`，觸發 `frontmatter-uses-deprecated-type` warning（`src/scripts/validate-content.js` line 326-333）。

對應 `docs/phase-8h-c-pre-plan.md` §3.2 位置 #1 + #2：

- **#1** `validate-content.js` `frontmatter-uses-deprecated-type` warning rule（**直接觸發**）
- **#2** `normalize-post-output.js` `deprecated-legacy-type-fallback`（**不直接觸發**；因 load-posts 已提前 fallback）

對 Phase 8-h-d-1（normalize contentKind/type fallback 退場）之 regression 用途：移除 normalize 之 fallback 後，本 fixture 仍應正常被 load-posts.js 處理（normalize 路徑改為直接走第一條件分支）；驗證退場後 contentKind 仍正確設為 "tech-note"。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
