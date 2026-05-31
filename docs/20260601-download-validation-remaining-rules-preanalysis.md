# 2026-06-01 Download Validation Remaining Rules Preanalysis

> Phase: `20260531-night-6-download-validation-remaining-rules-preanalysis-docs-only-a`
> Date: 2026-05-31 22:23 +0800（於 night-5 download loader preanalysis `27ef9e4` 落地後之 cold-start session）
> Scope: **docs-only**（單檔新增；無 source / content / settings / templates / fixture / package / dist / gh-pages / `.cache` / `CLAUDE.md` / 既有 docs 變更）
> Baseline: HEAD = origin/main = `27ef9e4ccf2bf6f529bd7417c63158ef8a75b92d`
> validate:content baseline: **0 errors / 47 warnings / 42 posts**

---

## 1. Executive Summary

- 本文件為 **docs-only preanalysis**：在已落地之 D1 / D2 / D3 / S（merged `download-content-should-be-noindex`）validator rules 與已落地之 download empty registry（`466e471`）之上，盤點 download validation 之 **remaining rule families**（D 衍生 / S 衍生 / F1-F2 / A1-A3 / preview-url-risk）之未來 source phase 方向，並把每族之 trigger、severity、fixture、baseline 影響、依賴鏈固化為設計輸入。
- **本 phase 不授權任何 validate-content source implementation**：
  - ❌ 不改 `src/scripts/validate-content.js` 任一行。
  - ❌ 不新增 / 不修改 / 不 promote 任何 fixture。
  - ❌ 不改 source / settings / content / templates / package。
  - ❌ 不啟動 download loader source / Admin picker / renderer / content migration。
  - ❌ 不啟動 sourceKey Admin selector / `source-inactive` warning rule source。
  - ❌ 不執行 admin-write-cli dry-run / apply；不啟用 Admin Apply；不新增 middleware write route。
  - ❌ 不 build / deploy / Blogger repost / GA4 validation。
  - ❌ 不解除 reverse UTM dormant；不解除 pm-26 deploy gate。
- 本 phase 之目標：在 night-3 next-work roadmap（`f137457`）之 Candidate C「Download validation remaining rules preanalysis docs-only」候選方向落地單一 docs 檔；推進 download validation cadence 之**上游規劃**而不觸碰 source。
- Baseline `27ef9e4`：HEAD = origin/main；working tree clean；ahead/behind = 0/0；validate `0 / 47 / 42`。
- 本文件落地後 production state drift = 0；唯一變更為新增本 docs 檔；validate baseline 預期維持不變。

### 1.1 一句話裁決

> **D 衍生 / S 衍生 / F1-F2 / A1-A3 / preview-url-risk 之未來 source phase 啟動條件、檔案邊界、fixture 形狀、baseline 預期影響、registry 依賴順序於本文件內固化為設計輸入；本 phase 不啟動任何 source / settings / fixture / build / deploy 動作；validate-content / loader / validator-via-registry / Admin picker / renderer / content migration 全保持 dormant。**

---

## 2. Frozen Baseline

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD（本 phase 啟動時） | `27ef9e4ccf2bf6f529bd7417c63158ef8a75b92d` |
| origin/main（本 phase 啟動時） | `27ef9e4ccf2bf6f529bd7417c63158ef8a75b92d` |
| short | `27ef9e4` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| validate:content | **0 errors / 47 warnings / 42 posts** |
| latest commit subject | `docs(download): plan loader registry lookup` |

### 2.1 Governance dormancy snapshot

| Gate / Surface | 狀態 |
|---|---|
| Reverse UTM source（pm-24a / b / c at `7e1d356` / `e2309e9` / `7c769fe`） | ✅ landed origin/main（2026-05-23） |
| Reverse UTM live | ❄ **dormant**（未 deploy；Blogger 後台未重貼；GA4 Realtime validation 未啟動） |
| pm-26 deploy gate | ❄ **BLOCKED**（positive fixture 仍 `status: draft`；publish-readiness 未達成） |
| Download empty registry（`content/settings/download-assets.json` + `content/settings/download-forms.json`） | ✅ landed at `466e471`；shape = empty `{ schemaVersion: 1, updatedAt: "", assets\|forms: [], notes: "" }` |
| Download loader source | ❄ **dormant**（`src/scripts/load-settings.js` 未串接） |
| Download validator-via-registry rules（unknown-field / duplicate-id / ref-not-found / inactive / preview-risk-via-registry / notes-token-like-pattern） | ❄ **全 dormant** |
| Download Admin picker | ❄ **dormant** |
| Download landing page renderer | ❄ **dormant** |
| Download content migration（`fileUrl` → `assetRefs[]` / `formRef`） | ❄ **dormant**（既有 fileUrl post 未遷移） |
| `source-inactive` warning rule | ❄ **dormant** |
| sourceKey Admin selector | ❄ **dormant** |
| Admin Apply enable flag | ❄ **disabled / dormant** |
| Middleware write route | ❄ **absent**（無 route handler；無 server-side write） |
| admin-write-cli dry-run / apply | ❄ **dormant** |

### 2.2 本 phase 對 baseline 之預期

- 本 phase 不改 source / settings / content / fixture；validate pipeline 之 input 不變。
- 本 phase commit 完成後預期 baseline 維持 **0 errors / 47 warnings / 42 posts**。
- 本 phase commit 後 baseline 若 drift → 視為意外影響；應 STOP（per phase prompt task 4 / task 8）。
- 既有 47 warnings 之內容於本 docs-only phase **不**重新列舉；屬 read-only baseline assertion。

---

## 3. Current Download Validation State

### 3.1 已 landed 之 validator rules

| Rule | warning id | severity | trigger（簡述） | 落地 commit / phase |
|---|---|---|---|---|
| **D1** | `download-enabled-fileurl-empty` | warning | `contentKind === 'download'` 且 `download.enabled === true` 且 `fileUrl` 為 `undefined` / empty string / whitespace-only string；ready / published only | am-7（5/30） |
| **D2** | `download-fileurl-invalid-type` | warning | `download.fileUrl !== undefined` 且非 string；ready / published only | am-7（5/30） |
| **D3** | `download-fileurl-invalid-format` | warning | `download.fileUrl` 為 non-empty trimmed string 且不符 `^https?://`；ready / published only | am-13（5/30） |
| **S（S1/S2 merged）** | `download-content-should-be-noindex` | warning | `contentKind === 'download'` 且（`seo.indexing === undefined` 或 `seo.indexing === 'index'`）；ready / published only；與 `invalid-seo-block` / `invalid-seo-indexing` 互斥 | night-5（5/30） |

per `src/scripts/validate-content.js` L456–L569（D1 / D2 / D3 / S 區塊）；comment 內 explicit reference 至 docs am-13 / night-5。

### 3.2 D3 format rule 之裁決固化

- ✅ regex **frozen at B-strict**（`^https?://`）；per `docs/20260530-download-validation-d3-s1-s2-decision-preanalysis.md` §5.8 + `docs/20260530-download-validation-fileurl-relative-path-decision-preanalysis.md` §6.1 + `docs/20260530-download-fileurl-preview-url-risk-policy.md` §D.1。
- ✅ Option D（**不允許** relative / repo-internal path；未來 internal asset 走 registry `assetRefs[]` / `formRef`）已 docs-accepted；per am-11 §6.1 / §14.1。
- ✅ D3 之 syntax check **不**涵蓋 preview-url-risk；Drive preview URL 通過 D3（命中 `^https?://`）；preview risk 屬 docs-only policy（per night-7）。
- D3 source 不再有「decision drift」風險；後續 source phase 若擴張 D3，須先有 docs-only 裁決。

### 3.3 既有 download fixture baseline inventory

`content/validation-fixtures/blogger/posts/` 內 download-related fixture 共 5 筆：

| Fixture | 觸發 warning | 落地 phase |
|---|---|---|
| `_test-download-enabled-fileurl-empty.md` | `download-enabled-fileurl-empty`（D1） | am-7 |
| `_test-download-fileurl-invalid-type.md` | `download-fileurl-invalid-type`（D2） | am-7 |
| `_test-download-fileurl-invalid-format.md` | `download-fileurl-invalid-format`（D3） | am-13 |
| `_test-download-content-should-be-noindex-missing.md` | `download-content-should-be-noindex`（S undefined case） | night-5 |
| `_test-download-content-should-be-noindex-index.md` | `download-content-should-be-noindex`（S index case） | night-5 |

5 個 fixture 共貢獻 5 條 warning 至 47-warning baseline；對應 5 個 post 計入 42-post 總數。

### 3.4 尚未實作之 download validation 面向

| 面向 | 狀態 | 阻擋條件 |
|---|---|---|
| Registry lookup validation（`download-asset-ref-not-found` / `download-form-ref-not-found`） | ❄ **dormant** | 需 loader 落地（per `docs/20260601-download-loader-preanalysis.md` §11） |
| `assetRefs[]` schema validation（type / format / duplicate / empty / inactive） | ❄ **dormant** | 需 loader + post frontmatter schema 擴張 |
| `formRef` schema validation（presence / format / not-found / inactive） | ❄ **dormant** | 需 loader + post frontmatter schema 擴張 |
| `download-registry-unknown-field` | ❄ **dormant** | 需 loader |
| `download-asset-duplicate-id` / `download-form-duplicate-id` | ❄ **dormant** | 需 loader |
| `download-asset-inactive` / `download-form-inactive` | ❄ **dormant** | 需 loader + entry-level `active` flag schema |
| `preview-url-risk-via-registry` | ❄ **dormant** | 需 loader + registry `deliveryMode` 欄位 schema |
| `download-registry-notes-token-like-pattern` | ❄ **dormant** | 需 loader |
| D 系列擴張（landing-page level noindex / asset-bundle consistency / fileUrl-vs-registry-coexistence） | ❄ **dormant** | 需獨立 docs-only 裁決 + 對應 source phase |
| S 系列擴張（landing-page level noindex / sitemap precedence advisory） | ❄ **dormant** | 需獨立 docs-only 裁決 |

### 3.5 與 night-5 download loader preanalysis 之邊界

- night-5 loader preanalysis（`27ef9e4`）僅規劃 loader 與 registry lookup model；**不**規劃 validator rules 之具體 fixture / 命名 / baseline 影響。
- 本文件之 §4–§8 為 validator rules 之 family-level preanalysis；與 night-5 之 loader preanalysis **互不重疊**。
- 兩 docs 可獨立落地；但**未來 source phase** 之啟動順序須遵守「loader 在前 / validator-via-registry 在後」之 cadence（per night-5 §11 + 本文件 §10）。

---

## 4. Rule Family D — `download.fileUrl` Format Rules

### 4.1 已落地之 D 系列（recap）

- D1 / D2 / D3 已 landed；本族**核心三條**已 frozen；本文件**不**重新裁決其 trigger / severity / fixture。

### 4.2 候選擴張 rule ids

下列為**未來** D 系列**潛在**新增 rule；本 phase **不**啟動實作；命名僅為設計提示：

| 候選 id | 範圍 | 觸發條件草案 |
|---|---|---|
| `download-fileurl-invalid-format`（已 landed；列此為 reference） | non-empty string + 不符 `^https?://` | ✅ 已實作於 D3 |
| `download-fileurl-trailing-whitespace` | string 兩端含 whitespace 但 trimmed 後 syntax 合法 | 🟡 candidate；low priority |
| `download-fileurl-coexists-with-asset-refs`（未來與 assetRefs[] 共存時之 advisory） | post 同時宣告 `download.fileUrl` 與 `assetRefs[]`（grandfather + new path 共存） | 🟡 candidate；屬未來 registry-aware rule |
| `download-fileurl-form-url-misuse`（per night-7 §D.1） | fileUrl 命中 Google Form URL pattern（與 R2 紅線一致） | 🔴 deferred；屬語意層；建議走 registry-aware 路徑 |

### 4.3 strict http(s) policy 之 frozen state

- B-strict（`^https?://`）為 D3 之 frozen regex；不再因 D 系列擴張而退化或鬆綁。
- relative path / repo-internal path / `mailto:` / `tel:` / `javascript:` / `data:` / `ftp:` 之 syntax pass policy 保持：**不通過** D3。

### 4.4 Relative path policy（per am-11 Option D 固化）

- ❌ 不允許 raw `download.fileUrl` 填入 relative path。
- ✅ 未來 internal asset 需求 → 走 DownloadAsset registry 之 `assetRefs[]` named reference；**不**回到 raw URL 路徑。
- 對齊 am-11 §6.1 / §14.1。

### 4.5 Google Drive preview / direct URL limitation

- D 系列**不**對 Drive preview vs direct URL 做機械化判斷；屬語意層風險。
- 對 Drive share URL（`/file/d/<id>/view?usp=sharing`）/ preview URL（`/file/d/<id>/preview`）/ direct URL（`/uc?export=download&id=<id>`）三者，D3 syntax check 均 **pass**。
- 未來 validator 若要做 Drive URL semantic check → 走 registry-aware 路徑（per §8）；不擴張 D 系列 regex。

### 4.6 Mutual exclusion with D1 / D2

- D1（fileUrl 缺失 / 空 / whitespace）+ D2（fileUrl 非 string）+ D3（fileUrl 為 non-empty string 但 syntax 不合）三者**天然互斥**：
  - D2 之 trigger 要求 `fileUrl !== undefined` 且非 string → D1 / D3 之 trigger 自動不命中。
  - D1 之 trigger 要求 fileUrl 為 undefined / empty / whitespace → D3 之 trigger 自動不命中（D3 要求 non-empty trimmed string）。
- 未來 D 系列擴張須 mirror 此互斥 pattern；新 rule 之 trigger 須**明示**不與 D1 / D2 / D3 重疊；避免 double-warn 同一 post 之同欄位。

### 4.7 Future fixture needs（**本 phase 不建立**）

| Rule（若未來實作） | 預期 fixture（命名草案） | 預期 baseline 變動 |
|---|---|---|
| `download-fileurl-trailing-whitespace` | `_test-download-fileurl-trailing-whitespace.md` | +1 warning / +1 post |
| `download-fileurl-coexists-with-asset-refs` | `_test-download-fileurl-coexists-with-asset-refs.md` | +1 warning / +1 post（**需** loader 串接） |
| `download-fileurl-form-url-misuse` | `_test-download-fileurl-form-url-misuse.md` | +1 warning / +1 post（**deferred** 至 registry-aware） |

### 4.8 Expected validate baseline change in future source phase

- 任何新增 D 系列 rule 之 baseline 影響須**在該 rule 之獨立 source phase preanalysis** 估算；本 phase **不**估算具體 +N。
- D 系列在無新增 fixture 之 source phase 內預期 baseline 影響為 **0**（既有 ready post 之 fileUrl 全部 syntax 合法或被 D1 / D2 / D3 接住）。

### 4.9 Why D family extensions are not implemented now

- D 系列**核心三條**（D1 / D2 / D3）已 frozen；無 production 痛點驅動立即擴張。
- 候選 rule（trailing-whitespace / coexists / form-url-misuse）皆屬**邊緣 case**；無作者誤填案例驅動；屬未來 nice-to-have。
- coexists / form-url-misuse 屬 **registry-aware** 範疇；須先有 loader landed；本 phase 不超前。
- 對齊 `CLAUDE.md` §29 / §30 之「不過度工程化」原則。

---

## 5. Rule Family S — SEO / noindex Rules

### 5.1 已落地之 S 系列（recap）

- S（merged `download-content-should-be-noindex`，per night-5）已 landed；單一 rule id 同時涵蓋 `seo.indexing === undefined` 與 `seo.indexing === 'index'` 兩個 case（per `docs/20260530-download-validation-s1-s2-merge-decision.md` §F.1 Option Beta）。
- S 系列**核心**已 frozen；本文件**不**重新裁決其 trigger / severity / fixture / message。

### 5.2 S1 / S2 relationship recap

- **裁決**：S1（undefined）與 S2（index）合併為單一 rule id `download-content-should-be-noindex`。
- **棄用 candidate name**：`download-content-marked-index`（保留為 deprecated candidate；不重新啟用）。
- S 之 message dynamic 根據實際 `seo.indexing` 值區分 undefined / index 兩語意；不分裂為兩 rule id。

### 5.3 Possible merged / extended S rule candidates

下列為**未來** S 系列**潛在**擴張；本 phase **不**啟動實作：

| 候選 id | 範圍 | 觸發條件草案 | 依賴 |
|---|---|---|---|
| `download-landing-page-should-be-noindex` | 未來 landing page renderer 落地後，對 landing page 而非 article page 之 noindex consistency check | landing page renderer 有獨立 frontmatter 且 `seo.indexing` 未顯式設定 | 需 landing page renderer source |
| `download-sitemap-exclude-advisory` | post `contentKind === 'download'` 且 `seo.indexing === 'index'` → 與 sitemap precedence 衝突之 advisory | mirror S；但 emit reason field 標示 sitemap precedence 衝突 | 需 docs-only 裁決是否疊加在 S 上 |
| `download-noindex-extended-to-fileurl-redirect`（未來 internal redirect 落地後） | 對 internal download redirect URL 之 noindex consistency | 需 redirect renderer | 需 renderer source |

### 5.4 When download landing pages should be noindex

- per `CLAUDE.md` §13 / pm-12 / pm-16 / am-1：download landing page 為 noindex 中繼頁；download content 通常不應作為搜尋直達入口。
- 既有 S rule 之 trigger 為 `contentKind === 'download'`；不區分 article page vs landing page。
- 未來若 landing page renderer 落地（與 article post-detail.ejs 區分） → S 系列須擴張至 landing page level；本文件**不**裁決具體 trigger。

### 5.5 Distinction between article page and download landing page

- **article page**（既有 `post-detail.ejs`）：以 `.md` frontmatter 之 `contentKind === 'download'` 識別；S 系列已涵蓋。
- **download landing page**（未來 renderer）：可能由 `assetRefs[]` 或 `formRef` 驅動之中繼頁；目前 renderer **不存在**；schema 未定。
- 兩者之 noindex consistency 屬不同面向；S 系列當前**僅**涵蓋 article page；landing page level 屬未來擴張。

### 5.6 Conflict precedence with existing SEO validation

- 既有 `invalid-seo-block`（`seo` 非 plain object）/ `invalid-seo-indexing`（`seo.indexing` 不在 `VALID_SEO_INDEXING` enum）優先於 S 觸發；S 對既有 SEO violation 不再 push（per night-5 §F.2）。
- 未來 S 系列擴張**須 mirror** 此 precedence 策略；既有 SEO violation 優先；不 double-warn 同一 post。

### 5.7 Future fixture needs（**本 phase 不建立**）

| Rule（若未來實作） | 預期 fixture（命名草案） | 預期 baseline 變動 |
|---|---|---|
| `download-landing-page-should-be-noindex` | `_test-download-landing-page-should-be-noindex-missing.md` | +1 warning / +1 post（**需** landing page renderer + 新 contentKind） |
| `download-sitemap-exclude-advisory` | `_test-download-sitemap-exclude-advisory.md` | +1 warning / +1 post |

### 5.8 Expected validate baseline change in future source phase

- 任何 S 系列擴張之 baseline 影響須**在該 rule 之獨立 source phase preanalysis** 估算；本 phase **不**估算具體 +N。

### 5.9 Why S rule extensions are not implemented now

- S 系列**核心**已 frozen；既有 fallback（build-github.js robots meta + build-sitemap.js exclusion）已覆蓋 download content 之 noindex / sitemap 行為。
- landing page renderer 不存在 → landing-page level rule 無法落地（無 trigger object）。
- sitemap-exclude-advisory 屬 docs-only 重複提示；無作者誤填案例驅動。
- 對齊 `CLAUDE.md` §29 / §30 之「不過度工程化」原則。

---

## 6. Rule Family F — Form Reference Rules

### 6.1 Family overview

- F 系列為 **registry-gated**：所有 F rule 之 trigger 涉及 `formRef` 欄位之**身分查詢**；查詢結果依賴 download form registry 之 loader landed。
- 當前 `formRef` 欄位**不存在**於任一 post frontmatter；當前 `content/settings/download-forms.json` 為 empty registry（`forms: []`）；F 系列**全 dormant**。

### 6.2 Possible `formRef` presence rule

| 候選 id | 觸發 | 依賴 |
|---|---|---|
| `download-formref-missing-when-gated` | post `contentKind === 'download'` 且後續業務規則認定需 form gating（如 inactive `download.enabled === false` + `formRef` 缺失） | 需業務規則裁決；屬 docs-only 裁決 |
| `download-formref-empty-string` | `formRef` 存在但為空字串 / whitespace | 不需 registry；屬 schema-only check |

### 6.3 `formRef` string type / format expectation

- 預期型別：**single string**（per night-5 §6.2 + am-2 §9 + am-4 §6）。
- 預期格式：**kebab-case ASCII**（per night-5 §6.3）：lowercase letters / digits / hyphen；建議同 site 內 prefix 一致（如 `bookshelf-download-form`）。
- **不**強制 date prefix（per night-5 §6.4）；ID 為身分識別，非時序紀錄。
- **不**建議中文字元（per night-5 §6.5）；URL-friendliness / file-system-friendliness。

### 6.4 `formRef` registry lookup future dependency

| 候選 id | 觸發 | 依賴 |
|---|---|---|
| `download-form-ref-not-found` | `formRef` 為 string 且不命中 `content/settings/download-forms.json` 之任一 entry id | 需 loader landed（per night-5 §11） |
| `download-form-ref-format-invalid` | `formRef` 為 string 但不符 kebab-case ASCII format | 不需 registry；屬 schema-only check |

### 6.5 Missing form registry entry behavior

- per night-5 §6.7：**loader 層不 throw / 不 warn**（loader 不知 ref 從何來）；**validator-via-registry 層** push warning；**renderer 層**渲染時略過該 ref。
- F 系列須 mirror 此 layering；validator 為唯一 warning 來源；severity = **warning**（非 error）；不 abort build。

### 6.6 Inactive / unavailable form future behavior

| 候選 id | 觸發 | 依賴 |
|---|---|---|
| `download-form-inactive` | `formRef` 命中 entry 且 entry `active === false` 或 `status === 'inactive'` / `'archived'` | 需 loader + entry-level `active` flag schema |

- 對 inactive entry 之最終 UX 語意（隱藏 / 顯示「暫時下架」訊息）屬 renderer 範疇；validator 僅負責 warning push。
- per night-5 §6.8：本文件**不**裁決 inactive entry 之最終語意；屬未來 docs-only sub-phase。

### 6.7 Respondent data privacy red line

- **R1 紅線**（per `CLAUDE.md` §3.2 + `docs/20260531-download-asset-form-settings-registry-schema-decision.md` §8 + pm-20 §4 R1）：
  - ❌ **永不**含 respondent data（email / 姓名 / 電話 / 學校 / 答覆內容 / Google Sheet response rows）
  - ❌ **永不**含 access token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID / 私人 permission grant
  - ❌ Google Form responses **remain in Google Forms / Sheets**；不進 repo
- F 系列**任一** validator rule **不得**讀取 / 引用 / 推導 / 暴露 respondent data；任何違反 R1 之 rule 設計**永不**進入 source phase。
- 對 `download-registry-notes-token-like-pattern`（per night-5 §5.10）之 R1 防護：validator 對 `notes` 欄位之掃描須限於 token-like pattern 偵測，**不**讀取 / 引用 / 留存 token 之 raw value。

### 6.8 Future fixture needs（**本 phase 不建立**）

| Rule（若未來實作） | 預期 fixture（命名草案） | 預期 baseline 變動 |
|---|---|---|
| `download-formref-empty-string` | `_test-download-formref-empty-string.md` | +1 warning / +1 post |
| `download-form-ref-format-invalid` | `_test-download-form-ref-format-invalid.md` | +1 warning / +1 post |
| `download-form-ref-not-found` | `_test-download-form-ref-not-found.md` | +1 warning / +1 post（**需** loader） |
| `download-form-inactive` | `_test-download-form-inactive.md` | +1 warning / +1 post（**需** loader + active flag schema） |

### 6.9 Why F rules are not implemented now

- `formRef` 欄位**不存在**於任一 post frontmatter；當下無 trigger object。
- registry 為 empty（`forms: []`）；ref-not-found / inactive 之 lookup 無法 exercise。
- loader 未串接；任何 registry-aware rule 無 data source。
- 必須**先**走 loader landed phase（per night-5 §11 + 本文件 §10）；F 系列**最後**進場。

---

## 7. Rule Family A — Asset Reference Rules

### 7.1 Family overview

- A 系列為 **registry-gated**：所有 A rule 之 trigger 涉及 `assetRefs[]` 欄位之**身分查詢**；查詢結果依賴 download asset registry 之 loader landed。
- 當前 `assetRefs[]` 欄位**不存在**於任一 post frontmatter；當前 `content/settings/download-assets.json` 為 empty registry（`assets: []`）；A 系列**全 dormant**。

### 7.2 `assetRefs[]` array expectation

- 預期型別：**array of string id**（per night-5 §6.6 + am-2 §9 + am-4 §6）。
- 預期可空陣列（`[]`）/ 可省略；多筆代表「一篇 post 可下載多檔」。
- 對單筆 vs 多筆無強制下限；屬作者意圖；validator 不對「應有 N 筆以上」做機械化判斷。

### 7.3 Asset id string format

- 預期格式：**kebab-case ASCII**（per night-5 §6.3）：lowercase letters / digits / hyphen；建議同 site 內 prefix 一致（如 `phonics-practice-sheet-vol-1`）。
- **不**強制 date prefix（per night-5 §6.4）。
- **不**建議中文字元（per night-5 §6.5）。
- **不**採 namespace prefix（如 `asset:`）或 path-style（如 `assets/`）（per night-5 §6.9）；ref 與 entry id 一致 flat naming。

### 7.4 Empty array behavior

| 候選 id | 觸發 | 裁決方向 |
|---|---|---|
| `download-assetrefs-empty-when-required` | `assetRefs[]` 為 `[]` 且後續業務規則認定需 asset（如 `download.enabled === true` + 無 `formRef` + 無 `download.fileUrl`） | 🟡 **defer**；需先裁決「純表單流是否合法」（per am-1 §5）|
| `download-assetrefs-empty-noop` | `assetRefs[]` 為 `[]` 且無業務驅動需 asset | ✅ **不 warn**；empty array 為合法初始狀態 |

### 7.5 Duplicate assetRefs behavior

| 候選 id | 觸發 |
|---|---|
| `download-assetrefs-duplicate` | 同一 post `assetRefs[]` 內出現重複 id | warning（屬 schema-only check；不需 registry） |
| `download-asset-duplicate-id` | registry 內 `assets[]` 之 entry id 重複 | warning（屬 registry-level check；per night-5 §5.7） |

- 兩者語意不同；前者為 post-side，後者為 registry-side；**不**合併。

### 7.6 Missing asset registry entry behavior

| 候選 id | 觸發 | 依賴 |
|---|---|---|
| `download-asset-ref-not-found` | `assetRefs[i]` 為 string 且不命中 `content/settings/download-assets.json` 之任一 entry id | 需 loader landed（per night-5 §11） |
| `download-assetrefs-invalid-type` | `assetRefs` 存在但非 array（如 string / object / null） | 不需 registry；屬 schema-only check |

### 7.7 Inactive / unavailable asset future behavior

| 候選 id | 觸發 | 依賴 |
|---|---|---|
| `download-asset-inactive` | `assetRefs[i]` 命中 entry 且 entry `active === false` 或 `status === 'inactive'` / `'archived'` | 需 loader + entry-level `active` flag schema |

- 對 inactive entry 之最終 UX 語意（隱藏 / 顯示「暫時下架」訊息）屬 renderer 範疇；validator 僅負責 warning push。

### 7.8 ZIP / PDF / JPG delivery variants

- registry entry 之 `deliveryMode`（如 `single-file-pdf` / `single-file-zip` / `bundle-zip` / `external-cdn` / `drive-direct` / `drive-share` / `drive-preview`）屬未來 schema 字典；本文件**不**裁決具體 enum 值。
- 對 bundle consistency（如 `assetRefs[]` 全部為同一 deliveryMode）屬未來獨立 validator rule（per night-5 §6.6 + am-6 §11.6）；候選 id：`download-assetrefs-mixed-delivery-mode`；🟡 defer。
- 對 ZIP vs PDF vs JPG 之選擇屬作者意圖；validator **不**強制特定 deliveryMode；僅在 bundle 內部不一致時 advisory。

### 7.9 Future fixture needs（**本 phase 不建立**）

| Rule（若未來實作） | 預期 fixture（命名草案） | 預期 baseline 變動 |
|---|---|---|
| `download-assetrefs-invalid-type` | `_test-download-assetrefs-invalid-type.md` | +1 warning / +1 post |
| `download-assetrefs-duplicate` | `_test-download-assetrefs-duplicate.md` | +1 warning / +1 post |
| `download-asset-ref-not-found` | `_test-download-asset-ref-not-found.md` | +1 warning / +1 post（**需** loader） |
| `download-asset-inactive` | `_test-download-asset-inactive.md` | +1 warning / +1 post（**需** loader + active flag） |
| `download-assetrefs-mixed-delivery-mode` | `_test-download-assetrefs-mixed-delivery-mode.md` | +1 warning / +1 post（**需** loader + deliveryMode schema） |

### 7.10 Why A rules are not implemented now

- `assetRefs[]` 欄位**不存在**於任一 post frontmatter；當下無 trigger object。
- registry 為 empty（`assets: []`）；ref-not-found / inactive / mixed delivery 之 lookup 無法 exercise。
- loader 未串接；任何 registry-aware rule 無 data source。
- `deliveryMode` enum 未裁決；mixed-delivery rule 無 contract 可依。
- 必須**先**走 loader landed phase（per night-5 §11 + 本文件 §10）；A 系列**最後**進場。

---

## 8. preview-url-risk Policy Boundary

### 8.1 Current state

- per `docs/20260530-download-fileurl-preview-url-risk-policy.md`（night-7 5/30）：
  - preview-url-risk 為 **docs-only authoring policy**；validator **永不**對其做 regex / reachability check。
  - 升級為 validator / Admin warning **必須先有** DownloadAsset registry 落地（per night-7 §F）。
- 升級條件之第一條（registry schema docs-accepted）已達成（per am-4 / am-6）；第二條（registry landed empty shape）已達成（per `466e471`）；**後續條件**（loader 串接 / `deliveryMode` schema / migration plan）尚未達成。
- 當前 D3 對 Drive preview URL 之 syntax check 仍 **pass**（命中 `^https?://`）；preview risk 不由 D3 接住。

### 8.2 Why preview-url-risk should remain policy/docs-only for now

- **Drive URL pattern 易變**：`/view?usp=sharing` / `/view?usp=share_link` / `/preview` / `/open?id=` / `/uc?export=download` 等變體繁多；regex 維護成本高、容易過嚴或過寬。
- **Google Drive 並非唯一語意風險來源**：Dropbox preview / OneDrive share / iCloud share / WeTransfer 等皆有類似 preview vs direct 區分；validator 無法窮舉所有第三方雲端服務之 URL pattern。
- **過嚴 regex 容易誤擋合法暫存做法**：作者可能於草稿期 intentionally 填入 Drive share URL 作為暫存 placeholder；validator regex 若直接 warn 會干擾此暫存流程。
- **語意層判斷應靠 registry，非 URL pattern**：registry entry 之 `deliveryMode` 可明示語意；validator 對 registry-linked download 改檢查 registry consistency，**不**需 reverse-engineer URL pattern。

### 8.3 Why validate-content should not perform URL reachability checks now

- per `docs/20260530-download-validation-rules-preanalysis.md` §3 D4 non-rule 宣告：validate-content 永不做 reachability / network check。
- preview vs direct download 與 reachability 性質類似，皆屬「需驗證行為」而非「驗證 schema」；不在 validate-content 範疇。
- 屬獨立 `check-broken-links.js` 或 manual gate 範疇；本文件**不**鬆綁此邊界。

### 8.4 Google Drive preview-page trap

- 作者可能誤填 Drive preview URL（`/file/d/<id>/preview`）作為 download CTA；使用者按下後抵達 Drive 嵌入式預覽 UI，並非直接觸發檔案下載。
- 對使用者體驗為「先看到 Drive 預覽 UI、再手動按下載」之多步驟流程；屬 UX degradation。
- 對 download landing page 之表單 → 檔案配發流程，preview URL 可能與表單後配發資產 URL 混淆。
- **解法不是 validator 做 regex**；解法是 registry-aware validation + Admin / authoring docs guidance。

### 8.5 Manual gate vs automated validation

- **當前 manual gate**：作者 / 編輯於 promote 至 ready / published 前人工檢查 fileUrl 是否仍為 share / preview URL；若是，視內容性質決定是否替換。
- **未來 registry-aware validation**：registry entry 之 `deliveryMode` explicit 記錄 → validator 對 registry-linked download 之 `deliveryMode === 'drive-preview'` 直接 warn（候選 id `preview-risk-via-registry`）。
- 兩者**共存**：raw `download.fileUrl` 路徑保持 manual gate；registry-linked path 走 automated。

### 8.6 Future registry-level advisory possibility

| 候選 id | 觸發 | 依賴 |
|---|---|---|
| `preview-risk-via-registry` | registry entry `deliveryMode === 'drive-preview'` 或同義 enum | 需 loader + `deliveryMode` schema enum 字典 |
| `preview-risk-fileurl-pattern`（**不推薦**） | raw `download.fileUrl` 命中 Drive preview URL regex | ❌ **不推薦**；違反 night-7 §D.1 裁決 |

### 8.7 No implementation authorized

- ❌ 本 phase **不**授權 preview-url-risk validator implementation（包含 raw URL regex 或 registry-aware 兩個路徑）。
- ❌ 本 phase **不**新增 `docs/20260530-download-fileurl-preview-url-risk-policy.md` 之裁決變更。
- ❌ 本 phase **不**降級 preview-url-risk 至 raw URL regex；裁決路徑保持 night-7 §D.1。

---

## 9. Fixture Inventory Plan

> **本 phase 不建立任何 fixture**。本節為**未來** D 衍生 / S 衍生 / F / A / preview-url-risk source phase 之 fixture 預先記錄；屬設計輸入。

### 9.1 Fixture inventory table

| Family | Fixture filename | 預期 warning id | 預期 status gate | 是否改變 validate baseline | 優先序 |
|---|---|---|---|---|---|
| D 衍生 | `_test-download-fileurl-trailing-whitespace.md` | `download-fileurl-trailing-whitespace` | ready | ✅ +1 warning / +1 post | 🟡 P3 |
| D 衍生 | `_test-download-fileurl-coexists-with-asset-refs.md` | `download-fileurl-coexists-with-asset-refs` | ready | ✅ +1 warning / +1 post（**需** loader） | 🔴 P5（after loader） |
| D 衍生 | `_test-download-fileurl-form-url-misuse.md` | `download-fileurl-form-url-misuse` | ready | ✅ +1 warning / +1 post（**deferred** registry-aware） | 🔴 P6（after deliveryMode enum） |
| S 衍生 | `_test-download-landing-page-should-be-noindex-missing.md` | `download-landing-page-should-be-noindex` | ready | ✅ +1 warning / +1 post（**需** landing page renderer + 新 contentKind） | 🔴 P7（after renderer） |
| S 衍生 | `_test-download-sitemap-exclude-advisory.md` | `download-sitemap-exclude-advisory` | ready | ✅ +1 warning / +1 post（需 docs-only 裁決疊加在 S 上） | 🟡 P4 |
| F | `_test-download-formref-empty-string.md` | `download-formref-empty-string` | ready | ✅ +1 warning / +1 post | 🟡 P2（schema-only；不需 loader） |
| F | `_test-download-form-ref-format-invalid.md` | `download-form-ref-format-invalid` | ready | ✅ +1 warning / +1 post | 🟡 P2 |
| F | `_test-download-form-ref-not-found.md` | `download-form-ref-not-found` | ready | ✅ +1 warning / +1 post（**需** loader） | 🔴 P5 |
| F | `_test-download-form-inactive.md` | `download-form-inactive` | ready | ✅ +1 warning / +1 post（**需** loader + active flag） | 🔴 P6 |
| A | `_test-download-assetrefs-invalid-type.md` | `download-assetrefs-invalid-type` | ready | ✅ +1 warning / +1 post | 🟡 P2（schema-only） |
| A | `_test-download-assetrefs-duplicate.md` | `download-assetrefs-duplicate` | ready | ✅ +1 warning / +1 post | 🟡 P3 |
| A | `_test-download-asset-ref-not-found.md` | `download-asset-ref-not-found` | ready | ✅ +1 warning / +1 post（**需** loader） | 🔴 P5 |
| A | `_test-download-asset-inactive.md` | `download-asset-inactive` | ready | ✅ +1 warning / +1 post（**需** loader + active flag） | 🔴 P6 |
| A | `_test-download-assetrefs-mixed-delivery-mode.md` | `download-assetrefs-mixed-delivery-mode` | ready | ✅ +1 warning / +1 post（**需** loader + deliveryMode enum） | 🔴 P7 |
| preview-url-risk | — | `preview-risk-via-registry` | n/a | ❓ TBD（**deferred**；不在 raw URL regex 路徑） | 🔴 P6+ |

### 9.2 Fixture creation 不在本 phase

- ❌ 本 phase **不**新增 `content/validation-fixtures/**` 任一檔。
- ❌ 本 phase **不** promote 任何 draft fixture 至 ready / published。
- 每一 fixture 須**獨立**走「source + fixture 同 PR」之 phase pattern（Option B per am-5 §10.6）；不混批。

### 9.3 Priority key

- 🟡 **P2 / P3**：schema-only / 不需 loader；可在 loader 之前獨立啟動。
- 🟡 **P4**：S 系列擴張；屬 docs-only 裁決 → source 之 cadence。
- 🔴 **P5–P7**：registry-aware；**必須** loader landed 後方可啟動。
- 任一 fixture 之啟動皆需 user explicit approval。

### 9.4 Fixture status gate consistency

- 全部 fixture 預期 `status: ready` / `draft: false`（mirror 既有 5 個 download fixture）。
- ❌ **不**規劃 `status: published` 之 fixture（不上 live）。
- ❌ **不**規劃 `status: draft` 之 fixture（draft 不進 validate 範圍）。

---

## 10. Proposed Implementation Sequencing

### 10.1 推薦保守 sequencing

| 序 | 候選 phase（命名草案） | 性質 | 涵蓋規則 | 預期 baseline |
|---|---|---|---|---|
| seq-1 | `am-3-download-validation-d3-source-extension-decision-docs-only`（如要擴張 D 系列） | docs-only | D 衍生 candidate 裁決 | 不變 |
| seq-2 | `am-3-download-seo-noindex-rule-extension-decision-docs-only`（如要擴張 S 系列） | docs-only | S 衍生 candidate 裁決 | 不變 |
| seq-3 | `am-3-download-form-asset-validation-schema-only-rules-decision-docs-only` | docs-only | F / A schema-only rules 裁決（`download-formref-empty-string` / `download-form-ref-format-invalid` / `download-assetrefs-invalid-type` / `download-assetrefs-duplicate`） | 不變 |
| seq-4 | `am-3-download-loader-source-implementation`（per night-5 §11） | source change | loader 串接 + missing / empty / parse-error / schemaVersion / unknown-field / duplicate-id behavior | 預期不變（loader read-only） |
| seq-5 | `am-3-download-loader-source-implementation-acceptance-cross-check` | read-only | n/a | 不變 |
| seq-6 | `am-3-download-validator-via-registry-source-implementation`（registry-aware F / A / preview-risk-via-registry） | source change + fixture | F-ref-not-found / A-ref-not-found / inactive / unknown-field / duplicate-id / preview-risk-via-registry | 預期 +N warnings / +N posts（estimate at preanalysis） |
| seq-7 | `am-3-download-validator-via-registry-source-implementation-acceptance-cross-check` | read-only | n/a | 不變 |
| seq-8+ | content migration / Admin picker / renderer source phases | source change | per `CLAUDE.md` §3.2 dormancy 解除路徑 | TBD |

### 10.2 Schema-only F / A rules 可在 loader 之前

- seq-3 之 schema-only rules（`download-formref-empty-string` / `download-form-ref-format-invalid` / `download-assetrefs-invalid-type` / `download-assetrefs-duplicate`）**不**依賴 loader；可在 loader landed 之前獨立啟動。
- 但建議**仍**走 docs-only 裁決 → source 之 cadence；不混批。

### 10.3 Registry-aware F / A rules 必須在 loader 之後

- seq-6 之 registry-aware rules（任一帶 `ref-not-found` / `inactive` / `unknown-field` / `duplicate-id` / `preview-risk-via-registry`）**必須**在 loader landed 後啟動。
- 在 loader 串接前提下，registry-aware rule 之 data source 才存在；先於 loader 啟動會落入「無法 exercise」之死碼狀態。

### 10.4 Why registry-aware F / A rules should not precede loader acceptance

- **無 data source**：registry-aware rule 之 trigger 依賴 loader 提供之 registry data；loader 未串接 → rule 永遠無 trigger object。
- **無 contract**：loader 之 fail-closed / silent-fallback / schemaVersion behavior 影響 rule 之邊界 case（如「registry 缺檔時是否 push ref-not-found」）；contract 未 frozen → rule 設計不穩。
- **fixture 設計依賴 registry shape**：fixture 之 `assetRefs[]` / `formRef` 內容須對應 registry entry id；registry shape 未 stable → fixture 命名 / shape 易飄。
- **baseline drift risk**：在 loader 未串接前實作 registry-aware rule，可能因 loader 之未來 contract 變動而 baseline 重新洗牌；屬避免 churn。

### 10.5 Why S extensions can independently of loader

- S 系列擴張之 trigger 依賴 post frontmatter 之 `seo.indexing` + `contentKind`；**不**依賴 registry。
- 可於 loader 之前獨立 docs-only 裁決 → source；屬 schema-only 路徑。

### 10.6 D family extensions sequencing

- D 衍生 candidate（trailing-whitespace / coexists-with-asset-refs / form-url-misuse）依不同 candidate 而異：
  - trailing-whitespace：schema-only；可在 loader 之前。
  - coexists-with-asset-refs：需 loader（因 `assetRefs[]` 之 trigger 需 schema 確認）。
  - form-url-misuse：registry-aware（建議改走 `preview-risk-via-registry` 同類路徑）。

---

## 11. Risk Matrix

| # | 風險 | 風險等級 | 緩解 | 本 phase 是否允許 |
|---|---|---|---|---|
| R11.1 | 意外觸發 validate-content source implementation（修改 `src/scripts/validate-content.js` 任一行） | 🔴 高 | phase prompt hard rules 明示禁止；commit pre-check 限為單一 docs 檔；`git diff` 須顯示 exactly 1 new file | ❌ 不允許 |
| R11.2 | warning id drift（既有 D1 / D2 / D3 / S 之 id 字串於 docs 內被改寫） | 🟡 中 | 本文件 §3.1 引用既有 id 須 byte-identical；不重新命名既有 id；不引入 alias | ❌ 不允許 drift |
| R11.3 | fixture count drift（既有 5 個 download fixture 之命名 / 觸發於 docs 內被改寫） | 🟡 中 | 本文件 §3.3 引用既有 fixture 須 byte-identical | ❌ 不允許 drift |
| R11.4 | source implementation before docs acceptance（未走 acceptance cross-check 即直接 source） | 🔴 高 | 本文件 §10 明示 docs-only 裁決 → source 之 cadence；不直接跳 source | ❌ 不允許跳階 |
| R11.5 | registry lookup before loader exists（在 loader 未串接前實作 registry-aware rule） | 🔴 高 | 本文件 §10.3 / §10.4 明示 registry-aware rule **必須** loader landed 後啟動 | ❌ 不允許 |
| R11.6 | false confidence from URL syntax checks（誤以為 D3 已涵蓋 preview-url-risk） | 🟡 中 | 本文件 §4.5 / §8 明示 D3 syntax check 對 Drive preview URL pass；preview risk 屬獨立面向 | n/a（docs-only） |
| R11.7 | privacy leak from form responses（registry / fixture / rule 意外讀取 respondent data / token / OAuth secret） | 🔴 高（R1 紅線） | 本文件 §6.7 明示 R1 紅線；F / A 系列**任一** rule **不得**讀取 / 引用 / 推導 / 暴露 respondent data | ❌ 永不允許 |
| R11.8 | Admin Apply accidentally enabled | 🔴 高 | phase prompt 明示「不可啟用 Admin Apply」；本 phase 無 Admin 變動；admin-2-write-pre-analysis.md allowed write scope 不擴張 | ❌ 不允許 |
| R11.9 | build / deploy accidentally triggered（`npm run build:*` / gh-pages push） | 🔴 高 | phase prompt 明示「不可 build / deploy」；本 phase 僅 docs commit + push origin/main；無 dist 變動 | ❌ 不允許 |
| R11.10 | reverse UTM accidentally activated / pm-26 deploy gate unblocked | 🔴 高 | 兩 gate 與 download validation remaining rules 完全解耦；本 phase 不觸及 reverse UTM source / Blogger 後台 / GA4 | ❌ 不允許 |
| R11.11 | middleware write route accidentally added / admin-write-cli executed | 🔴 高 | 兩 surface 與 download validation 完全解耦；本 phase 不觸及 middleware source / cli script | ❌ 不允許 |
| R11.12 | fixture file accidentally created / promoted（draft → ready） | 🔴 高 | phase prompt 明示「不可新增 fixture」/「不可 promote draft fixture」；commit pre-check 限為單一 docs 檔 | ❌ 不允許 |
| R11.13 | settings 兩 registry JSON 意外被修改（empty shape 被填值） | 🔴 高 | phase prompt 明示「不可修改 settings」；commit 須驗 `content/settings/download-assets.json` / `download-forms.json` 兩檔 git status 為 unchanged | ❌ 不允許 |
| R11.14 | docs cross-reference drift（既有 night-7 / am-11 / night-5 等 docs 之 §／commit hash 引用錯誤） | 🟡 中 | 本文件引用既有 docs 之 § 須對齊原檔；不重新編號；不誤標 commit hash | n/a（docs-only；本身為輸入） |

---

## 12. Future Source Phase Candidates

下列為 6/1 起若 user 明示授權之候選 phase name（**僅命名提示；不含完整 prompt；不在本文件啟動**）；**本 phase NOT authorized 啟動任一**：

### 12.1 Future source phase candidates

- `20260601-am-3-download-validation-d3-source-implementation-a`（**NOT authorized**；本 candidate 已 landed 為 D3 既有實作之 reference；若要擴張 D 系列須走獨立 docs-only 裁決後再啟動 source）
- `20260601-am-3-download-seo-noindex-rule-preanalysis-docs-only-a`（**NOT authorized**；S 系列擴張之 docs-only preanalysis）
- `20260601-am-3-download-form-asset-validation-preanalysis-docs-only-a`（**NOT authorized**；F / A schema-only rules 之 docs-only preanalysis）

### 12.2 啟動條件 / acceptance gates（per candidate）

任一 candidate 之啟動須滿足下列 acceptance gates：

- ✅ **user explicit approval**（明示 phase name 與 scope）。
- ✅ **baseline 仍為本文件之 commit 之延伸**（HEAD 包含本文件 commit）。
- ✅ **Exact source file scope**：
  - docs-only candidates：唯一變動為單一 docs 檔新增；無 source / settings / content / fixture / build。
  - source candidates：唯一 source 變動範圍須在獨立 preanalysis 內 frozen；不夾帶 docs / settings / content / fixture / build。
- ✅ **Exact fixture scope**：
  - docs-only candidates：無 fixture。
  - source candidates：fixture 須在獨立 preanalysis 內 frozen；mirror Option B（source + fixture 同 PR）。
- ✅ **Validate baseline expected change**：
  - docs-only candidates：預期不變。
  - source candidates：預期 +N warnings / +N posts；N 須在 preanalysis 內估算；commit 前後須 byte-equal 對比實際 N。
- ✅ **No build / deploy**：不 `npm run build:*`；不 push gh-pages。
- ✅ **No settings / content mutation unless explicitly approved**：
  - 兩 registry JSON 之內容變動須走獨立 phase + user explicit approval。
  - 任何 `content/{site}/posts/**` 之變動須走獨立 migration phase + 逐篇 explicit approval。
- ✅ **Read-only acceptance cross-check after commit**：mirror am-3 / am-5 / am-7 cadence；不 commit；驗 source diff + validate baseline + git 狀態。

### 12.3 為何任一 candidate 不在本 phase 啟動

- phase prompt 明示「不可開始 validate-content source implementation」/「不可開始 download loader source implementation」/「不可開始 validator-via-registry / Admin picker / renderer / content migration implementation」。
- mirror `CLAUDE.md` §27 之 Claude Code 修改規則：須先說明 + user 明示授權方可實作。
- mirror night-3 next-work roadmap（`f137457`）§11 之 entry point 命名提示：未來 phase 須由 user explicit instruction 啟動。

---

## 13. Non-goals / Red Lines

本文件**明確不**授權下列任一動作：

| 項目 | 授權狀態 |
|---|---|
| validate-content source implementation（任何 `src/scripts/validate-content.js` 變動） | ❌ 不授權 |
| 其他 `src/**` 變動（包括 `src/scripts/load-settings.js` / `src/scripts/build-github.js` / `src/scripts/build-blogger.js` / `src/views/**` 等） | ❌ 不授權 |
| settings 變動（`content/settings/download-assets.json` / `download-forms.json` 內容變更；其他 settings 變更） | ❌ 不授權 |
| content migration（任何 `content/{site}/posts/**.md` / `content/drafts/**` / `content/archive/**` 變動） | ❌ 不授權 |
| fixture creation（任何 `content/validation-fixtures/**` 新增） | ❌ 不授權 |
| fixture promotion（draft → ready / published） | ❌ 不授權 |
| build（`npm run build:*` / `npm run dev`） | ❌ 不授權 |
| deploy（gh-pages push / `dist/` 變動） | ❌ 不授權 |
| Blogger repost（後台貼 HTML） | ❌ 不授權 |
| GA4 validation（Realtime / DebugView 操作） | ❌ 不授權 |
| reverse UTM activation（pm-24a / b / c live 切換） | ❌ 不授權 |
| pm-26 deploy gate unblock | ❌ 不授權 |
| Admin Apply enable | ❌ 不授權 |
| middleware write route 新建 | ❌ 不授權 |
| admin-write-cli dry-run / apply 執行 | ❌ 不授權 |
| renderer 輸出變動（dist / dist-blogger / dist-promotion / dist-reports） | ❌ 不授權 |
| download loader source implementation | ❌ 不授權 |
| validator-via-registry rule 實作（A1 / A2 / A3 / F1 / F2 / unknown-field / duplicate-id / ref-not-found / inactive / preview-risk-via-registry / notes-token-like-pattern 等任一） | ❌ 不授權 |
| npm install / package.json / package-lock.json / vite.config.js 變動 | ❌ 不授權 |
| amend / rebase / reset / stash / force-push / `--no-verify` / `--no-gpg-sign` | ❌ 不授權 |

### 13.1 R1 / R2 / R3 紅線

- **R1**（per `CLAUDE.md` §3.2 + `docs/20260531-download-asset-form-settings-registry-schema-decision.md` §8 + pm-20 §4 R1）：registry 永不含 respondent data / token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID；本文件亦不授權任何違反 R1 之動作。
- **R2**（per pm-20 §4 R2）：`download.fileUrl` 與 Google Form URL 不可混淆；本文件不主動 migration；A / B+C 共存合法。
- **R3**（per pm-20 §4 R3）：landing page 之 noindex 沿用既有 `seo.indexing` + build-github / build-sitemap pipeline；本文件不變動 SEO pipeline。

---

## 14. Suggested Next Session Entry Points

下列為 6/1 起若 user 明示授權之候選 phase name；**均須 user explicit instruction**：

- `20260601-am-3-download-validation-remaining-rules-acceptance-crosscheck-readonly-a`（本文件之 read-only acceptance cross-check；驗本文件內部一致性 + 與既有 docs cadence 對齊 + 驗 baseline 不變）
- `20260601-am-3-download-validation-d3-source-preflight-readonly-a`（若要進入 D 系列擴張之 source 路徑，須先有 preflight read-only context review；不 commit；不改檔）
- `20260601-am-3-download-validation-d3-source-implementation-a`（若 preflight 通過且 user explicit approval，可啟動 D 衍生 candidate 之 source + fixture phase；mirror Option B）

三 phase 均**須**由 user 明示啟動；本文件**不**自動啟動任一 phase；mirror `CLAUDE.md` §27 之 Claude Code 修改規則。

---

## 15. Final Recommendation

### 15.1 推薦

**Final Idle Freeze / EXIT after this phase commit + push.**

理由：

1. 本 phase 已為 download validation remaining rules cadence 提供完整設計輸入；無 in-flight 待落地之 source / content / settings change。
2. 所有 consumer（D 衍生 / S 衍生 / F / A / preview-url-risk / loader / validator-via-registry / Admin picker / renderer / content migration）保持 dormant；無被動到期事項；無時間壓力。
3. 本 phase commit 完成後新 cold-start baseline 為本 phase 之 commit hash；下次 session 可直接讀本文件 + night-5 loader preanalysis + night-3 next-work roadmap 作三入口。
4. user 對 6/1 起之具體計畫尚未明示；在無明示前不啟動任何下游 phase 為**最低風險**選擇。
5. 對齊 `CLAUDE.md` §1 / §29 / §30 之「**不過度工程化**」原則。

### 15.2 下一個最安全步驟

**read-only acceptance cross-check of this new commit**（mirror am-3 / am-5 / am-7 cadence）：

- 性質：read-only；不 commit；不改任何檔。
- 範圍：驗本文件之內部一致性 + 與既有 docs（night-5 loader preanalysis / night-3 roadmap / night-7 preview-url-risk policy / am-11 relative-path decision / am-9 D3-S1-S2 decision）cadence 對齊 + 驗 baseline 不變。
- 啟動條件：user explicit approval。
- 此為**比立即進入 source implementation 更保守之選項**。

### 15.3 不推薦立即執行

- ❌ **不推薦**立即進入任一 source implementation phase（D 衍生 / S 衍生 / F / A schema-only / registry-aware；須先有 docs-only 裁決 + preflight readonly）。
- ❌ **不推薦**立即進入任何 validator-via-registry / Admin picker / renderer / content migration source phase（屬更下游；須先有 loader landed）。
- ❌ **不推薦**立即進入 deploy / Blogger repost / GA4 validation（屬 P8；pm-26 deploy gate 仍 BLOCKED）。
- ❌ **不推薦**立即進入 reverse UTM activation / pm-26 unblock（屬獨立 fixture publish-readiness track）。
- ❌ **不推薦**立即進入 Admin Apply enable / middleware write route 新建 / admin-write-cli execution（屬獨立 Admin write track）。

---

## Cross-references

- `docs/20260601-download-loader-preanalysis.md`（night-5 download loader preanalysis；landed `27ef9e4`）
- `docs/20260601-next-work-roadmap-preanalysis.md`（night-3 next-work roadmap；landed `f137457`）
- `docs/20260531-end-of-day-report.md`（2026-05-31 EOD checkpoint；landed `b028eae`）
- `docs/20260530-download-validation-d3-s1-s2-decision-preanalysis.md`（am-9 D3 / S1 / S2 decision；landed pre-am-13）
- `docs/20260530-download-validation-fileurl-relative-path-decision-preanalysis.md`（am-11 relative path Option D 裁決）
- `docs/20260530-download-validation-s1-s2-merge-decision.md`（S1 / S2 merge 裁決；Option Beta）
- `docs/20260530-download-fileurl-preview-url-risk-policy.md`（night-7 preview-url-risk docs-only policy）
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`（am-4 registry schema decision）
- `docs/20260531-download-asset-form-registry-json-preanalysis.md`（am-6 registry JSON preanalysis）
- `docs/20260531-download-empty-registry-implementation-plan.md`（am-8 implementation plan）
- `docs/20260530-download-validation-rules-preanalysis.md`（am-1 D / S / F / A 規則初稿）
- `docs/related-links-schema.md`（relatedLinks / otherLinks metadata schema）
- `docs/admin-2-write-pre-analysis.md`（Admin-2 write surface + safety plan）
- `docs/reverse-utm-fixture-plan.md`（reverse UTM fixture 設計原則 / 類型 / 啟動條件）
- `docs/README.md`（docs 入口）
- `CLAUDE.md` §3.2（settings 集中管理 + download empty registry governance）
- `CLAUDE.md` §13（教具下載文章規則）
- `CLAUDE.md` §27（Claude Code 修改規則）
- `CLAUDE.md` §29 / §30（第一版不做清單 / 專案最終樣貌）

---

End of preanalysis.
