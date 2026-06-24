---
title: "[validation-fixture] gated_download listings default (trigger)"
slug: "test-gated-download-in-listings-default-trigger"
status: "ready"
draft: false
date: "2026-06-24"
description: "Slice 1 fixture (20260624)：故意觸發 download-in-listings-default warning（pageType=gated_download 且 includeInListings 缺省）。"
contentKind: "post"
pageType: "gated_download"
site: "blogger"
primaryPlatform: "blogger"
category: "tech-note"
tags: ["book"]
cover: "/images/placeholders/cover.png"
seo:
  indexing: "noindex-follow"
gatedDownload:
  mechanism: "google-form"
  formEmbedUrl: "https://example.com/forms/slice1-fixture"
  postSubmitResource: "drive-link"
---

本 fixture 故意設計：

- `contentKind: post`（避免雙觸發；只驗 pageType 路徑）
- `pageType: gated_download`
- `seo.indexing: noindex-follow`（避免觸發 `page-gated-download-indexed`）
- `gatedDownload` 只含合法三 key（避免觸發 `page-gated-download-suspicious-field`）
- frontmatter **不**包含 `includeInListings` 欄位

→ 預期僅觸發 `download-in-listings-default`（Slice 1；per `docs/20260624-download-listing-special-page-preflight-spec-lock.md` §2.D Slice 1）。

互斥 cascade 驗證（per Slice 1 spec + SP-2 既有 rules）：

- 不觸發 `page-gated-download-indexed`：seo.indexing 為 `noindex-follow`（非 `index`）。
- 不觸發 `page-gated-download-in-listings`：includeInListings 缺省（非顯式 true）。
- 不觸發 `page-gated-download-suspicious-field`：gatedDownload 只含 mechanism / formEmbedUrl / postSubmitResource。
- 不觸發 `page-include-flag-invalid-type`：includeInListings 為 undefined（非非法型別）。
- 不觸發 `download-content-should-be-noindex`：contentKind 為 `post`（非 `download`）。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
