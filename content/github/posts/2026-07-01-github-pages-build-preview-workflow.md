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

這是一份草稿骨架，用來記錄 portable blog system 的 GitHub Pages 本機工作流程，同時作為 Admin UI / Markdown 匯出流程的測試內容。

本文只描述本機端流程，不涉及 deploy 或 gh-pages 實際發布。

## 三段流程

GitHub 靜態站第一版提供三個常用指令：

`npm run dev` 用於本機預覽 GitHub 靜態站與 Design System 頁，方便邊改邊看。

`npm run build` 產出靜態站到 dist，作為正式輸出的來源。

`npm run preview` 用於在本機檢視 build 後的 dist 結果，確認產出與預期一致。

## 檢查重點

本機預覽時主要確認首頁、文章列表、文章詳細頁、分類頁與標籤頁是否正常顯示，草稿文章是否依 status 正確被過濾。

## 結論

這份草稿維持 draft 狀態，尚未進入正式輸出流程，後續可再補齊實際操作紀錄與截圖。
