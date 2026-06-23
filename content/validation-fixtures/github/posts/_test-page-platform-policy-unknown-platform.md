---
title: "[validation-fixture] platformPolicy unknown platform key"
slug: "test-page-platform-policy-unknown-platform"
status: "ready"
date: "2026-06-23"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp8 fixture：platformPolicy 含非建議 platform key（wordpress）→ 觸發 page-platform-policy-unknown-platform。"
platformPolicy:
  wordpress:
    indexing: inherit
---

本 fixture 故意設非建議 platform key `wordpress`（建議僅 github / blogger / future）。

**預期 SP-8 validator 行為**：觸發 `page-platform-policy-unknown-platform`（entry 為合法 object、nested value 合法，故僅此 1 條）。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
