---
title: "[validation-fixture] download should be noindex (index)"
slug: "test-download-content-should-be-noindex-index"
status: "ready"
draft: false
date: "2026-05-30"
description: "Phase 20260530-night-5 fixture：故意觸發 download-content-should-be-noindex warning（seo.indexing=\"index\" case）。"
contentKind: "download"
site: "blogger"
primaryPlatform: "blogger"
category: "download"
tags: ["book"]
cover: "/images/placeholders/cover.png"
download:
  enabled: true
  fileUrl: "https://example.com/download/noindex-fixture.zip"
seo:
  indexing: "index"
---

本 fixture 故意設計 contentKind=download、download.enabled=true、download.fileUrl=合法 https URL、seo.indexing="index"（合法列舉值但非 noindex）→ 觸發 `download-content-should-be-noindex`（S2 explicit-index case，per Option Beta 合併）。

互斥關係（per docs/20260530-download-validation-s1-s2-merge-decision.md §F.1）：

- 不觸發 D1：fileUrl 為 non-empty trimmed string。
- 不觸發 D2：fileUrl 為 string。
- 不觸發 D3：fileUrl 符合 `^https?://`。
- 不觸發 invalid-seo-block：post.seo 為 plain object。
- 不觸發 invalid-seo-indexing：seo.indexing="index" 為 VALID_SEO_INDEXING 合法列舉值。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
