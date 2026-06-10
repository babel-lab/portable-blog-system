---
title: "[validation-fixture] adsense block invalid surface value"
slug: "test-adsense-block-invalid-surface-value"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-night-6 fixture：adsense.blocks[0].surfaces 含未知 value → 預期 1 warning（adsense-block-invalid-surface-value）。"
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
    - id: "invalid-surface-value-fixture"
      enabled: true
      surfaces: ["facebook"]
      anchor: "afterHeader"
      slotKey: "postTop"
---

本 fixture 之 `adsense.blocks[0].surfaces` 含未知 value `"facebook"`（允許值為 `blogger` / `pages`）→ 觸發 `adsense-block-invalid-surface-value`（1 warning）。block 其餘 shape 合法。
