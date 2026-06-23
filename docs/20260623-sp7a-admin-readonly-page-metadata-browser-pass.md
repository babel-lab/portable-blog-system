# SP-7a — Admin read-only page metadata summary（browser-PASS / verification evidence record）

> Phase：`20260623-pm-sp7a-admin-readonly-page-metadata-browser-pass-a`（2026-06-23）
> Baseline：`main @ a1bfcb1`（HEAD == origin/main，ahead/behind 0/0，working tree clean）
> 對象：SP-7a 落地（commit `a1bfcb1` `feat(admin): show read-only page metadata summary`）之 read-only Admin
> 「Page metadata / 頁面中繼設定」section。
> 前身：
> - `docs/20260623-pm-sp7-admin-metadata-visibility-preanalysis.md`（SP-7 規格 / 顯示契約 §F.5）
> - `docs/20260623-pm-sp7a-admin-readonly-page-metadata-summary.md`（SP-7a 實作 ledger）

本 phase **只做驗收 + evidence record**，不做新功能、不改 source / content / settings / build / output。
唯一 mutation = 本 docs 檔。

---

## A. Phase name

`20260623-pm-sp7a-admin-readonly-page-metadata-browser-pass-a`

## B. Baseline observed

| 項目 | 值 |
|---|---|
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `a1bfcb1` |
| origin/main | `a1bfcb1` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `feat(admin): show read-only page metadata summary` |

baseline 與 phase 預期完全一致。

## C. Files changed

| 檔案 | 變更 |
|---|---|
| `docs/20260623-sp7a-admin-readonly-page-metadata-browser-pass.md` | **新增**（本 evidence record；唯一 mutation） |

未動：任何 `src/**` / `content/**` / `settings/**` / `package.json` / lockfile / `dist*` / `gh-pages` /
`.cache/**` / 生成 HTML / `CLAUDE.md` / `MEMORY.md`。驗證期間 render 輸出只寫入 session scratchpad（已刪），
repo working tree 全程 clean。

## D. Validation / smoke results

| 量測 | 期望 | 實測 |
|---|---|---|
| `npm run validate:content` | 0 error / 104 warning / 94 post | ✅ **0 / 104 / 94**（無漂移） |
| `node src/scripts/check-page-type-validator.js`（SP-2） | 20 / 0 | ✅ **20 passed, 0 failed** |
| `node src/scripts/check-page-type-robots.js`（SP-3） | 29 / 0 | ✅ **29 passed, 0 failed** |
| `node src/scripts/check-include-in-listings.js`（SP-4a） | 16 / 0 | ✅ **16 passed, 0 failed** |
| `node src/scripts/check-include-in-sitemap.js`（SP-5a） | 19 / 0 | ✅ **19 passed, 0 failed** |
| `node src/scripts/check-page-metadata-summary.js`（SP-7a） | 22 / 0 | ✅ **22 passed, 0 failed** |

全部與 SP-7a ledger 量測一致，無漂移。

## E. Verification method（明示，誠實揭露）

Admin 為 **dev-mode-only standalone HTML**：`build-github.js`（`mode === 'dev'` 分支，第 829–857 行）以
`loadAdminPosts({ settings })` 取 view 資料後，`ejs.renderFile('src/views/admin/index.ejs', {...})`
render 成 `.cache/pages/admin/index.html`，由 vite dev server serve 於 `/admin/`。`/admin/#posts` 的 hash
僅 client-side 切 tab；per-post detail panel 與「Page metadata」section 皆為 **server-render 進 HTML**，
非 client fetch。

本驗收以 **與上述 dev-mode 完全相同的 render 路徑**（同一 `loadAdminPosts` + 同一 `ejs.renderFile` 呼叫、
同一 context 欄位）在 session scratchpad 重現 render，並直接檢視 server-rendered DOM —— 即 vite dev server
在 `/admin/` 會交給瀏覽器的同一份 HTML。

- 未驅動 GUI 瀏覽器點擊；改為直接檢視 render 後 DOM（更可靠、且不污染 `.cache/dist`）。
- section collapse 為 **原生 `<details>`/`<summary>` disclosure**（零 JS 依賴）：`<details>` 無 `open`
  屬性 → 預設收合；點 summary 由瀏覽器原生展開。
- render 輸出檔僅落 session scratchpad，驗證後刪除；repo working tree 全程 clean（git status 確認無
  `.cache`/`dist`/任何變動）。

> 註（與 K7/K8/K9 之差異）：K 系列為 Dean 本機 GUI 操作之 user-evidence；本 SP-7a 為 server-rendered DOM
> 檢視。兩者皆驗證同一份 dev server HTML；若需 GUI 互動證據（實際滑鼠展開 + 截圖），可由 Dean 本機
> `npm run dev` 補錄，惟 render 結果已逐欄位確認，互動為原生 `<details>` 行為。

## F. Browser / rendered verification summary（checklist）

render：12 posts，HTML 635,557 bytes，render 無 error；`Page metadata / 頁面中繼設定` section 出現
**12 次（= 每篇 1 個）**。

| # | 驗收項 | 結果 |
|---|---|---|
| 1 | `/admin/#posts` loads | ✅ render OK，12 posts，DOM 完整 |
| 2 | post detail panel 開啟 | ✅ 12 個 detail panel（Identity ×12 等既有 section 皆在） |
| 3 | 新 section `Page metadata / 頁面中繼設定` 出現、預設收合 | ✅ 12 個 `<details class="detail-section">` 無 `open` 屬性 → 預設 closed；summary 顯示 effective 一行「索引 · 列表 · sitemap」 |
| 4 | section read-only（無 input/select/textarea/form/fetch/write button） | ✅ 12 個 rendered section write-path scan：`<input`/`<select`/`<textarea`/`<button`/`<form`/`onclick`/`onchange`/`addEventListener`/`fetch(`/`writeText`/`execCommand`/`contenteditable`/`apply-disabled` **全部 0 命中**（source grep 1134–1232 亦 0；唯一字面命中為宣告「無 write path」之註解） |
| 5 | 缺省 metadata 之 normal post → default/current behavior，非 error | ✅ 例 `reading-notes-three-questions`：頁面類型 `article (default)`、索引 `可收錄`、robots `index, follow`、列表/ sitemap effective `true`、warnings `[]`；無 error、不進 Missing metadata banner |
| 6 | `portable-blog-system-mvp` 顯示契約 | ✅ 見 §G |
| 7 | 無 secret（URL / 表單回覆 / token 不外洩） | ✅ 見 §I |
| 8 | 既有 validation warning 顯示仍運作 | ✅ Validation section 仍 render（rendered 文字出現 26 次）；`npm run validate:content` 0/104/94；validator 仍為 ground truth |
| 9 | 既有 detail section 仍可用、detail panel 不破版 | ✅ Identity ×12 / Governance signals（per-post）/ Validation 皆 render；section 順序 = Readiness → **Page metadata** → Governance signals（per index.ejs 1232→1234）；真實 `<details>` 標籤平衡（見 §J） |

## G. MVP download display result（`portable-blog-system-mvp`，github / contentKind:download / ready）

rendered detail panel「Page metadata」section（逐字節錄）：

```
▸ Page metadata / 頁面中繼設定   read-only · derived   [索引: 不收錄 · 列表: 顯示 · sitemap: 排除]
  頁面類型 / Page type        [article (default)]  (缺省視為一般文章)
  搜尋引擎索引 / Indexing      [不收錄]  (seo.indexing = noindex-follow, source: frontmatter.seo.indexing)
  robots meta (effective)     [noindex, follow]  (source: frontmatter.seo.indexing)
  顯示於列表 / Listings        [顯示]   raw: auto → effective: true
  加入 sitemap / Sitemap       [排除]   raw: auto → effective: false
                              (legacy contentKind:download / noindex safety；與 listing 正交)
  加入 feeds / Feeds           [auto]  (feed 未啟用 · no consumer)
  受控下載 / Gated download    —
  平台覆寫 / Platform policy    — (全平台沿用頂層值)
```

loader `pageMetadata` 物件（餵 EJS 之來源；逐欄位）：

```json
{
  "pageType":         { "raw": "", "present": false, "valid": null, "label": "article (default)" },
  "seoIndexing":      { "value": "noindex-follow", "indexable": false, "source": "frontmatter.seo.indexing" },
  "robots":           { "value": "noindex, follow", "source": "frontmatter.seo.indexing" },
  "includeInListings":{ "rawLabel": "auto", "effective": true },
  "includeInSitemap": { "rawLabel": "auto", "effective": false, "eligible": false },
  "includeInFeeds":   { "rawLabel": "auto", "hasConsumer": false },
  "gatedDownload":    { "present": false, ... },
  "platformPolicy":   { "present": false, "platforms": [] },
  "warnings":         [],
  "summary":          { "indexable": false, "listing": true, "sitemap": false, "warningCount": 0 }
}
```

對照 SP-7 §F.5 指定顯示契約：

| 契約 | 結果 |
|---|---|
| **included in listings = true / 顯示 / current behavior** | ✅ `顯示`（effective `true`，badge `b-ok`，無 hidden） |
| **sitemap excluded = excluded by legacy download safety** | ✅ `排除`（effective `false`，`eligible:false`）+ note「legacy contentKind:download / noindex safety；與 listing 正交」 |
| **no unintended warning** | ✅ `warnings: []`，summary 列無 `b-warn` badge |
| listing 與 sitemap 明顯不同步並陳 | ✅ 列表「顯示」、sitemap「排除」一眼可辨 |

> 註：MVP 之 robots/indexing 顯示 `noindex, follow` 且 source = `frontmatter.seo.indexing`（該文章 frontmatter
> 已 explicit `seo.indexing: noindex-follow`），與「legacy download safety 致 sitemap 排除」並不衝突——
> sitemap 排除之 effective `false` 同時受 noindex safety 與 legacy download safety 觸發（兩者皆指向排除），
> 顯示契約「stays in listings / excluded from sitemap / no warning」完全滿足。

跨全部 production post（12 篇）：12/12 皆攜帶 `pageMetadata`；**warnings = 0 跨全部 production post**
（無任何 SP-2 危險組合在現有內容觸發 → §F.4 收合摘要列無 `b-warn` badge）。

## H. Read-only / write-path confirmation

- SP-7a section（index.ejs 1134–1232）source grep 與 12 個 rendered section DOM scan **皆 0 write-path token**
  （input / select / textarea / button / form / onclick / onchange / addEventListener / fetch / writeText /
  execCommand / contenteditable / apply-disabled）。唯一字面命中為宣告「無 write path」之 EJS 註解行。
- section 純 `<details>` / `<summary>` / `<dl>` / `<dt>` / `<dd>` / `<span class="badge">` / `<code>` / `<p>`；
  互動僅原生 `<details>` 收合。
- 未碰 `admin-write-cli` / `admin-frontmatter-patcher` / `admin-field-validators` / middleware / safe-write；
  未接入 SEO dry-run editor / static payload preview / K7 copy buttons。
- **Admin write path 維持 dormant；Apply 維持 disabled**（本 phase 未啟用任何寫入入口）。

## I. No-secret confirmation

- 12 個 rendered「Page metadata」section 之 no-secret scan：`token` / `password` / `OAuth` / `Bearer` /
  Drive folder 連結（`drive.google.com/.../folders`）/ Google Form 回覆（`responses?` / `spreadsheets/d/`）
  pattern **全部 0 命中**。
- `gatedDownload` / `platformPolicy` 投影層（loader）僅取 safe 欄位（`mechanism` / `postSubmitResource` /
  平台名 + indexing/listings）；suspicious key **只列 key 名、不 echo value**（SP-7a smoke case 17 / 21 已覆蓋，
  本驗收 production 12 篇 `gatedDownload.present` 皆 false → 無任何敏感欄位輸出）。
- 未輸出任何 AdSense client/slot id、GA4 measurementId 全值、affiliate dashboard 憑證、私有 URL、表單回覆。

## J. Structural / regression notes

- section DOM 順序：detail panel 內 Readiness（含 Validation）→ **Page metadata**（新）→ Governance signals
  （index.ejs 1232 `</details>` 後接 1234 Governance signals），與 SP-7 §D.5 / SP-7a ledger §E 落點一致。
- rendered HTML 真實 `<details[ >]` open 89 / `</details>` close 88：唯一「未配對」之 `<details>` 位於文件
  早段一段 **HTML 註解**內之字面字串「`<details>` 收合區（預設 closed…）」（static payload preview 之
  Phase 20260618 既有註解文字，**非** SP-7a、**非**真實標籤、瀏覽器忽略）。stack-walk 證實 SP-7a 之 12 個
  Page metadata `<details>` 各自 `<details>…</details>` 完整配對，detail panel 不破版。
- `npm run validate:content` 0/104/94 不漂移（validator / severity / count 未受 SP-7a 影響）。

## K. What was NOT done（本 phase 邊界）

- ❌ 未改任何 `src/**` / `content/**` / `settings/**` / `package.json` / lockfile / `dist*` / `gh-pages` /
  `.cache/**` / 生成 HTML / `CLAUDE.md` / `MEMORY.md`（唯一 mutation = 本 docs 檔）。
- ❌ 未啟用 Admin write path / Apply / SEO dry-run / payload preview / copy buttons。
- ❌ 未 build / deploy / preview / 持續執行 dev server（render 為 throwaway，輸出僅落 scratchpad 已刪）。
- ❌ 未 repost Blogger；未存取 GA4 / AdSense / Search Console / Blogger / Drive 後台。
- ❌ 未啟動 SP-8（platformPolicy 子欄位 shape validator）/ SP-9（feed builder）/ validator export refactor /
  Google Form 頁 content migration。
- ❌ 未驅動 GUI 瀏覽器互動（驗收以 server-rendered DOM 檢視，§E 已揭露）。

## L. Final verdict

**PASS。**

SP-7a「Page metadata / 頁面中繼設定」read-only section 於 dev-mode Admin render 完整出現於全 12 篇 detail
panel，預設收合，純 `<dl>` 顯示、零 write path、零 secret 外洩；`portable-blog-system-mvp` 完全符合
SP-7 §F.5 顯示契約（列表「顯示」/ sitemap「排除（legacy download safety）」/ 無 warning）；normal post 缺省
顯示 default/current behavior 非 error；既有 validation / detail section 不破版、不回歸；validate baseline
0/104/94 不漂移。無任何 minor UI issue（§J 之 `<details>` 計數差異為註解內字面字串，benign）。

## M. Final git state

- 新增 1 檔：`docs/20260623-sp7a-admin-readonly-page-metadata-browser-pass.md`（本檔）。
- commit subject：`docs(admin): record page metadata browser pass`。
- 其餘 working tree clean；無 source / content / settings / dist / gh-pages / `.cache` 變動。

## N. Next recommended phase / idle freeze

- SP-7a 已 source-landed（`a1bfcb1`）+ browser-PASS（本檔）→ 建議 **idle freeze**。
- 後續（各須另開 phase + user explicit approval；不主動執行）：SP-8（platformPolicy 子欄位 shape validator）/
  SP-9（feed builder）/ validator `validatePageTypeMetadata` export refactor（消除 SP-7a §F temporary
  duplication）/ Google Form 頁 content migration / 任何 Admin write path / Apply 啟用。
- 不主動 build / deploy / repost / dev server / 動 Google 後台 / 改 `CLAUDE.md` / `MEMORY.md`。

---

## Cross-links
- `docs/20260623-pm-sp7-admin-metadata-visibility-preanalysis.md`（SP-7 規格 / §F.5 顯示契約）
- `docs/20260623-pm-sp7a-admin-readonly-page-metadata-summary.md`（SP-7a 實作 ledger）
- `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2 validator rules）
- `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3 robots helper）
- `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a listing helper）
- `docs/20260623-pm-sp5a-include-in-sitemap-selector-wiring.md`（SP-5a sitemap helper）
- `CLAUDE.md` §11 / §15–§17 / §21 / §23 / §27 / §29

（本文件結束）
