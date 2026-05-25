# 2026-05-25 Affiliate First Activation Readiness

> Phase: `20260525-am-11-affiliate-first-activation-readiness-doc-a`
> 模式：docs-only（純 readiness snapshot 落地；**不**啟用 affiliate）
> 來源：本文件為 Phase `20260525-am-10-affiliate-first-activation-readonly-a` 之 read-only audit 結果整理。

---

## §1 文件目的與範圍

### 1.1 本文件是什麼

本文件為 **2026-05-25 對 Affiliate（聯盟行銷）第一篇啟用前之狀態 readiness snapshot + walkthrough**。屬 docs-only / 狀態紀錄 + 未來啟動步驟說明性質；保留為未來 cold-start onboarding / 啟動第一篇 affiliate post 前之 baseline reference。

### 1.2 本文件不是什麼

- ❌ **不是**啟用指令（不啟用任何 post 之 `affiliate.enabled`；不修任何 frontmatter）
- ❌ **不是**新 spec（schema proposal 屬 `docs/ad-affiliate-schema-proposal.md`；GA4 event 治理屬 `docs/click-tracking-governance.md`）
- ❌ **不是** AdSense 啟用文件（AdSense blocked on custom domain + 審核；屬 Phase 2）
- ❌ **不取代** `docs/phase-1-usability-review.md` §3.5（affiliate 維度盤點）/ §5.3 #4（補強候選列為「Affiliate 第一篇啟用 walkthrough」）

### 1.3 本 phase 之嚴格邊界

本 phase 屬 docs-only / 純記錄狀態 + 未來步驟說明：

- ❌ 不啟用 affiliate（不翻任何 `affiliate.enabled`；不改 `position.top/bottom`；不填 `links[]`）
- ❌ 不修改任何文章（含 `content/blogger/posts/*.md` / `content/github/posts/*.md` / 任何 `.publish.json` / `.fb.md`）
- ❌ 不修改任何 settings（含 `affiliate-networks.json` / `ads.config.json`）
- ❌ 不修改任何 templates
- ❌ 不修改 EJS partial（含 affiliate-box render / adsense-* partials）
- ❌ 不 build / 不 deploy / 不 push gh-pages
- ❌ 不操作 Blogger 後台 / GA4 後台 / FB 後台
- ❌ 不 commit / 不 push（待 user 決定）
- ✅ 唯一允許：新增本檔 `docs/20260525-affiliate-first-activation-readiness.md`

---

## §2 Audit baseline

### 2.1 git baseline（snapshot 啟動時）

| 項目 | 值 |
|------|---|
| repo | `portable-blog-system` |
| working directory | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `62b729833b0fef5dd4bcdc87b08e970cd3ac3015`（short `62b7298`；am-9 checkpoint commit）|
| origin/main | `62b729833b0fef5dd4bcdc87b08e970cd3ac3015` |
| ahead / behind | `0 / 0` |
| working tree | clean |

### 2.2 本批 read-only 檢查範圍

| 檢查 | 方式 | 結果 |
|------|------|------|
| settings：affiliate provider 列表 | direct read `affiliate-networks.json` | ✅ 2 providers（通路王 + 聯盟網）|
| settings：AdSense 狀態 | direct read `ads.config.json` | ✅ enabled=false / 5 slot 全空 |
| docs：schema proposal | direct read `ad-affiliate-schema-proposal.md` | ✅ proposal-only；§1.3 明示未實作 |
| docs：phase-1 user guide affiliate 段 | direct read `phase-1-user-operation-guide.md` | ✅ §10 row #1 已標 GA4 已完成；無 affiliate 必勾 |
| docs：phase-1 usability affiliate 段 | direct read `20260525-phase1-usability-review.md` §3.5 / §4 row #13 / §5.2 #6 / §5.3 #4 | ✅ dormant 性質完全對齊 |
| content：affiliate frontmatter | grep `affiliate:` block + `enabled: true` | ✅ 詳見 §3 / §4 |

### 2.3 檢查過的檔案

- `content/settings/affiliate-networks.json`
- `content/settings/ads.config.json`
- `docs/ad-affiliate-schema-proposal.md`
- `docs/phase-1-user-operation-guide.md`
- `docs/20260525-phase1-usability-review.md`
- `content/blogger/posts/20260515-we-media-myself2.md`
- `content/blogger/posts/20260504-sample-book-review.md`
- `content/templates/blogger-book-review-template.md`
- `content/templates/blogger-magazine-review-template.md`

**任何 npm script 是否執行**：❌ 否。本 phase 純 grep / read 檔案；不執行 `validate:content` / `build:*` / `report:*` / `check:*`。

---

## §3 Affiliate 目前狀態表

### 3.1 設定檔層

| 檔案 | 內容 | 狀態 |
|------|------|------|
| `content/settings/affiliate-networks.json` | 2 providers：`books`（通路王）/ `affiliate-network`（聯盟網）；每 entry 含 `id` / `name` / `rel` | ✅ 基礎 metadata 在；schema 極簡（無 networkUrl / 子帳號 / 啟用 flag）|
| **rel 規則** | 兩 provider 皆 `"sponsored nofollow noopener noreferrer"` | ✅ 對齊 `CLAUDE.md` §16.2（聯盟連結 rel）|
| `content/settings/ads.config.json` | `enabled: false` / `adsenseClient: ""` / 5 slot id（postTop / postMiddle / postBottom / sidebar / homeInline）全空 | 🔴 **AdSense dormant**（依賴 custom domain + HTTPS Enforce + 審核；blocked）|
| `docs/ad-affiliate-schema-proposal.md` | 437 行；統一 schema proposal（provider / placement / campaign 三層） | 🟡 **proposal-only，未實作**（§1.3 明示「docs-only proposal；不代表已實作」）|

⚠️ 用戶語境中之 `content/settings/ads.json` 實際檔名為 `content/settings/ads.config.json`（per `CLAUDE.md` §3.2 規範）。

### 3.2 內容層

| 檔案 | `affiliate.enabled` | `position.top` | `position.bottom` | `links` | status | 性質 |
|------|---|---|---|---|---|------|
| `content/blogger/posts/20260515-we-media-myself2.md`（唯一 ready Blogger full-mode post）| **false** | false | false | ✅ 2 筆已填（博客來/通路王 + 金石堂/聯盟網）| ready | 資料已 pre-populate；render block 兩端皆關 |
| `content/blogger/posts/20260504-sample-book-review.md` | true | true | true | `[]`（空）| **draft** | sample / 不入 dist |
| `content/templates/blogger-book-review-template.md` | true | true | true | `[]` | 模板 | schema scaffold；不入 build |
| `content/templates/blogger-magazine-review-template.md` | true | true | true | `[]` | 模板 | schema scaffold；不入 build |
| `content/github/posts/*`（2 篇 tech-note）| ❌ 無 affiliate 區塊 | — | — | — | ready | tech-note；無 affiliate；內容類型不適合 |

### 3.3 GA4 click_affiliate_cta 狀態

| 維度 | 狀態 |
|------|------|
| `click_affiliate_cta` event 已 landed | ✅ per `docs/20260525-phase1-usability-review.md` §3.5 |
| 真實 fire 紀錄 | ❌ 0（無 ready post 啟用 affiliate → event 從未被觸發）|
| 性質 | 「首次啟用即為 first-time validation」|

---

## §4 Dormant 確認

### 4.1 結論

✅ **affiliate 仍為 dormant**。

### 4.2 判定依據

| # | 證據 | 來源 |
|---|------|------|
| 1 | ready posts 中 **0 篇** `affiliate.enabled: true` | §3.2 表 |
| 2 | 唯一 ready full-mode Blogger post（`we-media-myself2`）雖 `links[]` 已填 2 筆但 `enabled: false` + `position.top/bottom: false` → render 階段被 skip | §3.2 row 1 |
| 3 | sample-book-review / templates 中之 `enabled: true` 為 schema scaffold；status=draft 或模板身分 → 不入 `dist/` / `dist-blogger/` | §3.2 row 2-4 |
| 4 | `click_affiliate_cta` event 已 landed 但**從未真實 fire** | §3.3 |
| 5 | 與 `docs/20260525-phase1-usability-review.md` §3.5（affiliate 🟡 partial / dormant）+ §5.2 #6（affiliate dormant 痛點）**完全對齊**；無 drift | §3.5 / §5.2 |

---

## §5 候選文章盤點

### 5.1 C1：`content/blogger/posts/20260515-we-media-myself2.md`（過渡型；不推薦）

**候選理由**：

- 唯一 ready Blogger full-mode post
- `affiliate.links[]` 已預填 2 筆（通路王 / 聯盟網；URL 含 `?uid1=blog` 追蹤碼）
- 翻轉成本最低（理論上只需翻 3 個 boolean）

**不建議立即啟用原因**：

- ⚠️ **已 production live**：翻轉 = 改動既有讀者頁面；與 `docs/reverse-utm-fixture-plan.md` §2「不能改既有 + 沒有新自然文章」原則同類
- ⚠️ 主題為「自媒體心得 / Why be your own self-media」**非 traditional 書評**；affiliate CTA 與內文主題契合度中等
- ⚠️ 過度商業化風險：已發布後追加 top + bottom 兩個 `<aside>` CTA，讀者觀感影響
- ⚠️ 本質為「拿 production 文章做 fixture」；屬「為驗收而做」非「為內容而做」

**結論**：❌ **不建議現在翻 production 文章**。

### 5.2 C2：`content/blogger/posts/20260504-sample-book-review.md`（佈線型；不推薦）

**候選理由**：

- schema 完整對齊 book-review template
- `affiliate.enabled: true` 已預設

**不建議立即啟用原因**：

- ⚠️ **status=draft**；`book.title` 全空；body 僅一句 placeholder「請在此撰寫書評內容。」
- ⚠️ 本質為 schema sample；強化為 ready 需補完整 book metadata（title / titleEn / author / publisher / isbn / coverImage / publishedYear）+ 完整書評內容 + `affiliate.links[]` 真實連結
- ⚠️ 屬「為 affiliate 而硬寫文章」反向；違反主軌原則

**結論**：❌ **不建議把 sample 硬升 ready**。

### 5.3 C3：未來自然書評 post（主軌；推薦）

**候選理由**：

- 真實有內容驅動之書評
- 自然觸發 `affiliate.enabled` + `links[]` 填入
- 不破壞既有 production
- 對齊 `phase-1-usability-review.md` §4 row #13 + §5.4 Phase 2 row #1 之預期路線

**結論**：✅ **主軌推薦**。暫無候選；等 user 寫新書評時自然啟動。

### 5.4 GitHub tech-note posts

**結論**：❌ **不適合 affiliate，因內容類型不符**。

- 2 篇 tech-note（`20260504-github-pages-blog-planning.md` / `20260504-portable-blog-system-mvp.md`）皆無 `affiliate` frontmatter 區塊
- contentKind=`tech-note`；技術筆記類型強加 affiliate CTA 違反內容類型；亦違 `CLAUDE.md` §11 / §12（書評文章規則）之 affiliate 適用範圍

---

## §6 未來啟用 walkthrough

⚠️ 本節為**未來啟動時之步驟說明**；本 phase 不執行任何步驟。

### §6.1 metadata 欄位

```yaml
affiliate:
  enabled: true                              # 翻 false → true
  disclosure: "本文包含聯盟行銷連結。若你透過連結購買，本站可能取得少量回饋。"
  position:
    top: true                                # 視策略選 true / false
    bottom: true                             # 視策略選 true / false（§6.3 建議第一篇只開 bottom）
  links:
    - label: "博客來"                         # 連結顯示文字
      network: "通路王"                       # 對應 affiliate-networks.json[].name
      url: "https://whitehippo.net/...?uid1=blog"
    - label: "金石堂"
      network: "聯盟網"
      url: "https://adcenter.conn.tw/...?uid1=blog"
```

欄位職責：

| 欄位 | 職責 |
|------|------|
| `affiliate.enabled` | 總開關；false 時不 render；true 仍需 position.top / bottom 至少其一為 true 才實際 render |
| `affiliate.disclosure` | 聯盟揭露文案；預設文案已在 template；可保留 / 微調 |
| `affiliate.position.top` | 文章上方 affiliate-box `<aside>` 是否 render |
| `affiliate.position.bottom` | 文章下方 affiliate-box `<aside>` 是否 render |
| `affiliate.links[].label` | 連結顯示文字（如「博客來」/「金石堂」）|
| `affiliate.links[].network` | provider 識別；對應 `affiliate-networks.json[].name` |
| `affiliate.links[].url` | 真實導購 URL（含 provider 提供之追蹤碼如 `?uid1=blog`）|

### §6.2 provider

- `affiliate.links[].network` 之值對應 `content/settings/affiliate-networks.json` 之 `name` 欄位
- 當前支援：`"通路王"` / `"聯盟網"`
- 若新增第三 provider（如直接合作 `custom_direct` / 其他聯盟平台）：
  - **必須先擴** `content/settings/affiliate-networks.json` 加 entry
  - 對齊 `docs/ad-affiliate-schema-proposal.md` §6.4（custom_direct mapping）
  - 屬獨立 phase；不在第一篇 affiliate 啟用 phase 範圍

### §6.3 top / bottom 區塊

| 設定 | render 行為 |
|------|------------|
| `position.top: true` | 文章 body 上方 inline `<aside class="lab-affiliate-box">` |
| `position.bottom: true` | 文章 body 下方 inline `<aside class="lab-affiliate-box">` |
| 兩端皆 true | 上下各一；同 `links[]` 可指向同 URL；GA4 event 靠 `placement` param 區分（per `docs/ad-affiliate-schema-proposal.md` §7.2）|

**第一篇建議策略**：

- ✅ **只開 bottom**（`position.top: false` + `position.bottom: true`）
- 理由：降低過度商業化風險；文末位置更自然；首次啟用以驗證 listener 為主目的；觀感較中性
- 後續若內容類型適合（如 affiliate 為主推資源），再考慮兩端皆開

### §6.4 link rel 規則

- 作者**不手填** `rel`；由 build / render 階段自動套
- 自動套之值：`sponsored nofollow noopener noreferrer`（來源：`affiliate-networks.json[].rel`）
- 對齊：
  - `CLAUDE.md` §16.2（聯盟連結 rel 規範）
  - `docs/ad-affiliate-schema-proposal.md` §6.2 / §6.3（通路王 / 聯盟網 provider mapping）

### §6.5 GA4 click_affiliate_cta 驗證

驗證流程：

| # | 步驟 | 備註 |
|---|------|------|
| 1 | `npm run build` | 含 GA4 partial inject 至 head；四條件 gating（per `phase-1-user-operation-guide.md` §7）|
| 2 | deploy gh-pages | `cp -r dist/* ../portable-blog-deploy/` + `git add` + commit + push gh-pages |
| 3 | 等 GitHub Pages cache | 約 5-10 min |
| 4 | Chrome 無痕 + GA4 DebugView / Realtime 開啟 production URL | GitHub Pages 端 |
| 5 | 點 affiliate-box bottom（或 top）CTA → 觀察 GA4 DebugView 即時出現 `click_affiliate_cta` event | event 應 fire |
| 6 | 確認 event params | 至少包含：`placement`（`article_top` vs `article_bottom`）/ `link_url` / `link_label` / `outbound: true` / `provider` |
| 7 | SOP cross-ref | `docs/20260524-ga4-reverse-utm-observation.md` §4-§6（GA4 觀察方法通用）|

⚠️ **第一次啟用即為 first-time validation**：`click_affiliate_cta` 事件 listener 從未真實 fire 過；首次啟用即為其完整驗證契機。若 fire 失敗 / params 不全 → 不 push 啟用 commit → 開新 phase 修 listener；不影響 production。

### §6.6 Blogger 手動貼文注意事項

per `docs/20260524-blogger-repost-checklist.md` + `dist-blogger/posts/{slug}/publish-checklist.txt`：

| # | 注意項 |
|---|--------|
| 1 | `npm run build:blogger` 產 4 檔 dist：`post.html` / `copy-helper.txt` / `meta.json` / `publish-checklist.txt` |
| 2 | **affiliate-box render 於 article body 內 inline**（屬 body fragment 一部分；**非**獨立 copy-helper 區塊）|
| 3 | 貼 `post.html` 全文至 Blogger 後台 → affiliate-box 隨內文一併貼入 |
| 4 | ⚠️ **Blogger 端不 fire `click_affiliate_cta`**（per `blogger-listener-strategy.md` §5.1 短期不做）；GA4 event 僅 GitHub Pages 端記錄 |
| 5 | ⚠️ Blogger 後台 GA 設定**不會**幫忙 fire 站內 affiliate event（Blogger 用自己的 page_view；不對接站內 click 機制）|
| 6 | 桌機 + 手機預覽**必驗** top / bottom `<aside>` 兩端是否正確 render、不破版；手機版觸控目標 ≥ 44×44px |

### §6.7 GitHub Pages 是否需要 build / deploy

✅ **需要**。

| 原因 | 說明 |
|------|------|
| `click_affiliate_cta` event 只在 GitHub Pages 端 fire | per §6.6 #4；Blogger 端無 listener |
| affiliate-box render 兩端 mirror，但 GA4 event 僅 GitHub 端有效 | per `ad-affiliate-schema-proposal.md` §9.1 |
| source repo 與 deploy repo 是獨立流程 | per `phase-1-user-operation-guide.md` §2；多步手動（per `phase-1-usability-review.md` §5.2 痛點 #7）|

驗證 path 必經：source `npm run build` → `cp` to deploy repo → commit + push gh-pages → 等 CDN → 驗。

---

## §7 風險判斷

| # | 風險面向 | 等級 | 說明與緩解 |
|---|---------|------|----------|
| **7.1** | affiliate 連結格式風險 | 🟡 中 | 通路王 / 聯盟網 URL 自帶 affiliate tracking code（如 `?uid1=blog`）；若被 build 強 append UTM 會污染聯盟回傳；緩解：當前 build 階段不對 affiliate URL append UTM（per `CLAUDE.md` §16.4 cross-link UTM 範圍**不**含 affiliate）；風險可控但 future schema migration（per `ad-affiliate-schema-proposal.md` §4 `tracking.utmAllowed` 欄位）不可破此約束 |
| **7.2** | GA4 click_affiliate_cta 首次驗證風險 | 🟡 中 | event 已 landed 但無歷史 fire；首次啟用即首次驗證；可能發現 listener attach 失敗 / params 缺漏 / placement 區分異常；緩解：先 DevTools Network + GA4 DebugView 觀察；若 fire 失敗 → 不 push enable commit → 開新 phase 修 listener；不影響 production |
| **7.3** | Blogger 手動貼文遺漏風險 | 🟡 中 | per `phase-1-usability-review.md` §5.2 痛點 #2「Blogger 100% 手動貼 5-10 min；漏貼某區塊不易發現」；affiliate-box 屬 article body inline（非獨立 copy-helper 區塊）→ 若漏貼某段 body 則 affiliate-box 也漏；緩解：用 `publish-checklist.txt` + 桌機 + 手機預覽逐項對 |
| **7.4** | 過度商業化風險 | 🟡 中 | 首篇即上 top + bottom 兩個 CTA aside；讀者觀感影響 + AdSense 審核未來印象（即使現在沒 AdSense）；緩解：採 §6.3 建議「第一篇只開 bottom」；控制 `links.length` ≤ 2 |
| **7.5** | 第一篇不適合硬啟用風險 | 🔴 **高** | 候選 C1（we-media-myself2）已 production live；翻轉 = 改動既有讀者頁面 + 主題契合度中等；候選 C2（sample-book-review）為 draft + 內容空白；強硬選任一都屬「為驗收而做」；對齊 `reverse-utm-fixture-plan.md` §2 deadlock；緩解：等主軌觸發（C3 user 真實寫新書評）|
| **7.6** | disclosure 文案合規風險 | 🟢 低 | 預設 disclosure「本文包含聯盟行銷連結...」對齊台灣常見聯盟揭露慣例；未對齊任何特定法規 audit；緩解：未來上 AdSense / 收益增加時請 user 校稿 |
| **7.7** | production state drift 風險 | 🟢 **無** | 本 phase 純 read-only；無 source / content / dist 改動；無 drift |

### 7.8 整體風險評估

🟡 **中**（主要來自 #7.5「第一篇選擇」風險與 #7.2「首次驗證」風險；其餘可控）

---

## §8 不建議現在硬啟用

明確聲明：

| # | 不建議事項 | 理由 |
|---|-----------|------|
| 1 | **不建議現在改 `content/blogger/posts/20260515-we-media-myself2.md`** | 已 production live；非自然觸發；§7.5 高風險 |
| 2 | **不建議把 `content/blogger/posts/20260504-sample-book-review.md` 升成 ready** | 屬「為 affiliate 寫文章」反向；status=draft + 內容空白；§5.2 結論 |
| 3 | **不建議現在實作 `docs/ad-affiliate-schema-proposal.md` 之統一 schema** | proposal 性質；§10 順序 1 需 user 先表態 a/b 兩選項（共用 schema vs 兩套獨立）；屬 Phase 2 |
| 4 | **不建議現在啟用 `content/settings/ads.config.json` (AdSense)** | blocked on custom domain（per `docs/custom-domain-root-files-strategy.md` §4.5）+ AdSense 審核；屬 Phase 2 row #2 |
| 5 | **主軌**：等真實新書評 / 心得文章自然觸發 | 對齊 `phase-1-usability-review.md` §5.4 row #1 + `reverse-utm-fixture-plan.md` §10.4 主軌精神 |

---

## §9 後續啟動條件

當 user 決定啟用第一篇 affiliate 時，建議滿足以下條件後啟動：

| # | 條件 |
|---|------|
| 1 | user 寫新書評（或心得文章），且內容**自然適合**導購（書 / 課程 / 工具）|
| 2 | 書籍 / 商品連結已準備好（通路王 / 聯盟網 後台複製到之 URL 含追蹤碼）|
| 3 | disclosure 文案確認（默認文案足夠 / 或 user 微調）|
| 4 | 願意進行 GitHub Pages build / deploy（per §6.5 / §6.7 流程）|
| 5 | 願意做 GA4 DebugView / Realtime 驗證（per §6.5）|
| 6 | Blogger 發文或重貼時間已安排（per §6.6 + `docs/20260524-blogger-repost-checklist.md` SOP）|

若 6 項皆滿足 → 啟動新 phase 執行 §6 walkthrough。

---

## §10 本 phase 邊界保證

本 phase `20260525-am-11-affiliate-first-activation-readiness-doc-a` 嚴格遵守 docs-only 邊界：

| 項目 | 狀態 |
|------|------|
| 新增 `docs/20260525-affiliate-first-activation-readiness.md`（本檔） | ✅ 唯一允許之動作 |
| 啟用 affiliate（翻 `affiliate.enabled` / `position.*`；填 `links[]`）| ❌ 無 |
| 修改任何 post（`content/blogger/posts/*.md` / `content/github/posts/*.md`）| ❌ 無 |
| 修改任何 settings（`affiliate-networks.json` / `ads.config.json` / 其他）| ❌ 無 |
| 修改任何 templates（`blogger-book-review-template.md` / `blogger-magazine-review-template.md` 等）| ❌ 無 |
| 修改 README / docs index（`docs/README.md`）/ CLAUDE.md | ❌ 無 |
| 修改 `src/` / `content/` / `templates/` / `settings/` / build scripts | ❌ 無 |
| 修改 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | ❌ 無 |
| 執行 `npm install` | ❌ 無 |
| 執行 `npm run build*` / `npm run validate*` / `npm run dev` | ❌ 無 |
| 執行 deploy（cp dist → deploy repo / push gh-pages）| ❌ 無 |
| 執行 git commit / push | ❌ 無（待 user 確認後另行決定）|
| 觸碰 Blogger 後台 / GA4 後台 / FB 後台 | ❌ 無 |

本文件落地後**不**改變任何 production state；屬純 readiness 紀錄 + walkthrough 工具。

---

## §11 Cross-links

### 11.1 本日（5/25）docs trail

- `docs/20260525-pc-handoff-baseline.md`（PC handoff baseline；commit `65145a8`）
- `docs/20260525-phase1-usability-review.md`（Phase 1 usability review；commit `d13174f`；§3.5 affiliate 維度 + §5.2 #6 dormant + §5.3 #4 walkthrough 補強候選）
- `docs/20260525-phase1-user-guide-drift-check.md`（user guide drift audit；commit `dc167a6`）
- `docs/phase-1-user-operation-guide.md`（commit `d6a8922`）
- `docs/20260525-reverse-utm-readiness-snapshot.md`（reverse UTM readiness；commit `2470deb`；本檔同型結構參考）
- `docs/20260525-am-checkpoint-report.md`（5/25 AM checkpoint；commit `62b7298`）
- 本文件（5/25 am-11；待 commit）

### 11.2 Affiliate / AdSense schema 與規範

- `docs/ad-affiliate-schema-proposal.md`（統一 schema proposal；proposal-only）
- `content/settings/affiliate-networks.json`（既有 affiliate provider 列表）
- `content/settings/ads.config.json`（既有 AdSense 設定；dormant）
- `CLAUDE.md` §12（書評文章 affiliate 規則）/ §16.2（聯盟連結 rel）/ §17（文章頁版型含 Optional Affiliate Box）

### 11.3 GA4 / click tracking

- `docs/click-tracking-governance.md`（GA4 click event 治理；`click_affiliate_cta` 規格）
- `docs/ga4-link-tracking-spec.md`（GA4 link tracking 主規格）
- `docs/20260524-ga4-reverse-utm-observation.md`（GA4 觀察 SOP；§4-§6 通用觀察方法）

### 11.4 Blogger 手動發文

- `docs/20260524-blogger-repost-checklist.md`（Blogger 後台手動重貼 SOP）

### 11.5 上層規範與決議

- `CLAUDE.md` §3（核心資料來源）/ §16.4（cross-site UTM；affiliate 不在 cross-link UTM 範圍）/ §29（第一版不做）
- `docs/blogger-listener-strategy.md` §5.1（Blogger 端 click tracking 不做之設計決議）
- `docs/custom-domain-root-files-strategy.md` §4.5（AdSense 啟用之 custom domain 依賴）
- `docs/reverse-utm-fixture-plan.md` §2 / §10.4（「不能改既有 + 等自然文章」原則對齊參考）

---

（本文件結束）
