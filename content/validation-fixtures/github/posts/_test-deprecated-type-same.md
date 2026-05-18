---
title: "[validation-fixture] deprecated type + contentKind same"
slug: "test-deprecated-type-same"
status: "ready"
draft: false
date: "2026-05-18"
description: "Phase 8-h-c-pre-1 fixture：故意同時填 type 與 contentKind 為相同值；用以保護 Phase 8-h-c 退場批之 regression。"
type: "tech-note"
contentKind: "tech-note"
site: "github"
primaryPlatform: "github"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
---

本 fixture 同時填 `type: "tech-note"` 與 `contentKind: "tech-note"`（**同值**）。

驗證觸發 `frontmatter-uses-deprecated-type` warning（`src/scripts/validate-content.js` line 326-333；條件：`post.type !== undefined && post.contentKind === post.type`）。

對應 `docs/phase-8h-c-pre-plan.md` §3.2 位置 #1。

對 Phase 8-h-c（移除 `frontmatter-uses-deprecated-type` warning rule）之 regression 用途：

- 退場前：本 fixture 觸發此 warning（baseline +1）
- 退場後：本 fixture 不再觸發此 warning（baseline -1；屬退場批之**預期變動**，非 regression）
- 若退場後 baseline 仍有此 warning 命中，代表退場不完整 → regression alert

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:*` 掃到。
