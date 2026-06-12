# Blogger AdSense Batch 2 P2 — AI Workflow Life-Note Article Draft (docs-only)

Phase: `20260612-ai-workflow-article-draft-docs-only-a`

## 0. Status

- **docs-only article draft**，供人工審稿。**不**新增 content post、**不**發文、**不**重貼 Blogger。
- 本 phase **不**改 source / template / EJS / renderer / content production post / settings（含 `categories.json` / `tags.json` / `ads.config.json`）/ guard / fixtures / views / package / lockfile / dist / `.cache`。
- 本 phase **不** deploy、**不** npm install、**不**改 AdSense real id、**不**做 GA4 實作、**不**落地 P2 content。
- 唯一 mutation：本 doc 自身 + `CLAUDE.md` 極小 ledger sync append。
- 依據 = pm-10 candidate plan（`docs/20260612-blogger-batch2-new-low-risk-post-candidates.md`）§E.2 之 P2 候選 `ai-tools-simplify-daily-workflow`。
- 草稿 tone 參照已落地 life-note `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md` 與 P1 draft（`docs/20260612-blogger-p1-knowledge-base-article-draft.md`）（read-only 參照，未改該檔）。

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律以 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）表述。real id 僅存於 `content/settings/ads.config.json`。

> ⚠️ **核心紅線：Blogger VIEW count 增加只能視為 weak signal，不可當作真實流量或 AdSense 成效的判斷依據；草稿中不得出現任何保證流量 / 收益 / 排名的說法。**

> ⚠️ **這不是 AI 工具推薦文。** 草稿刻意克制 AI hype，不背書任何特定工具、不嵌 affiliate / commerce、不寫成技術教學或 prompt 教學。

---

## A. Phase name

`20260612-ai-workflow-article-draft-docs-only-a`

---

## B. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `6efad4d` |
| origin/main | `6efad4d` |
| ahead / behind | 0 / 0 |
| working tree | clean（撰寫前） |
| latest subject | `docs(blogger): record six-post adsense monitoring`（pm-19） |
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（production-post warnings = 0；94 全來自 `content/validation-fixtures/`） |
| live-verified inventory | 6 posts |
| automated guard coverage | 6 posts |

Baseline 與 user 期望一致（branch=main、HEAD==origin/main==`6efad4d`、working tree clean）；不做任何 fix。

---

## C. Draft metadata proposal

> 以下為**草稿提案**，非實際 frontmatter；本 phase 不建立 content 檔。未來若落地，建議 mirror `blog-as-personal-knowledge-base` 之 frontmatter 形態。

| 欄位 | 提案值 |
|---|---|
| proposed title | AI 工具很多，真正有用的是把日常流程變簡單 |
| tentative slug | `ai-tools-simplify-daily-workflow` |
| proposed id | `20260612-ai-tools-simplify-daily-workflow` |
| site | `blogger` |
| contentKind | `life-note` |
| primaryPlatform | `blogger` |
| category | `life-note`（Blogger-valid；0 settings drift） |
| tags | `self-growth`（Blogger-valid；0 settings drift；single tag，AI/工作流主題下不硬塞 `reading-notes`） |
| excerpt / description | AI 工具一波接一波，我用過一輪後發現，真正留下來的不是最酷的那些，而是默默把日常裡重複、零散、容易卡住的小流程變順的那幾個。 |
| searchDescription（提案） | 用過一輪 AI 工具後的個人心得：與其追新工具，不如讓重複、零散、容易卡住的日常小流程變簡單；工具可以加速，但判斷還是留給自己。 |
| intended reader | 被一堆 AI 工具洗版、想知道「日常到底該留哪些用法」的一般使用者 |
| content risk level | **低**（純個人使用心得；無醫療 / 投資 / 政治 / 法律 / 誇大 AI；不背書工具；無效率 / 收入承諾） |
| AdSense suitability note | 完整可讀之生活心得長文，最簡 life-note 形態（0 affiliate / 0 related-links / 純 body + hashtags）→ bottom `articleAd6` 預期在 hashtags 前自然 fire；內容非為廣告灌水 |
| commerce | **none**（0 affiliate / 0 commerce ref） |
| assets | **none**（cover 重用既有 placeholder `/images/placeholders/cover-placeholder.svg`；0 新圖 / 0 下載檔） |
| expected slot | **existing `articleAd6` bottom only**（不新增任何 slot） |
| publishTargets（提案） | `github.enabled:false` / `blogger.enabled:true` + `mode:"full"` |
| seo.indexing | **不設**（indexable；不引入 noindex） |
| status / draft（落地時） | `status:"ready"` / `draft:false`（**本 phase 仍為 docs 草稿，未落地**） |

---

## D. Full article draft

> 以下為**完整文章草稿**（約 1,250 中文字）。以 fenced block 呈現，避免污染本 doc 之標題層級；落地時 H1 為文章標題、H2 為段落。語氣：個人觀察、務實、溫和、不誇大；無流量 / 收益 / 排名 / 效率承諾；不背書特定工具；不寫成技術 / prompt 教學；結尾自然、無硬 CTA。

```markdown
# AI 工具很多，真正有用的是把日常流程變簡單

這一兩年，新的 AI 工具幾乎每隔一陣子就冒出一批。一開始我也跟著看、跟著試，深怕錯過什麼。但用過一輪之後，我反而慢慢冷靜下來：對我來說真正留下來的，不是看起來最厲害的那幾個，而是默默把日常裡那些重複、零散、容易卡住的小流程變順的工具。

## 一開始，我也以為 AI 工具要拿來做很大的事

剛接觸的時候，我總想著要用它做點「很厲害」的事——一次產出一大篇東西、或是解決什麼很大的難題。結果常常是試了幾次覺得新鮮，然後就放著不再打開了。後來我才發現，那種「拿來做大事」的期待，反而讓我很難把工具真正用進每天的生活裡。它變成一個偶爾把玩的東西，而不是真正幫上忙的幫手。

## 後來發現，小地方變順更有感

真正讓我願意一直用下去的，反而是一些很小的場景。比方說，把一段我自己寫得亂七八糟的筆記，請它幫我理順成比較好讀的樣子；或是把腦袋裡一堆雜念，先丟出來、再請它幫我分成幾個段落。這些事情本來我自己也能做，只是常常因為懶或卡住而拖著。當這些小地方變順了，我一天裡那種「卡卡的」感覺就少了很多。比起做大事，這種小小的順暢反而更有感。

## 把零散筆記整理成可以繼續用的材料

我自己最常用的，大概就是整理筆記。平常想到什麼會隨手記，但記下來的東西通常很零散，過幾天再看常常一頭霧水。現在我會把這些零碎的片段丟進工具，請它幫我大致分類、抓出重點，整理成我之後還接得下去的材料。我不會直接拿它整理完的版本當成成品，而是把它當成一個「先粗略歸位」的步驟——東西先被擺到差不多的位置，我再自己決定要留什麼、補什麼。

## 幫自己跨過卡住的第一步

另一個對我很有用的場景，是跨過「開頭」。很多時候我不是不會寫，而是卡在第一步：第一句話、初稿的雛形、待辦清單要怎麼拆。這種卡住的感覺，常常比實際的工作還累人。這時候我會請工具先給我一個很粗的版本，哪怕它寫得普通，至少讓我有個可以動手改的東西。對我來說，它的價值不是替我完成，而是幫我從「完全空白」變成「有東西可以改」，那一步往往是最難的。

## 工具可以加速，但不要把判斷交出去

不過用久了，我也提醒自己一件事：工具可以幫忙加速，但判斷不能整個交出去。它整理出來的東西，我還是會自己看過一遍——哪些是我真的同意的、哪些只是讀起來順但其實不是我的意思、哪些例子根本不是我的經驗。這些都得我自己過濾。如果我完全照單全收，做出來的東西雖然看起來完整，卻會慢慢變得不太像我自己。把判斷留在自己手上，工具才是幫手，而不是替身。

## 先讓流程變穩，再慢慢累積成果

所以到現在，我對 AI 工具的態度比較像是這樣：先別急著追新的、最酷的，而是先看看自己每天有哪些小流程一直卡卡的，再看工具能不能讓那幾個地方順一點。當這些日常的小環節變穩之後，事情自然比較不費力，我也才比較有餘裕去想要做的東西。

回頭看，工具換來換去其實沒那麼重要，重要的是我有沒有把自己的日常整理得更順。少了一些卡住的時刻，每天就輕鬆一點——對我來說，這就已經很夠了。
```

---

## E. Editorial notes

### E.1 這篇文章為什麼仍屬低風險

- 純個人使用心得，主題為「讓日常小流程變簡單」之生活觀察；**無**醫療 / 投資 / 政治 / 法律 / 誇大 AI 任何敏感領域。
- 0 commerce / 0 affiliate / 0 外部推銷連結；**不**點名任何特定工具（連免費 / 付費都不指名），自然避開工具背書與 affiliate 暗示。
- **不**承諾效率提升、收入提升、流量成長、排名成長；全文無「必用 / 最強 / 取代 / 一鍵完成 / 秒懂 / 懶人包神器」式字眼。
- **不**寫成技術教學 / prompt 教學；例子僅止於「整理筆記、初稿、段落、待辦」這類輕量日常場景。
- category `life-note` + tag `self-growth` 皆 Blogger-valid → 0 settings drift。

### E.2 哪些句子刻意避免 AI hype

- 標題「真正有用的是把日常流程變簡單」——把重心放在「日常變順」，**不**寫成「AI 必學 / 效率翻倍 / 取代人類」。
- 「真正留下來的，不是看起來最厲害的那幾個」——刻意淡化新工具崇拜，**避開**追流行式 hype。
- 「工具可以幫忙加速，但判斷不能整個交出去」——把 AI 定位在輔助，**不**寫成「全自動 / 一鍵完成」。
- 「它的價值不是替我完成，而是幫我從完全空白變成有東西可以改」——強調輔助而非替代，**不**誇大產能。
- 結尾「這就已經很夠了」——自然收束，**無**「快去用 / 立刻訂閱 / 點擊」式硬 CTA，也無任何成效保證。

### E.3 哪些地方可在人工審稿時加入個人經驗

- 「把一段我自己寫得亂七八糟的筆記理順」——可換成審稿者真實遇過的具體筆記情境（仍保持不指名工具）。
- 「把腦袋裡一堆雜念先丟出來、再分成幾個段落」——可補一個審稿者自己的待辦 / 段落整理小例子。
- 「卡在第一步：第一句話、初稿的雛形」——可換成審稿者實際最常卡住的開頭情境，增加真實感。
- 各 H2 段落皆可視個人風格微調語氣 / 增刪一兩句，不影響低風險定位；唯需維持「不指名工具、不誇大、不教學」三條紅線。

### E.4 是否需要補圖

- **預設不需要**：沿用既有 cover placeholder 即可；body 內不需插圖即可成立。若審稿者想加，屬未來 content phase 範疇（需新 asset），非本 draft 要求。

### E.5 是否需要 commerce link

- **不需要**：維持 0 commerce / 0 affiliate；底部僅既有 `articleAd6` slot，無販售區塊；文中未引入任何商品 / 工具連結。

### E.6 是否適合下一階段落地成 content post（初步判斷）

- **初步判斷：適合，但須等待人工審稿與明確 approval**。題材低風險、形態最簡（與 6 篇已 live PASS 之 post 中的 life-note 同型）、0 commerce / 0 asset / 0 settings drift；預期落地後 `validate:content` 0 觸發、`build:blogger` 後 dist HTML 恰 1 個 `articleAd6`。
- **但落地仍須**：user 審閱本草稿文字（特別是「不誇大 AI / 不背書工具」是否到位）→ explicit approval → 另開 single-new-file content phase（per pm-10 §H / am-12 §G/§H acceptance）。本 phase **不**落地。

---

## F. AI / AdSense caution

- **這不是 AI 工具推薦文** —— 全文不指名、不評測、不背書任何特定工具（免費或付費皆然）。
- **不承諾效率、收入、流量、排名** —— 草稿全文無此類話術；落地與重貼時亦不得加入。
- 若未來落地，**僅使用既有 `articleAd6` bottom slot**（與 6 篇 live post 一致）；底部 slot 在 hashtags 前自然 fire。
- **不新增任何廣告位**（不加 articleAd1–5、不加 legacy slot、不改 `ads.config.json`）。
- **不用 Blogger VIEW count 判斷成效** —— view count 是 weak signal，不代表真實流量 / impression / click / earning。
- 實際重貼 / publish 一律另開 execution phase（user approval + 備份 + theme CSS readiness）。

---

## G. Recommended next phases

- **Conservative（推薦預設）：stop after draft and wait for human review** — 停在草稿，等人工審稿（特別審「不誇大 AI / 不背書工具」是否到位）；維持 baseline 不動。
- **Optional：revise draft docs-only after human comments** — `20260612-XX-blogger-p2-ai-workflow-article-draft-revise-docs-only-a`：依審稿意見修訂草稿（仍 docs-only，不落地）。
- **Optional：after approval, create one content post file（later phase）** — `20260612-XX-blogger-content-ai-tools-simplify-daily-workflow-one-post-content-a`：經 user explicit approval 後 single new file 落地（per am-12 §G/§H acceptance：only one new file / 0 settings drift / validate pass / dist articleAd6=1）。
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
- ❌ no P2 content landing（本 phase 僅草稿，不落地）
- ❌ 不把文章寫成 AI 工具推薦文
- ❌ no CLAUDE.md compression / 無重排 / 無 unrelated 內容變動
- ❌ no `/memory`
- ❌ no unrelated cleanup
- ❌ no docs/README.md change（無近期 Blogger/AdSense docs index 慣例，故不動）
- ❌ **未把 Blogger VIEW count 增加判定為真實流量或 AdSense 成效**

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 ai-workflow-article-draft（20260612）極小 ledger sync append。

read-only 量測（未造成 mutation）：`validate:content` 0/94/84。其餘 AdSense guard（`check:blogger-adsense-output` 85/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0）因 source / settings / dist 無變更而 carry forward。

---

## I. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）；**不含**完整 real AdSense client id / slot id。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
