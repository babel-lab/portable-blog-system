# 2026-06-03 Download Landing Page Renderer Preanalysis

Phase name: `20260603-am-9-download-landing-page-renderer-preanalysis-docs-only-a`
Date: 2026-06-03 08:10 +0800
Mode: **docs-only preanalysis**（no source / no fixture / no content / no settings / no registry mutation / no loader / no renderer / no templates / no Admin / no middleware / no CLAUDE.md / no package / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM / no pm-26 unblock / no admin-write-cli / no Admin Apply）

---

## 1. Executive Summary

本 phase 是 **docs-only preanalysis**，目的在於盤點未來 **internal noindex download landing page renderer** 之設計邊界、資料流、路由策略、registry 解析、SEO 互動與風險紅線，使後續若要啟動 landing page renderer 之 implementation 時，有可引用的設計基線。

**本 phase 嚴格邊界：**

- ❌ **不**實作 landing page renderer。
- ❌ **不**改 `src/scripts/load-settings.js` / `load-posts.js` / `parse-markdown.js` / `build-github.js` / `build-blogger.js` / `build-sitemap.js` / `validate-content.js`。
- ❌ **不**改 `content/settings/download-assets.json` / `download-forms.json`（registries remain empty）。
- ❌ **不**改 production content（`content/blogger/posts/` / `content/github/posts/` / `content/shared/posts/`）。
- ❌ **不**改 templates（`content/templates/` 與 `src/views/`）。
- ❌ **不**改 validation fixtures（`content/validation-fixtures/`）。
- ❌ **不**改 CLAUDE.md。
- ❌ **不**改 `package.json` / lockfile / `dist*/` / `gh-pages`。
- ❌ **不** build / deploy / Blogger repost / GA4 validation。
- ❌ **不** activate reverse UTM；**不** unblock pm-26 deploy gate。
- ❌ **不** start Admin picker / Admin Apply / middleware / admin-write-cli。
- ❌ **不** 啟動 R4 inactive / R6 coexistence source。

輸出僅為本檔，作為下一階段（若有）renderer implementation preflight 之**安全設計盤點**文件。

**本 phase 在 R 系列中的定位：**

- R2 not-found（`download-asset-ref-not-found` / `download-form-ref-not-found`）已 landed（commit `145a548`）。
- R5b intra-post duplicate（`download-asset-ref-duplicate`）已 landed（commit `077c3d1`）。
- R6 coexistence rule = docs-only preanalysis（commit `dcd0356`），建議 **defer**（Option E）；source **未**啟動。
- R4 inactive rule（R4a Option A: keep registries empty）= **NO-GO**；source **未**啟動。
- Admin picker = **未**啟動。
- landing page renderer = **未**啟動，本檔即為其前置 docs-only 設計盤點。

關鍵立場（先給 spoiler，詳見 §15）：

- **建議：Final Idle Freeze / EXIT，現在不啟動 landing page renderer implementation。**
- renderer 設計邊界本身相對清楚，但**整套 long-term download flow 之多個前置條件**（real Google Form embed URL / real Google Drive asset URL / registry data / content model decision / promote-to-ready gates）尚未滿足；現在實作 renderer 等同強迫上述前置條件之倉促決議。
- Content model 推薦走 **Option D（reuse existing post + `seo.indexing` noindex 機制）**，避免新增 content type / 新增 build branch / 新增 Admin loader；同時保留長期 normalize 至 dedicated content type 之退路。
- 強制紅線：article CTA **永不**直接導 Google Form；landing page **永遠** noindex + sitemap-exclude；使用者填表資料**永遠**留在 Google Forms / Sheets，**不**進 repo / Admin static files；renderer **不**得自動 unblock reverse UTM / pm-26 / Admin Apply。

See also：

- `docs/20260603-download-r6-coexistence-rule-preanalysis.md`（R6 coexistence preanalysis；recommends defer）
- `docs/20260603-download-r5b-duplicate-checkpoint.md`（R5b checkpoint；本 phase baseline 直接 inherit）
- `docs/20260602-download-r4a-inactive-registry-data-strategy-preanalysis.md`（R4a — Option A keep registries empty；R4b NO-GO）
- `docs/20260602-download-r2-not-found-checkpoint.md`（R2 freeze baseline）
- `docs/20260602-download-registry-aware-validation-preanalysis.md`（R-series plan）
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`（registry schema 與紅線 R1）
- `docs/20260531-download-asset-form-registry-json-preanalysis.md`（registry JSON empty-shape policy）
- `docs/20260531-download-empty-registry-implementation-plan.md`（empty-registry landing 計畫）
- `docs/20260529-reverse-utm-download-landing-page-flow-decision.md`（pm-11；article CTA → landing page → embedded form → Drive ZIP 流程定稿）
- `docs/20260529-download-landing-page-schema-preanalysis.md`（pm-16；DownloadLandingPage / FormConfig / DownloadAsset 草案 schema；normalize 方向）
- `docs/20260529-download-landing-page-admin-model-preanalysis.md`（pm-12；Admin ownership boundary）
- `docs/20260530-download-fileurl-preview-url-risk-policy.md`（preview-url-risk = docs-only authoring policy，**不**升級為 validator）
- CLAUDE.md §3.2（download registry red lines + 當前狀態）
- CLAUDE.md §13（`download.fileUrl` warning policy）
- CLAUDE.md §16.4（reverse UTM dormancy；pm-26 BLOCKED）
- CLAUDE.md §21（SEO 規則）
- CLAUDE.md §23（status enum：draft / ready / published / archived）
- CLAUDE.md §27（Claude Code 修改紅線）

---

## 2. Current Baseline

Baseline confirmed at start of this phase（2026-06-03 08:10 local）：

- repo path：`D:\github\blog-new\portable-blog-system`
- branch：`main`
- HEAD：`dcd0356707c23f2a3356ce55ee77fcca17386478`（short `dcd0356`）
- `HEAD == origin/main`：yes（ahead / behind = `0 / 0`）
- working tree：clean
- latest commit subject：`docs(download): plan reference coexistence validation`
- `npm run validate:content` → **0 errors / 60 warnings / 53 posts**

### 2.1 Recent commit chain（top of this phase window）

```text
dcd0356 docs(download): plan reference coexistence validation
a25be4a docs(download): record r5b duplicate checkpoint
077c3d1 feat(download): warn on duplicate asset refs
bd94220 docs(download): plan asset ref duplicate validation
d2b04ff docs(download): decide inactive registry strategy
```

### 2.2 R-series status snapshot

| Rule family | Rule id | Phase | Status |
| --- | --- | --- | --- |
| R1（registry shape） | `download-registry-invalid-shape` | 20260601-pm-17 | ✅ landed（warning-only）|
| R1（registry dup-key） | `download-registry-duplicate-key` | 20260601-pm-17 | ✅ landed（warning-only）|
| R2（not-found） | `download-asset-ref-not-found` | 20260602-night-9 (`145a548`) | ✅ landed（warning-only）|
| R2（not-found） | `download-form-ref-not-found` | 20260602-night-9 (`145a548`) | ✅ landed（warning-only）|
| R4a（inactive strategy） | n/a — docs-only decision | 20260602-night-14 | ✅ Option A — keep registries empty |
| R4b（inactive source） | — | — | ❌ NO-GO |
| R5b（duplicate） | `download-asset-ref-duplicate` | 20260603-am-2 (`077c3d1`) | ✅ landed（warning-only；intra-post `assetRefs[]` only）|
| R6（coexistence） | — | 20260603-am-6 (`dcd0356`) | 🟡 docs-only preanalysis；**defer**（Option E）|
| Landing page renderer | — | **this phase** | 🟡 docs-only preanalysis only |
| Admin picker | — | — | ❌ not started |
| Production content migration | — | — | ❌ zero usage of `assetRefs[]` / `formRef` |

### 2.3 Empty registry state preserved

```json
content/settings/download-assets.json
{ "schemaVersion": 1, "updatedAt": "", "assets": [], "notes": "" }

content/settings/download-forms.json
{ "schemaVersion": 1, "updatedAt": "", "forms":  [], "notes": "" }
```

兩 registry 自 commit `466e471` 起均維持 empty。本 phase 不改動。

### 2.4 Production download content snapshot

掃描 `content/blogger/posts/` / `content/github/posts/` / `content/shared/posts/`：

| Post | status | contentKind | download block? | fileUrl | assetRefs | formRef |
| --- | --- | --- | --- | --- | --- | --- |
| `content/blogger/posts/20260529-phonics-practice-sheet-download.md` | `draft` | `download` | ✅ | `""`（empty）| 無 | 無 |
| 其他 production posts | — | — | ❌ | — | — | — |

唯一活 production download post 為 draft；validator 不掃；publish 流程不出 dist；長期 candidate for landing page migration（per `docs/20260529-reverse-utm-download-landing-page-flow-decision.md` §6）。

### 2.5 Dormant rails

- reverse UTM remains **landed but dormant**（per CLAUDE.md §16.4；source pm-24a/b/c 已 push origin/main，未 deploy）。
- pm-26 deploy gate remains **BLOCKED**（per CLAUDE.md §3.2）。
- Admin Apply / middleware write / admin-write-cli remain **dormant**。

---

## 3. Existing Download Flow

### 3.1 目前文章 download block 之渲染行為

文章 frontmatter 之 `download:` block 由現有 EJS 模板於 **post detail render** 階段直接讀取：

- **GitHub Pages 端**：`src/views/pages/post-detail.ejs` lines 97–122：3 條 AND guard（`post.download` 存在 / `enabled === true` / `fileUrl` 有值）通過時 render `lab-download-box` aside，含 `title` / `description` / `<a class="lab-download-box__cta" href={fileUrl} download>` / `licenseNote`。
- **Blogger 端**：`src/views/blogger/blogger-post-full.ejs` lines 81–95：mirror GitHub 端，3 條 AND guard 通過時 render 相同結構。
- **build-blogger.js**：line 452 `download: post.download ?? null` —— 把 raw frontmatter 之 `download` 物件直接傳給 template，**不**做 registry resolve、**不**做 landing page URL 推導、**不**做 noindex 互鎖。
- **build-github.js**：post detail render 同樣只讀 raw `post.download`；renderer 無 registry 概念。

### 3.2 `download.fileUrl` 之目前角色

- frontmatter 屬性：legacy raw URL；可指向任何 URL（外部直連 / Drive share / Drive direct download / 表單 URL / 未來 landing page URL）。
- validator 之覆蓋：
  - D1 `download-enabled-fileurl-empty`：`contentKind === 'download'` + `enabled === true` + 空 / whitespace。
  - D2 `download-fileurl-invalid-type`：`fileUrl` 非 string。
  - D3 `download-fileurl-invalid-format`：non-empty string but not matching `^https?://`。
  - D4 non-rule：**永不** reachability check（per `docs/20260530-download-fileurl-preview-url-risk-policy.md` §C.1）。
  - 未實作之 preview-url-risk：**永遠** docs-only authoring policy（per pp policy §D.1）。
- SEO interlock S：`contentKind === 'download'` 且 `seo.indexing` 不為 `noindex-*` 時 warn `download-content-should-be-noindex`。
- contentKind=download 之 robots fallback（per `build-github.js` lines 304–307）：若 `seo.indexing` 未顯式設定，預設 `noindex, follow`。

### 3.3 為何文章 CTA 不該直接導 Google Form

per `docs/20260529-reverse-utm-download-landing-page-flow-decision.md` §3 + §5：

```text
Search / social / internal traffic
  → article page                          (indexable，SEO 入口)
    → article page download CTA
      → internal download landing page    (noindex，不進 sitemap)
        → download landing page embeds Google Form
          → user submits form
            → user receives or sees Google Drive ZIP / PDF / JPG asset
```

關鍵不變式：

1. article page CTA **不直接**指 Google Form。Form URL 屬下載頁設定（FormConfig），非文章層級。
2. article page CTA **不直接**指 Google Drive 檔案。檔案 URL 屬資產 metadata（DownloadAsset），非文章層級。
3. 真正能對外提供 ZIP / PDF / JPG 的中介是 **internal noindex download landing page**。
4. 使用者填表資料留在 Google Forms / Sheets；**不**進 repo / Admin static files / settings registry（紅線 R1，per pm-20 §4 / CLAUDE.md §3.2）。
5. landing page 必須 noindex + 排除 sitemap，避免搜尋直達跳過文章頁。

### 3.4 Google Drive asset / Google Form / Internal landing page 之分工

| 元件 | 屬性 | 由誰維護 | 是否進 repo | URL 是否進 frontmatter |
| --- | --- | --- | --- | --- |
| Google Drive asset（ZIP / PDF / JPG）| 真正之可下載資產 | Google Drive 外部 | ❌ | ❌（建議透過 `download-assets.json` registry 由 renderer resolve；目前 registry empty）|
| Google Form embed URL | 表單 gate；landing page 內嵌 | Google Forms 外部；站方擁有 | ❌ | ❌（建議透過 `download-forms.json` registry 由 renderer resolve；目前 registry empty）|
| Internal noindex download landing page | 站內中繼頁；內嵌 form；引導使用者到 Drive asset | 本 repo（content + renderer）| ✅（landing page 之 content / metadata）| 由 article CTA 指向 landing page URL；建議用 `relatedLinks.kind: internal` 或 `download.landingPageUrl` 或 `download.fileUrl` |
| Article（一般 SEO 文章）| indexable；提供文章內文與下載 CTA | 本 repo | ✅ | `download.fileUrl`（過渡）或 `download.landingPageRef`（長期）|

---

## 4. Target Landing Page Flow

未來理想流程（純文字描述；本 phase **不**實作）：

```text
1. 使用者在搜尋引擎 / 社群 / 內部導流抵達 article page。
2. article page 為 indexable；文章內容提供 SEO 上下文與導流情境。
3. 使用者於文章內 click download CTA（HTML anchor，target 為 internal landing page URL）。
4. 使用者抵達 internal noindex download landing page。
5. landing page render 顯示：
   - landing page title / description / asset preview / license note。
   - 內嵌 Google Form iframe（或顯示 external form link，若選擇不嵌）。
6. 使用者於 Google Form 填寫資料（資料留在 Google Forms / Sheets，repo 與 Admin 不收）。
7. 表單 thank-you page / submit confirmation 顯示 Google Drive asset URL（ZIP / PDF / JPG）。
8. 使用者前往 Google Drive 取得實際檔案。

副流程：
- 若使用者未填表即離開 landing page → 使用者**不**取得檔案 URL。landing page 不主動曝光 Drive URL。
- 若 landing page 因 noindex 不可被搜尋 → 使用者必須經由 article CTA 抵達；不會跳過文章頁。
- 若 article 已下架但 landing page 仍存在 → 使用者無法經由 article CTA 抵達；landing page 可考慮顯式 archive。

不變式：
- repo 永遠不收 respondent data。
- landing page URL **永遠** noindex。
- landing page **永遠** 排除 sitemap。
- article CTA **永遠** 指 internal landing page，不指 Form、不指 Drive。
```

---

## 5. Renderer Responsibility Boundary

### 5.1 Renderer **應**負責

1. **讀取 landing page content / frontmatter**：landing page 之 slug / title / description / status / SEO flags / 資產與表單參照。
2. **Resolve `download.assetRefs[]` → `settings.downloadAssets` registry**：把 assetId 解析為 registry entry（`label` / `type` / `storageProvider` / `driveUrl` / `deliveryMode` 等），供 landing page render 使用。
3. **Resolve `download.formRef` → `settings.downloadForms` registry**：把 formId 解析為 registry entry（`embedUrl` / `publicUrl` / `provider` 等），供 landing page render Google Form embed 區塊。
4. **產生 noindex landing page HTML**：HTML head 含 `<meta name="robots" content="noindex, follow">` 或 `noindex, nofollow`，由 `seo.indexing` 驅動，**reuse 既有 build-github SEO pipeline**（per `docs/20260529-download-landing-page-schema-preanalysis.md` §10）。
5. **產生正確 canonical / robots meta / sitemap exclusion 行為**：landing page 不進 sitemap（`build-sitemap.js` 既有 `seo.indexing === 'noindex-*'` 排除分支）。canonical 為 landing page 自己之 URL，**不**指向文章。
6. **顯示 asset metadata**：title / label / fileType / fileCount / licenseNote / preview thumbnail 等；**不**直接曝光 Drive direct download URL（必須 form-gated）。
7. **顯示 Google Form embed 或 external form link**：依 FormConfig 提供之 `embedUrl` 或 `publicUrl` 決定渲染方式。
8. **registry resolve 之 graceful fallback**：registry empty / entry not-found / entry malformed 時，renderer **不** crash；改 render 「下載暫不開放 / 待補上線」之 placeholder。

### 5.2 Renderer **不應**負責

1. **儲存 Google Form submission data**：永不收 / 永不寫入 repo / 永不寫入 Admin static files（紅線 R1，per CLAUDE.md §3.2）。
2. **下載或同步 Google Form response**：不呼叫 Google Sheets API，不 import respondent rows。
3. **驗證 Google Drive URL reachability**：mirror D4 non-rule（per `docs/20260530-download-fileurl-preview-url-risk-policy.md` §D.1）；validator / renderer 永不做網路 reachability。
4. **代替 Admin write path**：renderer 為 read-only consumer；不寫 frontmatter、不寫 registry、不啟動 admin-write-cli / Admin Apply / middleware write。
5. **自動啟用 reverse UTM / pm-26 deploy gate unblock**：renderer 之 implementation 不解除任何 dormant rail。
6. **自動 build / deploy / Blogger repost / GA4 validation**：renderer source land 後，build / deploy / repost / GA4 屬獨立 user-triggered phase。
7. **跨文章 / 跨 landing page 之引用追蹤**：renderer 不維護 sourceArticleRefs 之 reverse index（避免 build-time 開銷與 lock-in 風險）。
8. **取代 contentKind / `download.enabled` / `status` 之既有語意**：renderer 不重新定義文章 download block 語意；只 add 額外 render branch。
9. **自動 migrate production posts 至 long-term model**：renderer **不**得在初次 land 時強迫所有 production download posts migrate。
10. **取代 article-level SEO**：article remains indexable；renderer **不**得讓 article 變 noindex。

---

## 6. Content Model Options

未來 landing page 之 content model 候選方案；以下評估**僅作 docs 紀錄**，本 phase **不**裁決並**不**實作任一 option。

### Option A：沿用 post `download.fileUrl` 作為 landing page URL

- **描述**：landing page 不獨立存在；`download.fileUrl` 之語意正式收斂為「指向 internal noindex landing page URL」。landing page **本體**仍須有 HTML 實體，但 frontmatter 不為其建檔。
- **source touch scope**：build-github.js / build-blogger.js / post-detail.ejs 之 download box render 邏輯；landing page HTML 由 renderer 透過 registry resolve + 樣板生成；不新增 content type。
- **Content migration risk**：低；既有 `download.fileUrl` 文章僅需把 URL 改為 landing page URL；不改 contentKind。
- **Validate impact**：D1 / D2 / D3 / S 既有語意保持；不需新 rule；但 D3 之 fileUrl pattern 可能需考慮接受 internal relative path（per `docs/20260530-download-validation-fileurl-relative-path-decision-preanalysis.md` 之 Option D 仍 reject relative path）。
- **Sitemap / noindex support**：需 renderer 端為 landing page HTML 注入 noindex meta；sitemap exclusion 須另設機制（landing page 不在 posts loop 中，build-sitemap 不會自動掃到）。
- **Blogger / GitHub build impact**：build-github 需新增 landing page render branch；build-blogger 不受影響（landing page only on GitHub Pages）。
- **Admin picker dependency**：低；frontmatter 仍只用 `fileUrl`。
- **Suitability**：短期過渡可接受；但缺乏 landing page 之獨立 content / metadata，難以管理多個 landing page。

### Option B：新增 dedicated landing page `contentKind`

- **描述**：新增 `contentKind: "download-landing"`（或類似命名），用 frontmatter 描述每個 landing page；放在 `content/github/pages/` 或 `content/blogger/pages/` 之內。
- **source touch scope**：load-posts.js（contentKind validation）/ build-github.js（render branch）/ post-detail.ejs（landing page layout）/ validate-content.js（新 contentKind enum 接受）/ build-sitemap.js（含 landing page 之 noindex 排除）。
- **Content migration risk**：中；既有 `download.fileUrl` 文章須建立對應 landing page entry 並回填 `download.landingPageRef`。
- **Validate impact**：需新增 `download-landing-*` family rule（landing page 必須 noindex / `formRef` 必填等）；baseline +N warnings（fixture-driven）。
- **Sitemap / noindex support**：可 reuse `seo.indexing` pipeline（per pm-15 finding）；noindex 與 sitemap 排除自動生效。
- **Blogger / GitHub build impact**：build-github 新增 contentKind branch；build-blogger 無 landing page（Blogger 端無需 landing page）。
- **Admin picker dependency**：中；Admin 端 picker 需能挑 landing page slug 寫入 article 之 `landingPageRef`。
- **Suitability**：長期最乾淨；landing page 為一級實體；resource normalization 完整。

### Option C：使用 `content/shared/pages/` 或 `content/download/pages/` 目錄

- **描述**：landing page 內容放在 shared / download 專屬目錄；不依賴既有 github / blogger 雙站結構。
- **source touch scope**：load-posts.js 需擴張至支援 shared/pages glob；build-github.js 需從新目錄 render；build-sitemap.js 同樣。
- **Content migration risk**：中；類似 Option B，但目錄結構變動。
- **Validate impact**：類似 Option B + 既有 `processMarkdownEntry` 之 sourceCollection 邏輯擴張。
- **Sitemap / noindex support**：可 reuse `seo.indexing` pipeline；但 build-sitemap 需擴張 scan range。
- **Blogger / GitHub build impact**：build-github 擴張 scan；build-blogger 不受影響。
- **Admin picker dependency**：中；同 Option B。
- **Suitability**：與 Option B 類似，但跨站結構（shared）為 Option B 之變體；無顯著額外好處；增加 build glob 之 routing 複雜度。

### Option D：用 existing Blogger / GitHub post + `seo.indexing=noindex` 模擬 landing page

- **描述**：landing page 為一篇普通 post，但 `seo.indexing = "noindex-follow"` / `"noindex-nofollow"`，contentKind 可為 `download` 或 `page`；不新增 contentKind。
- **source touch scope**：零；reuse 既有 build-github / build-blogger / build-sitemap pipeline；renderer 只需在 post detail 模板新增「if `seo.indexing === noindex-*` 且 `formRef` 存在 → render Google Form embed + asset section」分支。
- **Content migration risk**：低；既有 `content/blogger/posts/20260529-phonics-practice-sheet-download.md` 可逐步加上 `seo.indexing: "noindex-follow"` + `formRef` + `assetRefs[]`，無 contentKind 變更。
- **Validate impact**：零至低；可選 add `download-landing-noindex-required` rule（warning-only）；既有 SEO interlock S 已涵蓋 `contentKind === 'download'` 之 noindex 要求。
- **Sitemap / noindex support**：完美 reuse；`build-sitemap.js` 既有 `seo.indexing === 'noindex-*'` 排除分支；`build-github.js` 既有 `seo.robots` meta 生成。
- **Blogger / GitHub build impact**：build-github 改動極小；build-blogger 可選擇是否 render landing page；Blogger 端不需 landing page。
- **Admin picker dependency**：低；landing page 為 post，Admin 已可編輯。
- **Suitability**：短期 + 中期最佳；reuse 90% 既有 pipeline；長期可以較低成本 promote 至 Option B（normalize 成獨立 contentKind）。

### Option E：暫不建立新 content model，只先保持 `fileUrl` legacy

- **描述**：landing page 概念暫不落地；既有 `download.fileUrl` 維持 raw URL（可指任意外部 URL）；renderer **不**實作。
- **source touch scope**：零。
- **Content migration risk**：零（無變更）。
- **Validate impact**：零。
- **Sitemap / noindex support**：既有 contentKind=download 之 robots fallback `noindex, follow` 仍適用於文章本身；landing page 概念不存在。
- **Blogger / GitHub build impact**：零。
- **Admin picker dependency**：無。
- **Suitability**：最保守；保留所有選擇彈性；但 long-term flow 之主要設計目標（form gate + Drive asset 中介）**永遠**無法達成。

### Option comparison summary

| Option | Source touch | Migration risk | Validate impact | SEO reuse | Build impact | Admin dep | Long-term fit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | low | low | low | partial（renderer 自處理 noindex）| low-mid | low | 過渡 |
| B | high | mid | mid（new family）| ✅ full | high | mid | long-term ideal |
| C | mid-high | mid | mid | ✅ full | mid-high | mid | Option B 之變體 |
| D | low | low | low | ✅ full | low | low | **mid-term sweet spot** |
| E | 0 | 0 | 0 | 部分（無 landing page）| 0 | 0 | 保守；無法達成長期目標 |

**初步傾向**（僅 docs 紀錄；本 phase **不**裁決）：

- 若**現在**啟動 renderer implementation：建議走 **Option D**（reuse existing post pipeline + `seo.indexing` noindex）。
- 若**長期**規模化教具下載：再從 Option D 平滑遷移至 **Option B**（dedicated contentKind）。
- **不**建議現在跳 Option B / C（過早 normalize；新增 build branch 與 Admin loader 之成本與當前需求不成比例）。
- **不**建議 Option E（無法達成 long-term flow，但本 phase 之 Final Idle Freeze 與 Option E 等效）。

---

## 7. Routing / URL Strategy

### 7.1 landing page URL 應該在 GitHub Pages 還是 Blogger？

**建議：GitHub Pages 唯一。**

理由：

1. GitHub Pages 端為**本機可完整預覽**（per CLAUDE.md §2.2）；Blogger 端為手動發布平台，不適合動態 landing page。
2. GitHub Pages 端已有 noindex / sitemap exclusion pipeline（per pm-15 finding）；Blogger 端之 noindex 設定須透過 Blogger 後台手動。
3. Blogger 端如需指向下載 → 文章 CTA 可直接連到 GitHub Pages landing page URL（cross-site link）。
4. 若 Blogger 與 GitHub Pages 都建立 landing page，會引入「同一資產之兩個入口」一致性問題；違反 §3.3 不變式 1（CTA 不直連 Form / Drive）。

### 7.2 文章 CTA 連到哪裡比較合理？

- **GitHub Pages 文章** → `https://babel-lab.github.io/portable-blog-system/downloads/<slug>/`（或類似 noindex landing slug）。
- **Blogger 文章** → 跨站連到 **GitHub Pages landing page URL**（透過既有 `relatedLinks` 或 `download.fileUrl` 之 raw URL）。
  - cross-site link 之 UTM / target / rel 由 §16.4 之 Blogger → GitHub 自動處理機制（已 landed but dormant）自動套用。
  - 但 reverse UTM **本 phase 不解除 dormancy**；renderer 不依賴 reverse UTM activation。

### 7.3 noindex page 是否應進 sitemap？

**No.** noindex landing page **必須**排除 sitemap。

per `build-sitemap.js` lines 125–130 既有實作：`seo.indexing === 'noindex-follow' | 'noindex-nofollow'` 之 post 直接 `continue` 排除。

renderer 若採 Option D，自動受益於既有排除分支；若採 Option B / C，build-sitemap 須擴張至排除新 contentKind。

### 7.4 canonical 應該指向文章還是 landing page 自己？

**Landing page canonical 應指向自己。**

理由：

1. landing page 為 noindex；canonical 指向文章會引入「另一頁存在但 indexable」之矛盾訊號；搜尋引擎可能誤判。
2. landing page 之內容（asset preview + form embed + license note）與文章不同；不是同一資源之 alternate。
3. canonical 自指（self-canonical）為 noindex 頁之 SEO 標準做法。

文章 canonical 不受影響；仍依 `primaryPlatform` 與 `canonical` 既有邏輯處理。

### 7.5 是否需要 stable slug / permalink？

**Yes.** landing page slug 必須穩定。

理由：

1. 文章 CTA 連向 landing page URL；slug 變動會 break 文章 CTA。
2. landing page URL 若進 Google Form thank-you redirect（未來）需穩定。
3. stable slug 為 `download-landing/<slug>` 或 `downloads/<slug>` 形式；避免與既有 `posts/<slug>` route 衝突。

建議 slug 規則：

```text
landing page URL pattern：/downloads/<slug>/
slug 來源：landing page frontmatter 之 slug（per Option D）或 DownloadLandingPage.slug（per Option B）
```

### 7.6 是否需要避免 search users bypass article？

**Yes.** 這是 noindex landing page 的核心目的之一（per `docs/20260529-reverse-utm-download-landing-page-flow-decision.md` §4）。

機制：

1. noindex meta：搜尋引擎不索引 landing page → 搜尋結果不出現 landing page。
2. sitemap exclude：landing page 不被 Google Search Console 提交。
3. article CTA 為唯一 landing page 入口（除直接輸入 URL）。
4. article remains indexable；維持文章作為 SEO 入口之唯一性。

robots.txt 不額外封鎖 landing page（per pm-11 §4 noindex 為正確機制，**非** robots.txt disallow）；landing page 仍允許爬蟲抓取（用於 noindex 標記之識別），只是不索引。

---

## 8. Registry Resolution Strategy

### 8.1 Renderer 如何讀取 `download-assets.json` / `download-forms.json`

reuse `src/scripts/load-settings.js` 既有 read-only loader（Phase 20260601-pm-11）：

```js
result.downloadAssets = await readJsonOptional('download-assets.json', { schemaVersion: 0, updatedAt: '', assets: [], notes: '' });
result.downloadForms = await readJsonOptional('download-forms.json', { schemaVersion: 0, updatedAt: '', forms: [], notes: '' });
```

loader 已 expose `settings.downloadAssets` / `settings.downloadForms`；renderer 直接 consume。

**不**新增專屬 loader；**不**改 `readJsonOptional` semantics；**不**新增 `loadRegistry` helper。

### 8.2 空 registry 時應如何處理

**graceful fallback render**：

- `assetRefs[]` 之 entry 在空 registry 下 → renderer 顯示「下載暫不開放」placeholder，**不** crash、**不** 404。
- `formRef` 在空 registry 下 → renderer 顯示「表單暫不可用」placeholder，**不** embed 任意 form、**不** 503。
- landing page HTML 仍可生成；只是 asset / form 區塊為 placeholder 狀態。

理由：

1. registry empty 為 production 之 baseline（per CLAUDE.md §3.2）；renderer 必須在此情境下不 break build。
2. 過渡期作者可能先建 landing page（status=draft）再回填 registry；renderer 不應強迫先建 registry。
3. graceful fallback 不影響 validator R2 not-found warning（warning-only，per §4.5 R2 cascade）。

### 8.3 Missing key / inactive / duplicate / coexistence validator 與 renderer 的關係

| validator rule | renderer 行為 |
| --- | --- |
| `download-asset-ref-not-found`（R2） | render asset placeholder；不顯示資產；不 break |
| `download-form-ref-not-found`（R2） | render form placeholder；不 embed form；不 break |
| `download-asset-ref-duplicate`（R5b） | render 重複資產一次（去重）；不顯示同一資產多次 |
| `download-registry-invalid-shape`（R1） | render 全部 placeholder；視 registry 為 empty |
| `download-registry-duplicate-key`（R1） | render 第一個 entry；不嘗試 disambiguate |
| `download-asset-ref-inactive`（R4，未實作）| 未啟動；renderer 不感知 inactive |
| coexistence rules（R6，未實作）| 未啟動；renderer 不檢查 coexistence |
| `download-asset-ref-invalid-type` / `*-empty`（既有）| skip 該 ref；不 render |

### 8.4 Renderer 是否應依賴 validator already passed？

**No.** renderer 必須假設 validator 可能未 run / 可能有 warning。

理由：

1. validator 為 warning-only；warning 不 block build；renderer 必須在 warning 存在時仍能生成 HTML。
2. dev workflow 可能 build 時不先 run validate；renderer 不應依賴 pre-run。
3. 即使 validator passed，registry 仍可能 race condition（dev 開兩個 terminal 修 registry + build）；renderer 必須 idempotent。

但 **build 流程**可在 build script 開頭 invoke validator；validator 失敗時 fail-fast 屬 build 層面之選擇，與 renderer 無關。

### 8.5 Renderer 對 archived / inactive asset / form 之行為（待 R4 啟動時）

per R4a Option A 目前 keep registries empty + 未啟動 R4b：renderer 之 archived 行為**尚未需要設計**。

若未來 R4b 啟動（per `docs/20260602-download-r4a-inactive-registry-data-strategy-preanalysis.md` §3）：

- **建議：renderer 對 `status === 'archived'` 之 entry 視為 inactive → 顯示 placeholder，與 not-found 行為一致**。
- 不顯示 archived asset 之 Drive URL；不 embed archived form。
- 不刪除 landing page；只 render placeholder 並提示「資產已下架」。
- warning 由 validator 端處理；renderer 端為 silent graceful fallback。

但具體行為由 R4b implementation phase 決定；本 phase 不裁決。

### 8.6 為何目前不應為了 renderer preanalysis 改 registry JSON

per `docs/20260531-download-asset-form-registry-json-preanalysis.md` §3.1 + `docs/20260531-download-empty-registry-implementation-plan.md` §5：

1. empty registry 是 landing 計畫之 invariant；renderer preanalysis 是**設計盤點**，不需要 registry data。
2. registry 一旦含 test-only entry → 違反 §10 紅線（不得污染 production registry baseline）。
3. renderer 之 graceful fallback 設計即可在 empty registry 下完成；無 fixture 需求。
4. 一旦 renderer 真的需要 registry data（implementation 階段），由獨立 phase 決定 Option A / B / C / D / E（per R4a 之 strategy matrix）。

---

## 9. Noindex / Sitemap / SEO Strategy

### 9.1 Noindex meta

- landing page HTML head 必須含：
  ```html
  <meta name="robots" content="noindex, follow">
  ```
  或：
  ```html
  <meta name="robots" content="noindex, nofollow">
  ```
- 機制：reuse `build-github.js` lines 297–307 之 `seo.indexing` → `seo.robots` 對應。
- 由 `seo.indexing: "noindex-follow"` 或 `"noindex-nofollow"` 驅動；renderer 自身**不**注入 hardcoded noindex（避免雙重 source of truth）。

### 9.2 Sitemap exclusion

- landing page **不**進 `dist/sitemap.xml`。
- 機制：reuse `build-sitemap.js` lines 125–130 之 `seo.indexing === 'noindex-*'` 排除分支。
- Option D 自動受益；Option B / C 須擴張 build-sitemap scan range（per §6 Option comparison）。

### 9.3 Robots / canonical

- robots.txt **不**額外封鎖 landing page（per pm-11 §4：noindex 為正確機制，**非** robots.txt disallow）。
- canonical：landing page 自指（self-canonical）；per §7.4。

### 9.4 Open Graph / title / description

- landing page **可選擇**設定 OG metadata；但**不**主動推廣到社群。
- title 建議：「{資產名稱} 下載」或「{資產名稱} - 下載中心」。
- description 建議：「填寫表單後取得 {asset type}」。
- og:image 可使用 asset preview 圖；但**不**包含 Drive direct URL。
- 設計目的：使用者若直連 landing page URL（如手動分享）仍能看到正確 OG card；但搜尋引擎不索引。

### 9.5 landing page 是否應避免被 Google 搜尋索引

**Yes.** 這是 landing page 之核心目的（per `docs/20260529-reverse-utm-download-landing-page-flow-decision.md` §4）。

機制疊加：

1. noindex meta（per §9.1）：明確告知搜尋引擎不索引。
2. sitemap exclude（per §9.2）：不主動提交。
3. self-canonical（per §7.4）：不引入 indexable alternate 訊號。
4. article CTA 為唯一入口（per §7.6）：除直接 URL 外無從抵達。

### 9.6 與文章 SEO 流量的關係

- article remains indexable → article 是 SEO 入口、流量歸屬與內容上下文之主體。
- landing page 為 article 之**下游中繼**；不分流 SEO authority。
- noindex landing page 不會 dilute 文章 PageRank。
- canonical 互不指向 → 不引入 duplicate content 風險。

---

## 10. Build Pipeline Touch Map

若未來啟動 renderer implementation，可能 touch 之檔案 / 模組：

| 檔案 / 模組 | Likely required | Maybe required | Should avoid initially |
| --- | --- | --- | --- |
| `src/scripts/load-settings.js` | ❌（loader 已 expose registries）| — | ✅（avoid extension；reuse 既有 read-only loader）|
| `src/scripts/load-posts.js` | Option D：no | Option B / C：yes（contentKind enum 或 sourceCollection 擴張）| Option D 不動 |
| `src/scripts/parse-markdown.js` | ❌ | — | ✅（markdown body render 不需擴張）|
| `src/scripts/build-github.js` | Option D：minor（render branch add）；Option B：major | — | — |
| `src/scripts/build-blogger.js` | ❌（landing page only on GitHub）| — | ✅（避免引入 Blogger landing page）|
| `src/scripts/build-sitemap.js` | Option D：no（既有 noindex exclude 已涵蓋）；Option B：yes | — | Option D 不動 |
| `src/views/pages/post-detail.ejs` | Option D：modify（add landing render branch via guard）| Option B：new template | — |
| `src/views/pages/download-landing.ejs` | Option B：new file | — | Option D 不需 |
| `src/scripts/validate-content.js` | ❌（本 phase 不新增 rule）| 未來 R4 / R6 / landing-noindex-required 等 | ✅（本 phase 不擴張）|
| Admin loader / Admin UI | ❌ | 未來 Admin picker phase | ✅（本 phase 不啟動）|
| `content/settings/download-assets.json` | ❌（empty）| 未來 production migration | ✅（本 phase 不改）|
| `content/settings/download-forms.json` | ❌（empty）| 未來 production migration | ✅（本 phase 不改）|
| `content/templates/blogger-download-template.md` | ❌ | 未來 template 可加 `formRef` / `assetRefs[]` 範例 | ✅（本 phase 不改）|
| `content/templates/post-template.md` | ❌ | — | — |
| Production posts | ❌ | 未來 migration phase | ✅（本 phase 不改 production）|
| Validation fixtures | ❌ | 未來 R4 / coexistence fixture | ✅（本 phase 不改）|
| CLAUDE.md | ❌ | 未來 R-series checkpoint 文件 | ✅（本 phase 不改）|
| `package.json` / lockfile | ❌ | — | ✅（不安裝 iframe-embedding library）|
| `dist/` / `dist-blogger/` / `gh-pages` | ❌ | — | ✅（本 phase 不 build / 不 deploy）|

關鍵原則：

- **renderer implementation 第一批應盡量「append 而非改寫」**：在既有 `post-detail.ejs` 加 guarded branch，不重構 existing render flow。
- **避免 Admin 啟動**：renderer 與 Admin 為兩個獨立 phase；Admin picker 必須等 renderer 邊界穩定後再啟動。
- **build-blogger 維持絕對最小變動**：landing page **永遠** GitHub-only，避免 Blogger 端需手動 noindex 設定。

---

## 11. Validation / Fixture Implications

### 11.1 Renderer preanalysis 本身不應移動 validate baseline

本 phase 為 docs-only；唯一變更為新增本檔。baseline 結束時保持 **0 errors / 60 warnings / 53 posts**。

### 11.2 未來 renderer implementation 是否需要新增 fixture？

可能需要：

- **若採 Option D**：建議至少 1 個 fixture，含 `seo.indexing: "noindex-follow"` + `download.formRef` + `download.assetRefs[]`（with registry empty），驗證 renderer 之 graceful placeholder fallback。
- **若採 Option B**：需 1+ fixture，含新 contentKind=`download-landing` + 必填欄位。
- 任何 fixture **不**得新增到 production posts dir；**僅**入 `content/validation-fixtures/`。

### 11.3 是否會影響 R2 not-found / R4 inactive / R5b duplicate / R6 coexistence？

- **R2 not-found**：renderer 須 graceful fallback；不修改 R2 rule semantics。R2 fixture 仍只觸發 R2 warning。
- **R4 inactive**（未啟動）：renderer 行為待 R4b implementation phase 決定；本 phase 不影響。
- **R5b duplicate**：renderer 須去重 render；不修改 R5b rule semantics。
- **R6 coexistence**（建議 defer）：renderer 須允許 `assetRefs + formRef` 共存（per `docs/20260603-download-r6-coexistence-rule-preanalysis.md` §6 C4）；不引入 coexistence 警告。

### 11.4 是否需要新的 rule？

候選（**本 phase 不裁決、不實作**）：

| Candidate rule id | 條件 | 嚴重度 | 是否現在需要 |
| --- | --- | --- | --- |
| `download-landing-noindex-required` | landing page 之 frontmatter 須 `seo.indexing ∈ noindex-*` | warning | ⚠️ 待 renderer 落地後再決定（Option D 部分已被 S 涵蓋）|
| `download-landing-missing-form` | landing page 缺 `formRef`（若 landing page 設計要求 form gate）| warning | ⚠️ 待 content model 裁決（Option B / D 對此要求不同）|
| `download-asset-direct-url-risk` | `download.fileUrl` 為 Drive direct download URL 而非 landing page URL | warning | ❌ **不**建議；preview-url-risk 已 docs-only policy（per pp policy §D.1）；此 rule 重蹈 regex 維護負擔 |
| `download-landing-canonical-self` | landing page canonical 須 self-canonical | warning | ⚠️ 待 renderer 落地後再決定 |

### 11.5 是否應先做 docs-only before source？

**Yes.** 任何新增 rule 必須 mirror R-series 既有 cadence：

1. docs-only preanalysis
2. read-only acceptance
3. source implementation phase
4. read-only checkpoint

本檔即為 renderer preanalysis docs-only；rule preanalysis 屬 follow-up phase。

---

## 12. Admin Picker Relationship

### 12.1 為什麼 Admin picker 應等 renderer 邊界清楚

1. Admin picker 之 UI 應反映 renderer 之 ref 結構（`assetRefs[]` / `formRef`）。若 renderer 採 Option D 與 Option B，Admin 之 form 欄位 / picker target 不同。
2. Admin picker 若先 land，會引入 placeholder ref / 試誤 ref → 可能觸發 R2 not-found warning → 反向施壓 registry seeding。
3. renderer 之 graceful fallback 行為（per §8.2）必須由 renderer phase 決定；Admin picker 之 UI 必須對齊 fallback semantics（顯示 placeholder vs 阻擋 save vs 警告）。
4. renderer 之 cross-reference 行為（per §8.3）必須先穩定，Admin 才能決定 picker 是否過濾 inactive entry。

### 12.2 Admin picker 未來應選 `assetRef` / `formRef`，而不是處理 Google Form submissions

紅線：

- Admin picker **永不**讀 Google Forms response data。
- Admin picker **永不**寫 respondent data 到 repo。
- Admin picker 唯一職責：在 settings registry 之 entry 中挑 `assetId` / `formId`，回寫至文章 / landing page 之 frontmatter `assetRefs[]` / `formRef`。
- per CLAUDE.md §3.2 + `docs/20260529-download-landing-page-admin-model-preanalysis.md` §5：Admin **不**管 respondent records / exported spreadsheet / 使用者個資 / analytics output。

### 12.3 Admin Apply / middleware 仍應保持 disabled / dormant

per CLAUDE.md §3.2 / §27：

- Admin Apply remains **dormant**。
- middleware write route remains **dormant**。
- admin-write-cli remains **dormant**。
- 本 phase（與假設未來之 renderer implementation phase / Admin picker phase）**永遠不**自動 unblock 上述任一。

### 12.4 Admin picker preanalysis 之前置條件

- [ ] renderer implementation 至少有 single-post landing page 可 render（per §6 Option D 之最小切入點）。
- [ ] renderer 之 graceful fallback 行為已 landed 並 verified。
- [ ] `download.assetRefs[]` / `download.formRef` 之 frontmatter shape 已 verified（已 landed per Option 6 / Option A）。
- [ ] 至少 1 個 production post 採新模型成功 render（per `docs/20260529-reverse-utm-download-landing-page-flow-decision.md` §8 之 promote-to-ready gates）。
- [ ] CLAUDE.md §3.2 已同步更新 renderer 狀態。

任一 unmet → Admin picker phase **不**啟動。

---

## 13. Risk Register / Red Lines

renderer 不論採哪個 Option，**必須**遵守以下紅線：

### 13.1 不得讓文章 CTA 直接導 Google Form

per `docs/20260529-reverse-utm-download-landing-page-flow-decision.md` §3 不變式 1。renderer 若採 Option D：文章 CTA 之 `download.fileUrl` 應指向 internal landing page URL，**不**得直接填 Form URL。validator preview-url-risk 雖為 docs-only policy（per pp policy §D.1），renderer 端仍須對作者明示此紅線（透過 template comment / docs）。

### 13.2 不得把 Google Form response data 放 repo

per CLAUDE.md §3.2 / pm-20 §4 R1。renderer **永不**呼叫 Google Sheets API；**永不** import respondent rows；**永不**寫 respondent fields 到 `content/settings/` / `content/` / `dist/` 任一檔。

### 13.3 不得在 renderer 未成熟前強迫 production migration

唯一活 production download draft（phonics practice）目前 `fileUrl: ""`、無 ref；renderer 落地前 `download.fileUrl` / `assetRefs[]` / `formRef` 之 production usage **永遠**為 0。renderer implementation 之第一個 release 不應強迫所有 production posts migrate；應允許「new-flow posts opt-in / legacy posts continue」並存。

### 13.4 不得因 landing page 需求解除 reverse UTM / pm-26 gate

per CLAUDE.md §16.4 + §3.2：

- reverse UTM remains **dormant**。
- pm-26 deploy gate remains **BLOCKED**。
- renderer phase 與 reverse UTM activation / pm-26 unblock 屬**獨立 phase**；renderer source land **不**自動 trigger reverse UTM 之 deploy verify。

### 13.5 不得在本階段 build / deploy / Blogger repost / GA4 validation

per CLAUDE.md §27 + 本 phase 之 docs-only mode：

- 本 phase **不** run `npm run build` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap`。
- 不碰 `gh-pages` / `dist/`。
- 不重貼 Blogger。
- 不做 GA4 Realtime / DebugView 驗收。

### 13.6 不得修改 production content

per CLAUDE.md §27 + 本 phase 之 docs-only mode：

- 不改 `content/blogger/posts/` / `content/github/posts/` / `content/shared/posts/` 任一檔。
- 不改 `content/templates/` 任一檔。
- 不改 `content/validation-fixtures/` 任一檔。

### 13.7 不得新增 source implementation

per 本 phase 之 docs-only mode：

- 不改 `src/scripts/` 任一檔。
- 不改 `src/views/` 任一檔。
- 不改 `src/styles/` / `src/js/` 任一檔。

### 13.8 不得改 empty registry invariant

per CLAUDE.md §3.2 + `docs/20260531-download-empty-registry-implementation-plan.md` §5：

- `content/settings/download-assets.json` remains `{ schemaVersion: 1, updatedAt: "", assets: [], notes: "" }`。
- `content/settings/download-forms.json` remains `{ schemaVersion: 1, updatedAt: "", forms: [], notes: "" }`。
- 本 phase 不 seed test data。

### 13.9 不得引入 noindex bypass

per §7.6 + §9：landing page 必須 noindex + sitemap-exclude；renderer 不得提供「下載直連」之 bypass route（如 `/raw-download/<slug>` 之 indexable route）。

### 13.10 不得讓 article 變 noindex

per §3.3 不變式 + CLAUDE.md §21：article remains indexable；renderer 之邏輯不得連帶把 article 設為 noindex。

---

## 14. Recommended Implementation Sequence

以下為**候選**未來順序；本 phase **不**啟動任何 step。各 step 由 user 各自獨立 prompt 決定。

| Step | Phase 名稱 | 性質 | 前置條件 | 預期 baseline movement |
| --- | --- | --- | --- | --- |
| 1 | renderer implementation preflight（docs-only）| docs-only | 本 phase landed + Content model 裁決 docs-accepted | 0 |
| 2 | minimal fixture / content model decision（docs-only）| docs-only | Step 1 landed | 0 |
| 3 | source implementation with no production migration | source + fixtures | Step 1 / 2 landed；採 Option D 或裁決後之 Option | +1~2 fixtures / +1~2 warnings（fixture-driven） |
| 4 | validation rules / fixtures | source + fixtures | Step 3 landed | +0~N（取決於是否新增 rule） |
| 5 | Admin picker preanalysis | docs-only | Step 3 / 4 landed | 0 |
| 6 | controlled production migration | content | Step 3 / 4 / 5 landed；user 明確 acknowledge 紅線 | 0（production 不引入 fixture）|
| 7 | build / deploy / Blogger repost / GA4 only with explicit approval | build + deploy | 所有前置 steps landed + 紅線確認 + GA4 readiness verified | 0（pipeline-level） |

**明確說明：現在只完成 Step 0（preanalysis），不進入任何 step 1–7。**

任何 step 之啟動必須 mirror R-series cadence：

```text
docs-only preanalysis → read-only acceptance → source implementation → read-only checkpoint
```

並 require：

- user 明確 prompt（不自動推進）。
- 前置 step 已 landed 且 verified。
- 紅線（per §13）逐項確認未動。
- baseline movement 預估 docs 化。

---

## 15. Recommendation

### 15.1 是否現在實作 renderer？

**No.**

理由：

1. **整套 long-term download flow 之多個前置條件未滿足**：
   - 真實 Google Drive asset URL 未就緒（registry empty；唯一 production draft `fileUrl: ""`）。
   - 真實 Google Form embed URL 未就緒（registry empty；無 ready-to-use form）。
   - content model 裁決尚未 docs-accept（Option A / B / C / D / E 各有取捨；§6 僅初步傾向）。
   - production post migration plan 未啟動（唯一活 download post 為 draft；無 promote-to-ready 計畫）。
2. **Renderer 之設計邊界相對清楚**（§5–§9 已盤點），但**實作之 ground truth verification** 需要至少：
   - 1 個 ready landing page content（具 real form + real asset）。
   - 1 個 production post 採新 CTA pattern。
   - 1 個 noindex meta + sitemap exclusion 之 end-to-end smoke test（需 build / deploy）。
   以上皆超出本 phase 範圍，且各自為獨立 phase。
3. **R6 已建議 defer**（per `docs/20260603-download-r6-coexistence-rule-preanalysis.md` §12）；renderer 落地會反向施壓 R6 implementation；應先讓 R6 沉澱、確認長期 model 形態後再 build renderer。
4. **Admin picker 應等 renderer 邊界清楚**（per §12.1）；renderer 之 ground truth 形態未定，Admin picker 亦不應啟動；兩者互鎖。

### 15.2 是否現在實作 Admin picker？

**No.** per §12.4 之前置條件全數未滿足。

### 15.3 是否現在實作 R4 / R6 source？

**No.**

- R4a 已決定 Option A（keep registries empty / defer inactive）；R4b NO-GO。
- R6 docs-only preanalysis 已建議 Option E（defer）。
- 任何 R4 / R6 source 之啟動須各自獨立 user prompt + 前置條件確認。

### 15.4 是否現在 build / deploy？

**No.**

- per CLAUDE.md §3.2 + §16.4：pm-26 deploy gate remains **BLOCKED**；reverse UTM remains **dormant**。
- 本 phase 為 docs-only；不 build / 不 deploy / 不 Blogger repost / 不 GA4 validation。
- 任何 build / deploy 須等 source implementation phase 落地 + GA4 readiness verify + user explicit approval。

### 15.5 是否應 Final Idle Freeze / EXIT？

**Yes.** **Final Idle Freeze / EXIT.**

完成本 phase 後：

- docs/`20260603-download-landing-page-renderer-preanalysis.md` 已 landed。
- baseline 不變（0 errors / 60 warnings / 53 posts）。
- production state drift = 0。
- 所有 dormant rails 保持 dormant。
- 所有紅線（§13）保持 enforced。

**下一個合理 phase（由 user 主動 prompt 才啟動）：**

- 若想推進 user-facing 體驗：**content model 裁決 preanalysis**（Option A / B / C / D / E 之擇一）。
- 若想推進 validator 覆蓋：**`download-landing-noindex-required` rule preanalysis**（待 content model 裁決後）。
- 若不推進：**Final Idle Freeze / EXIT**（本 phase 結束後預設狀態）。

本 phase 對 source / fixture / registry / loader / templates / CLAUDE.md / package / dist / gh-pages 均**零**動作；唯一變動為新增本 docs 檔。

---

## Appendix A — Cross-reference index

- R6 preanalysis：`docs/20260603-download-r6-coexistence-rule-preanalysis.md`
- R5b checkpoint：`docs/20260603-download-r5b-duplicate-checkpoint.md`
- R5 preanalysis：`docs/20260602-download-r5-duplicate-rule-preanalysis.md`
- R4a strategy：`docs/20260602-download-r4a-inactive-registry-data-strategy-preanalysis.md`
- R2 checkpoint：`docs/20260602-download-r2-not-found-checkpoint.md`
- R-series plan：`docs/20260602-download-registry-aware-validation-preanalysis.md`
- Registry schema decision：`docs/20260531-download-asset-form-settings-registry-schema-decision.md`
- Registry JSON preanalysis：`docs/20260531-download-asset-form-registry-json-preanalysis.md`
- Empty-registry landing plan：`docs/20260531-download-empty-registry-implementation-plan.md`
- Landing page flow decision (pm-11)：`docs/20260529-reverse-utm-download-landing-page-flow-decision.md`
- Landing page schema preanalysis (pm-16)：`docs/20260529-download-landing-page-schema-preanalysis.md`
- Landing page admin model preanalysis (pm-12)：`docs/20260529-download-landing-page-admin-model-preanalysis.md`
- preview-url-risk policy：`docs/20260530-download-fileurl-preview-url-risk-policy.md`
- Governing policy：CLAUDE.md §3.2 / §13 / §16.4 / §21 / §23 / §27 / §29
- Source of truth at HEAD `dcd0356`：
  - `src/scripts/load-settings.js`（registry read-only loader, Phase 20260601-pm-11）
  - `src/scripts/load-posts.js`（contentKind + sourceCollection 邏輯）
  - `src/scripts/parse-markdown.js`（body render；不涉 download）
  - `src/scripts/build-github.js`（lines 297–307 `seo.indexing` → `seo.robots`；lines 304–307 contentKind=download fallback noindex）
  - `src/scripts/build-blogger.js`（line 452 `download: post.download ?? null`）
  - `src/scripts/build-sitemap.js`（lines 125–130 `noindex-*` 排除）
  - `src/scripts/validate-content.js`（D1 / D2 / D3 / S / Option 6 / Option A / R1 / R2 / R5b cascade）
  - `src/views/pages/post-detail.ejs`（lines 97–122 download box render）
  - `src/views/blogger/blogger-post-full.ejs`（lines 81–95 download box render）
  - `content/settings/download-assets.json` / `download-forms.json`（empty registries）
- Active production download draft：`content/blogger/posts/20260529-phonics-practice-sheet-download.md`（status = draft；fileUrl: ""；無 assetRefs / formRef）
- Download template：`content/templates/blogger-download-template.md`（無 assetRefs / formRef；fileUrl: ""）
- R2 / R5b fixtures：
  - `content/validation-fixtures/blogger/posts/_test-download-asset-ref-not-found.md`
  - `content/validation-fixtures/blogger/posts/_test-download-form-ref-not-found.md`
  - `content/validation-fixtures/blogger/posts/_test-download-asset-ref-duplicate.md`
