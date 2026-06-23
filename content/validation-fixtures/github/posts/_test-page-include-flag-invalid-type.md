---
title: "[validation-fixture] includeInListings invalid type"
slug: "test-page-include-flag-invalid-type"
status: "ready"
date: "2026-06-23"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Phase 20260623-pm-sp2 fixture：includeInListings 為 string 'yes'（非 boolean）→ 觸發 page-include-flag-invalid-type。"
includeInListings: "yes"
---

本 fixture 故意設 `includeInListings: "yes"`（string，非 boolean）。三欄 `includeInListings` / `includeInSitemap` / `includeInFeeds` 共用同一型別規則。

**預期 SP-2 validator 行為**：觸發 1 條 `page-include-flag-invalid-type`（value `includeInListings typeof=string (must be boolean)`）。`includeInListings` 非 boolean 故不參與正交組合判斷（僅 `=== true` 才觸發 rule 8）。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
