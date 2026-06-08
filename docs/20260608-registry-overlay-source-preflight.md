# 2026-06-08 Registry Validation Overlay — Source Preflight (docs-only)

Phase name: `20260608-pm-7-registry-overlay-source-preflight-docs-only-a`
Date: 2026-06-08 12:49 +0800
Mode: **docs-only Option D validation overlay source preflight**（no source / no overlay file / no fixture / no settings registry mutation / no registry seed / no content / no templates / no renderer / no loader change / no validator rule landing / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no admin selector implementation / no download renderer / landing implementation / no real affiliate link / download URL / tracking id / token / credential / merchant id / Google Form id / respondent data / no production content migration / no `npm install` / no CLAUDE.md mutation / no MEMORY mutation / no amend / rebase / force-push）

本檔對應 `docs/20260608-registry-seed-governance-preanalysis.md` §13 phase ladder 之 **L4（Option D escape hatch source preflight，docs-only）**，亦對應 `docs/20260608-registry-sample-design-preanalysis.md` §15 ladder 之 **L4**。先前階：L1（seed governance docs-only acceptance）已隨 `bc744d4` accepted；L2（C9 standalone contract）已隨 `5fe290f` accepted；L3（sample blueprint design docs-only）已隨 `11b9623` accepted；L3b（sample 檔建立）已隨 `3b97cd4` landed and accepted（3 個 `_sample.*.json`，loader 白名單天然忽略，0 baseline drift）。本輪只做 **L4 之 docs-only 變體**：規劃「未來若要讓 validator 在測試 fixture 情境讀取 overlay registry，應如何安全設計」之 source preflight。**不**實作 source、**不**建立 overlay 檔、**不**新增 fixture、**不**改 registry。

---

## 0. Relation to prior phases

| 順序 | Phase / commit | 角色 |
| --- | --- | --- |
| night-20 `c1a6974` | commerce empty registry implementation | `commerce-links.json` empty registry |
| night-21 `78f1e9a` | commerce-links loader exposure | `settings.commerceLinks = []`；無下游 consumer |
| am-2 `89cbf75` | commerce settings fixture mechanism decision | **fixture mechanism = Option D（skip settings-level fixtures）**；Option A path naming（`content/validation-fixtures/settings/commerce-links/_test-<rule-id>.json`）保留為未來 escape hatch |
| `39b89e3` / `281cd43` / `149efdc` / `3aeabbc` | commerce content-ref C1 / C2 / C3 / C5 / C6 source + fixtures | registry-independent rules landed |
| `8c9fddf` | commerce C4 inactive ref preanalysis（docs-only） | C4 contract 凍結；**source blocked by empty registry + Option D fixture lock** |
| `57c983b` / `bb33523` | commerce C8 invalid role source + fixture | post-side / 無 registry coupling；baseline → 69/59 |
| `bc744d4` | registry seed governance preanalysis（docs-only） | 共同 blocker = empty registry + Option D fixture lock；首選 Option F + G；次選 Option D overlay；§13 ladder L4 = 本檔 |
| `5fe290f` | commerce C9 display override risk standalone preanalysis（docs-only） | C9 contract 凍結（leak-equality / 不 echo internalLabel）；C9 同 C4 registry-coupled、雙重 block |
| `11b9623` | registry sample blueprint design preanalysis（docs-only） | Option F 命名 / 落點 / 欄位藍本 / 護欄凍結；§15 ladder L3b = 建檔 |
| `3b97cd4` | sample registry blueprints landed（L3b） | `content/settings/_sample.{commerce-links,download-assets,download-forms}.json`；loader 白名單天然忽略 → 0 baseline drift；placeholder-only |
| **pm-7（本 phase）** `（本 commit）` | **Option D validation overlay source preflight（docs-only）** | 規劃「未來若要讓 validator 在 fixture 情境讀 overlay registry」之 activation 機制 / overlay shape / source touch points / merge semantics / fixture strategy / 安全護欄；**不**實作 source；**不**建立 overlay 檔；**不**新增 fixture；**不**改 registry |

本階段唯一目的為：

> 在 registry-seed governance accepted（首選 Option F sample 藍本 + Option G real entry；次選 Option D overlay）、C9 standalone contract accepted、sample blueprint 3 檔 landed but not consumed、commerce + download registries 仍 empty `[]`、production posts 0 使用 `ref` / 0 使用 `labelOverride` / 0 使用 `assetRefs` / `formRef` 之現況下，**先**為 Option D overlay（validation-only registry escape hatch）做 source preflight：比較 6 種 activation 機制（A CLI flag / B env var / C fixed-path convention / D sample auto-promote / E separate npm script / F inline synthetic）、凍結 overlay file shape、盤點 source touch points、比較 4 種 merge semantics、凍結 fixture strategy 與安全護欄。本階段**不**改任何可執行檔；**不**建立任何 overlay 檔；**不**新增任何 fixture；**不**改任一 production / sample registry。

---

## 1. Executive Summary

### 1.1 本輪性質宣告

> **本輪為 docs-only Option D validation overlay source preflight。** 不實作 source；不新增 overlay 檔；不新增 fixture；不改 registry；不 production migration。不改 src / content / settings / templates / views / fixtures / package / lockfile / dist / gh-pages / .cache / CLAUDE.md / MEMORY。唯一輸出為本檔。

### 1.2 一句話結論

> **建議未來 Option D overlay 採「explicit CLI flag（`--registry-overlay <repo-local path>`）+ 獨立 npm script（`validate:content:overlay`）」雙層機制，overlay 注入點落在 `validate-content.js` main（而非 `load-settings.js`），merge semantics 採「replace」（overlay 完全取代 `settings.commerceLinks` / `downloadAssets` / `downloadForms`，不與 production registry 混合），並嚴格禁止：auto-promote `_sample.*.json`（Option D 否決）、presence-based auto-discovery（Option C 否決）、env-var sticky activation（Option B 否決）、inline synthetic mock（Option F 否決）、overlay path 指向 production settings 檔、overlay path 來自 repo 外 / 網路。預設 `validate:content` 必須維持 overlay-blind → baseline 0/69/59 byte-identical；overlay 僅在獨立 script 顯式啟用時生效。⚠️ 關鍵發現：commerce C4 / C9 為 validate-time（validator 讀 registry），download real-path resolve 為 build-time（`build-github.js` 經 `loadSettings` 讀 registry）—— 兩者注入點不同；validate overlay 只解 C4 / C9 + download R2 ref-not-found，download renderer real-path smoke 須另行 loader-level / temp-registry 機制（與 pm-10 temp smoke 同型）。本輪僅凍結方向，不實作 source；下一階段建議 read-only acceptance 或 Final Idle Freeze。**

### 1.3 推薦理由摘要

- **explicit CLI flag 是「不自動觸發」最強保證**：flag 須每次顯式傳入 → 無法被 env state / 檔案 presence / sample 檔意外啟用 → 預設 `validate:content` 永遠 overlay-blind → baseline 0/69/59 不被污染。符合專案保守落地慣例（warning-only / additive / fixture isolated）。
- **注入點落在 validator 而非 loader 是「不污染 build / renderer」最強保證**：`loadSettings()` 被 `build-github.js` / `build-blogger.js` / vite 使用；若 overlay 注入 loader，build / dev / renderer 會意外讀到 overlay。將 overlay 解析放在 `validate-content.js` main（gated by flag），則 `loadSettings()` 維持純 production path → build / deploy / Admin 完全不受影響。
- **replace semantics 是「不洩漏 production 資料進測試輸出」最強保證**：overlay active 時 registry keyset / entry-map 完全由 overlay 建構，production `commerceLinks` 被忽略 → production 真實 entry（未來 Option G seeded）不會與 fixture 測試輸出混合。今日 production empty → replace ≡ merge，但 replace 對未來更安全。
- **sample 檔不可 auto-promote**：`_sample.*.json` 之全部價值建立於「永不被消費」（`_sample.series.json` 先例 + sample design §3.2 四條邊界）。auto-promote 會使 sample 檔 load-bearing、崩解「blueprint vs 可測載體」之分界 → 強烈否決 Option D（sample auto-promote）。overlay 須是與 `_sample.*` **不同檔、不同層**之 fixture-scoped 檔。
- **不違反紅線**：本 phase 為 docs-only；不放真實 affiliate / download / tracking / token / merchant / Google Form / respondent / commission 資料；不 mutate 任一 registry；reverse UTM 與 pm-26 維持 dormant / BLOCKED。

### 1.4 本 phase 範圍

- 釐清 problem statement：為何 sample blueprint 不能觸發 C4 / C9 / download real-path；為何 production registry 不能為測試自行 seed；為何 Option D overlay 是 escape hatch；為何需要 source preflight 而非直接改 source（§3）。
- 盤點既有 loader / validator 架構（§4）。
- 凍結 overlay design goals（§5）。
- 比較 6 種 activation 機制 A..F × 10 維度（§6）。
- 給最保守推薦與護欄（§7）。
- 凍結 overlay file shape（§8）。
- 盤點 source touch points（§9）。
- 比較 4 種 merge semantics A..D（§10）。
- 凍結 fixture strategy after overlay（§11）。
- 凍結 security / privacy / commercial risk（§12）。
- 凍結 production / build / deploy safety（§13）。
- 給 recommended future phase ladder（§14）。
- 預設 baseline 不變動（0 errors / 69 warnings / 59 posts）。
- 給下一階段建議；不執行下一階段。

### 1.5 本 phase 不做的事

- ❌ 不實作 overlay source（不改 `load-settings.js` / `validate-content.js` / 任何 src）。
- ❌ 不建立任何 overlay 檔（不建 `content/validation-fixtures/settings/**`）。
- ❌ 不新增任何 fixture（post-level 或 settings-level）。
- ❌ 不 seed / 不改任何 production 或 sample registry（commerce / download asset / download form 維持現狀）。
- ❌ 不 implement C4 / C7 / C9 source；不改 `validateCommerceRefs` / `validateDownloadRegistry`。
- ❌ 不啟動 download landing renderer real-path / Admin picker / selector。
- ❌ 不 migrate / mutate production posts；不新增 ref / role / labelOverride / assetRefs / formRef。
- ❌ 不 build / deploy / Blogger repost / GA4 validation / reverse UTM activation / pm-26 unblock。
- ❌ 不放任一真實 affiliate URL / download URL / merchant id / tracking id / sid / aff_id / token / credential / Google Form id / respondent data / commission 資料。
- ❌ 不改 CLAUDE.md / MEMORY / auto-memory；不改既有 docs（只新增本檔）。
- ❌ 不 `npm install`；package / lockfile 不動。不 amend / rebase / force-push。

---

## 2. Current Baseline

### 2.1 git / validate baseline（本 phase 開始時）

```
repo: D:\github\blog-new\portable-blog-system
branch: main
HEAD: 3b97cd4e905d719c2386756f675f841c6d1ea480
origin/main: 3b97cd4e905d719c2386756f675f841c6d1ea480
ahead/behind: 0/0
working tree: clean
latest subject: docs(settings): add sample registry blueprints
validate: 0 errors / 69 warnings / 59 posts
```

### 2.2 governance / contract / sample 已 accepted 範圍

- ✅ **registry seed governance accepted**（`bc744d4`）：共同 blocker = empty registry + Option D fixture lock；首選 Option F + G；次選 Option D overlay（須獨立 phase）。
- ✅ **C9 standalone contract accepted**（`5fe290f`）：`commerce-ref-display-override-risk`、warning-only、leak-equality、不 echo internalLabel / labelOverride；C9 同 C4 registry-coupled、雙重 block。
- ✅ **C8 source + fixture landed and accepted**（`57c983b` / `bb33523`）：post-side / 無 registry coupling。
- ✅ **sample blueprint 3 檔 landed and accepted（L3b，`3b97cd4`）**：`_sample.commerce-links.json` / `_sample.download-assets.json` / `_sample.download-forms.json`；placeholder-only（`example.invalid` + `sample-*` + `$comment` 防呆）；**loader 白名單天然忽略 → 0 baseline drift**；確認**不被 loader / validator 消費**。
- ✅ commerce content-reference source / fixtures landed：C1 / C2 / C3 / C5 / C6 / C8（registry-independent）。
- 🔄 C4 `commerce-ref-inactive`：docs-only plan landed（`8c9fddf`）；source blocked。
- ❌ C7 `commerce-ref-missing-role`：不建議啟用。

### 2.3 registry / production 現況

- `content/settings/commerce-links.json` = `{ schemaVersion:1, updatedAt:"", commerceLinks:[], notes:"" }`（empty；R1-clean）。
- `content/settings/download-assets.json` = `{ schemaVersion:1, updatedAt:"", assets:[], notes:"" }`（empty）。
- `content/settings/download-forms.json` = `{ schemaVersion:1, updatedAt:"", forms:[], notes:"" }`（empty）。
- production posts 使用 `affiliate.links[].ref` = **0 篇**；`role` = **0 篇**；`labelOverride` = **0 篇**；`download.assetRefs[]` / `download.formRef` = **0 篇**。
- download landing renderer：placeholder path smoke-verified（pm-10）；real registry-resolved path 未測（registry empty）。
- sample（非 production-consumed）：`_sample.series.json` + 本輪 L3b 之 3 個 commerce / download `_sample.*.json`。
- 69/59 warnings 全屬 `content/validation-fixtures/`（validator 預期樣本，非 regression）。
- **C4 / C9 / download real-path 仍 blocked**：除非未來 overlay 或 user real entry 出現。

### 2.4 dormant / blocked rails

- commerce renderer / Admin picker / selector / display：dormant。
- download landing real-path renderer / Google Forms 串接 / 下載頁：dormant（placeholder-only）。
- reverse UTM activation：dormant（pm-24 source landed; un-deployed）。
- pm-26 deploy gate：BLOCKED。
- Admin Apply / middleware write / admin-write-cli：dormant。
- build / deploy / Blogger repost / GA4 commerce / download dimension：dormant。

---

## 3. Problem Statement

### 3.1 為何 sample blueprint 本身不能觸發 C4 / C9 / download real-path

- L3b 之 `_sample.*.json` 之全部設計前提是「**永不被 loader 讀、永不被 validator 掃**」（sample design §3.2 / §8；本檔 §4 從 source 重新讀證）。
- validator 之 registry 檢查透過 `loadSettings()` 之具名 key（`settings.commerceLinks` / `downloadAssets` / `downloadForms`）取資料；這些 key 來自白名單載入，**不含** `_sample.*`。
- → sample 檔內雖已備齊 C4 所需 `active:false` entry、C9 所需 `internalLabel` entry、download 所需 asset / form entry，但因**不被消費** → 對 validator 而言等同不存在 → **0 觸發**。sample 是 schema 藍本，**不是可測載體**（sample design §1.3 / §6.6「間接」）。

### 3.2 為何 production registry 不能為測試自行 seed

- 直接在 production `commerce-links.json` / `download-*.json` 加 entry：
  - ❌ 違反 R1-clean（commerceLinks 為空 array 之七條件；C4 doc §4.2）。
  - ❌ 違反 am-2 Option D fixture lock 精神（不用 production registry 當 fixture 載體）。
  - ❌ 引入 registry-level warning drift（R6 missing-target-url / R8 internal-label / R14 inactive-missing-replacement / download-registry-* 等 → baseline 漂移）。
  - ❌ commerce / download entry 可能攜帶商業 / 隱私敏感資料（affiliate tracking id / download direct URL / Google Form id）→ 進 repo = 洩漏。
- → seed governance §6.3 已將「sample-in-registry」（Option C）reject。production registry 之真實填入只能由 **Option G（user real entry）** 自然發生。

### 3.3 為何 Option D overlay 是 test harness escape hatch

- C4 / C9 / download real-path 之共同根因 = 「**無安全 registry entry 來源**」（seed governance §3.5）。
- 三條合法來源：
  1. **Option G（user real entry）**：等 user 自然使用 → 但無法主動測試、時程不可控、Claude 不得自行創建。
  2. **Option F（sample 藍本）**：已 landed，但不被消費 → 不可測。
  3. **Option D（validation-only overlay）**：在**不碰 production registry、不放真實資料**下，提供 fixture-scoped registry entry 給 validator → 唯一能**主動、可重現**地觸發 C4 / C9 + download R2 之機制。
- → Option D 是「測試 registry-coupled rule 而不污染 production」之 escape hatch；am-2 已將其 path naming（`content/validation-fixtures/settings/commerce-links/_test-<rule-id>.json`）凍結為未來 escape hatch，本檔規劃其 activation 機制。

### 3.4 為何需要 source preflight 而非直接改 source

- Option D overlay 須改 source（讀 overlay path、解析、注入 registry）→ 屬**架構決策**（seed governance §6.4「須獨立 phase + approval」）。
- 直接改 source 之風險：
  - 若 activation 機制選錯（如 env-var sticky / presence-based auto-discovery），可能讓預設 `validate:content` 意外讀 overlay → baseline 污染。
  - 若注入點選錯（loader-level），可能讓 build / renderer 意外讀 overlay → production 輸出污染。
  - 若 merge semantics 選錯（merge / only-when-empty），可能讓 production 資料洩漏進測試輸出。
- → 先 docs-only 凍結 activation / 注入點 / merge semantics / 護欄，再於後續 phase land source，符合保守落地慣例（先凍結方向、降低 source 反覆）。

---

## 4. Existing Loader / Validator Architecture

### 4.1 `load-settings.js` 現況（read-only 讀證）

- **白名單載入**：`SETTINGS_FILES`（15 個具名 production 檔，line 10–26）以 `readJson`（fail-fast）載入；**無 `fs.readdir` / glob**。
- **optional registry**：`readJsonOptional`（line 37）以**具名檔名**載入 4 個 additive registry：`link-sources.json`（line 52）/ `download-assets.json`（line 57）/ `download-forms.json`（line 58）/ `commerce-links.json`（line 65）；缺檔 / parse error → fallback default object。
- **commerce unwrap**：`commerce-links.json` 之 `commerceLinks` array 被 unwrap 為 `settings.commerceLinks`（line 66；非 array → `[]`）；metadata（schemaVersion / updatedAt / notes）不暴露。
- **download exposure**：`settings.downloadAssets` / `settings.downloadForms` 為 registry object（含 metadata + `assets` / `forms` array）。
- **關鍵事實**：loader 以**顯式檔名清單**載入 → `content/settings/_sample.*.json` 與任何未列名檔案**永不被讀**。此即 sample 檔零 runtime 影響之根因。

### 4.2 `validate-content.js` 現況（read-only 讀證）

- **entrypoint**（line 1759+）：`isMain` guard → `const settings = await loadSettings()`（line 1762）。
- **registry-level 檢查（post loop 外，單次）**：
  - `validateDownloadRegistry(settings.downloadAssets, …)`（line 733）/ `validateDownloadRegistry(settings.downloadForms, …)`（line 741）：shape + duplicate-key（warning-only）。
  - `assetKeySet = buildDownloadKeySet(settings.downloadAssets, 'assets', 'assetId')`（line 754）/ `formKeySet = buildDownloadKeySet(settings.downloadForms, 'forms', 'formId')`（line 755）：for R2 ref-not-found。
  - `validateCommerceLinkRegistry(settings.commerceLinks, …)`（line 765）：11 條 registry-level rule。
  - `commerceLinkIdSet = buildCommerceLinkIdSet(settings.commerceLinks)`（line 776）：for C3 ref-not-found。
- **post 載入**：`loadPosts({ site, settings })`（github / blogger + `validation-fixtures/github` / `validation-fixtures/blogger`，line 1768–1780）；以 fast-glob 掃 `.md`（drafts/archived 過濾）。
- **post-side 檢查**：per-post loop（line ~1452）呼叫 `validateCommerceRefs(post.affiliate, sourcePath, issues, commerceLinkIdSet)`。
- **關鍵事實**：registry keyset / entry-map 在 post loop **外、單次**建構，來源**只有** `settings.*`（即 loader 之白名單載入結果）；validator **不** `readdir` `content/settings/` → `_sample.*.json` 永不被掃。

### 4.3 `SETTINGS_FILES` whitelist

- 15 個具名 production 檔（site / themes / categories / tags / series / ads / social-links / promotion / affiliate-networks / link-rules / seo / ga4 / navigation / sidebar / footer）。
- `series.json` 在白名單；`_sample.series.json` **不**在白名單 → 證明同目錄 `_sample.*` 之天然忽略。
- commerce / download registry **不**在 `SETTINGS_FILES`，改由具名 `readJsonOptional` 載入（仍是顯式檔名，非 glob）。

### 4.4 registry loading / validation 現況

| registry | loader 來源 | validator 消費 |
| --- | --- | --- |
| commerce | `readJsonOptional('commerce-links.json')` → unwrap `settings.commerceLinks` | `validateCommerceLinkRegistry`（registry-level）+ `buildCommerceLinkIdSet` → `validateCommerceRefs`（C1..C8） |
| download asset | `readJsonOptional('download-assets.json')` → `settings.downloadAssets` | `validateDownloadRegistry` + `buildDownloadKeySet`（R2） |
| download form | `readJsonOptional('download-forms.json')` → `settings.downloadForms` | `validateDownloadRegistry` + `buildDownloadKeySet`（R2） |

- 三者皆 empty `[]` → 所有 registry-coupled 檢查（C3 against empty → 任何 ref 皆 not-found，但 production 0 ref → 0 觸發；download R2 同理）對 production posts 全 0 觸發。

### 4.5 `validate:content` npm script 現況

- `package.json` scripts：`"validate:content": "node src/scripts/validate-content.js"`（無參數、無 env、無 flag）。
- 執行：`node src/scripts/validate-content.js` → `isMain` true → `loadSettings()` + `loadPosts()` → 輸出 `N error(s) / M warning(s) on K post(s)`。
- **無任何現存 overlay / fixture-mode / test-mode 入口**：validator 目前無條件讀 production settings。

### 4.6 resume：overlay 注入之可能切面

從 §4.1–4.5 讀證，overlay 注入有兩個物理上可行的切面：

1. **loader-level**（`load-settings.js` 接受 overlay path，替換 `settings.commerceLinks` 等）：⚠️ 缺點 = `loadSettings()` 被 build / dev / renderer 共用 → overlay 會洩漏進 build path（§9 / §13 詳述）。
2. **validate-content-level**（`validate-content.js` main 在 gated flag 下，改用 overlay array 建 keyset / entry-map，而非 `settings.*`）：✅ 優點 = `loadSettings()` 維持純 production；build / renderer 完全不觸 overlay。
- ⚠️ **例外**：download renderer real-path（`build-github.js` 經 `loadSettings` 讀 `settings.downloadAssets`）為 **build-time**，非 validate-time → validate-content-level overlay **不**覆蓋它；download renderer real-path smoke 須另行 loader-level / temp-registry 機制（§11.3 / §13.1）。

---

## 5. Overlay Design Goals

凍結 Option D overlay 之設計目標（任何 activation / shape / merge 選項皆須通過）：

1. **只在 validation / testing 情境使用**：overlay 僅服務 `validate:content` 之測試路徑；不服務 build / dev / preview / report / Admin / deploy。
2. **預設 production path 不讀 overlay**：不傳 flag / 不跑 overlay script 時，validator 行為與今日 byte-identical → baseline 0/69/59 不變。
3. **不影響 build / renderer / Admin**：`loadSettings()`（build / dev / renderer 共用）維持純 production path；overlay 不進 `dist/` / `dist-blogger/` / Admin 顯示。
4. **不讓 overlay 被誤認為 production registry**：overlay 檔須與 production `content/settings/*.json` 物理分離（落 `content/validation-fixtures/settings/**`）、檔名前綴明示（`_test-*`）、內容 placeholder（`example.invalid` + fixture-namespaced）。
5. **不需要真實商業資料**：overlay entry 一律 fixture-namespaced key + RFC 2606 reserved URL；不放真實 affiliate / download / tracking / token / merchant / Google Form / respondent / commission 資料。
6. **可支援 C4 / C9 / download real-path fixture / smoke**：overlay 須能提供 `active:false` + `replacementTarget` entry（C4）、非空 `internalLabel` entry（C9）、asset `{assetId,title,fileType}` / form `{formId,title}` entry（download R2 / real-path 參照）。

---

## 6. Activation Options

比較 6 種 activation 機制。每種評估 10 維度：mutation surface / accidental production activation risk / CI / local reproducibility / source complexity / respects no-auto-inference / can test C4 / can test C9 / can test download real-path / requires fixture files + leak risk。

### 6.1 候選定義

| 代號 | 機制 |
| --- | --- |
| **A** | explicit CLI flag：`node validate-content.js --registry-overlay <path>` |
| **B** | environment variable：`VALIDATION_REGISTRY_OVERLAY=<path>` |
| **C** | fixed-path convention：validator 自動讀 `content/validation-fixtures/settings/*.json`（presence-based） |
| **D** | sample files auto-promoted as overlay：test-mode 下自動讀 `_sample.*.json` |
| **E** | separate npm script：`validate:content:overlay`（內部供 flag / 指向 fixture overlay） |
| **F** | inline-code synthetic overlay object：validator / test 內 hardcode mock registry |

### 6.2 比較表

| 維度 | A CLI flag | B env var | C fixed-path | D sample auto-promote | E separate script | F inline synthetic |
| --- | --- | --- | --- | --- | --- | --- |
| mutation surface | argv parse + load helper | env read + load helper | readdir/glob settings-fixtures + load | 讀 `_sample.*` 路徑 + 條件 | script + flag plumbing（≈A）| 源碼內 hardcode object |
| accidental production activation | **極低**（須顯式傳 flag）| ⚠️ **中-高**（env 殘留於 shell / CI profile → 靜默啟用）| ⚠️ **中-高**（stray fixture 檔 presence → 靜默改 baseline）| ⚠️ **高**（sample 檔已存在 → 一旦 test-mode 即誤觸）| **極低**（預設 script 不變）| ⚠️ 中（依 test-mode 旗標）|
| CI / local reproducibility | **高**（flag 顯式入命令）| ⚠️ 低（env 不可見、跨機不一致）| 中（依檔案存在；隱式）| 低（混淆 sample 與 test）| **高**（script 在 package.json，自述）| 中（綁原始碼版本）|
| source complexity | **低**（單一 flag + path resolve + 既有 build* helper）| 低（env 取代 flag）| **中**（新增 readdir/glob；偏離白名單原則）| 中（須區分 sample vs overlay）| 低（wrapper script + flag）| 中-高（source test seam；§1/§29）|
| respects no-auto-inference | ✅ 是（explicit path）| ✅ 是（explicit path）| ⚠️ **否**（presence-based 自動推斷）| ⚠️ **否**（auto-promote = 推斷 sample 為 test）| ✅ 是（顯式 script + path）| ✅ 是（顯式但 hardcode）|
| can test C4 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| can test C9 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| can test download real-path | ⚠️ validate R2 only（renderer real-path 須 build-time，§4.6）| ⚠️ 同 A | ⚠️ 同 A | ⚠️ 同 A | ⚠️ 同 A | ⚠️ 同 A |
| requires fixture files | ✅ 是（overlay JSON）| ✅ 是 | ✅ 是 | ❌ 否（複用 sample）| ✅ 是 | ❌ 否（hardcode） |
| leak risk | **低**（repo-local path + reserved 值 + 不 echo）| 中（env 值可能含絕對路徑 / 外部路徑）| 低（repo-local）| 中（sample 與 production 混淆易誤複製）| **低** | 低（但測資綁源碼）|

### 6.3 各候選裁決

- **A（CLI flag）** → ✅ **推薦（核心機制）**：accidental activation 最低、reproducibility 最高、source complexity 最低、尊重 no-auto-inference。唯一需配 path 護欄（§7）。
- **B（env var）** → ❌ **reject**：env 殘留風險（shell profile / CI export 後靜默啟用 → 預設命令意外讀 overlay → baseline 污染）；reproducibility 低（env 不可見）。
- **C（fixed-path convention）** → ❌ **reject（作核心機制）**：presence-based 自動推斷違反 no-auto-inference；stray fixture 檔靜默改 baseline；且須 validator 新增 readdir/glob → 偏離「白名單 loader」既有架構原則。⚠️ 註：am-2 凍結之 path naming（`content/validation-fixtures/settings/commerce-links/_test-<rule-id>.json`）作為 overlay 檔之**落點**仍採用（§8.1）；但「**自動發現**」該路徑下檔案之觸發方式被否決 —— overlay 檔須由 flag **顯式指定**，非靠 presence 自動讀。
- **D（sample auto-promote）** → ❌ **strong reject**：崩解 `_sample.*` 「永不被消費」之全部設計前提（sample design §3.2 四條邊界 / §8）；使 sample 檔 load-bearing；混淆「blueprint vs 可測載體」。overlay 須是與 `_sample.*` 不同檔、不同層之 fixture-scoped 檔。
- **E（separate npm script）** → ✅ **推薦（ergonomics / safety wrapper）**：預設 `validate:content` 完全不變 → baseline byte-identical；overlay 僅在顯式跑 `validate:content:overlay` 時生效；script 在 package.json 自述 → reproducibility 高。E 是 A 之顯式包裝（內部供 `--registry-overlay <fixture path>`），非獨立第三機制。
- **F（inline synthetic）** → ❌ **reject**：= seed governance Option E mock-inject；為單一測試引入 source test seam = 過度工程化（CLAUDE.md §1 / §29）；測資綁源碼、不可獨立 iterate。

> **結論：採 A（CLI flag）為 source 機制 + E（separate script）為顯式包裝；B / C / D / F 全否決。**

---

## 7. Recommendation

### 7.1 最保守推薦

> **未來 Option D overlay = explicit CLI flag（`--registry-overlay <repo-local fixture path>`）+ 獨立 npm script（`validate:content:overlay`）雙層機制。** 預設 `validate:content` 維持 overlay-blind（baseline byte-identical）；overlay 僅在顯式 flag / script 啟用時生效。

### 7.2 是否建議 explicit CLI flag 或 separate script

- ✅ **兩者皆建議，且互補**：CLI flag（A）= source-level 機制（validator 認得 `--registry-overlay`）；separate script（E）= 顯式包裝（`validate:content:overlay` 內部供 flag + 指定 repo-local fixture path）。
- 預設 `validate:content` **不**帶 flag → 永遠讀 production → baseline 不變。

### 7.3 是否禁止 auto-promote `_sample.*.json`

- ✅ **強制禁止**。`_sample.*.json` 之全部價值在「永不被消費」；auto-promote 會崩解此前提。overlay 檔須與 `_sample.*` 不同檔、不同層（fixture-scoped `_test-*.json` under `content/validation-fixtures/settings/**`）。

### 7.4 是否應要求 explicit path

- ✅ **是**。overlay 一律須 flag 顯式指定 path；**禁止** presence-based 自動發現（Option C 之自動觸發被否決）。顯式 path 是 no-auto-inference 紅線之延伸。

### 7.5 是否應只允許 repo-local fixture path

- ✅ **是**。overlay path 須解析後落在 repo 內（建議限定 `content/validation-fixtures/settings/**` 子樹）；**拒絕** repo 外絕對路徑、`..` 逃逸、網路 URL（§12.7）。理由：overlay 內容會進 validator 輸出 / 可能被 commit；repo-local 確保內容受版本控管、受紅線審查。

### 7.6 是否應禁止 production settings path 當 overlay

- ✅ **是**。`--registry-overlay` **禁止**指向 `content/settings/commerce-links.json` / `download-*.json` 等 production registry（或任何 `content/settings/*.json`）。理由：(a) 避免「用 production 當測試載體」之循環；(b) 避免 production 真實 entry（未來 Option G）洩漏進測試輸出；(c) 維持 overlay 與 production 之物理分界。建議 source 端加 path guard：reject 任何解析後落在 `content/settings/` 之 overlay path。

---

## 8. Overlay File Shape

⚠️ **本 phase 不建立 overlay 檔；以下為未來 overlay 檔之 shape 凍結（shape only）。**

### 8.1 overlay 落點與檔名

- 落點：`content/validation-fixtures/settings/<registry>/_test-<rule-id>.json`（am-2 凍結之 Option A path naming；如 `content/validation-fixtures/settings/commerce-links/_test-commerce-ref-inactive.json`）。
- 與 production `content/settings/*.json` 物理分離；與 `_sample.*.json` 不同檔、不同層。
- 檔名 `_test-*` 前綴明示 fixture-scoped。

### 8.2 commerce overlay 需要哪些欄位

對齊 night-18 registry schema + C4 / C9 測試需求：

| 欄位 | 用途 | C4 | C9 |
| --- | --- | --- | --- |
| `linkId` | machine key（post ref 指向）| ✅ | ✅ |
| `active` | C4 trigger（`active:false`）| ✅ 需 `false` entry + `true` replacement | n/a |
| `replacementTarget` | 避免 R12 not-found / R14 missing-replacement | ✅ 指向 active linkId | n/a |
| `internalLabel` | C9 leak-equality 比對對象（非空）| n/a | ✅ 非空 namespaced 字串 |
| `displayLabel` | 對外顯示（避免 R8 internal-label）| ✅ | ✅ |
| `networkKey` | R11（對齊 `affiliate-networks.json` 或故意不存在）| ⚠️ 視測試目的 | ⚠️ |
| `targetUrl` | RFC 2606 reserved（避免 R6 missing-target-url）| ✅ `example.invalid` | ✅ |
| `notes` | 自述 sample-only | ✅ | ✅ |

### 8.3 download-assets overlay 需要哪些欄位

| 欄位 | 用途 |
| --- | --- |
| `assetId` | machine key（post `assetRefs[]` 指向；download R2 lookup）|
| `title` | renderer resolve 顯示文字（real-path）|
| `fileType` | renderer 顯示（`PDF` / `ZIP`）|
| direct URL | **不放**（real-path 只驗 title resolve，不驗 reachability；§12）|
| `notes` | 自述 sample-only |

### 8.4 download-forms overlay 需要哪些欄位

| 欄位 | 用途 |
| --- | --- |
| `formId` | machine key（post `formRef` 指向；download R2 lookup）|
| `title` | renderer resolve 顯示文字（real-path）|
| Google Form URL / id | **不放**（§12）|
| `notes` | 自述 sample-only |

### 8.5 是否可複用 `_sample.*.json` shape

- ✅ **schema shape 相同**：overlay 之 entry 欄位與 `_sample.*.json`（L3b）完全一致（皆對齊 production registry schema）；overlay 可直接套用 sample design §6 / §7 凍結之藍本。
- ❌ **但不可複用同一檔**：sample 檔（`content/settings/_sample.*`）不被消費；overlay 檔（`content/validation-fixtures/settings/**/_test-*`）被 flag 顯式讀。兩者不同檔、不同層；不可 auto-promote sample 為 overlay（§7.3）。
- ⚠️ **registry wrapper shape**：overlay 檔須採 production registry 之外層 wrapper（`{ schemaVersion, updatedAt, commerceLinks: [...] }` / `{ ..., assets: [...] }` / `{ ..., forms: [...] }`），因為 source 端 overlay loader 須 mirror loader 之 unwrap 邏輯（commerce 取 `.commerceLinks`、download 取 registry object）。

### 8.6 是否需要 metadata 標示 overlay-only

- ✅ **建議**：overlay 檔內 `$comment`（陣列）自述「overlay-only test fixture；僅由 `--registry-overlay` flag 讀取；不得加入 loader 白名單；不得複製為 production registry；placeholder only」。
- ⚠️ `schemaVersion` 可設異常值（如 `0`）作額外信號「非 production」（mirror sample design §9.3）。
- ⚠️ 此 metadata 為**人類防呆**；source 端不靠 metadata 判定 overlay 身分（身分由「被 flag 顯式指定」決定）。

---

## 9. Source Touch Points Preflight

⚠️ **本輪不得改 source；以下為未來實作可能觸及之 function / file 盤點。**

### 9.1 可能會改哪些 function / file

| file | 可能變動 | 紅線 |
| --- | --- | --- |
| `src/scripts/validate-content.js`（main，line 1759+）| argv parse `--registry-overlay`；gated 改用 overlay array 建 keyset / entry-map | 預設無 flag → 行為不變 |
| `src/scripts/validate-content.js`（helpers）| `buildCommerceLinkIdSet` / `buildCommerceLinkEntryMap`（未來 C4/C9）/ `buildDownloadKeySet` 接受 overlay array（既有 signature 可複用，只換資料源）| 不改 helper 既有語意 |
| **新 helper**（建議）| `loadValidationOverlay(path)`：read + parse + shape-guard + repo-local path guard；回傳 `{ commerceLinks?, downloadAssets?, downloadForms? }` 或 null | 純 validator-scoped；不進 loader |
| `package.json` scripts | 新增 `validate:content:overlay`（供 flag + repo-local fixture path）| 不改既有 `validate:content` |
| `content/validation-fixtures/settings/**` | 新增 overlay `_test-*.json`（屬未來 fixture phase，非 source phase）| placeholder only |

### 9.2 `load-settings.js` 是否應接受 overlay path

- ❌ **不建議**。`loadSettings()` 被 `build-github.js` / `build-blogger.js` / vite / report scripts 共用；若 loader 接受 overlay → overlay 會洩漏進 build / dev / renderer / report → 違反 §5 goal 2 / 3。
- ✅ **建議**：overlay 解析放在 `validate-content.js` main（gated by flag）；`loadSettings()` 維持純 production path（單一職責，零 build 污染）。
- ⚠️ **例外**：download renderer real-path smoke（build-time）若未來要驗，須**另行**機制（loader-level overlay 或 temp-registry，§11.3 / §13.1）；該機制與本 validate overlay 分開設計、分開 approval。

### 9.3 `validate-content.js` 是否應 merge / replace registry

- ✅ **replace**（§10 詳述）：overlay active 時，registry keyset / entry-map 完全由 overlay array 建構，`settings.commerceLinks` / `downloadAssets` / `downloadForms` 被忽略。
- ❌ 不 merge（避免 production 與 overlay 混合、避免未來 production seeded 後之 duplicate-key noise）。

### 9.4 是否需要新增 helper（loadValidationOverlay / mergeRegistryOverlay）

- ✅ `loadValidationOverlay(path)`：建議新增（read + parse + shape-guard + repo-local / non-production-settings path guard）。
- ❌ `mergeRegistryOverlay`：**不建議**（採 replace，無 merge 邏輯需求；避免 merge 之 duplicate / leak 複雜度）。

### 9.5 是否應避免 build / runtime code path 讀 overlay

- ✅ **絕對避免**。overlay 只在 `validate-content.js` main（validate-time、gated by flag）被讀；`loadSettings()` / build / dev / preview / renderer / report / Admin / deploy code path **永不**讀 overlay。此為 §5 goal 2 / 3 與 §13 之核心保證。

### 9.6 本輪不得改 source

> 本 phase **不**改 `load-settings.js` / `validate-content.js` / `package.json` / 任何 src。§9 僅盤點未來 touch points，作為後續 source phase 之設計依據。

---

## 10. Merge Semantics

比較 4 種 merge semantics。

### 10.1 候選

| 代號 | 語意 |
| --- | --- |
| **A** | overlay **replaces** production registry（overlay active → 完全取代 `settings.*`，production 被忽略）|
| **B** | overlay **merges into** production registry（overlay entries 併入 production entries）|
| **C** | overlay only used when production registry **empty**（production 有 entry 時不用 overlay）|
| **D** | overlay **isolated per fixture**（每個 fixture post 配對自身 overlay）|

### 10.2 比較與裁決

- **A（replace）** → ✅ **推薦**：
  - overlay active 時 keyset / entry-map 完全由 overlay 建構，production `commerceLinks` 等被忽略 → **production 真實 entry（未來 Option G）絕不洩漏進測試輸出**。
  - 今日 production empty → replace ≡ merge，但 replace 對未來更安全（production seeded 後仍隔離）。
  - 實作最單純（換資料源，不需合併邏輯）。
- **B（merge）** → ❌ **reject**：production seeded 後，merge 可能產生 duplicate-key noise（overlay linkId 與 production linkId 撞）+ production 真實 entry 進測試輸出 → 洩漏風險。
- **C（only-when-empty）** → ❌ **reject**：行為隨 production 是否 seeded 而變（脆弱、隱式）；production seeded 後 overlay 靜默失效 → 測試不可靠。
- **D（isolated per fixture）** → ⚠️ **defer**：最granular（每 fixture post 配自身 overlay），但須 per-post overlay 關聯機制 → 偏離「registry keyset 在 post loop 外、單次建構」之既有架構（§4.2）→ 複雜度高。v0 採 A（單一 overlay 供整次 validate run）；per-fixture isolation 留未來如有需求再評估。

> **結論：採 A（replace）。** overlay active → 單一 overlay 檔取代對應 registry；production 被忽略；無 merge 邏輯。

### 10.3 討論項

- **duplicate key handling**：overlay 內部 duplicate key 由既有 `buildCommerceLinkIdSet`（Set dedup）/ `validateDownloadRegistry`（duplicate-key warning）/ 未來 `buildCommerceLinkEntryMap`（last-wins）處理 —— 與 production 同邏輯，無新規則。overlay vs production 之 cross-duplicate 不存在（replace 語意下 production 被忽略）。
- **active:false / replacementTarget**：overlay 須同時提供 `active:false` entry（C4 trigger）+ 其 `replacementTarget` 指向之 `active:true` entry（避免 R12 not-found / R14 missing-replacement 之 registry-level cascade）。⚠️ overlay active 時，registry-level rule（`validateCommerceLinkRegistry`）若也跑於 overlay → 會對 overlay entry 產生**預期內**之 registry-level warning delta（須於 fixture phase 計入；§11.5）。
- **internalLabel for C9**：overlay entry 帶非空 `internalLabel`（C9 比對對象）；C9 message **絕不 echo** internalLabel（C9 doc §7 / §13）；overlay 之 internalLabel 用無意義 namespaced 字串（不像真實內部代號）。
- **download asset/form refs**：overlay 提供 `{assetId,title,fileType}` / `{formId,title}` → validator R2 ref-not-found 可解析；⚠️ renderer real-path（build-time）不在 validate overlay 範圍（§11.3）。
- **how to prevent production data leak into test output**：(a) replace 語意（production 被忽略）；(b) overlay 內容 placeholder（reserved URL + fixture-namespaced）；(c) message 不 echo 敏感欄位（C6 不 echo url / C9 不 echo internalLabel）；(d) overlay path guard 禁止指向 production settings（§7.6）。

---

## 11. Fixture Strategy After Overlay

⚠️ **本 phase 不建立任何 fixture；以下為 overlay landed 後之 fixture 規劃。**

### 11.1 C4 fixture 需要什麼 post ref

- overlay 內 ≥1 筆 `{ linkId:"sample-commerce-inactive", active:false, replacementTarget:"sample-commerce-active", … }` + ≥1 筆 `{ linkId:"sample-commerce-active", active:true, … }`（藍本 = `_sample.commerce-links.json` 已備）。
- fixture post：`affiliate.links: [{ ref: "sample-commerce-inactive" }]` → 觸發 C4 `commerce-ref-inactive`（含 replacement linkId，不 echo targetUrl）。

### 11.2 C9 fixture 需要什麼 post labelOverride / ref

- overlay 內 ≥1 筆帶非空 `internalLabel` 之 entry（如 `{ linkId:"sample-commerce-c9", internalLabel:"sample-internal-label-c9", … }`）。
- fixture post：`affiliate.links: [{ ref:"sample-commerce-c9", labelOverride:"sample-internal-label-c9" }]`（`labelOverride` 故意 == entry.internalLabel → 觸發 C9 leak-equality）。
- ⚠️ message 不 echo internalLabel / labelOverride（驗 message shape）。

### 11.3 download real-path fixture 需要什麼 assetRefs / formRef

- ⚠️ **關鍵分界**：download real-path 有兩個維度：
  1. **validate-time R2**（`download-asset-ref-not-found` / `download-form-ref-not-found`）：validate overlay 可解 —— overlay 提供 `{assetId}` / `{formId}` → post `download.assetRefs:["sample-asset-pdf"]` / `formRef:"sample-form-signup"` → R2 不再 not-found。
  2. **build-time renderer real-path**（`build-github.js` `deriveRenderedDownloadLanding` resolved branch：resolve 出 asset title / form title 顯示）：**validate overlay 不覆蓋**（renderer 經 `loadSettings` 讀 production registry，非 validate overlay）。此維度須另行 loader-level overlay 或 temp-registry smoke（mirror pm-10：temp post + temp registry entry → build → grep resolved title → cleanup / no commit）。
- → download real-path fixture 須分兩 phase：validate R2 fixture（overlay 即可）vs renderer real-path smoke（build-time temp 機制，獨立 approval）。

### 11.4 是否應 source phase 和 fixture phase 分開

- ✅ **是**。建議：
  - **source phase**：land overlay flag + `loadValidationOverlay` helper + script + C9（+ C4 coupled）source（warning-only）；此時 overlay 檔尚不存在 → C4 / C9 仍 0 觸發 → baseline 不變。
  - **fixture phase**：建立 overlay `_test-*.json` + fixture post；此時 baseline +N（C4 / C9 / R2 + 預期 registry-level delta）。
- 分開之理由：source phase 可獨立 acceptance（驗「無 flag 時 byte-identical」）；fixture phase 之 baseline delta 獨立計量、獨立 review。

### 11.5 warning delta 如何控制

- **source phase**：overlay 檔不存在 + 預設無 flag → 0 觸發 → baseline 0/69/59 不變。
- **fixture phase**：每個 overlay + fixture post 之 delta 須事前計算並 log：
  - C4 fixture：+1 C4 warning（+ overlay entry 之 registry-level rule 若於 overlay-mode 跑 → 預期 R-delta；須計入）。
  - C9 fixture：+1 C9 warning。
  - download R2 fixture：post ref 解析後 R2 **不**觸發（正向測試）；須另設「ref-not-found」反向 fixture 才 +1。
- **紅線**：fixture phase 之 baseline delta 須全部來自 `content/validation-fixtures/**`（overlay + post），production registry 維持 empty → production 0 觸發。

---

## 12. Security / Privacy / Commercial Risk

| 風險類別 | 緩解（overlay contract 凍結） |
| --- | --- |
| 真實 affiliate URL | ❌ 禁；overlay `targetUrl` 一律 `https://example.invalid/…`（RFC 2606 reserved，不可達）|
| tracking id / sid / aff_id / merchant id | ❌ 禁；overlay key 一律 fixture-namespaced（`sample-*`）；不用 URL pattern 自動推斷 key |
| token / credential | ❌ 禁；overlay 不含 access / bearer / refresh token / session id / OAuth secret / API key |
| Google Form 真實 ID / respondent data | ❌ 禁；download form overlay 不含真實 Form URL / id / Sheet id；respondent data remain in Google |
| 私人下載連結 | ❌ 禁；download asset overlay 不含 direct download URL / Google Drive 直連 / 私人 Drive folder id |
| overlay log echo sensitive label / URL | ❌ 禁；C6 不 echo url（`:642`）/ C9 不 echo internalLabel / labelOverride；overlay-derived message 沿用「只報欄位名 + machine key + 風險類型」|
| overlay path 來自外部網路 | ❌ 禁；overlay path 須 repo-local（建議限 `content/validation-fixtures/settings/**`）；拒絕網路 URL / repo 外絕對路徑 / `..` 逃逸 |

> 共同原則：任何進 repo（commit）之 overlay / fixture / validator message 內容皆視為公開；商業 / 隱私 / 內部識別敏感資料一律不進 repo、不進 validator log。overlay 內容受版本控管 + 紅線審查 → 故須 repo-local。

---

## 13. Production / Build / Deploy Safety

### 13.1 overlay 不得讓 build:github / renderer consume

- ✅ overlay 注入點落在 `validate-content.js` main（gated by flag）；`loadSettings()`（build / dev / renderer / report 共用）維持純 production path → `build:github` / `build:blogger` / vite / renderer **永不**讀 overlay。
- ⚠️ download renderer real-path smoke（build-time）若未來要驗，須**另行** loader-level overlay 或 temp-registry 機制（§11.3）；該機制與 validate overlay 分開設計、分開 approval；且須遵守 pm-10 紅線（temp + cleanup + no commit + 不輸出真實 URL）。

### 13.2 overlay 不得改 production settings

- ✅ overlay path guard 禁止指向 `content/settings/*.json`（§7.6）；overlay 是讀取（replace registry data in-memory），**不**寫回任何 production 檔。

### 13.3 overlay 不得觸發 deploy / Blogger / GA4

- ✅ overlay 只服務 `validate:content` 之測試路徑；不觸 `build:*` / `gh-pages` deploy / Blogger 後台重貼 / GA4 commerce / download dimension（全部 dormant）。

### 13.4 overlay 不得解除 reverse UTM / pm-26 gate

- ✅ overlay 與 reverse UTM（pm-24 source landed; un-deployed）/ pm-26 deploy gate（BLOCKED）正交；overlay landed **不**改變 reverse UTM dormant / pm-26 blocked 狀態。

### 13.5 overlay 不得讓 Admin Apply 或 middleware 寫入

- ✅ overlay 是 validator-scoped 唯讀注入；不觸 Admin Apply / middleware write / admin-write-cli（全部 dormant）；overlay landed **不**啟動任何 write rail。

---

## 14. Recommended Future Phase Ladder

未來若要推進（**本輪不執行任一階**），建議安全階梯。每階須**獨立 user approval**，不得自動跨階；deploy / Blogger repost / GA4 / reverse UTM activation / pm-26 unblock 在任何階皆須 user 另行明確批准：

| 階 | 名稱 | 範圍 | 紅線 |
| --- | --- | --- | --- |
| **L4（本檔）** | Option D overlay source preflight（docs-only）| 凍結 activation（CLI flag + script）/ overlay shape / source touch points / merge（replace）/ fixture strategy / 護欄 | 不 source / 不建 overlay / 不 fixture / 不 seed |
| L4-acceptance | overlay preflight acceptance（read-only）| 核對本檔 §4 / §6 / §9 / §10 與既有 `load-settings.js` / `validate-content.js` / `package.json` 一致 | 不寫檔 |
| L5 | source implementation（source-only）| land `--registry-overlay` flag + `loadValidationOverlay` helper（repo-local + non-production path guard）+ `validate:content:overlay` script + C9（+ C4 coupled，共享 `buildCommerceLinkEntryMap`）warning-only；overlay 檔尚不存在 → 0 觸發 → baseline 不變 | 不 deploy / 不 Blogger / 不 GA4；預設 `validate:content` byte-identical |
| L6 | overlay fixture / smoke | 建 overlay `_test-*.json`（commerce inactive/c9 + download asset/form）+ fixture post；驗 C4 / C9 / R2 觸發 + message 不 echo 敏感值；download renderer real-path 另行 build-time temp smoke（mirror pm-10）| no commit of 敏感資料；baseline delta 全來自 validation-fixtures；temp cleanup |
| L7（如適當）| C4 / C9 coupled source + Admin / renderer | C4 / C9 視為同一 coupled source phase（共享 entry-map，避免兩度改 signature）；Admin selector（read；填 displayLabel 不填 internalLabel）+ renderer real-path display | write 維度另行授權；不 deploy |

> 注意：C9 與 C4 共享「registry entry map」需求（C9 doc §10.4 / C4 doc §6.3）→ L5 宜將 C9 + C4 視為**同一 coupled source phase**，避免兩度改 `validateCommerceRefs` signature。L5（source，overlay 檔不存在 → 0 觸發 → baseline 不變）與 L6（fixture，baseline +N）分開，使 source acceptance 可獨立驗「byte-identical」。

---

## Appendix A — Cross-reference index

| 主題 | 文件 / commit |
| --- | --- |
| registry seed governance（Option A..G + §13 ladder L4 = 本檔）| `docs/20260608-registry-seed-governance-preanalysis.md`（commit `bc744d4`）|
| registry sample blueprint design（§15 ladder L4 = 本檔；§8 loader/validator safety）| `docs/20260608-registry-sample-design-preanalysis.md`（commit `11b9623`）|
| commerce C9 display override risk standalone contract（leak-equality；不 echo internalLabel；§10.4 entry-map）| `docs/20260608-commerce-c9-display-override-risk-preanalysis.md`（commit `5fe290f`）|
| commerce C4 inactive ref preanalysis（registry coupling；§6.3 entry-map helper）| `docs/20260608-commerce-c4-inactive-ref-validation-preanalysis.md`（commit `8c9fddf`）|
| commerce settings fixture mechanism（Option D lock；Option A path naming escape hatch）| `docs/20260604-commerce-links-registry-fixture-mechanism-preanalysis.md`（commit `89cbf75`）|
| commerce content-reference validation（C1..C9 contract）| `docs/20260604-commerce-links-content-reference-validation-preanalysis.md` |
| download registry-aware validation（R2 ref-not-found / R5b duplicate）| `docs/20260602-download-registry-aware-validation-preanalysis.md` |
| download landing page renderer（placeholder smoke pm-10；build-time resolve）| `docs/20260603-download-landing-page-renderer-preanalysis.md` |
| sample settings 先例（build/loader 不讀）| `content/settings/_sample.series.json` |
| sample registry blueprints（L3b landed）| `content/settings/_sample.{commerce-links,download-assets,download-forms}.json`（commit `3b97cd4`）|
| 白名單 loader（SETTINGS_FILES + readJsonOptional；無 readdir）| `src/scripts/load-settings.js:10`（`SETTINGS_FILES`）/ `:37`（`readJsonOptional`）/ `:47`（`loadSettings`）/ `:65`（commerce unwrap）|
| validator registry 檢查（透過 loader key；不 readdir settings）| `src/scripts/validate-content.js:733`（download registry call）/ `:754`（buildDownloadKeySet）/ `:765`（commerce registry call）/ `:776`（commerceLinkIdSet）/ `:1452`（validateCommerceRefs call）/ `:1762`（loadSettings）|
| CLAUDE.md commerce / download 治理段 | `CLAUDE.md` §3（registry governance）|

---

## Appendix B — Baseline snapshot

```
date: 2026-06-08 12:49 +0800
repo: D:\github\blog-new\portable-blog-system
branch: main
HEAD: 3b97cd4e905d719c2386756f675f841c6d1ea480
origin/main: 3b97cd4e905d719c2386756f675f841c6d1ea480
ahead/behind: 0/0
working tree: clean
latest subject: docs(settings): add sample registry blueprints
validate: 0 errors / 69 warnings / 59 posts

registry-seed governance: accepted (bc744d4); 首選 Option F + G; 次選 Option D overlay
C9 standalone contract: accepted (5fe290f); leak-equality; 不 echo internalLabel
sample blueprints landed (L3b): _sample.{commerce-links,download-assets,download-forms}.json (3b97cd4); loader 白名單天然忽略; not consumed
commerce content-reference rules landed: C1 / C2 / C3 / C5 / C6 / C8
commerce content-reference rules: C4 docs-only plan (source blocked); C7 not recommended; C9 contract frozen (source not implemented)
commerce registry: empty []
download asset / form registry: empty []
commerce production ref / role / labelOverride usage: 0 / 0 / 0
download production assetRefs / formRef usage: 0
loader: 白名單 SETTINGS_FILES + 具名 readJsonOptional; 無 readdir/glob → _sample.* / overlay 永不被 loader 讀
validator: 透過 loader key 取 registry; post-glob 只掃 .md; 不 readdir settings; 無現存 overlay/test-mode 入口
commerce renderer / Admin / download real-path / build / deploy / Blogger repost / GA4: dormant
reverse UTM activation: dormant (pm-24 source landed; un-deployed)
pm-26: BLOCKED
Admin Apply / middleware write / admin-write-cli: dormant
```

---

## Appendix C — Overlay preflight quick card

```
purpose:        未來讓 validator 在 fixture 情境讀 overlay registry，以主動測 C4/C9/download R2
NOT:            production registry / _sample.* auto-promote / loader-level injection / build consume

activation 裁決:
  A CLI flag (--registry-overlay <repo-local path>) → ✅ 推薦（核心機制；explicit，不自動觸發）
  B env var (VALIDATION_REGISTRY_OVERLAY)           → ❌ reject（sticky；靜默啟用；不可重現）
  C fixed-path auto-discovery                       → ❌ reject（presence-based 推斷；偏離白名單；靜默 drift）
       （am-2 path naming 作 overlay 落點仍採用；但「自動發現」觸發被否決，須 flag 顯式指定）
  D sample auto-promote (_sample.*)                 → ❌ strong reject（崩解 sample「永不被消費」前提）
  E separate npm script (validate:content:overlay)  → ✅ 推薦（A 之顯式包裝；預設 validate:content 不變）
  F inline synthetic mock                           → ❌ reject（source test seam；過度工程化 §1/§29）

injection point: validate-content.js main (gated by flag)，NOT load-settings.js
                 → loadSettings() 維持純 production → build/renderer/Admin 永不讀 overlay
                 ⚠️ download renderer real-path (build-time) 須另行 loader-level/temp 機制（§11.3）

merge semantics: A replace（overlay 完全取代 settings.*；production 被忽略）→ ✅ 推薦
                 B merge / C only-when-empty → ❌ reject（duplicate/leak/脆弱）
                 D per-fixture isolated → ⚠️ defer（偏離單次建構架構）

overlay shape:   commerce {linkId,active,replacementTarget,internalLabel,displayLabel,networkKey,targetUrl,notes}
                 download asset {assetId,title,fileType,notes}（無 direct URL）
                 download form {formId,title,notes}（無 Form id）
                 落點 content/validation-fixtures/settings/**/_test-*.json（am-2 naming）
                 schema 同 _sample.*，但不同檔不同層；不可 auto-promote sample
                 registry wrapper 外層（{schemaVersion,commerceLinks|assets|forms:[...]}）

path guards:     repo-local only（限 content/validation-fixtures/settings/**）
                 禁 production settings path / 網路 URL / repo 外絕對路徑 / .. 逃逸

new helper:      loadValidationOverlay(path)（read+parse+shape-guard+path-guard）；不需 mergeRegistryOverlay
本 phase 輸出:   本 docs 檔；0 source / 0 overlay 檔 / 0 fixture / 0 seed / baseline 不變
紅線:            不放真實 affiliate/sid/aff_id/merchant/token/credential/Form/respondent/commission
                 不 echo internalLabel/labelOverride/url；overlay 不污染 build/deploy/Admin/reverse-UTM/pm-26
phase ladder:    L4(本檔) → L4-acceptance → L5 source(flag+helper+script+C9/C4 coupled；0 觸發)
                 → L6 overlay fixture/smoke（baseline +N）→ L7 C4/C9 coupled + Admin/renderer（每階獨立 approval）
下一步建議:      read-only acceptance 或 Final Idle Freeze；不 source / 不建 overlay / 不 fixture / 不 seed / 不 deploy
```

---

（本文件結束）
