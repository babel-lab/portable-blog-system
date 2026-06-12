# Blogger AdSense — Batch 1 `reading-notes-three-questions` Manual Repost Packet

Phase: `20260612-am-14-blogger-adsense-batch-1-reading-notes-repost-packet-docs-only-a`

## 1. Status

- **docs-only repost packet**。
- 本 phase **不** repost / paste / publish / 開 Blogger 後台 / 開 AdSense 後台 / deploy / push gh-pages / 做外部前台驗證。
- 本 phase **不**改 src / content / settings / fixtures / views / templates / package / lockfile / gh-pages / `.cache`。
- 本 phase **不**改任何文章檔（含 `reading-notes-three-questions`）。
- 本 phase **不**改 guard scope（`check-blogger-adsense-output.js` 維持 3-target：we-media-myself2 / daily-reading-habit-notes / github-pages-blog-planning；**本 post 尚未納入**）。
- 本 phase **不**新增 / hardcode real AdSense client / slot id。
- 目的：把 am-13 新增之 Blogger AdSense **Batch 1 expansion 候選 #1** 文章 `reading-notes-three-questions` 之手動重貼準備工作打包，讓 user 之後可直接照本 packet 操作。
- **actual live repost 仍 🔴 BLOCKED**，須 user 完成 §D pre-repost inputs + explicit separate approval 始可執行。

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律以 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）/ masked（`ca-pub-…****`）表述。real id 僅存於 `content/settings/ads.config.json`，被 build 透過 `deriveRenderedAdsenseBlocks(...)` 寫入 dist HTML；不在 docs / source / EJS / tests / package 內 hardcode。

> ⚠️ 本文件**不代表已完成** Blogger 外部重貼。文中所有「verified」一律指 **repo-side generated-artifact verification**（本機 `dist-blogger` 結構驗證），**非** live Blogger 前台驗證。live 前台驗證須由 human operator 於另一 phase 完成並記錄。

---

## A. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `49ee140` |
| origin/main | `49ee140` |
| ahead / behind | 0 / 0 |
| working tree | clean（packet 撰寫前） |
| latest subject | `feat(blogger): add reading notes questions post`（am-13 新增文章） |

Baseline 與 user 期望一致（branch=main、HEAD==origin/main==`49ee140`、working tree clean）；不做任何 fix。

See also：
- `content/blogger/posts/20260612-reading-notes-three-questions.md`（am-13 新增之 source markdown；本 packet 之 verification subject）
- `docs/20260612-blogger-adsense-phase-f-batch-1-expansion-plan.md`（am-12 Batch 1 expansion plan；本 post = expansion 推薦 set 第 1 篇）
- `docs/20260612-blogger-adsense-batch-1a-daily-reading-repost-packet.md`（am-7 Batch 1a packet；本 packet 結構之參照樣本）
- `docs/20260612-blogger-adsense-batch-1a-daily-reading-manual-verification-record.md`（am-8 Batch 1a live PASS 紀錄；本 post 未來 verification record 之模板來源）
- `docs/20260612-blogger-content-new-lowrisk-full-post-content-plan.md`（am-5 content plan；low-risk + zero-drift category/tag 限制）
- `src/scripts/check-blogger-adsense-output.js`（am-10/am-11 multi-target guard；本 phase 不動，仍 3-target，**未**含本 post）

---

## B. Batch 1 expansion candidate summary

| 屬性 | 值 |
|---|---|
| title | 讀完一本書後，我會問自己的 3 個問題 |
| slug | `reading-notes-three-questions` |
| source markdown | `content/blogger/posts/20260612-reading-notes-three-questions.md` |
| generated HTML（repost source） | `dist-blogger/posts/reading-notes-three-questions/post.html` |
| dist meta | `dist-blogger/posts/reading-notes-three-questions/meta.json` |
| copy-helper | `dist-blogger/posts/reading-notes-three-questions/copy-helper.txt` |
| publish-checklist | `dist-blogger/posts/reading-notes-three-questions/publish-checklist.txt` |
| contentKind | `life-note`（normal article；非 download / 非 book-review） |
| category | `life-note`（Blogger-valid；0 settings drift） |
| tags | `reading-notes`, `self-growth`（皆 Blogger-valid；0 settings drift） |
| Blogger mode | **full**（`bloggerMode:"full"` / `rendered:"full"`） |
| indexing | indexable（frontmatter **無** `seo.indexing`；dist `noindex` 計數 = 0） |
| primaryPlatform | `blogger` |
| affiliate / commerce | **無**（0 affiliate-box；0 commerce ref；0 external links） |
| relatedLinks / otherLinks | **無** |
| hashtags | **有**（`#reading-notes` / `#self-growth`） |

### B.1 Why eligible（Batch 1 expansion 候選資格）

per am-12 expansion plan §D / am-5 content plan §C 硬條件，本 post **同時**滿足：

1. **full mode** — `publishTargets.blogger.enabled:true` + `mode:"full"`；summary / redirect-card 不注入 `articleAd6`。
2. **indexable** — 無 `seo.indexing:"noindex-*"`；非 download contentKind（不觸 SEO-1 noindex fallback）。
3. **ready / non-draft** — `status:"ready"` + `draft:false`。
4. **normal article（非 download）** — `contentKind:"life-note"`；不需 download theme readiness gate。
5. **non-placeholder** — 真實標題 / 真實 ~1200 字 body / 真實 description；無 `TODO` / 佔位。
6. **low commerce** — 0 affiliate / 0 commerce ref / 0 external links；surface 最乾淨。
7. **0 settings drift** — category / tags 全用既有 Blogger-valid 值（production warnings 維持 0）。

### B.2 與既有 live-verified 三篇之形態關係

| 編號 | post | 形態 |
|---|---|---|
| Batch 0 #1 | `we-media-myself2` | 書評 + 雙 affiliate-box + related-links + hashtags（**複雜**形態） |
| Batch 0 #2 | `github-pages-blog-planning` | tech-note + 無 affiliate + 短 body + hashtags（**簡**形態） |
| Batch 1a | `daily-reading-habit-notes` | life-note + 0 affiliate + 0 related-links + 中長 body + hashtags（**生活心得**形態） |
| Batch 1 expansion #1（本 post） | `reading-notes-three-questions` | life-note + 0 affiliate + 0 related-links + 中長 body + hashtags（**同最簡形態**） |

→ 本 post 與 `daily-reading-habit-notes` **同屬最簡 life-note 形態**（0 affiliate / 0 related-links / hashtags anchor）。未來納入 guard 時可直接複用 daily-reading 之 P1–P4 expectation 模板。

### B.3 Why Batch 1 expansion candidate #1, not yet live verified

- 本 post = **Batch 1 expansion 推薦 set 之第 1 篇**（per am-12 §F；該 set = reading-notes-three-questions + after-work-writing-time-blocking + how-i-choose-what-to-read-next，+ 已完成之 daily-reading = 4 篇，落在正式 Batch 1 之 3～5 區間）。
- **尚未 live Blogger 重貼、尚未 manual front-end verification、尚未加入 automated guard target。** repo-side generated-artifact 已驗（§C），但 live 端尚未發生。
- **本文件不代表已完成 Blogger 外部重貼。** 實際重貼屬另案 execution phase（須 user approval + 備份 + theme CSS 確認）；live 結果須由 human operator 於未來 manual verification record doc 記錄（§I 模板）。

---

## C. Generated artifact verification（repo-side generated-artifact verification）

> ⚠️ 以下全為 **repo-side / 本機 dist 驗證**，**非** live Blogger 前台驗證。

### C.1 本 session 重新驗證結果

| 檢查 | 結果 |
|---|---|
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（production-post warnings = 0；94 全來自 `content/validation-fixtures/`） |
| `npm run build:blogger` | **success**（done in ~117ms） |
| `npm run check:adsense-resolver` | **34 passed / 0 failed** |
| `npm run check:adsense-article-block` | **13 passed / 0 failed** |
| `npm run check:adsense-anchor-wiring` | **14 passed / 0 failed** |
| `npm run check:blogger-adsense-output` | **43 passed / 0 failed**（3 target：we-media-myself2 / daily-reading-habit-notes / github-pages-blog-planning；**不**涵蓋本 post） |

### C.2 `dist-blogger/posts/reading-notes-three-questions/post.html` 結構驗證

| 檢查項 | 期望 | 實測 |
|---|---|---|
| `post.html` 存在 | true | ✅ true |
| `meta.json` 存在 | true | ✅ true |
| `copy-helper.txt` 存在 | true | ✅ true |
| `publish-checklist.txt` 存在 | true | ✅ true |
| full（非 summary） | `bloggerMode:"full"` / `rendered:"full"` | ✅ full / full |
| `noindex` 計數 | 0 | ✅ 0 |
| affiliate / commerce box | 0 | ✅ 0（`lab-affiliate-box` = 0） |
| legacy ad slot（postTop/postMiddle/postBottom/sidebar/homeInline） | 0 | ✅ 0,0,0,0,0 |
| related-links | 0 | ✅ 0 |
| `lab-ad-slot--articleAd6` 數量 | 1 | ✅ 1 |
| `lab-ad-slot--articleAd[1-5]` 數量 | 0 | ✅ 0 |
| `data-ad-client` strict-equal `ads.config.json.adsenseClient` | true | ✅ true |
| `data-ad-slot` strict-equal `ads.config.json.slots.articleAd6` | true | ✅ true |
| EJS leak（`<%` / `%>` / `await include`） | 無 | ✅ false |
| 文件順序 body → articleAd6 → hashtags | true | ✅ true（body@1901 < ad@3972 < hashtags@4305） |

→ bottom slot 在正文之後、hashtags 之前；該 post 無 affiliate / related-links，`beforeRelatedLinks` anchor 在無 related-links 時仍正確 fire 於 hashtags 前。

---

## D. Manual Blogger repost packet（user 手動操作步驟）

⚠️ 以下為**操作草案**；本 phase 不執行。

### D.0 Pre-repost inputs（user 須逐項確認 / 填寫）

- [ ] 確認 / 建立 live Blogger 文章 URL（本 post 為**全新文章**，過去未在 Blogger 發布）：`__________`
- [ ] 確認正確的 Google / Blogger 帳號：`__________`
- [ ] 確認正確的 blog（避免貼錯 blog）：`__________`
- [ ] 現有 live HTML 之備份位置（新文章填 `N/A — newly created post`）：`__________`
- [ ] theme CSS readiness（本 post 不引入新 class group，繼承 Batch 0 / Batch 1a verdict）：`PASS / FAIL`
- [ ] before / after 截圖存放位置（桌機 + 手機）：`__________`

### D.1 操作步驟

1. 在本機確認 `dist-blogger/posts/reading-notes-three-questions/post.html` 最新（先 `npm run build:blogger`，再跑 §E one-liner，5 項全 true）。
2. 開啟 Blogger 後台（登入正確帳號 / 正確 blog）。
3. **新增文章**（本 post 預設情況）或編輯對應文章。
4. 先**備份**目前 Blogger HTML 至 §D.0 指定位置（記檔名 / timestamp）；若是新文章，**記錄新文章建立時間**。
5. 切換到 **HTML 模式**（**非**視覺編輯器；視覺編輯器可能改寫 HTML / strip `<ins>` / 移除 inline script）。
6. 開啟 `dist-blogger/posts/reading-notes-three-questions/post.html`，**全選複製**整個檔案內容（外層 `<div class="lab-blogger-article">`..`</div>`），在 Blogger HTML 編輯器**貼入**；**不動**主題、sidebar widget。
7. 設定標題：`讀完一本書後，我會問自己的 3 個問題`（與 dist `<h1>` 一致）。
8. 設定 permalink / slug（若 Blogger 允許自訂）：`reading-notes-three-questions`。
9. 設定 / 確認 Blogger「搜尋說明」與 labels：搜尋說明取自 `searchDescription`；labels = `reading-notes`, `self-growth`（與 `tags[]` 對齊；建議取自 `meta.json` / `copy-helper.txt`，非 hardcode）。
10. **先預覽**：桌機預覽 → 手機預覽。通過後再 **發布 / 更新**。
11. 開前台 URL **檢查桌機版**（是否破版 / 內容完整 / slot 位置）。
12. 開前台 URL **檢查手機版**。
13. 記錄是否看到文章底部 AdSense container / slot。
14. 記錄 slot 狀態：**空白 placeholder / 實廣告 filled / 未載入**（三態擇一）；以及是否破版、是否遮住內容、slot 位置是否錯誤。

---

## E. Copy / paste notes

- ❌ **不要**把完整 HTML 塞進本 doc（避免漂移 + 避免 real id 進 docs）。複製來源一律指向 local generated file。
- ✅ **唯一**正確複製來源：`dist-blogger/posts/reading-notes-three-questions/post.html`。
  - ❌ 不可用：source markdown（未 render，無 ad markup）/ GitHub Pages dist（本 post `github.enabled:false`，根本不產）/ summary / redirect-card HTML（無 `articleAd6` anchor）/ `dist-promotion/` FB 文案（純文字）。
- ⚠️ 若 Blogger 編輯器**改寫 HTML** → 記錄差異（diff before/after）。
- ⚠️ 若 Blogger **自動移除 `<script>` / `<ins>` / `data-*` attrs** → **立即停止並記錄** Blogger sanitizer behavior；不要重貼更多文章。

sanity 驗證 one-liner（read-only；不 hardcode real id）：

```bash
node -e "const fs=require('fs');const ads=require('./content/settings/ads.config.json');const html=fs.readFileSync('dist-blogger/posts/reading-notes-three-questions/post.html','utf-8');console.log('client OK:', html.includes('data-ad-client=\"'+ads.adsenseClient+'\"'));console.log('slot OK:', html.includes('data-ad-slot=\"'+ads.slots.articleAd6+'\"'));console.log('articleAd6:', (html.match(/lab-ad-slot--articleAd6/g)||[]).length);console.log('articleAd1-5:', (html.match(/lab-ad-slot--articleAd[1-5]/g)||[]).length);console.log('EJS leak:', html.includes('<%')||html.includes('%>')||html.includes('await include'));"
```

預期：`client OK: true` / `slot OK: true` / `articleAd6: 1` / `articleAd1-5: 0` / `EJS leak: false`。

---

## F. Manual verification checklist（user 重貼後在 live page 上填）

- [ ] Blogger post published / updated
- [ ] front-end URL 記錄：`__________`
- [ ] desktop checked（桌機無破版）
- [ ] mobile checked（手機無破版）
- [ ] bottom slot exists（DOM 內 `<ins class="adsbygoogle lab-ad-slot lab-ad-slot--articleAd6" ...>`）
- [ ] slot location before hashtags / related-links area（body 之後、hashtags 之前；本 post 無 related-links）
- [ ] content not broken（內容完整顯示，非 summary 卡片）
- [ ] no duplicate ad block（DOM 內 `articleAd6` 恰 1 個）
- [ ] no `articleAd1`–`articleAd5` extra slot（DOM 內 `lab-ad-slot--articleAd[1-5]` = 0）
- [ ] no commerce / affiliate box unexpectedly appears（本 post 不應出現 `.lab-affiliate-box`）
- [ ] no console-critical issue（若 user 檢查 DevTools；first-load unfilled 屬正常，非錯誤）
- [ ] screenshot taken if possible（桌機 + 手機）
- [ ] timestamp recorded：`__________`

---

## G. Acceptance criteria（Batch 1 expansion #1）

| 層級 | 條件 |
|---|---|
| repo（本 docs-only phase） | working tree clean after docs-only commit；無 source / content / settings drift |
| generated HTML | §C.2 全部 ✅（已 repo-side verified） |
| manual Blogger front-end（**待 user**） | bottom AdSense slot 以 container / slot 形式出現（即使 real ad blank 亦可接受）；no layout break；no duplicate slots；no `articleAd1`–`articleAd5`；no unexpected commerce / affiliate box |
| 記錄 | 結果記於未來 manual verification record doc（per §I template） |
| guard | **only after live PASS** 才考慮把本 slug 加入 `check-blogger-adsense-output.js` `TARGETS`（另開 K4-style guard phase；本 phase 不動 guard） |

> ✅ **Acceptance = repo clean（docs-only）+ generated HTML verified（已達成）+ manual Blogger front-end verified by user（待 user；即使 real ad blank 亦可接受）+ no layout break + no duplicate slots + no source/content/settings drift + result recorded in future manual verification record doc + only after live PASS considered for guard TARGETS addition。**

廣告未即時填充屬正常（AdSense 端 fill 延遲）；非破版即可接受。

---

## H. Rollback plan

| 狀況 | 處理 |
|---|---|
| Blogger **新文章** 發布後發現問題 | revert to draft 或刪除該 Blogger post |
| **更新既有文章** 後發現問題 | 回貼 §D.0 之備份 HTML，重新 publish |
| **slot 不出現**（`<ins>` 不存在） | **停止**，不要重貼更多文章；依 am-7 §J.A 排查（貼錯來源 / 貼錯模式 / sanitizer strip / dist 過舊） |
| **破版** | **停止 rollout**；不在同一 session 混做修復；另開 source / template fix phase |
| **Blogger 移除 ad attrs / script**（sanitizer） | **停止並記錄** Blogger sanitizer behavior；另開 failure analysis；不重貼更多文章 |
| **不要 rollback repo** | 除非 §E one-liner 證明 repo 輸出本身錯誤 |

🔴 **紅線**：不在同一 session 混做 rollout + source fix + guard 改動（per Phase F §H.4）。

---

## I. Post-repost record template（待填寫）

> 未來 user 完成 live repost 後，於新 docs-only phase 用此模板產出 verification record（mirror am-8 Batch 1a record 結構）。

```
# Blogger AdSense — Batch 1 reading-notes-three-questions Manual Verification Record

- manual repost date/time:  __________
- Blogger URL:              __________
- operator:                 __________
- generated file used:      dist-blogger/posts/reading-notes-three-questions/post.html
- desktop result:           __________ (no break / break: ...)
- mobile result:            __________ (no break / break: ...)
- AdSense slot result:      __________ (container present? / position correct?)
- blank / placeholder / real ad / not loaded:  __________
- layout result:            __________ (content not broken / duplicate slot? / position correct?)
- rollback needed?:         __________ (yes / no; if yes, which §H path)
- notes:                    __________ (Blogger HTML rewrite diff? sanitizer strip? console warnings?)
```

---

## J. Next phase recommendation

1. **由 user 依本 packet（§D inputs + steps）手動重貼**本 post 至 Blogger（須 user 完成 §D.0 inputs + explicit approval；本 packet 不開放自動推進）。
2. **若 user 已重貼成功** → 下一 phase = manual verification record（docs-only）：用 §I template 記錄 live 結果（mirror `docs/20260612-blogger-adsense-batch-1a-daily-reading-manual-verification-record.md`）。
   - 建議 phase name：`20260612-XX-blogger-adsense-batch-1-reading-notes-manual-verification-record-docs-only-a`
3. **若失敗** → 下一 phase = failure analysis（docs-only）或 source / template fix preanalysis：
   - 若屬 Blogger sanitizer strip / 平台限制 → failure analysis docs-only。
   - 若屬 repo-side 模板 / 輸出問題（§E one-liner 失敗）→ source / template fix preanalysis（**另開 phase；不在 rollout session 內修**）。
4. **若 live PASS** → 之後可開 **guard target addition** phase（把 `reading-notes-three-questions` 加入 `check-blogger-adsense-output.js` `TARGETS`，複用 daily-reading P1–P4 模板；NOT docs-only）。
5. **也可保守暫停**（conservative pause）：維持 baseline 不動；或先進 Batch 1 expansion 第 2 篇（`after-work-writing-time-blocking`）content phase。

🔴 **任何 live repost / Blogger 後台動作 / source / settings change，皆須 user explicit approval 後另開單一 phase。** 不在本 packet phase 範圍。

---

## K. Guardrails / non-actions（本 session 明確未做）

- ❌ no Blogger access（未登入 / 未開編輯器 / 未開 AdSense 後台）
- ❌ no repost / no publish
- ❌ no external front-end verification（不依賴 / 不宣稱任何 live Blogger 觀察）
- ❌ no post / frontmatter / content mutation（含 `reading-notes-three-questions`，一律只讀未動）
- ❌ no source / settings / template mutation（`src/` / `content/settings/` / `src/views/` / `package.json` / lockfile / `check-*.js` 全未動）
- ❌ no guard scope change（`check-blogger-adsense-output.js` 維持 3-target；**未**加本 post）
- ❌ no AdSense ID mutation（未新增 / 未 hardcode real client / slot id 於 docs / fixture / test）
- ❌ no dist commit（`dist-blogger` 產物**不**加入 git；僅本機 rebuild 驗證）
- ❌ no deploy / no push gh-pages / no `.cache` mutation
- ❌ no CLAUDE.md compression
- ❌ no `/memory`
- ❌ no unrelated cleanup

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 am-14（20260612）極小 ledger sync append。

read-only 量測（未造成 mutation；dist-blogger git-ignored 不 commit）：`validate:content` 0/94/84、`build:blogger` ok、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0、`check:blogger-adsense-output` 43/0。

---

## L. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）、`ca-pub-…****`（masked）；**不含**完整 real AdSense client id / slot id。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
