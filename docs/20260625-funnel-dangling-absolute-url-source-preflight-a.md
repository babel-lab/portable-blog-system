# downloadFunnel — dangling / absolute-URL / placeholder source preflight

- Phase id：`20260625-funnel-dangling-absolute-url-source-preflight-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**docs-only preflight**（純分析；**不**實作 validator logic、**不**新增 fixture、**不** baseline bump）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）。**不**影響 C / F / J / L 任何 source。
- 授權：Dean explicit approval（本 phase scope 限定 docs-only preflight）
- 性質：mirror slice 3 / 5 / 7 / 9 之「preflight→landing」節奏；本文僅為**後續 source landing 的前置風險盤點**，不啟動任何升級。

---

## 1. Baseline verification 摘要

進場 baseline（read-only，未跑任何 validation / build / script）：

| 檢查 | 結果 |
| --- | --- |
| `git status --short` | （空）clean ✅ |
| `git status --branch --short` | `## main...origin/main`（無 ahead/behind 標記）✅ |
| `git rev-parse --abbrev-ref HEAD` | `main` ✅ |
| `git rev-parse HEAD` | `4255e6ae13a40218538bb244b78cd13c318fab33`（`4255e6a`）✅ |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` ✅ |
| `.git/index.lock` | 不存在 ✅ |
| `git log --oneline -8` top | `4255e6a test(download): add scanned invalid funnel fixture baseline` ✅ |

起點 subject 與要求一致；working tree clean；可安全進行 docs-only preflight。

---

## 2. 目前 sealed state 摘要（與本 preflight 相關部分）

downloadFunnel validator（`src/scripts/validate-content.js`）已 landed slices：

- **F2** structural / role-enum / suspicious-field（block 11）
- **F2 §5.2** required-combo（block 12）
- **F4 §5.4** role↔policy 一致性
- **F6 §5.4** role↔robots-safety（重用 `resolvePostDetailRobots`）
- **F7 §5.3** value-based private-value heuristic（`looksLikePrivateFunnelLink`，純函式、no-value-echo）
- **F8 §5.4** bidirectional cross-file reciprocity（corpus pass；`normalizeFunnelRef`；2 方向 code）

fixture corpus（5 個 `.md`，全 placeholder）：

| Group | 檔案 | 行為 | bump |
| --- | --- | --- | --- |
| 1 valid | `_test-download-funnel-valid-entry.md` / `_test-download-funnel-valid-gated-page.md` | 0 warning | 不 bump |
| 2 deferred | `_test-download-funnel-dangling-target.md` / `_test-download-funnel-absolute-url-target.md` | 0 warning（deferred → silent） | 不 bump |
| 3 scanned invalid | `_test-download-funnel-invalid-entry.md` | 恰 1 warning（required-combo） | 已 bump |

validation baseline（carry-forward，本 phase 不變動）：`validate:content` 0/134/106；overlay 0/141/107；`check-page-type-validator` 103/0；`check:validation-report` 27/0；**production downloadFunnel trigger = 0**。

唯一含 download 概念的 production 頁 `content/github/posts/20260504-portable-blog-system-mvp.md` **不含** `downloadFunnel` 欄位 → 不觸發任何 funnel rule。本 preflight 之任何後續升級於 production 之**現況觸發數仍為 0**（無 production funnel metadata 可命中）。

---

## 3. dangling / absolute-URL / placeholder / host-mismatch 行為盤點

本節盤點「ref-like value」目前在 validator 內的**實際處理**。所有 funnel ref 之 cross-file 解析都集中在兩個純函式（`normalizeFunnelRef` / `looksLikePrivateFunnelLink`）+ bidirectional corpus block。

| ref 類型 | 範例（placeholder） | 目前處理 | 對應碼點 |
| --- | --- | --- | --- |
| **simple slug**（單段，可解析） | `gated-x` | normalize → 比對 corpus slug；不一致才 warn（reciprocity） | `normalizeFunnelRef` → bidirectional block |
| **dangling**（corpus 無對應 slug） | `fake-nonexistent-gated-download-slug` | **skip → silent**（解析得到 slug 但 `funnelPostBySlug.get()` = undefined） | bidirectional block `if (!gated) continue` |
| **absolute URL**（含 `://`） | `https://example.github.io/fake-gated-download` | **skip → silent**（`normalizeFunnelRef` 見 `://` 回 `null`） | `normalizeFunnelRef` line 180 |
| **placeholder / opaque ID / 多段 relative path** | `a/b/c`、`some-opaque-id` | normalize 後仍是字串 → 當 simple slug 比對；corpus 無 → 等同 dangling → **skip → silent** | `normalizeFunnelRef` + dangling skip |
| **host-mismatch**（不同站之 absolute URL） | `https://other.example.com/gated-x` | **skip → silent**（含 `://` → `null`；根本未做 host 比對） | `normalizeFunnelRef` line 180 |
| **private-looking value**（Drive / Form / token） | `https://drive.example.com/drive/folders/FAKE` | **F7 warn**（private-value，warning-only，**no-value-echo**）；cross-file 端 `refSlug` 因 `looksLikePrivateFunnelLink` 命中而回 `null` → bidirectional **不重複告警** | `looksLikePrivateFunnelLink` line 149 + `refSlug` line 117 |

**結論**：除「private-looking value」由 F7 主動 warn 外，**dangling / absolute URL / placeholder / host-mismatch 目前一律 deferred → silent**，validator 不對其產生任何 warning。此為**刻意保守設計**（避免 false-positive），非疏漏。

---

## 4. `normalizeFunnelRef` 與 bidirectional cross-file reciprocity 目前 skip 條件摘要

### 4.1 `normalizeFunnelRef(value)`（`validate-content.js` line 177）

純函式，回傳「可比對 slug」或 `null`：

1. 非 string → `null`
2. trim 後空字串 → `null`
3. **含 `://`（absolute URL）→ `null`**（deferred；不 cross-file resolve）
4. 否則：strip querystring（`?`）+ hash（`#`）→ strip 前後斜線 → 空則 `null`，否則回該字串
5. **case-sensitive**；**不**做 `.html` strip；**不**取 last-segment（保守：多段 path 不視為 last-segment slug，等同無法精確匹配 → dangling）

### 4.2 bidirectional corpus block（line 3095–3166）

- 只在 corpus 層（全 posts）執行；**不**放單篇 `validatePageTypeMetadata`（後者無 corpus context）。
- `refSlug(raw)` = `typeof raw === 'string' && !looksLikePrivateFunnelLink(raw) ? normalizeFunnelRef(raw) : null`
  → private-looking（F7 已 warn）/ 非 string（F2/F3）/ absolute / 空 → `null` → **skip**
- 方向 1（entry E → targetGatedPage G）：`targetSlug === null` → skip；`!gated`（dangling）→ skip；目標非 `gated_page` → skip；G 之 `entryPages` 未含 E → `entry-page-not-listed-by-gated-page`（掛 E）
- 方向 2（gated G 之 entryPages 列 E）：`entrySlug === null` 或重複 → skip；`!entryPost`（dangling）→ skip；列入者非 entry → skip；`backSlug === null`（E 的 target 不可解析）→ skip；`backSlug !== ownSlug` → `gated-page-not-targeted-by-entry`（掛 G）
- **message 只用 safe own-slug + sourcePath，絕不 echo raw ref value**（red line）

---

## 5. `check-validation-report.js` C5 / C6 / C7 鎖住的 deferred→silent 行為

corpus harness（直接餵 `validateContent`，全 placeholder slug）已把以下「deferred→silent」行為鎖成**回歸測試**：

| case | 內容 | 斷言 |
| --- | --- | --- |
| **C5** dangling | entry `targetGatedPage: 'nonexistent-gated'`（corpus 無對應 post） | 0 bidir warning |
| **C6** absolute URL | entry `targetGatedPage: 'https://example.com/gated-x'`，且存在 reciprocating gated | 0 bidir warning（`://` → 不解析） |
| **C7** private-looking | entry `targetGatedPage: 'https://drive.example.com/drive/folders/FAKE'` | 0 bidir warning（F7 端另 warn，cross-file 端 skip 不重複） |

並由 group 2 `.md` fixture（`_test-download-funnel-dangling-target.md` / `_test-download-funnel-absolute-url-target.md`）+ B6 斷言端對端鎖住「scanned `.md` 0 warning → 不 bump baseline」。

→ **任何未來升級若要把這些 case 從 silent 改為 warning，必然會改變 C5/C6/C7 + B6 + group2 fixture 的預期**，因此屬「行為變動 phase」，須各自 baseline bump + 改測試 + Dean approval。

---

## 6. Decision 待定區（本 phase **不**裁定，僅列出供未來 phase 決策）

以下皆為**開放問題**，本 preflight 只盤點利弊，**不**做任何選擇、**不**寫 code、**不**改測試：

### 6.1 dangling ref 是否要 warning
- **支持**：作者打錯 slug / 目標頁尚未建立時可早期發現。
- **反對 / 風險**：多檔案分批落地時，entry 先於 gated 落地會暫時 dangling → 噪音；migration 過程大量誤報。
- **若升級**：建議 warning-only + 明確 code（如 `downloadFunnel-target-gated-page-not-found`），no-value-echo（只報 own-slug）；須 scanned invalid fixture + explicit bump phase。

### 6.2 absolute URL 是否要 warning
- **支持**：funnel ref 設計上應為 repo-internal slug；absolute URL 多半是誤填（或本該走 private-value F7）。
- **反對 / 風險**：跨平台（Blogger→GitHub）合法 absolute URL 場景存在；一律 warn 可能誤傷。
- **若升級**：須先界定「哪種 absolute URL 合法」；可能與 host-mismatch（6.3）合併設計。

### 6.3 host-mismatch 是否要 warning
- 目前**完全未做 host 比對**（見 `://` 即放棄解析）。
- **若升級**：須引入 `settings.site.githubSiteUrl` / `bloggerSiteUrl` host 對照（與 §16.4 reverse-UTM 之 host 判斷同源），判「同站 absolute → 可 normalize 成 slug」vs「外站 → warn or skip」。屬較大設計，建議獨立 phase。

### 6.4 `.html` normalization 是否要支援
- 目前 `normalizeFunnelRef` **不**做 `.html` strip、**不**取 last-segment（保守）。
- **支持**：Blogger published URL 帶 `/yyyy/mm/slug.html`，未來 migration 後 ref 可能帶 `.html`。
- **反對 / 風險**：一旦做 last-segment / `.html` strip，誤匹配（不同目錄同名 slug）風險上升。
- **若升級**：須與 §24 Blogger URL 規則 + `publish-json-schema.md` §5.3 對齊；建議搭配 host-mismatch 一併設計。

### 6.5 host vs utm false-positive
- F7 `FUNNEL_SECRET_QUERY_KEY_RE` 已刻意**只**命中 `token|key|auth|email|respondent`，**不**命中一般 querystring（如 `utm_*`），避免誤判。
- 任何 6.1–6.4 升級若引入新的 string 啟發式，**必須**沿用此「精確 key、不掃一般 querystring」紀律，避免把帶 `utm_*` 的合法連結誤報。
- no-value-echo 紀律延伸：任何新 warning **絕不** echo raw ref value（value 可能含真實 Drive ID / Form URL / token）。

---

## 7. 後續 source landing 風險總結

| 維度 | 現況 | 升級風險 | 是否須 baseline bump |
| --- | --- | --- | --- |
| dangling → warning | silent（C5 鎖） | migration 過程噪音 | 是（改 C5 + scanned fixture） |
| absolute URL → warning | silent（C6 鎖） | 跨平台合法 URL 誤傷 | 是（改 C6 + fixture） |
| host-mismatch → warning | 未做 host 比對 | 需引入 site host 設定；設計較大 | 是 |
| `.html` / last-segment normalize | 不做 | 誤匹配風險 | 視行為而定（可能不 bump 若僅擴大匹配且無新 warning） |
| no-value-echo / utm false-positive | F7 已守紀律 | 新啟發式須沿用 | — |

→ 建議未來 source landing **逐維度獨立 phase**，每個改 validator 行為者皆須：scanned invalid fixture（如適用）+ §3a snapshot + `check-validation-report` BASELINE 調整 + Dean explicit approval 三者齊備。本 preflight **不**啟動任何一項。

---

## 8. 未觸碰紅線（明確聲明）

- ❌ 未改 `validate-content.js` 任何 validator logic / 任何 source。
- ❌ 未新增 / 修改任何 fixture。
- ❌ 未 baseline bump；未跑 `validate:content` / `report:validation` / `check:*` / 任何 script。
- ❌ 未 build / deploy / dev server。
- ❌ 未碰 production content / settings / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages / .cache / generated HTML。
- ❌ 未碰 `MEMORY.md` / `memory/`。
- ❌ 未寫入真實 Drive ID / Form URL / token / secret / respondent data（全 placeholder）。
- ❌ 未 rebase / amend / force-push。
- ❌ 未碰 Blogger live / Google Form / Google Drive / GA4 backend / AdSense / Search Console / Admin write path。

---

## 9. Cross-links

- `docs/20260624-gated-download-funnel-spec-lock.md`（funnel spec 唯一定義來源；§5.4 deferred 維度）
- `docs/20260625-download-funnel-md-fixture-group2-landing-record.md`（dangling / absolute deferred fixtures）
- `docs/20260625-group3-scanned-invalid-bump-landing-record.md`（§8 deferred 清單）
- `docs/20260625-funnel-metadata-schema-validator-slice9-bidirectional-preflight.md`（F8 cross-file 設計）
- `src/scripts/validate-content.js`（`normalizeFunnelRef` / `looksLikePrivateFunnelLink` / bidirectional block）
- `src/scripts/check-validation-report.js`（C5 / C6 / C7 / B6 deferred locks）

---

`NO VALIDATOR LOGIC CHANGE`
`NO FIXTURE CHANGE`
`NO BASELINE BUMP`
`DOCS-ONLY PREFLIGHT LANDING`

（本文件結束）
