# 20260529 Reverse UTM Fixture Candidate Preanalysis

本文件為 **Phase `20260529-am-18-reverse-utm-fixture-candidate-preanalysis-docs-only-a`** 之 docs-only 規劃文件。屬 **planning / fixture candidate fixation** 性質；**不**建立 fixture、**不**新增 Blogger draft、**不**修改任何 content post / source / settings / templates / dist。

對應上層文件：
- `CLAUDE.md` §16.4（Blogger ↔ GitHub 互導 UTM；GitHub→Blogger live；Blogger→GitHub source landed but dormant）
- `docs/reverse-utm-fixture-plan.md`（reverse UTM fixture 既有計畫；§6 pm-26 deploy gate 條件）
- `docs/20260529-reverse-utm-topic-plan-preanalysis.md`（am-14 題材策略；§6 推薦 5.B 教具下載 → GitHub 技術筆記）
- am-17 read-only scan：`20260529-am-17-reverse-utm-fixture-base-scan-readonly-a`（Pairing 1 結論來源）
- `docs/related-links-schema.md`（relatedLinks / otherLinks 欄位字典；§11 sourceKey registry）
- `docs/admin-2-write-pre-analysis.md` §15.G.11 / §15.G.12（governance：reverse UTM 仍 dormant；pm-26 仍 BLOCKED）

---

## 1. Purpose

本文件之**唯一目的**：

- ✅ 固化 am-17 read-only scan 後之**最保守 Pairing 1** 候選（Blogger 教具下載 draft → GitHub 既有技術筆記 reuse）
- ✅ 記錄候選之 Blogger-side / GitHub-side 角色、cross-link 文案設計、relatedLinks 欄位設計、風險、rollback、未來 phase sequence

本文件之**明確非目的**：

- ❌ **不**建立 fixture（無 content 新增；無 .md / .publish.json / .fb.md 落地）
- ❌ **不**新增 Blogger draft（教具下載文章本 phase 不寫入）
- ❌ **不**修改任何 content post（既有 37 posts 全不動；GitHub-side reuse target 不被修改）
- ❌ **不**啟動 reverse UTM（per `CLAUDE.md` §16.4；remains landed but dormant）
- ❌ **不**解除 pm-26 deploy gate（per `docs/reverse-utm-fixture-plan.md` §6；remains BLOCKED）
- ❌ **不** build / deploy / Blogger repost / GA4 validation

本文件只**設計候選文案**；任何 cross-link URL 之**實際寫入**屬未來獨立 content-mutation phase，本 phase 不為之。

---

## 2. Baseline（2026-05-29 10:55 +0800）

| 維度 | 狀態 | 證據 |
|---|---|---|
| HEAD | `748b51e617c3fa856842e0b108edde995702abcf`（short `748b51e`）| `git rev-parse HEAD` |
| origin/main | 同 HEAD | `git rev-parse origin/main` |
| ahead / behind | 0 / 0 | `git rev-list --left-right --count HEAD...origin/main` |
| working tree | clean | `git status --short --branch` |
| 上一 commit subject | `docs(reverse-utm): plan fixture topic direction` | `git log -1` |
| safe-write:test | 209 pass / 0 fail | `npm run safe-write:test` |
| validate:content | 0 errors / 42 warnings / 37 posts | `npm run validate:content` |
| reverse UTM source（pm-24a/b/c）| ✅ landed but **dormant** | per `CLAUDE.md` §16.4 |
| pm-26 deploy gate | ❌ **remains BLOCKED** | per `docs/reverse-utm-fixture-plan.md` §6 |
| Blogger-side download post | ❌ **尚不存在**（repo 內無 `contentKind: download` 之 Blogger post；僅有 `content/templates/blogger-download-template.md` 模板）| am-17 scan §E |
| GitHub-side reusable target | ✅ **存在**（`content/github/posts/20260504-portable-blog-system-mvp.md`；contentKind: download / category: tech-note / status: ready / seo.indexing: noindex-follow）| am-17 scan §F |

---

## 3. Candidate summary（Pairing 1，固化）

### Blogger-side candidate

- **future new draft post**（本 phase **不**建立；未來獨立 content-mutation phase 才落地）
- base：`content/templates/blogger-download-template.md`
- contentKind / category direction：**download / download**
- status：**必須 draft**（`status: "draft"` / `draft: true`）
- 性質：**sample / draft only**
- **不得修改任何 published production post**（既有 37 posts baseline 不被污染）
- 落點（未來，候選）：`content/blogger/posts/`（status: draft）或 `content/validation-fixtures/blogger/posts/`；一次一檔；不 bulk

### GitHub-side target

- **reuse 既有文章，不修改**：`content/github/posts/20260504-portable-blog-system-mvp.md`
- 既有屬性：contentKind: download / category: tech-note / status: ready / primaryPlatform: github / seo.indexing: noindex-follow / slug: `portable-blog-system-mvp`
- 角色定位（候選文案方向，二選一或合併）：
  - **技術實作筆記**：教具下載文章背後的 metadata 與模板流程
  - **製作流程說明**：教具下載文章如何接入 portable-blog-system
- ⚠️ **本 GitHub-side article 在任何 phase 皆不被修改**；僅作為 Blogger-side relatedLinks 之指向目標被「引用」。

---

## 4. Cross-link copy & field design（候選文案，不寫入）

> ⚠️ 本 §4 僅為**候選文案設計**；本 phase **不**將此 link 寫入任何檔案。實際寫入屬未來 content-mutation phase。

### 4.1 候選 cross-link 文案（Blogger 端文章內 relatedLinks aside）

- 文案範例（自然導流，非「點此測試 UTM」）：
  - 「本站教具下載背後的檔案管理與模板設計流程，可參考 GitHub 技術筆記」
  - 「想了解這份素材如何接入 portable-blog-system？可看 GitHub 製作流程說明」

### 4.2 候選 relatedLinks entry 設計（未來寫入 Blogger draft frontmatter 時）

```yaml
relatedLinks:
  - kind: internal
    platform: "github"
    sourceKey: "github"
    title: "{教具下載 metadata 與模板設計（GitHub 技術筆記）}"
    url: "{未來回填：GitHub-side portable-blog-system-mvp 已發布之真實 URL}"
```

設計要點：
- 放 **`relatedLinks`**（非 `otherLinks`）：Blogger → GitHub 屬自家跨站，`kind: internal`（per `docs/related-links-schema.md` §5.4 / `CLAUDE.md` §16.4）。
- `sourceKey: "github"`：已存在於 `content/settings/link-sources.json`（displayLabel `GITHUB`；sourceType `internalPlatform`；defaultTargetType `internal`；isActive true）→ **不需新增 sourceKey**。
- `platform: "github"`：對齊 registry `defaultPlatform`。
- `url`：未來以 GitHub-side 已發布之**真實 URL** 回填；本 phase **不**寫入、**不**預測。
- 作者**不需手填** `target` / `rel`：由 build / render 依 `kind` + cross-site UTM 規則自動套（per `CLAUDE.md` §16.4 Blogger → GitHub 反向 source，現 dormant）。

---

## 5. Natural cross-link rationale

為什麼這組 pairing 自然（對齊 am-14 §P-1～P-6）：

- Blogger 教具下載文章服務**一般讀者 / 家長 / 教學者**（下載素材本身）。
- GitHub 技術筆記服務**開發者讀者**（理解背後 metadata / 模板 / 接入流程）。
- 兩種讀者群**互不衝突**；跨站閱讀有實質補充價值 → **非硬塞測試連結**（移除 cross-link 後 Blogger 文章仍是合理的教具下載文章）。
- **GitHub-side 不需修改**（reuse 既有 ready note；只被引用）。
- **Blogger-side 可用新 draft 控制風險**（draft status 隨時可改回 / 移除）。
- **不碰 production ready 文章**（既有 `20260515-we-media-myself2.md` 等 ready 真實內容完全不動）。
- 比 5.A 書評→技術**更不像硬塞**；比 5.C 四格→製作流程**更不涉及未成熟內容承諾**（per am-14 §6 R-5 / R-6）。

---

## 6. What a future real fixture would require

明確指出未來若要**真正建立** fixture，至少需要（本 phase **皆不**執行）：

- 新增 **1 篇 Blogger draft markdown**（以 `content/templates/blogger-download-template.md` 為 base）
- 該 draft 之 `relatedLinks` 加 **1 筆 GitHub internal link**（per §4.2 設計）
- `sourceKey` 使用 **`github`**（registry 既有；不新增）
- **不**修改 GitHub-side article（`portable-blog-system-mvp.md` 不動）
- **不**修改 settings（`link-sources.json` 不動）
- **不**修改 templates（`blogger-download-template.md` 僅作 base 複製來源，不被改）
- **不**修改 source（`src/**` 不動）

→ 上述為**未來獨立 content-mutation phase** 之範圍，須該 phase 之 user explicit approval；本 docs-only phase **不**預授權。

---

## 7. Risk assessment

| 風險項 | 等級 | 說明 |
|---|---|---|
| 新增 Blogger draft content | 🟢 低 | draft status；可隨時移除；不進正式 dist（per `CLAUDE.md` §23 draft 不輸出）|
| 修改 existing production Blogger post | 🔴 高，**禁止** | 違反 am-14 §P-6；污染既有 baseline；本 / 未來 phase 皆不為之 |
| 修改 GitHub-side ready article | ⚪ 不需要，**避免** | reuse only；只被引用不被改 |
| 新增 sourceKey | ⚪ 不需要 | `github` sourceKey 已存在於 registry |
| 修改 settings / templates / source | ⚪ 不需要 | fixture 純靠 1 篇新 Blogger draft content 即可達成 |
| deploy / Blogger repost / GA4 | ⚪ 本 phase 不碰 | 屬未來獨立 separate phases |

---

## 8. Rollback / cleanup strategy

未來若 fixture 落地後要 rollback：

- **可刪除新建之 Blogger draft**（單檔；git revert / 刪檔即還原）。
- **GitHub-side article 不受影響**（從未被修改）。
- **settings / source / templates 不受影響**（從未被修改）。
- 若已 build / deploy：deploy rollback 應**另開獨立 phase**（不在本 sequence）。
- 若已 Blogger repost：repost rollback 應**另開獨立 phase**（user 手動）。
- **本 phase 不會產生任何 rollback 需求**，因為 docs-only（唯一變更為新增本 docs 檔；revert 該 commit 即可）。

---

## 9. Future phase sequence（保守，不啟動）

本 §9 **不啟動**以下任一 phase；僅列保守落地順序作為參考。每段獨立 user explicit approval。

| 序 | Phase | 性質 | 是否本 phase 啟動 |
|---|---|---|---|
| 9-1 | `20260529-am-19-reverse-utm-fixture-candidate-preanalysis-acceptance-readonly-a` | read-only acceptance | ❌ 不啟動 |
| 9-2 | future content fixture draft creation preanalysis | docs-only | ❌ 不啟動 |
| 9-3 | future single Blogger draft fixture creation | content-mutation（一次一檔）| ❌ 不啟動 |
| 9-4 | `validate:content`（驗 0 errors baseline 不退步）| read-only | ❌ 不啟動 |
| 9-5 | build / deploy gate dry-run 或 deploy-diff check（**僅在獲准時**）| read-only / gated | ❌ 不啟動 |
| 9-6 | reverse UTM deploy gate cross-check（per `docs/reverse-utm-fixture-plan.md` §6）| read-only | ❌ 不啟動 |
| 9-7 | Blogger repost decision（**separate**；user 主動）| separate | ❌ 不啟動 |
| 9-8 | GA4 validation（**separate**；Realtime / DebugView）| separate | ❌ 不啟動 |
| 9-9 | docs checkpoint（append landed state；governance 重申）| docs-only | ❌ 不啟動 |
| 9-10 | Final Idle Freeze | — | ❌ 不啟動 |

9-1 至 9-10 之**任一**啟動皆須**獨立 phase + 該次 phase 之 user explicit approval**；本 §9 規劃**不**等同任一段之預授權。

---

## 10. Explicit non-goals（本 phase）

| # | 不做 |
|---|---|
| N-1 | ❌ no fixture creation |
| N-2 | ❌ no Blogger draft creation |
| N-3 | ❌ no content changes（既有 37 posts / GitHub-side reuse target 全不動）|
| N-4 | ❌ no source changes（`src/**` 不動）|
| N-5 | ❌ no settings / templates changes（`link-sources.json` / `blogger-download-template.md` 不動）|
| N-6 | ❌ no package changes（無 npm install）|
| N-7 | ❌ no build / deploy（gh-pages 不動）|
| N-8 | ❌ no Blogger repost |
| N-9 | ❌ no GA4 validation |
| N-10 | ❌ no reverse UTM activation（remains landed but dormant）|
| N-11 | ❌ no pm-26 deploy gate unblock（remains BLOCKED）|
| N-12 | ❌ no payload |
| N-13 | ❌ no admin-write-cli dry-run / apply |
| N-14 | ❌ no fourth SEO write |
| N-15 | ❌ no Admin Apply enable |
| N-16 | ❌ no middleware route |

---

## 11. Acceptance checklist

| # | 條件 | 驗證方法 |
|---|---|---|
| AC-1 | docs file only（單一新檔；`docs/20260529-reverse-utm-fixture-candidate-preanalysis.md`）| `git status --short` |
| AC-2 | commit 僅含該 docs 檔 | `git show --name-only` |
| AC-3 | Pairing 1 已固化（Blogger future draft from template + GitHub reuse mvp.md + relatedLinks + sourceKey github）| §3 / §4 |
| AC-4 | future content mutation 明確 deferred | §6 / §9 |
| AC-5 | reverse UTM remains dormant | §1 / §2；`CLAUDE.md` §16.4 不變 |
| AC-6 | pm-26 deploy gate remains BLOCKED | §2；`docs/reverse-utm-fixture-plan.md` §6 不變 |
| AC-7 | tests remain green | safe-write:test 209 pass / 0 fail；validate:content 0 errors / 42 warnings / 37 posts |
| AC-8 | working tree clean after push | `git status --short --branch`；ahead/behind 0/0 |

---

（本文件結束）
