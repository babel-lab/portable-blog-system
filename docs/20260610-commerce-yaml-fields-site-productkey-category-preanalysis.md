# Commerce YAML 欄位設計決策 — `site` / `productKey` / `category` 等

> **Phase**: `20260610-am-1-commerce-yaml-fields-site-productkey-category-preanalysis-docs-only-a`
> **Mode**: docs-only 設計決策（**不**改 source / validator / renderer / Admin / settings / posts / fixtures / overlay / package；**不** seed production registry；**不** build / deploy / Blogger repost / memory mutation）
> **Created**: 2026-06-10 09:40 +0800
> **Predecessor grounding**: `docs/20260603-commerce-affiliate-link-registry-schema-decision.md`（v0 registry 23 欄位 + linkId 命名 convention 之正式裁決）、`docs/20260609-commerce-l1-seed-intake-packet.md`（L1 seed intake packet checkpoint）

---

## 1. Current baseline

| 項目 | 值 | 來源 |
| --- | --- | --- |
| branch | `main` | **verified by command**（`git branch --show-current`）|
| HEAD | `3d26867ba1f764661aa845ebbcd7cd64104621bb`（short `3d26867`）| **verified by command**（`git rev-parse HEAD`）|
| `HEAD == origin/main` | yes（ahead/behind = `0 / 0`）| **verified by command**（`git rev-list --left-right --count origin/main...HEAD`）|
| working tree | clean | **verified by command**（`git status -sb` → 僅 `## main...origin/main`）|
| latest subject | `docs(commerce): record L1 seed intake packet` | **verified by command**（`git log -1 --pretty=%s`）|
| `npm run validate:content`（pre-commit / normal baseline）| **0 errors / 69 warnings / 59 posts**（expected）| 依 CLAUDE.md §3.2「當前 baseline」+ L1 intake packet §B 記載；本 phase 完成後執行 verify |
| overlay validation baseline | **0 errors / 70 warnings / 59 posts**（expected）| 依 CLAUDE.md「當前 baseline」記載；exact command = `node src/scripts/validate-content.js --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json`（非本 phase 必跑項，見 §驗證）|

### 1.1 production commerce 狀態

- **`content/settings/commerce-links.json` 仍為 empty registry** — **verified by reading file**：內容為 `{ "schemaVersion": 1, "updatedAt": "", "commerceLinks": [], "notes": "" }`。`commerceLinks` = `[]`。
- **production posts 是否仍未啟用 commerce refs** — **not re-derived in this phase**（未對 59 篇逐篇重新掃描）。依既有驗證推斷：normal baseline 維持 0 errors / 69 warnings，且 commerce content-ref rules（C1/C2/C3/C5/C6/C8/C4/C9）皆 warning-only 且只在 post 含 `affiliate.links[].ref` 時觸發；若有 production post 啟用 `ref`，warning 數會高於 empty-registry 推斷值。CLAUDE.md §3.2 明載「production 0 篇用 `ref` / 0 篇 ref+url coexist → production 觸發為零」。本 phase 不重新驗證該斷言，沿用既有記載。
- 唯一含真實 affiliate 結構的 production post = `content/blogger/posts/20260515-we-media-myself2.md`，且其 `affiliate.enabled: false`（**verified by reading file**），不產生 active commerce 輸出。

### 1.2 既有 frontmatter / validator 事實（本 phase 讀取確認）

- post frontmatter **已有 top-level `site`**（值 `github` / `blogger`，per CLAUDE.md §3.1 frontmatter 欄位）與 **top-level `category`**（須存在於 `categories.json`，per CLAUDE.md §15）。範例 `20260515-we-media-myself2.md`：`site: "blogger"`、`category: "book-review"`。
- validator（`src/scripts/validate-content.js`，**唯讀確認，不修改**）：
  - registry-level 讀的 entry 欄位 = `linkId` / `targetUrl` / `internalLabel` / `networkKey` / `replacementTarget` / `active`（R-rules）。
  - post-level content-ref 讀的欄位 = `affiliate.links[i].ref`（C1/C2/C3/C5/C6）、`affiliate.links[i].role`（C8）、`affiliate.links[i].url`（C6 coexist）。
  - **source 中不存在 `productKey` 欄位**；post→registry 的指標是 `ref`，registry primary key 是 `linkId`。
- `affiliate-networks.json`（**verified by reading**）：`{ id: "books", name: "通路王" }`、`{ id: "affiliate-network", name: "聯盟網" }`。即 networkKey `books` ↔ 通路王、`affiliate-network` ↔ 聯盟網。

---

## 2. Problem statement

本輪要回答的，是 user 在新一輪提出的四個經營面問題，落到 YAML 欄位設計上：

1. **目前以販書為主，未來 GitHub 可能販售其他商品 / 廣告** → commerce entry 是否需要 `category` / `productType` 之類「商品種類」欄位？
2. **Blogger 目前主要販書，GitHub 未來可能有不同商品 / 廣告** → 是否需要 `site` / `surface` / `allowedSites` 之類「適用站台 / 版位」欄位來區分一條 commerce link 只在某站出現？
3. **一篇文章可能同時有「通路王」與「聯盟網」販售連結** → 欄位如何支援同一篇文章多 network、多 link？
4. **`productKey` 想採文章檔名 / URL slug 命名** → 命名習慣如何訂、一篇文章多商品或多連結時如何避免衝突？

橫貫約束（不可破壞）：

- 不要把完整聯盟 URL（含 redirect token / tracking id）分散寫死在各文章內 —— 這正是 commerce registry（`ref` → 集中 `targetUrl`）要解決的核心問題。
- 不破壞既有 `affiliate.links[].ref` 機制與 empty registry / L1 seed intake governance。
- 本輪只產決策文件供下一輪實作，**不**動 source / registry / posts。

### 2.1 與既有決策的關係（避免重複造輪子）

`docs/20260603-commerce-affiliate-link-registry-schema-decision.md` 已正式裁決：

- **三軸欄位分離**：`linkId`（machine key，永不改名，前台不可見）/ `internalLabel`（author-only，**嚴格不渲染**）/ `displayLabel`（前台顯示）。
- **near-term Strategy C（ref + raw 混用）→ long-term Strategy D（minimal ref + Admin lookup）**。
- **linkId 命名 = `<kind>-<product-slug>-<merchant-key>`**，lowercase kebab-case，非中文 / 非數字開頭 / 非 token / 非 URL / 非價格。
- **v0 registry 23 欄位**（含 `merchantKey` / `merchant` / `networkKey` / `productTitle` / `bookTitle` / `bookIsbn` / `productId` / `tags` / `active` / `replacementTarget` 等）。

本 phase **不重啟**上述裁決，而是針對 user 新提的 `site` / `productKey` / `category` / `productType` / `surfaces` / `allowedSites` 做**增補裁決**，並與既有 schema 對齊。凡與既有裁決衝突處，明確標記並給出收斂建議。

---

## 3. Field decision analysis

逐欄位分析：**是否需要 / 放哪一層 / 是否現在啟用**。層級定義：
- **R**（registry entry）= `commerce-links.json` 之 per-entry 欄位（source of truth）。
- **P**（post frontmatter）= `affiliate.links[]` 之 per-instance 欄位。
- **A**（Admin UI helper）= 未來 Admin 可輔助產生 / 預覽，但不是新欄位。
- **✗P**（不應放 post YAML）= 屬 registry 之 source of truth，文章端不重複維護。

### 3.1 `site` / `allowedSites` / `surfaces`

| 維度 | 結論 |
| --- | --- |
| 需要嗎？ | **現在不需要新欄位**。post 已有 top-level `site`（github / blogger），決定「這篇文章屬哪個站」。 |
| 放哪層？ | 若未來真有需求 → **R（optional）**，欄位名建議 `surfaces`（複數，array），**不要** per-link `site`（單數會與 post-level `site` 語意打架）。 |
| 現在啟用？ | **否 / deferred**。 |

理由：

- commerce registry entry **本質上是站台無關（site-agnostic）的** —— 一個「《老後的時光要精彩》在博客來（通路王）」的連結，無論被 Blogger 文章或 GitHub 文章引用，目的地 URL 都一樣。把 `site` 綁進 entry 會讓「同一商品連結」被迫複製成兩筆，違反 registry「集中、去重」的初衷。
- user 真正的需求是「**某些商品只在某站出現**」（例如未來 GitHub 賣技術相關商品、Blogger 只賣書）。這是「**可見性 / 適用範圍**」語意，不是「商品歸屬某站」。對應欄位應是 optional 的 `surfaces: ["github"]` / `["blogger"]` / 省略=不限。
- 但目前 production 全部 commerce 都是販書、且 registry 為 empty，**沒有任何一筆需要限制 surface**。現在加 `surfaces` 是 over-engineering（違反 CLAUDE.md §1 不過度工程化）。
- **決策**：`surfaces` 列為 **v1 候選 optional 欄位**，schema 預留語意（省略 = 所有站可用），但 v0 不納入、不實作、validator 不檢查。`allowedSites` 作為 `surfaces` 的同義命名候選否決（`surfaces` 同時涵蓋未來「版位」概念更通用，但本輪不細化版位）。
- post 端**永不**新增 per-link `site`；篩選哪些 commerce link 出現在哪站，未來由 renderer 讀 entry `surfaces` ∩ post `site` 決定（屬 renderer phase，不在本輪）。

### 3.2 `category` / `productType`

| 維度 | 結論 |
| --- | --- |
| 需要嗎？ | `productType` = **未來會用到，但現在 optional / 不啟用**。`category` = **不新增 commerce 專屬欄位**。 |
| 放哪層？ | `productType` → **R（optional，additive）**。 |
| 現在啟用？ | **否 / deferred**；v0 不要求、不 seed、validator 不檢查。 |

理由：

- **不要把 commerce 的「商品種類」叫 `category`** —— `category` 在本專案已是內容分類語意（post top-level `category`，須存在於 `categories.json`，per CLAUDE.md §15）。再開一個 commerce `category` 會造成命名 collision + 認知負擔。
- user 問的是「未來 GitHub 賣非書商品 / 廣告」要不要種類欄位 → 用 **`productType`**（語意明確：這條 commerce link 指向的是什麼類型的標的）。
- 建議 `productType` enum（**v1，non-binding 草案，不在本輪凍結為強制**）：`book` / `product` / `download` / `ad` / `service` / `official`。預設可由 `linkId` 的 kind-prefix 推得（`book-…` → `book`），故 v0 不強制填。
- 與既有 schema 對齊：schema decision §5.2 已有 `tags[]`（optional，自由分類）。短期「想分類商品」可先用 `tags`，不必急著上 `productType` 專欄。`productType` 的價值在於未來 Admin filter / GA4 dimension 想要**單一受控 enum**時才浮現。
- **決策**：`productType` 列 v1 optional additive 欄位；v0 不納入。短期商品分類需求用既有 `tags[]` 承擔。commerce **不**新增名為 `category` 的欄位。

### 3.3 `productKey`

| 維度 | 結論 |
| --- | --- |
| 需要嗎？ | **不需要作為「新的 required 主鍵」**。商品身分已編碼在 `linkId` 的 product-slug 段。 |
| 放哪層？ | 若要顯式表達「跨通路的同一商品」分組 → **R（optional，grouping / reverse-lookup）**，沿用 schema decision 既有的 `productTitle` / `bookIsbn` / `productId` grouping 意圖；`productKey` 可作為**機器可讀的商品分組鍵**補位。 |
| 現在啟用？ | **否 / deferred**（grouping 是 inventory / Admin 便利性，不是 render 必需）。 |

理由（關鍵，必須講清楚以免與既有 `linkId` 打架）：

- **`productKey` ≠ post→registry 的指標**。post→registry 的指標已固定是 `affiliate.links[].ref` → registry `linkId`（validator 已實作，C1/C2/C3）。**不要**新增 `productKey` 當作第二套 ref 機制，否則 validator / renderer / Admin 全要再開一軸，違反 single-source。
- user 說「`productKey` 想採文章 slug / 檔名」 —— 這個需求**已被 linkId 命名 convention 覆蓋**：`linkId = <kind>-<product-slug>-<merchant/network-key>`，其中 `<product-slug>` 正是「以文章 slug / 商品名為 base」。所以 user 想要的「productKey 採 slug」= **linkId 的 product-slug 段採 article slug 為 base**（見 §5 命名規則）。
- 唯一 `productKey` 作為**獨立欄位**有價值的情境：要把「同一商品的多筆通路 linkId」分組做 reverse lookup（Admin grouping「這本書在博客來/金石堂/蝦皮共 3 個連結」）。此時 `productKey`（= product-slug，例如 `aging-time`）作為 entry 的 optional grouping 欄位，把共享同一商品的 linkId 串起來。這與 schema decision §5.2 的 `productTitle` / `bookIsbn`（grouping by 商品）同類，`productKey` 是其機器可讀版。
- **決策**：**不**引入 `productKey` 作為 post-level ref 或 required 主鍵。`linkId` 仍是唯一 machine key。`productKey`（= article-slug-derived product-slug）列為 **v1 optional registry grouping 欄位**，省略時 grouping 由 `productTitle` / `bookIsbn` 承擔。v0 不納入、不強制。

### 3.4 `networkId`（聯盟網路）

| 維度 | 結論 |
| --- | --- |
| 需要嗎？ | **是（已存在，名為 `networkKey`）**。 |
| 放哪層？ | **R（optional）**，對齊 `affiliate-networks.json` 的 `id`。 |
| 現在啟用？ | schema 已凍結；registry empty 故無資料；**validator R11 已 live**（networkKey 不在 affiliate-networks registry → warning）。 |

- 命名對齊既有 source：欄位名是 **`networkKey`**（非 `networkId`），值對齊 `affiliate-networks.json` 的 `id`（`books` = 通路王、`affiliate-network` = 聯盟網）。本輪確認沿用 `networkKey`，不改名。
- 這是支援 user 問題 3（通路王 vs 聯盟網）的核心欄位：同一商品的兩筆 link 用不同 `networkKey` 區分。

### 3.5 `merchantId` / `merchantName`

| 維度 | 結論 |
| --- | --- |
| 需要嗎？ | **是（已存在，名為 `merchantKey` / `merchant`）**。 |
| 放哪層？ | **R**：`merchantKey`（machine，stable）+ `merchant`（display，optional）。 |
| 現在啟用？ | schema 已凍結；registry empty；validator 目前**未**對 merchantKey 做 whitelist 檢查（schema decision §7.5 V「unknown-merchant-key」標 long-tail / free-form，未啟用）。 |

- 命名對齊既有 schema decision：用 **`merchantKey` / `merchant`**，非 `merchantId` / `merchantName`。本輪確認沿用，不改名。
- merchant（通路：博客來 / 金石堂 / 蝦皮）與 network（聯盟平台：通路王 / 聯盟網）是**兩個正交軸**：同一 merchant（博客來）可經不同 network 觸達，同一 network 涵蓋多 merchant。linkId 命名與 entry 都需保留兩軸（見 §5）。
- **不可由 URL 反推 merchantKey / networkKey**（CLAUDE.md §3.1 紅線 + schema decision §4.4）—— 所有 key 由作者明示。

### 3.6 `linkId`

| 維度 | 結論 |
| --- | --- |
| 需要嗎？ | **是 — 唯一 machine primary key，已凍結。** |
| 放哪層？ | **R（required，primary key）**；post 端只放 `ref`（= 引用 linkId）。 |
| 現在啟用？ | schema + validator 已 live（R4 missing / R5 duplicate；C3 ref-not-found）。 |

- 不重啟既有裁決。本輪只在 §5 補「product-slug 段如何採 article slug」與「多 link 避免衝突」的命名細則。

### 3.7 `label` / `displayName`

| 維度 | 結論 |
| --- | --- |
| 需要嗎？ | 是，但**拆成兩欄**（已凍結三軸）：`displayLabel`（前台）+ `internalLabel`（author-only）。 |
| 放哪層？ | **R**：`internalLabel`（required，嚴格不渲染）+ `displayLabel`（optional，前台顯示）。post 端 optional `labelOverride`（per-instance 覆蓋，不寫回 registry）。 |
| 現在啟用？ | schema + validator 已 live（R8/R9 internalLabel 缺/空；C9 labelOverride leak-equality narrow，Option D no expansion）。 |

- **不要**用單一 `label` / `displayName` —— 既有 `affiliate.links[].label` 過載問題正是三軸要解決的（schema decision §2.3）。
- `displayName` 作為 `displayLabel` 的同義命名候選否決（沿用既有 `displayLabel`，避免 source / docs / intake packet 命名漂移）。

### 3.8 `url`

| 維度 | 結論 |
| --- | --- |
| 需要嗎？ | 是，但放 registry（名為 `targetUrl`）。 |
| 放哪層？ | **R**：`targetUrl`（required for active entry）。post 端 `url` 僅**過渡期** raw fallback（C6 偵測 ref+url 共存 → warning，提示 migration 後移除）。 |
| 現在啟用？ | schema + validator 已 live（R6 missing-target-url、R7 invalid-target-url、C6 coexist）。 |

- **核心紅線**：完整聯盟 URL（含 redirect token / tracking id）集中在 registry 的 `targetUrl`，**不**分散寫死在文章。這正是 user 橫貫約束的目的。
- post 端的 `targetUrl` **永不出現在 Admin selector preview / snippet**（schema decision §9 + active-commerce-links.js：safe fields only）。

### 3.9 `status` / `enabled`

| 維度 | 結論 |
| --- | --- |
| 需要嗎？ | 是，但語意已凍結為 **`active`（boolean）** + `replacementTarget` + `deprecatedAt`。 |
| 放哪層？ | **R**：`active`（required，default true）/ `replacementTarget`（optional）/ `deprecatedAt`（optional）。post 端既有 `affiliate.enabled`（整段 affiliate 開關）為**不同層級**，保留不動。 |
| 現在啟用？ | schema + validator 已 live（R14 inactive-missing-replacement、R12/R13 replacement-target、C4 ref-inactive）。 |

- **不要**新增 entry-level `status: "draft"/"published"` 字串 enum —— 與既有 `active` boolean 重疊。post 的 `status`（draft/ready/published/archived，CLAUDE.md §23）是**文章狀態**，與 commerce entry 的 `active` 是**不同維度**，不混用。
- post 既有 `affiliate.enabled`（per CLAUDE.md §12）= 「這篇文章要不要顯示 affiliate 區塊」；entry `active` = 「這條商品連結是否仍有效」。兩者正交，皆保留。

### 3.10 `notes`

| 維度 | 結論 |
| --- | --- |
| 需要嗎？ | 是（已存在）。 |
| 放哪層？ | **R（optional，嚴格不渲染前台）**。 |
| 現在啟用？ | schema 已凍結；intake packet §D.5 標「`sourceReason` 是否入 `notes` 需 user per-entry 確認，不 auto-promote」。 |

- 紅線：`notes` **永不**渲染前台、**永不**含 §8 紅線敏感資料。

### 3.11 `articleSlug` / `postSlug`：需要嗎？還是只靠 `productKey` 規範即可？

| 維度 | 結論 |
| --- | --- |
| 需要嗎？ | **registry entry 不需要 `articleSlug` / `postSlug` 欄位。** |
| 放哪層？ | 反查「哪些文章用了這個 link」→ **derived（build/Admin 自動推導，不手填、不寫回 registry）**，沿用 schema decision §5.2 `usedBy`（derived inventory）。 |
| 現在啟用？ | 否（屬未來 inventory report phase）。 |

理由：

- registry entry **不應**內含 `articleSlug` —— 一條商品連結可被多篇文章引用，把單一 slug 寫進 entry 是錯誤的資料模型（多對多）。反向關係（link → 使用它的文章們）應由 build 階段掃 `ref` 自動推導成 inventory report（`usedBy[]`），**不寫回 registry**。
- 「用 `productKey` 規範即可」**部分正確**：linkId 的 product-slug 段採 article slug 為 base（§5），確實讓「linkId ↔ 文章」有人類可讀的關聯線索。但這是**命名 convention 的便利**，不等於資料模型上的 foreign key。entry 不需要、也不應有 `articleSlug` 欄位。
- **決策**：不新增 `articleSlug` / `postSlug` entry 欄位。文章關聯靠 (a) linkId product-slug 命名線索 +（未來）(b) derived `usedBy[]` inventory。

### 3.12 小結表

| 欄位（user 提問用語）| 採用欄位名 | 層級 | required? | 現在啟用? |
| --- | --- | --- | --- | --- |
| site | （不新增；post 已有 top-level `site`）| — | — | 否 |
| allowedSites / surfaces | `surfaces`（複數）| R | optional | **v1 deferred** |
| category（商品種類）| （不新增；避免與內容 `category` collision）| — | — | 否 |
| productType | `productType` | R | optional（v1）| **v1 deferred**（短期用 `tags`）|
| productKey | （不新增為主鍵；= linkId product-slug 段）| R(grouping, v1) | optional | **v1 deferred** |
| networkId | `networkKey` | R | optional | live（R11）|
| merchantId / merchantName | `merchantKey` / `merchant` | R | merchantKey stable / merchant optional | schema frozen |
| linkId | `linkId` | R | **required（PK）** | live |
| label / displayName | `internalLabel` + `displayLabel` | R | internalLabel required / displayLabel optional | live |
| url | `targetUrl`（R）；post `url` 過渡 raw | R | required(active) | live |
| status / enabled | `active` + `replacementTarget` + `deprecatedAt` | R | active required | live |
| notes | `notes` | R | optional | schema frozen |
| articleSlug / postSlug | （不新增；derived `usedBy[]`）| derived | — | 否 |

---

## 4. Recommended minimal schema（現在就夠用、未來可擴充）

設計原則：**v0 維持 schema decision 既有凍結欄位即可，本輪四個經營問題全部用「既有欄位 + v1 optional 預留」覆蓋，不在 v0 強加新欄位**。

### 4.1 Registry entry 欄位（`commerce-links.json` per-entry）

**v0（沿用 schema decision，已凍結；不在本輪改動）核心子集**：

```jsonc
{
  "linkId": "book-aging-time-books",          // required, PK, 永不改名
  "internalLabel": "老後的時光要精彩｜博客來｜通路王", // required, 嚴格不渲染
  "displayLabel": "博客來購買",                  // optional, 前台顯示
  "targetUrl": "https://example.com/...",       // required(active), 集中於此（不散落文章）
  "merchantKey": "books-com-tw",                // optional, stable（通路機器鍵）
  "merchant": "博客來",                          // optional, 顯示名
  "networkKey": "books",                         // optional, 對齊 affiliate-networks.json（books=通路王）
  "active": true,                                // required(default true)
  "replacementTarget": "",                       // optional（active=false 時指向新 linkId）
  "deprecatedAt": "",                            // optional
  "notes": ""                                    // optional, 嚴格不渲染
}
```

**v1 additive 預留（本輪新增之決策，但 v0 不實作 / 不要求 / validator 不檢查）**：

```jsonc
{
  "productKey": "aging-time",        // optional, 跨通路同商品分組鍵（= product-slug）
  "productType": "book",             // optional, enum 草案 book/product/download/ad/service/official
  "surfaces": ["blogger"]            // optional, 省略=全站可用；限制此 link 只在某站出現
}
```

升 v1 須走 `schemaVersion` 升版 + 獨立 phase（不在本輪）。

### 4.2 Post frontmatter 欄位（`affiliate.links[]` per-instance）

```yaml
affiliate:
  enabled: true
  disclosure: "本文包含聯盟行銷連結..."
  position: { top: true, bottom: true }
  links:
    - ref: "book-aging-time-books"        # 指向 registry linkId（唯一指標）
      role: "primary"                       # optional, C8 enum: primary/alternate/official/price-check/library/direct
      order: 10                             # optional, 顯示順序
      # labelOverride: "..."                # optional(advanced), per-instance 覆蓋；C9 leak-equality 風險
    - ref: "book-aging-time-affiliate-network"
      role: "alternate"
      order: 20
```

post 端**僅** `ref` / `role` / `order` / `labelOverride`（per-instance）。

### 4.3 Admin UI 未來可輔助產生的欄位（非新欄位）

- Admin selector preview 只暴露 **safe fields**：`linkId` / `active` / `displayLabel`（缺則 fallback `linkId`，**絕不** `internalLabel` / `targetUrl`）/ `hasReplacementTarget`（per active-commerce-links.js 既有實作）。
- Admin copyable snippet（A6，未實作）只產 post YAML fragment：`ref` / `role`（authoring guidance）/（advanced）`labelOverride`。snippet **永不**寫 `targetUrl` / `internalLabel` / `networkKey` / token。
- 未來若加 `productType` / `surfaces` filter，屬 Admin 顯示 / 篩選便利，**不**改 registry 必填性。

### 4.4 不應該放進 post YAML 的欄位（✗P）

文章端**不可**自填（屬 registry source of truth）：`linkId`（只放 `ref`）/ `targetUrl` / `merchantKey` / `merchant` / `networkKey` / `internalLabel` / `displayLabel` / `productKey` / `productType` / `surfaces` / `active` / `replacementTarget` / `deprecatedAt` / `notes` / `rel` / `sponsored`。

---

## 5. Naming convention（`productKey` / `linkId`）

### 5.1 規則（在 schema decision §4 之上補「採 article slug」與「多 link 防衝突」細則）

```
linkId = <kind>-<product-slug>[-<merchant-key>][-<network-key>]
```

1. **base = product-slug，優先採文章 `slug` / 檔名 base**。`slug` 為 ASCII kebab-case（本專案 frontmatter 既有規範），直接可用；中文標題不入 linkId（中文留 `internalLabel` / `displayLabel`）。
2. **kind prefix**（non-binding 列舉）：`book-` / `product-` / `download-` / `official-` / `media-` / `ad-`。
3. **同一篇文章多商品** → product-slug 段加**商品短碼**區分：`<kind>-<article-slug>-<item-short>-<merchant/network>`。
4. **同一商品多 network** → 加 **network-key suffix**（`books` = 通路王 / `affiliate-network` = 聯盟網）。
5. **同一商品多 merchant**（博客來 vs 金石堂）→ 加 **merchant-key suffix**（`books-com-tw` / `kingstone`）；若同時 merchant + network 都要區分 → 兩段都帶：`<kind>-<slug>-<merchant>-<network>`。
6. lowercase kebab-case、非數字開頭、≤ ~60 字元、唯一（validator R5 dup-key）、**永不改名**（rename = `active:false` + `replacementTarget` + 新 entry）。
7. **`productKey`（若未來啟用）= product-slug 段本身**（不含 kind / merchant / network），作為跨通路同商品分組鍵。

### 5.2 範例：《老後的時光要精彩》

假設文章 `slug: "aging-time-be-wonderful"`（**illustrative**；實際以該文 frontmatter `slug` 為準）→ product-slug base 取 `aging-time`（或完整 `aging-time-be-wonderful`，擇一致即可；以下用 `aging-time`）。

| 情境 | linkId | `productKey`(v1) | `networkKey` | `merchantKey` |
| --- | --- | --- | --- | --- |
| 通路王連結 | `book-aging-time-books` | `aging-time` | `books`（通路王）| （視通路填）|
| 聯盟網連結 | `book-aging-time-affiliate-network` | `aging-time` | `affiliate-network`（聯盟網）| （視通路填）|
| 同書 × 博客來（通路王）| `book-aging-time-books-com-tw-books` | `aging-time` | `books` | `books-com-tw` |
| 同書 × 金石堂（聯盟網）| `book-aging-time-kingstone-affiliate-network` | `aging-time` | `affiliate-network` | `kingstone` |

### 5.3 範例：一篇文章同時有兩個販售連結（通路王 + 聯盟網）

registry 兩筆 entry（`book-aging-time-books` + `book-aging-time-affiliate-network`，共享 `productKey: "aging-time"`）；post 端兩個 `ref`：

```yaml
affiliate:
  enabled: true
  disclosure: "本文包含聯盟行銷連結。若你透過連結購買，本站可能取得少量回饋。"
  position: { top: true, bottom: true }
  links:
    - ref: "book-aging-time-books"               # 通路王
      role: "primary"
      order: 10
    - ref: "book-aging-time-affiliate-network"   # 聯盟網
      role: "alternate"
      order: 20
```

→ **衝突避免**：兩 linkId 因 network-key suffix 不同而唯一（R5 dup-key 不觸發）；C5 intra-post duplicate-ref 不觸發（兩 ref 不同）；`productKey` 相同讓 Admin 能 group「同一本書的 2 個通路」。

### 5.4 命名紅線（沿用 schema decision §4.4）

- ❌ linkId / productKey 不含 affiliate redirect token（`3QaKr`）、不含完整 URL、不含中文、不含價格 / 活動字樣、不含日期作主鍵、不含書商內部 product id。
- ❌ 不由 URL pattern 反推 linkId / productKey / merchantKey / networkKey（所有 key 作者明示）。
- ❌ rename 一律走 migration（永不直接改名）。

---

## 6. Compatibility（不破壞既有機制）

- ✅ **不破壞既有 `affiliate.links[].ref`**：本輪所有新欄位（`productKey` / `productType` / `surfaces`）皆 **registry 端 optional additive**，post→registry 指標仍是 `ref` → `linkId`。validator C1/C2/C3/C5/C6/C8/C4/C9 行為不變。
- ✅ **不要求目前文章立刻新增 `category` / `productType`**：v0 不納入這些欄位；production posts 一字不改。
- ✅ **不要求 production registry 立刻 seed**：`commerce-links.json` 維持 `commerceLinks: []`；L1 seed gate 仍 BLOCKED（須 user 提供 `commerceSeedCandidates:` YAML + explicit approval）。
- ✅ **validator 短期仍 warning-only**：本輪不新增 / 不啟用任何 rule。未來若實作 `surfaces` / `productType` 檢查，亦 mirror download / commerce R-series 之 warning-only cadence。
- ✅ **L1 seed intake docs 不被推翻**：`docs/20260609-commerce-l1-seed-intake-packet.md` 的 candidate fields（linkId / displayLabel / role / targetUrl / sourceReason）維持不變。本輪只是**補上欄位層級決策**（`productKey` / `productType` / `surfaces` 屬 registry v1 optional，**不**進 L1 intake candidate 必填集合）。若未來 intake 要納入 `productKey`，須在 L1/L2 phase 顯式擴充，不在本輪。
- ✅ **三軸（linkId / internalLabel / displayLabel）+ near-term C → long-term D 策略**維持不變。
- ✅ **C9 Option D / no expansion** 維持；**reverse UTM dormant / pm-26 BLOCKED / Admin Apply / middleware / admin-write-cli dormant** 維持。

---

## 7. Next implementation candidates

後續可拆成的小 phase（每個標 source / settings / production 是否 changing；皆須各自 explicit approval，不自動推進）：

| # | Phase 候選 | 範圍 | source-changing? | settings-changing? | production-changing? |
| --- | --- | --- | --- | --- | --- |
| 1 | **本 phase**：欄位決策 docs | docs-only | ❌ | ❌ | ❌ |
| 2 | **schema v1 additive docs sync**（把 `productKey` / `productType` / `surfaces` 正式寫入 schema decision 之 v1 附錄；CLAUDE.md §3.2 commerce 段補記）| docs-only（最多改 CLAUDE.md prose）| ❌ | ❌ | ❌ |
| 3 | **example seed fixture docs**（`_sample.commerce-links.json` 是否補 v1 欄位範例；placeholder-only）| docs-only / 最多改 `_sample.*`（loader 白名單忽略 → 0 baseline drift）| ❌ | ⚠️（僅 `_sample.*`，非 production registry）| ❌ |
| 4 | **validator warning-only extension preanalysis**（未來 `surfaces` / `productType` 若要檢查之 rule 設計；docs-only）| docs-only | ❌ | ❌ | ❌ |
| 5 | **validator warning-only extension impl**（若 #4 採用）| source（validate-content.js）+ fixtures | ✅ | ⚠️（fixtures only）| ❌ |
| 6 | **Admin selector / snippet helper 顯示 `productType` / `productKey` grouping**（read-only preview）| source（active-commerce-links.js / admin view）| ✅ | ❌ | ❌ |
| 7 | **production L1 seed**（須 user 提供 `commerceSeedCandidates:` YAML + explicit approval；走 L1 preflight → L2 settings-only write → L3 acceptance ladder）| L2 = settings（`commerce-links.json` `[]`→非空）| ❌（L2）| ✅（L2 寫 production registry）| ❌（registry 非 post）|
| 8 | **renderer / migration**（ref → registry lookup；raw url → ref 遷移）| source（renderer）+ content | ✅ | ❌ | ✅（高風險；逐篇 explicit approval）|

**建議下一步（風險最低）= #2 schema v1 additive docs sync**；或直接 **Final Idle Freeze**，待 user 決定。**不自動啟動**任何 #3 以後 phase。

---

## 8. Explicit non-actions（本輪禁止）

- ❌ 修改 `src/`（含 validate-content.js / load-settings.js / renderer / Admin / active-commerce-links.js；validator 僅唯讀確認）
- ❌ 修改任何 `content/settings/*.json`（含 `commerce-links.json` / `_sample.*` / `affiliate-networks.json` / `categories.json`）
- ❌ 修改任何 post（`content/**/*.md`）
- ❌ 新增 fixture / overlay（`content/validation-fixtures/**`）
- ❌ seed production registry（`commerceLinks` 維持 `[]`）；不 promote `_sample.*`；不 production migration（raw url → ref）
- ❌ build / deploy（不碰 `dist*` / gh-pages）
- ❌ Blogger repost
- ❌ 啟用 GA4 validation / commerce dimension；不解除 reverse UTM dormant；不解除 pm-26 deploy gate
- ❌ Admin Apply / middleware write / admin-write-cli（維持 dormant）
- ❌ C4 / C7 / C9 source 變更；不擴張 C9（維持 Option D / no expansion）
- ❌ memory mutation（不改 MEMORY.md / project memory；本 phase 為 docs-only，memory sync 屬另授權）
- ❌ amend / rebase / force-push
- ❌ AI 自行發明 merchant / URL / affiliate / tracking 資料；不貼真實 affiliate token（範例 URL 用 `example.com` 等 RFC 2606 reserved；linkId 範例為 placeholder slug）

### 8.1 紅線敏感資料（永不入 repo / registry / docs）

沿用 CLAUDE.md §3.2 + intake packet §H：affiliate dashboard credentials / access token / API key / 帳號 email / private Drive folder id / Google Form 編輯 URL / respondent data / commission / payout / clickCount / customer data —— 全禁。

---

## 9. 最終欄位建議摘要（供回報）

1. **不為 commerce 新增 per-link `site`**：post 已有 top-level `site`；entry 站台無關。
2. **未來「某 link 只在某站」需求** → optional `surfaces`（複數，v1 deferred），省略 = 全站；現在不實作。
3. **不新增名為 `category` 的 commerce 欄位**（避免與內容 `category` collision）；商品種類用 **`productType`**（v1 optional enum 草案），短期先用既有 `tags[]`。
4. **`productKey` 不另立主鍵**：商品身分已在 `linkId` 的 product-slug 段；`productKey`（= product-slug，採 article slug）僅作 v1 optional 跨通路分組鍵。
5. **多 network / 多 link 已天然支援**：`affiliate.links[]` 為 array，每筆一 `ref`；registry 每通路一 `linkId`，用 `networkKey`（`books`=通路王 / `affiliate-network`=聯盟網）+ 必要時 `merchantKey` 區分；network-key suffix 確保 linkId 唯一、不撞 R5 / C5。
6. **欄位命名一律對齊既有 source**：`networkKey`（非 networkId）/ `merchantKey`+`merchant`（非 merchantId/Name）/ `internalLabel`+`displayLabel`（非 label/displayName）/ `targetUrl`（非 url）/ `active`（非 status/enabled）。
7. **registry entry 不放 `articleSlug`**（多對多）；文章關聯靠 linkId 命名線索 + 未來 derived `usedBy[]` inventory。
8. **v0 維持 schema decision 既有凍結欄位即可**；`productKey` / `productType` / `surfaces` 全列 **v1 optional additive**，本輪不實作、不要求、validator 不檢查。
9. **完整聯盟 URL（含 token）集中於 registry `targetUrl`**，不散落文章；post 端只放 `ref`。
10. **相容性全保**：不破壞 `affiliate.links[].ref`、不要求現有文章改動、不 seed registry、validator 維持 warning-only、L1 seed intake docs 不被推翻。

---

## 10. References（read-only）

- `CLAUDE.md` §1 / §3.1 / §3.2 / §12 / §15 / §16 / §23
- `docs/20260603-commerce-affiliate-link-registry-schema-decision.md`（三軸 / Strategy C→D / linkId convention / v0 23 欄位 — **本輪增補對象**）
- `docs/20260603-commerce-affiliate-link-registry-identifier-preanalysis.md`（三軸模型來源）
- `docs/20260609-commerce-l1-seed-intake-packet.md`（L1 seed intake；candidate fields；red lines — **不被本輪推翻**）
- `content/settings/commerce-links.json`（empty `[]`，verified）
- `content/settings/affiliate-networks.json`（`books`=通路王 / `affiliate-network`=聯盟網，verified）
- `content/blogger/posts/20260515-we-media-myself2.md`（唯一含 affiliate 結構 production post，`enabled:false`，verified）
- `src/scripts/validate-content.js`（commerce R-rules + C-rules，read-only 確認）

---

*（本文件結束 — docs-only 欄位決策；無 source / settings / content / fixture / registry 變更。）*
