# GA4 Param Allowlist — DebugView Live Verification Evidence Record（full / PASS）

- **日期 / 時間**：2026-06-24（Asia/Taipei）
- **性質**：**docs-only**（不改 source / 不 build / 不 deploy / 不碰 GA4 backend）
- **scope**：記錄 Dean 手動於 GA4 **DebugView** 之 full raw-param 驗收結果。本記錄為 **full live verification**，將前一份 Realtime-only 記錄之 raw-param WATCH 維度升為 **PASS**。
- **驗收對象**：`feat(ga4): allowlist-filter forwarded event params (drop raw url fields)`（commit `bb56ea6`）落地之 GA4 event param allowlist filter，於 **GitHub Pages live site** 之實際行為
- **measurementId**：`G-C77SMPF8VD`（`content/settings/ga4.config.json`）
- **evidence basis**：**Dean 提供之手動 GA4 DebugView 觀察 only**；Claude 未登入 GA4、未獨立驗證 GA4 backend、未獨立 fetch live source。

---

## 1. Repo baseline（記錄當下）

| Item | Value |
|---|---|
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `14cb8e0289c42e4d5af60678b75809d3a93d9dfa`（short `14cb8e0`） |
| origin/main | `14cb8e0289c42e4d5af60678b75809d3a93d9dfa`（== HEAD） |
| ahead/behind | `0 / 0` |
| working tree | clean |

---

## 2. DebugView enabled — device stream WATCH → PASS

- 啟用 debug mode / GA Debugger 後，**DebugView device stream 出現**。
- DebugView 顯示之 events 包含：
  - `click_other_link`
  - `click_affiliate_cta`
  - `click_related_link`
- **DebugView device stream：WATCH → PASS**（前一份 Realtime-only 記錄為 WATCH / not available；本次已可見 debug device stream）。

---

## 3. 逐 event raw-param 觀察

### 3.1 `click_other_link`（article bottom nav）

**Observed present**：

```
click_area
nav_direction
post_slug
surface
target_slug
```

**Observed absent**：

```
target_url
```

**Verdict**：
- `click_other_link` bottom-nav allowlist：**PASS**
- `target_url` drop：**PASS**

> 篩文章底部導覽口徑：`event_name = click_other_link` **加** `click_area = article_bottom_nav` 雙條件（per CLAUDE.md §3a GA4 紅線）。

### 3.2 `click_affiliate_cta`

**Observed present**：

| param | 觀察值 |
|---|---|
| `link_type` | `affiliate` |
| `provider` | `通路王` |
| `placement` | `article_bottom` 或 `article_top` |
| `link_label` | present（若 DebugView 內可見）|
| `post_slug` | allowlist 期待保留 |

**Observed absent**：

```
link_url
outbound
link_source_key
```

**Verdict**：
- `click_affiliate_cta` D4 params：**PASS**
- `click_affiliate_cta` raw-param drop：**PASS**

### 3.3 `click_related_link`

**Observed present**：

| param | 觀察值 |
|---|---|
| `link_type` | `cross_site` |
| `placement` | `related_links` |
| `link_label` | `貝果書屋-AI玩轉自媒體的52個商業思維` |
| `post_slug` | `we-media-myself2` |

**Observed absent**：

```
link_url
outbound
link_source_key
```

**Verdict**：
- `click_related_link` D4 params：**PASS**
- `click_related_link` raw-param drop：**PASS**

---

## 4. Overall verdict（更新）

| 維度 | 結果 |
|---|---|
| Realtime event arrival | **PASS** |
| DebugView device stream | **PASS**（前次 WATCH → 本次升 PASS）|
| D4 registered params live in DebugView | **PASS**（`link_type` / `provider` / `placement` / `link_label`）|
| `click_affiliate_cta` | **PASS** |
| `click_related_link` | **PASS** |
| `click_other_link`（bottom nav）| **PASS** |
| Raw-param allowlist live verification | **PASS** |
| **Overall GA4 allowlist live verification** | **PASS** |

**Dropped params verified absent（DebugView 端）**：

```
link_url
target_url
outbound
link_source_key
```

---

## 5. Important caveats

- evidence basis 為 **Dean 提供之手動 GA4 DebugView 觀察**；Claude **未登入 GA4**、**未獨立驗證 GA4 backend**。
- 本驗收為 **deploy 後** 於 GitHub Pages live site 之觀察。
- **Blogger 不在本驗收範圍**（Blogger 文章頁無 Vite listener，`data-ga4-*` 不 fire）。
- allowlist filter **不會** 從 static HTML 移除 raw `data-ga4-param-*` 屬性；它只阻止這些值 **forward 到 GA4**。本 PASS 是針對 **GA4 DebugView raw params**，**不是** HTML attr 之移除。

---

## 6. Cross-links

- GA4 allowlist **source landed**：commit `bb56ea6`（`feat(ga4): allowlist-filter forwarded event params (drop raw url fields)`）
- GitHub Pages **deploy completed**：gh-pages `70b33c2`
- `docs/20260624-ga4-param-allowlist-realtime-evidence-record.md`（前一份 Realtime-only 記錄；raw-param 當時 WATCH）
- `docs/20260624-ga4-param-allowlist-debugview-manual-acceptance-checklist.md`（驗收 SOP；§3 精確 param 口徑）
- `docs/20260624-ga4-d4-data-flow-window-complete-evidence-record.md`（D4 四維度 data-flow 證據）
- `src/js/modules/link-tracker.js`（`GA4_PARAM_ALLOWLIST` / `filterGa4EventParams()` / listener）
- `src/scripts/check-ga4-param-allowlist.js`（回歸 smoke）
- `content/settings/ga4.config.json`（measurementId `G-C77SMPF8VD`）

---

## 7. 本記錄 explicit non-actions

- no source / generated output / package / lockfile / content / settings / schema / validator change
- no build / deploy / dev / preview
- no existing-docs modification（only one new docs file added）
- no Admin write path / dryRun:false / --apply
- no Blogger / GA4 / AdSense / Search Console / Drive / Google Form backend action
- no GA4 login / no independent backend verification / no independent live fetch
- no force-push / amend / rebase

---

（本文件結束）
