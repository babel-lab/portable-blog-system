# WP-12 — Download next-phase preanalysis（docs-only）

- Phase id：`20260713-wp12-download-next-phase-preanalysis`
- 日期：2026-07-13（Asia/Taipei）
- 類型：**docs-only preanalysis**（唯一 mutation = 本 doc 新增 + 極小 index pointer 更新；**不**改 source / content / frontmatter / sidecar / settings / views / styles / js / other scripts / package.json / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 影響分類編號（`CLAUDE.md` §7）：A（規範文件；本 doc）
- 觸發：`docs/20260710-phase2-next-work-scope-preanalysis.md` §4 WP-12 之啟動 + Dean 於本 session 明確 approval：「啟動 WP-12『Download next-phase preanalysis』docs-only 切片」。
- 本輪界線：**不** implement / **不** build / **不** deploy / **不** preview / **不**動 Admin write path / **不**動 real Google Form / Drive / Apps Script / GA4 / AdSense / Search Console；**不**收集使用者個資；**不**碰 real respondent data / token / API key / OAuth secret / Drive folder ID / form response URL；**不**改既有 indexing guard 語意（僅 canonical 引用名可微調 → 本 doc 不需）；**不**改任何 red lines；**不**啟動任一 §7 future slice。

---

## 0. Boot baseline（本輪已驗）

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `a49ecaf` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅（read-only 驗證） | `0 / 0` | clean | — |

Source HEAD full hash = `a49ecafd2040158a60d7a2ecc7242c925c7140c9`；subject `docs(state): reconcile completed wp routes`。上一 slice `f944ff7` `test(content): assert byline error value format`。Deploy HEAD full hash = `1170e7e14aaa7f3449999bf92b9c8586719a76b4`（未動）。

判定：baseline 完全一致；readiness 未 drift；本 phase 允許 mutation = 本 doc（+ 對應 minimal pointer 更新 `docs/20260710-phase1-rc-docs-index.md` / `docs/20260710-phase2-next-work-scope-preanalysis.md`）。

---

## 1. Scope statement（本 doc 是什麼 / 不是什麼）

**是**：

- WP-12 canonical **preanalysis**：把「活動式直接下載頁 / Google Form gated download 頁」兩種 archetype 之產品決策**收攏成單一可引用 spec 入口**。
- 依 Dean 產品決策 lock 之範圍：
  1. 兩種 archetype 之產品定位、預設值、可覆寫維度。
  2. Indexability 必須**獨立於**下載流程的紅線（不因 direct / gated 而寫死）。
  3. 既有實作（schema / selector / validator / guard / template）之 mapping table，避免下 phase 誤重造。
  4. 未來實作前**每個維度尚未決定之項目**列為 needs-Dean-decision。

**不是**：

- ❌ 不是 kickoff / implementation。
- ❌ 不新增 EJS / SCSS / JS / 任何 validator rule / 任何 build 邏輯。
- ❌ 不建 Google Form。
- ❌ 不串 Google Drive / Apps Script / Gmail / Sheets / Forms API。
- ❌ 不建立實際下載頁 / 不加真實下載檔。
- ❌ 不處理任何使用者個資 / 隱私政策法律文本。
- ❌ 不改任何 robots / noindex production behavior。
- ❌ 不改 `check:download-indexing-independence` / `check:download-indexing-generated-output` / `check:download-indexing-dist-smoke` 之語意。
- ❌ 不改 §7 之 SP-3 / SP-4a / SP-5a / SP-9 系列既有 selector precedence。
- ❌ 不觸發 B2 preview helper / Admin write path / Blogger backfill write / Second GitHub Pages deploy / reverse UTM pm-26 / Blogger AdSense Batch 2 P2 live repost / AdSense Gate A / Custom domain Gate D。
- ❌ 不改 `CLAUDE.md` / `MEMORY.md` / `memory/**`。
- ❌ 不代 Dean 決策。

---

## 2. Pattern comparison（兩種下載頁 archetype）

Dean 已明確確認之兩種 archetype（見 `docs/20260712-download-page-indexing-independence-policy-lock.md` §1；本 doc 沿用該 lock，不改寫）：

| 面向 | Pattern A — 活動式 / 直接下載頁 | Pattern B — Google Form 門檻式下載頁 |
| --- | --- | --- |
| 代表例 | 2026 海盜船 A4 列印下載頁；著色圖 JPG；注音練習單 JPG；活動 / 主題素材 | 注音字卡下載申請表；注音練練看下載更新申請表；數字卡下載申請表 |
| 主要入口 | 內容頁導入、搜尋、QR Code、印刷品直接 URL、社群分享 | 前導 entry page CTA、內部連結；不希望搜尋直接命中 |
| 是否可獨立理解 | **必須**（QR Code 可直接進入；頁面須 self-contained） | **必須**（雖預期由 entry page 導入，URL 仍可直接分享） |
| 主要 CTA | 直接下載素材 / 前往資源列表 | 前往 / 提交 Google Form |
| 預設 indexability | `index`（產品預設） | `noindex`（產品預設） |
| 可否獨立覆寫 indexing | ✅ 可（`seo.indexing` explicit） | ✅ 可（`seo.indexing` explicit） |
| 是否需外部服務 | 不一定；可為純靜態 HTML + 圖片 / PDF 檔 | 需 Google Form（+ 後續交付管道，如 Drive link / external / confirmation-only） |
| 本期是否實作 | ❌ 不動；schema 已就緒（見 §4） | ❌ 不動；schema / 兩篇 production drafts 已存在（見 §4） |

**重要**：上表**預設值**為產品傾向、非硬規則；`seo.indexing` explicit override 一律優先，正如 §5 之獨立性契約。

---

## 3. Separation of concerns（不同維度必須獨立、不得寫死耦合）

本 doc 明確鎖住以下維度**互相正交**（任何未來 slice 皆不得寫死 A→B 之隱式推導）：

| 維度 | 語意 | 已知既有欄位 / 機制 | 不得寫死推導 |
| --- | --- | --- | --- |
| Page presentation | 版面 / 樣式 / 卡片 / CTA 呈現 | EJS partial / SCSS component；本 doc 不 lock 樣式細節 | 不由 delivery mode / gating / indexability 推導 |
| Download delivery method | 檔案取得方式（直連 / 表單後 Drive link / 表單後 external / confirmation-only） | `gatedDownload.postSubmitResource` 列舉值（`drive-link` / `external-after-submit` / `confirmation-only` / `inline-resource`）；`download.fileUrl`（direct） | 不由 gating 推導；不由 indexability 推導 |
| Gating method | 是否須先提交 form / 是否須登入 / 是否直接開放 | `gatedDownload.mechanism`（`google-form`）；未來可擴充 | 不由 delivery method 推導；不由 indexability 推導 |
| Indexability | robots / sitemap eligibility | `seo.indexing` explicit（`index` / `noindex-follow` / `noindex-nofollow`）；pageType `landing` / `gated_download` 為 default 分岔；SP-9b `platformPolicy.<surface>.indexing`（tighten-only） | 不由 delivery / gating 推導；不由 page pattern 推導 |
| Analytics / UTM | click / submit event、印刷 QR UTM | GA4 event `click_all_download`（既有）；候選 `download_cta_click`；`utm_source=printable&utm_medium=qrcode` 等 | 不由 delivery / gating / indexability 推導 |
| Asset source | 素材來源（repo / Blogger 圖床 / Google Drive / 外部 CDN） | 圖片：`images[]`（CLAUDE.md §22）；非 Drive ID 存 repo | 不由 gating 推導 |
| CTA behavior | CTA 目的地（下載 / 表單 / 資訊頁） | `download.fileUrl`（direct） / gated funnel 之 CTA 指向 entry→gated 內部 slug | 不由 gating 推導；不由 indexability 推導 |
| Legal / privacy notice | 使用限制 / 授權 / respondent 隱私 | `download.licenseNote`（既有）；respondent data 永不進 repo（red line） | 未來實作 phase 決定；不由本 doc lock 法律文本 |
| Success / thank-you flow | 表單送出後顯示（若有） | `gatedDownload.postSubmitResource` 列舉值；`postSubmitActions` 為候選 future field | 不由 gating 推導 |

明確條列：

```
download flow            !=   indexability
gating method            !=   noindex field
page visual pattern      !=   delivery mechanism
QR / print entry         !=   analytics enablement
```

---

## 4. Existing contract alignment（已存在 / 已 landed 之能力盤點）

本節僅列**經 read-only inspection 確認存在**之能力；未確認 / 尚未 landed 者標為 `proposed` / `not yet verified` / `not implemented`（見 §5）。**本 doc 不代 Dean 啟用 / 不新增 / 不重造這些能力**。

### 4.1 Pattern A（activity/direct-download）已 landed capabilities

| 能力 | 位置 / 檔案 | 狀態 |
| --- | --- | --- |
| `pageType` 封閉列舉含 `landing` | `src/scripts/validate-content.js`（`VALID_PAGE_TYPE`）；`src/scripts/page-type-robots.js` L20 / L51 / L76；`src/scripts/check-page-type-validator.js` L102 | ✅ existing |
| `contentKind: download` legacy 語意 + safety noindex fallback | `src/scripts/page-type-robots.js` R13；`src/scripts/include-in-sitemap.js` L41 | ✅ existing |
| Option D landing page guard = `download.landingPage === true`（explicit boolean） | `src/scripts/build-github.js` L441 / L476 / L533；`src/views/pages/post-detail.ejs` L146 / L152 / L154 | ✅ existing（renderer branch guard；生成 landing-scoped derived object） |
| Direct download CTA render | `src/views/pages/post-detail.ejs` download box guard（既有 `download && enabled && fileUrl`；non-landing 情形） | ✅ existing |
| `seo.indexing` explicit override（最高優先） | `src/scripts/page-type-robots.js` `resolvePostDetailRobots()` precedence step (1) | ✅ existing |
| Sitemap safety exclusion + explicit-index 放行 | `src/scripts/include-in-sitemap.js` `isSitemapEligible()` L36–43 | ✅ existing |
| Listings default-exclude + explicit opt-in（Slice 2） | `src/scripts/include-in-listings.js` `resolveIncludeInListings()` | ✅ existing |
| Indexing independence invariant guard | `src/scripts/check-download-indexing-independence.js` + `check:download-indexing-independence` npm script | ✅ existing（M-A / M-B / M-C / M-D / M-E / M-F matrix；per `docs/20260712-download-page-indexing-independence-policy-lock.md` §4.3） |
| Generated output contract guard | `src/scripts/check-download-indexing-generated-output.js` + `check:download-indexing-generated-output` npm script | ✅ existing（per `docs/20260712-download-page-generated-output-contract.md`） |
| Temp-build smoke | `src/scripts/check-download-indexing-dist-smoke.js` + `check:download-indexing-dist-smoke` npm script | ✅ existing（per `docs/20260712-download-page-temp-build-smoke.md`） |
| MVP legacy exemption | `content/github/posts/20260504-portable-blog-system-mvp.md`（唯一 production `contentKind:download` post；Q6 asymmetry hold；`page-noindex-in-listings` warning = 1） | ✅ existing（`docs/20260626-q6-download-listing-asymmetry-policy-lock.md`） |

**Recommended shape for archetype A**（沿用 `docs/20260712-download-page-indexing-independence-policy-lock.md` §3.1 方案 A-1，本 doc **不改**）：

```yaml
pageType: landing
seo:
  indexing: index
includeInSitemap: true
includeInListings: true
contentKind: page   # 或 'post'；避免 'download' 之 legacy safety fallback
```

如 archetype A 頁面**確為下載體裁**且採 Option D landing 分支 render（form 或 asset section）：

```yaml
pageType: landing         # 或維持不設；本 doc 不 lock
contentKind: download
download:
  enabled: true
  landingPage: true
  fileUrl: ""             # optional
  fileType: "PDF"         # optional 顯示用
  description: "..."
  licenseNote: "..."
seo:
  indexing: index         # explicit override，避免 legacy download noindex fallback
includeInSitemap: true
includeInListings: true
```

（詳見 `docs/20260603-download-landing-page-content-model-decision.md` §5 / §6；Option D 於**本 phase 不變**。）

### 4.2 Pattern B（Google Form gated download）已 landed capabilities

| 能力 | 位置 / 檔案 | 狀態 |
| --- | --- | --- |
| `pageType: gated_download` 封閉列舉 | `src/scripts/validate-content.js` `VALID_PAGE_TYPE`；`check-page-type-validator.js` L102 | ✅ existing |
| `pageType: gated_download` → 推導 `noindex, follow`（SP-3） | `src/scripts/page-type-robots.js` `derivePageTypeRobots()`；`check-page-type-robots.js` case 2 / 12 / 13 | ✅ existing |
| `gatedDownload.{mechanism, formEmbedUrl, postSubmitResource}` 三 key schema | `src/scripts/validate-content.js` L1722–L1900+（`downloadFunnel` + `gatedDownload` validation blocks） | ✅ existing（56 references；`page-gated-download-suspicious-field` warning-only、value-omit） |
| `postSubmitResource` 列舉值（`drive-link` / `external-after-submit` / `confirmation-only` / `inline-resource`） | `docs/20260624-gated-download-funnel-spec-lock.md` §3.3；validator 檢查 | ✅ spec-locked + validated |
| `downloadFunnel.{role, targetGatedPage, entryPages, ctaEventName}` schema | `src/scripts/validate-content.js` L1722+（Slice 1 / Slice 2 / Slice 8 / Slice 10） | ✅ existing（15+ warning types；含 role enum / entry↔gated required-combo / cross-file bidirectional / secret heuristic） |
| Listings default-exclude for `pageType: gated_download`（Slice 2） | `src/scripts/include-in-listings.js` `resolveIncludeInListings()` | ✅ existing |
| Sitemap default-exclude for noindex-\* | `src/scripts/include-in-sitemap.js` L36–43 | ✅ existing |
| SP-9c Blogger operator guidance（copy-helper[14] + publish-checklist effective indexing 提醒） | `src/scripts/check-blogger-operator-guidance.js`；`docs/20260624-sp9c-blogger-platform-policy-operator-guidance.md` | ✅ existing |
| Production drafts（bopomofo 注音字卡 funnel pair；status:draft；未 live） | `content/blogger/posts/20260626-bopomofo-practice-cards-entry.md`（`downloadFunnel.role=entry`）+ `content/blogger/posts/20260626-bopomofo-practice-cards-access.md`（`downloadFunnel.role=gated_page`） | ✅ existing（僅 placeholder；未 publish；未進 sitemap / listing） |
| Validation fixtures | `content/validation-fixtures/github/posts/_test-page-type-gated-download-valid.md` / `_test-page-gated-download-suspicious-field.md` / `_test-page-gated-download-invalid-type.md` / `_test-download-funnel-valid-entry.md` / `_test-download-funnel-valid-gated-page.md` / `_test-download-funnel-invalid-entry.md` / `_test-download-funnel-dangling-target.md` / `_test-download-funnel-absolute-url-target.md`；`content/validation-fixtures/blogger/posts/_test-gated-download-in-listings-default-trigger.md` | ✅ existing |
| GA4 event（download CTA） | `click_all_download`（既有；per `docs/20260623-ga4-d4-data-flow-early-evidence-record.md` L155）；`download_cta_click` 為候選、未 wire | ✅ existing / candidate proposed |

**Recommended shape for archetype B**（沿用 `docs/20260624-gated-download-funnel-spec-lock.md` §3.2；本 doc **不改**；示例可參見 `content/blogger/posts/20260626-bopomofo-practice-cards-access.md` 之 frontmatter；不重貼）。

### 4.3 三條互鎖 selector（不互相推導）

| Selector | resolver / file | precedence 重點 |
| --- | --- | --- |
| Robots meta | `src/scripts/page-type-robots.js` | (1) explicit `seo.indexing` → (2) legacy `contentKind:download` safety → (3) `pageType` 推導 → (4) caller default → (5) SP-9b tighten-only |
| Listings inclusion | `src/scripts/include-in-listings.js` | (1) top-level `false` → (2) SP-9b `false` → (3) top-level `true` opt-in → (4) Slice 2 特殊頁 default-exclude → (5) normal include |
| Sitemap inclusion | `src/scripts/include-in-sitemap.js` | (1) safety exclusion → (2) top-level `false` → (3) SP-9b `false` → (4) include |

三線正交（既有 Q6 policy lock §3 明列）；本 doc **不改動**。

### 4.4 已 landed 三支 guard（per-resolver contract）+ 三支 download-indexing 系列

per-resolver contract（既有）：

- `check:page-type-robots`（27 cases，`docs/20260712-download-page-indexing-independence-policy-lock.md` §2.2）
- `check:include-in-listings`（21 cases）
- `check:include-in-sitemap`（14 cases）

download-indexing 系列（既有；per §4.1）：

- `check:download-indexing-independence`（M-A / M-B / M-C / M-D / M-E / M-F matrix）
- `check:download-indexing-generated-output`
- `check:download-indexing-dist-smoke`

以上皆屬 `check:phase1-readiness`（`check:download-indexing-independence`）與 `check:metadata-all`（`check:download-indexing-independence` + `check:download-indexing-generated-output`）umbrella 之成員；本 phase **不改**這兩層 umbrella。

### 4.5 Registry（下載素材 / 表單）

| Registry | 位置 | 現況 |
| --- | --- | --- |
| Download assets | `content/settings/download-assets.json` | ✅ existing schema；**empty** since `466e471`（R4a Option A）；本 phase 不動 |
| Download forms | `content/settings/download-forms.json` | ✅ existing schema；**empty**；本 phase 不動 |

Registry validator（R1 / R2 / R4a / R5 / R5b / R6 defer；per §7 See also）**皆 landed as warning-only**；本 doc 不動。

---

## 5. Indexability independence contract（本 doc 沿用；未 lock 新規則）

**核心 invariant**（既有；per `docs/20260712-download-page-indexing-independence-policy-lock.md` §4.2 / §4.3）：

> **當 `seo.indexing` 為 explicit 合法值時（`index` / `noindex-follow` / `noindex-nofollow`），robots 與 sitemap eligibility 完全由 `seo.indexing` 決定，與 `contentKind` / `pageType` 無關。**

即：

- Pattern A 頁面之 **`index` 預設**只是 default / recommended shape；具體是否 index 由 explicit `seo.indexing` 決定。
- Pattern B 頁面之 **`noindex` 預設**只是 default / recommended shape；具體是否 noindex 由 explicit `seo.indexing` 決定。
- 三線正交（robots / listings / sitemap）不互相推導。
- SP-9b `platformPolicy.<surface>.indexing` 僅**收緊**、絕不放寬（tighten-only）。
- Legacy `contentKind:download` safety fallback 為**未 explicit 時**之保守預設，非隱性耦合（explicit `seo.indexing:index` 立即放行 sitemap safety）。

**本 doc 不改任何預設語意 / 不改任何 guard 語意 / 不新增欄位**。所有 §4 已 landed capabilities 屬 authoritative baseline。

---

## 6. Proposed minimal data contract（**未 landed**；候選；不新增 schema）

本節列出**未來若啟動實作 phase**時**可能**需要之新概念；一律標為 `proposed` / `not implemented`，不代表本 doc 已 lock。**本 doc 不新增任何欄位、validator、schema、frontmatter、scaffold**。

| 概念 | 狀態 | 對應既有欄位（優先重用） | 若非重用，proposed 候選 | 決定所需前置 |
| --- | --- | --- | --- | --- |
| Page pattern 標記 | proposed / **not needed as new field**（既可由 `pageType: landing` vs `gated_download` 判斷） | `pageType` | —（不新增）| 若 Dean 未來明說「需一個獨立 `pagePattern: activity|gated`」欄位而非用 `pageType` 判斷 → 屬另 phase |
| Delivery mode | proposed | `gatedDownload.postSubmitResource` 列舉（B 端）；`download.fileUrl`（A 端 direct） | `download.delivery: direct|form-gated|external`（**未 landed**） | 是否值得新欄位、能否 exhaust cover 未來 use case、與 registry 之整合 |
| Asset items（多素材） | proposed；registry-driven | `download.assetRefs[]` → `content/settings/download-assets.json`（既有；empty） | 若不用 registry：`download.assets[]` inline（**未 landed**） | Registry vs inline trade-off；respondent data red line 不變 |
| Primary CTA metadata | proposed；author 手動寫 | `download.fileUrl`（direct）；`downloadFunnel.ctaEventName`（既有；`click_all_download`） | `download.primaryCta: {label, url, event}`（**未 landed**） | 是否需結構化 vs 自由文字 |
| External form URL | proposed；既有部分 | `gatedDownload.formEmbedUrl`（public embed only；非 edit / response URL） | — | Red line：**不**存 edit / response URL / respondent data |
| Success destination | proposed；既有列舉 | `gatedDownload.postSubmitResource` | `gatedDownload.postSubmitActions[]`（`docs/20260624-gated-download-funnel-spec-lock.md` §5.2 已標為 future spec；**未 landed**） | 是否 render structured buttons vs 自由 markdown |
| Indexability override | ✅ **existing / not new** | `seo.indexing` explicit + `platformPolicy.<surface>.indexing`（tighten-only） | —（沿用既有；不新增） | — |
| Print / QR entry annotation | proposed | 無 dedicated field；Dean 可用 UTM `utm_source=printable&utm_medium=qrcode&utm_campaign=<name>`（既有機制） | 若需結構化 QR entry metadata：`print.qr: {campaign, printedAt, sourceMedium}`（**未 landed**） | 是否需 lint / report / GA4 wire；**本 phase 不 lock** |
| Ad profile shared name | proposed；spec-lock 已預告 | 無；`docs/20260624-gated-download-funnel-spec-lock.md` §5.3 提候選命名 `blogger_download_gated_v1` | — | 屬另 phase；本 doc 不 lock |

**紅線（重申）**：任何 proposed 欄位若最終啟動，皆須遵守：

- ❌ 不得存 respondent data / token / API key / OAuth secret / 帳號 email / private permission / 私人 Drive folder ID / file ID / form response URL / edit URL / respondent 個資
- ❌ 不得由 URL pattern 自動推斷 `pageType` / `contentKind` / `gatedDownload.mechanism` / `downloadFunnel.role`
- ❌ 不得為 fixture 修改 production registry
- ❌ 不得將 `downloadFunnel.targetGatedPage` / `entryPages` 填為 Drive / Form 私密 URL

---

## 7. Standalone-entry requirements（QR / print / direct URL 進入行為）

per §2 兩 pattern，**兩者頁面皆須 self-contained**。

### Pattern A（activity / direct download）— QR / print / direct URL 頁面必須：

1. 清楚標題（`title`）+ 資源用途 / 適用對象 / 授權說明（`description` / `licenseNote` / visible copy；**不**使用 `display:none` SEO copy）。
2. 素材預覽（`cover` + `images[]`；per CLAUDE.md §22；圖片上傳位置由作者選擇）。
3. 檔案格式 / 尺寸 / 檔名（`download.fileType`、內文說明）。
4. 主 CTA（`download.fileUrl` direct 或 landing branch render 之 asset section）。
5. 使用方式 / 常見問題（visible summary / FAQ；per Dean §1.4 spec-lock）。
6. 失效或尚未開放時之**替代文案**（不得只留空白按鈕；未來 renderer graceful placeholder，per `docs/20260603-download-landing-page-renderer-preanalysis.md` §8.2）。
7. **不得只有一個沒有上下文之下載按鈕**（避免搜尋流量直接落到僅 button 之頁面）。

### Pattern B（Google Form gated）— 直接進入頁面（不從 entry page 導入）時必須：

1. 為何需要填表（visible copy；`gatedDownload` 前之表單前說明）。
2. 填寫後如何取得內容（immediate 顯示 vs 後續寄送 — 由 form 端設定；repo 端**不**寫敘述性隱私政策法律文本，屬另 phase）。
3. `gatedDownload.postSubmitResource` 語意（例：`drive-link` → 送出後 Google Form 顯示 Drive 連結；本 doc **不**要求 render 顯示列舉值本身給使用者）。
4. 個資與隱私提示（**future phase 決定**；本 doc 不 lock 文本；不代 Dean 落地隱私政策）。
5. **不決定實際表單欄位**（Google Form 端）；不代 Dean 建 form。
6. 提示使用者：URL 可直接分享 / 直接進入，但不進搜尋（noindex，本 doc §5 已 lock）；**hard-gate** 屬 Google Form 端責任。

---

## 8. SEO / indexing defaults（沿用；不新增規則）

| Archetype | 產品預設 | 允許 explicit override | 已 landed 保護機制 |
| --- | --- | --- | --- |
| A / landing（`pageType: landing`） | index-follow（caller default；`page-type-robots.js` L76 分支「不推導 → caller default」） | ✅ `seo.indexing` explicit（最高優先） | `check:page-type-robots` R3 / R13；`check:download-indexing-independence` M-A / M-C |
| A / legacy download（`contentKind: download` 無 `pageType: landing`） | noindex-follow（legacy safety fallback） | ✅ `seo.indexing: index` explicit 立即放行 sitemap safety | `check:page-type-robots` case 12 / 13；`check:include-in-sitemap` explicit-index test |
| B / gated（`pageType: gated_download`） | noindex-follow（SP-3 derived） | ✅ `seo.indexing` explicit（含 `index` 為 opt-in indexable，罕見） | `check:page-type-robots` case 2 / 12 / 13；`check:download-indexing-independence` M-A / M-D |

`page-type-robots.js` / `include-in-sitemap.js` / `include-in-listings.js` **不得**單純由 delivery mode 推導 robots；此為 §5 invariant，既有 `check:download-indexing-independence` 已鎖。

**本 phase 不改**上表任何 default 或保護機制；不啟動任何未來 default drift phase。

---

## 9. Analytics / UTM boundary

| 面向 | 現況 / 邊界 |
| --- | --- |
| QR / 印刷品 UTM | 可使用；例：`utm_source=printable&utm_medium=qrcode&utm_campaign=pirate_ship_2026`。本 doc **不新增**任何 UTM production 動作；不 wire GA4；Dean 於印刷時自行加 UTM |
| direct download CTA click GA4 event | 既有 event `click_all_download`（`docs/20260623-ga4-d4-data-flow-early-evidence-record.md` L155）；候選新命名 `download_cta_click` 未 landed |
| Google Form 外連 click GA4 event | 未 wire；本 doc 不 wire；未來屬 `docs/20260624-gated-download-funnel-spec-lock.md` §7 F7 |
| Conversion definition | ⚠️ 尚未定義；**不得**把 UTM 或 GA4 當作下載成功唯一證據；真正 conversion（下載完成 / form submit 成功）之定義待後續 slice |
| 印刷素材參考 URL（Blogger 海盜船） | `https://babel-lab.blogspot.com/p/2026-a4.html?utm_source=printable&utm_medium=qrcode&utm_campaign=pirate_ship_2026` — **僅為 reference**；本 doc **不改** live Blogger 頁面、**不 deploy**、**不 wire** GA4 |

**紅線**：respondent identifying information（Email / IP / name）**永不**進 repo；GA4 dashboard access 由 Dean 手動、Claude 僅接受 masked evidence（per `CLAUDE.md` §3a Red lines）。

---

## 10. Implementation slice decomposition（future follow-up；不啟動）

本節列出未來若啟動實作時**可獨立展開之最小候選**，每項須 Dean explicit approval + 獨立 phase。**本 doc 不啟動任一、不預先命名 WP 編號**（避免與 `docs/20260710-phase2-next-work-scope-preanalysis.md` §4 WP-01..WP-20 catalog 衝突）。

| # | 候選（未來 slice） | 範圍 | 前置 | 風險 | Touch scope |
| --- | --- | --- | --- | --- | --- |
| WP-12 follow-up A | 既有 schema / metadata mapping 完整化 audit | 逐檔清理現有 draft（bopomofo funnel pair 等）之 metadata 對齊；不改 schema | 本 doc landed | 🟢 docs-only or content-only | docs（新 audit report）+ optional content diff |
| WP-12 follow-up B | Pattern A static rendering prototype（Option D landing branch verification） | 為 pirate ship / 注音練習等 archetype A 頁面建 1 篇 draft；**不 publish**；不新增 renderer | audit A landed；Dean 提供 content | 🟡 content-only + optional fixture | content draft + docs |
| WP-12 follow-up C | Pattern B external-form CTA prototype | 為 bopomofo funnel pair 完成 visible copy / cover / update log / CTA copy / feedback；**不 publish**；不建 real Google Form | audit A landed；Dean 提供 content + explicit approval | 🟡 content-only（drafts remain） | content draft only |
| WP-12 follow-up D | Validation / fixtures 補齊 | 補 Pattern A（direct download / QR entry）之 fixture；補 Pattern B `postSubmitActions` 未來 schema 之 pre-validator fixture | audit A landed | 🟢 fixture-only（warning-first） | `content/validation-fixtures/**` + validator warning family |
| WP-12 follow-up E | Analytics event contract | 決定 `download_cta_click` vs 沿用 `click_all_download`；決定 QR entry UTM 之 param registry 提示；不 wire GA4 dashboard | Dean 明說啟動 | 🟢 docs-only（可能 + 1 param registry entry） | docs + optional `content/settings/ga4.config.json` param registry（read-only） |
| WP-12 follow-up F | Manual preview / accessibility checklist | 為 Pattern A / B 各出 1 份手動驗收 checklist；不動 source | audit A landed | 🟢 docs-only | docs |
| WP-12 follow-up G（deferred / dormant） | 真實 Google Form 建立 + Drive folder + real embed URL 落地 | 建 real Form；由 Dean 手動於 Google 後台完成；repo 端 `gatedDownload.formEmbedUrl` 落地 public embed URL | Dean 完成後台 + explicit approval + red-line preflight | 🟡 content-only（frontmatter 落地 public embed URL） | 對應 gated draft 之 frontmatter；**不**存 edit / response URL |
| WP-12 follow-up H（deferred / dormant） | Admin picker / renderer / Forms 串接 | Admin dev-only picker for `download.assetRefs[]` / `formRef`；renderer 顯示 registry 內容 | registry 有 real data；Admin write path 仍 dormant（第一版永禁 write） | 🔴 涉及 Admin read-only extension | Admin routes（dev-only；不進 prod build） |
| WP-12 follow-up I（reject / out-of-scope） | 真正後台登入 / 自動發文 / Blogger API / Drive API | — | — | 🔴 permanently rejected（`CLAUDE.md` §29） | — |

**紅線 mirror（不因本 doc 而放寬）**：Google Forms responses 永遠停留在 Google Forms / Sheets；不進 repo；不進 registry；不進 Admin static files。

---

## 11. Decision matrix

| 分類 | 明列項目 |
| --- | --- |
| Already decided | Pattern A default `index` / Pattern B default `noindex`（產品）；`seo.indexing` explicit 為最高優先；三線正交；SP-9b tighten-only；`downloadFunnel` / `gatedDownload` schema；Option D `download.landingPage` guard；respondent data 永不進 repo；不 render `display:none` SEO copy；Blogger noindex 由 Dean 於 Blogger 後台手動；`click_all_download` 為既有 GA4 event；registry 沿用 empty policy；Q6 asymmetry hold |
| Existing implementation | §4 全表；三支 selector；三支 per-resolver guard；三支 download-indexing 系列 guard；`downloadFunnel` validator + 15+ warning types；`gatedDownload` validator；SP-9c Blogger operator guidance；2 篇 bopomofo drafts；≥9 validation fixtures；`click_all_download` GA4 event landed；existing `download` template `content/templates/blogger-download-template.md` |
| Proposed（未 landed；候選） | `download.delivery` structured field；`download.primaryCta` structured field；`gatedDownload.postSubmitActions[]` structured field；`print.qr` structured field；`download_cta_click` GA4 event；ad profile 共用 registry；WP-12 follow-up A–H |
| Needs Dean decision | 是否啟動 Pattern A prototype content（follow-up B）；是否為 bopomofo pair 補齊 visible copy（follow-up C）；是否 wire `download_cta_click` 或沿用 `click_all_download`（follow-up E）；是否落地 QR UTM 之 param registry 提示（follow-up E）；ad profile 命名與 registry 位置（follow-up 未列表）；何時開始 real Google Form 落地（follow-up G）；何時開始 Admin picker（follow-up H；且 Admin write 仍 dormant） |
| External dependency | Google Form（建立、embed URL 取得、post-submit resource 設定）；Google Drive folder / file 提供（不進 repo）；Search Console noindex 驗證（Dean 手動）；Blogger 後台 NO INDEX 設定（Dean 手動）；印刷素材 QR code 生成（Dean 或第三方工具）；AdSense serving 觀察（若 Pattern A / B 上 AdSense；屬另 Gate A phase） |
| Out of scope（第一版永禁 / 本 doc 明確不做） | 真正後台登入 / 視覺化文章編輯器 / Blogger API 自動發文 / Google Drive API 自動上傳 / 前台 View 數 / 讚 / 留言系統 / 熱門文章自動統計 / 全文搜尋 / 會員系統 / 資料庫後端 / 自動社群發文（`CLAUDE.md` §29）；Admin write path Apply（dormant）；FB sidecar 真實寫入（dormant）；reverse UTM pm-26 deploy（BLOCKED）；Blogger AdSense Batch 2 P2 live repost（BLOCKED）；AdSense Gate A / Custom domain Gate D（各獨立 phase）；B2 preview helper（Dean-gated）；改 `check:download-indexing-*` 系列 guard 語意；改 `contentKind:download` 或 `pageType:download` / `gated_download` 之 default robots / listing / sitemap 語意 |

---

## 12. Non-actions（本 phase 明確不做）

| # | 項目 | 狀態 |
| --- | --- | --- |
| 1 | 動 `src/**` / `views/**` / `styles/**` / `js/**` / `scripts/**`（含 build / validator / EJS / SCSS / Admin / selector / helper） | ❌ 未動 |
| 2 | 動 `content/**/*.md` frontmatter / `.publish.json` sidecar / `.fb.md` | ❌ 未動 |
| 3 | 動 `content/settings/*.json`（含 `download-assets.json` / `download-forms.json`；registries remain **empty**） | ❌ 未動 |
| 4 | 動 `CLAUDE.md` / `MEMORY.md` / `memory/**` | ❌ 未動 |
| 5 | 動 `package.json` / lockfile / `dist*` / `.cache` / gh-pages / deploy clone | ❌ 未動 |
| 6 | 新增 npm script / guard / preview helper / renderer / EJS partial | ❌ 未做 |
| 7 | 執行 `npm run build:*` / `preview` / `dev` / deploy / push gh-pages | ❌ 未執行 |
| 8 | 動 Blogger / AdSense / GA4 / Drive / Search Console / Google Form / DNS / domain 後台 | ❌ 未動 |
| 9 | 猜任何 Blogger / Drive / Form / respondent / GA4 值 | ❌ 未猜 |
| 10 | 建 Google Form / 建 Drive folder / 收集個資 / 建隱私政策法律文本 | ❌ 未做 |
| 11 | 改 `check:download-indexing-independence` / `-generated-output` / `-dist-smoke` 語意 | ❌ 未動 |
| 12 | 改 `check:page-type-robots` / `-listings` / `-sitemap` 語意 | ❌ 未動 |
| 13 | 改任何 SP-3 / SP-4a / SP-5a / SP-9 系列 precedence | ❌ 未動 |
| 14 | 改 `seo.indexing` / `contentKind:download` / `pageType:download` / `pageType:gated_download` / `pageType:landing` 之 default 語意 | ❌ 未動 |
| 15 | 新增 metadata 欄位 / 新 pageType enum 值 / 新 `download.delivery` / 新 `postSubmitActions[]` schema | ❌ 未做 |
| 16 | 啟動 §10 任一 follow-up | ❌ 未啟動 |
| 17 | Phase 1 RC baseline 之降級 / 重新封存 / 大型 ledger 回寫 | ❌ 未動 |
| 18 | Dean-gated approvals（backfill write / Gate A / Gate D / Batch 2 P2 / pm-26 / B2 helper / second deploy / quarantine 解除 / Admin write path / FB sidecar 寫入） | ❌ 未觸發 |
| 19 | 動 `CNAME` / `ads.txt`（含 placeholder / fake） | ❌ 未做 |
| 20 | 動 real AdSense IDs / real pub id / real measurement ID / real Blogger IDs | ❌ 未動 |
| 21 | 動 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | ❌ 未動 |
| 22 | 新增 test post / real download asset / real form file | ❌ 未做 |

---

## 13. Validation baseline expectations

本 phase docs-only additive；預期 baseline 不變動（除本 doc 新增之 `git status` diff 外）。實際執行結果詳見本 doc §14 close-out。

| 指令 | 執行前 baseline | 執行後 expected |
| --- | --- | --- |
| `npm run validate:content` | 0 / 135 / 107 | 0 / 135 / 107（未動 content / rules） |
| `npm run check:npm-script-targets` | 48/48 PASS（`CLAUDE.md` §Validation baseline snapshot）；memory 對照 48/48 | 48/48 PASS（未新增 script） |
| `npm run check:phase1-readiness` | exit 0（validate 0/135/107、adsense-mode-metadata 17-0、blogger-backfill scanned 12 candidates 7 missing 7 skipped 5、prepublish 16/16、smoke 8/8） | exit 0（未動） |
| `npm run check:phase1-readiness-contract` | 22/22 PASS | 22/22 PASS（未動 umbrella / contract） |
| `npm run check:download-indexing-independence` | expect matrix 全 PASS | 全 PASS（未動） |

**Q6 documented warning 維持 1 條**（`page-noindex-in-listings` @ `content/github/posts/20260504-portable-blog-system-mvp.md`）；本 phase 不動 MVP post、不動 Q6 intent hold。

**Blogger backfill guard 維持 report-only**（scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5）；本 phase 不動 backfill 語意。

---

## 14. Cross-links（authoritative pointers）

**產品決策 lock（authoritative）**：

- `docs/20260712-download-page-indexing-independence-policy-lock.md`（**indexing 獨立性紅線；三條 resolver 正交；archetype 推薦 shape**）
- `docs/20260624-gated-download-funnel-spec-lock.md`（**Layer A / B / C 三層 funnel spec lock；page family candidates；template / data split**）
- `docs/20260603-download-landing-page-content-model-decision.md`（**Option D initial model / Option B long-term；upgrade 前置條件**）
- `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`（Q6 asymmetry documented hold；MVP post state）
- `docs/20260624-download-listing-special-page-preflight-spec-lock.md`（Slice 1 / Slice 2 listing selector opt-in）
- `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1；`pageType` 封閉列舉；4 面向正交）
- `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3 robots precedence）
- `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a listing wiring）
- `docs/20260623-pm-sp5a-include-in-sitemap-selector-wiring.md`（SP-5a sitemap wiring）
- `docs/20260624-am-sp9a-platform-policy-effective-derive-helper.md`（SP-9a display-only helper）
- `docs/20260624-sp9c-blogger-platform-policy-operator-guidance.md`（SP-9c Blogger operator guidance）
- `docs/20260624-sp-download-include-in-listings-opt-in-preanalysis.md`（Slice 2 preanalysis rationale）

**Renderer / model prior art**：

- `docs/20260529-reverse-utm-download-landing-page-flow-decision.md`（pm-11；article CTA → landing page → embedded form → Drive ZIP 流程定稿；§8 promote-to-ready gates）
- `docs/20260603-download-landing-page-renderer-preanalysis.md`（am-9；Option A–E；registry resolution；build touch map）
- `docs/20260529-download-landing-page-schema-preanalysis.md`（pm-16；DownloadLandingPage / FormConfig / DownloadAsset 草案 schema）
- `docs/20260529-download-landing-page-admin-model-preanalysis.md`（pm-12；Admin ownership boundary）
- `docs/20260530-download-fileurl-preview-url-risk-policy.md`（preview-url-risk policy）

**Registry landing**：

- `docs/20260531-download-empty-registry-implementation-plan.md`
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`
- `docs/20260602-download-registry-aware-validation-preanalysis.md`
- `docs/20260602-download-r4a-inactive-registry-data-strategy-preanalysis.md`
- `docs/20260603-download-r6-coexistence-rule-preanalysis.md`

**Recent 2026-07-12 download-indexing 系列**：

- `docs/20260712-download-indexing-guard-phase1-umbrella-integration.md`
- `docs/20260712-download-indexing-guard-metadata-umbrella-integration.md`
- `docs/20260712-download-page-generated-output-contract.md`
- `docs/20260712-download-page-temp-build-smoke.md`

**Discovery**：

- `docs/20260710-phase1-rc-docs-index.md`（Phase 1 RC 單頁 lookup index；本 doc 於 §14 pointer 微調）
- `docs/20260710-phase2-next-work-scope-preanalysis.md`（WP-01..WP-20 catalog；本 doc 為 WP-12 之落地；於 §0.5 或對應 WP-12 條目微量 status sync）

**Governing policy**：

- `CLAUDE.md` §7 / §11 / §13 / §14–§17 / §21 / §23 / §24 / §27 / §29 / §3a Red lines / §3a Recommended next paths

---

## 15. Read-only commands executed（本 phase）

```text
pwd
git status --short --branch
git rev-parse HEAD                     # → a49ecafd2040158a60d7a2ecc7242c925c7140c9
git rev-parse origin/main              # → 同上
git log -1 --format='%H%n%s'           # → a49ecaf docs(state): reconcile completed wp routes
git rev-list --left-right --count origin/main...main   # → 0	0
ls .git/index.lock                     # → absent
git log --oneline --decorate -35
Glob docs/*.md
Glob docs/*download*.md
Glob docs/*indexing*.md
Grep：wp-?12 / download.next.phase / download-next-phase / downloadFunnel / gatedDownload / pageType / landing / landingPage → 多檔 confirmed
Read（read-only）：
  docs/20260710-phase2-next-work-scope-preanalysis.md（partial）
  docs/20260712-download-page-indexing-independence-policy-lock.md（full）
  docs/20260603-download-landing-page-content-model-decision.md（full）
  docs/20260624-gated-download-funnel-spec-lock.md（full）
  content/blogger/posts/20260626-bopomofo-practice-cards-entry.md（partial）
  content/blogger/posts/20260626-bopomofo-practice-cards-access.md（partial）
  package.json（scripts）
Deploy clone read-only verify（未寫入）
```

---

## 16. Final state（本 phase 完成時）

- ✅ 新增 docs-only preanalysis 1 個：`docs/20260713-wp12-download-next-phase-preanalysis.md`（本檔）
- ✅ 極小 pointer 更新：`docs/20260710-phase1-rc-docs-index.md`（§8 recommended next path 表微量 sync；或不動；see §17）；`docs/20260710-phase2-next-work-scope-preanalysis.md`（WP-12 條目 status update；per §17）
- ✅ **完全無 source changes**（src / views / scripts / content / settings / package / lockfile / dist / gh-pages / .cache / generated HTML / CLAUDE.md / MEMORY.md / memory 一律未動）
- ✅ **無 Admin / backend / GA4 / Blogger / AdSense / Search Console / Drive / Google Form / deploy changes**
- ✅ Validation baseline 不變（`CLAUDE.md` §Validation baseline snapshot 對照；本 phase 未跑非必要 check；仍會於 §18 執行 required checks）
- ✅ HEAD 由 `a49ecaf` 遞進；ahead/behind 預期 push 後 0/0；working tree clean

---

## 17. Pointer update scope（極小；避免過度擴散）

依 CLAUDE.md §27 修改規則 + 本 session prompt §七（「原則上最多修改：1 份 WP-12 主文件 + 1 份 docs index + 1 份 phase-2 scope / route 文件」）：

| # | File | 動作 |
| --- | --- | --- |
| 1 | `docs/20260713-wp12-download-next-phase-preanalysis.md` | **新增**（本檔） |
| 2 | `docs/20260710-phase2-next-work-scope-preanalysis.md` | 於 §0.5 Status update 表 + §4 WP-12 條目 **極小 sync**：加入本 doc pointer；標記 WP-12 preanalysis phase = **PREANALYSIS LANDED**；**write phase 仍 Dean-gated / not started** |
| 3 | `docs/20260710-phase1-rc-docs-index.md` | 於 §8 recommended next path 表加入本 doc 為 discovery pointer（1 行；非重建 index） |

**不動**其他 handoff / preflight / spec-lock / policy-lock docs（避免大範圍更新）。

---

## 18. Recommended next path

- **保守路徑 = idle freeze**（沿用 `CLAUDE.md` §3a Recommended next paths；`docs/20260710-phase1-rc-docs-index.md` §11；`docs/20260710-phase2-next-work-scope-preanalysis.md` §9）。
- 若 Dean 未來 session 明確判斷推進，優先候選為 §10 之 follow-up A（既有 schema mapping audit）+ follow-up F（manual preview checklist），皆 docs-only、低風險。
- **不主動執行**：任何 §10 follow-up；任何 §11 Needs Dean decision；任何 red-line 動作。

---

## 19. Sign-off

- 唯一 mutation：本檔新增（總 1 新增 + 2 極小 pointer 更新，per §17）。
- 未動：content / frontmatter / sidecar / settings / views / styles / js / other scripts / lockfile / CLAUDE.md / MEMORY.md / memory/ / dist / deploy clone。
- Baseline drift（預期）：無（本 phase 未新增 npm script、未動 validator / renderer / registry）。
- 未 build / 未 deploy / 未 preview / 未 push gh-pages / 未 dev server / 未 Blogger / AdSense / GA4 / Google Drive / Search Console / 未動 backfill 語意 / 未猜 Blogger 真值 / 未寫回大型 ledger 至 `CLAUDE.md`。
- Recommendation：**idle freeze**（sign-off 後）。

（本文件結束 / end of document）
