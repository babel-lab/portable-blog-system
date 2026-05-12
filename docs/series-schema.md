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
| 8-f-3-c | （docs 補強） | 本節 §15 補入；§11.3 同步更新 |
| 8-f-4-a | （無 commit；純讀取分析） | resolve-series-title helper 設計分析 |
| **8-f-4-b** | **`e097ac5`** | **新增 `src/scripts/resolve-series-title.js`**（純函式 helper；3 個 export；7 個支援 placeholder；詳見 §16） |
| 8-f-4-c | （docs 補強） | §15.1 commit 清單擴充；§15.6 候選清單調整；新增 §16 helper 設計詳述 |
| 8-f-5-a | （無 commit；純讀取分析）| Blogger copy-helper 接入設計分析 |
| **8-f-5-b** | **`abf8c5e`** | **`blogger-copy-helper.ejs` 新增 [11] 系列組合標題輔助區塊**；`build-blogger.js` import `resolveTitleTemplate` + main loop 預計算 + `renderCopyHelper` 簽名擴充（詳見 §17） |
| 8-f-5-c | （docs 補強） | §15.1 commit 清單擴充；§15.6 候選清單調整；新增 §17 copy-helper 接入實況與其他 caller 決策摘要 |
| 8-f-6-a | （無 commit；純讀取分析）| promotion / Facebook title / titleEn 接入分析（3 方案比較） |
| **8-f-6-b** | **`7741655`** | **`build-promotion.js buildManifestEntry` 新增 4 個 additive 欄位**：`titleEn` / `fbTitleEn` / `seriesResolvedTitle` / `seriesTitleUnresolvedPlaceholders`（不取代 entry.title / fbTitle；不改 FB .txt；詳見 §18）|
| 8-f-6-c | （docs 補強） | §15.1 commit 清單擴充；§15.6 候選清單調整；新增 §18 promotion manifest 接入實況 |
| 8-f-7-a | （無 commit；純讀取分析）| hashtags inheritance / override 分析（4 方案比較） |
| **8-f-7-b** | **`592d45c`** | **`normalize-post-output.js` 加 post-pass `series.hashtags` inheritance backfill**；僅在 `promotion.facebook.hashtags` 為空 array 且 `seriesOut.hashtags` 非空時觸發；既有 fixture 輸出 byte-identical（詳見 §19）|
| 8-f-7-c | （本批 docs 補強） | §15.1 commit 清單擴充；§15.6 候選清單調整；新增 §19 hashtags inheritance 接入實況 |

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

**Phase 8-g-12-b 補述（commit `a73c064`）**：上述 3 條結構性 helper-internal warnings 仍屬 normalize 內部 traceability，**未升級**為 user-visible warning（既有結構性偵測由 Phase 8-e-5-b + Phase 8-g-2-d 之 8 條 series structure warning 覆蓋）。**`titleTemplate` 之 unresolved placeholders 面向**（屬 `resolve-series-title.js` helper 之 traceability，與本 §15.4.2 之 3 條 normalize-internal 不同層）**已升級**為 `validate-content` user-visible warning `series-title-unresolved`，詳見 §15.4.3。

#### 15.4.3 不升級為 validate-content user-visible warning（Phase 8-f-3-b 既有立場；Phase 8-g-12-b 已就 titleTemplate 部分升級）

**歷史脈絡（Phase 8-f-3-b 落地時）**：本批之 helper-internal warnings（§15.4.2 之 3 條結構性 warning）**不被** `validate-content` 之 user-visible warning 機制讀取；既有 baseline 完全不變。

未來 `validate-content` 接 `normalized.validationMeta.warnings` 之 traceability（屬 `docs/phase-8d-field-mapping-design.md` §12 item 5 之延後項）時，可一併評估是否升級為 user-visible warning。

**Phase 8-g-12-b 更新（commit `a73c064`）**：`titleTemplate` 之 unresolved placeholders 偵測**已升級**為 `validate-content` user-visible warning ── 新增 `series-title-unresolved` 規則（warning-only；ready/published 範圍；觸發條件詳見 `src/scripts/validate-content.js` 之 Phase 8-g-12-b 註解區）。本升級**限於 `titleTemplate` placeholder 解析面向**；§15.4.2 之 3 條結構性 helper-internal warnings 仍**不**升級（屬 normalize 內部 traceability；外部偵測由既有 8 條 series structure warning 覆蓋）。Phase 8-g-12-c（commit `78d1f30`）配套新增 `_test-series-title-unresolved.md` fixture 自證；baseline 由 `0 error / 9 warning on 5 post(s)` 變為 `0 error / 11 warning on 6 post(s)`（fixture 同時觸發既有 `series-id-not-in-settings`，per Phase 8-g-2-d-b；屬獨立面向之預期共存）。

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

> **註**：
> - Phase 8-f-4（resolve-series-title helper）已於 commit `e097ac5`（8-f-4-b）落地；詳見 **§16**。
> - 原 8-f-7 候選之「blogger-copy-helper.ejs 套用 series titleTemplate」已於 commit `abf8c5e`（**Phase 8-f-5-b**）落地；採「**新增 [11] 輔助區塊；不取代 [1] 主標題**」之保守路線。詳見 **§17**。
> - 原 8-f-6 候選之「build-promotion 輸出 titleEn 至 manifest」之 manifest 層已於 commit `7741655`（**Phase 8-f-6-b**）落地；同步加入 `seriesResolvedTitle` / `seriesTitleUnresolvedPlaceholders` / `fbTitleEn` 共 4 個 additive 欄位；**FB .txt 輸出不變**；詳見 **§18**。
> - 原「hashtags 繼承」候選之 normalize 層 fallback 已於 commit `592d45c`（**Phase 8-f-7-b**）落地；採「保守 post-pass backfill；僅 FB promotion 端」之路線；既有 fixture byte-identical；詳見 **§19**。
> - 原 Phase 8-f-9 / 8-f-10 候選之「`new-post.js` series 區塊 + 自動建議 `series.number`」已於 **Phase 8-g-2** 系列（commits `fa7d825` / `bb58b2d` / `2262938` / `2507748`）以保守 stderr-only 路線落地；詳見 **§20**。
> - 其他 caller（blogger-post-full / post-detail / publish-checklist / meta.json）之接入決策詳見 **§17.3**。

下列項目**仍屬後續批次規劃**：

| 候選批次 | 範圍 | 依賴 |
| --- | --- | --- |
| Phase 8-f-N（FB .txt 顯示）| `facebook-post.ejs` / `facebook-summary.ejs` 顯示 manifest 中之 `titleEn` / `fbTitleEn` / `seriesResolvedTitle`（需考量文案長度與 SEO / 搜尋一致性） | manifest additive 欄位（已落地） |
| ~~Phase 8-f-N（site default hashtags）~~ | ~~site 層級之 default hashtags 作為最終 fallback~~ | ✅ 已於 **Phase 8-g-19-b** 規格化為 `promotion.facebook.defaultHashtags`（位於 `content/settings/promotion.config.json`，**非** `site.config.json`；格式含 `#`；為 FB promotion 最終 fallback，位於 `series.hashtags` 之後；**與 `series.tags`（Blogger tags inheritance；Phase 8-g-18）無關**）；完整規格詳見 `docs/promotion-export.md` §11；normalize 接入屬 **Phase 8-g-19-c** 後續批次 |
| Phase 8-f-N（first article .fb.md hashtags fallback） | 同系列第一篇之 .fb.md hashtags 作為次級 fallback（series-schema §8.2 之 fallback 2） | 需跨文章查找；複雜度較高 |
| ~~Phase 8-f-9~~ | ~~`new-post.js` 加 series 區塊 + `type` → `contentKind` 修正~~ | ✅ 已於 Phase 8-g-2-b1 / b2 落地；詳見 **§20** |
| ~~Phase 8-f-10~~ | ~~`new-post.js` 自動建議 `series.number`（補缺號 / max+1；§5 規格化邏輯實作）~~ | ✅ 已於 Phase 8-g-2-c-b / c-c 落地，採 stderr-only 保守路線；詳見 **§20** |

各批次落地時機由作者依需求安排；亦可調整拆批粒度。

---

## §16 resolve-series-title helper（Phase 8-f-4-b 落地）

### 16.1 檔案位置與狀態

- **檔案**：`src/scripts/resolve-series-title.js`（commit `e097ac5`）
- **狀態**：**helper 已落地；尚未接入任何 caller**
- 純函式 module；零外部 import；不修改 input；相同輸入永遠相同輸出
- 不讀檔 / 不寫檔 / 不 throw / 不 process.exit
- 不寫 `normalized.validationMeta`（屬 caller 責任，視需要寫入）
- 不新增 `validate-content` user-visible warning

### 16.2 placeholder 語法

| 維度 | resolve-series-title | resolve-placeholders（`.fb.md` body） | ga4-url-builder expandPattern（UTM） |
| --- | --- | --- | --- |
| 大括號 | **單** `{...}` | **雙** `{{...}}` | 單 `{...}` |
| dot notation | ✅ 支援 | ✅ 支援 | ❌ 不支援（純 word） |
| 左右空白容忍 | ✅ | ✅ | ❌ |
| 用途 | series titleTemplate | `.fb.md` body URL placeholder | UTM `campaignPattern` / `contentPattern` |

三套 syntax **設計目的不同**；不互通；不重用既有 helper。

### 16.3 三個 export

```js
extractTitlePlaceholders(template)
// 抽出 template 內所有 placeholder name（依首次出現順序去重）
// 返回：array of string

resolveTitlePlaceholderValue(name, context = {})
// 解析單一 placeholder
// 返回：{ resolved: boolean, value: string | null, reason: string | null }

resolveTitleTemplate(template, context = {})
// 對整段 template 做 placeholder 替換
// 返回：{ resolvedText, placeholders, replacements, unresolvedPlaceholders }
```

### 16.4 支援 placeholder 清單

`SUPPORTED_PLACEHOLDERS` Set 含 **7 個 placeholder**：

| Placeholder | Context path | 來源 |
| --- | --- | --- |
| `{series.name}` | `context.series.name` | `normalized.series.name` |
| `{series.nameEn}` | `context.series.nameEn` | `normalized.series.nameEn` |
| `{series.number}` | `context.series.number` | `normalized.series.number`（轉 string） |
| `{series.subtitle}` | `context.series.subtitle` | `normalized.series.subtitle` |
| `{series.id}` | `context.series.id` | `normalized.series.id` |
| `{post.title}` | `context.post.title` | `post.title`（raw frontmatter） |
| `{post.titleEn}` | `context.post.titleEn` | `post.titleEn`（raw frontmatter） |

未列於上述者 → `{ resolved: false, reason: 'unsupported-placeholder' }`。

### 16.5 unresolved placeholder 處理策略

| 行為 | 描述 |
| --- | --- |
| 保留原文 | unresolved 不替換；`resolvedText` 維持原 `{X.Y}` 字串 |
| 列入返回值 | `unresolvedPlaceholders`：array of `{ name, reason }` |
| reason 候選 | `'missing-value'`（context 內對應 path 為 null/undefined）/ `'unsupported-placeholder'`（不在 SUPPORTED_PLACEHOLDERS 集合）|
| 不 throw | helper 永不中斷流程 |
| 不 process.exit | 同上 |
| 不寫 validationMeta | 屬 caller 責任；helper 不操作任何外部 accumulator |
| 不新增 validate-content warning | 屬未來批次決定 |

**特殊情境**：空字串 `""` 視為**已解析**（替換為空字串）；僅 `null` / `undefined` 觸發 `'missing-value'`。數字 0 / boolean false 同樣視為已解析（轉 string）。

### 16.6 resolveTitleTemplate 回傳資料形狀

**完整解析範例**：

```js
{
  resolvedText: '[貝果書屋] 《範例系列》#1(提問筆記本)',
  placeholders: [
    'series.name',
    'series.number',
    'series.subtitle',
  ],
  replacements: [
    { name: 'series.name', value: '範例系列' },
    { name: 'series.number', value: '1' },
    { name: 'series.subtitle', value: '提問筆記本' },
  ],
  unresolvedPlaceholders: [],
}
```

**含 unresolved 範例**：

```js
{
  resolvedText: '《Series Name》#1({series.subtitle})',  // ← 保留原 {series.subtitle}
  placeholders: ['series.name', 'series.number', 'series.subtitle'],
  replacements: [
    { name: 'series.name', value: 'Series Name' },
    { name: 'series.number', value: '1' },
  ],
  unresolvedPlaceholders: [
    { name: 'series.subtitle', reason: 'missing-value' },
  ],
}
```

### 16.7 目前不支援項目

下列功能屬未來批次規格範圍，**本批不支援**：

- ❌ 條件式 placeholder（如 `{?series.subtitle:(...)}`）
- ❌ fallback chain（如 `{series.name|post.title}`）
- ❌ 巢狀 placeholder（如 `{outer.{inner}}`）
- ❌ subtitle 缺值時智慧括號移除（`{X}()` 仍輸出空括號 `()`；不改寫週邊符號）
- ❌ 自動改寫 titleTemplate（helper 不改寫；caller 自行決定後處理）

### 16.8 對 validate / build 影響

| 影響面 | 變動？ | 說明 |
| --- | --- | --- |
| `npm run validate:content` 基線 | ❌ 不變 | helper 無 caller import；維持 `0 error / 9 warning on 5 post(s)` |
| `npm run build:github` 輸出 | ❌ 不變 | helper 無 caller import；dist byte-identical |
| `npm run build:blogger` 輸出 | ❌ 不變 | 同上 |
| `npm run build:promotion` 輸出 | ❌ 不變 | 同上 |
| `dist/.gitkeep` / `dist-blogger/.gitkeep` / `dist-promotion/.gitkeep` | ❌ 不變 | helper 不觸 dist |

→ helper 處於「**已可被 caller 引用，但目前尚無 caller**」狀態。

### 16.9 後續接入建議順序

依風險與可逆性，建議由低到高排序：

| 順序 | 接入點 | 風險 | 理由 |
| --- | --- | --- | --- |
| 1 | **`blogger-copy-helper.ejs`** | ⭐⭐⭐ 最低 | 純文字 .txt；非 customer-facing；作者手動複製用；錯誤可立即發現；dist-blogger byte-diff 易驗證 |
| 2 | `blogger-post-full.ejs`（Blogger 主文 HTML） | ⭐⭐ 中 | live HTML；影響貼到 Blogger 平台之內容 |
| 3 | `post-detail.ejs`（GitHub 主文 HTML） | ⭐ 較高 | live HTML；customer-facing |
| 4 | `build-promotion.js`（FB 貼文 title / fbTitle） | ⭐⭐ 中 | 影響 FB 推廣文案 |

各接入點屬獨立批次；可依作者實際需求調整順序與粒度。

---

## §17 Phase 8-f-5 copy-helper 接入實況與其他 caller 決策

### 17.1 Blogger copy-helper 接入細節（Phase 8-f-5-b 落地）

- **已接入**：`src/views/blogger/blogger-copy-helper.ejs`（commit `abf8c5e`）
- **新增區塊**：**[11] 系列組合標題（series.titleTemplate 解析結果；人工貼文輔助）**
- 設計原則：**「不取代主標題；僅作輔助」**
  - **不**取代既有 [1] Blogger 標題 / 文章 H1
  - **不**修改 `post.title` / `post.normalized.display.title`
  - **不**寫入 `meta.json`（buildMeta 不動）
  - **不**影響 Blogger 正式 HTML（blogger-post-full / summary / redirect-card）
  - **不**影響 GitHub 正式 HTML（post-detail / list views）
  - **不**影響 Promotion / Facebook 輸出
- **無 series 區塊之文章**：[11] 區塊**不顯示**；copy-helper.txt 內容 byte-identical（modulo timestamp 與 EJS scriptlet 尾隨空白）
- 資料來源：`build-blogger.js` main loop 預計算 → 透過 `renderCopyHelper` 簽名 additive 傳入 EJS（不破壞既有 props）

### 17.2 unresolved placeholders 行為

- **不 throw** / **不 process.exit** / **不阻擋 build**
- 原 `{X.Y}` placeholder **保留於 `resolvedText` 主體**
- copy-helper [11] 區塊內顯示 **`⚠️ 注意：以下 placeholder 未解析...`** 之人工提醒
- 提醒列出 `{name}` 與 `reason`（`missing-value` / `unsupported-placeholder`）
- **不寫入** `validationMeta`
- **不新增** `validate-content` user-visible warning

### 17.3 其他 caller 接入決策（Phase 8-f-6-a 分析結果）

依 8-f-5-b 確立之「**不取代主標題；僅作輔助**」原則，下列 caller **暫不接入**：

| Caller | 不接入理由 |
| --- | --- |
| `blogger-post-full.ejs` / `summary.ejs`（H1 主標題） | 取代 H1 會與 copy-helper [1] raw title 不一致；customer-facing 線上 HTML；SEO 風險高 |
| `post-detail.ejs` / GitHub list views | 同上；customer-facing；列表卡片組合 title 過長 |
| `blogger-publish-checklist.ejs` | 標頭僅作識別；新增區塊與 copy-helper [11] 重複；價值低 |
| `build-promotion.js` / `facebook-post.ejs` | 可作 additive 欄位候選；但 FB title 字長受限；本階段不取代 `entry.title` / `fbTitle` |
| `build-blogger.js buildMeta()` / `meta.json` | meta.json 屬發布回填層；schema 變動影響下游 tools；series 屬內容屬性不應入 meta.json |

各接入候選若未來有實際需求，可獨立另開批次評估；建議優先考慮 additive 模式（不取代既有欄位）。

---

## §18 Phase 8-f-6 promotion manifest 接入實況

### 18.1 落地細節（Phase 8-f-6-b 落地）

- **已接入**：`src/scripts/build-promotion.js`（commit `7741655`）
- **修改範圍**：僅 `buildManifestEntry()` 內預計算 4 個 additive 欄位；不動 `classifyFacebook` / `buildFacebookUrl` / `resolvePlaceholders` / `renderAndWriteFacebookText`
- **新增欄位位置**：插入於 entry 既有 `note` 之後、`baseUrl` 之前；既有 17 個欄位順序與值不變

### 18.2 新增 4 個 additive 欄位來源

| 欄位 | 型別 | 來源 |
| --- | --- | --- |
| `titleEn` | `string \| null` | `post.titleEn`（`.md` frontmatter）|
| `fbTitleEn` | `string \| null` | `post.sidecars?.facebook?.data?.titleEn`（`.fb.md` frontmatter；Phase 8-e-2 schema 落地） |
| `seriesResolvedTitle` | `string \| null` | `resolveTitleTemplate(normalized.series.titleTemplate, { series, post: { title, titleEn } })` 之 `resolvedText`（與 copy-helper 8-f-5-b 同 pattern） |
| `seriesTitleUnresolvedPlaceholders` | `Array<{ name, reason }>` | 上 helper 返回之 `unresolvedPlaceholders` array |

### 18.3 設計原則

- **不取代** `entry.title`（normalized 優先 + legacy fallback，沿 Phase 8-d-4-b 設計）
- **不取代** `entry.fbTitle`（legacy `fb.title` 來源不變）
- **不修改** `facebook-post.ejs` / `facebook-summary.ejs`
- **不改** FB `.txt` 實際輸出（EJS 不讀新欄位 → byte-identical）
- **本批僅資料層 metadata**，供未來 EJS / 下游工具選用

### 18.4 無 series / 無 titleTemplate 時之欄位預期值

| 情境 | `seriesResolvedTitle` | `seriesTitleUnresolvedPlaceholders` |
| --- | --- | --- |
| 無 series 區塊 | `null` | `[]` |
| 有 series 但 `titleTemplate` 為空字串 / null | `null` | `[]` |
| 有 series 且 `titleTemplate` 非空、完整解析 | 組合標題字串 | `[]` |
| 有 series 且 `titleTemplate` 部分 unresolved | 含 `{X.Y}` 原文之字串 | `[{ name, reason }, ...]` |

### 18.5 unresolved placeholders 行為

- **不 throw** / **不 process.exit** / **不阻擋 build**（沿用 8-f-4-b helper 設計）
- 原 `{X.Y}` placeholder **保留於 `seriesResolvedTitle`** 文字內
- 未解析項目列入 `seriesTitleUnresolvedPlaceholders` array（`name` + `reason`：`missing-value` / `unsupported-placeholder`）
- **目前不顯示於 FB `.txt`**（EJS 暫不讀；屬未來批次決策）
- **不寫入** `validationMeta`
- **不新增** `validate-content` user-visible warning（**Phase 8-f-6-b 落地時之表述**）

**Phase 8-g-12-b 補述（commit `a73c064`）**：上述「不新增 `validate-content` user-visible warning」屬 Phase 8-f-6-b 落地時之歷史脈絡；**`validate-content` 已新增 `series-title-unresolved` warning 規則**（基於 `normalized.series.titleTemplate` + `resolveTitleTemplate(...)` 偵測；ready/published 範圍；詳見 §15.4.3）。本 §18.5 描述之 build-promotion 行為（不阻擋 build / 不寫 validationMeta / `seriesResolvedTitle` 保留原 placeholder）仍 valid；validate 升級與 build-promotion 行為**獨立**，不重複觸發 build-time warning。

### 18.6 未來 FB `.txt` 顯示決策

未來若選擇讓 FB `.txt` 顯示 `titleEn` / `fbTitleEn` / `seriesResolvedTitle`，應**另開批次**評估：

- 文案長度（FB 貼文建議標題 < 60 chars；series titleTemplate 套用後可能過長）
- FB 貼文格式（標題行 / 副標行 / 多語並列等顯示策略）
- SEO / 搜尋一致性（與 Blogger 主標題、Google 預覽之對應）

**目前 `entry.title` / `entry.fbTitle` 仍是實際 FB 文案主標題來源**；EJS 邏輯維持 `post.fbTitle || post.title` 之 fallback chain（manifest entry view）。

---

## §19 Phase 8-f-7 hashtags inheritance 接入實況

### 19.1 落地細節（Phase 8-f-7-b 落地）

- **已接入**：`src/scripts/normalize-post-output.js`（commit `592d45c`）
- **修改範圍**：在 series 區塊完成後、return block 之前加 post-pass「inheritance backfill」邏輯
- **適用範圍**：**僅** `normalized.promotion.facebook.hashtags`（FB promotion 端）
- **不處理**：Blogger `post.tags`、GitHub list views 之 hashtag 顯示、`build-blogger.js` / EJS 之 hashtag 渲染

### 19.2 優先序

```
1. .fb.md.hashtags（非空 array；sidecar-first）
2. legacy frontmatter.promotion.facebook.hashtags（非空 array）
3. series.hashtags（本批新增；當 1 / 2 皆解為 [] 時觸發）
4. []（最終 fallback）
```

實際實作位於 `normalize-post-output.js`：步驟 1 / 2 / 4 為 Phase 8-d-1 之既有邏輯（line ~792）；步驟 3 為 Phase 8-f-7-b 之 post-pass backfill。

### 19.3 設計原則

- **不自動合併** hashtags（採完整 fallback；不做 array merge）
- **article / sidecar 明確填寫之 hashtags 永遠優先**（既有 prec 不破壞）
- **`series.hashtags` 只在 FB hashtags 為空時補上**（保守觸發條件）
- **本批不做 site default hashtags**（屬未來批次；§15.6 候選）
- **本批不做 first article .fb.md hashtags fallback**（series-schema §8.2 fallback 2；需跨文章查找；複雜度高；屬未來批次）
- **本批不改 Blogger `post.tags`**（Blogger 標籤為短 slug 格式；FB hashtags 為 `#` prefix；格式不同；不應跨界繼承）
- **本批不修改** `build-promotion.js` / `build-blogger.js` / EJS

### 19.4 觸發條件（保守 AND 條件）

```js
if (
  Array.isArray(promotion.facebook.hashtags) &&
  promotion.facebook.hashtags.length === 0 &&
  seriesOut &&
  Array.isArray(seriesOut.hashtags) &&
  seriesOut.hashtags.length > 0
) { ... }
```

任一條件不滿足 → 不觸發；既有 fallback chain 不變。

### 19.5 traceability

| 觸發狀態 | `fieldSource['promotion.facebook.hashtags']` | `fallbackUsed` |
|---|---|---|
| .fb.md.hashtags 命中（既有） | `'fb.md.hashtags'` | 不記 |
| legacy frontmatter 命中（既有） | `'frontmatter.promotion.facebook.hashtags'` | 不記 |
| **series.hashtags 命中（本批新增）** | `'computed:series.hashtags'` | 新增 `{ field: 'promotion.facebook.hashtags', from: 'computed:series.hashtags', reason: 'inherited from series.hashtags' }` |
| 全空（既有） | `'fallback'` | 既有記錄維持 |

未觸發 fallback 時，既有來源記錄維持不變（Phase 8-d-1 行為）。

### 19.6 對 validate 基線與 build output 之影響

| 影響面 | 變動？ | 說明 |
| --- | --- | --- |
| `npm run validate:content` 基線 | ❌ 不變 | 維持 `0 error / 9 warning on 5 post(s)`；helper 不新增規則 |
| `npm run build:github` 輸出 | ❌ 不變 | 不讀 normalized.promotion.facebook |
| `npm run build:blogger` 輸出 | ❌ 不變 | 不讀 normalized.promotion.facebook |
| `npm run build:promotion` 輸出（既有 fixture）| ✅ **byte-identical** | 既有 fixture 之 fb hashtags 非空 → 不觸發 backfill |
| `npm run build:promotion` 輸出（未來 series + 空 fb hashtags fixture）| ⚠️ 預期變動 | 為設計預期；series.hashtags 將出現於 entry.hashtags 與 .txt 輸出 |
| `.gitkeep` 三檔 | ❌ 不變 | 無 build dist 路徑變動 |

### 19.7 未來候選

- ~~**site default hashtags**：作為最終 fallback（在 series.hashtags 之後）；需設計 `site.config.json` 或專屬 settings 欄位~~ → **已於 Phase 8-g-19-b 規格化為 `promotion.facebook.defaultHashtags`**（位於 `content/settings/promotion.config.json`，**非** `site.config.json`；含 `#`；FB promotion only；與 `series.tags`（Phase 8-g-18）無關；詳見 `docs/promotion-export.md` §11）；本 §19.7 條目保留歷史脈絡。normalize 接入屬 Phase 8-g-19-c 後續批次。
- **first article .fb.md hashtags fallback**：series-schema §8.2 之 fallback 2；需跨文章查找邏輯（識別「同系列 series.number 最小者」），複雜度較高
- ~~**Blogger `post.tags` inheritance**：若未來要實作，應另行設計 slug 格式（如 `series.tags` 短 slug 欄位），**不應直接沿用 FB `#hashtags` 格式**~~ → **已於 Phase 8-g-18-b 規格化為 `series.tags` 欄位**（詳見 §22）；本 §19.7 條目保留歷史脈絡。normalize / build-blogger 接入屬 Phase 8-g-18-c / 8-g-18-d 後續批次。

各候選若未來有實際需求，可獨立另開批次評估。

---

## §20 Phase 8-g-2 new-post.js 接入實況（series prompt + next number suggestion）

### 20.1 落地細節

| 子批次 | Commit | 範圍 |
| --- | --- | --- |
| 8-g-2-b1 | `fa7d825` | new-post.js 模板 `type` → `contentKind` 修正（Phase 8-a `contentKind` 命名對齊；消除 `frontmatter-uses-deprecated-type` warning 源頭）|
| 8-g-2-b2 | `bb58b2d` | new-post.js 加 series CLI flags：`--series-id` / `--series-number` / `--series-subtitle`；僅當 `--series-id` 有提供時模板輸出 `series:` 區塊 |
| **8-g-2-c-b** | **`2262938`** | 新增 `src/scripts/suggest-series-number.js` 純函式 helper；3 個 export（`collectSeriesNumbers` / `suggestNextSeriesNumber` / `suggestSeriesNumberForPosts`）；無 caller |
| **8-g-2-c-c** | **`2507748`** | new-post.js 接入 helper；觸發 `--series-id` 有 + `--series-number` 無 時，**stderr-only** 輸出 next number 建議；stdout template 不變 |

### 20.2 helper（`src/scripts/suggest-series-number.js`）

- **檔案**：`src/scripts/suggest-series-number.js`（commit `2262938`）
- **狀態**：純函式 helper；零外部 import；不讀寫檔；不 throw；不 process.exit；輸入不修改
- **與 series-schema §5 對齊**：實作「**先補最低缺號；若無缺號則 max + 1；空集合則建議 1**」之規格

### 20.3 helper API

| Export | 簽名 | 行為 |
| --- | --- | --- |
| `collectSeriesNumbers(posts, targetSeriesId)` | `(Array, string) → { numbers, ignored }` | 過濾 `series.id === targetSeriesId` 之 posts；蒐集合法 number；非數字 / 非整數 / 非正 / NaN / Infinity 記入 `ignored` array 並標 reason code |
| `suggestNextSeriesNumber(numbers)` | `(Array<number>) → number` | 防禦性 filter（typeof / isFinite / isInteger / > 0）→ dedupe → asc sort → 低位缺號優先 → 無缺號 max+1 → 空集合 1 |
| `suggestSeriesNumberForPosts(posts, targetSeriesId)` | `(Array, string) → { suggestedNumber, usedNumbers, ignored }` | 上述兩函式之組合 wrapper；`usedNumbers` 為 dedupe + 升序 |

### 20.4 helper 對 posts 輸入之相容 shape

| Shape | 來源範例 |
| --- | --- |
| `{ series: {...} }` | `load-posts` entry 之 spread 結果 |
| `{ data: { series: {...} } }` | gray-matter 原始 `{ data, content }` |
| `{ frontmatter: { series: {...} } }` | 通用 frontmatter wrapper |

caller（如 8-g-2-c-c 之 new-post.js）以 gray-matter 直接取 frontmatter 後餵入；helper 自動處理多 shape。

### 20.5 規格 recap（series.number auto-suggest）

| 規則 | 行為 |
| --- | --- |
| **lowest gap first** | 已有 [1, 2, 4] → 建議 3（補缺）|
| **else max + 1** | 已有 [1, 2, 3] → 建議 4 |
| **empty → 1** | 空集合或無匹配 series.id → 建議 1 |
| **dedupe** | 同系列同編號重複時視為一筆；不擋 |
| **invalid numbers ignored** | 非 number / 非整數 / 非正 / NaN / Infinity 跳過並計入 `ignored`；helper 不 throw |
| **status / publishedAt 不影響 number allocation** | 所有 status（draft / ready / published）皆視為「已分配創作編號」；不依發布順序（per §4）|
| **manual `--series-number` 優先** | 使用者手動指定永遠寫入 stdout template；suggestion 完全不顯示 |
| **suggestion 不直接寫入 template** | 僅輸出 stderr；stdout template 保持作者意圖之純複製目標 |

### 20.6 new-post.js stderr 訊息格式（Phase 8-g-2-c-c）

成功 suggestion：
```
[new-post] Suggested series.number for "we-media-ai-52": 3
[new-post] Add it explicitly with: --series-number 3
```

含 invalid numbers（同時顯示）：
```
[new-post] Warning: ignored 1 invalid series.number value while scanning.
```

scan 失敗：
```
[new-post] Warning: unable to suggest series.number; please set --series-number manually.
```

### 20.7 new-post.js 掃描範圍（Phase 8-g-2-c-c）

| 納入 | 排除 |
| --- | --- |
| `content/blogger/posts/**/*.md` | `content/validation-fixtures/**` |
| `content/blogger/pages/**/*.md` | `content/templates/**` |
| `content/github/posts/**/*.md` | （`content/archive` 不納入；保守決策）|
| `content/github/pages/**/*.md` | |
| `content/shared/posts/**/*.md` | |
| `content/drafts/**/*.md` | |

實作層使用 `fast-glob` + `gray-matter`（既有相依；無新增外部套件）；individual file read/parse 失敗跳過繼續；fast-glob 失敗 graceful fallback 至 stderr warning。`loadPosts()` 不重用，因其預設過濾 draft 並限單一 site，不符合「ALL status / 跨 site」之 series.number 統計需求。

### 20.8 CLI 範例

```bash
# 一般文章（無 series）
node src/scripts/new-post.js my-slug

# 系列文章：自動建議 series.number（stderr 顯示）
node src/scripts/new-post.js my-slug --series-id we-media-ai-52
# stderr 範例：
#   [new-post] Suggested series.number for "we-media-ai-52": 3
#   [new-post] Add it explicitly with: --series-number 3

# 系列文章：手動指定全部欄位（不顯示建議）
node src/scripts/new-post.js my-slug --series-id we-media-ai-52 --series-number 3 --series-subtitle 提問筆記本
```

### 20.9 對 validate / build / dist 之影響

| 影響面 | 變動？ | 說明 |
| --- | --- | --- |
| `npm run validate:content` 基線 | ❌ 不變 | helper 為純函式；無 validate-content import；new-post.js 屬 author tooling 不參與 validate |
| `npm run build:github` 輸出 | ❌ 不變 | new-post.js / helper 不參與 build pipeline |
| `npm run build:blogger` 輸出 | ❌ 不變 | 同上 |
| `npm run build:promotion` 輸出 | ❌ 不變 | 同上 |
| `dist` / `dist-blogger` / `dist-promotion` baseline | ❌ 不變 | 無 build 觸發路徑變動 |
| `package.json` | ❌ 不變 | 無新增 npm script；無新增外部套件（沿用既有 `fast-glob` + `gray-matter`）|

### 20.10 cross-link

- `docs/phase-8g-candidate-analysis.md` §6 候選 #2 / #3 與 §10 詳細落地紀錄
- `docs/future-roadmap.md` §3 子批次表 + §3.2 落地摘要

---

## §21 Phase 8-g-2-d validate-content series 規則接入實況

### 21.1 落地規則清單（warning-only）

Phase 8-g-2-d 系列於 `src/scripts/validate-content.js` 加入 **3 條 series 結構檢查 warning**，補完既有 Phase 8-e-5-b 之 4 條 series 規則（`series-not-object` / `series-id-invalid` / `series-number-invalid` / `series-subtitle-invalid-type`）。組合後 series 相關 warning 共 **7 條**。

| 子批次 | Commit | Rule key | 觸發條件 |
| --- | --- | --- | --- |
| 8-g-2-d-b | `e70af85` | `series-id-not-in-settings` | `post.series` 為 plain object；`s.id` 為 non-empty string；`settings.series.series` 找不到對應 id |
| 8-g-2-d-c | `bf58364` | `series-block-missing-number` | `post.series` 為 plain object；`s.id` 為 non-empty string；`s.number === undefined` |
| 8-g-2-d-d | `ca0381a` | `series-subtitle-without-id` | `post.series` 為 plain object；`s.subtitle !== undefined`；`s.id === undefined` |

### 21.2 設計原則

- **皆為 warning-only**：不升 error；不阻擋 build / `validate:content` exit code（warning-only → exit 0）
- **觸發範圍**：與既有 Phase 8-e-5-b series 規則一致（僅 ready / published；drafts / archived 由 `load-posts` 過濾不進；validation-fixtures 之 ready posts 一併掃描）
- **不擴充 settings 載入路徑**：`settings.series` 已由 Phase 8-f-2-b plumbing 載入並傳入 `validateContent`；本批未動 `load-settings.js` / `load-posts.js`
- **不新增 fixture**：本系列未動 `content/validation-fixtures/`；既有 fixture 行為與 baseline 完全不變
- **保守邊界**：每條規則前置條件清晰互斥，避免與既有 series 規則重複觸發；唯一例外為 `series-subtitle-without-id` 與 `series-subtitle-invalid-type` 之刻意可共存（per §21.3）

### 21.3 規則邊界（避免重複觸發 / 刻意共存）

| 場景 | 觸發之規則 |
| --- | --- |
| `series` 非 plain object（string / array / number / boolean / null）| `series-not-object`（既有）|
| `series` 為 object，`s.id` `defined` 但為空字串或非 string | `series-id-invalid`（既有）|
| `series` 為 object，`s.id` 為 valid non-empty string，settings 找不到 | **`series-id-not-in-settings`**（8-g-2-d-b）|
| `series` 為 object，`s.id` 為 valid，`s.number === undefined` | **`series-block-missing-number`**（8-g-2-d-c）|
| `series` 為 object，`s.number` defined 但非正整數 | `series-number-invalid`（既有）|
| `series` 為 object，`s.subtitle` defined（任何型別）且 `s.id === undefined` | **`series-subtitle-without-id`**（8-g-2-d-d）|
| `series` 為 object，`s.subtitle` defined 但非 string | `series-subtitle-invalid-type`（既有）|

關鍵互斥 / 共存保證：

- `series-id-invalid` ⟷ `series-id-not-in-settings`：**互斥**（前者要求 id 非 valid；後者要求 id 已通過 valid 檢查）
- `series-id-invalid` ⟷ `series-subtitle-without-id`：**互斥**（前者要求 `s.id !== undefined`；後者要求 `s.id === undefined`）
- `series-block-missing-number` ⟷ `series-number-invalid`：**互斥**（前者 `s.number === undefined`；後者 `s.number !== undefined` 但 invalid）
- `series-subtitle-without-id` ⟷ `series-subtitle-invalid-type`：**可共存**（前者檢查結構配對；後者檢查型別；當 subtitle 為非 string 且 id 缺漏時，兩條同時觸發）

### 21.4 對 validate / build / dist 之影響

| 影響面 | 變動？ | 說明 |
| --- | --- | --- |
| `npm run validate:content` baseline | ❌ 不變 | 維持 `0 error(s) / 9 warning(s) on 5 post(s)`；正式 posts 無 series 區塊不觸發新規則；validation-fixtures 之 series 早被既有規則攔下，不進新規則之 else 分支 |
| `npm run build:github` 輸出 | ❌ 不變 | validate-content 不在 build pipeline 主路徑；新規則為 warning 不阻擋 |
| `npm run build:blogger` 輸出 | ❌ 不變 | 同上 |
| `npm run build:promotion` 輸出 | ❌ 不變 | 同上 |
| `dist` / `dist-blogger` / `dist-promotion` baseline | ❌ 不變 | 無 build 觸發路徑變動 |
| `package.json` | ❌ 不變 | 無新增 npm script；無新增相依 |

### 21.5 仍未落地之 series 規則候選

| 候選 rule key | 規格依據 | 狀態 | 備註 |
| --- | --- | --- | --- |
| ~~`series-number-duplicate`~~ | 本文件 §5.3 | ✅ `landed`（Phase 8-g-2-d-e-b / e-c）| 規則 commit `89bbbd0`；fixture commit `f97cded`；2 個 validation-fixtures（`_test-series-dup-a.md` / `_test-series-dup-b.md`）共用 series.id + series.number 以觸發；baseline 變為 0 error / 13 warning on 7 post(s) |
| series report（`dist-reports/series.txt`）| `docs/phase-8g-candidate-analysis.md` §6 候選 #1 | `candidate` | 屬「報表」延伸；與 `series-number-duplicate` 配套；本系列未實作 |
| ~~Phase 8-g-2-d completion report~~ | — | ✅ `landed`（Phase 8-g-2-d-g）| `docs/phase-8g-2-d-completion-report.md`（本批產出）|

### 21.6 cross-link

- `docs/phase-8g-candidate-analysis.md` §6 候選 #1（`partially landed`）/ §11（Phase 8-g-2-d 落地紀錄）
- `docs/future-roadmap.md` §3 子批次表 / §3.3（Phase 8-g-2-d 落地摘要）
- 本文件 §5（series.number auto-suggest 規格）/ §15.6（候選批次預告）

---

## §22 Blogger tags inheritance（`series.tags`）

### 22.1 動機與規格依據

Phase 8-f-7-b 已落地 FB hashtags 之 `series.hashtags` inheritance（per §19）；Blogger 端之 tag inheritance 屬 §19.7 之既有 future candidate，**未實作**。

per `docs/fb-sidecar-schema.md` §12.3.1（Phase 8-f-7-b 落地時補述）：

> 「**Blogger `post.tags` 與 FB hashtags 不互通**：Blogger 標籤為短 slug（`github`），FB hashtags 為 `#` prefix；格式不同；本批**不影響** Blogger `post.tags`；若未來要做 Blogger 標籤繼承，**應另設 `series.tags` 短 slug 欄位**，**不應直接沿用** FB `#hashtags`」

per 本文件 §19.7（Phase 8-f-7-b 落地時之 future candidate）：

> 「**Blogger `post.tags` inheritance**：若未來要實作，應另行設計 slug 格式（如 `series.tags` 短 slug 欄位），**不應直接沿用 FB `#hashtags` 格式**」

→ 本 §22 正式規格化 `series.tags` 欄位。**本批（Phase 8-g-18-b）僅規格化 schema 文件**；normalize 接入屬後續批次 Phase 8-g-18-c；build-blogger 接入屬後續批次 Phase 8-g-18-d。

### 22.2 `series.tags` 欄位定義

| 維度 | 規格 |
|---|---|
| 名稱 | `series.tags` |
| 型別 | `string[]`（陣列；每元素為 string）|
| 必填 / 選填 | **選填**（同 `series.hashtags` 之選填模式）|
| 預設值 | `[]`（未定義時視同空陣列）|
| 空陣列語意 | **視同未設定**（不觸發 inheritance；fallback 至下層；per §22.4 之 chain）|
| 格式 | **短 slug / tag**（同 `.md` frontmatter `tags` 之既有格式；per §8.1）|
| **是否含 `#`** | ❌ **不含**（per §22.5 與 `series.hashtags` 分離原則）|
| 字元 | 可為英文 slug（如 `github`、`vite`、`static-site`）或中文 tag（如 `AI`、`自媒體`、`ChatGPT`）|
| 集中設定位置 | `content/settings/series.json` 之 series entry 內 `tags` 欄位 |
| 文章層 override | `frontmatter.series.tags`（per §11.2 hybrid 策略；可選；屬「文章層覆寫優先 + settings fallback」之既有合併路線）|

### 22.3 範例

`content/settings/series.json`：

```json
{
  "series": [
    {
      "id": "we-media-ai-52",
      "name": "我媒體 AI 52 篇",
      "tags": ["AI", "自媒體", "ChatGPT"],
      "hashtags": ["#AI", "#自媒體", "#ChatGPT", "#提問筆記本"]
    }
  ]
}
```

說明：

- `tags`：Blogger labels / 短 slug；**不含 `#`**
- `hashtags`：FB promotion hashtags；**含 `#`**
- 同一 series 之 `tags` 與 `hashtags` **內容可一致 / 略異 / 完全不同**（per §8.1「內容語意相同；格式略異」之既有原則）；作者可決定是否完全對應或加減

### 22.4 inheritance 原則

per §11.2 之 hybrid 策略 + §19 既有 hashtags inheritance pattern：

**未來 normalize 接入後之 fallback chain**（per §22.7 之後續批次規格）：

```
1. post.tags（frontmatter；文章層最高優先；非空 array）
2. frontmatter.series.tags（文章層 series override；非空 array）
3. settings.series[id].tags（系列定義層；非空 array）
4. []（最終 fallback）
```

關鍵點：

- **`post.tags` 仍是文章層最高優先**（per §8.3「單篇可 override」；維持作者單篇控制）
- 未來若文章層 `post.tags` 為空，可由 `series.tags` fallback（per §22.7 後續 normalize 接入）
- **空陣列視同未設定**（per §22.2；不阻擋 fallback chain 下傳）
- **完整覆蓋；不合併**（mirror §8.4 既有 hashtags inheritance 原則）
- **本批僅定義規格**；normalize / build-blogger 接入屬 Phase 8-g-18-c / 8-g-18-d 後續批次

### 22.5 `series.tags` 與 `series.hashtags` 分離原則

| 維度 | `series.tags` | `series.hashtags` |
|---|---|---|
| 服務對象 | **Blogger tags / labels**（Blogger 平台貼文之 labels）| **Facebook promotion hashtags**（FB 推廣文案）|
| 格式 | 短 slug / tag；**不含 `#`** | `#` prefix 形式 |
| 範例 | `["github", "vite"]` 或 `["AI", "自媒體"]` | `["#GitHub", "#Vite"]` 或 `["#AI", "#自媒體"]` |
| 接入點 | `normalize.publish.blogger.tags`（未來；per §22.7）| `normalize.promotion.facebook.hashtags`（per §19.1 Phase 8-f-7-b 已落地）|
| build 輸出 | `build-blogger.js` → `meta.json` `tags` 欄位（per §22.7 後續批次）| `build-promotion.js` → manifest entry / `facebook-post.ejs` |
| 對應之 frontmatter | `frontmatter.tags`（per §8.1）| `frontmatter.promotion.facebook.hashtags`（per §19）|

**核心原則**：

1. **兩者不互通**：Blogger labels 與 FB hashtags 為**獨立資料**；同一 series 之兩欄位**內容可一致 / 略異 / 完全不同**，由作者決定
2. **不做格式轉換互用**：實作上**不應**將 `series.hashtags` 之 `#` 去除後當 `series.tags`；亦**不應**將 `series.tags` 加 `#` 後當 `series.hashtags`
3. **不直接沿用**：candidate 7 之 Blogger inheritance 實作**必須**以 `series.tags` 為資料來源；**不得**直接讀 `series.hashtags`
4. **避免設計層誤用**：normalize / build-blogger 之未來接入應嚴格走 `series.tags` namespace；不引入 `series.hashtags` 之 cross-reference

### 22.6 scope 邊界

`series.tags` 之 scope 邊界（per series-schema §9 / §10 既有原則）：

| 範圍 | 是否接入 | 理由 |
|---|---|---|
| `.publish.json` | ❌ **不放** | per §9.1「series 屬內容屬性，不放 .publish.json」 |
| `.fb.md` | ❌ **不放** | per §10.1「.fb.md frontmatter 第一版 7 欄位 + Phase 8-e-2 之 titleEn 第 8 欄位；不含 series 相關欄位」 |
| GitHub 站之 tag 頁 | ❌ **不影響** | GitHub 站之 tag 頁生成沿用 `frontmatter.tags`；本規格不擴張至 GitHub |
| Facebook promotion / `.fb.md` | ❌ **不影響** | per §22.5 分離原則；FB 端走 `series.hashtags`；本規格不擴張至 FB |
| validate-content 規則 | ❌ **不新增** | `series.tags` 屬選填；空值合理；沿用 `series.hashtags` 之既有「無 validate 規則」處理 |
| build pipeline | ❌ **本批不接** | Phase 8-g-18-b 僅 docs 規格化；不動 build-blogger / build-github / build-promotion / build-sitemap |

### 22.7 後續接入批次（不在本批 scope）

| 批次 | 範圍 | 預期 |
|---|---|---|
| Phase 8-g-18-c | `normalize-post-output.js` 接入 `series.tags` 解析 + post-pass backfill `normalized.publish.blogger.tags` | mirror Phase 8-f-7-b 之 hashtags backfill pattern；**資料層 only**；不接 build-blogger；dist byte-identical |
| Phase 8-g-18-d（可選）| `build-blogger.js` 改 tags 來源為 `normalized.publish.blogger.tags` 優先 + legacy `post.tags` fallback | mirror Phase 8-d 之 normalized 優先 + legacy fallback pattern；對既有 posts（無 series）dist 完全 byte-identical；對未來 series posts 啟用 inheritance |
| Phase 8-g-18-e | docs sync（future-roadmap + phase-8g-completion-report）| sync candidate 7 ✅ landed |

各後續批次屬獨立排程；本 §22 規格化批次完成後可依優先序逐批進行。

### 22.8 對 validate / build / dist 之影響

per 本批 docs only：

| 影響面 | 變動？ |
|---|---|
| `npm run validate:content` baseline | ❌ 不變（純 docs）|
| `npm run build:*` 輸出 | ❌ 不變 |
| `dist` / `dist-blogger` / `dist-promotion` baseline | ❌ 不變 |
| `package.json` | ❌ 不變 |
| `content/settings/series.json` 既有 `{"series":[]}` | ❌ 不變（`series.tags` 屬選填；既有 empty array 仍 valid）|

### 22.9 cross-link

- `docs/fb-sidecar-schema.md` §12.3.1（Phase 8-f-7-b 落地時補述「Blogger post.tags 與 FB hashtags 不互通」之規格依據）
- 本文件 §8 hashtags 規則（與 `series.tags` 之短 slug 格式對齊）
- 本文件 §9 與 `.publish.json` 之分工（series 不放 sidecar）
- 本文件 §10 與 `.fb.md` 之分工（series 不放 sidecar）
- 本文件 §11.2 series 集中管理位置（hybrid 策略；文章層覆寫優先）
- 本文件 §19 Phase 8-f-7 hashtags inheritance 接入實況（normalize backfill pattern；mirror 對象）
- 本文件 §19.7 未來候選（原 Blogger `post.tags` inheritance bullet 已標 strikethrough 並指向本 §22）

---

（本文件結束）
