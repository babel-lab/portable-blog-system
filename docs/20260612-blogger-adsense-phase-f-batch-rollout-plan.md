# Blogger AdSense Phase F — Batch Rollout Plan

Phase: `20260612-am-1-blogger-adsense-phase-f-batch-rollout-plan-docs-only-a`

## 1. Status

- **docs-only rollout plan**
- 本 phase **不** repost / paste / publish / 開 Blogger 後台 / 開 AdSense 後台 / deploy / push gh-pages
- 本 phase **不**改 src / content / settings / fixtures / views / templates / package / lockfile / dist / .cache
- 本 phase **不**改 guard scope（`check-blogger-adsense-output.js` 維持 single-slug = `we-media-myself2`）
- 本 phase **不**新增或 hardcode real AdSense client / slot id
- 目的：把單篇 + 第二篇 manual verification 之後之 **小批次 repost 流程**規格化，避免一次大量重貼造成不可恢復風險

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律 `slotKey`（`articleAd6`）/ masked。real id 僅存於 `content/settings/ads.config.json`。

---

## A. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `f7cfd98` |
| origin/main | `f7cfd98` |
| ahead / behind | 0 / 0 |
| working tree | clean |
| latest subject | `docs(blogger): record second adsense post verification` |
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（normal baseline 不變） |

Baseline 與本 session 預期完全一致；不做任何 fix / 不重跑。

---

## B. Current known state（截至 20260612 08:07）

### B.1 GitHub Pages 六區塊 AdSense

| 項目 | 狀態 |
|---|---|
| `ads.enabled` | `true`（N9e 起 LIVE） |
| 六個 article slot（`articleAd1`..`articleAd6`） | 全部已寫入 `ads.config.json`，per N9a |
| `defaults.blocks[]` | 6 筆，對映 `afterHeader` / `afterCover` / `afterBookPhoto` / `afterAffiliateTop` / `beforeAffiliateBottom` / `beforeRelatedLinks` |
| GitHub Pages live | N9e 已 deploy（`gh-pages` `2acb5a5→c15e514`）；3 ready post × 6 anchor markup 寫入 dist |
| repo-side guards | `check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0 |
| 本 Phase F 範圍 | ❌ 不動 GitHub Pages |

GitHub Pages 已 live，**不在**本 Phase F rollout 範圍。本 Phase 僅處理 Blogger surface batch repost。

### B.2 Blogger article bottom AdSense slot 目前 repo 內狀態

| 項目 | 狀態 |
|---|---|
| Blogger surface 准入版位 | **僅** `articleAd6` / `beforeRelatedLinks`（per Phase B `318686f`） |
| Blogger surface 拒入版位 | `articleAd1`–`articleAd5`（per resolver case 33 negative guard） |
| Blogger build-wiring | live source（Phase C `2b1f166`）：`build-blogger.js` `renderFullPost` 注入 `adsenseBlocksRendered`；`blogger-post-full.ejs` 之 `beforeRelatedLinks` anchor 已植入 partial chain |
| dist-blogger 輸出（ready+full post） | 每篇恰 1 個 `lab-ad-slot--articleAd6` `<ins>`，0 個 `articleAd1`–`articleAd5`，data attrs 與 `ads.config.json` strict-equal |
| repo-side automated guard | `check:blogger-adsense-output` 14/0，但**仍只驗** `we-media-myself2`（hardcoded `TARGET_SLUG`） |

### B.3 已完成之 manual verification / readiness 記錄

| 編號 | post slug | source markdown | mode | 本機 dist HTML | manual verification |
|---|---|---|---|---|---|
| 1st | `we-media-myself2` | `content/blogger/posts/20260515-we-media-myself2.md` | full（既有） | `dist-blogger/posts/we-media-myself2/post.html` | ✅ PASS — Phase D night-1（`docs/20260611-blogger-adsense-phase-d-manual-post-verification-record.md`，20260611 22:42–22:59；live AdSense fill 第 2 次成功） |
| 2nd | `github-pages-blog-planning` | `content/github/posts/20260504-github-pages-blog-planning.md` | full（night-4 由 summary flip） | `dist-blogger/posts/github-pages-blog-planning/post.html` | ✅ PASS — 20260612 night-1（`docs/20260612-blogger-adsense-second-post-manual-verification-record.md`，20260612 00:06；one AdSense image ad render） |

### B.4 Repo-verifiable vs. Blogger-front-end-verifiable 區分

| 驗收層級 | 可由本 session 驗證 | 須由 human operator 外部驗證 |
|---|---|---|
| `ads.config.json` invariant | ✅ | — |
| `dist-blogger/.../post.html` 結構（`<ins>` 數量 / data attrs / EJS leak） | ✅（`check:blogger-adsense-output` + 手動 node one-liner） | — |
| Blogger 後台 HTML 已替換 | ❌ | ✅ |
| Blogger live 文章 DOM 含 `<ins>` | ❌ | ✅（DevTools view-source） |
| Blogger live AdSense 圖像 fill | ❌ | ✅（前台目視；首載常 unfilled 屬正常） |
| Blogger live 桌機 / 手機破版 | ❌ | ✅ |

**本 Phase F 與所有後續 batch 子 phase 一律遵守：repo-side 變更（mode flip / status flip）不等於 Blogger 前台已生效。** live state 只能由 human operator 在文件中明文紀錄。

---

## C. Why Phase F is needed

### C.1 不可一次重貼全部的理由

1. **Blogger = 外部手動系統**。每篇 repost = human operator 在 Blogger 後台手動切 HTML 模式 → 備份 → 貼上 → 桌機預覽 → 手機預覽 → publish。沒有 API；沒有 atomic batch；沒有 rollback transaction。
2. **single-paste failure 不可預測**。Blogger 視覺編輯器可能 strip `<ins>` / inline push script；視覺切換、特定瀏覽器、特定 device 都可能影響行為。
3. **AdSense policy / fill 行為**屬 AdSense 後台範疇，repo-side 無法事前驗證。大量同時 enable 可能在政策面 / fill 面被一次性懲罰（雖然單 slot bottom 風險低，仍須保守）。
4. **theme / CSS 互動風險**。雖然 Phase D / second-post 已驗證 `.adsbygoogle` / `.lab-ad-slot--articleAd6` / `.lab-affiliate-box` / `.lab-related-links*` 等共用 class 在 live 主題下正常，但**未涵蓋**所有 contentKind 形態（download / page / comic / life-note 等未 sampled）；大量上線後若某形態破版，回收成本高。
5. **回滾成本不對稱**。一次貼 N 篇 → 出問題 → 須對 N 篇逐一還原 live HTML 備份。1 篇 → 1 個還原；20 篇 → 20 個還原 + 必須追溯每篇的備份 timestamp。
6. **Blogger label / 自訂 slug / 搜尋說明**這些 metadata 在每篇 repost 時都要手動對齊，批次愈大愈容易漏對。

### C.2 Phase F 之獨立性

- Phase F **不**為「自動化執行」。它是**人工小批次節奏控制 + 驗收 checklist 工程化**。
- 不取代 guard parameterization 之獨立 phase（`20260612-XX-blogger-adsense-guard-parameterization-preanalysis-docs-only-a`，由 night-1 record §13 推薦）。兩者**正交**：guard parameterization 屬 repo-side automated coverage；Phase F 屬 live human-paced rollout。
- 兩條線可以並行：guard parameterization 完成後，Batch N 之 acceptance 可以從「only `we-media-myself2` automated coverage」變為「all reposted slug automated coverage」，但不阻塞本 Phase F 之首批節奏。

---

## D. Recommended rollout strategy

### D.0 Batch 0（已完成；不再動）

| post | repost state | verification |
|---|---|---|
| `we-media-myself2` | ✅ live reposted 20260611 22:42–22:59 | ✅ PASS（Phase D night-1） |
| `github-pages-blog-planning` | ✅ live reposted 20260612 00:06 | ✅ PASS（second-post verification） |

**Batch 0 lock**：本 Phase F 期間以及後續任何 batch 子 phase，皆**不再對** `we-media-myself2` / `github-pages-blog-planning` 進行新一輪 live repost。除非 source markdown 結構性變更（非 frontmatter cosmetic）+ 獨立 phase 明文授權。

### D.1 Batch 1（候選範圍 = 3–5 篇低風險文章）

⚠️ **重要約束**：以 20260612 08:07 之 repo 狀態，**當前 candidate pool 實質為空**：

| 已存在 production post | status | publishTargets.blogger.enabled | publishTargets.blogger.mode | seo.indexing | 是否可入 Batch 1 |
|---|---|---|---|---|---|
| `content/blogger/posts/20260515-we-media-myself2.md` | ready | true | full | (n/a) | ❌ Batch 0 已 lock |
| `content/github/posts/20260504-github-pages-blog-planning.md` | ready | true | full | (n/a) | ❌ Batch 0 已 lock |
| `content/github/posts/20260504-portable-blog-system-mvp.md` | ready | true | **summary** | **noindex-follow** | ⚠️ 不可直接重貼（mode flip + seo 決策須另案） |
| `content/blogger/posts/20260504-sample-book-review.md` | **draft** | true | full | (n/a) | ❌ draft 不入 |
| `content/blogger/posts/20260525-draft-book-review.md` | **draft** | true | full | (n/a) | ❌ draft 不入 |
| `content/blogger/posts/20260529-phonics-practice-sheet-download.md` | **draft** | false（blogger）/ true（github） | full | (n/a) | ❌ draft 不入；Blogger 未 enable |

→ **結論：Batch 1 現實上 size = 0。** 在新內容上線或既有 draft 提升為 ready 之前，Phase F 之 Batch 1 子 phase **無法執行**。

**Batch 1 啟動先決條件（任一）**：
1. 新增至少 3 篇 production-ready Blogger-target post（`status:"ready"` + `publishTargets.blogger.enabled:true` + `mode:"full"`），主題避開核心商業轉換、避開高流量文章。
2. 或 explicit user 決策對 `portable-blog-system-mvp` 進行 mode flip（summary→full）；但此 post 之 `seo.indexing:"noindex-follow"` 是否與 AdSense 政策相容須**獨立分析**（noindex page 帶 AdSense 是否違反 publisher policy）。本 Phase F **不**做此決策；屬另案 preanalysis。
3. 或 explicit user 決策對既有 draft（如 `sample-book-review`）進行 draft→ready 提升 + 內容完整性檢查；屬另案 content-change phase。

Batch 1 一旦可開：建議 **3 篇上限**；分至少 24 小時觀察視窗於各篇 live 之後再進入 Batch 2。

### D.2 Batch 2（在 Batch 1 全部 24 小時無問題後）

- 候選擴大到 10–20 篇。
- 仍須 **每篇手動 repost**；不批次自動化。
- 仍保留至少 1/3 待重貼之 ready+full post 為對照組（不重貼），用以監控 live AdSense 全站 fill / RPM 之**新貼** vs **未貼**差異。
- 每篇單獨記錄 verification（mirror Phase D night-1 / second-post night-1 結構），不混寫。

### D.3 Batch 3（在 Batch 2 全部 7 天無問題後）

- 候選擴大至剩餘全量 ready+full Blogger post。
- 仍 per-post 手動 repost；仍每篇單獨記錄。
- 完成全量後才能考慮（另案）：guard 涵蓋擴展 / 全站 reverse UTM deploy gate / GA4 dimension。

### D.4 暫停條件

任一發生即**立即暫停**後續批次：

- 任一篇 live front-end 觀察到破版（任一 device）
- 任一篇 live DOM 完全無 `<ins>`（即模板 / paste 失敗）
- AdSense 後台收到任何 policy notice / violation
- 連續 ≥3 篇 24 小時內無任何 fill（屬異常觀察值；單篇 long unfilled 屬正常）
- `dist-blogger` 結構性 drift（須 source phase 修復後重新 rebuild + 重新生成 paste source）

---

## E. Candidate selection rules

候選文章須**同時**滿足：

1. **production status**：`status:"ready"` + `publishTargets.blogger.enabled:true` + `publishTargets.blogger.mode:"full"`
2. **dist HTML pass**：rebuild 後 `dist-blogger/posts/<slug>/post.html` 通過手動 node one-liner（恰 1 個 `articleAd6` / 0 個 `articleAd1`–`articleAd5` / data attrs strict-equal / 無 EJS leak / 文件順序正確）
3. **theme class set**：該 post 所用 class group 已被 Batch 0 涵蓋（如出現新 class group → 須先 theme readiness gate）
4. **non-noindex**：`seo.indexing` 非 `noindex-follow` / `noindex-nofollow`（noindex + AdSense 屬獨立政策決策；不在本 Phase F 候選池）
5. **non-high-traffic**：非該 Blogger 之 top 5 流量文章（避免一次性 RPM 衝擊）
6. **non-high-commerce**：非主要 affiliate / commerce 轉換文章（避免 ad 與 affiliate UX 同篇干擾）
7. **non-recently-edited**：過去 7 日內無 frontmatter / body 結構性編輯
8. **non-warning-heavy**：`validate:content` 對該 post 無 warning 或僅有 advisory warning（如 magazine optional metadata）

**對照組保留規則**：任一批次都應保留**至少 1/3** 之 candidate 不入該批，作為 live 行為對照（fill / RPM / 視覺）。

**Batch 0 之兩篇永久 lock**（D.0），不計入任何後續批次。

---

## F. Manual repost checklist（per-post）

⚠️ 以下為**操作草案**；本 Phase F **不**執行；交給 future Batch N 子 phase 之 human operator 照做。

1. **Confirm local dist freshness**
   - `npm run build:blogger`
   - 確認 `dist-blogger/posts/<slug>/post.html` 是最新（timestamp 比對）
   - 跑 manual node one-liner（mirror second-post handoff §5）確認：恰 1 個 `lab-ad-slot--articleAd6`、0 個 `articleAd1`–`articleAd5`、`data-ad-client` / `data-ad-slot` 值與 `ads.config.json` strict-equal、無 `<%` / `%>` / `await include`
   - **任一不通過 → STOP**；不在 repo 端 patch；回 source phase 排查
2. **Confirm target identity**
   - live Blogger 文章 URL（既有文章）或建立新文章
   - Blogger 帳號正確
   - blog 正確
3. **Backup**
   - 若既有文章：複製當前 live HTML 至 §6 input 指定路徑 + 記檔名 + timestamp
   - 若新文章：標記 `N/A — newly created post`
4. **Switch to HTML mode**
   - **必須**切到 Blogger HTML 模式
   - **不可**在視覺模式編輯後再切（會 strip `<ins>` / inline script）
5. **Replace body**
   - 全選 `dist-blogger/posts/<slug>/post.html`（外層 `<div class="lab-blogger-article">`..`</div>`）
   - Blogger HTML 編輯器全選替換
   - **不動**主題、sidebar、Blogger 之 widget
6. **Align Blogger metadata**
   - 文章標題（與 dist meta.json `title` 一致）
   - 搜尋說明（取自 `searchDescription`）
   - 自訂網址 slug
   - labels（取自 `tags[]`）
   - 發布日期（如為新文章，依 markdown `date` 決定）
7. **Preview**
   - 桌機預覽 → 通過
   - 手機預覽 → 通過
   - **任一失敗 → 丟棄變更**（既有文章不 update / 新文章不 publish）
8. **Publish / update**
9. **Front-end visual verify**
   - 文章標題 / 描述完整
   - body 完整顯示（非 summary 卡片）
   - DOM 內含 `<ins class="...lab-ad-slot--articleAd6...">`（DevTools view-source）
   - slot 位置：body 之後 / hashtags 之前（如有 related-links 區段，slot 位於 affiliate bottom 之後 / related-links 之前）
   - 桌機無破版
   - 手機無破版
   - 無可見 `<%` / `%>` / `await include`
   - 無 `lab-ad-slot--articleAd[1-5]` 出現
   - hashtags 顯示正常
10. **Record**
    - URL / timestamp / device matrix（desktop / mobile）/ first-load fill state（fill / unfilled / no-creative）/ second-load fill state / screenshot 位置
    - 若任一 anomaly → 在該篇 record 明文寫出；不掩飾
11. **Wait gate before next post**
    - 同一批次內，**每篇** repost 完成後等待至少 30 分鐘再貼下一篇（讓 AdSense / browser cache / Blogger CDN 各端有時間反應；避免一連串 paste 失誤被連帶執行）
    - Batch N 全部完成後等待 24 小時再啟動 Batch N+1

---

## G. Acceptance criteria

### G.1 Repo side（本 session 與 future Batch N 子 phase 皆須通過）

| 項目 | 期望 |
|---|---|
| working tree | clean（commit 完成後） |
| `validate:content` | **0/94/84**（不變） |
| `check:adsense-resolver` | **34/0** |
| `check:adsense-article-block` | **13/0** |
| `check:adsense-anchor-wiring` | **14/0** |
| `check:blogger-adsense-output` | **14/0**（target = `we-media-myself2`；本 Phase F **不**動 guard scope） |
| `build:blogger` | success |
| commit type | docs-only |
| real AdSense id leak | 0（grep `ca-pub-` 於 docs / source / EJS / tests / package / frontmatter = 0 命中） |

### G.2 Generated HTML（per-post 候選）

對 candidate post `<slug>` 之 `dist-blogger/posts/<slug>/post.html`：

- 恰 1 個 `lab-ad-slot--articleAd6` `<ins>`
- 0 個 `lab-ad-slot--articleAd[1-5]`
- `data-ad-client` 與 `ads.config.json.adsenseClient` strict-equal
- `data-ad-slot` 與 `ads.config.json.slots.articleAd6` strict-equal
- 無 `<%` / `%>` / `await include`
- 文件順序：body → (optional affiliate bottom) → ad slot → (optional related-links / other-links) → hashtags

### G.3 Blogger front-end（per-post 候選）

- 文章 body 完整顯示
- DOM 含 `<ins>`
- 位置正確（per §F.9）
- 桌機 + 手機無破版
- 首載 unfilled 屬正常；後續觀察是否曾出現 fill
- 無 AdSense console 警告（policy violation / disabled slot）

---

## H. Rollback plan

### H.1 Per-post（live Blogger）

| 狀況 | 處理 |
|---|---|
| 預覽階段發現問題 | 丟棄變更 / 關閉編輯器不 update（既有 live 內容不變） |
| 新文章未發布即發現問題 | 刪草稿 / 直接放棄 |
| 已 publish / update 後發現問題 | 用 §F.3 之備份檔重新貼回 Blogger HTML 編輯器；publish 還原 |
| `<ins>` 不存在但其他正常 | 屬 paste / 視覺編輯器 strip → 依 second-post handoff §11.A 排查 |
| `<ins>` 存在但 long unfilled | 屬 AdSense 後台範疇；**不**做 repo rollback；觀察數小時 / 數天後再判斷 |

### H.2 Per-batch（決策面）

| 狀況 | 處理 |
|---|---|
| 同批 1 篇破版 / 1 篇模板失敗 | 暫停剩餘批次 candidate；逐篇分析根因；若屬 repo 端 → 開 source phase 修復後 rebuild + 重新生成 paste source |
| 同批 ≥1 篇引發 AdSense 後台 policy notice | **立即暫停所有後續批次**；通知 user；不再 paste；不在 repo 端對 enabled 做變更（GitHub Pages live 不受影響） |
| 同批 ≥1 篇 theme CSS 顯示異常 | 暫停剩餘批次；不在同一 session 同時做 source fix + rollout；另開 theme fix phase |

### H.3 Per-repo（極端）

| 狀況 | 處理 |
|---|---|
| `ads.config.json` 變更後 dist evidence 失敗 | 由 source phase 處理；本 Phase F 不動 `ads.config.json` |
| 全站 AdSense disable 決策 | 不在本 Phase F 範圍；屬獨立 `ads.enabled:true→false` source phase（影響 GitHub Pages live） |

### H.4 規則紅線

- **不**在同一 session 混做 rollout plan / source fix / guard 修改。
- **不**為 rollout 之便而暫時動 `ads.config.json` 之 `surfaces` / `enabled`。
- **不**在 rollback 期間關閉 GitHub Pages 已 LIVE 的 AdSense（GitHub Pages 與 Blogger 是兩條 surface 線）。

---

## I. Next session command suggestion

`20260612-am-2-blogger-adsense-phase-f-batch-1-repost-packet-docs-only-a`

預期內容（docs-only；下一個 Claude session 執行）：

1. 重做 baseline verify
2. 確認 candidate pool 是否有變化（是否有新 ready+full post，或 user 已對 `portable-blog-system-mvp` / draft 集做出明確決策）
3. 若 candidate pool 仍為空 → 文件明文記錄「Batch 1 candidate empty；Phase F rollout 暫停於 D.1 pre-condition」；不貼 / 不執行任何 batch repost
4. 若 candidate pool ≥1 篇 → 對 selected ≤3 篇生成 copy/paste packet（per §F），含：
   - 每篇 `dist-blogger/posts/<slug>/post.html` 之 sanity node one-liner 命令
   - 每篇 Blogger metadata（標題 / 描述 / slug / labels / 發布日期）
   - 每篇 §F manual repost step（沿用 Phase D / second-post handoff 結構）
   - per-post pre-repost six inputs
   - per-batch 觀察窗 + per-post 30 min wait gate
5. **絕不**開 Blogger / paste / publish
6. **絕不**改 src / settings / template / guard / frontmatter

並行 / 不衝突 phase：

- `20260612-XX-blogger-adsense-guard-parameterization-preanalysis-docs-only-a`（per night-1 record §13 推薦；屬 repo-side automated guard coverage 擴展之 docs-only preanalysis；不阻塞本 Phase F）

---

## J. Non-actions（本 session 明確未做）

- ❌ 未登入 Blogger / 未開 Blogger 編輯器 / 未開 AdSense 後台
- ❌ 未 paste / publish / repost
- ❌ 未 deploy / 未 push gh-pages
- ❌ 未改 `src/` 任何 script
- ❌ 未改 任何 EJS template
- ❌ 未改 `content/settings/ads.config.json`
- ❌ 未改 `package.json` / lockfile
- ❌ 未改 `src/scripts/check-blogger-adsense-output.js`
- ❌ 未做 guard 參數化
- ❌ 未改 任何 content markdown / frontmatter / fixture
- ❌ 未新增或 hardcode 真實 AdSense ID
- ❌ 未碰 commerce / Admin / renderer / GitHub Pages live
- ❌ 未做 CLAUDE.md compression
- ❌ 未使用 `/memory`
- ❌ 未做 unrelated cleanup
- ❌ 未跑 `build:blogger`（baseline 不變則無需 rebuild；docs-only）
- ❌ 未跑 `check:adsense-resolver` / `check:blogger-adsense-output`（無 source / settings 變更則計入 ledger 之最後一次 30-min-old measurement；本 phase 僅跑 `validate:content` 確認 baseline，避免 docs-only phase 跑超出範圍之 build）

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 am-1（20260612）極小 ledger sync。

---

## K. Real-ID masking confirmation

本文件全文僅出現：

- `articleAd1` / `articleAd2` / `articleAd3` / `articleAd4` / `articleAd5` / `articleAd6`（policy key，非 id）
- `beforeRelatedLinks` / `afterHeader` / `afterCover` / `afterBookPhoto` / `afterAffiliateTop` / `beforeAffiliateBottom`（anchor key，非 id）
- `ca-pub-` 形式詞彙僅作為 grep 工具描述（`grep ca-pub-` 此字串本身）；**不含**完整 real client id 數字字尾
- **不含**完整 real AdSense client id、完整 real AdSense slot id

real id 僅存於 `content/settings/ads.config.json`。

---

## L. Recommended next phase

**主線（Phase F 子 phase 序列）**：
`20260612-am-2-blogger-adsense-phase-f-batch-1-repost-packet-docs-only-a` —
詳見 §I。**不**執行 live repost；候選 pool 若仍為空則文件化暫停理由。

**並行 / 不衝突**：
`20260612-XX-blogger-adsense-guard-parameterization-preanalysis-docs-only-a` —
per night-1 record §13；docs-only preanalysis（Option A CLI / Option B registry / Option C ready-full traversal）。

🔴 任何 live repost / Blogger 後台動作 / source change，皆須 user explicit approval 後另開單一 phase；不在本 Phase F 範圍。

---

（本文件結束）
