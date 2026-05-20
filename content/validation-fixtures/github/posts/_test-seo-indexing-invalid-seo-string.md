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
description: "Phase 20260520-seo-2-d fixture：seo 整體為 string 而非 object；確認 validator 是否穩定處理（gap candidate）。"
seo: "index"
---

本 fixture 故意將 `seo` frontmatter 設為 string `"index"`（而非 nested object `{ indexing: "index" }`），以測試 validator 對非 object `seo` 之處理。

**預期 validator 行為**（per `validate-content.js` line 332-340）：
- guard #3: `typeof post.seo === 'object'` → `typeof "index" === 'string'` → **false** → validator **silent skip**（不觸發 warning）

**Gap candidate**：當前 validator 對 `seo: <非 object>` 之 invalid input 不觸發 warning；屬 silent failure 風險。本 fixture 用以記錄此 gap；validator hardening 留待獨立 phase。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
