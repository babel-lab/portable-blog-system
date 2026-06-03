import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SETTINGS_DIR = path.join(PROJECT_ROOT, 'content', 'settings');

const SETTINGS_FILES = [
  ['site',              'site.config.json'],
  ['themes',            'themes.json'],
  ['categories',        'categories.json'],
  ['tags',              'tags.json'],
  ['series',            'series.json'],
  ['ads',               'ads.config.json'],
  ['socialLinks',       'social-links.json'],
  ['promotion',         'promotion.config.json'],
  ['affiliateNetworks', 'affiliate-networks.json'],
  ['linkRules',         'link-rules.json'],
  ['seo',               'seo.config.json'],
  ['ga4',               'ga4.config.json'],
  ['navigation',        'navigation.json'],
  ['sidebar',           'sidebar.config.json'],
  ['footer',            'footer.config.json'],
];

async function readJson(filename) {
  const full = path.join(SETTINGS_DIR, filename);
  const raw = await fs.readFile(full, 'utf-8');
  return JSON.parse(raw);
}

// Phase 20260527-am-2 step-4 renderer fallback chain：
//   link-sources.json 為 additive registry；缺檔 / JSON 格式錯誤皆視為「無 registry」→ fallback 空 sources。
//   既有 SETTINGS_FILES 維持 fail-fast 慣例不變。
async function readJsonOptional(filename, fallback) {
  const full = path.join(SETTINGS_DIR, filename);
  try {
    const raw = await fs.readFile(full, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function loadSettings() {
  const result = {};
  for (const [key, file] of SETTINGS_FILES) {
    result[key] = await readJson(file);
  }
  result.linkSources = await readJsonOptional('link-sources.json', { sources: [] });
  // Phase 20260601-pm-11 download loader source：
  //   download-assets.json / download-forms.json 為 additive optional registry（empty registry landing point）。
  //   缺檔 / JSON 格式錯誤皆 fallback（沿用 readJsonOptional 既有 missing-or-parse-error 行為，本 phase 不改 helper semantics）。
  //   僅以 additive keys 暴露給未來 validator / Admin picker / renderer，不啟動任何下游 consumer。
  result.downloadAssets = await readJsonOptional('download-assets.json', { schemaVersion: 0, updatedAt: '', assets: [], notes: '' });
  result.downloadForms = await readJsonOptional('download-forms.json', { schemaVersion: 0, updatedAt: '', forms: [], notes: '' });
  // Phase 20260603-night-21 commerce-links loader exposure（source-only）：
  //   commerce-links.json 為 additive optional registry（empty registry landing point）。
  //   缺檔 / JSON 格式錯誤 / commerceLinks 欄位非 array → fallback []。
  //   依 phase spec §4：暴露為 array（settings.commerceLinks）而非 registry object；
  //   metadata 欄位（schemaVersion / updatedAt / notes）本 phase 不暴露，待後續 validator / Admin picker 階段視需要再加。
  //   本 phase 不啟動任何下游 consumer（validator / renderer / Admin）。
  const commerceLinksRegistry = await readJsonOptional('commerce-links.json', { commerceLinks: [] });
  result.commerceLinks = Array.isArray(commerceLinksRegistry?.commerceLinks) ? commerceLinksRegistry.commerceLinks : [];
  return result;
}

export { PROJECT_ROOT, SETTINGS_DIR, SETTINGS_FILES };
