import { getPool } from '../db/pool.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import type { BikeDetailDto, BikeListDto, MarketPriceDto, SearchHitDto } from '../types.js';
import { BIKE_COLUMNS, BIKE_JOINS, toBikeCard, toBikeDetail } from './rowMappers.js';
import type { BikeRow } from './rowMappers.js';

export interface ListBikesOptions {
  brand?: string;
  class?: string[];
  market?: string;
  ccMin?: number;
  ccMax?: number;
  priceMin?: number;
  priceMax?: number;
  sort: 'price_asc' | 'price_desc' | 'power_desc' | 'weight_asc';
  page: number;
  pageSize: number;
}

/**
 * Fixed clauses chosen by key — the sort value never reaches SQL as text.
 * NULLS LAST because an unpublished price is not the cheapest bike in the
 * catalogue; Postgres would otherwise sort nulls first on DESC.
 */
const ORDER_BY: Record<ListBikesOptions['sort'], string> = {
  price_asc: 'b.price_amount ASC NULLS LAST, b.name ASC',
  price_desc: 'b.price_amount DESC NULLS LAST, b.name ASC',
  power_desc: 's.power_hp DESC NULLS LAST, b.name ASC',
  weight_asc: 's.kerb_weight_kg ASC NULLS LAST, b.name ASC',
};

export async function listBikes(options: ListBikesOptions): Promise<BikeListDto> {
  const pool = getPool();
  const params: unknown[] = [];
  const where: string[] = [];
  const p = (value: unknown) => `$${params.push(value)}`;

  if (options.brand) where.push(`br.slug = ${p(options.brand)}`);

  if (options.class && options.class.length > 0) {
    // One array parameter rather than an IN list built from user input.
    where.push(`c.name = ANY(${p(options.class)}::text[])`);
  }

  if (options.market) {
    where.push(
      `EXISTS (SELECT 1 FROM bike_markets m
               WHERE m.bike_id = b.bike_id AND m.market_code = ${p(options.market.toUpperCase())})`,
    );
  }

  if (options.ccMin !== undefined) where.push(`s.displacement_cc >= ${p(options.ccMin)}`);
  if (options.ccMax !== undefined) where.push(`s.displacement_cc <= ${p(options.ccMax)}`);
  if (options.priceMin !== undefined) where.push(`b.price_amount >= ${p(options.priceMin)}`);
  if (options.priceMax !== undefined) where.push(`b.price_amount <= ${p(options.priceMax)}`);

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const limit = p(options.pageSize);
  const offset = p((options.page - 1) * options.pageSize);

  const result = await pool.query<BikeRow & { total: string }>(
    `SELECT ${BIKE_COLUMNS},
            COUNT(*) OVER () AS total
     ${BIKE_JOINS}
     ${whereClause}
     ORDER BY ${ORDER_BY[options.sort]}
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  return {
    items: result.rows.map(toBikeCard),
    total: Number(result.rows[0]?.total ?? 0),
    page: options.page,
    pageSize: options.pageSize,
  };
}

interface MarketRow {
  bike_id: number;
  market_code: string;
}

interface PriceRow {
  bike_id: number;
  market_code: string;
  currency: string | null;
  amount: number | string | null;
  raw_text: string;
}

/** Markets and other-market prices for a set of bikes, one round trip each. */
async function loadRelations(bikeIds: number[]): Promise<{
  markets: Map<number, string[]>;
  prices: Map<number, MarketPriceDto[]>;
}> {
  const markets = new Map<number, string[]>();
  const prices = new Map<number, MarketPriceDto[]>();
  if (bikeIds.length === 0) return { markets, prices };

  const pool = getPool();
  const [marketRows, priceRows] = await Promise.all([
    pool.query<MarketRow>(
      'SELECT bike_id, market_code FROM bike_markets WHERE bike_id = ANY($1::int[]) ORDER BY market_code',
      [bikeIds],
    ),
    pool.query<PriceRow>(
      `SELECT bike_id, market_code, currency, amount, raw_text
       FROM bike_prices WHERE bike_id = ANY($1::int[]) ORDER BY market_code`,
      [bikeIds],
    ),
  ]);

  for (const row of marketRows.rows) {
    const list = markets.get(row.bike_id) ?? [];
    list.push(row.market_code.trim());
    markets.set(row.bike_id, list);
  }

  for (const row of priceRows.rows) {
    const list = prices.get(row.bike_id) ?? [];
    const amount = row.amount === null ? null : Number(row.amount);
    list.push({
      market: row.market_code.trim(),
      currency: row.currency?.trim() ?? null,
      amount: amount !== null && Number.isFinite(amount) ? amount : null,
      text: row.raw_text,
    });
    prices.set(row.bike_id, list);
  }

  return { markets, prices };
}

export async function getBikeBySlug(slug: string): Promise<BikeDetailDto> {
  const pool = getPool();
  const result = await pool.query<BikeRow>(
    `SELECT ${BIKE_COLUMNS} ${BIKE_JOINS} WHERE b.slug = $1`,
    [slug],
  );

  const row = result.rows[0];
  if (!row) throw new NotFoundError('Bike not found');

  const { markets, prices } = await loadRelations([row.bike_id]);
  return toBikeDetail(row, markets.get(row.bike_id) ?? [], prices.get(row.bike_id) ?? []);
}

export async function getBikesByIds(ids: number[]): Promise<BikeDetailDto[]> {
  const pool = getPool();
  const result = await pool.query<BikeRow>(
    `SELECT ${BIKE_COLUMNS} ${BIKE_JOINS} WHERE b.bike_id = ANY($1::int[])`,
    [ids],
  );

  const { markets, prices } = await loadRelations(result.rows.map((row) => row.bike_id));
  const byId = new Map(
    result.rows.map((row) => [
      row.bike_id,
      toBikeDetail(row, markets.get(row.bike_id) ?? [], prices.get(row.bike_id) ?? []),
    ]),
  );

  // Preserve the order the caller asked for, so columns match the URL.
  return ids.map((id) => byId.get(id)).filter((bike): bike is BikeDetailDto => Boolean(bike));
}

export async function searchBikes(query: string): Promise<SearchHitDto[]> {
  const pool = getPool();
  // ILIKE metacharacters are escaped so a search for `100%` stays literal.
  const term = `%${query.replace(/([%_\\])/g, '\\$1')}%`;
  const result = await pool.query<{ bike_id: number; name: string; brand_name: string; slug: string }>(
    `SELECT b.bike_id, b.name, br.name AS brand_name, b.slug
     FROM bikes b
     INNER JOIN brands br ON br.brand_id = b.brand_id
     WHERE b.name ILIKE $1 ESCAPE '\\' OR br.name ILIKE $1 ESCAPE '\\'
     ORDER BY br.name, b.name
     LIMIT 8`,
    [term],
  );

  return result.rows.map((row) => ({
    id: row.bike_id,
    name: row.name,
    brand: row.brand_name,
    slug: row.slug,
  }));
}
