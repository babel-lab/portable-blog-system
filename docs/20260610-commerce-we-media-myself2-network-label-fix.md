# Commerce we-media-myself2 — network Label Mismatch Fix

> **Phase**: `20260610-pm-3-commerce-we-media-myself2-network-label-fix-a`
> **Mode**: **metadata label mismatch fix only**。只把 `content/blogger/posts/20260515-we-media-myself2.md` 第 2 筆 affiliate.link（金石堂：實體書）之 `network` 顯示標籤由「聯盟網」改為「通路王」。**不**改 ref / label / registry / source / renderer、**不**新增 url、**不** enable affiliate box、**不** deploy、**不**啟用 KOBO excluded entry、**不**自行開始 R4。
> **Created**: 2026-06-10 +0800（12:25 起始）
> **Baseline（pre-fix）**: HEAD = origin/main = `1bfccb6` / clean / normal 0/69/59 / overlay direct-node 0/72/60 / smoke 14/14 / registry 10 active·0 held·1 excluded（KOBO）。
> **Predecessor**: `docs/20260610-commerce-we-media-myself2-ref-migration.md`（R3；§1 標註此 #2 network 聯盟網 vs networkKey books 為 deferred mismatch）。

---

## 1. Background

R3（`1bfccb6`）把 we-media-myself2.md 之 2 筆 affiliate.links 由 raw url 遷移為 registry ref，但**刻意保留** #2「金石堂：實體書」之 `network: "聯盟網"` 原值（per R3 spec：不在 R3 處理 metadata label mismatch）。

實際 registry entry `book-we-media-myself2-kingstone-physical-books` 之 `networkKey: books`（= **通路王**），故文章端顯示標籤「聯盟網」與通路歸屬不一致。本 phase 僅修正此**顯示標籤**。

> `network` 為**文章端顯示用標籤**（renderer 之 affiliate badge 文字），validator 不對其做 enum / registry 檢查 → 修改不影響 validation / overlay / smoke 數字。registry `networkKey` 為通路歸屬真實來源（books = 通路王），本 phase **未動 registry**。

---

## 2. Fix

`content/blogger/posts/20260515-we-media-myself2.md` 之 `affiliate.links[1]`（label「金石堂：實體書」/ ref `book-we-media-myself2-kingstone-physical-books`）：

```diff
     - label: "金石堂：實體書"
-      network: "聯盟網"
+      network: "通路王"
       ref: "book-we-media-myself2-kingstone-physical-books"
```

唯一變更 = 1 行。其餘全未動：label / ref 不變、未新增 url、`affiliate.enabled` 維持 false、`position.top` / `position.bottom` 維持 false、排序不變、正文不變、title / slug / date / tags / book / relatedLinks 不變。

---

## 3. Acceptance results

### A. Diff confirmation
- `git diff` 僅 **1 行**：`network: "聯盟網"` → `network: "通路王"`。
- `affiliate.enabled: false` ✅ 維持；`position.top: false` / `position.bottom: false` ✅ 維持。
- 2 筆 `ref` ✅ 不變；無 url 回流 ✅。

### B. Validation / smoke（皆不變；network 為顯示標籤，validator 不檢查）
- `npm run validate:content` = **0 errors / 69 warnings / 59 posts**（不變）。
- overlay direct-node = **0 errors / 72 warnings / 60 posts**（不變）。
- `node src/scripts/check-commerce-affiliate-resolver.js` = **14/14 PASS / exit 0**（registry / resolver 未動）。

### C. Render safety（build artifacts 皆 gitignored，未 commit）
- `we-media-myself2` post.html = **0** 個 `lab-affiliate-box`（`enabled:false` → 不 render）。
- rendered HTML：`href="undefined"` = 0、ref-as-href（`href="book-we-media...`）= 0。
- `git status` 僅見該 post（無 dist / gh-pages / .cache tracked drift）。

---

## 4. Mutation scope / 紅線

- ✅ 僅 `content/blogger/posts/20260515-we-media-myself2.md`（1 行 network 標籤）+ 本 docs checkpoint。
- ❌ 零 registry / src / renderer / 其他 posts / templates / validation-fixtures / package / lockfile / dist / gh-pages 變更。
- ❌ ref / label 未改；未新增 url；`affiliate.enabled` 維持 false（未啟用 affiliate box）。
- ❌ KOBO / 金石堂電子書 excluded entry 未啟用。
- ❌ deploy / Blogger repost / GA4 / reverse UTM 未動；pm-26 deploy gate BLOCKED。

---

## 5. Next safe phase（**不自動啟動**；各須 explicit approval）

- **R4**：build / deploy / Blogger repost gate（前置 = R1+R2+R3 accepted + user deploy 核准；涉外不可逆，mirror pm-26）。
- 其餘候選：是否啟用 `affiliate.enabled`（內容決策）。we-media 之 affiliate 欄位現已完成 ref 遷移 + network 標籤對齊（通路王），無其他待修 metadata mismatch。

---

*（本文件結束 — R3 後 metadata label mismatch 修正；唯一 1 行 network 聯盟網→通路王；ref/label/enabled/position 不變；normal 0/69/59 + overlay 0/72/60 + smoke 14/14 不變；無 registry / source / deploy 變更；KOBO excluded 未啟用。）*
