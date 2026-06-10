---
title: "[validation-fixture] affiliate block missing id"
slug: "test-affiliate-block-missing-id"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-pm-9 fixture：affiliate.blocks[0] 缺 id → 預期 1 warning（affiliate-block-missing-id）。"
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
    - enabled: true
      surfaces: ["blogger"]
      position: "top"
      links:
        - label: "（fixture）通路"
          url: "https://example.com/a"
---

本 fixture 之 `affiliate.blocks[0]` 無 `id` → 觸發 `affiliate-block-missing-id`（1 warning）。block 其餘 shape 合法（enabled / position=top / surfaces=["blogger"] / 非空 raw-url links），故不觸發其他規則。

不含真實聯盟連結 / token；registry 維持 L1 不變。
