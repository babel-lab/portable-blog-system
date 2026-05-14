---
title: "[validation-fixture] relatedLinks entry kind invalid"
slug: "test-related-links-entry-kind-invalid"
status: "ready"
draft: false
date: "2026-05-14"
description: "Phase 9-g-c-c fixture：故意觸發 related-links-entry-kind-invalid warning。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
relatedLinks:
  - kind: "both"
    platform: "blogger"
    title: "kind 為非合法列舉值"
    url: "https://example.com/post-b"
---

本 fixture 故意設 `kind: "both"`（非 internal/external）→ 觸發 `related-links-entry-kind-invalid`。

missing-kind 與 kind-invalid 互斥：本 fixture 之 kind 為非空字串 → 不觸發 `related-links-entry-missing-kind`。
`url` 為非空字串 → 不觸發 `related-links-entry-missing-url`。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
