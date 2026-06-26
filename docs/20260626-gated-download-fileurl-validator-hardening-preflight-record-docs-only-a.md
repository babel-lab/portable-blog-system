# Gated download + `download.fileUrl` validator hardening — read-only preflight evidence record (docs-only)

- Phase id：`20260626-gated-download-fileurl-validator-hardening-preflight-record-docs-only-a`
- 日期：2026-06-26（Asia/Taipei）
- 類型：**docs-only evidence record**（把先前 read-only preflight 結果固化為正式 repo evidence；**no source change** / **no content change** / **no settings change** / **no package/lockfile change** / **no validator change** / **no build** / **no deploy** / **no dev server** / **no report:validation** / **no check:validation-report** / **no backend touch**）
- 影響分類編號（CLAUDE.md §7）：A（規範 / 文件）。**不**影響 B / C / D / E / F / H / I / J / K / L 任何 source、template、settings 或 production content。
- 授權：Dean explicit approval（限定本 docs-only record：唯一新增本檔 + 核准 commit / push）
- 前置 / 來源：
  - read-only preflight session：`20260626-gated-download-fileurl-validator-hardening-preflight-readonly-a`（5 章掃描報告；未落檔，由本檔固化）
  - 受參照 source landing：`36a8523`（Blogger gated download safe placeholder renderer）+ `f3a9b66`（detection fix，metadata-based OR）
  - 受參照 renderer guard：`6ab4749`（GitHub `post-detail.ejs` direct-file guard）
  - validation evidence baseline：`docs/20260626-blogger-gated-placeholder-v1-validation-record-docs-only-a.md`

---

## 1. Purpose

- 記錄「`pageType: gated_download` 不得同時帶 legacy direct `download.fileUrl`」未來 validator hardening 的 **read-only preflight** 結果：盤點現況、最小安全設計、baseline 影響與風險。
- 本文件**不包含 source implementation**：未改 `validate-content.js` / `check-page-type-validator.js` / 任何 source；未新增 fixture；未動 validator 規則。
- 本文件**不包含 build / deploy / report output**：未跑 `build:blogger` / `build:github` / `report:validation` / `check:validation-report` / deploy / dev server；未產生任何 generated HTML / `dist*` / `dist-reports` / `gh-pages` / `.cache`。
- 本文件**不包含任何**：實際 Google Form URL（embed / edit / response）、Google Drive ID（folder / file）、secret / token / OAuth / API key、respondent data（表單填答者個資 / 回覆內容）、`download.fileUrl` 之真實值。
- additive：不取代既有 spec-lock / decision packet / preflight / scan record / validation record；僅作為 future validator hardening phase 之 planning evidence。

---

## 2. Current baseline（preflight 量測時）

| 檢查 | 值 | 判定 |
| --- | --- | --- |
| pwd | `/d/github/blog-new/portable-blog-system` | ✅ |
| branch | `main` | ✅ |
| HEAD (short) | `1a69688` | ✅ |
| HEAD (full) | `1a69688f1117356b43cd6e69b0d37eb187c9576d` | ✅ |
| log -1 | `docs(validation): record blogger gated placeholder checks` | ✅ |
| HEAD == origin/main | `1a69688` == `1a69688` | ✅ |
| ahead / behind | `0 / 0` | ✅ |
| working tree | clean（落檔前） | ✅ |
| `.git/index.lock` | NO INDEX LOCK | ✅ |

baseline 正確 → 進行 docs-only evidence record。

validation baseline（carry-forward，本 task 未量測變動）：

| 指令 | 值 |
| --- | --- |
| `npm run validate:content` | 0 / 134 / 106 |
| `node src/scripts/check-page-type-validator.js` | 103 / 0 |
| `npm run check:validation-report` | 27 / 0 |

---

## 3. Current validator behavior

`src/scripts/validate-content.js` 目前**分別**處理下列欄位，彼此正交：

| 欄位 | 處理位置 | 規則摘要 |
| --- | --- | --- |
| `pageType` | `validatePageTypeMetadata`（rule 1 / 5 / 6 / 6b） | enum 檢查 + `gated_download` × index / listings 交叉 |
| `contentKind` | 主 loop + rule 6b | enum、type-conflict、listings-default |
| `download` / `download.fileUrl` | **主 loop（D1 / D2 / D3），不在 `validatePageTypeMetadata` 內** | D1 enabled-empty / D2 invalid-type / D3 invalid-format（`^https?://`） |
| `gatedDownload` | `validatePageTypeMetadata`（rule 4 + rule 10） | shape + suspicious-field（key-name only，不 echo value） |
| `downloadFunnel` | `validatePageTypeMetadata`（rule 11–14） | role / enum / required-combo / role↔policy / robots-safety / private-value heuristic |

關鍵結論：

- **目前沒有任何 rule 檢查 `pageType: gated_download` + `download.fileUrl` 共存。**
  - `download.fileUrl` 的 D1 / D2 / D3 只驗結構（型別 / 空值 / URL 格式），**從不讀 `pageType`**。
  - `validatePageTypeMetadata` 的 gated 規則（5 / 6 / 6b / 11–14）**從不讀 `post.download`**。
- **renderer 層已有 guard，validator 層尚無對應 warning。**
  - `build-blogger.js` 之 `deriveRenderedGatedDownload(post)` 以 OR / metadata-based 判定 gated，並由 EJS `!isGatedPage` guard 抑制 legacy download box（gated page 不走 `download.fileUrl` direct-file 分支）。
  - GitHub 端 `post-detail.ejs` 於 `6ab4749` 已加 direct-file guard。
  - 但這兩者皆 **render-time**；validator 層**無**對應 warning 提示作者「gated page 不該帶 legacy `download.fileUrl`」。
- **可沿用之 no-echo 慣例**：`GATED_DOWNLOAD_DISALLOWED_KEYS`（key-name 比對、不 echo value）、`looksLikePrivateFunnelLink()`（value-based、回 boolean、不 echo value）。新 rule 僅需 presence 判定，**不需** value heuristic。
- ⚠️ **echo 警示**：既有 D3（`download-fileurl-invalid-format`）**會 echo `fileUrl.trim()`** 於 message。新 gated rule **不應**沿用 D3 之 echo pattern，須遵循 gated 系列 no-echo（避免作者誤填私有 Drive 連結於 `fileUrl` 時洩漏）。

---

## 4. Current fixture / smoke behavior

- `src/scripts/check-page-type-validator.js` 目前 **103 / 0**（103 passed / 0 failed），純 in-memory（`SETTINGS = { categories: [], tags: [] }` + `makePost` helper，status `ready`）。
- gated_download / downloadFunnel 已有多個 in-memory cases（test 2 / 12 / 13 / 40 / 43 / 72–77 / 83–89 / 90–103 等）。
- **`download.fileUrl` 目前不在該 smoke harness 中覆蓋**——D1 / D2 / D3 由 `content/validation-fixtures/blogger/posts/_test-download-*` scanned fixtures 覆蓋，不在此 in-memory smoke 內。
- **沒有任何 `pageType: gated_download` + `download.fileUrl` 共存 case**（無論 in-memory 或 scanned）。

未來若新增 rule，應加入之 case 類型（§7）：

- positive：gated_download + 非空 `download.fileUrl` → 恰 1 新 warning。
- negative ①：gated_download 但無 `download:` block → 0 warning。
- negative ②：legacy download page（`contentKind: download` / `pageType: download`）+ fileUrl，但 `pageType` 非 gated_download → 不觸發新 rule。
- no-echo lock：positive case 的 fileUrl 用可疑樣式，斷言 warning message **不含** value。

---

## 5. Current content impact

- **real content 目前 0 個檔案**（production 或 fixture）同時帶 `pageType: gated_download` + `download.fileUrl`。
  - 全域 grep：`pageType: gated_download` 命中 7 檔（1 production `access.md` + 6 fixtures）；6 個 gated_download fixtures **皆無 `fileUrl`**；所有 `fileUrl` fixtures 之 `pageType` **皆非 gated_download**。
- `content/blogger/posts/20260626-bopomofo-practice-cards-access.md`（gated 草稿）**沒有 `download:` block**（frontmatter 只有 `gatedDownload:` + `downloadFunnel:`，無 `download.fileUrl`）。
- `access.md` 與 `…-entry.md` 仍 `status: draft` / `draft: true` → 由 `src/scripts/load-posts.js`（`draft === true` → exclude）過濾，**永不進入 `validateContent`**，0 貢獻 warning。
- **若未來 access page 轉非 draft**：只要不加 `download.fileUrl`，新 rule **不應觸發**（它無 legacy fileUrl；新 rule 只在 gated + 存在 legacy fileUrl 時告警）。
- **不應 echo** Form URL / Drive ID / `download.fileUrl` / secret / token / respondent data；新 rule 設計為 presence-only → 天然不洩漏。

---

## 6. Recommended rule design

- **warning-only**（嚴禁 error；對齊 SP-2 / funnel 全系列）。
- **presence-based**：條件 = `pageType === 'gated_download'` 且 `download.fileUrl` 為 non-empty string。
- **no-echo**：warning message **不含** `download.fileUrl` 值（不沿用 D3 echo pattern）。
- **不建議**要求 `download.enabled === true` 作為 gate（gated page 帶任何 legacy `fileUrl` 都是反模式，與 `enabled` 旗標無關；加 enabled gate 會漏掉 `enabled: false` 但仍誤填 fileUrl 的情形）。
- **不建議**第一階段擴大到 all broader gated signals（如 `downloadFunnel.role === 'gated_page'` 或 `gatedDownload` metadata 存在）；第一刀只鎖最明確的 `pageType === 'gated_download'`。
- future broader signal check（與 renderer `isGatedDownloadPage` OR 判定對齊）可作**第二階段**評估。
- future error-level rule **不建議現在做**（維持 warning-only）。
- 建議 rule name：`page-gated-download-has-direct-file-url`（`page-` 前綴 → 自動納入 smoke 之 SP 池 + warning 不變式）。

---

## 7. Recommended minimal future source phase（未來 Dean 批准後）

單一 mutation session，scope 僅限：

- 修改 `src/scripts/validate-content.js`（於 `validatePageTypeMetadata` rule 6 之後新增 presence-based warning，讀 `frontmatterPageType` + `post.download`；**不 echo** fileUrl 值）。
- 修改 `src/scripts/check-page-type-validator.js`，加 in-memory smoke cases：
  - gated_download + fileUrl → 新 warning（恰 1）
  - gated_download + 無 download block → 0 warning
  - legacy download page + fileUrl（pageType 非 gated）→ 不觸發新 rule
  - no-echo case：warning message 不含 fileUrl value
- **不碰** content / renderer（`build-blogger.js` / `build-github.js` / EJS）/ build scripts / settings / package。
- **不碰** `report:validation`。
- **不碰** `check-validation-report.js` baseline——**除非** Dean 另行批准 scanned-fixture baseline bump（屬獨立 phase）。
- commit message 建議：`feat(validator): warn when gated_download carries a direct download.fileUrl`。
- landing 後 validation 建議：`node src/scripts/check-page-type-validator.js`（新 passed 數 / 0 failed）+ `npm run validate:content`（期望維持 0 / 134 / 106）。

---

## 8. Baseline impact estimate

- `check-page-type-validator.js` passed count 預期由 **103** 上升至約 **107–109**（新增 in-memory cases）；`failed` 應維持 **0**。
- `validate:content` 應維持 **0 / 134 / 106**——前提是**不**新增任何 scanned invalid fixture（real content 已證 0 命中，§5）。
- in-memory-only 路線下 `check-validation-report.js` BASELINE（`0 / 134 / 106`）**不應變動**。
- **如何避免動 `validate:content` baseline**：
  1. 首選 = 純 in-memory harness（`check-page-type-validator.js`），不加 scanned fixture；
  2. 或只加 scanned **0-warning** fixture（valid gated page，無 fileUrl）——可直接加、不 bump（per §3a「scanned 0-warning fixture 可直接加、不 bump」）；
  3. 刻意觸發新 warning 之 scanned invalid fixture → **必須**走獨立 baseline-bump phase（BASELINE 同步 + `check-validation-report` B-assertion + Dean approval；mirror 既有 `_test-download-funnel-invalid-entry.md` 之 0/133/105→0/134/106 先例）。
- **CLAUDE.md validation snapshot 只在實際 source landing 後另行處理**，不在本 preflight record task 內更動。

---

## 9. Risk ranking

**P0（最高）**

- validator warning 意外 echo Form URL / Drive URL / token / respondent data → 緩解：presence-only + message 絕不 echo `download.fileUrl`（勿沿用 D3 echo pattern）。
- hardening 漏掉 `pageType: gated_download` + `download.fileUrl` → 緩解：presence-based 條件（非空字串即觸發），不用 `enabled` gate；positive fixture 鎖定。

**P1（中）**

- 非預期 `validate:content` baseline bump → 緩解：走 in-memory-only 或 0-warning scanned fixture；scanned invalid fixture 須獨立 bump phase + Dean approval。
- 非預期 report baseline change（`check-validation-report.js`）→ 緩解：in-memory-only 路線不動 BASELINE。

**P2（低）**

- rule 過廣、誤擋合法 legacy download pages → 緩解：第一刀只鎖 `pageType === 'gated_download'`（不含 `contentKind: download` / `pageType: download`）。
- rule name / message 歧義 → 緩解：`page-` 前綴 + message 明示「remove download.fileUrl」修正指引。

---

## 10. Recommended next paths

- **Option A（本檔）**：docs-only record now。
- **Option B**：future source hardening minimal phase，only validator + in-memory smoke（§7）。
- **Option C**：scanned invalid fixture + baseline bump，only as separate explicit phase（+ Dean approval）。
- **不要**把 validator hardening 與 iframe renderer / content publish / build / report / GA4 / checklist·copy-helper 文案混在同一 session。

---

## 11. Red lines（本 record task）

- ❌ no source changes（`src/` 不動）
- ❌ no content changes（`content/` 不動）
- ❌ no settings changes（`content/settings/` 不動）
- ❌ no `CLAUDE.md` update
- ❌ no package / lockfile changes
- ❌ no build
- ❌ no deploy
- ❌ no `report:validation`
- ❌ no `check:validation-report`
- ❌ no generated HTML / `dist/` / `dist-blogger/` / `dist-reports/` / `gh-pages` / `.cache/`
- ❌ no Blogger live / Google Form / Google Drive / GA4 / AdSense / Search Console / Admin backend touch
- ❌ no actual Form URL / Drive ID / secret / token / respondent data 入 repo
- ✅ 本 task 唯一允許之修改：新增本 docs 檔（`docs/20260626-gated-download-fileurl-validator-hardening-preflight-record-docs-only-a.md`）+（Dean 核准後）commit / push

---

## 12. Final status

- 本檔將 read-only validator hardening preflight 固化為正式 repo evidence record。
- 不改 source / content / settings / validator / build / template / CLAUDE.md。
- 不 build / deploy / 不跑 report:validation / 不跑 check:validation-report / 不進任何 backend。
- 未複製任何 secret / token / Drive ID / Form URL / respondent data / fileUrl value。
- commit message：`docs(validation): record gated download fileUrl hardening preflight`。
- 落地後 STOP，等待 Dean 下一步指示（不開始任何 source implementation / build / deploy）。
