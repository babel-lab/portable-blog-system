---
title: "[validation-fixture] affiliate block invalid surfaces type"
slug: "test-affiliate-block-invalid-surfaces-type"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-pm-9 fixture：affiliate.blocks[0].surfaces 非 array → 預期 1 warning（affiliate-block-invalid-surfaces-type）。"
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
    - id: "surfaces-type-fixture"
      enabled: true
      surfaces: "blogger"
      position: "top"
      links:
        - label: "（fixture）通路"
          url: "https://example.com/a"
---

本 fixture 之 `affiliate.blocks[0].surfaces` 為字串 `"blogger"`（非 array）→ 觸發 `affiliate-block-invalid-surfaces-type`（1 warning）。block 其餘 shape 合法。

注意：省略 `surfaces` 屬合法（convention 預設 `["blogger"]`，不警）；本 fixture 為「present 但型別錯」之情境。

不含真實聯盟連結 / token；registry 維持 L1 不變。
