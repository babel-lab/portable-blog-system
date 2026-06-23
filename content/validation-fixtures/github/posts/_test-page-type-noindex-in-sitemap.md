---
title: "[validation-fixture] noindex + includeInSitemap true"
slug: "test-page-type-noindex-in-sitemap"
status: "ready"
date: "2026-06-23"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp2 fixture：seo.indexing=noindex-follow 但 includeInSitemap=true → 觸發 page-noindex-in-sitemap（正交危險組合）。"
includeInSitemap: true
seo:
  indexing: "noindex-follow"
---

本 fixture 故意組合 `seo.indexing: noindex-follow` 與 `includeInSitemap: true`——noindex 頁卻顯式要求入 sitemap，矛盾且危險。此規則與 pageType 是否存在無關（純正交）。

**預期 SP-2 validator 行為**：觸發 `page-noindex-in-sitemap`；warning-only。`includeInSitemap` 為 boolean → 不觸發 `page-include-flag-invalid-type`。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
