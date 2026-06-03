# 2026-06-03 Commerce / Affiliate Link Registry — Identifier Field Preanalysis

Phase name: `20260603-night-17-commerce-affiliate-link-registry-identifier-preanalysis-docs-only-a`
Date: 2026-06-03 22:13 +0800
Mode: **docs-only preanalysis**（no source / no content / no settings registry mutation / no templates / no fixtures / no loader / no validator rule landing / no renderer / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no real affiliate link added / no registry seeding）

---

## 0. Relation to prior phase

本 phase 為 `docs/20260603-commerce-affiliate-link-registry-preanalysis.md`（night-1，commit `3cbb2fd`）之 **follow-up，聚焦於「識別欄位 (identifier / internalLabel) 維度」**。

night-1 phase 已完成：

- problem statement（why affiliate raw URL 不可批次替換）
- conceptual model options A / B / C
- candidate registry shape §5
- replacement workflow scenario
- future phase ladder
- risks / non-goals

night-17（本 phase）**不**重啟 Option 裁決；本 phase 之**唯一聚焦**為：

> **「人類可識別欄位」應該長什麼樣，才能讓作者在管理介面或 future Admin picker 中，一眼看出某條商業連結是「誰在用」、「在做什麼」、「跟哪本書 / 哪個商品 / 哪篇文章關聯」**——並使「平台消失時的批次替換」、「同一商品多通路反查」、「文章內位置 / CTA 角色辨識」都能以 O(1) 完成。

本 phase **不**裁決 schema、**不**啟動實作、**不**建 registry、**不**改 content、**不**改 source、**不**改 Admin。

---

## 1. Executive Summary

### 1.1 一句話結論

> 「識別欄位」應採**三軸獨立**模型：(1) **machine-stable key**（`linkId`）給 build / lookup / GA4 / registry ref 使用；(2) **internal-only human label**（`internalLabel`）給作者於 picker / inventory 中辨識；(3) **public displayLabel**（前台讀者顯示）；三軸**嚴格分離**，互不污染。其中 `internalLabel` 為作者管理體驗之核心，應允許自由文字（如「原子習慣 ｜ 博客來 ｜ 通路王」），**永不渲染至前台**；同時補上**反查維度**（`productTitle` / `bookTitle` / `bookIsbn` / `productId` / `merchantKey` / `usedBy[]`）以支撐「同商品多通路」、「平台消失批次替換」、「文章 ↔ 連結反查」三類查詢。

### 1.2 本 phase 的事情

本 phase 為純 docs-only preanalysis：

- 只**盤點** night-1 提出之 §5.2 schema 中與「人類可識別 / 反查 / 替換」相關欄位
- 對每個候選識別欄位逐一分析：用途、是否必填、放 article frontmatter / centralized registry / mixed model / Admin future picker、是否影響前台顯示、是否影響 GA4、設計風險
- 列出 **5 個 use case**（一篇多連結、同書多通路、平台消失批次替換、文章內位置 / CTA 反查、Admin picker 預覽）
- 比較欄位放置策略（frontmatter / registry / mixed / Admin lookup table）優缺點
- 列出**保守落地順序**與**紅線**

本 phase **不**裁決最終 schema，**不**啟動任何後續實作；下一步建議仍為 schema decision phase，與 night-1 §10.2 對齊。

### 1.3 為什麼這件事重要

night-1 已論證集中 registry 之**結構必要性**；本 phase 補上**識別欄位之語意必要性**。若集中 registry 落地但**識別欄位設計不夠**，會發生：

- 作者打開 `commerce-links.json` 看到 200 條 entries，每條只有 `linkId: "a3kf9-x29"` + `url: "..."`，**無法人類辨識**哪條是哪本書、哪個通路、哪篇文章在用。
- 平台消失需批次替換時，**無法**用 `Where used` 反查文章列表。
- Admin picker 列表只能顯示 URL，不能顯示「原子習慣 ｜ 博客來 ｜ 通路王」這種人類友善描述。
- internal note 與 public displayLabel 若混用，可能洩漏作者備註至前台（如「此連結結帳異常 2026-05-30」）。

本 phase 提前界定「識別欄位 = 作者管理之核心 UX」這個維度，避免未來 schema decision phase 漏掉。

---

## 2. Current Baseline

### 2.1 git / validate baseline

| 項目 | 值 |
| --- | --- |
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `3cbb2fd0c0f7ffc9882c8abcdff289fb80186a2c`（short `3cbb2fd`）|
| `HEAD == origin/main` | yes（ahead / behind = `0 / 0`）|
| working tree | clean |
| 最新 commit subject | `docs(commerce): plan affiliate link registry strategy` |
| `npm run validate:content` | **0 errors / 60 warnings / 53 posts** |

### 2.2 既有 affiliate / commerce 相關設施盤點（cross-ref night-1 §3）

| 設施 | path | 識別欄位現況 |
| --- | --- | --- |
| Per-article affiliate links | `.md` frontmatter `affiliate.links[]`（per CLAUDE.md §12）| 每條 entry 只有 `label` / `network` / `url`；無 stable id；`label` 同時擔任「作者辨識」與「前台顯示」兩個角色 |
| Network registry | `content/settings/affiliate-networks.json` | 2 條 entries（通路王 / 聯盟網）；只管 network 名稱與 rel；不管 URL |
| Source registry（已存在）| `content/settings/link-sources.json` | sourceKey + displayLabel 設計分離（per `docs/related-links-schema.md` §11.2.1）；可作為**設計範本**，但**不適用於 commerce 場景**（粒度差一級）|
| Production real affiliate post | `content/blogger/posts/20260515-we-media-myself2.md` | 唯一含 2 條 raw affiliate URL；`enabled: false`；2 條 label 為「博客來：實體書」/「金石堂：實體書」+ `network: "通路王"` / `"聯盟網"` |
| Templates | `content/templates/blogger-book-review-template.md` / `blogger-magazine-review-template.md` | 含 affiliate.links 草樣式；`label` 為空字串範本 |

**觀察**：當前模型下，**單一 `label` 欄位**同時承擔：

- 作者辨識（「博客來：實體書」）
- 前台顯示（讀者看到「博客來：實體書」按鈕）
- network 維度線索（藉由文字含「博客來」推測通路）

→ 識別 / 顯示 / 維度三事**未分離**；長期會卡死在「想換 displayLabel 但怕影響辨識」之困境。

### 2.3 相關規範與既有設計範本

- `docs/related-links-schema.md` §11.2.1：`sourceKey` vs `displayLabel` 嚴格分離原則 — **直接可參考**
- `docs/click-tracking-governance.md` §6 + §7：GA4 attr 命名（`data-ga4-param-link_source_key`）— commerce 端可 mirror
- `docs/ga4-link-tracking-spec.md` §4.3：`link_source_key` 為 conditional emit；**穩定不變之 machine key** 為 GA4 dimension 之必要條件 — 直接影響本 phase 之 `linkId` 設計
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`：download registry 之 `assetId` / `formKey` machine key + `internalLabel` 範本（mirror 範圍）
- `docs/20260603-download-landing-page-content-model-decision.md`：identifier vs displayLabel 分離之 download 端先例

---

## 3. Problem Statement — Why URL or Platform alone is not enough

### 3.1 URL 不是識別碼

per night-1 §2.1：

- 通路王（`whitehippo.net/3QaKr?uid1=blog`）/ 聯盟網（`adcenter.conn.tw/3QaLi?uid1=blog`）之 URL token 為平台隨機分配；**URL 不含商品身分**；regex 無法抽出 ISBN / SKU。
- 蝦皮（`shopee.tw`）含 shop id + item id，但**整個 URL 字串**對人類辨識不友善（無書名 / 商品名）。
- 直連博客來（`books.com.tw/products/0010xxxxxx`）只含內部 product id，無書名。
- 出版社官網 / 自架商店：URL pattern 各家不同；無法統一推斷。

→ 「URL = 識別碼」**不成立**。

### 3.2 Platform 也不是識別碼

`network: "通路王"` 或 `platform: "blogger"` 只告訴你「這條連結屬於哪個平台」，**完全不**告訴你：

- 這條連結賣的是什麼商品？
- 這條連結出現在哪篇文章？
- 這條連結是 CTA top 還是 CTA bottom 還是 inline mention？
- 這條連結是主推 / 備案 / 比價 / 官方？
- 這條連結是「我自己貼的」還是「過去某次合作活動補的」？

→ 「Platform = 識別碼」**亦不成立**。

### 3.3 「label」一欄擔太多任務

現行 `affiliate.links[].label` 同時是：

- 作者辨識（看到「博客來：實體書」就知道是哪一條）
- 前台顯示（讀者點擊按鈕上的文字）
- network 提示（「博客來」隱含「通路王 affiliate」）
- 用途暗示（「：實體書」暗示有對應「：電子書」/「：套書」）

任何**一個維度**改動都會影響其他三個：

- 想改前台顯示「博客來」為「博客來購買」→ 作者辨識文字也跟著改。
- 想加上 internal note「2026-05 結帳異常」→ 怕直接寫進 label 會洩漏至前台。
- 想對同一商品標主推 / 備案 → label 內擠進「主推」字眼又會干擾顯示。

→ 「label」**過載 (overloaded)**；需要拆出多個獨立欄位。

### 3.4 沒有「文章 ↔ 連結」反查

當前模型下，要找「文章 X 在用哪幾條 affiliate link」：

```bash
grep -A 5 "affiliate:" content/.../<post>.md
```

可行；但要找「affiliate link Y 在哪幾篇文章被使用」**無解**——因為連結本身只是 raw URL 字串，無 stable id 可反查。當 raw URL 不只一處（同一條連結出現在多篇文章）時，更難盤點。

### 3.5 沒有「商品 ↔ 多通路」聚合

「原子習慣」這本書，可能對應：

- 通路王（博客來）→ `https://whitehippo.net/AAA`
- 通路王（金石堂）→ `https://whitehippo.net/BBB`
- 聯盟網（蝦皮）→ `https://adcenter.conn.tw/CCC`
- 直連出版社官網 → `https://www.fineart.com.tw/atomic-habits`

當前模型下，要找「原子習慣的所有通路 affiliate link」**無 reverse index**；只能憑記憶。

### 3.6 GA4 dimension 不穩定

current `affiliate-networks.json` 之 `id: "books"`（通路王）/ `"affiliate-network"`（聯盟網）為穩定 key；但**這只到 network 粒度**，不到「個別連結」粒度。若想在 GA4 看「『原子習慣博客來』之 CTR」，需穩定 `linkId` 作 dimension；URL 不穩定（會被平台改）；label 不穩定（會改顯示）；只有 `linkId` 才能扛這個責任。

### 3.7 小結

URL 不夠（隨機 token）+ Platform 不夠（粒度太粗）+ label 過載（一欄四任務）+ 無反查（文章 / 商品聚合無解）+ GA4 維度不穩 → **需要新增一組 stable identifier 欄位**，且必須**分離 internal vs public**、**分離 machine vs human**。

---

## 4. Use Cases — 具體場景

本節列出**至少 5 個**識別欄位需要支援之具體場景。

### 4.1 一篇文章多個商業連結

書評文章 `20260515-we-media-myself2.md` 當前有 2 條：

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

未來可能擴增為 4–5 條（蝦皮 / 出版社官網 / 圖書館館藏（非販售 → 走 otherLinks））。

**識別欄位需求**：

- 每條連結要能在 article context 中被辨識（哪條是主推、哪條是備案）
- 每條連結要能在 registry context 中被反查（哪條被用於哪篇文章 + 位置）
- 同一篇文章內若同時引用同一商品之多通路，需可一眼看出（避免重複貼錯）

### 4.2 同一本書可能有博客來 / 蝦皮 / 官方頁

書評「原子習慣」之可能通路組合：

| Merchant | Network | 用途 |
| --- | --- | --- |
| 博客來 | 通路王 affiliate | 台灣主流 |
| 金石堂 | 聯盟網 affiliate | 備案 |
| 蝦皮 | 蝦皮 affiliate | 折扣 / 二手 |
| 出版社官網 | 直連（無 affiliate）| 完整資訊頁 |
| 台北市立圖書館 | direct（library；非販售）| 走 `otherLinks`，不進 commerce registry |

**識別欄位需求**：

- 「原子習慣」需有一個跨通路之**商品身分** key（如 `productTitle: "原子習慣"` + `bookIsbn: "9789861784755"`）
- 每條通路 entry 各有自己的 `commerceLinkId`，但**反向**可由 `bookIsbn` 或 `productId` 一次撈出所有通路。
- 作者管理時可看到「原子習慣」之整個通路矩陣 + 個別 status / inactive。

### 4.3 聯盟網或通路王消失時批次替換

per night-1 §7.1 假想情境：

「聯盟網」結束服務 → 所有 `network: "affiliate-network"` 之 entries 需替換。

**識別欄位需求**：

- registry 端必須能 grep `network: "affiliate-network"` 一次取得所有受影響 entries 之 `commerceLinkId` 列表
- 每個受影響 entry 之 `internalLabel` 必須足以讓作者**不需打開 URL** 就決定替換策略：
  - 「原子習慣 ｜ 金石堂 ｜ 聯盟網」→ 換成「原子習慣 ｜ 金石堂 ｜ 直連」
  - 「自媒自創 ｜ 金石堂 ｜ 聯盟網」→ 下架（status: inactive）
  - 「教具下載 X ｜ 蝦皮 ｜ 聯盟網」→ 換成「教具下載 X ｜ 蝦皮 ｜ shopee-affiliate」
- 每個替換決策需要 audit：`status: replaced` + `replacementKey: <new id>` + `note: "聯盟網結束服務 2027-XX-XX 替換為 ..."` → 此 note 為 internal-only，**永不**渲染至前台。
- 同時要能**反查每個 entry 被哪些文章使用**（per §4.5）。

### 4.4 未來需要知道文章內哪個 CTA / 哪個商品在用這條連結

GA4 報表想看「原子習慣 博客來 CTA」之點擊分布（top vs bottom 區塊）：

- GA4 event：`click_affiliate_cta` with `placement: article_top | article_bottom`
- 想再加 dimension：「在哪本書」/「在哪篇文章」/「主推還是備案」

**識別欄位需求**：

- `commerceLinkId`（穩定）作 GA4 dimension（per `ga4-link-tracking-spec.md` §4.3 `link_source_key` 模式）
- 渲染端可從 article context 推導：article slug、placement（top / bottom）→ 進 GA4 event params
- registry 端可標 `role: primary | alternate | price-check | official`（per night-1 §6.3）→ 進 GA4 event params 或 Admin filter

### 4.5 Admin picker：「這篇文章可以引用哪些 commerce link」

未來若有 Admin selector（per night-1 §8 phase 9），picker 列表呈現方式：

```
□ atomic-habits-books-com-tw   原子習慣 ｜ 博客來 ｜ 通路王         [active]
□ atomic-habits-kingstone       原子習慣 ｜ 金石堂 ｜ 聯盟網         [inactive: 聯盟網結束]
□ atomic-habits-shopee          原子習慣 ｜ 蝦皮 ｜ shopee-affiliate  [active]
□ atomic-habits-publisher       原子習慣 ｜ 出版社官網 ｜ direct      [active]
□ ai-self-media-books-com-tw   自媒自創 ｜ 博客來 ｜ 通路王           [active]
```

**識別欄位需求**：

- `internalLabel` 要長到足以辨識（含商品 + 通路 + network），但**僅供作者**看，**不渲染**至前台。
- `status` enum 視覺化呈現 active / inactive / replaced / deprecated。
- 可依 `productTitle` 或 `bookIsbn` 群組顯示（同商品多通路聚成一組）。
- 可依 `merchantKey` filter（只看博客來 / 只看蝦皮）。
- 可依 `usedBy[]` 反查（這條連結用於哪幾篇文章；點進去可跳到文章）。

---

## 5. Proposed Conceptual Model — 三軸獨立 + 反查維度

本節提出**三軸獨立 + 反查維度**之 conceptual model；**僅為 preanalysis 草案**，不裁決 schema。

### 5.1 三軸獨立

| 軸 | 命名 | 角色 | 是否顯示前台 | 是否進 GA4 dimension | 穩定性 |
| --- | --- | --- | --- | --- | --- |
| **Machine identity** | `linkId`（或 `commerceLinkId`；本 phase 用 `linkId` 為短稱）| stable key，build / lookup / registry ref / GA4 dimension | ❌ 否 | ✅ 是（作為 `link_source_key` 模式之延伸）| **永不改動**（rename = 重建 entry）|
| **Internal label** | `internalLabel` | 作者辨識 / Admin picker / inventory docs | ❌ **嚴格不渲染** | ❌ 否 | 可調整（不影響 GA4 / 不影響前台）|
| **Public display** | `displayLabel` | 前台讀者顯示按鈕文字（如「博客來」/「博客來購買」）| ✅ 是 | ⚠️ 可選作 `link_label` event param | 可隨品牌 / 翻譯調整 |

**設計原則**：

- `linkId` 一旦發出**永不改名**（如同 download `assetId` / sourceKey 之穩定原則）。
- `internalLabel` 為自由文字；建議格式「商品名 ｜ 通路名 ｜ network」，但**不強制**；長度不限。
- `displayLabel` 為前台短文字；不強制必填（fallback chain 見 §5.3）。

### 5.2 反查維度（補 schema lookup hooks）

per night-1 §5.2 候選欄位 + 本 phase 補上之 lookup focus：

| 欄位 | 用途 | 為何重要 |
| --- | --- | --- |
| `productTitle` | 商品 / 書本顯示標題（如「原子習慣」）| 商品 ↔ 多通路反查；Admin picker grouping |
| `bookTitle` | 書評文章專用（與 `productTitle` 擇一）| 書評場景之 readability |
| `bookIsbn` | 書本 ISBN（如 `9789861784755`）| 跨通路精準對齊；長期穩定（出版業界標準）|
| `productId` | 非書商品之 SKU / id | 對應書本之 ISBN；非書商品專用 |
| `merchantKey` | 通路 stable key（如 `books-com-tw` / `shopee-tw` / `kingstone-com-tw` / `publisher-official`）| 通路 ↔ 多商品反查；批次替換 by merchant |
| `merchant` | 通路顯示名（如「博客來」/「蝦皮」）| `displayLabel` 之 fallback；Admin picker 顯示 |
| `network` | affiliate network id（對齊 `affiliate-networks.json` 之 `id`）| network 消失批次替換；rel 自動化來源 |
| `articleSlug` / `usedBy[]` | 反查文章列表 | 連結 ↔ 文章反查；批次替換 impact 分析 |
| `tags[]` | 任意分類標籤（`["book", "parenting"]`）| 跨維度 grouping（如「親子教育系列商品」）|

`usedBy[]` 建議**不**由作者手填；由未來 validator / Admin 自動產生（避免漂移）。

### 5.3 顯示 fallback chain（建議）

從高優先到低優先：

```
1. article-level labelOverride（若 entry 有此選填欄位且非空）
2. registry.displayLabel（若 registry entry 有此欄位且非空）
3. registry.merchant（中文通路名）
4. registry.merchantKey 之 humanize（fallback；可在 Admin warn 提示作者補 displayLabel）
```

此 chain 對齊 `docs/related-links-schema.md` §11.2.2 之 sourceKey fallback chain 設計。

### 5.4 Internal / public separation 之強制邊界

- `internalLabel` / `note` / `inactiveReason` **永遠**不可被 renderer 寫入 dist HTML（不論 GitHub / Blogger）。
- `internalLabel` 可寫入 build report / `dist-reports/` / future Admin static preview，但**永遠**不寫入 `dist/` 與 `dist-blogger/`。
- 未來 validator 可加 rule：dist HTML 不得含 `internalLabel` 字串（屬 acceptance check；可選；屬 phase 10+ 之 acceptance 範圍）。

### 5.5 與既有 `affiliate.links[].label` 之過渡關係

night-1 §4 已論證 hybrid Option C；本 phase 補上：

- 既有 `label` 對應**新模型之 `internalLabel`**（語意接近：作者辨識）
- 既有 `label` **不**自動成為 `displayLabel`（避免靜默變更前台顯示）
- 遷移 phase（per night-1 §8 phase 10）時，須**逐篇**決定 `label` 拆分為：
  - `internalLabel`（保留原文字）
  - `displayLabel`（作者明示填寫；可能與 `label` 相同，亦可能精簡為「博客來」）

→ 遷移**不可自動化**；須人工判讀。

---

## 6. Where to put the fields — frontmatter / registry / mixed / Admin?

本節分析識別欄位應放在何處；列出 4 種策略並比較。

### 6.1 Strategy A: 全部留在 article frontmatter（status quo augmented）

```yaml
affiliate:
  links:
    - linkId: "atomic-habits-books-com-tw"
      internalLabel: "原子習慣 ｜ 博客來 ｜ 通路王"
      displayLabel: "博客來"
      merchant: "博客來"
      merchantKey: "books-com-tw"
      network: "books"
      productTitle: "原子習慣"
      bookIsbn: "9789861784755"
      url: "https://whitehippo.net/AAA?uid1=blog"
      status: "active"
      note: "2026-05 結帳測試正常"
```

| Pros | Cons |
| --- | --- |
| 文章自包含；不依賴外部 registry | 同一連結出現在多篇文章 → 識別欄位重複；漂移風險高（同 URL 不同 internalLabel）|
| Git history 可看單篇文章之 commerce evolution | 「同商品多通路」反查仍須 grep 全 repo |
| 不需 loader / validator 新基礎設施 | 「平台消失」批次替換無集中入口 |
| 既有作者 mental model 完全延續 | frontmatter 過長；可讀性下降 |
| | GA4 dimension 之 `linkId` 須**作者自己**確保跨文章一致；極易漂移 |

→ **不採用**；違反 night-1 §4 集中管理動機。

### 6.2 Strategy B: 全部放 centralized registry，文章只放 ref（pure ref）

```yaml
# article frontmatter
affiliate:
  enabled: true
  commerceLinkRefs:
    - "atomic-habits-books-com-tw"
    - "atomic-habits-kingstone"
```

```json
// content/settings/commerce-links.json
{
  "schemaVersion": 1,
  "commerceLinks": [
    {
      "linkId": "atomic-habits-books-com-tw",
      "internalLabel": "原子習慣 ｜ 博客來 ｜ 通路王",
      "displayLabel": "博客來",
      "merchant": "博客來",
      "merchantKey": "books-com-tw",
      "network": "books",
      "productTitle": "原子習慣",
      "bookIsbn": "9789861784755",
      "url": "https://whitehippo.net/AAA?uid1=blog",
      "status": "active",
      "note": "2026-05 結帳測試正常"
    }
  ]
}
```

| Pros | Cons |
| --- | --- |
| 「同商品多通路」/「平台消失批次替換」/「商品 ↔ 文章反查」皆 O(1)（registry 為單一 source of truth）| 文章不再自包含（移交 / 搬家須一併搬 registry）|
| `linkId` 全 repo 唯一；GA4 dimension 穩定 | empty registry 落地後若**長期空著**就無意義 |
| Admin picker 之資料來源單一明確 | 既有 affiliate.links[] 文章須**全面遷移**；high migration cost |
| `internalLabel` / `displayLabel` 集中管理；可一次調整 | 文章端「articleSlug ↔ linkId」對應須由 build / Admin 自動推導；不能放 ref array 本身 |
| | per-article 之 placement / order / role 須**另設**欄位（避免污染 registry）|

→ **long-term 理想**；但**短期過早全面 normalize**，per night-1 §4 結論。

### 6.3 Strategy C: Mixed（短期混用 raw + ref；新欄位都進 registry；既有保留）

```yaml
# article frontmatter
affiliate:
  enabled: true
  links:
    - ref: "atomic-habits-books-com-tw"   # 新形態：ref → registry
      role: "primary"
      order: 10
    - label: "金石堂：實體書"              # 過渡：既有 raw 形態保留
      network: "聯盟網"
      url: "https://adcenter.conn.tw/3QaLi?uid1=blog"
```

**per-entry 識別欄位分布**：

| 維度 | ref 形態 | raw 形態（既有；過渡）|
| --- | --- | --- |
| `linkId` | ✅ 來自 registry | ❌ 無；長期需補 |
| `internalLabel` | ✅ 來自 registry | ⚠️ 借用既有 `label`；過載風險 |
| `displayLabel` | ✅ 來自 registry | ⚠️ 借用既有 `label` |
| `merchant` / `network` | ✅ 來自 registry | ✅ 已有 `network` 欄位（但無 `merchant`）|
| `productTitle` / `bookIsbn` | ✅ 來自 registry | ❌ 無；只能 fallback 至文章層 `book.*` |
| `articleSlug` 反查 | ✅ 由 build / Admin 自動推導 | ⚠️ 須 grep；不集中 |
| `status` / `replacementKey` | ✅ registry 集中 | ❌ 無 |
| `note` | ✅ registry 集中 | ❌ 無；只能寫文章 comment（不推薦）|

→ **mid-term 平衡點**；mirror night-1 §4 Option C 結論；本 phase 識別欄位設計亦傾向 mixed 模式。

### 6.4 Strategy D: 文章只放最少欄位 + Admin lookup table（all in registry + per-article minimal）

```yaml
# article frontmatter
affiliate:
  enabled: true
  refs:
    - id: "atomic-habits-books-com-tw"
      role: "primary"        # per-article 之顯示語意
      order: 10
    - id: "atomic-habits-kingstone"
      role: "alternate"
      order: 20
```

**設計**：文章端**只放** `id` + `role` + `order`；**所有識別 / 顯示 / 反查欄位皆在 registry**。

`role` / `order` / `labelOverride` 為**文章端 per-instance 屬性**（per night-1 §6.3），不污染 registry。

| Pros | Cons |
| --- | --- |
| 與 Strategy B 同樣集中；但保留**最少 per-article 屬性**（role / order / labelOverride）以兼顧顯示彈性 | 須先有 registry + loader + validator + Admin picker 才實用 |
| 文章 frontmatter 短小；可讀性高 | migration cost 同 B |
| `linkId` 穩定；GA4 dimension 穩定 | 文章不自包含 |
| Admin picker 之資料來源清晰 | empty registry 過渡期須謹慎處理（renderer fallback）|

→ **若**未來決定走 pure ref 模型，Strategy D 為理想形態；屬 Strategy B 之精煉版。

### 6.5 Mixed-model strategy comparison

| Strategy | Article self-contained | Bulk replacement | Stable GA4 dim | Reverse lookup | Author UX | Migration cost | Long-term fit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **A** frontmatter only | ✅ | ❌ | ❌ | ❌ | 既有 | 0 | ❌ |
| **B** pure ref | ❌ | ✅ | ✅ | ✅ | 須 Admin | high | ✅ |
| **C** mixed coexistence | ⚠️ | ⚠️ partial | ⚠️ partial | ⚠️ partial | 新舊並存 | low | ⚠️ mid-term |
| **D** minimal ref + Admin lookup | ❌ | ✅ | ✅ | ✅ | 須 Admin（含 per-instance role / order）| high | ✅ refined B |

**保守傾向**（**非裁決**）：mid-term Strategy C；long-term Strategy D（若 registry usage 與 Admin picker 落地成熟）。本 phase **不**裁決；屬獨立 schema decision phase 範圍。

### 6.6 Admin future picker 之識別欄位 contract

不論最終採 C 或 D，Admin picker 之**讀**邊界必須包含：

- `linkId`（machine；用作 ref 寫入文章）
- `internalLabel`（顯示於 picker；作者辨識）
- `merchant` / `network`（filter 維度）
- `status`（visual badge：active / inactive / replaced）
- `productTitle` / `bookIsbn` / `tags`（grouping / filter 維度）
- `usedBy[]`（反查；非必要顯示但可展開）

picker 之**寫**邊界**不啟動**（Admin Apply / middleware write / admin-write-cli remain dormant）；picker 為 **read-only preview**。

---

## 7. Recommended Conservative Direction

本節提出**保守落地建議**；mirror night-1 §10 之 cadence；補上識別欄位之**順序考量**。

### 7.1 先確認需求，再做 schema decision

不應先建 registry，再回頭想欄位該長什麼樣。應先：

1. **盤點現況**（本 phase + night-1 已完成）
2. **schema decision phase**（docs-only；裁決 Strategy C vs D；裁決必填欄位邊界）
3. **empty registry landing**（settings-only；零下游）
4. **loader read-only**（無 consumer）
5. **validator source（shape + dup-key）**（mirror download R1）
6. **validator content reference**（mirror download R2 / R5b）
7. **renderer fallback**（empty registry graceful；mirror download landing page renderer 設計）
8. **Admin picker（read-only preview）**
9. **migration of existing raw affiliate URLs**（high-risk；須 explicit approval per batch）
10. **acceptance cross-check**
11. **inactive rules + replacement rules**

每一步皆為**可獨立 ship 之最小單元**；不混批；不 short-cut。

### 7.2 識別欄位之**保守落地順序**

針對「識別欄位」維度本身，保守順序：

| step | 識別欄位範圍 | 對應 phase |
| --- | --- | --- |
| 1 | `linkId`（machine key 唯一性確認）| schema decision + empty registry landing |
| 2 | `internalLabel`（作者辨識自由文字）| empty registry landing + Admin picker |
| 3 | `displayLabel`（前台顯示；含 fallback chain）| renderer fallback |
| 4 | `merchant` / `merchantKey`（通路維度）| empty registry landing |
| 5 | `network`（對齊 `affiliate-networks.json`）| validator dup-key shape rule |
| 6 | `productTitle` / `bookIsbn` / `productId`（商品反查維度）| empty registry landing + tags 系統 |
| 7 | `status` / `replacementKey` / `inactiveReason`（替換 audit）| inactive / replacement rules |
| 8 | `usedBy[]`（反查；自動產生）| Admin / validator helper |
| 9 | `note`（internal-only 備註）| Admin |
| 10 | `tags[]`（自由分類）| 後期 |

→ 識別欄位**不**一次全 land；每 step 各自有 acceptance；validator warning-only。

### 7.3 不先 seed registry；不先碰既有文章

per night-1 §10.2 + §10.3：

- empty registry 上線時**絕對 empty**（schemaVersion + 空 array + notes）
- 既有 `affiliate.links[]` raw URL **不**自動遷移；migration 為獨立 phase，須 explicit approval
- 既有 `label` **不**自動 split 為 `internalLabel` + `displayLabel`；migration 為人工判讀

### 7.4 不啟動 dormant rails

per night-1 §9.3：

- reverse UTM remains dormant
- pm-26 deploy gate remains BLOCKED
- Admin Apply / middleware write / admin-write-cli remain dormant
- 不引入 Google Form respondent data / Sheets API
- 不引入聯盟 dashboard API / OAuth token

---

## 8. Risks / Red Lines

### 8.1 紅線（永遠 enforced）

- ❌ **`internalLabel` / `note` / `inactiveReason` 永不渲染至 dist HTML**（GitHub / Blogger 皆然）；屬 internal-only。
- ❌ **`linkId` 永不改名**（一旦發出即穩定；rename = 重建 entry + 標 `status: deprecated` + `replacementKey: <new id>`）。
- ❌ **不自動替換 production raw URL**（即使 registry 已建好）；任何文章端 URL 動作須 explicit user approval per batch。
- ❌ **不用 URL pattern 推斷商品**（per §3.1）；不可由 `whitehippo.net` 推斷「這是博客來」（聯盟 redirect 可能跳任何商品）。
- ❌ **不把使用者表單資料 / 訂單 / 收件人資料進 repo**（mirror download registry R1 紅線）。
- ❌ **不啟用 deploy / Blogger repost / GA4 validation / reverse UTM / pm-26 / Admin Apply / middleware write / admin-write-cli**。
- ❌ **不在 docs 內貼真實 affiliate token**（即使 read-only inventory 亦然；本 phase 使用 placeholder 如 `atomic-habits-books-com-tw`，URL 範例僅取自既有公開 production frontmatter）。
- ❌ **不放聯盟 dashboard credentials / API key / OAuth token / commission data**。
- ❌ **不**在 schema decision 未完成前 seed registry with real linkIds（即使是「先佔幾個 sample」亦不可；mirror download empty registry 紅線）。

### 8.2 設計風險

- **過早決定 schema**：必填邊界一旦定錯（如把 `displayLabel` 訂為必填），後續逆轉成本高 → 採 warning-only validation；rule landing 前先 fixture-first。
- **`internalLabel` 漂移**：未來若改自由文字格式（如統一加上 ISBN 前綴），既有 entry 不會自動更新 → Admin 端可加 lint warning，但**不**強制改動；屬 long-tail acceptance。
- **`linkId` 命名衝突**：未來商品變多（如「原子習慣」與「原子習慣 經典套書版」），兩者 `productTitle` 都含「原子習慣」但 `linkId` 不同 → 命名 convention 須在 schema decision 階段明定（如 `<product-slug>-<merchant>-<network>` 三段式；或自由格式 + 唯一性 validator）。
- **migration 漏遷**：若 hybrid 永遠是 hybrid（per night-1 §4 Option C cons），「批次替換」目標只 partial 達成 → 須在 acceptance phase 加上「raw URL 殘留統計」報表，提醒 long-tail。
- **GA4 dimension 衝突**：`linkId` 與 `link_source_key`（per `related-links-schema.md` §11.5）為 sourceKey 系統；兩者不可混用 → 命名空間應隔離（commerce 用 `commerce_link_id` 或 `affiliate_link_id`，避免與 `link_source_key` 衝突）。

### 8.3 acceptance 風險

- **registry 大時 picker 效能**：100+ entries 時 picker filter 須有效；屬 Admin 工程；本 phase 不涉。
- **`usedBy[]` 自動推導之同步**：若由 build 階段產出 then write back 至 registry → 違反 registry 為 source of truth 原則 → 應由**獨立 inventory report**（如 `dist-reports/commerce-link-usage.json`）承擔，**不**寫回 registry。

### 8.4 與既有 dormant gates 之關係

| Gate | 本 phase | 未來識別欄位 phases |
| --- | --- | --- |
| reverse UTM | 不啟動 | 不啟動 |
| pm-26 deploy gate | 不解除 | 不解除 |
| Admin Apply / middleware write / admin-write-cli | 不啟動 | 不啟動（picker 為 read-only）|
| Download registries | 不動 | 不動（保持 empty）|
| sourceKey registry / GA4 link_source_key emission | 不動 | commerce `linkId` GA4 dimension 採**獨立**命名空間，不混 |

---

## 9. Future Phases — 識別欄位專屬之 phase ladder

本節列出**識別欄位**為焦點之 future phase ladder；與 night-1 §8 之 phase ladder 對齊但**聚焦識別欄位**。

| # | Phase 類型 | 範圍（識別欄位視角）| 風險 | 阻擋條件 |
| --- | --- | --- | --- | --- |
| 1 | **本 phase**：identifier preanalysis | docs-only | 無 | n/a |
| 2 | **schema decision (identifier-focused)**：裁決 `linkId` 命名 convention、`internalLabel` 規範、必填邊界、ref 形態 | docs-only | 無 | yes |
| 3 | **empty registry landing**：`commerce-links.json` empty shape（含 schemaVersion / commerceLinks: [] / notes）| settings-only | 低 | yes |
| 4 | **loader read-only**：`load-settings.js` 加 `readJsonOptional` for commerce-links；無 consumer | source（loader）| 低 | yes |
| 5 | **validator registry-level (shape + dup linkId)**：mirror download R1 | source（validator）；warning-only | 低 | yes |
| 6 | **fixtures**：合法 / 違規 fixture for shape / dup-linkId | content（fixtures only） | 極低 | yes |
| 7 | **validator content-reference (ref not-found)**：mirror download R2 | source + fixtures | 低 | yes |
| 8 | **renderer fallback**：post-detail / blogger-post-full 讀 ref → registry lookup；empty registry graceful placeholder | source（renderer）| 中 | yes |
| 9 | **Admin picker (read-only preview)**：列表 + filter + grouping by `productTitle` / `merchantKey` / `tags` | source（Admin）| 中 | renderer 邊界穩定後 |
| 10 | **migration of existing raw affiliate URLs**：逐篇 / 批次將 `affiliate.links[]` raw URL 進 registry；split `label` → `internalLabel` + `displayLabel` | content + registry；high impact | **高** | explicit approval per batch + rollback plan |
| 11 | **validator inactive / replacement rules**：`commerce-link-ref-inactive` / `commerce-link-ref-replaced` warnings | source + fixtures | 低 | yes |
| 12 | **usedBy report generator**：build 階段產出 `dist-reports/commerce-link-usage.json`（不寫回 registry）| source（build script）| 低 | yes |
| 13 | **acceptance cross-check**：read-only 驗收 identifier 一致性 + raw URL 殘留統計 | docs-only | 無 | yes |
| 14 | **deploy / Blogger repost / GA4 validation** | infra | 中 | explicit approval + pm-26 解除（屬 long-term；非本 series 範圍）|

每個 candidate phase 皆**不解除** dormant rails（per §8.4）。

---

## 10. Final Recommendation

### 10.1 本 phase 之 single conclusion

> **「識別欄位」應採三軸獨立模型**：`linkId`（machine-stable，永不改）+ `internalLabel`（作者辨識，永不渲染前台）+ `displayLabel`（公開顯示，可調整）；再補上反查維度（`productTitle` / `bookTitle` / `bookIsbn` / `productId` / `merchantKey` / `usedBy[]` / `tags[]`）以支撐「同商品多通路」、「平台消失批次替換」、「文章 ↔ 連結反查」三類查詢。**本 phase 不裁決 schema、不啟動實作、不建 registry、不改 content、不改 source、不改 Admin**。下一步建議為 **schema decision phase（identifier-focused）**；屬獨立 phase，亦為 docs-only。

### 10.2 本 phase 結束後預設狀態

**Final Idle Freeze / EXIT**。

本 phase 唯一輸出為本檔；不動 source / content / settings / templates / fixtures / package / dist / gh-pages / memory；validate baseline 維持 **0 errors / 60 warnings / 53 posts**；所有 dormant gates 維持 dormant；所有紅線維持 enforced。

### 10.3 若 user 決定推進，建議下一步（依風險由低至高）

1. **schema decision phase (identifier-focused)**（docs-only；裁決 `linkId` 命名 + `internalLabel` 規範 + 必填邊界）
2. **read-only acceptance cross-check**（如 night-1 §10.2 step 1；含 raw URL 分布盤點，但**不**輸出真實 URL）
3. **empty registry landing**（settings-only；single file add；零下游）
4. **loader read-only**（source；無 consumer）

⚠️ **不可推進之 short-cut**：

- ❌ 不可直接 seed registry with real linkIds / 真實 affiliate URLs
- ❌ 不可直接改 template 加 `linkId` 欄位（須等 schema decision）
- ❌ 不可直接改 renderer（須先有 registry + loader + validator）
- ❌ 不可在 schema decision 未完成前批次改 production content

---

## Appendix A — Cross-reference index

- `docs/20260603-commerce-affiliate-link-registry-preanalysis.md`（night-1；本 phase 之前置 docs）
- `CLAUDE.md` §1（不過度工程化原則）/ §12（書評 affiliate.links schema）/ §16（連結處理 / external / affiliate / internal rel）/ §27 / §29 / §30
- `docs/related-links-schema.md` §11.2.1（sourceKey vs displayLabel 分離）/ §11.2.2（fallback chain）/ §11.5（GA4 link_source_key）
- `docs/click-tracking-governance.md` §6（data attr convention）/ §7（affiliate CTA tracking）
- `docs/ga4-link-tracking-spec.md` §4.3（link_source_key conditional emit）
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`（registry schema 紅線 R1）
- `docs/20260531-download-empty-registry-implementation-plan.md`（empty registry landing pattern）
- `docs/20260602-download-registry-aware-validation-preanalysis.md`（R-series cadence 範本）
- `docs/20260603-download-landing-page-content-model-decision.md`（content model decision pattern 範本）
- `docs/20260601-sourcekey-admin-selector-preanalysis.md`（Admin picker preanalysis pattern）
- `docs/20260601-sourcekey-source-inactive-validator-preanalysis.md`（inactive / status track 設計範本）
- `content/settings/affiliate-networks.json`（既有 network registry；2 entries）
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
- HEAD（pre-commit）：`3cbb2fd0c0f7ffc9882c8abcdff289fb80186a2c`（short `3cbb2fd`）
- `HEAD == origin/main`（pre-commit）：yes（ahead / behind = `0 / 0`）
- working tree（pre-commit）：clean
- latest commit subject（pre-commit）：`docs(commerce): plan affiliate link registry strategy`
- `npm run validate:content`（pre-commit）→ **0 errors / 60 warnings / 53 posts**

本 phase 結束後預期：

- 唯一新增：本檔 `docs/20260603-commerce-affiliate-link-registry-identifier-preanalysis.md`
- 其他狀態完全不變
- `npm run validate:content` 預期維持 **0 / 60 / 53**

---

（本文件結束）
