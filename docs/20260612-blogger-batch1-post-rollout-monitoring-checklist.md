# Blogger AdSense — Batch 1 Post-Rollout Monitoring Checklist

Phase: `20260612-pm-8-blogger-batch1-post-monitoring-checklist-docs-only-a`

## 0. Status

- **docs-only monitoring checklist**。記錄目前人工觀察、可能解釋、風險判斷與下一階段建議。
- 本 phase **不**改 source / template / EJS / renderer / content production post / settings / package / lockfile / dist / `.cache`。
- 本 phase **不**登入 Blogger、**不**重貼 / 發布、**不**改 AdSense real id、**不**做 GA4 實作、**不** deploy、**不** npm install、**不**做 Batch 2 實作、**不**做第 4 篇發文。
- 唯一 mutation：本 doc 自身 + `CLAUDE.md` 之極小 ledger sync append。
- 依據 = pm-6 rollout readiness（`docs/20260612-blogger-adsense-batch-1-rollout-readiness.md`）+ pm-7 completion record（`docs/20260612-blogger-adsense-batch-1-completion-record.md`）+ user 於本 session 提供之新人工觀察。

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律以 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）/ masked（`ca-pub-…****`）表述。real id 僅存於 `content/settings/ads.config.json`。

> ⚠️ **核心紅線（貫穿全文）：Blogger VIEW 數不能單獨當作 AdSense 成效或真實流量判斷依據。** view count 增加 ≠ 真實自然流量、≠ AdSense impression / click / earning。

---

## A. Phase name

`20260612-pm-8-blogger-batch1-post-monitoring-checklist-docs-only-a`

---

## B. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `c6df076` |
| origin/main | `c6df076` |
| ahead / behind | 0 / 0 |
| working tree | clean（撰寫前） |
| latest subject | `docs(blogger): record adsense batch 1 completion`（pm-7 completion record） |
| 觀察時間 | 約 `20260612 14:13` |

Baseline 與 user 期望一致（branch=main、HEAD==origin/main==`c6df076`、working tree clean）；不做任何 fix。

---

## C. Prior state summary（pm-6 / pm-7 後狀態）

- **pm-6 rollout readiness**：3 篇 low-risk life-note post live PASS（daily-reading / reading-notes / after-work-writing），達正式 Batch 1 之 3 篇下限 → Batch 1 minimum 視為 ready，但**不**直接全量 rollout。
- **pm-7 completion record**：正式宣告 **Blogger AdSense Batch 1 minimum COMPLETE / READY**；明確 caveat：不代表 Batch 2 / 全量 rollout 完成、不代表所有 Blogger post 已重貼、不代表 AdSense fill 對所有 user / device / time 保證。
- **目前所有 live/manual verified + guard-covered Blogger AdSense posts = 5 篇**（we-media-myself2 複雜書評形態 / github-pages-blog-planning tech-note 形態 / daily-reading-habit-notes / reading-notes-three-questions / after-work-writing-time-blocking 三篇 life-note 最簡形態）。
- **Batch 1 目前處於 manual / monitoring 階段**：repo-side guard `check:blogger-adsense-output` 涵蓋 5 target；但「live PASS」一律指 human operator 已在 Blogger 前台 + DevTools 完成之手動觀察，repo-side guard 通過 **不等於** live 持續成效。conservative default = pause / idle-freeze。

---

## D. Manual observation（本 session 新人工觀察）

- 觀察時間：約 `20260612 14:13`。
- **測試頁面連結尚未對外公開**（未主動分享 / 未對外宣傳 / 未投放）。
- **除了 user 自己之後，Blogger 前台 VIEW 數仍有增加。**
- user 目前**推測**可能來源（明確標為推測，**未**判定為真實外部訪客）：
  - Blogger / Google bot
  - AdSense / Google crawler
  - Search Console / preview / fetch
  - Blogger 後台或平台自己的統計延遲 / 重算

→ 本 record 將以上觀察忠實記錄，並在 §E 展開可能解釋、§F 列明不可下的結論。

---

## E. Possible explanations（可能解釋；皆屬未證實假設）

> 以下為**可能性列舉**，非結論。view count 來源在沒有 server log / GA4 / Search Console 交叉比對前無法確定。

### E.1 Google / Blogger / AdSense crawler（bot 類）

- **Googlebot / Blogger 平台爬蟲**：新發布 / 重貼文章會被 Google 索引爬蟲抓取，可能反映在後台統計。
- **AdSense crawler**：AdSense 為了判定版位內容 / 政策合規，會以 crawler 抓取掛有 ad code 的頁面（Batch 1 五篇皆有 bottom `articleAd6` slot）→ 可能造成非人類的頁面抓取。
- **Search Console fetch / URL inspection / preview**：若 user 或平台對該 URL 做過 inspect / request indexing / preview，亦會產生抓取。
- 特徵：通常**不**代表真人閱讀，**不**應計入自然流量。

### E.2 Blogger platform internal preview / fetch / stats delay / recount（平台內部）

- **Blogger 編輯器 preview / 後台預覽**：重貼 / 編輯過程中之預覽動作可能被計入。
- **平台統計延遲 / 重算**：Blogger pageview 統計常有延遲與事後重算，短期數字波動不代表即時真實訪問。
- **Blogger 自家統計 vs GA4 差異**：Blogger 後台 view 與 GA4 採樣口徑不同，兩者本就會有落差；Blogger view 偏寬鬆。
- 特徵：屬平台量測機制的雜訊，**不**等於外部使用者。

### E.3 自己 / 多裝置（self-traffic）

- user 在 desktop / mobile / 不同瀏覽器 / DevTools 開啟期間的多次造訪，皆可能被計入。
- Batch 1 verification 過程本身（desktop Chrome + DevTools + mobile 手動檢查）即會產生多次 self-view。
- 特徵：屬自我流量，**必須**從「真實外部流量」判斷中排除。

### E.4 少量外部 discoverability 的可能性（不可誇大）

- 即使未主動公開，理論上仍可能有極少量外部抵達途徑（例如 Blogger 平台的 recent / random 導覽、被索引後的零星搜尋觸及）。
- **但此可能性必須保守看待、不可誇大**：在沒有 GA4 / Search Console / referrer 資料佐證前，**不可**假設已有真實讀者群、**不可**據此擴大發文規模。

---

## F. What NOT to conclude（明確不可下的結論）

- ❌ **不可**把 view count 增加直接視為真實自然流量（真人讀者）。
- ❌ **不可**把 view count 增加直接視為 AdSense impression / click / earning。
- ❌ **不可**因 view count 增加就立即擴大大量發文 / 全量 rollout / 啟動 Batch 2 實作。
- ❌ **不可**把 Blogger VIEW 數單獨當作 AdSense 成效或真實流量的判斷依據（view 與 impression / valid traffic / 收益是不同口徑，且 Blogger view 偏寬鬆並含 bot / self / 平台雜訊）。
- ✅ 正確態度：view count 變動 = **待解釋的訊號**，需要 GA4 / Search Console / AdSense 後台等多來源交叉比對後才可能下結論；目前階段維持 monitoring，不擴張。

---

## G. Monitoring checklist（人工觀察清單）

> 全部為 **read-only 人工觀察**；不改任何檔案 / 設定 / 後台 ad code。建議節奏：repost 後 24h 內 + 7d 內各觀察一次，之後視需要。

### G.1 Blogger post front-end 檢查（每篇 Batch 1 文章）

對 5 篇 live post（daily-reading-habit-notes / reading-notes-three-questions / after-work-writing-time-blocking / we-media-myself2 / github-pages-blog-planning）：

- [ ] 文章正文完整顯示（full，非 summary 卡片）。
- [ ] 版面未破（desktop + mobile 各看一次）。
- [ ] 無重複 ad slot、無 articleAd1–5 誤出現。
- [ ] hashtags / related-links（若該篇有）區塊正常。
- [ ] 無可見 EJS / template leak（`<%` / `%>` / `undefined` / `null`）。

### G.2 AdSense slot 是否出現（每篇 Batch 1 文章）

- [ ] bottom `articleAd6` slot 容器存在（DevTools 可見 `ins.adsbygoogle` / `lab-ad-slot--articleAd6`）。
- [ ] `data-ad-client` / `data-ad-slot` 屬性存在且未被 Blogger sanitizer strip。
- [ ] `data-ad-status` 觀察：`filled`（有填）/ `unfilled`（首載或競價無填，屬正常，**不**代表壞）。
- [ ] adsbygoogle loader script 仍存活（未被平台移除）。
- [ ] slot 位置正確（正文之後、hashtags / related-links 之前）。

### G.3 訊號交叉比對（避免單看 view count）

- [ ] **不**單看 Blogger view count；如要評估流量需另接 GA4 / Search Console（目前 GA4 measurementId 機制就位但本 phase 不啟用、不實作）。
- [ ] 觀察 console error 是否影響版面（若廣告正常顯示且版面未破，瀏覽器 / ad iframe 之 console 訊息不記為阻斷問題）。
- [ ] 若出現 policy notice / 版位被停 / 破版 → STOP，記錄並另開 phase，不在 monitoring phase 內修 source。

### G.4 異常時的處置原則

- 發現 sanitizer strip / 破版 / duplicate slot / policy notice → **停止擴張**，記錄於新 docs，不在本 phase 改 source / template / settings。
- 不因單次觀察數字（含 view count）做出 rollout 決策。

---

## H. Recommended next phases

### H.1 Conservative（保守預設，推薦）

- **Keep monitoring / docs-only**：維持 baseline 不動，持續以 §G 清單人工觀察 5 篇；不擴張、不改 source、不動後台。view count 變動僅記錄，不據以決策。

### H.2 Optional（須 user 決定才啟動）

- **Batch 2 preanalysis（docs-only）**：`20260612-XX-blogger-adsense-batch-2-preanalysis-docs-only-a`，規劃 Batch 2（較大批次 + 對照組 + download / noindex / commerce 形態政策評估）；**只規劃不執行**。
- **4th low-risk post plan / manual repost checklist**：補第 4 篇 low-risk full post 之 content plan 或 repost packet（docs-only / single new file）；須 user explicit approval。

### H.3 不建議（明確避免）

- ❌ 不建議直接大批量 publish / 全量 rollout。
- ❌ 不建議直接改 AdSense source（ad code / `ads.config.json` / resolver / guard）。
- ❌ 不建議直接改 template / EJS / renderer。
- ❌ 不建議因 view count 增加就改變上述任一保守節奏。

---

## I. Explicit non-actions（本 session 明確未做）

- ❌ no source change（`src/` 全未動）
- ❌ no template / EJS / renderer change
- ❌ no content production post change（5 篇 + 其餘 post 一律只讀未動）
- ❌ no settings change（`content/settings/` 含 `ads.config.json` 未動）
- ❌ no AdSense real ID change / hardcode
- ❌ no Blogger publish / repost / 登入後台 / 開編輯器 / 開 AdSense 後台
- ❌ no external front-end re-verification（僅忠實記錄 user 提供之觀察）
- ❌ no GA4 implementation
- ❌ no deploy / no push gh-pages / no `.cache` mutation
- ❌ no npm install / no package / lockfile change
- ❌ no Batch 2 implementation
- ❌ no 4th post authoring / repost
- ❌ no CLAUDE.md compression / 無重排 / 無 unrelated 內容變動
- ❌ no `/memory` cleanup beyond minimal ledger sync
- ❌ **未把 VIEW 增加判定為真實流量**

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 pm-8（20260612）極小 ledger sync append。

---

## J. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）、`ca-pub-…****`（masked）；**不含**完整 real AdSense client id / slot id。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
