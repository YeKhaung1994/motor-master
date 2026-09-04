import { getPool } from '../db/pool.js';
import type { ClassDto } from '../types.js';

/**
 * The class list is data, not a constant: an imported catalogue brings its own
 * categories ("Adventure scooter", "MiniMOTO / trail"), so the filter has to be
 * built from what is actually in the database.
 */
export async function listClasses(): Promise<ClassDto[]> {
  const pool = await getPool();
  const result = await pool.request().query<{ Name: string; ModelCount: number }>(`
    SELECT c.Name, COUNT(b.BikeId) AS ModelCount
    FROM BikeClasses c
    LEFT JOIN Bikes b ON b.ClassId = c.ClassId
    GROUP BY c.Name
    HAVING COUNT(b.BikeId) > 0
    ORDER BY c.Name
  `);

  return result.recordset.map((row) => ({ name: row.Name, modelCount: row.ModelCount }));
}
