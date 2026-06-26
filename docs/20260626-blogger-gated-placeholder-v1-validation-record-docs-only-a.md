# Blogger gated placeholder — V1 non-build validation evidence record (docs-only)

- Phase id：`20260626-blogger-gated-placeholder-v1-validation-record-docs-only-a`
- 日期：2026-06-26（Asia/Taipei）
- 類型：**docs-only evidence record**（將 V1 read-only validation 結果固化為正式 repo evidence；**no source change** / **no content change** / **no settings change** / **no package/lockfile change** / **no validator change** / **no build** / **no deploy** / **no dev server** / **no report:validation** / **no backend touch**）
- 影響分類編號（CLAUDE.md §7）：A（規範 / 文件）。**不**影響 B / C / D / E / F / H / I / J / K / L 任何 source、template、settings 或 production content。
- 授權：Dean explicit approval（限定本 docs-only record；唯一新增本檔 + 核准 commit / push）
- 前置 / 來源：
  - `docs/20260626-gated-placeholder-validation-scope-preflight-readonly-a`（read-only preflight；scope 分類 V1 non-build checks 可安全執行、`report:validation` 寫檔須禁止）
  - 對應 validation session：`20260626-blogger-gated-placeholder-v1-readonly-validation-a`（read-only，5 支 non-build checks；未落檔，由本檔固化）
  - 受驗 source landing：`36a8523` + `f3a9b66`（Blogger-only gated download safe placeholder renderer + detection fix）
  - state sync：`c1f351e`

---

## 1. Purpose

- 本文件記錄 **Blogger gated placeholder renderer source landing（`36a8523` + `f3a9b66`）之後**的 V1 non-build validation evidence：確認該 source landing **未造成** validator / pageType / robots / sitemap / listings regression。
- 本文件**不包含** build / deploy / report output：未跑 `build:blogger` / `build:github` / `report:validation` / deploy / dev server，未產生任何 generated HTML / `dist*` / `dist-reports` / `gh-pages` / `.cache`。
- 本文件**不包含任何**：
  - ❌ 實際 Google Form URL（embed / edit / response 皆無）
  - ❌ Google Drive ID（folder / file 皆無）
  - ❌ secret / token / OAuth / API key
  - ❌ respondent data（表單填答者個資 / 回覆內容）
- additive：不取代既有 spec-lock / decision packet / preflight / scan record；僅作為其 validation-evidence 附錄，供未來 source phase planning 引用。

---

## 2. Current baseline

| 檢查 | 值 | 判定 |
| --- | --- | --- |
| pwd | `/d/github/blog-new/portable-blog-system` | ✅ |
| branch | `main` | ✅ |
| HEAD (short) | `c1f351e` | ✅ |
| HEAD (full) | `c1f351eb3dcc0a68ea6f54e4d1cb241e7a2ebb6b` | ✅ |
| log -1 | `docs(state): sync blogger gated placeholder baseline` | ✅ |
| HEAD == origin/main | `c1f351e` == `c1f351e` | ✅ |
| ahead / behind | `0 / 0` | ✅ |
| working tree | clean（落檔前） | ✅ |
| `.git/index.lock` | NO INDEX LOCK | ✅ |

受驗 source commits：

- `36a8523 feat(blogger): add gated download safe placeholder`
- `f3a9b66 fix(blogger): detect gated placeholder pages by metadata`

state sync：

- `c1f351e docs(state): sync blogger gated placeholder baseline`（唯一可信凍結基準）

baseline 正確 → 進行 docs-only evidence record。

---

## 3. Validation scope

V1 = **non-build / read-only validation checks only**。本 validation session 明確**未**執行：

- ❌ no `report:validation`（會寫 `dist-reports/validation-report.json`，本輪禁止）
- ❌ no `check:validation-report`（依賴上者產出之 report 檔）
- ❌ no `build:blogger`
- ❌ no `build:github`
- ❌ no `build:sitemap` / `build` / `preview`
- ❌ no deploy
- ❌ no dev server
- ❌ no generated HTML / `dist` / `dist-reports` / `gh-pages` / `.cache`

允許執行（唯一 5 支 read-only commands）：`validate:content` + 4 支 direct-node check（page-type-validator / page-type-robots / include-in-sitemap / include-in-listings）。皆 in-memory 斷言、無 writeFile / mkdir。

---

## 4. Commands and results

| # | Command | 結果 | 數字 | Exit |
| --- | --- | --- | --- | --- |
| 1 | `npm run validate:content` | ✅ PASS | 0 errors / 134 warnings / 106 posts | 0 |
| 2 | `node src/scripts/check-page-type-validator.js` | ✅ PASS | 103 passed / 0 failed | 0 |
| 3 | `node src/scripts/check-page-type-robots.js` | ✅ PASS | 29 passed / 0 failed | 0 |
| 4 | `node src/scripts/check-include-in-sitemap.js` | ✅ PASS | 19 passed / 0 failed | 0 |
| 5 | `node src/scripts/check-include-in-listings.js` | ✅ PASS | 21 passed / 0 failed | 0 |

全部 5 支 PASS，exit 0。

---

## 5. Observations

- `validate:content` 維持 baseline 不變：**0 / 134 / 106**（與 preflight 記錄一致，無 regression）。
- 唯一 production warning = `page-noindex-in-listings` @ `content/github/posts/20260504-portable-blog-system-mvp.md`（已知 intentional hold，per `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`；warning-only / non-blocking）。
- 其餘 133 warnings 全來自 `content/validation-fixtures/`（fixture-only，非 production 觸發）。
- 兩個 bopomofo draft 頁（`20260626-bopomofo-practice-cards-access.md` / `…-entry.md`）皆 `draft: true` → 由 `load-posts.js` 過濾（`draft:true` → exclude），**未被掃描、0 貢獻 warning**。
- **未產生任何 report**（`dist-reports/validation-report.json` 落檔後檢查為 ABSENT）。
- **未產生任何 build output**。
- validation session 內**未發生** source / content / settings / docs / CLAUDE.md / package mutation；working tree 維持 clean。

---

## 6. Regression verdict

Blogger gated placeholder source landing（`36a8523` + `f3a9b66`）**未造成下列任何 regression**：

- ✅ content validation（0 / 134 / 106 不變）
- ✅ page type validator（103 / 0）
- ✅ robots derivation（29 / 0）
- ✅ sitemap inclusion（19 / 0）
- ✅ listings inclusion（21 / 0）
- ✅ `pageType: gated_download` metadata 規則維持一致（noindex/follow 推導、no-sitemap、no-listing default-exclude、suspicious-field 不 echo value、downloadFunnel slice 1–10 role / reciprocity / private-value heuristic 全 PASS）。

source landing 仍維持安全特性：**no iframe / no Form URL / no Drive URL / no direct gated download link**（gated branch 僅輸出 safe placeholder；legacy download box 由 `!isGatedPage` guard 守住）。

---

## 7. Still not validated / still blocked

- ⏸ **未跑** `build:blogger` output validation（generated HTML 未驗證）。
- ⏸ **未跑** byte-diff regression（對既有 ready post 之 `dist-blogger/` byte-identical-modulo-builtAt 比對未做）。
- 🔴 真正 Google Form **iframe renderer 尚未開始**。
- 🔴 `gatedDownload.formEmbedUrl` **仍無實際 public embed URL**（access 草稿仍空字串）。
- 🔴 validator hardening（禁 `pageType: gated_download` 同時帶 `download.fileUrl`）仍屬 **future independent phase**（warning-only-first + baseline-bump phase + Dean approval；不與 renderer / 本 record 混入同 session）。
- 上述各項皆 **blocked，待 Dean explicit approval** 方可進入。

---

## 8. Red lines（本 docs-only record task）

- ❌ no source changes（`src/` 不動）
- ❌ no content changes（`content/` 不動）
- ❌ no settings changes（`content/settings/` 不動）
- ❌ no `CLAUDE.md` update
- ❌ no package / lockfile changes
- ❌ no build
- ❌ no deploy
- ❌ no `report:validation`
- ❌ no generated HTML / `dist/` / `dist-blogger/` / `dist-reports/` / `gh-pages` / `.cache/`
- ❌ no Blogger live / Google Form / Google Drive / GA4 / AdSense / Search Console / Admin backend touch
- ❌ no actual Form URL / Drive ID / secret / token / respondent data 入 repo
- ✅ 本 task 唯一允許之修改：**新增本 docs 檔**（`docs/20260626-blogger-gated-placeholder-v1-validation-record-docs-only-a.md`）+（Dean 核准後）commit / push

---

## 9. Final status

- 本檔將 V1 read-only validation（5 支 non-build checks 全 PASS）固化為正式 repo evidence 紀錄。
- 不改 source / content / settings / validator / build / template / CLAUDE.md。
- 不 build / deploy / 不跑 report:validation / 不進任何 backend。
- 未複製任何 secret / token / Drive ID / Form URL / respondent data。
- commit message：`docs(validation): record blogger gated placeholder checks`。
- 落地後 STOP，等待 Dean 下一步指示（不開始任何 source implementation / build / deploy）。
