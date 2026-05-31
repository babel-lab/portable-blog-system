# 2026-06-01 Next Work Roadmap Preanalysis

> Phase: `20260531-night-3-next-work-roadmap-preanalysis-docs-only-a`
> Date: 2026-05-31（post-EOD；於 night-2 EXIT 後之 cold-start session 落地）
> Scope: **docs-only**（單檔新增；無 source / content / settings / templates / fixture / package / dist / gh-pages / `.cache` / `CLAUDE.md` / 既有 docs 變更）
> Baseline: HEAD = origin/main = `b028eae29fa60956b557f44fd21cf24d38b60f2a`
> validate:content baseline: **0 errors / 47 warnings / 42 posts**

---

## 1. Executive Summary

- 本文件為 **docs-only next-work roadmap preanalysis**：在 2026-05-31 EOD（`b028eae`）與 night-2 EXIT 之後，盤點 2026-06-01 起可銜接之候選工作方向，並推薦下一個最保守入口。
- 本文件**不**啟動任何 implementation：
  - ❌ 不改 source / content / settings / templates / fixture / package
  - ❌ 不 build / deploy / Blogger repost / GA4 validation
  - ❌ 不啟用 Admin Apply / middleware write / admin-write-cli dry-run / apply
  - ❌ 不解除 reverse UTM dormant；不解除 pm-26 deploy gate
  - ❌ 不新增 fixture；不 promote draft fixture
  - ❌ 不啟動 download loader / validator-via-registry / Admin picker / renderer / content migration
  - ❌ 不啟動 sourceKey Admin selector / source-inactive warning source implementation
  - ❌ 不 amend / rebase / reset / stash / force-push
- 2026-05-31 收盤於 `b028eae`（`docs(operations): add 2026-05-31 end-of-day report`）；working tree clean；ahead/behind = 0/0；`npm run validate:content` = **0 errors / 47 warnings / 42 posts**。
- **本文件不授權任何 implementation**；唯一變更為新增本 docs 檔。所有候選方向之啟動皆需 user explicit approval。
- 預期 commit 完成後 production state drift = 0；validate baseline 維持不變。

### 1.1 一句話裁決

> **建議 2026-06-01 起繼續維持 Final Idle Freeze；若 user 主動指示展開下一步，僅推薦 docs-only preanalysis 三選一（download loader / download validation remaining rules / sourceKey Admin selector），不推薦任何 source / settings / fixture / build / deploy / Blogger / GA4 / Admin Apply / middleware / admin-write-cli 動作。**

---

## 2. Frozen Baseline

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD（本 phase 啟動時） | `b028eae29fa60956b557f44fd21cf24d38b60f2a` |
| origin/main（本 phase 啟動時） | `b028eae29fa60956b557f44fd21cf24d38b60f2a` |
| short | `b028eae` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| validate:content | **0 errors / 47 warnings / 42 posts** |
| latest commit subject | `docs(operations): add 2026-05-31 end-of-day report` |

### 2.1 Governance dormancy snapshot

| Gate / Surface | 狀態 |
|---|---|
| Reverse UTM source（pm-24a / b / c at `7e1d356` / `e2309e9` / `7c769fe`） | ✅ landed origin/main（2026-05-23） |
| Reverse UTM live | ❄ **dormant**（未 deploy；Blogger 後台未重貼；GA4 Realtime validation 未啟動） |
| pm-26 deploy gate | ❄ **BLOCKED**（positive fixture 仍 `status: draft`；publish-readiness 未達成） |
| Positive GitHub cross-link fixture（phonics） | ❄ draft（`ee263eb`；`status: draft` / `draft: true`） |
| Download empty registry（`content/settings/download-assets.json` + `content/settings/download-forms.json`） | ✅ landed at `466e471`；shape = empty `{ schemaVersion: 1, updatedAt: "", assets|forms: [], notes: "" }` |
| Download loader source | ❄ **dormant**（`src/scripts/load-settings.js` 未串接） |
| Download validator-via-registry rules | ❄ **dormant**（unknown-field / duplicate-id / ref-not-found / inactive / preview-risk-via-registry 全未實作） |
| Download Admin picker | ❄ **dormant** |
| Download landing page renderer | ❄ **dormant** |
| Download content migration（`fileUrl` → `assetRefs[]` / `formRef`） | ❄ **dormant**（既有 fileUrl post 未遷移） |
| `source-inactive` warning rule | ❄ **dormant**（8 active sources 全綠；rule logic 本身未實作） |
| sourceKey Admin selector | ❄ **dormant** |
| Admin Apply enable flag | ❄ **disabled / dormant** |
| Middleware write route | ❄ **absent**（無 route handler；無 server-side write） |
| admin-write-cli dry-run / apply | ❄ **dormant** |

### 2.2 EOD `b028eae` 之 commit timeline 摘要（per `docs/20260531-end-of-day-report.md` §3）

2026-05-31 全日 push origin/main 共 8 commits（含 pm-12 EOD report）：

```text
8709d0b → b6f5c59 → ae14476 → 7aa0342 → 466e471 → d313bbe → c266f34 → b028eae
```

統計：
- docs-only：7
- settings landing chore：1（`466e471`；empty registry 兩檔；無 functional consumer）
- source / content / template / validator rule / Admin selector / middleware / admin-write-cli commits：**0**
- build / deploy / Blogger repost / GA4 validation：**0**
- npm install / npm build / npm preview：**0**

---

## 3. Candidate A — Final Idle Freeze / EXIT

### 3.1 Purpose

維持 2026-05-31 EOD 之 frozen baseline；不啟動任何下一階段；待 user 明示授權方推進。

### 3.2 Scope

- ❌ 無 source 變動
- ❌ 無 settings 變動
- ❌ 無 docs 變動（本 phase 之單檔已於本 commit 落地後即停止）
- ❌ 無 build / deploy / Blogger repost / GA4
- ❌ 無 Admin Apply / middleware / admin-write-cli
- ❌ 無 fixture / content migration / reverse UTM activation / pm-26 unblock

### 3.3 Risk

- 風險：🟢 **最低**。
- 維持 EOD 收束狀態；不引入任何 baseline drift；不觸發任何 dormant consumer；不影響 production。

### 3.4 When to choose

- 當下 cold-start 後若 user 無明示啟動指令 → **預設選擇此候選**。
- 若 user 對 6/1 起之下一步無立即計畫 / 仍在規劃 → 此候選為**安全停留點**。
- 若 user 計畫進入較高風險工作（如 reverse UTM activation / pm-26 unblock / Admin Apply enable）→ 應**先**停留於此狀態，等待完整 preanalysis chain landed 後再行動。

### 3.5 Why this remains the default

- EOD `b028eae` 之收束已涵蓋 download empty registry + sourceKey baseline sync 兩條主線；無 in-flight 待落地之 source / content / settings change。
- 所有 dormant gates 在 EOD 時已明示 frozen；無被動到期事項。
- validate baseline 穩定於 `0 / 47 / 42`；無 baseline drift 待修。
- 對齊本系統「**不過度工程化**」原則（per `CLAUDE.md` §1 / §29 / §30）。

---

## 4. Candidate B — Download Loader Preanalysis Docs-only

### 4.1 Purpose

為未來 download loader source phase **規劃 loader 與 registry lookup 行為**；**僅 docs-only**；不實作 loader；不串接既有 source。

### 4.2 Expected scope

- ✅ 新增單一 docs 檔（建議命名 `docs/20260601-download-loader-preanalysis.md`）。
- ❌ 不改 `src/scripts/load-settings.js` / `src/scripts/validate-content.js` / `src/scripts/build-github.js` / `src/scripts/build-blogger.js` 任一行。
- ❌ 不新建 `src/scripts/load-download-registry.js`。
- ❌ 不改 `content/settings/download-assets.json` / `content/settings/download-forms.json`（兩檔保持 empty registry 落地狀態）。
- ❌ 不新增 fixture；不 promote draft fixture。
- ❌ 不 build / deploy；不影響 validate baseline。

### 4.3 Explicit exclusions

| 項目 | 是否允許 | 備註 |
|---|---|---|
| 修改 source | ❌ | 包括擴張既有 loader / 新建 loader |
| 修改 settings | ❌ | 兩 registry 已 landed；本 phase 不再改其內容 |
| 修改 content posts | ❌ | 既有 `download.fileUrl` post 保持 grandfather |
| 新建 fixture | ❌ | 本 phase 不規劃 fixture 命名 / 形狀；屬未來獨立 phase |
| 啟用 Admin picker | ❌ | Admin Apply 仍 dormant |
| build / deploy | ❌ | dormant |

### 4.4 Open questions（待 docs-only 階段裁決）

| # | 問題 | 設計輸入 |
|---|---|---|
| Q4.1 | **fail-closed behavior**：loader 對 parse error 應 throw with file path + parse error？或 silent fallback？對 missing-file 應 silent fallback `{ schemaVersion: 0, assets|forms: [] }`？ | per `docs/20260531-download-empty-registry-implementation-plan.md` §3.3 / am-6 §7.1：missing 採 silent fallback；parse error 採 fail-closed。需 docs 化此 contract |
| Q4.2 | **missing registry entry behavior**：post 引用之 ref id 在 registry 中找不到 → validator 應 warn 或 error？severity 為何？warning code 名為何（如 `download-asset-ref-not-found`）？ | per am-6 §7.4 / §8.1：by-demand ref lookup 才 warn；mirror 既有 D / S 之 by-post pattern |
| Q4.3 | **assetRefs[] 與 formRef 關係**：兩欄位在 post frontmatter 是 array vs single？是否互斥？是否 bundle 規則（assetRefs[] + formRef 同時存在）需 cross-check？ | per am-2 §9 / am-4 §6：assetRefs[] 為 array；formRef 為 single；不互斥；bundle consistency 屬未來獨立 rule |
| Q4.4 | **old `download.fileUrl` compatibility**：grandfather post 之 fileUrl 是否需 migration？或 A（fileUrl）與 B+C（assetRefs[] / formRef）共存？validator 是否在共存時 warn？ | per am-4 §9.3 / am-6 §15：grandfather；不主動 migration；A / B+C 共存合法；migration 屬 P7 |
| Q4.5 | **validation independence**：在 loader 尚未實作前，既有 D1 / D2 / D3 / S validator 是否需先獨立保持有效？或須等 loader 落地後一併重做？ | per am-13 / night-5 / night-7：既有 validator frozen；不退化；loader 與既有 validator 互不影響 |
| Q4.6 | **schemaVersion bump policy**：未來若 schema 變更，bump 條件為何？loader 是否需支援多版本共存？ | per am-4 §4.2 + am-6 §5.2：schemaVersion 必填；初版 1；bump 為 breaking change；loader 多版本支援屬未來獨立 phase |

### 4.5 Validate baseline expectation

- 本 docs-only phase 預期 validate baseline 維持 `0 / 47 / 42`（單檔 docs；不影響 validate pipeline）。
- 未來 loader source phase 之 baseline 影響須**先於該 source phase 之 preanalysis** 估算；本 phase 不做估算。

---

## 5. Candidate C — Download Validation Remaining Rules Preanalysis Docs-only

### 5.1 Purpose

為未來 download validation 補完之 source phase **規劃尚未實作之 rules**；**僅 docs-only**；不寫 validator rule；不新增 fixture。

### 5.2 Coverage（**僅 docs-only 規劃；不啟動**）

| 群 | 規則範圍 | 當前狀態 |
|---|---|---|
| **D3 / 既有 D 系列衍生** | 既有 D1 / D2 / D3（per am-13 / night-5）frozen；本 phase 規劃「是否需新增 D4 / D5 / D6 等 format-related rules」 | 既有 frozen；新規 dormant |
| **S1 / S2 noindex / SEO 行為** | 既有 S1 / S2（per am-7 / night-5）frozen；本 phase 規劃「是否需擴張至 landing page level」 | 既有 frozen；新規 dormant |
| **F1 / F2 form-related** | FormConfig registry 落地後之 form ref validation rules（如 `download-form-ref-not-found` / `form-inactive` / `gated-form-required`） | 全 dormant（無 source；無 fixture） |
| **A1 / A2 / A3 asset-related** | DownloadAsset registry 落地後之 asset ref validation rules（如 `download-asset-ref-not-found` / `asset-inactive` / `bundle-consistency` / `unknown-field` / `duplicate-id`） | 全 dormant |
| **preview-url-risk policy** | per `docs/20260530-download-fileurl-preview-url-risk-policy.md` §F：升級條件之第一條（DownloadAsset registry schema docs-accepted）已達成（per am-4 / am-6）；後續 policy 升級至 registry-based 之路徑 | docs 已落地；source 仍 frozen 於 raw URL regex policy 階段 |
| **fixture inventory needs** | 規劃未來 source phase 所需之 negative fixture（duplicate id / forbidden field / missing required field / unknown field / inactive / preview-risk）之命名與形狀 | dormant；本 phase 不建立 fixture |

### 5.3 Open questions（待 docs-only 階段裁決）

| # | 問題 |
|---|---|
| Q5.1 | 各 rule 之 severity 應為 error / warning / info？預期觸發 baseline 之 warning +N？|
| Q5.2 | rule 命名 convention 是否沿用既有 `download-*` / `seo-*` prefix？或新增 `download-asset-*` / `download-form-*` 子 prefix？|
| Q5.3 | 對既有 fileUrl post 之既有 D 系列 warning 是否衝突？是否需 dedupe？|
| Q5.4 | fixture 命名是否沿用 `_test-download-*` prefix？或新增 `_test-download-asset-*` / `_test-download-form-*`？|
| Q5.5 | preview-url-risk 升級至 registry-based 後，原 raw URL regex 政策是否 deprecate？或共存？|

### 5.4 Validate baseline expectation

- 本 docs-only phase 預期 baseline `0 / 47 / 42` 不變。
- 未來 source phase 之 baseline 影響須**在 source phase 之 preanalysis** 估算；本 phase 不估算具體 +N warning 數。

### 5.5 Why this remains independent of Candidate B

- Loader（B）與 validator rules（C）可獨立 docs-only 規劃；兩 docs 不互相阻擋；但**未來 source phase** 之啟動順序須遵守 am-2 §11 之 P3 → P4 → P5 cadence（loader 在前；validator rules 在後）。
- 兩 docs 可獨立落地；若 user 對某一方向有更明確之需求，可單獨啟動其一。

---

## 6. Candidate D — sourceKey Admin Selector Preanalysis Docs-only

### 6.1 Purpose

為未來 sourceKey Admin selector UI **做 docs-only preanalysis**；不實作 UI；不啟用 Admin Apply；不新增 source-inactive warning rule source。

### 6.2 Coverage

| 主題 | 範圍 |
|---|---|
| **Admin selector UI concept** | 規劃 Admin（dev-mode-only / read-only）顯示 sourceKey picker 之 mock；不啟用 write |
| **active / inactive source behavior** | 規劃 `content/settings/link-sources.json` 中 8 個 sources 之 active flag 對 picker 之影響（如：inactive source 顯示灰底 / 不允許選） |
| **source-inactive warning rule** | 規劃 validator rule 之 logic（如：post 引用 inactive sourceKey → warn `source-inactive`）；當下 8 sources 全 active 使得無實際 warning |
| **current sourceKey renderer / GA4 baseline** | 既有 sourceKey templates / post-detail renderer / blogger-post-full renderer / GA4 `link_source_key` data attribute 全 landed；本 phase 不變動 |
| **Admin Apply 之邊界** | 本 phase **不**啟用 Admin Apply；selector 為 read-only viewer；不寫入 .md frontmatter |

### 6.3 Why this must not enable Admin Apply

- Admin Apply 涉及 .md frontmatter 真實寫入；屬 admin-2-b-2 範疇（per `docs/admin-2-write-pre-analysis.md` §7.2）。
- 真實寫入須走 middleware write route 或 admin-write-cli；當下兩者全 dormant。
- 開啟 Admin Apply 將觸發整個 SEO write / FB sidecar write / sidecar atomic write 之 cascade；不可在 sourceKey selector 單一範疇內啟用。
- 本 phase **僅 docs**；不變更 admin-2-write-pre-analysis.md 之 allowed write scope；不擴張第 5 個 SEO write target。

### 6.4 Open questions

| # | 問題 |
|---|---|
| Q6.1 | selector UI 應顯示哪些 metadata（sourceKey id / displayName / status / activatedDate / lastUsed）？|
| Q6.2 | inactive source 之顯示策略（隱藏 / 灰底 / warn icon）？|
| Q6.3 | post-side 之 sourceKey reference 形態（已 landed 為單 string；不變動）|
| Q6.4 | source-inactive warning rule 之 severity / warning code 名 / fixture 規劃？|

### 6.5 Validate baseline expectation

- 本 docs-only phase 預期 baseline `0 / 47 / 42` 不變。
- source-inactive rule 未來若 source 落地：當下 8 sources 全 active → 預期 baseline 仍 `0 / 47 / 42`；若未來某 source 變 inactive 且 post 引用 → 預期 baseline 增加 warning。

---

## 7. Candidate E — Reverse UTM / pm-26 Gate Review Read-only

### 7.1 Purpose

對 reverse UTM dormant 狀態與 pm-26 deploy gate 之 BLOCKED 狀態做**純 read-only review**；**不**新增 docs；**不**改任何檔；**不**觸發任何 deploy / Blogger repost / GA4。

### 7.2 Review surface

| 項目 | 狀態 |
|---|---|
| Reverse UTM source（pm-24a / b / c） | ✅ landed at `7e1d356` / `e2309e9` / `7c769fe`（2026-05-23） |
| Reverse UTM live | ❄ **dormant**（未 deploy；Blogger 後台未重貼） |
| pm-26 deploy gate | ❄ **BLOCKED**（per `docs/reverse-utm-fixture-plan.md` §6） |
| Positive fixture（phonics） | ❄ `status: draft` / `draft: true`（不會出現在 dist；不會出現在線上） |
| Blogger repost | ❄ **not started** |
| GA4 Realtime validation | ❄ **not started** |

### 7.3 Why no deploy / Blogger repost / GA4 should happen without explicit phase

- pm-26 啟動條件詳見 `docs/reverse-utm-fixture-plan.md` §6；fixture 必須符合 §3 設計原則與 §4 fixture 類型。
- 當下 fixture 仍 `status: draft`；publish-readiness 未達成。
- 任何 deploy / Blogger repost / GA4 validation 須由 user 明示授權之新 phase（如 `20260601-am-X-reverse-utm-deploy-readiness-...`）啟動；本文件**不**授權啟動。
- 在 fixture 未達 ready / build / deploy gate 解除前，禁止：
  - `npm run build:github` / `npm run build:blogger` 之 dist 變動觸發
  - gh-pages 推送
  - Blogger 後台重貼
  - GA4 Realtime / DebugView 操作
  - reverse UTM live 切換

### 7.4 Recommendation for Candidate E

- 推薦在啟動任何 reverse UTM-related implementation 前，先**讀**：
  - `docs/reverse-utm-fixture-plan.md` §3 / §4 / §6 / §10.4
  - `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md` §H
  - `docs/20260526-reverse-utm-positive-fixture-scan-report.md` §7
  - `docs/20260529-reverse-utm-download-fileurl-decision-preanalysis.md`
- 讀完後須另開獨立 docs-only preanalysis；不在本文件範疇內。

### 7.5 Validate baseline expectation

- 本 candidate **不**改任何檔；validate baseline 維持 `0 / 47 / 42`。

---

## 8. Candidate F — Admin Write Path Review Docs-only

### 8.1 Purpose

對 Admin write path（Admin Apply / middleware write / admin-write-cli）之 dormant 狀態做**docs-only review**；**不**啟用任何 write；**不**新增 allowed write scope。

### 8.2 Surface inventory

| 項目 | 狀態 |
|---|---|
| Admin Apply enable flag | ❄ **disabled / dormant** |
| Middleware write route（server-side） | ❄ **absent**（無 route handler；無 fs.writeFile 路徑） |
| admin-write-cli | ❄ **dormant**（5/28 之 4 個 gated SEO writes 落地後 frozen；無新 write target） |
| safe-write governance（atomic write / dry-run / pre-write validate / post-write validate） | ✅ design landed（per `docs/admin-2-write-pre-analysis.md` §7）；無 implementation execution |
| Real write today | ❄ **none** |

### 8.3 Why no real write authorized

- per `docs/admin-2-write-pre-analysis.md` §1.2：Admin-2 之非目標明示「不做 settings JSON 編輯 / 不做 publishedUrl 寫入 UI / 不做 git commit 自動化」。
- per `CLAUDE.md` §29：Admin 屬第二階段；第一版不主動實作 Admin Apply / 真正後台。
- per `docs/20260531-end-of-day-report.md` §7：Admin Apply / middleware / admin-write-cli 全 dormant；本日無 real-write 動作。
- 啟用任何 write path 須走 4-step safety chain（atomic write + dry-run + pre-write validate + post-write validate）+ user explicit approval per write target；本文件**不**授權任一步。

### 8.4 If user wants to expand Admin write scope

- 建議**先**讀：
  - `docs/admin-2-write-pre-analysis.md` §1 / §7 / §11
  - `docs/admin-mvp-pre-analysis.md`
  - `docs/admin-local-boundary-pre-analysis.md`
  - `docs/fb-sidecar-write-preflight-decision.md` §7
- 讀完後須另開獨立 docs-only preanalysis；不在本文件範疇內。

### 8.5 Validate baseline expectation

- 本 candidate **不**改任何檔；validate baseline 維持 `0 / 47 / 42`。

---

## 9. Recommended Priority

依保守程度排序（最保守在前；激進在後）：

| 排序 | 候選 | 性質 | 風險 | 啟動建議 |
|---|---|---|---|---|
| 1 | **Final Idle Freeze / EXIT** | 不啟動任何 | 🟢 最低 | **預設**；user 無明示指令即停留 |
| 2 | Download loader preanalysis docs-only | 新增單一 docs 檔 | 🟢 低 | 須 user 明示「啟動 download loader preanalysis」 |
| 3 | Download validation remaining rules preanalysis docs-only | 新增單一 docs 檔 | 🟢 低 | 須 user 明示「啟動 download validation remaining rules preanalysis」 |
| 4 | sourceKey Admin selector preanalysis docs-only | 新增單一 docs 檔 | 🟢 低 | 須 user 明示「啟動 sourceKey Admin selector preanalysis」 |
| 5 | Reverse UTM / pm-26 gate review read-only | 不改檔；純 read | 🟢 低 | 須 user 明示「啟動 reverse UTM / pm-26 review」；不可立即接 deploy |
| 6 | Admin write path review docs-only | 不改檔 / 新增單一 docs 檔 | 🟢 低 | 須 user 明示「啟動 Admin write path review」 |

### 9.1 為何如此排序

- 排序 1（Final Idle Freeze）對齊 `CLAUDE.md` §29 / §30 之「不過度工程化」原則；EOD 收束後預設無待辦事項。
- 排序 2-4（三 docs-only preanalysis）為對等 docs-only 工作；風險相同；推薦順序依「對未來 source / Admin source phase 之上游性」決定：loader 在 validator rules 之前（per am-2 §11）；validator rules 在 Admin selector 之前（per am-2 §11 之 P3-P5 cadence）。
- 排序 5-6（read-only / docs-only review）較少對未來 source 之鋪墊；屬獨立小批盤點。

### 9.2 不在排序內之**不推薦**項目

- ❌ 任何 source / settings / fixture / build / deploy / Blogger / GA4 implementation
- ❌ Admin Apply enable
- ❌ Middleware write route 新建
- ❌ admin-write-cli dry-run / apply
- ❌ Reverse UTM activation
- ❌ pm-26 deploy gate unblock
- ❌ download loader source / download validator source / download Admin picker source / download renderer source / download content migration

---

## 10. Non-goals / Red Lines

本 roadmap **明確不**授權下列任一動作：

| 項目 | 授權狀態 |
|---|---|
| source implementation（任何 `src/**` 變動） | ❌ 不授權 |
| settings 變動（任何 `content/settings/*.json` 變動） | ❌ 不授權 |
| content migration（任何 `content/{site}/posts/*.md` 變動） | ❌ 不授權 |
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
| npm install / package.json 變動 | ❌ 不授權 |
| amend / rebase / reset / stash / force-push | ❌ 不授權 |

### 10.1 紅線

- **R1**（per `CLAUDE.md` §3.2 + `docs/20260531-download-asset-form-settings-registry-schema-decision.md` §8 + pm-20 §4 R1）：registry 永不含 respondent data / token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID；本 roadmap 亦不授權任何違反 R1 之動作。
- **R2**（per pm-20 §4 R2）：`download.fileUrl` 與 Google Form URL 不可混淆；本 roadmap 不主動 migration。
- **R3**（per pm-20 §4 R3）：landing page 之 noindex 沿用既有 `seo.indexing` + build-github / build-sitemap pipeline；本 roadmap 不變動 SEO pipeline。

---

## 11. Suggested Next Session Entry Points

下列為 6/1 起若 user 明示授權之候選 phase name（**僅命名提示；不含完整 prompt；不在本文件啟動**）：

- `20260601-am-1-download-loader-preanalysis-docs-only-a`
- `20260601-am-1-download-validation-remaining-rules-preanalysis-docs-only-a`
- `20260601-am-1-sourcekey-admin-selector-preanalysis-docs-only-a`

每一 phase 之啟動條件：

1. user explicit approval（明示 phase name 與 scope）
2. baseline 仍為本文件之 EOD baseline 之延伸（HEAD 包含本文件 commit）
3. scope 限為單一 docs 檔新增；不夾帶 source / settings / fixture / build
4. 完成後須有獨立 read-only acceptance cross-check（mirror am-3 / am-5 / am-7 cadence）

### 11.1 三 phase 之相對優先順序

- Download loader preanalysis：對未來 download 工作之**上游**；若 user 計畫展開 download source 工作 → **建議優先**。
- Download validation remaining rules preanalysis：對未來 download validator source 之**上游**；可與 loader preanalysis 並行（兩 docs 互不阻擋）；但 source phase 須遵守 loader 在前之 cadence。
- sourceKey Admin selector preanalysis：與 download 系列**獨立**；屬 sourceKey track；若 user 對 sourceKey 工作有更明確之需求 → 可獨立啟動。

---

## 12. Final Recommendation

### 12.1 推薦

**Final Idle Freeze / EXIT after this phase commit + push.**

理由：

1. EOD `b028eae` 已為 2026-05-31 完整收束；不留 in-flight pending work。
2. 本 phase 之 docs commit 完成後，新 cold-start baseline 為本 phase 之 commit hash；下次 session 可直接讀本文件作 roadmap 入口。
3. 所有候選方向均為 dormant；無被動到期事項；無時間壓力。
4. user 對 6/1 起之具體計畫尚未明示；在無明示前不啟動任何下游 phase 為**最低風險**選擇。
5. 對齊 `CLAUDE.md` §1 / §29 / §30 之「**不過度工程化**」原則。

### 12.2 例外條件

若 user 在本 phase commit + push 完成後**明示**啟動下一個 docs-only candidate（B / C / D / E / F 之一）：

- 應**僅**啟動該 user 明示之 candidate
- 不順便啟動其他 candidate
- 不擴張其 scope（每 candidate 僅單一 docs 檔新增 / 純 read review）
- 不在同一 phase 內混合多 candidate

### 12.3 反推薦

下列若 user 提出，須**先**請 user 確認對應之 preanalysis chain 是否已 landed：

- 直接展開 download source / validator source / Admin picker source / renderer source / content migration source → 須先 landed loader preanalysis（4）+ validation rules preanalysis（5）
- 直接 reverse UTM activation / pm-26 unblock → 須先 fixture publish-readiness（含 fixture 設計 / build 驗證 / Blogger repost 計畫 / GA4 Realtime 驗收計畫）
- 直接 Admin Apply enable → 須先擴張 admin-2-write-pre-analysis.md allowed write scope + 第 5 個 SEO write target preanalysis + safe-write 4-step chain 驗證
- 直接 middleware write route 新建 → 須先 server-side write 邊界 preanalysis + admin-local-boundary 對齊驗證

### 12.4 Out-of-scope confirmation for this phase

本 phase 之預期：

- ✅ 新增 1 檔：`docs/20260601-next-work-roadmap-preanalysis.md`
- ❌ 不修改任何既有 docs
- ❌ 不修改 `CLAUDE.md`
- ❌ 不修改 source / content / settings / templates / fixtures / package
- ❌ 不 touch `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `gh-pages` branch / `.cache`
- ❌ 不 amend / rebase / force-push
- ❌ 不啟動任何 dormant gate
- ❌ 不影響 validate baseline（保持 `0 / 47 / 42`）

完成後請 Final Idle Freeze / EXIT；不自動啟動任何下一階段。

---

## Cross-references

- `docs/20260531-end-of-day-report.md`（2026-05-31 EOD checkpoint）
- `docs/20260531-download-empty-registry-implementation-plan.md`（download empty registry P4 plan；am-8）
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`（registry schema 裁決；am-4）
- `docs/20260531-download-landing-asset-form-registry-preanalysis.md`（registry preanalysis；am-2）
- `docs/20260531-download-asset-form-registry-json-preanalysis.md`（registry JSON preanalysis；am-6）
- `docs/phase-2-candidate-roadmap.md`（Phase 2 候選工作清單）
- `docs/related-links-schema.md`（relatedLinks / otherLinks metadata schema）
- `docs/admin-2-write-pre-analysis.md`（Admin-2 write surface + safety plan）
- `docs/reverse-utm-fixture-plan.md`（reverse UTM fixture 設計原則 / 類型 / 啟動條件）
- `docs/README.md`（docs 入口）
- `CLAUDE.md`（專案規範主檔）

---

End of preanalysis.
