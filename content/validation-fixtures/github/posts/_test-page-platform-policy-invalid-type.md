---
title: "[validation-fixture] platformPolicy invalid type"
slug: "test-page-platform-policy-invalid-type"
status: "ready"
date: "2026-06-23"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp2 fixture：platformPolicy 為 string（非 object）→ 觸發 page-platform-policy-invalid-type。"
platformPolicy: "blogger"
---

本 fixture 故意設 `platformPolicy: "blogger"`（string，非 plain object）。

**預期 SP-2 validator 行為**：觸發 `page-platform-policy-invalid-type`（value `platformPolicy typeof=string (must be object)`）。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
