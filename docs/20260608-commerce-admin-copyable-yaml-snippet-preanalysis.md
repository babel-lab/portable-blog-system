# Commerce Admin Copyable YAML Snippet — Preanalysis (docs-only)

Phase: `20260608-pm-32-commerce-admin-copyable-yaml-snippet-preanalysis-docs-only-a`
Date: 2026-06-08
Baseline: HEAD `3ff7b0e` — `docs(commerce): plan registry seed governance`
Status: **docs-only preanalysis. NO snippet implementation. NO Admin source change. NO seed. NO write path.**

> ⚠️ 本文僅含 placeholder / `example.invalid` / `sample-*` 值。**不含**任何真實 affiliate URL、tracking URL、tracking id、sid、aff_id、merchant id、networkKey、token、credential、Google Form ID、respondent data、私人下載連結、private notes、commission-sensitive values、customer data。本文所有 YAML 片段皆為 schema 範例，非可貼上 production 的真實連結。

---

## 1. Executive Summary

本輪是一份 **docs-only preanalysis**，目的是在「Admin commerce read-only preview 已 landed/accepted」與「registry seed governance 已 landed/accepted」之後，先把**未來的 A6「copyable YAML snippet」** 的安全設計、shape、role / labelOverride 政策、empty-registry 行為與紅線寫清楚，**再**進入任何 A6 source 實作。

本輪明確 **不做**：

- ❌ 不實作 snippet（不寫任何可產生 / 複製 snippet 的 source）
- ❌ 不改 Admin source（`active-commerce-links.js` / `load-admin-posts.js` / `build-github.js` / `admin/index.ejs` 全不動）
- ❌ 不 seed registry（`content/settings/commerce-links.json` 維持 empty `[]`）
- ❌ 不啟動任何 write path（Admin Apply / middleware / admin-write-cli 維持 dormant）
- ❌ 不啟動 C7（missing-role；維持 product-decision-gated / NO-GO）
- ❌ 不啟動 renderer / landing page / deploy / Blogger repost / GA4 validation / reverse UTM
- ❌ 不 promote `_sample.commerce-links.json`、不新增 overlay / fixture、不做 production migration

本文唯一的交付物是本檔自身：`docs/20260608-commerce-admin-copyable-yaml-snippet-preanalysis.md`。

**核心結論（詳見 §18）**：本輪不實作 snippet、不 seed；先 acceptance（pm-33）。snippet 只是 authoring helper（產生可手動貼上的 frontmatter fragment），**不是** auto-apply、**不是** Admin Apply、**不是** write-enabled editor、**不是** registry write、**不**繞過 validator。即使未來實作 A6 source，在 production registry 仍 empty 時，A6 也必須先呈現 empty-state / disabled 行為。

---

## 2. Current Accepted Baseline

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD = origin/main | `3ff7b0e` |
| latest subject | `docs(commerce): plan registry seed governance` |
| working tree | clean |
| `npm run validate:content` | **0 errors / 69 warnings / 59 posts** |
| overlay direct-node validate | **0 errors / 70 warnings / 59 posts** |
| production `commerceLinks` | empty `[]` |
| Admin commerce read-only preview | landed / **accepted**（read-only；empty-state） |
| registry seed governance | landed / **accepted**（docs-only；`3ff7b0e`） |
| memory | 已 sync through **pm-31** |

Overlay validate 標準指令（直接 node 呼叫；`npm run ...:overlay -- --registry-overlay` 會 drop flag 退回 0/69/59）：

```bash
node src/scripts/validate-content.js --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json
```

---

## 3. Current Admin Preview Inventory（依實際 source 觀察）

下列依**實際觀察**（不臆測）整理自 `src/scripts/active-commerce-links.js`、`src/scripts/load-admin-posts.js`、`src/scripts/build-github.js`、`src/views/admin/index.ejs`。

### 3.1 helper：`buildCommerceLinkPreviewOptions(settings)`（`active-commerce-links.js`）

- DATA SOURCE = production `settings.commerceLinks` only（loader 已 read-only unwrap 為 array）。
  - 不讀 `_sample.commerce-links.json`、不讀 validation overlay / fixture、不 auto-promote sample。
- 回傳 `{ rows, count }`；每筆 row 只含 **4 個 safe 欄位**：
  - `linkId`（ref machine key；缺則該 entry 被排除——picker 無從引用）
  - `active`（`entry.active !== false`；mirror registry 語意）
  - `displayLabel`（safe public label；缺則 **fallback = `linkId` 本身**，**絕不** fallback 至 `internalLabel` / `targetUrl`）
  - `hasReplacementTarget`（只輸出 presence boolean，**不**輸出其值）
- graceful：missing / 非 array / invalid entry shape / 缺 linkId → 排除，不 throw；registry empty → `{ rows: [], count: 0 }`。
- 同檔 export `ALLOWED_COMMERCE_ROLES = ['primary','alternate','official','price-check','library','direct']`（C8 enum mirror；comment 標注「FUTURE DEDUPE CANDIDATE：未來應抽到 shared module」）。

### 3.2 loader 接線（`load-admin-posts.js`）

- import `{ buildCommerceLinkPreviewOptions, ALLOWED_COMMERCE_ROLES }`。
- registry-global preview 建構**一次**（非 per-post）：`const commerceLinksPreview = buildCommerceLinkPreviewOptions(settings);`。
- `loadAdminPosts` return `{ posts, commerceLinksPreview, allowedCommerceRoles: ALLOWED_COMMERCE_ROLES }`（additive；既有 `{ posts }` consumer 不受影響）。

### 3.3 build 接線（`build-github.js`）

- render admin EJS 的 context 為 `{ posts, builtAt, commerceLinksPreview, allowedCommerceRoles }`（additive read-only；registry empty → `count === 0` → EJS empty-state）。

### 3.4 EJS 呈現（`admin/index.ejs`，section line ~197–264）

- read-only preview `<section>`：disclosure banner 明示 **no Admin Apply / no registry write / no markdown write / no middleware / no admin-write-cli**。
- registry empty → empty-state 文字（引導手填 `commerce-links.json`），**不**列出任何 entry。
- 非 empty 時：table 4 欄（`ref (linkId)` / `status` / `display label (safe)` / `replacement`）。
- role enum 區塊：列出 `ALLOWED_COMMERCE_ROLES` 作為 authoring guidance，並明示「role 非必填（recommended-but-optional）」「**本 phase 不提供 interactive 選取、不產生可 apply 之 snippet**」。

### 3.5 觀察結論（不確定處標 unknown，不猜）

- ✅ 現在**沒有 snippet**：EJS 已明文「不產生可 apply 之 snippet」。
- ✅ 現在**沒有 write path**：無 Admin Apply / middleware / admin-write-cli / fs write / fetch / form submit。
- ✅ 現在**沒有 registry write / markdown write**。
- ✅ 現在僅輸出 4 個 safe 欄位；EJS 從不存取 `targetUrl` / `internalLabel` / `networkKey`（helper 根本不放進 row）。
- ❓ unknown：是否有既有「client-side copy-to-clipboard」安全模式可重用 → **未確認**（§14 / §15 標 unknown，待 source phase 觀察，不猜）。

---

## 4. Snippet Use Case

A6 snippet 的**唯一用途**：在 Admin read-only 介面，依 production registry 既有 entry，產生一段**可手動複製、貼進文章 `.md` frontmatter** 的 `affiliate.links` YAML fragment，降低作者手打 `ref` / `role` 拼字錯誤（即降低 C1 / C2 / C3 / C8 觸發機率）。

snippet **明確不是**：

- ❌ snippet 不是 auto-apply（不自動寫進任何檔案）
- ❌ snippet 不是 Admin Apply
- ❌ snippet 不是 write-enabled editor
- ❌ snippet 不直接改文章 `.md`
- ❌ snippet 不改 registry（`commerce-links.json`）
- ❌ snippet 不繞過 validator（貼上後仍須 `npm run validate:content` 把關）

snippet 是「**copy → 作者手動貼 → 作者手動 validate**」的純文字產物；它縮短打字，不縮短把關。

---

## 5. YAML Shape Proposal

提案 shape（**placeholder-only**，非真實連結）：

```yaml
affiliate:
  links:
    - ref: sample-book-title-shopee-primary
      role: primary
      labelOverride: ""
```

### 5.1 欄位規則

| 欄位 | 來源 / 規則 |
|---|---|
| `ref` | **來自 registry `linkId`**（machine key）。snippet 只把使用者在 Admin 選定的既有 entry 之 `linkId` 填入；不自創、不從 URL 推斷。 |
| `role` | 使用 allowed enum（§6）。recommended-but-optional。 |
| `labelOverride` | 預設空字串或省略（§7 比較兩者風險）。advanced / caution 欄位。 |

### 5.2 snippet 不得包含（紅線，見 §10）

snippet 產出文字**永不**包含：`targetUrl`、`internalLabel`、tracking URL、任何 real URL、token / credential / merchant id / networkKey、tracking id / sid / aff_id。snippet 只輸出 `ref`（machine key）+ `role`（enum）+ 視情況 `labelOverride`（空或作者後填的 display-safe 文字）。

> 理由：`ref` 是 indirection——它指向 registry，registry 才持有 `targetUrl`。snippet 的整個價值就在於「文章端只放 ref，不放 URL」，這同時也是它天然安全的原因。

---

## 6. Role Handling

allowed enum（C8 `commerce-ref-invalid-role` mirror；亦即 `ALLOWED_COMMERCE_ROLES`）：

```text
primary / alternate / official / price-check / library / direct
```

- role remains **recommended-but-optional**。
- **C7 (missing-role required) remains deferred / NO-GO**（product-decision-gated）。
- snippet **可以**提供 role，但提供 role **不代表** role required——snippet 提供 role 只是 authoring convenience，不改變 C7 狀態、不啟動 C7。

### 6.1 role 空白時，snippet 是否省略 role？（分析）

兩種設計：

| 設計 | 行為 | 評估 |
|---|---|---|
| **A. 省略 role key**（作者未選 role 時不輸出 `role:`） | 產出最乾淨；與「role optional」語意一致；不會產生 `role: ""` 這種可能被誤判的空值 | ✅ **推薦** |
| B. 輸出 `role: ""` 空值 | 明示有此欄位 | ⚠️ 風險：空字串 `""` 不在 enum 中，**可能**觸發 C8 invalid-role（取決於 C8 是否把「缺 role」與「role 為空字串」視為同一類；見 §6.2）→ 反而製造 warning |

**推薦 A（role 空白即省略 `role` key）**：與 role optional 一致、零 C8 誤觸風險、產出最乾淨。

### 6.2 與 C8 invalid-role validator 的關係

- C8 = `commerce-ref-invalid-role`：當文章端 `role` 之值不在 allowed enum 時 warning。
- snippet 採 enum dropdown / 既有 enum 來源 → 作者只能選合法 role → snippet **降低** C8 觸發。
- ⚠️ 但 snippet **不取代** C8：作者貼上後仍可手改成非法值；validator 仍是 gatekeeper。
- ⚠️ 「缺 role」與「`role: ""`」是否同被 C8 視為合法/缺值 → 本文標 **unknown（不臆測 C8 對空字串的精確行為）**；A6 source phase 須先讀 `validate-content.js` C8 實作確認，再決定空 role 的輸出策略。保守預設採 §6.1 設計 A（省略）以迴避此 unknown。

---

## 7. LabelOverride Handling

`labelOverride` 是 **advanced / caution** 欄位，預設不填。

### 7.1 不應自動填 `internalLabel`

- `internalLabel` 是站長**內部識別字串**（可能含結算 / 通路內部代號），night-18 §9.3 明定**不得渲染前台**。
- snippet **永不**把 `internalLabel` 自動填入 `labelOverride`（也永不顯示 `internalLabel`）。helper 連 `internalLabel` 都不放進 row（§3.1），故 snippet 結構上無從取得它。

### 7.2 是否應自動等於 `displayLabel`？（風險分析）

| 候選 | 風險 |
|---|---|
| 自動 `labelOverride = displayLabel` | ⚠️ 多餘且有害：(1) `labelOverride` 的設計用途是「per-article CTA 客製」，自動等於 registry `displayLabel` 使該欄位失去意義、徒增雜訊；(2) 若未來 renderer fallback chain 為 `labelOverride → displayLabel`，自動複製會把「跟隨 registry 更新」變成「凍結當下值」——registry 改 `displayLabel` 後文章端仍顯示舊值。 |
| **預設省略 / 空字串** | ✅ 讓 renderer fallback 到 registry `displayLabel`；作者只在真要客製時才手填。**推薦**。 |

**推薦：預設省略 `labelOverride`（或空字串 + blank placeholder），不自動帶任何值。**

### 7.3 C9 leak-equality 風險

- C9 = `commerce-ref-display-override-risk`：當文章端 `labelOverride`（trim 後）**等於** registry entry 之 `internalLabel` 時 warning（leak-equality；per C9 doc / am-7 §4.4）。
- 因 snippet 預設**省略** `labelOverride`、且**結構上拿不到 `internalLabel`** → snippet 產物天然不會構成 C9 leak-equality。
- ⚠️ C9 message **不 echo** `internalLabel` / `labelOverride` 值（避免 validator log 成為洩漏管道）；snippet 文件 / UI 亦不得顯示 `internalLabel`。

### 7.4 labelOverride 不得放入的內容

`labelOverride` **永不**放：tracking / commission / 私人備註 / 任何 sensitive 內部字串。它只應是「要顯示給讀者看的 display-safe CTA 文字」。

### 7.5 結論

- 預設：**省略 `labelOverride`**（或空字串 + blank placeholder）。
- 自動值：**無**（不自動帶 displayLabel、永不帶 internalLabel）。
- snippet UI 若提供 `labelOverride` 輸入框，須標注 caution + 「display-safe 文字 only」。

---

## 8. Empty Registry Behavior

- production registry **currently empty `[]`**。
- empty 時 snippet **不應產生有效 snippet**：
  - ✅ 顯示 disabled snippet placeholder / guidance（引導先依 §10 / §11 紅線手填 registry）。
  - ❌ 不從 `_sample.commerce-links.json` 產生 snippet。
  - ❌ 不從 overlay / fixture 產生 snippet。
  - ❌ 不 auto-seed registry。
- 這與現有 preview 的 empty-state（§3.4）一致：no entry → no copyable ref。
- 結論：即使 A6 source 未來落地，**registry empty 時 A6 也只能 empty-state / disabled**。

---

## 9. Multiple Links per Article

一篇文章可有多個 affiliate links（`affiliate.links[]` 為陣列）。

### 9.1 排序（snippet 內 links 的順序）

候選：primary first？official → direct → price-check → library？

- 觀察：目前**沒有 validator 或 renderer 規定 links 順序**（renderer dormant）。
- 因此「排序」純屬 authoring convenience，**不是** correctness。建議 A6 採**穩定、可預期**的排序（例如 enum 宣告序 `primary → alternate → official → price-check → library → direct`，再以 `linkId` 字典序 tiebreak），但這屬 source phase 的 UI 細節決策，**標 future decision**（不在本輪凍結）。

### 9.2 是否允許多個 primary？

- 目前**沒有 validator 限制** `role` 的基數（無「at most one primary」規則）。
- 因此「是否允許多個 primary」屬 **future decision**（product / renderer 決策；renderer 啟用後才有實際意義）。
- snippet 本輪**不**強制此限制、**不**自行新增 validator。

### 9.3 snippet 如何避免作者混淆

- 一次只產生作者**明確勾選**的 entries 的 fragment（不一次倒出整個 registry）。
- 每筆顯示 `ref` + safe `displayLabel`（讓作者辨識），但 fragment 內只放 `ref` / `role` / 視情況 `labelOverride`。
- UI 明示「多筆 link 的最終呈現由未來 renderer 決定；目前 renderer dormant」。

---

## 10. Security / Red Lines

snippet 產出文字、snippet UI、本類 docs **永不**包含：

- ❌ targetUrl
- ❌ real affiliate URL
- ❌ tracking URL
- ❌ tracking id / sid / aff_id
- ❌ merchant id / networkKey
- ❌ token
- ❌ credential
- ❌ private download URL
- ❌ Google Form ID / respondent data
- ❌ private notes
- ❌ commission-sensitive values
- ❌ customer data
- ❌ any value inappropriate for git history

> git-history 永久性：一旦 secret 被 commit，刪檔不能還原安全（mirror seed governance 紅線）。snippet 因只輸出 `ref`（machine key）indirection，天然迴避上述大多數風險；但 `labelOverride` 是唯一作者可自由輸入的欄位 → UI 須明示「display-safe only，禁放 sensitive」。

---

## 11. Relationship to Registry Seed Governance

- registry seed governance（`3ff7b0e`）是 **prerequisite**：沒有 production entries，snippet 無 `ref` 可引用。
- snippet **不等於 seed**：
  - snippet 只是 reference 既有 `linkId`，**不產生 registry entry**。
  - 沒有 production entries 時，snippet 僅能 empty-state / disabled（§8）。
- 即使未來 seed 含 real public URL（per seed governance §「first scope 1–3 筆 official/direct public URL」），snippet **仍不顯示 URL**——snippet 永遠只輸出 `ref`，URL 留在 registry。
- seed 的 L1/L2/L3 ladder（user candidate preflight → settings-only seed → acceptance）與本 snippet 線**獨立進行**（§17）。

---

## 12. Relationship to Validators

- validator 仍是 **gatekeeper**：snippet 不繞過、不取代任何 validator。
- snippet **可降低** C1（invalid-type）/ C2（empty）/ C3（ref-not-found）/ C8（invalid-role）的觸發機率（因 ref / role 來自既有合法來源），但**不能取代** validator（作者貼上後仍可手改成非法值）。
- snippet **不啟動 C7**（missing-role required 維持 deferred / NO-GO）。
- C4（inactive ref）/ C9（display override risk）仍由 validator warning：
  - snippet **不自動處理 inactive replacement**（不替作者把 inactive ref 換成其 replacement；replacement 為 safe-hint-only，無自動文章替換）。
  - snippet 預設省略 `labelOverride` → 天然不構成 C9 leak-equality，但 C9 仍對手動輸入把關。
- 貼上後的**唯一驗收**仍是 `npm run validate:content`（+ overlay direct-node validate）。

---

## 13. Relationship to Renderer / Deployment

- snippet 只產生 **frontmatter fragment**（文章端資料）。
- renderer **future** 才會消耗 `affiliate.links`（目前 renderer dormant；production 0 篇用 `ref`）。
- snippet **不等於** renderer activation。
- snippet **不等於** deployment。
- snippet **不等於** Blogger repost / GA4 validation / reverse UTM activation。
- 即作者複製 snippet → 貼進 `.md` → validate，並**不會**讓任何連結出現在前台；那要等 renderer phase 另行啟動。

---

## 14. UI Design Proposal（未來 Admin UI，本輪不實作）

規劃（mirror 既有 read-only preview 的克制）：

- snippet 顯示於既有 commerce read-only preview `<section>` 內或其下。
- snippet 呈現為 **read-only `<textarea>`**（`readonly` 屬性）。
- **disabled if empty registry**（§8）：registry empty → 不顯示可用 snippet，僅 placeholder / guidance。
- **copy button**：可行性需評估——`navigator.clipboard.writeText` 是 client-side、**不**碰 fs / 不寫檔，符合 no-write-path；但須確認**沒有任何 server round-trip / middleware / fetch**。本文標：copy button **候選可行（client-side only）**，但**是否已有專案內安全 copy 模式可重用 = unknown**，待 source phase 觀察，不猜。
- **no auto-apply**。
- clear disclosure（須明文列出）：
  - copy manually
  - validate after paste（`npm run validate:content`）
  - no Admin Apply
  - no registry write
  - no markdown write
- UI **不顯示** `targetUrl` / `internalLabel`（沿用 §3.1 / §10）。

> 草圖（概念，非實作）：
> ```
> [ commerce snippet (read-only) ]
> 選取 entry：☑ sample-book-title-shopee-primary  ☐ sample-...-alternate
> ┌─ snippet (readonly textarea) ───────────────┐
> │ affiliate:                                   │
> │   links:                                     │
> │     - ref: sample-book-title-shopee-primary  │
> │       role: primary                          │
> └──────────────────────────────────────────────┘
> [Copy]  ⚠️ copy manually · validate after paste · no Apply · no write
> ```

---

## 15. Source Touch Candidates（未來 A6 source 可能 touch）

**可能 touch（A6 source phase，需獨立 approval）**：

- `src/views/admin/index.ejs`（顯示 snippet textarea / disclosure / copy button）
- `src/scripts/active-commerce-links.js`（若 snippet 需額外 derived shape——但只在既有 4 safe 欄位範圍內）
- `src/scripts/load-admin-posts.js`（若需把 snippet data 傳進 render context）
- optional client-side copy behavior（client-side only；若採用）

**安全模式但本輪 / A6 皆不得 touch**：

- ❌ `src/scripts/validate-content.js`
- ❌ `src/scripts/load-settings.js`（production behavior）
- ❌ `content/settings/commerce-links.json`
- ❌ `content/settings/_sample.commerce-links.json`
- ❌ fixtures / overlay
- ❌ admin-write-cli / whitelist
- ❌ package scripts（unless truly necessary）

---

## 16. Future Implementation Acceptance Criteria（A6 source 落地時須符合）

- exact source file scope（只動 §15「可能 touch」清單內檔案）。
- no registry / sample / fixture / docs mutation（except implementation doc if separately authorized）。
- normal validate **unchanged**（0/69/59，除非另有獨立批准的 fixture phase）。
- overlay direct-node validate **unchanged**（0/70/59）。
- empty registry **不產生 active snippet**（empty-state / disabled）。
- no sensitive output（§10 紅線全守）。
- no targetUrl / internalLabel in UI。
- no write path / no Admin Apply / no middleware / no admin-write-cli。
- repo clean（drift guard 全空；build:github 只寫 gitignored `.cache`，no tracked / dist / gh-pages drift）。
- commit / push rules：單一 source-scope commit；不 amend / rebase / force-push。

---

## 17. Ladder

1. **pm-33** — read-only acceptance of *this* preanalysis（驗 baseline / diff scope / no sensitive data / validate unchanged）。
2. **A6 source implementation** — only after pm-33 acceptance；遵 §15 scope + §16 criteria；registry empty 時仍 empty-state / disabled。
3. **A6 acceptance** — read-only acceptance of A6 source。
4. **memory sync** — A6 落地 + accepted 後，單獨 memory-sync phase。

並行 / 分離的 ladder（**不**因本線而推進）：

- registry seed **L1 / L2 / L3 remains separate**（user candidate preflight → settings-only seed → acceptance）。
- **C7 remains product-decision-gated**（NO-GO until user product 決策 role-required）。
- write-enabled Admin much later（Admin Apply / middleware / admin-write-cli 維持 dormant）。

---

## 18. Final Recommendation

- ✅ **本輪不實作 snippet**。
- ✅ **本輪不 seed**。
- ✅ **下一步應先 acceptance（pm-33）**。
- ✅ 若 acceptance pass，才考慮 A6 source implementation。
- ✅ production registry empty 時，A6 implementation 也應先 **empty-state / disabled** behavior。

snippet 的本質是 authoring convenience（縮短打字、降低 C1/C2/C3/C8 拼字錯誤），它**不改變**任何安全邊界：不繞 validator、不啟 C7、不啟 renderer / deploy、不碰 registry / write path。其天然安全來自「只輸出 `ref` indirection，URL / internalLabel 永不離開 registry」。唯一需要 UI 紀律把關的欄位是作者可自由輸入的 `labelOverride`（display-safe only）。

> 待 user 指示再進入 pm-33 acceptance；本輪完成後進入 Final Idle Freeze。
