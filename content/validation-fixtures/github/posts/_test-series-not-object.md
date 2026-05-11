---
title: "[validation-fixture] series 非 object"
slug: "test-series-not-object"
status: "ready"
date: "2026-05-11"
description: "Phase 8-e-6-b-2 fixture：故意把 series 區塊設為字串以觸發 series-not-object。位於 content/validation-fixtures/ 不會被 build:* 掃到。"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
series: "not-an-object"
---

本 fixture 故意把 `series` 設為字串而非 plain object → 觸發 `series-not-object`。

當 `series-not-object` 觸發時，validate-content 跳過 series.id / number / subtitle 之深層檢查；故本 fixture 僅觸發 1 條 warning。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:*` 掃到。
