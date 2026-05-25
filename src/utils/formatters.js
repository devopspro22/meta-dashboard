// Format currency based on account currency symbol
export function formatCurrency(value, symbol = '₪') {
  if (value === null || value === undefined) return '—';
  return `${symbol}${Math.round(value).toLocaleString('he-IL')}`;
}

// Format a number with thousands separators
export function formatNumber(value) {
  if (value === null || value === undefined) return '—';
  return parseInt(value, 10).toLocaleString('he-IL');
}

// Format a percentage to 2 decimal places
export function formatPercent(value) {
  if (value === null || value === undefined) return '—';
  return `${parseFloat(value).toFixed(2)}%`;
}

// Format ROAS to 2 decimal places with x suffix
export function formatRoas(value) {
  if (value === null || value === undefined) return '—';
  return `${parseFloat(value).toFixed(2)}x`;
}

// Format CPL (cost per lead)
export function formatCpl(spend, leads, symbol = '₪') {
  if (!leads || leads === 0) return '—';
  return formatCurrency(spend / leads, symbol);
}

// Convert date_preset key to human label
export const DATE_PRESETS = [
  { key: 'last_7d', label: '7 ימים' },
  { key: 'last_14d', label: '14 ימים' },
  { key: 'last_30d', label: '30 ימים' },
];
