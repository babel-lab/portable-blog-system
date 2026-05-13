---
title: "[validation-fixture] book issue without magazine mediaType"
slug: "test-book-issue-without-magazine"
status: "ready"
draft: false
date: "2026-05-12"
description: "Phase 9-e-d-d-b fixture：故意觸發 book-issue-without-magazine-mediatype warning。"
contentKind: "book-review"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
book:
  issue: "2026 年 5 月號"
---

本 fixture 故意設計 book.issue 非空但未宣告 mediaType（effective="book"）→ 觸發 `book-issue-without-magazine-mediatype`。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
