---
title: "[validation-fixture] adsense block empty surfaces"
slug: "test-adsense-block-empty-surfaces"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-night-6 fixture：adsense.blocks[0].surfaces 為 [] → 預期 1 warning（adsense-block-empty-surfaces）。"
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
    - id: "empty-surfaces-fixture"
      enabled: true
      surfaces: []
      anchor: "afterHeader"
      slotKey: "postTop"
---

本 fixture 之 `adsense.blocks[0].surfaces` 為空 array → 觸發 `adsense-block-empty-surfaces`（1 warning）。

省略 surfaces 不警；explicit `[]` 視為 misconfig 警示（per convention §6.8）。block 其餘 shape 合法。
