---
title: "[validation-fixture] series.titleTemplate unresolved"
slug: "test-series-title-unresolved"
status: "ready"
date: "2026-05-12"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 8-g-12-c fixture：series.titleTemplate 含 unsupported-placeholder（{post.unknown}）以觸發 series-title-unresolved warning（Phase 8-g-12-b 規則）。"
series:
  id: "_test-title-template"
  number: 1
  titleTemplate: "{post.title} — {post.unknown}"
---

本 fixture 故意將 `series.titleTemplate` 設為含 unsupported-placeholder（`{post.unknown}` 不在 `resolve-series-title.js` 之 SUPPORTED 7 個 placeholder 集合中），以觸發 `series-title-unresolved` warning（Phase 8-g-12-b 落地之規則）。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。

注意：本 fixture 之 `series.id="_test-title-template"` 不在 `content/settings/series.json` 之 entries 中（series.json 為空陣列），故會**同時觸發** `series-id-not-in-settings`（Phase 8-g-2-d-b）；兩條 warning 共存屬預期（per docs/series-schema.md §21.3 之獨立面向設計；沿用 Phase 8-g-2-d-e-c 之 `_test-series-dup-a/b` fixture 不污染 settings namespace 之保守 pattern）。
