---
title: "[validation-fixture] seo.indexing case: NOINDEX-FOLLOW"
slug: "test-seo-indexing-invalid-case-noindex-follow"
status: "ready"
date: "2026-05-20"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260520-seo-2-c fixture：seo.indexing 為 \"NOINDEX-FOLLOW\"（全大寫）；確認 VALID_SEO_INDEXING set 為 case-sensitive 比對。"
seo:
  indexing: "NOINDEX-FOLLOW"
---

本 fixture 故意將 `seo.indexing` 設為 `"NOINDEX-FOLLOW"`（全大寫；合法值應為全小寫 `"noindex-follow"`），以觸發 `validate-content.js` 之 `invalid-seo-indexing` warning。

**確認 schema 為 case-sensitive**：與 `_test-seo-indexing-invalid-case-index.md` 為 case-sensitivity 之雙向 fixture pair（單一 case + 全大寫 case）；保護未來若 validator 改用 case-insensitive 比對之 regression。

預期 validate 輸出：
- 1 個 `[WARNING] invalid-seo-indexing: NOINDEX-FOLLOW`

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
