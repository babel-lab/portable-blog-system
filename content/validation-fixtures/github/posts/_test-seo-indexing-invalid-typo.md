---
title: "[validation-fixture] seo.indexing invalid: typo"
slug: "test-seo-indexing-invalid-typo"
status: "ready"
date: "2026-05-20"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260520-seo-2-b fixture：seo.indexing 為 typo 字串 'no-index'，應觸發 1 個 invalid-seo-indexing warning。"
seo:
  indexing: "no-index"
---

本 fixture 故意將 `seo.indexing` 設為 typo 字串 `"no-index"`（合法值應為 `"index"` / `"noindex-follow"` / `"noindex-nofollow"`），以觸發 `validate-content.js` 之 `invalid-seo-indexing` warning（per Phase 20260520-seo-2 之 `VALID_SEO_INDEXING` set check）。

預期 validate 輸出：
- 1 個 `[WARNING] invalid-seo-indexing: no-index`

對應 SEO-2 precedence：
- 非法值不主動 fallback；build / sitemap 端對未匹配之值沿用 SEO-1 / default 行為（per docs/seo-indexing-rules.md §3）

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
