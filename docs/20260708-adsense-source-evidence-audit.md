# AdSense / github.io / 自訂網域決策：官方來源稽核（official-source audit）

- 日期：2026-07-08（Asia/Taipei）
- 類型：**docs-only official-source audit**（read-only；不買網域、不改 DNS / GitHub Pages settings / Blogger / AdSense / GA4 / GSC 後台、不 deploy、不改 gh-pages、不改 content / src / settings、不擴寫 CLAUDE.md）
- 稽核對象：`docs/20260708-domain-github-pages-adsense-decision.md`（上一 commit `677fcde` 產出之決策盤點）
- 目的：分辨該決策文件中關於「GitHub Pages URL / 自訂網域 / AdSense / ads.txt / SEO 搬家風險」的判斷，**哪些有 Google / GitHub 官方文件直接支持**、**哪些只能視為 community / forum 推論**，並指出決策文件是否需要修正。

> ⚠️ 本稽核以 2026-07-08 網路查證之官方文件為準；**未於 AdSense / GSC 後台實測本站行為**。AdSense / Search Central 條款可能調整，正式申請前仍須以當時官方最新條款覆核（見 §6）。

---

## §0 Boot verification snapshot（本 session 起始，read-only）

| Repo | Branch | HEAD | 對照 remote | ahead/behind | working tree | index.lock |
|---|---|---|---|---|---|---|
| source（`portable-blog-system`）| `main` | `677fcde` | == `origin/main` | 0 / 0 | clean | 無 |
| deploy（`portable-blog-deploy`）| `gh-pages` | `1170e7e` | == `origin/gh-pages` | 0 / 0 | clean | 無 |

兩端與 frozen baseline 一致；除本 audit docs 檔外未改任何檔。

---

## §1 稽核方法與來源分層

分三級標記每項結論的證據強度：

- **🟢 OFFICIAL**：有 Google（AdSense Help / Search Central / Search Console Help）或 GitHub Docs 官方頁面直接支持，可作最終依據。
- **🟡 INFERENCE / BEST-PRACTICE**：方向合理、由官方事實推得，但**無單一官方句子直接背書**；可用但須標示為推論。
- **🔴 COMMUNITY-ONLY**：僅來自 support 社群 thread / GitHub discussions / 第三方教學 / forum；**不得當最終依據**。

本稽核實查之官方頁面清單見 §8。

---

## §2 逐項稽核（claim-by-claim）

| # | 決策文件之判斷（出處） | 稽核結論 | 官方依據 |
|---|---|---|---|
| 1 | ads.txt 必須位於**主機根目錄**（`.../ads.txt`），**不是** project subpath（`/portable-blog-system/ads.txt`）（§5.2）| 🟢 **OFFICIAL·正確** | AdSense「Set up ads.txt」（7532444）：*"Upload your ads.txt file to the root directory of your site. The root directory of a site is the directory or folder following the top level domain, e.g., example.com/ads.txt."* |
| 2 | AdSense 對子網域改採「沿用母網域核准狀態」、不再逐一審核（§5.1 前半）| 🟢 **OFFICIAL·正確（但被誤用，見 #3）** | AdSense「Site management is changing」（12170421）：一般子網域之管理被上收至 domain 層、*"You'll no longer be able to add or manage subdomains that are part of an existing site."* |
| 3 | 因 github.io 是共享母網域、**你無法讓 github.io 通過審核**，故 github.io **不是可靠 AdSense 變現面**（§1.3 / §5.1 後半）| 🔴→**需修正**：官方事實**恰好相反** | 見 §3（本文件核心發現）|
| 4 | ads.txt 需放的 `babel-lab.github.io/` 根目錄屬於**另一個 user-pages repo**；即使放檔也難繞過母網域限制（§5.2）| 🟡 **部分正確 + 部分過度**：根目錄歸屬正確；「難繞過」過度（見 §3）| GitHub Pages user/org site = `<user>.github.io` repo（官方）；ads.txt 位置限制（7532444）|
| 5 | AdSense 審核常要求**隱私權政策頁**；本站已備 `privacy/`（§2.3）| 🟢 **OFFICIAL·正確** | AdSense Program policies / Required content：發布商須有揭露第三方（含 Google）cookie 使用之隱私權政策 |
| 6 | 取得真實 `pub-XXXX` 前**不建立** ads.txt（空 / 假檔造成 crawler error 與政策風險）（§2.3 / §5.5）| 🟡 **INFERENCE·合理但非官方明文** | 官方僅規定 ads.txt 內容格式與位置；「空檔造成 crawler error」屬營運推論，非官方句子。**結論方向可採**，但不宜標為官方規定 |
| 7 | 自訂網域 apex 需 A / ALIAS / ANAME records、subdomain 需 CNAME；需等 TLS provisioning 並勾 Enforce HTTPS（§3 / §9）| 🟢 **OFFICIAL·正確** | GitHub Pages「Managing a custom domain」：apex 用 A（185.199.108–111.153）+ AAAA，或 ALIAS/ANAME 指向預設網域；subdomain 用 CNAME 指向 `<user>.github.io`；設定後 *"can take up to 24 hours"* 才可勾 Enforce HTTPS |
| 8 | 設 custom domain 會在 repo 根產生 `CNAME` 檔；未確定 domain 前不建假 CNAME（§2.3 / §5.5）| 🟢 **OFFICIAL（機制）+ 🟡（不建假檔屬營運判斷）** | GitHub Pages：儲存 custom domain 會 commit `CNAME` 至 source branch 根；假字串會使 DNS check 失敗屬合理推論 |
| 9 | 搬家（github.io → 自訂網域）需 301、重送 sitemap、GSC 重驗、有過渡期流量 / 權重折損（§6）| 🟢 **OFFICIAL·正確** | Search Central「Site moves with URL changes」：用 301/308 永久轉址、*"Keep the redirects ... generally at least 1 year"*、*"a medium-sized website can take a few weeks for most pages to move in our index"*；Change of Address 用於**換 domain**（非同域 subpath / 協定變更）|
| 10 | GitHub Pages 為純靜態、有 100GB/月 soft bandwidth、1GB repo soft、project site 為 subpath（§3）| 🟢 **OFFICIAL（GitHub Pages usage limits 文件；本輪未逐一重抓，屬已知官方數值）** | GitHub Pages「Usage limits」（既有官方文件）|
| 11 | 主收益站是 Blogger、且與 GitHub Pages 是否買網域**互不相干**（§1.2 / §4 / §5.4）| 🟢 **正確（專案事實，非 Google 文件命題）** | Blogger 帳號 account-level 已 approved（專案 CLAUDE.md 記錄）；AdSense 帳號核准為 account-level，與另一站是否買網域無關 |
| 12 | 買網域時機 = 「準備認真累積 SEO 權重 / 認真變現」之前 / 同時，太早浪費續費、太晚累積搬家債（§4 / §6 / §7）| 🟢 **時機邏輯 sound（由 #9 官方遷移成本支撐）** | Search Central 遷移成本（#9）證實「已累積後再搬」有真實過渡折損 → 時機論成立 |

---

## §3 核心發現：§5.1 的 github.io / AdSense 因果**有明確錯誤**

### 3.1 決策文件的說法

`docs/20260708-domain-github-pages-adsense-decision.md` §1 點 3 與 §5.1 主張：

> 「AdSense 以母網域狀態判定子網域，`github.io` 是共享 public suffix，你**無法讓母網域 approved**、也無法在母網域根放驗證檔……靠 github.io 讓『這個站本身』成為穩定 AdSense 變現主體是不可靠的。」

### 3.2 官方事實（與上述因果相反）

1. **官方 AdSense 明列「可新增的站台類型」包含 public-suffix 平台上的子網域。** AdSense「Site management is changing」（12170421）明文，日後可加入的站台為：
   - *"Domains (e.g., website.com)"*
   - *"Subdomains on platforms that are already part of the public suffix list (e.g., **site.appspot.com**)"*
   - *"Sites that are managed by AdSense platform partners (e.g., site.blogspot.com)"*

2. **`github.io` 正是 Public Suffix List 的條目（PRIVATE section，由 GitHub 提交）。** 其加入 PSL 的**目的就是**讓 `example-a.github.io` 與 `example-b.github.io` **被視為彼此獨立的站台**（避免 `*.github.io` 共用 cookie / wildcard cert）。

3. 由 1 + 2 直接推得：**`babel-lab.github.io` 在 AdSense 眼中並非「繼承 github.io 母網域核准狀態的普通子網域」，而是落在「public-suffix 平台子網域」這個可獨立新增 / 審核的站台類別**——與 `site.appspot.com` 同類。也就是說，**`babel-lab.github.io` 是可以被當作獨立站台送 AdSense 的**。

因此決策文件「因母網域是 github.io 而**結構性無法通過**」的因果鏈是**錯的**：PSL 身分不是障礙，恰恰是讓 github.io 子站被視為獨立站台的機制。

### 3.3 但「買自訂網域」的結論**仍可成立**（只是理由要換）

錯的是**理由（mechanism）**，不是**最終建議**。github.io 專案站作為長期 AdSense 變現面仍有以下**真實摩擦**，足以支撐「認真變現時改自訂網域」：

- **ads.txt 位置摩擦（真實、官方支撐）**：ads.txt 必須在**站台根目錄**。對 AdSense 而言此站台 = `babel-lab.github.io`，故 ads.txt 要在 `https://babel-lab.github.io/ads.txt`——那是 **user-pages repo（`babel-lab.github.io`）的根**，**不是**本專案的 `/portable-blog-system/` subpath。Dean 雖可自建該 user repo 放檔（**屬摩擦、非不可能**，決策文件「難繞過」一語**過度**），但等於要多維護一個 repo 且把變現面綁在 `babel-lab.github.io/` 而非專案 subpath。
- **審核結果不確定（community-only、不能當保證）**：官方允許「送審」不等於「保證通過」；小型 / 新 github.io 站能否通過內容審核，無官方保證，社群經驗分歧——**兩個方向都不能當最終依據**。
- **SEO 主體性 / 品牌 / 搬家成本（官方支撐，見 §2 #9）**：權重累積在別人的 `github.io` 上，日後搬自訂網域有真實過渡折損。

→ **淨結論**：決策文件的**時機建議（Phase 1 穩定後再買）維持正確**，但 §1 點 3 / §5.1 的**因果敘述須修正**為：「github.io 子站在 AdSense 屬可獨立送審的 public-suffix 站台；不建議依賴它變現的真正理由是 **ads.txt-at-root 摩擦 + 審核不確定 + 不擁有 SEO / 品牌主體性**，而非『結構性無法核准』。」

---

## §4 只來自 community / forum、不能當最終依據的部分

決策文件 §12 引用之來源多屬此級，稽核時**不得**用來下「不能 / 一定不行」的斷言：

- AdSense support **社群 thread**（`support.google.com/adsense/thread/...`）：使用者問答，非官方政策頁。
- GitHub **community discussions**（`github.com/orgs/community/discussions/...`）：使用者討論。
- 第三方教學（`gibbok.github.io/...`）：個人 blog，明確非官方。

這些可作「背景 / 他人經驗」，但**凡涉及「github.io 能不能跑 AdSense」的結論，一律以 §8 官方頁面覆核**。實際上，正因決策文件把「github.io 不可變現」建立在社群語氣上，才產生了 §3 的因果誤述——**這正是「social/forum 不能當最終依據」的實例教訓**。

另外 §2 #6 的「空 / 假 ads.txt 造成 crawler error」屬**營運推論**（🟡），非官方明文；可續採其**保守操作**（真 pub id 前不建檔），但敘述時不宜標為「官方規定」。

---

## §5 上一份決策文件是否需要修正？→ **需要（局部、非全篇）**

**需修正（明確錯誤）：**

1. **§1 TL;DR 第 3 點**與 **§5.1**：把「母網域判定 → 無法核准 github.io → 不可靠變現面」改為 §3.3 的正確因果（PSL 子站可獨立送審；真正障礙是 ads.txt-at-root 摩擦 + 審核不確定 + SEO/品牌主體性）。
2. **§3 比較表「AdSense 審核風險」列（選項 A）**：「🔴 高風險 / 不可靠：AdSense 以母網域狀態判定子網域……你無法讓母網域 approved」——同上修正；risk 仍偏高，但根因換成「ads.txt 位置 / 審核不確定 / 非自有主體」。
3. **§5.2**：保留「ads.txt 必須在站台根、非 subpath」（正確），但把「即使放了 ads.txt 也難繞過母網域限制」語氣下修為「可自建 user-pages repo 放檔，屬營運摩擦而非結構性封死」。

**無須修正（官方支撐、維持）：**

- ads.txt root-directory 規則（§5.2 前半）、GitHub Pages DNS / HTTPS 機制（§3 / §9）、搬家 301 / 過渡折損 / 「不要太晚買」（§6）、隱私權頁需求（§2.3）、主收益在 Blogger 不受影響（§1.2）、時機邏輯與 §8 觸發 checklist / §9 缺項、§10 保守下一步、§11 boundaries。

**本 audit 的落地選擇（保守）：** 依 session 規則「最多新增一份 docs 檔、不重寫既有決策文件」，本輪**只新增本稽核檔、不直接改動決策文件**，將上述 3 項修正列為**建議之獨立後續 slice**，待 Dean explicit approval 再套用（可只改決策文件 §1/§3/§5 三處、diff 僅限該檔）。此舉最可逆，且把「明確錯誤」白紙黑字留痕，不在未授權下改寫既有決策記錄。

---

## §6 「正式申請 AdSense 前」需再次人工確認的清單

（每項在**申請當下**重查，政策可能已變；Claude 未登入任何後台）

- [ ] 重讀官方 AdSense「Eligibility requirements」（9724）＋「Site management is changing」（12170421），確認 public-suffix 子站規則與可新增站台類別未變。
- [ ] 明確「這次要變現哪個面」：Blogger（已核准、不受本決策影響）vs GitHub Pages 站。若只靠 Blogger，GitHub 站的 AdSense 理由即弱。
- [ ] 若含 GitHub Pages 站：先決定變現 surface＝**自訂網域（建議）** 或 `babel-lab.github.io` 站；並確認 ads.txt 要放在**該 surface 的根**（自訂網域根，或 `babel-lab.github.io/ads.txt`＝另建 user-pages repo；**絕非** `/portable-blog-system/` subpath）。
- [ ] 先取得核准帳號的真實 `pub-XXXXXXXXXXXXXXXX`，**之後**才建立 ads.txt（真值只存 `ads.config.json`，不外流 docs；red line）。
- [ ] 確認隱私權頁（已有 `privacy/`）措辭符合 AdSense 對「揭露第三方 / Google cookie」的要求。
- [ ] 確認內容量 / 原創性 / 品質達 AdSense 內容要求（官方允許送審 ≠ 保證通過）。
- [ ] 遵守 program policy：不自點、不灌 impression / click。
- [ ] 在瀏覽器實開 `<site-root>/ads.txt` 確認可讀，再依賴它。
- [ ] 若走自訂網域：先完成 DNS（apex A+AAAA 或 ALIAS；subdomain CNAME）→ 等 TLS → 勾 Enforce HTTPS →**才**申請 / 放 ads.txt（順序沿用決策文件 §10 與 `custom-domain-root-files-strategy.md` §4）。

---

## §7 對 Dean 的最終建議

**維持「Phase 1 穩定後再買網域」的決策——不變。** 理由（官方或專案事實支撐）：

1. 目前無「GitHub Pages 站自身變現」的急迫性；主收益在 Blogger，account-level 已核准、與此決策無關。
2. 搬家有真實過渡成本（§2 #9，Search Central 官方）：在「還沒認真累積 SEO」時買 / 搬折損小，此點正支持「Phase 1 穩定、要開始衝 SEO 時再買」。
3. 遷移機制已在 `custom-domain-root-files-strategy.md` 備妥，隨時可數小時內啟動，無「不提早買就來不及」的技術風險。

**唯一要 Dean 知道的更正**：先前「github.io **結構性**無法通過 AdSense」的說法**不準確**——官方其實把 `babel-lab.github.io` 視為可獨立送審的 public-suffix 站台。改自訂網域的真正好處是**除去 ads.txt-at-root 摩擦、審核不確定、以及讓 SEO / 品牌主體性歸自己**，而不是「github.io 不可能過審」。此更正**不改變**「現在先不買、Phase 1 穩定後再買」的結論，只是讓未來決策不建立在錯誤前提上。

**建議下一步（保守、皆 docs-only / Dean-gated）：**
1. （可選）授權我以獨立 slice 套用 §5 的三處決策文件更正（diff 僅限該檔）。
2. 其餘一切（買網域 / 改 DNS / custom domain / 建 ads.txt / CNAME / 碰 AdSense·GA4·GSC / deploy）維持紅線，各須另開 phase + explicit approval。

---

## §8 稽核所用官方來源（🟢 可作最終依據）

- Google AdSense —「Site management is changing in AdSense」：https://support.google.com/adsense/answer/12170421（可新增站台類別含 public-suffix 平台子網域，如 `site.appspot.com`；一般子網域上收 domain 層）
- Google AdSense —「Set up ads.txt」：https://support.google.com/adsense/answer/7532444（ads.txt 必置站台**根目錄** `example.com/ads.txt`）
- Google AdSense —「Check the status of your AdSense sites」：https://support.google.com/adsense/answer/12170222（ads.txt 狀態：Authorized / Not found / Unauthorized / Not applicable）
- Google AdSense —「AdSense Program policies」/「Required content」/「Eligibility requirements」：https://support.google.com/adsense/answer/48182 · https://support.google.com/adsense/answer/1348695 · https://support.google.com/adsense/answer/9724（須有揭露第三方 cookie 之隱私權政策；內容 / 資格要求）
- Google Search Central —「Site moves with URL changes」：https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes（301/308；redirects「generally at least 1 year」；中型站數週重索引）
- Google Search Console Help —「Change of Address tool」：https://support.google.com/webmasters/answer/9370220（用於**換 domain**；維持 redirect 至少 180 天）
- GitHub Docs —「Managing a custom domain for your GitHub Pages site」：https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site（apex A `185.199.108–111.153` + AAAA / ALIAS-ANAME；subdomain CNAME → `<user>.github.io`；`CNAME` 檔；Enforce HTTPS「up to 24 hours」）
- Public Suffix List — GitHub 之 `github.io` 屬 PRIVATE section（由 GitHub 提交，使各 `*.github.io` 被視為獨立站台）：https://publicsuffix.org/list/ · https://en.wikipedia.org/wiki/Public_Suffix_List

### 🔴 決策文件所引之 community / 第三方來源（**不得當最終依據**）

- AdSense 社群 thread 180449812；GitHub community discussions 70253 / 102988；gibbok.github.io 教學。→ 僅背景 / 他人經驗；凡「github.io 能否變現」以上方官方頁覆核。

---

## §9 Boundaries（本文件之鎖定項）

| 項目 | 狀態 |
|---|---|
| 僅新增本 audit docs 檔（不改決策文件 / 不改他檔）| ✅ |
| 不買網域 / 不改 DNS / 不改 custom domain / settings | ✅ |
| 不碰 Blogger / AdSense / GA4 / Search Console 後台 | ✅ |
| 不 deploy / 不改 gh-pages / deploy clone | ✅ |
| 不建立 ads.txt / CNAME（含 placeholder / fake）| ✅ |
| 不改 content / src / settings / build scripts | ✅ |
| 不擴寫 CLAUDE.md | ✅ |
| 不 push（除非 Dean 明確授權）| ✅ |

---

（本文件結束）
