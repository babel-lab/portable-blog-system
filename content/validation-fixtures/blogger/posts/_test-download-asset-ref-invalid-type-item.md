---
title: "[validation-fixture] download assetRefs item invalid type"
slug: "test-download-asset-ref-invalid-type-item"
status: "ready"
draft: false
date: "2026-06-01"
description: "Phase 20260601-night-9 Option 6 fixture：故意觸發 download-asset-ref-invalid-type warning（item 非 string case）。"
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
  fileUrl: "https://example.com/placeholder.pdf"
  assetRefs:
    - 12345
---

本 fixture 故意設計 download.assetRefs[0] 為 number（應為 string）→ 觸發 `download-asset-ref-invalid-type`。

assetRefs 本身為 array，避免觸發 download-asset-refs-invalid-type；item 非 string 不進 trim 檢查，避免觸發 download-asset-ref-empty。

fileUrl + seo.indexing 設定避免同時觸發 D1 / D2 / D3 / S；本 fixture 預期只觸發單一 Option 6 warning。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
