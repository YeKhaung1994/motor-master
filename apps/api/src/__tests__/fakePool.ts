export interface RecordedQuery {
  sql: string;
  inputs: Record<string, unknown>;
}

/** Rows the fake pool should return, chosen by a substring of the query. */
export type ResultMap = Array<{ match: string; rows: unknown[] }>;

export interface FakePool {
  queries: RecordedQuery[];
  results: ResultMap;
  /** Set to make the next query reject, standing in for a dropped connection. */
  failWith: Error | null;
  request: () => unknown;
  close: () => Promise<void>;
  on: () => void;
}

export function createFakePool(results: ResultMap = []): FakePool {
  const pool: FakePool = {
    queries: [],
    results,
    failWith: null,
    on: () => undefined,
    close: async () => undefined,
    request() {
      const inputs: Record<string, unknown> = {};

      const request = {
        input(name: string, typeOrValue: unknown, maybeValue?: unknown) {
          inputs[name] = arguments.length === 3 ? maybeValue : typeOrValue;
          return request;
        },
        async query(sql: string) {
          pool.queries.push({ sql, inputs });
          if (pool.failWith) throw pool.failWith;

          const hit = pool.results.find((entry) => sql.includes(entry.match));
          return { recordset: hit?.rows ?? [] };
        },
        async batch(sql: string) {
          pool.queries.push({ sql, inputs });
          if (pool.failWith) throw pool.failWith;
          return { recordset: [] };
        },
      };

      return request;
    },
  };

  return pool;
}

/** The joined row shape every bike query selects. */
export function bikeRow(overrides: Record<string, unknown> = {}) {
  return {
    BikeId: 1,
    Slug: 'yamaha-mt-07',
    Name: 'MT-07',
    BrandName: 'Yamaha',
    BrandSlug: 'yamaha',
    ClassName: 'Naked',
    ModelYear: 2024,
    PriceUsd: 8599,
    ImageUrl: null,
    Engine: null,
    DisplacementCc: 689,
    PowerHp: 73,
    TorqueNm: 67,
    Transmission: null,
    FrontSuspension: null,
    RearSuspension: null,
    Brakes: null,
    Tyres: null,
    WheelbaseMm: null,
    KerbWeightKg: 184,
    SeatHeightMm: 805,
    FuelTankL: 14,
    RiderAids: null,
    Display: null,
    ...overrides,
  };
}
