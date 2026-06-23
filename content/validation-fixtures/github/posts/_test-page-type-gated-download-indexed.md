---
title: "[validation-fixture] page-type gated_download + index"
slug: "test-page-type-gated-download-indexed"
status: "ready"
date: "2026-06-23"
contentKind: "page"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp2 fixture：pageType=gated_download 但 seo.indexing=index → 觸發 page-gated-download-indexed（最高風險組合）。"
pageType: "gated_download"
seo:
  indexing: "index"
---

本 fixture 故意設閘門下載頁為可索引（`pageType: gated_download` + `seo.indexing: index`）——preanalysis §4 / §5.3 標示之最高風險組合（搜尋引擎略過閘門/前導頁直達資源）。

**預期 SP-2 validator 行為**：觸發 `page-gated-download-indexed`；warning-only。

- `seo.indexing: "index"` 為合法列舉值 → 不觸發 `invalid-seo-indexing`。
- `contentKind: page`（非 download）→ 不觸發 `download-content-should-be-noindex`。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
