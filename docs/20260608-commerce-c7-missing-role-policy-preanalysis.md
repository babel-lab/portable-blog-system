# 2026-06-08 Commerce C7 Missing-Role Policy — Preanalysis (docs-only)

Phase name: `20260608-pm-19-commerce-c7-missing-role-policy-preanalysis-docs-only-a`
Date: 2026-06-08 15:02 +0800
Mode: **docs-only C7 missing-role policy preanalysis**（no source / no fixture / no overlay JSON / no content / no settings registry mutation / no registry seed / no sample mutation / no templates / no views / no renderer / no loader change / no validator rule landing / no Admin picker / selector / no download renderer / landing implementation / no middleware / no build / no deploy / no Blogger repost / no GA4 validation / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no production content migration / no `npm install` / no CLAUDE.md mutation / no MEMORY mutation / no amend / rebase / force-push）

本檔判斷 commerce content-reference **C7 `commerce-ref-missing-role`** 是否應實作、何時實作、或維持 deferred / NO-GO。本輪**只新增本檔一份 docs**：不改 source、不改 fixture、不改 registry、不改 sample、不更新 memory。

---

## 0. Relation to prior phases

| 順序 | Phase / commit | 角色 |
| --- | --- | --- |
| am-7 (20260604) | commerce content-reference validation preanalysis | C1..C9 content-reference rule contract 凍結；§4.5 凍結 role enum 候選；C7 標 long-tail / defer |
| `39b89e3` / `281cd43` | commerce content-ref source landing | `validateCommerceRefs`：C1 / C2 / C3 / C5 / C6 |
| `8c9fddf` | commerce C4 inactive ref preanalysis（docs-only） | C4 contract 凍結；registry-coupled |
| `57c983b` / `bb33523` | commerce C8 invalid-role source + fixture landing | `commerce-ref-invalid-role`（warning-only；post-side；獨立 pass；**missing role 明確不警告**）|
| `5fe290f` | commerce C9 display-override-risk standalone preanalysis（docs-only） | C9 contract 凍結；registry-coupled |
| `de3134f` | C4 / C9 source landing | `commerce-ref-inactive` + `commerce-ref-display-override-risk`（registry-coupled；warning-only；dormant，registry empty → 0 觸發）|
| `3d236b9` / `baced89` | C4 / C9 overlay fixture plan（docs-only）+ overlay fixture landing | overlay `commerce-c4-c9-overlay.json` + reused `_test-commerce-ref-not-found.md`；overlay validate 證 C4 + C9 fire |
| **pm-19（本 phase）** `（本 commit）` | **commerce C7 missing-role policy preanalysis（docs-only）** | 判定 C7 是否應 source；**建議 deferred / NO-GO**（role 尚未被正式定義為必填）；**不**實作 source；**不**新增 fixture；**不** seed registry |

本階段唯一目的為：

> 在 C8 invalid-role 已 source + fixture-proven、C4 / C9 已 source + overlay fixture-proven、commerce registry 仍 empty `[]`、production posts 0 使用 commerce `role` 之現況下，判斷 C7（`commerce-ref-missing-role`）是否應該實作、何時實作、或維持 deferred / NO-GO。本檔結論為 **deferred / NO-GO（採 Option E + F）**：在 `role` 尚未被正式治理決策定義為「必填」、且無 Admin selector / authoring UI 協助作者填值之前，C7 不應 source；C8 已足以抓「無效 role」，role 維持 optional。

---

## 1. Executive Summary

### 1.1 本輪性質宣告

> **本輪為 docs-only preanalysis。** 唯一輸出為本檔。不 implement C7 source；不新增 fixture；不新增 overlay JSON；不 seed registry；不改 sample；不 production migration；不更新 memory / auto-memory；不改 src / content / settings / templates / views / package / lockfile / dist / gh-pages / .cache / CLAUDE.md。
>
> **目標是判斷 C7 missing-role 是否應實作；初步建議保守：若 `role` 尚未被正式定義為必填，C7 應 deferred / NO-GO，不應直接 source。**

### 1.2 一句話結論

> **建議 C7 維持 deferred / NO-GO（Option E + F）：將 `role` 文件化為「建議但 optional」，**不**新增 missing-role validator rule。理由：(a) C8 contract 已明確將「missing / undefined role 不警告」凍結為既定行為，C7 等於反轉此契約；(b) `role` 尚未被任何治理決策定義為必填；(c) 無 Admin selector / authoring UI 協助填 role，強制 role 會造成作者負擔；(d) read-only scan 顯示若現在啟動 C7「all links」scope，normal validate 約 +8 warnings（6 fixture + **2 production**），其中 2 條會 fire 在一篇真實已發布、使用合法 raw-link 形態的 production post 上 —— 屬純 noise。下一步建議 Final Idle Freeze 或（若 user 想推進 commerce 線）Admin selector preanalysis，而非 C7 source。**

### 1.3 推薦理由摘要

- **C8 契約反轉風險**：C8（`57c983b`）source comment 明文凍結「`role === undefined` → 不觸發（缺漏 role 屬 C7，本 phase 不啟用）」（`validate-content.js:706`）。C7 = 對同一欄位之「缺漏」開警告 → 與 C8 之「缺漏不警告」直接對立。兩者**互斥**（同一 entry 不可能同時 missing 又 invalid），但若 C7 啟用，等於把 role 從 optional 升為 required —— 這是**產品治理決策**，不是 validator 技術決策，不能由 source phase 自行裁定。
- **role 尚未被定義為必填**：am-7 §4.5 將 role 定義為 optional per-instance 顯示 hint；至今無任何 doc / 決策將其升為必填。CLAUDE.md §12 affiliate.links schema 範例亦無 role 欄位（範例只有 `label` / `network` / `url`）。
- **0 production 使用 + 0 consumer**：production posts 使用 commerce `role` = 0 篇；且目前**無 renderer 依 role 做顯示分支**（renderer 線 dormant）。強制一個「沒有任何 consumer」的欄位 = 純負擔、零效益。
- **scan 證實 noise 大**：見 §6，C7「all links」scope 今天啟動 ≈ +8 normal warnings，含 **2 條 production**（`20260515-we-media-myself2.md` 兩條合法 raw link，且該 post `affiliate.enabled: false`，但 `validateCommerceRefs` 無 enabled-gate → 仍會被掃）。
- **不違反紅線**：本 phase docs-only；不放真實 affiliate URL / token / merchant tracking id / OAuth secret / Form id / respondent data；不 mutate production registry；reverse UTM 與 pm-26 維持 dormant / BLOCKED。

### 1.4 本 phase 範圍

- 凍結 C7 candidate rule id / trigger 候選定義。
- 明確分辨 missing role / invalid role / optional role / required role 四種語意。
- 提出並回答「role 是否必填」之產品治理問題清單。
- read-only 盤點 fixtures / production posts 之 missing-role 現況 + count + 預估 baseline 影響。
- 比較 6 個 options（A..F）。
- 給保守推薦方向 + 若未來要做 C7 之 prerequisites。
- 凍結（若未來推進）fixture strategy。
- 列安全紅線。
- 給 final recommendation + 下一步建議；不執行下一步。

### 1.5 本 phase 不做的事

- ❌ 不 implement C7 source（`validateCommerceRefs` 不改）。
- ❌ 不新增任何 fixture / overlay JSON。
- ❌ 不 seed / mutate `content/settings/commerce-links.json`（registry 維持 empty）。
- ❌ 不改 `content/settings/_sample.commerce-links.json`。
- ❌ 不 migrate / mutate production posts；不新增 commerce `role`。
- ❌ 不啟用 renderer / Admin picker / selector / download landing。
- ❌ 不啟用 build / deploy / Blogger repost / GA4 / reverse UTM；不 unblock pm-26；不啟用 admin-write-cli / Admin Apply / middleware。
- ❌ 不改 CLAUDE.md / MEMORY / auto-memory；不改既有 docs（只新增本檔）。
- ❌ 不改 C1..C6 / C8 / C4 / C9 之既有 contract。
- ❌ 不 `npm install`；不 amend / rebase / force-push；不修正先前 commit subject 之 `@` 前綴。

---

## 2. Current Accepted Baseline

```
repo:            D:\github\blog-new\portable-blog-system
branch:          main
HEAD:            baced899bfb5007c41a538eb827ade02cf4ba8fb
origin/main:     baced899bfb5007c41a538eb827ade02cf4ba8fb
ahead/behind:    0/0
working tree:    clean
latest subject:  test(validate): add commerce C4/C9 overlay fixture
normal validate:  0 errors / 69 warnings / 59 posts
overlay validate: 0 errors / 70 warnings / 59 posts
                  （--registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json）
```

- ✅ **C8 `commerce-ref-invalid-role` 已 source + fixture-proven**（`57c983b` / `bb33523`）：`_test-commerce-ref-invalid-role.md` 觸發 `commerce-ref-invalid-role: affiliate.links[0].role="Primary"`。**missing / undefined role 明確不警告**（C8 契約凍結）。
- ✅ **C4 / C9 已 source + overlay fixture-proven**（`de3134f` source / `baced89` overlay fixture）：registry-coupled；normal（registry empty）下 0 觸發，overlay 下各 +1。
- 🔄 **C7 `commerce-ref-missing-role` source 尚未開始**；am-7 標 long-tail / defer。
- **production commerce registry remains empty**：`content/settings/commerce-links.json` = `{ schemaVersion:1, updatedAt:"", commerceLinks:[], notes:"" }`。
- 69/59 normal warnings 全屬 `content/validation-fixtures/`（validator 預期樣本，非 regression）。

---

## 3. Existing C8 Contract

C7 之分析前提為 C8 既有契約（`57c983b` source，`validate-content.js:54`–`57` + `:702`–`:723`，user final-confirmed）：

- **C8 rule id** = `commerce-ref-invalid-role`（warning-only）。
- **accepted enum**（`VALID_COMMERCE_LINK_ROLE`，`:57`；lowercase kebab-case，case-sensitive exact match）：
  - `primary`
  - `alternate`
  - `official`
  - `price-check`
  - `library`
  - `direct`
- **missing / undefined role does NOT warn**：`entry.role !== undefined && !VALID_COMMERCE_LINK_ROLE.has(entry.role)`（`:712`）→ `role === undefined` 整段不進 warning 分支。
- **non-string role warns**：走 typeof message（`affiliate.links[i].role typeof=<type>`），**非** hard error。
- **invalid string warns**：走 `affiliate.links[i].role="<role>"` message。
- **lowercase exact match**：`Primary` ≠ `primary` → invalid → warning（即 C8 抓 typo 之用途）。
- **獨立 pass**：在 C5 duplicate pass 之後、不碰 ref cascade；覆蓋 ref-only / ref+raw / raw-only entry。

> ⚠️ **關鍵：C8 已落地，但 C8 不代表 C7 missing-role 已被批准。** C8 source comment（`:706`）明文寫「缺漏 role 屬 C7，本 phase 不啟用」—— 這是「暫不處理 missing」，**不是**「已決定 missing 該警告」。C7 是否啟用仍是 open 的產品治理決策。

---

## 4. C7 Candidate Definition

### 4.1 candidate rule id

- candidate rule id 可暫定：**`commerce-ref-missing-role`**（沿用 am-7 §5 命名思路；與 `commerce-ref-*` 系列一致）。
- ⚠️ 本檔**僅暫定**此命名；C7 既不建議現在 source，命名 final-freeze 待未來（若有）source preflight。

### 4.2 candidate trigger（須決策，非既定）

- candidate trigger：
  - `affiliate.links[i]` 為一條 commerce link entry；
  - `role` missing / undefined / empty string（`role === undefined` 或 `typeof role === 'string' && role.trim() === ''`）→ warning。
- ⚠️ **此 trigger 是否合理需要決策**（見 §5）：它把 role 由 optional 升為「事實上必填」。

### 4.3 四種語意明確分辨（關鍵）

| 語意 | 定義 | 目前由誰處理 |
| --- | --- | --- |
| **missing role** | entry 完全沒有 `role` 欄位（`role === undefined`）或為空字串 | **目前無人處理**（C8 明確跳過）；= C7 候選範圍 |
| **invalid role** | `role` 存在且非空，但不在 `VALID_COMMERCE_LINK_ROLE` enum（含非字串）| **C8 已處理**（`commerce-ref-invalid-role`）|
| **optional role** | 治理立場：role 可有可無；缺漏不算錯 | **目前既定立場**（am-7 §4.5 + C8 契約）|
| **required role** | 治理立場：每條 commerce link 都必須有合法 role；缺漏算錯 | **尚未被任何決策採納** |

> 核心：C7 = 「missing role 是否該警告」。但「該不該警告 missing」完全取決於「role 是 optional 還是 required」。後者是**產品治理決策**，目前立場是 **optional**（§3 + am-7 §4.5）。在治理立場改為 required 之前，C7 沒有合法依據 → 不應 source。

---

## 5. Product Governance Question

C7 之核心不是技術，而是治理。以下問題在 source 前**必須**由 user 明確回答；目前**皆無**正式決策採納「required」：

| # | 治理問題 | 目前狀態 | 對 C7 之意涵 |
| --- | --- | --- | --- |
| Q1 | `role` 是不是必填？ | ❌ 否（am-7 §4.5 定義為 optional；CLAUDE.md §12 範例無 role）| role optional → C7 無依據 |
| Q2 | 是否所有 commerce links 都需要 role？ | ❌ 未決 | 若否 → C7「all links」scope 不成立 |
| Q3 | raw-only links（無 ref）是否需要 role？ | ❌ 未決 | raw link 是過渡形態；強制 role 會打到合法過渡用法（含 production we-media post）|
| Q4 | ref-based links 是否需要 role？ | ❌ 未決 | 即使限 ref-based，目前 0 production 用 ref → 仍無 production 受益 |
| Q5 | direct URL coexist links 是否需要 role？ | ❌ 未決 | coexist 已由 C6 提示 migration；再疊 C7 = 雙重 noise |
| Q6 | book-review / download / magazine / summary 等 contentKind 是否都要 role？ | ❌ 未決 | role 跨 contentKind 適用性不一（download / summary 未必有 commerce link）|
| Q7 | 若無 Admin selector / UI support，強制 role 是否造成作者負擔？ | ⚠️ 會 | 無 UI 下，作者須手記 6 值 enum 並逐條填；負擔高、易 typo（反而增加 C8 觸發）|

> 結論：7 題中無一支持「現在把 role 變必填」。在 Q1 被正式回答為「是（required）」之前，C7 應 deferred / NO-GO。

---

## 6. Current Fixture / Content Impact Scan

⚠️ read-only 盤點（本 phase 不改任何檔）。

### 6.1 validateCommerceRefs 無 enabled-gate（關鍵前提）

- `validateCommerceRefs`（`validate-content.js:608`–`611`）guard 僅檢查「affiliate 為 object + links 為 array」；**不**檢查 `affiliate.enabled`。
- → 即使 `affiliate.enabled: false` 之 post，其 `links[]` 仍會被掃 → C7（若啟用）會打到 enabled:false 之 production post。

### 6.2 commerce `role` / `labelOverride` 使用現況

- production posts 使用 commerce `affiliate.links[].role` = **0 篇**。（repo 內其他 `role:` 命中皆為 `book.authors[].role`，與 commerce C7/C8 無關。）
- `labelOverride` 出現於 **2 檔**（`_test-commerce-ref-not-found.md` + `commerce-c4-c9-overlay.json`），皆 fixture-scoped。
- 唯一含非空 commerce `affiliate.links` 之 production post = `20260515-we-media-myself2.md`（2 條 raw `label`+`network`+`url`，**無 role**，`affiliate.enabled: false`）。

### 6.3 「missing role（all links scope）」今天啟動之觸發盤點

每條 commerce link entry **缺 role** 即觸發（trigger §4.2，all-links scope）：

| location | entries 缺 role | 預估 C7 warning | enabled |
| --- | --- | --- | --- |
| `_test-commerce-ref-invalid-type.md` | 1（`ref:42`）| 1 | true |
| `_test-commerce-ref-empty.md` | 1（`ref:""`）| 1 | true |
| `_test-commerce-ref-not-found.md` | 1（ref+labelOverride）| 1 | true |
| `_test-commerce-ref-duplicate.md` | 2（dup ref）| 2 | true |
| `_test-commerce-ref-direct-url-coexist.md` | 1（ref+url）| 1 | true |
| `_test-commerce-ref-invalid-role.md` | 0（**有** `role:"Primary"`）| 0 | true |
| **production** `20260515-we-media-myself2.md` | 2（raw label+url）| **2** | **false（無 gate → 仍掃）** |
| **fixture 小計** | — | **6** | — |
| **production 小計** | — | **2** | — |
| **normal validate 預估總增** | — | **≈ +8** | — |

### 6.4 scope 變體之影響估計

| scope | fixture 增 | production 增 | 備註 |
| --- | --- | --- | --- |
| A：all links | ~6 | ~2 | 含 we-media 兩條合法 raw link → noise |
| B：ref-based only（entry 有 `ref` key）| ~6 | 0 | we-media 無 ref → 不打 production；但 fixture 仍噪 |
| C：`affiliate.enabled === true` AND ref-based | ~6 | 0 | we-media enabled:false → 排除 |

### 6.5 overlay 影響

- overlay reused fixture `_test-commerce-ref-not-found.md` 亦缺 role → overlay 模式下 C7 同樣 +1 → overlay baseline 亦會漂移。

### 6.6 不確定性標記

- 上述 fixture entry 數為**讀檔確認**（已逐檔讀 affiliate block），非猜測。
- 但「精確 net warning」尚取決於 C7 最終 trigger（missing vs missing+empty）、scope（all / ref-only / enabled）、是否與既有 C1/C2/C3 cascade 互動。**精確最終數字 = unknown，待 C7 trigger / scope 凍結後才可定**；本檔僅給 read-only 現況估計（≈ +8 all-links / ≈ +6 ref-only），不 commit 任何數字。

> 結論：無論哪種 scope，C7 都會在 fixtures 製造 ~6 條 noise；all-links scope 還會打到 **2 條合法 production raw link**。在 0 production 受益（0 用 role / 0 consumer renderer）下，此 noise 純屬負擔。

---

## 7. Options Compared

| 代號 | 定義 |
| --- | --- |
| **A** | Implement C7 now：missing role always warns（all links）|
| **B** | Implement C7 now：只對 ref-based links 警告 missing role |
| **C** | Implement C7 now：只對 `affiliate.enabled === true` and ref-based links 警告 |
| **D** | Implement C7 only after Admin selector / authoring UI exists |
| **E** | Keep C7 deferred / NO-GO for now |
| **F** | Document role as recommended but optional；no validator rule |

### 7.1 多維比較

| 維度 | A (all) | B (ref-only) | C (enabled+ref) | D (after UI) | E (deferred) | F (doc optional) |
| --- | --- | --- | --- | --- | --- | --- |
| warning noise risk | **高**（+8 含 2 production）| 中（+6 fixture）| 中（+6 fixture）| 低（延後）| **無** | **無** |
| authoring burden | **高**（role 變必填，無 UI）| 高 | 高 | 中（有 UI 輔助）| **無** | **無** |
| compatibility with C8 | ❌ 反轉 C8「missing 不警告」| ❌ 反轉 | ❌ 反轉 | ⚠️ 須同時 user 確認 required | ✅ 與 C8 一致 | ✅ 與 C8 一致 |
| fixture needs | 需 missing-role fixture（且須與 C8 invalid-role 區隔）| 同 | 同 | 同（延後）| **0** | **0** |
| normal baseline impact | **+~8（含 production）** | +~6（fixture）| +~6（fixture）| 0（延後）| **0** | **0** |
| Admin/UI dependency | 無（但因此負擔高）| 無 | 無 | **有（前置）** | 無 | 無 |
| acceptance difficulty | 高（production warning 須解釋 / 須改 production post 或加 inline 抑制）| 中 | 中 | 中（待 UI）| **低** | **低** |
| 治理依據 | ❌ 缺（role 非必填）| ❌ 缺 | ❌ 缺 | ⚠️ 須先 Q1=required | ✅ 維持 optional | ✅ 維持 optional |

### 7.2 各 option 裁決

- **A** → ❌ reject：noise 最高、打到合法 production raw link、反轉 C8、無治理依據。
- **B** → ❌ reject（現在）：避開 production，但仍 6 條 fixture noise + 反轉 C8 + 無治理依據；且 0 production 用 ref → 無 production 受益。
- **C** → ❌ reject（現在）：同 B；enabled-gate 雖排除 we-media，但仍無治理依據、無 consumer。
- **D** → ⚠️ **conditionally acceptable（未來）**：把 C7 綁在 Admin selector / authoring UI 之後是合理的「若要做就該這樣做」路線，但 (a) Admin 線目前 dormant；(b) 仍須先 Q1=required 決策。屬「未來條件達成才考慮」，非現在。
- **E** → ✅ **推薦**：維持現狀，0 noise、0 負擔、與 C8 一致、acceptance 最易。
- **F** → ✅ **推薦（搭配 E）**：把「role 建議但 optional」寫進文件（未來，若 user 要），給作者 guidance 而不強制；無 validator rule → 0 noise。

> **結論：採 E（現在 deferred / NO-GO）+ F（未來文件化為 optional）。** D 為「若未來治理改為 required 且 UI 就緒」之唯一可接受 source 路線。A / B / C 現在皆否決。

---

## 8. Recommended Direction

### 8.1 推薦

> **C7 維持 deferred / NO-GO（Option E）；role 維持 recommended-but-optional（Option F 為未來文件化方向，本輪不寫）。C8 繼續只抓 invalid role。**

- 依 §5 governance scan（Q1..Q7 無一支持 required）+ §6 impact scan（≈ +8 noise，含 2 production，0 受益）→ role 尚未正式必填 → C7 無合法依據。
- C8 已覆蓋「role 填了但填錯」之實際風險（typo / 非 enum）；missing role 在 optional 立場下**不是錯誤**，不需 validator 警告。
- 維持 deferred 之具體行為：`validateCommerceRefs` 不新增 C7 pass；baseline 維持 0/69/59（normal）/ 0/70/59（overlay）。

### 8.2 若未來要做 C7，需明確列出的 prerequisites

見 §9（治理 + scope + fixture + baseline + UI + id + acceptance 七項全綠才可 source）。

---

## 9. Future C7 Implementation Conditions

若未來要做 C7，至少需要（**每項**達成且 user 明確確認）：

1. **role required policy explicitly accepted**：user 正式裁定 `role` 為必填（§5 Q1 = required），並更新 am-7 §4.5 / CLAUDE.md §12 之 role 定義。
2. **scope frozen**：明確凍結 all links vs ref-only vs enabled-only（§7 B/C/A 三者擇一），並對應 §5 Q2..Q6 之逐 contentKind / link 形態決策。
3. **fixture strategy accepted**：凍結 missing-role fixture 形態（§10），且須能與 C8 invalid-role fixture **明確區隔**（避免混淆）。
4. **expected baseline impact known**：跑 read-only dry estimate，凍結預期 normal / overlay net warning（§6 顯示 all-links ≈ +8、含 production；須先處理 production post 之預期觸發 —— 改 post 或接受 warning 或加 scope 排除）。
5. **Admin selector / authoring support considered**：評估是否需先有 Admin role picker（§7 Option D）以降低作者負擔與 typo 反噬（typo 會反而增加 C8 觸發）。
6. **warning id frozen**：final-freeze `commerce-ref-missing-role`（或經 user 確認之替代命名）。
7. **acceptance plan created**：mirror C4/C9 overlay fixture ladder（plan → read-only acceptance → implementation → acceptance），含精確 expected delta。

> 七項全綠前，C7 不得 source。

---

## 10. Fixture Strategy If C7 Ever Proceeds

⚠️ **本輪不新增 fixture。** 以下為未來（若推進）之約束凍結。

- **不要本輪新增 fixture**（本 phase docs-only）。
- future fixture 應**獨立證明 missing-role**：一個 post fixture，其 `affiliate.links[i]` 完全無 `role`（或空字串 role），其餘欄位讓該 entry 不誤觸其他 rule（或明確標記 orthogonal cascade）。
- **必須避免與 C8 invalid-role 混淆**：C8 fixture（`_test-commerce-ref-invalid-role.md`）持有 `role:"Primary"`（present but invalid）；C7 fixture 須 **role 完全缺漏**（present-but-empty 或 absent）→ 命名建議 `_test-commerce-ref-missing-role.md`，message 區隔（C7 報「missing」/ C8 報「invalid」）。
- **需要 normal baseline expected count**：凍結 C7 fixture 落地後之精確 normal warning delta（取決於該 fixture 是否同時觸發 C1/C2/C3）。
- **需要 overlay 或 production-empty registry 情境**：C7 為 post-side rule（role 不依賴 registry），理論上 registry empty 即可測（同 C8）；但若 fixture 用 ref，須注意 registry empty → 同時觸發 C3 not-found。
- **需要防止 C3 not-found noise 混入**：若要**單獨**只證 C7，建議用 **raw-only entry（無 ref）+ 缺 role**（mirror C8 raw-only fixture 設計）→ 不觸發 C3，乾淨證 C7。
- fixture 內容紅線同 §11：無真實 affiliate URL / token / merchant id / tracking id；用 `example.invalid` + fixture-namespaced placeholder。

---

## 11. Safety / Red Lines

本 phase **明確 NOT do** / 紅線：

- ❌ no real affiliate URL / download URL / private download link。
- ❌ no tracking id / sid / aff_id / merchant id / token / credential / OAuth secret。
- ❌ no Google Form id / respondent data / commission-sensitive data（commission / payout / clickCount）。
- ❌ no registry seed（`commerce-links.json` 維持 empty `[]`）；no sample mutation；no overlay JSON 新增。
- ❌ no production migration（不碰任一 production post；不新增 role）。
- ❌ no deploy / Blogger repost / GA4 validation。
- ❌ no Admin Apply / middleware / admin-write-cli；no Admin selector implementation。
- ❌ no download renderer / landing page implementation。
- ❌ no reverse UTM activation / no pm-26 unblock。
- ❌ no C7 source；no source / fixture / package / lockfile / CLAUDE.md / MEMORY mutation。
- ❌ no amend / rebase / force-push；no 修正先前 commit subject `@` 前綴。

> 共同原則：任何進 repo 之 registry / fixture / sample / validator message / docs 內容皆視為公開；商業 / 隱私 / 內部識別敏感字串一律不進 repo、不進 validator log。

---

## 12. Final Recommendation

### 12.1 C7 是否現在應 source？

> ❌ **否。** C7 不應現在 source。`role` 目前是 optional（am-7 §4.5 + C8 契約 + CLAUDE.md §12 範例皆未定義 required）；C7 會反轉 C8「missing 不警告」契約、製造 ≈ +8 normal noise（含 2 條合法 production raw link）、且 0 production 受益（0 用 role / 0 consumer renderer）。採 **Option E（deferred / NO-GO）+ Option F（未來文件化為 optional）**。

### 12.2 若否，何時才可重新考慮？

> 當 §9 七項 prerequisites **全部**達成時 —— 關鍵閘門為：(1) user 正式裁定 `role` 為**必填**（§5 Q1 = required）；(2) scope 凍結；(3) 最好先有 Admin selector / authoring UI（§7 Option D）以降低作者負擔與 typo 反噬。在此之前，C7 維持 deferred。

### 12.3 下一步建議

> 建議 **Final Idle Freeze**（commerce content-ref 線之 validator 已收斂：C1/C2/C3/C5/C6/C8 active + C4/C9 registry-coupled overlay-proven + C7 判定 deferred）。
>
> 若 user 想繼續推進 commerce 線，**下一個 docs-only workline 建議為 Admin selector preanalysis**（read / 顯示維度；§7 Option D 之前置；同時可順帶釐清 role 是否該由 UI 強制 → 反過來回答 C7 之 Q1），**而非** C7 source。
>
> ❌ 本 phase 結束後**不**自動啟動 acceptance / Final Idle Freeze 解凍 / C7 source / Admin selector / fixture / registry seed；須等 user 明確授權。

---

## Appendix A — Cross-reference index

| 主題 | 文件 / commit |
| --- | --- |
| commerce content-reference validation preanalysis（C1..C9 contract + §4.5 role enum）| `docs/20260604-commerce-links-content-reference-validation-preanalysis.md` |
| commerce C8 invalid-role preanalysis | `docs/20260608-commerce-c8-invalid-role-preanalysis.md`（source `57c983b` / fixture `bb33523`）|
| commerce C9 display-override-risk preanalysis | `docs/20260608-commerce-c9-display-override-risk-preanalysis.md`（source `de3134f`）|
| commerce C4 inactive ref preanalysis | `docs/20260608-commerce-c4-inactive-ref-validation-preanalysis.md`（source `de3134f`）|
| commerce C4 / C9 overlay fixture plan | `docs/20260608-commerce-c4-c9-overlay-fixture-plan.md`（fixture `baced89`）|
| C8 source（VALID_COMMERCE_LINK_ROLE + 獨立 pass）| `src/scripts/validate-content.js:54`–`57` / `:702`–`:723` |
| validateCommerceRefs guard（無 enabled-gate）| `src/scripts/validate-content.js:608`–`611` |
| book authors role precedent | `src/scripts/validate-content.js:52` / `:1490` |
| 唯一含非空 commerce links 之 production post | `content/blogger/posts/20260515-we-media-myself2.md`（raw links；無 role；enabled:false）|
| commerce sample blueprint | `content/settings/_sample.commerce-links.json` |
| CLAUDE.md commerce 區塊 + 治理紅線 | `CLAUDE.md` §3（commerce-links governance）+ §12（affiliate.links schema）+ §16（連結處理）|

---

## Appendix B — Baseline snapshot

```
date:            2026-06-08 15:02 +0800
repo:            D:\github\blog-new\portable-blog-system
branch:          main
HEAD:            baced899bfb5007c41a538eb827ade02cf4ba8fb
origin/main:     baced899bfb5007c41a538eb827ade02cf4ba8fb
ahead/behind:    0/0
working tree:    clean
latest subject:  test(validate): add commerce C4/C9 overlay fixture
normal validate:  0 errors / 69 warnings / 59 posts
overlay validate: 0 errors / 70 warnings / 59 posts

commerce content-reference rules landed: C1 / C2 / C3 / C5 / C6 / C8 (post-side, active)
                                         C4 / C9 (registry-coupled; overlay-proven; dormant in normal)
commerce content-reference rules deferred: C7 commerce-ref-missing-role = THIS doc (NO-GO; not implemented)
commerce registry: empty []
commerce production role usage: 0 / ref usage: 0 / labelOverride usage: 0 (fixture-scoped only)
only production post with non-empty affiliate.links: 20260515-we-media-myself2.md (raw; no role; enabled:false)
commerce renderer / Admin selector / build / deploy / Blogger repost / GA4: dormant
reverse UTM activation: dormant (pm-24 source landed; un-deployed)
pm-26: BLOCKED
Admin Apply / middleware write / admin-write-cli: dormant
```

---

## Appendix C — C7 decision quick card

```
candidate rule id: commerce-ref-missing-role
candidate trigger: affiliate.links[i] 缺 role（undefined / empty）→ warning
semantics:         missing (C7 候選) ≠ invalid (C8 已做) ≠ optional (現況) ≠ required (未採納)
C8 relation:       互斥；C8 明文「missing role 不警告」→ C7 = 反轉該契約
governance:        role 尚未必填（§5 Q1..Q7 無一支持 required）
impact (read-only):all-links scope ≈ +8 normal warnings (6 fixture + 2 production)
                   ref-only scope ≈ +6 fixture, 0 production
                   precise net = unknown until trigger/scope frozen
production benefit: 0 (0 用 role; 0 consumer renderer)
options:           A/B/C reject (now); D conditional (future, after UI + required); E+F recommended
recommendation:    E (deferred / NO-GO) + F (future: document role as optional)
re-consider when:  §9 七項全綠（key: user 裁定 role required + scope frozen + Admin/UI 就緒）
next step:         Final Idle Freeze；若推進 commerce 線 → Admin selector preanalysis（非 C7 source）
red lines:         no real affiliate/merchant/token/tracking/commission/Form/respondent;
                   no seed / no fixture / no overlay / no migration / no deploy
status:            policy preanalysis frozen (docs-only); C7 source NOT implemented
```

---

（本文件結束）
