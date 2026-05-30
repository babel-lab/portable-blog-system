---
title: "[validation-fixture] download fileUrl invalid format"
slug: "test-download-fileurl-invalid-format"
status: "ready"
draft: false
date: "2026-05-30"
description: "Phase 20260530-am-13 fixture：故意觸發 download-fileurl-invalid-format warning。"
contentKind: "download"
site: "blogger"
primaryPlatform: "blogger"
category: "download"
tags: ["book"]
cover: "/images/placeholders/cover.png"
download:
  enabled: true
  fileUrl: "not-a-url"
---

本 fixture 故意設計 download.fileUrl 為 non-empty 字串 `not-a-url`（不符合 `^https?://`）→ 觸發 `download-fileurl-invalid-format`。

D1 / D2 / D3 互斥：
- D2 要求 fileUrl 非 string；本 fixture fileUrl 為 string → 不觸發 D2。
- D1 要求 fileUrl 為 undefined / empty / whitespace-only；本 fixture fileUrl 為 non-empty trimmed string → 不觸發 D1。
- D3 要求 fileUrl 為 non-empty trimmed string 且不符合 `^https?://` → 本 fixture 觸發 D3。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
