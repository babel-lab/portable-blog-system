---
title: "[validation-fixture] platformPolicy invalid canonical value"
slug: "test-page-platform-policy-canonical-invalid"
status: "ready"
date: "2026-06-23"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp8 fixture：platformPolicy.github.canonical 為 number（非 string / inherit）→ 觸發 page-platform-policy-canonical-invalid。"
platformPolicy:
  github:
    canonical: 123
---

本 fixture 故意把 `platformPolicy.github.canonical` 設為 number `123`（合法：non-empty string 或 "inherit"）。

**預期 SP-8 validator 行為**：觸發 `page-platform-policy-canonical-invalid`（message 不 echo canonical 值本身）。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
