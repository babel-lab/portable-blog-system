---
title: "[validation-fixture] FB post URL metadata populated"
slug: "test-fb-post-url-populated"
status: "published"
date: "2026-05-21"
description: "Phase 20260521-pm-31 fixture：搭配同名 .fb.md sidecar 提供 fbPostUrl / fbPostedAt / fbPostId / fbCampaign populated 樣本；位於 content/validation-fixtures/ 不會被 build:* 掃到。"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
---

本 fixture 之 `_test-fb-post-url-populated.fb.md` sidecar 含完整 4 個 FB post URL metadata 欄位（per `docs/fb-sidecar-schema.md` §3.1 / §3.5）：

- `fbPostUrl` 為 schema-valid placeholder（明顯 fixture token：`pfbid0fixture0001`）
- `fbPostedAt` 為 ISO 8601 datetime + `+08:00` timezone
- `fbPostId` 與 fbPostUrl token 對齊
- `fbCampaign` 為 fixture campaign 標記

本 post `.md` 之 `status: "published"` 為觸發未來 Option B validate-level `fbPublished` rule 之 positive case（per Admin loader pm-11 P3 條件：`enabled=true && status=='published' && hasFbPostUrl` → ok）。

本檔位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:promotion` / `build:blogger` 掃到。
