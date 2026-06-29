# Admin Markdown export/import — Phase 1 MVP boundary lock（docs-only decision）

- **Date:** 2026-06-29
- **Type:** docs-only decision note（不碰 source / 不碰 CLAUDE.md / 不碰 check script）
- **Baseline at decision:** branch `main`、HEAD = origin/main = `5e2d04d64e0d3f0caa81b43f9f78680ba0b1da62`（short `5e2d04d`、subject `test(admin): lock markdown frontmatter scaffold client/server parity`）、working tree clean、ahead/behind 0/0、`.git/index.lock` absent
- **Smoke baseline:** `npm run check:admin-markdown-export` → **110/110 PASS**

---

## 1. 決策摘要

經 2026-06-29 read-only inventory（盤點 Admin UI 操作入口、export/import roundtrip、smoke 覆蓋、TODO 標記），確認 **Admin Markdown export-side Phase 1 MVP 已可實際操作**。本 note 將 Phase 1 邊界正式鎖定，避免後續 session 誤把延後項目當成 Phase 1 blocker。

採用候選 **C（守住第一版邊界）**；不採 A（`parsePostMarkdown` roundtrip helper）與 B（blocks toggle UI）。

---

## 2. Phase 1 Admin Markdown MVP 邊界（IN SCOPE，已可操作）

Phase 1 的 Admin Markdown 流程定義為下列 **單向 export + 手動存檔** 路徑，且**現況已全部可用**：

1. **Admin UI 填資料** — 13 個欄位皆有可操作 input，經 `recompute()`（`src/views/admin/index.ejs`）→ `buildMarkdown()` 串接：
   - select：`site` / `contentKind` / `primaryPlatform` / `category`
   - input：`title` / `slug` / `date` / `tags` / `cover` / `coverAlt`
   - textarea：`description` / `searchDescription` / `body`
2. **產出 Markdown draft** — 寫入 `#npd-output`；frontmatter 永遠 `status:"draft"` + `draft:true`（zero-warning safe path）。
3. **copy / download Markdown** — Copy markdown / Download `.md` / Copy target path / Copy validation command 皆可用，且由 `isExportReady`（title + slug + date）gating。
4. **手動存到 `content/{site}/posts/`** — 使用者把 `{date}-{slug}.md` 手動存進對應資料夾。
5. **跑 validate** — `npm run validate:content` 把關；通過後再由人於 VS Code 決定是否改 `status` 為 ready / published。

`blocks` 在 Phase 1 維持 **硬編 8-key 合理預設**（`toc:false` / `adsenseTop:true` / `adsenseMiddle:false` / `adsenseBottom:true` / `hashtags:true` / `socialFollow:true` / `relatedPosts:true` / `sidebar:true`），已足以產出合法 draft。

---

## 3. import 在 Phase 1 的定義

- Phase 1 的「import」= **documented manual checklist**（5 步：download/copy → 手動存到 `content/{site}/posts/` → `validate:content` → VS Code 編輯 → 再 validate）。
- **不是 parser**：不存在「貼上 Markdown → 解析 frontmatter → 回填表單欄位」的功能，Phase 1 也**不**實作。
- Admin UI 的 manual import panel 文案誠實標示「檔案還在瀏覽器 / 剪貼簿，尚未進入 repo」，與本定義一致。

---

## 4. 延後到後續 phase（OUT OF SCOPE for Phase 1）

下列項目**明確不進 Phase 1**，須各自另開 phase + explicit approval 才啟動：

- `parsePostMarkdown(md)`（frontmatter → 欄位物件之純 inverse helper）
- Markdown → form roundtrip（貼上 Markdown 回填表單）
- visual editing / 視覺化文章編輯器（呼應 CLAUDE.md §29 / Phase 8 第一版永禁）
- `blocks` toggle UI（讓使用者覆寫硬編 blocks 預設）

> 註：roundtrip-to-form / visual editing 貼近 CLAUDE.md §29 已 defer 之「視覺化文章編輯器」邊界，保守起見不在第一版 export MVP 內展開。

---

## 5. 不變量（本 note 不改動）

- 本 note 為 **docs-only**：未碰 `src/`、未碰 `CLAUDE.md`、未碰 `MEMORY.md` / `memory/`、未碰 check script。
- Smoke baseline 維持 **110/110 PASS**（`npm run check:admin-markdown-export`）。
- 最新 baseline 維持 `5e2d04d`。
- 未來若要推進候選 A / B，須另開 phase 並取得 explicit approval；本 note 僅鎖定邊界，不授權任何後續實作。
