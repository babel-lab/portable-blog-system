# Blogger AdSense Batch 2 P1 — Knowledge-Base Article Draft (docs-only)

Phase: `20260612-knowledge-base-article-draft-docs-only-a`

## 0. Status

- **docs-only article draft**，供人工審稿。**不**新增 content post、**不**發文、**不**重貼 Blogger。
- 本 phase **不**改 source / template / EJS / renderer / content production post / settings（含 `categories.json` / `tags.json` / `ads.config.json`）/ guard / fixtures / views / package / lockfile / dist / `.cache`。
- 本 phase **不** deploy、**不** npm install、**不**改 AdSense real id、**不**做 GA4 實作、**不**直接寫另外 2 篇完整文章。
- 唯一 mutation：本 doc 自身 + `CLAUDE.md` 極小 ledger sync append。
- 依據 = pm-10 candidate plan（`docs/20260612-blogger-batch2-new-low-risk-post-candidates.md`）§E.1 之 P1 候選 `blog-as-personal-knowledge-base`。
- 草稿之 frontmatter 形態 mirror 既有 live life-note post `content/blogger/posts/20260612-daily-reading-habit-notes.md`（read-only 參照，未改該檔）。
- **修訂紀錄**：`20260612-pm-13`（baseline HEAD `2ace8d6`）依 pm-12 read-only review 之建議，補強 §D 文章草稿之 1–2 個具體個人例子（詳 §E.6）；title / slug / category / tags / 風險定位不變，仍為 docs-only 草稿、未落地 content。

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律以 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）表述。real id 僅存於 `content/settings/ads.config.json`。

> ⚠️ **核心紅線：Blogger VIEW count 增加只能視為 weak signal，不可當作真實流量或 AdSense 成效的判斷依據；草稿中不得出現任何保證流量 / 收益 / 排名的說法。**

---

## A. Phase name

`20260612-knowledge-base-article-draft-docs-only-a`

---

## B. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `0c235c4` |
| origin/main | `0c235c4` |
| ahead / behind | 0 / 0 |
| working tree | clean（撰寫前） |
| latest subject | `docs(blogger): plan low-risk batch2 post candidates`（pm-10） |
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（production-post warnings = 0） |

Baseline 與本 session 預期一致；不做任何 fix。

---

## C. Draft metadata proposal

> 以下為**草稿提案**，非實際 frontmatter；本 phase 不建立 content 檔。未來若落地，建議 mirror `daily-reading-habit-notes` 之 frontmatter 形態。

| 欄位 | 提案值 |
|---|---|
| proposed title | 為什麼我開始把部落格當成自己的知識倉庫 |
| tentative slug | `blog-as-personal-knowledge-base` |
| proposed id | `20260612-blog-as-personal-knowledge-base` |
| site | `blogger` |
| contentKind | `life-note` |
| primaryPlatform | `blogger` |
| category | `life-note`（Blogger-valid；0 settings drift） |
| tags | `self-growth`, `reading-notes`（皆 Blogger-valid；0 settings drift） |
| excerpt / description | 我一開始把部落格當成寫給別人看的東西，後來慢慢把它當成自己的知識倉庫——一個先寫給未來的自己、再順便給別人看的地方。 |
| searchDescription（提案） | 把部落格當成個人知識倉庫的心得：先寫給未來的自己、留下脈絡而非只留結論、用工作台的心態慢慢整理，先求穩定留下紀錄，再整理成作品。 |
| intended reader | 想長期累積筆記 / 怕學過就忘 / 想把零散想法整理成自己知識的人 |
| content risk level | **低**（純個人經驗心得；無醫療 / 投資 / 政治 / 法律 / 誇大） |
| AdSense suitability note | 完整可讀之生活心得長文，最簡 life-note 形態（0 affiliate / 0 related-links / 純 body + hashtags）→ bottom `articleAd6` 預期在 hashtags 前自然 fire；內容非為廣告灌水 |
| commerce | **none**（0 affiliate / 0 commerce ref） |
| assets | **none**（cover 重用既有 placeholder `/images/placeholders/cover-placeholder.svg`；0 新圖 / 0 下載檔） |
| expected slot | **existing `articleAd6` bottom only**（不新增任何 slot） |
| publishTargets（提案） | `github.enabled:false` / `blogger.enabled:true` + `mode:"full"` |
| seo.indexing | **不設**（indexable；不引入 noindex） |
| status / draft（落地時） | `status:"ready"` / `draft:false`（**本 phase 仍為 docs 草稿，未落地**） |

---

## D. Full article draft

> 以下為**完整文章草稿**（約 1,400 中文字；**pm-13 修訂版**——較初稿補入 1–2 個具體個人例子，降低通用心得文感）。以 fenced block 呈現，避免污染本 doc 之標題層級；落地時 H1 為文章標題、H2 為段落。語氣：個人觀察、務實、溫和、不誇大；無流量 / 收益 / 排名承諾；AI 工具僅輕描淡寫；無 Claude / phase / commit / HEAD / GitHub 操作細節；結尾自然、無硬 CTA。

```markdown
# 為什麼我開始把部落格當成自己的知識倉庫

一開始經營部落格的時候，我總把它想成一個「對外」的東西：要寫得完整、最好有人看、再被搜尋到。但寫了一陣子之後，我的想法慢慢變了——我開始把部落格當成自己的知識倉庫，一個先寫給自己、再順便給別人看的地方。這個轉變聽起來很小，卻讓我寫得比以前輕鬆，也持久很多。

## 以前寫文章，總覺得要寫給很多人看

剛開始我每篇文章都想著「別人會怎麼看」。題目要夠吸引人、內容要夠齊全、結尾還要有個漂亮的總結。結果就是我常常一篇寫到一半就卡住，因為它在我心裡的門檻太高了。沒寫完的草稿越積越多，最後乾脆都不寫了。現在回頭看，那時候真正讓我寫不下去的，不是沒有東西可寫，而是我把「發表」想得太慎重。

## 後來發現，先寫給未來的自己看也很重要

真正讓我重新開始寫的，是一個很實際的需求：我老是忘記自己以前查過、想過的東西。舉一個很小的例子——整理部落格版面的時候，光是「文章底部那一塊要放哪些內容、封面圖要縮到多寬才不會把版面擠壞」這種瑣事，我前前後後就重新查了好幾次，每次都忘記上一次到底是怎麼決定的，只好再從頭摸索一遍。後來我乾脆把這些過程順手記在部落格上，純粹寫給未來的自己看。神奇的是，當讀者從「很多人」變成「幾個月後的我」，我反而更願意把細節寫清楚，因為我知道那個會回來翻的人，就是我自己。

## 部落格像是一個可以慢慢整理的工作台

我現在比較喜歡把部落格想成一個工作台，而不是一個展示櫃。工作台上可以有半成品、有還在測試的想法、有暫時的筆記。它不需要每個角落都收得整整齊齊，重要的是東西都在、找得到。把它當工作台之後，我不再覺得每篇文章都得是「完成品」，這讓我願意更頻繁地把東西放上去。

## 不一定每篇文章都要很完整，但要留下脈絡

不過「不追求完整」不代表隨便寫。我給自己的標準是：可以不完整，但要留下脈絡。說來有點不好意思，你現在看到的這篇文章，最早其實只是我筆記裡的幾句牢騷——大概就是「為什麼我老是寫不完一篇文章」這種抱怨。那幾句話擺在那裡好一陣子，某天我重看，才發現底下藏著一個我真正想講的想法，於是慢慢補成現在這篇。如果當初我嫌它太零碎、不夠完整就刪掉，這篇大概就不存在了。所以哪怕只是幾段文字，只要把當時在想什麼的脈絡留著，未來的自己就接得回來。真正會讓筆記失效的，往往不是不夠精緻，而是只留了結論、卻忘了當初為什麼這樣想。

## AI 工具可以幫忙整理，但想法還是要自己判斷

這一兩年我也會用一些 AI 工具幫忙整理草稿，例如把一堆零散、跳來跳去的筆記理成比較順的段落，或是幫我想幾個標題讓我挑。它確實省了我不少力氣。但我盡量提醒自己，工具能幫的是「整理」，不是「判斷」。像剛剛那幾段被理順的文字，我還是會一句一句看過，把不是我真正想說的、或語氣太用力的地方改掉或刪掉。哪些觀點是我真的認同、哪些例子是我自己經歷過的，這些終究得我自己決定。把判斷留給自己，寫出來的東西才會是我的知識，而不只是一篇讀起來通順的文章。

## 先求穩定留下紀錄，再慢慢整理成作品

所以現在我的順序變了：先求穩定地把東西留下來，之後再慢慢整理成比較完整的文章。先有原料，才談得上加工。當倉庫裡的東西夠多、夠雜，反而更容易看出哪些主題我一直在想、哪些值得花時間寫成一篇正式的文章。

回頭看，把部落格當成自己的知識倉庫之後，我對「有沒有人看」就沒那麼焦慮了。有人看當然會開心，但就算暫時沒有，這些紀錄對我自己也已經有用。寫部落格這件事，因此從一個需要咬牙堅持的目標，慢慢變成一件我願意一直做下去的小習慣。
```

---

## E. Editorial notes

### E.1 這篇文章為什麼低風險

- 純個人經驗心得，主題為「把部落格當知識倉庫」之生活觀察；**無**醫療 / 投資 / 政治 / 法律 / 誇大 AI 任何敏感領域。
- 0 commerce / 0 affiliate / 0 外部推銷連結；不點名工具背書。
- 不承諾流量、收益、排名；不宣稱 AdSense 會賺錢；無誇大標題。
- category `life-note` + tags `self-growth` / `reading-notes` 皆 Blogger-valid → 0 settings drift。

### E.2 哪些句子刻意避免誇大

- 「這個轉變聽起來很小」「也持久很多」——形容個人感受，**不**寫成「保證高產出 / 效率倍增」。
- 「工具能幫的是整理，不是判斷」——刻意把 AI 定位在輔助，**不**寫成「AI 必學 / 取代人類 / 秒懂」。
- 「我對有沒有人看就沒那麼焦慮了」——把重心放在自用價值，**避開**任何「流量成長 / 變現 / 被動收入」暗示。
- 結尾「願意一直做下去的小習慣」——自然收束，**無**「快去開始 / 立刻訂閱 / 點擊」式硬 CTA。

### E.3 哪些地方可在人工審稿時加個人經驗

- 「同一個問題，我可能半年內查了三次」——可換成審稿者真實遇過的具體題目（例如某個設定 / 某個流程），增加可信度。
- 「把零散的筆記理成比較順的段落」——可補一句審稿者實際用 AI 工具的小例子（仍保持輕描淡寫，不變成工具推薦）。
- 「工作台上可以有半成品」——可加一個審稿者自己的半成品筆記例子。
- 各 H2 段落皆可視個人風格微調語氣 / 增刪一兩句，不影響低風險定位。

### E.4 是否需要補圖

- **預設不需要**：沿用既有 cover placeholder 即可；body 內不需要插圖即可成立。若審稿者想加，屬未來 content phase 範疇（需新 asset），非本 draft 要求。

### E.5 是否適合下一階段落地成 content post（初步判斷）

- **初步判斷：適合**。題材低風險、形態最簡（與 3 篇已 live PASS 之 life-note 同型）、0 commerce / 0 asset / 0 settings drift；預期落地後 `validate:content` 0 觸發、`build:blogger` 後 dist HTML 恰 1 個 `articleAd6`。
- **但落地仍須**：user 審閱本草稿文字 → explicit approval → 另開 single-new-file content phase（per pm-10 §H / am-12 §G/§H acceptance）。本 phase **不**落地。

### E.6 pm-13 修訂：補入哪些個人化細節 + 為何仍低風險

**這次補了哪些個人化細節（1–3 處，皆一般讀者看得懂、無內部術語）：**

1. **「整理部落格版面」的反覆查找例子**（§D 第 2 段「先寫給未來的自己」）：把原本通用的「同一問題查了三次」，改成具體的「文章底部那一塊要放哪些內容、封面圖要縮到多寬才不會把版面擠壞」這種瑣事反覆重查 —— 用一般部落格作者都會遇到的版面 / 圖片情境，不涉任何 repo / build / 後台術語。
2. **「這篇文章本身來自一則半成品筆記」的例子**（§D 第 4 段「留下脈絡」）：新增 self-referential 細節 —— 本文最早只是筆記裡「為什麼我老是寫不完一篇文章」的幾句牢騷，擱著一陣子後才補成完整文章；示範「零碎筆記 → 完整文章」且增加真實感。
3. **AI 工具的具體自我判斷例子**（§D 第 5 段「AI 工具」）：把原本概括的「想法自己判斷」，改成具體的「被理順的段落會一句一句看過、把語氣太用力或不是真正想說的刪掉」，強化「工具整理、判斷在己」而**不**變成工具推薦。

**為什麼仍然低風險：**

- 三處例子皆為個人寫作 / 版面整理之生活情境，**無**醫療 / 投資 / 政治 / 法律 / 誇大內容。
- **無**任何 repo / Claude / phase / commit / HEAD / GitHub / validator / build / deploy 等內部操作字眼（「整理部落格版面」為一般讀者語彙）。
- AI 工具仍維持輕描淡寫、定位在輔助；**未**變成 AI 工具推薦文、**未**變成技術教學。
- 全文仍**無**流量 / 收益 / 排名 / AdSense 會賺錢之任何承諾；標題 / slug / category（`life-note`）/ tags（`self-growth`,`reading-notes`）不變 → 0 settings drift 不變。
- 字數約 1,400 中文字，落在 900–1,500 區間。

**是否仍不需要補圖**：仍不需要 —— 沿用既有 cover placeholder 即可；新增例子皆為文字敘述，body 內無需插圖。

**是否仍不需要 commerce link**：仍不需要 —— 維持 0 commerce / 0 affiliate；底部僅既有 `articleAd6` slot，無販售區塊；補入之例子未引入任何商品 / 連結。

---

## F. Blogger / AdSense caution

- 若未來落地，**僅使用既有 `articleAd6` bottom slot**（與 5 篇 live post 一致）；底部 slot 在 hashtags 前自然 fire。
- **不新增任何廣告位**（不加 articleAd1–5、不加 legacy slot、不改 `ads.config.json`）。
- **不用 Blogger VIEW count 判斷成效**：view count 是 weak signal，不代表真實流量 / impression / click / earning。
- **不把草稿中的任何說法寫成保證流量或收益**：本草稿全文無流量 / 收益 / 排名承諾，落地與重貼時亦不得加入此類話術。
- 實際重貼 / publish 一律另開 execution phase（user approval + 備份 + theme CSS readiness）。

---

## G. Recommended next phases

- **Conservative（推薦預設）：stop after draft and wait for human review** — 停在草稿，等人工審稿；維持 baseline 不動。
- **Optional：revise draft docs-only after human comments** — `20260612-XX-blogger-p1-knowledge-base-article-draft-revise-docs-only-a`：依審稿意見修訂草稿（仍 docs-only，不落地）。
- **Optional：after approval, create one content post file（later phase）** — `20260612-XX-blogger-content-blog-as-personal-knowledge-base-one-post-content-a`：經 user explicit approval 後 single new file 落地（per am-12 §G/§H acceptance：only one new file / 0 settings drift / validate pass / dist articleAd6=1）。
- **Optional：after content validation, create manual Blogger repost packet（docs-only）** — 文章落地並通過 generated-HTML 驗證後再打包 repost packet（docs-only；不執行重貼）。
- **Not advised：create 3 posts / publish / repost in same phase** — 不在同一 phase 連寫多篇 + 落地 + 發布。

---

## H. Explicit non-actions（本 session 明確未做）

- ❌ no source change（`src/` 全未動）
- ❌ no template / renderer change（EJS / build 未動）
- ❌ no content production post change（未新增文章檔；既有 post 一律只讀未動，含 `daily-reading-habit-notes` 僅 read-only 參照）
- ❌ no Blogger publish / repost / 登入後台 / 開編輯器 / 開 AdSense 後台
- ❌ no AdSense ID change / hardcode（real id 仍只存 `ads.config.json`）
- ❌ no GA4 implementation
- ❌ no deploy / no push gh-pages / no `.cache` mutation
- ❌ no npm install / no package / lockfile change
- ❌ no settings change（`categories.json` / `tags.json` / `ads.config.json` 未動）
- ❌ no guard change（`check-blogger-adsense-output.js` 未動）
- ❌ 不直接寫另外 2 篇完整文章（本 phase 僅 P1 一篇草稿）
- ❌ no CLAUDE.md compression / 無重排 / 無 unrelated 內容變動
- ❌ no `/memory`
- ❌ no unrelated cleanup
- ❌ **未把 Blogger VIEW count 增加判定為真實流量或 AdSense 成效**

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之（20260612 knowledge-base-article-draft）極小 ledger sync append。

read-only 量測（未造成 mutation）：`validate:content` 0/94/84。其餘 AdSense guard（`check:blogger-adsense-output` 71/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0）因 source / settings / dist 無變更而 carry forward。

---

## I. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）；**不含**完整 real AdSense client id / slot id。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
