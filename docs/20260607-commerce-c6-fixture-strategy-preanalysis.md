# 2026-06-07 Commerce C6 Fixture Strategy — Preanalysis (docs-only)

Phase name: `20260607-night-18-commerce-c6-fixture-strategy-preanalysis-docs-only-a`
Date: 2026-06-07 22:14 +0800
Mode: **docs-only C6 fixture strategy preanalysis**（no source / no fixture creation / no content / no settings registry mutation / no templates / no renderer / no loader change / no validator rule landing / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no real affiliate link added / no registry seeding / no production content migration / no `npm install` / no CLAUDE.md mutation）

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
| night-12 `9da83be` | commerce C6 coexistence warning preanalysis（docs-only） | 凍結未來 C6 warning 之 rule id / trigger / direct URL field / fixture 策略候選（H-α / H-β / H-γ）/ baseline 影響選項（Option 1 / 2 / 3）/ 紅線 |
| night-14 `281cd43` | commerce C6 source-only landing without fixture | `validate-content.js` 新增 C6 push point；採 night-12 推薦 H-α / Option 1（source-only no fixture）；baseline 維持 0/66/57 |
| night-15 `（no commit）` | commerce C6 source-only acceptance read-only | night-14 source 已驗收 PASS |
| night-17 `（no commit）` | commerce C6 source CLAUDE.md sync acceptance read-only | CLAUDE sync commit `ba7c8e7` 已驗收 PASS |
| `ba7c8e7` | docs(claude) sync commerce C6 source state | CLAUDE.md commerce C6 source 狀態同步 |
| **night-18（本 phase）** `（本 commit）` | **commerce C6 fixture strategy preanalysis（docs-only）** | 在 C6 source 已 landed、CLAUDE.md 已 sync、baseline 0/66/57 維持之現況下，凍結未來 C6 fixture phase 之檔名 / 最小 frontmatter / 預期 cascade / 三策略比較（Option A 接受 cascade / Option B 不建 fixture / Option C seeded test registry）/ 推薦策略 / acceptance / 紅線；**不**建立 fixture；**不**改 source / settings / fixtures / templates / production content / CLAUDE.md |

本階段唯一目的為：

> 在 C6 source 已於 `281cd43` landed、CLAUDE.md 已於 `ba7c8e7` sync、validate baseline 維持 **0 errors / 66 warnings / 57 posts**、empty registry 維持、0 篇 production 用 `ref` / 0 篇 production 同時帶 `ref` + `url` 之現況下，**docs-only** 設計未來 C6 fixture phase 之 fixture 策略，為下一個 C6 fixture implementation phase（若 user 授權）提供可直接執行之 contract；**不**啟動 C6 fixture creation；**不**啟動 C4 / C8 / C9 source；**不**啟動 renderer source / Admin / migration / registry seed。

本階段為純文件；**不**改 `src/scripts/validate-content.js`、**不**改 `src/scripts/load-settings.js`、**不**改 `content/settings/commerce-links.json`、**不**改任何 content / templates / fixtures / package / CLAUDE.md。

See also：

- `docs/20260607-commerce-c6-coexistence-warning-preanalysis.md`（night-12；C6 source design；§H 三策略 H-α / H-β / H-γ；§I 三 baseline 選項 Option 1 / 2 / 3；§H.5 預期觸發 cascade；本檔不重複；只擴展 fixture 策略決策維度）
- `docs/20260607-commerce-renderer-fallback-contract-preanalysis.md`（night-9；renderer fallback contract；§E.5 selected option 5B；本檔對齊「C6 warning-only；不強迫 renderer 改變行為」）
- `docs/20260607-commerce-content-ref-c1c2c3c5-fixture-preanalysis.md`（night-2；C1/C2/C3/C5 fixture cadence；§4.1 path convention；§5.1 共同 frontmatter 樣板；§5.6 紅線；本檔 fixture frontmatter / path / 紅線承襲此檔）
- `docs/20260604-commerce-links-content-reference-validation-preanalysis.md`（am-7；§5.7 C6 原始 deferred 理由；§6.2 source-only first cadence）
- `docs/20260604-commerce-links-registry-fixture-mechanism-preanalysis.md`（am-2；Option D 凍結；fixture mechanism 紅線；Option A escape hatch 命名）
- `CLAUDE.md` §1（不過度工程化）/ §3.2（commerce registry 狀態 + 紅線）/ §12（書評 affiliate.links schema）/ §16（連結處理）/ §27（修改紅線）/ §29（第一版不做清單）

---

## A. Executive Summary

### A.1 一句話結論

> **本文件只設計 C6 fixture strategy，不建立 fixture**：在 C6 source 已 landed、CLAUDE.md 已 sync、baseline 0/66/57 維持之現況下，凍結未來 C6 fixture phase 之檔名 `_test-commerce-ref-direct-url-coexist.md`（對齊 rule id `commerce-ref-direct-url-coexist`）/ 最小 frontmatter（fixture-namespaced ref + reserved `example.invalid` URL）/ 預期 cascade（1 × C6 + 1 × C3 = +2 warnings；baseline 0/68/58）/ 三策略比較（Option A 接受 cascade / Option B 不建 fixture / Option C seeded test registry）/ acceptance / 紅線。**不**碰 source / settings / fixtures / templates / production content / renderer / CLAUDE.md；**不**啟動 C6 fixture creation；**不**自動解封 C4 / C8 / C9 / renderer / Admin / migration / registry seed。

### A.2 本 phase 之主要決策

> **未來 C6 fixture 是否接受 empty registry 下的 C3 cascade？**

三個候選策略：

- **Option A**（接受 cascade）：建立 1 個 fixture；ref + url 同時存在 → 觸發 1 × C6；同時 ref 不在 empty registry → orthogonal 觸發 1 × C3；fixture +1 post / +2 warnings → baseline 0/66/57 → 0/68/58。
- **Option B**（不建 fixture）：保留 source-only；baseline 維持 0/66/57；C6 coverage 倚賴 source review + `docs/20260607-commerce-c6-coexistence-warning-preanalysis.md` rule contract。
- **Option C**（seeded test registry）：擴 loader + 新 fixture-mode code path + sourcePath 改寫；C6 fixture 之 ref 命中 seeded registry → C3 不觸發 → 只 +1 warning。違反 am-2 Option D + CLAUDE.md §1 「不過度工程化」；不推薦。

本檔在 §H 給出明確推薦（**Option A**），理由詳述於 §H.2。

### A.3 本 phase 嚴格邊界

- ❌ 不建立 C6 fixture（既有 4 個 `_test-commerce-ref-*.md` 不動；不建立 `_test-commerce-ref-direct-url-coexist.md`）。
- ❌ 不改 `src/scripts/validate-content.js`（C6 source 已 landed at `281cd43`；本檔不變動）。
- ❌ 不改 `src/scripts/load-settings.js` / 任一 `src/`。
- ❌ 不改 `content/settings/commerce-links.json`（empty `[]` 維持）。
- ❌ 不改 `content/settings/affiliate-networks.json` / 任一 settings JSON。
- ❌ 不改 renderer / templates / EJS / SCSS / JS / build scripts。
- ❌ 不改任何 production content（`content/blogger/posts/` / `content/github/posts/` / `content/shared/posts/` / `content/drafts/` / `content/archive/`）。
- ❌ 不改 templates（`content/templates/`）。
- ❌ 不改 CLAUDE.md（C6 fixture landing 之 sync 屬獨立 phase）。
- ❌ 不改 `package.json` / `package-lock.json` / `vite.config.js`。
- ❌ 不執行 `npm install` / `npm run build*` / `npm run dev` / `npm run preview`（唯一允許 npm = `npm run validate:content`）。
- ❌ 不 build / deploy / Blogger repost / GA4 validation。
- ❌ 不解除 reverse UTM dormant；不解除 pm-26 deploy gate；不啟動 Admin Apply / middleware / admin-write-cli。
- ❌ 不 seed production registry；不放入真實 affiliate URL / merchant token / tracking id。
- ❌ 不啟用 C4 / C7 / C8 / C9 source；不啟動 renderer source；不啟動 Admin picker。
- ❌ 不承接 20260606 壞損 NB 之任何資料或結果。
- ❌ 不自動啟動下一階段。

### A.4 立場 spoiler（詳見 §H / §K）

- **Final Idle Freeze / EXIT 為本 phase 結束後預設**。
- 若 user 明確授權推進，建議下一 phase = **C6 fixture strategy acceptance read-only**（docs-only；驗收本檔之 §F 推薦 fixture 檔名 / §G 最小 frontmatter / §H 推薦策略 / §I 預期 baseline / §J acceptance）；之後（若仍要推進）再執行 C6 fixture creation phase（per Option A）。
- contract 採「append over rewrite」：未來 C6 fixture landing 應**新增**單一 `.md`，**不**改動 C6 source（`281cd43` 已 landed 之 push point）；**不**改動既有 4 個 `_test-commerce-ref-*.md`；**不**改動 CLAUDE.md（CLAUDE sync 屬獨立 phase）。

---

## B. Current Baseline

| 項目 | 值 |
| --- | --- |
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD（pre-commit）| `ba7c8e7dc28e819ff48971bc66b8ddf59add2009` |
| `HEAD == origin/main`（pre-commit）| yes（ahead / behind = `0 / 0`）|
| working tree（pre-commit）| clean |
| latest subject（pre-commit）| `docs(claude): sync commerce C6 source state` |
| `npm run validate:content`（pre-commit）| **0 errors / 66 warnings / 57 posts** |

### B.1 Commerce content-reference validator state

- ✅ C1 `commerce-ref-invalid-type`：source + fixture landed。
- ✅ C2 `commerce-ref-empty`：source + fixture landed。
- ✅ C3 `commerce-ref-not-found`：source + fixture landed。
- ✅ C5 `commerce-ref-duplicate-in-post`：source + fixture landed。
- ✅ **C6 `commerce-ref-direct-url-coexist`**：**source landed**（`281cd43`；本 phase 之主題；fixture **尚未建立**）。
- ❌ **C4 `commerce-ref-inactive`**：尚未啟動（需 registry 有 `active: false` entry → coupling Option A；defer）。
- ❌ **C7 `commerce-ref-missing-role`**：不建議啟用（long-tail）。
- ❌ **C8 `commerce-ref-invalid-role`**：尚未啟動（需 enum 凍結後 land）。
- ❌ **C9 `commerce-ref-display-override-risk`**：尚未啟動（需 registry entry → coupling Option A）。

### B.2 Commerce registry state

- `content/settings/commerce-links.json` 維持 empty `{ schemaVersion: 1, updatedAt: "", commerceLinks: [], notes: "" }`（per night-20 `c1a6974`；本 phase 不動）。
- loader（`load-settings.js` lines 59–66）以 `readJsonOptional` read-only 載入；暴露為 `settings.commerceLinks = []`。
- registry-level validator 11 條 warning-only rule landed（per night-25 `94a1d47`）；empty registry → 11 條全 0 觸發。

### B.3 Existing 4 commerce content-ref fixtures state

| fixture | landed phase | trigger | `url:` 欄位？ | C6 trigger？ |
| --- | --- | --- | --- | --- |
| `_test-commerce-ref-invalid-type.md` | night-4 `149efdc` | 1 × C1 | ❌ 無 | ❌ 不觸發（C1 cascade → continue；C6 not reached）|
| `_test-commerce-ref-empty.md` | night-4 `149efdc` | 1 × C2 | ❌ 無 | ❌ 不觸發（C2 cascade → continue；C6 not reached）|
| `_test-commerce-ref-not-found.md` | night-4 `149efdc` | 1 × C3 | ❌ 無 | ❌ 不觸發（無 `url:` 欄位） |
| `_test-commerce-ref-duplicate.md` | night-4 `149efdc` | 1 × C5 + 2 × C3 | ❌ 無 | ❌ 不觸發（無 `url:` 欄位） |

**結論：既有 4 個 fixtures 皆無 `url:` 欄位 → C6 source landing（`281cd43`）後對既有 fixtures 之 trigger 數為 0**；既有 fixtures 仍維持各自單一 / orthogonal cascade，未產生 C6 衍生 warning（per CLAUDE.md §3.2 commerce content-ref fixtures state 段落）。

### B.4 Production posts state

- production posts 用 `affiliate.links[].ref` 之文章數：**0**。
- production posts 用 `affiliate.links[].url`（raw URL）之文章數：**1**（`content/blogger/posts/20260515-we-media-myself2.md` lines 65–71；該 post 之 `affiliate.enabled: false` + `position.top/bottom: false` → renderer 5 條 AND guard 完全不渲染；亦無 `ref` → C6 不觸發）。
- production posts 同時帶 `ref` + `url` 之文章數：**0**。
- 其餘有 `affiliate:` block 之 production post（`20260504-sample-book-review.md` / `20260525-draft-book-review.md`）皆 `links: []`。
- **結論：production 端 C6 source land 後 0 觸發**（無一 entry 同時有 `ref` + `url`）；baseline 不變。

### B.5 Renderer state

- production renderer 端（`src/views/pages/post-detail.ejs` / `src/views/blogger/blogger-post-full.ejs`）讀取 `link.url` / `link.label` / `link.network` 之 **raw model**；無一條讀 `link.ref`。
- 5 條 AND guard（`affiliate` 存在 / `enabled === true` / `Array.isArray(links)` / `links.length > 0` / `position.top|bottom === true`）皆未變動。
- night-9 renderer fallback contract（docs-only）已凍結；renderer source 仍未啟動。

### B.6 Dormant rails

- C6 fixture：**未**建立（本 phase 之設計目標）。
- C6 source：✅ **landed**（`281cd43`；不在本 phase 範圍）。
- C4 / C7 / C8 / C9 source：**未**啟動。
- renderer commerce ref-resolve：**未**啟動。
- Admin picker / selector / display：**未**啟動。
- production content migration（raw → ref）：**未**啟動。
- registry seed（真實 affiliate entry）：**未**啟動。
- reverse UTM：**dormant**（per CLAUDE.md §16.4；source pm-24a/b/c landed，未 deploy）。
- pm-26 deploy gate：**BLOCKED**（per CLAUDE.md §3.2）。
- Admin Apply / middleware write / admin-write-cli：**dormant**。
- GA4 commerce dimension / click counter：**未**啟動。

---

## C. Current C6 Source Behavior

per `src/scripts/validate-content.js` lines 567–674（landed Phase 20260607-night-14 commit `281cd43`）：

### C.1 rule id

`commerce-ref-direct-url-coexist`

（per night-12 §F.2 推薦命名；採對齊 `commerce-ref-*` 既有 prefix；`direct-url` 明示為直接寫入 frontmatter 之 URL，與 registry-resolved 之間接 URL 對比清晰）

### C.2 trigger

per `validate-content.js` lines 639–646：

```js
if (typeof entry.url === 'string' && entry.url.trim() !== '') {
  issues.push({
    severity: 'warning',
    type: 'commerce-ref-direct-url-coexist',
    sourcePath,
    value: `affiliate.links[${i}] has both ref and url; remove url after commerce registry renderer migration`,
  });
}
```

觸發條件（per-entry）：

1. entry 為 plain object（per existing guard line 588）
2. `entry.ref !== undefined`（per existing guard line 590）
3. `entry.ref` 為 string（per C1 cascade exit line 593–603）
4. `entry.ref.trim() !== ''`（per C2 cascade exit line 608–616）
5. `typeof entry.url === 'string'`
6. `entry.url.trim() !== ''`

### C.3 direct URL field scope

> **只認 `entry.url`**

- 不認 `href`
- 不認 `targetUrl`
- 不認 `linkUrl`
- 不認 `directUrl`
- 不認 `affiliateUrl`
- 不認 `rawUrl`

per night-12 §E.3：production 既有使用之唯一 raw URL 欄位為 `url`；renderer 兩端（`post-detail.ejs` / `blogger-post-full.ejs`）皆讀 `link.url`；擴大支援會引入 false positive / false negative（per night-12 §G）。

### C.4 message shape

```text
affiliate.links[<i>] has both ref and url; remove url after commerce registry renderer migration
```

- **不** echo ref value（避免 log 過長）。
- **不** echo url value（避免 log 內洩漏 affiliate URL / merchant token / tracking id；per night-12 §F.3.3 + governance §K.2）。
- 採祈使語氣「remove url after commerce registry renderer migration」提示作者**未來**動作；**不**強迫立即移除。

### C.5 cascade matrix

| Pair | 關係 | 同一 entry 可同時觸發？ |
| --- | --- | --- |
| C1 ↔ C6 | 互斥 cascade（C1 觸發 continue；C6 not reached） | ❌ |
| C2 ↔ C6 | 互斥 cascade（C2 觸發 continue；C6 not reached） | ❌ |
| C3 ↔ C6 | **orthogonal**（同一 entry 可同時觸發 C3 + C6） | ✅ |
| C5 ↔ C6 | **orthogonal**（intra-post duplicate ref 同時帶 url；同一 entry 可同時觸發 C5 + C6） | ✅ |

per night-12 §F.4.3 + `validate-content.js` lines 575–580 inline comment。

### C.6 既有 fixtures C6 trigger 數

per §B.3：既有 4 個 `_test-commerce-ref-*.md` 皆**無** `url:` 欄位 → C6 trigger 0。

---

## D. Fixture Problem Definition

### D.1 為何需要 C6 fixture

C6 source 已 landed（`281cd43`）；但**目前無 fixture 可在 validate baseline 內提供 C6 行為之 evidence**：

- 既有 4 個 commerce content-ref fixtures（C1 / C2 / C3 / C5）皆無 `url:` 欄位 → C6 trigger 0。
- production 0 篇用 ref → C6 在 production 觸發 0。
- 若未來 source regression（如 C6 cascade ordering 改動 / direct URL field scope 誤擴 / message shape 誤改），**無 baseline-level 自動偵測**。
- 唯一 coverage 來源為：
  - source review（C6 source 之 23 行 inline comment + 8 行 push point）。
  - `docs/20260607-commerce-c6-coexistence-warning-preanalysis.md` rule contract（§F.3 trigger / §F.4 cascade）。
  - 本檔 §C.1..§C.5 之 source-of-truth 引用。

### D.2 為何 fixture 在 empty registry 下會帶 cascade

empty registry 下，任何 fixture 內非空 trimmed string `ref`（typeof === 'string'）必觸發 C3 not-found：

```text
fixture 1 entry：
  ref = "fixture-c6-coexist-ref"（非空 trimmed string）
  url = "https://example.invalid/commerce-fixture"（非空 trimmed string）

  cascade 分析：
    C1：ref typeof === 'string' → 不觸發
    C2：ref.trim() !== '' → 不觸發
    C3：commerceLinkIdSet === Set()（empty）→ !set.has("fixture-c6-coexist-ref") → 觸發 1 × C3
    C6：typeof entry.url === 'string' && entry.url.trim() !== '' → 觸發 1 × C6

  total：2 warnings（1 × C6 + 1 × C3；orthogonal cascade）
```

### D.3 cascade 對 fixture 設計之影響

C3 cascade 為「empty registry 下無法避免」之 noise：

- ❌ **不能**透過修改 fixture 之 `ref` 值避免（任何非空 trimmed string `ref` 必觸發 C3；empty / whitespace `ref` 被 C2 cascade exit 攔下 → C6 不 reach）。
- ❌ **不能**透過修改 fixture 之 `url` 值避免（C3 與 `url` 欄位無關）。
- ✅ **可以**透過 seeded test registry 避免（Option C；需擴 loader + 新 fixture-mode code path → 違反 am-2 Option D + CLAUDE.md §1）。
- ✅ **可以**透過不建 fixture 避免（Option B；C6 source-only；無 fixture 即無 cascade）。

mirror C5 fixture（`_test-commerce-ref-duplicate.md` per night-4 `149efdc`）之同型 cascade：1 × C5 + 2 × C3 = 3 warnings；既有作者已熟此設計。

### D.4 fixture 之 value vs cost

| 維度 | Option A 接受 cascade（H-β + Option 2）| Option B 不建 fixture（H-α + Option 1；source-only）| Option C seeded test registry（H-γ + Option 3）|
| --- | --- | --- | --- |
| C6 coverage | ✅ 可在 baseline 內見 | ❌ 倚賴 source review + rule contract | ✅ 可在 baseline 內見（cleaner）|
| baseline drift | +2 warnings / +1 post | 0 | +1 warning / +1 post |
| cascade noise | 1 × C3 cascade | 無 | 無 |
| 違反 am-2 Option D？ | ❌ 不違反 | ❌ 不違反 | ✅ **違反**（settings-level fixture mechanism deferred）|
| 違反 CLAUDE.md §1？ | ❌ 不違反 | ❌ 不違反 | ✅ **違反**（loader 擴增 + fixture-mode code path 過度工程化）|
| 新增 attack surface | 1 個 fixture markdown | 0 | loader + sourcePath 改寫 + settings-level fixture |
| 中間 phase 數 | 1（fixture creation） | 0 | 2（fixture-registry strategy docs + implementation；再 fixture creation） |
| mirror 既有 cadence | ✅ 對齊 C5 cascade pattern | ✅ 對齊 download R-series source-only-first | ❌ 違反 am-2 + 既有 cadence |

→ Option A 與 Option B 皆為合規候選；Option C 違反兩條紅線，**不在本檔推薦範圍內**。

---

## E. Candidate Fixture File Name

⚠️ **本 phase 不建立 fixture**；以下為未來 C6 fixture phase 之 path contract。

### E.1 推薦檔名

```text
content/validation-fixtures/blogger/posts/_test-commerce-ref-direct-url-coexist.md
```

### E.2 為何 `_test-commerce-ref-direct-url-coexist.md` 比 `_test-commerce-ref-url-coexist.md` 更適合

| 候選檔名 | 字數 | 與 rule id 對應 | 推薦？ |
| --- | --- | --- | --- |
| `_test-commerce-ref-direct-url-coexist.md` | 41 chars | ✅ 完全對應 rule id `commerce-ref-direct-url-coexist`（per `validate-content.js` line 642 + night-12 §F.2 凍結）| ✅ **推薦** |
| `_test-commerce-ref-url-coexist.md` | 34 chars | ⚠️ 對應 night-12 §F.1 之次選 rule id `commerce-ref-url-coexist`；但 rule id 已凍結為 `commerce-ref-direct-url-coexist`；檔名與 rule id 不一致違反 night-2 §4.2 之 filename 與 source rule id 對應原則 | ❌ 不推薦 |
| `_test-commerce-ref-coexist.md` | 26 chars | ❌ 過於模糊（與什麼 coexist？）；不對應 rule id；違反 night-2 §4.2 | ❌ 不推薦 |
| `_test-commerce-ref-raw-url-coexist.md` | 37 chars | ⚠️ 對應 night-12 §F.1 之第三選 rule id；但 rule id 已凍結為 `direct-url-coexist`；命名不一致 | ❌ 不推薦 |

### E.3 推薦理由

1. **rule id 完全對應**（mirror night-2 §4.2 既有 cadence）：
   - `_test-commerce-ref-invalid-type.md` → rule id `commerce-ref-invalid-type`
   - `_test-commerce-ref-empty.md` → rule id `commerce-ref-empty`
   - `_test-commerce-ref-not-found.md` → rule id `commerce-ref-not-found`
   - `_test-commerce-ref-duplicate.md` → rule id `commerce-ref-duplicate-in-post`（**唯一例外**；採短化 `-duplicate`；per night-2 §4.1 對齊 download `_test-download-asset-ref-duplicate.md`）
   - `_test-commerce-ref-direct-url-coexist.md` → rule id `commerce-ref-direct-url-coexist`（**完全對應**）
2. **rule id 已凍結**：per night-14 source landing `281cd43` + night-12 §F.2；不變更 rule id；不應為了 filename 短化而重命名 rule id。
3. **作者可讀**：`direct-url-coexist` 明示為「direct URL 與 ref 共存」；無歧義。
4. **path convention 對齊**：採 `blogger/` 子目錄（mirror 既有 4 個 commerce content-ref fixtures；affiliate.links 為書評語意）；prefix `_test-` 區隔 production post。

### E.4 path convention

per night-2 §4.1：

- 沿用既有 cadence：`content/validation-fixtures/blogger/posts/_test-<rule-id-or-purpose>.md`
- 既有對照：`_test-commerce-ref-invalid-type.md` / `_test-commerce-ref-empty.md` / `_test-commerce-ref-not-found.md` / `_test-commerce-ref-duplicate.md`
- 與既有 4 個 commerce content-ref fixtures 同 directory；prefix `_test-` 區隔 production post
- 採 `blogger/` 子目錄而非 `github/` 因 `affiliate.links` 為書評（blogger 站常用）語義；validator 不區分子目錄，純為人類可讀分類

---

## F. Proposed Fixture Frontmatter

⚠️ **本 phase 不建立 fixture**；以下為未來 C6 fixture phase 之最小 frontmatter contract。

### F.1 設計原則

mirror night-2 §5.1（共同基線）+ night-12 §H.3（C6 fixture 最小 frontmatter 候選）：

- 純 fixture 命名空間（無真實 affiliate 連結、無真實 merchant token、無真實 tracking id）
- `status: "ready"` 但 fixture 命名空間（`_test-` prefix）+ `seo.indexing: "noindex-follow"` → 不被 indexed
- 不依賴 commerce-links registry 有任何 entry（registry 維持 empty）
- 不新增 commerce registry entry
- 不修改既有 production posts / templates
- 只測 validator；不測 renderer / Admin
- mirror 既有 4 個 `_test-commerce-ref-*.md` cadence

### F.2 推薦最小 frontmatter

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
    - ref: "fixture-c6-coexist-ref"
      url: "https://example.invalid/commerce-fixture"
---
```

### F.3 各欄位設計理由

#### F.3.1 `ref: "fixture-c6-coexist-ref"`

- 採 `fixture-c6-coexist-ref` 而非 `__nonexistent-commerce-ref-coexist__`：
  - 對齊既有 `_test-commerce-ref-duplicate.md` 之 `fixture-ref-001` 命名習慣（`fixture-` prefix；無 `__` 圍欄）。
  - night-2 §5.1 共同樣板用 `__nonexistent-*__` 表 not-found 之語意；C6 fixture 之 ref 主要為「同時有 url」之測試對象，not-found 為 cascade 副作用 → `fixture-c6-*` 之語意更貼近本 fixture 目的。
- 不可使用真實 production / future linkId（per night-2 §5.6 + CLAUDE.md §3.2 commerce 治理紅線）。

#### F.3.2 `url: "https://example.invalid/commerce-fixture"`

per night-12 §H.4 推薦：

- 採 `.invalid` TLD：RFC 2606 reserved；保證永不解析。
- 不採 `example.com`：可解析至 IANA placeholder；可能誤導為真實 URL。
- 不採 `localhost` / `127.0.0.1`：可能解析至本機。
- 不採真實 affiliate URL（不可使用真實博客來 / 蝦皮 / momo / 聯盟網 / 通路王 URL；per CLAUDE.md §3.2 commerce 治理紅線）。

#### F.3.3 `contentKind: "book-review"`

- 對齊既有 4 個 commerce content-ref fixtures（per night-2 §5.3）。
- `affiliate.links` 為書評/書籍販售區塊之 frontmatter；`book-review` 為 §11 列舉值最相符語義。
- fixture implementation phase 須 verify：選擇 `book-review` 之後 validator **不**因缺 `book.title` / `book.author` 等欄位觸發其他 warning（per night-2 §5.3）。

#### F.3.4 `cover: "/images/placeholders/cover.png"`

per night-2 §5.4：placeholder image 不需真實存在（validator 不 fetch image）。

#### F.3.5 `seo.indexing: "noindex-follow"`

per night-2 §5.5：defence-in-depth；即使未來 fixture 意外被 build 也不會 indexed。

#### F.3.6 `date: "<future-date>"`

- fixture implementation phase 之實際 commit 日期；本 phase 不裁決。
- 推薦採 fixture landing 當天日期（不採未來 / 過去日期）。

### F.4 紅線：不可使用之 frontmatter 內容

🔴 fixture frontmatter 內**絕對不可**包含：

- ❌ 真實 affiliate 連結（不可使用真實博客來 / 蝦皮 / momo / 聯盟網 / 通路王 URL；per night-2 §5.6 + CLAUDE.md §3.2）。
- ❌ 真實 merchant tracking id / affiliate token / OAuth client secret / API key。
- ❌ 真實 access token / bearer token / refresh token / session id / Authorization header。
- ❌ 真實 commission / payout / clickCount 等 dashboard 統計。
- ❌ 真實 帳號 email / 結算密碼 / 私人 Drive folder ID。
- ❌ 真實 respondent data / email。
- ❌ 與既有 production / future 真實 commerce-links registry 之 `linkId` 命名衝突（fixture 命名空間建議：`fixture-c6-*` / `__nonexistent-*-coexist__`）。

---

## G. Expected Warning Mapping

⚠️ **本檔不執行 fixture landing**；以下為**未來 C6 fixture phase**（若啟動）之 baseline 預估。

### G.1 推薦 fixture 之預期 cascade

empty registry 下，§F.2 推薦 fixture 之單一 entry（ref + url 同時存在）必觸發：

```text
fixture entry 0：
  ref = "fixture-c6-coexist-ref"
  url = "https://example.invalid/commerce-fixture"

per validateCommerceRefs cascade：
  C1：typeof ref === 'string' → 不觸發
  C2：ref.trim() === 'fixture-c6-coexist-ref' !== '' → 不觸發
  C3：commerceLinkIdSet === Set()（empty）；!set.has("fixture-c6-coexist-ref") → 觸發 1 × commerce-ref-not-found
  C6：typeof url === 'string' && url.trim() !== '' → 觸發 1 × commerce-ref-direct-url-coexist
  C5（per-post duplicate loop）：seenRefIndexes = { "fixture-c6-coexist-ref" → [0] }；length === 1 → 不觸發

total per entry：2 warnings（1 × C6 + 1 × C3）
total per fixture：2 warnings；fixture 本身 +1 post
```

### G.2 Three options for baseline impact

#### G.2.1 Option A：接受 empty registry cascade（推薦）

- fixture 1 個。
- expected warnings:
  - 1 × `commerce-ref-direct-url-coexist`
  - 1 × `commerce-ref-not-found`
- baseline 從 **0 / 66 / 57** 變為 **0 / 68 / 58**（drift = +2 warnings / +1 post）。
- 優點：
  - C6 fixture coverage 直接可見於 baseline；validator regression 由 baseline diff 抓到。
  - mirror C5 fixture cascade cadence（1 × C5 + 2 × C3）；既有作者已熟此設計。
  - 不違反 am-2 Option D（不新增 settings-level fixture）。
  - 不違反 CLAUDE.md §1（不擴 loader / 不新 fixture-mode code path）。
  - C6 message shape 之 fixture evidence 永久 frozen。
  - mirror download R5b `_test-download-asset-ref-duplicate.md` cadence（2 × not-found + 1 × duplicate）。
- 缺點：
  - C6 fixture 不是 pure one-warning fixture（cascade noise +1 × C3）。
  - fixture description 須明確記載「預期觸發 2 個 warning（1 × C6 + 1 × C3）」以避免作者誤判。

#### G.2.2 Option B：延後 fixture，只保留 source-only

- 不建立 fixture。
- baseline 維持 **0 / 66 / 57**（drift = 0）。
- 優點：
  - 零 baseline drift；validator regression 易識別。
  - mirror C1..C5 source-only-first cadence（C1..C5 source `39b89e3` → fixture `149efdc` 中間經過 3 天 + 多個獨立 phase）。
  - 不違反任何紅線。
  - 減少 phase 內變動範圍；review 成本最低。
- 缺點：
  - C6 source 無 fixture coverage（須由 source review + `docs/20260607-commerce-c6-coexistence-warning-preanalysis.md` rule contract + 本檔 §C source-of-truth 引用 共同保證）。
  - 未來作者偶爾觸發 C6 時，無歷史 fixture 可對照預期 warning shape（但 night-12 §F.3.3 + 本檔 §C.4 已凍結 message shape）。

#### G.2.3 Option C：設計 fixture registry 或 test registry（不推薦）

- 規劃「seeded test registry」（mirror am-2 §10 Option A escape hatch）：
  - 新增 `content/validation-fixtures/settings/commerce-links/_test-<purpose>.json`；
  - 擴 loader 暴露 raw registry + 新 fixture-mode code path；
  - 修改 sourcePath 改寫；
  - C6 fixture 之 ref 命中 seeded registry → C3 不觸發 → fixture 只觸發 1 × C6。
- baseline（docs-only phase）：0 / 66 / 57（不變）。
- baseline（source land 後）：0 / 67 / 58（+1 C6 only；無 C3 cascade）。
- 優點：
  - C6 fixture 不帶 C3 cascade noise（cleaner baseline）。
- 缺點：
  - ❌ 違反 am-2 Option D 凍結（settings-level fixture mechanism deferred）。
  - ❌ 違反 CLAUDE.md §1（不過度工程化）：loader + fixture-mode code path + sourcePath 改寫之擴增僅為 1 個 fixture 之 cleanliness 而新增。
  - ❌ 風險集中於 loader 改動：可能影響既有 11 條 registry-level rule 之 fixture 路徑解析。
  - ❌ 不必要的中間 phase（fixture-registry strategy preanalysis + implementation；再 fixture creation）。
  - ❌ 與 night-12 §I.3 已 frozen 之 Option 3 不推薦立場矛盾。
- **不推薦**。

### G.3 Baseline drift summary table

| Option | fixture # | baseline drift | C3 cascade noise | violates red lines？ | recommend？ |
| --- | --- | --- | --- | --- | --- |
| A | 1 | +2 warnings / +1 post → 0/68/58 | 1 × C3 | ❌ no | ✅ **recommended** |
| B | 0 | 0 → 0/66/57 | n/a | ❌ no | ⚠️ second-best |
| C | 1 + 1 test registry | +1 warning / +1 post → 0/67/58 | 0 | ✅ violates am-2 + §1 | ❌ not recommended |

---

## H. Recommendation

### H.1 推薦策略

> **Option A**（接受 empty registry cascade；H-β + Option 2 per night-12）

### H.2 推薦理由（在「重視 source coverage」與「重視 baseline 最小變動」之間之取捨）

本檔在「重視 source coverage」與「重視 baseline 最小變動」兩個 user 提供之取捨維度上，**推薦 Option A**，理由如下：

#### H.2.1 source coverage 維度（推薦 Option A）

C6 source 已於 `281cd43` landed；目前**無 fixture 可在 baseline 內驗證 C6 trigger / cascade / message shape**：

- 若未來 source regression（如 cascade ordering 改動、direct URL field scope 誤擴、message shape 誤改），validate baseline 不會變動 → regression 無 baseline-level 自動偵測。
- C6 為**新概念**（migration mode 警告）；與既有 C1 / C2 / C3 / C5 之 schema-level rule 性質不同；fixture coverage 之 governance 價值較高。
- C6 trigger 條件涉及兩個欄位 coexistence（`ref` + `url`）；單純 source review 較難涵蓋 cascade edge cases；fixture 之 baseline evidence 可作為 long-term contract 證明。

#### H.2.2 baseline 最小變動維度（仍推薦 Option A，但 noted）

- Option A 之 baseline drift 為 +2 warnings / +1 post（從 0/66/57 → 0/68/58）；屬**可控且符合既有 cadence**：
  - mirror C5 fixture（1 × C5 + 2 × C3 = 3 warnings）；
  - mirror download R5b（2 × not-found + 1 × duplicate）；
  - 既有作者已熟此 orthogonal cascade 設計。
- 若未來 user 對 baseline drift 之容忍度為 zero（如 frozen baseline），則應採 Option B；但**目前並無此類凍結要求**（per CLAUDE.md §3.2 commerce content-ref fixtures state 接受 night-4 之 +6 warnings / +4 posts cascade）。

#### H.2.3 cadence mirror 維度（推薦 Option A）

- C1 / C2 / C3 / C5 之 source 與 fixture 為**先後分 phase land**（source `39b89e3` → fixture `149efdc`，中間 3 天 + 多個獨立 phase）；C6 應沿用此 cadence。
- C6 source 已 landed at `281cd43`；下一階段（若 user 授權）依本檔推薦 = fixture phase；mirror C5 之同型 cascade fixture 設計。
- Option C 違反 am-2 Option D + CLAUDE.md §1 兩條紅線；**不**在推薦範圍內。

#### H.2.4 為何不推薦 Option B

雖然 Option B 之 baseline drift = 0 為極簡選項，但有以下缺點：

- C6 source 之**唯一 evidence**為 source review + `docs/20260607-commerce-c6-coexistence-warning-preanalysis.md` rule contract + 本檔 §C source-of-truth 引用；無 baseline-level 自動 regression detection。
- 未來作者新增 fixture / migration 時，無歷史 fixture 可對照預期 warning shape（雖然 message shape 已凍結，但 baseline diff 之 sanity check 缺失）。
- C5 fixture 之 cascade 設計已建立 precedent；若 C6 fixture 維持 source-only，將與 C5 fixture cadence 不一致。

#### H.2.5 為何不推薦 Option C

per §G.2.3 + night-12 §I.3：

- 違反 am-2 Option D 凍結（settings-level fixture mechanism deferred）。
- 違反 CLAUDE.md §1 不過度工程化（loader + fixture-mode code path + sourcePath 改寫之擴增僅為 1 個 fixture 之 cleanliness 而新增）。
- 風險集中於 loader 改動；可能影響既有 11 條 registry-level rule 之 fixture 路徑解析。
- 不必要的中間 phase（fixture-registry strategy preanalysis + implementation；再 fixture creation）；總 phase 數最多。

### H.3 推薦 phase 順序（candidate）

⚠️ **本 phase 不自動啟動下一階段**；以下為候選順序，由 user 各自獨立 prompt 決定：

1. **Final Idle Freeze / EXIT**（本 phase 結束後預設）
2. **C6 fixture strategy acceptance read-only**（docs-only；驗收本檔 §F 推薦 frontmatter / §G 預期 cascade / §H 推薦策略）
3. （若仍要推進）**C6 fixture creation phase**（per Option A；新增 1 個 fixture markdown；baseline 0/66/57 → 0/68/58）
4. （若仍要推進）**C6 fixture landing CLAUDE.md sync phase**（docs-only；同步 CLAUDE.md §3.2 commerce content-ref fixtures state + baseline）
5. （若仍要推進）**C6 fixture landing acceptance read-only**（docs-only；驗收 fixture + CLAUDE sync）

### H.4 推薦條件（如何選擇 Option A 或 Option B）

| 若 user 之優先順序為 ... | 推薦 |
| --- | --- |
| source coverage > baseline drift（且接受 mirror C5 cadence）| ✅ **Option A** |
| baseline drift > source coverage（zero drift 為硬性要求）| ⚠️ Option B |
| 拒絕任何違反 am-2 / CLAUDE.md §1 | 🚫 Option C 必排除 |

本檔之主要推薦為 **Option A**（per §H.1）；若 user 在 acceptance read-only phase 提出 baseline drift zero 為硬性要求，則改 Option B；**不**接受 Option C。

---

## I. Future Implementation Acceptance Criteria

⚠️ **本 phase 不執行 fixture landing**；以下為**未來 C6 fixture phase**（若啟動）之 acceptance criteria。

### I.1 允許之修改範圍

- ✅ 新增 1 個 fixture markdown：`content/validation-fixtures/blogger/posts/_test-commerce-ref-direct-url-coexist.md`（per §E.1）。
- ✅ fixture 內容須符合 §F.2 推薦最小 frontmatter 與 §F.4 紅線。
- ✅ 可選新增 fixture body（fixture 之文字 body 與既有 4 個 commerce content-ref fixtures 一致 style；不影響 validator）。

### I.2 禁止之修改範圍

- ❌ **不**改 `src/scripts/validate-content.js`（C6 source 已 landed at `281cd43`；fixture phase 不變動）。
- ❌ **不**改 `src/scripts/load-settings.js`（C6 不需新增 loader 資料）。
- ❌ **不**改 `content/settings/commerce-links.json`（empty `[]` 維持）。
- ❌ **不**改 `content/settings/affiliate-networks.json` 或其他 settings JSON。
- ❌ **不**改 renderer / templates / EJS / SCSS / JS / build scripts。
- ❌ **不**改任何 production content / templates / drafts / archive。
- ❌ **不**改既有 4 個 `_test-commerce-ref-*.md`。
- ❌ **不**改 CLAUDE.md（sync 屬獨立 phase；per §H.3 phase 4）。
- ❌ **不**改 `package.json` / `package-lock.json` / `vite.config.js`。

### I.3 Validate baseline 預期

per §G.2.1（Option A）：

```text
pre-landing：0 errors / 66 warnings / 57 posts
post-landing：0 errors / 68 warnings / 58 posts
drift：+2 warnings / +1 post
diff breakdown：
  +1 × commerce-ref-direct-url-coexist（C6；本 fixture）
  +1 × commerce-ref-not-found（C3；本 fixture orthogonal cascade）
```

若 fixture phase 之實際觸發 warning 與此預期不符，fixture phase 須**回退**並重新檢視 fixture frontmatter（不得 ad-hoc 修改 source 或 registry 以符合 baseline）。

### I.4 git diff scope

未來 fixture phase 之 git diff scope 必須**僅限**：

```text
A  content/validation-fixtures/blogger/posts/_test-commerce-ref-direct-url-coexist.md
```

若 diff scope 超出此範圍（如包含 source / settings / CLAUDE.md / 既有 fixture），phase 須**回退**並重新檢視。

### I.5 governance acceptance

- ❌ fixture 內**絕對不可**包含 §F.4 紅線所列任一項目（real affiliate URL / merchant token / tracking id / OAuth secret / API key / Authorization header / 帳號 email / 結算密碼 / 私人 Drive folder ID）。
- ❌ fixture 不**消費**也不**變動** commerce-links registry；registry 維持 empty `[]`。
- ❌ fixture 不**消費**也不**變動** affiliate-networks.json。
- ❌ fixture 不**啟動** renderer / Admin / migration / build / deploy / Blogger repost / GA4。
- ❌ fixture phase 不**自動啟動** CLAUDE sync；CLAUDE sync 屬獨立 phase。

### I.6 npm script acceptance

- ✅ 唯一允許 npm = `npm run validate:content`（verify baseline）。
- ❌ **不**執行 `npm run build*` / `dev` / `preview` / `validate` 以外之 npm scripts。
- ❌ **不**執行 `npm install`。

---

## J. Non-goals / Red Lines

### J.1 本 phase 紅線（必須 enforced）

明確列出本文件**不**處理：

- ❌ **C6 fixture creation**（不新增 `_test-commerce-ref-direct-url-coexist.md`；不新增任何 fixture）
- ❌ **C6 source modification**（不改 `src/scripts/validate-content.js` 任一字符；C6 source 已 landed at `281cd43`）
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
- ❌ **CLAUDE.md 修改**（若需 sync C6 fixture 狀態 → 另開 docs-sync phase；per §H.3 phase 4）
- ❌ **package change**（`package.json` / `package-lock.json` / `vite.config.js` 不動）
- ❌ **`npm install`**（不執行）
- ❌ **MEMORY / project memory 修改**（除非 user 另行要求）
- ❌ **自動啟動下一階段**

### J.2 governance 紅線（與 CLAUDE.md §3.2 commerce 治理紅線一致）

- ❌ **永不**含 affiliate dashboard credentials（email / password / OAuth client secret / API key）
- ❌ **永不**含 access token / bearer token / refresh token / session id / Authorization header
- ❌ **永不**含 commission / payout / clickCount 等 dashboard 統計
- ❌ **永不**含帳號 email / 結算密碼 / 私人 Drive folder ID
- ❌ **不**用 URL pattern 自動推斷 `merchantKey` / `networkKey` / `linkId`；所有 key 由作者明示填寫
- ❌ **禁止**為 fixture 修改 production `affiliate-networks.json`；R11 fixture 須採「故意不存在 networkKey」設計
- reverse UTM remains **dormant**；pm-26 deploy gate remains **BLOCKED**
- Admin Apply / middleware write / admin-write-cli remain **dormant**

### J.3 C6 fixture 永久紅線（適用於未來 C6 fixture landing phase）

未來 C6 fixture 落地時必須**永久 enforce**：

- ❌ **fixture 永遠為 fixture-namespaced**；不可使用真實 affiliate URL / merchant token / tracking id。
- ❌ **fixture 之 `url` 永遠採 RFC 2606 reserved domain**（推薦 `https://example.invalid/commerce-fixture`）。
- ❌ **fixture 之 `ref` 永遠採 fixture 命名空間**（推薦 `fixture-c6-*` 或 `__nonexistent-*-coexist__`）；不可與 production / future linkId 命名衝突。
- ❌ **fixture 永遠不 seed commerce-links registry**；registry 維持 empty `[]`。
- ❌ **fixture 永遠不啟動 renderer / Admin / migration / build / deploy / Blogger repost / GA4**。
- ❌ **fixture 永遠不暴露 affiliate token / tracking id 於檔案內**（per CLAUDE.md §3.2 commerce 治理紅線）。

---

## K. Recommended Next Phase

⚠️ **本 phase 不自動啟動下一階段**；以下為**候選**順序，由 user 各自獨立 prompt 決定。

### K.1 候選順序（保守建議）

```
1. Final Idle Freeze / EXIT（本 phase 結束後預設）
2. C6 fixture strategy acceptance read-only（docs-only；驗收本檔）
3. （若仍要推進）二選一：
   - 3a. C6 fixture creation phase（推薦；per §H.1 Option A；新增 1 個 fixture markdown；baseline 0/66/57 → 0/68/58）
   - 3b. 不建 fixture，保持 source-only（per Option B；維持 baseline 0/66/57）
4. （若 3a 推進）C6 fixture landing CLAUDE.md sync phase（docs-only；同步 CLAUDE.md §3.2 commerce content-ref fixtures state + baseline）
5. （若 4 推進）C6 fixture landing acceptance read-only（docs-only；驗收 fixture + CLAUDE sync）
6. （若仍要推進）C4 / C8 / C9 data model / enum / fixture preanalysis（各為獨立 docs-only phase）
7. （若仍要推進）Admin picker contract preanalysis（docs-only）
8. （若仍要推進）registry seed policy preanalysis（docs-only）
9. （若仍要推進）renderer source implementation（需 user 明確授權；遠未到此 step）
10. （若仍要推進）controlled production migration（需 renderer + C6 source + C6 fixture landed + user 授權）
11. （若仍要推進）registry seed（需 seed policy landed + user 授權）
12. （若仍要推進）Admin picker implementation（需所有前置 landed）
13. （若仍要推進）build / deploy / Blogger repost / GA4 validation（只有 user 明確授權）
```

### K.2 各 step 之啟動規則

- 每個 step 必須由 **user 明確 prompt** 啟動，不自動推進。
- 前置 step 必須 landed 並通過 read-only acceptance。
- 紅線（per §J）必須逐項確認未動。
- 任何 step 之 baseline movement 預估必須事先 docs 化。
- 任何 step 必須 mirror R-series cadence：`docs-only preanalysis → read-only acceptance → source/fixture implementation → read-only checkpoint`。

### K.3 對應 reverse UTM / pm-26 / Admin Apply 之關係

- ❌ 本文件**不**自動解除 reverse UTM dormancy。
- ❌ 本文件**不**自動解封 pm-26 deploy gate。
- ❌ 本文件**不**自動啟動 Admin Apply / middleware / admin-write-cli。
- 上述三項之啟動須各自獨立 phase + user 明確授權；與本檔之 C6 fixture strategy 無自動 coupling。

### K.4 保守建議（即本 phase 結束後之推薦）

> **Final Idle Freeze / EXIT**

理由：

- C6 source 已 landed + CLAUDE sync 已完成 + 本 phase 為 fixture strategy preanalysis 之後續 phase（acceptance）為**純 docs-only / read-only**；無 source 進度可推進。
- 若 user 明確授權推進，推薦下一個 phase 為 **C6 fixture strategy acceptance read-only**（docs-only；驗收本檔 §F / §G / §H / §I）；phase name 候選：
  ```
  20260607-night-19-commerce-c6-fixture-strategy-preanalysis-acceptance-readonly-a
  ```
- 該 acceptance phase 之範圍：
  - 純 read-only；不改任何檔案。
  - 驗收本檔 §E 推薦檔名 / §F 最小 frontmatter / §G 預期 cascade / §H 推薦策略 / §I acceptance criteria。
  - 確認紅線 §J 全部未動。
  - `npm run validate:content` baseline 確認為 0/66/57。
  - 報告 acceptance PASS / FAIL；不自動推進 fixture creation。

---

## Appendix A — Cross-reference index

- `docs/20260603-commerce-affiliate-link-registry-schema-decision.md`（night-18；schema decision + v0 欄位 + linkId 命名 + ref 候選 (a)/(b)/(c)/(d)）
- `docs/20260603-commerce-affiliate-link-empty-registry-preanalysis.md`（night-19；R1-clean 7 條件）
- `docs/20260603-commerce-links-validator-preanalysis.md`（night-22；R1..R15 / C1..C9 rule contract；§6 content-reference 思路源）
- `docs/20260604-commerce-links-registry-fixture-mechanism-preanalysis.md`（am-2；fixture mechanism Option D；Option A path naming convention）
- `docs/20260604-commerce-links-content-reference-validation-preanalysis.md`（am-7；C1..C9 content-reference rule + ref data model；§5.7 C6 原始 deferred 理由）
- `docs/20260607-commerce-content-ref-c1c2c3c5-fixture-preanalysis.md`（night-2；C1/C2/C3/C5 fixture cadence；§4.1 path convention；§5.1 共同 frontmatter 樣板；§5.6 紅線；本檔承襲）
- `docs/20260607-commerce-renderer-fallback-contract-preanalysis.md`（night-9；renderer fallback contract；§E.5 selected option 5B；本檔對齊「C6 warning-only；不強迫 renderer 改變行為」）
- `docs/20260607-commerce-c6-coexistence-warning-preanalysis.md`（night-12；C6 source design；§F 推薦 rule id / trigger / cascade；§H 三策略 H-α / H-β / H-γ；§I 三 baseline 選項 Option 1 / 2 / 3；本檔之直接前身）
- `CLAUDE.md` §1（不過度工程化）/ §3.2（commerce registry 狀態 + 紅線）/ §9（CSS class 命名 + Flexbox 優先）/ §12（書評 affiliate.links schema）/ §16（連結處理 + reverse UTM dormancy）/ §22（圖片素材）/ §27（修改紅線）/ §29（第一版不做清單）/ §30（最終樣貌）
- `content/settings/commerce-links.json`（empty registry；本 phase 不動）
- `content/settings/affiliate-networks.json`（既有 network registry；本 phase 不動）
- `src/scripts/load-settings.js` lines 59–66（commerce loader；本 phase 不動）
- `src/scripts/validate-content.js` lines 567–674（`validateCommerceRefs`；C6 source landed at `281cd43`；本 phase 不動）
- `src/views/pages/post-detail.ejs`（既有 raw affiliate render；本 phase 不動）
- `src/views/blogger/blogger-post-full.ejs`（既有 Blogger raw affiliate render；本 phase 不動）
- 4 個已落地 commerce content-ref fixtures（本 phase 不動）：
  - `content/validation-fixtures/blogger/posts/_test-commerce-ref-invalid-type.md`
  - `content/validation-fixtures/blogger/posts/_test-commerce-ref-empty.md`
  - `content/validation-fixtures/blogger/posts/_test-commerce-ref-not-found.md`
  - `content/validation-fixtures/blogger/posts/_test-commerce-ref-duplicate.md`
- `content/blogger/posts/20260515-we-media-myself2.md` lines 59–71（既有唯一使用 raw `url` 之 production post；`affiliate.enabled: false` + `position.top/bottom: false`；無 `ref`；C6 不觸發；本 phase 不動）
- `content/templates/blogger-book-review-template.md` / `blogger-magazine-review-template.md`（`affiliate.links: []` 範本；本 phase 不動）

---

## Appendix B — Baseline snapshot

- repo path：`D:\github\blog-new\portable-blog-system`
- branch：`main`
- HEAD（pre-commit）：`ba7c8e7dc28e819ff48971bc66b8ddf59add2009`
- `HEAD == origin/main`（pre-commit）：yes（ahead / behind = `0 / 0`）
- working tree（pre-commit）：clean
- latest commit subject（pre-commit）：`docs(claude): sync commerce C6 source state`
- `npm run validate:content`（pre-commit）→ **0 errors / 66 warnings / 57 posts**

本階段結束後預期：

- 唯一新增：本檔 `docs/20260607-commerce-c6-fixture-strategy-preanalysis.md`
- 其他狀態完全不變
- `npm run validate:content`（post-commit）預期維持 **0 errors / 66 warnings / 57 posts**

---

（本文件結束）
