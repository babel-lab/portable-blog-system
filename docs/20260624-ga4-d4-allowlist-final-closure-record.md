# GA4 D4 / Param Allowlist — Final Closure Record

**Date:** 2026-06-24（Asia/Taipei）
**Type:** docs-only final closure rollup（summary only；不重複各 evidence record 之逐項細節）

---

## 1. Scope

- docs-only final closure rollup record。
- **無** source / build / deploy / GA4 backend 動作（本 record 僅彙整既有已落地證據）。
- Evidence basis = Dean 手動 GA4 截圖 / 觀察 + 先前已 commit 之 evidence records（見 §5）。
- Claude **未登入 GA4**、未獨立 fetch GA4 backend；live 數據以 Dean 手動驗收為準。

---

## 2. Baseline

| 項目 | 值 |
| --- | --- |
| current main baseline | `4360d34` |
| source allowlist commit（Route B） | `bb56ea6` |
| gh-pages deploy commit | `70b33c2` |
| Realtime evidence | `14cb8e0` |
| DebugView live verification evidence | `4360d34` |

---

## 3. Final verdict

**D4 custom dimensions populated — PASS**

- `link_type`
- `provider`
- `placement`
- `link_label`

**Deferred fields NOT registered as custom dimensions — PASS**

- `link_url`
- `target_url`
- `outbound`
- raw URL 類欄位

**Per-line verdicts**

| 驗收線 | 結果 |
| --- | --- |
| Raw-param allowlist source（Route B） | PASS |
| GitHub Pages live deploy | PASS |
| Realtime stream | PASS |
| DebugView device stream | PASS |
| `page_view` / event stream | PASS |
| `click_affiliate_cta` | PASS |
| `click_related_link` | PASS |
| `click_other_link`（bottom-nav） | PASS |
| Raw-param live drop verification | PASS |

**Raw-param live drop — verified absent in DebugView raw params**

- `link_url` absent
- `target_url` absent
- `outbound` absent
- `link_source_key` absent

**Overall GA4 D4 / allowlist line — CLOSED / PASS**

---

## 4. Important caveats

- **Blogger 不在本 scope。** 本 closure 僅針對 GitHub Pages GA4 click tracking allowlist。
- **Route B 不移除 static HTML 中之 raw `data-ga4-param-*` attrs**；它只阻止這些 raw 欄位被 forward 給 GA4。live deploy 後 static HTML 內仍可見 raw params，屬預期。
- Deployed asset hash 可能因未來 build 改變；本 closure 綁定的是 **deployed allowlist behavior**，而非某個永久 filename / asset hash。
- 若有提及 Measurement ID，依既有紀律維持 masked。

---

## 5. Cross references

- `docs/20260624-ga4-d4-data-flow-window-complete-evidence-record.md`
- `docs/20260624-ga4-param-allowlist-realtime-evidence-record.md`
- `docs/20260624-ga4-param-allowlist-debugview-manual-acceptance-checklist.md`
- `docs/20260624-ga4-param-allowlist-debugview-live-verification-record.md`
- source commit `bb56ea6`
- deploy commit `70b33c2`
- baseline `4360d34`

---

## 6. Future notes

- 無立即 source work 需求。
- 以下 optional future work **僅在 explicit approval 下**進行：
  - Blogger-side click tracking（若日後需要）
  - HTML attr cleanup Route C（若 Dean 日後想要 defense-in-depth）
  - GA4 report / explore follow-up（24–72h aggregation 後）
  - CLAUDE.md validation / current-state sync（僅在另行核准下）
