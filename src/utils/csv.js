/**
 * CSV / delimited-text parsing helpers for bank & credit-card exports.
 *
 * Bank formats vary a lot (delimiters, date orders, signed vs debit/credit
 * columns, currency symbols), so these functions are deliberately forgiving and
 * the UI lets the user correct any wrong guess before importing.
 */

const pad = (n) => String(n).padStart(2, '0');

/** Guess the delimiter from the first non-empty line. */
export function detectDelimiter(text) {
  const line = (text.split(/\r?\n/).find((l) => l.trim() !== '') || '');
  const counts = { ',': 0, ';': 0, '\t': 0, '|': 0 };
  for (const ch of line) if (ch in counts) counts[ch] += 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || ',';
}

/** Parse delimited text into an array of string rows, honoring quoted fields. */
export function parseCSV(text, delimiter) {
  const d = delimiter || detectDelimiter(text);
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === d) {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

/** Parse a monetary string: strips $, thousands separators; handles (parens) and trailing/leading minus. */
export function parseAmount(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim();
  if (!s) return NaN;
  let negative = false;
  if (/^\(.*\)$/.test(s)) { negative = true; s = s.slice(1, -1); }
  if (s.includes('-')) negative = true;
  s = s.replace(/[^0-9.]/g, '');
  if (s === '' || s === '.') return NaN;
  const n = parseFloat(s);
  if (Number.isNaN(n)) return NaN;
  return negative ? -n : n;
}

/**
 * Parse a date string into an ISO `YYYY-MM-DD` string.
 * `order` disambiguates numeric dates: 'dmy' (default, AU/UK), 'mdy' (US), or
 * 'auto' (infer from values, falling back to dmy).
 */
export function parseDate(raw, order = 'dmy') {
  const s = String(raw ?? '').trim();
  if (!s) return null;

  // ISO first.
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) {
    const mon = +m[2];
    const day = +m[3];
    if (mon >= 1 && mon <= 12 && day >= 1 && day <= 31) return `${m[1]}-${pad(mon)}-${pad(day)}`;
  }

  // Numeric d/m/y or m/d/y.
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) {
    const a = +m[1];
    const b = +m[2];
    let y = +m[3];
    if (y < 100) y += 2000;
    let day;
    let mon;
    if (order === 'mdy') { mon = a; day = b; }
    else if (order === 'dmy') { day = a; mon = b; }
    else if (a > 12) { day = a; mon = b; }
    else if (b > 12) { mon = a; day = b; }
    else { day = a; mon = b; }
    if (mon < 1 || mon > 12 || day < 1 || day > 31) return null;
    return `${y}-${pad(mon)}-${pad(day)}`;
  }

  // Fallback: let the engine try (e.g. "12 Aug 2026").
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return null;
}

/** True if a row looks like a header (no cell parses as a date or amount). */
export function looksLikeHeader(row) {
  const hasData = row.some((cell) => parseDate(cell, 'auto') || Number.isFinite(parseAmount(cell)));
  return !hasData;
}

const GUESSES = {
  date: /date|posted|when|processed/i,
  description: /desc|narration|detail|memo|reference|payee|merchant|transaction|particular/i,
  amount: /amount|value|net/i,
  debit: /debit|withdrawal|money.?out|paid.?out|spent/i,
  credit: /credit|deposit|money.?in|paid.?in|received/i,
};

/** Auto-map header names to fields; returns column indices (or -1). */
export function guessColumns(header) {
  const find = (re) => header.findIndex((h) => re.test(h));
  return {
    date: find(GUESSES.date),
    description: find(GUESSES.description),
    amount: find(GUESSES.amount),
    debit: find(GUESSES.debit),
    credit: find(GUESSES.credit),
  };
}
