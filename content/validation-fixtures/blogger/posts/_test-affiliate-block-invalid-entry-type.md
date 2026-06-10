---
title: "[validation-fixture] affiliate block invalid entry type"
slug: "test-affiliate-block-invalid-entry-type"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-pm-9 fixture：affiliate.blocks[] 含非 object entry → 預期 1 warning（affiliate-block-invalid-entry-type）。"
contentKind: "book-review"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
seo:
  indexing: "noindex-follow"
affiliate:
  enabled: true
  disclosure: "（fixture）本文為 validation fixture，無真實聯盟連結。"
  blocks:
    - "not-an-object-block"
---

本 fixture 之 `affiliate.blocks[0]` 為字串（非 plain object）→ 觸發 `affiliate-block-invalid-entry-type`（1 warning），該 entry 隨即 `continue`，不再做 id / position 等檢查。

不含真實聯盟連結 / token；registry 維持 L1 不變。
