#!/usr/bin/env node
// Phase 20260722-publish-target-stage Slice 4D：Blogger withdrawal authorization — shared contract.
//
// 上位契約：
//   - docs/20260722-blogger-withdrawal-authorization-preparation.md（本 Slice 契約）
//   - docs/20260721-blogger-withdrawal-planner.md（Slice 4C：read-only withdrawal planner）
//   - docs/20260720-publish-target-stage-contract.md（stage 三者正交；missing→production；invalid fail-closed）
//   - docs/publish-json-schema.md §5.7 / §9（withdrawn / schemaVersion 2 / lifecycle）
//
// 本檔是 Slice 4D 的**單一契約來源**（schema 常數 / allowed-key sets / canonical fingerprint
// algorithm / strict authorization loader / draft builder / safe error boundary）。draft generator
// 與 read-only preflight validator 皆 import 本檔，兩者之間**沒有第二份** schema。
//
// 為什麼 withdrawal authorization 是**獨立** contract（不沿用 backfill）：
//   - backfill authorization（`blogger-backfill-production-sidecar-apply`）= create-only：目標是寫出
//     一個尚不存在的 `.publish.json`；其 fingerprint payload 綁 create plan / entry payload。
//   - withdrawal authorization（`blogger-sidecar-withdrawal`）= 未來的 mutate-in-place：目標是把一個
//     **既有**、active-published 的 sidecar 轉為 withdrawn；preconditions（現行 status / source /
//     sidecar SHA / published URL fingerprint）、target state（withdrawn + remote disposition）、
//     fingerprint payload 與 write primitive 全部不同。
//   兩者混用會讓錯誤的 authorization 型別靜默通過。因此 purpose 不同（strict equality），fingerprint
//   payload 亦以固定 `fingerprintKind` 前綴命名空間隔離。
//
// 語意重用（單一事實來源；本檔**不**複製任何一份）：
//   - remote disposition enum / reason enum / strict TZ-ISO calendar parser：
//       sidecar-withdrawal-contract.js（Slice 4B）。remote disposition / reason 直接用其 exported
//       Set；strict TZ-ISO 以「把候選字串嵌入合成 withdrawn lifecycle event、跑 landed
//       collectSidecarWithdrawalIssues」的方式重用其 parseTzIso —— **不**重新發明、**不**修改
//       contract module（見 isLandedStrictTzIso）。
//   - candidate 真值 / published URL fingerprint algorithm：plan-blogger-withdrawals.js（Slice 4C）。
//   - repo-state gate：admin-git-safety-preflight.js。
//
// Redaction（§八）：本檔產生之 blocker slug 皆為固定安全短碼，**絕不**回顯 authorization 內容、
//   publishedUrl、URL host、Blogger post id、publishedAt、operator identity、authorization file path、
//   OS temp path、repository absolute path、gitdir path、stack trace、raw fs error。
//
// 硬邊界：本檔為純函式 + 檔案讀取邊界的 helper —— **不**寫檔、**不** child_process、**不**網路、
//   **不**呼叫 Blogger / Google API、**不** apply。approval.explicitlyAuthorized 由 buildDraft
//   硬編碼為 boolean false；本檔無任何 in-band code path 會把它設為 true。

import { createHash } from 'node:crypto';
import path from 'node:path';

import {
  collectSidecarWithdrawalIssues,
  REMOTE_DISPOSITIONS,
  LIFECYCLE_REASONS,
  WITHDRAWN_STATUS,
  LIFECYCLE_WITHDRAWN_EVENT,
  WITHDRAWAL_ISSUE_TYPES,
} from './sidecar-withdrawal-contract.js';
import { CLASSIFICATION } from './plan-blogger-withdrawals.js';

// ── constants（單一事實來源）─────────────────────────────────────────────────────
export const AUTHORIZATION_SCHEMA_VERSION = 1;
export const AUTHORIZATION_PURPOSE = 'blogger-sidecar-withdrawal';
export const AUTHORIZATION_BRANCH = 'main';
export const WITHDRAWAL_EVENT = LIFECYCLE_WITHDRAWN_EVENT; // 'withdrawn'
export const WITHDRAWAL_OPERATION = 'withdraw';
// withdrawal 的前置狀態必為 active-published（Slice 4A/4C candidacy 前提）。
export const EXPECTED_CURRENT_STATUS = 'published';
export const BLOGGER_POSTS_PREFIX = 'content/blogger/posts/';

// fingerprint namespace 前綴（把 withdrawal plan / record fingerprint 與其他 fingerprint 隔離）。
export const PLAN_FINGERPRINT_KIND = 'blogger-sidecar-withdrawal-plan';
export const RECORD_FINGERPRINT_KIND = 'blogger-sidecar-withdrawal-record';

// strict allowlist（每層 nested object 皆有；unknown key fail-closed）。
export const ALLOWED_TOP_KEYS = Object.freeze(
  new Set(['schemaVersion', 'purpose', 'repository', 'plan', 'target', 'withdrawal', 'approval']),
);
export const ALLOWED_REPO_KEYS = Object.freeze(new Set(['expectedBranch', 'expectedHead']));
export const ALLOWED_PLAN_KEYS = Object.freeze(
  new Set(['expectedPlanFingerprint', 'expectedRecordFingerprint', 'recordCount']),
);
export const ALLOWED_TARGET_KEYS = Object.freeze(
  new Set([
    'sourcePath',
    'sidecarPath',
    'expectedSourceSha256',
    'expectedSidecarSha256',
    'expectedCurrentStatus',
    'expectedPublishedUrlFingerprint',
  ]),
);
export const ALLOWED_WITHDRAWAL_KEYS = Object.freeze(
  new Set(['event', 'remoteDisposition', 'remoteVerifiedAt', 'reason', 'reasonDetail']),
);
export const ALLOWED_APPROVAL_KEYS = Object.freeze(new Set(['explicitlyAuthorized']));

// ── safe error boundary（§八 / §十）──────────────────────────────────────────────
// 對外拋出的 error 必為 WithdrawalAuthorizationError：stable code + safe message；code / safeMessage
// **絕不**含動態 path、raw fs error、URL、post id、operator identity。
export class WithdrawalAuthorizationError extends Error {
  constructor(code, { exitCode = 1 } = {}) {
    super(code);
    this.name = 'WithdrawalAuthorizationError';
    this.code = code;
    this.safeMessage = code;
    this.exitCode = exitCode;
  }
}

// ── syntactic helpers ────────────────────────────────────────────────────────────
export function isSha256HexLower(v) {
  return typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
}
export function isGitSha40Lower(v) {
  return typeof v === 'string' && /^[0-9a-f]{40}$/.test(v);
}
export function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

// canonical POSIX-relative Blogger post source path（shape check；與既有 validateSourcePathArg
// 一致，非新 parser）。回 null（合法 shape）或安全短碼。**不**回顯 path 內容。
// 註：canonical 真值最終由「必須恰好匹配一筆 planner candidate」決定（見 validator）；本函式只做
//   shape gate，避免明顯非法值（絕對路徑 / traversal / 非 .md）進入下游。
export function classifyBloggerSourcePath(v) {
  if (typeof v !== 'string') return 'non-string';
  if (v === '') return 'empty';
  if (v.trim() !== v) return 'whitespace';
  if (v.includes('\0')) return 'nul';
  if (v.includes('\\')) return 'not-posix';
  if (path.isAbsolute(v)) return 'absolute';
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(v)) return 'uri-scheme';
  const segments = v.split('/');
  if (segments.some((s) => s === '')) return 'empty-segment';
  if (segments.some((s) => s === '.')) return 'dot-segment';
  if (segments.some((s) => s === '..')) return 'dotdot';
  if (path.posix.normalize(v) !== v) return 'not-normalized';
  if (!v.startsWith(BLOGGER_POSTS_PREFIX)) return 'not-under-blogger-posts';
  if (v.endsWith('.fb.md')) return 'fb-md';
  if (!v.endsWith('.md')) return 'not-md';
  return null;
}

// 由 source path 唯一推導 sidecar path（`<stem>.md` → `<stem>.publish.json`）。
export function deriveSidecarPath(sourcePath) {
  if (typeof sourcePath !== 'string' || !sourcePath.endsWith('.md')) return null;
  return sourcePath.slice(0, -'.md'.length) + '.publish.json';
}

// ── strict TZ-ISO：reuse landed parseTzIso（不重新發明、不改 contract module）─────────
// 把候選字串同時嵌入合成 withdrawn lifecycle event 的 recordedAt 與 remoteVerifiedAt，跑 landed
// collectSidecarWithdrawalIssues，若沒有任何 remoteVerifiedAt timestamp issue 即視為合法。
// recordedAt === remoteVerifiedAt 可避免合法 instant 觸發 ordering（verified-after-recorded）issue。
const _TZ_PLACEHOLDER_SHA64 = 'a'.repeat(64);
const _TZ_PLACEHOLDER_SHA40 = 'a'.repeat(40);
export function isLandedStrictTzIso(value) {
  const syntheticSidecar = {
    schemaVersion: 2,
    blogger: {
      status: WITHDRAWN_STATUS,
      publishedUrl: 'https://placeholder.invalid/x',
      publishedAt: '2026-01-01T00:00:00+00:00',
      bloggerPostId: '',
      lifecycle: [
        {
          event: LIFECYCLE_WITHDRAWN_EVENT,
          fromStatus: 'published',
          toStatus: WITHDRAWN_STATUS,
          recordedAt: typeof value === 'string' ? value : '2026-01-01T00:00:00+00:00',
          remoteVerifiedAt: value,
          reason: 'stage-preview',
          remoteDisposition: 'remote-deleted',
          sourcePath: 'content/blogger/posts/placeholder.md',
          sourceSha256: _TZ_PLACEHOLDER_SHA64,
          priorSidecarSha256: _TZ_PLACEHOLDER_SHA64,
          gitHead: _TZ_PLACEHOLDER_SHA40,
          authorizationFingerprint: _TZ_PLACEHOLDER_SHA64,
        },
      ],
    },
  };
  const issues = collectSidecarWithdrawalIssues(syntheticSidecar, {});
  return !issues.some(
    (i) =>
      i.type === WITHDRAWAL_ISSUE_TYPES.lifecycleTimestampMalformed &&
      typeof i.value === 'string' &&
      i.value.startsWith('remoteVerifiedAt'),
  );
}

// ── canonical serialization + fingerprints（§六）──────────────────────────────────
// canonical JSON：sorted keys、無空白、deterministic。相同輸入在不同 timezone / OS path separator
// 下 byte-identical（所有輸入皆已是 POSIX 字串 / hex / enum / number）。
export function canonicalize(value) {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'string') return JSON.stringify(value);
  if (t === 'number') {
    if (!Number.isFinite(value)) throw new Error('canonicalize: non-finite number');
    return JSON.stringify(value);
  }
  if (t === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']';
  if (t === 'object') {
    const keys = Object.keys(value).sort();
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalize(value[k])).join(',') + '}';
  }
  throw new Error(`canonicalize: unsupported type ${t}`);
}

function sha256Hex(text) {
  return createHash('sha256').update(text, 'utf-8').digest('hex');
}

// Plan fingerprint（§六）：綁整份 withdrawal plan 的穩定、非敏感語意。
//   binds: plan version / git head / candidate count / 每個 candidate 之 relative source+sidecar path
//          / current status / classification / published URL fingerprint。
//   NOT bound: current time / temp path / absolute path / raw published URL / raw post id /
//              operator identity / authorization file path。
export function computePlanFingerprint(plan) {
  const payload = {
    fingerprintKind: PLAN_FINGERPRINT_KIND,
    planVersion: plan.planVersion,
    gitHead: plan.gitHead,
    candidateCount: plan.summary.candidateCount,
    candidates: plan.candidates.map((c) => ({
      sourcePath: c.sourcePath,
      sidecarPath: c.sidecarPath,
      currentStatus: c.sidecarStatus,
      classification: CLASSIFICATION.candidate,
      publishedUrlFingerprint: c.publishedUrlFingerprint,
    })),
  };
  return { algorithm: 'sha256', encoding: 'hex', value: sha256Hex(canonicalize(payload)) };
}

// Record fingerprint（§六）：綁單一撤回意圖。任一綁定值改變 → fingerprint 改變。
export function computeRecordFingerprint({
  sourcePath,
  sidecarPath,
  expectedCurrentStatus,
  expectedSourceSha256,
  expectedSidecarSha256,
  expectedPublishedUrlFingerprint,
  remoteDisposition,
  remoteVerifiedAt,
  reason,
  reasonDetail,
}) {
  const payload = {
    fingerprintKind: RECORD_FINGERPRINT_KIND,
    operation: WITHDRAWAL_OPERATION,
    sourcePath,
    sidecarPath,
    expectedCurrentStatus,
    expectedSourceSha256,
    expectedSidecarSha256,
    expectedPublishedUrlFingerprint,
    remoteDisposition,
    remoteVerifiedAt,
    reason,
    reasonDetail,
  };
  return { algorithm: 'sha256', encoding: 'hex', value: sha256Hex(canonicalize(payload)) };
}

// ── deterministic draft builder / serializer ───────────────────────────────────
// 固定 key order（top-level：schemaVersion → purpose → repository → plan → target →
// withdrawal → approval）；approval.explicitlyAuthorized 硬編碼 boolean false。
export function buildDraft({ head, planFingerprint, recordFingerprint, target, withdrawal }) {
  return {
    schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
    purpose: AUTHORIZATION_PURPOSE,
    repository: {
      expectedBranch: AUTHORIZATION_BRANCH,
      expectedHead: head,
    },
    plan: {
      expectedPlanFingerprint: planFingerprint,
      expectedRecordFingerprint: recordFingerprint,
      recordCount: 1,
    },
    target: {
      sourcePath: target.sourcePath,
      sidecarPath: target.sidecarPath,
      expectedSourceSha256: target.expectedSourceSha256,
      expectedSidecarSha256: target.expectedSidecarSha256,
      expectedCurrentStatus: target.expectedCurrentStatus,
      expectedPublishedUrlFingerprint: target.expectedPublishedUrlFingerprint,
    },
    withdrawal: {
      event: WITHDRAWAL_EVENT,
      remoteDisposition: withdrawal.remoteDisposition,
      remoteVerifiedAt: withdrawal.remoteVerifiedAt,
      reason: withdrawal.reason,
      reasonDetail: withdrawal.reasonDetail,
    },
    approval: {
      explicitlyAuthorized: false,
    },
  };
}

export function serializeDraft(draft) {
  return JSON.stringify(draft, null, 2) + '\n';
}

// ── duplicate-key detection（§七：duplicate semantic fields fail-closed）──────────
// JSON.parse collapses duplicate keys (last-wins)，故 shape 檢查無法偵測 raw duplicate key。
// 本 tokenizer 掃描 raw JSON text，於任一 object level 偵測重複 key（正確跳過字串內容與 escapes）。
// 只在 JSON.parse 成功（text 為合法 JSON）後呼叫。回 true 表存在 duplicate key。
export function jsonTextHasDuplicateKeys(text) {
  const stack = []; // frames: { type:'object', keys:Set } | { type:'array' }
  let expectKey = false;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      let s = '';
      while (j < n) {
        const cj = text[j];
        if (cj === '\\') {
          s += text[j + 1] ?? '';
          j += 2;
          continue;
        }
        if (cj === '"') break;
        s += cj;
        j += 1;
      }
      const top = stack[stack.length - 1];
      if (top && top.type === 'object' && expectKey) {
        if (top.keys.has(s)) return true;
        top.keys.add(s);
        expectKey = false;
      }
      i = j + 1;
      continue;
    }
    if (c === '{') {
      stack.push({ type: 'object', keys: new Set() });
      expectKey = true;
      i += 1;
      continue;
    }
    if (c === '[') {
      stack.push({ type: 'array' });
      expectKey = false;
      i += 1;
      continue;
    }
    if (c === '}' || c === ']') {
      stack.pop();
      expectKey = false;
      i += 1;
      continue;
    }
    if (c === ',') {
      const top = stack[stack.length - 1];
      expectKey = !!(top && top.type === 'object');
      i += 1;
      continue;
    }
    if (c === ':') {
      expectKey = false;
      i += 1;
      continue;
    }
    i += 1;
  }
  return false;
}

// ── strict authorization document parser（§七）────────────────────────────────────
// 輸入：raw authorization file text。回 { ok:true, authorization, explicitlyAuthorized } 或
//   { ok:false, blocker:<safe slug> }。所有 blocker 皆固定安全短碼，**絕不**回顯內容。
// approval.explicitlyAuthorized === false 之 shape-valid draft 視為 documentValid（blocker 不觸發）；
//   只有非 boolean 才 fail document validity（§七：1 / "true" / "yes" 不可視為授權）。
export function parseAndValidateAuthorization(rawText) {
  if (typeof rawText !== 'string') return { ok: false, blocker: 'authorization-unreadable' };

  // duplicate semantic key（§七）—— 在 JSON.parse 前先確認可 parse，再掃 duplicate。
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, blocker: 'authorization-parse-error' };
  }
  if (jsonTextHasDuplicateKeys(rawText)) {
    return { ok: false, blocker: 'authorization-duplicate-key' };
  }
  if (!isPlainObject(parsed)) return { ok: false, blocker: 'authorization-not-object' };

  // top-level strict allowlist
  for (const k of Object.keys(parsed)) {
    if (!ALLOWED_TOP_KEYS.has(k)) return { ok: false, blocker: 'authorization-unknown-top-level-key' };
  }
  if (parsed.schemaVersion !== AUTHORIZATION_SCHEMA_VERSION) {
    return { ok: false, blocker: 'authorization-schema-version-invalid' };
  }
  if (parsed.purpose !== AUTHORIZATION_PURPOSE) {
    return { ok: false, blocker: 'authorization-purpose-mismatch' };
  }

  // repository
  if (!isPlainObject(parsed.repository)) return { ok: false, blocker: 'authorization-repository-invalid' };
  for (const k of Object.keys(parsed.repository)) {
    if (!ALLOWED_REPO_KEYS.has(k)) return { ok: false, blocker: 'authorization-repository-unknown-key' };
  }
  if (parsed.repository.expectedBranch !== AUTHORIZATION_BRANCH) {
    return { ok: false, blocker: 'authorization-branch-invalid' };
  }
  if (!isGitSha40Lower(parsed.repository.expectedHead)) {
    return { ok: false, blocker: 'authorization-head-invalid' };
  }

  // plan
  if (!isPlainObject(parsed.plan)) return { ok: false, blocker: 'authorization-plan-invalid' };
  for (const k of Object.keys(parsed.plan)) {
    if (!ALLOWED_PLAN_KEYS.has(k)) return { ok: false, blocker: 'authorization-plan-unknown-key' };
  }
  if (!isSha256HexLower(parsed.plan.expectedPlanFingerprint)) {
    return { ok: false, blocker: 'authorization-plan-fingerprint-invalid' };
  }
  if (!isSha256HexLower(parsed.plan.expectedRecordFingerprint)) {
    return { ok: false, blocker: 'authorization-record-fingerprint-invalid' };
  }
  if (parsed.plan.recordCount !== 1) {
    return { ok: false, blocker: 'authorization-record-count-invalid' };
  }

  // target
  if (!isPlainObject(parsed.target)) return { ok: false, blocker: 'authorization-target-invalid' };
  for (const k of Object.keys(parsed.target)) {
    if (!ALLOWED_TARGET_KEYS.has(k)) return { ok: false, blocker: 'authorization-target-unknown-key' };
  }
  if (classifyBloggerSourcePath(parsed.target.sourcePath) !== null) {
    return { ok: false, blocker: 'authorization-target-source-path-invalid' };
  }
  if (parsed.target.sidecarPath !== deriveSidecarPath(parsed.target.sourcePath)) {
    return { ok: false, blocker: 'authorization-target-sidecar-path-mismatch' };
  }
  if (!isSha256HexLower(parsed.target.expectedSourceSha256)) {
    return { ok: false, blocker: 'authorization-target-source-sha-invalid' };
  }
  if (!isSha256HexLower(parsed.target.expectedSidecarSha256)) {
    return { ok: false, blocker: 'authorization-target-sidecar-sha-invalid' };
  }
  if (parsed.target.expectedCurrentStatus !== EXPECTED_CURRENT_STATUS) {
    return { ok: false, blocker: 'authorization-target-current-status-invalid' };
  }
  if (!isSha256HexLower(parsed.target.expectedPublishedUrlFingerprint)) {
    return { ok: false, blocker: 'authorization-target-published-url-fingerprint-invalid' };
  }

  // withdrawal
  if (!isPlainObject(parsed.withdrawal)) return { ok: false, blocker: 'authorization-withdrawal-invalid' };
  for (const k of Object.keys(parsed.withdrawal)) {
    if (!ALLOWED_WITHDRAWAL_KEYS.has(k)) return { ok: false, blocker: 'authorization-withdrawal-unknown-key' };
  }
  if (parsed.withdrawal.event !== WITHDRAWAL_EVENT) {
    return { ok: false, blocker: 'authorization-withdrawal-event-invalid' };
  }
  if (!REMOTE_DISPOSITIONS.has(parsed.withdrawal.remoteDisposition)) {
    return { ok: false, blocker: 'authorization-remote-disposition-invalid' };
  }
  if (!isLandedStrictTzIso(parsed.withdrawal.remoteVerifiedAt)) {
    return { ok: false, blocker: 'authorization-remote-verified-at-invalid' };
  }
  if (!LIFECYCLE_REASONS.has(parsed.withdrawal.reason)) {
    return { ok: false, blocker: 'authorization-reason-invalid' };
  }
  // reasonDetail：本 authorization contract 要求為字串（允許空字串；§四 schema literal 之預設值）。
  if (typeof parsed.withdrawal.reasonDetail !== 'string') {
    return { ok: false, blocker: 'authorization-reason-detail-invalid' };
  }

  // approval
  if (!isPlainObject(parsed.approval)) return { ok: false, blocker: 'authorization-approval-invalid' };
  for (const k of Object.keys(parsed.approval)) {
    if (!ALLOWED_APPROVAL_KEYS.has(k)) return { ok: false, blocker: 'authorization-approval-unknown-key' };
  }
  // boolean 必須是真正 boolean（§七）；1 / "true" / "yes" / null → document invalid。
  if (typeof parsed.approval.explicitlyAuthorized !== 'boolean') {
    return { ok: false, blocker: 'authorization-approval-not-boolean' };
  }

  return {
    ok: true,
    authorization: parsed,
    explicitlyAuthorized: parsed.approval.explicitlyAuthorized === true,
  };
}
