# Blogger AdSense — Batch 1 Rollout Readiness

Phase: `20260612-pm-6-blogger-adsense-batch-1-rollout-readiness-docs-only-a`

## 1. Status

- **docs-only readiness assessment**。
- 本 phase **不**新增文章、**不**改 content / frontmatter / source / settings / template / guard / fixtures / views / package / lockfile / dist / gh-pages / `.cache`。
- 本 phase **不**登入 Blogger、**不**重貼、**不**發布、**不**做外部前台驗證、**不**改 AdSense real id。
- 本 phase **不**執行 Batch 2 implementation；只能列 recommendation。
- 目的：評估目前是否可將 **Batch 1 視為完成 / ready**，並提出下一步是停在 3 篇、補第 4 篇、還是進入 Batch 2 preanalysis。

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律以 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）/ masked（`ca-pub-…****`）表述。real id 僅存於 `content/settings/ads.config.json`。

> ⚠️ 本文件之「live PASS」一律指 human operator 已在 Blogger 前台 + DevTools 完成之手動觀察（已記於對應 verification record doc）；repo-side guard 通過 **不等於** live 已驗證。

---

## A. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `1cc0ab2` |
| origin/main | `1cc0ab2` |
| ahead / behind | 0 / 0 |
| working tree | clean（assessment 撰寫前） |
| latest subject | `test(blogger): add after work adsense guard target`（pm-5 guard 第五 target） |

Baseline 與 user 期望一致（branch=main、HEAD==origin/main==`1cc0ab2`、working tree clean）；不做任何 fix。

See also：
- `docs/20260612-blogger-adsense-phase-f-batch-rollout-plan.md`（am-1 Phase F 批次節奏 + 候選規則 + 暫停條件 + rollback）
- `docs/20260612-blogger-adsense-phase-f-batch-1-expansion-plan.md`（am-12 Batch 1 expansion plan；3～5 篇 low-risk 規劃）
- `docs/20260612-blogger-adsense-batch-1a-daily-reading-manual-verification-record.md`（am-8 Batch 1a live PASS）
- `docs/20260612-blogger-adsense-batch-1-reading-notes-manual-verification-record.md`（am-15 Batch 1 expansion #1 live PASS）
- `docs/20260612-blogger-adsense-batch-1-after-work-writing-manual-verification-record.md`（pm-4 Batch 1 expansion #2 live PASS）
- `docs/20260612-blogger-adsense-guard-parameterization-preanalysis.md`（am-9 guard 多 target 設計）
- `src/scripts/check-blogger-adsense-output.js`（am-10/am-11/pm-1/pm-5 multi-target guard；現 5-target，本 phase 不動）

---

## B. Current verification inventory

| slug | type / form | live verification | bottom slot result | layout result | sanitizer / attrs 觀察層級 | guard TARGETS coverage | role |
|---|---|---|---|---|---|---|---|
| `we-media-myself2` | book-review；雙 affiliate-box + related-links + hashtags（**複雜**形態） | ✅ live PASS（Phase D night-1，20260611 22:42–22:59） | present；real ad（第 2 次 fill 成功） | no break | DevTools：`<ins>` / `lab-ad-slot--articleAd6` / masked data attrs / loader 存活 | ✅ covered | **Batch 0** |
| `github-pages-blog-planning` | tech-note（github 主寫 cross-publish；mode flip→full）；短 body + hashtags（**簡**形態） | ✅ live PASS（second-post night-1，20260612 00:06） | present；one image ad render | no break | live 目視；AdSense 圖像廣告於 hashtag 前 | ✅ covered | **Batch 0** |
| `daily-reading-habit-notes` | life-note；0 affiliate / 0 related-links（**生活心得**最簡形態） | ✅ live PASS（am-8，20260612 10:48） | present；real ad / filled（`data-ad-status="filled"`） | no break；desktop OK / mobile OK | DevTools：`ins.adsbygoogle` / `lab-ad-slot--articleAd6` / masked data attrs / `filled` / loader 存活 | ✅ covered | **Batch 1 low-risk** |
| `reading-notes-three-questions` | life-note；0 affiliate / 0 related-links（**最簡**形態） | ✅ live PASS（am-15，20260612 11:48） | present；real ad / filled | no break；desktop OK / mobile OK | DevTools：`ins.adsbygoogle` / `lab-ad-slot--articleAd6` / masked data attrs / `filled` / loader 存活 | ✅ covered | **Batch 1 low-risk** |
| `after-work-writing-time-blocking` | life-note；0 affiliate / 0 related-links（**最簡**形態） | ✅ live PASS（pm-4，20260612 12:25） | present；real ad / filled | no break；desktop OK / mobile OK | DevTools：`ins.adsbygoogle` / `lab-ad-slot--articleAd6` / masked data attrs / `filled` / ad iframe / loader 存活 | ✅ covered | **Batch 1 low-risk** |

統計：live-verified Blogger AdSense post **5 篇**（Batch 0 = 2；Batch 1 low-risk = 3）；automated guard `TARGETS` 覆蓋 **5 / 5**。

> 形態多樣性：複雜書評（we-media-myself2）+ tech-note 簡形態（github-pages-blog-planning）+ 三篇 life-note 最簡形態（daily-reading / reading-notes / after-work-writing）。**尚未涵蓋** download / page / comic / noindex / commerce-heavy 形態。

---

## C. Batch 1 definition recap

正式 Batch 1 之條件（per am-1 Phase F rollout plan §E + am-12 expansion plan §C）：

| # | 條件 |
|---|---|
| 1 | **3～5 篇** low-risk post |
| 2 | **full**（`publishTargets.blogger.enabled:true` + `mode:"full"`） |
| 3 | **indexable**（無 `seo.indexing:"noindex-*"`） |
| 4 | **ready**（`status:"ready"` + `draft:false`） |
| 5 | **non-placeholder**（真實標題 / 真實 body / 真實 description；無 TODO / 佔位） |
| 6 | **normal article**（一般文章形態） |
| 7 | **no download contentKind**（不需 download theme readiness gate） |
| 8 | **no noindex**（noindex + AdSense 屬獨立政策決策，不入 Batch 1） |
| 9 | **no affiliate / commerce preferred**（避免 ad 與 affiliate UX 同篇干擾；surface 最乾淨） |
| 10 | **no layout break**（live 桌機 + 手機皆無破版） |
| 11 | **no duplicate slot**（DOM 內恰 1 個 `articleAd6`；0 個 `articleAd1`–`articleAd5`） |
| 12 | **guard covered after live PASS**（live PASS 後才納入 `check-blogger-adsense-output.js` `TARGETS`） |

---

## D. Batch 1 readiness assessment

| 判斷項 | 結論 |
|---|---|
| 是否已達 3 篇 low-risk live PASS | **YES**（daily-reading / reading-notes / after-work-writing） |
| 三篇是否符合 full / indexable / ready / non-placeholder | **YES**（三篇 frontmatter 皆 `status:"ready"` / `draft:false` / blogger `mode:"full"` / 無 `seo.indexing` / 真實 ~1100–1200 字 body） |
| 是否皆無 download / noindex / affiliate / commerce | **YES**（三篇皆 `contentKind:"life-note"`；0 affiliate-box；0 commerce ref；0 download；0 noindex） |
| 是否皆已 live front-end verified | **YES**（三篇皆 desktop + mobile OK；bottom slot present；real ad / filled；no layout break） |
| 是否皆已 guard covered | **YES**（三篇皆在 `check-blogger-adsense-output.js` `TARGETS`；guard 71/0） |
| **是否可視為正式 Batch 1 minimum complete** | **YES — Batch 1 minimum（3 篇 low-risk live PASS）已達成。** 三篇皆滿足 C 表 12 條全部條件。 |
| 是否應直接全量 rollout | **NO**（仍須保守小批次；Batch 2 須另開 preanalysis，不可直接執行） |

**結論**：以「3 篇 low-risk full/indexable/ready/non-placeholder + live PASS + guard covered」之定義，**Batch 1 minimum 視為完成 / ready**。但此**不代表** Batch 2 / 全量 rollout 已完成，亦不代表已涵蓋所有 contentKind 形態。

---

## E. Guard readiness

- `check:blogger-adsense-output` 現涵蓋 **5 targets**：`we-media-myself2` / `daily-reading-habit-notes` / `github-pages-blog-planning` / `reading-notes-three-questions` / `after-work-writing-time-blocking`。
- expected result **71 / 0**（1 settings invariant + 14 case × 5 target）。
- **3 篇 low-risk Batch 1 post 全部 represented**（daily-reading / reading-notes / after-work-writing）。
- **複雜 legacy verified form 亦 represented**（we-media-myself2：雙 affiliate-box + related-links + `positionAnchor:relatedLinks`）。
- **tech-note form 亦 represented**（github-pages-blog-planning）。
- **real AdSense id not hardcoded**：guard 從 `content/settings/ads.config.json` 讀 `adsenseClient` / `slots.articleAd6` 做 strict-equal；source grep 0 個 real `ca-pub-<digits>` / real slot literal。
- ⚠️ guard 是 **repo-side safety**（驗 generated `dist-blogger/.../post.html` 結構），**不取代** live verification（live DOM / fill / 破版仍須 human operator 觀察）。

---

## F. Risk assessment（仍存在之風險）

1. **real ad fill may vary** — live `data-ad-status="filled"` 為單一 time-point 觀察；AdSense 競價 / 審核 / 地區 / 裝置 / 時間皆可能影響，不代表長期恆 fill。
2. **mobile check partly user-reported** — 三篇 mobile result 皆由 user manually checked，**未附手機截圖**（僅 desktop Chrome 截圖）。
3. **only 3 low-risk posts, not all article types** — 已驗形態 = 複雜書評 + tech-note + 三篇 life-note；**未涵蓋** download / page / comic / 多圖 / 長表格等形態。
4. **no download / noindex / commerce-heavy Batch 1 inclusion** — 這些形態之 live AdSense 行為（含政策面）尚未 sampled；Batch 2 不可預設沿用 Batch 1 結論。
5. **Blogger sanitizer could vary across future edits** — 目前 5 篇皆未觀察到 strip，但 Blogger 視覺編輯器 / 未來 theme 變更 / 不同瀏覽器仍可能改變行為。
6. **future posts still need per-post generated HTML + live verification** — 每篇新文章仍須 rebuild + dist 結構驗證 + live 前台驗證，不可只靠 guard 通過就視為 live OK。
7. **Batch 2 should not skip manual verification** — 擴大批次時仍須每篇手動 repost + 每篇單獨 verification record；不批次自動化、不略過人工目視。

---

## G. Decision options

### Option A — Accept Batch 1 minimum complete at 3 low-risk posts and pause

- **Pros**：最保守；已達 Batch 1 下限；避免一次擴張風險；保留觀察窗讓 5 篇 live 行為穩定後再決定。
- **Cons**：Batch 1 形態多樣性仍偏低（集中 life-note）；商業化覆蓋面成長停滯。
- **Required next phase**：`20260612-XX-blogger-adsense-batch-1-completion-record-docs-only-a`（docs-only completion record，正式宣告 Batch 1 minimum complete）。

### Option B — Add 1 more low-risk post (expand Batch 1 to 4 posts)

- **Pros**：Batch 1 由下限 3 篇升到 4 篇，更穩健；am-12 expansion set 已預列第 3 篇 `how-i-choose-what-to-read-next`（life-note，zero-drift）。
- **Cons**：仍是 life-note 同家族，形態多樣性不會顯著提升（zero-drift 約束所致）；多一輪 content + repost + verification + guard 工序。
- **Required next phase**：`20260612-XX-blogger-content-how-i-choose-what-to-read-next-one-post-content-a`（single new file；須 user explicit approval）→ 之後 repost packet → manual verification → guard target addition。

### Option C — Start Batch 2 preanalysis, but do not execute

- **Pros**：開始規劃較大批次（10–20 篇）+ 對照組策略 + download/noindex/commerce 形態之政策與 theme readiness 評估；不實際重貼，零 live 風險。
- **Cons**：目前 production candidate pool 偏少（Batch 0 lock 2 + Batch 1 已用 3 + `portable-blog-system-mvp` summary+noindex deferred + 數篇 draft）；Batch 2 真正執行前仍須先補內容；preanalysis 結論可能停在「等更多內容」。
- **Required next phase**：`20260612-XX-blogger-adsense-batch-2-preanalysis-docs-only-a`（docs-only；只規劃不執行；明文標示不得直接 rollout）。

---

## H. Recommended decision（保守推薦）

**保守推薦如下**：

1. **將 Batch 1 minimum 視為完成 / ready**（3 篇 low-risk full/indexable/ready/non-placeholder + live PASS + guard covered，已滿足 C 表全部條件）。
2. **不立即全量 rollout**（維持 Phase F 小批次保守節奏）。
3. **可先做 Batch 1 completion record（docs-only）**（Option A），正式封存 Batch 1 minimum。
4. **若使用者還有時間，再補第 4 篇 low-risk post**（Option B，`how-i-choose-what-to-read-next`），讓 Batch 1 更穩健。
5. **Batch 2 需另開 preanalysis，不可直接執行**（Option C 僅規劃；download / noindex / commerce 形態須先各自獨立評估政策 + theme readiness）。

→ 主線建議：**Option A（completion record）**為下一步；**Option B**為可選加強；**Option C**僅在使用者明確要擴大規模時才啟動，且止於 preanalysis。

---

## I. Acceptance criteria for declaring Batch 1 complete

宣告 Batch 1 complete 須**同時**滿足：

| # | 條件 | 現況 |
|---|---|---|
| 1 | docs record exists（completion record doc） | ⏳ 待 Option A completion-record phase 產出 |
| 2 | 3 low-risk posts live PASS | ✅ daily-reading / reading-notes / after-work-writing |
| 3 | all three guard-covered | ✅ 三篇皆在 `TARGETS`（71/0） |
| 4 | validate / checks pass | ✅ validate 0/94/84；blogger-output 71/0；resolver 34/0；article-block 13/0；anchor-wiring 14/0 |
| 5 | no source / content drift | ✅ 本 phase docs-only；working tree 僅新 doc + CLAUDE.md ledger |
| 6 | no pending rollback | ✅ 三篇 verification record 皆 rollback NO |
| 7 | user accepts Batch 1 minimum as complete | ⏳ 待 user 確認（completion record phase 記錄） |

→ 第 2–6 項已達成；第 1、7 項待 Option A completion-record phase + user 確認。

---

## J. Recommended next phases

1. **`20260612-XX-blogger-adsense-batch-1-completion-record-docs-only-a`**
   - 目的：正式宣告 Batch 1 minimum complete（docs-only completion record；補齊 §I 第 1、7 項）。**保守主線推薦。**
2. **`20260612-XX-blogger-content-how-i-choose-what-to-read-next-one-post-content-a`**
   - 目的：補第 4 篇 low-risk full post（single new file；須 user explicit approval）。
3. **`20260612-XX-blogger-adsense-batch-2-preanalysis-docs-only-a`**
   - 目的：規劃 Batch 2（10–20 篇 + 對照組 + download/noindex/commerce 形態政策評估）；**只規劃不執行**。
4. **`20260612-XX-blogger-adsense-post-batch-1-monitoring-checklist-docs-only-a`**
   - 目的：建立 Batch 1 五篇之 24h / 7d live 觀察清單（fill / 破版 / policy notice / console）；docs-only。
5. **conservative pause** — 維持 baseline 不動，等決定批次節奏後再推進。

🔴 任何 live repost / Blogger 後台動作 / source / settings / guard change，皆須 user explicit approval 後另開單一 phase；不在本 readiness phase 範圍。

---

## K. Guardrails / non-actions（本 session 明確未做）

- ❌ no content / frontmatter mutation（5 篇 post 一律只讀未動）
- ❌ no source / settings / template / guard mutation（`src/` / `content/settings/` / `src/views/` / `check-blogger-adsense-output.js` / fixtures / package / lockfile 全未動）
- ❌ no Blogger access（未登入 / 未開編輯器 / 未開 AdSense 後台）
- ❌ no repost / no publish
- ❌ no external front-end verification（不依賴 / 不宣稱任何新 live Blogger 觀察；僅引用既有 verification record）
- ❌ no AdSense ID mutation（未新增 / 未 hardcode real client / slot id）
- ❌ no dist commit（`dist-blogger` 產物不加入 git）
- ❌ no deploy / no push gh-pages / no `.cache` mutation
- ❌ no Batch 2 implementation（僅列 recommendation）
- ❌ no CLAUDE.md compression
- ❌ no `/memory`
- ❌ no unrelated cleanup

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 pm-6（20260612）極小 ledger sync append。

read-only 量測（未造成 mutation）：`validate:content` 0/94/84、`check:blogger-adsense-output` 71/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0。

---

## L. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）、`ca-pub-…****`（masked）；**不含**完整 real AdSense client id / slot id。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
