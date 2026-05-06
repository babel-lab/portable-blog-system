// Phase 3-e-1：Blogger build 專用載入器
//
// 聚合兩個 source：
//   1. content/blogger/posts/*.md          → sourceSite: 'blogger'
//   2. content/github/posts/*.md 中
//      publishTargets.blogger.enabled === true → sourceSite: 'github-cross'
//
// 過濾沿用 load-posts.js 既有規則（draft / status: ready or published）
// 不重構 load-posts.js、不影響 build-github.js / GitHub 前台流程

import { loadPosts } from './load-posts.js';

const VALID_BLOGGER_MODES = new Set(['full', 'summary', 'redirect-card']);

export async function loadBloggerPosts() {
  const blogger = await loadPosts({ site: 'blogger' });
  const github = await loadPosts({ site: 'github' });

  // 1. blogger 來源全部納入
  const bloggerPosts = blogger.posts.map((p) => ({
    ...p,
    sourceSite: 'blogger',
  }));

  // 2. github 來源按 publishTargets.blogger.enabled 過濾
  const githubCrossPosts = [];
  const githubBloggerDisabled = [];
  for (const p of github.posts) {
    if (p.publishTargets?.blogger?.enabled === true) {
      githubCrossPosts.push({
        ...p,
        sourceSite: 'github-cross',
      });
    } else {
      githubBloggerDisabled.push({
        sourcePath: p.sourcePath,
        id: p.id ?? null,
        slug: p.slug ?? null,
        sourceSite: 'github-cross',
        reason: 'blogger:disabled',
      });
    }
  }

  // 3. 合併
  const posts = [...bloggerPosts, ...githubCrossPosts];

  // 4. mode 解析 + warning
  const warnings = [];
  for (const p of posts) {
    const rawMode = p.publishTargets?.blogger?.mode;
    if (VALID_BLOGGER_MODES.has(rawMode)) {
      p.bloggerMode = rawMode;
    } else {
      p.bloggerMode = 'full';
      const detail = rawMode === undefined ? '缺漏' : `無效值 "${rawMode}"`;
      warnings.push(
        `post slug="${p.slug}" (${p.sourceSite} / ${p.sourcePath}): blogger mode ${detail}，預設使用 full`,
      );
    }
  }

  // 5. slug 衝突偵測（不阻斷、僅 warning）
  const seen = new Map();
  for (const p of posts) {
    if (!p.slug) continue;
    if (seen.has(p.slug)) {
      const prior = seen.get(p.slug);
      warnings.push(
        `slug 衝突: "${p.slug}" 同時出現於 ${prior.sourcePath} (${prior.sourceSite}) 與 ${p.sourcePath} (${p.sourceSite})；後者寫入會覆蓋前者於 dist-blogger/posts/${p.slug}/`,
      );
    } else {
      seen.set(p.slug, p);
    }
  }

  // 6. 排序：date desc, slug asc
  posts.sort((a, b) => {
    const ad = a.date ?? '';
    const bd = b.date ?? '';
    if (ad === bd) return (a.slug ?? '').localeCompare(b.slug ?? '');
    return bd.localeCompare(ad);
  });

  // 7. 整合 filteredOut
  const filteredOut = [
    ...blogger.filteredOut.map((f) => ({ ...f, sourceSite: 'blogger' })),
    ...github.filteredOut.map((f) => ({ ...f, sourceSite: 'github-cross' })),
    ...githubBloggerDisabled,
  ];

  return {
    site: 'blogger',
    totalScanned: blogger.totalScanned + github.totalScanned,
    totalReady: posts.length,
    totalFiltered: filteredOut.length,
    bySource: {
      blogger: {
        scanned: blogger.totalScanned,
        ready: bloggerPosts.length,
        filtered: blogger.totalFiltered,
      },
      githubCross: {
        scanned: github.totalScanned,
        ready: githubCrossPosts.length,
        filtered: github.totalFiltered + githubBloggerDisabled.length,
      },
    },
    posts,
    filteredOut,
    warnings,
  };
}
