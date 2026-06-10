---
title: "[validation-fixture] adsense blocks legacy coexist"
slug: "test-adsense-blocks-legacy-coexist"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-night-6 fixture：legacy blocks.adsenseTop / adsenseBottom 與新 adsense.blocks[] 並存 → 預期 0 warning（無 coexistence 警告）。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
seo:
  indexing: "noindex-follow"
blocks:
  adsenseTop: true
  adsenseMiddle: false
  adsenseBottom: true
adsense:
  enabled: true
  blocks:
    - id: "coexist-top-fixture"
      enabled: true
      surfaces: ["blogger"]
      anchor: "afterHeader"
      slotKey: "postTop"
    - id: "coexist-bottom-fixture"
      enabled: true
      surfaces: ["blogger"]
      anchor: "beforeHashtags"
      slotKey: "postBottom"
---

本 fixture 同時保有 legacy `blocks.adsenseTop` / `adsenseBottom`（既有 EJS L63 / L294 用）與新 `adsense.blocks[]`（未來 N7+ renderer 用）—— 即 production posts 將來分階段遷移所需之**刻意並存**形狀。

預期 **0 warning**：驗證 validator **不**對 legacy / new coexistence 報任何警告（per night-4 §6.2 fallback + pm-5 preflight §7.3）。兩種 shape 皆 valid → 不觸發 shape rules。
