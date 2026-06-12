# Blogger AdSense — Batch 1a `daily-reading-habit-notes` Manual Repost Packet

Phase: `20260612-am-7-blogger-adsense-batch-1a-daily-reading-repost-packet-docs-only-a`

## 1. Status

- **docs-only repost packet**
- 本 phase **不** repost / paste / publish / 開 Blogger 後台 / 開 AdSense 後台 / deploy / push gh-pages / 做外部前台驗證
- 本 phase **不**改 src / content / settings / fixtures / views / templates / package / lockfile / dist commit / gh-pages / `.cache`
- 本 phase **不**改任何文章檔（含剛新增的 `daily-reading-habit-notes`）
- 本 phase **不**改 guard scope（`check-blogger-adsense-output.js` 維持 single-slug = `we-media-myself2`）
- 本 phase **不**新增 / hardcode real AdSense client / slot id
- 目的：把 am-6 新增之 Blogger AdSense **Batch 1a** 候選文章 `daily-reading-habit-notes` 之手動重貼準備工作打包，讓 user 之後可直接照本 packet 操作。
- **actual live repost 仍 🔴 BLOCKED**，須 user 完成 §E pre-repost inputs + explicit separate approval 始可執行。

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律以 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）/ masked（`ca-pub-…****`）表述。real id 僅存於 `content/settings/ads.config.json`，被 build 透過 `deriveRenderedAdsenseBlocks(...)` 寫入 dist HTML；不在 docs / source / EJS / tests / package 內 hardcode。

> ⚠️ 本文件**不代表已完成** Blogger 外部重貼。文中所有「verified」一律指 **repo-side generated-artifact verification**（本機 `dist-blogger` 結構驗證），**非** live Blogger 前台驗證。live 前台驗證須由 human operator 於另一 phase 完成並記錄。

---

## A. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `b747518` |
| origin/main | `b747518` |
| ahead / behind | 0 / 0 |
| working tree | clean（packet 撰寫前） |
| latest subject | `feat(blogger): add daily reading habit post`（am-6 新增文章） |

Baseline 與 user 期望一致（branch=main、HEAD==origin/main==`b747518`、working tree clean）；不做任何 fix。

See also：
- `docs/20260612-blogger-content-new-lowrisk-full-post-content-plan.md`（am-5 content plan；本 post 之 plan 來源）
- `docs/20260612-blogger-adsense-noindex-download-seo-policy-preanalysis.md`（am-4 SEO 政策 preanalysis；為何選新文章而非硬救 noindex / download / draft）
- `docs/20260612-blogger-adsense-phase-f-batch-rollout-plan.md`（am-1 Phase F rollout 節奏；Batch 0 lock / Batch 1 候選規則）
- `docs/20260611-blogger-adsense-second-post-repost-readiness-handoff.md`（night-5 第二篇 handoff；本 packet 結構之參照樣本）
- `docs/20260612-blogger-adsense-second-post-manual-verification-record.md`（night-1 第二篇 live PASS 紀錄；本 packet 之 verification record 模板來源）
- `src/scripts/check-blogger-adsense-output.js`（Phase E single-slug guard；本 phase 不動，仍只驗 `we-media-myself2`）

---

## B. Batch 1a candidate summary

| 屬性 | 值 |
|---|---|
| title | 我這一年養成每天閱讀的 5 個小方法 |
| slug | `daily-reading-habit-notes` |
| source markdown | `content/blogger/posts/20260612-daily-reading-habit-notes.md` |
| generated HTML（repost source） | `dist-blogger/posts/daily-reading-habit-notes/post.html` |
| dist meta | `dist-blogger/posts/daily-reading-habit-notes/meta.json` |
| copy-helper | `dist-blogger/posts/daily-reading-habit-notes/copy-helper.txt` |
| publish-checklist | `dist-blogger/posts/daily-reading-habit-notes/publish-checklist.txt` |
| contentKind | `life-note`（normal article；非 download / 非 book-review） |
| category | `life-note`（Blogger-valid；0 settings drift） |
| tags | `reading-notes`, `self-growth`（皆 Blogger-valid；0 settings drift） |
| Blogger mode | **full**（`bloggerMode:"full"` / `rendered:"full"`） |
| indexing | indexable（frontmatter **無** `seo.indexing`；dist `noindex` 計數 = 0） |
| primaryPlatform | `blogger` |
| affiliate / commerce | **無**（0 affiliate-box；0 commerce ref） |
| relatedLinks / otherLinks | **無** |
| hashtags | **有**（`#reading-notes` / `#self-growth`） |

### B.1 Why eligible（Batch 1a 候選資格）

per am-5 content plan §C 硬條件，本 post **同時**滿足：

1. **full mode** — `publishTargets.blogger.enabled:true` + `mode:"full"`；summary / redirect-card 不注入 `articleAd6`。
2. **indexable** — 無 `seo.indexing:"noindex-*"`；非 download contentKind（不觸 SEO-1 noindex fallback）。避開 am-4 §E 之 noindex+AdSense 政策議題。
3. **ready / non-draft** — `status:"ready"` + `draft:false`。
4. **normal article（非 download）** — `contentKind:"life-note"`；不需 download theme readiness gate。
5. **non-placeholder** — 真實標題 / 真實 ~1100 字 body / 真實 description；無 `TODO` / 佔位。
6. **low commerce** — 0 affiliate / 0 commerce ref；surface 最乾淨，ad slot 破版根因不與 affiliate UX 混淆。
7. **0 settings drift** — category / tags 全用既有 Blogger-valid 值（production warnings 維持 0）。

### B.2 與 Batch 0 之形態差異補位

| 編號 | post | 形態 |
|---|---|---|
| Batch 0 #1 | `we-media-myself2` | 書評 + 雙 affiliate-box + related-links + hashtags（**複雜**形態） |
| Batch 0 #2 | `github-pages-blog-planning` | tech-note + 無 affiliate + 短 body + hashtags（**簡**形態） |
| Batch 1a（本 post） | `daily-reading-habit-notes` | life-note + 0 affiliate + 0 related-links + 中長 body + hashtags（**生活心得**形態） |

→ 本 post 補上 life-note 生活心得形態，進一步驗證 `articleAd6` / `beforeRelatedLinks` anchor 在無 affiliate / 無 related-links 之純 body 形態下仍正確 fire。

### B.3 Batch 1a vs 正式 Batch 1（明確標示）

- 本 post = **Batch 1a mini-batch 候選**（**單篇**），**非**正式 Batch 1 本體。
- 依 am-1 Phase F §D.1：正式 Batch 1 = 3–5 篇低風險文章，且須保留 ≥1/3 對照組。目前除本 post 外，candidate pool 仍實質為空（其餘 production post 為 Batch 0 lock / draft / noindex+download）。
- 因此本 packet 明文定位為 **Batch 1a（單篇 mini）**；若未來累積 ≥3 篇 eligible，再開正式 Batch 1 子 phase。

---

## C. This session re-verification results（repo-side generated-artifact verification）

> ⚠️ 以下全為 **repo-side / 本機 dist 驗證**，**非** live Blogger 前台驗證。

| 檢查 | 結果 |
|---|---|
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（production-post warnings = 0；94 全來自 `content/validation-fixtures/`） |
| `npm run build:blogger` | **success**（done in ~102ms） |
| `npm run check:adsense-resolver` | **34 passed / 0 failed** |
| `npm run check:adsense-article-block` | **13 passed / 0 failed** |
| `npm run check:adsense-anchor-wiring` | **14 passed / 0 failed** |
| `npm run check:blogger-adsense-output` | **14 passed / 0 failed**（target 仍 = `we-media-myself2`；**不**涵蓋本 post） |

### C.1 `dist-blogger/posts/daily-reading-habit-notes/post.html` 結構驗證

| 檢查項 | 期望 | 實測 |
|---|---|---|
| `post.html` 存在 | true | ✅ true |
| `meta.json` 存在 | true | ✅ true |
| `copy-helper.txt` 存在 | true | ✅ true |
| `publish-checklist.txt` 存在 | true | ✅ true |
| full（非 summary） | `bloggerMode:"full"` / `rendered:"full"` | ✅ full / full |
| `lab-ad-slot--articleAd6` 數量 | 1 | ✅ 1 |
| `lab-ad-slot--articleAd[1-5]` 數量 | 0 | ✅ 0 |
| `data-ad-client` strict-equal `ads.config.json.adsenseClient` | true | ✅ true |
| `data-ad-slot` strict-equal `ads.config.json.slots.articleAd6` | true | ✅ true |
| EJS leak（`<%` / `%>` / `await include`） | 無 | ✅ false |
| `noindex` 計數 | 0 | ✅ 0 |
| `lab-affiliate-box` 計數 | 0 | ✅ 0 |
| legacy `adsenseTop` / `adsenseBottom` slot | 0 | ✅ 0 |
| 文件順序 body → articleAd6 → hashtags | true | ✅ true（body@1847 < ad@3762 < hashtags@4095） |

→ bottom slot 在正文之後、hashtags 之前；該 post 無 affiliate / related-links，`beforeRelatedLinks` anchor 在無 related-links 時仍正確 fire 於 hashtags 前。

---

## D. Repost source（從哪個檔取 HTML）

**唯一**正確來源：

```
dist-blogger/posts/daily-reading-habit-notes/post.html
```

⚠️ **以下來源皆不可用**：

| ❌ 不可用之來源 | 為什麼不可用 |
|---|---|
| `content/blogger/posts/20260612-daily-reading-habit-notes.md` | Markdown 原始檔；尚未 render；無 AdSense markup |
| GitHub Pages dist HTML（`dist/posts/...`） | GitHub Pages surface 自有 layout / nav / theme；貼至 Blogger 會破版 + 重複 header/footer（且本 post `github.enabled:false`，根本不產 GitHub Pages 頁） |
| Blogger summary / redirect-card HTML | 摘要 / 短導流卡片，**不含** `articleAd6` anchor wiring |
| 任何 `dist-promotion/` FB 文案 | 純文字 FB 推廣文，非 HTML |

→ 取 HTML 前**先 rebuild** 確保 dist 最新：

```bash
npm run build:blogger
```

sanity 驗證 one-liner（read-only；不 hardcode real id）：

```bash
node -e "const fs=require('fs');const ads=require('./content/settings/ads.config.json');const html=fs.readFileSync('dist-blogger/posts/daily-reading-habit-notes/post.html','utf-8');console.log('client OK:', html.includes('data-ad-client=\"'+ads.adsenseClient+'\"'));console.log('slot OK:', html.includes('data-ad-slot=\"'+ads.slots.articleAd6+'\"'));console.log('articleAd6:', (html.match(/lab-ad-slot--articleAd6/g)||[]).length);console.log('articleAd1-5:', (html.match(/lab-ad-slot--articleAd[1-5]/g)||[]).length);console.log('EJS leak:', html.includes('<%')||html.includes('%>')||html.includes('await include'));"
```

預期：`client OK: true` / `slot OK: true` / `articleAd6: 1` / `articleAd1-5: 0` / `EJS leak: false`。

> 注意：**不要把完整 HTML 塞進本 doc**。複製來源一律指向上述 local generated file，避免漂移 + 避免 real id 進 docs。

---

## E. Six required pre-repost inputs（user 須逐項填，沿用 second-post handoff §6 結構）

- [ ] 確認 / 建立 live Blogger 文章 URL：`__________`
  - 若 live 尚未存在對應文章（本 post 為**全新文章**，過去未曾在 Blogger 發布）→ 須先**新建文章**並記錄 URL
  - 若已建立 → 記錄其 URL（建議候選 `https://babel-lab.blogspot.com/...`，由 user 核對）
- [ ] 確認正確的 Google / Blogger 帳號：`__________`
- [ ] 確認正確的 blog（避免貼錯 blog）：`__________`
- [ ] 現有 live HTML 之備份位置（若覆蓋既有文章；新文章填 `N/A — newly created post`）：`__________`
- [ ] theme CSS readiness verdict（PASS / FAIL，見 §F）：`__________`
- [ ] before / after 截圖存放位置（桌機 + 手機）：`__________`

---

## F. Theme / CSS readiness gate

本 post 與 Batch 0 兩篇之 class group **差異**：

| Class group | 本 post 是否會出現 | Batch 0 #1（we-media）| Batch 0 #2（github-pages） | 備註 |
|---|---|---|---|---|
| `.adsbygoogle` | ✅ 必出 | ✅ | ✅ | AdSense `<ins>` |
| `.lab-ad-slot--articleAd6` | ✅ 必出 | ✅ | ✅ | 本次 ad 版位 |
| `.lab-affiliate-box` | ❌ 不會出 | ✅ | ❌ | 本 post 無 affiliate |
| `.lab-related-links`* | ❌ 不會出 | ✅ | ❌ | 本 post 無 relatedLinks |
| `.lab-other-links`* | ❌ 不會出 | ❌ | ❌ | 三篇皆無 |
| `.lab-hashtags` / `.lab-hashtag` | ✅ 必出 | ✅ | ✅ | 三篇皆有 |
| `.lab-blogger-article` 外殼 | ✅ 必出 | ✅ | ✅ | 統一外層 |
| `.lab-article__header` / `__title` / `__meta` / `__description` | ✅ 必出 | ✅ | ✅ | header 區段 |
| `.lab-article__body` | ✅ 必出 | ✅ | ✅ | body 區段 |
| `.lab-container` | ✅ 必出 | ✅ | ✅ | AdSense block 外殼 |

**結論**：本 post 所用 class group（`.adsbygoogle` / `.lab-ad-slot--articleAd6` / `.lab-blogger-article` / `.lab-article__*` / `.lab-hashtag*` / `.lab-container`）**全部已被 Batch 0 在 live Blogger 主題下驗證正常**；本 post **不**引入新 class group，**繼承** Batch 0 之 theme CSS readiness verdict。

**任一缺失 → STOP，不得 repost**（須另立 CSS / theme plan）。
**實際 repost 中不修改主題，除非另行批准。**

---

## G. Manual repost step（user 手動操作步驟）

⚠️ 以下為**操作草案**；本 phase 不執行。

1. （rebuild）`npm run build:blogger`，確認 `dist-blogger/posts/daily-reading-habit-notes/post.html` 最新（§D one-liner 驗證 5 項全 true）。
2. 開啟 Blogger 後台（登入正確帳號 / 正確 blog；per §E inputs）。
3. **新增文章** 或編輯對應文章：
   - **新文章**（本 post 預設情況）：「新增文章」→ 記錄新文章建立時間。
   - **既有文章**：先**備份**現有 live HTML 至 §E input 4 指定位置（複製存檔，記檔名 / timestamp）。
4. 切換到 **HTML 模式**（**非**視覺編輯器；視覺編輯器可能改寫 HTML / strip `<ins>` / 移除 inline script）。
5. 開啟 `dist-blogger/posts/daily-reading-habit-notes/post.html`，**全選複製**整個檔案內容（外層 `<div class="lab-blogger-article">`..`</div>`）。
6. 在 Blogger HTML 編輯器**貼入** body 區塊；**不動**主題、sidebar widget。
7. 設定標題：`我這一年養成每天閱讀的 5 個小方法`（與 dist `<h1>` 一致）。
8. 設定 permalink / slug（若 Blogger 允許自訂）：`daily-reading-habit-notes`。
9. 設定 / 確認 Blogger「搜尋說明」與 labels（per §H）。
10. **先預覽，不要直接發布**：桌機預覽 → 手機預覽。
11. 兩端預覽通過 → publish / update。
12. 開前台 URL **檢查桌機版**；記錄是否看到文章底部 AdSense container / slot。
13. 開前台 URL **檢查手機版**；記錄是否看到 AdSense container / slot（empty placeholder / 實廣告 / 未載入，三態擇一記錄）。
14. 記錄是否破版、是否遮住內容、slot 位置是否錯誤。
15. **不碰其他文章。**

> ⚠️ 若 Blogger 編輯器**改寫 HTML** → 記錄差異（diff before/after）。
> ⚠️ 若 Blogger **自動移除 `<script>` / `<ins>` / `data-*` attrs** → **立即停止並記錄** Blogger sanitizer behavior；不要重貼更多文章。

---

## H. Blogger metadata 對齊（建議；取自 dist meta.json，非 hardcode）

| Blogger 欄位 | 建議值 |
|---|---|
| 文章標題 | `我這一年養成每天閱讀的 5 個小方法` |
| 搜尋說明 | 取自 `searchDescription`（養成每天閱讀習慣的 5 個小方法：固定一個小時段、把書放在看得到的地方、不要把閱讀變成壓力、只記一兩句有用的話、把不同書連起來讀。） |
| 自訂網址 slug | `daily-reading-habit-notes` |
| 標籤（Labels） | `reading-notes`, `self-growth`（與 `tags[]` 對齊） |
| 發布日期 | `2026-06-12`（與 `date` 對齊；新貼可由 user 決定是否回填） |

→ 亦可參考 `dist-blogger/posts/daily-reading-habit-notes/copy-helper.txt` 逐區可複製內容（本 packet 不另複製，避免漂移）。

---

## I. Manual verification checklist（user 重貼後在 live page 上填）

- [ ] Blogger post published / updated
- [ ] front-end URL 記錄：`__________`
- [ ] desktop checked（桌機無破版）
- [ ] mobile checked（手機無破版）
- [ ] bottom slot exists（DOM 內 `<ins class="adsbygoogle lab-ad-slot lab-ad-slot--articleAd6" ...>`）
- [ ] slot location before hashtags / related-links area（body 之後、hashtags 之前；本 post 無 related-links）
- [ ] content not broken（內容完整顯示，非 summary 卡片）
- [ ] no duplicate ad block（DOM 內 `articleAd6` 恰 1 個）
- [ ] no `articleAd1`–`articleAd5` extra slot（DOM 內 `lab-ad-slot--articleAd[1-5]` = 0）
- [ ] no commerce / affiliate box unexpectedly appears（本 post 不應出現 `.lab-affiliate-box`）
- [ ] no console-critical issue（若 user 檢查 DevTools；first-load unfilled 屬正常，非錯誤）
- [ ] screenshot taken if possible（桌機 + 手機）
- [ ] timestamp recorded：`__________`

---

## J. 若沒看到廣告的判斷流程

**第一步：DevTools 區分兩種狀態**

| 觀察 | 結論 | 下一步 |
|---|---|---|
| DOM 內 `<ins class="...lab-ad-slot--articleAd6...">` **不存在** | 模板 / 貼入失敗（含 Blogger sanitizer strip） | → §J.A |
| `<ins>` **存在**但 visible 空白 / iframe 0×0 / no creative | AdSense 後台未填（fill / policy / cache / first load） | → §J.B |

### J.A `<ins>` 不存在

回 repo 排查順序：
1. **貼錯來源**？確認貼的是 `dist-blogger/posts/daily-reading-habit-notes/post.html`（per §D）。
2. **貼錯模式**？確認 `meta.json` 為 `bloggerMode:"full"`（理論上恆 true；本 post frontmatter 即 full）。
3. **Blogger 視覺編輯器 / sanitizer strip 掉**？確認貼入時為 HTML 模式；若 Blogger 移除 `<ins>` / inline script → **停止並記錄** sanitizer behavior（屬 Blogger 平台限制，非 repo bug；另開 failure analysis phase）。
4. **貼錯文章**？確認編輯之文章 URL slug 與 §E input 1 一致。
5. **dist 過舊**？rerun `npm run build:blogger` + §D one-liner 重新確認 data attrs 在。

### J.B `<ins>` 存在但未填廣告

- **第一載 / 短期 unfilled = 屬正常 no-fill**，**非實作失敗**。等待 / reload / 換瀏覽器再觀察。
- **multiple loads 仍空** + DOM 內 `data-ad-client` / `data-ad-slot` 值正確 → 屬 AdSense **後台 fill / policy** 範疇（競價 / 審核 / 地區 fill rate）。**不**是 repo / 模板問題。
- **數小時** 仍 0 fill → 屬 AdSense 後台監控；屬另案。

---

## K. Acceptance criteria（Batch 1a）

| 層級 | 條件 |
|---|---|
| repo（本 docs-only phase） | working tree clean after docs-only commit；無 source / content / settings drift |
| generated HTML | §C.1 全部 ✅（已 repo-side verified） |
| manual Blogger front-end（**待 user**） | bottom AdSense slot 以 container / slot 形式出現（即使 real ad blank 亦可接受）；no layout break；no duplicate slots；no `articleAd1`–`articleAd5`；no unexpected commerce / affiliate box |
| 記錄 | 結果記於未來 manual verification record doc（per §M template） |

> ✅ **Batch 1a acceptance = repo clean（docs-only）+ generated HTML verified（已達成）+ manual Blogger front-end verified by user（待 user）+ bottom slot visible as container/slot（即使 blank）+ no layout break + no duplicate slots + no drift + result recorded in future manual verification record doc。**

廣告未即時填充屬正常（AdSense 端 fill 延遲）；非破版即可接受。

---

## L. Rollback plan

| 狀況 | 處理 |
|---|---|
| Blogger **新文章** 發布後發現問題 | revert to draft 或刪除該 Blogger post |
| **更新既有文章** 後發現問題 | 回貼 §E input 4 之備份 HTML，重新 publish |
| **slot 不出現**（`<ins>` 不存在） | **停止**，不要重貼更多文章；依 §J.A 排查 |
| **破版** | **停止 rollout**；不在同一 session 混做修復；另開 source / template fix phase |
| **Blogger 移除 ad attrs / script**（sanitizer） | **停止並記錄** Blogger sanitizer behavior；另開 failure analysis；不重貼更多文章 |
| **不要 rollback repo** | 除非 §D one-liner 證明 repo 輸出本身錯誤 |

🔴 **紅線**：不在同一 session 混做 rollout + source fix + guard 改動（per Phase F §H.4）。

---

## M. Manual verification record template（待填寫）

> 未來 user 完成 live repost 後，於新 docs-only phase 用此模板產出 verification record（mirror second-post night-1 record 結構）。

```
# Blogger AdSense — Batch 1a daily-reading-habit-notes Manual Verification Record

- timestamp:            __________
- Blogger URL:          __________
- operator:             __________
- generated file used:  dist-blogger/posts/daily-reading-habit-notes/post.html
- desktop result:       __________ (no break / break: ...)
- mobile result:        __________ (no break / break: ...)
- AdSense slot result:  __________ (container present? / empty placeholder / real ad filled / not loaded)
- layout result:        __________ (content not broken / duplicate slot? / position correct?)
- rollback needed?:     __________ (yes / no; if yes, which §L path)
- notes:                __________ (Blogger HTML rewrite diff? sanitizer strip? console warnings?)
```

---

## N. Recommended next phase

1. **由 user 依本 packet（§E inputs + §G steps）手動重貼**本 post 至 Blogger（須 user 完成 §E inputs + explicit approval；本 packet 不開放自動推進）。
2. **若 user 已重貼成功** → 下一 phase = manual verification record（docs-only）：用 §M template 記錄 live 結果（mirror `docs/20260612-blogger-adsense-second-post-manual-verification-record.md` 結構）。
   - 建議 phase name：`20260612-XX-blogger-adsense-batch-1a-daily-reading-manual-verification-record-docs-only-a`
3. **若失敗** → 下一 phase = failure analysis（docs-only）或 source / template fix preanalysis：
   - 若屬 Blogger sanitizer strip / 平台限制 → failure analysis docs-only（記錄 sanitizer behavior）
   - 若屬 repo-side 模板 / 輸出問題（§D one-liner 失敗）→ source / template fix preanalysis（**另開 phase；不在 rollout session 內修**）

**並行 / 不衝突**：`20260612-XX-blogger-adsense-guard-parameterization-preanalysis-docs-only-a`（per second-post night-1 record §13；讓 `check-blogger-adsense-output.js` 涵蓋多 slug，使本 post + 第二篇進入 automated guard；docs-only preanalysis）。

🔴 **任何 live repost / Blogger 後台動作 / source / settings change，皆須 user explicit approval 後另開單一 phase。** 不在本 packet phase 範圍。

---

## K2. Guardrails / non-actions（本 session 明確未做）

- ❌ no Blogger access（未登入 / 未開編輯器 / 未開 AdSense 後台）
- ❌ no repost / no publish
- ❌ no external front-end verification（不依賴 / 不宣稱任何 live Blogger 觀察）
- ❌ no post / frontmatter / content mutation（含剛新增的 `daily-reading-habit-notes`，一律只讀未動）
- ❌ no source / settings / template / views / fixtures mutation
- ❌ no `package.json` / lockfile mutation
- ❌ no guard scope change（`check-blogger-adsense-output.js` 維持 single-slug `we-media-myself2`）
- ❌ no AdSense ID mutation（未新增 / 未 hardcode real client / slot id 於 docs / fixture / test）
- ❌ no dist commit（`dist-blogger` 產物**不**加入 git；僅本機 rebuild 驗證）
- ❌ no deploy / no push gh-pages / no `.cache` mutation
- ❌ no CLAUDE.md compression
- ❌ no `/memory`
- ❌ no unrelated cleanup

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 am-7（20260612）極小 ledger sync append。

---

## O. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）、`ca-pub-…****`（masked）；**不含**完整 real AdSense client id / slot id。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
