# 2026-06-08 Registry Seed Governance — Preanalysis (docs-only)

Phase name: `20260608-am-20-registry-seed-governance-preanalysis-docs-only-a`
Date: 2026-06-08 11:47 +0800
Mode: **docs-only registry seed governance preanalysis**（no source / no fixture / no content / no settings registry mutation / no registry seed / no templates / no renderer / no loader change / no validator rule landing / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no real affiliate link / download URL / merchant id / tracking id / token / credential / no production content migration / no `npm install` / no CLAUDE.md mutation / no MEMORY mutation）

---

## 0. Relation to prior phases

| 順序 | Phase / commit | 角色 |
| --- | --- | --- |
| night-20 `c1a6974` | commerce empty registry implementation | `commerce-links.json` empty registry |
| night-21 `78f1e9a` | commerce-links loader exposure | `settings.commerceLinks = []`；無下游 consumer |
| night-25 `94a1d47` | commerce registry-level validator landing | `validateCommerceLinkRegistry` 11 條 warning-only rule |
| am-2 `89cbf75` | commerce settings fixture mechanism decision | **fixture mechanism = Option D（skip settings-level fixtures）**；Option A path naming 保留為未來 escape hatch |
| `39b89e3` / `281cd43` | commerce content-ref source landing | `validateCommerceRefs`：C1 / C2 / C3 / C5 / C6 |
| `149efdc` / `3aeabbc` | commerce content-ref fixtures landing | 5 個 post-level fixture |
| `8c9fddf` | commerce C4 inactive ref validation preanalysis（docs-only） | C4 contract 凍結；**source blocked by registry coupling** |
| `57c983b` | commerce C8 invalid role validation source landing | `validateCommerceRefs` 新增 C8 `commerce-ref-invalid-role`（warning-only；post-side；無 registry coupling） |
| `bb33523` | commerce C8 invalid role fixture landing | `_test-commerce-ref-invalid-role.md`；baseline → 69/59 |
| `d18e21c` | download landing registry resolution（source） | `build-github.js` derived landing data（placeholder-only；registry empty → 0 觸發） |
| `145a548` / `077c3d1` | download registry-aware validation | R2 ref-not-found / R5b duplicate |
| **am-20（本 phase）** `（本 commit）` | **registry seed governance preanalysis（docs-only）** | 規劃**未來如何安全 seed / mock / govern registry entries**，以解開 C4 / C9 / download real-path 之 registry coupling blocker；**不**實作 seed；**不**改 registry；**不**新增 fixture；**不**啟動任何 source |

本階段唯一目的為：

> 在 commerce C1 / C2 / C3 / C5 / C6 / C8 source + fixtures 全部 landed and accepted、C4 docs-only plan landed but source blocked、commerce + download registries 仍 empty `[]`、production posts 0 使用 `ref` / 0 使用 `role` 之現況下，**先**對共同 blocker「**empty registry + Option D fixture lock**」做 governance preanalysis：盤點 registry 類型、比較 7 條 seed / unlock 策略、為 C4 / C9 / download real-path / Admin 各自標出最小可測 registry state 與紅線，並給安全 phase ladder。本階段**不**實作任何 seed、**不**改任何 registry、**不**新增 fixture、**不**啟動 C4 / C7 / C9 / Admin / renderer source。

---

## 1. Executive Summary

### 1.1 本輪性質宣告

> **本輪為 docs-only registry seed governance preanalysis。** 不改 registry；不 seed；不 source；不 fixture。不改 src / content / settings / templates / views / fixtures / package / lockfile / dist / gh-pages / .cache / CLAUDE.md / MEMORY。唯一輸出為本檔。

### 1.2 一句話結論

> **共同 blocker 不是「rule 寫不出來」，而是「沒有可被測試的 registry state，且不能為了測試污染 production registry 或塞入真實商業敏感資料」。建議首選路徑為「Option F（獨立 sample settings 檔，build / loader 不消費）+ docs-only 凍結 sample schema」作為未來 C4 / download real-path 之測試載體候選，但本輪只凍結方向、不建立任何 sample 檔；次選為 Option G（等 user 授權真實 entry）；明確不建議 Option B / C（直接 seed production registry）。本輪結束建議 read-only acceptance 或 Final Idle Freeze；不得直接做 C4 source、不得直接 seed production registry、不得 deploy / Blogger / GA4。**

### 1.3 推薦理由摘要

- **registry coupling 是 C4 / C9 / download real-path 之共同根因**：三者都需要「registry 內有具體 entry」才能驗證；C1 / C2 / C3 / C5 / C6 / C8 全部可在 registry empty 下測（故已 landed），但 C4（需 `active:false` entry）/ C9（需 `internalLabel` / displayLabel entry）/ download real-path（需 asset / form entry）卡死於 empty registry。
- **Option D fixture lock 與 empty registry 互相加乘**：am-2 `89cbf75` 凍結「skip settings-level fixtures」，意味目前**沒有**任何合法管道在不碰 production registry 的前提下提供 registry entry 給 validator → 任何需 entry 的 rule 之 fixture 都被鎖住。
- **既有先例指向安全解法**：`content/settings/_sample.series.json` 已示範「sample settings 檔，build 不讀取」之 Option F 模式；`link-sources.json` 已示範「benign registry 可安全 seed」（無 credential / 無 affiliate tracking）。兩者合起來說明：**可 seed 的 registry 與不可 seed 的 registry，差別在 entry 是否帶商業敏感資料**，而非 registry 機制本身。
- **不違反紅線**：本 phase 為 docs-only；不放真實 affiliate URL / token / merchant tracking id / OAuth secret / Google Form respondent data / download direct URL；不 mutate 任一 production registry；reverse UTM 與 pm-26 維持 dormant / BLOCKED。

### 1.4 本 phase 範圍

- 盤點所有 registry 類型（commerce / download asset / download form / link-sources / affiliate-networks / sample series）之 current shape、是否 production-consumed、是否 seeded。
- 釐清「relatedLinks / sourceKey registry」與「commerce / download registry」之根本差異（為何前者可 seed、後者 empty）。
- 比較 7 條 registry seed / unlock 策略（A keep-empty / B production-seed / C noindex-draft-sample-in-registry / D validation-only overlay / E mock-injection / F separate-sample-file / G user-provided-real）之 10 維度。
- 為 C4 / C9 / download real-path / Admin 各標出最小可測 registry state、紅線、是否應等 seed governance 決策。
- 給安全 phase ladder（docs acceptance → source preflight → sample registry design → source impl → fixture/smoke → Admin/renderer）。
- 預設 baseline 不變動（0 errors / 69 warnings / 59 posts）。
- 給下一階段建議；不執行下一階段。

### 1.5 本 phase 不做的事

- ❌ 不 seed 任何 registry（commerce / download asset / download form）；維持 empty `[]`。
- ❌ 不建立任何 sample settings 檔（包含 Option F 之 `_sample.*.json`）。
- ❌ 不 implement C4 / C7 / C9 source；不改 `validateCommerceRefs` / `validateDownloadRegistry`。
- ❌ 不新增任何 fixture（post-level 或 settings-level）。
- ❌ 不啟動 download landing renderer real-path / Admin picker / Admin selector。
- ❌ 不 migrate / mutate production posts；不新增 ref / role / assetRefs / formRef。
- ❌ 不 build / deploy / Blogger repost / GA4 validation / reverse UTM activation / pm-26 unblock。
- ❌ 不放任一真實 affiliate URL / download URL / merchant id / tracking id / token / credential / respondent data。
- ❌ 不改 CLAUDE.md / MEMORY / auto-memory；不改既有 docs（只新增本檔）。
- ❌ 不 `npm install`；package / lockfile 不動。

---

## 2. Current Baseline

### 2.1 git / validate baseline（本 phase 開始時）

```
repo: D:\github\blog-new\portable-blog-system
branch: main
HEAD: bb335230363feaa9a2a766587843890595a6ce2c
origin/main: bb335230363feaa9a2a766587843890595a6ce2c
ahead/behind: 0/0
working tree: clean
latest subject: test(validate): add commerce invalid role fixture
validate: 0 errors / 69 warnings / 59 posts
```

### 2.2 commerce content-reference 已 landed 範圍

- ✅ C1 `commerce-ref-invalid-type` / C2 `commerce-ref-empty` / C3 `commerce-ref-not-found` / C5 `commerce-ref-duplicate-in-post` / C6 `commerce-ref-direct-url-coexist`：source + fixture landed。
- ✅ **C8 `commerce-ref-invalid-role`：source（`57c983b`）+ fixture（`bb33523`）landed and accepted**（am-17 read-only acceptance PASS）；`_test-commerce-ref-invalid-role.md` 觸發 `commerce-ref-invalid-role: affiliate.links[0].role="Primary"`（raw-only entry，registry 維持 empty 未 seed）。
- 🔄 C4 `commerce-ref-inactive`：docs-only plan landed（`8c9fddf`）；**source blocked by empty registry + Option D fixture lock**。
- ❌ C7 `commerce-ref-missing-role`：**不建議啟用**（role optional，missing-role warning 會 noise）。
- ❌ C9 `commerce-ref-display-override-risk`：contract 有（am-7 §5），source 前需 standalone docs-only preanalysis + registry seed governance（即本檔之 §9）。

### 2.3 registry / production 現況

- `content/settings/commerce-links.json` = `{ schemaVersion:1, updatedAt:"", commerceLinks:[], notes:"" }`（empty；R1-clean）。
- `content/settings/download-assets.json` = `{ schemaVersion:1, updatedAt:"", assets:[], notes:"" }`（empty）。
- `content/settings/download-forms.json` = `{ schemaVersion:1, updatedAt:"", forms:[], notes:"" }`（empty）。
- production posts 使用 `affiliate.links[].ref` = **0 篇**；使用 `affiliate.links[].role` = **0 篇**；使用 `download.assetRefs[]` / `download.formRef` = **0 篇**。
- download landing renderer：placeholder path **smoke-verified**（pm-10）；**real registry-resolved path 未測**（registry empty，未 seed）。
- 69/59 warnings 全屬 `content/validation-fixtures/`（validator 預期樣本，非 regression）。

### 2.4 dormant / blocked rails

- commerce renderer / Admin picker / Admin selector / display：dormant。
- download landing real-path renderer / Google Forms 串接 / 下載頁：dormant（placeholder-only）。
- reverse UTM activation：dormant（pm-24 source landed; un-deployed）。
- pm-26 deploy gate：BLOCKED。
- Admin Apply / middleware write / admin-write-cli：dormant。
- build / deploy / Blogger repost / GA4 commerce / download dimension：dormant。

---

## 3. Problem Statement

### 3.1 核心問題：registry coupling

C1 / C2 / C3 / C5 / C6 / C8 之所以能 landed，是因為它們**全部可在 registry empty 下被 fixture 驗證**：

| rule | 測試方式（registry empty 下） |
| --- | --- |
| C1 invalid-type | post 帶非字串 `ref` → 觸發；不需 registry entry |
| C2 empty | post 帶空 `ref` → 觸發；不需 registry entry |
| C3 not-found | post 帶「故意不存在」`ref` → empty registry 下必 not-found；不需 entry |
| C5 duplicate | post 帶重複 `ref` → 觸發；不需 entry |
| C6 ref+url coexist | post 同帶 `ref` + `url` → 觸發；不需 entry |
| C8 invalid role | post 帶非 enum `role` → 觸發；role 為 post-side，**完全不依賴 registry** |

而 C4 / C9 / download real-path 之 trigger 條件**要求 registry 內有「對的 entry」**，empty registry 下永遠 0 觸發、0 可測：

### 3.2 empty registry + Option D fixture lock 如何阻擋 C4

- C4 `commerce-ref-inactive` trigger = `ref` 命中 registry **且**對應 entry `active === false`。
- 要驗證 C4，必須有一筆 `{ linkId:"X", active:false }` 在 registry 內 + 一個 post `ref:"X"`。
- 但 am-2 `89cbf75` 凍結 **Option D fixture lock = skip settings-level fixtures**：目前沒有任何合法管道把 registry entry 餵給 validator，除非直接改 production `commerce-links.json`（違反 R1-clean）。
- → C4 source 即使 land 也是 **dead source**（0 fixture / 0 production 觸發），且其 fixture 無路可走。此即 `8c9fddf` 將 C4 標為 blocked 的原因。

### 3.3 C9 為何也受 registry entry 影響

- C9 `commerce-ref-display-override-risk` 之語意（am-7 §5）= 偵測 post-side display override（如 `labelOverride`）是否與 registry entry 的 `internalLabel` / `displayLabel` 產生洩漏 / 衝突風險。
- 此判斷**需要 registry 內有對應 entry**（才有 internalLabel / displayLabel 可比對）→ 與 C4 同屬 registry-coupled，empty registry 下無法驗證。
- 額外：C9 contract 本身尚未完整 standalone preanalysis（am-7 僅有 §5 概述），source 前需獨立 docs-only 凍結 + 本檔之 seed governance 決策。

### 3.4 download real-path testing 為何也受 registry empty 影響

- download landing renderer 之 placeholder path 已 smoke-verified（pm-10），但 **real registry-resolved path**（`assetRefs[]` / `formRef` 命中 registry → resolve 出 asset title / form title）從未被執行過。
- 要測 real-path，需 registry 內有 `{ assetId:"X", ... }` / `{ formId:"Y", ... }` + 一個 post `download.assetRefs:["X"]` / `formRef:"Y"`。
- empty registry 下，所有 post 走 placeholder branch（pm-10 已驗），resolved branch 0 覆蓋。

### 3.5 共同點：risk 在「資料」而非「機制」

> 三個 blocker 的本質**不是** validator 邏輯難寫，而是「**沒有安全的 registry entry 來源**」：
> - 直接 seed production registry → 違反 R1-clean、引入 registry-level warning drift、且 commerce / download entry 可能攜帶商業敏感資料（affiliate tracking id / download direct URL / Google Form id）。
> - 不 seed → 永遠無法測 C4 / C9 / download real-path。
>
> 本 phase 的工作就是：在**不碰 production registry、不放敏感資料**的前提下，找出可餵給 validator / renderer 的 entry 來源策略。

---

## 4. Existing Governance / Red Lines

以下為既有紅線（per CLAUDE.md §3 commerce / download 治理段 + am-2 §12 + pm-20 §4 + `8c9fddf` §4 + `bb33523` C8 doc §7 / §11）。本 phase 之所有策略選項皆須通過下列檢核：

### 4.1 資料內容紅線

- ❌ **永不**含 credential（affiliate dashboard email / password / OAuth client secret / API key）。
- ❌ **永不**含 access token / bearer token / refresh token / session id / Authorization header。
- ❌ **永不**含 commission / payout / clickCount 等 dashboard 統計。
- ❌ **永不**含 Google Form **respondent data**（email / 姓名 / 電話 / 學校 / 答覆內容 / Sheet response rows）。
- ❌ **永不**含真實 affiliate tracking ID / merchant tracking id / 結算密碼 / 私人 Drive folder ID。
- ❌ **永不**含 download direct file URL（Google Drive / 圖床直連），避免 preview / hotlink 風險。

### 4.2 registry / fixture 操作紅線

- ❌ **不**為了 fixture 修改 production registry（`commerce-links.json` / `download-assets.json` / `download-forms.json` / `affiliate-networks.json`）；R11 fixture 須採「故意不存在 key」設計。
- ❌ **不**用 URL pattern 自動推斷 `merchantKey` / `networkKey` / `linkId` / `assetId` / `formId`；所有 key 由作者明示填寫。
- ❌ **不**把私人商業設定塞進 fixture / sample / docs。
- ❌ Google Forms responses **remain in Google Forms / Sheets**；不進 repo。

### 4.3 流程紅線

- ❌ 任何 registry seed **不**自動觸發 deploy / Blogger repost / GA4 / reverse UTM。
- ❌ **不**自動 production content migration（raw url → ref / fileUrl → assetRefs）。
- ❌ reverse UTM remains dormant；pm-26 deploy gate remains BLOCKED；Admin Apply / middleware write / admin-write-cli remain dormant。

---

## 5. Registry Types Inventory

### 5.1 各 registry current shape

| registry | 檔案 | shape | production-consumed | seeded? | validator | sensitivity |
| --- | --- | --- | --- | --- | --- | --- |
| commerce links | `content/settings/commerce-links.json` | `{schemaVersion,updatedAt,commerceLinks:[],notes}` | ✅ loader 載入並 unwrap 為 `settings.commerceLinks`（無下游 consumer） | ❌ empty `[]` | registry-level R3..R14 + content-ref C1..C8 | **高**（affiliate targetUrl / tracking 潛在）|
| download assets | `content/settings/download-assets.json` | `{schemaVersion,updatedAt,assets:[],notes}` | ✅ loader 載入 `settings.downloadAssets`（無下游 consumer） | ❌ empty `[]` | `validateDownloadRegistry` shape + duplicate + R2 ref-not-found | **高**（download direct URL 潛在）|
| download forms | `content/settings/download-forms.json` | `{schemaVersion,updatedAt,forms:[],notes}` | ✅ loader 載入 `settings.downloadForms`（無下游 consumer） | ❌ empty `[]` | `validateDownloadRegistry` shape + duplicate + R2 ref-not-found | **高**（Google Form id / respondent boundary）|
| link sources | `content/settings/link-sources.json` | `{version,description,sources:[...8 entries]}` | ✅ renderer / GA4 consumer（sourceKey）| ✅ **seeded（8 entries）** | （sourceKey validator）| **低**（純顯示 label，無 credential / tracking）|
| affiliate networks | `content/settings/affiliate-networks.json` | network registry | ✅（R11 network-key 比對）| ✅ seeded | R11 reference target | **低-中**（網路名稱；無帳號）|
| sample series | `content/settings/_sample.series.json` | `{$comment,series:[...]}` | ❌ **build 不讀取**（template-only；`$comment` 註明複製到 `series.json` 才生效）| n/a（範本）| 無 | **低** |

### 5.2 link-sources / sourceKey registry 與 commerce / download registry 的根本差異（關鍵）

> **`link-sources.json` 已 seeded 且 production-consumed，但 commerce / download registry 仍 empty —— 差別不在機制，在 entry 的「商業敏感度」。**

| 維度 | link-sources（sourceKey）| commerce / download registry |
| --- | --- | --- |
| entry 內容 | 顯示 label（`BLOG` / `生活` / `YouTube`）+ rel / 預設平台 | affiliate targetUrl / merchant tracking / download direct URL / Google Form id |
| 敏感度 | **低**（公開可見之分類 / 平台名）| **高**（可含 tracking id / 私人 Drive / respondent boundary）|
| seed 風險 | 無（公開資訊；commit 入 repo 無洩漏）| 高（commit 入 repo = 商業 / 隱私洩漏）|
| 是否可 commit 真實 entry | ✅ 已 commit 8 筆真實 entry | ❌ 紅線禁止 commit 真實 entry |
| 為何現況 | seeded（renderer 已消費）| empty（等 user 授權；fixture 須避開敏感資料）|

→ 此對照說明：**registry seed 機制本身是中性的**（link-sources 已證明可 seed + consume）；commerce / download 之所以維持 empty，是因為它們的 entry 攜帶商業 / 隱私敏感資料，而非機制限制。**Seed governance 的核心不是「能不能 seed」，而是「seed 什麼內容才不踩紅線」。**

### 5.3 哪些是 production settings、哪些只是 validation fixtures / sample

| 類別 | 檔案 / 路徑 | 角色 |
| --- | --- | --- |
| production settings registry | `commerce-links.json` / `download-assets.json` / `download-forms.json` / `link-sources.json` / `affiliate-networks.json` / `series.json` | loader 讀取；validator 掃描；commit 入 repo = production state |
| sample（非 production-consumed）| `_sample.series.json` | template-only；build 不讀；複製到 `series.json` 才生效（**Option F 既有先例**）|
| validation fixtures | `content/validation-fixtures/**/_test-*.md` | validator 預期錯誤樣本；post-level；69/59 warnings 全來自此 |
| settings-level fixtures | （**不存在**）| am-2 Option D fixture lock：skip settings-level fixtures；Option A naming `content/validation-fixtures/settings/commerce-links/_test-<rule-id>.json` 僅凍結為未來 escape hatch，未啟用 |

---

## 6. Registry Seed / Unlock Strategy Options

7 條候選策略。每條比較 10 維度：mutation surface / risk / 污染 production / 可測 C4 / 可測 C9 / 可測 download real-path / 與 Option D fixture lock 衝突 / 需 source change / 需 user approval / 可 rollback。

### 6.1 Option A — keep registry empty（status quo / no-op）

- **內容**：維持現況；不 seed 任何 registry。
- **mutation surface**：0。
- **risk**：0。
- **污染 production**：❌ 無。
- **可測 C4 / C9 / download real-path**：❌ / ❌ / ❌（全部不可測）。
- **與 Option D fixture lock 衝突**：❌ 無（一致）。
- **需 source change**：❌ 無。
- **需 user approval**：❌ 無。
- **rollback**：n/a。
- **裁決**：✅ **本 phase 維持此狀態**（不解 blocker，但零風險）；長期不解 blocker。

### 6.2 Option B — production registry seed（real authored entries）

- **內容**：user 在 production registry 加入**真實** commerce / download entry（真實 affiliate link / download URL / Google Form id）。
- **mutation surface**：production registry +N entries（真實資料入 repo）。
- **risk**：**高**（真實 tracking id / download URL / form id commit 入公開 repo = 商業 / 隱私洩漏）。
- **污染 production**：⚠️ 非「污染」（是真實 production data），但攜帶敏感資料。
- **可測 C4 / C9 / download real-path**：✅ / ✅ / ✅（若 user 自然產生 `active:false` / displayLabel / asset entry）。
- **與 Option D fixture lock 衝突**：❌ 無（不靠 fixture；靠真實 data）。
- **需 source change**：❌ 無（loader / validator 自然吃到）。
- **需 user approval**：✅ **強制**（只有 user 能提供真實 entry；Claude **不可自行創建**）。
- **rollback**：中（須 revert registry commit；若已 deploy 則牽連 gh-pages / Blogger）。
- **裁決**：⚠️ **僅 user 主動；Claude 不得自行 seed**。等同 Option G 之觸發點（見 §6.7）；本 phase 不啟動。

### 6.3 Option C — dedicated noindex / draft sample entries in production registry

- **內容**：在 production `commerce-links.json` / `download-*.json` 直接加入「標記為 sample / draft」之假 entry（如 `{linkId:"_sample-c4", active:false, _sample:true}`）。
- **mutation surface**：production registry +N sample entries。
- **risk**：中（雖無真實敏感資料，但污染 production registry；R1-clean 破壞）。
- **污染 production**：✅ **有**（registry 不再 empty；loader / validator 會掃到 → registry-level warning drift：R6 missing-target-url / R8 internal-label / R14 inactive-missing-replacement 等）。
- **可測 C4 / C9 / download real-path**：✅ / ✅ / ✅（sample entry 可觸發）。
- **與 Option D fixture lock 衝突**：⚠️ 部分（繞過 fixture lock，但用 production registry 當 fixture 載體 = lock 精神之違反）。
- **需 source change**：⚠️ 可能（若要 validator / renderer 忽略 `_sample:true` entry 須加 filter code path）。
- **需 user approval**：✅。
- **rollback**：中（revert registry + 可能的 filter source）。
- **裁決**：❌ **reject**（違反 R1-clean + am-2 Option D 精神；baseline drift；不可接受用 production registry 當 fixture 載體）。

### 6.4 Option D — validation-only registry overlay / test harness registry

- **內容**：在 `content/validation-fixtures/settings/commerce-links/` 建立 settings-level fixture JSON（am-2 凍結之 Option A escape hatch），validator 在掃 fixture post 時 overlay 載入對應 settings fixture。
- **mutation surface**：validator loader 雙模 code path + N 個 settings-level fixture JSON。
- **risk**：中（須改 loader / sourcePath；新增 settings fixture 機制）。
- **污染 production**：❌ 無（fixture-scoped；production registry 維持 empty）。
- **可測 C4 / C9 / download real-path**：✅ / ✅ / ✅（overlay 提供 fixture entry）。
- **與 Option D fixture lock 衝突**：⚠️ **這就是解開 lock 的動作**（啟用 am-2 凍結之 escape hatch）。
- **需 source change**：✅ **有**（loader 雙模 + validator overlay 邏輯）。
- **需 user approval**：✅（解 fixture lock 是架構決策）。
- **rollback**：中-高（loader / validator / fixture 三處）。
- **裁決**：⚠️ **defer**（最「正規」之 fixture 解法，但須獨立 phase 啟用 am-2 escape hatch；本 phase 不啟動；與專案保守落地慣例一致 —— 不為單一 rule 引入新 loader 模式）。

### 6.5 Option E — mock / in-memory registry injection during validation

- **內容**：在 `load-settings.js` / `validate-content.js` 加 test-mode code path，允許注入記憶體內 mock registry（= am-2 之 Option B / C4 doc §5.2）。
- **mutation surface**：loader + validator source change（test seam）。
- **risk**：中-高（CLAUDE.md §1「不過度工程化」+ §29「第一版未規劃 test 框架」）。
- **污染 production**：❌ 無（純記憶體）。
- **可測 C4 / C9 / download real-path**：✅ / ✅ / ✅。
- **與 Option D fixture lock 衝突**：⚠️ 繞過（mock 不經 settings fixture）。
- **需 source change**：✅ 有（新 test seam）。
- **需 user approval**：✅（須 waive §1 / §29 紅線）。
- **rollback**：高（牽動 loader / validator / dev / build 路徑）。
- **裁決**：❌ **reject**（為單條 rule 引入 mock harness = 過度工程化；與 am-2 對 Option B 之 reject 一致）。

### 6.6 Option F — separate sample settings file not consumed by production（**首選候選載體**）

- **內容**：建立 `content/settings/_sample.commerce-links.json` / `_sample.download-assets.json` / `_sample.download-forms.json`，mirror `_sample.series.json` 模式（`$comment` 註明 template-only；build / loader **不讀取**）。內容為「故意非真實」之 sample entry（fixture-namespaced key + RFC 2606 reserved URL + 明顯 sample 字串）。作為**未來 C4 / download real-path source / fixture 設計時之 schema 參考與測試藍本**；正式測試仍待 Option D escape hatch 或 Option G 真實 entry。
- **mutation surface**：+N 個 `_sample.*.json`（build / loader 不消費 → 0 runtime 影響）。
- **risk**：**低**（build 不讀；validator 不掃；無 baseline drift；無真實資料）。
- **污染 production**：❌ 無（production registry 維持 empty；sample 檔不被消費）。
- **可測 C4 / C9 / download real-path**：⚠️ **間接**（sample 檔本身不被 validator / renderer 消費 → 不直接觸發 rule；但提供 schema 藍本，降低未來 Option D / G 落地時之設計風險）。
- **與 Option D fixture lock 衝突**：❌ 無（sample 檔非 fixture，不經 validator）。
- **需 source change**：❌ 無（build / loader 不讀）。
- **需 user approval**：⚠️ 輕（新增檔案；但零 runtime 影響）。
- **rollback**：極低（刪檔即可）。
- **裁決**：✅ **首選方向（作為 schema 藍本載體）**；但 **本 phase 不建立任何 sample 檔**，僅凍結「未來採 Option F 作藍本」之方向。注意：Option F 單獨**不足以**直接測 C4 / download real-path（需搭配 Option D escape hatch 讓 validator 真的讀到，或 Option G 真實 entry）。

### 6.7 Option G — user-provided real registry entry only（長期自然路徑）

- **內容**：等 user 實際開始使用 commerce affiliate link / download asset，自然在 production registry 寫入真實 entry（含未來下架某 link 而新增 `active:false` entry）；屆時 C4 / C9 / download real-path 之測試為「真實內容之自然觀察點」。
- **mutation surface**：等 user 動作；本 phase 0。
- **risk**：低（真實 production data；但須 user 自行確保不 commit 敏感欄位 —— 此為既有紅線之責任）。
- **污染 production**：❌ 無（是真實 production data）。
- **可測 C4 / C9 / download real-path**：✅ / ✅ / ✅（自然觸發）。
- **與 Option D fixture lock 衝突**：❌ 無（不靠 fixture）。
- **需 source change**：❌ 無（loader / validator / renderer 自然吃到）。
- **需 user approval**：✅ **強制**（**Claude 目前不可自行創建真實 entry**）。
- **rollback**：n/a（真實 data 由 user 管理）。
- **裁決**：✅ **recommend as long-term path**（與 commerce / download dormant 現況一致）；C4 doc §5.3 已將此標為 long-term；本 phase 重申。

### 6.8 7 條策略對照表

| 維度 | A keep-empty | B prod-seed | C sample-in-registry | D overlay | E mock-inject | F separate-sample | G user-real |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mutation surface | 0 | registry +N | registry +N | loader+fixture | loader+seam | +N sample 檔 | 等 user |
| risk | 0 | **高**(敏感) | 中(R1-clean) | 中 | 中-高(§1/§29) | **低** | 低 |
| 污染 production | ❌ | ⚠️真實 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 可測 C4 | ❌ | ✅ | ✅ | ✅ | ✅ | ⚠️間接 | ✅ |
| 可測 C9 | ❌ | ✅ | ✅ | ✅ | ✅ | ⚠️間接 | ✅ |
| 可測 download real-path | ❌ | ✅ | ✅ | ✅ | ✅ | ⚠️間接 | ✅ |
| 與 Option D fixture lock 衝突 | ❌無 | ❌無 | ⚠️違反精神 | ⚠️=解鎖動作 | ⚠️繞過 | ❌無 | ❌無 |
| 需 source change | ❌ | ❌ | ⚠️可能 | ✅ | ✅ | ❌ | ❌ |
| 需 user approval | ❌ | ✅強制 | ✅ | ✅ | ✅ | ⚠️輕 | ✅強制 |
| 可 rollback | n/a | 中 | 中 | 中-高 | 高 | **極低** | n/a |
| 裁決 | ✅本phase | ⚠️僅user | ❌reject | ⚠️defer | ❌reject | ✅首選藍本 | ✅長期 |

---

## 7. Recommended Direction

### 7.1 首選

> **首選 = Option F（獨立 sample settings 檔作 schema 藍本）+ Option G（等 user 真實 entry）之組合，且本 phase 僅凍結方向、不建立任何 sample 檔。**

理由：
- Option F 風險最低（build / loader 不讀 → 零 runtime / 零 baseline 影響），且既有 `_sample.series.json` 已證明此模式可行；可作為未來 C4 / C9 / download real-path source 設計之 schema 藍本，降低落地風險。
- Option G 是 commerce / download registry 真正進入 production 的自然路徑，符合「資料由 user 提供、Claude 不自行創建敏感 entry」之紅線。
- 兩者皆**不**污染 production registry、**不**放敏感資料、**不**改 source。

### 7.2 次選

> **次選 = Option D（validation-only settings overlay；啟用 am-2 凍結之 escape hatch）**，但須**獨立 phase + explicit user approval**。

- 這是唯一能在「不碰 production registry、不放真實資料」下**直接讓 validator 觸發 C4 / C9**的正規 fixture 解法。
- 但須改 loader 雙模 + validator overlay 邏輯，屬架構決策，不應在 governance preanalysis 輪次啟動。

### 7.3 明確不建議

- ❌ **Option C**（sample entry 塞進 production registry）：違反 R1-clean + Option D fixture lock 精神 + baseline drift。
- ❌ **Option E**（mock injection harness）：為單條 rule 引入 test seam = 過度工程化（CLAUDE.md §1 / §29）。
- ❌ **Claude 自行執行 Option B / G**（自行創建真實 entry）：紅線禁止；真實 entry 只能由 user 提供。

### 7.4 若首選為「docs-only 後再 source」之 phase 拆法

若未來決定推進，建議拆 phase（不在本輪執行；詳 §13）：

1. **docs-only acceptance**（本檔認可）。
2. **sample schema design（Option F docs-only）**：凍結 `_sample.commerce-links.json` / `_sample.download-*.json` 之 schema 藍本內容（仍不建立檔案，或在獨立 phase 建立純 template 檔）。
3. **Option D escape hatch source preflight（docs-only）**：凍結 loader 雙模 / overlay sourcePath 改寫設計。
4. 之後才談 C4 / C9 / download real-path source。

### 7.5 若首選需 user-provided real entry

> **目前不可由 Claude 自行創建真實 registry entry。** commerce affiliate link / download URL / Google Form id 皆屬 user 私有商業 / 隱私資料；Claude 無從、也不得自行填寫。Option B / G 之啟動完全取決於 user 是否主動提供真實 entry，且 user 須自行確保不 commit §4.1 之敏感欄位。

---

## 8. Commerce C4 Impact

### 8.1 C4 source 為何仍 blocked

- C4 trigger 需 registry 內有 `active:false` entry + post `ref` 命中；empty registry + Option D fixture lock → 無合法 entry 來源 → C4 為 dead source + 無 fixture 可建。

### 8.2 要測 C4 最小需要什麼 registry state

- **最小**：registry 內 ≥1 筆 `{ linkId:"X", active:false, replacementTarget:"Y", targetUrl:<reserved>, internalLabel:<non-empty> }` + ≥1 筆 `{ linkId:"Y", active:true, ... }`（避免 R12 replacement-not-found）+ 一個 post `affiliate.links:[{ref:"X"}]`。
- 此 entry **必須**透過 Option D overlay（fixture-scoped）或 Option G（user 真實）提供；**不可**寫入 production `commerce-links.json`。

### 8.3 如何避免為了 C4 seed 出假 production data

- ❌ 不在 production `commerce-links.json` 加 sample entry（Option C reject）。
- ✅ 若推進，採 Option D overlay：entry 留在 `content/validation-fixtures/settings/commerce-links/_test-commerce-ref-inactive.json`，用 fixture-namespaced linkId + RFC 2606 reserved URL；production registry 維持 empty。
- ✅ 或等 Option G：user 真實下架某 link 時自然產生 `active:false` entry。

---

## 9. Commerce C9 Impact

### 9.1 C9 source 前還缺什麼 docs-only preanalysis

- am-7 僅 §5 概述 C9 `commerce-ref-display-override-risk`；**缺**：standalone rule contract（rule id 最終命名 / trigger 精確定義 / message shape / 不洩漏哪些欄位 / cascade 位置 / 與 C8 之 orthogonality）。
- C9 source 前須**獨立 docs-only C9 preanalysis**（mirror C4 `8c9fddf` / C8 `bb33523` doc 之格式）+ 本檔之 seed governance 決策。

### 9.2 C9 如何依賴 registry entry / internalLabel / display override

- C9 之風險語意 = post-side display override（如 `labelOverride` / 顯示文字）是否**洩漏** registry entry 之 `internalLabel`（內部標記，不應外顯），或與 `displayLabel` 衝突。
- 此判斷**需 registry 內有對應 entry**（才有 internalLabel / displayLabel 可比對）→ 與 C4 同屬 registry-coupled；empty registry 下無法驗證。
- ⚠️ C9 message shape 須特別小心：**不可** echo internalLabel 原值（否則 validator 輸出本身就洩漏內部標記）→ 須於 C9 preanalysis 凍結「只報欄位名 / 風險類型，不 echo 值」。

### 9.3 C9 是否應等 seed governance 決策後再做

- ✅ **是**。C9 同時被 (a) registry coupling（同 C4）+ (b) 缺 standalone contract 雙重 block；應**先**完成本 seed governance 決策 + 獨立 C9 contract preanalysis，才談 source。順序建議：seed governance（本檔）→ C9 standalone preanalysis → Option D escape hatch → C4 / C9 source。

---

## 10. Download Real-path Impact

### 10.1 現況

- download landing placeholder renderer **已 smoke-verified**（pm-10：temp post → build → grep → cleanup；placeholder path 產出 `lab-download-box--landing` + form/asset placeholder + external-service note；noindex + sitemap exclusion verified）。
- **real registry-resolved path 未測**：`deriveRenderedDownloadLanding`（build-github.js）之 resolved branch（form title / asset title+fileType resolve）從未被執行（registry empty → 所有 post 走 placeholder branch）。

### 10.2 需要何種 registry / asset / form seed 才能安全測

- **最小**：download asset registry ≥1 筆 `{ assetId:"X", title:<non-sensitive>, fileType:"PDF" }`（**不含 direct download URL**）+ download form registry ≥1 筆 `{ formId:"Y", title:<non-sensitive> }`（**不含 Google Form 真實 URL / id**）+ 一個 post `download.assetRefs:["X"]` / `formRef:"Y"`。
- entry 須透過 Option D overlay（fixture-scoped）或 Option F sample 藍本提供；**不**寫入 production `download-*.json`。
- resolved path 之 smoke 測法可 mirror pm-10：temp post + temp overlay → build → grep resolved title → cleanup（no commit / no push）。

### 10.3 form / respondent data 邊界

- ❌ download asset entry **不**含 Google Drive direct URL / 私人 Drive folder id（preview / hotlink 風險）。
- ❌ download form entry **不**含 Google Form 真實 URL / form id / Sheet id；**永不**含 respondent data。
- ✅ resolved path 測試只驗「title resolve + placeholder note 顯示」，**不**驗 network reachability、**不**輸出真實 Form / Drive URL（pm-10 紅線延續）。

---

## 11. Admin Selector / UI Impact

### 11.1 Admin selector preanalysis 已有，但 implementation 會遇 empty registry

- commerce Admin picker / download Admin selector 之 preanalysis 已存在（`docs/20260601-sourcekey-admin-selector-preanalysis.md` 等）；但 selector 之價值 = 讓站長從 registry **下拉選 entry** 插入 post frontmatter → **registry empty 時下拉是空的**，selector 無可選項。

### 11.2 若 registry 仍 empty，Admin UI 的價值與測試方式

- registry empty → Admin selector 只能測「空狀態 UI」（empty list / disabled picker）；無法測「選取 → 插入 ref / assetRef」之完整 flow。
- 完整 Admin flow 測試與 C4 / download real-path 同樣依賴 registry 有 entry → 應等 seed governance 決策（Option D overlay 或 Option G real entry）後再啟動 Admin implementation。
- Admin selector implementation 應**獨立 phase**，且在 registry 有可選 entry 後才有測試意義。

### 11.3 admin-write-cli 仍 dormant

- Admin Apply / middleware write / admin-write-cli 維持 dormant；本 phase 不啟動、不規劃啟動。selector（read / 顯示）與 write（Apply / 寫回 frontmatter）為兩獨立維度；write 維度紅線更嚴，須另行 user 授權。

---

## 12. Security / Privacy / Commercial Risk

| 風險類別 | 具體風險 | 緩解（本 phase enforced）|
| --- | --- | --- |
| affiliate tracking 洩漏 | commerce entry 可能含真實 affiliate tracking id / merchant id / targetUrl | 不 seed production registry；sample / overlay 用 fixture-namespaced key + RFC 2606 reserved URL；C9 message 不 echo internalLabel |
| Google Form respondent data | form entry 若含真實 Form / Sheet → 連帶 respondent 隱私 | respondent data remain in Google；form entry 不含真實 Form URL / id；download form fixture 用 sample 字串 |
| download direct URL preview/hotlink | asset entry 含 Google Drive 直連 → preview / 盜連 | asset entry 不含 direct download URL；real-path 測試不驗 reachability、不輸出真實 URL |
| 私人商業設定塞進 fixture | 為省事把真實 entry 當 fixture | 紅線：不為 fixture 改 production registry；fixture / sample 一律 fixture-namespaced + reserved |

> 共同原則：**任何進 repo（commit）之 registry / fixture / sample 內容，皆視為公開**；商業 / 隱私敏感資料一律不進 repo，留在 user 私有環境（Blogger 後台 / Google Forms / Drive / affiliate dashboard）。

---

## 13. Phase Ladder Proposal

未來若要推進（**本輪不執行任一階**），建議安全階梯。每階明確**禁止 deploy / Blogger repost / GA4 / reverse UTM activation / pm-26 unblock，除非 user 另行批准**：

| 階 | 名稱 | 範圍 | 紅線 |
| --- | --- | --- | --- |
| L1 | docs-only acceptance | read-only 核對本檔 §5 / §6 / §8 / §9 / §10 與既有 registry / validator / docs 一致 | 全 enforced；不寫檔 |
| L2 | C9 standalone contract preanalysis（docs-only）| 凍結 C9 rule id / trigger / message（不 echo internalLabel）/ cascade；mirror C4 / C8 doc 格式 | 不 source / 不 fixture / 不 seed |
| L3 | sample registry design（Option F docs-only → 可選建立 `_sample.*.json` template）| 凍結 sample schema 藍本；若建立 sample 檔須 build / loader 不讀取（mirror `_sample.series.json`）| 不放真實資料；不被 validator / renderer 消費 |
| L4 | Option D escape hatch source preflight（docs-only）| 凍結 loader 雙模 / overlay sourcePath 改寫設計 | 不 source |
| L5 | source implementation | 啟用 Option D overlay loader + land C4 / C9 source（warning-only）| 不 deploy / 不 Blogger / 不 GA4 |
| L6 | fixture / smoke test | settings-level fixture（overlay）+ download real-path temp smoke（mirror pm-10）| no commit of 敏感資料；temp post cleanup |
| L7 | Admin / renderer | Admin selector（read）+ renderer real-path display | write 維度另行授權；不 deploy |

> 每階須**獨立 user approval**；不得自動跨階；deploy / Blogger / GA4 / reverse UTM / pm-26 在任何階皆須 user 另行明確批准。

---

## 14. Final Recommendation

### 14.1 本階段 single conclusion

> **本 phase 為 docs-only registry seed governance preanalysis。共同 blocker 之根因為「無安全 registry entry 來源 + Option D fixture lock」，非 validator 邏輯。建議首選 Option F（sample schema 藍本，本輪不建檔）+ Option G（user 真實 entry），次選 Option D overlay（須獨立 phase），明確不建議 Option C / E 與 Claude 自行 seed。本輪僅凍結方向，不實作任何 seed / source / fixture。**

### 14.2 下一階段建議

- **首選**：**read-only acceptance cross-check**（核對本檔 §5 / §6 / §8 / §9 / §10 凍結項與既有 registry shape / `validateCommerceRefs` / `validateDownloadRegistry` / `_sample.series.json` / `link-sources.json` 一致）**或 Final Idle Freeze**。
- **不得**建議直接做 C4 source。
- **不得**建議直接 seed production registry。
- **不得**建議直接 deploy / Blogger / GA4 / reverse UTM activation / pm-26 unblock。

### 14.3 本階段結束後預設狀態

- HEAD 前進 1 commit（`docs(registry): plan seed governance`）。
- working tree clean；ahead/behind = 0/0（push 後）。
- `npm run validate:content` 維持 **0 errors / 69 warnings / 59 posts**。
- commerce content-ref source / fixtures landed 範圍不變（C1 / C2 / C3 / C5 / C6 / C8）。
- commerce + download registries 維持 empty `[]`。
- C4（plan）/ C7 / C9 source 與 fixture 仍未 implement。
- download landing real-path / Admin / renderer / build / deploy / Blogger repost / GA4 / reverse UTM / pm-26 全部 dormant / BLOCKED。

### 14.4 不自動推進下一階段

- ❌ 本 phase 結束後**不**自動啟動 acceptance / Final Idle Freeze / C9 preanalysis / sample 建檔 / Option D overlay / C4 / C9 source / Admin / renderer。
- 必須等待 user 明確授權。

---

## Appendix A — Cross-reference index

| 主題 | 文件 / commit |
| --- | --- |
| commerce empty registry decision | `docs/20260603-commerce-affiliate-link-empty-registry-preanalysis.md` |
| commerce registry schema decision | `docs/20260603-commerce-affiliate-link-registry-schema-decision.md` |
| commerce settings fixture mechanism（Option D lock）| `docs/20260604-commerce-links-registry-fixture-mechanism-preanalysis.md` + commit `89cbf75` |
| commerce content-reference validation（C1..C9 contract + §4.5 role enum + §5 C9）| `docs/20260604-commerce-links-content-reference-validation-preanalysis.md` |
| commerce C4 inactive ref preanalysis | `docs/20260608-commerce-c4-inactive-ref-validation-preanalysis.md`（commit `8c9fddf`）|
| commerce C8 invalid role preanalysis | `docs/20260608-commerce-c8-invalid-role-preanalysis.md`（source `57c983b` / fixture `bb33523`）|
| download registry schema decision | `docs/20260531-download-asset-form-settings-registry-schema-decision.md` |
| download registry-aware validation | `docs/20260602-download-registry-aware-validation-preanalysis.md`（R2 `145a548` / R5b `077c3d1`）|
| download landing page renderer | `docs/20260603-download-landing-page-renderer-preanalysis.md`（resolution `d18e21c`；smoke pm-10）|
| download landing settings registry direction | `docs/20260529-download-landing-page-settings-registry-direction-preanalysis.md` |
| sourceKey Admin selector | `docs/20260601-sourcekey-admin-selector-preanalysis.md` |
| sample settings precedent | `content/settings/_sample.series.json` |
| benign seeded registry precedent | `content/settings/link-sources.json` |
| commerce registry validator source | `src/scripts/validate-content.js:388`（`buildCommerceLinkIdSet`）/ `:414`（`validateCommerceLinkRegistry`）/ `:586`（`validateCommerceRefs`）|
| download registry validator source | `src/scripts/validate-content.js:293`（`validateDownloadRegistry`）/ `:339`（`buildDownloadKeySet`）|
| CLAUDE.md commerce / download 治理段 | `CLAUDE.md` §3（commerce-links / download-* registry governance）|

---

## Appendix B — Baseline snapshot

```
date: 2026-06-08 11:47 +0800
repo: D:\github\blog-new\portable-blog-system
branch: main
HEAD: bb335230363feaa9a2a766587843890595a6ce2c
origin/main: bb335230363feaa9a2a766587843890595a6ce2c
ahead/behind: 0/0
working tree: clean
latest subject: test(validate): add commerce invalid role fixture
validate: 0 errors / 69 warnings / 59 posts

commerce content-reference rules landed: C1 / C2 / C3 / C5 / C6 / C8
commerce content-reference rules: C4 docs-only plan landed (source blocked); C7 not recommended; C9 deferred (needs standalone preanalysis + seed governance)
commerce content-reference fixtures landed: 6 (C1 / C2 / C3 / C5 / C6 / C8)
commerce registry: empty []
download asset / form registry: empty []
download landing renderer: placeholder smoke-verified (pm-10); real registry-resolved path untested
commerce production ref usage: 0 / role usage: 0
download production assetRefs / formRef usage: 0
seeded benign registry: link-sources.json (8 entries); affiliate-networks.json
sample (non-consumed) precedent: _sample.series.json
commerce renderer / Admin / download real-path / build / deploy / Blogger repost / GA4: dormant
reverse UTM activation: dormant (pm-24 source landed; un-deployed)
pm-26: BLOCKED
Admin Apply / middleware write / admin-write-cli: dormant
```

---

## Appendix C — Registry seed governance quick card

```
共同 blocker:   empty registry + Option D fixture lock (am-2 89cbf75)
根因:           無安全 registry entry 來源（非 validator 邏輯難寫）
registry-coupled rules/path: C4 (active:false entry) / C9 (internalLabel entry) / download real-path (asset/form entry)
registry-independent (已 landed): C1 / C2 / C3 / C5 / C6 / C8

seed 策略裁決:
  A keep-empty        → 本 phase 維持（0 風險，不解 blocker）
  B prod-seed (real)  → 僅 user 主動；Claude 不得自行 seed
  C sample-in-registry→ ❌ reject（違反 R1-clean / fixture lock 精神）
  D overlay (escape)  → ⚠️ defer（次選；須獨立 phase + approval）
  E mock-inject       → ❌ reject（過度工程化 §1/§29）
  F separate-sample   → ✅ 首選藍本（本 phase 不建檔；build/loader 不讀）
  G user-real         → ✅ 長期自然路徑（Claude 不得自行創建）

紅線:           不放 credential/token/respondent/commission/tracking-id/download-direct-URL/Form-id
                不 seed production registry；不污染；不 echo internalLabel（C9）
本 phase 輸出:  本 docs 檔；0 source / 0 fixture / 0 seed / baseline 不變
下一步建議:     read-only acceptance 或 Final Idle Freeze；不直接 C4 source / 不 seed / 不 deploy
phase ladder:   L1 acceptance → L2 C9 contract → L3 sample design → L4 overlay preflight
                → L5 source → L6 fixture/smoke → L7 Admin/renderer（每階獨立 approval）
```

---

（本文件結束）
