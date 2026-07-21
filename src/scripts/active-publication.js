// Phase 20260721-publish-target-stage Slice 4A：consumer read helper
//
// 上位契約：docs/20260720-publish-target-stage-contract.md（Slice 4A：consumer hardening）
//
// 唯一語意：
//   Active Blogger publication =
//     target.status === "published"
//     AND typeof target.publishedUrl === "string"
//     AND target.publishedUrl.trim() !== ""
//
// Fail-closed 對象（一律視為 inactive；即使 publishedUrl 非空）：
//   - status 缺漏（undefined / null）
//   - status 為非字串型別
//   - status 為 draft / ready / archived
//   - 未來 status 值（例：withdrawn / unpublished / …）——即使 schema 尚未加入
//   - status 大小寫變體（"Published" / "PUBLISHED"）——case-sensitive
//   - status 前後空白（" published "）——不 trim status
//   - publishedUrl 缺漏 / 非字串 / 空字串 / whitespace-only
//   - target 缺漏 / null / 非 plain object / array
//
// 本 helper 為 consumer read 邊界之 fail-closed gate；schema validator（validate-content.js）
// 另行負責回報 malformed status。本 helper 對非法輸入**不 throw**、**不 warn**、**不 log**——
// 一律回 false / null，以確保 admin / preview / build 等 render 端不因單筆髒資料整頁崩潰。
//
// 本 helper 為 platform-agnostic 純函式；github.status 需 active 判斷時亦可重用。
//
// Slice 4A 不動 sidecar bytes、不動 schema、不動 status enum、不動 schemaVersion、不新增
// withdrawn / lifecycle；本 helper 為未來 withdrawal 契約（Slice 4B+）之 read-side 前置條件。

export const ACTIVE_PUBLISHED_STATUS = 'published';

// 型別穩健之 plain object 判定（沿用 publish-stage.js / apply-blogger-backfill-truth.js 之慣例）。
function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

// 是否為 non-empty trimmed string（沿用 plan-blogger-backfill-sidecars.js isPresentValue 之語意）。
function isNonEmptyTrimmedString(v) {
  return typeof v === 'string' && v.trim() !== '';
}

// isActivePublishedTarget(target)
//   target 應為 sidecar 之 blogger / github 區塊（例：publish.blogger 或 publish.github）。
//   任何非 published 狀態 / 任何非 non-empty publishedUrl → false（fail-closed）。
//   不 throw；對任何輸入形狀（null / string / array / number / …）皆回 false。
export function isActivePublishedTarget(target) {
  if (!isPlainObject(target)) return false;
  if (target.status !== ACTIVE_PUBLISHED_STATUS) return false;
  return isNonEmptyTrimmedString(target.publishedUrl);
}

// getActivePublishedUrl(target)
//   isActivePublishedTarget(target) 為 true 時回傳原字串（不 trim；保留作者原輸入）；
//   否則回 null。canonical / placeholder / promotion / admin consumer 應以本 helper 為
//   唯一讀取入口，避免各自散落 status 判斷。
export function getActivePublishedUrl(target) {
  return isActivePublishedTarget(target) ? target.publishedUrl : null;
}
