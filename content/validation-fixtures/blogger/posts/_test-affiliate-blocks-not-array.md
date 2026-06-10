---
title: "[validation-fixture] affiliate blocks not array"
slug: "test-affiliate-blocks-not-array"
status: "ready"
draft: false
date: "2026-06-10"
description: "Phase 20260610-pm-9 fixture：affiliate.blocks 為非 array → 預期 1 warning（affiliate-blocks-not-array）。"
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
  blocks: "not-an-array"
---

本 fixture 故意把 `affiliate.blocks` 設為字串（非 array）→ 觸發 `affiliate-blocks-not-array`（1 warning，隨即 return）。

無 `affiliate.links`，故 legacy commerce-ref 驗證不觸發。不含真實聯盟連結 / token；registry 維持 L1 不變。
