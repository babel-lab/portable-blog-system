---
title: "[validation-fixture] commerce ref intra-post duplicate"
slug: "test-commerce-ref-duplicate"
status: "ready"
draft: false
date: "2026-06-07"
description: "Phase 20260607-night-4 FC5 fixture：故意觸發 commerce-ref-duplicate-in-post warning（C5）+ 2 × commerce-ref-not-found（orthogonal cascade，empty registry 下無法避免）。"
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
    - ref: "fixture-ref-001"
    - ref: "fixture-ref-001"
---

本 fixture 故意設計 `affiliate.links[0].ref` 與 `affiliate.links[1].ref` 為同一 fixture 命名空間 string（`"fixture-ref-001"`）→ 觸發 `commerce-ref-duplicate-in-post`（C5）。

因 commerce-links registry 維持 empty `[]`，兩個非空 ref 皆 not-found → orthogonal 觸發 2 × `commerce-ref-not-found`（C3 與 C5 為 orthogonal cascade，per `src/scripts/validate-content.js` `validateCommerceRefs` + 20260604 am-7 §5.6）。

預期觸發共 3 個 warning：
- 1 × `commerce-ref-duplicate-in-post`（C5；每個 dup key 1 warning，不 per-occurrence 爆量）
- 2 × `commerce-ref-not-found`（C3；每個 entry 1 warning）

mirror download R5b `_test-download-asset-ref-duplicate.md` cadence（2 × not-found + 1 × duplicate）。`ref` 為 fixture-only 命名空間（非真實 affiliate ref / merchant token / tracking id / production linkId）；不消費也不變動 commerce-links registry；registry 維持 empty `[]`。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
