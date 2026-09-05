import { getPool } from '../db/pool.js';
import type { ClassDto } from '../types.js';

/**
 * The class list is data, not a constant: an imported catalogue brings its own
 * categories, so the filter is built from what is in the database. Scoped to a
 * brand when one is given — offering "Scooter" on the Ducati page is offering a
 * filter that can only return nothing.
 */
export async function listClasses(brandSlug?: string): Promise<ClassDto[]> {
  const pool = getPool();
  const params: unknown[] = [];
  const where = brandSlug ? `WHERE br.slug = $${params.push(brandSlug)}` : '';

  // Driven from bikes, so a class with no models in scope simply is not there.
  const result = await pool.query<{ name: string; model_count: string }>(
    `SELECT c.name, COUNT(*) AS model_count
     FROM bikes b
     INNER JOIN bike_classes c ON c.class_id = b.class_id
     INNER JOIN brands br ON br.brand_id = b.brand_id
     ${where}
     GROUP BY c.name
     ORDER BY c.name`,
    params,
  );

  return result.rows.map((row) => ({ name: row.name, modelCount: Number(row.model_count) }));
}
