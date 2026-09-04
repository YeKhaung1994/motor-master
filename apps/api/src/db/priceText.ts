/**
 * Manufacturer price lines are qualified prose, not numbers:
 *
 *   "THB 69,900 / 79,900"                       two variants
 *   "THB ~249,000 (SP)"                         approximate, variant-qualified
 *   "THB 88,900; H2C Smart Tourer Ed. THB 99,900"   two editions
 *   "USD 6,499 (cut USD 1,000 for 2026)"        a price and a discount
 *   "INR ~2.1 lakh ex-showroom"                 a different magnitude entirely
 *
 * The raw string is what gets shown; this only extracts something sortable.
 * The figure taken is the FIRST number after the currency code — the base price
 * in every pattern above. Taking the lowest would read the 1,000 discount as the
 * price of the CB500 Hornet.
 */
export interface ParsedPrice {
  currency: string | null;
  /** Base figure for sorting and filtering; null when it cannot be trusted. */
  amount: number | null;
  isApproximate: boolean;
  text: string;
}

/** Indian lakh/crore are a different magnitude; keep the words, drop the number. */
const NON_DECIMAL_MAGNITUDE = /\b(lakh|lakhs|crore|crores)\b/i;

const CURRENCY = /\b([A-Z]{3})\b/;

export function parsePriceText(raw: string | null | undefined): ParsedPrice | null {
  if (!raw) return null;

  const text = raw.trim();
  if (text === '') return null;

  const currencyMatch = CURRENCY.exec(text);
  const currency = currencyMatch?.[1] ?? null;
  const isApproximate = text.includes('~');

  if (NON_DECIMAL_MAGNITUDE.test(text)) {
    return { currency, amount: null, isApproximate, text };
  }

  // Look only after the currency code so a leading qualifier cannot be read as
  // the price.
  const afterCurrency =
    currencyMatch && currency ? text.slice(currencyMatch.index + currency.length) : text;

  const numberMatch = /(\d[\d,]*(?:\.\d+)?)/.exec(afterCurrency);
  if (!numberMatch?.[1]) {
    return { currency, amount: null, isApproximate, text };
  }

  const amount = Number(numberMatch[1].replace(/,/g, ''));

  return {
    currency,
    amount: Number.isFinite(amount) ? amount : null,
    isApproximate,
    text,
  };
}

/** `CBR1000RR-R Fireblade SP` -> `honda-cbr1000rr-r-fireblade-sp` */
export function slugify(...parts: string[]): string {
  return parts
    .join(' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
