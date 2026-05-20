---
title: "[validation-fixture] seo as array"
slug: "test-seo-indexing-invalid-seo-array"
status: "ready"
date: "2026-05-20"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260520-seo-2-d fixture：seo 為 array 而非 object；確認 validator 是否穩定處理（gap candidate）。"
seo:
  - indexing: index
---

本 fixture 故意將 `seo` frontmatter 設為 array of object `[{ indexing: "index" }]`（而非單一 nested object `{ indexing: "index" }`），以測試 validator 對 array `seo` 之處理。

**預期 validator 行為**（per `validate-content.js` line 332-340）：
- guard #3: `typeof post.seo === 'object'` → `typeof [{...}] === 'object'` → **true**（array 在 JS typeof 為 'object'，validator 未額外 isArray 攔截）
- guard #4: `post.seo.indexing !== undefined` → array 無 `indexing` property（除非 numeric index）→ `[{...}].indexing === undefined` → **false** → validator **silent skip**

**Gap candidate**：當前 validator 對 `seo: <array>` 之 invalid input 不觸發 warning；屬 silent failure 風險。本 fixture 用以記錄此 gap；validator hardening（如 `Array.isArray()` guard）留待獨立 phase。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
