---
title: "[validation-fixture] gatedDownload invalid type"
slug: "test-page-gated-download-invalid-type"
status: "ready"
date: "2026-06-23"
contentKind: "page"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp2 fixture：gatedDownload 為 string（非 object）→ 觸發 page-gated-download-invalid-type。"
gatedDownload: "google-form"
---

本 fixture 故意設 `gatedDownload: "google-form"`（string，非 plain object）。

**預期 SP-2 validator 行為**：觸發 `page-gated-download-invalid-type`（value `gatedDownload typeof=string (must be object)`）。因 gatedDownload 非 object → suspicious-field key 掃描跳過（不觸發 `page-gated-download-suspicious-field`）。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
