import { describe, expect, it } from 'vitest';
import { parsePriceText, slugify } from '../priceText.js';

describe('parsePriceText', () => {
  it('reads a plain price', () => {
    expect(parsePriceText('THB 235,800')).toEqual({
      currency: 'THB',
      amount: 235800,
      isApproximate: false,
      text: 'THB 235,800',
    });
  });

  it('takes the base figure when variants are listed', () => {
    expect(parsePriceText('THB 69,900 / 79,900')?.amount).toBe(69900);
  });

  it('takes the base figure when a second edition follows', () => {
    expect(parsePriceText('THB 88,900; H2C Smart Tourer Ed. THB 99,900')?.amount).toBe(88900);
  });

  it('does not mistake a discount for the price', () => {
    // The lowest number here is the 1,000 price cut, not the bike.
    expect(parsePriceText('USD 6,499 (cut USD 1,000 for 2026)')?.amount).toBe(6499);
  });

  it('marks an approximate price and still reads the base of a range', () => {
    const parsed = parsePriceText('THB ~55,000-65,000 by variant');
    expect(parsed?.amount).toBe(55000);
    expect(parsed?.isApproximate).toBe(true);
  });

  it('refuses to put a lakh figure in a decimal column', () => {
    const parsed = parsePriceText('INR ~2.1 lakh ex-showroom');
    expect(parsed?.currency).toBe('INR');
    expect(parsed?.amount).toBeNull();
    expect(parsed?.text).toBe('INR ~2.1 lakh ex-showroom');
  });

  it('returns null for a missing price', () => {
    expect(parsePriceText(null)).toBeNull();
    expect(parsePriceText('  ')).toBeNull();
  });
});

describe('slugify', () => {
  it('builds a url-safe slug from brand and model', () => {
    expect(slugify('Honda', 'CBR1000RR-R Fireblade SP')).toBe('honda-cbr1000rr-r-fireblade-sp');
    expect(slugify('Honda', 'CB350 (Hness/RS)')).toBe('honda-cb350-hness-rs');
    expect(slugify('Honda', 'Trail 125 (CT125 Hunter Cub)')).toBe('honda-trail-125-ct125-hunter-cub');
  });

  it('strips accents', () => {
    expect(slugify('Yamaha', 'Ténéré 700')).toBe('yamaha-tenere-700');
  });
});
