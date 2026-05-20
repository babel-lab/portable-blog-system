---
title: "[validation-fixture] seo.indexing invalid: case Index"
slug: "test-seo-indexing-invalid-case-index"
status: "ready"
date: "2026-05-20"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260520-seo-2-c fixture：seo.indexing 為 \"Index\"（大小寫不符）；確認 VALID_SEO_INDEXING set 為 case-sensitive 比對。"
seo:
  indexing: "Index"
---

本 fixture 故意將 `seo.indexing` 設為 `"Index"`（首字母大寫；合法值應為全小寫 `"index"`），以觸發 `validate-content.js` 之 `invalid-seo-indexing` warning。

**確認 schema 為 case-sensitive**：`VALID_SEO_INDEXING` set 使用 JS `Set.has()` 比對（per Phase 20260520-seo-2 commit `0867ca2`），不接受大小寫變體；作者必須使用 `"index"` / `"noindex-follow"` / `"noindex-nofollow"` 字面值。

預期 validate 輸出：
- 1 個 `[WARNING] invalid-seo-indexing: Index`

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
