# 20260618 ADMIN K8 — Field Auto-Switch / Auto-Follow Browser PASS Record

> Phase: `20260618-pm-admin-k8-field-auto-switch-browser-pass-record-docs-only-a`
> Type: docs-only evidence record（不改 implementation；write path 不變）

## Phase name

`20260618-pm-admin-k8-field-auto-switch-browser-pass-record-docs-only-a`

## Implementation commit under test

- `0a89983` `feat(admin): auto-follow payload preview field`
- 唯一改檔：`src/views/admin/index.ejs`（+14 lines，additive；`.dry-run-compute` handler 內 field auto-follow）
- source-level implementation phase：`20260618-am-admin-k8-field-auto-switch-implementation-a`（source-level PASS，Dean accepted）

## Browser acceptance source

- Dean 本機 browser test，2026-06-18 12:11（台灣時間）
- 佐證：截圖 + 手動觀察（Dean 提供）
- Claude 端未啟動 dev server、未獨立 fetch、未自行截圖；本記錄純轉述 Dean evidence summary

## Tested URL

- `http://localhost:5173/admin/#posts`（dev-mode-only Admin；noindex；不進 prod build / sitemap / deploy）

## K8 功能定義（under test）

在 Admin dry-run editor 中，使用者按下 `Show Dry-run Diff` 後，若某欄位有變動，`payload-preview-field` selector 自動切到「第一個有變動的欄位」；無變動時 selector 不動。Option 1 minimal conservative。

## PASS checklist（Dean observation）

| # | 項目 | 結果 |
| --- | --- | --- |
| 1 | Dry-run editor 從 post detail panel 開啟 | ✅ |
| 2 | `Show Dry-run Diff` 正確計算 changed count（觀察到 `1/4` / `2/4` / `3/4` / `4/4` / `0/4`） | ✅ |
| 3 | 單欄變動後 selector auto-follow 至該欄（titleEn / coverAlt / searchDescription / description 多欄編輯行為正常） | ✅ |
| 4 | no-change（`0/4`）時 selector 維持穩定、不亂跳 | ✅ |
| 5 | 多欄同時變動 → selector deterministic 切到第一個 changed field | ✅ |
| 5a | 多欄案例實測：changed fields 含 `description` 與 `titleEn` → selector landed on `description`（符合預期欄位順序 `description` → `searchDescription` → `titleEn` → `coverAlt`） | ✅ |
| 6 | `Compute payload preview` 後 payload JSON 之 `field` 對應目前 selector 欄位 | ✅ |
| 7 | payload JSON 保留 `"dryRun": true` | ✅ |
| 8 | command preview 無 `--apply`（為 `node src/scripts/admin-write-cli.js --payload=<temp.json>`） | ✅ |
| 9 | copy buttons 僅在點 `Compute payload preview` 後才 enable | ✅ |
| 10 | Apply button 維持 disabled | ✅ |
| 11 | DevTools Network 無 admin write / API / payload upload / Blogger / GitHub write request | ✅ |

### Console note（非 K8 blocker）

- 可見 console warning `ObjectMultiple contentscript.js... malformed chunk`，研判為**瀏覽器擴充套件雜訊**，與 K8 無關，**非 blocker**。

## Non-goals（本次確認維持）

- no write path
- no auto-compute（preview 仍須 user 手動點 Compute）
- no auto-open（payload preview panel 不自動展開）
- no payload file
- no Admin Apply enablement
- no Blogger / GitHub write

## Final verdict

**K8 browser PASS** — source-level + browser-level 雙重 PASS，ready to close K8（待 Dean final acknowledgement）。
