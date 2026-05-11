---
# ─────────────────────────────────────────────
# _sample-series-post.md — 系列文章範本
# ─────────────────────────────────────────────
# 1. 複製成 content/{site}/posts/{slug}.md 後，請填入實際 slug / title / description 等，並改 status: ready。
# 2. series.id 必須對應 content/settings/series.json（或 _sample.series.json）中之 series.id；id 一旦寫入不得修改（詳見 docs/series-schema.md §3）。
# 3. series.number 為系列創作編號，**非發布順序**。
#    實際發布順序以 .publish.json 之 publishedAt / status / publishedUrl 與 build script 排序規則為準（詳見 docs/series-schema.md §4）。
# 4. series.number 可手動覆寫；系統可建議補缺號之最小值（已有 #1 / #2 / #4 → 建議 #3），作者最終決定（詳見 docs/series-schema.md §5）。
# 5. 本批為 sample / template 補強；自動序號建議與 hashtags 繼承之實作屬後續批次（建議 Phase 8-e-5 / 8-e-6）。
# ─────────────────────────────────────────────

title: "示範系列文章：第 1 篇"
titleEn: "Sample Series Post: Chapter 1"
description: "本範本示範系列文章 frontmatter 結構；複製後請填入正式內容。"
contentKind: "book-review"
status: "draft"
date: "2026-05-11"
series:
  id: "we-media-ai-52"
  number: 1
  subtitle: "提問筆記本"
---

這裡放文章本文。

本範本僅示範系列文章之 frontmatter 結構；`series.titleTemplate` 之套用、`series.hashtags` 之繼承屬後續批次實作（詳見 `docs/series-schema.md` §2.4 / §8）。
