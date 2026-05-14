---
title: "[validation-fixture] relatedLinks not array"
slug: "test-related-links-not-array"
status: "ready"
draft: false
date: "2026-05-14"
description: "Phase 9-g-c-c fixture：故意觸發 related-links-not-array warning。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
relatedLinks: "this-should-be-array"
---

本 fixture 故意把 `relatedLinks` 設為字串而非 array → 觸發 `related-links-not-array`。

當 `related-links-not-array` 觸發時，validate-content 跳過該欄位之 entry-level 檢查；故本 fixture 僅觸發 1 條 warning。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
