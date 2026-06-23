---
title: "[validation-fixture] platformPolicy minimal valid"
slug: "test-page-platform-policy-minimal-valid"
status: "ready"
date: "2026-06-23"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp8 fixture：platformPolicy 為合法最小 object（recommended platform key + 合法 nested value）→ 0 新 platformPolicy warning。"
platformPolicy:
  github:
    indexing: inherit
    includeInListings: inherit
    includeInSitemap: inherit
  blogger:
    indexing: noindex-nofollow
    includeInListings: false
  future:
    indexing: inherit
    canonical: inherit
    note: "保留供未來平台使用"
---

本 fixture 設合法 `platformPolicy`（github / blogger / future 皆 recommended platform key，nested value 皆合法）。

**預期 SP-8 validator 行為**：0 個 `page-platform-policy-*` warning（亦不觸發 SP-2 `page-platform-policy-invalid-type`，因為 platformPolicy 為 plain object）。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
