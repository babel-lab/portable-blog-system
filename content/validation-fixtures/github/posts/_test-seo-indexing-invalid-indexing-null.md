---
title: "[validation-fixture] indexing as null"
slug: "test-seo-indexing-invalid-indexing-null"
status: "ready"
date: "2026-05-20"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260520-seo-2-d fixture：seo.indexing 為 null（YAML empty value）；應觸發 invalid-seo-indexing warning。"
seo:
  indexing:
---

本 fixture 故意將 `seo.indexing` 設為 YAML empty value（gray-matter parse 為 `null`），以測試 validator 對 null 之處理。

**預期 validator 行為**（per `validate-content.js` line 332-340）：
- seo object `{ indexing: null }` 通過 guard #3
- `null !== undefined` → **true** → 通過 guard #4（null 與 undefined 在 strict 比對為不同值；validator 之 guard 用 `!== undefined`，故 null 通過）
- `typeof null !== 'string'` → **true**（typeof null 為 'object' 非 'string'）→ 觸發 warning ✅

預期 validate 輸出：
- 1 個 `[WARNING] invalid-seo-indexing: null`（`String(null) === 'null'`）

**設計用途**：與 SEO-2-c `_test-seo-indexing-invalid-empty-string.md`（`""`）對比 — null 與 empty string 為兩種不同 YAML empty 形態，validator 對兩者皆視為 invalid。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
