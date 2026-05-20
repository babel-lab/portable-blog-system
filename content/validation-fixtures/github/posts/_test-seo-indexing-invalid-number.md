---
title: "[validation-fixture] seo.indexing invalid: number"
slug: "test-seo-indexing-invalid-number"
status: "ready"
date: "2026-05-20"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260520-seo-2-c fixture：seo.indexing 為 number 123（非 string），應觸發 1 個 invalid-seo-indexing warning。"
seo:
  indexing: 123
---

本 fixture 故意將 `seo.indexing` 設為 number `123`（非 string），以觸發 `validate-content.js` 之 `invalid-seo-indexing` warning（per Phase 20260520-seo-2 之 type guard：`typeof post.seo.indexing !== 'string'` 觸發 warning）。

**與 `_test-seo-indexing-invalid-non-string.md`（boolean `true`）為非 string 型別之 fixture pair**：boolean / number 兩種常見非 string scalar 之雙重覆蓋；保護未來若 validator 改 type check 之 regression。

預期 validate 輸出：
- 1 個 `[WARNING] invalid-seo-indexing: 123`

對應 SEO-2 precedence：
- 非 string 不主動 fallback；build / sitemap 端對未匹配之值沿用 SEO-1 / default 行為

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
