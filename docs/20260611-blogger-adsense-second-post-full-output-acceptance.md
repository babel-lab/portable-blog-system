# Blogger AdSense — Second Post Full-Output Acceptance

Phase: `20260611-night-4-blogger-adsense-second-post-frontmatter-flip-and-rebuild-content-change-a`

## 1. Status

- **content-change phase + read-only acceptance**（per user explicit approval at 20260611 23:44）
- 變更僅一行：`content/github/posts/20260504-github-pages-blog-planning.md` 之 `publishTargets.blogger.mode` 由 `"summary"` → `"full"`
- **未** repost / paste / publish / Blogger 後台 / AdSense 後台 / deploy / gh-pages / source script / EJS template / `ads.config.json` / `package.json` / `check-blogger-adsense-output.js` / guard parameterization 變更
- 目的：完成 night-3 readiness packet §5.3 之 prerequisite（mode flip + rebuild），讓第二篇候選 dist HTML 開始攜帶 Blogger AdSense bottom slot。

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律以 `slotKey`（`articleAd6`）/ masked（`ca-pub-…****`）表述。real id 僅存於 `content/settings/ads.config.json`，被 build 端透過 `deriveRenderedAdsenseBlocks(post, settings.ads, 'blogger')` 注入 dist；不在 source / docs / tests 內 hardcode。

---

## 2. Baseline before change

| 項目 | 值 |
|---|---|
| HEAD / origin/main | `dc3add3` |
| latest subject | `docs(blogger): plan second adsense post readiness` |
| working tree | clean |
| `npm run validate:content` | 0 errors / 94 warnings / 84 posts |
| `npm run check:adsense-resolver` | 34 passed / 0 failed |
| `npm run check:blogger-adsense-output` | 14 passed / 0 failed（target = `we-media-myself2`） |

See also：
- `docs/20260611-blogger-adsense-second-post-readiness-packet.md`（night-3 readiness packet；推薦此 slug 為第二篇候選）
- `docs/20260611-blogger-adsense-phase-d-manual-post-verification-record.md`（night-1 Phase D PASS 紀錄）
- `src/scripts/check-blogger-adsense-output.js`（Phase E single-slug guard；本 phase 不動）

---

## 3. Change set

| 檔 | 變更 |
|---|---|
| `content/github/posts/20260504-github-pages-blog-planning.md` | 唯一一行：`publishTargets.blogger.mode: "summary"` → `"full"` |
| `docs/20260611-blogger-adsense-second-post-full-output-acceptance.md` | 新增（本檔） |
| `CLAUDE.md` | 小幅 ledger sync（記錄 night-4 落地 + dist evidence + guard 維持單 slug） |

**未動之欄位**（content frontmatter 內未改）：
- `id` / `site` / `contentKind` / `primaryPlatform`
- `title` / `titleEn` / `slug`
- `date` / `updated` / `author`
- `category` / `tags` / `description` / `searchDescription`
- `cover` / `coverAlt`
- `status` / `draft` / `canonical`
- `publishTargets.github`（仍 `enabled:true` / `mode:"full"`）
- `publishTargets.blogger.enabled`（仍 `true`）
- `blocks` 全部欄位（toc / adsenseTop / adsenseMiddle / adsenseBottom / hashtags / socialFollow / relatedPosts / sidebar）

**未動之其他文章**：所有其他 `content/**/*.md` 皆未修改。

---

## 4. Output evidence

`npm run build:blogger`（本 phase 跑）後：

### 4.1 Manifest 確認 mode 切換

`dist-blogger/posts/github-pages-blog-planning/meta.json`：

```
"bloggerMode": "full",
"rendered": "full",
```

### 4.2 dist HTML grep 結果

對 `dist-blogger/posts/github-pages-blog-planning/post.html`：

| 檢項 | 結果 |
|---|---|
| `lab-ad-slot--articleAd6` occurrence count | **1** ✅ |
| `lab-ad-slot--articleAd[1-5]` occurrence count | **0** ✅ |
| `data-ad-client` 值等於 `ads.config.json` `adsenseClient` | **true**（node strict-equal 比對；不 echo 值） |
| `data-ad-slot` 值等於 `ads.config.json` `slots.articleAd6` | **true**（同上） |
| `<%` / `%>` / `await include` EJS leak | **false** ✅ |

驗證指令（read-only one-liner；**未** 寫成 permanent script）：

```bash
node -e "const ads = require('./content/settings/ads.config.json'); \
  const fs = require('fs'); \
  const html = fs.readFileSync('dist-blogger/posts/github-pages-blog-planning/post.html', 'utf-8'); \
  console.log('client in html:', html.includes('data-ad-client=\"' + ads.adsenseClient + '\"')); \
  console.log('slot in html:', html.includes('data-ad-slot=\"' + ads.slots.articleAd6 + '\"')); \
  console.log('articleAd6 count:', (html.match(/lab-ad-slot--articleAd6/g) || []).length); \
  console.log('articleAd1-5 count:', (html.match(/lab-ad-slot--articleAd[1-5]/g) || []).length); \
  console.log('EJS leak:', html.includes('<%') || html.includes('%>') || html.includes('await include'));"
```

輸出（本 session 跑）：
```
client in html: true
slot in html: true
articleAd6 count: 1
articleAd1-5 count: 0
EJS leak: false
```

### 4.3 文件結構順序

`dist-blogger/posts/github-pages-blog-planning/post.html`（line numbers 為本 build 之 snapshot；後續 builtAt 戳記變動不影響相對順序）：

| 區段 | 結構位置 |
|---|---|
| article body（thin sample body：「這是一篇初始化範例文章...」） | 在 ad container 之前 |
| `<div class="lab-container">` 之 AdSense block | line 61 開始（`<ins class="adsbygoogle lab-ad-slot lab-ad-slot--articleAd6">` at line 63） |
| `<ul class="lab-hashtags">` 區段 | line 77 開始 |
| `lab-related-links` 區段 | **不存在**（post frontmatter 無 `relatedLinks`） |
| `lab-other-links` 區段 | **不存在**（post frontmatter 無 `otherLinks`） |
| `lab-affiliate-box` 區段 | **不存在**（post frontmatter 無 `affiliate`） |

**位置語意正解**：AdSense block 由 `blogger-post-full.ejs` 之 `beforeRelatedLinks` anchor partial 注入；該 anchor 在模板中位於 `body 結尾`、`affiliate-box bottom 之後`、`related-links 之前`、`other-links 之前`、`hashtags 之前`。本 post 雖無 affiliate / related / other 三個 optional 區段，anchor 仍正確 fire；後緊隨之 hashtags 區段在文件順序上位於 AdSense block **之後**，與 anchor 名稱（`beforeRelatedLinks`）之 document-position 語意一致（per `docs/20260610-night-4-adsense-six-slot-convention-preanalysis.md` §7.2 之 v1 anchor enum monotonic 排序）。

→ 與 we-media-myself2 同形（articleAd6 / beforeRelatedLinks）；不同處僅在於 we-media-myself2 之 anchor 之後有 affiliate-box（top/bottom 之 bottom）+ related-links + hashtags 三段，本 post 只剩 hashtags 一段。

---

## 5. ID containment（real id 仍只存於 `ads.config.json`）

- `ads.config.json` 之 `adsenseClient` 與 `slots.articleAd6` 被 EJS render 寫入 dist HTML（如 §4.2，**符合預期**：dist 屬 build artifact，git-ignored）。
- 本 phase **未** 在以下任一檔內寫入 real id 字面值：
  - source（`src/**`）
  - EJS templates（`src/views/**`）
  - tests / smoke scripts（`src/scripts/check-*.js`）
  - docs（`docs/**` 含本檔）
  - `package.json`
  - 任何 frontmatter（包含本 phase 修改之 `20260504-github-pages-blog-planning.md`）
- 對應 `content/settings/ads.config.json` 仍是 real id 之**唯一**權威 source；其他 referer 透過 `deriveRenderedAdsenseBlocks(post, settings.ads, surface)` runtime 注入。

---

## 6. Validation results（本 phase 跑）

| 指令 | 結果 |
|---|---|
| `npm run validate:content` | 0 errors / 94 warnings / 84 posts |
| `npm run check:adsense-resolver` | 34 passed / 0 failed |
| `npm run build:blogger` | success（3 ready posts；現在 **2 篇 full** / 1 篇 summary） |
| `npm run check:blogger-adsense-output` | 14 passed / 0 failed |

⚠️ `check:blogger-adsense-output` **目前仍只驗證 `we-media-myself2`**（per Phase E single-slug guard 設計；本 phase **不**改 guard）。**本 phase 不代表第二篇 `github-pages-blog-planning` 已通過 guard**；其 dist HTML evidence 僅由 §4 之 read-only one-liner 驗證。第二篇 guard 涵蓋 = guard 參數化 phase 之未來範圍。

---

## 7. Non-actions（本 session 明確未做）

- ❌ 未操作 Blogger 後台 / 編輯器 / 預覽
- ❌ 未重貼 `github-pages-blog-planning` 至 Blogger（live Blogger 上仍是舊內容；本 phase 僅產出 dist HTML 為**未來**手動重貼準備）
- ❌ 未碰 AdSense 後台
- ❌ 未 deploy / 未 push gh-pages
- ❌ 未改 `src/` 任何 script / EJS template
- ❌ 未改 `content/settings/ads.config.json`
- ❌ 未改 `package.json`
- ❌ 未改 `src/scripts/check-blogger-adsense-output.js`
- ❌ 未做 guard 參數化（多 slug / CLI param / registry）
- ❌ 未新增或 hardcode 真實 AdSense ID 至任何檔
- ❌ 未碰 commerce / Admin / renderer / GitHub Pages deploy
- ❌ 未修改其他文章 frontmatter / body
- ❌ 未做 unrelated cleanup

---

## 8. Implications / open items

1. **`github-pages-blog-planning` 之 dist 現在攜帶 AdSense block**，但 **live Blogger 對應文章尚未重貼** → live 端尚無此 ad markup。
2. body 極短（「這是一篇初始化範例文章。Phase 1 會建立 Markdown 讀取與 frontmatter 解析。」一行）→ 即使重貼，視覺上會出現「短文 → 廣告 → hashtag」結構；用於樣本驗證仍合理，但若擔心使用者體驗，可考慮先將 body 充實再進入 Phase D-equivalent 重貼（**屬另案**）。
3. Phase D-equivalent live repost 仍 🔴 BLOCKED；須另立 phase + user explicit approval + backup + theme CSS readiness（mirror Phase D §6）+ 預覽桌機+手機 + 截圖。
4. 後續 guard 參數化（讓 `check-blogger-adsense-output.js` 接受 `--slug=` / `--html=` / registry）= 待第二篇 live repost 後再決定，避免「為支援第二篇而 rushed」。

---

## 9. Recommended next phase

**`20260611-night-5-blogger-adsense-second-post-repost-readiness-handoff-docs-only-a`** —
docs-only readiness handoff packet（mirror Phase D pm-13 handoff packet 結構），列出第二篇實際重貼前 user 必須完成之六項輸入（live Blogger URL / 帳號 / blog / live HTML 備份位置 / theme CSS readiness verdict / 截圖位置）+ 手動 repost checklist + Theme CSS readiness gate + Expected output checklist（適配本 post 沒有 affiliate / related-links 區段之差異）+ rollback procedure + GO/NO-GO 表。**不執行重貼、不 deploy、不改 guard**。

🔴 實際 live repost 仍另行 BLOCKED，須 user 審閱 handoff packet 後 explicit separate approval 始可執行。

---

（本文件結束）
