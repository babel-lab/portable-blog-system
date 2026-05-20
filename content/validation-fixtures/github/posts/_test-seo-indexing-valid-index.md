---
title: "[validation-fixture] seo.indexing valid: index"
slug: "test-seo-indexing-valid-index"
status: "ready"
date: "2026-05-20"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260520-seo-2-b fixture：seo.indexing 合法值 'index' 不應觸發 invalid-seo-indexing warning。"
seo:
  indexing: "index"
---

本 fixture 驗證 `seo.indexing` 合法值 `"index"` **不觸發** `validate-content.js` 之 `invalid-seo-indexing` warning（per Phase 20260520-seo-2 之 `VALID_SEO_INDEXING` set + validate rule）。

對應 SEO-2 precedence path（per docs/seo-indexing-rules.md §3）：
- `post.seo.indexing === 'index'` → robots `index, follow` + sitemap include

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
