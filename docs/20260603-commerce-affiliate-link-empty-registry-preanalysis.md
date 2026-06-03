# 2026-06-03 Commerce / Affiliate Link Registry — Empty Registry Preanalysis

Phase name: `20260603-night-19-commerce-affiliate-link-empty-registry-preanalysis-docs-only-a`
Date: 2026-06-03 22:48 +0800
Mode: **docs-only empty registry preanalysis**（no source / no content / no settings registry mutation / no templates / no fixtures / no loader change / no validator rule landing / no renderer / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no real affiliate link added / no registry seeding / **no empty `commerce-links.json` file created in this phase**）

---

## 0. Relation to prior phases

| 順序 | Phase | commit | 角色 |
| --- | --- | --- | --- |
| night-1 | `docs/20260603-commerce-affiliate-link-registry-preanalysis.md` | `3cbb2fd` | problem statement / Option A/B/C / 初步 registry shape |
| night-17 | `docs/20260603-commerce-affiliate-link-registry-identifier-preanalysis.md` | `794a9ce` | 三軸模型（`linkId` / `internalLabel` / `displayLabel`）+ 反查維度 |
| night-18 | `docs/20260603-commerce-affiliate-link-registry-schema-decision.md` | `c420408` | 裁決 near-term C → long-term D；鎖定 `linkId` 命名 convention；鎖定 v0 registry 23 欄位 |
| **night-19（本 phase）** | `docs/20260603-commerce-affiliate-link-empty-registry-preanalysis.md` | （本 commit）| **empty registry preanalysis：檔名 / 路徑 / 空 JSON shape / loader 策略 / validator 策略 / 邊界 / 下一階段拆分** |

night-19 **不**重啟 schema 裁決；本階段**唯一目的**為：

> 在實際建立 `commerce-links.json` empty file 之前，先把「未來 settings-only empty registry commit」的所有 docs 級決策一次性凍結 —— 包含**檔名**、**放置路徑**、**初始 JSON shape**、**top-level keys 初始值**、**是否同步改 loader / validator**、**與既有 settings registry 的邊界**、**下一階段拆分順序**。

本階段**不**建立 registry、**不**改 loader、**不**改 validator、**不**改 content、**不**改 templates、**不**改 fixtures。

---

## 1. Executive Summary

### 1.1 一句話結論

> **建議下一階段 settings-only 新增** `content/settings/commerce-links.json`，初始內容為 `{ "schemaVersion": 1, "updatedAt": "", "commerceLinks": [], "notes": "" }`。**loader 與 validator 不在同一階段做**：mirror download R-series cadence，先 **settings-only**（單檔 add；零下游；validate baseline 不變），下一 phase 再做 **loader read-only**，再下一 phase 才做 **validator V1 / V2 shape + dup-key warning-only**。本階段為**純文件**，凍結這條 cadence 的所有 docs 級決策；不啟動任何實作；validate baseline 維持 **0 errors / 60 warnings / 53 posts**。

### 1.2 本 phase 的事情

- 比較 4 個候選檔名（`commerce-links.json` / `affiliate-links.json` / `commercial-links.json` / `commerce-affiliate-links.json`），推薦 `commerce-links.json`。
- 鎖定空 registry 初始 JSON shape（`schemaVersion=1` / `updatedAt=""` / `commerceLinks=[]` / `notes=""`），逐欄位說明角色。
- 凍結「為什麼不在空 registry 內預塞 sample / token / production URL」之紅線。
- 釐清未來 `commerce-links.json` 與 `link-sources.json` / `link-rules.json` / `affiliate-networks.json` / `download-assets.json` / `download-forms.json` 之**邊界與不混用原則**。
- 凍結 loader 策略（建議 Option A：settings-only 先 land，loader 留到獨立 phase）。
- 凍結 validator 策略（empty registry 本身不應改 baseline；validator rules 留到後續 phases）。
- 凍結 Admin picker / renderer / GA4 之**邊界紅線**（empty registry 不啟動下游 consumer）。
- 列出下一階段 acceptance criteria 與 risk red lines。
- **不**自動啟動下一階段。

### 1.3 為什麼這件事需要獨立 phase

- empty registry implementation 是 **single-file add**，看起來「直接做」似乎合理；但 download R-series 經驗顯示，**先把檔名 / shape / loader 邊界凍在文件裡**，可避免實作階段臨時改名 / 改 shape / 連 loader 一起做造成 baseline 風險。
- 本階段所有決策為「下一個 commit 必須完全遵循」的明確 contract；下一階段執行者不需重新思考。
- 與 download empty registry phase（`docs/20260531-download-empty-registry-implementation-plan.md`）之 cadence 一致。

---

## 2. Baseline Summary

### 2.1 git / validate baseline（pre-commit）

| 項目 | 值 |
| --- | --- |
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD（pre-commit）| `c420408a61787bf85d634da1ed3af58acc8968f5`（short `c420408`）|
| `HEAD == origin/main` | yes（ahead / behind = `0 / 0`）|
| working tree | clean |
| 最新 commit subject | `docs(commerce): decide affiliate link registry schema` |
| `npm run validate:content` | **0 errors / 60 warnings / 53 posts** |

### 2.2 前置決策狀態（cumulative）

per night-1 + night-17 + night-18：

- ✅ **問題已論證**：raw URL 無穩定 pattern；批次替換不可行；平台消失屬已知產業風險。
- ✅ **三軸模型已鎖**：`linkId`（machine）/ `internalLabel`（author-only）/ `displayLabel`（public）。
- ✅ **Strategy 已裁**：near-term Strategy C（mixed coexistence）→ long-term Strategy D（minimal ref + Admin lookup）。
- ✅ **`linkId` 命名 convention 已鎖**：lowercase kebab-case；非數字 / 非中文 / 非 token / 非 URL / 非價格 / 非活動字樣；三段式 `<kind>-<product-slug>-<merchant-key>` 為非強制建議。
- ✅ **v0 registry per-entry 候選欄位已鎖**（night-18 §5.2 之 23 欄位）。
- ✅ **過渡期混用規則已鎖**（night-18 §6.2 之 `ref` + raw URL 共存）。
- ✅ **replacement strategy 已鎖**（night-18 §7：`active: false` + `replacementTarget`；renderer **永不**自動跳）。
- ✅ **GA4 commerce 命名空間獨立原則已鎖**（night-18 §8.1）。
- ✅ **validator V1–V15 規劃清單已鎖**（night-18 §10）。

### 2.3 既有 download empty registry 之 cadence（範本）

per CLAUDE.md §3.2 + `docs/20260531-download-empty-registry-implementation-plan.md`：

| step | phase 名 | 範圍 | 是否動 validate baseline |
| --- | --- | --- | --- |
| 1 | empty registry preanalysis（docs-only）| docs | no |
| 2 | empty registry implementation（settings-only）| `content/settings/download-assets.json` + `download-forms.json` 新增（`{ schemaVersion: 1, updatedAt: "", assets/forms: [], notes: "" }`）| no |
| 3 | loader read-only | `load-settings.js` 加 `readJsonOptional`；暴露 `settings.downloadAssets` / `settings.downloadForms` | no |
| 4 | validator V1 / V2（shape + dup-key）| `validate-content.js` warning-only；fixture-first | partial（新增 fixture 觸發 warning，production 不變）|
| 5+ | content reference rules（R2 not-found / R5b intra-post duplicate）| 同上 | partial |

commerce 採同 cadence。

---

## 3. Candidate Registry File Naming

### 3.1 候選清單

| # | 候選檔名 | 優點 | 缺點 |
| --- | --- | --- | --- |
| A | `content/settings/commerce-links.json` | 涵蓋 affiliate + non-affiliate（出版社官網 / 圖書館 / Spotify 等）；語意中性；與既有 `link-sources.json` / `link-rules.json` 之 `link` 系列命名一致；與 night-18 §5.1 之候選相符 | 與 `link-sources.json` 之「source」維度可能造成作者初次接觸時誤解（緩解：docs 明確分軸）|
| B | `content/settings/affiliate-links.json` | 名稱直白；對應 frontmatter 之 `affiliate.links[]` | **嚴重縮窄**：非 affiliate 之官方 / 圖書館 / Spotify 商業 / 推薦連結無處放；未來補非 affiliate 通路時須再分檔或改名（違反「永不改名」精神）|
| C | `content/settings/commercial-links.json` | 涵蓋商業連結；非 affiliate-only | 「commercial」中文翻譯為「商業 / 廣告」，作者可能誤以為與 ad 系統相關；不如 `commerce-links` 中性 |
| D | `content/settings/commerce-affiliate-links.json` | 名稱明確包含兩種 | 過長；與 `link-sources.json` / `affiliate-networks.json` 短名不一致；作者輸入路徑時較費；filename 與 schema 變動關聯易誤導 |

### 3.2 評估維度展開

| 維度 | A `commerce-links` | B `affiliate-links` | C `commercial-links` | D `commerce-affiliate-links` |
| --- | --- | --- | --- | --- |
| 涵蓋 affiliate + non-affiliate 官方連結 | ✅ | ❌（縮窄）| ✅ | ✅ |
| 與 `link-sources.json` / `link-rules.json` 命名語感一致 | ✅ | partial | partial | ❌（過長）|
| 是否容易被作者理解 | ✅（商業連結 = 商品 / 通路）| partial（限於 affiliate）| partial（commercial 易混 ad）| ✅（最直白但冗）|
| 未來補通路（博客來直連 / 蝦皮 / 官網 / 圖書館 / Spotify）是否需改名 | ❌ 不需 | ✅ 必須改 | ❌ 不需 | ❌ 不需 |
| 與 `relatedLinks` / `otherLinks` 是否分軸清楚 | ✅ | partial | ✅ | ✅ |
| filename 長度 | 短 | 短 | 短 | 長 |
| 與 night-18 §5.1 之候選一致 | ✅ | ❌ | ❌ | ❌ |
| Admin picker UI 命名（如 `Commerce Link Picker`）讀感 | ✅ | partial | partial | ❌ |

### 3.3 推薦

> **推薦檔名：`content/settings/commerce-links.json`**

放置路徑：`content/settings/` 目錄（per CLAUDE.md §3.2 settings 集中位置；mirror `affiliate-networks.json` / `link-sources.json` / `link-rules.json` / `download-assets.json` / `download-forms.json` 之既有慣例）。

### 3.4 命名敏感邊界

- 即使日後 `commerce-links` 內 entries 99% 為 affiliate，**仍**保留 `commerce-` 前綴；不改名為 `affiliate-links.json`（per linkId 永不改名精神，filename 亦然）。
- 若未來補非 affiliate（如圖書館館藏連結、Spotify 媒體連結），不需改 filename；只加新 entry 並標 `networkKey: "direct"` 或 `networkKey: null`。
- 不引入 `merchants.json` / `products.json` 之分檔；entries 自身即承載 `merchantKey` / `productTitle` 等欄位（per night-18 §5.2）。

---

## 4. Empty Registry JSON Shape

### 4.1 建議空 registry 內容

```json
{
  "schemaVersion": 1,
  "updatedAt": "",
  "commerceLinks": [],
  "notes": ""
}
```

⚠️ **本階段不建立此檔**；上述內容為「未來 settings-only empty registry commit」之預定內容定稿。

### 4.2 逐欄位說明

#### 4.2.1 `schemaVersion`

| 屬性 | 值 |
| --- | --- |
| type | `number`（integer）|
| 初始值 | `1` |
| 角色 | 識別 registry shape 版本；未來 schema 升版（v1 → v2）時 increment |
| 是否 required | yes（registry-level）|
| 是否變動 | 只在 schema migration phase 變動 |
| 與 download registry 之關聯 | mirror `download-assets.json` / `download-forms.json` 之 `schemaVersion: 1` 起始 |
| validator 觸發 | 未來 V1 `commerce-link-registry-invalid-shape` 會檢查存在性 |

#### 4.2.2 `updatedAt`

| 屬性 | 值 |
| --- | --- |
| type | `string`（ISO 8601 date 或空字串）|
| 初始值 | `""`（empty registry 之 idle state）|
| 角色 | audit field；最近一次 registry mutation 之時間戳；空 registry 時保持空字串 |
| 是否 required | no（empty 允許空字串）|
| 是否變動 | 每次 registry mutation 同步更新（屬未來作者責任 / Admin write phase）|
| 與 download registry 之關聯 | mirror download-assets.json / download-forms.json 之 `updatedAt: ""` |
| validator 觸發 | 無；不檢查 ISO format（未來可選）|

#### 4.2.3 `commerceLinks`

| 屬性 | 值 |
| --- | --- |
| type | `array<object>` |
| 初始值 | `[]`（空 array）|
| 角色 | 真正的 entries 容器；per-entry 結構 per night-18 §5.2（23 欄位）|
| 是否 required | yes（registry-level）|
| key naming 理由 | 與 `download-assets.json` 之 `assets` / `download-forms.json` 之 `forms` 對齊：top-level 之 array key 與 filename 之名詞部分對齊（`commerce-links.json` → `commerceLinks`）；camelCase 命名 |
| validator 觸發 | 未來 V1 / V2 / V3 / V4 / V5 / V6 等多條 rule 會檢查此 array |
| empty 狀態下行為 | renderer / Admin picker / GA4 均不消費；validator 不視為錯誤 |

#### 4.2.4 `notes`

| 屬性 | 值 |
| --- | --- |
| type | `string` |
| 初始值 | `""` |
| 角色 | registry-level 備註；可記錄整體治理 / migration 歷程（非 entry-level notes）|
| 是否 required | no（允許空）|
| 是否變動 | 偶發 |
| 與 download registry 之關聯 | mirror download-assets.json / download-forms.json 之 `notes: ""` |
| 紅線 | **永不**渲染前台；**永不**含 affiliate dashboard credentials / token / 帳號 email |

### 4.3 為什麼空 registry 不預塞 sample

per night-18 §11.1 紅線 + download registry R1 精神：

- **不**在空 registry 內預塞 `book-atomic-habits-books-com-tw` 這類 sample linkId → 會誤導作者以為「已有可用 entry」；validator 未來會視 sample 為 dup-key 衝突來源；renderer 若不慎讀到會試圖 lookup → 行為不確定。
- **不**塞真實 affiliate URL → 紅線（dashboard credentials / token 之 surrogate）。
- **不**塞 production 文章已用之 raw URL → 違反「near-term C 階段不批次自動 migrate」之原則。
- **不**塞 token / API key / dashboard email / 結算數據 → 紅線（per night-18 §5.4 + §11.1）。
- **不**塞 placeholder 字串如 `"linkId": "TODO"`、`"targetUrl": "https://example.com"` → 會混淆 validator / loader / Admin picker（無法區分「TODO 樣本」與「待補真實 entry」）。

### 4.4 不在空 registry 內預塞 entry 之 alt 場景

唯一允許「非空」狀態：

- migration pilot phase（per night-18 §12 step 12），且**僅針對 explicit approval 之單一 post**；非本階段範圍。
- fixture phase（per night-18 §12 step 6），但**fixture 不放 production registry**；fixture 應放 `content/validation-fixtures/` 之獨立路徑或專屬 settings fixture（屬獨立 phase）。

empty registry phase 之 single contract：**只**為下游 loader / validator 提供「檔案存在 + shape 合法 + 0 entries」之 anchor，無任何下游 consumer。

---

## 5. Relationship With Existing Settings

### 5.1 邊界總覽

| settings file | 管理對象 | 與 `commerce-links.json` 之關係 |
| --- | --- | --- |
| `link-sources.json` | `sourceKey` → `displayLabel` / `sourceType` / `defaultTargetType` / `defaultRel` / GA4 tracking policy；服務 **relatedLinks / otherLinks** 之 source dimension（YouTube / 圖書館 / 內部站台 / Netflix 等）| **不混用命名空間**；commerce `linkId` 與 source `sourceKey` 為兩條獨立 key 系統；commerce entry 之 `sourceKey` 欄位（per night-18 §5.2 #8）為 optional 之**外部 hint**，**非** primary key |
| `link-rules.json` | external / affiliate / internal 三類**通用** target / rel 規則；render-time 套用 | commerce render 時**仍**經 `link-rules.json` 之 `affiliate.rel`（per night-18 §5.2 #16 `rel` 為 override；通常**不**填）；rule **不**重複到 commerce registry |
| `affiliate-networks.json` | network id（`books` / `affiliate-network`）→ name / rel；服務 `affiliate.links[].network` 之 network 顯示名 | commerce entry 之 `networkKey`（per night-18 §5.2 #7）reference `affiliate-networks.json` 之 `id`；future validator V12 `commerce-link-unknown-network-key` 檢查對齊；**不**把 network display name 重複到 commerce registry |
| `download-assets.json` | 教具下載素材檔；`assetId` machine key + 檔案連結 / 形態 / status | **不混用**：download 為「自家素材託管」；commerce 為「外部商品 / 通路連結」；雙方 registry 結構平行（同 cadence）但語意正交 |
| `download-forms.json` | 教具下載前置 Google Form；`formId` machine key | **不混用**：與 download-assets 同邏輯 |

### 5.2 詳細邊界

#### 5.2.1 `link-sources.json` vs `commerce-links.json`

| 維度 | `link-sources.json` | `commerce-links.json` |
| --- | --- | --- |
| 粒度 | **平台**（YouTube / 圖書館 / 內部站台）| **平台 × 商品**（原子習慣 × 博客來；原子習慣 × 金石堂）|
| key | `sourceKey`（如 `youtube` / `taipei-library` / `tech-note`）| `linkId`（如 `book-atomic-habits-books-com-tw`）|
| 顯示欄位 | `displayLabel`（如「YouTube」/「台北市立圖書館」）| `displayLabel`（如「博客來」/「金石堂」/「實體書」）|
| 服務之 frontmatter 欄位 | `relatedLinks[].sourceKey` / `otherLinks[].sourceKey` | `affiliate.links[].ref`（near-term C 過渡期混用）/ `affiliate.commerceLinks[].ref`（long-term D）|
| GA4 dimension | `link_source_key`（per `docs/ga4-link-tracking-spec.md` §4.3）| **未來** `commerce_link_id` / `merchant_key` / `network_key`（per night-18 §8）；**獨立命名空間** |
| 是否含 URL | ❌ 不含 | ✅ `targetUrl` |
| 是否含 affiliate token | ❌ 不含 | ✅（URL 內含；但 token 本身**不**單獨欄位化）|
| dimensional reuse | 可作 commerce entry 之 optional `sourceKey` hint | n/a |

🔑 **commerce registry 不取代 link-sources.json**；兩者並存。

#### 5.2.2 `link-rules.json` vs `commerce-links.json`

| 維度 | `link-rules.json` | `commerce-links.json` |
| --- | --- | --- |
| 範圍 | **全站通用** target / rel 規則 | **per-entry** 商業連結 metadata |
| 是否含 entry-level override | ❌ 全站靜態 | ✅ per-entry `rel` / `sponsored` override（per night-18 §5.2 #16 / #17）|
| render-time 套用順序 | **base layer** | **override layer**（若 commerce entry 有 `rel`） |
| 紅線 | rule 不重複到 commerce registry；rule 改動屬全站影響 | commerce entry 不重複 rule 內容 |

#### 5.2.3 `affiliate-networks.json` vs `commerce-links.json`

| 維度 | `affiliate-networks.json` | `commerce-links.json` |
| --- | --- | --- |
| 粒度 | **network 平台**（通路王 / 聯盟網）| **平台 × 商品**（原子習慣 × 博客來經通路王）|
| key | `id`（如 `books` / `affiliate-network`）| `linkId` |
| 顯示欄位 | `name`（「通路王」）+ `rel` | `displayLabel`（「博客來」）+ `merchant`（「博客來」）|
| reference 方向 | n/a | commerce entry 之 `networkKey` → `affiliate-networks.json[].id` |
| 未來變動 | 補新 network（如 Shopee Affiliate）| 補新商品 × 通路組合 |

🔑 commerce entry 之 `networkKey` 為 **reference into** affiliate-networks；rel **不**重複；rel 由 affiliate-networks lookup 派生（或 commerce entry 之 `rel` override）。

#### 5.2.4 `download-assets.json` / `download-forms.json` vs `commerce-links.json`

| 維度 | download registry | commerce registry |
| --- | --- | --- |
| 範圍 | 自家素材託管 / 表單 | 外部商品 / 通路連結 |
| 是否 self-hosted | yes（Blogger 平台 / Drive 等自家）| no（books.com.tw / shopee.tw 等第三方）|
| 是否含 affiliate | ❌ 不含 | ✅ |
| respondent data | ❌ 紅線 | ❌ 紅線 |
| 雙方 registry 結構 | 平行 cadence | 平行 cadence |
| 是否互相引用 | ❌ 不互相引用 | ❌ 不互相引用 |

🔑 **download registry 與 commerce registry 不混用**；雙方各自獨立檔案、獨立 loader、獨立 validator rules。

### 5.3 紅線（再次強調）

per night-18 §11.1 + download R1：

- ❌ **使用者填表資料**（email / 姓名 / 地址 / 電話 / 學校 / 答覆內容 / Google Sheet response rows）**永不**進 repo；commerce / download registry 皆**禁止**承載。
- ❌ **affiliate dashboard credentials**（token / oauth / API key / 帳號 email / 結算密碼）**永不**進 repo。
- ❌ **commission / payout / clickCount** 屬聯盟平台或 GA4 已有；不在 commerce registry 重複。

---

## 6. Loader Strategy

### 6.1 三種選項

| Option | 範圍 | 與 download empty registry cadence 之關係 |
| --- | --- | --- |
| **A** | settings-only：只新增空 JSON；**不**改 `load-settings.js`；commerce registry 完全不暴露給下游 | **與 download empty registry 落地時不同**：download 落地時同步加 `readJsonOptional`（commit `466e471`）；但本決策建議分段以再降風險 |
| **B** | settings-only + loader：新增空 JSON 同時加 `readJsonOptional`，暴露為 `settings.commerceLinks` | 與 download empty registry **完全平行** |
| **C** | settings-only + loader + validator V1 / V2：同 phase 完成 shape + dup-key 檢查 | 比 download 進一步合併兩 phase |

### 6.2 評估

| 維度 | A（settings-only）| B（+ loader）| C（+ loader + validator）|
| --- | --- | --- | --- |
| baseline 風險 | **零**（檔案靜置；零 source 變動）| 低（loader 加一行 `readJsonOptional` + 一個 settings key；無下游）| 中（validator rules 新加；fixture 須對齊）|
| rollback 難度 | trivial（單檔 delete）| low（restore `load-settings.js`）| medium（restore loader + validator + 移除 fixture）|
| 是否有下游 consumer | 無（檔案僅作 anchor）| 有（`settings.commerceLinks` 已 in-memory；但無 consumer）| 有（validator 已啟動）|
| 是否會造成 false sense of readiness | **無**（外部觀察者僅見一個 inert 檔案）| **低**（loader 已 exposed 可能誤以為 picker 可用）| **中**（validator 已啟動可能誤以為 migration 可開始）|
| 與 download empty registry cadence 之相似性 | 不完全相同（download 是 B）| **完全平行** | 比 download 更激進 |
| commit message 清晰度 | 最高 | 高 | 中 |
| 一個 PR / commit 可獨立 verify 的範圍 | 最小 | 中 | 最大 |

### 6.3 推薦

> **Option A（settings-only 先 land）**。loader 留到**獨立 phase**；validator 留到**獨立 phase**。

### 6.4 推薦理由

- empty registry 本質為 **anchor**：檔案存在就足以宣告「未來這裡會放 commerce entries」；loader / validator 為下游 layer，可獨立。
- Option A 之 baseline 風險為**零**（無 JS 變動），rollback 為 single-file delete；任何後續 phase 都不會 inherit Option A 之 risk。
- 與 download empty registry 之 cadence 雖略不同（download 採 B），但 commerce 之 long-term 風險更高（含 affiliate token / dashboard 邊界），**多一層分段更保守**。
- 若 user 偏好對齊 download cadence，Option B 亦可接受；但**不**建議 Option C（合併過多）。
- Option A 之 settings-only commit 可獨立通過 read-only acceptance；下游 phase 任何延遲皆不阻擋 commerce registry 本身之 landing。

### 6.5 與既有 download empty registry 落地之差異說明

| 維度 | download empty registry（既有；commit `466e471`）| 本決策建議 commerce empty registry |
| --- | --- | --- |
| 落地時是否同步改 loader | yes（per CLAUDE.md §3.2 之 Phase 20260601-pm-11 註）| **no**（settings-only；loader 留獨立 phase）|
| 落地時是否同步改 validator | no（V1 / V2 留 Phase 20260601-pm-17）| **no**（V1 / V2 留獨立 phase）|
| 風險偏好 | moderate（已踩過一次；commerce 更保守）| conservative |

兩者 cadence 雖略異，但 **outcome 一致**：empty registry 落地不改 validate baseline。

---

## 7. Validator Strategy

### 7.1 empty registry 對 validate baseline 之預期

- empty `commerce-links.json` 不存在時 → loader fallback 為 `{ schemaVersion: 0, ..., commerceLinks: [] }`；validator 無對象；baseline 不變。
- empty `commerce-links.json` 存在但內容為空 array → validator 無對象；baseline 不變。

🔑 **empty registry 本身應 R1-clean**：不改 validate baseline；不新增任何 warning。

### 7.2 不在 empty registry phase 啟動之 validator rules

per night-18 §10.1 規劃清單之 **全 15 條 rules（V1–V15）皆不在本階段啟動**。

理由：

- registry shape / dup-key 之 fixture 須事先設計（mirror download R-series fixture-first cadence）。
- content reference rules（V3 / V4 / V5 / V6）須 article frontmatter 有 `ref` 欄位可吃；目前 0 篇 production 文章使用 `ref` 欄位。
- inactive / replacement rules（V7 / V8 / V9 / V10 / V11）須 registry 有實際 entries 才能設計 fixture。
- network key 對齊 rule（V12）須先確認 `affiliate-networks.json` 之 `id` 列表為 frozen。
- internalLabel 完整性 / leak risk rules（V13 / V14）屬 long-tail。
- raw URL residue rule（V15）屬 long-term D 階段。

### 7.3 empty registry 之 R1-clean 條件

empty `commerce-links.json` 須**同時**滿足：

1. JSON 可 parse（無 syntax error）
2. top-level 為 object（不為 null / array / scalar）
3. `schemaVersion === 1`（integer）
4. `updatedAt === ""`（empty string allowed）
5. `commerceLinks === []`（empty array）
6. `notes === ""`（empty string allowed）
7. 無其他 top-level keys（per 「不預塞 sample」紅線）

任一條不滿足 → 屬未來 V1 `commerce-link-registry-invalid-shape` 之觸發；本階段不啟動 V1，但 empty registry phase 之 acceptance 仍須遵守上述 7 條。

### 7.4 download R-series 之經驗對應

per CLAUDE.md §3.2：

- download empty registry 落地時 validator 尚未啟動 → baseline 不變（53 posts / 0 errors / 57 warnings → 後續 R-series 才補 warnings）。
- 本決策建議 commerce 採同 outcome：empty registry phase 之 validate baseline **必須**維持 `0 / 60 / 53`。

---

## 8. Admin Picker Boundary

### 8.1 empty registry 不啟動 Admin picker

- empty registry **只是** data foundation。
- 不代表 Admin picker 已可使用。
- 即使 loader 未來暴露 `settings.commerceLinks`，picker UI / route / preview 須**獨立 phase** 落地。

### 8.2 picker 未來啟動之前置條件

per night-18 §9：

| 條件 | 是否已具備 |
| --- | --- |
| empty registry 已 land | 待下一 phase |
| loader 已暴露 | 待 phase 5 |
| schema typing 已 frozen | yes（night-18 §5.2）|
| `active` status 處理規則 | yes（night-18 §7.2）|
| `internalLabel` author-only 紅線 | yes（night-18 §9.3）|
| `displayLabel` fallback chain | yes（night-18 §5.3）|
| `usedBy` count 之 derivation | 待 phase 15（build script `dist-reports/commerce-link-usage.json`）|
| picker UI / route | 待 phase 10 |

🔑 picker 為 **read-only preview**；不啟動 Admin Apply / middleware write / admin-write-cli。

### 8.3 empty registry 不暴露 picker false sense

per §6.4 Option A 之 false-sense risk：

- settings-only 落地後，作者觀察 git diff 只見一個 inert 檔案 → 不會誤以為 picker 已可用。
- 若直接走 Option B（同 phase 加 loader），需在 commit message / docs 明確標「loader exposes settings.commerceLinks but no consumer yet」以避免誤導；Option A 不需此額外標示。

---

## 9. Frontend / Renderer Boundary

### 9.1 empty registry 不改變前台 render

- empty `commerce-links.json` 落地後，所有現有 production HTML（53 posts）**不變**。
- renderer **不**讀 commerce registry（loader 未暴露之前 / 暴露之後皆然，直到 phase 9 renderer fallback 才啟動）。
- raw affiliate URL 不被自動替換為 registry link。
- 不影響 `relatedLinks` / `otherLinks` 之 render（per CLAUDE.md §16.5 + `docs/related-links-schema.md`）。
- 不影響 download landing page renderer（landing page renderer 本身尚未實作；per CLAUDE.md §3.2）。
- 不影響 Blogger render（`dist-blogger/` 之 byte-identical-modulo-builtAt 應保持；future verify gate per night-18 §6.5）。

### 9.2 renderer fallback 之未來 phase 邊界

per night-18 §3.8：

| 階段 | renderer 行為 |
| --- | --- |
| empty registry phase（本決策範圍）| renderer **完全不知道** commerce registry 存在 |
| loader phase（phase 5）| renderer **完全不知道** commerce registry 存在（loader 只 expose；無 consumer）|
| validator V1–V6（phase 7–8）| renderer **完全不知道** commerce registry 存在 |
| renderer fallback phase（phase 9）| renderer 開始 lookup；無 ref / ref not-found → graceful placeholder |
| migration pilot（phase 12）| 單一 post 之 `affiliate.links[]` 加 ref；其他 post 不變 |

empty registry phase 之**單一 contract**：「不啟動下游 consumer」。

---

## 10. GA4 / Click Tracking Boundary

### 10.1 empty registry 不啟用 GA4 變更

per night-18 §8.2：

- 不改 `src/views/tracking/ga4.ejs`
- 不改 `src/js/modules/ga4-events.js`
- 不改 `src/js/modules/link-tracker.js`
- 不改 `src/views/tracking/ga4-events-helper.ejs`
- 不改 `content/settings/ga4.config.json`
- 不改 `docs/ga4-link-tracking-spec.md`
- 不改 `docs/click-tracking-governance.md`

### 10.2 命名空間 future reservation

| 候選 future GA4 param | 來源 | 啟動 phase |
| --- | --- | --- |
| `commerce_link_id` | commerce entry `linkId` | future GA4 phase（per night-18 §8.4）|
| `merchant_key` | commerce entry `merchantKey` | future GA4 phase |
| `network_key` | `affiliate-networks.json[].id` 或 commerce entry `networkKey` | future GA4 phase |

🔑 empty registry phase **不**啟動上列 params；不改 spec；不執行 GA4 validation。

### 10.3 reverse UTM dormant + pm-26 deploy gate 維持 dormant

per CLAUDE.md §16.4：

- ✅ Blogger → GitHub Pages reverse UTM source 已 landed but **dormant**（pm-24a / b / c；commits `7e1d356` / `e2309e9` / `7c769fe`）。
- ✅ pm-26 deploy gate 維持 **BLOCKED**。
- 🔑 empty registry phase **不**碰 reverse UTM；**不**解 pm-26 gate；**不**進行 GA4 Realtime 驗收。

---

## 11. Risk / Red Lines

### 11.1 本階段紅線（再次集中）

- ❌ **不建立實際** `commerce-links.json` registry（本階段為 docs-only；下一階段才建立 empty file）
- ❌ **不**修改 `src/scripts/load-settings.js`
- ❌ **不**修改 `src/scripts/validate-content.js`
- ❌ **不**修改任何 content（`content/blogger/posts/` / `content/github/posts/` / `content/shared/posts/` / `content/drafts/` / `content/archive/`）
- ❌ **不**修改任何 existing settings（`affiliate-networks.json` / `link-rules.json` / `link-sources.json` / `download-assets.json` / `download-forms.json` 等）
- ❌ **不**修改任何 templates（`content/templates/`）
- ❌ **不**修改任何 fixtures（`content/validation-fixtures/`）
- ❌ **不**修改 `package.json` / `package-lock.json` / `vite.config.js`
- ❌ **不**執行 `npm install` / `npm run build` / `npm run dev` / `npm run preview`
- ❌ **不**建立 sample / fixture entries
- ❌ **不**放真實 affiliate token / dashboard credentials / API key / OAuth secret / 帳號 email
- ❌ **不**把使用者表單資料進 repo（mirror download R1）
- ❌ **不**渲染 `internalLabel` 前台（mirror night-18 §9.3）
- ❌ **不**自動替換 production raw URL（mirror night-18 §7.6）
- ❌ **不**build / deploy / Blogger repost / GA4 validation
- ❌ **不**啟動 Admin Apply / middleware write / admin-write-cli
- ❌ **不**解除 reverse UTM dormant
- ❌ **不**解除 pm-26 deploy gate
- ❌ **不**修改 MEMORY / project memory 檔
- ❌ **不**自動開始下一階段
- ❌ **不**在本 docs 內貼真實 affiliate URL（範例僅用 `book-atomic-habits-books-com-tw` 之 placeholder linkId）

### 11.2 設計風險（識別並標記）

| 風險 | 說明 | 緩衝 |
| --- | --- | --- |
| **檔名鎖死過早** | 若日後語意需擴張至「商業 + 媒體 + 圖書館連結」整合，`commerce-links.json` 之命名可能不夠涵蓋 | 已選最中性命名（C/D 已淘汰；A 比 B 廣）；若必要 schemaVersion 升版 + 文件補充而**不**改 filename |
| **空 JSON shape 鎖死過早** | 若 v0 23 欄位中有未預期之必要欄位 | 已凍 v0 contract（night-18 §5.2）；v1 schemaVersion 升版緩衝 |
| **與 download 不一致 cadence** | 本決策建議 Option A，download 採 Option B；外部觀察者可能困惑 | docs 已明確標差異（§6.5）；下一 phase 之 commit message 可註明此差異 |
| **作者直接編 JSON 之 DX 風險** | 空 registry 落地後若作者直接編 JSON 加 entry → 可能違反 linkId 命名 convention | 待 picker 上線；目前 acceptance phase 僅 docs；validator V1 / V2 啟動後可緩衝 |
| **registry 長期空著** | 若 commerce migration phase 一直不啟動 → empty registry 形同無意義 | 屬可接受（partial > status quo；mirror download empty registry 之長尾接受）|

### 11.3 acceptance 風險

- **下一 phase 執行偏離本決策**：若下一 phase 執行時臨時加 sample entry / 改 shape / 連 loader 一起做 → 違反本決策。緩衝：本 docs 列明 acceptance criteria §13。
- **未來 phase 之 validator 衝突**：若 V1 / V2 rule 設計時對 empty registry 之認定不同（如把 `commerceLinks: []` 視為錯誤）→ 須 V1 / V2 設計階段明確排除 empty case。緩衝：本 docs §7.3 已預設 R1-clean 7 條條件。

---

## 12. Proposed Next Phase

### 12.1 候選下一階段

> **候選**：`20260603-night-20-commerce-affiliate-link-empty-registry-settings-only-a`
>
> ⚠️ **僅為建議**；本決策**不**自動啟動。

### 12.2 下一階段預定範圍

| 維度 | 預定範圍 |
| --- | --- |
| 新增檔案 | `content/settings/commerce-links.json`（唯一新增）|
| 檔案內容 | `{ "schemaVersion": 1, "updatedAt": "", "commerceLinks": [], "notes": "" }` |
| 是否改 loader | ❌ 不改 |
| 是否改 validator | ❌ 不改 |
| 是否改 renderer | ❌ 不改 |
| 是否改 Admin | ❌ 不改 |
| 是否改 templates / content / fixtures / package | ❌ 不改 |
| validate baseline 變動 | **0 errors / 60 warnings / 53 posts**（不變）|
| commit subject 建議 | `feat(commerce): add empty affiliate link registry` 或 `chore(settings): land empty commerce-links registry` |
| push 後預期 | HEAD == origin/main；ahead / behind = 0 / 0；working tree clean |

### 12.3 下一階段不在範圍

- ❌ loader read-only（屬 phase 5）
- ❌ validator V1 / V2（屬 phase 7）
- ❌ fixture（屬 phase 6）
- ❌ Admin picker（屬 phase 10）
- ❌ renderer fallback（屬 phase 9）
- ❌ production migration（屬 phase 11+）

### 12.4 啟動條件

- user 明確指令啟動
- 本決策 docs 已 landed（commit + push 確認）
- HEAD == origin/main
- working tree clean
- pre-validate `npm run validate:content` = **0 / 60 / 53**

---

## 13. Acceptance Criteria For Future Empty Registry Commit

### 13.1 必須滿足條件

| # | 條件 | 驗證方式 |
| --- | --- | --- |
| 1 | 唯一新增檔案：`content/settings/commerce-links.json` | `git diff --name-status main..HEAD` 只列此檔 |
| 2 | JSON 可 parse | `node -e "JSON.parse(require('fs').readFileSync('content/settings/commerce-links.json','utf8'))"` 不報錯 |
| 3 | top-level keys only：`schemaVersion` / `updatedAt` / `commerceLinks` / `notes`（4 keys；無其他）| 人工檢視 + json keys assertion |
| 4 | `schemaVersion === 1`（integer）| 人工檢視 |
| 5 | `updatedAt === ""`（string，empty）| 人工檢視 |
| 6 | `commerceLinks === []`（empty array）| 人工檢視 |
| 7 | `notes === ""`（string，empty）| 人工檢視 |
| 8 | **無** token / secret / credential / production URL / sample entry / TODO placeholder | grep 不含 `http://` / `https://` / `://` / token-like patterns |
| 9 | `npm run validate:content` 結果 = **0 errors / 60 warnings / 53 posts** | npm script 執行 |
| 10 | HEAD == origin/main（after push）| `git rev-parse HEAD == origin/main` |
| 11 | ahead / behind = 0 / 0 | `git rev-list --left-right --count origin/main...HEAD` |
| 12 | working tree clean（after push）| `git status --porcelain` 空 |
| 13 | commit message 不含 `🤖` / Co-Authored-By（per CLAUDE.md commit convention）| 人工檢視 commit message |
| 14 | 無 `npm install` / `package.json` / `package-lock.json` 變動 | `git diff` 不含 |
| 15 | 無 `src/` 變動 | `git diff src/` 為空 |

### 13.2 違反任一條 → 不可 land

下一 phase 執行者若發現任一條無法滿足，須**停止 land**，回報問題；不得繞過。

### 13.3 commit / push convention

- 單一 commit；不分批
- commit message 主體簡短（`docs(commerce):` / `feat(commerce):` / `chore(settings):` 任一前綴皆可）
- 不含 Claude Co-Authored-By 標記（per CLAUDE.md commit convention）
- push 至 `origin/main`
- push 後重新跑 `npm run validate:content`，確認結果與 pre-validate 一致

---

## 14. Final Recommendation

### 14.1 本階段 single conclusion

> **Empty registry preanalysis 已 landed**：
>
> - **檔名**：`content/settings/commerce-links.json`
> - **空 shape**：`{ "schemaVersion": 1, "updatedAt": "", "commerceLinks": [], "notes": "" }`
> - **loader strategy**：Option A（settings-only 先 land；loader 留獨立 phase）
> - **validator strategy**：empty registry phase **不**啟動任何 validator rule；baseline 維持 `0 / 60 / 53`
> - **Admin picker / renderer / GA4 邊界**：empty registry **不**啟動任何下游 consumer
> - **與既有 settings 之邊界**：`link-sources` / `link-rules` / `affiliate-networks` / `download-assets` / `download-forms` 命名空間獨立；commerce entry 之 `networkKey` 為 reference into `affiliate-networks.json`；`internalLabel` 永不前台渲染；token / credential / respondent data 永不進 repo
> - **下一 phase**：候選 `20260603-night-20-commerce-affiliate-link-empty-registry-settings-only-a`；**不**自動啟動

### 14.2 本階段結束後預設狀態

**Final Idle Freeze / EXIT**。

唯一輸出為本檔；不動 source / content / settings / templates / fixtures / package / dist / gh-pages / memory；validate baseline 維持 **0 errors / 60 warnings / 53 posts**；所有 dormant gates 維持 dormant；所有紅線維持 enforced。

### 14.3 不自動推進下一階段

若 user 決定推進，建議下一步：

1. **empty registry implementation**（settings-only；single file add；零下游；per §12.2 範圍；per §13 acceptance criteria）

或可選跳過至：

- **schema decision read-through**（docs-only；認可 night-18；可省略）
- 任何 phase 5+ 之前置 read-only acceptance

---

## Appendix A — Cross-reference index

- `docs/20260603-commerce-affiliate-link-registry-preanalysis.md`（night-1；problem statement + Option A/B/C）
- `docs/20260603-commerce-affiliate-link-registry-identifier-preanalysis.md`（night-17；三軸模型）
- `docs/20260603-commerce-affiliate-link-registry-schema-decision.md`（night-18；schema decision + v0 23 欄位 + linkId 命名 convention + validator V1–V15 規劃清單）
- `docs/related-links-schema.md`（sourceKey vs displayLabel 分離原則；fallback chain）
- `docs/click-tracking-governance.md`（GA4 event 列表；data attr convention）
- `docs/ga4-link-tracking-spec.md`（link_type 派生規則；link_source_key conditional emit）
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`（download registry R1 紅線）
- `docs/20260531-download-empty-registry-implementation-plan.md`（empty registry landing pattern；download cadence 範本）
- `docs/20260602-download-registry-aware-validation-preanalysis.md`（R-series cadence 範本）
- `CLAUDE.md` §1（不過度工程化）/ §3.2（settings 列表 + download registry R1 精神）/ §12（書評 affiliate.links schema）/ §16（連結處理）/ §16.4（reverse UTM dormant）/ §27 / §29 / §30
- `content/settings/affiliate-networks.json`（既有 network registry；2 entries：`books` / `affiliate-network`）
- `content/settings/link-sources.json`（既有 sourceKey registry；命名規則參考；**獨立命名空間**；不混用）
- `content/settings/link-rules.json`（既有 external / affiliate / internal rel 規則）
- `content/settings/download-assets.json` / `download-forms.json`（empty registry shape 參考）
- `src/scripts/load-settings.js`（既有 `readJsonOptional` pattern；commerce loader 未來可 mirror）
- `src/scripts/validate-content.js`（既有 R-series cadence；commerce validator 未來可 mirror）

---

## Appendix B — Baseline snapshot

- repo path：`D:\github\blog-new\portable-blog-system`
- branch：`main`
- HEAD（pre-commit）：`c420408a61787bf85d634da1ed3af58acc8968f5`（short `c420408`）
- `HEAD == origin/main`（pre-commit）：yes（ahead / behind = `0 / 0`）
- working tree（pre-commit）：clean
- latest commit subject（pre-commit）：`docs(commerce): decide affiliate link registry schema`
- `npm run validate:content`（pre-commit）→ **0 errors / 60 warnings / 53 posts**

本階段結束後預期：

- 唯一新增：本檔 `docs/20260603-commerce-affiliate-link-empty-registry-preanalysis.md`
- 其他狀態完全不變
- `npm run validate:content` 預期維持 **0 / 60 / 53**

---

（本文件結束）
