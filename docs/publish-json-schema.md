# `.publish.json` 欄位規格 (Publish Bundle Schema)

本文件為 `.publish.json` 之完整欄位規格與驗證規則。所有讀取、寫入、驗證 `.publish.json` 之實作皆須以本文件為準。本文件之上層規範詳見 `docs/publish-bundle.md`。

對應之範本檔為 `content/templates/_sample.publish.json`，作者建立新檔時應自該範本複製。

---

## §1 檔名規則

### 1.1 命名

每篇文章之 `.publish.json` 檔名為：

```
{slug}.publish.json
```

`{slug}` 必須與同資料夾內之 `{slug}.md` 之 frontmatter `slug` 欄位完全一致。

### 1.2 位置

`.publish.json` 與對應之 `.md` 位於同一資料夾。本檔同時適用於 `posts/` 與 `pages/` 資料夾：

posts：

```
content/blogger/posts/20260504-sample-book-review.md
content/blogger/posts/20260504-sample-book-review.publish.json

content/github/posts/20260504-portable-blog-system-mvp.md
content/github/posts/20260504-portable-blog-system-mvp.publish.json
```

pages：

```
content/blogger/pages/about.md
content/blogger/pages/about.publish.json

content/github/pages/tools-index.md
content/github/pages/tools-index.publish.json
```

`pages/` 之 publish bundle 規範與 `posts/` 完全一致；publish bundle 適用範圍與 Page 一級支援詳見 `docs/publish-bundle.md` §2.5。

不得置於 `content/templates/`、`content/{site}/posts/`、`content/{site}/pages/` 以外之其他資料夾，亦不得置於 `dist-*` 內。

### 1.3 編碼與格式

- 編碼：UTF-8 無 BOM
- 換行：LF（與專案其他文字檔一致）
- 內容：合法 JSON
  - 不得含註解語法（包含 `//`、`/* */`、`#` 任一形式）
  - 不得含尾逗號 (trailing comma)
  - 字串以雙引號 `"` 包覆
- 範本檔（檔名以底線 `_` 起首之 sample 檔，置於 `content/templates/`）允許包含頂層 `$comment` 欄位作為 JSON-native 文件註解；正式文章之 `.publish.json` **不得**包含 `$comment` 欄位（§9.1 對應 warning 規則）

### 1.4 一對一關係

一篇文章對應一份 `.publish.json`。`.publish.json` 不得脫離對應 `.md` 單獨存在；若 `.md` 被刪除，對應之 `.publish.json` 應一併刪除或移至 `content/archive/`（屬作者操作）。

---

## §2 頂層欄位

`.publish.json` 之頂層為 JSON object，包含下列六個 key：

| 欄位 | 型別 | 必填 | 預設值 | 摘要 |
| --- | --- | --- | --- | --- |
| `schemaVersion` | integer | 是 | `1`（缺省視同 `1`） | schema 版本；合法值 `1`（legacy）/ `2`（見 §5.7）。缺省 → `1`。非整數 / `0` / 負數 / 大於目前支援版本 → **error**（fail-closed，見 §9.2） |
| `canonical` | object | 是 | 見 §3 | canonical URL 與來源平台 |
| `ogImage` | object | 是 | 見 §4 | 社群分享預覽圖 |
| `blogger` | object | 是 | 見 §5 | Blogger 平台發布資料 |
| `github` | object | 是 | 見 §6 | GitHub Pages 平台發布資料 |
| `seo` | object | 是 | 見 §7 | SEO meta 資料 |

「必填」於本表表示**頂層 key 必須存在**；其下子欄位之必填規則詳見 §8。

不得新增本表以外之頂層欄位。新增頂層欄位屬破壞性變更，須升 `schemaVersion`（詳見 `docs/publish-bundle.md` §5）。

`contentKind` 為內容型態欄位，**屬內容屬性**，放在 `.md` frontmatter（詳見 `docs/publish-bundle.md` §2.4 與 §2.6.1），**不得**置於本檔。`blogger.type`（§5.6）為 Blogger 發布端型態，與 `contentKind` 為獨立兩維度，不可混用、不可相互推導。

`series`（系列文章 metadata，含 `series.id` / `series.name` / `series.number` 等欄位）為內容語意分組欄位，**屬內容屬性**，放在 `.md` frontmatter 或集中設定檔 `content/settings/series.json`（詳見 `docs/series-schema.md` §1 與 §11），**不得**置於本檔。`.publish.json` 僅承載平台發布狀態與回填資料；違反者於 validate 階段列 warning（沿用 `docs/publish-bundle.md` §2.6.4 之硬性原則）。

---

## §3 `canonical` 區塊

### 3.1 結構

```
canonical: {
  url:    string,
  source: "auto" | "github" | "blogger" | "manual"
}
```

### 3.2 欄位說明

| 欄位 | 型別 | 必填 | 預設值 | 說明 |
| --- | --- | --- | --- | --- |
| `url` | string | 否 | `""` | 最終 canonical URL；空字串表示尚未決定，待 build 由 source 推導 |
| `source` | enum | 是 | — | canonical 來源平台；列舉值見 §3.3 |

### 3.3 `source` 列舉值

第一版允許下列四個值：

- `"auto"`：尚未手動指定 canonical 來源，由系統依 `primaryPlatform`、各平台 `publishedUrl` 與後續推導規則決定 canonical。注意：**Blogger `publishedUrl` 不得被系統預測**；若 `blogger.publishedUrl` 尚未回填（為空字串），系統不得自行組出 Blogger URL，亦不得作為 canonical 候選來源。詳見 §5.3 之 Blogger URL 規則。
- `"github"`：canonical 指向 GitHub Pages 站
- `"blogger"`：canonical 指向 Blogger 站
- `"manual"`：canonical 為作者手動指定之外部 URL，不由系統推導

未列於上述者皆視為 invalid，validate 階段列為 error。

`"auto"` 為 `_sample.publish.json` 範本之預設值，代表「尚未決定」之初始狀態；作者可保留 `"auto"` 直至明確需要鎖定來源平台時再改為 `"github"` / `"blogger"` / `"manual"`。

### 3.4 與 frontmatter 之 `canonical` 欄位關係

`.md` frontmatter 之 `canonical` 欄位（值通常為 `"auto"` 或外部 URL 字串）為 fallback 用途。當 `.publish.json` 之 `canonical.url` 與 `canonical.source` 同時存在時，sidecar 勝出。

---

## §4 `ogImage` 區塊

### 4.1 結構

```
ogImage: {
  url: string,
  alt: string
}
```

### 4.2 欄位說明

| 欄位 | 型別 | 必填 | 預設值 | 說明 |
| --- | --- | --- | --- | --- |
| `url`  | string | 否 | `""` | 社群分享預覽圖網址；空字串時 fallback 至 frontmatter `cover` |
| `alt`  | string | 否 | `""` | 圖片替代文字；空字串時 fallback 至 frontmatter `coverAlt` |

### 4.3 與 frontmatter `cover` / `coverAlt` 之並存策略

第一版允許 `.md` frontmatter 之 `cover` / `coverAlt` 與 `.publish.json` 之 `ogImage` 並存。當兩者皆有值時：

- sidecar `ogImage.url` 勝
- sidecar `ogImage.alt` 勝
- frontmatter 對應欄位列為 fallback

雙存與否之最終決策延至 Phase 8-b 評估，本階段不限制。

---

## §5 `blogger` 區塊

### 5.1 結構

```
blogger: {
  type:          "post" | "page",
  permalink:     string,
  status:        "draft" | "ready" | "published" | "archived" | "withdrawn",
  publishedUrl:  string,
  publishedAt:   string,
  bloggerPostId: string,
  publishYear:   string,
  publishMonth:  string,
  history:       array<object>,
  lifecycle:     array<object>   // schemaVersion 2 only；見 §5.7
}
```

### 5.2 欄位說明

| 欄位 | 型別 | 必填 | 預設值 | 說明 |
| --- | --- | --- | --- | --- |
| `type` | enum | 否 | `"post"` | Blogger 發布端型態（§5.6）；列舉值 `"post"` / `"page"` |
| `permalink` | string | 否 | `""` | Blogger 自訂網址；空字串時 fallback 至 `.md` frontmatter `slug` |
| `status` | enum | 是 | `"draft"` | 平台發布狀態；列舉值見 §10；`"withdrawn"` 僅 schemaVersion 2 合法（見 §5.7） |
| `publishedUrl` | string | 否 | `""` | Blogger 發布後之正式 URL；唯一真相來源（見 §5.3） |
| `publishedAt` | string | 否 | `""` | ISO 8601 發布時間 |
| `bloggerPostId` | string | 否 | `""` | Blogger 後台之文章 / 網頁 ID |
| `publishYear` | string | 否 | `""` | 4 位年份；僅由 `publishedAt` 推導（見 §5.4）；對 `type === "page"` 無語意意義 |
| `publishMonth` | string | 否 | `""` | 2 位月份；僅由 `publishedAt` 推導（見 §5.4）；對 `type === "page"` 無語意意義 |
| `history` | array | 否 | `[]` | 搬家保留之舊 URL 紀錄；結構見 §5.5。**不得**與 `lifecycle` 混同：`history` 只記 URL migration，withdrawal event **不得**寫入 `history` |
| `lifecycle` | array | 否 | 缺省 | Blogger publication lifecycle transition 紀錄；**僅 schemaVersion 2 合法**；結構與契約見 §5.7 |

### 5.3 `publishedUrl` 與月份路徑規則（重要）

#### 5.3.1 `blogger.type === "post"` 之 URL 結構

當 `blogger.type === "post"`（預設值）時，Blogger 之文章 URL 結構為：

```
https://{blogspot-domain}/{yyyy}/{mm}/{permalink}.html
```

**`{yyyy}` 與 `{mm}` 之月份路徑不可自由改動**。月份路徑由 Blogger 平台依文章實際發布月份產生，作者於 Blogger 後台無法修改。

由此衍生之規則：

1. **`publishedUrl` 必須以實際發布後回填為準**。發布前不得預測或推算正式 URL。
2. 系統 build 階段不得以 `permalink` 與當下月份組合產生 `publishedUrl`。
3. `publishedUrl` 為空字串時，所有依賴正式 URL 之輸出（FB 文案、canonical、sitemap、相關文章導流連結）必須能優雅 fallback 或略過該篇。
4. 發布前之 copy-helper 僅應提示作者「將 permalink 貼入 Blogger 後台之自訂網址欄位」與「發布後將正式 URL 回填至 `.publish.json`」，不得假裝知道正式 URL。

#### 5.3.2 `blogger.type === "page"` 之 URL 規則

當 `blogger.type === "page"` 時，Blogger Page URL **不一定遵守文章 yyyy/mm 路徑規則**。Page URL 之形式由 Blogger 平台依後台設定產生，亦由平台控制，作者不可預測。

由此衍生之規則：

1. **`publishedUrl` 仍以實際發布後回填為準**，發布前不得預測或推算
2. §9.5 之 yyyy/mm URL pattern **不適用於 Page**；對應驗證放寬詳見 §9.5
3. `publishYear` / `publishMonth` 對 Page 無語意意義，建議保留空字串
4. 其餘規則（系統不得自行組出 URL、空字串時優雅 fallback、copy-helper 不得預測）皆與 §5.3.1 一致

簡言之：**Blogger 兩種 type 之共通原則 = `publishedUrl` 為唯一真相**。差異僅在於 URL pattern 結構。

### 5.4 `publishYear` / `publishMonth` 推導規則

`publishYear` 與 `publishMonth` 為輔助欄位，**僅能由 `publishedAt` 推導**：

- 若 `publishedAt` 存在且為合法 ISO 8601 字串，`publishYear` 為其 4 位年份字串、`publishMonth` 為其 2 位月份字串
- 若 `publishedAt` 缺少（空字串）、無效或無法解析，`publishYear` 與 `publishMonth` 必須**留空字串**，不得預測、不得回填當下時間

年月取自 `publishedAt` 之 ISO-8601 **原始日期部分**（字串開頭之 `YYYY-MM`），**不得先換算為 UTC**，亦不得依執行機器之 local timezone 推導。`publishedAt` 所帶之 offset 即代表 Blogger 發布當下之當地時間，該 offset 之年月才是 Blogger URL `/yyyy/mm/` 之月份（§5.3.1），亦為 §9.5 一致性檢查之對象。

例：

```
publishedAt = "2026-08-01T00:30:00+08:00"
→ publishYear = "2026" / publishMonth = "08"
```

該值換算為 UTC 會變成 `2026-07-31T16:30:00Z`；若據此推導會得出錯誤之 `"07"`，與 Blogger 實際 URL `/2026/08/` 矛盾。同理 `2026-12-31T23:30:00-05:00` 之正確年月為 `2026` / `12`，而非 UTC 換算後之 `2027` / `01`。推導結果不得因執行機器 timezone 而改變。

不得由 `.md` frontmatter `date` 欄位推導 `publishYear` / `publishMonth`。`date` 為作者撰寫日期，與 Blogger 實際發布月份無關。

不得由 `permalink` 反向推算月份。

不得以「當下時間」或任何猜測值補入。無效之時間戳（含看似 ISO 但實際不存在之曆法日期，例 `2026-02-30T10:00:00+08:00`）必須 fail-closed 留空字串；不得因字串前七碼看似 `YYYY-MM` 就繞過完整日期驗證。

### 5.5 `history` 結構

`history` 為陣列，每筆紀錄結構：

```
{
  url:        string,
  from:       string,
  to:         string,
  note:       string,
  recordedAt: string
}
```

| 欄位 | 型別 | 必填 | 說明 |
| --- | --- | --- | --- |
| `url` | string | 是 | 舊 URL |
| `from` | string | 否 | 舊平台 / 舊網域名稱 |
| `to` | string | 否 | 新 URL（搬家後） |
| `note` | string | 否 | 作者備註（搬家原因等） |
| `recordedAt` | string | 否 | 紀錄建立時間 ISO 8601 |

`history` 用於搬家保留、redirect map 產生、SEO 轉移紀錄、canonical 切換歷史。第一版 build 流程不主動讀取 `history`，僅作為人工備份用途。

### 5.6 `type`：Blogger 發布端型態

`type` 欄位描述「於 Blogger 後台之管理區」，與 `.md` frontmatter 之 `contentKind` 為**獨立兩維度**。

合法值：

- `"post"`：Blogger 後台之「文章」管理區（**預設值**）
- `"page"`：Blogger 後台之「網頁」管理區（固定頁）

設計原則：

- `type` 與 `contentKind` 不可混用、不可相互推導
- 同一篇文章之 `contentKind` 與 `blogger.type` 取值可不同
  - 例 1：`contentKind: book-review` + `blogger.type: post` → 書評內容，發到 Blogger「文章」區
  - 例 2：`contentKind: page` + `blogger.type: page` → 固定頁（About / 工具目錄 / 下載索引頁），發到 Blogger「網頁」區
- 詳見 `docs/publish-bundle.md` §2.4

`type` 不得寫入 `.md` frontmatter；`contentKind` 不得寫入 `.publish.json`。違反者於 validate 階段列 warning（實作落地時機為 Phase 8-b / 8-c）。

`type` 之取值決定 §5.3 之 URL 規則分支：`post` 走 §5.3.1、`page` 走 §5.3.2。Page 與 post 之共通原則為「`publishedUrl` 為唯一真相」（§5.3.1 / §5.3.2）。

### 5.7 `status: "withdrawn"` 與 `lifecycle`（schemaVersion 2；Slice 4B）

> 上位契約：`docs/20260720-publish-target-stage-contract.md` §11（Slice 4B）。
> 實作：`src/scripts/sidecar-withdrawal-contract.js`（純函式 helper）+ `src/scripts/validate-content.js`（wiring）+ guard `check:sidecar-withdrawal-schema`。

#### 5.7.1 語意

`status: "withdrawn"` 表示：**該 sidecar 仍保留 Blogger publication truth，但目前已不再代表 active Blogger publication**。它不同於 `draft` / `ready` / `published` / `archived`，且**不得**以 `archived` 取代 `withdrawn`。

`withdrawn` 只描述 **repository publication truth**，**不**代表遠端 Blogger 文章的真實狀態（可能已刪除 / 轉草稿 / 仍公開 / 已失效 / permalink 已改變）。遠端狀態由 lifecycle event 的 `remoteDisposition` 獨立記錄（operator-confirmed observation，**不**代表系統執行任何 remote action）。

**eligibility 仍由 stage 決定**：Blogger production eligibility 只由 `publishTargets.blogger.stage` 決定（§`docs/20260720-...` §1–§4）。`status` **不得**成為第二套 production stage selector。

#### 5.7.2 schemaVersion 相容（§9.2）

- 缺省 / `schemaVersion: 1`：維持既有合法行為；**不得**使用 `blogger.status: "withdrawn"` 或 `blogger.lifecycle`。v1 誤用上述 v2-only 功能 → **error**。
- `schemaVersion: 2`：可繼續使用 `draft` / `ready` / `published` / `archived`，亦可使用 `withdrawn`；並可新增 `blogger.lifecycle`。`blogger.status` **fail-closed**：缺漏 / 非字串 / 空 / whitespace / 未知值 / 大小寫變體（如 `"Published"` / `"WITHDRAWN"`）皆 → **error**（僅接受 §10 五個小寫列舉值）。
- 未知 / 非整數 / `0` / 負數 / 大於目前支援版本 → **error**（fail-closed）。
- 本契約**不要求**既有 sidecar 全面 migration；既有 v1 sidecar 不因本契約被升版或改寫。

#### 5.7.3 active publication evidence 保留

withdrawal **不得**清空、刪除或搬移下列既有發布證據（歷史發布真值，保留原值）：

```
blogger.publishedUrl / blogger.publishedAt / blogger.bloggerPostId
blogger.publishYear / blogger.publishMonth / blogger.permalink
```

consumer 讀取端（Slice 4A，`src/scripts/active-publication.js`）契約：**只有** `blogger.status === "published"` **且** `publishedUrl` 為非空字串時，`publishedUrl` 才是 active publication URL；`withdrawn` 一律視為 inactive。

#### 5.7.4 `lifecycle[]` 結構

`lifecycle` 為陣列，記錄 publication lifecycle transition，**不得**取代 `history[]` 的 URL migration 語意。本 Slice 只正式支援 `event: "withdrawn"`。

當 `status === "withdrawn"` 時，下列全部必須成立（否則 error；schema 不完整**不得**只是 warning）：

- `schemaVersion === 2`
- `blogger.publishedUrl` 為非空字串、`blogger.publishedAt` 為含時區之合法 ISO-8601
- `blogger.lifecycle` 為非空陣列，且最後一個 event 為 `event="withdrawn"` / `fromStatus="published"` / `toStatus="withdrawn"`
- `bloggerPostId` 可為空字串（現行 contract 禁止 fabrication）

每個 withdrawn event 必含欄位（精確值 `event="withdrawn"` / `fromStatus="published"` / `toStatus="withdrawn"`）：

```
event / fromStatus / toStatus / recordedAt / remoteVerifiedAt / reason /
remoteDisposition / sourcePath / sourceSha256 / priorSidecarSha256 /
gitHead / authorizationFingerprint
```

格式與 enum：

| 欄位 | 規則 |
| --- | --- |
| `sourceSha256` / `priorSidecarSha256` / `authorizationFingerprint` | 64 字元 lowercase hex |
| `gitHead` | 40 字元 lowercase hex |
| `sourcePath` | canonical POSIX-relative；string、非空、無 NUL、無 `\`、非 whitespace-padded（不得 trim 後才合法）、無 URI scheme（如 `file://`）、非 absolute；segment 不得為空（禁 `//` 與前後 `/`）/ `.` / `..`；`path.posix.normalize(v) === v`；位於 `content/blogger/posts/`；以 `.md` 結尾。不得 normalize 後默默接受非法原值 |
| `recordedAt` / `remoteVerifiedAt` | 含時區之 **strict** ISO-8601：`YYYY-MM-DDTHH:mm:ss[.sss]Z` 或 `YYYY-MM-DDTHH:mm:ss[.sss]±HH:MM`（fractional seconds optional）。必為 string，逐 component 驗證曆法（month 01–12、day 依當月與 leap year、hour 00–23、minute 00–59、second 00–59；leap year = 被 400 整除，或被 4 整除但不被 100 整除）；timezone offset 上限 `±14:00`（`14` 時 minute 只能 `00`）。禁前後 whitespace / 無時區 / date-only / number / null / trim 後才接受。lexical + calendar 皆通過後才以 epoch milliseconds 比較：`remoteVerifiedAt` 不得晚於 `recordedAt`（不用字串排序） |
| `reason` | `stage-preview` / `content-retirement` / `publication-error` / `policy` / `migration` / `other`；`other` 可帶非空 `reasonDetail`；非 `other` 時不要求 `reasonDetail`，若存在須非空字串 |
| `remoteDisposition` | `remote-live` / `remote-draft` / `remote-deleted` / `remote-unavailable` / `remote-permalink-changed` / `operator-confirmed-inactive`（operator-confirmed observation；非本 Slice 執行之 remote action。舊值 `confirmed-inactive` 已移除、視為 error） |

排序與去重：`recordedAt` 須按陣列順序不遞減；本 Slice 最多允許一個 `withdrawn` event；重複 withdrawn event、status/last-event 不一致（status 為 withdrawn 但最後 event 不是 withdrawn，或反之）皆為 error。

#### 5.7.5 public / private 邊界（strict allowlist）

lifecycle event 採 **strict allowlist**（fail-closed 第一層 gate）：僅允許 `event` / `fromStatus` / `toStatus` / `recordedAt` / `remoteVerifiedAt` / `reason` / `reasonDetail`（optional）/ `remoteDisposition` / `sourcePath` / `sourceSha256` / `priorSidecarSha256` / `gitHead` / `authorizationFingerprint`。**任何**不在白名單之 key（含下列私人核准欄位、重複 publication evidence 欄位，及任意未知 key 如 `approved_by` / `email` / `operator` / `previous` / `randomJunk`）皆 → error。

其中私人核准資訊（`approvedBy` / `operatorName` / `operatorEmail` / `approvalNote` / `privateManifestPath` / `authorizationPath` 等）與重複之 active publication evidence（`publishedUrl` / `publishedAt` / `bloggerPostId` / `publishYear` / `publishMonth` / `permalink`）另以更精確之 error type 回報，但 allowlist 才是主要 gate。公開 sidecar 只保存 `authorizationFingerprint`；核准者與私人 authorization 內容未來只存在於 repo 外之 `operator-private/`（本 Slice **不**建立）。active publication evidence 已保留在 `blogger` 區塊，lifecycle event 不得重複保存。

error output **只**回顯 field name / error type / `sidecarPath` / `sourcePath`，**絕不**回顯任何 key 值（unknown key 值、URL、email、path、`reasonDetail` 值皆不得出現於 issues / stdout / stderr）。

#### 5.7.6 append-only（範圍聲明）

`blogger.lifecycle[]` 於契約上為 **append-only**。惟 validator 只能檢查目前 snapshot 的結構與順序，**無法**從單一檔案證明歷史未被改寫；append-only 之實際 mutation enforcement 留待 future apply capability（本 Slice 未實作 planner / authorization / rehearsal / apply）。

#### 5.7.7 stage × status 診斷（§8 truth table 摘要）

| stage | status | 診斷 |
| --- | --- | --- |
| preview | published | warning `publish-target-stage-conflicts-published-sidecar`（既有） |
| preview | withdrawn | 無診斷（合法 steady state；前提 withdrawn schema 有效） |
| production（含 missing→default） | withdrawn | warning `publish-target-stage-conflicts-withdrawn-sidecar`（新增） |
| invalid stage | 任意 | invalid-stage error 優先（不因 withdrawn 而 downgrade / fallback / 隱藏） |

validator output **不得**回顯 `publishedUrl`、lifecycle 內任何 URL 值、operator identity 或 authorization / private path；只回顯 `sourcePath` / `sidecarPath` / error type / 欄位名稱 / 安全短碼。

---

## §6 `github` 區塊

### 6.1 結構

```
github: {
  slug:         string,
  path:         string,
  status:       "draft" | "ready" | "published" | "archived",
  publishedUrl: string,
  publishedAt:  string
}
```

### 6.2 欄位說明

| 欄位 | 型別 | 必填 | 預設值 | 說明 |
| --- | --- | --- | --- | --- |
| `slug` | string | 否 | `""` | GitHub Pages 路徑用 slug；空字串時 fallback 至 `.md` frontmatter `slug` |
| `path` | string | 否 | `""` | 頁面相對路徑（含前後斜線），例 `/posts/{slug}/` |
| `status` | enum | 是 | `"draft"` | 平台發布狀態；列舉值見 §10 |
| `publishedUrl` | string | 否 | `""` | GitHub Pages 上線後之正式 URL |
| `publishedAt` | string | 否 | `""` | ISO 8601 發布時間 |

### 6.3 與 Blogger URL 規則之差異

GitHub Pages 之 URL 結構由本專案 `site.config.json` 之 `githubSiteUrl` 與 `path` 推導，**不含月份路徑**，亦不依平台動態產生。

GitHub URL 推導邏輯**獨立**於 Blogger，兩者不共用同一套推導器。

GitHub 之 `publishedUrl` 仍建議於部署後回填，但因 GitHub URL 可預測，build 階段允許以 `githubSiteUrl + path` 推導為 fallback；Blogger 不得 fallback。

---

## §7 `seo` 區塊

### 7.1 結構

```
seo: {
  metaTitle:       string,
  metaDescription: string,
  robots:          string
}
```

### 7.2 欄位說明

| 欄位 | 型別 | 必填 | 預設值 | 說明 |
| --- | --- | --- | --- | --- |
| `metaTitle` | string | 否 | `""` | meta title 覆寫；空字串時 fallback 至 `.md` frontmatter `title` |
| `metaDescription` | string | 否 | `""` | meta description 覆寫；空字串時 fallback 至 frontmatter `description` |
| `robots` | string | 否 | `"index,follow"` | robots meta 指示字串 |

### 7.3 `robots` 常用值

第一版不限制 `robots` 之取值，但建議使用以下標準字串：

- `"index,follow"`（預設，公開索引）
- `"noindex,nofollow"`（測試文章）
- `"noindex,follow"`（暫不索引但允許爬連結）

非標準字串於 build 階段不擋，但於 validate 階段列 warning。

---

## §8 必填與選填規則

### 8.1 文件層級必填

`.publish.json` 之頂層六個 key（`schemaVersion`、`canonical`、`ogImage`、`blogger`、`github`、`seo`）皆**必須存在**。缺漏視為 schema-broken，validate 階段列為 error。

### 8.2 子欄位必填規則（依平台 status）

子欄位之必填性依各平台之 `status` 動態判定。下表為發布生命週期內各平台 status 對應之**該平台**必填欄位：

| 平台 status | 該平台必填欄位 |
| --- | --- |
| `draft` | （無；皆選填） |
| `ready` | 該平台之 `permalink`（blogger）或 `slug`（github） |
| `published` | 該平台之 `permalink` / `slug`、`publishedUrl`、`publishedAt` |
| `archived` | （無；保留既有資料即可） |

說明：

- `blogger.status === "ready"` → 至少 `blogger.permalink` 不得為空字串
- `blogger.status === "published"` → `blogger.permalink` / `blogger.publishedUrl` / `blogger.publishedAt` 皆不得為空
- `github.status === "ready"` → 至少 `github.slug` 不得為空字串
- `github.status === "published"` → `github.slug` / `github.publishedUrl` / `github.publishedAt` 皆不得為空

平台 status 為 `draft` 或 `archived` 者，其平台子欄位皆無必填要求。

### 8.3 跨欄位必填

當 `blogger.status === "published"` **或** `github.status === "published"` 時，`canonical.source` 必須為列舉值之一（不得為其他字串）。

當 `blogger.status === "published"` **與** `github.status === "published"` 同時成立時，`canonical.source` 用以決定哪個平台為 canonical 來源。

### 8.4 選填欄位之 fallback 順序

選填欄位空字串時之 fallback 順序：

| 欄位 | fallback 來源 |
| --- | --- |
| `canonical.url` | 由 `canonical.source` 對應平台之 `publishedUrl` 推導 |
| `ogImage.url` | `.md` frontmatter `cover` |
| `ogImage.alt` | `.md` frontmatter `coverAlt` |
| `blogger.permalink` | `.md` frontmatter `slug` |
| `github.slug` | `.md` frontmatter `slug` |
| `github.path` | `/posts/{github.slug}/` |
| `github.publishedUrl` | `site.config.json` `githubSiteUrl` + `github.path` |
| `seo.metaTitle` | `.md` frontmatter `title` |
| `seo.metaDescription` | `.md` frontmatter `description` |

`blogger.publishedUrl` **不得** fallback 推導；其為唯一真相來源（§5.3）。

---

## §9 驗證規則

### 9.1 Schema 結構驗證

- `.publish.json` 必須為合法 JSON（parse 失敗 → error）
- 頂層必須為 object（陣列、字串、null 皆 → error）
- §2 表列之頂層 key 缺漏 → error
- 出現 §2 表列以外之頂層 key → warning（範本檔之 `$comment` 欄位例外，見 §1.3）

### 9.2 schemaVersion 驗證

- `schemaVersion` 缺省 → 視同 `1`（legacy backward compatibility）
- 合法整數值：`1` / `2`（`2` 之新增能力見 §5.7）
- 非整數 / `0` / 負數 / 大於目前支援版本（目前為 `2`）→ **error**（fail-closed）
- v1 / legacy sidecar 使用 v2-only 功能（`blogger.status: "withdrawn"` 或 `blogger.lifecycle`）→ **error**
- 本規則（Slice 4B）已於 `validate-content.js` 落地（單一事實來源：`src/scripts/sidecar-withdrawal-contract.js`）；後續版本升級時於 `docs/publish-bundle.md` §5 同步更新

### 9.3 列舉值驗證

| 欄位 | 合法值 | 違反 severity |
| --- | --- | --- |
| `canonical.source` | `"auto"` / `"github"` / `"blogger"` / `"manual"` | error |
| `blogger.type` | `"post"` / `"page"` | error |
| `blogger.status` | §10 列舉值（`"withdrawn"` 僅 schemaVersion 2；見 §5.7） | error |
| `github.status` | §10 列舉值 | error |

### 9.4 字串格式驗證

| 欄位 | 格式規則 | 違反 severity |
| --- | --- | --- |
| `canonical.url` | 空字串或 `^https?://` | warning |
| `ogImage.url` | 空字串或 `^https?://` | warning |
| `blogger.publishedUrl` | 空字串或符合 §9.5 之 Blogger URL pattern | warning |
| `github.publishedUrl` | 空字串或 `^https?://` | warning |
| `blogger.publishedAt` | 空字串或合法 ISO 8601 | warning |
| `github.publishedAt` | 空字串或合法 ISO 8601 | warning |
| `blogger.publishYear` | 空字串或 `^\d{4}$` | warning |
| `blogger.publishMonth` | 空字串或 `^(0[1-9]\|1[0-2])$` | warning |

### 9.5 Blogger URL pattern

當 `blogger.type === "post"` 且 `blogger.publishedUrl` 非空時，建議符合：

```
^https?://[^/]+/\d{4}/\d{2}/[a-z0-9-]+\.html$
```

不符合者列為 warning，不阻擋 build。實際 Blogger 文章 URL 結構以 Blogger 平台輸出為準。

當 `blogger.type === "page"` 時，本 yyyy/mm pattern **不適用**，因 Blogger Page URL 不一定遵守文章年月結構。Page 之 `publishedUrl` 驗證僅檢查空字串或 `^https?://`（沿用 §9.4 之一般 URL pattern 規則），不額外要求 yyyy/mm 格式。

### 9.6 推導一致性驗證

下列規則僅於 `blogger.type === "post"` 時適用；`blogger.type === "page"` 時不檢查 yyyy/mm 一致性（Page URL 不遵守年月結構）：

- 若 `blogger.publishYear` 與 `blogger.publishMonth` 皆有值，則須與 `blogger.publishedAt` 推導之年月一致；不一致 → warning
- 若 `blogger.publishedUrl` 有值，其 yyyy/mm 部分應與 `blogger.publishYear` / `blogger.publishMonth` 一致；不一致 → warning

### 9.7 必填驗證（依 §8）

依 §8.2 / §8.3 之必填規則檢查；缺漏 → error。

### 9.8 規則生效時機

§9.1 / §9.3–§9.7 之驗證規則之**實作落地時機為 Phase 8-b 之後**，Phase 8-a 階段本文件僅作為規範依據。

**例外（已落地）**：§9.2 schemaVersion 驗證與 §5.7 withdrawn / lifecycle 契約已於 Phase 20260721 Slice 4B 落地於 `validate-content.js`（單一事實來源 `src/scripts/sidecar-withdrawal-contract.js`，focused guard `check:sidecar-withdrawal-schema`）。此落地僅涵蓋 schemaVersion + withdrawn + lifecycle read-only classification / validation，**不含** planner / authorization / rehearsal / apply / remote action。

---

## §10 與 frontmatter 的關係

### 10.1 source 優先序

`.publish.json` 為 sidecar，與 `.md` frontmatter 並存時：

- sidecar 之值勝出
- frontmatter 同欄位之值僅作 fallback
- 兩者皆有值且不同 → warning（不 error；詳見 `docs/publish-bundle.md` §3.2）

### 10.2 status 欄位之關係

- `.md` frontmatter 之 `status` 與 `draft` 為**文件層級**狀態（沿用 Phase 1-7 既有定義）
- `.publish.json` 之 `blogger.status` / `github.status` 為**平台層級**狀態，可分別管理
- `blogger.status` 平台層級列舉值：`draft` / `ready` / `published` / `archived` / `withdrawn`（`withdrawn` 僅 schemaVersion 2 合法，語意見 §5.7；`withdrawn` **不**改變文件層級 `status`，亦**不**構成 production stage selector）
- 兩層級狀態可不同。例：`.md` frontmatter `status: "ready"`、`.publish.json` `blogger.status: "published"` 同時 `github.status: "draft"`，視為「文件已備好；Blogger 已發；GitHub 仍草稿」之合法狀態

文件層級 `status` 用於 `load-posts` 過濾（既有 Phase 1-7 邏輯不變）；平台層級 `status` 用於各平台 build 之必填驗證與 publishedUrl 強制度判定。

### 10.3 欄位對照（簡略）

`.md` frontmatter 與 `.publish.json` 之欄位對照與遷移指引，詳見 `docs/migration-from-frontmatter.md`（Phase 8-a 第四批建立）。本文件不重複列出。

---

## §11 範本參照

### 11.1 起點範本

作者建立新 `.publish.json` 時，應自下列範本複製為起點：

```
content/templates/_sample.publish.json
```

該範本為合法 JSON，包含 §2 至 §7 全部頂層欄位之欄位骨架，且預設值符合本文件之 draft 狀態規範。

範本之 `blogger.type` 預設為 `"post"`；建立 Blogger Page 之 `.publish.json` 時，作者應將該值改為 `"page"`。

範本以底線 `_` 起首，且包含頂層 `$comment` 欄位作為 JSON-native 文件註解（§1.3）；正式文章之 `.publish.json` **不得**保留 `$comment`，作者複製範本後應刪除該欄位。

### 11.2 假想遷移範本

如需參考現有文章假想搬到 sidecar 後之長相，詳見：

```
content/templates/_sample-from-frontmatter.publish.json
```

（屬 Phase 8-a 第八批建立。）

### 11.3 範本與本規範之一致性

範本檔之欄位、預設值、結構必須與本文件一致。若兩者不同，以本文件為準，範本應更新對齊。範本變更不視為 schema 變更，不需升 `schemaVersion`。

---

## §12 相關文件

### 12.1 Phase 8 系列完成報告

下列為 Phase 8-b 起至 Phase 8-g 之完成報告，含實作落地紀錄、commit 清單、驗證結果與後續候選排程：

- `docs/phase-8b-completion-report.md`（Phase 8-b：load-posts sidecar 整合）
- `docs/phase-8c-completion-report.md`（Phase 8-c：placeholder resolver helper + validate / build-promotion 接入）
- `docs/phase-8d-completion-report.md`（Phase 8-d：normalized post output helper；含本文件 §5.3 Blogger URL 規則之 normalized 接入紀錄）
- `docs/phase-8e-completion-report.md`（Phase 8-e：series metadata schema 規格化）
- `docs/phase-8f-completion-report.md`（Phase 8-f：series metadata 接入 build pipeline）
- `docs/phase-8g-completion-report.md`（Phase 8-g：候選分析 + `new-post.js` series prompt + validate series 規則）

### 12.2 跨 Phase 路線總覽

- `docs/future-roadmap.md`（Phase 8 系列進度與下一步候選排程）

---

（本文件結束）
