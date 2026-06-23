---
title: "[validation-fixture] redirect_canonical valid"
slug: "test-page-type-redirect-canonical-valid"
status: "ready"
date: "2026-06-23"
contentKind: "page"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp2 fixture：pageType=redirect_canonical 且 canonical 為 explicit URL → SP-2 validator 應 0 觸發。"
pageType: "redirect_canonical"
canonical: "https://babel-lab.github.io/portable-blog-system/posts/some-canonical-target/"
includeInListings: false
includeInSitemap: false
seo:
  indexing: "noindex-follow"
---

本 fixture 代表正確標記之 redirect_canonical 頁：canonical 為 explicit https URL（非 'auto'）、不入列表 / 不入 sitemap、noindex-follow。

**預期 SP-2 validator 行為**：0 SP-2 warning（含不觸發 `page-redirect-canonical-missing-target`）。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
