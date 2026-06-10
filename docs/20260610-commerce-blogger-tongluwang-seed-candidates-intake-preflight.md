# Commerce Blogger 通路王 Seed Candidates — Intake / Preflight 記錄

> **Phase**: `20260610-am-commerce-blogger-tongluwang-seed-candidates-intake-preflight-a`
> **Mode**: **docs-only preflight record**（read-only review；**不** seed registry、**不**寫 `commerce-links.json`、**不**改 posts / src / template / renderer / Admin / middleware / fixture、**不** build / deploy / gh-pages / Blogger repost、**不**做下一步工程 triage）
> **Status**: 🔴 **BLOCKED / PROVISIONAL / NON-REGISTRY / NON-SEED**
> **Created**: 2026-06-10 +0800
> **Grounding（read-only）**: `docs/20260610-commerce-yaml-fields-site-productkey-category-preanalysis.md`（YAML 欄位 convention，HEAD `e7122c9` 已落地）、`docs/20260608-commerce-l1-seed-candidate-intake-template.md`（L1 intake template / role enum / safe-URL policy / 紅線）、`content/settings/affiliate-networks.json`、`content/settings/commerce-links.json`、`content/blogger/posts/20260515-we-media-myself2.md`

---

## 0. 本記錄的性質（最重要，先讀）

本文件是一份 **intake / preflight 記錄**，用途是把 user 在本 session 提供的「通路王販書連結候選」做**唯讀欄位與命名 preflight**，並把 user 的裁示固化下來，供**未來**正式 seed 前檢查使用。

明確非主張（per CLAUDE.md commerce governance + intake template §9 / §11）：

- ❌ **不是** L1 seed 執行結果。本文件落地**不**啟動 L1 seed ladder。
- ❌ **不是** registry write。`content/settings/commerce-links.json` 維持 `commerceLinks: []`。
- ❌ **不是** candidate 通過認定。下方 11 筆候選**全部維持 provisional / 未通過 / 未接受**。
- ❌ **不是** renderer / Admin / middleware / C7 啟用。全部維持 dormant。
- ❌ **不是** production content migration（posts 一字不改）。
- ❌ **不是** build / deploy / Blogger repost / GA4 觸發。pm-26 deploy gate 維持 BLOCKED。

**L1 seed gate 維持 BLOCKED**：在 user 提供經修正並明確核准的 `commerceSeedCandidates:` YAML、且另開獨立 L1 phase 之前，**不可** seed registry。absence of objection ≠ approval。

---

## 1. Baseline verify

| 項目 | 值 | 來源 |
| --- | --- | --- |
| branch | `main` | verified by command |
| HEAD | `e7122c9`（`docs(commerce): sync yaml field conventions`）| verified by command |
| HEAD vs origin/main | 相同（ahead/behind = 0 / 0）| verified by command |
| working tree | clean（本記錄寫入前）| verified by command |
| `npm run validate:content` | **0 errors / 69 warnings / 59 posts** | verified by command |
| production `commerceLinks` | empty `[]` | **verified by reading** `content/settings/commerce-links.json` |

`affiliate-networks.json`（**verified by reading**）：

| `id`（= networkKey 值）| `name` |
| --- | --- |
| `books` | 通路王 |
| `affiliate-network` | 聯盟網 |

→ **通路王的 networkKey 值是 `books`，不是 `tongluwang`；聯盟網是 `affiliate-network`，不是 `lianmengwang`。**

---

## 2. 候選盤點（user 本 session 提供）

user 提供 **3 商品、11 筆通路王 candidate**。全部 **provisional / 未通過 / 非 registry seed**：

| # | 候選 linkId（as-submitted）| 商品 | 通路 | 版本 | role | targetUrl（as-submitted）|
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `book-rouhou-time-books-physical-tongluwang` | 老後的時光要精彩 | 博客來 | 實體 | primary | `https://whitehippo.net/3QWBP?uid1=blog` |
| 2 | `book-rouhou-time-books-ebook-tongluwang` | 老後的時光要精彩 | 博客來 | 電子 | alternate | `https://whitehippo.net/3QWBL?uid1=blog` |
| 3 | `book-rouhou-time-kingstone-physical-tongluwang` | 老後的時光要精彩 | 金石堂 | 實體 | alternate | `https://buyforfun.biz/3QWMC?uid1=blog` |
| 4 | `book-rouhou-time-kingstone-ebook-tongluwang` | 老後的時光要精彩 | 金石堂 | 電子 | alternate | `https://shoppingfun.co/3QWMC?uid1=blog` ⚠️E |
| 5 | `book-rouhou-time-hyread-ebook-tongluwang` | 老後的時光要精彩 | HyRead | 電子 | alternate | `https://wonderfulapple.net/3QWMO?uid1=blog` |
| 6 | `book-ai-self-media-52-books-physical-tongluwang` | 自媒自創…52 | 博客來 | 實體 | primary | `https://whitehippo.net/3QaKr?uid1=blog` |
| 7 | `book-ai-self-media-52-kingstone-physical-tongluwang` | 自媒自創…52 | 金石堂 | 實體 | alternate | `https://adcenter.conn.tw/3QaLi?uid1=blog` ⚠️F |
| 8 | `book-mysterious-travel-kim-youngha-books-physical-tongluwang` | 神秘旅行（金英夏）| 博客來 | 實體 | primary | `https://whitehippo.net/3QoxT?uid1=blog` |
| 9 | `book-mysterious-travel-kim-youngha-books-ebook-tongluwang` | 神秘旅行（金英夏）| 博客來 | 電子 | alternate | `https://joymall.co/3QoxU?uid1=blog` |
| 10 | `book-mysterious-travel-kim-youngha-kingstone-physical-tongluwang` | 神秘旅行（金英夏）| 金石堂 | 實體 | alternate | `https://product.mchannles.com/3Qoxl?uid1=blog` |
| 11 | `book-mysterious-travel-kim-youngha-hyread-ebook-tongluwang` | 神秘旅行（金英夏）| HyRead | 電子 | alternate | `https://shoppingfun.co/3Qoxh?uid1=blog` |

> **傳輸品質註記**：本 session 候選 YAML 在傳輸中有多處斷裂 / 亂碼（例如 `w/3QWBL`、`avel-kim-youngha`、`product.mchannles.com/3Qoxl`、部分 `targetUrl` 行被截斷）。上表為就可辨識部分**還原意圖**之結果。**精確 token / 值請 user 以 affiliate 後台原稿為準再核**，本記錄不保證 token 字元逐一無誤。

---

## 3. Repo slug 交叉比對（裁示 D）

掃過 `content/` 全部 posts（blogger + github）與所有候選 URL / 標題：

| 候選 `sourcePostSlug` | repo 是否存在對應文章 | 結論 |
| --- | --- | --- |
| `rouhou-time`（老後的時光要精彩）| ❌ 無 | **provisional** — repo 無對應文章，不可視為正式 slug；不自行幻想 Blogger URL slug |
| `ai-self-media-52`（自媒自創…52）| ⚠️ **有，但 repo slug ≠ 候選值** | repo 實際 `slug: "we-media-myself2"`（`content/blogger/posts/20260515-we-media-myself2.md`）→ **以 repo 為準** |
| `mysterious-travel-kim-youngha`（神秘旅行 金英夏）| ❌ 無 | **provisional** — repo 無對應文章，不可視為正式 slug；不自行幻想 Blogger URL slug |

**裁示 D（記錄）**：

- `ai-self-media-52` 之 `sourcePostSlug` / `productKey` / linkId base proposal **同步改用 `we-media-myself2`**（以 repo `slug` 為準）。
- `rouhou-time` 與 `mysterious-travel-kim-youngha` 因 repo 無對應文章，**保持 provisional**，不可視為正式 slug，不自行幻想正式 Blogger URL slug。

repo `we-media-myself2.md` 既有 affiliate 區塊（**verified by reading**，`affiliate.enabled: false`）：

```yaml
affiliate:
  enabled: false
  links:
    - label: "博客來：實體書"
      network: "通路王"
      url: "https://whitehippo.net/3QaKr?uid1=blog"
    - label: "金石堂：實體書"
      network: "聯盟網"            # ← 注意：repo 標為「聯盟網」，見 §裁示 F
      url: "https://adcenter.conn.tw/3QaLi?uid1=blog"
```

---

## 4. 逐項 preflight 結論

### 4.1 欄位 vs convention（裁示 A / B / C）

| 候選欄位 | convention 決策（`...yaml-fields...`）| 差異 / 處置 |
| --- | --- | --- |
| `siteKey` / `siteLabel`（per-entry）| §3.1：**不**新增 per-link `site`；entry 站台無關；未來限定用 `surfaces`（複數，v1 deferred）| ❌ 偏離 → **裁示 B**：不寫入 registry entry；intake docs 可保留「來源是 Blogger」背景說明；registry entry 維持 site-agnostic；未來如需區分站台再依 convention 用 `surfaces`，**本輪不啟用** |
| `productCategory: book` | §3.2：**不**新增名為 `category` 的 commerce 欄位；商品種類用 `productType`（v1）| ❌ 命名偏離 → **裁示 C**：intake-only / provisional；docs 中記錄為 `productType` 但 **v1 deferred**；**不**寫入 registry |
| `productFormat: physical-book/ebook` | convention 無此欄位 | ⚠️ → **裁示 C**：**不**升級為 registry schema 欄位；實體 / 電子先用 `displayLabel` / `internalLabel` / linkId proposal 表達 |
| `sourceType` / `sourcePostSlug` / `sourcePostTitle` | §3.11：registry entry **不放** `articleSlug` / `postSlug`（多對多，靠 derived `usedBy[]`）| ⚠️ **intake-only**，**不可**寫進 registry entry |
| `networkKey: tongluwang` / `networkLabel` | §3.4：networkKey 值對齊 `affiliate-networks.json` 的 `id`（通路王 = `books`）| ❌ → **裁示 A**：改 `networkKey: books`；見 §4.2 |
| 缺 `sourceReason` | intake template §4.5：每筆**必填** | ❌ 全 11 筆缺；正式 seed 前須補 |

✅ 結構正確者：`linkId`（命名線索 OK，惟見 §4.4 開放命名項）、`displayLabel`（display-safe、無 tracking）、`internalLabel`（author-only、嚴格不渲染、無敏感資料）、`targetUrl`（見 §裁示 G）、`active`、`role`（見 §4.3）。

### 4.2 networkKey（裁示 A）

**裁示 A（記錄）** — 接受 preflight 結論：

- 目前 repo convention 以 `affiliate-networks.json` 為準。
- 通路王請用 **`networkKey: books`**。
- 未來聯盟網請用 **`networkKey: affiliate-network`**。
- **不要**使用 `networkKey: tongluwang`。
- **不要**使用 `networkKey: lianmengwang`。

理由：候選 `tongluwang` / `lianmengwang` 雖語意可區分，但**不符合既有 source 的 key 值** → validator **R11（invalid-network-key）會 warning**。正確區分未來通路王 vs 聯盟網的方式是 `books` vs `affiliate-network`。

### 4.3 role primary / alternate

每個商品**恰好一個 `primary`**（皆指博客來實體書），其餘 `alternate`。✅ 合理、無重複 primary、符合 C8 enum（`primary` / `alternate` 皆合法小寫）。role 屬 **post-level per-instance 欄位**（`affiliate.links[].role`），**不**寫入 registry entry（intake template §4.3）。

### 4.4 linkId 唯一性與開放命名項

- 11 筆 linkId 彼此**無重複** → 不撞 validator R5（linkId dup）/ C5（intra-post ref dup）。✅
- **開放命名項（未裁定，記錄供未來決策，本輪不自行重構）**：
  1. **format 段不在 convention 文法內**：convention §5.1 linkId 文法 = `<kind>-<product-slug>[-<merchant-key>][-<network-key>]`，**無** format 段。候選插入 `physical` / `ebook`。可接受但需補命名細則。
  2. **`books` 段語意撞名**：linkId 內 `books`（= 博客來，merchantKey `books-com-tw` 縮寫）與 source `networkKey: books`（= 通路王）**同字**，易混淆。建議 merchant 段改用更明確寫法（如 `bookscom`）或保留全寫，待 user 命名決策。
  3. **linkId network 後綴 `tongluwang` vs networkKey 欄位 `books`**：裁示 A 改的是 **networkKey 欄位值**；linkId 為 machine string，其網路後綴是否同步改為 `books` 屬命名決策，本輪**不自行裁定**，於 corrected proposal 以註記標出。

### 4.5 同篇多通路 / 格式 / 聯盟網撞名

機制上安全：每筆 linkId 唯一、每個 post `ref` 不同 → 不觸發 R5 / C5。同商品多筆靠 `productKey`（= product-slug）分組（如 rouhou 5 筆共享 `productKey: rouhou-time`）。

---

## 5. Unresolved 風險（正式 seed 前須 user 確認）

### 裁示 E — 金石堂電子書 token 重複（unresolved risk）

rouhou-time 金石堂**實體書**（#3 `https://buyforfun.biz/3QWMC?uid1=blog`）與**電子書**（#4 `https://shoppingfun.co/3QWMC?uid1=blog`）**共用同一 token `3QWMC`**（僅 domain 不同）。博客來實體 / 電子為不同 token（`3QWBP` / `3QWBL`），打破 pattern，疑似複製貼上漏改。

**裁示 E（記錄）**：

- 先記錄為 **unresolved risk**。
- **不**自行修正 `targetUrl`。
- **不**刪除。
- **不**判定為錯誤 —— 只標示「**需 user 回 affiliate 後台確認**金石堂電子書的正確連結」。

### 裁示 F — we-media-myself2 金石堂 network 衝突（unresolved conflict）

候選 #7（金石堂實體，`https://adcenter.conn.tw/3QaLi?uid1=blog`）標 `networkKey: tongluwang`（通路王）。但 repo `we-media-myself2.md` 內**同一 URL** 被標為 **network「聯盟網」**。同時 user 本 session 原始描述為「**聯盟網都還沒放**」。三者不一致。

**裁示 F（記錄）**：

- 先記錄為 **unresolved conflict**。
- **不**自行裁定。
- **不**把這筆強制歸為通路王。
- **正式 seed 前須 user 確認 network source**（repo 的「聯盟網」標註正確，還是候選的「通路王」正確）。

### 裁示 G — targetUrl policy 衝突（doc-vs-doc conflict）

候選 `targetUrl` 全為通路王 redirect 連結（含 redirect token + `uid1=blog`）。兩份 docs 直接矛盾：

- **convention §3.8**：完整聯盟 URL（含 redirect token / tracking id）**集中**於 registry `targetUrl`，不散落文章 → 支持放 redirect URL。
- **intake template §6.2**：first-seed `targetUrl` **不應**含 tracking token / shortener → 反對。

**裁示 G（記錄）**：

- 記錄為 **doc-vs-doc conflict**。
- 目前**只記錄，不改 schema**。
- **不**把 redirect URL 轉成 canonical URL。
- **不**移除 `uid1=blog`。
- **不**自行裁定 first seed targetUrl policy。

> 補充事實（不構成裁定）：這些 redirect token 為「點擊 Blogger 連結即可見」之公開 redirect slug，**非** intake template §7 紅線之 credential / secret token / API key / respondent data；其中 #6 / #7 之 URL 已存在於 repo `we-media-myself2.md`（已 committed）。是否作為 first-seed `targetUrl` 之 policy 仍待 user 裁定。

---

## 6. Corrected candidate proposal（proposal only / NOT accepted / NOT registry seed）

> 🔴 **本區塊為 proposal only —— 未接受、非 registry seed、非 L1 通過。** 僅套用裁示 A（networkKey → `books`）與裁示 D（we-media-myself2 slug 對齊 repo），並以註記標出 unresolved 項（裁示 E / F）。`siteKey` / `productCategory` / `productFormat` / `sourceType` / `sourcePostSlug` 等 **intake-only 欄位不納入 registry-bound proposal**（裁示 B / C）。linkId network 後綴與 `books` 段命名屬開放命名項（§4.4），本輪不自行重構，僅註記。

說明欄位分層：以下 proposal 僅列**未來可能進 registry 的欄位草案**（`linkId` / `displayLabel` / `internalLabel` / `networkKey` / `merchantKey` / `merchant` / `targetUrl` / `active`）+ **post-level** `role`（不入 registry）。`productKey` 以 **v1 optional grouping** 註記列出（v1 deferred，本輪不啟用）。

```yaml
# PROPOSAL ONLY — NOT ACCEPTED / NOT REGISTRY SEED / L1 BLOCKED
# 套用：裁示A networkKey=books / 裁示D slug 對齊 repo（we-media-myself2）
# intake-only 欄位（siteKey/siteLabel/productCategory/productFormat/sourceType/
#   sourcePostSlug/sourcePostTitle）已剔除，不入 registry-bound proposal（裁示B/C）
# linkId 之 format 段 / "books" merchant 段 / "tongluwang" network 後綴 = 開放命名項（§4.4），本輪不重構
commerceSeedCandidatesProposal:

  # ── 商品：老後的時光要精彩（productKey: rouhou-time）── PROVISIONAL slug（repo 無對應文章）
  - linkId: book-rouhou-time-books-physical-tongluwang        # 開放命名項：network 後綴 tongluwang vs networkKey books
    productKey: rouhou-time                                    # v1 optional grouping（v1 deferred）
    displayLabel: "博客來：實體書"
    internalLabel: "老後的時光要精彩｜博客來｜實體書｜通路王"   # author-only，嚴格不渲染
    merchantKey: books-com-tw
    merchant: "博客來"
    networkKey: books                                         # 裁示A（通路王 = books）
    role: primary                                             # post-level，不入 registry
    active: true
    targetUrl: "https://whitehippo.net/3QWBP?uid1=blog"       # 裁示G：保留原樣，不轉 canonical / 不移除 uid1
    # sourceReason: ""  # ← 正式 seed 前須補（intake §4.5）

  - linkId: book-rouhou-time-books-ebook-tongluwang
    productKey: rouhou-time
    displayLabel: "博客來：電子書"
    internalLabel: "老後的時光要精彩｜博客來｜電子書｜通路王"
    merchantKey: books-com-tw
    merchant: "博客來"
    networkKey: books
    role: alternate
    active: true
    targetUrl: "https://whitehippo.net/3QWBL?uid1=blog"

  - linkId: book-rouhou-time-kingstone-physical-tongluwang
    productKey: rouhou-time
    displayLabel: "金石堂：實體書"
    internalLabel: "老後的時光要精彩｜金石堂｜實體書｜通路王"
    merchantKey: kingstone
    merchant: "金石堂"
    networkKey: books
    role: alternate
    active: true
    targetUrl: "https://buyforfun.biz/3QWMC?uid1=blog"        # ⚠️裁示E：token 3QWMC 與下一筆重複

  - linkId: book-rouhou-time-kingstone-ebook-tongluwang
    productKey: rouhou-time
    displayLabel: "金石堂：電子書"
    internalLabel: "老後的時光要精彩｜金石堂｜電子書｜通路王"
    merchantKey: kingstone
    merchant: "金石堂"
    networkKey: books
    role: alternate
    active: true
    targetUrl: "https://shoppingfun.co/3QWMC?uid1=blog"       # ⚠️裁示E UNRESOLVED：與實體書共用 token 3QWMC，需 user 回後台確認；不自行修正

  - linkId: book-rouhou-time-hyread-ebook-tongluwang
    productKey: rouhou-time
    displayLabel: "HyRead：電子書"
    internalLabel: "老後的時光要精彩｜HyRead｜電子書｜通路王"
    merchantKey: hyread
    merchant: "HyRead"
    networkKey: books
    role: alternate
    active: true
    targetUrl: "https://wonderfulapple.net/3QWMO?uid1=blog"

  # ── 商品：自媒自創 AI玩轉自媒體的52個商業思維（productKey: we-media-myself2）── 裁示D：以 repo slug 為準
  - linkId: book-we-media-myself2-books-physical-tongluwang   # 裁示D：linkId base 改 we-media-myself2
    productKey: we-media-myself2                              # 裁示D：對齊 repo slug
    displayLabel: "博客來：實體書"
    internalLabel: "自媒自創 AI玩轉自媒體的52個商業思維｜博客來｜實體書｜通路王"
    merchantKey: books-com-tw
    merchant: "博客來"
    networkKey: books
    role: primary
    active: true
    targetUrl: "https://whitehippo.net/3QaKr?uid1=blog"       # 註：此 URL 已存在於 repo we-media-myself2.md

  - linkId: book-we-media-myself2-kingstone-physical-tongluwang
    productKey: we-media-myself2
    displayLabel: "金石堂：實體書"
    internalLabel: "自媒自創 AI玩轉自媒體的52個商業思維｜金石堂｜實體書｜通路王(待確認)"
    merchantKey: kingstone
    merchant: "金石堂"
    networkKey: books                                         # ⚠️裁示F UNRESOLVED：repo 標此 URL 為「聯盟網」，user 描述「聯盟網都還沒放」；network source 未裁定，不強制歸通路王
    role: alternate
    active: true
    targetUrl: "https://adcenter.conn.tw/3QaLi?uid1=blog"     # 註：此 URL 已存在於 repo we-media-myself2.md（標記 network=聯盟網）

  # ── 商品：懂也沒用的神秘旅行（金英夏）（productKey: mysterious-travel-kim-youngha）── PROVISIONAL slug（repo 無對應文章）
  - linkId: book-mysterious-travel-kim-youngha-books-physical-tongluwang
    productKey: mysterious-travel-kim-youngha
    displayLabel: "博客來：實體書"
    internalLabel: "懂也沒用的神秘旅行：小說家金英夏旅行的理由｜博客來｜實體書｜通路王"
    merchantKey: books-com-tw
    merchant: "博客來"
    networkKey: books
    role: primary
    active: true
    targetUrl: "https://whitehippo.net/3QoxT?uid1=blog"

  - linkId: book-mysterious-travel-kim-youngha-books-ebook-tongluwang
    productKey: mysterious-travel-kim-youngha
    displayLabel: "博客來：電子書"
    internalLabel: "懂也沒用的神秘旅行：小說家金英夏旅行的理由｜博客來｜電子書｜通路王"
    merchantKey: books-com-tw
    merchant: "博客來"
    networkKey: books
    role: alternate
    active: true
    targetUrl: "https://joymall.co/3QoxU?uid1=blog"

  - linkId: book-mysterious-travel-kim-youngha-kingstone-physical-tongluwang
    productKey: mysterious-travel-kim-youngha
    displayLabel: "金石堂：實體書"
    internalLabel: "懂也沒用的神秘旅行：小說家金英夏旅行的理由｜金石堂｜實體書｜通路王"
    merchantKey: kingstone
    merchant: "金石堂"
    networkKey: books
    role: alternate
    active: true
    targetUrl: "https://product.mchannles.com/3Qoxl?uid1=blog"

  - linkId: book-mysterious-travel-kim-youngha-hyread-ebook-tongluwang
    productKey: mysterious-travel-kim-youngha
    displayLabel: "HyRead：電子書"
    internalLabel: "懂也沒用的神秘旅行：小說家金英夏旅行的理由｜HyRead｜電子書｜通路王"
    merchantKey: hyread
    merchant: "HyRead"
    networkKey: books
    role: alternate
    active: true
    targetUrl: "https://shoppingfun.co/3Qoxh?uid1=blog"
```

---

## 7. 正式 seed 前的必修 / 待確認清單

| # | 項目 | 類型 | 處置 |
| --- | --- | --- | --- |
| 1 | networkKey `tongluwang` → `books`（全筆）；未來聯盟網用 `affiliate-network` | must-fix | 已於 corrected proposal 套用（裁示 A）|
| 2 | `ai-self-media-52` slug → `we-media-myself2`（sourcePostSlug / productKey / linkId base）| must-fix | 已於 corrected proposal 套用（裁示 D）|
| 3 | rouhou 金石堂實體 / 電子共用 token `3QWMC` | **unresolved risk** | 需 user 回 affiliate 後台確認（裁示 E）|
| 4 | we-media-myself2 金石堂連結 network（聯盟網 vs 通路王）| **unresolved conflict** | 需 user 確認 network source（裁示 F）|
| 5 | 每筆補 `sourceReason` | must-fix（seed 前）| intake §4.5 必填，現缺 |
| 6 | intake-only 欄位（siteKey / productCategory / productFormat / sourceType / sourcePostSlug / sourcePostTitle）不入 registry | governance | 已剔除於 registry-bound proposal（裁示 B / C / §3.11）|
| 7 | linkId 開放命名項（format 段 / `books` merchant 段歧義 / network 後綴）| open naming | 待 user 命名決策（§4.4）；本輪不自行重構 |
| 8 | first-seed targetUrl policy（redirect URL vs canonical）| **doc-vs-doc conflict** | 待 user 裁定（裁示 G）；本輪不改 schema |
| 9 | rouhou-time / mysterious-travel-kim-youngha 正式 slug | provisional | repo 無對應文章；不自行幻想 Blogger URL slug（裁示 D）|

---

## 8. 治理紅線重申（沿用 CLAUDE.md §3.2 commerce 段 + intake template §7）

本記錄 / 未來 registry / docs **永不**含：affiliate dashboard credentials / access token / API key / 帳號 email / 結算密碼 / private Drive folder id / Google Form edit URL / respondent data / commission / payout / clickCount / customer data。候選之 redirect token（如 `3QWBP`）為公開 redirect slug，非上述紅線項；惟其作為 first-seed targetUrl 之 policy 待裁定（裁示 G）。

**不可由 URL pattern 反推** merchantKey / networkKey / linkId —— 所有 key 由 user 明示。

---

## 9. Explicit non-actions（本 session 已遵守）

- ❌ 未修改 `content/settings/commerce-links.json`（維持 `commerceLinks: []`）
- ❌ 未 seed registry / 未把候選判定為通過
- ❌ 未修改任何 post（`content/**/*.md`）
- ❌ 未改 `src/` / template / renderer / Admin / middleware
- ❌ 未新增 fixture / overlay
- ❌ 未 build / deploy / 未碰 gh-pages / 未 Blogger repost
- ❌ 未做下一步工程 triage
- ✅ 唯一 mutation = 本 docs 檔（`docs/20260610-commerce-blogger-tongluwang-seed-candidates-intake-preflight.md`）

---

## 10. Next recommended user action

1. **回 affiliate 後台核對**：(a) rouhou 金石堂電子書正確連結（裁示 E token 重複）；(b) we-media-myself2 金石堂連結究竟屬通路王還是聯盟網（裁示 F）。
2. **裁定 first-seed targetUrl policy**（裁示 G：redirect URL 是否直接作為 registry `targetUrl`）。
3. **（可選）裁定 linkId 開放命名項**（§4.4）。
4. 待上述確認後，user 若要進 L1，**另開獨立 L1 phase**，提供經修正並明確核准的 `commerceSeedCandidates:` YAML —— 屆時才走 L1 preflight → L2 settings-only write → L3 acceptance ladder。**本記錄不預先授權任何後續 rung。**

---

## 11. References（read-only）

- `CLAUDE.md` §3.1 / §3.2（commerce governance）/ §12（書評 affiliate）/ §15（category）/ §16（連結處理）
- `docs/20260610-commerce-yaml-fields-site-productkey-category-preanalysis.md`（YAML 欄位 convention）
- `docs/20260608-commerce-l1-seed-candidate-intake-template.md`（intake template / role enum / safe-URL policy / 紅線）
- `docs/20260609-commerce-l1-seed-intake-packet.md`（L1 seed intake packet checkpoint）
- `content/settings/commerce-links.json`（empty `[]`，verified）
- `content/settings/affiliate-networks.json`（`books` = 通路王 / `affiliate-network` = 聯盟網，verified）
- `content/blogger/posts/20260515-we-media-myself2.md`（repo authoritative slug + 既有 affiliate 區塊，verified）

---

*（本文件結束 — docs-only preflight 記錄；🔴 BLOCKED / provisional / non-registry / non-seed；無 source / settings / content / fixture / registry 變更。）*
