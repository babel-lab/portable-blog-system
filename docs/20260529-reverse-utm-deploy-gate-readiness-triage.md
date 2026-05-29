# 2026-05-29 Reverse UTM Deploy Gate Readiness Triage

Phase: `20260529-pm-6-reverse-utm-deploy-gate-readiness-triage-docs-only-a`
Date: 2026-05-29
Scope: docs-only（唯一新增檔；本檔即本 phase 全部 artifact）

本檔將 phase `20260529-pm-5-reverse-utm-deploy-gate-readiness-triage-readonly-a` 之 read-only triage 結論固化落地，供未來 cold-start session / deploy decision 直接讀取，避免重新盤點。

對應上層文件：
- `CLAUDE.md` §16.4（Blogger → GitHub reverse UTM 規則；source landed but dormant）
- `CLAUDE.md` §23（draft 不輸出）
- `docs/reverse-utm-fixture-plan.md`（fixture 設計 SOP §0-§9 + §10 addendum；§6 pm-26 啟動條件；§10.5 未來 6-phase 切分）
- `docs/20260526-reverse-utm-positive-fixture-scan-report.md`（5/26 fixture scan；0/5 結論）
- `docs/20260529-reverse-utm-topic-plan-preanalysis.md`（am-14 題材策略）
- `docs/20260529-reverse-utm-fixture-candidate-preanalysis.md`（am-18 Pairing 1 設計）
- `docs/phase-2-candidate-roadmap.md` §3.3（reverse UTM pm-26 BLOCKED）

---

## 1. Executive Summary

- pm-5 為 **read-only triage**（純分析；零修改）；本檔（pm-6）為其結論之 docs-only landing。
- **source 層已有 positive GitHub cross-link fixture**：`content/blogger/posts/20260529-phonics-practice-sheet-download.md`（commit `ee263eb`）為 Blogger `mode: full`，其 `relatedLinks[0]` 之 URL hostname 等於 `settings.site.githubSiteUrl` host → 依 `CLAUDE.md` §16.4 hostname 判斷，構成 GitHub cross-link。
- 這相對 5/26 scan report 之「0 usable fixture / deadlock」是**實質狀態變化**：`docs/reverse-utm-fixture-plan.md` §10.2 之「不能改既有 + 沒有新自然文章」雙向 deadlock，**已在 source 層被打破**。
- **但 fixture 目前仍是 Blogger draft**（`status: draft` / `draft: true`）。
- 依 `CLAUDE.md` §23「draft 不輸出」→ `build:blogger` 不會產生該 post 之 `dist-blogger/posts/{slug}/post.html` → reverse UTM 注入路徑（`renderFullPost`）**不會被觸發** → **不足以解除 pm-26 deploy gate**。
- **reverse UTM remains landed but dormant**；production state drift = 0。
- **pm-26 deploy gate remains BLOCKED**。

---

## 2. Baseline（2026-05-29 13:21 +0800）

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD | `ee263eb024bb7fbb4f8bd0b7e3440a0a8ebb1866`（short `ee263eb`）|
| origin/main | `ee263eb024bb7fbb4f8bd0b7e3440a0a8ebb1866` |
| latest commit subject | `feat(content): add reverse-utm positive fixture blogger draft` |
| ahead / behind | `0 / 0` |
| working tree | clean（`## main...origin/main`）|
| validate:content | `0 error(s) / 42 warning(s) on 37 post(s)` |

→ baseline 完全對齊 pm-5 triage 啟動時之狀態；本 docs landing 不改變此狀態。42 warnings 全屬 `content/validation-fixtures/`（validator 錯誤樣本，by design）；新 fixture draft 未新增任何 warning。

---

## 3. Evidence

| 檔案 | 角色 | reverse UTM / pm-26 gate 相關重點 |
|---|---|---|
| `docs/20260526-reverse-utm-positive-fixture-scan-report.md` | 5/26 fixture scan report | 當時 candidates 5 篇 → **usable positive fixture 0 篇**；§5 明示 `pm-26 deploy gate remains BLOCKED`；fixture deadlock 維持 |
| `docs/20260529-reverse-utm-topic-plan-preanalysis.md` | am-14 題材策略 | §6 推薦「**教具下載 → GitHub 技術筆記**」方向（即本次落地 pairing 之題材來源）|
| `docs/20260529-reverse-utm-fixture-candidate-preanalysis.md` | am-18 Pairing 1 設計 | 固化 Pairing 1：Blogger download draft → reuse GitHub `portable-blog-system-mvp`；§4.2 給出 `relatedLinks` entry 設計（`sourceKey: github`）；§6/§9 明示「未來真正建 fixture 須獨立 content-mutation phase」 |
| `content/blogger/posts/20260529-phonics-practice-sheet-download.md` | **draft fixture（已落地）** | commit `ee263eb`；Blogger `mode: full`；`relatedLinks[0]` 指向 GitHub Pages `portable-blog-system-mvp`；本 phase **未修改** |
| `content/github/posts/20260504-portable-blog-system-mvp.md` | GitHub reuse target | `status: ready` / `contentKind: download` / `seo: noindex-follow`；僅被引用，**未被修改**；seo-2/seo-3 fixture invariant 完整；本 phase **未修改** |

---

## 4. Current Fixture State

| 欄位 | 值 |
|---|---|
| Blogger draft file path | `content/blogger/posts/20260529-phonics-practice-sheet-download.md` |
| title | 注音符號描寫練習單下載 |
| status | `draft` |
| draft | `true` |
| contentKind | `download` |
| primaryPlatform | `blogger` |
| publishTargets.github | `enabled: false`（mode: full）|
| publishTargets.blogger | `enabled: true` / `mode: full` |
| `relatedLinks[0].kind` | `internal` |
| `relatedLinks[0].sourceKey` | `"github"`（registry 既有；per `link-sources.json`）|
| `relatedLinks[0].platform` | `"github"`（fallback / backward-compatible 欄位）|
| `relatedLinks[0].title` | GitHub 技術補充：portable-blog-system MVP 製作筆記 |
| `relatedLinks[0].url` | `https://babel-lab.github.io/portable-blog-system/posts/portable-blog-system-mvp/`（指向 `portable-blog-system-mvp`）|
| download.enabled | `true`（⚠️ `fileUrl: ""` 空值；屬 build 階段 warning，per `CLAUDE.md` §13）|
| GitHub-side article | **未改動**（reuse only；僅被 relatedLinks 引用）|

判斷依據（per `CLAUDE.md` §16.4）：`relatedLinks[0].url` hostname `babel-lab.github.io` 等於 `settings.site.githubSiteUrl` host → 結構上構成 GitHub cross-link，不依賴 `kind` 欄位。

---

## 5. Gate Decision

⛔ **pm-26 deploy gate remains BLOCKED。**

- fixture **已存在**（source 層），但 **draft 不輸出**（per `CLAUDE.md` §23）。
- `build:blogger` 不會為 draft 產生 `dist-blogger/posts/{slug}/post.html` → **reverse UTM injection path（`renderFullPost`）未被 build / render 觸發**。
- 無 post.html 可供 `docs/reverse-utm-fixture-plan.md` §5.1.1 靜態驗收；§6 之 6 條件（全 AND）未全滿足：
  - 條件 1：fixture 須符合 §3.3（`status: ready` / `draft: false`；draft 僅允許「驗收前短暫保留直到 user 同意 ready」）→ 目前以「可輸出」標準**未成立**。
  - 條件 3：`build:blogger` 成功 + §5.1.1~5.1.4 驗證 → draft 狀態下**無法執行**。
  - 條件 4：user 明確同意手動重貼 Blogger → **未給**。
- 因此：
  - ❌ **不可 deploy**
  - ❌ **不可 Blogger repost**
  - ❌ **不可 GA4 validation**
  - ❌ **不可 unblock pm-26 gate**
- fixture 狀態由「**完全不存在**」→「**draft 已落地、未 output-enabled**」；gate 判定不變。

---

## 6. Required Gaps Before Activation

未來若要真正 activation，至少需要以下（皆須各自獨立 phase + user explicit approval；本 docs-only phase **皆不**執行）：

- **A. fixture publish-readiness preanalysis** —— read-only 盤點「draft → 可輸出」需改哪些欄位、風險、驗收項。
- **B. fixture status change phase：draft → ready / output-enabled** —— `status: draft→ready`、`draft: true→false`；屬 content-mutation；須 user explicit approval。
- **C. 處理 `download.fileUrl` 空值可能造成的 build warning** —— 現 `download.enabled: true` 但 `fileUrl: ""`，build:blogger 預期觸發 §13 warning；activation 前需補真實 fileUrl 或調整 download block。
- **D. build:blogger 後驗證輸出** —— `npm run build:blogger` + 驗 §5.1.1~5.1.4（post.html 含 4 個 UTM 鍵 + `target="_blank"` + 合併 rel；非 GitHub link 不誤注入；既有 summary CTA 維持 legacy `internal_referral`；forward UTM 不變）。
- **E. Blogger repost** —— user 手動將 post.html 貼回 Blogger 後台（pm-26 動態驗收）。
- **F. GA4 validation** —— Realtime / DebugView 觀察 `source=blogger&medium=referral&campaign=portable_blog_system&content=related_links`。
- **G. 獨立 phase 明確解除 pm-26 gate** —— 對應 `docs/reverse-utm-fixture-plan.md` §10.5 之 Phase 1-6；其中 Phase 1（content-create）已以 **draft** 形式部分完成（`ee263eb`），尚缺 promote-to-ready + build-verify + commit + repost + GA4 + report。

---

## 7. Recommended Next Candidates

> 任一候選之啟動皆須**獨立 phase + 該次 phase 之 user explicit approval**；本檔之列舉**不**等同任一段之預授權。

- **Candidate A: Final Idle Freeze / EXIT** —— 本階段結束，不開下一 phase。🟢 安全；不解除 gate。
- **Candidate C: fixture publish-readiness preanalysis** —— read-only 盤點 draft→可輸出之欄位 / 風險 / 驗收項。🟢 低風險；不解除 gate。
- **Candidate D: actual fixture status change phase（需 user explicit approval）** —— 真正把 draft fixture 改 ready / output-enabled。🔴 本階段不得執行；為解 gate 之前置一步（單獨仍不解 gate）。
- **Candidate E: deploy / Blogger repost / GA4 validation sequence planning（不得直接執行）** —— 規劃真正 activation sequence（對應 §10.5 Phase 4-6）。🔴 本階段不得執行；完成後始解除 gate。

⛔ 明確不推薦：直接 deploy、直接 Blogger repost、直接 GA4 validation、直接 unblock pm-26 gate、直接把 draft 改 ready。

---

## 8. Explicit Non-Actions（本 docs-only phase 未做）

| # | 未執行 |
|---|---|
| 1 | ❌ no content changes（既有 37 posts 全不動；draft fixture / GitHub reuse target 皆未改）|
| 2 | ❌ no source changes（`src/**` 不動）|
| 3 | ❌ no settings changes（`content/settings/**` 不動）|
| 4 | ❌ no templates changes（`content/templates/**` 不動）|
| 5 | ❌ no package changes（無 npm install）|
| 6 | ❌ no dist / gh-pages / .cache changes |
| 7 | ❌ no build / deploy |
| 8 | ❌ no Blogger repost |
| 9 | ❌ no GA4 validation |
| 10 | ❌ no reverse UTM activation（remains landed but dormant）|
| 11 | ❌ no pm-26 deploy gate unblock（remains BLOCKED）|
| 12 | ❌ no draft-to-ready change（fixture 維持 draft）|
| 13 | ❌ no admin-write-cli dry-run / apply |
| 14 | ❌ no Admin Apply enable / no middleware write route |

本檔落地後 production state drift = 0；屬純 docs entry 與 5/29 snapshot 紀錄。

---

（本文件結束）
