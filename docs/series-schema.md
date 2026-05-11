# 系列文章 Metadata 規格 (Series Metadata Schema)

本文件為「系列文章」（series）之 metadata 規格。所有讀取、寫入、驗證系列欄位之實作皆須以本文件為準。

對應之上層規範詳見：
- `docs/publish-bundle.md` §2.6.1（內容屬性放 `.md` frontmatter 之硬性原則）
- `docs/publish-json-schema.md` §2（series 不屬 `.publish.json`）
- `docs/fb-sidecar-schema.md` §3（`.fb.md` frontmatter 與 series 之關係）

本文件之實作落地時機為 **Phase 8-e-2 之後**；Phase 8-e-1 階段僅交付規格文件，**不寫程式、不建立 sample、不接入任何 caller**。

---

## §1 定位：series 是內容屬性，不是平台回填資料

### 1.1 series 屬內容屬性

「系列文章」之相關欄位（`series.id` / `name` / `nameEn` / `number` / `subtitle` / `titleTemplate` / `hashtags` 等）屬**內容屬性**，定義文章在主題層級之歸類關係。其性質：

- 文章創作時即決定，發布後幾乎不變動
- 與平台無關，Blogger / GitHub Pages / FB 皆共用同一份 series metadata
- 屬內容創作層級之語意分組（例：書評系列、教學系列、漫畫系列）

### 1.2 series 不屬平台回填資料

下列為 series 之**非**性質：

- ❌ 不是平台發布狀態（與 `.publish.json` `blogger.status` / `github.status` 為不同層級）
- ❌ 不是 URL 推導依據（與 `blogger.publishedUrl` / `github.publishedUrl` 無關）
- ❌ 不是發布時間欄位（與 `publishedAt` 無關）
- ❌ 不是平台特定 metadata（與 `blogger.permalink` / `github.path` 無關）

由 §1.1 與 §1.2 之分工原則，series 不放 `.publish.json`；亦不放 `.fb.md`（FB 推廣文案層級）。

### 1.3 series 之跨平台共用原則

series metadata 為 Blogger / FB / GitHub Pages / 未來搬家平台**共用之單一資料來源**。各平台 build 階段讀取同一份 series metadata，依平台之 render 邏輯轉換為對應輸出。

由此衍生：

- 未來文章從 Blogger 搬到 GitHub Pages 時，`series.id` 保持不變，所有歷史文章之系列歸屬自動維持
- 未來新增第三平台時，亦不需重新標註系列；只需在新平台之 render 階段讀取既有 `series.id`

---

## §2 series 欄位字典

### 2.1 欄位總表

series 為 `.md` frontmatter 之頂層欄位（與 `title` / `slug` / `category` / `tags` 同層），形式為 object：

| 欄位 | 型別 | 必填 | 預設值 | 說明 |
| --- | --- | --- | --- | --- |
| `series.id` | string | 是* | — | 穩定識別碼；**不因 `series.name` 修改而改變**；用於跨平台關聯 |
| `series.name` | string | 是 | — | 系列中文名稱；可後續修改而不影響 `series.id` |
| `series.nameEn` | string | 否 | `""` | 系列英文名稱；保留供未來 GitHub / SEO / metadata 使用 |
| `series.number` | number | 是 | — | 系列序號；正整數；**非發布順序**（詳見 §4） |
| `series.subtitle` | string | 否 | `""` | 單篇副標；例：「提問筆記本」 |
| `series.titleTemplate` | string | 否 | `""` | 標題組合規則；含 placeholder（詳見 §2.4） |
| `series.hashtags` | array of string | 否 | `[]` | 系列預設 hashtags；可被單篇覆寫（詳見 §8） |

*「必填*」之語意：當文章 frontmatter 出現 `series:` 區塊時，`series.id` 與 `series.number` 不得省略；若文章不屬於任何系列，整個 `series` 區塊可完全省略。

### 2.2 `series.id`：穩定識別碼

`series.id` 設計目的為「跨時間穩定識別」：

- 一旦選定，不得變更；變更等同於建立新系列
- 中文名稱（`series.name`）修改不影響 `series.id`
- 命名建議使用 ASCII slug 格式：小寫、英數、連字號（例：`bagel-bookstore-ai-self-media`）
- 不可使用空字串、純數字、含空白

`series.id` 之語意責任：作者主動命名並維護；系統不自動產生。

### 2.3 `series.name` 與 `series.nameEn`

`series.name` 為系列之**人類可讀**名稱，於各平台 render 階段使用（標題模板、頁面標題、麵包屑等）。

例：

```yaml
series:
  id: "bagel-bookstore-ai-self-media"
  name: "自媒自創：AI玩轉自媒體的52個商業思維"
  nameEn: "We-Media Myself: 52 AI-Powered Business Thinking"
```

- `series.name` 為必填，必須為非空字串
- `series.nameEn` 為選填，保留欄位；FB 端目前可不顯示，但欄位應保留以利未來使用（同 §7 之 titleEn 規則）

### 2.4 `series.titleTemplate`

`series.titleTemplate` 為**標題組合規則**，定義系列文章之標題如何由 `series.name` / `series.number` / `series.subtitle` 組合。

例：

```
series.titleTemplate: "[貝果書屋] 《{series.name}》#{series.number}({series.subtitle})"
```

組合結果：

```
[貝果書屋] 《自媒自創：AI玩轉自媒體的52個商業思維》#2(提問筆記本)
```

支援之 placeholder：

- `{series.name}` → `series.name`
- `{series.nameEn}` → `series.nameEn`
- `{series.number}` → `series.number`（無零填充；`2` 不是 `02`）
- `{series.subtitle}` → `series.subtitle`

placeholder 比對採單大括號 `{key}` 形式，**獨立於** `docs/fb-sidecar-schema.md` §5 之雙大括號 URL placeholder（`{{ articleUrl }}` 系列）；兩套 placeholder 不交叉、不相互覆蓋。

未列 placeholder 之名稱皆視為 unknown，build / validate 階段依後續批次之 severity 規則處置。

### 2.5 `series.hashtags`

`series.hashtags` 為系列預設 hashtags，型別為字串陣列。每個元素建議帶 `#` 號（與 `.fb.md` frontmatter `hashtags` 一致）。

例：

```yaml
series:
  hashtags:
    - "#貝果書屋"
    - "#書評"
```

此欄位作為**系列預設值**；單篇文章仍允許於 frontmatter / `.fb.md` 中覆寫（詳見 §8）。

---

## §3 `series.id` 穩定性保證

### 3.1 不可變原則

`series.id` 一旦寫入第一篇文章 frontmatter，**不得修改**。修改視為「建立新系列、捨棄舊系列」之語意。

### 3.2 合法情境：修改 `series.name` 而不動 `series.id`

下列為合法情境：

- 系列中文名稱因翻譯 / 行銷需求調整 → 修改 `series.name`，**保留** `series.id`
- 系列副標 / titleTemplate 隨經驗演化 → 修改對應欄位，**保留** `series.id`
- 系列 hashtags 補充 → 修改 `series.hashtags`，**保留** `series.id`

### 3.3 違反穩定性之後果

若擅自修改 `series.id`，後果包括：

- 既有文章與新文章被視為「兩個獨立系列」
- 跨平台 metadata 對應斷裂（Blogger / GitHub Pages 後台之系列頁可能分裂）
- 自動建議序號邏輯（§5）失效，造成新文章序號重複

---

## §4 發布順序：`series.number` 不是排序依據

### 4.1 發布順序與系列編號為兩件事

系列文章之 `series.number` 為**創作層級**之編號，**不一定**等同於發布順序。

實際情境：

- 可能先發布 `#1` 或 `#2`
- 也可能 `#1` 發布後下一篇先發 `#4`，之後再回來發 `#3`
- 也可能系列尚未補齊（仍有空缺號）

### 4.2 系統不得用 `series.number` 當排序依據

下列輸出之排序**不得**以 `series.number` 為依據：

- 文章列表頁、首頁文章卡片、分類頁、標籤頁
- 系列頁（若未來實作）之預設排序（除非作者明確選擇「依系列序排序」）
- sitemap 排序
- RSS / feed 排序

### 4.3 應使用之排序欄位

實際輸出排序應以下列欄位為依據（**正向序由近至遠**）：

- `.publish.json` `{platform}.publishedAt`（平台層發布時間）
- `.md` frontmatter `date`（內容創作日期）
- `.publish.json` `{platform}.status`（平台層發布狀態；`published` > `ready` > `draft`）
- 各 build script 之既有排序規則（沿用 Phase 1-7 不變）

具體排序欄位優先序由各 build script 之規格決定，本文件不另強制。

---

## §5 自動建議序號規則

### 5.1 觸發時機

當作者使用 `new:post` 之類工具新增文章，並於 frontmatter 標註 `series.id` 或 `series.name` 時，系統可**自動建議** `series.number`。

本規則屬**工具輔助**，非強制驗證；`validate-content` 不得僅因序號未補缺而報 error。

### 5.2 建議邏輯：補缺號優先

建議邏輯：

1. **掃描既有同 `series.id` 之所有文章**之 `series.number`
2. **若有缺號**，建議最小之缺號
   - 例：已有 `#1 / #2 / #4`，下一篇建議 `#3`
3. **若無缺號**，建議「最大號 + 1」
   - 例：已有 `#1 / #2 / #3`，下一篇建議 `#4`
4. **若該系列尚無任何文章**，建議 `#1`

### 5.3 重號處理

若作者手動指定之 `series.number` 與既有文章衝突：

- `validate-content` 列為 warning（不擋 build）
- 提示作者：「同系列 `series.id={id}` 已有 `series.number={n}` 之文章 `{slug}`；是否確認重號？」

具體 warning 訊息格式留待 Phase 8-e-4 之 `validate-content` 規則定義。

### 5.4 作者覆寫權

無論系統建議為何，**作者必須可以手動覆寫** `series.number`。

合法覆寫情境：

- 作者已私下規劃系列骨架（`#1 / #5 / #10` 為三大里程碑），中間 `#2 / #3 / #4` 為填充內容
- 作者刻意採非連續編號（如「番外篇」用 `#99`）
- 作者跨系列借用編號（不建議，但不擋）

### 5.5 重新建議

若作者於 frontmatter 修改 `series.id`（合法情境僅限「文章一開始就標錯系列」），系統可重新執行 §5.2 建議邏輯。

---

## §6 Blogger title 與 FB title 的關係

### 6.1 預設相同

`.md` frontmatter `title`、`.publish.json` `seo.metaTitle`、`.fb.md` frontmatter `title` 三者於初始建立時**預設相同**。

目的：

- **SEO 一致性**：Blogger 文章標題、搜尋結果標題、社群分享標題對齊，避免 Google Search 與 Facebook 預覽顯示不同標題造成混淆
- **工作流簡化**：作者只需於一處決定標題，三平台同步繼承

### 6.2 預設來源優先序

預設值之取得順序：

1. `series.titleTemplate` 套用後之結果（若文章含 `series` 區塊且 `titleTemplate` 非空）
2. `.md` frontmatter `title`（若無 series titleTemplate）

### 6.3 各平台可後續手動修改

下列三處之 title **皆允許後續手動修改**：

- `.md` frontmatter `title` → 文章層級標題
- `.publish.json` `seo.metaTitle` → SEO override 標題（不修改文章本體標題）
- `.fb.md` frontmatter `title` → FB 推廣文案標題（不修改文章本體）

### 6.4 不應永久鎖死

三處 title **不應**被永久鎖死同步：

- 系統不應於 build 階段強制三者一致
- `validate-content` 不應對「三者不同」報 error
- 若作者明確將 FB title 改短（適合社群閱讀），或 SEO metaTitle 改長（含關鍵字），應允許保留差異

差異存在時，build / validate 不阻擋；具體 info / warning 規則之落地時機由 Phase 8-e-4 之後決定。

---

## §7 `titleEn` 規則

### 7.1 欄位保留原則

Blogger 與 FB metadata **皆應保留** `titleEn` 欄位：

- `.md` frontmatter `titleEn`（既有；CLAUDE.md §3.1 範例）
- `.fb.md` frontmatter `titleEn`（**新增欄位；本批不擴大實作，僅規格化**；具體新增時機由 Phase 8-e-2 之後決定）

### 7.2 顯示與否

FB 端**目前可暫不顯示** `titleEn`：

- `.fb.md` body 內不強制使用 `titleEn`
- `build-promotion` 不主動輸出 `titleEn` 至 `.txt`

但欄位**應保留**，方便未來 FB 端決定顯示時直接啟用，不需回頭補資料。

### 7.3 預設來源

`.fb.md` 之 `titleEn`（未來新增後）預設值來源：

1. `.md` frontmatter `titleEn`（最常見情境）
2. `series.nameEn` + `series.number` 之 placeholder 組合（若文章屬系列，且作者未明確指定）
3. 留空（若以上皆無）

具體 placeholder 規則由 Phase 8-e-2 之後規範。

---

## §8 hashtags 規則

### 8.1 預設相同

`.md` frontmatter `tags`、`.fb.md` frontmatter `hashtags` 之預設來源原則上相同。

實際 build 階段轉換：

- `.md` `tags` 為短 slug 形式（例：`github`, `vite`），用於 GitHub 站之 tag 頁產生
- `.fb.md` `hashtags` 為帶 `#` 號之顯示形式（例：`#貝果書屋`, `#書評`），用於 FB 貼文輸出

兩處之預設**內容語意相同**，僅輸出格式略異。

### 8.2 從 series 預設值帶出

當文章屬系列時（`series.id` 非空），下列來源為 hashtags 之預設候選（依優先序）：

1. `series.hashtags`（系列預設）
2. **同系列第一篇文章**之 `.fb.md` `hashtags`（若系列尚未定義 `series.hashtags`）
3. 留空

「同系列第一篇文章」之判定：依 `series.number` 排序之最小號（不依發布順序，沿用 §4）。

### 8.3 單篇可 override

每篇文章皆允許於下列兩處之一覆寫 hashtags：

- `.md` frontmatter `tags`（GitHub 站使用）
- `.fb.md` frontmatter `hashtags`（FB 推廣使用）

`series.hashtags` **不**作為單篇 override 機制；該欄位屬系列定義層，作者修改即等同修改整個系列。

### 8.4 覆寫策略：完整覆蓋

單篇 override 時，**完整覆蓋**系列預設（**不**合併）。若作者欲在系列預設上補充單篇 hashtag，需於文章 frontmatter / `.fb.md` 寫入完整列表（含繼承自系列之既有 hashtag）。

「自動合併」之策略不採用，理由：

- 合併策略易產生 hashtag 重複（系列 hashtag 與單篇 hashtag 衝突）
- 作者意圖難以從合併結果反推
- 完整覆蓋之心智模型更直觀

---

## §9 與 `.publish.json` 之分工

### 9.1 series 不放 `.publish.json`

依 §1.1 / §1.2 之分工原則，series 屬內容屬性，**不放** `.publish.json`。

`.publish.json` 僅承載**平台發布狀態與回填資料**（canonical / ogImage / blogger / github / seo），不承載內容語意分組。

### 9.2 對 `docs/publish-json-schema.md` 之補充

`docs/publish-json-schema.md` §2 之頂層欄位清單**不新增** series。本文件 §1 與 `publish-json-schema.md` §2 之 cross-link 由本批之 `publish-json-schema.md` 修訂補上。

### 9.3 違反者

若作者誤將 series 寫入 `.publish.json`：

- `validate-content` 列為 warning（沿用 `docs/publish-bundle.md` §2.6.4 之硬性原則）
- 不阻擋 build
- 提示作者：「series 應位於 `.md` frontmatter 或集中設定檔；請參考 `docs/series-schema.md`」

具體 warning 規則之落地時機由 Phase 8-e-4 之後決定。

---

## §10 與 `.fb.md` 之分工

### 10.1 `.fb.md` 目前不含 series 欄位

依 `docs/fb-sidecar-schema.md` §3.1，`.fb.md` frontmatter 第一版定義為 7 欄位（`enabled` / `page` / `target` / `customUrl` / `hashtags` / `title` / `note`），**不含** series 相關欄位。

本批維持此設計，**不於 `.fb.md` schema 新增** `seriesId` / `seriesNumberOverride` / `seriesSubtitle` 等欄位。

### 10.2 `titleEn` 欄位之擴充

依 §7.1，`.fb.md` frontmatter 未來將新增 `titleEn` 欄位。**本批僅規格化**；具體新增時機與 `fb-sidecar-schema.md` §3.1 表格之擴充留待 Phase 8-e-2 之後。

### 10.3 後續批次擴充欄位（佔位）

下列欄位為「後續批次待定」之佔位記錄：

- `titleEn`：英文標題（詳見 §7）
- `seriesNumberOverride`：單篇覆寫系列序號（極少數情境；詳見 §5.4）
- `hashtagsInheritFromSeries`：是否從 series 繼承 hashtags 之顯式開關（若 §8 之預設繼承策略未來需要明確控制；目前採「自動繼承 + 單篇完整覆蓋」策略，未必需要此欄位）

以上欄位**本批不擴大**，僅作為設計預告。`.fb.md` schema 之實際新增需另開規格批次。

---

## §11 series 集中管理位置（建議）

### 11.1 兩種候選

series metadata 之存放位置有兩種候選：

| 候選 | 位置 | 優點 | 缺點 |
| --- | --- | --- | --- |
| A | 分散於 `.md` frontmatter（每篇文章 `series:` 區塊） | 與文章內容並存；搬家直觀 | 同系列 id / name / hashtags 重複；修改系列名稱需逐篇改 |
| B | 集中於 `content/settings/series.json`；文章 frontmatter 僅引用 `series.id`、`series.number`、`series.subtitle` | 單一資料來源；修改系列名稱僅一處 | 文章脫離 settings 無法獨立解析 |

### 11.2 建議：候選 B + 文章層覆寫

建議採用**候選 B 為主、文章層可覆寫**之混合策略：

- `content/settings/series.json` 定義所有系列之 `id` / `name` / `nameEn` / `titleTemplate` / `hashtags`（系列層欄位）
- `.md` frontmatter `series:` 區塊**必填** `id` 與 `number`，並可選提供 `subtitle`，與單篇覆寫之 `name` / `hashtags`
- build 階段以「文章層覆寫優先；無覆寫時 fallback 至 settings」之策略合併

具體實作時機由 Phase 8-e-2 之後決定。本文件 §11 為設計建議，不視為硬性規格。

### 11.3 `content/settings/series.json` 結構

Phase 8-e-4 落地之正式結構（範本 `content/settings/_sample.series.json`）：

```json
{
  "series": [
    {
      "id": "we-media-ai-52",
      "name": "自媒自創：AI玩轉自媒體的52個商業思維",
      "nameEn": "We-Media with AI: 52 Business Thinking Notes",
      "titleTemplate": "[貝果書屋] 《{series.name}》#{series.number}({series.subtitle})",
      "hashtags": ["#貝果書屋", "#自媒自創", "#AI自媒體"]
    }
  ]
}
```

頂層為 object，含 `series` array；每筆系列為 object，含 `id` / `name` / `nameEn` / `titleTemplate` / `hashtags`。

採 array-of-objects 而非 object-keyed 之原因：

- 陣列可保留作者定義之系列序列，便於日後增加排序屬性
- 避免 `series.id` 含特殊字元時造成 JSON object key 之表達限制

`loadSettings()` 已於 **Phase 8-f-1**（commit `e2d50c5`）接入 `series.json`；`normalize-post-output.js` 已於 **Phase 8-f-3-b**（commit `dfbd35e`）透過 `settings.series.series` array 查表並產出 `normalized.series`（詳見 §15）。**EJS / build scripts / promotion / copy-helper 之接入屬後續批次**（詳見 §15.6）。

---

## §12 跨平台搬家相容性

### 12.1 series 為跨平台共用欄位

series metadata 一旦寫入，跨 Blogger / GitHub Pages / FB / 未來平台**完全共用**：

- 文章從 Blogger 搬到 GitHub Pages：`series.id` 不變，所有歷史文章之系列歸屬自動維持
- 新增第三平台（例：Substack / Medium）：新平台 build 階段讀取同一份 `series.id`，依新平台 render 邏輯轉換

### 12.2 與 publish bundle 之相容性

publish bundle 三檔組合（`.md` / `.publish.json` / `.fb.md`）皆為 source data（沿用 `docs/publish-bundle.md` §6.1），git 版控保留：

- `.md` 之 `series.id` 為跨平台 stable ref
- `.publish.json` 不含 series；搬家時平台層回填資料（如 `blogger.publishedUrl`）獨立於 series
- `.fb.md` 不含 series；FB 推廣文案層獨立於 series 結構

搬家時三檔皆保留，`series.id` 自然延續至新平台。

### 12.3 schemaVersion 影響

series 為新加入之內容屬性欄位，**不影響** `.publish.json` 之 `schemaVersion`（沿用 `docs/publish-bundle.md` §5）。

未來若 series 結構發生破壞性變更（罕見），可考慮於 `content/settings/series.json` 或 `.md` frontmatter 引入獨立之 series schemaVersion 欄位。本批不主動引入。

---

## §13 範本參照

### 13.1 已落地之 sample / template

下列 sample / template 已於 **Phase 8-e-4** 落地：

- `content/settings/_sample.series.json`：集中管理 series metadata 之範本，採 §11.2 之候選 B 策略
- `content/templates/_sample-series-post.md`：含 `series` 區塊之文章範本，示範 §2 之 frontmatter 用法與 §4 / §5 之排序 / 序號規則

### 13.2 sample / template 之效力範圍

本批僅新增 sample / template，**不代表系統行為已啟用**：

- **不**代表 build 系統已自動讀取 `_sample.series.json`（接入屬後續批次，建議 Phase 8-e-6）
- **不**代表系統已實作自動序號建議邏輯（屬後續批次，建議 Phase 8-e-5；詳見 §5）
- **不**代表系統已實作 series hashtags 自動繼承（屬後續批次；詳見 §8）
- 後續實作仍需另開 **8-e-5 / 8-e-6** 或更晚批次決定

### 13.3 範本與本規範之一致性

sample / template 之欄位、預設值、結構必須與本文件 §2 / §11.3 一致。若兩者不同，以本文件為準，sample 應更新對齊。

範本變更不視為規格變更，不需更新本文件。

---

## §14 後續批次預告

| 批次（候選編號） | 範圍 | 是否本文件已規格化 |
| --- | --- | --- |
| **8-e-1（本批）** | 系列規格文件、`.publish.json` / `.fb.md` / `publish-bundle.md` 之 cross-link 與分工說明 | 是 |
| 8-e-2 | `.fb.md` schema 擴充（加入 `titleEn`、視需要加入 series 互動欄位） | §7 / §10 已預告 |
| 8-e-3 | `content/settings/_sample.series.json` 與 `_sample-series-post.md` 範本建立 | §13.1 已預告 |
| 8-e-4 | `validate-content` 對 series 之規則（duplicate number / id、unknown placeholder、series 誤入 `.publish.json` 等） | §5.3 / §6.4 / §9.3 已預告 |
| 8-e-5 | `new-post.js` 加入自動建議序號（§5） | §5 已規格化 |
| 8-e-6 | build script 接入 series titleTemplate / hashtags 繼承（§2.4 / §8） | §2.4 / §8 已規格化 |
| 8-e-7 | `docs/series-schema.md` completion report | 留待 8-e 系列完成 |

> **註**：上表編列於 Phase 8-e-1 撰寫時為「Phase 8-e 之後候選批次」之佔位編號；後續實際進度由 Phase 8-f 系列承接。當前落地狀態詳見 **§15**。

---

## §15 Phase 8-f 落地狀態（normalized.series 資料層）

### 15.1 已落地批次

Phase 8-f 系列批次依序完成下列接入點，建構 series metadata 之**資料層**（**本階段不接 EJS / build scripts / promotion 行為；dist 完全不變**）：

| 批次 | Commit | 範圍 |
| --- | --- | --- |
| 8-f-0 | （無 commit；純讀取分析） | series build pipeline 接入分析 |
| 8-f-1 | `e2d50c5` | 新增 `content/settings/series.json`（初始 `{ "series": [] }`）；`load-settings.js` SETTINGS_FILES 加入 `['series', 'series.json']`；`loadSettings()` 開始 expose `settings.series` |
| 8-f-2-a | （無 commit；純讀取分析） | loader plumbing 設計分析 |
| 8-f-2-b | `2c4682f` | `loadPosts` / `loadBloggerPosts` 加入 optional `settings` 參數；4 個 caller（`validate-content` / `build-github` / `build-blogger` / `build-promotion`）更新為傳入 settings；settings 經 `load-posts → processMarkdownEntry → normalizePostOutput` 之完整通道建立 |
| 8-f-3-a | （無 commit；純讀取分析） | normalized.series 設計分析 |
| **8-f-3-b** | **`dfbd35e`** | **`normalize-post-output.js` 加入 normalized.series 區塊**；含 7 種 raw `post.series` 狀態之解析邏輯與 validationMeta 追蹤 |
| 8-f-3-c | （本批 docs 補強） | 本節 §15 補入；§11.3 同步更新 |

### 15.2 normalized.series 資料形狀

`normalizePostOutput()` 之 return 物件**新增** `series` 欄位（與 `identity` / `display` / `seo` / `publish` / `promotion` / `validationMeta` 同層）；**不修改原 `post.series`**（raw frontmatter 完整保留）。

#### 形狀 1：null（無 series 或 invalid 不可用）

```js
normalized.series = null
```

觸發狀態：
- frontmatter 無 `series:` 區塊（`undefined`）
- frontmatter `series: null`
- frontmatter `series` 為非 plain object（string / array / number / boolean）
- frontmatter `series.id` 為空字串或非 string

#### 形狀 2：object with `resolved: false`（id 找不到 settings）

```js
normalized.series = {
  id,                          // string；來自 frontmatter
  number,                      // number；來自 frontmatter
  subtitle,                    // string | null；來自 frontmatter
  name: null,                  // settings 缺
  nameEn: null,                // settings 缺
  titleTemplate: null,         // settings 缺
  hashtags: [],                // 空 array
  resolved: false,
}
```

#### 形狀 3：object with `resolved: true`（id 找得到 settings；含可選之 frontmatter override）

```js
normalized.series = {
  id,                          // string；frontmatter
  number,                      // number；frontmatter
  subtitle,                    // string | null；frontmatter
  name,                        // string；frontmatter override 或 settings
  nameEn,                      // string；frontmatter override 或 settings
  titleTemplate,               // string；frontmatter override 或 settings
  hashtags,                    // array；frontmatter override 或 settings
  resolved: true,
}
```

### 15.3 合併優先順序

| 欄位 | 第一優先 | Fallback 1 | Fallback 2 |
| --- | --- | --- | --- |
| `id` | `frontmatter.series.id` | — | — |
| `number` | `frontmatter.series.number` | — | — |
| `subtitle` | `frontmatter.series.subtitle`（hasValue 檢查） | — | `null` |
| `name` | `frontmatter.series.name`（override） | `settings.series[id].name` | `null` |
| `nameEn` | `frontmatter.series.nameEn`（override） | `settings.series[id].nameEn` | `null` |
| `titleTemplate` | `frontmatter.series.titleTemplate`（override） | `settings.series[id].titleTemplate` | `null` |
| `hashtags` | `frontmatter.series.hashtags`（**完整覆寫**；非 array merge） | `settings.series[id].hashtags` | `[]` |
| `resolved` | `computed:settings-lookup` | — | — |

**hashtags 採完整覆寫而非合併** — 沿用 §8.4 之既定原則；避免 hashtag 重複與作者意圖不易反推之問題。

### 15.4 validationMeta 整合

#### 15.4.1 `fieldSource` 記錄

`normalized.validationMeta.fieldSource` 記錄 8 個 series 欄位之來源（與既有 display / seo / publish 同步追蹤；僅在形狀 2 / 3 寫入）：

```
series.id              ← frontmatter.series.id
series.number          ← frontmatter.series.number
series.subtitle        ← frontmatter.series.subtitle  /  fallback:null
series.name            ← frontmatter.series.name      /  settings.series[id].name      /  fallback:null
series.nameEn          ← frontmatter.series.nameEn    /  settings.series[id].nameEn    /  fallback:null
series.titleTemplate   ← frontmatter.series.titleTemplate / settings.series[id].titleTemplate / fallback:null
series.hashtags        ← frontmatter.series.hashtags  /  settings.series[id].hashtags  /  fallback:empty-array
series.resolved        ← computed:settings-lookup
```

#### 15.4.2 `warnings` 內部記錄

`normalized.validationMeta.warnings` 內部記錄 **3 種** invalid / unresolved 情境（**屬 helper-internal traceability**）：

| Type | 觸發條件 | Message |
| --- | --- | --- |
| `series-invalid-shape` | `post.series` 為非 plain object（string / array / number / boolean） | `series is not a plain object (typeof=...)` |
| `series-id-empty` | `post.series` 為 object 但 `series.id` 為空字串或非 string | `series.id is empty or non-string; treated as no usable series` |
| `series-id-not-resolved` | `series.id` 有值但 `settings.series.series` 找不到對應 id | `series.id="{id}" not found in settings.series; per-post fields preserved, settings-level fields null` |

#### 15.4.3 不升級為 validate-content user-visible warning

本批 helper-internal warnings **不被** `validate-content` 之 user-visible warning 機制讀取；既有 baseline 完全不變。

未來 `validate-content` 接 `normalized.validationMeta.warnings` 之 traceability（屬 `docs/phase-8d-field-mapping-design.md` §12 item 5 之延後項）時，可一併評估是否升級為 user-visible warning。

### 15.5 對 validate 基線與 build output 之影響

| 影響面 | 變動？ | 說明 |
| --- | --- | --- |
| `npm run validate:content` 基線 | ❌ 不變 | 維持 `0 error / 9 warning on 5 post(s)`（4 條既有正式文章 warning + 5 條 fixture warning） |
| `npm run build:github` 輸出 | ❌ 不變 | EJS / build script 暫不讀 `normalized.series`；dist byte-identical（modulo timestamps） |
| `npm run build:blogger` 輸出 | ❌ 不變 | `buildMeta` / EJS 不寫 `normalized.series`；dist-blogger byte-identical |
| `npm run build:promotion` 輸出 | ❌ 不變 | `buildManifestEntry` 不讀 series；dist-promotion byte-identical |
| `dist/.gitkeep` / `dist-blogger/.gitkeep` / `dist-promotion/.gitkeep` | ❌ 不變 | build 不觸及 |

`normalized.series` 已建構並可被 caller 讀取，**目前處於「暫無 caller 使用」狀態**；上層接入屬後續批次。

### 15.6 尚未落地（後續批次）

下列項目**不在 Phase 8-f-3-b 範圍**，屬後續批次規劃：

| 候選批次 | 範圍 | 依賴 |
| --- | --- | --- |
| Phase 8-f-4 | `series.titleTemplate` placeholder 解析 helper（如 `{series.name}` / `{series.number}` / `{series.subtitle}` / `{series.nameEn}`） | normalized.series（已落地） |
| Phase 8-f-5 | `build-promotion` 從 `normalized.series.hashtags` 繼承至 FB hashtags（單篇可完整覆寫） | normalized.series（已落地） |
| Phase 8-f-6 | `build-promotion` 輸出 `titleEn` 至 manifest（可選顯示） | 無 |
| Phase 8-f-7 | `blogger-copy-helper.ejs` / `blogger-publish-checklist.ejs` 套用 series titleTemplate | 8-f-4 |
| Phase 8-f-8 | EJS `post-detail.ejs` / `blogger-post-full.ejs` 套用 series titleTemplate | 8-f-4 |
| Phase 8-f-9 | `new-post.js` 加 series 區塊 + `type` → `contentKind` 修正 | 無 |
| Phase 8-f-10 | `new-post.js` 自動建議 `series.number`（補缺號 / max+1；§5 規格化邏輯實作） | 8-f-9 |

各批次落地時機由作者依需求安排；亦可調整拆批粒度。

---

（本文件結束）
