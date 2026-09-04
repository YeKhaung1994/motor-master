import sql from 'mssql';
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
 * Rows with no published figure sort last in every direction: an unpublished
 * price is not the cheapest bike in the catalogue.
 */
const ORDER_BY: Record<ListBikesOptions['sort'], string> = {
  price_asc: 'CASE WHEN b.PriceAmount IS NULL THEN 1 ELSE 0 END, b.PriceAmount ASC, b.Name ASC',
  price_desc: 'CASE WHEN b.PriceAmount IS NULL THEN 1 ELSE 0 END, b.PriceAmount DESC, b.Name ASC',
  power_desc: 'CASE WHEN s.PowerHp IS NULL THEN 1 ELSE 0 END, s.PowerHp DESC, b.Name ASC',
  weight_asc: 'CASE WHEN s.KerbWeightKg IS NULL THEN 1 ELSE 0 END, s.KerbWeightKg ASC, b.Name ASC',
};

export async function listBikes(options: ListBikesOptions): Promise<BikeListDto> {
  const pool = await getPool();
  const request = pool.request();
  const where: string[] = [];

  if (options.brand) {
    request.input('brand', sql.NVarChar(80), options.brand);
    where.push('br.Slug = @brand');
  }

  if (options.class && options.class.length > 0) {
    // One parameter per class keeps the IN list parameterised.
    const params = options.class.map((className, index) => {
      const name = `class${index}`;
      request.input(name, sql.NVarChar(40), className);
      return `@${name}`;
    });
    where.push(`c.Name IN (${params.join(', ')})`);
  }

  if (options.market) {
    request.input('market', sql.NVarChar(8), options.market.toUpperCase());
    where.push('EXISTS (SELECT 1 FROM BikeMarkets m WHERE m.BikeId = b.BikeId AND m.MarketCode = @market)');
  }

  if (options.ccMin !== undefined) {
    request.input('ccMin', sql.Decimal(7, 1), options.ccMin);
    where.push('s.DisplacementCc >= @ccMin');
  }

  if (options.ccMax !== undefined) {
    request.input('ccMax', sql.Decimal(7, 1), options.ccMax);
    where.push('s.DisplacementCc <= @ccMax');
  }

  if (options.priceMin !== undefined) {
    request.input('priceMin', sql.Decimal(12, 2), options.priceMin);
    where.push('b.PriceAmount >= @priceMin');
  }

  if (options.priceMax !== undefined) {
    request.input('priceMax', sql.Decimal(12, 2), options.priceMax);
    where.push('b.PriceAmount <= @priceMax');
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (options.page - 1) * options.pageSize;

  request.input('offset', sql.Int, offset);
  request.input('pageSize', sql.Int, options.pageSize);

  const result = await request.query<BikeRow & { Total: number }>(`
    SELECT ${BIKE_COLUMNS},
           COUNT(*) OVER () AS Total
    ${BIKE_JOINS}
    ${whereClause}
    ORDER BY ${ORDER_BY[options.sort]}
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
  `);

  const rows = result.recordset;

  return {
    items: rows.map(toBikeCard),
    total: rows[0]?.Total ?? 0,
    page: options.page,
    pageSize: options.pageSize,
  };
}

interface MarketRow {
  BikeId: number;
  MarketCode: string;
}

interface PriceRow {
  BikeId: number;
  MarketCode: string;
  Currency: string | null;
  Amount: number | string | null;
  RawText: string;
}

/** Markets and other-market prices for a set of bikes, in one round trip each. */
async function loadRelations(bikeIds: number[]): Promise<{
  markets: Map<number, string[]>;
  prices: Map<number, MarketPriceDto[]>;
}> {
  const markets = new Map<number, string[]>();
  const prices = new Map<number, MarketPriceDto[]>();
  if (bikeIds.length === 0) return { markets, prices };

  const pool = await getPool();
  const request = pool.request();
  const params = bikeIds.map((id, index) => {
    const name = `rid${index}`;
    request.input(name, sql.Int, id);
    return `@${name}`;
  });
  const inList = params.join(', ');

  const result = await request.query(`
    SELECT BikeId, MarketCode FROM BikeMarkets WHERE BikeId IN (${inList}) ORDER BY MarketCode;
    SELECT BikeId, MarketCode, Currency, Amount, RawText FROM BikePrices WHERE BikeId IN (${inList}) ORDER BY MarketCode;
  `);

  const [marketRows = [], priceRows = []] = result.recordsets as unknown as [
    MarketRow[],
    PriceRow[],
  ];

  for (const row of marketRows) {
    const list = markets.get(row.BikeId) ?? [];
    list.push(row.MarketCode.trim());
    markets.set(row.BikeId, list);
  }

  for (const row of priceRows) {
    const list = prices.get(row.BikeId) ?? [];
    const amount = row.Amount === null ? null : Number(row.Amount);
    list.push({
      market: row.MarketCode.trim(),
      currency: row.Currency?.trim() ?? null,
      amount: amount !== null && Number.isFinite(amount) ? amount : null,
      text: row.RawText,
    });
    prices.set(row.BikeId, list);
  }

  return { markets, prices };
}

export async function getBikeBySlug(slug: string): Promise<BikeDetailDto> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('slug', sql.NVarChar(140), slug)
    .query<BikeRow>(`
      SELECT ${BIKE_COLUMNS}
      ${BIKE_JOINS}
      WHERE b.Slug = @slug
    `);

  const row = result.recordset[0];
  if (!row) throw new NotFoundError('Bike not found');

  const { markets, prices } = await loadRelations([row.BikeId]);
  return toBikeDetail(row, markets.get(row.BikeId) ?? [], prices.get(row.BikeId) ?? []);
}

export async function getBikesByIds(ids: number[]): Promise<BikeDetailDto[]> {
  const pool = await getPool();
  const request = pool.request();

  const params = ids.map((id, index) => {
    const name = `id${index}`;
    request.input(name, sql.Int, id);
    return `@${name}`;
  });

  const result = await request.query<BikeRow>(`
    SELECT ${BIKE_COLUMNS}
    ${BIKE_JOINS}
    WHERE b.BikeId IN (${params.join(', ')})
  `);

  const { markets, prices } = await loadRelations(result.recordset.map((row) => row.BikeId));

  const byId = new Map(
    result.recordset.map((row) => [
      row.BikeId,
      toBikeDetail(row, markets.get(row.BikeId) ?? [], prices.get(row.BikeId) ?? []),
    ]),
  );

  // Preserve the order the caller asked for, so columns match the URL.
  return ids.map((id) => byId.get(id)).filter((bike): bike is BikeDetailDto => Boolean(bike));
}

export async function searchBikes(query: string): Promise<SearchHitDto[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    // LIKE pattern metacharacters are escaped so a search for `100%` is literal.
    .input('term', sql.NVarChar(200), `%${query.replace(/([%_[])/g, '[$1]')}%`)
    .query<{ BikeId: number; Name: string; BrandName: string; Slug: string }>(`
      SELECT TOP (8) b.BikeId, b.Name, br.Name AS BrandName, b.Slug
      FROM Bikes b
      INNER JOIN Brands br ON br.BrandId = b.BrandId
      WHERE b.Name LIKE @term ESCAPE '[' OR br.Name LIKE @term ESCAPE '['
      ORDER BY br.Name, b.Name
    `);

  return result.recordset.map((row) => ({
    id: row.BikeId,
    name: row.Name,
    brand: row.BrandName,
    slug: row.Slug,
  }));
}
