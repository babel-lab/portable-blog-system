# Blogger gated download / Google Form embed — policy & decision packet (docs-only)

- Phase id：`20260626-blogger-gated-form-embed-policy-decision-packet-docs-only-a`
- 日期：2026-06-26（Asia/Taipei）
- 類型：**docs-only policy / decision packet**（source implementation 前的政策與欄位決策整理；**no source change** / **no content change** / **no settings change** / **no package/lockfile change** / **no validator change** / **no build** / **no deploy** / **no dev server** / **no backend touch**）
- 影響分類編號（CLAUDE.md §7）：A（規範 / 文件）。**不**影響 B / C / D / E / F / H / I / J / K / L 任何 source、template、settings 或 production content。
- 授權：Dean explicit approval（限定本 docs-only packet；唯一新增本檔）
- 前置 / 來源：
  - `docs/20260624-gated-download-funnel-spec-lock.md`（三層 funnel 架構 spec lock）
  - `docs/20260625-funnel-page-type-metadata-spec-lock-docs-only-a.md`（page type / metadata / cautious wording lock）
  - `docs/20260626-funnel-renderer-bridge-spec-lock-docs-only-a.md`（renderer bridge policy lock）
  - `docs/20260626-funnel-renderer-bridge-source-preflight-record-docs-only-a.md`（source preflight record）
  - `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`（Q6 listing/sitemap/robots asymmetry policy lock）
  - `content/blogger/posts/20260626-bopomofo-practice-cards-access.md`（現有 gated access 草稿；read-only 確認 `formEmbedUrl` 仍空）

---

## 1. Purpose

本文件是 **Blogger gated download Form embed source implementation 前**的 policy / decision packet。

- 目的：把「在開始任何 Blogger gated renderer / Google Form embed source implementation 之前，必須由 Dean 明確確認」的政策與 metadata 欄位整理成單一決策清單。
- 本文件**不包含任何**：
  - ❌ 實際 Google Form URL（embed / edit / response 皆無）
  - ❌ Google Drive ID（folder / file 皆無）
  - ❌ secret / token / OAuth / API key
  - ❌ respondent data（表單填答者個資 / 回覆內容）
- 本文件**不做任何 source implementation**：不新增 / 不修改任何 EJS / SCSS / JS / build script / validator / content / settings。
- additive：不取代既有 spec-lock；僅作為其決策附錄，供未來 source phase planning 引用。

---

## 2. Current baseline

- Repo：`/d/github/blog-new/portable-blog-system`
- Branch：`main`
- HEAD = origin/main = `e030276`（full `e0302765a5bae24d0c4563e3a0e7777f5d1d927c`）
- Subject：`docs(state): sync gated download guard baseline`
- working tree clean / origin synced / ahead-behind 0/0 / **no `index.lock`**

進度狀態：

- ✅ **GitHub direct-file guard 已完成**（commit `6ab4749`）：GitHub 端 `pageType: gated_download` 頁面即使未來誤填 `download.fileUrl`，也**不**走 legacy direct `<a download href=...>` download box。
- ❌ **Blogger renderer 尚未開始**（`blogger-post-full.ejs` 未動）。
- ❌ **Blogger Google Form embed 尚未開始**。
- ❌ **`gatedDownload` / `downloadFunnel` body renderer 尚未開始**（validator 已把關，renderer 未消費）。
- ❌ Google Form / Google Drive policy 尚未由 Dean 落地（repo 內無 Drive ID / secret / Form URL / respondent data）。

---

## 3. Existing locked facts（既有鎖定，沿用，不在本文件變更）

- **三層 funnel 分層**：`indexed entry page → noindex gated download page → post-submit resource`。
  - entry page：index / follow、in-sitemap、in-listing。
  - gated download page：**noindex / follow**、no-sitemap、no-listing。
  - post-submit resource：非 standalone `.md`；由 Google Form backend 控制。
- **download link 來源**：實際 download / Drive cloud file 連結由 **Google Form post-submit confirmation** 管理，**不**由 repo 直出。
- **Blogger gated page noindex**：應 noindex / follow，且不進 sitemap / listings。Blogger 端 NO INDEX **必須由 Dean 於 Blogger 後台手動設定**（「設定 → 搜尋偏好 → 自訂 robots 標頭標記」）；repo 無法注入 Blogger head robots。
- **GitHub / future merged site 目前不啟用 Form embed rendering**（funnel = `future_possible_not_active`；`github.enabled:false` 內容不進 GitHub render）。
- **`gatedDownload` only-allowed keys**：`mechanism` / `formEmbedUrl` / `postSubmitResource`（其他 key 觸發 `page-gated-download-suspicious-field`，不 echo value）。
- **secret red lines**：不存 Drive folder/file ID、OAuth token、API key、Form response URL、Form edit URL、respondent data、private permission；Google Forms responses 永遠停留在 Google Forms / Sheets。
- **現有 gated 內容狀態**：`content/blogger/posts/20260626-bopomofo-practice-cards-access.md` 之 `gatedDownload.formEmbedUrl` **仍為空字串**、`postSubmitResource: "drive-link"`（列舉值，非 URL）、無 `download:` 區塊、`publishTargets.github.enabled: false`；本文件確認其尚未提供任何實際 Form URL。

---

## 4. Decision items Dean must confirm before source implementation

> 以下每項皆為 **Dean 決策點**；在 Dean 明確確認前，source implementation **保持 blocked**。本文件**不**替 Dean 預設答案（§5 僅提供「若無其他指示」之保守建議預設）。

### 4.1 Repo 是否允許存放 public Google Form embed URL

- [ ] D1：是否允許 repo metadata（`.md` frontmatter）存放 **public** Google Form **embed** URL？
- [ ] D2：若**不**允許直接存 embed URL，是否改為只存 **placeholder key / registry key**（由 repo 外或後台對應實際 URL）？

### 4.2 Renderer input 欄位

- [ ] D3：`gatedDownload.formEmbedUrl` 是否可作為 renderer 的 input（renderer 直接讀此欄位產 embed）？

### 4.3 禁止存放的連結 / 識別碼

- [ ] D4：是否**禁止**在 repo 存 Google Form **response URL**？
- [ ] D5：是否**禁止**在 repo 存 Google Drive **direct file URL**？
- [ ] D6：是否**禁止**在 repo 存 **private Drive ID**（folder / file ID）？

### 4.4 Post-submit 與 download link 管理位置

- [ ] D7：Google Form **post-submit message** 是否仍由 **Google Form 後台**管理，**不**由 repo 管理？
- [ ] D8：download link 是否**只**出現在 **Form submit 後畫面**，**不**由 repo 直出？

### 4.5 Blogger generated HTML 中的 iframe

- [ ] D9：Blogger generated HTML 是否**允許**包含 iframe embed code？
- [ ] D10：若允許，iframe 的 **sandbox / width / height / loading / title** policy 為何？
  - 建議草案（待 Dean 確認）：`loading="lazy"`、明確 `title`、合理 `width` / `height`（或 responsive wrapper）、視 Google Form 相容性決定 `sandbox`（Google Form embed 通常需允許 forms / scripts，可能無法套嚴格 sandbox → 須 Dean 確認）。

### 4.6 Metadata selectors 沿用

- [ ] D11：noindex / sitemap / listings 是否**沿用既有 metadata selectors**（`page-type-robots.js` / `include-in-sitemap.js` / `include-in-listings.js`，`pageType: gated_download` → noindex/follow + no-sitemap + no-listing）？

### 4.7 Blogger 後台 noindex 手動確認

- [ ] D12：是否需要在 publish-checklist / copy-helper **額外提醒 Dean 手動確認 Blogger 後台 noindex**（自訂 robots 標頭標記）？

### 4.8 GA4 event

- [ ] D13：是否需要 GA4 event？若需要，**只記 CTA click / form_view**，**不**記個資、**不**記 respondent data。

---

## 5. Recommended safe default policy

> 保守預設（per memory `feedback_conservative_landing`）：若 Dean 無其他明確指示，建議採下列預設。仍須 Dean 明確確認方可進入 source phase。

- repo **不存** Form response URL。
- repo **不存** private Drive ID（folder / file）。
- repo **不存** respondent data。
- repo **不直出** Drive download link。
- download link **只由** Google Form post-submit confirmation 管理。
- renderer **只 render** Form embed / placeholder，**不** render file download anchor。
- 當 `formEmbedUrl` 為空（如現況）時，renderer 應輸出 **safe placeholder**（如「表單暫不可用」）**或直接不輸出 Form iframe**；紅線上不洩任何 URL。
- noindex / sitemap / listings **沿用既有 selectors**（gated_download → noindex/follow、no-sitemap、no-listing）。
- GA4（若啟用）只記 CTA click / form_view，不記個資 / respondent data。
- `formEmbedUrl` 若填入，視為 **public-facing by design**，commit 前須人工審視；**禁** edit URL / response URL。
- `postSubmitResource` 維持 safe enum / string（如 `drive-link`），非 URL。

---

## 6. Proposed future metadata contract draft

> 僅提出草案，**不修改 schema**、**不修改 validator**、**不新增欄位至任何 production content**。實際採用前須 Dean 確認 §4 各項。

```yaml
# DRAFT ONLY — pending Dean confirmation (§4). Not applied to schema/validator/content.
gatedDownload:
  enabled: true|false
  mechanism: "google_form"          # 機制列舉（目前現有內容用 "google-form"，命名統一待 Dean 確認）
  formEmbedUrl: ""                   # public embed URL only（待 D1/D2/D3 決策；空時 placeholder-only）
  postSubmitResource: "drive-link"   # safe enum / string only；非 URL；非 Drive ID

downloadFunnel:
  role: "entry" | "gated_page"
  targetGatedPage: ""                # entry → gated slug 或 public URL；禁 Drive/Form private URL
  ctaEventName: ""                   # 重用既有 GA4 event（如 click_all_download）；只記 CTA click
```

- 上述欄位皆為 **renderer implementation 前待 Dean 確認**之草案。
- `mechanism` 值命名（`google_form` vs 現有內容 `google-form`）待 Dean 統一確認。
- `downloadFunnel.entryPages[]`（gated_page 端 reverse reference）已存在於現有內容草稿，沿用既有鎖定，不在本草案重複定義。

---

## 7. Implementation should remain blocked until

source implementation（任何 Blogger renderer / Form embed / gated body renderer）**保持 blocked**，直到：

- Dean 明確確認 **Form embed URL policy**（§4.1 D1/D2、§4.2 D3）。
- Dean 明確確認 **Drive link 不進 repo，或只用 Form post-submit**（§4.3、§4.4 D7/D8）。
- Dean 明確確認 **iframe rendering policy**（§4.5 D9/D10）。
- Dean 明確確認 **Blogger publish checklist 是否要同步**（§4.7 D12）。

在上述確認完成前，**不**開始任何 source mutation。

---

## 8. Next safe sessions after Dean decision

> 排序提議；每階獨立 Dean explicit approval；**不要把以下混成同一個 large mutation session**。

- **Phase A：Blogger-only renderer placeholder / no iframe**
  - Blogger-only renderer 只輸出 placeholder（不輸出 Form iframe）。
  - 以 fixtures smoke；對既有 ready post 做 byte-diff regression。
- **Phase B：Blogger-only Form iframe render, no Drive link direct output**
  - 在 Phase A 基礎上支援 Form iframe render。
  - **不**直出 Drive link。
- **Phase C：Blogger publish checklist / copy helper warning**
  - gated 頁 NO INDEX 手動設定提示 + checklist 同步。
- **Phase D：validator hardening**
  - 例如：gated page 不得同時有 `download.fileUrl`（warning-only-first）。

---

## 9. Red lines（本 docs-only packet task）

- ❌ no source changes（`src/` 不動）
- ❌ no content changes（`content/` 不動）
- ❌ no settings changes（`content/settings/` 不動）
- ❌ no validator changes
- ❌ no build / no deploy / no dev server
- ❌ no generated HTML / `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache/`
- ❌ no Blogger live / Google Form / Google Drive / GA4 / AdSense / Search Console / Admin backend touch
- ❌ no actual Form URL / Drive ID / secret / token / respondent data 入 repo
- ✅ 本 task 唯一允許之修改：**新增本 docs 檔**（`docs/20260626-blogger-gated-form-embed-policy-decision-packet-docs-only-a.md`）

---

## 10. Final status

- 本文件為 Blogger gated download / Google Form embed **source implementation 前的 docs-only policy / decision packet**。
- 不改 source / content / settings / validator / build / template。
- 不 build / deploy / 不進任何 backend。
- 未複製任何 secret / token / Drive ID / Form URL / respondent data。
- commit message：`docs(download): add blogger gated form embed decision packet`。
- 落地後 STOP，等待 Dean 下一步指示（不開始任何 source implementation）。
