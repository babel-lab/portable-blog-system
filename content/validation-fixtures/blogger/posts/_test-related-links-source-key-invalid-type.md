---
title: "[validation-fixture] relatedLinks sourceKey invalid type"
slug: "test-related-links-source-key-invalid-type"
status: "ready"
draft: false
date: "2026-05-27"
description: "Phase 20260527-pm-14 fixture：故意觸發 related-links-source-key-invalid-type warning。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
relatedLinks:
  - kind: "external"
    platform: "Youtube"
    sourceKey: 123
    title: "sourceKey 為 YAML number (非 string)"
    url: "https://example.com/post-invalid-type"
---

本 fixture 故意設 `sourceKey: 123`（YAML number → JS number → typeof !== 'string'）→ 觸發 `related-links-source-key-invalid-type`。

`kind` 為合法 `external`、`url` 為非空字串、`title` / `platform` 皆完整 → 不觸發既有 4 條 `related-links-*` warning（`related-links-not-array` / `related-links-entry-missing-kind` / `related-links-entry-kind-invalid` / `related-links-entry-missing-url`）。

互斥確認（per Phase 20260527-pm-14 step-7-d 設計）：sourceKey 為 number → 僅觸發 `invalid-type`；不觸發 `empty` / `not-found`。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
