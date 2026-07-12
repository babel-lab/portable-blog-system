# Blogger B1 人工 Preview 測試紀錄 — `we-media-myself2`（live manual paste；docs-only）

- 建立日期：2026-07-12（Asia/Taipei）
- 最後更新：2026-07-12 21:04（Asia/Taipei）—— 三項人工收尾結果 + author parity 補充落地
- 類型：docs-only **manual test evidence 記錄**（唯一 repo mutation = 本 doc 新增；**不**改
  source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` /
  `CLAUDE.md` / `MEMORY.md` / `memory/`；不新增 npm script；不動 `.gitignore`；不動 CSS / SCSS / EJS
  / renderer；不動 frontmatter / sidecar）
- 目的：把 Dean 於 2026-07-12 於 Blogger 平台實際貼上 `dist-blogger/posts/we-media-myself2/post.html`
  之後之 40 項 sanity 觀察結果落地為 evidence 記錄；本篇為 rehearsal（`docs/20260712-blogger-preview-b1-one-post-operational-rehearsal.md`）
  之後之下一步（Dean 手動於瀏覽器完成，per rehearsal §9），並在初次觀察後之三項人工收尾動作
  完成後更新為**最終判定**。
- 觸發：Dean 於 2026-07-12 完成 Blogger 平台人工 Preview 測試後，交出全篇觀察結果，之後於 21:04
  提供三項收尾結果（scoped query / overflow offender / test post 撤回）與 author parity 補充，
  要求結束 idle-freeze 並將本紀錄收斂為 evidence-complete。
- 本輪界線（docs-only）：**不** build / **不**重新 build `dist-blogger/` / **不**改任何 frontmatter /
  **不**改任何 sidecar `.publish.json` / **不**動 Blogger backfill 語意 / **不**猜 Blogger
  `bloggerPostId` / `publishedUrl` / `publishedAt` / **不**碰 AdSense / GA4 / Google Drive /
  Search Console / DNS / domain 後台 / **不**動 `CLAUDE.md` / `MEMORY.md` / `memory/` / **不**新增
  guard / npm script / **不**動 `.gitignore` / **不**改 CSS / SCSS / EJS / renderer / **不**開
  CSS / EJS fix phase / **不**批次替換 `Dean` / **不**實作 `byline.showAuthor` / **不**改
  template / schema / validator。
- 本輪 Dean 動作 vs Claude 動作分界：本次 Blogger 平台之貼上、預覽、發布、觀察、scoped query 執行、
  overflow offender 定位、測試文章撤回為草稿均為 **Dean 手動操作**；Claude 於本 session **未登入**
  Blogger / AdSense / GA4 / Search Console 或任何 Google 後台；Claude 本 slice 之責任僅為將 Dean 之
  觀察與收尾結果落地為 docs record。

---

## 0. Boot baseline

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `1ea5d58` | `== origin/main` ✅ | `0 / 0` | clean（本 slice 前）| absent ✅ |

Source HEAD full hash（本 slice 前）= `1ea5d58823561b2fc5b41050d230183af915ff83`；subject
`docs(blogger): record b1 preview rehearsal`。

Deploy clone 本 slice **未讀 / 未寫 / 未觸碰**（本紀錄為 Blogger 平台觀察，與 gh-pages deploy 無關）。

---

## 1. 測試 artifact

Source 檔：

```text
content/blogger/posts/20260515-we-media-myself2.md
```

`dist-blogger/` 4 檔（rehearsal §5.1 已列；本次貼上之來源）：

```text
dist-blogger/posts/we-media-myself2/post.html
dist-blogger/posts/we-media-myself2/meta.json
dist-blogger/posts/we-media-myself2/copy-helper.txt
dist-blogger/posts/we-media-myself2/publish-checklist.txt
```

`post.html` 已於 rehearsal 前既有（`2026-07-08T15:09:08.xxxZ`；rehearsal 未觸發 rebuild）；本次
Dean 手動貼上之 HTML 內容 = rehearsal 所檢視之 canonical output（本 slice 未 rebuild）。

---

## 2. 最終整體判定

```text
Technical B1 manual rendering result       ：PASS
Portable article output result             ：PASS
External Blogger-theme residual            ：horizontal overflow from recommendation slider
Preview-only process deviation             ：RESOLVED after reverting test post to draft
Overall                                    ：PASS with one resolved process deviation
                                             and one accepted external Blogger-theme residual
```

逐項收斂：

```text
5.0 Navigator                              ：PASS
5.1 Content parity                         ：PASS
5.2 Images / alt / absolute URLs           ：PASS
5.3 Links / affiliate rel                  ：PASS
5.3 GitHub cross-link UTM                  ：N/A（此文章無 GitHub cross-link）
5.4 Metadata / JSON-LD / author parity     ：PASS
5.5 Desktop article RWD                    ：PASS
5.5 Mobile article RWD                     ：PASS
5.5 Whole-page overflow                    ：external Blogger-theme residual
5.6 Applicable optional blocks             ：PASS；未啟用項目 N/A
5.7 Broken assets / project 404            ：PASS
5.8 GitHub cross-check                     ：N/A / not required
5.9 Current boundary                       ：PASS
5.9 Historical process result              ：RESOLVED DEVIATION（曾發布 /2026/07/test.html，
                                             已由 Dean 退回 Blogger 草稿）
```

初次觀察時之三項 pending / FAIL 於本次更新全部收斂（詳 §5 / §6 / §8 / §11 / §12 / §13）：

- §5 image alt / broken images / absolute URLs → PASS（scoped query 佐證）
- §6 relative links → PASS（scoped query 佐證）
- §8.2 mobile no-horizontal-scroll → article PASS；whole-page overflow 來源已定位屬 Blogger theme 之
  推薦文章 slider / read-more 卡片區，**不**位於 `.lab-blogger-article`；不開 CSS / EJS fix phase
- §11 §5.8 cross-check → N/A / not required（因 offender 全在 article 外，system-output hypothesis
  不成立）
- §12 §5.9 preview-only boundary → historical deviation OBSERVED；Dean 已退回草稿 → RESOLVED；
  current state boundary PASS；不改寫成從未發布

---

## 3. 5.0 B1 navigator

Claude 已於前一個 Session（rehearsal，`1ea5d58`）完成唯讀 navigator 驗證：

```text
slug: we-media-myself2
artifacts: 4/4 exists
status: ready
draft: false
bloggerMode: full
advice: complete
text output = JSON output
--dry-run = no-op
```

判定：

```text
PASS
```

---

## 4. 5.1 內容完整性

Blogger 畫面可確認：

* 標題正常呈現。
* 日期與作者顯示正常。
* 中文無亂碼。
* 文章段落與標題正常渲染。
* 未看到 `##`、`**bold**`、`[text](url)` 等 raw Markdown。
* 清單正常顯示。
* 聯盟連結區塊正常顯示。
* 漫畫圖片與相關連結區塊正常顯示。

文章標題與 `meta.json` 一致：

```text
貝果書屋-AI玩轉自媒體的52個商業思維#2(提問筆記書)
```

作者一致：

```text
Dean
```

文章日期一致：

```text
2026-05-15
```

判定：

```text
PASS
```

注意：Blogger 外殼曾顯示 `7/12/2026`，那是測試文章在 Blogger 建立 / 發布的日期，不是 `post.html`
內的文章日期。

---

## 5. 5.2 圖片與 alt

### 5.1 初次（whole-document）觀察

Console 檢查結果：

```text
brokenImages: []
relativeImages: []
```

Network 的圖片請求均可見：

```text
Status: 200
```

文章漫畫圖片實際顯示正常，而且 Inspect 到的文章圖片具有 `alt`，例如：

```html
<img
  alt="Comic 01：書內設計的巧思"
  src="https://blogger.googleusercontent.com/..."
>
```

初次 whole-document 檢查結果為：

```text
rootElement: document
missingAlt: 3
```

當時查詢範圍是整份 Blogger 頁面，包含 Blogger Header、推薦圖、圖示與主題外殼，因此無法直接歸因於
文章輸出。需要以文章範圍 scoped query 重新驗。

### 5.2 Scoped query 結果（.lab-blogger-article）

Dean 於 live 測試頁 Console 執行：

```js
const root = document.querySelector(".lab-blogger-article");

({
  missingAlt: [...root.querySelectorAll("img")].filter(
    (img) => !img.hasAttribute("alt") || !img.alt.trim()
  ),
  brokenImages: [...root.querySelectorAll("img")].filter(
    (img) => !img.complete || img.naturalWidth === 0
  ),
  relativeImages: [...root.querySelectorAll("img")].filter((img) => {
    const src = img.getAttribute("src") || "";
    return src && !/^(https?:)?\/\/|^data:/i.test(src);
  })
});
```

結果：

```text
missingAlt     : []
brokenImages   : []
relativeImages : []
```

### 5.3 收斂判定

```text
Article image alt         ：PASS
Broken images             ：PASS
Relative image URLs       ：PASS
Absolute image URLs       ：PASS（沿用初次 Network 200 觀察）
```

明確記錄：

* 先前以整份 `document` 查到的 missing alt / relative images 屬 Blogger theme / shell 範圍，
  **不能**歸因於 `.lab-blogger-article`。
* Scoped query 證明 portable-blog-system 之文章輸出**無**上述缺陷。

---

## 6. 5.3 連結、UTM 與 affiliate rel

### 6.1 Affiliate rel + UTM

文章中共找到 5 個主要連結：

* 博客來聯盟連結。
* 金石堂聯盟連結。
* 上方與下方重複的 affiliate links。
* Blogger 相關文章連結。

Inspect 結果顯示 affiliate link 的 `rel` 為：

```text
sponsored nofollow noopener noreferrer
```

判定：

```text
Affiliate rel：PASS
```

GitHub cross-link 查詢結果：

```text
[]
length: 0
```

代表這篇文章本身沒有 Blogger → GitHub Pages 的 cross-link。因此：

```text
Cross-link UTM：N/A（此文章無 GitHub cross-link）
```

這不是測試失敗，也不需要為了測 UTM 人工增加連結。

### 6.2 Relative links scoped query

初次 whole-document 查詢出現：

```text
relativeLinks: 2
```

當時 `rootElement` 是 `document`，很可能包含 Blogger 主題自己的 `#` anchor、搜尋按鈕或導覽控制。

Dean 於 live 測試頁 Console 執行 scoped query：

```js
const root = document.querySelector(".lab-blogger-article");

[...root.querySelectorAll("a")]
  .filter((a) => {
    const href = a.getAttribute("href") || "";
    return (
      href &&
      !/^(https?:)?\/\/|^mailto:|^tel:|^#/i.test(href)
    );
  })
  .map((a) => ({
    text: a.textContent.trim(),
    href: a.getAttribute("href")
  }));
```

結果：

```text
relativeLinks: []
```

### 6.3 收斂判定

```text
Relative links in article ：PASS
```

明確記錄：

* 先前以整份 `document` 查到的 relative links 屬 Blogger theme / shell 範圍，**不能**歸因於
  `.lab-blogger-article`。
* Scoped query 證明 portable-blog-system 之文章輸出**無**上述缺陷。

---

## 7. 5.4 Metadata、JSON-LD 與 author parity

### 7.1 Metadata / JSON-LD

`meta.json` 與畫面內容一致：

```text
slug: we-media-myself2
primaryPlatform: blogger
status: ready
draft: false
bloggerMode: full
rendered: full
author: Dean
date: 2026-05-15
category: book-review
```

Canonical：

```text
raw: auto
resolved:
https://babel-lab.blogspot.com/2026/05/we-media-myself2.html
warning: null
```

Tags：

```text
book-review
reading-notes
self-growth
```

畫面文末也正常顯示上述三個 hashtag。

JSON-LD Console 查詢成功解析出：

```text
2 objects
```

而且 Elements 可見：

```html
<script type="application/ld+json">
```

因此：

```text
Metadata：PASS
JSON-LD parse：PASS
```

仍可用以下指令列出重點欄位，作最後紀錄：

```js
[...document.querySelectorAll('script[type="application/ld+json"]')]
  .map((script) => JSON.parse(script.textContent))
  .map((item) => ({
    type: item["@type"],
    headline: item.headline,
    author: item.author,
    datePublished: item.datePublished,
    url: item.url
  }));
```

### 7.2 Author / byline parity 補充

本次測試文章維持：

```text
author: Dean
```

**不修改，也不列為 FAIL**。因為：

```text
post.html / meta.json / JSON-LD / visible byline
```

均忠實輸出現有測試資料。四個 surface 之 author 值一致（`Dean`）。

判定：

```text
Author / metadata parity：PASS
```

Byline 觀察：Blogger 目前主題**不會**另加 Google 帳號作者顯示，因此**無**重複 byline 問題。

### 7.3 Future note（out-of-scope for B1）

以下屬**未來** content / template contract phase，**不**納入本紀錄之判定、**不**於本 slice 實作：

```text
Future formal article default author       ：Babel
Blogger and GitHub Pages author source     ：shared (single value)
General article byline default             ：visible
Belongs to                                 ：separate content/template contract phase
```

本 slice **未動**：

* `we-media-myself2` frontmatter
* 任何 `Dean` → `Babel` 批次替換
* `byline.showAuthor` 或相關 schema / validator / template
* 任何 renderer / EJS / SCSS

---

## 8. 5.5 Desktop 與 Mobile RWD

### 8.1 Desktop

桌機版畫面可確認：

* 文章寬度正常。
* 標題、內文、聯盟區塊與圖片正常排列。
* 漫畫圖片未超出文章容器。
* 相關連結及 hashtag 區塊正常。
* 沒有明顯內容重疊。

判定：

```text
Desktop：PASS
```

### 8.2 Mobile 375px / 414px 視覺

375px 與 414px 畫面可確認：

* 標題正常換行。
* 內文可正常閱讀。
* 圖片會縮放。
* 聯盟連結正常換行。
* hashtag 正常排列。
* 沒有明顯文字被裁切。

視覺判定：

```text
Mobile visual layout：PASS
```

### 8.3 Whole-page horizontal overflow 觀察

Console 檢查結果：

```text
viewport: 397
pageScrollWidth: 485
hasHorizontalOverflow: true
```

即頁面比 viewport 多出約：

```text
88px
```

### 8.4 Offender 定位結果（Dean bounding-box query）

Dean 於 live 測試頁 Console 執行 bounding-box offender query：

```js
const viewportWidth = document.documentElement.clientWidth;

const offenders = [...document.querySelectorAll("body *")]
  .map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      el,
      tag: el.tagName,
      className:
        typeof el.className === "string" ? el.className : "",
      left: Math.round(rect.left),
      right: Math.round(rect.right),
      width: Math.round(rect.width),
      overflowRight: Math.round(rect.right - viewportWidth),
      insideArticle: Boolean(el.closest(".lab-blogger-article"))
    };
  })
  .filter(
    (item) => item.right > viewportWidth + 2 || item.left < -2
  )
  .sort(
    (a, b) =>
      Math.max(b.overflowRight, -b.left) -
      Math.max(a.overflowRight, -a.left)
  );
```

結果共 7 個主要 offender：

| # | 元素 | `insideArticle` |
| --- | --- | --- |
| 1 | `div.slider-item` | `false` |
| 2 | `a.js_track-click` | `false` |
| 3 | `img` | `false` |
| 4 | `a.js_track-click` | `false` |
| 5 | `h3` | `false` |
| 6 | `p` | `false` |
| 7 | `a.read-more-btn.js_track-click` | `false` |

**7 / 7** offender 皆為 `insideArticle: false`。位置位於 Blogger 主題之推薦文章 slider /
read-more 卡片區，**不**位於 `.lab-blogger-article`。

### 8.5 收斂判定

```text
Portable article mobile RWD                ：PASS
Portable article horizontal overflow       ：PASS
Whole Blogger page horizontal overflow     ：OBSERVED
Root cause                                 ：Blogger theme recommendation slider / shell
Portable-blog-system defect                ：NO
Category                                   ：Accepted external Blogger-theme residual
```

保留事實：

* 頁面層級**仍可**偵測到 horizontal overflow（88px；不改寫為「整個 Blogger 頁面完全沒有水平捲軸」）。
* offender **全數**位於 `.lab-blogger-article` **外**。
* **不**開 CSS / EJS fix phase。
* **不**修改 portable-blog-system renderer。
* **不**把 Blogger theme 之 slider 問題誤列為 B1 artifact defect。

---

## 9. 5.6 Optional blocks

依 `meta.json`：

```json
{
  "toc": false,
  "adsenseTop": true,
  "adsenseMiddle": false,
  "adsenseBottom": true,
  "hashtags": true,
  "socialFollow": true,
  "relatedPosts": false,
  "sidebar": true
}
```

實際結果：

* TOC：`false`，N/A。
* Hashtags：正常顯示，PASS。
* Social Follow：畫面可見信封 / 社群區域，PASS。
* Affiliate top block：正常顯示，PASS。
* Affiliate bottom block：需確認文末第二區塊完整存在；目前至少 affiliate links 已正常輸出。
* AdSense top / bottom：Network 可見 AdSense scripts 回傳 200；灰色或廣告區域存在。
* AdSense middle：`false`，N/A。
* Book photo：`showBookPhoto:false`，N/A。
* Related posts：`false`，N/A。

AdSense Preview 本階段只驗：

* anchor / placeholder 位置存在。
* 不造成文章破版。
* 不驗證正式收益或 live serving。

判定：

```text
Applicable optional blocks：PASS
未啟用項目：N/A
```

---

## 10. 5.7 Console、404 與 broken assets

Network 圖片篩選結果：

```text
Status 200
```

Network JS 篩選結果：

```text
Status 200
```

因此目前沒有文章圖片 404，也沒有專案 JS 404。

Preview 中曾看到：

```text
play.google.com/log... 401 Unauthorized
```

這是 Google / Blogger 外部請求，不是文章輸出的圖片或 JS，不列入本專案 Fail。

Live 頁面 Console 另有：

* 字型載入速度提示。
* 廣告資源 preload 未使用警告。
* Blogger `aria-hidden` focus 警告。

這些屬 Blogger 主題、Google UI 或廣告 runtime，不是目前 `post.html` 的 broken asset。

判定：

```text
Broken images                     ：PASS
Image 404                         ：PASS
Script 404                        ：PASS
External Blogger / Google warnings：N/A
```

---

## 11. 5.8 交叉驗證

Offender 全數位於 `.lab-blogger-article` 外（§8.4 / §8.5）；因此**不需要**進一步使用 GitHub Pages
readonly 頁面交叉比對。

判定：

```text
GitHub cross-check：N/A / not required
Reason            ：All identified offenders are outside .lab-blogger-article;
                    the system-output hypothesis is not supported.
Category          ：Accepted external Blogger-theme residual
```

---

## 12. 5.9 邊界問題

### 12.1 歷史 deviation（保留事實）

測試頁曾發布為：

```text
https://babel-lab.blogspot.com/2026/07/test.html
```

這已不是 Blogger Preview URL，而是實際發生過之 live Blogspot post。因此以下項目於當時**不**能勾選：

```text
Blogger 僅 draft / preview，未按發布
```

當時判定：

```text
FAIL（Preview-only process boundary deviation）
```

而且 `meta.json` 的正式 canonical 是：

```text
https://babel-lab.blogspot.com/2026/05/we-media-myself2.html
```

當時公開測試 URL 卻是：

```text
https://babel-lab.blogspot.com/2026/07/test.html
```

因此當時會產生：

* Live URL 與 canonical 目標不一致。
* 測試頁與正式文章路徑不一致。
* Blogger 頁面日期為 2026-07，而文章內容日期為 2026-05。
* 可能形成暫時性重複內容。

這不是 renderer defect，但違反了本次 Preview-only 測試界線。**此歷史事實不得從紀錄刪除、不得改寫成
「從未發布」**。

### 12.2 Remediation（Dean 已完成）

Dean 已於 2026-07-12 21:04 前完成之收尾：

```text
將 /2026/07/test.html 退回 Blogger 草稿
```

Claude 未登入 Blogger、未代 Dean 執行；本 slice 之 repo 端**未**修任何檔以呼應此 Blogger 後台動作。

### 12.3 收斂判定

```text
Historical boundary deviation          ：OBSERVED（不刪除；不改寫）
Remediation                            ：RESOLVED — test post reverted to draft
Current public state                   ：not intentionally retained as a live article
Future cleanup                         ：delete the test draft when no further manual retest is needed

Preview-only process boundary          ：deviation occurred, then resolved by reverting the post to draft
Current state boundary                 ：PASS
Historical process result              ：RESOLVED DEVIATION
```

### 12.4 其餘邊界

其餘邊界目前仍符合：

```text
GitHub Pages 未 deploy
gh-pages 未 push
deploy clone 未修改
sidecar true values 未猜測或寫入
B2 未實作
```

原 checklist 中：

```text
未登入 Blogger / AdSense / GA4 / Google Drive / Search Console 後台
```

於 Dean 之人工測試情境**不適用**；準確表達為：

```text
Claude 未登入任何 Google 後台；Dean 僅登入 Blogger 執行人工測試（含撤回測試文章至草稿），
未操作 AdSense、GA4、Search Console 或其他正式上線設定。
```

---

## 13. 三項人工收尾動作之執行結果

初次觀察後之 3 項收尾動作全部完成（Dean-execute；本 slice 未代做）：

| # | 收尾動作 | 執行結果 | 對應 § | 收斂判定 |
| --- | --- | --- | --- | --- |
| 1 | `.lab-blogger-article` scoped missing-alt / relative-image query | `missingAlt: []` / `brokenImages: []` / `relativeImages: []` | §5.2 | Article image alt / broken / absolute：PASS |
| 2 | `.lab-blogger-article` scoped relative-link query | `relativeLinks: []` | §6.2 | Relative links in article：PASS |
| 3 | Bounding-box overflow offender query（whole document）| 7 offenders / 7 皆 `insideArticle: false` | §8.4 | Article horizontal overflow：PASS；Whole-page overflow：external Blogger-theme residual |
| 4 | 撤回 `/2026/07/test.html` | 已退回 Blogger 草稿 | §12.2 | Historical deviation RESOLVED；current boundary PASS |

（`1` / `2` / `3` 為初次觀察時之三項 pending；`4` 為 §12 之 FAIL 收尾；共同構成本次最終判定收斂之
evidence chain。）

---

## 14. 明確 stop line（本 slice 之邊界）

本 slice 明確停在以下 stop line **之前**（cumulative；違反即 abort）：

| 項目 | 狀態 |
| --- | --- |
| 代 Dean 執行 §13 收尾四動作之任何一項 | ❌ 未做（Dean 已手動完成） |
| 登入 Blogger / AdSense / GA4 / Search Console / Google Drive 後台 | ❌ 未做 |
| 撤回 / 刪除 `/2026/07/test.html`（Dean 手動範圍） | ❌ 未做（Dean 已退回草稿；未來刪除亦屬 Dean 範圍） |
| 重跑 `npm run build:blogger`（`dist-blogger/` 保持 rehearsal 前既有 build） | ❌ 未做 |
| 改任何 frontmatter / sidecar（含未動 `we-media-myself2` 之 status / draft / blogger block / author）| ❌ 未動 |
| 猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId` | ❌ 未猜 |
| 修 mobile / whole-page overflow 之 CSS / SCSS / EJS / renderer | ❌ 未做（offender 全在 article 外；不開 fix phase） |
| 加 alt 屬性 / 修 relative link / 動 article 輸出 | ❌ 未做（scoped query 已證明無缺陷） |
| 批次替換 `Dean` → `Babel`（future template contract；out-of-scope for B1）| ❌ 未做 |
| 實作 `byline.showAuthor` / 改 template / schema / validator | ❌ 未做 |
| 動 Phase 1 status 宣告 / 重新封存 | ❌ 未動 |
| 動 `check:blogger-backfill` 或任何 report-only guard 之語意 | ❌ 未動 |
| 寫入 `memory/project_blogger_repost_acceptance_we_media_myself2.md` 之新 acceptance | ❌ 未做（本 slice 為 docs-only test evidence；不動 memory） |
| CLAUDE.md 大型 ledger 回寫 | ❌ 未做 |
| GitHub Pages deploy / push gh-pages / 動 deploy clone | ❌ 未動 |
| B2 draft-aware preview build 啟動 | ❌ 未動 |

---

## 15. Recommendation

**Recommendation = idle freeze**（沿用 `CLAUDE.md` §3a Recommended next paths；
`docs/20260712-blogger-preview-b1-one-post-operational-rehearsal.md` §11；
`docs/20260712-preview-only-helper-implementation.md` §12）。

理由：

1. 本次人工測試之技術結果最終為 **PASS**（article output）+ 一項 resolved process deviation
   + 一項 accepted external Blogger-theme residual。
2. `.lab-blogger-article` 內：無 missing alt / 無 broken image / 無 relative image URL / 無 relative
   link；因此本專案輸出**無** defect。
3. Whole-page overflow 88px 之 offender 全數位於 `.lab-blogger-article` 外（Blogger theme
   recommendation slider / read-more cards），屬 accepted external residual；**不**進入 CSS / EJS
   fix phase、**不**修改 portable-blog-system renderer。
4. 歷史 `/2026/07/test.html` deviation 已由 Dean 退回草稿 → resolved；current boundary PASS；未來
   刪除草稿為 Dean 選擇性動作。
5. Author `Dean` 於本測試 surface 一致（post.html / meta.json / JSON-LD / byline），parity PASS；
   future default `Babel` 屬另開 phase，不進本紀錄之修正動作。
6. Phase 1 RC baseline 於本 slice 不受影響（本 slice 為 docs-only，未改 validate / prepublish /
   readiness / metadata-all；deploy clone 未動；helper `check:blogger-preview` 契約未動）。

---

## 16. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔（+ 對應 commit）。**不含**任何
程式 / frontmatter / settings / sidecar / build / deploy / dev-server 變更；未新增 guard /
npm script / preview-only script / helper script / smoke fixture；未改 `.gitignore`；未改 CSS /
SCSS / EJS / renderer；未改 `CLAUDE.md` / `MEMORY.md` / `memory/`；未觸碰 deploy clone 寫入；
未 build / 未產 dist / 未 deploy / 未 push gh-pages / 未發布 Blogger；未購買網域 / 未動 DNS /
未碰 AdSense / GA4 / Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`；未猜
Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId`；未從任何 metadata 推導
Blogger internal ID；未新增測試文章 / artifact；未建 `CNAME` / `ads.txt`（含 placeholder / fake）；
未動 `content/settings/ads.config.json`；未升級任何 report-only guard 為 fail-fast；未新增
`dist-blogger-preview/`；未進入 B2；未修 mobile / whole-page overflow；未新增 alt / 修 relative
link；未批次替換 `Dean` → `Babel`；未實作 `byline.showAuthor`；未改 template / schema / validator；
未寫回 Blogger URL / postId / publishedAt；未代 Dean 撤回 / 刪除 `/2026/07/test.html`。

§0 boot baseline 為本 session read-only 驗證；§1 artifact 為 rehearsal 前既有 `dist-blogger/` 之
現行 build；§2 最終整體判定基於 §3–§12 之 evidence chain；§3–§12 之測試觀察為 Dean 於 Blogger
平台手動觀察與 scoped query 結果（Claude 未登入 Blogger）；§13 收尾動作明確由 Dean 手動執行、Claude
不代；§14 stop line 為 cumulative；§15 recommendation 沿用既有 idle freeze 路線；§16 為本 slice
變更安全性宣告。

---

## See also

- `docs/20260712-blogger-preview-b1-one-post-operational-rehearsal.md`（B1 navigator 唯讀 rehearsal；
  2026-07-12；`1ea5d58`；本次人工 preview 之前一步 / 資料來源）
- `docs/20260712-preview-only-helper-implementation.md`（B1 navigator source slice landing ledger；
  2026-07-12；`cc6497b`；`check:blogger-preview` + `check:blogger-preview-smoke` 49/49）
- `docs/20260710-blogger-preview-only-script-preanalysis.md`（B1 navigator / B2 draft-aware
  preview build preanalysis；本人工測試之 spec 上位）
- `docs/20260708-blogger-draft-preview-runbook.md`（Blogger draft-preview 6 步；本次 Dean 手動貼上
  之 workflow 參照 §D-7）
- `docs/20260710-blogger-preview-sanity-analysis.md`（Blogger preview 40 項 sanity checklist；本
  紀錄 §4–§12 之逐項對應）
- `docs/20260710-blogger-admin-export-workflow-alignment.md`（Admin `#blogger-export` 資料來源 audit
  + Admin→build→dist→Blogger paste 4 步 workflow）
- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger identity 分層 policy；
  `bloggerPostId` 屬 system field / 不列 Dean 必填之依據）
- `memory/project_blogger_repost_acceptance_we_media_myself2.md`（`we-media-myself2` 為 Blogger
  LIVE flagship 對象；20260610 night-2 manual paste PASS；本次紀錄為另一次獨立 B1 手動 preview 之
  evidence record，**不**於本 slice 更新該 memory；is-idempotent = 若日後 Dean 判斷需納入
  acceptance history，另開 memory-sync-only slice）
- `memory/project_baseline.md`（frozen source baseline；本 slice HEAD 起點 = `1ea5d58`）
- `CLAUDE.md` §3a Current state snapshot（Red lines / Recommended next paths；本紀錄之上位契約）
- `CLAUDE.md` §10（Blogger 文章 HTML 之 `lab-blogger-article` 外層 class 契約；scoped query 之
  根選擇器依據）
- `CLAUDE.md` §21（canonical / primaryPlatform；§7.1 已驗）
- `CLAUDE.md` §24（Blogger 發布 URL 回填；本 slice 未動）
- `CLAUDE.md` §27（Claude Code 修改規則；本 slice 遵守「修改前先說明 / 修改後回報」）
- `CLAUDE.md` §29（第一版不做；本 slice 未違反任何一項）

---

（本文件結束 / end of document）
