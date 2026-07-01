---
id: "20260701-github-pages-build-preview-workflow"
site: "github"
contentKind: "tech-note"
primaryPlatform: "github"

title: "GitHub Pages 本機建置與預覽流程筆記"
titleEn: "GitHub Pages Local Build and Preview Workflow Notes"
slug: "github-pages-build-preview-workflow"

date: "2026-07-01"
updated: "2026-07-01"
author: "Dean"

category: "tech-note"
tags:
  - "github"
  - "vite"
  - "static-site"

description: "記錄 portable blog system 的 GitHub Pages 本機工作流程草稿：dev 本機預覽、build 產出靜態站、preview 檢查 dist 結果，作為後續 Admin UI / Markdown 匯出流程的測試內容。"
searchDescription: "GitHub Pages 本機建置與預覽流程草稿，包含 npm run dev、npm run build 與 npm run preview 三段流程的用途與檢查重點。"

cover: ""
coverAlt: "GitHub Pages 本機建置與預覽流程筆記"

status: "draft"
draft: true

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
  adsenseTop: true
  adsenseMiddle: false
  adsenseBottom: true
  hashtags: true
  socialFollow: true
  relatedPosts: true
  sidebar: true
---

## 前言

這是一份草稿，用來記錄 portable blog system 的 GitHub Pages 本機工作流程，同時作為 Admin UI / Markdown 匯出流程的測試內容。

本文只描述本機端的 build 與 preview 流程，不涉及 deploy 或 gh-pages 實際發布。實際 deploy 邊界會在文末單獨說明，避免把本機檢查跟正式發布混為一談。

## 適用情境

這份筆記適合以下情況閱讀：

- 剛把一篇 Markdown 草稿改到一個段落，想在本機看看它排版起來長什麼樣子。
- 準備把 `dist` 產出交給部署流程前，想先在本機確認產物沒有明顯破版或缺頁。
- 在測試 Admin UI 匯出的 Markdown 是否能被正常讀入、解析、渲染。

如果只是要改文字內容、還沒到要看整站樣子的階段，其實不一定每次都要跑完整流程；先用 `npm run dev` 邊改邊看通常就足夠了。

## 本地開發流程

GitHub 靜態站第一版提供三個常用指令，彼此分工不同：

```bash
npm run dev       # 本機即時預覽，邊改邊看
npm run build     # 產出靜態站到 dist
npm run preview   # 在本機檢視 build 後的 dist 結果
```

`npm run dev` 用於本機預覽 GitHub 靜態站與 Design System 頁，適合寫作與調樣式時邊改邊看。

`npm run build` 把整站產出到 `dist`，作為後續輸出的來源。

`npm run preview` 用於在本機檢視 build 後的 `dist` 結果，確認實際產物與 dev 模式看到的一致。

### build 前檢查

在跑 build 之前，通常先確認內容層沒有問題再往下走。這一版主要靠 `validate:content` 做內容檢查：

```bash
npm run validate:content
```

重點看的是 error 數是否為 0；warning 可以視情況接受，但不應該因為這次改動而多出新的 error。草稿文章（`status: draft` / `draft: true`）會被排除在正式輸出之外，所以它不會進 `dist`，也不會影響正式站的呈現。

### preview 檢查

build 完成後，用 preview 檢視 `dist` 時，主要確認幾個頁面是否正常：

- 首頁與文章列表頁的卡片是否正常排列。
- 文章詳細頁的標題、日期、內文與各區塊是否完整。
- 分類頁與標籤頁是否列出對應文章。
- 草稿文章是否依 status 正確被過濾，沒有意外出現在正式輸出裡。

preview 看到的是真正要交出去的產物，所以這一步比 dev 模式更接近「上線後的樣子」。

### deploy 邊界

這份筆記到 preview 為止。實際的 deploy（推送到 gh-pages、更新 GitHub Pages 線上站）屬於另一個獨立步驟，需要另外的授權與檢查流程，不在本機工作流程的範圍內。

換句話說：本機可以放心反覆 build / preview，因為這些動作都不會碰到線上站；只有明確進入 deploy 步驟時，產物才會真正對外發布。

## 常見錯誤

草稿階段常遇到的幾個狀況：

- 改完內容忘了先跑 `validate:content`，結果 build 後才發現 frontmatter 少了必要欄位。
- 以為草稿沒出現在列表頁是 bug，其實是 draft 過濾正常運作的結果。
- 把 dev 模式看到的畫面當成最終產物，忽略了要用 preview 檢查 `dist`。

## Checklist

一份給自己用的簡易草稿檢查清單：

- [ ] 內容已存檔，frontmatter 欄位完整。
- [ ] `npm run validate:content` 為 0 error。
- [ ] 需要看整站時已跑 `npm run build`。
- [ ] 用 `npm run preview` 確認 `dist` 產物正常。
- [ ] 草稿文章確實被過濾，未出現在正式輸出。
- [ ] deploy 為獨立步驟，本機階段不觸碰 gh-pages。

## 結論

這份草稿維持 draft 狀態，尚未進入正式輸出流程。後續可再補齊實際操作紀錄與截圖，並在正式發布前把 deploy 步驟的檢查一併整理進來。
