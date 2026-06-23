---
title: "[validation-fixture] gated_download + includeInListings true"
slug: "test-page-type-gated-download-in-listings"
status: "ready"
date: "2026-06-23"
contentKind: "page"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp2 fixture：pageType=gated_download 且 includeInListings=true → 觸發 page-gated-download-in-listings。"
pageType: "gated_download"
includeInListings: true
---

本 fixture 故意設 `pageType: gated_download` + `includeInListings: true`（閘門下載頁不應入站內列表）。

**預期 SP-2 validator 行為**：觸發 `page-gated-download-in-listings`；warning-only。無 `seo` block → 不觸發任何 noindex 正交組合。`includeInListings` 為 boolean → 不觸發 invalid-type。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
