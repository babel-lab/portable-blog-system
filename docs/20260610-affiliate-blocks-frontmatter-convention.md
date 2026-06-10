# `affiliate.blocks[]` Frontmatter Convention — Lock (Option B, docs-only, NOT implemented)

> **Phase**: `20260610-pm-7-affiliate-blocks-frontmatter-convention-docs-only-a`
> **Mode**: **docs-only convention lock**。鎖定 Option B `affiliate.blocks[]` 之 frontmatter YAML 慣例（含 per-block surface gating）。**不**改 src / renderer / Admin / schema / `commerce-links.json` / production posts；**不** seed 聯盟網；**不**改通路王 URL / affiliate URL policy；**不** build / deploy / 動 gh-pages / 重貼 Blogger / 遷移任何 post；**不實作任何驗證或渲染**。
> **Created**: 2026-06-10 +0800（16:46 起始）
> **Baseline**: main HEAD = origin/main = `97f6390` / gh-pages = `2acb5a5` / clean / normal 0/69/59 / overlay 0/72/60 / GitHub Pages live acceptance = PASS（**不得擾動**）/ Blogger actual repost = NOT DONE / BLOCKED / DEFERRED。
> **References（read-only）**: `docs/20260610-blogger-dual-block-content-model-preanalysis.md`（pm-5 §2 Option B + §3.1 surface decision）、CLAUDE.md §12 / §16.4 / commerce YAML convention（`docs/20260610-commerce-yaml-fields-site-productkey-category-preanalysis.md`）。

---

## 0. 使用者決策補充（authoritative；本 phase 起 binding）

- 本階段 dual-block unblock **先以 Blogger-only 為主**。
- GitHub Pages 目前**必須維持** live-accepted 之**單區塊 / legacy-compatible 輸出**。
- **未來 GitHub Pages affiliate / dual-block 支援是真實需求，但目前 deferred（暫放），不是 rejected（永久排除）**。
- 未來 GitHub Pages affiliate / dual-block 支援**必須另開 phase + 另做 acceptance**。

> 即 pm-6 之「GitHub Pages 維持單區塊」應理解為 **暫時 / 待未來另開 phase**，**非**「GitHub Pages 永遠不要 commerce」。

---

## 1. 命名風格選定與理由

**選定：`affiliate.blocks[]` array + per-block lowerCamelCase 欄位 + `surfaces`（複數 array）surface gate。**

理由：

1. **對齊既有 frontmatter 慣例**：本專案 frontmatter 既有欄位皆 lowerCamelCase（`publishTargets` / `relatedLinks` / `searchDescription` / `primaryPlatform`），registry 亦 `networkKey` / `displayLabel` / `internalLabel`。沿用同風格，一人維護無需記第二套命名。
2. **`surfaces`（複數）而非 `renderOn`（單數/動詞）**：CLAUDE.md commerce YAML convention 已預留 optional **`surfaces`（複數）** 作跨站限制欄位（v1 deferred）。沿用同名同義，避免再造同義詞；複數 array 天然支援「未來一個 block 同時上 blogger + pages」，`renderOn` 字面偏單一目標、語意較窄。
3. **`position` 單數 string（`top` / `bottom`）而非沿用 legacy 的 `position.{top,bottom}` object**：per-block 只有一個位置，string enum 比 boolean-pair object 直觀、且利於未來擴 `inline` 等值。legacy 的 object 形式保留於 legacy path 不動（見 §3）。
4. **`links[]` 沿用既有 link shape**（`{ label, network, ref }` + 既有 optional `role` / `order` / `labelOverride`）：直接重用 R1 resolver 與 commerce-ref validator（C1/C2/C3/C5/C6/C8/C4/C9），不另立第二套 link schema。
5. **tracking 不過度設計**：本階段**只保留**一個 optional dormant 欄位（見 §2 `tracking`），不展開 GA4 維度 —— top/bottom 點擊分析屬未來獨立 tracking phase，且 placement 多半可由 `position` 派生，現在不鎖死結構。

---

## 2. `affiliate.blocks[]` 欄位字典（convention lock；未實作）

```yaml
affiliate:
  enabled: true                 # 既有；總開關（沿用，不變）
  disclosure: "…"               # 既有；legacy / per-block fallback 用（沿用，不變）
  position: { top: false, bottom: true }   # 既有 legacy object（GitHub 與「無 blocks」時仍用；見 §3）
  links: [ … ]                  # 既有 legacy array（GitHub 與「無 blocks」時仍用；見 §3）

  blocks:                       # 🆕 additive；Blogger dual-block 用
    - id: "top-tongluwang"      # REQUIRED；post 內唯一；machine id（kebab-case 建議）
      enabled: true             # optional；預設 true；per-block 開關
      surfaces: ["blogger"]     # optional；surface gate；允許值見 §2.1；省略預設見 §2.1
      position: "top"           # REQUIRED；允許值 top | bottom
      heading: "立即購買（實體書）"   # optional；區塊標題 override；省略 fallback「立即購買」
      disclosure: "本文包含…"    # optional；per-block 揭露 override；省略 fallback affiliate.disclosure
      links:                    # REQUIRED when enabled；沿用既有 link shape
        - label: "博客來：實體書"
          network: "通路王"
          ref: "book-we-media-myself2-books-com-tw-physical-books"
      # networkKey / labelOverride / role / order：optional，沿用既有 commerce link 慣例（非必填）
      tracking: {}              # optional；RESERVED / DORMANT；目前 renderer/validator 一律忽略（見 §2.2）
```

### 2.1 `surfaces` 允許值與預設（surface gate 核心）

- 允許值：`"blogger"`、`"pages"`（= GitHub Pages）。其他值 → 未來 validator warn。
- **省略 `surfaces` 時，本階段預設 `["blogger"]`**（保守；確保不誤上 GitHub）。
- ⚠️ **本階段（Blogger-only era）renderer 層硬規則**：**GitHub Pages renderer 一律忽略 `affiliate.blocks[]`（不論 `surfaces` 是否含 `pages`）**，維持 legacy 輸出 —— 直到未來明確 phase 才 wire「`pages` surface 讀 blocks」。即 `"pages"` 為**已保留但尚未生效**之值；現在寫 `surfaces: ["pages"]` 不會讓 GitHub 渲染（且本階段不建議寫）。
  - 此「renderer 層忽略」是結構性保證：即使作者誤填 `pages`，GitHub 輸出仍不變，不依賴 per-post 欄位正確性。

### 2.2 `tracking`（reserved / dormant）

- 形狀**暫不鎖死**；目前定義為 optional object，**renderer 與 validator 一律忽略**（dormant）。
- 未來 top/bottom 點擊分析 phase 再決定其結構（或改由 `position` 派生 GA4 `placement`）。本階段僅佔位，**不得**用於任何 GA4 / reverse UTM 行為（兩者維持 dormant）。

---

## 3. 向後相容 + precedence 規則（convention lock）

### 3.1 legacy 續用

- 既有 `affiliate.links[]` + `affiliate.position.{top,bottom}` + `affiliate.disclosure` **必須持續運作不變**。
- **未遷移之文章（無 `blocks[]`）→ 兩端 renderer 皆走 legacy path → 輸出 byte-identical / behavior-identical**（58 篇 production posts 全不受影響；normal validate 維持 0/69/59）。
- `blocks[]` 為 **additive**：新增此欄位不改動 legacy 欄位語意。

### 3.2 precedence（legacy 與 blocks 並存時，避免重複渲染）

| Surface | 有 `blocks[]`（非空）時 | 只有 legacy `links[]` 時 |
| --- | --- | --- |
| **Blogger renderer** | **用 `blocks[]`**（過濾 `surfaces` 含 `blogger` 且 `enabled`，依 `position` 渲染）；**忽略 legacy `links[]`/`position`**（避免雙重渲染）| 用 legacy（不變）|
| **GitHub Pages renderer** | **一律用 legacy `links[]`/`position`**（**忽略 `blocks[]`**，本階段硬規則）| 用 legacy（不變）|

### 3.3 ⚠️ 當前階段遷移要求（保證 GitHub 不變）

- 「把 we-media 遷至 `blocks[]`」在本階段 **必須同時保留 legacy `affiliate.links[]` + `position`**，供 GitHub Pages 繼續渲染其 live-accepted 單區塊。
  - GitHub：讀 legacy → **輸出 byte-identical**（單一 bottom box 不變）。✅
  - Blogger：讀 `blocks[]` → dual-block。✅
- **不可**只留 `blocks[]` 而刪除 legacy `links[]`：GitHub 忽略 blocks 又無 legacy links → GitHub affiliate box **消失** = 改變了 live-accepted 輸出（**違反 §0 約束**）。
- legacy 與 blocks 並存於本階段為**刻意設計**（非錯誤）；未來 GitHub Pages 支援 `pages` surface 後，再評估能否收斂為單一 `blocks[]` 來源（屬未來 phase）。

---

## 4. Draft 範例 — `we-media-myself2`（**範例 only；不套用 production；不 seed 假聯盟網**）

> ⚠️ **僅示意 convention 形狀，不得套用至 production post `content/blogger/posts/20260515-we-media-myself2.md`；不 seed 任何假聯盟網資料；下方 ref 皆現有真實通路王 active linkId。**

```yaml
affiliate:
  enabled: true
  disclosure: "本文包含聯盟行銷連結。若你透過連結購買，本站可能取得少量回饋。"

  # ── legacy（保留供 GitHub Pages 渲染 live-accepted 單一 bottom box；不變）──
  position:
    top: false
    bottom: true
  links:
    - label: "博客來：實體書"
      network: "通路王"
      ref: "book-we-media-myself2-books-com-tw-physical-books"
    - label: "金石堂：實體書"
      network: "通路王"
      ref: "book-we-media-myself2-kingstone-physical-books"

  # ── 🆕 blocks（Blogger dual-block；GitHub 本階段忽略）──
  blocks:
    - id: "top-tongluwang"
      enabled: true
      surfaces: ["blogger"]          # GitHub 不啟用（pages 未列入）
      position: "top"
      heading: "想入手實體書？"
      disclosure: "以下為通路王聯盟連結，購買不影響你的價格。"
      links:
        - label: "博客來：實體書"
          network: "通路王"
          ref: "book-we-media-myself2-books-com-tw-physical-books"

    - id: "bottom-affiliate-slot"
      enabled: true
      surfaces: ["blogger"]          # GitHub 不啟用
      position: "bottom"
      heading: "電子書 / 其他通路"     # 上下文案故意不同
      disclosure: "本段為另一通路之聯盟連結。"
      links:
        # 🔻 未來聯盟網 slot；聯盟網尚未存在 → 暫時允許用既有通路王 ref（不 seed 假聯盟網）
        - label: "金石堂：實體書"
          network: "通路王"
          ref: "book-we-media-myself2-kingstone-physical-books"
```

範例重點：

- top Blogger block = 通路王；bottom Blogger block = **未來聯盟網 slot**，聯盟網存在前**暫用通路王 ref**。
- `pages`/GitHub surface **未啟用**（`surfaces` 僅 `["blogger"]`）。
- 上下 `heading` / `disclosure` **故意不同**。
- legacy `links[]`+`position` **保留**（GitHub 單一 bottom box 不變）。

---

## 5. validator 行為（**✅ LANDED warning-only — Phase `20260610-pm-9`**）

> **狀態更新（pm-9）**：本節規則已落地於 `src/scripts/validate-content.js`（warning-only，fixture-isolated）。實作摘要：抽出共用 helper `validateCommerceLinkArray`（行為中立，legacy `affiliate.links[]` 輸出 byte-identical）+ 新 `validateAffiliateBlocks`（call site 於既有 `validateCommerceRefs` 之後）。落地 rule IDs：`affiliate-blocks-not-array` / `affiliate-block-invalid-entry-type` / `affiliate-block-missing-id` / `affiliate-block-duplicate-id` / `affiliate-block-invalid-enabled-type` / `affiliate-block-invalid-surfaces-type` / `affiliate-block-invalid-surface-value` / `affiliate-block-invalid-position` / `affiliate-block-links-not-array` / `affiliate-block-enabled-no-links`；block links 重用 `validateCommerceLinkArray`（C1/C2/C3/C5/C6/C8；**block-level C4/C9 deferred**，傳 `entryMap=null`）；**不**報 legacy/blocks coexistence；**tracking 驗證 deferred**（reserved/dormant，本 phase 不檢查）。13 fixtures（11 觸發 + 2 zero-warning guard）；normal baseline 0/69/59 → **0/80/70**，overlay 0/72/60 → **0/83/71**（全 fixture-only；production 0 觸發）。**renderer 仍未實作。**

下方為原始規劃（保留為設計記錄）：

- **block `id`**：enabled block 必填；**post 內唯一**（重複 → warn）。
- **`position`**：允許值 `top` / `bottom`；其他 → warn。
- **`surfaces` / 各 entry**：允許值 `blogger` / `pages`；其他 → warn。（`pages` 合法但本階段 renderer dormant，可加 info 提示「pages surface 尚未生效」。）
- **enabled block 至少一筆有效 link/ref**：enabled 但 `links` 空或全部 ref 無效 → warn（mirror 既有 affiliate-enabled-but-empty 精神）。
- **重用既有 commerce-ref 驗證**：把 C1/C2/C3/C5/C6/C8（+ overlay C4/C9）之掃描路徑**擴展**至 `blocks[].links[].ref` / `.role`（與既有 `links[].ref` 同規則、同訊息族），避免另寫一套。
- **coexistence（legacy + blocks 並存）**：本階段為刻意設計 → **不報 coexistence warning**（至多 info）；未來 GitHub 支援後再評估。
- **legacy path 必須維持有效**：legacy-only 文章不得因新規則新增 error/warning（normal baseline 不得漂移）。
- **warn / error 政策建議**：**全部先 warning-only**（對齊既有 commerce-ref 保守 cadence + fixture-isolated 落地）；穩定後再評估是否升 error。實作時先 fixture（`content/validation-fixtures/...`），production 0 觸發。

---

## 6. 未來 renderer 實作注意（**列出，不實作**）

- **Blogger renderer**（`src/views/blogger/blogger-post-full.ejs` + `build-blogger.js`）：當 `blocks[]` 非空 → 迭代 blocks，過濾 `surfaces` 含 `blogger` 且 `enabled`，依 `position` 於正文前（top）/ 後（bottom）渲染；per-block `heading` / `disclosure` / `links`；忽略 legacy `links[]`/`position`（避免重複）。
- **GitHub Pages renderer**（`src/views/pages/post-detail.ejs` + `build-github.js`）：**維持 legacy-compatible**；本階段**忽略 `blocks[]`**；未來支援 `pages` surface 須**另開 phase + 另做 acceptance**。
- **resolver 重用**：per-block 呼叫既有 `deriveRenderedAffiliateLinks(block.{links}, commerceLinks)`，沿用 url-backward-compatible-first / omit / label-safety（**絕不**洩 `internalLabel`）。
- **避免重複渲染**：precedence 依 §3.2（Blogger 有 blocks 用 blocks；GitHub 用 legacy）。
- **byte-identical 驗收**：renderer phase 落地後，未採用 `blocks[]` 之文章 GitHub/Blogger 輸出須 byte-identical-modulo-builtAt；採用 `blocks[]` 之文章 GitHub 輸出（走 legacy）亦須不變。
- **不得 build / deploy / Blogger repost**，直到 generated-output acceptance 完成（mirror 既有 deploy gate 慣例；GA4 / reverse UTM 維持 dormant）。

---

## 7. Mutation scope / 紅線（本 phase）

- ✅ 僅新增本 convention docs file（+ 視需要 CLAUDE.md 一行 See-also 指向本 doc）。
- ❌ 零 src / renderer / Admin / schema / `commerce-links.json` / `affiliate-networks.json` / production posts（含 we-media）/ fixture / registry / dist / dist-blogger / gh-pages / deploy 變更。
- ❌ 未 build / deploy / 重貼 Blogger / 遷移任何 post / seed 聯盟網 / 改通路王 URL / canonicalize affiliate URL / 改 affiliate URL policy / 實作 validator / renderer。
- ❌ GA4 / reverse UTM 維持 dormant。

---

## 8. 現況狀態快照

| 項目 | 值 |
| --- | --- |
| main HEAD = origin/main | `97f6390`（本 phase docs 落地後更新）|
| gh-pages HEAD | `2acb5a5`（GitHub Pages LIVE，user-accepted PASS，**不擾動**）|
| `affiliate.blocks[]` convention | ✅ 本 phase 鎖定；**實作未開始** |
| dual-block intent | Blogger-only（暫定）；GitHub affiliate = **deferred（非 rejected）**，須另開 phase + acceptance |
| Blogger actual repost | ⛔ BLOCKED / DEFERRED |
| normal / overlay | 0/69/59 / 0/72/60 |

---

*（本文件結束 — Option B `affiliate.blocks[]` frontmatter convention **鎖定 / 實作未開始**；命名 = lowerCamelCase + `surfaces` 複數 surface gate（允許 `blogger` / `pages`，`pages` 已保留但本階段 GitHub renderer dormant）；precedence = Blogger 有 blocks 用 blocks、GitHub 一律 legacy；當前階段遷移**須同時保留 legacy `links[]`** 以保證 GitHub 輸出 byte-identical；未來 validator / renderer 行為已列出未實作；GitHub affiliate = deferred 非 rejected，須另開 phase + acceptance；docs-only，無 source / renderer / schema / registry / production / build / deploy / gh-pages / Blogger 變更。）*
