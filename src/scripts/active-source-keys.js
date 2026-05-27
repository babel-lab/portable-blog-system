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
