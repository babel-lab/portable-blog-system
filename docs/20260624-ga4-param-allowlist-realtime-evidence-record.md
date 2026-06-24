# GA4 Param Allowlist — Realtime Evidence Record（partial / Realtime-only）

- **日期 / 時間**：2026-06-24 13:30（Asia/Taipei）
- **性質**：**docs-only**（不改 source / 不 build / 不 deploy / 不碰 GA4 backend）
- **scope**：記錄 Dean 手動於 GA4 **Realtime / 即時** 與 **DebugView** 之觀察。本記錄為 **partial（Realtime-only）**，**非** full raw-param 驗收。
- **驗收對象**：`feat(ga4): allowlist-filter forwarded event params (drop raw url fields)`（commit `bb56ea6`）落地之 GA4 event param allowlist filter，於 **GitHub Pages live site** 之實際行為
- **measurementId**：`G-C77SMPF8VD`（`content/settings/ga4.config.json`）
- **evidence basis**：**Dean 提供之手動 GA4 Realtime / DebugView 觀察（screenshots）only**；Claude 未登入 GA4、未獨立 fetch live source、未做任何 backend 驗證。

> 本記錄只把 Dean 已觀察到的東西如實落檔。raw-param drop（`link_url` / `target_url` / `outbound` / `link_source_key` 不 forward）**尚未**於 DebugView 驗證 → 仍 WATCH，不得宣告 full PASS。

---

## 1. Repo baseline（記錄當下）

| Item | Value |
|---|---|
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `4d595556c7a00b1a90bfe8b766e69b24c60cb01c`（short `4d59555`） |
| origin/main | `4d595556c7a00b1a90bfe8b766e69b24c60cb01c`（== HEAD） |
| ahead/behind | `0 / 0` |
| working tree | clean |
| latest commit | `docs(ga4): add allowlist debugview checklist` |

---

## 2. Dean 觀察 — Realtime / 即時總覽（GitHub Pages live 造訪後）

- **active users**：1
- **views**：4
- **visible event names**：
  - `page_view`
  - `scroll`
  - `click`
    - `click_other_link`
    - `click_affiliate_cta`
- **visible page paths**：
  - `/portable-blog-system/`
  - `/portable-blog-system/posts/we-media-myself2/`
- **also visible（mixed / legacy / Blogger path context）**：
  - `/2026/04/we-media-myself.html`（Blogger 路徑；非 GitHub Pages listener 範圍；僅作 mixed/legacy context 記錄，不過度解讀）

---

## 3. Dean 觀察 — DebugView

- **debug device count**：0
- 過去 30 分鐘**無 debug events**
- 推定原因：該瀏覽器 session 未啟用 `debug_mode` / GA Debugger
- 結論：**event parameters 無法檢視** → allowlist drop set 尚未驗證

---

## 4. Verdict（分層；對齊 Dean 口徑）

| 維度 | 結果 | 說明 |
|---|---|---|
| Realtime event arrival | **PASS** | GitHub Pages live session 抵達 GA4（active users 1 / views 4）；`page_view` / `scroll` / `click`（含 `click_other_link` / `click_affiliate_cta`）可見；page paths `/portable-blog-system/`、`/portable-blog-system/posts/we-media-myself2/` 確認 |
| GitHub Pages live tracking（event arrival） | **PASS-light** | deploy 後事件有抵達；event parameters 未檢視 |
| DebugView device stream | **WATCH / not available** | debug device count 0；過去 30 分鐘無 debug events；`debug_mode` / GA Debugger 未啟用 |
| Param allowlist live verification（raw-param drop） | **WATCH** | `link_url` / `target_url` / `outbound` / `link_source_key` 之 **absence 尚未驗證**。 |
| **Overall GA4 allowlist live verification** | **PARTIAL / WATCH — not full PASS** | Realtime 確認事件抵達，但 param filtering 尚未驗證。 |

> **明確口徑（caveat）**：
> - **不**宣稱 `link_url` / `target_url` / `outbound` / `link_source_key` 已 absent from GA4。
> - 只能說：這些 param 的 **absence 尚未驗證**。
> - 仍需 **DebugView（啟用 `debug_mode`）或 BigQuery / event-param inspection** 才能確認 param filtering。
> - Realtime 只確認 **event arrival**，**不**確認 **param filtering**。

---

## 5. Next step（下一輪，非本記錄範圍）

1. 啟用 **GA Debugger / `debug_mode`**（使 session 進 DebugView）。
2. **重開 GitHub Pages live site（不是 Blogger）** 之測試文章；確認載入新 entry bundle。
3. 點 **affiliate CTA / related link / bottom nav** 各一次。
4. 於 **DebugView 檢查 raw params**，逐項核對 checklist §3 表。

**Expected keep（跨三 event 之 allowlist 聯集；per event 子集見 checklist §3）**：

```
link_type
provider
placement
link_label
post_slug
surface
click_area
nav_direction
target_slug
```

**Expected drop（一律不 forward）**：

```
link_url
target_url
outbound
link_source_key
```

5. 若 DebugView raw params 與上述一致（keep 全在 / drop 全不在），再另開一份 **full live-verification** evidence record（建議 `docs/20260624-ga4-param-allowlist-live-verification-record.md`），屆時方可將 raw-param 維度由 WATCH 升 PASS。本記錄維持 partial / Realtime-only。

---

## 6. Cross-links

- GA4 allowlist **source landed**：commit `bb56ea6`（`feat(ga4): allowlist-filter forwarded event params (drop raw url fields)`）
- GitHub Pages **deploy completed**：gh-pages `70b33c2`
- `docs/20260624-ga4-param-allowlist-debugview-manual-acceptance-checklist.md`（驗收 SOP；§3 精確 param 口徑）
- `docs/20260624-ga4-d4-data-flow-window-complete-evidence-record.md`（D4 四維度 data-flow 證據）
- `src/js/modules/link-tracker.js`（`GA4_PARAM_ALLOWLIST` / `filterGa4EventParams()` / listener）
- `src/scripts/check-ga4-param-allowlist.js`（回歸 smoke）
- `content/settings/ga4.config.json`（measurementId `G-C77SMPF8VD`）

---

## 7. 本記錄 explicit non-actions

- no source / generated output / package / lockfile / content / settings / schema change
- no build / deploy / dev / preview
- no add / commit / push（除非後續 Dean 明確批准）
- no Admin write path / dryRun:false / --apply
- no Blogger / GA4 / AdSense / Search Console / Drive / Google Form backend action
- no GA4 login / no independent live fetch
- **no claim of full raw-param verification**（raw-param drop 仍 WATCH）

---

（本文件結束）
