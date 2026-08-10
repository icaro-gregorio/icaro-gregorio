/** Formatting helpers — AUD currency, percentages, and compact figures. */

const AUD = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
});

const AUD_CENTS = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const AUD_COMPACT = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Whole-dollar currency, e.g. "$1,234,567". */
export const formatCurrency = (n) => AUD.format(Number.isFinite(n) ? n : 0);

/** Currency to the cent, e.g. "$1,234.56". */
export const formatCurrencyCents = (n) => AUD_CENTS.format(Number.isFinite(n) ? n : 0);

/** Compact currency for dashboards, e.g. "$1.2M". */
export const formatCompact = (n) => AUD_COMPACT.format(Number.isFinite(n) ? n : 0);

/** Signed currency with an explicit +/−, e.g. "+$4,200" / "−$1,180". */
export function formatSigned(n) {
  const v = Number.isFinite(n) ? n : 0;
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${AUD.format(Math.abs(v))}`;
}

/** Percentage from a decimal, e.g. formatPercent(0.153) -> "15.3%". */
export function formatPercent(decimal, digits = 1) {
  const v = Number.isFinite(decimal) ? decimal : 0;
  return `${(v * 100).toFixed(digits)}%`;
}

/** Signed percentage, e.g. "+15.3%". */
export function formatSignedPercent(decimal, digits = 1) {
  const v = Number.isFinite(decimal) ? decimal : 0;
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${Math.abs(v * 100).toFixed(digits)}%`;
}

/** Whole months -> "Xy Ym", e.g. 27 -> "2y 3m". */
export function formatMonths(months) {
  if (!Number.isFinite(months)) return '—';
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y && m) return `${y}y ${m}m`;
  if (y) return `${y}y`;
  return `${m}m`;
}
