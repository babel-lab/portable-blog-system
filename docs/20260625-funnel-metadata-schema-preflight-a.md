# Funnel metadata schema preflight（docs-only）

- Phase id：`20260625-am-funnel-metadata-schema-preflight-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**docs-only schema preflight**（不改 source / content / settings / package / lockfile / dist / gh-pages / .cache / generated HTML / Blogger live / Google Form / Google Drive / GA4 / AdSense / Search Console / Admin write path / CLAUDE.md / MEMORY.md / memory/）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）
- 前序：
  - `docs/20260624-gated-download-funnel-spec-lock.md`（funnel 三層 platform-agnostic spec lock；§3.1 / §3.2 提出 `downloadFunnel` 概念欄位）
  - `docs/20260625-gated-download-funnel-source-not-required-preflight-record.md`（既有 selector / validator / fixture coverage 已涵蓋 funnel 兩端；source landing not required）
  - `docs/20260624-download-listing-special-page-preflight-spec-lock.md`（download special page schema lock）
  - `docs/20260624-special-page-slice1-default-case-warning-record.md`（Slice 1 default-trigger warning landed）
  - `docs/20260624-special-page-slice2-listing-selector-optin-landing-record.md`（Slice 2 listing selector opt-in landed）

---

## 0. 本文目的與非目的

### 目的

把 gated download funnel 之 metadata 欄位（`downloadFunnel.{role, targetGatedPage, entryPages, ctaEventName}`）以 **docs-only schema preflight** 收斂為單一可引用 spec：

1. 定義 4 個欄位之型別、enum、必填組合、命名與語意
2. 鎖定 `downloadFunnel` 與既有 schema（`pageType` / `contentKind` / `seo.indexing` / `includeInSitemap` / `includeInListings` / `platformPolicy.*`）之正交關係與**安全優先順序**
3. 列出未來 validator warning / error code 候選清單（**只 spec，不實作**）
4. mirror spec lock §3.2 / §3.3 之 red lines 並補強 funnel 維度
5. 整理 F1 與 F2 / F3 / F4 / F5 / F6 / F7 / F8 / F9 之依賴邊界
6. 留下 verdict + recommended next phase

本 phase **不**新增 source、**不**改 fixture、**不**改 frontmatter、**不**改 CLAUDE.md / MEMORY.md / memory/。

### 非目的（本 phase 一律不做）

- ❌ 不改 `src/**`（含 build / validator / EJS / Admin / selector / 純函式 helper / SCSS / JS）
- ❌ 不改 `content/**` / `settings/**` 任何 frontmatter / registry / fixture
- ❌ 不改 `package.json` / lockfile / `dist*` / `.cache` / gh-pages / generated HTML
- ❌ 不執行 build / deploy / dev / preview / repost
- ❌ 不動 Blogger live / Google Form / Google Drive / AdSense / GA4 backend / Search Console
- ❌ 不啟動 Admin write path / `--apply` / `dryRun:false`
- ❌ 不改 CLAUDE.md / MEMORY.md / memory/
- ❌ 不啟動 spec lock §7 任何後續 phase（F2 / F3 / F4 / F5 / F6 / F7 / F8 / F9）之 source / 內容遷移
- ❌ 不對既有 production posts 做 funnel role / target / entryPages 預先裁定
- ❌ 不加入任何 Google Form editor URL / response URL / Drive folder ID / Drive file ID / private token / respondent data

---

## 1. Baseline

| 項目 | 值 |
| --- | --- |
| repo | `D:/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `597244bc49b8656d2a3d8ea0495c4ee798a8c0df` |
| short | `597244b` |
| latest subject | `docs(download): record gated funnel source preflight` |
| origin/main | `597244bc49b8656d2a3d8ea0495c4ee798a8c0df`（同 HEAD） |
| ahead / behind | `0 / 0` |
| working tree | clean（`git status --short` 空輸出） |
| `.git/index.lock` | absent |

read-only 補充：

- `Grep "downloadFunnel"` 全 repo → **2 files**，皆為前序 docs（`docs/20260624-gated-download-funnel-spec-lock.md` / `docs/20260625-gated-download-funnel-source-not-required-preflight-record.md`）。`src/**` / `content/**` / `settings/**` 零 occurrence。
- `Glob src/scripts/page-type-*.js` → `page-type-robots.js`
- `Glob src/scripts/include-in-*.js` → `include-in-sitemap.js` / `include-in-listings.js`
- `Glob src/scripts/platform-policy-*.js` → `platform-policy-effective.js`

→ schema preflight 入場條件成立：欄位於 repo 內**完全不存在**；selector / resolver 邊界檔案在位、未動。

---

## 2. F1 scope（明示）

| 項目 | 狀態 |
| --- | --- |
| docs-only | ✅ |
| schema preflight only | ✅ |
| 新增 source（src / scripts / EJS / SCSS / JS） | ❌ 不做 |
| 新增 validator rule | ❌ 不做（只列候選） |
| 新增 fixture | ❌ 不做 |
| 內容遷移（content / settings） | ❌ 不做 |
| Admin UI / Admin write path | ❌ 不做 |
| Blogger live / Google Form / Drive / GA4 / AdSense / Search Console | ❌ 不做 |
| build / deploy / dev server | ❌ 不做 |
| 改 CLAUDE.md / MEMORY.md / memory/ | ❌ 不做 |
| 僅新增 docs 檔數 | 1（本檔） |

---

## 3. Proposed metadata shape（schema preflight；**未來實作 phase 才落地**）

### 3.1 完整概念示意

```yaml
# 概念示意：未來 funnel metadata（本 phase 不啟動，不寫入 repo）
downloadFunnel:
  role: entry                          # 'entry' | 'gated_page'
  targetGatedPage: "<slug or public URL only>"   # role=entry 使用；正向關聯
  entryPages:                          # role=gated_page 使用；反向關聯
    - "<entry slug 1>"
    - "<entry slug 2>"
  ctaEventName: click_all_download     # GA4 event naming carry-forward / candidate；本 phase 不實作
```

### 3.2 欄位字典

#### 3.2.1 `downloadFunnel.role`

- 型別：string
- enum：`entry` | `gated_page`
- 必填：當 `downloadFunnel` 出現時，`role` MUST 存在
- 語意：

  | 值 | 對應 funnel layer | 角色 |
  | --- | --- | --- |
  | `entry` | spec lock §3.1 Layer A | indexed entry page / SEO landing page；承接搜尋流量、放介紹 / CTA / Article schema |
  | `gated_page` | spec lock §3.2 Layer B | noindex gated download page；放 Google Form iframe、不被 index、不入 sitemap / listings |

- 不允許值：`post_submit`（spec lock §3.3 Layer C 為 post-submit resource，**不獨立為 `.md`**；故不可作為 `downloadFunnel.role` 值落地至 frontmatter）
- 大小寫：嚴格 lowercase；`Entry` / `GATED_PAGE` 等變體於未來 validator 一律觸發 `downloadFunnel-role-invalid-enum`
- 與 `pageType`、`contentKind` 之正交性：見 §4

#### 3.2.2 `downloadFunnel.targetGatedPage`

- 型別：string
- 必填條件：當 `role: entry` 時 SHOULD 存在；缺省觸發未來 validator warning `downloadFunnel-entry-missing-target-gated-page`（warning-only）
- 允許值：

  | 形式 | 例 | 允許 |
  | --- | --- | --- |
  | post slug | `gated-zhuyin-card-download` | ✅ |
  | public URL（自家 Blogger / GitHub Pages 已發布頁） | `https://example.blogspot.com/p/zhuyin-download.html` | ✅ |
  | 自家 GitHub Pages URL | `https://example.github.io/posts/gated-zhuyin-card-download/` | ✅ |

- **不允許值**（觸發未來 validator error `downloadFunnel-target-gated-page-private-secret`）：

  | 形式 | 例 | 拒絕原因 |
  | --- | --- | --- |
  | Google Drive folder ID | `https://drive.google.com/drive/folders/1AbC...` | private secret |
  | Google Drive file ID | `https://drive.google.com/file/d/1XyZ.../view` | private secret |
  | Google Form edit URL | `https://docs.google.com/forms/d/1AAA.../edit` | private secret |
  | Google Form response URL | `https://docs.google.com/forms/d/e/1FAIpQLS.../formResponse` | private secret |
  | Google Form pre-fill / edit URL containing token | 任何含 `edit` / `response` / `prefill` / token query string 之 Google Form URL | private secret |
  | 含 `respondent` / `email` query string 之 URL | 任何形式 | respondent data |
  | private token / API key 字串 | 任何含 `?token=` / `?key=` / `?auth=` query string | private secret |

- 唯一性：entry page 之 `targetGatedPage` SHOULD 為單一值（一個 entry 指向一個 gated page）；若需多個指向，建議拆為多個 entry page
- public URL 與 slug 二擇一；不允許 array（與 `entryPages` 對稱性相反）
- 不靠 URL pattern 自動推斷 `targetGatedPage` 是否合法；secret 偵測屬未來 validator 之啟發式 warning，不可作為 hard gate（per CLAUDE.md「不靠 URL pattern 自動推斷」red line；secret 防護仍由作者責任 + validator warning 雙層）

#### 3.2.3 `downloadFunnel.entryPages`

- 型別：array of string
- 必填條件：當 `role: gated_page` 時 SHOULD 存在且 length ≥ 1；缺省觸發未來 validator warning `downloadFunnel-gated-page-missing-entry-pages`（warning-only）
- 允許值：array of post slug 或 public URL（與 `targetGatedPage` 之允許值規則一致）
- **不允許值**：同 §3.2.2 紅線（Drive folder / Form edit / Form response / token / respondent data）
- 順序：陣列順序為作者意圖之優先順序；未來實作可作為 Admin read-only 顯示用
- 上限：建議 ≤ 10；超過觸發未來 validator warning `downloadFunnel-entry-pages-too-many`（warning-only；非 hard cap）
- 重複：陣列內重複 slug / URL 觸發未來 validator warning `downloadFunnel-entry-pages-duplicate`
- 反向一致性：若 `entryPages` 列出 X，且 X 之 `targetGatedPage` 未指向本頁，觸發未來 validator warning `downloadFunnel-bidirectional-inconsistent`（warning-only；屬未來 cross-file check，本 spec 不要求 hard gate）

#### 3.2.4 `downloadFunnel.ctaEventName`

- 型別：string
- 必填：optional；缺省時不影響任何行為
- 允許值（屬本 spec lock 之命名候選）：

  | 值 | 來源 | 狀態 |
  | --- | --- | --- |
  | `click_all_download` | 既有 GA4 event 名（`docs/20260623-ga4-d4-data-flow-early-evidence-record.md` §155 列舉） | carry-forward（推薦） |
  | `download_cta_click` | 未來 GA4 標準化候選 | candidate；待 F7 GA4 normalization phase 正式裁定 |

- 本 phase 不選定唯一值；F7 才裁定
- **本 phase 不實作**：即使欄位存在於未來 frontmatter，build / view / GA4 partial / Admin / link-tracker / ga4-events.js **完全不消費** `downloadFunnel.ctaEventName`；屬「命名 carry-forward / candidate」之純 metadata，等 F7 才接 wiring
- 大小寫：嚴格 lowercase + underscore；其他形式觸發未來 validator warning `downloadFunnel-cta-event-name-not-normalized`
- 不允許其他自定義 event 名（如 `custom_download_click` / `myEvent`）；列舉外觸發 `downloadFunnel-cta-event-name-invalid-enum`

### 3.3 必填組合摘要

| `downloadFunnel.role` | `targetGatedPage` | `entryPages` | `ctaEventName` |
| --- | --- | --- | --- |
| `entry` | SHOULD 存在 | 不允許 | optional |
| `gated_page` | 不允許 | SHOULD 存在 length ≥ 1 | optional |
| 缺省 `downloadFunnel` | 不允許 | 不允許 | 不允許 |
| `downloadFunnel` 存在但 `role` 缺省 | n/a | n/a | n/a；觸發 `downloadFunnel-role-missing` |

「不允許」= 出現時觸發未來 validator warning（如 `downloadFunnel-target-gated-page-wrong-role` / `downloadFunnel-entry-pages-wrong-role`），非 hard error。

---

## 4. Relationship with existing fields（正交鎖）

### 4.1 與 `pageType`

| `downloadFunnel.role` | `pageType` 建議值 | 強制？ |
| --- | --- | --- |
| `entry` | `article` 或 `landing` | 建議；不強制；常見配對 |
| `gated_page` | `gated_download` | **強制**；未來 validator warning `downloadFunnel-gated-page-pageType-mismatch`（若 `role=gated_page` 但 `pageType` 非 `gated_download` 或 `download`） |

正交性：

- `downloadFunnel.role` **不**自動推導 `pageType`；作者必須顯式宣告
- `pageType` 之既有列舉（`article` / `landing` / `download` / `gated_download` / `utility_hidden` / `redirect_canonical` / ...）與 `downloadFunnel.role` 屬兩個維度
- **`downloadFunnel.role: entry` 不得**用來把 `pageType: gated_download` 的頁面當成 entry page 處理；後者 robots safety 仍為 noindex（per §4.3）

### 4.2 與 `contentKind`

| `downloadFunnel.role` | `contentKind` 建議值 | 強制？ |
| --- | --- | --- |
| `entry` | 任意（`post` / `tech-note` / `life-note` / `download` / `book-review` / `page` ...） | 不強制 |
| `gated_page` | `download`（推薦） | 不強制；未來可放鬆 |

正交性：

- `contentKind` 與 `pageType` 已於 CLAUDE.md §11 lock 為「正交兩維度，不可混用、不可相互推導」；`downloadFunnel` mirror 此原則
- `contentKind: download` 不自動推導 `downloadFunnel.role`；反之亦然

### 4.3 與 `seo.indexing` / robots（**安全紅線：tighten-only**）

| 既有 selector | 行為 | `downloadFunnel` 之影響 |
| --- | --- | --- |
| `src/scripts/page-type-robots.js` | `pageType: gated_download` → `noindex, follow`（自動） | **完全不受 `downloadFunnel` 影響** |
| 同上 | `seo.indexing` 顯式優先（最高層） | **完全不受 `downloadFunnel` 影響** |
| 同上 SP-9b | `platformPolicy.github.indexing` tighten-only（不放寬 explicit noindex / download / special pageType） | **完全不受 `downloadFunnel` 影響** |

**安全紅線**：

- ❌ `downloadFunnel.role: entry` **不得**用來把 `pageType: gated_download` 的頁面放寬成 indexable
- ❌ `downloadFunnel` **不得**新增任何「自動把 noindex 翻成 index」之分支
- ❌ 未來 validator MUST 加 `downloadFunnel-role-conflicts-robots-safety` warning：若 `role: entry` 但 effective robots 為 noindex，視為設定矛盾（warning-only；不放寬）
- ✅ `downloadFunnel` 屬**純 metadata 層**；robots 永遠以 `seo.indexing` / `pageType` / `platformPolicy` 之既有 tighten-only 規則為唯一決定源

### 4.4 與 `includeInSitemap`（**安全紅線：safety 永遠最高**）

| 既有 selector | 行為 | `downloadFunnel` 之影響 |
| --- | --- | --- |
| `src/scripts/include-in-sitemap.js` | `seo.indexing: noindex-*` → 排除 sitemap | **完全不受 `downloadFunnel` 影響** |
| 同上 | `contentKind: download` 且非顯式 index → 排除 sitemap | **完全不受 `downloadFunnel` 影響** |
| 同上 | safety 永遠優先：override `true` **不得**把 noindex / download 強塞 sitemap | **完全不受 `downloadFunnel` 影響** |

**安全紅線**：

- ❌ `downloadFunnel` **不得**為 gated page 提供「跳過 sitemap exclusion」之 escape hatch
- ❌ 未來 validator MUST 加 `downloadFunnel-role-conflicts-sitemap-safety` warning：若 `role: gated_page` 但 `includeInSitemap: true`，視為設定矛盾（warning-only；safety 仍排除）

### 4.5 與 `includeInListings`（**安全紅線：listings safety 獨立**）

| 既有 selector | 行為 | `downloadFunnel` 之影響 |
| --- | --- | --- |
| `src/scripts/include-in-listings.js` | top-level `includeInListings: false` 永遠最高優先 | **完全不受 `downloadFunnel` 影響** |
| 同上 Slice 2 | `contentKind=download` 或 `pageType ∈ {download, gated_download}` 且未顯式 opt-in → 排除 | **完全不受 `downloadFunnel` 影響** |
| 同上 SP-9b | `platformPolicy.github.includeInListings: false` 可排除；`true` no-op（不放寬） | **完全不受 `downloadFunnel` 影響** |

**安全紅線**：

- ❌ `downloadFunnel` **不得**用來把 gated page 拉回 listings；listing opt-in 路徑唯一為 top-level `includeInListings: true`
- ❌ 未來 validator MUST 加 `downloadFunnel-role-conflicts-listings-default` warning：若 `role: gated_page` 但 `includeInListings: true`，視為設定矛盾（warning-only；建議 Dean 確認是否真的要把 gated page 進 listings）

### 4.6 與 `platformPolicy.github` / `blogger` / `future`（**安全紅線：tighten-only / safety-優先**）

| 既有 selector | 行為 | `downloadFunnel` 之影響 |
| --- | --- | --- |
| `src/scripts/platform-policy-effective.js`（SP-9a derive helper） | 顯示用；不改 robots / sitemap / listings 之 effective 行為 | **完全不受 `downloadFunnel` 影響** |
| `page-type-robots.js`（SP-9b github tighten-only） | `platformPolicy.github.indexing` 只能 tighten；不能放寬 explicit noindex / download / special pageType | **完全不受 `downloadFunnel` 影響** |
| `include-in-sitemap.js`（SP-9b github tighten-only） | `platformPolicy.github.includeInSitemap: false` 可額外排除；`true` no-op | **完全不受 `downloadFunnel` 影響** |
| `include-in-listings.js`（SP-9b github tighten-only） | `platformPolicy.github.includeInListings: false` 可排除；`true` no-op | **完全不受 `downloadFunnel` 影響** |

**安全紅線**：

- ❌ `downloadFunnel` **不得**藉由「entry role 應該被索引」之語意間接放寬 `platformPolicy.github` 之 noindex / sitemap / listing safety
- ❌ Blogger 平台之 noindex 仍須**作者手動於 Blogger 後台設定**（SP-9c guidance；mirror spec lock §6）
- ❌ 不得藉由 `downloadFunnel` 之 metadata 鎖定，讓 SP-9b tighten-only 變成 widen-able

### 4.7 安全優先順序總表（保留 spec lock §6 既有鎖；新增 `downloadFunnel` 為最低層）

```
最高 → 最低
1. seo.indexing 顯式宣告
2. pageType 自動推導（gated_download / download / utility_hidden / redirect_canonical）
3. contentKind: download legacy safety
4. platformPolicy.github / blogger / future（tighten-only；不可放寬）
5. top-level includeInSitemap / includeInListings safety（safety 永遠優先；override true 不得放寬 noindex / download safety）
6. downloadFunnel.*（純 metadata；不影響 robots / sitemap / listings 之 effective 結果）
```

→ `downloadFunnel` 屬「描述 funnel 關係」之資訊層；不屬「決定 indexing / sitemap / listings 之政策層」。

---

## 5. Future validator spec candidate（**只列；不實作**）

下列為未來實作 phase 才可能 land 之 validator warning / error code 候選清單；本 phase **不**新增、**不**註冊、**不**加 fixture。命名一律 lowercase + dash。

### 5.1 結構 / enum 類

| Code | 觸發條件 | 等級 |
| --- | --- | --- |
| `downloadFunnel-invalid-type` | `downloadFunnel` 非 plain object（array / string / number / boolean） | warning |
| `downloadFunnel-role-missing` | `downloadFunnel` 存在但 `role` 缺省 | warning |
| `downloadFunnel-role-invalid-enum` | `role` 非 `entry` / `gated_page` 列舉值（含大小寫變體） | warning |
| `downloadFunnel-suspicious-field` | `downloadFunnel` 含 `role` / `targetGatedPage` / `entryPages` / `ctaEventName` 以外之 key | warning（不 echo value） |
| `downloadFunnel-cta-event-name-invalid-enum` | `ctaEventName` 非 `click_all_download` / `download_cta_click` 列舉值 | warning |
| `downloadFunnel-cta-event-name-not-normalized` | `ctaEventName` 大小寫 / dash / camelCase 變體 | warning |

### 5.2 必填組合類

| Code | 觸發條件 | 等級 |
| --- | --- | --- |
| `downloadFunnel-entry-missing-target-gated-page` | `role: entry` 但 `targetGatedPage` 缺省 | warning |
| `downloadFunnel-gated-page-missing-entry-pages` | `role: gated_page` 但 `entryPages` 缺省或 length=0 | warning |
| `downloadFunnel-target-gated-page-wrong-role` | `role: gated_page` 但 `targetGatedPage` 出現 | warning |
| `downloadFunnel-entry-pages-wrong-role` | `role: entry` 但 `entryPages` 出現 | warning |
| `downloadFunnel-target-gated-page-invalid-type` | `targetGatedPage` 非 string（如 array / object） | warning |
| `downloadFunnel-entry-pages-invalid-type` | `entryPages` 非 array of string | warning |
| `downloadFunnel-entry-pages-too-many` | `entryPages` length > 10 | warning |
| `downloadFunnel-entry-pages-duplicate` | `entryPages` 含重複 slug / URL | warning |

### 5.3 安全 / secret 類（**最重要**）

| Code | 觸發條件 | 等級 |
| --- | --- | --- |
| `downloadFunnel-target-gated-page-private-secret` | `targetGatedPage` 命中 Drive folder ID / Drive file ID / Google Form edit URL / Form response URL / Form prefill / token / respondent / email / private token query string（啟發式 pattern） | warning（不 echo value，僅標記欄位名） |
| `downloadFunnel-entry-pages-private-secret` | `entryPages` 內任一 entry 命中同上 secret pattern | warning（不 echo value） |
| `downloadFunnel-suspicious-field-secret-like` | `downloadFunnel-suspicious-field` 之 key name 命中 secret 命名（如 `token` / `apiKey` / `respondent` / `formResponse` / `editUrl` / `driveFolderId`） | warning（不 echo value，僅標記欄位名 + 提示移除） |

### 5.4 跨欄位一致性類

| Code | 觸發條件 | 等級 |
| --- | --- | --- |
| `downloadFunnel-role-conflicts-robots-safety` | `role: entry` 但 effective robots 為 noindex；或 `role: gated_page` 但 effective robots 為 index | warning |
| `downloadFunnel-role-conflicts-sitemap-safety` | `role: gated_page` 但 `includeInSitemap: true`（或 `platformPolicy.github.includeInSitemap: true`） | warning |
| `downloadFunnel-role-conflicts-listings-default` | `role: gated_page` 但 `includeInListings: true` | warning |
| `downloadFunnel-gated-page-pageType-mismatch` | `role: gated_page` 但 `pageType` 非 `gated_download` / `download` | warning |
| `downloadFunnel-bidirectional-inconsistent` | gated page `entryPages` 列出 X，但 X `targetGatedPage` 未指向本頁；或 entry page `targetGatedPage` 指向 Y，但 Y `entryPages` 未含本頁 | warning（cross-file check；未來實作可選） |

### 5.5 候選等級總原則

- 全部以 **warning-only** 起步；無 error / hard gate
- secret 類雖屬 high-risk，但仍 warning-only（因 secret pattern 為啟發式，可能 false-positive）；hard gate 由作者責任承擔
- 不 echo value：所有 secret / suspicious field 之 warning **只**標欄位名，**不**echo 觸發內容
- 未來 phase 落地時，須先做 fixture preflight，再 land 規則；mirror Slice 1 / SP-2 / SP-3 / SP-8 之 phase 紀律

---

## 6. Red lines（mirror spec lock + 補強 funnel 維度）

### 6.1 既有 spec lock red lines（mirror；不可違反）

- ❌ `gatedDownload` **只**允許 `{mechanism, formEmbedUrl, postSubmitResource}` 三 key；其他 key 觸發 `page-gated-download-suspicious-field`（不 echo value）
- ❌ 不存 Drive folder ID / Drive file ID / OAuth token / API key / form response / respondent data / private permission
- ❌ Google Forms responses **永遠停留在 Google Forms / Sheets**，不進 repo
- ❌ `platformPolicy` 不存 token / secret / credential（SP-8 已對應 warn）
- ❌ 不靠 URL pattern 自動推斷 `pageType` / `contentKind` / `gatedDownload.mechanism` / `downloadFunnel.role` / `downloadFunnel.targetGatedPage`；全部由作者顯式宣告
- ❌ 不得對 gated download page 使用 `display:none` / `visibility: hidden` / off-screen positioning 等手段藏 SEO copy；應以 visible summary / FAQ / intro 取代

### 6.2 `downloadFunnel` 新增 red lines

- ❌ `downloadFunnel.targetGatedPage` / `downloadFunnel.entryPages` **不得**填 Google Drive folder ID / Drive file ID / Google Form editor URL / Form response URL / Form prefill URL / token / respondent identifying information / private permission
- ❌ `downloadFunnel.targetGatedPage` / `downloadFunnel.entryPages` **不得**填含 `?token=` / `?key=` / `?auth=` / `?email=` / `?respondent=` 等 secret query string 之 URL
- ❌ `downloadFunnel` **不得**用來放寬 indexing / sitemap / listings 之既有 safety（mirror §4.3 / §4.4 / §4.5 / §4.6）
- ❌ `downloadFunnel` **不得**包含 `mechanism` / `formEmbedUrl` / `postSubmitResource` / `formId` / `driveFolderId` / `token` / `apiKey` 等任何指向 Form / Drive / secret 之 key（屬 `gatedDownload` 範圍；越界即觸發 suspicious-field warning）
- ❌ commerce secret / affiliate dashboard credential / commission / payout / 帳號 email / 結算密碼 / 私人 Drive folder ID 一律不進 `downloadFunnel`
- ❌ AdSense `client id` / `slot id` 一律不進 `downloadFunnel`；mirror CLAUDE.md red line
- ❌ 不得藉由 `downloadFunnel.role: entry` 把 `pageType: gated_download` 的頁面當成 indexable
- ❌ 不得藉由 `downloadFunnel.role: gated_page` 把 entry page robots 拉成 noindex（robots 永遠由 §4.7 安全優先順序決定）

### 6.3 Indexing safety 永遠最高（強調）

`downloadFunnel` 屬純資訊層；effective robots / sitemap / listings **永遠**由：

1. `seo.indexing` 顯式宣告
2. `pageType` 自動推導
3. `contentKind: download` legacy safety
4. `platformPolicy.*` tighten-only
5. top-level `includeInSitemap` / `includeInListings` safety

決定。`downloadFunnel` **永遠**不參與 indexing decision；只用於 metadata 描述 + 未來 Admin read-only 顯示 + 未來 cross-file 一致性 warning。

---

## 7. Dependencies / future phases

mirror spec lock §7（F1–F9）；補充 F1 與後續之依賴邊界：

| # | label | F1 依賴關係 | F1 提供之鎖定點 |
| --- | --- | --- | --- |
| **F1（本檔）** | `funnel-metadata-schema-preflight-a` | 自身為起點；前序 = spec lock | schema 4 欄位定義 + 正交鎖 + validator candidate + red lines |
| F2 | `gated-download-page-template-preflight-a` | 依賴 F1 之 schema 字典（template 須消費 `downloadFunnel.targetGatedPage` / `entryPages` 顯示關聯卡片） | F1 提供欄位名 / enum / 必填組合 |
| F3 | `blogger-gated-download-md-migration-注音-a` | 不強依賴 F1（內容可先 land；funnel metadata 可後補）；建議與 F1 同步以避免 backfill | F1 提供 `role: gated_page` + `entryPages` 字典 |
| F4 | `blogger-gated-download-md-migration-練練看-a` | 同 F3 | 同上 |
| F5 | `blogger-gated-download-md-migration-數字卡-a` | 同 F3 | 同上 |
| F6 | `entry-page-cta-metadata-migration-a` | **強依賴 F1**（須 `targetGatedPage` 字典） + 至少一個 F3 / F4 / F5（須有 gated page 對象可指向） | F1 提供 entry → gated 之欄位 |
| F7 | `ga4-event-normalization-entry-gated-postsubmit-a` | **強依賴 F1**（`ctaEventName` 命名 carry-forward / candidate 鎖在 F1）；GA4 改動須獨立 phase | F1 提供 `ctaEventName` 列舉候選 |
| F8 | `admin-readonly-funnel-fields-a` | **強依賴 F1**（Admin 讀 4 欄位顯示） | F1 提供完整 schema + 顯示 hint |
| F9 | `admin-write-path-funnel-fields-*` | **強依賴 F1**（write path 寫入 4 欄位） + Admin write path 解 dormant（另開 governance phase） | F1 提供 schema + red lines + validator candidate；F9 仍屬 **🔴 高風險**，需另開 governance phase + explicit approval |

**所有後續 phase 一律需 Dean explicit approval**；F1 完成**不**自動觸發任何後續動作。

---

## 8. Verdict

### 8.1 F1 狀態

- **F1 PASS / LOCKED**（本檔 land + 通過驗證 + commit / push 後）
- schema preflight 完成：4 欄位（`role` / `targetGatedPage` / `entryPages` / `ctaEventName`）定義 / enum / 必填組合 / 命名鎖定
- 正交鎖完成：與 `pageType` / `contentKind` / `seo.indexing` / `includeInSitemap` / `includeInListings` / `platformPolicy.*` 之安全優先順序鎖定（§4.7）
- validator candidate 完成：§5.1–§5.5 列出 22 條候選 warning code（只 spec，不實作）
- red lines 完成：§6.1–§6.3 mirror 既有 + 補強 funnel 維度

### 8.2 Source landing not required in this phase

- ❌ 不新增 schema 實作（無 frontmatter 欄位寫入；無 validator rule 註冊；無 fixture 新增）
- ❌ 不新增 EJS / SCSS / JS / Admin / build / deploy
- ❌ 不動 Blogger live / Google Form / Google Drive / GA4 / AdSense / Search Console
- ❌ 不啟動 §7 任何後續 phase

### 8.3 Future source / content / schema work

**必須**：

- 每片獨立 phase
- Dean explicit approval
- 落地前須 mirror 本 F1 spec preflight；不得繞過

**禁止**：

- 將 F1 之 schema 視為「已實作」並直接寫入 frontmatter
- 將 F1 之 validator candidate 視為「已 land」並直接執行
- 將 F1 之 `ctaEventName` 列舉視為「GA4 final naming」並直接接 wiring（須等 F7）
- 將本檔之鎖定點未經 Dean approval 私下擴充（如新增 `role: post_submit` 至列舉、新增第 5 個欄位）

---

## 9. Read-only commands executed（本 phase；commit 前）

```text
pwd
git branch --show-current
git rev-parse HEAD                     # → 597244bc49b8656d2a3d8ea0495c4ee798a8c0df
git log -1 --oneline                   # → 597244b docs(download): record gated funnel source preflight
git status --short                     # → （空）
git status --branch --short            # → ## main...origin/main
git rev-list --left-right --count origin/main...HEAD   # → 0	0
ls .git/index.lock                     # → No such file or directory

Grep（read-only）：
  "downloadFunnel" 全 repo → 2 files（皆為前序 docs）；src/** / content/** / settings/** 零 occurrence

Glob（read-only）：
  src/scripts/page-type-*.js   → page-type-robots.js
  src/scripts/include-in-*.js  → include-in-sitemap.js / include-in-listings.js
  src/scripts/platform-policy-*.js → platform-policy-effective.js

Read（read-only）：
  docs/20260624-gated-download-funnel-spec-lock.md
  docs/20260625-gated-download-funnel-source-not-required-preflight-record.md
```

未執行：`git checkout` / `reset` / `rebase` / `commit`（本記錄完成前）/ `push` / `build` / `deploy` / `dev` / `preview` / `npm install` / `validate:content` / 任何 smoke check。

---

## 10. Final state（本 phase 完成時）

- ✅ 新增 docs-only schema preflight 1 個：`docs/20260625-funnel-metadata-schema-preflight-a.md`（本檔）
- ✅ **完全無 source changes**（src / views / scripts / content / settings / package / lockfile / dist / gh-pages / .cache / generated HTML / CLAUDE.md / MEMORY.md 一律未動）
- ✅ **無 Admin / backend / GA4 / Blogger / AdSense / Search Console / Drive / Google Form / deploy changes**
- ✅ validation baseline carry-forward（本 phase 未跑；無 source 變更不會回退）
- ✅ HEAD = origin/main = `597244b` →（commit 後將更新）；ahead/behind 預期 push 後 0/0；working tree clean

---

## 11. Recommended next phase

- **保守路徑（建議）= idle freeze**。F1 完成不觸發任何後續動作；待 Dean 決定。
- 若 Dean 決定推進，建議候選順序：
  - **F2 docs-only template preflight**（最近、純 docs-only、low risk）
  - 或 **F8 docs-only Admin read-only funnel fields preflight**（亦為 docs-only；可與 F2 平行討論）
  - F3 / F4 / F5（內容遷移）須 Dean 提供內容 + secret preflight
  - F6 / F7 須跨 phase 編排
  - F9 屬 🔴 高風險，需另開 governance phase

---

## 12. Cross-links

- `docs/20260624-gated-download-funnel-spec-lock.md`（funnel 三層 spec lock；本檔直接前序）
- `docs/20260625-gated-download-funnel-source-not-required-preflight-record.md`（既有 coverage 確認）
- `docs/20260624-download-listing-special-page-preflight-spec-lock.md`（download special page schema lock）
- `docs/20260624-special-page-slice1-default-case-warning-record.md`（Slice 1 default-trigger warning landed）
- `docs/20260624-special-page-slice2-listing-selector-optin-landing-record.md`（Slice 2 listing selector opt-in landed）
- `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1 平台無關架構提案）
- `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2 schema lock）
- `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3 robots precedence）
- `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a listing wiring）
- `docs/20260623-pm-sp5a-include-in-sitemap-selector-wiring.md`（SP-5a sitemap wiring）
- `docs/20260623-pm-sp8-platform-policy-shape-validator.md`（SP-8 shape lock）
- `docs/20260624-am-sp9a-platform-policy-effective-derive-helper.md`（SP-9a display-only helper）
- `docs/20260624-sp9c-blogger-platform-policy-operator-guidance.md`（SP-9c Blogger guidance）
- `docs/20260623-ga4-d4-data-flow-early-evidence-record.md`（既有 `click_all_download` event 出處；§155）
- `docs/seo-indexing-rules.md`（SEO indexing 規則總則）
- `CLAUDE.md` §3a / §7 / §11 / §13 / §15–§17 / §21 / §23 / §24 / §29

（本文件結束）
