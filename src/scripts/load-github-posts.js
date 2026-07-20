// Phase 9-i-f-b：GitHub build 專用載入器
//
// 聚合兩個 source：
//   1. content/github/posts/*.md          → sourceSite: 'github'
//   2. content/blogger/posts/*.md 中
//      publishTargets.github.enabled === true → sourceSite: 'blogger-cross'
//
// 過濾沿用 load-posts.js 既有規則（draft / status: ready or published）
// mirror src/scripts/load-blogger-posts.js（方向相反；不重構 load-posts.js）
// 不影響 build-blogger.js / Blogger 流程
//
// Phase 20260720-publish-target-stage Slice 2：GitHub production selector 額外要求
// `publishTargets.github.stage === "production"`（缺省視同 production；invalid fail-closed）。
// 平台隔離：blogger.stage 之值不影響此處判定。

import { loadPosts } from './load-posts.js';
import { isProductionStage } from './publish-stage.js';

export async function loadGithubPosts({ settings = {} } = {}) {
  // Phase 8-f-2-b：plumbing — settings 由 caller 經 loadGithubPosts 轉發至內部之 loadPosts
  const github = await loadPosts({ site: 'github', settings });
  const blogger = await loadPosts({ site: 'blogger', settings });

  // 1. github 來源：仍全部納入之前，額外套 GitHub production stage 過濾。
  //    missing stage → production（backward compat；本 repo 現無文章宣告 stage）；
  //    preview / invalid → 排除、記入 filteredOut（reason: 'github:stage-not-production'）。
  const githubPosts = [];
  const githubStageFiltered = [];
  for (const p of github.posts) {
    if (isProductionStage(p.publishTargets?.github?.stage, 'github')) {
      githubPosts.push({ ...p, sourceSite: 'github' });
    } else {
      githubStageFiltered.push({
        sourcePath: p.sourcePath,
        id: p.id ?? null,
        slug: p.slug ?? null,
        sourceSite: 'github',
        reason: 'github:stage-not-production',
      });
    }
  }

  // 2. blogger 來源按 publishTargets.github.enabled 過濾 + GitHub production stage 過濾。
  const bloggerCrossPosts = [];
  const bloggerGithubDisabled = [];
  for (const p of blogger.posts) {
    if (p.publishTargets?.github?.enabled !== true) {
      bloggerGithubDisabled.push({
        sourcePath: p.sourcePath,
        id: p.id ?? null,
        slug: p.slug ?? null,
        sourceSite: 'blogger-cross',
        reason: 'github:disabled',
      });
      continue;
    }
    if (!isProductionStage(p.publishTargets?.github?.stage, 'github')) {
      bloggerGithubDisabled.push({
        sourcePath: p.sourcePath,
        id: p.id ?? null,
        slug: p.slug ?? null,
        sourceSite: 'blogger-cross',
        reason: 'github:stage-not-production',
      });
      continue;
    }
    bloggerCrossPosts.push({ ...p, sourceSite: 'blogger-cross' });
  }

  // 3. 合併
  const posts = [...githubPosts, ...bloggerCrossPosts];

  // 4. slug 衝突偵測（不阻斷、僅 warning）
  const warnings = [];
  const seen = new Map();
  for (const p of posts) {
    if (!p.slug) continue;
    if (seen.has(p.slug)) {
      const prior = seen.get(p.slug);
      warnings.push(
        `slug 衝突: "${p.slug}" 同時出現於 ${prior.sourcePath} (${prior.sourceSite}) 與 ${p.sourcePath} (${p.sourceSite})；後者寫入會覆蓋前者於 dist/posts/${p.slug}/`,
      );
    } else {
      seen.set(p.slug, p);
    }
  }

  // 5. 排序：date desc, slug asc
  posts.sort((a, b) => {
    const ad = a.date ?? '';
    const bd = b.date ?? '';
    if (ad === bd) return (a.slug ?? '').localeCompare(b.slug ?? '');
    return bd.localeCompare(ad);
  });

  // 6. 整合 filteredOut
  const filteredOut = [
    ...github.filteredOut.map((f) => ({ ...f, sourceSite: 'github' })),
    ...blogger.filteredOut.map((f) => ({ ...f, sourceSite: 'blogger-cross' })),
    ...githubStageFiltered,
    ...bloggerGithubDisabled,
  ];

  return {
    site: 'github',
    totalScanned: github.totalScanned + blogger.totalScanned,
    totalReady: posts.length,
    totalFiltered: filteredOut.length,
    bySource: {
      github: {
        scanned: github.totalScanned,
        ready: githubPosts.length,
        filtered: github.totalFiltered + githubStageFiltered.length,
      },
      bloggerCross: {
        scanned: blogger.totalScanned,
        ready: bloggerCrossPosts.length,
        filtered: blogger.totalFiltered + bloggerGithubDisabled.length,
      },
    },
    posts,
    filteredOut,
    warnings,
  };
}
