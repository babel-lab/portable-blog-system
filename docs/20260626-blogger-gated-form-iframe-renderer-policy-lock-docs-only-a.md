# Blogger Gated Form iframe Renderer — Policy Lock（docs-only）

- **Phase**：`20260626-blogger-gated-form-iframe-renderer-policy-lock-docs-only-a`
- **Type**：docs-only policy lock（**無** source / content / settings / build / deploy / report 變更）
- **Date**：2026-06-26
- **Predecessor preflight**：`blogger-gated-form-iframe-renderer-policy-preflight-readonly-a`（read-only，未落檔之口頭報告）

---

## 1. Purpose

本文件鎖定「未來把 Blogger gated download safe placeholder 升級為真正 Google Form **iframe renderer**」之安全政策與 source 邊界。

- 這是 **docs-only policy lock**。
- **不**包含 source implementation（iframe renderer 本次不寫）。
- **不**包含 build / deploy / report output。
- **不**含任何實際 Google Form URL / Google Drive ID / file ID / response URL / edit URL / token / secret / respondent data。
- 目的：在真正動 source 之前，把 preflight 盤點出的政策決策（URL allowlist / fallback / iframe 屬性 / sandbox / no-echo / validator-checklist 邊界 / source scope）固定成可被未來 phase 引用的單一 source-of-truth，消除實作時的決策空窗。

---

## 2. Current baseline

| 項目 | 值 |
| --- | --- |
| branch | `main` |
| HEAD | `origin/main` = `f4e749d` |
| full hash | `f4e749dfb9c98a65fba32ebb26cda1386838b612` |
| subject | `docs(validation): record gated fileUrl validator checks` |
| working tree | clean |
| ahead/behind | `0 / 0` |
| `.git/index.lock` | 不存在（NO INDEX LOCK） |

本 policy lock 以此凍結基準為對照；落檔本身為 docs-only additive，不改動上述任何 source / validation 狀態。

---

## 3. Current safe renderer state（read-only 確認）

`src/scripts/build-blogger.js` → `deriveRenderedGatedDownload(post)`：

- 目前 renderer 為 **metadata-based OR detection**（非三條件 AND）：
  `pageType === 'gated_download'` **OR** `downloadFunnel.role === 'gated_page'` **OR** `gatedDownload` 帶任一 gated metadata signal（`mechanism` / `formEmbedUrl` / `postSubmitResource` key 存在，或 `enabled === true`）。
- `pageType: gated_download` **單獨即可啟用** gated placeholder。
- 傳入 template 的 context 目前**只含 safe render data**：`{ enabled, mechanism, renderMode:'placeholder', hasFormEmbedUrl, title, message }`。
- `hasFormEmbedUrl` 為 **boolean only**；**永不**把 raw `formEmbedUrl` 傳入 template；`title` / `message` 為 build 端 safe 常數。

`src/views/blogger/blogger-post-full.ejs`：

- 目前**完全沒有 `<iframe>`**。
- gated branch（`isGatedPage = gatedDownload.enabled === true`）只渲染 placeholder 的 `title` / `message`。
- legacy download branch 仍有 **`!isGatedPage` guard**（`if (!isGatedPage && post.download && post.download.enabled && post.download.fileUrl)`）。
- gated pages **不**渲染 direct `download.fileUrl`。

---

## 4. Current content / metadata state（read-only 確認）

**access page**（`content/blogger/posts/20260626-bopomofo-practice-cards-access.md`）：

- `pageType: gated_download`
- 有 `gatedDownload.mechanism`（`"google-form"`）
- `gatedDownload.formEmbedUrl` **目前為空字串**
- `gatedDownload.postSubmitResource: "drive-link"` 為 **enum / placeholder only**，**非** actual Drive URL
- **無** `download:` block
- `status: draft` / `draft: true`
- **無**任何 actual Form URL / Drive URL

**entry page**（`content/blogger/posts/20260626-bopomofo-practice-cards-entry.md`）：

- `status: draft` / `draft: true`
- `downloadFunnel.role: entry`（entry role only）
- **無** `gatedDownload` block
- **無** `download:` block

**validator hardening**：`src/scripts/validate-content.js` → `validatePageTypeMetadata` 已能 warning `pageType: gated_download` + non-empty `download.fileUrl`（warning type `page-gated-download-has-direct-file-url`；presence-based、不要求 `enabled === true`、no-echo）。

---

## 5. Locked iframe URL policy

未來 iframe **只能在以下全部成立時**渲染：

- page 已被既有 gated detection 判定為 gated；且
- `gatedDownload.mechanism` 為 Google Form 相容值；且
- `gatedDownload.formEmbedUrl` 為 **non-empty string**；且
- URL 通過 **strict allowlist**（以下）。

**Allowed scheme**

- `https:` only。

**Allowed host**

- 第一個 source phase **優先只允許 `docs.google.com`**。
- `forms.gle` 短連結**不**直接嵌入 iframe，除非未來政策明確允許 resolve / normalize 後再嵌。

**Allowed path shape**

- 只允許 Google Forms **public embed / viewform** URL。
- 形態應類似 `/forms/.../viewform`。

**Recommended query**

- 預期 `?embedded=true`。

**Forbidden**

- response URLs。
- edit URLs。
- prefilled private URLs（若帶敏感值）。
- 任何含 token-like / respondent-like / private identifier 的 URL。
- 非 Google 的任意 iframe URL。
- `http:`。
- `javascript:` / `data:` / `blob:` URL。

**No-echo on reject**

- renderer 對被拒絕的 URL **不得** echo 於 output 或 logs。

---

## 6. Empty / invalid URL fallback policy

- 若 `formEmbedUrl` **為空**：
  - 保留 safe placeholder；
  - **不**渲染 iframe；
  - **不**渲染 direct download link。
- 若 `formEmbedUrl` **invalid / disallowed**：
  - 保留 safe placeholder；
  - **不**渲染 iframe；
  - **不**渲染 direct download link；
  - **不** echo raw URL。
- 非 draft gated page 但 `formEmbedUrl` 空：技術上應允許，但未來 validator / checklist phase 應產生 **operator-facing warning**（提醒 operator 該頁尚未提供 embed）。

---

## 7. Iframe output policy

- iframe 必須有 safe `title`。
- iframe `title` 由 safe constants 或 sanitized post title 產生，**不**用 raw URL。
- iframe 使用 `loading="lazy"`。
- iframe 包在 responsive、Blogger-safe 的外層 markup。
- layout 維持 **Flex-first / 非 Grid**，除非既有專案樣式另有規定（CLAUDE.md §9.4）。
- default height 保守且文件化。
- iframe 附近**不**渲染任何 direct file link。
- 真正的 download / Drive resource 只在 Google Form **送出後** 之 form flow 內取得（停留在 Google Form 端，不進 repo）。

---

## 8. Sandbox policy lock

- 第一個實作**不自動要求** sandbox，因 Google Form embed 在嚴格 sandbox 下可能失效。
- 若 URL allowlist 夠嚴格，first source phase 可選擇 **no sandbox**。
- 若使用 sandbox，token set 必須在 production 前**明確測試**。
- sandbox 決策屬 implementation-sensitive，**不得 silently guess**。
- 任何 source phase 若加 sandbox token，必須**文件化原因**。

---

## 9. No-echo / secret policy

- docs / commit message / validation message **不得**含 actual Form URL / Drive ID / token / respondent data。
- validator / renderer warning **只描述欄位名**，不 echo value。
- raw `formEmbedUrl` **不得**被原樣印出。
- docs 若需範例，只可用**明顯假造且非敏感**的 example。

---

## 10. Validator / checklist future policy

- 未來 validator **可**為以下情形加 warning（各須獨立評估）：
  - gated Google Form page 但 `formEmbedUrl` 空；
  - non-empty `formEmbedUrl` 未通過 allowlist；
  - 含 suspicious query params / response / edit / token-like 的 URL。
- 此類 validator phase 應與 iframe renderer source **分開**，除非 Dean 明確核准合併 scope。
- **避免 scanned invalid fixtures**，除非 baseline bump 已被明確核准（per CLAUDE.md §3a baseline-bump 紀律）。
- warning 行為優先用 **in-memory smoke tests**（非 package script、非 validation-report baseline 成員）。
- copy-helper / publish-checklist 未來**可**加 operator warning，但**不**在 first renderer source phase 做，除非另行核准。

---

## 11. Locked future source implementation path

- policy lock 後的**最小 source phase = I1 Blogger-only renderer**。
- likely allowed files：
  - `src/scripts/build-blogger.js`
  - `src/views/blogger/blogger-post-full.ejs`
- first renderer source phase 應：
  - **Blogger-only**；
  - content 端 `formEmbedUrl` **維持空**（→ 實作後 current output 仍 placeholder）；
  - 保留 placeholder fallback；
  - 保留 `!isGatedPage` legacy download guard；
  - **不**碰 GitHub renderer；
  - **不**碰 content；
  - **不**碰 validator；
  - **不**跑 build，除非 Dean 明確核准。
- recommended future commit message：
  - `feat(blogger): render gated form iframe for public embed urls`

---

## 12. Baseline impact expectations

若只改 renderer 且 `formEmbedUrl` 維持空：

- `validate:content` 應維持 **0 / 134 / 106**。
- `check-page-type-validator` 應維持 **110 / 0**。
- `page-type-robots` 應維持 **29 / 0**。
- `include-in-sitemap` 應維持 **19 / 0**。
- `include-in-listings` 應維持 **21 / 0**。

（以上數值為本 policy lock 記錄之 expected-unchanged baseline，依任務 spec；本 docs-only phase **未**重跑量測。）

- 若不跑 build → **無 output evidence**。
- access / entry 皆 `draft:true`，build output **不**會包含它們，除非另有 publish / content phase 改 status。
- 要在 output **實際看到 iframe** 需要多個獨立 phase：
  - content phase 提供合法 public embed URL；
  - publish / status phase 把 gated page 改為 non-draft；
  - build validation phase；
  - （如適用）Blogger live repost phase。

---

## 13. Risk ranking

**P0**

- 實際 Form URL / Drive ID / token / respondent data 被寫入 repo。
- gated page 渲染 direct file link。
- 任意 / 未受 allowlist 限制的 iframe URL 被允許。

**P1**

- 非 draft gated page 但 `formEmbedUrl` 空 → 壞 UX。
- build output / Blogger live 被誤觸。
- validator baseline 非預期變動。

**P2**

- iframe height / RWD UX 不佳。
- copy-helper / checklist 文案尚未同步。
- sandbox 相容性未知。

---

## 14. Blocked / approval-needed

- 真正 iframe renderer source 須 **Dean approval**（本 policy lock 之後）。
- 實際 public Google Form embed URL 之處理須 Dean approval，且**不得**貼入 repo，除非政策明確允許。
- Google Form / Google Drive 之 post-submit resource 處理**留在 repo 之外**。
- build / report / deploy 須另開獨立明確 scope。
- Blogger live repost 須另開獨立明確 scope。
- GitHub / new-domain iframe renderer **仍 out of scope**。

---

## 15. Red lines（本 phase）

- docs-only。
- no source mutation。
- no content mutation。
- no settings mutation。
- no CLAUDE.md mutation。
- no package / lockfile mutation。
- no build。
- no deploy。
- no `report:validation`。
- no `check:validation-report`。
- no backend / Blogger / Google Form / Google Drive / GA4 / Admin touch。
- no actual Form URL / Drive ID / secret / token / respondent data。
