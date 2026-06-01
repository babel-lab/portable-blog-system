---
title: "[validation-fixture] download formRef invalid type (array)"
slug: "test-download-form-ref-invalid-type-array"
status: "ready"
draft: false
date: "2026-06-01"
description: "Phase 20260601-night-9 Option 6 fixture：故意觸發 download-form-ref-invalid-type warning（array case）。"
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
  formRef:
    - "download-interest-form-v1"
---

本 fixture 故意設計 download.formRef 為 array（應為 string）→ 觸發 `download-form-ref-invalid-type`。

fileUrl + seo.indexing 設定避免同時觸發 D1 / D2 / D3 / S；本 fixture 預期只觸發單一 Option 6 warning。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
