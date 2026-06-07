# 2026-06-07 Commerce C6 Coexistence Warning — Preanalysis (docs-only)

Phase name: `20260607-night-12-commerce-c6-coexistence-warning-preanalysis-docs-only-a`
Date: 2026-06-07 21:14 +0800
Mode: **docs-only C6 warning preanalysis**（no source / no fixture / no content / no settings registry mutation / no templates / no renderer / no loader change / no validator rule landing / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no real affiliate link added / no registry seeding / no production content migration / no `npm install` / no CLAUDE.md mutation）

---

## 0. Relation to prior phases

| 順序 | Phase / commit | 角色 |
| --- | --- | --- |
| night-19 `e40a278` | commerce affiliate link empty registry preanalysis | R1-clean 7 條件 |
| night-20 `c1a6974` | empty registry implementation（settings-only） | `content/settings/commerce-links.json` empty registry |
| night-21 `78f1e9a` | commerce-links loader exposure（source-only） | `load-settings.js` 暴露 `settings.commerceLinks = []`；無下游 consumer |
| night-22 `d5cfcd0` | commerce-links validator preanalysis（docs-only） | registry-level R1..R15 + content-reference C1..C9 之 rule contract 凍結 |
| night-25 `94a1d47` | commerce links registry-level validator source-only landing | `validate-content.js` 新增 11 條 registry-level rule |
| am-2 `89cbf75` | commerce-links registry fixture mechanism preanalysis | fixture mechanism = Option D（skip settings-level fixtures） |
| am-7 `（per docs filename）` | commerce-links content-reference validation preanalysis | C1..C9 content-reference rule contract 凍結 |
| am-10..12 + `39b89e3` | commerce links content-reference source landing（C1 / C2 / C3 / C5） | `validate-content.js` 新增 `validateCommerceRefs` + `buildCommerceLinkIdSet` |
| `5b81da6` | docs(claude) sync commerce content ref validator state | CLAUDE.md commerce content-ref validator 狀態同步 |
| night-2 `6aeee85` | commerce content-ref C1/C2/C3/C5 fixture preanalysis（docs-only） | 4 個 fixture 之檔名 / frontmatter shape / acceptance 凍結 |
| night-4 `149efdc` | commerce content-ref C1/C2/C3/C5 fixtures landing | 4 個 fixture 落地；baseline 60/53 → 66/57 |
| `1b25b54` | docs(claude) sync commerce content ref fixtures state | CLAUDE.md commerce fixtures state 同步 |
| night-9 `90375ad` | commerce renderer fallback contract preanalysis（docs-only） | 凍結未來 commerce renderer 之 input / fallback / output contract |
| night-11 `（no commit）` | commerce renderer fallback contract acceptance read-only | night-9 contract 已驗收 PASS |
| **night-12（本 phase）** `（本 commit）` | **commerce content-reference C6 coexistence warning preanalysis（docs-only）** | 凍結未來 C6 warning 之 rule id / trigger / direct URL field 候選 / fixture 策略 / baseline 影響選項 / 紅線；**不**實作 C6 source；**不**新增 fixture；**不**改 source / settings / fixtures / templates / production content / CLAUDE.md |

本階段唯一目的為：

> 在 C1 / C2 / C3 / C5 source + fixtures + CLAUDE.md sync 已完成、night-9 renderer fallback contract 已凍結並驗收、empty registry 維持、0 篇 production 用 `ref` 之現況下，**docs-only** 設計未來 commerce content-reference C6 `commerce-ref-direct-url-coexist` warning 之 rule id / trigger / direct URL field 候選 / 與 C3 / C5 之 orthogonal 關係 / fixture 策略 / baseline 影響 / 紅線。為下一個 C6 source phase 提供 contract；**不**自動解封 C6 source；**不**建立 fixture。

本階段為純文件；**不**改 `src/scripts/validate-content.js`、**不**改 `src/scripts/load-settings.js`、**不**改 `content/settings/commerce-links.json`、**不**改任何 content / templates / fixtures / package / CLAUDE.md。

See also：

- `docs/20260607-commerce-renderer-fallback-contract-preanalysis.md`（night-9；renderer fallback contract；§E.5 情境 4 之 selected option 5B = ref 優先 + raw fallback；本檔 C6 trigger 條件與 5B 為對齊設計）
- `docs/20260607-commerce-content-ref-c1c2c3c5-fixture-preanalysis.md`（night-2；C1/C2/C3/C5 fixture cadence；本檔 fixture 策略以此為範本）
- `docs/20260604-commerce-links-content-reference-validation-preanalysis.md`（am-7；§5.7 為 C6 deferred 之原始說明；本檔重新引用 + 擴展）
- `docs/20260603-commerce-links-validator-preanalysis.md`（night-22；§6 C1..C9 rule contract）
- `docs/20260604-commerce-links-registry-fixture-mechanism-preanalysis.md`（am-2；Option D 凍結；fixture mechanism 紅線）
- `CLAUDE.md` §1（不過度工程化）/ §3.2（commerce registry 狀態 + 紅線）/ §12（書評 affiliate.links schema）/ §16（連結處理）/ §27（修改紅線）/ §29（第一版不做清單）

---

## A. Executive Summary

### A.1 一句話結論

> **本文件只設計 C6 coexistence warning，不做 implementation**：凍結未來 C6 `commerce-ref-direct-url-coexist` warning 之 rule id 命名 / trigger 條件 / direct URL 欄位候選（建議只認 `url`；不擴大）/ 與 C1 / C2 / C3 / C5 之 cascade 關係 / fixture 策略（推薦 source-only no fixture）/ baseline 影響選項（推薦 0 fixture / 0 drift）/ 紅線。**不**碰 source / settings / fixtures / templates / production content / renderer / CLAUDE.md；**不**啟動 C6 source；**不**自動解封 renderer / Admin / migration / registry seed。

### A.2 本 phase 目的

- C6 目標：避免同一筆 `affiliate.links[i]` 同時持有 registry-managed `ref` 與直接可渲染之 raw URL 類欄位，造成 renderer 優先順序與治理責任不清。
- 為未來 C6 source phase 提供可直接執行之 rule contract：trigger / message shape / cascade 邊界 / fixture 策略 / baseline 預估。
- 對齊 night-9 renderer fallback contract §E.5（ref 優先；命中用 registry；未命中 fall back raw）；C6 為 validator 層 warning，**不**強迫 renderer 改變行為。
- 將 night-22 + am-7 中尚未凍結之 C6 細節（direct URL 欄位名單 / fixture cascade 是否接受）一次性收斂。

### A.3 本 phase 嚴格邊界

- ❌ 不實作 C6 source（不改 `src/scripts/validate-content.js`）。
- ❌ 不新增 fixture（既有 `_test-commerce-ref-*.md` 不動；不建立 `_test-commerce-ref-direct-url-coexist.md`）。
- ❌ 不改 `content/settings/commerce-links.json`（empty `[]` 維持）；不改 `content/settings/affiliate-networks.json`。
- ❌ 不改 `src/scripts/load-settings.js` / 任一 `src/`。
- ❌ 不改 templates / renderer / EJS / SCSS / JS / build scripts。
- ❌ 不改任何 production content（`content/blogger/posts/` / `content/github/posts/` / `content/shared/posts/` / `content/drafts/` / `content/archive/`）。
- ❌ 不改 templates（`content/templates/`）。
- ❌ 不改 CLAUDE.md（C6 source landing 之 sync 屬獨立 phase）。
- ❌ 不改 `package.json` / `package-lock.json` / `vite.config.js`。
- ❌ 不執行 `npm install` / `npm run build*` / `npm run dev` / `npm run preview`。
- ❌ 不 build / deploy / Blogger repost / GA4 validation。
- ❌ 不解除 reverse UTM dormant；不解除 pm-26 deploy gate；不啟動 Admin Apply / middleware / admin-write-cli。
- ❌ 不 seed production registry；不放入真實 affiliate URL / merchant token / tracking id。
- ❌ 不啟用 C4 / C7 / C8 / C9 source；不啟動 renderer source；不啟動 Admin picker。
- ❌ 不承接 20260606 壞損 NB 之任何資料或結果。
- ❌ 不自動啟動下一階段。

### A.4 立場 spoiler（詳見 §L）

- **Final Idle Freeze / EXIT 為本 phase 結束後預設**。
- 若 user 明確授權推進，建議下一 phase 為「C6 preanalysis acceptance read-only」（docs-only；驗收本檔）→ 之後（若仍要推進）C6 source-only land without fixture（推薦選項 J.5 Option 1）。
- contract 採「append over rewrite」：未來 C6 source landing 應**新增**對 `validateCommerceRefs` 之 C6 branch，**不**重寫 C1 / C2 / C3 / C5 cascade；C6 與 C3 / C5 orthogonal cascade。

---

## B. Current Baseline

| 項目 | 值 |
| --- | --- |
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD（pre-commit）| `90375ad494d43fb9799e42778fb154d3e3099ca2` |
| `HEAD == origin/main`（pre-commit）| yes（ahead / behind = `0 / 0`）|
| working tree（pre-commit）| clean |
| latest subject（pre-commit）| `docs(commerce): plan renderer fallback contract` |
| `npm run validate:content`（pre-commit）| **0 errors / 66 warnings / 57 posts** |

### B.1 Commerce content-reference validator state

- ✅ C1 `commerce-ref-invalid-type`：source + fixture landed。
- ✅ C2 `commerce-ref-empty`：source + fixture landed。
- ✅ C3 `commerce-ref-not-found`：source + fixture landed。
- ✅ C5 `commerce-ref-duplicate-in-post`：source + fixture landed。
- ❌ **C4 `commerce-ref-inactive`**：尚未啟動（需 registry 有 `active: false` entry → coupling Option A；defer）。
- ❌ **C6 `commerce-ref-direct-url-coexist`**：尚未啟動（**本 phase 之設計目標**；source / fixture 皆不在本 phase 範圍）。
- ❌ **C7 `commerce-ref-missing-role`**：不建議啟用（long-tail）。
- ❌ **C8 `commerce-ref-invalid-role`**：尚未啟動（需 enum 凍結後 land）。
- ❌ **C9 `commerce-ref-display-override-risk`**：尚未啟動（需 registry entry → coupling Option A）。

### B.2 Commerce registry state

- `content/settings/commerce-links.json` 維持 empty `{ schemaVersion: 1, updatedAt: "", commerceLinks: [], notes: "" }`（per night-20 `c1a6974`；本 phase 不動）。
- loader（`load-settings.js` lines 59–66）以 `readJsonOptional` read-only 載入；暴露為 `settings.commerceLinks = []`。
- registry-level validator 11 條 warning-only rule landed（per night-25 `94a1d47`）；empty registry → 11 條全 0 觸發。

### B.3 Production content state

- production posts 用 `affiliate.links[].ref` 之文章數：**0**。
- production posts 用 `affiliate.links[].url`（raw URL）之文章數：**1**（`content/blogger/posts/20260515-we-media-myself2.md` lines 65–71；但該 post 之 `affiliate.enabled: false` + `position.top/bottom: false` → renderer 5 條 AND guard 完全不渲染；亦無 `ref` → C6 不觸發）。
- 其餘有 `affiliate:` block 之 production post（`20260504-sample-book-review.md` / `20260525-draft-book-review.md` / `blogger-book-review-template.md` / `blogger-magazine-review-template.md`）皆 `links: []`（empty array）。
- **結論：production 端在 C6 source land 時 0 觸發**（無一 entry 同時有 `ref` 與 raw `url`）。

### B.4 Renderer state

- production renderer 端（`src/views/pages/post-detail.ejs` lines 76–91 / 172–186；`src/views/blogger/blogger-post-full.ejs` lines 61–72 / 99–111）讀取 `link.url` / `link.label` / `link.network` 之 **raw model**；無一條讀 `link.ref`。
- 5 條 AND guard（`affiliate` 存在 / `enabled === true` / `Array.isArray(links)` / `links.length > 0` / `position.top|bottom === true`）皆未變動。
- night-9 renderer fallback contract（docs-only）已凍結；renderer source 仍未啟動。

### B.5 Dormant rails

- C6 source：**未**啟動（本 phase 設計目標）。
- C6 fixture：**未**建立。
- renderer commerce ref-resolve：**未**啟動。
- Admin picker / selector / display：**未**啟動。
- production content migration（raw → ref）：**未**啟動。
- registry seed（真實 affiliate entry）：**未**啟動。
- reverse UTM：**dormant**（per CLAUDE.md §16.4；source pm-24a/b/c landed，未 deploy）。
- pm-26 deploy gate：**BLOCKED**（per CLAUDE.md §3.2）。
- Admin Apply / middleware write / admin-write-cli：**dormant**。
- GA4 commerce dimension / click counter：**未**啟動。

---

## C. Existing Contract References

### C.1 night-9 renderer fallback contract 對 C6 之前置貢獻

per `docs/20260607-commerce-renderer-fallback-contract-preanalysis.md`：

- **§E.5 情境 4（ref 與 raw `url` 同時存在；C6 coexistence）** 為 C6 之語意對齊核心：
  - selected option **5B**（ref 優先；命中用 registry；未命中 fall back raw）。
  - renderer 行為**不**因 C6 啟用而改變；C6 只在 validator 層 warn 作者。
  - C6 warning 訊息語意：「raw url 可移除（在 migration 完成後）」；但**不**強迫 renderer 阻擋 build / 不強迫 raw url 立即刪除。
- **§C.1 形態 2（ref + raw coexist）** 為 C6 之 trigger 形態：
  ```yaml
  affiliate:
    links:
      - ref: "book-atomic-habits-kingstone"
        label: "金石堂：實體書"
        network: "聯盟網"
        url: "https://..."          # ← C6 trigger（ref 非空 + url 非空）
  ```
- **§G.2 validator vs renderer 邊界**：renderer 必須在 C6 warning 存在時仍能生成 HTML（mirror download renderer preanalysis §8.4）；validator 為 warning-only，永不 block build。

### C.2 night-2 fixture contract 對 C6 fixture cadence 之參考

per `docs/20260607-commerce-content-ref-c1c2c3c5-fixture-preanalysis.md`：

- §5 fixture frontmatter 基線：`status: "ready"` + `seo.indexing: "noindex-follow"` + `contentKind: "book-review"` + fixture 命名空間 `affiliate.links[].ref`。
- §5.6 紅線：fixture 內**絕對不可**包含真實 affiliate URL / token / merchant id。
- §6.2 Design 2（推薦）：empty registry 下接受 orthogonal cascade（如 C5 fixture 帶 +2 × C3）；對 C6 fixture 同樣為候選策略。
- 但 night-2 §10.3 之下一 phase 建議僅涵蓋 C1 / C2 / C3 / C5；C6 fixture 屬獨立 phase。

### C.3 am-7 §5.7 C6 原始 deferred 理由

per `docs/20260604-commerce-links-content-reference-validation-preanalysis.md` §5.7：

- C6 rule id 原始候選：`commerce-ref-local-url-coexistence-warning`（**本檔將推薦更短之命名**；per §F.1 比較）。
- C6 啟動條件（am-7 §5.7）：
  - (1) renderer fallback phase 完成（ref lookup live）→ **本檔對 (1) 之 contract 凍結**；renderer source **未** landed；故 (1) 仍未完整滿足。
  - (2) user explicit approval 啟動 migration phase → **未**滿足。
  - (3) C6 fixture 先建（fixture-first；確認不殃及 production post）→ 本檔**不**裁決 fixture-first 必然性（per §H 提供 source-only no fixture 為主要推薦）。
  - (4) 啟用後仍 warning-only，不阻擋 build → ✅ 設計恆定。
- C6 deferred 理由（am-7 §5.7）：
  - 批次 warn 會推作者匆忙改 frontmatter，違反「不自動替換 raw URL」紅線。
  - renderer 未落地時 warn 無資訊量（前台仍走 raw fallback）。
  - mirror download：先 land empty registry + shape rule，再 fixture-first 補 content-reference。
- 本檔**不**反轉 am-7 之 deferred 立場；本檔僅**將 C6 設計細節凍結**，使未來 C6 source phase 可在 (1)(2) 條件滿足時直接執行。

### C.4 既有 `validateCommerceRefs` 結構

per `src/scripts/validate-content.js` lines 567–655（landed Phase 20260604-am-10；commit `39b89e3`）：

```text
validateCommerceRefs(affiliate, sourcePath, issues, commerceLinkIdSet)
  guard：affiliate 非 plain object → return
  guard：affiliate.links 非 array → return
  per-entry loop（i）：
    entry 非 plain object → continue
    ref === undefined → continue
    C1（ref 非 string）→ 報 C1；continue
    C2（trim 空）→ 報 C2；continue
    C3（trim 非空 + commerceLinkIdSet !== null + !set.has(trimmed)）→ 報 C3（不 continue）
  per-post duplicate loop：
    C5（trim 後 case-sensitive duplicate；每個 dup key 1 warning）
```

**現有 source 已存在 C1 / C2 / C3 / C5 之 5 個 issue push points；未有 C6 push point**。C6 source 落地時建議：

- 新增**一個** per-entry C6 push point；位置在 C2 之後、C3 之前或之後皆可（per §F.4 cascade 設計）。
- **不**重寫既有 5 個 push point；**不**改動 cascade `continue` 邏輯（C1 / C2 之 cascade 為 mutually exclusive；C6 與 C3 / C5 為 orthogonal）。

---

## D. Problem Definition

### D.1 為何需要 C6

> 一篇文章之 `affiliate.links[i]` 在引入 `ref` 後，可能同時持有：
>
> 1. `ref`（指向 `commerce-links` registry 之 `linkId`；集中管理 target URL / display label / network / active 狀態）
> 2. raw URL 類欄位（如 `url`；直接寫死可渲染之 affiliate URL）
>
> 此「ref + raw URL coexist」狀態為 **migration 過渡期之必然形態**（per night-9 §C.1 形態 2 + am-7 §5.7）：作者新增 `ref` 但暫時保留 raw `url` 作為 safety net；待 registry seed 完成 + renderer 落地後，作者再逐篇移除 raw `url`。

### D.2 同時存在會造成

| # | 痛點 |
| --- | --- |
| D.2.1 | renderer 到底用 ref-resolved URL 或 direct URL 不清楚（per night-9 §E.5 已選 5B 解決；validator 無從觀察 renderer 之實際選擇）|
| D.2.2 | registry 集中治理被繞過（作者可能誤以為 raw url 才是 live URL；忘記 ref 已可生效）|
| D.2.3 | 未來 migration 難以驗證（無 warning 提示作者「ref 已就位、raw url 可移除」）|
| D.2.4 | 真實 affiliate URL 可能重新散落於 production frontmatter（即使 registry seed 完成，raw url 仍長期殘留）|
| D.2.5 | validator 與 renderer 之治理責任不一致：renderer 已選 ref 優先；validator 卻沒有提示 raw url 為冗餘 |

### D.3 C6 不解決的問題

- ❌ C6 **不**自動移除 raw url（非 codemod；不改 frontmatter）。
- ❌ C6 **不**阻擋 build / 不轉 error（warning-only）。
- ❌ C6 **不**保證 renderer 行為正確（renderer 行為由 renderer source phase 保證）。
- ❌ C6 **不**保證 ref 命中 registry（命中與否由 C3 處理）。
- ❌ C6 **不**驗證 raw url 合法性（如 `^https?://`；屬未來 raw url shape rule，本檔不裁決）。
- ❌ C6 **不**驗證 raw url 與 ref 解析結果是否一致（registry resolution 結果無法在 validator 端比對；屬未來 renderer-level 驗證）。

---

## E. Candidate Direct URL Field Names

### E.1 grep 範圍

`content/**/*.md`（production posts + templates + fixtures），於 `affiliate:` block 內之 `links[]` array entry：

```text
content/blogger/posts/20260515-we-media-myself2.md:66-71
  - label: "博客來：實體書"
    network: "通路王"
    url: "https://whitehippo.net/3QaKr?uid1=blog"
  - label: "金石堂：實體書"
    network: "聯盟網"
    url: "https://adcenter.conn.tw/3QaLi?uid1=blog"
```

其餘 production / template / fixture 全為 `links: []`（empty）或 `links: [{ ref: ... }]`（C1..C5 fixtures）。

### E.2 三類欄位整理

#### E.2.1 現有實際使用欄位（**只有一個**）

| 欄位 | 出現位置 | renderer 是否讀取 |
| --- | --- | --- |
| `url` | `content/blogger/posts/20260515-we-media-myself2.md` lines 68 / 71；template 範例（per night-9 §C.1 形態 2 / 3 設計討論）| ✅ `post-detail.ejs` lines 86 / 182；`blogger-post-full.ejs` lines 69 / 107 |

**結論：production 端與 renderer 端對 raw URL 之唯一既定欄位名為 `url`**。

#### E.2.2 可能未來保留欄位（**本檔不建議擴大支援**）

| 欄位 | 來源 | 推薦處置 |
| --- | --- | --- |
| `href` | HTML `<a>` 屬性命名習慣；非本專案既有命名 | ❌ 不建議在 frontmatter 使用；renderer / template 採 `link.url` 而非 `link.href` |
| `targetUrl` | `commerce-links` registry 之 `linkId` entry 欄位（per night-18 schema）| ❌ **僅**於 registry 端使用；**不**應出現在 post frontmatter（avoid 命名混淆）|
| `linkUrl` | 無既有使用 | ❌ 不建議 |
| `directUrl` | 無既有使用 | ❌ 不建議 |
| `affiliateUrl` | 無既有使用 | ❌ 不建議；冗餘語意（`affiliate.links[].affiliateUrl` 重複前綴）|
| `rawUrl` | 無既有使用 | ❌ 不建議 |

#### E.2.3 不建議支援欄位（C6 trigger 範圍**外**）

per §E.2.2 之拒絕理由 + 下列額外紅線：

- 任何 query-string-only 欄位（如 `query` / `params`）→ 不在 affiliate `links[]` 範圍。
- 任何 deep-link / tracking-id 欄位（如 `trackingId` / `subId` / `aff_id`）→ 屬通路特定參數，**不**應出現在 post frontmatter（per CLAUDE.md §3.2 commerce 治理紅線）。
- 任何 base URL + path 拆分（如 `baseUrl` + `path`）→ 過度工程化（violation CLAUDE.md §1）。

### E.3 C6 推薦只認 `url`

> **強烈推薦：C6 trigger 只認 `entry.url` 為 raw direct URL 欄位**。

理由：

1. **production 既有使用**：唯一實際出現之 raw URL 欄位（per §E.2.1）。
2. **renderer 既有讀取**：`post-detail.ejs` / `blogger-post-full.ejs` 兩端皆讀 `link.url`（per §B.4）。
3. **避免 false positive**：擴大支援會誤觸 typo（作者打成 `linkUrl` 不被認為 raw url → C6 漏報；validator 無法在不知作者意圖下推斷）。
4. **避免 false negative**：擴大支援會引入「validator 認為 C6 trigger 但 renderer 不認」之治理不一致（per §G）。
5. **mirror download R-series cadence**：download asset ref / form ref 只認既定 `assetRefs[]` / `formRef` 欄位；不擴大 alias。

未來若需新增 raw URL 欄位（如 `href`），**獨立 phase** 評估：
- (a) renderer 已能正確讀取該欄位；
- (b) 既有 production 已有使用之 evidence；
- (c) C6 trigger 同步擴展。

本檔**不**承諾未來會擴大支援；**不**承諾 `url` 為唯一永久欄位。

---

## F. Proposed C6 Rule Semantics

### F.1 Rule id 命名比較

| 候選 rule id | 字數 | 與既有 C 系列命名一致性 | 語意清晰 | 推薦？ |
| --- | --- | --- | --- | --- |
| `commerce-ref-direct-url-coexist` | 31 chars | ✅ 對齊 `commerce-ref-*` 既有 prefix（C1 / C2 / C3 / C5）| ✅ 「ref 與 direct url 共存」直觀 | ✅ **推薦** |
| `commerce-ref-url-coexist` | 24 chars | ✅ 對齊 prefix；最短 | ⚠️ `url` 不明示為 direct / raw；可能誤解為「ref 指向之 URL」 | ⚠️ 次選 |
| `commerce-ref-local-url-coexistence-warning` | 42 chars | ⚠️ am-7 §5.7 原始候選；過長；尾綴 `-warning` 冗餘（severity 已表達在 issue 結構之 `severity: 'warning'`）| ⚠️ `local-url` 與 raw url 不直觀對應 | ❌ 不推薦 |
| `commerce-ref-raw-url-coexist` | 27 chars | ✅ 對齊 prefix | ⚠️ `raw-url` 在 ref/registry 語境內亦清晰，但 production 已既有 `url` 命名，無需強調 `raw` | ⚠️ 第三選 |
| `commerce-ref-coexist` | 20 chars | ✅ 對齊 prefix；最短 | ❌ 過於模糊（與什麼 coexist？）| ❌ 不推薦 |

### F.2 推薦 rule id

> **`commerce-ref-direct-url-coexist`**

理由：

- 對齊既有 `commerce-ref-*` 命名 prefix（C1 / C2 / C3 / C5）。
- `direct-url` 明示為「直接寫入 frontmatter 之 URL」，與 registry-resolved 之間接 URL 對比清晰。
- `coexist` 動詞清晰表達兩欄位同時存在。
- 不含 `-warning` 尾綴（severity 由 `issues.push({ severity: 'warning', ... })` 表達）。
- 與既有 download / related-links / book 系列之 rule id 命名習慣（多單字 kebab-case）一致。

### F.3 Trigger 條件

#### F.3.1 觸發條件（per-entry）

對於 `post.affiliate.links[i]` 每個 entry：

```text
TRIGGER C6 当且仅当以下 5 项全部满足:
  (1) entry 為 plain object（非 null / 非 array）
  (2) entry.ref 為 non-empty trimmed string（C1 / C2 已 cascade pass 之 entry）
  (3) entry.url 為 string（typeof === 'string'）
  (4) entry.url.trim() 非空字串
  (5) [optional] C1 / C2 已不觸發於該 entry（透過 cascade 自動滿足）
```

#### F.3.2 不觸發條件

- ❌ `ref` invalid type → 由 C1 處理；C6 不額外觸發（C1 cascade `continue` 後不進 C6 判定）。
- ❌ `ref` empty / whitespace → 由 C2 處理；C6 不額外觸發（C2 cascade `continue` 後不進 C6 判定）。
- ❌ `ref` not found（但 ref 非空且 typeof string）→ 由 C3 處理；**C6 仍可觸發**（C3 與 C6 orthogonal；ref 存在於 frontmatter 即視為「作者宣告使用 registry」，無論是否命中）。
- ❌ `url` 欄位不存在（`entry.url === undefined`）→ 不觸發 C6。
- ❌ `url` 為非 string（如 number / null / array / object）→ **不觸發 C6**（屬 raw url shape rule 範圍；本檔不裁決 raw url type validation）。
- ❌ `url` 為 empty / whitespace-only string → 不觸發 C6（作者保留欄位但無有效值；無治理風險）。
- ❌ entry 非 plain object（per `validateCommerceRefs` 現有 guard line 587）→ 整 entry skip；C6 沿用既有 guard。
- ❌ `affiliate` 非 plain object 或 `affiliate.links` 非 array → 整段 skip（per `validateCommerceRefs` 現有 guard lines 581–583）。

#### F.3.3 Message shape

```text
affiliate.links[<i>] ref and url coexist (migration mode; remove url once renderer landed)
```

範例：

```text
affiliate.links[0] ref and url coexist (migration mode; remove url once renderer landed)
```

- 採祈使語氣「remove url once renderer landed」提示作者**未來**動作；**不**強迫立即移除。
- 不含真實 url value（避免 log 內洩漏 affiliate URL；mirror download 紅線）。
- 不含 ref value（避免 log 過長；ref 與 C3 message 之 ref value 重複時對作者無新資訊）。

### F.4 Cascade 關係（C6 與 C1 / C2 / C3 / C5）

#### F.4.1 Cascade ordering（建議實作位置）

C6 source 落地時，建議在 `validateCommerceRefs` per-entry loop 內之**位置選項**：

| 選項 | 位置 | 取捨 |
| --- | --- | --- |
| 位置 A | 在 C3 之後（同一 entry 之 C3 報完才報 C6） | ⚠️ 較易閱讀；同一 entry warning 順序 = invalid-type → empty → not-found → coexist |
| 位置 B | 在 C3 之前 | ⚠️ 無實質差異；message 順序為 coexist → not-found |
| 位置 C | 與 C3 同一 condition block 內 | ❌ 不推薦；混合兩條 rule 之 condition 易出錯 |

**推薦位置 A**（per-entry：C1 → C2 → C3 → C6 → continue；C5 為 per-post duplicate loop，獨立）。

#### F.4.2 Cascade 邏輯（per entry，僞代碼）

```text
for each entry:
  if entry not plain object → continue
  if entry.ref === undefined → continue

  if typeof entry.ref !== 'string':
    push C1; continue    # cascade exit

  trimmed = entry.ref.trim()
  if trimmed === '':
    push C2; continue    # cascade exit

  # C3 / C6 orthogonal（皆 don't continue；entry 可同時觸發）
  if commerceLinkIdSet !== null and not set.has(trimmed):
    push C3
  if typeof entry.url === 'string' and entry.url.trim() !== '':
    push C6
  # 不 continue；entry 之 per-entry 處理結束
```

per-post C5 duplicate loop 維持既有設計（lines 634–654）；C6 與 C5 orthogonal。

#### F.4.3 Mutual exclusion / Orthogonality matrix

| Pair | 關係 | 同一 entry 可同時觸發？ |
| --- | --- | --- |
| C1 ↔ C2 | 互斥 cascade（C1 觸發 continue） | ❌ |
| C1 ↔ C3 | 互斥 cascade（C1 觸發 continue） | ❌ |
| C1 ↔ C5 | 互斥 cascade（C1 entry skip duplicate map per line 639） | ❌ |
| **C1 ↔ C6** | **互斥 cascade（C1 觸發 continue；C6 不 reach）** | ❌ |
| C2 ↔ C3 | 互斥 cascade（C2 觸發 continue） | ❌ |
| C2 ↔ C5 | 互斥 cascade（empty ref 不進 duplicate map per line 641） | ❌ |
| **C2 ↔ C6** | **互斥 cascade（C2 觸發 continue；C6 不 reach）** | ❌ |
| C3 ↔ C5 | orthogonal | ✅ |
| **C3 ↔ C6** | **orthogonal**（per F.3.2）；同一 entry 可同時觸發 | ✅ |
| **C5 ↔ C6** | **orthogonal**（intra-post duplicate ref 同時帶 url；同一 entry 可同時觸發 C5 + C6；不同 entry 之 C5 不相關）| ✅ |

### F.5 與 C3 / C5 之 fixture cascade 設計取捨

per §H 之 fixture 策略：

- **若採 source-only no fixture**（推薦）→ orthogonal cascade 不需在 fixture 內驗證；C6 之單元測試由 source review 提供。
- **若採 source + fixture**：
  - empty registry 下 fixture 內非空 ref 必觸發 C3 not-found（mirror C5 fixture cascade per night-2 §3.4）。
  - C6 fixture 預期觸發 = 1 × C6 + 1 × C3（per entry；orthogonal cascade）。
  - 與 night-2 §6.2 Design 2 cadence 一致；接受 cascade。

### F.6 與 C4 / C8 / C9 之關係

- C4 `commerce-ref-inactive`：未啟動；C6 與 C4 將為 orthogonal（同一 entry 可同時 inactive + coexist）。
- C8 `commerce-ref-invalid-role`：未啟動；C6 與 C8 orthogonal。
- C9 `commerce-ref-display-override-risk`：未啟動；C6 與 C9 orthogonal。
- 本檔**不**裁決 C4 / C8 / C9 之啟動順序；**不**依賴 C4 / C8 / C9 為 C6 source 之前置。

---

## G. Renderer Relationship

### G.1 night-9 renderer fallback contract 已凍結 ref priority + fail-closed

per `docs/20260607-commerce-renderer-fallback-contract-preanalysis.md`：

- §E.5 selected option **5B**：ref 命中 → 用 registry `targetUrl`；ref not-found / inactive → fall back raw `url`。
- §E.7 cascade summary table 之情境 4「ref+raw 命中」與「ref+raw 未命中」皆為 valid render 路徑。
- §K.3 renderer 永久紅線：renderer 永不讓 frontmatter / registry 覆寫 `rel` / `target`。

### G.2 C6 不改 renderer

- C6 為 **validator 層 warning**；**不**改 renderer 之輸出行為。
- 即使 C6 觸發於某 entry，renderer 仍按 §E.5 5B 渲染（ref 命中 → registry；未命中 → raw fallback）。
- C6 warning 之目的是**提示作者**「raw url 可在 migration 完成後移除」；renderer **不**負責告知作者。
- C6 與 renderer **完全解耦**：renderer 可在 C6 source 啟動前完成 implementation；renderer 也可在 C6 source 啟動後不做任何改動。

### G.3 C6 source 不自動啟動 renderer implementation

🔑 **本檔紅線**：C6 source phase 落地時，**不**得連帶啟動：

- renderer source（任一 EJS / build script 變動）。
- registry seed（任何真實 affiliate entry 寫入 `commerce-links.json`）。
- production content migration（任一 production post 之 `affiliate.links` 變動）。
- Admin picker / selector / display。
- reverse UTM activation / pm-26 unblock / Admin Apply / middleware / admin-write-cli。

C6 source phase 之變動範圍應**僅限**：

- `src/scripts/validate-content.js`（新增 C6 push point）。
- 可選：CLAUDE.md sync（屬獨立 sync phase）。
- 可選：C6 fixture（屬獨立 fixture phase，per §H）。

### G.4 C6 source 不自動啟動 production migration

- production 0 篇用 `ref` → C6 source land 後 production 不觸發 C6。
- 即使未來 production 加入第一篇用 `ref` 之 post，C6 trigger 僅在「同時帶 raw `url`」時才報。
- migration 永遠須作者**逐篇明示**：作者新增 ref 之同時，可選擇保留 raw url 作為 safety net（C6 warn 但不阻擋）；或同時移除 raw url（無 C6 warn）。
- C6 **不**強迫作者移除 raw url；**不**為 migration 設 deadline。

---

## H. Fixture Strategy

### H.1 本 phase 不建立 C6 fixture

- ❌ 本檔**不**新增任何 fixture（既有 4 個 `_test-commerce-ref-*.md` 不動）。
- ❌ 本檔**不**設計 fixture frontmatter 之最終實作；以下為**未來 fixture phase**（若啟動）之 contract。

### H.2 未來 C6 fixture filename 建議

per night-2 §4.1 path convention：

```text
content/validation-fixtures/blogger/posts/_test-commerce-ref-direct-url-coexist.md
```

- filename 與 §F.2 推薦 rule id 完全對齊。
- 採 `blogger/` 子目錄（mirror 既有 C1 / C2 / C3 / C5 fixtures 路徑；affiliate.links 為書評語意）。
- prefix `_test-` 區隔 production post（validator 已掃 `content/validation-fixtures/`；build:github / build:blogger 不掃）。

### H.3 未來 C6 fixture frontmatter 最小設計

mirror night-2 §5.1 共同基線：

```yaml
---
title: "[validation-fixture] commerce ref direct url coexist"
slug: "test-commerce-ref-direct-url-coexist"
status: "ready"
draft: false
date: "<future-date>"
description: "Phase <future> fixture：故意觸發 commerce-ref-direct-url-coexist warning（C6）+ 1 × commerce-ref-not-found（orthogonal cascade，empty registry 下無法避免）。"
contentKind: "book-review"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
seo:
  indexing: "noindex-follow"
affiliate:
  enabled: true
  disclosure: "（fixture）本文為 validation fixture，無真實聯盟連結。"
  links:
    - ref: "__nonexistent-commerce-ref-coexist__"
      url: "https://example.invalid/commerce-fixture"
---
```

### H.4 Fixture 紅線

🔴 fixture frontmatter 內**絕對不可**：

- ❌ 包含真實 affiliate URL（不可使用真實博客來 / 蝦皮 / momo / 聯盟網 / 通路王 URL；per night-9 §F.5 + CLAUDE.md §3.2）。
- ❌ 包含真實 merchant tracking id / affiliate token / OAuth secret / Authorization header。
- ❌ 與 production 真實 / 未來 commerce-links registry 之 `linkId` 命名衝突（建議 fixture 命名空間：`__nonexistent-*-coexist__`）。

**推薦 url 採 reserved-domain placeholder**：

| 候選 placeholder URL | RFC 安全性 | 推薦？ |
| --- | --- | --- |
| `https://example.invalid/commerce-fixture` | ✅ `.invalid` TLD 為 RFC 2606 reserved；保證永不解析 | ✅ **推薦** |
| `https://example.com/commerce-fixture` | ✅ RFC 2606 reserved；可解析至 IANA placeholder | ⚠️ 次選；可能誤導為真實 URL |
| `https://localhost/commerce-fixture` | ⚠️ 可能解析至本機 | ❌ 不推薦 |
| `http://localhost:0/commerce-fixture` | ⚠️ 同上 | ❌ 不推薦 |

→ **推薦 `https://example.invalid/commerce-fixture`**（與 night-9 §F.5 之 placeholder 設計建議一致；mirror RFC 2606）。

### H.5 預期觸發 warning 計數

empty registry 下，fixture 之 `ref` 必觸發 C3 not-found（orthogonal cascade；無法避免）：

| stage | posts | warnings |
| --- | --- | --- |
| current（本 phase 後）| 57 | 66 |
| FC6 land（1 entry：ref + url 同時存在；ref 不在 empty registry） | +1 | +2 |
| FC6 預期 | **58** | **68** |

→ FC6 land 帶 +2 warnings（1 × C6 + 1 × C3；orthogonal cascade）。

mirror C5 fixture（per night-2 §3.4；landed 為 1 × C5 + 2 × C3 = +3 warnings）之 cascade cadence；fixture description 內須明確記載「預期觸發 2 個 warning（1 × C6 + 1 × C3）」。

### H.6 比較三策略（接受 cascade vs 避免 cascade vs 不建 fixture）

| 策略 | 描述 | baseline drift | 紅線 | 推薦？ |
| --- | --- | --- | --- | --- |
| **H-α**：source-only no fixture | C6 source land；不建 fixture；coverage 倚賴 source review + 本檔 rule contract | 0/66/57（不變） | ✅ 無 | ✅ **推薦**（per §I Option 1） |
| **H-β**：source + 1 fixture（接受 cascade）| C6 source + 1 fixture；empty registry 下接受 +1 × C3 cascade | 0/68/58 | ✅ 無 | ⚠️ 次選（per §I Option 2） |
| **H-γ**：先做 fixture-registry strategy docs，再做 C6 fixture | 規劃 seeded test registry 避免 C3 cascade | 0/66/57（不變；docs-only）| ⚠️ 須擴 loader + 新 fixture-mode code path（違反 am-2 Option D）| ❌ 不推薦（per §I Option 3） |

→ 推薦 **H-α**（source-only no fixture）；mirror C1..C5 之 source-only-first cadence（per am-7 §6.2）+ download R-series source-only-first 範本。

---

## I. Expected Baseline Impact

⚠️ **本檔不執行 source landing**；以下為**未來 C6 source phase**（若啟動）之 baseline 預估。

### I.1 Option 1（推薦）：source only, no fixture

- C6 source land；不建 fixture。
- production 0 篇用 ref → C6 source 在 production 不觸發。
- baseline：**0 errors / 66 warnings / 57 posts**（drift = 0）。
- 優點：
  - mirror C1..C5 之 source-only-first cadence。
  - 與 download R-series 之 source-only-first 範本一致（per am-7 §6.2）。
  - 無 cascade 雜訊；validator regression 易識別。
  - source land 後 review 即可確認 C6 邏輯；不依賴 fixture coverage。
- 缺點：
  - C6 fixture coverage 不在 baseline 內可見（須由 source review 與本檔 rule contract 共同保證）。
  - 未來作者偶爾觸發 C6 時，無歷史 fixture 可對照預期 warning shape（但本檔 §F.3.3 已凍結 message shape）。

### I.2 Option 2：source + one fixture（empty registry 接受 cascade）

- C6 source land；同 phase 或下一 phase 新增 1 個 fixture。
- fixture 設計：1 entry 同時 `ref` + `url`；ref 不在 empty registry。
- 預期觸發：1 × C6 + 1 × C3 = +2 warnings；fixture +1 post = +1 post。
- baseline：**0 errors / 68 warnings / 58 posts**（drift = +2 warnings / +1 post）。
- 優點：
  - fixture-driven coverage 可見於 baseline；validator regression 直接被 baseline diff 抓到。
  - 與 C5 fixture cascade cadence（1 × C5 + 2 × C3）一致；既有作者已熟此設計。
  - C6 message shape 之 fixture evidence 永久 frozen。
- 缺點：
  - 同 phase land source + fixture 違反 source-only-first cadence（per am-7 §6.2）；建議拆 2 phases。
  - cascade noise 略增（68 vs 66）。

### I.3 Option 3：先做 fixture-registry strategy docs，再做 C6 fixture

- 規劃「seeded test registry」（mirror am-2 §10 Option A escape hatch）：
  - 新增 `content/validation-fixtures/settings/commerce-links/_test-<purpose>.json`；
  - 擴 loader 暴露 raw registry + 新 fixture-mode code path；
  - 修改 sourcePath 改寫；
  - C6 fixture 之 ref 命中 seeded registry → C3 not 觸發 → fixture 只觸發 1 × C6。
- baseline（docs-only phase）：0/66/57（不變）。
- baseline（source land 後）：0/67/58（+1 C6 only）。
- 優點：
  - C6 fixture 不帶 C3 cascade noise（cleaner baseline）。
- 缺點：
  - 違反 am-2 Option D 凍結（settings-level fixture mechanism deferred）。
  - 違反 CLAUDE.md §1 不過度工程化（loader + fixture-mode code path + sourcePath 改寫之擴增僅為 1 個 fixture 之 cleanliness 而新增）。
  - 風險集中於 loader 改動；可能影響既有 11 條 registry-level rule 之 fixture 路徑解析。
  - 不必要的中間 phase（fixture-registry strategy preanalysis + implementation）。
- ❌ 不推薦。

### I.4 推薦最保守選項

> **推薦 Option 1（source only, no fixture；H-α）**

理由：

1. **最保守**：baseline 0 drift；validator regression 易識別；不引入新 fixture-mode code path。
2. **mirror C1..C5 cadence**：C1 / C2 / C3 / C5 之 source-only land（commit `39b89e3`）至 fixture land（commit `149efdc`）之間經過 3 天 + 多個獨立 phase；C6 應沿用此 cadence。
3. **fixture 可獨立 phase land**：若未來 user 認為 fixture coverage 必要，可在 C6 source land 後**獨立 phase** 補 fixture（per Option 2）；本檔**不**承諾 fixture phase 必然啟動。
4. **減少 phase 內變動範圍**：C6 source phase 之 git diff scope 可極簡（僅 `src/scripts/validate-content.js`）；review 成本最低。

### I.5 不推薦選項

- ❌ Option 3（fixture-registry strategy）：違反 am-2 / CLAUDE.md §1。
- ❌ 任何 C6 source + fixture + registry seed 同 phase land：違反多項紅線；風險集中。
- ❌ 任何 C6 source + production content migration 同 phase land：違反 §G.3 + §G.4。

---

## J. Source Implementation Boundary

⚠️ **本檔不執行 source landing**；以下為**未來 C6 source phase**（若啟動）之 scope。

### J.1 允許之修改範圍

- ✅ `src/scripts/validate-content.js`：在 `validateCommerceRefs`（lines 567–655）per-entry loop 內新增 C6 push point（位置 A 推薦；per §F.4.1）。
- ✅ `src/scripts/validate-content.js` 內可選新增 inline comment 說明 C6 之 cascade 邏輯（mirror 既有 C1 / C2 / C3 / C5 之 inline 註解 cadence）。

### J.2 禁止之修改範圍

- ❌ **不**改 `src/scripts/load-settings.js`（C6 不需新增 loader 資料；ref + url coexistence 完全在 post frontmatter 範圍內）。
- ❌ **不**改 `content/settings/commerce-links.json`（empty `[]` 維持）。
- ❌ **不**改 `content/settings/affiliate-networks.json` 或其他 settings JSON。
- ❌ **不**改 renderer / templates / EJS / SCSS / JS / build scripts。
- ❌ **不**改任何 production content / templates / drafts / archive。
- ❌ **不**新增 fixture（per §H.1 + §I.1）。
- ❌ **不**改 CLAUDE.md（sync 屬獨立 phase）。
- ❌ **不**改 `package.json` / `package-lock.json` / `vite.config.js`。

### J.3 Severity 不變

- C6 為 **warning-only**；**不**轉 error。
- 與 C1 / C2 / C3 / C5 同 severity；沿用既有 `issues.push({ severity: 'warning', ... })` cadence。

### J.4 Build / Deploy 不啟動

- C6 source phase **不**執行 `npm run build*` / `dev` / `preview` / `validate` 以外之 npm scripts。
- C6 source phase **不**觸發 build / deploy / Blogger repost / GA4 validation。
- C6 source phase 之唯一 verify command 為 `npm run validate:content`。

### J.5 Production 0 影響

- production 0 篇用 `ref` → C6 source land 後 production 不觸發 C6（per §B.3 + §G.4）。
- 即使未來 production 加入第一篇用 `ref` 之 post，C6 trigger 僅在「同時帶 raw `url`」時才報；不阻擋 build。

---

## K. Non-goals / Red Lines

### K.1 本 phase 紅線（必須 enforced）

明確列出本文件**不**處理：

- ❌ **C6 source implementation**（不改 `src/scripts/validate-content.js` 任一字符）
- ❌ **C4 / C7 / C8 / C9 source**（不啟動）
- ❌ **renderer source**（任一 EJS template / build script / EJS partial 變動）
- ❌ **template changes**（`src/views/pages/post-detail.ejs` / `src/views/blogger/blogger-post-full.ejs` / 任一 `.ejs` 不動）
- ❌ **Blogger renderer changes**（`build-blogger.js` / `blogger-post-summary.ejs` / `blogger-redirect-card.ejs` 不動）
- ❌ **registry seed**（`content/settings/commerce-links.json` 維持 empty `[]`）
- ❌ **real affiliate URL / merchant token / tracking id / OAuth secret / API key / Authorization header / 帳號 email / 結算密碼 / 私人 Drive folder ID**（docs / fixtures / templates / production content 任一檔案內**不**貼）
- ❌ **production content migration**（既有 `affiliate.links` 不動；既有 production posts 之 `affiliate.links: []` / 既有 raw `url` 維持）
- ❌ **Admin picker / Admin Apply**（dormant 維持）
- ❌ **middleware route**（dormant 維持）
- ❌ **admin-write-cli**（dry-run / apply 皆 dormant）
- ❌ **new fixtures**（不新增任何 `.md` / `.json` fixture；既有 fixture 不修改 / 不刪除）
- ❌ **build / deploy**（`npm run build*` / `dev` / `preview` 不執行；`dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `gh-pages` 不碰）
- ❌ **Blogger repost**（Blogger 後台不重貼；無觸發 GA4 Realtime 驗收）
- ❌ **GA4 validation**（DebugView / Realtime / commerce dimension 全 dormant）
- ❌ **reverse UTM activation**（reverse UTM 維持 dormant；Blogger→GitHub source landed but un-deployed 狀態維持）
- ❌ **pm-26 unblock**（pm-26 deploy gate 維持 BLOCKED）
- ❌ **CLAUDE.md 修改**（若需 sync C6 狀態 → 另開 docs-sync phase）
- ❌ **package change**（`package.json` / `package-lock.json` / `vite.config.js` 不動）
- ❌ **`npm install`**（不執行）
- ❌ **MEMORY / project memory 修改**（除非 user 另行要求）
- ❌ **自動啟動下一階段**

### K.2 governance 紅線（與 CLAUDE.md §3.2 commerce 治理紅線一致）

- ❌ **永不**含 affiliate dashboard credentials（email / password / OAuth client secret / API key）
- ❌ **永不**含 access token / bearer token / refresh token / session id / Authorization header
- ❌ **永不**含 commission / payout / clickCount 等 dashboard 統計
- ❌ **永不**含帳號 email / 結算密碼 / 私人 Drive folder ID
- ❌ **不**用 URL pattern 自動推斷 `merchantKey` / `networkKey` / `linkId`；所有 key 由作者明示填寫
- ❌ **禁止**為 fixture 修改 production `affiliate-networks.json`；R11 fixture 須採「故意不存在 networkKey」設計
- reverse UTM remains **dormant**；pm-26 deploy gate remains **BLOCKED**
- Admin Apply / middleware write / admin-write-cli remain **dormant**

### K.3 C6 source 永久紅線（適用於未來 C6 source landing phase）

未來 C6 source 落地時必須**永久 enforce**：

- ❌ **C6 永遠為 warning-only**；不轉 error。
- ❌ **C6 不自動移除 raw url**（非 codemod）。
- ❌ **C6 不自動 migrate raw → ref**（mirror night-9 §K.3 renderer 永久紅線）。
- ❌ **C6 不阻擋 build / 不阻擋 dist 輸出**。
- ❌ **C6 不啟動 renderer / Admin / migration / registry seed**（per §G.3）。
- ❌ **C6 不啟動 reverse UTM / pm-26 / Admin Apply / GA4 commerce dimension**。
- ❌ **C6 不暴露 ref / url value 於 log 內可見之 affiliate token / tracking id**（per §F.3.3 message shape）。

---

## L. Recommended Next Phase

⚠️ **本 phase 不自動啟動下一階段**；以下為**候選**順序，由 user 各自獨立 prompt 決定。

### L.1 候選順序（保守建議）

```
1. Final Idle Freeze / EXIT（本 phase 結束後預設）
2. C6 preanalysis acceptance read-only（docs-only；驗收本檔）
3. （若仍要推進）二選一：
   - 3a. C6 source-only implementation without fixture（推薦；per §I Option 1；H-α）
   - 3b. C6 fixture strategy docs-only（次選；若 user 認為 fixture coverage 必要）
4. （若仍要推進）C6 fixture phase（per §I Option 2；H-β）
5. （若仍要推進）C4 / C8 / C9 data model / enum / fixture preanalysis（各為獨立 docs-only phase）
6. （若仍要推進）Admin picker contract preanalysis（docs-only）
7. （若仍要推進）registry seed policy preanalysis（docs-only）
8. （若仍要推進）renderer source implementation（需 user 明確授權；遠未到此 step）
9. （若仍要推進）controlled production migration（需 renderer + C6 source landed + user 授權）
10. （若仍要推進）registry seed（需 seed policy landed + user 授權）
11. （若仍要推進）Admin picker implementation（需所有前置 landed）
12. （若仍要推進）build / deploy / Blogger repost / GA4 validation（只有 user 明確授權）
```

### L.2 各 step 之啟動規則

- 每個 step 必須由 **user 明確 prompt** 啟動，不自動推進。
- 前置 step 必須 landed 並通過 read-only acceptance。
- 紅線（per §K）必須逐項確認未動。
- 任何 step 之 baseline movement 預估必須事先 docs 化。
- 任何 step 必須 mirror R-series cadence：`docs-only preanalysis → read-only acceptance → source/fixture implementation → read-only checkpoint`。

### L.3 對應 reverse UTM / pm-26 / Admin Apply 之關係

- ❌ 本文件**不**自動解除 reverse UTM dormancy。
- ❌ 本文件**不**自動解封 pm-26 deploy gate。
- ❌ 本文件**不**自動啟動 Admin Apply / middleware / admin-write-cli。
- 上述三項之啟動須各自獨立 phase + user 明確授權；與本檔之 C6 contract 無自動 coupling。

### L.4 推薦下一個 phase（若 user 授權）

> **若 user 授權推進，推薦下一個 phase = C6 preanalysis acceptance read-only**（docs-only；驗收本檔）。
>
> phase name 候選：
> `20260607-night-13-commerce-c6-coexistence-warning-preanalysis-acceptance-readonly-a`
>
> 該 phase 之範圍：
> - 純 read-only；不改任何檔案。
> - 驗收本檔 §F.2 之 rule id 推薦 / §F.3 之 trigger 設計 / §F.4 之 cascade ordering / §H 之 fixture 策略 / §I 之 baseline impact 選項。
> - 確認紅線 §K 全部未動。
> - `npm run validate:content` baseline 確認為 0/66/57。
> - 報告 acceptance PASS / FAIL；不自動推進 C6 source。

---

## Appendix A — Cross-reference index

- `docs/20260603-commerce-affiliate-link-registry-schema-decision.md`（night-18；schema decision + v0 欄位 + linkId 命名 + ref 候選 (a)/(b)/(c)/(d)）
- `docs/20260603-commerce-affiliate-link-empty-registry-preanalysis.md`（night-19；R1-clean 7 條件）
- `docs/20260603-commerce-links-validator-preanalysis.md`（night-22；R1..R15 / C1..C9 rule contract；§6 content-reference 思路源）
- `docs/20260604-commerce-links-registry-fixture-mechanism-preanalysis.md`（am-2；fixture mechanism Option D；Option A path naming convention）
- `docs/20260604-commerce-links-content-reference-validation-preanalysis.md`（am-7；C1..C9 content-reference rule + ref data model；§5.7 C6 原始 deferred 理由；本檔擴展）
- `docs/20260607-commerce-content-ref-c1c2c3c5-fixture-preanalysis.md`（night-2；C1/C2/C3/C5 fixture cadence；本檔 fixture 策略以此為範本）
- `docs/20260607-commerce-renderer-fallback-contract-preanalysis.md`（night-9；renderer fallback contract；§E.5 selected option 5B 為 C6 設計核心對齊）
- `CLAUDE.md` §1（不過度工程化）/ §3.2（commerce registry 狀態 + 紅線）/ §9（CSS class 命名 + Flexbox 優先）/ §12（書評 affiliate.links schema）/ §16（連結處理 + reverse UTM dormancy）/ §22（圖片素材）/ §27（修改紅線）/ §29（第一版不做清單）/ §30（最終樣貌）
- `content/settings/commerce-links.json`（empty registry；本 phase 不動）
- `content/settings/affiliate-networks.json`（既有 network registry；本 phase 不動）
- `src/scripts/load-settings.js` lines 59–66（commerce loader；本 phase 不動）
- `src/scripts/validate-content.js` lines 567–655（`validateCommerceRefs`；本 phase 不動）
- `src/views/pages/post-detail.ejs` lines 76–91 / 172–186（既有 raw affiliate render；本 phase 不動）
- `src/views/blogger/blogger-post-full.ejs` lines 61–72 / 99–111（既有 Blogger raw affiliate render；本 phase 不動）
- 4 個已落地 commerce content-ref fixtures（本 phase 不動）：
  - `content/validation-fixtures/blogger/posts/_test-commerce-ref-invalid-type.md`
  - `content/validation-fixtures/blogger/posts/_test-commerce-ref-empty.md`
  - `content/validation-fixtures/blogger/posts/_test-commerce-ref-not-found.md`
  - `content/validation-fixtures/blogger/posts/_test-commerce-ref-duplicate.md`
- `content/blogger/posts/20260515-we-media-myself2.md` lines 59–71（既有唯一使用 raw `url` 之 production post；`affiliate.enabled: false` + `position.top/bottom: false`；本 phase 不動）
- `content/templates/blogger-book-review-template.md` / `blogger-magazine-review-template.md`（`affiliate.links: []` 範本；本 phase 不動）

---

## Appendix B — Baseline snapshot

- repo path：`D:\github\blog-new\portable-blog-system`
- branch：`main`
- HEAD（pre-commit）：`90375ad494d43fb9799e42778fb154d3e3099ca2`
- `HEAD == origin/main`（pre-commit）：yes（ahead / behind = `0 / 0`）
- working tree（pre-commit）：clean
- latest commit subject（pre-commit）：`docs(commerce): plan renderer fallback contract`
- `npm run validate:content`（pre-commit）→ **0 errors / 66 warnings / 57 posts**

本階段結束後預期：

- 唯一新增：本檔 `docs/20260607-commerce-c6-coexistence-warning-preanalysis.md`
- 其他狀態完全不變
- `npm run validate:content`（post-commit）預期維持 **0 errors / 66 warnings / 57 posts**

---

（本文件結束）
