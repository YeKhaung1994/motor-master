import { getPool } from '../db/pool.js';
import type { BrandDto } from '../types.js';

interface BrandRow {
  brand_id: number;
  name: string;
  country_code: string | null;
  slug: string;
  model_count: string;
}

export async function listBrands(): Promise<BrandDto[]> {
  const pool = getPool();
  const result = await pool.query<BrandRow>(`
    SELECT br.brand_id, br.name, br.country_code, br.slug,
           COUNT(b.bike_id) AS model_count
    FROM brands br
    LEFT JOIN bikes b ON b.brand_id = br.brand_id
    GROUP BY br.brand_id, br.name, br.country_code, br.slug
    ORDER BY br.name
  `);

  return result.rows.map((row) => ({
    id: row.brand_id,
    name: row.name,
    // char(2) comes back space-padded.
    countryCode: row.country_code?.trim() ?? null,
    slug: row.slug,
    // COUNT returns bigint, which the driver hands over as a string.
    modelCount: Number(row.model_count),
  }));
}
