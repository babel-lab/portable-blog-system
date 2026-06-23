# SP-2 — Special page-type / indexing metadata：schema lock + warning-only validator + fixtures

> Phase：`20260623-pm-sp2-page-type-schema-warning-validator-fixtures-a`（2026-06-23）
> Baseline：`main @ cbd5d24`（HEAD == origin/main，ahead/behind 0/0，working tree clean）
> 前身：`docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1，docs-only）

本 phase 落地 preanalysis §6.4 之 **SP-2**：純 additive validation layer。**不改** build / render / listing / archive / category / tag / sitemap / Blogger / GitHub Pages / Admin write path 任何行為，亦**不消費**新欄位於任何 output 邏輯（SP-3+ 才接）。

---

## 1. Schema fields locked（optional；`.md` frontmatter；warning-only）

| 欄位 | 型別 | 說明 |
|---|---|---|
| `pageType` | string（封閉列舉） | 內容語意之 IA 角色。**與 build-github.js 內部 render-time 變數 `pageType`（home/post-detail/post-list/404/design-system）為兩個獨立概念**，互不推導、互不消費。validate-content.js 內無同名變數，讀 `post.pageType` 為單純 property access，無命名衝突。 |
| `includeInListings` | boolean | 是否入站內列表（preanalysis §2.4 核心新維度）。 |
| `includeInSitemap` | boolean | 是否入 sitemap override（§2.3）。 |
| `includeInFeeds` | boolean | feed override（§2.5；目前無 feed 消費端）。 |
| `platformPolicy` | object | 平台 override 巢狀物件（§2.7）。 |
| `gatedDownload` | object | 閘門下載描述子（§2.8）；**不得含** secret / token / 表單回覆 / 私有下載權限。 |

`pageType` 列舉值（採 SP-2 spec 明示之 **snake_case**；與 preanalysis §3 之 hyphen 命名不同，以 spec 為準）：

```
article  static_page  download  gated_download  landing  utility_hidden  redirect_canonical  platform_special
```

---

## 2. Warning-only validator behavior（`validatePageTypeMetadata`）

實作於 `src/scripts/validate-content.js`；於 ready/published post loop 內呼叫（mirror 既有 `invalid-seo-indexing` / commerce / adsense block validators 之 gate）。**全部 severity = `warning`；嚴禁 error。所有欄位 optional，缺省 → 0 觸發。Missing `pageType` 不警。**

| # | rule type | 觸發條件 |
|---|---|---|
| 1 | `page-type-invalid` | `pageType` present 但非合法列舉值（含非 string）。 |
| 2 | `page-include-flag-invalid-type` | `includeInListings`/`includeInSitemap`/`includeInFeeds` present 但非 boolean（per 欄位各報一條）。 |
| 3 | `page-platform-policy-invalid-type` | `platformPolicy` present 但非 plain object。 |
| 4 | `page-gated-download-invalid-type` | `gatedDownload` present 但非 plain object。 |
| 5 | `page-gated-download-indexed` | `pageType=gated_download` 且 `seo.indexing=index`（最高風險組合）。 |
| 6 | `page-gated-download-in-listings` | `pageType=gated_download` 且 `includeInListings=true`。 |
| 7 | `page-noindex-in-sitemap` | `seo.indexing` ∈ {noindex-follow, noindex-nofollow} 且 `includeInSitemap=true`（正交）。 |
| 8 | `page-noindex-in-listings` | `seo.indexing` ∈ {noindex-follow, noindex-nofollow} 且 `includeInListings=true`（正交）。 |
| 9 | `page-redirect-canonical-missing-target` | `pageType=redirect_canonical` 但 `canonical` 缺 / 空 / `"auto"`（repo 既有 `canonical` 欄位慣例 → 可實作，不 defer；per §2.6 / §5.3）。 |
| 10 | `page-gated-download-suspicious-field` | `gatedDownload` 含 disallowed **key 名稱**（token/secret/password/apiKey/authorization/bearer/driveFolderId/responses/responseData/respondents…）。**僅比對 key 名稱、不檢查 value**（避免 false positive；message **不** echo value）。 |

**Deferred（不在本 phase）**：

- gatedDownload **value-based**「direct private download URL」偵測 → deferred（誤判風險；對齊 commerce R15 suspicious-secret-token 之 defer 理由；red-line value 掃描另行 grep 處理）。
- `platformPolicy` 巢狀 per-platform 欄位 shape（indexing/includeIn* 子欄位）→ deferred（屬 SP-7）。
- 所有 build / render / sitemap / listing 消費 → SP-3..SP-9。

---

## 3. Fixtures / tests

**Fixtures（13 個，`content/validation-fixtures/github/posts/_test-page-*.md`）** —— 沿用既有 `validation-fixtures` 慣例：僅被 `validate-content` main entry 掃描，**不**被 `build:github` / `build:blogger` / `build:promotion` 掃到（三端 loader 路徑為 `content/{site}/posts`）。

- valid（0 SP-2 warning）：`absent-valid` / `gated-download-valid` / `redirect-canonical-valid`
- invalid（各觸發 1 條對應 warning）：`invalid-unknown` / `gated-download-indexed` / `gated-download-in-listings` / `gated-download-invalid-type` / `gated-download-suspicious-field` / `include-flag-invalid-type` / `platform-policy-invalid-type` / `noindex-in-sitemap` / `noindex-in-listings` / `redirect-canonical-missing-target`

**Smoke harness**：`src/scripts/check-page-type-validator.js`（自含；zero new dependency；`node src/scripts/check-page-type-validator.js`）—— 20 case in-memory deterministic locks，含「全 8 合法 pageType / 缺省 0 觸發 / 每規則精準觸發 / SP-2 issue 必為 warning / suspicious-field 不 echo value」。**20/0 PASS。** 未加 package.json script（直接 node 呼叫；避免 package 變動）。

---

## 4. Validation results

| 量測 | 落地前 | 落地後 | Δ |
|---|---|---|---|
| `npm run validate:content` | 0 / 94 / 84 | **0 / 104 / 94** | +10 warning / +10 issue-post |
| overlay（`--registry-overlay …commerce-c4-c9-overlay.json`） | 0 / 101 / 85 | **0 / 111 / 95** | +10 / +10 |
| `node src/scripts/check-page-type-validator.js` | —（新） | **20 / 0 PASS** | — |

- Δ +10 = 10 個會觸發 warning 之 fixture；3 個 valid fixture 貢獻 0 warning。
- **所有 `page-*` warning 皆落在 `_test-page-*` fixtures；production-post warnings 仍 0**（grep 確認無任一 production / current post 觸發 SP-2 warning）。
- error count 維持 **0**。

---

## 5. Output-preservation confirmation

- `src/scripts/validate-content.js` diff = **+212 / -0（純 additive）**；既有規則邏輯逐字未動。
- 新欄位（`pageType` / `includeInListings` / `includeInSitemap` / `includeInFeeds` / `platformPolicy` / `gatedDownload`）在 `src/` 內**除 validate-content.js 外無任何讀取**（grep 確認）→ build / render / listing / sitemap / Blogger / GitHub Pages 輸出 **by construction byte-identical**。
- 未動 `build-github.js` / `build-blogger.js` / `build-sitemap.js` / 任何 EJS / Admin。
- 未動 `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache/`（git status 確認）。
- 未動 `package.json` / lockfile / `CLAUDE.md` / `MEMORY.md` / production content posts / settings。

---

## 6. 已知 follow-up（deferred；非本 phase）

1. **`report:validation` + `check:validation-report` baseline drift**：`check-validation-report.js` 之 `BASELINE = { 0, 94, 84 }` pin 住 validate 總數，並比對 `.cache/data/validation-report.json`（gitignored / untracked / 本機 stale @ 2026-06-16，仍為 94/84）。本 phase **未** regenerate `.cache`（off-limits），故該 guard 對其 stale cache 仍 green。下次在 PC `npm run report:validation` 重生 report 後，須**同步**把 `BASELINE` 改為 `{ 0, 104, 94 }`（此即該 guard 設計之「drift 強制 conscious 更新」）。
2. SP-3：build-github robots precedence 接 `pageType` 推導（缺省輸出不變）。
3. SP-4：`includeInListings` 接 listing/category/tag loader（download/gated opt-in 先行）。
4. gatedDownload value-based private-URL 偵測（heuristic safety phase）。
5. `platformPolicy` 子欄位 shape validator（SP-7）。

---

## 7. 不做事項（本 phase 邊界）

- ❌ 不消費新欄位於任何 build / render / listing / sitemap / Blogger / GitHub Pages output。
- ❌ 不使 download 頁離開列表（SP-4 範圍）。
- ❌ 不新增 page 為 content file。
- ❌ 不改 CLAUDE.md / MEMORY.md / package.json / lockfile / `.cache` / dist / gh-pages。
- ❌ 不碰 Blogger / AdSense / GA4 / Search Console / Drive 後台。
- ❌ 不啟動 SP-3..SP-9。
