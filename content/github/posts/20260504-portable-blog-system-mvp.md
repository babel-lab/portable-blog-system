---
id: "20260504-portable-blog-system-mvp"
site: "github"
type: "tech-note"
primaryPlatform: "github"

title: "Portable Blog System MVP 開發筆記"
titleEn: "Portable Blog System MVP Development Notes"
slug: "portable-blog-system-mvp"

date: "2026-05-04"
updated: "2026-05-04"
author: "Dean"

category: "tech-note"
tags:
  - github
  - vite
  - static-site

description: "Portable Blog System Phase 1-A 第一篇 ready 範例文章，紀錄資料管線的最小可驗證範圍。"
searchDescription: "Portable Blog System、Phase 1、Markdown frontmatter、draft 過濾、Vite、靜態網站。"

cover: "/images/placeholders/cover-placeholder.svg"
coverAlt: "Portable Blog System MVP 開發筆記 cover placeholder"

status: "ready"
draft: false

canonical: "auto"

publishTargets:
  github:
    enabled: true
    mode: "full"
  blogger:
    enabled: false
    mode: "summary"

blocks:
  toc: false
  adsenseTop: false
  adsenseMiddle: false
  adsenseBottom: false
  hashtags: true
  socialFollow: false
  relatedPosts: false
  sidebar: false
---

# Portable Blog System MVP 開發筆記

這是 Phase 1-A 新增的第一篇 ready 範例文章，目的是驗證 Markdown frontmatter 讀取與 draft 過濾流程。

## 本階段重點

- 建立 Markdown frontmatter 讀取流程
- 建立文章資料整理邏輯
- 保留 draft 過濾邏輯
- 暫存輸出至 `.cache/data/posts.json`

正文內容將在 Phase 1-B 開始 render 為 HTML 詳細頁。
