---
# ─────────────────────────────────────────────
# _sample.fb.md — Facebook sidecar 範本
# ─────────────────────────────────────────────
# 1. 本範本同時適用 content/{site}/posts/ 與 content/{site}/pages/。
# 2. 複製成 {slug}.fb.md 後，若要啟用 FB 推廣，請改為 enabled: true。
# 3. {{ articleUrl }} placeholder 由發布流程或後續工具解析（詳見 docs/fb-sidecar-schema.md §5）。
# 4. FB 文案只放在 .fb.md；不放 .md frontmatter，也不放 .publish.json。
# 5. UTM 由 content/settings/promotion.config.json 集中管理；本範本不寫死 UTM。
# ─────────────────────────────────────────────

enabled: false
page: ""
target: "auto"
customUrl: ""
hashtags:
  - "#示範主題"
  - "#示範分類"
title: ""
note: "範本檔；複製成 {slug}.fb.md 後請填入實際內容並改 enabled: true。本範本同時適用 posts/ 與 pages/。"
---

📖 這裡放一句吸引讀者的開場文案。

可以再寫 1～2 句補充說明、提問或勾起興趣的句子，讓讀者願意點進去。

👇 完整文章：
{{ articleUrl }}
