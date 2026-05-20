---
title: "[validation-fixture] blogger valid: index"
slug: "test-blogger-seo-indexing-valid-index"
status: "ready"
draft: false
date: "2026-05-20"
description: "Phase 20260520-seo-2-f fixture：Blogger 端 seo.indexing 合法值 'index' 不應觸發 warning。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags:
  - "book"
cover: "/images/placeholders/cover.png"
seo:
  indexing: "index"
---

本 fixture 驗證 Blogger 端 `seo.indexing` 合法值 `"index"` **不觸發** `validate-content.js` 之 `invalid-seo-indexing` warning（per Phase 20260520-seo-2 之 `VALID_SEO_INDEXING` set）。

確認 validate-content 對 `content/validation-fixtures/blogger/posts/` 之掃描範圍與 GitHub fixtures 一致；SEO-2-b/c/d/e 之 validator rules 不因 fixture site 不同而行為改變。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
