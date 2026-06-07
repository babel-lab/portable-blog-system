---
title: "[validation-fixture] commerce ref direct url coexist"
slug: "test-commerce-ref-direct-url-coexist"
status: "ready"
draft: false
date: "2026-06-07"
description: "Phase 20260607-night-20 C6 fixture：故意觸發 commerce-ref-direct-url-coexist warning（C6）+ 1 × commerce-ref-not-found（orthogonal cascade，empty registry 下無法避免）。"
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
    - ref: "fixture-c6-coexist-ref"
      url: "https://example.invalid/commerce-fixture"
---

本 fixture 故意設計 `affiliate.links[0]` 同時持有非空 trimmed string `ref`（`"fixture-c6-coexist-ref"`）與非空 trimmed string `url`（`"https://example.invalid/commerce-fixture"`）→ 觸發 `commerce-ref-direct-url-coexist`（C6）。

因 commerce-links registry 維持 empty `[]`，`ref` 為非空 trimmed string 且不在 registry → orthogonal 觸發 1 × `commerce-ref-not-found`（C3 與 C6 為 orthogonal cascade，per `src/scripts/validate-content.js` `validateCommerceRefs` + 20260607-night-12 §F.4.3 + 20260607-night-18 §H §I）。

預期觸發共 2 個 warning：
- 1 × `commerce-ref-direct-url-coexist`（C6；migration mode 提示）
- 1 × `commerce-ref-not-found`（C3；empty registry orthogonal cascade）

`ref` 為 fixture-only 命名空間（`fixture-c6-*`；非真實 affiliate ref / merchant token / tracking id / production linkId）；`url` 採 RFC 2606 reserved `.invalid` TLD（保證永不解析；非真實博客來 / 蝦皮 / momo / 聯盟網 / 通路王 URL）；不消費也不變動 commerce-links registry；registry 維持 empty `[]`。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
