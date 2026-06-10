---
title: "[validation-fixture] adsense block duplicate id"
slug: "test-adsense-block-duplicate-id"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-night-6 fixture：兩 block 共用同 id → 預期 1 warning（adsense-block-duplicate-id）。"
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
    - id: "dup-fixture"
      enabled: true
      surfaces: ["blogger"]
      anchor: "afterHeader"
      slotKey: "postTop"
    - id: "dup-fixture"
      enabled: true
      surfaces: ["blogger"]
      anchor: "beforeHashtags"
      slotKey: "postBottom"
---

本 fixture 之兩 block 共用同 `id="dup-fixture"` → 觸發 `adsense-block-duplicate-id`（1 warning）。block 其餘 shape 合法。
