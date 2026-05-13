---
title: "[validation-fixture] book authors invalid role"
slug: "test-book-authors-invalid-role"
status: "ready"
draft: false
date: "2026-05-12"
description: "Phase 9-e-d-d-b fixture：故意觸發 book-authors-invalid-role warning。"
contentKind: "book-review"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
book:
  authors:
    - displayName: "James Clear"
      role: "writer"
---

本 fixture 故意設計 book.authors[0].role 為 "writer"（非合法列舉值）→ 觸發 `book-authors-invalid-role`。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
