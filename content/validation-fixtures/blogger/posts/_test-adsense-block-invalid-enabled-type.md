---
title: "[validation-fixture] adsense block invalid enabled type"
slug: "test-adsense-block-invalid-enabled-type"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-night-6 fixture：adsense.blocks[0].enabled 為 string → 預期 1 warning（adsense-block-invalid-enabled-type）。"
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
    - id: "invalid-enabled-fixture"
      enabled: "yes"
      surfaces: ["blogger"]
      anchor: "afterHeader"
      slotKey: "postTop"
---

本 fixture 之 `adsense.blocks[0].enabled` 為字串 → 觸發 `adsense-block-invalid-enabled-type`（1 warning）。

`enabled !== false` 之 effectiveEnabled 判定下，"yes" 仍視為 enabled → anchor / slotKey 規則仍套；本 fixture 已填入合法 anchor / slotKey 避免額外 warning。
