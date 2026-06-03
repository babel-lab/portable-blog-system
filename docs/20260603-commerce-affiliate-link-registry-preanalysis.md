# 2026-06-03 Commerce / Affiliate Link Registry Preanalysis

Phase name: `20260603-night-1-commerce-affiliate-link-registry-preanalysis-docs-only-a`
Date: 2026-06-03 20:12 +0800
Mode: **docs-only preanalysis**（no source / no content / no settings registry mutation / no templates / no fixtures / no loader / no validator rule landing / no renderer / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no real affiliate link added / no registry seeding）

---

## 1. Executive Summary

### 1.1 一句話結論

> 目前**博客來 / 蝦皮 / 通路王 / 聯盟網 / 官方頁**等商品、書籍、下載、推薦用之**外部商業連結（含 affiliate / sponsored）**若以 raw URL 散落在文章 frontmatter `affiliate.links[]` 與 body 之中，**無法保證未來在合理時間內（如「一個下午」）做集中替換**；若改為「集中 commerce-link registry + 文章端只留 stable key/ref」之模型，才有機會在通路平台變動（如「聯盟網消失」、「通路王變更網址結構」、「博客來 affiliate 後台改動」）時做一次性、可審計、可 rollback 的替換。

### 1.2 本 phase 的事情

本 phase 為純 docs-only preanalysis：

- 只**盤點**現況、評估**是否需要**集中 registry、列出候選 conceptual model 與 schema 草案、列出未來可拆批之 phases。
- **不**裁決、**不**啟動實作、**不**新增真實商業連結、**不**遷移既有文章、**不**動 settings registry。
- 本 phase 完成後預設 **Final Idle Freeze / EXIT**；下一步建議先做 read-only acceptance cross-check。

### 1.3 為什麼這件事重要

第一版避免過度工程化（per CLAUDE.md §1），但 commerce affiliate URL 的特性使「不集中管理」會在**長期**累積 raw URL，最終讓「平台消失」變成數十小時的人肉 grep / replace 任務。本 phase 提早做設計面盤點，避免 phase 8（第二階段）才補救。

---

## 2. Problem Statement

### 2.1 商業連結特性使「分散式 raw URL」難以批次替換

聯盟網 / 通路王 / 蝦皮 / 博客來 之商品連結 URL **沒有穩定 pattern**：

- 通路王（whitehippo.net / books.com.tw 經 affiliate）：每個商品 URL 為平台分配之隨機 token（如 `https://whitehippo.net/3QaKr?uid1=blog`）；URL 不含 ISBN / product id 之可辨識成分。
- 聯盟網（conn.tw）：類似 token 結構（如 `https://adcenter.conn.tw/3QaLi?uid1=blog`）。
- 蝦皮（shopee.tw）：可能用 affiliate redirect 或直連商品頁；商品 URL 含 shop id + item id；shop / item 變動則 URL 失效。
- 博客來（books.com.tw 直連 / 經通路王 / 經聯盟網皆有可能）。
- 官方網站（出版社 / 品牌官網）：URL 結構與商品為一對一。

由於沒有穩定 URL pattern，「批次找出『書 X 在所有文章中的所有聯盟連結』」**無法用 regex / hostname / path 精準完成**；只能逐篇文章人工檢視。

### 2.2 一篇文章可能有多個商業連結

書評文章可能同時列：

```yaml
affiliate:
  links:
    - label: "博客來：實體書"
      network: "通路王"
      url: "https://whitehippo.net/3QaKr?uid1=blog"
    - label: "金石堂：實體書"
      network: "聯盟網"
      url: "https://adcenter.conn.tw/3QaLi?uid1=blog"
```

教具下載 / 雜誌 / DVD / 周邊商品文章亦可能同時推三、四個通路（蝦皮 / 博客來 / 出版社官網 / 圖書館館藏）。

### 2.3 同一本書 / 商品可能對應多個目的地

「原子習慣」這本書，可能在不同文章中以不同 affiliate 形式出現：

- A 文章用通路王導往博客來
- B 文章用聯盟網導往金石堂
- C 文章直接放出版社官網（無 affiliate）
- D 文章補一個 YouTube 書摘導讀

→ 同一商品（identity = 「書 X」）→ 多 destination（merchant / platform）→ 每 destination 可能有自己的 affiliate URL。

raw URL 模型下，「書 X 全部相關連結」**無法以一個 key 反查**。

### 2.4 label / note 是給作者辨識用，不等於前台顯示文字

作者管理介面可能希望看到：

```
[原子習慣 ｜ 博客來 ｜ 通路王] https://whitehippo.net/3QaKr?uid1=blog
```

但前台只渲染：

```
博客來
```

→ 內部 `internalLabel` / `note`（給作者辨識）與 `displayLabel`（給讀者）為**兩條軸**，不可混用（mirror `docs/related-links-schema.md` §11.2.1 之 `sourceKey` vs `displayLabel` 分離原則）。

### 2.5 平台變動是「會發生」而不是「假設性」

歷史證據：

- 「聯盟網」與「通路王」過去十年皆有過後台改版 / 帳號合併 / 結算機制變更。
- Shopee Affiliate 在台灣 2024–2025 期間經歷過數次規則大改。
- 任一聯盟網「結束服務」屬已知產業風險。

→ 本系統若打算「長期維護」（per CLAUDE.md §30 核心價值），就必須提早規劃 affiliate URL 之集中管理。

---

## 3. Current System Fit

本節盤點目前系統與「商業 / affiliate 連結集中管理」之**重疊**與**邊界**。

### 3.1 既有 `affiliate.links[]`（per CLAUDE.md §12）

當前形態（per `content/blogger/posts/20260515-we-media-myself2.md`）：

```yaml
affiliate:
  enabled: false
  disclosure: "..."
  position:
    top: false
    bottom: false
  links:
    - label: "博客來：實體書"
      network: "通路王"
      url: "https://whitehippo.net/3QaKr?uid1=blog"
```

- **每篇文章**的 affiliate links 為**獨立 array**；不引用任何中央 registry。
- `network` 為自由字串，與 `content/settings/affiliate-networks.json`（2 個 entries：通路王 / 聯盟網）僅以人類眼睛對齊；**沒有 validator 強制**。
- raw URL 直接寫在文章 frontmatter。
- ⇒ **此即「分散式 raw URL」模型**；§2 之問題在此模型下無解。

### 3.2 既有 `content/settings/affiliate-networks.json`

```json
[
  { "id": "books", "name": "通路王", "rel": "sponsored nofollow noopener noreferrer" },
  { "id": "affiliate-network", "name": "聯盟網", "rel": "sponsored nofollow noopener noreferrer" }
]
```

- 管理「聯盟 network 之顯示名與 rel」；**不**管 affiliate URL 本身。
- 與 `content/settings/link-rules.json`（external / affiliate / internal rel 規則）共同涵蓋「rel 屬性自動化」，**仍不**碰 URL 中心化。
- ⇒ 此檔案適合作為 commerce-link registry 之 `network` 維度 lookup，但**不取代**集中 URL registry。

### 3.3 既有 `content/settings/link-sources.json`（per related-links source registry）

```json
{
  "version": 1,
  "sources": [
    { "sourceKey": "youtube", "displayLabel": "YouTube", "sourceType": "mediaPlatform", ... },
    { "sourceKey": "taipei-library", "displayLabel": "台北市立圖書館", "sourceType": "library", ... },
    ...
  ]
}
```

- 管理「relatedLinks / otherLinks 之來源 / 平台顯示名稱」（per `docs/related-links-schema.md` §11）。
- 適用語意：**作者標註 link 屬於哪個 source platform**（YouTube / 圖書館 / 出版社官網等）。
- **不適用語意**：管理「每一個商品在每一個 merchant 的 affiliate URL」（粒度差一級：source 為平台，product affiliate URL 為平台×商品）。
- ⇒ commerce-link registry 之 `merchant` 維度可**參考** sourceKey 命名規則（kebab-case stable key + displayLabel）；但不可直接 reuse 同一個 registry。

### 3.4 既有 `relatedLinks` / `otherLinks`（per `docs/related-links-schema.md`）

- 適合：作者手動指定之**非販售**延伸閱讀 / 來源引用（per §2.3）。
- 不適合：affiliate 販售連結（per §2.3 之嚴格 boundary：「relatedLinks / otherLinks 之 item **不得**塞入 affiliate 連結」）。
- ⇒ commerce-link registry 與 relatedLinks 為**兩套獨立機制**；不可混用、不可 fallback、不可互相 reuse 資料。

### 3.5 既有 download registry（`download-assets.json` / `download-forms.json`）

- 屬「empty registry landing point」（per CLAUDE.md §3.2 之 settings 列表 + `docs/20260531-download-empty-registry-implementation-plan.md`）。
- registry 思路（content ref / asset key / loader read-only / validator registry-aware not-found / duplicate）**可借鏡**：
  - `assetId` ↔ commerce-link `commerceLinkId`（key）
  - `assets[]` ↔ `commerceLinks[]`
  - R1 shape + dup-key validation pattern ↔ commerce registry 之 shape + dup-key 候選 rules
  - R2 not-found ↔ commerce ref not-found 候選 rule
  - empty registry landing → loader read-only → validator registry-aware 之 cadence
- ⇒ download registry 之**架構模式**可 mirror；但**資料內容絕對不可混用**（下載素材 ≠ 商品 affiliate；使用者填表回應更不可混入；per §9）。

### 3.6 既有 link processor（`src/scripts/link-processor.js`）與 `ga4-url-builder.js`

- link-processor 處理 external / internal / affiliate 之 `target` / `rel` 自動化（per CLAUDE.md §16）。
- ga4-url-builder 處理 GitHub↔Blogger 反向 UTM 注入。
- ⇒ 兩者皆**作用於 URL 後處理**，**不**管「URL 從哪來」；commerce-link registry 若落地，這兩個模組**不需大改**——只需 renderer 在 lookup registry 後傳遞已 resolve 之 URL 進 link-processor 即可。

### 3.7 reverse UTM 不應被本 phase 啟動

per CLAUDE.md §16.4：reverse UTM source 已 landed（pm-24a/b/c）但 **dormant**；pm-26 deploy gate **BLOCKED**。本 phase docs-only 不解除任何 gate；commerce-link registry 與 reverse UTM 為**獨立兩條 track**，不交叉。

### 3.8 fit summary

| 既有設施 | 可否 reuse | 說明 |
| --- | --- | --- |
| `affiliate.links[]` frontmatter array | ⚠️ 過渡可保留 raw URL，但 long-term 應改 ref | 詳見 §4 hybrid Option |
| `affiliate-networks.json` | ✅ 可 reuse 作 `network` 維度 lookup | 不取代 URL registry |
| `link-sources.json` | ❌ 不 reuse；但**命名規則可參考** | source registry ≠ commerce registry |
| `relatedLinks` / `otherLinks` | ❌ 嚴格分離 | per related-links §2.3 |
| download registry pattern | ✅ **架構模式**可 mirror | 資料內容**不可**混用 |
| link-processor / ga4-url-builder | ✅ 不需大改 | 只在 renderer lookup 後 pipe URL 進入 |
| reverse UTM | ❌ 不啟動 | 獨立 track |

---

## 4. Proposed Conceptual Model

本節提出 **3 個候選模型**，比較優劣；**不裁決**。

### Option A: 在文章內保留 raw URL + metadata（現行模型；status quo）

- 文章 frontmatter `affiliate.links[]` 維持 raw URL + label + network。
- **Pros**：
  - 零改動；不影響任何既有設施。
  - 作者熟悉，學習成本零。
  - 文章自包含（不依賴 registry），單檔可讀。
- **Cons**：
  - 「聯盟網消失」之集中替換**無解**（per §2.1）。
  - 同一商品的多通路 URL 散落各文章，**無 reverse index**。
  - 內部 label vs 前台 display 混用（`label` 既是作者辨識也是讀者顯示）。
  - URL 變動時須逐篇文章人工修改；長期累積成本爆增。
- **Fit**：MVP 階段可接受；長期不可持續。

### Option B: 建立 commerce-links registry，文章只放 `commerceLinkRefs`（pure ref model）

- 新增 `content/settings/commerce-links.json`（或類似 path）作為 central registry，包含**每一個 commerce link entry**（含 raw URL、merchant、network、status 等）。
- 文章 frontmatter 改為：

  ```yaml
  affiliate:
    enabled: true
    commerceLinkRefs:
      - "atomic-habits-books-com-tw"
      - "atomic-habits-shopee"
  ```

- renderer 透過 `loadSettings()` 既有模式 read-only 載入 registry，於 build 階段 resolve refs → URL + displayLabel + rel。
- **Pros**：
  - 「聯盟網消失」可一次性 registry update + rebuild + redeploy 完成集中替換。
  - 同一商品的多通路集中可見；可加 `productId` / `bookIsbn` 維度 reverse index。
  - 內部 label（`internalLabel`）與前台 display（`displayLabel`）分離，可獨立調整。
  - 可加 `status: replaced`、`replacementKey: ...` 之 audit trail。
- **Cons**：
  - 全面遷移成本不小（每篇含 affiliate 之文章須改 frontmatter）。
  - registry 過大時編輯 / lookup 體驗下降（除非有 Admin picker）。
  - 文章不再自包含（依賴 registry；移交 / 搬家時須一併搬 registry）。
  - empty registry 落地後**長期空著**就失去意義；須配合 Admin picker / migration 才完整。
- **Fit**：long-term ideal；但**現在過早 normalize**——production 僅 1 篇 real affiliate post（`20260515-we-media-myself2.md`，且 `enabled: false`）+ 樣板，遷移成本與當前需求不成比例。

### Option C: Hybrid（短期 raw URL，長期 registry ref；additive coexistence）

- registry 為 **optional**；文章端兩種形態可**共存**（per entry）：

  ```yaml
  affiliate:
    enabled: true
    links:
      - ref: "atomic-habits-books-com-tw"   # 優先；renderer lookup registry
      - label: "金石堂：實體書"               # 過渡；raw URL 形態
        network: "聯盟網"
        url: "https://adcenter.conn.tw/3QaLi?uid1=blog"
  ```

- renderer：若 entry 有 `ref` → registry resolve；否則 fallback 至既有 raw URL pipeline。
- **Pros**：
  - 不強迫 migration；既有文章零改動仍可 build。
  - 新文章可選擇 ref 形態；逐步 migrate。
  - 「聯盟網消失」場景下，**已遷至 ref 的部分**可集中替換；raw URL 部分仍需人工，但**範圍縮小**。
  - 與 download registry 之 hybrid 共存模式對齊（per R6 coexistence defer 之精神）。
- **Cons**：
  - 維護**兩條 path**（ref + raw）；renderer / validator 邏輯複雜化。
  - migration 不徹底時，「一個下午集中替換」之目標**部分達成**而非完全達成。
  - empty registry 過渡期 long-tail：若作者一直不主動 migrate，hybrid 永遠是 hybrid。
- **Fit**：mid-term 平衡點；與 Option D（download landing page content model）之過渡形態類似。

### 4.4 Option comparison summary

| Option | Implementation cost | Migration cost | "Affiliate network 消失" recovery | Authoring UX | Production migration risk | Long-term fit |
| --- | --- | --- | --- | --- | --- | --- |
| **A** | 0 | 0 | ❌ 無解 | 既有 | 0 | ❌ 不可持續 |
| **B** | mid–high | high（全面遷移）| ✅ 一次性 | 集中編輯佳；但 registry 大時須 Admin picker | high | ✅ ideal |
| **C** | mid | low（逐步遷移）| ⚠️ 部分達成 | 兩 path 並存；新文章友善；既有文章不強迫 | low | ✅ mid-term 平衡 |

**保守傾向**（**非裁決**）：mid-term 走 **Option C（hybrid additive coexistence）**；long-term 視 registry usage 規模決定是否 normalize 至 Option B。本 phase **不**做此決定；裁決應由獨立 phase 進行。

---

## 5. Candidate Registry Schema（概念草案；非規格定稿）

本節提出**候選 schema**作為討論起點；**僅為 preanalysis**，最終 schema 由獨立 phase 裁決。

### 5.1 Registry 整體 shape（草案）

借鏡 `download-assets.json` 之 empty registry landing pattern：

```json
{
  "schemaVersion": 1,
  "updatedAt": "",
  "commerceLinks": [],
  "notes": ""
}
```

落點建議：`content/settings/commerce-links.json`（mirror 既有 settings 慣例；per CLAUDE.md §3.2 之 settings 列表位置）。

### 5.2 Per-entry 候選欄位（草案）

| 欄位 | 型別 | 必填 | 說明 |
| --- | --- | --- | --- |
| `commerceLinkId` | string | **是** | stable machine-readable key（kebab-case；如 `atomic-habits-books-com-tw`、`atomic-habits-shopee`）；**永不改動** |
| `internalLabel` | string | **是** | 作者辨識用；可含書名 / 商品名 / 文章用途（如「原子習慣 ｜ 博客來」）；**不是前台顯示文字** |
| `productTitle` | string | 否 | 商品 / 書本標題（與 `book.title` 對齊；可選） |
| `bookTitle` | string | 否 | 書評文章專用（與 `productTitle` 擇一；可選） |
| `bookIsbn` | string | 否 | 書本 ISBN；用於 reverse index（書→所有通路） |
| `productId` | string | 否 | 非書商品之 SKU / id；用於 reverse index |
| `merchant` | string | **是** | 通路顯示名（如 `博客來` / `蝦皮` / `金石堂` / `出版社官網`）；前台顯示為 displayLabel 之 fallback |
| `merchantKey` | string | 否 | 通路 machine-readable key（如 `books-com-tw` / `shopee-tw` / `kingstone-com-tw` / `publisher-official`）；reverse index 用 |
| `network` | enum-ish | 否 | affiliate network（對齊 `affiliate-networks.json` 之 `id`：`books`（通路王）/ `affiliate-network`（聯盟網）/ `direct`（無 affiliate）/ `shopee-affiliate` 等） |
| `destinationType` | enum | **是** | `book` / `product` / `download` / `official` / `formLanding` / `media` / `library` / `other` |
| `url` | string | **是** | 實際目標 URL（raw affiliate URL 或直連 URL） |
| `status` | enum | **是** | `active` / `inactive` / `replaced` / `deprecated`（mirror 既有 sourceKey isActive + R4 inactive 設計精神，per `docs/20260601-sourcekey-source-inactive-validator-preanalysis.md`） |
| `replacementKey` | string | 否 | 當 `status === replaced` 時，指向新的 `commerceLinkId`；renderer 可選擇 follow（**不**強制 auto-redirect 文章內容） |
| `displayLabel` | string | 否 | 前台顯示文字；未填則 fallback 至 `merchant`；可隨品牌更名調整而不污染 GA4 dimension（mirror sourceKey `displayLabel` 分離原則） |
| `note` | string | 否 | 作者備註（如「此連結已通報聯盟網結帳異常 2026-05-30」）；**不出現於前台** |
| `usedBy` | array (optional) | 否 | 反查文章 slug 列表；建議**不**由作者手填；由未來 validator / Admin 自動產生 |
| `updatedAt` | string | 否 | 人工維護用 ISO 日期；registry-level `updatedAt` 與 entry-level `updatedAt` 可並存 |
| `inactiveReason` | string | 否 | 當 `status` 非 active 時之原因簡述（如「聯盟網結束服務」/「商品下架」） |
| `tags` | array of string | 否 | 任意分類標籤（如 `["book", "parenting"]`）；reverse index 用 |

⚠️ **本草案 schema 為 preanalysis；不是規格定稿**。實際採用哪些欄位、必填邊界、enum 列舉，皆由**獨立 schema decision phase** 裁決（per §8 next phases）。

### 5.3 候選 schema 之設計原則

- **machine key 與 display label 嚴格分離**（mirror sourceKey 設計）。
- **internalLabel 與前台 displayLabel 嚴格分離**（避免作者辨識文字外洩）。
- **status / replacementKey** 模仿 sourceKey isActive + R4 inactive 設計（per `docs/20260601-sourcekey-source-inactive-validator-preanalysis.md`）。
- **reverse index 維度（merchantKey / bookIsbn / productId / tags）** 可選，但設計時保留 lookup hook，避免未來補不上去。
- **不放任何使用者填表 / OAuth / API key / Drive folder ID / 結算後台 token**（紅線；per CLAUDE.md §3.2 之 download registry 紅線 R1 精神）。

### 5.4 候選 schema 之非目標（明確不做）

- ❌ 不放 affiliate dashboard credentials / API key / OAuth token。
- ❌ 不放結算金額 / commission 數據。
- ❌ 不放 affiliate 平台之 click report / payment status。
- ❌ 不放使用者點擊紀錄（GA4 raw event 屬另一系統）。
- ❌ 不放 ISBN 之外的 PII。
- ❌ 不放 user 填表 / 訂單 / 收件人資料。

---

## 6. Content Authoring Model

本節描述文章內可能的引用方式（**草案；非規格**）。

### 6.1 Option B 形態（pure ref）

```yaml
affiliate:
  enabled: true
  disclosure: "本文包含聯盟行銷連結..."
  position:
    top: true
    bottom: true
  commerceLinkRefs:
    - "atomic-habits-books-com-tw"
    - "atomic-habits-kingstone"
    - "atomic-habits-shopee"
```

renderer：

1. 讀 refs。
2. registry lookup 每個 `commerceLinkId`。
3. 取 `displayLabel` / `url` / `network` → emit anchor with rel from `affiliate-networks.json` lookup or `link-rules.json` `affiliate`。
4. registry not-found → placeholder（mirror download empty registry graceful fallback；per landing page renderer §8.2 model）。

### 6.2 Option C 形態（hybrid coexistence）

```yaml
affiliate:
  enabled: true
  links:
    - ref: "atomic-habits-books-com-tw"          # 推薦形態：ref
    - label: "金石堂：實體書"                       # 過渡形態：raw（既有）
      network: "聯盟網"
      url: "https://adcenter.conn.tw/3QaLi?uid1=blog"
```

renderer 對 per-entry 判別：

- `entry.ref` 為 non-empty trimmed string → registry lookup 路徑
- 否則 → 既有 raw URL 路徑（既有 `label` + `network` + `url`）

### 6.3 進階：結構化引用（含 per-link 屬性）

對「同一商品多通路 + 想標主推 / 比價 / 官方差異」之場景，可進一步結構化：

```yaml
affiliate:
  enabled: true
  commerceLinks:
    - ref: "atomic-habits-books-com-tw"
      role: "primary"          # primary / alternate / price-check / official / library
      labelOverride: ""        # 可選；不填則用 registry.displayLabel
      order: 10
    - ref: "atomic-habits-kingstone"
      role: "alternate"
      order: 20
    - ref: "atomic-habits-publisher-official"
      role: "official"
      order: 30
```

- `role` 為作者語意標註；renderer 可用於分組顯示（如「購買通路」/「官方頁」/「比價」分區）。
- `labelOverride` 允許個別文章覆蓋 registry displayLabel（不污染 registry；屬該文章專屬之顯示文字）。
- `order` 控制顯示順序。

⚠️ 本 §6.3 為**進階草案**；初期落地不需強迫此粒度；本 phase 不裁決。

### 6.4 一篇文章多 affiliate links 之情境

書評文章常見 5 連結：博客來 / 金石堂 / 蝦皮 / 出版社官網 / 圖書館館藏。其中：

- 博客來 / 金石堂 / 蝦皮 → affiliate（commerceLinkRefs）
- 出版社官網 → 視策略可進 commerceLinks（destinationType: `official`）或進 `otherLinks`（per related-links §6）
- 圖書館館藏 → 進 `otherLinks`（library 屬非販售；per related-links §6）

**boundary 原則**（重申 related-links §2.3）：

- **販售 / 商品連結（即使是「官方無 affiliate」之購買頁）** → commerce-link registry
- **非販售之延伸閱讀 / 來源引用** → relatedLinks / otherLinks

---

## 7. Replacement Workflow（未來情境；本 phase **不**執行）

本節描述「聯盟網 / 通路王消失」之未來替換流程；屬未來 source phase 範圍，**本 phase 不做**。

### 7.1 假想情境：聯盟網結束服務

假設 2027-XX-XX，「聯盟網」宣布結束服務；所有 `network: "affiliate-network"` 之連結需替換。

### 7.2 集中替換流程（registry 模型下）

1. **盤點**：grep registry `commerce-links.json` 之 `network: "affiliate-network"` entries → 取得所有受影響之 `commerceLinkId` 列表。
2. **決策**：對每筆受影響 entry，決定替換策略：
   - **替換為其他 network**（如 PChome 24h / 蝦皮直接 affiliate）：更新該 entry 之 `url` + `network`；保留 `commerceLinkId`。
   - **改為直連商品頁（無 affiliate）**：更新 `url` + `network: "direct"`。
   - **下架**：`status: inactive`；renderer 顯示 fallback 或隱藏。
   - **新建替代 entry**：原 entry `status: replaced`；`replacementKey: <new key>`。
3. **validate**：跑 validator 確認無 dangling ref（未來 `commerce-link-ref-not-found` rule）。
4. **build**：跑 `npm run build` / `npm run build:blogger`；renderer 自動套新 URL。
5. **檢查輸出**：cross-check `dist/` 與 `dist-blogger/`；確認舊 URL 已絕跡。
6. **Blogger repost**：必要時手動將更新後之 HTML 重貼至 Blogger 後台（per CLAUDE.md §2.1 手動發布流程）。
7. **GitHub deploy**：必要時 `gh-pages` deploy。
8. **回收**：移除舊 URL 之 GA4 監測 placeholder（若有）。

### 7.3 raw URL 模型下之同情境（status quo）

1. grep 全 repo `content/**/*.md` 找出含「affiliate-network」字串之文章 → list 可能不完整（URL 不一定含 network 字串）。
2. 逐篇文章人工檢查 affiliate.links[]、判斷哪條是聯盟網連結。
3. 逐篇修改 URL。
4. validate / build / Blogger repost / GitHub deploy（同 step 4–7）。

→ 主要差別在 step 1–3：**raw URL 模型下「盤點」與「修改」為 O(篇數)** ；registry 模型下為 **O(1) 修改 + O(篇數) 自動 rebuild**。

### 7.4 重申：本 phase 不執行任何 replacement workflow

本 phase 為 docs-only preanalysis；不執行任何文章 URL 替換、不啟動 build、不啟動 Blogger repost、不啟動 GitHub deploy。

---

## 8. Validator / Admin / Renderer Future Work

本節列出**未來可能拆批之 phases**；mirror download R-series cadence（preanalysis → decision → empty landing → loader → validator → renderer → migration → acceptance → deploy）。

### 8.1 候選 phases（建議順序；非綁定）

| # | Phase 類型 | 範圍 | 風險 | 是否須先行 |
| --- | --- | --- | --- | --- |
| 1 | **本 phase**：commerce-link registry preanalysis | docs-only | 無 | n/a（已 landed） |
| 2 | **schema decision**：選 Option B/C；定 schema 規格；定 ref 形態（`refs[]` 還是 `commerceLinks[].ref`） | docs-only | 無 | yes（本 phase 後） |
| 3 | **empty registry landing**：新增 `content/settings/commerce-links.json` empty shape；無下游 consumer | settings-only | 低 | yes |
| 4 | **loader read-only**：`load-settings.js` 加 `readJsonOptional` for commerce-links | source（loader）；無 consumer | 低 | yes |
| 5 | **validator source（registry shape + dup-key）**：mirror R1 | source（validator）；warning-only | 低 | yes |
| 6 | **fixtures**：合法 / 違規 fixture for shape + dup-key | content（fixtures only） | 極低 | yes |
| 7 | **validator content reference rules**：mirror R2（ref not-found）；R5b（intra-post duplicate ref） | source（validator）+ fixtures；warning-only | 低 | yes |
| 8 | **renderer fallback**：post-detail.ejs / blogger-post-full.ejs reading registry refs；graceful placeholder when empty | source（renderer） | 中 | yes |
| 9 | **Admin picker / selector**：commerce-link picker（mirror sourceKey selector preview）| source（Admin） | 中 | 待 renderer 邊界穩定 |
| 10 | **migration of existing raw affiliate URLs**：逐篇 / 批次（per approval）將既有 raw URL 進 registry + 文章端改 ref | content + registry；high impact | **高** | 須 explicit user approval；先做 read-only acceptance |
| 11 | **inactive rules / replacement rules**：`commerce-link-ref-inactive` / `commerce-link-ref-replaced` warnings | source（validator）+ fixtures | 低 | yes |
| 12 | **acceptance cross-check**：read-only 驗收 1–11 之一致性 | docs-only | 無 | yes |
| 13 | **deploy / Blogger repost / GA4 validation** | infra | 中 | 須 explicit approval + pm-26 gate 解除（屬 long-term；非本 series 範圍） |

### 8.2 每個 candidate phase 之 acceptance 風險

- **phase 2**：純 docs；無風險。
- **phase 3**：empty registry；零下游影響。
- **phase 4–7**：mirror download R-series 已驗證 cadence；風險可控；warning-only。
- **phase 8**：renderer 改 post-detail / blogger-post-full；須與既有 affiliate render 路徑相容（Option C hybrid 模式之關鍵）。
- **phase 9**：Admin picker；屬 Admin track（Apply / middleware 仍 dormant；不解除）。
- **phase 10**：**唯一高風險**。批次改 production content 須：
  - 先做 read-only acceptance（盤點所有 raw URL）
  - 須 explicit user approval per batch
  - 須 rollback plan（git revert by commit）
  - 須 fixture-first validation
  - 不得在 promote-to-ready gates 未明前批次改動 ready / published 文章

### 8.3 dormant rails 維持

每個候選 phase 皆**不**解除：

- reverse UTM dormant（per CLAUDE.md §16.4）
- pm-26 deploy gate BLOCKED
- Admin Apply / middleware write / admin-write-cli dormant
- 不引入 Google Form respondent data import / Sheets API

---

## 9. Risks and Non-goals

### 9.1 紅線（永遠 enforced）

- ❌ **不放使用者填表 / Google Form respondent data**進 repo / Admin static / settings registry（mirror CLAUDE.md §3.2 download registry R1）。
- ❌ **不放 Google Drive folder ID / 私人權限 / API key / OAuth secret / 帳號 email**。
- ❌ **不把 Blogger 當 legacy archive**（per CLAUDE.md §2.1：Blogger 仍為流量入口 + AdSense 收益來源）；commerce link registry 之 source-of-truth 為 **repo**，與 Blogger 平台保持雙寫一致。
- ❌ **不**在沒有 explicit approval 下批次改既有文章 URL（即使 registry 已建好）。
- ❌ **不**在本 phase 新增任何**真實 affiliate link**（連 sample / fixture / 草案範例皆使用人類可辨識之 placeholder 字串如 `atomic-habits-books-com-tw`，**不**含 real affiliate token）。
- ❌ **不**啟動 reverse UTM / pm-26 / Admin Apply / middleware write / admin-write-cli。
- ❌ **不**啟動 registry seeding（registry 必須 **empty** 上線；至 migration phase 才開始填）。

### 9.2 Non-goals

- 不做 affiliate dashboard 整合。
- 不做 click report 收集（GA4 既有 `affiliate_click` event 已涵蓋；屬另一系統）。
- 不做自動 SKU 抓取（蝦皮 / 博客來 商品頁不爬）。
- 不做價格比較 / 比價自動更新。
- 不做 affiliate 平台 redirect status 監測（屬 SRE 工作；非本系統）。
- 不做 user-facing「我的最愛」/「收藏」（無會員系統，per CLAUDE.md §1 / §4）。

### 9.3 與既有 dormant gates 之關係

| Gate | 本 phase | 未來 phases |
| --- | --- | --- |
| reverse UTM | 不啟動 | 不啟動（屬獨立 track） |
| pm-26 deploy gate | 不解除 | 不解除（屬 deploy 之 prerequisite，commerce track 不解之） |
| Admin Apply | 不啟動 | Admin picker（phase 9）為 read-only preview；不寫；不 Apply |
| middleware write route | 不啟動 | 不啟動 |
| admin-write-cli | 不啟動 | 不啟動 |
| Download registries | 不動 | 不動（保持 empty）；commerce registry 為**獨立**第三個 settings registry |
| sourceKey track | 不動 | 命名規則參考但不交叉 |

---

## 10. Recommended Next Step

### 10.1 本 phase 結束後之預設狀態

**Final Idle Freeze / EXIT**。

本 phase 唯一輸出為本檔；不動 source / content / settings / templates / fixtures / package / dist / gh-pages / memory；validate baseline 維持 **0 errors / 60 warnings / 53 posts**；所有 dormant gates 維持 dormant；所有紅線維持 enforced。

### 10.2 若 user 決定推進，建議下一步

依風險由低至高排序：

1. **read-only acceptance cross-check**（最保守；零改動）
   - 範圍：read-only 盤點全 repo affiliate 相關 raw URL 之**分布**（不修改）；產出 inventory docs（如「production 含 N 篇 affiliate post / M 條 raw URL / 涵蓋 K 個 merchant」）。
   - 目的：為未來 migration phase 提供決策依據。
   - 風險：零（read-only）。

2. **commerce-link registry schema preflight**（docs-only decision）
   - 範圍：本 phase §5 之候選 schema 升級為 decision；定 Option B vs C；定 ref 形態。
   - 目的：為未來 settings landing 提供規格基準。
   - 風險：零（docs-only）。

3. **commerce-links empty registry landing**（settings-only；single file add）
   - 範圍：新增 `content/settings/commerce-links.json` 之 empty shape；無 loader / 無 consumer。
   - 目的：建立 settings landing point；零下游影響。
   - 風險：低（settings 新增；validate 不掃此檔之 content；無 production 影響）。

4. **loader read-only**（source；無 consumer）
   - 範圍：`src/scripts/load-settings.js` 加 `readJsonOptional('commerce-links.json', { schemaVersion: 0, commerceLinks: [] })`。
   - 風險：低；mirror download loader pattern。

⚠️ **不可直接做 migration**（candidate phase 10）：須先有 phases 1–9 鋪設；批次改 production raw URL 為 high-risk 操作，須 explicit user approval per batch + rollback plan。

### 10.3 不可推進之 short-cut

- ❌ 不可直接 seed registry with real affiliate URLs（registry 必須 empty 上線）。
- ❌ 不可直接改 templates 加 ref（須等 schema decision）。
- ❌ 不可直接改 renderer（須先有 registry + loader + validator）。
- ❌ 不可在無 schema decision 的情況下做 read-only inventory 並輸出真實 URL（即使是 read-only，輸出的 inventory docs 仍會把 raw URL 永久寫進 docs；應只統計分布、不貼具體 URL）。

### 10.4 本 phase 之 single conclusion

> 本 phase 確認：commerce affiliate link 之集中管理確實有**長期必要性**（per §2 平台變動風險），但**現在過早全面 normalize**（per §4 Option B 過早判斷）；mid-term 可能採 Option C hybrid coexistence，但本 phase **不**裁決；建議下一步先做 read-only acceptance cross-check，再做 schema decision phase，再考慮 empty registry landing。本 phase 結束後**預設 Final Idle Freeze / EXIT**。

---

## Appendix A — Cross-reference index

- `CLAUDE.md` §1（不過度工程化原則）
- `CLAUDE.md` §2.1（Blogger 為流量入口 + AdSense 收益來源；不可放棄）
- `CLAUDE.md` §3.2（settings 列表位置；download registry 紅線 R1 精神）
- `CLAUDE.md` §12（書評文章 affiliate.links schema）
- `CLAUDE.md` §16（連結處理規則 / external / affiliate / internal rel）
- `CLAUDE.md` §16.4（reverse UTM dormant 狀態）
- `CLAUDE.md` §27 / §29 / §30（修改規則 / 第一版不做 / 長期樣貌）
- `docs/related-links-schema.md` §2.3（relatedLinks vs affiliate.links 分離）
- `docs/related-links-schema.md` §11（sourceKey future addendum；命名規則參考）
- `docs/20260526-related-links-source-label-admin-design.md` §3 / §6（sourceKey / displayLabel 分離原則）
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`（registry schema 紅線 R1）
- `docs/20260531-download-empty-registry-implementation-plan.md`（empty registry landing pattern）
- `docs/20260601-download-loader-implementation-preanalysis.md` / `20260601-download-loader-preanalysis.md`（loader read-only pattern）
- `docs/20260602-download-registry-aware-validation-preanalysis.md`（R-series cadence 範本）
- `docs/20260603-download-landing-page-content-model-decision.md`（content model decision pattern 範本）
- `docs/20260601-sourcekey-admin-selector-preanalysis.md`（Admin picker preanalysis pattern）
- `docs/20260601-sourcekey-source-inactive-validator-preanalysis.md`（inactive / status track 設計範本）
- `content/settings/affiliate-networks.json`（既有 network registry）
- `content/settings/link-sources.json`（既有 sourceKey registry；命名規則參考；**不**混用）
- `content/settings/download-assets.json` / `download-forms.json`（empty registry shape 參考）
- `content/settings/link-rules.json`（既有 external / affiliate / internal rel 規則）
- `content/blogger/posts/20260515-we-media-myself2.md`（唯一 production real affiliate post；`enabled: false`）
- `src/scripts/load-settings.js`（既有 `readJsonOptional` pattern）
- `src/scripts/validate-content.js`（既有 R-series cadence）

---

## Appendix B — Baseline snapshot

- repo path：`D:\github\blog-new\portable-blog-system`
- branch：`main`
- HEAD：`d18e21c9b0d0e3b63465f506d50188e7256677ce`（short `d18e21c`）
- `HEAD == origin/main`：yes（ahead / behind = `0 / 0`）
- working tree：clean
- latest commit subject：`feat(download): resolve landing registry placeholders`
- `npm run validate:content` → **0 errors / 60 warnings / 53 posts**

本 phase 結束後預期：

- 唯一新增：本檔 `docs/20260603-commerce-affiliate-link-registry-preanalysis.md`
- 其他狀態完全不變
- `npm run validate:content` 預期維持 **0 / 60 / 53**

---

（本文件結束）
