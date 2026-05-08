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

import ejs from 'ejs';

import { loadSettings } from './load-settings.js';
import { loadPosts } from './load-posts.js';
import { buildFacebookUrl } from './ga4-url-builder.js';
// Phase 8-c-4：placeholder resolver helper（純函式；對 .fb.md body 做 placeholder 替換）
import { resolvePlaceholders } from './resolve-placeholders.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist-promotion');
const FB_DIR = path.join(DIST_DIR, 'facebook');
const VIEWS_DIR = path.join(PROJECT_ROOT, 'src', 'views');
const FB_POST_TEMPLATE = path.join(VIEWS_DIR, 'promotion', 'facebook-post.ejs');
const MANIFEST_FILE = path.join(FB_DIR, 'build-manifest.json');
const INDEX_FILE = path.join(FB_DIR, 'all-posts-index.txt');

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

async function writeText(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf-8');
}

// 4-e：將單筆 enabled entry render 成 FB 貼文純文字並寫到
// dist-promotion/facebook/{site}/{slug}.txt。回傳該檔的相對路徑。
//
// Phase 8-c-4：
//   - 若 entry.resolvedFacebookBody 存在（由 buildManifestEntry 自 .fb.md sidecar 解析得來），
//     直接使用解析後文字作為 .txt 內容，跳過 EJS template 路徑。
//     理由：.fb.md body 設計為完整 FB 貼文文字（fb-sidecar-schema.md §4），不需 EJS framing。
//   - 否則沿用既有 EJS template 路徑（從 promotion.facebook frontmatter 渲染）。
//   - .fb.md 不存在或 body 空 → 既有行為完全不變。
//   - unresolved placeholder 由 resolvePlaceholders 保留為原文（不在此處再處理）。
async function renderAndWriteFacebookText(entry) {
  let txt;
  if (typeof entry.resolvedFacebookBody === 'string' && entry.resolvedFacebookBody !== '') {
    txt = entry.resolvedFacebookBody;
  } else {
    txt = await ejs.renderFile(
      FB_POST_TEMPLATE,
      { post: entry },
      { async: true },
    );
  }
  const txtFile = path.join(FB_DIR, entry.site, `${entry.slug}.txt`);
  await writeText(txtFile, txt.trimEnd() + '\n');
  return rel(txtFile);
}

// 4-f：依 enabled entries + stats 組裝人讀索引純字串。
// 不使用 EJS（依限制 9 / §29 不過度工程化）。
function buildIndexText({ generatedAt, mode, stats, enabledEntries, fbGloballyEnabled }) {
  const urlMissing = enabledEntries.filter((e) => !e.finalUrl).length;
  const lines = [];
  lines.push('# FB Promotion Index');
  lines.push('');
  lines.push(`generated:     ${generatedAt}`);
  lines.push(`mode:          ${mode}`);
  lines.push(`total enabled: ${stats.enabled}`);
  lines.push(
    `by source:     github=${stats.bySource.github.enabled}, blogger=${stats.bySource.blogger.enabled}`,
  );
  lines.push(`url missing:   ${urlMissing}`);
  if (!fbGloballyEnabled) {
    lines.push('');
    lines.push('NOTE: facebook globally disabled (promotion.facebook.enabled !== true)');
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  if (enabledEntries.length === 0) {
    lines.push('(no enabled posts)');
  } else {
    enabledEntries.forEach((entry, i) => {
      if (i > 0) lines.push('');
      lines.push(`## ${i + 1}. ${entry.site} / ${entry.slug}`);
      lines.push('');
      lines.push(`title:    ${entry.fbTitle || entry.title || ''}`);
      lines.push(`page:     ${entry.page || ''}`);
      lines.push(`hashtags: ${(entry.hashtags || []).join(' ')}`);
      lines.push(
        `url:      ${entry.finalUrl || '(URL 待設定 site.config.json githubSiteUrl / bloggerSiteUrl)'}`,
      );
      if (entry.urlReason) {
        lines.push(`reason:   ${entry.urlReason}`);
      }
      lines.push(`txt:      ${entry.txtPath || ''}`);
    });
  }

  return lines.join('\n').trimEnd() + '\n';
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
  const entry = {
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

  // Phase 8-c-4：若 .fb.md sidecar 存在且 body 非空，解析 placeholder 並掛到 entry
  //   - 不修改 post.sidecars.facebook.body（傳入 helper 為 immutable 字串）
  //   - 不修改 post 欄位、不新增 post.facebook、不覆蓋 post.publish
  //   - resolved 文字僅作為輸出用變數 entry.resolvedFacebookBody
  //   - unresolved placeholder 由 resolvePlaceholders 保留原文（soft-fail）
  //   - console.warn 提示 unresolved；不 throw、不 process.exit（hard-fail 已由 8-c-3 validate-content 負責）
  const fbSidecar = post.sidecars?.facebook;
  if (
    fbSidecar &&
    fbSidecar.exists === true &&
    typeof fbSidecar.body === 'string' &&
    fbSidecar.body.trim() !== ''
  ) {
    const fbData =
      fbSidecar.data && typeof fbSidecar.data === 'object' ? fbSidecar.data : null;
    const ctx = {
      post,
      publish: post.publish ?? null,
      facebook: fbData,
      sourceCollection: post.sourceCollection,
    };
    const opts = {
      target: fbData?.target,
      primaryPlatform: fbData?.primaryPlatform ?? post.primaryPlatform,
    };
    const resolved = resolvePlaceholders(fbSidecar.body, ctx, opts);
    entry.resolvedFacebookBody = resolved.resolvedText;
    entry.facebookSidecar = {
      sourcePath: fbSidecar.path,
      placeholders: resolved.placeholders,
      replacementsCount: resolved.replacements.length,
      unresolvedPlaceholders: resolved.unresolvedPlaceholders,
    };

    if (resolved.unresolvedPlaceholders.length > 0) {
      const summary = resolved.unresolvedPlaceholders
        .map((u) => `{{ ${u.name} }}=${u.reason}`)
        .join(', ');
      console.warn(
        `[build-promotion] WARNING: .fb.md placeholder unresolved in ${post.sourcePath}: ${summary}`,
      );
    }
  }

  return entry;
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

  // ---- 4-e：render 並寫個別 .txt（在寫 manifest 前完成，讓 txtPath 進 manifest）----
  let txtCount = 0;
  for (const entry of enabledEntries) {
    const txtPath = await renderAndWriteFacebookText(entry);
    entry.txtPath = txtPath;
    txtCount += 1;
    const note = entry.finalUrl ? '' : ' (URL fallback)';
    console.log(`[build-promotion] wrote ${txtPath}${note}`);
  }
  if (txtCount > 0) {
    console.log(`[build-promotion] wrote ${txtCount} text file(s)`);
  }

  // ---- 4-f：寫 all-posts-index.txt（在寫 manifest 前；與 manifest 共用 generatedAt）----
  const generatedAt = new Date().toISOString();
  const indexText = buildIndexText({
    generatedAt,
    mode,
    stats,
    enabledEntries,
    fbGloballyEnabled,
  });
  await writeText(INDEX_FILE, indexText);
  console.log(`[build-promotion] wrote ${rel(INDEX_FILE)}`);

  // ---- 寫 manifest ----
  const manifest = {
    generatedAt,
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
