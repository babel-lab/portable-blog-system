# Blogger P3 `blog-restart-steady-rhythm-notes` — Generated HTML verification record（docs-only）

> Phase: `20260617-am-blogger-p3-generated-html-verification-record-docs-only-a`
> Date: 2026-06-17
> Type: docs-only verification record（**不** build / **不** deploy / **不** Blogger repost / **不**改 source·settings·content）。唯一 mutation = 本 doc + CLAUDE.md 極小 pointer sync。
> Scope: 把前一 phase（`20260617-am-blogger-p3-steady-rhythm-generated-html-verification-a`）對 P3 generated Blogger HTML 的驗證結果寫成 repo 內記錄。本 record **不重跑** build / check；數值為前一 phase 實測 carry-forward。

> ⚠️ 本文件**不含** real AdSense client / slot id；一律以 slot key `articleAd6` / anchor key `beforeRelatedLinks` 表述。real id 僅存於 `content/settings/ads.config.json`。

---

## 0. Baseline anchor

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `57d9491` |
| origin/main | `57d9491` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `content(blogger): land steady rhythm restart note` |

→ 完全符合 expected。未 pull / reset / checkout / merge / rebase。

---

## 1. Verified target

| 類別 | 路徑 |
|---|---|
| source content post | `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md`（landed @ `57d9491`） |
| generated Blogger HTML | `dist-blogger/posts/blog-restart-steady-rhythm-notes/post.html`（full mode；gitignored generated output） |
| generated sidecar | 同目錄 `meta.json` / `copy-helper.txt` / `publish-checklist.txt`（gitignored） |

P3 lifecycle 至此：草稿 → 審稿包 → Dean approval → content landing（`57d9491`）→ **generated Blogger HTML 驗證 PASS（本 record）**。

---

## 2. Commands observed in previous verification phase

> 以下為前一 phase（`...generated-html-verification-a`）實測結果之 carry-forward；本 record 未重跑。

| 指令 / 檢查 | 結果 |
|---|---|
| `npm run build:blogger` | 0 error；產出 P3 `post.html`（full）+ meta/copy-helper/publish-checklist；done in ~133ms |
| `npm run check:blogger-adsense-output` | **85 passed / 0 failed**（6 live targets no-regression；P3 非 guard target） |
| EJS leak grep（`<%` / `%>` / `<%-` / `<%=`）on P3 post.html | **0 命中** |
| `articleAd6` slot grep on P3 post.html | **1**（恰一次） |
| `articleAd1–5` slot grep on P3 post.html | **0**（未 render） |
| socialFollow / sidebar markers：P3 vs reference life-note | P3=0 / reference=0（一致） |
| hashtags block grep：P3 vs reference | P3=1 / reference=1（一致） |
| `git status --short` | clean（generated output 經 `git check-ignore` 確認 gitignored） |

reference 對照檔 = `dist-blogger/posts/blog-as-personal-knowledge-base/post.html`（已驗收 live 同型 life-note）。

---

## 3. P3 output verification summary

### 3.1 Metadata / header

| 欄位 | 觀察值 | 結果 |
|---|---|---|
| title | 個人部落格重啟筆記：先求穩定，再求流量 | ✅（`lab-article__title` + JSON-LD headline + meta.json title 一致） |
| slug | `blog-restart-steady-rhythm-notes` | ✅ |
| category | `life-note`（`lab-article__category`；JSON-LD articleSection「生活文章」） | ✅ |
| author | Dean | ✅ |
| date / updated | 2026-06-12 / 2026-06-12 | ✅ |
| description | 隔了一段時間沒更新…穩定檢查的節奏建立起來。 | ✅ |

### 3.2 Body paragraph structure

- 引言段（無 H1；title 由 frontmatter / header 提供，body 以引言開頭，與 reference life-note 同型）+ 6 個 H2：
  1. 一開始重啟部落格，很容易想一次做很多事
  2. 後來發現，穩定比衝刺更重要
  3. 先把寫作和整理流程變簡單
  4. 不急著用數字判斷成敗
  5. 每篇文章都留下可以檢查的標準
  6. 先讓自己願意回來，再慢慢把內容變好
- 全段落存在於 `lab-article__body`；段落完整、無截斷。✅

### 3.3 Hashtags block

- `lab-hashtags` 存在，含 `#self-growth`（單一 tag，對齊 frontmatter `tags: [self-growth]`）。✅

### 3.4 JSON-LD / meta.json / canonical

- JSON-LD `BlogPosting`：`@id` / headline / description / datePublished / dateModified / author / inLanguage `zh-Hant` / `isPartOf` Blog / image 皆正確。✅
- `meta.json`：id / slug / title / type=life-note / category / tags / blocks（對齊 frontmatter）/ `affiliate`=null / `download`=null / `book`=null / bloggerMode=full / rendered=full。✅
- canonical：`raw:"auto"` → resolved 指向 GitHub Pages（cross-platform；blogger→github UTM：`utm_source=blogger` / `utm_medium=internal_referral` / `utm_campaign=blogger_to_github`）；warning=null。✅

---

## 4. AdSense summary

- `articleAd6` slot 在 P3 generated HTML 中**恰出現一次**。
- 位置：文章 body 之後、hashtags 之前（anchor key `beforeRelatedLinks`），與 6 篇 live Blogger AdSense post + reference life-note 規則一致。
- `articleAd1–5` **未 render**（pages-only；Blogger full 輸出不展開）。
- **不於本 docs 暴露 real id**：real AdSense client / slot id 僅存於 `content/settings/ads.config.json`，僅出現在 gitignored generated output；本 record 以 slot key `articleAd6` 表述。
- guard `check:blogger-adsense-output` 85/0：既有 6 live targets 無 regression（P3 自身非 guard target，故 guard 不直接涵蓋 P3；P3 驗證以上方直接 grep / 對照 reference 為據）。

---

## 5. Non-actions（本 phase 明確不做）

- ❌ no deploy / no push gh-pages
- ❌ no Blogger repost / 不開 Blogger 後台 / 不開 AdSense 後台
- ❌ no source / settings / content change（含 P3 文章、Blogger templates、AdSense / GA4 / commerce / Admin source）
- ❌ no generated output committed（`dist-blogger/*` gitignored；未 commit）
- ❌ no rebuild（未重跑 build:blogger / validate:content / check guards；數值 carry-forward）
- ❌ no npm install / no merge / rebase / reset / amend / force push
- ❌ no CLAUDE.md 壓縮 / 重排（僅極小 pointer sync）
- ❌ 不自行開下一個 phase
- ❌ 不把 Blogger VIEW count 詮釋為真實流量 / impression / earning / policy approval

---

## 6. Remaining next steps（不自行啟動）

- **建議下一 phase**：`20260617-XX-blogger-p3-steady-rhythm-repost-packet-docs-only-a`
  - docs-only repost packet：列 published URL 待回填 / 文章備份 / theme CSS readiness / 驗收項 checklist。
  - **但 repost execution 仍需 Dean explicit approval + backup**：實際 Blogger 重貼一律另開獨立 execution phase（user approval + 文章備份 + theme CSS 確認），本 record 與 packet 皆**不**執行重貼。
- 其他候選（per `docs/20260617-blog-phase1-wrapup-status-map.md`）維持原狀，皆須獨立 phase + approval。

---

## 7. Acceptance（本 phase 自身）

| 項目 | 結果 |
| --- | --- |
| baseline verify | ✅ `main` / `57d9491` / 0/0 / clean |
| 唯一 file change | `docs/20260617-blogger-p3-generated-html-verification-record.md`（新增）+ CLAUDE.md 極小 pointer sync |
| 未 build / deploy / repost / npm install | ✅ |
| 未改 source / settings / content / P3 文章 | ✅ |
| 未 commit generated output | ✅ |
| 未暴露 real AdSense id | ✅（僅 slot key `articleAd6`） |
| 未自行開下一 phase | ✅ |

→ docs-only record，read-only acceptance trivially PASS。

---

（本文件結束）
