---
title: "[validation-fixture] book publishedYear invalid type"
slug: "test-book-published-year-invalid-type"
status: "ready"
draft: false
date: "2026-05-12"
description: "Phase 9-e-d-d-b fixture：故意觸發 book-published-year-invalid-type warning。"
contentKind: "book-review"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
book:
  publishedYear: "2019"
---

本 fixture 故意設計 book.publishedYear 為字串 "2019"（應為 integer / null）→ 觸發 `book-published-year-invalid-type`。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
