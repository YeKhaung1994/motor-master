import { getPool } from '../db/pool.js';
import type { BrandDto } from '../types.js';

interface BrandRow {
  BrandId: number;
  Name: string;
  CountryCode: string;
  Slug: string;
  ModelCount: number;
}

export async function listBrands(): Promise<BrandDto[]> {
  const pool = await getPool();
  const result = await pool.request().query<BrandRow>(`
    SELECT br.BrandId, br.Name, br.CountryCode, br.Slug,
           COUNT(b.BikeId) AS ModelCount
    FROM Brands br
    LEFT JOIN Bikes b ON b.BrandId = br.BrandId
    GROUP BY br.BrandId, br.Name, br.CountryCode, br.Slug
    ORDER BY br.Name
  `);

  return result.recordset.map((row) => ({
    id: row.BrandId,
    name: row.Name,
    // CHAR(2) comes back space-padded on some collations.
    countryCode: row.CountryCode.trim(),
    slug: row.Slug,
    modelCount: row.ModelCount,
  }));
}
