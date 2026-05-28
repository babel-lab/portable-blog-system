// Phase 20260528-pm-2 Admin Write Infra §15.G.4 mitigation A (Option A: patcher)
//   - targeted frontmatter scalar patcher
//   - replaces a top-level inline scalar value in YAML frontmatter while
//     preserving every other byte (inline arrays, nested objects, comments,
//     quoting, indentation) byte-for-byte
//   - returns patched text; never writes to disk; never spawns process
//   - fail-closed on unsafe shapes (block scalar, missing key, duplicate key,
//     nested path, non-string value)
//   - no new npm dep; zero external lib
//
// Caller pattern (pseudo):
//   const r = patchFrontmatter(rawMarkdown, { description: 'new value' });
//   if (!r.ok) return errorResult(r.error);
//   const patched = r.output;
//
// Scope (Phase 4.5e-b prototype):
//   - allowed paths: 'description', 'searchDescription' (matches admin-write-cli ALLOWED_FIELDS)
//   - dot path (e.g. 'seo.description') reserved for future extension → rejected
//   - block scalar (|, >, |-, >-) → rejected (intrusive to patch safely)
//   - missing key / duplicate top-level key → rejected
//
// Return shape:
//   {
//     ok: boolean,
//     changed: boolean,
//     output: string,
//     appliedPaths: string[],
//     skippedPaths: string[],
//     error?: string,
//     warnings?: string[],
//   }

const ALLOWED_TOP_LEVEL_KEYS = new Set(['description', 'searchDescription']);

function isAllowedPath(p) {
  if (typeof p !== 'string' || p === '') return false;
  // Phase 4.5e-b: top-level keys only; reject dot-path nesting.
  if (p.includes('.')) return false;
  return ALLOWED_TOP_LEVEL_KEYS.has(p);
}

function findFrontmatterRange(rawMarkdown) {
  const openMatch = rawMarkdown.match(/^---(\r?\n)/);
  if (!openMatch) {
    return { ok: false, error: 'no-opening-frontmatter-delimiter' };
  }
  const fmStart = openMatch[0].length;
  let pos = fmStart;
  while (pos < rawMarkdown.length) {
    const nextLF = rawMarkdown.indexOf('\n', pos);
    const lineEnd = nextLF < 0 ? rawMarkdown.length : nextLF;
    const rawLine = rawMarkdown.slice(pos, lineEnd);
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    if (line === '---') {
      return { ok: true, fmStart, fmContentEnd: pos };
    }
    if (nextLF < 0) break;
    pos = nextLF + 1;
  }
  return { ok: false, error: 'no-closing-frontmatter-delimiter' };
}

function splitFrontmatterLines(fmContent) {
  const lines = [];
  let pos = 0;
  if (fmContent.length === 0) return lines;
  while (pos < fmContent.length) {
    const nextLF = fmContent.indexOf('\n', pos);
    if (nextLF < 0) {
      lines.push({ start: pos, end: fmContent.length });
      break;
    }
    let lineEnd = nextLF;
    if (lineEnd > pos && fmContent[lineEnd - 1] === '\r') {
      lineEnd = nextLF - 1;
    }
    lines.push({ start: pos, end: lineEnd });
    pos = nextLF + 1;
  }
  return lines;
}

// Decode the bytes after "key:" (no line terminator) into a YAML inline scalar.
// Returns { ok, style: 'double'|'single'|'plain'|'empty', value } on success.
function decodeInlineScalar(restAfterKey) {
  let i = 0;
  while (i < restAfterKey.length && restAfterKey[i] === ' ') i++;
  const s = restAfterKey.slice(i);

  if (s.length === 0) {
    return { ok: true, style: 'empty', value: '' };
  }
  const first = s[0];
  if (first === '|' || first === '>') {
    return { ok: false, error: 'block-scalar-not-supported' };
  }
  if (first === '"') {
    let p = 1;
    let value = '';
    while (p < s.length) {
      const c = s[p];
      if (c === '\\') {
        const n = s[p + 1];
        if (n === undefined) return { ok: false, error: 'unterminated-double-quoted' };
        switch (n) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case 'r': value += '\r'; break;
          case '"': value += '"'; break;
          case '\\': value += '\\'; break;
          case '/': value += '/'; break;
          case '0': value += '\0'; break;
          default:
            return { ok: false, error: 'unsupported-double-quoted-escape' };
        }
        p += 2;
        continue;
      }
      if (c === '"') {
        const trailing = s.slice(p + 1);
        if (trailing !== '' && !/^\s*(#.*)?$/.test(trailing)) {
          return { ok: false, error: 'unexpected-content-after-double-quote' };
        }
        return { ok: true, style: 'double', value };
      }
      value += c;
      p++;
    }
    return { ok: false, error: 'unterminated-double-quoted' };
  }
  if (first === "'") {
    let p = 1;
    let value = '';
    while (p < s.length) {
      const c = s[p];
      if (c === "'") {
        if (s[p + 1] === "'") {
          value += "'";
          p += 2;
          continue;
        }
        const trailing = s.slice(p + 1);
        if (trailing !== '' && !/^\s*(#.*)?$/.test(trailing)) {
          return { ok: false, error: 'unexpected-content-after-single-quote' };
        }
        return { ok: true, style: 'single', value };
      }
      value += c;
      p++;
    }
    return { ok: false, error: 'unterminated-single-quoted' };
  }
  // Plain scalar: disallow special leading chars
  if ('-?:[]{},&*!%@`'.includes(first)) {
    return { ok: false, error: 'plain-scalar-leading-char-not-supported' };
  }
  // Disallow inline comment in plain scalar (whitespace + #)
  if (/(^|\s)#/.test(s)) {
    return { ok: false, error: 'plain-scalar-with-inline-comment-not-supported' };
  }
  const value = s.replace(/\s+$/, '');
  return { ok: true, style: 'plain', value };
}

function doubleQuoteYaml(s) {
  let out = '"';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    const ch = s[i];
    if (ch === '"') out += '\\"';
    else if (ch === '\\') out += '\\\\';
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch === '\t') out += '\\t';
    else if (code < 0x20) out += '\\x' + code.toString(16).padStart(2, '0');
    else out += ch;
  }
  out += '"';
  return out;
}

function singleQuoteYaml(s) {
  return "'" + s.replace(/'/g, "''") + "'";
}

function isPlainScalarSafe(s) {
  if (s === '') return false;
  if ('-?:[]{},&*!%@`"\''.includes(s[0])) return false;
  if (/[\x00-\x1f]/.test(s)) return false;
  if (/:\s/.test(s)) return false;
  if (/:$/.test(s)) return false;
  if (/\s#/.test(s)) return false;
  if (/^\s|\s$/.test(s)) return false;
  return true;
}

// Returns the bytes that follow the "key:" prefix on the replaced line, e.g. ' "new value"'.
function encodeForStyle(newValue, originalStyle) {
  const hasNewline = /[\n\r]/.test(newValue);
  if (originalStyle === 'double') {
    return ' ' + doubleQuoteYaml(newValue);
  }
  if (originalStyle === 'single') {
    if (hasNewline) return ' ' + doubleQuoteYaml(newValue);
    return ' ' + singleQuoteYaml(newValue);
  }
  if (originalStyle === 'plain') {
    if (newValue === '' || !isPlainScalarSafe(newValue)) {
      return ' ' + doubleQuoteYaml(newValue);
    }
    return ' ' + newValue;
  }
  if (originalStyle === 'empty') {
    if (newValue === '') return '';
    return ' ' + doubleQuoteYaml(newValue);
  }
  return ' ' + doubleQuoteYaml(newValue);
}

function patchSingleKey(rawMarkdown, key, newValue) {
  const fm = findFrontmatterRange(rawMarkdown);
  if (!fm.ok) return { ok: false, error: fm.error };

  const fmContent = rawMarkdown.slice(fm.fmStart, fm.fmContentEnd);
  const lines = splitFrontmatterLines(fmContent);

  const keyPrefix = key + ':';
  let matchIdx = -1;
  let matchCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const text = fmContent.slice(lines[i].start, lines[i].end);
    if (text.startsWith(keyPrefix)) {
      const next = text.charAt(keyPrefix.length);
      if (next === '' || next === ' ' || next === '\t') {
        matchIdx = i;
        matchCount++;
      }
    }
  }
  if (matchCount === 0) return { ok: false, error: 'target-key-not-found' };
  if (matchCount > 1) return { ok: false, error: 'target-key-duplicated' };

  const line = lines[matchIdx];
  const lineText = fmContent.slice(line.start, line.end);
  const restAfterKey = lineText.slice(keyPrefix.length);

  const decoded = decodeInlineScalar(restAfterKey);
  if (!decoded.ok) return { ok: false, error: decoded.error };

  if (decoded.value === newValue) {
    return { ok: true, changed: false, output: rawMarkdown };
  }

  const newRest = encodeForStyle(newValue, decoded.style);
  const newLineText = keyPrefix + newRest;

  const before = fmContent.slice(0, line.start);
  const after = fmContent.slice(line.end);
  const newFmContent = before + newLineText + after;
  const newRaw = rawMarkdown.slice(0, fm.fmStart) + newFmContent + rawMarkdown.slice(fm.fmContentEnd);

  return { ok: true, changed: true, output: newRaw };
}

export function patchFrontmatter(rawMarkdown, patchMap, options = {}) {
  // eslint-disable-next-line no-unused-vars
  const _opts = options || {};

  const result = {
    ok: true,
    changed: false,
    output: typeof rawMarkdown === 'string' ? rawMarkdown : '',
    appliedPaths: [],
    skippedPaths: [],
  };

  if (typeof rawMarkdown !== 'string') {
    return { ...result, ok: false, error: 'raw-markdown-must-be-string' };
  }
  if (patchMap === null || typeof patchMap !== 'object' || Array.isArray(patchMap)) {
    return { ...result, ok: false, error: 'patch-map-must-be-object' };
  }

  const entries = Object.keys(patchMap);
  if (entries.length === 0) {
    return result;
  }

  for (const p of entries) {
    if (!isAllowedPath(p)) {
      result.skippedPaths.push(p);
    }
  }
  if (result.skippedPaths.length > 0) {
    return { ...result, ok: false, error: 'path-not-allowed' };
  }

  for (const p of entries) {
    if (typeof patchMap[p] !== 'string') {
      result.skippedPaths.push(p);
      return { ...result, ok: false, error: 'new-value-must-be-string' };
    }
  }

  let current = rawMarkdown;
  let anyChanged = false;
  for (const p of entries) {
    const res = patchSingleKey(current, p, patchMap[p]);
    if (!res.ok) {
      result.skippedPaths.push(p);
      return {
        ...result,
        ok: false,
        error: res.error,
        output: rawMarkdown,
        appliedPaths: [],
      };
    }
    if (res.changed) anyChanged = true;
    current = res.output;
    result.appliedPaths.push(p);
  }
  result.output = current;
  result.changed = anyChanged;
  return result;
}
