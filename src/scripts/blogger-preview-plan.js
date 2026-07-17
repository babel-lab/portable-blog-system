#!/usr/bin/env node
// Phase 20260717-B2-a：Blogger draft-aware preview **target planner**（dry-run only）。
//
// 背景 / 上位契約：
//   docs/20260710-blogger-preview-only-script-preanalysis.md §6.2（Variant B2 = draft-aware
//   preview build）+ §7 allowed / §8 forbidden / §9 gates / §11.2 acceptance。
//   B1 navigator（check-blogger-preview.js；landed 2026-07-12 `cc6497b`）只讀 dist-blogger/，
//   而 dist-blogger/ 依 CLAUDE.md §23 恆不含 draft → B1 **結構上無法**回答任何 draft 問題。
//   本檔補上 B2 之第一段：**draft-aware 目標解析 + preview 產出計畫**，且**完全不產檔**。
//
// 為何先做 planner（而非直接 render）：
//   build-blogger.js 為 913 行、**零 export**、DIST_DIR 硬編為 dist-blogger/、且 import 即執行
//   main()（會觸發整包正式 build）。要 render draft 必須先抽出 renderer entrypoint —— 屬對正式
//   build 入口之重構，風險與體積皆超出「最小切片」。故本批沿用本 repo 既有階梯（Phase A lookup →
//   Phase B dry-run plan → Phase C engine → gated CLI；見 redraft-plan.js / redraft-apply-cli.js）：
//   先落地唯讀 planner，render / write path 屬**後續獨立 Dean-gated phase**、本檔不含該路徑。
//
// 本檔回答（B1 無法回答、且目前 Dean 只能靠「改 frontmatter 成 ready」才能得知）的問題：
//   1. 這個 slug 是不是合法的 Blogger preview 目標？（blogger-native 或 github-cross enabled）
//   2. 正式 `build:blogger` 會不會收它？不收的話**確切原因**是什麼？（draft:true / status:...）
//   3. 未來 preview build 會以哪個 bloggerMode 產出、產到哪個路徑、帶什麼 marker？
//   → 全部**不改 frontmatter**、**不產檔**即可得知。
//
// 邊界（zero-write；違反即設計錯誤）：
//   - **不**寫任何檔；**不**建立 dist-blogger-preview/；**不**動 dist-blogger/（不新增/改/刪/touch）；
//     **不**改 frontmatter / `.publish.json` / `.fb.md` / `content/settings/`；**不**改 mtime。
//   - **不** build / preview / deploy / commit / push / 碰 gh-pages / 碰 deploy clone / 碰 dist/。
//   - **不**呼叫 Blogger / Google / GA4 / AdSense / Search Console / Drive API；**不**開 dev server；
//     **不**存取任何 credential；**零**網路。
//   - **不**改 `build:blogger` 行為、**不**改 `classify`、**不**改 `load-posts.js` / `build-blogger.js`
//     之任何邏輯（CLAUDE.md §23：draft 不得進正式 dist —— 本檔完全不碰正式 dist）。
//   - **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId`。
//   - **不**輸出 real AdSense / GA4 ID；本檔不讀 ads.config.json、不讀 body 內容。
//   - **不**接受 `--apply` / `--write` / `--build` / `--deploy` / `--push` / `--publish` / `--save` /
//     `--output` / `--force`（**明確拒絕並 exit≠0，非靜默忽略**）。
//
// 反 drift：
//   - 「正式 build 是否收錄」一律呼叫 load-posts.js 之 **真實 exported `classify`**，不另抄規格。
//   - bloggerMode 列舉一律用 load-blogger-posts.js 之 **真實 exported `VALID_BLOGGER_MODES`**。
//   - slug→文章解析一律 reuse admin-article-lookup.js 之唯讀 resolver（含 slug 驗證 / 唯一性 /
//     型別檢查）；該 resolver 直接讀 frontmatter，**不**經 classify 過濾 → 故 draft 亦可解析。
//
// 執行：
//   node src/scripts/blogger-preview-plan.js --slug=<slug> [--site=github|blogger] [--json] [--dry-run]
//   （npm：`npm run blogger:plan-preview -- --slug=<slug>`）

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveArticleBySlug } from './admin-article-lookup.js';
import { classify } from './load-posts.js';
import { VALID_BLOGGER_MODES } from './load-blogger-posts.js';

// 未來 preview build（後續 phase）之隔離輸出根目錄。本檔**只計算路徑字串、不建立目錄**。
export const PREVIEW_DIST_REL = 'dist-blogger-preview';

// per §6.2 / §11.2：preview 產出須明確標記；publish-checklist 於 preview 可省（不誘導正式發布）。
export const PREVIEW_MARKER = 'PREVIEW-ONLY / NOT FOR DEPLOY';
export const PREVIEW_PLANNED_FILES = Object.freeze(['post.html', 'copy-helper.txt', 'meta.json']);

const DEFAULT_BLOGGER_MODE = 'full';

// 明確拒絕之 write 意圖 flag（hard-fail；不靜默忽略）。
const REJECTED_WRITE_FLAGS = new Set([
  '--apply',
  '--write',
  '--build',
  '--deploy',
  '--push',
  '--publish',
  '--save',
  '--output',
  '--force',
]);

// ── 目標解析（純函式；輸入為 admin-article-lookup 之 article 視圖）────────────────────
// 回 { ok:true, target:{ sourceSite, mode, modeSource, modeNote } } 或 { ok:false, error, reason }。
export function resolveBloggerPreviewTarget(article) {
  if (!article || typeof article !== 'object') {
    return { ok: false, error: 'invalid-article', reason: 'article 必須為物件' };
  }

  const bloggerTarget = article.publishTargets?.blogger ?? null;

  // sourceSite 判定沿用 load-blogger-posts.js 之聚合規則：
  //   content/blogger/posts → 'blogger'（native，恆為 Blogger 目標）
  //   content/github/posts  → 'github-cross'，且須 publishTargets.blogger.enabled === true
  let sourceSite;
  if (article.contentRoot === 'blogger') {
    sourceSite = 'blogger';
  } else if (article.contentRoot === 'github') {
    if (bloggerTarget?.enabled !== true) {
      return {
        ok: false,
        error: 'not-a-blogger-target',
        reason:
          'content/github/posts 之文章需 publishTargets.blogger.enabled: true 才會進 Blogger 輸出；' +
          '本文未啟用 → 正式 build:blogger 與 preview 皆不應產出（reason: blogger:disabled）',
      };
    }
    sourceSite = 'github-cross';
  } else {
    return {
      ok: false,
      error: 'not-a-blogger-target',
      reason: `未知 contentRoot "${article.contentRoot}"；僅支援 blogger | github`,
    };
  }

  // mode 解析：沿用 load-blogger-posts.js 之真實列舉；無效 / 缺漏 → 預設 full（與正式 build 一致）。
  const rawMode = bloggerTarget?.mode ?? null;
  let mode;
  let modeSource;
  let modeNote = null;
  if (typeof rawMode === 'string' && VALID_BLOGGER_MODES.has(rawMode)) {
    mode = rawMode;
    modeSource = 'frontmatter';
  } else {
    mode = DEFAULT_BLOGGER_MODE;
    modeSource = 'default';
    modeNote =
      rawMode === null
        ? `publishTargets.blogger.mode 缺漏 → 預設 "${DEFAULT_BLOGGER_MODE}"（與正式 build:blogger 相同）`
        : `publishTargets.blogger.mode 無效值 "${rawMode}" → 預設 "${DEFAULT_BLOGGER_MODE}"（與正式 build:blogger 相同）`;
  }

  return { ok: true, target: { sourceSite, mode, modeSource, modeNote } };
}

// ── 核心 planner（dry-run；不寫檔）────────────────────────────────────────────────
export async function planBloggerPreview({ slug, site, projectRoot } = {}) {
  if (typeof projectRoot !== 'string' || projectRoot === '' || !path.isAbsolute(projectRoot)) {
    return { ok: false, error: 'invalid-project-root', reason: 'projectRoot 必須為非空絕對路徑' };
  }

  // 唯讀解析（reuse Phase A resolver）。此 resolver 直讀 frontmatter、不經 classify → draft 可解析。
  const resolved = await resolveArticleBySlug({ slug, site, projectRoot });
  if (!resolved.ok) return resolved; // 透傳 invalid-slug / not-found / not-unique / parse-failed / type-invalid

  const a = resolved.article;

  const targetResult = resolveBloggerPreviewTarget(a);
  if (!targetResult.ok) {
    return {
      ok: false,
      error: targetResult.error,
      reason: targetResult.reason,
      slug: a.slug,
      sourcePath: a.sourcePath,
      contentRoot: a.contentRoot,
    };
  }
  const t = targetResult.target;

  // 正式 build:blogger 是否收錄 —— 呼叫真實 classify（單一事實來源；不另抄規格）。
  const verdict = classify({ status: a.status, draft: a.draft });

  const outputDir = `${PREVIEW_DIST_REL}/posts/${a.slug}`;
  const wouldWrite = PREVIEW_PLANNED_FILES.map((f) => `${outputDir}/${f}`);

  const notes = [];
  if (t.modeNote) notes.push(t.modeNote);
  if (verdict.include) {
    notes.push(
      `本文目前**已**被正式 build:blogger 收錄（classify: ${verdict.reason}）→ 直接跑 \`npm run build:blogger\` 即可於 dist-blogger/posts/${a.slug}/ 取得正式輸出；此時 preview build 非必要。`,
    );
  } else {
    notes.push(
      `本文目前**不**被正式 build:blogger 收錄（classify: ${verdict.reason}；CLAUDE.md §23 draft 不得進正式 dist）→ 這正是 B2 preview build 要解決的情境：未來可不改 frontmatter 直接預覽。`,
    );
  }

  const plan = {
    slug: a.slug,
    title: a.title,
    sourcePath: a.sourcePath,
    contentRoot: a.contentRoot,
    sourceSite: t.sourceSite,
    current: { status: a.status, draft: a.draft },
    officialBuild: {
      // 正式 build:blogger（dist-blogger/）之收錄判定；本檔不改變其行為。
      includes: verdict.include,
      reason: verdict.reason,
      distDir: verdict.include ? `dist-blogger/posts/${a.slug}` : null,
    },
    previewBuild: {
      // 未來 preview build（後續 gated phase）之計畫；本檔**不**執行。
      mode: t.mode,
      modeSource: t.modeSource,
      outputDir,
      files: [...PREVIEW_PLANNED_FILES],
      marker: PREVIEW_MARKER,
      draftAware: true,
    },
    // 邊界宣告（機器可讀；供 guard 斷言）。
    dryRun: true,
    written: false,
    wouldWrite,
    writePathImplemented: false,
    touchesOfficialDist: false,
    notes,
  };

  return { ok: true, plan };
}

// ── 顯示（human / json）——不含 body、不含 secrets ─────────────────────────────────
export function formatPreviewPlan(result, { json = false } = {}) {
  if (json) return JSON.stringify(result, null, 2);

  if (!result.ok) {
    const lines = [`✗ preview plan 失敗：${result.error}`];
    if (result.reason) lines.push(`  reason: ${result.reason}`);
    if (result.sourcePath) lines.push(`  sourcePath: ${result.sourcePath}`);
    if (Array.isArray(result.matches)) {
      lines.push('  命中多篇：');
      for (const m of result.matches) lines.push(`    - ${m.sourcePath} (contentRoot=${m.contentRoot})`);
    }
    return lines.join('\n');
  }

  const p = result.plan;
  const lines = [];
  lines.push(`✓ dry-run preview plan: ${p.sourcePath}`);
  lines.push(`  slug        : ${p.slug}`);
  if (p.title) lines.push(`  title       : ${p.title}`);
  lines.push(`  sourceSite  : ${p.sourceSite}  (contentRoot=${p.contentRoot})`);
  lines.push(`  status/draft: "${p.current.status ?? '—'}" / ${p.current.draft === null ? '—' : p.current.draft}`);
  lines.push('  ── 正式 build:blogger（dist-blogger/；本指令不改變其行為）──');
  if (p.officialBuild.includes) {
    lines.push(`  收錄     : YES  (classify: ${p.officialBuild.reason})`);
    lines.push(`  正式輸出 : ${p.officialBuild.distDir}/`);
  } else {
    lines.push(`  收錄     : NO   (classify: ${p.officialBuild.reason})`);
    lines.push('  正式輸出 : —（draft 不得進正式 dist；CLAUDE.md §23）');
  }
  lines.push('  ── preview build 計畫（draft-aware；後續 phase 才會實作產出）──');
  lines.push(`  mode        : ${p.previewBuild.mode}  (${p.previewBuild.modeSource})`);
  lines.push(`  outputDir   : ${p.previewBuild.outputDir}/`);
  lines.push(`  would write : ${p.wouldWrite.join(', ')}`);
  lines.push(`  marker      : ${p.previewBuild.marker}`);
  if (p.notes.length > 0) {
    lines.push('  ── notes ──');
    for (const n of p.notes) lines.push(`  * ${n}`);
  }
  lines.push('  ── boundary ──');
  lines.push('  dry-run only — NO file written; dist-blogger-preview/ NOT created; dist-blogger/ untouched.');
  lines.push('  本指令不 build / 不 deploy / 不 push / 不碰 gh-pages / 不呼叫 Blogger API / 不改 frontmatter。');
  lines.push('  preview build 之實際產出（render → dist-blogger-preview/）尚未實作，屬後續獨立 Dean-gated phase。');
  lines.push('  下一步（人工）：對照 docs/20260710-blogger-preview-sanity-analysis.md §5 之 preview sanity checklist。');
  return lines.join('\n');
}

// ── CLI ──────────────────────────────────────────────────────────────────────────
function parseArgv(argv) {
  let slug = null;
  let site = undefined;
  let json = false;
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (typeof raw !== 'string') continue;
    const bare = raw.includes('=') ? raw.slice(0, raw.indexOf('=')) : raw;
    if (REJECTED_WRITE_FLAGS.has(bare)) {
      return { ok: false, error: 'write-flag-not-supported', flag: bare };
    }
    if (raw === '--json') { json = true; continue; }
    // --dry-run 為本工具之唯一模式（per preanalysis §9 G-S4）；明確接受以利未來 B2 write phase 相容。
    if (raw === '--dry-run') { continue; }
    if (raw.startsWith('--slug=')) { slug = raw.slice('--slug='.length); continue; }
    if (raw === '--slug') { slug = argv[i + 1]; i += 1; continue; }
    if (raw.startsWith('--site=')) { site = raw.slice('--site='.length); continue; }
    if (raw === '--site') { site = argv[i + 1]; i += 1; continue; }
    return { ok: false, error: 'unknown-arg', arg: raw };
  }
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
    default:
      return 1;
  }
}

export async function runCli({ argv, projectRoot } = {}) {
  const stderrLines = [];
  const log = (line) => stderrLines.push(`[blogger-preview-plan] ${line}`);

  const parsed = parseArgv(Array.isArray(argv) ? argv : []);
  if (!parsed.ok) {
    const detail =
      parsed.error === 'write-flag-not-supported'
        ? `${parsed.flag} 不受支援：本工具僅產生 dry-run 計畫，無 write / build / deploy / push / publish 路徑`
        : `未知參數：${parsed.arg}`;
    log(`argv rejected: ${parsed.error}`);
    const result = { ok: false, error: parsed.error, reason: detail };
    return { exit: exitCodeForError(parsed.error), stdout: formatPreviewPlan(result, { json: false }), result, stderrLines };
  }

  const json = parsed.json === true;

  // per §11.2：CLI 需 slug（不 accept 空 = 避免無腦全部產出）。
  if (typeof parsed.slug !== 'string' || parsed.slug === '') {
    const result = {
      ok: false,
      error: 'slug-arg-missing',
      reason: '必須提供 --slug=<slug>（本工具不支援「全部」模式；列出所有 candidates 請用 `npm run check:blogger-preview`）',
    };
    return { exit: exitCodeForError('slug-arg-missing'), stdout: formatPreviewPlan(result, { json }), result, stderrLines };
  }

  const result = await planBloggerPreview({ slug: parsed.slug, site: parsed.site, projectRoot });
  const exit = result.ok ? 0 : exitCodeForError(result.error);
  log(result.ok ? `planned: ${result.plan.sourcePath} (dry-run; no file written)` : `plan failed: ${result.error}`);
  return { exit, stdout: formatPreviewPlan(result, { json }), result, stderrLines };
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
      process.stderr.write(`[blogger-preview-plan] crashed: ${err && err.stack ? err.stack : err}\n`);
      process.exit(1);
    },
  );
}
