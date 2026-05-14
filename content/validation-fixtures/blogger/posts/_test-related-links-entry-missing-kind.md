---
title: "[validation-fixture] relatedLinks entry missing kind"
slug: "test-related-links-entry-missing-kind"
status: "ready"
draft: false
date: "2026-05-14"
description: "Phase 9-g-c-c fixture：故意觸發 related-links-entry-missing-kind warning。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
relatedLinks:
  - platform: "blogger"
    title: "缺 kind 之 entry"
    url: "https://example.com/post-a"
---

本 fixture 故意省略 entry 之 `kind` 欄位 → 觸發 `related-links-entry-missing-kind`。

`url` 為非空字串 → 不觸發 `related-links-entry-missing-url`。
`platform` / `title` 已填 → 與本批 4 條 critical 規則無關（platform / title 之必填檢查屬 Phase 9-g-c-e 或更晚之候選）。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
