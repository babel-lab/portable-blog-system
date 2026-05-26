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
  return result;
}

export { PROJECT_ROOT, SETTINGS_DIR, SETTINGS_FILES };
