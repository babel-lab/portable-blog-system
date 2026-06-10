---
title: "[validation-fixture] affiliate block links not array"
slug: "test-affiliate-block-links-not-array"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-pm-9 fixture：affiliate.blocks[0].links 非 array → 預期 1 warning（affiliate-block-links-not-array）。"
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
    - id: "links-type-fixture"
      enabled: false
      position: "top"
      links: "not-an-array"
---

本 fixture 之 `affiliate.blocks[0].links` 為字串（非 array）→ 觸發 `affiliate-block-links-not-array`（1 warning）。

該 block 刻意設 `enabled: false`，以隔離單一 warning：disabled block 之 `position` 與 `enabled-no-links` 檢查皆略過，故不疊加其他 warning；`id` 存在 → 不觸發 missing-id；`links` 非 array → 不進入 block-link commerce-ref 驗證。

不含真實聯盟連結 / token；registry 維持 L1 不變。
