---
id: "20260626-bopomofo-practice-cards-access"
site: "blogger"
contentKind: "download"
primaryPlatform: "blogger"
title: "<gated page title placeholder — 注音字卡下載申請表>"
titleEn: ""
slug: "bopomofo-practice-cards-access"
date: "2026-06-26"
updated: "2026-06-26"
author: "Dean"
category: "download"
tags: []
description: "<form intro copy placeholder — visible 表單前說明>"
searchDescription: "<usage restriction copy placeholder — visible 使用限制摘要>"
cover: ""
coverAlt: ""
status: "draft"
draft: true
canonical: ""
publishTargets:
  github:
    enabled: false
    mode: "full"
  blogger:
    enabled: true
    mode: "full"
blocks:
  toc: false
  adsenseTop: true
  adsenseMiddle: false
  adsenseBottom: true
  hashtags: false
  socialFollow: false
  relatedPosts: false
  sidebar: false
pageType: "gated_download"
seo:
  indexing: "noindex-follow"
includeInSitemap: false
includeInListings: false
platformPolicy:
  blogger:
    indexing: "noindex-nofollow"
    includeInListings: false
  github:
    indexing: "noindex-nofollow"
    includeInListings: false
    includeInSitemap: false
  future:
    indexing: "noindex-nofollow"
    includeInListings: false
gatedDownload:
  mechanism: "google-form"
  formEmbedUrl: ""
  postSubmitResource: "drive-link"
downloadFunnel:
  role: "gated_page"
  entryPages:
    - "bopomofo-practice-cards-entry"
---

> 本篇為 Blogger 注音字卡 family 之 **gated download 草稿**，於 Phase `20260626-blogger-bopomofo-funnel-content-pair-landing-a` 落地。所有 visible 文案與真實 Form / Drive 連結皆為 placeholder / 空字串。`status: draft`、`pageType: gated_download`、`seo.indexing: noindex-follow`、`includeInSitemap: false`、`includeInListings: false`。GitHub Pages 端會由 `pageType: gated_download` 自動推導 robots `noindex, follow`；**Blogger 端 NO INDEX 須 Dean 於 Blogger 後台「設定 → 搜尋偏好 → 自訂 robots 標頭標記」手動設定**（系統無法 inject Blogger head；per spec-lock §2.5、preflight §6.1）。

## 表單說明

`<form intro copy placeholder>` —— Dean 後續填入：填表前說明、隱私 / 資料用途說明、預期送出後流程。

## Google Form 嵌入

`<google form public embed placeholder>` —— `gatedDownload.formEmbedUrl` 當前為空字串；遷移當下由 Dean 填入 **public embed URL**（唯一可入 repo 之 Form 連結）；**禁** edit URL / response URL（per spec-lock §3.2 / preflight §7 / input packet §6）。

## 使用限制

`<usage restriction copy placeholder>` —— 本素材僅供個人、家庭與教學使用，請勿轉售或大量散布（CLAUDE.md §13）。

## 表單送出後顯示

`<post-submit display copy placeholder>` —— 表單送出後始顯示之文案；真實下載 / 資源連結由 Dean 於 Google Form 端設定。repo 端僅以列舉值 `gatedDownload.postSubmitResource: drive-link` 記錄資源類型（per spec-lock §3.3），**不**寫入真實 Drive URL / Drive ID / file ID / OAuth token / API key / respondent data。

## 意見回饋與支援

`<feedback / support copy placeholder>` —— Dean 後續填入聯絡 / 回饋 channels（visible）。

## 注意事項

- 本草稿為 Phase `20260626-blogger-bopomofo-funnel-content-pair-landing-a` 之 layer B gated 落地。
- `entryPages: ["bopomofo-practice-cards-entry"]` 互指對端 entry slug；對端 entry 之 `targetGatedPage` 指回本頁 slug → F8 reciprocity 0 warning。
- `publishTargets.github.enabled: false`、`publishTargets.blogger.enabled: true`。GitHub funnel = `future_possible_not_active`；本草稿不建立 GitHub 端 funnel content。
- 後續 Dean 補齊 wording、真實 Form embed、Blogger 後台 NO INDEX 確認後，再開獨立 publish phase。
