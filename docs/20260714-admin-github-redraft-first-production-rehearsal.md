# Phase C.2a — First production one-post redraft rehearsal (preflight packet)

> **Status: PREFLIGHT ONLY — NOT EXECUTED.**
> **REQUIRES DEAN EXPLICIT APPROVAL IN A NEW SESSION.**
> 本 session 只做候選選擇 + 唯讀 lookup + production dry-run plan + Git-safety 確認 + 未來 apply 操作封包。
> **未修改任何 production Markdown、未執行 `--apply`、未 commit 文章狀態、未 build、未 deploy。**

日期：2026-07-14
上位契約：`docs/20260714-admin-github-redraft-write-path-preflight.md` §14（Phase A / B / C0 / C.1a / C.1b 皆已落地）
本文件角色：Phase C.1b（production CLI activation，disabled-by-default）之後、**首次對 production 文章實際 apply（Phase C.2）之前**的 rehearsal 準備封包。

---

## 1. Executive summary

- Phase A→B→C0→C.1a→C.1b write-path 全鏈已落地（見 §8 Phase C.1b 落地確認），CLI **預設完全禁用**、**無 force bypass**、**本 session 未對 production 執行 apply**。
- 本 session 對 GitHub-only 文章做**唯讀盤點**，選出最低風險的第一篇 redraft rehearsal 候選：**`what-is-design-token`**。
- 對該候選跑了實際 Phase A 唯讀 lookup、Phase B production dry-run plan（**無 `--apply`**）、Phase C0 git-safety preflight，三者皆通過且**目標 Markdown bytes / mtime 不變、sidecar 不變、working tree clean**。
- 產出未來真正 apply 的**完整命令範本**（env gate + confirmation phrase + expected source SHA），並標記 **NOT EXECUTED / 須 Dean 在新 Session explicit approval**。
- **GO/NO-GO：GO（僅限「準備就緒、可交 Dean 審閱」）；對「本 session 執行 production apply」則為明確 NO-GO。**

---

## 2. Selected candidate

| 欄位 | 值 |
| --- | --- |
| title | 什麼是Design Token? |
| slug | `what-is-design-token` |
| source path | `content/github/posts/2026-06-30-what-is-design-token.md` |
| site / contentRoot | github |
| primaryPlatform | github |
| contentKind | tech-note |
| category | tech-note |
| status（current） | `ready` |
| draft（current） | `false` |
| status⇔draft | consistent |
| publishTargets | github[enabled=yes mode=full] · blogger[enabled=**no** mode=summary] |
| publish sidecar（`.publish.json`） | none |
| FB sidecar（`.fb.md`） | none |
| blogger publishing metadata | none |
| blogger coupling | **none**（blogger target disabled；非 blogger-cross） |
| 目前公開 URL | `https://babel-lab.github.io/portable-blog-system/posts/what-is-design-token/` |

---

## 3. Candidate inventory（唯讀盤點，最多 3 篇）

只考慮 `content/github/posts/*.md`。redraft 前置＝`status ∈ {ready, published}` 且 `draft:false`，符合者共 3 篇：

| # | slug | status/draft | site / platform | sidecar | blogger-cross | 目前 URL | 風險 | 推薦？ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **`what-is-design-token`** | ready / false | github / github | none | no | `.../posts/what-is-design-token/` | **低**：GitHub-only、tech-note、lifecycle metadata 乾淨、cover placeholder 存在、無特殊 SEO warning、標準 scalar/boolean、無外部 relatedLinks 引用 | ✅ **推薦** |
| 2 | `github-pages-build-preview-workflow` | published / false | github / github | none | no | `.../posts/github-pages-build-preview-workflow/` | 中低：GitHub-only、tech-note，但 `cover: ""`（空 cover，可能干擾判讀之既有 warning 面） | ⏸ 次選（cover 空） |
| 3 | `portable-blog-system-mvp` | ready / false | github / github | none | **yes（blogger summary enabled）** | `.../posts/portable-blog-system-mvp/` | **高**：contentKind=download、`seo.indexing: noindex-follow` + `includeInListings:true`（production intentional hold；`page-noindex-in-listings` warning）、blogger-cross、旗艦 MVP 文 | ❌ 排除 |

排除之其他 GitHub 文章（不符 redraft 前置 / 非首次 rehearsal 目標）：
- `github-pages-blog-planning`（status=draft/draft=true；quarantined scaffold，non-eligible）
- `admin-ui-draft-generator-first-test`（status=draft/draft=true；non-eligible）

**推薦第一篇 rehearsal candidate = `what-is-design-token`。**（非 GO 空手；有明顯安全候選。）

---

## 4. Why this candidate is low-risk

1. **GitHub-only**：`publishTargets.blogger.enabled = false`，無 blogger-cross 耦合；redraft 不影響任何 Blogger 線上貼文。
2. **無 sidecar**：無 `.publish.json` / `.fb.md`，apply 只會動單一 `.md`。
3. **lifecycle metadata 乾淨**：`status: "ready"` + `draft: false` 成對一致（lookup 判定 consistent）；標準 double-quoted string scalar + 小寫 boolean literal，無 block scalar / 非標準 boolean。
4. **無特殊 SEO / warning 干擾**：無 `seo.indexing` override、無 `includeInListings` 對抗、cover 為 placeholder（非空）；validate:content 對本 post 0 warning。
5. **零外部引用**：全 repo grep `what-is-design-token`（排除自身檔）→ 無其他文章 relatedLinks / navigation / 首頁 featured 引用；下架不牽連他文。
6. **可快速重新上架**：redraft → 未來 republish 沿用同 slug，重新 build+deploy 即恢復相同 `posts/what-is-design-token/index.html` 與公開 URL。
7. **非高風險頁**：非首頁、非下載活動頁、非廣告活動頁、非重要 SEO landing。

---

## 5. Current lifecycle state & expected redraft transition

- **Current**：`status: "ready"` / `draft: false`（visible）
- **Redraft target**：`status: "draft"` / `draft: true`（hidden）
- **Changed fields（精確）**：`status`, `draft`（恰 2 欄位，成對）
- **Effect**：redraft 只影響本機 build / 未來 deploy；**重新 build+deploy 後**該 GitHub URL 才會 404。線上 Blogger 貼文不受影響（本 post 本就無 blogger target）。

---

## 6. Exact source path / slug / URL

- source path：`content/github/posts/2026-06-30-what-is-design-token.md`
- slug：`what-is-design-token`
- live URL：`https://babel-lab.github.io/portable-blog-system/posts/what-is-design-token/`

---

## 7. Phase A lookup 結果摘要（唯讀；已實際執行）

指令：`npm run admin:lookup -- --slug=what-is-design-token --site=github`（+ `--json`）

- 唯一命中：`content/github/posts/2026-06-30-what-is-design-token.md`（0 duplicate / 0 parse error）
- source path 正確、contentRoot=github、site=github
- status=`ready` / draft=`false`、`statusDraftConsistent: true`
- publishTargets：github enabled·full / blogger disabled·summary
- publishing：`hasSidecar: false`、`blogger: null`、`github: null`
- 執行前後 source bytes 與 mtime 不變（見 §17 verification）。

---

## 8. Phase C.1b 落地確認（read-only 讀碼 + guard 結果）

對 §三 要求之 10 點逐一確認（讀 `redraft-apply-cli.js` / `redraft-apply-engine.js` / `redraft-plan.js` / `admin-article-lookup.js` / `admin-git-safety-preflight.js` / `package.json`）：

1. **`admin:redraft-apply` 真實 npm 入口**：`package.json` scripts `"admin:redraft-apply": "node src/scripts/redraft-apply-cli.js"`。✅
2. **exact environment gate 名稱和值**：`PORTABLE_BLOG_REDRAFT_APPLY=DEAN_APPROVED_LOCAL_WRITE_ONLY`（精確字串相等；不接受 `1`/`true`/部分匹配/空）。✅
3. **exact confirmation phrase**：`--confirm=DEAN-CONFIRMS-LOCAL-STATUS-WRITE`（固定精確字串；不接受 `--yes`/`-y`）。✅
4. **CLI 需要的完整參數**：`--apply` + `--slug=<exact>` + `--op=redraft|republish` + `--expected-source-sha=<64 lowercase hex>` + `--confirm=<phrase>` + env gate，全部同時吻合才會呼叫 engine；`--site` 可選。✅
5. **default-disabled 行為**：任一缺失 / 不吻合 → 寫入前 hard-fail、**zero-write**；明確拒絕 `--commit`/`--push`/`--deploy`/`--build`/`--fetch`/`--pull`/`--reset`/`--force`/`--skip-validation`/`--skip-preflight`/`--ignore-sha` 等（即使帶 `--apply` 亦拒；無 force bypass）。✅
6. **expected source SHA 驗證方式**：CLI 以 Phase B 重新產生 plan、比對 `plan.sourceSha256 === --expected-source-sha`，不吻合 → `stale-source` hard-fail（不採用新 SHA、不覆蓋最新檔）；engine 內另做 TOCTOU 重讀核 SHA。✅
7. **apply 成功後是否只留下單一 Markdown dirty**：是。engine 只改單一目標 `.md` 之 `status`+`draft` 兩行（byte-preserving，防禦性斷言「恰 2 行 differ」）；不動 sidecar / body / slug / 其他 frontmatter / 其他檔。✅
8. **post-write validation 真實契約**：pure single-file callback —— 重讀單一目標檔、驗 target SHA、frontmatter 可解析、status/draft 型別與一致、classify() 符合 op、slug 未改、把兩行反代回舊值後 SHA 須等於 sourceSha256（證明「恰 2 行變更、其餘 byte-identical」）；失敗即 engine atomic rollback。**不**跑 repo-wide validate:content（dirty-tree 下會因預期變更而失敗；列為 apply 後 Dean 手動步驟）。✅
9. **是否仍無 commit／push／build／deploy 自動化**：是。CLI/engine 皆不 import child_process、不 spawn git、不 commit/push/build/deploy/碰 gh-pages、不碰 Blogger/Google/GA4/AdSense API。成功回報固定 `commitPerformed:false` / `pushPerformed:false` / `buildPerformed:false` / `deployPerformed:false`。✅
10. **production apply 從未執行**：確認。engine 唯一實際 filesystem write 只發生在 contract guard 的 OS temp isolated git fixtures；production `.md` 從未被測試寫入，本 session 亦未執行 apply。✅

Guard 回歸（本 session 實跑，全綠）：
- `check:redraft-apply-cli` 31/0 · `check:redraft-apply-engine` 36/0 · `check:admin-git-safety-preflight` 32/0 · `check:redraft-plan` 23/0 · `check:admin-article-lookup` 26/0 · `check:github-redraft-lifecycle` 13/0 · `check-github-draft-metadata` 11/0

---

## 9. Production dry-run plan 結果（已實際執行；**無 `--apply`**）

指令：`npm run admin:plan-redraft -- --slug=what-is-design-token --op=redraft --site=github`（+ `--json`）

| 欄位 | 值 |
| --- | --- |
| op | redraft |
| sourcePath | `content/github/posts/2026-06-30-what-is-design-token.md` |
| current status/draft | `ready` / `false` |
| target status/draft | `draft` / `true` |
| changedFields | `status`, `draft`（恰 2） |
| **sourceSha256** | `3a7af72cfaec2c033854778e76d364109fda55554bb867b8cad4c77a48a1cf71` |
| **targetSha256** | `408ff121ea971f7637975f1f46c0d06bfebe32f9d2659b69b6495e5361b18ebb` |
| dryRun / apply / written | `true` / `false` / `false` |
| **writePerformed** | **false** |

### 10. sourceSha256

```
3a7af72cfaec2c033854778e76d364109fda55554bb867b8cad4c77a48a1cf71
```

### 11. targetSha256

```
408ff121ea971f7637975f1f46c0d06bfebe32f9d2659b69b6495e5361b18ebb
```

### 12. Minimal two-line diff

```diff
- [L19] status: "ready"
+ [L19] status: "draft"
- [L20] draft: false
+ [L20] draft: true
```

（byte-level：僅這 2 行變更；body / 其他 frontmatter / sidecar 皆不變。）

---

## 13. Git-safety preflight 結果（已實際執行；唯讀）

指令：`npm run admin:check-git-safety`（+ `--json`）

| 欄位 | 值 |
| --- | --- |
| branch | main |
| HEAD | `436e0bc17287e3fa87b84742cb9f51d5dd3b1204` |
| main == origin/main | yes（皆 `436e0bc`） |
| ahead / behind | 0 / 0 |
| workingTreeClean | true |
| indexLockPresent | false |
| eligible | **true** |
| networkFetchPerformed | false |
| writePerformed | false |

注意：未執行 network fetch；`origin/main` 為本機 remote-tracking ref，非遠端伺服器即時最新狀態。通過 preflight ≠ 已授權寫入。

---

## 14. Exact future apply command template（**NOT EXECUTED**）

> **NOT EXECUTED**
> **REQUIRES DEAN EXPLICIT APPROVAL IN A NEW SESSION**
> 本 session 不得執行此命令。以下僅為未來範本；env gate 只可在該次執行的 shell 一次性提供，**不得**寫入 `.env` / shell profile / 任何 script。

```bash
PORTABLE_BLOG_REDRAFT_APPLY=DEAN_APPROVED_LOCAL_WRITE_ONLY \
npm run admin:redraft-apply -- \
  --apply \
  --slug=what-is-design-token \
  --op=redraft \
  --site=github \
  --expected-source-sha=3a7af72cfaec2c033854778e76d364109fda55554bb867b8cad4c77a48a1cf71 \
  --confirm=DEAN-CONFIRMS-LOCAL-STATUS-WRITE
```

### 15. Required environment gate

- 名稱：`PORTABLE_BLOG_REDRAFT_APPLY`
- 值（精確）：`DEAN_APPROVED_LOCAL_WRITE_ONLY`
- 每次執行都需重新一次性提供；預設不存在；不接受 `1`/`true`/部分匹配。

### 16. Exact confirmation phrase

- `--confirm=DEAN-CONFIRMS-LOCAL-STATUS-WRITE`（固定精確字串）。

> ⚠️ `--expected-source-sha` 必須等於「未來執行 apply 當下」由 dry-run 重新產生的 sourceSha256。若該 `.md` 在本封包產出後有任何變動，上方 SHA 會 stale → CLI 會 `stale-source` hard-fail。**未來 apply 前務必重跑 `admin:plan-redraft` 取得最新 sourceSha256**，勿盲抄本封包數值。

---

## 17. Expected post-apply dirty-tree state（未來真正 apply 後）

apply 後應做（Dean 決定，無自動化）：

```bash
git status --short
git diff -- content/github/posts/2026-06-30-what-is-design-token.md
```

預期：
- **只有目標 Markdown 變 dirty**（`M content/github/posts/2026-06-30-what-is-design-token.md`）。
- **只有 `status` 與 `draft` 兩行變更**（L19 `ready`→`draft`、L20 `false`→`true`）。
- slug / body / 其他 metadata 不變。
- **無 sidecar 變更**、**無 commit**、**無 push**、**無 build**、**無 deploy**。

本 session verification（唯讀操作前後對照，證明未 mutation）：

| | sha256 | mtime | bytes | working tree | index.lock |
| --- | --- | --- | --- | --- | --- |
| before lookup/plan/preflight | `3a7af72c…cf71` | 2026-06-30 17:20:44 | 1506 | clean | absent |
| after lookup/plan/preflight | `3a7af72c…cf71` | 2026-06-30 17:20:44 | 1506 | clean | absent |

→ production article bytes unchanged / mtime unchanged / sidecar unchanged / no apply / no build / no deploy / no gh-pages change / no index.lock mutation。

---

## 18. Future commit commands（apply 後；Dean 決定）

> **本 session 不執行**（本 session 唯一允許 commit 的內容 = 本 docs-only rehearsal packet，見 §22）。

apply + 驗證通過後，若 Dean 決定 commit（另開 session）：

```bash
git add content/github/posts/2026-06-30-what-is-design-token.md
git commit -m "content(github): redraft what-is-design-token (ready -> draft)"
# push / build / deploy 各自獨立、各須 Dean explicit approval
```

## 19. Validation commands（apply 後手動；本 session 不模擬 dirty apply）

實際存在之適用檢查：

```bash
npm run validate:content
npm run check:github-redraft-lifecycle
npm run check:redraft-plan
npm run check:phase1-readiness   # 註：dirty-tree 下 git-safety 相關子檢查會如實 flag，屬預期
```

（apply 後 working tree 帶預期單檔變更；validate:content 為 content-level 檢查、不因 dirty tree 失敗；含 git-safety 的 umbrella 會如實反映 dirty，屬預期，非錯誤。）

---

## 20. Republish / rollback strategy

### 20.1 未 commit 前（apply 後發現問題）
- **不自動 reset**。先 `git diff` 檢查。
- 可在 Dean 明確指示下用安全反向操作或手動恢復（例如以 `republish` op 走同一 CLI 把 `draft`→`ready`，或手動改回兩行）。
- **不由本 session 預先執行**。

### 20.2 已 commit 但未 deploy
- 可另開 session 將文章改回（同 slug）：
  ```yaml
  status: ready
  draft: false
  ```
  （建議走 `admin:redraft-apply --op=republish` 對稱操作，保持 byte-preserving。）

### 20.3 已 deploy
- 重新上架需要：`republish local apply → validate → commit → push → build → deploy`，恢復相同 URL（沿用同 slug → 同 `posts/what-is-design-token/index.html`）。
- **不承諾**搜尋引擎快取立即消失／恢復。

---

## 21. Explicit stop point

**本 session 到此為止：候選選定 + 唯讀 lookup + dry-run plan + git-safety + 本封包。STOP BEFORE APPLY。**

不執行、也不由本 session 觸發：production `--apply`、status/draft 修改、production dirty tree、commit/push 文章、build、deploy、gh-pages、Blogger API、Blogger 線上下架、Git history rewrite、fetch/pull/reset/stash/clean、env gate 永久設定。

---

## 22. Dean approval gate（下一步 checklist）

未來真正 apply（Phase C.2，新 Session）前，Dean 須明確核可：

- [ ] 確認 slug＝`what-is-design-token`
- [ ] 確認 action＝`redraft`（ready → draft）
- [ ] 確認 exact source SHA（未來 apply 當下重跑 dry-run 取得最新 sourceSha256，勿盲抄本封包）
- [ ] 授權在新 Session 執行 production apply 命令（§14 範本）
- [ ] 確認理解：apply 只改 local `.md` 兩行，不 commit / push / build / deploy；URL 需 build+deploy 後才 404

---

## 23. Non-goals（本 session 明確不做）

production `--apply`；修改 candidate status/draft；任何 production Markdown 寫入；production dirty tree；自動 commit / push 文章；build；deploy；gh-pages；Blogger API / 線上下架；local server bridge；永久刪除；Git history rewrite；fetch/pull/reset/stash/clean；env gate 寫入持久設定。

本 session 唯一允許 commit/push 的內容：**本 docs-only rehearsal packet**（及必要 docs 索引同步；本次判定無必要，未動 `docs/README.md`）。

---

## 24. GO / NO-GO recommendation

- **rehearsal 準備就緒 → GO（交 Dean 審閱 candidate + 本封包）。**
- **本 session 執行 production apply → NO-GO（明確；已 STOP BEFORE APPLY）。**
- 下一 slice（須 Dean explicit approval + 新 Session）：Phase C.2 — 對 `what-is-design-token` 執行首次 production redraft apply（`--apply`），apply 後停在 dirty tree、由 Dean 決定是否 commit / push / build / deploy。

---

（本文件為 preflight rehearsal packet；不含 secrets / tokens / 完整 measurement ID；env gate 未寫入任何持久設定；apply 未執行。）
