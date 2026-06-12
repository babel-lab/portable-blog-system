# Blogger AdSense Phase F — Batch 1 候選文章盤點與解鎖條件

Phase: `20260612-am-2-blogger-adsense-phase-f-candidate-inventory-and-unblock-plan-docs-only-a`

## 1. Status

- **docs-only candidate inventory + unblock plan**
- 本 phase **不** repost / paste / publish / 開 Blogger 後台 / 開 AdSense 後台 / deploy / push gh-pages
- 本 phase **不**改 src / content / settings / fixtures / views / templates / package / lockfile / dist / .cache
- 本 phase **不**改 guard scope（`check-blogger-adsense-output.js` 維持 single-slug = `we-media-myself2`）
- 本 phase **不**新增或 hardcode real AdSense client / slot id
- 本 phase **不**修改任何文章 frontmatter 解鎖狀態；僅做盤點 + 解鎖選項分析
- 目的：把 am-1 Phase F batch rollout plan §D.1 之「候選池為空」之原因**結構化盤點**，並列出解鎖選項，讓下一個 phase 知道該往哪走

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律 `slotKey`（`articleAd6`）/ masked。real id 僅存於 `content/settings/ads.config.json`。

---

## A. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `2b1cae4` |
| origin/main | `2b1cae4` |
| ahead / behind | 0 / 0 |
| working tree | clean |
| latest subject | `docs(blogger): plan adsense batch rollout`（am-1 Phase F plan） |
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（normal baseline 不變） |
| production post 觸發之 warning 數 | **0**（所有 warnings 皆來自 `content/validation-fixtures/` fixture posts） |

Baseline 與本 session 預期完全一致；不做任何 fix。

---

## B. Current rollout state

### B.1 Batch 0（已鎖定，不再動）

| post slug | source markdown | manual verification | live repost timestamp |
|---|---|---|---|
| `we-media-myself2` | `content/blogger/posts/20260515-we-media-myself2.md` | ✅ PASS（Phase D night-1，docs/20260611-blogger-adsense-phase-d-manual-post-verification-record.md） | 20260611 22:42–22:59 |
| `github-pages-blog-planning` | `content/github/posts/20260504-github-pages-blog-planning.md` | ✅ PASS（docs/20260612-blogger-adsense-second-post-manual-verification-record.md） | 20260612 00:06 |

**Batch 0 lock 原則**：除非 source markdown 結構性變更 + 獨立 phase 明文授權，否則不再 repost。

### B.2 Batch 1 候選池當前為空之原因

per am-1 Phase F plan §D.1，production post pool 只有 3 篇 `status:"ready"` + Blogger enabled，其中：

1. 2 篇已 Batch 0 lock（`we-media-myself2` / `github-pages-blog-planning`）
2. 1 篇（`portable-blog-system-mvp`）為 `mode:"summary"` + `seo.indexing:"noindex-follow"` → 不滿足 am-1 §E 之「production status full」與「non-noindex」條件
3. 其餘 3 篇 production post 為 `status:"draft"` → 不在 ready pool

**重要區分**：

- ❌ 這 **不是** Blogger AdSense slot **實作失敗**。repo-side：`ads.config.json` 完整、`articleAd6`/`beforeRelatedLinks` Blogger surface 准入、build wiring live、dist HTML 對所有 ready+full post 皆正確生成、Batch 0 兩篇 live front-end 已驗證 fill。
- ✅ 真正瓶頸 = **可安全重貼的候選文章不足**：production content 池本身過小（總共 6 篇 post，其中 2 篇已 lock、1 篇政策爭議、3 篇 draft）。

---

## C. Candidate inventory method（只讀盤點）

### C.1 Ready 條件（須同時滿足）

| 欄位 | 期望值 |
|---|---|
| frontmatter `status` | `"ready"`（**不**為 `"draft"` / `"published"` / `"archived"`） |
| frontmatter `draft` | `false` |
| frontmatter `publishTargets.blogger.enabled` | `true` |

### C.2 Full Blogger post 條件

| 欄位 | 期望值 |
|---|---|
| frontmatter `publishTargets.blogger.mode` | `"full"`（**不**為 `"summary"` / `"redirect-card"`） |

`summary` / `redirect-card` 模式之 Blogger renderer **不**注入 `articleAd6` markup（per Phase D / second-post 兩次驗證之結論：summary CTA 卡片無 ad slot）。

### C.3 暫緩條件（任一觸發即暫緩）

| 條件 | 暫緩原因 |
|---|---|
| `seo.indexing` 為 `"noindex-follow"` / `"noindex-nofollow"` / 任何 noindex 變體 | noindex page 帶 AdSense 之政策相容性須獨立分析；本 Phase F 不做此決策 |
| `contentKind` 為 `"download"`（per CLAUDE.md SEO-1 fallback path，可能隱含 noindex） | 與 noindex 同樣須獨立決策 |
| frontmatter 含未實作之 `affiliate.blocks[]` Blogger-only 區段 + 無 production `commerce-links` registry 對應 | 雖然技術上 dist HTML 仍可產出，但 commerce / affiliate UX 同篇 + AdSense 同時驗證會把破版根因混在一起；本 Phase F 偏好乾淨 surface |
| `validate:content` 對該 post 觸發任何 non-advisory warning | 須先處理 warning 根因 |
| 該 post frontmatter / body 過去 7 日內結構性編輯（新文章除外） | 內容尚未穩定 |
| 該 post 為核心商業轉換 / 高流量入口 | 風險不對稱（per am-1 §E 候選選擇規則 5–6） |
| 該 post 引入 Batch 0 未涵蓋之新 CSS class group | 須先 theme readiness gate |

### C.4 盤點來源

- `content/blogger/posts/*.md`（site-blogger 來源）
- `content/github/posts/*.md`（site-github 但 `publishTargets.blogger.enabled:true` cross-publish 來源）
- `content/validation-fixtures/` 之 `_test-*.md` **排除**（fixture 不入候選池）
- `content/blogger/posts/*.fb.md`（FB sidecar）**排除**（非文章本體）
- `content/blogger/posts/*.publish.json`（publish sidecar）**排除**（非文章本體）

---

## D. Candidate table

> ⚠️ "warnings" 欄為 `validate:content` 對該 post 觸發之 warning 數（本次 baseline 全 production post = 0）；commerce complexity 為 frontmatter 觀察值（`affiliate.links[]` ref 數 + `affiliate.blocks[*].links[*]` ref 數合計）。

| # | slug | file | status | blogger.enabled | blogger.mode | github.enabled | github.mode | seo.indexing | contentKind | commerce refs | other complexity | warnings | recommended role | reason |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `we-media-myself2` | `content/blogger/posts/20260515-we-media-myself2.md` | ready | true | full | true | full | (none → default index) | `book-review` | 2 legacy `affiliate.links[]` + 4 `affiliate.blocks[]` = **6 commerce refs** | `affiliate.blocks[]` Blogger-only dual block；live cover image at blogger CDN | 0 | **Batch 0 locked** | per B.1；不再 repost 除非 source 結構性變更 |
| 2 | `github-pages-blog-planning` | `content/github/posts/20260504-github-pages-blog-planning.md` | ready | true | full | true | full | (none → default index) | `tech-note` | 0 | body 極短（單段） | 0 | **Batch 0 locked** | per B.1；不再 repost |
| 3 | `portable-blog-system-mvp` | `content/github/posts/20260504-portable-blog-system-mvp.md` | ready | true | **summary** | true | full | **`noindex-follow`** | `download` | 0 | 雙重暫緩條件（mode 與 noindex） | 0 | **deferred — needs separate content/seo decision** | 詳見 §E |
| 4 | `sample-book-review` | `content/blogger/posts/20260504-sample-book-review.md` | **draft** | true | full | (no github publishTarget) | — | (none specified) | `book-review` | template（`affiliate.enabled:true` but `affiliate.links:[]` 空） | book frontmatter 全空（title / author / publisher / isbn / cover 皆空字串）；body 僅一行佔位 | 0 | **draft — needs content authoring phase** | 本體為 template 樣本，無真實書評內容；提升為 ready 須先補完整書摘 + book metadata + 至少 1 個 commerce ref |
| 5 | `draft-book-review` | `content/blogger/posts/20260525-draft-book-review.md` | **draft** | true | full | false | — | (none specified) | `book-review` | template（`affiliate.enabled:true` but `affiliate.links:[]` 空） | book frontmatter 全空；body 標記 `<!-- TODO: 待填書評內容 -->` | 0 | **draft — needs content authoring phase** | 同 #4，但更明確標 TODO；提升為 ready 須補書摘 + book metadata + commerce refs |
| 6 | `phonics-practice-sheet-download` | `content/blogger/posts/20260529-phonics-practice-sheet-download.md` | **draft** | true | full | **false** | — | (none specified) | `download` | 0 | `download.fileUrl` 空字串；`download.enabled:true` but fileUrl 未上線；relatedLinks 已有 1 筆 internal cross-link 至 GitHub Pages | 0 | **draft — also has download asset dormant + noindex fallback risk** | 同 #4/#5 draft 限制；額外因 `contentKind:"download"` 觸發 SEO-1 fallback → 與 #3 portable-blog-system-mvp 共享 noindex 政策爭議；提升為 Batch 1 candidate 須同時解決 draft→ready / download asset / noindex 三重議題 |

### D.1 統計摘要

| 類別 | 數量 |
|---|---|
| Production post 總數 | 6 |
| 已 Batch 0 lock | 2（# 1, 2） |
| `status:"ready"` 但非 Batch 0 lock | 1（# 3） |
| `status:"draft"` | 3（# 4, 5, 6） |
| **目前 Batch 1 eligible candidate count** | **0** |

→ 與 am-1 Phase F plan §D.1 結論一致。

---

## E. portable-blog-system-mvp 單獨分析

### E.1 為什麼目前不該直接納入 Batch 1

| 衝突 | 與 am-1 §E 候選選擇規則之衝突 |
|---|---|
| `publishTargets.blogger.mode:"summary"` | 違反規則 1（須 `mode:"full"`） |
| `seo.indexing:"noindex-follow"` | 違反規則 4（非 noindex） |
| `contentKind:"download"` | 與規則 3（theme class set）相關：Batch 0 已涵蓋 `book-review`（we-media-myself2）+ `tech-note`（github-pages-blog-planning）兩種形態；`download` 形態之 theme CSS（如 `.lab-download-box`）尚未在 Batch 0 live front-end 驗證 |

### E.2 解鎖條件（同時須滿足）

1. **mode 決策**：將 `publishTargets.blogger.mode` 由 `"summary"` flip 至 `"full"`。
   - precedent：second-post 之 `github-pages-blog-planning` 已有 `summary→full` flip 之 commit `45c403a`，1 行 frontmatter change，可作為 mechanism 樣板。
   - 影響 1 行 frontmatter，不影響其他文章。
2. **noindex 政策決策**（**獨立必要條件**）：
   - 目前 frontmatter explicit 設 `seo.indexing:"noindex-follow"`（per Phase 20260520-seo-2 樣本，刻意保留以驗證 SEO-2 precedence 第一優先）。
   - 同時 `contentKind:"download"` 會走 SEO-1 fallback 至同向 `noindex,follow`。
   - **noindex page 上是否能放 AdSense**屬 Google AdSense 政策範疇，不在本 repo 可單方面決定。須**獨立 preanalysis phase** 釐清：
     - AdSense 政策對 noindex page ad placement 之明文規定
     - 若 noindex page 不允許 AdSense → 須將 `seo.indexing` 改為 `index` / 移除 noindex 標記，但這違反 #3 之 Phase 20260520-seo-2 / seo-1 設計意圖
     - 若 noindex page 允許 AdSense → 可保留 noindex 但須評估該 post 之**廣告收益 ROI**（noindex 通常代表低流量）
3. **theme readiness gate**（**獨立必要條件**）：
   - 確認 `download` contentKind 之 Blogger dist HTML 不引入 Batch 0 未涵蓋之新 CSS class group。
   - 若引入新 class group → 須先補 theme CSS readiness check。

### E.3 屬於哪種 phase

- **不是** Blogger repost packet phase（在 repost packet 之前，須先確定該 post 是否能進入候選池）。
- **是 content/frontmatter + SEO 政策 preanalysis phase 的組合**：
  1. 先 docs-only preanalysis：釐清 noindex + AdSense 政策、ROI 評估、theme readiness 預測
  2. user 決策後（若決議納入候選池）→ 獨立 content-change phase：1 行 frontmatter flip（mode 與 / 或 indexing）+ rebuild + dist evidence one-liner
  3. content-change 完成後 → 才能進入 Batch 1 repost packet phase

→ **本 phase 明確不做以上任一改動**。

---

## F. Batch 1 unblock options

### Option 1：維持暫停，等更多 full Blogger posts ready

**操作方式**：本 Phase F 之 Batch 1 sub-phase **無限期 pending**，直至下列任一發生：

- 新增至少 3 篇 production-ready Blogger-target post（`status:"ready"` + `publishTargets.blogger.enabled:true` + `mode:"full"`，主題避開核心商業轉換 / 高流量）
- 或 §E 政策 + content 解鎖至少 1–2 篇 deferred / draft post

**好處**：

- ✅ 0 風險：完全不動 repo
- ✅ 完全符合 am-1 Phase F plan §E 候選選擇規則（無妥協）
- ✅ 自然解鎖路徑：日後新內容上架時自動解鎖
- ✅ 不需要做任何政策 / theme 決策

**風險 / 代價**：

- ⚠️ Phase F rollout 停滯，沒有時間表
- ⚠️ Batch 0 兩篇之間 (we-media-myself2 / github-pages-blog-planning) 之外無新 Blogger AdSense 收益增長
- ⚠️ 解鎖時點完全取決於內容 production，不在 Phase F 規畫範圍

**驗收方式**：

- 每次新 phase 啟動時，重做本 phase 之 candidate inventory 表（§D）
- 當 §D 表出現至少 1 筆 "Batch 1 eligible" → 進入下一階段

### Option 2：開 content/frontmatter docs/source phase，把 1–3 篇文章升級成 Batch 1 eligible

**操作方式**：分子 phase 序列（各為 docs-only 或 single-file source phase；不混做）：

1. `20260612-am-3-blogger-adsense-phase-f-batch-1-candidate-unblock-content-plan-docs-only-a`（docs-only）：
   - 對 3 篇 deferred / draft post 各做獨立 unblock 路徑分析
   - 對 `portable-blog-system-mvp`：詳列 §E.2 之 noindex 政策 preanalysis + theme readiness 預測 + ROI 評估
   - 對 `sample-book-review` / `draft-book-review`：列出補完 book metadata + 書摘 body + commerce refs 所需的 minimum viable content scope
   - 對 `phonics-practice-sheet-download`：補完 download asset upload + noindex 政策（與 #3 共用）+ download 形態 theme readiness
   - 輸出：per-post unblock checklist + 預期 effort + 解鎖優先序建議
   - **不**改任何 frontmatter / content
2. 後續 single-post content-change phase（個別啟動，須 user explicit approval；每篇一個 phase）：
   - 對 user 選定的 post 做 minimum-scope content change（補 metadata / flip mode / 調 indexing）
   - 跑 `validate:content` 確認 0 errors / 不增加 warnings
   - 跑 `build:blogger` 確認 dist HTML 正確生成 `articleAd6`
   - **不**進入 Blogger 後台
3. 全 content-change 結束後，才進入 `batch-1-repost-packet` phase。

**好處**：

- ✅ 有時間表 / 可規畫
- ✅ 為 portable-blog-system-mvp 釐清 noindex 政策（之後其他 noindex post 都受惠）
- ✅ draft post 提升為 ready 後也擴大 Blogger 內容總量
- ✅ Batch 1 候選池質量可控（user 主動選擇而非被動等待）

**風險 / 代價**：

- ⚠️ 需要 user explicit 決策（noindex 政策、書評內容是否補完、download asset 是否上傳）
- ⚠️ 時程不確定（取決於 user 補內容 / 政策研究速度）
- ⚠️ 若 noindex 政策 preanalysis 結論為「noindex page 不可放 AdSense」→ portable-blog-system-mvp 整篇從候選池移除
- ⚠️ 需要 content production work，非純 phase 規劃

**驗收方式**：

- 每篇 content-change phase 後：`validate:content` 0/94/84 不變、`build:blogger` 成功、`dist-blogger/posts/<slug>/post.html` 通過 §G manual node one-liner
- 全 content-change 完成後：§D candidate table 出現至少 1–3 筆 "Batch 1 eligible"

### Option 3：只做 1 篇 mini-batch，但需明確標示不是 3–5 篇 Batch 1

**操作方式**：

- 選定 §D 表中 **最低風險** 之 deferred / draft post 1 篇，做最小 scope content change 至 Batch 1 eligible。
- 候選最低風險者排序：
  1. `portable-blog-system-mvp`（最近）— 已 ready，只缺 mode flip + noindex 決策；但 noindex 決策 = blocker
  2. `sample-book-review` / `draft-book-review` — draft 但 mechanism 簡單；惟須補完內容才能對外發布
  3. `phonics-practice-sheet-download` — 複雜度最高（download asset + noindex + draft 三重）
- **重要**：此 mini-batch 之定位為 **"Batch 1 試水"**，不是 Batch 1 本體；命名為 **Batch 1a**，明文標示。
- Batch 1a → 24 小時觀察 → 再決定是否續做 Batch 1 / Batch 1b。

**好處**：

- ✅ 維持 rollout 動能，但風險最小化
- ✅ 1 篇 mini-batch 之 live verification 樣本可以驗證額外 contentKind 形態（如果選 download / 還未驗證形態）
- ✅ 不違反 am-1 Phase F plan §D.4 之暫停條件

**風險 / 代價**：

- ⚠️ 與 Option 2 共享需要 user explicit 決策（同樣需要解鎖 1 篇）
- ⚠️ 1 篇樣本不具批次代表性，下一步仍須擴大
- ⚠️ 若選 `portable-blog-system-mvp` → 須先解 noindex blocker
- ⚠️ 若選 draft post → 須先補完內容；effort 不見得比 Option 2 全套小

**驗收方式**：

- 選定 post 之 content-change phase 後驗收同 Option 2 之 per-post 驗收
- live repost 後須做完整 manual verification record（mirror Phase D night-1 / second-post night-1 結構）
- 24 小時觀察期內無破版 / 無 fill 異常 / 無 AdSense 政策通知

### Option comparison

| 選項 | repo 動作 | 內容動作 | 政策決策 | live 動作 | 時間線 | 風險 |
|---|---|---|---|---|---|---|
| Option 1 | 無 | 無 | 無 | 無 | 開放式 | 最低 |
| Option 2 | docs-only + 多次 single-file content change | 補完 1–3 篇 | noindex preanalysis 必須 | 之後 batch-1-repost-packet 才考慮 | 中長期 | 中 |
| Option 3 | docs-only + 1 次 single-file content change | 補完 1 篇 | 若選 portable-blog-system-mvp 須 noindex preanalysis | 1 篇 live repost | 短期 | 中 |

---

## G. Recommended next phase

### G.1 主線（推薦）

**`20260612-am-3-blogger-adsense-phase-f-batch-1-candidate-unblock-content-plan-docs-only-a`**（Option 2 之第 1 步）

預期內容（docs-only；下一個 Claude session 執行）：

1. 重做 baseline verify（HEAD 應為本 phase commit）
2. 對 §D 表中 4 篇 non-Batch-0 post 各做獨立 unblock 路徑分析：
   - `portable-blog-system-mvp` — noindex 政策 preanalysis 子計畫；theme readiness 預測（download contentKind）；ROI 評估（noindex 通常低流量）
   - `sample-book-review` — book metadata 補完清單 + body 書摘 minimum viable scope + 至少 1 個 commerce ref（重用 we-media-myself2 ref 或新 seed？）
   - `draft-book-review` — 同 sample-book-review
   - `phonics-practice-sheet-download` — download asset 上傳路徑（Google Drive / Blogger image / 其他）+ noindex 政策（與 #3 共用結論）+ download 形態 theme readiness
3. 對每篇給出：
   - per-post unblock checklist（minimum viable scope）
   - 預期 phase 數量與順序
   - 預期 effort（low / medium / high）
   - 解鎖優先序建議
4. **不**改任何 frontmatter / content / theme / settings / src
5. **不**做 noindex 政策 final 決策；只整理 preanalysis 資料供 user 後續決策
6. **絕不**開 Blogger / paste / publish

### G.2 候選保守路徑

**Option 1（維持暫停）**：若 user 認為現階段不需要強推 Batch 1，可以選擇此路徑：

- 不啟動 `am-3-...content-plan`
- 等待新內容自然產出
- 每次新 phase 啟動時，重做本 phase 之 candidate inventory 表

→ 本文件 §F 已留下完整 Option comparison 供 user 後續決策。

### G.3 並行 / 不衝突

**`20260612-XX-blogger-adsense-guard-parameterization-preanalysis-docs-only-a`**（per night-1 record §13 推薦；am-1 §I 確認）：

- repo-side automated guard 涵蓋擴展
- docs-only preanalysis（Option A CLI / Option B registry / Option C ready-full traversal）
- 不阻塞本 Phase F 之 Batch 1 解鎖路徑

🔴 **任何 live repost / Blogger 後台動作 / source change，皆須 user explicit approval 後另開單一 phase。** 不在本 Phase F 範圍。

---

## H. Guardrails / non-actions（本 session 明確未做）

- ❌ 未登入 Blogger / 未開 Blogger 編輯器 / 未開 AdSense 後台
- ❌ 未 paste / publish / repost
- ❌ 未做外部前台驗證（不依賴 / 不宣稱完成任何 live Blogger 觀察）
- ❌ 未 deploy / 未 push gh-pages
- ❌ 未改 `src/` 任何 script
- ❌ 未改 任何 EJS template
- ❌ 未改 `content/settings/ads.config.json`
- ❌ 未改 `package.json` / lockfile
- ❌ 未改 `src/scripts/check-blogger-adsense-output.js`
- ❌ 未做 guard 參數化
- ❌ 未改 任何 content markdown / frontmatter / fixture
- ❌ 未新增或 hardcode 真實 AdSense ID
- ❌ 未做 build:blogger / build:github（本 phase 為 docs-only，read-only baseline 驗證僅跑 `validate:content`）
- ❌ 未跑 `check:adsense-resolver` / `check:adsense-article-block` / `check:adsense-anchor-wiring` / `check:blogger-adsense-output`（無 source / settings 變更則 carry forward 前 phase measurement）
- ❌ 未碰 commerce / Admin / renderer / GitHub Pages live
- ❌ 未做 CLAUDE.md compression
- ❌ 未使用 `/memory`
- ❌ 未做 unrelated cleanup

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 am-2（20260612）極小 ledger sync。

---

## I. Real-ID masking confirmation

本文件全文僅出現：

- `articleAd1` / `articleAd6`（policy key，非 id）
- `beforeRelatedLinks` / `afterHeader` / `afterCover` / `afterBookPhoto` / `afterAffiliateTop` / `beforeAffiliateBottom`（anchor key，非 id）
- **不含**完整 real AdSense client id、完整 real AdSense slot id

real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
