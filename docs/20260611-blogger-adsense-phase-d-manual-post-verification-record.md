# Blogger AdSense Phase D — Manual Post Verification Record

Phase: `20260611-night-1-blogger-adsense-phase-d-manual-post-verification-record-docs-only-a`

## 1. Status

- **docs-only verification record**（human operator 已於 20260611 22:42–22:59 完成手動 live Blogger post 測試）
- 本文件**僅紀錄已發生之手測結果**；本 phase **不再**進行任何 repost / paste / publish / build / deploy / Blogger 後台動作 / AdSense 後台動作
- 本紀錄不代表開放後續批次或第二篇 Phase D repost；如要再貼仍須另行 explicit approval

> ⚠️ 本文件不含 real AdSense client / slot id；一律 `slotKey`（`articleAd6`）/ masked（client `ca-pub-…****`、slot `…****`）。real id 僅存於 `content/settings/ads.config.json`。

---

## 2. Baseline at record time

| 項目 | 值 |
|---|---|
| HEAD / origin/main | `45d2b4e` |
| latest subject | `docs(claude): sync blogger adsense repost readiness state` |
| working tree | clean |
| recorded `npm run validate:content` | 0 errors / 94 warnings / 84 posts |

> 註：原 task prompt 預期 baseline 為 `6939010`，實際 origin/main 已前進至 `45d2b4e`（pm-14 之 CLAUDE.md sync commit；docs-only，不動 source）；本紀錄以實際 HEAD 為準。

See also：
- `docs/20260611-blogger-adsense-phase-d-single-post-repost-plan.md`（pm-11 計畫本體）
- `docs/20260611-blogger-adsense-phase-d-readiness-packet-handoff.md`（pm-13 readiness handoff packet）

---

## 3. Target

- post slug：`we-media-myself2`
- 來源 local HTML（由 `npm run build:blogger` 產出，本 phase 未重新 build）：`dist-blogger/posts/we-media-myself2/post.html`
- live Blogger 文章：user 已於手測中確認對應 target；本 doc 不寫出具體 live URL（per pm-13 packet §4 由 operator 私下持有）

---

## 4. Time window

- 觀察起始：`2026-06-11 22:42`
- 觀察結束：`2026-06-11 22:59`
- 觀察者：repo owner（manual operator）
- 環境：live Blogger 文章頁（非預覽、非 dry-run）

---

## 5. Manual observation recorded

### 5.1 Live page source（HTML / DOM）

live 文章 source / DOM 中**包含**預期之 `articleAd6` / `beforeRelatedLinks` AdSense block：

- `<ins class="adsbygoogle lab-ad-slot lab-ad-slot--articleAd6" ...>` 存在
- `data-ad-client` attribute 存在（值 masked `ca-pub-…****`）
- `data-ad-slot` attribute 存在（值 masked `…****`）
- inline push 呼叫 `(adsbygoogle = window.adsbygoogle || []).push({});` 存在
- 位置：affiliate / commerce bottom block **之後**、related links **之前**（與 `dist-blogger/posts/we-media-myself2/post.html` dry-run 規格一致）

### 5.2 AdSense loader script

live page source / head **包含** AdSense loader script：

- `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=...`（client 參數 masked）

### 5.3 First browser test（22:42 區段）

- slot / iframe element 存在於 DOM
- 可見創意（visible creative）為空白 / unfilled
- DevTools 確認 ad slot 已正確嵌入

### 5.4 Second browser test（22:59 區段）

- 可見 AdSense 創意在預期之文章下方版位**成功 render**
- 確認**至少一次** live ad fill / render 已成功觀察

### 5.5 Screenshots

- user 已對 original / reposted / manual test 三狀態進行截圖比對
- user 已標記或檢視 ad 位置
- 截圖實體不放入 repo（per pm-13 packet §4 截圖存放位置由 operator 私下保留）

---

## 6. Interpretation recorded

1. Blogger HTML insertion **succeeded**：手貼之 generated HTML 在 live 文章存活，與 dry-run 預期一致。
2. Blogger editor 未 strip 掉 AdSense `<ins>` block 或 inline push script。
3. site-level AdSense loader script 出現於 live page，路徑與 client 參數正確（masked）。
4. live AdSense serving **已觀察到至少一次成功 fill**（5.4 second browser test）。
5. 第一次 blank / unfilled 結果應視為 **AdSense 正常 no-fill / 暫時 serving 結果**，非實作失敗（per pm-13 packet §9：「廣告未即時填充屬正常」）。
6. console 中之 `api.pub.affiliates.one` 429 / 404 訊息**屬 affiliate-link API 行為**，**與本次 AdSense slot 本體無關**（affiliate render 仍可見；429 / 404 不影響 ad fill）。
7. console 中之 `aria-hidden` warnings 屬**accessibility warning**，**非 AdSense 失效之 current evidence**；列為待後續 a11y 追蹤項，不在本 phase 處理範圍。

---

## 7. Remaining unknowns / open items（非本 phase 處理）

- 第二篇 Phase D Blogger repost：**尚未排程**；如要進行仍須另行 readiness + approval。
- 長期 fill rate / RPM 變化：屬 AdSense 後台監控，repo-side 無資料、不處理。
- `api.pub.affiliates.one` 429 / 404：affiliate API 行為，**未在本 phase 排查**；如要處理屬 commerce-links / affiliate runtime 另案。
- `aria-hidden` console warnings：a11y 改善另案。
- Blogger 主題 CSS 對 `.lab-ad-slot--articleAd6` 之長期視覺呈現驗收：本 phase 只觀察 first / second browser test 兩個時點，未做跨時段 / 跨裝置之長期破版掃描。
- GitHub Pages live ad serving：與本 phase 無關（GitHub Pages AdSense 於 N9e 已 live，per CLAUDE.md baseline）。

---

## 8. Real-ID masking confirmation

本文件全文僅出現：

- `ca-pub-…****`（masked client id）
- `…****`（masked slot id）
- `articleAd6` / `beforeRelatedLinks`（policy key，非 id）

**不含** 完整 real AdSense client id、完整 real AdSense slot id、或可重建 real id 之足夠線索。real id 僅存於 `content/settings/ads.config.json`（per CLAUDE.md baseline 治理紅線）。

---

## 9. Non-goals（本 phase 明確不做）

- 不重新 build（`npm run build:blogger` 未執行）
- 不重新 deploy
- 不再次開啟 Blogger 編輯器、不再次貼文、不再次 publish / update
- 不碰 AdSense 後台
- 不修改 `content/settings/ads.config.json`
- 不修改 source / config / tests / content / templates / views / package / dist / gh-pages / cache
- 不啟動 GitHub Pages 額外驗證
- 不開放第二篇 Phase D repost

---

## 10. Recommended next step

- **觀察一段時間（建議數日）後再評估**：
  - 是否擴大 Blogger AdSense 至其他 production post（另開 Phase D2 plan + readiness）。
  - 是否再開放第二個 anchor（如 `afterHeader` / `afterAffiliateTop`）至 Blogger surface（須另立 surface-policy phase；目前 `ads.config.json` 僅 `articleAd6` 設為 `["pages","blogger"]`）。
- 在沒有新 user instruction 之前，repo 端**維持本 baseline 不動**；Phase D live 狀態紀錄為「single-post repost completed and verified once on 20260611 22:59，第二次 fill 成功」。

---

（本文件結束）
