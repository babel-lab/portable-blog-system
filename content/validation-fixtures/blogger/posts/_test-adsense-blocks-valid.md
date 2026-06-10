---
title: "[validation-fixture] adsense blocks valid"
slug: "test-adsense-blocks-valid"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-night-6 fixture：合法 adsense.blocks[] 上下雙區塊 → 預期 0 warning。"
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
    - id: "valid-top-fixture"
      enabled: true
      surfaces: ["blogger", "pages"]
      anchor: "afterHeader"
      slotKey: "postTop"
      order: 1
    - id: "valid-bottom-fixture"
      enabled: true
      surfaces: ["blogger"]
      anchor: "beforeHashtags"
      slotKey: "postBottom"
      order: 2
---

本 fixture 設計合法 `adsense.blocks[]`（上下兩 block，皆有 `id` / `enabled` / `surfaces` / `anchor` / `slotKey`）。預期 **0 warning**：驗證 valid shape 不誤報。

slotKey 使用當前 production `settings.ads.slots` 既有 key（`postTop` / `postBottom`）。
anchor 使用 v1 enum（per night-4 §7.2）。
