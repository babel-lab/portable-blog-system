# Blogger P3 `blog-restart-steady-rhythm-notes` — Review packet / landing preflight（docs-only）

> Phase: `20260617-am-blogger-p3-steady-rhythm-review-packet-docs-only-a`
> Date: 2026-06-17 12:xx+
> Type: docs-only 審稿包 + 落地前檢查（**不**寫入 content、**不** build、**不** deploy、**不** repost、**不**改 settings / source）。唯一 mutation = 本 doc + CLAUDE.md 極小 pointer sync。
> Scope: 內容線 A1 下一步。把既有 P3 草稿（`docs/20260612-blogger-p3-steady-rhythm-article-draft.md`）整理成可供 Dean 審稿與決策的 packet：proposal 摘要 + body review + landing readiness checklist + risk + approval gate。**本輪不落地**；落地須 Dean explicit approval 後另開 single-new-file content phase。

---

## 0. Baseline anchor

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `f20e127` |
| origin/main | `f20e127` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `docs(blog): map phase1 wrapup status` |

→ 完全符合 expected。未 pull / reset / checkout / merge / rebase。

---

## 1. P3 draft source

- **Draft source file**：`docs/20260612-blogger-p3-steady-rhythm-article-draft.md`（pm-28；2026-06-12 落地之 docs-only article draft）
- 該檔狀態：docs-only 草稿，**未**寫入 content；本 packet 為其審稿/落地前置，**不**改該檔。
- 參照 SOP：pm-10 candidate plan（`docs/20260612-blogger-batch2-new-low-risk-post-candidates.md` §E.3）；tone 參照已 live life-note `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md`（read-only）。

> ⚠️ **This is a proposal only, not written to content.** 本 packet 全文不建立 / 不修改任何 content 文章檔；下方 frontmatter 與 body 僅為 proposal，未寫入 `content/`。

---

## 2. Proposed article metadata（proposal only）

| 欄位 | 提案值 | 落地前查核 |
|---|---|---|
| proposed title | 個人部落格重啟筆記：先求穩定，再求流量 | — |
| tentative slug | `blog-restart-steady-rhythm-notes` | ✅ 無 content 檔 slug 衝突（已查 `content/`） |
| proposed id | `20260612-blog-restart-steady-rhythm-notes` | 註：id 前綴日期沿用草稿（2026-06-12）；落地時 Dean 可改為落地日 |
| site | `blogger` | — |
| contentKind | `life-note` | ✅ §11 列舉值合法 |
| primaryPlatform | `blogger` | — |
| category | `life-note` | ✅ 存在於 `content/settings/categories.json`（id+slug `life-note`） |
| tags | `self-growth`（single） | ✅ 存在於 `content/settings/tags.json`（id+slug `self-growth`）；草稿刻意單 tag，不硬塞 `reading-notes` |
| description | 隔了一段時間沒更新，這次重啟部落格我決定先不急著追什麼，而是先把穩定更新、穩定整理、穩定檢查的節奏建立起來。 | — |
| searchDescription | 個人部落格重啟筆記：與其一開始追流量、排程、變現，不如先把寫作與整理流程變簡單、建立願意穩定回來的節奏；先求穩定，再求流量。 | — |
| cover | `/images/placeholders/cover-placeholder.svg`（重用既有 placeholder） | ✅ 與 reference life-note 同；0 新 asset |
| commerce / affiliate | **none** | 0 commerce ref → 不觸發 commerce validator |
| download / assets | **none** | 0 新圖 / 0 下載檔 |
| AdSense | 既有 `articleAd6` bottom only（不新增 slot；不改 `ads.config.json`） | — |
| publishTargets | `github.enabled:false` / `blogger.enabled:true` + `mode:"full"` | 與 reference life-note 同形 |
| seo.indexing | 不設（indexable；不引入 noindex） | — |
| status / draft（落地時） | `status:"ready"` / `draft:false` | **本輪維持 docs 草稿，未落地** |

**Publish readiness（proposal 層級）**：metadata 完整、category/tag 皆 settings-valid、0 settings drift、0 commerce / 0 asset；frontmatter 可直接 mirror reference life-note 形態。→ proposal 已 ready；**唯缺 Dean 文字審稿 + approval**。

---

## 3. Body review（文章內容審視）

### 3.1 段落架構（草稿 §D，約 1,300 中文字）

| 段 | H2 標題 | 主旨 |
|---|---|---|
| 引言 | （無 H2） | 重啟部落格、怕熱度過了停擺；這次決定先顧「穩定」 |
| 1 | 一開始重啟部落格，很容易想一次做很多事 | 重啟易貪多（排版/年度主題/算發文時機）→ 耗光重啟力氣 |
| 2 | 後來發現，穩定比衝刺更重要 | 衝刺式連發撐不久；寧可慢而穩、不再整個停掉 |
| 3 | 先把寫作和整理流程變簡單 | 砍流程、降門檻，讓「繼續」變容易 |
| 4 | 不急著用數字判斷成敗 | 初期數字說明不了什麼；標準從「有多少人看」換成「我有沒有持續」 |
| 5 | 每篇文章都留下可以檢查的標準 | 自設簡單可檢查標準（標題清楚/正文寫完/留一句真心話） |
| 6 | 先讓自己願意回來，再慢慢把內容變好 | 先穩節奏/簡流程/清標準，再求內容更深；順序對了才走得遠 |

### 3.2 主要論點

- 重啟部落格的首要目標是**可持續的節奏**，不是開場氣勢或衝刺式發文。
- 把成敗判準從「流量 / view count」轉向「自己有沒有持續回來」。
- 透過簡化流程 + 自設可檢查標準，降低「繼續」的門檻。

### 3.3 語氣 / tone

- 個人觀察、務實、溫和、不誇大；第一人稱經驗敘述。
- **無**流量 / 收益 / 排名承諾；**無**「必賺 / 流量密碼 / 被動收入」式話術；結尾自然收束，無硬 CTA。
- 與 6 篇 live PASS 中 life-note 同型（最簡形態：純 body + hashtags）。

### 3.4 適合 BLOG（Blogger 內容站）的理由

- contentKind `life-note` 對齊 Blogger 內容站定位（CLAUDE.md §2.1：生活 / 經營筆記）。
- 純個人經營心得，0 敏感領域（無醫療 / 投資 / 政治 / 法律）；低風險。
- 形態最簡，落地後預期 0 validate 觸發、dist 恰 1 個 `articleAd6`，與既有 live post 行為一致。
- 主題本身反對把 view count 當 KPI，與本專案 §3a「VIEW count 為 weak signal」紅線一致。

---

## 4. Landing readiness checklist

| 檢查項 | 評估 | 說明 |
|---|---|---|
| content convention 符合 | ✅ 預期符合 | frontmatter 可 mirror `blog-as-personal-knowledge-base.md`；H1=標題、H2=段落；欄位齊全 |
| category / tag settings-valid | ✅ 已驗證 | `life-note` ∈ categories.json；`self-growth` ∈ tags.json；0 drift |
| slug 衝突 | ✅ 無 | `content/` 無同 slug 檔 |
| 是否增加 validate warning | 🟢 預期否 | 0 commerce / 0 download / 0 affiliate.blocks；production-post warnings 預期維持 0（**須落地後實跑 `validate:content` 確認，本輪不跑**） |
| image 特別處理 | 🟢 否 | 重用既有 cover placeholder；body 無需插圖；0 新 asset |
| affiliate 特別處理 | 🟢 否 | 0 commerce ref / 0 affiliate.links / 0 blocks |
| download 特別處理 | 🟢 否 | 非 download contentKind；0 fileUrl |
| AdSense 特別處理 | 🟢 否（沿用既有） | 僅既有 `articleAd6` bottom，在 hashtags 前自然 fire；**不**新增 slot、**不**改 `ads.config.json` |
| 是否需要 Blogger repost | ⏸ 是（落地後另階段） | 落地 + generated-HTML 驗證後，repost 須另開 execution phase（user approval + 備份 + theme CSS readiness）；**本輪不做** |
| 是否需要 GA4 / custom dimension 延伸 | 🟢 否 | 無新互動型態（0 affiliate / 0 related-links）；沿用既有 GA4 P1；無新 dimension 需求 |

→ 結論：**內容線層級 ready**；唯一阻擋為 Dean 文字審稿 + approval。落地動作（寫檔 + validate + build）屬下一階段。

---

## 5. Risk assessment

**Overall risk：low。**

- content risk：低（純個人經營心得；0 敏感領域；無流量·收益·排名承諾；不把 view count 當 KPI）。
- system risk：低（0 settings drift / 0 新 asset / 0 commerce / 0 新 slot；frontmatter mirror 既有 live life-note）。
- 唯一 medium 殘留風險點 = **落地後實際 `validate:content` 尚未跑**（本輪 docs-only 不跑）；但形態最簡，預期 0 觸發。Blogger repost 屬另階段，本輪不評估其執行風險。

---

## 6. Dean approval gate

**未經 Dean explicit approval，不得 content landing。**

需要 Dean 確認的項目：

1. **文字審稿**：草稿 §D 全文（特別是「不承諾流量·收益·排名、不把 view count 當 KPI」是否到位；語氣是否符合 Dean 個人風格）。
2. **是否加入個人經驗**：草稿 §E.3 列出 4 處可替換為 Dean 真實經驗的句子（待辦清單 / 最小節奏 / 自檢標準等）—— Dean 決定是否要先改稿再落地。
3. **metadata 定案**：title / slug / id 日期前綴（沿用 2026-06-12 或改落地日）/ 單 tag `self-growth` 是否足夠。
4. **落地授權**：明確同意「另開 single-new-file content phase 寫入 `content/blogger/posts/`」。

→ 本輪 packet **不**代表 approval；Claude **不**自行落地。

---

## 7. Recommended next phase（若 Dean 同意落地）

- **Phase name 建議**：`20260617-XX-blogger-content-blog-restart-steady-rhythm-notes-one-post-content-a`
- **Scope**：
  - 唯一 mutation = 新增 single file `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md`（採 §2 frontmatter + §3 草稿 body；含 Dean 審稿修訂）。
  - 落地後跑 `validate:content`（須允許，因屬 acceptance）確認 0 production warning 增量。
  - **不** build / **不** deploy / **不** repost（各另階段）。
- **替代（若 Dean 要先改稿）**：`20260617-XX-blogger-p3-steady-rhythm-article-draft-revise-docs-only-a`（docs-only 修訂草稿，仍不落地）。
- **落地後續鏈**（各獨立 phase + approval）：content landing → build:blogger generated-HTML 驗證 → Blogger repost packet（docs-only）→ 手動重貼 execution。

---

## 8. Non-actions（本 phase 明確不做）

- ❌ 不把 P3 寫入 `content/`；不建立 / 修改任何文章檔
- ❌ 不改 `src/` / `views/` / `scripts/` / `content/` / `settings/`（含 categories / tags / ads.config）/ `package.json` / lockfile / `dist*` / `gh-pages` / `.cache/`
- ❌ 不 build / 不 build:blogger / 不 deploy / 不 push gh-pages / 不跑會產 dist·cache 的 scripts
- ❌ 不 Blogger repost / 不開 Blogger 後台 / 不開 AdSense 後台 / 不改 GA4
- ❌ 不改 AdSense / commerce / GA4 / Admin source
- ❌ 不 npm install
- ❌ 不重跑 validate / check guards（baseline carry-forward；未碰 source/settings）
- ❌ 不 merge / rebase / reset / amend / force push
- ❌ 不壓縮 / 重排 CLAUDE.md（僅極小 pointer sync）
- ❌ 不自行落地 P3、不自行開下一個 phase

---

## 9. Acceptance（本 phase 自身）

| 項目 | 結果 |
| --- | --- |
| baseline verify | ✅ `main` / `f20e127` / 0/0 / clean |
| 唯一 file change | `docs/20260617-blogger-p3-steady-rhythm-review-packet.md`（新增）+ CLAUDE.md 極小 pointer sync |
| 未寫入 content / 未改文章檔 | ✅ |
| 未碰 src / views / scripts / settings / package / dist / gh-pages / `.cache` | ✅ |
| 未 build / deploy / repost / npm install | ✅ |
| 未自行落地 P3 / 未自行開下一 phase | ✅ |

→ docs-only packet，read-only acceptance trivially PASS。

---

（本文件結束）
