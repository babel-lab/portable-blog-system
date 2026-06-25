---
title: "[validation-fixture] downloadFunnel absolute-url target"
slug: "test-download-funnel-absolute-url-target"
status: "ready"
date: "2026-06-25"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Fixture：entry targetGatedPage 用 fake public absolute URL → absolute URL matching deferred → 0 warning。"
downloadFunnel:
  role: "entry"
  targetGatedPage: "https://example.github.io/fake-gated-download"
---

本 fixture 鎖住「**absolute URL deferred → silent**」：

- `downloadFunnel.role: entry` + `targetGatedPage` 用明確 fake public absolute URL（`example.github.io`，**非** Drive/Form/token pattern）。
- 依 F8 current implementation：absolute URL cross-file matching **deferred**（含 `://` → 不解析）。

預期 downloadFunnel validator 行為：**0 warning**（absolute URL 不誤報；非 Drive/Form/token → 非 private-value）。位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；0-warning → **不** bump validate:content baseline。
