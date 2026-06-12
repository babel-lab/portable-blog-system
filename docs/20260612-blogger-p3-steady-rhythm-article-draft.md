# Blogger AdSense Batch 2 P3 — Steady-Rhythm Life-Note Article Draft (docs-only)

Phase: `20260612-pm-28-blogger-p3-steady-rhythm-article-draft-docs-only-a`

## 0. Status

- **docs-only article draft**，供人工審稿。**不**新增 content post、**不**發文、**不**重貼 Blogger。
- 本 phase **不**改 source / template / EJS / renderer / content production post / settings（含 `categories.json` / `tags.json` / `ads.config.json`）/ guard / fixtures / views / package / lockfile / dist / `.cache`。
- 本 phase **不** deploy、**不** npm install、**不**改 AdSense real id、**不**做 GA4 實作、**不**落地 P3 content。
- 唯一 mutation：本 doc 自身 + `CLAUDE.md` 極小 ledger sync append。
- 依據 = pm-10 candidate plan（`docs/20260612-blogger-batch2-new-low-risk-post-candidates.md`）§E.3 之 P3 候選 `blog-restart-steady-rhythm-notes`。
- 草稿 tone / caution 參照 P1 draft（`docs/20260612-blogger-p1-knowledge-base-article-draft.md`）、P2 draft（`docs/20260612-blogger-p2-ai-workflow-article-draft.md`）與已落地 life-note `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md`（read-only 參照，未改該檔）。

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律以 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）表述。real id 僅存於 `content/settings/ads.config.json`。

> ⚠️ **核心紅線：Blogger VIEW count 增加只能視為 weak signal，不可當作真實流量或 AdSense 成效的判斷依據；草稿中不得出現任何保證流量 / 收益 / 排名的說法。**

> ⚠️ **這不是流量成長教學文、也不是 AdSense 收益教學文。** 草稿刻意把焦點放在「穩定的節奏與心態」，不承諾流量 / 收入 / 排名，不把 view count 當 KPI。

---

## A. Phase name

`20260612-pm-28-blogger-p3-steady-rhythm-article-draft-docs-only-a`

---

## B. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `6f369f8` |
| origin/main | `6f369f8` |
| ahead / behind | 0 / 0 |
| working tree | clean（撰寫前） |
| latest subject | `docs(blogger): prepare ai workflow repost packet`（pm-27） |
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（production-post warnings = 0；94 全來自 `content/validation-fixtures/`） |
| live-verified inventory | 6 posts |
| automated guard coverage | 6 posts |

Baseline 與 user 期望一致（branch=main、HEAD==origin/main==`6f369f8`、working tree clean）；不做任何 fix。

---

## C. Draft metadata proposal

> 以下為**草稿提案**，非實際 frontmatter；本 phase 不建立 content 檔。未來若落地，建議 mirror `blog-as-personal-knowledge-base` 之 frontmatter 形態。

| 欄位 | 提案值 |
|---|---|
| proposed title | 個人部落格重啟筆記：先求穩定，再求流量 |
| tentative slug | `blog-restart-steady-rhythm-notes` |
| proposed id | `20260612-blog-restart-steady-rhythm-notes` |
| site | `blogger` |
| contentKind | `life-note` |
| primaryPlatform | `blogger` |
| category | `life-note`（Blogger-valid；0 settings drift） |
| tags | `self-growth`（Blogger-valid；0 settings drift；single tag——本主題不硬塞 `reading-notes`） |
| excerpt / description | 隔了一段時間沒更新，這次重啟部落格我決定先不急著追什麼，而是先把穩定更新、穩定整理、穩定檢查的節奏建立起來。 |
| searchDescription（提案） | 個人部落格重啟筆記：與其一開始追流量、排程、變現，不如先把寫作與整理流程變簡單、建立願意穩定回來的節奏；先求穩定，再求流量。 |
| intended reader | 想重新開始經營部落格、又怕像以前一樣熱度過了就停擺的人 |
| content risk level | **低**（純個人經營心得；無醫療 / 投資 / 政治 / 法律 / 誇大；**無流量·收益·排名承諾**） |
| AdSense suitability note | 完整可讀之生活心得長文，最簡 life-note 形態（0 affiliate / 0 related-links / 純 body + hashtags）→ bottom `articleAd6` 預期在 hashtags 前自然 fire；內容非為廣告灌水 |
| commerce | **none**（0 affiliate / 0 commerce ref） |
| assets | **none**（cover 重用既有 placeholder `/images/placeholders/cover-placeholder.svg`；0 新圖 / 0 下載檔） |
| expected slot | **existing `articleAd6` bottom only**（不新增任何 slot） |
| publishTargets（提案） | `github.enabled:false` / `blogger.enabled:true` + `mode:"full"` |
| seo.indexing | **不設**（indexable；不引入 noindex） |
| status / draft（落地時） | `status:"ready"` / `draft:false`（**本 phase 仍為 docs 草稿，未落地**） |

---

## D. Full article draft

> 以下為**完整文章草稿**（約 1,300 中文字）。以 fenced block 呈現，避免污染本 doc 之標題層級；落地時 H1 為文章標題、H2 為段落。語氣：個人觀察、務實、溫和、不誇大；**無流量 / 收益 / 排名承諾**；不把 view count 當 KPI；不寫成流量成長 / AdSense 收益教學；無內部操作字眼；結尾自然、無硬 CTA。

```markdown
# 個人部落格重啟筆記：先求穩定，再求流量

隔了好一段時間沒更新，重新打開自己的部落格時，心情其實有點複雜。一方面想趕快把它弄起來，一方面又怕像以前一樣，熱度過了就又停擺。這次我決定換個方式：先不急著追什麼，而是先把「穩定」這件事顧好。

## 一開始重啟部落格，很容易想一次做很多事

重啟的時候最容易犯的，大概就是想一次做太多。我一開始也是這樣：想重新排版、想規劃一整年的主題、想研究怎麼讓更多人看到、甚至開始算哪天發文比較好。清單列得很長，結果光是看著就累，真正動手寫的時間反而被排到最後。後來我才意識到，這些「之後再做也來得及」的事，把我重新開始的力氣都先耗光了。

## 後來發現，穩定比衝刺更重要

我以前總覺得，重啟就要有個漂亮的開場，最好一口氣連發好幾篇、先把氣勢做出來。但那種衝刺通常撐不久，衝完一波就沒力氣，接著又是長長的空白。這次我提醒自己：與其偶爾爆發，不如慢一點但穩一點。哪怕一週只動一次、只整理一小段，只要不再整個停掉，對我來說就比那種短暫的熱鬧實在得多。

## 先把寫作和整理流程變簡單

要能穩定，前提是別把每次更新都搞得很費力。所以我刻意把流程砍到很簡單：想到什麼先隨手記下來、有空再挑一則展開、寫完順手整理一下就好。我不再要求自己每次都從零生出一篇完整文章，而是讓「繼續」這件事的門檻越低越好。流程越簡單，我越不會因為「今天好麻煩」就乾脆不做。

## 不急著用數字判斷成敗

重啟初期我也會忍不住想看數字，但我盡量提醒自己：現在還太早。剛回來沒多久，那些數字起起伏伏，多半說明不了什麼，看了反而容易心浮氣躁。對現在的我來說，更值得在意的是這一件事：這週我有沒有回來、有沒有留下一點東西。把判斷成敗的標準，從「有多少人看」換成「我有沒有持續」，心情穩很多，也比較不會因為一時冷清就想放棄。

## 每篇文章都留下可以檢查的標準

為了讓自己安心，我給每篇文章設了幾個很簡單、可以自己檢查的標準：標題有沒有說清楚在講什麼、正文有沒有寫完、有沒有留下一句我真正想說的話。這些標準不嚴格，但有了它們，我就不用每次都靠當下的感覺來判斷「這篇到底行不行」。能自己檢查，就比較不會一直懷疑自己，也比較容易放心地按下發布。

## 先讓自己願意回來，再慢慢把內容變好

回頭看，這次重啟我最在意的，其實不是一開始就做得多漂亮，而是讓自己「願意一直回來」。先把節奏穩住、把流程顧簡單、把標準訂清楚，等這些都不太需要硬撐之後，再慢慢去想內容能不能更好、能不能寫得更深。順序對了，後面的事才走得遠。至於其他的，就等穩定之後再說吧——先把自己留下來，對現在的我來說比什麼都重要。
```

---

## E. Editorial notes

### E.1 這篇文章為什麼低風險

- 純個人經營心得，主題為「重啟部落格先求穩定」之生活觀察；**無**醫療 / 投資 / 政治 / 法律 / 誇大任何敏感領域。
- 0 commerce / 0 affiliate / 0 外部推銷連結；不點名工具 / 平台課程 / 變現方案。
- **不承諾流量、收益、排名**；**不**宣稱 AdSense 會賺錢；**不**鼓勵短時間大量發文（內文反而勸阻衝刺式發文）。
- **不把 Blogger VIEW count 當成功指標**——內文明確把判斷標準從「有多少人看」改成「我有沒有持續」。
- category `life-note` + tag `self-growth` 皆 Blogger-valid → 0 settings drift。

### E.2 哪些句子刻意避免流量 / 收益 / 排名誇大

- 標題「先求穩定，再求流量」——「再求流量」是**順序與心態**，非承諾流量會成長；內文結尾「至於其他的，就等穩定之後再說」進一步淡化，不保證結果。
- 「與其偶爾爆發，不如慢一點但穩一點」——把價值放在可持續，**不**寫成「快速成長 / 爆紅 / 流量翻倍」。
- 「把判斷成敗的標準，從『有多少人看』換成『我有沒有持續』」——主動拆解 view count 作為 KPI 的迷思。
- 全文**無** AdSense / 收益 / 變現 / 排名字眼，**無**「必賺 / 穩賺 / 被動收入 / 流量密碼」式誇大。
- 結尾「先把自己留下來，比什麼都重要」——自然收束，**無**「快訂閱 / 立刻追蹤 / 點擊」式硬 CTA。

### E.3 哪些地方可在人工審稿時加入個人經驗

- 「想重新排版、想規劃一整年的主題、甚至開始算哪天發文」——可換成審稿者重啟時真實列過的待辦清單。
- 「哪怕一週只動一次、只整理一小段」——可換成審稿者實際能維持的最小節奏（每幾天 / 每週）。
- 「給每篇文章設了幾個可以自己檢查的標準」——可補審稿者自己真正在用的 1–2 條檢查標準，增加真實感。
- 各 H2 段落皆可視個人風格微調語氣 / 增刪一兩句，不影響低風險定位；唯需維持「不承諾流量·收益·排名、不把 view count 當 KPI」紅線。

### E.4 是否需要補圖

- **預設不需要**：沿用既有 cover placeholder 即可；body 內不需插圖即可成立。若審稿者想加，屬未來 content phase 範疇（需新 asset），非本 draft 要求。

### E.5 是否需要 commerce link

- **不需要**：維持 0 commerce / 0 affiliate；底部僅既有 `articleAd6` slot，無販售區塊；文中未引入任何商品 / 課程 / 工具連結。

### E.6 是否適合下一階段落地成 content post（初步判斷）

- **初步判斷：適合，但須等待人工審稿與明確 approval**。題材低風險、形態最簡（與 6 篇已 live PASS 之 post 中的 life-note 同型）、0 commerce / 0 asset / 0 settings drift；預期落地後 `validate:content` 0 觸發、`build:blogger` 後 dist HTML 恰 1 個 `articleAd6`。
- **但落地仍須**：user 審閱本草稿文字（特別是「不承諾流量·收益·排名、不把 view count 當 KPI」是否到位）→ explicit approval → 另開 single-new-file content phase（per pm-10 §H / am-12 §G/§H acceptance）。本 phase **不**落地。

---

## F. Blogger / AdSense caution

- **這不是流量成長教學文** —— 全文不教「如何衝高流量 / 排名 / 訂閱」，焦點在個人節奏與心態。
- **這不是 AdSense 收益教學文** —— 全文不提如何用 AdSense 賺錢，不宣稱會有收益。
- **不承諾流量、排名、收入** —— 草稿全文無此類話術；落地與重貼時亦不得加入。
- 若未來落地，**僅使用既有 `articleAd6` bottom slot**（與 6 篇 live post 一致）；底部 slot 在 hashtags 前自然 fire。
- **不新增任何廣告位**（不加 articleAd1–5、不加 legacy slot、不改 `ads.config.json`）。
- **不用 Blogger VIEW count 判斷成效** —— view count 是 weak signal，不代表真實流量 / impression / click / earning；本文主旨更直接反對把 view count 當 KPI。
- 實際重貼 / publish 一律另開 execution phase（user approval + 備份 + theme CSS readiness）。

---

## G. Recommended next phases

- **Conservative（推薦預設）：stop after draft and wait for human review** — 停在草稿，等人工審稿（特別審「不承諾流量·收益·排名、不把 view count 當 KPI」是否到位）；維持 baseline 不動。
- **Optional：revise draft docs-only after human comments** — `20260612-XX-blogger-p3-steady-rhythm-article-draft-revise-docs-only-a`：依審稿意見修訂草稿（仍 docs-only，不落地）。
- **Optional：after approval, create one content post file（later phase）** — `20260612-XX-blogger-content-blog-restart-steady-rhythm-notes-one-post-content-a`：經 user explicit approval 後 single new file 落地（per am-12 §G/§H acceptance：only one new file / 0 settings drift / validate pass / dist articleAd6=1）。
- **Optional：after content validation, create manual Blogger repost packet（docs-only）** — 文章落地並通過 generated-HTML 驗證後再打包 repost packet（docs-only；不執行重貼）。
- **Not advised：content landing / publish / repost in same phase** — 不在同一 phase 落地 + 發布 + 重貼。

---

## H. Explicit non-actions（本 session 明確未做）

- ❌ no source change（`src/` 全未動）
- ❌ no template / renderer change（EJS / build 未動）
- ❌ no settings / `ads.config.json` change（real id 仍只存 `ads.config.json`）
- ❌ no content production post change（未新增文章檔；既有 post 一律只讀參照未動，含 `blog-as-personal-knowledge-base`）
- ❌ no Blogger publish / repost / 登入後台 / 開編輯器 / 開 AdSense 後台
- ❌ no AdSense ID change / hardcode
- ❌ no deploy / no push gh-pages / no `.cache` mutation
- ❌ no npm install / no package / lockfile change
- ❌ no GA4 implementation
- ❌ no new AdSense slot
- ❌ no guard coverage change（`check-blogger-adsense-output.js` 未動）
- ❌ no new assets / no new commerce links
- ❌ no P3 content landing（本 phase 僅草稿，不落地）
- ❌ 不把文章寫成流量成長教學或 AdSense 收益教學
- ❌ no CLAUDE.md compression / 無重排 / 無 unrelated 內容變動
- ❌ no `/memory`
- ❌ no unrelated cleanup
- ❌ no docs/README.md change（無近期 Blogger/AdSense docs index 慣例，故不動）
- ❌ **未把 Blogger VIEW count 增加判定為真實流量或 AdSense 成效**

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 pm-28（20260612）極小 ledger sync append。

read-only 量測（未造成 mutation）：`validate:content` 0/94/84。其餘 AdSense guard（`check:blogger-adsense-output` 85/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0）因 source / settings / dist 無變更而 carry forward。

---

## I. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）；**不含**完整 real AdSense client id / slot id。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
