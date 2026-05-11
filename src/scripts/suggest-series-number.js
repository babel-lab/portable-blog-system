// Phase 8-g-2-c-b：next series.number suggestion helper（pure function helper）
//
// 設計原則：
//   - 純函式：不讀檔、不寫檔、不 throw、不 process.exit
//   - 不修改 input（posts / numbers）；返回新陣列
//   - 零外部 import
//   - 相同輸入永遠相同輸出
//   - 與 docs/series-schema.md §5（auto-suggest rules）對齊
//   - 不接 CLI（屬未來 8-g-2-c-c）；不寫入 stdout template；不依賴 fs
//     （I/O 包裝屬未來批次；本批 helper 只處理 in-memory posts 陣列）
//
// 三個 export：
//   - collectSeriesNumbers(posts, targetSeriesId)
//       過濾 posts 為 same series（series.id === targetSeriesId）；
//       蒐集合法 number；非數字 / 非整數 / 非正 / NaN / Infinity 記入 ignored
//   - suggestNextSeriesNumber(numbers)
//       依 dedupe 與低位缺號優先；無缺號則 max+1；空集合則 1
//   - suggestSeriesNumberForPosts(posts, targetSeriesId)
//       上述兩函式之組合 wrapper；回傳 suggestedNumber / usedNumbers（dedupe + 升序）/ ignored
//
// posts 元素支援之 frontmatter shape（caller 可混用）：
//   { series: {...} }                     // load-posts entry 之 spread 結果
//   { data: { series: {...} } }           // gray-matter 原始 { data, content }
//   { frontmatter: { series: {...} } }    // 通用 frontmatter wrapper
//
// 已用編號之語意（與 docs/series-schema.md §4 / §5 對齊）：
//   - 不分 draft / ready / published / archived；皆視為「已分配創作編號」
//   - 不受 publishedAt 影響；publishedAt 只決定排序而非編號占用
//   - 重號 dedupe 後計算；不阻擋；caller（未來 8-g-2-c-c）可選擇 stderr 提示重號

function getSeriesObject(post) {
  if (!post || typeof post !== 'object') return null;
  const series = post.series ?? post.data?.series ?? post.frontmatter?.series ?? null;
  if (!series || typeof series !== 'object' || Array.isArray(series)) return null;
  return series;
}

function identifyPostSource(post) {
  if (!post || typeof post !== 'object') return null;
  return post.slug
    ?? post.data?.slug
    ?? post.frontmatter?.slug
    ?? post.id
    ?? post.data?.id
    ?? post.frontmatter?.id
    ?? null;
}

export function collectSeriesNumbers(posts, targetSeriesId) {
  if (!Array.isArray(posts) || typeof targetSeriesId !== 'string' || targetSeriesId === '') {
    return { numbers: [], ignored: [] };
  }
  const numbers = [];
  const ignored = [];
  for (const post of posts) {
    const series = getSeriesObject(post);
    if (!series) continue;
    if (series.id !== targetSeriesId) continue;
    const n = series.number;
    const source = identifyPostSource(post);
    if (typeof n !== 'number') {
      ignored.push({ source, number: n, reason: 'not-number' });
      continue;
    }
    if (!Number.isFinite(n)) {
      ignored.push({ source, number: n, reason: 'not-finite' });
      continue;
    }
    if (!Number.isInteger(n)) {
      ignored.push({ source, number: n, reason: 'not-integer' });
      continue;
    }
    if (n <= 0) {
      ignored.push({ source, number: n, reason: 'not-positive' });
      continue;
    }
    numbers.push(n);
  }
  return { numbers, ignored };
}

export function suggestNextSeriesNumber(numbers) {
  if (!Array.isArray(numbers)) return 1;
  const safe = numbers.filter((n) =>
    typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n) && n > 0,
  );
  const sorted = [...new Set(safe)].sort((a, b) => a - b);
  let i = 1;
  for (const n of sorted) {
    if (n > i) return i;
    if (n === i) i++;
  }
  return i;
}

export function suggestSeriesNumberForPosts(posts, targetSeriesId) {
  const { numbers, ignored } = collectSeriesNumbers(posts, targetSeriesId);
  const usedNumbers = [...new Set(numbers)].sort((a, b) => a - b);
  const suggestedNumber = suggestNextSeriesNumber(usedNumbers);
  return { suggestedNumber, usedNumbers, ignored };
}
