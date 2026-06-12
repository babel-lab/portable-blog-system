# Blogger AdSense Batch 2 P1 — `blog-as-personal-knowledge-base` Guard Coverage Record

Phase: `20260612-pm-18-blogger-p1-knowledge-base-guard-coverage-a`

## 0. Status

- **guard coverage change（minimal）**：在 P1 `blog-as-personal-knowledge-base` 已 manual live PASS（pm-17）後，把此 slug 加入既有 Blogger / AdSense automated guard `TARGETS`。
- 本 phase **僅**改 `src/scripts/check-blogger-adsense-output.js`（新增 1 個 target entry）+ 本 record doc + `CLAUDE.md` 極小 ledger append。
- 本 phase **不**改 template / EJS / renderer / settings（含 `ads.config.json`）/ content post / 已產生之 Blogger HTML；**不**新增其他 slug / 新 ad slot / assets / commerce links；**不** publish / repost / deploy / npm install。
- **不**改 guard 邏輯（C1–C10 / P1–P4 / S1 共同斷言一律沿用；僅新增 declarative target entry）。

> ⚠️ 本文件不含 real AdSense client / slot id；guard 從 `content/settings/ads.config.json` 讀 `adsenseClient` / `slots.articleAd6` 做 strict-equal，**不** hardcode real id。引用值一律以 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）/ masked 表述。

> ⚠️ **核心紅線：Blogger VIEW count 增加只能視為 weak signal，不可當作真實流量或 AdSense 成效依據。** guard 為 repo-side generated-artifact 結構鎖，**不**取代 live 觀察、**不**量測流量 / 收益。

---

## A. Phase name

`20260612-pm-18-blogger-p1-knowledge-base-guard-coverage-a`

---

## B. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD（修改前） | `d92c14e` |
| origin/main | `d92c14e` |
| working tree | clean（修改前） |
| latest subject | `docs(blogger): record knowledge-base live repost`（pm-17） |
| guard target count（修改前） | **5**（we-media-myself2 / daily-reading-habit-notes / github-pages-blog-planning / reading-notes-three-questions / after-work-writing-time-blocking） |
| `check:blogger-adsense-output`（修改前） | 71 / 0（1 settings + 14×5） |

Baseline 與 user 期望一致；不做任何 fix。

---

## C. Why guard coverage is now allowed

- **pm-17 live PASS recorded** —— `docs/20260612-blogger-p1-knowledge-base-manual-repost-completion-record.md` 已記錄 human operator 於 `20260612 16:09` 完成本 post 之 Blogger 手動重貼 + 前台 / DevTools 驗證（articleAd6 出現、`data-ad-status="filled"`、`data-ad-client`/`data-ad-slot` 未被 strip）。
- **live inventory = 6** —— 加入本 post 後 live-verified post 達 6 篇。
- **previous automated guard = 5** —— guard 先前僅涵蓋 5 篇；本 post 為 manually-evidenced but not yet guard-covered。
- → 依既有節奏（live PASS 後才把 slug 加入 guard `TARGETS`），現可將本 slug 納入 guard，使 guard coverage 由 5 → 6，與 live inventory 對齊。

---

## D. Guard change summary

| 項目 | 值 |
|---|---|
| file changed | `src/scripts/check-blogger-adsense-output.js`（**僅此 1 source 檔**） |
| slug added | `blog-as-personal-knowledge-base` |
| target count | **5 → 6** |
| 變更內容 | 在 `TARGETS` array 末端**新增 1 個 declarative target entry**（+其註解）；未改 guard 邏輯 / 未改既有 5 target |
| expected（依實測填寫，未猜） | `articleAd6: 1` / `articleAd1to5: 0` / `noindex: 0` / `affiliateBox: { exact: 0 }` / `relatedLinks: false` / `positionAnchor: 'hashtags'` |
| 形態 | life-note 最簡形態（與 daily-reading / reading-notes / after-work-writing 同型；複用既有 P1–P4 expectation 模板） |

### D.1 實測來源（`dist-blogger/posts/blog-as-personal-knowledge-base/post.html`）

本 session `npm run build:blogger` 後 read-only 量測：`lab-ad-slot--articleAd6` = **1** / `lab-ad-slot--articleAd[1-5]` = **0** / `noindex` = **0** / `lab-affiliate-box` = **0** / related-links = **0** / hashtags present / 順序 body(L48) < ad(L74) < hashtags(L88) → 對映 expectation；`data-ad-client` / `data-ad-slot` strict-equal `ads.config.json`（guard C4 / C5 從 settings 讀，不 hardcode）。

### D.2 新 slug 之 guard 條件（沿用既有 live PASS post 條件）

| 共同斷言（C1–C10） | 對映需求 |
|---|---|
| C1 | generated Blogger HTML exists + articleAd6 exactly 1 |
| C2 | adsbygoogle `<ins>` exists |
| C3 | inline adsbygoogle push present |
| C4 / C5 | data-ad-client / data-ad-slot preserved（strict-equal ads.config.json，不 hardcode） |
| C6 | data-ad-format / data-full-width-responsive present |
| C7 | articleAd1–5 exactly 0 |
| C8 | no legacy slot classes |
| C9 | no EJS leak（`<%` / `%>` / `await include`） |
| C10 | no undefined/null leak near ad markup |
| P1 / P2 / P3 / P4 | noindex 0 / no commerce box / related-links absent / bottom slot order body < ad < hashtags |

→ 全部沿用既有結構，未弱化既有 5 target 之任何 assertion。

---

## E. Validation summary

| 檢查 | 結果 |
|---|---|
| `git diff --check` | clean（exit 0） |
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（不變） |
| `npm run check:blogger-adsense-output` | **85 passed / 0 failed**（1 settings + 14×6；5→6 target；**新 slug 14 case 全 PASS**） |
| `npm run check:adsense-resolver` | 34 / 0（carry forward） |
| `npm run check:adsense-article-block` | 13 / 0（carry forward） |
| `npm run check:adsense-anchor-wiring` | 14 / 0（carry forward） |
| guard source real-id hardcode | **0**（grep `ca-pub-[0-9]+` = 0；real id 僅從 `ads.config.json` 讀） |

### E.1 新 slug 14 case 結果

`[blog-as-personal-knowledge-base]` C1 ✅ / C2 ✅ / C3 ✅ / C4 ✅ / C5 ✅ / C6 ✅ / C7 ✅ / C8 ✅ / C9 ✅ / C10 ✅ / P1 ✅ / P2 ✅ / P3 ✅ / P4 ✅ → **新 slug PASS**。

---

## F. Explicit non-actions（本 session 明確未做）

- ❌ no template / EJS / renderer change
- ❌ no settings / `ads.config.json` change（real id 仍只存 `ads.config.json`；未新增 / 未 hardcode）
- ❌ no content post change（含 `blog-as-personal-knowledge-base`，一律只讀未動）
- ❌ no Blogger live post change（未登入 / 未重貼 / 未開 AdSense 後台）
- ❌ no new assets / no new commerce links
- ❌ no Blogger publish / repost
- ❌ no deploy / no push gh-pages / no `dist-blogger` commit / no `.cache` mutation
- ❌ no npm install / no package / lockfile change
- ❌ no new / modified AdSense slot（沿用既有 `articleAd6` bottom slot policy）
- ❌ no new guard script（僅在既有 `check-blogger-adsense-output.js` 之 `TARGETS` 新增 1 entry）
- ❌ no guard 邏輯重構（C1–C10 / P1–P4 / S1 未動）
- ❌ no 其他 slug 新增（僅本 slug）
- ❌ no CLAUDE.md compression / 無重排 / 無 unrelated cleanup
- ❌ no `/memory`
- ❌ **未把 Blogger VIEW count 增加判定為真實流量或 AdSense 成效**

唯一 mutation：`src/scripts/check-blogger-adsense-output.js`（+1 target entry）+ 本 record doc + `CLAUDE.md` 之 pm-18 極小 ledger sync。

---

## G. Recommended next phase

- **Conservative（推薦預設）**：維持 baseline；持續 monitor 6 篇 live post + AdSense dashboard / policy（另案）。
- **Optional：P2 draft docs-only** — 撰寫 `ai-tools-simplify-daily-workflow` full article draft（docs-only；嚴守 pm-10 §E.2 policy cautions）。
- **Optional：AdSense dashboard / policy monitoring record docs-only later** — 後續另開 docs-only 記錄 AdSense 後台觀察。
- **Not advised**：一次大量重貼 / 改 template / source / 新增 ad slot。

🔴 任何 live repost / Blogger 後台動作 / source（非 guard）/ settings change，皆須 user explicit approval 後另開單一 phase。

---

## H. Live-verified + guard-covered inventory（截至 pm-18）

| # | slug | form | live PASS | guard-covered |
|---|---|---|---|---|
| 1 | `we-media-myself2` | 複雜（affiliate + related-links） | ✅ | ✅ |
| 2 | `github-pages-blog-planning` | tech-note 簡形態 | ✅ | ✅ |
| 3 | `daily-reading-habit-notes` | life-note 最簡 | ✅ | ✅ |
| 4 | `reading-notes-three-questions` | life-note 最簡 | ✅ | ✅ |
| 5 | `after-work-writing-time-blocking` | life-note 最簡 | ✅ | ✅ |
| 6 | `blog-as-personal-knowledge-base` | life-note 最簡 | ✅（pm-17，20260612 16:09） | ✅（**pm-18 本 phase**） |

→ **6 篇 live PASS；guard 涵蓋 6 篇**（live inventory 與 automated guard coverage 對齊）。

---

## I. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）；**不含**完整 real AdSense client id / slot id。guard 從 `ads.config.json` 讀做 strict-equal，source grep `ca-pub-[0-9]+` = 0。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
