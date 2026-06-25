# downloadFunnel — production content input packet（docs-only operator intake）

- Phase id：`20260627-funnel-production-content-input-packet-docs-only-a`
- 日期：2026-06-27（Asia/Taipei）
- 類型：**docs-only operator intake packet**（placeholder-only 填空清單；**不**實作 validator logic、**不**新增 fixture、**不** baseline bump、**不**碰 production content、**不**碰 live service、**不**做 source landing、**不**啟動 pair landing）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）。**不**影響 B / C / E / F / J / K / L 任何 source 或 production content。
- 授權：Dean explicit approval（本 phase scope 限定 docs-only operator intake，唯一新增本檔）
- 性質：承接 `docs/20260626-funnel-production-migration-readiness-map-docs-only.md`（§4.1 C-1/C-2 內容 spec 🔴、§4.3 G-1/G-2 Form/Drive 🔴）、`docs/20260626-indexed-entry-page-metadata-content-preflight-a.md`（layer A 作者 checklist）與 `docs/20260627-gated-download-page-metadata-content-preflight-docs-only-a.md`（layer B 作者 checklist）。現有三份 docs 皆為 **analyst-facing**（條件 / 風險 / 盲點）；本文補上唯一缺口 —— **operator-facing 填空式 intake**：把「Dean 未來實際遷移前須親手準備之內容素材與外部資源狀態」收斂成一張可勾選 / 可填空的清單。**本文一律 placeholder，不放任何真實內容 / URL / token / Drive ID / respondent data。**

---

## 1. Baseline verification 摘要

進場 baseline（read-only，未跑任何 validation / build / script）：

| 檢查 | 結果 |
| --- | --- |
| `git status --short` | （空）clean ✅ |
| `git status --branch --short` | `## main...origin/main`（無 ahead/behind 標記）✅ |
| `git rev-parse --abbrev-ref HEAD` | `main` ✅ |
| `git rev-parse HEAD` | `2a66231d2d3ebe95f3eeb3e0f0f37254f38288bb`（`2a66231`）✅ |
| `git rev-parse origin/main` | `2a66231…` ✅ |
| HEAD == origin/main == `2a66231d2d3ebe95f3eeb3e0f0f37254f38288bb` | ✅ |
| ahead / behind | `0 / 0` ✅ |
| `.git/index.lock` | 不存在 ✅ |
| `git log --oneline -10` top subject | `docs(download): preflight gated download page metadata` ✅ |

起點 subject 與要求一致；working tree clean；可安全進行 docs-only operator intake。

---

## 2. Sealed state + production trigger = 0 摘要

downloadFunnel validator（`src/scripts/validate-content.js`）已 landed slices（皆 warning-only / no-value-echo / additive / 0 production trigger）：F2（structural / role-enum / suspicious-field + §5.2 required-combo）、F4（role↔policy）、F6（role↔robots-safety）、F7（private-value heuristic）、F8（bidirectional reciprocity）。

fixture corpus（5 個 `.md`，全 placeholder）：group1 valid pair（0 warning，未 bump）、group2 dangling + absolute-URL（deferred-silent，0 warning，未 bump）、group3 scanned invalid（恰 1 warning，已 bump）。

validation baseline（carry-forward，本 phase 不變動、未跑任何 script）：

| 指令 | 結果 |
| --- | --- |
| `validate:content` | 0 / 134 / 106 |
| `report:validation` | 0 / 134 / 106 |
| overlay | 0 / 141 / 107 |
| `check-page-type-validator` | 103 / 0 |
| `check:validation-report` | 27 / 0 |
| production downloadFunnel trigger | **0** |

read-only grep（`downloadFunnel` 掃 `content/**/posts/**/*.md`）命中 5 檔，**全部**位於 `content/validation-fixtures/github/posts/`；**無**任何 production post 含 `downloadFunnel`。→ **production downloadFunnel trigger = 0 屬實。**

---

## 3. 本 packet 的定位（scope note）

- ✅ 本文 = **operator intake**：列出 Dean 未來要準備什麼、目前準備到哪、外部資源狀態，**全 placeholder**。
- ❌ **不是 production content migration**：本文不新增任何 production `.md`、不寫任何真實文案。
- ❌ **不是 pair landing**：不落地 entry/gated pair、不觸發 reciprocity。
- ❌ **不是 source landing**：不改任何 validator / script / helper。
- 填寫方式：Dean 於未來實際備料時，把每個 `[ ]` 勾起、把 `<…placeholder…>` 換成真實內容（真實內容**寫在草稿區 / Google 端，不一定進 repo**；真實 Form/Drive 連結**永不**進 repo，見 §6 / §7 / §10）。

---

## 4. Layer A — indexed entry page 素材（Dean 需準備）

對應 readiness map C-2（🔴 hard prerequisite）+ entry preflight（`docs/20260626-indexed-entry-page-metadata-content-preflight-a.md`）E-1…E-9。**全 placeholder。**

| # | 素材項目 | placeholder | 就緒 | 備註 |
| --- | --- | --- | --- | --- |
| A-1 | entry page title | `<entry page title placeholder>` | [ ] | 對應 frontmatter `title` |
| A-2 | intro / summary | `<intro / summary placeholder>` | [ ] | **必須 visible**（不得 hidden SEO copy；spec-lock §1.4 / §6） |
| A-3 | image / visual asset readiness | `<image or visual asset readiness placeholder>` | [ ] | 只記就緒狀態；圖片不由系統自動上傳（CLAUDE.md §22） |
| A-4 | update log | `<update log placeholder>` | [ ] | 可見更新紀錄 |
| A-5 | CTA copy | `<CTA copy placeholder>` | [ ] | 顯式可見 button / link，指向 gated page（不得 hidden） |
| A-6 | target gated page slug | `<target gated page slug placeholder>` | [ ] | 填 simple slug；對應 `downloadFunnel.targetGatedPage`（見 §8） |
| A-7 | canonical / future merged-domain decision | `<canonical / future merged domain decision placeholder>` | [ ] | 開放決策，未裁定（entry preflight §7；本文不裁定） |

---

## 5. Layer B — noindex gated download page 素材（Dean 需準備）

對應 readiness map C-1（🔴 hard prerequisite）+ gated preflight（`docs/20260627-gated-download-page-metadata-content-preflight-docs-only-a.md`）G-1…G-12。**全 placeholder。**

| # | 素材項目 | placeholder | 就緒 | 備註 |
| --- | --- | --- | --- | --- |
| B-1 | gated page title | `<gated page title placeholder>` | [ ] | 對應 frontmatter `title` |
| B-2 | form intro copy | `<form intro copy placeholder>` | [ ] | Form 前說明 |
| B-3 | usage restriction copy | `<usage restriction copy placeholder>` | [ ] | 使用限制（個人 / 家庭 / 教學；不得轉售，CLAUDE.md §13） |
| B-4 | feedback / support copy | `<feedback / support copy placeholder>` | [ ] | 回饋 / 支援文案 |
| B-5 | post-submit display copy | `<post-submit display copy placeholder>` | [ ] | 送出後顯示文案（顯示用，不含真實資源連結） |
| B-6 | entry page slug list | `<entry page slug list placeholder>` | [ ] | 哪些 entry 指向本頁；對應 `downloadFunnel.entryPages[]`（見 §8） |

---

## 6. Google Form readiness section

對應 readiness map G-1（🔴）。**只記就緒狀態與非敏感標題；真實連結不進 repo。**

| # | 項目 | placeholder | 就緒 | 備註 |
| --- | --- | --- | --- | --- |
| F-1 | public embed availability status | `<public embed availability status placeholder>` | [ ] | 只記「public embed 是否就緒」狀態 |
| F-2 | form title | `<form title placeholder>` | [ ] | 非敏感標題 |
| F-3 | `gatedDownload.formEmbedUrl` 來源 | `<public embed url placeholder — fill at migration only>` | [ ] | 遷移當下才填 **public embed URL**（唯一可入 repo 之 Form 連結） |

🔴 **red line（Form）**：

- ❌ **do not include real Form URL**（本 packet 不放真實連結）
- ❌ **do not include edit URL**（Form edit URL 永不進 repo）
- ❌ **do not include response URL**（Form response URL 永不進 repo）
- ❌ Google Forms responses **永遠**停留在 Google Forms / Sheets，不進 repo

---

## 7. Google Drive / resource readiness section

對應 readiness map G-2（🔴）。**只記就緒狀態與列舉值；真實 Drive 連結不進 repo。**

| # | 項目 | placeholder | 就緒 | 備註 |
| --- | --- | --- | --- | --- |
| D-1 | file readiness status | `<file readiness status placeholder>` | [ ] | 只記「post-submit 資源是否就緒」狀態 |
| D-2 | resource type | `<resource type placeholder>` | [ ] | 資源類型描述（非連結） |
| D-3 | `postSubmitResource` enum | `<postSubmitResource enum placeholder — one of: drive-link / external-after-submit / confirmation-only / inline-resource>` | [ ] | **只**填列舉值（spec-lock §3.3） |

🔴 **red line（Drive / resource）**：

- ❌ **do not include real Drive ID**（Drive folder ID / file ID 永不進 repo）
- ❌ **do not include real Drive URL**
- ❌ **do not include token or respondent data**（OAuth token / API key / Email / IP / name 永不進 repo）
- ✅ 真實 post-submit 資源連結由 Dean 於 Google Form 端設定，repo 端**只**記 `postSubmitResource` 列舉值

---

## 8. Slug and reciprocity pairing section

對應 readiness map C-3（🟡）+ F8 bidirectional reciprocity。**只填 simple slug placeholder。**

| # | 項目 | placeholder | 備註 |
| --- | --- | --- | --- |
| S-1 | entry slug | `<entry slug placeholder>` | simple slug |
| S-2 | gated slug | `<gated slug placeholder>` | simple slug |
| S-3 | entry `downloadFunnel.targetGatedPage` | `<entry targetGatedPage placeholder = gated slug>` | 須等於 S-2 |
| S-4 | gated `downloadFunnel.entryPages[]` | `<gated entryPages placeholder = [entry slug, ...]>` | 須列回 S-1 |

⚠️ **note**：**real pair landing should happen together later** —— entry + gated 建議於**同一 commit** 落地，使兩端 slug 立即互相可解析 → F8 reciprocity 0 warning（mirror group 1 valid pair sealed 行為；readiness map §5.1）。本 packet **不**落地 pair、**不**填真實 slug。`targetGatedPage` / `entryPages[]` 一律 simple slug 或 public URL，**不得**填 Drive / Form 私密 URL（否則 F7 private-value warn）。

---

## 9. Per-family grouping section

對應 spec-lock §4 page family。**三 family 各自獨立 pair landing phase，不混批。**

| # | family | placeholder | 備註 |
| --- | --- | --- | --- |
| P-1 | 注音字卡 family | `<phonics family placeholder>` | 獨立 pair landing phase |
| P-2 | 練練看（practice worksheet）family | `<practice worksheet family placeholder>` | 獨立 pair landing phase |
| P-3 | 數字卡（number cards）family | `<number cards family placeholder>` | 獨立 pair landing phase |

⚠️ **do not mix families in one landing phase**（spec-lock §4；readiness map §5.1 #4）—— 每個 family 各自為獨立 pair landing phase，不可混批。

---

## 10. Red-line checklist

本 packet 全程遵守，未來填寫亦須遵守：

- ✅ **placeholder only**
- ❌ **no real Google Form URL**（embed / edit / response 一律不放；唯 public embed 於遷移當下才填入 gated `.md`）
- ❌ **no real Google Drive ID or URL**
- ❌ **no token**
- ❌ **no secret**
- ❌ **no respondent data**（Email / IP / name 永留 Google 端）
- ❌ **no live service access**（Blogger / Google Form / Google Drive / GA4 backend / AdSense / Search Console 皆不碰）
- ❌ **no Admin write path**

---

## 11. Cross-links

- `docs/20260626-funnel-production-migration-readiness-map-docs-only.md`（readiness map；§4 前置 / §5 migration order / §6 A deferred）
- `docs/20260626-indexed-entry-page-metadata-content-preflight-a.md`（entry preflight，layer A）
- `docs/20260627-gated-download-page-metadata-content-preflight-docs-only-a.md`（gated preflight，layer B）
- `docs/20260624-gated-download-funnel-spec-lock.md`（spec-lock，funnel 唯一定義來源）
- `docs/20260625-funnel-dangling-absolute-url-source-preflight-a.md`（dangling / absolute-URL deferred-silent 行為盤點）
- group 1 valid entry/gated fixtures：`content/validation-fixtures/github/posts/_test-download-funnel-valid-entry.md` / `_test-download-funnel-valid-gated-page.md`
- `src/scripts/validate-content.js`（`normalizeFunnelRef` / `looksLikePrivateFunnelLink` / bidirectional block / F2 required-combo / F4 / F6）
- `src/scripts/check-validation-report.js`（C5 / C6 / C7 / B6 / B7 locks）
- `CLAUDE.md` §3a / §11 / §13 / §16 / §21 / §22 / §24

---

## 12. 明確 deferred（本 phase 一律不做）

- ❌ **no source change**（`validate-content.js` / `check-validation-report.js` / 任何 src / scripts / helpers / EJS / selector 未動）
- ❌ **no fixture change**（5 個 funnel fixture 未增未改）
- ❌ **no baseline bump**（未跑 `validate:content` / `report:validation` / `check:*` / 任何 script）
- ❌ **no production content migration**（無 production `.md` 新增 `downloadFunnel` / entry / gated 內容）
- ❌ **no pair landing** / **no entry/gated production content**
- ❌ **no live Blogger / Google Form / Google Drive / GA4 backend / AdSense / Search Console / Admin write path**
- ❌ **A source landing remains deferred**（`20260626-funnel-dangling-target-not-found-warning-source-landing-a`；readiness map §6 A-1…A-5 未達）
- ❌ 未寫入真實 Drive ID / Form URL / token / secret / respondent data（全 placeholder）
- ❌ 未改 `CLAUDE.md`（含 §3a prose SHA cosmetic lag）/ `MEMORY.md` / `memory/`
- ❌ 未改 settings / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages / .cache / generated HTML
- ❌ 未 build / deploy / dev server / preview / repost
- ❌ 未 rebase / amend / force-push
- ❌ 未執行任何 slash command

---

`VERDICT: DOCS-ONLY INPUT PACKET LANDED`
`PLACEHOLDER ONLY`
`A SOURCE LANDING REMAINS DEFERRED`
`NO SOURCE / FIXTURE / BASELINE CHANGE`
`NO PRODUCTION CONTENT / LIVE SERVICE CHANGE`
`READY FOR IDLE FREEZE`

---

## 13. 2026-06-25 update — Dean 補充素材紀錄（append-only）

> 本節 append 自 **2026-06-25 21:12 Asia/Taipei**。phase id：`20260625-night-funnel-production-input-packet-fill-from-dean-material-a`。Dean 於 ChatGPT 對話中補充「Blogger 現有下載 / 特殊頁素材」之概念材料。本節 **docs-only**：不改 source、不改 fixture、不改 settings、不動 production content、不動 live service、不 baseline bump、不 pair landing、不 source landing。原 §1–§12 placeholder 模板**保持不動**（仍為未來 GitHub / new-domain 遷移用之填空樣板）；現有 Blogger funnel 之真實 public URL 與素材狀態紀錄於本節（§14 起）獨立保存。
>
> 收錄原則：**只記 public 可公開資訊 + 概念模型**；Form / Drive 後端 / 真實檔案連結 / token / respondent data 一律不入 repo（沿用 §10 red lines）。所有外部資源狀態用 cautious wording（`existing_assumed_needs_manual_verify` / `yes_assumed_needs_manual_check` / `content_not_provided_yet` / `future_possible_not_active` / `deferred`），**不**主張任何 backend 驗證。

---

## 14. Existing Blogger Bopomofo funnel — production reference example

Dean 確認：**目前真實的 download funnel 僅存在於 Blogger**。GitHub / new-domain 未來可能新增，但**當前未啟動**（見 §16）。下表記錄之 URL 與 search description 屬 Blogger 公開可見資訊；**不**屬 secret / private、可入 repo。

### 14.1 Layer A — existing indexed entry page

| # | 項目 | 值 / 狀態 |
| --- | --- | --- |
| L14A-1 | 標題 | `ㄅㄆㄇ注音符號下載Bopomofo(練練看)` |
| L14A-2 | URL（Blogger public） | `https://babel-lab.blogspot.com/2022/11/learning-cards-of-mandarin-phonetic-symbols-bopomofo-practice.html` |
| L14A-3 | Blogger search description | `免費下載 17 張ㄅㄆㄇ注音符號練習卡！適合幼兒園小朋友、海外華語學習與雙語家庭練習注音、塗塗看與連連看。提供高品質 A4 / A3 尺寸圖檔，助於孩子幼小銜接，歡迎海外僑胞與自學家庭下載分享。` |
| L14A-4 | role | `standard_download_entry`（§17.2） |
| L14A-5 | expected indexing | `index_follow` |
| L14A-6 | expected sitemap | `includeInSitemap: true` |
| L14A-7 | expected listings | `includeInListings: true` |
| L14A-8 | layout | `regular_article_like`（含 AdSense / hashtags / JS-DL · GA tracking onclick events） |
| L14A-9 | downloadTargets | 1 primary（§15.1）+ 1 optional update（§15.2） |

用途定位：public SEO / indexed 資源介紹頁。說明資源價值、預覽圖、更新紀錄、使用情境、AdSense 區塊、相關資源、schema、hashtags 與 CTA。**不應**被當成 hidden / gated 頁面。未來內容可變動，但 AdSense 配置原則上維持穩定（見 §18）。

### 14.2 Layer B — existing primary gated download page

| # | 項目 | 值 / 狀態 |
| --- | --- | --- |
| L14B-1 | 標題 | `注音教具 PDF 下載 - 幼兒注音符號筆順練習字卡（免費資源）` |
| L14B-2 | URL（Blogger public） | `https://babel-lab.blogspot.com/p/pdf.html` |
| L14B-3 | Blogger search description | `提供免費注音符號教具 PDF 下載，包含 37 個注音符號筆順練習與可愛字卡，適合家長在家教學與國小一年級輔助教材，立即填表免費索取。Free Bopomofo (Zhuyin) Writing Practice Sheets & Flashcards PDF.` |
| L14B-4 | role | `gated_download`（§17.3） |
| L14B-5 | expected indexing | `noindex_follow` |
| L14B-6 | expected sitemap | `includeInSitemap: false` |
| L14B-7 | expected listings | `includeInListings: false` |
| L14B-8 | Google Form 狀態 | `embedded_existing`；`public_embed_ready: yes_assumed_needs_manual_check` |
| L14B-9 | Drive / 資源狀態 | `existing_assumed_needs_manual_verify`（HTML 不可見實際下載連結；須人工驗證） |
| L14B-10 | 下載交付 | `shown_after_google_form_submit` |
| L14B-11 | AdSense | present；非經明確核准不得調整版位（沿用 §18） |

用途定位：使用者由 entry page 進入。頁面嵌入 Google Form；表單送出後始顯示 Drive 資源 / 連結。Blogger HTML 不暴露實際 Drive 連結，因此須**人工驗證**才能確認當前 Form 流程仍正常運作；本文**不**主張 backend 驗證已通過。

---

## 15. Primary vs optional update download target — 模型澄清

Dean 確認 entry page 當前指向兩個 gated targets：

### 15.1 Primary all-download target

| 項目 | 值 |
| --- | --- |
| URL | `https://babel-lab.blogspot.com/p/pdf.html` |
| role | `primary_all_download` |
| 用途 | all-download ZIP / PDF 或主完整包下載 |
| 實況 | 多數使用者點此 original all-download target |

### 15.2 Optional update download target

| 項目 | 值 |
| --- | --- |
| URL | `https://babel-lab.blogspot.com/p/pdf_0894718110.html` |
| role | `optional_update_download` |
| 用途 | update-only / correction package；原為「先前已下載者」之更新管道 |
| 條件 | 僅當存在錯誤、修正、替換、新增資源或更新包時才出現；許多資源可能**永遠不需要** update target |

### 15.3 Modelling rule（須在未來模型 / validator 設計時遵守）

- 一個 indexed entry page 可有**一個或多個** download targets。
- `primary_all_download` 在資源可下載時為**正常 / 必要**。
- `optional_update_download` 為**條件性**，**不得**假設每個 funnel 都需要。
- 預設不可強制要求 entry page 必須宣告 update target；validator 若未來加入 update-target 規則須維持 conditional，**不得**將「未宣告 update target」視為缺漏。

---

## 16. GitHub / new-domain status

| 項目 | 狀態 |
| --- | --- |
| 現況 | Blogger only |
| GitHub / new-domain download page | `future_possible_not_active` |
| 行動 | **不**現在建立 GitHub download page；**不**將未來 slug 寫成 active content；slug pairing 延後 |

建議之未來語意 slug 配對（**僅供未來參考；非當前 active；不可入 production content**）：

- entry future-slug（deferred）：`/download/bopomofo-practice-cards`
- gated future-slug（deferred）：`/download/bopomofo-practice-cards-access`

當前 canonical 仍為現有 Blogger URL（§14.1 L14A-2 / §14.2 L14B-2）。

---

## 17. Page type model — Dean 擴充分類

Dean 明確指出：系統**不得**假設所有 special / resource 頁面共用單一 template。記錄以下 page type 與預設規則。

### 17.1 standard_article

一般文章、漫畫、筆記、書評、教育類貼文。

| 預設 | 值 |
| --- | --- |
| indexing | `index_follow` |
| sitemap | `true` |
| listings | `true` |
| AdSense | 允許 / 依版面 present |
| hashtags | 允許 |
| JS tracking | 可選 |

### 17.2 standard_download_entry

Public indexed 資源介紹 / download preface 頁。

| 預設 | 值 |
| --- | --- |
| indexing | `index_follow` |
| sitemap | `true` |
| listings | `true` |
| layout | `regular_article_like`（預設） |
| AdSense | 允許 / present |
| JS-DL · GA tracking | 允許 |
| hashtags | 允許 |
| schema | 相關時允許 |
| downloadTargets | 一個或多個 |
| primary target | 正常 |
| update target | 可選 / 條件性（§15.3） |

### 17.3 gated_download

Google Form 或 gated 資源存取頁。

| 預設 | 值 |
| --- | --- |
| indexing | `noindex_follow` |
| sitemap | `false` |
| listings | `false` |
| 機制 | 內含 Google Form 或 gated 機制 |
| 下載 / 資源連結 | 可能僅於表單送出後始顯示 |
| AdSense | 可能 present |
| 列表 / 文章流 | **不得**作為一般文章 / listing 內容 surface |

### 17.4 special_direct_download_resource

直接下載 / 季節性 / 活動性資源頁。

**範例**：

| 項目 | 值 |
| --- | --- |
| 標題 | `🎄2025 聖誕節著色畫下載: 聖誕老公公與禮物們(2張，A4可列印) ~🎅` |
| Blogger search description | `聖誕節,著色畫,A4,彩色筆,塗色` |

| 預設 / 行為 | 值 |
| --- | --- |
| 性質 | seasonal / campaign 類直接下載資源頁 |
| 機制 | **not gated**；直接 JPG / 圖檔下載按鈕 |
| 樣式 | 自訂 CSS / 自訂卡片版面 |
| AdSense | 區塊 present |
| JS / SVG / interaction | 可能含自訂 |
| indexing | 可 index（除非明確 override） |
| sitemap / listings | 可進（除非明確 override） |

**重要**：本類證明「並非所有下載 / 資源頁都繼承一般文章版面」。預設可為 article-like，但**特殊 / campaign / 資源**樣板**必須允許**（見 §18）。

### 17.5 interactive_demo / pure_css_game

互動展示 / pure CSS 小遊戲 / lab experiment article。

**範例**：

| 項目 | 值 |
| --- | --- |
| 標題 | `[PURE CSS GAME]小遊戲-火箭發射(無音效)` |
| URL | `https://babel-lab.blogspot.com/2024/06/pure-css-game-rocket-lunch.html` |
| Blogger search description | `css,遊戲,火箭升空` |
| 現況 | 目前僅一頁；尚未 SEO 優化；hashtags 缺 / pending；JS-LQ / JS-DL tracking 缺 / pending |
| role | `interactive_demo`（subtype: `pure_css_game`）；亦可視為 `lab_experiment_article` |

| 預設 / 行為 | 值 |
| --- | --- |
| 性質 | **not** download funnel；**not** gated download |
| 版面 | article-like 開場 + card-preview / card-more |
| AdSense | 區塊 present |
| 互動 | 嵌入遊戲 block；遊戲 box 內自訂 CSS；checkbox / label / reset 為 CSS-only 互動；火箭升空動畫；宇宙 / 星 / 流星 / 星雲動畫 |
| 附加內容 | 含 ChatGPT prompt / process 說明、相關 / 其他連結 |
| indexing | 預設 `index_follow`（可 override） |
| sitemap | 預設 `true`（可 override） |
| listings | 預設 `true`（可 override） |
| 自訂 CSS | 允許 |
| 自訂 JS | 可選 / 需要時允許 |
| AdSense | 允許 |
| SEO / hashtags / tracking | 可 pending |

**系統意涵**：未來 BLOG 系統須支援 interactive / demo 內容，**不得**強制歸入 download / resource 頁面類型。

---

## 18. Layout policy 修訂

⚠️ **修訂任何先前過嚴敘述**（例如「download / resource 頁面繼承一般文章版面」）。**正確規則**：

> 多數 standard download entry 頁與 gated download 頁使用 regular Blogger article-like 版面；但 special direct download resource、seasonal / campaign 頁與 interactive demo 頁可使用自訂 CSS / JS / SVG / 自訂版面。

### layout_policy（記錄用 — 非實作）

| 鍵 | 值 |
| --- | --- |
| `default_layout` | `regular_article_like` |
| `special_layout_allowed` | `true` |
| `preserve_adsense_slots` | `true` |
| `adsense_policy` | preserve existing ad slots and relative placement unless explicitly approved |
| `allow_js_dl_tracking` | `true` |
| `allow_hashtags` | `true` |
| `allow_custom_css` | `true` |
| `allow_custom_js` | `true` |
| `allow_svg_interaction` | `true` |

**note**：未來變更應主要動內容、CTA 文案、metadata、target URL 與 tracking metadata；**不**得在未明確核准下重新設計 AdSense 配置。

---

## 19. Recommended metadata model（概念紀錄 — 非實作）

下列僅為**概念模型**之 docs-only 紀錄；**不**新增 source schema、**不**改 validator、**不**改 settings。未來實作時須另開 source phase + Dean explicit approval。

### content_kind

- `article`
- `resource`
- `interactive`
- `utility_hidden`

### page_type

- `standard_article`
- `standard_download_entry`
- `gated_download`
- `special_direct_download_resource`
- `interactive_demo`

### download_targets

| 鍵 | 值 |
| --- | --- |
| `cardinality` | `one_or_many` |
| `primary_required` | `true` |
| `update_target_optional` | `true` |

### resource_access

- `public_direct`
- `gated_form`
- `entry_to_gated`
- `interactive_no_download`

### resource_layout

- `regular_article_like`
- `form_download`
- `special_campaign`
- `interactive_custom`

---

## 20. Verification status / cautious wording register

| 項目 | 狀態 | 理由 |
| --- | --- | --- |
| §14.1 entry page URL / title / search description | **public Blogger 可見** | 直接於 Blogger 前台可見；非 backend / secret |
| §14.2 gated page URL / title / search description | **public Blogger 可見** | 同上 |
| §14.2 Google Form 流程 | `yes_assumed_needs_manual_check` | Claude 未登入 Blogger 編輯 / Form 後台；未獨立驗證 |
| §14.2 Drive / post-submit 資源 | `existing_assumed_needs_manual_verify` | Blogger HTML 不暴露 Drive 連結；須人工填表驗證 |
| §15.2 update target 是否仍有現行用途 | `existing_assumed_needs_manual_verify` | 同上 |
| §16 GitHub / new-domain | `future_possible_not_active` | 當前無 active GitHub download page |
| §17.5 interactive demo SEO / hashtags / tracking | `content_not_provided_yet` / pending | 尚未補齊 |
| 將上述任何項目寫入 production `.md` 或 validator fixture | `deferred` | 須另開 phase + Dean explicit approval |

**未主張之內容**（明確列出避免被誤讀）：

- ❌ **未**驗證 Drive 連結仍可下載
- ❌ **未**驗證 Google Form 後端仍可收件
- ❌ **未**主張 GitHub download page 存在
- ❌ **未**主張 update download target 為**所有**資源**必要**

---

## 21. 本次 append 之 deferred / red-line 補述

§12 全條沿用。本 append（§13–§20）額外確認：

- ❌ **no source change**（validator / scripts / EJS / selectors / SCSS / JS 未動）
- ❌ **no fixture change**（funnel fixtures 與 production posts 未動）
- ❌ **no baseline bump**（未跑 `validate:content` / `report:validation` / 任何 `check:*`）
- ❌ **no production content migration**（無 production `.md` 新增 / 修改）
- ❌ **no pair landing**（entry / gated production pair 仍 deferred）
- ❌ **no live Blogger / Google Form / Google Drive / GA4 / AdSense / Search Console / Admin write path access**
- ❌ **no template / page type schema change**（§17 / §19 為概念紀錄，**非**實作）
- ❌ **no canonical / sitemap / robots / `pageType` 寫入**（§14 / §15 為現況紀錄，**非**規格生效）
- ❌ **no Form URL / edit URL / response URL** 入 repo（沿用 §6 red lines）
- ❌ **no Drive ID / Drive URL / OAuth token / API key / respondent data** 入 repo（沿用 §7 / §10 red lines）
- ❌ 未改 `CLAUDE.md` / `MEMORY.md` / `memory/`
- ❌ 未改 settings / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages / .cache
- ❌ 未 build / deploy / dev server / preview / repost
- ❌ 未 rebase / amend / force-push
- ❌ 未執行任何 slash command

`APPEND VERDICT: DEAN MATERIAL RECORDED AS DOCS-ONLY INPUT`
`PUBLIC BLOGGER URLS / TITLES / SEARCH DESCRIPTIONS RECORDED`
`PAGE TYPE MODEL EXPANDED (CONCEPTUAL ONLY)`
`LAYOUT POLICY REVISED (DOCS-ONLY)`
`METADATA MODEL DOCUMENTED (NOT IMPLEMENTED)`
`DRIVE / FORM BACKEND NOT VERIFIED — MANUAL CHECK REQUIRED`
`GITHUB / NEW-DOMAIN DOWNLOAD = FUTURE_POSSIBLE_NOT_ACTIVE`
`NO SOURCE / FIXTURE / BASELINE / PRODUCTION CONTENT / LIVE SERVICE CHANGE`
`READY FOR IDLE FREEZE`

（本文件結束）
