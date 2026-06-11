# Blogger AdSense Phase D Single-Post Repost Plan

Phase: `20260611-pm-11-blogger-adsense-phase-d-single-post-repost-plan-docs-only-a`

## 1. Status

- **docs-only manual repost checklist**
- no repost performed
- no deploy
- no Blogger / AdSense backend mutation
- **actual Phase D repost remains 🔴 BLOCKED until separate explicit approval**

> ⚠️ 本文件不含 real AdSense client / slot id；一律以 `slotKey`（`articleAd6`）/ masked（`ca-pub-…****` / slot `…****`）表述。real id 僅存於 `content/settings/ads.config.json`。

---

## 2. Baseline

| 項目 | 值 |
|---|---|
| HEAD / origin/main | `2b1f166` |
| latest subject | `feat(blogger): wire article bottom adsense dry-run` |
| `npm run validate:content` | 0 errors / 94 warnings / 84 posts |
| `npm run check:adsense-resolver` | 34 passed / 0 failed |
| `npm run check:adsense-article-block` | 13 passed / 0 failed |
| `npm run check:adsense-anchor-wiring` | 14 passed / 0 failed |
| `npm run build:blogger` | success |

---

## 3. Target single post

- local generated file：`dist-blogger/posts/we-media-myself2/post.html`
- target post slug/key：`we-media-myself2`
- target Blogger published URL：**user 須於實際 repost 前確認**（frontmatter 無 `publishedUrl`；先前記錄之候選 `https://babel-lab.blogspot.com/2026/05/we-media-myself2.html` 須 user 核對）
- **只先重貼一篇；無批次 repost。**

---

## 4. Expected generated output summary（由本 phase build dry-run 驗證）

- 恰 **一個** Blogger AdSense block
- slotKey：`articleAd6`
- anchor：`beforeRelatedLinks`
- position：在**下方 affiliate / commerce block 之後、related links 之前**
- 無 `articleAd1`–`articleAd5`
- 無 legacy slots（postTop / postMiddle / postBottom / sidebar / homeInline）
- 無 raw EJS leakage（`<%` / `%>` / `await include`）/ 無 `undefined`
- real id 一律 masked（client `ca-pub-…****`、slot `…****`）

---

## 5. Pre-repost backup checklist

- [ ] 備份 live Blogger 文章 HTML（重貼前的後台原始 HTML）
- [ ] 備份 / 匯出 Blogger 主題（theme）
- [ ] 記錄備份檔名 / timestamp / 存放位置
- [ ] 擷取目前 live 文章截圖（桌機 + 手機）
- [ ] 確認 target Blogger published URL
- [ ] 確認已登入正確的 Blogger 帳號 / blog
- [ ] 確認文章編輯器為 **HTML 檢視**，非視覺編輯器

---

## 6. Theme CSS readiness checklist

- [ ] 確認主題已支援或可安全顯示：
  - `.lab-affiliate-box`
  - `.adsbygoogle`
  - `.lab-ad-slot--articleAd6`
  - related links section classes（`.lab-related-links` / `__list` / `__item` / `__link` / `__platform`）
- [ ] 若 CSS 缺失 → **STOP**；在另立 CSS / theme plan 前不得 repost
- [ ] 實際 repost 中**不修改主題**，除非另行批准

---

## 7. Manual repost procedure outline

1. `npm run build:blogger`
2. 開啟 `dist-blogger/posts/we-media-myself2/post.html`，複製其內容
3. 開啟 Blogger target 文章
4. 切換到 **HTML 模式**
5. **只替換文章 body**，不動主題
6. 先 **預覽**（不要直接發布）
7. 驗證桌機預覽
8. 驗證手機預覽
9. 預覽通過後才 publish / update
10. **不碰其他文章**

---

## 8. Preview acceptance checklist

- [ ] 標題 / 內文可見
- [ ] affiliate / commerce blocks 存在
- [ ] 恰 **一個** AdSense placeholder / block 在預期位置
- [ ] related links 仍在廣告**下方**
- [ ] 無重複 ad block
- [ ] 桌機無破版
- [ ] 手機無破版
- [ ] 無可見的 EJS / template 文字
- [ ] 若有 inspect → 無明顯 console / runtime 問題
- [ ] 廣告未即時填充屬正常（AdSense 端 fill 有延遲；非破版即可接受）

---

## 9. Rollback procedure

- 預覽失敗（發布前）：丟棄變更 / 關閉不更新
- 已發布後發現問題：還原備份的 live Blogger HTML
- CSS / theme 問題：若曾動主題，還原 theme 備份
- **不要 rollback repo**，除非 repo 輸出本身被證明錯誤
- 保留 rollback 後截圖

---

## 10. Risk list

- live 文章營收 / 版面風險（既有 AdSense 收益文章）
- Blogger 編輯器可能改寫 HTML
- AdSense 可能不會即時 render
- 生成輸出與 live theme 之間 CSS 不一致
- 意外重複 ad block
- 選錯 blog / 帳號 / 文章

---

## 11. Non-goals

- 無批次 repost
- 無 theme edit
- 無 GitHub Pages deploy
- 無 AdSense backend change
- 無 Admin UI
- 無 renderer redesign
- 無新 ad slot
- 無 articleAd1–5 Blogger rollout

---

## 12. Recommended next phase

**`20260611-pm-12-blogger-adsense-phase-d-single-post-repost-readiness-acceptance-readonly-a`** — 本計畫之 **read-only acceptance**（非實際 repost）。

**🔴 實際 manual repost 仍另行 BLOCKED，須 user explicit approval。**

---

（本文件結束）
