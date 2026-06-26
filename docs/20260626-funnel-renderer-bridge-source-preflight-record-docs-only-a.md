# Funnel renderer bridge — source preflight record (docs-only)

- Phase id：`20260626-afternoon-funnel-renderer-bridge-source-preflight-record-docs-only-a`
- 日期：2026-06-26（Asia/Taipei，afternoon）
- 類型：**docs-only evidence / preflight record**（將前一輪 read-only source scan 結果落為正式 repo 紀錄；**no source change** / **no content change** / **no settings change** / **no package/lockfile change** / **no validator change** / **no build** / **no deploy** / **no dev server** / **no backend touch**）
- 影響分類編號（CLAUDE.md §7）：A（規範 / 文件）。**不**影響 B / C / D / E / F / H / I / J / K / L 任何 source、template、settings 或 production content。
- 授權：Dean explicit approval（限定本 docs-only record；唯一新增本檔）
- 前置 / 來源：
  - `docs/20260626-funnel-renderer-bridge-spec-lock-docs-only-a.md`（renderer bridge policy lock）
  - `docs/20260624-gated-download-funnel-spec-lock.md`（三層 funnel 架構）
  - `docs/20260625-funnel-page-type-metadata-spec-lock-docs-only-a.md`（page type / metadata / cautious wording lock）
  - `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`（Q6 listing/sitemap/robots asymmetry policy lock）
- 對應 scan session：`20260626-afternoon-funnel-renderer-bridge-source-preflight-readonly-a`（read-only，未落檔）

---

## 1. Baseline verification

| 檢查 | 值 | 判定 |
| --- | --- | --- |
| pwd | `/d/github/blog-new/portable-blog-system` | ✅ |
| branch | `main` | ✅ |
| HEAD (short) | `249f0ff` | ✅ |
| log -1 | `docs(funnel): lock renderer bridge policy` | ✅ |
| HEAD == origin/main | `249f0ff` == `249f0ff` | ✅ |
| ahead / behind | `0 / 0` | ✅ |
| working tree | clean（落檔前） | ✅ |
| `.git/index.lock` | NO INDEX LOCK | ✅ |

baseline 正確 → 進行 read-only scan 並落為本紀錄。

---

## 2. Task scope

- 僅將前一輪 **read-only source preflight scan** 的判定整理為正式 repo 文件。
- **不**開始任何 source implementation；**不**橋接 renderer；**不**改 content / settings / validator / build / template。
- 本檔為「下一輪 source landing 前的 evidence 基準」，供未來 phase planning 引用。
- additive：不取代既有 spec-lock，僅作為其 scan-evidence 附錄。

---

## 3. Files / directories scanned

**Read（全文）**：
- `docs/20260626-funnel-renderer-bridge-spec-lock-docs-only-a.md`
- `src/scripts/page-type-robots.js`
- `src/scripts/include-in-listings.js`
- `src/scripts/include-in-sitemap.js`
- `content/blogger/posts/20260626-bopomofo-practice-cards-access.md`

**Grep（content 模式，定位行號）**：
- `src/views/pages/post-detail.ejs`
- `src/views/blogger/blogger-post-full.ejs`
- `src/scripts/build-github.js`
- `src/scripts/build-blogger.js`

**Grep（全 repo，排除 `dist*/`）**：舊欄位 `download.fileUrl` / `download.landingPage` / `downloadLandingRendered` / `deriveRenderedDownloadLanding`；新欄位 `gatedDownload` / `downloadFunnel` / `pageType` / `includeInSitemap` / `includeInListings`。

未碰：build / deploy / dev server / Blogger / Google Form / Google Drive / GA4 / AdSense / Search Console / Admin / `dist*` / `.cache`。

---

## 4. Current renderer behavior

### 4.1 GitHub `src/views/pages/post-detail.ejs`

- 兩條獨立 download 分支，皆 **不檢查** `pageType` / `gatedDownload` / `downloadFunnel`：
  - line 115：`post.download && post.download.enabled && post.download.fileUrl` → `lab-download-box` + `<a class="lab-download-box__cta" href=fileUrl download>`（直出檔案連結）。
  - line 145：`post.download && post.download.enabled === true && post.download.landingPage === true` → `lab-download-box--landing`，資料來自 build 端 derived `downloadLandingRendered`（registry 空時 graceful fallback placeholder，不洩 URL）。
- **無** gated / Form-embed / funnel body 分支。

### 4.2 Blogger `src/views/blogger/blogger-post-full.ejs`

- 僅一條 download 分支：line 108 `post.download && post.download.enabled && post.download.fileUrl` → `lab-download-box`。
- **無** `landingPage` 分支、**無** Form embed、**無** gated page、**無** post-submit、**無** `gatedDownload` / `downloadFunnel` consumer。
- summary / redirect-card / home-index / category-index 模板亦皆無 funnel 分支（沿用 spec lock §6）。

### 4.3 `src/scripts/build-github.js`

- `deriveRenderedDownloadLanding(post, settings)`（line 474）：僅在 `download.enabled === true && download.landingPage === true` 命中時回傳 derived object；否則 `null`。registry 來源 `content/settings/download-forms.json` / `download-assets.json` **皆空 `[]`** → landing 永遠 fallback placeholder。
- robots：`resolvePostDetailRobots(post, seo.robots)`（line 309，來自 `page-type-robots.js`）**已消費** `pageType`：`gated_download` → `noindex, follow`。
- listings：`shouldIncludeInListings` 過濾 listingPosts（SP-4a / Slice 2）。
- sitemap inclusion：由 `build-sitemap.js` + `include-in-sitemap.js` 決定。
- **不消費** `gatedDownload` / `downloadFunnel` 作為任何 body renderer trigger。

### 4.4 `src/scripts/build-blogger.js`

- 讀 `post.pageType`（line 393）**僅供** copy-helper / publish-checklist 之 operator guidance 區塊（[15]）；明文 **不接入** post.html / robots / sitemap / listing / metadata selector（line 34 / 386–390 / 640）。
- **無** `gatedDownload` / `downloadFunnel` / `landingPage` / `downloadLandingRendered` consumer。
- Blogger noindex 仍須 Dean 於 Blogger 後台手動設定（repo 無法注入 head robots）。

---

## 5. Legacy download field usage（仍被消費）

| 欄位 | 消費點 | 行為 |
| --- | --- | --- |
| `download.enabled` | 兩平台 download box guard 之 AND 條件 | gate 前置 |
| `download.fileUrl` | `post-detail.ejs:115`、`blogger-post-full.ejs:108` | 直出 `<a download href>` 檔案連結 |
| `download.landingPage` | `post-detail.ejs:145`（**GitHub-only**） | 觸發 `lab-download-box--landing` 分支 |
| `downloadLandingRendered` | `build-github.js:474 deriveRenderedDownloadLanding` → `post-detail.ejs` | GitHub-only derived object；registry 空 → placeholder |

→ Blogger 端**沒有** landing / `downloadLandingRendered`；landing 模型純 GitHub-only legacy 抽象。

---

## 6. New funnel / gated metadata support status

| 欄位 | validator | meta selector（robots / sitemap / listings） | body renderer |
| --- | --- | --- | --- |
| `pageType` | ✅ `validate-content.js` / `check-page-type-validator.js`（SP-2 封閉列舉） | ✅ **已接**（robots via `page-type-robots.js`；listings via `include-in-listings.js` Slice 2） | ❌ 無 body 分支 |
| `contentKind` | ✅ | ✅ robots fallback（`download`→`noindex, follow`）/ sitemap exclude / listings Slice 2 | ✅ 既有 download box / robots fallback |
| `gatedDownload`（mechanism / formEmbedUrl / postSubmitResource） | ✅ slice 1 / 2 | — | ❌ **完全無 consumer** |
| `downloadFunnel`（role / targetGatedPage / entryPages / ctaEventName） | ✅ slice 4 / 6 / 8 / 10 | — | ❌ **完全無 consumer** |
| `includeInSitemap` | ✅ | ✅ `include-in-sitemap.js`（safety 優先，noindex / download 不入；override tighten-only） | n/a |
| `includeInListings` | ✅ | ✅ `include-in-listings.js`（Slice 2：`download` / `gated_download` 預設 opt-out，須顯式 `true` 才留） | n/a |

meta 層（robots / sitemap / listings）對 `pageType: gated_download` 與 `contentKind: download` **已完整一致**：
- robots：`page-type-robots.js:62-66` → `gated_download` → `noindex, follow`（`contentKind=download` 同樣 fallback；explicit `seo.indexing` 最高優先；platformPolicy override tighten-only）。
- sitemap：`include-in-sitemap.js:41` → `contentKind=download` 非 index → 排除。
- listings：`include-in-listings.js:34,84` → `pageType ∈ {download, gated_download}` 或 `contentKind=download` 預設排除。

---

## 7. Confirmed gap

1. **validator 已接受 `gatedDownload` / `downloadFunnel`**（slice 1–10 landed，warning-only / 0 production trigger）。
2. **metadata selectors 已處理 robots / sitemap / listings**（如 §6；`pageType: gated_download` 與 `contentKind: download` 三維一致）。
3. **renderer 尚未消費 `gatedDownload` / `downloadFunnel`**：grep 確認 `build-github.js` / `build-blogger.js` / `post-detail.ejs` / `blogger-post-full.ejs` 皆無 consumer。
   - 後果：Google Form embed 目前**只能以 markdown placeholder 文字出現**，無 embed 渲染管線；gate 行為（Form embed / post-submit）無渲染實作。
   - 此落差屬 spec lock §5 / §7 **已明文鎖定**之預期狀態（「validator 已把關、renderer 未消費，且不得隱式合併」）。

---

## 8. Risk assessment

| 級別 | 風險 | 判定 |
| --- | --- | --- |
| **P0** | secret / Drive ID / Form response URL / respondent data 入 repo | ✅ 0 風險。本檔 docs-only；scan 過程未複製任何 secret；`bopomofo-...-access.md` 之 `formEmbedUrl:""` 空、`postSubmitResource:"drive-link"` 為列舉值非 URL。 |
| **P1** | GitHub direct `fileUrl` leak（繞過 gate 直出下載連結） | ⚠️ **結構性可能、目前 0 觸發**。download box guard 只看 `download.fileUrl` / `download.landingPage`，**不檢查** `pageType` / `gatedDownload`。僅當未來某 gated 頁**錯誤地**把 `pageType: gated_download` 與 `download.fileUrl` 並存時才會觸發。當前唯一 gated 內容 `content/blogger/posts/20260626-bopomofo-practice-cards-access.md` **完全無 `download:` 區塊** 且 `publishTargets.github.enabled: false` → 雙重不觸發。 |
| **P2** | renderer 未消費 metadata 之落差（Form embed 無渲染） | 🟡 已知設計。spec lock §5/§7 已鎖定；不影響 indexing safety；僅代表 funnel body 待未來 source phase 橋接。 |
| **P2** | noindex / sitemap / listings 與 rendering 不一致 | 🟢 meta selector 三維一致（§6）。唯一既存不對稱 = Q6 legacy MVP `page-noindex-in-listings`（intentional hold，spec lock §10 已隔離，不在本橋接內處理）。 |

**P1 重點記錄**：GitHub direct `fileUrl` leak 為「未來內容若錯誤組合 metadata 才成立」之結構性風險，**非當前 live 風險**；當前 0 trigger（gated access 頁無 download block + `github.enabled:false`）。若未來開 source landing，建議優先在 GitHub download box guard 加 `pageType: gated_download` 排除（見 §9 Optional guard）。

---

## 9. Minimal future source landing candidates

> 以下為**候選清單**，非建議立即執行；每階皆須獨立 Dean explicit approval。

**Blogger-only core（當前唯一 active surface）**
- `src/views/blogger/blogger-post-full.ejs` — 新增 gated / Form-embed 分支。
- `src/scripts/build-blogger.js` — 新增 derive helper（mirror `deriveRenderedDownloadLanding` pattern），把 `gatedDownload` 解析為 render-safe object 傳 EJS。

**Optional guard（GitHub，spec §8.B 維持 inactive；屬「防誤啟用」非渲染）**
- `src/views/pages/post-detail.ejs` — download box guard 前加 `pageType === 'gated_download'` 排除，避免 fileUrl 直出繞 gate（P1 緩解）。
- `src/scripts/build-github.js` — 對應 guard / derive。

**Validation / style / checklist（視橋接決策連帶）**
- `src/scripts/validate-content.js` — 若橋接後新增一致性檢查（如 gated 頁不得有 `download.fileUrl`）。
- 新 SCSS（`_download-box.scss` 或新 `_gated-form.scss`）— Form embed 容器樣式。
- `src/views/blogger/blogger-publish-checklist.ejs` / `blogger-copy-helper.ejs` — gated 頁 NO INDEX 手動設定提示。

**最小爆炸半徑**：若僅做 Blogger-only placeholder / preview（spec §11 Phase 2/3），核心 = **2 檔**（`blogger-post-full.ejs` + `build-blogger.js`），+ 可選 SCSS + checklist。GitHub 端在 Dean 明確啟用前維持 inactive。

---

## 10. Suggested next session split（提議，不實作）

> 排序提議，每階獨立 Dean explicit approval。

- **Phase 1（Blogger placeholder / preview）**：僅在 Dean 提供 / 確認 `formEmbedUrl` policy（public embed readiness）後，做 Blogger-only placeholder renderer preview；只產 hand-paste HTML；**no Blogger live repost**；對既有 ready post 做 byte-diff regression。
- **Phase 2（GitHub no-op guard）**：對 GitHub download box 加防誤啟用 guard（`pageType: gated_download` 排除 fileUrl 直出）；byte-identical 回歸。
- **後續**：validator hardening、checklist UI 等，**分階進行**。
- ❌ **不得**在單一大 mutation 中同時混入 renderer + validator hardening + checklist UI，除非 Dean explicit approval。

---

## 11. Explicit red lines（本 docs-only record task）

- ❌ no source changes（`src/` 不動）
- ❌ no content changes（`content/` 不動）
- ❌ no settings changes（`content/settings/` 不動）
- ❌ no package / lockfile changes
- ❌ no build / no deploy / no dev server
- ❌ no Blogger / Google Form / Google Drive / GA4 / AdSense / Search Console / Admin backend touch
- ❌ no secret / token / Drive ID / Form response URL / respondent data 入 repo
- ✅ 本 task 唯一允許之修改：**新增本 docs 檔**（`docs/20260626-funnel-renderer-bridge-source-preflight-record-docs-only-a.md`）

---

## 12. Final status

- 本檔將 read-only source preflight scan 固化為正式 repo evidence 紀錄。
- 不改 source / content / settings / validator / build / template。
- 不 build / deploy / 不進任何 backend。
- 未複製任何 secret / token / Drive ID / Form URL / respondent data。
- commit message：`docs(funnel): record renderer bridge source preflight`。
- 落地後 STOP，等待 Dean 下一步指示（不開始任何 source implementation）。
