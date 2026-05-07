#!/usr/bin/env node
// Phase 7-fix-1 (E)：post scaffolding 印出器
//
// 用途：
//   為作者印出新文章 frontmatter + body 的範例模板，作為 content/{site}/posts/{date}-{slug}.md
//   的撰寫起點。完整版「自動建立檔案 + 互動式提示」尚未實作，本階段僅提供 stdout 範例。
//
// 防呆：
//   範例 body **不**以 # 開頭，從源頭規範作者直接寫 ## 段落標題。
//   原因：article header (post-detail.ejs) 已輸出 <h1 class="lab-article__title">；
//   若 markdown body 也寫 # title，markdown-it 會 render 成第 2 個 <h1>，違反 SEO「一頁一 H1」。
//   parse-markdown.js 雖已自動降級 H1 → H2，validate-content.js 也會警告 body-leading-h1，
//   但從 template 規範可避免每次倚賴 pipeline 後處理。
//
// 用法：
//   node src/scripts/new-post.js [slug]
//   → 印出可貼到 content/{site}/posts/{YYYY-MM-DD}-{slug}.md 的內容
//
// 範例：
//   node src/scripts/new-post.js my-first-post

const slugArg = process.argv[2] || 'my-new-post';
const today = new Date().toISOString().slice(0, 10);
const idDate = today.replaceAll('-', '');

const TEMPLATE = `---
id: "${idDate}-${slugArg}"
site: "github"
type: "tech-note"
primaryPlatform: "github"

title: "請填寫文章標題（系統會 render 為 article header 的 <h1>）"
titleEn: ""
slug: "${slugArg}"

date: "${today}"
updated: "${today}"
author: "Dean"

category: ""
tags: []

description: "請填寫 60 字內的文章摘要（將進入 og:description / meta description / JSON-LD）"
searchDescription: ""

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

## 簡介

請從 \`##\` 開始撰文，**不要在 body 第一行寫 \`# 標題\`**。frontmatter 的 title 已是文章主 H1；
若 body 又寫 \`# title\`，markdown-it 會 render 成第 2 個 \`<h1>\`，違反 SEO「一頁一 H1」慣例。

parse-markdown.js 雖會自動將 body 內 \`<h1>\` 降為 \`<h2>\`，validate-content.js 也會警告
\`body-leading-h1\`，但建議直接從源頭規範。

## 段落標題範例

主要內容請放這裡。可以使用 \`###\`、\`####\` 等更深層級。

## 結尾段落

文章結尾...
`;

console.log(TEMPLATE);
console.log('// ---');
console.log(`// 將以上內容存到：content/github/posts/${today}-${slugArg}.md`);
console.log(`// 然後修改 title / category / tags / description / cover / coverAlt 等欄位後即可進入 build`);
console.log(`// 完整版（自動建立檔案）尚未實作；目前請複製 stdout 內容手動建檔`);
