---
title: "[validation-fixture] commerce invalid role"
slug: "test-commerce-ref-invalid-role"
status: "ready"
draft: false
date: "2026-06-08"
description: "Phase 20260608-am-16 C8 fixture：故意觸發 commerce-ref-invalid-role warning（C8）。"
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
    - label: "（fixture）通路"
      role: "Primary"
---

本 fixture 故意設計 `affiliate.links[0]` 為 raw-only entry（**不填** `ref`、**不填** `url`），僅持有 `label` 與非法 `role`（`"Primary"`）。`role` 為非空 string 但不在 `VALID_COMMERCE_LINK_ROLE` enum（`primary` / `alternate` / `official` / `price-check` / `library` / `direct`，皆小寫）→ 觸發 `commerce-ref-invalid-role`（C8；走 invalid string branch）。

因 entry **無 `ref`**（`ref === undefined`），`validateCommerceRefs` 之 ref cascade 對該 entry 整段 `continue` → 不觸發 C1 / C2 / C3 / C5 / C6。C8 為獨立 pass（不依賴 `entry.ref`），故 raw-only entry 之 `role` 仍受檢。又因 entry **無 `url`**，亦不觸發 C6 coexist。

預期只 +1 warning（`commerce-ref-invalid-role`）。

`role` 值 `"Primary"`（大寫開頭，刻意與小寫 enum `primary` 區隔，示範 case-sensitive enum 比對）；`label` 為 fixture-only 占位文字；不含真實聯盟連結 / tracking id / token / credential / sid / aff_id / merchant id / GA id；不消費也不變動 commerce-links registry；registry 維持 empty `[]`。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
