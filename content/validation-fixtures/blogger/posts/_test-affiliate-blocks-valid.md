---
title: "[validation-fixture] affiliate blocks valid"
slug: "test-affiliate-blocks-valid"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-pm-9 fixture：合法 affiliate.blocks[] 上下雙區塊 → 預期 0 warning。"
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
    - id: "top-fixture"
      enabled: true
      surfaces: ["blogger"]
      position: "top"
      heading: "（fixture）上方"
      links:
        - label: "（fixture）通路 A"
          url: "https://example.com/a"
    - id: "bottom-fixture"
      enabled: true
      surfaces: ["blogger"]
      position: "bottom"
      heading: "（fixture）下方"
      links:
        - label: "（fixture）通路 B"
          url: "https://example.com/b"
---

本 fixture 設計合法 `affiliate.blocks[]`（上下兩 block，皆有 `id` / `position` / `surfaces: ["blogger"]` / 非空 `links`）。預期 **0 warning**：驗證 valid shape 不誤報，亦驗證 raw-url block link（無 `ref`）不觸發 commerce-ref 規則。

block links 為 RFC2606 `example.com` 占位 url，無 `ref`；不含真實聯盟連結 / token / tracking id；不消費 commerce-links registry（registry 維持 L1 不變）。
