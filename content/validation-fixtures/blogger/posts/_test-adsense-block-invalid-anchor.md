---
title: "[validation-fixture] adsense block invalid anchor"
slug: "test-adsense-block-invalid-anchor"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-night-6 fixture：adsense.blocks[0].anchor 為 v1 enum 之外 → 預期 1 warning（adsense-block-invalid-anchor）。"
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
    - id: "invalid-anchor-fixture"
      enabled: true
      surfaces: ["blogger"]
      anchor: "nowhere"
      slotKey: "postTop"
---

本 fixture 之 `adsense.blocks[0].anchor="nowhere"` 不在 v1 enum 內（v1 enum 見 night-4 §7.2）→ 觸發 `adsense-block-invalid-anchor`（1 warning）。block 其餘 shape 合法。
