# Blogger mobile preview 水平捲軸 audit（docs-only audit）

- 建立日期：2026-07-08（Asia/Taipei）
- 類型：docs-only **audit / 決策建議**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md`）。
- 觸發來源：Phase 1 第二次人工 E2E（`docs/20260708-phase1-second-manual-e2e-result.md` §E P1-3）發現的 P1：
  > 「Blogger 預覽出現水平捲軸。來源可能為 Blogger 預覽工具列、Blogger 模板、廣告區、或 code/ad 版面；於視為系統版面 blocker 前需 follow-up 驗證。」
- 本輪界線（read-only / docs-only）：**不**直接修 CSS、**不**改 Blogger template / source / content、**不** build、**不** deploy、**不**產 dist / dist-blogger、**不**碰 deploy clone 寫入、**不**碰 DNS / GitHub Pages settings / Blogger / AdSense / GA4 / GSC 後台。僅盤點現況 + 產出人工重測方式與下一步決策建議。

---

## 0. Boot baseline（read-only 驗證）

| Repo | branch | HEAD | 對照 | ahead/behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `d9a1ab7` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅ | `0 / 0` | clean | absent ✅ |

判定：boot baseline 完全符合 frozen baseline。Deploy clone 僅 read-only 讀取，未寫入。

---

## 1. 問題背景

第二次人工 E2E 之 Blogger draft-preview 鏈路中（內容 → `build:blogger` HTML → Blogger 後台 HTML 模式貼上 → draft/preview，不發布），Dean 在 **Blogger 手機版預覽（mobile preview）** 觀察到**水平捲軸（horizontal scrollbar）**。E2E result §C 之 D-7（Blogger 預覽外觀含 RWD）判定為 **PASS with warnings**，並將此列為 §E P1-3。

重點界線：

- Blogger 預覽是在 **Blogger 平台的主題（theme/template）+ 預覽工具列（preview toolbar）+ 預覽 iframe** 內渲染，**不是**本專案能完整掌控的環境。
- 本專案對 Blogger 的輸出僅為：貼進文章內容的 HTML（外層 `<div class="lab-blogger-article">`）+ 一次性貼進主題 `<head>` 的 `blogger-full-style.css`。Blogger 主題外層、preview chrome、平台注入的 script/markup 皆**不在**本專案輸出範圍。

---

## 2. 現有證據（對應 spec §A）

| 問題 | 目前證據 | 判定 |
| --- | --- | --- |
| 水平捲軸在哪裡觀察到 | Blogger **手機版預覽**（E2E §C D-7、§E P1-3） | 已知在 Blogger mobile preview |
| 是否只在 Blogger mobile preview 發生 | E2E 僅記錄 Blogger mobile preview；**未**記錄哪一個 DOM 元素超出 viewport | 目前僅此一處觀察，但缺元素級證據 |
| GitHub Pages readonly mobile 是否正常 | E2E §D「桌機與手機 viewport 版面皆可用」（GitHub Pages readonly 首頁 / 文章 / 隱私 / 揭露頁） | GitHub Pages mobile **未**觀察到水平捲軸 |
| 是否有足夠證據判定為系統 CSS bug | **無**。未指出 overflowing element、未在 GitHub Pages 復現、未排除 Blogger theme / preview chrome / 廣告 iframe | **證據不足** |

**結論（證據面）**：目前**證據不足以判定為本專案系統 CSS bug**。已知事實只有「Blogger mobile preview 出現水平捲軸」與「同批 GitHub Pages readonly mobile 未出現」。真正的 overflowing element **尚未經 DevTools 定位**。→ **needs reproduction。**

> 不誇大：本 audit **不**宣稱系統 CSS 無 bug，也**不**宣稱一定是 Blogger 外部因素；僅指出「以現有證據無法定性」，並提供人工重測方式（§4）先取得元素級證據。

---

## 3. 可能來源分類（對應 spec §B）

以下 9 類為**假說清單**，非結論。優先度依「是否在本專案掌控範圍」+「常見程度」粗排。

### 3.1 Blogger preview toolbar / preview iframe 本身（外部，非專案輸出）
Blogger 後台預覽會外加預覽工具列與 iframe 包裝，可能自帶固定寬度 / 捲軸行為。**不在**本專案輸出範圍；若捲軸來自此處，屬 **external Blogger preview artifact**，非系統 bug。

### 3.2 Blogger theme/template 外層容器（外部，非專案輸出）
Blogger 主題自身的 `body` / `.content-outer` / `.post-body` 等容器可能有固定寬度、負 margin、或未做 `overflow-x` 控制。本專案的 `blogger-full-style.css` **刻意不動** `body` / `html` / Blogger 外層 theme class / 全域 `box-sizing`（見 `_blogger-article-rules.scss` 檔頭註解），因此**無法**、也**不應**由本專案 CSS 修正 Blogger 主題層。若捲軸來自此處，屬 Blogger 主題設定，非系統 bug。

### 3.3 generated Blogger article wrapper（`.lab-blogger-article` / `.lab-article__body`）（專案掌控）
本專案輸出的文章外層。`_article.scss` 對 `.lab-blogger-article` 設 `max-width: 48rem; margin-inline: auto`，本身不會撐寬；但其**子元素**（§3.4–§3.8）若超寬，因 wrapper **無** `overflow-x` 控制（見 §5），仍會把捲軸往上推。屬本專案可介入範圍，但需先確認確有子元素超寬。

### 3.4 code block / `pre` / `code`（專案掌控）
`.lab-blogger-article pre` **已有** `overflow-x: auto`（§5），理論上長 code 會在 `pre` 內捲動、不外溢。但 `pre` 有 `padding: var(--lab-space-4)`，而 Blogger CSS **未**輸出全域 `box-sizing: border-box`（§5 gap），故 `pre` 寬度 = 內容框 + padding，理論上仍可能略超父層。屬**次要**假說。

### 3.5 table（專案掌控；較可能）
`.lab-blogger-article table` 設 `width: 100%; border-collapse: collapse`，**但無** overflow wrapper（`_blogger-article-rules.scss` 註解明言「不做 overflow wrapper hack」），也**無** `table-layout: fixed`。多欄或含長不斷字內容的表格，其內容最小寬度可**超過** viewport → 撐寬版面。屬**較可能**的專案內來源之一。

### 3.6 long URL / long unbroken text（專案掌控；較可能）
`.lab-blogger-article` 對 `p` / `a` / `li` **未**設 `word-break` / `overflow-wrap`（僅 `.lab-hashtag` 有 `overflow-wrap: anywhere`）。文章 body 內一段長不斷字 URL / 長 token（例如未加空白的長連結）在窄 viewport 會撐寬段落。屬**較可能**的專案內來源之一。

### 3.7 adsbygoogle / iframe / ad slot（專案掌控 markup，但實際尺寸由外部決定）
`adsense-slot.ejs` 輸出 `<ins class="adsbygoogle lab-ad-slot ...">`，帶 `display:block` + `data-full-width-responsive="true"`，但 `.lab-ad-slot` 在 CSS 內**無**任何 `max-width` / `overflow` 規則。AdSense 響應式廣告一般會自我適配，但實際 iframe 尺寸由 AdSense 執行期決定，在 Blogger 預覽期可能短暫超寬。gated download `iframe` 為 inline `width:100%;border:0`（無 border/padding，理論上安全）。屬**中等**假說，且部分不在本專案掌控。

### 3.8 image / cover / embedded media（專案掌控；較不可能）
`.lab-blogger-article img` 已設 `max-width: 100%; height: auto`（§5），`_reset.scss` 另有全域 `img { max-width:100% }`（但該 reset **只在 GitHub site**，Blogger 端靠 scoped 規則）。cover 於 Blogger full 模板的處理需個案確認，但一般 img 已有 `max-width:100%` 保護。屬**較不可能**。

### 3.9 JSON-LD / canonical / hidden injected markup（較不可能影響 layout）
JSON-LD `<script type="application/ld+json">` 與 `<link rel="canonical">` 不參與 layout，正常情況**不會**造成水平捲軸。除非有異常的 hidden 但 `display` 非 none 的超寬元素，否則**排除**。屬**最不可能**。

---

## 4. 目前 CSS 防護盤點（對應 spec §C）

盤點 source 內既有防護（Blogger 端 = `blogger-full-style.css` / `blogger-article.css` 相關 partial；GitHub 端僅作比較，**不**代表 Blogger 生效）：

| 防護 | Blogger 端（`.lab-blogger-article` scope / blogger partial） | GitHub 端（全站，僅比較） |
| --- | --- | --- |
| `max-width: 100%`（img） | ✅ `.lab-blogger-article img`（`_blogger-article-rules.scss:62`） | ✅ scoped + 全域 `_reset.scss:3` |
| `overflow-x: auto`（pre） | ✅ `.lab-blogger-article pre`（`_blogger-article-rules.scss:115`） | ✅ `.lab-article pre`（`_code-block.scss:2`） |
| `word-break` / `overflow-wrap`（body 文字） | ⚠️ **僅** `.lab-hashtag { overflow-wrap: anywhere }`；`p`/`a`/`li` **無** | ⚠️ 同樣僅 `.lab-hashtag`；`p`/`a`/`li` **無** |
| table responsive（wrapper / `overflow-x` / `table-layout:fixed`） | ❌ **無**（僅 `width:100%`；註解明言不做 wrapper hack） | ❌ **無**（同樣僅 `width:100%`） |
| iframe responsive | ⚠️ gated download iframe inline `width:100%;border:0`；**無**通用 iframe 規則 | ⚠️ 無通用 iframe 規則 |
| ad slot responsive | ⚠️ `ins.adsbygoogle` 帶 `data-full-width-responsive`，但 `.lab-ad-slot` **無** `max-width`/`overflow` CSS | ⚠️ 同上 |
| `box-sizing: border-box` | ❌ **Blogger 端未輸出全域 box-sizing**（`blogger-full-style.scss` 只 emit tokens + article rules + components，**不含** `_reset.scss`；刻意不污染 Blogger 主題） | ✅ 全域 `*,*::before,*::after`（`_reset.scss:1`） |
| page-level 水平捲軸抑制 | ❌ **Blogger 端無** `.lab-site { overflow-x: clip }`（該規則屬 GitHub layout，未進 blogger CSS，且 Blogger 頁面外層由主題掌控） | ✅ `.lab-site { overflow-x: clip }`（`_mobile-drawer.scss:17`） |

**盤點小結（三個 Blogger 端刻意的落差）**：

1. **無全域 `box-sizing: border-box`** —— Blogger CSS scope 在 `.lab-blogger-article`，刻意不動全域，避免污染 Blogger 主題。副作用：帶 padding 的區塊（`pre` / `blockquote` / `.lab-*` box）寬度計算 = 內容 + padding，較易超寬。
2. **無 page-level `overflow-x: clip`** —— Blogger 頁面外層由主題掌控，本專案無法（也不應）在 Blogger 加頁面級捲軸抑制。
3. **table / 長文字 / ad slot 無硬防護** —— 與 GitHub 端一致的既有落差，但 GitHub 端因有 §1/§2 兩層 page-level 保護而較不易外顯。

→ 這三點解釋了「**為何同樣的內容在 GitHub Pages mobile 正常、在 Blogger mobile 可能外顯捲軸**」：GitHub 站有 page-level 保護網，Blogger 站沒有（且外層不歸本專案管）。但這**仍不足以判定** overflowing element 是本專案 CSS 造成——需 §4 人工重測定位。

---

## 5. 人工重測 / debug checklist（對應 spec §D）

目的：讓 Dean 下一次能**定位真正超出 viewport 的元素**，把「needs reproduction」變成元素級證據，再據 §6 分級。

**前置（read-only，不改檔）**：
- 沿用 `docs/20260708-blogger-draft-preview-runbook.md` 產生一篇 build-eligible 測試文章的 `dist-blogger/posts/<slug>/post.html`，貼進 Blogger **HTML 模式**，存**草稿**（不發布）。
- 全程僅 draft/preview；測完依 runbook §D-10/§D-11 還原 + cleanup，`git status --short` 回到 clean。

**步驟**：

1. **在 Blogger Preview 開手機模式**：Blogger 後台按「預覽」→ 於瀏覽器開 DevTools →切 device toolbar（手機 viewport，例如 375px 寬）。
2. **先分辨捲軸層級**：捲動頁面，觀察水平捲軸是屬於
   - (a) 整個 Blogger 預覽頁面（含 toolbar / 主題外層）→ 偏向 §3.1/§3.2 external；
   - (b) 文章內容區（`.lab-blogger-article` 內某元素）→ 偏向 §3.3–§3.8 專案內。
3. **用 Elements 找超寬元素**：DevTools → Elements → 逐層 hover，看哪個節點的高亮框**超出** viewport 右緣；或用下方 Console snippet 一次列出。
4. **Console snippet（找 scrollWidth > viewport 的元素）**：在 Blogger 預覽 iframe 的 context 執行（若預覽在 iframe 內，DevTools Console 上方 context 下拉需切到該 iframe）：

   ```js
   // 列出所有「本身比視窗寬」的元素，由寬到窄
   (() => {
     const vw = document.documentElement.clientWidth;
     const offenders = [...document.querySelectorAll('*')]
       .filter(el => el.scrollWidth > vw + 1 || el.getBoundingClientRect().right > vw + 1)
       .map(el => ({
         el,
         tag: el.tagName.toLowerCase(),
         cls: el.className,
         scrollWidth: el.scrollWidth,
         right: Math.round(el.getBoundingClientRect().right),
         vw
       }))
       .sort((a, b) => b.scrollWidth - a.scrollWidth);
     console.table(offenders.map(o => ({ tag: o.tag, cls: String(o.cls).slice(0,40), scrollWidth: o.scrollWidth, right: o.right, vw: o.vw })));
     if (offenders[0]) offenders[0].el.style.outline = '3px solid red'; // 把最寬的標紅
     return offenders.length ? `最寬 offender: <${offenders[0].tag} class="${offenders[0].cls}">` : 'no offender wider than viewport';
   })();
   ```

5. **判讀**：
   - offender class 含 `lab-blogger-article` 底下的 `table` / `pre` / `a` / `p` / `.lab-ad-slot` / `iframe` / `img` → 偏向**專案內來源**（記下確切 tag/class + scrollWidth）。
   - offender 為 Blogger 主題 class（非 `lab-*`）或根本沒有 offender（捲軸來自 preview chrome）→ 偏向 **external Blogger preview artifact**。
6. **交叉驗證 GitHub Pages**：把同一篇（或等價內容）在 **GitHub Pages readonly mobile** 用相同 snippet 跑一次。
   - 若 GitHub 也復現同一 `lab-*` offender → 強烈指向系統 CSS，升級處理。
   - 若 GitHub **不**復現、只有 Blogger 復現 → 指向 Blogger 主題/preview 或 Blogger 端缺 page-level 保護，降級或列 Blogger-scope 修補。
7. **記錄**：把 offender 的 `tag` / `class` / `scrollWidth` / `viewport` / 是否跨平台復現，填回 E2E result 或 runbook §G，作為分級（§6）依據。

> 界線：本步驟全程 read-only + draft/preview；**不**修 CSS、**不** build/deploy、**不**發布 Blogger、**不**動 theme（除非日後另開 phase）。

---

## 6. 風險與分級規則（對應 spec §E）

以下為**分級規則**（依 §5 重測結果套用），非本輪定案：

| 級別 | 觸發條件 |
| --- | --- |
| **維持 P1** | §5 重測顯示 offender 為 `.lab-blogger-article` 內**專案輸出**元素（table / 長文字 / ad slot / pre），但僅影響外觀、不阻擋閱讀/發布流程；或尚未完成重測（證據仍不足）→ **維持 P1、needs reproduction**。 |
| **升級 P0** | offender 為專案輸出元素，**且**造成內容被裁切/無法閱讀、或連 GitHub Pages 正式站 mobile 也復現而影響已 live 文章的可用性/SEO → 升級 P0（阻擋性）。 |
| **降為 P2** | offender 為專案輸出元素但僅在極端邊界（例如刻意超長 URL / 超寬表格）出現、一般文章不觸發、且有內容面 workaround（改內容即可）→ 降 P2（Phase 2 / operation 再處理）。 |
| **降為 external Blogger preview artifact（非系統 bug）** | §5 顯示 offender 為 Blogger 主題 class / preview chrome，或 GitHub Pages 完全不復現且 Blogger 文章內容區無 `lab-*` offender → 定性為 **external Blogger preview artifact**，關閉為非系統 bug（僅在 runbook 註記「Blogger 主題/預覽層現象」）。 |

**本輪定性**：因尚未完成 §5 元素級重測，**維持 P1 / needs reproduction**；不升 P0、不降 P2、不逕自關閉為 external。

---

## 7. 下一個最小 safe slice 建議（對應 spec §F；本 session 不實作）

最多 3 個 option，皆須另開獨立 phase + explicit approval：

### Option A（最小、推薦）：只補 runbook 的 overflow debug 步驟
- docs-only：把 §5 的「Blogger mobile preview overflow debug checklist + Console snippet」正式併入 `docs/20260708-blogger-draft-preview-runbook.md`（或本 audit 作為其附錄），讓下次重測有可重複步驟先取得元素級證據。
- 不改 CSS / 不 build / 不 deploy。零紅線風險，先把「needs reproduction」補齊。

### Option B（中等）：Blogger article CSS overflow hardening（**僅限 Blogger CSS 範圍**）
- 若 §5 證實 offender 為專案輸出元素，於 `.lab-blogger-article` scope 內針對性補防護，例如：
  - table：外層 wrapper `overflow-x:auto`（或 `.lab-blogger-article table { display:block; overflow-x:auto }`，需評估對 `width:100%` 語意的影響）；
  - body 長文字：`.lab-blogger-article { overflow-wrap: anywhere }` 或針對 `a`/`p`；
  - ad slot：`.lab-ad-slot { max-width:100% }`。
- **強約束**：只動 Blogger CSS scope；**不得**改變已 live-accepted 的 GitHub Pages 輸出（per CLAUDE.md dual-block surface-gating 精神：GitHub Pages 已上線輸出須 byte-identical）；須先重測確認來源、逐項 acceptance；屬 code 變更 = 獨立 phase。

### Option C（較大）：新增 static check / smoke fixture
- 例如一支 read-only guard / fixture，掃 Blogger 匯出 HTML 是否含已知易溢位 pattern（超寬 table / 無 `overflow-wrap` 的長 token / 無 `max-width` 的 ad slot），warning-only-first。
- 成本最高（新 script + 可能 npm script + guard），屬新功能；僅在 Option A/B 後仍需自動化防迴歸時再評估。

**建議次序**：A（先補重測步驟取得證據）→ 視證據再決定 B（真為系統 CSS 才 harden，且限 Blogger scope）→ 長期再考慮 C。本 session **不實作**任一 option。

---

## 8. audit 結論（一句話）

> Blogger mobile preview 的水平捲軸目前**證據不足以判定為系統 CSS bug**（僅在 Blogger mobile preview 觀察到、同批 GitHub Pages readonly mobile 未復現、且**尚未**用 DevTools 定位 overflowing element）。已知 Blogger 端相較 GitHub 端**刻意缺少**全域 `box-sizing` / page-level `overflow-x: clip` 兩層保護（避免污染 Blogger 主題），加上 table / 長文字 / ad slot 無硬防護，理論上使 Blogger 較易外顯；但真正來源需依 §5 人工重測定位。**本輪維持 P1 / needs reproduction**；建議下一步採 **Option A（docs-only 補 overflow debug 步驟）**，取得元素級證據後再決定是否 Blogger-scope hardening（Option B）。

---

## 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔。**不含**任何程式 / frontmatter / settings / build / deploy / dev-server 變更；不修 CSS；不改 Blogger template / source / content；不新增 guard / npm script；不改 `CLAUDE.md` / `MEMORY.md` / `memory/`；不觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages / 未發布 Blogger；未購買網域 / 未動 DNS / 未碰 AdSense·GA4·Blogger·GSC 後台。§0 之 boot baseline 為 read-only 驗證；§5 步驟供 Dean 手動執行，**未宣稱任何 preview PASS**；§6 分級與 §7 option 均為建議，**未**實作。

## See also

- `docs/20260708-phase1-second-manual-e2e-result.md`（§E P1-3 觸發本 audit；§C D-7 / §D GitHub Pages mobile 觀察）
- `docs/20260708-blogger-draft-preview-runbook.md`（draft-preview 人工流程；本 audit §5 可作其 overflow debug 附錄 = Option A）
- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（build eligibility 盤點）
- `src/styles/blogger/_blogger-article-rules.scss`（Blogger 文章 body 規則：img `max-width:100%`、pre `overflow-x:auto`、table `width:100%` 無 wrapper）、`src/styles/blogger/blogger-full-style.scss`（Blogger 合併 entry：僅 tokens + article + components，**不含** `_reset.scss` 全域 box-sizing）、`src/styles/base/_reset.scss`（GitHub 端全域 box-sizing / img reset）、`src/styles/layout/_mobile-drawer.scss`（GitHub 端 `.lab-site { overflow-x: clip }`）、`src/views/ads/adsense-slot.ejs`（`ins.adsbygoogle` 響應式廣告，`.lab-ad-slot` 無 overflow CSS）、`src/views/blogger/blogger-post-full.ejs`（`.lab-blogger-article` / `.lab-article__body` wrapper、gated download iframe）
- `CLAUDE.md` §9.4/§9.5（Flex-first / SCSS 歸類）、§10（Blogger design token 匯出：主題貼一次 full-style、文章只貼 HTML）、§17（文章頁版型）
