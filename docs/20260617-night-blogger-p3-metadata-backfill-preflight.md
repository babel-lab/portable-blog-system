# Blogger P3 `blog-restart-steady-rhythm-notes` — Metadata backfill preflight（docs-only）

> Phase: `20260617-night-blogger-p3-metadata-backfill-preflight-docs-only-a`
> Date: 2026-06-17（Asia/Taipei；night, 22:59+）
> Type: **docs-only preflight / evidence intake plan**（唯一 mutation = 本 doc 新增；不改 content / source / settings / views / scripts / package.json / lockfile / CLAUDE.md / MEMORY.md）
> Scope: P3 已 live verified（per `docs/20260617-blogger-p3-steady-rhythm-live-verification-record.md`）。本 doc 釐清「下一輪若要做 metadata backfill」需要的欄位、目前 evidence 矩陣、缺項、安全回填路徑與 explicit no-touch 約束。
>
> **Verdict: BACKFILL PENDING — awaiting Dean Blogger backend evidence**。本 phase **不**回填、**不**建立 `.publish.json`、**不**改 frontmatter。

---

## 0. Baseline

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `746ed71b26c6fe0d9dbe6bd408b3089562bfae41`（short `746ed71`） |
| origin/main | `746ed71b26c6fe0d9dbe6bd408b3089562bfae41` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean（`git status --short` 為空） |
| latest subject | `docs(project): checkpoint current build status` |

→ 與 phase prompt §A 預期一致。未 pull / merge / reset / rebase / amend / force-push。

`npm run validate:content` 本輪一次：`0 error / 94 warning / 84 issue-posts`，與 CLAUDE.md §3a baseline carry-forward 一致；production-post warnings = 0（全部 94 warnings 來自 `content/validation-fixtures/`）。

---

## 1. P3 current closed chain summary

| # | 階段 | 證據 commit / artifact | 狀態 |
|---|---|---|---|
| C1 | content landing | `57d9491` `content(blogger): land steady rhythm restart note` → `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md`（life-note / category `life-note` / tag `self-growth`；validate 0 觸發） | ✅ landed |
| C2 | generated HTML verification | `c105880` + `docs/20260617-blogger-p3-generated-html-verification-record.md`（articleAd6×1；0 EJS leak；guard `check:blogger-adsense-output` 85/0 no-regression；output gitignored） | ✅ PASS |
| C3 | repost packet（docs-only） | `fb623fa` + `docs/20260617-blogger-p3-steady-rhythm-repost-packet.md`（手動重貼步驟 / 備份 / theme CSS readiness / insertion-vs-fill / execution gate） | ✅ docs-only |
| C4 | Dean 手動 Blogger 發布（全新文章；非覆蓋既有） | live URL `https://babel-lab.blogspot.com/2026/06/blog-restart-steady-rhythm-notes.html`；publishedAt approx 2026-06-17 12:14 台灣時間（Dean 截圖佐證） | ✅ Dean-evidence |
| C5 | live verification record | `docs/20260617-blogger-p3-steady-rhythm-live-verification-record.md`（user-evidence-based；live page opens / title / body / `#self-growth` / articleAd6 在 body 後 hashtags 前 + 本次有可見 ad fill / 無明顯 EJS leak） | ✅ PASS |
| C6 | checkpoint snapshot | `746ed71` `docs(project): checkpoint current build status` + `docs/20260617-night-project-status-and-next-paths-checkpoint.md`（§4.2 B-live-3 ~ B-live-6 全 ✅；§5.1 P-1 列為待 Dean evidence） | ✅ snapshot |

→ P3 chain 已至 **live verified**；剩餘缺口 = Blogger backend evidence-driven metadata backfill（本 doc 為其 preflight）。

---

## 2. Existing metadata observed in source markdown

P3 source：`content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md`（read-only inspect，未修改）。

### 2.1 對應 publish bundle 檢查

| 項目 | 觀察 |
|---|---|
| 對應 `.publish.json` sidecar 是否存在 | ❌ **不存在**（Glob `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.*` 僅回傳 `.md`） |
| 既有 `blogger.*` frontmatter 區塊 | ❌ **不存在**（frontmatter 無 `blogger:` 區塊） |
| `publishTargets.blogger` 區塊 | ✅ `{ enabled: true, mode: "full" }`（屬發布策略，不是發布結果） |

### 2.2 P3 frontmatter 中與 Blogger 平台相關之欄位（截至 HEAD `746ed71`，未修改）

| frontmatter key | 值 | 備註 |
|---|---|---|
| `id` | `20260612-blog-restart-steady-rhythm-notes` | — |
| `site` | `blogger` | — |
| `contentKind` | `life-note` | 內容型態（per CLAUDE.md §11） |
| `primaryPlatform` | `blogger` | — |
| `slug` | `blog-restart-steady-rhythm-notes` | 與 live URL 末段一致 |
| `date` | `2026-06-12` | 撰寫日期；**非** Blogger 發布日 |
| `updated` | `2026-06-12` | — |
| `status` | `ready` | content side 狀態；**非** `blogger.status` |
| `draft` | `false` | — |
| `canonical` | `auto` | — |
| `publishTargets.blogger` | `{ enabled: true, mode: "full" }` | 策略；非結果 |
| `publishTargets.github` | `{ enabled: false, mode: "full" }` | — |

### 2.3 重要觀察

- `date: "2026-06-12"` 為作者撰寫日期，**不可**用來推導 `blogger.publishedAt` / `blogger.publishYear` / `blogger.publishMonth`（per `docs/publish-json-schema.md` §5.4：「不得由 `.md` frontmatter `date` 欄位推導 `publishYear` / `publishMonth`」）。
- 本篇實際 Blogger 發布月份為 2026-06（per live URL `/2026/06/...html`），與 `date` 的 2026-06 同月份**屬巧合**，不可作為日後 backfill 之自動推導依據。
- `status: "ready"` 與 `blogger.status` 為**獨立兩維度**：content 側 status 描述「source 是否可進 build」；`blogger.status` 描述「Blogger 平台之發布狀態」。回填 backfill 不會也不應改動 frontmatter `status`。

---

## 3. Required metadata for future backfill

Per CLAUDE.md §24 + `docs/publish-json-schema.md` §5（`blogger` 區塊 schema），P3 backfill 應落於**新建** sidecar `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.publish.json`（**不**在 `.md` frontmatter 內塞 `blogger.*` 區塊；該欄位 family 屬 `.publish.json`）。

預期 sidecar 結構（**僅為下一輪實作藍圖；本 phase 不建立檔案**）：

```jsonc
{
  "schemaVersion": 1,
  "canonical": {
    "url": "",
    "source": "auto"
  },
  "ogImage": {
    "url": "",
    "alt": ""
  },
  "blogger": {
    "type": "post",
    "permalink": "blog-restart-steady-rhythm-notes",
    "status": "published",
    "publishedUrl": "https://babel-lab.blogspot.com/2026/06/blog-restart-steady-rhythm-notes.html",
    "publishedAt": "<待 Dean 提供 precise ISO 8601 timestamp>",
    "bloggerPostId": "<待 Dean 提供>",
    "publishYear": "<由 publishedAt 推導>",
    "publishMonth": "<由 publishedAt 推導>",
    "history": []
  },
  "github": {
    "slug": "",
    "path": "",
    "status": "draft",
    "publishedUrl": "",
    "publishedAt": ""
  },
  "seo": {
    "metaTitle": "",
    "metaDescription": "",
    "robots": "index,follow"
  }
}
```

說明：

- `blogger.permalink` = `"blog-restart-steady-rhythm-notes"`：對應 live URL 末段，**不**含 `.html` 副檔名（per §5 範例：`permalink: "we-media-myself2"`）。
- `blogger.publishedUrl`：由 live verification record §2 已確認，可直接安全寫入。屬「可從 Dean 已提供 evidence 取得」一類。
- `blogger.publishedAt`：必須為 precise ISO 8601 timestamp（含時區）。目前僅有 approx `2026-06-17 ~12:14 台灣時間`，**不足以填**（須補成 `2026-06-17T12:14:00+08:00` 或 Dean 後台精準時間）。
- `blogger.bloggerPostId`：Blogger 後台之數字 ID。**唯一**來源 = Blogger 後台。
- `blogger.publishYear` / `blogger.publishMonth`：per §5.4，**僅可由 `publishedAt` 推導**；若 `publishedAt` 留空字串，這兩個亦留空字串。**不得**由 live URL `/2026/06/` 反向推算（per §5.4：「不得由 `permalink` 反向推算月份」之同類原則）。
- `blogger.type` = `"post"`：本篇於 Blogger 為文章管理區（**非** Page）；live URL 走 §5.3.1 yyyy/mm pattern 已驗證。
- `blogger.status` = `"published"`：對應 Blogger 平台已上線；對應 §10 列舉值。
- `canonical.url` / `canonical.source`：本篇 `primaryPlatform: "blogger"` + `publishTargets.github.enabled: false`；後續可考慮設 `source: "blogger"`，惟非必須 —— 留 `"auto"` 即可。**本 preflight 不做 canonical 決策**，留待 backfill 階段。
- `ogImage` / `seo`：留空字串並讓 build 端 fallback 至 frontmatter `cover` / `coverAlt`（per §4.3）。**本 preflight 不做 SEO 決策**。

---

## 4. Evidence matrix

| Field | Current value | Required evidence | Can infer from live URL? | Can infer from current frontmatter? | Risk if guessed | Future action |
|---|---|---|---|---|---|---|
| `blogger.permalink` | not set | live URL 末段 | ✅ `blog-restart-steady-rhythm-notes` | ✅ 等於 frontmatter `slug` | low；兩源一致 | 可安全寫入 |
| `blogger.publishedUrl` | not set | Dean evidence + live URL | ✅ 已確認 `https://babel-lab.blogspot.com/2026/06/blog-restart-steady-rhythm-notes.html` | ❌ | low | 可安全寫入 |
| `blogger.publishedAt` | not set | **Blogger 後台「發布時間」精確 timestamp**（含時區） | ❌ live URL 只有 `/2026/06/`，**不**含日 / 時 / 分 / 秒 / 時區 | ❌ frontmatter `date` 為撰寫日，非發布日 | **high**（破壞 §5.4 推導規則之唯一真相） | **等 Dean 提供**；不可由 live URL 推導；不可由 `date` 推導；不可由 live verification approx `~12:14` 推導 |
| `blogger.bloggerPostId` | not set | **Blogger 後台之 post id**（通常為長數字字串，或 edit URL `postID=...` 之查詢字串） | ❌ live URL 不含 post id | ❌ | **high**（猜測會錯） | **等 Dean 提供**；可由 Blogger 後台「編輯」頁面 URL 或 API 取得 |
| `blogger.publishYear` | not set | 由 `publishedAt` 推導 | ❌ live URL `/2026/` 不算合法推導來源（per §5.4） | ❌ | **high**（違反 §5.4） | publishedAt 補齊後同時推導；不獨立填 |
| `blogger.publishMonth` | not set | 由 `publishedAt` 推導 | ❌ 同上 | ❌ | **high**（違反 §5.4） | 同上 |
| `blogger.type` | not set | live URL pattern 屬 §5.3.1 yyyy/mm | ✅ `post` | ❌ | low（schema default `post`） | 可安全寫入 `"post"` |
| `blogger.status` | not set | Dean 確認 live 上線 | ✅（已 live verified） | ❌ | low | 可安全寫入 `"published"` |
| `blogger.history` | not set | 不適用（首次發布；非搬家） | ❌ | ❌ | low | 留空陣列 `[]` |
| `canonical.url` | not set（sidecar 不存在） | 視 canonical 決策 | — | — | low | 留 `""`；`canonical.source` 留 `"auto"` |
| `canonical.source` | not set | — | — | — | low | `"auto"`（可日後改 `"blogger"`） |
| `ogImage.url` / `alt` | not set | — | — | — | low | 留 `""`；fallback 至 frontmatter `cover` / `coverAlt` |
| `seo.metaTitle` / `metaDescription` | not set | — | — | — | low | 留 `""`；fallback 至 frontmatter |
| `seo.robots` | not set | — | — | — | low | 預設 `"index,follow"`（per `_sample.publish.json`） |
| `github.*` | not set | 不適用（`publishTargets.github.enabled: false`） | — | — | low | 全留預設空字串 + `status: "draft"` |

### 4.1 不可猜測 / 不可由 live URL 推導之欄位（紅線）

下列欄位**禁止本輪或任何後續 phase**以推測 / 自動推導方式回填，必須等 Dean 從 Blogger 後台明確提供：

1. `blogger.publishedAt` — 必須 precise ISO 8601；live verification 之 approx `~12:14` 為截圖目測，不可作為 timestamp source of truth。
2. `blogger.bloggerPostId` — Blogger 後台唯一來源；無 Blogger API 帳號 / Search Console / Dashboard evidence 不得猜測。
3. `blogger.publishYear` / `blogger.publishMonth` — 必須**僅**由 publishedAt 推導；單獨從 live URL `/2026/06/` 取值會違反 §5.4 之 source-of-truth 原則。

### 4.2 可從現有 evidence 直接安全寫入之欄位

下列欄位即使在 Dean 補 publishedAt / bloggerPostId 之前，亦已具足夠 evidence：

1. `blogger.type` = `"post"`（live URL pattern 已驗證；schema default）
2. `blogger.permalink` = `"blog-restart-steady-rhythm-notes"`（與 frontmatter `slug` 一致；與 live URL 末段一致）
3. `blogger.publishedUrl` = `"https://babel-lab.blogspot.com/2026/06/blog-restart-steady-rhythm-notes.html"`（live verification record §2 已確認）
4. `blogger.status` = `"published"`（live verified）

惟即使這 4 項可寫，**本 phase 仍不寫**，理由：

- 為避免「部分 backfill / 部分 pending」造成 sidecar 狀態斷裂；
- 為使下一輪 content-edit-only phase 能一次以「lab 一致」之 sidecar 落地，便於 review；
- 為符合 §6 之 future edit plan 之「一次性 sidecar 建立」策略。

---

## 5. Proposed future content-edit-only phase

### 5.1 啟動條件（gate）

下一輪 P3 metadata backfill phase 啟動，**必須**同時滿足：

1. Dean 從 Blogger 後台明確提供 `bloggerPostId`（數字字串），來源建議為 Blogger Dashboard 後台「文章編輯」頁之 URL 查詢字串 `postID=...`。
2. Dean 從 Blogger 後台提供 precise `publishedAt`（ISO 8601；建議格式 `2026-06-17THH:MM:SSZ` 或 `2026-06-17THH:MM:SS+08:00`）。
3. Dean explicit approval 啟動該 phase。
4. baseline verify 通過（branch / HEAD / clean / ahead-behind / latest subject）。

未同時滿足 → **不啟動**；preflight 維持 PENDING。

### 5.2 該 phase 之 scope（draft；下一輪可微調）

- 新增檔案：`content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.publish.json`（依 §3 結構，但 `publishedAt` / `bloggerPostId` 由 Dean evidence 填，`publishYear` / `publishMonth` 由 `publishedAt` 推導）。
- 不改 `.md` frontmatter（含 `status` / `date` / `updated` 一律不動）。
- 不改 `content/settings/` / `src/` / `views/` / `scripts/`。
- 不 build / 不 deploy / 不 Blogger repost / 不 Admin Apply / 不 admin-write-cli。
- 不啟動 dev server。
- 唯一 mutation = 該 sidecar JSON 新增。

### 5.3 該 phase 須跑之 validation（read-only）

- `npm run validate:content`：須維持 0 errors / 94 warnings / 84 issue-posts（與 CLAUDE.md §3a baseline 一致；新 sidecar 不得引入 production-post warning）。
- 其他 guard 不重跑（carry-forward）。

### 5.4 該 phase 之 acceptance（draft）

| 項目 | 預期 |
|---|---|
| baseline verify | clean / ahead-behind 0/0 / HEAD == origin/main |
| sidecar JSON 合法 | UTF-8 / LF / 合法 JSON / 無 `$comment` / 無 trailing comma / 無註解 |
| sidecar 9 欄位填寫正確 | `type` / `permalink` / `status` / `publishedUrl` / `publishedAt` / `bloggerPostId` / `publishYear` / `publishMonth` / `history` 全符合 §3 + §4 規則 |
| validate:content | 0 / 94 / 84 carry-forward |
| 未改 `.md` frontmatter | git diff 無 `.md` 變動 |
| 未改 settings / views / scripts | 同上 |
| 未 build / deploy / repost / 啟動 dev server | 同上 |

### 5.5 該 phase 須避免之動作

- ❌ 不在 `.md` frontmatter 中塞 `blogger:` 區塊（屬 `.publish.json` 領域）。
- ❌ 不從 `frontmatter.date` / live URL `/2026/06/` / live verification approx `~12:14` 推導 `publishedAt` / `publishYear` / `publishMonth`。
- ❌ 不啟用 build / build:blogger / build:github / build:promotion / build:sitemap / deploy / preview。
- ❌ 不 Blogger repost / 不登入 Blogger / 不動 GA4 / AdSense / Google Drive / Search Console。
- ❌ 不啟動 Admin Apply / middleware / admin-write-cli / `safe-write:test` / `--apply` / `dryRun:false`。
- ❌ 不產生 payload files / 不產 dist / 不動 gh-pages / 不動 `.cache`。
- ❌ 不 amend / rebase / reset / merge / cherry-pick / force-push / `--no-verify` / `--no-gpg-sign`。
- ❌ 不 npm install / 不動 `package.json` / lockfile。
- ❌ 不改 CLAUDE.md / MEMORY.md / `memory/` / docs README（除極小 pointer sync）。

---

## 6. Explicit no-touch list（本 phase）

本 phase **未**：

- 動 `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md` frontmatter / body
- 建立任何 `.publish.json`（含 P3 對應 sidecar；含其他 post sidecar）
- 動 `content/settings/` / `content/templates/` / `content/validation-fixtures/`
- 動 `src/` / `views/` / `scripts/` / `public/` / `dist*` / `gh-pages` / `.cache`
- 改 `package.json` / lockfile / `vite.config.js`
- 改 CLAUDE.md / MEMORY.md / `memory/` / `docs/README.md`
- 啟動 dev server / build / build:github / build:blogger / build:promotion / build:sitemap / deploy / preview / Blogger repost
- 啟用 Admin Apply / middleware / API / POST endpoint
- 執行 `admin-write-cli` / `safe-write:test` / `admin:write` / production dry-run / 任何 admin write
- 加 `--apply` / `dryRun:false` / `dryRun: false`
- 產生 payload files / 第三次 write
- amend / rebase / merge / reset / cherry-pick / force-push / `git push --force` / `--no-verify`
- npm install / 動 dependency
- 動 Blogger / GA4 / AdSense / Google Drive / Search Console / GitHub Pages 後台
- 動 Phase 1 final 宣告之降級或重新封存
- 把巨型 ledger 又寫回 CLAUDE.md（per §3a discipline）

唯一執行：baseline git read（7 commands）+ `npm run validate:content` read-only + 只讀 inspect P3 source markdown / 既有 docs / `_sample.publish.json` / `publish-json-schema.md` + 本檔新增。

---

## 7. Recommendation for Dean

要啟動下一輪 P3 metadata backfill phase，請從 Blogger 後台提供下列 evidence 之**全部**：

1. **`bloggerPostId`**：登入 Blogger Dashboard → 進入「文章」管理區 → 點開本篇「個人部落格重啟筆記：先求穩定，再求流量」之**編輯**頁；瀏覽器網址列會出現類似：

   ```
   https://www.blogger.com/blog/post/edit/<blogId>/<postId>
   ```

   其中 `<postId>` 為長數字字串（通常 19 位），即為 `blogger.bloggerPostId`。截圖或文字貼出皆可。

2. **`publishedAt`**：Blogger 編輯頁右側欄之「發布日期」/ 後台 API（若有）/ 或 Blogger 文章管理列表之「發布時間」；建議格式為：

   ```
   2026-06-17T12:14:00+08:00
   ```

   （若秒數不確定可填 `:00`；時區為 `+08:00`）。**不**接受「approx 12:14 PM」之非 precise 字串；必須是可被 ISO 8601 parser 接受之字串。

3. （Optional）Blogger 編輯頁 URL 截圖、或後台「發布時間」欄位截圖，作為 evidence retention。

**未同時提供 1 + 2 前**，不會啟動 backfill phase；本 phase verdict 維持 `BACKFILL PENDING`。

**請勿**：

- 在無 Blogger 後台 evidence 之情況下口頭授權「就用 `2026-06-17` 隨便填一個時間」——這會違反 §4.1 / §5.4 之 source-of-truth 原則，後續無法回溯。
- 在 Blogger 後台改動本篇文章（重發、刪除、改 permalink、改發布時間）——會使本 doc §4 之 evidence 失效。若 Dean 確有改動需求，請另開獨立 phase 重新做 live verification + preflight。

---

## 8. Verdict

**`BACKFILL PENDING — awaiting Dean Blogger backend evidence`**

- ✅ P3 chain 至 live verified；剩餘 backfill 為 evidence-driven、非系統能力缺口。
- ✅ Schema 已備（`docs/publish-json-schema.md` §5 / `content/templates/_sample.publish.json`）；下一輪 phase 可直接落地。
- ⏸ 等 Dean 提供 `bloggerPostId` + precise `publishedAt`（per §7）後啟動 content-edit-only phase。
- ❌ 本 phase **未**做任何 backfill；**未**建立 `.publish.json`；**未**改 frontmatter。

---

## 9. Cross-links

- `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md`（P3 source；本 phase read-only inspect，未修改）
- `docs/20260617-blogger-p3-steady-rhythm-review-packet.md`（P3 審稿包；A1 內容線）
- `docs/20260617-blogger-p3-generated-html-verification-record.md`（C2 generated HTML verification；HEAD `c105880`）
- `docs/20260617-blogger-p3-steady-rhythm-repost-packet.md`（C3 repost packet；HEAD `fb623fa`）
- `docs/20260617-blogger-p3-steady-rhythm-live-verification-record.md`（C5 live verification record；user-evidence）
- `docs/20260617-night-project-status-and-next-paths-checkpoint.md`（C6 checkpoint；§4.2 B-live-3 ~ B-live-6 / §5.1 P-1）
- `docs/publish-json-schema.md`（§5 Blogger 區塊 schema / §5.3 publishedUrl 規則 / §5.4 publishYear/Month 推導規則 / §5.6 type）
- `docs/publish-bundle.md` §2.4 / §2.5 / §2.6.1（`.publish.json` vs `.md` frontmatter 範圍）
- `content/templates/_sample.publish.json`（sidecar 範本）
- CLAUDE.md §24（Blogger 發布 URL 回填）/ §3a Core operating rules / §3a Red lines

---

（本文件結束）
