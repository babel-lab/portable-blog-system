# 20260618 ADMIN K9 — Multi-click Determinism Smoke Browser PASS Record

> Phase: `20260618-pm-admin-k9-multiclick-determinism-browser-pass-record-docs-only-a`
> Type: docs-only evidence record（不改 implementation；write path 不變；Apply 維持 disabled；copy buttons 維持 clipboard-only）

## Phase name

`20260618-pm-admin-k9-multiclick-determinism-browser-pass-record-docs-only-a`

## Baseline before docs record

| 項目 | 值 | 對照 expected |
| --- | --- | --- |
| pwd | `/d/github/blog-new/portable-blog-system` | ✅ |
| branch | `main` | ✅ |
| HEAD (full) | `d311108ba7b13a25be0007f3e17b8f46fc23f0c6` | ✅ |
| HEAD (short) | `d311108` | ✅ |
| origin/main | `d311108` | ✅ |
| HEAD == origin/main | ✅ | ✅ |
| latest subject | `docs(admin): record k8 browser pass` | ✅ |
| working tree | clean | ✅ |
| ahead / behind | `0 / 0` | ✅ |

→ Baseline 完全符合凍結基線。未 pull / merge / reset / rebase / amend / force-push。

## K9 definition

K9 = B8 multi-click determinism smoke 截圖/evidence 補強。

目的：確認 Static payload preview 在**相同 selected field、相同輸入**下，多次點擊 `Compute payload preview` 所產生的 **Payload JSON 與 Command preview 完全一致**（deterministic；同輸入恆同輸出）。屬非阻塞 smoke 補強，不碰 source。

## Evidence source

- Dean 本機 browser test，2026-06-18 17:50（台灣時間）
- 佐證：截圖 + 手動觀察（Dean 提供）
- Claude 端未啟動 dev server、未獨立 fetch、未自行截圖；本記錄純轉述 Dean evidence summary

## Tested URL

- `http://localhost:5173/admin/#posts`（dev-mode-only Admin；noindex；不進 prod build / sitemap / deploy）

## Tested field / value

- Test field：`coverAlt`
- Input value：`test222`
- Target post path：`content/blogger/posts/20260612-daily-reading-habit-notes.md`
- Payload preview observed：`field: coverAlt` / `newValue: test222` / `"dryRun": true`
- Command preview observed：`node src/scripts/admin-write-cli.js --payload=<temp.json>`（無 `--apply`）

## PASS checklist（Dean observation）

| # | 項目 | 結果 |
| --- | --- | --- |
| 1 | Compute #1 產生 Payload JSON / Command preview | ✅ |
| 2 | Compute #2 之 Payload JSON / Command preview 與 #1 逐字一致 | ✅ |
| 3 | Compute #3 之 Payload JSON / Command preview 與 #1 逐字一致 | ✅ |
| 4 | 多次點擊期間 selected field 維持 `coverAlt` | ✅ |
| 5 | 多次點擊期間 payload `newValue` 維持 `test222` | ✅ |
| 6 | payload 保留 `"dryRun": true` | ✅ |
| 7 | command preview 保留無 `--apply` | ✅ |
| 8 | copy buttons 維持 clipboard-only | ✅ |
| 9 | Apply button 維持 disabled | ✅ |
| 10 | DevTools Network 多次點擊皆無 admin write / API / payload upload / Blogger / GitHub write request | ✅ |

### Console note（非 K9 blocker）

- 可見 console warning（瀏覽器擴充套件雜訊類），研判與 K9 無關，**非 blocker**。

## Non-goals（本次確認維持）

- no write path
- no auto-compute behavior change（preview 仍須 user 手動點 Compute）
- no auto-open behavior change（payload preview panel 不自動展開）
- no payload file
- no Admin Apply enablement
- no Blogger / GitHub write

## Safety invariants confirmed

- `dryRun: true` 維持不變
- command preview 維持無 `--apply`
- copy buttons 維持 clipboard-only
- Apply button 維持 disabled
- write path 維持 dormant / 不變
- DevTools Network 無任何 write / API / upload request

## Final verdict

**K9 browser PASS** — multi-click determinism smoke 經 Dean 本機 browser evidence 確認：相同 selected field（`coverAlt`）+ 相同輸入（`test222`）下，三次 `Compute payload preview` 之 Payload JSON 與 Command preview 逐字一致，safety invariants 全保留。multi-click determinism smoke closed（待 Dean final acknowledgement）。
