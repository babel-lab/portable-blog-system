---
title: "[validation-fixture] indexing as array"
slug: "test-seo-indexing-invalid-indexing-array"
status: "ready"
date: "2026-05-20"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260520-seo-2-d fixture：seo.indexing 為 array；應觸發 invalid-seo-indexing warning。"
seo:
  indexing:
    - index
---

本 fixture 故意將 `seo.indexing` 設為 array `["index"]`（而非 string），以觸發 `validate-content.js` 之 `invalid-seo-indexing` warning。

**預期 validator 行為**（per `validate-content.js` line 332-340）：
- seo object 通過 guard #3
- `post.seo.indexing` = `["index"]` !== undefined → 通過 guard #4
- `typeof ["index"] !== 'string'` → **true**（typeof array 為 'object' 非 'string'）→ 觸發 warning ✅

預期 validate 輸出：
- 1 個 `[WARNING] invalid-seo-indexing: index`（`String(["index"]) === 'index'`）

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
