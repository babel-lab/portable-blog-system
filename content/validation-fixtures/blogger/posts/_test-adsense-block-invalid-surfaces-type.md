---
title: "[validation-fixture] adsense block invalid surfaces type"
slug: "test-adsense-block-invalid-surfaces-type"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-night-6 fixture：adsense.blocks[0].surfaces 為 string → 預期 1 warning（adsense-block-invalid-surfaces-type）。"
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
    - id: "invalid-surfaces-type-fixture"
      enabled: true
      surfaces: "blogger"
      anchor: "afterHeader"
      slotKey: "postTop"
---

本 fixture 之 `adsense.blocks[0].surfaces` 為字串而非 array → 觸發 `adsense-block-invalid-surfaces-type`（1 warning）。block 其餘 shape 合法。
