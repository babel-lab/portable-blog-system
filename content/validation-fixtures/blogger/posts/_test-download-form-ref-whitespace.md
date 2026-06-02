---
title: "[validation-fixture] download formRef whitespace-only string"
slug: "test-download-form-ref-whitespace"
status: "ready"
draft: false
date: "2026-06-02"
description: "Phase 20260602-am-3 Option A fixture：故意觸發 download-form-ref-empty warning（whitespace-only string case）。"
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
  formRef: "   "
---

本 fixture 故意設計 download.formRef 為 whitespace-only 字串 → 觸發 `download-form-ref-empty`（與 empty string 共用同一 rule id；per docs/20260602-download-form-ref-empty-policy-preanalysis.md §7.2 guard logic）。

fileUrl + seo.indexing 設定避免同時觸發 D1 / D2 / D3 / S；本 fixture 預期只觸發單一 Option A warning。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
