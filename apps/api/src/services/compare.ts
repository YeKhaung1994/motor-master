import { NotFoundError } from '../middleware/errorHandler.js';
import type { CompareDto } from '../types.js';
import { getBikesByIds } from './bikes.js';
import { computeWinners } from './winners.js';

export async function compareBikes(ids: number[]): Promise<CompareDto> {
  const bikes = await getBikesByIds(ids);
  if (bikes.length === 0) throw new NotFoundError('Bike not found');

  return { bikes, winners: computeWinners(bikes) };
}
