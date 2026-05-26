---
# ─────────────────────────────────────────────
# _sample.fb.md — Facebook sidecar 範本
# ─────────────────────────────────────────────
# 1. 本範本同時適用 content/{site}/posts/ 與 content/{site}/pages/。
# 2. 複製成 {slug}.fb.md 後，若要啟用 FB 推廣，請改為 enabled: true。
# 3. {{ articleUrl }} placeholder 由發布流程或後續工具解析（詳見 docs/fb-sidecar-schema.md §5）。
# 4. FB 文案只放在 .fb.md；不放 .md frontmatter，也不放 .publish.json。
# 5. UTM 由 content/settings/promotion.config.json 集中管理；本範本不寫死 UTM。
# 6. titleEn 為 FB 貼文英文標題 metadata，目前可暫不顯示，但保留供未來 SEO / GitHub / 跨平台轉換使用（詳見 docs/fb-sidecar-schema.md §3.4）。
# 7. finalUrl / fbPostUrl / fbPostedAt / fbPostId / fbCampaign 為 FB post metadata（Phase 20260520-c-2 收編；詳見 docs/fb-sidecar-schema.md §3.1 / §3.5）；全為 optional；預設空字串；發布 FB 後可手動回填。
# ─────────────────────────────────────────────

enabled: false
page: ""
target: "auto"
customUrl: ""
hashtags:
  - "#示範主題"
  - "#示範分類"
title: ""
titleEn: ""
note: "範本檔；複製成 {slug}.fb.md 後請填入實際內容並改 enabled: true。本範本同時適用 posts/ 與 pages/。"

# ─── FB post metadata（optional；Phase 20260520-c-2 收編；詳見 docs/fb-sidecar-schema.md §3.5） ───
# finalUrl   ：FB 貼文 body 內要放入的目標文章 URL（FB → article）；可由 §5 placeholder 推導或手動覆寫
# fbPostUrl  ：FB 貼文本身之 URL（→ FB）；由作者於 FB 發布後手動回填；不加 UTM
# fbPostedAt ：FB 實際發布時間；建議 ISO 8601（如 2026-05-26T11:40:00+08:00）或 "YYYY-MM-DD HH:mm"
# fbPostId   ：FB Graph API post ID；第一階段不依賴此欄位
# fbCampaign ：人工分類標記（如 "book-review-2026q2"）；不等同 UTM campaign（UTM 由 promotion.config.json 集中管理）
finalUrl: ""
fbPostUrl: ""
fbPostedAt: ""
fbPostId: ""
fbCampaign: ""
---

📖 這裡放一句吸引讀者的開場文案。

可以再寫 1～2 句補充說明、提問或勾起興趣的句子，讓讀者願意點進去。

👇 完整文章：
{{ articleUrl }}
