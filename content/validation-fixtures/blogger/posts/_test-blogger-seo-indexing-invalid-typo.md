---
title: "[validation-fixture] blogger invalid: typo no-index"
slug: "test-blogger-seo-indexing-invalid-typo"
status: "ready"
draft: false
date: "2026-05-20"
description: "Phase 20260520-seo-2-f fixture：Blogger 端 seo.indexing typo 'no-index'，應觸發 1 個 invalid-seo-indexing warning。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags:
  - "book"
cover: "/images/placeholders/cover.png"
seo:
  indexing: "no-index"
---

本 fixture 驗證 Blogger 端 typo 字串 `"no-index"` 觸發 `invalid-seo-indexing` warning（與 GitHub 端 `_test-seo-indexing-invalid-typo.md` 為 cross-site pair）。

預期 validate 輸出：
- 1 個 `[WARNING] invalid-seo-indexing: no-index`

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描。
