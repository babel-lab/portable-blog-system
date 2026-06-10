---
title: "[validation-fixture] adsense blocks not array"
slug: "test-adsense-blocks-not-array"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-night-6 fixture：adsense.blocks 為 string → 預期 1 warning（adsense-blocks-not-array）。"
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
  blocks: "not-an-array"
---

本 fixture 之 `adsense.blocks` 為字串 → 觸發 `adsense-blocks-not-array`（1 warning）。
