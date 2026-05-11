---
title: "[validation-fixture] .fb.md titleEn 非 string"
slug: "test-fb-titleEn"
status: "ready"
date: "2026-05-11"
description: "Phase 8-e-6-b-2 fixture：搭配同名 .fb.md sidecar（titleEn: 123）觸發 fb-md-titleEn-invalid-type。位於 content/validation-fixtures/ 不會被 build:* 掃到。"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
---

本 fixture 之 `_test-fb-titleEn.fb.md` 故意把 `titleEn` 設為數字 123 → 觸發 `fb-md-titleEn-invalid-type`。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:*` 掃到。
