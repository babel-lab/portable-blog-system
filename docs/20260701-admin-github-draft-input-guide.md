# Admin UI GitHub Draft 填寫指南（tech-note draft）

**Phase**：20260701-c2-2（docs note）
**種類**：docs-only 填寫指南（**非** src、**非** validator、**非** package.json wired script）
**對象**：用 Admin UI `#new-post-draft` 匯出 **GitHub tech-note draft** 時各欄位怎麼填。
**背景**：Admin UI export = authoring helper，只產出 markdown 文字（copy / download），**不寫 repo、不發布、不 build / deploy**（見 `#new-post-draft` 的「Draft-only contract」區塊）。

相關文件：

- `docs/20260701-github-draft-metadata-smoke.md`（frontmatter contract smoke，11 條斷言）
- `docs/20260701-github-draft-publish-readiness-checklist.md`（draft → ready / published 前檢查）

---

## 0. 用途

記錄用 Admin UI 填 GitHub tech-note draft 時各欄位的填法與注意事項，避免 `titleEn` / `category` / `tags` / `cover` / `status` / `publishTargets` 填錯。本指南只描述「怎麼填」與「export 會自動產生什麼」，**不改變** export 行為。

---

## 1. site / primaryPlatform / publishTargets（GitHub draft 關鍵）

`site` 選 **`github`** 時，export 會**自動產生**下列欄位（表單無獨立 publishTargets 欄位，全部由 `site` 推導）：

- `primaryPlatform: "github"`
- `publishTargets.github.enabled: true`
- `publishTargets.github.mode: "full"`
- `publishTargets.blogger.enabled: false`
- `publishTargets.blogger.mode: "summary"`

注意事項：

- **`publishTargets.blogger.enabled` 不可為 `true`**：本 draft 不同步發往 Blogger。若未來要開 Blogger 發布，須另開 slice，不在 Admin draft input 階段做。
- **`blogger.mode` 對 GitHub draft 不作為發布用途**：site=github 時它只是預設帶出的 `"summary"` 佔位值，GitHub draft 不靠它發布；不需要為它調整任何內容。
- 目標存檔位置隨 `site` 切換：github → `content/github/posts/{date}-{slug}.md`。

---

## 2. title / titleEn

- **`title` 必填**：文章標題，寫入 frontmatter 的 `title`，會成為頁面主 H1。**不要**在 body 再寫第二個 `# ` 一級標題。
- **`titleEn` 建議填**：GitHub draft metadata smoke（`check-github-draft-metadata.js` 斷言 #5）要求 `titleEn` **非空**。
  - 若留空白，Admin export **仍會輸出** `titleEn: ""`（key 一定存在），但該 smoke 會失敗 → 發布前務必補上英文標題。
  - 長度 > 80 只是 Ready-preflight soft warning，不擋 export。

---

## 3. slug / date / updated

- **`slug`**：kebab-case，僅 `a-z 0-9 -`（regex `^[a-z0-9]([a-z0-9-]*[a-z0-9])?$`）。不合法 → Download 檔名無法產生（按鈕維持 disabled）。
- **`date`**：`YYYY-MM-DD`。可按「今天」帶入本機今天日期。不合法 → 檔名無法產生。
- **`updated`**：export 會將 `updated` 帶成與 `date` 相同值。若日後在 VS Code 實際修訂內容，再手動把 `updated` 改為修訂日；`date` 維持首次發布/建立日。
- 檔名與 `id` 由 `date` + `slug` 組出（`{date}-{slug}.md` / `id: {YYYYMMDD}-{slug}`）；兩者任一不合法時 export 會填 `TODO-fill-*` 佔位，提醒尚未完成。

---

## 4. category

- **必須使用 `content/settings/categories.json` 內既有、且適合 GitHub 的 tech-note category**（該 entry 的 `site[]` 需含 `github`）。
- Admin 表單的 category 是 registry-bound `<select>`（不可自由輸入）。
- 若 category 不在 registry 或 site 不含 github，Ready-preflight 會出 registry hint（`unknown-category` / `category-site-mismatch`），且發布後 `validate:content` 會 warning。

---

## 5. tags

- **只能使用 registry（`content/settings/tags.json`）內既有、且 `site[]` 含 `github` 的 tag**。本 tech-note draft 可用：
  - `github`
  - `vite`
  - `static-site`
- **不可使用**目前不存在或紅線 forbidden 的 tag：
  - `admin-ui`
  - `design-token`
  - `blogger`
  - `download`
  - `markdown`
- 輸入為 comma-separated；export 會 trim、去重（保留首次出現順序）、丟棄空值。
- tag 不在 registry 或 site 不含 github → Ready-preflight 出 `unknown-tag` / `tag-site-mismatch` hint。

---

## 6. cover / coverAlt

- **`cover`**：欄位標示為 optional（export 永遠是 draft，可留空），但**準備發布前應補齊**——空 `cover` 會被 Ready-preflight 列為 blocking（`missing-cover`）。
- **`coverAlt`**：要與 `cover` **一致**：
  - 有 `cover` → 建議一併填有意義的 `coverAlt`（替代文字，描述封面圖）。
  - `cover` 空、`coverAlt` 有值 → Ready-preflight 會出 `coverAltWithoutCover` warning（建議補封面圖或清空 alt）。
  - 兩者皆空只是 warning，不擋 export。

---

## 7. description / searchDescription

- **`description`**：SEO 摘要（進 og:description / meta description / JSON-LD）；空白時 Ready-preflight 列為 blocking（`missing-description`）；> 160 字為 soft warning。
- **`searchDescription`**：選填；空白只是 Ready-preflight warning，不擋 export（Blogger 後台可另外手動補）。

---

## 8. status / draft

- **Admin export 永遠產出 `status: "draft"` + `draft: true`**；表單沒有 ready / published 切換。
- 切 ready / published 是**未來 publish slice** 的動作，**不在 Admin draft input 階段做**；升 ready 前請先看 Ready-preflight 列出的 blocking 欄位，並於 VS Code 端手動改 frontmatter。

---

## 9. body / markdown 內容

- 可先用 **draft 草稿語氣**；body 留空時 export 會帶入 `## 簡介 / ## 段落 / ## 結尾` 預設模板（Ready-preflight 會提醒「body 仍是預設範例」）。
- body **不要**再寫第二個 `# ` 一級標題（frontmatter `title` 已是頁面 H1；請從 `##` 開始）。
- **不放** secrets / token / external production URL / Google Form URL / Google Drive ID / respondent data（CLAUDE.md §3 紅線）。

---

## 10. 匯出後必跑

把 Admin 產出的 markdown 貼進 `content/github/posts/{date}-{slug}.md` 後，於 VS Code terminal 執行：

```bash
node src/scripts/check-github-draft-metadata.js     # 預期 11 / 0
npm run validate:content                            # 預期 0 error / 134 warning / 106 post(s)
npm run check:admin-markdown-export                 # 預期 174 PASS
```

（實際 baseline 以當時 repo 量測為準；本三項為回歸確認，非本 draft 的發布 gate。）

---

## 11. 邊界說明

- 本 note 為 docs-only：**不**改 `src/`（含 `src/views/admin/index.ejs`、`src/scripts/admin-markdown-export.js`、`src/scripts/check-admin-markdown-export.js`）、**不**改 content / registry / CLAUDE.md / package.json、**不** build / deploy、**不**碰 gh-pages / deploy clone、**不**開 dev server、**不**新增 dependency。
- 本指南只描述現行 Admin export 行為與填寫建議；不引入新欄位、不改變 export contract。
- 實際的 draft → ready 切換與發布 / deploy 皆為獨立、需授權的後續 slice。
