# Blogger backfill apply authorization — preparation + read-only preflight（2026-07-19）

Session：`260719 / add apply authorization preparation`

- Date：2026-07-19（Asia/Taipei）
- Type：source slice（read-only draft generator + read-only preflight validator + focused guard + minimal `loadAuthorization` refactor for schema sharing + docs；zero production content / sidecar / Markdown / deploy / dist-* mutation this Session）
- Baseline：source `HEAD = origin/main = 1c9e78f`（subject `feat(backfill): add authorization-bound apply capability`）；deploy `HEAD = origin/gh-pages = 0eaf9c6`
- Pipeline position：**preparation + preflight** — sits between the apply capability landed at `1c9e78f` and any future Dean-authored production execution

> ⚠️ This document adds **preparation** and **read-only preflight** capability. It does **not** author any approved production authorization. It does **not** execute apply. The six missing sidecars from `20260612-*` remain unwritten. Approval is still a separate out-of-band step: an operator flips `explicitlyAuthorized` from `false` to `true` in a file that this tooling emitted as an unapproved draft.

---

## 1. Purpose / pipeline position

```
missing-sidecar planner
  → optional create-only bootstrap
  → truth-manifest template generator
  → truth-manifest intake validator     (validate:blogger-backfill-truth-manifest)
  → validated apply-plan gate           (plan:blogger-backfill-truth-apply)
  → fingerprint-bound OS-temp rehearsal (rehearse:blogger-backfill-truth-apply)
  → authorization-bound single-record production apply capability
                                        (apply:blogger-backfill-truth)
  → **this slice**
      preparation:    prepare:blogger-backfill-apply-authorization
      preflight:      validate:blogger-backfill-apply-authorization
  → future production execution         (each apply invocation = Dean-approved
                                         authorization + separate commit / push)
```

Two commands land in this slice:

1. **Draft generator** — `prepare:blogger-backfill-apply-authorization`
   Reads a validator-PASS manifest + a single `--source-path`, then emits an **unapproved** authorization JSON to stdout that binds the current source repo HEAD, expected plan / per-record fingerprint, exact target path, and record count. `approval.explicitlyAuthorized` is fixed at `false`. Emits to stdout only — no file is written.
2. **Preflight validator** — `validate:blogger-backfill-apply-authorization`
   Reads a manifest + `--source-path` + `--authorization` (path to an already-authored authorization JSON), then verifies (a) document shape per the same schema `apply:blogger-backfill-truth` enforces, (b) all bindings match runtime state, and (c) `approval.explicitlyAuthorized === true`. Emits a classification (`authorizationDocumentValid`, `authorizationBindingsMatched`, `explicitlyAuthorized`, `applyReady`, `writePerformed`, `blockers`). Never executes apply.

---

## 2. Non-goals for this slice

- No approved production authorization document created.
- No production apply executed.
- No production `.publish.json` created or modified.
- No production Markdown modified.
- No `bloggerPostId` written or fabricated.
- No commit / push automation added.
- No `.gitignore` modification.
- No repo-internal authorization storage convention established.
- No build / deploy / preview / dist-* / dist-blogger-preview mutation.
- No Blogger / Google / GA4 / AdSense API call.
- No network access.
- No fetch / pull.
- No custom domain / AdSense config change.
- No warning-only guard upgraded to blocking.
- The six missing sidecars from `20260612-*` remain unwritten.

---

## 3. Files landed

| File | Purpose |
| --- | --- |
| `src/scripts/prepare-blogger-backfill-apply-authorization.js` | draft generator; stdout only; explicitlyAuthorized fixed false |
| `src/scripts/validate-blogger-backfill-apply-authorization.js` | preflight validator; read-only classification; never applies |
| `src/scripts/check-blogger-backfill-apply-authorization-preparation.js` | focused guard covering both tools |
| `src/scripts/apply-blogger-backfill-truth.js` | minimal schema-sharing refactor: `loadAuthorization` gains `{ requireApproved: true }` option; behavior at apply is unchanged |
| `package.json` | adds `prepare:blogger-backfill-apply-authorization` + `validate:blogger-backfill-apply-authorization` + `check:blogger-backfill-apply-authorization-preparation` scripts |
| `docs/20260719-blogger-backfill-apply-authorization-preparation.md` | this document |

**Not landed** (deliberately out of scope):

- Any production authorization document.
- Any commit / push automation.
- Any build / deploy step.
- Any Blogger API integration.
- Any receipt / audit log writer.

---

## 4. Schema-sharing refactor (minimal)

The apply engine's `loadAuthorization` previously refused any authorization document whose `approval.explicitlyAuthorized !== true`. That prevented a read-only preflight from cleanly separating "document is shape-valid" from "document is approved". To fix this without duplicating the schema (which §8 of the Session prompt forbids), `loadAuthorization` now takes:

```js
loadAuthorization(path, { requireApproved: true })   // default (apply)
loadAuthorization(path, { requireApproved: false })  // preflight
```

Rules:

- Type check is invariant: `typeof authorization.approval.explicitlyAuthorized === 'boolean'` — truthy non-boolean values (`1`, `"true"`, `"yes"`, `null`) always fail. The apply guard's existing "truthy but not true → error" test still passes.
- When `requireApproved: true` (apply), the loader still refuses `explicitlyAuthorized: false`. The apply guard's "explicitlyAuthorized=false → apply FAIL" test still passes.
- When `requireApproved: false` (preflight), `explicitlyAuthorized: false` is accepted at the document layer. The preflight validator reports `explicitlyAuthorized: false` separately and drives `applyReady: false` with a `blockers: ["explicit-authorization-not-granted"]` entry.

Apply engine, planner, admin-git-safety-preflight, and the truth-manifest validator all remain the single source of truth for the fields they own. There is no second schema definition in this slice.

---

## 5. Authorization draft generator

### 5.1 CLI contract

```bash
npm run prepare:blogger-backfill-apply-authorization -- \
  --manifest <path> \
  --source-path content/blogger/posts/<slug>.md \
  [--help]
```

- `--manifest` and `--source-path` are required.
- No `--json` (the output IS JSON — emitted to stdout).
- **No `--output` / `--out` / `--write` / `--save`** flag. This tool never writes a file. Saving the emitted JSON is a shell / editor operation performed by the operator out-of-band.
- Approval flags are hard-refused: `--approve`, `--authorized`, `--explicitly-authorized`, `--yes`, `-y`, `--apply`.
- Bypass / mutation / repo-root override flags are hard-refused (mirrored from apply's `FORBIDDEN_FLAGS`).
- Unknown flag → hard-fail.
- No environment-variable override for project root.

### 5.2 Behavior

1. Repository state gate: branch `main`, HEAD == origin/main, ahead/behind 0/0, working tree clean, `.git/index.lock` absent.
2. Validator + planner PASS (delegates to `plan:blogger-backfill-truth-apply` in-process).
3. Record selection: `--source-path` must correspond to exactly one plan entry.
4. Per-record fingerprint computed via the same `fingerprintEntry` the apply engine uses.
5. Draft assembled with fixed field ordering matching the apply schema exactly.

### 5.3 Draft shape

Exact draft schema (matches apply's `loadAuthorization` requirements verbatim):

```json
{
  "schemaVersion": 1,
  "purpose": "blogger-backfill-production-sidecar-apply",
  "repository": {
    "expectedHead": "<40-char lowercase hex>",
    "expectedBranch": "main"
  },
  "plan": {
    "expectedPlanFingerprint": "<64-char lowercase hex sha256>",
    "expectedRecordFingerprint": "<64-char lowercase hex sha256>",
    "recordCount": 1
  },
  "targets": [
    "content/blogger/posts/<slug>.publish.json"
  ],
  "approval": {
    "explicitlyAuthorized": false
  }
}
```

- `explicitlyAuthorized` is hard-coded `false` in the generator source. There is no CLI flag, no environment variable, and no programmatic hook that changes this.
- No timestamp, no absolute path, no hostname, no username, no payload duplication.
- 2-space pretty JSON with final newline.
- Same repo state + same manifest + same source-path → byte-identical stdout.
- Diagnostics go to stderr; stdout carries only the JSON draft. This lets `>authorization.json` capture the draft cleanly.

### 5.4 Failure behavior

Non-zero exit and NO draft emitted if any of:

- CLI misuse (missing / unknown / forbidden flag).
- Source-path outside `content/blogger/posts/`, contains `..`, or has backslashes.
- Repository state gate refused.
- Validator or planner refused.
- Source-path does not correspond to exactly one plan entry.
- Target already exists on disk (planner refuses at `SIDECAR_ALREADY_EXISTS`).

### 5.5 Recommended operator workflow

The apply capability requires a clean working tree. If an authorization document lands as an untracked file inside the repo root, the tree becomes dirty and apply refuses. Recommended:

1. Run the generator, capture stdout to a location **outside** the source repo (e.g., `~/authorizations/2026-XX-YY-<slug>.json`) OR to a `.gitignore`d path.
2. Review the printed JSON byte-for-byte — plan fingerprint, per-record fingerprint, HEAD, target.
3. If (and only if) the plan and target are what you intend to apply, edit the file and flip `approval.explicitlyAuthorized` from `false` to `true`.
4. Run `validate:blogger-backfill-apply-authorization` for a fresh, read-only preflight against runtime state.
5. Run `apply:blogger-backfill-truth ... --apply` as a separate authorized step.

This tooling does **not** automate steps 1, 3, 5. Steps 3 and 5 require separate Dean-explicit approval.

---

## 6. Read-only preflight validator

### 6.1 CLI contract

```bash
npm run validate:blogger-backfill-apply-authorization -- \
  --manifest <path> \
  --source-path content/blogger/posts/<slug>.md \
  --authorization <path> \
  [--json] [--help]
```

- All three flags required.
- `--json` emits a deterministic JSON envelope.
- **`--apply` is hard-refused**. This tool exists precisely to be the read-only alternative to apply.
- Mutation / bypass / output / repo-root flags are hard-refused.
- Unknown flag → hard-fail.

### 6.2 Classification report

Every preflight invocation classifies at four layers:

| Field | Meaning |
| --- | --- |
| `authorizationDocumentValid` | Document parsed and passed the shape schema (matches apply's `loadAuthorization` with `requireApproved: false`). Truthy non-boolean approval values still fail here. |
| `authorizationBindingsMatched` | Every runtime binding — HEAD, branch, plan fingerprint, per-record fingerprint, targets[0], recordCount — equals the value declared in the authorization. |
| `explicitlyAuthorized` | `approval.explicitlyAuthorized === true`. Reported separately so an unapproved-but-valid draft is not classified as malformed. |
| `applyReady` | ✅ === (documentValid ∧ bindingsMatched ∧ explicitlyAuthorized). Exit code 0 if true; 1 otherwise. |
| `writePerformed` | Invariantly `false`. |

`blockers` is a de-duplicated list of everything the caller must fix before apply. Categories:

- `source-path: …` — CLI arg malformed.
- `authorization-document-invalid: …` — shape / read / parse failure.
- `repo-state: …` — branch, HEAD, ahead/behind, clean tree, index lock.
- `plan-error: …` — planner threw.
- `plan-validation-failed` + `validator: …` / `planner: …` — validator or planner refused.
- `record-selection: …` — source-path not in plan (or ambiguous).
- `binding: head-mismatch | branch-mismatch | plan-fingerprint-mismatch | record-fingerprint-mismatch | target-mismatch | record-count-mismatch`.
- `explicit-authorization-not-granted` — approval bit is `false`.

### 6.3 Approved synthetic preflight

Passing a synthetic authorization with `explicitlyAuthorized: true` whose bindings all match runtime state produces `applyReady: true` and `writePerformed: false`. This is used ONLY inside the focused guard's OS-temp fixture — it does **not** produce an approved production authorization. The apply engine still requires a separately authored (and approved) authorization at apply-time, and separate commit / push authorization thereafter.

---

## 7. Exit codes and readiness convention

- Generator: exit 0 = draft emitted; exit 1 = any refusal.
- Preflight: exit 0 = `applyReady === true`; exit 1 = any other outcome (including well-formed-but-unapproved drafts and well-formed-but-bindings-mismatched authorizations).

The preflight convention mirrors the repo's existing readiness CLIs (`check:release-readiness`, `check:phase1-readiness`): non-zero exit whenever the answer is "not ready to proceed".

---

## 8. Repository cleanliness and the external-file recommendation

- The apply capability requires a clean working tree. If an operator drops the manifest or the authorization inside the source repo as an untracked file, the tree becomes dirty and apply refuses at `repo-state: dirty-working-tree`.
- The generator emits stdout only; it does not write a file. This lets the operator redirect to a path they choose — typically **outside** the source repo.
- Neither tool auto-adds any path to `.gitignore`.
- Neither tool establishes an in-repo authorization directory (e.g., `authorizations/`).
- If an operator does want an in-repo path, they must decide the location + `.gitignore` entry themselves. That policy decision is out of scope for this slice.
- Authorization is **an operational gate, not a cryptographic signature**. Anyone with repo write access can author an authorization file. The purpose is operational safety and auditability, not identity.

---

## 9. Red lines (both tools)

- Read-only: no `fs.writeFile` / `mkdir` / `rm` / `rename` / `unlink` / `copyFile` / `appendFile` / `link` in either tool's source.
- No `child_process` import.
- No `spawn` / `exec` / `spawnSync` / `execSync`.
- No `fetch`.
- No `node:http` / `node:https`.
- No `googleapis` / `oauth` / `blogger.googleapis.com`.
- No `git commit` / `git push` / `git add` / `git fetch` / `git pull` / `git reset` / `git clean` / `git stash` / `git checkout` command strings.
- No `npm run build` / no `dist-blogger-preview` reference.
- No `process.env.*APPLY_ROOT` / `*REPO_ROOT` / `*TEST_ROOT`.
- Both tools import the authorization schema constants (`AUTHORIZATION_SCHEMA_VERSION`, `AUTHORIZATION_PURPOSE`, `AUTHORIZATION_BRANCH`), the strict loader (`loadAuthorization`), and the fingerprint algorithm (`fingerprintEntry`) from `apply-blogger-backfill-truth.js`. There is no second source of truth.
- Both tools reuse `planTruthApply` from the planner and `evaluatePreflight` from `admin-git-safety-preflight.js`.

---

## 10. Focused guard

`check:blogger-backfill-apply-authorization-preparation` uses synthetic OS-temp git repositories for every write-path. Coverage categories (exact pass/total is emitted by the guard at runtime):

- Source-level static bans (both tools, per category).
- Generator hard-codes `explicitlyAuthorized: false` — only one `explicitlyAuthorized: <bool>` literal exists in the generator source, and it is `false`.
- `parseArgs` smoke for both CLIs (`--help`, `--key=value`, forbidden flags per name, unknown flag).
- CLI `--help` contract (usage mentions "read-only", "unapproved", "never applies", etc.).
- CLI forbidden / unknown / missing flag handling → exit 1.
- Generator happy path: draft shape matches apply's requirements, expected head / plan fp / record fp exact, `explicitlyAuthorized: false` fixed, no repo mutation, final newline, deterministic repeated output, no timestamp / hostname / username / absolute path / payload duplication.
- Generator refusals: unknown source, non-candidate source, path with `..`, target already exists, dirty tree, wrong branch, HEAD ahead of origin, index lock, validator failure (TODO sentinel).
- Preflight approved synthetic authorization → applyReady=true, writePerformed=false, deterministic JSON, stable JSON envelope, no repo mutation.
- Preflight unapproved draft (`explicitlyAuthorized: false`) → documentValid=true, bindingsMatched=true, explicitlyAuthorized=false, applyReady=false, blockers include `explicit-authorization-not-granted`.
- Preflight truthy non-boolean `explicitlyAuthorized` (1 / "true" / "yes") → documentValid=false.
- Preflight binding mismatches: HEAD, plan fingerprint, record fingerprint, target.
- Preflight shape / read failures: malformed JSON, missing file, wrong schema, wrong purpose, whitespace-padded SHA / fingerprint / target, unknown top-level field.
- Preflight drift: manifest changes after auth authored → plan-fingerprint-mismatch; HEAD advances after auth authored → head-mismatch; dirty tree at preflight time → repo-state blocker.
- Roundtrip: generator draft → operator flips approval → preflight → applyReady.
- Production safety: production sidecar list / bytes / mtime unchanged; production Markdown bytes / mtime unchanged; `dist-blogger-preview/` absent; deploy repository sidecar inventory unchanged.

---

## 11. Relationship to prior slices

- Predecessor authorities:
  - `docs/publish-json-schema.md` §5 / §8 / §9
  - `docs/20260706-blogger-identity-and-backfill-strategy.md`
  - `docs/20260706-blogger-backfill-write-target-inventory.md`
- Sibling slice-level:
  - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`
  - `docs/20260718-blogger-backfill-missing-sidecar-bootstrap.md`
  - `docs/20260718-blogger-backfill-truth-manifest-template.md`
  - `docs/20260719-blogger-backfill-truth-manifest-intake-validator.md`
  - `docs/20260719-blogger-backfill-truth-apply-plan.md`
  - `docs/20260719-blogger-backfill-sidecar-identity-contract-audit.md`
  - `docs/20260719-blogger-backfill-truth-apply-rehearsal.md`
  - `docs/20260719-blogger-backfill-production-apply-capability.md`
- Downstream: future production execution — Dean authors and approves an authorization document, invokes `apply:blogger-backfill-truth` per record, and separately authorizes commit / push. This slice does not implement any of those steps.

---

## 12. Explicit non-goals (this Session)

- ✅ No approved production authorization document authored.
- ✅ No production apply executed.
- ✅ No production sidecar mutation.
- ✅ No production Markdown mutation.
- ✅ No `bloggerPostId` guessed or written.
- ✅ No git add / commit / push automation added.
- ✅ No build / deploy / preview.
- ✅ No `dist-blogger-preview/` created.
- ✅ No `.gitignore` modified.
- ✅ No repo-internal authorization storage convention.
- ✅ No warning-only guard upgraded to blocking.
- ✅ No custom domain / AdSense config change.
- ✅ No network access.
- ✅ The six missing sidecars from `20260612-*` remain unwritten.

Production apply still requires:

1. A Dean-authored authorization document.
2. Runtime `applyReady === true` under this preflight.
3. A separately authorized commit.
4. A separately authorized push.

Each of those steps is out of scope for this slice and requires its own explicit approval.
