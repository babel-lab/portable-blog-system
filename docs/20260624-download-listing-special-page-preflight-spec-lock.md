# Download / listing / special-page preflight & spec lock（docs-only）

- Phase id：`20260624-night-download-listing-special-page-preflight-spec-lock-a`
- 日期：2026-06-24（Asia/Taipei）
- 類型：**docs-only preflight + spec lock**（不改 source / content / build / deploy / generated HTML / CLAUDE.md / MEMORY.md）
- frozen baseline：`main @ 5b16694`（HEAD == origin/main，ahead/behind 0/0，working tree clean，`.git/index.lock` absent）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）、J（SEO / 索引）、F（GitHub 靜態站 listing / sitemap）、E（Blogger 匯出）
- SP-9b CLOSED；SP-9e decision = no landing；本 phase **不**屬於 SP-9 系列、**不**重啟 SP-9。

---

## 0. 本文目的與非目的

### 目的

把 download / gated_download / utility_hidden / redirect_canonical 等「特殊頁類型」與 listing / sitemap / robots 三維度之**平台無關架構**做一次 cross-doc 收斂 spec lock，並對 Dean 4 個 architecture 問題給出 evidence-backed 答案。本文**不**新建欄位、**不**改 selector、**不**改 validator 預設、**不**改任何 production 輸出。

### 非目的（本 phase 一律不做）

- ❌ 不改 `src/**`（含 build / validator / EJS / Admin / selector / pure helper）
- ❌ 不改 `content/**` / `settings/**` 任何 frontmatter / registry
- ❌ 不改 `package.json` / lockfile / `dist*` / `.cache` / gh-pages
- ❌ 不執行 build / deploy / dev / preview / repost
- ❌ 不動 Blogger / AdSense / GA4 / Search Console / Drive / Google Form 後台
- ❌ 不啟動 Admin write path / `--apply` / `dryRun:false`
- ❌ 不改 CLAUDE.md / MEMORY.md / memory/
- ❌ 不 sync validation baseline 數值（read-only confirm 而已）
- ❌ 不重啟 SP-9b / SP-9e；不新開 SP-9 子系列
- ❌ 不對 `portable-blog-system-mvp.md` 之 listing 內容意圖預先裁定（仍交 Dean 決定）

---

## 1. 現況 repo facts（read-only inventory）

### 1.1 settings registry（既有）

| 檔案 | 角色 |
| --- | --- |
| `content/settings/download-assets.json` | empty registry landing point |
| `content/settings/download-forms.json` | empty registry landing point |
| `content/settings/_sample.download-assets.json` | sample / template only |
| `content/settings/_sample.download-forms.json` | sample / template only |
| `content/settings/ga4.config.json` / `seo.config.json` / `site.config.json` | 索引 / 追蹤 / 站台基底 |

### 1.2 frontmatter metadata 欄位（已存在於 schema / validator）

均屬「內容屬性」，**放 `.md` frontmatter**；不放 `.publish.json`、不存 secret、不存 form response、不存 Drive folder ID。

| 欄位 | 出處 | 角色 |
| --- | --- | --- |
| `contentKind` | CLAUDE.md §11 / `publish-bundle.md` §2.4 | 既有「內容體裁」維度（`post` / `tech-note` / `book-review` / `download` / `comic` / `life-note` / `page`） |
| `pageType` | SP-2 lock（`docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`） | SP-2 鎖定之**封閉列舉**，描述「IA 角色」 |
| `seo.indexing` | SEO-2 既有 | robots policy 單一來源；合法值 `index` / `noindex-follow` / `noindex-nofollow` |
| `includeInListings` | SP-2 / SP-4a | 站內列表 opt-in / opt-out（顯式 boolean） |
| `includeInSitemap` | SP-2 / SP-5a | sitemap 顯式 boolean override（safety 仍最高） |
| `includeInFeeds` | SP-2 預留（無 feed builder 消費端） | RSS / Atom 預留欄位 |
| `gatedDownload.{mechanism, formEmbedUrl, postSubmitResource}` | SP-2 / SP-8 | 閘門結構語意；**只允許這三 key**；其他 key 觸發 `page-gated-download-suspicious-field` warning（不 echo value） |
| `platformPolicy.{github|blogger|future}.{indexing,includeInListings,includeInSitemap,includeInFeeds,canonical,note}` | SP-8 shape lock + SP-9a effective helper | per-platform override；leaf 支援 `'inherit'` 字串 |
| `canonical` / `primaryPlatform` | CLAUDE.md §21 / §24 既有 | canonical handling |

`pageType` 封閉列舉（SP-2）：
`article` / `static_page` / `download` / `gated_download` / `landing` / `utility_hidden` / `redirect_canonical` / `platform_special`。

### 1.3 三條 selector（純函式；正交；零依賴除 `platform-policy-effective.js`）

| selector | 檔案 | 消費者 |
| --- | --- | --- |
| robots meta | `src/scripts/page-type-robots.js` | `build-github.js` post-detail render |
| sitemap inclusion | `src/scripts/include-in-sitemap.js` | `build-sitemap.js`（GitHub Pages only） |
| listing inclusion | `src/scripts/include-in-listings.js` | `build-github.js` home / post-list / category / tag / prev-next |

precedence（per 既有源碼 + SP-9b lock）：

| 維度 | precedence（高 → 低） |
| --- | --- |
| **robots** | 1. explicit `seo.indexing` → 2. legacy `contentKind==='download'` → 3. `pageType` 推導（download / gated_download / redirect_canonical → `noindex, follow`；utility_hidden → `noindex, nofollow`）→ 4. default → 5. SP-9b `platformPolicy.github.indexing` **tighten-only**（永不放寬） |
| **sitemap** | 1. safety（`seo.indexing` noindex-* 或 `contentKind==='download'`）→ exclude；任何 override 不放寬 → 2. eligible 後 top-level `includeInSitemap === false` → exclude → 3. SP-9b `platformPolicy.github.includeInSitemap === false` → exclude → 4. else include |
| **listings** | 1. top-level `includeInListings === false` → exclude（最高優先，policy true 不放寬）→ 2. SP-9b `platformPolicy.github.includeInListings === false` → exclude → 3. else include（**預設**；selector **不**讀 `contentKind` / `pageType` / `seo.indexing`） |

### 1.4 validator warning-only 規則（已 landed；warning-only；缺省 0 觸發）

SP-2 + SP-8 體系（type 前綴 `page-*`），mirror `check-page-type-validator.js` 37 個 assert：

- `page-type-invalid`（unknown pageType；非 string）
- `page-include-flag-invalid-type`（`includeInListings|includeInSitemap|includeInFeeds` 非 boolean）
- `page-platform-policy-invalid-type` / `page-platform-policy-platform-invalid-type`
- `page-platform-policy-unknown-platform` / `page-platform-policy-unknown-field`
- `page-platform-policy-indexing-invalid` / `page-platform-policy-flag-invalid` / `page-platform-policy-canonical-invalid` / `page-platform-policy-note-invalid`
- `page-platform-policy-nested-object-deferred`
- `page-platform-policy-suspicious-field` / `page-gated-download-suspicious-field`（**只**比對 key 名；**永不**echo value）
- `page-gated-download-invalid-type` / `page-gated-download-indexed` / `page-gated-download-in-listings`
- `page-noindex-in-sitemap` / `page-noindex-in-listings`（**只**在顯式 true 才觸發）
- `page-redirect-canonical-missing-target`

外加既有 `download-content-should-be-noindex`（S1/S2 merged；ready/published only）。

### 1.5 Blogger 端現況（read-only guidance only）

- Blogger build（`build-blogger.js`）**不**消費 listing / sitemap selector（Blogger 平台自管 home / index / category / sitemap）。
- Blogger noindex / robots **無法**由系統 inject head；只能由作者於 Blogger 後台「搜尋設定 → 自訂 robots 標頭標記」手動設定。
- SP-6 / SP-9c：`copy-helper [14]` 與 `publish-checklist` 顯示 effective indexing guidance（含 `platformPolicy.blogger.indexing` 推導值 + 提醒手動 NO INDEX）；display-only，不改 Blogger output 結構。
- `check-blogger-operator-guidance.js`（direct-node smoke，11/0；非 baseline 成員）覆蓋 guidance 文案。

### 1.6 唯一 live download post（production）

| 路徑 | 屬性 | 三維度現況 |
| --- | --- | --- |
| `content/github/posts/20260504-portable-blog-system-mvp.md` | `contentKind: download` + `seo.indexing: noindex-follow`（顯式）+ ready | robots = `noindex, follow`（自動），sitemap = **excluded**（自動），listing = **included**（預設）|

production inventory 其餘事實（per 20260624 listing opt-in preanalysis §3.2 / §3.3）：

- `pageType:` production 命中 = **0**（僅 fixtures 使用）
- `includeInListings` / `includeInSitemap` / `platformPolicy` production 命中 = **0**
- 唯一 production live download post = 上表那一篇（其餘 download 為 draft / template）

### 1.7 Blogger Google Form gated download page

- 該頁**只活在 Blogger 後台**；repo 內**無** `.md` 對應檔（per Dean 已手動 NO INDEX 紀錄；SP-1 / SEO-3 文件已記載）。
- 該頁之「不被索引」保證**只存在於 Blogger 後台人工設定**；repo 端**無可攜 metadata**。
- 一旦未來合併到 GitHub Pages / 新網域，若無 metadata，**有極高風險誤索引 / 誤入列表 / 誤入 sitemap**。

---

## 2. Architecture answers（Dean 4 問）

### A. special page type 應否 platform-agnostic？

✅ **是**。當前 SP-2 → SP-9c 整條線**已**以平台無關為基線設計，且本 phase 確認此原則仍生效，不需新增任何欄位即可滿足。

evidence：

1. `pageType` 為**內容語意**（IA 角色）封閉列舉，**不**綁平台（per `20260623-special-page-types-indexing-metadata-preanalysis.md` §2.1 + SP-2 lock）。
2. 平台差異由 `platformPolicy.{github|blogger|future}` 表達，shape 由 SP-8 鎖定，leaf 解 inherit 由 SP-9a 提供（display-only）；GitHub build 消費 SP-9b（tighten-only / exclude-only），Blogger guidance 消費 SP-9c（read-only）。
3. Google Form / Drive 之「閘門結構」由 `gatedDownload.mechanism` 等**結構欄位**表達，**不**寫死 Blogger-only；mechanism 為**可擴充列舉**（未來可 `email-gate` / `payment-gate` / `age-gate`）。
4. `platformPolicy.future` 已預留，供未來 GitHub Pages / 新網域 / 合併站新增 surface 使用；shape 與 github / blogger 對稱。

→ 結論：**架構已平台無關，繼續沿用既有 schema，不新增欄位**。

### B. download / gated_download 頁應如何處理？

當前**實際輸出**（read-only confirmed）：

| 維度 | 預設 | 是否可被 override 放寬 |
| --- | --- | --- |
| robots | `contentKind==='download'` → `noindex, follow`（自動）；`pageType ∈ {download, gated_download}` 亦 `noindex, follow` | ❌ 不可。explicit `seo.indexing: index` 可放寬，但會被 `page-gated-download-indexed` warning 攔截（pageType=gated_download 時）；SP-9b override **tighten-only**，永不放寬 |
| sitemap | safety 自動排除（`contentKind==='download'` 且非 explicit `index`；或 `seo.indexing` noindex-*） | ❌ 不可。safety 永遠優先；`includeInSitemap: true` 與 `platformPolicy.github.includeInSitemap: true` **不**放寬 safety |
| listings | **目前納入**（listing selector 不讀 `contentKind` / `pageType` / `seo.indexing`） | ✅ 可：`includeInListings: false` 或 `platformPolicy.github.includeInListings: false` 顯式排除 |
| `includeInListings` 仍正交 | ✅ 是 | 與 robots / sitemap 互不推導；可組合「index + not-in-listings」（landing）或「noindex + in-listings」（罕見；應 warn） |
| `includeInSitemap` safety highest | ✅ 是 | 任何 override **永不**放寬 safety exclusion |
| 是否須 Admin 顯式欄位 | ⚠️ 暫不需（dormant） | Admin write path 永久 disabled；未來解 dormant 時再規劃，per `20260623-special-page-types-indexing-metadata-preanalysis.md` §5.1–§5.4 |

關鍵 asymmetry（per `20260624-sp-download-include-in-listings-opt-in-preanalysis.md` §1.4）：

- robots 自動 noindex ✅
- sitemap 自動 exclude ✅
- listings 仍 **include by default** ⚠️（SP-4a 刻意設計，非 bug；待 listing opt-in slice 收斂）

→ 結論：**現行語意已正確**；listing 之 opt-in 收斂屬未來 slice（見 §3），本 phase **不**啟動。

### C. Blogger Google Form gated download 未來合併防呆

當前風險：repo 無記錄 → 合併 / 重建會失去「不被索引」保證。

**spec lock**：當 Dean 決定要把該頁納入 repo metadata 時（建議新增 `.md` 或先在 Admin 記錄），須使用以下 frontmatter，**屬本文件鎖定之 schema 形狀**（不新增欄位、不寫 secret）：

```yaml
# 概念示意；屬本文件鎖定之 schema（SP-2 + SP-8 既有欄位，無新增）
pageType: gated_download
contentKind: download              # 體裁仍為 download（與 pageType 正交，per §1.2）
seo:
  indexing: noindex-follow         # 全平台預設
includeInListings: false           # 顯式排除站內列表
includeInSitemap: false            # 顯式排除 sitemap（safety 已涵蓋，但顯式更穩）
gatedDownload:
  mechanism: google-form
  formEmbedUrl: ""                 # 嵌入 URL；不含 secret / response / Drive folder ID
  postSubmitResource: drive-link
platformPolicy:
  blogger:
    indexing: noindex-nofollow     # 記錄「Blogger 後台已 NO INDEX」之事實
    includeInListings: false
  github:
    indexing: noindex-nofollow     # 合併站亦 noindex
    includeInListings: false
    includeInSitemap: false
  future:
    indexing: noindex-nofollow     # 預留新網域 surface
    includeInListings: false
canonical: ""                       # 視合併策略 explicit 指向正式對外入口；不可 'auto'
```

**red lines（不可違反；mirror commerce / download registry red lines）**：

- ❌ `gatedDownload` **只**允許 `{mechanism, formEmbedUrl, postSubmitResource}` 三 key；其他 key 觸發 `page-gated-download-suspicious-field`（不 echo value）
- ❌ 不存 Drive folder ID / Drive file ID / OAuth token / API key / form response / respondent data / private permission
- ❌ Google Forms responses **永遠停留在 Google Forms / Sheets**，不進 repo
- ❌ `platformPolicy` 不存 token / secret / credential（SP-8 已對應 warn）
- ❌ 不靠 URL pattern 自動推斷 `pageType` / `contentKind` / `gatedDownload.mechanism`，全部由作者顯式宣告

合併防呆鏈：

1. validator warning-only：`page-gated-download-indexed` / `page-gated-download-in-listings`（顯式 true 才觸發；mirror 既有實作）
2. selector：robots / sitemap / listings 預設依 `pageType: gated_download` + 顯式 `includeInListings: false` + `includeInSitemap: false` 自動正確隱藏
3. Admin（dormant；R2+ 才啟動）顯示 effective + 危險組合 lock，per `20260623-special-page-types-indexing-metadata-preanalysis.md` §5.3 / §5.4
4. Blogger 端仍仰賴作者後台手動 NO INDEX；系統提供 read-only guidance（SP-9c）

### D. MVP 最小設計邊界（conservative）

**本 phase 不寫 source**；以下為 spec lock，**屬未來可選 implementation phase 之最小邊界宣告**，每片各須 user explicit approval。

**MVP 範圍（不超過此邊界）**：

| 項目 | 狀態 | 說明 |
| --- | --- | --- |
| metadata 欄位 | ✅ **已存在**（不新增） | `pageType` / `seo.indexing` / `includeInListings` / `includeInSitemap` / `gatedDownload` / `platformPolicy`（per §1.2） |
| pageType 枚舉 | ✅ **已 lock 為 8 值**（SP-2） | `article` / `static_page` / `download` / `gated_download` / `landing` / `utility_hidden` / `redirect_canonical` / `platform_special` |
| robots / sitemap / listings precedence | ✅ **已 lock**（§1.3） | 不再變動 |
| validation expected behavior | ✅ **warning-only**（SP-2 + SP-8） | 缺省 0 觸發；production 0 觸發；fixtures 涵蓋 37 assert |
| Admin 顯示 | ✅ **dev-mode read-only**（SP-7a + R1）；write path **永久 disabled** | 未來解 dormant 屬另開 phase |
| migration / backfill | ⏸ **不啟動** | 三條 selector 全走預設路徑；任何 backfill 屬內容意圖判斷，待 Dean 決 |
| tests needed | ✅ **已存在** | `check:page-type-validator`（37/0）/ `check:platform-policy-effective`（40/0；direct-node）/ `check:include-in-listings`（baseline）/ `check:include-in-sitemap`（baseline）/ `check:page-type-robots`（baseline）/ `check:platform-policy-github-precedence`（baseline）/ `check:blogger-operator-guidance`（11/0；direct-node）|

**MVP 之外（未來可選 slice，每片獨立 phase + explicit approval）**：

per `20260624-sp-download-include-in-listings-opt-in-preanalysis.md` §6 + 本文延伸：

1. **Slice 1 — validator default-case visibility（warning-only；最保守）**  
   新增 warning（暫名 `download-in-listings-default`）：`contentKind==='download'`（與/或 `pageType ∈ {download, gated_download}`）且 `includeInListings` 缺省 → warning，提示作者顯式宣告意圖。  
   - 補既有 gap：現有 `page-noindex-in-listings` / `page-gated-download-in-listings` 只看顯式 true，不覆蓋「靠預設留在列表」情況；本 slice 補上 default-case 可見性。**不改 build 行為**。  
   - 須新增 fixtures、重量測 baseline；本 phase **不**預測數值。

2. **Slice 2 — listing selector opt-in 行為變更**  
   改 `resolveIncludeInListings`：`contentKind==='download'`（與/或 `pageType ∈ {download, gated_download}`）預設 exclude；顯式 `includeInListings: true` 放回。  
   - 前置：對「要留在列表」之 download post backfill `includeInListings: true`（今日唯一候選 = `portable-blog-system-mvp.md`，內容意圖待 Dean 裁定）。  
   - 須 byte-diff `dist/`、重量測 baseline、更新 SP-4a selector 註解之邊界宣告。  
   - top-level 顯式 false 與 `platformPolicy.github.includeInListings === false` precedence 不變。  
   - **此 slice 會改變現有輸出**（破壞 SP-4a / SP-9b 之「預設 byte-identical」不變式）；落地前須 Dean explicit approval。

3. **Slice 3 — Blogger Google Form gated download `.md` migration（內容遷移）**  
   依 §2.C 之 spec lock 新增 `.md` 對應檔；本 slice 屬**內容遷移**，不改 source。  
   - 須提交 Drive folder ID / form response / token / Drive file ID 等敏感資訊「**不**進 repo」之 preflight 確認。  
   - 須 Admin 顯示 effective + Blogger guidance 文案校對（SP-9c smoke 已 cover）。

4. **Slice 4（可選；非必要）— Admin 欄位暴露 / 危險組合 lock**  
   待 Admin write path 解 dormant 後（屬另開 governance phase），暴露 `pageType` / `seo.indexing` 為預設欄位、其餘為進階欄位；危險組合（gated_download + index / noindex + in-listings）lock 或 hard-warn。

**Slice 之間 ordering 建議**：Slice 1 → Slice 3 → Slice 2 → Slice 4。理由：先增可見性（warning-only，零行為變化），再用 Slice 3 提供真實 gated 內容驅動 Slice 2 之 opt-in 改預設，最後在 Admin 解 dormant 時補 UI 防呆。

---

## 3. 本 phase 明確非動作（non-actions）

| # | 項目 | 狀態 |
| --- | --- | --- |
| 1 | 不改 `src/**`（含 build / validator / EJS / Admin / selector / 純函式 helper） | ✅ 未動 |
| 2 | 不改 `content/**` / `settings/**` 任何 frontmatter / registry | ✅ 未動 |
| 3 | 不改 sitemap.xml / robots.txt / robots meta（線上效果） | ✅ 未動 |
| 4 | 不改 `package.json` / lockfile / `dist*` / `.cache` / gh-pages | ✅ 未動 |
| 5 | 不執行 build / deploy / preview / repost / dev server | ✅ 未執行 |
| 6 | 不動 Blogger / AdSense / GA4 / Drive / Search Console / Google Form 後台 | ✅ 未動 |
| 7 | 不啟動 §2.D 任一 Slice 之 source / 內容遷移 | ✅ 僅 spec 預告 |
| 8 | 不改 CLAUDE.md / MEMORY.md / memory/ | ✅ 未動 |
| 9 | 不重啟 SP-9b / SP-9e；不新開 SP-9 子系列 | ✅ 未動 |
| 10 | 不對 `portable-blog-system-mvp.md` 之 listing 內容意圖預先裁定 | ✅ 仍交 Dean 決定 |
| 11 | 僅新增本 1 個 docs 檔 | ✅ |

---

## 4. read-only commands executed（本 phase）

```text
pwd
git status --short
git branch --show-current
git rev-parse HEAD                     # → 5b166945ed4e584a19cc91ed6f87ed16ee3aa6bd
git rev-parse origin/main              # → 同上
git log -1 --oneline                   # → 5b16694 docs(claude-md): compress current-state memory
git rev-list --left-right --count origin/main...HEAD   # → 0	0
ls .git/index.lock                     # → No such file or directory
ls content/settings/
Glob/Grep（read-only）：contentKind / pageType / gated_download / utility_hidden /
  redirect_canonical / includeInListings / includeInSitemap / noindex / robots /
  sitemap / Google Form / Drive / gated / special page / platformPolicy /
  Blogger / GitHub —— 共 ~7 次 grep + ~6 次 Read
cat package.json（read-only）
npm run validate:content               # → 0 / 112 / 102（baseline 不變）
git status --short / git diff --stat   # → 仍 clean（除本 docs 檔）
```

---

## 5. final state（本 phase 完成時）

- ✅ 新增 docs-only spec lock 1 個：`docs/20260624-download-listing-special-page-preflight-spec-lock.md`
- ✅ **完全無 source changes**（src / views / scripts / content / settings / package / lockfile / dist / gh-pages / .cache / generated HTML / CLAUDE.md / MEMORY.md 一律未動）
- ✅ **無 Admin / backend / GA4 / Blogger / AdSense / Search Console / Drive / deploy / generated HTML / dist / gh-pages / .cache changes**
- ✅ validation baseline 不變：0 / 112 / 102
- ✅ HEAD = origin/main = `5b16694` →（commit 後）將更新；ahead/behind 預期 0 / 0；working tree clean

---

## 6. recommended next phase（不啟動，僅標籤）

- **保守路徑（建議）= idle freeze**。本 spec lock 不觸發任何後續動作；待 Dean 決定。
- 若 Dean 決定推進，建議候選順序（每片獨立 phase + explicit approval）：

| label | 範圍 | 風險 |
| --- | --- | --- |
| `20260XXX-sp-download-in-listings-default-warning-validator-a` | §2.D Slice 1：validator default-case warning；warning-only；fixtures + baseline 重量測 | 🟢 |
| `20260XXX-blogger-gated-download-md-migration-a` | §2.D Slice 3：依 §2.C 之 schema 新增 Blogger Google Form gated download `.md`；內容遷移；no source | 🟢（但須先確認 Dean 內容 + secret preflight） |
| `20260XXX-sp-download-default-exclude-listings-opt-in-selector-a` | §2.D Slice 2：行為變更；listing selector opt-in；dist byte-diff + baseline 重量測 | 🟡（**會改現有輸出**；須 Dean explicit approval） |
| `20260XXX-admin-special-page-metadata-write-path-*` | §2.D Slice 4：Admin write path 解 dormant 後之欄位暴露 + 危險組合 lock | 🔴 高（Admin write path dormant；屬另開 governance phase） |

實際日期前綴以落地當日為準；本 phase **不**預先佔位、**不**啟動任一。

---

## 7. cross-links

- `docs/20260624-sp-download-include-in-listings-opt-in-preanalysis.md`（直接前身；listing opt-in 影響評估與 defer 推薦）
- `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1 平台無關架構提案，§2 metadata model / §3 pageType 列舉 / §4 矩陣 / §5 Admin / §6 migration）
- `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2 schema lock + validator fixtures）
- `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3 robots precedence）
- `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a listing selector）
- `docs/20260623-pm-sp5a-include-in-sitemap-selector-wiring.md`（SP-5a sitemap selector）
- `docs/20260623-sp4-include-in-listings-inventory-preflight.md`（SP-4 inventory）
- `docs/20260623-pm-sp7a-admin-readonly-page-metadata-summary.md` / `docs/20260623-sp7a-admin-readonly-page-metadata-browser-pass.md`（SP-7a Admin read-only summary）
- `docs/20260623-pm-sp8-platform-policy-shape-validator.md`（SP-8 platformPolicy shape lock）
- `docs/20260624-am-sp9a-platform-policy-effective-derive-helper.md`（SP-9a display-only helper）
- `docs/20260624-sp9c-blogger-platform-policy-operator-guidance.md`（SP-9c Blogger guidance）
- `docs/20260612-blogger-adsense-noindex-download-seo-policy-preanalysis.md`（download / noindex 與 AdSense 政策邊界）
- `docs/seo-indexing-rules.md`（SEO indexing policy 規則總則）
- `CLAUDE.md` §11 / §13 / §15–§17 / §21 / §23 / §24 / §29

（本文件結束）
