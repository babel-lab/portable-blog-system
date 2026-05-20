# GA4 measurementId 接入 Preflight

本文件為 **Phase 20260520-pm-1** 之 GA4 接入盤點與啟用前 user checklist。屬純 docs / preflight；**本批不修改 source / settings / template / dist / deploy**；GA4 機制本身**已完整就位**（per §1 盤點），唯欠 user 明示填 measurementId + 切 enabled=true 兩項決策。

對應上層文件：
- `docs/seo-ga4-adsense.md` §5 GA4 tracking（既有實作；含 5-d 完成狀態）
- `CLAUDE.md` §6 Phase 5（SEO / GA4 / AdSense）/ §29（第一版不做清單）
- `content/settings/ga4.config.json`（既有 config）
- `src/views/tracking/ga4.ejs`（既有 gating template）
- `src/scripts/build-github.js`（既有 HEAD_PARTIALS + render plumb）

---

## §1 現況盤點（per Task A）

### 1.1 GA4 機制 — 已完整就位

| 元件 | 路徑 | 狀態 |
|---|---|---|
| Config | `content/settings/ga4.config.json` | ✅ 含 `enabled: false` / `measurementId: ""` / 9 個 event 列表 |
| Template | `src/views/tracking/ga4.ejs` | ✅ 雙條件 gating：`ga4.enabled === true && ga4.measurementId` 非空 → 輸出 gtag script |
| Event helper | `src/views/tracking/ga4-events-helper.ejs` | ✅ data-ga4-* attr 注入機制就位 |
| Build plumb | `src/scripts/build-github.js` line 55 + 90 | ✅ `tracking/ga4` 在 HEAD_PARTIALS；`settings.ga4` 傳入 EJS render data |
| JS module | `src/js/modules/{ga4-events,link-tracker}.js` | ✅ click 委派 + trackEvent；gtag 不存在時靜默 no-op |
| Docs | `docs/seo-ga4-adsense.md` §5.1 - §5.5 | ✅ 詳細記載 5-d 規格 + gating 規則 + event 對應 |

### 1.2 GitHub Pages 端

- HEAD_PARTIALS 含 `{ dir: 'tracking', name: 'ga4' }`（line 55）
- 所有 ready / published posts 之 HTML head 透過 `renderHeadPartials()` 注入
- 當前 `enabled=false` → 4 個 main pages（home + 3 ready posts）之 dist head **0 個 GA4 script**（per Task D 驗證）

### 1.3 Blogger 端

- `src/scripts/build-blogger.js` grep `ga4|GA4|gtag|googletagmanager` → **0 hits**
- `src/views/blogger/blogger-post-full.ejs` grep → **0 hits**
- Blogger 後台貼用之 HTML body fragment **不含** GA4 script
- 設計上正確：**Blogger 平台自帶 / 主題層管 GA**；本系統不重複插入

### 1.4 measurementId 放置位置

- ✅ **已在** `content/settings/ga4.config.json` 之 `measurementId` 欄位
- ❌ **未在** `content/settings/site.config.json`（且**不應加**；避免重複）
- ❌ **未在** env / vite config（per CLAUDE.md §4「第一版不得使用 env 為主」之精神；config-first 設計）

### 1.5 UTM / cross-platform tracking 相關

- `src/scripts/ga4-url-builder.js` 已實作 cross-source UTM injection（per Phase related-links-ga4-audit）
- `content/settings/promotion.config.json` 之 `facebook.utm` 含 UTM patterns
- Blogger ↔ GitHub cross-link 已自動加 UTM（per `CLAUDE.md` §16.4 之 GitHub→Blogger 方向實作）

---

## §2 最小安全方案（per Task B）

### 2.1 結論

**機制已完整就位 → 無需新增 source / config schema**。

唯欠之決策（屬 user 範圍；本批不裁決）：
1. **measurementId 值**：user 之 GA4 property 之實際 `G-XXXXXXXXXX`
2. **enabled flag 切換**：`false` → `true`
3. **dev/prod gating**（可選；本批提議）
4. **event 屬性 散播至 EJS templates**（可選；屬 5-d 完成但未撒屬性之後續整合）

### 2.2 measurementId 放置建議

**保持當前位置**：`content/settings/ga4.config.json` 之 `measurementId` 欄位。

- 不新加 site.config.json 之 ga4MeasurementId 欄位（重複；schema noise）
- 不用 env / vite option（per 第一版 config-first 設計）
- ✅ 既有位置已最佳

### 2.3 哪些 output 插入 GA4

- ✅ **GitHub Pages**：head 注入（既有實作；只當 enabled=true && measurementId 非空才輸出）
- ❌ **Blogger 後台**：**不插入**；由 Blogger 主題層 / 後台 GA 設定管；避免重複收 event
- ❌ **dist-blogger/posts/*/post.html**：body fragment；無 head；天然不插

### 2.4 script 是否只在 production build 出現（**user 待決議題**）

**現況**：dev mode 與 prod mode 共用同一 EJS partial；gating 只看 `ga4.enabled` flag；user 啟用後 **dev 與 prod 皆輸出 GA4 script**。

**問題**：dev mode 之 user 本機 browse 會觸發 GA4 event；可能污染正式分析數據。

**選項**（屬 user 待決；非本批落地）：
- **A.** 接受 dev 也送 event（最簡；無 source 改動）；GA4 數據需加 filter（如排除 localhost referrer / IP）
- **B.** 在 ga4.ejs 加 production-only gating（如 build-github mode === 'build' 時才輸出）；屬 source 改動；需另開 phase
- **C.** 在 measurementId 端用「dev_id」 / 「prod_id」雙 ID + build mode 切換；schema 與 build 改動較大

**Claude 推薦**：**A 接受 dev 也送**（最最低風險；GA4 數據端 filter 簡單）；若 user 發現 dev event 污染嚴重再啟動 B / C。

### 2.5 空值時行為

- `ga4.enabled === false` → 不輸出（既有；driven by `ga4.enabled` flag）
- `ga4.enabled === true && measurementId === ""` → **靜默不輸出**（既有；雙條件 gating）；非 console.warn / 非 throw；避免 build noise
- ✅ 既有實作已符合 spec 之「若 measurementId 空值，是否不輸出 script」

### 2.6 production / dev 行為

| Mode | enabled | measurementId | 輸出 |
|---|---|---|---|
| dev / prod | false | (any) | ❌ 不輸出 |
| dev / prod | true | "" | ❌ 不輸出（雙條件 gating 之 measurementId 非空 fail） |
| dev / prod | true | "G-XXXXXXXXXX" | ✅ 輸出 |

**待決**：是否新增 prod-only gating（§2.4 之 Option A/B/C）— 本批不裁決。

---

## §3 GA4 啟用 user checklist

當 user 準備啟用 GA4 時，依以下順序操作：

### 3.1 必勾項（8 項）

```
- [ ] 我已於 Google Analytics 4 後台建立 property + data stream
- [ ] 我已取得 measurementId（格式 G-XXXXXXXXXX）
- [ ] 我已於本機編輯 content/settings/ga4.config.json：
      - measurementId: "G-XXXXXXXXXX"
      - enabled: true
- [ ] 我已跑 npm run build 確認 dist head 含 gtag script
- [ ] 我已於本機 npm run dev 確認 GA4 script 正確載入（瀏覽器 console 無錯）
- [ ] 我已決定是否接受 dev mode 也送 event（per §2.4 Option A）；或另開 phase 加 prod-only gating
- [ ] 我已 commit 之 ga4.config.json 變動；git status clean
- [ ] 我已 push 至 deploy repo 之 gh-pages（GitHub Pages 部署後 GA4 開始實際收 event）
```

### 3.2 額外建議勾選

```
- [ ] 我已於 Google Search Console 連結 GA4 property
- [ ] 我已驗 GA4 realtime report 顯示我自己之訪問 event
- [ ] 我已於 GA4 後台設 filter 排除自己 IP（避免污染自己訪問之 event）
- [ ] 我已留意 dev mode 之 event 是否進入正式 property（若不希望 → 等 prod-only gating phase）
- [ ] 我已驗證 9 個 spec event（page_view 自動；其餘 8 個待 5-d 後續 attr 撒佈完成）
```

### 3.3 啟用後驗證指令

```bash
# 確認 dist head 含 gtag script（mid 4 個 main page）
grep -c "gtag/js" dist/index.html dist/posts/*/index.html

# 確認 sitemap unchanged
grep -c "<url>" dist/sitemap.xml

# validate baseline 仍正常
npm run validate:content
```

---

## §4 風險與不做事項

### 4.1 本批風險

| 風險 | 等級 | 緩解 |
|---|---|---|
| user 誤填 measurementId（typo） | 🟡 中 | 啟用後 GA4 realtime report 驗證；錯則更新 ga4.config.json 重 build |
| dev mode event 污染 prod GA4 | 🟡 中 | per §2.4 Option A 接受 + GA4 filter；或另開 prod-only gating phase |
| Blogger 平台 GA 與 GitHub GA 重複收 event | 🟢 低 | 既有設計 Blogger 不接 GA4；若 user 在 Blogger 後台另設 GA 屬 user 範圍 |
| measurementId 洩漏（commit 至 public repo）| 🟢 低 | measurementId 設計上為 public（嵌入 HTML head）；非機密；故 commit 無問題 |
| GA4 啟用後初次 page_view event 之延遲 | 🟢 低 | Google 端 24-48hr 後才顯示完整數據；屬正常 |

### 4.2 本批不做

| # | 項目 |
|---|---|
| 1 | 不填 measurementId 實際值（屬 user 範圍）|
| 2 | 不切 enabled=true（屬 user 範圍）|
| 3 | 不加 prod-only gating（屬待決議題；user 決後另開 phase）|
| 4 | 不撒 GA4 event attr 至 EJS templates（屬 5-d 後續整合；獨立 phase）|
| 5 | 不動 Blogger 端 GA 設計（保持不接）|
| 6 | 不改 ga4.config.json schema |
| 7 | 不改 ga4.ejs / ga4-events-helper.ejs / build-github.js |
| 8 | 不改 docs/seo-ga4-adsense.md（既有 §5 已完整；本 doc 為其補充）|
| 9 | 不 push 至 deploy repo |
| 10 | 不啟動 FB-P5-c / Admin write / DS / SEO / FB write |

---

## §5 對既有系統之影響

| 維度 | 狀態 |
|---|---|
| `src/**` | ❌ 未動 |
| `content/settings/ga4.config.json` | ❌ 未動（enabled=false / measurementId="" 維持）|
| `content/**` 其他 | ❌ 未動 |
| `dist/**` / `dist-blogger/**` | ✅ build 後 dist 重產但內容不變（無 GA4 script；sitemap 14 url entries 不變）|
| Deploy repo | ❌ 未動（HEAD 仍 `4ecd92d`）|
| GitHub Pages 線上 | ❌ 未動 |
| Blogger 後台 | ❌ 未動 |
| validate baseline `0/38/33` | ❌ 不變（純 docs；無 validator / fixtures / content 變動）|
| FB / SEO / Admin / DS 系列 | ❌ 未動 |

---

## §6 邊界聲明

- ✅ 本文件**僅為 GA4 preflight**；不改任何 source / settings / template / dist / deploy
- ✅ 本文件**不**填 measurementId 實際值 / **不**切 enabled flag
- ✅ 本文件**不**加 prod-only gating（屬 §2.4 待決）
- ✅ 本文件**不**撒 GA4 event attr（屬 5-d 後續整合）
- ✅ 本文件**不**動 Blogger 端 GA 設計
- ✅ 本文件**不** push
- ✅ 對齊 `CLAUDE.md` §29「不接 FB API / 不自動社群發文」+ §6 Phase 5 GA4 之既有設計

---

## §7 Cross-links

- `docs/seo-ga4-adsense.md` §5（GA4 tracking 完整實作報告；本 doc 為其 user-facing checklist 補充）
- `CLAUDE.md` §6 Phase 5 SEO / GA4 / AdSense / §16.4 Blogger ↔ GitHub cross-link UTM / §29 第一版不做清單
- `content/settings/ga4.config.json`（既有 config；enabled=false / measurementId=""）
- `src/views/tracking/{ga4,ga4-events-helper}.ejs`（既有 template）
- `src/scripts/build-github.js` line 55 + 90（HEAD_PARTIALS plumb）
- `src/scripts/ga4-url-builder.js`（cross-source UTM injection）
- `content/settings/promotion.config.json` `facebook.utm`（UTM patterns）

---

（本文件結束）
