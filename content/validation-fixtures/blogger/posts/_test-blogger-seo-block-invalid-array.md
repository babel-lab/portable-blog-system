---
title: "[validation-fixture] blogger seo-block: array"
slug: "test-blogger-seo-block-invalid-array"
status: "ready"
draft: false
date: "2026-05-20"
description: "Phase 20260520-seo-2-f fixture：Blogger 端 seo 為 array；應觸發 1 個 invalid-seo-block warning（per SEO-2-e hardening；含 Array.isArray() 攔截）。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags:
  - "book"
cover: "/images/placeholders/cover.png"
seo:
  - indexing: index
---

本 fixture 驗證 Blogger 端 `seo` 為 array `[{ indexing: "index" }]`（而非 plain object）觸發 `invalid-seo-block` warning（per Phase 20260520-seo-2-e hardening rule 之 `Array.isArray()` 嚴格 array 攔截；與 GitHub 端 `_test-seo-indexing-invalid-seo-array.md` 為 cross-site pair）。

預期 validate 輸出：
- 1 個 `[WARNING] invalid-seo-block: [object Object]`（`String([{...}])` → `'[object Object]'`）

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描。
