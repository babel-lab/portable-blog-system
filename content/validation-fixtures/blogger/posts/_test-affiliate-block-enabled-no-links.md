---
title: "[validation-fixture] affiliate block enabled no links"
slug: "test-affiliate-block-enabled-no-links"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-pm-9 fixture：enabled block 之 links 為空 array → 預期 1 warning（affiliate-block-enabled-no-links）。"
contentKind: "book-review"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
seo:
  indexing: "noindex-follow"
affiliate:
  enabled: true
  disclosure: "（fixture）本文為 validation fixture，無真實聯盟連結。"
  blocks:
    - id: "no-links-fixture"
      enabled: true
      surfaces: ["blogger"]
      position: "top"
      links: []
---

本 fixture 之 `affiliate.blocks[0]` 為 enabled，但 `links` 為空 array（無 usable link entry）→ 觸發 `affiliate-block-enabled-no-links`（1 warning）。`links` 本身是 array（非 links-not-array）；block 其餘 shape 合法。

不含真實聯盟連結 / token；registry 維持 L1 不變。
