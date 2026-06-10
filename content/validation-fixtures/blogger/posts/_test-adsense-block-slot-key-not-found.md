---
title: "[validation-fixture] adsense block slot key not found"
slug: "test-adsense-block-slot-key-not-found"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-night-6 fixture：adsense.blocks[0].slotKey 不在 settings.ads.slots → 預期 1 warning（adsense-block-slot-key-not-found）。"
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
    - id: "slot-key-not-found-fixture"
      enabled: true
      surfaces: ["blogger"]
      anchor: "afterHeader"
      slotKey: "articleAd99"
---

本 fixture 之 `adsense.blocks[0].slotKey="articleAd99"` 不在當前 production `settings.ads.slots`（`{postTop, postMiddle, postBottom, sidebar, homeInline}`）內 → 觸發 `adsense-block-slot-key-not-found`（1 warning）。

未來 N6 settings shape 擴充加入 `articleAd1~6` 後，本 fixture 之 slotKey 仍會維持 not-found（`articleAd99` 為刻意不存在之 key）。block 其餘 shape 合法。
