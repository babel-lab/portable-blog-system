---
title: "[validation-fixture] affiliate block invalid enabled type"
slug: "test-affiliate-block-invalid-enabled-type"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-pm-9 fixture：affiliate.blocks[0].enabled 非 boolean → 預期 1 warning（affiliate-block-invalid-enabled-type）。"
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
    - id: "enabled-type-fixture"
      enabled: "yes"
      surfaces: ["blogger"]
      position: "top"
      links:
        - label: "（fixture）通路"
          url: "https://example.com/a"
---

本 fixture 之 `affiliate.blocks[0].enabled` 為字串 `"yes"`（非 boolean）→ 觸發 `affiliate-block-invalid-enabled-type`（1 warning）。`effectiveEnabled = enabled !== false` → 仍視為 enabled，故 position / links 檢查照常但皆合法（非空 links）。

不含真實聯盟連結 / token；registry 維持 L1 不變。
