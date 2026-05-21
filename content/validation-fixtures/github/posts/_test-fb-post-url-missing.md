---
title: "[validation-fixture] FB post URL missing"
slug: "test-fb-post-url-missing"
status: "published"
date: "2026-05-21"
description: "Phase 20260521-pm-34 fixture：搭配同名 .fb.md 觸發 fb-post-url-missing；位於 validation-fixtures 不會被 build:* 掃到。"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
---

本 fixture 之 `_test-fb-post-url-missing.fb.md` sidecar 故意省略 `fbPostUrl` 欄位 + `status: "published"` → 觸發 `fb-post-url-missing` warning。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:*` 掃到。
