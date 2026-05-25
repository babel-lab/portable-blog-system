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
//   node src/scripts/new-post.js [slug] [--series-id X] [--series-number N] [--series-subtitle S]
//   → 印出可貼到 content/{site}/posts/{YYYY-MM-DD}-{slug}.md 的內容
//   → 若提供 --series-id 但未提供 --series-number，stderr 將顯示建議的 next series.number
//     （從既有 markdown frontmatter 掃描；不寫入 stdout template）
//
// 範例：
//   node src/scripts/new-post.js my-first-post
//   node src/scripts/new-post.js my-post --series-id we-media-ai-52

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { suggestSeriesNumberForPosts } from './suggest-series-number.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const args = process.argv.slice(2);
let slugArg = null;
let seriesId = null;
let seriesNumber = null;
let seriesSubtitle = null;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--series-id') {
    seriesId = args[++i] ?? null;
  } else if (a === '--series-number') {
    seriesNumber = args[++i] ?? null;
  } else if (a === '--series-subtitle') {
    seriesSubtitle = args[++i] ?? null;
  } else if (slugArg === null) {
    slugArg = a;
  }
}
if (slugArg === null) slugArg = 'my-new-post';

const today = new Date().toISOString().slice(0, 10);
const idDate = today.replaceAll('-', '');

let SERIES_BLOCK = '';
if (seriesId !== null) {
  const lines = [`series:`, `  id: "${seriesId}"`];
  if (seriesNumber !== null) lines.push(`  number: ${seriesNumber}`);
  if (seriesSubtitle !== null) lines.push(`  subtitle: "${seriesSubtitle}"`);
  SERIES_BLOCK = lines.join('\n') + '\n\n';
}

// Phase 8-g-2-c-c：next series.number suggestion（stderr-only；不寫入 stdout template）
//   觸發條件：seriesId 有提供 + seriesNumber 未提供
//   保守原則：seriesNumber 手動指定時完全不顯示（per 8-g-2-c-c 原則 4）
//   I/O 失敗 graceful fallback：stderr warning；stdout template 仍正常輸出
async function maybeSuggestSeriesNumber() {
  if (seriesId === null) return;
  if (seriesNumber !== null) return;

  // 掃描範圍：依 8-g-2-c-a §B 之保守正式內容範圍
  //   納入：blogger / github 之 posts / pages；shared/posts；drafts
  //   排除：validation-fixtures 與 templates（含 sample-series-post.md，會誤判 #1 已用）
  //   不含 archive：已歸檔不影響新文章編號；per 8-g-2-c-a §B #7 保守決策
  const patterns = [
    'content/blogger/posts/**/*.md',
    'content/blogger/pages/**/*.md',
    'content/github/posts/**/*.md',
    'content/github/pages/**/*.md',
    'content/shared/posts/**/*.md',
    'content/drafts/**/*.md',
  ];
  const ignore = [
    'content/validation-fixtures/**',
    'content/templates/**',
  ];

  let files;
  try {
    files = await fg(patterns, {
      cwd: PROJECT_ROOT,
      absolute: true,
      onlyFiles: true,
      ignore,
    });
  } catch {
    process.stderr.write('[new-post] Warning: unable to suggest series.number; please set --series-number manually.\n');
    return;
  }

  const posts = [];
  for (const absPath of files) {
    try {
      const raw = await fs.readFile(absPath, 'utf-8');
      const { data } = matter(raw);
      posts.push(data);
    } catch {
      // individual file failure：跳過該檔；繼續掃描其他
    }
  }

  const { suggestedNumber, ignored } = suggestSeriesNumberForPosts(posts, seriesId);

  process.stderr.write(`[new-post] Suggested series.number for "${seriesId}": ${suggestedNumber}\n`);
  process.stderr.write(`[new-post] Add it explicitly with: --series-number ${suggestedNumber}\n`);

  if (ignored.length > 0) {
    const noun = ignored.length === 1 ? 'value' : 'values';
    process.stderr.write(`[new-post] Warning: ignored ${ignored.length} invalid series.number ${noun} while scanning.\n`);
  }
}

const TEMPLATE = `---
id: "${idDate}-${slugArg}"
site: "github"
contentKind: "tech-note"
primaryPlatform: "github"

title: "請填寫文章標題（系統會 render 為 article header 的 <h1>）"
titleEn: ""
slug: "${slugArg}"

date: "${today}"
updated: "${today}"
author: "Dean"

category: ""
tags: []

${SERIES_BLOCK}description: "請填寫 60 字內的文章摘要（將進入 og:description / meta description / JSON-LD）"
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

await maybeSuggestSeriesNumber();

console.log(TEMPLATE);
console.log('// ---');
console.log(`// 將以上內容存到：content/github/posts/${idDate}-${slugArg}.md`);
console.log(`// 然後修改 title / category / tags / description / cover / coverAlt 等欄位後即可進入 build`);
console.log(`// 完整版（自動建立檔案）尚未實作；目前請複製 stdout 內容手動建檔`);
