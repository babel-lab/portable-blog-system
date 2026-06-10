---
title: "[validation-fixture] adsense block missing slot key"
slug: "test-adsense-block-missing-slot-key"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-night-6 fixture：enabled block 缺 slotKey → 預期 1 warning（adsense-block-missing-slot-key）。"
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
    - id: "missing-slot-key-fixture"
      enabled: true
      surfaces: ["blogger"]
      anchor: "afterHeader"
---

本 fixture 之 `adsense.blocks[0]` 為 enabled 但缺 `slotKey` → 觸發 `adsense-block-missing-slot-key`（1 warning）。block 其餘 shape 合法。
