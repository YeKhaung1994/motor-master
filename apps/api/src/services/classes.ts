import sql from 'mssql';
import { getPool } from '../db/pool.js';
import type { ClassDto } from '../types.js';

/**
 * The class list is data, not a constant: an imported catalogue brings its own
 * categories ("Adventure scooter", "MiniMOTO / trail"), so the filter has to be
 * built from what is actually in the database.
 *
 * Scoped to a brand when one is given — offering "Scooter" on the Ducati page
 * is offering a filter that can only return nothing.
 */
export async function listClasses(brandSlug?: string): Promise<ClassDto[]> {
  const pool = await getPool();
  const request = pool.request();

  let where = '';
  if (brandSlug) {
    request.input('brand', sql.NVarChar(80), brandSlug);
    where = 'WHERE br.Slug = @brand';
  }

  // Driven from Bikes, so a class with no models in scope simply is not there.
  const result = await request.query<{ Name: string; ModelCount: number }>(`
    SELECT c.Name, COUNT(*) AS ModelCount
    FROM Bikes b
    INNER JOIN BikeClasses c ON c.ClassId = b.ClassId
    INNER JOIN Brands br ON br.BrandId = b.BrandId
    ${where}
    GROUP BY c.Name
    ORDER BY c.Name
  `);

  return result.recordset.map((row) => ({ name: row.Name, modelCount: row.ModelCount }));
}
