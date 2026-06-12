# Blogger AdSense — Six Live Posts Monitoring Record

Phase: `20260612-pm-19-blogger-adsense-six-live-posts-monitoring-record-docs-only-a`

## 0. Status

- **docs-only monitoring record**。接續 pm-18（guard coverage 6/6）後，建立一份 AdSense / policy / live-post monitoring record，盤點目前 6 篇 live post 之 verified state，並列出後續人工觀察清單與判讀紅線。
- 本 phase **不**改 source / template / EJS / renderer / settings（含 `ads.config.json`）/ content post；**不**新增 guard coverage；**不** publish / repost / deploy / npm install。
- 唯一 mutation：本 doc 自身（+ 若 CLAUDE.md ledger 慣例要求則做最小 append）。
- 依據 = pm-17 manual repost completion record + pm-18 guard coverage record + pm-7 Batch 1 completion record + pm-8 Batch 1 post-rollout monitoring checklist + user 於本 session 提供之 checkpoint。

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律以 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）/ masked（`ca-pub-…****`）表述。real id 僅存於 `content/settings/ads.config.json`。

> ⚠️ 「live verified / PASS」一律指 **human operator 於 Blogger 前台 + DevTools 完成之手動觀察（單一 time-point）**；repo-side guard 通過 **不等於** live 持續成效。

> ⚠️ **核心紅線：Blogger VIEW count 增加只能視為 weak signal，不可當作真實流量或 AdSense 成效（impression / click / earning / policy approval）依據。**

---

## A. Phase name

`20260612-pm-19-blogger-adsense-six-live-posts-monitoring-record-docs-only-a`

---

## B. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `0c9f48b` |
| origin/main | `0c9f48b` |
| ahead / behind | 0 / 0 |
| working tree | clean（record 撰寫前） |
| latest subject | `test(blogger): cover knowledge-base ad slot`（pm-18 guard coverage） |
| 觀察時間 | `20260612 16:38` |

Baseline 與 user 期望一致（branch=main、HEAD==origin/main==`0c9f48b`、working tree clean）；不做任何 fix。

---

## C. Current verified state

| 項目 | 值 |
|---|---|
| live-verified inventory | **6 posts** |
| automated guard coverage | **6 posts**（live inventory 與 guard coverage 對齊） |
| `check:blogger-adsense-output`（carry-forward） | **85 passed / 0 failed**（1 settings invariant + 14 case × 6 target） |
| `validate:content`（carry-forward） | **0 errors / 94 warnings / 84 posts**（production-post warnings = 0；94 全來自 `content/validation-fixtures/`） |
| `check:adsense-resolver`（carry-forward） | 34 / 0 |
| `check:adsense-article-block`（carry-forward） | 13 / 0 |
| `check:adsense-anchor-wiring`（carry-forward） | 14 / 0 |
| 最新 live P1 URL | `https://babel-lab.blogspot.com/2026/06/blog-as-personal-knowledge-base.html` |
| 最新 live P1 ad observation | `articleAd6` observed with `data-ad-status="filled"`（pm-17，`20260612 16:09`） |
| Blogger VIEW count | **remains weak signal only**（不可當真實流量 / AdSense 成效） |

### C.1 Live-verified + guard-covered inventory（6 篇）

| # | slug | form | live PASS | guard-covered |
|---|---|---|---|---|
| 1 | `we-media-myself2` | 複雜（affiliate + related-links） | ✅ | ✅ |
| 2 | `github-pages-blog-planning` | tech-note 簡形態 | ✅ | ✅ |
| 3 | `daily-reading-habit-notes` | life-note 最簡 | ✅ | ✅ |
| 4 | `reading-notes-three-questions` | life-note 最簡 | ✅ | ✅ |
| 5 | `after-work-writing-time-blocking` | life-note 最簡 | ✅ | ✅ |
| 6 | `blog-as-personal-knowledge-base` | life-note 最簡 | ✅（pm-17，20260612 16:09） | ✅（pm-18） |

→ **6 篇 live PASS；guard 涵蓋 6 篇**。涵蓋形態：complex affiliate / related-links（we-media-myself2）、tech-note（github-pages-blog-planning）、low-risk life-note minimal（其餘 4 篇）。**尚未涵蓋**：download / page / comic / noindex / commerce-heavy form。

### C.2 Six live post URLs（known）

| slug | Blogger URL |
|---|---|
| `we-media-myself2` | `https://babel-lab.blogspot.com/2026/05/we-media-myself2.html` |
| `github-pages-blog-planning` | （second-post，full repost；front-end live PASS night-1） |
| `daily-reading-habit-notes` | `https://babel-lab.blogspot.com/2026/06/daily-reading-habit-notes.html` |
| `reading-notes-three-questions` | `https://babel-lab.blogspot.com/2026/06/reading-notes-three-questions.html` |
| `after-work-writing-time-blocking` | `https://babel-lab.blogspot.com/2026/06/after-work-writing-time-blocking.html` |
| `blog-as-personal-knowledge-base` | `https://babel-lab.blogspot.com/2026/06/blog-as-personal-knowledge-base.html` |

---

## D. Six-post monitoring checklist（每篇 live post 需要人工觀察）

> 全部為 **read-only 人工觀察**；不改任何檔案 / 設定 / 後台 ad code。逐篇對 §C.1 之 6 篇執行。

對每篇 live post：

- [ ] **URL opens** — 前台文章可正常開啟。
- [ ] **title / body complete** — 標題 / 正文完整顯示（full，非 summary 卡片）。
- [ ] **formatting OK** — 版面正常、無破版。
- [ ] **no visible EJS leak** — 無可見 `<%` / `%>` / `await include` / template leak。
- [ ] **no broken markdown** — 無殘缺 / 未轉換之 markdown 語法。
- [ ] **bottom `articleAd6` slot present near bottom** — DevTools 見 `ins.adsbygoogle` / `lab-ad-slot--articleAd6`，位於正文之後、hashtags / related-links 之前。
- [ ] **`articleAd1`–`articleAd5` absent** — 無額外 / 誤出現的 article slot。
- [ ] **no duplicate body** — 無重複貼上之正文 / 重複 ad slot。
- [ ] **no unexpected commerce box** — 無預期外之 affiliate / commerce box（life-note 篇應為 0；we-media-myself2 之 affiliate box 屬預期內，不視為異常）。
- [ ] **mobile view acceptable** — 手機版可接受、版面不破。
- [ ] **`data-ad-status` observation** — `filled` / `unfilled` **兩者都分別記錄**；`unfilled` **不**立即視為失敗（見 §F）。
- [ ] **view count movement** — **僅記錄**，**不**解讀為真實流量 / AdSense 成效（見 §F）。

異常時：發現 sanitizer strip / 破版 / duplicate slot / policy notice / articleAd1–5 誤出現 → **停止擴張**，記錄於新 docs，不在 monitoring phase 內改 source / template / settings（見 §G）。

---

## E. AdSense dashboard / policy monitoring checklist（之後人工登入 AdSense 後要看）

> 須 human 另行登入 AdSense 後台觀察；本 phase **不**登入、**不**操作後台，僅列清單。

- [ ] **Policy center / policy warning** — 是否有任何政策通知 / 警告（policy issue）。
- [ ] **Ads.txt / site status** — 站台狀態是否正常（site ready / needs attention）。
- [ ] **Payment / earning data availability** — 收益資料是否已開始出現（早期可能尚無 / 延遲）。
- [ ] **Abnormal click / invalid traffic warning** — 是否有異常點擊 / 無效流量警告。
- [ ] **Ad serving limited warning** — 是否出現「廣告放送已受限」之警告。
- [ ] **Page-level or site-level issue** — 是否有頁面層級 / 站台層級問題標記。
- [ ] **Timing caveat** — AdSense dashboard 數據可能延遲；**不要**對當日 zero data 過度反應（同日無數據屬常見，非異常）。

---

## F. Interpretation rules（判讀規則）

- `data-ad-status="filled"` = **positive live rendering signal only**（表示該次載入有實際廣告填充）；**不**代表 earning / impression 計數 / policy approval。
- `data-ad-status="unfilled"` **can be normal**，特別是**早期或低流量**時（競價無填、版位剛上線）；**不**立即視為失敗。
- **Blogger VIEW count increase ≠ real visitor count**（含 bot / crawler / self-traffic / 平台統計雜訊與延遲）。
- **Blogger VIEW count increase ≠ AdSense impression**（兩者口徑不同；view 偏寬鬆）。
- **Blogger VIEW count increase ≠ long-term policy approval / 收益保證**。
- **one good post does not justify mass publish** — 單篇 live PASS / filled 不構成大量發文或全量 rollout 的理由。
- 正確態度：所有單一前台訊號（filled / view count）皆為 **待交叉比對的訊號**，需 GA4 / Search Console / AdSense 後台多來源比對後才可能下結論；目前維持 monitoring，不擴張。

---

## G. STOP / hold conditions（遇到以下狀況要停止擴張）

- 🛑 **AdSense policy warning appears** — 出現任何政策警告 / 政策中心通知。
- 🛑 **invalid traffic / ad serving limited warning appears** — 出現無效流量 / 廣告放送受限警告。
- 🛑 **multiple posts suddenly lose ad rendering** — 多篇文章突然不再 render 廣告。
- 🛑 **Blogger sanitizer strips ad code** — Blogger 編輯器 / theme 開始 strip `data-ad-client` / `data-ad-slot` / adsbygoogle script。
- 🛑 **layout break / duplicate slot appear** — 出現破版 / 重複 ad slot。
- 🛑 **`articleAd1`–`articleAd5` appear on Blogger posts** — Blogger 文章誤出現非 bottom 之 article slot。
- 🛑 **template / source drift is detected** — 偵測到 template / source 漂移（guard 失敗 / 產物結構改變）。
- 🛑 **operator cannot distinguish generated hashtags from backend labels** — operator 無法區分 generated body hashtags 與 Blogger 後台 labels（記錄為待釐清，不臆測）。
- 🛑 **any manual repost uncertainty** — 任何手動重貼過程的不確定（不確定貼了哪段 / 是否覆蓋既有內容）。

遇上述任一 → **停止擴張**，記錄於新 docs，另開單一修復 / 調查 phase；不在 monitoring phase 內改 source / template / settings / guard。

---

## H. Recommended monitoring cadence（保守節奏）

- **same day**：front-end visual check only（§D 清單；6 篇前台目視 + DevTools）。
- **next 24–72 hours**：AdSense dashboard / policy check（§E 清單；human 登入後台觀察）。
- **3–7 days**：observe stability before expanding Batch 2（觀察穩定度後再考慮 Batch 2；期間不擴張）。
- **Do not publish several posts in one burst** unless monitoring remains clean（除非監控持續乾淨，否則不一次連發多篇）。

---

## I. Explicit non-actions（本 session 明確未做）

- ❌ no source change（`src/` 全未動）
- ❌ no template / renderer change（EJS / build 未動）
- ❌ no settings / `ads.config.json` change（real id 仍只存 `ads.config.json`）
- ❌ no content post change（6 篇 live post + 其餘 post 一律只讀未動）
- ❌ no Blogger publish / repost（未登入 / 未開編輯器 / 未開 AdSense 後台）
- ❌ no deploy / no push gh-pages / no `dist-blogger` commit / no `.cache` mutation
- ❌ no GA4 implementation
- ❌ no new AdSense slot
- ❌ no new assets / no new commerce links
- ❌ no guard coverage change（`check-blogger-adsense-output.js` 維持 6-target，未動）
- ❌ no npm install / no package / lockfile change
- ❌ no P2 content landing
- ❌ no CLAUDE.md compression / 無重排 / 無 unrelated cleanup
- ❌ no `/memory`
- ❌ **未把 Blogger VIEW count 增加判定為真實流量或 AdSense 成效**

唯一 mutation：本 doc 自身（+ 若 CLAUDE.md ledger 慣例要求則做 pm-19 極小 ledger sync append）。

read-only 量測（carry-forward，未造成 mutation）：`validate:content` 0/94/84、`check:blogger-adsense-output` 85/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0。

---

## J. Recommended next phase

- **Conservative（推薦預設）：monitor 6 live posts only** — 依 §D / §E / §H 持續人工觀察 6 篇 live post + AdSense 後台；view count 變動僅記錄，不擴張。
- **Optional：P2 draft docs-only, one post only, no content landing** — 撰寫 `ai-tools-simplify-daily-workflow` full article draft（docs-only；嚴守 pm-10 §E.2 policy cautions；**不** content landing）。
- **Optional：later AdSense dashboard observation record after user checks dashboard** — user 登入 AdSense 後台後，另開 docs-only 記錄後台 / 政策觀察。
- **Optional：only after stable monitoring, consider P2 content landing** — **僅在**監控穩定（§H 3–7 天乾淨）後，才考慮 P2 content landing（須 user explicit approval 另開單一 phase）。
- **Not advised**：在同一 phase 連發多篇 / 改 template / source / settings / 新增 ad slot / P2 publish。

🔴 任何 live repost / Blogger 後台動作 / source / settings / guard change / content landing，皆須 user explicit approval 後另開單一 phase。

---

## K. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）、`ca-pub-…****`（masked）；**不含**完整 real AdSense client id / slot id。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
