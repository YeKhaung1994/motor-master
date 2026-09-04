/** `9399` -> `$9,399`. Prices are always whole dollars in the catalogue. */
export function formatPrice(usd: number): string {
  return `$${Math.round(usd).toLocaleString('en-US')}`;
}

/** `1234.5` -> `1,234.5`, keeping at most one decimal place. */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

/** The copy rule for a bike's supporting line: `Yamaha · Naked`. */
export function formatMeta(...parts: Array<string | undefined | null>): string {
  return parts.filter(Boolean).join(' · ');
}
