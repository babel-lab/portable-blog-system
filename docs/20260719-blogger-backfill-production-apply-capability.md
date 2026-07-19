# Blogger backfill truth apply — authorization-bound single-record production capability（2026-07-19）

Session：`260719 / add authorization-bound single-record production apply capability`

- Date：2026-07-19（Asia/Taipei）
- Type：source slice（production apply capability + focused guard + docs；zero production content / sidecar / Markdown / deploy / dist-* mutation this Session）
- Baseline：source `HEAD = origin/main = 38b13ef`（subject `fix(backfill): enforce no-replace rehearsal commits`）；deploy `HEAD = origin/gh-pages = 0eaf9c6`
- Pipeline position：**next** slice = future production execution（Dean-authored authorization + explicit approval + separate commit / push steps；this slice implements the capability but does NOT execute production apply）

> ⚠️ This document describes a **capability**, not an **execution**. This Session did **not** author any production authorization document. This Session did **not** invoke the capability against the real repository. The six missing sidecars from `20260612-*` remain unwritten. Any future production invocation still requires a Dean-authored authorization JSON that binds the exact source HEAD, plan / record fingerprint, and target path.

---

## 1. Purpose / pipeline position

```
missing-sidecar planner
  → optional create-only bootstrap
  → truth-manifest template generator
  → truth-manifest intake validator     (validate:blogger-backfill-truth-manifest)
  → validated apply-plan gate           (plan:blogger-backfill-truth-apply)
  → fingerprint-bound OS-temp rehearsal (rehearse:blogger-backfill-truth-apply)
  → this slice — authorization-bound single-record production apply capability
                                        (apply:blogger-backfill-truth)
  → future production execution         (each apply invocation = Dean-authored
                                         authorization + separate commit / push)
```

This slice adds a **capability** for creating a single `.publish.json` sidecar in the real repository, only after every gate passes. The capability itself does not authorize apply — it enforces that a Dean-supplied authorization document was passed in and that every field of that document matches the runtime state.

Distinction between **capability** and **execution**:

- **Capability** = the ability exists in code, guarded, tested. Invoking it still requires Dean's explicit authorization document. This slice landed the capability.
- **Execution** = actually invoking the capability against the real repository with a real authorization document, thereby creating a real sidecar. This slice did NOT execute.

---

## 2. Decision A — single-record production capability

The Session prompt asks for one of three decisions:

- **Decision A** — single-record production capability
- **Decision B** — multi-record batch production capability
- **Decision C** — capability remains blocked

This slice adopted **Decision A**.

### 2.1 Why not batch (Decision B)?

Multi-record apply requires a transaction primitive that either creates all sidecars or rolls back the ones already created. The rehearsal engine implements **best-effort compensating rollback** with inode ownership checks. That is sufficient for OS-temp fixture exercise but not for production, because:

- No `fsync` on files or on the containing directory.
- No crash-recovery journal — a process death mid-rollback can leave targets on disk that were created but not authorized to remain.
- Inode ownership checks are best-effort; inode recycling on POSIX filesystems can theoretically break ownership verification.
- The rehearsal engine's own documentation (`docs/20260719-blogger-backfill-truth-apply-rehearsal.md` §8.2) is explicit: "best-effort compensating rollback (not a filesystem transaction, not crash-safe)".

Production must not adopt a not-crash-safe transaction. Batch is out of scope until a crash-safe primitive lands.

### 2.2 Why single-record is fit for production

Each `.publish.json` sidecar is **independent** — no cross-references, no shared state, no ordering constraint. Creating six sidecars one at a time yields six separate authorizations, six separate commits (per §6), and six separate audit trails. Recovery is trivial: if a single write fails after commit, either the read-back verification catches it and the compensating unlink runs, or the target is left committed (single-record best-effort) and the caller inspects manually.

### 2.3 Consequence for the six missing sidecars

Dean will need to author six authorization documents (one per record) and invoke the capability six times, each time preceded by a plan + review + fingerprint capture step. This is a deliberate design: authorization is per-record, not per-batch.

---

## 3. Files landed

| File | Purpose |
| --- | --- |
| `src/scripts/apply-blogger-backfill-truth.js` | production apply engine + CLI; single-record; no-replace commit + read-back verify + compensating unlink on verification failure |
| `src/scripts/check-blogger-backfill-production-apply-capability.js` | focused guard; all writes happen under synthetic OS-temp git repositories |
| `package.json` | adds `apply:blogger-backfill-truth` + `check:blogger-backfill-production-apply-capability` scripts |
| `docs/20260719-blogger-backfill-production-apply-capability.md` | this document |

**Not landed** (deliberately out of scope):

- Any production authorization document
- Any production `.publish.json` create
- Any Markdown mutation
- Any `bloggerPostId` write
- Any git add / commit / push after apply — commit and push are separate authorized steps that this capability never performs
- Any Blogger / Google API integration
- Any build / deploy / preview
- Any receipt / audit-log sidecar writer

---

## 4. Authorization contract

Authorization is a **separate, external JSON document** that Dean authors per-record. Its presence at apply time is required; every field must match runtime state.

### 4.1 Schema

```json
{
  "schemaVersion": 1,
  "purpose": "blogger-backfill-production-sidecar-apply",
  "repository": {
    "expectedHead": "<40-char lowercase hex git SHA>",
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
    "explicitlyAuthorized": true
  }
}
```

### 4.2 Field rules

Any of the following → hard-fail (zero writes):

- `schemaVersion !== 1`
- `purpose !== "blogger-backfill-production-sidecar-apply"`
- `repository.expectedBranch !== "main"` (Decision A hard-codes main)
- `repository.expectedHead` is not 40-char lowercase hex — no uppercase, no surrounding whitespace, no wrong length
- `plan.expectedPlanFingerprint` / `plan.expectedRecordFingerprint` not 64-char lowercase hex sha256
- `plan.recordCount !== 1` (single-record; strict `===` on integer)
- `targets` is not an array of exactly one entry
- `targets[0]` is not a repo-relative POSIX path under `content/blogger/posts/` ending with `.publish.json`, or contains `..`, or is absolute
- `approval.explicitlyAuthorized !== true` (strict boolean; truthy values like `1`, `"true"`, `"yes"` are refused)
- Any unknown top-level field, or unknown key inside `repository` / `plan` / `approval`
- File missing, unreadable, or invalid JSON
- Non-object top-level

### 4.3 Bindings and their meaning

| Binding | Purpose |
| --- | --- |
| `repository.expectedHead` | Any source repo commit invalidates authorization. Any refactor of planner / bootstrap / validator will bump HEAD. Re-review required. |
| `repository.expectedBranch` | Belt-and-suspenders; Decision A hard-codes `main`. Any other branch is refused. |
| `plan.expectedPlanFingerprint` | Full-plan drift check. If any record in the manifest changes, plan fingerprint changes; authorization invalidated. |
| `plan.expectedRecordFingerprint` | Per-record binding for the selected record only. Independent of other records in the plan. |
| `plan.recordCount` | Hard-codes single-record semantics. `recordCount = 2` would be a category error under Decision A and is refused. |
| `targets[0]` | Exact target path. Even if fingerprint matches, target mismatch blocks apply. |
| `approval.explicitlyAuthorized` | Human-in-the-loop bit. Machines that generate authorization files must set this true; capability does not itself flip this bit. |

### 4.4 Authorization is NOT a security boundary

- Authorization is a **cryptographic hash comparison**, not a cryptographic **signature**. Anyone with repo write access can author an authorization file. The purpose is operational safety and auditability, not identity.
- No secret material is stored in the authorization file. It is safe to commit or share (though we recommend not committing production authorization documents — see §7).
- The capability does not verify who authored the authorization file. It only verifies that the file's declared expectations match runtime state.

### 4.5 No default path, no automatic generation

- The capability has no default `--authorization` path.
- There is no `apply:blogger-backfill-truth --generate-authorization` mode.
- The capability does not create authorization documents.
- No pre-committed generic authorization template in the repo satisfies the schema (the template would either have real fingerprints — obsolete on any commit — or placeholder fingerprints that fail the strict hex check).

---

## 5. Repository state gate

Reused from `src/scripts/admin-git-safety-preflight.js` via `evaluatePreflight({ projectRoot })`. Any of the following → hard-fail:

- `projectRoot` is not a valid absolute path
- `projectRoot` is not the git top-level (repo-root-mismatch)
- Branch is not `main`
- HEAD is unresolvable / detached
- `refs/heads/main` missing
- `refs/remotes/origin/main` missing (no automatic fetch is performed; this is a local-ref check)
- ahead > 0 or behind > 0 or diverged
- Working tree not clean (any staged / unstaged / untracked / renamed / conflicted entry)
- `.git/index.lock` present

**Additionally**:

- `preflight.head !== authorization.repository.expectedHead` → refuse
- `preflight.branch !== authorization.repository.expectedBranch` → refuse

### 5.1 Local `origin/main` caveat

- The capability does NOT fetch. `origin/main` is the last-known remote-tracking ref on the current machine.
- `preflight.eligible === true` means "local `origin/main` equals local `main`", not "remote server's `main` equals local `main`".
- Whether to fetch before applying is a **manual runbook decision**. The capability neither fetches nor documents when to fetch — that belongs in the operational runbook.

### 5.2 No CLI project-root override

- The CLI hardcodes `projectRoot = PROJECT_ROOT` (the source repo of the running script).
- There is no `--repo-root`, `--project-root`, or `--test-root` CLI flag. All three appear in `FORBIDDEN_FLAGS`.
- There is no environment-variable override. The engine source contains no `process.env.*APPLY_ROOT` / `process.env.*REPO_ROOT` / `process.env.*TEST_ROOT` reference (source-level static assertion in the focused guard).
- The programmatic API `applyProductionSidecar({ projectRoot, ... })` accepts a projectRoot parameter. This is used ONLY by the focused guard, which passes an OS-temp synthetic git repository. No caller other than the guard invokes the API with a non-default projectRoot.

---

## 6. Plan / fingerprint binding

### 6.1 Same-snapshot guarantee

- The engine calls `planTruthApply({ manifestPath, repoRoot: projectRoot })` exactly once.
- The plan and fingerprint returned are used verbatim. The engine NEVER re-reads the manifest, NEVER re-derives target paths, NEVER re-constructs payloads, and NEVER shells out.
- The plan's full fingerprint is compared strictly to `authorization.plan.expectedPlanFingerprint`.
- The selected record is chosen by `entry.sourcePath === --source-path`. There must be exactly one match.

### 6.2 Per-record fingerprint

Independent of the planner's full-plan fingerprint. Defined as:

```
sha256(canonicalJSON({
  planSchemaVersion,
  manifestSchemaVersion,
  entry: { sourcePath, targetPath, operation, payload }
}))
```

Deliberately does NOT bind: absolute path, repo root, timestamps, hostname, OS separator, process ID, tempdir. Same inputs → same fingerprint on any host or root.

The apply engine's `canonicalize` / `sha256Hex` helpers are **duplicated** from `plan-blogger-backfill-truth-apply.js`. This is intentional. If the planner's canonicalize algorithm ever changes, the source repo HEAD changes; authorization is HEAD-bound; the mismatch surfaces at the repo-state gate. Duplication decouples the apply capability from the planner's private helper surface.

### 6.3 Target binding

`authorization.targets[0] === selected.targetPath` is verified after fingerprint match. This is a belt-and-suspenders check — under the current design, the target is derived deterministically from the source-path via the planner, so the target list should never disagree with fingerprint match. But if the derivation ever changes (which would bump HEAD anyway), a mismatched target list still refuses apply.

### 6.4 No implicit ordering

Plan entries are sorted by `sourcePath` in the planner. The apply engine finds the entry matching `--source-path` explicitly. Array indices are never used to select records — index-based selection would be fragile against sort order changes.

---

## 7. Create-only no-replace primitive

Identical semantics to the rehearsal engine (`docs/20260719-blogger-backfill-truth-apply-rehearsal.md` §7):

1. `writeFile(<target>.production-apply.tmp, bodyBytes, { flag: 'wx' })` — exclusive create of the temp path. The suffix `.production-apply.tmp` is deliberately distinct from the rehearsal engine's `.rehearse.tmp` and the bootstrap writer's `.tmp` so a stray tmp cannot be mistaken.
2. `fs.link(tmp, target)` — sole no-replace commit primitive.
   - POSIX `link(2)`: destination exists → EEXIST. Target bytes / mtime unchanged.
   - Windows `CreateHardLinkW`: destination exists → `ERROR_ALREADY_EXISTS`. Target bytes / mtime unchanged.
   - No `fs.access(target, F_OK)` before `fs.link` — the `fs.link` primitive is itself the atomic destination-exists gate. No check-then-commit gap. No fallback to `fs.rename` (which is replace-capable on both platforms).
3. `fs.stat(target).ino` — capture inode for compensating-unlink ownership check.
4. Best-effort `fs.unlink(tmp)` — tmp leak does not roll back a successful commit.
5. Read-back verification: `fs.readFile(target)` byte-equality against the intended serialization.

### 7.1 Verification failure → compensating unlink

If read-back fails (bytes differ, or read throws):

- Attempt `fs.unlink(target)` only after inode ownership check.
- If `fs.stat(target).ino !== committedIno`, refuse to unlink (an external actor has replaced the target between commit and rollback). Surface `ownership-verification-failed` in the result.
- If `target` is already gone (ENOENT), treat as already rolled back.
- On successful unlink: mark `productionWritePerformed = false`, `writePerformed = false`, `createdTargets = []`, `repositoryNowDirty = false`.

### 7.2 Precise per-file atomicity claims

- ✅ **No-overwrite**: `fs.link` at destination-exists point is fail-closed on both platforms.
- ✅ **Complete-bytes visibility**: reader observing target sees the full intended serialization; bytes exist in tmp before the atomic link.
- ✅ **Cross-platform**: NTFS, ext4, APFS, ZFS, XFS, Btrfs, HFS+ all support hardlink.
- ⚠️ **FAT / exFAT**: `fs.link` will fail; engine hard-fails without fallback. This is a design choice, not a defect.
- ❌ **Not durable / crash-safe**: no file `fsync`, no directory `fsync`, no crash-recovery journal.
- ❌ **Not a filesystem transaction**: single record is atomic; multi-record is not supported (Decision A).

---

## 8. After apply: repository state, commit, push

### 8.1 Apply succeeded → repository is dirty

After successful apply, the created `.publish.json` file is present but untracked by git. `git status` will show it as an untracked file. This is expected and desired: it forces a manual review step before commit.

Result envelope:

```json
{
  "ok": true,
  "productionWritePerformed": true,
  "writePerformed": true,
  "commitPerformed": false,
  "pushPerformed": false,
  "repositoryNowDirty": true,
  "createdTargets": ["content/blogger/posts/<slug>.publish.json"],
  ...
}
```

### 8.2 Commit / push are separate authorized steps

This capability does NOT:

- Run `git add`
- Run `git commit`
- Run `git push`

These are explicit next steps that the operator performs manually after reviewing the created file. The capability's source contains no `git commit` / `git push` / `git add` / `git fetch` / `git pull` / `git reset` / `git clean` / `git stash` / `git checkout` / `git switch` / `git restore` command strings (source-level static assertion in the focused guard).

### 8.3 Future runbook

```
1. plan:blogger-backfill-truth-apply --manifest <path> --json  →  capture plan fingerprint + per-record fingerprint
2. Dean reviews plan payload byte-for-byte
3. Dean authors authorization JSON for one record
4. apply:blogger-backfill-truth --manifest <path> --source-path <path> --authorization <auth> --apply
5. Inspect created file byte-for-byte
6. Run all backfill guards + validate:content
7. Separate explicit authorization to commit and push
8. git add <target> && git commit && git push
```

Steps 1-4 and 7-8 are separately authorized. Step 4 is what this capability enables. Step 7 is future work; this Session does not implement any commit/push automation.

---

## 9. Recovery contract

### 9.1 Single-record failure modes

| Failure point | Outcome |
| --- | --- |
| Gate refused (authorization / repo-state / fingerprint / target) | `productionWritePerformed=false`, `writePerformed=false`, `createdTargets=[]`, `repositoryNowDirty` reflects preflight, errors listed |
| Write preflight refused (source missing, target exists) | Same as above |
| `fs.writeFile(tmp, wx)` failed | tmp cleaned up, target unchanged, `productionWritePerformed=false` |
| `fs.link(tmp, target)` failed (EEXIST or other) | tmp cleaned up, target unchanged (POSIX / Windows atomic no-replace), `productionWritePerformed=false` |
| Read-back verification failed + compensating unlink succeeded | target gone, `productionWritePerformed=false`, `writePerformed=false`, error surfaced |
| Read-back verification failed + compensating unlink refused (ownership check) | target still on disk (externally replaced), `productionWritePerformed=true`, both errors surfaced |
| Read-back verification succeeded | target present with intended bytes, `productionWritePerformed=true` |

### 9.2 No hidden rollback

If verification succeeds, the capability does NOT delete the target for any downstream "reporting" error. Post-success errors (e.g., logging failure) do not roll back the write.

### 9.3 Recovery from partial state

If a run left a target on disk that Dean does not want (e.g., ownership-verification-failed surfaced), Dean handles it manually (delete file, re-invoke). The capability does not offer a `--clean` mode.

---

## 10. `bloggerPostId: ""` contract preservation

Per `docs/20260719-blogger-backfill-sidecar-identity-contract-audit.md` Decision A:

- Written sidecar keeps `blogger.bloggerPostId: ""` — the schema-allowed incomplete-identity state.
- The capability does NOT guess post ID from URL / slug / title / date / any signal.
- Payload is taken verbatim from the planner's `entry.payload`, which reuses `buildSidecarBody` → `bloggerPostId: ""` hardcoded.
- If future Blogger API integration lands and captures real post IDs, `bloggerPostId` will change, which will change the record fingerprint — old authorization documents will be invalidated. This is the intended coupling.

---

## 11. Red lines

The capability's source enforces:

- No `child_process` import in the engine (transitive spawnSync in `admin-git-safety-preflight.js` is allowlisted to read-only git subcommands).
- No `spawnSync` / `execSync` / `spawn(` / `exec(`.
- No `fetch`.
- No `node:http` / `node:https`.
- No `googleapis` / `oauth` / `blogger.googleapis.com`.
- No `git commit` / `git push` / `git add` / `git fetch` / `git pull` / `git reset` / `git clean` / `git stash` / `git checkout` / `git switch` / `git restore` command strings.
- No `npm run build` / no `dist-blogger-preview` reference.
- No `fs.rename` in the engine (would be replace-capable).
- `fs.link` present (no-replace primitive).
- No `process.env.*APPLY_ROOT` / `*REPO_ROOT` / `*TEST_ROOT`.

The capability does NOT:

- Fabricate `bloggerPostId`.
- Modify Markdown.
- Modify the manifest.
- Call Blogger / Google / GA4 / AdSense API.
- Access the network.
- Fetch or pull.
- Reset / clean / stash / checkout.
- Add / commit / push.
- Build / deploy / preview.
- Mutate `dist-*` / `dist-blogger-preview/`.
- Touch the deploy repository.
- Upgrade any warning-only guard to blocking.
- Execute production apply this Session.
- Create a production authorization document this Session.

---

## 12. Focused guard coverage

`check:blogger-backfill-production-apply-capability` runs a synthetic git repository under `os.tmpdir()` for every write-path assertion. The exact pass/total count is emitted by the guard at runtime; this document does not fabricate a total.

Categories covered:

- Source-level static bans (child_process / fetch / node:http[s] / googleapis / oauth / blogger.googleapis / git command strings / build references / fs.rename / env override)
- parseArgs / --help contract / forbidden flag / unknown flag / missing required flag
- Syntactic hex helpers (`isSha256HexLower`, `isGitSha40Lower`)
- `fingerprintEntry` determinism + independence + change detection
- CLI: --help / forbidden flags (per name) / unknown flag / missing `--apply` / `--manifest` / `--source-path` / `--authorization`
- Authorization loader: valid path + malformed JSON + file missing + unknown top-level / repository / plan / approval fields + missing required fields + wrong purpose + wrong schemaVersion + malformed expectedHead (uppercase / whitespace / short / long / non-hex) + wrong expectedBranch + malformed fingerprints + `recordCount` variants (0, 2, "1", 1.5) + `targets` not array / length != 1 / with '..' / outside prefix / wrong suffix / absolute / approval.explicitlyAuthorized truthy but not true
- Happy path: valid authorization → apply PASS + createdTargets + exact bytes byte-identical to `buildSidecarBody` + trailing LF + bloggerPostId="" + no tmp remains + Markdown unchanged + manifest unchanged + second candidate NOT written
- Authorization vs runtime mismatches: HEAD / plan fingerprint / record fingerprint / target list
- Stale fingerprint (payload changed after auth authored)
- Repository state: dirty tracked file / untracked file / index.lock / ahead of origin / wrong branch / non-git projectRoot
- Source-path validation: not under content/blogger/posts / '..' traversal / not in plan / backslash
- Target already exists on disk → apply FAIL + pre-existing target unchanged
- Validator failure blocks all writes
- Missing candidate blocks planning
- `explicitlyAuthorized=false` → apply FAIL
- Authorization file missing / invalid JSON
- No env override sanity
- Happy result JSON structure sanity
- Production safety: production sidecar list / bytes / mtime unchanged; production Markdown bytes / mtime unchanged; `dist-blogger-preview/` absent; deploy repository unchanged (best-effort)

---

## 13. Explicit non-goals for this slice

- ✅ No production apply executed.
- ✅ No production authorization document authored.
- ✅ No production `.publish.json` created or modified.
- ✅ No production Markdown modified.
- ✅ No `bloggerPostId` filled in any production sidecar.
- ✅ No commit / push automation added.
- ✅ No receipt / audit-log writer added.
- ✅ No new production authorization templates committed to the repo.
- ✅ No planner / validator / bootstrap modification (planner's `canonicalize` / `sha256` were duplicated; planner's exports unchanged).
- ✅ No Blogger / Google API integration.
- ✅ No network access.
- ✅ No warning-only guard upgraded to blocking.
- ✅ The six missing sidecars from `20260612-*` remain unwritten.

---

## 14. Relationship to prior slices

- Predecessor (authorities):
  - `docs/publish-json-schema.md` §5 / §8 / §9
  - `docs/20260706-blogger-identity-and-backfill-strategy.md`
  - `docs/20260706-blogger-backfill-write-target-inventory.md`
  - `docs/20260706-blogger-backfill-report-only-baseline.md`
- Sibling (slice-level):
  - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`
  - `docs/20260718-blogger-backfill-missing-sidecar-bootstrap.md`
  - `docs/20260718-blogger-backfill-truth-manifest-template.md`
  - `docs/20260719-blogger-backfill-truth-manifest-intake-validator.md`
  - `docs/20260719-blogger-backfill-truth-apply-plan.md`
  - `docs/20260719-blogger-backfill-sidecar-identity-contract-audit.md`
  - `docs/20260719-blogger-backfill-truth-apply-rehearsal.md`
- This document = production capability slice; next slice = production execution (Dean-authored authorization + explicit approval + separate commit / push).
