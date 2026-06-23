# Special page types / indexing metadata — architecture preanalysis

> **本文件為 docs-only preanalysis。** 不實作任何 source / EJS / build script / validator / Admin / content / sitemap / robots 變動；不動 dist / deploy / Blogger 後台 / GitHub Pages 線上。僅提出「特殊頁面類型 + 索引/列表 metadata」之平台無關架構提案，供未來拆批實作。
>
> Phase：`special-page-types-indexing-metadata-preanalysis-docs-only-a`（2026-06-23）
> Baseline：`main @ 4e117af`（HEAD == origin/main，ahead/behind 0/0，working tree clean）

對應上層文件：
- `CLAUDE.md` §11 文章類型（`contentKind`）／§15–§17 分類·標籤·版型／§21 SEO／§23 發布狀態／§24 Blogger 發布 URL 回填
- `docs/seo-indexing-rules.md`（SEO indexing policy 規則總則 + SEO-1/2/3 系列落地紀錄；本文件之直接前身）
- `docs/publish-json-schema.md` §5.6（`blogger.type`：`post` / `page`）／§5.3（Blogger URL 規則）
- `docs/publish-bundle.md` §2.4（`contentKind` 與 `blogger.type` 分離原則）
- `docs/migration-from-frontmatter.md` §3（`type` → `contentKind` 遷移）

---

## 1. Summary（要解決什麼 / 為什麼現在建模）

### 1.1 觸發背景（Dean 提出）

未來 BLOG 系統須跨 **Blogger / GitHub Pages / 可能的合併或新網域站** 支援「特殊頁面類型」。具體已知案例：

- 一個 **Blogger 頁面內嵌 Google Form**。
- 使用者送出 Google Form 後，頁面顯示 **Google Drive 雲端檔案下載連結**。
- 該頁面**目前已在 Blogger 後台手動設為 NO INDEX**。
- 風險：若未來 Blogger 與 GitHub / 新網域內容**合併**，該頁面可能**意外變成可索引**，或**意外出現在正常列表 / 分類 / 標籤 / sitemap**。

Dean 的設計目標：Admin 應能**明確標記**此種頁面之「類型」與「索引狀態」，使合併後不會誤索引、不誤入列表。架構須**平台無關**（platform-agnostic），不能只為 Blogger 設計，且未來可能有更多類似特殊頁。

### 1.2 為什麼「現在」就該建模（即使尚未實作）

- 此頁面目前的「不索引」保證**只存在於 Blogger 後台的人工設定**，**repo 內無任何記錄**。一旦搬家 / 合併 / 重建，該保證**不可攜（non-portable）**，違反本專案「可搬家 / 可備份」核心價值（`CLAUDE.md` §1、§25）。
- 本系統已有 `seo.indexing` 欄位（SEO-2）控制 **robots meta + sitemap**，但**沒有**控制「是否出現在站內列表 / 分類 / 標籤」的維度——亦即**可訪問、noindex、卻仍會被列出**的狀態目前無法表達。
- 趁尚未有大量特殊頁時先把 schema 維度定義清楚，可確保「**預設輸出不變、特殊頁顯式 opt-in**」之保守遷移路徑。

### 1.3 build pipeline 目前在哪裡消費 indexing/listing metadata（current state facts）

| 消費點 | 檔案 | 目前行為 |
|---|---|---|
| robots meta（GitHub render） | `src/scripts/build-github.js` `buildSeoForPostDetail()` line ~293–311 | precedence：`seo.indexing`(explicit) → `contentKind==='download'` fallback(`noindex, follow`) → default `index, follow`（由 `commonSeo` spread）。非 post 頁（404 / design-system）走 `buildSeoNoindex()` → `noindex, nofollow` |
| robots meta（render 端輸出） | `src/views/seo/meta-tags.ejs` line 7 | `<meta name="robots" content="<%= seo.robots || 'index, follow' %>">` |
| sitemap inclusion | `src/scripts/build-sitemap.js` `buildEntries()` line ~128–134 | precedence：`seo.indexing==='noindex-*'` → exclude；`contentKind==='download'`（且非 explicit index）→ exclude；default → include |
| robots.txt | `src/scripts/build-sitemap.js` `buildRobotsTxt()` line ~62–71 | 靜態：`Disallow: /design-system/` + `Disallow: /404.html` + `Sitemap:` 行 |
| 列表 / 分類 / 標籤 inclusion | `src/scripts/load-posts.js` `classify()` line 21–28 ＋ `load-github-posts.js` ＋ `build-sitemap.js` `collectCategoryMap`/`collectTagMap` | **僅依 `draft` / `status`（VISIBLE_STATUS = ready/published）過濾**。**沒有任何「已發布但不入列表」的維度** |
| Blogger robots | `src/views/blogger/blogger-copy-helper.ejs` [14] ＋ `blogger-publish-checklist.ejs` | **read-only guidance only**：顯示建議 robots 值＋提醒作者去 Blogger 後台「搜尋設定 → 自訂 robots 標頭標記」手動設定。系統**不能**直接 inject Blogger head robots meta |
| Admin | `src/views/admin/index.ejs` ＋ `src/scripts/load-admin-posts.js` | dev-mode-only **read-only**；顯示 governance signals；**無 write path**（Apply 永久 disabled） |

### 1.4 目前限制（直接導致本提案的 gap）

1. **無 listing 維度**：列表 / 分類 / 標籤完全由 `draft`/`status` 決定。一個 `noindex` 的下載頁**仍會出現在 post-list / category / tag**。「noindex 但可訪問」與「不出現在站內列表」目前是**綁死**的——只能用 `draft`（完全不輸出）或 `published`（既索引又入列表），中間狀態不存在。
2. **無第一級 pageType（內容語意）概念**：目前有三個**各自獨立**的維度——`contentKind`（內容是什麼）、`blogger.type`（Blogger 平台 post/page）、build-github 內部的 render `pageType`（home/post/404/design-system，純供 SEO/OG，**非**內容分類）。上述 Google-Form gated 頁**無法乾淨對應任一者**，且 repo 內**完全未建模**。
3. **無 feed 維度**：目前**無 RSS/Atom feed build**（grep 無 feed 產出）。故 `includeInFeeds` 目前無消費端，但合併站若引入 feed，需預留。
4. **無平台 override**：單一 `seo.indexing` 同時供 GitHub render + Blogger guidance；無法表達「Blogger noindex 但 GitHub index」之差異（合併情境正需要）。
5. **canonical / redirect-only 頁未建模**：`primaryPlatform` + `canonical: auto` 已存在於文章 frontmatter，但「純跳轉 / 純 canonical 載體頁」無類型。
6. **gated/embedded 頁無語意**：「內嵌 Google Form + 表單後才出下載連結」這種**互動/閘門**屬性無欄位記錄，未來無法在 Admin 警示、無法在合併站正確處理。

---

## 2. 提案 metadata model（平台無關）

> 原則：**additive、optional、預設等於現況**。所有新欄位缺省時，build 行為與今日 byte-identical（見 §6）。所有欄位屬「內容屬性」，放 `.md` frontmatter（與 `contentKind` 同層級之決策維度），**不**放 `ads.config` / 不含任何 secret。

### 2.1 `pageType`（內容語意分類；新概念，須與既有三維度區隔）

提議在 frontmatter 新增 **optional** `pageType`，描述「這頁在資訊架構上是什麼」。

⚠️ **命名衝突警示**：build-github.js 內部已有 render-time 區域變數 `pageType`（值為 `home`/`post`/`404`/`design-system` 等，只供 SEO/OG，非內容分類）。為避免混淆，本提案的內容維度建議**改名為 `pageRole`** 或 nested 為 `page.type`，於實作 phase 二選一定案（本 preanalysis 暫以 `pageType` 指稱「內容語意」概念，實作時須消歧義）。

四維度關係（**互相獨立、不可互相推導**，延續 `CLAUDE.md` §11 / `publish-bundle.md` §2.4 之分離原則）：

| 維度 | 既有/新 | 放哪 | 答的問題 |
|---|---|---|---|
| `contentKind` | 既有 | `.md` frontmatter | 內容是什麼體裁（post / tech-note / book-review / download / comic / life-note / page） |
| `pageType`（本提案） | **新** | `.md` frontmatter | 這頁在 IA 上扮演什麼角色（見 §3 列舉），決定索引/列表預設 |
| `blogger.type` | 既有 | `.publish.json` | Blogger 平台層 post / page |
| render `pageType` | 既有（內部） | build-github 區域變數 | render template 種類（不對外、不建模） |

### 2.2 `indexPolicy`（robots policy 概念）

延續既有 `seo.indexing`（合法值 `index` / `noindex-follow` / `noindex-nofollow`），**不另造新欄位**，避免雙來源衝突。提案：

- 維持 `seo.indexing` 為 robots policy 之 single source。
- 新增「**由 `pageType` 推導之預設 indexing**」（見 §4 矩陣），但 `seo.indexing` explicit 值**永遠覆蓋** pageType 預設（precedence 與既有 SEO-2 一致：explicit → pageType 預設 → contentKind=download fallback → `index, follow`）。
- 不引入新的 robots 值；`noindex-follow` 為 gated/download 頁之標準姿勢（per `seo-indexing-rules.md` §3）。

### 2.3 `includeInSitemap`（optional override）

- 預設：由 `seo.indexing` + `pageType` 推導（noindex-* / download / gated → exclude；其餘 include）。
- 提供 optional **顯式 boolean** `includeInSitemap` 作為**逃生艙**（覆蓋推導值），供罕見例外。預設不填 = 走推導。

### 2.4 `includeInListings`（**本提案核心新維度**）

- 控制是否出現在 **post-list / 首頁最新 / 分類頁 / 標籤頁** 等站內列表。
- 預設：由 `pageType` 推導（normal/landing → include；download/gated/utility/redirect → exclude）。
- 提供 optional 顯式 boolean 覆蓋。
- **這是目前完全缺失的維度**：它讓「published + 可訪問 + noindex + 不入列表」成為可表達狀態，正是 Google-Form gated 頁所需。
- 注意：`includeInListings` 與 `seo.indexing` **正交**——可有「index 但不入列表」（如某些 landing）或「noindex 但入列表」（罕見，須 Admin 警示，見 §5）。

### 2.5 `includeInFeeds`（預留；目前無消費端）

- 目前無 feed build，**先定義不實作**。
- 預設：跟隨 `includeInListings`（feed 是列表的一種投影）。
- 合併站若引入 RSS/Atom，feed builder 直接讀此欄位。

### 2.6 canonical handling

- 沿用既有 `primaryPlatform` + `canonical`（`auto` / explicit URL）。
- 新增語意：`pageType: redirect-only` / `canonical-only` 頁，其 canonical **必須** explicit（不可 `auto`），且 `includeInListings=false` + `seo.indexing=noindex-*`（見 §3 / §4）。
- gated/download 頁若內容在 Blogger、未來合併站重建時，canonical 指向「正式對外入口前導頁」而非下載頁本身（保護漏斗，per `seo-indexing-rules.md` §1.1）。

### 2.7 platform overrides（`platformPolicy`，optional nested）

合併情境需要「同一內容、不同平台不同 index 行為」。提案 optional nested：

```yaml
# 概念示意（實作 phase 定案 schema）
pageType: gated-download
seo:
  indexing: noindex-follow          # 全平台預設
platformPolicy:                      # optional override，缺省=全平台用上面預設
  blogger:
    indexing: noindex-nofollow       # Blogger 後台已 NO INDEX，記錄之
    includeInListings: false
  pages:
    indexing: noindex-follow
    includeInListings: false
```

- 缺省（不寫 `platformPolicy`）= 全平台沿用頂層值 = 現況。
- `pages` surface 沿用 commerce dual-block 的 surface gating 慣例（`docs/20260610-affiliate-blocks-frontmatter-convention.md`）：保留欄位但 renderer 可 dormant，待實作 phase 啟用。

### 2.8 gated download / embedded Google Form 頁之表達

```yaml
# 概念示意
pageType: gated-download
gated:
  mechanism: google-form            # google-form | none | （未來其他）
  formEmbedUrl: ""                   # 內嵌表單 URL（不含任何 secret / response 資料）
  postSubmitResource: drive-link     # 表單後顯示之資源類型
  # ❌ 不存 Drive folder ID / 不存 response 資料 / 不存任何權限 token（red line，見 §7.3）
seo:
  indexing: noindex-follow
includeInListings: false
includeInSitemap: false
```

- 表單**回覆資料永遠不進 repo**（對齊 download registry red line：respondent data stay in Google Forms/Sheets）。
- 僅記錄「這是 gated 頁 + 用什麼閘門 + 後段給什麼資源類型」之**結構語意**，供 Admin 警示與合併站正確處理。

### 2.9 future extensibility

- `pageType` 為**封閉列舉 + validator warning-only**（對齊既有 `invalid-content-kind` / `invalid-seo-indexing` 慣例）：未知值 → warning，不 break build。
- 新增特殊頁類型 = 在列舉加一個值 + 在 §4 矩陣加一 row + （可選）validator 加 fixture。**不需改 schema 結構**。
- `gated.mechanism` 亦為可擴充列舉（未來 email-gate / payment-gate / age-gate 等）。

---

## 3. 建議 page types（列舉）

| `pageType` 值 | 中文 | 說明 | 對應現況 |
|---|---|---|---|
| `article`（或省略=預設） | 正式文章 | 一般 post / tech-note / book-review / comic / life-note；主要 SEO 入口 | 現況所有 published 文章 |
| `static-page` | 靜態頁 | About / 工具目錄 / 下載索引頁等固定頁 | 對應 `contentKind: page`；目前無索引/列表差異化 |
| `gated-download` | 閘門下載頁 | 表單 / 互動後才給資源（含 Google-Form 案例）；noindex + 不入列表 | **目前無法表達**（核心缺口） |
| `download`（既有體裁映射） | 下載頁 | 直接下載資源頁（無閘門）；漏斗後段；noindex,follow | 現況 `contentKind: download` 已有 noindex,follow + sitemap exclude，但**仍入列表** |
| `landing` | 著陸頁 | 活動 / 推廣 / 導流前導頁；通常 index 但可選擇不入正常列表 | 目前只能當一般文章 |
| `utility`（admin-hidden） | 工具/隱藏頁 | preview / test / 內部工具 / 設計系統類；noindex,nofollow + 不入列表 + 不入 sitemap | 現況 `/design-system/`、`/404` 走 `buildSeoNoindex`，但**靠 hardcode 非 metadata** |
| `redirect-only` | 純跳轉/canonical 載體 | 只為跳轉或承載 canonical；noindex + 不入列表 + 不入 sitemap；canonical 必 explicit | **目前無此概念** |
| `(future) platform-special` | 平台特殊頁 | 預留：未來 GitHub Pages / 新網域專屬特殊頁 | 透過列舉擴充 |

---

## 4. SEO / indexing behavior matrix

> 下表為**預設**行為（由 `pageType` 推導）；`seo.indexing` / `includeInSitemap` / `includeInListings` / `platformPolicy` 之顯式值**永遠覆蓋**預設。

| `pageType` | robots meta（預設） | sitemap | list/archive/tag/category | feed（預留） | 站內 search / related-links 資格 | Blogger 行為 | GitHub Pages / 新網域行為 | risk notes |
|---|---|---|---|---|---|---|---|---|
| `article` | `index, follow` | ✅ include | ✅ include | ✅ | ✅ eligible | 正常輸出；copy-helper [14] guidance `index` | 正常 render + sitemap | 低 |
| `static-page` | `index, follow` | ✅ include | ⚠️ 預設 exclude（固定頁通常不入「最新文章」流，但可入專屬導覽） | optional | ✅ eligible | 正常輸出 | 正常 render | 低；列表納入策略須 Admin 可調 |
| `gated-download` | **`noindex, follow`** | ❌ exclude | ❌ exclude | ❌ | ❌ 不列入 related-links 推薦 | **作者須在 Blogger 後台手動 NO INDEX**（系統 read-only guidance 提醒）；repo 記錄 `gated` 語意 | 合併站重建時：noindex meta + 不入列表/sitemap，**自動沿用 repo metadata，不再依賴人工** | **🔴 合併最高風險頁**：若無 metadata，合併後可能誤索引/誤入列表 |
| `download` | `noindex, follow` | ❌ exclude | ❌ exclude（**本提案修正現況**） | ❌ | ❌ | guidance noindex | noindex meta + 不入 sitemap（既有）+ **不入列表（新）** | 中；現況已 noindex 但**仍入列表**，本提案補齊 |
| `landing` | `index, follow`（可調） | ✅ include（可調） | ⚠️ 預設 exclude 正常文章列表 | optional | ⚠️ 視用途 | 正常輸出 | 正常 render | 中；index 但不入列表之組合須 Admin 明示 |
| `utility` | **`noindex, nofollow`** | ❌ exclude | ❌ exclude | ❌ | ❌ | 通常不發 Blogger | 沿用既有 `buildSeoNoindex` 模式，但改由 metadata 驅動 | 低；現況 hardcode，本提案 metadata 化 |
| `redirect-only` | `noindex, follow`（或 nofollow，視跳轉性質） | ❌ exclude | ❌ exclude | ❌ | ❌ | 視情況 | canonical 必 explicit；不入列表/sitemap | 中；canonical 錯置會稀釋目標頁 |

**正交組合須警示（見 §5.3）**：
- `index` + `includeInListings=false`：合法但少見（landing）。
- `noindex-*` + `includeInListings=true`：**危險**——noindex 頁卻出現在列表，誤導使用者點進不被索引的頁；Admin 應 warn。
- `gated-download` + `indexing=index`：**最危險組合**——閘門頁被索引會讓搜尋引擎直接帶人略過閘門/前導頁；Admin 應 **lock 或強警示**。

---

## 5. Admin UI implications

> 現況 Admin 為 **dev-mode-only read-only**（無 write path）。本節僅規劃「**若**未來開 write path 時」應暴露的欄位與防呆；本 preanalysis **不**推動 write path（仍 dormant）。

### 5.1 應暴露欄位

| 欄位 | 預設/進階 | 控件 | 中/英 label 建議 |
|---|---|---|---|
| `pageType` | 預設可見 | select（封閉列舉） | 頁面類型 / Page type |
| `seo.indexing` | 預設可見 | select（index / noindex-follow / noindex-nofollow） | 索引政策 / Index policy |
| `includeInListings` | 進階 | tri-state（auto / 強制 on / 強制 off） | 列入站內列表 / Include in listings |
| `includeInSitemap` | 進階 | tri-state（auto / on / off） | 列入 sitemap / Include in sitemap |
| `includeInFeeds` | 進階（dormant，標「未啟用」） | tri-state | 列入訂閱feed / Include in feeds |
| `platformPolicy.*` | 進階（合併情境才需） | per-platform sub-form | 平台覆蓋 / Platform overrides |
| `gated.mechanism` / `gated.postSubmitResource` | 條件顯示（pageType=gated-download 才出） | select | 閘門機制 / Gate mechanism |

### 5.2 default vs advanced

- **預設區**：`pageType` + `seo.indexing`（多數頁只需這兩個；其餘走推導）。
- **進階區（預設收合）**：listings / sitemap / feeds override / platformPolicy / gated 細節。
- 顯示「**目前生效值**」唯讀摘要（推導後的 effective robots / listing / sitemap），讓作者一眼看出 override 結果——對齊既有 copy-helper [14] 之「顯示解析後值」慣例。

### 5.3 須 lock / warn 的危險組合

| 組合 | 等級 | 訊息建議 |
|---|---|---|
| `gated-download` + `indexing=index` | 🔴 **lock 或 hard-warn** | 「閘門/下載頁設為可索引，搜尋引擎將略過前導頁直達資源，破壞導流漏斗。確定？」 |
| `noindex-*` + `includeInListings=true` | 🟡 warn | 「此頁不被索引，但仍會出現在站內列表，使用者可能點入不被收錄的頁。」 |
| `redirect-only` + `canonical=auto` | 🟡 warn | 「純跳轉頁的 canonical 必須明確指定目標 URL，不可用 auto。」 |
| `gated-download` 但無 `gated.mechanism` | 🟡 warn | 「閘門頁未指定閘門機制（如 google-form）。」 |
| `platformPolicy` 與頂層 `seo.indexing` 矛盾且未說明 | ℹ️ info | 顯示 effective per-platform 值，提醒這是刻意的平台差異。 |

### 5.4 「可索引的 gated-download 頁」特別防呆

per Dean 關切：gated/download 頁**預設且強烈傾向 noindex**。Admin 對「gated-download 卻 index」應屬最高層級防呆（lock 或要求二次確認 + 理由），因為這正是合併時最可能出錯、傷害最大的狀態。

---

## 6. Migration / compatibility plan（output-preserving by default）

### 6.1 現有 post 維持輸出不變

- 所有新欄位（`pageType` / `includeInListings` / `includeInSitemap` / `includeInFeeds` / `platformPolicy` / `gated`）皆 **optional**。
- 缺省時：`pageType` 視為 `article`（或直接走既有 `contentKind` + `seo.indexing` 推導），**所有 build 輸出 byte-identical**（robots meta / sitemap entries / 列表）。
- 既有 `contentKind: download` 之 `noindex,follow` + sitemap exclude 行為**不變**；本提案僅**新增** download 之「不入列表」預設——⚠️ 此為**唯一一處會改變現有輸出**的點：若目前有任何 published `download` 頁，列表會少掉它。實作 phase 須先盤點現有 download 頁數量，必要時以 `includeInListings=true` 顯式保留，或將「download 不入列表」獨立為更後面的 opt-in 子批，確保第一批純 additive。

### 6.2 已知 Blogger Google-Form 下載頁如何表達

- 該頁目前**只活在 Blogger**、repo 無記錄。建議實作時新增一個 `.md`（或先在 Admin 記錄），標：
  - `pageType: gated-download`
  - `gated.mechanism: google-form`、`gated.postSubmitResource: drive-link`
  - `seo.indexing: noindex-follow`、`includeInListings: false`、`includeInSitemap: false`
  - `platformPolicy.blogger.indexing` 記錄「後台已 NO INDEX」之事實
  - ❌ 不存 form response / Drive folder ID / 任何 token（§7.3）
- 這樣即使未來合併或重建，noindex/不列表保證**從人工 Blogger 設定升級為可攜 metadata**。

### 6.3 不破壞現有 Blogger / GitHub build

- Blogger 端：robots 仍由作者後台手動設定，系統續提供 read-only guidance（copy-helper [14] / checklist），**不嘗試 inject**。新 `pageType` 只**擴充** guidance 文案，不改既有輸出結構。
- GitHub 端：build-github / build-sitemap 之 precedence **向後相容追加**（pageType 推導插在 explicit `seo.indexing` 之後、`contentKind=download` fallback 之前或合併），缺省路徑不變。
- validator：`pageType` 走 warning-only，未知值不 break，對齊既有 baseline 漂移控制慣例。

### 6.4 分階段（建議拆批；本文件不啟動任一）

| Phase 候選 | 範圍 | 風險 |
|---|---|---|
| **SP-1** | docs：本 preanalysis（即本批） | 🟢 |
| **SP-2** | schema 定案 + `pageType` validator（warning-only）+ fixtures；不改 build 輸出 | 🟢 純 additive |
| **SP-3** | build-github robots precedence 接 `pageType` 推導（缺省輸出不變） | 🟡 |
| **SP-4** | `includeInListings` 接列表/分類/標籤 loader（先 download/gated opt-in，避免一次改現有 download 列表） | 🟡 中 |
| **SP-5** | build-sitemap 接 `includeInSitemap` 推導 + override | 🟡 |
| **SP-6** | Blogger guidance（copy-helper/checklist）擴充 pageType 文案 | 🟢 |
| **SP-7** | `platformPolicy` 平台 override（合併站需求成形時） | 🔴 高（cross-platform） |
| **SP-8** | Admin 欄位暴露 + 防呆（須先有 write path 規劃；目前 dormant） | 🔴 高 |
| **SP-9** | `includeInFeeds` + feed builder（僅合併站引入 feed 時） | 🟡 |

---

## 7. Acceptance / verification（供未來實作 session）

### 7.1 source-level checks
- frontmatter `pageType` 合法值 → validator 0 error；未知值 → 1 warning（warning-only，不 break）。
- 缺省欄位 post → 與遷移前 frontmatter 等價（無新 required 欄位）。
- `gated` 區塊**不含** secret / response / Drive ID / token（grep red-line 掃描）。

### 7.2 generated HTML checks
- `article` 頁 robots meta `index, follow`；`gated-download` / `download` `noindex, follow`；`utility` `noindex, nofollow`。
- explicit `seo.indexing` 覆蓋 pageType 推導（precedence 驗證）。
- 缺省 post 之 render HTML 與遷移前 **byte-identical**（diff 證實）。

### 7.3 sitemap / list / archive / feed checks
- sitemap 不含 `noindex-*` / `gated-download` / `download` / `utility` / `redirect-only`。
- post-list / category / tag **不含** `includeInListings=false` 頁；含預設 `article`。
- 既有 download 頁列表變動須與 §6.1 盤點一致（無意外消失/出現）。
- feed（若實作）尊重 `includeInFeeds`。

### 7.4 Blogger output checks
- copy-helper [14] / publish-checklist 對 `gated-download` 顯示正確 noindex guidance + 「後台手動 NO INDEX」提醒。
- Blogger post.html / summary / redirect-card 輸出結構不因新欄位改變（缺省 byte-identical）。

### 7.5 GitHub Pages output checks
- dist/ 之 sitemap.xml / robots.txt / 列表頁 / 文章頁 robots meta 符合矩陣。
- 合併情境模擬（若有 fixture）：`platformPolicy.pages` 生效。

### 7.6 noindex ↔ index flip 驗證
- 將某 fixture 頁 `seo.indexing` 由 `noindex-follow` 改 `index`：robots meta + sitemap inclusion 同步翻轉；listing 依 `includeInListings` 獨立不受 flip 影響（正交性驗證）。

### 7.7 Admin write-path interaction（dormant；僅規劃驗收）
- 若未來開 write path：危險組合（§5.3）觸發 lock/warn；read-only preview 顯示 effective 值；Apply 在驗收前維持 disabled。

---

## 8. 本批邊界聲明（不做事項）

| # | 項目 | 狀態 |
|---|---|---|
| 1 | 不改 `src/**`（含 build / validator / EJS / Admin） | ✅ 未動 |
| 2 | 不改 `content/**` / `settings/**` | ✅ 未動 |
| 3 | 不改 sitemap.xml / robots.txt / robots meta（線上效果） | ✅ 未動 |
| 4 | 不改 `package.json` / lockfile / `dist*` / `.cache` / gh-pages | ✅ 未動 |
| 5 | 不執行 build / deploy / preview / repost / dev server | ✅ 未執行 |
| 6 | 不動 Blogger / AdSense / GA4 / Drive / Search Console 後台 | ✅ 未動 |
| 7 | 不啟動 SP-2..SP-9 任一實作 | ✅ 僅 §6.4 預告 |
| 8 | 不改 CLAUDE.md / MEMORY.md | ✅ 未動 |
| 9 | 僅新增本 1 個 docs 檔 | ✅ |

---

## 9. Cross-links
- `docs/seo-indexing-rules.md`（indexing policy 規則總則；SEO-1/2/3 落地史）
- `docs/publish-json-schema.md` §5.3 / §5.6（Blogger URL / `blogger.type`）
- `docs/publish-bundle.md` §2.4（`contentKind` ↔ `blogger.type` 分離）
- `docs/20260610-affiliate-blocks-frontmatter-convention.md`（surface gating 慣例，供 `platformPolicy.pages` 參考）
- `CLAUDE.md` §11 / §15–§17 / §21 / §23 / §24

（本文件結束）
