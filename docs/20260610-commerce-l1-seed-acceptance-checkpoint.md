# Commerce L1 Seed — Acceptance Checkpoint

> **Phase**: `20260610-am-4-commerce-l1-seed-acceptance-docs-sync-only-a`
> **Mode**: **docs-only acceptance + baseline sync**。讀取 + 驗證 + 新增本 checkpoint 文件 + 最小 CLAUDE.md baseline 同步。**零** registry / src / posts / templates / views / dist / gh-pages / package / lockfile 變更；**不**做 production migration、Admin picker、renderer、deploy、Blogger repost、GA4、reverse UTM。
> **Created**: 2026-06-10 +0800（11:21 起始）
> **Predecessor**: `docs/20260610-commerce-blogger-tongluwang-l1-seed-result.md`（L1 seed result / audit）、`docs/20260610-commerce-blogger-tongluwang-seed-candidates-intake-preflight.md`（preflight + targetUrl policy）

---

## 1. Baseline verify（acceptance 前）

| 項目 | 值 |
| --- | --- |
| branch | `main` |
| HEAD | `1586d10`（`feat(commerce): append held blogger ebook link`）|
| HEAD vs origin/main | 相同（0/0）|
| working tree | clean |
| `npm run validate:content` | **0 errors / 69 warnings / 59 posts** |

→ 與起始預期 baseline 完全相符，繼續執行 acceptance（未觸發 stop 條件）。

---

## 2. Files read（read-only inspection）

- `CLAUDE.md`（§3.2 commerce-links.json landing point / 當前 baseline / commerce 治理紅線 段落）
- `content/settings/commerce-links.json`（registry 本體）
- `docs/20260610-commerce-blogger-tongluwang-l1-seed-result.md`（L1 seed result / audit）
- `src/scripts/validate-content.js`（commerce registry-level R-rules / content-ref C-rules 區塊；**未修改**）

---

## 3. Acceptance result

| 檢查項 | 期望 | 實測 | 結果 |
| --- | --- | --- | --- |
| `schemaVersion` | `1` | `1` | ✅ |
| registry entry 總數 | 10 | 10 | ✅ |
| active 數 | 10 | 10 | ✅ |
| held（`active:false`）數 | 0 | 0 | ✅ |
| excluded（KOBO / 金石堂電子書，不入 registry）| 1（不在 registry）| `book-rouhou-time-kingstone-ebook-books` 不在 registry | ✅ |
| `linkId` 唯一 | unique | 10/10 unique | ✅ |
| active entries 無空 `linkId` / `networkKey` / `targetUrl` | 0 筆缺值 | 0 筆缺值 | ✅ |
| 通路王 entries `networkKey` | 全 `books` | 10/10 = `books` | ✅ |
| `targetUrl` 保留 affiliate redirect（不 canonicalize、保留 `uid1=blog`）| 全保留 | 10/10 含 `uid1=blog`，未轉 canonical | ✅ |
| `npm run validate:content` | 0 / 69 / 59 | 0 / 69 / 59 | ✅ |

→ **全部通過。** registry 為 10 active / 0 held / 1 excluded；validate 維持 0 errors / 69 warnings / 59 posts。

### 3.1 不檢查 / 不碰範圍（本 acceptance scope 外）

Admin / renderer / Blogger post / GA4 / reverse UTM / deploy 全**未檢查、未修改**（per phase 紅線）。

---

## 4. Excluded / deferred 確認（仍未啟用）

| 項目 | 狀態 |
| --- | --- |
| `book-rouhou-time-kingstone-ebook-books`（金石堂電子書 = KOBO）| **excluded**；不在 registry；未來經**聯盟網**處理（deferred）|
| 聯盟網（`networkKey: affiliate-network`）| 未啟動（本輪不建）|
| renderer / Admin picker / C7 source | dormant（registry 非空，但無下游 consumer）|
| production content migration（raw url → `ref`）| 未啟動（Blogger posts 未改）|
| build / deploy / Blogger repost / GA4 / reverse UTM / pm-26 | dormant / BLOCKED |

---

## 5. Mutation result

- ✅ 本 checkpoint 文件（新增）
- ✅ `CLAUDE.md`：最小 baseline 同步（L1 seed 已完成 / 當前 baseline HEAD / registry 由 empty `[]` → 10 active；治理紅線不變）
- ❌ **零** `content/settings/commerce-links.json` 變更
- ❌ **零** `src/**` / posts / templates / views / dist / gh-pages / package / lockfile 變更
- ❌ **零** production migration / Admin / renderer / deploy / Blogger repost

---

## 6. Validation result（mutation 後）

`npm run validate:content` = **0 errors / 69 warnings / 59 posts**（與 baseline 相同；docs / CLAUDE.md 變更不影響 validator）。

---

## 7. Frozen baseline for next session

| 項目 | 值 |
| --- | --- |
| branch | `main` |
| HEAD（本 phase commit 後）| `docs(commerce): record l1 seed acceptance checkpoint`（push origin/main）|
| `npm run validate:content` | 0 errors / 69 warnings / 59 posts |
| commerce registry | 10 active / 0 held / 1 excluded（KOBO）；全 `networkKey: books`；schemaVersion 1 |
| overlay baseline | `node src/scripts/validate-content.js --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json` = 0 / 70 / 59 |

---

## 8. Next safe phase（建議；本記錄不預先授權）

各自須另開 phase + explicit approval，**不**於本記錄連動授權：

1. （未來）renderer fallback 落地 → 文章端改用 `affiliate.links[].ref` → production content migration（raw url → `ref`）→ build / deploy。
2. （未來）KOBO / 聯盟網 candidate intake（須 user 提供 `commerceSeedCandidates:` YAML + explicit approval；L2 settings-only seed gate 不變）。
3. （未來）`we-media-myself2.md` 金石堂 metadata label mismatch（聯盟網 → 通路王）修正。

紅線：commerce registry 永不含 credentials / token / API key / commission / payout / clickCount / respondent data / private Drive folder ID；`internalLabel` 嚴格不渲染；不以 URL pattern 自動推斷 key。

---

*（本文件結束 — L1 seed acceptance checkpoint；docs-only；registry 10 active / 0 held / 1 excluded；validate 0/69/59 不變；無 source / posts / renderer / build 變更。）*
