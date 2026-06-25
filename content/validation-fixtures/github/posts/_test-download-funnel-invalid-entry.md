---
title: "[validation-fixture] downloadFunnel invalid entry"
slug: "test-download-funnel-invalid-entry"
status: "ready"
date: "2026-06-25"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Fixture：非法 funnel entry（role=entry 但缺 targetGatedPage）→ required-combo 觸發 exactly 1 warning（scanned invalid baseline bump）。"
downloadFunnel:
  role: "entry"
---

本 fixture 為 **scanned invalid** funnel entry，用於鎖住 required-combo 之單一 warning：

- `downloadFunnel.role: entry` 但**缺** `targetGatedPage`（entry page 應宣告其 target gated page）。
- 依 F3 slice 2 required-combo（§5.2）：role=entry 缺 targetGatedPage → `downloadFunnel-entry-missing-target-gated-page`（warning-only、no-value-echo）。

預期 downloadFunnel validator 行為：**恰 1 warning**（`downloadFunnel-entry-missing-target-gated-page`）。位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。此為**刻意觸發**之 scanned invalid fixture → bump validate:content baseline `0/133/105 → 0/134/106`（per CLAUDE.md §3a explicit baseline-bump 紀律）。
