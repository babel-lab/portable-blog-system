---
title: "[validation-fixture] platformPolicy bad flag value"
slug: "test-page-platform-policy-flag-invalid"
status: "ready"
date: "2026-06-23"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp8 fixture：platformPolicy.blogger.includeInListings 為非法值（maybe）→ 觸發 page-platform-policy-flag-invalid。"
platformPolicy:
  blogger:
    includeInListings: maybe
---

本 fixture 故意把 `platformPolicy.blogger.includeInListings` 設為非法值 `maybe`（合法：inherit / true / false）。

**預期 SP-8 validator 行為**：觸發 `page-platform-policy-flag-invalid`。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
