# GitHub Draft Publish Readiness Checklist（draft → ready / published）

**Phase**：20260701-b1-2（docs note）
**種類**：docs-only 前置檢查清單（**非** package.json wired script、**非** validator）
**對象 draft**：`content/github/posts/2026-07-01-github-pages-build-preview-workflow.md`
（現況 `status: "draft"` / `draft: true`，尚未發布）

---

## 0. 用途

記錄本 GitHub draft 由 `draft` 轉往 `ready` / `published` **之前**必做的檢查，避免發布前遺漏 metadata、內容或 deploy 邊界。

本清單為 **人工 checklist**：不自動化、不寫入任何檔、不觸發 build / deploy。相關背景見：

- `docs/20260701-github-draft-metadata-smoke.md`（frontmatter contract smoke，11 條斷言）
- A5-1 readiness review 結論：publish 前需再處理 cover / coverAlt 一致性、補實際操作截圖或紀錄、以及 draft/status flip。

---

## 1. Metadata contract（發布前必過）

跑一次 direct-node smoke，確認 frontmatter contract 完整：

```bash
node src/scripts/check-github-draft-metadata.js
```

預期：`check-github-draft-metadata: 11 / 0`

- [ ] `site` / `primaryPlatform` 皆為 `github`
- [ ] `contentKind` 為合法列舉值（本 draft = `tech-note`）
- [ ] `title` / `titleEn` / `slug` 皆非空
- [ ] `category` 綁 `categories.json`，且該 entry `site[]` 含 `github`
- [ ] `tags` 全綁 `tags.json`，且各 entry `site[]` 含 `github`；無紅線禁用 tag
- [ ] `publishTargets.github.enabled === true`（發布目標維持 GitHub）
- [ ] `publishTargets.blogger.enabled` **維持 `false`**（本 draft 不同步發往 Blogger；若要開 Blogger 須另開 slice）

---

## 2. SEO / 封面一致性（A5-1 待辦）

- [ ] `description` 已填、非預設佔位；長度未過長（validator `long-description` soft warning 為參考）
- [ ] `searchDescription` 已填（空值不擋 ready，但建議補）
- [ ] `cover` 與 `coverAlt` **一致性**：
  - 若 `cover` 有值 → `coverAlt` 必須有意義描述
  - 若 `cover` 為空 → 建議 `coverAlt` 一併清空（避免「alt 有值但無封面圖」不一致）
  - 現況 draft：`cover: ""` 但 `coverAlt` 有值 → **發布前需決定補封面圖或清空 alt**

---

## 3. 內容完整性

- [ ] body 已是正式正文，非 Admin export 預設 scaffold
- [ ] body 內無第二個 `# ` 一級標題（frontmatter `title` 已是頁面 H1）
- [ ] 補上實際操作紀錄 / 截圖（A5-1 待辦；本機 build / preview 的實測結果）
- [ ] Checklist 段落與內文的 deploy 邊界敘述仍正確

---

## 4. 全站回歸（發布前 baseline 未回退）

```bash
npm run validate:content
```

預期：`0 error / 134 warning / 106 post(s)`

- [ ] error 數維持 0
- [ ] 未因本次改動新增 error
- [ ] draft 仍被正確過濾，未意外進入正式輸出

---

## 5. draft → ready / status flip（真正發布動作）

⚠️ 以下屬**發布動作**，須另開 phase + user explicit approval，本清單只列步驟、不代表可自動執行：

- [ ] 確認上述 §1–§4 全數通過
- [ ] 將 `status: "draft"` → `ready`（或 `published`）、`draft: true` → `false`
- [ ] flip 後**重跑** `validate:content`（ready 狀態的 validator gate 較嚴，可能新增 warning；確認未新增 error）
- [ ] flip 後**重跑** `node src/scripts/check-github-draft-metadata.js`（draft contract 斷言 #10 會因 status 改變而需同步調整或另立 ready smoke）
- [ ] build / deploy 為**獨立步驟**：`npm run build` → `npm run preview` 本機檢查 → gh-pages deploy 須另行授權；本清單到此為止

---

## 6. 邊界說明

- 本 note 為 docs-only：**不**改 CLAUDE.md、**不**改 content / registry / package.json、**不** build / deploy、**不**碰 gh-pages / deploy clone。
- 實際的 draft/status flip 與 deploy 皆為獨立、需授權的後續 phase。
- 本清單不取代 `docs/20260701-github-draft-metadata-smoke.md`；兩者搭配使用（smoke 鎖 draft contract，本清單管發布前完整流程）。
