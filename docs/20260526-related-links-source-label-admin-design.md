# 2026-05-26 Related Links / Source Label / Admin 設計文件

Phase: `20260526-night-1-related-links-source-label-admin-design-docs-only-a`
Date: 2026-05-26 20:30 (Asia/Taipei)
Type: WRITE PHASE / **docs-only / design-only**
Sole deliverable: 本檔（`docs/20260526-related-links-source-label-admin-design.md`）

---

## 0. 本文件性質與邊界

本文件**只**提出「文章相關連結 / 其他連結 / 外部來源標籤 / Admin 可管理」之**設計建議**，**不**包含實作。

本文件**不是**：

- 不是 schema 變更指令（不修改 `relatedLinks` / `otherLinks` 既有 schema）
- 不是新 settings 檔建立指令（不建立 `settings/link-sources.json` 或任何 source registry config）
- 不是 template 變更指令（不修改 `content/templates/*.md`）
- 不是 renderer 變更指令（不修改 `src/views/*.ejs`）
- 不是 Admin 變更指令（不修改 `src/scripts/admin*`）
- 不是 GA4 / UTM 變更指令（不修改 `src/scripts/ga4-url-builder.js` / `src/scripts/ga4-link-tracking-spec.md`）
- 不是 fixture 建立指令（reverse UTM pm-26 deploy gate 不解除；no positive GitHub cross-link fixture）
- 不是 build / deploy / Blogger repost / GA4 validation 啟動指令
- 不是任何 npm install / package.json 變更指令

本文件性質：**docs-only / design-only**；落地後 production state drift = 0；reverse UTM remains **landed but dormant**；pm-26 deploy gate **remains BLOCKED**。

對應上層（read-only reference）：

- `CLAUDE.md` §16（連結處理規則）
- `CLAUDE.md` §16.5（relatedLinks / otherLinks 連結處理）
- `CLAUDE.md` §17（文章頁基本版型）
- `docs/related-links-schema.md`（既有 schema canonical）
- `docs/ga4-link-tracking-spec.md`（GA4 link tracking 既有規格）
- `docs/related-links-schema.md` §7.4（kind vs link_type 兩軸命名分離）
- `docs/phase-2-candidate-roadmap.md`（後續可推進項目 roadmap）

---

## 1. Background / User Decisions

本節記錄本次設計討論之 user 決策（由 user 於 2026-05-26 night-1 session 提出）：

### 1.1 文章是否有「相關連結 / 其他連結」屬可選

- 一篇文章**不一定**會有「相關連結」或「其他連結」區塊。
- 兩個區塊**獨立**；可一者有、另一者無；可兩者皆無；可兩者皆有。
- 沿用 `docs/related-links-schema.md` §3.1 之 optional 原則；無變更。

### 1.2 連結可同時包含內部 / 外部

- 連結可能是「內部 Blogger 文章」「內部 GitHub Pages 文章」或「任意第三方外部連結」。
- 連結之 `kind` 區分 `internal` / `external`（既有 schema 定義；沿用）。
- 沿用 `docs/related-links-schema.md` §5.4 之 internal 不綁死 Blogger 原則；無變更。

### 1.3 Blogger 與 GitHub 不重複刊登同一篇文章

- Blogger 與 GitHub Pages 為**兩個內容類型不同之站台**，互相導流，但**不重複刊登**同一篇文章。
- Blogger 偏圖文、四格漫畫、教具下載、書評、生活內容。
- GitHub Pages 偏技術文章、心得文章。
- 跨站導流之 UTM 規則沿用 `CLAUDE.md` §16.4；無變更。

### 1.4 內部文章顯示標籤不應只固定成 [BLOG] / [GITHUB]

- 沿用既有 `platform` 自由字串設計（`docs/related-links-schema.md` §3.4）。
- **新主張**：顯示標籤應**優先反映內容分類 / 頻道屬性**，例如 `[貝果書屋]`（書評頻道）、`[技術文章]`（技術筆記分類）、`[生活]`（生活分類），**而非**機械化顯示 `[BLOG]` / `[GITHUB]`。
- 僅在無分類 / 頻道資料時，才 fallback 為 `[BLOG]` / `[GITHUB]` 平台識別。

### 1.5 外部連結需要來源標籤

- 外部連結需明確標示來源，例如 `[台北市立圖書館]`、`[YouTube]`、`[Netflix]`、`[博客來]`（但博客來若為聯盟連結走 `affiliate.links`；非販售之出版社頁 / 介紹頁才走本系統）。
- 沿用 `docs/related-links-schema.md` §3.4 之 `platform` 字串設計。

### 1.6 來源標籤與分類標籤未來會增加 → 應由 Admin / 設定檔管理

- 來源（如 YouTube、Netflix、台北市立圖書館、博客來、出版社官網、作者部落格）未來會逐步擴充。
- 分類 / 頻道（如 `book-review`、`tech-note`、`life-note`、未來可能新增之 `comic` / `download` / 子系列頻道）亦會擴充。
- **若每篇文章都手動輸入顯示文字**，會造成拼字 / 大小寫 / 翻譯不一致，未來難以批次修改。
- 因此應由 **Admin / 集中設定檔**統一管理「source key → 顯示文字」之對應。

### 1.7 本階段只設計，不建立 fixture

- 本階段為 docs-only / design-only。
- **不**建立任何 reverse UTM positive fixture（pm-26 deploy gate 仍 blocked）。
- **不**修改既有 schema / template / settings / src。
- 任何後續實作須另開 phase 並走 `docs/related-links-schema.md` §9 之 phase 進度框架。

---

## 2. Problem Statement

若每篇文章手動輸入「來源標籤」與「內部分類顯示文字」之純字串，會造成以下問題：

### 2.1 拼字不一致

- `YouTube` vs `Youtube` vs `youtube` vs `YOUTUBE`
- `台北市立圖書館` vs `北市圖` vs `台北圖書館`
- `Netflix` vs `NETFLIX`

### 2.2 大小寫 / 翻譯不一致

- 同一個來源在不同文章被寫成不同形式
- 英文 / 中文混用：`YouTube` vs `油管` vs `Youtube頻道`

### 2.3 未來難以批次修改

- 若決定改變顯示策略（例：`YouTube` → `[影片] YouTube`），需逐篇文章修改 frontmatter
- 若品牌名變更（例：`Twitter` → `X`）需全 repo 搜尋取代

### 2.4 GA4 / UTM / 顯示標籤可能不一致

- GA4 event parameter 若直接吃 `platform` 字串，dimension 值會被拼字差異污染
- UTM 之 `utm_source` / `utm_content` 與顯示標籤本應分離，但混用 `platform` 字串易混淆

### 2.5 外部來源與內部分類混在一起不好維護

- 既有 `platform` 欄位同時承載「`blogger` / `github`（平台識別）」「`貝果書屋`（內容頻道）」「`Youtube` / `台北市立圖書館`（外部來源）」三種語意
- 未來增加 source 時，無法快速辨識「這是新平台、新頻道、還是新外部來源？」

---

## 3. Recommended Model

**本節提出建議資料模型；不要實作。**

### 3.1 Article-level Link Entry（既有 schema 之擴充建議）

沿用 `docs/related-links-schema.md` §3.2 之 link entry 結構；建議**未來**新增以下欄位（標 ✨ 為新增建議；無 ✨ 為既有）：

| 欄位 | 型別 | 必填 | 說明 | 既有 / 建議新增 |
| --- | --- | --- | --- | --- |
| `title` | string | 是 | 連結顯示標題 | 既有 |
| `url` | string | 是 | 連結網址 | 既有 |
| `kind` | enum | 是 | `internal` / `external`（既有 `kind` 欄位之語意） | 既有 |
| `platform` | string | 是 | 來源 / 平台名稱（自由字串，沿用既有） | 既有 |
| `description` | string | 否 | 補充說明 | 既有 |
| `order` | number | 否 | 顯示排序 | 既有 |
| `target` | string | 否 | 由 build / render 自動填 | 既有 |
| `rel` | string | 否 | 由 build / render 自動填 | 既有 |
| ✨ `linkGroup` | enum | 否 | `related` / `other` / `reference` / `source`；目前以「在哪個 array」隱式表達；未來如需更細分組可顯式化 | **建議新增；本階段不落地** |
| ✨ `targetType` | enum | 否 | `internal` / `external`；建議**重新命名**自既有 `kind`；屬同概念之澄清重構（保留 backward compat） | **建議新增；本階段不落地** |
| ✨ `internalPlatform` | enum | 否 | `blogger` / `github` / `null`；當 `targetType: internal` 時指明目標平台 | **建議新增；本階段不落地** |
| ✨ `sourceKey` | string | 否 | 對應 source registry 之 key（例：`youtube` / `netflix` / `taipei-library` / `bagel-books` / `tech-note`） | **建議新增；本階段不落地** |
| ✨ `labelOverride` | string | 否 | 特殊情況覆寫 registry 之顯示文字（例：同來源不同呈現） | **建議新增；本階段不落地** |
| ✨ `trackingEnabled` | boolean | 否 | 預設 `true`；若 `false` 則不發 GA4 click event | **建議新增；本階段不落地** |
| ✨ `nofollow` | boolean | 否 | 額外標示為 nofollow（外部商業或不完全背書連結） | **建議新增；本階段不落地** |
| ✨ `sponsored` | boolean | 否 | 額外標示為 sponsored（廣告 / 業配 / affiliate）；惟 affiliate 主流仍應走 `affiliate.links` 既有 schema | **建議新增；本階段不落地** |

**重要設計原則**：

- `kind` 與 `targetType` 為**同概念**；本設計**不**強制重新命名；可保留 `kind` 為 canonical name，僅在新加欄位時對齊命名習慣。
- 既有 `platform` 為自由字串；本設計建議**新增 `sourceKey`（registry-managed）作為平行欄位**，與 `platform` 並存：
  - `sourceKey` 為「machine-readable key」，對應 registry
  - `platform` 為「fallback 顯示字串」，沿用既有自由字串
  - 兩者 fallback chain：`labelOverride` > registry lookup by `sourceKey` > `platform` 字串 > `kind` fallback（`[BLOG]` / `[GITHUB]`）

### 3.2 Source Registry / Admin-managed Labels（建議；本階段不建立）

建議**未來**新增集中設定檔，候選位置：

```text
content/settings/link-sources.json
```

或：

```text
src/settings/link-sources.json
```

或：

```text
（Admin config table；若未來有真正後台時）
```

**本階段只記錄設計，不建立此檔案**。

#### 3.2.1 每個 source entry 建議欄位

```json
{
  "sourceKey": "youtube",
  "displayLabel": "YouTube",
  "sourceType": "mediaPlatform",
  "defaultTargetType": "external",
  "defaultPlatform": null,
  "defaultRel": "nofollow noopener",
  "defaultTrackingPolicy": {
    "ga4EventEnabled": true,
    "linkType": "external"
  },
  "isActive": true,
  "sortOrder": 100,
  "note": "影音來源；非販售；不需 sponsored"
}
```

| 欄位 | 型別 | 必填 | 說明 |
| --- | --- | --- | --- |
| `sourceKey` | string | 是 | 唯一 key；kebab-case 建議；例：`youtube` / `taipei-library` / `bagel-books` |
| `displayLabel` | string | 是 | 顯示文字；例：`YouTube` / `台北市立圖書館` / `貝果書屋` |
| `sourceType` | enum | 是 | `internalCategory` / `internalPlatform` / `externalSite` / `mediaPlatform` / `library` / `brand` / `affiliate` / `custom` |
| `defaultTargetType` | enum | 是 | `internal` / `external`；多數 source 為 `external` |
| `defaultPlatform` | string \| null | 否 | 僅 `internalCategory` / `internalPlatform` 類型可填（例：`blogger` / `github`）|
| `defaultRel` | string | 否 | 預設 rel 字串；若 affiliate 類型則為 `sponsored nofollow noopener noreferrer` |
| `defaultTrackingPolicy` | object | 否 | `{ ga4EventEnabled, linkType }`；linkType 對應 GA4 之 `link_type` param（per `docs/related-links-schema.md` §7.4 兩軸命名） |
| `isActive` | boolean | 是 | 是否啟用；停用之 source 仍保留歷史資料可顯示，但 Admin 下拉選單不顯示 |
| `sortOrder` | number | 否 | Admin 下拉選單排序 |
| `note` | string | 否 | 內部備註；不公開顯示 |

#### 3.2.2 sourceType 列舉值之語意

| sourceType | 語意 | 範例 |
| --- | --- | --- |
| `internalCategory` | 本站內部分類 / 頻道 | `bagel-books`（貝果書屋）/ `tech-note`（技術文章）/ `life-note`（生活）/ `download`（教具下載）|
| `internalPlatform` | 本站平台識別（fallback 使用）| `blogger` / `github` |
| `externalSite` | 一般第三方網站 | `official-site`（出版社官網）/ `author-blog`（作者部落格）|
| `mediaPlatform` | 媒體 / 影音平台 | `youtube` / `netflix` / `vimeo` / `spotify` |
| `library` | 圖書館 / 公部門資源 | `taipei-library`（台北市立圖書館）/ `nclpi`（國家圖書館）|
| `brand` | 品牌 / 機構 | `publisher-finekarmel`（方智出版社）|
| `affiliate` | 聯盟販售（**仍建議走 `affiliate.links` 既有 schema**；此 sourceType 為極端 fallback）| `books-com`（博客來；如非聯盟形式）|
| `custom` | 一次性 / 未來補類型 | — |

### 3.3 與 `affiliate.links` 之關係（再次強調）

- 販售連結走 `affiliate.links`（既有 schema；CLAUDE.md §12 / `docs/related-links-schema.md` §6）
- 本系統 `sourceKey` 預設**不包含**販售連結；如有特殊情境，可標 `sourceType: "affiliate"`，但**建議優先**使用 `affiliate.links`

---

## 4. Display Label Rules

建議顯示標籤之 fallback chain（從高優先到低優先）：

### 4.1 優先級

1. **`labelOverride`**（若 entry 有此欄位且非空）→ 使用 `labelOverride`
2. **registry lookup by `sourceKey`**（若 entry 有 `sourceKey` 且 registry 有對應 entry 且 `isActive: true`）→ 使用 `registry.displayLabel`
3. **internal + 分類優先**：若 `kind === "internal"` 且該文章有明確 `category`（per `content/settings/categories.json`）→ 顯示分類 / 頻道名稱（例：`[貝果書屋]` / `[技術文章]` / `[生活]`）
4. **既有 `platform` 字串**（沿用）→ 使用 `platform` 自由字串
5. **fallback 平台識別**：若 `kind === "internal"` 但無分類資料 → 使用 `[BLOG]` / `[GITHUB]` 等平台識別字串

### 4.2 顯示範例

| 情境 | entry 欄位 | 顯示結果 |
| --- | --- | --- |
| 有 labelOverride | `labelOverride: "[特別企劃] YouTube"` | `[特別企劃] YouTube` |
| 有 sourceKey，無 override | `sourceKey: "youtube"`（registry: `YouTube`） | `[YouTube]` |
| internal + 有分類 | `kind: internal`, target post 之 `category: "book-review"` | `[書評]` 或 `[貝果書屋]`（若 registry 有 channel-level 對應）|
| internal + 無分類 | `kind: internal`, target post 無明確 category | `[BLOG]` 或 `[GITHUB]`（fallback）|
| 純 platform 字串 | `platform: "出版社官網"` | `[出版社官網]` |

### 4.3 顯示標籤 ≠ SEO hashtag（兩者可分離）

- 顯示標籤（display label）：UI 顯示在連結前綴，供讀者辨識來源
- SEO hashtag：文章末尾之 hashtag 區塊（per `CLAUDE.md` §14）
- 兩者**可由文章 metadata 預設帶出**，但**應保持可分離**：
  - 顯示標籤偏短、辨識性強（例：`[YouTube]`）
  - SEO hashtag 偏長尾、關鍵字導向（例：`#YouTube #吳淡如 #podcast`）

---

## 5. Admin UX Recommendation

建議 Admin（未來實作）支援以下管理操作：

### 5.1 Source Registry 維護

- Admin 可**檢視**現有 source 清單（顯示 `sourceKey` / `displayLabel` / `sourceType` / `isActive`）
- Admin 可**新增** source（填寫 `sourceKey` / `displayLabel` / `sourceType` 等欄位）
- Admin 可**編輯** source（修改 `displayLabel` / `sortOrder` / `note` 等）
- Admin 可**停用** source（`isActive: false`）；**不刪除**舊資料，避免歷史文章顯示中斷
- Admin 可**重新啟用** source（`isActive: true`）

### 5.2 撰寫文章時之連結來源選擇

- 寫文章時，連結之來源由**下拉選單**選擇 `sourceKey`，**不**重打顯示文字
- 下拉選單依 `sortOrder` 排列；只顯示 `isActive: true` 之 source
- 下拉選單可**搜尋過濾**（避免 source 過多時不好找）
- 選擇後：
  - frontmatter 自動填 `sourceKey: "<選擇值>"`
  - 預覽時顯示 `[<displayLabel>]`
- 若需特殊顯示，作者可填 `labelOverride`（罕用；不鼓勵）

### 5.3 預設值管理

- Admin 可設定每個 source 之預設 `rel` / `nofollow` / `sponsored` / `trackingPolicy`
- 撰寫文章時，建立新 link entry 後自動帶入該 source 之預設值；作者可逐筆覆寫

### 5.4 內部分類顯示名稱管理

- 既有 `content/settings/categories.json` 已含 `id` / `name` / `slug` / `site`
- 建議**未來**擴充 `categories.json`，新增 `channelLabel` 欄位（例：`book-review` → `channelLabel: "貝果書屋"`）
- internal link fallback 至此 channelLabel；若無則 fallback 至 category `name`；最終 fallback 至 `[BLOG]` / `[GITHUB]`

### 5.5 Blogger hashtags / FB hashtags / 來源標籤 三者獨立

- 三者語意不同：
  - **Blogger hashtags**：Blogger 文章底部 hashtag（per 既有設計）
  - **FB hashtags**：FB 推廣文案 hashtag（per `CLAUDE.md` Phase 4）
  - **來源標籤（本設計）**：連結前綴顯示文字
- 三者可從文章 metadata 預設帶入，但**應保持可分離編輯**
- Admin UX 應於不同 panel / section 編輯，避免混淆

---

## 6. GA4 / UTM / Reverse UTM Considerations

### 6.1 sourceKey 作為 GA4 event parameter 候選

- `sourceKey` 為 machine-readable key，建議**未來**作為 GA4 event parameter（例：`link_source_key`）
- 對應 `docs/related-links-schema.md` §7.4 之兩軸命名：
  - `link_source_key`（新加）：作者標記之 source identifier（registry-managed）
  - `link_type`（既有）：系統依 URL hostname / cross-site fingerprint 派生之 destination type
- 兩者**獨立**；可同時送出，提供不同維度之 GA4 報表

### 6.2 displayLabel 不建議作為 tracking key

- `displayLabel` 為 UI 顯示文字；可能因品牌更名、翻譯調整、A/B 測試而變動
- GA4 dimension 之穩定性要求高 → 應使用 `sourceKey`（穩定）；`displayLabel` 僅作 UI 顯示

### 6.3 internal Blogger ↔ GitHub link 之保留欄位

- 若未來進入 reverse UTM 流程（per `CLAUDE.md` §16.4）：
  - 需保留 `targetType: internal` 與 `internalPlatform: blogger | github`（或 `kind: internal` + `platform: blogger | github`）
  - 系統據此判斷是否為跨平台 self-link，套用 cross-site UTM 注入
- 本設計**不改變**既有 reverse UTM 邏輯；既有 `kind` + URL hostname 判斷沿用

### 6.4 reverse UTM 當前狀態（無變更）

- reverse UTM remains **landed but dormant**（per `CLAUDE.md` §16.4）
- pm-26 deploy gate remains **BLOCKED**（per `docs/20260526-natural-reverse-utm-fixture-topic-plan.md` §2 / `docs/20260526-reverse-utm-positive-fixture-scan-report.md`）
- blocked reason：**no positive GitHub cross-link fixture**
- 本設計文件**不**建立 fixture，**不**啟動 deploy / Blogger repost / GA4 validation
- 本設計**不**改變 reverse UTM 之 dormant 狀態

---

## 7. SEO / Content Risk Notes

### 7.1 來源標籤是 UI 輔助，不應大量塞關鍵字

- 顯示標籤目的：協助讀者辨識來源、提升可讀性
- **不應**將 SEO 關鍵字塞入 `displayLabel`（例：`displayLabel: "YouTube 影片 推薦 必看 2026"` ❌）
- 關鍵字應走文章內 SEO hashtag / `tags` / `description` / `searchDescription`

### 7.2 外部連結若是廣告 / 業配 / affiliate

- 應支援 `sponsored` / `nofollow` 標記
- **主流**販售連結仍走 `affiliate.links` 既有 schema（自動套 `sponsored nofollow noopener noreferrer`）
- 本設計之 `sponsored: true` / `nofollow: true` 為**邊緣情境**之 fallback（例：作者推薦但非聯盟形式之店家頁）

### 7.3 內部連結應避免過度重複堆疊

- 同一目標文章不應在 `relatedLinks` 與 `otherLinks` 重複出現
- 同主題之內部連結不宜超過 3-5 筆；避免關鍵字堆疊嫌疑
- Admin 可於 build 時加 lint 警告（**未來**功能）

### 7.4 相關連結區塊應以讀者價值為主

- 連結篩選原則：對讀者**有實質參考價值**
- **不應**為 SEO 而塞入低品質連結（例：與主題無關之自家舊文）
- 既有 `blocks.relatedPosts: true` 之自動推薦區塊有其位置；本系統屬**作者主動策劃**

---

## 8. Future Implementation Candidates

以下為**未來**可拆分之 phase 候選；本文件**不**啟動任何子批：

### Phase A. Read-only schema audit（純分析）

- 範圍：盤點現有 `relatedLinks` / `otherLinks` 之 usage；統計 distinct `platform` 字串
- 產出：分析報告 docs；無 source 變更
- 風險：🟢 低

### Phase B. Add source registry config

- 範圍：新增 `content/settings/link-sources.json`；初版 seed source list
- 產出：JSON config + docs schema
- 風險：🟢 低（純 additive；既有文章不受影響）

### Phase C. Add template sample metadata

- 範圍：`content/templates/*.md` 各 template 之 `relatedLinks` / `otherLinks` sample 補入 `sourceKey` 範例
- 產出：template 更新
- 風險：🟢 低（template 不被 build 掃描）

### Phase D. Add renderer support

- 範圍：`src/views/pages/post-detail.ejs` + `src/views/blogger/blogger-post-full.ejs` 之 render 邏輯支援 fallback chain（`labelOverride` > registry lookup > `platform` > fallback）
- 產出：EJS template 變更 + helper function
- 風險：🟡 中（既有 dist 端 byte-identical-modulo-builtAt 需驗證）

### Phase E. Add Admin selector support

- 範圍：Admin 後台新增 source selector 下拉選單；連結編輯時可選 `sourceKey`
- 產出：Admin UI + write logic
- 風險：🟡 中（屬 Admin write 系列；需 atomic write）

### Phase F. Add GA4 event parameter support

- 範圍：`link_source_key` GA4 event parameter 加入既有 click event；ga4-link-tracking-spec.md 更新
- 產出：source 變更 + spec docs
- 風險：🟡 中（GA4 production dimension；需 preflight）

### Phase G. Add validation / smoke tests

- 範圍：validate rules（`source-key-invalid` / `source-key-not-found` / `source-inactive`）+ fixtures
- 產出：validate-content.js 規則 + content/validation-fixtures/
- 風險：🟢 低（warning-only；fixture-driven）

### Phase H. Reverse UTM validation（僅於 positive fixture 出現後）

- 範圍：當未來自然產出 positive GitHub cross-link fixture 後，方可進入 pm-26 deploy gate 流程
- 阻擋條件：必須先有 positive fixture（per `docs/reverse-utm-fixture-plan.md` §3）
- 產出：deploy + Blogger repost + GA4 validation
- 風險：🔴 高（首次 Blogger 後台重貼 + GA4 production validation）
- 本文件**不**啟動此 phase

---

## 9. Non-goals

本階段**明確不做**以下事項：

- ❌ 不改 `src/`（不改任何 EJS / JS / SCSS）
- ❌ 不改 `content/templates/`（不修改 template frontmatter / body）
- ❌ 不改 `content/settings/`（不新增 `link-sources.json`；不修改 `categories.json`）
- ❌ 不新增 `content/posts/`（不建立任何新文章）
- ❌ 不建立 Blogger / GitHub Pages fixture（不解除 pm-26 deploy gate）
- ❌ 不 build（不 `npm run build` / `build:github` / `build:blogger` / 任何 build script）
- ❌ 不 deploy（不 push gh-pages；不改 dist / dist-blogger）
- ❌ 不 Blogger 後台重貼
- ❌ 不 GA4 validation
- ❌ 不 npm install / 不改 `package.json` / 不改 `package-lock.json`
- ❌ 不 commit 任何非 docs 檔案（commit scope 嚴格限於本檔）
- ❌ 不啟動 reverse UTM pm-26 deploy gate；pm-26 remains BLOCKED
- ❌ 不解除 reverse UTM dormant 狀態；reverse UTM remains landed but dormant
- ❌ 不修改既有 `docs/related-links-schema.md`（本文件**補充設計**；不取代既有 canonical schema）

---

## 10. 相關文件

### 10.1 上層規範

- `CLAUDE.md` §3.1（文章 frontmatter）
- `CLAUDE.md` §16（連結處理規則）
- `CLAUDE.md` §16.5（relatedLinks / otherLinks 連結處理）
- `CLAUDE.md` §17（文章頁基本版型）

### 10.2 既有 schema

- `docs/related-links-schema.md`（既有 canonical schema）
- `docs/related-links-schema.md` §3.4（platform 命名規則）
- `docs/related-links-schema.md` §5.4（internal 不綁死 Blogger）
- `docs/related-links-schema.md` §7.4（kind vs link_type 兩軸命名分離）

### 10.3 GA4 / UTM 既有規格

- `docs/ga4-link-tracking-spec.md`
- `docs/ga4-parameter-naming-registry.md`
- `docs/ga4-click-tracking-coverage-audit-20260524.md`

### 10.4 reverse UTM 現況

- `docs/reverse-utm-fixture-plan.md`
- `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`
- `docs/20260526-reverse-utm-positive-fixture-scan-report.md`
- `docs/20260526-natural-reverse-utm-fixture-topic-plan.md`

### 10.5 Roadmap

- `docs/phase-2-candidate-roadmap.md`
- `docs/future-roadmap.md`

---

（本文件結束）
