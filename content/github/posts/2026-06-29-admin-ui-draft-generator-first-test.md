---
id: "20260629-admin-ui-draft-generator-first-test"
site: "github"
contentKind: "tech-note"
primaryPlatform: "github"

title: "Admin UI 草稿產生器第一次實測紀錄"
titleEn: "Admin UI Draft Generator First Test Notes"
slug: "admin-ui-draft-generator-first-test"

date: "2026-06-29"
updated: "2026-06-29"
author: "Dean"

category: "tech-note"
tags:
  - "github"
  - "vite"
  - "static-site"

description: "記錄 Blogger/GitHub portable blog system 的 Admin UI 草稿產生器第一次實測流程，確認表單填寫、Markdown 產出、檔名規則與 validation 流程可用。"
searchDescription: "Admin UI 草稿產生器第一次實測紀錄，包含 New post draft、Markdown export、draft frontmatter、target path 與 validation 流程。"

cover: ""
coverAlt: "Admin UI 草稿產生器第一次實測紀錄"

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

今天完成了 Blogger/GitHub portable blog system 的 Admin UI 草稿產生器第一次手動實測。

這次測試的目標不是正式發文，而是確認 Phase 1 的最小可用流程是否真的能走完：從 Admin UI 填入文章資料，產生 Markdown draft，手動存到指定路徑，再執行內容驗證。

## 測試目標

本次主要確認以下幾件事：

New post draft 入口是否可以正常開啟
title、slug、date 是否能正確控制匯出按鈕狀態
summary strip 是否會同步顯示 slug、filename、target path 與 ready 狀態
Markdown 是否能正常產生
檔名是否符合 {date}-{slug}.md
draft frontmatter 是否維持 status: "draft" 與 draft: true
手動存檔後，validation 是否維持 0 error

## 實測流程

實測時先啟動本機開發環境，進入 Admin 頁面，打開 New post draft 區塊。

接著在表單中填入文章基本資料，確認 title、slug、date 尚未完整時，Copy markdown、Download .md、Copy target path 三個按鈕都會維持 disabled。當三個必要欄位都填妥後，按鈕才會啟用。

完成表單後，透過 Admin UI 產生 Markdown draft，並手動存到系統提示的 target path。

## 觀察結果

本次測試確認 Admin UI 的 export-side MVP 已經可以實際使用。

檔名、slug、target path 的同步行為符合預期；draft 狀態也沒有進入正式內容輸出流程。validation 結果維持 0 error，代表新增 draft 不會破壞既有內容檢查。

測試過程中也確認了一件事：如果手動存檔時檔名沒有照 UI 顯示的 filename 儲存，就可能造成檔名與 frontmatter slug 不一致。這屬於操作流程要注意的地方，不是 Admin UI 本身的錯誤。

## 結論

這次測試代表 Admin Markdown export-side Phase 1 已經達到可以手動建立草稿的狀態。

接下來可以開始用 Admin UI 建立真正的文章草稿，但仍維持目前邊界：Phase 1 只負責產出 Markdown draft；Markdown 匯入表單、視覺化編輯器與 blocks toggle 仍屬於後續 phase。
