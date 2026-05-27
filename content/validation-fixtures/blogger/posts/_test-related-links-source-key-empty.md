---
title: "[validation-fixture] relatedLinks sourceKey empty"
slug: "test-related-links-source-key-empty"
status: "ready"
draft: false
date: "2026-05-27"
description: "Phase 20260527-pm-14 fixture：故意觸發 related-links-source-key-empty warning。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
relatedLinks:
  - kind: "external"
    platform: "Youtube"
    sourceKey: ""
    title: "sourceKey 為 empty string"
    url: "https://example.com/post-empty"
---

本 fixture 故意設 `sourceKey: ""`（YAML empty string → JS empty string → `trim() === ''`）→ 觸發 `related-links-source-key-empty`。

`kind` 為合法 `external`、`url` 為非空字串、`title` / `platform` 皆完整 → 不觸發既有 4 條 `related-links-*` warning。

互斥確認（per Phase 20260527-pm-14 step-7-d 設計）：sourceKey 為 empty string → 僅觸發 `empty`；不觸發 `invalid-type` / `not-found`。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
