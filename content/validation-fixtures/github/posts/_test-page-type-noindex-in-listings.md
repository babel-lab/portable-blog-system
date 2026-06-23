---
title: "[validation-fixture] noindex + includeInListings true"
slug: "test-page-type-noindex-in-listings"
status: "ready"
date: "2026-06-23"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp2 fixture：seo.indexing=noindex-nofollow 但 includeInListings=true → 觸發 page-noindex-in-listings（正交危險組合）。"
includeInListings: true
seo:
  indexing: "noindex-nofollow"
---

本 fixture 故意組合 `seo.indexing: noindex-nofollow` 與 `includeInListings: true`——noindex 頁卻仍出現在站內列表，誤導使用者點入不被收錄的頁。此規則與 pageType 是否存在無關（純正交）。

**預期 SP-2 validator 行為**：觸發 `page-noindex-in-listings`；warning-only。`includeInListings` 為 boolean → 不觸發 `page-include-flag-invalid-type`。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
