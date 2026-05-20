---
title: "[validation-fixture] blogger invalid: case Index"
slug: "test-blogger-seo-indexing-invalid-case-index"
status: "ready"
draft: false
date: "2026-05-20"
description: "Phase 20260520-seo-2-f fixture：Blogger 端 seo.indexing 'Index'（大小寫不符），應觸發 1 個 invalid-seo-indexing warning。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags:
  - "book"
cover: "/images/placeholders/cover.png"
seo:
  indexing: "Index"
---

本 fixture 驗證 Blogger 端 case-sensitive 比對：`"Index"`（首字母大寫，合法值應為全小寫 `"index"`）觸發 `invalid-seo-indexing` warning（與 GitHub 端 `_test-seo-indexing-invalid-case-index.md` 為 cross-site pair）。

預期 validate 輸出：
- 1 個 `[WARNING] invalid-seo-indexing: Index`

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描。
