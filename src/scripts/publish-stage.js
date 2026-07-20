#!/usr/bin/env node
// Phase 20260720-publish-target-stage Slice 1：per-platform publication **stage** 契約 helper。
//
// 上位契約：docs/20260720-publish-target-stage-contract.md
//
// 欄位路徑：
//   publishTargets.<platform>.stage    （platform ∈ { github, blogger }）
//
// 語意（三者正交，不得互相推導）：
//   enabled ── 該平台是否具備參與輸出／預覽流程的資格
//   mode    ── 該平台的輸出形式（full / summary / redirect-card；見 VALID_PUBLISH_MODE）
//   stage   ── 該平台目前是否具有 production eligibility（preview / production）
//
// 合法值只有兩個：'preview' / 'production'（lowercase string，case-sensitive，不 trim）。
//
// Missing default：
//   stage 缺漏（undefined）→ production。此為 backward-compatibility 契約：既有文章一律無
//   stage 欄位，其 production 行為必須完全不變。
//
// Invalid fail-closed：
//   stage 已存在但非法（非 string / 空字串 / null / object / array / 未知值 / 大小寫錯誤 /
//   前後空白 / 平台名 / lifecycle status 名）→ resolver 回 ok:false、production predicate 回
//   false、**絕不 fallback 成 production**。
//
// 平台隔離：
//   本 helper 為 per-platform 純函式；github 的非法 stage 不影響 blogger 的解析，反之亦然。
//   共享 umbrella（例如先跑 validate:content）可因任一平台之 metadata error 整體失敗，但各平台
//   之**直接** production entry point 未來只得對自己平台的 stage 做 fail-closed。
//
// 本 Slice 邊界（Slice 1 = schema / validator / read-only classification）：
//   - 本 helper **尚未**接入任何 production selector / planner / manifest / authorization / apply。
//   - 唯一 wiring 為 validate-content.js 之 metadata 驗證，以及 read-only 顯示。
//   - assertProductionStage 已定義但本 Slice 無任何 caller；enforcement 屬 Slice 2。
//   - 純函式；不讀檔、不寫檔、不呼叫任何 API、零網路。

// 合法值集合（keyed by platform；與既有 VALID_PUBLISH_MODE 之 keyed 結構一致）。
// 禁止加入第三個值。
export const VALID_PUBLISH_STAGE = Object.freeze({
  github: new Set(['preview', 'production']),
  blogger: new Set(['preview', 'production']),
});

// stage 缺漏時之預設值（backward compatibility）。
export const DEFAULT_PUBLISH_STAGE = 'production';

export const PUBLISH_STAGE_PLATFORMS = Object.freeze(['github', 'blogger']);

// stage 非法時之 validator diagnostic type（單一 rule id 涵蓋多種 trigger value，
// 沿用 invalid-publish-target-mode / book-mediatype-invalid 之既有命名 cadence）。
export const PUBLISH_STAGE_DIAGNOSTIC_TYPE = 'invalid-publish-target-stage';

export class InvalidPublishStageError extends Error {
  constructor(message, { platform = null, stage = null } = {}) {
    super(message);
    this.name = 'InvalidPublishStageError';
    this.platform = platform;
    this.stage = stage;
  }
}

export class NotProductionStageError extends Error {
  constructor(message, { platform = null, stage = null } = {}) {
    super(message);
    this.name = 'NotProductionStageError';
    this.platform = platform;
    this.stage = stage;
  }
}

// 型別安全之值描述（供 diagnostic / 顯示使用）。
//   - 非 string：**只**回型別名稱，不回顯原始內容（避免把 object / array 整包倒進 log）。
//   - string：回顯值本身（已知為短 enum 候選），但截斷上限以防長字串。
const STAGE_VALUE_PREVIEW_MAX = 40;
export function describePublishStageValue(raw) {
  if (raw === undefined) return '(missing)';
  if (raw === null) return '(null)';
  if (Array.isArray(raw)) return '(array)';
  if (typeof raw !== 'string') return `(${typeof raw})`;
  if (raw === '') return '(empty-string)';
  return raw.length > STAGE_VALUE_PREVIEW_MAX
    ? `${raw.slice(0, STAGE_VALUE_PREVIEW_MAX)}…`
    : raw;
}

// ── 核心 resolver（純函式；永不 throw）─────────────────────────────────────────────
// 回傳：
//   raw === undefined      → { ok: true,  stage: 'production', source: 'default' }
//   raw 為該平台合法值      → { ok: true,  stage: raw,          source: 'explicit' }
//   raw 已存在但非法        → { ok: false, stage: null,         source: 'invalid', reason }
//
// 不 trim、不做大小寫 normalize、不做任何 coercion。
export function resolvePublishStage(raw, platform) {
  const validSet = Object.prototype.hasOwnProperty.call(VALID_PUBLISH_STAGE, platform)
    ? VALID_PUBLISH_STAGE[platform]
    : null;

  if (validSet === null) {
    return {
      ok: false,
      stage: null,
      source: 'invalid',
      platform: typeof platform === 'string' ? platform : null,
      value: describePublishStageValue(raw),
      reason: 'unknown-platform',
    };
  }

  if (raw === undefined) {
    return { ok: true, stage: DEFAULT_PUBLISH_STAGE, source: 'default', platform, value: '(missing)' };
  }

  if (typeof raw === 'string' && validSet.has(raw)) {
    return { ok: true, stage: raw, source: 'explicit', platform, value: raw };
  }

  return {
    ok: false,
    stage: null,
    source: 'invalid',
    platform,
    value: describePublishStageValue(raw),
    reason: typeof raw === 'string' ? 'unknown-value' : 'invalid-type',
  };
}

// publishTargets 物件版本（便利 wrapper；同樣永不 throw）。
// 缺 publishTargets / 缺該平台節點 → 視同 stage 缺漏 → default production。
export function resolvePublishTargetStage(publishTargets, platform) {
  const target =
    publishTargets && typeof publishTargets === 'object' && !Array.isArray(publishTargets)
      ? publishTargets[platform]
      : undefined;
  const raw =
    target && typeof target === 'object' && !Array.isArray(target) ? target.stage : undefined;
  return resolvePublishStage(raw, platform);
}

// ── production predicate（永不 throw）──────────────────────────────────────────────
// production → true；preview / invalid / unknown-platform → false。
export function isProductionStage(raw, platform) {
  const resolved = resolvePublishStage(raw, platform);
  return resolved.ok === true && resolved.stage === 'production';
}

// ── production assertion（fail-closed）────────────────────────────────────────────
// invalid   → throw InvalidPublishStageError
// preview   → throw NotProductionStageError
// production → 回傳 resolved 結果
//
// 本 Slice 無任何 caller；Slice 2 才會接入平台各自之 production entry point。
export function assertProductionStage(raw, platform) {
  const resolved = resolvePublishStage(raw, platform);
  if (!resolved.ok) {
    throw new InvalidPublishStageError(
      `publishTargets.${resolved.platform ?? String(platform)}.stage 非法：${resolved.value}（合法值僅 preview / production）`,
      { platform: resolved.platform, stage: null },
    );
  }
  if (resolved.stage !== 'production') {
    throw new NotProductionStageError(
      `publishTargets.${platform}.stage = "${resolved.stage}" 不具 production eligibility`,
      { platform, stage: resolved.stage },
    );
  }
  return resolved;
}

// ── validator rule（供 validate-content.js 使用；純函式）──────────────────────────
// 回傳 issue 陣列（可能為空）。
//   - stage 缺漏 → 無 diagnostics（不產生 warning、不產生 error）
//   - stage 非法 → severity 'error'，type = PUBLISH_STAGE_DIAGNOSTIC_TYPE
//   - enabled 值**不**影響本規則：enabled:false 時非法 stage 仍為 error
//   - 平台獨立：github 非法不會為 blogger 產生 issue，反之亦然
export function collectPublishTargetStageIssues(publishTargets, sourcePath) {
  const issues = [];
  const targets =
    publishTargets && typeof publishTargets === 'object' && !Array.isArray(publishTargets)
      ? publishTargets
      : {};
  for (const platform of PUBLISH_STAGE_PLATFORMS) {
    const target = targets[platform];
    if (!target || typeof target !== 'object' || Array.isArray(target)) continue;
    if (target.stage === undefined) continue;
    const resolved = resolvePublishStage(target.stage, platform);
    if (resolved.ok) continue;
    issues.push({
      severity: 'error',
      type: PUBLISH_STAGE_DIAGNOSTIC_TYPE,
      sourcePath,
      value: `${platform}:${resolved.value}`,
    });
  }
  return issues;
}

// ── read-only 顯示字串（Admin / planner 共用；不寫回 frontmatter）─────────────────
// default  → 'production (default)'
// explicit → 'preview' / 'production'
// invalid  → 'invalid (<safe-value>)'   ← 絕不顯示成 production
export function formatPublishStage(resolved) {
  if (!resolved || typeof resolved !== 'object') return '—';
  if (resolved.ok !== true) return `invalid (${resolved.value})`;
  return resolved.source === 'default' ? `${resolved.stage} (default)` : resolved.stage;
}
