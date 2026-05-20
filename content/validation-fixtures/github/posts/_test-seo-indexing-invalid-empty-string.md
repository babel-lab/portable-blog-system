---
title: "[validation-fixture] seo.indexing invalid: empty string"
slug: "test-seo-indexing-invalid-empty-string"
status: "ready"
date: "2026-05-20"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260520-seo-2-c fixture：seo.indexing 為空字串 \"\"，應觸發 1 個 invalid-seo-indexing warning。"
seo:
  indexing: ""
---

本 fixture 故意將 `seo.indexing` 設為空字串 `""`（typeof 為 string 但**不在** `VALID_SEO_INDEXING` set 之 3 個合法值中），以觸發 `validate-content.js` 之 `invalid-seo-indexing` warning。

預期 validate 輸出：
- 1 個 `[WARNING] invalid-seo-indexing: ` (value 為空字串)

對應 SEO-2 precedence（per docs/seo-indexing-rules.md §3）：
- 非法值不主動 fallback；build / sitemap 端對未匹配之值沿用 SEO-1 / default 行為

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
