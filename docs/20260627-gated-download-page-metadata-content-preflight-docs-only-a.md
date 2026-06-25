# Gated download page — metadata / content / noindex / Form-Drive discipline preflight（docs-only）

- Phase id：`20260627-gated-download-page-metadata-content-preflight-docs-only-a`
- 日期：2026-06-27（Asia/Taipei）
- 類型：**docs-only preflight**（純分析 / 作者 checklist；**不**實作 validator logic、**不**新增 fixture、**不** baseline bump、**不**碰 production content、**不**碰 live service、**不**做 source landing、**不**啟動 pair landing）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）、J（SEO / 索引）。**不**影響 C / F / E / K / L 任何 source。
- 授權：Dean explicit approval（本 phase scope 限定 docs-only gated-page preflight，唯一新增本檔）
- 性質：與 `docs/20260626-indexed-entry-page-metadata-content-preflight-a.md`（layer A entry）**對稱**的 layer B gated page 作者 checklist。承接 `docs/20260624-gated-download-funnel-spec-lock.md`（funnel 三層 spec 唯一定義來源，§3.2 layer B）與 `docs/20260626-funnel-production-migration-readiness-map-docs-only.md`（§4.1 C-1「gated download page content spec ready」= 🔴 hard prerequisite）。本文**不**重述 spec-lock §3.2 全文，**不**啟動任何內容遷移 / source landing / pair landing。

---

## 1. Baseline verification 摘要

進場 baseline（read-only，未跑任何 validation / build / script）：

| 檢查 | 結果 |
| --- | --- |
| `git status --short` | （空）clean ✅ |
| `git status --branch --short` | `## main...origin/main`（無 ahead/behind 標記）✅ |
| `git rev-parse --abbrev-ref HEAD` | `main` ✅ |
| `git rev-parse HEAD` | `a037e4e31f7cba6040be8eb4e65de224923fac48`（`a037e4e`）✅ |
| `git rev-parse origin/main` | `a037e4e…` ✅ |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` ✅ |
| `.git/index.lock` | 不存在 ✅ |
| `git log -1` subject | `docs(download): preflight indexed entry page metadata` ✅ |

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

`downloadFunnel` 之概念欄位目前**只**存在於 spec-lock §3 概念示意與 5 個 fixture；**尚未**進入任何 production `.md`（read-only grep 確認 5 個命中全在 `content/validation-fixtures/github/posts/`）。A source landing（`20260626-funnel-dangling-target-not-found-warning-source-landing-a`）仍 deferred。

---

## 3. 本 phase 的差異化價值（不是重述 spec-lock）

spec-lock §3.2 已給 **layer B gated download page** 的**平台無關架構**（角色 / noindex 規則 / 概念 frontmatter / `gatedDownload` 三 key / funnel role 概念欄位 / red lines）。`docs/20260626-funnel-production-migration-readiness-map-docs-only.md` §4 已給**欄位對照表**。本文**刻意不重述**該架構，而是補上兩者**未**收斂的東西：把 gated page 收斂成「作者真正要寫 gated page 時」的**逐欄自檢 checklist + 風險盲點 + Form/Drive 紀律**，與 entry preflight（`docs/20260626-indexed-entry-page-metadata-content-preflight-a.md`）**對稱**。

| 維度 | entry preflight（已落地，layer A） | 本 gated preflight（layer B） |
| --- | --- | --- |
| readiness map 對應 | C-2 🔴 hard prerequisite | C-1 🔴 hard prerequisite |
| 主要風險面 | **permissive default 盲點**（indexing 方向錯 / canonical 缺 / hidden SEO 多半靜默通過，全靠作者自檢） | **secret leakage + 索引外洩**（real Form/Drive URL 入 repo、Blogger 後台漏設 NO INDEX、listing leakage） |
| validator 自動保護 | 少（normal indexed path 多 permissive） | 多（F4/F6/F7 robots-safety / listings-default / private-value），**但 secret leakage 與 Blogger NO INDEX 仍靠作者** |
| 為何更需 strict checklist | 錯了會公開影響 SEO | 錯了會**外洩私密連結 / 讓 gated 頁被索引**，後果更不可逆 |

→ 差異化價值 = **把「noindex gated download page 內容遷移前須滿足之 metadata/content/noindex/Form-Drive 條件」變成可勾選清單**，直接對應 readiness map §4.1 C-1 🔴 hard prerequisite。本文落地後，C-1 之 spec 面即就緒（內容定稿、真實 Form/Drive 連結準備仍待 Dean）。entry（C-2）+ gated（C-1）spec 面自此**雙就緒**。

---

## 4. Gated page frontmatter checklist（layer B noindex gated download page）

下表為**作者撰寫 gated page `.md` 時**的逐欄自檢清單。**所有欄位重用既有 schema（見 §5），無新欄位。** 範例值皆為 placeholder。

| # | 欄位 | 建議值（gated page） | 顯式 / 可省略 | 說明 / 為何重要 |
| --- | --- | --- | --- | --- |
| G-1 | `downloadFunnel.role` | `gated_page` | 顯式 | 標記本頁為 funnel gated 頁。enum 僅 `entry` / `gated_page`（F2 role-enum）；填錯 → `downloadFunnel-role-invalid-enum`。 |
| G-2 | `downloadFunnel.entryPages[]` | `["<entry slug 1>", "<entry slug 2>"]`（simple slug 陣列） | 顯式（建議；反向關聯） | 列出哪些 entry page 指向本頁。與 entry 的 `targetGatedPage` 互指；缺對端互指 → F8 reciprocity warn（`entry-page-not-listed-by-gated-page` / `gated-page-not-targeted-by-entry`）。**只**填 slug 或 public URL；**不得**填 Drive folder / Form 私密 URL（否則 F7 private-value warn）。 |
| G-3 | `pageType` | `gated_download` | 顯式 | 觸發 robots noindex 自動推導（SP-3）+ Slice 2 listings default-exclude。**不得**用 `article` / `landing`（那是 layer A）。F4 pageType-mismatch 會檢查 role↔pageType 一致性。 |
| G-4 | `contentKind` | `download` | 顯式 | 體裁維度，與 `pageType` 正交（CLAUDE.md §11）。gated 頁體裁為 download。 |
| G-5 | `seo.indexing` | `noindex-follow` | 顯式 | gated 頁**不**被索引。`noindex-follow` 讓爬蟲不索引本頁但仍跟隨連結（回 entry / 站內）。F6 robots-safety：若 `gated_download` 卻給 index 值 → warning。 |
| G-6 | `includeInSitemap` | `false` | 顯式 | 顯式排除 sitemap。safety 已涵蓋（noindex-* 自動 exclude），**顯式更穩**；F4 sitemap-safety 一致性檢查。 |
| G-7 | `includeInListings` | `false` | 顯式 | 顯式排除站內列表。Slice 2 後 `gated_download` 已 default-exclude；**顯式更穩**；F4 listings-default 一致性檢查。**切勿** top-level opt-in `true`（gated 頁不應 opt-in 回 listing）。 |
| G-8 | `platformPolicy.github.robots` / `indexing` | `noindex-nofollow`（或 `noindex-follow`，與 G-5 對齊意圖） | 視合併策略（建議顯式） | 記錄 GitHub 站之 effective 政策事實。**不**存 token / secret（SP-8 warn）。 |
| G-9 | `platformPolicy.blogger.robots` / `indexing` | `noindex-nofollow` | 視合併策略（建議顯式） | 記錄「Blogger 後台已 NO INDEX」之**事實**。⚠️ 此欄位**只是事實紀錄**，系統**無法**由此 inject Blogger head；Blogger 端 NO INDEX 須作者後台手動設定（見 §6）。 |
| G-10 | `platformPolicy.future.robots` / `indexing` | `noindex-nofollow` | 視合併策略（建議顯式） | 預留未來自訂網域 / 合併站；gated 頁三平台皆 noindex（與 entry 相反）。 |
| G-11 | `canonical` | 顯式指向本頁自身或 primaryPlatform 版本；**不可** `auto` | 顯式 | gated 頁 canonical **不可** `auto`（spec-lock §3.2）。視合併策略（見 §4.1）。 |
| G-12 | `gatedDownload.{mechanism, formEmbedUrl, postSubmitResource}` | `mechanism: google-form` / `formEmbedUrl: ""`(placeholder) / `postSubmitResource: <列舉值>` | 顯式（gated 頁核心） | **只**允許此三 key；其他 key → `page-gated-download-suspicious-field`（no-value-echo）。`formEmbedUrl` 只放 **public embed URL**；`postSubmitResource` 只放**列舉值**（`drive-link` / `external-after-submit` / `confirmation-only` / `inline-resource`，spec-lock §3.3）。詳見 §7 紀律。 |

### 4.1 canonical strategy（gated page）

- gated 頁 `canonical` **不可** `auto`（auto 無法表達跨平台 / 跨網域指向；spec-lock §3.2）。
- **選項 A — gated 只在一個平台**（多數情況：gated 頁原生於 Blogger）：canonical 指自身。最單純。
- **選項 B — 同 gated 內容雙平台並存**：顯式 canonical 指向 `primaryPlatform` 版本（CLAUDE.md §21）。
- merged-domain future（自訂網域 / 合併站）：與 entry preflight §7.2 相同**開放問題**，**本 phase 不裁定**、不預先 rewrite 任何 canonical、不新增 `platformPolicy.future` 值。留待 custom domain phase。

### 4.2 reciprocity 提醒

對應之 entry page（`role: entry`）之 `targetGatedPage` 須指回本 gated page 之 slug，且本頁 `entryPages[]` 須列回該 entry slug，否則 F8 bidirectional 會 warn。詳見 §8 pair-landing。

---

## 5. 明確標註：以上全部重用既有 schema，無新欄位

- `downloadFunnel.{role, entryPages}` → 既有 funnel metadata（spec-lock §3.2 概念示意 + F2/F8 validator 已驗；allowed fields 已鎖 `role`/`targetGatedPage`/`entryPages`/`ctaEventName`）。
- `pageType: gated_download` → 既有（SP-2 schema lock；robots noindex 推導 SP-3 + Slice 2 listings default-exclude）。
- `contentKind: download` → 既有（CLAUDE.md §11 / §13）。
- `seo.indexing` → 既有（SP-3 robots precedence）。
- `includeInSitemap` → 既有（SP-5a sitemap selector；noindex-* safety auto-exclude）。
- `includeInListings` → 既有（SP-4a listings selector + Slice 2 default-exclude）。
- `platformPolicy.{github,blogger,future}` → 既有（SP-8 shape validator）。
- `gatedDownload.{mechanism,formEmbedUrl,postSubmitResource}` → 既有（spec-lock §3.2；3-key suspicious-field validator）。
- `canonical` → 既有（CLAUDE.md §21 / §24）。

→ **本 checklist 不引入任何新 frontmatter 欄位、不改任何 validator 行為、不改任何 selector。** 純粹是「既有欄位之 gated-page-specific 使用建議」。

---

## 6. noindex / listing leakage 風險與 Blogger 後台手動 NO INDEX

gated page 是 **noindex hidden 頁** → 主要風險是「**該被藏的卻外洩**」：被搜尋索引、進 sitemap、出現在站內列表。

| 風險 | 情境 | validator / selector 是否攔截 | 作者自檢 |
| --- | --- | --- | --- |
| **accidental indexing（GitHub）** | gated `.md` 漏設 `seo.indexing: noindex-*` 或 `pageType: gated_download` | ✅ GitHub robots 由 `pageType: gated_download` 自動推 `noindex, follow`（SP-3）；F6 robots-safety warn | 確認 `pageType: gated_download` + `seo.indexing: noindex-follow` |
| **sitemap leakage** | gated 漏設 `includeInSitemap:false` | ✅ noindex-* safety 自動 exclude；F4 sitemap-safety warn | 顯式 `includeInSitemap: false` 更穩 |
| **listing leakage** | gated 漏設 `includeInListings:false` 或誤 opt-in `true` | ✅ Slice 2 後 `gated_download` default-exclude；F4 listings-default warn；但**誤顯式 opt-in `true` 會強制回 listing** | 顯式 `includeInListings: false`；**切勿** opt-in `true` |
| **Blogger accidental indexing** | Blogger 後台未手動設 NO INDEX | ❌ **系統無法 inject Blogger head**（build-blogger 不消費 robots selector；Blogger 平台自管） | ⚠️ **作者必須於 Blogger 後台「設定 → 搜尋偏好 → 自訂 robots 標頭標記」手動設 noindex**（SP-9c copy-helper/checklist 已提醒） |

### 6.1 Blogger NO INDEX 須後台手動確認（repo 無法自動 inject）

- repo 端 `platformPolicy.blogger.robots: noindex-nofollow`（G-9）**只是事實紀錄**，**不會**讓 Blogger 線上頁變 noindex。
- Blogger 平台之 noindex **只能**由作者在 **Blogger 後台**手動設定（自訂 robots 標頭標記 / per-post search-visibility）。
- 既有 Blogger live gated 頁（注音 / 練練看等）之「不被索引」保證**只**存在於 Blogger 後台人工設定（spec-lock §2.5）。
- SP-9c：`copy-helper [14]` / `publish-checklist` 已顯示 effective indexing guidance + 提醒手動 NO INDEX；作者遷移 gated 頁時**必須**核對此提醒並於 Blogger 後台落實。
- → **作者 checklist 必含一條**：「Blogger 後台已確認本 gated 頁設為 NO INDEX」。

---

## 7. Google Form / Drive placeholder discipline（red line）

gated page 的核心是 Google Form embed + 送出後資源；這是**最容易外洩私密連結 / secret** 的地方。紀律（mirror spec-lock §3.2 / §3.3 red lines + CLAUDE.md §13）：

- ✅ **repo 只能放 placeholder**：`gatedDownload.formEmbedUrl` 只放 **public embed URL**（且本 preflight 一律 `""` placeholder）；`postSubmitResource` 只放**列舉值**（`drive-link` / `external-after-submit` / `confirmation-only` / `inline-resource`）。
- ✅ **真實 Form / Drive 連結由 Dean 手動管理**：真實 Google Form public embed URL、post-submit 真實下載連結，由 Dean 於遷移當下手動填入（public embed 為唯一可入 repo 之 Form 連結）。
- ❌ **不可寫**：Drive folder ID / Drive file ID / Form **edit** URL / Form **response** URL / OAuth token / API key / respondent data（Email / IP / name）/ private permission / 結算或帳號 secret。
- ❌ Google Forms responses **永遠停留在 Google Forms / Sheets**，不進 repo。
- ❌ `gatedDownload` **只**允許 `{mechanism, formEmbedUrl, postSubmitResource}` 三 key；其他 key → `page-gated-download-suspicious-field`（**no-value-echo**：warning 不回顯 raw value）。
- ❌ `downloadFunnel.entryPages[]` / `targetGatedPage` **不得**填 Drive / Form 私密 URL（否則 F7 private-value warn；no-value-echo）。
- ❌ 不靠 URL pattern 自動推斷 `pageType` / `contentKind` / `gatedDownload.mechanism`；全部由作者顯式宣告。
- **no-value-echo discipline**：本文所有範例值（`<entry slug 1>`、`""` 等）皆為 placeholder；任何未來 fixture / docs 一律 placeholder discipline，validator warning 一律不回顯 raw value。

---

## 8. 與 entry page / pair landing 的關係

- **gated preflight 可獨立做**：本文不依賴 entry production 內容；entry spec（spec-lock §3.1 + entry preflight）已就緒，gated reciprocity 對端 spec 已備。故 gated metadata/content preflight 可獨立於 entry production 內容單獨落地。
- **真正 production landing 時仍建議 entry + gated pair 同批落地**（readiness map §5.1）：entry + gated 於**同一 commit** 落地，使兩端 slug 立即互相可解析 → F8 reciprocity 0 warning（mirror group 1 valid pair sealed 行為）。
- **避免 transient dangling / reciprocity warning**（readiness map §5.2）：若必須分批，當前 dangling simple slug **deferred-silent**（0 warning），故分批暫時 warning-free；但第二步**必須同時補齊雙向互指**（entry 的 `targetGatedPage` ↔ gated 的 `entryPages[]`），否則留下 reciprocity warning（`entry-page-not-listed-by-gated-page` / `gated-page-not-targeted-by-entry`）。
- **三 family 各自獨立 pair landing phase**（注音 / 練練看 / 數字卡，spec-lock §4）；不混批。
- **對照**：entry preflight = `docs/20260626-indexed-entry-page-metadata-content-preflight-a.md`；readiness map = `docs/20260626-funnel-production-migration-readiness-map-docs-only.md`（§4 前置 / §5 migration order / §6 A deferred）。

→ 本 preflight **不**啟動 pair landing、**不**啟動 entry/gated production 內容、**不**啟動 production content migration。

---

## 9. Validator coverage / blind spots（F4 / F6 / F7 防部分，其餘靠作者 checklist）

gated page 比 entry page 有**更多自動保護**，但仍有作者責任盲點：

| 類別 | validator / selector 是否攔截 | 說明 |
| --- | --- | --- |
| role↔policy 一致性（sitemap-safety / listings-default / pageType-mismatch） | ✅ **F4** warn | gated role 與 policy 欄位矛盾時提醒 |
| role↔robots-safety | ✅ **F6** warn（重用 `resolvePostDetailRobots`） | `gated_download` 卻給 index robots → warn |
| 私密 URL 外洩（slug 欄位填 Drive/Form 私密連結） | ✅ **F7** private-value warn（no-value-echo） | `looksLikePrivateFunnelLink` heuristic |
| reciprocity（entry↔gated 互指） | ✅ **F8** bidirectional warn | 兩端都存在卻未互指 |
| `gatedDownload` 未授權 key | ✅ `page-gated-download-suspicious-field` warn | 限三 key |
| **GitHub robots noindex** | ✅ 自動（`pageType: gated_download` → SP-3） | 不靠作者顯式（但顯式更穩） |
| **Blogger 後台 NO INDEX** | ❌ **系統無法 inject**；靠作者後台手動 | §6.1；最大盲點 |
| **真實 Form/Drive URL 外洩**（寫入 `gatedDownload.formEmbedUrl` 之 edit/response URL、或 commit 私密連結） | ⚠️ 部分（F7 掃 funnel slug 欄位；`formEmbedUrl` 之 edit/response URL 不必然觸發） | §7；靠作者紀律 + reviewer |
| **內容品質 / visible content discipline**（不得 hidden SEO；visible intro/FAQ；CTA 可見） | ❌ validator 不掃 HTML body 視覺隱藏 | spec-lock §1.4 / §6；靠作者 |
| **manual Form / Drive 準備**（真實 public embed、post-submit 資源就緒） | ❌ repo 外 | readiness map §4.3 G-1/G-2；靠 Dean 手動 |

→ **總結**：F4 / F6 / F7 / F8 + pageType robots/listings 自動鏈能攔截**多數 metadata 層級錯誤**（這正是 gated 比 entry 自動保護多的原因）；但 **(a) 真實 Form/Drive URL 外洩、(b) Blogger 後台 NO INDEX、(c) 內容品質 / visible content、(d) manual Form/Drive 準備**四類**仍全靠作者 checklist + Dean 手動**。本 checklist 即為補這四個盲點而存在。

---

## 10. 明確 deferred（本 phase 一律不做）

- ❌ **no source logic change**（`validate-content.js` / `check-validation-report.js` / 任何 src / scripts / helpers / EJS / selector 未動）
- ❌ **no fixture change**（5 個 funnel fixture 未增未改）
- ❌ **no baseline bump**（未跑 `validate:content` / `report:validation` / `check:*` / 任何 script）
- ❌ **no production content migration**（無 production `.md` 新增 `downloadFunnel` / gated page 內容）
- ❌ **no pair landing** / **no entry production content**
- ❌ **no live Blogger / Google Form / Google Drive / GA4 backend / AdSense / Search Console / Admin-write-path**
- ❌ **A source landing remains deferred**（`20260626-funnel-dangling-target-not-found-warning-source-landing-a`；readiness map §6 A-1…A-5 未達）
- ❌ 未寫入真實 Drive ID / Form URL / token / secret / respondent data（全 placeholder）
- ❌ 未改 `CLAUDE.md`（含 §3a prose SHA cosmetic lag）/ `MEMORY.md` / `memory/`
- ❌ 未改 settings / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages / .cache / generated HTML
- ❌ 未 build / deploy / dev server / preview / repost
- ❌ 未 rebase / amend / force-push

---

## 11. Cross-links

- `docs/20260624-gated-download-funnel-spec-lock.md`（funnel spec 唯一定義來源；§3.2 layer B gated / §3.3 post-submit / §4 page family / §5 template split / §6 SEO rules）
- `docs/20260626-indexed-entry-page-metadata-content-preflight-a.md`（**對稱** layer A entry preflight）
- `docs/20260626-funnel-production-migration-readiness-map-docs-only.md`（§4.1 C-1 gated content spec 🔴 prerequisite / §4.2 policy 欄位 / §4.3 Form/Drive / §5 migration order / §6 A deferred）
- `docs/20260625-funnel-dangling-absolute-url-source-preflight-a.md`（dangling / absolute-URL deferred-silent 行為盤點）
- `docs/20260625-download-funnel-md-fixture-landing-record.md`（group 1 valid entry/gated pair）
- `docs/20260625-download-funnel-md-fixture-group2-landing-record.md`（group 2 deferred-cases）
- `docs/20260625-group3-scanned-invalid-bump-landing-record.md`（group 3 scanned invalid + baseline bump）
- `src/scripts/validate-content.js`（`normalizeFunnelRef` / `looksLikePrivateFunnelLink` / bidirectional block / F2 required-combo / F4 / F6）
- `src/scripts/check-validation-report.js`（C5 / C6 / C7 / B6 / B7 locks）
- `CLAUDE.md` §3a / §11 / §13 / §16 / §21 / §24 / §29

---

`DOCS-ONLY GATED PAGE PREFLIGHT LANDED`
`MUTATION LIMITED TO ONE DOCS FILE`
`A SOURCE LANDING REMAINS DEFERRED`
`NO SOURCE / FIXTURE / BASELINE CHANGE`
`NO PRODUCTION CONTENT / LIVE SERVICE CHANGE`
`READY FOR IDLE FREEZE`

（本文件結束）
