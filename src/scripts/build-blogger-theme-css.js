#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const STYLES_ROOT = path.join(PROJECT_ROOT, 'src', 'styles', 'blogger');
const OUT_DIR = path.join(PROJECT_ROOT, 'dist-blogger', 'theme');

const TARGETS = [
  {
    entry: path.join(STYLES_ROOT, 'blogger-tokens.scss'),
    output: path.join(OUT_DIR, 'blogger-tokens.css'),
    label: 'tokens',
  },
  {
    entry: path.join(STYLES_ROOT, 'blogger-article.scss'),
    output: path.join(OUT_DIR, 'blogger-article.css'),
    label: 'article',
  },
  {
    entry: path.join(STYLES_ROOT, 'blogger-components.scss'),
    output: path.join(OUT_DIR, 'blogger-components.css'),
    label: 'components',
  },
  {
    entry: path.join(STYLES_ROOT, 'blogger-full-style.scss'),
    output: path.join(OUT_DIR, 'blogger-full-style.css'),
    label: 'full-style',
  },
];

const rel = (p) => path.relative(PROJECT_ROOT, p).split(path.sep).join('/');

function makeBanner({ source, label, builtAt }) {
  return `/*!
 * Portable Blog System - Blogger Theme CSS (${label})
 * Source: ${source}
 * Built: ${builtAt}
 * Scope: .lab-blogger-article
 *
 * Usage:
 *   1. 把這份 CSS 貼到 Blogger 主題編輯器 <head> 內，或加到文章 HTML 的 <style> 區塊
 *   2. 文章 HTML 外層用 <div class="lab-blogger-article">...內容...</div> 包覆
 *   3. 此 scope 外的 Blogger 預設主題不受影響
 */
`;
}

async function buildOne({ entry, output, label }) {
  console.log(`[build-blogger-theme] compiling ${rel(entry)}`);
  const result = sass.compile(entry, { style: 'expanded' });
  const banner = makeBanner({
    source: rel(entry),
    label,
    builtAt: new Date().toISOString(),
  });
  const content = banner + result.css;
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, content, 'utf-8');
  const sizeKB = (Buffer.byteLength(content, 'utf-8') / 1024).toFixed(2);
  console.log(`[build-blogger-theme] wrote ${rel(output)} (${sizeKB} kB)`);
}

async function main() {
  const startedAt = Date.now();
  for (const t of TARGETS) {
    await buildOne(t);
  }
  console.log(`[build-blogger-theme] done in ${Date.now() - startedAt}ms`);
}

main().catch((err) => {
  console.error('[build-blogger-theme] failed:', err);
  process.exit(1);
});
