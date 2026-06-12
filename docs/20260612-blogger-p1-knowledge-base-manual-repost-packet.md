# Blogger AdSense Batch 2 P1 — `blog-as-personal-knowledge-base` Manual Repost Packet

Phase: `20260612-pm-16-blogger-p1-knowledge-base-manual-repost-packet-docs-only-a`

## 0. Status

- **docs-only repost packet**。本 phase **不** repost / paste / publish / 開 Blogger 後台 / 開 AdSense 後台 / deploy / push gh-pages / 做外部前台驗證。
- 本 phase **不**改 src / content / settings（含 `ads.config.json`）/ fixtures / views / templates / package / lockfile / guard / gh-pages / `.cache`；**不**新增 assets / commerce links。
- 本 phase **不**改 guard scope（`check-blogger-adsense-output.js` 維持 5-target；**本 post 尚未納入**）。
- 目的：把 pm-15 落地之 Batch 2 P1 文章 `blog-as-personal-knowledge-base` 之手動重貼準備工作打包，讓 user 之後可直接照本 packet 操作。
- **actual live repost 仍 🔴 BLOCKED**，須 user 完成 §D pre-repost inputs + explicit separate approval 始可執行。

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律以 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）/ masked（`ca-pub-…****`）表述。real id 僅存於 `content/settings/ads.config.json`，由 build 透過 `deriveRenderedAdsenseBlocks(...)` 寫入 dist HTML；不在 docs / source / EJS / tests / package 內 hardcode。

> ⚠️ 本文件**不代表已完成** Blogger 外部重貼。文中所有「verified」一律指 **repo-side generated-artifact verification**（本機 `dist-blogger` 結構驗證），**非** live Blogger 前台驗證。

> ⚠️ **核心紅線：Blogger VIEW count 增加只能視為 weak signal，不可當作真實流量或 AdSense 成效依據。**

---

## A. Phase name

`20260612-pm-16-blogger-p1-knowledge-base-manual-repost-packet-docs-only-a`

---

## B. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `2a15c35` |
| origin/main | `2a15c35` |
| ahead / behind | 0 / 0 |
| working tree | clean（packet 撰寫前） |
| latest subject | `feat(blogger): add knowledge-base life note`（pm-15 落地） |

Baseline 與 user 期望一致（branch=main、HEAD==origin/main==`2a15c35`、working tree clean）；不做任何 fix。

See also：
- `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md`（pm-15 落地之 source markdown；本 packet 之 verification subject）
- `docs/20260612-blogger-p1-knowledge-base-content-landing-record.md`（pm-15 landing record）
- `docs/20260612-blogger-p1-knowledge-base-article-draft.md`（pm-13 修訂草稿）
- `docs/20260612-blogger-adsense-batch-1-reading-notes-repost-packet.md`（am-14 packet；本 packet 結構之參照樣本）
- `src/scripts/check-blogger-adsense-output.js`（5-target guard；本 phase 不動，**未**含本 post）

---

## C. Source content / generated HTML

| 屬性 | 值 |
|---|---|
| content source path | `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md` |
| generated HTML path（repost source） | `dist-blogger/posts/blog-as-personal-knowledge-base/post.html` |
| dist meta | `dist-blogger/posts/blog-as-personal-knowledge-base/meta.json`（`bloggerMode:"full"`） |
| copy-helper | `dist-blogger/posts/blog-as-personal-knowledge-base/copy-helper.txt` |
| publish-checklist | `dist-blogger/posts/blog-as-personal-knowledge-base/publish-checklist.txt` |
| title | 為什麼我開始把部落格當成自己的知識倉庫 |
| slug | `blog-as-personal-knowledge-base` |
| contentKind | `life-note`（normal article；非 download / 非 book-review） |
| category | `life-note`（Blogger-valid；0 settings drift） |
| tags | `self-growth`, `reading-notes`（皆 Blogger-valid；0 settings drift） |
| Blogger mode | **full**（`mode:"full"` / dist `bloggerMode:"full"`） |
| indexing | **indexable**（frontmatter **無** `seo.indexing`；dist `noindex` 計數 = 0） |
| primaryPlatform | `blogger`（`github.enabled:false`） |
| commerce / affiliate | **none**（0 affiliate-box；0 commerce ref；0 external links） |
| assets | **none / existing placeholder**（cover = `/images/placeholders/cover-placeholder.svg`；0 新圖 / 0 下載檔） |
| relatedLinks / otherLinks | none |
| hashtags | 有（`#self-growth` / `#reading-notes`） |

### C.1 形態關係（與 5 篇已 live-verified post）

本 post 與 `daily-reading-habit-notes` / `reading-notes-three-questions` / `after-work-writing-time-blocking` **同屬最簡 life-note 形態**（0 affiliate / 0 related-links / 純 body + hashtags；`positionAnchor:hashtags`）。未來納入 guard 時可直接複用 daily-reading 之 P1–P4 expectation 模板。

### C.2 Generated artifact verification（repo-side；本 session 重驗）

> ⚠️ 以下全為 **repo-side / 本機 dist 驗證**，**非** live Blogger 前台驗證。dist-blogger 為 git-ignored 產物，不 commit。

| 檢查項 | 期望 | 實測 |
|---|---|---|
| `validate:content` | 0 errors | ✅ **0 errors / 94 warnings / 84 posts**（新 post 0 觸發） |
| `build:blogger` | success | ✅ success |
| `post.html` / `meta.json` / `copy-helper.txt` / `publish-checklist.txt` 存在 | true | ✅ 四檔皆存在 |
| full（非 summary） | `bloggerMode:"full"` | ✅ full |
| `lab-ad-slot--articleAd6` 數量 | 1 | ✅ 1 |
| `lab-ad-slot--articleAd[1-5]` 數量 | 0 | ✅ 0 |
| `adsbygoogle` `<ins>` 數量 | 1 | ✅ 1 |
| EJS leak（`<%` / `%>` / `await include`） | false | ✅ false |
| undefined / null near markup | 0 | ✅ 0 |
| `noindex` 計數 | 0 | ✅ 0 |
| `lab-affiliate-box` 數量 | 0 | ✅ 0 |
| `data-ad-client` strict-equal `ads.config.json.adsenseClient` | true | ✅ true（masked compare；未印 real id） |
| `data-ad-slot` strict-equal `ads.config.json.slots.articleAd6` | true | ✅ true（masked compare；未印 real id） |
| 文件順序 body → articleAd6 → hashtags | true | ✅ true（body@L48 < ad@L74 < hashtags@L88） |

---

## D. Pre-repost checklist（手動貼到 Blogger 前須確認）

> 全部為 repo-side read-only 確認 + user 端準備；本 phase 不執行重貼。

- [ ] **local repo clean** — `git status` working tree clean。
- [ ] **latest HEAD** — HEAD == origin/main（撰寫時 `2a15c35`）。
- [ ] **generated HTML exists** — `dist-blogger/posts/blog-as-personal-knowledge-base/post.html` 存在（若無 / stale 先 `npm run build:blogger`）。
- [ ] **article body complete** — 正文完整（intro + 6 H2 段 + 自然結尾），非 summary 卡片、無截斷。
- [ ] **no EJS leak** — dist HTML 無 `<%` / `%>` / `await include`。
- [ ] **no undefined / null** — dist HTML ad 周邊無 `>undefined<` / `>null<` / `="undefined"` / `="null"`。
- [ ] **articleAd6 exactly 1** — `lab-ad-slot--articleAd6` 恰 1 個。
- [ ] **articleAd1–5 exactly 0** — `lab-ad-slot--articleAd[1-5]` = 0。
- [ ] **no commerce block** — `lab-affiliate-box` = 0；無販售 / 聯盟區塊。
- [ ] **no noindex** — dist HTML `noindex` 計數 = 0。
- [ ] **data-ad-client / data-ad-slot preserved** — 與 `ads.config.json` strict-equal（用 §E one-liner 確認）。
- [ ] **backup current Blogger post / page state if applicable** — 本 post 為**全新文章**（過去未在 Blogger 發布）→ 備份填 `N/A — newly created post`；若改為覆蓋既有文章，先備份其 HTML + 記 timestamp。
- [ ] **do not rely on Blogger VIEW count as success metric** — view count 為 weak signal，不作為發文成功 / AdSense 成效依據。

---

## E. Manual Blogger repost steps（人工操作步驟；本 phase 不執行）

⚠️ 以下為**操作草案**；本 phase 不執行。

1. **open generated HTML** — 在本機確認 `dist-blogger/posts/blog-as-personal-knowledge-base/post.html` 最新（先 `npm run build:blogger`，再跑下方 §E.1 one-liner，5 項全 true）。
2. **copy intended full HTML/body** — 依既有 Blogger manual repost 慣例，**全選複製** `post.html` 整個檔案內容（外層 `<div class="lab-blogger-article">`..`</div>`）。**唯一**合法來源為此 generated file。
3. **create or update Blogger post manually** — 開啟 Blogger 後台（正確帳號 / 正確 blog），**新增文章**（本 post 預設）；切換到 **HTML 模式**（**非**視覺編輯器；視覺編輯器可能改寫 HTML / strip `<ins>` / 移除 inline script），**貼入**複製內容；不動主題 / sidebar widget。
4. **set title** — `為什麼我開始把部落格當成自己的知識倉庫`（與 dist `<h1>` 一致）。
5. **set permalink / slug if applicable** — `blog-as-personal-knowledge-base`（若 Blogger 允許自訂）。
6. **set labels if applicable** — `self-growth`, `reading-notes`（與 `tags[]` 對齊；建議取自 `meta.json` / `copy-helper.txt`，非 hardcode）。搜尋說明取自 `searchDescription`。
7. **keep post body full mode** — 維持完整正文，不改成 summary / 摘要卡片。
8. **preview before publish** — 先桌機預覽 → 手機預覽。
9. **verify bottom AdSense slot remains in HTML** — 預覽 / HTML 內仍有 1 個 `lab-ad-slot--articleAd6` `<ins>`，位於正文之後、hashtags 之前；`data-ad-client` / `data-ad-slot` 未被 strip。
10. **publish only after human approval** — 確認無誤且取得 explicit approval 後才 **發布**。
11. **record final URL and timestamp after publish** — 記錄 live 文章 URL + 發布時間（供未來 verification record / FB 推廣 / canonical 回填）。

### E.1 sanity one-liner（read-only；不 hardcode real id）

```bash
node -e "const fs=require('fs');const ads=require('./content/settings/ads.config.json');const html=fs.readFileSync('dist-blogger/posts/blog-as-personal-knowledge-base/post.html','utf-8');console.log('client OK:', html.includes('data-ad-client=\"'+ads.adsenseClient+'\"'));console.log('slot OK:', html.includes('data-ad-slot=\"'+ads.slots.articleAd6+'\"'));console.log('articleAd6:', (html.match(/lab-ad-slot--articleAd6/g)||[]).length);console.log('articleAd1-5:', (html.match(/lab-ad-slot--articleAd[1-5]/g)||[]).length);console.log('EJS leak:', html.includes('<%')||html.includes('%>')||html.includes('await include'));"
```

預期：`client OK: true` / `slot OK: true` / `articleAd6: 1` / `articleAd1-5: 0` / `EJS leak: false`。

---

## F. Post-publish verification checklist（user 重貼後在 live page 上填）

- [ ] **front-end URL opens** — live URL 可正常開啟：`__________`
- [ ] **content complete** — 正文完整顯示（非 summary 卡片 / 無截斷）。
- [ ] **formatting OK** — 標題 / 段落 / 間距正常，無破版。
- [ ] **no duplicated content** — 無重複正文 / 無重複段落。
- [ ] **articleAd6 container appears near bottom before hashtags/related area** — bottom AdSense container 位於正文之後、hashtags / related 區之前。
- [ ] **data-ad-status filled or unfilled — both not immediate failure** — `filled`（有填）/ `unfilled`（首載或競價無填）皆**非**立即失敗。
- [ ] **articleAd1–5 absent** — DOM 內無 `lab-ad-slot--articleAd[1-5]`。
- [ ] **no commerce box** — 無 `.lab-affiliate-box` / 販售區塊。
- [ ] **no visible EJS / broken markdown** — 前台無 `<%` / `%>` / 殘缺語法。
- [ ] **mobile view acceptable** — 手機版可接受（無破版 / slot 不遮內容）。
- [ ] **Blogger VIEW count is weak signal only** — 不把 view count 當真實流量 / 成效。
- [ ] **AdSense dashboard / policy warning monitored later, not assumed instantly** — AdSense 後台 / 政策通知屬後續監控，不在重貼當下即下定論。
- [ ] **screenshot taken if possible**（桌機 + 手機）。
- [ ] **timestamp recorded**：`__________`

---

## G. STOP conditions（遇以下情況立即停止，不重貼更多文章）

- 🛑 **generated HTML missing** — `post.html` 不存在 → 先 `build:blogger`，未產出前不重貼。
- 🛑 **more than one AdSense slot** — `articleAd6` > 1（dist 或 live DOM）→ 停止，排查 anchor wiring。
- 🛑 **articleAd6 missing** — dist 或 live 無 `articleAd6`（mode 非 full？anchor 未 fire？）→ 停止。
- 🛑 **EJS leak** — dist / live 出現 `<%` / `%>` / `await include` → 停止，回 source 排查。
- 🛑 **wrong or stripped data-ad-client / data-ad-slot** — 與 `ads.config.json` 不符 / 被 Blogger strip → 停止並記錄。
- 🛑 **duplicate article body** — 正文重複 → 停止，檢查貼上是否重複。
- 🛑 **Blogger editor strips ad code unexpectedly** — 視覺編輯器 / sanitizer 移除 `<ins>` / `<script>` / `data-*` → **停止並記錄** sanitizer behavior，不重貼更多文章。
- 🛑 **policy warning appears** — AdSense / Blogger 出現政策通知 → 停止，另案處理。
- 🛑 **manual operator is unsure which HTML segment to paste** — 操作者不確定要貼哪段 HTML → 停止，回本 packet §E.2 確認唯一來源為 `post.html` 全檔，不臆測。

🔴 任一 STOP 條件觸發 → 不在同一 session 混做 source / template / guard 修復；另開單一 phase 處理。

---

## H. Evidence to collect after manual repost

- **Blogger final URL**：`__________`
- **publish timestamp**：`__________`
- **screenshot / visual notes**（桌機 + 手機）：`__________`
- **front-end check result**（§F 各項結果）：`__________`
- **data-ad-status observation**（`filled` / `unfilled` / `not loaded`；單一 time-point）：`__________`
- **any AdSense warning**（有 / 無；內容）：`__________`
- **view count movement** — **記錄但不得解讀為真實流量 / AdSense 成效**（weak signal only）：`__________`

> 以上 evidence 供未來 manual verification record doc（docs-only phase）使用，mirror 既有 verification record 結構。

---

## I. Explicit non-actions（本 session 明確未做）

- ❌ no source change（`src/` 全未動）
- ❌ no template / renderer change（EJS / build script 未動）
- ❌ no settings / `ads.config.json` change（real id 仍只存 `ads.config.json`，未新增 / 未 hardcode）
- ❌ no content post change（含 `blog-as-personal-knowledge-base`，一律只讀未動）
- ❌ no new assets / no new commerce links
- ❌ no Blogger publish / repost in this phase（未登入 / 未開編輯器 / 未開 AdSense 後台）
- ❌ no external front-end verification（不依賴 / 不宣稱任何 live Blogger 觀察）
- ❌ no deploy / no push gh-pages / no `dist-blogger` commit / no `.cache` mutation
- ❌ no npm install / no package / lockfile change
- ❌ no new AdSense slot
- ❌ no guard coverage change yet（`check-blogger-adsense-output.js` 維持 5-target；**未**加本 post）
- ❌ no CLAUDE.md compression / 無重排 / 無 unrelated cleanup
- ❌ no `/memory`
- ❌ **未把 Blogger VIEW count 增加判定為真實流量或 AdSense 成效**

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 pm-16（20260612）極小 ledger sync append。

read-only 量測（未造成 mutation；dist-blogger git-ignored 不 commit）：`validate:content` 0/94/84、`build:blogger` ok（pm-15 已產出，本 session 沿用）、sanity one-liner client/slot OK + articleAd6 1 + articleAd1-5 0 + EJS leak false。其餘 guard（`check:blogger-adsense-output` 71/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0）carry forward。

---

## J. Recommended next phase

- **Conservative（推薦預設）：stop and wait for manual approval** — 維持 baseline 不動，等 user 完成 §D inputs + explicit approval。
- **Optional：actual manual repost execution by human, then completion record docs-only** — user 依本 packet 手動重貼後，另開 docs-only verification / completion record（mirror 既有 verification record 結構），記錄 §F / §H 結果。
- **Optional：if live PASS, add this slug to guard TARGETS in a separate guard coverage phase** — live verified PASS 後，把 `blog-as-personal-knowledge-base` 加入 `check-blogger-adsense-output.js` `TARGETS`（複用 daily-reading P1–P4 模板；NOT docs-only；**本 phase 不動 guard**）。
- **Optional：continue Batch 1 / P1 monitoring only** — 維持 monitoring，不立即重貼。
- **Not advised：publish multiple posts / modify template / add new ad slots in same phase** — 不在同一 phase 連發多篇 / 改 template / 新增 slot。

🔴 任何 live repost / Blogger 後台動作 / source / settings / guard change，皆須 user explicit approval 後另開單一 phase。

---

## K. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）、`ca-pub-…****`（masked）；**不含**完整 real AdSense client id / slot id。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
