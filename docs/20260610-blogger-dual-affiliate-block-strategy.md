# Blogger Dual Affiliate Block Strategy — Decision Record (repost DEFERRED)

> **Phase**: `20260610-pm-10-blogger-dual-affiliate-block-strategy-docs-only-a`
> **Mode**: **docs-only sync**。記錄使用者補充之 Blogger「上下雙聯盟區塊」刻意策略，並據此將 **actual Blogger repost 暫停（BLOCKED / DEFERRED）**。**不**貼 Blogger、**不**改 Blogger、**不** deploy、**不**改 content / source / registry / config、**不**混入 GA4 / reverse UTM。
> **Created**: 2026-06-10 +0800（15:52 起始）
> **Baseline**: main HEAD = origin/main = `31a7a14` / gh-pages HEAD = origin/gh-pages = `2acb5a5` / clean / normal 0/69/59 / overlay 0/72/60 / smoke 14/14 / GitHub Pages live acceptance = PASS / Blogger actual repost = NOT DONE。
> **Predecessor / 取代**：`docs/20260610-blogger-repost-commerce-affiliate-box-preflight.md`（pm-9 preflight）之「actual repost ready」結論 **被本 phase 暫停取代** —— repost gate 改為 **BLOCKED until 雙區塊策略系統化或使用者明確改變決策**。

---

## 1. 使用者補充之策略（authoritative record）

- **目標 Blogger 文章 URL（使用者確認）**：`https://babel-lab.blogspot.com/2026/05/we-media-myself2.html`
  （補上 pm-9 §3#1 之缺口；先前 frontmatter 無 `blogger.publishedUrl`、`relatedLinks` 指向 #1 文非本文。）
- **Blogger 現有文章「上方 + 下方」兩個聯盟區塊 = 刻意策略，不是錯誤。**
- **暫定通路分配**：上方原本規劃放「通路王」、下方原本規劃放「聯盟網」。
- **目前實況**：因**聯盟網尚未納入系統**，故 Blogger 現有文章**上下兩塊都先放通路王**。
- **上下區塊文案故意不同**：讓使用者感覺不太一樣；也增加版面曝光。
- **未來分析目的**：比較使用者比較會點**上方還是下方**（top vs bottom click 分析）。
- **整體時程**：BLOG 系統**第一階段完成後**，再整體調整**樣式 / 通路分配 / 追蹤策略**。

---

## 2. 為何 actual Blogger repost 必須 DEFERRED（關鍵決策）

- **現在不得執行 Blogger actual repost。**
- **不得**把目前系統產生之 **bottom-only** we-media HTML（`dist-blogger/posts/we-media-myself2/post.html`）直接貼到 Blogger。
- **理由**：這會**覆蓋** Blogger 現有「上方 + 下方」雙區塊暫定策略（bottom-only 輸出只有 1 個下方區塊 → 重貼會抹掉上方區塊與其差異文案）。

### 2.1 技術根因（現行 content model 無法表達雙區塊策略）

現行系統 affiliate model（`content/blogger/posts/*.md` frontmatter + `src/views/blogger/blogger-post-full.ejs`）：

- 單一 `affiliate.links[]` + `affiliate.position.{top, bottom}` 旗標 + 單一 `affiliate.disclosure`。
- top block 與 bottom block **渲染相同之 resolved `affiliateLinksRendered`** + **相同 `disclosure`**（兩 block markup 一致，差別僅 placement）。
- we-media 現狀 = `enabled:true` / `position.top:false` / `position.bottom:true` → **bottom-only，單一區塊**。

→ 現行 model **無法**表達：
- 上下**不同文案**（disclosure / 標題 / 連結說明各異）；
- 上下**不同通路 / link group**（上=通路王、下=聯盟網）；
- 上下**獨立 click tracking**（top vs bottom）。

故「dual-block with different content」須 **content model 變更**（新增 per-block 欄位），非單純貼現有輸出可達成。

---

## 3. Repost gate 狀態（更新）

| 項目 | 狀態 |
| --- | --- |
| GitHub Pages（bottom-only affiliate box）| ✅ LIVE，user-accepted PASS（pm-8）|
| Blogger actual repost | ⛔ **BLOCKED / DEFERRED**（until 雙區塊策略被系統化 **或** 使用者明確改變決策）|
| 暫停理由 | bottom-only 系統輸出會覆蓋 Blogger 現有「上+下」雙區塊刻意策略 |
| 解除條件 | 系統支援 top+bottom 雙區塊 + 上下不同文案 + 通路分配（含未來聯盟網）+（可選）top/bottom tracking；**且** user explicit approval |

---

## 4. 未來可能需要的 phase（**不自動啟動**；各須獨立 phase + explicit approval）

1. **Blogger dual-block content model preanalysis** —— 設計 frontmatter / EJS 如何表達 top + bottom 兩獨立區塊（per-block links / copy / network）。
2. **top/bottom affiliate copy fields** —— 新增上下各自文案欄位（標題 / disclosure / 連結說明）。
3. **top/bottom different network/link groups** —— 上方通路王 / 下方聯盟網（或其他 network 分配）；須先有「聯盟網」network 納入 registry / `affiliate-networks.json`。
4. **top vs bottom click tracking / GA4 / reverse UTM phase** —— 上下獨立點擊追蹤（**不得混入本 phase 或上述 content-model phase**；GA4 / reverse UTM 維持 dormant）。
5. **actual Blogger repost** —— **only after user approval**，且須前述 dual-block 支援落地後（含 user 確認文案 / 通路分配 / 備份 / theme CSS）。

> 上述 phase 之**順序 / 取捨由 user 決定**；本 record 不預先授權任何一項。

---

## 5. Mutation scope / 紅線（本 phase）

- ✅ 僅新增本 strategy docs file。
- ❌ 零 content / src / `site.config.json` / package / lockfile / registry / dist / dist-blogger / .cache / gh-pages / deploy branch / Blogger 變更。
- ❌ 未 deploy / 未貼 Blogger / 未改 affiliate model / 未動 GA4 / reverse UTM / KOBO excluded entry。
- ❌ **未改 we-media frontmatter**（`position.top` 維持 false / bottom-only 不動）—— 雙區塊支援屬未來 content-model phase，非本 docs-only record。

---

## 6. 現況狀態快照

| 項目 | 值 |
| --- | --- |
| main HEAD = origin/main | pre-phase baseline 為 `31a7a14`（見 §Baseline）；本 phase docs 落地為 commit `abf82af`；故落地後 main HEAD = origin/main = `abf82af`。|
| gh-pages HEAD = origin/gh-pages | `2acb5a5`（GitHub Pages LIVE，user-accepted PASS）|
| we-media Blogger 目標文章 URL | `https://babel-lab.blogspot.com/2026/05/we-media-myself2.html`（user 確認）|
| GitHub Pages affiliate box | bottom-only，live PASS |
| Blogger actual repost | ⛔ BLOCKED / DEFERRED（雙區塊策略）|
| 聯盟網 network | 尚未納入系統（registry / affiliate-networks.json 無）|
| custom domain | future phase |
| normal / overlay / smoke | 0/69/59 / 0/72/60 / 14/14 |

---

*（本文件結束 — Blogger dual affiliate block 刻意策略 record；actual Blogger repost **BLOCKED / DEFERRED** until 雙區塊系統化 + user approval；現行單一 links[]+position model 無法表達上下不同文案 / 通路 → 須 content-model phase；目標 Blogger URL = `https://babel-lab.blogspot.com/2026/05/we-media-myself2.html`；docs-only，無 Blogger / content / source / registry / config 變更；GA4 / reverse UTM 不混入。）*
