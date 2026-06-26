# Blogger Gated Form iframe Renderer — Source Validation Evidence Record（docs-only）

- **Phase**：`20260626-blogger-gated-form-iframe-renderer-source-validation-record-docs-only-a`
- **Type**：docs-only validation evidence record（**無** source / content / settings / CLAUDE.md / build / deploy / report 變更）
- **Date**：2026-06-26
- **Records commit**：`77561d1 feat(blogger): render gated form iframe for public embeds`

---

## 1. Purpose

本文件記錄 `77561d1 feat(blogger): render gated form iframe for public embeds` 之 **validation evidence**。

- 這是 **I1 Blogger-only iframe renderer source landing** 的 validation evidence record。
- **不**包含 build / deploy / report output。
- **不**包含任何 actual Google Form URL / Google Drive ID / file ID / response URL / edit URL / token / secret / respondent data。
- 目的：把 `77561d1` 之 scope、safety behavior、validation results、以及仍未完成事項固定成可被未來 phase 引用的 evidence record。

---

## 2. Current baseline

| 項目 | 值 |
| --- | --- |
| branch | `main` |
| HEAD | `origin/main` = `77561d1` |
| full hash | `77561d130daedadf513f3105fc70c4a968fe6bce` |
| subject | `feat(blogger): render gated form iframe for public embeds` |
| working tree | clean |
| ahead/behind | `0 / 0` |
| `.git/index.lock` | 不存在（NO INDEX LOCK） |

本 evidence record 以此凍結基準為對照；落檔本身為 docs-only additive，不改動上述任何 source / validation 狀態。

---

## 3. Prior policy lock

- predecessor policy lock：`6c0125f docs(download): lock gated form iframe policy`
  （`docs/20260626-blogger-gated-form-iframe-renderer-policy-lock-docs-only-a.md`）。
- `77561d1` 之 source implementation **遵循 locked I1 Blogger-only path**（policy lock §11）。
- source phase **不**填入 actual `formEmbedUrl`。
- current content **維持不變**（access / entry 兩頁未動）。

---

## 4. Source landing scope

`77561d1` **只修改 2 source 檔**：

- `src/scripts/build-blogger.js`
- `src/views/blogger/blogger-post-full.ejs`

並且：

- **no content changes**（`content/**` 未動）。
- **no settings changes**（`content/settings/**` 未動）。
- **no docs / CLAUDE.md changes in source commit**（source commit 不含任何 docs / CLAUDE.md）。
- **no validator changes**（`validate-content.js` / `check-page-type-validator.js` 未動）。
- **no package / lockfile changes**。
- **no GitHub renderer change**（`src/views/pages/post-detail.ejs` 未動；iframe count = 0）。
- **no build output**。
- **no generated report output**（無 `dist-reports/validation-report.json`）。

（`git show --name-status 77561d1`：`M src/scripts/build-blogger.js` / `M src/views/blogger/blogger-post-full.ejs`，僅此兩檔。）

---

## 5. Renderer behavior（`build-blogger.js`）

- `deriveRenderedGatedDownload(post)` 在傳給 template 前 **validate / sanitize** iframe 資料。
- sanitized iframe object 只在 URL 通過 **strict allowlist** 時才存在；其 fields 限 `src`（已驗證）/ `title`（safe 常數）/ `height`（720）。
- raw rejected `formEmbedUrl` **不**傳給 template（被拒時 `iframeSrc = null`）。
- 對 empty / invalid / disallowed URL，`renderMode` 維持 `'placeholder'`。
- `renderMode` 只在 **allowed public Google Forms embed URL** 時才為 `'iframe'`。
- template 只在 safe iframe data 存在時 render iframe；否則維持既有 placeholder 之 `title` / `message`。
- pure helper `isAllowedGoogleFormEmbedUrl(raw)`：回 **boolean only**；**永不** echo / log / return 被拒絕的 URL 字串（no-echo policy）。

---

## 6. URL allowlist behavior

iframe 只在以下**全部成立**時渲染（`isAllowedGoogleFormEmbedUrl`）：

- requires non-empty string。
- requires valid `new URL(...)`。
- requires protocol exactly `https:`。
- requires host exactly `docs.google.com`。
- requires path contains `/forms/`。
- requires path ends with `/viewform`。
- requires query includes `embedded=true`。
- rejects URL that looks like **edit / response / formResponse / token / private / respondent / `entry.*` prefill / email-like**（path 雙重保險 + query key denylist）。

forbidden（任一命中即 fallback placeholder，且不 echo raw URL）：

- `http:` / `javascript:` / `data:` / `blob:`。
- 非 `docs.google.com` host（含 `forms.gle` 短連結，本 phase 不直接嵌入）。
- edit URLs / response URLs。
- token-like / respondent-like / prefilled-private query params。
- 任意 external iframe URL。

---

## 7. iframe output policy（`blogger-post-full.ejs`，gated branch only）

- iframe 使用 escaped `src`（`<%= gatedDownload.iframe.src %>`）。
- iframe 使用 escaped `title`（`<%= gatedDownload.iframe.title %>`）。
- iframe includes `loading="lazy"`。
- iframe 包在 Blogger-safe responsive wrapper（`<div class="gated-download-form-frame">`）+ inline width/height fallback（`width:100%;border:0;min-height:<height||720>px;`）。
- gated branch **不**渲染任何 direct file link。
- **不**渲染 Drive URL / download resource；真正的 download / Drive resource 只在 Google Form **送出後** 之 form flow 內取得（停留在 Google Form 端，不進 repo）。
- legacy download branch 仍有 **`!isGatedPage` guard**（`if (!isGatedPage && post.download && post.download.enabled && post.download.fileUrl)`）。
- gated page 仍**不**渲染 direct `download.fileUrl`。

---

## 8. Current content behavior

- access page（`content/blogger/posts/20260626-bopomofo-practice-cards-access.md`）維持 `pageType: gated_download`。
- `gatedDownload.formEmbedUrl` **維持空字串**。
- `gatedDownload.postSubmitResource: "drive-link"` 維持 **enum / placeholder only**（**非** actual Drive URL）。
- access page **無** `download:` block。
- access / entry 兩頁維持 `status: draft` / `draft: true`。
- 因此 **iframe path 目前 dormant**：在 Dean 另行核准實際 public Form embed URL + content publish / build scope 之前，現有頁面由 source 邏輯解析為 placeholder mode。

---

## 9. Validation commands and results

- **source landing session 已實際跑**：
  - `node src/scripts/check-page-type-validator.js` = **`110 passed / 0 failed`**
  - `npm run validate:content` = **`0 errors / 134 warnings / 106 posts`**
- **recovery audit（read-only）未重跑**上述 commands。
- **本 evidence-record phase 以 read-only 方式重新確認**（非 build / 非 report）：
  - `node src/scripts/check-page-type-validator.js` = **`110 passed / 0 failed`**（unchanged）
  - `npm run validate:content` = **`0 errors / 134 warnings / 106 posts`**（unchanged）
- `validate:content` baseline 不變；`check-page-type-validator` baseline 不變。
- 無 `dist-reports/validation-report.json`（absent）。
- 無 build output committed。
- 無 deploy output。

---

## 10. What was intentionally not run

- `report:validation`。
- `check:validation-report`。
- `build:blogger`。
- `build:github`。
- deploy。
- dev server / preview。
- `build:blogger` output validation / byte-diff output validation。
- Blogger live repost。

---

## 11. Risk controls

- repo 內**無** actual Form URL / Drive ID / response URL / token / respondent data。
- rejected URL **不** echo（no-echo on reject）。
- arbitrary iframe URL **disallowed**（strict allowlist）。
- gated page **不**渲染 direct download link。
- legacy download branch 仍由 **`!isGatedPage` guard** 守住。
- content 維持 draft 且不變。
- **no GitHub renderer impact**（GitHub `post-detail.ejs` 未動）。

---

## 12. Still not complete / future phases

- CLAUDE.md §3a state sync **尚未**為 `77561d1` 完成。
- docs-only evidence record = **本任務**（即本檔）。
- record / state sync 之後仍需 **final idle freeze**。
- `build:blogger` output validation / byte-diff **未跑**。
- `report:validation` **未跑**。
- `check:validation-report` **未跑**。
- actual public Google Form embed URL **未加入**。
- content publish / non-draft 切換 **未做**。
- Blogger live repost **未做**。
- broader gated-signal validator rule（`pageType:gated_download` 之外的 gated signal）仍 **future phase**。

---

## 13. Red lines（本 phase）

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
