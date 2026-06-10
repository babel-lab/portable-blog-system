---
title: "[validation-fixture] adsense block invalid entry type"
slug: "test-adsense-block-invalid-entry-type"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-night-6 fixture：adsense.blocks[0] 為 string → 預期 1 warning（adsense-block-invalid-entry-type）。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
seo:
  indexing: "noindex-follow"
adsense:
  enabled: true
  blocks:
    - "not-an-object"
---

本 fixture 之 `adsense.blocks[0]` 為字串 → 觸發 `adsense-block-invalid-entry-type`（1 warning）。validator 對該 entry 跳過後續欄位檢查，故不觸發其他規則。
