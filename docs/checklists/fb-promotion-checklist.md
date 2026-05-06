# fb-promotion-checklist

FB 粉絲頁推廣的人工流程清單。對齊 Phase 4-a~4-g 實作。完整規格參見 `docs/promotion-export.md`。

---

## 1. 文章 frontmatter（撰文時）

`promotion.facebook` 區塊：

- [ ] `enabled` 設為 `true`
- [ ] `page` 已設（預設 `fan1`，或在 `promotion.config.json` 加新粉絲頁並啟用）
- [ ] `title` 寫了 FB 點擊吸引版本（可省略，會 fallback 至 `post.title`）
- [ ] `message` 寫了完整推廣文案（**必填**，validate 會擋）
- [ ] `hashtags` 至少 1 個（**必填**，validate 會擋；可含或不含 `#` 開頭）
- [ ] `target` 留 `"auto"`（預設）或填絕對 `http(s)://` URL
- [ ] `note`（選填）內部備註，不會輸出到 FB

文章本體：

- [ ] `status: "ready"` 或 `"published"`、`draft: false`（draft 會被 `loadPosts` 過濾，promotion 不會輸出）

---

## 2. Build 與檢查

執行：

- [ ] `npm run validate:content` → **0 warning(s)**
  - 若出現 `promotion-message-missing` / `promotion-hashtags-empty` / `promotion-page-unknown` / `promotion-page-disabled` / `promotion-target-invalid` → 依 `docs/promotion-export.md §6` 修正後重跑
  - 若出現 `promotion-globally-disabled` → `promotion.config.json facebook.enabled` 設 `true`
- [ ] `npm run build:promotion` → exit 0
- [ ] 檢查 `dist-promotion/facebook/all-posts-index.txt`：
  - [ ] header `total enabled` 數量符合預期
  - [ ] header `url missing: 0`（若不為 0，要決定先補 site URL 還是用 fallback 文字 placeholder 發文）
  - [ ] 對應文章區段的 `title / page / hashtags / url / txt` 欄位都正確
- [ ] 檢查個別 `dist-promotion/facebook/{site}/{slug}.txt`：
  - [ ] 4 段齊全：標題 / 推廣文案 / URL（或 fallback）/ hashtags
  - [ ] 段落間單一空行、檔尾無多餘空白
  - [ ] 中文字元、emoji、特殊字元渲染正常

---

## 3. 發布

到對應的 FB 粉絲頁：

- [ ] 開啟對應的 `dist-promotion/facebook/{site}/{slug}.txt`
- [ ] 全選 + 複製
- [ ] 貼到 FB 粉絲頁發文框
- [ ] 確認 FB 自動產生的連結預覽縮圖、標題、描述
  - 縮圖來自文章 `cover` 或站內預設；若異常需另行處理
- [ ] 確認 hashtag 顯示為可點擊
- [ ] 點擊貼文中的連結，確認可達且 UTM 參數**完整帶入**（瀏覽器網址列檢查 `utm_source / utm_medium / utm_campaign / utm_content`）
- [ ] 發布

---

## 4. 後續

- [ ] 若文章 `target: "auto"` 且 `primaryPlatform: "blogger"`：發 Blogger 後回填 `blogger.publishedUrl` 到 frontmatter，下次 build 即可解析正確 URL
- [ ] 若這次依賴 fallback 文字（`url missing` 不為 0）發文，事後補上 `site.config.json` 的 `githubSiteUrl` / `bloggerSiteUrl` 後重跑 `build:promotion`，記錄正式 URL 供下次使用
- [ ] 若同一篇之後要在另一個粉絲頁再發，目前 schema 只支援 1 個 `page`；多頁需要另開 schema 擴充（屬第二階段）
- [ ] 必要時把 FB 貼文連結 / 發布時間記錄到自己的 tracking sheet（系統不自動記錄）

---

## 相關文件

- 完整規格：`docs/promotion-export.md`
- 規範來源：`CLAUDE.md` §6 Phase 4 / §16 連結處理 / §29 第二階段不做清單
