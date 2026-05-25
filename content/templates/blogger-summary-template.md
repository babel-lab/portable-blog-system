---
# 用途：本範本示範 GitHub primary + Blogger summary mode 之 publishTargets 組合
# （GitHub 出 full、Blogger 兼出 summary 導流卡；site / contentKind / primaryPlatform 皆為 github）。
# 不是 Blogger primary 之獨立文章範本。
# Blogger primary 之書評 / 雜誌 / 下載類文章請使用：
#   - content/templates/blogger-book-review-template.md
#   - content/templates/blogger-magazine-review-template.md
#   - content/templates/blogger-download-template.md
id: "{YYYYMMDD-slug}"
site: "github"
contentKind: "tech-note"
primaryPlatform: "github"
title: "文章標題"
titleEn: "GitHub Pages Free Hosting Limits and Blog Planning"
slug: "github-pages-blog-planning"
date: "2026-05-04"
updated: "2026-05-04"
author: "Dean"
category: "tech-note"
tags: ["github", "vite", "static-site"]
description: "整理 GitHub Pages 免費空間限制與可搬家部落格規劃。"
searchDescription: "GitHub Pages 免費空間、Vite 靜態網站、Markdown 部落格、Google AdSense 與搬家規劃。"
cover: ""
coverAlt: ""
status: "draft"
draft: true
canonical: "auto"
publishTargets:
  github:
    enabled: true
    mode: "full"
  blogger:
    enabled: true
    mode: "summary"
blocks:
  toc: false
  adsenseTop: true
  adsenseMiddle: false
  adsenseBottom: true
  hashtags: true
  socialFollow: true
  relatedPosts: true
  sidebar: true
relatedLinks: []
otherLinks: []
---

這是一篇初始化範例文章。Phase 1 會建立 Markdown 讀取與 frontmatter 解析。

