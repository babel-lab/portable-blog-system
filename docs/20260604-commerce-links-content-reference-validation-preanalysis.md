# 2026-06-04 Commerce Links Content-Reference Validation — Preanalysis (docs-only)

Phase name: `20260604-am-7-commerce-links-content-reference-validation-preanalysis-docs-only-a`
Date: 2026-06-04 09:38 +0800
Mode: **docs-only content-reference preanalysis**（no source / no content / no settings registry mutation / no templates / no fixtures / no loader change / no validator rule landing / no renderer / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no real affiliate link added / no registry seeding / no production content migration / no `npm install`）

---

## 0. Relation to prior phases

| 順序 | Phase / commit | 角色 |
| --- | --- | --- |
| night-19 `e40a278` | commerce affiliate link empty registry preanalysis | 檔名 / 路徑 / 空 JSON shape / loader 與 validator cadence / R1-clean 7 條件 |
| night-20 `c1a6974` | empty registry implementation（settings-only） | 新增 `content/settings/commerce-links.json` empty registry |
| night-21 `78f1e9a` | commerce-links loader exposure（source-only） | `load-settings.js` 暴露 `settings.commerceLinks = []`；無 consumer |
| night-22 `d5cfcd0` | commerce-links validator preanalysis（docs-only） | 凍結 registry-level R1..R15 + content-reference C1..C9 之 rule contract |
| night-25 `94a1d47` | commerce links registry-level validator source-only landing | `validate-content.js` 新增 11 條 registry-level rule（R3..R9 / R11..R14）；R1 / R2 / R10 / R15 deferred |
| am-2 `89cbf75` | commerce-links registry fixture mechanism preanalysis（docs-only） | 凍結 fixture mechanism = Option D（skip settings-level fixtures）；Option A path naming convention frozen escape hatch |
| am-2b `51d7edf` | docs(claude) sync commerce registry baseline | CLAUDE.md commerce registry 狀態同步 |
| **am-7（本 phase）** `（本 commit）` | **commerce-links content-reference validation preanalysis（docs-only）** | 凍結「文章如何引用集中管理之 commerce link」之 data model + content-reference validator warning-only rule contract（重整 night-22 §6 C1..C9）；不實作 source；不新增 fixture；不改 registry；不改文章 |

am-7 **不**重啟 schema / registry-level rule 裁決（night-22 §5 + night-25 已凍結）；亦**不**啟動任何 source。本階段唯一目的為：

> 在 registry-level validator 11 條 rule 已 landed、fixture mechanism 已決策（Option D）之現況下，**專注於 content-reference 維度**：凍結「文章 frontmatter 如何 reference 集中管理之 commerce link」之欄位命名 / 多連結支援 / ref 與 raw URL coexistence 政策 / display override 邊界 / content-reference validator warning-only rule contract / fixture 策略 / Admin / renderer 影響範圍，為下一個 content-reference source-only phase 提供可直接執行之 contract。

本階段為純文件；**不**改 `src/scripts/validate-content.js`、**不**改 `src/scripts/load-settings.js`、**不**改 `content/settings/commerce-links.json`、**不**改任何 content / templates / fixtures / package。

---

## 1. Executive Summary

### 1.1 一句話結論

> **建議下一個 commerce content-reference phase 採「source-only 先行」（mirror download R2 / night-22 §11.1 Phase C）**：只 land C1..C5 之 content-reference warning-only validator source；**不**同時做 fixture；**不**同時做 production content migration；**不**啟用 coexistence warning（C6）。validate baseline 須維持 **0 errors / 60 warnings / 53 posts**（現況 0 篇 production 文章用 ref → source-only 不觸發任何新 warning）。

### 1.2 本 phase 範圍

- 凍結「文章如何引用 commerce-links registry」之 **frontmatter reference data model**（欄位命名 / 多連結支援 / ref 與 raw URL 過渡期混用 / display override 邊界）。
- 凍結 ref 僅指向 registry `linkId`、**不**承載使用者填表資料 / token / secret 之紅線。
- 重整 night-22 §6 之 C1..C9，整理為清楚之 8 類 content-reference warning-only rule（invalid type / empty / not-found / inactive / intra-post duplicate / directUrl coexistence policy / role-placement enum / display override shape）+ naming policy。
- 凍結 fixture 策略：本 phase 不建 fixture；未來 content-reference source 採 source-only 先行；fixture 須 post-level（`_test-<rule-id>.md`）；**不**用 production content 當負面 fixture。
- 標記 Admin picker / renderer fallback 尚未開始；本 doc 只定義 validation + data model 方向。
- 凍結紅線 / non-goals。
- 列 candidate next phases（A / B / C / D；純資訊；不自動啟動）。
- **不**自動啟動下一階段。

### 1.3 本 phase 不做的事

- ❌ 不改 `src/scripts/validate-content.js`
- ❌ 不改 `src/scripts/load-settings.js`
- ❌ 不改 `content/settings/commerce-links.json` / 任一 settings JSON
- ❌ 不改任何 content / templates / fixtures
- ❌ 不改 `package.json` / `package-lock.json`
- ❌ 不執行 `npm install` / `npm run build` / `npm run dev`
- ❌ 不新增 fixture（content-reference / registry 全不建）
- ❌ 不做 production content migration（既有 `affiliate.links` 不動）
- ❌ 不啟動 Admin picker / renderer / GA4 / build / deploy
- ❌ 不 seed production registry
- ❌ 不解除 reverse UTM dormant；不解除 pm-26 deploy gate

---

## 2. Baseline

### 2.1 git / validate baseline（pre-commit）

| 項目 | 值 |
| --- | --- |
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD（pre-commit）| `51d7edf`（short）|
| `HEAD == origin/main`（pre-commit）| yes（ahead / behind = `0 / 0`）|
| working tree（pre-commit）| clean |
| 最新 commit subject（pre-commit）| `docs(claude): sync commerce registry baseline` |
| `npm run validate:content`（pre-commit）| **0 errors / 60 warnings / 53 posts** |

### 2.2 commerce-links registry 已存在且目前為空

`content/settings/commerce-links.json`（per night-20 `c1a6974`）：

```json
{
  "schemaVersion": 1,
  "updatedAt": "",
  "commerceLinks": [],
  "notes": ""
}
```

R1-clean 7 條件全部滿足（per night-22 §7.2）；本 phase 不動此檔。

### 2.3 loader 已 read-only exposure `settings.commerceLinks`

`src/scripts/load-settings.js`（per night-21 `78f1e9a`）：

```js
const commerceLinksRegistry = await readJsonOptional('commerce-links.json', { commerceLinks: [] });
result.commerceLinks = Array.isArray(commerceLinksRegistry?.commerceLinks) ? commerceLinksRegistry.commerceLinks : [];
```

→ `settings.commerceLinks` 為 `[]`（empty array）；metadata 欄位（`schemaVersion` / `updatedAt` / `notes`）**不**暴露；無下游 consumer。

### 2.4 registry-level validator 已 landed（per night-25 `94a1d47`）

11 條 warning-only registry-level rule（R3..R9 / R11..R14）已 land；helper `validateCommerceLinkRegistry` / `buildCommerceLinkIdSet` / `buildActiveAffiliateNetworkIdSet`；call site 為 post loop **外**單一呼叫；empty registry → 11 條全 0 觸發。

### 2.5 content-reference validator 尚未啟動

- `validate-content.js` 目前**無**任一 `affiliate.links[].ref` / `affiliate.commerceLinks[].ref` 之 content-reference rule。
- 既有 production posts 之 `affiliate.links` 皆為 **`[]`**（空），無一篇使用 `ref`（per grep `content/blogger/posts/20260504-sample-book-review.md` / `20260515-we-media-myself2.md` / `20260525-draft-book-review.md` 之 `affiliate.links: []`）。
- 既有 book-review template `affiliate.links: []`；無 ref 範例。
- validate baseline 之 60 warnings 無一條與 commerce content-reference 相關。

### 2.6 本 phase 不改變之既有 baseline

- 本 phase 純 docs-only；新增 1 個 docs 檔。
- validate baseline 預期 post-commit 仍為 **0 / 60 / 53**。

---

## 3. Content Reference Problem

### 3.1 問題陳述

> 一篇商務 / 書評文章可能含**多個**聯盟 / 商務連結（如「博客來」「金石堂」「聯盟網」「官方商店」）。目前文章 frontmatter 之 `affiliate.links[]` 以 **raw model**（`label` / `network` / `url`）直接內嵌 affiliate URL。此 raw model 無法被站長以穩定 key 反查 / 集中替換 / 統一停用；一旦聯盟連結失效或通路改版，舊 URL 散落各文章難以追蹤。

### 3.2 具體痛點

| # | 痛點 |
| --- | --- |
| 3.2.1 | 一篇文章可能有多個聯盟 / 商務連結，需以穩定識別碼分別管理 |
| 3.2.2 | 每個連結需要 `linkId`（machine key）/ `internalLabel`（站長內部識別）/ internal note 讓站長辨識「這是哪一個聯盟連結」 |
| 3.2.3 | 文章不應直接散落不可追蹤之舊聯盟 URL；URL 失效 / 通路改版時無集中替換點 |
| 3.2.4 | 站長需能在 registry 端統一「停用」一條 commerce link（`active: false`）並指向替代連結，而不必逐篇改文章 |
| 3.2.5 | 但**短期不得強迫全部 production content migration**；既有 `affiliate.links` raw model 須容許繼續使用，遷移永遠須作者逐篇明示 |

### 3.3 集中管理之目標（已由 registry landing 部分達成）

- ✅ registry（`commerce-links.json`）已存在；可登錄 `linkId` / `internalLabel` / `targetUrl` / `networkKey` / `active` / `replacementTarget`（per night-18 schema；本 phase 不重啟）。
- ✅ registry-level validator 已驗證 registry 自身 shape（11 條 rule landed）。
- ❌ **缺口**：文章端如何以 `ref` 指向 registry `linkId`、validator 如何驗證該 ref（not-found / inactive / duplicate / coexistence）—— 即本 phase 規劃之 content-reference 維度。

### 3.4 過渡期共存原則（不強迫 migration）

per night-18 §3.3（Strategy C mixed coexistence）+ night-22 §6.5：

- near-term：文章可**同時**保留 raw `affiliate.links[].url` 與新 `ref`；validator 容忍。
- 遷移**永遠**須作者逐篇明示；系統**不**自動把 raw URL 改寫成 ref；**不**批次 warn 逼作者匆忙改 frontmatter。
- renderer 尚未落地 ref lookup → 即使作者全改 ref，前台仍走 raw URL fallback（待 renderer phase）；故 coexistence warning（C6）near-term **不**啟用。

---

## 4. Frontmatter / Body Reference Model

⚠️ 本節為 data model 凍結；**不**裁決 frontmatter 之 ref 欄位**最終唯一**位置（per night-18 §6.1 (a)/(b)/(c)/(d) 候選；長期收斂至 D 之 `affiliate.commerceLinks[]`）。本 phase 規劃支援過渡期 ref + raw 混用。

### 4.1 建議欄位命名（near-term C 過渡期形態）

沿用既有 `affiliate.links[]` array，於 entry 內**新增** optional `ref` 欄位指向 registry `linkId`；raw 欄位（`label` / `network` / `url`）保留為過渡期 fallback：

```yaml
affiliate:
  enabled: true
  disclosure: "本文包含聯盟行銷連結。若你透過連結購買，本站可能取得少量回饋。"
  position:
    top: true
    bottom: true
  links:
    # 形態 1：純 ref（推薦長期形態；指向 registry linkId）
    - ref: "book-atomic-habits-books-com-tw"
      role: "primary"            # optional 顯示角色（per §4.5）
      order: 10                  # optional 排序
      labelOverride: ""          # optional 顯示文字覆寫（per §4.4）

    # 形態 2：ref + raw coexist（過渡期；renderer 落地前 raw 仍為前台 fallback）
    - ref: "book-atomic-habits-kingstone"
      label: "金石堂：實體書"      # raw（過渡期保留）
      network: "聯盟網"
      url: "https://..."

    # 形態 3：純 raw（既有 production model；不強迫 migration）
    - label: "博客來"
      network: "通路王"
      url: "https://..."
```

欄位語意：

| 欄位 | 型別 | 角色 | 必填 |
| --- | --- | --- | --- |
| `ref` | string | 指向 `commerce-links.json` 之 `linkId`（machine key）| optional（near-term）；長期建議 |
| `label` | string | raw 顯示文字（過渡期；ref 形態以 registry / `labelOverride` 取代）| optional |
| `network` | string | raw 通路名（過渡期）| optional |
| `url` | string | raw affiliate URL（過渡期 fallback）| optional |
| `role` | string enum | 顯示角色（`primary` / `alternate` / `official` / `price-check` / `library` / `direct`）| optional |
| `order` | number | 顯示排序 hint | optional |
| `labelOverride` | string | 文章端覆寫顯示文字（per §4.4）| optional |

### 4.2 支援一篇文章多個 commerce link refs

- `affiliate.links[]` 為 array；天然支援多個 entry，每個 entry 各帶一個 `ref`。
- 同一篇文章可混用 ref 形態與 raw 形態（per §4.1 三形態）。
- intra-post 多個 entry 指向**同一** `ref` 視為重複（C5；per §5.6）。

### 4.3 ref 只指向 registry，不存使用者填表資料

🔑 **紅線**：

- `ref` 僅為指向 `commerce-links.json` `linkId` 之**字串指標**；**不**承載任何 affiliate dashboard credentials / token / API key / OAuth secret / 帳號 email / 結算數據 / clickCount / 使用者表單 respondent data。
- 文章 frontmatter 之 commerce ref **永不**內嵌 secret token；real affiliate URL 之 token（如 `?sid=` redirect token）屬通路公開 redirect 參數，留在 registry `targetUrl`，**不**在文章端二次儲存。
- 此紅線 mirror download registry R1（respondent data 永不進 repo）+ commerce registry §9 secret safety。

### 4.4 display label / CTA copy 是否允許文章端 override

| 維度 | 決策 |
| --- | --- |
| 是否允許文章端覆寫顯示文字 | ✅ **允許**：以 `labelOverride`（per-instance）覆寫 registry 之 `displayLabel`；同一 commerce link 在不同文章可有不同 CTA 文案 |
| fallback chain（顯示文字）| `labelOverride`（文章端）→ registry `displayLabel` → registry `internalLabel` 之**安全 fallback 禁止**（internalLabel 為站長內部識別，**不**得渲染前台；per night-18 §9.3） |
| internalLabel 洩漏防護 | 若 `labelOverride` 等於 registry `internalLabel` → C9 warning（per §5.8）提示可能洩漏內部識別至前台 |
| CTA copy（如「前往購買」按鈕文字）| 屬 renderer / component 層；本 phase **不**裁決；屬 renderer phase |
| role-based 顯示差異 | `role`（per §4.5）為 per-instance 顯示 hint；renderer 可據此調整呈現（如 primary 醒目 / library 次要）；本 phase 只定義 enum，不定義渲染 |

🔑 **不**允許文章端 override registry 之 `targetUrl`（真正導向 URL 由 registry 單一管理；文章端只能覆寫顯示文字，不能覆寫導向目標）—— 此為集中管理之核心價值（統一替換 URL）。

### 4.5 role / placement enum（凍結候選列舉）

per night-22 §6.3 C8：

```
role enum（per-instance 顯示角色）:
  primary      主要購買連結（如官方 / 主推通路）
  alternate    次要 / 替代通路
  official      官方商店
  price-check   比價用途
  library       圖書館館藏（非購買）
  direct        直接連結（無聯盟）
```

- enum 為**建議列舉**；本 phase 凍結候選，未來 source phase 才實作 C8（invalid-role）warning。
- `role` 為 optional；缺漏不阻擋（C7 為 long-tail，本 phase **不**建議啟用）。
- placement（top / bottom）已由既有 `affiliate.position` 管理；**不**在 per-link `role` 內重複定義 placement。

### 4.6 body reference model

- 本 phase **不**規劃 body（Markdown 正文）內之 inline commerce ref 語法（如 `[[commerce:linkId]]` shortcode）。
- 理由：body shortcode 需 markdown 前處理器 + renderer 雙向支援；屬 renderer phase 之後；過早規劃違反「不過度工程化」（CLAUDE.md §1）。
- near-term：commerce link 僅由 frontmatter `affiliate.links[]` 驅動；正文不引用 ref。

---

## 5. Proposed Validator Content-Reference Warning-Only Rules

⚠️ **以下全為 warning-only**；無一條 error；本 phase 不實作。延續 night-22 §6 之 C1..C9 思路，重新整理為清楚之 8 類規則 + naming policy。trigger 位置統一為 post frontmatter `affiliate.links[i]`（sourcePath = post `.md` 路徑）。

### 5.1 Rule catalog overview

| # | 類別 | rule id | trigger | empty registry / 0-ref-post 觸發？ | in-scope（下一 source phase）|
| --- | --- | --- | --- | --- | --- |
| C1 | invalid type | `commerce-ref-invalid-type` | `ref !== undefined` 且 typeof !== 'string' | ❌ no | ✅ yes |
| C2 | empty ref | `commerce-ref-empty` | `ref` 為 string 但 trim 後空 | ❌ no | ✅ yes |
| C3 | not found | `commerce-ref-not-found` | `ref` 非空 trimmed string；linkIdSet !== null；ref 不在 set | ❌ no（0 篇用 ref）| ✅ yes |
| C4 | inactive / archived | `commerce-ref-inactive` | ref 命中但 entry `active === false` | ❌ no | ⚠️ defer（需 registry entry；mirror Option A coupling）|
| C5 | intra-post duplicate | `commerce-ref-duplicate-in-post` | 同 post `affiliate.links[]` 內 trimmed ref 重複 | ❌ no | ✅ yes |
| C6 | directUrl coexistence policy | `commerce-ref-local-url-coexistence-warning` | 同 entry `ref` 非空且 raw `url` 非空 | ❌ no | ❌ **不啟用**（migration-phase gated；per §5.7）|
| C7 | role missing | `commerce-ref-missing-role` | ref valid + 命中；`role` 缺漏 | ❌ no | ❌ long-tail（不建議啟用）|
| C8 | role / placement enum | `commerce-ref-invalid-role` | `role` 不在 §4.5 enum | ❌ no | ⚠️ defer（需先凍 enum；本 phase 已凍候選）|
| C9 | display override shape | `commerce-ref-display-override-risk` | `labelOverride` trim 後等於 entry `internalLabel`（洩漏風險）| ❌ no | ❌ long-tail（需 registry entry；defer）|

### 5.2 C1 — invalid type（`commerce-ref-invalid-type`）

| 屬性 | 值 |
| --- | --- |
| trigger | `affiliate.links[i].ref !== undefined` 且 `typeof !== 'string'` |
| severity | `warning` |
| message shape | `affiliate.links[<i>].ref typeof=<type> (must be string)` |
| empty registry / 0-ref 觸發 | ❌ no |
| 備註 | mirror `download-asset-ref-invalid-type`；C1 為 cascade 起點（C1 觸發 → skip C2..C9 for that entry）|

### 5.3 C2 — empty ref（`commerce-ref-empty`）

| 屬性 | 值 |
| --- | --- |
| trigger | `ref` 為 string 但 trim 後為空 |
| severity | `warning` |
| message shape | `affiliate.links[<i>].ref is empty or whitespace-only` |
| empty registry / 0-ref 觸發 | ❌ no |
| 備註 | mirror `download-asset-ref-empty`；與 C1 互斥 cascade（undefined 不觸發任何 rule；non-string → C1；string trim 空 → C2）|

### 5.4 C3 — not found（`commerce-ref-not-found`）

| 屬性 | 值 |
| --- | --- |
| trigger | `ref` 為非空 trimmed string；`linkIdSet !== null`；ref 不在 `linkIdSet` |
| severity | `warning` |
| message shape | `affiliate.links[<i>].ref="<ref>" not found in commerce-links registry` |
| empty registry / 0-ref 觸發 | ❌ no（現況 0 篇 production 用 ref；fixture 才觸發）|
| registry usable gate | `buildCommerceLinkIdSet(commerceLinks) === null` → skip C3（避免 registry shape invalid 時 cascade noise；mirror download `assetKeySet === null`）|
| 備註 | mirror `download-asset-ref-not-found`；C1 / C2 / C3 互斥 cascade；registry empty 時 set 為空 → 任何 ref 都 not-found，但 0 篇文章用 ref → 0 觸發 |

### 5.5 C4 — inactive / archived（`commerce-ref-inactive`）

| 屬性 | 值 |
| --- | --- |
| trigger | ref 命中 registry；entry `active === false` |
| severity | `warning` |
| message shape | `affiliate.links[<i>].ref="<ref>" matched but entry is inactive` + 若有 `replacementTarget` 則附 `(replacement="<targetLinkId>")`（**僅** linkId，不附內部 URL）|
| empty registry / 0-ref 觸發 | ❌ no（registry 無 entry → 不可能命中）|
| 備註 | 與 C3 互斥（not-found vs inactive 為兩條獨立路徑）；**不**向前台 / log 透露 replacementTarget 之內部 `targetUrl`，僅暴露 id；下一 source phase **defer**（fixture 需 registry 有 `active: false` entry → coupling Option A；per §6.4）|

### 5.6 C5 — intra-post duplicate（`commerce-ref-duplicate-in-post`）

| 屬性 | 值 |
| --- | --- |
| trigger | 同 post 之 `affiliate.links[]` 內 trimmed `ref`（非空）出現 ≥ 2 次 |
| severity | `warning` |
| message shape | `affiliate.links[<i1>,<i2>,...] duplicate ref="<ref>"`（每個 dup key 1 warning，不 per-occurrence 爆量）|
| empty registry / 0-ref 觸發 | ❌ no |
| duplicate 比對語意 | trim、case-sensitive；只比對 `typeof === 'string'` 且 trim 後非空之 ref（non-string 由 C1 處理；empty 由 C2 處理，皆**不**參與 duplicate）|
| 備註 | mirror download R5b `download-asset-ref-duplicate`；intra-post only（單篇 array 內重複；非跨篇）；與 C3 / C4 **orthogonal** cascade（同一 ref 可同時 not-found + duplicate）|

### 5.7 C6 — directUrl coexistence policy（`commerce-ref-local-url-coexistence-warning`）

| 屬性 | 值 |
| --- | --- |
| trigger | 同 entry 內 `ref` 非空且 raw `url` 非空（ref + raw URL coexist）|
| severity | `warning` |
| message shape | `affiliate.links[<i>] ref and url coexist (migration mode); remove url once renderer landed` |
| empty registry / 0-ref 觸發 | ❌ no |
| **本 phase 凍結** | **near-term C 過渡期內 C6 不啟用**；ref + raw url coexist **不**觸發 production warning |
| 啟動條件（全部滿足才啟用）| (1) renderer fallback phase 完成（ref lookup live）；(2) user explicit approval 啟動 migration phase；(3) C6 fixture 先建（fixture-first；確認不殃及 production post）；(4) 啟用後仍 warning-only，不阻擋 build |
| 理由 | 批次 warn 會推作者匆忙改 frontmatter，違反「不自動替換 raw URL」紅線；renderer 未落地時 warn 無資訊量（前台仍走 raw fallback）；mirror download：先 land empty registry + shape rule，再 fixture-first 補 content-reference |

### 5.8 role / placement enum + display override shape（C7 / C8 / C9）

| rule | trigger | severity | in-scope | 備註 |
| --- | --- | --- | --- | --- |
| C7 `commerce-ref-missing-role` | ref valid + 命中；`role` 缺漏 | warning | ❌ long-tail（不建議啟用）| role 為顯示 hint；缺漏不阻擋 |
| C8 `commerce-ref-invalid-role` | `role` 不在 §4.5 enum（`primary` / `alternate` / `official` / `price-check` / `library` / `direct`）| warning | ⚠️ defer | enum 候選已於 §4.5 凍結；需 user 確認 enum 凍結後再 land |
| C9 `commerce-ref-display-override-risk` | `labelOverride` 為 string 且 trim 後等於 entry `internalLabel` | warning | ❌ long-tail（defer）| 屬 night-22 V14 之 author-side mirror；防 internalLabel 洩漏前台；需 registry entry → coupling Option A |

### 5.9 Cascade ordering（content-reference）

```
C1 (invalid type)
└─ skip C2..C9 for that entry
C2 (empty trim)
└─ skip C3..C9 for that entry
C3 / C4 (not-found / inactive) — mutually exclusive（不可能同時 not-found 又 inactive）
C5 (duplicate-in-post) — orthogonal（與 C3 / C4 共存；同一 ref 可同時觸發）
C6 (coexistence) — gated by migration phase（near-term 不啟用）
C7 / C8 (role missing / invalid) — orthogonal；C7 / C8 互斥
C9 (display override risk) — orthogonal
```

registry usable gate：`buildCommerceLinkIdSet(...) === null`（registry shape invalid）→ C3 / C4 lookup skip（避免 cascade noise）；C1 / C2 / C5 不依賴 registry，照常檢查。

### 5.10 下一 source phase 之最小 in-scope 集

> **建議下一個 content-reference source phase 只 land C1 / C2 / C3 / C5**（不依賴 registry entry；fixture 可純 post-level / not-found 場景，registry 維持 empty 即可）。
> **defer C4 / C8 / C9**（需 registry 有對應 entry → coupling Option A）；**不啟用 C6 / C7**（migration-phase / long-tail）。
> empty registry + 0 篇 production 用 ref → C1..C5 source-only land 後 baseline 維持 **0 / 60 / 53**。

---

## 6. Fixture Strategy

⚠️ **本 phase 不建立任何 fixture**。以下為未來 fixture phase 之規劃。

### 6.1 本 phase 不建任何 fixture

- 本 phase 為 docs-only；不允許動 fixture（per §8 紅線）。
- fixture 設計屬獨立階段；應在 content-reference source contract 凍結（本 doc）+ source landed 後才設計（fixture 必須對齊 rule trigger / message shape）。
- 過早建立 fixture 會使後續 rule 修正困難。

### 6.2 未來若要加 content-reference source rules：source-only 先行 vs source+minimal fixture

| 路線 | 條件 | baseline 影響 |
| --- | --- | --- |
| **source-only 先行（推薦）** | C1..C5 source land；**不**同時建 fixture；coverage 倚賴 source review + 本 doc rule contract | 0/60/53（不變；0 篇 production 用 ref）|
| **source + minimal fixture** | source land 後**同一或下一** phase 建 post-level fixture（per §6.3）；fixture-first 驗證 rule fire | 0/(60+N)/(53+K)（fixture-driven；per §6.4 估算）|

推薦：**source-only 先行**（mirror download R2 / night-22 §11.1 Phase C），理由 mirror Option D（commerce registry fixture mechanism am-2 §8）：

- 與既有 download R-series / registry-level commerce rule cadence 一致（先 source、後 fixture）。
- source-only land 後 baseline 0 drift；任何意外 commerce warning 可立即識別。
- content-reference fixture 為 post-level（`.md`），可在後續獨立 phase 補，不阻擋 source land。

### 6.3 fixture 須 post-level；不得用 production content 當負面 fixture

🔑 **紅線**：

- content-reference fixture **必須** post-level（`content/validation-fixtures/{github,blogger}/posts/_test-<rule-id>.md`）；mirror 既有 `_test-download-asset-ref-*.md` cadence。
- **不得**用 production content（`content/{github,blogger}/posts/`）當負面 fixture；既有 production posts 之 `affiliate.links: []` 維持空，**不**為觸發 warning 而塞 invalid ref。
- fixture 之 ref 命名須明確 fixture 命名空間（如 `fixture-ref-001` / `__nonexistent-commerce-ref__`），與 production linkId 區隔。
- C3（not-found）fixture：registry 維持 empty；fixture post 用「故意不存在之 ref」→ 自然 not-found（**不**需 seed registry）。
- C4（inactive）fixture：需 registry 有 `active: false` entry → **強迫 Option A**（settings-level fixture）或延後；本 phase 標記為 defer。

### 6.4 候選 fixture 清單（未來 fixture phase）

| # | fixture purpose | 觸發 rule | 新增 post | 新增 warning |
| --- | --- | --- | --- | --- |
| FC1 | ref 非 string（invalid type）| C1 | +1 | +1 |
| FC2 | ref trim 空（empty）| C2 | +1 | +1 |
| FC3 | ref 不在 registry（not-found；registry 維持 empty）| C3 | +1 | +1 |
| FC5 | intra-post 重複 ref（duplicate）| C5 | +1 | +1 |
| FC4 | inactive entry referenced（需 registry entry）| C4 | +1 | +1（**須 Option A**；defer）|

→ FC1 / FC2 / FC3 / FC5 可在 registry empty 下純 post-level 完成；FC4 須 Option A coupling，defer。

### 6.5 預期 baseline 變動（估算）

| stage | posts count | warnings count |
| --- | --- | --- |
| current（本 phase 後）| 53 | 60 |
| content-reference source-only phase（C1..C5；無 fixture）| 53 | 60 |
| content-reference fixture phase（FC1 / FC2 / FC3 / FC5；4 post fixtures）| 57 | ~64 |

僅為估算；實際 fixture 數於 fixture phase 才裁決。

---

## 7. Admin / Renderer Impact

### 7.1 Admin picker 尚未開始

- ❌ **無** Admin picker / selector / UI 消費 commerce-links registry。
- 未來 Admin picker（讓站長從 registry 挑 `linkId` 插入文章 `ref`）屬 night-22 §11.1 Phase E；本 doc **不**規劃 Admin。
- 本 doc 凍結之 ref data model（§4）為未來 Admin picker 之輸入 contract（picker 產出 `ref` 寫入 `affiliate.links[]`），但 picker 本身不在本 phase 範圍。

### 7.2 Renderer fallback 尚未開始

- ❌ **無** renderer 讀取 commerce-links registry 解析 `ref` → `targetUrl`。
- 現況前台仍走 raw `affiliate.links[].url` fallback（template / post-detail render）。
- 未來 renderer fallback（ref lookup → registry targetUrl + displayLabel + rel/target 處理 + GA4 attr）屬獨立 renderer phase；本 doc **不**規劃 renderer。
- C6（coexistence warning）之啟動 gated by renderer landed（per §5.7）。

### 7.3 本 doc 範圍界定

> 本 doc **只**定義 content-reference 之 **validation 方向 + data model（frontmatter ref shape）**。
> **不**定義：Admin picker UI / renderer ref-resolution / CTA component 渲染 / GA4 commerce dimension / build / deploy。
> 上列屬各自獨立後續 phase；本 doc 為其提供 ref data model contract，但不實作。

---

## 8. Non-goals / Red Lines

### 8.1 本 phase 紅線（必須 enforced）

- ❌ **no source changes**：不改 `src/scripts/validate-content.js` / `src/scripts/load-settings.js` / 任一 `src/`
- ❌ **no content/settings changes**：不改 `content/settings/commerce-links.json` / `affiliate-networks.json` / 任一 settings JSON；不改任何 `content/{github,blogger,shared}/posts/` / `content/drafts/` / `content/archive/` / `content/templates/`
- ❌ **no fixture creation**：不新增任何 fixture（`.md` / `.json`）；不新增 `content/validation-fixtures/settings/` 目錄
- ❌ **no package change**：不改 `package.json` / `package-lock.json` / `vite.config.js`
- ❌ **no npm install**：不執行 `npm install`
- ❌ **no build/deploy**：不執行 `npm run build` / `build:github` / `build:blogger` / `dev` / `preview`；不 deploy gh-pages
- ❌ **no Blogger repost**：不重貼 Blogger 後台；不觸發 GA4 Realtime 驗收
- ❌ **no reverse UTM activation**：不解除 reverse UTM dormant
- ❌ **no pm-26 unblock**：不解除 pm-26 deploy gate
- ❌ **no Admin Apply / middleware / admin-write-cli**：全維持 dormant
- ❌ **no production commerce registry seed**：production `commerce-links.json` 維持 empty `[]`；無真實 affiliate entry
- ❌ **no production content migration**：既有 `affiliate.links` raw model 不動
- ❌ 不在本 docs 內貼真實 affiliate token / URL 內含 token / production linkId
- ❌ 不修改 MEMORY / project memory 檔（除非 user 另行要求）
- ❌ 不自動啟動下一階段

### 8.2 Non-goals

- ❌ 不重啟 night-18 schema 裁決 / night-22 rule contract / night-25 source landing。
- ❌ 不裁決 frontmatter ref 欄位**最終唯一**位置（near-term `affiliate.links[].ref`；long-term `affiliate.commerceLinks[]`；本 phase 支援過渡期混用）。
- ❌ 不裁決 body inline shortcode 語法（per §4.6；屬 renderer phase 後）。
- ❌ 不引入 unit-test framework / CI test runner（本專案第一版未規劃；CLAUDE.md §29）。
- ❌ 不裁決 C4 / C8 / C9 之啟動順序（標記 defer）。
- ❌ 不裁決 Blogger live commerce data landing 順序（屬獨立 go-live phase）。

---

## 9. Recommended Next Phases

⚠️ **本 phase 不自動啟動下一階段**；下列為供 user 評估之候選順序。

### 9.1 Candidate A — read-only acceptance cross-check（docs-only；可省略）

| 範圍 | 認可本 doc 之 data model + rule contract；cross-check night-22 §6 / am-2 §9.3 之一致性 |
| --- | --- |
| source / fixture 變動 | 無 |
| baseline | 0/60/53（不變）|
| 風險 | 最低 |

### 9.2 Candidate B — content-reference validator source-only preflight（docs-only → source-only）

| 範圍 | (preflight docs) 凍結 helper 命名 / call site / parameter shape；隨後 source-only land C1 / C2 / C3 / C5（**不**含 C4 / C6 / C7 / C8 / C9）|
| --- | --- |
| source 變動 | `src/scripts/validate-content.js`（新增 content-reference helper + post loop call）|
| fixture 變動 | 無（source-only 先行）|
| baseline | 0/60/53（不變；0 篇 production 用 ref）|
| 風險 | low |

→ 推薦理由：mirror night-22 §11.1 Phase C；marginal cost 最低；可立即推進。

### 9.3 Candidate C — Admin selector / display preanalysis（docs-only）

| 範圍 | 規劃 Admin picker 如何從 registry 挑 linkId 插入文章 `ref`；display 如何呈現（read-only preview）|
| --- | --- |
| source / fixture 變動 | 無（docs-only）|
| baseline | 0/60/53（不變）|
| 風險 | low（docs-only）；但屬 Phase E 範疇；建議延後至 content-reference source landed 後 |

### 9.4 Candidate D — commerce registry seed policy preanalysis（docs-only）

| 範圍 | 凍結「production registry 何時 / 如何 seed 第一批真實 affiliate entry」之治理政策（須對齊 reverse UTM unblock + pm-26 + Admin Apply 之啟動條件）|
| --- | --- |
| source / fixture 變動 | 無（docs-only）|
| baseline | 0/60/53（不變）|
| 風險 | low（docs-only）；但牽涉 go-live governance；建議延後 |

### 9.5 明確不建議

⚠️ **不**建議直接進 source / fixture / content migration：

- ❌ 直接做 content-reference source + fixture 混合 phase（風險集中；fixture 須 source land 後對齊）。
- ❌ 直接做 production content migration（既有 `affiliate.links` 改 ref）→ 須逐篇作者明示 + renderer 落地；現階段無 driver。
- ❌ 直接 seed production registry → 須 go-live governance（reverse UTM / pm-26 / Admin Apply 皆 dormant）。
- ❌ 直接啟用 C6 coexistence warning → gated by renderer landed + migration phase（per §5.7）。
- ❌ 任何 renderer / Admin / GA4 / build / deploy / Blogger repost（屬 Phase E 及以後）。

---

## 10. Final Recommendation

### 10.1 本階段 single conclusion

> **Commerce links content-reference validation preanalysis 已凍結**：
>
> - **data model**：near-term `affiliate.links[].ref` 指向 registry `linkId`；過渡期容許 ref + raw `url` coexist；支援一篇文章多個 ref；`labelOverride`（per-instance）可覆寫顯示文字但**不**得覆寫 `targetUrl`；`ref` 僅為指標、**不**承載 secret / token / 表單資料（紅線）。
> - **content-reference rules**：C1..C9 重整為 8 類（invalid type / empty / not-found / inactive / intra-post duplicate / directUrl coexistence policy / role-placement enum / display override shape）+ naming policy；全 warning-only。
> - **下一 source phase 最小 in-scope = C1 / C2 / C3 / C5**（不依賴 registry entry）；defer C4 / C8 / C9；不啟用 C6 / C7。
> - **fixture 策略**：本 phase 不建 fixture；未來採 source-only 先行；fixture 須 post-level；**不**用 production content 當負面 fixture；C4 fixture 須 Option A coupling（defer）。
> - **Admin picker / renderer fallback** 尚未開始；本 doc 只定義 validation + data model 方向。
> - empty registry + 0 篇 production 用 ref → 未來 C1..C5 source-only land 後 baseline 維持 **0 / 60 / 53**。

### 10.2 本階段結束後預設狀態

**Final Idle Freeze / EXIT**。

唯一輸出為本檔；不動 source / content / settings / templates / fixtures / package / dist / gh-pages / memory；validate baseline 維持 **0 errors / 60 warnings / 53 posts**；所有 dormant gates 維持 dormant；所有紅線維持 enforced。

### 10.3 不自動推進下一階段

若 user 決定推進，建議先行 Candidate A（read-only acceptance；可省略）或 Candidate B（content-reference validator source-only preflight + source-only land C1/C2/C3/C5）；Candidate C / D 屬 docs-only 但牽涉 Phase E / go-live governance，建議延後。**不**得自動開始 source / fixture / registry seed / Admin / deploy。

---

## Appendix A — Cross-reference index

- `docs/20260603-commerce-affiliate-link-registry-schema-decision.md`（night-18；schema decision + v0 欄位 + linkId 命名 + ref 候選 (a)/(b)/(c)/(d)）
- `docs/20260603-commerce-affiliate-link-empty-registry-preanalysis.md`（night-19；R1-clean 7 條件）
- `docs/20260603-commerce-links-validator-preanalysis.md`（night-22；rule contract 凍結；R1..R15 / C1..C9 候選；§6 content-reference 思路源）
- `docs/20260604-commerce-links-registry-fixture-mechanism-preanalysis.md`（am-2；fixture mechanism Option D；Option A path naming convention）
- `docs/related-links-schema.md`（relatedLinks / otherLinks 欄位字典；platform 前綴拆分；`validateRelatedLinksField` 範本）
- `docs/20260602-download-registry-aware-validation-preanalysis.md`（download R2 not-found / R5b duplicate cadence 範本）
- `CLAUDE.md` §1（不過度工程化）/ §3.2（commerce registry 狀態 + download R-series cadence + 紅線）/ §12（書評 affiliate.links schema）/ §16（連結處理）/ §27 / §29 / §30
- `content/settings/commerce-links.json`（empty registry；本 phase 不動）
- `content/settings/affiliate-networks.json`（既有 network registry；R11 referential target；本 phase 不動）
- `src/scripts/load-settings.js`（commerce loader 已落地；本 phase 不動）
- `src/scripts/validate-content.js`（registry-level 11 條 rule 已落地；content-reference 尚未啟動；本 phase 不動）
- `content/templates/blogger-book-review-template.md`（`affiliate.links: []` 範本）
- `content/blogger/posts/20260504-sample-book-review.md`（production `affiliate.links: []`；無 ref 使用）

---

## Appendix B — Baseline snapshot

- repo path：`D:\github\blog-new\portable-blog-system`
- branch：`main`
- HEAD（pre-commit）：`51d7edf`
- `HEAD == origin/main`（pre-commit）：yes（ahead / behind = `0 / 0`）
- working tree（pre-commit）：clean
- latest commit subject（pre-commit）：`docs(claude): sync commerce registry baseline`
- `npm run validate:content`（pre-commit）→ **0 errors / 60 warnings / 53 posts**

本階段結束後預期：

- 唯一新增：本檔 `docs/20260604-commerce-links-content-reference-validation-preanalysis.md`
- 其他狀態完全不變
- `npm run validate:content`（post-commit）預期維持 **0 / 60 / 53**

---

（本文件結束）
