# sidecar-migration-checklist

本 checklist 用於檢查一篇舊文章或固定頁是否已完成 publish bundle 三檔遷移。

對應之上層規範與遷移流程詳見 `docs/migration-from-frontmatter.md`。

---

## §1 Checklist 目的

逐項驗收一篇遷移作業之完成度。每一篇 post 或 page 走完三檔（`.md` / `.publish.json` / `.fb.md`）之建立、欄位整理、舊資料搬移後，依本 checklist 確認結果。

未通過項目應視情況補修；未補修前不視為遷移完成，亦不應進入 Phase 8-b 後續之 `validate-content` / build 流程。

---

## §2 基本檔案檢查

- [ ] `{slug}.md` 存在
- [ ] `{slug}.publish.json` 存在
- [ ] `{slug}.fb.md` 存在（若此篇不需要 FB 推廣，仍應建立檔案並於 frontmatter `enabled: false`，或於 `note` 欄位明確說明不發 FB 之策略）
- [ ] 三檔 slug 完全一致（檔名前綴必須相同，詳見 `docs/publish-bundle.md` §1.2）
- [ ] 三檔位於同一 `posts/` 或 `pages/` 資料夾
- [ ] `posts/` 與 `pages/` 不混放（同一 slug 不得同時出現於 `posts/` 與 `pages/` 兩處）

---

## §3 `.md` frontmatter 檢查

- [ ] `title`
- [ ] `slug`（與三檔檔名前綴一致）
- [ ] `contentKind`（合法值見 `docs/publish-bundle.md` §2.4.1）
- [ ] `description`
- [ ] `tags`
- [ ] `category`
- [ ] `cover`（若不需要封面，於 frontmatter 註解或本文末註明原因，例：「四格漫畫無封面圖」）
- [ ] `draft` / `status`
- [ ] `series`（若無系列可留空或省略）
- [ ] `quote`（若無金句可留空或省略）
- [ ] `relatedLinks`（若無可留空）
- [ ] `otherLinks`（若無可留空）
- [ ] 舊 `type` 已改名為 `contentKind`（詳見 `docs/migration-from-frontmatter.md` §3）
- [ ] `.md` frontmatter **不包含** `blogger.type`（屬 `.publish.json`）
- [ ] `.md` frontmatter **不放** `publishedUrl`（屬 `.publish.json`）

---

## §4 `.publish.json` 檢查

- [ ] `schemaVersion: 1` 存在
- [ ] `blogger.type` 為 `"post"` 或 `"page"`
- [ ] `blogger.type` 與內容目的一致（書評文章發 Blogger 文章區 → `post`；About / 工具目錄等固定頁 → `page`）
- [ ] `blogger.publishedUrl` 若已發布則已回填（未發布留空字串）
- [ ] `blogger.publishedAt` 若已發布則已回填（未發布留空字串）
- [ ] `canonical.source` 已確認（`auto` / `github` / `blogger` / `manual`）；`canonical.url` 視情況回填
- [ ] **不含** `contentKind` 欄位（屬 `.md` frontmatter）
- [ ] **不含** FB 長文文案（屬 `.fb.md` body）
- [ ] Blogger post 不預測 URL：`type === "post"` 時若 `publishedUrl` 尚未回填，留空字串而非組出假 URL
- [ ] Blogger page 不套用 yyyy/mm 規則：`type === "page"` 時 `publishYear` / `publishMonth` 留空
- [ ] GitHub 相關欄位若尚未啟用，`github.status` 為 `"draft"` 且 `publishedUrl` 留空，狀態需清楚

---

## §5 `.fb.md` 檢查

- [ ] FB 貼文正文已整理（body 段）
- [ ] `hashtags` 已整理（frontmatter 陣列）
- [ ] CTA 已整理（屬 body 內容）
- [ ] UTM 策略已確認（UTM 由 `promotion.config.json` 動態組裝，**不寫死於 `.fb.md`**；確認 `promotion.config.json` 之 `facebook.utm` 設定符合本篇期望）
- [ ] 若不發 FB，`enabled: false` 或 `note` 欄位有清楚備註
- [ ] FB 文案沒有塞回 `.md`
- [ ] FB 文案沒有塞進 `.publish.json`
- [ ] 確認 `posts/` 與 `pages/` 皆可使用 `.fb.md`（Page 也支援 FB 推廣，詳見 `docs/fb-sidecar-schema.md` §1.5）

---

## §6 Page 額外檢查（僅 Page 類文章適用）

- [ ] 三檔位於 `content/{site}/pages/`
- [ ] `.md` frontmatter `contentKind: page`
- [ ] `.publish.json` `blogger.type: "page"`
- [ ] **不使用** Blogger post 的 yyyy/mm URL 推導（詳見 `docs/publish-json-schema.md` §5.3.2）
- [ ] `publishedUrl` 以實際發布後回填為準（不可預測）
- [ ] 若 Page 也有 FB 導流，`.fb.md` 已建立並 `enabled: true`

---

## §7 完成標準

一篇文章 / 頁面完成遷移之標準如下：

1. 三檔（`.md` / `.publish.json` / `.fb.md`）皆存在
2. `contentKind` 與 `blogger.type` 分工正確（§3 / §4）
3. `publishedUrl` / `canonical` / FB 文案各自放在正確位置（§4 / §5）
4. 沒有把內容屬性、平台狀態、社群文案混在同一檔（詳見 `docs/publish-bundle.md` §2.6.4）
5. 後續可進入 `validate-content` 與 build 規則設計（屬 Phase 8-b 之後）

---

## §8 本 checklist 不做的事

1. 不 commit
2. 不 push
3. 不設定 remote
4. 不 amend
5. 不進 Phase 8-b
6. 不修改程式碼
7. 不產生 `dist/` 或 `dist-blogger/`

本 checklist 屬人工驗收輔助，不替代 Phase 8-b 之後 `validate-content` 自動驗證。

---

（本文件結束）
