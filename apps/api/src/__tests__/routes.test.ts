import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { bikeRow, createFakePool } from './fakePool.js';
import type { FakePool } from './fakePool.js';

// Hoisted so the module mock below can reach it before the app is imported.
const poolMock = vi.hoisted(() => ({ current: null as unknown }));

// The pool is the only thing standing between the routes and SQL Server.
vi.mock('../db/pool.js', async () => {
  const actual = await vi.importActual('mssql');
  return {
    getPool: async () => poolMock.current,
    getMasterPool: async () => poolMock.current,
    closePool: async () => undefined,
    sql: (actual as { default: unknown }).default,
  };
});

const { createApp } = await import('../app.js');
const app = createApp();

let pool: FakePool;

function usePool(results: Parameters<typeof createFakePool>[0] = []) {
  pool = createFakePool(results);
  poolMock.current = pool;
  return pool;
}

beforeEach(() => {
  usePool();
});

describe('GET /api/v1/health', () => {
  it('reports the database as up when it answers', async () => {
    usePool([{ match: 'SELECT 1 AS ok', rows: [{ ok: 1 }] }]);

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, db: 'up' });
  });

  it('reports the database as down when the query fails', async () => {
    usePool().failWith = new Error('ECONNREFUSED');

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ ok: false, db: 'down' });
  });
});

describe('GET /api/v1/brands', () => {
  it('returns brands with their model count and a trimmed country code', async () => {
    usePool([
      {
        match: 'FROM Brands br',
        rows: [{ BrandId: 4, Name: 'Yamaha', CountryCode: 'JP', Slug: 'yamaha', ModelCount: 2 }],
      },
    ]);

    const response = await request(app).get('/api/v1/brands');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: 4, name: 'Yamaha', countryCode: 'JP', slug: 'yamaha', modelCount: 2 },
    ]);
  });
});

describe('GET /api/v1/bikes', () => {
  it('returns a page of bike cards', async () => {
    usePool([{ match: 'FROM Bikes b', rows: [bikeRow({ Total: 1 })] }]);

    const response = await request(app).get('/api/v1/bikes');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [
        {
          id: 1,
          slug: 'honda-cbr500r',
          name: 'CBR500R',
          brand: 'Honda',
          class: 'Sport',
          cc: 471,
          hp: 47,
          kg: 192,
          price: {
            amount: 235800,
            currency: 'THB',
            market: 'TH',
            text: 'THB 235,800',
            isApproximate: false,
          },
          imageUrl: null,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 24,
    });
  });

  it('passes every filter as a bound parameter, never as SQL text', async () => {
    usePool([{ match: 'FROM Bikes b', rows: [] }]);

    await request(app)
      .get('/api/v1/bikes')
      .query({ brand: 'yamaha', class: ['Naked', 'Sport'], ccMin: 400, ccMax: 700, priceMin: 5000 });

    const query = pool.queries.at(-1);
    expect(query).toBeDefined();
    expect(query!.inputs).toMatchObject({
      brand: 'yamaha',
      class0: 'Naked',
      class1: 'Sport',
      ccMin: 400,
      ccMax: 700,
      priceMin: 5000,
    });
    expect(query!.sql).toContain('c.Name IN (@class0, @class1)');
    expect(query!.sql).not.toContain('Naked');
  });

  it('maps each sort key onto a fixed ORDER BY clause', async () => {
    usePool([{ match: 'FROM Bikes b', rows: [] }]);

    await request(app).get('/api/v1/bikes').query({ sort: 'weight_asc' });

    expect(pool.queries.at(-1)!.sql).toContain('s.KerbWeightKg ASC');
  });

  it('sorts rows with no published figure last, in both directions', async () => {
    usePool([{ match: 'FROM Bikes b', rows: [] }]);

    await request(app).get('/api/v1/bikes').query({ sort: 'price_asc' });
    // An unpublished price must not masquerade as the cheapest bike.
    expect(pool.queries.at(-1)!.sql).toContain(
      'CASE WHEN b.PriceAmount IS NULL THEN 1 ELSE 0 END, b.PriceAmount ASC',
    );

    await request(app).get('/api/v1/bikes').query({ sort: 'price_desc' });
    expect(pool.queries.at(-1)!.sql).toContain(
      'CASE WHEN b.PriceAmount IS NULL THEN 1 ELSE 0 END, b.PriceAmount DESC',
    );
  });

  it('filters by market through the join table', async () => {
    usePool([{ match: 'FROM Bikes b', rows: [] }]);

    await request(app).get('/api/v1/bikes').query({ market: 'th' });

    const query = pool.queries.at(-1)!;
    expect(query.inputs.market).toBe('TH');
    expect(query.sql).toContain('FROM BikeMarkets m');
  });

  it('rejects an unknown sort with 400 and names the field', async () => {
    const response = await request(app).get('/api/v1/bikes').query({ sort: 'fastest' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Those search options are not valid.');
    expect(response.body.details[0].field).toBe('sort');
    expect(pool.queries).toHaveLength(0);
  });

  it('rejects an inverted engine size range', async () => {
    const response = await request(app).get('/api/v1/bikes').query({ ccMin: 900, ccMax: 200 });

    expect(response.status).toBe(400);
    expect(response.body.details[0].message).toBe(
      'The smallest engine size must not be larger than the largest.',
    );
  });

  it('caps the page size so one request cannot ask for everything', async () => {
    const response = await request(app).get('/api/v1/bikes').query({ pageSize: 5000 });

    expect(response.status).toBe(400);
    expect(response.body.details[0].field).toBe('pageSize');
  });
});

describe('GET /api/v1/bikes/:slug', () => {
  it('returns the bike with its full spec sheet', async () => {
    usePool([{ match: 'FROM Bikes b', rows: [bikeRow()] }]);

    const response = await request(app).get('/api/v1/bikes/honda-cbr500r');

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('CBR500R');
    expect(response.body.specs.displacementCc).toBe(471);
    // Columns the catalogue has not filled in yet come back as null, not zero.
    expect(response.body.specs.brakeFront).toBeNull();
    expect(response.body.specs.batteryKwh).toBeNull();
    expect(pool.queries[0]!.inputs.slug).toBe('honda-cbr500r');
  });

  it('returns 404 with a plain message when nothing matches', async () => {
    usePool([{ match: 'FROM Bikes b', rows: [] }]);

    const response = await request(app).get('/api/v1/bikes/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Bike not found' });
  });
});

describe('GET /api/v1/compare', () => {
  const rows = [
    bikeRow({ BikeId: 4, Name: 'CBR500R', PriceAmount: 235800, PowerHp: 47, KerbWeightKg: 192 }),
    bikeRow({
      BikeId: 6,
      Slug: 'honda-cb650r',
      Name: 'CB650R',
      PriceAmount: 339000,
      PriceText: 'THB 339,000',
      DisplacementCc: 649,
      PowerHp: 94,
      TorqueNm: 63,
      KerbWeightKg: 208,
      FuelTankL: 15.4,
    }),
  ];

  it('returns the bikes in the order the ids were given, with winners', async () => {
    usePool([{ match: 'FROM Bikes b', rows }]);

    const response = await request(app).get('/api/v1/compare').query({ ids: '6,4' });

    expect(response.status).toBe(200);
    expect(response.body.bikes.map((bike: { id: number }) => bike.id)).toEqual([6, 4]);
    expect(response.body.winners).toEqual({
      DisplacementCc: 6,
      PowerHp: 6,
      TorqueNm: 6,
      FuelTankL: 4,
      KerbWeightKg: 4,
      Price: 4,
    });
  });

  it('needs at least two bikes', async () => {
    const response = await request(app).get('/api/v1/compare').query({ ids: '4' });

    expect(response.status).toBe(400);
    expect(response.body.details[0].message).toBe('Pick at least two bikes to compare.');
  });

  it('accepts at most three bikes', async () => {
    const response = await request(app).get('/api/v1/compare').query({ ids: '1,2,3,4' });

    expect(response.status).toBe(400);
    expect(response.body.details[0].message).toBe('Compare up to three bikes at a time.');
  });

  it('rejects ids that are not numbers', async () => {
    const response = await request(app).get('/api/v1/compare').query({ ids: '4,dr;op' });

    expect(response.status).toBe(400);
    expect(pool.queries).toHaveLength(0);
  });
});

describe('GET /api/v1/search', () => {
  it('escapes LIKE metacharacters in the search term', async () => {
    usePool([{ match: 'FROM Bikes b', rows: [] }]);

    await request(app).get('/api/v1/search').query({ q: '100%' });

    expect(pool.queries.at(-1)!.inputs.term).toBe('%100[%]%');
  });

  it('needs a search term', async () => {
    const response = await request(app).get('/api/v1/search');

    expect(response.status).toBe(400);
  });
});

describe('error handling', () => {
  it('returns a generic 500 and never leaks SQL', async () => {
    usePool().failWith = new Error("Invalid column name 'PowerHp' in table BikeSpecs");

    const response = await request(app).get('/api/v1/bikes');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Something went wrong' });
    expect(JSON.stringify(response.body)).not.toMatch(/BikeSpecs|PowerHp/);
  });

  it('returns 404 for an unknown route', async () => {
    const response = await request(app).get('/api/v1/nope');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
  });
});
