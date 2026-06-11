# Blogger AdSense Phase D — Readiness / Handoff Packet

Phase: `20260611-pm-13-blogger-adsense-phase-d-readiness-packet-handoff-a`

## 1. Status

- **docs-only user-facing readiness / handoff packet**
- **no repost performed**；本 phase 不開 Blogger、不貼、不發布
- 供 human operator 日後**安全地**手動執行 single-post repost
- **actual live repost 仍 🔴 BLOCKED，須 user 審閱本 packet 後 explicit approval**

> ⚠️ 本文件不含 real AdSense client / slot id；一律 `slotKey`（`articleAd6`）/ masked（client `ca-pub-…****`、slot `…****`）。real id 僅存 `content/settings/ads.config.json`。

---

## 2. Current accepted baseline

| 項目 | 值 |
|---|---|
| HEAD / origin/main | `add290a` |
| latest subject | `docs(blogger): plan single post adsense repost` |
| `npm run validate:content` | 0 errors / 94 warnings / 84 posts |
| `npm run check:adsense-resolver` | 34 passed / 0 failed |
| `npm run check:adsense-article-block` | 13 passed / 0 failed |
| `npm run check:adsense-anchor-wiring` | 14 passed / 0 failed |
| `npm run build:blogger` | success |

See also：`docs/20260611-blogger-adsense-phase-d-single-post-repost-plan.md`（pm-11 計畫本體）。

---

## 3. Target

- post slug/key：`we-media-myself2`
- local generated HTML：`dist-blogger/posts/we-media-myself2/post.html`（由 `npm run build:blogger` 產出）
- live Blogger URL：**user 須於 repost 前確認**（候選 `https://babel-lab.blogspot.com/2026/05/we-media-myself2.html`，待 user 核對）
- **只重貼一篇；無批次。**

---

## 4. Six required pre-repost inputs（operator 須逐項填）

- [ ] 確認的 live Blogger 文章 URL：`__________`
- [ ] 確認正確的 Google / Blogger 帳號：`__________`
- [ ] 確認正確的 blog：`__________`
- [ ] 現有 live HTML 之備份位置：`__________`
- [ ] theme CSS readiness verdict（PASS / FAIL，見 §6）：`__________`
- [ ] before / after 截圖存放位置（桌機 + 手機）：`__________`

---

## 5. Manual operator checklist

1. `npm run build:blogger`（產出最新 `dist-blogger/posts/we-media-myself2/post.html`）
2. 開啟 Blogger 文章編輯器
3. 切換到 **HTML 模式**（非視覺編輯器）
4. **先備份**現有 live HTML（複製存檔，記錄檔名 / timestamp / 位置）
5. 驗證 target 文章身分（URL / 標題 / slug 一致）
6. 備份完成後，才貼上生成的完整 HTML（**只換 body，不動主題**）
7. **先預覽**：桌機 + 手機
8. 全部檢查通過後才 publish / update
9. **不碰其他文章**

---

## 6. Theme / CSS readiness gate

確認 live 主題已支援或可安全顯示下列 class group；**任一缺失 → STOP，不得 repost**（須另立 CSS / theme plan）：

- [ ] `.lab-affiliate-box`（commerce / affiliate）
- [ ] `.adsbygoogle`（AdSense `<ins>`）
- [ ] `.lab-ad-slot--articleAd6`（本次 ad 版位）
- [ ] related links classes（`.lab-related-links` / `__list` / `__item` / `__link` / `__platform`）

**實際 repost 中不修改主題，除非另行批准。**

---

## 7. Expected output checklist（對照生成 HTML）

- [ ] 恰 **一個** `articleAd6` / `beforeRelatedLinks` Blogger AdSense block
- [ ] 位置：在**下方 affiliate / commerce 區塊之後、related links 之前**
- [ ] 無 `articleAd1`–`articleAd5`
- [ ] 無 legacy slots（postTop / postMiddle / postBottom / sidebar / homeInline）
- [ ] 無 raw EJS（`<%` / `%>` / `await include`）
- [ ] 無 `undefined` / `null` 字樣
- [ ] related links 完整
- [ ] commerce / affiliate blocks 完整

> 本 session dry-run 對 `dist-blogger/posts/we-media-myself2/post.html` 之實測：1 個 `lab-ad-slot--articleAd6`（client `ca-pub-…****` / slot `…****`），位於 affiliate bottom 後、related links 前；無 articleAd1–5、無 legacy slot、無 EJS leak；2 affiliate boxes + 1 related links 完整。

---

## 8. Rollback procedure

- **發布前**：預覽失敗 → 丟棄變更 / 關閉編輯器不更新
- **發布後**：發現問題 → 用備份的 live HTML 還原文章
- CSS / theme 問題：若曾動主題（本流程不應動）→ 還原 theme 備份
- **不要 rollback repo**，除非 repo 輸出本身被證明錯誤
- 保留 rollback 後截圖

---

## 9. GO / NO-GO table

| 判斷 | 條件 |
|---|---|
| ✅ **GO** | backup 完成 **且** CSS readiness PASS **且** 預覽（桌機+手機）通過 **且** target 身分正確 **且** 恰一個 ad block |
| 🔴 **NO-GO** | 任一不符：位置 / 內容 mismatch、重複 ad block、template leak、選錯帳號 / blog / 文章、缺備份、視覺編輯器改寫 HTML 風險 |

廣告未即時填充屬正常（AdSense 端 fill 延遲）；非破版即可接受。

---

## 10. Non-goals

- 無批次 repost
- 無 theme edit
- 無 GitHub Pages deploy
- 無 AdSense backend change
- 無新 ad slot
- 無 real full AdSense id 進本 doc

---

## 11. Final handoff summary

**已就緒（ready）**：
- repo 端 Blogger surface wiring 已完成並驗收（pm-8 policy + pm-10 Phase C build wiring；commit `2b1f166`）。
- 生成 HTML 可由 `npm run build:blogger` 重現於 `dist-blogger/posts/we-media-myself2/post.html`，dry-run 實測符合 §7。
- 計畫（pm-11）與本 readiness packet（pm-13）docs 齊備。

**仍 blocked**：
- 實際 live Blogger repost（手動、out-of-repo、覆蓋既有 AdSense 營收文章）。

**actual repost 前所需的 user approval**：
1. 確認 live Blogger URL / 帳號 / blog（§4）。
2. 完成備份（live HTML + theme + 截圖）並提供位置（§4–§5）。
3. theme CSS readiness verdict = PASS（§6）。
4. explicit 「approve Phase D single-post repost」指令。

---

（本文件結束）
