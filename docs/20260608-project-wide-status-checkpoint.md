# Project-Wide Status Checkpoint — 2026-06-08 night

Phase: `20260608-night-7-project-wide-status-checkpoint-docs-only-a`
Date: 2026-06-08 21:05 +0800
Mode: **docs-only**（new docs file only；no source / registry / content / fixture / CLAUDE.md / MEMORY.md / package change；no build / deploy / Blogger repost / GA4 validation；no Admin write path activation；no seed；no migration）

---

## 1. Purpose

本文件為 **2026-06-08 晚間整套 BLOG 系統 frozen state 之 project-wide status checkpoint**。

- 文件性質：**docs-only**。
- 本文件**不代表**：
  - 任何 source / registry / content / Admin / renderer / build / deploy 動作。
  - 任何 commerce / download / sourceKey / reverse UTM / Admin write path 之啟動。
  - 任何 production migration / seed / fixture promotion。
- 本文件只**彙整快照**：在 commit `5b3177f` 上的 frozen state，供下一 SESSION cold-start 引用。
- 本文件**不**新增、不撤銷既有 governance；CLAUDE.md / MEMORY.md / 既有 docs 全部保持不變。

---

## 2. Baseline

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `5b3177f` |
| origin/main | `5b3177f` |
| ahead/behind | `0/0` |
| working tree | clean |
| latest subject | `docs(admin): checkpoint commerce snippet helper acceptance` |
| `npm run validate:content` | **0 errors / 69 warnings / 59 posts** |
| overlay validate（`commerce-c4-c9-overlay.json`） | **0 errors / 70 warnings / 59 posts** |
| production `commerceLinks` | empty `[]` |
| production `downloadAssets` | empty `[]` |
| production `downloadForms` | empty `[]` |

Overlay 指令（**direct-node only**；loader 不讀 overlay）：

```bash
node src/scripts/validate-content.js --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json
```

---

## 3. Commerce Status

### 3.1 已 landed

- **Admin commerce preview**：read-only safe-row preview，consume production `settings.commerceLinks`，empty registry → empty-state（commit `3c271aa` 系列）。
- **Admin copyable YAML snippet helper**：純 browser in-memory 字串生成 + clipboard copy；對 server / file system / registry 零副作用（commit `77d9ad8`；acceptance PASS at night-2）。
- **Snippet acceptance checkpoint doc**：`docs/20260608-commerce-admin-snippet-helper-acceptance-checkpoint.md`（commit `5b3177f`）。
- **Validator content-ref rules**：C1（invalid-type）/ C2（empty）/ C3（not-found）/ C5（intra-post duplicate）/ C6（ref+url coexist）/ C8（invalid-role enum）/ C9（display-override-risk）all landed，warning-only。
- **Validator content-ref rule C4**（inactive ref）已 landed。
- **Registry-level validator R3–R14**（11 條 warning-only rules）landed at commit `94a1d47`。
- **Fixtures**：post-level commerce content-ref fixtures C1 / C2 / C3 / C5 / C6 + overlay `commerce-c4-c9-overlay.json`。

### 3.2 仍 frozen / dormant / deferred

| 項目 | 狀態 |
|---|---|
| production `content/settings/commerce-links.json` | **empty `[]`**（無任何真實 entry） |
| L1 seed preflight | **blocked**；needs user-provided candidate entries（`linkId` / `displayLabel` / `role` / `targetUrl`），per night-3 preflight + seed governance §11 |
| L2 settings-only seed | blocked until L1 |
| L3 seed acceptance | blocked until L2 |
| L4 renderer activation | **dormant**；renderer 仍未啟動，未消耗 `targetUrl` |
| **C7 missing-role rule** | **deferred / NO-GO**（per CLAUDE.md commerce-links 段落 + C7 missing-role policy preanalysis） |
| Admin write path（Admin Apply / middleware write / admin-write-cli） | **dormant** |
| Admin commerce selector（write-enabled） | **dormant** |
| commerce build / deploy / Blogger repost | not started |
| GA4 commerce dimension | not started |
| production content migration（raw url → `ref`） | not started；0 篇 production post 使用 `ref` |
| `_sample.commerce-links.json` | **不得 promote** 至 production（governance 紅線） |
| reverse UTM commerce dimension | dormant |

### 3.3 治理紅線（mirror CLAUDE.md §3 + seed governance preanalysis §13）

- ❌ commerce registry **永不**含 affiliate dashboard credentials（email / password / OAuth client secret / API key）。
- ❌ **永不**含 access / bearer / refresh / session token / Authorization header。
- ❌ **永不**含 commission / payout / clickCount 等 dashboard 統計。
- ❌ **永不**含帳號 email / 結算密碼 / 私人 Drive folder ID。
- ❌ **不**用 URL pattern 自動推斷 `merchantKey` / `networkKey` / `linkId`。
- ❌ **禁止**為 fixture 修改 production `affiliate-networks.json`。
- ❌ AI **不**生成假 seed 資料；所有 seed value 由 user 明示提供並逐筆 manual review。

---

## 4. Download Status

### 4.1 已 landed

- **Empty registries**：`download-assets.json` / `download-forms.json` 自 commit `466e471` 起維持 empty。
- **Loader read-only**：`src/scripts/load-settings.js` expose `settings.downloadAssets` / `settings.downloadForms`；無下游 consumer。
- **Validator R1**：`download-registry-invalid-shape` + `download-registry-duplicate-key`（warning-only）。
- **Validator R2**：`download-asset-ref-not-found` + `download-form-ref-not-found`（warning-only；commit `145a548`）。
- **Validator R5b**：`download-asset-ref-duplicate`（intra-post `assetRefs[]` only；warning-only；commit `077c3d1`）。
- **frontmatter shape rules**：D1 / D2 / D3 `download.fileUrl` + `assetRefs[]` / `formRef` 共 5 條 + SEO interlock S。
- **R4a 決議**：Option A — keep registries empty；R4b inactive source = **NO-GO**。
- **R6 coexistence**：docs-only preanalysis only；建議 **defer**（Option E）；source 未啟動。
- **Landing page renderer preanalysis**：`docs/20260603-download-landing-page-renderer-preanalysis.md`（docs-only design 盤點；recommendation = Final Idle Freeze / EXIT；推薦 Option D = reuse existing post + `seo.indexing` noindex）。

### 4.2 仍 frozen / dormant / deferred

| 項目 | 狀態 |
|---|---|
| Landing page renderer source | **未啟動**（preanalysis only） |
| Landing page content model 裁決 | 未 docs-accept（Option A / B / C / D / E 仍開放） |
| Admin picker（download） | **未啟動** |
| R4 inactive source | **NO-GO** |
| R6 coexistence source | **deferred / Option E**（未啟動） |
| `download-landing-noindex-required` rule | 候選；待 content model 裁決後才考慮 |
| `download-landing-missing-form` rule | 候選；待 content model 裁決 |
| `download-landing-canonical-self` rule | 候選；待 renderer 落地 |
| Real Google Form embed URL | **未提供**（registry empty） |
| Real Google Drive asset URL | **未提供**（registry empty） |
| Production download content migration | **未啟動**；唯一活 production download post 為 `content/blogger/posts/20260529-phonics-practice-sheet-download.md`，status=draft，`fileUrl:""`，無 `assetRefs[]` / `formRef`，validator 不掃 |
| build / deploy / Blogger repost / GA4 download dimension | not started |
| Admin Apply / middleware write / admin-write-cli（download） | dormant |

### 4.3 治理紅線（mirror CLAUDE.md §3.2 + registry schema decision §8）

- ❌ registry **永不**含 respondent data（email / 姓名 / 電話 / 學校 / 答覆內容 / Google Sheet response rows）。
- ❌ **永不**含 access token / API key / OAuth secret / 帳號 email / private permission / 私人 Drive folder ID。
- ❌ Google Forms responses **remain in Google Forms / Sheets**；不進 repo。
- ❌ article CTA **永不**直接導 Google Form / Google Drive；landing page **永遠** noindex + sitemap-exclude。
- ❌ renderer **永不**呼叫 Google Sheets API / 不 import respondent rows / 不做網路 reachability check。

---

## 5. SourceKey / relatedLinks / Reverse UTM Status

### 5.1 sourceKey / relatedLinks（已 landed）

- **`content/settings/link-sources.json`** 為 central registry，含 `blogger` / `github` 等 internalPlatform 條目（landed）。
- **relatedLinks / otherLinks** 之欄位字典詳見 `docs/related-links-schema.md`；屬內容屬性，不放 `.publish.json` / `.fb.md`。
- **顯示前綴拆入 `platform` 欄位**（如 `[Youtube]` / `[台北市立圖書館]`），不併入 `title`。
- **GitHub Pages → Blogger 方向 cross-link auto UTM / target / rel**：landed + production live（per CLAUDE.md §16.4）。

### 5.2 Reverse UTM（Blogger → GitHub Pages 方向；source landed but dormant）

| 項目 | 狀態 |
|---|---|
| pm-24a `ga4-url-builder.js`（`isGithubCrossLink` + `direction='to_github'`） | ✅ landed（commit `7e1d356`） |
| pm-24b `build-blogger.js`（`deriveRenderedCrossLinks` `direction:'to_github'`） | ✅ landed（commit `e2309e9`） |
| pm-24c `blogger-post-full.ejs`（讀 `relatedLinksRendered` / `otherLinksRendered`） | ✅ landed（commit `7c769fe`） |
| pm-24d build verify | ✅ passed（`dist-blogger/` ready posts byte-identical-modulo-builtAt） |
| **deploy to gh-pages** | ❌ **not done** |
| **Blogger 後台手動重貼** | ❌ **not done** |
| **GA4 Realtime / DebugView 驗收** | ❌ **not done** |
| **pm-26 deploy gate** | **BLOCKED** |
| Reverse UTM live state | **dormant**（source live；live state dormant） |

### 5.3 pm-26 deploy gate blocked reasons

- 缺真實 published Blogger post 含 cross-link 之 natural fixture（reverse UTM fixture candidate scan 未滿足）。
- 缺 GA4 readiness verification（DebugView / Realtime）。
- 缺 Blogger 後台手動重貼之 user-action approval。
- 任何 deploy / repost / GA4 動作須由 user **明確 prompt** 啟動，per CLAUDE.md §16.4 + §27 + reverse UTM pm-26 preflight readiness checklist。

### 5.4 紅線

- ❌ reverse UTM 不得自動 unblock pm-26；必須 user explicit approval。
- ❌ renderer / Admin / commerce / download phase **不得**連帶 trigger reverse UTM activation。

---

## 6. Admin Write Path Status

### 6.1 全 dormant

| Component | 狀態 |
|---|---|
| Admin Apply UI | **disabled / dormant**（preview 維持 read-only / empty-state） |
| middleware write route | **absent / dormant** |
| admin-write-cli | **dormant**（無 write-enabled CLI） |
| safeWrite governance | **gated**；無 write path activated |

### 6.2 規則

- 任何 Admin write path 啟動須**獨立 phase**，含：
  - explicit governance（write scope / red lines / approval flow）。
  - explicit source phase（middleware / CLI / Apply UI 三者各自為獨立 source phase）。
  - explicit acceptance phase。
- 本 SESSION **不**啟動任何 Admin write path 之 source / governance。

### 6.3 紅線

- ❌ Admin **永不**讀 Google Forms response data。
- ❌ Admin **永不**寫 respondent data / private notes / token / credential 到 repo。
- ❌ Admin write path 不得 bypass validator / fixture cadence。
- ❌ Admin Apply / middleware write / admin-write-cli **不得**在 commerce / download / sourceKey / reverse UTM 任一 phase 連帶 activated。

---

## 7. Validation / Fixture / Overlay Status

### 7.1 baseline 數值

- **normal**：`npm run validate:content` = **0 errors / 69 warnings / 59 posts**。
- **overlay**：`node src/scripts/validate-content.js --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json` = **0 errors / 70 warnings / 59 posts**。

### 7.2 機制

- **overlay usage is explicit direct-node only**。CLI flag `--registry-overlay` 為 validator 專屬，**不影響** production loader / build / Admin / renderer。
- **production loader does not read overlay**（whitelist read-only loader；無 readdir / glob）。
- **production loader does not read `_sample.*`**（whitelist 不含 sample）。
- **no fixture/sample promotion**：fixture / sample 永不 promote 至 production registry。
- **fixtures namespace**：`content/validation-fixtures/`（post-level）+ `content/validation-fixtures/settings/`（overlay only；未來 settings-level fixture 採 Option D，目前 skip）。

### 7.3 warning 來源

- production posts → **0 warnings**（empty registries → C3/C4/C9 + R2 + R5b 全 0 觸發）。
- validation-fixtures → 69 warnings（既有 baseline + download R5b fixture + commerce content-ref C1/C2/C3/C5/C6 fixtures）。
- overlay 多 +1 warning（C4 inactive ref fixture，在 overlay 下命中 inactive 條目）。

---

## 8. Current Blockers

下列 phase **皆 blocked**；本 SESSION 不解除任一：

| Blocker | 解除條件 |
|---|---|
| **Commerce seed L1** | user-provided candidate entries（`linkId` / `displayLabel` / `role` / `targetUrl`），逐筆 manual review，通過 §13 紅線 |
| **Commerce L2 / L3 / L4** | L1 解除後逐階段啟動；renderer activation 須獨立 phase + explicit approval |
| **Commerce C7 source** | user 明確 product decision（role-required / frozen scope / fixture / baseline impact / Admin UI / warning id / acceptance plan） |
| **Download production migration** | real safe Google Drive URL / Google Form embed URL + registry seed decision + content model 裁決 |
| **Download landing page renderer** | content model 裁決（Option A / B / C / D / E）+ first ready landing page content + production post promote-to-ready |
| **Download Admin picker** | renderer 邊界穩定 + 至少 1 個 production post 採新模型 + CLAUDE.md §3.2 同步更新 |
| **Reverse UTM pm-26 deploy gate** | valid natural fixture + GA4 readiness verify + user explicit deploy approval + Blogger 重貼 |
| **Admin write path（Apply / middleware / admin-write-cli）** | 獨立 governance phase + 獨立 source phase + 獨立 acceptance phase |
| **C7 missing-role rule** | product decision；目前 **NO-GO** |
| **Renderer activation（commerce / download）** | seed / content / model 三者 ready + explicit approval |

---

## 9. Safe Next Candidates

依風險分三類；本 SESSION **不**自動啟動任何下一 phase。

### A. Safe read-only / docs-only only

1. **Final Idle Freeze / EXIT**（推薦）：完成本 checkpoint commit 後 EXIT；不啟動下一 phase。
2. **Project-wide checkpoint read-only acceptance**：下一 SESSION cold-start verify baseline + 引用本 checkpoint，不寫任何檔。
3. **Commerce L1 seed candidate preflight（docs-only）**：在無 user candidate 的情況下，docs-only 列舉 preflight gates、紅線、§13 scan plan；不寫 registry、不生成假資料。

### B. Needs user input / explicit approval

4. **Commerce seed L2（settings-only）**：須 L1 之 user-provided candidate entries；無候選不啟動。
5. **Commerce renderer activation（L4）**：須 seed L1–L3 完成 + explicit approval。
6. **C7 source**：須 user product decision；目前 NO-GO。
7. **Download production migration**：須 real safe URL + registry seed decision + content model 裁決。
8. **Reverse UTM / pm-26 deploy gate**：須 valid fixture + GA4 readiness + user explicit deploy approval。
9. **Admin write path**：須獨立 governance + source + acceptance phase。
10. **Download landing page content model 裁決**：須 user 在 Option A / B / C / D / E 中明示選擇。
11. **Download landing page renderer source**：須 content model 已 docs-accept + real form + real asset。
12. **Download Admin picker**：須 renderer landed + 至少 1 production post 採新模型。

### C. Blocked / should not do now

13. ❌ **Auto-seed any registry**（commerce / download）—— governance 紅線。
14. ❌ **Auto-generate fake affiliate URL / tracking id**—— governance 紅線。
15. ❌ **Production content migration without explicit approval**—— governance 紅線。
16. ❌ **Renderer activation 無 seed / 無 approval**。
17. ❌ **Build / deploy / Blogger repost / GA4 validation 無 user explicit prompt**。
18. ❌ **Admin write path 任一 component 啟動**。
19. ❌ **`npm install` / package / lockfile 修改** 無 explicit need。
20. ❌ **git amend / rebase / force-push** 無 user explicit request。
21. ❌ **CLAUDE.md / MEMORY.md / 既有 docs 修改**。

---

## 10. Red Lines

下列**不可由 Claude 自動執行**；任一動作須 user **明確 prompt**：

- ❌ **No seed registry without user candidates**（commerce / download / link-sources 任一 production registry 之 seed entry）。
- ❌ **No real affiliate tracking URL / token / credential / Drive folder ID / Form ID / respondent data 入 repo**。
- ❌ **No production content migration without explicit approval**（不批量改文、不自動把 raw url 改為 `ref`、不自動把 `fileUrl` 改為 landing page URL）。
- ❌ **No renderer activation**（commerce / download landing 皆 dormant）。
- ❌ **No build / deploy / Blogger repost / GA4 validation**（含 `npm run build` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap` / `dist*/` / `gh-pages`）。
- ❌ **No Admin write path**（Admin Apply / middleware write / admin-write-cli 任一 component）。
- ❌ **No npm install / package / lockfile change**。
- ❌ **No git amend / rebase / force-push**（push 採 fast-forward only；commit 採 new commit only）。
- ❌ **No CLAUDE.md / MEMORY.md / 既有 docs 修改**。
- ❌ **No `_sample.*` promote** 至 production registry。
- ❌ **No fixture promote** 至 production posts / production registries。
- ❌ **No URL pattern 自動推斷** `merchantKey` / `networkKey` / `linkId` / `assetId` / `formId`。

---

## 11. Final Frozen Recommendation

完成本 checkpoint commit 後：

1. **建議下一步 = Final Idle Freeze / EXIT** 或 **read-only acceptance cross-check**（new SESSION 引用本 checkpoint 做 cold-start verify，不寫任何檔）。
2. **下一 SESSION 必須 cold-start verify baseline**：
   - `pwd` / `git status --short` / `git status --branch --short` / `git log -1 --oneline`
   - HEAD == origin/main（本 checkpoint commit 後之新 HEAD）
   - working tree clean
   - `npm run validate:content` baseline 數值（含本 commit 後之新 baseline；若本 commit 為 docs-only，數值仍為 0/69/59）
   - overlay validate baseline 數值（0/70/59）
3. **下一 SESSION 不得自動**啟動：
   - commerce L1 / L2 / L3 / L4 seed ladder
   - C7 source 實作
   - commerce / download renderer activation
   - Download production content migration
   - Download landing page renderer source
   - Admin write path（Apply / middleware / admin-write-cli）任一 component
   - reverse UTM deploy / pm-26 unblock
   - build / deploy / Blogger repost / GA4 validation
4. **任何進一步動作必須由 user 明示啟動**，並提供必要 input（commerce seed candidate entries / content model 裁決 / GA4 readiness / Admin write governance scope 等）。
5. 本文件**不**取代任何既有 governance；CLAUDE.md / MEMORY.md / 既有 docs 為 source of truth；本文件僅為 frozen-state 快照。
