// Phase 20260527-night-2 Admin Write Infra §15.D + §15.F prereq #5
//   - 共用 active sourceKey 建構 helper；validate-content / Admin selector / future build 共用
//   - 語義 mirror validate-content.js buildActiveSourceKeySet（line 131-142）
//   - graceful：缺檔 / JSON 錯誤 / 結構錯誤 → 回空 Set；不 throw
//   - 不依賴 loadSettings；可獨立 load `content/settings/link-sources.json`

import fs from 'node:fs/promises';
import path from 'node:path';

export function buildActiveSourceKeySet(settings) {
  const set = new Set();
  const sources = settings && settings.linkSources && settings.linkSources.sources;
  if (!Array.isArray(sources)) return set;
  for (const s of sources) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) continue;
    if (s.isActive === false) continue;
    if (typeof s.sourceKey !== 'string' || s.sourceKey === '') continue;
    set.add(s.sourceKey);
  }
  return set;
}

export async function loadActiveSourceKeySet(projectRoot) {
  if (typeof projectRoot !== 'string' || projectRoot === '') return new Set();
  const file = path.join(projectRoot, 'content', 'settings', 'link-sources.json');
  try {
    const raw = await fs.readFile(file, 'utf-8');
    const json = JSON.parse(raw);
    return buildActiveSourceKeySet({ linkSources: json });
  } catch {
    return new Set();
  }
}

// Phase 20260601-am-3 sourceKey Admin selector source implementation
//   - Additive read-only helper for Admin selector preview UI（per docs/20260601-sourcekey-admin-selector-preanalysis.md §4）
//   - 既有 buildActiveSourceKeySet / loadActiveSourceKeySet 不變（validator path 不受影響）
//   - 回傳 active sources 完整 metadata rows（sourceKey / displayLabel / sourceType / sortOrder / isActive）
//   - 依 sortOrder 升冪排序（per night-1 design §5.2 + preanalysis §4.1）
//   - 缺檔 / 結構錯誤 / 非 active → 自動排除；不 throw
//   - 不暴露 defaultRel / defaultTrackingPolicy 等內部 policy；只給 picker UI 所需 4 欄
//   - future source-inactive warning rule（preanalysis §6）若實作，將需另一 helper 回傳 inactive set；本 helper 僅含 active
export function buildActiveSourceOptions(settings) {
  const sources = settings && settings.linkSources && settings.linkSources.sources;
  if (!Array.isArray(sources)) return [];
  const rows = [];
  for (const s of sources) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) continue;
    if (s.isActive === false) continue;
    if (typeof s.sourceKey !== 'string' || s.sourceKey === '') continue;
    rows.push({
      sourceKey: s.sourceKey,
      displayLabel: typeof s.displayLabel === 'string' ? s.displayLabel : '',
      sourceType: typeof s.sourceType === 'string' ? s.sourceType : '',
      sortOrder: typeof s.sortOrder === 'number' ? s.sortOrder : 0,
      isActive: true,
    });
  }
  rows.sort((a, b) => a.sortOrder - b.sortOrder);
  return rows;
}
