# SP-8 — platformPolicy sub-field shallow shape validator（warning-only；additive）

> Phase：`20260623-pm-sp8-platform-policy-shape-validator-a`（2026-06-23）
> Baseline：`main @ 38c0dfd`（HEAD == origin/main，ahead/behind 0/0，working tree clean）
> 前身：`docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2，§2.50 把 platformPolicy 巢狀 shape 標 deferred）

本 phase 落地 SP-2 deferred 之 platformPolicy 巢狀 shape 檢查。**純 additive warning-only validation layer**；**不改** build / render / listing / sitemap / archive / category / tag / Blogger / GitHub Pages / Admin 任何行為，亦**不消費** platformPolicy 於任何 output 邏輯。

---

## 1. SP-8 之前（SP-2 行為）

- `platformPolicy` present 但非 plain object → `page-platform-policy-invalid-type`（rule 3）。
- 巢狀 per-platform 子欄位 shape = deferred（SP-2 §2.50）。

## 2. SP-8 desired behavior（本 phase）

- **Missing platformPolicy 不警**（不變）。
- `platformPolicy` 非 object → 仍只走 SP-2 rule 3（行為逐字不變）。
- `platformPolicy` 為 plain object → 額外做「shallow」巢狀 shape 檢查（全 warning-only）。

allowed structure（shallow：platformPolicy → platform object 一層 → leaf 值）：

```yaml
platformPolicy:
  github:
    indexing: inherit
    includeInListings: inherit
    includeInSitemap: inherit
  blogger:
    indexing: inherit
  future:
    indexing: inherit
```

- Recommended platform keys：`github` / `blogger` / `future`
- Recommended nested keys：`indexing` / `includeInListings` / `includeInSitemap` / `includeInFeeds` / `canonical` / `note`
- Recommended nested values：
  - `indexing`：`inherit` / `index` / `noindex-follow` / `noindex-nofollow`
  - `includeInListings` / `includeInSitemap` / `includeInFeeds`：`inherit` / `true` / `false`
  - `canonical`：non-empty string 或 `inherit`
  - `note`：string

---

## 3. Warning-only sub-rules added（`validatePageTypeMetadata`，src/scripts/validate-content.js）

全部 severity = `warning`；嚴禁 error。只在 `platformPolicy` 為 plain object 時評估（與 SP-2 rule 3 互斥）。

| # | rule type | 觸發條件 |
|---|---|---|
| 1 | `page-platform-policy-unknown-platform` | 非建議 platform key（非 github/blogger/future）。仍續做該 entry 之 shape 檢查。 |
| 2 | `page-platform-policy-platform-invalid-type` | platform entry present 但非 plain object（不 recurse）。 |
| 3 | `page-platform-policy-unknown-field` | platform object 內非建議 nested key（不 recurse 進其 value）。 |
| 4 | `page-platform-policy-indexing-invalid` | `indexing` 值非合法列舉（含非 string）。 |
| 5 | `page-platform-policy-flag-invalid` | `includeInListings`/`includeInSitemap`/`includeInFeeds` 值非 `inherit`/`true`/`false`。 |
| 6 | `page-platform-policy-canonical-invalid` | `canonical` 非 non-empty string（含空字串 / 非 string）。message **不** echo canonical 值本身。 |
| 7 | `page-platform-policy-note-invalid` | `note` 非 string。 |
| 8 | `page-platform-policy-suspicious-field` | platform key 或 nested key 名稱命中 secret-like 名單（重用 `GATED_DOWNLOAD_DISALLOWED_KEYS`：token/secret/password/apiKey/authorization/bearer/driveFolderId/responses…）。**僅比對 key 名稱、不檢查 value；message 不 echo value**；命中即跳過該 entry/leaf 之後續 shape 檢查（避免 recurse 進可能含 secret 的 value）。 |
| 9 | `page-platform-policy-nested-object-deferred` | 建議 nested key 但其 value 為巢狀 object/array（超出 shallow platform object）→ 標 deferred，**不 recurse** 進該 value。 |

**Shallow 保證**：只掃 platform key 一層 + 每個 platform object 內 nested key 一層；leaf 為 object/array 一律標 deferred 不展開。secret-safety：suspicious key 與 unknown nested key 命中時 **continue**，不讀/不 echo 其 value。

---

## 4. Fixtures / tests

**Fixtures（9 個，`content/validation-fixtures/github/posts/_test-page-platform-policy-*.md`）** —— 沿用既有 validation-fixtures 慣例（僅被 `validate-content` main entry 掃描，不被 build:github/blogger/promotion 掃到）：

- valid（0 新 warning）：`minimal-valid`
- invalid（各觸發 1 條對應 warning）：`unknown-platform` / `platform-not-object` / `unknown-field` / `indexing-invalid` / `flag-invalid` / `canonical-invalid` / `note-invalid` / `suspicious-field`

**Smoke harness**：`src/scripts/check-page-type-validator.js` —— 既有 20 SP-2 case 全保留，新增 17 case（21–37）涵蓋全 9 sub-rule + valid object + flag/canonical inherit 合法 + suspicious 不 echo value + nested-object deferred + SP-2 rule 3 非 object 不變 + 雙 warning 獨立性。**37/0 PASS**（自含；zero new dependency；未加 package.json script）。

---

## 5. Validation results（before → after）

| 量測 | before | after | Δ |
|---|---|---|---|
| `npm run validate:content` | 0 / 104 / 94 | **0 / 112 / 102** | +8 warning / +8 issue-post |
| overlay（`--registry-overlay …commerce-c4-c9-overlay.json`） | 0 / 111 / 95 | **0 / 119 / 103** | +8 / +8 |
| `node src/scripts/check-page-type-validator.js` | 20 / 0 | **37 / 0** | +17 case |
| `node src/scripts/check-page-type-robots.js` | 29 / 0 | 29 / 0 | — |
| `node src/scripts/check-include-in-listings.js` | 16 / 0 | 16 / 0 | — |
| `node src/scripts/check-include-in-sitemap.js` | 19 / 0 | 19 / 0 | — |
| `node src/scripts/check-page-metadata-summary.js` | 22 / 0 | 22 / 0 | — |

- Δ +8 = 8 個 invalid fixture（各精準 1 條對應 warning）；valid fixture 貢獻 0 warning。
- **所有 `page-platform-policy-*` warning 皆落在 `_test-page-platform-policy-*` fixtures；production-post warnings 仍 0**（grep 確認無任一 production / current post 觸發）。
- error count 維持 **0**。

---

## 6. Output-preservation confirmation

- `src/scripts/validate-content.js` 變更 = 純 additive（新常數 + 新 helper `describeTypeof` + SP-8 block 接在 SP-2 rule 3 之後）；既有 SP-2 規則與所有其他 validator 邏輯逐字未動。
- platformPolicy 在 `src/` 內**除 validate-content.js 外無任何讀取**（per SP-2 §5 grep）→ build / render / listing / sitemap / Blogger / GitHub Pages 輸出 **by construction byte-identical**。
- 未動 `build-github.js` / `build-blogger.js` / `build-sitemap.js` / 任何 EJS / Admin UI / write path。
- 未動 `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache/`。
- 未動 `package.json` / lockfile / `CLAUDE.md` / `MEMORY.md` / production content posts / settings。
- 未動 `page-metadata-summary.js`（Admin badge / display 邏輯）；SP-7a 已記載 validator duplication，維持 as-is。

---

## 7. 已知 follow-up（deferred；非本 phase）

1. **`report:validation` + `check:validation-report` baseline drift**：`check-validation-report.js` 之 `BASELINE` pin 與 `.cache/data/validation-report.json`（gitignored / 本機 stale @ 2026-06-16，仍為 94/84）對照。SP-2 已使 live validate 104/94 與該 pin 脫鉤（deferred）；SP-8 再 +8 → live 112/102。本 phase **未** regenerate `.cache`（off-limits）→ 該 guard 對 stale cache 仍 green。下次在 PC `npm run report:validation` 重生 report 後須**同步**把 `BASELINE` 改為 `{ 0, 112, 102 }`（**本 phase 不改 check-validation-report.js / CLAUDE.md**；如重生後 guard 會 fail，先回報再 sync）。
2. platformPolicy value-based「巢狀 deep shape」檢查 → 仍 deferred（避免遞迴掃進可能含 secret 的 value；本 phase 只標 `nested-object-deferred`）。
3. platformPolicy 之 build / render / sitemap / listing / Admin 消費 → 未來 phase（本 phase 嚴禁）。

---

## 8. 不做事項（本 phase 邊界）

- ❌ 不消費 platformPolicy 於任何 build / render / listing / sitemap / Blogger / GitHub Pages / Admin output。
- ❌ 不 recurse 進 leaf 巢狀 object / 不讀 suspicious / unknown key 之 value。
- ❌ 不改 SP-2 既有規則行為（僅 additive sub-rules）。
- ❌ 不改 Admin badge 邏輯 / `page-metadata-summary.js`。
- ❌ 不改 CLAUDE.md / MEMORY.md / package.json / lockfile / `.cache` / dist / gh-pages / generated HTML。
- ❌ 不碰 Blogger / AdSense / GA4 / Search Console / Drive 後台。
- ❌ 不 build / deploy / preview / dev server / repost。
