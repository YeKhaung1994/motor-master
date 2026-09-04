import type { Page } from '@playwright/test';

/**
 * The API is stubbed at the network boundary so these tests exercise the real
 * UI without a database. Every bug these cover was found by hand in a browser;
 * the point is that they cannot come back unnoticed.
 */
const price = (amount: number, text: string) => ({
  amount,
  currency: 'THB',
  market: 'TH',
  text,
  isApproximate: false,
});

export const brands = [
  { id: 1, name: 'Honda', countryCode: 'JP', slug: 'honda', modelCount: 2 },
  { id: 2, name: 'Vespa', countryCode: 'IT', slug: 'vespa', modelCount: 1 },
];

const card = (
  id: number,
  slug: string,
  name: string,
  brand: string,
  klass: string,
  extra: Record<string, unknown> = {},
) => ({
  id,
  slug,
  name,
  brand,
  class: klass,
  cc: 649,
  hp: 94,
  kg: 208,
  price: price(300000, 'THB 300,000'),
  imageUrl: null,
  flags: null,
  dataGeneratedAt: '2026-09-04',
  ...extra,
});

export const bikes = [
  card(1, 'honda-cb650r', 'CB650R', 'Honda', 'Naked'),
  card(2, 'honda-uc3', 'UC3', 'Honda', 'Electric scooter', {
    cc: null,
    hp: null,
    kg: null,
    flags: 'Spec sheet not itemised; price from aggregator',
  }),
  card(3, 'vespa-primavera', 'Primavera', 'Vespa', 'Scooter', { price: null }),
  // Enough filler that the page scrolls; a page that fits the window cannot
  // exercise sticky rails, paging or a button that parks at the footer.
  ...Array.from({ length: 9 }, (_, i) =>
    card(10 + i, `honda-filler-${i}`, `Filler ${i}`, 'Honda', 'Naked'),
  ),
];

const detail = (c: (typeof bikes)[number]) => ({
  ...c,
  brandSlug: c.brand.toLowerCase(),
  modelYear: 2026,
  markets: ['TH'],
  otherPrices: [],
  variants: null,
  notes: null,
  sourceUrl: 'https://example.com/specs',
  priceSourceUrl: null,
  specs: {
    engine: 'Inline-4, liquid-cooled',
    displacementCc: c.cc,
    boreStrokeMm: null,
    compression: null,
    powerHp: c.hp,
    powerKw: null,
    powerRpm: null,
    torqueNm: 63,
    torqueRpm: null,
    fuelSystem: null,
    transmission: '6-speed',
    clutch: null,
    finalDrive: null,
    frame: null,
    frontSuspension: null,
    rearSuspension: null,
    brakeFront: null,
    brakeRear: null,
    tyreFront: null,
    tyreRear: null,
    wheelbaseMm: null,
    seatHeightMm: 810,
    groundClearanceMm: null,
    kerbWeightKg: c.kg,
    fuelTankL: 15.4,
    fuelEconomy: null,
    batteryKwh: null,
    rangeKm: null,
    charging: null,
    riderAids: null,
    display: null,
  },
});

export async function stubApi(page: Page) {
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace('/api/v1', '');
    const json = (body: unknown) => route.fulfill({ json: body });

    if (path === '/brands') return json(brands);

    if (path === '/classes') {
      const brand = url.searchParams.get('brand');
      // Vespa has only scooters; the filter must reflect that.
      if (brand === 'vespa') return json([{ name: 'Scooter', modelCount: 1 }]);
      return json([
        { name: 'Naked', modelCount: 1 },
        { name: 'Electric scooter', modelCount: 1 },
        { name: 'Scooter', modelCount: 1 },
      ]);
    }

    if (path === '/bikes') {
      const brand = url.searchParams.get('brand');
      const classes = url.searchParams.getAll('class');
      let items = bikes;
      if (brand) items = items.filter((b) => b.brand.toLowerCase() === brand);
      if (classes.length) items = items.filter((b) => classes.includes(b.class));
      return json({ items, total: items.length, page: 1, pageSize: 60 });
    }

    if (path.startsWith('/bikes/')) {
      const found = bikes.find((b) => b.slug === path.slice('/bikes/'.length));
      if (!found) return route.fulfill({ status: 404, json: { error: 'Bike not found' } });
      return json(detail(found));
    }

    if (path === '/compare') {
      const ids = (url.searchParams.get('ids') ?? '').split(',').map(Number);
      const picked = ids.map((id) => bikes.find((b) => b.id === id)).filter(Boolean);
      return json({
        bikes: picked.map((b) => detail(b as (typeof bikes)[number])),
        winners: { PowerHp: 1, KerbWeightKg: 2 },
      });
    }

    if (path === '/search') return json([]);

    return json({});
  });

  await page.route('**/bikes/credits.json', (route) => route.fulfill({ json: [] }));
}
