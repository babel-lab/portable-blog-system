# 2026-06-08 Commerce C4 / C9 Overlay Fixture Plan — L6 (docs-only)

Phase name: `20260608-pm-overlay-fixture-plan-docs-only-a`
Date: 2026-06-08 14:05 +0800
Mode: **docs-only L6 fixture-phase plan**（no overlay JSON / no fixture mutation / no source change / no registry change / no memory update / no production migration / no seed / no build / no deploy / no Blogger repost / no GA4 validation / no reverse UTM activation / no pm-26 unblock / no Admin Apply / middleware / admin-write-cli / no C7 source / no Admin selector / no download renderer / landing implementation / no amend / rebase / force-push / no real affiliate URL / download URL / tracking id / sid / aff_id / merchant id / token / credential / Google Form id / respondent data / private download link / commission-sensitive data）

本檔正式凍結 **C4 `commerce-ref-inactive` + C9 `commerce-ref-display-override-risk`** 之 **L6 overlay fixture / smoke** implementation 策略。本輪**只寫文件**：不新增 overlay JSON、不修改 fixture、不改 source、不改 registry、不更新 memory。實作（建立 overlay 檔 + 改 fixture）留待**獨立、user 明確授權**之後續 phase（L6b）。

---

## 1. Executive Summary

### 1.1 本輪性質宣告

> **本輪為 docs-only L6 fixture-phase plan。** 唯一輸出為本檔。不新增 overlay JSON、不改 fixture、不改 source、不改 registry、不 seed、不 production migration、不更新 memory / auto-memory；不改 src / content / settings / templates / views / package / lockfile / dist / gh-pages / .cache / CLAUDE.md。

### 1.2 一句話結論

> **建議 L6 採 Option C：重用既有 `_test-commerce-ref-not-found.md`、未來只加一行 inert `labelOverride`、未來才新增單一 overlay JSON（`content/validation-fixtures/settings/commerce-c4-c9-overlay.json`，省略 `networkKey` 以避免 R11 overlay noise），藉此在 `--registry-overlay` 模式下同時證明 C4 `commerce-ref-inactive` 與 C9 `commerce-ref-display-override-risk` fire，同時維持 normal validate baseline `0 errors / 69 warnings / 59 posts` 不漂移、overlay validate 為 `0 errors / 70 warnings / 59 posts`（net +1）。本輪不實作；下一輪先 read-only acceptance（L6a），再下一輪才 implementation（L6b）。**

### 1.3 為何是 Option C

- **最小 mutation surface**：未來只動 2 個檔（新增 1 overlay JSON + 既有 fixture 加 1 行 `labelOverride`）；不新增 post fixture、不改 source、不改 production registry。
- **normal baseline 不漂移**：reused fixture 在 normal（registry empty）下仍只 fire C3（既有 baseline 之一），新增之 `labelOverride` 在 registry empty 下 inert（無 registry entry → C9 不可能命中）→ normal 維持 0/69/59。
- **overlay 下同一 ref 被 overlay registry 命中**：C3 not-found 轉為 registry-hit → C3 消失（-1），entry `active === false` → C4 fire（+1），entry `internalLabel` == post `labelOverride` → C9 fire（+1）→ net +1 → overlay = 0/70/59。
- **單一 overlay entry 同時觸發 C4 + C9**：reused fixture 之單一 ref / 單一 `labelOverride` 對應 overlay 內單一「inactive + internalLabel」entry → 一條 entry 證兩條 rule，最少欄位、最易 acceptance。

---

## 2. Current Accepted Baseline

```
repo:            D:\github\blog-new\portable-blog-system
branch:          main
HEAD:            de3134f
origin/main:     de3134f
ahead/behind:    0/0
working tree:    clean
latest subject:  feat(validate): warn on inactive and internal-label commerce refs
validate:        0 errors / 69 warnings / 59 posts
```

- ✅ **C4 / C9 source live but dormant**（commit `de3134f`）：`validateCommerceRefs` 已 land C4 `commerce-ref-inactive` + C9 `commerce-ref-display-override-risk`（registry-coupled；共用 `buildCommerceLinkEntryMap`；warning-only；`src/scripts/validate-content.js:747`（C4）/ `:776`（C9））。registry empty + 0 production ref → **0 觸發**。
- ✅ **overlay infrastructure ready**（commit `8ffd497`，pm-9）：`--registry-overlay <path>` flag + `parseRegistryOverlayArg` + `resolveOverlayPathSafe`（限 `content/validation-fixtures/settings/**`，拒網路 / UNC / `..` / production settings / repo 外）+ `loadValidationOverlay`（read + parse + shape-extract；replace semantics）+ npm script `validate:content:overlay`（`src/scripts/validate-content.js:1859`–`1960`；`package.json:20`）。無 flag → overlay-blind → baseline byte-identical。
- ✅ **registry empty**：`content/settings/commerce-links.json` = `{ schemaVersion:1, updatedAt:"", commerceLinks:[], notes:"" }`。
- ❌ **no overlay file yet**：`content/validation-fixtures/settings/**` 尚無任何 `_test-*.json` / overlay 檔。
- ❌ **no fixture proof yet**：C4 / C9 至今 **0 fixture proof**（無 post 含 inactive ref；無 post 含 `labelOverride` == registry `internalLabel`）。

---

## 3. Problem Statement

- **C4 / C9 需要 registry entry 才能觸發**：
  - C4 需 ref 命中 registry **且** entry `active === false`。
  - C9 需 ref 命中 registry **且** entry `internalLabel` 非空 **且** post `labelOverride` == entry `internalLabel`。
  - 兩者皆 registry-coupled → registry empty 下不可能 fire。
- **production registry empty**：commerce-links registry 維持 `[]`（R1-clean）；0 production ref。
- **若新增 ref-bearing dedicated fixture，normal validate 會新增 C3 not-found noise**：任何「帶 ref 但 registry 無對應 entry」之新 fixture，在 normal（registry empty）下必 fire C3 → baseline +1 → 漂移。
- **L6 要同時達成（互相張力）**：
  1. overlay mode 證明 C4 + C9 fire；
  2. normal baseline 不新增 noise（維持 0/69/59）；
  3. 不 seed production registry（維持 `[]`）；
  4. 不使用真實商業資料（無真實 affiliate URL / merchant / token / tracking / Form / respondent / commission）。
- **張力解法**：把「ref → registry entry」之 registry 端放進 **overlay**（fixture-scoped，僅 `--registry-overlay` 顯式讀取），而非 production registry；並**重用**一個已在 normal baseline 內 fire C3 的既有 fixture，使其在 overlay 下 ref 被命中 → C3 swap 成 C4 + C9，normal 端不新增 post count、不新增 net warning。

---

## 4. Fixture Inventory Summary

現有 commerce content-reference fixtures（`content/validation-fixtures/blogger/posts/`）：

| fixture | 觸發 rule |
| --- | --- |
| `_test-commerce-ref-invalid-type.md` | C1 `commerce-ref-invalid-type` |
| `_test-commerce-ref-empty.md` | C2 `commerce-ref-empty` |
| `_test-commerce-ref-not-found.md` | C3 `commerce-ref-not-found`（**本計畫重用對象**）|
| `_test-commerce-ref-duplicate.md` | C5 `commerce-ref-duplicate-in-post` + C3（orthogonal cascade）|
| `_test-commerce-ref-direct-url-coexist.md` | C6 `commerce-ref-direct-url-coexist` + C3（orthogonal cascade）|
| `_test-commerce-invalid-role.md` | C8 `commerce-ref-invalid-role` |

明確記錄：

- ❌ **目前沒有任何 fixture 含 `labelOverride`**（C9 之 post 端觸發欄位至今 0 使用）。
- ❌ **C4 / C9 目前無 fixture proof**（無 inactive-ref fixture；無 labelOverride-equality fixture）。
- ✅ `_test-commerce-ref-not-found.md` 現況：`affiliate.links: [{ ref: "__nonexistent-commerce-ref__" }]`；ref 為 fixture-namespaced 雙底線保留 string；registry empty → C3 fire；單 entry → 不觸發 C5；無 url → 不觸發 C6。預期 +1 warning（C3），屬 69 baseline 之一。

---

## 5. Options Compared

| 維度 | A：overlay + 2 dedicated fixtures | B：overlay + 重用 not-found / duplicate ref（不加 labelOverride）| **C：overlay + 既有 not-found fixture 加 inert labelOverride** | D：只新增 overlay JSON，不改 post fixture | E：overlay + single combined dedicated fixture |
| --- | --- | --- | --- | --- | --- |
| normal validate drift | ⚠️ +2（2 新 fixture 各 fire C3）| 0（重用既有 C3 fixture）| **0（重用既有 C3 fixture；labelOverride 在 empty registry inert）** | 0（無新 post）| ⚠️ +1（新 combined fixture fire C3）|
| overlay 能否證明 C4 | ✅ | ✅ | ✅ | ❌（無 post ref 命中 → 無 content-side 觸發）| ✅ |
| overlay 能否證明 C9 | ✅ | ❌（無 `labelOverride` → C9 不可能 fire）| ✅（labelOverride == overlay internalLabel）| ❌ | ✅ |
| 是否引入 C3 noise（normal）| ⚠️ 是（+2）| 否 | **否** | 否 | ⚠️ 是（+1）|
| 是否修改既有 fixture | 否（新增 2 檔）| 否 | **是（既有 fixture +1 行 labelOverride）** | 否 | 否（新增 1 檔）|
| warning delta 是否可預測 | 中（2 fixture × cascade）| 部分（無 C9）| **高（精確 net +1）** | 低（overlay registry-level only；無 content proof）| 中 |
| acceptance 難度 | 中（2 新檔 + overlay）| 低但**不完整**（缺 C9）| **低且完整（2 檔；C4+C9 皆證）** | 低但**不證 content rule** | 中 |

裁決：

- **A** → ⚠️ 可行但 normal drift +2、檔案最多、acceptance surface 最大；非最小。
- **B** → ❌ 無 `labelOverride` → **無法證 C9**；不完整。
- **C** → ✅ **推薦**：normal 0 drift、C4 + C9 皆證、mutation 最小（2 檔，其一只加 1 行）、warning delta 精確可預測（net +1）。
- **D** → ❌ overlay 只改 registry data，無 post ref 命中 → C4 / C9 為 **content-reference rule（掃 post `affiliate.links[].ref`）**，無 post 觸發 → 不證 content rule；僅可能觸發 registry-level rule，不符 L6「證 C4 / C9」目標。
- **E** → ⚠️ 可行（single combined dedicated fixture 同時帶 ref + labelOverride）但 normal drift +1（新 fixture fire C3）；劣於 C（C 重用既有 fixture → 0 drift）。

---

## 6. Recommended Option C

### 6.1 機制

1. **重用** `content/validation-fixtures/blogger/posts/_test-commerce-ref-not-found.md`（既有 C3 fixture）。
2. **未來只加一行 inert `labelOverride`** 至其 `affiliate.links[0]`（值 = overlay entry 之 `internalLabel`，fixture-namespaced placeholder）。
3. **未來新增單一 overlay JSON** `content/validation-fixtures/settings/commerce-c4-c9-overlay.json`，其 `commerceLinks` 含一筆「inactive + internalLabel」entry（`linkId` == fixture 之 ref `__nonexistent-commerce-ref__`）+ 一筆 active replacement entry。

### 6.2 normal validate（無 flag）行為

- registry empty → `commerceLinkEntryMap` 空 → reused fixture 之 ref `__nonexistent-commerce-ref__` 不命中 → fire **C3 not-found**（既有 baseline 之一）。
- 新增之 `labelOverride` 為 **inert**：C9 需 ref 命中 registry entry 且該 entry 有 `internalLabel`；registry empty → ref 不命中 → C9 **不可能** fire。C4 同理不 fire。
- → **normal validate 維持 `0 errors / 69 warnings / 59 posts`**（post count 不變；net warning 不變）。

### 6.3 overlay validate（`--registry-overlay <overlay JSON>`）行為

- overlay replace → `settings.commerceLinks` = overlay 之 2 筆 entry。
- reused fixture 之 ref `__nonexistent-commerce-ref__` **命中** overlay entry A：
  - C3 not-found **不再** fire（ref 已命中）→ **-1**。
  - entry A `active === false` → **C4 `commerce-ref-inactive` fire**（含「a replacement target is configured」）→ **+1**。
  - post `labelOverride` == entry A `internalLabel`（非空 exact）→ **C9 `commerce-ref-display-override-risk` fire** → **+1**。
- overlay 之 2 筆 entry **本身須 0 registry-level warning**（§7.3 設計）→ 不引入額外 delta。
- → net = 69 − 1 + 1 + 1 = **70** → **overlay validate `0 errors / 70 warnings / 59 posts`**。

### 6.4 為何這是最小、最乾淨、最容易 acceptance 的方案

- **最小**：未來只 2 檔變動（新增 1 overlay JSON + 既有 fixture +1 行）；無新 post fixture、無 source change、無 package change、無 production registry change。
- **最乾淨**：normal baseline 0 drift（reused fixture 之 C3 本就在 69 內；labelOverride inert）；overlay delta 精確 net +1（C3 swap C4 + C9）。
- **最易 acceptance**：commit scope 可一眼核對（`A` overlay JSON + `M` fixture）；warning 數字精確可預測（normal 69 / overlay 70）；單一 overlay entry 同證 C4 + C9。

---

## 7. Overlay File Plan

⚠️ **本輪不建立 overlay 檔；以下為未來 implementation（L6b）之 shape 凍結。**

### 7.1 落點與 path guard

- 建議路徑：`content/validation-fixtures/settings/commerce-c4-c9-overlay.json`。
- path guard 是否通過：✅ 落在 `content/validation-fixtures/settings/**` 子樹 → `resolveOverlayPathSafe`（`src/scripts/validate-content.js:1878`）通過（非 production settings / 非網路 / 非 `..` / 非 repo 外）。
- overlay 檔**只放 `commerceLinks`**；**不放** `downloadAssets` / `downloadForms`（避免無謂 replace download registry；L6 只測 commerce C4 / C9）。

### 7.2 安全與命名

- overlay entries 使用 fixture-namespaced placeholder IDs（`sample-*`），**唯一例外**見 §7.4：C4 / C9 trigger entry 之 `linkId` 必須等於 reused fixture 既有 ref `__nonexistent-commerce-ref__`（雙底線保留 namespace；本身即 fixture-namespaced placeholder，非真實 merchant key）。
- URL 如必須存在，**只用** `https://example.invalid/...`（RFC 2606 reserved，不可達）。
- **省略 `networkKey`**：R11 `commerce-link-invalid-network-key` 僅在 networkKey 為非空 string 時對照 `affiliate-networks.json`（`src/scripts/validate-content.js:537`–`550`）；省略 networkKey → R11 skip → 不引入 overlay registry-level noise。
- **不**使用真實 affiliate network / merchant / token / tracking / commission / Google Form / respondent data。

### 7.3 overlay 至少包含哪些 entry（且須 0 registry-level warning）

為使 overlay validate 精確落在 70（overlay 自身 0 registry-level warning），每筆 entry 須通過全部 11 條 registry-level rule。最小組合 = 2 筆：

**Entry A — inactive + internalLabel（同時供 C4 + C9）：**

| 欄位 | 值（藍本）| 滿足 |
| --- | --- | --- |
| `linkId` | `__nonexistent-commerce-ref__`（== reused fixture ref）| R4 / R5 |
| `active` | `false` | **C4 trigger** |
| `replacementTarget` | `sample-commerce-c4c9-active`（指向 Entry B）| R12 / R13 / R14 |
| `internalLabel` | `sample-internal-c4c9`（非空；== fixture `labelOverride`）| R8 / R9；**C9 trigger** |
| `targetUrl` | `https://example.invalid/c4c9-inactive` | R6 / R7 |
| `networkKey` | **省略** | R11 skip |

**Entry B — active replacement（供 Entry A 之 replacementTarget；避免 R12 / R14）：**

| 欄位 | 值（藍本）| 滿足 |
| --- | --- | --- |
| `linkId` | `sample-commerce-c4c9-active` | R4 / R5 |
| `active` | `true` | R14 n/a |
| `internalLabel` | `sample-internal-active`（非空）| R8 / R9 |
| `targetUrl` | `https://example.invalid/c4c9-active` | R6 / R7 |
| `networkKey` | **省略** | R11 skip |

- 外層採 registry wrapper：`{ "schemaVersion": 0, "updatedAt": "", "commerceLinks": [ EntryA, EntryB ], "notes": "..." }`（`loadValidationOverlay` 取 `.commerceLinks`；`schemaVersion: 0` 作「非 production」人類防呆信號）。
- 建議含 `$comment`（陣列）自述「overlay-only test fixture；僅由 `--registry-overlay` 讀取；不得加入 loader 白名單；不得複製為 production registry；placeholder only」。
- **明確說明**：上述 overlay JSON **future implementation（L6b）才新增**；本輪不建立。

### 7.4 linkId 與 reused ref 之必然耦合（設計註記）

- C4 / C9 為 **content-reference rule**：掃 post `affiliate.links[].ref`，於 `commerceLinkEntryMap` lookup。
- reused fixture 之 ref 固定為 `__nonexistent-commerce-ref__`（§8 不改 ref）→ overlay entry A 之 `linkId` **必須** == `__nonexistent-commerce-ref__` 才會被命中。
- → entry A 之 linkId **不可**改為 `sample-*`；但 `__nonexistent-commerce-ref__` 本身即 fixture-namespaced 雙底線保留字串（非真實 merchant key / tracking id），符合紅線。其餘 entry（replacement）採 `sample-*`。

---

## 8. Fixture Edit Plan

⚠️ **本輪不改 fixture；以下為未來 implementation（L6b）之編輯凍結。**

- future implementation 才修改：`content/validation-fixtures/blogger/posts/_test-commerce-ref-not-found.md`。
- **只新增一個 inert `labelOverride`** 至 `affiliate.links[0]`：

  ```yaml
  affiliate:
    enabled: true
    disclosure: "（fixture）本文為 validation fixture，無真實聯盟連結。"
    links:
      - ref: "__nonexistent-commerce-ref__"
        labelOverride: "sample-internal-c4c9"   # 未來新增之唯一一行
  ```

- **不改** `title` / `status` / `ref` / `date` / `category` / `tags` / content body 其他欄位。
- `labelOverride` **必須與 overlay entry A 之 `internalLabel` 完全一致**（case-sensitive exact，mirror C5 / C8 / C9 比對語意）。
- **不**把 `label` 當 `labelOverride`（C9 比對的是 `labelOverride` 欄位，非 `label`）。
- **不**新增新的 post fixture（重用既有，維持 normal post count = 59）。
- ⚠️ 註：fixture 內 frontmatter 之 `labelOverride` 值與 overlay 內之 `internalLabel` 值皆為 fixture-namespaced placeholder（`sample-internal-c4c9`），非真實內部識別碼；C9 message 本身不 echo 該值（`src/scripts/validate-content.js:780`），但該 placeholder 字串會出現在兩檔內 → 故須為無意義 namespaced 字串。

---

## 9. Expected Future Validation Commands

未來 L6 implementation（L6b）應跑：

```bash
# 1) normal（無 flag）——必須維持 baseline
npm run validate:content
node src/scripts/validate-content.js

# 2) overlay（顯式 flag）——證 C4 + C9
npm run validate:content:overlay -- --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json
# 等同：
node src/scripts/validate-content.js --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json
```

預期：

| run | 結果 |
| --- | --- |
| normal validate | `0 errors / 69 warnings / 59 posts` |
| overlay validate | `0 errors / 70 warnings / 59 posts` |

delta 拆解（overlay 相對 normal）：

- C4 delta = **+1**（`commerce-ref-inactive`）。
- C9 delta = **+1**（`commerce-ref-display-override-risk`）。
- reused fixture 之 C3 not-found 在 overlay mode 被 registry hit **取代**（ref 命中 → C3 不再 fire）→ **-1**。
- overlay 之 2 筆 entry 本身 0 registry-level warning（§7.3）→ **+0**。
- → 總 warning **只 +1（net）**，不是 +2。

---

## 10. Acceptance Criteria for Future Implementation（L6b）

commit scope 應**只包含**：

```
A  content/validation-fixtures/settings/commerce-c4-c9-overlay.json
M  content/validation-fixtures/blogger/posts/_test-commerce-ref-not-found.md
```

且：

- no source change（`src/**` 不動）。
- no package change（`package.json` / lockfile 不動；`validate:content:overlay` script 已於 pm-9 存在）。
- no production registry change（`content/settings/commerce-links.json` 維持 empty `[]`）。
- no sample JSON change（`content/settings/_sample.*.json` 不動）。
- no docs change unless explicitly requested。
- normal validate stays `0 errors / 69 warnings / 59 posts`。
- overlay validate becomes `0 errors / 70 warnings / 59 posts`。
- overlay warnings include **exactly**：
  - one `commerce-ref-inactive`（C4）。
  - one `commerce-ref-display-override-risk`（C9）。

---

## 11. Safety / Red-line Summary

- **no sensitive value echo / no credential**：overlay / fixture / validator message 皆不含 access / bearer / refresh token / session id / OAuth secret / API key。
- **no Google Form ID / respondent data**：本計畫純 commerce overlay；不碰 download form / respondent。
- **no production registry seed**：commerce-links registry 維持 empty `[]`；overlay 為 fixture-scoped、validate-only、replace-in-memory，不寫回 production。
- **no private URL / no commission-sensitive data**：overlay URL 一律 `https://example.invalid/...`；不含 commission / payout / clickCount。
- **no real affiliate / merchant / tracking**：overlay key 一律 fixture-namespaced（`sample-*` / `__nonexistent-*__`）；不用 URL pattern 推斷 key。
- **warnings must not echo internalLabel / labelOverride / URL / token**：C4 message 不 echo targetUrl（`:755`）；C9 message 不 echo internalLabel / labelOverride（`:780`）；本計畫不改 message shape。
- overlay landed **不**改變 reverse UTM dormant / pm-26 BLOCKED / Admin Apply / middleware / admin-write-cli dormant / build / deploy / Blogger repost / GA4 dormant 之狀態。

---

## 12. Future Phase Ladder

每階須**獨立 user approval**，不得自動跨階：

| 階 | 名稱 | 範圍 | 輸出 |
| --- | --- | --- | --- |
| **L6（本檔）** | overlay fixture plan（docs-only）| 凍結 Option C / overlay shape / fixture edit / 預期 delta / acceptance / 紅線 | 本 docs 檔；0 overlay / 0 fixture / 0 source / baseline 不變 |
| **L6a** | read-only acceptance of this docs-only plan | 核對本檔 §6 / §7 / §9 之 delta 算術與既有 C4 / C9 source（`:747` / `:776`）+ overlay infra（`:1878`–`:1960`）+ registry-level rules（`:467`–`:578`）一致；不寫檔 | acceptance report；baseline 不變 |
| **L6b** | implementation commit using Option C | 新增 `commerce-c4-c9-overlay.json`（2 entry）+ 既有 fixture +1 行 `labelOverride`；驗 normal 69 / overlay 70 | commit（A overlay + M fixture）|
| **L6c** | read-only acceptance of implementation | 核對 commit scope（exactly 2 files）+ normal/overlay 數字 + overlay warnings exactly {C4, C9} + 無敏感值 echo | acceptance report |

> deploy / Blogger repost / GA4 / reverse UTM activation / pm-26 unblock 在任何階皆須 user 另行明確批准。

---

## 13. Final Recommendation

- **建議採 Option C**（重用 `_test-commerce-ref-not-found.md` + inert `labelOverride` + 單一 overlay JSON）。
- **建議下一輪先 read-only acceptance（L6a）**：cross-check 本檔凍結項與既有 source / infra 一致，不寫任何可執行檔。
- **再下一輪才 implementation（L6b）**：在 user 明確授權下建立 overlay JSON + 改 fixture。
- 本輪**不**自動推進 L6a / L6b；不 source / 不建 overlay / 不改 fixture / 不 seed / 不 deploy。

---

## Appendix A — Baseline snapshot

```
date:            2026-06-08 14:05 +0800
repo:            D:\github\blog-new\portable-blog-system
branch:          main
HEAD:            de3134f
origin/main:     de3134f
ahead/behind:    0/0
working tree:    clean
latest subject:  feat(validate): warn on inactive and internal-label commerce refs
validate:        0 errors / 69 warnings / 59 posts

C4 commerce-ref-inactive:               source live (de3134f); registry empty → 0 觸發
C9 commerce-ref-display-override-risk:  source live (de3134f); registry empty → 0 觸發
overlay infrastructure (pm-9, 8ffd497): --registry-overlay flag + loadValidationOverlay + validate:content:overlay script; replace semantics; path guard content/validation-fixtures/settings/**
commerce registry:                      empty []
commerce production ref / labelOverride usage: 0 / 0
overlay file:                           none yet
C4 / C9 fixture proof:                   none yet
reverse UTM activation:                 dormant (pm-24 source landed; un-deployed)
pm-26:                                   BLOCKED
Admin Apply / middleware / admin-write-cli: dormant
```

---

## Appendix B — Option C quick card

```
goal:            overlay 證 C4 + C9；normal baseline 0 drift
reuse fixture:   content/validation-fixtures/blogger/posts/_test-commerce-ref-not-found.md
fixture edit:    +1 行 labelOverride: "sample-internal-c4c9"（== overlay entry A internalLabel）；不改 ref/其他
overlay file:    content/validation-fixtures/settings/commerce-c4-c9-overlay.json（只放 commerceLinks）
  Entry A:       linkId="__nonexistent-commerce-ref__"（== fixture ref）, active=false,
                 replacementTarget="sample-commerce-c4c9-active", internalLabel="sample-internal-c4c9",
                 targetUrl="https://example.invalid/c4c9-inactive"（省 networkKey）→ 供 C4 + C9
  Entry B:       linkId="sample-commerce-c4c9-active", active=true,
                 internalLabel="sample-internal-active", targetUrl="https://example.invalid/c4c9-active"
                 （省 networkKey）→ replacement，避 R12/R14
overlay 0 registry-level warning: 兩 entry 皆過 R4/R5/R6/R7/R8/R9/R11(skip)/R12/R13/R14
normal validate:  0 errors / 69 warnings / 59 posts
overlay validate: 0 errors / 70 warnings / 59 posts（C3 -1, C4 +1, C9 +1 → net +1）
commands:         npm run validate:content
                  npm run validate:content:overlay -- --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json
本輪輸出:         本 docs 檔；0 overlay / 0 fixture / 0 source / 0 registry / 0 memory；baseline 不變
ladder:          L6(本檔) → L6a read-only acceptance → L6b implementation → L6c acceptance（每階獨立 approval）
紅線:            無真實 affiliate/merchant/token/tracking/commission/Form/respondent；不 echo internalLabel/labelOverride/url/token
```

---

（本文件結束）
