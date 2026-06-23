---
title: "[validation-fixture] gatedDownload suspicious field"
slug: "test-page-gated-download-suspicious-field"
status: "ready"
date: "2026-06-23"
contentKind: "page"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp2 fixture：gatedDownload 含 driveFolderId（disallowed key）→ 觸發 page-gated-download-suspicious-field（key-name heuristic，不檢查 value）。"
pageType: "gated_download"
includeInListings: false
includeInSitemap: false
gatedDownload:
  mechanism: "google-form"
  formEmbedUrl: "https://docs.google.com/forms/d/e/EXAMPLE/viewform"
  driveFolderId: "PLACEHOLDER-NOT-A-REAL-ID"
seo:
  indexing: "noindex-follow"
---

本 fixture 故意在 `gatedDownload` 放 `driveFolderId`——屬不該進 repo frontmatter 之私有權限 / 識別欄位（red-line）。偵測採 **key 名稱比對**（case-insensitive），**不**檢查 value 內容（避免 false positive；value-based private-URL 偵測屬 deferred）。

**預期 SP-2 validator 行為**：觸發 1 條 `page-gated-download-suspicious-field`（value 只列欄位名 `gatedDownload.driveFolderId ...`，**不** echo value）。合法欄位 mechanism / formEmbedUrl 不在 disallowed 名單 → 不誤判。其餘欄位（gated_download + noindex-follow + includeInListings false）皆正確 → 不觸發其他 SP-2 warning。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
