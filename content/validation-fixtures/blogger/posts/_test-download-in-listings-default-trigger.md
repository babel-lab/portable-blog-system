---
title: "[validation-fixture] download listings default (trigger)"
slug: "test-download-in-listings-default-trigger"
status: "ready"
draft: false
date: "2026-06-24"
description: "Slice 1 fixture (20260624)：故意觸發 download-in-listings-default warning（contentKind=download 且 includeInListings 缺省）。"
contentKind: "download"
site: "blogger"
primaryPlatform: "blogger"
category: "download"
tags: ["book"]
cover: "/images/placeholders/cover.png"
seo:
  indexing: "noindex-follow"
download:
  enabled: true
  fileUrl: "https://example.com/download/slice1-fixture.zip"
---

本 fixture 故意設計：

- `contentKind: download`
- `seo.indexing: noindex-follow`（避免重複觸發 `download-content-should-be-noindex`）
- `download.fileUrl` 為合法 https URL（避免觸發 D1 / D2 / D3）
- frontmatter **不**包含 `includeInListings` 欄位

→ 預期僅觸發 `download-in-listings-default`（Slice 1；per `docs/20260624-download-listing-special-page-preflight-spec-lock.md` §2.D Slice 1）。

互斥 cascade 驗證（per `docs/20260530-download-validation-s1-s2-merge-decision.md` §F.1 + Slice 1 spec）：

- 不觸發 `download-content-should-be-noindex`：seo.indexing 已為 `noindex-follow`。
- 不觸發 `page-noindex-in-listings`：includeInListings 缺省（非顯式 true）。
- 不觸發 `page-include-flag-invalid-type`：includeInListings 為 undefined（非非法型別）。
- 不觸發 `invalid-seo-block` / `invalid-seo-indexing`：seo 為 plain object + indexing 為合法 enum。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
