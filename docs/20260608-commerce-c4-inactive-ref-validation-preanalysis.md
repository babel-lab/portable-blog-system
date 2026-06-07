# 2026-06-08 Commerce C4 Inactive Ref Validation — Preanalysis (docs-only)

Phase name: `20260608-am-2-commerce-c4-source-preanalysis-docs-only-a`
Date: 2026-06-08 07:37 +0800
Mode: **docs-only C4 source preanalysis**（no source / no fixture / no content / no settings registry mutation / no templates / no renderer / no loader change / no validator rule landing / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no real affiliate link added / no registry seeding / no production content migration / no `npm install` / no CLAUDE.md mutation）

---

## 0. Relation to prior phases

| 順序 | Phase / commit | 角色 |
| --- | --- | --- |
| night-19 `e40a278` | commerce affiliate link empty registry preanalysis | R1-clean 七條件 |
| night-20 `c1a6974` | empty registry implementation（settings-only） | `content/settings/commerce-links.json` empty registry |
| night-21 `78f1e9a` | commerce-links loader exposure（source-only） | `load-settings.js` 暴露 `settings.commerceLinks = []`；無下游 consumer |
| night-22 `d5cfcd0` | commerce-links validator preanalysis（docs-only） | registry-level R1..R15 + content-reference C1..C9 之 rule contract 凍結 |
| night-25 `94a1d47` | commerce links registry-level validator source-only landing | `validate-content.js` 新增 11 條 registry-level rule（含 R14 `commerce-link-inactive-missing-replacement`）|
| am-2 `89cbf75` | commerce-links registry fixture mechanism preanalysis | fixture mechanism = Option D（skip settings-level fixtures） |
| am-7 (20260604) | commerce-links content-reference validation preanalysis | C1..C9 content-reference rule contract 凍結；C4 標記 defer |
| am-10..12 + `39b89e3` | commerce links content-reference source landing（C1 / C2 / C3 / C5） | `validate-content.js` 新增 `validateCommerceRefs`；C4 skipped |
| night-2 `6aeee85` | commerce content-ref C1/C2/C3/C5 fixture preanalysis（docs-only） | 4 個 fixture 之檔名 / frontmatter shape / acceptance 凍結 |
| night-4 `149efdc` | commerce content-ref C1/C2/C3/C5 fixtures landing | 4 個 fixture 落地；baseline 60/53 → 66/57 |
| night-9 `90375ad` | commerce renderer fallback contract preanalysis（docs-only） | 凍結未來 commerce renderer 之 input / fallback / output contract |
| night-12 `（c6 preanalysis）` | commerce C6 coexistence warning preanalysis（docs-only） | C6 rule contract 凍結 |
| night-14 `281cd43` | commerce C6 source landing（source-only） | `validateCommerceRefs` 新增 C6 `commerce-ref-direct-url-coexist`（warning-only） |
| night-18..20 + `3aeabbc` | commerce C6 fixture strategy + landing | 第 5 個 commerce content-ref fixture；baseline 66/57 → 68/58 |
| **am-2（本 phase）** `（本 commit）` | **commerce C4 inactive ref validation preanalysis（docs-only）** | 規劃未來 C4 source 之 rule id / trigger / cascade / registry coupling / fixture strategy 候選；**不**實作 source；**不**新增 fixture；**不** seed registry；**不**碰 production content |

本階段唯一目的為：

> 在 commerce content-reference C1 / C2 / C3 / C5 / C6 source 與相應 fixtures 全部 landed、commerce registry 仍為 empty `[]`、production posts 0 使用 `ref` 之現況下，**先**為 C4（`commerce-ref-inactive`）source phase 凍結 rule contract / cascade ordering / registry coupling risk / fixture strategy 候選，並明確判定**不在本階段 implement C4 source**（registry seed 與 fixture mechanism 仍未解，貿然 land C4 source 等於 land 無法測試之 dead code 或被迫違反治理紅線）。本階段**不**改任何可執行檔；**不**新增任何 fixture；**不**改 `content/settings/commerce-links.json`；**不**改 CLAUDE.md。

---

## 1. Executive Summary

### 1.1 一句話結論

> **建議 docs-only 凍結 C4 rule contract（命名 `commerce-ref-inactive`、cascade 位於 C3 之後且與 C3 互斥、與 C5 / C6 orthogonal、message 不洩漏 internal targetUrl 僅保留 replacement linkId）；本階段不 implement C4 source；下一階段應為 read-only acceptance cross-check 或 Final Idle Freeze；C4 source 之啟動須先解決 commerce registry seed / fixture mechanism（既有 Option A path naming convention 為候選，但需獨立 phase 啟用）。**

### 1.2 推薦理由摘要

- **registry 仍為 empty `[]`**：C4 trigger 需 ref 命中且 entry `active === false`；empty registry 下 C4 source 即使 land 亦 0 觸發、0 fixture 覆蓋、0 production usage、0 可觀察行為。落地 = dead source。
- **R14 已 landed，governance 護欄已就位**：registry-level R14 `commerce-link-inactive-missing-replacement` 已存在於 `validateCommerceLinkRegistry`（src/scripts/validate-content.js:551–563）；意味未來作者寫入 `active: false` entry 時，registry 層已會警告缺漏 `replacementTarget`。C4 為 content-reference 維度，與 R14 為兩條獨立但 complementary 之 rule。
- **fixture mechanism 仍鎖死於 Option D**：am-2 `89cbf75` 凍結之 fixture mechanism 決議為 Option D（skip settings-level fixtures），近期路線不開放 settings-level fixture loader path；C4 fixture 強制需 registry 內有 `active: false` entry → 必須先解開 Option D 之鎖（或啟用 Option A 之 settings fixture loader / 或啟用獨立 mock harness）。
- **不違反紅線**：本 phase 為 docs-only；不放真實 affiliate URL / token / merchant tracking id / OAuth secret；不 mutate production registry；reverse UTM 與 pm-26 維持 dormant / BLOCKED。
- **與 C7 / C8 / C9 一致延後**：C4 與 C8 / C9 同屬「需 registry 有對應 entry」之 coupling Option A 範疇（per `20260604-commerce-links-content-reference-validation-preanalysis.md` §10.1）；不單獨啟動 C4。

### 1.3 本 phase 範圍

- 凍結 C4 rule id 候選與最終建議命名。
- 凍結 C4 trigger / severity / message shape / empty registry 觸發判定。
- 凍結 C4 在 C1 / C2 / C3 / C5 / C6 中之 cascade 排序與互斥 / orthogonal 語意。
- 凍結 C4 與 registry-level R14 / R12 / R13 / R6 / R7 之語意分工。
- 評估 C4 fixture 4 條候選路徑（A production seed / B test-only harness / C deferred until real seed / D docs-only contract freeze）之 mutation surface / rollback / 紅線風險 / baseline 影響。
- 評估 C4 source helper signature / call site 候選；給「未來 source phase 之最小 in-scope」候選。
- 預設 baseline 不變動（0 errors / 68 warnings / 58 posts）。
- 給下一階段建議；不執行下一階段。

### 1.4 本 phase 不做的事

- ❌ 不 implement C4 source（`validateCommerceRefs` 不改）。
- ❌ 不新增任何 fixture（不論 post-level 或 settings-level）。
- ❌ 不 seed `content/settings/commerce-links.json`（registry 維持 empty）。
- ❌ 不 migrate / mutate production posts；不新增 commerce frontmatter。
- ❌ 不啟用 renderer fallback；不啟用 Admin picker。
- ❌ 不啟用 build / deploy / Blogger repost / GA4 commerce dimension。
- ❌ 不 unblock pm-26；不啟用 reverse UTM；不啟用 admin-write-cli / Admin Apply / middleware write。
- ❌ 不改 CLAUDE.md。

---

## 2. Current Baseline

### 2.1 git / validate baseline（本 phase 開始時）

```
branch: main
HEAD: e17379d6a2d646069ed4487ee185c8bbec6c8bd4
origin/main: e17379d6a2d646069ed4487ee185c8bbec6c8bd4
ahead/behind: 0/0
working tree: clean
latest subject: docs(claude): sync commerce C6 fixture state
validate: 0 errors / 68 warnings / 58 posts
```

### 2.2 commerce content-reference 已 landed 範圍

- ✅ `validateCommerceRefs(affiliate, sourcePath, issues, commerceLinkIdSet)` 與 `buildCommerceLinkIdSet(commerceLinks)` helper 已存在於 `src/scripts/validate-content.js`。
- ✅ C1 `commerce-ref-invalid-type`、C2 `commerce-ref-empty`、C3 `commerce-ref-not-found`、C5 `commerce-ref-duplicate-in-post`、C6 `commerce-ref-direct-url-coexist` 為 warning-only 已 landed。
- ✅ 5 個 post-level fixture 已 landed（`_test-commerce-ref-invalid-type.md` / `_test-commerce-ref-empty.md` / `_test-commerce-ref-not-found.md` / `_test-commerce-ref-duplicate.md` / `_test-commerce-ref-direct-url-coexist.md`）。
- ❌ C4 `commerce-ref-inactive` 未 implement。
- ❌ C7 `commerce-ref-missing-role` / C8 `commerce-ref-invalid-role` / C9 `commerce-ref-display-override-risk` 未 implement。
- ❌ C4 / C7 / C8 / C9 fixture 未建立。

### 2.3 commerce registry 與 production 文章現況

- `content/settings/commerce-links.json` = `{ schemaVersion: 1, updatedAt: "", commerceLinks: [], notes: "" }`（empty registry；R1-clean 七條件全滿足）。
- production posts 使用 `affiliate.links[].ref` = **0 篇**。
- production posts 同時帶 `ref` + `url` = **0 篇**。
- 任何 fixture 含真實 affiliate URL / merchant tracking id / OAuth secret = **無**（既有 5 個 fixture 全用 fixture-namespaced ref 或 RFC 2606 reserved URL）。

### 2.4 registry-level 已 landed 之 inactive-related 護欄

- R14 `commerce-link-inactive-missing-replacement` 已存在於 `validateCommerceLinkRegistry`（`src/scripts/validate-content.js:551–563`）：當 entry `active === false` 且 `replacementTarget` 缺漏 / 非 string / trim 空 → warning。
- R12 `commerce-link-replacement-target-not-found` / R13 `commerce-link-replacement-target-self` 為 R14 之 supporting rules（檢驗 replacementTarget 合理性）。
- 三條 rule **針對 registry 自身結構**；不檢驗 post-side ref 是否指向 inactive entry → 此為 C4 之專屬職責。

### 2.5 fixture mechanism 既有決議

- am-2 `89cbf75` 凍結之 settings-level fixture mechanism：**Option D（skip settings-level fixtures）為近期路線**。
- Option A 之 `content/validation-fixtures/settings/commerce-links/_test-<rule-id>.json` path naming convention 已凍結為**未來 escape hatch**，**不在當前路線啟用**。
- Option B（source harness / mock injection）/ Option C（temporary production mutation）皆已 reject。

---

## 3. C4 Problem Definition

### 3.1 C4 候選 rule contract

| 屬性 | 值（建議凍結） |
| --- | --- |
| rule id | `commerce-ref-inactive`（沿用 `20260604-commerce-links-content-reference-validation-preanalysis.md` §5.5 凍結之命名）|
| 觸發位置 | `src/scripts/validate-content.js` → `validateCommerceRefs(affiliate, sourcePath, issues, commerceLinkIdSet)` 內 per-entry loop（mirror C3 之檢查位置）|
| sourcePath | post `.md` 路徑（mirror C1..C6）|
| trigger | `affiliate.links[i].ref` 為 trimmed non-empty string、命中 `commerceLinks` registry、且 registry 內對應 entry `active === false` |
| severity | `warning`（warning-only；**不**得 error）|
| message shape | `affiliate.links[<i>].ref="<ref>" matched but entry is inactive`，若該 entry `replacementTarget` 為 trimmed non-empty string 則附 ` (replacement="<replacementLinkId>")`（**僅** linkId，不附 `targetUrl`）|
| empty registry 觸發 | ❌ no（registry 無 entry → 不可能命中）|
| 0 ref 使用觸發 | ❌ no（無 post 帶 ref → 不可能命中）|
| 0 inactive entry 觸發 | ❌ no（即使有 entry，只要 `active !== false` → 不觸發）|
| renderer / build 行為 | **不**改變；C4 為 validator-only warning；renderer fallback contract（per night-9）獨立於 C4 而存在 |
| 自動 fallback 行為 | **不**自動 fallback 到 `url`；**不**自動移除 ref；**不** codemod migration；**不**改變 `affiliate.links[i]` 之 render output |
| production content 影響 | **不**自動修改任一 production post；warning-only |
| 與 R14 之關係 | C4 = content-reference 維度（post side）；R14 = registry-level 維度（registry self-shape）；兩者 orthogonal，可並存且互不 suppress |

### 3.2 不在 C4 範圍

- ❌ C4 **不**檢查 `archived` 欄位（registry schema 尚未凍結 `archived` enum；若未來 land `archived` field，須另開 rule 而非擴張 C4 trigger 語意）。
- ❌ C4 **不**檢查 entry `enabled` 欄位（registry schema 凍結之語意為 `active: boolean`；`enabled` 為其他 settings（如 `ads.config.json` / `promotion.config.json`）之語彙，commerce link 一律以 `active` 為準）。
- ❌ C4 **不**檢查 entry `expiresAt` / `effectiveUntil`（time-based deprecation 未凍結 schema；超出範圍）。
- ❌ C4 **不**檢查 entry `replacementTarget` 是否「自身 inactive」（cycle detection）→ 屬 R12 / R13 registry-level scope。
- ❌ C4 **不**觸發 build error；**不**阻擋 `dist/` / `dist-blogger/` 輸出。

### 3.3 C4 與 C3（not-found）之差異

| 觀點 | C3 `commerce-ref-not-found` | C4 `commerce-ref-inactive` |
| --- | --- | --- |
| trigger | ref 為 non-empty string 但 **不在** registry | ref 為 non-empty string **且**命中 registry，但對應 entry `active === false` |
| 互斥 | ✅ C3 / C4 **mutually exclusive**（同一 ref 不可能同時 not-found 又 inactive）|
| cascade | C3 觸發 → **不**檢查 C4（提前 continue）；C4 觸發 → 不可能也是 C3 |
| empty registry 行為 | C3 trigger ↑（任何 ref 都 not-found）但目前 0 production ref → 0 觸發 | C4 trigger = 0（registry 無 entry → ref 不可能命中）|

C3 / C4 互斥之語意對 validate baseline 之意義：**只要 production 不引入 inactive entry**，C4 source 永遠 0 觸發；落地後 validate baseline 不變動。

---

## 4. Registry Coupling Risk

C4 為**第一個**需要 registry 內有具體 entry 才能驗證之 content-reference rule（C1 / C2 / C3 / C5 / C6 全部可在 registry empty 下測試）。此 coupling 帶來四類風險：

### 4.1 fixture 需 registry seed

- C4 fixture 必須存在「一個 post 含 ref="X"」+「registry 內有 entry `{ linkId: "X", active: false, ... }`」之配對。
- 後者要求 `content/settings/commerce-links.json` 內必須有 entry → 與 am-2 `89cbf75` 凍結之 Option D（skip settings-level fixtures）/ R1-clean empty registry 政策直接衝突。

### 4.2 production registry 污染風險

若直接在 production `commerce-links.json` 加入 `{ linkId: "test-c4-inactive", active: false }`：

- ❌ 違反 R1-clean 七條件之第三條（commerceLinks 為空 array）；
- ❌ am-2 §12 紅線：「**禁止**為 fixture 修改 production `affiliate-networks.json`」之同類精神延伸至 `commerce-links.json`；
- ❌ 即便該 entry 用 fixture-namespaced linkId，仍會被 loader load、被 registry-level validator 掃描（R6 missing targetUrl / R14 inactive-missing-replacement 等可能連帶觸發 → baseline drift）。

### 4.3 真實 affiliate URL / token 洩漏風險

若為避免 R6 warning 而為 inactive fixture entry 補上 `targetUrl`，將面臨：

- ❌ 若使用真實 affiliate URL → 違反 `CLAUDE.md` §3.2 commerce 治理紅線（永不含 access token / merchant tracking id / 結算密碼）；
- ❌ 若使用 RFC 2606 reserved URL（`https://example.invalid/...`）→ R7 `commerce-link-invalid-target-url` 因 `^https?://` regex 仍 match 而**不**觸發（OK），但會於日後 fixture review / git blame 中混淆真實 vs fixture entry。

### 4.4 baseline drift 風險

任何 registry 內新增 entry，**必**至少多 1..N 條 registry-level warning：

- 若 entry 只填 `linkId` + `active: false` → R6 missing targetUrl + R8 / R9 internalLabel + R14 inactive-missing-replacement = **3 條 warning** 至少；
- 若補齊 targetUrl / internalLabel / replacementTarget → 仍需保證 replacementTarget 指向另一存在 entry，否則 R12 not-found。

→ C4 fixture coupling 之 baseline drift 預期最少 +3 warnings，最多 +5 warnings；與 C4 自身 warning（+1）不對等。

### 4.5 風險總結

> **C4 不可能在 production `commerce-links.json` 維持 empty `[]` 之前提下被 fixture 驗證**。必須先解決 (a) settings-level fixture loader（Option A 啟用）或 (b) registry seed policy（user 明確授權真實 entry 入庫）或 (c) mock injection harness（Option B）。三者皆**獨立於 C4 source phase**；本 phase **不**裁決三者之啟用順序，僅標記為 C4 source phase 之前置 blocker。

---

## 5. Fixture Strategy Options

四條候選路徑，與 am-2 fixture mechanism 之 Option A..D 命名語意對齊但加入 C4 視角。

### 5.1 Option A — production registry seed + fixture post

- **內容**：在 `content/settings/commerce-links.json` 加入一筆 `{ linkId: "fixture-c4-inactive", active: false, replacementTarget: "fixture-c4-replacement", ... }` + 一筆 `{ linkId: "fixture-c4-replacement", active: true, ... }`；在 `content/validation-fixtures/blogger/posts/_test-commerce-ref-inactive.md` 加入 `affiliate.links: [{ ref: "fixture-c4-inactive" }]`。
- **mutation surface**：production registry +2 entries + 1 fixture post。
- **rollback**：須 revert registry mutation + fixture；rollback 需處理「entry 可能已被誤用於其他 fixture」之 fan-out 風險。
- **真實 affiliate URL 風險**：必須補 `targetUrl`；若用 `https://example.invalid/...` 則 governance 上是「故意 invalid placeholder」需於 commit message + CLAUDE.md 標記，否則 review 易混淆。
- **validate baseline 影響**：+1 C4 warning + (R6 / R7 / R8 / R9 / R14 / R12 / R13 視 entry 形狀而定，至少 0..3 條)；預期 baseline 67/57 → 70/58 ~ 71/58；**會 drift**。
- **是否需改 loader / validator harness**：**否**（loader / validator 自然吃到）。
- **production settings 污染**：✅ **有**（直接修改 production registry）。
- **裁決**：❌ **reject**（與 R1-clean / am-2 Option D 之共同前提衝突；屬 §4.2 違反項）。

### 5.2 Option B — test-only registry / mocking seam

- **內容**：在 `src/scripts/load-settings.js` 加入「fixture-mode」code path，允許 `validate-content.js` 在 test/fixture 模式下注入 mock commerce registry；fixture post 內可宣告 `__fixture_registry__` block 暫時 override `settings.commerceLinks`。
- **mutation surface**：loader source change + validator signature change（新增 fixture-mode 參數）+ 1 fixture post。
- **rollback**：須 revert loader + validator + fixture；rollback 牽動 build / dev 路徑。
- **真實 affiliate URL 風險**：✅ **無**（mock registry 純記憶體 / 純 fixture-scoped）。
- **validate baseline 影響**：+1 C4 warning；無 registry-level drift（mock 只在 fixture 後處理時注入）。
- **是否需改 loader / validator harness**：✅ **是**（新 code path；新 test seam；CLAUDE.md §1「不過度工程化」+ §29「第一版未規劃 test 框架」之風險）。
- **production settings 污染**：❌ **無**。
- **裁決**：⚠️ **defer**（屬未來 fixture-phase 之 candidate；本 phase **不**啟動；與 am-2 對 Option B 之 reject 結論一致 —— 不為「單條 rule」引入新 harness）。

### 5.3 Option C — deferred until real registry seed phase

- **內容**：等到 user 明確授權 commerce registry 開始有真實 entry（例如 user 開始實際使用 commerce affiliate link 並導入第一批 active entries）時，順勢 land 一筆 `active: false` entry 作為「真正待 deprecated 之 link」+ C4 source；fixture 為「實際 deprecated 之 link」之自然觀察點。
- **mutation surface**：等 user 動作；本 phase 0 mutation。
- **rollback**：N/A（無 mutation）。
- **真實 affiliate URL 風險**：✅ **無**（不在本 phase 處理）。
- **validate baseline 影響**：0（本 phase）；future phase = 由 user 實際 commerce 內容驅動。
- **是否需改 loader / validator harness**：❌ **無**（本 phase）。
- **production settings 污染**：❌ **無**。
- **裁決**：✅ **recommend as long-term path**（與 commerce registry empty + 0 ref + renderer/Admin/build/deploy/Blogger repost/GA4 全部 dormant 之現況一致）。

### 5.4 Option D — docs-only contract freeze, no source yet（**本 phase**）

- **內容**：本 phase（am-2）就是 Option D 之執行：凍結 C4 rule contract / cascade / message shape / red-line；不 implement source；不新增 fixture；不 seed registry。
- **mutation surface**：1 docs file。
- **rollback**：刪除 docs file 即可，無源碼 / 內容 / 設定影響。
- **真實 affiliate URL 風險**：✅ **無**。
- **validate baseline 影響**：✅ **0**（68/58 不變）。
- **是否需改 loader / validator harness**：❌ **無**。
- **production settings 污染**：❌ **無**。
- **裁決**：✅ **本 phase 採行**。

### 5.5 四條路徑對照表

| 維度 | Option A | Option B | Option C | Option D |
| --- | --- | --- | --- | --- |
| production settings mutation | ✅ 有 | ❌ 無 | ❌ 無 | ❌ 無 |
| loader / validator source change | ❌ 無 | ✅ 有 | ❌ 無 | ❌ 無 |
| 真實 affiliate URL 風險 | ⚠️ 可能 | ❌ 無 | ❌ 無 | ❌ 無 |
| validate baseline 影響 | drift +1..+5 | drift +1 | 0 | 0 |
| rollback 複雜度 | 中 | 高 | 0 | 極低 |
| 紅線觸碰 | R1-clean / am-2 | CLAUDE.md §1 / §29 | 0 | 0 |
| 推薦 | ❌ reject | ⚠️ defer | ✅ long-term | ✅ **本 phase** |

---

## 6. Recommended C4 Implementation Path

### 6.1 本 phase 結論

> **本 phase 採 Option D（docs-only contract freeze）；不 implement C4 source；不新增 fixture；不 seed registry。**

### 6.2 C4 source 啟動之前置條件

C4 source 之啟動須**至少滿足下列其一**：

1. **registry 已有 user-authorized 真實 entry**（Option C 自然觸發點）：即使該 entry 為 `active: true`，至少 registry 不再為 empty `[]`，且當 user 為下架某條 affiliate link 而新增 `active: false` entry 時，C4 source 之 fixture 為自然觀察點。
2. **settings-level fixture loader 機制 landed**（Option A escape hatch 啟用）：am-2 凍結之 `content/validation-fixtures/settings/commerce-links/_test-<rule-id>.json` path naming convention 須先在獨立 phase 啟用 loader 改造 + sourcePath 改寫 + 雙模 loader code path；屆時 C4 fixture 為純 settings-level fixture，不污染 production registry。
3. **user 明確授權 mock harness**（Option B）：CLAUDE.md §1 / §29 之「不過度工程化 / 第一版未規劃 test 框架」紅線須 user 明確 waive；本 phase **不**主動推薦此路徑。

三者皆**獨立於 C4 source phase**；本 phase **不**裁決三者啟用順序。

### 6.3 C4 source 落地時之最小變動範圍（**未來**；本 phase 不做）

未來 C4 source phase 啟動時，預期變動：

- `src/scripts/validate-content.js`：
  - 在 `validateCommerceRefs` per-entry loop 內、C3 not-found 檢查 **之後**、C5 / C6 檢查 **之前**，加入 C4 inactive 檢查；
  - 需 access 「ref → entry」mapping（目前僅 `commerceLinkIdSet`；需擴展為 `commerceLinkIdMap` 或新增 `buildCommerceLinkEntryMap` helper）；
  - 新 helper signature 候選：`buildCommerceLinkEntryMap(commerceLinks): Map<linkId, entry> | null`（mirror `buildCommerceLinkIdSet` 之 null fallback / case-sensitive trim 語意）；
  - `validateCommerceRefs` signature 候選：擴增第 5 個參數 `commerceLinkEntryMap`，或將既有 `commerceLinkIdSet` 改為 `commerceLinkLookup`（內含 set + map）。
- **不**改 loader（`load-settings.js` 既有 `settings.commerceLinks` exposure 已足夠）。
- **不**改 production registry。
- **不**改 CLAUDE.md（除非啟用 Option A escape hatch，屆時須同步 §3 commerce 區塊狀態描述）。

### 6.4 本 phase 之具體建議

> **本階段結束後**，下一階段應為 **read-only acceptance cross-check**（驗證本 doc 內 §3 / §4 / §5 之凍結項與既有 commerce content-reference source / fixture / registry state 一致）**或 Final Idle Freeze**（將 commerce 系統當前 landed 範圍視為一個 stable mile，留待 user 明確授權後再推進）。**不**建議在無 registry seed 政策、無 fixture mechanism 解法下直接 land C4 source。

---

## 7. Rule Ordering / Interaction

### 7.1 C4 在 cascade 中之位置

C4 必須位於 C3 之後（trigger 條件「ref 命中 registry」要求 C3 not-found 已被排除）。在 C5 duplicate / C6 coexistence 之**前**或**後**皆可（C5 / C6 與 C4 為 orthogonal）；建議與 `20260604-commerce-links-content-reference-validation-preanalysis.md` §5.9 之原始 cascade 一致：

```
C1 (invalid type)
└─ skip C2..C9 for that entry
C2 (empty trim)
└─ skip C3..C9 for that entry
C3 / C4 (not-found / inactive) — mutually exclusive
C5 (duplicate-in-post) — orthogonal（與 C3 / C4 共存）
C6 (ref + url coexist) — orthogonal（與 C3 / C4 / C5 共存）
C7 / C8 (role missing / invalid) — orthogonal；C7 / C8 互斥（C7 未啟用）
C9 (display override risk) — orthogonal
```

### 7.2 與既有 source 之 cascade 對照

當前 `validateCommerceRefs` 之 per-entry loop 順序：

1. C1（typeof check + continue）
2. C2（trim empty + continue）
3. C3（lookup not in set + push warning，**不** continue）
4. C6（entry.url non-empty + push warning，**不** continue）

C5 在 per-entry loop 之**後**獨立做一次 intra-post duplicate 掃描。

未來 C4 land 時，建議插入點：在 C3 之後、C6 之前；具體實作為：

```
if commerceLinkIdSet !== null && commerceLinkIdSet.has(trimmed):
    entry_from_registry = commerceLinkEntryMap.get(trimmed)
    if entry_from_registry && entry_from_registry.active === false:
        push C4 warning（含 replacement linkId 若有）
elif commerceLinkIdSet !== null && !commerceLinkIdSet.has(trimmed):
    push C3 warning（既有）
```

→ 邏輯保持 C3 / C4 互斥（同一 ref 不可能同時觸發）；C5 / C6 不受影響。

### 7.3 registry usable gate 之 C4 套用

- `commerceLinkIdSet === null`（registry shape invalid）→ skip C3 **與** C4（避免 cascade noise；mirror 既有 C3 gate）。
- `commerceLinkEntryMap === null` 同 `commerceLinkIdSet === null`（一致 gate）。

### 7.4 與 registry-level R14 之語意分工

| 層 | rule | 檢查對象 | sourcePath |
| --- | --- | --- | --- |
| registry-level | R14 `commerce-link-inactive-missing-replacement` | `commerce-links.json` 內 `active === false` entry 是否補 `replacementTarget` | `content/settings/commerce-links.json` |
| content-reference | C4 `commerce-ref-inactive` | post `affiliate.links[i].ref` 是否指向 inactive entry | post `.md` 路徑 |

→ 兩者 orthogonal；可同時觸發；不互相 suppress；rollback / disable 之路徑亦獨立。

---

## 8. Expected Validation Impact

### 8.1 本 phase 之 baseline 預期

```
本 phase 後 npm run validate:content：
  0 errors / 68 warnings / 58 posts（與 phase 開始時一致；無 drift）
```

理由：

- 本 phase 僅新增 1 份 docs file；
- `src/scripts/validate-content.js` 未動；
- `content/settings/commerce-links.json` 未動；
- `content/validation-fixtures/**` 未動；
- production content 未動。

### 8.2 未來 C4 source / fixture phase 之 baseline 預期（**參考**；不本 phase 處理）

- 若採 Option C（real registry seed）路徑：baseline 變動由 user commerce 內容驅動，無法在本 phase 預估。
- 若採 Option A（settings-level fixture loader）路徑：baseline 預期 +1 C4 warning + 0..3 條 registry-level connected warnings；具體數字待 Option A loader landed 後實測。
- 若採 Option B（mock harness）路徑：baseline 預期 +1 C4 warning；無 registry-level drift。

→ 本 phase **不** commit 任一路徑；不寫死預估。

### 8.3 與既有 content-reference rules 之 baseline 對照

| rule | source landed | fixture landed | production trigger | baseline 影響 |
| --- | --- | --- | --- | --- |
| C1 invalid-type | ✅ | ✅ | 0 | +1 warning（fixture）|
| C2 empty | ✅ | ✅ | 0 | +1 warning（fixture）|
| C3 not-found | ✅ | ✅ | 0 | +1 warning（fixture）+ orthogonal cascade（C5 / C6 fixture 帶入額外）|
| C5 duplicate-in-post | ✅ | ✅ | 0 | +1 + 2× C3 cascade（orthogonal）|
| C6 ref+url coexist | ✅ | ✅ | 0 | +1 + 1× C3 cascade（orthogonal）|
| **C4 inactive** | ❌ | ❌ | 0 | **本 phase = 0；未來路徑 TBD** |
| C7 / C8 / C9 | ❌ | ❌ | 0 | 0（unrelated；defer/long-tail） |

---

## 9. Explicit Non-goals

本 phase **明確 NOT do**：

- ❌ **no source implementation**：`src/scripts/validate-content.js` 與其他 src/** 完全不動。
- ❌ **no fixture**：`content/validation-fixtures/**` 不新增 / 不修改。
- ❌ **no registry seed**：`content/settings/commerce-links.json` 不新增 entry；維持 `commerceLinks: []`。
- ❌ **no production migration**：production posts 不新增 / 不修改 commerce frontmatter；不新增 ref；不移除 url。
- ❌ **no renderer fallback**：commerce renderer 維持 dormant（per night-9 contract 凍結但 source 未 land）。
- ❌ **no Admin picker / Admin Apply**：commerce Admin selector / display 不啟用；middleware write / admin-write-cli 維持 dormant。
- ❌ **no build / deploy / Blogger repost / GA4**：`npm run build*` / `gh-pages` deploy / Blogger 後台重貼 / GA4 commerce event 全部 dormant。
- ❌ **no reverse UTM activation**：Blogger → GitHub reverse UTM 維持 source landed but un-deployed（pm-24 狀態）。
- ❌ **no pm-26 unblock**：reverse UTM fixture / deploy gate 維持 BLOCKED。
- ❌ **no `npm install`**：package / lockfile 不動。
- ❌ **no CLAUDE.md mutation**：CLAUDE.md 不改；本 phase 不 sync state。
- ❌ **no template change**：`content/templates/**` 不動。
- ❌ **no real affiliate URL / merchant token / OAuth secret / tracking id**：不放任一真實商業連結 / 帳號 / 結算密碼。

---

## 10. Candidate Next Phases

本 phase 結束後，候選下一階段（**僅列出；不執行**）：

### 10.1 Candidate A — C4 preanalysis acceptance read-only（docs-only；可省略）

| 範圍 | 對本 doc 內 §3 / §4 / §5 / §7 凍結項做 read-only cross-check：核對既有 `validate-content.js` cascade、`buildCommerceLinkIdSet` signature、registry R14 與 C4 之 orthogonal 語意；不改任一檔案 |
| --- | --- |
| 目標 | 確認 cross-reference 與既有 source / docs 一致；驗證 rule id `commerce-ref-inactive` 與 cascade 排序與 §5.9 chain 對齊 |
| baseline | 不變 |
| 紅線 | 全部 enforced |

### 10.2 Candidate B — Final Idle Freeze（不寫檔；單一 EXIT report）

| 範圍 | 將 commerce 系統當前 landed 範圍（registry-level R3..R14、content-reference C1 / C2 / C3 / C5 / C6、5 個 post-level fixture、loader exposure、empty registry、R14 / C4 / C7 / C8 / C9 deferred）視為 stable mile；本 session 不再寫檔；留待 user 明確授權後啟動下一輪 |
| --- | --- |
| 目標 | 鎖定 baseline；讓 commerce 系統與 reverse UTM 同處 dormant 狀態 |
| baseline | 不變 |
| 紅線 | 全部 enforced |

### 10.3 Candidate C — commerce registry seed policy preanalysis（docs-only）

| 範圍 | 規劃 commerce registry 何時 / 由誰 / 如何 seed 第一批真實 entry；包含 `active: false` deprecation flow；與 affiliate-networks registry / canonical merchant key 之關聯；governance 紅線細項 |
| --- | --- |
| 目標 | 為 C4 source phase 解開 §6.2 之前置條件（1）|
| baseline | 不變 |
| 紅線 | 全部 enforced |

### 10.4 Candidate D — settings-level fixture loader Option A 啟用 preanalysis（docs-only）

| 範圍 | 規劃 am-2 凍結之 Option A path naming convention（`content/validation-fixtures/settings/commerce-links/_test-<rule-id>.json`）之 loader 改造；雙模 loader code path；sourcePath 改寫；rollback path |
| --- | --- |
| 目標 | 為 C4 source phase 解開 §6.2 之前置條件（2）|
| baseline | 不變 |
| 紅線 | 全部 enforced |

### 10.5 Candidate E — renderer fallback source preflight（docs-only → source-only）

| 範圍 | 凍結 night-9 commerce renderer fallback contract 之 helper 命名 / call site / parameter shape；隨後 source-only land renderer fallback（lookup ref → registry → fallback url）|
| --- | --- |
| 目標 | 為「ref 有實際渲染意義」鋪路；間接降低 C4 dead-source 風險（未來 C4 land 後若有 production ref + inactive entry，至少 renderer 可走 replacement / fallback 路徑）|
| baseline | 不變（preflight docs）/ 可能變動（source landing）|
| 紅線 | 全部 enforced |

### 10.6 明確不建議

- ❌ **不建議**直接 implement C4 source 而無 fixture：dead source 無法測試，無法 acceptance。
- ❌ **不建議**為 C4 fixture 直接 seed production `commerce-links.json`：違反 R1-clean / am-2 Option D 鎖定。
- ❌ **不建議**為 C4 fixture 引入 mock harness：違反 CLAUDE.md §1 / §29，且為單條 rule 引入新 test seam 屬過度工程化。
- ❌ **不建議**在 C4 之前先 land C7 / C8 / C9：C7 / C8 / C9 與 C4 同屬 coupling Option A 範疇，且 C8 enum 凍結 / C9 internalLabel 漏出風險高，不應與 C4 並行。

---

## 11. Final Recommendation

### 11.1 本階段 single conclusion

> **本 phase 為 docs-only contract freeze（Option D）；C4 source 不在本階段 implement；下一階段應為 read-only acceptance cross-check 或 Final Idle Freeze。**

### 11.2 本階段結束後預設狀態

- HEAD 前進 1 commit（`docs(commerce): plan C4 inactive ref validation`）。
- working tree clean；ahead/behind = 0/0（push 後）。
- `npm run validate:content` 維持 **0 errors / 68 warnings / 58 posts**。
- commerce content-reference source / fixtures landed 範圍不變（C1 / C2 / C3 / C5 / C6）。
- commerce registry 維持 empty `[]`。
- C4 / C7 / C8 / C9 source 與 fixture 仍未 implement。
- renderer / Admin / build / deploy / Blogger repost / GA4 / reverse UTM activation / pm-26 全部 dormant / BLOCKED。

### 11.3 不自動推進下一階段

- ❌ 本 phase 結束後**不**自動啟動 acceptance cross-check / Final Idle Freeze / registry seed preanalysis / Option A loader preanalysis / renderer source preflight。
- 必須等待 user 明確授權；候選下一階段詳見 §10。

---

## Appendix A — Cross-reference index

| 主題 | 文件 / commit |
| --- | --- |
| commerce empty registry decision | `docs/20260603-commerce-affiliate-link-empty-registry-preanalysis.md` |
| commerce registry schema decision | `docs/20260603-commerce-affiliate-link-registry-schema-decision.md` |
| commerce registry-level validator preanalysis | `docs/20260603-commerce-links-validator-preanalysis.md` |
| commerce registry-level validator landing | commit `94a1d47` |
| commerce settings fixture mechanism decision | `docs/20260604-commerce-links-registry-fixture-mechanism-preanalysis.md` + commit `89cbf75` |
| commerce content-reference validation preanalysis（C1..C9 contract）| `docs/20260604-commerce-links-content-reference-validation-preanalysis.md` |
| commerce content-reference source landing（C1 / C2 / C3 / C5）| commit `39b89e3` |
| commerce content-reference fixtures landing（C1 / C2 / C3 / C5）| commit `149efdc` |
| commerce renderer fallback contract preanalysis | `docs/20260607-commerce-renderer-fallback-contract-preanalysis.md` |
| commerce C6 preanalysis | `docs/20260607-commerce-c6-coexistence-warning-preanalysis.md` |
| commerce C6 source landing | commit `281cd43` |
| commerce C6 fixture landing | commit `3aeabbc` |
| CLAUDE.md commerce 區塊 | `CLAUDE.md` §3 commerce-links 段落 |

---

## Appendix B — Baseline snapshot

```
date: 2026-06-08 07:37 +0800
branch: main
HEAD: e17379d6a2d646069ed4487ee185c8bbec6c8bd4
origin/main: e17379d6a2d646069ed4487ee185c8bbec6c8bd4
ahead/behind: 0/0
working tree: clean
latest subject: docs(claude): sync commerce C6 fixture state
validate: 0 errors / 68 warnings / 58 posts

commerce content-reference rules landed: C1 / C2 / C3 / C5 / C6
commerce content-reference rules deferred: C4 / C7 / C8 / C9
commerce content-reference fixtures landed: 5（C1 / C2 / C3 / C5 / C6）
commerce registry: empty []
commerce production ref usage: 0
commerce production ref+url coexist: 0
commerce renderer / Admin / build / deploy / Blogger repost / GA4: dormant
reverse UTM activation: dormant（pm-24 source landed; un-deployed）
pm-26: BLOCKED
```

---

## Appendix C — C4 rule contract quick card

```
rule id:        commerce-ref-inactive
severity:       warning
sourcePath:     post .md path
trigger:        affiliate.links[i].ref 為 trimmed non-empty string
                && ref 命中 commerceLinks registry
                && registry 內對應 entry active === false
message:        affiliate.links[<i>].ref="<ref>" matched but entry is inactive
                [+ (replacement="<replacementLinkId>")]
cascade:        在 C1 / C2 通過後檢查；與 C3 互斥；與 C5 / C6 orthogonal
registry gate:  commerceLinkIdSet === null → skip C4（同 C3）
empty registry: 0 觸發
0 ref / 0 inactive entry: 0 觸發
fallback:       不自動 fallback；不自動移除 ref；不 codemod migration
production:     不修改任一 production post；warning-only
governance:     不洩漏 entry targetUrl；replacement 僅暴露 linkId
status:         contract frozen（docs-only）；source not implemented
blocker:        registry seed policy 或 settings-level fixture loader 須先解
```
