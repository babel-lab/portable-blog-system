---
title: "[validation-fixture] adsense block missing id"
slug: "test-adsense-block-missing-id"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-night-6 fixture：adsense.blocks[0] 缺 id → 預期 1 warning（adsense-block-missing-id）。"
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
    - enabled: true
      surfaces: ["blogger"]
      anchor: "afterHeader"
      slotKey: "postTop"
---

本 fixture 之 `adsense.blocks[0]` 無 `id` → 觸發 `adsense-block-missing-id`（1 warning）。block 其餘 shape 合法，故不觸發其他規則。
