---
title: "[validation-fixture] legacy promotion.facebook in .md"
slug: "test-legacy-fb-in-md"
status: "ready"
draft: false
date: "2026-05-18"
description: "Phase 8-h-c-pre-1 fixture：故意在 .md frontmatter 放 promotion.facebook.* 而非 .fb.md sidecar；用以保護 Phase 8-h-d-2 退場批之 regression。"
contentKind: "post"
site: "github"
primaryPlatform: "github"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
promotion:
  facebook:
    enabled: true
    page: "fan1"
    target: "auto"
    message: "Phase 8-h-c-pre-1 fixture：測試 legacy FB sidecar fallback chain（本貼文文案為 fixture 用途；不會被 build:promotion 掃到）。"
    hashtags:
      - "#fixture"
      - "#regression"
    finalUrl: "https://example.com/fixture/legacy-fb-in-md"
---

本 fixture 故意在 `.md` frontmatter 放 `promotion.facebook.*`（**legacy schema**，per Phase 8-a 已遷移至 `.fb.md` sidecar）。

**無對應 `.fb.md` sidecar**：因此 `normalize-post-output.js` 之 `fbData` 為 null；`legacyFb` 為 truthy。各 FB 欄位之 fallback chain 走 legacy 分支。

對應 `docs/phase-8h-c-pre-plan.md` §3.2 位置 #3-#8：

- **#3** `normalize-post-output.js` line 715-738 `promotion.facebook.enabled` legacyFb fallback（`enabled: true` 觸發）
- **#4** line 741-757 `promotion.facebook.target` legacyFb fallback（`target: "auto"` 觸發）
- **#5** line 759-769 `promotion.facebook.message` legacy-only（`message` 觸發）
- **#6** line 771-789 `promotion.facebook.body` legacy fallback（`fb.md.body` 不存在 → 走 legacy message fallback）
- **#7** line 791-815 `promotion.facebook.hashtags` legacyFb fallback（`hashtags` 觸發）
- **#8** line 817-844 `promotion.facebook.finalUrl` legacyFb fallback（`finalUrl` 觸發）

對 Phase 8-h-d-2（normalize FB sidecar legacy fallback 6 處退場）之 regression 用途：

- 退場前：本 fixture 之 normalize 輸出含 `normalized.promotion.facebook.{enabled,target,message,body,hashtags,finalUrl}` 完整值
- 退場後：本 fixture 之 normalize 輸出對應欄位皆為 fallback default（false / null / [] / 'auto'）
- 行為差異可作為退場是否完整之驗證點

validate 階段預期 0 new warning：
- FB 欄位皆有效（page=fan1 存在 + message 非空 + hashtags 非空 + target=auto + globally enabled）
- 故 `promotion-message-missing` / `promotion-hashtags-empty` / `promotion-page-unknown` / `promotion-page-disabled` / `promotion-target-invalid` / `promotion-globally-disabled` 皆不觸發

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:promotion` 掃到（per Phase 8-e-6-b-1 既有設計：validation-fixtures 不被 build:* scan）。
