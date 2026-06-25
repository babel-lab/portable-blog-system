---
title: "[validation-fixture] downloadFunnel valid gated_page"
slug: "test-download-funnel-valid-gated-page"
status: "ready"
date: "2026-06-25"
contentKind: "page"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Fixture：合法 funnel gated_page（role=gated_page + entryPages 列回 entry fixture；noindex-follow）→ reciprocate → downloadFunnel 0 觸發。"
pageType: "gated_download"
includeInListings: false
includeInSitemap: false
includeInFeeds: false
seo:
  indexing: "noindex-follow"
downloadFunnel:
  role: "gated_page"
  entryPages:
    - "test-download-funnel-valid-entry"
---

本 fixture 代表合法 funnel **gated download page**：

- `downloadFunnel.role: gated_page`、`entryPages` 列回 entry fixture 之 slug（simple slug）。
- 對應 entry fixture 之 `targetGatedPage` 指向本頁 slug → bidirectional reciprocity 一致。
- `pageType: gated_download` + `seo.indexing: noindex-follow` → effective robots noindex → **不**觸發 robots-safety。
- `includeInListings: false` / `includeInSitemap: false` → **不**觸發 role↔policy 一致性。

預期 downloadFunnel validator 行為：**0 warning**。位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
