# Blogger AdSense — Second Post Repost Readiness Handoff

Phase: `20260611-night-5-blogger-adsense-second-post-repost-readiness-handoff-docs-only-a`

## 1. Status

- **docs-only handoff packet**
- 本 phase **不** repost / paste / publish / 開 Blogger 後台 / 開 AdSense 後台 / deploy / gh-pages / source / EJS / content frontmatter / `ads.config.json` / `package.json` / guard script 變更
- 目的：把第二篇 Blogger AdSense 候選文章 `github-pages-blog-planning` 之手動重貼準備工作打包，讓 user 之後可直接照本 packet 操作。
- **actual live repost 仍 🔴 BLOCKED**，須 user 完成 §4 六項 pre-repost inputs + explicit separate approval 始可執行。

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律以 `slotKey`（`articleAd6`）/ masked（`ca-pub-…****`）表述。real id 僅存於 `content/settings/ads.config.json`，被 build 透過 `deriveRenderedAdsenseBlocks(...)` 寫入 dist HTML；不在 docs / source / EJS / tests / package 內 hardcode。

---

## 2. Baseline

| 項目 | 值 |
|---|---|
| HEAD / origin/main | `45c403a` |
| latest subject | `content(blogger): publish second adsense candidate as full post` |
| working tree | clean |
| `npm run validate:content` | 0 errors / 94 warnings / 84 posts |
| `npm run check:adsense-resolver` | 34 passed / 0 failed |
| `npm run build:blogger` | success（3 ready；2 full + 1 summary） |
| `npm run check:blogger-adsense-output` | 14 passed / 0 failed（target 仍 = `we-media-myself2`） |

See also：
- `docs/20260611-blogger-adsense-second-post-readiness-packet.md`（night-3 候選選擇）
- `docs/20260611-blogger-adsense-second-post-full-output-acceptance.md`（night-4 frontmatter flip + dist evidence）
- `docs/20260611-blogger-adsense-phase-d-readiness-packet-handoff.md`（Phase D pm-13 handoff；本 packet 結構之參照樣本）
- `docs/20260611-blogger-adsense-phase-d-single-post-repost-plan.md`（Phase D pm-11 plan）
- `docs/20260611-blogger-adsense-phase-d-manual-post-verification-record.md`（Phase D night-1 verification PASS）

---

## 3. Target post

| 屬性 | 值 |
|---|---|
| slug | `github-pages-blog-planning` |
| title | GitHub Pages 免費空間限制與部落格規劃 |
| titleEn | GitHub Pages Free Hosting Limits and Blog Planning |
| source markdown | `content/github/posts/20260504-github-pages-blog-planning.md` |
| dist HTML | `dist-blogger/posts/github-pages-blog-planning/post.html` |
| dist meta | `dist-blogger/posts/github-pages-blog-planning/meta.json` |
| bloggerMode | **full**（night-4 已由 `"summary"` 改為 `"full"`） |
| `rendered` | `full` |
| `primaryPlatform` | `github`（**注意**：主平台仍是 GitHub Pages；Blogger 為 cross-publish） |
| canonical resolved | `https://babel-lab.github.io/portable-blog-system/posts/github-pages-blog-planning/?utm_source=blogger&utm_medium=internal_referral&utm_campaign=blogger_to_github&utm_content=github-pages-blog-planning`（指向 GitHub Pages + reverse UTM；per build-blogger.js `resolveCanonicalUrl`） |
| category | `tech-note`（與 Phase D `book-review` 不同 → 補形態 coverage） |
| body 規模 | **極短**（單段「這是一篇初始化範例文章。Phase 1 會建立 Markdown 讀取與 frontmatter 解析。」） |
| 有 `affiliate` / `relatedLinks` / `otherLinks`？ | **無**（meta.json `affiliate: null`；frontmatter 無 relatedLinks/otherLinks） |
| 有 hashtags? | **有**（`#github` `#vite` `#static-site`） |

---

## 4. 為什麼這篇現在可作為第二篇 AdSense Blogger 測試

1. **night-3 candidate decision**（per readiness packet §5.3）：在 3 ready Blogger post 中，唯一可作為第二篇且非 `we-media-myself2`、非 `noindex-follow` 的選項。
2. **night-4 mode flip**：唯一變更為 `publishTargets.blogger.mode: "summary" → "full"`；其餘欄位 / 其他文章皆未動。
3. **dist evidence**（night-4 full-output acceptance §4）：
   - `lab-ad-slot--articleAd6` 恰 1 次
   - `articleAd1`–`articleAd5` 0 次
   - `data-ad-client` / `data-ad-slot` 值 strict-equal `ads.config.json`（`adsenseClient` / `slots.articleAd6`）
   - 無 EJS leak（`<%` / `%>` / `await include`）
   - 文件順序：article body → AdSense block → hashtags（無 affiliate / related / other 區段）
4. **與 Phase D 形態差異補位**：
   - Phase D 之 `we-media-myself2` = 書評 + 雙 affiliate-box + related-links + hashtags（複雜形態）。
   - 本 post = tech-note + 無 affiliate + 無 related-links + 短 body + hashtags（簡形態）。
   - 兩篇覆蓋兩種主要 dist 形狀 → 跨形態驗證 articleAd6 anchor 正確 fire。

---

## 5. Repost source（從哪個檔取 HTML）

**唯一**正確來源：

```
dist-blogger/posts/github-pages-blog-planning/post.html
```

⚠️ **以下來源皆不可用**：

| ❌ 不可用之來源 | 為什麼不可用 |
|---|---|
| `content/github/posts/20260504-github-pages-blog-planning.md` | Markdown 原始檔；尚未 render；無 AdSense markup |
| GitHub Pages dist HTML（`dist/posts/github-pages-blog-planning/*.html`） | GitHub Pages surface 自有 layout、navigation、theme；直接貼至 Blogger 會破版且重複出現 GitHub Pages 之 header/footer |
| Blogger summary HTML（如本 post 在 night-4 前的 `summary` 模式輸出，或其他 summary post） | 是摘要導流卡片，**不含** `articleAd6` 之 anchor wiring |
| Blogger redirect-card HTML | 是短導流卡片，無正文 + 無 AdSense |
| 任何 `dist-promotion/` 之 FB 文案 | 是純文字 FB 推廣文，不是 HTML |

→ 取 HTML 前**先 rebuild** 確保 dist 是最新：

```bash
npm run build:blogger
```

驗證 dist 仍與本 handoff 描述一致：

```bash
node -e "const fs=require('fs');const ads=require('./content/settings/ads.config.json');const html=fs.readFileSync('dist-blogger/posts/github-pages-blog-planning/post.html','utf-8');console.log('client OK:', html.includes('data-ad-client=\"'+ads.adsenseClient+'\"'));console.log('slot OK:', html.includes('data-ad-slot=\"'+ads.slots.articleAd6+'\"'));console.log('articleAd6:', (html.match(/lab-ad-slot--articleAd6/g)||[]).length);console.log('articleAd1-5:', (html.match(/lab-ad-slot--articleAd[1-5]/g)||[]).length);console.log('EJS leak:', html.includes('<%')||html.includes('%>')||html.includes('await include'));"
```

預期：`client OK: true` / `slot OK: true` / `articleAd6: 1` / `articleAd1-5: 0` / `EJS leak: false`。

---

## 6. Six required pre-repost inputs（user 須逐項填，沿用 Phase D pm-13 packet §4 結構）

- [ ] 確認 / 建立 live Blogger 文章 URL：`__________`
  - 若 live 已存在對應文章 → 記錄其 URL（建議候選 `https://babel-lab.blogspot.com/...`，由 user 核對）
  - 若 live 尚未存在 → 須先**新建空文章**並記錄 URL（首次重貼前）
- [ ] 確認正確的 Google / Blogger 帳號：`__________`
- [ ] 確認正確的 blog（避免貼錯 blog）：`__________`
- [ ] 現有 live HTML 之備份位置（若文章已存在 + 已有內容）：`__________`
- [ ] theme CSS readiness verdict（PASS / FAIL，見 §7）：`__________`
- [ ] before / after 截圖存放位置（桌機 + 手機）：`__________`

> 若該 live Blogger 文章 = **全新文章**（無既有內容），可在「現有 live HTML 之備份位置」填 `N/A — newly created post`。

---

## 7. Theme / CSS readiness gate

mirror Phase D pm-13 §6；本 post 與 we-media-myself2 之**差異**：

| Class group | 本 post 是否會出現 | Phase D（we-media-myself2）是否會出現 | 備註 |
|---|---|---|---|
| `.adsbygoogle` | ✅ 必出 | ✅ | AdSense `<ins>` |
| `.lab-ad-slot--articleAd6` | ✅ 必出 | ✅ | 本次 ad 版位 |
| `.lab-affiliate-box` | ❌ 不會出 | ✅ | 本 post 無 affiliate |
| `.lab-related-links`*（`__title` / `__list` / `__item` / `__link` / `__platform`） | ❌ 不會出 | ✅ | 本 post 無 relatedLinks |
| `.lab-other-links`* | ❌ 不會出 | ❌ | 兩篇皆無 otherLinks |
| `.lab-hashtags` / `.lab-hashtag` | ✅ 必出 | ✅ | 兩篇皆有 |
| `.lab-blogger-article` 外殼 | ✅ 必出 | ✅ | 統一外層 |
| `.lab-article__header` / `__title` / `__title-en` / `__meta` / `__description` | ✅ 必出 | ✅ | header 區段 |
| `.lab-article__body` | ✅ 必出 | ✅ | body 區段 |
| `.lab-container` | ✅ 必出 | ✅ | AdSense block 外殼 |

**檢查方式**：因 Phase D 已驗 `.adsbygoogle` / `.lab-ad-slot--articleAd6` / `.lab-blogger-article` / `.lab-article__*` / `.lab-hashtag*` / `.lab-container` 共用 class 在 live Blogger 主題下顯示正常 → 本 post **不**引入新 class group，**繼承** Phase D 之 theme CSS readiness verdict。

**任一缺失 → STOP，不得 repost**（須另立 CSS / theme plan）。
**實際 repost 中不修改主題，除非另行批准。**

---

## 8. Manual repost step draft

⚠️ 以下為**操作草案**；本 phase 不執行。

1. （rebuild）`npm run build:blogger`，確認 `dist-blogger/posts/github-pages-blog-planning/post.html` 是最新（§5 之 one-liner 驗證）。
2. 開 Blogger 後台（登入正確帳號 / 正確 blog；per §6 pre-repost input）。
3. 找到對應 live 文章 **或** 建立新文章（依 §6 input 1 之兩種情況分支）：
   - **既有文章**：先**備份**現有 live HTML 至 §6 input 4 指定位置（複製存檔，記檔名 / timestamp / 位置）。
   - **新文章**：「新增文章」→ 將 Blogger 文章標題設為 `GitHub Pages 免費空間限制與部落格規劃`（與 dist `<h1>` 一致）。
4. 切換到 **HTML 模式**（**非**視覺編輯器；視覺編輯器可能改寫 HTML / strip `<ins>`）。
5. 開啟 `dist-blogger/posts/github-pages-blog-planning/post.html`，**全選複製**整個檔案內容（外層 `<div class="lab-blogger-article">`..`</div>` 區塊）。
6. 在 Blogger HTML 編輯器**替換 / 貼入** body 區塊；**不動主題**、不動 sidebar widget、不改 Blogger 文章標籤（如要對齊本 post 之 `tags: [github, vite, static-site]`，在 Blogger 之 label 欄手動加入；屬獨立操作，本 packet 不強制要求）。
7. 設定 / 確認 Blogger 文章「搜尋說明」與「自訂網址 slug」（per §9）。
8. **先預覽，不要直接發布**：
   - 桌機預覽
   - 手機預覽
9. 兩端預覽通過 → publish / update。
10. **不碰其他文章**。

---

## 9. Blogger metadata 對齊（建議；非強制本 phase 執行）

| Blogger 欄位 | 建議值（取自 dist meta.json） |
|---|---|
| 文章標題 | `GitHub Pages 免費空間限制與部落格規劃` |
| 搜尋說明 | `GitHub Pages 免費空間、Vite 靜態網站、Markdown 部落格、Google AdSense 與搬家規劃。`（`searchDescription`） |
| 自訂網址 slug | `github-pages-blog-planning` |
| 標籤（Labels） | `github`, `vite`, `static-site`（與 `tags[]` 對齊） |
| 發布日期 | `2026-05-04`（與 `date` 對齊；如為新貼則 user 自行決定是否回填） |

→ 也可同步參考 `dist-blogger/posts/github-pages-blog-planning/copy-helper.txt` 之逐區可複製內容（本 packet 不另複製，避免漂移）。

---

## 10. 前台驗收 checklist（repost 後在 live page 上看的）

- [ ] 文章標題 / titleEn / 描述完整顯示
- [ ] body 文字「這是一篇初始化範例文章。Phase 1 會建立 Markdown 讀取與 frontmatter 解析。」可見（**注意**：body 極短屬預期；非錯誤）
- [ ] 文章底部有 AdSense slot 容器（`<ins class="adsbygoogle lab-ad-slot lab-ad-slot--articleAd6" ...>`；DevTools 或 view-source 可驗）
- [ ] slot 位置：在 body 之後、hashtags 之前（本 post 無 affiliate / related / other 三段；slot 緊接 body 結尾 + 緊隨 hashtags）
- [ ] 桌機無破版
- [ ] 手機無破版
- [ ] 無可見的 EJS / template 文字（不應該出現 `<%` / `%>` / `await include`）
- [ ] 無 `articleAd1`–`articleAd5` 出現（DOM 內 `lab-ad-slot--articleAd[1-5]` 應為 0；本 post 為 Blogger surface，Phase B policy 僅 `articleAd6` 准入）
- [ ] hashtags 三個（`#github` / `#vite` / `#static-site`）顯示
- [ ] canonical link 指向 GitHub Pages（含 reverse UTM）
- [ ] AdSense loader script（pagead2.googlesyndication.com）在 page head 出現（這由 Blogger 主題或既有 AdSense 啟用提供，非本貼上之 markup）
- [ ] **第一次載入若 ad slot 空白屬正常**（AdSense fill 延遲）；重整或第二次載入再觀察 fill

---

## 11. 若沒看到廣告的判斷流程

**第一步：DevTools 區分兩種狀態**

| 觀察 | 結論 | 下一步 |
|---|---|---|
| DOM 內 `<ins class="...lab-ad-slot--articleAd6...">` **不存在** | 模板 / 貼入失敗 | → §11.A |
| DOM 內 `<ins>` **存在**但 visible 空白 / iframe 0×0 / no creative | AdSense 後台未填（fill / policy / cache / first load） | → §11.B |

### 11.A `<ins>` 不存在（HTML slot 不存在）

回 repo 排查順序：
1. **貼錯來源**？確認貼的是 `dist-blogger/posts/github-pages-blog-planning/post.html`（per §5）。
   - 若貼成 `dist/posts/github-pages-blog-planning/*.html`（GitHub Pages dist）→ 移除，改貼 Blogger dist。
   - 若貼成 markdown raw → 移除，改貼 dist HTML。
2. **貼錯模式**？確認 dist post.html 是 `bloggerMode: full` 而**非** summary（檢查 `meta.json` 之 `bloggerMode` / `rendered`）。若是 summary → 須先 rebuild（night-4 frontmatter flip 應已生效，理論上不會發生此狀態）。
3. **Blogger 視覺編輯器 strip 掉**？確認貼入時是 HTML 模式而非視覺模式；切回視覺模式可能改寫 `<ins>` / 移除 inline script。
4. **貼錯文章**？確認 Blogger 編輯之文章 URL slug 與 §6 input 1 之 live URL 一致。
5. **dist 過舊**？rerun `npm run build:blogger` 並用 §5 之 node 驗證 one-liner 確認 dist 之 `data-ad-client` / `data-ad-slot` 屬性還在。

### 11.B `<ins>` 存在但未填廣告（HTML slot 存在但 Google 未填）

mirror Phase D night-1 §6.5 之 interpretation：
- **第一載 / 短期 unfilled = 屬正常 no-fill**，**非實作失敗**。等待 / reload / 換瀏覽器再觀察。
- **multiple loads 仍空** + DOM 內 `data-ad-client` / `data-ad-slot` 值正確（與 `ads.config.json` 一致）→ 屬 AdSense **後台 fill / policy** 範疇（廣告主競價、政策審核、地區 fill rate）。**不**是 repo / 模板問題；**不**在 repo-side 處理範疇。
- **數小時** 仍 0 fill → 屬 AdSense 後台監控；如要排查屬另案，非本 packet 範圍。
- console 出現 `api.pub.affiliates.one` 429/404 → 屬 affiliate-link runtime（per Phase D night-1 §6.6），與本 ad slot **無關**。
- console 出現 `aria-hidden` warnings → 屬 a11y，與 ad fill 無關（per Phase D night-1 §6.7）。

---

## 12. Guard 現況

- `npm run check:blogger-adsense-output` **目前仍只驗證** `we-media-myself2`（Phase E single-slug guard；hardcoded `TARGET_SLUG = 'we-media-myself2'`）。
- `github-pages-blog-planning` 目前**僅有 one-off dist evidence**（night-4 acceptance §4 之 node one-liner 結果），**尚未納入** repeatable guard 覆蓋。
- guard 參數化（多 slug / CLI param / registry）= **下一階段**才考慮，不在本 phase 範圍。
- → 在 guard 涵蓋第二篇之前，每次 rebuild 後若想 sanity check 第二篇，請手動跑 §5 之 node one-liner。

---

## 13. Rollback procedure

- **發布前**：預覽失敗 / 視覺異常 / DevTools 找不到 `<ins>` → 丟棄變更 / 關閉編輯器不更新（既有 live 內容不變）。
- **新文章未發布**：刪除草稿 / 直接放棄。
- **覆蓋既有文章後發現問題**：用 §6 input 4 之備份檔還原至 Blogger HTML 編輯器，重新 publish。
- **CSS / theme 問題**：若曾動主題（本流程不應動）→ 還原 theme 備份。
- **不要 rollback repo**，除非 repo 輸出本身被證明錯誤（驗證手段 = §5 之 node one-liner 重跑）。
- 保留 rollback 後截圖。

---

## 14. GO / NO-GO table

| 判斷 | 條件 |
|---|---|
| ✅ **GO** | §6 六項 input 完成 **且** §7 theme CSS readiness PASS（繼承 Phase D verdict）**且** §5 dist evidence one-liner 全 true **且** 預覽（桌機+手機）通過 **且** target 身分正確 **且** DOM 內恰 1 個 `articleAd6` |
| 🔴 **NO-GO** | 任一不符：位置 / 內容 mismatch、重複 ad block、template leak、選錯帳號 / blog / 文章、缺備份（覆蓋既有文章時）、視覺編輯器改寫 HTML 風險、貼錯來源（GitHub Pages dist / markdown raw / summary HTML） |

廣告未即時填充屬正常（AdSense 端 fill 延遲）；非破版即可接受。

---

## 15. Non-actions（本 session 明確未做）

- ❌ 未登入 / 未操作 Blogger 後台
- ❌ 未 paste / publish / repost
- ❌ 未碰 AdSense 後台
- ❌ 未 deploy / 未 push gh-pages
- ❌ 未改 `src/` 任何 script
- ❌ 未改 任何 EJS template
- ❌ 未改 `content/settings/ads.config.json`
- ❌ 未改 `package.json`
- ❌ 未改 `src/scripts/check-blogger-adsense-output.js`
- ❌ 未做 guard 參數化（多 slug / CLI param / registry）
- ❌ 未改 任何 content markdown / frontmatter
- ❌ 未新增或 hardcode 真實 AdSense ID
- ❌ 未碰 commerce / Admin / renderer / GitHub Pages deploy
- ❌ 未做 unrelated cleanup

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 night-5 ledger sync。

---

## 16. Validation results（本 session 跑）

| 指令 | 結果 |
|---|---|
| `npm run validate:content` | 0 errors / 94 warnings / 84 posts |
| `npm run check:adsense-resolver` | 34 passed / 0 failed |
| `npm run build:blogger` | success（3 ready；2 full + 1 summary） |
| `npm run check:blogger-adsense-output` | 14 passed / 0 failed |

⚠️ `check:blogger-adsense-output` **目前仍只驗** `we-media-myself2`。本 packet 不更動 guard scope。

---

## 17. Recommended next phase

**`20260612-XX-blogger-adsense-second-post-manual-repost-execution-a`** —
human operator 依本 packet 執行第二篇 Blogger AdSense 手動 repost：完成 §6 六項 input → §7 theme readiness 確認 PASS → §8 manual repost step → §10 前台驗收 → 若異常依 §11 排查。產出 verification record（mirror Phase D night-1 record 結構）。**docs-only acceptance**；不改 source / settings / guard。

🔴 **實際執行須 user 完成 §6 inputs + explicit approval；本 packet 不開放自動推進。**

---

（本文件結束）
