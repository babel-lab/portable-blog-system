# Blogger AdSense — Batch 2 Rollout Preanalysis

Phase: `20260612-pm-9-blogger-adsense-batch-2-preanalysis-docs-only-a`

## 0. Status

- **docs-only preanalysis**。只做 Batch 2 文章擴充前的規劃，**不**執行 publish / repost / Blogger 後台動作。
- 本 phase **不**改 source / template / EJS / renderer / content production post / settings（含 `ads.config.json`）/ guard / fixtures / views / package / lockfile / dist / `.cache`。
- 本 phase **不** deploy、**不** npm install、**不**做 Batch 2 實作、**不**做第 4 篇發文、**不**做 GA4 實作、**不**改 AdSense real id。
- 唯一 mutation：本 doc 自身 + `CLAUDE.md` 極小 ledger sync append。
- 依據 = pm-6 rollout readiness（`docs/20260612-blogger-adsense-batch-1-rollout-readiness.md`）+ pm-7 completion record（`docs/20260612-blogger-adsense-batch-1-completion-record.md`）+ pm-8 monitoring checklist（`docs/20260612-blogger-batch1-post-rollout-monitoring-checklist.md`）+ am-2 candidate inventory（`docs/20260612-blogger-adsense-phase-f-batch-candidate-inventory.md`）+ am-12 expansion plan（`docs/20260612-blogger-adsense-phase-f-batch-1-expansion-plan.md`）。

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律以 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）/ masked（`ca-pub-…****`）表述。real id 僅存於 `content/settings/ads.config.json`。

> ⚠️ **核心紅線（貫穿全文）：Blogger VIEW count 增加只能視為 weak signal，不可當作真實流量或 AdSense performance（impression / click / earning）的判斷依據。** 在沒有 GA4 / Search Console / AdSense 後台交叉比對前，不據此擴大發文。

---

## A. Phase name

`20260612-pm-9-blogger-adsense-batch-2-preanalysis-docs-only-a`

---

## B. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `6f307d6` |
| origin/main | `6f307d6` |
| ahead / behind | 0 / 0 |
| working tree | clean（撰寫前） |
| latest subject | `docs(blogger): record batch1 rollout monitoring checklist`（pm-8） |
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（production-post warnings = 0；94 全來自 `content/validation-fixtures/`） |

Baseline 與本 session 預期一致；不做任何 fix。

---

## C. Current state summary

- **Batch 1 已進入 manual / monitoring 階段**：pm-7 已宣告 Batch 1 minimum COMPLETE / READY（3 篇 low-risk life-note live PASS）；pm-8 已建立 post-rollout monitoring checklist。
- **目前 live/manual verified + guard-covered Blogger AdSense posts = 5 篇**（we-media-myself2 複雜書評 / github-pages-blog-planning tech-note / daily-reading-habit-notes / reading-notes-three-questions / after-work-writing-time-blocking 三篇 life-note 最簡形態）；`check:blogger-adsense-output` 5-target / 71-0。
- **Blogger VIEW count increase = weak signal only**：pm-8 已記錄「測試頁面未公開但 Blogger VIEW count 增加」，可能來源為 Google/Blogger/AdSense crawler、平台 preview/fetch/stats delay/recount、自己多裝置 self-traffic、或少量（不可誇大）外部 discoverability。**未證實為真實外部訪客，不可當作流量 / 收益依據。**
- **conservative default = pause / idle-freeze**；Batch 2 屬可選下一步，須 user 決定才啟動，且即使啟動本 phase 也只做 planning。

---

## D. Batch 2 goal

- **目標**：在 Batch 1（3 篇 low-risk minimum）之後，規劃下一批可安全人工重貼的 Blogger AdSense 文章，沿用既有 bottom `articleAd6` slot policy，擴大內容覆蓋面 / 形態多樣性。
- **手段限定**：與 Batch 0 / Batch 1 一致 —— **每篇獨立 content phase（若需新文）→ generated-HTML 驗證 → repost packet（docs-only）→ user manual repost → verification record → live PASS 後加入 guard**。**不**批次自動化、**不**略過人工目視。
- **本文件只做 planning**，不執行任何 publish / repost；候選文章是否真的進入重貼，由後續獨立 phase + user explicit approval 決定。

---

## E. Candidate selection principles（Batch 2 候選挑選原則）

1. **低政策風險**：避開 Google AdSense / Blogger 內容政策敏感領域。
2. **非醫療高風險、非金融承諾、非敏感誤導內容**：不得含醫療診斷 / 療效保證、投資獲利承諾、誇大或誤導性聲明。
3. **文章內容完整、可讀性高**：完整 intro / body / 收尾，無 placeholder / TODO / demo 佔位；非半成品。
4. **適合長尾搜尋**：主題具有穩定長期搜尋價值（how-to / 心得 / 方法類），而非時效性極強的快訊。
5. **適合 AdSense 但不為廣告硬塞內容**：文章本身有閱讀價值；不為了塞廣告而拼湊內容（content-for-ads 反而是政策風險）。
6. **避免過短、過舊、結構混亂、或需要重大改寫的文章**：過短內容（單段）對 AdSense 不利且易被判薄內容；需要大改寫者先回到 content production，不混入 rollout。
7. **優先選擇系統中狀態穩定、validate 已通過的文章**：`status:"ready"` + `draft:false` + `publishTargets.blogger.enabled:true` + `mode:"full"` + 該 post `validate:content` 觸發 0 warning。
8. **zero-drift 偏好**（沿用 am-12 expansion plan）：新 Blogger full post 為避免 settings drift（`category-site-mismatch` / `tag-site-mismatch` warning），實務上集中於既有 Blogger-valid 值（category `life-note`；tag `reading-notes` / `self-growth`）；若要跨領域（tech-note / book-review / 新 tag）須另開 settings phase，不為多樣性硬塞造成 warning。
9. **形態安全偏好**：Batch 2 仍優先最簡 life-note 形態（0 affiliate / 0 related-links / 純 body + hashtags），與已 5 次 live PASS 之形態一致；download / noindex / commerce-heavy 形態因含政策面，**暫不**納入 Batch 2，留待獨立 preanalysis。

---

## F. Batch 2 readiness checklist（每篇候選進入人工重貼前須確認）

> 全部為 repo-side read-only 確認（rebuild + dist 觀察 + frontmatter 檢視）；本 phase **不**執行，只列清單。

- [ ] **title / slug / excerpt / body 完整**：標題、slug、description / searchDescription、正文皆完整且為真實內容。
- [ ] **frontmatter 狀態合理**：`status:"ready"`、`draft:false`、`publishTargets.blogger.enabled:true`、`mode:"full"`、`github.enabled` 視內容而定；category / tags 皆為 Blogger-valid 值。
- [ ] **無 EJS leak**：generated dist HTML 無 `<%` / `%>` / `await include` / `>undefined<` / `>null<` / `="undefined"` / `="null"`。
- [ ] **無 broken markdown**：標題層級 / list / 連結語法正確，無未閉合語法。
- [ ] **無不應出現的測試內容**：無 `_test-` fixture 殘留、無 TODO / 佔位 / demo 文字。
- [ ] **commerce links（若存在）不得破壞現有規則**：若該 post 有 `affiliate.links[]` / `affiliate.blocks[]` / `ref`，須符合既有 commerce-ref 規則（C1–C9）、不洩 internalLabel、`uid1=blog` 逐字保留；若為最簡 life-note 形態則應 0 commerce。
- [ ] **AdSense slot 只沿用既有 `articleAd6` bottom slot policy，不新增 slot**：generated dist HTML 恰 1 個 `articleAd6` + 0 個 `articleAd1–5` + 0 個 legacy slot；`data-ad-client` / `data-ad-slot` 與 `ads.config.json` strict-equal；位置在正文之後、hashtags / related-links 之前。
- [ ] **Blogger manual repost 前後可人工比對**：repost 前有 generated dist HTML 之 read-only evidence（slot 數 / 位置 / leak 檢查）；repost 後有 live 前台 + DevTools 觀察（`ins.adsbygoogle` / `lab-ad-slot--articleAd6` / `data-ad-status` / loader script / 版面未破），兩者可對照。

---

## G. Suggested Batch 2 size

**保守建議：**

- **Batch 2 不建議大量**（不做 10–20 篇大批次、不做全量 rollout）。
- **建議 2–3 篇作為下一批**（小批次節奏，沿用 Batch 1 之保守做法）。
- **若 Batch 1 仍未穩定觀察，則先不執行 Batch 2，只完成候選分析**：目前 pm-8 已指出 Blogger VIEW count 增加屬未解釋之 weak signal、尚無 GA4 / Search Console 交叉佐證 → **建議先維持 monitoring，本 phase 只完成候選分析，不啟動任何 Batch 2 重貼**。

### G.1 候選池現況（誠實盤點，與 am-2 inventory 對齊並更新）

| 類別 | 文章 | 狀態 |
|---|---|---|
| Batch 0 locked | `we-media-myself2`、`github-pages-blog-planning` | 不再 repost（除非 source 結構性變更 + 獨立授權） |
| Batch 1 done（live PASS + guard-covered） | `daily-reading-habit-notes`、`reading-notes-three-questions`、`after-work-writing-time-blocking` | 已完成 |
| Deferred（政策 / 形態爭議） | `portable-blog-system-mvp`（summary + noindex-follow + download） | 須獨立 SEO / 政策 preanalysis；**不**列 Batch 2 |
| Draft（內容未完成） | `sample-book-review`、`draft-book-review`（book metadata 全空 + 佔位 body）、`phonics-practice-sheet-download`（download fileUrl 空 + noindex fallback） | 須回到 content production；**不**列 Batch 2 |

→ **關鍵結論：目前「已存在且立即 eligible」之 Batch 2 候選 = 0。** 所有 ready / full 既有文章皆已 Batch 0 / Batch 1 完成；deferred / draft 皆有 blocker。

### G.2 Batch 2 解鎖路徑（兩條，皆須 user 決定 + 後續獨立 phase）

- **路徑 A（推薦，最乾淨）**：新增 2–3 篇 low-risk full life-note post（沿用 am-12 expansion plan 候選軸，例如 `how-i-choose-what-to-read-next`、`phone-away-reading-time` 之類選書 / 閱讀習慣主題；皆 zero-drift、0 commerce、0 素材依賴）。每篇 = 獨立 single-new-file content phase（須 user approval）→ 驗證 → repost packet → manual repost → verification record → guard add。
- **路徑 B（含政策決策）**：解鎖 deferred / draft post（`portable-blog-system-mvp` 須先解 noindex + AdSense 政策爭議；book-review draft 須補完整書評 + book metadata + commerce ref；phonics 須補 download asset + noindex 決策）。effort 較高、含 Google 政策面，**不建議**作為 Batch 2 首選。

→ **本 phase 不執行任一路徑**；僅輸出候選分析。建議：先維持 monitoring（§I conservative），待觀察穩定 + user 決定批次節奏後，再以路徑 A 啟動 2–3 篇。

---

## H. Risk matrix

| 風險類別 | 描述 | 嚴重度 | 緩解 |
|---|---|---|---|
| **AdSense policy risk** | 為廣告硬塞內容 / 薄內容 / 政策敏感領域（醫療 / 金融 / 誤導）→ 版位被停或帳號風險 | 高 | §E 候選原則 1–6；只選完整可讀、長尾、非敏感內容；不為廣告拼湊；download / noindex / commerce-heavy 形態暫不納入 |
| **duplicate / repost risk** | 同一文章重複貼、或 Batch 0/1 已貼文章被再次貼 → 重複內容 / 重複 slot | 中 | Batch 0 lock 原則；每篇單獨 repost packet + verification record；generated dist HTML 確認恰 1 個 `articleAd6`、0 duplicate |
| **Blogger formatting risk** | Blogger 編輯器 / sanitizer strip AdSense attrs / script，或貼上後破版 | 中 | §F readiness checklist；repost 前後人工比對；DevTools 確認 `ins.adsbygoogle` / `data-ad-client` / `data-ad-slot` / loader 未被 strip；破版即 STOP |
| **crawler / view-count misread risk** | 把 Blogger VIEW count 增加誤判為真實流量 / AdSense 成效 → 做出錯誤的擴張決策 | 高（已實際發生 weak signal） | §C / 核心紅線；view count 僅記錄不據以決策；需 GA4 / Search Console / AdSense 後台交叉比對；未證實前不擴大發文 |
| **manual operation risk** | 人工重貼步驟出錯（貼錯來源 / 漏 metadata / 貼到錯文章 / 誤動後台設定） | 中 | 沿用 repost packet 15 步 SOP；唯一合法來源 = generated `dist-blogger/posts/<slug>/post.html`；明列不可用來源；每步可人工核對 |
| **content quality risk** | 為湊 Batch 2 數量而降低文章品質 / 半成品上架 → 可讀性低 + AdSense 政策風險 | 中 | §E 原則 3 / 6；draft / placeholder 一律不納入；新文須真實完整內容；寧可暫停也不硬湊 |

---

## I. Recommended next phases

- **Conservative（推薦預設）：continue monitoring only** — 維持 baseline 不動，沿用 pm-8 monitoring checklist 觀察 5 篇 live post；view count 變動僅記錄，不據以決策；不啟動 Batch 2 重貼。
- **Optional：Batch 2 candidate list（docs-only）** — `20260612-XX-blogger-adsense-batch-2-candidate-list-docs-only-a`：若 user 決定推進，先以路徑 A 列出 2–3 篇具體新文候選 + 主題 + frontmatter plan（docs-only；不發文）。
- **Optional：Batch 2 manual repost packet（docs-only）** — 待候選文章實際寫好並通過 generated-HTML 驗證後，再為每篇打包 repost packet（docs-only；不執行重貼）。
- **Optional：one additional low-risk 4th post plan** — `20260612-XX-blogger-content-<topic>-one-post-content-a`：補單篇 low-risk full post 之 content plan（single new file；須 user explicit approval）。
- **Not advised（同一 phase 內）：mass publish、template / source change、new AdSense slot、GA4 implementation** — 大批量發布、改 template / source、新增 slot、在同一 phase 內做 GA4 實作皆不建議；每項須各自獨立 phase + 明確授權。

---

## J. Explicit non-actions（本 session 明確未做）

- ❌ no source change（`src/` 全未動）
- ❌ no template / EJS / renderer change
- ❌ no content production post change（所有 post 一律只讀未動）
- ❌ no Blogger publish / repost / 登入後台 / 開編輯器 / 開 AdSense 後台
- ❌ no AdSense ID change / hardcode（real id 仍只存 `ads.config.json`）
- ❌ no GA4 implementation
- ❌ no deploy / no push gh-pages / no `.cache` mutation
- ❌ no npm install / no package / lockfile change
- ❌ no Batch 2 implementation（僅 planning）
- ❌ no 4th post authoring / repost
- ❌ no guard change（`check-blogger-adsense-output.js` 維持 5-target，未動）
- ❌ no CLAUDE.md compression / 無重排 / 無 unrelated 內容變動
- ❌ no `/memory`
- ❌ no unrelated cleanup
- ❌ **未把 Blogger VIEW count 增加判定為真實流量或 AdSense 成效**

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 pm-9（20260612）極小 ledger sync append。

read-only 量測（未造成 mutation）：`validate:content` 0/94/84。其餘 AdSense guard（`check:blogger-adsense-output` 71/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0）因 source / settings / dist 無變更而 carry forward。

---

## K. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks`（anchor key）、`ca-pub-…****`（masked）；**不含**完整 real AdSense client id / slot id。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
