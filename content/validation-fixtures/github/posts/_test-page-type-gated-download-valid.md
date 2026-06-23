---
title: "[validation-fixture] page-type gated_download (valid)"
slug: "test-page-type-gated-download-valid"
status: "ready"
date: "2026-06-23"
contentKind: "page"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp2 fixture：合法 gated_download 頁（noindex-follow + includeInListings false + includeInSitemap false）→ SP-2 validator 應 0 觸發。"
pageType: "gated_download"
includeInListings: false
includeInSitemap: false
includeInFeeds: false
gatedDownload:
  mechanism: "google-form"
  formEmbedUrl: "https://docs.google.com/forms/d/e/EXAMPLE/viewform"
  postSubmitResource: "drive-link"
platformPolicy:
  blogger:
    indexing: "noindex-nofollow"
    includeInListings: false
seo:
  indexing: "noindex-follow"
---

本 fixture 代表「正確標記」之 Google-Form 閘門下載頁（per preanalysis §2.8 / §6.2）：

- `pageType: gated_download`（合法列舉值）。
- `seo.indexing: noindex-follow`（noindex 家族）。
- `includeInListings: false` / `includeInSitemap: false`（顯式不入列表 / 不入 sitemap）→ **不**觸發正交危險組合。
- `gatedDownload` 為 plain object，且僅含 mechanism / formEmbedUrl / postSubmitResource（**無** secret / token / response / Drive folder ID）→ 不觸發 suspicious-field。
- `platformPolicy` 為 plain object → 不觸發 invalid-type。

**預期 SP-2 validator 行為**：0 SP-2 warning。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
