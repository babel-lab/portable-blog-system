#!/usr/bin/env node
// Phase 4-b：FB 推廣文案 build 骨架
// 範圍：讀 settings 與 posts、依 promotion.facebook.enabled 過濾、
//       輸出 dist-promotion/facebook/build-manifest.json
// 不實作 URL/UTM finalUrl 解析（屬 4-c）
// 不寫個別 .txt（屬 4-e）
// 不寫 all-posts-index.txt（屬 4-f）
// 不 render EJS 模板（屬 4-d）
// 不新增 validate-content 規則（屬 4-g）

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSettings } from './load-settings.js';
import { loadPosts } from './load-posts.js';
import { buildFacebookUrl } from './ga4-url-builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist-promotion');
const FB_DIR = path.join(DIST_DIR, 'facebook');
const MANIFEST_FILE = path.join(FB_DIR, 'build-manifest.json');

const rel = (p) => path.relative(PROJECT_ROOT, p).split(path.sep).join('/');

function parseMode(argv) {
  const flag = argv.find((a) => a.startsWith('--mode='));
  if (!flag) return 'build';
  return flag.split('=')[1] || 'build';
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// ---- 過濾邏輯 ------------------------------------------------------------

// 回傳 { include: bool, reason: string, page: string|null, fb: object|null }
function classifyFacebook(post, fbConfig) {
  const promo = post.promotion;
  if (!promo) return { include: false, reason: 'no-promotion-block' };

  const fb = promo.facebook;
  if (!fb || typeof fb !== 'object') return { include: false, reason: 'no-facebook-block' };

  if (fb.enabled !== true) return { include: false, reason: 'facebook-not-enabled' };

  const page = fb.page || fbConfig.defaultPage || null;
  if (!page) return { include: false, reason: 'no-page-specified' };

  const pageDef = fbConfig.pages?.[page];
  if (!pageDef) return { include: false, reason: `unknown-page:${page}` };
  if (pageDef.enabled !== true) return { include: false, reason: `page-disabled:${page}` };

  return { include: true, reason: 'ok', page, fb };
}

// ---- manifest 條目組裝（4-b 不算 finalUrl/UTM）---------------------------

function buildManifestEntry(post, page, fb, settings) {
  const hashtags = Array.isArray(fb.hashtags) ? fb.hashtags.filter(Boolean) : [];
  const { baseUrl, finalUrl, urlSource, urlReason } = buildFacebookUrl({
    post,
    fb,
    page,
    settings,
  });
  return {
    site: post.site ?? null,
    slug: post.slug ?? null,
    sourcePath: post.sourcePath,
    id: post.id ?? null,
    title: post.title ?? null,
    page,
    fbTitle: fb.title || null,
    message: fb.message || null,
    target: fb.target ?? 'auto',
    hashtags,
    hashtagCount: hashtags.length,
    note: fb.note || null,
    baseUrl,
    finalUrl,
    urlSource,
    urlReason,
  };
}

// ---- 主流程 --------------------------------------------------------------

async function main() {
  const startedAt = Date.now();
  const mode = parseMode(process.argv.slice(2));
  console.log(`[build-promotion] mode=${mode}`);

  const settings = await loadSettings();
  const fbConfig = settings.promotion?.facebook ?? {};
  const fbGloballyEnabled = fbConfig.enabled === true;

  // 兩個 source：github + blogger（status:ready/published 已由 loadPosts 過濾）
  const github = await loadPosts({ site: 'github' });
  const blogger = await loadPosts({ site: 'blogger' });

  const sources = [
    { site: 'github', loaded: github },
    { site: 'blogger', loaded: blogger },
  ];

  const enabledEntries = [];
  const filteredEntries = [];

  for (const { site, loaded } of sources) {
    // status/draft 已被過濾的，仍記入 filtered（保留診斷訊息）
    for (const f of loaded.filteredOut) {
      filteredEntries.push({
        site,
        sourcePath: f.sourcePath,
        slug: f.slug ?? null,
        reason: f.reason, // e.g. draft:true / status:xxx
      });
    }

    // ready/published 的 post 再依 promotion 規則篩
    for (const post of loaded.posts) {
      if (!fbGloballyEnabled) {
        filteredEntries.push({
          site,
          sourcePath: post.sourcePath,
          slug: post.slug ?? null,
          reason: 'facebook-globally-disabled',
        });
        continue;
      }
      const verdict = classifyFacebook(post, fbConfig);
      if (!verdict.include) {
        filteredEntries.push({
          site,
          sourcePath: post.sourcePath,
          slug: post.slug ?? null,
          reason: verdict.reason,
        });
        continue;
      }
      enabledEntries.push(buildManifestEntry(post, verdict.page, verdict.fb, settings));
    }
  }

  // 排序：site asc, slug asc（穩定輸出，方便比對）
  enabledEntries.sort((a, b) => {
    const s = (a.site ?? '').localeCompare(b.site ?? '');
    if (s !== 0) return s;
    return (a.slug ?? '').localeCompare(b.slug ?? '');
  });

  // ---- console 摘要 ----
  const stats = {
    scanned: github.totalScanned + blogger.totalScanned,
    enabled: enabledEntries.length,
    filtered: filteredEntries.length,
    bySource: {
      github: {
        scanned: github.totalScanned,
        enabled: enabledEntries.filter((e) => e.site === 'github').length,
        filtered: filteredEntries.filter((e) => e.site === 'github').length,
      },
      blogger: {
        scanned: blogger.totalScanned,
        enabled: enabledEntries.filter((e) => e.site === 'blogger').length,
        filtered: filteredEntries.filter((e) => e.site === 'blogger').length,
      },
    },
  };

  console.log(
    `[build-promotion] sources scanned: github=${stats.bySource.github.scanned}, blogger=${stats.bySource.blogger.scanned}`,
  );
  console.log(
    `[build-promotion]   github source: ${stats.bySource.github.enabled} enabled / ${stats.bySource.github.filtered} filtered`,
  );
  console.log(
    `[build-promotion]   blogger source: ${stats.bySource.blogger.enabled} enabled / ${stats.bySource.blogger.filtered} filtered`,
  );
  console.log(
    `[build-promotion] total enabled: ${stats.enabled} / total filtered: ${stats.filtered}`,
  );
  for (const f of filteredEntries) {
    console.log(`[build-promotion]   filtered: ${f.sourcePath} (${f.reason})`);
  }
  if (!fbGloballyEnabled) {
    console.warn(
      '[build-promotion] WARNING: promotion.facebook.enabled !== true — 全域停用，本次不收任何 enabled posts',
    );
  }
  const urlMissingCount = enabledEntries.filter((e) => !e.finalUrl).length;
  if (urlMissingCount > 0) {
    console.warn(
      `[build-promotion] WARNING: ${urlMissingCount} post(s) finalUrl=null（site URL 未設或 publishedUrl 缺漏）`,
    );
  }

  // ---- 寫 manifest ----
  const manifest = {
    generatedAt: new Date().toISOString(),
    mode,
    config: {
      facebookEnabled: fbGloballyEnabled,
      defaultPage: fbConfig.defaultPage ?? null,
      pages: Object.keys(fbConfig.pages ?? {}),
    },
    stats,
    posts: enabledEntries,
    filtered: filteredEntries,
  };

  await writeJson(MANIFEST_FILE, manifest);
  console.log(`[build-promotion] wrote ${rel(MANIFEST_FILE)}`);
  console.log(`[build-promotion] done in ${Date.now() - startedAt}ms`);
}

main().catch((err) => {
  console.error('[build-promotion] failed:', err);
  process.exit(1);
});
