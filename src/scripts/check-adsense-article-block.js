// Phase 20260611-night-1（N8 第一步）：adsense-article-block.ejs partial 之 render smoke。
//
// 目的：證明新 partial 可被 template 呼叫，且維持 default-safe：
//   - block 缺漏 / 無 slotKey → 空輸出
//   - ads 未啟用 / 無 client / slot id 空 → 空輸出（委派 adsense-slot 之 3-gate）
//   - 全部配齊 → 輸出 <ins class="adsbygoogle lab-ad-slot lab-ad-slot--<slotKey>"> + push script
//
// 不含真實 ca-pub-* / 真實 slot id（全部為明顯之測試 placeholder）。
// 不碰 settings / content / build output / deploy。
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PARTIAL = path.resolve(__dirname, '../views/ads/adsense-article-block.ejs');

// 明顯之測試 placeholder（非真實 AdSense 帳號 / 版位）
const ENABLED_ADS = {
  enabled: true,
  adsenseClient: 'ca-pub-TEST0000000000',
  slots: { articleAd1: 'test-slot-0001' },
};
const DISABLED_ADS = { ...ENABLED_ADS, enabled: false };
const NO_CLIENT_ADS = { enabled: true, adsenseClient: '', slots: { articleAd1: 'test-slot-0001' } };
const EMPTY_SLOT_ADS = { enabled: true, adsenseClient: 'ca-pub-TEST0000000000', slots: { articleAd1: '' } };

async function render(data) {
  return ejs.renderFile(PARTIAL, data, { async: true });
}

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) {
    pass++;
    console.log(`PASS  ${name}`);
  } else {
    fail++;
    console.error(`FAIL  ${name}`);
  }
}

const main = async () => {
  // 1. block=null → 空
  check('1 block=null → empty', (await render({ block: null, ads: ENABLED_ADS })).trim() === '');

  // 2. block={} (無 slotKey) → 空
  check('2 block without slotKey → empty', (await render({ block: {}, ads: ENABLED_ADS })).trim() === '');

  // 3. block.slotKey 非 string → 空
  check('3 block.slotKey non-string → empty', (await render({ block: { slotKey: 123 }, ads: ENABLED_ADS })).trim() === '');

  // 4. 有 slotKey 但 ads.enabled=false → 空（3-gate）
  check('4 ads disabled → empty', (await render({ block: { slotKey: 'articleAd1' }, ads: DISABLED_ADS })).trim() === '');

  // 5. 有 slotKey 但無 client → 空
  check('5 no adsenseClient → empty', (await render({ block: { slotKey: 'articleAd1' }, ads: NO_CLIENT_ADS })).trim() === '');

  // 6. 有 slotKey 但 slot id 空 → 空
  check('6 empty slot id → empty', (await render({ block: { slotKey: 'articleAd1' }, ads: EMPTY_SLOT_ADS })).trim() === '');

  // 7. ads=null → 空（typeof guard）
  check('7 ads=null → empty', (await render({ block: { slotKey: 'articleAd1' }, ads: null })).trim() === '');

  // 8. 全部配齊 → 渲染
  const out = await render({
    block: { id: 'after-header', anchor: 'afterHeader', slotKey: 'articleAd1', slotId: 'test-slot-0001', client: 'ca-pub-TEST0000000000' },
    ads: ENABLED_ADS,
  });
  check('8 fully configured → renders <ins>', out.includes('<ins') && out.includes('adsbygoogle'));
  check('9 renders slot-specific class', out.includes('lab-ad-slot--articleAd1'));
  check('10 renders data-ad-client placeholder', out.includes('data-ad-client="ca-pub-TEST0000000000"'));
  check('11 renders data-ad-slot placeholder', out.includes('data-ad-slot="test-slot-0001"'));
  check('12 renders push script', out.includes('adsbygoogle = window.adsbygoogle'));

  // 13. slotKey 不在 ads.slots → 空（adsense-slot 之 slot gate）
  check('13 slotKey absent from ads.slots → empty', (await render({ block: { slotKey: 'articleAd9' }, ads: ENABLED_ADS })).trim() === '');

  console.log(`\n${pass} passed / ${fail} failed`);
  if (fail > 0) process.exit(1);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
