---
title: "[validation-fixture] adsense block invalid order type"
slug: "test-adsense-block-invalid-order-type"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-night-6 fixture：adsense.blocks[0].order 為 string → 預期 1 warning（adsense-block-invalid-order-type）。"
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
    - id: "invalid-order-type-fixture"
      enabled: true
      surfaces: ["blogger"]
      anchor: "afterHeader"
      slotKey: "postTop"
      order: "1"
---

本 fixture 之 `adsense.blocks[0].order` 為字串 `"1"`（須為 number）→ 觸發 `adsense-block-invalid-order-type`（1 warning）。block 其餘 shape 合法。
