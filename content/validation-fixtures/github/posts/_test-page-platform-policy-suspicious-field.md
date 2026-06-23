---
title: "[validation-fixture] platformPolicy secret-like key"
slug: "test-page-platform-policy-suspicious-field"
status: "ready"
date: "2026-06-23"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp8 fixture：platformPolicy.github 含 secret-like nested key（apiKey）→ 觸發 page-platform-policy-suspicious-field（不 echo value）。"
platformPolicy:
  github:
    apiKey: "REDACTED-FIXTURE-PLACEHOLDER"
---

本 fixture 故意在 `platformPolicy.github` 放 secret-like key `apiKey`（value 為佔位字串，非真實 secret）。

**預期 SP-8 validator 行為**：觸發 `page-platform-policy-suspicious-field`，message 只報欄位名 `platformPolicy.github.apiKey`、**不** echo value；且不對該 leaf 再做型別檢查。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
