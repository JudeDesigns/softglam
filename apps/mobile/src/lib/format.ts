/**
 * Display formatting shared across screens. Prices are in Naira, matching the
 * artists' market (Lagos) and the amounts used throughout the API.
 */

export const CURRENCY_SYMBOL = '₦';

/** 45000 → "₦45,000"; 1234.5 → "₦1,234.50". Manual grouping avoids Intl gaps on older engines. */
export function formatMoney(amount: number): string {
  const negative = amount < 0;
  const abs = Math.abs(amount);
  const hasKobo = Math.round(abs * 100) % 100 !== 0;
  const [whole, frac] = abs.toFixed(hasKobo ? 2 : 0).split('.');
  const grouped = whole!.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${CURRENCY_SYMBOL}${grouped}${frac ? `.${frac}` : ''}`;
}

/** Parses user-typed money like "45,000" or "₦45000.50"; null if not a number. */
export function parseMoney(text: string): number | null {
  const cleaned = text.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Sat 21 Nov · 2:30 pm" in the device's local time. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDay(d)} · ${formatTime(d)}`;
}

export function formatDay(d: Date): string {
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h % 12 === 0 ? 12 : h % 12}:${m.toString().padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}
