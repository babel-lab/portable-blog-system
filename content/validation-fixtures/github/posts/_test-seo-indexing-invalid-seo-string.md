---
title: "[validation-fixture] seo as string"
slug: "test-seo-indexing-invalid-seo-string"
status: "ready"
date: "2026-05-20"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260520-seo-2-d fixture（SEO-2-e 已 hardening）：seo 整體為 string 而非 object；觸發 invalid-seo-block warning。"
seo: "index"
---

本 fixture 故意將 `seo` frontmatter 設為 string `"index"`（而非 nested object `{ indexing: "index" }`），以驗證 validator 對非 object `seo` 之處理。

**預期 validator 行為**（per `validate-content.js` SEO-2-e hardening rule `invalid-seo-block`）：
- `post.seo !== undefined` → true
- `typeof "index" !== 'object'` → true → 觸發 `invalid-seo-block` warning ✅

預期 validate 輸出：
- 1 個 `[WARNING] invalid-seo-block: index`

**Historical note**：本 fixture 於 SEO-2-d（commit `bc35a02`）建立時，因 validator 之 `typeof post.seo === 'object'` guard #3 而 silent skip（無 warning）；當時被標記為 gap candidate。Phase 20260520-seo-2-e 補上 `invalid-seo-block` hardening rule 後，本 fixture 由 silent skip 改為觸發 1 個 warning。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
