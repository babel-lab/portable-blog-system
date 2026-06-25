---
title: "[validation-fixture] downloadFunnel dangling target"
slug: "test-download-funnel-dangling-target"
status: "ready"
date: "2026-06-25"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Fixture：entry targetGatedPage 指向 corpus 內不存在 fake slug → dangling deferred → 0 warning。"
downloadFunnel:
  role: "entry"
  targetGatedPage: "fake-nonexistent-gated-download-slug"
---

本 fixture 鎖住「**dangling reference deferred → silent**」：

- `downloadFunnel.role: entry` + `targetGatedPage` 指向 corpus 內**不存在**之 fake slug（無對應 post）。
- 依 F8 current implementation：missing-post / dangling reference **deferred**（不告警）。

預期 downloadFunnel validator 行為：**0 warning**（dangling 不誤報；非 Drive/Form/token → 非 private-value）。位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；0-warning → **不** bump validate:content baseline。
