#!/usr/bin/env node
// Phase 20260717-B2-c：Blogger **draft-aware preview artifact builder**（local-only）。
//
// 背景 / 上位契約：
//   docs/20260710-blogger-preview-only-script-preanalysis.md §6.2（Variant B2）+ §7 allowed /
//   §8 forbidden / §9 gates / §11.2 acceptance。
//   Phase A（blogger-preview-plan.js）已落地 draft-aware **target planner**（dry-run only）。
//   本檔補上 Phase C：實際產出 preview artifact —— 但**只**產到 gitignored 之
//   `dist-blogger-preview/`，且每份產出都帶 PREVIEW-ONLY / NOT FOR DEPLOY 標記。
//
// 解決的痛點（runbook §D-4 / §D-10）：
//   預覽 draft 原本必須「暫改 frontmatter status: ready + draft: false → build:blogger → 貼 Blogger
//   → 改回 draft」。忘了改回即為主要隱患。本工具讓 draft **不必改 frontmatter**即可預覽。
//
// 反 drift（本檔不自己判斷任何規則）：
//   - target eligibility / sourceSite / bloggerMode / 輸出路徑 / marker：全部委派 Phase A 之
//     `planBloggerPreview()`（唯一事實來源）→ planner 與 builder 不可能漂移。
//   - 單篇 render：全部委派 `blogger-render.js` 之 `renderBloggerPost()` —— 與正式 build:blogger
//     **共用同一份 implementation**（非第二套 renderer）。
//   - entry 組裝：委派 load-posts.js 之 `processMarkdownEntry`（與正式 build 同一函式），
//     以 additive 且預設關閉的 `includeFiltered: true` 取得 draft entry；**不放寬 classify**。
//
// 邊界（違反即設計錯誤）：
//   - **只**寫 `dist-blogger-preview/`（gitignored）；**不**動正式 `dist-blogger/`（不建/不改/不刪）。
//   - **不**改 frontmatter / `.publish.json` / `.fb.md` / `content/settings/` / 任何 content。
//   - **不**改變 `build:blogger` 行為、**不**改 `classify`、**不**讓 draft 進正式 dist（CLAUDE.md §23）。
//   - **不**提供 `--apply` / `--deploy` / `--publish` / `--push` / `--output` 等 live write 模式
//     （明確 hard-fail，非靜默忽略）；**不** commit / push / 碰 gh-pages / 碰 deploy clone。
//   - **不**呼叫 Blogger / Google / GA4 / AdSense / Drive API；**零**網路；**不**讀 credential。
//   - **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt`。
//   - 失敗不留半成品：所有內容先 render 至記憶體，全成功才寫 staging dir → atomic rename。
//
// 執行：
//   npm run build:blogger-preview -- --slug=<slug> [--site=github|blogger] [--json]
//   （產出：dist-blogger-preview/posts/<slug>/{post.html,copy-helper.txt,meta.json}）

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSettings } from './load-settings.js';
import { processMarkdownEntry } from './load-posts.js';
import { renderBloggerPost } from './blogger-render.js';
import {
  planBloggerPreview,
  formatPreviewPlan,
  PREVIEW_DIST_REL,
  PREVIEW_MARKER,
  PREVIEW_PLANNED_FILES,
} from './blogger-preview-plan.js';

export { PREVIEW_DIST_REL, PREVIEW_MARKER, PREVIEW_PLANNED_FILES };

// 明確拒絕之 write / live 意圖 flag（hard-fail；不靜默忽略）。
// `--output` 亦在列：preview 輸出根目錄**不可由 CLI 覆寫**（避免被導向正式 dist / repo root）。
const REJECTED_WRITE_FLAGS = new Set([
  '--apply',
  '--write',
  '--deploy',
  '--push',
  '--publish',
  '--save',
  '--output',
  '--out-dir',
  '--force',
  '--commit',
]);

// 正式 build 之輸出根（本工具**永不**寫入；僅用於安全比對）。
const OFFICIAL_DIST_REL = 'dist-blogger';

export function resolveDefaultOutputRoot(projectRoot) {
  return path.join(projectRoot, PREVIEW_DIST_REL);
}

export function previewOutputDirFor(outputRoot, slug) {
  return path.join(outputRoot, 'posts', slug);
}

// ── output root 安全閘 ────────────────────────────────────────────────────────────
// 允許清單（只有兩者）：
//   1. canonical preview root = <projectRoot>/dist-blogger-preview
//   2. OS temp 目錄底下（**僅**供 contract guard 之隔離驗證使用；CLI 永不會走到此分支）
// 其餘一律拒絕：正式 dist-blogger/ / repo root / 其他 dist* / deploy clone / repo 外任意路徑 /
// 非絕對路徑 / projectRoot 之祖先目錄。
export function assertSafeOutputRoot(outputRoot, projectRoot) {
  if (typeof outputRoot !== 'string' || outputRoot === '' || !path.isAbsolute(outputRoot)) {
    return { ok: false, error: 'unsafe-output-root', reason: 'outputRoot 必須為非空絕對路徑' };
  }
  if (typeof projectRoot !== 'string' || projectRoot === '' || !path.isAbsolute(projectRoot)) {
    return { ok: false, error: 'invalid-project-root', reason: 'projectRoot 必須為非空絕對路徑' };
  }

  const resolved = path.resolve(outputRoot);
  const root = path.resolve(projectRoot);
  const official = path.join(root, OFFICIAL_DIST_REL);
  const canonical = path.join(root, PREVIEW_DIST_REL);

  const isWithin = (parent, child) => {
    const r = path.relative(parent, child);
    return r === '' || (!r.startsWith('..') && !path.isAbsolute(r));
  };

  // 具體拒絕原因優先（利於診斷與測試斷言）。
  if (resolved === root) {
    return { ok: false, error: 'unsafe-output-root', reason: 'outputRoot 不得為 repository root' };
  }
  if (isWithin(official, resolved)) {
    return {
      ok: false,
      error: 'unsafe-output-root',
      reason: `outputRoot 不得指向正式 ${OFFICIAL_DIST_REL}/（preview 產物不得污染正式 dist）`,
    };
  }
  for (const forbidden of ['dist', 'dist-promotion', 'dist-reports']) {
    if (isWithin(path.join(root, forbidden), resolved)) {
      return { ok: false, error: 'unsafe-output-root', reason: `outputRoot 不得指向 ${forbidden}/` };
    }
  }
  if (/portable-blog-deploy|gh-pages/i.test(resolved)) {
    return { ok: false, error: 'unsafe-output-root', reason: 'outputRoot 不得指向 deploy clone / gh-pages' };
  }
  if (isWithin(resolved, root) && resolved !== root) {
    return { ok: false, error: 'unsafe-output-root', reason: 'outputRoot 不得為 repository root 之祖先目錄' };
  }

  if (resolved === canonical) return { ok: true, outputRoot: resolved, kind: 'canonical' };
  if (isWithin(path.resolve(os.tmpdir()), resolved)) return { ok: true, outputRoot: resolved, kind: 'os-temp' };

  return {
    ok: false,
    error: 'unsafe-output-root',
    reason: `outputRoot 僅允許 canonical preview root（${PREVIEW_DIST_REL}/）或 OS temp（測試用）；實得 repo 外 / 非允許路徑`,
  };
}

// ── preview marker 注入 ───────────────────────────────────────────────────────────
// 三種載體（人工可見 / guard 可斷言 / deploy workflow 不可能誤認）：
//   post.html      → 檔首 HTML 註解區塊
//   copy-helper.txt→ 檔首純文字橫幅
//   meta.json      → preview 物件（機器可讀）
export function previewHtmlBanner(plan) {
  return `<!--
  ${PREVIEW_MARKER}
  Portable Blog System — Blogger LOCAL PREVIEW artifact
  這份檔案由 \`npm run build:blogger-preview\` 產生，僅供本機外觀預覽。
  slug          : ${plan.slug}
  sourcePath    : ${plan.sourcePath}
  status/draft  : ${plan.current.status ?? '—'} / ${plan.current.draft === null ? '—' : plan.current.draft}
  bloggerMode   : ${plan.previewBuild.mode}
  官方 build 收錄: ${plan.officialBuild.includes ? 'YES' : `NO (${plan.officialBuild.reason})`}
  ${PREVIEW_MARKER} — 請勿 deploy、請勿當作正式 dist-blogger/ 產物使用。
-->
`;
}

export function previewTextBanner(plan) {
  return [
    '============================================================',
    `  ${PREVIEW_MARKER}`,
    '  Blogger LOCAL PREVIEW artifact — 由 npm run build:blogger-preview 產生',
    `  slug         : ${plan.slug}`,
    `  status/draft : ${plan.current.status ?? '—'} / ${plan.current.draft === null ? '—' : plan.current.draft}`,
    `  官方 build 收錄: ${plan.officialBuild.includes ? 'YES' : `NO (${plan.officialBuild.reason})`}`,
    '  本檔僅供本機預覽；請勿 deploy、請勿視為正式發布用產物。',
    '============================================================',
    '',
  ].join('\n');
}

function previewMetaBlock(plan) {
  return {
    marker: PREVIEW_MARKER,
    previewOnly: true,
    notForDeploy: true,
    generatedBy: 'build:blogger-preview',
    draftAware: true,
    // 正式 build 之收錄判定如實帶入（真實 classify 之結果；本工具不改變它）。
    officialBuild: {
      includes: plan.officialBuild.includes,
      reason: plan.officialBuild.reason,
    },
  };
}

// ── 核心 builder ─────────────────────────────────────────────────────────────────
// 回 { ok:true, result } 或 { ok:false, error, reason, ... }（error 沿用 Phase A 列舉 + 本檔新增）。
export async function buildBloggerPreview({ slug, site, projectRoot, outputRoot } = {}) {
  if (typeof projectRoot !== 'string' || projectRoot === '' || !path.isAbsolute(projectRoot)) {
    return { ok: false, error: 'invalid-project-root', reason: 'projectRoot 必須為非空絕對路徑' };
  }

  const rootCheck = assertSafeOutputRoot(outputRoot ?? resolveDefaultOutputRoot(projectRoot), projectRoot);
  if (!rootCheck.ok) return rootCheck;
  const safeOutputRoot = rootCheck.outputRoot;

  // 1. 目標解析 + eligibility：完全委派 Phase A planner（唯一事實來源；draft 亦可解析）。
  //    非 Blogger target / not-found / not-unique / invalid-slug / parse-failed 皆於此 hard-fail。
  const planned = await planBloggerPreview({ slug, site, projectRoot });
  if (!planned.ok) return planned;
  const plan = planned.plan;

  // 2. entry 組裝：與正式 build 同一函式（processMarkdownEntry）。
  //    includeFiltered: true → draft 亦可取得完整 entry；`included` 仍如實為 false（不放寬 classify）。
  const settings = await loadSettings();
  const absPath = path.join(projectRoot, ...plan.sourcePath.split('/'));
  const processed = await processMarkdownEntry(absPath, 'posts', settings, { includeFiltered: true });
  const entry = processed.entry;
  if (!entry) {
    return { ok: false, error: 'entry-build-failed', reason: `無法組裝文章 entry：${plan.sourcePath}` };
  }

  // 3. Blogger 視圖欄位：沿用 planner 之判定（與 loadBloggerPosts 同規則），不另抄。
  //    sourcePath 以 planner 之 projectRoot-relative 值為準（load-posts 之 toRelative 綁定真實 repo root）。
  const post = {
    ...entry,
    sourcePath: plan.sourcePath,
    sourceSite: plan.sourceSite,
    bloggerMode: plan.previewBuild.mode,
  };

  const outputDir = previewOutputDirFor(safeOutputRoot, plan.slug);
  const builtAt = new Date().toISOString();

  // 4. render：與正式 build **共用同一 implementation**。全部先產於記憶體 → 失敗不留半成品。
  const rendered = await renderBloggerPost(post, settings, {
    builtAt,
    outputDir,
    projectRoot,
  });

  // 5. 加上 preview marker（正式 build 之產物永不含這些字串）。
  const postHtml = previewHtmlBanner(plan) + rendered.html;
  const copyHelperText = previewTextBanner(plan) + rendered.copyHelperText;
  const meta = { preview: previewMetaBlock(plan), ...rendered.meta };
  const metaText = JSON.stringify(meta, null, 2) + '\n';

  // preview 刻意**不**產 publish-checklist.txt（不誘導以 preview 產物走正式發布流程）。
  const files = [
    { name: 'post.html', content: postHtml },
    { name: 'copy-helper.txt', content: copyHelperText },
    { name: 'meta.json', content: metaText },
  ];
  // 反 drift：實際寫出的檔名必須與 Phase A 宣告之 PREVIEW_PLANNED_FILES 完全一致。
  const planNames = [...PREVIEW_PLANNED_FILES].slice().sort();
  const actualNames = files.map((f) => f.name).slice().sort();
  if (JSON.stringify(planNames) !== JSON.stringify(actualNames)) {
    return {
      ok: false,
      error: 'planned-files-drift',
      reason: `builder 寫出的檔案與 planner 宣告不一致：plan=${planNames.join(',')} actual=${actualNames.join(',')}`,
    };
  }

  // 6. atomic 落地：staging dir 寫齊 → 移除舊目標 → rename。失敗則清 staging、不留半成品。
  const staging = path.join(safeOutputRoot, '.staging', `${plan.slug}.${process.pid}`);
  try {
    await fs.rm(staging, { recursive: true, force: true });
    await fs.mkdir(staging, { recursive: true });
    for (const f of files) {
      await fs.writeFile(path.join(staging, f.name), f.content, 'utf-8');
    }
    await fs.mkdir(path.dirname(outputDir), { recursive: true });
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.rename(staging, outputDir);
  } catch (err) {
    await fs.rm(staging, { recursive: true, force: true }).catch(() => {});
    return {
      ok: false,
      error: 'write-failed',
      reason: `preview 產出失敗（未留下半成品）：${err && err.message ? err.message : String(err)}`,
    };
  } finally {
    // staging 母目錄若已空則清除（保持 preview root 乾淨）。
    await fs.rmdir(path.join(safeOutputRoot, '.staging')).catch(() => {});
  }

  const relFromRoot = (p) => path.relative(projectRoot, p).split(path.sep).join('/');

  return {
    ok: true,
    result: {
      slug: plan.slug,
      title: plan.title,
      sourcePath: plan.sourcePath,
      sourceSite: plan.sourceSite,
      contentRoot: plan.contentRoot,
      current: plan.current,
      mode: plan.previewBuild.mode,
      modeSource: plan.previewBuild.modeSource,
      rendered: rendered.renderedKind,
      marker: PREVIEW_MARKER,
      previewOnly: true,
      notForDeploy: true,
      builtAt,
      outputRoot: safeOutputRoot,
      outputDir,
      outputDirRel: relFromRoot(outputDir),
      files: files.map((f) => f.name),
      writtenFiles: files.map((f) => relFromRoot(path.join(outputDir, f.name))),
      // 邊界宣告（機器可讀；供 guard 斷言）
      officialBuild: {
        includes: plan.officialBuild.includes,
        reason: plan.officialBuild.reason,
      },
      touchesOfficialDist: false,
      publishChecklistWritten: false,
      notes: plan.notes,
    },
  };
}

// ── 顯示（human / json）─────────────────────────────────────────────────────────
export function formatPreviewBuild(result, { json = false } = {}) {
  if (json) return JSON.stringify(result, null, 2);

  if (!result.ok) {
    // Phase A 之錯誤形狀共用同一 formatter（訊息一致）。
    return formatPreviewPlan(result, { json: false });
  }

  const r = result.result;
  const lines = [];
  lines.push(`✓ ${PREVIEW_MARKER}`);
  lines.push(`  preview 產出完成: ${r.outputDirRel}/`);
  lines.push(`  slug        : ${r.slug}`);
  if (r.title) lines.push(`  title       : ${r.title}`);
  lines.push(`  sourcePath  : ${r.sourcePath}`);
  lines.push(`  sourceSite  : ${r.sourceSite}  (contentRoot=${r.contentRoot})`);
  lines.push(`  status/draft: "${r.current.status ?? '—'}" / ${r.current.draft === null ? '—' : r.current.draft}`);
  lines.push(`  mode        : ${r.mode}  (${r.modeSource}) → rendered=${r.rendered}`);
  lines.push(`  files       : ${r.files.join(', ')}`);
  lines.push('  ── 正式 build:blogger（dist-blogger/）──');
  if (r.officialBuild.includes) {
    lines.push(`  收錄     : YES  (classify: ${r.officialBuild.reason})`);
  } else {
    lines.push(`  收錄     : NO   (classify: ${r.officialBuild.reason}) — 這正是 preview 的用途`);
  }
  lines.push('  ── boundary ──');
  lines.push(`  ${PREVIEW_MARKER} — 本產出僅供本機預覽；請勿 deploy、請勿視為正式產物。`);
  lines.push('  正式 dist-blogger/ 未被本指令建立 / 修改 / 刪除；frontmatter 未被修改。');
  lines.push('  本指令不 deploy / 不 push / 不碰 gh-pages / 不呼叫 Blogger API / 不需登入 / 零網路。');
  lines.push('  publish-checklist.txt 刻意未產出（preview 不供正式發布流程使用）。');
  lines.push('  下一步（人工）：開啟 post.html 複製 → Blogger 後台 HTML 模式貼上 → 存成 draft → Blogger preview。');
  lines.push('  對照 docs/20260710-blogger-preview-sanity-analysis.md §5 之 preview sanity checklist。');
  return lines.join('\n');
}

// ── CLI ──────────────────────────────────────────────────────────────────────────
function parseArgv(argv) {
  let slug = null;
  let site = undefined;
  let json = false;
  let slugSeen = 0;
  let siteSeen = 0;
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (typeof raw !== 'string') continue;
    const bare = raw.includes('=') ? raw.slice(0, raw.indexOf('=')) : raw;
    if (REJECTED_WRITE_FLAGS.has(bare)) {
      return { ok: false, error: 'write-flag-not-supported', flag: bare };
    }
    if (raw === '--json') { json = true; continue; }
    // --dry-run 屬 planner 語意：本工具的職責就是產檔 → 明確導向 planner，不靜默忽略。
    if (bare === '--dry-run') {
      return { ok: false, error: 'dry-run-not-supported' };
    }
    if (raw.startsWith('--slug=')) { slug = raw.slice('--slug='.length); slugSeen += 1; continue; }
    if (raw === '--slug') { slug = argv[i + 1]; slugSeen += 1; i += 1; continue; }
    if (raw.startsWith('--site=')) { site = raw.slice('--site='.length); siteSeen += 1; continue; }
    if (raw === '--site') { site = argv[i + 1]; siteSeen += 1; i += 1; continue; }
    return { ok: false, error: 'unknown-arg', arg: raw };
  }
  // 重複 --slug / --site：hard-fail（不默默取最後一個 → 避免誤產非預期文章）。
  if (slugSeen > 1) return { ok: false, error: 'duplicate-slug-arg', count: slugSeen };
  if (siteSeen > 1) return { ok: false, error: 'duplicate-site-arg', count: siteSeen };
  return { ok: true, slug, site, json };
}

export function exitCodeForError(error) {
  switch (error) {
    case 'invalid-project-root':
      return 1;
    case 'write-flag-not-supported':
    case 'unknown-arg':
    case 'slug-arg-missing':
    case 'invalid-site':
    case 'duplicate-slug-arg':
    case 'duplicate-site-arg':
    case 'dry-run-not-supported':
      return 2;
    case 'invalid-slug':
      return 3;
    case 'not-found':
      return 4;
    case 'not-unique':
      return 5;
    case 'frontmatter-parse-failed':
      return 6;
    case 'status-draft-type-invalid':
      return 7;
    case 'not-a-blogger-target':
      return 8;
    case 'unsafe-output-root':
      return 9;
    case 'planned-files-drift':
    case 'entry-build-failed':
    case 'write-failed':
      return 10;
    default:
      return 1;
  }
}

function reasonForArgError(parsed) {
  switch (parsed.error) {
    case 'write-flag-not-supported':
      return `${parsed.flag} 不受支援：本工具只產生本機 preview 產物，無 apply / deploy / publish / push / output 覆寫路徑`;
    case 'dry-run-not-supported':
      return '--dry-run 不受支援：本工具負責實際產出；只要計畫請用 `npm run blogger:plan-preview -- --slug=<slug>`';
    case 'duplicate-slug-arg':
      return `--slug 重複指定 ${parsed.count} 次：請只指定單一 slug（不默默採用最後一個）`;
    case 'duplicate-site-arg':
      return `--site 重複指定 ${parsed.count} 次：請只指定一次`;
    default:
      return `未知參數：${parsed.arg}`;
  }
}

export async function runCli({ argv, projectRoot, outputRoot } = {}) {
  const stderrLines = [];
  const log = (line) => stderrLines.push(`[build-blogger-preview] ${line}`);

  const parsed = parseArgv(Array.isArray(argv) ? argv : []);
  if (!parsed.ok) {
    log(`argv rejected: ${parsed.error}`);
    const result = { ok: false, error: parsed.error, reason: reasonForArgError(parsed) };
    return { exit: exitCodeForError(parsed.error), stdout: formatPreviewBuild(result, { json: false }), result, stderrLines };
  }

  const json = parsed.json === true;

  // per §11.2：CLI 需 slug（不 accept 空 = 避免無腦把全站 draft 都產進 preview dist）。
  if (typeof parsed.slug !== 'string' || parsed.slug === '') {
    const result = {
      ok: false,
      error: 'slug-arg-missing',
      reason: '必須提供 --slug=<slug>（本工具不支援「全部」模式；列出 candidates 請用 `npm run check:blogger-preview`）',
    };
    return { exit: exitCodeForError('slug-arg-missing'), stdout: formatPreviewBuild(result, { json }), result, stderrLines };
  }

  const result = await buildBloggerPreview({
    slug: parsed.slug,
    site: parsed.site,
    projectRoot,
    // CLI **不**接受 output override（--output 已 hard-fail）；恆為 canonical preview root。
    outputRoot: outputRoot ?? resolveDefaultOutputRoot(projectRoot),
  });
  const exit = result.ok ? 0 : exitCodeForError(result.error);
  log(result.ok ? `preview written: ${result.result.outputDirRel}/ (official dist-blogger/ untouched)` : `preview failed: ${result.error}`);
  return { exit, stdout: formatPreviewBuild(result, { json }), result, stderrLines };
}

function isMainModule() {
  if (!process.argv[1]) return false;
  const argvUrl = new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href;
  return import.meta.url === argvUrl;
}

if (isMainModule()) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
  runCli({ argv: process.argv.slice(2), projectRoot: PROJECT_ROOT }).then(
    ({ exit, stdout, stderrLines }) => {
      for (const line of stderrLines) process.stderr.write(line + '\n');
      process.stdout.write(stdout + '\n');
      process.exit(exit);
    },
    (err) => {
      process.stderr.write(`[build-blogger-preview] crashed: ${err && err.stack ? err.stack : err}\n`);
      process.exit(1);
    },
  );
}
