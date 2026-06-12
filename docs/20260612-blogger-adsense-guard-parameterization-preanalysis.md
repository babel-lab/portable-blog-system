# Blogger AdSense Output Guard — Parameterization Preanalysis

Phase: `20260612-am-9-blogger-adsense-guard-parameterization-preanalysis-docs-only-a`

## 1. Status

- **docs-only preanalysis / plan**。
- 本 phase **不**修改任何 source / test / guard script / settings / template / content / frontmatter / package / lockfile / dist / gh-pages / `.cache`。
- 本 phase **不**登入 Blogger、**不**重貼、**不**發布、**不**做外部前台驗證、**不**碰 AdSense 後台。
- 本 phase **不**新增 / hardcode real AdSense client / slot id 於 docs / fixture / test。
- 本 phase **不**把 `dist-blogger` 產物加入 git。
- 唯一允許 mutation：新增本 doc + `CLAUDE.md` 之最小 ledger sync append。
- 目的：分析如何把目前 hardcoded single-slug 之 `src/scripts/check-blogger-adsense-output.js` 改成可覆蓋多篇 Blogger posts，至少涵蓋 `we-media-myself2` + `daily-reading-habit-notes`，並輸出未來 implementation phase 之最小安全改法 + acceptance criteria。

> ⚠️ 本文件不含 real AdSense client / slot id；引用值一律以 `slotKey`（`articleAd6`）/ anchor key（`beforeRelatedLinks`）/ masked（client `ca-pub-…****`、slot `…****`）表述。real id 僅存於 `content/settings/ads.config.json`，由 guard 在執行期讀取並與 dist HTML 比對，**不** inline 至 test 字面值。

---

## A. Baseline observed

| 項目 | 值 |
|---|---|
| pwd | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `435fd4a` |
| origin/main | `435fd4a` |
| ahead / behind | 0 / 0 |
| working tree | clean |
| latest subject | `docs(blogger): record adsense batch 1a verification`（am-8 verification record） |

Baseline 與 user 期望完全一致（branch=main、HEAD==origin/main==`435fd4a`、working tree clean）；不做任何 fix。

讀取期 read-only baseline 量測：

| 量測 | 結果 |
|---|---|
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（production-post warnings = 0；94 全來自 `content/validation-fixtures/`） |
| `npm run check:adsense-resolver` | **34 passed / 0 failed** |
| `npm run check:adsense-article-block` | **13 passed / 0 failed** |
| `npm run check:adsense-anchor-wiring` | **14 passed / 0 failed** |
| `npm run check:blogger-adsense-output` | **14 passed / 0 failed**（target 仍 = `we-media-myself2`） |

`dist-blogger/posts/` 現存 4 個 post 目錄（git-ignored）：`we-media-myself2`、`github-pages-blog-planning`、`portable-blog-system-mvp`、`daily-reading-habit-notes`。`dist-blogger/*` 於 `.gitignore` 排除（僅 `.gitkeep` tracked）→ build 不造成 git churn。

See also：
- `docs/20260612-blogger-adsense-batch-1a-daily-reading-manual-verification-record.md`（am-8；`daily-reading-habit-notes` live Batch 1a PASS）
- `docs/20260612-blogger-adsense-batch-1a-daily-reading-repost-packet.md`（am-7；repost packet + §C.1 dist 結構驗證）
- `docs/20260612-blogger-adsense-second-post-manual-verification-record.md`（night-1；第二篇 live PASS；§13 推薦本 preanalysis）
- `docs/20260612-blogger-adsense-phase-f-batch-rollout-plan.md`（am-1；rollout 節奏 / candidate rules；§C.2 指出 guard parameterization 與 Phase F 正交）
- `src/scripts/check-blogger-adsense-output.js`（Phase E single-slug guard；本 phase 不動）

---

## B. Current guard state

### B.1 四個 AdSense guard 之 generality 分類

| guard script | npm script | 目前 case 數 | 是否綁單一 post | 來源依賴 | parameterization 需求 |
|---|---|---|---|---|---|
| `check-adsense-resolver.js` | `check:adsense-resolver` | 34/0 | ❌ 否 | in-memory deterministic locks（Section 1）+ `ads.config.json` 不變量（Section 2）+ anchor enum reconciliation（Section 3）| **不需**（已 general；測 resolver 行為，非任一 post 之輸出） |
| `check-adsense-article-block.js` | `check:adsense-article-block` | 13/0 | ❌ 否 | EJS partial render with synthetic placeholder ads | **不需**（已 general；render-path smoke，synthetic data） |
| `check-adsense-anchor-wiring.js` | `check:adsense-anchor-wiring` | 14/0 | ❌ 否 | resolver→anchor→article-block→slot render path with synthetic ads | **不需**（已 general；anchor wiring smoke，synthetic data） |
| `check-blogger-adsense-output.js` | `check:blogger-adsense-output` | 14/0 | ✅ **是** | 讀本機 `dist-blogger/posts/<slug>/post.html`（slug hardcoded）+ `ads.config.json` | ✅ **需要**（唯一綁 single-slug 之 guard） |

→ **三個 resolver / render-path guard 已 general enough**（不綁任何 production post，測的是純函式 / partial render 行為 with synthetic ids）。**唯一仍 hardcoded** 的是 `check-blogger-adsense-output.js`，它驗 *實際 build 產物*，而 build 產物是 per-post 的，因此天然需要指定 target。

### B.2 `check-blogger-adsense-output.js` 之 single-slug 限制

- `TARGET_SLUG = 'we-media-myself2'`（line 43）為**唯一** target；`TARGET_HTML` 由它衍生。
- 14 個 case 對**單一** HTML 斷言。其中 **3 個 case 是 we-media-specific 形狀假設**，無法直接套到其他 post：
  - **Case 7**（位置語意）：要求 `lab-related-links` 存在（`relatedIdx > -1`），並把 ad slot 排在 last-affiliate-box 之後、related-links 之前。
  - **Case 12**（related links intact）：斷言 `<aside class="lab-related-links">` + `__title` + `__item` 存在。
  - **Case 13**（affiliate / commerce blocks intact）：斷言 `lab-affiliate-box` ≥ 1 + sponsored rel。
- 另外 11 個 case（articleAd6 存在性 / `<ins>` 形狀 / inline push / data-ad-client / data-ad-slot / format attrs / 無 articleAd1–5 / 無 legacy slot / 無 EJS leak / 無 undefined-null near ad）為 **surface-invariant**，理論上對任何 full Blogger post 都應成立。

### B.3 為何不能單純把 slug 換成 `daily-reading-habit-notes`

實測 dist HTML 結構（本 phase read-only 量測）：

| 量測項 | `we-media-myself2` | `daily-reading-habit-notes` |
|---|---|---|
| `lab-ad-slot--articleAd6` | 1 | 1 |
| `lab-ad-slot--articleAd[1-5]` | 0 | 0 |
| `lab-affiliate-box` | **2** | **0** |
| `lab-related-links` aside | **1** | **0** |
| `lab-related-links__item` | **2** | **0** |
| `lab-hashtag` | 4 | 3 |
| `noindex` | 0 | 0 |
| EJS leak | false | false |
| legacy slots（postTop/Middle/Bottom/sidebar/homeInline） | 0 | 0 |

→ `daily-reading-habit-notes` 為 life-note 純 body 形態，**0 affiliate-box / 0 related-links**。若把現行 guard 之 slug 直接替換，**Case 7 / Case 12 / Case 13 會 FAIL**（related-links 與 affiliate-box 不存在）。因此 parameterization **必須**把這類「周邊區塊存在性」與「位置 anchor 關係」改為 **per-target expectation**，而非全域硬性斷言。

---

## C. Why parameterization is needed

1. **Batch 1a live PASS 後應納入 automated guard**：`daily-reading-habit-notes` 已於 20260612 10:48 完成 Blogger live 重貼並 front-end PASS（am-8 record），但 `check:blogger-adsense-output` **仍只驗** `we-media-myself2`。第三篇跨形態 live PASS（書評複雜形態 / tech-note 簡形態 / life-note 純 body 形態）目前**只有第一篇**被 repeatable automated guard 涵蓋；其餘兩篇僅 manual visual verification。
2. **單 slug guard 會漏 regression**：未來新增 low-risk full Blogger posts（per Phase F Batch 1 / 1a 節奏）時，若 guard 只看 `we-media-myself2`，任一新 post 之 build 產物退化（articleAd6 消失 / 出現 articleAd1–5 / data attrs 不一致 / EJS leak）都**不會**被 CI-like 本地 guard 捕捉到。template / resolver / `ads.config.json` 之改動可能對某些形態 OK、對另一些形態破，single-slug guard 看不到形態差異。
3. **參數化 guard 是 repo-side safety，不是 live 驗證**：parameterized guard 只證明「本機 build 之 dist HTML 結構正確」，**不**代表 live Blogger 前台已生效 / AdSense 已 fill / 無破版。live 前台驗證仍須 human operator 在 Blogger 上手動完成並另案記錄（per Phase F §B.4 repo-verifiable vs Blogger-front-end-verifiable 區分）。guard 參數化擴的是 **repo-side automated coverage**，與 live rollout 正交。

---

## D. First-stage post coverage

第一階段（implementation phase）應覆蓋之 targets：

1. **`we-media-myself2`**
   - 已有 commerce / affiliate context（dual affiliate blocks，Blogger-only）+ related-links + hashtags（複雜形態）。
   - 已知 bottom AdSense slot（`articleAd6` / `beforeRelatedLinks`）應存在恰 1 個。
   - live 已驗（Phase D night-1 PASS）；現行 guard 已涵蓋。
   - 角色：**複雜形態對照**（驗 ad 與 affiliate / related-links 共存時之位置語意）。

2. **`daily-reading-habit-notes`**
   - 0 affiliate / 0 commerce / 0 related-links 之 life-note 純 body 形態。
   - 已知 bottom AdSense slot 應存在恰 1 個；`beforeRelatedLinks` anchor 在無 related-links 時 fallback 至 hashtags 之前。
   - live 已驗（Batch 1a am-8 PASS）。
   - 角色：**最簡形態對照**（驗 ad 在無周邊區塊時仍正確 fire；驗位置 anchor 關係退化為 body→ad→hashtags）。

> automated guard coverage target（第一階段）= 上述 **2 篇**。`github-pages-blog-planning`（第二篇 live PASS / tech-note 簡形態）可作為**第二階段擴充候選**（已 live verified，但本階段先鎖定 user 指定之兩篇，避免一次擴太多 target 造成 expectation 表維護負擔）。

---

## E. Proposed implementation approach（未來 implementation phase 之最小安全改法）

核心理念：**把 hardcoded 單一 slug 改為 in-file `TARGETS` array of declarative expectation objects；對每個 target 跑同一組 surface-invariant 斷言 + 該 target 之 per-target 斷言**。維持 zero new dependency、real id 只從 `ads.config.json` 讀。

### E.1 資料結構（in-file，不引入新 settings 檔）

建議 implementation 直接在 guard script 內定義（**不**新增 `content/blogger-adsense-targets.json` registry，避免新增 settings 檔 + 避免 validator coupling；in-file array 最小、最易審）：

```js
// 形狀示意（非最終程式碼）
const TARGETS = [
  {
    slug: 'we-media-myself2',
    expect: {
      articleAd6: 1,
      articleAd1to5: 0,
      noindex: 0,
      affiliateBox: { min: 1 },      // 複雜形態：≥1 affiliate-box
      relatedLinks: true,            // 有 related-links aside
      positionAnchor: 'relatedLinks',// ad 須在 last affiliate-box 後、related-links 前
    },
  },
  {
    slug: 'daily-reading-habit-notes',
    expect: {
      articleAd6: 1,
      articleAd1to5: 0,
      noindex: 0,
      affiliateBox: { exact: 0 },    // 純 body 形態：0 affiliate-box
      relatedLinks: false,           // 無 related-links
      positionAnchor: 'hashtags',    // ad 須在 body 後、hashtags 前
    },
  },
];
```

### E.2 每個 target 重複檢查（surface-invariant，對所有 target 一律成立）

- `post.html` exists（缺檔 → 該 target FAIL 並提示先 `npm run build:blogger`；見 §G 風險）。
- `lab-ad-slot--articleAd6` count = **1**。
- `lab-ad-slot--articleAd[1-5]` count = **0**。
- `data-ad-client` strict-equal `ads.config.json.adsenseClient`（從 settings 讀，不 hardcode）。
- `data-ad-slot` strict-equal `ads.config.json.slots.articleAd6`（從 settings 讀，不 hardcode）。
- `<ins>` 為 adsbygoogle + `lab-ad-slot--articleAd6`；inline push present；`data-ad-format="auto"` + `data-full-width-responsive="true"`。
- no EJS leak（`<%` / `%>` / `await include` = 0）。
- no legacy ad slot（postTop / postMiddle / postBottom / sidebar / homeInline = 0）。
- no unexpected duplicate slot（articleAd6 恰 1，不多不少）。
- no `="undefined"` / `="null"` / `>undefined<` / `>null<` near ad markup。

### E.3 每個 target 之 per-target 檢查（依 expectation 物件分支）

- `noindex` count = expected value（預設 0；download / noindex post 若未來納入可設 1）。
- `affiliateBox`：`min` / `exact` 依形態（we-media `min:1`、daily-reading `exact:0`）。
- `relatedLinks`：true → 斷言 `lab-related-links` aside + `__item` 存在；false → 斷言 `lab-related-links` count = 0。
- `positionAnchor`：
  - `'relatedLinks'` → ad slot index < related-links index；且（若有 affiliate-box）last affiliate-box index < ad slot index。
  - `'hashtags'` → ad slot index < 第一個 hashtag 區塊 index；body 在 ad 之前。
- （optional，target-specific）commerce / affiliate box expected count，如需精確驗 we-media 之 2 dual-block。

### E.4 real id 安全

- real client / slot id **一律從 `ads.config.json` 讀取後與 HTML 比對**；test 內**不** inline 任何 real id 字面值（沿用現行 Case 4 / Case 5 設計）。
- 既有 `check-adsense-resolver` Section 2 模式（settings-coupled invariants，present-check only）為先例。

### E.5 為何此為最小安全改法

- **additive**：擴 array 即可加 target；既有 we-media expectation 與現行 14 case 等價（行為向後相容）。
- **無新 dependency**（仍只用 node:fs / node:path / node:url / node:assert）。
- **無新 settings 檔**（in-file array；不引入 validator coupling）。
- **無 real id hardcode**。
- 失敗時 per-target / per-case 列印 `FAIL  <slug> :: <case>`，定位明確。

---

## F. Target-specific expected checks

| slug | output path（`dist-blogger/posts/<slug>/post.html`） | articleAd6 | articleAd1–5 | noindex | affiliate / commerce box | related-links / hashtags anchor relation | why this target matters |
|---|---|---|---|---|---|---|---|
| `we-media-myself2` | `dist-blogger/posts/we-media-myself2/post.html` | **1** | **0** | **0** | `lab-affiliate-box` **≥1**（實測 2；dual Blogger-only block）+ sponsored rel | `lab-related-links` aside **存在**（實測 1 aside / 2 item）；ad 在 **last affiliate-box 之後、related-links 之前** | 複雜形態：書評 + dual affiliate + related-links + hashtags；驗 ad 與多周邊區塊共存之位置語意；Phase D live PASS |
| `daily-reading-habit-notes` | `dist-blogger/posts/daily-reading-habit-notes/post.html` | **1** | **0** | **0** | `lab-affiliate-box` **=0**（純 body life-note） | `lab-related-links` **=0**；ad 在 **body 之後、hashtags 之前**（`beforeRelatedLinks` anchor fallback） | 最簡形態：0 affiliate / 0 related-links；驗 anchor 在無周邊區塊時仍正確 fire；Batch 1a live PASS |

> 兩 target 之共同 surface-invariant：`data-ad-client` = `ads.config.json.adsenseClient`、`data-ad-slot` = `ads.config.json.slots.articleAd6`（strict-equal，from settings）、`data-ad-format="auto"`、`data-full-width-responsive="true"`、inline push present、no EJS leak、no legacy slot、no undefined/null near ad。

---

## G. Risk analysis

1. **dist-blogger 是否需先 build 才存在**
   - dist HTML 是 build 產物；新 clone / 清過 `dist-blogger` 後不存在。現行 guard 已有 preflight：缺檔 → `process.exit(1)` + 提示 `npm run build:blogger`。
   - parameterized guard 須對**每個 target** 各自 preflight；任一缺檔即明確報該 slug 缺檔，不靜默跳過。

2. **guard 是否應自動跑 `build:blogger`，還是要求 caller 先 build**
   - **建議：要求 caller 先 build（不自動 build）**。理由：(a) guard 應為純讀取 / 快速 / side-effect-free；(b) 自動 build 會讓 guard 隱性依賴整個 build pipeline，失敗訊息混雜 build error 與 assertion error；(c) 符合既有設計（現行 guard 不 build，只讀）。
   - npm script 可保持 `node src/scripts/check-blogger-adsense-output.js`；文件 / 缺檔訊息提示先 `npm run build:blogger`。

3. **若 guard 自動 build 是否造成 git-ignored dist churn**
   - `dist-blogger/*` 已 git-ignored（僅 `.gitkeep` tracked）→ build **不**造成 git status churn。但若自動 build，仍會改本機 dist 檔 mtime / 內容（雖不入 git）。本 phase 已確認 `git check-ignore` + `.gitignore` 規則；**結論：dist churn 不污染 git**，但仍建議不自動 build（理由見 2）。

4. **Windows path / slash handling**
   - 必須用 `path.join(PROJECT_ROOT, 'dist-blogger', 'posts', slug, 'post.html')`（現行已如此），**不**手拼 `/`。輸出訊息可用 `path.relative` 正規化。跨平台一致。

5. **real ID leakage in output / docs / test**
   - guard 失敗訊息**不得** echo real client / slot id；現行 Case 4 / 5 之 assert message 只說「expected ... equal to ads.config.json ...」，不印值。parameterized 版須沿用此慣例。docs（含本檔）只用 masked。

6. **避免 brittle（過度貼合）**
   - **避免 hardcode 行號 / byte offset**：現行 Case 7 用 `indexOf` 相對位置（OK）；但 am-7 packet 內之 `body@1847 < ad@3762 < hashtags@4095` 這類**絕對 offset** 屬一次性 evidence，**不可**寫進 guard（內容一改即破）。guard 只應斷言**相對順序**（A index < B index），不斷言絕對位置。
   - **避免貼合 exact 文案 / 字數**：guard 驗結構（class / attr / 區塊存在性 + 相對序），不驗 body 文字內容。

7. **避免 false failure（live-only / 非本機 HTML 之屬性）**
   - `data-ad-status="filled"` / 實際 ad creative / iframe 是 **live AdSense 端**之 runtime 屬性，**不**出現在本機 generated HTML。guard **絕不**斷言 fill / `data-ad-status` / iframe（那是 live front-end 範疇，屬 manual verification record，非 repo-side guard）。guard 只驗 static `<ins>` markup + data attrs。

8. **per-target expectation 維護負擔**
   - 每加一個 target 須人工填 expectation（affiliateBox / relatedLinks / anchor）。風險：填錯 expectation 會讓 guard 假性 pass / fail。緩解：expectation 物件須對照該 post frontmatter（有無 affiliate / relatedLinks）人工核對一次；第一階段只 2 篇，負擔低。

9. **Option C（自動遍歷所有 ready+full post）之風險**（見 §J 比較）
   - 若改成自動遍歷，無法為每篇預先知道 affiliate / related-links 形態 → 位置 anchor 斷言難一致；且會把尚未 live-verified 的 post 也納入「應有 ad」假設，可能對「故意不放 ad」的 post 誤報。**第一階段不採 Option C**；採 §E 之 explicit TARGETS array（白名單）最安全。

---

## H. Recommended implementation acceptance criteria

未來真的改 source（guard script）時，須**全部**符合：

1. **docs/test 範圍**：only `src/scripts/check-blogger-adsense-output.js` touched（+ `CLAUDE.md` ledger if needed）；**no** content / settings / template / build / package / lockfile / frontmatter change。
2. **no real ID hardcoded into tests**：real client / slot id 仍只從 `ads.config.json` 讀取比對；guard source / 失敗訊息 0 個 real id 字面值（grep `ca-pub-` 於 guard source = 0 命中 real 數字字尾）。
3. **`npm run build:blogger` pass**（caller 先 build；guard 不自動 build）。
4. **`npm run check:blogger-adsense-output` pass**，且涵蓋 **both** `we-media-myself2` + `daily-reading-habit-notes`（per-target 全 PASS）。
5. **existing checks remain pass**：
   - `npm run check:adsense-resolver`（34/0 維持）
   - `npm run check:adsense-article-block`（13/0 維持）
   - `npm run check:adsense-anchor-wiring`（14/0 維持）
6. **`npm run validate:content` pass**（0/94/84 不變；guard 改動不碰 content）。
7. **guard covers both** `we-media-myself2` and `daily-reading-habit-notes`（明確兩 target；we-media 之既有 14-case 等價斷言不退化）。
8. **git diff clean and minimal**：只動 guard script（+ optional CLAUDE.md ledger）；working tree clean after commit；無 dist commit。
9. **no live action**：implementation phase 仍 **不**登入 Blogger / 不重貼 / 不發布 / 不碰 AdSense 後台 / 不 deploy。

---

## I. Next phase command draft（implementation；**非** docs-only）

**`20260612-XX-blogger-adsense-guard-parameterization-implementation-a`**

- 目的：實作 `check-blogger-adsense-output` 多 target guard（§E 之 in-file `TARGETS` array + surface-invariant 共同斷言 + per-target expectation 分支）。
- ⚠️ **明確標示：此 phase 會修改 source guard script（`src/scripts/check-blogger-adsense-output.js`），因此 NOT docs-only。**
- 範圍：only guard script（+ optional CLAUDE.md ledger）；須符合 §H 全部 acceptance criteria。
- 須 user explicit approval 始可執行（涉及 source mutation）。
- 仍 **不**碰 Blogger / AdSense / deploy / content / settings / template。

---

## J. Alternative next phases

1. **guard parameterization implementation**（§I）— 主線；source mutation；落地多 target guard。
2. **Phase F batch-1 expansion plan / rollout-readiness（docs-only）** — 規劃再 2–4 篇 low-risk full posts 擴成 Batch 1，或評估進入正式 Batch 1（不改 guard；live rollout 節奏線，與 guard 線正交）。
3. **second low-risk post one-post content phase** — 實際撰寫下一篇 low-risk full Blogger post（single new file；須 user approval；累積 candidate pool）。
4. **conservative pause** — 維持 baseline 不動；guard 維持 single-slug，等累積更多 live-verified post 後再一次性參數化。

> Option A（CLI `--slug=` / `--html=`）/ Option B（`content/blogger-adsense-targets.json` registry）/ Option C（自動遍歷所有 `bloggerMode:full` ready post）為 implementation 內部之 sub-option。本 preanalysis **推薦 implementation 採 in-file `TARGETS` array（≈ Option B 但 in-file，不新增 settings 檔）**：最小、最易審、無 validator coupling、白名單可控（避免 Option C 對「故意無 ad」post 誤報）。CLI param（Option A）可作為未來 ad-hoc 單篇驗證之 additive flag，不取代白名單。

---

## K. Guardrails / non-actions（本 session 明確未做）

- ❌ no source mutation（未改 `src/scripts/check-blogger-adsense-output.js` 或任何 guard / src）
- ❌ no content / frontmatter mutation
- ❌ no settings / template / views / fixtures mutation
- ❌ no `package.json` / lockfile mutation
- ❌ no Blogger access（未登入 / 未開編輯器 / 未開 AdSense 後台）
- ❌ no repost
- ❌ no publish
- ❌ no external front-end verification
- ❌ no AdSense ID mutation（未新增 / 未 hardcode real client / slot id 於 docs / fixture / test）
- ❌ no dist commit（`dist-blogger` 產物不加入 git）
- ❌ no deploy / no push gh-pages / no `.cache` mutation
- ❌ no CLAUDE.md compression
- ❌ no `/memory`
- ❌ no unrelated cleanup

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 am-9（20260612）極小 ledger sync append。

read-only 執行（記錄 baseline，未造成 mutation）：`validate:content`（0/94/84）、`check:adsense-resolver`（34/0）、`check:adsense-article-block`（13/0）、`check:adsense-anchor-wiring`（14/0）、`check:blogger-adsense-output`（14/0，仍 single-slug `we-media-myself2`）。

---

## L. Real-ID masking confirmation

本文件全文僅出現 `articleAd1`–`articleAd6`（policy key）、`beforeRelatedLinks` / `afterHeader` / `afterCover` / `afterBookPhoto` / `afterAffiliateTop` / `beforeAffiliateBottom`（anchor key）、`ca-pub-…****`（masked client）、`…****`（masked slot）；`ca-pub-` 僅作為 grep 工具描述字串出現，**不含**完整 real AdSense client id / slot id，亦無可重建 real id 之足夠線索。real id 僅存於 `content/settings/ads.config.json`。

---

（本文件結束）
