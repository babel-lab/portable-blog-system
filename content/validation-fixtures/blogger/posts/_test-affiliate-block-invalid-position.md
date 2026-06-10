---
title: "[validation-fixture] affiliate block invalid position"
slug: "test-affiliate-block-invalid-position"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-pm-9 fixture：affiliate.blocks[0].position 非 top/bottom → 預期 1 warning（affiliate-block-invalid-position）。"
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
    - id: "position-fixture"
      enabled: true
      surfaces: ["blogger"]
      position: "middle"
      links:
        - label: "（fixture）通路"
          url: "https://example.com/a"
---

本 fixture 之 `affiliate.blocks[0].position` 為 `"middle"`（不在允許值 `top` / `bottom`）→ 觸發 `affiliate-block-invalid-position`（1 warning）。block 為 enabled（position 檢查只對 enabled block 生效），其餘 shape 合法（id / surfaces / 非空 links）。

不含真實聯盟連結 / token；registry 維持 L1 不變。
