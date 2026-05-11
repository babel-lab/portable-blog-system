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

export async function loadSettings() {
  const result = {};
  for (const [key, file] of SETTINGS_FILES) {
    result[key] = await readJson(file);
  }
  return result;
}

export { PROJECT_ROOT, SETTINGS_DIR, SETTINGS_FILES };
