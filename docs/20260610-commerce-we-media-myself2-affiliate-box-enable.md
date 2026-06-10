# Commerce we-media-myself2 — Affiliate Box Enablement (content-only, bottom-only)

> **Phase**: `20260610-pm-4-commerce-we-media-myself2-affiliate-box-enable-content-only-a`
> **Mode**: **content-only enablement**。只啟用已完成 ref migration 之 affiliate box，採 **bottom-only**（`position.top` 維持 false，`position.bottom` → true）。**不**改 registry / source / renderer / ref、**不** deploy、**不** Blogger repost、**不**啟用 KOBO excluded entry、**不**自行開始 R4。
> **Created**: 2026-06-10 +0800（12:30 起始）
> **Baseline（pre-enable）**: HEAD = origin/main = `679519f` / clean / normal 0/69/59 / overlay direct-node 0/72/60 / smoke 14/14 / registry 10 active·0 held·1 excluded（KOBO）。
> **Predecessor**: `docs/20260610-commerce-we-media-myself2-ref-migration.md`（R3 url→ref）、`...network-label-fix.md`（pm-3 network 對齊）、`...renderer-ref-resolver-implementation.md`（R1）、`...ref-renderer-regression-fixture.md`（R2）。

---

## 1. Pre-enable ref mapping check（2 筆皆 exact resolve 至 active entry）

| # | label | network | ref | matched registry targetUrl | uid1=blog | active |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 博客來：實體書 | 通路王 | `book-we-media-myself2-books-com-tw-physical-books` | `https://whitehippo.net/3QaKr?uid1=blog` | ✅ 含 | ✅ true |
| 2 | 金石堂：實體書 | 通路王 | `book-we-media-myself2-kingstone-physical-books` | `https://adcenter.conn.tw/3QaLi?uid1=blog` | ✅ 含 | ✅ true |

兩筆 ref 皆命中 active registry entry（R1 resolver 可安全 resolve 為 targetUrl）→ gate 通過，繼續啟用。

---

## 2. Enable rule / Mutation summary

`content/blogger/posts/20260515-we-media-myself2.md` 之 `affiliate` 區塊：

```diff
 affiliate:
-  enabled: false
+  enabled: true
   disclosure: "本文包含聯盟行銷連結。若你透過連結購買，本站可能取得少量回饋。"
   position:
     top: false
-    bottom: false
+    bottom: true
```

唯一 2 行變更（`enabled` false→true、`position.bottom` false→true）。`position.top` 維持 **false**（bottom-only）。其餘全未動：2 筆 `ref` 不變、label / network 不變、未新增 url、disclosure 不變、正文不變、title / slug / date / tags / book / relatedLinks 不變、排序不變。

---

## 3. Acceptance results

### A. Diff confirmation
- `git diff` 僅 **2 行**：`affiliate.enabled` false→true、`position.bottom` false→true。
- `position.top` 仍 **false**；2 筆 `ref` 不變；**無 url 回流**；正文未改。

### B. Validation / smoke（皆不變）
- `npm run validate:content` = **0 errors / 69 warnings / 59 posts**（不變；validateCommerceRefs 不受 enabled 影響，refs 對 production registry valid active）。
- overlay direct-node = **0 errors / 72 warnings / 60 posts**（不變）。
- `node src/scripts/check-commerce-affiliate-resolver.js` = **14/14 PASS / exit 0**（registry / resolver 未動）。

### C. Render safety（build artifacts 皆 gitignored，未 commit / 未 deploy）
**Blogger**（`dist-blogger/posts/we-media-myself2/post.html`）:
- affiliate box = **1** 個，位於 article body（line 47）**之後**（box line 78）→ **bottom box**；**無 top box**。
- 2 個 affiliate href **逐字等於 registry targetUrl（含 uid1=blog）**：
  - `https://whitehippo.net/3QaKr?uid1=blog`（label 博客來：實體書 / network 通路王）
  - `https://adcenter.conn.tw/3QaLi?uid1=blog`（label 金石堂：實體書 / network 通路王）
- `href="undefined"` = 0、`href=""` = 0、ref-as-href（`href="book-we-media...`）= 0、internalLabel leak = 0。

**GitHub**（`.cache/pages/posts/we-media-myself2/index.html`，we-media `publishTargets.github.enabled:true`）:
- affiliate box = **1** 個，body（line 87）後（box line 116）→ bottom；2 href 同為上述 targetUrl exact（含 uid1=blog）；0 bad href / 0 leak。

`git status` 僅見該 post（無 dist / gh-pages / .cache tracked drift；build artifacts gitignored）。

---

## 4. Mutation scope / 紅線

- ✅ 僅 `content/blogger/posts/20260515-we-media-myself2.md`（2 行 enable）+ 本 docs checkpoint。
- ❌ 零 registry / src / renderer / 其他 posts / templates / validation-fixtures / package / lockfile / dist / gh-pages 變更。
- ❌ ref / label / network / disclosure / 正文 未改；未新增 url；`position.top` 維持 false（bottom-only）。
- ❌ KOBO / 金石堂電子書 excluded entry 未啟用。
- ❌ deploy / Blogger repost / GA4 / reverse UTM 未動；pm-26 deploy gate BLOCKED。

> **注意**：本 phase 使 we-media 成為**首篇實際 render affiliate box** 之 production post（先前 0 篇）。但**未 deploy / 未 Blogger repost** → live 站（GitHub Pages / Blogger 後台）尚未顯示；須待 R4 deploy gate（user 核准）才上線。

---

## 5. Next safe phase（**不自動啟動**；各須 explicit approval）

- **R4**：build / deploy / Blogger repost gate（前置 = R1+R2+R3 + 本 enable accepted + user deploy 核准；涉外不可逆，mirror pm-26）。we-media affiliate box 啟用後，R4 為將其推上 live 之唯一途徑。

---

*（本文件結束 — we-media affiliate box content-only 啟用；bottom-only（top=false / bottom=true）；唯一 2 行 frontmatter 變更；ref/label/network/正文 不變；normal 0/69/59 + overlay 0/72/60 + smoke 14/14 不變；render 1 bottom box，2 href = registry targetUrl exact 含 uid1=blog，0 leak；無 registry/source/deploy 變更；KOBO excluded 未啟用。）*
