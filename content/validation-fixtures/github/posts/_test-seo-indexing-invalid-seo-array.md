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
description: "Phase 20260520-seo-2-d fixture（SEO-2-e 已 hardening）：seo 為 array 而非 object；觸發 invalid-seo-block warning。"
seo:
  - indexing: index
---

本 fixture 故意將 `seo` frontmatter 設為 array of object `[{ indexing: "index" }]`（而非單一 nested object `{ indexing: "index" }`），以驗證 validator 對 array `seo` 之處理。

**預期 validator 行為**（per `validate-content.js` SEO-2-e hardening rule `invalid-seo-block`）：
- `post.seo !== undefined` → true
- `Array.isArray([{...}])` → true → 觸發 `invalid-seo-block` warning ✅

預期 validate 輸出：
- 1 個 `[WARNING] invalid-seo-block: [object Object]`（`String([{...}])` → `'[object Object]'`）

**Historical note**：本 fixture 於 SEO-2-d（commit `bc35a02`）建立時，因 validator 之 guard #4（`array.indexing === undefined`）而 silent skip（無 warning）；當時被標記為 gap candidate（因 `typeof [] === 'object'` 通過 guard #3 但實際非預期 plain object）。Phase 20260520-seo-2-e 補上 `invalid-seo-block` hardening rule（含 `Array.isArray()` 嚴格 array 攔截）後，本 fixture 由 silent skip 改為觸發 1 個 warning。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
