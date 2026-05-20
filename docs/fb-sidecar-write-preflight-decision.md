# FB Sidecar Write Preflight Decision

本文件為 **Phase FB-P5-c** 真實寫入 `.fb.md` 前之 **preflight decision matrix + user approval checklist**。屬純 docs / 決策性文件；**本批不修改任何 source / loader / Admin UI / write flow / .fb.md 實際資料**。FB-P5-c 啟動必須等本 doc commit + user 明示勾選 §7 approval checklist 後方可進行。

對應上層文件：
- `docs/fb-sidecar-write-safety.md`（FB-P5-d safety plan；本 preflight 為其 §13.1 之 6 項前置確認落地版）
- `docs/fb-sidecar-metadata-pre-analysis.md`（FB-P4 pre-analysis；P5 拆批藍圖）
- `docs/fb-sidecar-schema.md`（`.fb.md` schema）
- `docs/admin-2-write-pre-analysis.md`（Admin-2 write strategy；繼承 B+D+E+F）
- `CLAUDE.md` §29（第一版不做清單）

---

## §1 背景與目的

### 1.1 FB 系列當前進度

| Batch | 狀態 | commit |
|---|---|---|
| FB-P1 schema 收編 | ✅ 已落地 | `bdf8fdf` |
| FB-P2 read-only display | ✅ 已落地 | `aa08e66` |
| FB-P3 (completeness 等多 c-1~c-4) | ✅ 已落地 | `be20dbd` / `101c85d` |
| FB-P4 sidecar metadata pre-analysis | ✅ 已落地 | `8416a2f` |
| FB-P5-a read-only UI polish | ✅ 已落地 | `a8a094c` |
| **FB-P5-b dry-run editor**（client-side preview） | ✅ 已落地 | `a5a28b6` |
| **FB-P5-d write safety plan**（純 docs） | ✅ 已落地 | `ebb43ef` |
| **FB-P5-c 真實寫入** | ⏳ **未啟動**（等本 preflight + user approval） | — |

### 1.2 本批目的

P5-c 啟動前必須完成 6 項決策 + user 明示勾選 approval checklist。本 preflight doc：

- 整理 6 項 decision matrix（Claude 建議 / 理由 / 風險 / 替代方案 / 是否阻擋 P5-c）
- 給出 Claude 之保守推薦預設值
- 列 P5-c v1 最小範圍（避免 scope creep）
- 列 14 step P5-c v1 建議流程
- 列 P5-c v1 不做事項
- 提供可複製勾選之 user approval checklist
- 列風險與暫緩條件
- 評估**拆批安全性**（P5-c-a server dry-run validation only + P5-c-b 真實寫入）

### 1.3 不在本批

- 任何 source / loader / Admin UI / write flow / .fb.md 實際資料 修改
- 跑 build
- 啟動 FB-P5-c / FB-P5-c-a / FB-P5-c-b
- 接 FB API

---

## §2 六項前置確認總表（Decision Matrix）

| # | 決策項目 | Claude 建議 | 理由 | 風險 | user 不批准之替代 | 阻擋 P5-c? |
|---|---|---|---|---|---|---|
| **A** | 欄位白名單 / guard checklist / 寫入策略 是否批准 | ✅ 批准 P5-d §8 之 12 欄位白名單 + §3 之 11 項 guard + §5 之 B+D+E+F 策略 | 已經詳盡分析；對齊 admin-2-a 之既有 write pattern；保守設計 | 若 user 想擴白名單（如加 `page` / `target`）→ 增加 write surface complexity 與測試成本 | 縮減白名單至更少欄位（如只 postUrl / postedAt 4 個）；或擴白名單需另開 issue 個別討論 | ✅ 必須批准；否則 P5-c 無 spec |
| **B** | vite host 設定：`0.0.0.0` vs `localhost` | ✅ FB-P5-c 寫入功能**只允許 localhost**；write endpoint 必須拒絕非 `127.0.0.1` / `::1` 來源；**GitHub Pages 線上版絕不可有 write API** | LAN 暴露 = 任何同網段機器可寫 .fb.md；無 auth；高風險 | 改 `host: 'localhost'` 之 dev server 失去其他裝置之 read-only 預覽能力（NB+PC 之 dual-device 工作流可能受影響） | A. write endpoint code 內 hardcode IP check（保留 `0.0.0.0` 給 read-only）<br>B. 改 vite host=localhost（一刀切）<br>C. 加 firewall rule 限 dev server port | ✅ 必須決定；否則 endpoint 設計不明 |
| **C** | YAML serializer 策略：**A** gray-matter stringify vs **B** raw text precise replacement | ✅ **A** gray-matter stringify | 實作較安全、簡單、可測；行為可預期；無 custom parser 之 edge case 風險 | 可能產生 cosmetic diff（quote style / key 順序變動） | A 接受後若 user 發現 cosmetic diff 不可接受 → 另開 FB-P5-c-yaml-precise phase 改 B | ✅ 必須決定 |
| **D** | invalid URL severity：**warning** vs **blocking error** | ✅ **warning** 不 blocking | FB URL 有時格式多變（含 tracking / share path / pfbid token / m.facebook.com 等）；手動貼文 URL 可能各異；過嚴會阻塞作者正常使用 | 作者可能不察 typo URL 入庫 | A 採 warning 後若發現實際出現大量 invalid URL → 另開 phase 提升 severity 或加 URL 自動修復 | ✅ 必須決定 |
| **E** | Rollback automation：**Option A** spawn `git restore` vs **Option B** 顯示 manual command | ✅ **Option B** 顯示 manual command；不自動執行 git restore | 避免工具自動破壞使用者未保存修改；git restore 是不可逆操作；user 應主動驗證 git diff 後再決定 | UX 多一步（需 user 切到 terminal）；可能造成 user inertia 不 rollback | A 採 Option B 後若 user 反映 UX 卡頓 → 另開 phase 加 spawn git CLI 之精準 narrow exception | ✅ 必須決定 |
| **F** | Sidecar 不存在時是否允許建立 | ✅ **P5-c v1 不自動建立新 `.fb.md`** | 建立新檔牽涉 sidecar template / 欄位預設值 / 與正式文章 sourcePath 對應 / fb.md ID 規範 等多項決策；超出 write scope | 作者必須先手動 `cp content/templates/_sample.fb.md content/{site}/posts/{slug}.fb.md` 才能用 Admin 編輯 | P5-c v1 只更新既有；若需要建立新 sidecar → 另開 **FB-P5-e**（新 sidecar creation phase） | ✅ 必須決定 |

---

## §3 保守建議預設值（A-F 詳細）

### 3.1 A. 欄位白名單 / guard / 寫入策略

**建議批准 FB-P5-d §8 之 12 個白名單欄位**：

允許更新：
- `enabled` / `status` / `postUrl` / `postedAt` / `postId` / `campaign` / `audience` / `title` / `titleEn` / `hashtags` / `imageUrl` / `note`

禁止更新（4 + 1）：
- `page`（屬 promotion config 引用）
- `target`（enum；屬 URL 解析邏輯）
- `customUrl`（與 target 耦合）
- `finalUrl`（屬 schema drift 收編）
- **body**（FB 貼文長文字內容）

含 P5-d §3 之 11 項 guard checklist + P5-d §5 之 B+D+E+F 寫入策略（atomic temp+rename / dry-run default + Apply 明示 / pre-write inline validate / post-write validate:content baseline check）。

### 3.2 B. vite host：localhost-only write

- **GitHub Pages 線上版絕不可有 write API**（per P5-d §9.1）
- 本機 dev server 若 vite host=`0.0.0.0`（per 既有 vite.config.js）→ write endpoint code 內必須 hardcode：
  ```js
  if (req.ip !== '127.0.0.1' && req.ip !== '::1') {
    return res.status(403).json({ error: 'write endpoint is localhost-only' });
  }
  ```
- prod build mode（`--mode=build`）不註冊 write endpoint（per Admin-1-b 之 dev-mode-only 機制延伸）
- vite emitFile / build pipeline 不可在 dist 含 write API 之 reference

### 3.3 C. YAML serializer：gray-matter stringify (Option A)

- 採 gray-matter `matter.stringify(content, data)` 預設輸出
- 接受 cosmetic diff（quote style 變動 / 欄位順序變動 / multiline literal block 變動）
- user 寫入後跑 `git diff content/.../{slug}.fb.md` 檢查；若 cosmetic diff 量大 → 標 warning 但不 rollback
- **未來若 cosmetic diff 不可接受** → 另開 phase 實作 Option B（line-precise raw text replacement；複雜度高）

### 3.4 D. invalid URL：warning 不 blocking

- `postUrl` / `imageUrl` 之 URL 驗證採 warning：
  - 空值 → 不警告（合法空）
  - 非 `http://` / `https://` 開頭 → warning（不阻擋寫入）
  - 含明顯 path injection（如 `../` / null byte / `javascript:` scheme） → **阻擋**（屬安全範圍非 URL 格式範圍）
- warning 顯示於 dry-run preview 與 post-write notification；user 自決定是否繼續

### 3.5 E. Rollback automation：Option B manual command

- Admin UI 寫入後顯示「Rollback last write」之 manual command 字串（user copy-paste 至 terminal）：
  ```
  git restore content/blogger/posts/we-media-myself2.fb.md
  git diff -- content/blogger/posts/we-media-myself2.fb.md
  npm run validate:content
  ```
- **不**自動 spawn `git restore`；避免工具觸發不可逆操作
- user 看 diff 後自行決定執行 rollback / commit / 繼續編輯

### 3.6 F. Sidecar 不存在時：不自動建立（P5-c v1）

- P5-c v1 之 write endpoint 對「target sidecar 不存在」之 request 直接 reject + 提示：
  ```
  Sidecar not found: content/{site}/posts/{slug}.fb.md
  請先手動建立: cp content/templates/_sample.fb.md content/{site}/posts/{slug}.fb.md
  ```
- 建立新 `.fb.md` 屬獨立 phase（**FB-P5-e**）；涉及 sidecar template 選擇 / 欄位預設值 / 與正式文章 sourcePath 對應 / fb.md ID 規範等多項決策

---

## §4 P5-c v1 最小範圍

明確邊界：

- ✅ **只更新既有 `.fb.md`**
- ✅ **只更新 12 個白名單欄位**（per §3.1）
- ❌ **不**更新 `page` / `target` / `customUrl` / `finalUrl` / body
- ❌ **不**建立新 sidecar（per §3.6；屬 FB-P5-e）
- ❌ **不**支援多 FB post array（per FB-P4 §9；屬 FB-P6+）
- ❌ **不**支援 production / GitHub Pages line 之 write API
- ❌ **不**支援 remote / cloud API
- ❌ **不**自動 git rollback（per §3.5 Option B）
- ❌ **不**自動 commit
- ❌ **不**自動 push
- ❌ **不**接 FB Graph API

---

## §5 P5-c v1 建議流程（14 steps）

```
1. user 在 Admin dry-run editor 輸入欄位（既有 FB-P5-b 之 form UI）
2. Show FB Dry-run Diff（既有 client-side preview）
3. user 點 Apply Changes（P5-c 新增 button）— 必須明示 confirm
4. server endpoint 接到 { slug, fields } request
5. server 反查 sidecar path（per P5-d §3.2 pseudo-code）
6. 檢查 path guard（11 項 per P5-d §3.1；含 .fb.md 後綴 / 資料夾白名單 / 不含 ../ / slug 在 loaded posts / 雙向 verify）
7. 檢查 git status 必須 clean（或 dirty 已 user 明示 confirm）
8. fs.readFile target .fb.md → raw text
9. gray-matter parse → { data, content }；parse 失敗 → reject
10. selective mutate 12 個白名單欄位（per P5-d §4.2）；其他欄位 / body 保留
11. fs.writeFile {file}.tmp → fs.rename atomic（per P5-d §5）；失敗 → fs.unlink temp + throw
12. spawn npm run validate:content；對比 baseline；退步 → 顯示 warning
13. 顯示 git diff content/.../{slug}.fb.md 內容供 user 確認
14. user 決定：
    - 接受 → 自行於 terminal git add + git commit
    - 拒絕 → 自行於 terminal git restore（per §3.5 Option B manual command）
```

---

## §6 P5-c v1 不做事項

| # | 項目 | 對應 P5-d 章節 |
|---|---|---|
| 1 | 不寫主文章 `.md` | P5-d §2.2 |
| 2 | 不寫 `.publish.json` | P5-d §2.2 |
| 3 | 不寫 `dist/` / `dist-blogger/` | P5-d §2.2 |
| 4 | 不寫 validation fixtures | P5-d §2.2 |
| 5 | 不自動 commit | P5-d §6.3 |
| 6 | 不自動 push | per §4 |
| 7 | 不自動 git restore | per §3.5 + P5-d §7.3 |
| 8 | 不處理多 FB post array | FB-P4 §9 |
| 9 | 不處理 FB Graph API | CLAUDE.md §29 |
| 10 | 不驗證 FB post 是否真實存在於 FB | per §4（無 FB API access）|
| 11 | 不擴白名單至 page / target / customUrl / finalUrl / body | per §3.1 / P5-d §8.2 |
| 12 | 不自動建立新 sidecar | per §3.6 / F |

---

## §7 開工前 user approval checklist（可複製勾選）

**P5-c 啟動必須先勾完以下 8 項**：

```
- [ ] 我批准 12 欄位白名單（enabled / status / postUrl / postedAt / postId / campaign / audience / title / titleEn / hashtags / imageUrl / note）
- [ ] 我批准 P5-c v1 只更新既有 .fb.md，不自動建立新 sidecar
- [ ] 我批准 v1 使用 gray-matter stringify (Option A)，接受可能 cosmetic diff
- [ ] 我批准 invalid URL 採 warning，不 blocking（除 path injection 等安全問題）
- [ ] 我批准 rollback 採手動命令提示（Option B），不自動執行 git restore
- [ ] 我確認 write endpoint 只允許 localhost (127.0.0.1 / ::1)；GitHub Pages 線上不可有 write API
- [ ] 我確認本批不處理多 FB post array / 多粉專 / A/B title
- [ ] 我確認本批不自動 commit / push（user 自行 git add + commit + push）
```

**額外建議勾選（屬流程觀察項；非強制）**：

```
- [ ] 我已實際操作 FB-P5-b dry-run editor 至少 1 次，驗證 form / diff calc UX 順暢
- [ ] 我已手動建立 1 個樣本 .fb.md（如 content/blogger/posts/.../we-media-myself2.fb.md）含完整 12 欄位以待 P5-c write 驗證
- [ ] 我已確認 working tree clean
```

---

## §8 風險與暫緩條件（何時不應啟動 P5-c）

P5-c **不應**啟動，若：

| # | 條件 | 緩解 |
|---|---|---|
| 1 | working tree dirty | user 先 commit / restore；之後再啟動 |
| 2 | user 未勾選 §7 approval checklist 8 項必勾項 | user 必勾完才啟動 |
| 3 | vite host / local-only 策略不明 | 先決 §3.2 之 A/B/C 方案 |
| 4 | YAML serializer 策略未定（A vs B） | 先批 §3.3 之 A |
| 5 | rollback 策略未定（Option A vs B） | 先批 §3.5 之 B |
| 6 | dry-run UI 尚未人工驗證（FB-P5-b 行為 OK 但 user 未實際操作） | user 操作 1 次驗證 |
| 7 | user 尚未實際測過手動填 postUrl / postedAt / hashtags（屬 input UX 驗證） | user 操作 dry-run 樣本驗證 |
| 8 | validate baseline 退步或非 `0/38/33` | 先找出退步原因；不在 dirty baseline 上啟動 |
| 9 | FB 系列尚有 unresolved disclaimer 不一致（如 admin EJS disclaimer 與 doc 不一致）| 先補 disclaimer fix batch |
| 10 | 即將跑大型 release / 上線前 freeze | 延後至 release 後 |

---

## §9 建議結論

### 9.1 本文件對 P5-c 啟動之建議

✅ **建議下一批可以進 P5-c**；**前提**：user 勾選 §7 8 項必勾項 + working tree clean + validate baseline `0/38/33`。

### 9.2 ⚠️ **強烈推薦拆批：P5-c-a → P5-c-b**

**Claude 之傾向：採用 user 提出之拆批策略**：

#### Phase FB-P5-c-a：server-side dry-run validation endpoint（**不**寫檔）

| 維度 | 內容 |
|---|---|
| 範圍 | 新增 server endpoint（如 `POST /admin/api/fb-dry-run-validate`）；接 client `{ slug, fields }` request；server 端跑 step 5-9（path guard / git status check / readFile / gray-matter parse / selective mutate computation） + step 12 pre-validate；**回傳 simulated result + diff + validate prediction**；**不**寫檔 |
| 風險 | 🟢 低（無 fs.write；無 atomic rename；屬 server-side simulation） |
| 預估 LOC | ~150 (server endpoint + validate + diff helper) |
| 驗證 | dry-run preview vs client-side preview 結果一致（cross-check）|

#### Phase FB-P5-c-b：真實寫入

| 維度 | 內容 |
|---|---|
| 範圍 | 沿用 P5-c-a 之 endpoint；新增 `?apply=true` 或新 endpoint `POST /admin/api/fb-write`；step 10-11 atomic write；step 13-14 post-write display |
| 風險 | 🟡 中（屬 真實 write batch；首次落地 fs.writeFile + atomic rename）|
| 預估 LOC | ~80 (write helper + post-write display) |
| 驗證 | 既有 .fb.md 樣本實際 write + git diff verify + rollback path test |

#### 拆批優點

- **P5-c-a 屬零風險 sandbox**：validate server-side dry-run 邏輯正確性 / 完整 11 guard / git status check 之 server-side 行為 / gray-matter parse + mutate 之輸出格式
- **P5-c-b 接 P5-c-a 之穩定 base**：實際 fs.write 只新增 ~80 LOC；風險集中在 atomic rename + post-write display
- **若 P5-c-a 發現 validator gap / 規格不清** → 不會污染既有 .fb.md；安全 rollback
- **user 可在 P5-c-a 後驗證 dry-run 結果是否符合預期，再決定是否啟動 P5-c-b**

#### 拆批缺點

- 多 1 個 phase（+1 commit）
- P5-c-a 之 server endpoint 部分代碼會在 P5-c-b 進化；屬可接受 refactor

#### Claude 推薦

✅ **強烈推薦拆批**。安全收益 > 1 個額外 commit 之成本。對齊 SEO-2 / FB-P5 系列之保守拆批傳統（每批 stop point + user 批准方可進）。

### 9.3 若 user 不接受拆批

若 user 偏好一批含完整 write，本 preflight 仍適用；但建議於 P5-c approval checklist 額外加：

```
- [ ] 我承認 P5-c 單批包含 server endpoint + dry-run + 真實寫入；接受首次落地之 fs.write 風險
```

---

## §10 本批不做事項

| # | 項目 | 狀態 |
|---|---|---|
| 1 | 不改 source（`src/**`）| ✅ |
| 2 | 不改 loader / Admin UI / validator / build scripts | ✅ |
| 3 | 不改 content / fixtures / `.fb.md` 實際資料 | ✅ |
| 4 | 不改 dist / dist-blogger / deploy repo | ✅ |
| 5 | 不跑 npm run build | ✅ |
| 6 | 不啟動 FB-P5-c / FB-P5-c-a / FB-P5-c-b / FB-P5-e | ✅ |
| 7 | 不接 FB API | ✅ |
| 8 | 不裁決 user approval（屬 user 決） | ✅ |
| 9 | 不擴白名單 | ✅ |
| 10 | 不 push | ✅ |

---

## §11 對既有系統之影響

| 維度 | 狀態 |
|---|---|
| `src/**` | ❌ 未動 |
| `content/**` | ❌ 未動 |
| `dist/**` / `dist-blogger/**` | ❌ 未動 |
| Deploy repo | ❌ 未動（HEAD 仍 `4ecd92d`）|
| GitHub Pages 線上 | ❌ 未動 |
| Blogger 後台 | ❌ 未動 |
| validate baseline `0/38/33` | ❌ 預期未動（純 docs 編輯）|
| FB 系列既有 commits | ❌ 未動 |
| Admin 既有功能（含 P5-b dry-run editor）| ❌ 未動 |
| `.fb.md` 實際資料 | ❌ 未動 |

---

## §12 邊界聲明

- ✅ 本文件**僅為 preflight decision**；不改任何 source / loader / Admin UI / write flow / .fb.md 實際資料
- ✅ 本文件**不**啟動 FB-P5-c / FB-P5-c-a / FB-P5-c-b
- ✅ 本文件**不**裁決 user approval（user 必須勾選 §7 checklist）
- ✅ 本文件**不**改變 6 項建議之最終 winner（user 可選 Claude 推薦或替代方案）
- ✅ 本文件**不**動 `.fb.md` schema / FB 系列既有 docs
- ✅ 本文件**不** push
- ✅ 對齊 `CLAUDE.md` §29「不接 FB API / 不自動社群發文」之預設邊界

---

## §13 Cross-links

- `docs/fb-sidecar-write-safety.md`（P5-d safety plan；本 preflight 為其 §13.1 之 6 項前置確認 + sidecar creation 議題 之決策版）
- `docs/fb-sidecar-metadata-pre-analysis.md`（P4 pre-analysis；P5 拆批藍圖）
- `docs/fb-sidecar-schema.md`（schema；P1 收編 4 個 fb post 欄位 + finalUrl drift closure）
- `docs/admin-2-write-pre-analysis.md`（Admin-2 write strategy；P5 系列繼承 B+D+E+F）
- `docs/admin-1-completion-report.md`（read-only 邊界政策）
- FB 系列 commits 線性堆疊（per §1.1 表）
- `CLAUDE.md` §29（第一版不做清單）

---

（本文件結束）
