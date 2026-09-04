/**
 * Formats a figure in its own currency: `69900` + `THB` -> `฿69,900`.
 * Prices are whole units in every market the catalogue carries.
 */
export function formatPrice(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // An unrecognised currency code should still render something honest.
    return `${currency} ${Math.round(amount).toLocaleString('en-US')}`;
  }
}

export interface PriceLike {
  amount: number | null;
  currency: string | null;
  /** The manufacturer's own wording, qualifiers and all. */
  text: string | null;
  isApproximate: boolean;
}

/**
 * What to show for a price. The source text wins wherever it exists, because a
 * real list price carries meaning a single number cannot — "THB 69,900 / 79,900"
 * is two variants, not a rounding error.
 */
export function displayPrice(
  price: PriceLike | null | undefined,
  fallback = 'Price not published',
): string {
  if (!price) return fallback;
  if (price.text) return price.text;
  if (price.amount !== null) {
    return `${price.isApproximate ? 'about ' : ''}${formatPrice(price.amount, price.currency ?? 'USD')}`;
  }
  return fallback;
}

/** `1234.5` -> `1,234.5`, keeping at most one decimal place. */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

/** A figure the manufacturer does not publish renders as an em dash, never a 0. */
export function formatFigure(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : formatNumber(value);
}

/** The copy rule for a bike's supporting line: `Yamaha · Naked`. */
export function formatMeta(...parts: Array<string | undefined | null>): string {
  return parts.filter(Boolean).join(' · ');
}
