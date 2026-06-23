---
title: "[validation-fixture] redirect_canonical missing target"
slug: "test-page-type-redirect-canonical-missing-target"
status: "ready"
date: "2026-06-23"
contentKind: "page"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp2 fixture：pageType=redirect_canonical 但 canonical='auto'（非 explicit）→ 觸發 page-redirect-canonical-missing-target。"
pageType: "redirect_canonical"
canonical: "auto"
---

本 fixture 故意設 `pageType: redirect_canonical` + `canonical: "auto"`——純跳轉/canonical 載體頁之 canonical 必須 explicit（不可缺、不可空、不可 'auto'；per preanalysis §2.6 / §5.3）。repo 既有 canonical 欄位慣例（'auto' / explicit URL）→ 可實作，不 defer。

**預期 SP-2 validator 行為**：觸發 `page-redirect-canonical-missing-target`；warning-only。`canonical: "auto"` 屬既有 `invalid-canonical` 規則之合法 'auto' 值 → 不觸發 invalid-canonical。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
