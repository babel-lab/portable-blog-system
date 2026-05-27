---
title: "[validation-fixture] relatedLinks sourceKey not found"
slug: "test-related-links-source-key-not-found"
status: "ready"
draft: false
date: "2026-05-27"
description: "Phase 20260527-am-8 fixture：故意觸發 related-links-source-key-not-found warning。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
relatedLinks:
  - kind: "external"
    platform: "Youtube"
    sourceKey: "not-a-real-source"
    title: "sourceKey 不在 link-sources.json 中"
    url: "https://example.com/post-not-real-source"
---

本 fixture 故意設 `sourceKey: "not-a-real-source"`（不在 `content/settings/link-sources.json` 之 active sources 之中）→ 觸發 `related-links-source-key-not-found`。

`kind` 為合法 `external`、`url` 為非空字串、`title` / `platform` 皆完整 → 不觸發既有 4 條 related-links warning（`related-links-not-array` / `related-links-entry-missing-kind` / `related-links-entry-kind-invalid` / `related-links-entry-missing-url`）。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
