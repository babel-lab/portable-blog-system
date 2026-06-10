# Blogger Dual Commerce Block — Content-Model Design Preanalysis (design-only, NOT implemented)

> **Phase**: `20260610-pm-5-blogger-dual-block-content-model-preanalysis-docs-only-a`
> **Mode**: **docs-only design preanalysis**。設計（但**不實作**）系統如何支援 Blogger 上下雙 commerce 區塊。**不**改 src / renderer / Admin / schema / `commerce-links.json` / production posts；**不** seed 聯盟網；**不**改通路王 URL / affiliate URL policy；**不** build / deploy / 動 gh-pages / 重貼 Blogger / 改 Blogger 文章 / 遷移任何 post。
> **Created**: 2026-06-10 +0800（16:xx 起始）
> **Baseline**: main HEAD = origin/main = `fddfbc6` / gh-pages = `2acb5a5` / clean / normal 0/69/59 / overlay 0/72/60 / GitHub Pages live acceptance = PASS / Blogger actual repost = NOT DONE / BLOCKED。
> **Predecessor / 接受結論**：
> - `docs/20260610-blogger-dual-affiliate-block-strategy.md`（pm-10：雙區塊刻意策略 → repost BLOCKED/DEFERRED）
> - `docs/20260610-blogger-repost-commerce-affiliate-box-preflight.md`（pm-9：bottom-only output preflight）
> - `docs/20260610-github-pages-commerce-live-acceptance.md`（pm-8：GitHub Pages bottom-only box LIVE PASS）
> - pm-4 readiness verdict = **BLOCKED**（bottom-only generated output 無法保留 Blogger 雙區塊版面）

---

## 0. 業務 / 版面意圖（須保留，authoritative）

- **上方 commerce block = 通路王**。
- **下方 commerce block = 聯盟網 slot**；聯盟網尚未納入系統前，下方**可暫用通路王 URL**。
- **上下文案可故意不同**（heading / disclosure / 連結說明各異 → 讓讀者感覺不同、增加曝光）。
- **未來目標**：分析使用者點**上方還是下方**較多（top vs bottom click tracking）。
- **現行 bottom-only generated output 不得覆蓋** Blogger 文章中人工保留的雙區塊版面。

---

## 1. 現行限制（為何現在做不到）

### 1.1 現行 content model

`content/blogger/posts/*.md` frontmatter 之 affiliate 結構（以 `20260515-we-media-myself2.md` 為實例）：

```yaml
affiliate:
  enabled: true
  disclosure: "本文包含聯盟行銷連結。…"   # 單一字串，全篇共用
  position:
    top: false
    bottom: true
  links:                                  # 單一 array，全篇共用
    - label: "博客來：實體書"
      network: "通路王"
      ref: "book-we-media-myself2-books-com-tw-physical-books"
    - label: "金石堂：實體書"
      network: "通路王"
      ref: "book-we-media-myself2-kingstone-physical-books"
```

### 1.2 renderer 行為（兩端共用同一資料）

| Render path | 檔案 | top guard | bottom guard | 資料來源 |
| --- | --- | --- | --- | --- |
| Blogger full | `src/views/blogger/blogger-post-full.ejs` L60–74 / L99–113 | `position.top` | `position.bottom` | **同一** `affiliateLinksRendered` + **同一** `post.affiliate.disclosure` |
| GitHub detail | `src/views/pages/post-detail.ejs` L77+ / L174+ | `position.top` | `position.bottom` | **同一** `affiliateLinksRendered` + **同一** `post.affiliate.disclosure`（GitHub 額外帶 GA4 `data-ga4-param-placement="article_top"` / `article_bottom"`）|

resolver：`src/scripts/resolve-affiliate-links.js` 之 `deriveRenderedAffiliateLinks(affiliate, commerceLinks)` 讀**單一** `affiliate.links`，回傳**單一** rendered array，被兩端 build script 共用。

### 1.3 為何「同時開 top + bottom」仍不夠

即使把 `position.top` 與 `position.bottom` 都設 `true`：

- top block 與 bottom block 會渲染**完全相同**之 links（同一 `affiliateLinksRendered`）。
- 兩 block 會顯示**完全相同**之 `disclosure` 與 `<h3>立即購買</h3>` heading。
- **無法**表達：上下不同文案、上下不同通路 / link group（上=通路王、下=聯盟網）、上下獨立 tracking placement（Blogger 端目前連 GA4 placement 都沒有）。

→ 雙區塊「不同內容」需 **content model 變更**（per-block 欄位），**非**單純把現有輸出貼兩次或開兩個 flag 可達成。這是 pm-4 BLOCKED 的系統根因。

### 1.4 與既有子系統的耦合（變更時須一併考慮，本 phase 不動）

- **validator**：`src/scripts/validate-content.js` 之 commerce-ref 規則 C1/C2/C3/C5/C6/C8（+ overlay C4/C9）掃 `post.affiliate.links[].ref` / `.role`。新 model 若把 links 移到 per-block 結構，validator 須學會走 per-block 路徑，否則 ref 規則對新結構**失效**（漏檢）。
- **registry**：`content/settings/commerce-links.json` entry 形狀（`linkId` / `active` / `displayLabel` / `internalLabel`（不渲染）/ `targetUrl` / `networkKey` …）**不需改**即可支援雙區塊 —— 雙區塊是「文章端如何分組引用 ref」的問題，不是 registry schema 問題。
- **resolver label safety**：`internalLabel` / `targetUrl` 以外 audit-only 欄位**絕不**輸出到 HTML 之紅線，新 model 必須沿用。

---

## 2. Frontmatter model 候選（≥3 option 比較）

### Option A — 擴充現行 affiliate 物件，新增 `topBlock` / `bottomBlock` 子物件

```yaml
affiliate:
  enabled: true
  topBlock:
    enabled: true
    heading: "立即購買（實體書）"
    disclosure: "本文包含聯盟行銷連結。…"
    links:
      - label: "博客來：實體書"
        network: "通路王"
        ref: "book-we-media-myself2-books-com-tw-physical-books"
  bottomBlock:
    enabled: true
    heading: "電子書這裡買"
    disclosure: "下方為另一通路…"
    links:
      - label: "金石堂：實體書"
        network: "通路王"
        ref: "book-we-media-myself2-kingstone-physical-books"
```

- 固定兩個具名 slot（top / bottom），語意直觀。
- 仍保留 `affiliate.enabled` 為總開關。

### Option B — 引入 `affiliate.blocks[]` array（每 block 自帶 position / copy / links / tracking）

```yaml
affiliate:
  enabled: true
  blocks:
    - id: "top-tongluwang"
      position: "top"
      heading: "立即購買（實體書）"
      disclosure: "本文包含聯盟行銷連結。…"
      # surfaces: ["blogger"]            # optional；省略=全 surface（見 §6 Open Q）
      links:
        - label: "博客來：實體書"
          network: "通路王"
          ref: "book-we-media-myself2-books-com-tw-physical-books"
    - id: "bottom-affiliate-slot"
      position: "bottom"
      heading: "電子書這裡買"
      disclosure: "下方為另一通路…"
      links:
        - label: "金石堂：實體書"
          network: "通路王"               # 聯盟網到位前暫用通路王
          ref: "book-we-media-myself2-kingstone-physical-books"
```

- 每 block：`id` / `position`（top|bottom，未來可擴 inline）/ `heading` / `disclosure` / `links[]`（沿用現行 `label`/`network`/`ref`）/ 可選 tracking placement / 可選 `surfaces`。
- N 個 block 天然支援；未來 inline / 多 placement 不需再改 schema。

### Option C — frontmatter 維持單一 block，雙區塊版面放 sidecar / registry mapping

- frontmatter affiliate 不動；另立 sidecar（如 `*.blogger-layout.json`）或 registry mapping 描述「Blogger 端此文上下兩區塊各放哪些 ref / 文案」。
- render 時 Blogger path 讀 sidecar 組雙區塊；GitHub path 不讀 → 維持單區塊。

### 2.1 評估矩陣

| 評估軸 | Option A（top/bottomBlock）| Option B（blocks[]）| Option C（sidecar mapping）|
| --- | --- | --- | --- |
| 一人維護可讀性 | 🟢 高（兩具名 slot 一目了然）| 🟢 高（array 每筆自描述；略多縮排）| 🔴 低（內容拆兩處：md + sidecar，易不同步）|
| 與現有 posts 相容 | 🟡 須與舊 `links[]`+`position` 並存 → fallback 邏輯 | 🟡 同 A，須 fallback；但 array-present 判斷乾淨 | 🟢 frontmatter 零變更（舊文完全不動）|
| validation 複雜度 | 🟡 ref 掃描須加走 topBlock/bottomBlock.links | 🟡 ref 掃描改走 blocks[].links（單一迭代路徑，較規整）| 🔴 須新增 sidecar schema + 跨檔一致性規則（最重）|
| renderer 複雜度 | 🟡 top/bottom 各讀各 block；resolver 須能解析「一篇多組 links」| 🟡 迴圈 blocks[] 依 position 輸出；resolver per-block resolve | 🔴 Blogger/GitHub 兩 path 行為分裂（C 最易違反「共用邏輯」原則）|
| 未來聯盟網支援 | 🟢 bottomBlock.links 換 ref 即可 | 🟢 對應 block.links 換 ref / 加 block | 🟢 sidecar 改 mapping |
| 上下暫時都用通路王 | 🟢 兩 block 都填通路王 ref | 🟢 兩 block 都填通路王 ref | 🟢 sidecar 兩區塊都指通路王 |
| 上下獨立 tracking | 🟡 placement 由 slot 名推導（top/bottom 固定）| 🟢 block 可帶顯式 tracking/placement 欄位，最直接 | 🟡 須 sidecar 帶 tracking |
| migration 風險 | 🟡 中（改 frontmatter + renderer + validator）| 🟡 中（同 A；array 結構利於漸進）| 🔴 高（雙資料源 + 兩端行為分裂，回歸面大）|
| 危及 GitHub Pages output 風險 | 🟡 共用 frontmatter → 遷移文章會同時改變 GitHub 輸出（須 surface gate，見 §6）| 🟡 同 A；但 `surfaces` 欄位最易自然承載 Blogger-only 意圖 | 🟢 GitHub path 不讀 sidecar → GitHub 輸出不變（C 唯一強項）|

---

## 3. 建議 option

**建議：Option B（`affiliate.blocks[]` array），additive + 向後相容 fallback。**

理由：

1. **可讀性 + 擴充性兼得**：array 每筆自描述（id / position / copy / links / tracking），一人維護清楚；未來要加 inline block、第三個 placement、per-block `surfaces` 都不需再動 schema —— 對齊 `docs/20260610-commerce-yaml-fields-site-productkey-category-preanalysis.md` 之「additive optional 欄位」精神。
2. **validator / resolver 路徑最規整**：commerce-ref 規則只需把「迭代 `affiliate.links[]`」改為「迭代 `affiliate.blocks[].links[]`」單一巢狀路徑，比 Option A 的兩個具名 key 分支乾淨；resolver 可 per-block 呼叫既有 `deriveRenderedAffiliateLinks` 的 link-level 邏輯（label safety / omit / url-backward-compatible 全部沿用）。
3. **tracking 最直接**：block 可帶顯式 placement / tracking slot 欄位，正好服務「上 vs 下點擊分析」未來目標，且該 tracking phase 可**獨立**於 content-model phase（GA4 維持 dormant，不混入）。
4. **不選 Option C**：C 唯一強項是「GitHub 輸出不變」，但代價是 Blogger / GitHub 兩 render path 行為分裂、雙資料源易不同步、validator 須跨檔一致性 —— 違反現行 resolver「兩端共用同一套邏輯」設計原則，且一人維護下 sidecar 與 md 不同步風險高。GitHub 輸出不變的需求改用 **per-block `surfaces` 欄位**（Option B 內）達成，更內聚。
5. **不選 Option A**：A 與 B 能力幾乎等價，但 A 的固定兩具名 slot 對「未來多 placement / inline」是天花板，且 validator 須維護兩個 key 分支；B 以微幅縮排成本換得更乾淨的迭代路徑與擴充性。使用者初步傾向 B —— repo 證據（既有 `affiliate.links[]` 迭代、resolver link-level 設計、commerce YAML additive 慣例）**支持** B，不需推翻。

> **保守落地註記**：建議 B 採「**additive，不破壞**」路線 —— 新 `affiliate.blocks[]` 存在時走新路徑，否則 fallback 至現行 `affiliate.links[]` + `position`（見 §5）。validator 新規則先 **warning-only**、fixture-isolated；renderer 對未採用 `blocks[]` 之既有文章維持 **byte-identical-modulo-builtAt**。

---

## 4. 最小實作順序（拆成安全 phase；**本 phase 不實作任何一項**）

各 phase 須**獨立** + **explicit approval**；順序 / 取捨由 user 決定。

1. **docs / CLAUDE sync** — 把本 preanalysis 結論（選定 B）寫入 CLAUDE.md §12 affiliate 區塊 convention 註記「dual-block model 設計完成、未實作」。（docs-only）
2. **schema / frontmatter convention** — 文件化 `affiliate.blocks[]` 欄位字典（id / position / heading / disclosure / links[] / optional surfaces / optional tracking）+ 向後相容 fallback 規則。（docs-only）
3. **validator warnings** — 教 commerce-ref 規則（C1/C2/C3/C5/C6/C8/C4/C9）改走 `blocks[].links[].ref`；新增 block-level shape 規則（缺 position / 非法 position / 重複 id …）**warning-only**。先 fixture-isolated，不碰 production。
4. **renderer support** — Blogger `blogger-post-full.ejs` + GitHub `post-detail.ejs` + resolver `resolve-affiliate-links.js` 支援 per-block 渲染；未採用 `blocks[]` 之文章走 legacy fallback，輸出 byte-identical。
5. **fixture / overlay validation** — 新增 dual-block fixture（`content/validation-fixtures/...`）；確認 normal / overlay baseline 變動可預期、可解釋。
6. **one target post migration** — 僅遷移 `20260515-we-media-myself2.md` 一篇至 `blocks[]`（上下兩 block，暫時都通路王，文案故意不同）。**先確認 §6 surface 決策**（雙區塊只上 Blogger，還是 GitHub 也要）。
7. **generated output acceptance** — 本地 `build:blogger` / `build:github` 檢視雙區塊 output（href exact 含 uid1=blog、0 leak、KOBO 0、上下文案不同）。
8. **GitHub Pages acceptance** — 若決定 GitHub 也雙區塊 → deploy + user live 驗收；若 Blogger-only → 確認 GitHub 輸出**不變**。
9. **Blogger manual repost packet** — 產出人工重貼 packet（目標 URL `https://babel-lab.blogspot.com/2026/05/we-media-myself2.html`、備份、theme CSS、上下文案確認），user explicit approval 後手動重貼。

> tracking（top vs bottom GA4 / reverse UTM）為**獨立後續 phase**，不混入上述任一步（GA4 / reverse UTM 維持 dormant）。

---

## 5. 向後相容（既有 affiliate frontmatter 如何續用）

- **不立即遷移任何文章**（除非該 phase 被明確選定，即 §4 step 6 只動 we-media 一篇）。
- renderer / resolver / validator 採 **additive fallback**：
  - 文章有 `affiliate.blocks[]`（非空 array）→ 走**新** per-block 路徑。
  - 否則 → fallback 至現行 `affiliate.links[]` + `position.{top,bottom}` + 單一 `disclosure`（**現行行為完全不變**）。
- 58 篇現有 production posts（皆無 `blocks[]`）→ 走 legacy path → 輸出 byte-identical-modulo-builtAt；normal validate 維持 0/69/59。
- we-media（目前 legacy bottom-only，GitHub Pages LIVE PASS）在未執行 step 6 前**保持 legacy**，GitHub live 不受影響。

---

## 6. Open questions（實作前須 user 決定）

1. **雙區塊的 surface 範圍**：上下雙區塊是 **Blogger-only** 意圖，還是 GitHub Pages 也要雙區塊？
   - 關鍵：content model 為兩端**共用**。若 we-media 遷至 `blocks[]` 且無 surface gate → **GitHub Pages 輸出也會從單區塊變雙區塊**（we-media GitHub 端目前是 LIVE-accepted 單 bottom box → 會被改變，須重新 deploy + 驗收）。
   - 若只要 Blogger 雙區塊 → 需 per-block `surfaces: ["blogger"]`（Option B 內建可選欄位），GitHub 端略過該 block。**此決策直接影響 §4 step 6/8。**
2. **上下 disclosure 揭露合規**：上下各一 disclosure 是否符合聯盟揭露要求？是否要強制「至少一個 block 有 disclosure」的 validator 規則？
3. **block heading 文案**：上下 heading 是否都用「立即購買」，還是允許各自自訂（如「實體書」/「電子書」）？影響 schema 是否需 `heading` 欄位 vs 沿用固定 `<h3>立即購買</h3>`。
4. **聯盟網納入時程**：下方 block 目標是聯盟網，但聯盟網尚未進 `affiliate-networks.json` / registry。雙區塊 model 可先落地（下方暫用通路王 ref），但「真正聯盟網 ref」須等聯盟網 network seed phase（另案，L2 gate / governance 紅線不變）。
5. **tracking 欄位是否現在就進 schema**：block 是否預留 `trackingPlacement` 欄位（即使 GA4 dormant）？或等獨立 tracking phase 再 additive 加入？（傾向後者：保持本 model 純版面/內容，tracking 另案。）
6. **id 命名規範**：`block.id` 是否需全篇唯一 / 跨篇慣例？validator 是否檢查重複 id？

---

## 7. Mutation scope / 紅線（本 phase）

- ✅ 僅新增本 preanalysis docs file（+ 視需要 CLAUDE.md 一行「dual-block model 設計完成 / 未實作」註記）。
- ❌ 零 src / renderer / Admin / schema / `commerce-links.json` / `affiliate-networks.json` / production posts / fixture / registry / dist / dist-blogger / gh-pages / deploy 變更。
- ❌ 未 build / deploy / 重貼 Blogger / 改 Blogger 文章 / 遷移任何 post / seed 聯盟網 / 改通路王 URL / canonicalize affiliate URL / 改 affiliate URL policy。
- ❌ GA4 / reverse UTM 維持 dormant，不混入。

---

## 8. 現況狀態快照

| 項目 | 值 |
| --- | --- |
| main HEAD = origin/main | `fddfbc6`（本 phase docs 落地後更新為新 commit）|
| gh-pages HEAD | `2acb5a5`（GitHub Pages LIVE，user-accepted PASS）|
| Blogger actual repost | ⛔ BLOCKED / DEFERRED（待雙區塊 model 落地 + user approval）|
| 雙區塊 model 設計 | ✅ 本 phase 完成（建議 **Option B**）；**實作未開始** |
| 聯盟網 network | 尚未納入系統 |
| normal / overlay | 0/69/59 / 0/72/60 |

---

*（本文件結束 — Blogger dual commerce block content-model **設計完成、實作未開始**；建議 **Option B**（`affiliate.blocks[]` array，additive + legacy fallback）；最小實作拆 9 phase，各須獨立 approval；向後相容採 additive fallback，58 篇 production posts 走 legacy 不變；核心 open question = 雙區塊是否 Blogger-only（surface gate，影響 GitHub Pages 輸出）；docs-only，無 source / renderer / Admin / schema / registry / production / build / deploy / gh-pages / Blogger repost 變更。）*
