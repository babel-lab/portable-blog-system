# Commerce we-media-myself2 — R3 Production raw URL → ref Migration

> **Phase**: `20260610-pm-2-commerce-we-media-myself2-raw-url-to-ref-migration-a`
> **Mode**: **R3 production content migration only（首批最小遷移）**。只把 `content/blogger/posts/20260515-we-media-myself2.md` 之 2 筆 raw affiliate `url:` 改成 commerce registry `ref:`。**不**改 registry、**不**改 source / renderer、**不** deploy、**不**改 `affiliate.enabled`（維持 false）、**不**處理 metadata label mismatch、**不**啟用 KOBO excluded entry、**不**自行開始 R4。
> **Created**: 2026-06-10 +0800（12:11 起始）
> **Baseline（pre-migration）**: HEAD = origin/main = `629e529` / clean / normal 0/69/59 / overlay direct-node 0/70/59 / R2 smoke 14/14 / registry 10 active·0 held·1 excluded（KOBO）。
> **Predecessor**: `docs/20260610-commerce-renderer-ref-migration-preanalysis.md`（R1–R4 切分）、`...resolver-implementation.md`（R1）、`...ref-renderer-regression-fixture.md`（R2）。

---

## 1. Pre-migration mapping check（exact targetUrl match；no fuzzy / no canonicalize）

| # | current label | current network | current raw url | matched linkId | matched targetUrl | networkKey | active |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 博客來：實體書 | 通路王 | `https://whitehippo.net/3QaKr?uid1=blog` | `book-we-media-myself2-books-com-tw-physical-books` | `https://whitehippo.net/3QaKr?uid1=blog` | books | ✅ true |
| 2 | 金石堂：實體書 | 聯盟網 | `https://adcenter.conn.tw/3QaLi?uid1=blog` | `book-we-media-myself2-kingstone-physical-books` | `https://adcenter.conn.tw/3QaLi?uid1=blog` | books | ✅ true |

兩筆 raw url 皆於 `content/settings/commerce-links.json` 找到 **exact targetUrl** 之 **active** entry（逐字相同，含 `uid1=blog`）→ 通過 gate，繼續遷移。

> **⚠️ 已知 metadata label mismatch（本 phase 不處理）**：#2 文章端 `network: "聯盟網"`，但 registry `networkKey: books`（= 通路王）。per spec，本輪**保留** `network` 欄位原值，不重新命名、不修 metadata label mismatch（留待後續 phase）。

---

## 2. Migration summary

`content/blogger/posts/20260515-we-media-myself2.md` 之 `affiliate.links[]` 2 筆，各將 `url:` 行改為 `ref:`（值 = exact matched active linkId）。`label` / `network` 保留原值；`affiliate.enabled` 維持 `false`；正文 / slug / title / date / tags / 其他 frontmatter 未動。

diff（唯一變更）：

```diff
   links:
     - label: "博客來：實體書"
       network: "通路王"
-      url: "https://whitehippo.net/3QaKr?uid1=blog"
+      ref: "book-we-media-myself2-books-com-tw-physical-books"
     - label: "金石堂：實體書"
       network: "聯盟網"
-      url: "https://adcenter.conn.tw/3QaLi?uid1=blog"
+      ref: "book-we-media-myself2-kingstone-physical-books"
```

遷移原則（全守）：保留文章端公開 label（避免 renderer fallback 到 internalLabel）；不把 registry targetUrl 複製回文章端；不做 canonicalization；不啟用 KOBO excluded entry；不改 `affiliate.enabled`。

---

## 3. Acceptance results

### A. Diff / enabled:false
- `git diff` 僅 2 行 `url:` → `ref:`（label/network/其餘 frontmatter/正文皆未動）。
- `affiliate.enabled: false` **維持不變**（render guard 仍擋下 → 不 render affiliate box）。

### B. Validation / smoke
- `npm run validate:content` = **0 errors / 69 warnings / 59 posts**（normal baseline **不變**）。
- `node ...validate-content.js --registry-overlay ...commerce-c4-c9-overlay.json` = **0 errors / 72 warnings / 60 posts**（見 §D warning delta）。
- `node src/scripts/check-commerce-affiliate-resolver.js` = **14/14 PASS / exit 0**（registry / resolver 未動，不受影響）。

### C. Render safety（build artifacts 皆 gitignored，未 commit）
- `we-media-myself2` 生成 HTML（`dist-blogger/posts/we-media-myself2/post.html`）= **0** 個 `lab-affiliate-box`（`enabled:false` → 不 render）。
- 全 rendered HTML：`href="undefined"` = 0、`href=""` = 0、ref-as-href（`href="book-we-media...`）= 0、internalLabel in HTML = 0。
- `meta.json` / `.cache/data/posts.json` 現含 `affiliate.ref` **資料欄位**（= 遷移後 frontmatter 之鏡射；linkId 為安全 public machine key，非 href、非 secret；檔案 gitignored，Blogger publish helper / build cache）。
- **觀察（pre-existing，非本 phase 引入）**：`.cache/data/site.json`（gitignored build cache）serialize 整個 settings 含 registry `internalLabel`；此自 L1 seed 起即存在（registry 一直含 internalLabel），**非** url→ref 遷移所致，且**不**出現於任何 rendered / deployed HTML。本 phase 未改 registry、未改 build source，故不處理；僅透明記錄。

### D. Warning count delta（migration-related，合理，記為新 overlay baseline）
- **normal**：0/69/59 → **0/69/59（不變）**。we-media 之 2 refs 對 production registry 為 valid active → 無 C3/C4/C6 → 0 新 warning。
- **overlay**：0/70/59 → **0/72/60**。
  - **+2 warnings** = we-media `affiliate.links[0]` / `[1]` 各 1× `commerce-ref-not-found`（C3）。
  - **+1 post** = `byPath.size`（= 有 issue 之 distinct post 數，validate-content.js:1819）因 we-media 進入 issue set 而 +1。
  - **原因**：overlay 採 **replace semantics**（`settings.commerceLinks` 被 overlay 測試 registry 完全取代）；we-media 之 production linkId 不在 overlay 測試 registry → C3 not-found。此為 overlay 設計之固有副作用（任何含 valid production ref 之 post 於 overlay 下皆會 C3），且**直接由本次 url→ref 遷移引發**、**合理**、**僅影響 overlay 測試視圖**。production-truth（normal validate）維持 0/69/59 證明 refs 正確。
  - → **新 overlay baseline 記為 0 errors / 72 warnings / 60 posts**。

---

## 4. Mutation scope / 紅線

- ✅ 僅 `content/blogger/posts/20260515-we-media-myself2.md`（2 行 url→ref）+ 本 docs checkpoint。
- ❌ 零 registry / src / renderer / 其他 posts / templates / validation-fixtures / package / lockfile / dist / gh-pages 變更（build artifacts gitignored，git status 僅見該 post）。
- ❌ `affiliate.enabled` 維持 false（未啟用 affiliate box）。
- ❌ metadata label mismatch（#2 network 聯盟網 vs networkKey books）未處理，留後續 phase。
- ❌ KOBO / 金石堂電子書 excluded entry 未啟用。
- ❌ deploy / Blogger repost / GA4 / reverse UTM 未動；pm-26 deploy gate BLOCKED。

---

## 5. Next safe phase（**不自動啟動**；各須 explicit approval）

- **R4**：build / deploy / Blogger repost gate（前置 = R1+R2+R3 accepted + user deploy 核准；涉外不可逆，mirror pm-26）。
- 後續：其餘 production posts 之 raw url → ref 遷移（目前 we-media 為唯一含 raw affiliate url 之 production post，已遷移 → 暫無其他待遷移 post）；we-media #2 metadata label mismatch（聯盟網 → 通路王）修正；是否啟用 `affiliate.enabled`（獨立內容決策）。

---

*（本文件結束 — R3 we-media-myself2 raw url → ref 遷移；normal 0/69/59 不變；overlay 新 baseline 0/72/60（migration-related C3，合理）；smoke 14/14；enabled:false 維持；無 registry / source / deploy 變更；KOBO excluded 未啟用。）*
