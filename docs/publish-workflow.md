# N-01 publish workflow

本專案的「人工發布流程」總索引。本機 Markdown 為唯一資料來源，輸出至 GitHub Pages 與 Blogger 兩個平台。

---

## 1. 整體流程概覽

```text
撰文（content/）→ 驗證 → build → 發布 → 後續（推廣 / 備份 / 回填）
```

### 兩個平台的核心差異

- **GitHub Pages**：`npm run build` 後將 `dist/` 部署到 GitHub Pages（本專案不模擬 push 流程，依平台預設）
- **Blogger**：`npm run build:blogger` 產出可貼用 HTML，**人工複製**到 Blogger 後台發布

兩平台共用 Markdown 來源，但走不同 build script。

---

## 2. 發布前置（撰文時）

請依以下檢查清單於 frontmatter 補齊資訊：

- 一般 SEO：`docs/checklists/seo-checklist.md` §1
- FB 推廣（如 enabled）：`docs/checklists/fb-promotion-checklist.md` §1
- 圖片：`docs/checklists/image-upload-checklist.md`

`status` 維持 `"ready"` 或 `"published"`，`draft: false` 才會進 build。

---

## 3. Build 與檢查

執行順序（重要）：

```bash
npm run validate:content     # 0 errors / 0 warnings 才繼續
npm run build                # GitHub 站 build（含 prebuild）
npm run build:sitemap        # 必須在 vite build 之後（vite 會清空 dist/）
npm run build:blogger        # Blogger HTML
npm run build:promotion      # FB 推廣 .txt
npm run build:blogger-theme  # Blogger 可貼用 CSS（首次貼主題用）
```

---

## 4. 發布

依平台拆三條主線：

### 4.1 GitHub Pages
依 `docs/checklists/github-deploy-checklist.md`。

### 4.2 Blogger
依 `docs/checklists/blogger-publish-checklist.md`。
複製 `dist-blogger/posts/{slug}/post.html` 內容到 Blogger HTML 編輯器。

### 4.3 FB 粉絲頁推廣
依 `docs/checklists/fb-promotion-checklist.md`。
複製 `dist-promotion/facebook/{site}/{slug}.txt` 到 FB 發文框。

---

## 5. 後續

- **回填 Blogger URL**：發布後將正式 URL 回填到文章 frontmatter `blogger.publishedUrl / bloggerPostId / publishedAt`（CLAUDE.md §24）
- **備份**：依 `docs/checklists/backup-checklist.md`
- **圖片素材**：依 `docs/checklists/image-upload-checklist.md` §6 備份原始檔

---

## 6. Reports（待 Phase 7-b 補完）

未來於 `dist-reports/` 提供：
- build report：彙總 ready / draft 數量、warning 數、產物 manifest
- draft posts report：未發布草稿清單
- missing tags report：用到但未定義於 `tags.json` 的 tag
- published URL report：Blogger URL 是否回填

---

## 7. Checks（待 Phase 7-c 補完）

未來於 `dist-reports/` 提供：
- broken links check：站內死連結
- image links check：圖片連結 / cover 路徑可達性

---

## 相關文件

- 規範來源：`CLAUDE.md` §6 Phase 7、§22 圖片素材、§24 Blogger URL 回填、§25 備份搬家
- Phase 3 細節：`docs/blogger-export.md`
- Phase 4 細節：`docs/promotion-export.md`
- Phase 5 細節：`docs/seo-ga4-adsense.md`
- 部署細節：`docs/github-deploy.md`
- 備份細節：`docs/backup-and-migration.md`

---

See also:
- `docs/publish-bundle.md` §2.6（三檔欄位分工）
- `docs/migration-from-frontmatter.md` §7（人工遷移 10 步）
- `docs/checklists/sidecar-migration-checklist.md`（三檔遷移檢查表）
