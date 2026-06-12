# Blogger AdSense — Batch 2 New Low-Risk Post Candidates

Phase: `20260612-pm-10-blogger-batch2-new-low-risk-post-candidates-docs-only-a`

## 0. Status

- **docs-only candidate plan**。只規劃 2–3 篇低風險新文章候選，**不**新增 content post、**不**發文、**不**重貼 Blogger。
- 本 phase **不**改 source / template / EJS / renderer / content production post / settings（含 `categories.json` / `tags.json` / `ads.config.json`）/ guard / fixtures / views / package / lockfile / dist / `.cache`。
- 本 phase **不** deploy、**不** npm install、**不**改 AdSense real id、**不**做 GA4 實作、**不**直接寫 3 篇完整文章。
- 唯一 mutation：本 doc 自身 + `CLAUDE.md` 極小 ledger sync append。
- 依據 = pm-9 Batch 2 preanalysis（`docs/20260612-blogger-adsense-batch-2-preanalysis.md`）§G.1 結論「immediately-eligible existing Batch 2 candidates = 0」+ §G.2 路徑 A（新增 2–3 篇 low-risk life-note post）；並沿用 am-12 expansion plan（`docs/20260612-blogger-adsense-phase-f-batch-1-expansion-plan.md`）§D.1 之 zero-drift category/tag 硬限制。

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律以 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）/ masked（`ca-pub-…****`）表述。real id 僅存於 `content/settings/ads.config.json`。

> ⚠️ **核心紅線：Blogger VIEW count 增加只能視為 weak signal，不可當作真實流量或 AdSense 成效（impression / click / earning）的判斷依據或發文成功指標。**

---

## A. Phase name

`20260612-pm-10-blogger-batch2-new-low-risk-post-candidates-docs-only-a`

---

## B. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `d8b9f4f` |
| origin/main | `d8b9f4f` |
| ahead / behind | 0 / 0 |
| working tree | clean（撰寫前） |
| latest subject | `docs(blogger): preanalyze batch2 adsense rollout`（pm-9） |
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（production-post warnings = 0；94 全來自 `content/validation-fixtures/`） |

Baseline 與本 session 預期一致；不做任何 fix。

### B.1 既有文章狀態（只讀確認，不改 content）

| slug | 角色 | 可否作為 Batch 2 既有候選 |
|---|---|---|
| `we-media-myself2` | Batch 0 lock | ❌ 不再 repost |
| `github-pages-blog-planning` | Batch 0 lock | ❌ 不再 repost |
| `daily-reading-habit-notes` | Batch 1 done（live PASS） | ❌ 已完成 |
| `reading-notes-three-questions` | Batch 1 done（live PASS） | ❌ 已完成 |
| `after-work-writing-time-blocking` | Batch 1 done（live PASS） | ❌ 已完成 |
| `portable-blog-system-mvp` | deferred（summary + noindex-follow + download） | ❌ 政策 / 形態 blocker |
| `sample-book-review` / `draft-book-review` | draft（book metadata 全空 + 佔位 body） | ❌ 內容未完成 |
| `phonics-practice-sheet-download` | draft（download fileUrl 空 + noindex fallback） | ❌ 內容 + 政策 blocker |

→ 與 pm-9 §G.1 一致：**已存在且立即 eligible 之 Batch 2 候選 = 0**。

---

## C. Reason for this phase

- **pm-9 結論**：現有可直接進 Batch 2 的候選文章為 **0** —— 所有 ready/full 既有文章皆已 Batch 0/1 完成；deferred / draft 皆有 blocker。
- **因此不應硬推現有 draft / deferred**：把 `portable-blog-system-mvp`（noindex + summary + download）或 book-review draft（空 metadata + 佔位 body）/ phonics（空 download asset）硬升級成候選，會把 noindex+AdSense 政策爭議、半成品內容、download theme 未驗等風險混進 rollout —— 與保守節奏相違。
- **Batch 2 應先從 2–3 篇新低風險 life-note / practical note 題材開始**（pm-9 §G.2 路徑 A，最乾淨）。
- **本 phase 只做候選規劃**：列出 2–3 篇新文題目方向 + frontmatter 預期 + 風險判斷 + 排名；**不**撰寫完整文章、**不**新增檔案、**不**發文。

---

## D. Candidate principles（新文章候選原則）

1. **低 AdSense policy risk**：避開 Google AdSense / Blogger 內容政策敏感領域。
2. **非醫療建議、非金融承諾、非政治敏感、非誇大 AI**：不得含醫療診斷 / 療效、投資獲利 / 報酬承諾、政治立場煽動、或「AI 必賺 / 秒懂 / 取代」式誇大標題與內容。
3. **可長尾搜尋**：主題具穩定長期搜尋價值（個人知識管理 / 工具心得 / 建站筆記 / 生活觀察），非極短時效快訊。
4. **可提供真實生活觀察或實用整理**：以個人實際經驗 / 流程整理為主，有具體可讀內容。
5. **不為廣告硬塞內容**：文章本身要有閱讀價值；不為了塞廣告而拼湊 / 灌水（content-for-ads 反而是政策風險）。
6. **適合 Blogger manual repost**：generated dist HTML 乾淨、無 EJS leak、可人工貼到 Blogger HTML 模式。
7. **可在文章底部自然出現既有 `articleAd6` slot**：最簡形態（0 affiliate / 0 related-links / 純 body + hashtags），bottom slot 在 hashtags 前自然 fire；只沿用既有 slot policy，不新增 slot。
8. **不依賴 GA4 或 Search Console 才能判斷是否可發**：是否可發布的判準完全在 repo-side（validate / build / dist 結構 / 內容品質），與流量 / 成效數據無關；view count 不是發文門檻也不是成功指標。
9. **zero-settings-drift（沿用 am-12 §D.1）**：為維持 production warnings = 0 且不動 settings，新 Blogger full post 之 category 用 `life-note`、tags 用 `reading-notes` / `self-growth`。⚠️ 若把這幾個題目寫成 `tech-note` 形態，現有 Blogger-valid tech tag 不存在（`github` / `vite` / `static-site` 皆 `site:["github"]` → 觸 `tag-site-mismatch` warning）；故本批一律以 **life-note 生活心得框架**承載「知識管理 / 工具心得 / 建站筆記」題材，**不**寫成深入技術教學。
10. **0 new asset**：cover 重用既有 placeholder（`/images/placeholders/cover-placeholder.svg`），不依賴新圖 / 下載檔。

---

## E. Proposed new post candidates（3 篇）

> 全部 `site:"blogger"` / `contentKind:"life-note"` / `mode:"full"` / indexable（不設 `seo.indexing`）/ 0 commerce / 0 new asset。slug 已對既有 post inventory（§B.1）+ am-12 proposed slug（`how-i-choose-what-to-read-next` / `phone-away-reading-time` / `why-local-markdown-first`）確認**不碰撞**。題目為生活心得框架，非技術教學深水區。

### E.1 候選 1：把部落格當成個人知識倉庫

| 欄位 | 值 |
|---|---|
| proposed title | 我為什麼開始把部落格當成自己的知識倉庫 |
| tentative slug | `blog-as-personal-knowledge-base` |
| target content path（未來，非本 phase 建立） | `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md` |
| category / tags | `life-note` / `self-growth`, `reading-notes` |
| topic angle | 從「寫給別人看」轉成「寫給未來的自己查」——用部落格沉澱讀過 / 想過 / 做過的東西，談個人知識管理的習慣與取捨 |
| target reader | 想長期累積筆記 / 怕學過就忘 / 想整理個人知識的人 |
| why low risk | 純個人經驗心得；0 商業轉換 / 0 affiliate；無醫療 / 投資 / 政治 / 誇大；category·tags 皆 Blogger-valid（0 drift） |
| why useful | 提供可操作的個人知識管理視角（分類 / 何時記 / 怎麼回查），長尾搜尋價值高 |
| why suitable for Blogger / AdSense | 最簡 life-note 形態，bottom `articleAd6` 在 hashtags 前自然 fire；內容完整可讀，非為廣告灌水 |
| policy cautions | 不把「知識管理」寫成生產力課程式承諾（不保證效率倍增）；不嵌任何工具推銷連結 |
| estimated readiness effort | 低（約 800–1000 字，需具體個人例子） |
| recommended priority | **P1（首篇推薦）** |

### E.2 候選 2：AI 工具心得（落地、不誇大）

| 欄位 | 值 |
|---|---|
| proposed title | AI 工具用過一輪後，真正留下來的是把日常流程變簡單的那幾個 |
| tentative slug | `ai-tools-simplify-daily-workflow` |
| target content path（未來，非本 phase 建立） | `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md` |
| category / tags | `life-note` / `self-growth` |
| topic angle | 不做工具評測 / 不吹「AI 取代一切」，而是談「哪些 AI 用法真的讓日常流程變簡單、哪些只是新鮮感」的個人取捨 |
| target reader | 被一堆 AI 工具洗版、想知道「日常到底留哪些」的一般使用者 |
| why low risk | 個人使用心得；0 affiliate / 0 工具推銷；framing 刻意低調不誇大；category·tags Blogger-valid（0 drift） |
| why useful | 幫讀者過濾雜訊、聚焦「讓流程變簡單」而非追新工具，長尾搜尋價值高 |
| why suitable for Blogger / AdSense | 最簡 life-note 形態；bottom slot 自然 fire；內容為真實觀察非湊字數 |
| policy cautions | ⚠️ **標題 / 內容不得誇大 AI**（不寫「秒懂 / 必賺 / 取代人類」）；不點名特定工具做背書或暗示 affiliate；不寫成技術教學深水區；不做效率 / 收入承諾 |
| estimated readiness effort | 低–中（約 800–1000 字；需克制不寫成工具清單推銷） |
| recommended priority | **P2** |

### E.3 候選 3：個人部落格重啟筆記（先穩定再談其他）

| 欄位 | 值 |
|---|---|
| proposed title | 重新經營部落格的筆記：先把節奏穩定下來，其他再說 |
| tentative slug | `blog-restart-steady-rhythm-notes` |
| target content path（未來，非本 phase 建立） | `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md` |
| category / tags | `life-note` / `self-growth` |
| topic angle | 重啟個人部落格時的心態筆記——把「穩定產出 / 可持續的節奏」放在「追流量」之前；談如何不被數字綁架 |
| target reader | 想重新開始寫部落格 / 容易因數字焦慮而中斷的人 |
| why low risk | 個人經營心得；0 商業承諾；**刻意把焦點放在節奏與心態，不承諾流量成長**；category·tags Blogger-valid（0 drift） |
| why useful | 提供可持續寫作的心態框架，長尾且與本系統「不把 view count 當成功指標」之立場一致 |
| why suitable for Blogger / AdSense | 最簡 life-note 形態；bottom slot 自然 fire；內容完整 |
| policy cautions | ⚠️ 標題 / 內容**不得承諾流量成長或變現**（「先求穩定再求流量」是心態，不是成效保證）；不把 Blogger VIEW count 寫成成功 KPI；避免寫成 SEO / 增長 hack 教學 |
| estimated readiness effort | 低（約 700–900 字） |
| recommended priority | **P3** |

---

## F. Ranking table

> 評分為相對判斷（高 / 中 / 低），非量化分數。

| candidate | risk | usefulness | search potential | writing effort | Blogger suitability | recommendation |
|---|---|---|---|---|---|---|
| E.1 知識倉庫（`blog-as-personal-knowledge-base`） | **低** | 高 | 高 | 低 | 高 | **P1 — 首篇推薦** |
| E.2 AI 工具心得（`ai-tools-simplify-daily-workflow`） | 低–中（須克制誇大 AI） | 高 | 高 | 低–中 | 高 | **P2 — 次選**（撰寫時嚴守 policy cautions） |
| E.3 部落格重啟（`blog-restart-steady-rhythm-notes`） | **低** | 中–高 | 中–高 | 低 | 高 | **P3 — 備援第 3 篇** |

**建議 Batch 2 起手 set**：先 P1（知識倉庫）→ 觀察 → 再決定是否續 P2 / P3。若要一次規劃 2–3 篇，順位為 **E.1 → E.2 → E.3**；但**逐篇撰寫、逐篇驗證、逐篇重貼**，不同一 phase 連發。

> ⚠️ 三篇皆為 life-note 生活心得框架（zero-drift 約束所致），雖主題軸不同（知識管理 / 工具心得 / 經營心態），仍同屬「個人成長・生活觀察」家族；若要真正跨領域（技術 / 教具）須另開 settings(tag) phase，本 plan 不為多樣性硬塞 tech-note 造成 drift。

---

## G. What not to do

- ❌ **不要直接大量產文**：一次只規劃 2–3 篇；實際撰寫逐篇獨立 phase，不批量發。
- ❌ **不要用 AI / AdSense / 流量等詞做誇大標題**：標題保持自然、貼近真實內容；不寫「AI 必學 / 流量暴增 / 被動收入」式 clickbait。
- ❌ **不要把 Blogger VIEW count 當成功指標**：view count 是 weak signal，不代表真實流量 / AdSense 成效；不據此決定發文節奏。
- ❌ **不要為了廣告硬拉長文章**：內容長度服從題材；不灌水 / 不重複湊字數來塞更多廣告空間。
- ❌ **不要碰醫療、投資承諾、法律保證類內容**：不寫醫療診斷 / 療效、投資報酬 / 獲利保證、法律保證 / 個案法律建議。
- ❌ **不要在本 phase 撰寫完整文章 / 新增 content 檔 / 發文**。

---

## H. Recommended next phases

- **Conservative（推薦預設）：keep monitoring Batch 1 only** — 維持 baseline，沿用 pm-8 monitoring checklist 觀察 5 篇 live post；view count 變動僅記錄，不擴張。
- **Optional：write full article draft（docs-only）** — `20260612-XX-blogger-batch2-<slug>-article-draft-docs-only-a`：把選定 1 篇（建議 P1 知識倉庫）之完整文章草稿先寫成 docs-only 草稿（不放進 `content/`、不發文），供 user 審閱文字後再決定是否落地。
- **Optional：create content file for 1 selected low-risk post（later phase）** — `20260612-XX-blogger-content-<slug>-one-post-content-a`：經 user explicit approval 後，single new file 落地 1 篇（per am-12 §G/§H acceptance：only one new file / 0 settings drift / validate pass / dist articleAd6=1）。
- **Optional：after validation, create manual Blogger repost packet（docs-only）** — 文章落地並通過 generated-HTML 驗證後，再打包 repost packet（docs-only；不執行重貼）。
- **Not advised：create 3 posts and publish in same phase** — 不在同一 phase 連寫 3 篇 + 發布；違反小批次 / 逐篇驗證紅線。

---

## I. Explicit non-actions（本 session 明確未做）

- ❌ no source change（`src/` 全未動）
- ❌ no template / renderer change（EJS / build 未動）
- ❌ no content production post change（未新增文章檔；既有 post 一律只讀未動）
- ❌ no Blogger publish / repost / 登入後台 / 開編輯器 / 開 AdSense 後台
- ❌ no AdSense ID change / hardcode（real id 仍只存 `ads.config.json`）
- ❌ no GA4 implementation
- ❌ no deploy / no push gh-pages / no `.cache` mutation
- ❌ no npm install / no package / lockfile change
- ❌ no settings change（`categories.json` / `tags.json` / `ads.config.json` 未動）
- ❌ no guard change（`check-blogger-adsense-output.js` 未動）
- ❌ 不直接寫 3 篇完整文章（只規劃題目方向 + frontmatter 預期）
- ❌ no CLAUDE.md compression / 無重排 / 無 unrelated 內容變動
- ❌ no `/memory`
- ❌ no unrelated cleanup
- ❌ **未把 Blogger VIEW count 增加判定為真實流量或 AdSense 成效**

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 pm-10（20260612）極小 ledger sync append。

read-only 量測（未造成 mutation）：`validate:content` 0/94/84。其餘 AdSense guard（`check:blogger-adsense-output` 71/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0）因 source / settings / dist 無變更而 carry forward。

---

## J. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）、`ca-pub-…****`（masked）；**不含**完整 real AdSense client id / slot id。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
