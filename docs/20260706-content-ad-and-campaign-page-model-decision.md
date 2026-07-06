# 廣告頁 / 推廣頁 / Landing Page / 文章廣告區塊 —— 資料模型與規則決策

- 日期：2026-07-06
- 類型：docs-only 設計決策紀錄（**不含實作**）
- 影響分類編號（§7）：主要 A（Claude 規範 / 專案文件）、概念上關聯 C（內容資料模型）/ J（AdSense / GA4 / 追蹤）/ K（Promotion）
- 狀態：**conceptual model only** —— 本文只記錄決策，本輪不動 schema / build script / template / EJS block / GA4 tracker / Blogger API / deploy

> ⚠️ 本文件是「設計決策」而非「已實作規格」。任何實際 schema 欄位、build 行為、EJS block、GA4 事件皆須另開 phase + user explicit approval。文件中的 YAML 皆為 **概念示意**，不代表最終欄位名或已落地格式。

---

## 0. 背景與問題

目前系統對「一般文章」與「推廣 / 廣告導向頁面」尚未明確分層。若把推廣頁直接塞進一般文章模型，未來同一個 topic / industry（例如「旅遊」）下同時存在「普通旅遊文章」與「旅遊推廣頁 / 合作導客頁」時會互相污染，且會把三個不同層次的東西混在一起：

1. **內容本質**（這是什麼頁）
2. **變現版位**（放幾個 AdSense / 自有推廣 block）
3. **追蹤 / 平台**（UTM / GA4、Blogger / GitHub 發布位置）

本文件把這三層分開，並定義各自的邊界。

---

## A. Content type 分流

一般文章與推廣頁要**分開建模**。一般文章仍是 `article` / post；Landing page / campaign page / promotion page 要視為**獨立 content type**。

建議至少支援三種 content type：

```text
article        一般文章 / 部落格文
landing-page   落地頁（導單一 CTA / 轉換）
campaign-page  活動 / 推廣頁（合作促銷、導客、名單蒐集）
```

**關鍵決策**：不要把「旅遊推廣頁」混進「一般旅遊文章」裡。因為未來同一個 topic / industry 之下，可能同時存在普通旅遊文章與旅遊推廣頁，兩者內容本質不同，不可共用同一種 type。

建議的模型概念（**概念示意、非最終欄位**）：

```yaml
contentType: article | landing-page | campaign-page
industry: travel            # 或沿用既有 category 維度，例如 travel
campaignPurpose: partner-promotion | tour-fill | lead-generation
platformTargets:            # 只是「發布位置」，不是「內容本質」
  - blogger
  - github
  # - future-site
```

`platformTargets`（Blogger / GitHub / 未來站台）**只是發布位置，不是內容本質**。同一份 content type 可以發到不同平台；平台不決定它是不是 campaign page。

> 註：本文件使用 `contentType` 為概念名，用以與現有 frontmatter `contentKind`（§11）區分討論。是否複用 `contentKind`、新增獨立欄位、或如何對應，屬未來 schema phase 決定，本文不鎖定。

---

## B. 廣告區塊基礎規則（base six AdSense slots）

預設頁面有**六個 AdSense block**。這是 **base ad layout（基礎變現版位）**，它：

- **不等於**自有廣告（self-owned advertising）
- **不等於** campaign promo block（活動推廣區塊）

明確規則：

- 一般 `article` 預設**可有**六個 AdSense slots
- `landing-page` / `campaign-page` **也可有**六個 AdSense slots
- 這六個 slots 是**基礎 monetization layout**，跨 content type 通用

**關鍵決策**：不要把「base six AdSense slots」與「custom / self-owned promo EJS blocks」混成同一種東西。它們是兩個不同的層：前者是平台廣告版位，後者是自有推廣覆蓋層（見 §C）。

---

## C. Custom / self-owned EJS promo blocks 規則

Custom / self-owned advertising 或 promo EJS blocks **不是每頁都必須有**。它們只在該頁**真的有推廣需求**時才配置。

**關鍵決策**：

- custom EJS promo blocks **不限於** landing / campaign page
- 一般 `article` **也可以**額外配置 custom EJS promo / ad blocks
- 但它是 **optional overlay（可選覆蓋層）**，**不是** base six AdSense slots 的替代品

也就是說：base six AdSense slots 與 custom promo blocks 可以並存；custom block 是加疊上去的，不是拿來取代六個 slot 的。

建議的模型概念（**概念示意、非最終欄位、不實作**）：

```yaml
ads:
  adsenseMode: full | limited | off
  adsenseSlots:
    - slotId
      placement
      enabled
  customPromoBlocks:
    - blockId
      template
      campaignId
      placement
      enabled
```

再次強調：以上僅為 **conceptual model**，本輪不做程式、不建 schema、不寫 EJS。

---

## D. Landing / campaign page 的 AdSense 彈性

Landing / campaign page 應允許 **AdSense 模式調整**（`adsenseMode`）：

```text
full     使用完整六個 AdSense slots
limited  只使用部分 AdSense slots，避免干擾 CTA
off      完全關閉 AdSense，只保留 campaign / promo CTA
```

理由：推廣頁的主要目標是轉換 / CTA，過多 AdSense 版位可能干擾轉換動線，因此需要能收斂或關閉平台廣告，同時保留自有 campaign / promo CTA。

本次**只記錄此決策**，不要做程式。`adsenseMode` 的實際欄位、預設值、與 content type 的預設對應，皆留待未來 phase。

---

## E. Blogger ID / Backfill 邊界（避免未來混淆）

為避免與既有 Blogger backfill 策略混淆，補記邊界（與 `docs/20260706-blogger-identity-and-backfill-strategy.md` 一致）：

- GitHub markdown 的 `date` 與 Blogger 的 published time **可以不同，不是錯誤**。
- Blogger 可能**先發布**，之後才複製到 GitHub 測試，因此日期不一致是**合法狀態**。
- Dean 的手動流程通常看得到 Blogger 的 **title / URL / publish time**，但**看不到** Google Blogger 的 internal `postId`。
- **不要要求 Dean 手動提供 Blogger `postId`**。
- `bloggerPostId` **只能**由未來系統 / API / 管理流程實際取得時，才存為 platform metadata。
- **不可猜測** Blogger URL / `postId` / `publishedAt`。

已知真實 Blogger 資料範例（Dean 明示提供，**非猜測**，僅供對照）：

```text
文章：第2個商業思維#2(提問筆記書)   （對應 we-media-myself2）
Blogger URL：https://babel-lab.blogspot.com/2026/05/we-media-myself2.html
published time：5/08/2026 08:12:00
```

以上是**已知值**，可作為對照；除此之外的 URL / postId / publishedAt **一律不可猜**。

---

## F. GA / UTM 邊界

明確分層，三者**不可混在同一層**：

| 層 | 內容 | 例 |
| --- | --- | --- |
| Tracking layer | UTM 與 GA4 | `utm_source` / `click` event / dimension |
| Platform / publishing target | Blogger / GitHub / 未來站台 | 發布位置 |
| Content model | content type | `article` / `landing-page` / `campaign-page` |

- UTM 與 GA4 是 **tracking layer**。
- Blogger / GitHub 是 **platform / publishing target**。
- content type 是 **content model**。

不可把「content type」「platform target」「tracking」混成同一維度。例如：不可用 UTM 值推斷 content type，也不可用平台推斷是不是 campaign page。

---

## 附註：本輪不做清單（red line 對齊）

本文件為 docs-only，**未**且**不得**在本輪：

- 修改 `CLAUDE.md` / `src/` / `content/` / `content/settings/` / `package.json` / lockfile
- 實作 schema / template / build script / EJS block / GA4 tracker
- build / preview / deploy / push gh-pages
- 猜測 Blogger `postId` / `publishedAt` / URL

上述任一項若要進行，須**各自另開 phase + user explicit approval**。
