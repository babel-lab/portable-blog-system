# Blogger identity and backfill strategy（2026-07-06）

Session：`260706-W2 / define blogger identity backfill strategy`

- **Date**: 2026-07-06 (Asia/Taipei)
- **Type**: docs-only policy / strategy note
- **Baseline**: HEAD = origin/main = `8e5c490`（subject `docs(state): sync blogger backfill write-target baseline`）；working tree clean；ahead/behind 0/0；`.git/index.lock` absent。
- **本 slice 唯一 mutation**：新增本 docs 檔（+ 視需要 CLAUDE.md 一小段 state sync）。**不** 動 `src/` / `content/` / `content/settings/` / `package.json` / lockfile / deploy clone / gh-pages / build output；**不** 修改 frontmatter / status / draft / publishTargets；**不** 補任何 backfill 真值；**不** 猜 Blogger URL / postId / publishedAt；**不** build / deploy；**不** 把 warning-only guard 改成 blocking。

> ⚠️ 本文件是 **policy 層**，不是 backfill data source，不含任何 Blogger 真值。

## 0. 為什麼要寫這份

既有 backfill 系列 docs（見 §7 predecessor）把 `bloggerPostId` 列為「missing / 待補」欄位。這在 report 層正確，但在 policy 層會誤導：**`bloggerPostId` 是 Dean 從 Blogger 後台介面取不到的 internal ID**，不該被當成「Dean 人工 backfill 必填」欄位。本文件把 Blogger identity 欄位分層講清楚，避免未來系統或 guard 把 Dean 拿不到的東西當成他該手動填的資料。

本文件承接既有 backfill 線，但主題明確放在 **identity 分層 + 不猜 ID + date mismatch 非錯誤 + guard 定位 + future API flow**，不重複既有 inventory / snapshot 內容。

---

## A. Blogger platform identity 分層

Blogger 相關欄位分成至少三類，不可混為一談：

### A.1 Dean 可手動取得 / 可人工 backfill

Dean 平常在 Blogger 後台只看得到文章的表層資訊，這些是他能人工提供的：

- **Blogger title**（文章標題）
- **published URL**（發布後的正式網址）
- **published time**（發布 / 更新時間）
- **optional note / source reference**（人工備註 / 來源說明）

→ 這些是 backfill write phase 真正會向 Dean 索取的欄位。

### A.2 Dean 不應被要求手動提供的 Blogger internal 欄位

以下屬 Blogger 內部識別，Dean 從一般後台介面**無法直接取得**，因此**不得**列為人工 backfill 必填：

- **`bloggerPostId`**（Blogger 內部 post ID）
- 其他 Google Blogger API / internal identifiers（如 `bloggerBlogId` 等）

→ guard 可以「report 這些欄位為 empty」，但**不得**把它們當成 Dean 的手動待辦，也**不得**因為它們缺失而 fail。

### A.3 未來系統整合後可由系統管理的欄位

以下欄位待未來 Blogger API / publish / update flow 落地後，**由系統於 publish/update response 取得並保存**，而非人工填寫：

- `bloggerPostId`
- `bloggerBlogId`
- platform sync state
- `lastSyncAt`
- publish / update response metadata

→ 換言之 `bloggerPostId` 的正確歸屬是 **A.3（系統取得）**，不是 A.1（人工）。目前它出現在 backfill report 的 "missing" 只代表「系統整合尚未落地、值仍為空」，不代表「Dean 該手動去查」。

---

## B. 不猜 ID 原則

任何 Blogger internal ID **都不能**用以下任何資訊推測：

- title
- slug
- URL path
- date
- GitHub metadata

只要某個 Blogger internal identifier 尚未能由 Blogger API / management flow 實際取得，就應保持 **empty / missing / unknown**，而**不是**假造一個看起來合理的值。

此原則與既有紅線一致（CLAUDE.md：❌ 不得 guess Blogger postId / publishedAt）。

---

## C. Date mismatch 不視為錯誤

GitHub markdown 的 `date` 與 Blogger 的 `publishedAt` **可以不同**，這是正常情形。

理由：文章可能先貼上 Blogger，之後才複製到 GitHub 或新系統測試；兩邊的時間本來就會有落差。

因此：

- guard **可以** report mismatch（作為觀測資訊）。
- guard **不應** 把 mismatch 當 failure。
- guard / 系統 **不應** 自動改任何一邊的日期去「對齊」。

---

## D. 現有 `check:blogger-backfill` 的定位

`check:blogger-backfill`（`src/scripts/check-blogger-backfill.js`）目前是 **report-only / warning-only**，本次不改變此定位。

它**可以**：

- report 缺漏的 backfill metadata（哪篇、缺哪些欄位、sidecar present/absent）。

它**不應**：

- 猜測 / 假造任何 metadata。
- 寫任何檔。
- 猜 URL / postId / publishedAt。
- mutate frontmatter。
- block build / deploy。

實測行為契約詳見 `docs/20260706-blogger-backfill-report-only-baseline.md` §2。本輪 `npm run check:blogger-backfill` 實測仍為 exit 0、scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5（與既有 baseline 一致）。

> 重新定位提醒：report 中 `we-media-myself2` 的 `bloggerPostId` missing，屬 §A.2 / §A.3（系統欄位、Dean 取不到），**不是** Dean 的人工 backfill 待辦。Dean 真正能補的是 A.1 欄位。

---

## E. 未來可做但本 session 不做

以下為 future slice，各須另開 phase + Dean explicit approval，本 session 一律不做：

- Blogger API credential / auth design
- Blogger publish / update flow
- Blogger `postId` capture after API publish / update（系統自動取得並寫入 A.3 欄位）
- frontmatter / sidecar schema extension（新增 A.3 系統欄位）
- Admin UI 顯示 Blogger sync state
- backfill value intake helper（A.1 欄位人工輸入流程）—— 待 flow stabilized 後再設計

---

## 6. 硬性聲明（不可違反）

- 本文件是 policy 層，**不含** Blogger 真值。
- Claude **不得猜** `publishedUrl` / `bloggerPostId` / `publishedAt` / `bloggerUrl` / 任何 Blogger internal ID。
- `bloggerPostId` 等 internal ID **不列為** Dean 人工 backfill 必填；待系統整合後由 API flow 取得。
- guard 維持 warning-only；升級為 blocking 須另開 phase + explicit approval。
- 真正 backfill write phase 須 Dean 提供 A.1 真值 + explicit approval 才啟動。

---

## 7. 承接關係（predecessor / sibling docs）

- `docs/20260706-blogger-backfill-report-only-baseline.md`（guard 行為契約 + report snapshot）
- `docs/20260706-blogger-backfill-value-intake-template.md`（backfill 值 intake 入口；僅列缺口）
- `docs/20260706-blogger-backfill-write-target-inventory.md`（canonical write target = `.publish.json` sidecar；缺口 mapping）
- `docs/20260705-blogger-continuation-next-line-inventory.md`（Blogger 線盤點）
- `docs/20260617-night-blogger-p3-metadata-backfill-preflight.md`（P3 backfill preflight；Dean-gated）

本文件補足上列 docs 未明確表態的一點：**identity 欄位分層 + `bloggerPostId` 歸屬系統而非人工**。
