---
title: "[validation-fixture] affiliate block invalid surface value"
slug: "test-affiliate-block-invalid-surface-value"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-pm-9 fixture：affiliate.blocks[0].surfaces 含非法值 → 預期 1 warning（affiliate-block-invalid-surface-value）。"
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
    - id: "surface-value-fixture"
      enabled: true
      surfaces: ["tiktok"]
      position: "top"
      links:
        - label: "（fixture）通路"
          url: "https://example.com/a"
---

本 fixture 之 `affiliate.blocks[0].surfaces` 為 `["tiktok"]`，`tiktok` 不在允許值 `blogger` / `pages` → 觸發 `affiliate-block-invalid-surface-value`（1 warning）。block 其餘 shape 合法。

不含真實聯盟連結 / token；registry 維持 L1 不變。
