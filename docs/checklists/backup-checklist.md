# backup-checklist

對齊 CLAUDE.md §25 備份與搬家規則。核心理念：**不能讓任何資料只存在 Blogger 後台**。

---

## 1. 備份分層策略

```text
L1: Git（程式碼 / Markdown / JSON / 文件 / 設定）
L2: 外部硬碟（圖片原始檔 / PSD / CLIP / AI / 大型素材）
L3: 雲端（重要素材第二副本）
L4: Blogger 平台（已發布文章在平台上的副本）
L5: GitHub Pages（已部署的靜態站副本）
```

每層職責不同，**至少要有兩層獨立備份**才能容錯。

---

## 2. Git 備份（L1）

- [ ] 工作中：勤 commit、commit message 描述清楚
- [ ] 段落結束：確認 main 分支 working tree clean
  ```bash
  git status
  ```
- [ ] 暫無 remote 階段：定期把 `.git/` 整包複製到外接硬碟
- [ ] 未來建立 remote 後：定期 `git push origin main`
- [ ] 重要里程碑：建立 tag（如 `v1.0-mvp`）方便日後 rollback

⚠️ 提醒：本專案目前**未設 remote**。設 remote 前所有 commit 只存在本機，務必同步到外接硬碟。

---

## 3. 外部硬碟備份（L2）

- [ ] **大型原始檔**（依 `image-upload-checklist.md` §6）：
  ```text
  D:/BlogAssets/blogger/book-review/2026-05-04-atomic-habits/
  D:/BlogAssets/github/...
  ```
- [ ] 建議子資料夾結構：
  ```text
  BlogAssets/
  ├─ blogger/
  │  ├─ book-review/
  │  ├─ life-note/
  │  └─ comic/
  ├─ github/
  │  └─ tech-note/
  └─ shared/
     └─ branding/   # logo / favicon 原始檔
  ```
- [ ] 整包專案備份：定期把 `portable-blog-system/`（含 `.git/`）複製到外接硬碟
- [ ] 備份頻率建議：**每週一次** + **重要 commit 後立即**

---

## 4. 雲端備份（L3）

- [ ] 重要素材第二副本上傳到雲端（任選）：
  - Google Drive / OneDrive / Dropbox
- [ ] **不要**直接把 `node_modules/` / `dist/` / `dist-blogger/` / `dist-promotion/` / `.cache/` 等產物上雲（浪費空間且無備份價值）
- [ ] 建議只上傳：
  - `content/`（文章與設定）
  - `public/images/`（站內小圖）
  - `BlogAssets/`（大型素材）
- [ ] 備份頻率：**每月一次**或**重要素材完成時**

---

## 5. Blogger 平台副本（L4）

Blogger 已發布文章本身就是副本，但**仍需確認**：

- [ ] 每篇已發布文章在 Blogger 後台「發布」狀態
- [ ] frontmatter `blogger.publishedUrl` 已回填正式 URL
- [ ] frontmatter `blogger.bloggerPostId` 已回填（方便日後 API 操作）
- [ ] frontmatter `blogger.publishedAt` 已回填（建立發布時序）
- [ ] 定期匯出 Blogger 後台 XML 備份（後台 → 設定 → 匯出內容），存到外接硬碟
- [ ] 匯出頻率：**每季一次**或**新增 ≥ 5 篇文章後**

---

## 6. GitHub Pages 副本（L5）

GitHub Pages 部署本身就是副本，但需確認：

- [ ] `npm run build` 在本機可重現產物
- [ ] GitHub Pages 部署後正式 URL 可達
- [ ] 部署設定（base path / custom domain）有文件記錄

---

## 7. 文章 URL 回填（雙向追蹤）

CLAUDE.md §24：Blogger 文章發布後應回填正式 URL。

- [ ] 為每篇 `publishTargets.blogger.enabled: true` 的文章補：
  ```yaml
  blogger:
    status: "published"
    publishedUrl: "https://your-blog.blogspot.com/..../slug.html"
    bloggerPostId: "1234567890"
    publishedAt: "2026-05-04"
  ```
- [ ] 回填後重跑 `npm run build:promotion`，FB 推廣文案會用正式 URL

---

## 8. 搬家準備（CLAUDE.md §25）

長期目標：能整包搬到其他平台。

- [ ] `content/` 完整可獨立 build（不依賴外部後台 / DB / API）
- [ ] `public/` 站內小圖完整
- [ ] `BlogAssets/`（外部硬碟）完整且檔名與 frontmatter 對應
- [ ] 文件齊全（`CLAUDE.md` / `README.md` / `docs/` 全部 commit 在 Git）
- [ ] 不依賴：Blogger API / Google Drive API / 後台 DB

---

## 9. 災難復原（建議定期演練）

每半年模擬一次：

- [ ] 從外接硬碟取出 `portable-blog-system/`
- [ ] `git status` 確認可繼續開發
- [ ] `npm install`
- [ ] `npm run build` 通過
- [ ] 抽樣開幾篇文章預覽，確認可正常 render

如果以上任一步驟失敗，代表備份不完整，需補強對應層。

---

## 相關文件

- 規範來源：`CLAUDE.md` §25 備份與搬家、§24 Blogger URL 回填、§22 圖片素材
- 主流程：`docs/publish-workflow.md`
- 圖片管理：`docs/checklists/image-upload-checklist.md`
- 詳細規範：`docs/backup-and-migration.md`
