---
title: "[validation-fixture] series 欄位型別錯誤"
slug: "test-series-validation"
status: "ready"
date: "2026-05-11"
description: "Phase 8-e-6-b-2 fixture：故意觸發 series-id-invalid / series-number-invalid / series-subtitle-invalid-type。位於 content/validation-fixtures/ 不會被 build:* 掃到。"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
series:
  id: ""
  number: -1
  subtitle: 42
---

本 fixture 故意設計 series 區塊：

- `series.id` 設為空字串 → 觸發 `series-id-invalid`
- `series.number` 設為 -1（負整數）→ 觸發 `series-number-invalid`
- `series.subtitle` 設為 42（非 string）→ 觸發 `series-subtitle-invalid-type`

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
