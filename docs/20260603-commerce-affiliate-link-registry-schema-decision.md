# 2026-06-03 Commerce / Affiliate Link Registry — Schema Decision

Phase name: `20260603-night-18-commerce-affiliate-link-registry-schema-decision-docs-only-a`
Date: 2026-06-03 22:29 +0800
Mode: **docs-only schema decision**（no source / no content / no settings registry mutation / no templates / no fixtures / no loader / no validator rule landing / no renderer / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no real affiliate link added / no registry seeding）

---

## 1. Executive Summary

### 1.1 一句話結論

> **本階段為純 docs-only schema decision**：裁決 **near-term 採 Strategy C（mixed coexistence）**、**long-term 收斂至 Strategy D（minimal ref + Admin lookup）**；鎖定 **`linkId` 三段式命名 convention**（`<kind>-<product-slug>-<merchant-key>`，lowercase kebab-case；非數字 / 非中文 / 非 affiliate token / 非完整 URL / 非價格 / 非活動字樣）；確認 **三軸欄位嚴格分離原則**（`linkId` machine-stable / `internalLabel` author-only / `displayLabel` public-facing）；**不**建立實際 registry、**不**改任何文章、**不**改 validator、**不**改 renderer、**不**改 Admin。

### 1.2 本階段的事情

- 將 `docs/20260603-commerce-affiliate-link-registry-identifier-preanalysis.md` 提出之三軸獨立 + 反查維度模型，**正式裁決為設計基準**。
- 將 `docs/20260603-commerce-affiliate-link-registry-preanalysis.md` §4 之 Option A / B / C 候選，**正式裁決為 near-term C → long-term D 的兩段式收斂路徑**。
- 鎖定 `linkId` 之命名規則（含 good / bad examples）。
- 凍結 registry v0 之候選欄位集合（每欄位標 required / optional、frontend visible / author-only、stable / mutable、suitable for Admin picker display or not）。
- 凍結 article frontmatter 之**過渡期混用規則**與**何時可移除 raw URL** 之邊界。
- 凍結 replacement / fallback / migration 策略邏輯（無實際 entry）。
- 凍結 GA4 / click tracking alignment 之**不擴張 scope** 紅線。
- 凍結 Admin picker 顯示 contract（read-only preview only）。
- 凍結 validator 未來 warning-only rule 候選清單（不啟動）。
- 凍結 risk / red lines 與下一階段之 phase ladder。

本階段 **不**：seed registry / 建 fixture / 改 template / 改 validator / 改 renderer / 改 Admin / 改 source / 改 content / 改 settings registry / 建 commerce-links.json。

---

## 2. Baseline Summary

### 2.1 git / validate baseline

| 項目 | 值 |
| --- | --- |
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD（pre-commit）| `794a9cec96f8d36fce85815c7e5deb82cdb3a0dd`（short `794a9ce`）|
| `HEAD == origin/main`（pre-commit）| yes（ahead / behind = `0 / 0`）|
| working tree（pre-commit）| clean |
| 最新 commit subject（pre-commit）| `docs(commerce): plan affiliate link identifiers` |
| `npm run validate:content`（pre-commit）| **0 errors / 60 warnings / 53 posts** |

### 2.2 三軸模型（per night-17）

| 軸 | 命名 | 角色 | 是否顯示前台 | 是否進 GA4 dimension | 穩定性 |
| --- | --- | --- | --- | --- | --- |
| **Machine identity** | `linkId` | stable key；build / registry ref / GA4 dimension | ❌ 否 | ✅ 是（commerce 命名空間）| **永不改名** |
| **Internal label** | `internalLabel` | 作者辨識 / Admin picker / inventory docs | ❌ **嚴格不渲染** | ❌ 否 | 可調整 |
| **Public display** | `displayLabel` | 前台讀者顯示按鈕文字 | ✅ 是 | ⚠️ 可選作 `link_label` event param | 可隨品牌調整 |

本階段**正式採用**此三軸模型；不重啟此維度之裁決。

### 2.3 既有 relatedLinks / sourceKey / GA4 / click tracking 之限制

per night-1 §3 + night-17 §2.3：

- `affiliate.links[].label` 過載（同時擔任作者辨識 / 前台顯示 / network 提示 / 用途暗示）
- raw URL 無穩定 pattern → 無法用 regex / hostname 批次替換
- 「商品 ↔ 多通路」與「連結 ↔ 文章」無 reverse index
- GA4 dimension 只到 network 粒度（`affiliate-networks.json` 之 `id: "books"` / `"affiliate-network"`），不到「個別連結」粒度
- `link-sources.json` 之 sourceKey 系統粒度為「平台」（YouTube / 圖書館），**不適用** commerce 之「平台 × 商品」粒度
- `affiliate-networks.json` 只管 `network` 顯示名與 rel，**不**管 affiliate URL
- `link-rules.json` 之 `affiliate.rel: "sponsored nofollow noopener noreferrer"` 為自動化規則來源；commerce registry 不取代它

→ 三軸 + 反查維度 + ref model 必須**整套**才能解決，缺一不可。

---

## 3. Strategy Decision

### 3.1 重述候選

per night-1 §4 + night-17 §6：

- **Strategy A**：frontmatter only（status quo）→ 不採用（與集中管理目標相違）
- **Strategy B**：pure ref（文章只放 ref；所有欄位皆在 registry）→ long-term 候選之一
- **Strategy C**：mixed coexistence（ref + raw URL 共存；新欄位 ref，既有 raw 保留）
- **Strategy D**：minimal ref + Admin lookup（文章只放 `id` + `role` + `order`；其餘全 registry；Admin picker 為主要管理介面）

### 3.2 裁決

**近期（near-term）：Strategy C — Mixed Coexistence**
**長期（long-term）：Strategy D — Minimal Ref + Admin Lookup**

### 3.3 為什麼 near-term 採 Strategy C

| 維度 | 理由 |
| --- | --- |
| **migration cost** | production 僅 1 篇含 raw affiliate（`20260515-we-media-myself2.md`，且 `enabled: false`）；其餘 52 posts 不含 affiliate；強制全面遷移成本與當前需求不成比例 |
| **作者熟悉度** | 既有 `affiliate.links[]` 模型作者已熟；強迫一夜換 schema 會破壞既有 workflow |
| **registry 未成熟** | empty registry / loader / validator / renderer / Admin picker 皆未落地；強迫只能放 ref，**沒有 picker 卻只剩 ref**，DX 體驗極差 |
| **CLAUDE.md §1 不過度工程化** | first-version-MVP 階段；ref 為 additive opt-in；不破壞既有自包含性 |
| **mirror download R-series 之 hybrid 收斂節奏** | download registry 也走 empty registry + read-only + warning-only validator + 不強迫 migration 的 cadence；commerce 走同樣節奏 |
| **平台消失 partial 替換已優於現狀** | 即使 hybrid 永遠是 hybrid，「已遷至 ref 的部分」可一次性替換；範圍縮小即降低 long-term cost |
| **rollback friendly** | hybrid 模式下，從 ref 退回 raw URL 為 trivial；從 pure ref（Strategy B/D）退回 raw URL 須補 schema 才能 render |

### 3.4 為什麼 long-term 收斂至 Strategy D 而非 B

D 為 B 之精煉版（per night-17 §6.4）；差別在 D 保留**最少 per-article 屬性**（`role` / `order` / `labelOverride`）以兼顧顯示彈性：

- 同一商品在不同文章可能擔任不同角色（「原子習慣」於 A 文是 primary、於 B 文是 alternate）→ 此屬於**文章端 per-instance 屬性**，污染 registry 會破壞「registry = source of truth」原則。
- per-article `role` / `order` / `labelOverride` 是必要的「per-instance 顯示語意」；不應強迫進 registry。
- 純 Strategy B 之 ref-only 模式無法表達 per-instance 屬性；長期會逼出 ad-hoc workaround。
- D 之 `id + role + order + labelOverride` 為最小可表達集合；剛好。

### 3.5 為什麼不 near-term 直接走 D

- 須先有 empty registry + loader + validator + renderer + Admin picker 才實用（per night-17 §6.4 cons）
- 任一 step 缺漏 → 作者只能改文章 frontmatter 卻看不到結果 → DX 災難
- empty registry 落地後若**長期空著**就無意義 → 須配合 migration 才完整 → migration 屬 high-risk phase

→ near-term 之 Strategy C 為**「先讓 ref 機制可用，再逐步遷移 raw → ref」**之自然路徑；long-term 之 Strategy D 為**「ref 全面落地 + Admin 主導管理」**之收斂目標。

### 3.6 對 production migration 之影響

| 影響面 | near-term C | long-term D |
| --- | --- | --- |
| 既有 ready posts | **不**強迫改 | 須**逐篇** explicit approval 遷移 |
| 既有 `affiliate.links[].label` | 保留為 raw 形態；新增 ref 形態為平行 entry | `label` 拆 → `internalLabel` + `displayLabel`（人工判讀；不自動） |
| 既有 raw URL | 保留；renderer fallback 既有 path | 全面 ref；raw URL 完全移除 |
| validator rules | warning-only（dup-key / shape / ref-not-found / intra-post duplicate）| 加 inactive / replacement / raw-residue 警告 |
| rollback path | trivial（移除 ref → raw 自動 fallback）| 須補 raw URL 才能 render（high cost） |

### 3.7 對 Admin picker 之影響

- near-term C：picker 為 **optional UX 提升**；無 picker 時作者仍可直接 grep registry 或翻 docs；可慢慢做。
- long-term D：picker 為 **必要管理介面**；無 picker 時作者**無法**找到 linkId（registry 大時手翻不可行）→ picker 須先穩定，才可推 D。

兩階段**皆**：picker 為 **read-only preview**；不啟動 Admin Apply / middleware write / admin-write-cli。

### 3.8 對 renderer fallback 之影響

| 階段 | renderer 行為 |
| --- | --- |
| near-term C，registry empty 或 ref not-found | 走既有 raw URL pipeline（既有 `label` / `network` / `url`）→ 渲染如同 status quo |
| near-term C，registry has entry 且 ref 命中 | registry lookup → 取 `displayLabel` / `url` / `network` → emit anchor with rel from `affiliate-networks.json` |
| long-term D，registry has entry 且 ref 命中 | 同上；無 raw URL fallback path |
| long-term D，ref not-found | placeholder（mirror download empty registry graceful fallback）；validator warn |

「ref not-found → graceful placeholder」之設計 mirror `docs/20260603-download-landing-page-content-model-decision.md` 之 download landing page renderer 設計，**不**讓 build 因 ref 失誤 fail。

---

## 4. linkId Naming Convention

### 4.1 形式規則

| 規則 | 說明 |
| --- | --- |
| **lowercase kebab-case** | `[a-z0-9-]+`；只用小寫拉丁字母 / 數字 / hyphen |
| **不含中文** | 中文於 url-safe / git diff / log / 跨檔 grep 表現皆遜於 ASCII；中文留給 `internalLabel` / `displayLabel` |
| **不以數字開頭** | 第一字元為 `[a-z]`；避免與內部 ID 慣例衝突；不含 `0010xxxxxx` 之類書商 product id（不穩定 + 不可讀） |
| **不放完整 URL** | URL token 變動會逼 rename → 違反 `linkId` 永不改名原則 |
| **不放 affiliate redirect token** | `whitehippo.net/3QaKr` 之 `3QaKr` 屬平台隨機；不穩定 |
| **不放日期作為主要識別** | `2026-05-15-...` 為文章日期語意；linkId 為商品 × 通路語意；兩者不應混 |
| **不放容易變動的價格 / 活動字樣** | `xxx-shopee-promo-666` 之 `666` 隨活動結束失效 |
| **不放結算 / commission 數據** | 完全不出現 |
| **不放帳號 email / dashboard token** | 紅線 |
| **三段式建議**（**非強制**） | `<kind>-<product-slug>-<merchant-key>`；如 `book-atomic-habits-books-com-tw` |
| **長度建議 ≤ 60 字元** | 過長 → 文章 frontmatter 與 registry 都難讀 |
| **kind prefix 列舉**（**non-binding**）| `book-` / `product-` / `download-` / `official-` / `media-` 等；對齊 night-1 §5.2 之 `destinationType` enum |
| **dup check** | 全 registry 唯一；validator 未來 `commerce-link-dup-key` warning |
| **rename = 重建** | 一旦發出**永不改名**；rename 須 `status: deprecated` + `replacementKey: <new id>` + 新 entry |

### 4.2 Good examples

| linkId | 說明 |
| --- | --- |
| `book-atomic-habits-books-com-tw` | 書 × 博客來；商品穩定（書名）+ 通路穩定（merchantKey）|
| `book-atomic-habits-kingstone` | 同書 × 金石堂 |
| `book-atomic-habits-shopee` | 同書 × 蝦皮 |
| `book-atomic-habits-publisher-official` | 同書 × 出版社官網（無 affiliate）|
| `book-we-media-myself-books-com-tw` | 「自媒自創」× 博客來 |
| `product-bagel-phonics-card-shopee` | 教具產品 × 蝦皮 |
| `download-bagel-phonics-blogger` | 教具下載（Blogger 平台託管）|
| `official-fineart-publisher-main` | 出版社主站（無關特定商品）|
| `media-bagel-podcast-spotify` | 媒體 × Spotify |

### 4.3 Bad examples

| linkId | 為何 bad |
| --- | --- |
| `3QaKr` | 平台 redirect token；不穩定；不可讀 |
| `https-whitehippo-net-3qakr` | 把 URL 塞入；違反不放完整 URL |
| `原子習慣-博客來` | 含中文 |
| `Atomic-Habits-BooksComTw` | 大小寫混用；非 kebab-case |
| `2026-05-15-atomic-habits` | 用日期作主要識別 |
| `atomic-habits-promo-666` | 含活動 / 價格字樣 |
| `link-001` | 無語意；無人類辨識 |
| `books-0010987654` | 書商內部 product id（不可讀；可能變）|
| `atomic-habits` | 無 merchant 維度 → 同書多通路 dup-key |
| `atomic-habits-books-com-tw-whitehippo-3qakr` | 含 affiliate redirect token |
| `book-atomic-habits-books-com-tw-special-edition-2026` | 過長 + 含日期 + 含版本（版本應走另一 linkId）|

### 4.4 重述紅線

- ❌ rename = 重建 entry + `status: deprecated` + `replacementKey`；**永不改名**
- ❌ 不含 PII / 帳號資訊 / token / dashboard credentials
- ❌ 不可由 URL pattern / regex 反推 linkId（reverse engineering 違反穩定性原則）
- ❌ 不為了「節省字數」而把 merchant 拿掉 → 變成「同商品多通路 dup-key」

---

## 5. Proposed Registry Schema v0

⚠️ **本節為 schema decision 之候選欄位定稿**；但**本階段不建立實際 `commerce-links.json`**；實際 file landing 屬獨立 empty registry phase。

### 5.1 Registry 整體 shape（建議）

```jsonc
{
  "schemaVersion": 1,
  "updatedAt": "",
  "commerceLinks": [],
  "notes": ""
}
```

落點（**建議**）：`content/settings/commerce-links.json`（mirror 既有 settings 慣例；per CLAUDE.md §3.2）。

### 5.2 Per-entry 欄位（v0 候選定稿）

| # | 欄位 | required / optional | frontend visible | stable / mutable | Admin picker display | 說明 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `linkId` | **required** | ❌ no | **stable**（永不改名）| ✅ primary | machine key；§4 命名規則；GA4 dimension |
| 2 | `internalLabel` | **required** | ❌ **strict no** | mutable | ✅ primary | 作者辨識；自由文字；建議「商品名 ｜ 通路名 ｜ network」格式（非強制）|
| 3 | `displayLabel` | optional | ✅ yes | mutable | ✅ secondary | 前台顯示文字；未填 fallback 至 `merchant`（per §5.3）|
| 4 | `targetUrl` | **required** | ✅ yes（為 anchor href）| mutable | partial（hostname only）| 實際目標 URL；改 URL 不改 linkId |
| 5 | `merchantKey` | **required** | ❌ no | **stable** | ✅ filter | 通路 machine key（如 `books-com-tw` / `shopee-tw` / `publisher-official`）|
| 6 | `merchant` | optional | ✅ yes（為 displayLabel fallback）| mutable | ✅ filter / secondary | 通路顯示名（如「博客來」）|
| 7 | `networkKey` | optional | ❌ no | **stable** | ✅ filter | affiliate network id；對齊 `affiliate-networks.json` 之 `id`（`books` / `affiliate-network` / `direct` / `shopee-affiliate` 等）|
| 8 | `sourceKey` | optional | ❌ no | **stable** | ✅ filter | 對齊 `link-sources.json` 之 `sourceKey`（**獨立命名空間**；不混用；用於跨 schema 之 reverse lookup hint）|
| 9 | `productTitle` | optional | ⚠️ optional（Admin 預覽可顯示）| mutable | ✅ grouping | 商品 / 書本顯示標題（如「原子習慣」）|
| 10 | `bookTitle` | optional | ⚠️ optional | mutable | ✅ grouping | 書評文章專用；與 `productTitle` 擇一即可 |
| 11 | `itemName` | optional | ⚠️ optional | mutable | ✅ grouping | 非書非典型商品之名（如教具 / DVD / 雜誌）；與 productTitle/bookTitle 任一即可 |
| 12 | `bookIsbn` | optional | ❌ no | **stable**（出版業標準）| ✅ grouping | 書本 ISBN；跨通路精準對齊 |
| 13 | `productId` | optional | ❌ no | stable（per merchant）| optional | 非書商品 SKU；用於跨通路反查（少用）|
| 14 | `usedBy` | optional（**不**由作者手填）| ❌ no | derived | ✅ secondary | 反查文章 slug 列表；由 build / Admin 自動產生（不寫回 registry；屬 inventory report）|
| 15 | `tags` | optional | ❌ no | mutable | ✅ filter | 任意分類（如 `["book", "parenting"]`）|
| 16 | `rel` | optional | ✅ yes（anchor rel 屬性）| mutable | ❌ | 若需 override `link-rules.json` 之 `affiliate.rel`；通常不填，由 `networkKey` lookup 派生 |
| 17 | `sponsored` | optional（boolean）| derived | mutable | ❌ | 若 true 強制加 `sponsored` rel token；通常由 `networkKey` 派生，不手填 |
| 18 | `active` | **required**（boolean，default true）| derived | mutable | ✅ status badge | active=true → renderer 正常輸出；active=false → renderer 視 fallback 處理；validator warn |
| 19 | `replacementTarget` | optional | ❌ no | mutable | ✅ when present | 當 active=false 時，指向**新的** `linkId`；renderer **不**自動 follow（避免文章靜默變更）|
| 20 | `deprecatedAt` | optional | ❌ no | mutable | ✅ when present | ISO 日期；active=false 之失效時點 |
| 21 | `notes` | optional | ❌ **strict no** | mutable | ✅ Admin only | 作者備註（如「2026-05 結帳異常」/「聯盟網結束服務」）；**永遠**不渲染前台 |
| 22 | `schemaVersion` | **required**（registry-level）| ❌ | stable | ❌ | per registry root |
| 23 | `updatedAt` | optional（registry-level + entry-level 皆可）| ❌ | mutable | optional | ISO 日期 |

### 5.3 顯示 fallback chain（renderer 端）

從高優先至低優先：

```
1. article-level labelOverride（若 entry 有此選填欄位且非空）
2. registry.displayLabel（若非空）
3. registry.merchant（若非空）
4. humanize(registry.merchantKey)（fallback；可在 Admin warn 提示補 displayLabel）
```

對齊 `docs/related-links-schema.md` §11.2.2 之 sourceKey fallback chain 設計。

### 5.4 不放入 schema 之欄位（明確排除）

| 欄位 | 為何排除 |
| --- | --- |
| `commissionRate` / `payoutAmount` / `paymentStatus` | 結算數據；屬 affiliate dashboard；紅線 |
| `clickCount` / `conversionCount` | GA4 / 聯盟平台已有；不在 registry 重複 |
| `apiKey` / `oauthToken` / `accountEmail` | PII / secrets；紅線 |
| `affiliateRedirectToken` / `subid` / `sid` | 平台機制；屬 URL 本身內含 |
| `userOrderData` / `respondentData` | 紅線（同 download R1）|
| `priceHistory` / `currentPrice` | 不爬商品頁；不存價格 |

### 5.5 v0 與 v1 之邊界

- v0 = 本節 §5.2 之 23 欄位（含 schemaVersion / updatedAt）
- v1 可能加入：`role` / `order` 等**文章端 per-instance 屬性**（per §6.2 long-term D 之候選）；但這些**不**放 registry，放 article frontmatter 之 ref entry → v0 registry 不含
- v1 可能加入：`inactiveReason` 文字描述（與 `deprecatedAt` 配對；v0 已含 `notes` 可承擔，暫不分欄位）
- 任何 v0 → v1 升級皆走 schemaVersion 升版 + migration phase；本階段不規劃

---

## 6. Article Frontmatter Reference Model

### 6.1 候選形態比較

| 形態 | 範例 | 適用階段 |
| --- | --- | --- |
| **(a) 只放 linkId** | `commerceLinkRefs: [ "book-atomic-habits-books-com-tw" ]` | long-term D；簡單情境 |
| **(b) linkId + per-instance attrs** | `commerceLinks: [{ ref, role, order, labelOverride }]` | long-term D；多 link 需 ordering / role 區分 |
| **(c) linkId + CTA position** | `commerceLinks: [{ ref, position: "top" \| "bottom" \| "inline" }]` | 與 (b) 合併；position 為 per-instance 屬性 |
| **(d) raw URL coexist fallback** | 既有 `affiliate.links[]` 之 raw 形態；renderer fallback | near-term C 過渡期 |

### 6.2 near-term C 之過渡期混用規則

```yaml
# 過渡期合法：兩種形態於同一 affiliate.links[] 共存
affiliate:
  enabled: true
  disclosure: "本文包含聯盟行銷連結..."
  position:
    top: true
    bottom: true
  links:
    # 新形態（ref → registry）
    - ref: "book-atomic-habits-books-com-tw"
      role: "primary"        # per-instance；optional
      order: 10              # per-instance；optional
    # 過渡形態（既有 raw；保留不動）
    - label: "金石堂：實體書"
      network: "聯盟網"
      url: "https://adcenter.conn.tw/3QaLi?uid1=blog"
```

renderer 對 per-entry 判別：

```
if (entry.ref is non-empty trimmed string) {
  → registry lookup 路徑
  → registry not-found → graceful placeholder + validator warn
} else if (entry.url is non-empty trimmed string) {
  → 既有 raw URL 路徑（既有 label / network / url）
}
```

### 6.3 long-term D 之純 ref 模型（未來目標）

```yaml
affiliate:
  enabled: true
  disclosure: "本文包含聯盟行銷連結..."
  position:
    top: true
    bottom: true
  commerceLinks:
    - ref: "book-atomic-habits-books-com-tw"
      role: "primary"
      order: 10
    - ref: "book-atomic-habits-kingstone"
      role: "alternate"
      order: 20
    - ref: "book-atomic-habits-publisher-official"
      role: "official"
      order: 30
```

無 raw URL；無 `label` / `network` / `url` 直填。

### 6.4 哪些欄位**不能**直接在文章內重複維護

文章端**不可**自填以下（屬 registry 之 source of truth）：

- `linkId`（只放 ref，不重定義）
- `targetUrl`
- `merchantKey` / `merchant`
- `networkKey`
- `productTitle` / `bookTitle` / `itemName`
- `bookIsbn` / `productId`
- `tags`
- `active` / `replacementTarget` / `deprecatedAt`
- `notes`
- `rel` / `sponsored`（由 registry × `link-rules.json` 派生）

文章端**可**自填以下（per-instance 屬性）：

- `ref`（指向 registry）
- `role`（如 `primary` / `alternate` / `price-check` / `official` / `library`）
- `order`（顯示順序）
- `labelOverride`（per-instance 之 displayLabel 覆蓋；不寫回 registry）

### 6.5 何時可以移除 raw URL

**前提條件全部滿足**：

1. registry 已有對應 entry，且 `active: true`
2. validator 已通過 `commerce-link-ref-not-found` 檢查
3. renderer 已落地 registry lookup 路徑
4. dist 輸出已 byte-identical-modulo-builtAt 驗證（mirror download landing page 之 sanity check）
5. user explicit approval per batch（不批次自動執行）

**不滿足任一條 → raw URL 不可移除**。

### 6.6 raw URL 是否允許新增

- near-term C 期間：**允許**新增 raw URL（為了不阻擋作者；但建議優先用 ref）
- long-term D：**禁止**新增 raw URL；validator warn-only（或 error，待 phase 11 決定）

### 6.7 與既有 `affiliate.links[].label` 之過渡關係

per night-17 §5.5：

- 既有 `label` 對應**新模型之 `internalLabel`**（語意接近：作者辨識）
- 既有 `label` **不**自動成為 `displayLabel`（避免靜默變更前台顯示）
- 遷移時人工拆：`label` → `internalLabel`（保留原文字）+ `displayLabel`（作者明示填寫）
- 遷移**不可自動化**；須人工判讀

---

## 7. Replacement / Migration Strategy

### 7.1 情境覆蓋

| 情境 | 處理策略 |
| --- | --- |
| **聯盟網結束服務** | 全 registry grep `networkKey: "affiliate-network"` → 對每 entry：(a) 換 `networkKey` + 換 `targetUrl`；(b) 改為 `direct`（無 affiliate）；(c) `active: false` + `replacementTarget` |
| **通路王變更網址結構** | 對應 entries 更新 `targetUrl`（不改 `linkId`）；validator 無感 |
| **博客來 → 蝦皮**（某書） | 原 entry `active: false` + `deprecatedAt` + `replacementTarget: <new linkId>`；新建 entry `book-<slug>-shopee` |
| **官方網站取代 affiliate** | 新建 `official-` prefix entry；舊 affiliate entry `active: false` + `replacementTarget` 指向新 entry |
| **某 link 暫停使用但文章還存在** | `active: false`；不刪 entry；renderer 視 fallback 處理；validator warn |
| **同商品有新版本**（如「原子習慣 經典套書版」）| 新建 entry（如 `book-atomic-habits-classic-set-books-com-tw`）；舊 entry 保留 active；兩者並存 |

### 7.2 active=false 之 renderer 處理

| 設定 | renderer 行為 |
| --- | --- |
| `active: true` | 正常輸出 anchor |
| `active: false` + 無 `replacementTarget` | 不輸出該 link（mirror download empty registry graceful）；validator warn `commerce-link-ref-inactive` |
| `active: false` + `replacementTarget: <id>` | renderer **不**自動跳新 entry；仍不輸出該 link；validator warn `commerce-link-ref-replaced` 並提示作者手動改文章 ref |

⚠️ **紅線**：renderer **永不**自動將文章 ref 替換為 `replacementTarget`；任何文章端 URL 變動須**作者明示**改 frontmatter。

### 7.3 deprecatedAt 用途

- 屬 audit field；ISO 日期格式
- 不影響 renderer 行為（僅 active 影響）
- Admin picker 可顯示 badge（如「已停用 6 個月」）
- validator 可選用 `commerce-link-long-deprecated` warn（未來）

### 7.4 migration note 規格

- 寫入 `notes` 欄位（per §5.2 #21）
- 格式建議（**非強制**）：`<YYYY-MM-DD> <事件描述>`，例：`2027-03-15 聯盟網結束服務，改用直連博客來`
- **內容永不渲染前台**（紅線）

### 7.5 validator warning-only 之未來 rule（規劃，不啟動）

| rule key | 觸發 |
| --- | --- |
| `commerce-link-ref-not-found` | 文章 ref 未在 registry 命中 |
| `commerce-link-ref-inactive` | 文章 ref 命中但 `active: false` |
| `commerce-link-ref-replaced` | 文章 ref 命中、`active: false` 且 `replacementTarget` 非空 |
| `commerce-link-dup-key` | registry 內 `linkId` 重複 |
| `commerce-link-missing-target-url` | entry `active: true` 但 `targetUrl` 為空 |
| `commerce-link-invalid-target-url` | `targetUrl` 不符 `^https?://` |
| `commerce-link-replacement-target-not-found` | entry 之 `replacementTarget` 指向不存在之 linkId |
| `commerce-link-unknown-merchant-key` | `merchantKey` 不在未來 merchant whitelist（屬 long-tail；先 free-form）|
| `commerce-link-unknown-network-key` | `networkKey` 不在 `affiliate-networks.json` 之 `id` 列表 |
| `commerce-link-internal-label-leak-risk` | `internalLabel` 含可能洩漏字串（如「測試」「異常」）；屬 long-tail；可不啟用 |
| `commerce-link-raw-url-still-present` | 進入 long-term D 後仍有 raw URL；屬 phase 11 |

**全為 warning-only**；不 fail build；mirror download R2 / R5b 之 pattern。

### 7.6 不自動替換 production raw URL 的紅線

- ❌ **不**用 `replacementTarget` 自動 rewrite 文章 frontmatter
- ❌ **不**在 build 階段自動替換 URL 輸出至 dist
- ❌ **不**在 deploy 階段自動 push 含替換 URL 之 commit
- ❌ **不**在 Blogger 端自動重貼新 URL
- ❌ 所有 production raw URL 變動須走：**文章 frontmatter PR → validator → user explicit approval → build → Blogger 手動重貼 / GitHub deploy**

---

## 8. GA4 / Click Tracking Alignment

### 8.1 命名空間隔離

| 軸 | 命名空間 | 來源 |
| --- | --- | --- |
| `link_source_key` | `link-sources.json` 之 sourceKey | 既有 GA4 event param；不改 |
| `commerce_link_id` 或 `affiliate_link_id` | **未來** commerce registry 之 `linkId` | **獨立**命名空間；不混用 |
| `merchant_key` | commerce registry 之 `merchantKey` | 候選 GA4 dimension（未啟用）|
| `network_key` | `affiliate-networks.json` 之 `id` | 候選 GA4 dimension（未啟用）|

🔑 **commerce 之 GA4 dimension 採獨立命名空間**；不可與 `link_source_key` 混用。

### 8.2 本階段不修改 GA4 source

- ❌ 不改 `src/views/tracking/ga4.ejs`
- ❌ 不改 `src/js/modules/ga4-events.js`
- ❌ 不改 `src/js/modules/link-tracker.js`
- ❌ 不改 `src/views/tracking/ga4-events-helper.ejs`
- ❌ 不改 `content/settings/ga4.config.json`
- ❌ 不改 `docs/ga4-link-tracking-spec.md`
- ❌ 不改 `docs/click-tracking-governance.md`
- ❌ 不啟用 GA4 validation
- ❌ 不解除 reverse UTM dormant
- ❌ 不解除 pm-26 deploy gate

### 8.3 既有 tracking governance 不擴張 scope

- 既有 9 個 GA4 event（per CLAUDE.md §5）**不變**
- 既有 `affiliate_click` event 為 commerce CTA 之預定義 event；**未來** commerce registry 落地後可補 `commerce_link_id` 為 event param；屬獨立 GA4 phase（長期）；本決策不啟動
- `link_type` 派生規則（per `ga4-link-tracking-spec.md` §4.5）**不變**：仍由 URL hostname / cross-site fingerprint 派生
- 不引入「依 `linkId` 強制決定 event name」之派生路徑（mirror `kind` vs `link_type` 兩軸分離原則）

### 8.4 未來 GA4 integration 之邊界（規劃，不啟動）

可能的 future GA4 param mapping：

```
event: click_affiliate_cta
params:
  - link_url: <resolved URL>
  - link_label: <displayLabel>
  - commerce_link_id: <linkId>     ← 未來新增
  - merchant_key: <merchantKey>    ← 未來新增
  - network_key: <networkKey>      ← 未來新增
  - placement: article_top | article_bottom
  - role: primary | alternate | ...
  - post_slug: <article slug>
```

但本階段**僅作 alignment 紀錄**；不寫 source；不改 spec。

---

## 9. Admin Picker Future Direction

### 9.1 picker 顯示欄位 contract（read-only preview）

| 欄位 | 顯示方式 | 屬性 |
| --- | --- | --- |
| `linkId` | primary key column；monospace | 作 ref 寫入文章 |
| `internalLabel` | primary label | 作者辨識；**前台不可見**；picker 主視覺 |
| `merchantKey` / `merchant` | filter chip + secondary label | filter 維度 |
| `networkKey` | filter chip | filter 維度 |
| `productTitle` / `bookTitle` / `itemName`（取其一非空）| secondary label | grouping by 商品 |
| `bookIsbn` | optional badge | 跨通路精準對齊 |
| `tags[]` | filter chips | 跨維度 grouping |
| `active` | status badge（綠 active / 灰 inactive / 黃 replaced）| 視覺 |
| `usedBy.length` | count badge（如「3 篇文章使用」）| 反查；可展開列表 |
| `deprecatedAt` | optional date badge | 長尾資訊 |
| `notes` 之 first line | tooltip 或展開區 | **picker 內可見，前台不可見** |
| `displayLabel` | preview chip（「前台顯示」標籤）| 對比 internalLabel |
| `targetUrl` | preview text（截斷顯示 hostname + 部分 path）| 視覺驗證 |

### 9.2 picker 不可顯示之欄位

- `notes` 之**完整內容**：只顯示 first line / 摘要；避免長 internal note 被誤截圖外流
- 任何聯盟 dashboard credentials / token（**永遠不在 registry**，本來就無）

### 9.3 internalLabel 不可前台渲染

🔑 **紅線重申**：

- `internalLabel` 為 author-only；picker / dist-reports / Admin static preview 可顯示
- `internalLabel` **絕對**不寫入 `dist/` / `dist-blogger/` 之 HTML
- renderer 之 fallback chain（per §5.3）**不**含 `internalLabel`
- 未來可加 acceptance validator：dist HTML 不得含 `internalLabel` 字串

### 9.4 picker 之**寫**邊界

- 不啟動 Admin Apply / middleware write / admin-write-cli
- picker 為 read-only preview only
- 若未來作者需新增 entry，須手動編 `commerce-links.json`（或走獨立 admin-write phase；屬未來範圍；本決策不解除 dormant gate）

### 9.5 picker 不消費 respondent data / dashboard credentials

mirror download registry R1 紅線：

- 不引入 Google Form respondent data
- 不引入 Google Sheets API
- 不引入聯盟 dashboard API / OAuth
- 不顯示 commission / payout / click 數（屬 GA4 / 聯盟平台本身）

---

## 10. Validator Future Rules

### 10.1 規劃清單（warning-only；本階段不啟動）

per §7.5 + 補充：

| # | rule key | scope | severity |
| --- | --- | --- | --- |
| V1 | `commerce-link-registry-invalid-shape` | registry-level | warning（mirror download R1）|
| V2 | `commerce-link-registry-duplicate-key` | registry-level（`linkId` 重複）| warning |
| V3 | `commerce-link-ref-not-found` | article-level（ref 不在 registry）| warning（mirror download R2）|
| V4 | `commerce-link-ref-invalid-type` | article-level（ref 非 string）| warning |
| V5 | `commerce-link-ref-empty` | article-level（ref trim 後為空）| warning |
| V6 | `commerce-link-ref-duplicate` | article-level（intra-post duplicate ref）| warning（mirror download R5b）|
| V7 | `commerce-link-ref-inactive` | article-level（命中但 `active: false`）| warning |
| V8 | `commerce-link-ref-replaced` | article-level（`active: false` + `replacementTarget`）| warning |
| V9 | `commerce-link-missing-target-url` | registry-level（`active: true` 但 `targetUrl` 空）| warning |
| V10 | `commerce-link-invalid-target-url` | registry-level（`targetUrl` 不符 `^https?://`）| warning |
| V11 | `commerce-link-replacement-target-not-found` | registry-level | warning |
| V12 | `commerce-link-unknown-network-key` | registry-level（不在 `affiliate-networks.json`）| warning |
| V13 | `commerce-link-internal-label-empty` | registry-level | warning（強提 `internalLabel` 必填精神）|
| V14 | `commerce-link-internal-label-render-risk` | dist HTML 含 internalLabel 字串 | warning（acceptance；屬 long-tail）|
| V15 | `commerce-link-raw-url-still-present` | article-level（long-term D 後仍有 raw URL）| warning（屬 long-term）|

### 10.2 不在本階段啟動之原因

- registry 尚不存在 → validator 無對象
- migration 未開始 → 啟用會大量誤報
- mirror download R-series cadence：先 empty registry → loader → validator shape → fixtures → validator content reference → ...

### 10.3 rule landing 順序建議（mirror download cadence）

```
1. V1 / V2          ← empty registry + loader 後第一批
2. V3 / V4 / V5     ← V1/V2 穩定後第二批
3. V6               ← intra-post duplicate（mirror R5b）
4. V9 / V10 / V11   ← registry shape 補完
5. V12              ← network 對齊
6. V13              ← 完整性 nudge
7. V7 / V8          ← inactive / replacement（須 active 欄位先 mature）
8. V14              ← acceptance；屬 long-tail
9. V15              ← long-term D 進入後
```

每一 rule 各自走 fixture-first；mirror download R2 / R5b 之 cadence。

---

## 11. Risk / Red Lines

### 11.1 紅線（永遠 enforced）

- ❌ **不修改 production content**（不批次改既有文章 affiliate.links；不自動 rewrite raw URL；不靜默改 displayLabel）
- ❌ **不自動替換舊 affiliate URL**（即使 registry 有 `replacementTarget`）
- ❌ **不用 URL pattern 推斷商品或平台**（per night-1 §3.1；URL token 不可逆向）
- ❌ **不把 affiliate dashboard credentials / token / OAuth secret / API key / 使用者表單資料進 repo**（mirror download R1）
- ❌ **`internalLabel` 不可顯示前台**（紅線；renderer fallback chain 不含 internalLabel；dist HTML 不得含 internalLabel 字串）
- ❌ **`linkId` 改名必須走 migration**（永不直接 rename；必須 `status: deprecated` + `replacementKey` + 新 entry）
- ❌ **不 build / deploy / Blogger repost / GA4 validation**
- ❌ **不啟用 Admin Apply / middleware write / admin-write-cli**
- ❌ **不啟動 reverse UTM**（remains landed but dormant per pm-24a/b/c）
- ❌ **不解除 pm-26 deploy gate**
- ❌ **不建立實際 commerce registry**（empty registry 為獨立 phase）
- ❌ **不建立 fixture**（registry shape / ref not-found / duplicate fixtures 屬獨立 phase）
- ❌ **不修改 MEMORY / project memory 檔**
- ❌ **不自動開始下一階段**
- ❌ **不在 docs 內貼真實 affiliate token**（範例 URL 僅取自既有公開 production frontmatter；新範例使用 placeholder 字串如 `book-atomic-habits-books-com-tw`）

### 11.2 設計風險（識別並標記）

- **過早凍結 schema**：本決策定下 v0 23 欄位；若 v1 補欄位多 → 須 schemaVersion 升版 + migration phase；屬可控（warning-only 緩衝）
- **C → D 轉型卡死**：若作者長期不主動 migrate，hybrid 永遠是 hybrid → 屬可接受（partial > status quo）；長期透過 raw URL 殘留統計報表追蹤
- **linkId 命名漂移**：作者命名不一致（如「book-atomic-habits-books」vs「book-atomic-habits-books-com-tw」）→ validator V2 dup-key + 命名 convention docs 緩衝；不強制 enforce
- **internalLabel 洩漏**：若 renderer 寫錯誤 path → V14 acceptance validator 緩衝；但屬 long-tail
- **GA4 命名空間衝突**：`commerce_link_id` 與 `link_source_key` 必須隔離；本決策已明定（per §8.1）
- **registry 過大時 picker 效能**：100+ entries 時 picker filter 須有效；屬 Admin 工程；本決策不涉

### 11.3 acceptance 風險（識別並標記）

- **C 階段過渡期長**：若 picker 落地慢 → 作者只能改文章 frontmatter；DX 受限；屬可接受（mirror download empty registry 之長尾接受）
- **`usedBy[]` 自動推導之同步**：屬獨立 inventory report（如 `dist-reports/commerce-link-usage.json`）；**不**寫回 registry；本決策已明定
- **migration 漏遷**：raw URL 殘留統計報表（V15 + 獨立 inventory）為 long-tail acceptance 工具

---

## 12. Future Phase Ladder

mirror night-17 §9 + 補上本決策後之具體下一步：

| # | Phase | 範圍 | 風險 | 啟動條件 |
| --- | --- | --- | --- | --- |
| 1 | **本 phase**：identifier-focused schema decision | docs-only | 無 | n/a（本批 landed）|
| 2 | **schema acceptance read-through**（optional）| docs-only | 無 | user 認可即可 |
| 3 | **empty registry preanalysis** | docs-only | 無 | user 啟動 |
| 4 | **empty registry implementation** | settings-only；single file add | 低 | user 啟動 |
| 5 | **loader read-only**（`load-settings.js` 加 `readJsonOptional`）| source；無 consumer | 低 | yes |
| 6 | **fixture design** | docs-only | 無 | yes |
| 7 | **validator V1 / V2**（registry shape + dup linkId）| source + fixtures；warning-only | 低 | yes |
| 8 | **validator V3–V6**（content reference rules；mirror download R2 / R5b）| source + fixtures；warning-only | 低 | yes |
| 9 | **renderer fallback**（post-detail + blogger-post-full；ref → registry lookup + graceful placeholder）| source（renderer）| 中 | yes |
| 10 | **Admin picker read-only preview** | source（Admin）| 中 | renderer 邊界穩定後 |
| 11 | **production migration preflight**（read-only acceptance；raw URL 分布盤點；不輸出真實 URL）| docs-only | 無 | yes |
| 12 | **production migration one-file pilot**（單一 post；explicit approval；rollback plan）| content + registry | **高** | explicit approval per file |
| 13 | **validator V7 / V8 / V9 / V10 / V11 / V12 / V13**（inactive / replacement / shape 補完）| source + fixtures | 低 | yes |
| 14 | **acceptance cross-check** | docs-only | 無 | yes |
| 15 | **usedBy inventory report**（build 階段產出 `dist-reports/commerce-link-usage.json`；不寫回 registry）| source（build script）| 低 | yes |
| 16 | **GA4 validation**（僅在 deploy path ready 後）| infra | 中 | explicit approval + pm-26 解除 |
| 17 | **long-term D 啟動**（pure ref；raw URL 全面遷移；V14 / V15）| content + registry；high impact | **高** | 待 C 階段穩定（≥ 90% production raw URL 已遷移）|

每一 candidate phase 皆**不解除** dormant rails（per §11.1）。

---

## 13. Final Recommendation

### 13.1 本階段之 single conclusion

> **Schema decision 已 landed**：採 **near-term C → long-term D** 兩段式策略；鎖定 **三軸獨立 + 反查維度**模型；鎖定 **`linkId` 三段式命名 convention**（`<kind>-<product-slug>-<merchant-key>`，lowercase kebab-case；非數字 / 非中文 / 非 token / 非 URL / 非價格）；凍結 **v0 registry 23 欄位** 與 **過渡期 ref + raw 混用規則**；凍結 **active / replacementTarget / deprecatedAt** 替換策略邏輯（renderer **永不**自動跳 replacementTarget）；凍結 **GA4 commerce 命名空間獨立** + **不擴張既有 tracking scope**；凍結 **Admin picker read-only contract** + **internalLabel 不可前台渲染** 紅線；凍結 **validator V1–V15 warning-only 規劃清單**。

### 13.2 本階段結束後預設狀態

**Final Idle Freeze / EXIT**。

唯一輸出為本檔；不動 source / content / settings / templates / fixtures / package / dist / gh-pages / memory；validate baseline 維持 **0 errors / 60 warnings / 53 posts**；所有 dormant gates 維持 dormant；所有紅線維持 enforced。

### 13.3 不自動推進下一階段

若 user 決定推進，建議下一步（依風險由低至高）：

1. **schema acceptance read-through**（docs-only；認可本決策；可省略）
2. **empty registry preanalysis**（docs-only；定 `commerce-links.json` empty shape 細節）
3. **empty registry implementation**（settings-only；single file add；零下游）
4. **loader read-only**（source；無 consumer）

⚠️ **不可推進之 short-cut**：

- ❌ 不可直接 seed registry with real linkIds / 真實 affiliate URLs
- ❌ 不可直接改 template 加 ref 欄位（須等 empty registry + renderer fallback）
- ❌ 不可直接改 renderer（須先有 registry + loader + validator）
- ❌ 不可在 renderer 落地前批次改 production content

---

## Appendix A — Cross-reference index

- `docs/20260603-commerce-affiliate-link-registry-preanalysis.md`（night-1；Option A/B/C 候選來源）
- `docs/20260603-commerce-affiliate-link-registry-identifier-preanalysis.md`（night-17；三軸模型來源）
- `CLAUDE.md` §1（不過度工程化）/ §3.2（settings 列表 / download registry R1 精神）/ §12（書評 affiliate.links schema）/ §16（連結處理 / external / affiliate / internal rel）/ §16.4（reverse UTM dormant）/ §27 / §29 / §30
- `docs/related-links-schema.md` §11.2.1（sourceKey vs displayLabel 分離原則）/ §11.2.2（fallback chain）/ §11.5（GA4 link_source_key roadmap）
- `docs/click-tracking-governance.md` §3.2（GA4 event 列表）/ §3.3（content metadata layer）/ §6（data attr convention）
- `docs/ga4-link-tracking-spec.md` §4.5（link_type 派生規則；不直接吃 kind）
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`（registry schema 紅線 R1）
- `docs/20260531-download-empty-registry-implementation-plan.md`（empty registry landing pattern）
- `docs/20260602-download-registry-aware-validation-preanalysis.md`（R-series cadence 範本）
- `docs/20260603-download-landing-page-content-model-decision.md`（content model decision pattern 範本）
- `docs/20260601-sourcekey-admin-selector-preanalysis.md`（Admin picker preanalysis pattern）
- `docs/20260601-sourcekey-source-inactive-validator-preanalysis.md`（inactive / status track 設計範本）
- `content/settings/affiliate-networks.json`（既有 network registry；2 entries：`books` / `affiliate-network`）
- `content/settings/link-sources.json`（既有 sourceKey registry；命名規則參考；**獨立命名空間**；不混用）
- `content/settings/link-rules.json`（既有 external / affiliate / internal rel 規則）
- `content/settings/download-assets.json` / `download-forms.json`（empty registry shape 參考）
- `content/blogger/posts/20260515-we-media-myself2.md`（唯一 production real affiliate post；`enabled: false`）
- `src/scripts/load-settings.js`（既有 `readJsonOptional` pattern）
- `src/scripts/validate-content.js`（既有 R-series cadence）

---

## Appendix B — Baseline snapshot

- repo path：`D:\github\blog-new\portable-blog-system`
- branch：`main`
- HEAD（pre-commit）：`794a9cec96f8d36fce85815c7e5deb82cdb3a0dd`（short `794a9ce`）
- `HEAD == origin/main`（pre-commit）：yes（ahead / behind = `0 / 0`）
- working tree（pre-commit）：clean
- latest commit subject（pre-commit）：`docs(commerce): plan affiliate link identifiers`
- `npm run validate:content`（pre-commit）→ **0 errors / 60 warnings / 53 posts**

本階段結束後預期：

- 唯一新增：本檔 `docs/20260603-commerce-affiliate-link-registry-schema-decision.md`
- 其他狀態完全不變
- `npm run validate:content` 預期維持 **0 / 60 / 53**

---

（本文件結束）
