# Blogger AdSense Phase F — Batch 1 Expansion Plan

Phase: `20260612-am-12-blogger-adsense-phase-f-batch-1-expansion-plan-docs-only-a`

## 1. Status

- **docs-only expansion plan**。
- 本 phase **不**新增文章檔、**不**修改任何 content / frontmatter / source / settings / template / fixtures / views / package / lockfile / dist / gh-pages / `.cache`。
- 本 phase **不**登入 Blogger、**不**重貼、**不**發布、**不**做外部前台驗證、**不**碰 AdSense 後台。
- 本 phase **不**新增或 hardcode real AdSense client / slot id。
- 本 phase **不**把 dist-blogger 產物加入 git。
- 唯一允許 mutation：新增本 doc + `CLAUDE.md` 之最小 ledger sync append。
- 目的：根據 Batch 1a 成功（`daily-reading-habit-notes` live PASS）+ guard coverage 完成（三篇 live/manual verified posts 全進 automated guard）之現況，規劃**如何從 1 篇 Batch 1a 擴展到正式 Batch 1 的 3～5 篇 low-risk full posts**（**只做計畫**，不新增文章、不重貼）。

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律以 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）/ masked 表述。real id 僅存於 `content/settings/ads.config.json`。

---

## A. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `0164ab5` |
| origin/main | `0164ab5` |
| ahead / behind | 0 / 0 |
| working tree | clean |
| latest subject | `test(blogger): expand adsense output guard coverage`（am-11 guard 第三 target） |

Baseline 與 user 期望一致（branch=main、HEAD==origin/main==`0164ab5`、working tree clean）；不做任何 fix。

read-only baseline 量測：

| 量測 | 結果 |
|---|---|
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（production-post warnings = 0；94 全來自 `content/validation-fixtures/`） |
| `npm run check:blogger-adsense-output` | **43 passed / 0 failed**（1 settings + 14×3 targets：we-media-myself2 / daily-reading-habit-notes / github-pages-blog-planning） |
| `npm run check:adsense-resolver` | **34 / 0** |
| `npm run check:adsense-article-block` | **13 / 0** |
| `npm run check:adsense-anchor-wiring` | **14 / 0** |

See also：
- `docs/20260612-blogger-adsense-batch-1a-daily-reading-manual-verification-record.md`（am-8；Batch 1a live PASS）
- `docs/20260612-blogger-adsense-batch-1a-daily-reading-repost-packet.md`（am-7；repost packet 結構樣本）
- `docs/20260612-blogger-adsense-phase-f-batch-rollout-plan.md`（am-1；Batch 0/1/2/3 節奏 + candidate rules + rollback）
- `docs/20260612-blogger-content-new-lowrisk-full-post-content-plan.md`（am-5；low-risk 候選主題 + zero-drift category/tag 限制）
- `docs/20260612-blogger-adsense-noindex-download-seo-policy-preanalysis.md`（am-4；noindex/download/SEO policy；為何不硬救既有候選）
- `docs/20260612-blogger-adsense-guard-parameterization-preanalysis.md`（am-9；guard 多 target 設計）
- `src/scripts/check-blogger-adsense-output.js`（am-10/am-11；現行 3-target guard）

---

## B. Current rollout state

### B.1 Batch 0（locked / already live-verified）

| post | form | source | live verification | guard |
|---|---|---|---|---|
| `we-media-myself2` | book-review + dual affiliate + related-links（複雜） | `content/blogger/posts/20260515-we-media-myself2.md` | ✅ PASS（Phase D night-1，20260611 22:42–22:59） | ✅ covered |
| `github-pages-blog-planning` | tech-note + 無 affiliate + 短 body（簡） | `content/github/posts/20260504-github-pages-blog-planning.md` | ✅ PASS（second-post night-1，20260612 00:06） | ✅ covered |

**Batch 0 永久 lock**（per am-1 §D.0）：不再對這兩篇做新一輪 live repost，除非 source markdown 結構性變更 + 另案授權。

### B.2 Batch 1a（successful；單篇 mini-batch）

| post | form | source | live verification | guard |
|---|---|---|---|---|
| `daily-reading-habit-notes` | life-note + 0 affiliate + 0 related-links（最簡） | `content/blogger/posts/20260612-daily-reading-habit-notes.md` | ✅ PASS（am-8，20260612 10:48；`data-ad-status="filled"`） | ✅ covered |

→ Batch 1a = **單篇成功樣本**，明文標示**非**正式 Batch 1 本體。

### B.3 Guard coverage 現況

`check:blogger-adsense-output` 自 am-11 起涵蓋**全部三篇** live/manual verified posts（43/0）。三篇恰好對應三種主要 Blogger output 形態：複雜（affiliate+related-links，anchor `relatedLinks`）/ 簡（tech-note，anchor `hashtags`）/ 最簡（life-note 純 body，anchor `hashtags`）。

### B.4 為何 Batch 1 尚未完成

per am-1 §D.1：正式 Batch 1 = **3～5 篇**低風險 full posts，且須保留 ≥1/3 對照組。目前 production-ready Blogger-full 候選池：

| 既有 production post | status | blogger mode | indexing | Batch 歸屬 |
|---|---|---|---|---|
| `we-media-myself2` | ready | full | indexable | Batch 0 lock |
| `github-pages-blog-planning` | ready | full | indexable | Batch 0 lock |
| `daily-reading-habit-notes` | ready | full | indexable | **Batch 1a（1 篇）** |
| `portable-blog-system-mvp` | ready | **summary** | **noindex-follow** | ❌ 不 eligible（summary + noindex；am-4 deferred） |
| `sample-book-review` / `draft-book-review` | **draft** | full | — | ❌ draft + 空 book metadata + 佔位 body |
| `phonics-practice-sheet-download` | **draft** | full（blogger disabled） | noindex fallback | ❌ draft + download + noindex |

→ **目前正式 Batch 1 eligible（非 Batch 0、ready、full、indexable、non-placeholder）只有 `daily-reading-habit-notes` 1 篇**，仍不足 3～5 篇。差距 = **再需 2～4 篇** low-risk full posts。

---

## C. Why Batch 1 expansion is now appropriate

1. **Batch 1a 已 live PASS**：`daily-reading-habit-notes` 於 am-8 完成 Blogger 手動重貼 + 前台 + DevTools 驗證，bottom `articleAd6` slot present 且 real ad filled，無破版 / 無 duplicate / 無 articleAd1–5。
2. **local generated HTML 與 live Blogger 雙端皆通過**：repo-side（`check:blogger-adsense-output` 43/0）與 live front-end（三篇 manual verification record）一致；renderer / anchor wiring 在三種形態下皆正確 fire。
3. **guard 已覆蓋三種文章型態**：複雜（we-media）/ 簡（github-pages）/ 最簡（daily-reading）→ 新增同類 low-risk full post 之 regression 風險已被 automated guard 兜住（前提：新 post live-verified 後納入 guard，per §G）。
4. **但仍不應全量重貼**：Blogger = 外部手動系統，無 API / 無 atomic batch / 無 rollback transaction（am-1 §C.1）；download / page / comic 等 contentKind theme 尚未 sampled；一次大量上線之 policy / fill / 破版回收成本不對稱。
5. **下一步應保守增加 2～4 篇 low-risk full posts**：以單篇逐次（each its own phase）累積到 3～5 篇 eligible，再評估進入正式 Batch 1 rollout，最後才考慮 Batch 2。維持 am-1 之小批次節奏，不跳級。

---

## D. Batch 1 target definition（正式 Batch 1 之硬條件）

正式 Batch 1 set 須滿足：

| # | 條件 | 判準 |
|---|---|---|
| D1 | **3～5 篇 posts** | 含已完成之 `daily-reading-habit-notes`；再加 2～4 篇 |
| D2 | **full** | `publishTargets.blogger.enabled:true` + `mode:"full"`（summary/redirect-card 不注入 `articleAd6`） |
| D3 | **indexable** | 不設 `seo.indexing:"noindex-*"`；不觸 SEO-1 noindex fallback |
| D4 | **ready** | `status:"ready"` + `draft:false` |
| D5 | **non-placeholder** | 真實標題 / 真實 body / 真實 description；無 `TODO` / 佔位 |
| D6 | **normal article** | `contentKind` ∈ {`life-note`, `tech-note`, `post`} |
| D7 | **no download contentKind** | 不為 `download`（避開 download theme readiness gate + noindex fallback） |
| D8 | **no noindex** | 同 D3 |
| D9 | **no affiliate / commerce preferred**（或僅極低複雜度） | 第一波建議 0 commerce；若放只能用 registry 既有 active `ref`，不新增 raw URL |
| D10 | **no new assets preferred** | cover 重用既有 placeholder（`/images/placeholders/cover-placeholder.svg`）；不依賴新圖 / 下載檔 |
| D11 | **suitable for Blogger output** | category / tags 之 `site[]` 含 `blogger`（zero settings drift；不引入 Batch 0 未涵蓋之新 CSS class group） |
| D12 | **generated HTML bottom articleAd6 verified** | `build:blogger` 後 dist HTML 恰 1 個 `lab-ad-slot--articleAd6` / 0 個 articleAd1–5 / data attrs strict-equal `ads.config.json` / 無 EJS leak |
| D13 | **manual Blogger repost remains separate phase** | 實際重貼 / publish 一律另開 execution phase（user approval + 備份 + theme CSS） |

### D.1 zero-settings-drift 之 category / tag 硬限制（關鍵）

由 `content/settings/categories.json` / `tags.json`（read-only）：

- **Blogger-valid category**（`site[]` 含 `blogger`）：`tech-note` / `book-review` / `download` / `life-note`。
- **Blogger-valid tag**（`site[]` 含 `blogger`）：`book` / `book-review` / `reading-notes` / `self-growth`。

→ 為「不改 settings + production warnings 維持 0」，新 Blogger full post **只能**：
- category 用 `life-note`（最乾淨）或 `tech-note`；**不**用 `book-review`（帶 affiliate 預期）/ `download`（noindex fallback）。
- tags 只能用 `reading-notes` / `self-growth`（life-note 適用）；`book` / `book-review` 偏書評語意。
- ⚠️ **tech-note 之既有 tag（`github` / `vite` / `static-site`）皆 `site:["github"]`**，放進 `site:"blogger"` 文章會觸 `tag-site-mismatch` warning。故 tech-note Blogger post 若要 zero-drift，tag 只能勉強借 `self-growth`，語意不佳。**結論：zero-drift 之新 Blogger full post 實務上集中在 `life-note` + `reading-notes`/`self-growth`**（此為 §E 候選天然聚焦於閱讀 / 自我成長之根因，非選題偷懶）。

---

## E. Candidate topic strategy（4～6 低風險候選）

> 全部 `site:"blogger"` / `contentKind:"life-note"` / `mode:"full"` / indexable / non-download / non-placeholder / 0 commerce / 0 new asset（cover 用既有 placeholder）。slug 已對 §post inventory 確認不碰撞。

### E.1 候選 1：寫作時間管理（承 am-5 D.2）

| 欄位 | 值 |
|---|---|
| proposed title | 下班後還能寫部落格？我的時間切片實作筆記 |
| proposed slug | `after-work-writing-time-blocking` |
| target content path | `content/blogger/posts/20260612-after-work-writing-time-blocking.md` |
| category | `life-note` |
| tags | `self-growth`（視內容可加 `reading-notes`） |
| why low risk | 個人時間管理心得；0 商業轉換；0 素材；category/tags 皆 Blogger-valid（0 drift） |
| suitable for Batch 1 | ✅ full + indexable + normal article + bottom slot 可驗；主題與「閱讀習慣」區隔（談寫作 / 時間） |
| commerce / affiliate | ❌ no |
| assets / downloads | ❌ no（cover placeholder） |
| expected complexity | 低–中（約 800–1000 字，需具體時段舉例） |
| risk level | **低** |

### E.2 候選 2：讀書筆記方法論（承 am-5 D.4）

| 欄位 | 值 |
|---|---|
| proposed title | 我的讀書筆記不是抄重點，而是問自己 3 個問題 |
| proposed slug | `reading-notes-three-questions` |
| target content path | `content/blogger/posts/20260612-reading-notes-three-questions.md` |
| category | `life-note` |
| tags | `reading-notes`, `self-growth` |
| why low risk | 方法論心得；**刻意不做成書評**（無 book metadata / 無 affiliate）；tags 完美對應（0 drift）；0 素材 |
| suitable for Batch 1 | ✅ 同上；與「閱讀習慣（daily-reading）」區隔（談筆記方法非習慣養成） |
| commerce / affiliate | ❌ no |
| assets / downloads | ❌ no |
| expected complexity | 低（約 700–900 字） |
| risk level | **低** |

### E.3 候選 3：選書 / 讀什麼的決策心得

| 欄位 | 值 |
|---|---|
| proposed title | 書單那麼長，我怎麼決定「下一本讀哪一本」 |
| proposed slug | `how-i-choose-what-to-read-next` |
| target content path | `content/blogger/posts/20260612-how-i-choose-what-to-read-next.md` |
| category | `life-note` |
| tags | `reading-notes`, `self-growth` |
| why low risk | 選書決策心得；0 commerce（談取捨非推銷特定書）；tags Blogger-valid（0 drift）；0 素材 |
| suitable for Batch 1 | ✅；與候選 2（筆記方法）/ daily-reading（習慣）主題區隔（談選擇） |
| commerce / affiliate | ❌ no（須留意：談書名時不放購書連結，保持 surface 乾淨） |
| assets / downloads | ❌ no |
| expected complexity | 低（約 700–900 字） |
| risk level | **低** |

### E.4 候選 4：減少手機 / 為閱讀讓出時間（自我成長偏向）

| 欄位 | 值 |
|---|---|
| proposed title | 我把手機放到另一個房間之後，多出來的閱讀時間 |
| proposed slug | `phone-away-reading-time` |
| target content path | `content/blogger/posts/20260612-phone-away-reading-time.md` |
| category | `life-note` |
| tags | `self-growth`（視內容可加 `reading-notes`） |
| why low risk | 數位減法 / 環境設計心得；0 commerce；0 素材；tags Blogger-valid（0 drift） |
| suitable for Batch 1 | ✅；偏「自我成長 / 習慣環境」而非純閱讀方法，增加形態多樣度 |
| commerce / affiliate | ❌ no |
| assets / downloads | ❌ no |
| expected complexity | 低（約 700–900 字） |
| risk level | **低** |

### E.5 候選 5（條件式）：本機 Markdown 寫作經驗談（tech-note；承 am-5 D.3）

| 欄位 | 值 |
|---|---|
| proposed title | 為什麼我把文章寫在本機 Markdown，而不是直接打在後台 |
| proposed slug | `why-local-markdown-first` |
| target content path | `content/blogger/posts/20260612-why-local-markdown-first.md` |
| category | `tech-note`（Blogger-valid） |
| tags | ⚠️ **無乾淨 Blogger-valid tech tag**（`github`/`vite`/`static-site` 皆 github-only）→ 只能勉強借 `self-growth`，或須新增 Blogger tech tag（**settings drift**） |
| why low risk | tech-note 經驗談；0 commerce；0 素材 |
| suitable for Batch 1 | ⚠️ **條件式**：tag 不 zero-drift；且須避免與 `portable-blog-system-mvp` SEO 樣本內容重疊 |
| commerce / affiliate | ❌ no |
| assets / downloads | ❌ no |
| expected complexity | 中 |
| risk level | **中**（tag drift 或內容重疊風險） |

### E.6 候選比較

| 候選 | category | tags（zero-drift？） | 主題軸 | 複雜度 | risk |
|---|---|---|---|---|---|
| 1 寫作時間管理 | `life-note` | `self-growth`(+`reading-notes`) ✅ | 時間 / 寫作 | 低–中 | 低 |
| 2 讀書筆記方法 | `life-note` | `reading-notes`+`self-growth` ✅ | 筆記方法 | 低 | 低 |
| 3 選書決策 | `life-note` | `reading-notes`+`self-growth` ✅ | 選擇 | 低 | 低 |
| 4 手機減法 | `life-note` | `self-growth`(+`reading-notes`) ✅ | 環境 / 習慣 | 低 | 低 |
| 5 本機 Markdown（tech-note） | `tech-note` | ⚠️ drift 風險 | 工具 / 寫作 | 中 | 中 |

> **誠實提醒（內容型態重複風險）**：zero-drift 約束（§D.1）把乾淨候選天然限縮在 `life-note` + `reading-notes`/`self-growth`，因此候選 1–4 主題軸雖各異（時間 / 筆記 / 選書 / 環境），仍同屬「閱讀・自我成長」生活心得家族。若 Batch 1 想納入**真正不同領域**（如純技術 / 教具 / 親子），須另開 **tags.json settings phase** 新增對應 Blogger-valid tag（屬 settings drift，不在本 plan zero-drift 路徑）。本 plan 在 zero-drift 前提下，以「主題軸區隔」降低重複感，但不假裝能在不動 settings 下達到跨領域多樣性。

---

## F. Recommended Batch 1 expansion set

**建議 expansion set = 候選 2 + 候選 1 + 候選 3（共 3 篇新文章）**，與已完成之 `daily-reading-habit-notes` 合計 **4 篇** → 落在正式 Batch 1 之 3～5 篇區間。

| 順位 | 候選 | slug | 主題軸 | 與既有區隔 |
|---|---|---|---|---|
| （已完成） | Batch 1a | `daily-reading-habit-notes` | 閱讀**習慣養成** | — |
| 1 | 候選 2 | `reading-notes-three-questions` | 讀書**筆記方法** | 不同：方法 vs 習慣 |
| 2 | 候選 1 | `after-work-writing-time-blocking` | **寫作 / 時間管理** | 不同：寫作 vs 閱讀 |
| 3 | 候選 3 | `how-i-choose-what-to-read-next` | **選書決策** | 不同：選擇 vs 習慣 / 方法 |

（候選 4「手機減法」列為**備援第 4 篇**，若想湊到 5 篇或某篇撰寫受阻時替補；候選 5 tech-note **不**納入第一波，避免 tag drift。）

### F.1 為什麼選這幾篇

- **全 zero settings drift**：3 篇皆 `life-note` + `reading-notes`/`self-growth`，無 `categories.json`/`tags.json` 變更，production warnings 維持 0。
- **主題軸彼此區隔**：習慣（daily-reading）/ 筆記方法（候選 2）/ 時間寫作（候選 1）/ 選書（候選 3）四個不同切角，降低「四篇都在講同一件事」之重複感。
- **複雜度全低 / 0 commerce / 0 新素材**：surface 最乾淨，AdSense slot 破版根因不與 affiliate / download UX 混淆。
- **形態與 guard 一致**：皆預期同 `daily-reading-habit-notes` 之最簡 life-note 形態（0 affiliate / 0 related-links / hashtags anchor）→ 未來納 guard 可直接複用既有 P1–P4 expectation 模板（articleAd6 1 / articleAd1to5 0 / noindex 0 / affiliateBox exact 0 / relatedLinks false / positionAnchor hashtags）。

### F.2 與 daily-reading-habit-notes 搭配後是否達 3～5 篇

✅ 達標：1（已完成）+ 3（新）= **4 篇**，落在 3～5 區間；候選 4 可選擇性湊到 5 篇。

### F.3 內容型態是否過度重複

⚠️ **部分**：四篇同屬 life-note 閱讀・自我成長家族（zero-drift 約束所致，§E.6）。緩解：四個不同主題軸 + 真實具體內容差異化。**若要真正跨領域**，須另開 settings(tag) phase——本 plan 明確**不**為了多樣性而硬塞 tech-note（tag drift）或 book-review（affiliate 複雜度）。

### F.4 是否都能使用現有 category/tag（無 settings drift）

✅ 是。3 篇推薦 set 全用既有 Blogger-valid category（`life-note`）+ tag（`reading-notes`/`self-growth`）；0 settings drift。

### F.5 是否都適合之後納入 guard target

✅ 是。預期皆為最簡 life-note 形態 → live-verified 後可逐篇加入 `check-blogger-adsense-output.js` 之 `TARGETS`（expectation 與 daily-reading 同模板），不需新增 check 邏輯。

---

## G. Per-post creation sequence（未來每篇獨立 phase）

> **每篇文章一個獨立 phase，不一次新增多篇**（per am-1 紅線：不在同一 session 混做多篇 rollout / source）。以下以推薦 set 順位排程；phase name 之時序碼啟動時決定。

### G.1 第 1 篇（候選 2：讀書筆記方法）

| 項目 | 內容 |
|---|---|
| proposed phase name | `20260612-XX-blogger-content-reading-notes-three-questions-one-post-content-a` |
| one new post file path | `content/blogger/posts/20260612-reading-notes-three-questions.md`（**僅此 1 檔**） |
| expected validation | `validate:content` **0 errors**；production warnings 維持 0（新 post 0 觸發）；總計 `0/94/84` 不變或合理說明 |
| expected build | `build:blogger` success |
| expected generated HTML slot verification | `dist-blogger/posts/reading-notes-three-questions/post.html`：恰 1 `lab-ad-slot--articleAd6` / 0 articleAd1–5 / data-ad-client·data-ad-slot strict-equal `ads.config.json` / 無 EJS leak / 0 noindex / 0 affiliate-box / 順序 body→ad→hashtags |
| add to guard after live verification | live repost + manual verification PASS 後，另開 guard-coverage phase 把該 slug 加入 `TARGETS`（NOT docs-only） |

### G.2 第 2 篇（候選 1：寫作時間管理）

| 項目 | 內容 |
|---|---|
| proposed phase name | `20260612-XX-blogger-content-after-work-writing-time-blocking-one-post-content-a` |
| one new post file path | `content/blogger/posts/20260612-after-work-writing-time-blocking.md` |
| expected validation | 同 G.1 |
| expected build | `build:blogger` success |
| expected generated HTML slot verification | `dist-blogger/posts/after-work-writing-time-blocking/post.html`：同 G.1 expected shape |
| add to guard after live verification | 同 G.1 |

### G.3 第 3 篇（候選 3：選書決策）

| 項目 | 內容 |
|---|---|
| proposed phase name | `20260612-XX-blogger-content-how-i-choose-what-to-read-next-one-post-content-a` |
| one new post file path | `content/blogger/posts/20260612-how-i-choose-what-to-read-next.md` |
| expected validation | 同 G.1 |
| expected build | `build:blogger` success |
| expected generated HTML slot verification | `dist-blogger/posts/how-i-choose-what-to-read-next/post.html`：同 G.1 expected shape |
| add to guard after live verification | 同 G.1 |

### G.4 （備援）第 4 篇（候選 4：手機減法）

| 項目 | 內容 |
|---|---|
| proposed phase name | `20260612-XX-blogger-content-phone-away-reading-time-one-post-content-a` |
| one new post file path | `content/blogger/posts/20260612-phone-away-reading-time.md` |
| 其餘 | 同 G.1（僅在想湊 5 篇 / 前述某篇受阻時啟動） |

---

## H. Acceptance criteria for each future one-post content phase

未來每篇新增文章之 content-mutation phase，須**同時**滿足：

- ✅ **only one new post file touched**：`git diff --name-only` 僅該 slug 之 `.md`（如需 `.publish.json` / `.fb.md` sidecar 則限同 slug；不碰其他 post）。
- ✅ **no source / settings / template drift**：`src/` / `content/settings/`（含 `categories.json` / `tags.json` / `ads.config.json`）/ `src/views/` / `package.json` / lockfile / `check-*.js` 全 0 變更。
- ✅ **no AdSense ID mutation**：未新增 / 未 hardcode real client / slot id；文章 body 無任何 ad markup。
- ✅ **validate:content pass**：0 errors；production warnings 維持 0。
- ✅ **build:blogger pass**。
- ✅ **generated post.html full + indexable + articleAd6 = 1**：`bloggerMode:"full"` / 0 noindex / 恰 1 `lab-ad-slot--articleAd6`。
- ✅ **articleAd1–5 = 0**。
- ✅ **no EJS leak**（`<%` / `%>` / `await include` = 0）。
- ✅ **no affiliate / commerce unless explicitly planned**（第一波 = 0 commerce；如要放須在該 phase 明文規劃且用 registry 既有 active `ref`）。
- ✅ **manual Blogger repost remains separate phase**：實際重貼 / publish 一律另開 execution phase（user approval + 備份 + theme CSS）。

> evidence one-liner（read-only node，不 hardcode real id）：對該 dist post.html 計 `lab-ad-slot--articleAd6` = 1、`lab-ad-slot--articleAd[1-5]` = 0、`data-ad-client`/`data-ad-slot` 比對 `ads.config.json`、grep `<%`/`%>` = 0。

---

## I. Future one-post → Batch 1 sequence（逐篇循環直到 3～5 篇）

> 每篇文章重複以下 7 步；達 3～5 篇 eligible 後才考慮 Batch 2。

1. **add post**（content-mutation phase；single new file；per §G/§H）。
2. **generated HTML verification**（rebuild + read-only one-liner / 既有 guard 模板驗 dist HTML）。
3. **manual repost packet**（docs-only；mirror am-7 Batch 1a packet；六項 pre-repost inputs + theme CSS gate）。
4. **user manual repost**（human operator 於 Blogger HTML 模式手動貼；本系統不執行；須 user approval + 備份）。
5. **manual verification record**（docs-only；mirror am-8 record；desktop + mobile + DevTools；記錄 slot present / fill / 破版）。
6. **add to guard target if appropriate**（live PASS 後，把該 slug 加入 `check-blogger-adsense-output.js` `TARGETS`；NOT docs-only；複用 P1–P4 模板）。
7. **repeat until Batch 1 has 3～5 posts**（含 daily-reading）。
8. **only then consider Batch 2**（候選擴至 10–20 篇；仍 per-post 手動；仍保留對照組；per am-1 §D.2）。

> 每篇之間維持節奏間隔（am-1 §F.11：同批每篇 repost 後等待 ≥30 分鐘；批次間 ≥24 小時）。

---

## J. Risks and stop conditions

| 風險 | 偵測 | 處理 / stop 條件 |
|---|---|---|
| **validation warnings**（新 post 觸發 production warning） | `validate:content` 對該 post 出現 warning（如 category/tag site-mismatch、frontmatter shape） | **STOP 該 content phase**；修正 frontmatter（用 Blogger-valid category/tag）或回報；不 commit 帶 warning 之 post |
| **settings drift**（誤動 categories.json / tags.json / ads.config.json） | `git diff --name-only` 出現 settings 檔 | **STOP**；還原 settings；改用既有 Blogger-valid 值；settings 變更須另開 phase |
| **noindex accidentally introduced** | dist HTML `noindex` 計數 ≠ 0；或 frontmatter 含 `seo.indexing:"noindex-*"` | **STOP**；移除 noindex；noindex+AdSense 屬 am-4 ⚠️ 政策範疇，不在 Batch 1 |
| **download / contentKind accidentally used** | frontmatter `contentKind:"download"` 或出現 `download.fileUrl` / `.lab-download-box` | **STOP**；download 形態 theme 未驗 + noindex fallback；不納入 Batch 1 |
| **generated HTML missing bottom slot** | dist HTML `lab-ad-slot--articleAd6` 計數 ≠ 1 | **STOP**；回 source / frontmatter 排查（mode 非 full？anchor 未 fire？）；不重貼 |
| **Blogger sanitizer strips attrs / script** | live DOM 無 `<ins>` / 無 inline push / 無 loader（DevTools） | **STOP rollout**；記錄 sanitizer behavior（屬 Blogger 平台限制，非 repo bug）；另開 failure analysis；不重貼更多篇 |
| **layout break**（桌機 / 手機破版） | live front-end 目視任一 device 破版 | **STOP rollout**；不在同 session 混做 source/theme fix；另開 theme phase |
| **duplicate slot**（多於 1 個 articleAd6） | dist 或 live DOM `articleAd6` > 1 | **STOP**；回 source 排查 anchor wiring；不重貼 |
| **real ad not filled but container exists** | live DOM 有 `<ins>` 但 visible 空白 / `data-ad-status` 非 filled | **非破版即可接受**；首載 / 短期 unfilled 屬正常 AdSense no-fill；多次 / 數小時仍 0 fill 屬 AdSense 後台範疇（另案監控），**不**做 repo rollback |
| **連續異常** | 連續 ≥3 篇 24 小時內無任何 fill / 任一 policy notice | **立即暫停所有後續批次**；通知 user；GitHub Pages live 不受影響 |

### J.1 When to rollback or pause

- **rollback（live Blogger）**：新文章 → revert to draft / 刪除；覆蓋既有 → 回貼備份 HTML（am-7 §L / am-1 §H）。
- **rollback（repo）**：**僅當** evidence one-liner 證明 repo 輸出本身錯誤時才回 source phase；不為 live fill 問題動 repo。
- **pause**：candidate pool 不足 / 任一 stop 條件觸發 / user 未 approval → 維持 baseline 不動（保守預設）。
- 🔴 **不**在同一 session 混做 rollout + source fix + guard 改動；**不**為 rollout 之便暫改 `ads.config.json` `surfaces`/`enabled`；**不**在 rollback 期間關閉 GitHub Pages 已 LIVE 之 AdSense（兩條 surface 線獨立）。

---

## K. Recommended next phases

| # | phase | 類型 | 目的 |
|---|---|---|---|
| K1（推薦主線） | `20260612-XX-blogger-content-reading-notes-three-questions-one-post-content-a` | content-mutation（single new file） | 撰寫 Batch 1 expansion 第 1 篇（候選 2）；per §G.1/§H；須 user approval |
| K2 | `20260612-XX-blogger-content-after-work-writing-time-blocking-one-post-content-a` | content-mutation（single new file） | 撰寫第 2 篇（候選 1）；於 K1 完成後 |
| K3 | `20260612-XX-blogger-adsense-batch-1-rollout-readiness-docs-only-a` | docs-only | 當累積 ≥3 篇 eligible 後，評估是否進入正式 Batch 1 rollout（readiness + 對照組規劃） |
| K4 | `20260612-XX-blogger-adsense-guard-coverage-expand-<slug>-a` | source（guard） | 對**已 live-verified** 之新 post 把 slug 加入 `TARGETS`（per §G「add to guard after live verification」；NOT docs-only） |
| K5（保守 / 預設） | conservative pause | — | 維持 baseline 不動；等 user 決定是否啟動 K1 撰寫 |

**推薦序**：K1（寫第 1 篇）→ 其 generated-HTML 驗證 → repost packet → user repost → verification record → K4（納 guard）→ 重複至 3～5 篇 → K3（rollout readiness）→ Batch 2。保守預設 K5。

🔴 **任何 live repost / Blogger 後台動作 / source / settings change，皆須 user explicit approval 後另開單一 phase。**

---

## L. Guardrails / non-actions（本 session 明確未做）

- ❌ no content / frontmatter mutation（未新增文章檔；6 篇既有 post 一律只讀；未改 draft / summary / noindex 狀態）
- ❌ no source / settings / template mutation（`src/` / `content/settings/`〔含 categories.json / tags.json / ads.config.json〕/ views / fixtures / `package.json` / lockfile / `check-*.js` 全未動）
- ❌ no Blogger access（未登入 / 未開編輯器 / 未開 AdSense 後台）
- ❌ no repost / no publish
- ❌ no external front-end verification（不依賴 / 不宣稱任何 live Blogger 新觀察）
- ❌ no AdSense ID mutation（未新增 / 未 hardcode real client / slot id）
- ❌ no dist commit（dist-blogger 產物不加入 git；read-only 驗證沿用既有 dist）
- ❌ no deploy / no push gh-pages / no `.cache` mutation
- ❌ no CLAUDE.md compression
- ❌ no `/memory`
- ❌ no unrelated cleanup
- ❌ no external Google AdSense policy claim（凡涉政策引 am-4 §E ⚠️ 待確認結論）

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 am-12（20260612）極小 ledger sync append。

read-only 量測（未造成 mutation）：`validate:content` 0/94/84、`check:blogger-adsense-output` 43/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0。

---

## M. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）；**不含**完整 real AdSense client id / slot id，亦無可重建 real id 之足夠線索。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
