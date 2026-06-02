---
title: "[validation-fixture] download assetRefs intra-post duplicate"
slug: "test-download-asset-ref-duplicate"
status: "ready"
draft: false
date: "2026-06-03"
description: "Phase 20260603-am-2 R5b fixture：故意觸發 download-asset-ref-duplicate warning（intra-post duplicate case）。"
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
  fileUrl: "https://example.com/downloads/duplicate-asset-ref.pdf"
  assetRefs:
    - "duplicate-asset-id"
    - "duplicate-asset-id"
---

本 fixture 故意設計 download.assetRefs[0] 與 download.assetRefs[1] 為同一字串 → 觸發 `download-asset-ref-duplicate`（per Phase 20260603-am-2 R5b S1 設計：每個 duplicated key 只產生 1 個 warning）。

因 registry 仍為 empty registry（assets: []），此 fixture 同時觸發 2 × `download-asset-ref-not-found`（duplicate 與 not-found 為 orthogonal cascade，per R5a Strategy S1）。

assetRefs 本身為 array，避免觸發 download-asset-refs-invalid-type；item 為非空 trimmed string，通過 invalid-type / empty 分支。

fileUrl + seo.indexing 設定避免同時觸發 D1 / D2 / D3 / S；本 fixture 預期觸發共 3 個 warning（2 × not-found + 1 × duplicate）。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
