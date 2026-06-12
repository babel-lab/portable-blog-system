# Blogger AdSense Phase F — Batch 1 候選文章解鎖內容計畫

Phase: `20260612-am-3-blogger-adsense-phase-f-batch-1-candidate-unblock-content-plan-docs-only-a`

## Status

- **docs-only unblock content plan**（接續 am-2 candidate inventory）
- 本 phase **不** repost / paste / publish / 開 Blogger 後台 / 開 AdSense 後台 / deploy / push gh-pages
- 本 phase **不**改 src / content / settings / fixtures / views / templates / package / lockfile / dist / `.cache`
- 本 phase **不**改任何文章 frontmatter 解鎖狀態（draft / summary / noindex 一律維持原狀）
- 本 phase **不**改 guard scope（`check-blogger-adsense-output.js` 維持 single-slug = `we-media-myself2`）
- 本 phase **不**新增或 hardcode real AdSense client / slot id
- 本 phase **不**做 noindex / SEO policy final 決策；只整理 preanalysis 資料供 user 後續決策
- 目的：對 am-2 §D 表中 4 篇 non-Batch-0 production post 各做獨立 unblock 路徑分析，輸出 per-post unblock checklist + 預期 effort + 解鎖優先序，讓 user 決定要不要、以及怎麼解鎖 Batch 1 候選池

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）/ masked。real id 僅存於 `content/settings/ads.config.json`。

---

## A. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `7416024` |
| origin/main | `7416024` |
| ahead / behind | 0 / 0 |
| working tree | clean |
| latest subject | `docs(blogger): inventory adsense batch candidates`（am-2 candidate inventory） |
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（normal baseline 不變） |
| production post 觸發之 warning 數 | **0**（所有 warnings 皆來自 `content/validation-fixtures/` fixture posts） |

Baseline 與 am-2 預期完全一致；不做任何 fix。

---

## B. Current blocker summary

### B.1 Batch 1 eligible = 0 的原因

per am-2 §D.1 candidate inventory，production post pool 共 6 篇，其中：

| 類別 | 數量 | slugs |
|---|---|---|
| Batch 0 locked | 2 | `we-media-myself2` / `github-pages-blog-planning` |
| `status:"ready"` 但非 Batch 0 lock | 1 | `portable-blog-system-mvp`（summary + noindex，雙重暫緩） |
| `status:"draft"` | 3 | `sample-book-review` / `draft-book-review` / `phonics-practice-sheet-download` |
| **Batch 1 eligible** | **0** | — |

### B.2 這不是 AdSense slot implementation failure

明確區分根因：

- ❌ **不是** renderer / source / wiring 失敗。repo-side 已 verified live-correct：
  - `ads.config.json` 完整（`enabled:true`、real client、six slot id）
  - `articleAd6` / `beforeRelatedLinks` block 已准入 Blogger surface（`surfaces:["pages","blogger"]`）
  - `build:blogger` wiring live（`deriveRenderedAdsenseBlocks(post, settings.ads, 'blogger')`）
  - dist HTML 對所有 ready + full Blogger post 皆正確生成 `lab-ad-slot--articleAd6`
  - Batch 0 兩篇 live front-end 已人工驗證 fill（Phase D + second-post）
  - automated guard `check:blogger-adsense-output` 14/0（仍僅驗 `we-media-myself2`）
- ✅ **真正瓶頸 = candidate readiness**：可安全重貼的 full + indexable + low-complexity Blogger post 不足。production content 池本身過小（6 篇），扣掉 2 篇 lock + 1 篇政策爭議 + 3 篇 draft → eligible 為 0。

> 一句話：**Blogger AdSense rollout 卡在「內容候選不足」，不是「廣告版位做不出來」。**

---

## C. Per-post unblock matrix

> 「commerce / affiliate complexity」為 frontmatter 觀察值；「warnings」為 `validate:content` 對該 post 觸發數（本 baseline 全 production = 0）。

| 欄位 | #3 `portable-blog-system-mvp` | #4 `sample-book-review` | #5 `draft-book-review` | #6 `phonics-practice-sheet-download` |
|---|---|---|---|---|
| file | `content/github/posts/20260504-portable-blog-system-mvp.md` | `content/blogger/posts/20260504-sample-book-review.md` | `content/blogger/posts/20260525-draft-book-review.md` | `content/blogger/posts/20260529-phonics-practice-sheet-download.md` |
| current status | `ready` / `draft:false` | `draft` / `draft:true` | `draft` / `draft:true` | `draft` / `draft:true` |
| current blocker | summary mode + noindex-follow | draft + 空 book metadata + 空 body | draft + 空 book metadata + TODO body | draft + 空 `download.fileUrl` + noindex fallback |
| whether full post (blogger) | ❌ `mode:"summary"`（renderer 不注入 `articleAd6`） | ✅ `mode:"full"` | ✅ `mode:"full"` | ✅ `mode:"full"` |
| whether indexable | ❌ explicit `seo.indexing:"noindex-follow"` | ⚠️ 未指定（book-review 預設 index，但 draft 不輸出） | ⚠️ 未指定（同左） | ❌ `contentKind:"download"` → SEO-1 fallback `noindex,follow` |
| Blogger readiness issue | summary CTA 卡片無 ad slot；須先 flip full | 無真實內容可重貼（template placeholder） | 無真實內容可重貼（TODO body） | 下載檔未上傳；download 形態 theme 未經 Batch 0 驗證 |
| commerce / affiliate complexity | 0（無 affiliate / 無 book） | `affiliate.enabled:true` 但 `links:[]`（空 → 不輸出販售區塊；validator 不報，因 enabled+空僅 warn 條件未觸發 production） | 同 #4（`affiliate.enabled:true` + `links:[]`） | 0（無 affiliate / 無 book） |
| AdSense suitability concern | noindex page 放 AdSense 屬 Google 政策範疇；且 noindex 通常低流量 → ROI 存疑 | 內容為空，發布等於對外貼空白書評；不適合掛廣告 | 同 #4 | noindex（download fallback）+ 下載檔未上線；內容半成品 |
| required unblock work | (a) `mode:summary→full`（1 行）+ (b) noindex 政策決策 + (c) download contentKind theme readiness | 補完整書評 body + book metadata（title/author/publisher/isbn/cover）+ 至少 1 commerce ref（或關閉 affiliate）+ `draft→ready` | 同 #4（body 由 TODO 改為實體 + book metadata + commerce/affiliate 決策 + `draft→ready`） | 上傳真實 PDF 填 `download.fileUrl` + 補 cover + noindex 政策（與 #3 共用）+ download theme readiness + `draft→ready` |
| recommended action | **deferred** — 須 SEO policy preanalysis 先行（noindex+AdSense） | **維持 draft** — 無內容投入計畫前不解鎖 | **維持 draft** — 同 #4 | **deferred** — download asset + noindex 雙議題未解前不解鎖 |
| risk level | 中（政策不確定 + 低流量 ROI） | 中高（空內容對外曝光風險） | 中高（同 #4） | 高（download + noindex + 半成品三重） |
| eligible after unblock? | ✅ 若 noindex 政策放行 + flip full | ✅ 若補完內容 | ✅ 若補完內容 | ✅ 若補檔 + noindex 政策放行 |

---

## D. portable-blog-system-mvp 單獨分析

### D.1 summary mode → full mode 需要什麼條件

- 機制極簡：`publishTargets.blogger.mode` 由 `"summary"` flip 至 `"full"`，**1 行 frontmatter change**。
- precedent：second-post `github-pages-blog-planning` 已有 `summary→full` 之 commit `45c403a`（1 行），可作為 mechanism 樣板。
- flip 後 `build:blogger` 即對該 post 生成 `lab-ad-slot--articleAd6`（renderer 對 full mode 一律注入）。
- **但 flip 不是充分條件**：須先通過 D.2 noindex 政策 + D.3 theme readiness。

### D.2 noindex-follow → indexable 是否合理

- 現況：frontmatter explicit `seo.indexing:"noindex-follow"`（Phase 20260520-seo-2 樣本，刻意保留以驗證 SEO-2 precedence 第一優先）；同時 `contentKind:"download"` 會走 SEO-1 fallback 至同向 `noindex,follow`。
- **核心問題**：noindex page 上能否放 AdSense？屬 Google AdSense 政策範疇，**不在本 repo 可單方面決定**。
- 兩條路徑各有代價：
  - **保留 noindex**：若 AdSense 政策允許 noindex page 掛廣告 → 可保留，但 noindex 通常代表搜尋低流量 → 廣告收益 ROI 偏低，rollout 報酬不對稱。
  - **改 indexable**（移除 noindex / 改 `index`）：違反該 post 之 Phase 20260520-seo-1/seo-2 設計意圖（此 post 是 SEO precedence 的驗證樣本）。改了會破壞既有測試用途，須另評估是否改用其他樣本承接 SEO 驗證。
- **判斷**：不建議為了 AdSense 而硬改 SEO 樣本語意。**合理性存疑**，須獨立 SEO policy preanalysis 釐清後再決定。

### D.3 download contentKind 與 AdSense / Blogger rollout 的衝突

- Batch 0 已驗證形態：`book-review`（we-media）+ `tech-note`（github-pages-blog-planning）。
- `download` 形態之 Blogger dist HTML 可能引入 Batch 0 未涵蓋之 CSS class group（如 `.lab-download-box`）→ 須先做 theme readiness check，否則 live 端可能破版。
- 此 post 雖 `contentKind:download` 但無實際 `download` block（mvp 是技術筆記，download 是 SEO 樣本標記）→ theme 風險低於 #6，但仍須確認 dist 不含未驗證 class。

### D.4 是否應該優先解鎖 / 是否需要 SEO policy preanalysis / 是否應拆 phase

- **是否優先**：⚠️ 不建議列為最優先。雖然「最接近 ready」（只缺 1 行 flip），但 noindex blocker 是政策性、非機械性，解鎖成本被低估。
- **是否需要 SEO policy preanalysis**：✅ **必須**。noindex + AdSense 相容性是硬 blocker。
- **是否應拆 phase**：✅ 應拆三段，且不混做：
  1. **SEO policy preanalysis phase**（docs-only）：釐清 noindex page AdSense 政策 + 此 post 是否該保留為 SEO 樣本 + ROI 評估 + download theme readiness 預測。
  2. **content/frontmatter mutation phase**（單篇、須 user explicit approval）：依 preanalysis 結論做最小 frontmatter change（flip mode、調整 / 保留 indexing）。
  3. **Blogger repost packet phase**（單篇、另案）：實際重貼仍 BLOCKED，須 user approval + 備份 + theme CSS 確認。

---

## E. sample-book-review / draft-book-review plan

### E.1 是否只是 demo / draft

- ✅ 兩篇都是**純 template / draft 樣本**，非真實書評：
  - `sample-book-review`：body 僅一行「請在此撰寫書評內容。」
  - `draft-book-review`：body 為 `<!-- TODO: 待填書評內容 -->` + 三段 `TODO`。
- 兩篇皆 `status:"draft"` / `draft:true` → 不進 build 輸出。
- 用途：驗證 book-review 模板 / SEO frontmatter / Admin 安全寫入流程（見各自 description）。

### E.2 是否有真實書籍 metadata

- ❌ **完全沒有**。兩篇 `book.*` 全為空：`title` / `titleEn` / `originalTitle` / `author` / `authors[].displayName` / `publisher` / `isbn` / `coverImage` / `coverAlt` 皆空字串；`publishedYear` / `volume` 為 `null`。
- `affiliate.enabled:true` 但 `links:[]`（空）→ 渲染端不輸出販售區塊（per CLAUDE.md §12 規則 2）；validator 對「enabled+空 links」之 warning 在 production 未觸發（baseline 0）。

### E.3 是否值得投入，或應維持 draft

- **判斷：應維持 draft**，**不**用於 Batch 1。
- 理由：
  - 解鎖 = 從零撰寫一篇完整書評（真實書 + 心得 + metadata + 至少 1 commerce ref 或關閉 affiliate）→ 這是**內容創作工作**，不是 frontmatter 機械調整，effort 遠高於 mvp 的 1 行 flip。
  - 把 template placeholder 補成真內容屬於正常內容 production，不應為了湊 AdSense Batch 1 而倉促產出。
- 若 user 本就計畫寫這兩本書評 → 可走正常 content authoring，完成後自然進入候選池（屆時重做 am-2 inventory 即 eligible）。

### E.4 template placeholder 風險

- ⚠️ **空內容對外曝光風險**：若誤把 draft flip 成 ready 並重貼，等於對外發布空白書評頁 + 掛廣告 → 傷害站台信任、可能違反 AdSense「低價值內容 / 建置中頁面」政策。
- ⚠️ 兩篇共用同一 template 結構 → 若批次處理易誤觸；務必逐篇人工確認有真實內容才解鎖。
- **本 phase 不修改**；僅記錄風險。

---

## F. phonics-practice-sheet-download plan

### F.1 download asset / noindex fallback / SEO-1 風險

- `download.enabled:true` 但 `download.fileUrl:""`（空）→ 下載檔尚未上傳，body 亦明載「實際下載檔尚未上傳」「正式公開前仍需補齊圖片、下載檔」。
- `contentKind:"download"` → 觸發 CLAUDE.md SEO-1 fallback path → 預設 `noindex,follow`（與 #3 共用政策議題）。
- frontmatter 未 explicit 設 `seo.indexing` → 走 SEO-1 fallback（非 SEO-2 explicit），但結果同向 noindex。
- `relatedLinks` 已有 1 筆 internal cross-link 至 GitHub Pages（`portable-blog-system-mvp`）→ 結構完整，但本體仍半成品。

### F.2 是否適合 AdSense Batch 1

- ❌ **目前不適合**。三重 blocker：
  1. draft（未 ready）
  2. download asset dormant（`fileUrl` 空 → 下載頁主功能缺失，內容半成品）
  3. noindex fallback（與 #3 同政策議題）
- 加上 download 形態 theme 未經 Batch 0 live 驗證（且本篇**有**真實 `download` block，theme 風險高於 #3）。

### F.3 若要解鎖，需要哪些條件

| 類別 | 解鎖工作 |
|---|---|
| content | 上傳真實 PDF（Google Drive / Blogger image host / 其他外部空間），回填 `download.fileUrl`；補 cover 圖；body 補齊筆順引導步驟 |
| download 頁 | 確認 `download-box` 渲染正常（含 `fileUrl` + licenseNote）；download asset registry 目前 empty / dormant（不一定要接 registry，可走既有 `download.fileUrl` 直填 path） |
| SEO | noindex 政策決策（與 #3 共用）：download page 上 AdSense 是否合理；若要 indexable 須評估是否該移除 download SEO-1 fallback |
| Blogger readiness | download contentKind 之 theme CSS readiness gate（`.lab-download-box` 等是否在 Batch 0 涵蓋外）；live front-end 須額外驗證此形態 fill |
| status | `draft→ready`（最後一步，須以上全部完成） |

- **本 phase 不修改**；僅列條件。

---

## G. Recommended unblock strategy（保守排序）

1. **優先檢查是否已有「最接近 full + indexable + low-complexity」之既有文章** → 結論：**目前沒有**。
   - mvp 雖最接近 ready，但 noindex blocker 使其非「indexable + low-complexity」。
   - 其餘 3 篇皆 draft + 空內容 / 空下載檔。
2. **若沒有合適既有文章 → 建議優先新增或完成 1–3 篇 low-risk full Blogger posts**（`status:ready` + `blogger.enabled:true` + `mode:full` + 非 noindex + 主題避開核心商業轉換 / 高流量）。
   - 這是**最乾淨**的解鎖路徑：不碰既有 SEO 樣本語意、不倉促補 template、不踩 noindex 政策。
   - 新內容自然 eligible，屆時重做 am-2 inventory 即可進 Batch 1。
3. **不建議用 demo / draft / template placeholder 文章硬做 Batch 1**。
   - `sample-book-review` / `draft-book-review` 補成真內容屬正常 content production，不應為湊 AdSense 而倉促；空內容對外曝光有 AdSense 政策風險（E.4）。
4. **若資源僅夠做 1 篇 → 標示為 Batch 1a mini-batch，不是正式 Batch 1**。
   - 命名明文 `Batch 1a`，定位「試水單篇」，1 篇 live repost + 24h 觀察後再決定是否續做。
   - 即便如此，1 篇仍須是真實 full + indexable post（最可能是「新寫的低風險 post」，而非硬解 mvp / draft）。

> 保守總結：**寧可等 1–3 篇新的乾淨 full post，也不要把 SEO 樣本（mvp）或空 template（兩篇書評）硬塞進 Batch 1。** download 篇（#6）因三重 blocker，解鎖優先序最後。

---

## H. Concrete next phases

> 以下為**選項**，非執行計畫；任一啟動須 user explicit approval 另開單一 phase。

### Option H1（推薦先行）：SEO / content policy preanalysis

- **phase name**：`20260612-XX-blogger-adsense-noindex-download-seo-policy-preanalysis-docs-only-a`
- **目的**：釐清 (a) noindex page 上 AdSense 之 Google 政策相容性；(b) mvp 是否該保留為 SEO precedence 樣本（若改 indexable 對測試的影響）；(c) download contentKind theme readiness 預測；(d) noindex 低流量 ROI 評估。涵蓋 #3 與 #6 共用之 noindex 議題。
- **是否修改 content**：❌ 否（docs-only）
- **驗收**：產出 preanalysis doc；`validate:content` 0/94/84 不變；無 frontmatter / source / settings drift

### Option H2：single-post frontmatter mutation（僅在候選 eligible 後）

- **phase name**：`20260612-XX-blogger-adsense-<slug>-frontmatter-unblock-content-a`
- **目的**：對 user 選定且已通過 preanalysis 的**單一** post 做最小 scope frontmatter / content change（如 mvp flip mode + 調 indexing；或某篇補完內容後 `draft→ready`）。
- **是否修改 content**：✅ 是（僅該 post，single-file）
- **驗收**：見 §I（only target post touched / no drift / validate pass / dist HTML 含 bottom AdSense slot / manual repost 另案）
- **前置條件**：須 Option H1 結論放行 + user explicit approval；**不**在候選 eligible 前啟動

### Option H3：new low-risk full Blogger post authoring（最乾淨解鎖）

- **phase name**：`20260612-XX-blogger-content-new-lowrisk-full-post-a`（content authoring）
- **目的**：新增 1–3 篇真實 full + indexable + low-complexity Blogger post（非 SEO 樣本、非 template），自然擴大 Batch 1 候選池。
- **是否修改 content**：✅ 是（新增檔案）
- **驗收**：`validate:content` 不增 error / 不增 production warning；`build:blogger` 生成 `articleAd6`；新 post 進 am-2 inventory 為 eligible

### Option H4（保守 / 預設）：conservative pause

- **phase name**：（無新 phase）
- **目的**：維持暫停，不動 repo；等新內容自然產出或 user 決策。
- **是否修改 content**：❌ 否
- **驗收**：每次新 phase 啟動時重做 am-2 candidate inventory；出現 ≥1 筆 eligible 才推進

| 選項 | 修改 content | 政策決策 | live 動作 | 風險 |
|---|---|---|---|---|
| H1 preanalysis | 否 | 整理供決策 | 無 | 最低 |
| H2 single-post mutation | 是（1 篇） | 須先 H1 放行 | 無（repost 另案） | 中 |
| H3 new post authoring | 是（新增） | 無（乾淨主題） | 無（repost 另案） | 低–中 |
| H4 pause | 否 | 無 | 無 | 最低 |

**推薦序**：H1（先釐清政策）→ 視結論 H3（新內容，最乾淨）或 H2（解鎖既有，須政策放行）→ 最後才 repost packet。保守預設 H4。

---

## I. Acceptance criteria for future mutation phase

未來若真的要修改某篇文章（H2），須同時滿足：

- ✅ **only target post touched**：`git diff --name-only` 僅該 post 之 `.md`（+ 必要時其 sidecar）
- ✅ **no source / settings / template drift**：`src/` / `content/settings/` / `src/views/` / `package.json` / `check-*.js` 全部 0 變更
- ✅ **validate content pass**：`validate:content` 0 errors，且不新增 production warning（維持 0/94/84 或合理變動已說明）
- ✅ **generated Blogger HTML contains bottom AdSense slot**：`build:blogger` 後 `dist-blogger/posts/<slug>/post.html` 含恰 1 個 `lab-ad-slot--articleAd6`（client / slot 值與 `ads.config.json` 一致，不 hardcode）、0 個 articleAd1–5、無 EJS leak
- ✅ **evidence one-liner documented**：read-only node one-liner 驗證 dist HTML，結果記錄於該 phase doc
- ✅ **manual Blogger repost remains separate phase**：實際重貼 / publish 一律另開單一 phase，須 user approval + 備份 + theme CSS 確認

---

## J. Guardrails / non-actions（本 session 明確未做）

- ❌ no Blogger access（未登入 / 未開編輯器 / 未開 AdSense 後台）
- ❌ no repost / no publish
- ❌ no frontmatter / content mutation（4 篇候選 post 一律只讀，未改 draft / summary / noindex 狀態）
- ❌ no source / settings / template mutation（`src/` / `ads.config.json` / EJS / `package.json` / `check-*.js` 全未動）
- ❌ no build / deploy（docs-only；read-only baseline 僅跑 `validate:content`；未跑 `build:blogger` / `build:github`）
- ❌ no `check:adsense-resolver` / `check:adsense-article-block` / `check:adsense-anchor-wiring` / `check:blogger-adsense-output`（無 source / settings 變更 → carry forward 前 phase measurement：resolver 34/0、article-block 13/0、anchor-wiring 14/0、blogger-output 14/0）
- ❌ no AdSense ID mutation（未新增 / 未 hardcode real client / slot id；未寫入 docs / fixture / test）
- ❌ no guard 參數化
- ❌ no gh-pages / no commerce / Admin / renderer 變更
- ❌ no CLAUDE.md compression
- ❌ no `/memory`
- ❌ no unrelated cleanup

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 am-3（20260612）極小 ledger sync append。

---

## K. Real-ID masking confirmation

本文件全文僅出現 `articleAd1` / `articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）；**不含**完整 real AdSense client id / slot id。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
