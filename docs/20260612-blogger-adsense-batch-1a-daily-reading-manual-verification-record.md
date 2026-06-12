# Blogger AdSense — Batch 1a `daily-reading-habit-notes` Manual Verification Record

Phase: `20260612-am-8-blogger-adsense-batch-1a-daily-reading-manual-verification-record-docs-only-a`

## 1. Status

- **docs-only verification record**（human operator 已於 20260612 10:48 依 Batch 1a repost packet 手動完成 Blogger live 重貼 / 發布，並完成前台檢查）。
- 本文件**僅紀錄已發生之手測結果**；本 phase Claude 端**不**登入 Blogger、**不**再重貼、**不**發布、**不**做任何新的外部前台驗證 / AdSense 後台動作 / deploy。
- 本紀錄為 **live Blogger front-end manual verification record**，**不是** repo-side-only verification。
- 本紀錄不代表開放下一篇 / 任何進一步 Blogger AdSense 重貼；如要再貼仍須另行 explicit approval。
- 本 phase **未**動 source script / EJS template / `content/settings/ads.config.json` / `package.json` / `src/scripts/check-blogger-adsense-output.js` / 任何 content markdown 或 frontmatter。

> ⚠️ 本文件不含 real AdSense client / slot id；一律以 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）/ masked（client `ca-pub-…****`、slot `…****`）表述。real id 僅存於 `content/settings/ads.config.json`。

---

## A. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `c0e8350` |
| origin/main | `c0e8350` |
| ahead / behind | 0 / 0 |
| working tree | clean（紀錄撰寫前） |
| latest subject | `docs(blogger): prepare adsense batch 1a packet`（am-7 packet） |

Baseline 與 user 期望一致（branch=main、HEAD==origin/main==`c0e8350`、working tree clean）；不做任何 fix。

See also：
- `docs/20260612-blogger-adsense-batch-1a-daily-reading-repost-packet.md`（am-7 repost packet；本紀錄之操作來源 + §M template）
- `content/blogger/posts/20260612-daily-reading-habit-notes.md`（am-6 新增之 source markdown；本紀錄之 verification subject）
- `docs/20260612-blogger-content-new-lowrisk-full-post-content-plan.md`（am-5 content plan；本 post plan 來源）
- `docs/20260612-blogger-adsense-phase-f-batch-rollout-plan.md`（am-1 Phase F rollout 節奏）
- `docs/20260612-blogger-adsense-second-post-manual-verification-record.md`（night-1 第二篇 live PASS 紀錄；本紀錄之結構樣本）
- `src/scripts/check-blogger-adsense-output.js`（Phase E single-slug guard；本 phase 不動，仍只驗 `we-media-myself2`）

---

## B. Verification subject

| 屬性 | 值 |
|---|---|
| title | 我這一年養成每天閱讀的 5 個小方法 |
| slug | `daily-reading-habit-notes` |
| source file | `content/blogger/posts/20260612-daily-reading-habit-notes.md` |
| generated HTML（repost source） | `dist-blogger/posts/daily-reading-habit-notes/post.html` |
| live Blogger URL | `https://babel-lab.blogspot.com/2026/06/daily-reading-habit-notes.html` |
| contentKind | `life-note`（normal article；非 download / 非 book-review） |
| Blogger mode | **full**（`bloggerMode:"full"` / `rendered:"full"`） |
| indexing | indexable（frontmatter **無** `seo.indexing`） |
| affiliate / commerce | **無**（0 affiliate-box；0 commerce ref） |
| relatedLinks / otherLinks | **無** |
| hashtags | **有**（`#reading-notes` / `#self-growth`） |
| verification type | **Batch 1a mini-batch manual repost verification** |

> 明確說明：本文件為 **live Blogger front-end manual verification record**（依 user 實際 live 前台 + DevTools 觀察），**不是** repo-side-only verification。repo-side generated-HTML 結構驗證已於 am-7 packet §C 完成；本紀錄補上 live 前台結果。

---

## C. Repost / verification data

| 項目 | 值 |
|---|---|
| manual repost date/time | `20260612 10:48` |
| operator | user |
| desktop result | **OK**（無破版） |
| mobile result | **OK**（無破版；user manually checked，未附手機截圖） |
| layout broken | **NO** |
| rollback needed | **NO** |
| screenshot provided | **YES**（desktop Chrome + DevTools screenshot） |
| mobile screenshot | not provided / user checked manually |
| 觀察環境 | live Blogger 文章頁（非預覽、非 dry-run）；desktop Chrome + DevTools |

本 phase Claude 端**未**登入 Blogger、未開啟 Blogger 編輯器、未操作 AdSense 後台、未 deploy；僅依 user 提供之 live 觀察結果寫入本紀錄。

---

## D. AdSense slot result

| 項目 | 值 |
|---|---|
| bottom AdSense slot | **present** |
| location | after article body / before hashtags or related-links area（本 post 無 related-links → body 之後、hashtags 之前） |
| status | **real ad displayed / filled** |
| blank / placeholder / real ad / not loaded | **real ad / filled** |
| duplicate slot | not observed |
| articleAd1–5 extra slot | not observed |
| commerce / affiliate box | not observed |
| layout overlap | not observed |

→ live 頁面實際 render 一個 real（filled）AdSense 廣告，位於正文結尾之後、hashtags 之前，符合 `lab-ad-slot--articleAd6` / `beforeRelatedLinks` anchor 在 dist HTML 中之位置。

---

## E. Blogger sanitizer / attrs observation

根據 user 提供之 desktop Chrome + DevTools 截圖描述：

- ✅ DevTools observed `ins.adsbygoogle`
- ✅ observed `lab-ad-slot`
- ✅ observed `lab-ad-slot--articleAd6`
- ✅ observed masked `data-ad-client`（`ca-pub-…****`）
- ✅ observed masked `data-ad-slot`（`…****`）
- ✅ observed `data-ad-status="filled"`
- ✅ adsbygoogle script still visible nearby（下方仍可見 `adsbygoogle` loader script）
- ✅ 文章未破版；hashtags 正常出現於廣告之後

**Conclusion**：Blogger **did not appear to strip** critical AdSense attrs / script for this post（`<ins>` / `data-ad-client` / `data-ad-slot` / inline push / loader script 皆存活；無 sanitizer strip 跡象）。

> ⚠️ 上述 `data-ad-client` / `data-ad-slot` 一律 masked；本文件不寫出完整 real AdSense client id / slot id。

---

## F. Acceptance criteria result

| 條件 | 結果 |
|---|---|
| repo-side generated HTML verified in prior packet（am-7 §C） | **PASS** |
| manual Blogger repost completed | **PASS** |
| desktop front-end checked | **PASS** |
| mobile front-end checked | **PASS** |
| bottom slot visible | **PASS** |
| no layout break | **PASS** |
| no duplicate slot observed | **PASS** |
| rollback needed | **NO** |

> ✅ **整體 verdict：Batch 1a manual verification PASS。**

`daily-reading-habit-notes`（life-note 生活心得形態）live 重貼 + 前台驗證通過：bottom `articleAd6` / `beforeRelatedLinks` anchor 在無 affiliate / 無 related-links 之純 body 形態下正確 fire，且 live AdSense 端觀察到 real（filled）廣告。

---

## G. Limitations

誠實列出本次紀錄之限制：

- 僅 desktop front-end 已附截圖完成完整觀察；**mobile result 由 user manually checked，未附手機截圖**。
- real ad fill 可能受 AdSense 競價 / 審核 / 地區 / 裝置 / 時間影響；本次只記錄當下（`data-ad-status="filled"`）之單一 time-point 觀察，不代表長期恆 fill。
- 本紀錄為 **manual visual / DevTools verification**，**非** automated guard 涵蓋；`npm run check:blogger-adsense-output` **仍只驗** `we-media-myself2`（hardcoded `TARGET_SLUG`；本 phase 不動 guard）。`daily-reading-habit-notes` 為 **manually verified 但 not yet included in automated guard**。
- 本 session **沒有**進行任何新的 repo source / template / settings change。
- 本 session **沒有**驗證其他文章；跨時段 / 跨裝置之長期破版掃描不在本 phase 範圍。

---

## H. Rollout implication

- `daily-reading-habit-notes` 可以視為 **Batch 1a 成功樣本**（第三篇 live PASS：繼 Phase D `we-media-myself2` 複雜書評形態、night-1 `github-pages-blog-planning` tech-note 簡形態之後，補上 life-note 生活心得形態）。
- 可進入下一步：**決定是否新增 2～4 篇 low-risk full posts，或把 Batch 1 從 1a 擴成 3～5 篇**。
- **不建議立刻全量重貼**；既有 production candidate pool 仍偏少（其餘為 Batch 0 lock / draft / noindex+download）。
- 下一步仍應**保守**，維持**小批次**節奏（per Phase F rollout plan）。

---

## I. Recommended next phases

1. **`20260612-XX-blogger-content-lowrisk-posts-batch-1-expansion-plan-docs-only-a`**
   - 目的：規劃再新增 2～4 篇 low-risk full Blogger posts，讓 Batch 1 從 1a 擴成 3～5 篇（docs-only content plan）。
2. **`20260612-XX-blogger-content-second-lowrisk-post-one-post-content-a`**
   - 目的：實際撰寫下一篇 low-risk full Blogger post（single new file；須 user explicit approval）。
3. **`20260612-XX-blogger-adsense-batch-1-rollout-readiness-docs-only-a`**
   - 目的：根據 Batch 1a 成功結果，評估是否進入正式 Batch 1（docs-only readiness）。
4. **`20260612-XX-blogger-adsense-guard-parameterization-preanalysis-docs-only-a`**
   - 目的：把 `check:blogger-adsense-output` 從 hardcoded `we-media-myself2` 參數化，讓 `daily-reading-habit-notes`（及第二篇）也被 automated guard 涵蓋（docs-only preanalysis；並行不衝突）。
5. **conservative pause** — 維持 baseline 不動，等累積更多 low-risk 內容後再決定批次節奏。

🔴 任何 live repost / Blogger 後台動作 / source / settings change，皆須 user explicit approval 後另開單一 phase；不在本紀錄 phase 範圍。

---

## J. Non-actions（本 session 明確未做）

- ❌ no Blogger access（未登入 / 未開編輯器 / 未開 AdSense 後台）
- ❌ no repost
- ❌ no publish
- ❌ no new external verification beyond user-provided result（僅依 user 提供之 live 觀察結果紀錄）
- ❌ no post / frontmatter / content mutation（含 `daily-reading-habit-notes`，一律只讀未動）
- ❌ no source / settings / template / views / fixtures mutation
- ❌ no `package.json` / lockfile mutation
- ❌ no guard scope change（`check-blogger-adsense-output.js` 維持 single-slug `we-media-myself2`）
- ❌ no AdSense ID mutation（未新增 / 未 hardcode real client / slot id 於 docs / fixture / test）
- ❌ no dist commit（`dist-blogger` 產物不加入 git）
- ❌ no screenshot commit（截圖實體不放入 repo）
- ❌ no deploy / no push gh-pages / no `.cache` mutation
- ❌ no CLAUDE.md compression
- ❌ no `/memory`
- ❌ no unrelated cleanup

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 am-8（20260612）極小 ledger sync append。

---

## K. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）、`ca-pub-…****`（masked client）、`…****`（masked slot）；**不含**完整 real AdSense client id / slot id，亦無可重建 real id 之足夠線索。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
