---
title: "[validation-fixture] affiliate block duplicate id"
slug: "test-affiliate-block-duplicate-id"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-pm-9 fixture：affiliate.blocks[] 兩 block 重複 id → 預期 1 warning（affiliate-block-duplicate-id）。"
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
    - id: "dup-id"
      enabled: true
      surfaces: ["blogger"]
      position: "top"
      links:
        - label: "（fixture）通路 A"
          url: "https://example.com/a"
    - id: "dup-id"
      enabled: true
      surfaces: ["blogger"]
      position: "bottom"
      links:
        - label: "（fixture）通路 B"
          url: "https://example.com/b"
---

本 fixture 兩 block 共用 `id: "dup-id"` → 觸發 `affiliate-block-duplicate-id`（1 warning，重複 key 只報一次）。兩 block 其餘 shape 皆合法（皆有 id，故不觸發 missing-id；position top/bottom 合法）。

不含真實聯盟連結 / token；registry 維持 L1 不變。
