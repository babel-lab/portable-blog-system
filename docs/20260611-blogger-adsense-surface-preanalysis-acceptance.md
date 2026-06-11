# Blogger AdSense Surface Preanalysis Acceptance Checkpoint

Phase: `20260611-pm-5-blogger-adsense-surface-preanalysis-acceptance-checkpoint-docs-only-a`
Status: **docs-only acceptance checkpoint / no implementation**
Date: 2026-06-11 13:34 +0800

> 本文件把上一輪 read-only acceptance 的 PASS 結果固化為一份短紀錄，**不啟動任何 Blogger surface 實作**。唯一變更 = 新增本檔。

---

## 1. Phase accepted

- accepted phase：`20260611-pm-4-blogger-adsense-surface-preanalysis-acceptance-readonly-a`
- accepted artifact：`docs/20260611-blogger-adsense-surface-preanalysis.md`（preanalysis 本體，docs-only）

---

## 2. Accepted baseline

| 項目 | 值 |
|---|---|
| HEAD / origin/main | `d01687b` |
| branch | `main` |
| latest subject | `docs(adsense): add blogger surface preanalysis` |
| working tree | clean |

---

## 3. Accepted checks（上一輪實跑）

| 指令 | 結果 |
|---|---|
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts** |
| `npm run check:adsense-resolver` | **33 passed / 0 failed** |

---

## 4. Accepted commit scope

- single docs file added：`docs/20260611-blogger-adsense-surface-preanalysis.md`
- **191 insertions / 0 deletions**（pure addition）
- no src / config / content / template / view / package / package-lock / dist / gh-pages / cache drift

---

## 5. Preanalysis acceptance verdict

- **PASS**。
- N9 GitHub Pages AdSense remains **CLOSED / PASS**（repo-side；article ads 已 live）。
- Blogger AdSense surface remains **dormant / not implemented**（雙重 dormant：`build-blogger.js` 未 wire resolver + production policy `surfaces:["pages"]`）。
- repo-side 與 Blogger-side 責任維持分離：repo commit **不會**自動反映到 Blogger 已發布文章，須 user 手動重貼。

---

## 6. Strict non-goals（本 checkpoint）

- ❌ no deploy / gh-pages push。
- ❌ no Blogger mutation（不重貼、不碰 Blogger 後台）。
- ❌ no production renderer change（`build-blogger.js` / Blogger EJS 不動）。
- ❌ no AdSense backend change（不碰 AdSense 後台設定）。
- ❌ no real AdSense client / slot id exposure outside existing approved settings policy（real id 僅存 `content/settings/ads.config.json`；docs 一律 masked / `slotKey` / `anchor` / `articleAd1`..`articleAd6`）。
- ❌ no implementation started。

---

## 7. Next gate

- 實際 Blogger AdSense surface 上線 **必須**另開 user-approved phase，不在本 checkpoint 範圍。
- 下一個 implementation phase 必須：**small / reversible / single-post-first / test-gated**（對應 preanalysis §6 Phase B→E ladder）。
- 其餘 user-gated 路線維持 BLOCKED / dormant：commerce L2 seed（須 user YAML + approval）、download migration（須 real safe URL）、Blogger repost（須 user approval + 備份 + theme CSS）。

---

（本文件結束）
