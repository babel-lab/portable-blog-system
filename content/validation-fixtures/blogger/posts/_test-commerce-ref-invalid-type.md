---
title: "[validation-fixture] commerce ref invalid type"
slug: "test-commerce-ref-invalid-type"
status: "ready"
draft: false
date: "2026-06-07"
description: "Phase 20260607-night-4 FC1 fixture：故意觸發 commerce-ref-invalid-type warning（C1）。"
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
    - ref: 42
---

本 fixture 故意設計 `affiliate.links[0].ref` 為 number（`42`）→ 觸發 `commerce-ref-invalid-type`（C1）。

C1 cascade：C1 觸發 → 同 entry 跳過 C2 / C3 / C5（per `src/scripts/validate-content.js` `validateCommerceRefs`）。單 entry → 不可能觸發 C5。預期只 +1 warning（`commerce-ref-invalid-type`）。

`ref` 為 fixture-only 命名空間（非真實 affiliate ref / merchant token / tracking id / production linkId）；不消費 commerce-links registry；registry 維持 empty `[]`。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
