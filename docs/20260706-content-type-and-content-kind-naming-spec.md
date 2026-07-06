# contentType / contentKind 命名對照規格

- 日期：2026-07-06
- 類型：docs-only 命名對照規格（**不含實作**）
- 影響分類編號（§7）：主要 A（Claude 規範 / 專案文件）、概念上關聯 C（內容資料模型）/ D（前台頁面模板）/ J（AdSense / GA4 / 追蹤）
- 狀態：**docs-level 決策 only** —— 本輪只新增本文件，不動 schema / validator / build script / template / EJS block / frontmatter / content / settings
- 前置文件：`docs/20260706-content-ad-and-campaign-page-model-decision.md`（廣告頁 / campaign page 資料模型決策）

> ⚠️ 本文件是「命名對照與 docs-level 決策」，不是「已實作規格」。文中所有 YAML 皆為 **概念示意**，不代表最終欄位名或已落地格式。任何實際 schema 欄位、validator 行為、render 策略皆須**另開 phase + user explicit approval**。

---

## A. 背景說明

目前 repo 已有 `contentKind`，但**尚未有** `contentType`。兩者不是同一層，不可互相推導或互相取代。

### 現有：`contentKind`（內容性質 / 內容表現型）

`contentKind` 放在 `.md` frontmatter（見 CLAUDE.md §11），描述「這是什麼樣的內容」，屬**內容性質 / 編輯分類 / 內容語氣**維度。現有值域：

```text
post         一般文章
tech-note    技術筆記
book-review  書評文章
download     教具下載文章
comic        四格漫畫
life-note    生活文章
page         固定頁（About / 工具目錄 / 下載索引頁等）
```

### 提出：`contentType`（內容模型 / 頁面模型）

上一份廣告 / campaign page 決策文件（`docs/20260706-content-ad-and-campaign-page-model-decision.md` §A）提出的 `contentType` 是**內容模型 / 頁面模型**維度，用來判斷頁面模型、render 策略、廣告策略、CTA 策略。建議初始值域：

```text
article        一般文章 / 部落格文
landing-page   落地頁（導單一 CTA / 轉換）
campaign-page  活動 / 推廣頁（合作促銷、導客、名單蒐集）
```

**關鍵**：`contentKind`（內容性質）與 `contentType`（頁面模型）**不是同一層**。例如一篇 `contentKind: page` 的固定頁，可能是普通 About 頁（`contentType: article`），也可能是旅遊推廣 `landing-page` 或 `campaign-page`；不能用 `contentKind` 反推 `contentType`。

---

## B. 決策：新增 contentType，不重用 contentKind

本文件正式記錄以下 **docs-level 決策**：

1. 未來應**新增獨立欄位 `contentType`**，而非擴充 / 複用既有 `contentKind`。
2. **不應**把 `landing-page` / `campaign-page` 塞進既有 `contentKind` 的值域。
3. `contentKind` **保留**為內容性質 / 編輯分類 / 內容語氣維度（值域維持 CLAUDE.md §11 現況）。
4. `contentType` **用來**判斷：頁面模型、render 策略、廣告策略（含 `adsenseMode`）、CTA 策略。
5. `contentType` 初始建議值域：
   - `article`
   - `landing-page`
   - `campaign-page`

> 註：本決策鎖定「新增獨立欄位」方向；`contentType` 的實際欄位名是否確為 `contentType`、預設值放哪一層、與 `contentKind` 的實際對應如何在 loader / validator 呈現，皆屬未來 schema phase，本文不鎖定實作細節。

---

## C. contentKind 與 contentType 的責任邊界

| 欄位 | 責任 | 範例 | 是否影響 render |
| --- | --- | --- | --- |
| `contentKind` | 內容性質 / 類型 / 編輯分類 / 內容語氣 | `post` / `tech-note` / `book-review` / `download` / `comic` / `life-note` / `page` | 影響（既有：TOC / book photo / download box 等內容區塊呈現） |
| `contentType` | 內容模型 / 頁面模型 / render 策略 / 廣告策略 / CTA 策略 | `article` / `landing-page` / `campaign-page` | 未來影響（本輪未實作；預設 `article` 時等同現況、零差異） |
| `category` | 主題分類（單一主題維度） | `travel` / `tech` / `book` | 影響（分類頁 / 麵包屑 / 列表） |
| `tags` | 細部標籤 | `github` / `static-site` / `reading-notes` | 影響（Hashtag 區塊 / 標籤頁） |
| `publishTargets` | 平台發布目標（**不是** content type） | `github` / `blogger` 之 enabled/mode | 影響輸出目標，**不決定內容模型** |
| Blogger / GitHub metadata | 平台同步資訊（**不是** content type） | `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`（`.publish.json`） | 平台回填資訊，**不決定內容模型** |
| UTM / GA4 | tracking layer（**不是** content type） | `utm_source` / `click` event / dimension | tracking 層，**不決定內容模型** |

重點：`category` 是「主題分類」（例如 travel），與 `contentType`（例如 campaign-page）**正交**。同一個 `category: travel` 底下可同時存在 `contentType: article` 的普通旅遊文章與 `contentType: campaign-page` 的旅遊推廣頁；`category` 不能推斷 `contentType`。

---

## D. 預設與相容性

第一階段必須 **additive / backward-compatible**：

- 既有文章若**沒有** `contentType`，未來 validator / render 應**預設視為 `article`**。
- **不應**立刻大規模 backfill 舊文章 frontmatter。
- 舊 frontmatter **不應**因缺少 `contentType` 而失敗。
- 缺少 `contentType` 或值域相關檢查，第一階段一律 **warning-only，不 blocking**。

也就是說：本命名規格落地後，現有 5 篇 GitHub + 11 篇 Blogger 文章（皆無 `contentType`）在未來實作階段應**視同 `article`、輸出零差異**；不得要求逐篇回填才能通過。

---

## E. 建議 frontmatter 範例（conceptual only）

> ⚠️ 以下三個範例僅為**規格示意**，**不是**本次要寫入的 content，也不代表任何正式文章。本輪不新增 / 不修改任何 `content/` 檔案。

### 1. 一般文章

```yaml
contentKind: tech-note
contentType: article
category: tech
tags:
  - github
  - static-site
```

### 2. 旅遊推廣 landing page

```yaml
contentKind: page
contentType: landing-page
category: travel
campaignPurpose: partner-promotion
```

### 3. 旅遊 campaign page

```yaml
contentKind: page
contentType: campaign-page
category: travel
campaignPurpose: tour-fill
```

再次強調：以上皆為 conceptual examples；`campaignPurpose` 等欄位同屬概念示意，實際欄位名 / 值域 / 是否落地皆留待未來 phase。

---

## F. 未來 validator 切片建議（本輪不實作）

以下記錄未來 **validator-only** 切片**可以**做什麼，本輪一律不實作：

- 若 `contentType` 存在，檢查值域是否為 `article | landing-page | campaign-page`；**warning-only，不報 error**。
- `landing-page` / `campaign-page` 若出現 `campaignPurpose`，只做 **warning-only** 檢查。
- **不碰** render、**不碰** build output、**不碰**正式文章。
- 可用 `content/validation-fixtures/` 做正負樣本（fixture-isolated，不影響 production 計數）。

---

## G. Red lines（不可混淆項目）

- `article` **不是** `landing-page`；`landing-page` **不是** `campaign-page`；三者不可互相推導。
- **不用** UTM / GA4 來判斷 content type（tracking layer ≠ content model）。
- **不用** Blogger / GitHub 發布位置來判斷 content type（platform target ≠ content model）。
- **不用** `contentKind: page` 直接等於 `landing-page` / `campaign-page`（內容性質 ≠ 頁面模型）。
- **不猜** Blogger `postId` / `publishedAt` / URL（沿用 `docs/20260706-blogger-identity-and-backfill-strategy.md` 與前決策文件 §E）。
- **不自動 backfill** 舊文章 frontmatter。

---

## 附註：本輪不做清單（red line 對齊）

本文件為 docs-only，**未**且**不得**在本輪：

- 修改 `CLAUDE.md` / `src/` / `content/` / `content/settings/` / `package.json` / lockfile
- 實作 schema / validator / build script / template / EJS block
- build / preview / deploy / push gh-pages
- 修改 deploy clone / gh-pages
- 猜測 Blogger `postId` / `publishedAt` / URL
- 自動補寫 / backfill 任何 frontmatter

上述任一項若要進行，須**各自另開 phase + user explicit approval**。
