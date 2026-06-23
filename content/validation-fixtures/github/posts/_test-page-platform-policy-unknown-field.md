---
title: "[validation-fixture] platformPolicy unknown nested field"
slug: "test-page-platform-policy-unknown-field"
status: "ready"
date: "2026-06-23"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp8 fixture：platformPolicy.github 含非建議 nested key（priority）→ 觸發 page-platform-policy-unknown-field。"
platformPolicy:
  github:
    priority: high
---

本 fixture 故意在 `platformPolicy.github` 放非建議 nested key `priority`（建議僅 indexing / includeInListings / includeInSitemap / includeInFeeds / canonical / note）。

**預期 SP-8 validator 行為**：觸發 `page-platform-policy-unknown-field`（不 recurse 進其 value）。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
