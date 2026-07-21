#!/usr/bin/env node
// Phase 20260721-publish-target-stage Slice 4B：Blogger withdrawn sidecar schema 契約 helper。
//
// 上位契約：
//   - docs/publish-json-schema.md §5.7（withdrawn 語意 / schemaVersion 2 / lifecycle）
//   - docs/20260720-publish-target-stage-contract.md §11（Slice 4B：withdrawn sidecar contract）
//
// 本 helper 為純函式：不讀檔、不寫檔、不呼叫任何 API、零網路、永不 throw。
// 只做 read-only classification / validation，回傳 issue 陣列供 validate-content.js 消費，
// 並供 focused guard（check-sidecar-withdrawal-schema.js）以 in-memory fixture 直接單測。
//
// 邊界（Slice 4B）：
//   - **不**執行 remote Blogger action、**不**建立 planner / authorization / rehearsal / apply。
//   - **不**動 sidecar bytes、**不**動既有 production content。
//   - lifecycle[] 只做 snapshot 結構與順序驗證；append-only 之歷史保證留待 future apply capability
//     （validator 無法從單一檔案證明歷史未被改寫，見 docs §5.7）。
//
// Redaction（§九 output redaction）：
//   本 helper 產生的 issue.value **只**含欄位名稱 / 錯誤原因 / 安全短碼，**絕不**回顯
//   publishedUrl、lifecycle 內任何 URL 值、operator identity 或 authorization / private path。
//
// 刻意**不** import publish-stage.js：stage 解析（missing→production / invalid→ok:false）之單一事實
//   來源仍為 publish-stage.js，由 validate-content.js 端解析後把 resolved 值傳入本 helper 之
//   withdrawnStageStatusWarning，避免本 helper 成為 publish-stage.js 的新 importer（維持既有 importer
//   白名單不變），亦不重複 stage 值域判斷。

// ── 常數（單一事實來源）────────────────────────────────────────────────────────────

// 目前支援之最高 schemaVersion。legacy（缺省）與 1 皆視為 v1。
export const SUPPORTED_SCHEMA_VERSION = 2;

// 新增之 Blogger sidecar status（§四 4.2）。不同於 draft / ready / published / archived。
export const WITHDRAWN_STATUS = 'withdrawn';

// lifecycle 於本 Slice 只正式支援 withdrawn event（§六 6.1）。
export const LIFECYCLE_WITHDRAWN_EVENT = 'withdrawn';

// reason enum（§六 6.5）。
export const LIFECYCLE_REASONS = Object.freeze(
  new Set(['stage-preview', 'content-retirement', 'publication-error', 'policy', 'migration', 'other']),
);

// remoteDisposition enum（§六 6.6）。operator-confirmed observation；不代表本 Slice 執行 remote action。
export const REMOTE_DISPOSITIONS = Object.freeze(
  new Set([
    'remote-live',
    'remote-draft',
    'remote-deleted',
    'remote-unavailable',
    'remote-permalink-changed',
    'confirmed-inactive',
  ]),
);

// 公開 sidecar 之 lifecycle event **不得**含下列私人核准欄位（§六 6.7）。
export const PRIVATE_LIFECYCLE_FIELDS = Object.freeze([
  'approvedBy',
  'operatorName',
  'operatorEmail',
  'approvalNote',
  'privateManifestPath',
  'authorizationPath',
]);

// lifecycle event **不得**重複保存下列 active publication evidence（§六 6.8）；
// 這些歷史證據只存在 blogger 區塊之 active evidence fields。
export const DUPLICATE_EVIDENCE_FIELDS = Object.freeze([
  'publishedUrl',
  'publishedAt',
  'bloggerPostId',
  'publishYear',
  'publishMonth',
  'permalink',
]);

// 每個 withdrawn event 之 required fields（§六 6.2）。
export const REQUIRED_WITHDRAWN_EVENT_FIELDS = Object.freeze([
  'event',
  'fromStatus',
  'toStatus',
  'recordedAt',
  'remoteVerifiedAt',
  'reason',
  'remoteDisposition',
  'sourcePath',
  'sourceSha256',
  'priorSidecarSha256',
  'gitHead',
  'authorizationFingerprint',
]);

// diagnostic type 集合（stable slug；guard 依此斷言）。
export const WITHDRAWAL_ISSUE_TYPES = Object.freeze({
  schemaVersionUnsupported: 'sidecar-schema-version-unsupported',
  v1UsesV2Feature: 'sidecar-v1-uses-v2-feature',
  withdrawnMissingEvidence: 'withdrawn-missing-evidence',
  withdrawnMissingLifecycle: 'withdrawn-missing-lifecycle',
  lifecycleMalformed: 'lifecycle-malformed',
  lifecycleHashMalformed: 'lifecycle-hash-malformed',
  lifecycleTimestampMalformed: 'lifecycle-timestamp-malformed',
  lifecycleReasonInvalid: 'lifecycle-reason-invalid',
  lifecycleRemoteDispositionInvalid: 'lifecycle-remote-disposition-invalid',
  lifecycleSourcePathInvalid: 'lifecycle-source-path-invalid',
  lifecycleDuplicateWithdrawnEvent: 'lifecycle-duplicate-withdrawn-event',
  lifecycleStatusTransitionInconsistent: 'lifecycle-status-transition-inconsistent',
  lifecycleDuplicateEvidence: 'lifecycle-duplicate-evidence',
  lifecyclePrivateField: 'lifecycle-private-field',
  lifecycleOrderingInvalid: 'lifecycle-ordering-invalid',
});

// stage × status product-state mismatch 之 warning type（§八 truth table）。
export const STAGE_STATUS_ISSUE_TYPES = Object.freeze({
  conflictsPublishedSidecar: 'publish-target-stage-conflicts-published-sidecar',
  conflictsWithdrawnSidecar: 'publish-target-stage-conflicts-withdrawn-sidecar',
});

// ── 型別工具（沿用 active-publication.js / publish-stage.js 慣例）─────────────────────

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim() !== '';
}

// 64 / 40 字元 lowercase hex（§六 6.3）。case-sensitive、不 trim。
function isLowercaseHex(v, len) {
  return typeof v === 'string' && new RegExp(`^[0-9a-f]{${len}}$`).test(v);
}

// 含明確時區之 ISO-8601 時間（§六 6.4）。回傳 { ok, epoch?, reason? }。
//   - 非字串 / 空字串 → fail
//   - 無時區設計符（Z 或 ±HH:MM）→ fail（reason: 'no-timezone'）
//   - 無法 parse → fail（reason: 'invalid'）
function parseTzIso(v) {
  if (typeof v !== 'string') return { ok: false, reason: 'non-string' };
  if (v.trim() === '') return { ok: false, reason: 'empty' };
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(v)) return { ok: false, reason: 'no-timezone' };
  const epoch = Date.parse(v);
  if (Number.isNaN(epoch)) return { ok: false, reason: 'invalid' };
  return { ok: true, epoch };
}

// POSIX-relative path，必須位於 content/blogger/posts/、以 .md 結尾、無 ..、非 absolute（§六 6.3）。
// 回傳 null（合法）或錯誤原因短碼（不回顯原始 path 內容）。
function classifySourcePath(v) {
  if (typeof v !== 'string' || v === '') return 'non-string-or-empty';
  if (v.includes('\\')) return 'not-posix';
  if (v.startsWith('/') || /^[A-Za-z]:/.test(v)) return 'absolute';
  if (v.split('/').includes('..')) return 'dotdot';
  if (!v.startsWith('content/blogger/posts/')) return 'not-under-blogger-posts';
  if (!v.endsWith('.md')) return 'not-md';
  return null;
}

// ── schemaVersion 相容解析（§五）──────────────────────────────────────────────────
// 回傳：
//   缺省 / undefined → { ok:true, version:1, source:'legacy-missing' }
//   整數 1           → { ok:true, version:1, source:'explicit' }
//   整數 2           → { ok:true, version:2, source:'explicit' }
//   非整數 / 0 / 負數 / > SUPPORTED → { ok:false, reason }
export function resolveSchemaVersion(sidecar) {
  if (!isPlainObject(sidecar)) return { ok: true, version: 1, source: 'legacy-missing' };
  const raw = sidecar.schemaVersion;
  if (raw === undefined) return { ok: true, version: 1, source: 'legacy-missing' };
  if (typeof raw !== 'number' || !Number.isInteger(raw)) return { ok: false, reason: 'non-integer' };
  if (raw < 1) return { ok: false, reason: 'below-minimum' };
  if (raw > SUPPORTED_SCHEMA_VERSION) return { ok: false, reason: 'above-supported' };
  return { ok: true, version: raw, source: 'explicit' };
}

// isWithdrawnSidecar：sidecar 之 blogger.status === 'withdrawn'（純結構判定；不驗完整性）。
export function isWithdrawnSidecar(sidecar) {
  const blogger = isPlainObject(sidecar) ? sidecar.blogger : null;
  return isPlainObject(blogger) && blogger.status === WITHDRAWN_STATUS;
}

// ── 單一 withdrawn event 之結構驗證 ─────────────────────────────────────────────────
function validateWithdrawnEvent(event, index, push, T) {
  if (!isPlainObject(event)) {
    push(T.lifecycleMalformed, `event-not-object:index${index}`);
    return;
  }
  if (event.event !== LIFECYCLE_WITHDRAWN_EVENT) {
    // 本 Slice 只支援 withdrawn event（§六 6.1）。
    push(T.lifecycleMalformed, 'unsupported-event');
    return;
  }

  // required fields（§六 6.2）。
  for (const field of REQUIRED_WITHDRAWN_EVENT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(event, field)) {
      push(T.lifecycleMalformed, `missing-field:${field}`);
    }
  }

  // 精確 transition 值（§六 6.2 / §七）。
  if (Object.prototype.hasOwnProperty.call(event, 'fromStatus') && event.fromStatus !== 'published') {
    push(T.lifecycleStatusTransitionInconsistent, 'fromStatus');
  }
  if (Object.prototype.hasOwnProperty.call(event, 'toStatus') && event.toStatus !== WITHDRAWN_STATUS) {
    push(T.lifecycleStatusTransitionInconsistent, 'toStatus');
  }

  // hash 格式（§六 6.3）。
  if (!isLowercaseHex(event.sourceSha256, 64)) push(T.lifecycleHashMalformed, 'sourceSha256');
  if (!isLowercaseHex(event.priorSidecarSha256, 64)) push(T.lifecycleHashMalformed, 'priorSidecarSha256');
  if (!isLowercaseHex(event.authorizationFingerprint, 64)) push(T.lifecycleHashMalformed, 'authorizationFingerprint');
  if (!isLowercaseHex(event.gitHead, 40)) push(T.lifecycleHashMalformed, 'gitHead');

  // sourcePath（§六 6.3）。只回顯原因短碼、不回顯 path 內容。
  const sourcePathReason = classifySourcePath(event.sourcePath);
  if (sourcePathReason) push(T.lifecycleSourcePathInvalid, sourcePathReason);

  // timestamps（§六 6.4）。
  const recorded = parseTzIso(event.recordedAt);
  if (!recorded.ok) push(T.lifecycleTimestampMalformed, `recordedAt:${recorded.reason}`);
  const verified = parseTzIso(event.remoteVerifiedAt);
  if (!verified.ok) push(T.lifecycleTimestampMalformed, `remoteVerifiedAt:${verified.reason}`);
  if (recorded.ok && verified.ok && verified.epoch > recorded.epoch) {
    push(T.lifecycleTimestampMalformed, 'remoteVerifiedAt-after-recordedAt');
  }

  // reason enum（§六 6.5）。
  if (!LIFECYCLE_REASONS.has(event.reason)) push(T.lifecycleReasonInvalid, 'reason');
  if (Object.prototype.hasOwnProperty.call(event, 'reasonDetail') && !isNonEmptyString(event.reasonDetail)) {
    push(T.lifecycleReasonInvalid, 'reasonDetail-empty');
  }

  // remoteDisposition enum（§六 6.6）。
  if (!REMOTE_DISPOSITIONS.has(event.remoteDisposition)) {
    push(T.lifecycleRemoteDispositionInvalid, 'remoteDisposition');
  }

  // 私人 operator 欄位（§六 6.7）。
  for (const field of PRIVATE_LIFECYCLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(event, field)) push(T.lifecyclePrivateField, field);
  }

  // 重複 publication evidence（§六 6.8）。只回顯欄位名稱、不回顯值。
  for (const field of DUPLICATE_EVIDENCE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(event, field)) push(T.lifecycleDuplicateEvidence, field);
  }
}

// ── 主入口：schema-level withdrawal 契約驗證（§五 / §六 / §七 / §九 error）──────────
// sidecar：post.publish（原始 .publish.json 物件）。
// 回傳 issue 陣列（可能為空）；所有 issue severity 皆為 'error'（schema 不完整不得只是 warning）。
export function collectSidecarWithdrawalIssues(sidecar, { sourcePath = '', sidecarPath = '' } = {}) {
  const issues = [];
  const T = WITHDRAWAL_ISSUE_TYPES;
  const push = (type, value) => {
    issues.push({ severity: 'error', type, sourcePath, sidecarPath, value });
  };

  if (!isPlainObject(sidecar)) return issues;

  const sv = resolveSchemaVersion(sidecar);
  if (!sv.ok) {
    push(T.schemaVersionUnsupported, sv.reason);
    return issues;
  }

  const blogger = isPlainObject(sidecar.blogger) ? sidecar.blogger : null;
  const status = blogger ? blogger.status : undefined;
  const hasLifecycleKey = blogger
    ? Object.prototype.hasOwnProperty.call(blogger, 'lifecycle')
    : false;
  const lifecycle = blogger ? blogger.lifecycle : undefined;

  // ── v1 / legacy：不得使用 v2-only 功能（§五 5.1）───────────────────────────────
  if (sv.version === 1) {
    if (status === WITHDRAWN_STATUS) push(T.v1UsesV2Feature, 'status:withdrawn');
    if (hasLifecycleKey) push(T.v1UsesV2Feature, 'lifecycle');
    return issues;
  }

  // ── v2 ────────────────────────────────────────────────────────────────────────
  const isWithdrawn = status === WITHDRAWN_STATUS;

  // lifecycle 結構（若存在）。
  let events = null;
  if (hasLifecycleKey) {
    if (!Array.isArray(lifecycle)) {
      push(T.lifecycleMalformed, 'not-array');
    } else if (lifecycle.length === 0) {
      if (isWithdrawn) push(T.withdrawnMissingLifecycle, 'empty');
      // 非 withdrawn 之空 lifecycle 陣列無害（無 event 可驗）。
    } else {
      events = lifecycle;
    }
  }

  // withdrawn 必要條件（§七 7.1）。
  if (isWithdrawn) {
    if (!isNonEmptyString(blogger.publishedUrl)) push(T.withdrawnMissingEvidence, 'publishedUrl');
    if (!parseTzIso(blogger.publishedAt).ok) push(T.withdrawnMissingEvidence, 'publishedAt');
    if (!hasLifecycleKey) push(T.withdrawnMissingLifecycle, 'missing');
    // bloggerPostId 允許空字串（現行 contract 禁止 fabrication）；不檢查。
  }

  // events 存在時：per-event 結構 + ordering + duplicate + last-event 一致性。
  if (events) {
    const withdrawnCount = events.filter(
      (e) => isPlainObject(e) && e.event === LIFECYCLE_WITHDRAWN_EVENT,
    ).length;
    if (withdrawnCount > 1) push(T.lifecycleDuplicateWithdrawnEvent, `count:${withdrawnCount}`);

    // recordedAt 須按 array 順序不遞減（§七 7.2）。
    let prevEpoch = null;
    let orderingReported = false;
    for (const e of events) {
      const p = isPlainObject(e) ? parseTzIso(e.recordedAt) : { ok: false };
      if (p.ok) {
        if (prevEpoch !== null && p.epoch < prevEpoch && !orderingReported) {
          push(T.lifecycleOrderingInvalid, 'recordedAt-decreasing');
          orderingReported = true;
        }
        prevEpoch = p.epoch;
      }
    }

    events.forEach((e, i) => validateWithdrawnEvent(e, i, push, T));

    // last event 一致性（§七 7.1 / 7.2）。
    const last = events[events.length - 1];
    const lastIsWithdrawn = isPlainObject(last) && last.event === LIFECYCLE_WITHDRAWN_EVENT;
    if (isWithdrawn && !lastIsWithdrawn) {
      push(T.lifecycleStatusTransitionInconsistent, 'last-event-not-withdrawn');
    }
    if (!isWithdrawn && lastIsWithdrawn) {
      push(T.lifecycleStatusTransitionInconsistent, 'status-not-withdrawn-but-last-withdrawn');
    }
  }

  return issues;
}

// ── stage × status product-state truth table（§八；withdrawn 側）──────────────────────
// 純函式 predicate；輸入為**已解析**之 Blogger stage（由 caller 以 publish-stage.js 解析後傳入）。
//   stageResolvedOk：resolvePublishTargetStage(...).ok（invalid stage → false）
//   stage：resolvePublishTargetStage(...).stage（'preview' / 'production' / null）
//   status：sidecar.blogger.status
// 回傳單一 warning issue 或 null。
//   - production（含 missing→default production，caller 傳入之 stage === 'production'）+ withdrawn
//     → publish-target-stage-conflicts-withdrawn-sidecar warning
//   - invalid stage（stageResolvedOk === false）→ null（不 downgrade / 不隱藏 invalid-stage error）
//   - preview / 其餘 status → null（§八 8.4；preview+withdrawn 為合法 steady state）
// 本 predicate **只**負責 withdrawn 側；preview+published 之既有 transitional warning 仍由
//   validate-content.js inline 維持（不重構），以保持既有 wiring 不變。
// Redaction：value 只含 sidecarPath 與說明，**不**回顯 publishedUrl。
export function withdrawnStageStatusWarning({
  stageResolvedOk = false,
  stage = null,
  status = undefined,
  sourcePath = '',
  sidecarPath = '',
} = {}) {
  if (stageResolvedOk !== true) return null; // invalid stage：不 downgrade、不隱藏 error。
  if (stage !== 'production') return null; // preview 等：無 withdrawn warning。
  if (status !== WITHDRAWN_STATUS) return null;
  return {
    severity: 'warning',
    type: STAGE_STATUS_ISSUE_TYPES.conflictsWithdrawnSidecar,
    sourcePath,
    sidecarPath,
    value:
      `blogger target has production eligibility but sidecar.status="withdrawn" (sidecarPath=${sidecarPath}); ` +
      `sidecar does not represent an active Blogger publication — stage fix needs an independent process.`,
  };
}
