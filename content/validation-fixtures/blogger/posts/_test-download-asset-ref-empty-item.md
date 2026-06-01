---
title: "[validation-fixture] download assetRefs item empty"
slug: "test-download-asset-ref-empty-item"
status: "ready"
draft: false
date: "2026-06-01"
description: "Phase 20260601-night-9 Option 6 fixture：故意觸發 download-asset-ref-empty warning（empty string item case）。"
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
    - ""
---

本 fixture 故意設計 download.assetRefs[0] 為 empty string → 觸發 `download-asset-ref-empty`。

assetRefs 本身為 array，避免觸發 download-asset-refs-invalid-type；item 為 string 通過型別檢查後 trim 為空，故走 empty 分支，避免觸發 download-asset-ref-invalid-type（B1/B2 互斥）。

fileUrl + seo.indexing 設定避免同時觸發 D1 / D2 / D3 / S；本 fixture 預期只觸發單一 Option 6 warning。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
