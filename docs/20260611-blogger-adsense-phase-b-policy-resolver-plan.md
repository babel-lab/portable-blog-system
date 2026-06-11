# Blogger AdSense Phase B Policy / Resolver Plan

Phase: `20260611-pm-6-blogger-adsense-phase-b-policy-resolver-plan-docs-only-a`

## Status

- **docs-only implementation plan**（規劃，非實作）
- no config / source / test / template / content mutation
- no Blogger mutation
- no deploy

> ⚠️ 本文件**不含** real AdSense client / slot id；一律以 `slotKey`（`articleAd1`..`articleAd6`）/ `anchor` 表述。real id **僅**存於 `content/settings/ads.config.json`。

---

## 1. Baseline

| 項目 | 值 |
|---|---|
| HEAD / origin/main | `a874280` |
| branch | `main` |
| latest subject | `docs(adsense): record blogger surface preanalysis acceptance` |
| working tree | clean |
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts** |
| `npm run check:adsense-resolver` | **33 passed / 0 failed** |

---

## 2. Current state summary

- GitHub Pages AdSense **N9 remains CLOSED / PASS**（article ads 已 live）。
- Blogger surface remains **dormant / not implemented**。
- repo-side 與 Blogger-side 責任分離：repo commit **不會**自動反映到 Blogger 已發布文章。
- **已自 `ads.config.json` 確認**：production `defaults.blocks[]` 共 6 block，每 block `surfaces: ["pages"]`（pages-only），且 `slots` 之 6 個 `articleAd1..6` 已有 real id、5 個 legacy slot（`postTop`/`postMiddle`/`postBottom`/`sidebar`/`homeInline`）為空字串。
- **雙重 dormant**（per preanalysis §3.3）：(a) `build-blogger.js` 未 wire resolver；(b) 即使 wire，pages-only policy 仍使 blogger surface 回 `{}`（resolver case 21f 已鎖此 invariant）。

---

## 3. Phase B minimal candidate（規劃，不實作）

Phase B = **repo-side policy + resolver guard 的最小安全步**，不含 Blogger build wiring（wiring 屬後續 Phase C）。具體候選：

1. 在 `ads.config.json` 為**明確選定的安全子集** block，將 `surfaces` 由 `["pages"]` 改為 `["pages","blogger"]`（或新增 blogger-specific default block）。
2. 新增 / 調整 resolver smoke case，**證明**：
   - GitHub Pages（`pages` surface）輸出**完全不變**；
   - blogger surface 僅在被明確啟用之 block 上 resolve，未啟用者維持 `{}`。
3. GitHub Pages 行為**不變**（byte-identical）。
4. Blogger 維持 dormant，直到另開 user-approved 實作 phase（Phase C wiring + Phase D single-post repost）。

> 關鍵安全性：因 `build-blogger.js` 尚未 wire resolver（Phase C 前），**即使 Phase B 改了 surface policy，也不會產生任何 Blogger 輸出**——config 改動本身對 Blogger live 文章零影響。Phase B 風險因此被限制在「不破壞 GitHub Pages + 不洩 id」。

---

## 4. Slot / anchor decision matrix（最小 Blogger 候選子集）

依現行 6-slot pages policy 與 preanalysis §4（Blogger 版型不同 + 既有 legacy/commerce 區塊共存風險），建議 Blogger 首批採**最小子集**（首尾各一），而非全量 6 版位。

| candidate slotKey | 現行 anchor（pages 用） | 內容角色 / 位置 | Blogger 首批安全？ | 理由 | 需要的驗證 |
|---|---|---|---|---|---|
| `articleAd1` | `afterHeader` | 文章開頭、正文前最高曝光位 | ⚠️ 視情況 | 曝光高，但 Blogger 端已有 legacy `adsenseTop` + 上方 commerce 區塊，易重複曝光 | 須確認不與 legacy top / 上方 affiliate block 打架 |
| `articleAd6` | `beforeRelatedLinks` | 相關連結 / hashtag 前、文章底部 | ✅ 建議首選 | 底部單一版位，與 Blogger 既有版面衝突面最小；遠離上方雙 commerce 區塊 | 確認不與 legacy `adsenseBottom` / 下方 affiliate block 重疊 |
| `articleAd2` | `afterCover` | 封面圖後 | ❌ 暫不 | Blogger 封面 / 版型差異大，易破版 | Phase C dry-run 後再評估 |
| `articleAd3` | `afterBookPhoto` | 主要圖片 / book photo 後 | ❌ 暫不 | 僅書評類有 book photo，Blogger 端語意對位不確定 | 須 Blogger 平台實貼預覽 |
| `articleAd4` | `afterAffiliateTop` | 上方販售框後 | ❌ 暫不 | 與 Blogger 刻意「上+下雙 commerce 區塊」策略直接衝突 | 須 commerce 區塊共存決策 |
| `articleAd5` | `beforeAffiliateBottom` | 下方販售 CTA 前 | ❌ 暫不 | 同上，緊鄰下方 commerce 區塊 | 須 commerce 區塊共存決策 |

**首批建議：僅 `articleAd6`（`beforeRelatedLinks`）單一底部版位**——衝突面最小、可逆、易觀察。`articleAd1` 視 Blogger legacy top 狀況列為次選。其餘 4 版位延後至 Phase C dry-run + Blogger 實貼預覽後再決定。

> 不發明 real id；上表僅引用 `slotKey`，不引用 `slots[*]` 之 id 值。real id 已存在於 config，Phase B 不複製、不外洩。

---

## 5. Resolver guard plan（僅描述未來 smoke-case 形狀）

未來 Phase B 實作時，resolver smoke（`check-adsense-resolver.js`）至少新增 / 強化兩類 case（皆用 synthetic fake id，不用 real id）：

1. **pages-unchanged invariant**：在「已為某 block 啟用 blogger surface」之後，對 `pages` surface 跑 production-shape settings，斷言 6 個 pages default block 之 resolve 結果**與啟用前完全一致**（數量、anchor、order、slotKey 不變）。證明 Blogger 啟用**不影響** GitHub Pages。
2. **blogger explicit-enable only**：斷言 blogger surface 僅對 `surfaces` 含 `"blogger"` 之選定 block resolve；對仍為 `["pages"]` 之 block 維持 `{}` / 跳過。證明**無廣泛啟用**，僅明確選定者生效。
   - 對應既有 case 形狀：case 11（`surfaces:['pages']` skips blogger）維持；新增「`surfaces:['pages','blogger']` 之選定 block 在 blogger surface resolve」之 production-policy 對應 case。
   - case 21f（目前鎖「Blogger surface → `{}`」pages-only invariant）須隨 policy 變更**同步更新**為新 policy 之預期（若首批啟用 `articleAd6`，則 blogger surface 預期 resolve 該 1 block，而非 `{}`）。

> resolver 測試總數**可能由 33 增加**；確切數字於實作時決定，本 plan 不預設。

---

## 6. Risk / rollback

| 風險 | 說明 | 緩解 |
|---|---|---|
| **GitHub Pages / Blogger 廣告重複** | 同一內容兩端都曝光 article ads，或 Blogger 新版位與 legacy/commerce 區塊重複 | 首批僅 `articleAd6` 單版位；Phase C dry-run 檢查；pages-unchanged invariant case |
| **real-id 洩漏進 docs** | 把 `slots[*]` id 值複製進規劃 / 報告 | 一律只引用 `slotKey`；docs 禁止出現 id；本 plan 已遵守 |
| **改動 resolver 影響既有 pages** | policy / guard 改動意外改變 pages 解析 | pages-unchanged invariant case 為強制 gate；diff 須確認 pages 輸出 byte-identical |

**Rollback**：Phase B 屬未來 config/test commit；rollback = `git revert` 該 commit（surface policy 改回 `["pages"]` + 還原 smoke），rebuild 後 pages 輸出回原狀。**因 Blogger build 未 wire resolver，Phase B 無任何 Blogger 端手動 mutation 需回滾**（除非另有獨立 Blogger-side 變更，本 phase 無）。

---

## 7. Acceptance criteria for future Phase B implementation

Phase B 實作**僅在**下列全部成立時可進行：

- explicit user approval。
- 精確 scope 之 config / test / source 變更（不溢出）。
- `npm run validate:content` 通過（維持 0/94/84 或可解釋之變化）。
- `npm run check:adsense-resolver` 通過（含新 pages-unchanged + blogger explicit-enable case）。
- diff 確認無 template / content / build / deploy drift。
- 無 real id 複製進 docs。
- repo-side phase 無任何 Blogger mutation。

---

## 8. Non-goals

- no deploy。
- no Blogger editor / post update。
- no renderer / template implementation（Blogger build wiring 屬 Phase C，不在此）。
- no Admin UI。
- no AdSense backend change。
- no production rollout。

---

## 9. Recommended next phase

**`20260611-blogger-adsense-phase-b-policy-resolver-implementation-a`** — 在 `ads.config.json` 為選定安全子集（建議 `articleAd6`）啟用 blogger surface + 新增 resolver guard（pages-unchanged + blogger explicit-enable）。

**🔴 BLOCKED until user explicitly approves implementation.** 在 user 明確核准前不啟動；GitHub Pages 行為不得改變；Blogger 維持 dormant 至 Phase C wiring + Phase D single-post repost（各自獨立 user-approved phase）。

---

（本文件結束）
