---
title: "[validation-fixture] book volume invalid type"
slug: "test-book-volume-invalid-type"
status: "ready"
draft: false
date: "2026-05-12"
description: "Phase 9-e-d-d-b fixture：故意觸發 book-volume-invalid-type warning。"
contentKind: "book-review"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
book:
  volume: "1"
---

本 fixture 故意設計 book.volume 為字串 "1"（應為 integer / null）→ 觸發 `book-volume-invalid-type`。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
