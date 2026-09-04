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
          const recordset = hit?.rows ?? [];
          // Detail queries also read markets and other-market prices in one
          // round trip, so a multi-statement query gets multiple recordsets.
          return { recordset, recordsets: [recordset, []] };
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
    Slug: 'honda-cbr500r',
    Name: 'CBR500R',
    BrandName: 'Honda',
    BrandSlug: 'honda',
    ClassName: 'Sport',
    ModelYear: 2024,
    PriceAmount: 235800,
    PriceCurrency: 'THB',
    PriceMarket: 'TH',
    PriceText: 'THB 235,800',
    PriceIsApproximate: false,
    ImageUrl: null,
    Variants: null,
    Notes: null,
    Flags: null,
    SourceUrl: null,
    PriceSourceUrl: null,
    Engine: null,
    DisplacementCc: 471,
    BoreStrokeMm: null,
    Compression: null,
    PowerHp: 47,
    PowerKw: null,
    PowerRpm: null,
    TorqueNm: 43,
    TorqueRpm: null,
    FuelSystem: null,
    Transmission: null,
    Clutch: null,
    FinalDrive: null,
    Frame: null,
    FrontSuspension: null,
    RearSuspension: null,
    BrakeFront: null,
    BrakeRear: null,
    TyreFront: null,
    TyreRear: null,
    WheelbaseMm: null,
    SeatHeightMm: 785,
    GroundClearanceMm: null,
    KerbWeightKg: 192,
    FuelTankL: 17.1,
    FuelEconomy: null,
    BatteryKwh: null,
    RangeKm: null,
    Charging: null,
    RiderAids: null,
    Display: null,
    ...overrides,
  };
}
