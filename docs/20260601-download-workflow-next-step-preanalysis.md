# 2026-06-01 Download Workflow Next-Step Preanalysis

> Phase: `20260601-noon-3-download-workflow-next-step-preanalysis-docs-only-a`
> Date: 2026-06-01 12:49 +0800（於 sourceKey Admin selector + `source-inactive` validation preanalysis 收束並 frozen 後之 cold-start session）
> Scope: **docs-only**（單檔新增；無 source / content / settings / templates / fixture / package / dist / gh-pages / `.cache` / `CLAUDE.md` / 既有 docs 變更）
> Baseline: HEAD = origin/main = `f07bb64b9d9fd7c6d4d3ae85b1b17768b1acfa72`
> validate:content baseline: **0 errors / 47 warnings / 42 posts**

---

## 1. Executive Summary

- 本文件為 **docs-only preanalysis**：在 sourceKey Admin selector preview 與 `source-inactive` validation preanalysis 都已收束並 frozen at `f07bb64` 之後，針對 **download workflow 的下一步**做排序規劃。
- 本文件**只做 download workflow 下一步之優先序裁決**；**不**啟動 download workflow，**不**實作 loader / validator-via-registry / Admin picker / renderer / content migration。
- 本 phase **不**改 source、**不**改 registry、**不**新增 fixture：
  - ❌ 不改 `src/scripts/load-settings.js`、`src/scripts/validate-content.js` 或任一 `src/**`。
  - ❌ 不改 `content/settings/download-assets.json` / `download-forms.json` / `link-sources.json` 或任一 settings。
  - ❌ 不改 `content/**`（posts / drafts / archive / templates / validation-fixtures）。
  - ❌ 不 build / deploy / Blogger repost / GA4 validation。
  - ❌ 不解除 reverse UTM dormant；不解除 pm-26 deploy gate；不啟用 Admin Apply / middleware write / admin-write-cli。
- 本文件之目標是**排序下一步**，而不是啟動 download workflow。預設建議**保守落地**：本 phase 完成後 Final Idle Freeze / EXIT。
- Baseline `f07bb64`：HEAD = origin/main；working tree clean；ahead/behind = 0/0；validate `0 / 47 / 42`。
- 本文件落地後 production state drift = 0；唯一變更為新增本 docs 檔；validate baseline 預期維持不變。

### 1.1 一句話裁決

> **download workflow 之下一步應在已有之 loader preanalysis（night-5）與 validation remaining-rules preanalysis（night-6）兩份 docs 之上，採「先 acceptance / consolidation，必要時先做 loader source implementation preanalysis（仍 docs-only），絕不直接寫 source」之保守順序；本 phase 不啟動任何 source / settings / fixture / build / deploy；loader / validator-via-registry / Admin picker / renderer / content migration 全保持 dormant；預設 Final Idle Freeze / EXIT。**

---

## 2. Current Baseline

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD（本 phase 啟動時） | `f07bb64b9d9fd7c6d4d3ae85b1b17768b1acfa72` |
| origin/main（本 phase 啟動時） | `f07bb64b9d9fd7c6d4d3ae85b1b17768b1acfa72` |
| short | `f07bb64` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| validate:content | **0 errors / 47 warnings / 42 posts** |
| latest commit subject | `docs(sourcekey): plan inactive source validation` |

裁決要點：

- **sourceKey track 已收束**：sourceKey Admin selector preview（commit `767c028`）與 `source-inactive` validation preanalysis（commit `f07bb64`）已落地並 frozen；該 track 無 in-flight 待落地之 source。
- **download workflow 仍 dormant**：empty registries（`466e471`）已存在；loader / validator-via-registry / Admin picker / renderer / content migration 全未實作。
- **reverse UTM / pm-26 / Admin write infra 仍 dormant 或 blocked**。

### 2.1 Governance dormancy snapshot

| Gate / Surface | 狀態 |
|---|---|
| Reverse UTM source（pm-24a / b / c at `7e1d356` / `e2309e9` / `7c769fe`） | ✅ landed origin/main（2026-05-23） |
| Reverse UTM live | ❄ **dormant**（未 deploy；Blogger 後台未重貼；GA4 Realtime validation 未啟動） |
| pm-26 deploy gate | ❄ **BLOCKED**（positive fixture 仍 `status: draft`；publish-readiness 未達成） |
| Download empty registry（`download-assets.json` + `download-forms.json`） | ✅ landed at `466e471`；shape = empty `{ schemaVersion: 1, updatedAt: "", assets\|forms: [], notes: "" }` |
| Download loader source | ❄ **dormant**（`src/scripts/load-settings.js` 未串接） |
| Download validator-via-registry rules | ❄ **全 dormant** |
| Download Admin picker | ❄ **dormant** |
| Download landing page renderer | ❄ **dormant** |
| Download content migration（`fileUrl` → `assetRefs[]` / `formRef`） | ❄ **dormant** |
| sourceKey Admin selector | ✅ preview landed（`767c028`）；inactive-source validation 仍 docs-only（`f07bb64`） |
| Admin Apply enable flag | ❄ **disabled / dormant** |
| Middleware write route | ❄ **absent** |
| admin-write-cli dry-run / apply | ❄ **dormant** |

---

## 3. Existing Download Decisions / Docs

本節整理已存在之 download 相關決策（皆已 landed 為 docs；屬本 phase 之 read-only 輸入）：

| 決策 / docs | 內容摘要 | 狀態 |
|---|---|---|
| **download-assets.json / download-forms.json registry landing** | 兩 empty registry 落地（`466e471`）；shape = `{ schemaVersion: 1, updatedAt: "", assets\|forms: [], notes: "" }`；per `docs/20260531-download-empty-registry-implementation-plan.md` | ✅ landed |
| **registry schema decision** | `docs/20260531-download-asset-form-settings-registry-schema-decision.md`：schema 字典 + R1 紅線 §8 | ✅ docs-accepted |
| **registry JSON preanalysis** | `docs/20260531-download-asset-form-registry-json-preanalysis.md`（am-6）：missing/empty/parse-error/schemaVersion/unknown-field/duplicate-id behavior 設計輸入 | ✅ docs-accepted |
| **fileUrl relative path policy** | `docs/20260530-download-validation-fileurl-relative-path-decision-preanalysis.md`：Option D（**不允許** relative / repo-internal path；internal asset 走 registry `assetRefs[]`）；D3 regex frozen at B-strict `^https?://` | ✅ docs-accepted |
| **preview URL risk policy** | `docs/20260530-download-fileurl-preview-url-risk-policy.md`（night-7）：preview-url-risk 為 docs-only authoring policy；validator 永不對 raw URL 做 regex / reachability；升級須先有 registry landed | ✅ docs-accepted（frozen at raw URL regex policy stage） |
| **S1/S2 noindex validation merge decision** | `docs/20260530-download-validation-s1-s2-merge-decision.md`：S1（undefined）+ S2（index）合併為單一 rule id `download-content-should-be-noindex`（Option Beta） | ✅ landed（night-5 source） |
| **D3 / S1 / S2 decision preanalysis** | `docs/20260530-download-validation-d3-s1-s2-decision-preanalysis.md`（am-9）：D3 format rule + S1/S2 裁決輸入 | ✅ docs-accepted |
| **loader registry lookup preanalysis** | `docs/20260601-download-loader-preanalysis.md`（night-5）：未來 loader contract（missing silent / parse fail-closed）+ registry lookup model（`assetRefs[]` / `formRef` / kebab-case ID / not-found behavior）+ legacy `download.fileUrl` grandfather | ✅ docs-accepted |
| **remaining validation rules preanalysis** | `docs/20260601-download-validation-remaining-rules-preanalysis.md`（night-6）：D 衍生 / S 衍生 / F1-F2 / A1-A3 / preview-url-risk family-level preanalysis + fixture inventory + sequencing | ✅ docs-accepted |
| **landing page schema preanalysis** | `docs/20260529-download-landing-page-schema-preanalysis.md`：landing page schema 方向 | ✅ docs-accepted |
| **landing page settings registry direction** | `docs/20260529-download-landing-page-settings-registry-direction-preanalysis.md`：landing 改走 settings registry 方向（最終落地為 am-4 / am-6 / am-8 registry track） | ✅ docs-accepted（被後續 registry track 取代為主路徑） |
| **landing page admin model preanalysis** | `docs/20260529-download-landing-page-admin-model-preanalysis.md`：Admin picker 消費 registry 之 model 草案 | ✅ docs-accepted |
| **download validation rules preanalysis（am-1）** | `docs/20260530-download-validation-rules-preanalysis.md`：D / S / F / A 規則初稿 + D4 reachability non-rule 宣告 | ✅ docs-accepted |

裁決：download workflow 之**上游 docs 規劃已相當完整**（loader contract + validation rule families + registry schema + landing direction 皆已 docs-accepted）。**缺的不是更多 docs，而是 source phase 之 user explicit 授權**；在無授權前，最保守作法為 acceptance / consolidation 而非新增更多 preanalysis。

---

## 4. Current Registry State

### 4.1 `download-assets.json`（read-only inspection）

```json
{
  "schemaVersion": 1,
  "updatedAt": "",
  "assets": [],
  "notes": ""
}
```

- shape = **empty registry**；`assets: []` 為合法初始狀態。
- ✅ 不含 respondent data / token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID。

### 4.2 `download-forms.json`（read-only inspection）

```json
{
  "schemaVersion": 1,
  "updatedAt": "",
  "forms": [],
  "notes": ""
}
```

- shape = **empty registry**；`forms: []` 為合法初始狀態。
- ✅ 不含 respondent data / token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID。

### 4.3 R1 紅線重申

兩 registry **永不**承載（per `CLAUDE.md` §3.2 + `docs/20260531-download-asset-form-settings-registry-schema-decision.md` §8 + pm-20 §4 R1）：

- ❌ respondent data（email / 姓名 / 電話 / 學校 / 答覆內容 / Google Sheet response rows）
- ❌ access token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID / 私人 permission grant

empty registry 為 R1 紅線之**最強防護狀態**：無 entry → 天然無 PII / token / secret。

### 4.4 Google Forms / Sheets 為資料收集位置

- Google Forms responses **remain in Google Forms / Sheets**；不進 repo / 不進 Admin static files。
- registry 僅承載**身分識別**（asset/form id + 公開 metadata）；不承載收集到之回覆資料。

### 4.5 Consumer state

當前所有 consumer 皆 **dormant**（per read-only inspection；`grep download src/scripts/load-settings.js` 無命中）：

- ❌ loader source 未串接（`SETTINGS_FILES` 不含 download registry；無 `readJsonOptional('download-*.json')`）。
- ❌ validator rule（unknown-field / duplicate-id / ref-not-found / inactive / preview-risk-via-registry）未實作。
- ❌ Admin picker 未實作。
- ❌ landing page renderer 未實作。
- ❌ content migration 未啟動。

---

## 5. Current Content / Template State

### 5.1 Download template 之 download 欄位形態

`content/templates/blogger-download-template.md` 之 download block（read-only inspection）：

```yaml
download:
  enabled: true
  title: ""
  description: ""
  fileUrl: ""
  fileType: "PDF"
  licenseNote: "本素材僅供個人、家庭與教學使用，請勿轉售或大量散布。"
```

- 仍採 **legacy `download.fileUrl`** 之單一 URL 形態（per `CLAUDE.md` §13）。
- ❌ template **無** `assetRefs[]` / `formRef` 欄位（registry-aware path 尚未進 template）。
- ❌ **無** `github-download-template.md`（僅 blogger 版存在；GitHub 站 download 內容暫無獨立 template）。

### 5.2 既有使用 legacy `download.fileUrl` 之 post

- 全 repo 僅 **1 篇** post 使用 `download.fileUrl`：`content/blogger/posts/20260529-phonics-practice-sheet-download.md`。
- ❌ **無**任一 post 使用 `assetRefs[]` / `formRef`。

### 5.3 不同下載形態之差異（設計輸入；本 phase 不裁決）

| 形態 | 當前承載方式 | 未來 registry-aware 方式 | 語意 |
|---|---|---|---|
| Google Drive single JPG link | raw `download.fileUrl` | registry asset entry（`deliveryMode: drive-*`） | 單張圖檔；preview vs direct 風險屬 night-7 policy |
| ZIP bundle | raw `download.fileUrl` | registry asset entry（`deliveryMode: bundle-zip`） | 多檔打包；未來 `assetRefs[]` 可多筆 |
| Future landing page | 不存在 | renderer 消費 `assetRefs[]` + `formRef` | 中繼頁；noindex（per §S 系列 + R3） |
| Form URL（取得下載前須填表） | **不可**填入 `download.fileUrl`（R2 紅線） | registry form entry（`formRef`） | form gate；responses 留 Google Forms / Sheets |

### 5.4 不做 content migration

- ❌ 本 phase **不**遷移任何 post 之 `download.fileUrl` 至 `assetRefs[]` / `formRef`。
- ❌ 本 phase **不**新增 `assetRefs[]` / `formRef` 至任一 post / template。
- legacy `download.fileUrl` **grandfather 保留**（per loader preanalysis §7.1）；既有 D1 / D2 / D3 / S 繼續有效。

---

## 6. Remaining Work Areas

下列為 download workflow 之剩餘工作面向；各為**獨立區塊**，**互不夾帶**；本 phase **不**啟動任一：

### 6.1 Loader registry lookup

- 將 `download-assets.json` / `download-forms.json` 串接進 settings loader。
- contract 已於 `docs/20260601-download-loader-preanalysis.md` §5 設計（missing silent / parse fail-closed / schemaVersion / unknown-field / duplicate-id）。
- **狀態**：❄ dormant。**前置**：無（registry 已存在）。**性質**：source change（read-only loader；預期 baseline 不變）。

### 6.2 Validator via registry

- 新增 registry-aware validator rules（ref-not-found / inactive / duplicate-id / unknown-field / notes-token-like-pattern / preview-risk-via-registry）。
- family-level 設計已於 `docs/20260601-download-validation-remaining-rules-preanalysis.md` §6 / §7 / §8 完成。
- **狀態**：❄ dormant。**前置**：loader landed（registry-aware rule 需 data source）。**性質**：source change + fixture（預期 +N warnings / +N posts）。
- schema-only F / A rules（`download-formref-empty-string` / `download-form-ref-format-invalid` / `download-assetrefs-invalid-type` / `download-assetrefs-duplicate`）**不**依賴 loader；可在 loader 之前；但仍須走 docs-only 裁決 → source。

### 6.3 Admin picker

- Admin UI 消費 registry，供作者選取 asset / form。
- model 草案於 `docs/20260529-download-landing-page-admin-model-preanalysis.md`。
- **狀態**：❄ dormant。**前置**：loader landed + Admin write infra（當前 Admin Apply / middleware / admin-write-cli 全 dormant）。**性質**：Admin source change。

### 6.4 Renderer / landing page

- post-detail / blogger-post-full 之 download block 改讀 registry；或新增 landing page renderer。
- schema 方向於 `docs/20260529-download-landing-page-schema-preanalysis.md`。
- **狀態**：❄ dormant。**前置**：loader landed + frontmatter schema 擴張（`assetRefs[]` / `formRef`）。**性質**：renderer source change + build / deploy 影響。

### 6.5 Content migration

- 既有 `download.fileUrl` post（目前僅 `20260529-phonics-practice-sheet-download.md`）遷移至 `assetRefs[]` / `formRef`。
- **狀態**：❄ dormant。**前置**：loader + renderer landed。**性質**：逐篇 explicit phase + user explicit approval（per loader preanalysis §7.6）。

### 6.6 Loader ↔ validator ↔ Admin ↔ renderer ↔ migration 之 relationship

依賴鏈（per loader preanalysis §11 + remaining-rules preanalysis §10）：

```text
empty registry（✅ landed）
  → loader source（6.1）
    → registry-aware validator（6.2）
    → Admin picker（6.3）       ← 另需 Admin write infra
    → renderer / landing page（6.4）
      → content migration（6.5） ← 逐篇 explicit
```

- schema-only F / A validator rules 可旁路 loader（在 6.1 之前）。
- 任一下游 surface **不得**先於 loader landed；否則落入「無 data source / 死碼」狀態。

### 6.7 Analytics / GA4 validation

- download_click GA4 event 與 landing page flow 之 GA4 Realtime / DebugView 驗收。
- **狀態**：❄ dormant。**前置**：renderer landed + deploy（pm-26 deploy gate 仍 BLOCKED）。**性質**：manual GA4 validation（非 source）。

---

## 7. Candidate Next-Step Options

比較下列選項。每項列：phase type / 目的 / 修改風險 / 是否需 source change / 是否需 settings change / 是否需 fixture / 是否影響 validate baseline / 是否需 build / deploy / Blogger / GA4 / blockers / recommendation。

### Option A — Final Idle Freeze / EXIT

- **phase type**：無後續 phase（本 phase commit + push 後 freeze）。
- **目的**：在無 user 下游明示授權前，維持最低風險。
- **修改風險**：🟢 無（僅本 docs 檔已落地）。
- **source / settings / fixture**：皆否。
- **影響 baseline**：否。
- **build / deploy / Blogger / GA4**：皆否。
- **blockers**：無。
- **recommendation**：✅ **預設推薦**。

### Option B — Read-only acceptance of existing download docs

- **phase type**：read-only acceptance（不 commit；不改檔）。
- **目的**：cross-check 既有 download docs（loader preanalysis / remaining-rules preanalysis / registry schema / landing direction）之內部一致性與 cadence 對齊。
- **修改風險**：🟢 無（read-only）。
- **source / settings / fixture**：皆否。
- **影響 baseline**：否。
- **build / deploy / Blogger / GA4**：皆否。
- **blockers**：無；需 user explicit approval 啟動。
- **recommendation**：✅ 推薦（若 user 要在 freeze 前再做一次 consolidation）。

### Option C — Consolidation docs（download workflow 索引 / 狀態彙整）

- **phase type**：docs-only（單檔新增；download docs 索引 / 狀態總表）。
- **目的**：把分散之 download docs 收斂為單一 entry-point 索引，降低未來 cold-start 讀取成本。
- **修改風險**：🟡 低（新增單一 docs；不碰 source / settings）。
- **source / settings / fixture**：皆否。
- **影響 baseline**：否。
- **build / deploy / Blogger / GA4**：皆否。
- **blockers**：與本文件部分重疊（本文件已具索引性質）；可能屬冗餘。
- **recommendation**：🟡 可選；非必要（本文件 §3 已提供 docs 索引）。

### Option D — Loader source implementation preanalysis only（docs-only）

- **phase type**：docs-only（單檔新增；loader source phase 之**更細**設計，如 candidate A 擴張 vs candidate B 新建之最終裁決）。
- **目的**：把 loader source phase 之 exact file scope / acceptance gates frozen，供未來 source phase 直接執行。
- **修改風險**：🟡 低（docs-only）。
- **source / settings / fixture**：皆否。
- **影響 baseline**：否。
- **build / deploy / Blogger / GA4**：皆否。
- **blockers**：loader preanalysis（night-5）已涵蓋大部分；本選項僅在「candidate A vs B 二選一」尚需裁決時有增量價值。
- **recommendation**：🟡 若要推進 download workflow，這是**最保守的第一步**（仍 docs-only；不寫 code）。

### Option E — Validator remaining-rules implementation preanalysis only（docs-only）

- **phase type**：docs-only（單檔新增；schema-only F / A rules 之 source + fixture exact scope frozen）。
- **目的**：把 schema-only validator rules（不需 loader）之 source phase scope frozen。
- **修改風險**：🟡 低（docs-only）。
- **source / settings / fixture**：皆否。
- **影響 baseline**：否。
- **build / deploy / Blogger / GA4**：皆否。
- **blockers**：remaining-rules preanalysis（night-6）已涵蓋 family-level；本選項僅在「schema-only rule 之 exact fixture shape」尚需 frozen 時有增量價值。
- **recommendation**：🟡 次於 Option D（loader 為更上游之依賴根）。

### Option F — Registry schema hardening preanalysis only（docs-only）

- **phase type**：docs-only（單檔新增；registry entry-level schema 字典硬化，如 `deliveryMode` enum / `active` flag / required vs optional fields）。
- **目的**：把 entry-level schema 字典 frozen，供 loader / validator / renderer 共用 contract。
- **修改風險**：🟡 低（docs-only）。
- **source / settings / fixture**：皆否。
- **影響 baseline**：否。
- **build / deploy / Blogger / GA4**：皆否。
- **blockers**：am-4 / am-6 已涵蓋大部分 schema；本選項僅在 entry-level enum（如 `deliveryMode`）尚未 frozen 時有增量價值。
- **recommendation**：🟡 可選；屬 loader / validator 之共同前置 contract。

### Option G — Actual loader source implementation（future candidate only；**不推薦直接做**）

- **phase type**：source change（修改 `src/scripts/load-settings.js` 或新建 loader module）。
- **目的**：實際串接 registry loader。
- **修改風險**：🔴 中-高（碰 source；雖 read-only loader 預期 baseline 不變，但屬 source phase）。
- **source**：✅ 需。**settings**：否（registry 內容不變）。**fixture**：否（loader 本身不需 fixture）。
- **影響 baseline**：預期不變（loader read-only）；但須實測驗證。
- **build / deploy / Blogger / GA4**：build 否（loader 不直接觸發）；deploy 否。
- **blockers**：須先有 loader source preanalysis（Option D）+ preflight readonly + **user explicit approval**。
- **recommendation**：❌ **不推薦直接做**；屬 future candidate；須先 docs-only 裁決 → preflight → source。

### Option H — Actual validator implementation（future candidate only；**不推薦直接做**）

- **phase type**：source change + fixture（修改 `src/scripts/validate-content.js` + 新增 fixture）。
- **目的**：實際新增 validator rules。
- **修改風險**：🔴 高（碰 source + fixture；改變 baseline）。
- **source**：✅ 需。**settings**：否。**fixture**：✅ 需。
- **影響 baseline**：✅ +N warnings / +N posts。
- **build / deploy / Blogger / GA4**：build 否；deploy 否。
- **blockers**：registry-aware rule 須先有 loader landed（Option G）；schema-only rule 須先有 Option E + preflight；皆須 **user explicit approval**。
- **recommendation**：❌ **不推薦直接做**；屬 future candidate；須先 loader landed（registry-aware）或 docs-only 裁決（schema-only）。

---

## 8. Recommended Order

保守順序（依掃描結果；**不**推薦直接 source implementation）：

1. **Final Idle Freeze / EXIT**（Option A）—— 預設；本 phase commit + push 後直接 freeze。
2. **若要在 freeze 前再 consolidation**：read-only acceptance of existing download docs（Option B）；不 commit；不改檔。
3. **若 user 明示要推進 download workflow**：先做 **loader source implementation preanalysis（docs-only）**（Option D）—— **不直接寫 code**；把 loader source phase 之 candidate A vs B / exact file scope / acceptance gates frozen。
4. **再做 validator remaining-rules implementation preanalysis（docs-only）**（Option E）—— schema-only rules 之 source + fixture exact scope frozen。
5. **最後才考慮 Admin picker / renderer / content migration**（皆須 loader landed + 各自獨立 source phase + user explicit approval；content migration 須逐篇 explicit）。

**裁決紅線**：本順序**不**在任一步推薦「直接 source implementation」。任何 source phase（Option G / H）皆須**先**有對應 docs-only 裁決 + preflight readonly + user explicit approval。

---

## 9. Risks / Non-goals

### 9.1 Non-goals（本文件明確不做）

- ❌ 不把使用者填表資料放進 repo。
- ❌ 不把回覆資料放進 Admin static files。
- ❌ 不把 Drive private folder / token / 帳號 email 放進 registry。
- ❌ 不混淆 `download.fileUrl` 與 form URL（R2 紅線；A / B+C 共存合法但不互換）。
- ❌ 不自動 migration（既有 fileUrl post 不主動遷移）。
- ❌ 不啟動 deploy / Blogger repost / GA4 validation。
- ❌ 不解鎖 pm-26 deploy gate。
- ❌ 不啟動 reverse UTM。
- ❌ 不啟用 Admin Apply / middleware write route / admin-write-cli（dry-run / apply / real write）。

### 9.2 Risk matrix

| # | 風險 | 等級 | 緩解 | 本 phase 允許 |
|---|---|---|---|---|
| R9.1 | 意外觸發 source implementation（改 `load-settings.js` / `validate-content.js` / 任一 `src/**`） | 🔴 高 | commit pre-check 限為單一 docs 檔；`git status` 須顯示 exactly 1 new file | ❌ 不允許 |
| R9.2 | 意外修改 registry（empty shape 被填值） | 🔴 高 | commit 須驗 `download-assets.json` / `download-forms.json` git status unchanged | ❌ 不允許 |
| R9.3 | 意外觸發 content migration（改 post frontmatter / template） | 🔴 高 | grandfather rule；commit pre-check 限為單一 docs 檔 | ❌ 不允許 |
| R9.4 | 意外新增 fixture | 🔴 高 | commit pre-check 限為單一 docs 檔；無 `content/validation-fixtures/**` 變動 | ❌ 不允許 |
| R9.5 | 推薦直接做 source implementation（跳階） | 🟡 中 | §8 明示順序不含直接 source；Option G / H 標 future candidate / 不推薦 | ❌ 不允許跳階 |
| R9.6 | privacy leak（registry / docs 意外含 respondent data / token） | 🔴 高（R1） | §4.3 重申 R1；本文件不含任何真實 token / PII | ❌ 永不允許 |
| R9.7 | build / deploy / Blogger repost / GA4 validation 意外觸發 | 🔴 高 | 本 phase 僅 docs commit + push origin/main；無 dist 變動 | ❌ 不允許 |
| R9.8 | reverse UTM / pm-26 / Admin write 意外解鎖 | 🔴 高 | 三 surface 與 download workflow 解耦；本 phase 不觸及 | ❌ 不允許 |

---

## 10. Final Recommendation

### 10.1 預設推薦

- **本 phase 完成後 Final Idle Freeze / EXIT**（Option A）。
- **不**直接接 loader / validator source implementation（Option G / H 屬 future candidate；不推薦直接做）。
- 若要實作，**下一階段需獨立明示 phase**，且**先做 acceptance（Option B）或更細設計（Option D / E / F），不直接寫 source**。

### 10.2 理由

1. download workflow 之上游 docs 規劃已相當完整（loader contract + validation rule families + registry schema + landing direction 皆 docs-accepted）；缺的是 source phase 之 user explicit 授權，而非更多 preanalysis。
2. 所有 consumer（loader / validator-via-registry / Admin picker / renderer / content migration）保持 dormant；無被動到期事項；無時間壓力。
3. sourceKey track 已收束；本 phase commit 後新 cold-start baseline 為本文件之 commit hash；下次 session 可讀本文件 + loader preanalysis（night-5）+ remaining-rules preanalysis（night-6）作三入口。
4. reverse UTM / pm-26 / Admin write infra 仍 dormant 或 blocked；在無 user 明示前不啟動任何下游 phase 為最低風險選擇。
5. 對齊 `CLAUDE.md` §1 / §27 / §29 / §30 之「不過度工程化」與「先說明 + user 明示授權方可實作」原則。

### 10.3 不推薦立即執行

- ❌ 不推薦立即進入任一 source implementation（loader / validator / Admin / renderer）。
- ❌ 不推薦立即進入 content migration。
- ❌ 不推薦立即進入 deploy / Blogger repost / GA4 validation（pm-26 deploy gate 仍 BLOCKED）。
- ❌ 不推薦立即進入 reverse UTM activation / pm-26 unblock / Admin Apply enable。

---

## Cross-references

- `docs/20260601-download-loader-preanalysis.md`（night-5 loader preanalysis；landed `27ef9e4`）
- `docs/20260601-download-validation-remaining-rules-preanalysis.md`（night-6 remaining-rules preanalysis）
- `docs/20260601-next-work-roadmap-preanalysis.md`（night-3 next-work roadmap；landed `f137457`）
- `docs/20260531-download-empty-registry-implementation-plan.md`（am-8 implementation plan）
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`（am-4 schema decision）
- `docs/20260531-download-asset-form-registry-json-preanalysis.md`（am-6 registry JSON preanalysis）
- `docs/20260530-download-validation-fileurl-relative-path-decision-preanalysis.md`（am-11 relative path Option D）
- `docs/20260530-download-fileurl-preview-url-risk-policy.md`（night-7 preview-url-risk policy）
- `docs/20260530-download-validation-s1-s2-merge-decision.md`（S1/S2 merge；Option Beta）
- `docs/20260530-download-validation-d3-s1-s2-decision-preanalysis.md`（am-9 D3/S1/S2 decision）
- `docs/20260530-download-validation-rules-preanalysis.md`（am-1 D/S/F/A 規則初稿）
- `docs/20260529-download-landing-page-schema-preanalysis.md`（landing page schema 方向）
- `docs/20260529-download-landing-page-settings-registry-direction-preanalysis.md`（landing settings registry direction）
- `docs/20260529-download-landing-page-admin-model-preanalysis.md`（Admin picker model 草案）
- `docs/admin-2-write-pre-analysis.md`（Admin-2 write surface + safety plan）
- `docs/reverse-utm-fixture-plan.md`（reverse UTM fixture 設計原則 / 啟動條件）
- `CLAUDE.md` §3.2（settings 集中管理 + download empty registry governance）
- `CLAUDE.md` §13（教具下載文章規則）
- `CLAUDE.md` §27（Claude Code 修改規則）
- `CLAUDE.md` §29 / §30（第一版不做清單 / 專案最終樣貌）

---

End of preanalysis.
