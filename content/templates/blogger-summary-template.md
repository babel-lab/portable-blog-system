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

## Blogger 摘要開場

{1–2 段開場文字；點出 GitHub 全文之主題、適合誰讀、為什麼值得看}

## 重點摘要

{以條列呈現全文最重要的 3–5 個重點；不寫完整論述；保留懸念}

## 為什麼值得看全文

{說明完整論述、程式碼範例、實作細節等 Blogger 摘要無法承載之內容只在 GitHub 全文展開；引發前往閱讀之動機}

## GitHub 全文連結提示

{此區以文字提示讀者前往 GitHub 全文，例如「完整內容請見下方相關連結之 GitHub 文章」。**不要在 body 寫死 GitHub URL**；正式 URL 由 build pipeline 依 frontmatter `publishTargets.github` / `canonical` 自動產生並注入 summary CTA 區塊。}

## 延伸閱讀

{本站其他相關文章；正式 URL 待目標文章發布後於 frontmatter `relatedLinks` 回填}

## Hashtags 提示

{frontmatter `tags` 已含主要標籤，於 Blogger render 時自動產生 hashtag 區；本區可作者手動補充建議搭配之關鍵字或主題提示，不直接出現 `#` 字元以免與 Blogger 自動 hashtag 區重疊}


