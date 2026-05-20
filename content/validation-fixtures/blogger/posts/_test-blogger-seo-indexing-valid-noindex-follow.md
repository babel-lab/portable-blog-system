---
title: "[validation-fixture] blogger valid: noindex-follow"
slug: "test-blogger-seo-indexing-valid-noindex-follow"
status: "ready"
draft: false
date: "2026-05-20"
description: "Phase 20260520-seo-2-f fixture：Blogger 端 seo.indexing 合法值 'noindex-follow' 不應觸發 warning。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags:
  - "book"
cover: "/images/placeholders/cover.png"
seo:
  indexing: "noindex-follow"
---

本 fixture 驗證 Blogger 端 `seo.indexing` 合法值 `"noindex-follow"` **不觸發** validator warning（與 GitHub 端 `_test-seo-indexing-valid-noindex-follow.md` 為 cross-site pair）。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描。
