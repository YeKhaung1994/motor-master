import sql from 'mssql';
import { getPool } from '../db/pool.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import type { BikeDetailDto, BikeListDto, SearchHitDto } from '../types.js';
import { BIKE_COLUMNS, BIKE_JOINS, toBikeCard, toBikeDetail } from './rowMappers.js';
import type { BikeRow } from './rowMappers.js';

export interface ListBikesOptions {
  brand?: string;
  class?: string[];
  ccMin?: number;
  ccMax?: number;
  priceMin?: number;
  priceMax?: number;
  sort: 'price_asc' | 'price_desc' | 'power_desc' | 'weight_asc';
  page: number;
  pageSize: number;
}

/** Fixed clauses chosen by key — the sort value never reaches SQL as text. */
const ORDER_BY: Record<ListBikesOptions['sort'], string> = {
  price_asc: 'b.PriceUsd ASC, b.Name ASC',
  price_desc: 'b.PriceUsd DESC, b.Name ASC',
  power_desc: 's.PowerHp DESC, b.Name ASC',
  weight_asc: 's.KerbWeightKg ASC, b.Name ASC',
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

  if (options.ccMin !== undefined) {
    request.input('ccMin', sql.Int, options.ccMin);
    where.push('s.DisplacementCc >= @ccMin');
  }

  if (options.ccMax !== undefined) {
    request.input('ccMax', sql.Int, options.ccMax);
    where.push('s.DisplacementCc <= @ccMax');
  }

  if (options.priceMin !== undefined) {
    request.input('priceMin', sql.Decimal(10, 2), options.priceMin);
    where.push('b.PriceUsd >= @priceMin');
  }

  if (options.priceMax !== undefined) {
    request.input('priceMax', sql.Decimal(10, 2), options.priceMax);
    where.push('b.PriceUsd <= @priceMax');
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
  return toBikeDetail(row);
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

  const byId = new Map(result.recordset.map((row) => [row.BikeId, toBikeDetail(row)]));
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
