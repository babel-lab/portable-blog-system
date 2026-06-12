# Blogger Content — New Low-Risk Full Post Content Plan

Phase: `20260612-am-5-blogger-content-new-lowrisk-full-post-content-plan-docs-only-a`

## Status

- **docs-only content plan**（接續 am-4 SEO/content policy preanalysis 之 Option K1 / am-3 §H3「最乾淨解鎖」）
- 本 phase **不**新增文章檔、**不**修改任何 frontmatter / content；只列 plan / frontmatter plan / acceptance plan
- 本 phase **不** repost / paste / publish / 開 Blogger 後台 / 開 AdSense 後台 / deploy / push gh-pages / 做外部前台驗證
- 本 phase **不**改 src / content / settings / fixtures / views / templates / package / lockfile / dist / gh-pages / `.cache`
- 本 phase **不**把 noindex / draft / download / placeholder 文章硬改成候選
- 本 phase **不**新增或 hardcode real AdSense client / slot id（docs / fixture / test 一律不寫 real id）
- 本 phase **不**改 guard scope（`check-blogger-adsense-output.js` 維持 single-slug = `we-media-myself2`）
- 本 phase **不**做 CLAUDE.md compression、**不**用 `/memory`、**不**做 unrelated cleanup
- 允許 mutation：新增本 doc + `CLAUDE.md` 之 am-5 極小 ledger sync append
- 目的：規劃**如何新增或完成 1 篇** low-risk / full / indexable / ready / non-placeholder 之 Blogger 文章，使其未來可成為 Blogger AdSense **Batch 1a / Batch 1** 候選（**不是**為了立即重貼）

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）/ masked。real id 僅存於 `content/settings/ads.config.json`。

---

## A. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `b486992` |
| origin/main | `b486992` |
| ahead / behind | 0 / 0 |
| working tree | clean |
| latest subject | `docs(blogger): assess adsense seo policy`（am-4 noindex/download/SEO policy preanalysis） |
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（normal baseline；下方 §E 實測確認不變） |
| production post 觸發之 warning 數 | **0**（所有 warnings 皆來自 `content/validation-fixtures/` fixture posts） |

Baseline 與 user 期望一致（branch=main、HEAD==origin/main==`b486992`、working tree clean）；不做任何 fix。

---

## B. Why a new low-risk post is the cleanest unblock

### B.1 為什麼不建議硬救 noindex / download / draft / template placeholder 文章

承 am-2 inventory / am-3 unblock plan / am-4 SEO policy preanalysis，6 篇 production post 之解鎖成本如下：

| 既有候選 | blocker | 為什麼硬救不乾淨 |
|---|---|---|
| `portable-blog-system-mvp`（ready，但 summary + noindex-follow + download contentKind） | noindex page 掛 AdSense **⚠️ 屬 Google 政策範疇，repo 無權單方面裁定**；且該 post 是 Phase 20260520-seo-1/seo-2 之 SEO precedence **驗證樣本** | 為了 AdSense 改 indexable = 破壞既有 SEO 樣本語意，須另找樣本承接；保留 noindex 又卡政策 + 低流量 ROI。**政策性 blocker，非機械性**，解鎖成本被低估。 |
| `sample-book-review` / `draft-book-review`（draft，book metadata 全空、body 佔位 / TODO） | 空 metadata + 佔位 body | 解鎖 = 從零撰寫完整書評（真實書 + 心得 body + book metadata + commerce 決策）。把 template 硬補成真內容屬正常 content production；倉促補只為湊 AdSense，**空內容對外曝光 ⚠️ 可能違反 AdSense 低價值 / 建置中頁面政策**。 |
| `phonics-practice-sheet-download`（draft，`download.fileUrl` 空 + noindex fallback + 真實 download block） | 三重 blocker（draft / download asset dormant / noindex fallback）+ download 形態 theme 未經 Batch 0 驗證 | 解鎖優先序最後；牽涉上傳真實檔 + noindex 政策 + theme readiness gate，effort 最高、風險最高。 |

共同問題：**這些既有候選的 blocker 都不是「廣告版位做不出來」，而是 noindex 政策爭議、半成品內容、SEO 樣本語意糾纏。** 硬救任何一篇，都會把「AdSense rollout」和「政策決策 / 內容創作 / SEO 樣本去留」三件正交的事綁在一起，互相拖延、互相污染根因。

### B.2 為什麼新增或完成一篇普通 full article 比較乾淨

| 面向 | 硬救既有候選 | 新增一篇乾淨 full article |
|---|---|---|
| SEO 政策 | ⚠️ 卡 noindex+AdSense 政策待確認 | ✅ 預設 indexable，無 noindex 政策議題 |
| SEO 樣本語意 | 可能破壞 seo-1/seo-2 precedence 樣本 | ✅ 不碰任何既有樣本 |
| 內容真實性 | template / 半成品 → 對外曝光風險 | ✅ 從一開始就寫真實內容，non-placeholder |
| contentKind | download 形態 theme 未驗 | ✅ normal article（`life-note` / `tech-note`），Batch 0 已涵蓋同類 theme |
| commerce 複雜度 | book-review 帶 affiliate；download 帶 fileUrl | ✅ 可完全不放 affiliate/commerce，surface 最乾淨 |
| 根因隔離 | AdSense 破版根因會與 affiliate / download UX 混在一起 | ✅ 單純 article body + bottom AdSense slot，破版根因清晰 |
| 與 Batch 0 一致性 | 形態各異 | ✅ 與 Batch 0（we-media book-review / github-pages tech-note）同屬 indexable full article |

> 一句話：**寧可花力氣寫 1 篇真實、普通、indexable 的 full article，也不要把 SEO 樣本（mvp）、空 template（兩篇書評）或半成品 download（phonics）硬塞進 Batch 1。** 新文章自然 eligible，未來重做 am-2 inventory 即進候選池，且不欠任何政策 / 樣本 / 內容債。

### B.3 目標定位（重要）

- 本 plan 之目標 = 讓該文章**未來**成為 Blogger AdSense **Batch 1a / Batch 1 候選**。
- **不是**為了立即重貼。實際撰寫屬後續 content-mutation phase；實際 Blogger repost 屬更後面的另案 execution phase（須 user approval + 備份 + theme CSS 確認）。

---

## C. New article requirements

新文章必須**同時**符合以下硬條件（缺一即不 eligible）：

| # | requirement | 具體判準 | 對應 ads / policy 理由 |
|---|---|---|---|
| C1 | **full mode** | `publishTargets.blogger.enabled:true` + `publishTargets.blogger.mode:"full"` | summary / redirect-card renderer **不**注入 `articleAd6`（per Phase D / second-post 驗證） |
| C2 | **indexable** | **不**設 `seo.indexing:"noindex-*"`；亦**不**用會觸 SEO-1 noindex fallback 之 contentKind（即不可 `download`） | 避開 am-4 §E noindex+AdSense 政策議題 + 低流量 ROI |
| C3 | **ready / published readiness** | `status:"ready"` + `draft:false`（撰寫完成後） | draft 不進 build 輸出 |
| C4 | **normal article（非 download contentKind）** | `contentKind` ∈ {`life-note`, `tech-note`, `post`}；**不**為 `download` / `comic`（comic theme 未驗） | 避開 download theme readiness gate + noindex fallback |
| C5 | **non-placeholder** | 真實標題 / 真實 body / 真實 description；**無** `TODO` / `請在此撰寫` / 佔位空欄 | 空內容對外曝光 ⚠️ 可能違反 AdSense 政策 |
| C6 | **內容完整（非 demo / TODO / template）** | body 至少 intro + 3–5 主段 + conclusion，能獨立成文 | 同 C5 |
| C7 | **低 commerce complexity** | 最好**不放** affiliate / commerce ref；若要放，只能用 repo 既有安全模式（registry 既有 active `ref`），**不**新增 raw affiliate URL | 避免 ad slot 與 affiliate UX 同篇驗證混淆破版根因（per Phase F §E rule 6） |
| C8 | **適合 Blogger output** | category / tags 之 `site[]` 須含 `blogger`（否則 validator 報 `category-site-mismatch` / `tag-site-mismatch` warning，違反「production warnings = 0」）；不引入 Batch 0 未涵蓋之新 CSS class group | 維持 0 production warning + theme readiness |
| C9 | **適合之後檢查 bottom AdSense slot** | full + indexable + 有 body（讓 `beforeRelatedLinks` anchor 能 fire 出恰 1 個 `articleAd6`）；不需特殊政策、不需特殊 theme | dist HTML 可被 §H one-liner 驗證 |

### C.1 zero-settings-drift 之 category / tag 限制（關鍵）

由 `content/settings/categories.json` / `tags.json` 觀察（read-only）：

- **Blogger-valid category**（`site[]` 含 `blogger`）：`tech-note` / `book-review` / `download` / `life-note`。
- **Blogger-valid tag**（`site[]` 含 `blogger`）：`book` / `book-review` / `reading-notes` / `self-growth`。

→ 為了「**不改 settings**（不動 `categories.json` / `tags.json`）」且「**production warnings 維持 0**」，新 Blogger 文章**只能**從上述既有值挑選：

- category：建議 `life-note`（生活 / 心得型最乾淨，避開 book-review 的 affiliate 預期與 download 的 noindex fallback）或 `tech-note`。
- tags：建議 `reading-notes` + `self-growth`（指向閱讀 / 自我成長型 life-note，但**不**做成正式書評）。

> ⚠️ 若主題需要新 tag（例如「部落格經營」），會觸及 `tags.json` 變更 = settings drift，**不**符合本 plan 之 zero-drift 目標；該情況須另開 settings phase 評估，不在本推薦路徑內。本推薦第 1 篇刻意挑選「可完全重用既有 Blogger tag」之主題。

---

## D. Topic selection rules（3–5 低風險候選）

> 評估維度：proposed title / slug / intended path / why low risk / suitable for Batch 1a / needs commerce / needs images-assets-downloads / estimated complexity。所有候選皆 `site:"blogger"` / `mode:"full"` / indexable / non-download / non-placeholder。

### D.1 候選 1（**推薦**）：閱讀習慣養成心得（life-note）

| 欄位 | 值 |
|---|---|
| proposed title | 「我這一年養成每天閱讀的 5 個小方法」 |
| proposed slug | `daily-reading-habit-notes` |
| intended path | `content/blogger/posts/20260612-daily-reading-habit-notes.md` |
| why low risk | 純個人心得 life-note；無 affiliate、無下載檔、無 book metadata；category `life-note` + tags `reading-notes`/`self-growth` 皆 Blogger-valid（0 settings drift）；非核心商業轉換、非高流量入口 |
| suitable for Batch 1a | ✅ full + indexable + normal article + 真實內容 + bottom slot 可驗 |
| needs commerce links | ❌ 否（C7 最佳形態：完全不放） |
| needs images / assets / downloads | ❌ 無強制；cover 可用既有 placeholder（`/images/placeholders/cover-placeholder.svg`，github-pages-blog-planning 已用）→ 不需新素材 |
| estimated complexity | **低**（生活心得，約 600–900 字即可成文） |

### D.2 候選 2：自我成長 / 時間管理心得（life-note）

| 欄位 | 值 |
|---|---|
| proposed title | 「下班後還能寫部落格？我的時間切片實作筆記」 |
| proposed slug | `after-work-writing-time-blocking` |
| intended path | `content/blogger/posts/20260612-after-work-writing-time-blocking.md` |
| why low risk | life-note 心得；無商業轉換；tags 可用 `self-growth`（+ 視內容 `reading-notes`）；無素材依賴 |
| suitable for Batch 1a | ✅ 同候選 1 |
| needs commerce links | ❌ 否 |
| needs images / assets / downloads | ❌ 無強制；cover placeholder 即可 |
| estimated complexity | **低–中**（需具體舉例，約 800–1000 字） |

### D.3 候選 3：可搬家部落格的維護心得（tech-note，非 mvp 樣本）

| 欄位 | 值 |
|---|---|
| proposed title | 「為什麼我把文章寫在本機 Markdown，而不是直接打在後台」 |
| proposed slug | `why-local-markdown-first` |
| intended path | `content/blogger/posts/20260612-why-local-markdown-first.md` |
| why low risk | tech-note 經驗談；category `tech-note`（Blogger-valid）；**但** tech-note 之 Blogger-valid tag 目前只有間接（既有 tech-note 用 `github`/`vite`/`static-site` 皆 `site:["github"]`）→ ⚠️ 若 `site:"blogger"` 會 tag-site-mismatch | — |
| suitable for Batch 1a | ⚠️ 條件式：須改用 Blogger-valid tag（如 `self-growth`）或接受新增 tag（settings drift） |
| needs commerce links | ❌ 否 |
| needs images / assets / downloads | ❌ 無強制 |
| estimated complexity | **中**（須避免與 `portable-blog-system-mvp` SEO 樣本內容重疊） |

> ⚠️ 候選 3 之 tag 限制：現有 tech-note 類 tag（`github`/`vite`/`static-site`）皆 `site:["github"]`，放進 `site:"blogger"` 文章會觸 `tag-site-mismatch` warning。除非改用 `self-growth`（語意略勉強）或新增 Blogger tech-note tag（settings drift）。因此候選 3 zero-drift 程度不如候選 1/2。

### D.4 候選 4：讀書筆記方法論（life-note / 偏 reading-notes，非書評）

| 欄位 | 值 |
|---|---|
| proposed title | 「我的讀書筆記不是抄重點，而是問自己 3 個問題」 |
| proposed slug | `reading-notes-three-questions` |
| intended path | `content/blogger/posts/20260612-reading-notes-three-questions.md` |
| why low risk | life-note 方法論；**刻意不做成書評**（不需 book metadata / affiliate）；tags `reading-notes`/`self-growth` 完美對應（0 drift）；無素材依賴 |
| suitable for Batch 1a | ✅ 同候選 1 |
| needs commerce links | ❌ 否（與書評劃清界線，避免 affiliate 預期） |
| needs images / assets / downloads | ❌ 無強制；cover placeholder 即可 |
| estimated complexity | **低**（方法論心得，約 700–900 字） |

### D.5 候選比較

| 候選 | category | tags（zero-drift？） | needs commerce | needs assets | 複雜度 | zero settings drift |
|---|---|---|---|---|---|---|
| 1 閱讀習慣（**推薦**） | `life-note` | `reading-notes`+`self-growth` ✅ | 否 | 否 | 低 | ✅ |
| 2 寫作時間管理 | `life-note` | `self-growth`(+`reading-notes`) ✅ | 否 | 否 | 低–中 | ✅ |
| 3 本機 Markdown | `tech-note` | ⚠️ 須 `self-growth` 或新 tag | 否 | 否 | 中 | ⚠️ 條件式 |
| 4 讀書筆記方法 | `life-note` | `reading-notes`+`self-growth` ✅ | 否 | 否 | 低 | ✅ |

→ 候選 1 / 4 zero-drift 且複雜度最低；候選 2 次之；候選 3 因 tag 限制較不乾淨。

---

## E. Recommended first article

**選定候選 1：「我這一年養成每天閱讀的 5 個小方法」**（理由：複雜度最低、0 settings drift、0 commerce、0 素材依賴、與 Batch 0 同屬 indexable full article、與既有兩篇書評/技術筆記主題不重疊）。

| 項目 | 值 |
|---|---|
| title | 我這一年養成每天閱讀的 5 個小方法 |
| slug | `daily-reading-habit-notes` |
| target file path | `content/blogger/posts/20260612-daily-reading-habit-notes.md`（**僅此 1 檔；本 phase 不建立**） |
| expected status | `ready`（撰寫完成後；計畫草擬時可先 `draft` 再轉 `ready`） |
| expected mode | blogger `full`（github `publishTarget` 可不啟用，或 `enabled:false`） |
| expected indexing | indexable（**不**設 `seo.indexing`，亦不設任何 noindex 變體） |
| expected contentKind | `life-note`（normal article，非 download / 非 book-review） |

### E.1 why it is safer than mvp / download / draft book posts

| 對照 | 該文章 vs 對照文章 |
|---|---|
| vs `portable-blog-system-mvp` | 無 noindex（不卡 ⚠️ 政策）；非 SEO 樣本（不破壞 seo-1/seo-2 語意）；full（不需 mode flip）；非 download contentKind（不需 theme readiness gate） |
| vs `phonics-...-download` | 非 download；無 `download.fileUrl` 依賴；無真實 download block → 無 `.lab-download-box` theme 風險；indexable |
| vs `sample/draft-book-review` | non-placeholder（真實 body，非 TODO）；無空 book metadata；無 affiliate（不需 commerce ref 決策）；一開始即為真實內容，不是 template |

### E.2 proposed content outline（摘要；完整見 §G）

- intro：為什麼想養成每天閱讀 + 過去失敗經驗
- 主段 1–5：5 個具體小方法（固定時段 / 環境設計 / 微量起步 / 紀錄 / 找夥伴）
- conclusion：一年後的改變 + 給讀者的一句鼓勵（自然收尾，related links 前）

### E.3 expected future acceptance checks（撰寫 phase 完成後）

見 §H（only one post file touched / no drift / validate pass / production warnings 0 / dist Blogger HTML 含 bottom `articleAd6` slot / full+indexable+ready+non-placeholder）。

---

## F. Frontmatter plan（plan only — 不建立檔案）

> 以下為**建議 frontmatter 草案**，供未來 content-mutation phase 參考；本 phase **不**寫入任何檔案。欄位對齊既有 production post（we-media-myself2 / github-pages-blog-planning）schema。

| frontmatter 欄位 | 建議值 | 說明 |
|---|---|---|
| `id` | `"20260612-daily-reading-habit-notes"` | 與檔名一致 |
| `site` | `"blogger"` | 決定 category/tag site-match |
| `contentKind` | `"life-note"` | normal article（**非** download / book-review） |
| `primaryPlatform` | `"blogger"` | — |
| `title` | `"我這一年養成每天閱讀的 5 個小方法"` | non-placeholder |
| `titleEn` | `""`（可留空） | optional |
| `slug` | `"daily-reading-habit-notes"` | — |
| `date` | `"2026-06-12"` | 撰寫日 |
| `updated` | `"2026-06-12"` | — |
| `author` | `"Dean"` | 對齊既有 |
| `category` | `"life-note"` | Blogger-valid（0 drift） |
| `tags` | `["reading-notes", "self-growth"]` | 皆 Blogger-valid（0 drift；避免 tag-site-mismatch） |
| `description` | 真實一句話摘要（非佔位） | non-placeholder |
| `searchDescription` | 真實搜尋說明 | Blogger 搜尋說明用 |
| `cover` | `"/images/placeholders/cover-placeholder.svg"` | 重用既有 placeholder → 不需新素材（github-pages-blog-planning 已用此值） |
| `coverAlt` | 對應 alt 文字 | — |
| `status` | `"ready"`（撰寫完成後；草擬期 `"draft"`） | readiness gate |
| `draft` | `false`（撰寫完成後） | — |
| `canonical` | `"auto"` | — |
| `publishTargets.github` | `{ enabled: false }` 或省略 github full | 本篇定位 Blogger-only；如要 cross-publish 再評估 |
| `publishTargets.blogger` | `{ enabled: true, mode: "full" }` | **full**（C1） |
| `blocks` | `toc:false / adsenseTop:false / adsenseMiddle:false / adsenseBottom:false / hashtags:true / socialFollow:true / relatedPosts:false / sidebar:true` | legacy `adsenseTop/Bottom` 與新 resolver `articleAd6` 為兩套機制；bottom AdSense slot 由 `ads.config.json` `defaults.blocks[]` + `beforeRelatedLinks` anchor 自動注入，**不**靠 frontmatter `blocks.adsense*` |
| `seo` / `seo.indexing` | **省略**（→ indexable 預設） | C2：**不**引入 noindex |
| `book` | **省略** | 非書評 → 無 book metadata |
| `affiliate` / commerce | **先留空 / 省略** | C7：第 1 篇不放 affiliate；surface 最乾淨 |
| `download` | **省略** | C4：非 download |
| Blogger-specific（`blogger.publishedUrl` 等，於 `.publish.json` sidecar） | **本 phase 不規劃** | published URL 屬發布後回填（§24）；非新增文章必填；實際 repost phase 才處理 |

明確約束：

- ❌ **不**引入 `seo.indexing:"noindex-*"`
- ❌ **不**用 `contentKind:"download"`
- ❌ **不**新增 `categories.json` / `tags.json` 條目（只用既有 Blogger-valid 值）
- ❌ **不**放 raw affiliate URL / 新 commerce ref（第 1 篇 commerce 留空）

---

## G. Content outline plan

> 以下為**內容大綱與寫作要求**；本 phase **不**撰寫 body。

### G.1 大綱

- **intro（1 段）**：點出「想每天閱讀卻總是中斷」的共同處境 + 自己過去失敗的具體經驗，帶出本文要分享 5 個親測有效的小方法。
- **主段 1：固定一個「不需意志力」的閱讀時段**：通勤 / 睡前 / 早餐後擇一固定化，降低每天重新決定的成本。
- **主段 2：設計觸發環境**：把書放在會看到的地方、手機收進抽屜；用環境而非自律驅動行為。
- **主段 3：微量起步（每天只讀 2 頁）**：用極小目標破除啟動阻力，完成感比頁數重要。
- **主段 4：用最輕的方式做紀錄**：一句話心得 / 拍書頁，不抄重點；讓回看可累積成就感。
- **主段 5：找一個可對話的閱讀夥伴 / 社群**：外部輕度問責 + 分享動機。
- **conclusion（1 段）**：回顧一年後的具體改變（讀完幾本 / 心態轉變），以一句鼓勵讀者「從今晚 2 頁開始」自然收尾——**此收尾語氣適合直接銜接其後的 related links / hashtag 區段**，不需額外過渡句。

### G.2 寫作要求

| 要求 | 說明 |
|---|---|
| 字數 | 約 600–900 字（low complexity；足以讓 article body 自然、bottom slot 有合理上下文） |
| 真實性 | non-placeholder：每段須有具體例子或數字，**禁止** `TODO` / `請在此撰寫` / 空欄佔位 |
| 自然結尾 | conclusion 須能自然銜接 related links 之前（slot 位置：body → ad `articleAd6` → related-links/hashtags） |
| commerce | 第 1 篇**不**放 affiliate / 購書連結（與書評劃清；保持 surface 乾淨） |
| 素材 | 不依賴新圖片 / 下載檔；cover 用既有 placeholder |
| 語氣 / class | 一般 Blogger article（`.lab-blogger-article` + `.lab-article__*` + `.lab-hashtag*` + `.lab-related-links*`），不引入 Batch 0 未涵蓋之新 CSS class group |
| AdSense | 不需特殊政策（indexable）、不需特殊 theme；bottom slot 由系統自動注入，作者**不**手寫任何 ad markup / 不寫 real id |

---

## H. Acceptance criteria for future content mutation phase

未來真正新增此文章時（另開 content-mutation phase），須**同時**滿足：

- ✅ **only one new post file touched**：`git diff --name-only` 僅 `content/blogger/posts/20260612-daily-reading-habit-notes.md`（如需 `.publish.json` / `.fb.md` sidecar 則一併但仍限該 slug；不碰其他 post）
- ✅ **no source / settings / template drift**：`src/` / `content/settings/`（含 `categories.json` / `tags.json` / `ads.config.json`）/ `src/views/` / `package.json` / lockfile / `check-*.js` 全部 0 變更
- ✅ **no AdSense ID mutation**：未新增 / 未 hardcode real client / slot id；文章 body 無任何 ad markup
- ✅ **validate:content pass**：`validate:content` 0 errors
- ✅ **production warnings remain 0**：新 post 不觸發任何 production warning（category / tag site-match、frontmatter shape 全綠）；總計維持 `0/94/84`（或合理變動已說明）
- ✅ **generated Blogger HTML includes bottom AdSense slot**：`build:blogger` 後 `dist-blogger/posts/daily-reading-habit-notes/post.html` 含**恰 1 個** `lab-ad-slot--articleAd6` `<ins>`、**0 個** `articleAd1`–`articleAd5`、`data-ad-client` / `data-ad-slot` 與 `ads.config.json` strict-equal、無 `<%` / `%>` / `await include`；文件順序 body → ad slot → related-links/hashtags
- ✅ **article is full + indexable + ready + non-placeholder**：`mode:"full"` / 無 noindex / `status:"ready"` `draft:false` / body 真實非佔位
- ✅ **actual Blogger repost remains separate phase**：實際重貼 / publish / 開 Blogger 後台一律另開單一 phase，須 user approval + 備份 + theme CSS 確認；**不**在 content-mutation phase 內做

> evidence one-liner（撰寫 phase 用，read-only node，不 hardcode real id）：對 `dist-blogger/posts/daily-reading-habit-notes/post.html` 計 `lab-ad-slot--articleAd6` 出現數 = 1、`lab-ad-slot--articleAd[1-5]` = 0、`data-ad-client`/`data-ad-slot` 比對 `ads.config.json`、grep `<%`/`%>` = 0。

---

## I. Concrete next phases

> 以下為**選項**，非執行計畫；任一啟動須 user explicit approval 另開單一 phase。phase name 之 `XX` 由啟動時序決定。

| # | phase name | 目的 | 修改 content？ | 驗收方式 |
|---|---|---|---|---|
| I1（推薦主線） | `20260612-XX-blogger-content-daily-reading-habit-notes-one-post-content-a` | 依本 plan §E/§F/§G 實際新增 1 篇 `daily-reading-habit-notes.md`（single new file） | ✅ 是（僅 1 新檔） | §H 全部：only one file / no drift / validate 0-err / production warnings 0 / `build:blogger` dist 含 bottom `articleAd6` slot / full+indexable+ready+non-placeholder |
| I2 | `20260612-XX-blogger-adsense-daily-reading-habit-notes-slot-dry-run-docs-only-a` | 對 I1 新增後之 `dist-blogger/posts/daily-reading-habit-notes/post.html` 做 generated-HTML dry-run / slot verification（read-only one-liner evidence；**不** repost） | ❌ 否（read-only build + docs） | dist HTML one-liner pass（恰 1 `articleAd6` / 0 articleAd1–5 / data attrs strict-equal / 無 EJS leak）；記錄於 doc |
| I3 | `20260612-XX-blogger-adsense-batch-1a-mini-repost-packet-docs-only-a` | 對**已 eligible**（I1 完成 + I2 dry-run pass）之該 post 生成 Batch 1a copy/paste repost packet（mirror second-post readiness handoff；明文標示 Batch 1a mini，非正式 Batch 1 本體） | ❌ 否（packet only） | 產出 packet doc；六項 pre-repost inputs；不改 source/settings/frontmatter；**前置**：須已 eligible |
| I4（保守 / 預設） | （無新 phase）conservative pause | 維持暫停，不動 repo；等 user 決定是否啟動 I1 撰寫 | ❌ 否 | 每次新 phase 重做 am-2 inventory；出現 ≥1 eligible 才推進 |
| I5（並行 / 不衝突） | `20260612-XX-blogger-adsense-guard-parameterization-preanalysis-docs-only-a` | `check-blogger-adsense-output.js` 多 slug / multi-target 涵蓋設計（Option A CLI / B registry / C ready-full traversal）；與 Batch 1 解鎖正交 | ❌ 否（preanalysis） | 產出 preanalysis doc；不改 source/settings/guard/content |

**推薦序**：I1（實際寫第 1 篇，最乾淨解鎖）→ I2（dry-run 驗 slot）→ eligible 後 I3（Batch 1a packet）→ 最後才 repost execution。保守預設 I4；I5 可隨時並行。

🔴 **任何 live repost / Blogger 後台動作 / source / settings change，皆須 user explicit approval 後另開單一 phase。** 不在本 content-plan phase 範圍。

---

## J. Guardrails / non-actions（本 session 明確未做）

- ❌ no Blogger access（未登入 / 未開編輯器 / 未開 AdSense 後台）
- ❌ no repost / no publish
- ❌ no external front-end verification（不依賴 / 不宣稱任何 live Blogger 觀察）
- ❌ no new post file（**未新增任何文章檔**；只列 plan）
- ❌ no frontmatter / content mutation（6 篇既有 post 一律只讀，未改 draft / summary / noindex 狀態；未把任何 noindex / draft / download / placeholder 文章改成候選）
- ❌ no source / settings / template mutation（`src/` / `content/settings/`〔含 `categories.json` / `tags.json` / `ads.config.json`〕/ `src/views/` / `package.json` / lockfile / `check-*.js` 全未動）
- ❌ no build / deploy（docs-only；read-only baseline 僅跑 `validate:content`；未跑 `build:blogger` / `build:github` / sitemap）
- ❌ no `check:adsense-resolver` / `check:adsense-article-block` / `check:adsense-anchor-wiring` / `check:blogger-adsense-output`（無 source / settings 變更 → carry forward 前 phase measurement：resolver 34/0、article-block 13/0、anchor-wiring 14/0、blogger-output 14/0）
- ❌ no AdSense ID mutation（未新增 / 未 hardcode real client / slot id；未寫入 docs / fixture / test）
- ❌ no guard 參數化
- ❌ no gh-pages / no commerce / Admin / renderer 變更
- ❌ no CLAUDE.md compression
- ❌ no `/memory`
- ❌ no unrelated cleanup
- ❌ **no external Google AdSense policy claim**（本文件凡涉政策皆引 am-4 §E 之 ⚠️ 待確認結論，未自行腦補官方條文）

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 am-5（20260612）極小 ledger sync append。

---

## K. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）；**不含**完整 real AdSense client id / slot id。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
