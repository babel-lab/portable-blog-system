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
  isRemoteDisposition,
  isLifecycleReason,
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
// Contract：`Object.freeze(new Set(...))` **不會**凍結 Set 的 internal slots —— 外部持有 Set
//   reference 的 caller 仍可用 `.add` / `.delete` / `.clear` 放寬或破壞 allowlist（Slice 4H 已
//   reproduce）。因此每層 allowlist 對外只暴露 **frozen value array**（`ALLOWED_*_KEY_VALUES`），
//   parser 內部 membership check 使用 **module-private** lookup Set（永不 export、永不透過 getter
//   回傳），如此 caller 無法拿到可 mutate 的 Set。
export const ALLOWED_TOP_KEY_VALUES = Object.freeze([
  'schemaVersion', 'purpose', 'repository', 'plan', 'target', 'withdrawal', 'approval',
]);
export const ALLOWED_REPO_KEY_VALUES = Object.freeze(['expectedBranch', 'expectedHead']);
export const ALLOWED_PLAN_KEY_VALUES = Object.freeze([
  'expectedPlanFingerprint', 'expectedRecordFingerprint', 'recordCount',
]);
export const ALLOWED_TARGET_KEY_VALUES = Object.freeze([
  'sourcePath',
  'sidecarPath',
  'expectedSourceSha256',
  'expectedSidecarSha256',
  'expectedCurrentStatus',
  'expectedPublishedUrlFingerprint',
]);
export const ALLOWED_WITHDRAWAL_KEY_VALUES = Object.freeze([
  'event', 'remoteDisposition', 'remoteVerifiedAt', 'reason', 'reasonDetail',
]);
export const ALLOWED_APPROVAL_KEY_VALUES = Object.freeze(['explicitlyAuthorized']);

const _ALLOWED_TOP_KEY_SET = new Set(ALLOWED_TOP_KEY_VALUES);
const _ALLOWED_REPO_KEY_SET = new Set(ALLOWED_REPO_KEY_VALUES);
const _ALLOWED_PLAN_KEY_SET = new Set(ALLOWED_PLAN_KEY_VALUES);
const _ALLOWED_TARGET_KEY_SET = new Set(ALLOWED_TARGET_KEY_VALUES);
const _ALLOWED_WITHDRAWAL_KEY_SET = new Set(ALLOWED_WITHDRAWAL_KEY_VALUES);
const _ALLOWED_APPROVAL_KEY_SET = new Set(ALLOWED_APPROVAL_KEY_VALUES);

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
// JSON.parse collapses duplicate object keys (last-value-wins)，故 shape 檢查與 JSON.parse 結果
// 皆無法偵測 raw duplicate key —— 更危險的是 escaped duplicate（`explicitlyAuthorized` 與
// `explicitlyAuthorized` JSON 解碼後語意相同），會靜默落入 last-value-wins。
//
// 本掃描以**嚴格 recursive-descent JSON parser**（方案 A）獨立於 JSON.parse 之外完整解析 grammar，
// 並於建構每個 object scope 時：
//   1. 切出完整 JSON string token（正確處理 \" / \\ / \uXXXX / surrogate 等 escape，找出真正的
//      terminating quote）。
//   2. 以 JSON.parse(rawStringToken) 取得與 JSON.parse property-name **一致**的 decoded 字串。
//   3. 於**該 object scope**（不跨 array / 不跨 nested object）比較 decoded key；已存在即 duplicate。
// duplicate 的定義 = decoded property name 之 exact string equality（不做 case-fold / normalize /
// trim / locale transform）。任何 grammar 違反、malformed escape、unterminated string、trailing
// comma、trailing 非空白、控制字元未 escape 等 → malformed（fail-closed）。
//
// 回傳 discriminated status：'ok' | 'duplicate' | 'malformed'。**絕不**回顯 key 名 / 內容 / offset。
const _DUP = Symbol('duplicate-decoded-key');
const _JSON_WS = new Set([' ', '\t', '\n', '\r']);

export function scanJsonForDuplicateKeys(text) {
  if (typeof text !== 'string') return { status: 'malformed' };
  const n = text.length;
  let i = 0;

  const fail = () => {
    throw undefined; // 內部 sentinel：任何 grammar 違反 → malformed（不攜帶內容）
  };
  const skipWs = () => {
    while (i < n && _JSON_WS.has(text[i])) i += 1;
  };

  // 假設 text[i] === '"'；回 decoded 字串並將 i 前移至 closing quote 之後。
  const parseStringDecoded = () => {
    const start = i;
    i += 1;
    while (i < n) {
      const c = text[i];
      if (c === '\\') {
        if (i + 1 >= n) fail(); // dangling escape
        i += 2; // backslash escapes exactly the next char（用於找 terminating quote）
        continue;
      }
      if (c === '"') {
        const raw = text.slice(start, i + 1);
        i += 1;
        let decoded;
        try {
          decoded = JSON.parse(raw); // 精確 JSON 解碼（含 \uXXXX / surrogate / malformed → throw）
        } catch {
          fail();
        }
        if (typeof decoded !== 'string') fail();
        return decoded;
      }
      if (c < ' ') fail(); // 未 escape 的控制字元（U+0000..U+001F）在 JSON string 內非法
      i += 1;
    }
    fail(); // unterminated string
  };

  const parseNumber = () => {
    const start = i;
    if (text[i] === '-') i += 1;
    if (text[i] === '0') {
      i += 1;
    } else if (text[i] >= '1' && text[i] <= '9') {
      while (i < n && text[i] >= '0' && text[i] <= '9') i += 1;
    } else {
      fail();
    }
    if (text[i] === '.') {
      i += 1;
      if (!(text[i] >= '0' && text[i] <= '9')) fail();
      while (i < n && text[i] >= '0' && text[i] <= '9') i += 1;
    }
    if (text[i] === 'e' || text[i] === 'E') {
      i += 1;
      if (text[i] === '+' || text[i] === '-') i += 1;
      if (!(text[i] >= '0' && text[i] <= '9')) fail();
      while (i < n && text[i] >= '0' && text[i] <= '9') i += 1;
    }
    if (i === start) fail();
  };

  const parseObject = () => {
    i += 1; // consume '{'
    const seen = new Set(); // 本 object scope 獨立的 decoded-key set
    skipWs();
    if (text[i] === '}') { i += 1; return; }
    for (;;) {
      skipWs();
      if (text[i] !== '"') fail(); // key 必為 string
      const key = parseStringDecoded();
      if (seen.has(key)) throw _DUP; // duplicate decoded property name → fail-closed
      seen.add(key);
      skipWs();
      if (text[i] !== ':') fail();
      i += 1;
      parseValue();
      skipWs();
      if (text[i] === ',') { i += 1; continue; }
      if (text[i] === '}') { i += 1; return; }
      fail(); // 缺 comma / closing brace（含 trailing comma）
    }
  };

  const parseArray = () => {
    i += 1; // consume '['
    skipWs();
    if (text[i] === ']') { i += 1; return; }
    for (;;) {
      parseValue();
      skipWs();
      if (text[i] === ',') { i += 1; continue; }
      if (text[i] === ']') { i += 1; return; }
      fail(); // 缺 comma / closing bracket（含 trailing comma）
    }
  };

  function parseValue() {
    skipWs();
    if (i >= n) fail();
    const c = text[i];
    if (c === '{') return parseObject();
    if (c === '[') return parseArray();
    if (c === '"') { parseStringDecoded(); return; }
    if (c === '-' || (c >= '0' && c <= '9')) { parseNumber(); return; }
    if (text.startsWith('true', i)) { i += 4; return; }
    if (text.startsWith('false', i)) { i += 5; return; }
    if (text.startsWith('null', i)) { i += 4; return; }
    fail();
  }

  try {
    parseValue();
    skipWs();
    if (i !== n) return { status: 'malformed' }; // trailing 非空白
    return { status: 'ok' };
  } catch (e) {
    if (e === _DUP) return { status: 'duplicate' };
    return { status: 'malformed' }; // 含 grammar 違反 / native RangeError（極端 nesting）→ fail-closed
  }
}

// backward-compatible boolean helper（既有匯入 / 單元測試沿用）：僅回報 duplicate。
// 注意：malformed JSON 於此回 false（非 duplicate）；contract-level fail-closed 由
// parseAndValidateAuthorization 依 status 分流（malformed → parse-error）。
export function jsonTextHasDuplicateKeys(text) {
  return scanJsonForDuplicateKeys(text).status === 'duplicate';
}

// ── strict authorization document parser（§七）────────────────────────────────────
// 輸入：raw authorization file text。回 { ok:true, authorization, explicitlyAuthorized } 或
//   { ok:false, blocker:<safe slug> }。所有 blocker 皆固定安全短碼，**絕不**回顯內容。
// approval.explicitlyAuthorized === false 之 shape-valid draft 視為 documentValid（blocker 不觸發）；
//   只有非 boolean 才 fail document validity（§七：1 / "true" / "yes" 不可視為授權）。
export function parseAndValidateAuthorization(rawText) {
  if (typeof rawText !== 'string') return { ok: false, blocker: 'authorization-unreadable' };

  // §七：duplicate semantic key + grammar 驗證必須發生在 JSON.parse **之前**，否則 last-value-wins
  // 會先把 escaped-duplicate 的 approval key 收斂成一個被信任的值。property name 以 JSON escape
  // 解碼後比較（literal 與 \uXXXX 拼法解碼後相同 → duplicate）。
  const scan = scanJsonForDuplicateKeys(rawText);
  if (scan.status === 'duplicate') {
    return { ok: false, blocker: 'authorization-duplicate-key' };
  }
  if (scan.status === 'malformed') {
    return { ok: false, blocker: 'authorization-parse-error' };
  }
  // scan.status === 'ok'：grammar 合法且任一 object scope 皆無 duplicate decoded key。
  // JSON.parse 作為第二道防線（理應與 scanner 一致；不一致時仍 fail-closed）。
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, blocker: 'authorization-parse-error' };
  }
  if (!isPlainObject(parsed)) return { ok: false, blocker: 'authorization-not-object' };

  // top-level strict allowlist
  for (const k of Object.keys(parsed)) {
    if (!_ALLOWED_TOP_KEY_SET.has(k)) return { ok: false, blocker: 'authorization-unknown-top-level-key' };
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
    if (!_ALLOWED_REPO_KEY_SET.has(k)) return { ok: false, blocker: 'authorization-repository-unknown-key' };
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
    if (!_ALLOWED_PLAN_KEY_SET.has(k)) return { ok: false, blocker: 'authorization-plan-unknown-key' };
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
    if (!_ALLOWED_TARGET_KEY_SET.has(k)) return { ok: false, blocker: 'authorization-target-unknown-key' };
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
    if (!_ALLOWED_WITHDRAWAL_KEY_SET.has(k)) return { ok: false, blocker: 'authorization-withdrawal-unknown-key' };
  }
  if (parsed.withdrawal.event !== WITHDRAWAL_EVENT) {
    return { ok: false, blocker: 'authorization-withdrawal-event-invalid' };
  }
  if (!isRemoteDisposition(parsed.withdrawal.remoteDisposition)) {
    return { ok: false, blocker: 'authorization-remote-disposition-invalid' };
  }
  if (!isLandedStrictTzIso(parsed.withdrawal.remoteVerifiedAt)) {
    return { ok: false, blocker: 'authorization-remote-verified-at-invalid' };
  }
  if (!isLifecycleReason(parsed.withdrawal.reason)) {
    return { ok: false, blocker: 'authorization-reason-invalid' };
  }
  // reasonDetail：本 authorization contract 要求為字串（允許空字串；§四 schema literal 之預設值）。
  if (typeof parsed.withdrawal.reasonDetail !== 'string') {
    return { ok: false, blocker: 'authorization-reason-detail-invalid' };
  }

  // approval
  if (!isPlainObject(parsed.approval)) return { ok: false, blocker: 'authorization-approval-invalid' };
  for (const k of Object.keys(parsed.approval)) {
    if (!_ALLOWED_APPROVAL_KEY_SET.has(k)) return { ok: false, blocker: 'authorization-approval-unknown-key' };
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
