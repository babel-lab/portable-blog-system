# Funnel renderer bridge — docs-only spec lock

- Phase id：`20260626-funnel-renderer-bridge-spec-lock-docs-only-a`
- 日期：2026-06-26（Asia/Taipei）
- 類型：**docs-only spec lock**（rendererer bridge policy lock；**no source change** / **no content change** / **no validator change** / **no build script change** / **no template change** / **no fixture** / **no baseline bump** / **no live service** / **no Admin write path**）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）。**不**影響 B / C / D / E / F / H / I / J / K / L 任何 source、template、settings 或 production content。
- 授權：Dean explicit approval（限定 docs-only spec lock，唯一新增本檔）
- 前置 / 來源：
  - `docs/20260624-gated-download-funnel-spec-lock.md`（三層 funnel 架構 spec lock）
  - `docs/20260625-funnel-page-type-metadata-spec-lock-docs-only-a.md`（page type / metadata / cautious wording lock）
  - `docs/20260627-funnel-production-content-input-packet-docs-only-a.md`（production content input packet）
  - `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`（Q6 listing/sitemap/robots asymmetry policy lock）
  - `docs/20260626-blogger-static-pages-function-review.md`（funnel renderer gap review）

---

## 1. Baseline

- Repo：`/d/github/blog-new/portable-blog-system`
- Branch：`main`
- HEAD = origin/main = `046c222`
- Subject：`docs(claude): sync §3a validation warning-source prose`
- working tree clean / origin synced / ahead-behind 0/0 / **no `index.lock`**
- 本文件為 **funnel renderer bridge docs-only spec lock**：僅鎖定橋接政策，不實作 renderer。

---

## 2. Purpose

本文件目的：

- 僅鎖定 **funnel renderer bridge policy**：舊 GitHub download renderer 模型與新 funnel schema 之間「目前尚未橋接」的事實，以及未來若要橋接時的紀律。

本文件**不是**：

- ❌ **不**實作 renderer（不新增 / 不修改任何 EJS / SCSS / JS / build script）。
- ❌ **不**改 source / content / validator / settings。
- ❌ **不**處理 live Blogger（不重貼、不碰 Blogger 後台）。
- ❌ **不**處理 Google Form / Google Drive backend。
- ❌ **不**代表 GitHub / new-domain funnel 已啟用（維持 `future_possible_not_active`）。

scope 界線：

- ✅ additive；不取代既有 spec-lock（`docs/20260624-...` / `docs/20260625-...`），僅延伸為 renderer bridge 維度。
- ✅ 僅作為未來 source phase planning 之引用來源。

---

## 3. Current locked funnel architecture（既有鎖定，沿用）

三層 funnel 架構（per `docs/20260624-gated-download-funnel-spec-lock.md`）：

```text
indexed entry page  →  noindex gated download page  →  post-submit resource
```

indexing / sitemap / listing 規則：

| 層 | indexing | sitemap | listing |
| --- | --- | --- | --- |
| entry page | index / follow | in-sitemap | in-listing |
| gated download page | noindex | no-sitemap | no-listing |
| post-submit resource | （非 standalone `.md`；由 Form backend 控制） | — | — |

`gatedDownload` **only allowed keys**（其他 key 觸發 `page-gated-download-suspicious-field`，不 echo value）：

- `mechanism`
- `formEmbedUrl`
- `postSubmitResource`

`downloadFunnel` 概念欄位（concept-level；validator 已把關，renderer 未消費）：

- `role`（`entry` / `gated_page`）
- `targetGatedPage`（slug 或 public URL；**不得** Drive/Form private URL）
- `entryPages`（reverse reference；slug 或 public URL）
- `ctaEventName`（重用既有 GA4 event，如 `click_all_download`）

Google Form / Drive / secret red lines（既有鎖定）：

- ❌ 不存 Drive folder ID / Drive file ID / OAuth token / API key / Form response URL / Form edit URL / respondent data / private permission。
- ✅ Google Forms responses 永遠停留在 Google Forms / Sheets，不進 repo。
- ✅ `formEmbedUrl` 僅允許 public embed URL（commit 前須人工審視）。

---

## 4. Current content state（Bopomofo funnel pair）

- `content/blogger/posts/20260626-bopomofo-practice-cards-entry.md`
- `content/blogger/posts/20260626-bopomofo-practice-cards-access.md`

| 維度 | entry.md | access.md |
| --- | --- | --- |
| 平台 | Blogger-only | Blogger-only |
| `publishTargets.github.enabled` | **false** | **false** |
| `publishTargets.blogger.enabled` | true | true |
| `primaryPlatform` | blogger | blogger |
| `pageType` | `article` | `gated_download` |
| `downloadFunnel.role` | `entry`（→ targetGatedPage `…access`） | `gated_page`（← entryPages `[…entry]`） |
| `gatedDownload` | 缺（正確：entry 不應有） | `{mechanism: google-form, formEmbedUrl:"", postSubmitResource:"drive-link"}` |
| `draft` / `status` | true / draft | true / draft |
| `includeInListings` / `includeInSitemap` | true / true | **false / false** |
| 文案 | placeholder | placeholder |
| `canonical` | `""` | `""` |

狀態鎖定：

- 兩篇皆 **Blogger-only / draft / placeholder**；目前**不 render、不 repost**。
- entry / gated page metadata **與既有鎖定策略對齊**（entry = article + index/sitemap/listing；gated = gated_download + no-sitemap/no-listing）。
- `formEmbedUrl:""` 仍空（待 Dean 提供 public embed readiness）。
- `postSubmitResource:"drive-link"` 為 **safe enum/string only**，非 URL。
- **無** respondent data / Drive ID / Form URL / token / secret。
- 其餘 `gatedDownload` / `downloadFunnel` / `pageType: gated_download` 出現處全部為 `content/validation-fixtures/`（測試夾具，非真實內容）。

---

## 5. Current GitHub renderer state

- GitHub post-detail 目前支援**舊直接下載**：
  - guard：`post.download.enabled && post.download.fileUrl`（`src/views/pages/post-detail.ejs`，`lab-download-box`）。
- GitHub post-detail 另有**舊 landing 抽象**（較早期模型，Phase 20260603）：
  - guard：`post.download.enabled === true && post.download.landingPage === true`（`lab-download-box--landing`）。
  - 資料來源：build 端 `deriveRenderedDownloadLanding()`（`src/scripts/build-github.js`），解析 derived object `downloadLandingRendered`。
  - registry 來源：`content/settings/download-forms.json`、`content/settings/download-assets.json`。
  - 兩 registry **目前皆為空 `[]`** → 舊 landing 模型**永遠 fallback 到 placeholder**（「表單暫不可用」/「下載資產暫不可用」），且紅線上不輸出 Form/Drive URL。
- GitHub renderer **不消費**下列作為 body renderer trigger：
  - `gatedDownload`
  - `downloadFunnel`
  - `pageType: gated_download`
- GitHub / new-domain funnel 維持 **`future_possible_not_active`**。

---

## 6. Current Blogger renderer state

- Blogger full template 目前**僅**支援直接下載：
  - guard：`download.enabled && download.fileUrl`（`src/views/blogger/blogger-post-full.ejs`，`lab-download-box`）。
- Blogger full template **沒有**：
  - `download.landingPage` 分支
  - Google Form embed 分支
  - gated page 分支
  - post-submit 分支
  - `gatedDownload` consumer
  - `downloadFunnel` consumer
- summary / redirect-card / home-index / category-index 模板亦皆無 funnel 分支。
- Blogger noindex **必須在 Blogger 後台手動設定**（「自訂 robots 標頭標記」）。
- repo **無法注入** Blogger head robots（平台代管 head）。
- repo 僅能產出 hand-paste HTML / publish-checklist / copy-helper 指引。

---

## 7. Bridge decision: old model vs new schema

本階段鎖定下列橋接判斷：

1. 舊 `download.landingPage`（+ `downloadLandingRendered` + `download-forms.json` + `download-assets.json` registry）= **legacy GitHub-only landing 抽象**。
2. 新 `gatedDownload` / `downloadFunnel` / `pageType: gated_download` = **intended future funnel schema**。
3. **兩者目前尚未橋接，且不得隱式合併**。
4. **不得**讓 `download.landingPage` 自動等同 `gatedDownload`。
5. **不得**讓 `gatedDownload` / `downloadFunnel` 經由舊 registry 自動 render，直到某個 source phase 明確橋接它。
6. 未來任何 bridge 必須是 **explicit / per-platform / 受 validation + fixtures + regression check 覆蓋**。
7. 兩模型的橋接決策（retire 舊 landing、wrap 舊 landing、或新舊並存）**留待未來 source phase 明確決定**；本文件**不**預判該決策，僅鎖定「現在尚未橋接」與「未來橋接須 explicit」。

---

## 8. Platform separation policy

### A. Blogger-only current scope

- Blogger-only funnel content 可存在。
- 當前 Bopomofo pair 維持 draft / placeholder。
- 未來任何 Blogger renderer **只能產 hand-paste output**。
- source phase **不得** Blogger live repost。
- **不得**做 backend NO INDEX 自動化（noindex 由 Dean 手動於 Blogger 後台設定）。

### B. GitHub current scope

- GitHub funnel 維持 **inactive**。
- `github.enabled:false` 內容**不得 render** 進 GitHub。
- 在 Dean 明確啟用 GitHub / new-domain funnel 前，**不得**做 GitHub funnel source landing。

### C. Future new-domain

- 尚無 domain binding。
- **不得**推論 canonical / URL / form provider / Drive policy。
- 必須為**獨立 phase**。

---

## 9. Security / privacy / secret boundary

- ❌ 不得 commit 真實 Google Form response / edit URL。
- ❌ 不得 commit Drive file / folder ID。
- ❌ 不得 commit respondent data。
- ❌ 不得 commit tokens / secrets / OAuth / API key。
- ✅ `formEmbedUrl` 可維持空字串，直到 Dean 提供 public-facing embed readiness。
- ✅ `postSubmitResource` 應維持 safe enum / string（如 `drive-link`）。
- ✅ 未來填入的 `formEmbedUrl` 視為 **public-facing by design**，commit 前須人工審視。
- ❌ 不碰 Blogger / Form / Drive backend。

---

## 10. Q6 listing / sitemap / robots policy continuity

明確引用：`docs/20260626-q6-download-listing-asymmetry-policy-lock.md`。

- 未來 gated pages **不得**意外重蹈 legacy MVP 的 listing 不對稱。
- gated pages 預設應為：
  - noindex
  - no sitemap
  - no listing
- entry pages 可為：index / sitemap / listing。
- Q6 legacy MVP warning（`page-noindex-in-listings` @ `content/github/posts/20260504-portable-blog-system-mvp.md`）**維持獨立且 intentional**；屬 legacy hold，與 funnel bridge 無關，**不**在本 bridge 內處理。
- 本文件**不**修改 Q6 MVP post metadata。

---

## 11. Future source phase ladder（提議，不實作）

> 以下為**未來** phase 排序提議；本文件**不實作**任何一階；每階皆須獨立 Dean explicit approval。

- **Phase 1：docs / content readiness**
  - Dean 定稿 entry / access 文案。
  - Dean 確認 Form embed readiness。
  - Dean 確認 Drive / post-submit policy。
  - **No source。**
- **Phase 2：Blogger-only placeholder renderer preview**（optional）
  - 只產 hand-paste HTML。
  - **No Blogger live repost。**
  - **No real secrets。**
  - 須對既有 Blogger 輸出做 byte-diff regression。
- **Phase 3：Blogger gated Form embed support**（optional）
  - 在 Phase 2 基礎上支援 gated Form embed。
  - 沿用既有 Blogger output rules（byte-identical-modulo-builtAt 於無 funnel 之 ready post）。
  - 須更新 publish-checklist。
- **Phase 4：GitHub deferred stub / explicit not-active guard**（optional）
  - 僅在 GitHub / new-domain funnel 維持 inactive 但需要 guard 時。
- **Phase 5：GitHub / new-domain renderer activation**
  - 僅在 canonical / robots / sitemap / listing policy 鎖定後。
- **Phase 6：cross-platform renderer**
  - 最後一階。
  - **現階段不建議。**

---

## 12. Future options

> 每個選項列：會碰的檔案 / 風險 / validation strategy / rollback / stop condition / Blogger·GitHub·future-new-domain 影響。

### Option A：維持 deferred

- 檔案：無。
- 風險：最低。
- validation：沿用現 baseline（不變）。
- rollback / stop：天然無 diff。
- 平台影響：Blogger / GitHub / new-domain 皆不變。

### Option B：docs-only bridge spec lock（**本階段**）

- 檔案：僅新增本檔。
- 風險：低（docs-only）；唯一風險為文件與未來實作脫節。
- validation：無（不跑 build / validator 變更）。
- rollback / stop：刪除本檔即可。
- 平台影響：純文件，0 render 變更。

### Option C：Blogger-only renderer preview

- 檔案：`src/views/blogger/blogger-post-full.ejs` + `src/scripts/build-blogger.js`（+ 可能 fixture）。
- 風險：中；動 production Blogger renderer，須保證既有 ready posts byte-identical-modulo-builtAt；formEmbedUrl 空時 placeholder-only、紅線不洩 URL；不進 Blogger live。
- validation：build:blogger diff 比對 + 既有 AdSense guard 回歸 + 新 fixture warning-only。
- rollback / stop：git revert source commit；diff 非預期立即 STOP。
- 平台影響：Blogger render 改變（dormant，不 repost）；GitHub 不動；new-domain 不動。前置缺口：content 仍 draft / placeholder、formEmbedUrl 空。

### Option D：GitHub deferred stub

- 檔案：`src/views/pages/post-detail.ejs` + `src/scripts/build-github.js`（not-rendered guard / warning）。
- 風險：中低；目前 `github.enabled:false` 內容已 by-construction 不進 GitHub render，故此為「防未來誤啟用」之預防，非必要。
- validation：byte-identical 回歸 + validator 不變。
- rollback / stop：git revert。
- 平台影響：GitHub source 改動（no-op）；Blogger / new-domain 不動。

### Option E：full cross-platform renderer

- 檔案：兩平台 renderer + build script + 可能新 SCSS + validator + fixtures（範圍最大）。
- 風險：高；content draft、formEmbedUrl 空、GitHub funnel inactive、new-domain 無 binding、Blogger head-robots 結構限制 → churn 且違反 surface-gating 紀律。
- validation：兩平台 byte-diff 回歸 + 完整 validator regression + 多 fixture。
- rollback / stop：git revert 整批；任一平台 diff 非預期立即 STOP。
- 平台影響：全面；現階段過早。

### Option F：content finalization first

- 檔案：無 source；後續 content metadata 由 Dean 提供（非 Claude 編造）。
- 風險：低；為其餘 render option 的真正前置依賴。
- validation：content 定稿後再跑 validate:content 回歸。
- rollback / stop：無 source diff。
- 平台影響：解鎖後才談 render。

---

## 13. Stop / reopen triggers

下列任一發生時，**才可**重新打開 source renderer 討論（仍須獨立 phase + Dean explicit approval）：

- Dean 定稿 funnel content 文案。
- Dean 確認 Form embed readiness。
- Dean 確認 Drive / post-submit policy。
- Blogger-only render preview 被 explicit 核准。
- GitHub / new-domain funnel 被 explicit 啟用。
- `github.enabled` policy 改變。
- domain / canonical policy 改變。
- validation warnings 改變。
- 新的 `gated_download` production content 被加入。

---

## 14. No-touch scope（本階段不可碰）

- source（`src/`）
- content（`content/`）
- settings（`content/settings/`）
- package / lockfile（`package.json` / `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`）
- validator scripts
- build / deploy output（`dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache/` / generated HTML）
- `CLAUDE.md` / `MEMORY.md`
- Blogger templates / GitHub renderer
- Blogger live / Blogger backend
- Google Form / Google Drive backend
- GA4 / AdSense / Search Console / Admin backend
- secrets / tokens / Drive IDs / Form response URLs / respondent data
- footer disclosure
- root `index.html`
- `/tags/` nav
- Q6 MVP post metadata
- LearnOops

本階段唯一允許之修改：**新增本 docs 檔**（`docs/20260626-funnel-renderer-bridge-spec-lock-docs-only-a.md`）。

---

## 15. Allowed commands this docs-only phase

僅允許：

- `git status --short`
- `git status -sb`
- `git diff -- docs/20260626-funnel-renderer-bridge-spec-lock-docs-only-a.md`
- `git diff --check`
- `git diff --stat`
- （核准後）`git add` 本檔 + `git commit` + `git push`

不跑：

- build / deploy / dev server
- Blogger / Google / GA4 / Admin backend

---

## 16. Final status

- 本文件為 funnel renderer bridge **docs-only spec lock**。
- 不改 source / content / validator / build / template。
- 不 build / deploy / 不進任何 backend。
- 未複製任何 secret / token / Drive ID / Form URL / respondent data。
- commit message：`docs(funnel): lock renderer bridge policy`。
- 落地後 STOP，等待 Dean 下一步指示。
