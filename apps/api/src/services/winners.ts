import type { BikeDetailDto, WinnersDto } from '../types.js';

/** Highest figure wins. */
const HIGHEST: Array<{ field: string; read: (bike: BikeDetailDto) => number | null }> = [
  { field: 'DisplacementCc', read: (bike) => bike.specs.displacementCc },
  { field: 'PowerHp', read: (bike) => bike.specs.powerHp },
  { field: 'TorqueNm', read: (bike) => bike.specs.torqueNm },
  { field: 'FuelTankL', read: (bike) => bike.specs.fuelTankL },
];

/** Lowest figure wins. */
const LOWEST: Array<{ field: string; read: (bike: BikeDetailDto) => number | null }> = [
  { field: 'KerbWeightKg', read: (bike) => bike.specs.kerbWeightKg },
];

/**
 * Comparing a THB price against a USD one would mark a winner that is not one,
 * so price is only judged when every bike quotes the same currency.
 */
function pricesAreComparable(bikes: BikeDetailDto[]): boolean {
  const currencies = new Set(
    bikes.map((bike) => bike.price?.currency).filter((currency): currency is string => Boolean(currency)),
  );
  return currencies.size === 1;
}

/**
 * Picks the winning bike per field. A field with no comparable values, or a tie
 * for the best value, is left out — nothing is marked rather than marking one
 * of two equal figures.
 */
export function computeWinners(bikes: BikeDetailDto[]): WinnersDto {
  const winners: WinnersDto = {};

  function pick(
    field: string,
    read: (bike: BikeDetailDto) => number | null,
    better: (candidate: number, best: number) => boolean,
  ): void {
    let bestValue: number | null = null;
    let bestId: number | null = null;
    let tied = false;

    for (const bike of bikes) {
      const value = read(bike);
      if (value === null || !Number.isFinite(value)) continue;

      if (bestValue === null || better(value, bestValue)) {
        bestValue = value;
        bestId = bike.id;
        tied = false;
      } else if (value === bestValue) {
        tied = true;
      }
    }

    if (bestId !== null && !tied) winners[field] = bestId;
  }

  for (const { field, read } of HIGHEST) pick(field, read, (a, b) => a > b);
  for (const { field, read } of LOWEST) pick(field, read, (a, b) => a < b);

  if (pricesAreComparable(bikes)) {
    // An approximate figure is not a basis for calling a winner.
    pick(
      'Price',
      (bike) => (bike.price && !bike.price.isApproximate ? bike.price.amount : null),
      (a, b) => a < b,
    );
  }

  return winners;
}
