---
title: "[validation-fixture] series-number 重號 B"
slug: "test-series-dup-b"
status: "ready"
date: "2026-05-11"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 8-g-2-d-e fixture：與 _test-series-dup-a 共用 series.id + series.number 以觸發 series-number-duplicate warning。"
series:
  id: "_test-series-dup"
  number: 1
---

本 fixture 故意與 `_test-series-dup-a.md` 共用 `series.id` + `series.number` 以觸發 `series-number-duplicate` warning（Phase 8-g-2-d-e-b 落地之 cross-post 規則）。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。

注意：本 fixture 之 `series.id="_test-series-dup"` 不在 `content/settings/series.json` 之 entries 中（series.json 為空陣列），故會**同時觸發** `series-id-not-in-settings`（Phase 8-g-2-d-b）；兩條 warning 共存屬預期（per docs/series-schema.md §21.3 之獨立面向設計）。
