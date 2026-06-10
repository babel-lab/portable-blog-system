---
title: "[validation-fixture] adsense enabled invalid type"
slug: "test-adsense-enabled-invalid-type"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-night-6 fixture：post.adsense.enabled 為 string → 預期 1 warning（adsense-enabled-invalid-type）。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
seo:
  indexing: "noindex-follow"
adsense:
  enabled: "yes"
---

本 fixture 之 `adsense.enabled` 為字串 `"yes"`（須為 boolean）→ 觸發 `adsense-enabled-invalid-type`（1 warning）。

無 `adsense.blocks` → 不觸發任何 block-level 規則。
