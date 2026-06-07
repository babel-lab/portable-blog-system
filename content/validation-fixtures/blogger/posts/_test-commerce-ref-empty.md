---
title: "[validation-fixture] commerce ref empty"
slug: "test-commerce-ref-empty"
status: "ready"
draft: false
date: "2026-06-07"
description: "Phase 20260607-night-4 FC2 fixture：故意觸發 commerce-ref-empty warning（C2）。"
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
    - ref: ""
---

本 fixture 故意設計 `affiliate.links[0].ref` 為空字串（`""`）→ 觸發 `commerce-ref-empty`（C2）。

C2 cascade：C2 觸發 → 同 entry 跳過 C3 / C5（per `src/scripts/validate-content.js` `validateCommerceRefs`）；空字串 ref 之 trim 結果不參與 duplicate map（line 641）。單 entry → 不可能觸發 C5。預期只 +1 warning（`commerce-ref-empty`）。

`ref` 為 fixture-only 空值（非真實 affiliate ref / merchant token / tracking id / production linkId）；不消費 commerce-links registry；registry 維持 empty `[]`。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
