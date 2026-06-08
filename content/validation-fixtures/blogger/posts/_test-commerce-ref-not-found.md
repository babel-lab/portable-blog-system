---
title: "[validation-fixture] commerce ref not found"
slug: "test-commerce-ref-not-found"
status: "ready"
draft: false
date: "2026-06-07"
description: "Phase 20260607-night-4 FC3 fixture：故意觸發 commerce-ref-not-found warning（C3）。"
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
  links:
    - ref: "__nonexistent-commerce-ref__"
      labelOverride: "sample-internal-c4c9"
---

本 fixture 故意設計 `affiliate.links[0].ref` 為 fixture 命名空間 string（`"__nonexistent-commerce-ref__"`）；commerce-links registry 維持 empty `[]` → `commerceLinkIdSet` 為空 set → `set.has(...)` 為 false → 觸發 `commerce-ref-not-found`（C3）。

`ref` 非空 trimmed string → 通過 C1 / C2 cascade；單 entry → 不可能觸發 C5。預期只 +1 warning（`commerce-ref-not-found`）。

`ref` 命名空間（`__nonexistent-*`）刻意與未來真實 affiliate linkId 區隔；非真實 affiliate ref / merchant token / tracking id；不消費也不變動 commerce-links registry；registry 維持 empty `[]`。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
