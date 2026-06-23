---
title: "[validation-fixture] platformPolicy invalid note type"
slug: "test-page-platform-policy-note-invalid"
status: "ready"
date: "2026-06-23"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp8 fixture：platformPolicy.future.note 為 number（非 string）→ 觸發 page-platform-policy-note-invalid。"
platformPolicy:
  future:
    note: 2026
---

本 fixture 故意把 `platformPolicy.future.note` 設為 number `2026`（應為 string）。

**預期 SP-8 validator 行為**：觸發 `page-platform-policy-note-invalid`。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
