# Gated download funnel architecture spec lock（docs-only）

- Phase id：`20260624-night-gated-download-funnel-spec-lock-a`
- 日期：2026-06-24（Asia/Taipei）
- 類型：**docs-only spec lock**（不改 source / content / settings / build / deploy / generated HTML / Blogger live / CLAUDE.md / MEMORY.md / memory/）
- frozen baseline：`main @ 6790357`（HEAD == origin/main，ahead/behind 0/0，working tree clean，`.git/index.lock` absent）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）、J（SEO / 索引）、F（GitHub 靜態站 listing / sitemap）、E（Blogger 匯出）、K（GA4 CTA event 命名）
- 前序：
  - `docs/20260624-download-listing-special-page-preflight-spec-lock.md` §2.C / §2.D Slice 3（spec lock；Blogger Google Form gated download `.md` migration 預告）
  - `docs/20260624-special-page-slice1-default-case-warning-record.md`（Slice 1 validator landed）
  - `docs/20260624-special-page-slice2-listing-selector-optin-landing-record.md`（Slice 2 listing selector opt-in landed）

---

## 0. 本文目的與非目的

### 目的

把 Dean 本 session 補充之「indexed entry page → noindex gated download page → post-submit resource」三層 funnel 架構做 **docs-only spec lock**，將平台無關 schema、indexing/sitemap/listings 規則、red lines、page family candidates、template/data split、未來 phase ordering 一次收斂為單一可引用 spec。本文**不**新增欄位、**不**改 selector、**不**改 validator 預設、**不**改任何 production 輸出、**不**啟動任何 source landing。

### 非目的（本 phase 一律不做）

- ❌ 不改 `src/**`（含 build / validator / EJS / Admin / selector / 純函式 helper）
- ❌ 不改 `content/**` / `settings/**` 任何 frontmatter / registry
- ❌ 不改 `package.json` / lockfile / `dist*` / `.cache` / gh-pages
- ❌ 不執行 build / deploy / dev / preview / repost
- ❌ 不動 Blogger live / Google Form / Google Drive / AdSense / GA4 backend / Search Console
- ❌ 不加入 Google Form editor URL / response URL / Drive folder ID / Drive file ID / private token / respondent data 任何敏感字串
- ❌ 不啟動 Admin write path / `--apply` / `dryRun:false`
- ❌ 不改 CLAUDE.md / MEMORY.md / memory/
- ❌ 不啟動 Slice 3 / Slice 4 / Admin write path / source landing
- ❌ 不對既有 production posts 做 listing intent 預先裁定（仍交 Dean 決定）
- ❌ 不改變 §2.D Slice 1 / Slice 2 已 landed 之設計（本文只擴充未來 phase 之 funnel 維度，非重啟）

---

## 1. Dean 本 session 補充要點（input summary）

1. Blogger 下載頁本身 **不要被 indexed**。
2. 原因：希望使用者**先進「前導 / 導流 / SEO landing 頁」**，再點進 gated download page；不希望搜尋流量直接落在 form 上。
3. Blogger 目前已有類似流程：
   - **indexed entry page**：例如「注音字卡介紹頁」，含介紹、圖片、更新紀錄、下載 CTA、AdSense、tags、Article schema。
   - **noindex gated download page**：例如「注音下載頁」/「練練看更新下載頁」，含 Google Form iframe、送出後顯示下載資源或導流按鈕、AdSense、feedback、使用限制。
4. Dean 已**手動從 Blogger 前導頁移除 `display:none` hidden SEO block**；未來系統**不可鼓勵 hidden SEO copy**，應以 **visible summary / FAQ / intro** 取代。
5. 未來下載頁會有多個：
   - 注音下載頁
   - 注音練練看更新頁
   - 數字卡下載頁

   這些 gated download pages 配置格式大致相同；差異由 metadata / data 控制。

---

## 2. Repo evidence（read-only inventory）

### 2.1 既有 schema / selector / validator 邊界

mirror `docs/20260624-download-listing-special-page-preflight-spec-lock.md` §1.2 / §1.3 / §1.4（spec lock 既有；本文不重述全文，僅標記 funnel 相關 reuse 點）：

| funnel 維度 | 既有 schema 可重用（無需新欄位） |
| --- | --- |
| entry page indexing / listing / sitemap | `seo.indexing` / `includeInListings` / `includeInSitemap` / `pageType: article` 或 `pageType: landing` |
| gated download page noindex / listing / sitemap | `seo.indexing: noindex-follow` 或 `noindex-nofollow` / `includeInListings: false` / `includeInSitemap: false` / `pageType: gated_download` |
| Google Form 結構 | `gatedDownload.{mechanism, formEmbedUrl, postSubmitResource}`（**只**這三 key；其他 key 觸發 `page-gated-download-suspicious-field` warning，不 echo value） |
| post-submit resource 類型 | `gatedDownload.postSubmitResource` 列舉值（如 `drive-link` / `external-after-submit`） |
| platform 差異 | `platformPolicy.{github|blogger|future}.{indexing,includeInListings,includeInSitemap,includeInFeeds,canonical,note}` |
| canonical | `canonical` / `primaryPlatform`（既有，CLAUDE.md §21 / §24） |

### 2.2 三條 selector（funnel 行為對應）

mirror Slice 1 + Slice 2 landed：

| selector | entry page 行為 | gated download page 行為 |
| --- | --- | --- |
| robots（`page-type-robots.js`） | 預設 `index, follow`（normal article 路徑） | `pageType: gated_download` → `noindex, follow`（自動，per SP-3） |
| sitemap（`include-in-sitemap.js`） | 預設 include | `noindex-*` → safety 自動 exclude；`includeInSitemap: false` 顯式 exclude |
| listings（`include-in-listings.js`） | 預設 include；`contentKind` 非 download / `pageType` 非 download/gated_download → normal post path | Slice 2 後：`pageType: gated_download` → 預設 exclude；只有 top-level `includeInListings: true` 才 opt-in 回 listing（gated download page 不應 opt-in） |

→ **既有 selector 已涵蓋 funnel 兩端**；本文 funnel spec **不需新增 selector**。

### 2.3 既有 fixture / validator 對應

| fixture | 角色 | gated 兩端對應 |
| --- | --- | --- |
| `content/validation-fixtures/github/posts/_test-page-type-gated-download-valid.md` | gated download 合法樣本 | 完全對應「noindex gated download page」 |
| `_test-page-type-gated-download-indexed.md` | gated download 但顯式 index | warning：`page-gated-download-indexed` |
| `_test-page-type-gated-download-in-listings.md` | gated download 但顯式 in-listings | warning：`page-gated-download-in-listings` |
| `_test-page-gated-download-suspicious-field.md` | gated download 含未授權 key | warning：`page-gated-download-suspicious-field`（不 echo value） |
| `_test-page-gated-download-invalid-type.md` | gated download 非 plain object | warning：`page-gated-download-invalid-type` |
| `_test-gated-download-in-listings-default-trigger.md`（Slice 1 加入） | gated download + `includeInListings` 缺省 | warning：`download-in-listings-default`（Slice 1） |

→ **驗證鏈已備齊**；本文 funnel spec **不需新增 fixture / validator rule**。

### 2.4 既有 GA4 / CTA event 對應

`click_all_download` 已於 `docs/20260623-ga4-d4-data-flow-early-evidence-record.md` §155 列為「download CTA click event present」；屬既有 GA4 event 名。

D4 first-batch custom dimensions（per CLAUDE.md §3a current state）= `link_type` / `provider` / `placement` / `link_label`，已 CLOSED / PASS。

→ entry page → gated page CTA click 之 GA4 命名建議重用 `click_all_download`（既有）；新名 `download_cta_click` 列為候選，待未來 GA4 phase 正式裁定。本文**不**新增 GA4 event；**不**改 Admin / build / event registry。

### 2.5 既有 Blogger 端現況

- Blogger build (`build-blogger.js`) **不**消費 listing / sitemap selector（Blogger 平台自管）。
- Blogger noindex **無法**由系統 inject head；須由作者於 Blogger 後台「搜尋設定 → 自訂 robots 標頭標記」手動設定。
- SP-9c：`copy-helper [14]` / `publish-checklist` 已顯示 effective indexing guidance（含 `platformPolicy.blogger.indexing` 推導值 + 提醒手動 NO INDEX）。
- 既有 Blogger live gated download 頁（注音 / 練練看等）**只活在 Blogger 後台**；repo 內**無**對應 `.md`；其「不被索引」保證**只**存在於 Blogger 後台人工設定。

---

## 3. Funnel model 三層定義（platform-agnostic spec lock）

本節為 funnel spec 之**唯一定義來源**。**所有欄位重用既有 schema**，不新增 schema 欄位；**沿用之 frontmatter 概念示意**屬本文件 lock，未來實作 phase 必須 mirror。

### 3.1 Layer A — indexed entry page / SEO landing page

#### 角色

- 承接搜尋流量（Google / Bing）。
- 放介紹、圖片、更新紀錄、visible summary / FAQ / intro、CTA、Article 或 LearningResource schema、AdSense。
- CTA 指向 layer B（gated download page）。
- 可被 Google index、可進 sitemap、可進 listings。

#### Indexing / sitemap / listings 規則

- `seo.indexing: index`（或省略，預設 index-follow）
- `includeInListings: true`（或省略，預設 include；normal post path 不變）
- `includeInSitemap: true`（或省略，預設 include）
- **不**使用 `pageType: gated_download`
- **不**使用 `display:none` hidden SEO block（per Dean §1.4；以 visible summary / FAQ / intro 取代）

#### 建議 frontmatter（概念示意；屬本文件 lock，無新增欄位）

```yaml
# 概念示意：entry page / SEO landing
pageType: article            # 或 'landing'；二擇一，per 內容意圖
contentKind: post            # 或 'tech-note' / 'life-note' 等；不必為 'download'
seo:
  indexing: index-follow     # 顯式或省略（預設 index）
includeInListings: true      # 顯式 opt-in（或省略仍 default include）
includeInSitemap: true       # 顯式 opt-in（或省略仍 default include）
canonical: ""                # 視合併策略；若同時於 Blogger / GitHub 有版本，顯式指定 canonical
```

#### Funnel role 標記建議（**屬本文件 lock；未來實作 phase 才新增；本 phase 不啟動**）

未來若需要 metadata 層級記錄 funnel 關聯，建議使用以下**概念欄位**（**本文件 lock；未來 phase 啟動前不存在**）：

```yaml
# 概念示意：未來 funnel metadata（本 phase 不啟動，不寫入 repo）
downloadFunnel:
  role: entry                          # 'entry' | 'gated_page' | 'post_submit'
  targetGatedPage: "<slug or URL>"     # entry → gated 關聯
  ctaEventName: "click_all_download"   # GA4 event；重用既有命名；或未來新命名 'download_cta_click'
```

red line：`downloadFunnel.targetGatedPage` 為 **slug 或 public URL only**；**不**接受 Drive folder ID / form response URL / edit URL。

#### CTA / AdSense / SEO 細則

- CTA 須使用顯式可見之 button / link，不得 hidden。
- entry page 可放 AdSense（沿用既有 AdSense partial wiring；不另新增 ad profile）。
- entry page schema：`Article` 或 `LearningResource`（屬內容遷移時手動寫入；不由本 phase 自動推斷）。
- entry page CTA event 建議 GA4 `click_all_download` 或未來 `download_cta_click`（per §2.4）；**不**自動 inject；屬內容寫作端責任。

### 3.2 Layer B — noindex gated download page

#### 角色

- 承接來自 layer A 之 CTA 點擊。
- 放 Google Form public iframe / embed URL；表單送出後顯示下載資源或導流按鈕。
- 不被 Google index、不進 sitemap、不進 listings、不應出現在搜尋結果。
- 使用者**應**由 entry page 進入；URL 可被直接訪問（無法 hard-gate）。
- 可有 AdSense，但**視政策 / 實作要保守**（per `docs/20260612-blogger-adsense-noindex-download-seo-policy-preanalysis.md`；本文不重述）。

#### Indexing / sitemap / listings 規則

- `seo.indexing: noindex-follow`（兩平台共同預設）
- `includeInListings: false`（顯式排除，per Slice 2 後 default 已 exclude；顯式更穩）
- `includeInSitemap: false`（顯式排除；safety 已涵蓋，顯式更穩）
- `pageType: gated_download`
- `platformPolicy.blogger.indexing: noindex-nofollow`（記錄「Blogger 後台已 NO INDEX」之事實）
- `platformPolicy.github.indexing: noindex-nofollow`（合併站亦 noindex）
- `platformPolicy.future.indexing: noindex-nofollow`（預留新網域）

#### 建議 frontmatter（概念示意；mirror `docs/20260624-download-listing-special-page-preflight-spec-lock.md` §2.C；無新增欄位）

```yaml
# 概念示意：gated download page（schema 屬既有 lock，無新增）
pageType: gated_download
contentKind: download              # 體裁仍為 download（與 pageType 正交，per CLAUDE.md §11）
seo:
  indexing: noindex-follow
includeInListings: false           # 顯式排除站內列表
includeInSitemap: false            # 顯式排除 sitemap
gatedDownload:
  mechanism: google-form
  formEmbedUrl: ""                 # public embed URL only；不含 secret / response / Drive folder ID
  postSubmitResource: drive-link   # 列舉值（見 §3.3）
platformPolicy:
  blogger:
    indexing: noindex-nofollow
    includeInListings: false
  github:
    indexing: noindex-nofollow
    includeInListings: false
    includeInSitemap: false
  future:
    indexing: noindex-nofollow
    includeInListings: false
canonical: ""                       # 視合併策略；不可 'auto'
```

#### Funnel role 標記建議（**屬本文件 lock；未來實作 phase 才新增**）

```yaml
# 概念示意：未來 funnel metadata（本 phase 不啟動，不寫入 repo）
downloadFunnel:
  role: gated_page
  entryPages:                      # 反向關聯：哪些 entry 指向本頁
    - "<entry slug 1>"
    - "<entry slug 2>"
```

#### 重要邊界（red lines mirror §2.C 既有 spec lock；不可違反）

- ❌ `gatedDownload` **只**允許 `{mechanism, formEmbedUrl, postSubmitResource}` 三 key；其他 key 觸發 `page-gated-download-suspicious-field`（不 echo value）
- ❌ 不存 Drive folder ID / Drive file ID / OAuth token / API key / form response / respondent data / private permission
- ❌ Google Forms responses **永遠停留在 Google Forms / Sheets**，不進 repo
- ❌ `platformPolicy` 不存 token / secret / credential（SP-8 已對應 warn）
- ❌ 不靠 URL pattern 自動推斷 `pageType` / `contentKind` / `gatedDownload.mechanism`；全部由作者顯式宣告
- ❌ 不得對 gated download page 使用 `display:none` hidden SEO copy
- ❌ **不**允許將 `downloadFunnel.targetGatedPage` 或 `downloadFunnel.entryPages` 填為 Google Drive / Form 私密 URL

### 3.3 Layer C — post-submit resource

#### 角色

- Google Form 送出後之回應頁 / 下載資源 / 導流按鈕。
- 可能為：
  - Drive link（**只**記錄 kind，不記錄真實 ID）
  - external page（已存在之公開 URL）
  - confirmation message + 後續導流按鈕
- **不**屬 repo 之公開可索引內容；不獨立為一個 `.md`。

#### Schema 邊界

- repo 端**只**記錄 `gatedDownload.postSubmitResource` 之**列舉值**，**不**記錄真實連結 / ID / token。
- 列舉值建議（屬本文件 lock；未來實作 phase 可擴充；無 secret）：

| 列舉值 | 語意 |
| --- | --- |
| `drive-link` | Google Drive 公開連結；真實 URL 由 Form 設定，**不**進 repo |
| `external-after-submit` | 送出後導流到外部頁面（如其他 Blogger 文章 / GitHub 站文章） |
| `confirmation-only` | 僅顯示確認訊息；無下載 / 無導流 |
| `inline-resource` | Form 內建 confirmation 顯示 resource hint（非公開連結） |

#### red lines（mirror §3.2）

- ❌ 真實 Drive folder ID / file ID / OAuth token / API key / form response URL / edit URL / respondent data **永遠不進 repo**
- ❌ 不獨立為一個 `.md`（避免誤入 sitemap / listing）
- ❌ 不存 respondent identifying information（Email / IP / name）

---

## 4. Page family candidates（未來 gated page 至少三個）

per Dean §1.5，未來 gated download pages 包含至少：

| # | 中文名 | entry page（layer A） | gated page（layer B） | role | expected indexing |
| --- | --- | --- | --- | --- | --- |
| 1 | 注音下載頁 | 注音字卡介紹 / 前導頁 | 注音教具下載申請表 | `gated_download` | `noindex-follow`（GitHub）/ `noindex-nofollow`（Blogger 推薦） |
| 2 | 注音練練看更新頁 | 注音練練看介紹 / 更新頁 | 注音練練看下載更新申請表 | `gated_download` | `noindex-follow`（GitHub）/ `noindex-nofollow`（Blogger 推薦） |
| 3 | 數字卡下載頁 | 數字卡 / 數字太空篇介紹頁 | 數字卡下載申請表 | `gated_download` | `noindex-follow`（GitHub）/ `noindex-nofollow`（Blogger 推薦） |

#### Family 共用設計（屬本文件 lock）

- **共用同一個 gated download template / ad profile / form section layout**；差異**只**由 metadata / data 控制（slug / title / subtitle / intro / images / features / formEmbedUrl / postSubmitActions / entryPageSlugs / adProfile / policy）。
- AdSense 規則：**不**在每篇內文散落 6 段 raw script；長期應**共用 shared ad profile**（暫名 `blogger_download_gated_v1`，per §5.3）；既有 Blogger live 頁可維持手動，直到統一 migration phase。
- 三 family 之 entry page 設計可不同（內容 / 圖片 / 介紹各異），但 layer B 共用 template + adProfile + form section layout。

---

## 5. Template / data split proposal（未來模板拆分；本 phase 不做 source）

### 5.1 Shared template blocks（可重用之 EJS partial 概念）

未來實作 phase 落地時可拆分以下 block；本 phase **不**新增 EJS、**不**改 view：

| Block | 角色 | 屬於 layer |
| --- | --- | --- |
| `resourceHeader` | 標題 / 摘要 / cover | A / B |
| `showcaseImages` | 圖片畫廊 | A |
| `features` | 功能 / 規格列點 | A |
| `formHeading` | 表單前說明 | B |
| `googleFormIframe` | iframe embed | B |
| `postSubmitActions` | 送出後顯示之 button / link 群組 | B |
| `feedbackBox` | 留言 / 反饋區塊 | B |
| `footerNotice` | 使用限制 / 授權說明 | A / B |
| `adjustIframe` | JS-side iframe resize 行為 | B |
| `gaCTAEvents` | GA4 CTA / form event 注入 hook | A / B |
| Ad placements 1–6 | 共用 adProfile（如 `blogger_download_gated_v1`） | A / B（保守） |

### 5.2 Metadata / data fields（mirror §3 lock；無新欄位）

驅動上述 block 之資料來源（屬既有 schema 或本文件 lock 之 funnel metadata）：

| Field | 來源 | 用途 |
| --- | --- | --- |
| `slug` | 既有 | URL slug |
| `title` / `subtitle` / `intro` | 既有 | header |
| `images` | 既有（CLAUDE.md §22） | showcase |
| `features` | 未來 implementation phase 新增（如有需求；屬另一 spec） | feature list |
| `gatedDownload.formEmbedUrl` | 既有 | iframe URL |
| `gatedDownload.postSubmitResource` | 既有 | 列舉值 |
| `postSubmitActions` | 未來 implementation phase（屬另一 spec；本文件 lock 不新增） | 送出後 button data |
| `downloadFunnel.entryPages` | 未來 funnel metadata（本文件 lock；§3.2 概念示意） | 反向關聯 |
| `downloadFunnel.targetGatedPage` | 未來 funnel metadata（本文件 lock；§3.1 概念示意） | 正向關聯 |
| `adProfile` | 未來 ad profile spec（本文件**未**lock 細節） | 共用 ad placement |
| `seo.indexing` / `includeInListings` / `includeInSitemap` / `platformPolicy` | 既有 | policy |

### 5.3 AdSense 規則邊界

per CLAUDE.md 既有 + `docs/20260612-blogger-adsense-noindex-download-seo-policy-preanalysis.md`：

- ❌ **不**在每篇內文散落 6 段 raw `<script>` 寫死 client / slot id
- ❌ **不**將 AdSense `client id` / `slot id` 寫入 `docs/` / `CLAUDE.md` / `src/` / `views/` / `tests/` / `package.json` / 任何 frontmatter / 任何 ledger（red line 既有）
- ✅ 長期應共用 shared adProfile（暫名 `blogger_download_gated_v1`；本文件**只**lock 命名概念，**不**新增 ad profile registry）
- ✅ 既有 Blogger live 頁可維持手動，直到統一 migration phase（屬另開 phase）

---

## 6. SEO / indexing rules（funnel 三層綜合鎖）

| Layer | 平台 | robots | sitemap | listings | 註 |
| --- | --- | --- | --- | --- | --- |
| A entry page | GitHub Pages | `index, follow`（預設） | include（預設） | include（預設 normal post） | normal Article schema |
| A entry page | Blogger | 預設 index（Blogger 後台不額外 noindex） | n/a（Blogger 平台自管） | n/a | manual posting |
| B gated download page | GitHub Pages | `noindex, follow`（pageType 推導 + 顯式 `seo.indexing`） | excluded（safety + 顯式 false） | excluded（Slice 2 default-exclude + 顯式 false） | 不應顯示 |
| B gated download page | Blogger | 須**作者於 Blogger 後台手動設定** `noindex` | n/a | n/a | SP-9c guidance 提醒 |
| C post-submit | n/a | n/a（不為公開 page） | n/a | n/a | 不獨立為 `.md` |

#### Hidden SEO copy rule（per Dean §1.4）

- ❌ **不得**使用 `display:none` / `visibility: hidden` / off-screen positioning 等手段藏 SEO copy
- ✅ 應以 **visible summary / FAQ / intro** 取代
- 未來實作 phase 可在 entry page template 提供 visible summary partial（屬另開 spec）

#### URL accessibility note

- noindex gated pages 仍可被 URL 直接訪問；只是**不**透過 sitemap / listings / search result 被發現
- 系統**無法**阻止 URL 分享；hard-gate 屬 Google Form 端責任

---

## 7. Future source phases（不啟動；只列標籤；每片獨立 phase + Dean explicit approval）

mirror `docs/20260624-download-listing-special-page-preflight-spec-lock.md` §6 + Slice 1 / Slice 2 closeout 之候選；本文擴充 funnel 維度：

| # | label | 範圍 | 風險 | 前置 |
| --- | --- | --- | --- | --- |
| F1 | `20260XXX-funnel-metadata-schema-preflight-a` | `downloadFunnel.{role, targetGatedPage, entryPages, ctaEventName}` schema preflight + validator spec | 🟢 docs-only | 本 spec lock |
| F2 | `20260XXX-gated-download-page-template-preflight-a` | 拆分 §5.1 block 之 template preflight；只 spec，不寫 EJS | 🟢 docs-only | F1 |
| F3 | `20260XXX-blogger-gated-download-md-migration-注音-a` | 注音下載頁 `.md` 內容遷移（per §4 #1）；無 source；secret preflight 必要 | 🟢 內容遷移 | Dean 提供內容 + secret preflight 確認 |
| F4 | `20260XXX-blogger-gated-download-md-migration-練練看-a` | 注音練練看更新頁 `.md` 內容遷移（per §4 #2） | 🟢 內容遷移 | Dean 提供內容 |
| F5 | `20260XXX-blogger-gated-download-md-migration-數字卡-a` | 數字卡下載頁 `.md` 內容遷移（per §4 #3） | 🟢 內容遷移 | Dean 提供內容 |
| F6 | `20260XXX-entry-page-cta-metadata-migration-a` | entry page CTA → gated page 之 `downloadFunnel.targetGatedPage` backfill | 🟡 行為 / metadata 變動 | F1 + F3/F4/F5 至少一個 |
| F7 | `20260XXX-ga4-event-normalization-entry-gated-postsubmit-a` | GA4 event 標準化（`click_all_download` vs `download_cta_click` 統一；form submit event） | 🟡 GA4 改動須獨立 phase | GA4 dashboard observation phase |
| F8 | `20260XXX-admin-readonly-funnel-fields-a` | Admin read-only 顯示 funnel role / target / entryPages | 🟢 Admin read-only | F1 |
| F9 | `20260XXX-admin-write-path-funnel-fields-*` | Admin write path（Apply / dryRun:false）寫入 funnel 欄位 | 🔴 高（Admin write path dormant） | Admin write path 解 dormant；屬另開 governance phase |

實際日期前綴以落地當日為準；本 phase **不**預先佔位、**不**啟動任一。

---

## 8. 本 phase 明確非動作（non-actions）

| # | 項目 | 狀態 |
| --- | --- | --- |
| 1 | 不改 `src/**`（含 build / validator / EJS / Admin / selector / 純函式 helper） | ✅ 未動 |
| 2 | 不改 `content/**` / `settings/**` 任何 frontmatter / registry | ✅ 未動 |
| 3 | 不改 sitemap.xml / robots.txt / robots meta（線上效果） | ✅ 未動 |
| 4 | 不改 `package.json` / lockfile / `dist*` / `.cache` / gh-pages | ✅ 未動 |
| 5 | 不執行 build / deploy / preview / repost / dev server | ✅ 未執行 |
| 6 | 不動 Blogger / AdSense / GA4 / Drive / Search Console / Google Form 後台 | ✅ 未動 |
| 7 | 不啟動 §7 任一 future phase 之 source / 內容遷移 | ✅ 僅 spec 標籤 |
| 8 | 不改 CLAUDE.md / MEMORY.md / memory/ | ✅ 未動 |
| 9 | 不重啟 SP-9b / SP-9e；不新開 SP-9 子系列 | ✅ 未動 |
| 10 | 不對既有 production posts 之 listing intent / funnel role 預先裁定 | ✅ 仍交 Dean 決定 |
| 11 | 不加入任何 Google Form editor URL / response URL / Drive folder ID / Drive file ID / token / respondent data | ✅ 未動 |
| 12 | 不啟動 Slice 3 content migration | ✅ 未動（屬 F3–F5 各自獨立 phase） |
| 13 | 不啟動 Slice 4 / Admin write path / `--apply` / `dryRun:false` | ✅ 未動 |
| 14 | 僅新增本 1 個 docs 檔 | ✅ |

---

## 9. Read-only commands executed（本 phase）

```text
pwd
git status --short
git branch --show-current
git rev-parse HEAD                     # → 67903578641a2fbd1ea725c9aa52f7fdf8f76133
git rev-parse origin/main              # → 同上
git log -1 --oneline                   # → 6790357 chore(listings): require opt-in for download special pages
git rev-list --left-right --count origin/main...HEAD   # → 0	0
ls .git/index.lock                     # → No such file or directory

Read（read-only）：
  docs/20260624-download-listing-special-page-preflight-spec-lock.md
  docs/20260624-special-page-slice1-default-case-warning-record.md
  docs/20260624-special-page-slice2-listing-selector-optin-landing-record.md
  content/validation-fixtures/github/posts/_test-page-type-gated-download-valid.md

Grep（read-only）：
  gated_download / gatedDownload / formEmbedUrl / postSubmitResource → 40 files
  click_all_download / download_cta_click / click_other_link → 43 files
  pageType: / pageType === → 25 files
  downloadFunnel / funnel.role / entryPages → 3 files（spec lock 既已預告）
  Google Form / google.form / Drive / drive. → 20 files
  click_all_download in *.md → confirmed at docs/20260623-ga4-d4-data-flow-early-evidence-record.md:155

ls docs/20260624-gated-download-funnel-spec-lock.md → No such file or directory（本 phase 將新增此檔）
```

---

## 10. Final state（本 phase 完成時）

- ✅ 新增 docs-only spec lock 1 個：`docs/20260624-gated-download-funnel-spec-lock.md`（本檔）
- ✅ **完全無 source changes**（src / views / scripts / content / settings / package / lockfile / dist / gh-pages / .cache / generated HTML / CLAUDE.md / MEMORY.md 一律未動）
- ✅ **無 Admin / backend / GA4 / Blogger / AdSense / Search Console / Drive / Google Form / deploy changes**
- ✅ validation baseline 不變：0 / 133 / 105（per Slice 2 後 CLAUDE.md §3a snapshot；本 phase 未跑 validate）
- ✅ HEAD = origin/main = `6790357` →（commit 後將更新）；ahead/behind 預期 push 後 0/0；working tree clean

---

## 11. Recommended next phase（不啟動；只標籤）

- **保守路徑（建議）= idle freeze**。本 spec lock 不觸發任何後續動作；待 Dean 決定。
- 若 Dean 決定推進，建議候選順序為 §7 順序（F1 → F2 → F3/F4/F5 → F6 → F7 → F8 → F9）；每片獨立 phase + explicit approval。

---

## 12. Cross-links

- `docs/20260624-download-listing-special-page-preflight-spec-lock.md`（直接前序；§2.C / §2.D Slice 3）
- `docs/20260624-special-page-slice1-default-case-warning-record.md`（Slice 1 validator landed）
- `docs/20260624-special-page-slice2-listing-selector-optin-landing-record.md`（Slice 2 listing selector opt-in landed）
- `docs/20260624-sp-download-include-in-listings-opt-in-preanalysis.md`（listing opt-in preanalysis）
- `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1 平台無關架構提案）
- `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2 schema lock）
- `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3 robots precedence）
- `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a listing wiring）
- `docs/20260623-pm-sp5a-include-in-sitemap-selector-wiring.md`（SP-5a sitemap wiring）
- `docs/20260623-pm-sp8-platform-policy-shape-validator.md`（SP-8 shape lock）
- `docs/20260624-am-sp9a-platform-policy-effective-derive-helper.md`（SP-9a display-only helper）
- `docs/20260624-sp9c-blogger-platform-policy-operator-guidance.md`（SP-9c Blogger guidance）
- `docs/20260612-blogger-adsense-noindex-download-seo-policy-preanalysis.md`（download / noindex 與 AdSense 政策邊界）
- `docs/seo-indexing-rules.md`（SEO indexing 規則總則）
- `docs/20260623-ga4-d4-data-flow-early-evidence-record.md`（既有 `click_all_download` event 出處）
- `CLAUDE.md` §11 / §13 / §15–§17 / §21 / §23 / §24 / §29

（本文件結束）
