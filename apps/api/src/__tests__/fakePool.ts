export interface RecordedQuery {
  sql: string;
  values: unknown[];
}

/** Rows the fake pool should return, chosen by a substring of the query. */
export type ResultMap = Array<{ match: string; rows: unknown[] }>;

export interface FakePool {
  queries: RecordedQuery[];
  results: ResultMap;
  /** Set to make the next query reject, standing in for a dropped connection. */
  failWith: Error | null;
  query: (text: string, values?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }>;
  end: () => Promise<void>;
  on: () => void;
}

export function createFakePool(results: ResultMap = []): FakePool {
  const pool: FakePool = {
    queries: [],
    results,
    failWith: null,
    on: () => undefined,
    end: async () => undefined,
    async query(text: string, values: unknown[] = []) {
      pool.queries.push({ sql: text, values });
      if (pool.failWith) throw pool.failWith;

      const hit = pool.results.find((entry) => text.includes(entry.match));
      const rows = hit?.rows ?? [];
      return { rows, rowCount: rows.length };
    },
  };

  return pool;
}

/** The joined row shape every bike query selects, in Postgres' snake_case. */
export function bikeRow(overrides: Record<string, unknown> = {}) {
  return {
    bike_id: 1,
    slug: 'honda-cbr500r',
    name: 'CBR500R',
    brand_name: 'Honda',
    brand_slug: 'honda',
    class_name: 'Sport',
    model_year: 2026,
    price_amount: 235800,
    price_currency: 'THB',
    price_market: 'TH',
    price_text: 'THB 235,800',
    price_is_approximate: false,
    image_url: null,
    variants: null,
    notes: null,
    flags: null,
    source_url: null,
    price_source_url: null,
    data_generated_at: '2026-09-04',
    engine: null,
    displacement_cc: 471,
    bore_stroke_mm: null,
    compression: null,
    power_hp: 47,
    power_kw: null,
    power_rpm: null,
    torque_nm: 43,
    torque_rpm: null,
    fuel_system: null,
    transmission: null,
    clutch: null,
    final_drive: null,
    frame: null,
    front_suspension: null,
    rear_suspension: null,
    brake_front: null,
    brake_rear: null,
    tyre_front: null,
    tyre_rear: null,
    wheelbase_mm: null,
    seat_height_mm: 785,
    ground_clearance_mm: null,
    kerb_weight_kg: 192,
    fuel_tank_l: 17.1,
    fuel_economy: null,
    battery_kwh: null,
    range_km: null,
    charging: null,
    rider_aids: null,
    display: null,
    ...overrides,
  };
}
