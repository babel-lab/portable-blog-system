---
title: "[validation-fixture] affiliate block link ref not found"
slug: "test-affiliate-block-link-ref-not-found"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-pm-9 fixture：affiliate.blocks[0].links[0].ref 不在 registry → 預期 1 warning（commerce-ref-not-found，block path）。"
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
    - id: "ref-not-found-fixture"
      enabled: true
      surfaces: ["blogger"]
      position: "top"
      links:
        - label: "（fixture）通路"
          ref: "fixture-block-ref-not-in-registry-xyz"
---

本 fixture 之 `affiliate.blocks[0].links[0].ref` 為 `fixture-block-ref-not-in-registry-xyz`，不存在於 commerce-links registry → 透過共用 helper `validateCommerceLinkArray`（block path `affiliate.blocks[0].links`）觸發 `commerce-ref-not-found`（1 warning，C3 重用）。

驗證 block links 確實沿用既有 commerce-ref 驗證。block-level C4/C9 本 phase deferred（entryMap 傳 null），故不觸發 inactive / label-leak。

`ref` 為 fixture-namespaced machine key（非真實 linkId）；不含真實聯盟連結 / token / tracking id；registry 維持 L1 不變。
