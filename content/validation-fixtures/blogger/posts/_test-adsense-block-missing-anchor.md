---
title: "[validation-fixture] adsense block missing anchor"
slug: "test-adsense-block-missing-anchor"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-night-6 fixture：enabled block 缺 anchor → 預期 1 warning（adsense-block-missing-anchor）。"
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
    - id: "missing-anchor-fixture"
      enabled: true
      surfaces: ["blogger"]
      slotKey: "postTop"
---

本 fixture 之 `adsense.blocks[0]` 為 enabled 但缺 `anchor` → 觸發 `adsense-block-missing-anchor`（1 warning）。block 其餘 shape 合法。
