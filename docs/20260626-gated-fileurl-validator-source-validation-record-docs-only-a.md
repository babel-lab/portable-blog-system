# Gated download `fileUrl` validator — source landing validation evidence record（docs-only）

- Date: 2026-06-26
- Phase: `20260626-gated-fileurl-validator-source-validation-record-docs-only-a`
- Type: docs-only validation evidence record（**no** source / content / settings / build / deploy mutation）

---

## 1. Purpose

記錄 `6687f06 feat(validator): warn on gated downloads with direct file URLs` 此次 validator
hardening **source landing** 的實作範圍與驗證結果（validation evidence），以 docs-only 方式補齊
evidence chain。

- 本記錄**不含** build / deploy / report output。
- 本記錄**不含** Form URL / Drive ID / secret / token / respondent data。
- 本記錄**不**做 source implementation、**不**改 content、**不**跑 build、**不**跑 report、**不**跑 deploy。

先導 docs（read-only 對照）：
- `docs/20260626-gated-download-fileurl-validator-hardening-preflight-record-docs-only-a.md`（preflight evidence）

---

## 2. Current baseline（落檔前驗證）

| 項目 | 值 |
| --- | --- |
| current repo baseline | `4c82e38 docs(state): sync gated fileUrl validator baseline` |
| validator hardening source commit | `6687f06 feat(validator): warn on gated downloads with direct file URLs` |
| full hash | `6687f061c6ba2e2e2b43a8c03d66b2b2cc62a81b` |
| branch | `main` |
| working tree | clean |
| ahead/behind（`origin/main...HEAD`） | 0 / 0 |
| `.git/index.lock` | absent |

---

## 3. Source landing scope（`6687f06`）

`6687f06` 僅 modified（`git show 6687f06 --stat` 核實，107 insertions / 2 files）：

- `src/scripts/validate-content.js`（+31）
- `src/scripts/check-page-type-validator.js`（+76）

明確未動：

- **no content changes**（`content/**` 未動）
- **no settings changes**（`content/settings/**` 未動）
- **no package / lockfile changes**（`package.json` / lockfile 未動）
- **no renderer changes**（`src/views/**` / `build-github.js` / `build-blogger.js` 未動）
- **no build output**（`dist/` / `dist-blogger/` 未動）
- **no generated report output**（`dist-reports/validation-report.json` 未產生）

---

## 4. New validator behavior

新 warning type：**`page-gated-download-has-direct-file-url`**

落點：`validate-content.js` → `validatePageTypeMetadata`，rule 6 後新增 rule `6a-fileurl`。

特性：

- **warning-only**，非 error（`severity: 'warning'`）
- **presence-based**
- **no-echo**
- 觸發條件（全部成立才觸發）：
  - `frontmatterPageType === 'gated_download'`
  - `post.download` 為 plain object（非 null、非 array、`typeof === 'object'`）
  - `download.fileUrl` 為 non-empty string（`typeof === 'string'` 且 `.trim() !== ''`）
- **不要求** `download.enabled === true`
  - gated page 帶任何 legacy `fileUrl` 皆為反模式，與 `enabled` 旗標無關。
  - 若加 `enabled` gate 會漏掉 `enabled:false` 但誤留 `fileUrl` 的情形。
- warning 之 `value` / message **不包含**實際 `download.fileUrl`：
  - 固定文案 `download.fileUrl present; gated pages must not carry direct download links`
  - **不**沿用 D3 `download-fileurl-invalid-format` 之 echo pattern（避免洩漏真實 Drive / Form / private 下載連結）。

broader gated signals **不在本 phase**（remain future phase）：

- `downloadFunnel.role === 'gated_page'`
- `gatedDownload` metadata 存在
- 第一刀只鎖 `frontmatterPageType === 'gated_download'`；broader signal rule 留待 future phase。

---

## 5. Smoke test coverage（`check-page-type-validator.js`）

`check-page-type-validator.js` 由 `103 / 0` → `110 / 0`（新增 in-memory smoke cases 104–110）。

| # | case | 期望 |
| --- | --- | --- |
| 104 | positive：`pageType:gated_download` + `download.fileUrl` | 恰觸發一個 `page-gated-download-has-direct-file-url` |
| 105 | negative：`pageType:gated_download` 無 `download` block | 不觸發新 rule（且 `[]`） |
| 106 | negative：`pageType:download`（legacy）+ `fileUrl` | 不觸發新 rule |
| 107 | negative：`contentKind:download`（無 pageType）+ `fileUrl` | 不觸發新 rule |
| 108 | `download.enabled:false` 但 gated page 仍帶 non-empty `fileUrl` | 仍觸發（presence-based，無 enabled gate） |
| 109 | blank / whitespace `fileUrl` | 不觸發新 rule |
| 110 | no-echo：Drive-like secret placeholder `fileUrl` | 觸發；warning message **不含** fake fileUrl value / host / secret-like placeholder |

> 正交隔離備註：`gated_download` + `includeInListings` absent 會觸發 Slice-1
> `download-in-listings-default`，故 positive case 一律帶 `includeInListings:false`（mirror 既有 test 12
> 之隔離手法），確保 `deepEqual` 只斷言本 rule。

---

## 6. Validation results

| 指令 | 結果 |
| --- | --- |
| `node src/scripts/check-page-type-validator.js` | `110 passed / 0 failed` |
| `npm run validate:content` | `0 errors / 134 warnings / 106 posts` |

- `validate:content` baseline **unchanged**（real content 0 觸發，0 baseline bump）。
- **no** `dist-reports/validation-report.json`（未產生）。
- **no** build output。
- **no** deploy output。

> 註：本 docs-only 記錄沿用 `6687f06` source landing 當時之已知驗證結果，**未於本 session 重跑**任何
> validator / build / report（本 phase = docs-only evidence record）。

---

## 7. What was intentionally not run（本 phase 刻意未跑）

- `report:validation`
- `check:validation-report`（無 `check-validation-report.js` BASELINE bump）
- `build:blogger`
- `build:github`
- `build:sitemap`
- deploy
- dev server / preview
- byte-diff output validation

---

## 8. Risk controls

- warning-only，**不**阻擋 build。
- **no-echo** `download.fileUrl`（不洩漏真實連結 / Drive / Form / private value）。
- **0 scanned invalid fixture added**（未加掃描型 invalid fixture）。
- **0 production baseline bump**（`validate:content` 維持 0 / 134 / 106）。
- normal legacy download pages **unaffected**（`pageType:download` / `contentKind:download` 不受新 rule 影響）。
- broader gated-signal rule **deferred**（future phase）。

---

## 9. Still not complete / future phases

- true Google Form iframe renderer **not started**
- `build:blogger` output validation / byte-diff **not run**
- `report:validation` **not run**
- broader gated-signal validator rule（`downloadFunnel.role:gated_page` / `gatedDownload` metadata）**not implemented**
- scanned invalid fixture + explicit baseline bump **not added**
- actual Form embed / Drive resource handling **still blocked** pending explicit Dean approval and policy

---

## 10. Red lines（本 phase 自我約束）

- docs-only
- no source mutation
- no content mutation
- no settings mutation
- no `CLAUDE.md` mutation
- no package / lockfile mutation
- no build
- no deploy
- no `report:validation`
- no `check:validation-report`
- no backend / Blogger / Google Form / Google Drive / GA4 / Admin touch
- no actual Form URL / Drive ID / secret / token / respondent data
