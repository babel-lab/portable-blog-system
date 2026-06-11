# AdSense N9 — Closure Checkpoint（GitHub Pages article ads）

Status: **docs-only closure checkpoint**。本文件記錄 N9 系列（GitHub Pages AdSense article ads）之 **repo-side 收斂存證** 與 operator live-monitoring checklist。

本 phase（`20260611-am-14-adsense-n9-closure-checkpoint-docs-a`）**不**改 `ads.config.json`、**不**改 content / templates / EJS / src、**不** build、**不** deploy、**不** push gh-pages、**不**重貼 Blogger、**不**碰 AdSense 後台、**不**做 GA4 / commerce / renderer / Admin / Blogger surface 實作。唯一變更 = 新增本文件。

> ⚠️ 本文件**不含** real full AdSense client id / slot id。一律 masked（如 client `ca-pub-…3759`）或僅以 `slotKey` / `anchor` 指稱（非機密 policy）。real id **僅**存於 `content/settings/ads.config.json`。

---

## 1. Closure declaration

- **N9 GitHub Pages AdSense repo-side closure：PASS（CLOSED）。**
- GitHub Pages production article-ads 渲染路徑已 **live-accepted**（N9e deploy + live verify；user pm-8 等價之 N9e acceptance）。
- 後續 AdSense 工作（Blogger surface / GA4 dimension / commerce）皆屬 **另案 phase**，不在 N9 closure 範圍（見 §5）。

---

## 2. Baseline

| Item | Value |
|---|---|
| HEAD at phase start | `e6a4713` |
| origin/main | `e6a4713` |
| branch | `main` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `docs(claude): sync adsense n9f resolver baseline` |

關鍵 commit 對照：

| Phase | Commit | Subject |
|---|---|---|
| N9a real slots disabled seed | `1d0ae8f` | `chore(adsense): seed real slots disabled` |
| N9b default-block resolution | `5995531` | `feat(adsense): resolve default article ad blocks` |
| N9c dry-run preview record | `d5f1545` | `docs(adsense): record n9c enable preview dry run` |
| N9d pre-deploy go/no-go | `162567f` | `docs(adsense): add n9d predeploy go/no-go checklist` |
| **N9e enable article ads** | **`3e1f4e3`** | `chore(adsense): enable article ads` |
| **N9f resolver guard update** | **`e955f19`** | `test(adsense): update resolver guard for enabled baseline` |
| am-12 acceptance / memory sync | `e6a4713` | `docs(claude): sync adsense n9f resolver baseline` |

（N9 前序鏈：N4 convention `9218e03` → N5 frontmatter validator `e832f9f` → N6a settings shape validator `5174c2e` → N7 resolver `a03c659` → N8a wrapper partial `9607c4b` → N8 anchor wiring `4b332d7` → N8 acceptance `b6dfb9b` → N9-operator template `e63169b`。）

---

## 3. N9 scope summary（N9a → N9f landing state）

僅記錄有證據之事實，不捏造細節。

- **production `ads.config.json` `enabled: true`**（N9e `3e1f4e3` 僅改此一欄位 false→true）。
- **6 real article slots `articleAd1`..`articleAd6`** present（real ids 僅存 `ads.config.json`，本文件不列印）。
- **`defaults.blocks[]` = 6 blocks**，site-wide default article-block policy；每 block `surfaces: ["pages"]`、`enabled: true`、`order` 1–6。slot→anchor 對映（N9d policy，top→bottom）：
  - `articleAd1` → `afterHeader`
  - `articleAd2` → `afterCover`
  - `articleAd3` → `afterBookPhoto`
  - `articleAd4` → `afterAffiliateTop`
  - `articleAd5` → `beforeAffiliateBottom`
  - `articleAd6` → `beforeRelatedLinks`
- **resolver 3-gate**（`src/scripts/resolve-adsense-blocks.js`）：須 `ads.enabled===true` + 非空 `adsenseClient` + 非空 slot id 才產生 resolved block；缺任一 → no-op。block source 優先序 = post-specific `post.adsense.blocks` → site `defaults.blocks[]` → `{}`。post-level `adsense.enabled===false` 連 site default 一併壓制。
- **smoke `check-adsense-resolver.js` Case 21** 已從舊「assert production `enabled:false` → {}」更新為 **post-N9e enabled production invariant**（N9f `e955f19`）：assert `enabled===true` + `adsenseClient` / `slots.articleAd1..6` present 非空 + `defaults.blocks[]` 6 筆對映 N9d policy + anchors 屬 v1 enum + slot/anchor order top→bottom monotonic + pages surface 實際 resolve 6 blocks + blogger surface → `{}`。present-check only，不列印 full real id。
- **N9e GitHub Pages deploy/live verify 已完成**：deploy 經既有 runbook（`docs/github-deploy.md` §4+§5.4），gh-pages `2acb5a5→c15e514`；live verify `https://babel-lab.github.io/portable-blog-system/posts/we-media-myself2/` 載入正常、無 template leak（實際 ad fill 屬 AdSense 端）。
- **N9c dry-run（masked，已還原）證據**：本機暫設 `enabled:true` build 後，3 posts × 6 blocks = **18** article ad slots；`adsbygoogle` / `data-ad-client`（client `ca-pub-…3759`）/ `data-ad-slot` 出現；6 real slot id 全數至少各出現一次（每篇各 1 次）；loader script 每篇 1 次不重複（head loader 由 `loader.pages:"head"` 單獨控制）；anchor 順序 top→bottom `articleAd1→…→articleAd6`；隨即 `git checkout` 還原 `enabled:false` byte-identical。
- **N9f test/docs-only**：未改 `ads.config.json` / EJS / render / Blogger；未 deploy / 未 push gh-pages。

---

## 4. Acceptance evidence（本 phase）

本 phase 為 docs-only；acceptance 確認 repo 端無 regression、diff scope 僅單一新 doc。

| Command | Expected | Actual（本 phase 實跑） |
|---|---|---|
| `npm run validate:content` | `0 errors / 94 warnings / 84 posts` | `0 errors / 94 warnings / 84 posts` ✅ |
| `npm run check:adsense-resolver` | `33 passed / 0 failed` | `33 passed / 0 failed` ✅ |
| `git diff --stat` | only `A docs/20260611-adsense-n9-closure-checkpoint.md` | 單一新 doc ✅ |

若 diff scope 超出單一新 doc，或上述任一 baseline 不符 → STOP，不 commit / push。

---

## 5. Out-of-repo / deferred items（列出但不執行）

- **Blogger AdSense surface** — **另案 phase**。需要 `loader.blogger` 決策、Blogger backend 重貼、原文章 HTML 備份、Blogger live theme CSS 確認、user explicit approval。現行 `defaults.blocks[]` 全 `surfaces:["pages"]`，blogger surface resolver 回 `{}` → Blogger 端不出廣告（by design）。**不得**沿用 GitHub Pages setting 直接硬開 Blogger。
- **GA4 ad dimension / event tracking** — **另案新功能**，不在 N9 closure。base GA4 已 production-live（measurementId `G-C77SMPF8VD`），但 AdSense-specific event dimension 屬新 surface，須獨立 phase + preanalysis。
- **commerce L2 seed** — 不在 N9 closure。仍需 user 提供 `commerceSeedCandidates:` YAML + explicit approval（L1 已 seed 10 active；L2 gate BLOCKED）。

---

## 6. Live monitoring checklist（operator-facing；本文件不執行任何操作）

- [ ] 觀察 GitHub Pages production article pages 是否持續正常載入（無破版 / 無 template leak）。
- [ ] 觀察 AdSense 後台是否出現 impressions、或任何 policy / inventory warning。
- [ ] 若 AdSense 後台出現 inventory / policy / crawler-delay 類訊息：屬 AdSense 端事項，**不**直接改 repo（先判讀原因）。
- [ ] 若懷疑 repo-side regression：先跑 `npm run validate:content` + `npm run check:adsense-resolver`（須維持 0/94/84 + 33/33），再判斷是否需 source 修正（另開 phase）。
- [ ] **Blogger 不要沿用 GitHub Pages setting 直接硬開**；任何 Blogger 廣告須走另案 Blogger surface phase（見 §5）。
- [ ] rollback 路徑（如需停用 GitHub Pages 廣告）：`ads.config.json` `enabled` 改回 `false` → rebuild → redeploy（per N9d rollback checklist；AdSense 後台無自動 rollback）。

---

## 7. Final verdict

- **N9 GitHub Pages AdSense repo-side closure：PASS。**
- **No immediate AdSense repo blocker observed.**
- **Next recommended work** = docs / operator observation（live monitoring per §6），**not new implementation**。任何下一步廣告功能（Blogger surface / GA4 dimension）皆須另開 phase + 獨立 acceptance，不在本 closure 範圍。

---

（本文件結束）
