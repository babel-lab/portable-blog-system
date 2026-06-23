---
title: "[validation-fixture] platformPolicy entry not object"
slug: "test-page-platform-policy-platform-not-object"
status: "ready"
date: "2026-06-23"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp8 fixture：platformPolicy 之 platform entry 為 string（非 object）→ 觸發 page-platform-policy-platform-invalid-type。"
platformPolicy:
  github: "noindex"
---

本 fixture 故意把 recommended platform key `github` 之 entry 設為 string `"noindex"`（應為 object）。

**預期 SP-8 validator 行為**：觸發 `page-platform-policy-platform-invalid-type`（github 為 recommended key，故不報 unknown-platform；entry 非 object → 不 recurse）。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
