# Custom domain / AdSense trigger checklist（docs-only）

- 建立日期：2026-07-10（Asia/Taipei）
- 類型：docs-only **operational trigger checklist**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 目的：把已散落於 `docs/20260708-domain-github-pages-adsense-decision.md` §7–§9、`docs/20260708-adsense-source-evidence-audit.md`、`docs/custom-domain-root-files-strategy.md` §4–§6 之決策 / 觸發條件 / 缺項，整合為單頁 operational checklist；讓 Dean 於未來每個 Session 可**一頁勾選**判斷「現在是否應啟動」，不必再跨 3 份 doc 拼湊。
- 觸發：Phase 1 RC handoff 後之 Candidate E slice（`docs/20260710-phase1-rc-next-readiness-analysis.md` §7 排名 #5 / handoff readout §6 候選 E）。
- 本輪界線（docs-only）：**不**改程式 / **不**新 guard / **不**新 npm script / **不** build / **不** preview / **不** deploy / **不**碰 deploy clone 寫入 / **不**改任何 frontmatter / **不**改任何 sidecar `.publish.json` / **不**動 Blogger backfill 語意（`check:blogger-backfill` 維持 report-only）/ **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / **不**買網域 / **不**設 DNS / **不**建 `CNAME` / **不**建 `ads.txt` / **不**啟用 AdSense / **不**改 AdSense production behavior / **不**碰 Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 / **不**動 `CLAUDE.md` / `MEMORY.md` / `memory/`。
- 本輪允許 mutation：新增本檔（唯一）+ commit + push origin/main。

---

## 0. Boot baseline（本輪已驗）

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `e477a75` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅（read-only 驗證） | `0 / 0` | clean | absent ✅ |

Source HEAD full hash = `e477a75cc10481c456a9a1f4a627c3c9e33ba8c6`；subject `docs(blogger): record backfill write preflight`。前 4 commit：`a9003e8`（`docs(state): record phase1 rc next readiness`）→ `f42ba32`（preview sanity）→ `d73492b`（admin export workflow alignment）→ `4e34d20`（rc handoff readout）→ `1480ede`（Phase 2 next work packet）。

Deploy HEAD full hash = `1170e7e14aaa7f3449999bf92b9c8586719a76b4`（read-only 驗證；本 session 未寫入 deploy clone）。

Readiness checks 本輪已跑（read-only；exit 0）：

| # | 指令 | Exit | 結果 |
| --- | --- | --- | --- |
| C-1 | `npm run check:phase1-readiness` | 0 | validate 0/135/107、npm-script-targets 48/48、adsense-mode-metadata scanned 17 / warnings 0、blogger-backfill scanned 12 / candidates 7 / complete 0 / missing 7 report-only、prepublish 16/16、smoke 8/8 |
| C-2 | `npm run check:phase1-readiness-contract` | 0 | 22/22 PASS（1 parseable + 1 script-present + 6 required + 13 forbidden absent + 1 ordered 6/6） |

判定：baseline 完全一致；readiness 未 drift；backfill guard 維持 report-only；AdSense / domain 相關**無**線上變更。

---

## 1. Current decision（不變之判斷）

**A. 現在不買 custom domain。** 沿用 `docs/20260708-domain-github-pages-adsense-decision.md` §4 Q1 / §7；理由已定案、本 doc 不重寫決策論述、只彙整觸發時機。

**B. GitHub Pages 現有 URL（`https://babel-lab.github.io/portable-blog-system/`）繼續用**，作為 Phase 1 RC 測試 / 展示 / 技術文章發佈面；已可勝任、無阻擋。

**C. AdSense formal application / production serving 亦不在本階段啟動**。既有 slot 模型能載入是因為 AdSense 帳號透過 Blogger account-level approved；**不**代表 GitHub Pages 站已被視為獨立可持續 serving 之網站。

**D. Blogger 主收益完全不動**。Blogger 有原生 AdSense、6 篇 live PASS；`babel-lab.github.io` 是否買網域 / 是否申請 AdSense 皆**不影響** Blogger 流量或收益（`docs/20260708-domain-github-pages-adsense-decision.md` §1 / §5）。

**E. Custom domain gate 與 AdSense gate 屬兩個獨立 gate**、**不可捆綁**（見 §4）。

---

## 2. Why custom domain / AdSense are on hold（recap；docs pointer）

以下理由已於既有 docs 詳述；本 doc 不重寫、僅列 pointer 讓 Session cold-start 一次找齊：

| 面向 | 主要 pointer |
| --- | --- |
| 現在不需買網域 / Phase 1 可續用 github.io URL | `docs/20260708-domain-github-pages-adsense-decision.md` §7 / §4 Q1 / Q2 |
| custom domain 是「認真做 SEO / 品牌」時的正解 | `docs/20260708-domain-github-pages-adsense-decision.md` §3 / §6 |
| custom domain 遷移機制 / 逐 phase checklist | `docs/custom-domain-root-files-strategy.md` §4 |
| custom domain 遷移前之根檔案安全策略 | `docs/custom-domain-root-files-strategy.md` §3（ads.txt / CNAME / robots.txt / sitemap.xml）|
| AdSense 官方來源 / github.io 是否可送審 | `docs/20260708-adsense-source-evidence-audit.md`（github.io 屬 Public Suffix、可獨立送審但正式 serving 仍以後台實測為準）|
| AdSense ads.txt 位置摩擦 | `docs/20260708-domain-github-pages-adsense-decision.md` §5 |
| 主收益站 Blogger 不受影響 | `docs/20260708-domain-github-pages-adsense-decision.md` §1 / §5 |
| Blogger cross-link hostname-only update | `docs/custom-domain-root-files-strategy.md` §4.4（`custom-domain-blogger-redirect-1`）+ `docs/ga4-parameter-naming-registry.md` §4.3 |

---

## 3. GitHub Pages URL vs custom domain distinction

以下三種混淆是本階段常見誤讀，本 doc 明確定義：

| 詞 | 指涉 | 現況 |
| --- | --- | --- |
| **GitHub Pages URL** | `https://babel-lab.github.io/portable-blog-system/`（project site，subpath）| ✅ 目前使用；線上可達；deploy clone 為 `origin/gh-pages` @ `1170e7e` |
| **GitHub Pages settings** | GitHub repo settings → Pages 頁；含 source branch / custom domain / Enforce HTTPS 三項 | 目前 source branch = `gh-pages`；custom domain **空**；Enforce HTTPS 由 GitHub 自動處理 default cert |
| **custom domain** | 未來啟用之自訂網域，例：`babel-lab.tw`（apex）或 `blog.babel-lab.tw`（subdomain）| ❌ 未選、未買、未設；本 session **不動** |

**Key facts**：

1. **GitHub Pages 現有 URL 屬「別人的母網域子路徑」**（`github.io` 屬 Public Suffix List；`babel-lab.github.io` 為個人 subdomain、`portable-blog-system` 為 project site subpath）。可正常送 Google 索引，但 SEO 權重不會累積到「你擁有的 domain」上。
2. **custom domain 並非「加速」GitHub Pages，也不改變其技術限制**（純靜態、100GB/月 soft bandwidth、1GB repo soft 等）；只改變**站點主體性 + ads.txt 位置 + SEO 累積歸屬**（`docs/20260708-domain-github-pages-adsense-decision.md` §3 表格解讀）。
3. **GitHub Pages URL 與 custom domain 之切換 = URL 全變**；一旦累積外部連結 / 索引，切換有一次性 SEO 折損（見 `docs/20260708-domain-github-pages-adsense-decision.md` §6）。此為「不要太晚買」之核心理由。
4. **`CNAME` 檔案不建立、不放 placeholder**（`docs/custom-domain-root-files-strategy.md` §3.3）；假字串會 break DNS check。

---

## 4. Custom domain gate 與 AdSense gate 屬兩個獨立 gate

Dean 於本 session briefing 明列：「AdSense serving / approval / production ad behavior 應與 Phase 1 RC 分開」，並問 custom domain 是否應等 Phase 1 RC 穩定等條件。**兩者為兩個獨立 gate、順序有先後、但獨立可 hold**：

| Gate | Scope | 順序 | 可獨立 hold？ | 現狀 |
| --- | --- | --- | --- | --- |
| **Gate D**（custom domain） | 選 domain + 註冊 + DNS + `CNAME` + Enforce HTTPS + 內部改 `githubSiteUrl` + build/deploy | 先於 Gate A | ✅ 可（domain 買了但不申請 AdSense）| ❌ hold |
| **Gate A**（AdSense formal application + production serving） | 送 AdSense 審核 + 取 pub id + 建 `ads.txt` + 綁 custom domain + serving 觀察 | 後於 Gate D | ✅ 可（永不啟用亦可；Blogger 主收益已足）| ❌ hold |

**為何 Gate A 一般排 Gate D 之後**：AdSense 在 custom domain 上申請、`ads.txt` 放於自訂 domain 根（單一乾淨路徑）、SEO / 品牌主體性歸自己；於 github.io 上申請雖非結構性封死，但 ads.txt 位置摩擦（需另建 user-pages repo）+ SEO 主體性歸他方，長期不划算（`docs/20260708-adsense-source-evidence-audit.md` / `docs/20260708-domain-github-pages-adsense-decision.md` §5）。

**為何仍**「獨立可 hold」：Gate D 完成後 Dean 仍可**選擇不申請 AdSense**（例：純技術站 / 純作品集 / 依賴 Blogger 收益已足）；Gate A 之啟動與否為獨立商業決策、不因 domain 存在而自動啟動。

---

## 5. Custom domain trigger conditions（Gate D）

滿足以下**多數**條件時方適合啟動 Gate D（單項不必然觸發；整體趨勢達到才動）。此表為 `docs/20260708-domain-github-pages-adsense-decision.md` §8 之精簡與整合、加上 §7 「不急」之反向確認：

### 5.1 必要條件（must）

- [ ] **Phase 1 RC 穩定**（本 doc `f42ba32` 起 handoff readout §2 sign-off；`check:phase1-readiness` / `check:phase1-readiness-contract` 於 Session cold-start 仍 exit 0 / 22/22 PASS）
- [ ] **手動 E2E 可重現**（github-site happy-path E2E 已 PASS 2026-07-02；blogger-site draft-preview E2E 2 次 PASS 2026-07-08）
- [ ] **GitHub Pages deploy scope 已清楚**（quarantine list 明確；`github-pages-blog-planning` 仍 hold；`docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`）
- [ ] **內容策略與 SEO 方向已 Dean 明示**（例：「github pages 站要獨立品牌 / 累積技術文 SEO / 未來變現」）
- [ ] **Dean 明確決定要開始累積 SEO 權重**（`docs/20260708-domain-github-pages-adsense-decision.md` §8 / §4 Q3）

### 5.2 輔助條件（strongly recommended）

- [ ] GitHub Pages 站已有**穩定的內容更新節奏**（例：每月數篇技術文；避免買了網域無內容更新）
- [ ] Dean 已想清楚品牌字串（`babel-lab.tw` / `blog.babel-lab.tw` / 其他）
- [ ] Dean 已確認註冊商 / DNS 管理權限（可設 A / ALIAS / CNAME）
- [ ] Dean 願意承擔網域**年續費**之經常性支出
- [ ] 目前 github.io 上外部連結 / 索引量仍**不高**（越早搬折損越小；`docs/20260708-domain-github-pages-adsense-decision.md` §6）

### 5.3 反向紅旗（出現則**更該早點**啟動 Gate D、勿再拖）

- [ ] 開始有**外部網站**連到 github.io URL
- [ ] 開始被搜尋帶量（GSC 有可觀 impression / click；Claude 不登入 GSC 觀察、須 Dean 提供 masked evidence）
- [ ] 開始考慮 GitHub Pages 掛 AdSense（提前解決 §4 之 domain-then-adsense 序）

**判定規則**：§5.1 全 ✅ + §5.2 過半 ✅ + §5.3 不出現紅旗 → Gate D 可啟動；否則 hold。

---

## 6. DNS / GitHub Pages custom domain future checklist（Gate D 啟動後）

**本 session 不動；僅列 pointer**。啟動 Gate D 時逐 phase 執行，**每 phase 各須 Dean explicit approval**：

依 `docs/custom-domain-root-files-strategy.md` §4 之候選 phase：

| Phase 候選 | 動作 | 對應章節 |
| --- | --- | --- |
| `custom-domain-prep-1` | 改 `content/settings/site.config.json` `githubSiteUrl` 為新 domain；`npm run build` 驗證 dist HTML 之 canonical / og:url / JSON-LD url / sitemap `<loc>` / robots Sitemap line 皆帶新 URL | §4.2 |
| `custom-domain-prep-2` | source commit + push origin/main | §4.2 |
| `custom-domain-prep-3` | 手動於 deploy repo gh-pages root 新增 `CNAME` 檔（單行：新 domain）；commit + push origin/gh-pages | §4.3 |
| `custom-domain-prep-4` | DNS provider 設 A records（GitHub Pages IPs）或 CNAME record（指向 `babel-lab.github.io`）| §4.3 |
| `custom-domain-prep-5` | 等 GitHub Pages DNS check 通過 + TLS certificate provisioning（通常 5–30 分鐘）| §4.3 |
| `custom-domain-prep-6` | GitHub Pages settings 勾「Enforce HTTPS」 | §4.3 |
| `custom-domain-prep-7` | Standard deploy（per pm-6 phase B pattern）；複製 dist → deploy repo（**保留 `.nojekyll` + `CNAME`**）| §4.3 |
| `custom-domain-ga4-1` | GA4 後台 → Admin → Data Stream → 編輯 Website URL 為新 domain（measurementId `G-C77SMPF8VD` 不變）| §4.4 |
| `custom-domain-gsc-1` | Google Search Console 新增 custom domain property + verify ownership + submit 新 sitemap | §4.4 |
| `custom-domain-blogger-redirect-1` | Blogger ↔ GitHub cross-link UTM hostname update（**不改 utm convention**）| §4.4 |

**每 phase 之特徵**：`docs/custom-domain-root-files-strategy.md` 已對每 phase 記錄「風險等級 / 依賴 / 缺項」。**Claude 不代 Dean 決策、不自動推進**、**不代 Dean 於 DNS provider 後台操作**。

---

## 7. SEO accumulation trigger（Gate D 之時機邏輯）

當下列判斷成立時，SEO 權重累積之期望**強於**保留 github.io URL 之 $0 成本：

- Dean 想讓 GitHub Pages 站成為**獨立品牌**（非 Blogger 附屬 mirror；獨立品牌 signal 需要自有網域）
- Dean 想讓技術文 / 教學文 之搜尋能導流至**自有網域**（而非導流至他方所有網域下之子路徑）
- Dean 願意投入**內容更新節奏**（無節奏則買網域收益不明）
- Dean 認為「搬家折損」風險已**開始**（外部連結 / 索引量開始累積、GSC 有 impression / click）

**反向邏輯**：若 Dean 之定位為「技術站僅 Blogger 附屬 mirror + 技術筆記半私人」，Gate D 可**永不啟動**、無需自訂網域，Phase 1 RC + GitHub Pages URL 即完整交付；此路徑**合法**、不算「拖延」。

**判定規則**：以上條件與 Dean 之目標分岔決定；Claude 不代 Dean 判斷。

---

## 8. AdSense trigger conditions（Gate A）

Gate A 之啟動**額外**須滿足下列條件（Gate D 完成為前置）：

### 8.1 必要條件（must）

- [ ] **Gate D 已完成**（`docs/custom-domain-root-files-strategy.md` §4.3 之 `custom-domain-prep-3..7` 全 landed；custom domain 已 Enforce HTTPS）
- [ ] **內容策略確認 AdSense 為適合變現方式**（非所有站都適合 AdSense；技術筆記站 CTR 通常較低）
- [ ] **內容量與內容品質達 AdSense 審核期望**（無定量門檻；官方僅列品質 / 政策；`docs/20260708-adsense-source-evidence-audit.md` §5）
- [ ] **隱私權頁 / 聯盟揭露頁已 live**（現況 ✅：`privacy/` / `affiliate-disclosure/` 已 deploy）
- [ ] **Dean explicit approval 啟動 Gate A**（非由 Gate D 完成而自動啟動）

### 8.2 輔助條件（strongly recommended）

- [ ] 內容更新節奏穩定（AdSense 政策要求持續有實質內容）
- [ ] 已理解 AdSense 政策 / 已閱讀最新 Program Policies
- [ ] 已了解 `ads.txt` 為 required 檔案、僅在取得真 pub id 後才建立（`docs/custom-domain-root-files-strategy.md` §3.2 / §4.5 `adsense-4`）
- [ ] 已了解申請通過與 serving 之間有觀察期、CTR / RPM 不穩定
- [ ] 已了解 Blogger AdSense 收益不受本站 AdSense 申請影響（獨立帳號 account-level 已透過 Blogger 通過）

### 8.3 反向紅旗（出現則**不建議**啟動 Gate A、hold 或另尋變現）

- [ ] Google AdSense 政策近期有實質異動、對 project site 或 subpath 站有明顯壓力
- [ ] Dean 無時間處理 AdSense 政策合規 / 定期監控後台
- [ ] Dean 之核心變現策略為 affiliate marketing、AdSense 為 mere overlay（此時 AdSense 收益期望值極低、審核維護成本相對高）

### 8.4 AdSense 啟動後之候選 phase（`docs/custom-domain-root-files-strategy.md` §4.5）

| Phase 候選 | 動作 |
| --- | --- |
| `adsense-1` | AdSense 後台申請；綁定 custom domain |
| `adsense-2` | 等審核通過（通常 1–7 天）|
| `adsense-3` | 通過後取得 pub id（格式 `pub-XXXXXXXXXXXXXXXX`）|
| `adsense-4` | 建立 `public/ads.txt`（真實 pub id；**無 fake / 無 placeholder**）|
| `adsense-5` | （可選）整合 AdSense script + slot HTML 至 GitHub Pages template；source commit + push + deploy |

**Claude 不代 Dean 申請 AdSense、不代 Dean 操作 AdSense 後台、不代填 pub id**。真實 pub id 屬 red-line、僅 `content/settings/ads.config.json` 存放（`CLAUDE.md` §3a Red lines / AdSense / secret）。

---

## 9. What must NOT happen in Phase 1 RC（本階段紅線）

Phase 1 RC 階段（含本 session 及未來 RC handoff session），**不得**發生下列任一項；違反即 abort：

| 項目 | Phase 1 RC 階段是否允許 |
| --- | --- |
| 買 custom domain | ❌ 不允許 |
| 註冊網域 / 選註冊商 / 綁 DNS | ❌ 不允許 |
| 設 DNS records（A / ALIAS / CNAME）| ❌ 不允許 |
| 於 GitHub Pages settings 填 custom domain | ❌ 不允許 |
| 建立 `CNAME` 檔（source repo / deploy repo，含 placeholder）| ❌ 不允許（`docs/custom-domain-root-files-strategy.md` §3.3）|
| 建立 `ads.txt` 檔（source repo / deploy repo，含 placeholder / fake pub id）| ❌ 不允許（`docs/custom-domain-root-files-strategy.md` §3.2 / §5）|
| 申請 AdSense（含新增 site / 綁 domain）| ❌ 不允許 |
| 改 AdSense production script / loader / slot serving 行為 | ❌ 不允許 |
| 於 `content/settings/ads.config.json` 動 real `adsenseClient` / `slot id` | ❌ 不允許（`CLAUDE.md` §3a Red lines）|
| 於 `docs/**` / `src/**` / `views/**` / frontmatter / `.publish.json` / `CLAUDE.md` / `MEMORY.md` / `memory/**` 洩漏真實 AdSense client / slot id | ❌ 永禁（`CLAUDE.md` §3a Red lines）|
| 動 Blogger backfill 語意（`check:blogger-backfill` 維持 report-only / warning-only）| ❌ 不允許動語意 |
| 猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId` | ❌ 永禁（`CLAUDE.md` §3a Red lines）|
| Blogger 後台 / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台任何操作（Claude）| ❌ 永禁（`CLAUDE.md` §3a Red lines / §29）|
| 於本 doc / 未來 docs 洩漏 masked GA4 property id 之未 mask 段 / real AdSense id | ❌ 永禁 |

---

## 10. Required Dean explicit approvals（未來啟動時）

Gate D / Gate A 之啟動**須 Dean 於未來某 Session 主動並明確聲明**。**Claude 不代 Dean 決策、不由 RC handoff 或 next-readiness analysis 之候選排名而自動啟動**。以下為必要之 Dean explicit approval 顆粒度（每 approval 為一獨立 phase）：

| Approval 顆粒度 | 對應 phase |
| --- | --- |
| Dean 明確聲明「啟動 Gate D」+ 提供 domain 字串 + 註冊商 + DNS 管理權限狀態 | 啟動 `custom-domain-prep-*` 系列（`docs/custom-domain-root-files-strategy.md` §4.2–§4.3）|
| Dean 明確聲明「改 `githubSiteUrl` 為新 domain」+ 進行 build 驗證 | `custom-domain-prep-1` + `-2` |
| Dean 明確聲明「push `CNAME` 至 deploy repo gh-pages」 | `custom-domain-prep-3` |
| Dean 於 DNS provider 後台自行設 A / CNAME records | `custom-domain-prep-4`（Dean 手動；Claude 不代操作）|
| Dean 明確聲明「等 GitHub Pages DNS check + TLS provisioning 完成」+ 之後勾 Enforce HTTPS | `custom-domain-prep-5` + `-6`（Dean 手動）|
| Dean 明確聲明「執行 standard deploy 至 custom domain」 | `custom-domain-prep-7` |
| Dean 於 GA4 / GSC 後台自行更新 Data Stream URL / 加 domain property | `custom-domain-ga4-1` / `custom-domain-gsc-1`（Dean 手動）|
| Dean 明確聲明「啟動 Gate A / AdSense formal application」 | `adsense-1..5` 系列（`docs/custom-domain-root-files-strategy.md` §4.5）|
| Dean 於 AdSense 後台申請 site + 取得 pub id | `adsense-1..3`（Dean 手動）|
| Dean 提供 pub id 讓 Claude 建立 `ads.txt` | `adsense-4`（Claude 依 Dean 提供之真值建立、**不猜**、無 placeholder）|
| Dean 明確聲明「AdSense script 整合到 GitHub Pages template」 | `adsense-5` |

**每 approval 皆須為 Session 內之 explicit statement**（例：「請進入 `custom-domain-prep-1`，改 `githubSiteUrl` 為 `babel-lab.tw`」）；**不由候選排名 / 建議路徑 / handoff readout 之預設順序而視為已 approval**。

---

## 11. Recommended future sequence（若 Dean 決定啟動）

以下為建議之推進順序；每 step 各為獨立 phase、各須 Dean explicit approval：

```
Step 1  Dean 確認 §5.1 全 must 條件達成、§5.2 過半 recommended 達成、§5.3 無紅旗
        （若不確定，先開一 docs-only「Gate D readiness audit」slice，Claude 讀 baseline / doc 覆核）

Step 2  Dean 選定 domain 字串 + 註冊商 + 完成註冊（Dean 手動；Claude 不代）

Step 3  Dean 完成 DNS 管理權限確認（Dean 手動）

Step 4  Dean explicit approval → 啟動 custom-domain-prep-1
        （改 githubSiteUrl；build 驗證 dist HTML / sitemap / robots）

Step 5  Dean explicit approval → 啟動 custom-domain-prep-2
        （source commit + push origin/main）

Step 6  Dean explicit approval → 啟動 custom-domain-prep-3
        （加 CNAME 至 deploy repo gh-pages root + push）

Step 7  Dean 於 DNS provider 後台設 A / CNAME records（Dean 手動）

Step 8  等 DNS check + TLS provisioning（Dean 觀察；5–30 分鐘）

Step 9  Dean 於 GitHub Pages settings 勾 Enforce HTTPS（Dean 手動）

Step 10 Dean explicit approval → 啟動 custom-domain-prep-7
        （standard deploy pattern；保留 .nojekyll + CNAME）

Step 11 Dean 於 GA4 後台更新 Data Stream URL（Dean 手動）

Step 12 Dean 於 GSC 後台新增 domain property + 驗證 + submit sitemap（Dean 手動）

Step 13 Dean 決定是否啟動 Gate A（AdSense）
        - 若否：Gate D 完成即穩定，long-term maintain
        - 若是：進 Step 14

Step 14 Dean explicit approval → 啟動 adsense-1
        （AdSense 後台申請 site + 綁 custom domain；Dean 手動）

Step 15 等審核（Dean 觀察；1–7 天）

Step 16 Dean 提供 pub id → 啟動 adsense-4
        （建立 public/ads.txt；真實 pub id；無 placeholder）

Step 17 （可選）Dean explicit approval → 啟動 adsense-5
        （AdSense script / slot 整合）

Step 18 Long-term maintain：GA4 + AdSense 後台觀察；每 phase 之政策合規為 Dean 責任
```

**Claude 不代 Dean 判斷「Step 13 是否啟動 Gate A」之商業決策**；亦不代 Dean 於 DNS / GitHub / GA4 / GSC / AdSense 後台操作。

---

## 12. Non-goals for this session

本 session **明確不做**（cumulative；違反即 abort）：

| 項目 | 狀態 |
| --- | --- |
| 買 custom domain / 註冊網域 / 綁 DNS | ❌ 未做 |
| 於 GitHub Pages settings 填 custom domain | ❌ 未做 |
| 建立 `CNAME` / `ads.txt`（含 placeholder / fake）| ❌ 未做 |
| 啟用 AdSense / 申請 site / 綁 pub id / 動 production ad script | ❌ 未做 |
| 改 `content/settings/site.config.json` `githubSiteUrl` | ❌ 未動 |
| 改 `content/settings/ads.config.json` | ❌ 未動 |
| 改 `src/scripts/build-sitemap.js` / `src/views/tracking/ga4.ejs` / 其他 source | ❌ 未動 |
| 改任何 frontmatter / 任何 `.publish.json` sidecar | ❌ 未動 |
| build / preview / deploy | ❌ 未做 |
| 動 deploy clone / push gh-pages | ❌ 未動（僅 §0 read-only 驗證） |
| 動 `CLAUDE.md` / `MEMORY.md` / `memory/**` | ❌ 未動 |
| 動 Blogger backfill 語意（`check:blogger-backfill` 維持 report-only）| ❌ 未動 |
| 猜 Blogger `publishedUrl` / `bloggerPostId` / `publishedAt` / `bloggerBlogId` | ❌ 未猜 |
| Blogger 後台 / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 | ❌ 未動 |
| Admin write path / Apply / middleware / admin-write-cli / `--apply` / `dryRun:false` | ❌ 未動 |
| Reverse UTM pm-26 deploy | ❌ 未動 |
| Second GitHub Pages deploy / `github-pages-blog-planning` quarantine 解除 | ❌ 未動 |
| Blogger AdSense Batch 2 P2 live repost | ❌ 未動 |
| Phase 1 final 之降級 / 重新封存 | ❌ 未動 |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | ❌ 未做 |

---

## 13. Exit / idle-freeze recommendation

**Recommendation = idle freeze**（保守路徑；`CLAUDE.md` §3a Recommended next paths；`docs/20260710-phase1-rc-handoff-operating-readout.md` §8；`docs/20260710-phase1-rc-next-readiness-analysis.md` §8）。理由：

1. Phase 1 RC baseline 於本 session 已再驗、未 drift；readiness 兩支 guard 皆 exit 0；Gate D / Gate A 之啟動觸發條件（§5.1 / §8.1）尚未由 Dean 主動聲明達成。
2. Gate D / Gate A 之機制、遷移 checklist、缺項、風險已於既有 docs 完整記錄；本 doc 為 operational aggregator、無新技術負債。
3. 目前**無** blocking issues；custom domain / AdSense 皆屬 RC 邊界外之候選、非 Phase 1 RC 交付項。
4. Dean 目前之 baseline decision 為「不現在買、等 Phase 1 RC 穩定 + SEO 累積時機」；此 baseline 於本 session 未變。

**若 Dean 於未來 Session 明確判斷需推進**：依 §11 sequence 執行；每 step 皆須另開獨立 phase + explicit approval + 對照本 doc §5 / §8 之觸發條件 checklist。

**若 Dean 未來 Session 想先 audit「Gate D readiness」**：可開一份 docs-only 「Gate D readiness audit」slice，Claude 讀 baseline / 既有 doc、對 §5.1 / §5.2 / §5.3 逐項覆核；此屬 docs-only、無風險、可獨立於本 doc 之後啟動。

---

## 14. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔（+ 對應 commit + push origin/main）。**不含**任何程式 / frontmatter / settings / sidecar / build / deploy / dev-server 變更；未新增 guard / npm script / preview-only script / write helper；未改 CSS；未改 `CLAUDE.md` / `MEMORY.md` / `memory/`；未觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages；未發布 Blogger；未購買網域 / 未動 DNS / 未碰 AdSense / GA4 / Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`；未猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId`；未從任何 metadata 推導 Blogger internal ID；未新增測試文章 / artifact；未建 `CNAME` / `ads.txt`（含 placeholder / fake）；未動 `content/settings/ads.config.json`（real client / slot id 續留於既有位置、未洩露至任何 docs）。§0 boot baseline 為本 session read-only 驗證；§1–§4 之判斷沿用 `docs/20260708-domain-github-pages-adsense-decision.md` §1 / §4–§7、`docs/20260708-adsense-source-evidence-audit.md`；§5 觸發條件為 `docs/20260708-domain-github-pages-adsense-decision.md` §8 之整合列表；§6 Gate D checklist 為 `docs/custom-domain-root-files-strategy.md` §4 之 pointer 表；§7 SEO accumulation 為 §6 §4.4 之時機說明；§8 AdSense 觸發條件為 `docs/custom-domain-root-files-strategy.md` §4.5 + `docs/20260708-adsense-source-evidence-audit.md` §6 之整合；§9 red-line 為 `CLAUDE.md` §3a Red lines 之提煉；§10 approval 顆粒度為既有 phase 命名之 map；§11 sequence 為 §6 / §8 之組合順序；§12 non-goals 沿用 handoff readout §7 + `CLAUDE.md` §3a Red lines；§13 recommendation 沿用 `CLAUDE.md` §3a Recommended next paths（idle freeze）。

---

## See also

- `docs/20260708-domain-github-pages-adsense-decision.md`（domain / AdSense 決策盤點；本 doc §1 / §2 / §3 / §5 之上位）
- `docs/20260708-adsense-source-evidence-audit.md`（AdSense 官方來源稽核；本 doc §2 / §4 / §8 之上位）
- `docs/custom-domain-root-files-strategy.md`（custom domain 遷移機制 / 根檔案安全策略 / §3 ads.txt CNAME 之 no-placeholder / §4 逐 phase checklist / §6 缺項；本 doc §6 / §8 / §11 之上位）
- `docs/content-platform-routing.md` §5（custom domain migration 影響）
- `docs/seo-ga4-adsense.md`（SEO / GA4 / AdSense 規格）
- `docs/ga4-parameter-naming-registry.md` §4.3（Blogger cross-link UTM hostname update）
- `docs/20260710-phase1-rc-handoff-operating-readout.md`（Phase 1 RC handoff readout；候選 E = 本 doc）
- `docs/20260710-phase1-rc-next-readiness-analysis.md`（Phase 1 RC → next-readiness；§7 排名 #5 = 本 doc）
- `docs/20260710-blogger-admin-export-workflow-alignment.md`（前一份 Blogger workflow docs-only slice）
- `docs/20260710-blogger-preview-sanity-analysis.md`（Blogger preview sanity checklist 40 項）
- `docs/20260710-blogger-backfill-write-phase-preflight.md`（Blogger backfill write phase preflight）
- `docs/20260709-blog-phase2-next-work-packet.md`（Phase 2 next-work packet；候選 A–E）
- `docs/20260708-phase1-stability-closeout-rc-note.md`（Phase 1 stability closeout RC note）
- `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`（`github-pages-blog-planning` quarantine 決策）
- `docs/20260617-blog-phase1-wrapup-status-map.md`（收尾路線圖 C 線 = GitHub·domain）
- `CLAUDE.md` §2.2（GitHub Pages 定位）/ §3a Current state snapshot（含 Red lines / Recommended next paths）/ §21（SEO / canonical / primaryPlatform）/ §24（Blogger 發布 URL）/ §26（package.json 指令）/ §27（Claude Code 修改規則）/ §29（第一版不做）
- `MEMORY.md` + `memory/project_baseline.md`（frozen source / deploy baseline）
- `memory/project_report_only_metadata_guards.md`（8 warning-only guards + release-readiness umbrella）
- `memory/feedback_phase_discipline.md`（memory-sync-only / docs-only / source-only phases 不重疊）

---

（本文件結束 / end of document）
