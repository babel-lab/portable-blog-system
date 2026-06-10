# Commerce Blogger 通路王 L1 Seed — Result / Audit 記錄

> **Phase**: `20260610-am-commerce-blogger-tongluwang-l1-seed-a`
> **Mode**: **L1 seed（settings-only registry write）+ docs audit**。寫入 `content/settings/commerce-links.json`（empty `[]` → 9 entries）+ 本 audit doc。**不**改 Blogger posts / src / template / renderer / Admin / middleware / fixture；**不** build / deploy / gh-pages / Blogger repost；**不**處理 KOBO / 聯盟網；**不**新增 `affiliate-network`；**不**改 `affiliate-networks.json`。
> **Created**: 2026-06-10 +0800
> **Predecessor**: `docs/20260610-commerce-blogger-tongluwang-seed-candidates-intake-preflight.md`（preflight + clarification + targetUrl policy）、`docs/20260603-commerce-affiliate-link-registry-schema-decision.md`（v0 schema）、`docs/20260610-commerce-yaml-fields-site-productkey-category-preanalysis.md`（欄位 convention）

---

## 1. Baseline（seed 前）

| 項目 | 值 |
| --- | --- |
| branch | `main` |
| HEAD（pre-seed）| `5bff9fa`（`docs(commerce): clarify affiliate target url policy`）|
| HEAD vs origin/main | 相同（0/0）|
| working tree（pre-seed）| clean |
| `npm run validate:content`（pre-seed）| 0 errors / 69 warnings / 59 posts |
| `content/settings/commerce-links.json`（pre-seed）| empty `commerceLinks: []` |

---

## 2. Schema / convention check（寫入前）

依 v0 registry schema（`docs/20260603-...schema-decision.md` §5.2，23 欄位）逐欄分層：

| user YAML 欄位 | 是否 v0 registry schema 欄位 | 處置 |
| --- | --- | --- |
| `linkId` | ✅ required PK | 寫入 registry |
| `active` | ✅ required | 寫入 registry |
| `displayLabel` | ✅ optional（前台顯示）| 寫入 registry |
| `internalLabel` | ✅ required（author-only，嚴格不渲染）| 寫入 registry |
| `productTitle` | ✅ optional（#9 grouping）| 寫入 registry |
| `merchantKey` | ✅ required（#5）| 寫入 registry |
| `merchantLabel` | ⚠️ schema 欄位名為 **`merchant`**（#6 display）| 映射 `merchantLabel` → `merchant` 寫入 |
| `networkKey` | ✅ optional（#7，對齊 affiliate-networks.json id）| 寫入 registry（值 `books`）|
| `targetUrl` | ✅ required（#4）| 寫入 registry（verbatim，不轉 canonical / 不移除 `uid1=blog`）|
| `productKey` | ❌ **非 v0**（v1 optional grouping，deferred；per yaml-fields §3.3）| **不寫 registry**；audit-only（見 §5）|
| `role` | ❌ **非 registry 欄位**（article-side per-instance `affiliate.links[].role`）| **不寫 registry**；audit-only |
| `networkLabel` | ❌ 非 schema 欄位（network 顯示名由 affiliate-networks.json 派生）| **不寫 registry**；audit-only |
| `sourcePostSlug` | ❌ 非 registry 欄位（§3.11；多對多靠 derived `usedBy[]`）| **不寫 registry**；audit-only |
| `sourcePostTitle` | ❌ 非 registry 欄位 | **不寫 registry**；audit-only |
| `sourceReason` | ❌ 非核心 schema；可入 `notes` 但 user 指示「不硬塞、留 docs/audit」、未明示 promote→notes | **不寫 registry**；audit-only |

**寫入 registry 之欄位集**（每 entry）：`linkId` / `active` / `displayLabel` / `internalLabel` / `productTitle` / `merchantKey` / `merchant` / `networkKey` / `targetUrl`。全為 v0 schema 欄位；無 audit cruft。

---

> **🟢 UPDATE（2026-06-10 follow-up phase `20260610-am-commerce-append-held-mysterious-travel-ebook-link-a`，commit append 後）**：held 第 10 筆已由 user 補回 targetUrl 並 append。**registry 現為 10 active entries；held = 0**。新增筆 = `book-mysterious-travel-kim-youngha-books-com-tw-ebook-books`，`targetUrl: https://joymall.co/3QoxU?uid1=blog`（affiliate redirect，未轉 canonical / 未移除 `uid1=blog`），其餘欄位同 §4.1 預備值。既有 9 筆未改（append 於陣列末端）。excluded 仍 1 筆（KOBO，§4.2）。validate 維持 0/69/59。下方 §3 / §4.1 / §6 / §8 已標更新。

## 3. Seeded entries（10 筆，全 active、networkKey=books）

| # | linkId | merchant | 版本 | role* | targetUrl |
| --- | --- | --- | --- | --- | --- |
| 1 | `book-rouhou-time-books-com-tw-physical-books` | 博客來 | 實體 | primary | `https://whitehippo.net/3QWBP?uid1=blog` |
| 2 | `book-rouhou-time-books-com-tw-ebook-books` | 博客來 | 電子 | alternate | `https://adcenter.conn.tw/3QWBL?uid1=blog` |
| 3 | `book-rouhou-time-kingstone-physical-books` | 金石堂 | 實體 | alternate | `https://buyforfun.biz/3QWMC?uid1=blog` |
| 4 | `book-rouhou-time-hyread-ebook-books` | HyRead | 電子 | alternate | `https://wonderfulapple.net/3QWMO?uid1=blog` |
| 5 | `book-we-media-myself2-books-com-tw-physical-books` | 博客來 | 實體 | primary | `https://whitehippo.net/3QaKr?uid1=blog` |
| 6 | `book-we-media-myself2-kingstone-physical-books` | 金石堂 | 實體 | alternate | `https://adcenter.conn.tw/3QaLi?uid1=blog` |
| 7 | `book-mysterious-travel-kim-youngha-books-com-tw-physical-books` | 博客來 | 實體 | primary | `https://whitehippo.net/3QoxT?uid1=blog` |
| 8 | `book-mysterious-travel-kim-youngha-kingstone-physical-books` | 金石堂 | 實體 | alternate | `https://product.mchannles.com/3Qoxl?uid1=blog` |
| 9 | `book-mysterious-travel-kim-youngha-hyread-ebook-books` | HyRead | 電子 | alternate | `https://shoppingfun.co/3Qoxh?uid1=blog` |
| 10 | `book-mysterious-travel-kim-youngha-books-com-tw-ebook-books` | 博客來 | 電子 | alternate | `https://joymall.co/3QoxU?uid1=blog`（append follow-up）|

\* `role` 為 article-side per-instance 屬性，**未寫入 registry**；此處僅作 audit 記錄（未來文章端 `affiliate.links[].ref` 引用時填）。

---

## 4. Held / Excluded（未寫入 registry）

### 4.1 HELD — 1 筆（🟢 已於 follow-up phase 解除）

| linkId | 原因 / 結果 |
| --- | --- |
| `book-mysterious-travel-kim-youngha-books-com-tw-ebook-books` | **原因**：初次 L1 seed 時，user seed YAML 中此筆 targetUrl 行於傳輸中遺失/亂碼（僅餘 `…?uid1=blog` 尾段），依「不 fabricate 真實 affiliate URL」紅線 → held。**結果（🟢 RESOLVED）**：follow-up phase `20260610-am-commerce-append-held-mysterious-travel-ebook-link-a` 由 user 補回 `targetUrl: https://joymall.co/3QoxU?uid1=blog` 並 append 至 registry 末端。**held 現為 0**。 |

→ 初次 seed **9 筆**；follow-up append **+1** → registry 現 **10 active entries**；held **0**。

### 4.2 EXCLUDED — 1 筆（user 裁定本輪不販售）

| linkId | 原因 |
| --- | --- |
| `book-rouhou-time-kingstone-ebook-books`（targetUrl `https://shoppingfun.co/3QWMC?uid1=blog`）| user 確認金石堂電子書 = KOBO，本輪不販售；未來 KOBO 經**聯盟網**處理（deferred）。**不 seed、不建 KOBO candidate、不建 affiliate-network candidate**（per preflight §0.5 C2）。 |

---

## 5. Audit-only 欄位（user 提供但未寫入 registry）

保留於本 audit doc，**不**進 registry entry（per user 指示 + schema 分層）：

| linkId | sourcePostSlug | productKey | sourceReason（節錄）|
| --- | --- | --- | --- |
| book-rouhou-time-books-com-tw-physical-books | rouhou-time | rouhou-time | Existing Blogger article button for 老後的時光要精彩; seed Tongluwang 博客來 physical-book redirect. |
| book-rouhou-time-books-com-tw-ebook-books | rouhou-time | rouhou-time | Existing Blogger article button for 老後的時光要精彩; seed Tongluwang 博客來 ebook redirect. |
| book-rouhou-time-kingstone-physical-books | rouhou-time | rouhou-time | Existing Blogger article button for 老後的時光要精彩; seed Tongluwang 金石堂 physical-book redirect. |
| book-rouhou-time-hyread-ebook-books | rouhou-time | rouhou-time | Existing Blogger article button for 老後的時光要精彩; seed Tongluwang HyRead ebook redirect. |
| book-we-media-myself2-books-com-tw-physical-books | we-media-myself2 | we-media-myself2 | Repo-authoritative post we-media-myself2 already contains this button; seed Tongluwang 博客來 physical-book redirect. |
| book-we-media-myself2-kingstone-physical-books | we-media-myself2 | we-media-myself2 | User clarified this button is Tongluwang despite prior repo/content label mismatch; seed 金石堂 physical-book as networkKey books. |
| book-mysterious-travel-kim-youngha-books-com-tw-physical-books | mysterious-travel-kim-youngha | mysterious-travel-kim-youngha | Existing Blogger article button for 懂也沒用的神秘旅行; seed Tongluwang 博客來 physical-book redirect. |
| book-mysterious-travel-kim-youngha-kingstone-physical-books | mysterious-travel-kim-youngha | mysterious-travel-kim-youngha | Existing Blogger article button for 懂也沒用的神秘旅行; seed Tongluwang 金石堂 physical-book redirect. |
| book-mysterious-travel-kim-youngha-hyread-ebook-books | mysterious-travel-kim-youngha | mysterious-travel-kim-youngha | Existing Blogger article button for 懂也沒用的神秘旅行; seed Tongluwang HyRead ebook redirect. |

`sourcePostSlug` 提醒：`rouhou-time` 與 `mysterious-travel-kim-youngha` 之 repo 文章**仍不存在**（provisional slug）；`we-media-myself2` 為 repo-authoritative（`content/blogger/posts/20260515-we-media-myself2.md`）。此不影響 registry（registry 不存 sourcePostSlug；多對多靠未來 derived `usedBy[]`）。

---

## 6. Validation result（seed 後）

`npm run validate:content` = **0 errors / 69 warnings / 59 posts**（與 pre-seed baseline **相同**）。

warning 數**未增加**之原因：registry-level R-rules（R3–R14，warning-only）對 10 筆 entry（含 follow-up append 之第 10 筆）全數通過 —— 皆 plain object（R3）、linkId 非空且唯一（R4/R5）、active 且 targetUrl 非空（R6）、targetUrl 符 `^https?://`（R7）、internalLabel 非空（R8/R9）、`networkKey: books` 命中 `affiliate-networks.json`（R11 不觸發）、全 active 無 replacementTarget（R12/R13/R14 skip）。production posts 未用 `affiliate.links[].ref` → content-ref C-rules 對 production 維持 0 觸發。69 warnings 仍全來自 validation-fixtures。

---

## 7. Mutation scope

- ✅ `content/settings/commerce-links.json`：empty `[]` → **10 entries**（settings-only；初次 9 + follow-up append 1）
- ✅ 本 audit doc（新增）
- ❌ **零** Blogger posts / src / template / renderer / Admin / middleware / fixture / `affiliate-networks.json` 變更
- ❌ **零** build / deploy / gh-pages / Blogger repost
- ❌ **未**處理 KOBO / 聯盟網；**未**新增 `networkKey: affiliate-network`；**未**用 `tongluwang` / `lianmengwang`

---

## 8. Remaining blocked / deferred

| 項目 | 狀態 |
| --- | --- |
| 第 10 筆（mysterious-travel 博客來電子書）| ✅ **DONE** —— user 補回 `joymall.co/3QoxU`，已 append（held 現 0）|
| KOBO 電子書（金石堂電子書）| deferred —— 未來經聯盟網處理（§4.2）|
| 聯盟網（`networkKey: affiliate-network`）| 未啟動（本輪不建）|
| renderer / Admin picker / C7 source | dormant（registry 已非空，但無下游 consumer；render 仍 dormant）|
| production content migration（raw url → `ref`）| 未啟動（Blogger posts 未改）|
| build / deploy / Blogger repost / GA4 / reverse UTM / pm-26 | dormant / BLOCKED |
| repo `we-media-myself2.md` 金石堂 metadata label mismatch（聯盟網 → 通路王）| 未改文章（未來另一 phase）|

---

## 9. Next recommended step

1. **user 重新提供第 10 筆 targetUrl**（mysterious-travel 博客來電子書）→ 我 append 1 entry（settings-only，1 行 follow-up）。
2.（未來，各自另開 phase）renderer fallback 落地 → 文章端改用 `affiliate.links[].ref` → production migration → build / deploy。本記錄不預先授權任何後續 rung。

---

## 10. References（read-only）

- `docs/20260603-commerce-affiliate-link-registry-schema-decision.md` §5.2（v0 23 欄位）/ §5.4（明確排除欄位）/ §11（紅線）
- `docs/20260610-commerce-yaml-fields-site-productkey-category-preanalysis.md`（欄位 convention；productKey v1 deferred）
- `docs/20260610-commerce-blogger-tongluwang-seed-candidates-intake-preflight.md`（preflight + clarification + targetUrl policy）
- `docs/20260608-commerce-l1-seed-candidate-intake-template.md`（L1 intake；role enum；safe-URL policy）
- `content/settings/affiliate-networks.json`（`books` = 通路王 / `affiliate-network` = 聯盟網）
- `src/scripts/validate-content.js`（registry-level R3–R14，warning-only）
- `content/blogger/posts/20260515-we-media-myself2.md`（repo-authoritative we-media-myself2）

---

*（本文件結束 — L1 seed result / audit；registry empty `[]` → 9 entries；1 held + 1 excluded；validate 0/69/59 不變；無 source / posts / renderer / build 變更。）*
