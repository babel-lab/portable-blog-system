---
title: "[validation-fixture] page-type invalid (unknown value)"
slug: "test-page-type-invalid-unknown"
status: "ready"
date: "2026-06-23"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp2 fixture：pageType 為未知列舉值 'blog_post' → 觸發 page-type-invalid warning。"
pageType: "blog_post"
---

本 fixture 故意設 `pageType: "blog_post"`（不在 `VALID_PAGE_TYPE` 列舉內）。

**預期 SP-2 validator 行為**：觸發 `page-type-invalid`（value `pageType="blog_post"`）；warning-only，不阻擋 build。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
