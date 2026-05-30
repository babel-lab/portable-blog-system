---
title: "[validation-fixture] download fileUrl invalid type"
slug: "test-download-fileurl-invalid-type"
status: "ready"
draft: false
date: "2026-05-30"
description: "Phase 20260530-am-7 fixture：故意觸發 download-fileurl-invalid-type warning。"
contentKind: "download"
site: "blogger"
primaryPlatform: "blogger"
category: "download"
tags: ["book"]
cover: "/images/placeholders/cover.png"
download:
  enabled: true
  fileUrl: 123
---

本 fixture 故意設計 download.fileUrl 為 number（123）→ 觸發 `download-fileurl-invalid-type`。

D1 / D2 互斥：fileUrl 為非 string 由 D2 接住，不再被 D1 視為 empty string，故本 fixture 只觸發 D2。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
