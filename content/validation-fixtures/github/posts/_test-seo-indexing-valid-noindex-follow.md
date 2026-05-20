---
title: "[validation-fixture] seo.indexing valid: noindex-follow"
slug: "test-seo-indexing-valid-noindex-follow"
status: "ready"
date: "2026-05-20"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260520-seo-2-d fixture：seo.indexing 合法值 'noindex-follow' 不應觸發 invalid-seo-indexing warning（補完 3 valid 之最後 1 個）。"
seo:
  indexing: "noindex-follow"
---

本 fixture 補完 SEO-2-b / SEO-2-d 之 valid fixtures 三值排列（per `VALID_SEO_INDEXING = new Set(['index', 'noindex-follow', 'noindex-nofollow'])`）：

| Valid value | Fixture | 來源 batch |
|---|---|---|
| `index` | `_test-seo-indexing-valid-index.md` | SEO-2-b |
| `noindex-follow` | `_test-seo-indexing-valid-noindex-follow.md`（本 fixture） | **SEO-2-d** |
| `noindex-nofollow` | `_test-seo-indexing-valid-noindex-nofollow.md` | SEO-2-b |

**預期 validator 行為**：valid → 不觸發 `invalid-seo-indexing` warning；不列入 issue-post(s) count。

**注意**：spec SEO-2-d §F 另列 `_test-seo-indexing-valid-index-follow.md` 之 `"index-follow"`，但實測 `VALID_SEO_INDEXING` set 不含此值（only `index` / `noindex-follow` / `noindex-nofollow`）；per spec instruction「若現行合法 set 不含這些值，請不要猜，先 grep validator 的 VALID_SEO_INDEXING，再依實際 set 調整 fixture」→ 本批 **skip 該 fixture**（無第 4 valid value 可補）。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
