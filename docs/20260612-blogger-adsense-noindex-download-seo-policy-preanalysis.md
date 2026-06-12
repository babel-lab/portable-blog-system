# Blogger AdSense — noindex / download / SEO Policy Preanalysis

Phase: `20260612-am-4-blogger-adsense-noindex-download-seo-policy-preanalysis-docs-only-a`

## Status

- **docs-only SEO / content policy preanalysis**（接續 am-3 candidate unblock content plan 之 Option H1）
- 本 phase **不** repost / paste / publish / 開 Blogger 後台 / 開 AdSense 後台 / deploy / push gh-pages
- 本 phase **不**改 src / content / settings / fixtures / views / templates / package / lockfile / dist / `.cache`
- 本 phase **不**改任何文章 frontmatter 解鎖狀態（draft / summary / noindex 一律維持原狀）
- 本 phase **不**改 guard scope（`check-blogger-adsense-output.js` 維持 single-slug = `we-media-myself2`）
- 本 phase **不**新增或 hardcode real AdSense client / slot id
- 本 phase **不**做 noindex / SEO policy **final** 決策；亦**不**宣稱完成任何外部 Google AdSense policy verification；只整理 repo-internal preanalysis + decision matrix + next-phase 選項供 user 後續決策
- 目的：釐清 repo 內對 (1) noindex-follow 文章是否納入 Blogger AdSense rollout、(2) download contentKind 文章是否納入、(3) 哪些情境屬 indexable / 適合、(4) `portable-blog-system-mvp` 與 `phonics-practice-sheet-download` 是否可解鎖為 Batch 1 / Batch 1a 候選 —— 之安全決策建議

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）/ masked。real id 僅存於 `content/settings/ads.config.json`。

---

## A. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `784e0a8` |
| origin/main | `784e0a8` |
| ahead / behind | 0 / 0 |
| working tree | clean |
| latest subject | `docs(blogger): plan adsense candidate unblock`（am-3 candidate unblock content plan） |
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（normal baseline 不變） |
| production post 觸發之 warning 數 | **0**（所有 warnings 皆來自 `content/validation-fixtures/` fixture posts） |

Baseline 與 am-3 預期完全一致；不做任何 fix。

---

## B. Scope and source limits

1. 本文件**只**根據以下 repo-internal 來源做 preanalysis：
   - 既有 docs（am-1 / am-2 / am-3 Phase F 文件、Phase D / second-post readiness handoff 與 verification record）
   - 目前文章 frontmatter / content（4 篇候選 + 2 篇 Batch 0 lock）
   - `content/settings/ads.config.json` 之 surface / anchor policy（read-only 觀察，不引用 real id）
   - CLAUDE.md 之 SEO / AdSense / download ledger 區塊
2. 本文件**不**宣稱完成外部 Google AdSense policy verification。任何需要 Google 官方 publisher policy 條文支撐之結論，一律明文標示 **「⚠️ 需人工 / 官方政策確認」**，不自行腦補政策內容。
3. 本文件**不**做 final 決策、不改 frontmatter；僅輸出 policy matrix + per-post disposition + next-phase 選項。
4. 凡涉及「noindex page 上能否放 AdSense」「download / 半成品 / 空內容頁掛廣告是否違反 AdSense 政策」之判斷，repo 端**無權**單方面裁定；本文件只標示為需確認項，並給出 repo-side 保守預設（deferred）。

---

## C. Problem restatement

### C.1 Batch 1 eligible = 0（沿用 am-2 / am-3 結論）

per am-2 candidate inventory + am-3 unblock content plan：production post pool 共 6 篇 —— 2 篇 Batch 0 locked（`we-media-myself2` / `github-pages-blog-planning`）、1 篇 ready 但雙重暫緩（`portable-blog-system-mvp`）、3 篇 draft（`sample-book-review` / `draft-book-review` / `phonics-practice-sheet-download`）→ **Batch 1 eligible = 0**。

### C.2 候選不足的核心原因

- **不是** renderer / source / wiring / dist 失敗。repo-side 已 verified live-correct：`ads.config.json` 完整、`articleAd6` / `beforeRelatedLinks` 已准入 Blogger surface（`surfaces:["pages","blogger"]`）、`build:blogger` wiring live、dist HTML 對 ready+full post 正確生成 `lab-ad-slot--articleAd6`、Batch 0 兩篇 live front-end 已人工驗證 fill、`check:blogger-adsense-output` 14/0。
- **真正瓶頸 = candidate readiness**，且此 readiness 缺口可細分為**三個獨立的 content/SEO gate**：
  1. **noindex gate**：`portable-blog-system-mvp` 之 `seo.indexing:"noindex-follow"` + `phonics-practice-sheet-download` 之 `contentKind:"download"` SEO-1 fallback（皆 noindex）→ noindex page 掛 AdSense 之政策相容性未確認。
  2. **download contentKind gate**：download 形態 theme CSS 未經 Batch 0 live 驗證；且 `phonics` 之 `download.fileUrl` 空、內容半成品。
  3. **placeholder / empty-content gate**：兩篇 book-review 為 template placeholder（book metadata 全空、body 為佔位 / TODO）。

### C.3 明確結論：這不是 bottom slot renderer / source failure

> 一句話：**Blogger AdSense rollout 卡在「noindex / download / 半成品內容」三個 content+SEO gate，不是「bottom slot 廣告版位做不出來」。** repo-side 廣告版位機制（`articleAd6` / `beforeRelatedLinks`）已 live-correct 且經 Batch 0 兩篇跨形態人工驗證。

---

## D. Policy decision matrix

> 「Blogger AdSense rollout suitability」= 該情境是否適合納入 Blogger 文章底部 `articleAd6` 重貼流程。
> 「Batch 1 suitability」= 是否可作為**正式** Batch 1 候選（非 mini / internal）。
> 所有「政策相容性」欄位凡涉及 Google 官方政策者標 ⚠️ 需人工 / 官方政策確認。

| # | 情境 | Blogger AdSense rollout suitability | Batch 1 suitability | required checks | risk level | recommended action |
|---|---|---|---|---|---|---|
| D1 | **ready + full + indexable + normal article**（如 Batch 0 之 we-media-myself2 / github-pages-blog-planning 形態） | ✅ 適合 | ✅ 適合（正式 Batch 1 / Batch 0 已採此形態） | dist one-liner（恰 1 `articleAd6` / 0 articleAd1–5 / data attrs strict-equal / 無 EJS leak）+ theme class 已被 Batch 0 涵蓋 + 桌機/手機預覽 | 低 | 正式候選；走 am-1 §F manual repost checklist |
| D2 | **ready + summary + indexable** | ❌ 不適合（renderer 對 summary mode **不**注入 `articleAd6`；summary CTA 卡片無 ad slot） | ❌ 不適合 | 須先 `mode: summary→full`（1 行 frontmatter，single-post mutation phase）→ 之後才回到 D1 流程 | 低（但須先 flip） | deferred 至 mode flip；flip 屬另案 single-post content phase |
| D3 | **ready + full + noindex-follow** | ⚠️ 政策待確認（noindex page 掛 AdSense 是否合規屬 Google 政策範疇）+ noindex 通常低流量 → ROI 偏低 | ❌ 不適合作為**正式** Batch 1 | ⚠️ 需人工/官方政策確認（noindex+AdSense）+ ROI 評估 + 確認是否破壞既有 SEO 樣本語意 | 中 | **deferred**；若一定要驗證僅可作 Batch 1a internal mini-test（見 §E） |
| D4 | **download contentKind + indexable** | ⚠️ 條件式適合（須 download asset 完整 + download theme readiness 通過 + 內容非半成品） | ⚠️ 須通過 download gate 後才可 | download.fileUrl 已上線 + cover 補齊 + `.lab-download-box` 等 download class 之 theme readiness gate + 內容完稿 + dist one-liner | 中 | **deferred** 至 download asset + theme readiness 完成 |
| D5 | **download contentKind + noindex-follow** | ❌ 不適合（同時觸發 D3 noindex 政策議題 + D4 download gate；雙重 blocker） | ❌ 不適合 | D3 全部 + D4 全部 | 高 | **deferred**（優先序最後）；屬 `phonics` 之情境（§H） |
| D6 | **draft / placeholder / empty metadata**（template 樣本、空 body、空 book metadata、空 fileUrl） | ❌ 不適合（draft 不進 build；空內容對外曝光 ⚠️ 可能違反 AdSense 低價值 / 建置中頁面政策） | ❌ 不適合 | 須補完真實內容 + book/download metadata + `draft→ready`（屬正常 content authoring，非 frontmatter 機械調整） | 中高（空內容對外曝光 + ⚠️ 政策風險） | **維持 draft**；不得用 placeholder 驗證正式 rollout |

> ⚠️ D3 / D4 / D5 / D6 之「是否違反 AdSense 政策」皆 **需人工 / 官方政策確認**；本表只給 repo-side 保守預設（deferred / 維持 draft），不代表 Google 官方裁定。

---

## E. noindex-follow analysis

### E.1 noindex-follow 文章是否應作為 AdSense rollout 候選

- repo-side 保守預設：**不應作為正式 Batch 1 候選**。
- 兩個獨立理由：
  1. **政策相容性未確認**：noindex page 上是否允許投放 AdSense，屬 Google AdSense publisher policy 範疇。⚠️ **需人工 / 官方政策確認**；repo 端無權單方面裁定。
  2. **ROI 不對稱**：noindex 代表該頁刻意排除於搜尋索引之外 → 自然搜尋流量趨近於零 → 廣告曝光 / 收益 ROI 偏低。把有限的 rollout 風險預算花在低流量頁不划算。

### E.2 noindex 文章驗證廣告 slot 的「技術價值」 vs 「SEO / 政策風險」

| 面向 | 評估 |
|---|---|
| 技術價值 | 低增量。Batch 0 已用 `book-review`（we-media）+ `tech-note`（github-pages-blog-planning）兩種 indexable full 形態驗證 `articleAd6` anchor 正確 fire；noindex 與否**不影響** dist HTML 之 `<ins>` 生成（noindex 是 `<meta robots>` 層級，與 article-body ad anchor 正交）。換言之 noindex 文章對「slot 技術驗證」**幾乎無新增覆蓋**。 |
| SEO 風險 | 若為了掛 AdSense 而把 `mvp` 從 noindex 改 indexable → 破壞其 Phase 20260520-seo-1/seo-2 SEO precedence 樣本語意（該 post 刻意保留 noindex 以驗證 SEO-2 explicit > SEO-1 fallback）。改了須另找樣本承接 SEO 驗證。 |
| 政策風險 | ⚠️ 需人工 / 官方政策確認：noindex page 掛 AdSense 是否被視為合規。未確認前不應上線。 |

→ 結論：用 noindex 文章驗證廣告 slot，**技術增量低、SEO / 政策風險高**，性價比差。

### E.3 是否應避免把 noindex 文章當正式 Batch 1

- ✅ **應避免**。正式 Batch 1 候選應為 indexable full article（D1 形態），與 Batch 0 一致，才有搜尋流量、政策清晰、ROI 合理。

### E.4 若一定要用，只能作為 Batch 1a internal mini-test？

- 若 user 出於「想實測 noindex page 上 AdSense 行為」之研究目的，**唯一**可接受路徑是標示為 **Batch 1a internal mini-test**（非正式 Batch 1 本體），且須同時滿足：
  1. ⚠️ 先取得 noindex+AdSense 政策確認（人工 / 官方）→ 否則連 mini-test 都不應上線。
  2. 明文標示「internal / 試水單篇」，不計入 Batch 1 批次代表性。
  3. 仍須通過 download theme readiness（若該 post 為 download contentKind，如 `mvp`）。
- 即便如此，repo-side 仍**建議優先**用「新寫的乾淨 indexable full post」（§J.5）而非硬解 noindex 樣本。

### E.5 哪些決策需要人工 / 官方政策確認

- ⚠️ noindex page 投放 AdSense 之政策相容性 → **需人工 / 官方政策確認**。
- ⚠️ 是否為 AdSense 而移除 / 改寫 `mvp` 之 noindex 標記（牽涉是否犧牲 SEO 樣本）→ **需 user 產品決策**（非 repo 自動）。

---

## F. download contentKind analysis

### F.1 download 類文章放 AdSense 的風險

| 風險 | 說明 |
|---|---|
| noindex fallback | `contentKind:"download"` 走 CLAUDE.md SEO-1 fallback → 預設 `noindex,follow`（除非 frontmatter explicit 覆蓋）→ 與 §E noindex 議題重疊（⚠️ 政策待確認 + 低流量 ROI）。 |
| 半成品內容 | download 文章常處於「下載檔未上傳」狀態（如 `phonics` 之 `download.fileUrl:""`）→ 主功能缺失 → 對外掛廣告 = 半成品頁掛廣告，⚠️ 可能觸 AdSense 低價值內容政策（需人工/官方確認）。 |
| theme 未驗 | download 形態之 Blogger dist HTML 可能引入 Batch 0 未涵蓋之 CSS class group（如 `.lab-download-box`）→ live 端可能破版（須 theme readiness gate）。 |

### F.2 download 資源頁 / 空 fileUrl / download theme readiness 對 Blogger rollout 的影響

- **空 fileUrl**：下載頁核心功能（提供檔案）未就緒 → 該頁對使用者價值不足 → 不應在此狀態掛廣告上線。
- **download theme readiness**：Batch 0 兩篇驗證之 class set = `.adsbygoogle` / `.lab-ad-slot--articleAd6` / `.lab-affiliate-box` / `.lab-related-links*` / `.lab-hashtag*` / `.lab-blogger-article` / `.lab-article__*` / `.lab-container`；**未涵蓋** download box 相關 class → 須先做 download 形態之 theme readiness check，否則 live 破版回收成本高。
- **noindex fallback**：見 §E（政策 + ROI）。

### F.3 download 類文章是否應排除 Batch 1

- ✅ **預設排除**。download contentKind 預設 **deferred**，直到 download asset（fileUrl）+ download theme readiness + SEO（noindex）政策**三者全部完整**為止（per §J.3）。

### F.4 若要納入，需要哪些內容 / 資源 / SEO / theme readiness / 人工驗收

| 類別 | 必要條件 |
|---|---|
| content | 上傳真實下載檔（PDF 等）並回填 `download.fileUrl`；補 cover 圖；body 補齊（如 `phonics` 之筆順引導步驟），移除「尚未上傳 / 待定稿」字樣 |
| 資源 | 下載檔之外部 host（Google Drive / Blogger image host / 其他）確認可公開存取；download asset registry 目前 empty / dormant（不一定要接 registry，可走既有 `download.fileUrl` 直填） |
| SEO | noindex 政策決策（與 §E 共用）：download page 上 AdSense 是否合規（⚠️ 需人工/官方確認）；若要 indexable 須評估是否移除 download SEO-1 fallback |
| theme readiness | download contentKind 之 `.lab-download-box` 等 class 之 theme CSS readiness gate；live front-end 須額外驗證此形態 fill 與不破版 |
| 人工驗收 | 完稿後 `draft→ready` + dist one-liner + 桌機/手機預覽 + live 重貼後 manual verification record |

---

## G. portable-blog-system-mvp disposition

> file：`content/github/posts/20260504-portable-blog-system-mvp.md`；觀察值：`site:github` / `contentKind:download` / `status:ready` / `draft:false` / blogger `mode:"summary"` enabled `true` / github `mode:"full"` / `seo.indexing:"noindex-follow"`（explicit）。注意：雖標 `contentKind:download` 但**無**實際 `download:` block（這是技術筆記，download 是 SEO 樣本標記）。

### G.1 是否建議優先解鎖

- ⚠️ **不建議優先**。雖「最接近 ready」（blogger 端只缺 1 行 `summary→full` flip），但其 blocker 是**政策性 + 樣本語意性**，非機械性，解鎖成本被低估。三重糾纏：summary mode + noindex-follow（explicit SEO-2 樣本）+ download contentKind（SEO-1 fallback）。

### G.2 summary → full 的條件

- 機制極簡：`publishTargets.blogger.mode: "summary"→"full"`，1 行 frontmatter（precedent：second-post `github-pages-blog-planning` commit `45c403a`）。
- **但 flip 非充分條件**：須先通過 G.3 noindex 政策 + download theme readiness；否則 flip 後雖生成 `articleAd6`，仍卡在 noindex / theme gate。

### G.3 noindex-follow → indexable 的條件

- 現況 explicit `seo.indexing:"noindex-follow"`（刻意保留以驗證 SEO-2 precedence 第一優先）；同時 `contentKind:"download"` 之 SEO-1 fallback 亦同向 noindex。
- 改 indexable 之**前提**（任一不滿足即不應改）：
  1. ⚠️ 需 user 產品決策：是否願意犧牲此 post 之 SEO precedence 樣本用途（若是，須另找樣本承接 SEO-1/SEO-2 驗證）。
  2. ⚠️ 需人工 / 官方政策確認：若選擇**保留** noindex 而仍掛 AdSense，noindex page 掛 AdSense 是否合規。
- repo-side **不建議**為了 AdSense 而硬改 SEO 樣本語意（合理性存疑）。

### G.4 download contentKind 是否需要改分類或保留

- 此 post 雖標 `contentKind:download` 但**無實際 download block**（純技術筆記）→ download theme 破版風險低於 `phonics`（後者有真實 download block）。
- 是否改 `contentKind`（如改回 `tech-note`）牽涉其 SEO-1 fallback 樣本語意 → ⚠️ 需 user 決策；**本 phase 不改**，僅標示「若要 indexable，contentKind 與 seo.indexing 之樣本語意須一併評估」。

### G.5 建議拆成哪些下一 phase

1. （本 phase 即 Option H1 之一部分）SEO / content policy preanalysis（docs-only）—— 已涵蓋 mvp。
2. ⚠️ noindex+AdSense 政策**人工 / 官方確認**（非 Claude phase；user 外部查證）。
3. 若政策放行 + user 決定犧牲 SEO 樣本 → single-post frontmatter mutation phase（mode flip + indexing 調整，single-file，須 user explicit approval）。
4. download 形態 theme readiness check phase。
5. Blogger repost packet phase（另案，BLOCKED until 上述完成 + 備份 + theme CSS 確認）。

### G.6 保守結論

- **deferred**。不建議在 noindex+AdSense 政策未確認、且未決定 SEO 樣本去留前解鎖。**本 phase 不修改任何 frontmatter**。

---

## H. phonics-practice-sheet-download disposition

> file：`content/blogger/posts/20260529-phonics-practice-sheet-download.md`；觀察值：`site:blogger` / `contentKind:download` / `status:draft` / `draft:true` / blogger `mode:"full"` enabled `true` / github enabled `false` / `download.enabled:true` 但 `download.fileUrl:""` / cover 空 / 無 explicit `seo.indexing`（→ SEO-1 fallback noindex,follow）/ 有真實 `download:` block / 有 1 筆 internal relatedLinks。

### H.1 是否適合 AdSense Batch 1

- ❌ **目前不適合**。三重 blocker（per am-3 §F.2）：
  1. **draft**（未 ready，不進 build 輸出）
  2. **download asset dormant**（`download.fileUrl:""` → 下載頁主功能缺失，body 自承「實際下載檔尚未上傳」「正式公開前仍需補齊圖片、下載檔」）
  3. **noindex fallback**（`contentKind:download` → SEO-1 noindex,follow；與 §E / §G 共用政策議題）
- 加上 download 形態 theme 未經 Batch 0 live 驗證，且本篇**有**真實 download block → theme 風險高於 `mvp`。

### H.2 若要解鎖，最小必要工作

| 類別 | 工作 |
|---|---|
| content | 上傳真實 PDF 並回填 `download.fileUrl`；補 cover 圖（`cover` / `coverAlt`）；body 補齊筆順引導步驟，移除「尚未上傳 / 待定稿」字樣 |
| download 頁 | 確認 `download-box` 渲染正常（含 `fileUrl` + licenseNote）；可走既有 `download.fileUrl` 直填，不必接 registry |
| SEO | noindex 政策決策（⚠️ 需人工/官方確認，與 §E/§G 共用）；download page 掛 AdSense 是否合理 |
| theme | download contentKind 之 theme CSS readiness gate（`.lab-download-box` 等是否在 Batch 0 涵蓋外） |
| status | `draft→ready`（最後一步，須以上全部完成） |

### H.3 是否建議延後

- ✅ **建議延後（deferred，優先序最後）**。三重 blocker + 真實 download block 之 theme 風險 → 解鎖成本最高。不建議作為近期 Batch 1 / Batch 1a 解鎖目標。**本 phase 不修改**。

---

## I. sample-book-review / draft-book-review disposition

> files：`content/blogger/posts/20260504-sample-book-review.md` / `content/blogger/posts/20260525-draft-book-review.md`。兩篇皆 `status:draft` / `draft:true` / blogger `mode:"full"` enabled `true` / `book.*` 全空（title/author/publisher/isbn/cover 皆空字串、publishedYear/volume null）/ `affiliate.enabled:true` 但 `affiliate.links:[]`（空）/ body 為佔位（`sample` 一行「請在此撰寫書評內容。」、`draft` 為 `<!-- TODO -->` + 三段 TODO）。

### I.1 是否因 demo / draft / placeholder metadata 而不適合 Batch 1

- ✅ **不適合**。兩篇皆 demo / template placeholder，無真實書籍 metadata、無真實書評 body；屬 D6 情境（draft / placeholder / empty metadata）。

### I.2 是否建議維持 draft

- ✅ **建議維持 draft**。draft 不進 build 輸出；若誤 flip 成 ready 並重貼 = 對外發布空白書評頁 + 掛廣告 → 傷害站台信任、⚠️ 可能違反 AdSense 低價值 / 建置中頁面政策（需人工/官方確認）。

### I.3 若要使用，是否需要完整內容重寫而非 frontmatter 小修

- ✅ **需要完整內容重寫**，非 frontmatter 小修。解鎖 = 從零撰寫一篇完整書評（真實書 + 心得 body + book metadata〔title/author/publisher/isbn/cover〕+ 至少 1 個 commerce ref 或關閉 affiliate）→ 屬正常 content authoring 工作，effort 遠高於 mvp 的 1 行 flip。
- 若 user 本就計畫寫這兩本書評 → 走正常 content authoring，完成後自然進入候選池（屆時重做 am-2 inventory 即 eligible）。**不應**為湊 AdSense Batch 1 而倉促補 template。**本 phase 不修改**。

---

## J. Recommended project policy

> 以下為 **repo-internal 建議政策**；凡涉 Google 官方政策者仍須 ⚠️ 人工 / 官方確認。

1. **正式 Batch 1 候選硬條件**：Blogger AdSense 正式 Batch 1 候選**必須**是 `full` + `indexable`（非 noindex）+ `status:ready` + `draft:false` + **non-placeholder**（有真實內容與 metadata）之 article（= D1 形態，與 Batch 0 一致）。
2. **noindex 政策**：`noindex-follow`（及任何 noindex 變體）文章**不得**作為正式 Batch 1；若要實測，只能標示為 **Batch 1a internal mini-test**，且須先取得 ⚠️ noindex+AdSense 政策人工/官方確認後始可上線。
3. **download contentKind 政策**：download contentKind 文章**預設 deferred**，直到 download asset（`fileUrl`）+ download 形態 theme readiness + SEO（noindex）政策**三者全部完整**為止。
4. **placeholder 政策**：demo / draft / template placeholder（空 metadata / 佔位 body）文章**不得**用來驗證正式 AdSense rollout；補成真內容屬正常 content production，須先 `draft→ready` 並通過 §D 條件。
5. **候選不足時的優先路徑**：若候選不足（如當前 eligible = 0），**優先新增或完成 1–3 篇 low-risk full + indexable Blogger post**（非 SEO 樣本、非 template、避開核心商業轉換 / 高流量），而非硬解 noindex 樣本（`mvp`）或空 template（兩篇書評）或半成品 download（`phonics`）。

---

## K. Concrete next phase options

> 以下為**選項**，非執行計畫；任一啟動須 user explicit approval 另開單一 phase。phase name 之 `XX` 由啟動時序決定。

### Option K1（最乾淨解鎖，推薦主線）：new low-risk full Blogger post — content plan（docs-only）

- **phase name**：`20260612-XX-blogger-content-new-lowrisk-full-post-content-plan-docs-only-a`
- **目的**：規劃 1 篇真實 `full` + `indexable` + low-complexity 之新 Blogger post（非 SEO 樣本、非 template、避開核心商業轉換 / 高流量）之 content scope，使其完成後自然成為 Batch 1 eligible。
- **是否修改 content**：❌ 否（docs-only content plan；實際撰寫屬後續 authoring phase）
- **驗收**：產出 content plan doc；`validate:content` 0/94/84 不變；無 frontmatter / source / settings drift

### Option K2（既有 mvp 解鎖前置）：portable-blog-system-mvp content / SEO mutation preflight（docs-only）

- **phase name**：`20260612-XX-blogger-adsense-mvp-mode-seo-mutation-preflight-docs-only-a`
- **目的**：把 §G 之 mvp 解鎖路徑（summary→full + noindex 政策 + download theme readiness + SEO 樣本去留）整理為單篇 mutation preflight，列出**確切 1 行 / 多行 frontmatter diff 草案**、dist 預期 evidence、與**前置 ⚠️ 政策 / 樣本決策清單**；供 user 決定是否進入實際 mutation phase。
- **是否修改 content**：❌ 否（docs-only preflight；實際 frontmatter mutation 屬後續 single-post phase）
- **驗收**：產出 preflight doc；不改 frontmatter / source / settings；`validate:content` 不變
- **前置條件**：⚠️ noindex+AdSense 政策人工/官方確認 + user 對 SEO 樣本去留之決策（否則 preflight 結論為「維持 deferred」）

### Option K3（試水單篇，僅在已有 eligible post 後）：Batch 1a mini repost packet（docs-only）

- **phase name**：`20260612-XX-blogger-adsense-batch-1a-mini-repost-packet-docs-only-a`
- **目的**：對**已 eligible**（通過 §D D1 條件）之單一 post 生成 copy/paste repost packet（mirror second-post readiness handoff 結構）。明文標示 Batch 1a mini（非正式 Batch 1 本體）。
- **是否修改 content**：❌ 否（docs-only packet；實際 repost 屬另案 execution phase）
- **驗收**：產出 packet doc；dist one-liner 命令；六項 pre-repost inputs；不改 source / settings / frontmatter
- **前置條件**：**須已存在 ≥1 篇 eligible post**（K1 完成撰寫後 / 或 K2 放行並 mutation 後）；否則本 option 不可啟動

### Option K4（保守 / 預設）：conservative pause

- **phase name**：（無新 phase）
- **目的**：維持暫停，不動 repo；等新內容自然產出或 user 政策決策。每次新 phase 啟動時重做 am-2 candidate inventory，出現 ≥1 筆 eligible 才推進。
- **是否修改 content**：❌ 否
- **驗收**：candidate inventory 出現 ≥1 eligible 才推進

### Option K5（並行 / 不衝突）：guard parameterization preanalysis（docs-only）

- **phase name**：`20260612-XX-blogger-adsense-guard-parameterization-preanalysis-docs-only-a`
- **目的**：為 `check-blogger-adsense-output.js` 多 slug / multi-target 涵蓋設計方案（Option A CLI param / Option B registry / Option C 自動遍歷 ready full post）。屬 repo-side automated guard coverage 擴展；與 Batch 1 解鎖正交，不阻塞。
- **是否修改 content**：❌ 否（docs-only preanalysis）
- **驗收**：產出 preanalysis doc；不改 source / settings / guard / content

| 選項 | 修改 content | 政策決策 | live 動作 | 風險 | 定位 |
|---|---|---|---|---|---|
| K1 new post plan | 否（plan only） | 無（乾淨主題） | 無 | 低 | 推薦主線（最乾淨解鎖） |
| K2 mvp preflight | 否（preflight only） | ⚠️ 須 noindex 政策 + SEO 樣本決策 | 無 | 中 | 既有解鎖前置 |
| K3 Batch 1a packet | 否（packet only） | 無（須先 eligible） | 無（repost 另案） | 中 | 僅在 eligible 後 |
| K4 pause | 否 | 無 | 無 | 最低 | 保守預設 |
| K5 guard param | 否 | 無 | 無 | 最低 | 並行不衝突 |

**推薦序**：K1（新乾淨內容，最低政策風險）→ 視 user 政策決策 K2（既有 mvp）→ eligible 後 K3（試水）→ 最後才 repost execution。保守預設 K4；K5 可隨時並行。

---

## L. Guardrails / non-actions（本 session 明確未做）

- ❌ no Blogger access（未登入 / 未開編輯器 / 未開 AdSense 後台）
- ❌ no repost / no publish
- ❌ no frontmatter / content mutation（6 篇 post 一律只讀，未改 draft / summary / noindex 狀態）
- ❌ no source / settings / template mutation（`src/` / `content/settings/` / `src/views/` / `package.json` / lockfile / `check-*.js` 全未動）
- ❌ no build / deploy（docs-only；read-only baseline 僅跑 `validate:content`；未跑 `build:blogger` / `build:github` / sitemap）
- ❌ no `check:adsense-resolver` / `check:adsense-article-block` / `check:adsense-anchor-wiring` / `check:blogger-adsense-output`（無 source / settings 變更 → carry forward 前 phase measurement：resolver 34/0、article-block 13/0、anchor-wiring 14/0、blogger-output 14/0）
- ❌ no AdSense ID mutation（未新增 / 未 hardcode real client / slot id；未寫入 docs / fixture / test）
- ❌ no guard 參數化
- ❌ no gh-pages / no commerce / Admin / renderer 變更
- ❌ no CLAUDE.md compression
- ❌ no `/memory`
- ❌ no unrelated cleanup
- ❌ **no external Google AdSense policy claim unless explicitly sourced in repo or marked 需人工 / 官方政策確認**（本文件所有政策相容性結論皆標 ⚠️ 待確認，未自行腦補官方政策條文）

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 am-4（20260612）極小 ledger sync append。

---

## M. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）；**不含**完整 real AdSense client id / slot id。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
