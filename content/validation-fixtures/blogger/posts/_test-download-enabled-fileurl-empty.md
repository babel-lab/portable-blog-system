---
title: "[validation-fixture] download enabled fileUrl empty"
slug: "test-download-enabled-fileurl-empty"
status: "ready"
draft: false
date: "2026-05-30"
description: "Phase 20260530-am-7 fixture：故意觸發 download-enabled-fileurl-empty warning。"
contentKind: "download"
site: "blogger"
primaryPlatform: "blogger"
category: "download"
tags: ["book"]
cover: "/images/placeholders/cover.png"
download:
  enabled: true
  fileUrl: ""
---

本 fixture 故意設計 contentKind=download、download.enabled=true、download.fileUrl=""（empty string）→ 觸發 `download-enabled-fileurl-empty`。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
