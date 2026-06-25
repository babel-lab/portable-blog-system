# Indexed entry page — metadata / content / SEO author preflight（docs-only）

- Phase id：`20260626-indexed-entry-page-metadata-content-preflight-a`
- 日期：2026-06-26（Asia/Taipei）
- 類型：**docs-only preflight**（純分析 / 作者 checklist；**不**實作 validator logic、**不**新增 fixture、**不** baseline bump、**不**碰 production content、**不**碰 live service、**不**做 source landing）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）。**不**影響 C / F / J / K / L 任何 source。
- 授權：Dean explicit approval（本 phase scope 限定 docs-only entry-page preflight，唯一新增本檔）
- 性質：承接 `docs/20260624-gated-download-funnel-spec-lock.md`（funnel 三層 spec 唯一定義來源）與 `docs/20260626-funnel-production-migration-readiness-map-docs-only.md`（§4.1 C-2「indexed entry page content spec ready」= 🔴 hard prerequisite）。本文把 **layer A indexed entry page** 的 metadata / content / SEO / canonical / merged-domain strategy 收斂成單一「作者用 checklist」，**不**重述 spec-lock §3.1 全文，**不**啟動任何內容遷移 / source landing / pair landing。

---

## 1. Baseline verification 摘要

進場 baseline（read-only，未跑任何 validation / build / script）：

| 檢查 | 結果 |
| --- | --- |
| `git status --short` | （空）clean ✅ |
| `git status --branch --short` | `## main...origin/main`（無 ahead/behind 標記）✅ |
| `git rev-parse --abbrev-ref HEAD` | `main` ✅ |
| `git rev-parse HEAD` | `16fdd4f355b0086f4455c121e5d45bf17cbbc2d3`（`16fdd4f`）✅ |
| `git rev-parse origin/main` | `16fdd4f…` ✅ |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` ✅ |
| `.git/index.lock` | 不存在 ✅ |
| `git log --oneline -10` top | `16fdd4f docs(download): map funnel production migration readiness` ✅ |

起點 subject 與要求一致；working tree clean；可安全進行 docs-only preflight。

---

## 2. 目前 sealed state 摘要（與本 preflight 相關部分）

downloadFunnel validator（`src/scripts/validate-content.js`）已 landed slices（皆 warning-only / no-value-echo / additive / 0 production trigger）：

- **F2** structural / role-enum / suspicious-field（allowed funnel fields **只**有 `role` / `targetGatedPage` / `entryPages` / `ctaEventName`；role enum = `entry` | `gated_page`）+ **F2 §5.2** required-combo（`role: entry` 缺 `targetGatedPage` → `downloadFunnel-entry-missing-target-gated-page`）
- **F4 §5.4** role↔policy 一致性（sitemap-safety / listings-default / pageType-mismatch）
- **F6 §5.4** role↔robots-safety（重用 `resolvePostDetailRobots`）
- **F7 §5.3** value-based private-value heuristic（`looksLikePrivateFunnelLink`，純函式、no-value-echo）
- **F8 §5.4** bidirectional cross-file reciprocity（corpus pass；`normalizeFunnelRef`；2 方向 code）

fixture corpus（5 個 `.md`，全 placeholder）：

| Group | 檔案 | 行為 | bump |
| --- | --- | --- | --- |
| 1 valid | `_test-download-funnel-valid-entry.md` / `_test-download-funnel-valid-gated-page.md` | 0 warning | 不 bump |
| 2 deferred | `_test-download-funnel-dangling-target.md` / `_test-download-funnel-absolute-url-target.md` | 0 warning（deferred → silent） | 不 bump |
| 3 scanned invalid | `_test-download-funnel-invalid-entry.md` | 恰 1 warning（required-combo） | 已 bump |

validation baseline（carry-forward，本 phase 不變動、未跑任何 script）：

| 指令 | 結果 |
| --- | --- |
| `validate:content` | 0 / 134 / 106 |
| `report:validation` | 0 / 134 / 106 |
| overlay | 0 / 141 / 107 |
| `check-page-type-validator` | 103 / 0 |
| `check:validation-report` | 27 / 0 |
| production downloadFunnel trigger | **0** |

`downloadFunnel` 之概念欄位目前**只**存在於 spec-lock §3 概念示意與 5 個 fixture；**尚未**進入任何 production `.md`（read-only grep 確認 5 個命中全在 `content/validation-fixtures/`）。

---

## 3. 本 phase 的差異化價值（不是重述 spec-lock）

spec-lock §3.1 已給 **layer A entry page** 的**平台無關架構**（角色 / indexing 規則 / 概念 frontmatter / funnel role 概念欄位 / CTA·AdSense·schema 細則）。本文**刻意不重述**該架構，而是補上 spec-lock **未**收斂的三件事，作為「作者真正要寫 entry page 時」的單一可勾選清單：

1. **entry-specific frontmatter 作者 checklist**（§4）—— 把分散在 spec-lock §3.1 / readiness map §4.2 的欄位，整理成一張「作者逐欄自檢」表，並標明每欄是顯式或可省略、預期值、為何重要。
2. **canonical / merged-domain future strategy 開放選項盤點**（§7）—— spec-lock §3.1 對 entry 的 canonical 只寫「視合併策略」，屬**未裁定開放問題**；本文列出選項與利弊，**仍不裁定**，只標記決策處。
3. **entry page 的「permissive default 盲點」與作者自檢責任**（§6）—— entry 走 normal indexed path，validator 多數情況**不 warn**；本文明確指出哪些錯誤 validator 抓不到、作者必須自檢。

→ 差異化價值 = **把「indexed entry page 內容遷移前須滿足之 metadata/content/SEO 條件」變成可勾選清單**，直接對應 readiness map §4.1 C-2 🔴 hard prerequisite。本文落地後，C-2 之 spec 面即就緒（內容定稿仍待 Dean）。

---

## 4. Entry page frontmatter checklist（layer A indexed entry page）

下表為**作者撰寫 entry page `.md` 時**的逐欄自檢清單。**所有欄位重用既有 schema（見 §5），無新欄位。** 範例值皆為 placeholder。

| # | 欄位 | 建議值（entry page） | 顯式 / 可省略 | 說明 / 為何重要 |
| --- | --- | --- | --- | --- |
| E-1 | `downloadFunnel.role` | `entry` | 顯式 | 標記本頁為 funnel 前導頁。enum 僅 `entry` / `gated_page`（F2 role-enum）；填錯 enum → `downloadFunnel-role-invalid-enum`。 |
| E-2 | `downloadFunnel.targetGatedPage` | `"<gated page slug>"`（simple slug） | 顯式（role=entry 時**必填**） | 指向對應 gated page 之 slug。缺 → `downloadFunnel-entry-missing-target-gated-page`（F2 §5.2 required-combo）。**只**填 slug 或 public URL；**不得**填 Drive folder / Form 私密 URL（否則 F7 private-value warn）。 |
| E-3 | `contentKind` | `post` / `tech-note` / `life-note` 等（**不必**為 `download`） | 顯式或省略 | 體裁維度，與 `pageType` 正交（CLAUDE.md §11）。entry page 是介紹文，體裁通常非 download。 |
| E-4 | `pageType` | `article` 或 `landing`（二擇一） | 顯式 | **不得**用 `gated_download`（那是 layer B）。`article`/`landing` 走 normal indexed path（robots `index, follow`）。 |
| E-5 | `seo.indexing` | `index-follow`（或省略，預設 index） | 可省略 | entry page **要**被索引。**切勿**誤填 `noindex-*`，否則前導頁無法承接搜尋流量（§6 盲點：validator 不會因「entry 設 noindex」而 warn）。 |
| E-6 | `includeInSitemap` | `true`（或省略，預設 include） | 可省略 | entry page 應進 sitemap。 |
| E-7 | `includeInListings` | `true`（或省略，預設 include） | 可省略 | entry page 應進站內列表（normal post path；非 gated 之 default-exclude）。 |
| E-8 | `platformPolicy.github` | `{ indexing: index-follow, includeInListings: true, includeInSitemap: true }`（或整段省略） | 視合併策略 | 記錄 GitHub 站之 effective 政策事實。**不**存 token / secret（SP-8 warn）。entry 與 gated 相反：entry 三平台皆 index。 |
| E-9 | `canonical` | 視合併策略（見 §7；**不可** `auto` 用於跨平台同內容） | 視策略 | 若同一 entry 內容同時存在於 Blogger 與 GitHub，須顯式指定 canonical 指向 primaryPlatform 版本，避免重複內容稀釋（§7 開放決策）。 |

reciprocity 提醒：對應之 gated page（`role: gated_page`）之 `entryPages[]` 須列回本 entry 之 slug，否則 F8 bidirectional 會 warn（`entry-page-not-listed-by-gated-page` / `gated-page-not-targeted-by-entry`）。詳見 §9 pair-landing。

---

## 5. 明確標註：以上全部重用既有 schema，無新欄位

- `downloadFunnel.{role, targetGatedPage}` → 既有 funnel metadata（spec-lock §3.1 概念示意 + F2/F8 validator 已驗；allowed fields 已鎖 `role`/`targetGatedPage`/`entryPages`/`ctaEventName`）。
- `contentKind` → 既有（CLAUDE.md §11）。
- `pageType` → 既有（SP-2 schema lock；`article` / `landing` / `gated_download` 等列舉）。
- `seo.indexing` → 既有（SP-3 robots precedence）。
- `includeInSitemap` → 既有（SP-5a sitemap selector）。
- `includeInListings` → 既有（SP-4a listings selector + Slice 2 opt-in）。
- `platformPolicy.github` → 既有（SP-8 shape validator）。
- `canonical` → 既有（CLAUDE.md §21 / §24）。

→ **本 checklist 不引入任何新 frontmatter 欄位、不改任何 validator 行為、不改任何 selector。** 純粹是「既有欄位之 entry-page-specific 使用建議」。

---

## 6. Entry page 的 SEO / public visibility 風險（permissive default 盲點）

entry page 是 **indexed 頁** → metadata 錯誤會**公開可見**並直接影響 SEO / 流量 / AdSense。關鍵風險：validator 對 **normal indexed path 多為 permissive default，多數錯誤不會自動 warn**，因此**作者必須自檢**。

| 盲點 | 情境 | validator 是否 warn | 作者自檢 |
| --- | --- | --- | --- |
| **誤設 noindex** | entry page 漏填或誤填 `seo.indexing: noindex-*` | ❌ 不 warn（entry 無 gated robots-safety 規則；noindex 對 normal page 是合法值） | 確認 entry `seo.indexing` 為 `index-follow` 或省略 |
| **誤排除 sitemap / listings** | entry 填 `includeInSitemap:false` / `includeInListings:false` | ❌ 不 warn（顯式 false 是合法選擇） | 確認 entry 兩者為 true 或省略 |
| **canonical 缺失致重複內容** | 跨平台同內容未指定 canonical | ❌ 不 warn（canonical 非必填） | 依 §7 策略顯式指定 canonical |
| **hidden SEO copy** | 用 `display:none` 藏 SEO 文字 | ❌ validator 不掃 HTML body 視覺隱藏 | §8：一律改 visible summary / FAQ / intro |
| **targetGatedPage 打錯 slug（dangling）** | 指向不存在的 gated slug | ❌ 目前 deferred-silent（candidate A 仍 deferred；readiness map §6） | 確認 target slug 與 gated page slug 逐字一致 |

→ **總結**：entry page 走 permissive path，「該做卻沒做」多半**靜默通過**。validator 能抓的只有 role-enum / required-combo（缺 targetGatedPage）/ private-value / reciprocity-mismatch；**indexing 方向錯、canonical 缺、hidden SEO** 三類**全靠作者自檢**。這正是 entry page 比 gated page 更需要先做 metadata/content preflight 的根本原因（gated page 反而有 F4/F6 robots-safety / listings-default 自動攔截）。

---

## 7. canonical / merged-domain future strategy 開放選項（**本 phase 不裁定**）

spec-lock §3.1 對 entry canonical 僅寫「視合併策略」。以下列出選項與利弊，**僅標記決策處，不選擇**：

### 7.1 同內容是否同時存在於 Blogger 與 GitHub

- **選項 A — entry 只在一個平台**（例如只在 Blogger，或只在 GitHub）：canonical 直接指自身；無重複內容問題。最單純。
- **選項 B — entry 同內容雙平台並存**：須顯式 canonical 指向 `primaryPlatform` 版本（CLAUDE.md §21 「primaryPlatform + canonical」）；**不可** `canonical: auto`（auto 無法表達跨平台指向）。

### 7.2 merged-domain future（未來自訂網域 / 合併站）

- **背景**：CLAUDE.md §3a 記 future custom domain「須另開 phase」；GitHub Pages 現為 project site `https://babel-lab.github.io/portable-blog-system/`。
- **開放問題（不裁定）**：
  1. 未來若綁自訂網域，既有 entry page 的 canonical 是否須整批 rewrite？
  2. merged domain 後 Blogger entry 與 GitHub entry 的 canonical 主從關係如何定？
  3. `platformPolicy.future` 是否預先為 entry 記錄 merged-domain 之 indexing 意圖（entry 應維持 index）？
- **建議處理時機**：留待「custom domain phase」或「reverse-UTM / 合併站 phase」一併設計；本 preflight **不**預先 rewrite 任何 canonical、**不**新增 `platformPolicy.future` 欄位值。

→ **決策處**：§7.1 選項 A/B 與 §7.2 三問，皆交 Dean 於未來實際內容遷移 / 網域 phase 裁定。本文僅盤點。

---

## 8. visible summary / FAQ / intro 內容要求（對齊 spec-lock visible content discipline）

per spec-lock §1.4 / §6（Dean 已手動從 Blogger 前導頁移除 `display:none` hidden SEO block）：

- ❌ **不得**使用 `display:none` / `visibility:hidden` / off-screen positioning 等手段藏 SEO copy。
- ✅ entry page 應以 **visible summary / FAQ / intro** 承載 SEO 內容：介紹、圖片、更新紀錄、可見摘要 / 常見問題 / 前言、明確可見之下載 CTA（指向 gated page）。
- ✅ CTA 須為顯式可見之 button / link，不得 hidden。
- entry page schema 建議 `Article` 或 `LearningResource`（內容遷移時手動寫入；不由系統自動推斷）。
- entry page CTA event 沿用既有 GA4 命名（`click_all_download`；候選新名 `download_cta_click` 待未來 GA4 phase 裁定，本文不裁定、不改 GA4）。

→ 本 checklist 與 spec-lock 之 visible content discipline 一致：**SEO 內容必須是讀者真正看得到的內容**。

---

## 9. 與 gated page / pair landing 的關係

- **entry preflight 可獨立做**：本文不依賴 gated page production 內容；gated spec（spec-lock §3.2）已完整 lock，entry reciprocity 對端 spec 已就緒。故 entry metadata/content preflight 可先於 gated production 內容單獨落地。
- **真正 production landing 時仍建議 entry + gated pair 同批落地**（readiness map §5.1）：entry + gated 於**同一 commit** 落地，使兩端 slug 立即互相可解析 → F8 reciprocity 0 warning（mirror group 1 valid pair sealed 行為）。
- **避免 transient dangling / reciprocity warning**（readiness map §5.2）：若必須分批，當前 dangling simple slug **deferred-silent**（0 warning），故分批暫時 warning-free；但第二步**必須同時補齊雙向互指**（entry 的 `targetGatedPage` ↔ gated 的 `entryPages[]`），否則留下 reciprocity warning。
- 三 family（注音 / 練練看 / 數字卡，spec-lock §4）各自為**獨立 pair landing phase**，不混批。

→ 本 preflight **不**啟動 pair landing、**不**啟動 gated page production 內容、**不**啟動 production content migration。

---

## 10. no-value-echo / fake-data / no-secret discipline

- ❌ **不放真實 Google Form URL**（embed / edit / response 一律不進 repo；只在未來 gated page 填 `gatedDownload.formEmbedUrl` 之 public embed，且屬 layer B 非本 entry preflight 範圍）。
- ❌ **不放真實 Drive folder ID / file ID**。
- ❌ **不放 token / API key / OAuth secret / 帳號 email / respondent data**（永遠停留在 Google Forms / Sheets / Drive）。
- ❌ `downloadFunnel.targetGatedPage` **不得**填 Drive / Form 私密 URL（否則 F7 private-value warn；no-value-echo：warning 不回顯 raw value）。
- 本文所有範例值（`<gated page slug>` 等）皆為 placeholder；任何未來 fixture / docs 一律 placeholder discipline。

---

## 11. 明確 deferred（本 phase 一律不做）

- ❌ **no source logic change**（`validate-content.js` / `check-validation-report.js` / 任何 src / scripts / EJS / selector 未動）
- ❌ **no fixture change**（5 個 funnel fixture 未增未改）
- ❌ **no baseline bump**（未跑 `validate:content` / `report:validation` / `check:*` / 任何 script）
- ❌ **no production content migration**（無 production `.md` 新增 `downloadFunnel` / entry page 內容）
- ❌ **no gated page production content** / **no pair landing**
- ❌ **no live Blogger / Google Form / Google Drive / GA4 backend / AdSense / Search Console / Admin write path**
- ❌ **A source landing remains deferred**（`20260626-funnel-dangling-target-not-found-warning-source-landing-a`；readiness map §6 A-1…A-5 未達）
- ❌ 未寫入真實 Drive ID / Form URL / token / secret / respondent data（全 placeholder）
- ❌ 未改 `CLAUDE.md`（含 §3a prose SHA cosmetic lag）/ `MEMORY.md` / `memory/`
- ❌ 未改 settings / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages / .cache / generated HTML
- ❌ 未 build / deploy / dev server / preview / repost
- ❌ 未 rebase / amend / force-push

---

## 12. Cross-links

- `docs/20260624-gated-download-funnel-spec-lock.md`（funnel spec 唯一定義來源；§3.1 layer A entry / §3.2 layer B gated / §4 page family）
- `docs/20260626-funnel-production-migration-readiness-map-docs-only.md`（§4.1 C-2 entry content spec 🔴 prerequisite / §4.2 policy 欄位 / §5 migration order / §6 A deferred）
- `docs/20260625-funnel-dangling-absolute-url-source-preflight-a.md`（dangling / absolute-URL deferred-silent 行為盤點）
- `docs/20260625-download-funnel-md-fixture-landing-record.md`（group 1 valid entry/gated pair）
- `src/scripts/validate-content.js`（`normalizeFunnelRef` / `looksLikePrivateFunnelLink` / bidirectional block / F2 required-combo）
- `src/scripts/check-validation-report.js`（C5 / C6 / C7 / B6 / B7 locks）
- `CLAUDE.md` §3a / §11 / §13 / §16 / §21 / §24

---

`DOCS-ONLY ENTRY PREFLIGHT LANDED`
`A SOURCE LANDING REMAINS DEFERRED`
`NO SOURCE / FIXTURE / BASELINE CHANGE`
`NO PRODUCTION CONTENT / LIVE SERVICE CHANGE`
`READY FOR IDLE FREEZE`

（本文件結束）
