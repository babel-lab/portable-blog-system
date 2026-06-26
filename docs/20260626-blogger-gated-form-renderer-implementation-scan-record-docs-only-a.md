# Blogger gated Form renderer implementation scan — read-only record (docs-only)

- Phase id：`20260626-blogger-gated-form-renderer-implementation-scan-record-docs-only-a`
- 日期：2026-06-26（Asia/Taipei）
- 類型：**docs-only record**（將 read-only Blogger gated Form renderer implementation scan 之結果固化為正式 repo evidence；**no source change** / **no content change** / **no settings change** / **no package/lockfile change** / **no validator change** / **no build** / **no deploy** / **no dev server** / **no backend touch**）
- 影響分類編號（CLAUDE.md §7）：A（規範 / 文件）。**不**影響 B / C / D / E / F / H / I / J / K / L 任何 source、template、settings 或 production content。
- 授權：Dean explicit approval（限定本 docs-only record；唯一新增本檔 + 核准 commit / push）
- 前置 / 來源：
  - `docs/20260626-blogger-gated-form-embed-policy-decision-packet-docs-only-a.md`（policy / decision packet，D1–D13）
  - `docs/20260626-funnel-renderer-bridge-spec-lock-docs-only-a.md`（renderer bridge policy lock）
  - `docs/20260626-funnel-renderer-bridge-source-preflight-record-docs-only-a.md`（前一輪 source preflight record）
  - `docs/20260624-gated-download-funnel-spec-lock.md`（三層 funnel 架構）
  - `docs/20260625-funnel-page-type-metadata-spec-lock-docs-only-a.md`（page type / metadata / cautious wording lock）
  - `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`（Q6 listing/sitemap/robots asymmetry policy lock）
- 對應 scan session：`20260626-blogger-gated-form-renderer-implementation-scan-readonly-a`（read-only，含 checklist / copy-helper / validator 延伸掃描；未落檔，由本檔固化）

---

## 1. Purpose

- 本文件記錄 **Blogger gated Form renderer source implementation 前**的 read-only scan：找出未來若要做 Blogger-only gated Form renderer，最小 source 變更會落在哪些檔案、需要哪些資料流與 guard。
- 本文件**不包含任何 source implementation**：不新增 / 不修改任何 EJS / SCSS / JS / build script / validator / content / settings。
- 本文件**不包含任何**：
  - ❌ 實際 Google Form URL（embed / edit / response 皆無）
  - ❌ Google Drive ID（folder / file 皆無）
  - ❌ secret / token / OAuth / API key
  - ❌ respondent data（表單填答者個資 / 回覆內容）
- additive：不取代既有 spec-lock / decision packet / preflight record；僅作為其 scan-evidence 附錄，供未來 source phase planning 引用。

---

## 2. Current baseline

| 檢查 | 值 | 判定 |
| --- | --- | --- |
| pwd | `/d/github/blog-new/portable-blog-system` | ✅ |
| branch | `main` | ✅ |
| HEAD (short) | `102afe8` | ✅ |
| HEAD (full) | `102afe8a133fbdd38e7f7ce0f3951f7dfe3dc232` | ✅ |
| log -1 | `docs(download): add blogger gated form embed decision packet` | ✅ |
| HEAD == origin/main | `102afe8` == `102afe8` | ✅ |
| ahead / behind | `0 / 0` | ✅ |
| working tree | clean（落檔前） | ✅ |
| `.git/index.lock` | NO INDEX LOCK | ✅ |

baseline 正確 → 進行 read-only scan 並固化為本紀錄。

> 註：CLAUDE.md §3a snapshot 仍記 HEAD=`6ab4749`，實際已 +2 docs commits（`e030276` / `102afe8`）。`102afe8` 為唯一可信凍結基準；snapshot 落後屬已知（每 phase 僅極小 sync），非 baseline 異常。

---

## 3. Files scanned

**Read（全文）**：
- `CLAUDE.md`
- `docs/20260626-blogger-gated-form-embed-policy-decision-packet-docs-only-a.md`
- `docs/20260626-funnel-renderer-bridge-spec-lock-docs-only-a.md`
- `docs/20260626-funnel-renderer-bridge-source-preflight-record-docs-only-a.md`
- `src/views/blogger/blogger-post-full.ejs`（全 246 行）
- `src/views/blogger/blogger-publish-checklist.ejs`（全文）
- `src/views/blogger/blogger-copy-helper.ejs`（全文）
- `content/blogger/posts/20260626-bopomofo-practice-cards-access.md`
- `content/blogger/posts/20260626-bopomofo-practice-cards-entry.md`

**Read（重點區段）**：
- `src/scripts/build-blogger.js`（`renderFullPost` line 125–165 + 全檔關鍵點 grep）

**Grep（只讀，定位行號）**：
- `src/scripts/build-blogger.js`：`renderFullPost` / `deriveRendered*` / `pageType` / `gatedDownload` / `downloadFunnel`
- `src/`：`iframe` / `embed` / `sandbox` / `sanitize` / `allowlist` / `escapeHtml`（確認 renderer pipeline 無 HTML sanitization / iframe pattern）
- `src/scripts/validate-content.js`：`gatedDownload` / `downloadFunnel` / `gated_download` / `formEmbedUrl` / `postSubmitResource` / `targetGatedPage` / `entryPages` / `looksLikePrivateFunnelLink`

**未碰**（任務列為「視需要」且 Blogger renderer 不消費）：`src/scripts/include-in-sitemap.js` / `include-in-listings.js` / `build-github.js`（前一輪 preflight record §6 已涵蓋，與 Blogger render 無關）。

**未碰 backend / 輸出**：build / deploy / dev server / Blogger live / Google Form / Google Drive / GA4 / AdSense / Search Console / Admin / `dist*` / `.cache`。

---

## 4. Current renderer behavior（Blogger）

`src/views/blogger/blogger-post-full.ejs`：

- **唯一** download 分支在 **line 108**：`post.download && post.download.enabled && post.download.fileUrl` → `lab-download-box` + `<a class="lab-download-box__cta" href=fileUrl download>`（直出檔案連結）。
- **不讀** `pageType` / `gatedDownload` / `downloadFunnel`。模板 head 解構欄位僅 `title` / `description` / `contentKind`（via `normalized`）；`contentKind` 僅用於 line 61 book-photo 判斷。
- **無** `download.landingPage` 分支（GitHub `post-detail.ejs` 才有 `lab-download-box--landing`；Blogger 端連這個都沒有 → Blogger download 模型比 GitHub 更窄，純 direct-file）。
- **無** Google Form embed 分支、gated page 分支、post-submit 分支、`gatedDownload` consumer、`downloadFunnel` consumer。
- summary / redirect-card / home-index / category-index 模板亦皆無 funnel 分支。

確認事實：

1. Blogger 目前**只**渲染 legacy download box，guard = `download.enabled` + `download.fileUrl`。
2. 目前**沒有** `gatedDownload` / `downloadFunnel` body renderer。
3. 目前**沒有** Form iframe renderer（全 repo grep `iframe` / `embed` / `sandbox` = 0 命中於 renderer pipeline；唯一 `escapeHtml` 在 `src/views/admin/index.ejs` client-side JS，非 renderer）。
4. 未來若要 render gated funnel，需在 `blogger-post-full.ejs` **新增** gated branch / placeholder branch（無現成 iframe pattern 可沿用；若做 iframe 須新建 escaping / allowlist 機制）。

---

## 5. build-blogger.js data flow

`renderFullPost(post, canonicalUrl, jsonLd, settings)`（line 125）：

1. build 端先以**純 helper** 算出 derived 物件：`relatedLinksRendered` / `otherLinksRendered` / `affiliateLinksRendered` / `affiliateBlocksRendered` / `adsenseBlocksRendered`。
2. 再 `ejs.renderFile(..., { post: { ...post, bodyHtml }, normalized, canonicalUrl, jsonLd, <各 *Rendered>, ads })`（line 149–164）。
3. post object 以 `{ ...post, bodyHtml }` spread 傳入；EJS 技術上可讀 raw `post.gatedDownload` / `post.downloadFunnel`，**但目前無任何 consumer**。

未來建議：

- 應新增 `deriveRenderedGatedDownload(post, settings)`（mirror `deriveRenderedAffiliateBlocks` / `deriveRenderedDownloadLanding` pattern，建議放 `src/scripts/resolve-*.js` 純函式），在 `renderFullPost` 算出 **render-safe object** 後以 `gatedDownloadRendered` 傳入 EJS context。
- **為何要在 build stage 產生 safe render object，而非 EJS 直接讀 raw metadata**：
  - 集中化紅線把關（formEmbedUrl 空 → placeholder；非 public embed → omit；不洩 Drive/Form private URL）於單一純函式，可被 smoke 直接 import 測試。
  - 與既有 5 個 `*Rendered` 慣例一致（resolve / sanitize 在 build 端、EJS 只渲染已清洗物件），避免 raw metadata 直達輸出 HTML。
  - EJS 直讀 raw 會把 URL/secret 判斷邏輯散落模板，難測試、易誤洩。

**重要 plumbing 區隔**：

- `bloggerOperatorGuidance`（build-blogger.js line ~393–420 預計算 `pageType` + `platformPolicy.blogger.*`）**只傳給 checklist / copy-helper**（`renderPublishChecklist` / `renderCopyHelper`），**沒有**傳給 `renderFullPost`（line 125–165 之 EJS context 無此物件）。
- → 未來 body renderer（gated branch）**需在 `renderFullPost` 新增獨立 plumbing**（`gatedDownloadRendered`），**不能**沿用 operator-guidance 那條管線。兩條路徑互相獨立。

---

## 6. Access content current status

`content/blogger/posts/20260626-bopomofo-practice-cards-access.md`：

- `status: draft` / `draft: true` ✅
- `pageType: "gated_download"`、`contentKind: "download"`、`category: "download"`
- `seo.indexing: "noindex-follow"`、`includeInSitemap: false`、`includeInListings: false` ✅
- `publishTargets.github.enabled: false` / `blogger.enabled: true`
- `gatedDownload: { mechanism: "google-form", formEmbedUrl: "", postSubmitResource: "drive-link" }` → **`formEmbedUrl` 仍為空字串** ✅；`postSubmitResource` 為列舉值（非 URL）。
- **完全無 `download:` 區塊** → 即使 Blogger renderer 走 line 108，也因無 `download.fileUrl` 而 0 觸發。
- `downloadFunnel: { role: "gated_page", entryPages: ["bopomofo-practice-cards-entry"] }`，與 entry 端 `targetGatedPage` 互指（F8 reciprocity）。
- body 為 placeholder 文字；**repo 內 0 個** Drive ID / Form URL / respondent data / token / secret。

entry（`...-entry.md`）：`pageType: article` / `role: entry` / `targetGatedPage: bopomofo-practice-cards-access` / `ctaEventName: click_all_download` / index + sitemap + listing 全 true / draft。

結論：

- 兩篇皆 Blogger-only / draft / placeholder，目前**不 render、不 repost**。
- `formEmbedUrl` 仍空、無真實 Form / Drive 連結。
- **因 Dean 尚未提供 / 確認 Form embed URL policy，未來若 source 先做，只能 safe placeholder 或 no iframe**（見 §10 Option A）。

---

## 7. Checklist / copy-helper findings

### 7.1 `blogger-publish-checklist.ejs`

- **SEO indexing 區段（line 113–144）**：讀 `post.seo.indexing` + `contentKind=download` fallback。對 access.md 的 `seo.indexing: "noindex-follow"` → 建議值 `noindex, follow`，且 `isNoindex=true` 會輸出強制 row「Blogger 後台『搜尋設定 → 自訂 robots 標頭標記』已對應設定」。
- **SP-9d 特殊 pageType 操作檢查（line 156–196）**：當 `bloggerOperatorGuidance.present` 時，`pageType === 'gated_download'`（line 160–162）輸出兩條 row：
  - 「已於 Blogger 後台設 **noindex, nofollow**，並依 sp9c §2 Google Form SOP 完成 view-source 驗證」
  - 「已避免使用公開導覽 label（建議用 `_internal-*` / `_hidden-*` 前綴）」

→ **gated 頁的 NO INDEX 手動提醒，checklist 已自動產出**。

### 7.2 `blogger-copy-helper.ejs`

- **[14] SEO indexing guidance（line 253–288）**：同 precedence，對 download / noindex 類顯示 manual-check guidance（明文「本系統**不能**直接 inject Blogger head robots」）。
- **[15] pageType / platformPolicy 操作指引（line 294–345）**：`PAGE_TYPE_GUIDANCE.gated_download`（line 298）=「Blogger 後台建議 **noindex, nofollow**（內嵌 Google Form 漏斗閘門；不傳遞權重）。須依 sp9c §2 SOP 手動設定並 view-source 驗證」。
- copy-helper [5]（line 32–34）僅 reference postFile；HTML body 本身來自 `blogger-post-full.ejs`。

### 7.3 結論

- `blogger-publish-checklist.ejs` 與 `blogger-copy-helper.ejs` **已有 `gated_download` 相關 operator guidance**；Blogger 後台 noindex / nofollow / hidden-label guidance **大多已存在**（SP-9d, 2026-06-24）。
- **Option E 不應再被視為必要大改**，應降級為「**body renderer 落地後再確認文案是否一致**」。
- checklist / copy-helper **皆不渲染 Form iframe**（只是 operator guidance）；**body renderer 仍需在 `blogger-post-full.ejs` 完成**。

---

## 8. Validator findings

`src/scripts/validate-content.js` 對 `gatedDownload` / `downloadFunnel` 已有多個 warning-only checks（不 echo sensitive value）：

| 區塊 | 行為 |
| --- | --- |
| `gatedDownload` invalid-type（line 1692） | 非 plain object → warning |
| `gatedDownload` suspicious-field（line 1706–1716） | disallowed key（僅比 key 名，**不**檢查 value）→ warning；`mechanism` / `formEmbedUrl` / `postSubmitResource` 為合法欄位不誤判；message **不 echo value** |
| `downloadFunnel` slice 1（line 1722+） | invalid-type / role-missing / role-invalid-enum / suspicious-field |
| `downloadFunnel` slice 2（line 1773+） | required-combo：entry-missing-target / gated-page-missing-entry / wrong-role / type / too-many / duplicate |
| `downloadFunnel` slice 4（line 1878+） | role↔policy：sitemap-safety / listings-default / pageType-mismatch |
| `downloadFunnel` slice 6（line 1929+） | role↔robots-safety（gated_page + effective GitHub robots indexable → warning） |
| `downloadFunnel` slice 8（line 1943+，`looksLikePrivateFunnelLink`） | targetGatedPage / entryPages[] 命中 Drive/Form/token pattern → warning（**不 echo value**） |
| slice 10（bidirectional，line 172+） | entry↔gated_page reciprocity（corpus cross-pass） |

確認事實：

1. validator **已有** suspicious-field / role / target / private-link pattern 等檢查。
2. validator **不 echo** sensitive value（mirror C6 / C9 慣例）。
3. **confirmed gap**：目前**沒有** rule 禁止 `pageType: gated_download` 同時帶 `download.fileUrl`（grep 0 命中）。
4. 該 gap 屬 **Option D validator hardening**，應**獨立 future phase**（warning-only-first + baseline-bump phase + Dean approval），**不與 Blogger renderer source session 混在一起**。

---

## 9. Metadata consistency observation

- access.md 同時帶多種 robots 訊號：
  - `seo.indexing: "noindex-follow"` → SEO 區段 / copy-helper [14] 顯示 **noindex, follow**
  - `pageType: "gated_download"` SP-9c 矩陣 / copy-helper [15] / `platformPolicy.blogger.indexing: "noindex-nofollow"` → 顯示 **noindex, nofollow**
- → 存在 **P2 operator-display inconsistency**：operator guidance 一處顯示 `noindex-follow`、另一處顯示 `noindex-nofollow`。
- **兩者皆 noindex-safe**（indexing 不受影響，差別僅 follow / nofollow），**不是 indexing P0**。
- 未來 Dean 定稿 access page metadata 時可選擇對齊，或由 validator hardening future phase 收斂。
- **本 scan 不修改 content**（access.md 不動）。

---

## 10. Future implementation options

| Option | 動的檔案 | 行為 | 風險 | blocked-until |
| --- | --- | --- | --- | --- |
| **A：Blogger-only safe placeholder（不 render iframe）** | `blogger-post-full.ejs` + `build-blogger.js`（+ 可選 SCSS） | `formEmbedUrl` 空時輸出「表單暫不可用」placeholder；**永不**輸出 iframe / Drive / file anchor | **最低**。0 URL 外洩面；mirror 既有 landing placeholder 哲學 | 僅需 Dean 核准「做 Blogger placeholder preview」；**不需** Form URL |
| **B：Blogger-only Form iframe（僅 `formEmbedUrl` 非空且 policy confirmed 時啟用）** | A 的檔案 + 新建 iframe escaping / allowlist 機制 + checklist 文案對齊 | 空 → placeholder（同 A）；非空且 policy 確認 → render iframe embed | **中–高**。引入 repo 首個 iframe；須 D9 / D10 policy、sandbox / title / loading 決策；`formEmbedUrl` 變 public-facing | D1 / D2 / D3 + D9 / D10 全部確認 + Dean 提供 public embed URL |
| **C：build-stage safe object + EJS render branch** | `build-blogger.js`（`deriveRenderedGatedDownload`）+ `blogger-post-full.ejs`（讀 `gatedDownloadRendered`） | build 端產 render-safe object、EJS 只渲染已清洗物件 | **低–中**。屬 A / B 的「正確實作方式」（非獨立選項），紅線把關集中、可 smoke 測 | 與 A / B 同；本身為實作原則 |
| **D：validator hardening（禁 `gated_download` + `download.fileUrl` 並存）** | `validate-content.js`（+ fixtures + baseline bump） | warning-only 一致性檢查 | **低**，但須 explicit baseline-bump phase（§3a 紀律 + Dean approval） | 不阻塞，但屬獨立 phase；**不可**與 renderer 混入同 session |
| **E：checklist / copy-helper guidance review only** | （多半不需改）`blogger-publish-checklist.ejs` / `blogger-copy-helper.ejs` | gated operator guidance 已存在（§7）；僅在 body renderer 落地後確認文案一致 | **最低** | 降級為「body renderer 落地後再確認」；**非必要大改** |

> Option C 並非與 A/B 並列的第三條路，而是 A/B 的**建議實作骨架**（build-stage safe object → EJS render branch）。列於此處以對齊 Dean 指定之選項清單。

---

## 11. Recommended minimal safe source session

保守建議（per memory `feedback_conservative_landing`）：

- 若 Dean **尚未提供 / 確認 Form embed URL policy**，下一個 source session **最多只做 Option A safe placeholder**（不 render iframe）。
- 最小 source scope 應是：
  - `src/scripts/build-blogger.js`（新增 `deriveRenderedGatedDownload` safe render object；Option C 骨架）
  - `src/views/blogger/blogger-post-full.ejs`（新增 placeholder branch，讀 `gatedDownloadRendered`）
- **不碰 content**（access / entry draft 不動）。
- **不碰 GitHub renderer**（`post-detail.ejs` / `build-github.js`；GitHub funnel = `future_possible_not_active`）。
- **不碰 validator hardening**（Option D 獨立 phase）。
- **不碰 checklist / copy-helper**，除非後續文案需與 body render 對齊。
- **不 build / deploy**，除非 Dean 另外批准 validation / build scope。
- 落地時對既有 ready post 做 build:blogger byte-diff regression（byte-identical-modulo-builtAt）+ AdSense guard 回歸（僅在 Dean 批准 build scope 後）。

---

## 12. Blocked-until conditions

source implementation（任何 Blogger renderer / Form embed / gated body renderer）**保持 blocked**，直到 Dean 明確確認：

- Dean 確認是否**允許 repo metadata 存 public Google Form embed URL**（D1 / D2 / D3）。
- Dean 確認**不存 Form response URL**（D4）。
- Dean 確認**不存 Drive direct file URL / private Drive ID**（D5 / D6）。
- Dean 確認 **iframe width / height / title / loading / sandbox policy**（D9 / D10）—— 僅 Option B 需要；Option A placeholder **不需**。
- Dean 確認 **Drive link 只由 Google Form post-submit confirmation 管理，不由 repo 直出**（D7 / D8）。
- Dean 確認**是否需要 GA4 CTA / form_view**，且**不得記個資 / respondent data**（D13）。

在上述確認前，**不**開始任何 source mutation。Option A placeholder 至少需 Dean explicit「核准做 Blogger placeholder preview」。

---

## 13. Risk ranking

- **P0** — secret / token / Drive ID / Form response URL / respondent data accidentally entering repo：
  ✅ **當前 0 風險**。access.md `formEmbedUrl:""` 空、`postSubmitResource:"drive-link"` 為列舉值、無 `download:` 區塊、repo 內 0 個 secret / Drive ID / Form URL / respondent data。本次 scan 0 mutation，未複製任何 secret。Option B 一旦引入 iframe，`formEmbedUrl` 變 public-facing → commit 前須人工審視（禁 edit / response URL）。
- **P0** — accidental private link：同上紅線；`looksLikePrivateFunnelLink`（validator slice 8）已對 targetGatedPage / entryPages[] 命中 Drive / Form / token pattern 時 warning（不 echo value）。
- **P1** — leaking legacy `download.fileUrl` on gated page：
  ⚠️ **結構性可能、目前 0 觸發**。Blogger download box guard（line 108）只看 `download.fileUrl`，**不檢查** `pageType`。僅當未來某 gated 頁誤把 `pageType: gated_download` 與 `download.fileUrl` 並存才觸發。當前 access.md 無 download 區塊 + `github.enabled:false` → 雙重不觸發。建議未來 source landing 時在 Blogger guard 加 `pageType === 'gated_download'` 排除（GitHub 端 `6ab4749` 已做此 guard，Blogger 未做 → 兩平台不對稱，值得補齊）。
- **P1** — metadata noindex / sitemap / listings / renderer mismatch：
  🟢 meta selector 三維（robots / sitemap / listings）對 `gated_download` 已一致（前一輪 preflight §6）。唯一既存不對稱 = Q6 legacy MVP `page-noindex-in-listings`（intentional hold，spec lock §10 已隔離，不在本橋接內處理）。
- **P2** — operator display `noindex-follow` vs `noindex-nofollow` inconsistency：見 §9；兩者皆 noindex-safe，非 P0。
- **P2** — iframe RWD / accessibility / title / loading / sandbox policy：全屬 Option B 範圍；當前無 iframe 即無此風險。一旦做 B，須定 responsive wrapper（Flex-first per CLAUDE.md §9.4，避免 Grid）、明確 `title`、`loading="lazy"`、`sandbox`（Google Form 通常需允許 forms / scripts，可能無法套嚴格 sandbox → D10 待 Dean 確認）。
- **P2** — GA4 event timing and privacy scope：建議**延後**。D13 未定；renderer 落地（A / B）不應綁 GA4；CTA click / form_view event 應另階處理，且不得記個資 / respondent data。

---

## 14. Red lines（本 docs-only record task）

- ❌ no source changes（`src/` 不動）
- ❌ no content changes（`content/` 不動）
- ❌ no settings changes（`content/settings/` 不動）
- ❌ no package / lockfile changes
- ❌ no `CLAUDE.md` update
- ❌ no build
- ❌ no deploy
- ❌ no dev server
- ❌ no generated HTML / `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache/`
- ❌ no Blogger live / Google Form / Google Drive / GA4 / AdSense / Search Console / Admin backend touch
- ❌ no actual Form URL / Drive ID / secret / token / respondent data 入 repo
- ✅ 本 task 唯一允許之修改：**新增本 docs 檔**（`docs/20260626-blogger-gated-form-renderer-implementation-scan-record-docs-only-a.md`）+（Dean 核准後）commit / push

---

## 15. Final status

- 本檔將 read-only Blogger gated Form renderer implementation scan（含 checklist / copy-helper / validator 延伸）固化為正式 repo evidence 紀錄。
- 不改 source / content / settings / validator / build / template。
- 不 build / deploy / 不進任何 backend。
- 未複製任何 secret / token / Drive ID / Form URL / respondent data。
- commit message：`docs(download): record blogger gated form renderer scan`。
- 落地後 STOP，等待 Dean 下一步指示（不開始任何 source implementation）。
