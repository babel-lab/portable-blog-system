---
title: "[validation-fixture] relatedLinks entry missing url"
slug: "test-related-links-entry-missing-url"
status: "ready"
draft: false
date: "2026-05-14"
description: "Phase 9-g-c-c fixture：故意觸發 related-links-entry-missing-url warning。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
relatedLinks:
  - kind: "external"
    platform: "Youtube"
    title: "缺 url 之 entry"
    url: ""
---

本 fixture 故意把 `url` 設為空字串 → 觸發 `related-links-entry-missing-url`。

`kind` 為合法 `external` → 不觸發 `related-links-entry-missing-kind` / `related-links-entry-kind-invalid`。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
