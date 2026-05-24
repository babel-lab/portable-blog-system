# Blogger 後台重貼 Checklist（草稿）

本文件為 **Blogger 後台累積變動之手動重貼前置 checklist**；屬 docs-only / 操作支援；於 phase `20260524-am-8b-blogger-repost-checklist-a` 落地。

本文件**不是**啟動指令、**不是**自動化腳本、**不是**spec；屬「未來 user 決定主動重貼 Blogger 後台時，依步驟操作 + 驗收 + 必要時回滾」之**操作 SOP 草稿**。本文件之落地**不**觸發任何 content / src / build / deploy / Blogger 後台行為。

對應上層：

- `CLAUDE.md` §16.4（Blogger ↔ GitHub cross-site UTM 規則；reverse 方向 source landed but dormant）
- `CLAUDE.md` §10（Blogger Design Token 匯出；`blogger-full-style.css` 為主要重貼產物）
- `docs/checklists/blogger-publish-checklist.md`（單篇 post 發布 checklist；與本文件**不同主題**）
- `docs/blogger-to-github-reverse-utm-plan.md` §0（reverse UTM status snapshot）
- `docs/reverse-utm-fixture-plan.md`（reverse UTM fixture / 驗收前置設計）
- `docs/design-token-audit-20260523.md`（DT-A2 hashtag wrap 來源）
- `docs/design-system-ds3c-hardcoded-color-pre-analysis.md` §10（DS-3-c hover overlay 後台重貼建議）
- `docs/20260523-eod-report.md` §14（pm-7 / pm-24a/b/c 等累積 source）
- `docs/20260524-eod-report.md` §6.1 / §8.1 / §9（DT-A2 deploy / Blogger 後台未動 / deferred items）

---

## §0 Status Snapshot（2026-05-24 am-8b）

| 項目 | 狀態 |
|---|---|
| source repo HEAD | `581c0a1`（main = origin/main；clean）|
| deploy repo HEAD | `960f234`（gh-pages = origin/gh-pages；clean）|
| pm-7 hashtag wrap mirror（`_blogger-components-rules.scss`）| ✅ source live；❌ Blogger 後台 CSS 未重貼 |
| DT-A2 hashtag wrap polish（`.lab-hashtag { max-width: 100%; overflow-wrap: anywhere }`）| ✅ source live；✅ GitHub Pages live（am-7b deploy `960f234`）；❌ Blogger 後台 CSS 未重貼 |
| DS-3-c hover overlay tokenize（hex → var）| ⚠️ 建議重貼（保險起見；render 同色）|
| Reverse UTM Blogger → GitHub source（pm-24a/b/c）| ✅ source live；❌ Blogger 後台無任何 full-mode post 重貼；🟡 dormant |
| Reverse UTM fixture（具 GitHub cross-link 之 full-mode Blogger post）| ❌ 尚無 ready post 含 GitHub cross-link（per `reverse-utm-fixture-plan.md` §1.1）|

**結論**：目前所有 deferred 項皆**待 user 主動決定時機**；Claude session 無法推進 Blogger 後台操作。

---

## §1 重貼前確認事項

### 1.1 frozen baseline 對齊確認

操作前需確認本機 repo 已對齊 origin：

```bash
# 在 D:\github\blog-new\portable-blog-system
git status --short --branch       # 應為 ## main...origin/main（無 [ahead] / [behind] / 無 modified）
git rev-parse HEAD                # 應為 581c0a1 或之後
git rev-parse origin/main         # 應 = HEAD
```

```bash
# 在 D:\github\blog-new\portable-blog-deploy
git status --short --branch       # 應為 ## gh-pages...origin/gh-pages（clean）
git rev-parse HEAD                # 應為 960f234 或之後
git rev-parse origin/gh-pages     # 應 = HEAD
```

若 baseline 不符（ahead / behind / modified），**先處理 baseline**再進行 Blogger 後台重貼，避免重貼之 CSS / HTML 與 source 不一致。

### 1.2 目前 deferred 之原因（為何尚未自動重貼）

- **Claude session 無法操作 Blogger 後台**：Blogger 後台屬 user 主動行為，無 API 自動發文（per `CLAUDE.md` §4 / §29 第一版不做清單）
- **Blogger 後台 CSS 重貼 = 視覺風險 + 一次性手動成本**：累積批次重貼比每批單獨重貼更節省 user 時間（per `docs/20260523-eod-report.md` §13.13）
- **Reverse UTM 重貼需 fixture**：目前唯一 ready full-mode Blogger post（`we-media-myself2`）之 `relatedLinks` 不含 GitHub Pages cross-link → 即使重貼也無 reverse UTM 路徑可觸發（per `reverse-utm-fixture-plan.md` §0）

### 1.3 不需重新 build / deploy 的項目

本批操作為**純 Blogger 後台複製貼上**，**無需**：

- ❌ `npm run build`（dist 已 up-to-date）
- ❌ `npm run build:blogger`（dist-blogger 已 up-to-date）
- ❌ `gh-pages` 重 deploy（GitHub Pages 端已 live `960f234`）
- ❌ source / content / template / settings 修改
- ❌ git commit / push

若操作中發現需重 build，**停下 + 與 Claude session 確認**，可能 baseline 已漂移。

---

## §2 Blogger 後台操作前備份

**強烈建議**：重貼任何 Blogger 後台內容前，**先完整備份**目前 Blogger 後台之原始內容。

### 2.1 Blogger Theme（範本）CSS 備份

1. Blogger 後台 → **主題** → **自訂** → **進階** → **加入 CSS**（或 `<head>` 自訂 CSS 區）
2. 全選現有 CSS 內容 → 複製
3. 貼入本機文字檔，建議路徑：

```
D:\github\blog-new\backup\blogger-theme-css-backup-20260524.txt
```

或依當日日期命名（如 `blogger-theme-css-backup-YYYYMMDD.txt`）。

### 2.2 重貼前文章 HTML 備份（若本批含 per-post 重貼）

1. Blogger 後台 → **文章** → 目標文章 → **編輯**
2. 切到 **HTML 檢視**
3. 全選 HTML → 複製
4. 貼入本機文字檔，建議路徑：

```
D:\github\blog-new\backup\blogger-post-html-{slug}-20260524.txt
```

### 2.3 小工具 / Sidebar / Footer 備份（若本批含側邊欄變動）

第一版**無預期變動側邊欄 / 小工具**；若需操作，比照 §2.1 / §2.2 流程備份。

### 2.4 備份檔保留期

建議保留至**重貼後驗收完成 + 24 小時**，確認無問題後再清理；或永久保留於 `D:\github\blog-new\backup\` 作為 audit trail。

---

## §3 DT-A2 hashtag wrap 重貼檢查

### 3.1 來源確認

DT-A2 變動已 mirror 至 Blogger source（pm-7 同日落地）：

- GitHub source：`src/styles/components/_hashtag.scss`（+1 char / 1 line）
- Blogger mirror：`src/styles/blogger/_blogger-components-rules.scss`（+1 char / 1 line）

CSS rule：

```scss
.lab-hashtag {
  max-width: 100%;
  overflow-wrap: anywhere;
}
```

來源：`docs/design-token-audit-20260523.md` §F + `docs/20260523-eod-report.md` §13.13

### 3.2 Blogger 端對應產物

重貼來源為 `dist-blogger/theme/blogger-full-style.css`（per `CLAUDE.md` §10）：

```
dist-blogger/theme/blogger-full-style.css
```

該檔含 mirror 後完整 Blogger CSS bundle（tokens + components + article + DT-A2 hashtag wrap rule）。

### 3.3 重貼步驟

1. 完成 §2.1 備份
2. 開啟 `D:\github\blog-new\portable-blog-system\dist-blogger\theme\blogger-full-style.css`
3. 全選複製
4. Blogger 後台 → **主題** → **自訂** → **進階** → **加入 CSS** → 清空 → 貼入新內容 → **儲存**

### 3.4 肉眼檢查 hashtag wrap

驗收用樣本（任選一篇含 hashtag 區塊之 Blogger published post）：

| 檢查項 | 預期 |
|---|---|
| 短 hashtag（< 10 字）| 正常顯示一行 |
| 長 hashtag（如 `#這是一個非常長的中文 hashtag 字串測試換行`）| 不溢出容器；超寬時換行至下一行 |
| 多 hashtag 並排 | 容器內自動 wrap；無水平 scroll |
| 桌機 / 平板 / 手機 | 三種 viewport 皆 wrap 正常 |

異常徵兆：

- ❌ hashtag 橫向溢出文章容器
- ❌ 出現水平 scrollbar
- ❌ hashtag 文字斷成單字符（過度斷字；除非 hashtag 為中文連字串才正常）

若異常 → 進入 §6 回滾流程。

---

## §4 Reverse UTM Blogger → GitHub 狀態

### 4.1 「live but dormant」的意思

- **live**：source 已 commit 並 push origin/main（pm-24a `7e1d356` + pm-24b `e2309e9` + pm-24c `7c769fe`）；`build:blogger` 已可產出含 reverse UTM 之 post.html
- **dormant**：Blogger 後台**從未重貼**任何含 reverse UTM 之 post.html → Blogger 端實際 production HTML **不含**新 UTM 注入 → 即使 user / 讀者點擊 Blogger 文章內 GitHub cross-link，**仍 falls back to 舊行為**（無 `utm_source=blogger` 注入；無 reverse UTM 觀察資料）

來源：`CLAUDE.md` §16.4 / `docs/blogger-to-github-reverse-utm-plan.md` §0 / `docs/reverse-utm-fixture-plan.md` §0

### 4.2 何時會真正產生觀察資料

需**同時滿足**以下 3 條件：

1. **fixture 存在**：至少一篇 ready full-mode Blogger post 之 `relatedLinks` 或 `otherLinks` 含 GitHub Pages cross-link  
   （`reverse-utm-fixture-plan.md` §3 定義 fixture 設計原則；§4 列出 fixture 類型）
2. **build 產出含 reverse UTM 之 post.html**：執行 `npm run build:blogger` → 確認 `dist-blogger/posts/{slug}/post.html` 內 GitHub cross-link 已注入 `?utm_source=blogger&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=related_links`（或 `other_links`）
3. **Blogger 後台重貼**：user 手動將該 post.html 完整貼回 Blogger 後台對應文章 → Blogger 端 production HTML 含新 UTM 注入

僅滿足條件 1 + 2，**仍 dormant**；唯有條件 3 落地後，reverse UTM 才真正進入 production。

### 4.3 GA4 Realtime 驗收條件

待 §4.2 三條件齊備後：

1. 等待 ~5-10 分鐘讓 Blogger CDN cache 重新整理
2. 開啟 Blogger 重貼後之 production 文章
3. 點擊文章內某個 GitHub Pages cross-link
4. GA4 後台 → **Realtime** 或 **DebugView**
5. 預期觀察：`page_view` 事件，`source` / `medium` 維度為 `blogger` / `referral`，landing page 為對應 GitHub Pages URL

若觀察不到 → 檢查：

- 對應 cross-link 是否確實在 Blogger 端 HTML 內含 `?utm_source=blogger...`（檢查瀏覽器網址列）
- GA4 property 是否設正確（GitHub Pages 站對應之 property，非 Blogger 站）
- DebugView 是否已啟用（per `docs/ga4-enable-preflight.md`）

---

## §5 重貼後驗收 checklist

### 5.1 視覺驗收（桌機 / 手機）

| 區塊 | 桌機 | 手機 |
|---|---|---|
| 文章標題 / metadata | □ | □ |
| 文章本文 typography | □ | □ |
| Hashtag 區塊（換行 / wrap）| □ | □ |
| 相關連結 / 其他連結（aside）| □ | □ |
| 聯盟區塊（若有）| □ | □ |
| AdSense 區塊（若有）| □ | □ |
| Footer / 社群連結 | □ | □ |

### 5.2 互動驗收

| 項目 | 預期 |
|---|---|
| Hashtag 點擊 | 跳轉至對應 Blogger 標籤頁 |
| Hashtag wrap | 長字串不溢出 |
| 內部相關連結（Blogger 同站）| 同分頁開啟；無 nofollow |
| 跨站連結（Blogger → GitHub）| 新分頁開啟；URL 含 reverse UTM（若已重貼含 reverse UTM 之 post.html）|
| 第三方外部連結 | 新分頁開啟；rel 含 nofollow noopener |
| 聯盟連結（若有）| 新分頁開啟；rel 含 sponsored nofollow noopener |

### 5.3 GA4 Realtime / DebugView 觀察項

| event | 預期參數 |
|---|---|
| `page_view` | `page_title` / `page_location` 對應重貼文章 |
| `click_internal_link` | 內部 Blogger 連結點擊（若 source 有埋）|
| `click_related_link` | 相關連結 aside 點擊；`link_type` 應正確（cross_site / external / internal）|
| `click_affiliate_cta` | 聯盟連結點擊；`placement` 應為 `article_top` / `article_bottom`（per G1 收斂）|
| **跨站 referral**（reverse UTM 已重貼後）| GitHub Pages 端 GA4 觀察 `source=blogger` / `medium=referral` / `campaign=portable_blog_system` / `content=related_links` 或 `other_links` |

來源：`docs/ga4-link-tracking-spec.md` / `docs/ga4-click-tracking-coverage-audit-20260524.md`

### 5.4 跨瀏覽器（建議但非必要）

| 瀏覽器 | 桌機 | 手機 |
|---|---|---|
| Chrome | □ | □ |
| Safari | □ | □ |
| Firefox | □ | — |
| Edge | □ | — |

---

## §6 回滾方式

### 6.1 觸發回滾條件

- Blogger 重貼後**任一**驗收項異常（§5.1 / §5.2）
- 文章版面破版
- AdSense 區塊異常
- 任何讀者可見之顯示錯誤

### 6.2 回滾步驟（Theme CSS 重貼回滾）

1. Blogger 後台 → **主題** → **自訂** → **進階** → **加入 CSS**
2. 清空目前內容
3. 開啟 §2.1 備份檔（`blogger-theme-css-backup-YYYYMMDD.txt`）
4. 全選複製 → 貼回 Blogger
5. **儲存**
6. 驗收：開啟原異常文章 → 確認回到舊版本顯示

### 6.3 回滾步驟（單篇 post HTML 重貼回滾）

1. Blogger 後台 → **文章** → 目標文章 → **編輯** → 切 **HTML 檢視**
2. 清空 HTML
3. 開啟 §2.2 備份檔（`blogger-post-html-{slug}-YYYYMMDD.txt`）
4. 全選複製 → 貼回 Blogger
5. **儲存** → **預覽** → **更新**

### 6.4 回滾後動作

1. 在 `docs/` 或 `MEMORY.md` 註記異常徵兆 + 觸發回滾之檔案版本 → 提供 Claude 後續分析
2. **不要立即重試重貼**；先確認 source 端是否有 CSS 修正需求
3. 若涉及 reverse UTM 失效，註記 fixture URL 與點擊行為，供 `reverse-utm-fixture-plan.md` 後續更新

---

## §7 不做事項（本批 checklist 明文範圍外）

本文件作為 user 手動操作 SOP 之**支援**；以下動作**不**屬本 checklist 範圍，且**不應**順手執行：

| 動作 | 原因 |
|---|---|
| ❌ 改 GitHub Pages production（gh-pages branch）| 與 Blogger 後台重貼**獨立**；本批不觸碰 deploy repo |
| ❌ 改 source code（src/ / content/ / settings/）| 本批屬「重貼 source 已產出之 dist」性質；source 不動 |
| ❌ 新增功能 / refactor / token 變動 | 屬下一批 scope（DT-B / DS-3-b 等）|
| ❌ 修改 dist-blogger 之 generated files | 屬 `build:blogger` 產出；改 source 並重 build 才正確，不可手改 dist |
| ❌ 修改 `.publish.json` 或 frontmatter 之 `blogger.publishedUrl` | 屬 publish 流程動作（per `CLAUDE.md` §24），非本批 |
| ❌ Blogger API 自動發文 | 第一版不支援（per `CLAUDE.md` §4 / §29）|
| ❌ Google Drive API 自動上傳 | 第一版不支援（per `CLAUDE.md` §4 / §29）|
| ❌ 修改 GA4 後台 property 設定 | 屬獨立操作；非本批 |
| ❌ 修改 AdSense 後台廣告碼 | 屬獨立操作；非本批 |

---

## §8 本 checklist 啟動條件總結

簡式 decision matrix：

| 條件 | 啟動「Theme CSS 重貼」| 啟動「per-post reverse UTM 重貼」|
|---|---|---|
| frozen baseline 對齊 | ✅ 必要 | ✅ 必要 |
| §2 備份完成 | ✅ 必要 | ✅ 必要 |
| reverse UTM fixture 存在 | — | ✅ 必要（per `reverse-utm-fixture-plan.md` §6）|
| user 有可用驗收時段（含 §5 桌機 / 手機 + GA4 Realtime 觀察）| ✅ 建議 | ✅ 必要 |
| user 自決執行時機 | ✅ | ✅ |

兩類重貼**可分別執行**，也可**同批執行**（先 §3 theme CSS 重貼 + 全站驗收，再 §4 個別 post HTML 重貼 + GA4 Realtime 驗收）。

---

## §9 本文件邊界（落地保證）

| 項目 | 狀態 |
|---|---|
| 修改 source（`src/`）| ❌ 無 |
| 修改 content（`content/`）| ❌ 無 |
| 修改 settings（`content/settings/`）| ❌ 無 |
| 修改 template（`src/views/`）| ❌ 無 |
| 修改 dist / dist-blogger / dist-promotion / dist-reports | ❌ 無 |
| 修改 deploy repo（`portable-blog-deploy/`）| ❌ 無 |
| 執行 `npm run build` | ❌ 無 |
| 執行 `npm run build:blogger` | ❌ 無 |
| 執行 git push | ❌ 無 |
| 觸碰 Blogger 後台 | ❌ 無（本文件僅描述步驟，未執行）|

本 checklist 為**操作支援文件**，落地後**不**改變任何 production state；只在 user 主動啟動操作時被讀取參考。

---

## §10 後續調整空間

本文件為**第一版草稿**，可後續調整：

- DS-3-c hover overlay tokenize 落地後，§3 章節擴充對應驗收項
- 反向重貼（GitHub → Blogger 方向）觸發新規則時，新增對應 §x 章節
- 累積實際重貼經驗後，§5 驗收清單可細化或新增邊界 case
- 若 fixture 建立後 reverse UTM 進入 production，§4.2 條件 1 可標 ✅
