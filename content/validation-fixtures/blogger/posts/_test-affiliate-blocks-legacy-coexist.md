---
title: "[validation-fixture] affiliate blocks legacy coexist"
slug: "test-affiliate-blocks-legacy-coexist"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-pm-9 fixture：legacy affiliate.links[] 與 affiliate.blocks[] 並存 → 預期 0 warning（無 coexistence 警告）。"
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
  position:
    top: false
    bottom: true
  links:
    - label: "（fixture）legacy raw"
      url: "https://example.com/legacy"
  blocks:
    - id: "coexist-top-fixture"
      enabled: true
      surfaces: ["blogger"]
      position: "top"
      links:
        - label: "（fixture）block raw"
          url: "https://example.com/block"
---

本 fixture 同時保有 legacy `affiliate.links[]` + `position`（GitHub 渲染用）與新 `affiliate.blocks[]`（Blogger dual-block 用）—— 即 we-media 當前階段遷移所需之**刻意並存**形狀。

預期 **0 warning**：驗證 validator **不**對 legacy/blocks 並存報任何 coexistence 警告（per convention §3.3）。legacy links 與 block links 皆 raw url（無 `ref`）→ 不觸發 commerce-ref 規則。

不含真實聯盟連結 / token；registry 維持 L1 不變。
