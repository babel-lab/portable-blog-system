---
title: "[validation-fixture] page-type absent (valid baseline)"
slug: "test-page-type-absent-valid"
status: "ready"
date: "2026-06-23"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp2 fixture：一般 post 完全不帶 pageType / includeIn* / platformPolicy / gatedDownload → SP-2 validator 應 0 觸發（既有 post 行為不變之保證）。"
---

本 fixture 代表 SP-2 之 **null hypothesis**：缺省所有新欄位之既有風格 post。

**預期 SP-2 validator 行為**：
- 不觸發 `page-type-invalid`（pageType 缺省）。
- 不觸發任何 `page-include-flag-invalid-type` / `page-platform-policy-invalid-type` / `page-gated-download-*`。
- 不觸發任何 noindex × include 正交組合 warning。

亦即此 fixture 在 SP-2 落地前後 warning 集合 **byte-identical**（output-preserving 之 source-level 證據）。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
