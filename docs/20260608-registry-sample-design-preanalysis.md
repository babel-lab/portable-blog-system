# 2026-06-08 Registry Sample Blueprint Design — Preanalysis (docs-only)

Phase name: `20260608-pm-2-registry-sample-design-preanalysis-docs-only-a`
Date: 2026-06-08 12:24 +0800
Mode: **docs-only registry sample blueprint design preanalysis**（no source / no fixture / no new sample settings file / no settings registry mutation / no registry seed / no content / no templates / no renderer / no loader change / no validator rule landing / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no real affiliate link / download URL / merchant id / tracking id / token / credential / respondent data / no production content migration / no `npm install` / no CLAUDE.md mutation / no MEMORY mutation / no amend / rebase / force-push）

本檔對應 `docs/20260608-registry-seed-governance-preanalysis.md` §13 phase ladder 之 **L3（sample registry design，Option F docs-only）**。L1（seed governance docs-only acceptance）已隨 registry-seed governance doc accepted；L2（C9 standalone contract preanalysis）已隨 `docs/20260608-commerce-c9-display-override-risk-preanalysis.md`（commit `5fe290f`）landed and accepted。本輪只做 **L3 之 docs-only 變體**：設計 sample registry blueprint 之治理方案與欄位藍本，**不**建立任何 sample 檔（L3 之「可選建立 `_sample.*.json` template」延後至獨立 phase）。

---

## 0. Relation to prior phases

| 順序 | Phase / commit | 角色 |
| --- | --- | --- |
| night-20 `c1a6974` | commerce empty registry implementation | `commerce-links.json` empty registry |
| night-21 `78f1e9a` | commerce-links loader exposure | `settings.commerceLinks = []`；無下游 consumer |
| am-2 `89cbf75` | commerce settings fixture mechanism decision | **fixture mechanism = Option D（skip settings-level fixtures）**；Option A path naming 保留為未來 escape hatch |
| `39b89e3` / `281cd43` / `149efdc` / `3aeabbc` | commerce content-ref C1 / C2 / C3 / C5 / C6 source + fixtures | registry-independent rules landed |
| `8c9fddf` | commerce C4 inactive ref preanalysis（docs-only） | C4 contract 凍結；**source blocked by empty registry + Option D fixture lock** |
| `57c983b` / `bb33523` | commerce C8 invalid role source + fixture | post-side / 無 registry coupling；baseline → 69/59 |
| `bc744d4` | registry seed governance preanalysis（docs-only） | 共同 blocker = empty registry + Option D fixture lock；首選方向 = Option F + G；§13 ladder L3 = 本檔 |
| `5fe290f` | commerce C9 display override risk standalone preanalysis（docs-only） | C9 contract 凍結（leak-equality / 不 echo internalLabel）；C9 同 C4 為 registry-coupled、雙重 block |
| **pm-2（本 phase）** `（本 commit）` | **registry sample blueprint design preanalysis（docs-only）** | 為 Option F（獨立 sample settings 檔，build / loader 不消費）凍結**命名 / 落點 / 欄位藍本 / 安全護欄**，以支援未來 C4 / C9 / download real-path 之測試設計；**不**建立任何 sample 檔；**不**改 registry；**不**新增 fixture；**不**啟動任何 source |

本階段唯一目的為：

> 在 registry-seed governance accepted（首選 Option F sample 藍本 + Option G real entry；次選 Option D overlay）、C9 standalone contract accepted、commerce + download registries 仍 empty `[]`、production posts 0 使用 `ref` / 0 使用 `role` / 0 使用 `labelOverride` / 0 使用 `assetRefs` / `formRef` 之現況下，**先**為「sample registry blueprint」設計治理方案：定義其用途與邊界、盤點 `_sample.series.json` 既有先例、比較命名 / 落點選項、凍結 commerce / download 之欄位藍本與護欄、做 loader / validator safety 分析、標出 production pollution 風險與防呆、釐清與 Option F / G / D 之關係、為 C4 / C9 / download real-path 標出未來測試路徑、給安全 phase ladder。本階段**不**建立任何 sample 檔、**不**改任何 registry、**不**新增 fixture、**不**啟動 C4 / C7 / C9 / Admin / renderer source。

---

## 1. Executive Summary

### 1.1 本輪性質宣告

> **本輪為 docs-only registry sample blueprint design preanalysis。** 不建立任何 sample settings 檔；不改 registry；不 seed；不 source；不 fixture。不改 src / content / settings / templates / views / fixtures / package / lockfile / dist / gh-pages / .cache / CLAUDE.md / MEMORY。唯一輸出為本檔。

### 1.2 一句話結論

> **建議未來 sample registry blueprint 採 Option F 之命名 `content/settings/_sample.commerce-links.json` / `_sample.download-assets.json` / `_sample.download-forms.json`（mirror 既有 `_sample.series.json`：build / loader 以「顯式檔名白名單」載入 → `_sample.*` 永不被讀，零 runtime / 零 baseline 影響、不需任何 source ignore guard）。blueprint 之用途**僅**為「未來 C4 / C9 / download real-path source / fixture 設計之 schema 藍本與安全討論依據」，**不**是 production registry、**不**是 validation fixture、**不**是 source-level mock injection、**不**是 user 真實 seed。所有欄位一律用 fixture-namespaced placeholder + RFC 2606 reserved URL（`example.invalid`）；**絕不**放真實 affiliate URL / tracking id / merchant id / token / credential / Google Form / Drive 直連 / respondent data / commission 資料。本輪僅凍結藍本與護欄，**不**建立任何 sample 檔。下一階段建議 read-only acceptance cross-check 或 Final Idle Freeze；不得直接建 sample 檔、不得 seed registry、不得 source C4 / C9、不得 deploy / Blogger / GA4。**

### 1.3 推薦理由摘要

- **Option F 在本 repo 已有零風險先例**：`load-settings.js` 以**顯式檔名清單**（`SETTINGS_FILES` + 具名 `readJsonOptional` 呼叫）載入 settings，**無任何 `readdir` / glob** 掃描 `content/settings/`；`validate-content.js` 透過 loader 之具名 key 取 registry、以 fast-glob 掃 `.md` post，**不** `readdir` settings 目錄。故 `content/settings/_sample.*.json` 之檔案**永不被 loader 讀、永不被 validator 掃** —— 此即 `_sample.series.json` 已能在 baseline 0/69/59 下無痕共存之原因。
- **blueprint ≠ 可測載體**：sample 檔本身不被消費 → 無法直接觸發 C4 / C9 / download real-path（registry-seed governance §6.6 已標「間接」）。blueprint 的價值是**降低未來 Option D overlay / Option G real entry 落地時之 schema 設計風險**，而非取代它們。
- **欄位藍本可離線凍結**：C4 需 `active:false` + `replacementTarget`；C9 需 `internalLabel`；download real-path 需 asset `title` / `fileType`（無 direct URL）與 form `title`（無 Google Form id）。這些欄位 shape 可在不放真實資料下凍結，作為未來測試設計依據。
- **不違反紅線**：本 phase 為 docs-only；不放真實 affiliate / download / tracking / token / respondent 資料；不 mutate 任一 registry；reverse UTM 與 pm-26 維持 dormant / BLOCKED。

### 1.4 本 phase 範圍

- 定義 sample registry blueprint 之用途與四條「不是」邊界（§3）。
- 盤點 `_sample.series.json` 既有先例：可借用 / 不可借用之治理模式（§4）。
- 比較 6 個命名 / 落點選項（A..F）之 loader 誤讀 / validator 誤掃 / overlay 適配 / production 混淆 / 是否需 source guard（§5）。
- 凍結 commerce sample 欄位藍本（id / active / displayLabel / internalLabel / network / url placeholder / notes；哪些可 placeholder、哪些禁真實資料）（§6）。
- 凍結 download asset / form sample 欄位藍本（避免真實 fileUrl / Google Form / respondent；example.invalid / placeholder id；real-path vs preview/direct URL 邊界）（§7）。
- loader / validator safety 分析（是否會誤讀 / 誤掃 `_sample.*`；是否需 ignore guard；本輪不改 source）（§8）。
- production pollution 風險與防呆（§9）。
- 與 Option F / G / D 之關係（§10）。
- C4 / C9 / download real-path 未來測試路徑（§11 / §12）。
- 紅線（§13）。
- 推薦方向（§14）+ phase ladder（§15）+ final recommendation（§16）。
- 預設 baseline 不變動（0 errors / 69 warnings / 59 posts）。
- 給下一階段建議；不執行下一階段。

### 1.5 本 phase 不做的事

- ❌ 不建立任何 sample settings 檔（`_sample.commerce-links.json` / `_sample.download-assets.json` / `_sample.download-forms.json` 皆不建）。
- ❌ 不 seed 任何 production registry；維持 empty `[]`。
- ❌ 不 implement C4 / C7 / C9 source；不改 `validateCommerceRefs` / `validateDownloadRegistry` / `load-settings.js`。
- ❌ 不新增任何 fixture（post-level 或 settings-level）。
- ❌ 不啟動 download landing renderer real-path / Admin picker / selector。
- ❌ 不 migrate / mutate production posts；不新增 ref / role / labelOverride / assetRefs / formRef。
- ❌ 不 build / deploy / Blogger repost / GA4 validation / reverse UTM activation / pm-26 unblock。
- ❌ 不放任一真實 affiliate URL / download URL / merchant id / tracking id / sid / aff_id / token / credential / Google Form / respondent data / commission 資料。
- ❌ 不改 CLAUDE.md / MEMORY / auto-memory；不改既有 docs（只新增本檔）。
- ❌ 不 `npm install`；package / lockfile 不動。不 amend / rebase / force-push；不修正先前 commit subject 之 `@` 前綴。

---

## 2. Current Baseline

### 2.1 git / validate baseline（本 phase 開始時）

```
repo: D:\github\blog-new\portable-blog-system
branch: main
HEAD: 5fe290f35043ab72ec721de8e55370c8893545c1
origin/main: 5fe290f35043ab72ec721de8e55370c8893545c1
ahead/behind: 0/0
working tree: clean
latest subject: docs(commerce): plan C9 display override risk
validate: 0 errors / 69 warnings / 59 posts
```

### 2.2 governance / contract 已 accepted 範圍

- ✅ **registry seed governance doc accepted**（`bc744d4`）：共同 blocker = empty registry + Option D fixture lock；首選方向 = Option F（sample 藍本，不建檔）+ Option G（user real entry）；次選 = Option D overlay（須獨立 phase）；明確不建議 Option C（sample-in-registry）/ E（mock inject）。
- ✅ **C9 standalone contract doc accepted**（`5fe290f`）：rule id `commerce-ref-display-override-risk`、warning-only、target `affiliate.links[i].labelOverride`、trigger = leak-equality（`labelOverride.trim() === entry.internalLabel.trim()`）、message **絕不 echo** internalLabel / labelOverride 值、與 C1..C8 orthogonal、不對 ref-not-found entry 比對、不改 renderer；C9 同 C4 為 registry-coupled、被 empty registry + Option D fixture lock 雙重 block。
- ✅ commerce content-reference source / fixtures landed：C1 / C2 / C3 / C5 / C6 / C8（registry-independent）。
- 🔄 C4 `commerce-ref-inactive`：docs-only plan landed（`8c9fddf`）；source blocked。
- ❌ C7 `commerce-ref-missing-role`：不建議啟用。

### 2.3 registry / production 現況

- `content/settings/commerce-links.json` = `{ schemaVersion:1, updatedAt:"", commerceLinks:[], notes:"" }`（empty；R1-clean）。
- `content/settings/download-assets.json` = `{ schemaVersion:1, updatedAt:"", assets:[], notes:"" }`（empty）。
- `content/settings/download-forms.json` = `{ schemaVersion:1, updatedAt:"", forms:[], notes:"" }`（empty）。
- production posts 使用 `affiliate.links[].ref` = **0 篇**；`role` = **0 篇**；`labelOverride` = **0 篇**；`download.assetRefs[]` / `download.formRef` = **0 篇**。
- download landing renderer：placeholder path smoke-verified（pm-10）；real registry-resolved path 未測（registry empty）。
- seeded benign registry：`link-sources.json`（8 entries）/ `affiliate-networks.json`。
- sample（非 production-consumed）先例：`_sample.series.json`。
- 69/59 warnings 全屬 `content/validation-fixtures/`（validator 預期樣本，非 regression）。

### 2.4 dormant / blocked rails

- commerce renderer / Admin picker / selector / display：dormant。
- download landing real-path renderer / Google Forms 串接 / 下載頁：dormant（placeholder-only）。
- reverse UTM activation：dormant（pm-24 source landed; un-deployed）。
- pm-26 deploy gate：BLOCKED。
- Admin Apply / middleware write / admin-write-cli：dormant。
- build / deploy / Blogger repost / GA4 commerce / download dimension：dormant。

---

## 3. Design Goal

### 3.1 sample registry blueprint 的用途

> sample registry blueprint = **一份「故意非真實」之 registry entry shape 範本**，用途為：
> 1. 為未來 **C4 / C9 source preflight** 提供「entry 長什麼樣」之具體欄位依據（C4 需 `active:false` + `replacementTarget`；C9 需 `internalLabel`）。
> 2. 為未來 **download real-path source / smoke** 提供 asset / form entry 之欄位依據（title / fileType；不含直連）。
> 3. 為未來 **Option D overlay fixture** 設計提供 schema 藍本（overlay 之 fixture-scoped entry 可參照此 shape）。
> 4. 作為**安全討論依據**：讓 user / Claude 在不碰 production registry、不放真實資料下，討論「未來 seed 什麼欄位 / 什麼值」。

### 3.2 sample registry blueprint **不是**什麼（四條邊界）

| 不是 | 理由 |
| --- | --- |
| ❌ **不是 production registry** | 不被 loader 讀、不被任何 consumer 使用；production registry（`commerce-links.json` 等）維持 empty `[]`，由 Option G（user real entry）自然填入。 |
| ❌ **不是 validation fixture** | 不被 validator 掃；不觸發任何 rule；不改 warning count。validation fixture 是 `content/validation-fixtures/**/_test-*.md`（post-level），與 sample blueprint 不同層。 |
| ❌ **不是 source-level mock injection** | 不在 loader / validator 加 test seam（registry-seed governance §6.5 Option E reject = 過度工程化 §1/§29）。 |
| ❌ **不是 user real seed** | 不含任何真實 affiliate / download / tracking / token / merchant / Google Form / respondent / commission 資料；真實 entry 只能由 user 透過 Option G 提供。 |

### 3.3 本輪只凍結藍本，不建檔

> registry-seed governance §13 ladder L3 含「**可選**建立 `_sample.*.json` template」。本輪採其 **docs-only 變體**：只凍結命名 / 落點 / 欄位 shape / 護欄，**不**建立任何 sample 檔。建檔（若決定推進）屬獨立 phase（§15 L3b），須 explicit approval。

---

## 4. Existing Precedent — `_sample.series.json`

### 4.1 `_sample.series.json` 的治理模式

`content/settings/_sample.series.json` 現況（read-only 盤點）：

```jsonc
{
  "$comment": [
    "範本檔（template only）。複製到 content/settings/series.json 時，請刪除本 $comment 欄位。",
    "series.id 為穩定識別碼…",
    "本批為 sample 補強；build 系統尚未自動讀取本檔…"
  ],
  "series": [ { "id": "we-media-ai-52", "name": "…", "nameEn": "…", "titleTemplate": "…", "hashtags": [ … ] } ]
}
```

關鍵事實（loader / validator 行為，§8 詳述）：

- `load-settings.js` 之 `SETTINGS_FILES` 白名單**只列** `series.json`（line 15），**不**列 `_sample.series.json`；loader 無 `readdir` → `_sample.series.json` **永不被讀**。
- validator 之 series 檢查（validate-content.js:1216）比對 post `series[].id` 是否存在於 **`series.json`**（非 `_sample.*`）；`_sample.series.json` 不參與。
- 故 `_sample.series.json` 在 baseline 0/69/59 下**無痕共存**：build 不讀、validator 不掃、不計入 warning。

### 4.2 可借用之治理模式（✅ adopt）

- ✅ **`_sample.` 檔名前綴**：與 production 同類檔名（`series.json` ↔ `_sample.series.json`）並列，前綴明示「非 production」。
- ✅ **`$comment` 自述欄位**：在檔內首欄註明「template only / build 不讀取 / 複製到 production 檔時請刪除本欄」，作為人類防呆。
- ✅ **顯式檔名白名單 loader（既有架構）**：loader 不 glob → sample 檔零 runtime 影響，**不需任何 source ignore guard**。
- ✅ **template-only 心智**：sample 檔是「給人看 / 給未來 phase 參照」，不是「給 build / validator 吃」。

### 4.3 不可借用之部分（❌ do not borrow）

- ❌ **不借用「複製到 production 即生效」之引導語**對 commerce / download 之適用方式：`_sample.series.json` 之 `$comment` 引導「複製到 `series.json`」是安全的（series 無敏感資料）；但 commerce / download sample **不可**引導「複製到 production registry」，因 sample 之 placeholder（`example.invalid` URL / fixture-namespaced key）複製進 production 會造成 R1-clean 破壞 + registry-level warning drift（R6 missing-target-url / R7 invalid-target-url / R11 invalid-network-key 等）。→ commerce / download sample 之 `$comment` 須改為「**僅供 schema 參照；不得整檔複製為 production registry；真實 entry 由 user 依紅線手填**」。
- ❌ **不借用 series 之「低敏感度可放真實值」慣例**：`_sample.series.json` 放了真實系列名（`自媒自創…`）—— 因 series name 是公開顯示資料、無商業敏感度。commerce / download sample **不可**放任何真實值（affiliate / tracking / merchant / Form / Drive 皆高敏感）→ 一律 fixture-namespaced placeholder。

---

## 5. Sample Naming / Location

比較 6 個命名 / 落點選項。評估維度：是否易被 production loader 誤讀 / 是否易被 `validate:content` 誤掃 / 是否適合 future overlay/test harness / 是否會混淆 production settings / 是否需 source ignore guard。

### 5.1 候選

| 代號 | 路徑 |
| --- | --- |
| **A** | `content/settings/_sample.commerce-links.json` |
| **B** | `content/settings/_sample.download-assets.json` |
| **C** | `content/settings/_sample.download-forms.json` |
| **D** | `docs/examples/*.json` |
| **E** | `docs/samples/*.json` |
| **F** | `test/fixtures/settings/*.json` |

（A / B / C 為「同目錄 `_sample.` 前綴」家族，mirror `_sample.series.json`；D / E 為 docs 子目錄；F 為新建 test 目錄。）

### 5.2 比較表

| 維度 | A/B/C（`content/settings/_sample.*`）| D（`docs/examples/`）| E（`docs/samples/`）| F（`test/fixtures/settings/`）|
| --- | --- | --- | --- | --- |
| 易被 production loader 誤讀 | ❌ **不會**（loader 白名單只列具名 production 檔；無 glob；`_sample.*` 永不讀）| ❌ 不會（loader 只讀 `content/settings/`）| ❌ 不會 | ❌ 不會 |
| 易被 `validate:content` 誤掃 | ❌ **不會**（validator 透過 loader 取 registry；post-glob 只掃 `.md`；不 `readdir` settings）| ❌ 不會 | ❌ 不會 | ❌ 不會（除非未來 validator 新增掃 `test/`）|
| 適合 future overlay / test harness | ✅ **高**（與 production registry 同目錄、同 schema family；overlay sourcePath 改寫最自然）| ⚠️ 中（docs 路徑與 settings 分離；overlay 需跨目錄引用）| ⚠️ 中（同 D）| ✅ 高（test harness 慣常落點；但本 repo 無 test 框架，§29）|
| 是否混淆 production settings | ⚠️ **輕**（同目錄，但 `_sample.` 前綴 + `$comment` 明示；mirror 既有 series 先例）| ❌ 不混淆（docs 與 settings 物理分離）| ❌ 不混淆 | ❌ 不混淆 |
| 是否需 source ignore guard | ❌ **不需**（白名單 loader 天然忽略；零 source 改動）| ❌ 不需 | ❌ 不需 | ❌ 不需 |
| 既有先例 | ✅ `_sample.series.json` 已證可行 | ❌ 無 `docs/examples/` 目錄 | ❌ 無 `docs/samples/` 目錄 | ❌ 無 `test/` 目錄（CLAUDE.md §29 第一版未規劃 test 框架）|
| 可發現性（給未來 phase 參照）| ✅ 高（與 production registry 並列，一眼對照欄位）| 中（docs 內，需翻找）| 中 | 低（test 目錄需另建立慣例）|
| rollback 成本 | 極低（刪檔）| 極低 | 極低 | 低（須連帶移除 test 目錄慣例）|

### 5.3 裁決

- ✅ **首選 = A / B / C（`content/settings/_sample.commerce-links.json` / `_sample.download-assets.json` / `_sample.download-forms.json`）**：唯一有零風險既有先例（`_sample.series.json`）；白名單 loader 天然忽略 → **不需 source ignore guard**；與 production registry 同目錄同 schema family → 對未來 Option D overlay 與欄位對照最自然；唯一缺點「同目錄輕度混淆」由 `_sample.` 前綴 + `$comment` 防呆緩解（§9）。
- ⚠️ **次選 = E（`docs/samples/`）**：物理分離 → 零混淆風險；但須新建目錄、可發現性中、與 overlay 跨目錄引用較不自然。若 user 對「同目錄混淆」有疑慮，E 為合理退路。
- ❌ **不建議 D（`docs/examples/`）**：與 E 同性質但命名 `examples` 易與 docs 內既有說明性 JSON 片段混淆；無增益。
- ❌ **不建議 F（`test/fixtures/settings/`）**：本 repo 第一版未規劃 test 框架（CLAUDE.md §29）；新建 `test/` 目錄 = 引入新慣例 = 輕度過度工程化；且 validator 若未來誤掃 `test/` 反成風險。

> ⚠️ **所有選項皆「本輪不建檔」**；§5.3 僅凍結「若未來建檔，採 A/B/C」之方向。

---

## 6. Commerce Sample Blueprint

⚠️ **本 phase 不建立 sample 檔；以下為未來 `_sample.commerce-links.json` 之欄位藍本凍結（shape only）。**

### 6.1 sample commerce entry 欄位藍本

對齊 night-18 凍結之 registry schema（`linkId` / `internalLabel` / `displayLabel` / `targetUrl` / `networkKey` / `active` / `replacementTarget`）：

| 欄位 | 型別 | sample 值策略 | 可 placeholder | 禁真實資料 |
| --- | --- | --- | --- | --- |
| `linkId` | string | fixture-namespaced（如 `sample-commerce-active` / `sample-commerce-inactive`）| ✅ | ✅ 禁真實 linkId |
| `active` | boolean | C4 藍本需同時示範 `true`（正常）與 `false`（下架）| ✅（布林無敏感）| n/a |
| `displayLabel` | string | 明顯 sample 字串（如 `Sample Store A`）| ✅ | ✅ 禁真實通路內部稱呼 |
| `internalLabel` | string | 無意義 namespaced（如 `sample-internal-label-a`）| ✅ | ✅ **禁真實內部識別 / 結算分類 / 通路內部代號** |
| `networkKey` | string | 須對齊 `affiliate-networks.json` 既有 key**或**故意不存在（視測試目的）| ✅ | ✅ 禁真實帳號關聯 |
| `targetUrl` (url placeholder) | string | **RFC 2606 reserved**：`https://example.invalid/sample-commerce-a` | ✅ | ✅ **禁真實 affiliate URL / tracking id / sid / aff_id** |
| `replacementTarget` | string | C4 藍本：`inactive` entry 指向另一 `active` sample linkId（避免 R12 / R14）| ✅ | ✅ 禁真實 linkId |
| `notes` | string | 自述「sample only; not production; not a real merchant」| ✅ | ✅ 禁敏感備註 |

### 6.2 C4 需要的 sample shape

C4（`commerce-ref-inactive`）trigger = `ref` 命中 registry **且** entry `active === false`。藍本需：

```jsonc
// 藍本（非真實；本輪不建檔）
{
  "linkId": "sample-commerce-inactive",
  "active": false,
  "replacementTarget": "sample-commerce-active",   // 指向 active entry，避免 R12 not-found / R14 missing-replacement
  "displayLabel": "Sample Store (retired)",
  "internalLabel": "sample-internal-label-retired",
  "networkKey": "<對齊或故意不存在>",
  "targetUrl": "https://example.invalid/sample-commerce-retired",
  "notes": "sample only; not production"
}
```
+ 一筆 `{ "linkId": "sample-commerce-active", "active": true, … }`（replacement 目標）。
+ 未來 C4 fixture post：`affiliate.links: [{ ref: "sample-commerce-inactive" }]`。

### 6.3 C9 需要的 sample shape

C9（`commerce-ref-display-override-risk`）trigger = post `labelOverride.trim() === entry.internalLabel.trim()`。藍本需 entry 帶**非空 `internalLabel`**：

```jsonc
// 藍本（非真實；本輪不建檔）
{
  "linkId": "sample-commerce-c9",
  "active": true,
  "displayLabel": "Sample Store C9",
  "internalLabel": "sample-internal-label-c9",      // C9 比對對象；無意義 namespaced 字串
  "networkKey": "<對齊>",
  "targetUrl": "https://example.invalid/sample-commerce-c9",
  "notes": "sample only; internalLabel is a meaningless namespaced token, NOT a real internal code"
}
```
+ 未來 C9 fixture post：`affiliate.links: [{ ref: "sample-commerce-c9", labelOverride: "sample-internal-label-c9" }]`（`labelOverride` 故意 == entry.internalLabel → 觸發 leak-equality）。

> ⚠️ C9 藍本之 `internalLabel` 字串**本身**也不可像真實內部代號（避免 fixture review / git blame 混淆，且避免「示範洩漏」誤導）；用無意義 namespaced 字串（C9 doc §9.2）。

### 6.4 commerce 藍本紅線

- ❌ **禁**真實 affiliate URL / tracking id / sid / aff_id / merchant id / 結算密碼 / OAuth secret / token。
- ❌ **禁**真實 `internalLabel`（結算分類 / 通路內部代號 / 私人備註）。
- ❌ **禁**為對齊 `networkKey` 而修改 production `affiliate-networks.json`（紅線：不為 fixture / sample 改 production registry）。
- ✅ `targetUrl` 一律 `https://example.invalid/…`（RFC 2606 reserved；不可達、不可點擊導購）。
- ✅ 所有 key 由「作者明示之 sample 字串」填寫；**不**用 URL pattern 自動推斷 `merchantKey` / `networkKey` / `linkId`。

---

## 7. Download Sample Blueprint

⚠️ **本 phase 不建立 sample 檔；以下為未來 `_sample.download-assets.json` / `_sample.download-forms.json` 之欄位藍本凍結（shape only）。**

### 7.1 download asset sample 欄位藍本

| 欄位 | 型別 | sample 值策略 | 可 placeholder | 禁真實資料 |
| --- | --- | --- | --- | --- |
| `assetId` | string | fixture-namespaced（如 `sample-asset-pdf`）| ✅ | ✅ 禁真實 assetId |
| `title` | string | 明顯 sample 字串（如 `Sample Worksheet (PDF)`）| ✅ | ✅ 禁真實教材名稱（若涉商業）|
| `fileType` | string | enum-like（`PDF` / `ZIP`）| ✅ | n/a |
| `fileUrl` / direct URL | — | **不放**（藍本刻意省略 direct URL 欄位；real-path 測試只驗 title resolve，不驗 reachability）| n/a | ✅ **禁 Google Drive 直連 / 圖床直連 / 私人 Drive folder id** |
| `notes` | string | 自述「sample only; no downloadable resource」| ✅ | ✅ |

### 7.2 download form sample 欄位藍本

| 欄位 | 型別 | sample 值策略 | 可 placeholder | 禁真實資料 |
| --- | --- | --- | --- | --- |
| `formId` | string | fixture-namespaced（如 `sample-form-signup`）| ✅ | ✅ 禁真實 formId |
| `title` | string | 明顯 sample 字串（如 `Sample Signup Form`）| ✅ | ✅ |
| Google Form URL / id | — | **不放**（藍本刻意省略；real-path 測試不輸出真實 Form URL）| n/a | ✅ **禁真實 Google Form URL / form id / Sheet id** |
| `notes` | string | 自述「sample only; respondent data stays in Google」| ✅ | ✅ |

### 7.3 如何避免真實 fileUrl / Google Form / respondent data

- ✅ 藍本**刻意不含** direct download URL / Google Form URL 欄位 → sample **永不成為可下載 / 可填答資源**。
- ✅ 若未來欄位 schema 需「URL 型」欄位以測 resolve path，一律用 `https://example.invalid/sample-asset`（不可達）。
- ❌ **永不**放 respondent data（email / 姓名 / 電話 / 學校 / 答覆 / Sheet response rows）—— respondent data **remain in Google Forms / Sheets**，不進 repo。

### 7.4 real-path testing 與 preview / direct URL risk 邊界

- download landing renderer 之 **real registry-resolved path** 目前未測（registry empty；pm-10 只驗 placeholder path）。
- 未來測 resolved path 時（§12），sample / overlay entry 只提供 `title` / `fileType` 供 renderer **resolve 顯示文字**；**不**提供 direct URL → renderer 不會輸出可點擊下載連結 → 無 preview / hotlink 風險。
- ✅ resolved path 測試只驗「title resolve + external-service note 顯示」；**不**驗 network reachability、**不**輸出真實 Form / Drive URL（pm-10 紅線延續）。

---

## 8. Loader / Validator Safety Analysis

### 8.1 loader 是否會讀 `_sample.*.json`

- ❌ **不會**。`load-settings.js` 以**顯式檔名白名單**載入：`SETTINGS_FILES`（15 個具名 production 檔，line 10–26）+ 具名 `readJsonOptional` 呼叫（`link-sources.json` / `download-assets.json` / `download-forms.json` / `commerce-links.json`）。**無任何 `fs.readdir` / glob** 掃描 `content/settings/`。
- → 任何 `content/settings/_sample.*.json` 之檔案**永不出現在 loader 載入清單** → 零 runtime 影響。`_sample.series.json` 已實證此行為。

### 8.2 validator 是否會掃 `_sample.*.json`

- ❌ **不會**。`validate-content.js` 之 registry 檢查透過 `loadSettings()` 之具名 key（`settings.commerceLinks` / `settings.downloadAssets` / `settings.downloadForms`）取資料 —— 這些 key 來自 §8.1 之白名單載入，**不含** `_sample.*`。
- post 掃描透過 `loadPosts`（fast-glob `.md`，於 post 目錄）；settings JSON 非 `.md`、不在 post 目錄 → 不被 post-glob 命中。
- validator **不** `readdir` `content/settings/` → `_sample.*.json` 永不被掃。

### 8.3 若未來新增 sample 檔，需要哪些 ignore / guard

- ✅ **不需任何 source ignore guard**：白名單 loader + 非 readdir validator 之既有架構，天然忽略 `_sample.*.json`。新增 sample 檔**零 source 改動**即安全。
- ⚠️ 唯一「人類流程」風險（非 source 風險）：
  1. 未來維護者誤把 `_sample.commerce-links.json` 加進 `SETTINGS_FILES` 或新增具名 `readJsonOptional('_sample.commerce-links.json')` → 會被讀。**緩解**：sample 檔 `$comment` 明示「不得加入 loader 白名單」+ §9 防呆。
  2. 誤把 `_sample.commerce-links.json` 整檔複製覆蓋 `commerce-links.json` → 污染 production。**緩解**：`$comment` 明示「不得整檔複製為 production；真實 entry 由 user 依紅線手填」（§4.3）。
- ✅ 上述皆為**文件 / 命名防呆**，**不需** source change。

### 8.4 本輪不改 source

> 本 phase **不**改 `load-settings.js` / `validate-content.js` / 任何 source。§8 僅確認「既有架構天然安全」之事實，作為未來建檔之依據。

---

## 9. Production Pollution Risk

### 9.1 sample 檔放 `content/settings/` 的風險

| 風險 | 評估 | 緩解 |
| --- | --- | --- |
| loader 誤讀 | ❌ 不存在（§8.1 白名單）| 無需 |
| validator 誤掃 | ❌ 不存在（§8.2）| 無需 |
| 與 production registry 同目錄視覺混淆 | ⚠️ 輕 | `_sample.` 前綴 + `$comment` 自述（mirror series 先例）|
| 誤複製為 production | ⚠️ 中（人類操作）| `$comment` 明示「不得整檔複製；真實 entry 手填」+ placeholder 一望即知非真實（`example.invalid`）|
| placeholder 被當真實值誤用 | ⚠️ 中 | `example.invalid` 不可達 + fixture-namespaced key + notes 自述 |

### 9.2 `docs/samples/` 路徑的優缺點

- ✅ 優點：與 settings 物理分離 → 零視覺混淆、零「誤複製為 production」直覺路徑。
- ❌ 缺點：須新建目錄；可發現性中（未來 phase 須跨目錄找）；與 Option D overlay 之 sourcePath 引用較不自然（overlay 慣於 settings family 內改寫）。

### 9.3 防呆設計（檔名 / `$comment` / schemaVersion / notes）

未來若建 sample 檔，建議多層防呆：

- **檔名**：`_sample.` 前綴（底線開頭 → 視覺即知非 production；mirror series）。
- **`$comment` 首欄**（陣列）：明示「template only / build & loader 不讀取 / 不得加入 loader 白名單 / 不得整檔複製為 production registry / 真實 entry 由 user 依 CLAUDE.md §3 紅線手填」。
- **`schemaVersion`**：可設為**異常值**（如 `0` 或省略）作額外信號「此非 production 就緒」（production registry 用 `1`）。
- **`notes`** / **entry-level notes**：每筆 entry 標 `"sample only; not production; not a real merchant/form"`。
- **placeholder 值本身**：`example.invalid` + `sample-*` namespaced key → 任何人一望即知非真實。

---

## 10. Relationship to Option F / G / D

對齊 registry-seed governance §6 之策略定義：

- **Option F** = separate sample settings file not consumed by production（獨立 sample 檔，build / loader 不消費）。
- **Option G** = user-provided real registry entry only（user 真實 entry；Claude 不得自行創建）。
- **Option D** = validation-only registry overlay / test harness escape hatch（am-2 凍結之 Option A path naming）。

### 10.1 sample blueprint 如何支援 Option F

- sample blueprint **就是 Option F 之具體化**：本檔凍結之命名（§5）/ 欄位藍本（§6 / §7）/ 護欄（§9）即 Option F sample 檔之設計規格。
- 未來若建 `_sample.*.json`（獨立 phase），直接依本檔藍本建立 → build / loader 不讀（§8）→ 零 runtime / 零 baseline 影響。

### 10.2 sample blueprint 不能替代 Option G

- ⚠️ sample blueprint 之 entry 是**故意非真實**（placeholder）→ **不**能作為 production registry 之真實內容。
- production registry 之真正填入仍須 **Option G**：user 實際使用 commerce link / download asset 時，**自行**依紅線手填真實 entry（含未來下架某 link 而新增 `active:false` entry）。
- → sample blueprint **降低**未來 Option G 落地時之 schema 設計風險（欄位已凍結），但**不**取代 user 提供真實資料之責任。

### 10.3 sample blueprint 何時可支援 Option D

- Option D overlay（validation-only settings fixture；讓 validator 在掃 fixture post 時 overlay 讀 fixture-scoped registry entry）**需 source change**（loader 雙模 + validator overlay 邏輯；registry-seed governance §6.4，須獨立 phase + approval）。
- sample blueprint 可作為 Option D overlay **fixture-scoped entry 之 shape 參照**：當未來 Option D 落地時，其 `content/validation-fixtures/settings/commerce-links/_test-*.json` 之 entry 可直接套用本檔 §6 / §7 藍本（fixture-namespaced + reserved URL）。
- ⚠️ 但 sample blueprint **本身不是** Option D overlay：sample 檔（`_sample.*`）不被 validator 讀 → 不觸發 rule；Option D overlay fixture（`_test-*.json` under validation-fixtures）才被 overlay loader 讀。兩者**不同檔、不同層**。

---

## 11. C4 / C9 Future Testing Path

### 11.1 C4 source 需要何種 test entry

- C4 需 registry / overlay 內 ≥1 筆 `{ linkId, active:false, replacementTarget:<active linkId>, targetUrl:<reserved>, internalLabel:<non-empty> }` + ≥1 筆 active replacement entry + post `affiliate.links:[{ref:<inactive linkId>}]`（藍本 §6.2）。
- entry **不可**寫入 production `commerce-links.json`（R1-clean）；須走 **Option D overlay**（fixture-scoped）或 **Option G**（user 真實下架某 link 時自然產生）。

### 11.2 C9 source 需要何種 test entry

- C9 需 registry / overlay 內 ≥1 筆帶**非空 `internalLabel`** 之 entry + post `affiliate.links:[{ref:<linkId>, labelOverride:<==internalLabel>}]`（藍本 §6.3）。
- 同 C4：entry 走 Option D overlay 或 Option G；**不**污染 production registry。

### 11.3 是否應先有 sample blueprint，再做 overlay preflight

- ✅ **是**。順序建議：**本檔（L3 sample blueprint design，docs-only）→ L4 Option D overlay source preflight（docs-only，凍結 loader 雙模 / overlay sourcePath）→ L5 source（C9 + C4 共享 `buildCommerceLinkEntryMap`，C9 doc §10.4）**。sample blueprint 先凍結欄位 shape，可降低 overlay preflight 與 source 之設計反覆。

### 11.4 不可因 sample blueprint 直接 source C4 / C9

- ❌ sample blueprint（`_sample.*`）**不被 validator 讀** → 不能直接觸發 C4 / C9 → **不**構成「可測載體」。
- ❌ 故**不可**因「藍本已凍結」就 land C4 / C9 source：source 仍須等 (a) Option D overlay 機制 landed（讓 validator 真讀到 fixture-scoped entry）或 Option G real entry，且 (b) user 於 source preflight final-confirm trigger（C9 leak-equality 仍 provisional，C9 doc §4.3 / §8.4）。
- → C4 / C9 source 仍 **blocked**；本檔不解此 block。

---

## 12. Download Real-path Future Testing Path

### 12.1 需要何種 sample asset / form entry

- 需 download asset overlay / registry ≥1 筆 `{ assetId, title, fileType }`（**無 direct URL**）+ download form ≥1 筆 `{ formId, title }`（**無 Google Form id**）+ post `download.assetRefs:[<assetId>]` / `formRef:<formId>` + `download.enabled:true` + `landingPage:true`（藍本 §7）。
- entry 走 Option D overlay（fixture-scoped）或 Option F sample 藍本參照；**不**寫入 production `download-*.json`。

### 12.2 是否能用 placeholder domain

- ✅ 可。藍本刻意**不含** direct URL 欄位；若 schema 需 URL 型欄位以測 resolve，用 `https://example.invalid/sample-asset`（不可達）。
- resolved path 測試只驗「`deriveRenderedDownloadLanding` 之 resolved branch 顯示 form title / asset title+fileType」，**不**驗 reachability、**不**輸出真實 Form / Drive URL。

### 12.3 是否會造成 renderer / build path side effects

- ⚠️ download real-path 測試會走 `build-github.js` 之 `deriveRenderedDownloadLanding` resolved branch（目前未被執行；registry empty → 全走 placeholder）。
- 測法可 mirror pm-10：**temp post + temp overlay entry → build → grep resolved title → cleanup（no commit / no push）**；temp 產出只寫 gitignored `.cache` / `dist`，cleanup 後 byte-identical-modulo-builtAt。
- ✅ 只要遵守「temp + cleanup + no commit」，無持久 side effect。

### 12.4 不可直接進 renderer implementation

- ❌ 本 phase **不**啟動 download renderer real-path implementation；§12 僅凍結未來測試路徑。
- renderer real-path 之啟動須等 (a) sample blueprint / overlay 機制就緒 + (b) 獨立 phase + approval（§15）。

---

## 13. Red Lines（sample blueprint enforced）

- ❌ **不**放真實 affiliate link / `sid` / `aff_id` / tracking id / merchant id。
- ❌ **不**放 access token / bearer / refresh token / session id / Authorization header / OAuth secret / API key / credential。
- ❌ **不**放 Google Form respondent data（email / 姓名 / 電話 / 學校 / 答覆 / Sheet rows）。
- ❌ **不**放私人下載連結 / Google Drive 直連 / 私人 Drive folder id。
- ❌ **不**放 commission / payout / clickCount 等 commission-sensitive data。
- ❌ **不**為 sample / fixture 修改 production `affiliate-networks.json` / 任一 production registry。
- ❌ **不**用 URL / 字串 pattern 自動推斷 key；所有 key 由作者明示之 sample 字串填寫。
- ✅ 一律 RFC 2606 reserved（`example.invalid`）+ fixture-namespaced（`sample-*`）+ entry-level `notes` 自述「sample only」。
- ✅ 任何進 repo（commit）之 sample / fixture / docs 內容皆視為公開；敏感資料一律不進 repo，留 user 私有環境（Blogger 後台 / Google Forms / Drive / affiliate dashboard）。

---

## 14. Recommended Sample Design Direction

### 14.1 首選位置 / 命名

> **首選 = `content/settings/_sample.commerce-links.json` / `_sample.download-assets.json` / `_sample.download-forms.json`（Option F；mirror `_sample.series.json`）。** 白名單 loader 天然忽略（§8）→ 不需 source ignore guard；與 production registry 同目錄同 schema family → 對 Option D overlay 與欄位對照最自然；視覺混淆由 `_sample.` 前綴 + `$comment` + `example.invalid` placeholder 防呆（§9）。

### 14.2 次選

> **次選 = `docs/samples/*.json`。** 物理分離 → 零混淆；但須新建目錄、可發現性中、overlay 引用較不自然。若 user 對同目錄混淆有疑慮，採此退路。

### 14.3 明確不建議

- ❌ `docs/examples/*.json`（命名易與說明性片段混淆；無增益於 `docs/samples/`）。
- ❌ `test/fixtures/settings/*.json`（第一版未規劃 test 框架，CLAUDE.md §29；新建 `test/` = 新慣例 + validator 未來誤掃風險）。
- ❌ **直接 seed production registry 作 sample**（Option C；違反 R1-clean + baseline drift）。
- ❌ **本輪建檔**（本輪 docs-only；建檔屬獨立 phase）。

### 14.4 是否需要下一階段先做 read-only acceptance

- ✅ **建議**：下一階段先做 **read-only acceptance cross-check**（核對本檔 §5 / §6 / §7 / §8 凍結項與既有 `load-settings.js` 白名單 / `validate-content.js` registry 檢查 / `_sample.series.json` 先例一致），**或** Final Idle Freeze。

### 14.5 是否需要後續 source preflight 來確認 loader ignore

- ⚠️ **不需為「確認 loader ignore」做 source preflight**：§8 已從 source 讀證「白名單 loader 天然忽略 `_sample.*`」，無不確定性 → 無須 source change 驗證。
- ✅ source preflight 之需求**僅**出現在後續 **Option D overlay**（L4）：屆時須凍結 loader 雙模 / overlay sourcePath 改寫 —— 那是「讓 validator **能讀** fixture-scoped entry」之 source change，與「sample 檔被 ignore」是相反方向、不同目的。

---

## 15. Future Phase Ladder

未來若要推進（**本輪不執行任一階**），建議安全階梯。每階須**獨立 user approval**，不得自動跨階；deploy / Blogger repost / GA4 / reverse UTM activation / pm-26 unblock 在任何階皆須 user 另行明確批准：

| 階 | 名稱 | 範圍 | 紅線 |
| --- | --- | --- | --- |
| **L3（本檔）** | sample registry design（Option F docs-only）| 凍結 sample 命名 / 落點 / 欄位藍本 / 護欄 | 不建檔 / 不 source / 不 fixture / 不 seed |
| L3b（可選）| sample 檔建立（Option F template；build / loader 不讀）| 依本檔藍本建 `_sample.*.json`；`$comment` 防呆；`example.invalid` placeholder | 不放真實資料；不被 loader / validator 消費；不需 source guard |
| L4 | Option D overlay source preflight（docs-only）| 凍結 loader 雙模 / overlay sourcePath 改寫設計（讓 validator 讀 fixture-scoped entry）| 不 source |
| L5 | source implementation | 啟用 Option D overlay loader + land C9（+ 可選 C4，共享 `buildCommerceLinkEntryMap`）warning-only；user final-confirm trigger | 不 deploy / 不 Blogger / 不 GA4 |
| L6 | fixture / smoke test | settings-level overlay fixture（含 internalLabel / active:false entry）+ download real-path temp smoke（mirror pm-10）| no commit of 敏感資料；temp cleanup |
| L7 | Admin / renderer | Admin selector（read；填 displayLabel 不填 internalLabel）+ renderer real-path display | write 維度另行授權；不 deploy |

> 注意：C9 與 C4 共享「registry entry map」需求（C9 doc §10.4）→ L5 宜將 C9 + C4 視為**同一 coupled source phase**，避免兩度改 `validateCommerceRefs` signature。read-only acceptance（核對本檔）可插於 L3 與 L3b/L4 之間。

---

## 16. Final Recommendation

### 16.1 本階段 single conclusion

> **本 phase 為 docs-only registry sample blueprint design preanalysis（registry-seed governance §13 ladder L3）。建議未來 sample registry blueprint 採 Option F 命名 `content/settings/_sample.*.json`（mirror `_sample.series.json`；白名單 loader 天然忽略 → 不需 source ignore guard），用途僅為 C4 / C9 / download real-path 之 schema 藍本與安全討論依據，非 production registry / 非 validation fixture / 非 source mock / 非 user real seed。欄位一律 fixture-namespaced placeholder + `example.invalid`；絕不放真實 affiliate / download / tracking / token / merchant / Google Form / respondent / commission 資料。本輪僅凍結藍本與護欄，不建立任何 sample 檔、不改 registry、不 seed、不 source、不 fixture。**

### 16.2 下一階段建議

- **首選**：**read-only acceptance cross-check**（核對本檔 §5 / §6 / §7 / §8 與 `load-settings.js` / `validate-content.js` / `_sample.series.json` 一致）**或 Final Idle Freeze**。
- ❌ **不得**建議直接建 sample 檔（L3b 須獨立 approval）。
- ❌ **不得**建議直接 seed production registry。
- ❌ **不得**建議直接 source C4 / C9 / download renderer real-path。
- ❌ **不得**建議 deploy / Blogger repost / GA4 / reverse UTM activation / pm-26 unblock。

### 16.3 本階段結束後預設狀態

- HEAD 前進 1 commit（`docs(registry): plan sample blueprint design`）。
- working tree clean；ahead/behind = 0/0（push 後）。
- `npm run validate:content` 維持 **0 errors / 69 warnings / 59 posts**。
- commerce content-ref source / fixtures landed 範圍不變（C1 / C2 / C3 / C5 / C6 / C8）。
- commerce + download registries 維持 empty `[]`；**0 sample 檔新增**。
- C4（plan）/ C7 / C9 source 與 fixture 仍未 implement。
- download landing real-path / Admin / renderer / build / deploy / Blogger repost / GA4 / reverse UTM / pm-26 全部 dormant / BLOCKED。

### 16.4 不自動推進下一階段

- ❌ 本 phase 結束後**不**自動啟動 acceptance / Final Idle Freeze / L3b 建檔 / Option D overlay preflight / C4 / C9 source / Admin / renderer。
- 必須等待 user 明確授權。

---

## Appendix A — Cross-reference index

| 主題 | 文件 / commit |
| --- | --- |
| registry seed governance（Option A..G + §13 ladder L3 = 本檔）| `docs/20260608-registry-seed-governance-preanalysis.md`（commit `bc744d4`）|
| commerce C9 display override risk standalone contract | `docs/20260608-commerce-c9-display-override-risk-preanalysis.md`（commit `5fe290f`）|
| commerce C4 inactive ref preanalysis（registry coupling 同型）| `docs/20260608-commerce-c4-inactive-ref-validation-preanalysis.md`（commit `8c9fddf`）|
| commerce content-reference validation（C1..C9 contract）| `docs/20260604-commerce-links-content-reference-validation-preanalysis.md` |
| download form-ref empty policy | `docs/20260602-download-form-ref-empty-policy-preanalysis.md` |
| download content-reference validation | `docs/20260601-download-content-reference-validation-preanalysis.md` |
| download registry schema decision | `docs/20260531-download-asset-form-settings-registry-schema-decision.md` |
| download landing page renderer（placeholder smoke pm-10）| `docs/20260603-download-landing-page-renderer-preanalysis.md` |
| sample settings 先例 | `content/settings/_sample.series.json` |
| benign seeded registry 先例 | `content/settings/link-sources.json` |
| 白名單 loader（SETTINGS_FILES + readJsonOptional；無 readdir）| `src/scripts/load-settings.js:10`（`SETTINGS_FILES`）/ `:37`（`readJsonOptional`）/ `:47`（`loadSettings`）|
| validator registry 檢查（透過 loader key；不 readdir settings）| `src/scripts/validate-content.js:586`（`validateCommerceRefs`）/ `:293`（`validateDownloadRegistry`）/ `:766`（commerce registry call）|
| CLAUDE.md commerce / download 治理段 | `CLAUDE.md` §3（registry governance）|

---

## Appendix B — Baseline snapshot

```
date: 2026-06-08 12:24 +0800
repo: D:\github\blog-new\portable-blog-system
branch: main
HEAD: 5fe290f35043ab72ec721de8e55370c8893545c1
origin/main: 5fe290f35043ab72ec721de8e55370c8893545c1
ahead/behind: 0/0
working tree: clean
latest subject: docs(commerce): plan C9 display override risk
validate: 0 errors / 69 warnings / 59 posts

registry-seed governance: accepted (bc744d4); 首選 Option F + G; 次選 Option D overlay
C9 standalone contract: accepted (5fe290f); leak-equality; 不 echo internalLabel
commerce content-reference rules landed: C1 / C2 / C3 / C5 / C6 / C8
commerce content-reference rules: C4 docs-only plan (source blocked); C7 not recommended; C9 contract frozen (source not implemented)
commerce registry: empty []
download asset / form registry: empty []
commerce production ref / role / labelOverride usage: 0 / 0 / 0
download production assetRefs / formRef usage: 0
sample (non-consumed) precedent: _sample.series.json (build/loader 不讀)
loader: 白名單 SETTINGS_FILES + 具名 readJsonOptional; 無 readdir/glob → _sample.* 永不讀
validator: 透過 loader key 取 registry; post-glob 只掃 .md; 不 readdir settings → _sample.* 永不掃
commerce renderer / Admin / download real-path / build / deploy / Blogger repost / GA4: dormant
reverse UTM activation: dormant (pm-24 source landed; un-deployed)
pm-26: BLOCKED
Admin Apply / middleware write / admin-write-cli: dormant
```

---

## Appendix C — Sample blueprint quick card

```
purpose:        future C4/C9/download real-path 之 schema 藍本 + 安全討論依據
NOT:            production registry / validation fixture / source mock / user real seed

naming/location 裁決:
  A/B/C content/settings/_sample.commerce-links|download-assets|download-forms.json
                      → ✅ 首選（mirror _sample.series.json；白名單 loader 天然忽略；不需 source guard）
  E docs/samples/*.json   → ⚠️ 次選（物理分離零混淆；須新建目錄）
  D docs/examples/*.json  → ❌ 不建議（命名易混淆）
  F test/fixtures/...     → ❌ 不建議（無 test 框架 §29；validator 誤掃風險）

loader safety:  load-settings.js 白名單（無 readdir）→ _sample.* 永不讀
validator safety: 透過 loader key + post-glob .md → _sample.* 永不掃
ignore guard:   ❌ 不需 source guard（既有架構天然安全）

commerce 藍本: linkId / active(true&false) / displayLabel / internalLabel / networkKey / targetUrl / replacementTarget / notes
               C4 需 active:false + replacementTarget→active entry
               C9 需 非空 internalLabel（無意義 namespaced 字串）
download 藍本: asset {assetId,title,fileType,notes}（無 direct URL）/ form {formId,title,notes}（無 Form id）

placeholder:    一律 example.invalid + sample-* namespaced key + $comment 防呆
紅線:           不放真實 affiliate/sid/aff_id/merchant/token/credential/Form/respondent/commission
                不改 production affiliate-networks.json；不自動推斷 key

本 phase 輸出:  本 docs 檔；0 sample 檔 / 0 source / 0 fixture / 0 seed / baseline 不變
blueprint 限制: 不被 validator 讀 → 不可直接觸發 C4/C9/download real-path（非可測載體）
                不能替代 Option G（真實 entry 仍由 user 提供）
                可作 Option D overlay fixture 之 shape 參照（不同檔不同層）
下一步建議:     read-only acceptance 或 Final Idle Freeze；不建檔 / 不 seed / 不 source / 不 deploy
phase ladder:   L3(本檔) → L3b 建檔 → L4 overlay preflight → L5 source(C9+C4 coupled)
                → L6 fixture/smoke → L7 Admin/renderer（每階獨立 approval）
```

---

（本文件結束）
