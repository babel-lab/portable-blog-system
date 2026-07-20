// Phase 3-e-1：Blogger build 專用載入器
//
// 聚合兩個 source：
//   1. content/blogger/posts/*.md          → sourceSite: 'blogger'
//   2. content/github/posts/*.md 中
//      publishTargets.blogger.enabled === true → sourceSite: 'github-cross'
//
// 過濾沿用 load-posts.js 既有規則（draft / status: ready or published）
// 不重構 load-posts.js、不影響 build-github.js / GitHub 前台流程
//
// Phase 20260720-publish-target-stage Slice 2：Blogger production selector 額外要求
// `publishTargets.blogger.stage === "production"`（缺省視同 production；invalid fail-closed）。
// 平台隔離：github.stage 之值不影響此處判定。build-blogger.js 為唯一 caller，透過本
// selector 繼承 production stage 過濾；本 selector 不影響 preview 流程（blogger-preview-plan.js
// / build-blogger-preview.js 走自己 draft-aware 路線，per 契約 §5）。

import { loadPosts } from './load-posts.js';
import { isProductionStage } from './publish-stage.js';

// Phase 20260717-B2-a：additive export（行為不變；本檔內部沿用同一 Set）。
//   供 blogger-preview-plan.js 之 draft-aware preview planner 以真實列舉判定 bloggerMode，
//   避免另抄一份規格產生 drift（沿用 load-posts.js 之 classify additive export 慣例）。
export const VALID_BLOGGER_MODES = new Set(['full', 'summary', 'redirect-card']);

export async function loadBloggerPosts({ settings = {} } = {}) {
  // Phase 8-f-2-b：plumbing — settings 由 caller 經 loadBloggerPosts 轉發至內部之 loadPosts
  const blogger = await loadPosts({ site: 'blogger', settings });
  const github = await loadPosts({ site: 'github', settings });

  // 1. blogger 來源：全部納入之前，額外套 Blogger production stage 過濾。
  //    missing stage → production（backward compat；本 repo 現無文章宣告 stage）；
  //    preview / invalid → 排除、記入 filteredOut（reason: 'blogger:stage-not-production'）。
  const bloggerPosts = [];
  const bloggerStageFiltered = [];
  for (const p of blogger.posts) {
    if (isProductionStage(p.publishTargets?.blogger?.stage, 'blogger')) {
      bloggerPosts.push({ ...p, sourceSite: 'blogger' });
    } else {
      bloggerStageFiltered.push({
        sourcePath: p.sourcePath,
        id: p.id ?? null,
        slug: p.slug ?? null,
        sourceSite: 'blogger',
        reason: 'blogger:stage-not-production',
      });
    }
  }

  // 2. github 來源按 publishTargets.blogger.enabled 過濾 + Blogger production stage 過濾。
  const githubCrossPosts = [];
  const githubBloggerDisabled = [];
  for (const p of github.posts) {
    if (p.publishTargets?.blogger?.enabled !== true) {
      githubBloggerDisabled.push({
        sourcePath: p.sourcePath,
        id: p.id ?? null,
        slug: p.slug ?? null,
        sourceSite: 'github-cross',
        reason: 'blogger:disabled',
      });
      continue;
    }
    if (!isProductionStage(p.publishTargets?.blogger?.stage, 'blogger')) {
      githubBloggerDisabled.push({
        sourcePath: p.sourcePath,
        id: p.id ?? null,
        slug: p.slug ?? null,
        sourceSite: 'github-cross',
        reason: 'blogger:stage-not-production',
      });
      continue;
    }
    githubCrossPosts.push({ ...p, sourceSite: 'github-cross' });
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
    ...bloggerStageFiltered,
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
        filtered: blogger.totalFiltered + bloggerStageFiltered.length,
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
