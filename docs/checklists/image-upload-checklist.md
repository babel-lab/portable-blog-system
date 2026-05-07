# image-upload-checklist

對齊 CLAUDE.md §22 圖片與素材管理。本專案**不自動上傳圖片**；圖片需手動上傳至 Blogger / Google Drive / 其他外部圖床。

---

## 1. 撰文 / 拍攝前

- [ ] 確認圖片用途：cover / book photo / article body / download asset
- [ ] 規劃尺寸與比例：
  - cover（OG / Twitter card）：建議 **1200×630**（1.91:1）
  - 文章 body 配圖：建議寬度 ≤ 1200 px
  - book photo：依書本實拍，比例不限
- [ ] 命名規則：使用 `{slug}-{用途}.{ext}` 形式（如 `github-pages-blog-planning-cover.jpg`）
  - 不使用中文檔名（避免 URL 編碼問題）

---

## 2. 處理（壓縮 / 優化）

- [ ] 圖片已**壓縮**到合理大小：
  - cover：< 200 kB（JPEG quality 80–85）
  - body：< 100 kB（依內容）
  - SVG：縮短內嵌 metadata（可用 SVGO）
- [ ] 格式選擇：
  - 照片優先 JPEG / WebP
  - 圖示 / 線稿優先 SVG
  - 透明背景優先 PNG / WebP
- [ ] 工具建議（任一即可）：
  - squoosh.app（線上免費，可選 WebP）
  - TinyPNG / TinyJPG
  - 本機 ImageMagick / cwebp
- [ ] alt 文字已準備（將寫入 frontmatter `coverAlt` / `book.coverAlt` / 或 body `![alt](url)`）

---

## 3. 上傳目的地選擇

依 CLAUDE.md §22，可選：

- [ ] **Blogger 後台**（推薦給 Blogger 文章專用）：
  - 後台「插入圖片」→ 上傳，取得 `https://blogger.googleusercontent.com/img/...` URL
  - 注意 Blogger 後台預設會壓縮，不要重複壓
- [ ] **Google Drive**（推薦給跨平台共用）：
  - 上傳後右鍵「分享」→ 任何人皆可檢視
  - 用 `https://drive.google.com/uc?id={FILE_ID}` 直連格式
- [ ] **其他外部圖床**（自選）：
  - imgur / Cloudflare R2 / AWS S3 / 自架 CDN
  - 確認穩定性與保存政策

不建議：
- ❌ 把大型圖片放 `public/images/` 然後 Git push（除 placeholder 與極少量站內圖外）
- ❌ hot-link 別人網站的圖片

---

## 4. 取得正式 URL

- [ ] 上傳後**立刻**測試 URL：
  - 開無痕視窗或不同瀏覽器貼網址，確認可顯示
  - 確認圖片內容正確（沒上傳錯）
- [ ] 確認 URL 為 `https://`，無查詢參數可去除（避免 cache 問題）
- [ ] 記錄 URL 與檔案對應關係（建議在自己的 tracking sheet）

---

## 5. 回填到 frontmatter

依用途回填到對應欄位：

- [ ] **cover**：
  ```yaml
  cover: "https://...."          # 或 /images/... 站內路徑
  coverAlt: "圖片描述（含主題）"
  ```
- [ ] **book photo**（書評文章）：
  ```yaml
  book:
    coverImage: "https://..."
    coverAlt: "書本封面：書名"
    showBookPhoto: true
  ```
- [ ] **download asset**（教具下載）：
  ```yaml
  download:
    fileUrl: "https://..."
    fileType: "PDF"
  ```
- [ ] **article body 圖片**：在 Markdown body 用 `![alt 文字](https://...)` 格式

---

## 6. 原始檔備份

CLAUDE.md §22：大型原始檔不建議放 public repo。

- [ ] 大型原始檔（PSD / CLIP / AI / RAW / 原始 PNG/JPG > 5 MB）放**專案外**：
  ```text
  D:/BlogAssets/blogger/book-review/2026-05-04-atomic-habits/
  ```
- [ ] 在文章 frontmatter `sourceAssets.folder` 記錄路徑：
  ```yaml
  sourceAssets:
    folder: "D:/BlogAssets/blogger/book-review/2026-05-04-atomic-habits/"
  ```
- [ ] 該路徑同時依 backup-checklist 流程做雙備份（外接硬碟 + 雲端）

---

## 7. 驗收

build 後抽樣確認：

- [ ] `npm run dev` 開瀏覽器，文章頁圖片可正常顯示
- [ ] `dist/posts/{slug}/index.html` head 內 `og:image` 為正式 URL
- [ ] `dist-blogger/posts/{slug}/post.html` body 內圖片 URL 正確
- [ ] 圖片載入時 console 無紅字（404 / mixed content / CORS）

---

## 8. 不要做的事

- ❌ 不要把大型原始檔（> 5 MB）放 `public/images/`
- ❌ 不要 hot-link 別人網站的圖片
- ❌ 不要用 `http://`（必須 `https://`）
- ❌ 不要把已發布文章的圖片 URL 改成完全不同的目錄結構（破壞 SEO 與 Blogger 副本）
- ❌ 不要刪除 Blogger 後台已上傳的圖片（讓既有貼文圖片失效）

---

## 相關文件

- 規範來源：`CLAUDE.md` §22 圖片與素材管理、§13 下載文章規則、§12 書評文章規則
- 主流程：`docs/publish-workflow.md`
- 備份策略：`docs/checklists/backup-checklist.md`
