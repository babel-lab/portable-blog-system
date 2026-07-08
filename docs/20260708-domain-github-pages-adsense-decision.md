# 新網域必要性 / GitHub Pages URL / AdSense 收益 時機決策盤點

- 日期：2026-07-08（Asia/Taipei）
- 類型：**docs-only 決策盤點**（read-only；不買網域、不改 DNS、不改 GitHub Pages custom domain、不碰 Blogger / AdSense / GA4 / Search Console 後台、不 deploy、不改 gh-pages、不改 content 文章）
- 對應決策問題：只用 GitHub Pages 網址是否足夠？新網域的必要性？是否影響 AdSense 審核與營收？
- 已決背景（Dean）：**不立刻買新網域**；`babel-lab.tw` 類自訂網域應等 BLOG Phase 1 穩定、測試通過、準備開始累積 SEO 權重時再申請，避免太早開始計費。

上位文件（本文件不重複其機制細節，只做決策/時機層）：
- `docs/custom-domain-root-files-strategy.md`（自訂網域根目錄檔案安全策略；CNAME / ads.txt / robots / sitemap 之來源與遷移 checklist §4）
- `docs/content-platform-routing.md` §5（custom domain migration 影響）
- `docs/20260617-blog-phase1-wrapup-status-map.md`（收尾路線圖 C 線 = GitHub·domain）
- CLAUDE.md §21 / §24 / §2.2（SEO / primaryPlatform / canonical / GitHub Pages 定位）

---

## §0 Boot verification snapshot（本 session 起始，read-only）

| Repo | Branch | HEAD | 對照 remote | ahead/behind | working tree | index.lock |
|---|---|---|---|---|---|---|
| source（`portable-blog-system`）| `main` | `d11b595` | == `origin/main` | 0 / 0 | clean | 無 |
| deploy（`portable-blog-deploy`）| `gh-pages` | `1170e7e` | == `origin/gh-pages` | 0 / 0 | clean | 無 |

兩端與 frozen baseline 一致，未改任何檔即進入盤點。

---

## §1 結論摘要（TL;DR）

1. **現在不需要立刻買網域。** 目前只用 GitHub Pages URL（`https://babel-lab.github.io/portable-blog-system/`）足以支撐 Phase 1 的「測試 / 展示 / 技術文章發佈」目的，Phase 1 可以在無自訂網域的狀態下繼續、收尾。
2. **主收益站是 Blogger，且完全不受影響。** Blogger 有 Google 原生 AdSense 整合，既有流量與 AdSense 收益與「GitHub Pages 是否有自訂網域」互不相干。此決策**不會動到 Blogger 主收益**。
3. **github.io 不是可靠的 AdSense 變現面。** AdSense 對子網域改採「以母網域（parent domain）狀態」判定；`github.io` 是 GitHub 擁有的共享公共後綴（public suffix），Dean 無法讓母網域通過審核、也無法在母網域根目錄放 AdSense 驗證所需檔案。因此**若目標是「讓 GitHub Pages 站本身長期靠 AdSense 賺錢」，自訂網域幾乎是必要條件**（見 §5）。
4. **買網域的正確時機 = 「準備開始為 GitHub Pages 站認真累積 SEO 權重 / 認真變現」時**，不是現在。太早買 = 提早計費 + 提早鎖死一個還可能改的品牌字串；太晚買 = SEO 權重與外部連結累積在 `github.io` 上，日後搬家會有一次性折損（見 §4 / §6）。
5. **建議：維持現狀（GitHub Pages URL），Phase 1 繼續。** 下一步只做 docs-only 的觸發條件盤點與 ads.txt/CNAME 遷移預案（本文件即是），不動任何線上設定。

> ⚠️ AdSense 現行規則以 **2026-07 網路查證**為準（Google AdSense 說明中心 / 社群討論 + GitHub community discussion）。正式申請前應再至 Google AdSense 官方說明中心 / Search Central 覆核最新條款；本文件不代表已於 AdSense 後台驗證此站之實際 serving 行為。

---

## §2 A. 現狀盤點

### 2.1 GitHub Pages 是否已可作為測試 / 展示 / 技術文章發佈面？→ ✅ 可以

deploy clone（gh-pages）已部署且線上可達，根目錄含：

| 項目 | 狀態 |
|---|---|
| 首頁 `index.html` / `404.html` | ✅ |
| `posts/` 文章詳細頁 | ✅（已 deploy 3 篇 github-native + 1 blogger-cross mirror，per C1 deploy milestone）|
| `categories/` / `tags/` 分類標籤頁 | ✅ |
| `design-system/` | ✅（robots Disallow，noindex）|
| `privacy/` 隱私權頁 | ✅ |
| `affiliate-disclosure/` 聯盟揭露頁 | ✅ |
| `assets/` / `favicon/` / `icons/` / `images/` / `downloads/` | ✅ |
| `.nojekyll` | ✅ |

**結論**：作為技術筆記主站的「本機可預覽 + 可 build + 可 deploy + 線上可達」目的已達成；作為測試 / 展示 / 技術文章發佈面**已足夠**。缺的只是「自訂網域帶來的品牌與長期 SEO / AdSense 主體性」，非「能不能發文」。

### 2.2 是否已有 AdSense 設定 / 廣告 slot 模型？→ ✅ 有（模型已 wired），但 ⚠️ 變現主體性未定

| 項目 | 狀態 |
|---|---|
| `content/settings/ads.config.json` | ✅ 存在；`enabled: true`；含 `adsenseClient` / `loader` / `slots` / `defaults` 結構 |
| GitHub Pages article ads（N9e）| ✅ 依 CLAUDE.md 記錄為 LIVE（2026-06-11）；14 v1 anchors / resolver / article-block / anchor-wiring |
| Blogger AdSense | ✅ 6 篇 live（`articleAd6` / `beforeRelatedLinks`），主收益來源 |
| 真實 AdSense client / slot id | 僅存於 `ads.config.json`（red line；不外流 docs）|

⚠️ **重要區分**：「廣告 slot 已 wired、程式碼會 render」**不等於**「Google 會在 `github.io` 這個母網域面上穩定 serving 付費廣告、且長期政策合規」。既有 AdSense 帳號是透過 Blogger 通過的（account-level 已 approved），所以程式碼能載入；但**把 `babel-lab.github.io` 當成「新增網站」送 AdSense 審核 / 依賴其長期 serving，會撞到 §5 的母網域限制**。此為本決策的核心風險點。

### 2.3 是否已有 sitemap / robots / ads.txt / GA4 / disclosure 等正式站基礎？

| 基礎 | 狀態 | 備註 |
|---|---|---|
| `sitemap.xml` | ✅ 已 deploy | 由 `build-sitemap.js` 動態帶 `githubSiteUrl`；換 domain 只需改 `site.config.json` 一處 |
| `robots.txt` | ✅ 已 deploy | 含 `Sitemap:` 指向現 github.io URL；同上換 domain 自動帶新值 |
| **`ads.txt`** | ❌ **不存在（刻意）** | per `custom-domain-root-files-strategy.md` §3.2：AdSense 通過取得真 pub id 前不建假檔；空 / 假 ads.txt 反造成 crawler error |
| GA4 | ✅ production live（measurementId 已設，`enabled: true`；`G-C77SMPF8VD` 自 2026-05-21）| 換 domain 只需 GA4 後台改 Data Stream URL，measurementId 不變 |
| 隱私權 / 聯盟揭露頁 | ✅ 已 deploy（`privacy/` + `affiliate-disclosure/`）| AdSense 審核常要求隱私權政策頁；此項已備 |
| `CNAME` | ❌ 不存在（刻意）| 等 domain 確定；提早建假 CNAME 會 break DNS check |

**結論**：正式站的 SEO / 追蹤 / 揭露基礎大致就緒（sitemap / robots / GA4 / 隱私權 / 揭露頁齊全），唯二刻意留白的是 **`ads.txt` 與 `CNAME`**——兩者都應等「有真 pub id / 有確定 domain」時才落地。

---

## §3 B. 決策比較表：現用 GitHub Pages URL vs 之後改自訂網域

比較兩個選項：

- **選項 A**：`https://babel-lab.github.io/portable-blog-system/`（現況，project site，subpath）
- **選項 B**：改用自訂網域，例如 `babel-lab.tw`（apex）或 `blog.babel-lab.tw`（subdomain）

| 面向 | A：GitHub Pages URL（現用） | B：自訂網域（如 babel-lab.tw） |
|---|---|---|
| **成本** | 🟢 $0；GitHub Pages 免費、無 domain 續費 | 🟡 網域年費（.tw 約每年數百～上千 TWD，依註冊商）＋每年續費；TLS 由 GitHub 免費簽發 |
| **SEO 權重累積** | 🟡 權重累積在 `babel-lab.github.io` 這個「別人的母網域」子路徑上；能被索引，但你不擁有母網域信號；**日後搬家會有一次性折損** | 🟢 權重累積在你自己擁有的網域；可長期複利、可搬 host 而網域不變；是「認真做 SEO」的正解 |
| **品牌可信度** | 🟡 `xxx.github.io/portable-blog-system/` 對一般讀者較「技術 / 半成品」感，網址長、subpath | 🟢 短、專業、易記、易口碑傳播；品牌主體性強 |
| **AdSense 審核風險** | 🔴 高風險 / 不可靠：AdSense 以母網域狀態判定子網域，`github.io` 是共享 public suffix，你無法讓母網域 approved、也無法在母網域根放驗證檔（見 §5）| 🟢 標準情境：自有網域可正常送審、可在根目錄放 `ads.txt`、可驗證擁有權；審核路徑乾淨 |
| **AdSense 長期營收彈性** | 🔴 低：受制於平台共享網域，難以把 GitHub Pages 站發展成獨立變現主體 | 🟢 高：自有網域可自由配置 ads.txt / 多 slot / 未來換聯播網或直售廣告皆不受平台限制 |
| **日後搬家成本** | 🔴 高：一旦在 github.io 累積索引 / 外連 / 收藏，搬到自訂網域需 301 導向、重送 sitemap、GSC 重驗、等 Google 重新評估，會有過渡期流量與權重折損 | 🟢 低：自訂網域下換 host（GitHub Pages → 其他）只改 DNS，URL 不變、SEO 不斷；「可搬家」核心價值真正成立 |
| **GitHub Pages 技術限制** | 共通：純靜態、100GB/月 soft bandwidth、1GB repo soft、build 有限；project site 為 subpath（`/portable-blog-system/`），base path 需正確；無伺服器端邏輯 | 共通同左；自訂網域**不解除**這些靜態限制，只解除「URL 主體性 / AdSense 母網域」問題。custom domain 需正確設 CNAME + apex 需 ALIAS/ANAME 或 A records + 等 TLS provisioning + 勾 Enforce HTTPS |
| **對 Blogger 主收益站的影響** | 🟢 無：Blogger 有原生 AdSense、獨立網域路徑；GitHub Pages 是否買網域完全不影響 Blogger 流量或 AdSense 收益 | 🟢 無：同左；且自訂網域可強化 GitHub↔Blogger 互導的品牌一致性（cross-link UTM 僅需 hostname 更新，convention 不變）|

**表格解讀**：A 唯一勝在「成本 $0 + 現在就能用」；B 在「SEO 長期 / 品牌 / AdSense 審核與彈性 / 搬家成本」全面勝出。因此這不是「哪個好」的問題，而是**「何時從 A 切到 B」的時機問題**——切太早浪費續費與鎖品牌，切太晚累積搬家折損。

---

## §4 C. 建議（四個決策問題）

### Q1. 現在是否需要立刻買新網域？→ ❌ 否

理由見 §7。核心：目前目標是「Phase 1 穩定 + 技術文章發佈 + 測試展示」，這些用 github.io URL 都能達成；主收益在 Blogger、不受影響；而「認真累積 SEO / 靠 GitHub Pages 站 AdSense 變現」尚非當前階段目標。提早買只是提早計費 + 提早鎖死可能還會改的品牌字串。

### Q2. 若暫時只用 GitHub Pages URL，是否可以繼續 Phase 1？→ ✅ 可以

Phase 1 的定義（CLAUDE.md Phase 1）是「GitHub 本機可預覽 MVP + 首頁/列表/文章/分類/標籤 + draft 過濾 + Design System」。這些**完全不依賴自訂網域**，且已 landed（Phase 1 final 已於 2026-05-18 宣告）。GitHub Pages 首次 deploy 亦已完成、線上驗證 PASS。故用 github.io URL 繼續 / 收尾 Phase 1 無任何阻礙。

### Q3. 什麼條件達成後才建議買網域？→ 見 §8 觸發條件 checklist

一句話：**當「準備開始為 GitHub Pages 站認真累積 SEO 權重 / 認真讓它自己變現」成為明確目標時**（而非之前）。

### Q4. 買網域前還缺哪些最小條件？→ 見 §9 checklist

摘要：(a) 確定品牌字串（`babel-lab.tw` vs 其他）與註冊商；(b) 有可設 DNS 的管理權限；(c) 內容量 / 更新節奏達到值得投資 SEO 的門檻；(d) 想清楚「GitHub Pages 站是否真的要獨立跑 AdSense」（若只靠 Blogger 收益，網域的 AdSense 理由就弱、SEO/品牌理由仍在）。

---

## §5 AdSense 風險與注意事項（github.io 的核心限制）

1. **母網域判定（parent-domain treatment）**：AdSense 現行對子網域不再逐一審核，而是**沿用母網域的核准狀態**。`babel-lab.github.io` 的母網域是 `github.io`——一個 GitHub 擁有、列於 Public Suffix List 的共享網域。你**無法讓 `github.io` 通過審核**，也**無法在其根目錄放置 AdSense 所需檔案**。結論：靠 github.io 讓「這個站本身」成為穩定 AdSense 變現主體是不可靠的。
2. **ads.txt 位置問題**：AdSense 驗證的 `ads.txt` 必須位於**主機根目錄**，即 `https://babel-lab.github.io/ads.txt`，**不是** `https://babel-lab.github.io/portable-blog-system/ads.txt`。而 `babel-lab.github.io/` 根目錄屬於另一個 user-pages repo（`babel-lab.github.io`），且該根仍在共享 public suffix 上——即使放了 ads.txt 也難繞過母網域限制。**自訂網域可一次解決 ads.txt 位置與擁有權兩個問題。**
3. **「廣告會 render」≠「Google 會 serve / 政策合規」**：既有 slot 模型能載入，是因為 AdSense 帳號已透過 Blogger 核准（account-level）。但把 github.io 當新增網站依賴其長期 serving，仍受上述母網域限制與潛在政策風險。**不建議把 GitHub Pages 站的 AdSense 收益納入任何預期**，直到自訂網域就緒。
4. **主收益不動**：Blogger 原生 AdSense 整合與收益**完全不受本決策影響**；本決策純粹關於「GitHub Pages 站要不要 / 何時要自己的網域與變現主體性」。
5. **不建假檔**：在取得真實 `pub-XXXXXXXXXXXXXXXX` 前，**不建立** `ads.txt`（空 / 假檔造成 crawler error 與政策風險）；在確定 domain 前**不建立** `CNAME`（假字串 break DNS check）。此兩點沿用 `custom-domain-root-files-strategy.md` §3.2 / §3.3。

> ⚠️ 上述 AdSense 行為描述以 2026-07 網路查證（Google AdSense 說明中心 / 社群 + GitHub community discussion）為準；**未於 AdSense 後台實測本站 serving**。正式申請前請以 Google 官方最新條款為準。

---

## §6 日後搬家成本說明（為何「不要太晚」買）

「可搬家」是本專案核心價值。要注意：**在 github.io 上累積的 SEO 權重與外部連結，本身不可搬**——URL 是 `babel-lab.github.io/...`，一旦搬到自訂網域，舊 URL 全變、需 301 導向（GitHub Pages project→custom domain 的自動 301 有限）、重送 sitemap、GSC 重新驗證、等 Google 重新評估，過渡期會有流量與排名折損。

推論：**在「還沒認真做 SEO / 外連還少」時搬家＝折損小；等累積很多才搬＝折損大。** 所以買網域的時機不是「越晚越省錢」，而是「在開始認真累積 SEO 權重的那個點之前 / 同時買」——早於此點是浪費續費，晚於此點是累積搬家債。這正呼應 Dean 的既定判斷：「等 Phase 1 穩定、準備開始累積 SEO 權重時再申請」。

---

## §7 現在不急著買網域的理由（彙整）

1. 當前目標（Phase 1 穩定 / 技術文章發佈 / 測試展示）用 github.io URL 已可達成。
2. 主收益在 Blogger，且與 GitHub Pages 網域無關——沒有「不買就損失收益」的急迫性。
3. GitHub Pages 站尚未進入「認真累積 SEO 權重」階段，此時 github.io 上累積的權重還少，日後搬家折損小。
4. 網域年費是**經常性支出**；在還沒要靠它變現 / 衝 SEO 前買，等於提早計費且無對應收益。
5. 品牌字串（`babel-lab.tw` vs 其他）尚可再想；提早註冊等於提早鎖死。
6. 遷移機制已在 `custom-domain-root-files-strategy.md` 完整預備，隨時可在數小時內啟動，**不存在「不提早買就來不及」的技術風險**。

---

## §8 建議觸發條件 checklist（達成後才建議買網域）

滿足以下**多數**條件時，即為買網域的合適時機（任一單項不必然觸發；整體趨勢達到才動）：

- [ ] BLOG Phase 1 已穩定收尾、無 regression（Phase 1 final 已宣告 ✅；持續穩定觀察）
- [ ] GitHub Pages 站已有**穩定的內容更新節奏**（如每月數篇技術文章），值得投資長期 SEO
- [ ] 已明確想「讓 GitHub Pages 站本身累積 SEO 權重 / 建立獨立品牌」（而非只當 Blogger 附屬）
- [ ] 已想清楚品牌字串（`babel-lab.tw` / 其他）並確認該網域可註冊、字串滿意
- [ ] 有可管理 DNS 的註冊商帳號與權限（可設 A / ALIAS / CNAME records）
- [ ] （若目標含 GitHub Pages 自身變現）已理解 §5 AdSense 母網域限制，並接受「自訂網域是 AdSense 變現的前置條件」
- [ ] 願意承擔網域年費之經常性支出
- [ ] 目前 github.io 上外部連結 / 索引量仍不高（趁搬家折損小時切換）

> 反向紅旗（出現則**更該早點**買）：開始有外部網站連到 github.io URL、開始被搜尋帶量、開始考慮 GitHub Pages 掛 AdSense——這些代表 SEO 權重正在往 github.io 累積，越晚搬折損越大。

---

## §9 買網域前還缺的最小條件（must-have inputs）

| 缺項 | 誰提供 | 觸發之遷移 phase（見 custom-domain-root-files-strategy §4）|
|---|---|---|
| **確定的網域字串**（如 `babel-lab.tw`）| Dean 選定 + 註冊 | custom-domain-prep-1 |
| **DNS 管理權限**（可設 A / ALIAS / CNAME）| Dean（註冊商後台）| custom-domain-prep-4 |
| **apex vs subdomain 決策**（`babel-lab.tw` vs `blog.babel-lab.tw`）| Dean | 影響 DNS 記錄型別 |
| **（僅當要跑 GitHub Pages 自身 AdSense）真實 pub id** | AdSense 通過後取得 | adsense-3 / adsense-4（ads.txt 落地）|
| **GSC 擁有權驗證方式**（DNS TXT / HTML meta）| Dean 選 | custom-domain-gsc-1 |

（Blogger cross-link 的 UTM 更新屬系統決策、不需 Dean 提供值。）

---

## §10 下一步最小 safe slice

**本文件本身即為建議的下一步**（docs-only 決策盤點，零線上變更）。此後保守路徑排序：

1. **（現在）維持現狀**：GitHub Pages URL 續用，Phase 1 繼續 / 保持穩定；**不買網域、不改 DNS、不改 GitHub Pages settings、不建 ads.txt / CNAME**。
2. **（可選 docs-only）** 若 Dean 想更早準備：撰寫「品牌字串候選比較 + .tw 註冊商比價」docs（純調研，不註冊）。
3. **（觸發後才啟動）** 當 §8 條件達成：依 `custom-domain-root-files-strategy.md` §4 逐 phase 執行（每一步各需 Dean explicit approval）：改 `githubSiteUrl` → build 驗證 → 加 CNAME → 設 DNS → 等 TLS → Enforce HTTPS → deploy → GA4/GSC 同步 →（若需）AdSense 申請 + ads.txt。
4. **紅線**：本 session 不執行 1 以外任何項；買網域 / 改 DNS / 改 custom domain / 建 ads.txt / 建 CNAME / 碰 AdSense·GA4·GSC 後台 / deploy，**各須另開 phase + Dean explicit approval**。

---

## §11 Boundaries（本文件之鎖定項）

| 項目 | 狀態 |
|---|---|
| 不買網域 | ✅ |
| 不改 DNS | ✅ |
| 不改 GitHub Pages custom domain / settings | ✅ |
| 不碰 Blogger / AdSense / GA4 / Search Console 後台 | ✅ |
| 不 deploy / 不改 gh-pages | ✅ |
| 不建立 ads.txt / CNAME（含 placeholder / fake）| ✅ |
| 不改 content 文章 / settings / build scripts / src | ✅ |
| 不擴寫 CLAUDE.md | ✅ |
| 僅新增本 docs 檔 | ✅ |

---

## §12 Cross-links

- `docs/custom-domain-root-files-strategy.md`（遷移機制 / 根檔案安全策略 / §4 checklist / §6 缺項）
- `docs/content-platform-routing.md` §5（custom domain migration 影響）
- `docs/20260617-blog-phase1-wrapup-status-map.md`（C 線 GitHub·domain）
- `docs/seo-ga4-adsense.md`（SEO / GA4 / AdSense 規格）
- CLAUDE.md §2.2（GitHub Pages 定位）/ §21（SEO / canonical / primaryPlatform）/ §24（Blogger 發布 URL）

### 查證來源（AdSense / github.io，2026-07）

- Google AdSense 社群：Adsense approval for site and subdomain — https://support.google.com/adsense/thread/180449812/adsense-approval-for-site-and-subdomain?hl=en
- GitHub community discussion：Can I run google ads on my github subdomain website? — https://github.com/orgs/community/discussions/70253
- GitHub community discussion：google AdSense for website hosting on github pages for free — https://github.com/orgs/community/discussions/102988
- 參考教學（社群，非官方）：Configure Google AdSense for GitHub Pages username.github.io sites — https://gibbok.github.io/myvar/github/configure-google-adsense-for-github-pages-usernamegithubio-sites/

> ⚠️ 以上含社群 / 第三方來源；AdSense 條款可能調整。正式申請前以 Google AdSense 官方說明中心 / Google Search Central 最新文件為準。**未查證 AdSense 後台對本站之實際 serving 行為。**

---

（本文件結束）
